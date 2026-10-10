# 3dgs_tile_webgpu

A tiled 3D Gaussian Splatting pass for Three.js WebGPU. A Rust/WASM backend parses clouds, builds Gaussian mipmap trees, selects a cut for the current view, and supplies packed storage buffers. The renderer does not depend on the backend's selection algorithm.

## Architecture

| Directory                      | Responsibility                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `rust/gaussian-backend`        | Format decoding, mipmap construction, view selection, buffer capacity, source edits and packing. |
| `rust/vendor/spark-lib`        | MIT-licensed Spark decoders and Gaussian merging/tree construction, pinned in `UPSTREAM.md`.     |
| `src/wasm-backend`             | `WasmGaussianBackend`, the transport-neutral TypeScript shell, and committed WASM bindings.      |
| `src/streaming-backend`        | Protocol v2: commands, responses and serial request scheduler.                                   |
| `src/streaming-backend-worker` | Worker endpoint and proxy; ArrayBuffers use transferable ownership.                              |
| `src/renderer`                 | GPU rendering, `GaussianStore`, and synchronous traversal of optional client mipmap snapshots.   |

`GaussianStore` uses `WorkerWasmGaussianBackend` by default. `WasmGaussianBackend` runs the same Rust module on the calling thread for tests or other transports. The old `StreamingGaussianBackend` and `WorkerStreamingGaussianBackend` names remain aliases for these implementations; the old packing strategies are no longer part of the public protocol.

Loads can finish before `GaussianPass` exists. The pass subsequently sends its frontend buffer limits, camera, cloud transforms and viewport dimensions. This handshake starts packing. All clouds share one capacity bounded by `min(maxBufferSize, maxStorageBufferBindingSize)`: the backend checks the largest attribute buffer, the SH buffer's appended active-index list, and the projection buffer's object-transform table. The first populated allocation reserves up to twice the available records; later allocations grow geometrically and are retained on removals. The small object table reserves at least 32 entries when device limits permit. Selection uses the available records, independently of unused allocation headroom. There is no estimate of free GPU memory.

`standard` reserves a camera-independent complete coarse cut of every cloud. The coarse cuts use approximately 1/32 of the shared capacity, with at least one representative per tree when capacity permits. They are selected by spatial feature size, so unbalanced trees do not need a fixed common depth. These records remain pinned while details replace them in the draw cut. Remaining capacity refines branches by projected feature size, radial camera distance and angular importance; lower numeric cloud priorities receive detail capacity first. A preparation halo surrounds the frustum and priority fades continuously outside it, instead of dropping to zero at the edge. Distant offscreen branches eventually return to coarse representatives. `none` skips trees and uses remaining capacity for source Gaussians in source order.

LOD is asymmetric: a branch can refine immediately above a weighted projected size of one pixel, while an already refined branch must stay below `0.7` pixels for `400` ms before coarsening. Re-entering the hysteresis band cancels its pending downgrade. Finest branches collapse first; their ancestors follow at intervals of `100` ms. A backend deadline drives a one-shot client timer, so coarsening completes after the camera stops without polling every frame. Capacity pressure may override retention; the pinned-plus-active union always fits the negotiated GPU budget. History resets when a tree is rebuilt or its mipmap mode changes.

These defaults can be tuned in `BackendConfig.lod`: `downgradeDelayMs`, `downgradeStepMs`, `downgradeThreshold` and `frustumMargin` (default `0.15` in normalized clip coordinates). Setting `downgradeDelayMs: 0` disables temporal retention; `downgradeThreshold: 1` also removes the pixel hysteresis band. These settings affect standard mipmaps only. Coarsening switches complete cuts atomically; it does not blend parent and child Gaussians together.

Rust maintains a stable `(cloud object ID, tree generation, node ID) → GPU slot` map and reverse owners. Leaving the frustum changes the active draw cut, without releasing the resident record. New details use free slots first, then evict unrequested LRU records under pressure. Pinned records and the requested cut cannot be evicted. Allocated capacity includes headroom for additions and does not change with camera movement. Adding within the reservation keeps the same layout and Three.js attributes; growing an unchanged schema preserves resident rows and transfers only changed records. Allocation headroom also increases workspace memory, within device binding limits. Rebuilding a tree increments its generation; source edits in `none` retain source-index identities. Snapshot resolution changes preserve GPU slots.

