# LOD stabilization and temporary warmup policy

The observed remaining flicker involved multiple completed cuts after one camera
change, with no cache misses or evictions. Atomic slot activation prevents mixed
attribute/index states, but does not make a sequence of completed downgrade cuts
visually smooth. This change addresses the repeated depth-by-depth publication.

## One settled downgrade target

Every changed camera/projection/viewport or object transform establishes a shared
stabilization deadline (`downgradeDelayMs`, default 400 ms). During that grace,
selection retains weak committed detail. Existing refined branches above
`downgradeThreshold` (default 0.7), and the ancestors needed to reach them, remain
protected by hysteresis. Stronger new detail can refine immediately.

At the deadline a single selection evaluates all weak depths for the final target,
then the existing transactional uploader commits its rows and active-slot deltas
together. `downgradeStepMs` remains accepted but no longer produces visible steps.
The one-shot recheck ends when the target is stable. Capacity limits still apply;
forced slot eviction is labelled `capacity-pressure` on activation diagnostics.

`LodHistory.refined` changes only at completed target activation (or a complete
legacy `buffers-replaced` publication), rather than during candidate selection.
This prevents a prepared cut from being treated as already displayed history.

## Prefetch, revisions and transaction ordering

`prefetch-cache` fills only unused resident slots in bounded batches. It never
calls selection or publishes another draw cut. `recheck-lod` carries the expected
`cameraRevision`; the backend ignores stale revisions and early/redundant checks.
The frontend cancels old timers on view changes and ignores old responses when
scheduling follow-up work. Both background command kinds have lower queue
priority than camera, model and edit commands.

The current explicit transaction contract is serialization: once a command has
started emitting patches, its whole version chain drains, including its final
activation, before another command can begin. In-flight upload cancellation is
not added, and responses are never selectively dropped to suppress an old target.
Only queued camera commands can be superseded. Consequently an older cut can
finish while a newer view is still queued; it cannot overwrite an already
published newer transaction. Stale queued rechecks cannot restore their old view.
Mid-upload candidate replacement would need a separate abort/rollback protocol.

## Diagnostics and acceptance

Backend metrics separate `cameraRevision`, `candidateCameraRevision`,
`candidateRevision`, `publishedCutRevision`, `publishedCuts`, `selectionReason`
and `selectionBudget` from upload batches, bytes, cache misses and evictions.
`publishedCuts` counts completed target cuts for that command, not slot-delta
packets. `GaussianStore.lastPackStats.requestedCameraRevision` is the latest
locally requested camera revision; it can be ahead of the backend while a
transaction drains. Activation packets include their revisions and reason.

Native/WASM regressions check a deep history collapsing at one deadline, band
retention and required descendants, warm-cache one-publication downgrade, no
selection/activation from prefetch, stale rechecks, latest-view timer restart,
commit-only history, capacity pressure and sequential upload acknowledgements.

Local visual acceptance remains required on the original scene: stop after one
camera movement and count completed publications; compare fixed-camera images
before/during/after selection. Also test threshold views, rapid rotation, cold
cache, pressure, multiple models and removal. A single final atomic change may
still be visible, and sorting/compositing artifacts are not excluded by these
protocol tests. Crossfade/dither of parent/children is a separate possible second
stage, requiring opacity, color and depth verification.

## Warmup is opt-in only

The normal Camera Path loader no longer calls or waits for `GaussianPass.warmup`.
No dummy pipeline or zero dispatch is created for normal prewarming. Stable
resource bindings and dynamic capacities remain unchanged. The public opt-in
API is retained for compatibility; calling it still uses zero dispatch and may
produce Chrome warnings. The GPU page uses no warmup by default; `?warmup=1`
opts into the old comparison. No console filter or one-
workgroup substitute is installed.

Measure first-render duration locally alongside warnings, build/module/pipeline
counters and compatible resource updates. First-use compilation can increase that
frame after automatic warmup is removed. That measurement is independent of the
LOD publication fix and does not prove image smoothness.
