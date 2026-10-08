import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  StorageBufferAttribute,
  StorageTexture,
  type WebGPURenderer,
} from "three/webgpu";
import { GaussianData } from "../src/renderer/GaussianData";
import { createDefaultGaussianNodeSlots } from "../src/renderer/nodes/GaussianContextNodes";
import { TiledGaussianPipeline } from "../src/renderer/pipeline/TiledGaussianPipeline";
import { SuffixMinStage } from "../src/renderer/pipeline/SuffixMinStage";
import type { RasterChunkWorkspace } from "../src/renderer/pipeline/RasterChunkWorkspace";
import type { TileRasterizer } from "../src/renderer/pipeline/TileRasterizer";
import { packedStore } from "./helpers/packedStore";

describe("viewport resource reuse", () => {
  it.each([null, 512])(
    "retains stages across resizes with chunk size %s",
    (chunkSize) => {
      const { pipeline, color, depth, store } = fixture(chunkSize, true);
      pipeline.prepareFrame(272, 256, color, depth);
      const offsets = pipeline.getResources()!.tileOffsets;
      const rasterizer = internals(pipeline).rasterizer;
      const rebuilds = pipeline.getDebugInfo().tileStageRebuilds;
      expect(pipeline.getDebugInfo().tileCapacity).toBe(512);

      for (let width = 273; width < 330; width++) {
        color.setSize(width, 256, 1);
        depth!.setSize(width, 256, 1);
        pipeline.prepareFrame(width, 256, color, depth);
      }
      // Shrink, then restore without reallocating or reading the unused tail.
      pipeline.prepareFrame(1, 1, color, depth);
      expect(pipeline.frame.tileCount.value).toBe(1);
      pipeline.prepareFrame(272, 256, color, depth);
      expect(pipeline.getResources()!.tileOffsets).toBe(offsets);
      expect(internals(pipeline).rasterizer).toBe(rasterizer);
      expect(pipeline.getDebugInfo().tileStageRebuilds).toBe(rebuilds);
      expect(pipeline.frame.tileCount.value).toBe(272);
      pipeline.dispose();
      store.dispose();
    },
  );

  it.each([false, true])(
    "retains large chunk buffers on capacity growth, depth=%s",
    (outputDepth) => {
      const { pipeline, color, depth, store } = fixture(512, outputDepth);
      pipeline.prepareFrame(272, 256, color, depth);
      const workspace = internals(pipeline).chunkWorkspace!;
      const offsets = pipeline.getResources()!.tileOffsets;
      const disposed = vi.fn();
      for (const buffer of [
        workspace.tasks,
        workspace.dispatch,
        workspace.partialData,
      ]) {
        buffer.addEventListener("dispose", disposed);
      }
      const oldOffsetsDisposed = vi.fn();
      offsets.addEventListener("dispose", oldOffsetsDisposed);
      pipeline.prepareFrame(1024, 512, color, depth);
      expect(pipeline.getDebugInfo().tileCapacity).toBe(2048);
      expect(pipeline.getDebugInfo().tileStageRebuilds).toBe(2);
      expect(internals(pipeline).chunkWorkspace).toBe(workspace);
      expect(oldOffsetsDisposed).toHaveBeenCalledOnce();
      expect(disposed).not.toHaveBeenCalled();
      pipeline.dispose();
      expect(disposed).toHaveBeenCalledTimes(3);
      store.dispose();
    },
  );

  it("dispatches only current tile ranges after shrinking a reserved viewport", () => {
    const { pipeline, renderer, color, depth, store } = fixture(512, false);
    pipeline.prepareFrame(1024, 512, color, depth);
    pipeline.prepareFrame(16, 16, color, depth);
    pipeline.render();
    const calls = renderer.compute.mock.calls;
    const named = (name: string) =>
      calls.filter(([node]) => node.name === name);
    expect(named("3DGS clear tile offsets WGSL")[0]![1]).toEqual([1, 1, 1]);
    expect(named("3DGS count exact raster chunks WGSL")[0]![1]).toEqual([
      1, 1, 1,
    ]);
    expect(named("3DGS emit exact raster chunk tasks WGSL")[0]![1]).toEqual([
      1, 1, 1,
    ]);
    expect(named("3DGS clear raster work metrics")[0]![1]).toEqual([1, 1, 1]);
    pipeline.dispose();
    store.dispose();
  });

  it("updates every suffix-scan level and ignores reserved tails after shrink", () => {
    let length = 300_001;
    const stage = new SuffixMinStage(
      new StorageBufferAttribute(new Uint32Array(524_289), 1),
      524_289,
      () => length,
    );
    const compute = vi.fn();
    const renderer = { compute } as unknown as WebGPURenderer;
    stage.encode(renderer);
    const levels = (
      stage as unknown as {
        levels: {
          runtimeLength: { value: number };
          runtimeBlockCount: { value: number };
        }[];
      }
    ).levels;
    expect(levels.map((level) => level.runtimeLength.value)).toEqual([
      300_001, 586, 2,
    ]);
    length = 2;
    compute.mockClear();
    stage.encode(renderer);
    expect(levels.map((level) => level.runtimeLength.value)).toEqual([2, 1, 1]);
    expect(levels.map((level) => level.runtimeBlockCount.value)).toEqual([
      1, 1, 1,
    ]);
    for (const [, dispatch] of compute.mock.calls)
      expect(dispatch).toEqual([1, 1, 1]);
    stage.dispose();
  });

  it("limits diagnostic readbacks to active tiles, including their sentinel", async () => {
    const { pipeline, renderer, color, depth, store } = fixture(512, false);
    pipeline.prepareFrame(1024, 512, color, depth);
    pipeline.prepareFrame(16, 16, color, depth);
    const offsets = pipeline.getResources()!.tileOffsets;
    const metrics = (
      internals(pipeline).rasterizer as unknown as {
        metrics: StorageBufferAttribute;
      }
    ).metrics;
    (offsets.array as Uint32Array).set([0, 10, 999_999]);
    (metrics.array as Uint32Array).set([
      4, 3, 2, 1, 999_999, 999_999, 999_999, 999_999,
    ]);
    const stats = await pipeline.readStats();
    expect(stats.profile!.tileLoads.mean).toBe(10);
    expect(stats.profile!.rasterWork).toEqual({
      checked: 4,
      blended: 3,
      pixels: 2,
      alphaStopped: 1,
    });
    expect(renderer.getArrayBufferAsync).toHaveBeenCalledWith(
      offsets,
      null,
      0,
      8,
    );
    expect(renderer.getArrayBufferAsync).toHaveBeenCalledWith(
      metrics,
      null,
      0,
      16,
    );
    pipeline.dispose();
    store.dispose();
  });
});

