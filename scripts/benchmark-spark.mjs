import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { PerspectiveCamera, Box3, Vector3 } from "three";
import {
  WasmGaussianBackend,
  SerialRequestScheduler,
} from "../dist/backend.js";
import { SparkGaussianBackend } from "../dist/spark.js";
const mode = process.argv.includes("--baseline")
  ? "resident-rust"
  : "upstream-spark";
const fileIndex = process.argv.indexOf("--file");
let bytes;
if (fileIndex >= 0)
  bytes = new Uint8Array(readFileSync(process.argv[fileIndex + 1]));
else {
  bytes = new Uint8Array(65536 * 32);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < 65536; i++) {
    const p = i * 32;
    view.setFloat32(p, ((i % 256) - 128) * 0.014, true);
    view.setFloat32(p + 4, (Math.floor(i / 256) - 128) * 0.014, true);
    view.setFloat32(p + 8, -3, true);
    for (let k = 0; k < 3; k++) view.setFloat32(p + 12 + k * 4, 0.006, true);
    bytes.set([128, 128, 128, 255, 255, 128, 128, 128], p + 24);
  }
}
const backend =
  mode === "resident-rust"
    ? new WasmGaussianBackend({})
    : new SparkGaussianBackend({});
const scheduler = new SerialRequestScheduler(backend);
const events = [];
let final;
scheduler.onResponse((event) => {
  if (event.payload) events.push(event.payload);
  if (event.isFinal) final = event;
});
scheduler.start();
const run = async (command) => {
  events.length = 0;
  const started = performance.now();
  await scheduler.schedule(command);
  return {
    ms: performance.now() - started,
    metrics: final.metrics,
    payloads: events.map((e) => e.type),
  };
};
try {
  const load = await run({
    id: "load",
    type: "load-cloud-from-buffer",
    cloudId: "mug",
    buffer: bytes.buffer,
    options: {
      format: fileIndex >= 0 ? "ply" : "splat",
      mipmaps: { type: "standard", snapshot: { maxLeaves: 25000 } },
    },
  });
  const loaded = events.find((e) => e.type === "cloud-loaded");
  const box = new Box3();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0,
    stride = 32;
  if (fileIndex >= 0) {
    const header =
      new TextDecoder()
        .decode(bytes.subarray(0, 8192))
        .split("end_header\n")[0] + "end_header\n";
    if (
      !header.includes("binary_little_endian") ||
      header
        .split("\n")
        .filter((l) => l.startsWith("property "))
        .some((l) => !l.startsWith("property float "))
    )
      throw new Error("benchmark expects a binary float PLY fixture");
    offset = new TextEncoder().encode(header).length;
    stride =
      header.split("\n").filter((l) => l.startsWith("property ")).length * 4;
  }
  for (let at = offset; at + stride <= bytes.length; at += stride)
    box.expandByPoint(
      new Vector3(
        view.getFloat32(at, true),
        view.getFloat32(at + 4, true),
        view.getFloat32(at + 8, true),
      ),
    );
  const center = box.getCenter(new Vector3()),
    radius = box.getSize(new Vector3()).length() * 0.7;
  const camera = new PerspectiveCamera(50, 1, 0.001, 10000);
  camera.position.copy(center).add(new Vector3(0, 0, radius));
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const caps = {
    maxStorageBufferBindingSize: 128 * 1024 * 1024,
    maxBufferSize: 256 * 1024 * 1024,
    maxStorageBuffersPerShaderStage: 8,
    supportsPartialBufferUpdates: true,
    supportsCompactGaussians: true,
    supportsSparkSplats: true,
  };
  const handshake = await run({
    id: "caps",
    type: "set-frontend-capabilities",
    protocolVersion: 2,
    sceneRevision: 1,
    capabilities: caps,
    cloudTransforms: [],
    cameraWorldMatrix: camera.matrixWorld.elements,
    projectionMatrix: camera.projectionMatrix.elements,
    viewportWidth: 1024,
    viewportHeight: 1024,
  });
  const samples = [];
  for (let i = 0; i < 20; i++) {
    const theta = (i / 19 - 0.5) * 0.5;
    camera.position
      .copy(center)
      .add(new Vector3(Math.sin(theta) * radius, 0, Math.cos(theta) * radius));
    camera.lookAt(center);
    camera.updateMatrixWorld();
    samples.push(
      await run({
        id: `view-${i}`,
        type: "set-camera",
        sceneRevision: i + 2,
        worldMatrix: camera.matrixWorld.elements,
        projectionMatrix: camera.projectionMatrix.elements,
        viewportWidth: 1024,
        viewportHeight: 1024,
      }),
    );
  }
  const stationary = await run({
    id: "stationary",
    type: "set-camera",
    sceneRevision: 22,
    worldMatrix: camera.matrixWorld.elements,
    projectionMatrix: camera.projectionMatrix.elements,
    viewportWidth: 1024,
    viewportHeight: 1024,
  });
  const sorted = samples.map((s) => s.ms).sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        backend: mode,
        fixture: fileIndex >= 0 ? "mug.ply" : "synthetic-65536.splat",
        sha256: createHash("sha256").update(bytes).digest("hex"),
        sourceCount: loaded.sourceCount,
        snapshotNodes: loaded.mipmapSnapshot?.nodeCount,
        bounds: loaded.bounds,
        loadMs: load.ms,
        handshakeMs: handshake.ms,
        resident: handshake.metrics.residentGaussians,
        drawCount: samples.at(-1).metrics.activeGaussians,
        viewMedianMs: sorted[10],
        viewP95Ms: sorted[19],
        viewBytes: samples.reduce((s, v) => s + v.metrics.uploadedBytes, 0),
        viewLayoutReplacements: samples.reduce(
          (s, v) =>
            s + v.payloads.filter((p) => p === "buffers-allocated").length,
          0,
        ),
        stationary,
        samples,
      },
      null,
      2,
    ),
  );
} finally {
  scheduler.dispose();
}
