import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
mkdirSync(`${root}/src/wasm-backend/generated`, { recursive: true });
run("cargo", [
  "build",
  "--manifest-path",
  "rust/Cargo.toml",
  "--locked",
  "-p",
  "gaussian-backend",
  "--release",
  "--target",
  "wasm32-unknown-unknown",
]);
run("wasm-bindgen", [
  "rust/target/wasm32-unknown-unknown/release/gaussian_backend.wasm",
  "--target",
  "web",
  "--out-dir",
  "src/wasm-backend/generated",
  "--out-name",
  "gaussian_backend",
]);

// The TS adapter always supplies a URL. Remove wasm-bindgen's unused default
// URL so Vite does not embed a second copy of the same binary in each bundle.
const bindings = `${root}/src/wasm-backend/generated/gaussian_backend.js`;
const code = readFileSync(bindings, "utf8");
const fallback =
  "module_or_path = new URL('gaussian_backend_bg.wasm', import.meta.url);";
if (!code.includes(fallback))
  throw new Error("Unexpected wasm-bindgen initializer");
writeFileSync(
  bindings,
  code.replace(
    fallback,
    'throw new Error("Explicit WASM module URL is required");',
  ),
);
