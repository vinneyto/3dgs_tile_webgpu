# GaussianPass rendering extensions

`GaussianPass` defaults to its existing perspective projection, compensated 0.3 pixel² filter, canvas resolution, managed backend lifecycle and perspective device-depth output. An external module can replace projection and scalar encoding without adding application-specific modes to the renderer.

## A second, externally managed pass

```ts
import {
  gaussianPass,
  gaussianPositionView,
  gaussianCovarianceView,
  gaussianPassViewport,
  gaussianProjectionResult,
  rasterOutputDepth,
} from "3dgs-tile-webgpu";
import { vec2, vec3 } from "three/tsl";

const secondary = gaussianPass(renderer, secondaryCamera, sharedStore, {
  dataMode: "external",
  fixedSize: { width: 512, height: 128 },
  depthRange: [0.01, 500],
  outputDepth: true,
  invalidDepthValue: Infinity,
  filterVariance: 0,
});

// Generic affine image mapping. Application modules supply their own mapping
// and its Jacobian; the renderer never infers one from the camera type.
const j0 = vec3(20, 0, 0);
const j1 = vec3(0, -20, 0);
const position = gaussianPositionView;
const covariance = gaussianCovarianceView;
secondary.gaussianProjectionNode = gaussianProjectionResult(
  vec2(position.dot(j0), position.dot(j1)).add(gaussianPassViewport.mul(0.5)),
  position.length(),
  vec3(
    j0.dot(covariance.mul(j0)),
    j0.dot(covariance.mul(j1)),
    j1.dot(covariance.mul(j1)),
  ),
);
secondary.rasterOutputDepthNode = rasterOutputDepth;
```

The application updates the shared store through its owner/main pass first. The secondary pass consumes that current **active draw set**, which may omit data outside the owner's view. `dataMode: "external"` never calls `setFrontendCapabilities` or `updateLod`, including construction, rendering, resize and camera changes. It still subscribes to shared-data changes. This mode does not implement independent backend selection.

Passes share the CPU backend snapshot, but own cloud-local GPU inputs, accumulated world attributes, projected buffers, sorting workspaces, output textures and caches. See [cloud-materials.md](cloud-materials.md) for per-cloud compute materials. Disposing a pass does not dispose the store. A generic `Camera` is accepted with a custom projection and explicit `depthRange`; the default graph requires `PerspectiveCamera`.

`fixedSize` is in exact pixels and ignores drawing-buffer size, aspect ratio, DPR and `setResolutionScale()`. Change it with `setFixedSize(width, height)`, or return to canvas sizing with `useDrawingBufferSize()`. `setSize()` cannot override an active fixed size. Output textures keep their identity when resized; consumers must update dispatch dimensions.

## Projection root and staged contexts

`gaussianProjectionNode` is a `mat4` evaluated once per active Gaussian, after resolving position/shape overrides and before projection-specific rejection. It returns:

| Column | Contents                                                                                  |
| ------ | ----------------------------------------------------------------------------------------- |
| 0      | `vec4(screenPosition.xy, positiveProjectedScalar, valid)`; `valid > 0` accepts the result |
| 1      | `vec4(conic.xx, conic.xy, conic.yy, filteredDeterminant)`                                 |
| 2      | `vec4(filteredCovariance.xx, .xy, .yy, unfilteredDeterminant)`                            |
| 3      | Reserved                                                                                  |

Use `gaussianProjectionResult(center, scalar, covariance[, filterVariance])` to add the filter, stabilize eigenvalues, compute the inverse conic and preserve the unfiltered determinant for opacity compensation. Covariance is `(xx, xy, yy)` in image pixels squared. The default variance is `gaussianPassFilterVariance` (pass property `filterVariance`, default `0.3`); zero disables this additive filter, while numerical stabilization remains. Eigenvalues are clamped to `[1e-6, 1e4]`, and degenerate/non-finite results are rejected. Raw custom mat4 roots must return matching finite, positive-definite covariance/conic/determinants, with diagonal covariance at most `1e4` to fit the packed nine-bit support radii.

The root receives world-space `gaussianPositionWorld`, view-space
`gaussianPositionView`, `gaussianCovarianceView`, source-slot `gaussianIndex`,
accumulated `gaussianOpacity` and pass context. World position/covariance are
prepared by per-cloud materials before projection. A position warp does not
automatically warp shape. `gaussianViewCovariance(scale, rotation, matrix)` is
also exported for constructing a transformed covariance.

Pass context: `gaussianPassViewMatrix`, `gaussianPassProjectionMatrix`,
`gaussianPassViewport` (actual pixels), `gaussianPassDepthRange` and
`gaussianPassFilterVariance`. These are also available in raster and final-output
graphs. A root cannot read its own derived screen/depth/bounds/color results,
raster candidates or final outputs.

Local position, shape and object uniform accessors now belong to
[cloud material preprocessing](cloud-materials.md). Existing pass-wide
local/world-position and shape hooks are applied during that preprocessing.
Pass opacity/color/visibility hooks run after projection, using the material's
opacity and evaluated color as their base inputs. Object-id-based raster effects
must move to `cloud.material`.

