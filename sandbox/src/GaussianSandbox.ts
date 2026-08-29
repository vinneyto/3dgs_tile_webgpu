import {
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CanonicalGaussianPlyLoader,
  createRadialLodPackingStrategy,
  gaussianPass,
  type GaussianData,
  type GaussianCloud,
  GaussianLod,
  GaussianOctree,
  GaussianStore,
  type GaussianPass,
  type RadixBackend,
} from "../../src/index";
import { DebugPanel } from "./DebugPanel";
import { KernelTimingInspector } from "./KernelTimingInspector";

const MAX_INDIRECT_CAPACITY = 256 * 65_535;
const ANIMATED_CLOUD_URL = "/assets/dolphins-colored-3dgs.ply";
const ANIMATION_CYCLE_SECONDS = 4;
const PRIMARY_GAUSSIAN_BUDGET = 350_000;
const ANIMATED_GAUSSIAN_BUDGET = 60_000;
const LOD_LEVELS = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 },
] as const;
const RADIAL_LOD_PACKING = createRadialLodPackingStrategy({
  center: "bounds-center",
  regions: [
    { maxNormalizedRadius: 0.35, budgetShare: 0.6 },
    { maxNormalizedRadius: 0.7, budgetShare: 0.2 },
    { maxNormalizedRadius: Infinity, budgetShare: 0.2 },
  ],
});

interface CloudBounds {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number;
}

export class GaussianSandbox {
  private readonly loader = new CanonicalGaussianPlyLoader();
  private readonly scene = new Scene();
  private readonly controls: OrbitControls;
  private readonly debugPanel: DebugPanel;
  private pipeline: RenderPipeline | null = null;
  private pass: GaussianPass | null = null;
  private store: GaussianStore | null = null;
  private animatedCloud: GaussianCloud | null = null;
  private animatedOriginX = 0;
  private animatedAmplitude = 0;

  private constructor(
    private readonly renderer: WebGPURenderer,
    private readonly camera: PerspectiveCamera,
    private readonly status: HTMLElement,
    metrics: HTMLElement,
    kernelTimings: HTMLElement,
    timingInspector: KernelTimingInspector | null,
    debugEnabled: boolean,
    statsEnabled: boolean,
  ) {
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.debugPanel = new DebugPanel(
      renderer,
      metrics,
      kernelTimings,
      timingInspector,
      debugEnabled,
      statsEnabled,
    );

    renderer.setAnimationLoop((time) => {
      const encodeStart = performance.now();
      this.updateAnimation(time);
      this.controls.update();
      this.pipeline?.render();
      this.debugPanel.update(time, performance.now() - encodeStart);
    });
    addEventListener("resize", () => this.resize());
  }

  static async create(
    viewport: HTMLElement,
    status: HTMLElement,
    metrics: HTMLElement,
    kernelTimings: HTMLElement,
  ): Promise<GaussianSandbox> {
    if (!navigator.gpu)
      throw new Error("WebGPU is unavailable in this browser");
    const debugEnabled =
      new URLSearchParams(location.search).get("debug") !== "0";
    const statsEnabled =
      new URLSearchParams(location.search).get("stats") !== "0";
    const renderer = new WebGPURenderer({
      antialias: false,
      trackTimestamp: debugEnabled,
    });
    await renderer.init();
    const timingInspector =
      debugEnabled && renderer.hasFeature("timestamp-query")
        ? new KernelTimingInspector()
        : null;
    if (timingInspector !== null) renderer.inspector = timingInspector;
    // Tile rasterization cost scales with the number of physical pixels. A
    // devicePixelRatio of 2 quadruples that work, so the performance sandbox
    // defaults to one render pixel per CSS pixel and makes supersampling explicit.
    renderer.setPixelRatio(readRenderPixelRatio());
    viewport.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(50, 1, 0.01, 10_000);
    const sandbox = new GaussianSandbox(
      renderer,
      camera,
      status,
      metrics,
      kernelTimings,
      timingInspector,
      debugEnabled,
      statsEnabled,
    );
    sandbox.resize();
    return sandbox;
  }

