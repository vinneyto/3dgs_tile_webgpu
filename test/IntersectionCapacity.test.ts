import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  StorageBufferAttribute,
  StorageTexture,
  type WebGPURenderer,
} from "three/webgpu";
import { GaussianPass } from "../src/renderer/GaussianPass";
import { GaussianData } from "../src/renderer/GaussianData";
import { IntersectionCapacityPolicy } from "../src/renderer/pipeline/IntersectionCapacityPolicy";
import { packedStore } from "./helpers/packedStore";
import { buildCompute } from "./helpers/buildCompute";

import { TiledGaussianPipeline } from "../src/renderer/pipeline/TiledGaussianPipeline";

const limits = {
  maxStorageBufferBindingSize: 128 * 1024 * 1024,
  maxBufferSize: 256 * 1024 * 1024,
  maxComputeWorkgroupsPerDimension: 65_535,
  maxStorageBuffersPerShaderStage: 8,
} as GPUDevice["limits"];
const flush = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

it("uses a small reserve and allows sufficient growth near a hard limit", () => {
  const policy = new IntersectionCapacityPolicy(
    { maxIntersectionCapacity: 1000, initialIntersectionCapacity: 256 },
    limits,
    null,
    false,
  );
  expect(policy.next(512, 900)).toBe(1000);
  expect(policy.next(1000, 1001)).toBeNull();
  expect(new IntersectionCapacityPolicy({}, limits, 8192, true).initial).toBe(
    262_144,
  );
});

it("constrains chunk partials as well as records by the device binding limit", () => {
  const policy = new IntersectionCapacityPolicy({}, limits, 256, true);
  // A task stores 256 vec4 pixels and another vec4 per pixel for depth.
  const tasks = Math.ceil((2 * policy.maximum) / 256);
  expect(tasks * 256 * 32).toBeLessThanOrEqual(
    limits.maxStorageBufferBindingSize,
  );
  expect(
    () =>
      new IntersectionCapacityPolicy(
        { maxIntersectionCapacity: policy.maximum + 1 },
        limits,
        256,
        true,
      ),
  ).toThrow(/limits/);
  expect(
    () =>
      new IntersectionCapacityPolicy(
        { initialIntersectionCapacity: 12, intersectionCapacity: 16 },
        limits,
        null,
        false,
      ),
  ).toThrow(/combined/);
});

describe("asynchronous pass feedback", () => {
  it.each(["auto", "never"] as const)(
    "grows and retries a first overflowing %s frame without blocking",
    async (redrawStrategy) => {
      const f = fixture({
        redrawStrategy,
        initialIntersectionCapacity: 256,
        maxIntersectionCapacity: 4096,
      });
      f.pass.render();
      expect(f.read).toHaveBeenCalledOnce();
      expect(f.pass.getOutputStatus()).toMatchObject({
        valid: false,
        state: "awaiting-first-result",
      });
      f.pass.render();
      expect(f.read).toHaveBeenCalledOnce(); // at most one in flight
      f.resolve([1, 0, 700, 1]);
      await flush();
      expect(f.pass.getOutputStatus().state).toBe("overflow-pending");
      f.pass.render();
      expect(f.pass.intersectionCapacity).toBe(1024);
      expect(f.pipeline.resizeIntersections).toHaveBeenCalledOnce();
      expect(f.pipeline.render).toHaveBeenCalledTimes(2);
      f.resolve([2, 2, 700, 0]);
      await flush();
      expect(f.pass.getOutputStatus()).toMatchObject({
        valid: true,
        fresh: true,
        version: 2,
        growthCount: 1,
      });
      f.pass.dispose();
      f.store.dispose();
    },
  );

  it("checks feedback on cached frames when the interval skipped the last encoding", async () => {
    const clock = vi.spyOn(performance, "now").mockReturnValue(0);
    const f = fixture({
      redrawStrategy: "auto",
      intersectionReadbackInterval: 100,
    });
    f.pass.render();
    f.resolve([1, 1, 1, 0]);
    await flush();
    f.pass.invalidate();
    f.pass.render();
    expect(f.read).toHaveBeenCalledOnce();
    clock.mockReturnValue(101);
    f.pass.render();
    expect(f.read).toHaveBeenCalledTimes(2);
    f.resolve([2, 1, 900_000, 1]);
    await flush();
    expect(f.pass.getOutputStatus()).toMatchObject({
      state: "overflow-pending",
      version: 1,
      fresh: false,
    });
    f.pass.dispose();
    f.store.dispose();
    clock.mockRestore();
  });

  it("reports a hard limit without marking an overflowing result fresh", async () => {
    const f = fixture({ intersectionCapacity: 256 });
    f.pass.render();
    f.resolve([1, 0, 700, 1]);
    await flush();
    expect(f.pass.getOutputStatus()).toMatchObject({
      state: "budget-exceeded",
      valid: false,
      fresh: false,
    });
    f.pass.render();
    expect(f.pipeline.resizeIntersections).not.toHaveBeenCalled();
    f.pass.dispose();
    f.store.dispose();
  });

  it.each(["dispose", "resize"] as const)(
    "ignores feedback after %s",
    async (action) => {
      const f = fixture({ initialIntersectionCapacity: 256 });
      f.pass.render();
      if (action === "dispose") f.pass.dispose();
      else f.pass.setFixedSize(64, 64);
      f.resolve([1, 1, 700, 1]);
      await flush();
      expect(f.pass.getOutputStatus().growthCount).toBe(0);
      expect(f.pass.getOutputStatus().valid).toBe(false);
      if (action !== "dispose") f.pass.dispose();
      f.store.dispose();
    },
  );

  it("reports failed growth and stops using the incomplete replacement pipeline", async () => {
    const f = fixture({ initialIntersectionCapacity: 256 });
    f.pass.render();
    f.resolve([1, 0, 700, 1]);
    await flush();
    f.pipeline.resizeIntersections.mockImplementationOnce(() => {
      throw new Error("allocation failed");
    });
    f.pass.render();
    f.pass.render();
    expect(f.pipeline.render).toHaveBeenCalledOnce();
    expect(f.pass.getOutputStatus()).toMatchObject({
      state: "allocation-failed",
      valid: false,
    });
    f.pass.dispose();
    f.store.dispose();
  });
});

