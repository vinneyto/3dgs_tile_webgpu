# Per-cloud TSL materials

`GaussianPass` preprocesses every visible cloud before running tiled projection,
depth sorting, tile sorting and rasterization:

```text
cloud-local input buffers -> cloud.material (matrixWorld uniform)
                         -> dense world-space buffer at cloud output offset
all accumulated records  -> projection -> sorting -> rasterization
```

Each `GaussianCloud` has a default `GaussianCloudMaterial`. Its expressions leave
source attributes unchanged and apply `matrixWorld` to the mean and covariance.
All clouds use the same default expressions, with independent compute nodes,
local input buffers, uniforms and output ranges. A material can also be shared.
The pass owns GPU resources; assigning a material does not transfer ownership of
its uniforms or external textures/buffers.

```ts
import {
  GaussianCloudMaterial,
  gaussianColor,
  gaussianPositionLocal,
  gaussianOpacity,
} from "3dgs-tile-webgpu";
import { uniform, vec3 } from "three/tsl";
import { Vector3 } from "three/webgpu";

const tint = uniform(new Vector3(1, 0.5, 0.25));
const material = new GaussianCloudMaterial();
material.positionLocalNode = gaussianPositionLocal.add(vec3(0, 1, 0));
material.colorNode = gaussianColor.mul(tint);
material.opacityNode = gaussianOpacity.mul(0.7);
cloud.material = material;
```

Use `uniform(new Vector3(1, 0.5, 0.25))` for an animated tint (import `Vector3`
from `three/webgpu`). Change its `.value` without recompiling. With
`redrawStrategy: "auto"` or `"never"`, call `pass.invalidate()` after changing
custom uniform values. Replacing the material or setting
`material.needsUpdate = true` after editing its graph triggers a rebuild of that
cloud's compute on its next draw; auto redraw observes material/version changes.
With `"never"`, explicitly invalidate the pass for either change.

## Material evaluation order

1. Decode local position, scale, quaternion and opacity from cloud-local buffers.
2. Evaluate `positionLocalNode`, then the pass-wide `gaussianPositionLocalNode`.
3. Apply the cloud's `matrixWorld` uniform; evaluate `positionWorldNode`, then
   the pass-wide `gaussianPositionWorldNode`.
4. Evaluate `scaleNode` and `rotationNode`, followed by their pass-wide overrides.
5. Evaluate material `opacityNode`; evaluate SH in the cloud-local viewing
   direction, then material `colorNode`.
6. Write world mean, full symmetric world covariance, opacity and evaluated RGB
   into the cloud's dense output range.

The covariance uses `A * covarianceLocal * transpose(A)`, where `A` is the
linear part of `matrixWorld`. Nonuniform scale, reflection and parent-induced
shear are preserved without decomposing a world quaternion. Position-only
warps do not automatically warp the covariance: modify scale/rotation as needed.
SH evaluation retains the original local-space direction convention, including
world-position-only warps.

Source-stage expressions receive `gaussianPositionLocal`, `gaussianScale`,
`gaussianRotation`, `gaussianOpacity`, `gaussianIndex` (the original packed
source slot), and cloud uniforms `gaussianObjectMatrix`, `gaussianObjectId`,
`gaussianObjectVisible`. World position becomes available after local position;
local-space `gaussianViewDirection` after the world transform; `gaussianColor`
after SH evaluation. Pass camera/viewport/depth/filter accessors are available.
Derived screen, raster and final-output accessors are unavailable. Both direct
and deferred TSL graphs are checked when the compute graph is built.

## Backend slots and dense output

The backend protocol and LOD selection are unchanged. Ownership in the CPU
transport snapshot is used to gather committed active slots into independent
cloud-local inputs; ownership is never uploaded as a per-splat GPU attribute.
`means.w` in those inputs holds only the source slot, so existing packed LOD
attributes still work. Sparse holes, removed clouds and uncommitted selections
do not enter accumulation. Hidden, detached and camera-layer-excluded clouds
have zero output count; later visible clouds shift to fill the gap.

Gathering happens on content/layout/active-set changes. Retained cloud-local
slots preserve their order across backend draw-list reordering. Only changed
attribute slot ranges are uploaded; camera and object motion update
uniforms and rerun compute without copying source data on CPU. Gathering still
scans selected attributes on a backend publication, so large LOD changes need
CPU/upload profiling. This is not a zero-copy backend protocol.

Each pass owns its input copies and world output. Secondary cameras use the
shared backend's committed selection but have independent SH direction,
visibility, buffers and material dispatches. This avoids cross-camera writes;
it also duplicates per-pass source GPU storage.

`pass.getResources().worldGaussians` exposes the accumulated storage attribute.
Only the first `worldGaussianCount * 4` vec4 rows are current:

| Row per Gaussian | Contents                                                             |
| ---------------- | -------------------------------------------------------------------- |
| 0                | world mean xyz, opacity                                              |
| 1                | covariance xx, xy, xz, yy                                            |
| 2                | covariance yz, zz, bitcast-f32(source slot XOR 0x3f800000), reserved |
| 3                | evaluated RGB, reserved                                              |

The interleaved output costs **64 bytes per reserved Gaussian**, in addition to
local inputs and projection/sorting workspaces. One output binding must fit
`min(maxBufferSize, maxStorageBufferBindingSize)`; exceeding that capacity raises
a range error. For a 128 MiB storage binding the maximum is 2,097,152 accumulated
Gaussians. The unchanged backend may publish a larger low-SH selection; reducing
that selection or extending backend budget negotiation is then required.

## Migration from object-id-based effects

There is no object matrix table or per-splat object id in tiled projection or
rasterization. Put cloud-specific effects on `cloud.material` instead of
branching on `gaussianObjectId` or `rasterObjectId` in pass graphs.
`rasterObjectId` is deprecated and rejects use; `gaussianObjectId` remains only
as a cloud-material uniform for compatibility.

The projection root receives `gaussianPositionWorld`, `gaussianPositionView`,
`gaussianCovarianceView`, source-slot `gaussianIndex`, accumulated opacity and
pass context. Local position, object matrix, scale, rotation and SH direction
belong to material preprocessing. Pass opacity/color/visibility hooks still run
after projection, with the material's opacity/color as their base values.
Raster `rasterGaussianIndex` continues to mean the original backend source slot.

`npm test` covers cloud gathering, active commits, visibility, cameras, material
replacement, buffer growth and generated shaders. For browser GPU readback,
run `npm run dev` and open `/scripts/cloud-material-qa.html`.
