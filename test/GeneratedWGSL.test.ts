import { buildCompute } from "./helpers/buildCompute";
import { rasterDepthNodes } from "../sandbox/src/rasterDepthNodes";
import { describe, expect, it, vi } from "vitest";
import {
  DepthTexture,
  PerspectiveCamera,
  StorageBufferAttribute,
  StorageTexture,
  type WebGPURenderer,
} from "three/webgpu";
import {
  float,
  Fn,
  perspectiveDepthToViewZ,
  texture,
  uniform,
  vec3,
  vec4,
  mat4,
  bool,
} from "three/tsl";

import { GaussianData } from "../src/renderer/GaussianData";
import { GaussianLodColorHelper } from "../src/renderer/GaussianLodColorHelper";
import { GaussianPass } from "../src/renderer/GaussianPass";
import { packedStore } from "./helpers/packedStore";
import {
  createDefaultGaussianNodeSlots,
  gaussianColor,
  gaussianPositionLocal,
  gaussianPositionWorld,
  gaussianPositionView,
  gaussianCovarianceView,
  gaussianScreenPosition,
  gaussianPassViewport,
  rasterAccumulatedAlpha,
  rasterOutputDepth,
  rasterOutputValid,
  gaussianIndex,
  rasterGaussianIndex,
  rasterObjectId,
  gaussianProjectedArea,
  rasterGaussianColor,
  rasterGaussianOpacity,
  rasterPixelCoordinate,
  rasterPower,
  rasterUV,
  rasterViewDepth,
} from "../src/renderer/nodes/GaussianContextNodes";
import { gaussianProjectionResult } from "../src/renderer/nodes/GaussianProjectionNodes";
import { FrameUniforms } from "../src/renderer/pipeline/FrameUniforms";
import { ObjectFrameState } from "../src/renderer/pipeline/ObjectFrameState";
import { ProjectionStage } from "../src/renderer/pipeline/ProjectionStage";
import { ProfileDiagnosticsStage } from "../src/renderer/pipeline/ProfileDiagnosticsStage";
import { TileRasterizer } from "../src/renderer/pipeline/TileRasterizer";

