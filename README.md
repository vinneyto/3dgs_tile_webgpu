# 3dgs_tile_webgpu

A GPU-driven tiled 3D Gaussian Splatting renderer exposed as a Three.js
[`RenderPipeline`](https://threejs.org/docs/#RenderPipeline) pass. The pass renders multiple transformed Gaussian clouds from one packed store,
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
├── CanonicalGaussianPlyLoader.ts   canonical PLY parsing and activation
├── GaussianCloud.ts                transformable Three.js scene object
├── GaussianOctree.ts               full CPU spatial index and raycasts
├── GaussianLod.ts                  nested per-cell LOD representations
├── lod-packing/                    pluggable static packing strategies
│   ├── GaussianLodPackingStrategy.ts shared strategy contract
│   ├── MaximumLodPackingStrategy.ts  strict full-detail packing
│   ├── RadialLodPackingStrategy.ts   fixed-LOD center-out clipping
│   ├── TieredRadialLodPackingStrategy.ts 60/20/20 radial LOD tiers
│   └── DistanceAwareRadialLodPackingStrategy.ts distance-based radial tiers
├── store-budgeting/                 global Store budget assignment
│   ├── GaussianStoreBudgetStrategy.ts shared strategy contract
│   ├── RemainingCapacityBudgetStrategy.ts default remaining-budget policy
│   └── SourceFractionBudgetStrategy.ts source-relative budget cap
├── OctreeHelper.ts                 local-space octree wireframe helper
├── LodHelper.ts                    color-coded active LOD volumes
├── GaussianLodColorHelper.ts       packed-LOD Gaussian color override
├── GaussianStore.ts                packed multi-cloud buffer ownership
├── GaussianPass.ts                 Three.js PassNode integration
├── createGaussianPass.ts           public pass factory
├── nodes/GaussianContextNodes.ts   projection/raster TSL accessors and slot contracts
├── kernels/                        explicit WGSL strings used by wgslFn
│   ├── projectionHelpers.ts        covariance, SH and tile-count helpers
│   ├── rasterHelpers.ts            Morton and workgroup-load helpers
│   ├── scan.ts                     hierarchical exclusive scan
│   ├── visibility.ts               visible compaction and depth ordering
│   ├── tileContribution.ts         conservative tile/ellipse test
│   ├── intersections.ts            emission and indirect arguments
│   ├── radix.ts                    five-stage subgroup radix
│   ├── tileOffsets.ts              sorted tile range construction
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

The repository also contains a full-screen Vite sandbox in `sandbox/`. The package includes a canonical 3DGS
PLY loader for the default `GaussianStore.load()` path, while custom loaders can still return the same
parser-agnostic `GaussianData` boundary.

## Usage

```ts
import {
  PerspectiveCamera,
  RenderPipeline,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { GaussianData, GaussianStore, gaussianPass } from "3dgs-tile-webgpu";

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

const store = new GaussianStore();
const cloud = store.add(data, { name: "cat" });
store.pack({ limits: device.limits });
scene.add(cloud); // GaussianCloud is an ordinary transformable Object3D

const pass = gaussianPass(renderer, camera, store, {
  depthSortMode: "float32",
  antialiasMode: "compensated",
  radixBackend: "auto",
  intersectionCapacity: 4_000_000,
  background: [0, 0, 0, 0],
  outputDepth: true,
});

const pipeline = new RenderPipeline(renderer);
pipeline.outputNode = pass;

renderer.setAnimationLoop(() => pipeline.render());
```

The store uses the canonical 3DGS PLY loader by default:

```ts
const store = new GaussianStore();
const cat = await store.load("cat.ply");
const dog = await store.load("dog.ply");
store.pack({ limits: device.limits });

cat.position.x = -1;
dog.position.x = 1;
scene.add(cat, dog);
```

`load()` expands to `loader → GaussianOctree → GaussianLod → addLod()`. Both
`load()` and `addLod()` only register clouds and set `store.needsPack`; they do
not select octree cells or rebuild buffers.

`GaussianStore` owns one global Gaussian capacity. During every structural
`pack()`, its budget strategy visits clouds in `(priority, insertion order)` and
assigns each one a slice of the remaining capacity. The default
`RemainingCapacityBudgetStrategy` offers all remaining capacity to the current
cloud. `SourceFractionBudgetStrategy` can instead cap each allocation to a
fraction of that cloud's full source count. Lower priority numbers are packed
first; every cloud defaults to `priority: 0`.

The Store's default packing strategy uses the finest LOD and selects leaf cells
radially from the object-bounds center until that cloud's allocation is full.
`pack({ limits: device.limits })` derives the Gaussian capacity from the actual
device's `maxStorageBufferBindingSize`, `maxBufferSize`, and the highest SH
degree among all registered clouds. At degree 3, the standard 128 MiB binding
limit produces a capacity of 524,288 Gaussians.

```ts
import {
  GaussianLod,
  GaussianOctree,
  GaussianStore,
  RadialLodPackingStrategy,
} from "3dgs-tile-webgpu";

const radialPacking = new RadialLodPackingStrategy({
  center: "bounds-center",
  lodLevel: "finest",
});

const store = new GaussianStore({
  defaultPackingStrategy: radialPacking,
});

const mug = await store.load("mug.ply", {
  lod: {
    levels: [{ retention: 0.2 }, { retention: 0.5 }, { retention: 1 }],
  },
  priority: 0,
});

store.pack({ limits: device.limits });
```

`GaussianLodPackingStrategy` is an interface with a `pack()` method.
`MaximumLodPackingStrategy`, `RadialLodPackingStrategy`,
`TieredRadialLodPackingStrategy`, and
`DistanceAwareRadialLodPackingStrategy` are its built-in implementations.
Built-in and custom strategies must reference leaf cells in their returned
`GaussianLodPacking`. `GaussianLod` stores importance-sorted nested prefixes
only for leaves; internal octree nodes retain their bounds, children and counts
without duplicating every descendant Gaussian index.

The radial strategy walks leaf cells continuously from the focus outwards and packs one
requested LOD for every selected cell. It stops before the first whole cell that
would exceed the allocation; that cell and all farther cells are clipped.
`"finest"` resolves to the last configured LOD level. The tiered strategy first
uses 60% for finest cells, 20% for middle-detail cells, and 20% for coarsest
cells; if the complete finest representation fits, it keeps the whole object at
finest detail.

`DistanceAwareRadialLodPackingStrategy` selects the desired LOD from the
distance between each leaf and a local-space focus such as the camera. Its
`levelDistance` is measured in octree-root half-diagonals: each interval lowers
the desired LOD by one level. Distance reduction applies even when the complete
finest representation fits in memory. If the desired selection exceeds its
allocation, the strategy degrades the farthest cells first and finally clips
the farthest coarsest cells, keeping `maxGaussians` as a strict upper bound.

```ts
const cameraPacking = new DistanceAwareRadialLodPackingStrategy({
  levelDistance: 2,
});

cameraPacking.setCenter(cameraPositionInCloudLocalSpace);
cloud.invalidatePacking();
store.pack({ limits: device.limits });
```

Packing remains an individual cloud characteristic when needed:

```ts
const cloud = store.addLod(lod, {
  priority: -1,
  packingStrategy: new TieredRadialLodPackingStrategy(),
});

// Priority changes only invalidate the current layout.
cloud.packingPriority = 1;
store.pack({ limits: device.limits });
```

The same registration pipeline is available when source data is already loaded:

```ts
const data = await loader.load("mug.ply");
const octree = GaussianOctree.build(data);
const lod = GaussianLod.build(octree, {
  levels: [{ retention: 0.2 }, { retention: 0.5 }, { retention: 1 }],
});
const cloud = store.addLod(lod, {
  packingStrategy: radialPacking,
});
store.pack({ limits: device.limits });
```

Before `pack()`, a newly registered cloud has `gaussianCount === 0` and
`lodPacking === null`. Adding or removing a cloud, or changing a packing
priority, invalidates all current selections. `GaussianPass` refuses to render
an invalidated Store so a potentially large CPU repack never occurs implicitly
inside a frame.

Repeated packing with the same capacity and SH degree reuses stable Gaussian
slots. Allocation is tracked per octree cell rather than with one map entry per
Gaussian. Since cell LODs are nested prefixes, an upgrade keeps the existing
prefix and allocates only its tail, while a downgrade releases only its tail.
Only added slots and opacity of released slots are marked with Three.js update
ranges, so WebGPU uploads the packing delta instead of replacing every attribute
buffer:

```ts
tieredPacking.setCenter(nextLocalCenter);
store.pack({ limits: device.limits });
console.log(store.lastPackStats);
// { fullRebuild: false, reusedSlots, writtenSlots, clearedSlots, ... }
```

A capacity or SH-degree change still requires a full buffer rebuild. Inactive
pool slots have zero opacity and exit the projection kernel before covariance
or spherical-harmonic work.

Optional packed attributes share the same stable slot index as the core Store
buffers. The current selected cell LOD is the first built-in attribute and is
allocated only when explicitly enabled:

```ts
const lodLevelAttribute = store.enablePackedLodLevelAttribute();
store.pack({ limits: device.limits });

console.log(store.attributes.get("lodLevel") === lodLevelAttribute); // true
console.log(lodLevelAttribute.array[packedGaussianIndex]);
```

The `u32` value is filled for newly packed slots and updated for retained slots
when their cell changes LOD. Without `enablePackedLodLevelAttribute()`, the
Store creates and updates no auxiliary attribute buffer.

`GaussianLodColorHelper` connects that attribute to the raster color slot and
mixes the LOD tint with each Gaussian's rendered color. LOD 0, 1 and 2 use a
soft red, amber and green palette by default:

```ts
const lodColors = new GaussianLodColorHelper(pass, {
  tintStrength: 0.45,
});

lodColors.enabled = false; // restore the previous rasterColorNode
lodColors.enabled = true;

store.pack({ limits: device.limits });
lodColors.update(); // only rebuilds the node after a full buffer replacement
```

Incremental LOD repacks keep the same buffer and require no shader rebuild.
The normal projection path still evaluates the cloud's color, including SH
when present. Tinting happens in the rasterizer, where the extra LOD buffer
stays within the WebGPU baseline storage-binding limit.

The sandbox exercises this path continuously. Its cloud uses tiered packing
around a white marker moving as `x = 5 sin(t)`, and calls `pack()` after each
0.5 m displacement. Diagnostics show CPU pack time, repack count,
reused/written/cleared slots, estimated upload bytes, planning versus slot-update
time, and the first ten full-attribute and opacity-only slot ranges.

`GaussianOctree` retains the complete CPU source. `GaussianLodPacking` is only
the compact active cell/level cut (excluding clipped cells) used both to fill the GPU buffers and, through
`GaussianCloud.raycastMode = "rendered"`, to keep raycasts synchronized with the
rendered LOD. Set the mode to `"full"` to raycast the complete source octree.

Both spatial structures have local-space Three.js debug helpers. Attach them as
children of the cloud so they inherit its position, rotation and scale:

```ts
import { LodHelper, OctreeHelper } from "3dgs-tile-webgpu";

const octreeHelper = new OctreeHelper(cloud.lod!.octree, {
  leavesOnly: false,
});
const lodHelper = new LodHelper(cloud.lod!, cloud.lodPacking!, {
  levels: [0, 2],
});

cloud.add(octreeHelper, lodHelper);

// Change the visible color-coded LOD volumes later.
lodHelper.setLevels([1]);
```

`OctreeHelper` draws the complete adaptive cell grid. `LodHelper` creates one
instanced, translucent volume set per active LOD level and can update its compact
packing with `setPacking()`. Call `dispose()` on helpers when they are removed.

A different source format can be injected with `new GaussianStore({ loader })` as long as its loader returns
`GaussianData`.

All clouds share one projection, global depth sort, intersection list and tile rasterizer, so transparent
Gaussians from different objects remain correctly ordered. A successful `pack()` changes
`store.layoutVersion` and rebuilds count-dependent pass stages on the next frame. Transform and visibility changes only
update a small camera-specific object-frame range and do not rebuild the pipeline.

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

## Gaussian node customization

`GaussianPass` exposes projection-domain slots evaluated once per packed
Gaussian and raster-domain slots evaluated for every covered pixel/Gaussian
pair. Read-only context accessors are imported from the package in the same
style as Three.js TSL accessors:

```ts
import { Vector3 } from "three/webgpu";
import { uniform } from "three/tsl";
import {
  gaussianColor,
  gaussianProjectedArea,
  rasterGaussianColor,
  rasterGaussianOpacity,
  rasterPower,
  rasterUV,
} from "3dgs-tile-webgpu";

const tint = uniform(new Vector3(1, 0.8, 0.8));
pass.gaussianColorNode = gaussianColor.mul(tint);
pass.gaussianVisibilityNode = gaussianProjectedArea.greaterThan(0.25);
pass.rasterColorNode = rasterGaussianColor.mul(rasterUV.x);
pass.rasterAlphaNode = rasterGaussianOpacity.mul(rasterPower.mul(1.25).exp());
```

`gaussianObjectId` selects one `GaussianCloud`. `gaussianIndex` is the current
packed `GaussianStore` slot and is not a persistent source ID.

Projection slots are `gaussianPositionLocalNode`,
`gaussianPositionWorldNode`, `gaussianScaleNode`, `gaussianRotationNode`,
`gaussianOpacityNode`, `gaussianColorNode`, and `gaussianVisibilityNode`.
Raster slots are `rasterColorNode`, `rasterAlphaNode`, and
`rasterDiscardNode`.

Replacing a projection root rebuilds only the projection `ComputeNode`;
replacing a raster root rebuilds only the tile-rasterizer `ComputeNode`.
Changing a referenced uniform or updating an existing texture does not rebuild
either stage. `invalidateProjection()`, `invalidateRasterizer()`, and
`pass.needsUpdate = true` are escape hatches for a node whose internal graph was
mutated without replacing its root.

`rasterGaussianCoord` is a whitened ellipse coordinate, so its squared length
is the conic quadratic form and length `1` is the one-sigma contour.
`rasterUV = 0.5 + rasterGaussianCoord / 6`, mapping `-3σ..+3σ` to `0..1` on
each whitened axis. Raster alpha customization is evaluated inside the
footprint emitted by projection. It may reduce that footprint, but expanding
support requires a corresponding projection-domain change; contributions
outside the emitted tile list cannot be recovered in rasterization.

Depth is written in standard perspective-depth convention: `0` at the near plane, `1` at the far plane and
`1` where no Gaussian contributes. The output is the center depth of the first contributing Gaussian in the
front-to-back tile list. Disable it by omitting `outputDepth` to avoid allocating and writing the extra texture.

## `GaussianData` contract

`CanonicalGaussianPlyLoader` handles the common PLY path. A custom SOG/KSplat loader can create normal Three.js
`StorageBufferAttribute` instances and pass them through `GaussianData`. This keeps the storage contract
format-independent and lets the same attributes be read by `wgslFn` kernels, node materials, or other Three.js
code.

| Attribute        | Three.js type                             | Expected values                                                 |
| ---------------- | ----------------------------------------- | --------------------------------------------------------------- |
| `means`          | `StorageBufferAttribute(Float32Array, 4)` | local-space xyz; source w ignored                               |
| `scalesOpacity`  | `StorageBufferAttribute(Float32Array, 4)` | positive linear xyz scale; opacity `[0, 1]` in w                |
| `rotations`      | `StorageBufferAttribute(Float32Array, 4)` | normalized quaternion in `xyzw` order                           |
| `shCoefficients` | `StorageBufferAttribute(Float32Array, 4)` | canonical real-SH RGB in xyz; Gaussian-major, coefficient-minor |

The parser is responsible for applying source-format activations such as `exp(logScale)` and
`sigmoid(opacityLogit)`. SH degrees 0–3 are supported (1, 4, 9, or 16 coefficients per Gaussian).

`GaussianStore` packs clouds sequentially and writes each stable numeric `objectId` into `means.w`, avoiding a
separate per-Gaussian ID buffer. It selects the maximum SH degree of all clouds and zero-pads lower-degree SH
rows to the common coefficient stride. Each `GaussianCloud` supplies its full local-to-world transform through
the normal Three.js scene graph. Translation, rotation and non-uniform scale are included in projected
covariance; source means remain in local space.

Every pass owns its camera-specific object frames (`modelView`, camera position in cloud-local space and
effective visibility). This allows one store to be rendered by multiple cameras without one pass overwriting
another pass's transforms. Effective visibility follows `Object3D.visible`, parent visibility, scene attachment
and camera layers.

## Antialiasing

`antialiasMode: "compensated"` is the default. The projection kernel retains the classic 3DGS `0.3 px²`
low-pass covariance so subpixel splats do not flicker, but scales peak opacity by
`sqrt(det(originalCovariance) / det(filteredCovariance))`. A Gaussian therefore fades as its projected area
shrinks instead of remaining an opaque, approximately 4×4-pixel dot. Splats whose compensated peak alpha is
below `1/255` are culled before intersection emission and sorting.

Use `antialiasMode: "classic"` to reproduce the former fixed-footprint behavior. In the sandbox, append
`?aa=classic` for an immediate comparison.

## Sort modes

Here, "hybrid" means combining two sorting domains: depth is sorted once over visible Gaussians, then emitted
intersections are sorted stably by tile ID. Because emission follows depth order, the tile sort preserves
front-to-back order inside every tile. If `N_visible` Gaussians produce `K` intersections, the work is
proportional to `depthPasses × N_visible + tilePasses × K`, rather than sorting depth `K` times.

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

Each radix pass follows the same five-stage layout: parallel 1024-record histogram, histogram reduction,
global reduced scan, scan-add and stable scatter. A 256-invocation workgroup processes four records per
invocation. With the default `radixBackend: "auto"`, the pass selects the subgroup-accelerated
Brush/FidelityFX-style kernels when `renderer.hasFeature("subgroups")` is true, otherwise it uses portable
workgroup atomics, masks and barriers. Both backends produce the same stable order. `"subgroup"` and
`"workgroup"` can be selected explicitly for testing; forcing `"subgroup"` without the WebGPU feature throws
before pipeline creation. The sandbox accepts `?radix=subgroup` and `?radix=workgroup`.

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
The first `store.count` rows of `projectedMean` are Gaussian results; its private tail stores camera-specific
object frames so projection remains within WebGPU's guaranteed eight storage-buffer bindings. The resources
can be wrapped with Three.js `storage(...)` and passed to another `wgslFn` kernel or node material without
reaching into the WebGPU backend.

## Shader boundary

Projection and rasterization use TSL shells so user node graphs can be inserted
at their semantic hook points. Covariance projection, SH evaluation,
tile/ellipse overlap, Morton mapping, and workgroup uniform loads remain WGSL
helpers. Scan, sorting, compaction, binning, and intersection emission remain
explicit WGSL kernels. Three.js continues to own resource lifetime, binding and
dispatch; node customization adds no dispatch or intermediate storage buffer.

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

Open **Octree / LOD visualization** in the sandbox HUD to toggle the local
octree grid or color the rendered splats by their current packed LOD. The
sandbox uses the packed-attribute helper instead of LOD volume boxes.
Its radial packing focus follows the camera and repacks after meaningful camera
movement; CPU planning and buffer updates remain synchronous for now.
Use `?lodDistance=2` to change the number of octree-root half-diagonals per LOD
step.

Files addressed by URL belong in `sandbox/public/`; the file picker and drag-and-drop do not require copying
the file into the repository. The loader accepts ASCII, binary little-endian, and binary big-endian scalar PLY
vertex data. Matching `lidar_sim`, it performs these boundary conversions:

- `scale_0..2`: `exp(logScale)`;
- `opacity`: `sigmoid(opacityLogit)`;
- `rot_0..3`: canonical PLY `wxyz` to normalized Three.js/renderer `xyzw`;
- `f_dc_*` and channel-major `f_rest_*`: Gaussian-major SH coefficient vectors.

The HUD also reports CPU encoding time, Three.js compute-call count,
requested/emitted intersection counts, capacity overflow, tile-stage rebuilds
and Three.js-tracked GPU memory. It also reports `N_visible`, so the benefit of
moving depth sorting from `K` to the compact visible set can be measured
directly.

Append `?profile=kernels` to enable the heavier profiling mode. It requests GPU
timestamp queries, opens **Kernel timings**, and splits the normally batched
prepare/emit group into separate compute passes. Timestamp rows are available
only when the browser and adapter expose `timestamp-query`; the HUD reports
that limitation explicitly otherwise. Radix stages already require distinct
passes because their direct and indirect dispatch dimensions differ.

The same flag adds an asynchronous readback of emitted splats per tile: max,
mean, median, p95, p99, and counts above 256, 512, 1024 and 2048. It also runs a
profiling-only projection kernel that counts zero-pixel subpixel splats whose
alpha-support AABB is at most one pixel in both dimensions but contains no
pixel center. With subpixel culling enabled this is the number removed during
projection; with culling disabled it is the number of candidates that continue
through the pipeline. Profiling adds a compute pass, timestamp overhead and two
diagnostic readbacks, so its FPS is not the final production-performance number.

The tile profile also reports total and worst-tile raster batches (256 splats
per batch), plus counterfactual dropped-intersection, affected-tile and batch
counts for caps of 2048, 4096 and 8192. To run the corresponding raster-only
experiment, append `&tileCap=2048` (or another positive integer). The cap is
applied only when the raster kernel reads each sorted tile range: intersection
emission and radix sorting remain unchanged, so the GPU timing difference
isolates the long-tail raster cost. The nearest depth-sorted splats are retained.
Omit `tileCap` or use `tileCap=0` for the unchanged renderer.

Subpixel sample culling is enabled by default. During projection, Gaussians
whose alpha-support AABB is at most one pixel in both dimensions are tested
against actual pixel centers. A Gaussian with no sample at or above the
`1/255` alpha cutoff is removed before visible compaction, both radix sorts,
intersection emission and rasterization. Set `?subpixelCull=0` in the sandbox
or pass `{ subpixelSampleCulling: false }` to disable it for A/B timing.

The memory delta is captured after a 30-frame warm-up, making accidental per-frame resource growth visible.
Diagnostic intersection readback runs asynchronously every 1.5 seconds;
`?stats=0` disables that readback outside profiling mode. Append `?debug=0` to
hide the HUD when measuring the undisturbed renderer.
The demo defaults to `dpr=1`; raising it to `dpr=2` quadruples the number of rasterized pixels and is therefore
an explicit quality/performance choice rather than an automatic use of the display pixel ratio.

Canonical 3DGS SH coefficients reconstruct sRGB values. The output is an `rgba16float` storage texture, for
which WebGPU has no hardware sRGB sampling format. `GaussianPass` therefore keeps the physical texture raw and
explicitly decodes the configured `colorSpace` when exposing the pass/getColorNode output to Three.js. Later
passes receive working-linear RGB and `RenderPipeline` performs exactly one display transform. Pass
`colorSpace` explicitly when supplying coefficients trained in a different color space.

## Current scope

- WebGPU backend only; Three.js' WebGL fallback is intentionally rejected.
- The subgroup radix backend uses the optional WebGPU `subgroups` feature; a portable workgroup backend is
  selected automatically when it is unavailable.
- Perspective cameras only.
- Multiple transformed clouds from one packed `GaussianStore` per pass.
- The renderer outputs premultiplied Gaussian accumulation with a configurable background and an optional
  standard perspective-depth texture.
- Input, intermediate, indirect-dispatch, color, and depth resources are represented by public Three.js
  attributes/textures. No backend/device access is required.