The selected root drives `gaussianScreenPosition`, `gaussianViewDepth`, projected sigma/area and unwrapped footprint bounds. The historical `gaussianViewDepth` and `rasterViewDepth` names mean positive perspective view depth by default, or the custom root's scalar otherwise. That scalar is sorted and accumulated unchanged. `depthRange` supplies default perspective clipping and packed16 normalization in the same units; float32 sorting uses the finite positive scalar directly. Packed16 does not guarantee exact ordering inside a bin.

`perspectiveGaussianProjection()` returns the default graph for restoring it. Its perspective near/far and clip-W checks are confined to that graph. Active-slot, object visibility, finite-result, covariance and sampled-support checks remain generic renderer checks.

## Image boundaries

`boundaryPolicy` supports `"clip"` (default), `"repeat-x"` and `"repeat-y"`. Only one periodic axis is selected at a time; the other axis clips. Coordinates and `gaussianScreenBoundsMin/Max` remain **unwrapped**. Counting, intersection emission, subpixel sample checks and rasterization share this policy and use the actual viewport period, including dimensions not divisible by the tile size.

Each Gaussian is emitted once per contributing tile and composited once per pixel. `rasterPixelDelta` selects the periodic image with minimum quadratic conic distance; this also handles tilted ellipses and support spanning multiple periods. `rasterGaussianCenter` retains the unwrapped center. `rasterGaussianCoord`, UV, power and weight derive from the selected displacement. A custom delta graph alone cannot create periodic tile support.

The initial periodic implementation scans the periodic tile axis and tests bounded footprint images. This favors correctness for seam-crossing and wide support; sparse periodic views may perform more tile tests than the default clipped path.

## Final scalar output

`getTextureNode("depth")` exposes the same `r32float` texture for encoded valid scalars and invalid results; no separate validity texture exists. Color-space conversion applies only to color output.

Contributions retain the existing estimator: `contribution = previousTransmittance * alpha`; weighted scalar sum is `sum(projectedScalar * contribution)`, and Gaussian coverage is `1 - transmittance`, excluding background alpha. The scalar estimator is weighted sum / coverage. Changing output encoding does not change this estimator or the existing raster/chunk termination rules.

Final-output context, available after direct accumulation or **after ordered chunk composition**:

| Accessor                 | Meaning                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `rasterAccumulatedDepth` | Weighted scalar sum                                                                                         |
| `rasterAccumulatedAlpha` | Gaussian coverage                                                                                           |
| `rasterOutputDepth`      | Safe weighted average; zero when coverage is zero                                                           |
| `rasterOutputValid`      | Positive finite scalar, nonzero coverage and coverage strictly above `depthAlphaThreshold` (default `0.95`) |

`rasterOutputDepthNode` encodes the average; default is perspective device-depth conversion clamped to `[0,1]`. Assign `rasterOutputDepth` to retain a linear scalar. `rasterOutputValidNode` is an internal predicate (default `rasterOutputValid`), allowing a custom coverage policy. Generic nonzero-coverage, positive/finite scalar and finite-encoding checks still apply even if a custom predicate is true. Final graphs can read final accumulation, pixel and pass contexts, but cannot read a last Gaussian's candidate values or cached `rasterPixelValue`. Per-Gaussian color/alpha/discard/break slots retain their roles.

`invalidDepthValue` defaults to `1`, preserving perspective misses. Use `Infinity` with finite linear output. Empty pixels, insufficient coverage, a false final predicate or non-finite computed/encoded values receive that sentinel. It is uploaded as a float32 uniform, so `Infinity` never appears as an invalid WGSL literal. The sentinel never enters sorting, packed16 normalization or accumulation. Choose a sentinel that cannot collide with valid encoded values; consumers must check the sampled scalar before use.

## Invalidation and GPU execution

Graph setters rebuild their affected kernels: source/projection slots rebuild projection; candidate/final-output slots rebuild direct raster, chunk raster and composition. Numeric properties `depthRange`, `filterVariance`, `boundaryPolicy` and `invalidDepthValue` update pass uniforms and invalidate the whole frame without rebuilding graphs. A boundary update reaches every dependent stage through the same pass configuration.

With `redrawStrategy: "auto"`, camera/object transforms, camera range/projection/layers, shared store events/content and size changes invalidate output. Changing a **custom uniform value** requires `pass.invalidate()`; it reruns kernels without rebuilding graphs. Use `invalidateProjection()` / `invalidateRasterizer()` after in-place graph changes. With `"never"`, call `invalidate()` after graph or transform changes; explicit numeric configuration and resize already invalidate. `"always"` keeps the previous default behavior.

For explicit compute/render sequencing on an initialized renderer:

```ts
mainPass.render(); // owns backend updates; asynchronous loads may still be pending
secondary.render(); // encodes the complete projection-to-final-output chain
if (secondary.renderCount > 0) {
  renderer.compute(consumerComputeNode); // reads secondary.depthTexture on this GPU
  renderer.render(visualizationScene, displayCamera);
}
```

Calls on the same renderer preserve submission order; no CPU readback is required. `renderCount > 0` indicates at least one output frame was encoded; before shared packed data arrives, `render()` cannot produce output. For Three.js RenderPipeline graphs, `getTextureNode()` supplies the pass dependency and schedules its `updateBefore`; an independently submitted compute consumer must explicitly invoke `render()` first. Consumers own their compute-node disposal and dispatch bounds. Treat `getResources()` as nullable until the first successful frame; reacquire resource attributes after shared layout changes or device replacement. Textures are pass-owned and unusable after pass disposal.
