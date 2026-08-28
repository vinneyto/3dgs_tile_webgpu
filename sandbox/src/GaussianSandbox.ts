import {
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CanonicalGaussianPlyLoader,
  gaussianPass,
  type GaussianData,
  GaussianStore,
  type GaussianPass,
  type RadixBackend,
} from "../../src/index";
import { DebugPanel } from "./DebugPanel";
import { KernelTimingInspector } from "./KernelTimingInspector";

const MAX_INDIRECT_CAPACITY = 256 * 65_535;

export class GaussianSandbox {
  private readonly loader = new CanonicalGaussianPlyLoader();
  private readonly scene = new Scene();
  private readonly controls: OrbitControls;
  private readonly debugPanel: DebugPanel;
  private pipeline: RenderPipeline | null = null;
  private pass: GaussianPass | null = null;
  private store: GaussianStore | null = null;

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
    this.setStatus(`Loading ${url}…`);
    try {
      const data = await this.loader.load(url);
      this.show(data, url);
    } catch (error) {
      this.setError(error);
    }
  }

  async loadFile(file: File): Promise<void> {
    this.setStatus(`Parsing ${file.name}…`);
    try {
      const data = this.loader.parse(await file.arrayBuffer());
      this.show(data, file.name);
    } catch (error) {
      this.setError(error);
    }
  }

  private show(data: GaussianData, source: string): void {
    this.pass?.dispose();
    this.pipeline?.dispose();
    this.frameCloud(data);
    this.store?.dispose();
    this.store = new GaussianStore();
    const cloud = this.store.add(data, {
      name: `${source} Gaussian cloud`,
      ownsData: true,
    });
    this.scene.add(cloud);
    const requestedCapacity = Math.max(65_536, data.count * 16);
    const intersectionCapacity = Math.min(
      MAX_INDIRECT_CAPACITY,
      requestedCapacity,
    );
    this.pass = gaussianPass(this.renderer, this.camera, this.store, {
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
      `${source}: ${data.count.toLocaleString()} Gaussians · SH degree ${data.shDegree}`,
    );
  }

  private frameCloud(data: GaussianData): void {
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