function internals(pipeline: TiledGaussianPipeline) {
  return pipeline as unknown as {
    rasterizer: TileRasterizer;
    chunkWorkspace: RasterChunkWorkspace | null;
  };
}

function fixture(chunkSize: number | null, outputDepth: boolean) {
  const vec4 = (values: number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  const data = new GaussianData(
    {
      means: vec4([0, 0, -2, 0]),
      scalesOpacity: vec4([1, 1, 1, 1]),
      rotations: vec4([0, 0, 0, 1]),
      shCoefficients: vec4([0, 0, 0, 0]),
    },
    { count: 1 },
  );
  const { store } = packedStore(data);
  const renderer = {
    compute: vi.fn(),
    getArrayBufferAsync: vi.fn(
      async (
        attribute: StorageBufferAttribute,
        _target = null,
        offset = 0,
        count = -1,
      ) => {
        const buffer = attribute.array.buffer as ArrayBuffer;
        return buffer.slice(offset, count < 0 ? undefined : offset + count);
      },
    ),
  };
  const pipeline = new TiledGaussianPipeline(
    renderer as unknown as WebGPURenderer,
    new PerspectiveCamera(),
    store.getPackedData(),
    store,
    "float32",
    "compensated",
    16_384,
    [0, 0, 0, 0],
    false,
    null,
    chunkSize,
    true,
    "workgroup",
    createDefaultGaussianNodeSlots(),
    1e-4,
    true,
  );
  return {
    pipeline,
    renderer,
    store,
    color: new StorageTexture(16, 16),
    depth: outputDepth ? new StorageTexture(16, 16) : null,
  };
}
