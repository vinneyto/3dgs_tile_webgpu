import {
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  GaussianData,
  GaussianStore,
  gaussianPass,
  type DepthSortMode,
} from "./index";

function storageAttribute(
  label: string,
  values: Float32Array,
): StorageBufferAttribute {
  const attribute = new StorageBufferAttribute(values, 4);
  attribute.name = label;
  return attribute;
}

function vec4Rows(
  rows: readonly (readonly [number, number, number, number])[],
): Float32Array {
  return new Float32Array(rows.flat());
}

function sh0(
  rgb: readonly [number, number, number],
): readonly [number, number, number, number] {
  const c0 = 0.28209479177387814;
  return [(rgb[0] - 0.5) / c0, (rgb[1] - 0.5) / c0, (rgb[2] - 0.5) / c0, 0];
}

async function main(): Promise<void> {
  if (!navigator.gpu) throw new Error("WebGPU is unavailable in this browser");

  const renderer = new WebGPURenderer({ antialias: false });
  await renderer.init();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const means = vec4Rows([
    [-0.9, -0.35, 0, 0],
    [-0.45, 0.35, 0.15, 0],
    [0, -0.1, 0.3, 0],
    [0.45, 0.38, 0.05, 0],
    [0.9, -0.32, 0.2, 0],
    [0, 0.8, -0.05, 0],
    [0, -0.85, 0.1, 0],
  ]);
  const scalesOpacity = vec4Rows([
    [0.42, 0.18, 0.12, 0.92],
    [0.25, 0.38, 0.16, 0.9],
    [0.38, 0.38, 0.18, 0.94],
    [0.3, 0.2, 0.12, 0.9],
    [0.45, 0.16, 0.12, 0.92],
    [0.18, 0.3, 0.12, 0.88],
    [0.2, 0.32, 0.12, 0.88],
  ]);
  const rotations = vec4Rows(
    Array.from({ length: 7 }, () => [0, 0, 0, 1] as const),
  );
  const shCoefficients = vec4Rows([
    sh0([0.95, 0.2, 0.25]),
    sh0([1.0, 0.58, 0.16]),
    sh0([0.25, 0.82, 0.45]),
    sh0([0.2, 0.6, 1.0]),
    sh0([0.68, 0.32, 0.96]),
    sh0([0.95, 0.3, 0.7]),
    sh0([0.16, 0.85, 0.9]),
  ]);

  const data = new GaussianData(
    {
      means: storageAttribute("demo.means", means),
      scalesOpacity: storageAttribute("demo.scales-opacity", scalesOpacity),
      rotations: storageAttribute("demo.rotations", rotations),
      shCoefficients: storageAttribute("demo.sh", shCoefficients),
    },
    { count: 7, shDegree: 0, ownsBuffers: true },
  );

  const scene = new Scene();
  const store = new GaussianStore();
  const cloud = store.add(data, { name: "Demo Gaussian cloud" });
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
  console.error(error);
});