The WebGPU pass requests compact geometry by default. Each resident record keeps its mean and object ID in 16 bytes of float32 storage, scales as three float16 **logarithms**, opacity as float16, and a Spark `oct101012` quaternion in one uint32: **28 bytes of geometry instead of 48**. SH remains `rgb8e8`, with one uint32 per RGB coefficient; `mipmapLevel`, custom attributes and the active index tail are additional storage. Position precision remains float32 even for large scenes. Decoding uses WGSL `unpack2x16float` and does not require the optional `shader-f16` feature. Direct `GaussianData` callers and backends without `supportsCompactGaussians` retain float32 geometry. CPU picking snapshots always retain float32 geometry.

After the current draw cut is uploaded, `GaussianStore` schedules low-priority `prefetch-cache` commands when the backend advertises `supportsCachePrefetch`. Each command fills at most one upload batch of free slots with previously unseen tree nodes, without changing the active cut, overwriting resident data or evicting anything. Camera and edit commands take priority over queued prefetch work. A bounded node scan and incremental free-slot cursor keep individual commands short. Prefetched records have lower eviction priority than nodes used by a camera. Prefetch stops when the available slots are full or every tree node has been visited. If all trees fit, camera changes after warming transfer only activation indices; choosing the cut still runs asynchronously in the worker. Buffer binding limits, SH width and projection workspace also constrain capacity, so the memory saving does not guarantee a proportional increase in slot count.

Resident and active are separate: packed attribute arrays span `capacity`; `count` and cloud `renderedCount` report the active draw cut. `buffers-replaced.activeSlots` contains a compact `u32` slot list. The client never interprets mipmap relationships. Projection reads only this list, writes compact projected records, and dispatches for the active count; visibility/scan dispatches follow that count. Material `gaussianIndex` and `rasterGaussianIndex` still address source GPU slots. The index list shares the existing SH storage binding. Empty records retain `means.w = -1` and zero opacity as an additional guard.

With partial-update support, layout changes emit `buffers-allocated` containing capacity and attribute schemas. The frontend prepares a replacement without publishing it; `preserveExisting` copies resident rows when the schema is unchanged and capacity grows. Bounded `buffers-patched` messages populate the replacement. Only the final target `buffers-activated` commit publishes the layout: existing clouds remain on their previous detailed cut throughout preparation, and new clouds first appear at the view-dependent target detail. Layout transitions no longer display the pinned coarse cut before details. Growing capacity or changing schemas still requires new GPU resources at publication; routine additions within the reservation reuse the existing pipeline.

Loads that must reuse active slots in an unchanged layout send `deferUntilActivation` patches. The frontend retains those patches until the target activation commits, so streaming cannot overwrite the displayed scene. Camera-driven LOD updates retain their existing fallback behavior. The transport defaults to at most 1 MiB per upload batch and waits for the frontend's next-frame acknowledgement between batches.

`load()` / `loadBuffer()` still resolve once source metadata and the optional picking snapshot are available, including before a pass exists. After attaching the cloud and creating a pass, `await store.whenRenderReady(cloud)` waits for the first committed target cut; `store.isRenderReady(cloud)` reports the same state. This is readiness to render, not a GPU-completion fence. The pass's initial handshake uses the real drawing-buffer size; configure the camera before creating it so the first cut matches the intended view. Optional `CloudLoadOptions.worldMatrix` supplies the initial transform to both the backend's first selection and the Three.js cloud.

`buffers-activated` sends bounded `u32` `removedSlots`/`addedSlots` buffers, ordered with removals first, plus content/layout versions, cloud counts, `commit` and `mipmapPending`. The client prepares a back list incrementally and swaps it only on `commit`. Parents switch to children after their attributes finish uploading. On camera-driven updates under pressure, a resident coarse cut commits before any currently active slot is overwritten; the detailed cut commits afterwards. Model loads defer those replacements until their target cut commits. No transition draws an ancestor together with its descendants. `none` clouds have no tree-based fallback or picking.

