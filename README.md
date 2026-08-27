# 3dgs_tile_webgpu

A GPU-driven tiled 3D Gaussian Splatting renderer exposed as a Three.js
[`RenderPipeline`](https://threejs.org/docs/#RenderPipeline) pass. The pass renders one Gaussian cloud,
returns a texture node, and can be chained with normal Three.js node-based post-processing.

The implementation follows the same stages as the course Metal renderer:

```text
project Gaussians
→ exclusive scan of per-Gaussian tile counts
→ GPU writes K and indirect dispatch arguments
→ emit K tile/Gaussian intersections
→ stable LSD radix sort
→ build per-tile ranges
→ front-to-back tile rasterization
```

`K` never has to cross to JavaScript. Compute nodes whose useful work is proportional to `K` are launched with
Three.js `IndirectStorageBufferAttribute`; only attributes with a fixed `intersectionCapacity` are allocated on
the CPU. GPU resources and scheduling use the public Three.js API; the substantial shader algorithms are
explicit WGSL strings wrapped with `wgslFn`, not TSL expression trees. `WebGPURenderer.compute()` performs the
dispatches without direct `GPUDevice` or command-encoder access.

## Project structure

The source tree follows the render pipeline. Each stateful component has one class per file, while small shared
types and GPU binding helpers stay grouped:

```text
src/
├── GaussianData.ts                 external Gaussian buffer contract
├── GaussianPass.ts                 Three.js PassNode integration
├── createGaussianPass.ts           public pass factory
├── kernels/                        explicit WGSL strings used by wgslFn
│   ├── projection.ts               projection, covariance and SH
│   ├── scan.ts                     hierarchical exclusive scan
│   ├── intersections.ts            emission and indirect arguments
│   ├── radix.ts                    radix histogram/scan/scatter
│   ├── tileOffsets.ts              sorted tile range construction
│   └── rasterization.ts            color and optional depth writes
├── pipeline/
│   ├── TiledGaussianPipeline.ts    stage orchestration
│   ├── AttributePool.ts            Three.js storage-attribute ownership
│   ├── FrameUniforms.ts            camera and cloud transforms
│   ├── ProjectionStage.ts          projection and tile coverage
│   ├── ExclusiveScanStage.ts       hierarchical tile-count scan
│   ├── IntersectionStage.ts        GPU count, indirect args, emission
│   ├── RadixSorter.ts              float32 and packed16 sorting
│   ├── TileOffsetBuilder.ts        per-tile sorted ranges
│   └── TileRasterizer.ts           color/depth compositing
└── demo.ts                         RenderPipeline example
```

## Usage

```ts
import {
  Object3D,
  PerspectiveCamera,
  RenderPipeline,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { GaussianData, gaussianPass } from "3dgs-tile-webgpu";

const renderer = new WebGPURenderer();
await renderer.init();

// A loader/parser can create these attributes directly. Each item is vec4<f32>.
const means = new StorageBufferAttribute(meansArray, 4);
const scalesOpacity = new StorageBufferAttribute(scalesOpacityArray, 4);
const rotations = new StorageBufferAttribute(rotationsArray, 4);
const shCoefficients = new StorageBufferAttribute(shArray, 4);

const data = new GaussianData(
  {
    means,
    scalesOpacity,
    rotations,
    shCoefficients,
  },
  { count: gaussianCount, shDegree: 3 },
);

const cloudTransform = new Object3D();
scene.add(cloudTransform); // an empty positioning object; it has no geometry

const pass = gaussianPass(renderer, camera, data, cloudTransform, {
  depthSortMode: "float32",
  intersectionCapacity: 4_000_000,
  background: [0, 0, 0, 0],
  outputDepth: true,
});

const pipeline = new RenderPipeline(renderer);
pipeline.outputNode = pass;

renderer.setAnimationLoop(() => pipeline.render());
```

The `GaussianPass` is itself a `PassNode`, so its result can be used anywhere a texture-producing pass is
accepted:

```ts
const bloomNode = bloom(pass, 0.25);
pipeline.outputNode = pass.add(bloomNode);
```

The named texture outputs are normal Three.js texture nodes:

```ts
const colorNode = pass.getTextureNode("output");
const depthNode = pass.getTextureNode("depth"); // requires outputDepth: true
```

Depth is written in standard perspective-depth convention: `0` at the near plane, `1` at the far plane and
`1` where no Gaussian contributes. The output is the center depth of the first contributing Gaussian in the
front-to-back tile list. Disable it by omitting `outputDepth` to avoid allocating and writing the extra texture.

## `GaussianData` contract

Parsing is deliberately not part of this package. A PLY/SOG/KSplat loader creates normal Three.js
`StorageBufferAttribute` instances and passes them directly to `GaussianData`. This keeps ownership and upload
inside Three.js, and lets the same attributes be read by `wgslFn` kernels, node materials, or other Three.js
code.

| Attribute        | Three.js type                             | Expected values                                                 |
| ---------------- | ----------------------------------------- | --------------------------------------------------------------- |
| `means`          | `StorageBufferAttribute(Float32Array, 4)` | local-space xyz; w unused                                       |
| `scalesOpacity`  | `StorageBufferAttribute(Float32Array, 4)` | positive linear xyz scale; opacity `[0, 1]` in w                |
| `rotations`      | `StorageBufferAttribute(Float32Array, 4)` | normalized quaternion in `xyzw` order                           |
| `shCoefficients` | `StorageBufferAttribute(Float32Array, 4)` | canonical real-SH RGB in xyz; Gaussian-major, coefficient-minor |

The parser is responsible for applying source-format activations such as `exp(logScale)` and
`sigmoid(opacityLogit)`. SH degrees 0–3 are supported (1, 4, 9, or 16 coefficients per Gaussian).

The empty `Object3D` passed to the pass supplies the cloud's full local-to-world transform. Translation,
rotation, and non-uniform scale are included in projected covariance; the source Gaussian buffers remain in
local space.

## Sort modes

### `float32`

Reference-quality mode. Each intersection is one Three.js `uvec4` storage record:

```text
tileId | bitcast<float32 depth> | gaussianId | padding
```

The stable radix sort performs eight 4-bit passes over positive float depth, followed by only the tile-ID
passes required by the current render resolution. For a 13-bit tile ID this is 12 passes total.

### `packed16`

Performance mode. Each intersection is one `uvec2` record whose first component is the key:

```text
bits 31…16: tileId
bits 15…0 : depth quantized between camera near and far
```

It always needs eight 4-bit passes and reduces ping-pong record storage from 32 to 16 bytes per intersection.
The mode supports at most 65,535 screen tiles. Close Gaussians can quantize to the same depth; stable emission
order then breaks the tie.

## Indirect dispatch and capacity

After the scan, a one-invocation WGSL kernel writes GPU-owned count state plus two
`IndirectStorageBufferAttribute` instances:

```text
state:           clamped K | requested K | radix block count | overflow
radix dispatch:  workgroup count xyz
linear dispatch: workgroup count xyz
```

`WebGPURenderer.compute(node, indirectAttribute)` maps these attributes to indirect workgroup dispatch without
exposing a command encoder. WebGPU cannot allocate a new buffer from the GPU, so intersection attributes are
created once at
`intersectionCapacity`. If requested `K` exceeds capacity, writes and sorting are safely clamped and
`await pass.readStats()` reports `overflow: true`. `readStats()` is optional diagnostic readback; the render
path itself performs no GPU-to-CPU synchronization.

After the first rendered frame, `pass.getResources()` exposes the Three.js-owned intermediate attributes:
projected means, conics and colors, tile counts, scan offsets, dispatch state, sorted intersection records and
tile offsets. They can be wrapped with Three.js `storage(...)` and passed to another `wgslFn` kernel or node
material without reaching into the WebGPU backend.

## Shader boundary

All non-trivial kernels live in `src/kernels/` as ordinary WGSL source. `wgslFn` only binds those functions to
Three.js storage attributes, uniforms, storage textures, built-ins and compute nodes. This keeps Three.js in
charge of resource lifetime and pipeline integration while preserving WGSL as the code that is read, reviewed
and debugged. TSL control-flow builders are deliberately not used for projection, scan, sorting, binning or
rasterization.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Append `?sort=packed16` to the demo URL to switch from the default float32 mode.

## Current scope

- WebGPU backend only; Three.js' WebGL fallback is intentionally rejected.
- Perspective cameras only.
- One cloud per pass. Multiple clouds can use multiple passes and be composed as texture nodes.
- The renderer outputs premultiplied Gaussian accumulation with a configurable background and an optional
  standard perspective-depth texture.
- Input, intermediate, indirect-dispatch, color, and depth resources are represented by public Three.js
  attributes/textures. No backend/device access is required.
