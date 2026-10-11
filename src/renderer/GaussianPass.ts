import {
  FloatType,
  Camera,
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
import type { GaussianRenderStore } from "./GaussianRenderStore";
import type { FrontendCapabilities } from "../streaming-backend/FrontendCapabilities";
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
  GaussianBoundaryPolicy,
  GaussianRenderDomain,
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassDebugListener,
  GaussianPassOptions,
  GaussianPassRedrawStrategy,
  GaussianPassResources,
  GaussianPassStats,
  ResolvedRadixBackend,
} from "./pipeline/types";

import { cameraDepthRange } from "./pipeline/FrameUniforms";

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
  readonly dataMode: "managed" | "external";
  private fixedSize: { width: number; height: number } | null = null;
  private readonly renderDomain: GaussianRenderDomain;
  readonly gaussianStore: GaussianRenderStore;
  readonly redrawStrategy: GaussianPassRedrawStrategy;
  readonly depthSortMode: DepthSortMode;
  readonly antialiasMode: AntialiasMode;
  readonly background: readonly [number, number, number, number];
  readonly outputDepth: boolean;
  readonly depthAlphaThreshold: number;
  readonly colorSpace: ColorSpace;
  readonly profileKernels: boolean;
  readonly rasterStats: boolean;
  readonly rasterTransmittanceThreshold: number;
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
  private readonly defaultProjectionNode =
    this.nodeSlots.gaussianProjectionNode;
  private dirtyStages = DirtyStage.None;
  private frameDirty = true;
  private successfulRenderCount = 0;
  private cachedFrameCount = 0;
  private autoSnapshot: AutoRedrawSnapshot | null = null;
  private pipelineDevice: GPUDevice | null = null;
  private disposed = false;
  private unsubscribeStore: (() => void) | null = null;

  constructor(
    renderer: WebGPURenderer,
    camera: Camera,
    gaussianStore: GaussianRenderStore,
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
    const redrawStrategy = options.redrawStrategy ?? "always";
    const requestedRadixBackend = options.radixBackend ?? "auto";
    if (antialiasMode !== "compensated" && antialiasMode !== "classic") {
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"',
      );
    }
    if (
      redrawStrategy !== "always" &&
      redrawStrategy !== "auto" &&
      redrawStrategy !== "never"
    ) {
      throw new RangeError(
        'redrawStrategy must be "always", "auto", or "never"',
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

    this.dataMode = options.dataMode ?? "managed";
    if (this.dataMode !== "managed" && this.dataMode !== "external")
      throw new RangeError('dataMode must be "managed" or "external"');
    this.renderDomain = {
      depthRange: null,
      filterVariance: 0.3,
      invalidDepthValue: 1,
      boundaryPolicy: "clip",
    };
    this.depthRange = options.depthRange ?? null;
    this.filterVariance = options.filterVariance ?? 0.3;
    this.invalidDepthValue = options.invalidDepthValue ?? 1;
    this.boundaryPolicy = options.boundaryPolicy ?? "clip";
    this.name = "GaussianPass";
    this.ownerRenderer = renderer;
    this.gaussianStore = gaussianStore;
    this.unsubscribeStore = gaussianStore.subscribe(() => this.invalidate());
    this.redrawStrategy = redrawStrategy;
    this.depthSortMode = depthSortMode;
    this.antialiasMode = antialiasMode;
    this.requestedIntersectionCapacity = intersectionCapacity;
    this.background = options.background ?? [0, 0, 0, 0];
    this.outputDepth = options.outputDepth ?? false;
    this.depthAlphaThreshold = options.depthAlphaThreshold ?? 0.95;
    if (
      !Number.isFinite(this.depthAlphaThreshold) ||
      this.depthAlphaThreshold < 0 ||
      this.depthAlphaThreshold > 1
    ) {
      throw new RangeError("depthAlphaThreshold must be finite and in [0, 1]");
    }
    this.colorSpace = options.colorSpace ?? SRGBColorSpace;
    this.profileKernels = options.profileKernels ?? false;
    this.rasterStats = options.rasterStats ?? false;
    this.rasterTransmittanceThreshold =
      options.rasterTransmittanceThreshold ?? 1e-4;
    if (
      !Number.isFinite(this.rasterTransmittanceThreshold) ||
      this.rasterTransmittanceThreshold <= 0 ||
      this.rasterTransmittanceThreshold >= 1
    ) {
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)",
      );
    }
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

    if (options.fixedSize)
      this.setFixedSize(options.fixedSize.width, options.fixedSize.height);

    // The store processes loads independently; the pass enables render output.
    const device = (
      renderer.backend as unknown as { device?: GPUDevice } | undefined
    )?.device;
    if (device && this.dataMode === "managed") {
      renderer.getDrawingBufferSize(drawingBufferSize);
      const scale = this.getResolutionScale();
      this.gaussianStore.setFrontendCapabilities(
        frontendCapabilities(device),
        camera,
        this.fixedSize?.width ??
          Math.max(1, Math.floor(drawingBufferSize.x * scale)),
        this.fixedSize?.height ??
          Math.max(1, Math.floor(drawingBufferSize.y * scale)),
      );
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
    const previousWidth = this.renderTarget.width;
    const previousHeight = this.renderTarget.height;
    if (this.fixedSize)
      this.renderTarget.setSize(this.fixedSize.width, this.fixedSize.height);
    else super.setSize(width, height);
    this.depthTexture?.setSize(
      this.renderTarget.width,
      this.renderTarget.height,
      1,
    );
    if (
      previousWidth !== this.renderTarget.width ||
      previousHeight !== this.renderTarget.height
    ) {
      this.frameDirty = true;
    }
  }

  /** Number of complete Gaussian kernel chains successfully encoded. */
  get renderCount(): number {
    return this.successfulRenderCount;
  }

  /** Number of frames that reused the last valid output textures. */
  get cacheHitCount(): number {
    return this.cachedFrameCount;
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

  /** Exact output resolution. Call useDrawingBufferSize() to restore automatic sizing. */
  setFixedSize(width: number, height: number): this {
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width < 1 ||
      height < 1
    )
      throw new RangeError(
        "fixedSize width/height must be positive safe integers",
      );
    this.fixedSize = { width, height };
    this.setSize(width, height);
    this.invalidate();
    return this;
  }

  useDrawingBufferSize(): this {
    this.fixedSize = null;
    this.invalidate();
    return this;
  }

  get depthRange(): readonly [number, number] | null {
    return this.renderDomain.depthRange;
  }
  set depthRange(value: readonly [number, number] | null) {
    if (
      value &&
      (!Number.isFinite(value[0]) ||
        !Number.isFinite(value[1]) ||
        value[0] <= 0 ||
        Math.fround(value[0]) <= 0 ||
        value[1] <= value[0] ||
        !Number.isFinite(Math.fround(value[1])) ||
        Math.fround(value[0]) >= Math.fround(value[1]))
    )
      throw new RangeError(
        "depthRange must contain finite positive increasing float32 values",
      );
    this.renderDomain.depthRange = value
      ? Object.freeze([value[0], value[1]] as const)
      : null;
    this.invalidate();
  }

  get filterVariance(): number {
    return this.renderDomain.filterVariance;
  }
  set filterVariance(value: number) {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      !Number.isFinite(Math.fround(value))
    )
      throw new RangeError("filterVariance must be finite and nonnegative");
    this.renderDomain.filterVariance = value;
    this.invalidate();
  }

  get invalidDepthValue(): number {
    return this.renderDomain.invalidDepthValue;
  }
  set invalidDepthValue(value: number) {
    if (
      Number.isNaN(value) ||
      (Number.isFinite(value) && !Number.isFinite(Math.fround(value)))
    )
      throw new RangeError(
        "invalidDepthValue must be representable as float32 and cannot be NaN",
      );
    this.renderDomain.invalidDepthValue = value;
    this.invalidate();
  }

  get boundaryPolicy(): GaussianBoundaryPolicy {
    return this.renderDomain.boundaryPolicy;
  }
  set boundaryPolicy(value: GaussianBoundaryPolicy) {
    if (value !== "clip" && value !== "repeat-x" && value !== "repeat-y")
      throw new RangeError(
        'boundaryPolicy must be "clip", "repeat-x", or "repeat-y"',
      );
    this.renderDomain.boundaryPolicy = value;
    // One uniform is shared by every dependent stage; no graph rebuild needed.
    this.invalidate();
  }

  get gaussianProjectionNode(): Node {
    return this.nodeSlots.gaussianProjectionNode;
  }
  set gaussianProjectionNode(node: Node) {
    this.setProjectionNode("gaussianProjectionNode", node);
  }
  get rasterOutputDepthNode(): Node {
    return this.nodeSlots.rasterOutputDepthNode;
  }
  set rasterOutputDepthNode(node: Node) {
    this.setRasterNode("rasterOutputDepthNode", node);
  }
  get rasterOutputValidNode(): Node {
    return this.nodeSlots.rasterOutputValidNode;
  }
  set rasterOutputValidNode(node: Node) {
    this.setRasterNode("rasterOutputValidNode", node);
  }

  /** Encode the pass before subsequent renderer.compute/render calls on this renderer. No readback. */
  render(): void {
    this.updateBefore({ renderer: this.ownerRenderer } as unknown as NodeFrame);
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

  get rasterPixelValueNode(): Node {
    return this.nodeSlots.rasterPixelValueNode;
  }

  set rasterPixelValueNode(node: Node) {
    this.setRasterNode("rasterPixelValueNode", node);
  }

  get rasterBreakNode(): Node {
    return this.nodeSlots.rasterBreakNode;
  }

  set rasterBreakNode(node: Node) {
    this.setRasterNode("rasterBreakNode", node);
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
    this.invalidateAutomatically();
  }

  invalidateRasterizer(): void {
    this.dirtyStages |= DirtyStage.Rasterizer;
    this.invalidateAutomatically();
  }

  /** Force the next frame to run the complete Gaussian kernel chain. */
  invalidate(): void {
    this.frameDirty = true;
  }

  override set needsUpdate(value: boolean) {
    super.needsUpdate = value;
    if (value) {
      this.dirtyStages |= DirtyStage.All;
      this.invalidateAutomatically();
    }
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
    if (
      this.nodeSlots.gaussianProjectionNode === this.defaultProjectionNode &&
      !(this.camera instanceof PerspectiveCamera)
    ) {
      throw new TypeError(
        "The default GaussianPass projection requires a PerspectiveCamera; set gaussianProjectionNode for other cameras",
      );
    }

    renderer.getDrawingBufferSize(drawingBufferSize);
    const drawingBufferWidth = Math.max(1, Math.floor(drawingBufferSize.x));
    const drawingBufferHeight = Math.max(1, Math.floor(drawingBufferSize.y));
    const resolutionScale = this.getResolutionScale();
    const width =
      this.fixedSize?.width ??
      Math.max(1, Math.floor(drawingBufferWidth * resolutionScale));
    const height =
      this.fixedSize?.height ??
      Math.max(1, Math.floor(drawingBufferHeight * resolutionScale));
    if (
      this.renderTarget.width !== width ||
      this.renderTarget.height !== height
    ) {
      this.setSize(drawingBufferWidth, drawingBufferHeight);
    }
    const device = webGpuDevice(renderer);
    if (this.dataMode === "managed")
      this.gaussianStore.setFrontendCapabilities(
        frontendCapabilities(device),
        this.camera,
        width,
        height,
      );
    if (this.pipelineDevice !== null && this.pipelineDevice !== device) {
      this.pipeline?.dispose();
      this.pipeline = null;
      this.pipelineLayoutVersion = -1;
      this.frameDirty = true;
      this.autoSnapshot = null;
    }

    if (
      this.redrawStrategy === "never" &&
      !this.frameDirty &&
      this.pipeline !== null
    ) {
      this.cachedFrameCount++;
      return undefined;
    }

    if (!this.gaussianStore.hasPackedData) return undefined;
    const lodUpdate =
      this.dataMode === "managed"
        ? this.gaussianStore.updateLod(this.camera)
        : { appliedBatches: 0, pending: false, clouds: [] };
    if (
      this.redrawStrategy === "auto" &&
      this.autoInputsChanged(width, height)
    ) {
      this.frameDirty = true;
    }
    const data = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null) {
      this.resolvedIntersectionCapacity = Math.min(
        WORKGROUP_SIZE * 65_535,
        Math.max(1, data.count * 16),
      );
    }
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
        this.rasterTransmittanceThreshold,
        this.rasterStats,
        this.depthAlphaThreshold,
        this.renderDomain,
      );
      this.pipelineDevice = device;
      this.pipelineLayoutVersion = this.gaussianStore.layoutVersion;
      this.dirtyStages = DirtyStage.None;
      this.frameDirty = true;
    } else if (this.dirtyStages !== DirtyStage.None) {
      if ((this.dirtyStages & DirtyStage.Projection) !== 0) {
        this.pipeline.rebuildProjection(this.nodeSlots);
      }
      if ((this.dirtyStages & DirtyStage.Rasterizer) !== 0) {
        this.pipeline.rebuildRasterizer(this.nodeSlots);
      }
      this.dirtyStages = DirtyStage.None;
    }
    if (this.redrawStrategy !== "always" && !this.frameDirty) {
      this.cachedFrameCount++;
      return undefined;
    }
    renderer.initRenderTarget(this.renderTarget);
    this.pipeline.prepareFrame(
      width,
      height,
      this.colorTexture,
      this.depthTexture,
    );
    this.pipeline.render();
    this.frameDirty = false;
    this.successfulRenderCount++;
    if (this.redrawStrategy === "auto") {
      this.autoSnapshot = this.captureAutoSnapshot(width, height);
    }
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
        tileCapacity: 0,
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
    this.unsubscribeStore?.();
    this.unsubscribeStore = null;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.pipelineDevice = null;
    this.frameDirty = true;
    this.autoSnapshot = null;
    this.debugListeners.clear();
    this.depthTexture?.dispose();
    super.dispose();
  }

  private setProjectionNode(
    key: keyof Pick<
      GaussianNodeSlots,
      | "gaussianProjectionNode"
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
      | "rasterOutputDepthNode"
      | "rasterOutputValidNode"
      | "rasterPixelValueNode"
      | "rasterBreakNode"
      | "rasterColorNode"
      | "rasterAlphaNode"
      | "rasterDiscardNode"
    >,
    node: Node,
  ): void {
    assertNode(node, key);
    if (this.nodeSlots[key] === node) return;
    this.nodeSlots[key] = node;
    this.invalidateRasterizer();
  }

  private invalidateAutomatically(): void {
    if (this.redrawStrategy === "auto") this.frameDirty = true;
  }

  private autoInputsChanged(width: number, height: number): boolean {
    const snapshot = this.autoSnapshot;
    if (snapshot === null) return true;
    const camera = this.camera;
    const range = this.depthRange ?? cameraDepthRange(camera);
    camera.updateWorldMatrix(true, false);
    if (
      snapshot.width !== width ||
      snapshot.height !== height ||
      snapshot.cameraNear !== range[0] ||
      snapshot.cameraFar !== range[1] ||
      snapshot.cameraLayers !== camera.layers.mask ||
      snapshot.storeContentVersion !== this.gaussianStore.contentVersion ||
      !matrixEquals(
        snapshot.projectionMatrix,
        camera.projectionMatrix.elements,
      ) ||
      !matrixEquals(
        snapshot.cameraMatrixWorldInverse,
        camera.matrixWorldInverse.elements,
      ) ||
      snapshot.clouds.length !== this.gaussianStore.clouds.length
    ) {
      return true;
    }
    for (let index = 0; index < snapshot.clouds.length; index++) {
      const previous = snapshot.clouds[index]!;
      const cloud = this.gaussianStore.clouds[index]!;
      cloud.updateWorldMatrix(true, false);
      if (
        previous.cloud !== cloud ||
        previous.visible !== isEffectivelyVisible(cloud, camera) ||
        !matrixEquals(previous.matrixWorld, cloud.matrixWorld.elements)
      ) {
        return true;
      }
    }
    return false;
  }

  private captureAutoSnapshot(
    width: number,
    height: number,
  ): AutoRedrawSnapshot {
    const camera = this.camera;
    const range = this.depthRange ?? cameraDepthRange(camera);
    camera.updateWorldMatrix(true, false);
    return {
      width,
      height,
      cameraNear: range[0],
      cameraFar: range[1],
      cameraLayers: camera.layers.mask,
      projectionMatrix: [...camera.projectionMatrix.elements],
      cameraMatrixWorldInverse: [...camera.matrixWorldInverse.elements],
      storeContentVersion: this.gaussianStore.contentVersion,
      clouds: this.gaussianStore.clouds.map((cloud) => {
        cloud.updateWorldMatrix(true, false);
        return {
          cloud,
          visible: isEffectivelyVisible(cloud, camera),
          matrixWorld: [...cloud.matrixWorld.elements],
        };
      }),
    };
  }
}

