import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  StorageBufferAttribute,
  type NodeFrame,
  type WebGPURenderer,
} from "three/webgpu";
import { vec3 } from "three/tsl";

import { GaussianData } from "../src/GaussianData";
import { GaussianPass } from "../src/GaussianPass";
import { GaussianStore } from "../src/GaussianStore";
import {
  gaussianColor,
  gaussianPositionLocal,
  gaussianPositionWorld,
  rasterGaussianColor,
} from "../src/nodes/GaussianContextNodes";

const TEST_LIMITS = {
  maxStorageBufferBindingSize: 1_073_741_824,
  maxBufferSize: 1_073_741_824,
};

describe("GaussianPass node slots", () => {
  it("exposes the documented identity defaults", () => {
    const { pass } = createPass();

    expect(pass.gaussianPositionLocalNode).toBe(gaussianPositionLocal);
    expect(pass.gaussianPositionWorldNode).toBe(gaussianPositionWorld);
    expect(pass.gaussianColorNode).toBe(gaussianColor);
    expect(pass.rasterColorNode).toBe(rasterGaussianColor);
    expect(pass.maxRasterizedSplatsPerTile).toBeNull();

    const capped = createPass({ maxRasterizedSplatsPerTile: 8_192 }).pass;
    expect(capped.maxRasterizedSplatsPerTile).toBe(8_192);
  });

  it("rebuilds only the stage whose root node changed", () => {
    const { pass, renderer, store } = createPass();
    const pipeline = {
      rebuildProjection: vi.fn(),
      rebuildRasterizer: vi.fn(),
      prepareFrame: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    };
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.gaussianColorNode = gaussianColor.mul(vec3(1, 0.5, 0.5));
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    expect(pipeline.rebuildProjection).toHaveBeenCalledOnce();
    expect(pipeline.rebuildRasterizer).not.toHaveBeenCalled();

    pass.rasterColorNode = rasterGaussianColor.bgr;
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    expect(pipeline.rebuildProjection).toHaveBeenCalledOnce();
    expect(pipeline.rebuildRasterizer).toHaveBeenCalledOnce();
  });
});

function createPass(
  options: { maxRasterizedSplatsPerTile?: number | null } = {},
): {
  pass: GaussianPass;
  renderer: WebGPURenderer;
  store: GaussianStore;
} {
  const store = new GaussianStore();
  store.add(oneGaussian());
  store.pack({ limits: TEST_LIMITS });
  const renderer = {
    hasFeature: () => false,
    getDrawingBufferSize: (target: { set(x: number, y: number): unknown }) =>
      target.set(32, 32),
    initRenderTarget: vi.fn(),
  } as unknown as WebGPURenderer;
  const pass = new GaussianPass(
    renderer,
    new PerspectiveCamera(),
    store,
    options,
  );
  return { pass, renderer, store };
}

function oneGaussian(): GaussianData {
  const attribute = (values: readonly number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  return new GaussianData(
    {
      means: attribute([0, 0, -2, 0]),
      scalesOpacity: attribute([1, 1, 1, 1]),
      rotations: attribute([0, 0, 0, 1]),
      shCoefficients: attribute([0, 0, 0, 0]),
    },
    { count: 1 },
  );
}
