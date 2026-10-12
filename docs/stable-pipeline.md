# Stable compute resources and explicit warmup

Model count, reserved slots, active slots, SH degree, intersection capacity and
viewport size are runtime state. A layout publication updates uniforms and
storage bindings on the existing `TiledGaussianPipeline`. Capacity increases
grow only insufficient workspaces; sufficient buffers remain allocated and
smaller layouts reuse them. Compute nodes and compatible WebGPU pipelines stay
the same. Intersection records retain the capacity policy's exact allocation;
other workspaces use geometric reservation, constrained by device binding sizes.

Projection uses uniforms for the object-state offset, active-slot tail and SH
degree. Scan/suffix stages reserve five kernel levels, enough for uint32 lengths,
but allocate only the currently needed buffers. Radix sorting reserves all eight
four-bit shifts and selects the active passes at encode time. Scratch strides and
raster-task capacity are uniforms. Ping-pong output changes rebind only consumer
nodes, without changing the sorter's own input/output roles.

Geometry encoding, SH storage encoding and dense versus sparse source layout
remain genuine projection variants. Changing those rebuilds only projection.
Changing custom projection/raster roots rebuilds the affected stage. Device,
depth-output configuration and raster/workgroup configuration are pass-level
choices. A new shader variant must be compiled; stable resources do not promise
that every possible configuration shares one shader.

## Warmup

Configure custom roots first, then warm the actual pass before model preparation:

```ts
const pass = gaussianPass(renderer, camera, store, { outputDepth: true });
// Set custom projection/raster roots here, if needed.
const [buffer] = await Promise.all([
  fetch(modelUrl).then((response) => response.arrayBuffer()),
  pass.warmup(),
]);
const cloud = await store.loadBuffer(buffer, { fileName: modelUrl });
scene.add(cloud);
```

`warmup()` initializes the renderer, builds the stage graph using one-slot source
and intersection resources, and submits every reserved kernel with zero work.
It yields to browser frames between small batches, so a loading indicator can
paint. It waits for submitted work to finish and checks validation/OOM scopes.
Concurrent calls share one promise. Disposal or a shader-generation change stops
the obsolete warmup; a subsequent call can warm the new generation. Normal
rendering remains synchronous and never implicitly awaits warmup.

Without published data, defaults match the WASM store: compact geometry, rgb8e8
SH and sparse slots. A custom store can specify its initial variant with
`warmup({ geometryFormat: "float32", shFormat: "float32", activeSlots: false })`.
Once data exists its schema is inferred. Source schema changes after warmup can
still require the targeted projection compilation.

Warmup avoids large scene-sized allocations and repeats across compatible model
loads. It does not eliminate CPU TypedArray allocation, GPU allocation/upload,
worker parsing, actual rendering, or compilation for an unprepared variant.

## Binding and lifetime details

In Three.js r185.1, changing `StorageBufferNode.value` and `bufferCount` preserves
the node and unsized WGSL array. The count itself is not a WGSL capacity constant.
However, a bind group containing textures is cached by texture IDs/versions;
that key does not include replaced storage attributes. Simply changing `.value`
can therefore select a cached group with an old GPU buffer. Mutable storage uses
a separate `gaussianStorage` uniform group, updated per object. Texture groups
retain their normal caching. This uses the public TSL grouping API.

Old workspaces retire after `queue.onSubmittedWorkDone()`. Projection holds a
lease on source `GaussianData`, so layout publication or store disposal cannot
destroy buffers still used by another pass. Temporary peak memory can include
both old and new resources. The previous complete-output/overflow contract in
[dynamic-intersections.md](dynamic-intersections.md) is unchanged.

## Verification

`npm test` checks node/WGSL identity across three models, SH degree changes,
scan/radix boundaries, viewport and intersection growth, smaller-layout reuse,
source leases and targeted schema changes.

For GPU verification, run `npm run dev` and open
`/scripts/stable-pipeline-qa.html` in a WebGPU browser. The synthetic test warms a
pass, adds 600 and 800 Gaussians to its first model, grows intersection resources,
changes resolution across a radix-pass parity boundary, and compares every color
and depth value with a fresh fixed-capacity pass. `ok: true` requires identical
outputs, visible geometry, unchanged shader-build/module/pipeline counters and
no uncaptured GPU error. It deliberately uses the workgroup radix backend for
portability. Run hardware acceptance on the production subgroup backend too.

Debug info exposes `resourceUpdates`, `bufferReplacements` and
`shaderVariantChanges` separately from stage rebuild counters. Buffer replacement
can create bind groups while shader modules and compute pipelines remain stable.
