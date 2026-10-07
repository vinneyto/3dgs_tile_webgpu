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

Loads can finish before `GaussianPass` exists. The pass subsequently sends its frontend buffer limits, camera, cloud transforms and viewport dimensions. This handshake starts packing. The shared Gaussian capacity is derived from `min(maxBufferSize, maxStorageBufferBindingSize)` divided by the largest per-Gaussian attribute width. Lower numeric cloud priorities receive capacity first. There is no separate Gaussian-count limit or estimate of free GPU memory.

The backend emits complete buffers when the layout changes, otherwise versioned partial patches. A request remains open until its final response; every patch batch includes all attributes for its changed slots. `streaming.maxUploadBytesPerUpdate` controls batch size, rounded up to at least one complete slot. The serial scheduler coalesces pending camera/transform updates. An active network fetch can be aborted. Rust computations are synchronous inside the worker and cannot be interrupted by an abort message while they execute.

Rust keeps a stable `(cloud object ID, tree generation, node ID) → GPU slot` map, reverse owners and a free-slot stack. Camera changes select a new tree cut, retain slots for surviving nodes, release departed nodes and assign free slots to newcomers. Only newly assigned or source-modified records are packed and compared; unchanged records are not copied. Rebuilding a tree increments its generation so reused node IDs cannot alias old records. Source edits in `none` retain their source-index identities. Changing snapshot resolution alone does not invalidate GPU slots.

Buffers may contain holes: `count` reports occupied slots, while `capacity` and the arrays cover the entire slot range. Unoccupied records have `means.w = -1` and zero opacity. Projection rejects them before object-buffer reads or material opacity overrides; active records keep a nonnegative object ID. Clients must not truncate arrays or dispatch to the occupied count. A cleared slot and its immediate reuse are sent as one final record. Patches group contiguous changed slots with `firstSlot`, `slotCount` and attribute bytes; a metadata-only update has an empty patch list. Layout changes, including capacity or SH/schema changes, require full buffers, but surviving slots remain stable wherever the new capacity allows. Frontends without partial-update support receive complete buffers.

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

`standard` uses Spark's Tiny tree builder. Parent Gaussians merge their children's centers, covariance, opacity, color and SH. View selection starts at the root and replaces a parent with its visible children when capacity allows and projected size exceeds one pixel. Thus a limited capacity yields coarser representatives instead of a prefix of source splats. `none` skips tree construction and sends source Gaussians in source order up to the remaining shared capacity.

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
