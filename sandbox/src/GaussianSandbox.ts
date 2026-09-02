import {
  PerspectiveCamera,
  RenderPipeline,
  Scene,
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
  GaussianLodColorHelper,
  GaussianLod,
  OctreeHelper,
  GaussianOctree,
  GaussianStore,
  DistanceAwareRadialLodPackingStrategy,
  SourceFractionBudgetStrategy,
  StreamingLodPackingStrategy,
  type GaussianStorePackLimits,
  type GaussianPass,
  type RadixBackend,
} from "../../src/index";
import { pass as scenePass, vec4 } from "three/tsl";
import { DebugPanel } from "./DebugPanel";
import { KernelTimingInspector } from "./KernelTimingInspector";

const MAX_INDIRECT_CAPACITY = 256 * 65_535;
const REPACK_DISTANCE_FRACTION = 0.025;
const MIN_REPACK_DISTANCE = 0.05;
const PRIMARY_BUDGET_FRACTION = 0.97;
const LOD_LEVELS = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 },
] as const;

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
  private octreeHelpersVisible = false;
  private lodColoringEnabled = true;
  private primaryCloud: GaussianCloud | null = null;
  private primaryPackingStrategy: StreamingLodPackingStrategy<DistanceAwareRadialLodPackingStrategy> | null =
    null;
  private lodColorHelper: GaussianLodColorHelper | null = null;
  private deviceLimits: GaussianStorePackLimits | null = null;
  private readonly packingCenter = new Vector3();
  private readonly lastPackedCenter = new Vector3(
    Number.NaN,
    Number.NaN,
    Number.NaN,
  );
  private readonly packingBoundsCenter = new Vector3();
  private repackDistance = MIN_REPACK_DISTANCE;

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
      this.controls.update();
      this.updatePackingCenter();
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
    const parameters = new URLSearchParams(location.search);
    const debugEnabled = parameters.get("debug") !== "0";
    const profileEnabled = parameters.get("profile") === "kernels";
    const statsEnabled = profileEnabled || parameters.get("stats") !== "0";
    const renderer = new WebGPURenderer({
      antialias: false,
      trackTimestamp: profileEnabled,
    });
    await renderer.init();
    renderer.setClearColor(0x000000, 0);
    const timingInspector =
      profileEnabled && renderer.hasFeature("timestamp-query")
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

  setLodColoringEnabled(enabled: boolean): void {
    this.lodColoringEnabled = enabled;
    if (this.lodColorHelper !== null) {
      this.lodColorHelper.enabled = enabled;
    }
  }

  async loadUrl(url: string): Promise<void> {
    this.setStatus(`Loading ${url}…`);
    const primaryPackingStrategy = createPrimaryPackingStrategy();
    const store = new GaussianStore({
      loader: this.loader,
      budgetingStrategy: new SourceFractionBudgetStrategy(
        PRIMARY_BUDGET_FRACTION,
      ),
      defaultPackingStrategy: primaryPackingStrategy,
    });
    try {
      const primaryCloud = await store.load(url, {
        name: `${url} Gaussian cloud`,
        lod: { levels: LOD_LEVELS },
      });
      const limits = webGpuDeviceLimits(this.renderer);
      store.pack({ limits });
      this.show(store, url, primaryCloud, primaryPackingStrategy, limits);
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
      budgetingStrategy: new SourceFractionBudgetStrategy(
        PRIMARY_BUDGET_FRACTION,
      ),
      defaultPackingStrategy: primaryPackingStrategy,
    });
    try {
      const data = this.loader.parse(await file.arrayBuffer());
      const primaryCloud = addDataWithSandboxLod(
        store,
        data,
        `${file.name} Gaussian cloud`,
      );
      const limits = webGpuDeviceLimits(this.renderer);
      store.pack({ limits });
      this.show(store, file.name, primaryCloud, primaryPackingStrategy, limits);
    } catch (error) {
      store.dispose();
      this.setError(error);
    }
  }

  private show(
    store: GaussianStore,
    source: string,
    primaryCloud: GaussianCloud,
    primaryPackingStrategy: StreamingLodPackingStrategy<DistanceAwareRadialLodPackingStrategy>,
    limits: GaussianStorePackLimits,
  ): void {
    this.lodColorHelper?.dispose();
    this.lodColorHelper = null;
    this.pass?.dispose();
    this.helperPass?.dispose();
    this.pipeline?.dispose();
    this.disposeSpatialHelpers();
    this.store?.dispose();
    this.primaryCloud = null;
    this.primaryPackingStrategy = null;

    const primaryData = primaryCloud.lod!.octree.data;
    const primaryBounds = measureCloud(primaryData);
    this.store = store;
    this.deviceLimits = limits;
    this.primaryCloud = primaryCloud;
    this.primaryPackingStrategy = primaryPackingStrategy;
    this.lastPackedCenter.set(Number.NaN, Number.NaN, Number.NaN);
    this.packingBoundsCenter.set(
      primaryBounds.centerX,
      primaryBounds.centerY,
      primaryBounds.centerZ,
    );
    this.repackDistance = Math.max(
      MIN_REPACK_DISTANCE,
      primaryBounds.radius * REPACK_DISTANCE_FRACTION,
    );
    this.scene.add(primaryCloud);
    this.addSpatialHelpers(primaryCloud);
    this.frameCloud(primaryBounds);
    this.updatePackingCenter();

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
      maxRasterizedSplatsPerTile: readTileCap(),
      subpixelSampleCulling:
        new URLSearchParams(location.search).get("subpixelCull") !== "0",
      radixBackend: readRadixBackend(),
    });
    this.lodColorHelper = new GaussianLodColorHelper(this.pass, {
      enabled: this.lodColoringEnabled,
    });
    this.debugPanel.setPass(this.pass);
    this.pipeline = new RenderPipeline(this.renderer);
    this.helperPass = scenePass(this.scene, this.camera);
    this.pipeline.outputNode = compositePremultipliedOver(
      this.pass,
      this.helperPass,
    );
    this.setStatus(
      `${source}: ${primaryData.count.toLocaleString()}→${primaryCloud.gaussianCount.toLocaleString()} Gaussians · packed SH degree ${store.shDegree}`,
    );
  }

  private frameCloud(bounds: CloudBounds): void {
    const radius = Math.max(bounds.radius, 0.1);
    this.camera.near = Math.max(radius / 10_000, 0.0001);
    this.camera.far = Math.max(radius * 20, 100);
    this.camera.position.set(
      bounds.centerX + radius * 0.15,
      bounds.centerY + radius * 0.35,
      bounds.centerZ + radius * 2.4,
    );
    this.camera.updateProjectionMatrix();
    this.controls.target.set(bounds.centerX, bounds.centerY, bounds.centerZ);
    this.controls.update();
  }

  private updatePackingCenter(): void {
    const store = this.store;
    const strategy = this.primaryPackingStrategy;
    const cloud = this.primaryCloud;
    const limits = this.deviceLimits;
    if (
      store === null ||
      strategy === null ||
      cloud === null ||
      limits === null
    ) {
      return;
    }
    this.camera.getWorldPosition(this.packingCenter);
    cloud.worldToLocal(this.packingCenter);
    const centerChanged =
      !Number.isFinite(this.lastPackedCenter.x) ||
      this.packingCenter.distanceToSquared(this.lastPackedCenter) >=
        this.repackDistance * this.repackDistance;
    if (centerChanged) {
      strategy.targetStrategy.setCenter(this.packingCenter);
      strategy.invalidateTarget();
      this.lastPackedCenter.copy(this.packingCenter);
    }
    if (!strategy.needsPack) return;

    cloud.invalidatePacking();
    const started = performance.now();
    store.pack({ limits });
    this.lodColorHelper?.update();
    const duration = performance.now() - started;
    const stats = store.lastPackStats;
    if (stats !== null) {
      this.debugPanel.recordPack(
        stats,
        duration,
        this.packingCenter.distanceTo(this.packingBoundsCenter),
        strategy.needsPack,
      );
    }
  }

  private addSpatialHelpers(cloud: GaussianCloud): void {
    if (cloud.lod === null) return;
    const octreeHelper = new OctreeHelper(cloud.lod.octree, {
      opacity: 0.42,
    });
    octreeHelper.visible = this.octreeHelpersVisible;
    cloud.add(octreeHelper);
    this.octreeHelpers.push(octreeHelper);
  }

  private disposeSpatialHelpers(): void {
    for (const helper of this.octreeHelpers) helper.dispose();
    this.octreeHelpers.length = 0;
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

function readTileCap(): number | undefined {
  const raw = new URLSearchParams(location.search).get("tileCap");
  if (raw === null || raw === "0") return undefined;
  const cap = Number(raw);
  if (!Number.isSafeInteger(cap) || cap <= 0) {
    throw new RangeError("tileCap must be a positive integer or 0");
  }
  return cap;
}

function webGpuDeviceLimits(renderer: WebGPURenderer): GPUSupportedLimits {
  const backend = renderer.backend as unknown as { device: GPUDevice };
  return backend.device.limits;
}

function createPrimaryPackingStrategy(): StreamingLodPackingStrategy<DistanceAwareRadialLodPackingStrategy> {
  return new StreamingLodPackingStrategy(
    new DistanceAwareRadialLodPackingStrategy({
      center: new Vector3(0, 0, 0),
      levelDistance: readLodLevelDistance(),
    }),
    {
      maxUploadBytesPerPack: readPositiveQuery("lodUploadKiB", 1024) * 1024,
      maxChangedCellsPerPack: readPositiveIntegerQuery("lodCells", 16),
    },
  );
}

function readLodLevelDistance(): number {
  const raw = new URLSearchParams(location.search).get("lodDistance");
  if (raw === null) return 2;
  const distance = Number(raw);
  if (!(distance > 0) || !Number.isFinite(distance)) {
    throw new RangeError("lodDistance must be finite and positive");
  }
  return distance;
}

function readPositiveQuery(name: string, fallback: number): number {
  const raw = new URLSearchParams(location.search).get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite and positive`);
  }
  return value;
}

function readPositiveIntegerQuery(name: string, fallback: number): number {
  const value = readPositiveQuery(name, fallback);
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be a positive integer`);
  }
  return value;
}
