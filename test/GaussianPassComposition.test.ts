import { expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  Vector3,
  StorageBufferAttribute,
  StorageTexture,
  type WebGPURenderer,
} from "three/webgpu";
import { Fn, float, vec3, uniform } from "three/tsl";
import { GaussianData } from "../src/renderer/GaussianData";
import { composeGaussianPass } from "../src/renderer/composeGaussianPass";
import { gaussianPass } from "../src/renderer/createGaussianPass";
import { GaussianDataPass } from "../src/renderer/passes/GaussianDataPass";
import { GaussianTransformPass } from "../src/renderer/passes/GaussianTransformPass";
import { GaussianProjectionPass } from "../src/renderer/passes/GaussianProjectionPass";
import { GaussianOrderingPass } from "../src/renderer/passes/GaussianOrderingPass";
import { GaussianIntersectionPass } from "../src/renderer/passes/GaussianIntersectionPass";
import { GaussianRasterPass } from "../src/renderer/passes/GaussianRasterPass";
import { createGaussianPassComposition } from "../src/renderer/passes/createGaussianPassComposition";
import { TiledGaussianPipeline } from "../src/renderer/pipeline/TiledGaussianPipeline";
import {
  gaussianPositionLocal,
  gaussianPositionView,
} from "../src/renderer/nodes/GaussianContextNodes";
import { packedStore, TEST_FRONTEND } from "./helpers/packedStore";
import { StorageBindings } from "../src/renderer/pipeline/StorageBindings";
import { buildCompute } from "./helpers/buildCompute";

it("exposes the standard preset's typed producer connections and borrowed outputs", () => {
  const fixture = packedStore(model());
  const pass = gaussianPass(renderer(), new PerspectiveCamera(), fixture.store);
  const { data, projection, ordering, intersections, raster } = pass.passes;
  expect(projection.inputs.gaussians).toBe(data.output);
  expect(ordering.inputs.projection).toBe(projection.output);
  expect(intersections.inputs.ordering).toBe(ordering.output);
  expect(raster.inputs.intersections).toBe(intersections.output);
  expect(() => raster.output.read()).toThrow(/not prepared/);
  pass.render();
  expect(data.output.read()).toBe(fixture.store.getPackedData());
  expect(projection.output.read().projectedMean).toBe(
    pass.getResources()!.projectedMean,
  );
  expect(raster.output.read().color).toBe(pass.colorTexture);
  pass.dispose();
  expect(() => data.output.read()).toThrow(/disposed/);
  fixture.store.dispose();
});

it("rejects cross-graph inputs and shared pass ownership", () => {
  const fixture = packedStore(model());
  const a = createGaussianPassComposition(fixture.store),
    b = createGaussianPassComposition(fixture.store);
  expect(() =>
    composeGaussianPass(renderer(), new PerspectiveCamera(), {
      ...a,
      raster: b.raster,
    }),
  ).toThrow(/foreign producer/);
  const pass = composeGaussianPass(renderer(), new PerspectiveCamera(), a);
  expect(() =>
    composeGaussianPass(renderer(), new PerspectiveCamera(), a),
  ).toThrow(/another runtime/);
  pass.dispose();
  const replacement = composeGaussianPass(
    renderer(),
    new PerspectiveCamera(),
    a,
  );
  replacement.dispose();
  fixture.store.dispose();
});

it("materializes transformed buffers before projection and supplies the same means to rasterization", () => {
  const fixture = packedStore(model());
  const data = new GaussianTransformPass(fixture.store);
  const offset = uniform(new Vector3(1, 0, 0));
  data.nodes.positionNode = gaussianPositionLocal.add(offset);
  const graph = graphFrom(data);
  const r = renderer();
  const p = pipeline(r, fixture.store, graph);
  const color = new StorageTexture(16, 16);
  p.prepareFrame(16, 16, color, null);
  const prepared = data.output.read();
  expect(prepared.means).not.toBe(fixture.store.getPackedData().means);
  expect(prepared.geometryFormat).toBe("float32");
  expect(graph.projection.inputs.gaussians.read()).toBe(prepared);
  expect(graph.raster.inputs.gaussians.read()).toBe(prepared);
  const nodes = p.getComputeNodes();
  const shader = buildCompute(nodes[0]);
  expect(shader.match(/var<storage/g)).toHaveLength(6);
  expect(shader).toContain("read_write");
  // Builds the actual dependent graphs too, validating schema/binding changes.
  for (const node of nodes) expect(buildCompute(node)).toContain("@compute");
  p.render();
  expect(vi.mocked(r.compute).mock.calls[0]![0]).toBe(nodes[0]);
  expect(vi.mocked(r.compute).mock.calls[1]![0]).toBe(nodes[1]);
  data.nodes.positionNode = gaussianPositionLocal.add(vec3(2, 0, 0));
  p.rebuildData();
  const updated = p.getComputeNodes();
  expect(updated[0]).not.toBe(nodes[0]);
  expect(updated.slice(1)).toEqual(nodes.slice(1));
  p.dispose();
  fixture.store.dispose();
  color.dispose();
});

