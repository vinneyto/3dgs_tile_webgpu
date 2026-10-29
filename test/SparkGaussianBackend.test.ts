// @ts-ignore Node I/O is only used by tests.
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { PerspectiveCamera, Ray, Vector3 } from "three";
import { initSync } from "../src/spark-backend/generated/spark_rs";
import { SparkGaussianBackend } from "../src/spark-backend/SparkGaussianBackend";
import { SerialRequestScheduler } from "../src/streaming-backend/RequestScheduler";
import type { BackendCommand } from "../src/streaming-backend/commands/BackendCommand";
import type { BackendResponse } from "../src/streaming-backend/BackendResponse";
import { GaussianRaycastIndex } from "../src/renderer/GaussianRaycastIndex";
import { transferBuffers } from "../src/streaming-backend-worker/WorkerMessages";
initSync({
  module: readFileSync(
    new URL("../src/spark-backend/generated/spark_rs_bg.wasm", import.meta.url),
  ),
});
const instances: SerialRequestScheduler[] = [];
afterEach(() => instances.splice(0).forEach((s) => s.dispose()));
function fixture(count = 128): ArrayBuffer {
  const bytes = new Uint8Array(count * 32),
    view = new DataView(bytes.buffer);
  for (let i = 0; i < count; i++) {
    view.setFloat32(i * 32, (i % 16) * 0.02, true);
    view.setFloat32(i * 32 + 4, Math.floor(i / 16) * 0.02, true);
    view.setFloat32(i * 32 + 8, -2, true);
    for (let d = 0; d < 3; d++)
      view.setFloat32(i * 32 + 12 + d * 4, 0.015, true);
    bytes.set([180, 90, 30, 220, 255, 128, 128, 128], i * 32 + 24);
  }
  return bytes.buffer;
}
function harness(transfer = false) {
  const backend = new SparkGaussianBackend({
    streaming: { maxUploadBytesPerUpdate: 1024 },
  });
  const events: BackendResponse[] = [];
  backend.subscribe((event) =>
    events.push(
      transfer
        ? structuredClone(event, { transfer: transferBuffers(event) })
        : event,
    ),
  );
  const scheduler = new SerialRequestScheduler(backend);
  instances.push(scheduler);
  scheduler.start();
  const run = async (command: BackendCommand) => {
    events.length = 0;
    await scheduler.schedule(command);
    return events.slice();
  };
  const load = (id = "cloud") =>
    run({
      id: `load-${id}`,
      type: "load-cloud-from-buffer",
      cloudId: id,
      buffer: fixture(),
      options: {
        format: "splat",
        mipmaps: { type: "standard", snapshot: { maxLeaves: 16 } },
      },
    });
  const camera = new PerspectiveCamera(50, 1, 0.01, 100);
  camera.updateMatrixWorld();
  const capabilities = (limit = 134217728) =>
    run({
      id: "caps",
      type: "set-frontend-capabilities",
      protocolVersion: 2,
      capabilities: {
        maxBufferSize: limit,
        maxStorageBufferBindingSize: limit,
        maxStorageBuffersPerShaderStage: 8,
        supportsPartialBufferUpdates: true,
        supportsCompactGaussians: true,
        supportsSparkSplats: true,
      },
      cloudTransforms: [],
      sceneRevision: 1,
      cameraWorldMatrix: camera.matrixWorld.elements,
      projectionMatrix: camera.projectionMatrix.elements,
      viewportWidth: 1024,
      viewportHeight: 1024,
    });
  const view = (id: string) =>
    run({
      id,
      type: "set-camera",
      sceneRevision: 2,
      worldMatrix: camera.matrixWorld.elements,
      projectionMatrix: camera.projectionMatrix.elements,
      viewportWidth: 1024,
      viewportHeight: 1024,
    });
  return { backend, run, load, capabilities, view, camera };
}

