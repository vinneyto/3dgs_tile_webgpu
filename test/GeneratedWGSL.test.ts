import { describe, expect, it } from "vitest";
import {
  PerspectiveCamera,
  StorageBufferAttribute,
  StorageTexture,
  type WebGPURenderer,
  WGSLNodeBuilder,
} from "three/webgpu";
import { context, vec3 } from "three/tsl";

import { GaussianData } from "../src/GaussianData";
import { GaussianLodColorHelper } from "../src/GaussianLodColorHelper";
import { GaussianPass } from "../src/GaussianPass";
import { GaussianStore } from "../src/GaussianStore";
import {
  createDefaultGaussianNodeSlots,
  gaussianColor,
  gaussianProjectedArea,
  rasterGaussianColor,
  rasterGaussianOpacity,
  rasterPower,
  rasterUV,
} from "../src/nodes/GaussianContextNodes";
import { FrameUniforms } from "../src/pipeline/FrameUniforms";
import { ObjectFrameState } from "../src/pipeline/ObjectFrameState";
import { ProjectionStage } from "../src/pipeline/ProjectionStage";
import { ProfileDiagnosticsStage } from "../src/pipeline/ProfileDiagnosticsStage";
import { TileRasterizer } from "../src/pipeline/TileRasterizer";

const TEST_LIMITS = {
  maxStorageBufferBindingSize: 1_073_741_824,
  maxBufferSize: 1_073_741_824,
};

describe("generated Gaussian WGSL", () => {
  it("builds projection and raster TSL shells into compute shaders", () => {
    const data = oneGaussian();
    const store = new GaussianStore();
    store.add(data);
    store.pack({ limits: TEST_LIMITS });
    const packed = store.getPackedData();
    const camera = new PerspectiveCamera();
    const frame = new FrameUniforms(camera, [0, 0, 0, 0]);
    const objects = new ObjectFrameState(camera, store, packed.count);
    const nodes = createDefaultGaussianNodeSlots();
    const projection = new ProjectionStage(
      packed,
      frame,
      objects,
      "compensated",
      nodes,
    );
    const records = attribute(new Uint32Array(4));
    const offsets = attribute(new Uint32Array(8));
    const rasterizer = new TileRasterizer(
      {} as never,
      packed.count,
      2,
      "float32",
      packed.means,
      projection.projectedMean,
      projection.projectedConic,
      projection.projectedColor,
      records,
      offsets,
      new StorageTexture(16, 16),
      null,
      frame,
      nodes,
    );

    const projectionSource = buildCompute(
      (projection as unknown as { computeNode: unknown }).computeNode,
    );
    const rasterSource = buildCompute(
      (rasterizer as unknown as { computeNode: unknown }).computeNode,
    );

    expect(projectionSource).toContain(
      "project_gaussian_covariance_compensated",
    );
    expect(projectionSource).toContain("count_contributing_tiles");
    expect(rasterSource).toContain("compact_morton_bits_16");
    expect(rasterSource).toContain("workgroupBarrier");
    expect(projectionSource).not.toMatch(/return;\s*return;/);
    expect(rasterSource).not.toMatch(/continue;\s*continue;/);
    expect(rasterSource).not.toMatch(/break;\s*break;/);

    const batchSync = rasterSource.indexOf("hasNextBatch = load_shared_active");
    const batchRead = rasterSource.indexOf("for ( var i : u32 = 0u;");
    expect(batchSync).toBeGreaterThan(-1);
    expect(batchRead).toBeGreaterThan(batchSync);

    const pixelSetup = rasterSource.indexOf("rasterActivePixel =");
    const outerLoop = rasterSource.indexOf("for ( var i : u32 = NodeBuffer_");
    const outputStore = rasterSource.lastIndexOf("textureStore(");
    expect(pixelSetup).toBeGreaterThan(-1);
    expect(outerLoop).toBeGreaterThan(pixelSetup);
    expect(outputStore).toBeGreaterThan(outerLoop);
  });

  it("builds representative custom projection and raster graphs", () => {
    const nodes = createDefaultGaussianNodeSlots();
    nodes.gaussianColorNode = gaussianColor.mul(vec3(1, 0.75, 0.5));
    nodes.gaussianVisibilityNode = gaussianProjectedArea.greaterThan(0);
    nodes.rasterColorNode = rasterGaussianColor.mul(
      vec3(rasterUV.x, rasterUV.y, 1),
    );
    nodes.rasterAlphaNode = rasterGaussianOpacity
      .mul(rasterPower.exp())
      .mul(rasterPower.mul(0.25).exp());
    nodes.rasterDiscardNode = rasterUV.x.lessThan(0);

    const { projectionSource, rasterSource } = buildPipeline(nodes);

    expect(projectionSource).toContain("vec3<f32>( 1.0, 0.75, 0.5 )");
    expect(rasterSource).toContain("0.25");
    expect(rasterSource).toContain("vec3<f32>");
  });

  it("builds the profiling-only subpixel coverage kernel", () => {
    const data = oneGaussian();
    const store = new GaussianStore();
    store.add(data);
    store.pack({ limits: TEST_LIMITS });
    const packed = store.getPackedData();
    const camera = new PerspectiveCamera();
    const frame = new FrameUniforms(camera, [0, 0, 0, 0]);
    const objects = new ObjectFrameState(camera, store, packed.count);
    const projection = new ProjectionStage(
      packed,
      frame,
      objects,
      "compensated",
      createDefaultGaussianNodeSlots(),
    );
    const diagnostics = new ProfileDiagnosticsStage(
      {} as never,
      packed.count,
      projection.projectedMean,
      projection.projectedConic,
      frame,
    );

    const source = buildCompute(
      (diagnostics as unknown as { computeNode: unknown }).computeNode,
    );

    expect(source).toContain("profile_subpixel_coverage");
    expect(source).toContain("zero_pixel_flags");
    expect(source).toContain("pixel_x");
  });

  it("mixes projected color with packed LOD tint in the rasterizer", () => {
    const store = new GaussianStore();
    store.add(oneGaussian());
    store.pack({ limits: TEST_LIMITS });
    const renderer = {
      hasFeature: () => false,
    } as unknown as WebGPURenderer;
    const pass = new GaussianPass(renderer, new PerspectiveCamera(), store);
    new GaussianLodColorHelper(pass, { tintStrength: 0.45 });
    const nodes = createDefaultGaussianNodeSlots();
    nodes.rasterColorNode = pass.rasterColorNode;
    const { projectionSource, rasterSource } = buildPipeline(nodes);

    expect(projectionSource).toContain("evaluate_gaussian_sh");
    expect(projectionSource.match(/var<storage/g)).toHaveLength(8);
    expect(rasterSource).toContain("% 3u");
    expect(rasterSource).toContain("0.45");
    expect(rasterSource.match(/var<storage/g)).toHaveLength(6);
  });
});