it("propagates active slots and buffer growth from a transformed data pass to its consumers", () => {
  const fixture = packedStore(model());
  const data = new GaussianTransformPass(fixture.store);
  const graph = graphFrom(data);
  const p = pipeline(renderer(), fixture.store, graph);
  const color = new StorageTexture(16, 16);
  p.prepareFrame(16, 16, color, null);
  const first = data.output.read();
  const source = fixture.store.getPackedData();
  source.stageActivation(
    new Uint32Array(),
    source.activeSlots!.slice(0, source.activeCount),
    true,
  );
  expect(data.output.read().activeCount).toBe(0);
  source.stageActivation(new Uint32Array([0]), new Uint32Array(), true);
  expect(data.output.read().activeCount).toBe(1);
  fixture.add(model(600));
  p.updateData(fixture.store.getPackedData());
  p.prepareFrame(640, 16, color, null);
  const next = data.output.read();
  expect(next.means).not.toBe(first.means);
  expect(next.activeCount).toBe(fixture.store.getPackedData().activeCount);
  expect(p.frame.activeCount.value).toBe(next.activeCount);
  expect(
    graph.projection.output.read().projectedConic.count,
  ).toBeGreaterThanOrEqual(next.count);
  for (const node of p.getComputeNodes())
    expect(buildCompute(node)).toContain("@compute");
  p.dispose();
  fixture.store.dispose();
  color.dispose();
});

it("rejects camera-dependent access in a data transform, including deferred Fn bodies", () => {
  const fixture = packedStore(model());
  const data = new GaussianTransformPass(fixture.store);
  data.nodes.positionNode = gaussianPositionView;
  expect(() => pipeline(renderer(), fixture.store, graphFrom(data))).toThrow(
    /not available/,
  );
  data.nodes.positionNode = Fn(() => gaussianPositionView)();
  const p = pipeline(renderer(), fixture.store, graphFrom(data));
  expect(() => buildCompute(p.getComputeNodes()[0])).toThrow(/not available/);
  p.dispose();
  fixture.store.dispose();
});

it("rebuilds only the logical pass that owns a changed node and retains legacy aliases", () => {
  const fixture = packedStore(model());
  const pass = gaussianPass(
    renderer(),
    new PerspectiveCamera(),
    fixture.store,
    { redrawStrategy: "auto" },
  );
  pass.render();
  const internal = (pass as unknown as { pipeline: TiledGaussianPipeline })
    .pipeline;
  const before = internal.getComputeNodes();
  pass.passes.projection.nodes.gaussianOpacityNode = float(0.2);
  expect(pass.gaussianOpacityNode).toBe(
    pass.passes.projection.nodes.gaussianOpacityNode,
  );
  pass.render();
  const projected = internal.getComputeNodes();
  expect(projected[0]).not.toBe(before[0]);
  expect(projected.slice(1)).toEqual(before.slice(1));
  pass.passes.raster.nodes.rasterDiscardNode = float(1).greaterThan(2);
  pass.render();
  const rasterized = internal.getComputeNodes();
  expect(internal.projection.getComputeNodes()[0]).toBe(projected[0]);
  expect(
    internal.depthSorter
      .getComputeNodes()
      .every((node) => rasterized.includes(node)),
  ).toBe(true);
  expect(rasterized.some((node, index) => node !== projected[index])).toBe(
    true,
  );
  pass.dispose();
  fixture.store.dispose();
});

