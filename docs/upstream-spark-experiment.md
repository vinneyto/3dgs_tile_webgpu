# CP-113: upstream Spark WASM experiment

This branch starts at renderer main `6d373876ef9099fb4b2ea14b3a38325bb68ad2f4`. It does not continue the earlier native or Spark experiments.

The opt-in path is:

1. **Unmodified Spark Rust/WASM.** `vendor/spark` contains the complete Rust workspace, manifests, lockfile and MIT license at `f5368253780bed4d863c96b1fdea9dd3d614d131`. `npm run spark:verify` hashes all 41 upstream files. `npm run spark:build` uses upstream SIMD/bulk-memory build flags and verifies the sources before/after compilation. Generated wasm-bindgen files are committed without manual edits.
2. **Explicit TypeScript worker adapter.** `SparkWasmContract.ts` names the actual ExtSplats/tree/traversal results; generated declarations remain the complete export reference. `SparkRuntime` invokes upstream decoding, Tiny LOD construction, tree initialization/traversal and disposal. The Rust `gaussian-backend` is never initialized by this path.
3. **TSL renderer.** `SparkGaussianBackend` rearranges shape words once, preserves upstream non-DC SH words and publishes bounded GPU upload transactions. The renderer decodes Spark's SH exponent/sign representation and expands encoded LOD opacity from 1–2 to 1–5 before the upstream falloff equation. Projection, intersection emission and raster support use the same conservative threshold. Eleven-bit radii retain that expanded support.

The old backend stays available as a comparison and remains the package default. Importing `3dgs-tile-webgpu` does not import the optional Spark entry; use `3dgs-tile-webgpu/spark` explicitly. camera_path enables it only with `?gaussianBackend=spark` while WebGPU is selected.

## Ordering and ownership

Spark's RPC IDs correlate messages; IDs alone do not serialize async handlers. Our existing `SerialRequestScheduler` admits one command at a time and coalesces only queued updates. The backend independently rejects overlapping dispatch. The worker transport is shared with the baseline and acknowledges bounded uploads before the next packet.

`ChunkDecoder.finish(self)` consumes the Rust decoder even on error. The adapter frees only unconsumed decoders and always releases the GsplatArray. Trees are owned by the worker realm and disposed on unload/dispose. Spark pads traversal arrays for textures: only `numSplats` indices are active. A regression checks that padding never draws duplicate root splats.

Messages transfer copies owned by the protocol, never the worker's resident arrays. Snapshot buffers are independent. Changes are staged until the final activation commits. All geometry is resident; camera updates select upstream tree nodes and transfer only bounded index deltas. Epoch-tagged typed arrays avoid per-view Sets and their garbage collection.

## Local inspection

```bash
npm ci
npm run spark:verify
npm run typecheck
npm test
npm run build
npm run sandbox -- --host 127.0.0.1 --port 5174
```

Place a PLY in `sandbox/public` without committing it, then open `http://127.0.0.1:5174/?backend=spark&cloud=/mug.ply`. `backend=spark-main` runs the same upstream module on the calling thread for diagnosis; omitting the flag uses the baseline worker.

The camera_path companion branch documents local linking, a separate local SQLite fixture and its preview URL. The tested file is `mug.ply`, 118,979,779 bytes, 479,751 source Gaussians, SH degree 3; SHA-256 `5c08a0433451f76d8315e87c17bec30989b19b92ae605614514dad72f2f24a4e`.

## Measurements

```bash
node scripts/benchmark-spark.mjs --file /path/to/mug.ply
node scripts/benchmark-spark.mjs --baseline --file /path/to/mug.ply
```

The script uses identical raw-position bounds, perspective camera, 1024² viewport, 20 poses and device binding limits for both backends. It includes worker-side computation and JS/WASM copying; it excludes worker message delivery, frame ACK pacing and GPU execution. Do not interpret this as an FPS comparison. The cuts differ, so image quality is not held numerically identical.

Initial single-run results on the user's Mac:

| Metric                            | baseline resident Rust | upstream Spark adapter |
| --------------------------------- | ---------------------: | ---------------------: |
| Decode/tree/snapshot load         |               1,210 ms |               1,139 ms |
| Initial layout + packing          |                 384 ms |                 104 ms |
| Camera command median             |                 114 ms |                  51 ms |
| Camera command p95                |                 123 ms |                  60 ms |
| Transferred bytes over 20 poses   |              1,743,364 |                229,416 |
| Last active count                 |                399,093 |                336,912 |
| Initial resident count            |                395,237 |                652,218 |
| Camera-driven layout replacements |                      0 |                      0 |
| Repeated identical view upload    |                0 bytes |                0 bytes |

The Spark path trades more residency for less view-dependent packing/transfer. The sandbox rendered the real PLY without WebGPU validation errors, and camera_path playback/return-to-orbit were exercised. Browser FPS observations depend on viewport, camera and display refresh rate; GPU timestamps should be used for controlled renderer comparison.

## Deliberate draft limitations

- All tree nodes must fit resident storage bindings. The adapter validates each device limit and reports an explicit error; it does not truncate or fall back to the old backend. Out-of-core paging/LRU is not implemented.
- Source custom attributes and source edits are rejected. Changing mipmaps requires reloading the cloud; stock resident-Rust LOD retention settings are rejected. Picking uses an approximate, bounded, camera-independent frontier.
- Shape rearrangement and DC conversion happen once per layout. Non-DC SH stays bit-identical, while DC uses the same upstream RGB packing representation. Adding/removing a cloud rebuilds the scene layout rather than preserving slot reservations.
- This uses upstream standard traversal with angular foveation, not the baseline's custom stabilization. Visual LOD behavior therefore differs.
- WASM decode/LOD calls are synchronous and cannot be interrupted mid-call. Fetch cancellation is immediate; committed upload transactions finish. Runtime abort does not pretend to stop Rust already executing.
- Inline workers/embedded WASM increase optional entry size. Splitting cacheable worker/WASM assets is a next optimization, separate from frame time.
- Full Prettier checking also reports pre-existing formatting in five untouched baseline files. Changed sources are formatted; the CI added here verifies source provenance, types, tests and both builds.

These are draft PRs for inspection, not an instruction to merge or deploy.
