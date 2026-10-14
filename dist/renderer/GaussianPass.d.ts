import { Camera, PassNode, StorageTexture, type Node, type NodeBuilder, type NodeFrame, type ColorSpace, type Texture, type WebGPURenderer } from "three/webgpu";
import type { GaussianRenderStore } from "./GaussianRenderStore";
import { type GaussianPassComposition } from "./passes/GaussianPassComposition";
import type { AntialiasMode, GaussianBoundaryPolicy, DepthSortMode, GaussianPassDebugInfo, GaussianPassDebugListener, GaussianPassOptions, GaussianPassRedrawStrategy, GaussianPassResources, GaussianPassStats, GaussianPassOutputStatus, GaussianPassWarmupOptions, ResolvedRadixBackend } from "./pipeline/types";
/**
 * A multi-cloud Three.js RenderPipeline pass backed by explicit WGSL kernels bound through wgslFn.
 */
export declare class GaussianPass extends PassNode {
    readonly passes: GaussianPassComposition;
    private readonly unsubscribePasses;
    private releaseComposition;
    readonly dataMode: "managed" | "external";
    private fixedSize;
    private readonly renderDomain;
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
    private readonly ownerRenderer;
    private readonly capacityOptions;
    private capacityPolicy;
    private readonly outputState;
    private readonly outputStateNode;
    /** True on the GPU only when the latest attempt produced a complete result. Stable across growth. */
    readonly outputReadyNode: Node<"bool">;
    private outputStatus;
    private outputVersion;
    private confirmedAttempt;
    private latestAttempt;
    private lastDemand;
    private growthCount;
    private growthDurationMs;
    private feedbackError;
    private feedbackInFlight;
    private feedbackGeneration;
    private lastFeedbackTime;
    private pendingCapacity;
    private resetOutput;
    private checkAllocation;
    private warmupPromise;
    private warmupPipeline;
    private warmupGeneration;
    private warmupPending;
    private warmupReserve;
    private resolvedIntersectionCapacity;
    private readonly debugListeners;
    private workingColorNode;
    private pipeline;
    private pipelineLayoutVersion;
    private get nodeSlots();
    private get defaultProjectionNode();
    private dirtyStages;
    private frameDirty;
    private successfulRenderCount;
    private cachedFrameCount;
    private autoSnapshot;
    private pipelineDevice;
    private disposed;
    private unsubscribeStore;
    constructor(renderer: WebGPURenderer, camera: Camera, gaussianStore: GaussianRenderStore, options?: GaussianPassOptions, composition?: GaussianPassComposition);
    /** Resolved after the first render when omitted from GaussianPassOptions. */
    get intersectionCapacity(): number;
    getTexture(name: string): Texture;
    setSize(width: number, height: number): void;
    /** Number of encoded attempts. Completeness is GPU-authoritative; see getOutputStatus(). */
    get renderCount(): number;
    /** Number of frames that reused the last valid output textures. */
    get cacheHitCount(): number;
    /** Color-managed output in Three.js' linear working color space. */
    getColorNode(): Node;
    setup(builder: NodeBuilder): Node;
    /** Exact output resolution. Call useDrawingBufferSize() to restore automatic sizing. */
    setFixedSize(width: number, height: number): this;
    useDrawingBufferSize(): this;
    get depthRange(): readonly [number, number] | null;
    set depthRange(value: readonly [number, number] | null);
    get filterVariance(): number;
    set filterVariance(value: number);
    get invalidDepthValue(): number;
    set invalidDepthValue(value: number);
    get boundaryPolicy(): GaussianBoundaryPolicy;
    set boundaryPolicy(value: GaussianBoundaryPolicy);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianProjectionNode(): Node;
    set gaussianProjectionNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get rasterOutputDepthNode(): Node;
    set rasterOutputDepthNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get rasterOutputValidNode(): Node;
    set rasterOutputValidNode(node: Node);
    /** Encode before subsequent compute/render calls. Feedback is asynchronous and never awaited here. */
    render(): void;
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianPositionLocalNode(): Node;
    set gaussianPositionLocalNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianPositionWorldNode(): Node;
    set gaussianPositionWorldNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianScaleNode(): Node;
    set gaussianScaleNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianRotationNode(): Node;
    set gaussianRotationNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianOpacityNode(): Node;
    set gaussianOpacityNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianColorNode(): Node;
    set gaussianColorNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get gaussianVisibilityNode(): Node;
    set gaussianVisibilityNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get rasterColorNode(): Node;
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get rasterPixelValueNode(): Node;
    set rasterPixelValueNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get rasterBreakNode(): Node;
    set rasterBreakNode(node: Node);
    set rasterColorNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get rasterAlphaNode(): Node;
    set rasterAlphaNode(node: Node);
    /** @deprecated Use passes.projection.nodes or passes.raster.nodes to name the owning pass. */
    get rasterDiscardNode(): Node;
    set rasterDiscardNode(node: Node);
    invalidateProjection(): void;
    invalidateRasterizer(): void;
    /** Force the next frame to run the complete Gaussian kernel chain. */
    invalidate(): void;
    set needsUpdate(value: boolean);
    updateBefore(frame: NodeFrame): boolean | undefined;
    private createPipeline;
    /** Prepare all compatible compute variants on tiny resources before loading models. */
    warmup(options?: GaussianPassWarmupOptions): Promise<void>;
    private prepareWarmup;
    /** Last confirmed GPU result. Freshness is conservative until asynchronous feedback arrives. */
    getOutputStatus(): GaussianPassOutputStatus;
    private failAllocation;
    private scheduleCapacityFeedback;
    /** Subscribe to allocation, LOD and CPU-side pass diagnostics. */
    subscribeDebug(listener: GaussianPassDebugListener): () => void;
    /** Three.js storage attributes produced by the renderer, available after the first frame. */
    getResources(): GaussianPassResources | null;
    /** Full diagnostic readback, separate from automatic 16-byte capacity feedback. */
    readStats(): Promise<GaussianPassStats>;
    /** CPU-side lifecycle information; unlike readStats(), this does not perform a GPU readback. */
    getDebugInfo(): GaussianPassDebugInfo;
    dispose(): void;
    private setProjectionNode;
    private setRasterNode;
    private invalidateAutomatically;
    private autoInputsChanged;
    private captureAutoSnapshot;
}
export type { AntialiasMode, GaussianBoundaryPolicy, DepthSortMode, GaussianPassDebugInfo, GaussianPassDebugListener, GaussianPassDebugSnapshot, GaussianPassOptions, GaussianPassRedrawStrategy, GaussianPassProfileStats, GaussianPassWarmupOptions, GaussianPassOutputStatus, GaussianPassResources, GaussianPassStats, GaussianTileLoadStats, GaussianTileCapStats, RadixBackend, ResolvedRadixBackend, } from "./pipeline/types";
