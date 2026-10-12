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
  StorageBufferAttribute,
  Vector2,
  type Node,
  type NodeBuilder,
  type NodeFrame,
  type ColorSpace,
  type Texture,
  type WebGPURenderer,
} from "three/webgpu";
import { colorSpaceToWorking, storage } from "three/tsl";
import { GaussianData } from "./GaussianData";
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
  GaussianPassOutputStatus,
  GaussianPassWarmupOptions,
  ResolvedRadixBackend,
} from "./pipeline/types";

import { IntersectionCapacityPolicy } from "./pipeline/IntersectionCapacityPolicy";

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
  private readonly capacityOptions: GaussianPassOptions;
  private capacityPolicy: IntersectionCapacityPolicy | null = null;
  private readonly outputState = new StorageBufferAttribute(
    new Uint32Array(4),
    4,
  );
  private readonly outputStateNode = storage(
    this.outputState,
    "uvec4",
    1,
  ).toReadOnly();
  /** True on the GPU only when the latest attempt produced a complete result. Stable across growth. */
  readonly outputReadyNode = this.outputStateNode
    .element(0)
    .y.greaterThan(0)
    .and(this.outputStateNode.element(0).w.equal(0));
  private outputStatus: GaussianPassOutputStatus["state"] =
    "awaiting-first-result";
  private outputVersion = 0;
  private confirmedAttempt = 0;
  private latestAttempt = 0;
  private lastDemand = 0;
  private growthCount = 0;
  private growthDurationMs = 0;
  private feedbackError: string | null = null;
  private feedbackInFlight = false;
  private feedbackGeneration = 0;
  private lastFeedbackTime = -Infinity;
  private pendingCapacity: number | null = null;
  private resetOutput = true;
  private checkAllocation = true;
  private warmupPromise: Promise<void> | null = null;
  private warmupPipeline: TiledGaussianPipeline | null = null;
  private warmupGeneration = -1;
  private warmupPending = false;
  private warmupReserve = false;
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
    validateRasterChunkSize(rasterChunkSize, intersectionCapacity ?? 1);

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
    this.capacityOptions = { ...options };
    this.outputState.name = "3dgs.output-state";
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
      this.resolvedIntersectionCapacity ||
      this.capacityOptions.intersectionCapacity ||
      this.capacityOptions.initialIntersectionCapacity ||
      0
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
      // RenderTarget resize recreates the GPU texture without replacing its
      // JS object. Version it so existing compute storage bindings refresh.
      this.colorTexture.needsUpdate = true;
      if (this.depthTexture) this.depthTexture.needsUpdate = true;
      this.frameDirty = true;
      this.resetOutput = true;
      this.outputVersion = 0;
      this.feedbackGeneration++;
    }
  }

  /** Number of encoded attempts. Completeness is GPU-authoritative; see getOutputStatus(). */
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

  /** Encode before subsequent compute/render calls. Feedback is asynchronous and never awaited here. */
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
      this.capacityPolicy = null;
      this.feedbackGeneration++;
      this.resetOutput = true;
      this.outputVersion = 0;
      this.pendingCapacity = null;
      this.checkAllocation = true;
    }
    if (!this.gaussianStore.hasPackedData) return undefined;
    if (this.capacityPolicy === null) {
      this.capacityPolicy = new IntersectionCapacityPolicy(
        this.capacityOptions,
        device.limits,
        this.rasterChunkSize,
        this.outputDepth,
      );
      this.resolvedIntersectionCapacity = this.capacityPolicy.initial;
    }
    if (this.outputStatus === "allocation-failed") return undefined;

    if (
      this.redrawStrategy === "never" &&
      !this.frameDirty &&
      this.pipeline !== null
    ) {
      if (this.latestAttempt > this.confirmedAttempt)
        this.scheduleCapacityFeedback();
      this.cachedFrameCount++;
      return undefined;
    }

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
    if (data.count > WORKGROUP_SIZE * 65_535)
      throw new RangeError(
        "Gaussian count exceeds the one-dimensional projection dispatch limit",
      );
    if (this.pipeline === null) {
      this.feedbackGeneration++;
      this.pendingCapacity = null;
      this.pipeline = this.createPipeline(data);
      this.checkAllocation = true;
      this.pipelineDevice = device;
      this.pipelineLayoutVersion = this.gaussianStore.layoutVersion;
      this.dirtyStages = DirtyStage.None;
      this.frameDirty = true;
    } else if (
      this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion
    ) {
      this.feedbackGeneration++;
      this.pendingCapacity = null;
      try {
        this.pipeline.updateData(data);
      } catch (error) {
        this.failAllocation(String(error));
        return undefined;
      }
      this.pipelineLayoutVersion = this.gaussianStore.layoutVersion;
      this.checkAllocation = true;
      this.frameDirty = true;
    }
    if (this.warmupReserve) {
      this.resolvedIntersectionCapacity = this.capacityPolicy.initial;
      try {
        this.pipeline.resizeIntersections(
          this.intersectionCapacity,
          this.colorTexture,
          this.depthTexture,
        );
      } catch (error) {
        this.failAllocation(String(error));
        return undefined;
      }
      this.warmupReserve = false;
      this.checkAllocation = true;
    }
    if (this.dirtyStages !== DirtyStage.None) {
      if ((this.dirtyStages & DirtyStage.Projection) !== 0) {
        this.pipeline.rebuildProjection(this.nodeSlots);
      }
      if ((this.dirtyStages & DirtyStage.Rasterizer) !== 0) {
        this.pipeline.rebuildRasterizer(this.nodeSlots);
      }
      this.dirtyStages = DirtyStage.None;
    }
    if (this.pendingCapacity !== null) {
      const capacity = this.pendingCapacity;
      this.pendingCapacity = null;
      this.outputStatus = "resizing";
      const start = performance.now();
      try {
        this.pipeline.resizeIntersections(
          capacity,
          this.colorTexture,
          this.depthTexture,
        );
        this.resolvedIntersectionCapacity = capacity;
        this.growthCount++;
        this.growthDurationMs += performance.now() - start;
        this.feedbackGeneration++;
        this.frameDirty = true;
        this.lastFeedbackTime = -Infinity;
        this.checkAllocation = true;
      } catch (error) {
        this.outputStatus = "allocation-failed";
        this.feedbackError = String(error);
        return undefined;
      }
    }
    if (this.redrawStrategy !== "always" && !this.frameDirty) {
      if (this.latestAttempt > this.confirmedAttempt)
        this.scheduleCapacityFeedback();
      this.cachedFrameCount++;
      return undefined;
    }
    const checkAllocation =
      this.checkAllocation && typeof device.pushErrorScope === "function";
    const allocationGeneration = this.feedbackGeneration;
    if (checkAllocation) {
      device.pushErrorScope("out-of-memory");
      device.pushErrorScope("validation");
    }
    try {
      renderer.initRenderTarget(this.renderTarget);
      this.pipeline.prepareFrame(
        width,
        height,
        this.colorTexture,
        this.depthTexture,
      );
      this.latestAttempt++;
      this.pipeline.render(this.latestAttempt, this.resetOutput);
      this.checkAllocation = false;
    } catch (error) {
      if (checkAllocation) this.failAllocation(String(error));
      throw error;
    } finally {
      if (checkAllocation) {
        void Promise.all([device.popErrorScope(), device.popErrorScope()])
          .then((errors) => {
            if (
              this.disposed ||
              allocationGeneration !== this.feedbackGeneration
            )
              return;
            const error = errors.find((error) => error !== null);
            if (error) this.failAllocation(error.message);
          })
          .catch((error) => {
            if (
              !this.disposed &&
              allocationGeneration === this.feedbackGeneration
            )
              this.failAllocation(String(error));
          });
      }
    }
    this.resetOutput = false;
    if (this.outputStatus !== "budget-exceeded")
      this.outputStatus =
        this.outputVersion > 0 ? "pending" : "awaiting-first-result";
    this.scheduleCapacityFeedback();
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

  private createPipeline(
    data: GaussianData,
    capacity = this.intersectionCapacity,
  ): TiledGaussianPipeline {
    return new TiledGaussianPipeline(
      this.ownerRenderer,
      this.camera,
      data,
      this.gaussianStore,
      this.depthSortMode,
      this.antialiasMode,
      capacity,
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
      this.outputState,
    );
  }

  /** Prepare all compatible compute variants on tiny resources before loading models. */
  warmup(options: GaussianPassWarmupOptions = {}): Promise<void> {
    if (this.disposed)
      return Promise.reject(new Error("GaussianPass has been disposed"));
    if (
      this.warmupPromise &&
      (this.warmupPending ||
        this.pipeline === null ||
        (this.pipeline === this.warmupPipeline &&
          this.pipeline.getShaderGeneration() === this.warmupGeneration &&
          this.dirtyStages === DirtyStage.None))
    )
      return this.warmupPromise;
    this.warmupPending = true;
    const promise = this.prepareWarmup(options)
      .catch((error: unknown) => {
        if (this.warmupPromise === promise) this.warmupPromise = null;
        throw error;
      })
      .finally(() => {
        this.warmupPending = false;
      });
    this.warmupPromise = promise;
    return this.warmupPromise;
  }

  private async prepareWarmup(
    options: GaussianPassWarmupOptions,
  ): Promise<void> {
    await this.ownerRenderer.init();
    if (this.disposed) return;
    const device = webGpuDevice(this.ownerRenderer);
    if (this.capacityPolicy === null) {
      this.capacityPolicy = new IntersectionCapacityPolicy(
        this.capacityOptions,
        device.limits,
        this.rasterChunkSize,
        this.outputDepth,
      );
      this.resolvedIntersectionCapacity = this.capacityPolicy.initial;
    }
    if (this.pipeline === null) {
      const known = this.gaussianStore.hasPackedData
        ? this.gaussianStore.getPackedData()
        : null;
      const geometry =
        options.geometryFormat ?? known?.geometryFormat ?? "compact";
      const sh = options.shFormat ?? known?.shFormat ?? "rgb8e8";
      const activeSlots =
        options.activeSlots ?? (known ? Boolean(known.activeSlots) : true);
      const data = new GaussianData(
        {
          means: new StorageBufferAttribute(new Float32Array(4), 4),
          scalesOpacity: new StorageBufferAttribute(
            geometry === "compact" ? new Uint32Array(2) : new Float32Array(4),
            geometry === "compact" ? 2 : 4,
          ),
          rotations: new StorageBufferAttribute(
            geometry === "compact" ? new Uint32Array(1) : new Float32Array(4),
            geometry === "compact" ? 1 : 4,
          ),
          shCoefficients: new StorageBufferAttribute(
            sh === "rgb8e8" ? new Uint32Array(2) : new Float32Array(8),
            sh === "rgb8e8" ? 1 : 4,
          ),
        },
        {
          count: 1,
          geometryFormat: geometry,
          shFormat: sh,
          activeSlots: activeSlots ? new Uint32Array() : undefined,
          ownsBuffers: true,
        },
      );
      this.pipeline = this.createPipeline(data, 1);
      data.dispose(); // The projection's lease keeps it alive until replacement.
      this.pipelineDevice = device;
      this.pipelineLayoutVersion = -1;
      this.warmupReserve = true;
      this.resolvedIntersectionCapacity = 1;
      this.dirtyStages = DirtyStage.None;
      this.ownerRenderer.initRenderTarget(this.renderTarget);
      this.pipeline.prepareFrame(1, 1, this.colorTexture, this.depthTexture);
    }
    if ((this.dirtyStages & DirtyStage.Projection) !== 0)
      this.pipeline.rebuildProjection(this.nodeSlots);
    if ((this.dirtyStages & DirtyStage.Rasterizer) !== 0)
      this.pipeline.rebuildRasterizer(this.nodeSlots);
    this.dirtyStages = DirtyStage.None;
    const pipeline = this.pipeline;
    this.warmupPipeline = pipeline;
    this.warmupGeneration = pipeline.getShaderGeneration();
    device.pushErrorScope("validation");
    device.pushErrorScope("out-of-memory");
    try {
      await pipeline.warmup(() => this.disposed || this.pipeline !== pipeline);
    } finally {
      const errors = await Promise.all([
        device.popErrorScope(),
        device.popErrorScope(),
      ]);
      const error = errors.find((error) => error !== null);
      if (error && !this.disposed && this.pipeline === pipeline) {
        this.failAllocation(error.message);
        throw new Error(error.message);
      }
    }
  }

  /** Last confirmed GPU result. Freshness is conservative until asynchronous feedback arrives. */
  getOutputStatus(): GaussianPassOutputStatus {
    return {
      state: this.outputStatus,
      valid: this.outputVersion > 0,
      fresh:
        !this.frameDirty &&
        this.outputVersion > 0 &&
        this.outputVersion === this.latestAttempt,
      version: this.outputVersion,
      confirmedAttempt: this.confirmedAttempt,
      latestAttempt: this.latestAttempt,
      requestedIntersections: this.lastDemand,
      intersectionCapacity: this.intersectionCapacity,
      maxIntersectionCapacity: this.capacityPolicy?.maximum ?? 0,
      growthCount: this.growthCount,
      growthDurationMs: this.growthDurationMs,
      intersectionBufferBytes: this.intersectionCapacity * 16,
      error: this.feedbackError,
    };
  }

  private failAllocation(message: string): void {
    this.outputStatus = "allocation-failed";
    this.feedbackError = message;
    this.outputVersion = 0;
    this.feedbackGeneration++;
    (this.outputState.array as Uint32Array).fill(0);
    this.outputState.needsUpdate = true;
  }

  private scheduleCapacityFeedback(): void {
    const now = performance.now();
    if (
      this.feedbackInFlight ||
      (this.outputVersion > 0 &&
        now - this.lastFeedbackTime < this.capacityPolicy!.interval)
    )
      return;
    this.feedbackInFlight = true;
    this.lastFeedbackTime = now;
    const generation = this.feedbackGeneration;
    const pipeline = this.pipeline;
    // Three copies this tiny buffer into a private staging buffer before the
    // first await, so later submissions cannot overwrite the sampled values.
    void this.ownerRenderer
      .getArrayBufferAsync(this.outputState)
      .then((buffer) => {
        if (
          this.disposed ||
          generation !== this.feedbackGeneration ||
          pipeline !== this.pipeline
        )
          return;
        const [attempt = 0, version = 0, demand = 0, overflow = 0] =
          new Uint32Array(buffer);
        this.confirmedAttempt = attempt;
        this.outputVersion = version;
        this.lastDemand = demand;
        this.feedbackError = null;
        if (overflow !== 0) {
          const next = this.capacityPolicy!.next(
            this.intersectionCapacity,
            demand,
          );
          this.outputStatus =
            next === null ? "budget-exceeded" : "overflow-pending";
          if (next !== null && next > this.intersectionCapacity)
            this.pendingCapacity = next;
          // Retry current camera/data even with auto/never redraw after feedback.
          this.frameDirty = true;
        } else {
          this.outputStatus =
            attempt === this.latestAttempt ? "ready" : "pending";
        }
      })
      .catch((error) => {
        if (
          this.disposed ||
          generation !== this.feedbackGeneration ||
          pipeline !== this.pipeline
        )
          return;
        this.outputStatus = "readback-failed";
        this.feedbackError = String(error);
        this.frameDirty = true;
      })
      .finally(() => {
        this.feedbackInFlight = false;
      });
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

  /** Full diagnostic readback, separate from automatic 16-byte capacity feedback. */
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
    this.feedbackGeneration++;
    this.outputState.dispose();
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
  GaussianPassWarmupOptions,
  GaussianPassOutputStatus,
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
