import {
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  GaussianStore,
  WorkerStreamingGaussianBackend,
  gaussianPass,
  type DepthSortMode,
} from "./index";

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU is unavailable in this browser");
  const renderer = new WebGPURenderer({ antialias: false });
  await renderer.init();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const scene = new Scene();
  const store = new GaussianStore(new WorkerStreamingGaussianBackend({}));
  const cloud = await store.load(
    new URL("../sandbox/public/sample.ply", import.meta.url).href,
  );
  scene.add(cloud);
  const camera = new PerspectiveCamera(48, innerWidth / innerHeight, 0.05, 100);
  camera.position.set(0, 0.25, 4.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const mode: DepthSortMode =
    new URLSearchParams(location.search).get("sort") === "packed16"
      ? "packed16"
      : "float32";
  const pass = gaussianPass(renderer, camera, store, {
    depthSortMode: mode,
    intersectionCapacity: 16_384,
    background: [0.025, 0.035, 0.06, 1],
  });
  const pipeline = new RenderPipeline(renderer);
  pipeline.outputNode = pass;
  renderer.setAnimationLoop(() => {
    controls.update();
    cloud.rotation.y += 0.002;
    pipeline.render();
  });
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

main().catch((error: unknown) => {
  document.querySelector("#info")!.textContent =
    error instanceof Error ? error.message : String(error);
});
