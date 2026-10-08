import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { PerspectiveCamera } from "three/webgpu";
import {
  initSync,
  GaussianEngine,
} from "../src/wasm-backend/generated/gaussian_backend.js";
initSync({
  module: readFileSync(
    new URL(
      "../src/wasm-backend/generated/gaussian_backend_bg.wasm",
      import.meta.url,
    ),
  ),
});
const count = 65536,
  bytes = new Uint8Array(count * 32),
  v = new DataView(bytes.buffer);
for (let i = 0; i < count; i++) {
  const at = i * 32,
    x = ((i % 256) - 128) * 0.014,
    y = (Math.floor(i / 256) - 128) * 0.014;
  v.setFloat32(at, x, true);
  v.setFloat32(at + 4, y, true);
  v.setFloat32(at + 8, -3 + 0.05 * Math.sin(x * 3) * Math.cos(y * 4), true);
  for (let k = 0; k < 3; k++) v.setFloat32(at + 12 + 4 * k, 0.006, true);
  bytes.set([128, 128, 128, 255, 255, 128, 128, 128], at + 24);
}
const engine = new GaussianEngine({});
const start = performance.now();
engine.apply(
  {
    id: "load",
    type: "load-cloud-from-buffer",
    cloudId: "scene",
    options: { format: "splat" },
  },
  bytes,
);
const buildMs = performance.now() - start;
const camera = new PerspectiveCamera(50, 1, 0.01, 100);
const caps = {
  maxStorageBufferBindingSize: 8 * 1024 * 1024,
  maxBufferSize: 8 * 1024 * 1024,
  maxStorageBuffersPerShaderStage: 8,
  supportsPartialBufferUpdates: true,
};
const warm = process.argv.includes("--warm");
const compact = process.argv.includes("--compact");
caps.supportsCompactGaussians = compact;
const prefetchTimes = [];
let warmMs = 0;
const results = [];
for (let i = 0; i < 20; i++) {
  camera.position.x = 0.8 - i * 0.08;
  camera.position.z = i * 0.01;
  camera.lookAt(0, 0, -3);
  camera.updateMatrixWorld();
  const command =
    i === 0
      ? {
          type: "set-frontend-capabilities",
          protocolVersion: 2,
          capabilities: caps,
          cloudTransforms: [],
          cameraWorldMatrix: camera.matrixWorld.elements,
        }
      : { type: "set-camera", worldMatrix: camera.matrixWorld.elements };
  const before = performance.now();
  const events = engine.apply(
    {
      ...command,
      id: `c${i}`,
      sceneRevision: i + 1,
      projectionMatrix: camera.projectionMatrix.elements,
      viewportWidth: 1024,
      viewportHeight: 1024,
    },
    new Uint8Array(),
  );
  results.push({
    ms: performance.now() - before,
    replace: events.filter(
      (e) => e.type === "buffers-replaced" || e.type === "buffers-allocated",
    ).length,
    capacity: events.find(
      (e) => e.type === "buffers-replaced" || e.type === "buffers-allocated",
    )?.capacity,
    count: engine.timings().activeGaussians,
    timings: engine.timings(),
    bytes: events.reduce(
      (sum, e) =>
        sum +
        (e.activeSlots?.byteLength ?? 0) +
        (e.addedSlots?.byteLength ?? 0) +
        (e.removedSlots?.byteLength ?? 0) +
        (e.attributes ?? e.patches ?? []).reduce(
          (s, a) => s + (a.data?.byteLength ?? 0),
          0,
        ),
      0,
    ),
  });
  if (i === 0 && warm) {
    const warming = performance.now();
    while (engine.timings().prefetchPending) {
      const before = performance.now();
      engine.apply({ type: "prefetch-cache" }, new Uint8Array());
      prefetchTimes.push(performance.now() - before);
    }
    warmMs = performance.now() - warming;
  }
}
const times = results
  .slice(1)
  .map((r) => r.ms)
  .sort((a, b) => a - b);
console.log(
  JSON.stringify({
    count,
    compact,
    warm,
    warmMs,
    prefetchBatches: prefetchTimes.length,
    maxPrefetchMs: Math.max(0, ...prefetchTimes),
    cacheMissesAfterInitial: results
      .slice(1)
      .reduce((s, r) => s + r.timings.cacheMisses, 0),
    buildMs,
    medianCameraMs: times[Math.floor(times.length / 2)],
    maxCameraMs: times.at(-1),
    replacements: results.reduce((s, r) => s + r.replace, 0),
    results,
  }),
);
engine.free();
