# Dynamic intersection capacity

Each `GaussianPass` starts with 262,144 intersection records by default: 4 MiB
for its two 8-byte ping-pong record buffers. This replaces the old
`min(gaussianCount * 16, 16,776,960)` initial allocation. Main view, scalar output,
and external/custom projection passes use the same independent policy.

```ts
const pass = gaussianPass(renderer, camera, store, {
  initialIntersectionCapacity: 262_144,
  maxIntersectionCapacity: 8_000_000,
  intersectionGrowthFactor: 2,
  intersectionHeadroom: 1.25,
  intersectionReadbackInterval: 100,
});
```

The maximum is also constrained by device buffer sizes, binding sizes,
intersection dispatch dimensions, radix scratch, and raster chunk partials.
It is a record limit, not a whole-renderer memory budget. Record-pair bytes are
`16 * capacity`; scene data, radix/chunk scratch, textures, and temporarily
retired buffers consume additional memory. No automatic shrink or proactive
high-water growth is implemented in this first stage.

## Overflow and feedback

The GPU computes demand after projection and scan. Prefix sums saturate at
`0xffffffff` instead of wrapping; sums above the uint32 range are consequently
always rejected, since every supported capacity is smaller than that value.
`requestedIntersections` is exact within the uint32 range and saturates beyond it. When demand exceeds
capacity it sets emitted count and intersection indirect dispatches to zero.
A separate five-storage-binding kernel suppresses emission and direct/composite
output dispatch. Scratch tile offsets are cleared, so chunk tasks are also empty.
Color, scalar/depth, and custom raster outputs are never overwritten with a
partial result. The prior complete textures remain available; after a viewport
resize those textures have been recreated and there is no previous valid result.
Before the first complete result, output must be treated as unavailable.

One 16-byte state readback can be in flight per pass. Reads are throttled after
the first complete result; cached auto/never frames still poll unconfirmed
attempts. Readback copies are submitted immediately after the complete kernel
chain. Generation and pipeline identity checks discard responses after resize,
layout replacement, device change, or disposal. `render()` never awaits feedback.

An overflowing response requests
`min(maximum, roundUp(max(demand * headroom, current * growthFactor)))`.
The maximum can reduce the reserve while still accommodating demand. The next
render grows only insufficient intersection, tile radix and raster-chunk
workspaces, then retries the current camera/data. Compute nodes and pipelines,
projection, scene attributes, object state, tile offsets and prefix scans are
retained; see [stable-pipeline.md](stable-pipeline.md). Old capacity-dependent
resources are retired after submitted GPU work completes; peak usage can include
both allocations. Growth still allocates and initializes CPU TypedArrays and
Three GPU buffers, and can cause a main-thread hitch.

## Output contract

`pass.getOutputStatus()` returns conservative CPU confirmation: `valid`, `fresh`,
last complete `version`, sampled `confirmedAttempt`, `latestAttempt`, demand,
capacity, maximum, growth count/time, record-pair bytes, and an error string.
`fresh` means feedback confirmed the latest attempt and the pass has not been
invalidated since. With continuously moving input, CPU confirmation can lag.
Do not infer completeness from `renderCount`: it counts encoded attempts.

For a subsequent GPU consumer on the same renderer, use the stable boolean TSL
node `pass.outputReadyNode`. It is true only when a complete result exists and
the latest encoded attempt did not overflow. The node and its state buffer remain
stable during capacity growth. For example, suppress LiDAR hit conversion when
false rather than applying the latest sensor pose to an older depth image.

`budget-exceeded` means full demand does not fit the record limit. The GPU keeps
rejecting incomplete output; changed input can recover. `allocation-failed` and
`readback-failed` expose failures rather than silently truncating. The existing
`readStats()` retains exact sampled intersection diagnostics and optional profiling.

## Legacy fixed capacity

`intersectionCapacity` remains a fixed allocation and cannot be combined with
initial/max dynamic options. It no longer renders a truncated result on overflow:
the previous result is retained and `budget-exceeded` is reported. This is an
intentional correctness change. To opt into growth, use the dynamic options or
omit capacity options.
