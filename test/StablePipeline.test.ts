import { expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
  StorageTexture,
  type WebGPURenderer,
} from "three/webgpu";
import { GaussianData } from "../src/renderer/GaussianData";
import { GaussianPass } from "../src/renderer/GaussianPass";
import { float } from "three/tsl";
import { TiledGaussianPipeline } from "../src/renderer/pipeline/TiledGaussianPipeline";
import { createDefaultGaussianNodeSlots } from "../src/renderer/nodes/GaussianContextNodes";
import { packedStore } from "./helpers/packedStore";
import { buildCompute } from "./helpers/buildCompute";

it("keeps nodes and WGSL through three models, SH degree changes and scan/radix boundaries", () => {
  const fixture = packedStore(model(1));
  const scene = new Scene();
  scene.add(fixture.cloud);
  const renderer = { compute: vi.fn() } as unknown as WebGPURenderer;
  const p = pipeline(renderer, fixture.store);
  const color = new StorageTexture(16, 16),
    depth = new StorageTexture(16, 16);
  p.prepareFrame(16, 16, color, depth);
  const tiledNodes = () =>
    p.getComputeNodes().slice(p.accumulation.getComputeNodes().length);
  const nodes = tiledNodes();
  const shaders = nodes.map(buildCompute);
  for (const [count, degree] of [
    [600, 1],
    [800, 2],
  ] as const) {
    scene.add(fixture.add(model(count, degree)));
    p.updateData(fixture.store.getPackedData());
    p.prepareFrame(16, 16, color, depth);
    expect(tiledNodes()).toEqual(nodes);
    expect(tiledNodes().map(buildCompute)).toEqual(shaders);
    expect(p.frame.activeCount.value).toBe(
      fixture.store.getPackedData().activeCount,
    );
  }
  p.resizeIntersections(32768, color, depth);
  p.prepareFrame(640, 16, color, depth);
  expect(tiledNodes()).toEqual(nodes);
  expect(tiledNodes().map(buildCompute)).toEqual(shaders);
  expect(p.getDebugInfo()).toMatchObject({ tileStageRebuilds: 1 });
  p.dispose();
  fixture.store.dispose();
  color.dispose();
  depth.dispose();
});

it("retains sufficient projection and intersection resources when a smaller layout is rebound", () => {
  const first = packedStore(model(1000)),
    second = packedStore(model(2, 3));
  new Scene().add(first.cloud);
  const p = pipeline(
    { compute: vi.fn() } as unknown as WebGPURenderer,
    first.store,
  );
  const color = new StorageTexture(16, 16);
  p.prepareFrame(16, 16, color, null);
  const previous = p.getResources()!;
  p.updateData(second.store.getPackedData());
  const next = p.getResources()!;
  expect(next.projectedConic).toBe(previous.projectedConic);
  expect(next.projectedColor).toBe(previous.projectedColor);
  expect(next.sortedIntersections).toBe(previous.sortedIntersections);
  expect(next.visibleOffsets).toBe(previous.visibleOffsets);
  expect(p.frame.activeCount.value).toBe(2);
  p.dispose();
  first.store.dispose();
  second.store.dispose();
  color.dispose();
});

it("keeps old source resources alive until all consuming passes release their leases", () => {
  const data = model(1);
  const disposed = vi.fn();
  for (const attr of [
    data.means,
    data.scalesOpacity,
    data.rotations,
    data.shCoefficients,
  ])
    attr.addEventListener("dispose", disposed);
  data.retain();
  data.retain();
  data.dispose();
  expect(disposed).not.toHaveBeenCalled();
  data.release();
  expect(disposed).not.toHaveBeenCalled();
  data.release();
  expect(disposed).toHaveBeenCalledTimes(4);
});

it("distinguishes storage format changes from runtime SH degree changes", () => {
  const f = packedStore(model(1));
  const p = pipeline(
    { compute: vi.fn() } as unknown as WebGPURenderer,
    f.store,
  );
  expect(p.compatible(model(2, 3))).toBe(true); // Tiled input is always world-space float32.
  const degree = packedStore(model(2, 3));
  expect(p.compatible(degree.store.getPackedData())).toBe(true);
  p.dispose();
  f.store.dispose();
  degree.store.dispose();
});

