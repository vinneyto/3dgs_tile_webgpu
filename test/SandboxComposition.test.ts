import { expect, it, vi } from "vitest";
import {
  Layers,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import { GaussianSandbox } from "../sandbox/src/GaussianSandbox";
import { readSandboxOptions } from "../sandbox/src/SandboxOptions";
import { GaussianStore } from "../src/GaussianStore";

it.each([
  "renderer=hardware",
  "renderer=tiled&sceneDepth=0",
  "renderer=tiled&sceneDepth=1",
])("keeps compositing passes transparent (%s)", (query) => {
  // Exercise the real sandbox pass wiring without creating DOM controls or a GPU.
  const renderer = new WebGPURenderer({
    canvas: {
      width: 64,
      height: 64,
      style: {},
      addEventListener() {},
      setAttribute() {},
    } as unknown as HTMLCanvasElement,
  });
  renderer.setClearColor(0, 0);
  vi.spyOn(renderer, "hasFeature").mockReturnValue(false);
  const scene = new Scene();
  const store = new GaussianStore();
  const cloud = Object.assign(new Object3D(), {
    lod: {
      octree: {
        data: { count: 1, means: { array: new Float32Array([0, 0, -2, 1]) } },
      },
    },
  });
  const sandbox = Object.assign(Object.create(GaussianSandbox.prototype), {
    scene,
    renderer,
    sceneOverlayPass: null,
    overlayPass: null,
    camera: new PerspectiveCamera(),
    options: readSandboxOptions(new URLSearchParams(query)),
    sceneLayers: new Layers(),
    overlayLayers: Object.assign(new Layers(), { mask: 2 }),
    hoverMarker: new Object3D(),
    clearCloud: vi.fn(),
    frameCloud: vi.fn(),
    spatialDebug: { attach: vi.fn() },
    debugPanel: { setPass: vi.fn() },
    cloudStatus: { preparing: vi.fn() },
  });
  sandbox.show(store, "test.ply", cloud);
  // A Color background forces Three.js to clear this pass with alpha 1,
  // even with opaque=false and no visible overlay objects.
  if (query.includes("sceneDepth=0")) {
    expect(sandbox.overlayPass).toBeNull();
    expect(sandbox.opaquePass).toBeUndefined();
    expect(sandbox.transparentPass).toBeUndefined();
    expect(sandbox.sceneOverlayPass.opaque).toBe(true);
    expect(sandbox.sceneOverlayPass.transparent).toBe(true);
    expect(sandbox.sceneOverlayPass.getLayers().mask).toBe(3);
    for (const node of [
      sandbox.pass.rasterBreakNode,
      sandbox.pass.rasterPixelValueNode,
      sandbox.pass.rasterDiscardNode,
    ]) {
      node.traverse((child: { isTextureNode?: boolean }) =>
        expect(child.isTextureNode).not.toBe(true),
      );
    }
  }
  const overlay = sandbox.sceneOverlayPass ?? sandbox.overlayPass;
  expect(overlay.scene).toBe(scene);
  expect(overlay.scene.background).toBeNull();
  expect(overlay.scene.backgroundNode ?? null).toBeNull();
  expect(renderer.getClearAlpha()).toBe(0);
  sandbox.pass.dispose();
  sandbox.overlayPass?.dispose();
  sandbox.sceneOverlayPass?.dispose();
  sandbox.opaquePass?.dispose();
  sandbox.transparentPass?.dispose();
  sandbox.pipeline.dispose();
  store.dispose();
});