  async loadUrl(url: string): Promise<void> {
    this.setStatus(`Loading ${url} and the animated dolphin…`);
    const store = new GaussianStore({ loader: this.loader });
    try {
      const primaryCloud = await store.load(url, {
        name: `${url} Gaussian cloud`,
        lod: { levels: LOD_LEVELS },
        budget: { maxGaussians: PRIMARY_GAUSSIAN_BUDGET },
        packingStrategy: RADIAL_LOD_PACKING,
      });
      const animatedCloud = await store.load(ANIMATED_CLOUD_URL, {
        name: "Animated dolphin Gaussian cloud",
        lod: { levels: LOD_LEVELS },
        budget: { maxGaussians: ANIMATED_GAUSSIAN_BUDGET },
        packingStrategy: RADIAL_LOD_PACKING,
      });
      this.show(store, url, primaryCloud, animatedCloud);
    } catch (error) {
      store.dispose();
      this.setError(error);
    }
  }

  async loadFile(file: File): Promise<void> {
    this.setStatus(`Parsing ${file.name}…`);
    const store = new GaussianStore({ loader: this.loader });
    try {
      const data = this.loader.parse(await file.arrayBuffer());
      const primaryCloud = addDataWithSandboxLod(
        store,
        data,
        `${file.name} Gaussian cloud`,
        PRIMARY_GAUSSIAN_BUDGET,
      );
      const animatedCloud = await store.load(ANIMATED_CLOUD_URL, {
        name: "Animated dolphin Gaussian cloud",
        lod: { levels: LOD_LEVELS },
        budget: { maxGaussians: ANIMATED_GAUSSIAN_BUDGET },
        packingStrategy: RADIAL_LOD_PACKING,
      });
      this.show(store, file.name, primaryCloud, animatedCloud);
    } catch (error) {
      store.dispose();
      this.setError(error);
    }
  }

  private show(
    store: GaussianStore,
    source: string,
    primaryCloud: GaussianCloud,
    animatedCloud: GaussianCloud,
  ): void {
    this.pass?.dispose();
    this.pipeline?.dispose();
    this.store?.dispose();
    this.animatedCloud = null;

    const primaryData = primaryCloud.lod!.octree.data;
    const animatedData = animatedCloud.lod!.octree.data;
    const primaryBounds = measureCloud(primaryData);
    const animatedBounds = measureCloud(animatedData);
    this.store = store;
    this.scene.add(primaryCloud, animatedCloud);
    this.placeAnimatedCloud(primaryBounds, animatedBounds, animatedCloud);
    this.frameClouds(primaryBounds, animatedBounds, animatedCloud);

    const requestedCapacity = Math.max(65_536, store.count * 16);
    const intersectionCapacity = Math.min(
      MAX_INDIRECT_CAPACITY,
      requestedCapacity,
    );
    this.pass = gaussianPass(this.renderer, this.camera, store, {
      depthSortMode:
        new URLSearchParams(location.search).get("sort") === "packed16"
          ? "packed16"
          : "float32",
      antialiasMode:
        new URLSearchParams(location.search).get("aa") === "classic"
          ? "classic"
          : "compensated",
      intersectionCapacity,
      background: [0.018, 0.022, 0.032, 1],
      profileKernels:
        new URLSearchParams(location.search).get("profile") === "kernels",
      radixBackend: readRadixBackend(),
    });
    this.debugPanel.setPass(this.pass);
    this.pipeline = new RenderPipeline(this.renderer);
    this.pipeline.outputNode = this.pass;
    this.setStatus(
      `${source}: ${primaryData.count.toLocaleString()}→${primaryCloud.gaussianCount.toLocaleString()} + ${animatedData.count.toLocaleString()}→${animatedCloud.gaussianCount.toLocaleString()} animated dolphin Gaussians · packed SH degree ${store.shDegree}`,
    );
  }

  private placeAnimatedCloud(
    primary: CloudBounds,
    animated: CloudBounds,
    cloud: GaussianCloud,
  ): void {
    const scale = (primary.radius * 0.45) / animated.radius;
    const targetX = primary.centerX + primary.radius * 1.4;
    cloud.scale.setScalar(scale);
    cloud.position.set(
      targetX - animated.centerX * scale,
      primary.centerY - animated.centerY * scale,
      primary.centerZ - animated.centerZ * scale,
    );
    this.animatedCloud = cloud;
    this.animatedOriginX = cloud.position.x;
    this.animatedAmplitude = primary.radius * 0.25;
  }

