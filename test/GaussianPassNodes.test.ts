import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  Camera,
  Scene,
  StorageBufferAttribute,
  type NodeFrame,
  type WebGPURenderer,
} from "three/webgpu";
import { float, vec3, vec2, uniform } from "three/tsl";

import { GaussianData } from "../src/renderer/GaussianData";
import { GaussianPass } from "../src/renderer/GaussianPass";
import { GaussianStore } from "../src/renderer/GaussianStore";
import { packedStore, TEST_FRONTEND } from "./helpers/packedStore";
import { GaussianStore as GaussianStoreClient } from "../src/renderer/GaussianStore";
import type { BackendResponse } from "../src/streaming-backend/BackendResponse";
import type { RequestScheduler } from "../src/streaming-backend/RequestScheduler";
import type { GaussianPassOptions } from "../src/renderer/pipeline/types";
import {
  gaussianColor,
  gaussianPositionView,
  rasterOutputDepth,
  rasterOutputValid,
  gaussianPositionLocal,
  gaussianPositionWorld,
  rasterGaussianColor,
} from "../src/renderer/nodes/GaussianContextNodes";

import { gaussianProjectionResult } from "../src/renderer/nodes/GaussianProjectionNodes";

const TEST_LIMITS = {
  maxStorageBufferBindingSize: 1_073_741_824,
  maxBufferSize: 1_073_741_824,
  maxStorageBuffersPerShaderStage:
    TEST_FRONTEND.maxStorageBuffersPerShaderStage,
};

