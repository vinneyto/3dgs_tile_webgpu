# Upstream provenance

## Spark (MIT)

The native `spark-lod` crate links the repository's existing unmodified `rust/vendor/spark-lib`:

* Repository: https://github.com/sparkjsdev/spark
* Library revision: `f5368253780bed4d863c96b1fdea9dd3d614d131`
* License: `../../rust/vendor/spark-lib/LICENSE` and the repository's `THIRD_PARTY_NOTICES.md`.

The native best-first traversal is adapted from `rust/spark-rs/src/lod_tree.rs` at `a403b6d17f1b45d714e47834188570e14d152651`. It removes WASM/JavaScript handles and paged address maps, uses Arc-owned native Gaussian buffers, conservatively scales feature size for full affine transforms, and uses a fixed smooth angular weight. The original root/children replacement rule and shared instance budget are retained. Spark's MIT notice applies to this port.

The native residency protocol follows `src/SplatPager.ts`, `src/PagedSplats.ts::update` and `src/SparkRenderer.ts::updateLodIndices` at `a403b6d17f1b45d714e47834188570e14d152651`: attributes keep resident addresses, each instance has separate active indices, all current requests are protected before LRU replacement, and only new residents are uploaded. `residency.rs` and `resident_gpu.rs` implement this contract for wgpu storage-buffer node slots instead of WebGL texture pages. Shared source buffers, bounded allocations, GPU relocation and scatter uploads adapt the protocol to the native 240-byte source records; Spark's HTTP/RAD fetch transport is not used.

`ascii_ply.rs` is copied from this repository's `rust/gaussian-backend/src/ascii_ply.rs`; it normalizes the project's supported scalar ASCII PLY records before Spark decoding.

## Brush (Apache-2.0)

* Repository: https://github.com/ArthurBrussee/brush
* Release: v0.3.0
* Revision: `3edecbb2fe79d3e2c87eeab85b15e0b1dd10d486`
* Source: `crates/brush-render/src/shaders/{helpers,project_forward,project_visible,map_gaussian_to_intersects,rasterize}.wgsl`
* License text and complete original shader sources are preserved in `third_party/brush`.

Changed files under `crates/brush-renderer/src/shaders` carry Apache-2.0 headers. `brush_math.wgsl` retains the upstream helper routines after removing the Burn-specific uniform declaration. `brush_sh.wgsl` retains the SH evaluator. `project.wgsl` combines projection/culling/counting and reads full transformed covariance axes; `scatter.wgsl` retains Brush's tile contribution logic against native inclusive prefixes. `rasterize.wgsl` retains the forward tile compositor, removes backward training state, fixes partial-batch loads and shared range initialization, and writes a storage texture. The adapter accepts decoded Spark RGB/opacity/scales/quaternions/SH and handles cloud transforms. The scan, lexicographic bitonic sort, range extraction and native host dispatch are new glue rather than Brush's Burn runtime.

No Brush trainer, datasets, model weights, CUDA code or GPL code are included.

## Bevy (MIT OR Apache-2.0)

Bevy is a Cargo dependency pinned to 0.17.3 (wgpu 26). Its licenses remain in the dependency package. The app uses Bevy's device/queue and never initializes a separate rendering backend.