`streaming.maxUploadBytesPerUpdate` bounds attribute and activation batches, rounded up to at least one complete slot for attribute patches. Rust copies only the next batch when requested. The worker waits for a client `upload-ack` before producing another batch; the proxy acknowledges after an animation frame, with a 32 ms fallback for hidden tabs. The request remains open through the final activation. Replacement layouts remain unpublished while their CPU attributes are populated; their GPU attributes bind on the first render after publication. GPU allocation/empty-buffer initialization still occur once per layout, and the compact index mirror updates at commit. The serial scheduler coalesces pending camera/transform updates. Network fetches can be aborted; synchronous Rust decoding/tree construction cannot be interrupted while executing.

## Install and render

```bash
npm install github:vinneyto/3dgs_tile_webgpu
```

```ts
import {
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import { GaussianStore, gaussianPass } from "3dgs-tile-webgpu";

const renderer = new WebGPURenderer();
await renderer.init();
const camera = new PerspectiveCamera(50, innerWidth / innerHeight, 0.01, 10000);
const scene = new Scene();
const store = new GaussianStore();
const pass = gaussianPass(renderer, camera, store);
const pipeline = new RenderPipeline(renderer);
pipeline.outputNode = pass;
renderer.setAnimationLoop(() => pipeline.render());

const cloud = await store.load(new URL("./scene.sog", import.meta.url).href, {
  name: "scene",
  mipmaps: { type: "standard", snapshot: { maxLeaves: 25000 } },
  attributes: [
    {
      name: "selection",
      format: "u32",
      elementsPerGaussian: 1,
      source: { kind: "fill", value: "zeros" },
      mipmapAggregation: "max",
    },
  ],
});
scene.add(cloud);
```

Supported formats: PLY (binary, compressed SuperSplat, scalar ASCII), SPLAT, KSPLAT, SPZ, ZIP SOG v1/v2 with PNG/WebP textures, and self-contained RAD. Set `format` explicitly or supply `fileName` for formats without identifying magic, such as SPLAT. URL loads use the URL as the filename hint. A loose SOG `meta.json` plus separate texture URLs and external RAD chunks are not supported by this buffer-loading interface.

`store.loadBuffer(buffer, { fileName: file.name, ...options })` transfers the input buffer to the worker. Do not reuse it after the call. The same ownership rule applies to `writeAttributeRange` data.

## Mipmaps and synchronous picking

Union variants are declared as separate interfaces:

```ts
export interface MipmapSnapshotConfig {
  maxLeaves: number;
}
export interface StandardMipmapConfig {
  type: "standard";
  snapshot?: MipmapSnapshotConfig;
}
export interface NoMipmapConfig {
  type: "none";
}
export type MipmapConfig = StandardMipmapConfig | NoMipmapConfig;
```

`standard` uses Spark's Tiny tree builder. Parent Gaussians merge their children's centers, covariance, opacity, color and SH. Refinement replaces a parent with **all** its children when the pinned-plus-active union fits the shared capacity and weighted projected feature size exceeds one pixel. Thus a limited capacity yields complete coarser representatives instead of a prefix of source splats. The separately exported picking snapshot is independent of GPU residency and the draw cut.

`snapshot` is optional and affects only data exported to the client. It exports a camera-independent, complete cut of the whole tree with at most `maxLeaves` frontier Gaussians, plus their ancestors, conservative subtree bounds and contiguous child ranges. `nodeCount` can exceed `maxLeaves`. Without this option the tree stays in the backend. `none`, empty clouds and clouds with no visible-opacity Gaussians have no snapshot.

The client traverses this hierarchy's AABBs and tests only frontier ellipsoids/disks, synchronously. Internal representative Gaussians are not hit-tested. Picking is approximate at the requested snapshot resolution; it does not identify original source splats. Three.js intersections carry an `index` in the current snapshot. Use `cloud.minRaycastOpacity` (default `0.2`) to filter leaves and `cloud.raycastable = false` to disable picking locally. Clouds without a snapshot return no intersections.