it("decodes compact shapes in a camera-independent six-binding preparation shader", () => {
  const fixture = packedStore(model());
  const compact = new GaussianData(
    {
      means: new StorageBufferAttribute(new Float32Array([0, 0, -4, 0]), 4),
      scalesOpacity: new StorageBufferAttribute(
        new Uint32Array([0, 0x3c000000]),
        2,
      ),
      rotations: new StorageBufferAttribute(new Uint32Array([0]), 1),
      shCoefficients: new StorageBufferAttribute(new Uint32Array([0]), 1),
    },
    {
      count: 1,
      geometryFormat: "compact",
      shFormat: "rgb8e8",
      ownsBuffers: true,
    },
  );
  const pass = new GaussianTransformPass(fixture.store);
  const runtime = pass.createRuntime({
    source: compact,
    renderer: renderer(),
    bindings: new StorageBindings(),
  });
  const shader = buildCompute(runtime.getComputeNodes()[0]);
  expect(shader).toContain("decodeCompactScaleOpacity");
  expect(shader).toContain("decodeCompactRotation");
  expect(shader.match(/var<storage/g)).toHaveLength(6);
  expect(pass.output.read().geometryFormat).toBe("float32");
  expect(pass.output.read().shCoefficients).toBe(compact.shCoefficients);
  runtime.dispose();
  runtime.dispose();
  expect(pass.output.available).toBe(false);
  compact.dispose();
  fixture.store.dispose();
});

it("connects multiple data producers, forwards invalidation and releases the complete chain", () => {
  const fixture = packedStore(model());
  const first = new GaussianTransformPass(fixture.store);
  const second = new GaussianTransformPass(first.output);
  const passes = graphFrom(second);
  const pass = composeGaussianPass(
    renderer(),
    new PerspectiveCamera(),
    passes,
    { dataMode: "external", redrawStrategy: "auto", rasterChunkSize: null },
  );
  expect(second.inputs).toEqual({ gaussians: first.output });
  pass.render();
  pass.render();
  expect(pass.renderCount).toBe(1);
  first.nodes.positionNode = gaussianPositionLocal.add(vec3(1, 0, 0));
  pass.render();
  expect(pass.renderCount).toBe(2);
  first.invalidate();
  pass.render();
  expect(pass.renderCount).toBe(3);
  expect(() =>
    composeGaussianPass(renderer(), new PerspectiveCamera(), graphFrom(first)),
  ).toThrow(/another runtime/);
  pass.dispose();
  expect(first.output.available).toBe(false);
  expect(second.output.available).toBe(false);
  fixture.store.dispose();
});

function graphFrom(data: GaussianDataPass) {
  const projection = new GaussianProjectionPass(data.output);
  const ordering = new GaussianOrderingPass(data.output, projection.output);
  const intersections = new GaussianIntersectionPass(
    data.output,
    projection.output,
    ordering.output,
  );
  const raster = new GaussianRasterPass(
    data.output,
    projection.output,
    intersections.output,
  );
  return { data, projection, ordering, intersections, raster };
}
function pipeline(
  r: WebGPURenderer,
  store: ReturnType<typeof packedStore>["store"],
  passes: ReturnType<typeof graphFrom>,
) {
  return new TiledGaussianPipeline(
    r,
    new PerspectiveCamera(),
    store.getPackedData(),
    store,
    "float32",
    "compensated",
    4096,
    [0, 0, 0, 0],
    false,
    null,
    null,
    true,
    "workgroup",
    { ...passes.projection.nodes, ...passes.raster.nodes },
    1e-4,
    false,
    0.95,
    undefined,
    undefined,
    passes,
  );
}
function renderer(): WebGPURenderer {
  return {
    hasFeature: () => false,
    compute: vi.fn(),
    initRenderTarget: vi.fn(),
    getArrayBufferAsync: () => new Promise(() => {}),
    getDrawingBufferSize: (t: { set: (x: number, y: number) => unknown }) =>
      t.set(16, 16),
    backend: {
      device: {
        limits: { ...TEST_FRONTEND, maxComputeWorkgroupsPerDimension: 65535 },
      },
    },
  } as unknown as WebGPURenderer;
}
function model(count = 1) {
  const attribute = (values: number[]) =>
    new StorageBufferAttribute(
      new Float32Array(Array.from({ length: count }, () => values).flat()),
      4,
    );
  return new GaussianData(
    {
      means: attribute([0, 0, -2, 0]),
      scalesOpacity: attribute([1, 1, 1, 1]),
      rotations: attribute([0, 0, 0, 1]),
      shCoefficients: attribute([0, 0, 0, 0]),
    },
    {
      count,
      activeSlots: new Uint32Array(Array.from({ length: count }, (_, i) => i)),
      ownsBuffers: true,
    },
  );
}
