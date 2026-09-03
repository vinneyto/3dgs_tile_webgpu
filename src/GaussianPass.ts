import {
  FloatType,
  HalfFloatType,
  NearestFilter,
  NoColorSpace,
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
import { GaussianStore } from "./GaussianStore";
import {
  createDefaultGaussianNodeSlots,
  type GaussianNodeSlots,
} from "./nodes/GaussianContextNodes";
import { validateRasterChunkSize } from "./kernels/rasterChunks";
import { TiledGaussianPipeline } from "./pipeline/TiledGaussianPipeline";
import {
  DEFAULT_RASTER_CHUNK_SIZE,
  WORKGROUP_SIZE,
} from "./pipeline/constants";
import { resolveRadixBackend } from "./pipeline/radixBackend";
import type {
  AntialiasMode,
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassDebugListener,
  GaussianPassOptions,
  GaussianPassResources,
  GaussianPassStats,
  ResolvedRadixBackend,
} from "./pipeline/types";

const drawingBufferSize = new Vector2();
const enum DirtyStage {
  None = 0,
  Projection = 1 << 0,
  Rasterizer = 1 << 1,
  All = Projection | Rasterizer,
}

/**
 * A multi-cloud Three.js RenderPipeline pass backed by explicit WGSL kernels bound through wgslFn.
 */
export class GaussianPass extends PassNode {
  readonly gaussianStore: GaussianStore;
  readonly depthSortMode: DepthSortMode;
  readonly antialiasMode: AntialiasMode;
  readonly background: readonly [number, number, number, number];
  readonly outputDepth: boolean;
  readonly colorSpace: ColorSpace;
  readonly profileKernels: boolean;
  readonly maxRasterizedSplatsPerTile: number | null;
  readonly rasterChunkSize: number | null;
  readonly subpixelSampleCulling: boolean;
  readonly radixBackend: ResolvedRadixBackend;
  readonly colorTexture: StorageTexture;
  readonly depthTexture: StorageTexture | null;

  private readonly ownerRenderer: WebGPURenderer;
  private readonly requestedIntersectionCapacity: number | null;
  private resolvedIntersectionCapacity = 0;
  private readonly debugListeners = new Set<GaussianPassDebugListener>();
  private workingColorNode: Node | null = null;
  private pipeline: TiledGaussianPipeline | null = null;
  private pipelineLayoutVersion = -1;
  private readonly nodeSlots = createDefaultGaussianNodeSlots();
  private dirtyStages = DirtyStage.None;
  private disposed = false;

  constructor(
    renderer: WebGPURenderer,
    camera: PerspectiveCamera,
    gaussianStore: GaussianStore,
    options: GaussianPassOptions = {},
  ) {
    super(PassNode.COLOR, new Scene(), camera, {
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      samples: 0,
    });

    const depthSortMode = options.depthSortMode ?? "float32";
    const antialiasMode = options.antialiasMode ?? "compensated";
    const requestedRadixBackend = options.radixBackend ?? "auto";
    if (antialiasMode !== "compensated" && antialiasMode !== "classic") {
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"',
      );
    }
    const radixBackend = resolveRadixBackend(
      requestedRadixBackend,
      renderer.hasFeature("subgroups"),
    );
    const intersectionCapacity = options.intersectionCapacity ?? null;
    if (
      intersectionCapacity !== null &&
      (!Number.isInteger(intersectionCapacity) || intersectionCapacity <= 0)
    ) {
      throw new RangeError("intersectionCapacity must be a positive integer");
    }
    if (
      intersectionCapacity !== null &&
      intersectionCapacity > WORKGROUP_SIZE * 65_535
    ) {
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit",
      );
    }
    const maxRasterizedSplatsPerTile =
      options.maxRasterizedSplatsPerTile ?? null;
    if (
      maxRasterizedSplatsPerTile !== null &&
      (!Number.isInteger(maxRasterizedSplatsPerTile) ||
        maxRasterizedSplatsPerTile <= 0)
    ) {
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer",
      );
    }
    const rasterChunkSize =
      options.rasterChunkSize === undefined
        ? DEFAULT_RASTER_CHUNK_SIZE
        : options.rasterChunkSize;
    validateRasterChunkSize(
      rasterChunkSize,
      intersectionCapacity ?? WORKGROUP_SIZE * 65_535,
    );

    this.name = "GaussianPass";
    this.ownerRenderer = renderer;
    this.gaussianStore = gaussianStore;
    this.depthSortMode = depthSortMode;
    this.antialiasMode = antialiasMode;
    this.requestedIntersectionCapacity = intersectionCapacity;
    this.background = options.background ?? [0, 0, 0, 0];
    this.outputDepth = options.outputDepth ?? false;
    this.colorSpace = options.colorSpace ?? SRGBColorSpace;
    this.profileKernels = options.profileKernels ?? false;
    this.maxRasterizedSplatsPerTile = maxRasterizedSplatsPerTile;
    this.rasterChunkSize = rasterChunkSize;
    this.subpixelSampleCulling = options.subpixelSampleCulling ?? true;
    this.radixBackend = radixBackend;

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

  /** Resolved after the first render when omitted from GaussianPassOptions. */
  get intersectionCapacity(): number {
    return (
      this.requestedIntersectionCapacity ?? this.resolvedIntersectionCapacity
    );
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

  get gaussianPositionLocalNode(): Node {
    return this.nodeSlots.gaussianPositionLocalNode;
  }

  set gaussianPositionLocalNode(node: Node) {
    this.setProjectionNode("gaussianPositionLocalNode", node);
  }

  get gaussianPositionWorldNode(): Node {
    return this.nodeSlots.gaussianPositionWorldNode;
  }

  set gaussianPositionWorldNode(node: Node) {
    this.setProjectionNode("gaussianPositionWorldNode", node);
  }

  get gaussianScaleNode(): Node {
    return this.nodeSlots.gaussianScaleNode;
  }

  set gaussianScaleNode(node: Node) {
    this.setProjectionNode("gaussianScaleNode", node);
  }

  get gaussianRotationNode(): Node {
    return this.nodeSlots.gaussianRotationNode;
  }

  set gaussianRotationNode(node: Node) {
    this.setProjectionNode("gaussianRotationNode", node);
  }

  get gaussianOpacityNode(): Node {
    return this.nodeSlots.gaussianOpacityNode;
  }

  set gaussianOpacityNode(node: Node) {
    this.setProjectionNode("gaussianOpacityNode", node);
  }

  get gaussianColorNode(): Node {
    return this.nodeSlots.gaussianColorNode;
  }

  set gaussianColorNode(node: Node) {
    this.setProjectionNode("gaussianColorNode", node);
  }

  get gaussianVisibilityNode(): Node {
    return this.nodeSlots.gaussianVisibilityNode;
  }

  set gaussianVisibilityNode(node: Node) {
    this.setProjectionNode("gaussianVisibilityNode", node);
  }

  get rasterColorNode(): Node {
    return this.nodeSlots.rasterColorNode;
  }

  set rasterColorNode(node: Node) {
    this.setRasterNode("rasterColorNode", node);
  }

  get rasterAlphaNode(): Node {
    return this.nodeSlots.rasterAlphaNode;
  }

  set rasterAlphaNode(node: Node) {
    this.setRasterNode("rasterAlphaNode", node);
  }

  get rasterDiscardNode(): Node {
    return this.nodeSlots.rasterDiscardNode;
  }

  set rasterDiscardNode(node: Node) {
    this.setRasterNode("rasterDiscardNode", node);
  }

  invalidateProjection(): void {
    this.dirtyStages |= DirtyStage.Projection;
  }

  invalidateRasterizer(): void {
    this.dirtyStages |= DirtyStage.Rasterizer;
  }

  override set needsUpdate(value: boolean) {
    super.needsUpdate = value;
    if (value) this.dirtyStages |= DirtyStage.All;
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
    if (this.gaussianStore.needsPack) {
      this.gaussianStore.pack({ limits: webGpuDeviceLimits(renderer) });
    }
    const lodUpdate = this.gaussianStore.updateLod(this.camera);
    const data = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null) {
      this.resolvedIntersectionCapacity = Math.min(
        WORKGROUP_SIZE * 65_535,
        Math.max(1, data.count * 16),
      );
    }
    renderer.initRenderTarget(this.renderTarget);

    if (
      this.pipeline === null ||
      this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion
    ) {
      this.pipeline?.dispose();
      if (data.count > WORKGROUP_SIZE * 65_535) {
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit",
        );
      }
      this.pipeline = new TiledGaussianPipeline(
        renderer,
        this.camera,
        data,
        this.gaussianStore,
        this.depthSortMode,
        this.antialiasMode,
        this.intersectionCapacity,
        this.background,
        this.profileKernels,
        this.maxRasterizedSplatsPerTile,
        this.rasterChunkSize,
        this.subpixelSampleCulling,
        this.radixBackend,
        this.nodeSlots,
      );
      this.pipelineLayoutVersion = this.gaussianStore.layoutVersion;
      this.dirtyStages = DirtyStage.None;
    } else if (this.dirtyStages !== DirtyStage.None) {
      if ((this.dirtyStages & DirtyStage.Projection) !== 0) {
        this.pipeline.rebuildProjection(this.nodeSlots);
      }
      if ((this.dirtyStages & DirtyStage.Rasterizer) !== 0) {
        this.pipeline.rebuildRasterizer(this.nodeSlots);
      }
      this.dirtyStages = DirtyStage.None;
    }
    this.pipeline.prepareFrame(
      width,
      height,
      this.colorTexture,
      this.depthTexture,
    );
    this.pipeline.render();
    if (this.debugListeners.size > 0) {
      const snapshot = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: lodUpdate,
      };
      for (const listener of this.debugListeners) listener(snapshot);
    }
    return undefined;
  }

  /** Subscribe to allocation, LOD and CPU-side pass diagnostics. */
  subscribeDebug(listener: GaussianPassDebugListener): () => void {
    this.debugListeners.add(listener);
    return () => this.debugListeners.delete(listener);
  }

  /** Three.js storage attributes produced by the renderer, available after the first frame. */
  getResources(): GaussianPassResources | null {
    return this.pipeline?.getResources() ?? null;
  }

  /** Optional diagnostic readback. Normal rendering never reads the GPU count. */
  readStats(): Promise<GaussianPassStats> {
    if (this.pipeline !== null) return this.pipeline.readStats();
    return Promise.resolve({
      visibleGaussianCount: 0,
      intersectionCount: 0,
      requestedIntersections: 0,
      intersectionCapacity: this.intersectionCapacity,
      overflow: false,
      profile: null,
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
        depthRadixPasses: 0,
        tileRadixPasses: 0,
        radixBackend: this.radixBackend,
        profileKernels: this.profileKernels,
        maxRasterizedSplatsPerTile: this.maxRasterizedSplatsPerTile,
        rasterChunkSize: this.rasterChunkSize,
        subpixelSampleCulling: this.subpixelSampleCulling,
      }
    );
  }

  override dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.debugListeners.clear();
    this.depthTexture?.dispose();
    super.dispose();
  }

  private setProjectionNode(
    key: keyof Pick<
      GaussianNodeSlots,
      | "gaussianPositionLocalNode"
      | "gaussianPositionWorldNode"
      | "gaussianScaleNode"
      | "gaussianRotationNode"
      | "gaussianOpacityNode"
      | "gaussianColorNode"
      | "gaussianVisibilityNode"
    >,
    node: Node,
  ): void {
    assertNode(node, key);
    if (this.nodeSlots[key] === node) return;
    this.nodeSlots[key] = node;
    this.invalidateProjection();
  }

  private setRasterNode(
    key: keyof Pick<
      GaussianNodeSlots,
      "rasterColorNode" | "rasterAlphaNode" | "rasterDiscardNode"
    >,
    node: Node,
  ): void {
    assertNode(node, key);
    if (this.nodeSlots[key] === node) return;
    this.nodeSlots[key] = node;
    this.invalidateRasterizer();
  }
}

function assertNode(node: Node, field: string): void {
  if (node?.isNode !== true) {
    throw new TypeError(`GaussianPass.${field} must be a Three.js Node`);
  }
}

export type {
  AntialiasMode,
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassDebugListener,
  GaussianPassDebugSnapshot,
  GaussianPassOptions,
  GaussianPassProfileStats,
  GaussianPassResources,
  GaussianPassStats,
  GaussianTileLoadStats,
  GaussianTileCapStats,
  RadixBackend,
  ResolvedRadixBackend,
} from "./pipeline/types";

function webGpuDeviceLimits(renderer: WebGPURenderer): GPUDevice["limits"] {
  const backend = renderer.backend as unknown as { device?: GPUDevice };
  if (backend.device === undefined) {
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render",
    );
  }
  return backend.device.limits;
}
