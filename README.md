# 3dgs_tile_webgpu

A GPU-driven tiled 3D Gaussian Splatting renderer exposed as a Three.js
[`RenderPipeline`](https://threejs.org/docs/#RenderPipeline) pass. The pass renders one Gaussian cloud,
returns a texture node, and can be chained with normal TSL post-processing nodes.

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

`K` never has to cross to JavaScript. Kernels whose useful work is proportional to `K` are launched with
`dispatchWorkgroupsIndirect()`; only buffers with a fixed `intersectionCapacity` are allocated on the CPU.

## Usage

```ts
import {
  Object3D,
  PerspectiveCamera,
  RenderPipeline,
  WebGPURenderer,
} from "three/webgpu";
import { GaussianData, gaussianPass } from "3dgs-tile-webgpu";

const renderer = new WebGPURenderer();
await renderer.init();

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

## `GaussianData` contract

Parsing is deliberately not part of this package. A PLY/SOG/KSplat loader can upload its own buffers and pass
them directly to `GaussianData`. Every input buffer must include `GPUBufferUsage.STORAGE`.

| Buffer           | WGSL layout        | Expected values                                                 |
| ---------------- | ------------------ | --------------------------------------------------------------- |
| `means`          | `array<vec4<f32>>` | local-space xyz; w unused                                       |
| `scalesOpacity`  | `array<vec4<f32>>` | positive linear xyz scale; opacity `[0, 1]` in w                |
| `rotations`      | `array<vec4<f32>>` | normalized quaternion in `xyzw` order                           |
| `shCoefficients` | `array<vec4<f32>>` | canonical real-SH RGB in xyz; Gaussian-major, coefficient-minor |

The parser is responsible for applying source-format activations such as `exp(logScale)` and
`sigmoid(opacityLogit)`. SH degrees 0–3 are supported (1, 4, 9, or 16 coefficients per Gaussian).

The empty `Object3D` passed to the pass supplies the cloud's full local-to-world transform. Translation,
rotation, and non-uniform scale are included in projected covariance; the source Gaussian buffers remain in
local space.

## Sort modes

### `float32`

Reference-quality mode. Each intersection uses three parallel `u32` arrays:

```text
tileId | bitcast<float32 depth> | gaussianId
```

The stable radix sort performs eight 4-bit passes over positive float depth, followed by only the tile-ID
passes required by the current render resolution. For a 13-bit tile ID this is 12 passes total.

### `packed16`

Performance mode. The key is:

```text
bits 31…16: tileId
bits 15…0 : depth quantized between camera near and far
```

It always needs eight 4-bit passes and reduces ping-pong record storage from 24 to 16 bytes per intersection.
The mode supports at most 65,535 screen tiles. Close Gaussians can quantize to the same depth; stable emission
order then breaks the tie.

## Indirect dispatch and capacity

After the scan, a one-invocation kernel writes this GPU-owned structure:

```text
clamped K | requested K | radix block count | overflow
padding to a 256-byte uniform/indirect boundary
radix dispatch xyz | K
linear dispatch xyz | K
```

Radix histogram/scatter and sorted-boundary detection consume it through `dispatchWorkgroupsIndirect`. WebGPU
cannot allocate a new buffer from the GPU, so the intersection buffers are created once at
`intersectionCapacity`. If requested `K` exceeds capacity, writes and sorting are safely clamped and
`await pass.readStats()` reports `overflow: true`. `readStats()` is optional diagnostic readback; the render
path itself performs no GPU-to-CPU synchronization.

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
- The renderer outputs premultiplied Gaussian accumulation with a configurable background.
- The package uses Three.js' public pass API and its WebGPU backend/device boundary. Access to the underlying
  `GPUTexture` is necessarily backend-specific until Three.js exposes custom compute-pass textures at a higher
  level.
