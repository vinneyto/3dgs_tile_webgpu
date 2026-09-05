import {
  WebGPURenderer,
  PerspectiveCamera,
  StorageBufferAttribute,
  Scene,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  DataUtils,
  WebGPUCoordinateSystem,
  Layers,
  RenderPipeline,
  RenderTarget,
  HalfFloatType,
  type NodeFrame,
} from "three/webgpu";
import { pass as scenePass, vec4 } from "three/tsl";
import { compositePremultipliedOver } from "../../sandbox/src/compositePremultipliedOver";
import {
  GaussianData,
  GaussianStore,
  GaussianHardwarePass,
} from "../../src/index";

const result = document.querySelector("#result")!;
async function run() {
  const renderer = new WebGPURenderer({ antialias: false });
  await renderer.init();
  renderer.setSize(64, 64);
  renderer.setClearColor(0, 0);
  document.body.append(renderer.domElement);
  const device = (renderer.backend as unknown as { device: GPUDevice }).device;
  const errors: string[] = [];
  device.pushErrorScope("validation");
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  const attr = (values: number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  const sh = (c: number) => (c - 0.5) / 0.28209479177387814;
  const data = new GaussianData(
    {
      // Deliberately near-first input: hardware must draw far green, then near red.
      means: attr([0, 0, -2, 0, 0, 0, -3, 0]),
      scalesOpacity: attr([0.5, 0.3, 0.1, 0.5, 0.75, 0.45, 0.1, 0.5]),
      rotations: attr([0, 0, 0, 1, 0, 0, 0, 1]),
      shCoefficients: attr([sh(1), sh(0), sh(0), 0, sh(0), sh(1), sh(0), 0]),
    },
    { count: 2, ownsBuffers: true },
  );
  const store = new GaussianStore();
  const cloud = store.add(data);
  const scene = new Scene();
  scene.add(cloud);
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.coordinateSystem = WebGPUCoordinateSystem;
  camera.updateProjectionMatrix();
  const pass = new GaussianHardwarePass(renderer, camera, store, {
    scene,
    antialiasMode: "classic",
    radixBackend: "workgroup",
  });
  const frame = { renderer } as unknown as NodeFrame;
  async function sample() {
    pass.updateBefore(frame);
    const pixels = await renderer.readRenderTargetPixelsAsync(
      pass.renderTarget,
      32,
      32,
      1,
      1,
    );
    return Array.from(pixels as Uint16Array, DataUtils.fromHalfFloat);
  }
  const blended = await sample();
  // Also exercise the final composition: testing only the Gaussian target
  // misses a later overlay pass replacing the image with an opaque background.
  const overlay = scenePass(scene, camera);
  const overlayLayers = new Layers();
  overlayLayers.set(1);
  overlay.setLayers(overlayLayers);
  overlay.opaque = false;
  overlay.transparent = true;
  const pipeline = new RenderPipeline(renderer);
  pipeline.outputColorTransform = false;
  pipeline.outputNode = compositePremultipliedOver(
    compositePremultipliedOver(vec4(0.01, 0.02, 0.03, 1), pass),
    overlay,
  );
  const finalTarget = new RenderTarget(64, 64, { type: HalfFloatType });
  renderer.setRenderTarget(finalTarget);
  pipeline.render();
  renderer.setRenderTarget(null);
  const composed = Array.from(
    (await renderer.readRenderTargetPixelsAsync(
      finalTarget,
      32,
      32,
      1,
      1,
    )) as Uint16Array,
    DataUtils.fromHalfFloat,
  );
  const overlayPixel = Array.from(
    (await renderer.readRenderTargetPixelsAsync(
      overlay.renderTarget,
      32,
      32,
      1,
      1,
    )) as Uint16Array,
    DataUtils.fromHalfFloat,
  );
  const occluder = new Mesh(
    new PlaneGeometry(4, 4),
    new MeshBasicMaterial({ color: 0x0000ff }),
  );
  occluder.position.z = -2.5;
  scene.add(occluder);
  const occluded = await sample();
  cloud.visible = false;
  const hidden = await sample();
  renderer.setSize(96, 80);
  camera.aspect = 96 / 80;
  camera.updateProjectionMatrix();
  pass.updateBefore(frame);
  await device.queue.onSubmittedWorkDone();
  const validation = await device.popErrorScope();
  if (validation) errors.push(validation.message);
  const checks = {
    emptyOverlayTransparent: overlayPixel.every((v) => Math.abs(v) < 0.001),
    finalComposition:
      composed[0]! > 0.45 && composed[1]! > 0.2 && composed[2]! < 0.02,
    blendOrder:
      blended[0]! > 0.45 &&
      blended[1]! > 0.2 &&
      blended[1]! < 0.3 &&
      blended[2]! < 0.01,
    nativeDepth:
      occluded[0]! > 0.45 && occluded[1]! < 0.01 && occluded[2]! > 0.45,
    zeroVisible: hidden[0]! < 0.01 && hidden[1]! < 0.01 && hidden[2]! > 0.99,
    resize: pass.renderTarget.width === 96 && pass.renderTarget.height === 80,
    noValidationErrors: errors.length === 0,
  };
  result.textContent = JSON.stringify(
    { checks, blended, composed, overlayPixel, occluded, hidden, errors },
    null,
    2,
  );
  pass.dispose();
  overlay.dispose();
  pipeline.dispose();
  finalTarget.dispose();
  store.dispose();
  data.dispose();
  occluder.geometry.dispose();
  occluder.material.dispose();
  renderer.dispose();
  if (Object.values(checks).some((v) => !v))
    throw new Error("GPU checks failed");
}
run().catch((e) => {
  result.textContent += "\n" + (e.stack ?? String(e));
  console.error(e);
});
