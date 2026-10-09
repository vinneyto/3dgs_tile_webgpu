// @ts-ignore Node types are deliberately outside the browser tsconfig.
import { readFileSync } from "node:fs";
import { initSync } from "../../src/wasm-backend/generated/gaussian_backend";

/** Exercise the actual committed Rust WASM, never a TS replacement. */
export function initializeTestWasm(): void {
  initSync({
    module: readFileSync(
      new URL(
        "../../src/wasm-backend/generated/gaussian_backend_bg.wasm",
        import.meta.url,
      ),
    ),
  });
}