Use `await store.setCloudMipmaps(cloud, { type: "none" })` to drop the tree and clear picking, or switch back to `standard` with an optional snapshot. `await cloud.setPackingPriority(priority)` changes shared capacity allocation. Source edits rebuild merged parents and replace the optional snapshot. Custom `f32` attributes default to `weighted-mean` aggregation; `u32` defaults to `first`. Both support `first`, `min`, `max` and `weighted-mean` (rounded for `u32`). Packed `mipmapLevel` is computed by the backend and cannot be written. All clouds share output schemas; missing custom attributes are zero-filled.

## Protocol v2 migration

- `CloudLoadOptions.packingStrategy`, `lod`, `octree` and `raycastable` are replaced by `mipmaps`.
- `set-cloud-packing` becomes `set-cloud-mipmaps`. The backend has no raycast command or raycastable setting.
- Full-octree/raycast payloads become optional `MipmapSnapshot` on `cloud-loaded` and `mipmap-snapshot-replaced`; `null` clears an existing snapshot. Source and snapshot versions reject stale data.
- Camera/handshake commands include physical `viewportWidth` and `viewportHeight`; capability negotiation uses protocol version `2`.
- `lodLevel` becomes `mipmapLevel`; `lodPending` becomes `mipmapPending`.
- Backend configuration uses `defaultMipmaps` and `streaming.maxUploadBytesPerUpdate`; fixed Gaussian-count and packing-budget strategies are removed.

## Development

The generated WASM is committed, so ordinary JS builds and installs do not require Rust. To change Rust sources, install a current stable Rust toolchain (dependencies require Rust 1.88 or newer), then:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.100 --locked
npm ci
npm run wasm:build
npm run wasm:test
npm run typecheck
npm test
npm run build
npm run sandbox:build
```

The backend-only package entry is `3dgs-tile-webgpu/backend`. Its built WASM is embedded by Vite and can initialize in Node without a GPU or DOM. Tests exercise the committed WASM as well as native Rust.

The sandbox defaults to the new worker backend and requests a snapshot with `maxLeaves: 25000`. `?backend=main` uses the same WASM on the main thread; `?cloud=/scene.sog` loads another cloud (`?ply=` remains a URL alias). Local-file selection accepts all supported formats. Spark's MIT notice is retained in `THIRD_PARTY_NOTICES.md` and `rust/vendor/spark-lib/LICENSE`.

The debug panel reports resident, active and pinned records, cache hits/misses,
LRU evictions, selection/mapping/packing/batch-copy timings, ACK wait, transferred
bytes/batches and GPU layout version. ACK wait measures transport pacing, rather
than GPU execution. Fetch/decode/tree construction remain per-file worker operations.

Run `node scripts/benchmark-backend.mjs --compact --warm` to check compact residency after prefetch, or omit the flags after rebuilding WASM to repeat the
65,536-splat / 20-camera CPU microbenchmark. It includes WASM-to-JS copies and
reports cache counters, attribute bytes, activation bytes and layout replacements;
it excludes browser frame pacing and GPU execution. The residency implementation
measured approximately 26 ms median camera time and one layout replacement on
the development container. Use a browser trace to assess actual frame times.

Viewport resizing keeps tile compute stages and buffers within a power-of-two
reserved tile capacity. Shrinking does not free the reservation; scans, chunk
scheduling and diagnostic readbacks use only the current tile count. Crossing
that capacity grows the tile buffers, while the large chunk task/partial buffers
remain allocated for the lifetime of the Gaussian pipeline. Output GPU textures
still change with resolution. The sandbox's `stages` line shows current/reserved
tiles and the number of tile-stage rebuilds; `pass.getDebugInfo().tileCapacity`
exposes the reservation without a GPU readback.

### Testing model additions in the sandbox

Run `npm run sandbox`. **Open cloud** replaces the scene; **Add cloud** loads a file into the existing Store/Pass and places it beside the primary cloud without moving the camera. Add the same model twice to exercise the reserved capacity, then add more to exercise a staged layout growth. Existing clouds should retain their detail during preparation; the new cloud should appear only with its target cut. Zoom out if the added cloud is outside the current view.
