import {
  Object3D,
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  gaussianPass,
  type GaussianData,
  type GaussianPass,
} from "../../src/index";
import { CanonicalGaussianPlyLoader } from "./CanonicalGaussianPlyLoader";

const MAX_INDIRECT_CAPACITY = 256 * 65_535;

export class GaussianSandbox {
  private readonly loader = new CanonicalGaussianPlyLoader();
  private readonly anchor = new Object3D();
  private readonly controls: OrbitControls;
  private pipeline: RenderPipeline | null = null;
  private pass: GaussianPass | null = null;
  private data: GaussianData | null = null;

  private constructor(
    private readonly renderer: WebGPURenderer,
    private readonly camera: PerspectiveCamera,
    private readonly status: HTMLElement,
  ) {
    const scene = new Scene();
    scene.add(this.anchor);
    this.anchor.name = "PLY Gaussian cloud transform";
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;

    renderer.setAnimationLoop(() => {
      this.controls.update();
      this.pipeline?.render();
    });
    addEventListener("resize", () => this.resize());
  }

  static async create(
    viewport: HTMLElement,
    status: HTMLElement,
  ): Promise<GaussianSandbox> {
    if (!navigator.gpu)
      throw new Error("WebGPU is unavailable in this browser");
    const renderer = new WebGPURenderer({ antialias: false });
    await renderer.init();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    viewport.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(50, 1, 0.01, 10_000);
    const sandbox = new GaussianSandbox(renderer, camera, status);
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
    this.data?.dispose();

    this.data = data;
    this.frameCloud(data);
    const requestedCapacity = Math.max(65_536, data.count * 16);
    const intersectionCapacity = Math.min(
      MAX_INDIRECT_CAPACITY,
      requestedCapacity,
    );
    this.pass = gaussianPass(this.renderer, this.camera, data, this.anchor, {
      depthSortMode:
        new URLSearchParams(location.search).get("sort") === "packed16"
          ? "packed16"
          : "float32",
      intersectionCapacity,
      background: [0.018, 0.022, 0.032, 1],
    });
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
