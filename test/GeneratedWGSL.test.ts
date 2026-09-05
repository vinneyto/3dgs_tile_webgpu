import { describe, expect, it, vi } from "vitest";
import {
  DepthTexture,
  PerspectiveCamera,
  StorageBufferAttribute,
  StorageTexture,
  type WebGPURenderer,
  WGSLNodeBuilder,
} from "three/webgpu";
import {
  context,
  perspectiveDepthToViewZ,
  texture,
  uniform,
  vec3,
} from "three/tsl";

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
  rasterPixelValue,
  rasterPixelCoordinate,
  rasterPower,
  rasterUV,
  rasterViewDepth,
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
  it.each([false, true])(
    "splits only raster dispatch when rasterSubtiles=%s",
    (split) => {
      const result = buildPipeline(
        createDefaultGaussianNodeSlots(),
        true,
        split,
      );
      const size = split ? 8 : 16;
      expect(result.projectionSource).toContain("* 16.0");
      for (const source of [result.rasterSource, result.chunkSource]) {
        expect(source).toContain(`@workgroup_size( ${size}, ${size}, 1 )`);
        expect(source).toContain(`+= ${size * size} )`);
        expect(source).not.toContain("raster_block_mask");
        if (split) expect(source).toContain("workgroupId.z * 64u");
      }
      expect(result.compositeSource).toContain("@workgroup_size( 16, 16, 1 )");
      expect(result.partialCount).toBe(256);
      expect(result.prepareSource).toContain(
        `vec4<u32>(count, 1u, ${split ? 4 : 1}u, 0u)`,
      );
      result.rasterizer.encode(2, 3);
      expect(result.compute).toHaveBeenCalledWith(expect.anything(), [
        2,
        3,
        split ? 4 : 1,
      ]);
      expect(result.compute).toHaveBeenLastCalledWith(
        expect.anything(),
        [2, 3, 1],
      );
    },
  );
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
      2_048,
      8_192,
      1,
      nodes,
      true,
      0.001,
    );

    const projectionSource = buildCompute(
      (projection as unknown as { computeNode: unknown }).computeNode,
    );
    const rasterSource = buildCompute(
      (rasterizer as unknown as { computeNode: unknown }).computeNode,
    );
    const rasterInternals = rasterizer as unknown as {
      clearMetrics: unknown;
      chunkComputeNode: unknown;
      compositeNode: unknown;
      chunks: {
        countNode: unknown;
        prepareNode: unknown;
        emitNode: unknown;
      };
    };
    const chunkSource = buildCompute(rasterInternals.chunkComputeNode);
    expect(buildCompute(rasterInternals.clearMetrics)).toContain("atomicStore");
    expect(rasterSource).toContain("rasterChecked");
    expect(rasterSource).toContain("rasterBlended");
    expect(rasterSource).toContain("atomicAdd");
    expect(chunkSource).toContain("atomicAdd");
    const compositeSource = buildCompute(rasterInternals.compositeNode);
    expect(compositeSource).toContain("atomicAdd");
    for (const source of [rasterSource, chunkSource, compositeSource]) {
      expect(source).toContain("< 0.001");
      expect(source).not.toContain("< 0.0001");
    }
    const countChunksSource = buildCompute(rasterInternals.chunks.countNode);
    const prepareChunksSource = buildCompute(
      rasterInternals.chunks.prepareNode,
    );
    const emitChunksSource = buildCompute(rasterInternals.chunks.emitNode);

    expect(projectionSource).toContain(
      "project_gaussian_covariance_compensated",
    );
    expect(projectionSource).toContain("count_contributing_tiles");
    expect(projectionSource).toContain("subpixel_has_sample");
    expect(rasterSource).toContain("compact_morton_bits_16");
    expect(rasterSource).toContain("rasterTileSampleCount");
    expect(rasterSource).toContain("floor");
    expect(rasterSource).toContain("2048u");
    expect(rasterSource).toContain("workgroupBarrier");
    expect(chunkSource).toContain("rasterSampleStart");
    expect(chunkSource).toContain("8192u");
    expect(compositeSource).toContain("chunkCompositeTransmittance");
    expect(countChunksSource).toContain("count_raster_chunks");
    expect(prepareChunksSource).toContain("prepare_raster_chunk_dispatch");
    expect(emitChunksSource).toContain("emit_raster_chunk_tasks");
    expect(projectionSource).not.toMatch(/return;\s*return;/);
    expect(rasterSource).not.toMatch(/continue;\s*continue;/);
    expect(rasterSource).not.toMatch(/break;\s*break;/);

    const batchSync = rasterSource.indexOf("hasNextBatch = load_shared_active");
    const batchRead = rasterSource.indexOf(
      "for ( var i : u32 = 0u;",
      batchSync,
    );
    expect(batchSync).toBeGreaterThan(-1);
    expect(batchRead).toBeGreaterThan(batchSync);

    const pixelSetup = rasterSource.indexOf("rasterActivePixel =");
    const outerLoop = rasterSource.indexOf(
      "for ( var i : u32 = 0u; i < rasterSampleEnd;",
    );
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

    const { projectionSource, rasterSource, chunkSource } =
      buildPipeline(nodes);

    expect(projectionSource).toContain("vec3<f32>( 1.0, 0.75, 0.5 )");
    expect(rasterSource).toContain("0.25");
    expect(rasterSource).toContain("vec3<f32>");
    expect(chunkSource).toContain("0.25");
  });

  it("loads external scene depth once per pixel before Gaussian iteration", () => {
    const nodes = createDefaultGaussianNodeSlots();
    const sceneDepth = texture(new DepthTexture(16, 16)).load(
      rasterPixelCoordinate,
    );
    nodes.rasterPixelValueNode = perspectiveDepthToViewZ(
      sceneDepth,
      uniform(0.01),
      uniform(10_000),
    ).negate();
    nodes.rasterBreakNode = rasterPixelValue.lessThan(rasterViewDepth);

    const { rasterSource, chunkSource } = buildPipeline(nodes);
    expect(rasterSource).not.toContain("atomicAdd");
    expect(chunkSource).not.toContain("rasterChecked");

    for (const source of [rasterSource, chunkSource]) {
      const textureLoad = source.indexOf("textureLoad");
      const gaussianIteration = source.indexOf("for (", textureLoad);
      expect(textureLoad).toBeGreaterThan(-1);
      expect(gaussianIteration).toBeGreaterThan(textureLoad);
      expect(source.match(/textureLoad/g)).toHaveLength(1);
      expect(source.slice(gaussianIteration)).toMatch(
        /rasterPixelValue[\s\S]*done = true;[\s\S]*break;/,
      );
    }
  });

  it("rejects per-Gaussian accessors in the pixel-scoped node", () => {
    const nodes = createDefaultGaussianNodeSlots();
    nodes.rasterPixelValueNode = rasterViewDepth;

    expect(() => buildPipeline(nodes)).toThrow(
      /rasterPixelValueNode uses a context accessor that is not available/,
    );
  });

  it("omits subpixel sample culling when disabled", () => {
    const nodes = createDefaultGaussianNodeSlots();
    const enabled = buildPipeline(nodes, true).projectionSource;
    const disabled = buildPipeline(nodes, false).projectionSource;

    expect(enabled).toContain("subpixel_has_sample");
    expect(disabled).not.toContain("subpixel_has_sample");
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
      null,
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
  subpixelSampleCulling = true,
  split = false,
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
    subpixelSampleCulling,
  );
  const compute = vi.fn();
  const rasterizer = new TileRasterizer(
    { compute } as never,
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
    null,
    8_192,
    1,
    nodes,
    false,
    1e-4,
    split,
  );

  return {
    rasterizer,
    compute,
    partialCount: (
      rasterizer as unknown as {
        chunks: { partialData: StorageBufferAttribute };
      }
    ).chunks.partialData.count,
    prepareSource: buildCompute(
      (rasterizer as unknown as { chunks: { prepareNode: unknown } }).chunks
        .prepareNode,
    ),
    compositeSource: buildCompute(
      (rasterizer as unknown as { compositeNode: unknown }).compositeNode,
    ),
    projectionSource: buildCompute(
      (projection as unknown as { computeNode: unknown }).computeNode,
    ),
    rasterSource: buildCompute(
      (rasterizer as unknown as { computeNode: unknown }).computeNode,
    ),
    chunkSource: buildCompute(
      (rasterizer as unknown as { chunkComputeNode: unknown }).chunkComputeNode,
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
