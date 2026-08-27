import {
  HalfFloatType,
  Object3D,
  PassNode,
  PerspectiveCamera,
  Scene,
  Vector2,
  type NodeFrame,
  type Texture,
  type WebGPURenderer,
} from "three/webgpu";
import { GaussianData } from "./GaussianData";
import { TiledGaussianPipeline } from "./pipeline/TiledGaussianPipeline";
import { WORKGROUP_SIZE } from "./pipeline/constants";
import type {
  DepthSortMode,
  GaussianPassOptions,
  GaussianPassStats,
  WebGPUBackendAccess,
} from "./pipeline/types";

const drawingBufferSize = new Vector2();

/**
 * A single-cloud Three.js RenderPipeline pass backed by a GPU-driven tiled 3DGS renderer.
 * The anchor is an ordinary Object3D; its world matrix is the cloud's local-to-world transform.
 */
export class GaussianPass extends PassNode {
  readonly gaussianData: GaussianData;
  readonly anchor: Object3D;
  readonly depthSortMode: DepthSortMode;
  readonly intersectionCapacity: number;
  readonly background: readonly [number, number, number, number];

  private readonly ownerRenderer: WebGPURenderer;
  private pipeline: TiledGaussianPipeline | null = null;
  private disposed = false;

  constructor(
    renderer: WebGPURenderer,
    camera: PerspectiveCamera,
    gaussianData: GaussianData,
    anchor: Object3D,
    options: GaussianPassOptions = {},
  ) {
    super(PassNode.COLOR, new Scene(), camera, {
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      samples: 0,
    });

    const depthSortMode = options.depthSortMode ?? "float32";
    const intersectionCapacity =
      options.intersectionCapacity ?? gaussianData.count * 16;
    if (!Number.isInteger(intersectionCapacity) || intersectionCapacity <= 0) {
      throw new RangeError("intersectionCapacity must be a positive integer");
    }
    if (intersectionCapacity > WORKGROUP_SIZE * 65_535) {
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit",
      );
    }
    if (gaussianData.count > WORKGROUP_SIZE * 65_535) {
      throw new RangeError(
        "Gaussian count exceeds the one-dimensional projection dispatch limit",
      );
    }

    this.name = "GaussianPass";
    this.ownerRenderer = renderer;
    this.gaussianData = gaussianData;
    this.anchor = anchor;
    this.depthSortMode = depthSortMode;
    this.intersectionCapacity = intersectionCapacity;
    this.background = options.background ?? [0, 0, 0, 0];
    this.renderTarget.texture.name = "GaussianPass.output";
    this.renderTarget.texture.generateMipmaps = false;

    const storageTexture = this.renderTarget.texture as Texture & {
      isStorageTexture: boolean;
      mipmapsAutoUpdate: boolean;
    };
    storageTexture.isStorageTexture = true;
    storageTexture.mipmapsAutoUpdate = false;
  }

  override updateBefore(frame: NodeFrame): boolean | undefined {
    const renderer = frame.renderer as WebGPURenderer | null;
    if (renderer === null) {
      throw new Error("GaussianPass received a NodeFrame without a renderer");
    }
    if (this.disposed) throw new Error("GaussianPass has been disposed");
    if (renderer !== this.ownerRenderer) {
      throw new Error(
        "GaussianPass must be rendered by the WebGPURenderer passed to its constructor",
      );
    }
    if (!(this.camera instanceof PerspectiveCamera)) {
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera",
      );
    }

    const backend = renderer.backend as unknown as WebGPUBackendAccess;
    if (backend.isWebGPUBackend !== true || backend.device === null) {
      throw new Error(
        "GaussianPass requires an initialized WebGPURenderer with a WebGPU backend",
      );
    }

    renderer.getDrawingBufferSize(drawingBufferSize);
    const width = Math.max(1, Math.floor(drawingBufferSize.x));
    const height = Math.max(1, Math.floor(drawingBufferSize.y));
    if (
      this.renderTarget.width !== width ||
      this.renderTarget.height !== height
    ) {
      this.setSize(width, height);
    }
    this.renderTarget.texture.type = HalfFloatType;
    renderer.initRenderTarget(this.renderTarget);

    const outputTexture = backend.get(this.renderTarget.texture).texture;
    if (outputTexture === undefined) {
      throw new Error(
        "Three.js did not initialize the GaussianPass output texture",
      );
    }
    this.pipeline ??= new TiledGaussianPipeline(
      backend.device,
      this.camera,
      this.gaussianData,
      this.anchor,
      this.depthSortMode,
      this.intersectionCapacity,
      this.background,
    );
    this.pipeline.prepareFrame(width, height, outputTexture);
    this.pipeline.render();
    return undefined;
  }

  /** Optional diagnostic readback. Normal rendering never maps or reads the GPU count. */
  readStats(): Promise<GaussianPassStats> {
    if (this.pipeline !== null) return this.pipeline.readStats();
    return Promise.resolve({
      intersectionCount: 0,
      requestedIntersections: 0,
      intersectionCapacity: this.intersectionCapacity,
      overflow: false,
    });
  }

  override dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pipeline?.dispose();
    this.pipeline = null;
    super.dispose();
  }
}

export type {
  DepthSortMode,
  GaussianPassOptions,
  GaussianPassStats,
} from "./pipeline/types";
