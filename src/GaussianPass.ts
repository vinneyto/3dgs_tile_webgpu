import {
  FloatType,
  HalfFloatType,
  NearestFilter,
  NoColorSpace,
  Object3D,
  PassNode,
  PerspectiveCamera,
  RedFormat,
  Scene,
  SRGBColorSpace,
  StorageTexture,
  Vector2,
  type Node,
  type NodeBuilder,
  type NodeFrame,
  type ColorSpace,
  type Texture,
  type WebGPURenderer,
} from "three/webgpu";
import { colorSpaceToWorking } from "three/tsl";
import { GaussianData } from "./GaussianData";
import { TiledGaussianPipeline } from "./pipeline/TiledGaussianPipeline";
import { WORKGROUP_SIZE } from "./pipeline/constants";
import type {
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassOptions,
  GaussianPassResources,
  GaussianPassStats,
} from "./pipeline/types";

const drawingBufferSize = new Vector2();

/**
 * A single-cloud Three.js RenderPipeline pass backed by explicit WGSL kernels bound through wgslFn.
 * The anchor is an ordinary Object3D; its world matrix is the cloud's local-to-world transform.
 */
export class GaussianPass extends PassNode {
  readonly gaussianData: GaussianData;
  readonly anchor: Object3D;
  readonly depthSortMode: DepthSortMode;
  readonly intersectionCapacity: number;
  readonly background: readonly [number, number, number, number];
  readonly outputDepth: boolean;
  readonly colorSpace: ColorSpace;
  readonly profileKernels: boolean;
  readonly colorTexture: StorageTexture;
  readonly depthTexture: StorageTexture | null;

  private readonly ownerRenderer: WebGPURenderer;
  private workingColorNode: Node | null = null;
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
    this.outputDepth = options.outputDepth ?? false;
    this.colorSpace = options.colorSpace ?? SRGBColorSpace;
    this.profileKernels = options.profileKernels ?? false;

    this.renderTarget.texture.dispose();
    this.colorTexture = new StorageTexture(1, 1);
    this.colorTexture.name = "GaussianPass.output";
    this.colorTexture.type = HalfFloatType;
    // rgba16float has no hardware sRGB sampling variant. Keep the storage
    // texture raw and decode its declared color space explicitly in setup().
    this.colorTexture.colorSpace = NoColorSpace;
    this.colorTexture.generateMipmaps = false;
    Object.assign(this.colorTexture, { mipmapsAutoUpdate: false });
    this.colorTexture.isRenderTargetTexture = true;
    this.colorTexture.renderTarget = this.renderTarget;
    this.renderTarget.texture = this.colorTexture;

    if (this.outputDepth) {
      this.depthTexture = new StorageTexture(1, 1);
      this.depthTexture.name = "GaussianPass.depth";
      this.depthTexture.format = RedFormat;
      this.depthTexture.type = FloatType;
      this.depthTexture.minFilter = NearestFilter;
      this.depthTexture.magFilter = NearestFilter;
      this.depthTexture.generateMipmaps = false;
      Object.assign(this.depthTexture, { mipmapsAutoUpdate: false });
    } else {
      this.depthTexture = null;
    }
  }

  override getTexture(name: string): Texture {
    if (name === "output") return this.colorTexture;
    if (name === "depth") {
      if (this.depthTexture === null) {
        throw new Error(
          'GaussianPass depth output is disabled. Pass { outputDepth: true } and request getTextureNode("depth") again.',
        );
      }
      return this.depthTexture;
    }
    return super.getTexture(name);
  }

  override setSize(width: number, height: number): void {
    super.setSize(width, height);
    this.depthTexture?.setSize(width, height, 1);
  }

  /** Color-managed output in Three.js' linear working color space. */
  getColorNode(): Node {
    this.workingColorNode ??= colorSpaceToWorking(
      this.getTextureNode("output"),
      this.colorSpace,
    );
    return this.workingColorNode;
  }

  override setup(builder: NodeBuilder): Node {
    const rawOutput = super.setup(builder);
    if (rawOutput === null || rawOutput === undefined) {
      throw new Error("GaussianPass color output node is unavailable");
    }
    return this.getColorNode();
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

    renderer.getDrawingBufferSize(drawingBufferSize);
    const width = Math.max(1, Math.floor(drawingBufferSize.x));
    const height = Math.max(1, Math.floor(drawingBufferSize.y));
    if (
      this.renderTarget.width !== width ||
      this.renderTarget.height !== height
    ) {
      this.setSize(width, height);
    }
    renderer.initRenderTarget(this.renderTarget);

    this.pipeline ??= new TiledGaussianPipeline(
      renderer,
      this.camera,
      this.gaussianData,
      this.anchor,
      this.depthSortMode,
      this.intersectionCapacity,
      this.background,
      this.profileKernels,
    );
    this.pipeline.prepareFrame(
      width,
      height,
      this.colorTexture,
      this.depthTexture,
    );
    this.pipeline.render();
    return undefined;
  }

  /** Three.js storage attributes produced by the renderer, available after the first frame. */
  getResources(): GaussianPassResources | null {
    return this.pipeline?.getResources() ?? null;
  }

  /** Optional diagnostic readback. Normal rendering never reads the GPU count. */
  readStats(): Promise<GaussianPassStats> {
    if (this.pipeline !== null) return this.pipeline.readStats();
    return Promise.resolve({
      intersectionCount: 0,
      requestedIntersections: 0,
      intersectionCapacity: this.intersectionCapacity,
      overflow: false,
    });
  }

  /** CPU-side lifecycle information; unlike readStats(), this does not perform a GPU readback. */
  getDebugInfo(): GaussianPassDebugInfo {
    return (
      this.pipeline?.getDebugInfo() ?? {
        initialized: false,
        width: 0,
        height: 0,
        tilesX: 0,
        tilesY: 0,
        tileStageRebuilds: 0,
        radixPasses: 0,
        profileKernels: this.profileKernels,
      }
    );
  }

  override dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.depthTexture?.dispose();
    super.dispose();
  }
}

export type {
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassOptions,
  GaussianPassResources,
  GaussianPassStats,
} from "./pipeline/types";
