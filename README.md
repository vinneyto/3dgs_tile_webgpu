# 3dgs_tile_webgpu

A tiled 3D Gaussian Splatting pass for Three.js WebGPU. The renderer consumes packed storage buffers while a separate streaming backend parses PLY data, builds the octree and LOD, assigns a shared Gaussian budget, and sends complete buffers or incremental changes.

## Architecture

| Directory                      | Responsibility                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/renderer`                 | Three.js pass, GPU buffers, `GaussianStore` client, and synchronous raycasting against a client-owned copy of the full octree.                                                 |
| `src/streaming-backend`        | Transport-neutral commands, command factories, responses, and the `RequestScheduler` and `GaussianBackend` contracts.                                                          |
| `src/streaming-backend-impl`   | `StreamingGaussianBackend`: PLY parsing, source attributes, octree, LOD, packing, budgets, and versioned buffer updates. It does not own WebGPU objects or a worker transport. |
| `src/streaming-backend-worker` | Worker endpoint and client proxy. ArrayBuffers cross the worker boundary with transferable ownership.                                                                          |

`GaussianStore` takes a `RequestScheduler` in its constructor and uses a serial scheduler with the worker backend by default. For existing clients, passing a `GaussianBackend` wraps it in a scheduler. `GaussianPass` takes the renderer-facing `GaussianRenderStore` interface, which requires `setFrontendCapabilities`. A separate `3dgs-tile-webgpu/backend` entry exports the protocol and computation engine without importing the renderer or browser worker.

`GaussianStore` starts the scheduler at construction, creates commands through factories, and submits them to it. The scheduler sends one command at a time and waits for its final response before dispatching the next. A pending command with `latestKey` replaces an older pending command with the same key; camera updates use `camera`, while cloud transforms use a key per cloud. The scheduler does not replace a command already executing. Loading and parsing work before the pass exists: `load()` returns the cloud and its raycast index without waiting for a GPU device. `GaussianPass` later submits `set-frontend-capabilities` with the current camera and cloud transforms, which produces the first render buffers. Later loads use the stored device limits to produce their buffers. Camera and cloud transforms drive subsequent LOD selection inside the backend. When raycasting is enabled, a response includes a transferable snapshot of the **full source octree**, so pointer raycasts remain synchronous and independent of rendered LOD.

`GaussianBackend` accepts a command through `dispatch()` and reports one or more `BackendResponse` values. Each response carries `{ id, type }` for the originating command, cumulative `durationMs`, optional `payload` or `error`, and `isFinal`. A final response closes the request after all streamed buffer patches have been sent. A transport or worker failure outside a request is reported separately through `onFailure()`; the scheduler then rejects active and queued requests. An active fetch may be interrupted through the `abort(commandId)` control method, which does not occupy the serial request queue.

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
const camera = new PerspectiveCamera(
  50,
  innerWidth / innerHeight,
  0.01,
  10_000,
);
const scene = new Scene();
const store = new GaussianStore();
const pass = gaussianPass(renderer, camera, store);
const pipeline = new RenderPipeline(renderer);
pipeline.outputNode = pass;
// The pass supplies GPU capabilities; loads also work before it exists.
renderer.setAnimationLoop(() => pipeline.render());

const cloud = await store.load(new URL("./scene.ply", import.meta.url).href, {
  name: "scene",
  raycastable: true,
  packingStrategy: { type: "tiered-radial" },
  attributes: [
    {
      name: "selection",
      format: "u32",
      elementsPerGaussian: 1,
      source: { kind: "fill", value: "zeros" },
    },
  ],
});
scene.add(cloud);
```

`store.loadBuffer(buffer, options)` transfers a local PLY buffer to the worker. Do not reuse that `ArrayBuffer` after the call. To update an existing attribute, use `store.writeAttributeRange(cloud, "selection", firstGaussian, count, data)`; this transfers `data` too. The backend updates a packed attribute when its source Gaussian is selected for rendering. Use `await cloud.setPackingPriority(priority)` or `await store.setCloudPacking(cloud, strategy)` to change packing; `cloud.packingPriority` reflects the last confirmed value. The store also exposes `setCloudRaycastable`. `cloud.dispose()` unloads its source. Custom attributes are declared when loading; `lodLevel` is generated by the backend. All attributes are packed into scene-wide output buffers, with zeroes for clouds that lack a custom attribute declared by another cloud.

The optional config supplied to `new WorkerStreamingGaussianBackend(config)` specifies the maximum Gaussian count, default packing strategy and per-update upload budget. Device limits are supplied later by the pass. `new StreamingGaussianBackend(config)` runs the same engine without a worker, useful for tests and transport adapters; without a pass, send `set-frontend-capabilities` explicitly to receive render buffers. The browser sandbox at `npm run sandbox` supports `?backend=main` for that direct engine.

`GaussianStore` accepts a `RequestScheduler` or a `GaussianBackend`. Use `StreamingGaussianBackend` for direct computation or `WorkerStreamingGaussianBackend` for worker transport. The worker proxy only transfers commands and responses; queueing and replacement live in `SerialRequestScheduler`.

## Development

```bash
npm run typecheck
npm test
npm run build
npm run sandbox:build
```

The package build also creates `dist/backend.js` and its declarations for the transport-independent backend entry. The sandbox demonstrates URL and local-file loading, pointer raycasts, LOD selection, diagnostics and the Gaussian render pass.
