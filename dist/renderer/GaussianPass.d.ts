import { Camera, PassNode, StorageTexture, type Node, type NodeBuilder, type NodeFrame, type ColorSpace, type Texture, type WebGPURenderer } from "three/webgpu";
import type { GaussianRenderStore } from "./GaussianRenderStore";
import type { AntialiasMode, GaussianBoundaryPolicy, DepthSortMode, GaussianPassDebugInfo, GaussianPassDebugListener, GaussianPassOptions, GaussianPassRedrawStrategy, GaussianPassResources, GaussianPassStats, GaussianPassOutputStatus, ResolvedRadixBackend } from "./pipeline/types";
/**
 * A multi-cloud Three.js RenderPipeline pass backed by explicit WGSL kernels bound through wgslFn.
 */
export declare class GaussianPass extends PassNode {
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
    private resolvedIntersectionCapacity;
    private readonly debugListeners;
    private workingColorNode;
    private pipeline;
    private pipelineLayoutVersion;
    private readonly nodeSlots;
    private readonly defaultProjectionNode;
    private dirtyStages;
    private frameDirty;
    private successfulRenderCount;
    private cachedFrameCount;
    private autoSnapshot;
    private pipelineDevice;
    private disposed;
    private unsubscribeStore;
    constructor(renderer: WebGPURenderer, camera: Camera, gaussianStore: GaussianRenderStore, options?: GaussianPassOptions);
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
    get gaussianProjectionNode(): Node;
    set gaussianProjectionNode(node: Node);
    get rasterOutputDepthNode(): Node;
    set rasterOutputDepthNode(node: Node);
    get rasterOutputValidNode(): Node;
    set rasterOutputValidNode(node: Node);
    /** Encode before subsequent compute/render calls. Feedback is asynchronous and never awaited here. */
    render(): void;
    get gaussianPositionLocalNode(): Node;
    set gaussianPositionLocalNode(node: Node);
    get gaussianPositionWorldNode(): Node;
    set gaussianPositionWorldNode(node: Node);
    get gaussianScaleNode(): Node;
    set gaussianScaleNode(node: Node);
    get gaussianRotationNode(): Node;
    set gaussianRotationNode(node: Node);
    get gaussianOpacityNode(): Node;
    set gaussianOpacityNode(node: Node);
    get gaussianColorNode(): Node;
    set gaussianColorNode(node: Node);
    get gaussianVisibilityNode(): Node;
    set gaussianVisibilityNode(node: Node);
    get rasterColorNode(): Node;
    get rasterPixelValueNode(): Node;
    set rasterPixelValueNode(node: Node);
    get rasterBreakNode(): Node;
    set rasterBreakNode(node: Node);
    set rasterColorNode(node: Node);
    get rasterAlphaNode(): Node;
    set rasterAlphaNode(node: Node);
    get rasterDiscardNode(): Node;
    set rasterDiscardNode(node: Node);
    invalidateProjection(): void;
    invalidateRasterizer(): void;
    /** Force the next frame to run the complete Gaussian kernel chain. */
    invalidate(): void;
    set needsUpdate(value: boolean);
    updateBefore(frame: NodeFrame): boolean | undefined;
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
export type { AntialiasMode, GaussianBoundaryPolicy, DepthSortMode, GaussianPassDebugInfo, GaussianPassDebugListener, GaussianPassDebugSnapshot, GaussianPassOptions, GaussianPassRedrawStrategy, GaussianPassProfileStats, GaussianPassOutputStatus, GaussianPassResources, GaussianPassStats, GaussianTileLoadStats, GaussianTileCapStats, RadixBackend, ResolvedRadixBackend, } from "./pipeline/types";