function buildPipeline(
  nodes: ReturnType<typeof createDefaultGaussianNodeSlots>,
) {
  const data = oneGaussian();
  const store = new GaussianStore();
  store.add(data);
  store.pack({ limits: TEST_LIMITS });
  const packed = store.getPackedData();
  const camera = new PerspectiveCamera();
  const frame = new FrameUniforms(camera, [0, 0, 0, 0]);
  const objects = new ObjectFrameState(camera, store, packed.count);
  const projection = new ProjectionStage(
    packed,
    frame,
    objects,
    "compensated",
    nodes,
  );
  const rasterizer = new TileRasterizer(
    {} as never,
    packed.count,
    2,
    "float32",
    packed.means,
    projection.projectedMean,
    projection.projectedConic,
    projection.projectedColor,
    attribute(new Uint32Array(4)),
    attribute(new Uint32Array(8)),
    new StorageTexture(16, 16),
    null,
    frame,
    nodes,
  );

  return {
    projectionSource: buildCompute(
      (projection as unknown as { computeNode: unknown }).computeNode,
    ),
    rasterSource: buildCompute(
      (rasterizer as unknown as { computeNode: unknown }).computeNode,
    ),
  };
}

function buildCompute(computeNode: unknown): string {
  const renderer = {
    backend: {
      isWebGPUBackend: true,
      utils: { getTextureSampleData: () => ({ primarySamples: 1 }) },
    },
    contextNode: context({}),
    coordinateSystem: 2000,
    getRenderTarget: () => null,
    getPixelRatio: () => 1,
    getDrawingBufferSize: () => ({ width: 16, height: 16 }),
    hasFeature: () => false,
    hasCompatibility: () => false,
  };
  const builder = new WGSLNodeBuilder(
    computeNode as never,
    renderer as never,
  ) as unknown as {
    build(): void;
    computeShader: string;
  };
  builder.build();
  return builder.computeShader;
}

function attribute(array: Float32Array | Uint32Array): StorageBufferAttribute {
  return new StorageBufferAttribute(array, 2);
}

function oneGaussian(): GaussianData {
  const vec4 = (values: readonly number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  return new GaussianData(
    {
      means: vec4([0, 0, -2, 0]),
      scalesOpacity: vec4([1, 1, 1, 1]),
      rotations: vec4([0, 0, 0, 1]),
      shCoefficients: vec4([0, 0, 0, 0]),
    },
    { count: 1 },
  );
}