describe("GaussianPass node slots", () => {
  it("subscribes to the backend contract through a composed Store", () => {
    const backendEvents: { listener?: (response: BackendResponse) => void } =
      {};
    const start = vi.fn(() => {});
    const schedule = vi.fn(
      async (_command: Parameters<RequestScheduler["schedule"]>[0]) =>
        "done" as const,
    );
    const scheduler: RequestScheduler = {
      state: "ready",
      start,
      schedule,
      cancel: () => {},
      onResponse: (listener) => {
        backendEvents.listener = listener;
        return () => {
          backendEvents.listener = undefined;
        };
      },
      onFailure: () => () => {},
      dispose: () => {},
    };
    const store = new GaussianStoreClient(scheduler);
    const renderer = createRenderer();
    const pass = new GaussianPass(renderer, new PerspectiveCamera(), store);
    const invalidate = vi.spyOn(pass, "invalidate");
    const events: string[] = [];
    const unsubscribe = store.subscribe((event) => events.push(event.type));
    backendEvents.listener?.({
      command: { id: "load", type: "load-cloud-from-buffer" },
      durationMs: 0,
      isFinal: false,
      payload: {
        type: "cloud-loaded",
        sourceVersion: 1,
        cloudId: "cloud",
        objectId: 0,
        sourceCount: 1,
        shDegree: 0,
        bounds: [0, 0, 0, 0, 0, 0],
      },
    });
    expect(events).toEqual(["changed"]);
    expect(invalidate).toHaveBeenCalledOnce();
    pass.updateBefore({ renderer } as unknown as NodeFrame);
    expect(start).toHaveBeenCalledOnce();
    expect(
      schedule.mock.calls.some(
        ([command]) =>
          command.type === "set-frontend-capabilities" &&
          command.capabilities.maxBufferSize === TEST_FRONTEND.maxBufferSize,
      ),
    ).toBe(true);
    unsubscribe();
    pass.dispose();
    backendEvents.listener?.({
      command: { id: "load-2", type: "load-cloud-from-buffer" },
      durationMs: 0,
      isFinal: false,
      payload: {
        type: "cloud-loaded",
        sourceVersion: 1,
        cloudId: "cloud-2",
        objectId: 1,
        sourceCount: 1,
        shDegree: 0,
        bounds: [0, 0, 0, 0, 0, 0],
      },
    });
    expect(invalidate).toHaveBeenCalledOnce();
    store.dispose();
  });
  it("requests initial buffers when the Pass is created, before the first render", () => {
    const { store } = packedStore(oneGaussian(), false);
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

    expect(store.hasPackedData).toBe(true);
    pass.updateBefore({ renderer } as unknown as NodeFrame);

    expect(store.hasPackedData).toBe(true);
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

  it("keeps external passes backend-free across creation, pose changes, resize and rendering", () => {
    const { store } = packedStore(oneGaussian());
    const capabilities = vi.spyOn(store, "setFrontendCapabilities");
    const updateLod = vi.spyOn(store, "updateLod");
    const camera = new PerspectiveCamera();
    const renderer = createRenderer();
    const pass = new GaussianPass(renderer, camera, store, {
      dataMode: "external",
      fixedSize: { width: 73, height: 19 },
      outputDepth: true,
    });
    const pipeline = createPipelineMock();
    Object.assign(pass, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });
    pass.setResolutionScale(0.25);
    pass.render();
    camera.position.x = 10;
    pass.setSize(4096, 2048);
    pass.render();
    pass.setFixedSize(101, 23);
    pass.render();
    expect(capabilities).not.toHaveBeenCalled();
    expect(updateLod).not.toHaveBeenCalled();
    expect(pipeline.prepareFrame.mock.calls.map(([w, h]) => [w, h])).toEqual([
      [73, 19],
      [73, 19],
      [101, 23],
    ]);
    expect(pass.depthTexture?.image).toMatchObject({ width: 101, height: 23 });
    pass.useDrawingBufferSize().render();
    expect(pipeline.prepareFrame).toHaveBeenLastCalledWith(
      8,
      8,
      pass.colorTexture,
      pass.depthTexture,
    );
    pass.dispose();
    store.dispose();
  });

  it("does not start an external store before the owner supplies data", () => {
    const { store } = packedStore(oneGaussian(), false);
    const capabilities = vi.spyOn(store, "setFrontendCapabilities");
    const lod = vi.spyOn(store, "updateLod");
    const pass = new GaussianPass(
      createRenderer(),
      new PerspectiveCamera(),
      store,
      { dataMode: "external" },
    );
    pass.render();
    expect(store.hasPackedData).toBe(false);
    expect(capabilities).not.toHaveBeenCalled();
    expect(lod).not.toHaveBeenCalled();
    expect(pass.renderCount).toBe(0);
    pass.dispose();
    store.dispose();
  });

  it("supports an explicit scalar range and generic Camera with a custom root", () => {
    const { store } = packedStore(oneGaussian());
    const camera = new Camera();
    const pass = new GaussianPass(createRenderer(), camera, store, {
      dataMode: "external",
      depthRange: [0.01, 500],
      redrawStrategy: "auto",
    });
    const pipeline = createPipelineMock();
    Object.assign(pass, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });
    expect(() => pass.render()).toThrow(/default GaussianPass projection/);
    pass.gaussianProjectionNode = gaussianProjectionResult(
      vec2(10, 10),
      gaussianPositionView.length(),
      vec3(4, 0, 4),
    );
    pass.rasterOutputDepthNode = rasterOutputDepth;
    pass.invalidDepthValue = Infinity;
    pass.render();
    pass.render();
    camera.rotation.y = 0.25;
    pass.render();
    expect(pipeline.render).toHaveBeenCalledTimes(2);
    expect(pipeline.rebuildProjection).toHaveBeenCalledOnce();
    expect(pipeline.rebuildRasterizer).toHaveBeenCalledOnce();
    pass.dispose();
    store.dispose();
  });

  it("keeps pass caches independent and invalidates changed uniforms without rebuilding graphs", () => {
    const { store } = packedStore(oneGaussian());
    const renderer = createRenderer();
    const a = new GaussianPass(renderer, new PerspectiveCamera(), store, {
      dataMode: "external",
      redrawStrategy: "auto",
    });
    const b = new GaussianPass(renderer, new PerspectiveCamera(), store, {
      dataMode: "external",
      redrawStrategy: "auto",
    });
    const pa = createPipelineMock(),
      pb = createPipelineMock();
    Object.assign(a, {
      pipeline: pa,
      pipelineLayoutVersion: store.layoutVersion,
    });
    Object.assign(b, {
      pipeline: pb,
      pipelineLayoutVersion: store.layoutVersion,
    });
    const offset = uniform(1);
    a.gaussianProjectionNode = gaussianProjectionResult(
      vec2(offset),
      float(2),
      vec3(4, 0, 4),
    );
    a.render();
    b.render();
    offset.value = 2;
    a.invalidate();
    a.render();
    b.render();
    a.boundaryPolicy = "repeat-x";
    a.render();
    b.render();
    a.invalidDepthValue = Infinity;
    a.render();
    a.filterVariance = 0;
    a.render();
    a.depthRange = [0.1, 50];
    a.render();
    expect(pa.render).toHaveBeenCalledTimes(6);
    expect(pb.render).toHaveBeenCalledOnce();
    expect(pa.rebuildProjection).toHaveBeenCalledOnce();
    expect(pa.rebuildRasterizer).not.toHaveBeenCalled();
    a.rasterOutputValidNode = rasterOutputValid;
    a.rasterOutputDepthNode = rasterOutputDepth;
    a.render();
    expect(pa.rebuildRasterizer).toHaveBeenCalledOnce();
    a.dispose();
    b.dispose();
    store.dispose();
  });

  it("validates generic pass configuration", () => {
    for (const fixedSize of [
      { width: 0, height: 1 },
      { width: 1.5, height: 1 },
    ])
      expect(() => createPass({ fixedSize })).toThrow(/fixedSize/);
    for (const depthRange of [
      [0, 1],
      [2, 1],
      [1, Infinity],
      [1, 1 + 1e-10],
    ] as const)
      expect(() => createPass({ depthRange })).toThrow(/depthRange/);
    expect(() => createPass({ filterVariance: -1 })).toThrow(/filterVariance/);
    expect(() => createPass({ invalidDepthValue: NaN })).toThrow(
      /invalidDepthValue/,
    );
    expect(() => createPass({ boundaryPolicy: "wrap" as never })).toThrow(
      /boundaryPolicy/,
    );
    expect(() => createPass({ dataMode: "auto" as never })).toThrow(/dataMode/);
  });

  it("exposes the documented identity defaults", () => {
    const { pass } = createPass();

    expect(pass.gaussianPositionLocalNode).toBe(gaussianPositionLocal);
    expect(pass.gaussianPositionWorldNode).toBe(gaussianPositionWorld);
    expect(pass.gaussianColorNode).toBe(gaussianColor);
    expect(pass.rasterColorNode).toBe(rasterGaussianColor);
    expect(pass.maxRasterizedSplatsPerTile).toBeNull();
    expect(pass.rasterChunkSize).toBe(8_192);
    expect(pass.depthAlphaThreshold).toBe(0.95);

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

  it("validates the depth alpha threshold", () => {
    expect(() => createPass({ depthAlphaThreshold: -0.01 })).toThrow(
      /depthAlphaThreshold/,
    );
    expect(() => createPass({ depthAlphaThreshold: 1.01 })).toThrow(
      /depthAlphaThreshold/,
    );
    expect(
      createPass({ depthAlphaThreshold: 0.8 }).pass.depthAlphaThreshold,
    ).toBe(0.8);
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

  it("invalidates auto caching for camera, cloud, visibility, and Store changes", async () => {
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
    await cloud.setPackingPriority(1);
    Object.assign(pass as unknown as Record<string, unknown>, {
      pipeline,
      pipelineLayoutVersion: store.layoutVersion,
    });
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
  const { store, cloud } = packedStore(oneGaussian());
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
