import {
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  SphereGeometry,
  Vector3,
  WebGPURenderer,
  type Node,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CanonicalGaussianPlyLoader,
  gaussianPass,
  type GaussianData,
  type GaussianCloud,
  GaussianLod,
  LodHelper,
  OctreeHelper,
  GaussianOctree,
  GaussianStore,
  MaximumLodPackingStrategy,
  TieredRadialLodPackingStrategy,
  type GaussianStorePackLimits,
  type GaussianPass,
  type RadixBackend,
} from "../../src/index";
import { pass as scenePass, vec4 } from "three/tsl";
import { DebugPanel } from "./DebugPanel";
import { KernelTimingInspector } from "./KernelTimingInspector";

const MAX_INDIRECT_CAPACITY = 256 * 65_535;
const ANIMATED_CLOUD_URL = "/assets/dolphins-colored-3dgs.ply";
const ANIMATION_CYCLE_SECONDS = 4;
const PACKING_CENTER_CYCLE_SECONDS = 12;
const PACKING_CENTER_AMPLITUDE = 5;
const REPACK_DISTANCE = 0.5;
const LOD_LEVELS = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 },
] as const;
const DOLPHIN_PACKING = new MaximumLodPackingStrategy();

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
  private helperPass: ReturnType<typeof scenePass> | null = null;
  private readonly octreeHelpers: OctreeHelper[] = [];
  private readonly lodHelpers: LodHelper[] = [];
  private octreeHelpersVisible = false;
  private lodHelperLevels: readonly number[] = [];
  private animatedCloud: GaussianCloud | null = null;
  private animatedOriginX = 0;
  private animatedAmplitude = 0;
  private primaryCloud: GaussianCloud | null = null;
  private primaryPackingStrategy: TieredRadialLodPackingStrategy | null = null;
  private primaryLodHelper: LodHelper | null = null;
  private packingCenterMarker: Mesh<SphereGeometry, MeshBasicMaterial> | null =
    null;
  private lastPackedCenterX = Number.NaN;
  private deviceLimits: GaussianStorePackLimits | null = null;
  private readonly packingCenter = new Vector3();

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
    renderer.setClearColor(0x000000, 0);
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

  setOctreeHelperVisible(visible: boolean): void {
    this.octreeHelpersVisible = visible;
    for (const helper of this.octreeHelpers) helper.visible = visible;
  }

  setLodHelperLevels(levels: readonly number[]): void {
    this.lodHelperLevels = [...levels];
    for (const helper of this.lodHelpers) {
      helper.setLevels(levels);
      helper.visible = levels.length > 0;
    }
  }

  async loadUrl(url: string): Promise<void> {
    this.setStatus(`Loading ${url} and the animated dolphin…`);
    const primaryPackingStrategy = createPrimaryPackingStrategy();
    const store = new GaussianStore({
      loader: this.loader,
      defaultPackingStrategy: primaryPackingStrategy,
    });
    try {
      const primaryCloud = await store.load(url, {
        name: `${url} Gaussian cloud`,
        lod: { levels: LOD_LEVELS },
      });
      const animatedCloud = await store.load(ANIMATED_CLOUD_URL, {
        name: "Animated dolphin Gaussian cloud",
        lod: { levels: LOD_LEVELS },
        priority: -1,
        packingStrategy: DOLPHIN_PACKING,
      });
      const limits = webGpuDeviceLimits(this.renderer);
      store.pack({ limits });
      this.show(
        store,
        url,
        primaryCloud,
        animatedCloud,
        primaryPackingStrategy,
        limits,
      );
    } catch (error) {
      store.dispose();
      this.setError(error);
    }
  }

  async loadFile(file: File): Promise<void> {
    this.setStatus(`Parsing ${file.name}…`);
    const primaryPackingStrategy = createPrimaryPackingStrategy();
    const store = new GaussianStore({
      loader: this.loader,
      defaultPackingStrategy: primaryPackingStrategy,
    });
    try {
      const data = this.loader.parse(await file.arrayBuffer());
      const primaryCloud = addDataWithSandboxLod(
        store,
        data,
        `${file.name} Gaussian cloud`,
      );
      const animatedCloud = await store.load(ANIMATED_CLOUD_URL, {
        name: "Animated dolphin Gaussian cloud",
        lod: { levels: LOD_LEVELS },
        priority: -1,
        packingStrategy: DOLPHIN_PACKING,
      });
      const limits = webGpuDeviceLimits(this.renderer);
      store.pack({ limits });
      this.show(
        store,
        file.name,
        primaryCloud,
        animatedCloud,
        primaryPackingStrategy,
        limits,
      );
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
    primaryPackingStrategy: TieredRadialLodPackingStrategy,
    limits: GaussianStorePackLimits,
  ): void {
    this.pass?.dispose();
    this.helperPass?.dispose();
    this.pipeline?.dispose();
    this.disposeSpatialHelpers();
    this.store?.dispose();
    this.animatedCloud = null;
    this.primaryCloud = null;
    this.primaryPackingStrategy = null;
    this.primaryLodHelper = null;
    this.packingCenterMarker = null;

    const primaryData = primaryCloud.lod!.octree.data;
    const animatedData = animatedCloud.lod!.octree.data;
    const primaryBounds = measureCloud(primaryData);
    const animatedBounds = measureCloud(animatedData);
    this.store = store;
    this.deviceLimits = limits;
    this.primaryCloud = primaryCloud;
    this.primaryPackingStrategy = primaryPackingStrategy;
    this.lastPackedCenterX = 0;
    this.scene.add(primaryCloud, animatedCloud);
    this.primaryLodHelper = this.addSpatialHelpers(primaryCloud);
    this.addSpatialHelpers(animatedCloud);
    this.addPackingCenterMarker(primaryCloud, primaryBounds);
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
    this.helperPass = scenePass(this.scene, this.camera);
    this.pipeline.outputNode = compositePremultipliedOver(
      this.pass,
      this.helperPass,
    );
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
    const phase =
      (timeMilliseconds * 0.001 * Math.PI * 2) / ANIMATION_CYCLE_SECONDS;
    if (this.animatedCloud !== null) {
      this.animatedCloud.position.x =
        this.animatedOriginX + Math.sin(phase) * this.animatedAmplitude;
    }
    this.updatePackingCenter(timeMilliseconds);
  }

  private updatePackingCenter(timeMilliseconds: number): void {
    const store = this.store;
    const strategy = this.primaryPackingStrategy;
    const cloud = this.primaryCloud;
    const marker = this.packingCenterMarker;
    const limits = this.deviceLimits;
    if (
      store === null ||
      strategy === null ||
      cloud === null ||
      marker === null ||
      limits === null
    ) {
      return;
    }
    const phase =
      (timeMilliseconds * 0.001 * Math.PI * 2) / PACKING_CENTER_CYCLE_SECONDS;
    const centerX = Math.sin(phase) * PACKING_CENTER_AMPLITUDE;
    this.packingCenter.set(centerX, 0, 0);
    marker.position.copy(this.packingCenter);
    if (Math.abs(centerX - this.lastPackedCenterX) < REPACK_DISTANCE) return;

    strategy.setCenter(this.packingCenter);
    const started = performance.now();
    store.pack({ limits });
    const duration = performance.now() - started;
    this.lastPackedCenterX = centerX;
    if (cloud.lodPacking !== null) {
      this.primaryLodHelper?.setPacking(cloud.lodPacking);
    }
    const stats = store.lastPackStats;
    if (stats !== null) this.debugPanel.recordPack(stats, duration, centerX);
  }

  private addPackingCenterMarker(
    cloud: GaussianCloud,
    bounds: CloudBounds,
  ): void {
    const marker = new Mesh(
      new SphereGeometry(Math.max(0.08, Math.min(0.25, bounds.radius * 0.025))),
      new MeshBasicMaterial({
        color: 0xffffff,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    marker.name = "LOD packing center";
    marker.renderOrder = 1_000;
    marker.position.set(0, 0, 0);
    cloud.add(marker);
    this.packingCenterMarker = marker;
  }

  private addSpatialHelpers(cloud: GaussianCloud): LodHelper | null {
    if (cloud.lod === null || cloud.lodPacking === null) return null;
    const octreeHelper = new OctreeHelper(cloud.lod.octree, {
      opacity: 0.42,
    });
    octreeHelper.visible = this.octreeHelpersVisible;
    const lodHelper = new LodHelper(cloud.lod, cloud.lodPacking, {
      levels: this.lodHelperLevels,
      opacity: 0.12,
    });
    lodHelper.visible = this.lodHelperLevels.length > 0;
    cloud.add(octreeHelper, lodHelper);
    this.octreeHelpers.push(octreeHelper);
    this.lodHelpers.push(lodHelper);
    return lodHelper;
  }

  private disposeSpatialHelpers(): void {
    for (const helper of this.octreeHelpers) helper.dispose();
    for (const helper of this.lodHelpers) helper.dispose();
    this.octreeHelpers.length = 0;
    this.lodHelpers.length = 0;
    if (this.packingCenterMarker !== null) {
      this.packingCenterMarker.geometry.dispose();
      this.packingCenterMarker.material.dispose();
      this.packingCenterMarker.removeFromParent();
      this.packingCenterMarker = null;
    }
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

/** Composite a regular transparent Three.js pass over another pass.
 *
 * Normal material blending stores premultiplied RGB in a transparent render
 * target. `blendColor()` expects straight-alpha RGB, which would apply helper
 * opacity twice and make thin octree lines and low-opacity LOD volumes nearly
 * invisible.
 */
function compositePremultipliedOver(
  base: Node<"vec4">,
  overlay: Node<"vec4">,
): Node<"vec4"> {
  const baseColor = vec4(base);
  const overlayColor = vec4(overlay);
  const inverseOverlayAlpha = overlayColor.a.oneMinus();
  return vec4(
    overlayColor.rgb.add(baseColor.rgb.mul(inverseOverlayAlpha)),
    overlayColor.a.add(baseColor.a.mul(inverseOverlayAlpha)),
  );
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

function webGpuDeviceLimits(renderer: WebGPURenderer): GPUSupportedLimits {
  const backend = renderer.backend as unknown as { device: GPUDevice };
  return backend.device.limits;
}

function createPrimaryPackingStrategy(): TieredRadialLodPackingStrategy {
  return new TieredRadialLodPackingStrategy({
    center: new Vector3(0, 0, 0),
    budgetShares: [0.6, 0.2, 0.2],
  });
}
