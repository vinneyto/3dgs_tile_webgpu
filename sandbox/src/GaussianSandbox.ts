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
  type GaussianPass,
  GaussianStore,
} from "../../src/index";
import {
  addDataWithSandboxLod,
  measureCloud,
  SANDBOX_LOD_LEVELS,
  type CloudBounds,
} from "./cloudData";
import { CloudStatus } from "./CloudStatus";
import { compositePremultipliedOver } from "./compositePremultipliedOver";
import { DebugPanel } from "./DebugPanel";
import { KernelTimingInspector } from "./KernelTimingInspector";
import { readSandboxOptions, type SandboxOptions } from "./SandboxOptions";
import { SpatialDebugHelpers } from "./SpatialDebugHelpers";

export class GaussianSandbox {
  private readonly loader = new CanonicalGaussianPlyLoader();
  private readonly scene = new Scene();
  private readonly controls: OrbitControls;
  private readonly debugPanel: DebugPanel;
  private readonly spatialDebug = new SpatialDebugHelpers();
  private readonly cloudStatus: CloudStatus;
  private pipeline: RenderPipeline | null = null;
  private pass: GaussianPass | null = null;
  private store: GaussianStore | null = null;
  private helperPass: ReturnType<typeof scenePass> | null = null;
  private disposed = false;
  private readonly handleResize = () => this.resize();

  private constructor(
    private readonly renderer: WebGPURenderer,
    private readonly camera: PerspectiveCamera,
    status: HTMLElement,
    metrics: HTMLElement,
    kernelTimings: HTMLElement,
    timingInspector: KernelTimingInspector | null,
    private readonly options: SandboxOptions,
  ) {
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.cloudStatus = new CloudStatus(status);
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
      if (this.pipeline !== null && timingInspector !== null) {
        timingInspector.beginFrameSample(renderer);
        try {
          this.pipeline.render();
        } finally {
          timingInspector.endFrameSample(renderer);
        }
      } else {
        this.pipeline?.render();
      }
      this.debugPanel.update(time, performance.now() - encodeStart);
    });
    addEventListener("resize", this.handleResize);
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
    if (timingInspector !== null) {
      renderer.inspector = timingInspector;
      timingInspector.enableControlledSampling(renderer);
    }
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
    this.spatialDebug.setOctreeVisible(visible);
  }

  setLodColoringEnabled(enabled: boolean): void {
    this.spatialDebug.setLodColoringEnabled(enabled);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    removeEventListener("resize", this.handleResize);
    this.clearCloud();
    this.debugPanel.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  async loadUrl(url: string): Promise<void> {
    this.cloudStatus.loading(url);
    const store = this.createStore();
    try {
      const cloud = await store.load(url, {
        name: `${url} Gaussian cloud`,
        lod: { levels: SANDBOX_LOD_LEVELS },
      });
      if (this.disposed) {
        store.dispose();
        return;
      }
      this.show(store, url, cloud);
    } catch (error) {
      store.dispose();
      this.cloudStatus.error(error);
    }
  }

  async loadFile(file: File): Promise<void> {
    this.cloudStatus.parsing(file.name);
    const store = this.createStore();
    try {
      const data = this.loader.parse(await file.arrayBuffer());
      const cloud = addDataWithSandboxLod(
        store,
        data,
        `${file.name} Gaussian cloud`,
      );
      if (this.disposed) {
        store.dispose();
        return;
      }
      this.show(store, file.name, cloud);
    } catch (error) {
      store.dispose();
      this.cloudStatus.error(error);
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
    this.frameCloud(bounds);

    this.pass = gaussianPass(
      this.renderer,
      this.camera,
      store,
      this.options.pass,
    );
    this.spatialDebug.attach(cloud, this.pass);
    this.debugPanel.setPass(this.pass, {
      cloud,
      onPack: () => this.cloudStatus.packed(source, data.count, cloud, store),
    });
    this.pipeline = new RenderPipeline(this.renderer);
    this.helperPass = scenePass(this.scene, this.camera);
    this.pipeline.outputNode = compositePremultipliedOver(
      this.pass,
      this.helperPass,
    );
    this.cloudStatus.preparing(source, data.count);
  }

  private clearCloud(): void {
    this.debugPanel.setPass(null);
    this.spatialDebug.clear();
    this.pass?.dispose();
    this.helperPass?.dispose();
    this.pipeline?.dispose();
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

  private resize(): void {
    const width = Math.max(1, innerWidth);
    const height = Math.max(1, innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
