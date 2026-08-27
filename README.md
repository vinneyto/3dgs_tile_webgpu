# 3dgs_tile_webgpu

A GPU-driven tiled 3D Gaussian Splatting renderer exposed as a Three.js
[`RenderPipeline`](https://threejs.org/docs/#RenderPipeline) pass. The pass renders one Gaussian cloud,
returns a texture node, and can be chained with normal Three.js node-based post-processing.

The implementation follows the same stages as the course Metal renderer:

```text
project Gaussians and test tile/ellipse overlap
→ compact visible Gaussians
→ radix-sort N_visible Gaussian IDs by depth
→ emit K intersections in depth order
→ stable radix-sort K intersections by tile ID only
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
│   ├── visibility.ts               visible compaction and depth ordering
│   ├── tileContribution.ts         conservative tile/ellipse test
│   ├── intersections.ts            emission and indirect arguments
│   ├── radix.ts                    five-stage subgroup radix
│   ├── tileOffsets.ts              sorted tile range construction
│   └── rasterization.ts            color and optional depth writes
├── pipeline/
│   ├── TiledGaussianPipeline.ts    stage orchestration
│   ├── AttributePool.ts            Three.js storage-attribute ownership
│   ├── FrameUniforms.ts            camera and cloud transforms
│   ├── ProjectionStage.ts          projection and tile coverage
│   ├── ExclusiveScanStage.ts       reusable hierarchical scan
│   ├── VisibleGaussianStage.ts     compaction and indirect arguments
│   ├── DepthOrderedTileStage.ts    tile counts in depth order
│   ├── IntersectionStage.ts        GPU count, indirect args, emission
│   ├── RadixSorter.ts              stable uvec2 key/value sorting
│   ├── TileOffsetBuilder.ts        per-tile sorted ranges
│   └── TileRasterizer.ts           color/depth compositing
└── demo.ts                         RenderPipeline example
```

The repository also contains a full-screen Vite sandbox in `sandbox/`. Its canonical 3DGS PLY loader is kept
outside the renderer package so the `GaussianData` boundary remains parser-agnostic.

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
  antialiasMode: "compensated",
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

The pass itself and `getColorNode()` expose color-managed working-linear RGB for composition with other
Three.js nodes. `getTextureNode("output")` is the raw encoded `rgba16float` storage texture, which is useful for
custom WGSL consumers that want to perform their own color conversion:

```ts
const colorNode = pass.getColorNode();
const rawColorNode = pass.getTextureNode("output");
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

## Antialiasing

`antialiasMode: "compensated"` is the default. The projection kernel retains the classic 3DGS `0.3 px²`
low-pass covariance so subpixel splats do not flicker, but scales peak opacity by
`sqrt(det(originalCovariance) / det(filteredCovariance))`. A Gaussian therefore fades as its projected area
shrinks instead of remaining an opaque, approximately 4×4-pixel dot. Splats whose compensated peak alpha is
below `1/255` are culled before intersection emission and sorting.

Use `antialiasMode: "classic"` to reproduce the former fixed-footprint behavior. In the sandbox, append
`?aa=classic` for an immediate comparison.

## Sort modes

Both modes use the same hybrid pipeline. Depth is sorted once per visible Gaussian, before intersections are
emitted. Because emission follows that order, the later stable tile-ID sort preserves front-to-back order
inside every tile. If `N_visible` Gaussians produce `K` intersections, the work is proportional to
`depthPasses × N_visible + tilePasses × K`, rather than sorting depth `K` times.

### `float32`

Reference-quality mode. The compact visible list stores:

```text
bitcast<float32 depth> | gaussianId
```

Depth needs eight 4-bit passes over `N_visible`. Emitted intersections are `uvec2(tileId, gaussianId)` and need
only the tile-ID passes required by the current resolution. A 13-bit tile ID therefore means eight passes over
`N_visible` and four passes over `K`.

### `packed16`

Performance mode. The visible-list depth key is quantized between the camera near and far planes:

```text
quantizedDepth16 (stored in u32) | gaussianId
```

It needs four depth passes over `N_visible`, followed by the same tile-only passes over `K`. Both modes use
8-byte intersection records and support the same tile counts. Close Gaussians can quantize to the same depth;
stable sorting preserves their compacted input order as the tie-breaker.

Each radix pass follows the Brush/FidelityFX-style five-stage layout: parallel 1024-record histogram,
histogram reduction, global reduced scan, scan-add and stable scatter. A 256-invocation workgroup processes
four records per invocation. Histogram reduction and scatter use WebGPU subgroup operations while supporting
subgroup sizes from 8 through 64.

Projection and emission share a conservative StopThePop tile-vs-ellipse test. Tiles inside the screen-space
AABB that cannot reach alpha `1/255` are excluded from `K`, reducing both sort and raster work.

## Indirect dispatch and capacity

GPU kernels write visible/intersection count state and persistent
`IndirectStorageBufferAttribute` dispatch arguments:

```text
state:           clamped K | requested K | radix block count | overflow
radix dispatch:  workgroup count xyz
reduce dispatch: workgroup count xyz
linear dispatch: workgroup count xyz
```

`WebGPURenderer.compute(node, indirectAttribute)` maps these attributes to indirect workgroup dispatch without
exposing a command encoder. WebGPU cannot allocate a new buffer from the GPU, so intersection attributes are
created once at
`intersectionCapacity`. If requested `K` exceeds capacity, writes and sorting are safely clamped and
`await pass.readStats()` reports `overflow: true`. `readStats()` is optional diagnostic readback; the render
path itself performs no GPU-to-CPU synchronization.

After the first rendered frame, `pass.getResources()` exposes the Three.js-owned intermediate attributes:
projected means/conics/colors, visible offsets, the depth-sorted Gaussian list, original and
depth-ordered tile counts, intersection offsets, dispatch state, sorted intersection records and tile offsets.
They can be wrapped with Three.js `storage(...)` and passed to another `wgslFn` kernel or node material without
reaching into the WebGPU backend.

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

## PLY sandbox

Run the full-screen PLY viewer with:

```bash
npm install
npm run sandbox
```

The sandbox loads its small `sample.ply` by default and enables the standard Three.js `OrbitControls`. Use
**Open PLY** or drag a canonical 3DGS PLY onto the canvas to inspect another cloud. A URL can also be supplied
explicitly:

```text
http://localhost:5173/?ply=/my-cloud.ply&sort=packed16&dpr=1
```

Files addressed by URL belong in `sandbox/public/`; the file picker and drag-and-drop do not require copying
the file into the repository. The loader accepts ASCII, binary little-endian, and binary big-endian scalar PLY
vertex data. Matching `lidar_sim`, it performs these boundary conversions:

- `scale_0..2`: `exp(logScale)`;
- `opacity`: `sigmoid(opacityLogit)`;
- `rot_0..3`: canonical PLY `wxyz` to normalized Three.js/renderer `xyzw`;
- `f_dc_*` and channel-major `f_rest_*`: Gaussian-major SH coefficient vectors.

The HUD also reports CPU encoding time, Three.js compute-call count, GPU compute/present time (when the adapter
supports timestamp queries), requested/emitted intersection counts, capacity overflow, tile-stage rebuilds and
Three.js-tracked GPU memory. It also reports `N_visible`, so the benefit of moving depth sorting from `K` to
the compact visible set can be measured directly. Expand **Kernel timings** for timestamp-query timings of every
named compute group.
Append `?profile=kernels` to split the normally batched prepare/emit group into separate compute passes. Radix
stages already require distinct passes because their direct and indirect dispatch dimensions differ. Profiling
mode adds a pass boundary and should not be used as the final production-performance number.

The memory delta is captured after a 30-frame warm-up, making accidental per-frame resource growth visible.
Diagnostic intersection readback runs asynchronously every 1.5 seconds; `?stats=0` disables that readback while
retaining GPU timestamps. Append `?debug=0` to disable all diagnostics when measuring the undisturbed renderer.
The demo defaults to `dpr=1`; raising it to `dpr=2` quadruples the number of rasterized pixels and is therefore
an explicit quality/performance choice rather than an automatic use of the display pixel ratio.

Canonical 3DGS SH coefficients reconstruct sRGB values. The output is an `rgba16float` storage texture, for
which WebGPU has no hardware sRGB sampling format. `GaussianPass` therefore keeps the physical texture raw and
explicitly decodes the configured `colorSpace` when exposing the pass/getColorNode output to Three.js. Later
passes receive working-linear RGB and `RenderPipeline` performs exactly one display transform. Pass
`colorSpace` explicitly when supplying coefficients trained in a different color space.

## Current scope

- WebGPU backend only; Three.js' WebGL fallback is intentionally rejected.
- The optimized radix path requires the WebGPU `subgroups` feature.
- Perspective cameras only.
- One cloud per pass. Multiple clouds can use multiple passes and be composed as texture nodes.
- The renderer outputs premultiplied Gaussian accumulation with a configurable background and an optional
  standard perspective-depth texture.
- Input, intermediate, indirect-dispatch, color, and depth resources are represented by public Three.js
  attributes/textures. No backend/device access is required.