it("runs actual upstream decode/build/traversal and exports a bounded picking hierarchy", async () => {
  const h = harness();
  const events = await h.load();
  const loaded = events.find(
    (e) => e.payload?.type === "cloud-loaded",
  )!.payload;
  if (loaded?.type !== "cloud-loaded") throw new Error("missing cloud");
  expect(loaded.sourceCount).toBe(128);
  expect(loaded.mipmapSnapshot!.leafCount).toBeLessThanOrEqual(16);
  const index = new GaussianRaycastIndex(loaded.mipmapSnapshot!);
  expect(
    index.raycast(new Ray(new Vector3(0.1, 0.05, 0), new Vector3(0, 0, -1))),
  ).not.toBeNull();
  const output = await h.capabilities();
  const allocated = output.find(
    (e) => e.payload?.type === "buffers-allocated",
  )!.payload;
  expect(allocated).toMatchObject({
    shFormat: "spark-rgb8e8",
    sparkLodOpacity: true,
  });
  const patches = output.flatMap((e) =>
    e.payload?.type === "buffers-patched" ? [e.payload] : [],
  );
  expect(patches.length).toBeGreaterThan(1);
  expect(
    patches.every(
      (p) => p.patches.reduce((s, a) => s + a.data.byteLength, 0) <= 1024,
    ),
  ).toBe(true);
  const commits = output.filter(
    (e) => e.payload?.type === "buffers-activated" && e.payload.commit,
  );
  expect(commits).toHaveLength(1);
  const activation = commits[0]!.payload;
  if (activation?.type !== "buffers-activated")
    throw new Error("missing activation");
  expect(activation.changedClouds[0]!.renderedCount).toBeGreaterThan(0);
  expect(new Set(new Uint32Array(activation.addedSlots)).size).toBe(
    new Uint32Array(activation.addedSlots).length,
  );
});

it("transfers only owned messages and sends no geometry or layout for camera movement", async () => {
  const h = harness(true);
  await h.load();
  await h.capabilities();
  for (let i = 0; i < 4; i++) {
    h.camera.position.x += 0.05;
    h.camera.updateMatrixWorld();
    const events = await h.view(`view-${i}`);
    expect(
      events.filter((e) => e.payload && e.payload.type !== "buffers-activated"),
    ).toHaveLength(0);
  }
  const stationary = await h.view("stationary");
  expect(stationary.at(-1)!.metrics!.uploadedBytes).toBe(0);
});

it("rejects parallel execution and recovers after an unsupported operation", async () => {
  const h = harness();
  const pending = h.load();
  expect(() =>
    h.backend.dispatch({
      id: "parallel",
      type: "unload-cloud",
      cloudId: "cloud",
    }),
  ).toThrow("serial");
  await pending;
  await expect(
    h.run({
      id: "unsupported",
      type: "set-cloud-mipmaps",
      cloudId: "cloud",
      mipmaps: { type: "none" },
    }),
  ).rejects.toThrow("does not support");
  await h.capabilities();
  const events = await h.run({
    id: "unload",
    type: "unload-cloud",
    cloudId: "cloud",
  });
  expect(events.some((e) => e.payload?.type === "cloud-unloaded")).toBe(true);
});

it("checks the full resident layout against real device binding limits", async () => {
  const h = harness();
  await h.load();
  await expect(h.capabilities(64)).rejects.toThrow("exceeds device");
  await h.capabilities();
  expect((await h.view("after-failure")).at(-1)!.isFinal).toBe(true);
});

it("frees a failed decoder and accepts the following valid load", async () => {
  const h = harness();
  await expect(
    h.run({
      id: "corrupt",
      type: "load-cloud-from-buffer",
      cloudId: "broken",
      buffer: new Uint8Array([1, 2, 3]).buffer,
      options: { format: "ply" },
    }),
  ).rejects.toThrow();
  await h.load();
  await h.capabilities();
});

it("commits a new layout for a second cloud and releases each tree independently", async () => {
  const h = harness(true);
  await h.load("first");
  await h.capabilities();
  const addition = await h.load("second");
  const activation = addition.find(
    (e) => e.payload?.type === "buffers-activated" && e.payload.commit,
  )!.payload;
  if (activation?.type !== "buffers-activated")
    throw new Error("missing commit");
  expect(activation.changedClouds.map((c) => c.cloudId)).toEqual([
    "first",
    "second",
  ]);
  const unloaded = await h.run({
    id: "remove-first",
    type: "unload-cloud",
    cloudId: "first",
  });
  const after = unloaded.find(
    (e) => e.payload?.type === "buffers-activated" && e.payload.commit,
  )!.payload;
  if (after?.type !== "buffers-activated") throw new Error("missing commit");
  expect(after.changedClouds.map((c) => c.cloudId)).toEqual(["second"]);
  await h.view("after-unload");
});