it("keeps tiled projection when only cloud input SH schema changes", () => {
  const fixture = packedStore(model(2));
  const p = pipeline(
    { compute: vi.fn() } as unknown as WebGPURenderer,
    fixture.store,
  );
  const color = new StorageTexture(16, 16);
  p.prepareFrame(16, 16, color, null);
  const previous = p.getComputeNodes();
  const raw = model(2, 3);
  p.updateData(raw);
  p.prepareFrame(16, 16, color, null);
  const next = p.getComputeNodes();
  expect(next[0]).not.toBe(previous[0]); // Per-cloud material input changed.
  expect(next.slice(1)).toEqual(previous.slice(1));
  expect(p.getShaderGeneration()).toBe(2); // One initial and one replacement cloud graph.
  expect(buildCompute(next[0])).toContain("array< vec4<f32> >");
  p.dispose();
  raw.dispose();
  fixture.store.dispose();
  color.dispose();
});

it("places mutable storage in a texture-free binding group", async () => {
  const { StorageBindings } =
    await import("../src/renderer/pipeline/StorageBindings");
  const first = new StorageBufferAttribute(new Uint32Array(1), 1);
  const next = new StorageBufferAttribute(new Uint32Array(8), 1);
  const bindings = new StorageBindings();
  const node = bindings.storage(first, "uint");
  expect(node.groupNode.name).toBe("gaussianStorage");
  expect(node.groupNode.updateType).toBe("object");
  bindings.replace(first, next);
  expect(node.value).toBe(next);
  expect(node.bufferCount).toBe(8);
  first.dispose();
  next.dispose();
});

it("shares warmup before and after a configured shader change, using zero dispatch and tiny buffers", async () => {
  const fixture = packedStore(model(600));
  const compute = vi.fn();
  const renderer = {
    hasFeature: () => false,
    init: vi.fn(async () => undefined),
    initRenderTarget: vi.fn(),
    compute,
    backend: {
      device: {
        limits: {
          maxBufferSize: 134217728,
          maxStorageBufferBindingSize: 134217728,
          maxComputeWorkgroupsPerDimension: 65535,
        },
        queue: { onSubmittedWorkDone: async () => undefined },
        pushErrorScope: vi.fn(),
        popErrorScope: vi.fn(async () => null),
      },
    },
  } as unknown as WebGPURenderer;
  const pass = new GaussianPass(
    renderer,
    new PerspectiveCamera(),
    fixture.store,
    { dataMode: "external", outputDepth: true },
  );
  const initial = pass.warmup();
  expect(pass.warmup()).toBe(initial);
  await initial;
  expect(pass.intersectionCapacity).toBe(1);
  expect(pass.getResources()!.projectedConic.count).toBe(1);
  expect(compute.mock.calls.length).toBeGreaterThan(50);
  expect(
    compute.mock.calls.every(([, dispatch]) =>
      dispatch.every((value: number) => value === 0),
    ),
  ).toBe(true);
  pass.gaussianOpacityNode = float(0.2);
  const updated = pass.warmup();
  expect(updated).not.toBe(initial);
  expect(pass.warmup()).toBe(updated);
  await updated;
  expect(pass.warmup()).toBe(updated);
  pass.dispose();
  fixture.store.dispose();
});

function pipeline(
  renderer: WebGPURenderer,
  store: ReturnType<typeof packedStore>["store"],
) {
  return new TiledGaussianPipeline(
    renderer,
    new PerspectiveCamera(),
    store.getPackedData(),
    store,
    "float32",
    "compensated",
    4096,
    [0, 0, 0, 0],
    false,
    null,
    256,
    true,
    "workgroup",
    createDefaultGaussianNodeSlots(),
  );
}
function model(count: number, degree: 0 | 1 | 2 | 3 = 0) {
  const attr = (v: number[]) =>
    new StorageBufferAttribute(
      new Float32Array(Array.from({ length: count }, () => v).flat()),
      4,
    );
  return new GaussianData(
    {
      means: attr([0, 0, -4, 0]),
      scalesOpacity: attr([0.1, 0.1, 0.1, 0.4]),
      rotations: attr([0, 0, 0, 1]),
      shCoefficients: new StorageBufferAttribute(
        new Float32Array(count * (degree + 1) ** 2 * 4),
        4,
      ),
    },
    {
      count,
      shDegree: degree,
      activeSlots: new Uint32Array(Array.from({ length: count }, (_, i) => i)),
      ownsBuffers: true,
    },
  );
}
