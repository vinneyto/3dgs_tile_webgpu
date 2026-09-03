import {
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { pass as scenePass } from "three/tsl";
import {
  CanonicalGaussianPlyLoader,
  gaussianPass,
  type GaussianCloud,
  GaussianLodColorHelper,
  OctreeHelper,
  type GaussianPass,
  GaussianStore,
  type GaussianStorePackStats,
} from "../../src/index";
import {
  addDataWithSandboxLod,
  measureCloud,
  SANDBOX_LOD_LEVELS,
  type CloudBounds,
} from "./cloudData";
import { compositePremultipliedOver } from "./compositePremultipliedOver";
import { DebugPanel } from "./DebugPanel";
import { KernelTimingInspector } from "./KernelTimingInspector";
import { readSandboxOptions, type SandboxOptions } from "./SandboxOptions";

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
  private lodColoringEnabled = false;
  private lodColorHelper: GaussianLodColorHelper | null = null;
  private unsubscribeDebug: (() => void) | null = null;
  private lastPackStats: GaussianStorePackStats | null = null;

  private constructor(
    private readonly renderer: WebGPURenderer,
    private readonly camera: PerspectiveCamera,
    private readonly status: HTMLElement,
    metrics: HTMLElement,
    kernelTimings: HTMLElement,
    timingInspector: KernelTimingInspector | null,
    private readonly options: SandboxOptions,
  ) {
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.debugPanel = new DebugPanel(
      renderer,
      metrics,
      kernelTimings,
      timingInspector,
      options.debugEnabled,
      options.statsEnabled,
    );

    renderer.setAnimationLoop((time) => {
      const encodeStart = performance.now();
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
    const options = readSandboxOptions();
    const renderer = new WebGPURenderer({
      antialias: false,
      trackTimestamp: options.profileEnabled,
    });
    await renderer.init();
    renderer.setClearColor(0x000000, 0);
    const timingInspector =
      options.profileEnabled && renderer.hasFeature("timestamp-query")
        ? new KernelTimingInspector()
        : null;
    if (timingInspector !== null) renderer.inspector = timingInspector;
    renderer.setPixelRatio(options.pixelRatio);
    viewport.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(50, 1, 0.01, 10_000);
    const sandbox = new GaussianSandbox(
      renderer,
      camera,
      status,
      metrics,
      kernelTimings,
      timingInspector,
      options,
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
    if (this.lodColorHelper !== null) this.lodColorHelper.enabled = enabled;
  }

  async loadUrl(url: string): Promise<void> {
    this.setStatus(`Loading ${url}…`);
    const store = this.createStore();
    try {
      const cloud = await store.load(url, {
        name: `${url} Gaussian cloud`,
        lod: { levels: SANDBOX_LOD_LEVELS },
      });
      this.show(store, url, cloud);
    } catch (error) {
      store.dispose();
      this.setError(error);
    }
  }

  async loadFile(file: File): Promise<void> {
    this.setStatus(`Parsing ${file.name}…`);
    const store = this.createStore();
    try {
      const data = this.loader.parse(await file.arrayBuffer());
      const cloud = addDataWithSandboxLod(
        store,
        data,
        `${file.name} Gaussian cloud`,
      );
      this.show(store, file.name, cloud);
    } catch (error) {
      store.dispose();
      this.setError(error);
    }
  }

  private createStore(): GaussianStore {
    return new GaussianStore({
      loader: this.loader,
      defaultStreamingLod: this.options.streamingLod,
    });
  }

  private show(
    store: GaussianStore,
    source: string,
    cloud: GaussianCloud,
  ): void {
    this.clearCloud();
    const data = cloud.lod!.octree.data;
    const bounds = measureCloud(data);
    this.store = store;
    this.scene.add(cloud);
    this.addSpatialHelpers(cloud);
    this.frameCloud(bounds);

    this.pass = gaussianPass(
      this.renderer,
      this.camera,
      store,
      this.options.pass,
    );
    this.lodColorHelper = new GaussianLodColorHelper(this.pass, {
      enabled: this.lodColoringEnabled,
    });
    this.debugPanel.setPass(this.pass);
    this.subscribeToPassDebug(source, data.count, cloud);
    this.pipeline = new RenderPipeline(this.renderer);
    this.helperPass = scenePass(this.scene, this.camera);
    this.pipeline.outputNode = compositePremultipliedOver(
      this.pass,
      this.helperPass,
    );
    this.setStatus(
      `${source}: ${data.count.toLocaleString()} Gaussians · preparing GPU resources…`,
    );
  }

  private subscribeToPassDebug(
    source: string,
    sourceCount: number,
    primaryCloud: GaussianCloud,
  ): void {
    const pass = this.pass!;
    const store = this.store!;
    this.unsubscribeDebug = pass.subscribeDebug(({ storePack, lod }) => {
      const cloudLod = lod.clouds.find(({ cloud }) => cloud === primaryCloud);
      if (cloudLod !== undefined) {
        this.debugPanel.recordLodState(
          cloudLod.focusDistance,
          cloudLod.pending,
          cloudLod.targetStats,
        );
      }
      if (storePack !== null && storePack !== this.lastPackStats) {
        this.lastPackStats = storePack;
        this.debugPanel.recordPack(
          storePack,
          storePack.planningMs + storePack.slotUpdateMs,
        );
        this.setStatus(
          `${source}: ${sourceCount.toLocaleString()}→${primaryCloud.gaussianCount.toLocaleString()} Gaussians · packed ${store.packedShFormat.toUpperCase()} SH degree ${store.shDegree}`,
        );
      }
    });
  }

  private clearCloud(): void {
    this.unsubscribeDebug?.();
    this.unsubscribeDebug = null;
    this.lastPackStats = null;
    this.lodColorHelper?.dispose();
    this.lodColorHelper = null;
    this.pass?.dispose();
    this.helperPass?.dispose();
    this.pipeline?.dispose();
    this.disposeSpatialHelpers();
    this.store?.dispose();
    this.pass = null;
    this.helperPass = null;
    this.pipeline = null;
    this.store = null;
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

  private addSpatialHelpers(cloud: GaussianCloud): void {
    if (cloud.lod === null) return;
    const helper = new OctreeHelper(cloud.lod.octree, { opacity: 0.42 });
    helper.visible = this.octreeHelpersVisible;
    cloud.add(helper);
    this.octreeHelpers.push(helper);
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
