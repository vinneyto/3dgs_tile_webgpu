import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const cwd = fileURLToPath(new URL("../", import.meta.url));
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(process.execPath, ["scripts/verify-spark-vendor.mjs"]);
run(
  "wasm-pack",
  [
    "build",
    "vendor/spark/rust/spark-rs",
    "--target",
    "web",
    "--release",
    "--out-dir",
    "../../../../src/spark-backend/generated",
  ],
  { ...process.env, RUSTFLAGS: "-C target-feature=+simd128,+bulk-memory" },
);
run(process.execPath, ["scripts/verify-spark-vendor.mjs"]);