interface AutoRedrawSnapshot {
  readonly width: number;
  readonly height: number;
  readonly cameraNear: number;
  readonly cameraFar: number;
  readonly cameraLayers: number;
  readonly projectionMatrix: readonly number[];
  readonly cameraMatrixWorldInverse: readonly number[];
  readonly storeContentVersion: number;
  readonly clouds: readonly AutoCloudSnapshot[];
}

interface AutoCloudSnapshot {
  readonly cloud: GaussianRenderStore["clouds"][number];
  readonly visible: boolean;
  readonly matrixWorld: readonly number[];
}

function matrixEquals(
  previous: readonly number[],
  current: readonly number[],
): boolean {
  for (let index = 0; index < 16; index++) {
    if (previous[index] !== current[index]) return false;
  }
  return true;
}

function isEffectivelyVisible(
  cloud: GaussianRenderStore["clouds"][number],
  camera: Camera,
): boolean {
  if (!cloud.layers.test(camera.layers)) return false;
  let current: typeof cloud.parent | typeof cloud = cloud;
  let root: typeof cloud.parent | typeof cloud = cloud;
  while (current !== null) {
    if (!current.visible) return false;
    root = current;
    current = current.parent;
  }
  return root instanceof Scene;
}

function assertNode(node: Node, field: string): void {
  if (node?.isNode !== true) {
    throw new TypeError(`GaussianPass.${field} must be a Three.js Node`);
  }
}

export type {
  AntialiasMode,
  GaussianBoundaryPolicy,
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassDebugListener,
  GaussianPassDebugSnapshot,
  GaussianPassOptions,
  GaussianPassRedrawStrategy,
  GaussianPassProfileStats,
  GaussianPassResources,
  GaussianPassStats,
  GaussianTileLoadStats,
  GaussianTileCapStats,
  RadixBackend,
  ResolvedRadixBackend,
} from "./pipeline/types";

function webGpuDevice(renderer: WebGPURenderer): GPUDevice {
  const backend = renderer.backend as unknown as { device?: GPUDevice };
  if (backend.device === undefined) {
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render",
    );
  }
  return backend.device;
}

function frontendCapabilities(device: GPUDevice): FrontendCapabilities {
  return {
    maxStorageBufferBindingSize: device.limits.maxStorageBufferBindingSize,
    maxBufferSize: device.limits.maxBufferSize,
    supportsCompactGaussians: true,
    maxStorageBuffersPerShaderStage:
      device.limits.maxStorageBuffersPerShaderStage,
    supportsPartialBufferUpdates: true,
  };
}
