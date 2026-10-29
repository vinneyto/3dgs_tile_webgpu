import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = new URL("../vendor/spark/", import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL("manifest.json", root), "utf8"),
);
for (const [path, expected] of Object.entries(manifest.files)) {
  const bytes = readFileSync(new URL(path, root));
  if (createHash("sha256").update(bytes).digest("hex") !== expected)
    throw new Error(`Upstream Spark source changed: ${path}`);
}
function visit(relative) {
  for (const entry of readdirSync(new URL(relative, root), {
    withFileTypes: true,
  })) {
    const path = relative + entry.name;
    if (
      path === "rust/target" ||
      path === "manifest.json" ||
      path === "UPSTREAM.md"
    )
      continue;
    if (entry.isDirectory()) visit(path + "/");
    else if (!(path in manifest.files))
      throw new Error(`Untracked upstream source: ${path}`);
  }
}
visit("");
console.log(
  `Verified ${Object.keys(manifest.files).length} unchanged Spark files at ${manifest.commit} (${fileURLToPath(root)})`,
);
