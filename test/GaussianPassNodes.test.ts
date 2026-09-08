import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
  type NodeFrame,
  type WebGPURenderer,
} from "three/webgpu";
import { float, vec3 } from "three/tsl";

import { GaussianData } from "../src/GaussianData";
import { GaussianPass } from "../src/GaussianPass";
import { GaussianStore } from "../src/GaussianStore";
import type { GaussianPassOptions } from "../src/pipeline/types";
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
  it("packs an uninitialized Store lazily on the first render", () => {
    const store = new GaussianStore();
    store.add(oneGaussian());
    const renderer = createRenderer();
    const pass = new GaussianPass(renderer, new PerspectiveCamera(), store);
    const pipeline = {
      rebuildProjection: vi.fn(),
      rebuildRasterizer: vi.fn(),
      prepareFrame: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    };
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: 1,
    });

    expect(store.needsPack).toBe(true);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(store.needsPack).toBe(false);
    expect(store.maxGaussians).toBeGreaterThan(0);
    expect(pass.intersectionCapacity).toBe(16);
    expect(pipeline.render).toHaveBeenCalledOnce();
  });

  it("uses the full drawing-buffer size at resolution scale 1", () => {
    const { pass, renderer, store } = createPass({ outputDepth: true });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pass.renderTarget.width).toBe(32);
    expect(pass.renderTarget.height).toBe(32);
    expect(pass.depthTexture?.image).toMatchObject({ width: 32, height: 32 });
    expect(pipeline.prepareFrame).toHaveBeenLastCalledWith(
      32,
      32,
      pass.colorTexture,
      pass.depthTexture,
    );
  });

  it("scales every Gaussian render dimension with resolution scale", () => {
    const { pass, renderer, store } = createPass({ outputDepth: true });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.setResolutionScale(0.5);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pass.renderTarget.width).toBe(16);
    expect(pass.renderTarget.height).toBe(16);
    expect(pass.depthTexture?.image).toMatchObject({ width: 16, height: 16 });
    expect(pipeline.prepareFrame).toHaveBeenLastCalledWith(
      16,
      16,
      pass.colorTexture,
      pass.depthTexture,
    );
  });

  it("resizes pass resources when resolution scale changes", () => {
    const { pass, renderer, store } = createPass({ outputDepth: true });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    const renderTargetDisposed = vi.fn();
    const depthTextureDisposed = vi.fn();
    pass.renderTarget.addEventListener("dispose", renderTargetDisposed);
    pass.depthTexture?.addEventListener("dispose", depthTextureDisposed);
    pass.setResolutionScale(0.5);
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.setResolutionScale(1);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(
      pipeline.prepareFrame.mock.calls.map(([width, height]) => [
        width,
        height,
      ]),
    ).toEqual([
      [32, 32],
      [16, 16],
      [32, 32],
    ]);
    expect(pass.renderTarget.width).toBe(32);
    expect(pass.renderTarget.height).toBe(32);
    expect(pass.depthTexture?.image).toMatchObject({ width: 32, height: 32 });
    expect(renderTargetDisposed).toHaveBeenCalledTimes(2);
    expect(depthTextureDisposed).toHaveBeenCalledTimes(2);
  });

  it("exposes the documented identity defaults", () => {
    const { pass } = createPass();

    expect(pass.gaussianPositionLocalNode).toBe(gaussianPositionLocal);
    expect(pass.gaussianPositionWorldNode).toBe(gaussianPositionWorld);
    expect(pass.gaussianColorNode).toBe(gaussianColor);
    expect(pass.rasterColorNode).toBe(rasterGaussianColor);
    expect(pass.maxRasterizedSplatsPerTile).toBeNull();
    expect(pass.rasterChunkSize).toBe(8_192);

    const capped = createPass({
      maxRasterizedSplatsPerTile: 8_192,
      rasterChunkSize: null,
    }).pass;
    expect(capped.maxRasterizedSplatsPerTile).toBe(8_192);
    expect(capped.rasterChunkSize).toBeNull();
  });

  it("validates exact raster chunk sizes", () => {
    expect(() => createPass({ rasterChunkSize: 1_000 })).toThrow(
      /multiple of 256/,
    );
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

    pass.rasterPixelValueNode = float(1);
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    expect(pipeline.rebuildProjection).toHaveBeenCalledOnce();
    expect(pipeline.rebuildRasterizer).toHaveBeenCalledTimes(2);
  });

  it("keeps always as the backwards-compatible default", () => {
    const { pass, renderer, store } = createPass();
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pass.redrawStrategy).toBe("always");
    expect(pipeline.render).toHaveBeenCalledTimes(2);
    expect(pass.renderCount).toBe(2);
    expect(pass.cacheHitCount).toBe(0);
  });

  it("reuses cached textures on clean auto frames", () => {
    const { pass, renderer, store } = createPass({ redrawStrategy: "auto" });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pipeline.prepareFrame).toHaveBeenCalledOnce();
    expect(pipeline.render).toHaveBeenCalledOnce();
    expect(pass.renderCount).toBe(1);
    expect(pass.cacheHitCount).toBe(1);
  });

  it("invalidates auto caching when a node stage changes", () => {
    const { pass, renderer, store } = createPass({ redrawStrategy: "auto" });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.gaussianColorNode = gaussianColor.mul(vec3(1, 0.5, 0.5));
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pipeline.rebuildProjection).toHaveBeenCalledOnce();
    expect(pipeline.render).toHaveBeenCalledTimes(2);
  });

  it("invalidates auto caching for camera, cloud, visibility, and Store changes", () => {
    const { pass, renderer, store, camera, cloud } = createPass({
      redrawStrategy: "auto",
    });
    const scene = new Scene();
    scene.add(cloud);
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    camera.position.z = 1;
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    camera.fov = 60;
    camera.updateProjectionMatrix();
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    cloud.position.x = 1;
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    cloud.visible = false;
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    cloud.packingPriority = 1;
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pipeline.render).toHaveBeenCalledTimes(6);
  });

  it("invalidates auto caching when output resolution changes", () => {
    const { pass, renderer, store } = createPass({ redrawStrategy: "auto" });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.setResolutionScale(0.5);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pipeline.render).toHaveBeenCalledTimes(2);
  });

  it("renders never only on the first frame and after explicit invalidation", () => {
    const { pass, renderer, store, camera } = createPass({
      redrawStrategy: "never",
    });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    camera.position.z = 1;
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.invalidate();
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pipeline.render).toHaveBeenCalledTimes(2);
    expect(pass.cacheHitCount).toBe(1);
  });

  it("rerenders never after a resize because its old textures are invalid", () => {
    const { pass, renderer, store } = createPass({
      redrawStrategy: "never",
    });
    const pipeline = createPipelineMock();
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    pass.updateBefore({ renderer } as unknown as NodeFrame);
    pass.setResolutionScale(0.5);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pipeline.render).toHaveBeenCalledTimes(2);
  });

  it("keeps a failed auto frame dirty for the next frame", () => {
    const { pass, renderer, store } = createPass({ redrawStrategy: "auto" });
    const pipeline = createPipelineMock();
    pipeline.render.mockImplementationOnce(() => {
      throw new Error("encode failed");
    });
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });

    expect(() =>
      pass.updateBefore({ renderer } as unknown as NodeFrame),
    ).toThrow("encode failed");
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(pipeline.render).toHaveBeenCalledTimes(2);
    expect(pass.renderCount).toBe(1);
  });

  it("validates redrawStrategy", () => {
    expect(() => createPass({ redrawStrategy: "sometimes" as "auto" })).toThrow(
      /redrawStrategy/,
    );
  });
});

function createPass(options: GaussianPassOptions = {}): {
  pass: GaussianPass;
  renderer: WebGPURenderer;
  store: GaussianStore;
  camera: PerspectiveCamera;
  cloud: GaussianStore["clouds"][number];
} {
  const store = new GaussianStore();
  const cloud = store.add(oneGaussian());
  store.pack({ limits: TEST_LIMITS });
  const renderer = createRenderer();
  const camera = new PerspectiveCamera();
  const pass = new GaussianPass(renderer, camera, store, options);
  return { pass, renderer, store, camera, cloud };
}

function createPipelineMock() {
  return {
    rebuildProjection: vi.fn(),
    rebuildRasterizer: vi.fn(),
    prepareFrame: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
}

function createRenderer(): WebGPURenderer {
  return {
    hasFeature: () => false,
    backend: { device: { limits: TEST_LIMITS } },
    getDrawingBufferSize: (target: { set(x: number, y: number): unknown }) =>
      target.set(32, 32),
    initRenderTarget: vi.fn(),
  } as unknown as WebGPURenderer;
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
