import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  StorageBufferAttribute,
  WebGPURenderer,
  WGSLNodeBuilder,
  LinearSRGBColorSpace,
  WebGPUCoordinateSystem,
  Scene,
  Color,
  type NodeFrame,
} from "three/webgpu";
import { context, float, vec3 } from "three/tsl";
import { GaussianData } from "../src/GaussianData";
import { GaussianStore } from "../src/GaussianStore";
import { GaussianHardwarePass } from "../src/GaussianHardwarePass";
import {
  createDefaultGaussianNodeSlots,
  rasterPixelValue,
  rasterGaussianIndex,
  rasterUV,
} from "../src/nodes/GaussianContextNodes";
import { HardwareGaussianPipeline } from "../src/pipeline/HardwareGaussianPipeline";

function fixture() {
  const attr = (v: number[]) =>
    new StorageBufferAttribute(new Float32Array(v), 4);
  const data = new GaussianData(
    {
      means: attr([0, 0, -2, 0]),
      scalesOpacity: attr([1, 1, 1, 1]),
      rotations: attr([0, 0, 0, 1]),
      shCoefficients: attr([0, 0, 0, 0]),
    },
    { count: 1 },
  );
  const store = new GaussianStore();
  store.add(data);
  store.pack({
    limits: {
      maxStorageBufferBindingSize: 1073741824,
      maxBufferSize: 1073741824,
    },
  });
  const camera = new PerspectiveCamera();
  const renderer = new WebGPURenderer({
    canvas: {
      width: 16,
      height: 16,
      style: {},
      addEventListener() {},
      setAttribute() {},
    } as unknown as HTMLCanvasElement,
  });
  vi.spyOn(renderer, "hasFeature").mockReturnValue(false);
  const nodes = createDefaultGaussianNodeSlots();
  const pipeline = new HardwareGaussianPipeline(
    renderer,
    camera,
    store.getPackedData(),
    store,
    "float32",
    "classic",
    "workgroup",
    LinearSRGBColorSpace,
    nodes,
    true,
    false,
  );
  return { pipeline, renderer, camera, store, nodes };
}

function shaders(f: ReturnType<typeof fixture>, object: unknown) {
  const renderer = {
    backend: {
      isWebGPUBackend: true,
      utils: { getTextureSampleData: () => ({ primarySamples: 1 }) },
    },
    contextNode: context({}),
    coordinateSystem: WebGPUCoordinateSystem,
    getRenderTarget: () => null,
    getOutputRenderTarget: () => null,
    getMRT: () => null,
    getPixelRatio: () => 1,
    getDrawingBufferSize: () => ({ width: 16, height: 16 }),
    hasFeature: () => false,
    hasCompatibility: () => false,
    getOutputColorSpace: () => LinearSRGBColorSpace,
    getOutputBufferType: () => 1016,
    library: { fromMaterial: (m: unknown) => m },
  };
  const builder = new WGSLNodeBuilder(
    object as never,
    renderer as never,
  ) as any;
  builder.scene = f.pipeline.scene;
  builder.camera = f.camera;
  builder.clippingContext = {
    globalClippingCount: 0,
    localClippingCount: 0,
    unionPlanes: [],
    intersectionPlanes: [],
  };
  builder.build();
  return builder;
}

