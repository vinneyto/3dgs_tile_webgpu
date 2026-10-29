# Unmodified upstream Spark

Source: https://github.com/sparkjsdev/spark/tree/f5368253780bed4d863c96b1fdea9dd3d614d131/rust

The complete Rust workspace and root MIT LICENSE are copied byte-for-byte. No Rust sources, Cargo manifests or lockfile are adapted. `manifest.json` records each upstream file. Run `npm run spark:verify` before and after rebuilding WASM. Build flags match the upstream build script: SIMD128 and bulk memory. Generated wasm-bindgen JavaScript is build output, not hand-edited. All integration logic lives in TypeScript under `src/spark-backend`.