  private frameClouds(
    primary: CloudBounds,
    animated: CloudBounds,
    animatedCloud: GaussianCloud,
  ): void {
    const scale = animatedCloud.scale.x;
    const animatedMinX = animated.minX * scale + animatedCloud.position.x;
    const animatedMaxX = animated.maxX * scale + animatedCloud.position.x;
    const minX = Math.min(primary.minX, animatedMinX - this.animatedAmplitude);
    const maxX = Math.max(primary.maxX, animatedMaxX + this.animatedAmplitude);
    const minY = Math.min(
      primary.minY,
      animated.minY * scale + animatedCloud.position.y,
    );
    const maxY = Math.max(
      primary.maxY,
      animated.maxY * scale + animatedCloud.position.y,
    );
    const minZ = Math.min(
      primary.minZ,
      animated.minZ * scale + animatedCloud.position.z,
    );
    const maxZ = Math.max(
      primary.maxZ,
      animated.maxZ * scale + animatedCloud.position.z,
    );
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const centerZ = (minZ + maxZ) * 0.5;
    const diagonal = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ);
    const radius = Math.max(diagonal * 0.5, 0.1);
    this.camera.near = Math.max(radius / 10_000, 0.0001);
    this.camera.far = Math.max(radius * 20, 100);
    this.camera.position.set(
      centerX + radius * 0.15,
      centerY + radius * 0.35,
      centerZ + radius * 2.4,
    );
    this.camera.updateProjectionMatrix();
    this.controls.target.set(centerX, centerY, centerZ);
    this.controls.update();
  }

  private updateAnimation(timeMilliseconds: number): void {
    if (this.animatedCloud === null) return;
    const phase =
      (timeMilliseconds * 0.001 * Math.PI * 2) / ANIMATION_CYCLE_SECONDS;
    this.animatedCloud.position.x =
      this.animatedOriginX + Math.sin(phase) * this.animatedAmplitude;
  }

  private resize(): void {
    const width = Math.max(1, innerWidth);
    const height = Math.max(1, innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private setStatus(message: string): void {
    this.status.textContent = message;
    delete this.status.dataset.error;
  }

  private setError(error: unknown): void {
    this.status.textContent =
      error instanceof Error ? error.message : String(error);
    this.status.dataset.error = "true";
    console.error(error);
  }
}

function measureCloud(data: GaussianData): CloudBounds {
  const means = data.means.array as Float32Array;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let gaussian = 0; gaussian < data.count; gaussian++) {
    const offset = gaussian * 4;
    const x = means[offset]!;
    const y = means[offset + 1]!;
    const z = means[offset + 2]!;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;
  return {
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
    centerX,
    centerY,
    centerZ,
    radius: Math.max(
      Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) * 0.5,
      0.1,
    ),
  };
}

function addDataWithSandboxLod(
  store: GaussianStore,
  data: GaussianData,
  name: string,
  maxGaussians: number,
): GaussianCloud {
  const octree = GaussianOctree.build(data, { ownsData: true });
  let lod: GaussianLod | null = null;
  try {
    lod = GaussianLod.build(octree, {
      levels: LOD_LEVELS,
      ownsOctree: true,
    });
    return store.addLod(lod, {
      name,
      budget: { maxGaussians },
      packingStrategy: RADIAL_LOD_PACKING,
      ownsLod: true,
    });
  } catch (error) {
    if (lod !== null) lod.dispose();
    else octree.dispose();
    throw error;
  }
}

function readRenderPixelRatio(): number {
  const requested = Number(
    new URLSearchParams(location.search).get("dpr") ?? "1",
  );
  if (!Number.isFinite(requested)) return 1;
  return Math.min(2, Math.max(0.25, requested));
}

function readRadixBackend(): RadixBackend {
  const requested = new URLSearchParams(location.search).get("radix");
  if (requested === "subgroup" || requested === "workgroup") {
    return requested;
  }
  return "auto";
}