describe("hardware Gaussian backend", () => {
  it("generates native instanced shaders and GPU draw arguments without tile traversal", () => {
    const f = fixture();
    const projection = shaders(
      f,
      (f.pipeline.projection as any).computeNode,
    ).computeShader;
    expect(projection).toContain("evaluate_gaussian_sh");
    expect(projection).not.toContain("count_contributing_tiles");
    const draw = shaders(f, f.pipeline.prepareDraw).computeShader;
    expect(draw).toContain("vec4<u32>( 6u,");
    const render = shaders(f, f.pipeline.mesh);
    expect(render.vertexShader).toMatch(/@builtin\(\s*instance_index\s*\)/);
    expect(render.vertexShader).toContain("hardwareGaussianId");
    expect(render.vertexShader).toContain("- 1u");
    expect(render.fragmentShader).toContain("discard;");
    expect(render.fragmentShader).not.toContain("textureLoad");
    expect(render.fragmentShader).not.toContain("var<storage");
    expect(f.pipeline.geometry.indirect).toBe(f.pipeline.drawArguments);
    expect(f.pipeline.mesh.material).toMatchObject({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      premultipliedAlpha: true,
    });
    f.pipeline.dispose();
    f.store.dispose();
  });
  it("supports raster customization but rejects cached compute-only pixel values", () => {
    const f = fixture();
    f.nodes.rasterColorNode = vec3(
      rasterUV.x,
      rasterUV.y,
      float(rasterGaussianIndex).mul(0),
    );
    f.pipeline.rebuildRasterizer(f.nodes);
    expect(shaders(f, f.pipeline.mesh).fragmentShader).toContain(
      "hardwareGaussianId",
    );
    f.nodes.rasterAlphaNode = rasterPixelValue;
    expect(() => f.pipeline.rebuildRasterizer(f.nodes)).toThrow(
      /not available/,
    );
    f.pipeline.dispose();
    f.store.dispose();
  });
  it("prepares frames without readback and rebuilds changed raster nodes", () => {
    const f = fixture();
    vi.spyOn(f.renderer, "compute").mockReturnValue(undefined);
    vi.spyOn(f.renderer, "render").mockImplementation(() => {});
    const readback = vi.spyOn(f.renderer, "getArrayBufferAsync");
    const pass = new GaussianHardwarePass(f.renderer, f.camera, f.store);
    const frame = { renderer: f.renderer } as unknown as NodeFrame;
    pass.updateBefore(frame);
    const first = (pass as any).pipeline;
    expect(first).not.toBeNull();
    expect(readback).not.toHaveBeenCalled();
    const oldMaterial = first.mesh.material;
    pass.rasterColorNode = vec3(1, 0, 0);
    pass.updateBefore(frame);
    expect(first.mesh.material).not.toBe(oldMaterial);
    expect((pass as any).pipeline).toBe(first);
    pass.dispose();
    expect(() => pass.updateBefore(frame)).toThrow(/disposed/);
    f.pipeline.dispose();
    f.store.dispose();
  });

  it("shares one depth target, preserves color between draws and restores renderer state on failure", () => {
    const f = fixture();
    const scene = new Scene();
    scene.background = new Color("red");
    const pass = new GaussianHardwarePass(f.renderer, f.camera, f.store, {
      scene,
    });
    const previousTarget = {};
    const previousMRT = {};
    const calls: unknown[] = [];
    const renderer = {
      autoClear: false,
      opaque: false,
      transparent: true,
      getRenderTarget: () => previousTarget,
      getMRT: () => previousMRT,
      setRenderTarget: vi.fn(),
      setMRT: vi.fn(),
      getClearColor: (color: Color) => color.set("green"),
      getClearAlpha: () => 0.5,
      setClearColor: vi.fn(),
      render: vi.fn((drawScene: Scene) => {
        calls.push([
          drawScene,
          renderer.autoClear,
          renderer.opaque,
          renderer.transparent,
        ]);
      }),
    };
    (pass as any).pipeline = f.pipeline;
    (pass as any).renderScene(renderer, f.camera);
    expect(calls).toEqual([
      [scene, true, true, false],
      [f.pipeline.scene, false, false, true],
      [scene, false, false, true],
    ]);
    expect(renderer.setRenderTarget).toHaveBeenNthCalledWith(
      1,
      pass.renderTarget,
    );
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(previousTarget);
    renderer.render.mockImplementation(() => {
      throw new Error("draw failed");
    });
    expect(() => (pass as any).renderScene(renderer, f.camera)).toThrow(
      "draw failed",
    );
    expect(renderer).toMatchObject({
      autoClear: false,
      opaque: false,
      transparent: true,
    });
    expect(renderer.setMRT).toHaveBeenLastCalledWith(previousMRT);
    expect(scene.background).toEqual(new Color("red"));
    pass.dispose();
    f.store.dispose();
  });
});