it("rebuilds capacity-dependent stages and keeps scene/projection/scan resources", () => {
  const f = fixture({ initialIntersectionCapacity: 256 });
  // Use the actual graph here, without allocating a browser GPU device.
  Object.assign(f.pass, { pipeline: null });
  f.pass.render();
  const p = (f.pass as unknown as { pipeline: TiledGaussianPipeline }).pipeline;
  const projection = p.projection,
    scan = p.scan,
    objects = p.objects;
  const previous = p.getResources()!.sortedIntersections;
  const disposed = vi.fn();
  previous.addEventListener("dispose", disposed);
  p.resizeIntersections(2048, new StorageTexture(32, 32), null);
  expect(p.projection).toBe(projection);
  expect(p.scan).toBe(scan);
  expect(p.objects).toBe(objects);
  expect(disposed).toHaveBeenCalledOnce();
  expect(p.getResources()!.sortedIntersections.count).toBe(2048);
  const stages = p as unknown as {
    intersections: {
      prepareNode: unknown;
      outputNode: unknown;
      emitNode: unknown;
    };
    rasterizer: unknown;
  };
  for (const node of [
    stages.intersections.prepareNode,
    stages.intersections.outputNode,
    stages.intersections.emitNode,
  ]) {
    expect(
      buildCompute(node).match(/var<storage/g)?.length,
    ).toBeLessThanOrEqual(8);
  }
  f.pass.dispose();
  f.store.dispose();
});

it("retries failed feedback without unhandled rejection", async () => {
  const f = fixture({ redrawStrategy: "auto" });
  f.read.mockRejectedValueOnce(new Error("device lost during readback"));
  f.pass.render();
  await flush();
  expect(f.pass.getOutputStatus()).toMatchObject({
    state: "readback-failed",
    valid: false,
  });
  f.pass.render();
  f.resolve([2, 2, 20, 0]);
  await flush();
  expect(f.pass.getOutputStatus()).toMatchObject({
    state: "ready",
    fresh: true,
    error: null,
  });
  f.pass.dispose();
  f.store.dispose();
});

it("grows independent passes from their own demand and keeps GPU readiness nodes stable", async () => {
  const a = fixture({ initialIntersectionCapacity: 256 });
  const b = fixture({ initialIntersectionCapacity: 256 });
  const nodeA = a.pass.outputReadyNode,
    nodeB = b.pass.outputReadyNode;
  a.pass.render();
  b.pass.render();
  a.resolve([1, 0, 700, 1]);
  b.resolve([1, 0, 300, 1]);
  await flush();
  a.pass.render();
  b.pass.render();
  expect(a.pass.intersectionCapacity).toBe(1024);
  expect(b.pass.intersectionCapacity).toBe(512);
  expect(a.pass.outputReadyNode).toBe(nodeA);
  expect(b.pass.outputReadyNode).toBe(nodeB);
  a.pass.dispose();
  b.pass.dispose();
  a.store.dispose();
  b.store.dispose();
});

it("ignores a response from a replaced layout", async () => {
  const f = fixture({ initialIntersectionCapacity: 256 });
  f.pass.render();
  Object.assign(f.pass, { pipelineLayoutVersion: -1 });
  f.pass.render();
  f.resolve([1, 1, 700, 1]);
  await flush();
  expect(f.pass.getOutputStatus()).toMatchObject({
    valid: false,
    growthCount: 0,
    requestedIntersections: 0,
  });
  f.pass.dispose();
  f.store.dispose();
});

function fixture(options: ConstructorParameters<typeof GaussianPass>[3]) {
  const attr = (v: number[]) =>
    new StorageBufferAttribute(new Float32Array(v), 4);
  const data = new GaussianData(
    {
      means: attr([0, 0, -2, 0]),
      scalesOpacity: attr([1, 1, 1, 1]),
      rotations: attr([0, 0, 0, 1]),
      shCoefficients: attr([0, 0, 0, 0]),
    },
    { count: 1 },
  );
  const { store } = packedStore(data);
  let resolve!: (buffer: ArrayBuffer) => void;
  const read = vi.fn(
    () =>
      new Promise<ArrayBuffer>((r) => {
        resolve = r;
      }),
  );
  const renderer = {
    hasFeature: () => false,
    backend: { device: { limits } },
    getDrawingBufferSize: (v: { set(x: number, y: number): unknown }) =>
      v.set(32, 32),
    initRenderTarget: vi.fn(),
    compute: vi.fn(),
    getArrayBufferAsync: read,
  } as unknown as WebGPURenderer;
  const pass = new GaussianPass(renderer, new PerspectiveCamera(), store, {
    dataMode: "external",
    ...options,
  });
  const pipeline = {
    prepareFrame: vi.fn(),
    render: vi.fn(),
    resizeIntersections: vi.fn(),
    rebuildProjection: vi.fn(),
    rebuildRasterizer: vi.fn(),
    dispose: vi.fn(),
  };
  Object.assign(pass, { pipeline, pipelineLayoutVersion: store.layoutVersion });
  return {
    pass,
    store,
    pipeline,
    read,
    resolve: (values: number[]) => resolve(new Uint32Array(values).buffer),
  };
}