describe("generated Gaussian WGSL", () => {
  it("decodes compact geometry with seven shape words and no shader-f16 feature", () => {
    const data = new GaussianData(
      {
        means: new StorageBufferAttribute(new Float32Array([1, 2, 3, 0]), 4),
        scalesOpacity: new StorageBufferAttribute(new Uint32Array(2), 2),
        rotations: new StorageBufferAttribute(new Uint32Array(1), 1),
        shCoefficients: new StorageBufferAttribute(new Uint32Array(1), 1),
      },
      {
        count: 1,
        geometryFormat: "compact",
        shFormat: "rgb8e8",
        activeSlots: new Uint32Array([0]),
      },
    );
    const camera = new PerspectiveCamera();
    const store = { clouds: [], objectCapacity: 1 } as any;
    const frame = new FrameUniforms(camera, [0, 0, 0, 0]);
    const objects = new ObjectFrameState(camera, store, 1);
    const projection = new ProjectionStage(
      data,
      frame,
      objects,
      "compensated",
      createDefaultGaussianNodeSlots(),
    );
    const shader = buildCompute((projection as any).computeNode);
    expect(shader).toContain("unpack2x16float");
    expect(shader).toContain("decodeCompactRotation");
    expect(shader).toContain("vec2<u32>");
    expect(shader).not.toContain("enable f16");
    expect(shader.match(/var<storage/g)?.length).toBeLessThanOrEqual(8);
    projection.dispose();
    objects.dispose();
    data.dispose();
  });

  it("rejects sparse holes before object reads even with an opacity override", () => {
    const nodes = createDefaultGaussianNodeSlots();
    nodes.gaussianOpacityNode = float(1);
    const source = buildPipeline(nodes).projectionSource;
    const guard = source.match(/if \( \( [^\n]+\.w < 0\.0 \) \) \{\s+return;/);
    expect(guard).not.toBeNull();
    const objectId = source.indexOf("u32(", guard!.index);
    expect(objectId).toBeGreaterThan(guard!.index!);
  });

  it("builds projection and raster TSL shells into compute shaders", () => {
    const data = oneGaussian();
    const { store } = packedStore(data);
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
      new StorageTexture(16, 16),
      frame,
      2_048,
      8_192,
      1,
      nodes,
      true,
      0.001,
      0.95,
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
    expect(rasterSource).toContain("> 0.95");
    expect(compositeSource).toContain("> 0.95");
    const countChunksSource = buildCompute(rasterInternals.chunks.countNode);
    const prepareChunksSource = buildCompute(
      rasterInternals.chunks.prepareNode,
    );
    const emitChunksSource = buildCompute(rasterInternals.chunks.emitNode);

    expect(projectionSource).toContain("perspective_gaussian_projection");
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
    // Viewport counts stay in uniforms, so resizing does not rebuild these graphs.
    expect(countChunksSource).toMatch(
      /count_raster_chunks\(\s*[^,]+,\s*\w+\.nodeUniform\d+/,
    );
    expect(prepareChunksSource).toMatch(
      /prepare_raster_chunk_dispatch\(\s*\w+\.nodeUniform\d+/,
    );
    expect(emitChunksSource).toMatch(
      /emit_raster_chunk_tasks\(\s*[^,]+,\s*\w+\.nodeUniform\d+/,
    );
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

  it("remaps projection, SH, custom attributes and raster access without an extra storage binding", () => {
    const nodes = createDefaultGaussianNodeSlots();
    nodes.gaussianColorNode = gaussianColor.mul(float(gaussianIndex.add(1)));
    nodes.rasterColorNode = rasterGaussianColor.mul(
      float(rasterGaussianIndex.add(1)),
    );
    nodes.rasterDiscardNode = rasterObjectId.equal(999);
    const { projectionSource, rasterSource, chunkSource } = buildPipeline(
      nodes,
      true,
      false,
      "float32",
      true,
    );
    expect(projectionSource).toContain("gaussianSourceSlot");
    expect(projectionSource).toContain("gaussianSourceSlot");
    expect(projectionSource).toMatch(
      /evaluate_gaussian_sh[^;]+gaussianSourceSlot/s,
    );
    expect(
      (projectionSource.match(/var<storage/g) ?? []).length,
    ).toBeLessThanOrEqual(8);
    for (const source of [rasterSource, chunkSource]) {
      expect(source).toContain("decode_active_slot");
      expect(source).toContain("rasterSourceSlot");
    }
  });

  it("uploads an empty cut and updates active indices independently for two projection pipelines", () => {
    const data = oneGaussian(true);
    const { store } = packedStore(data);
    const frame = new FrameUniforms(new PerspectiveCamera(), [0, 0, 0, 0]);
    const objects = new ObjectFrameState(
      new PerspectiveCamera(),
      store,
      data.count,
    );
    const first = new ProjectionStage(
      data,
      frame,
      objects,
      "compensated",
      createDefaultGaussianNodeSlots(),
    );
    const second = new ProjectionStage(
      data,
      frame,
      objects,
      "compensated",
      createDefaultGaussianNodeSlots(),
    );
    expect(
      buildCompute((first as unknown as { computeNode: unknown }).computeNode),
    ).toContain("decode_active_slot");
    const compute = vi.fn();
    const renderer = { compute } as unknown as WebGPURenderer;
    data.stageActivation(new Uint32Array(), new Uint32Array([0]), true);
    first.encode(renderer);
    expect(compute.mock.calls[0]![1]).toEqual([1, 1, 1]);
    data.stageActivation(new Uint32Array([0]), new Uint32Array(), true);
    first.encode(renderer);
    second.encode(renderer);
    for (const projection of [first, second]) {
      const bits = new Uint32Array(data.shCoefficients.array.buffer);
      expect(bits[4]).toBe(0x3f800000);
      expect(data.shCoefficients.updateRanges.length).toBeGreaterThan(0);
      projection.dispose();
    }
    objects.dispose();
    store.dispose();
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

  it("feeds resolved source overrides and view covariance to a custom projection without perspective rejection", () => {
    const nodes = createDefaultGaussianNodeSlots();
    nodes.gaussianPositionLocalNode = gaussianPositionLocal.add(
      vec3(11, 12, 13),
    );
    nodes.gaussianPositionWorldNode = gaussianPositionWorld.add(
      vec3(21, 22, 23),
    );
    nodes.gaussianScaleNode = vec3(2, 3, 4);
    nodes.gaussianRotationNode = vec4(0, 0, 1, 0);
    nodes.gaussianProjectionNode = gaussianProjectionResult(
      gaussianPositionView.xy.add(gaussianPassViewport.mul(0.5)),
      gaussianPositionView.length(),
      vec3(
        gaussianCovarianceView.mul(vec3(1, 0, 0)).x,
        gaussianCovarianceView.mul(vec3(1, 0, 0)).y,
        gaussianCovarianceView.mul(vec3(0, 1, 0)).y,
      ),
    );
    const source = buildPipeline(nodes).projectionSource;
    expect(source).not.toContain("perspective_gaussian_projection");
    expect(source).not.toContain("clip.w");
    expect(source).toMatch(
      /gaussianViewPosition = [^;]*gaussianPositionWorldValue/,
    );
    expect(source).toMatch(
      /gaussian_view_covariance\( gaussianScaleValue, gaussianRotationValue,/,
    );
    expect(source).toMatch(
      /gaussian_projection_result\([^;]*gaussianViewPosition[^;]*gaussianCovarianceViewValue/s,
    );
    expect(source).toContain("vec3<f32>( 11.0, 12.0, 13.0 )");
    expect(source).toContain("vec3<f32>( 21.0, 22.0, 23.0 )");
    expect(source).toContain("gaussian_projection_is_valid");
  });

  it("rejects derived and unavailable contexts at the projection root", () => {
    for (const center of [gaussianScreenPosition, rasterUV]) {
      const nodes = createDefaultGaussianNodeSlots();
      nodes.gaussianProjectionNode = gaussianProjectionResult(
        center,
        float(2),
        vec3(1, 0, 1),
      );
      expect(() => buildPipeline(nodes)).toThrow(/accessor/);
    }
    const nodes = createDefaultGaussianNodeSlots();
    nodes.gaussianProjectionNode = mat4(
      vec4(rasterOutputDepth),
      vec4(0),
      vec4(0),
      vec4(0),
    );
    expect(() => buildPipeline(nodes)).toThrow(/accessor/);
  });

  it("rejects unavailable accessors inside deferred Fn graphs", () => {
    const nodes = createDefaultGaussianNodeSlots();
    nodes.gaussianProjectionNode = Fn(() =>
      gaussianProjectionResult(gaussianScreenPosition, float(2), vec3(1, 0, 1)),
    )();
    expect(() => buildPipeline(nodes)).toThrow(/not available/);
    nodes.gaussianProjectionNode =
      createDefaultGaussianNodeSlots().gaussianProjectionNode;
    nodes.rasterOutputDepthNode = Fn(() => rasterViewDepth)();
    expect(() =>
      buildPipeline(nodes, true, false, "float32", false, true),
    ).toThrow(/not available/);
  });

  it("finalizes linear scalar output once after direct accumulation and chunk composition", () => {
    const nodes = createDefaultGaussianNodeSlots();
    nodes.rasterOutputDepthNode = rasterOutputDepth.mul(17);
    nodes.rasterOutputValidNode = rasterOutputValid.and(
      rasterAccumulatedAlpha.greaterThan(0.7),
    );
    const { rasterSource, chunkSource, compositeSource } = buildPipeline(
      nodes,
      true,
      false,
      "float32",
      false,
      true,
    );
    for (const source of [rasterSource, compositeSource]) {
      expect(source).toContain("rasterOutputDepthValue = 0.0;");
      expect(source).toMatch(
        /if \( \( rasterAccumulatedAlphaValue > 0\.0 \) \) \{\s+rasterOutputDepthValue =/,
      );
      expect(source).toContain("rasterOutputDepthValue * 17.0");
      expect(source).toContain("rasterEncodedDepthValue");
      expect(source).toContain("3.402823");
      expect(source).toMatch(/rasterEncodedDepth = \w+\.nodeUniform\d+;/);
      expect(source).not.toContain(" / ( nodeUniform");
    }
    expect(chunkSource).not.toContain("rasterEncodedDepthValue");
    expect(chunkSource).not.toContain("17.0");
  });

  it("rejects candidate accessors in final outputs and final outputs in candidate graphs", () => {
    for (const field of [
      "rasterOutputDepthNode",
      "rasterOutputValidNode",
    ] as const) {
      const nodes = createDefaultGaussianNodeSlots();
      nodes[field] =
        field === "rasterOutputDepthNode"
          ? rasterViewDepth
          : rasterViewDepth.greaterThan(0);
      expect(() =>
        buildPipeline(nodes, true, false, "float32", false, true),
      ).toThrow(/not available/);
    }
    const nodes = createDefaultGaussianNodeSlots();
    nodes.rasterAlphaNode = rasterAccumulatedAlpha;
    expect(() => buildPipeline(nodes)).toThrow(/accessor/);
    nodes.rasterAlphaNode = float(1);
    nodes.rasterOutputValidNode = bool(false);
    expect(
      buildPipeline(nodes, true, false, "float32", false, true).rasterSource,
    ).toContain("false");
  });

  it("uses shared boundary rules in projection and both raster paths", () => {
    const { projectionSource, rasterSource, chunkSource } = buildPipeline(
      createDefaultGaussianNodeSlots(),
    );
    expect(projectionSource).toContain("gaussian_boundary_tile_hit");
    expect(projectionSource).toContain("boundary_axis == 1u");
    for (const source of [rasterSource, chunkSource]) {
      expect(source).toContain("gaussian_boundary_delta");
      expect(source).toContain("let optimum = -conic.y * delta.y / conic.x");
    }
  });

  it("loads external scene depth once per pixel before Gaussian iteration", () => {
    const nodes = createDefaultGaussianNodeSlots();
    const sceneDepth = texture(new DepthTexture(16, 16)).load(
      rasterPixelCoordinate,
    );
    Object.assign(
      nodes,
      rasterDepthNodes(
        perspectiveDepthToViewZ(
          sceneDepth,
          uniform(0.01),
          uniform(10_000),
        ).negate(),
        "float32",
      ),
    );

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

  it("keeps cached depth but discards individual splats with packed sorting", () => {
    const nodes = createDefaultGaussianNodeSlots();
    Object.assign(
      nodes,
      rasterDepthNodes(
        texture(new DepthTexture(16, 16)).load(rasterPixelCoordinate),
        "packed16",
      ),
    );
    const { rasterSource, chunkSource } = buildPipeline(
      nodes,
      true,
      false,
      "packed16",
    );
    for (const source of [rasterSource, chunkSource]) {
      expect(source.match(/textureLoad/g)).toHaveLength(1);
      expect(source).toMatch(
        /if \( \( rasterPixelValue < [^\n]+\) \) \{\s+continue;/,
      );
    }
  });

  it("emits expensive work counters only when explicitly enabled", () => {
    const nodes = createDefaultGaussianNodeSlots();
    const enabled = buildPipeline(nodes, true, true);
    const disabled = buildPipeline(nodes);
    for (const key of ["rasterSource", "chunkSource"] as const) {
      expect(enabled[key]).toContain("atomicAdd");
      expect(enabled[key]).toContain("rasterChecked");
      expect(disabled[key]).not.toContain("atomicAdd");
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
    const { store } = packedStore(data);
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
    const { store } = packedStore(oneGaussian());
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
  rasterStats = false,
  mode: "float32" | "packed16" = "float32",
  activeSlots = false,
  outputDepth = false,
) {
  const data = oneGaussian(activeSlots);
  const { store } = packedStore(data);
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
  const rasterizer = new TileRasterizer(
    {} as never,
    packed.count,
    2,
    mode,
    packed.means,
    projection.projectedMean,
    projection.projectedConic,
    projection.projectedColor,
    attribute(new Uint32Array(4)),
    attribute(new Uint32Array(8)),
    new StorageTexture(16, 16),
    outputDepth ? new StorageTexture(16, 16) : null,
    frame,
    null,
    8_192,
    1,
    nodes,
    rasterStats,
  );

  return {
    projectionSource: buildCompute(
      (projection as unknown as { computeNode: unknown }).computeNode,
    ),
    rasterSource: buildCompute(
      (rasterizer as unknown as { computeNode: unknown }).computeNode,
    ),
    compositeSource: buildCompute((rasterizer as any).compositeNode),
    chunkSource: buildCompute(
      (rasterizer as unknown as { chunkComputeNode: unknown }).chunkComputeNode,
    ),
  };
}

function attribute(array: Float32Array | Uint32Array): StorageBufferAttribute {
  return new StorageBufferAttribute(array, 2);
}

function oneGaussian(activeSlots = false): GaussianData {
  const vec4 = (values: readonly number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  return new GaussianData(
    {
      means: vec4([0, 0, -2, 0]),
      scalesOpacity: vec4([1, 1, 1, 1]),
      rotations: vec4([0, 0, 0, 1]),
      shCoefficients: vec4([0, 0, 0, 0]),
    },
    { count: 1, activeSlots: activeSlots ? new Uint32Array([0]) : undefined },
  );
}
