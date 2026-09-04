import { PassNode, PerspectiveCamera, StorageTexture, type Node, type NodeBuilder, type NodeFrame, type ColorSpace, type Texture, type WebGPURenderer } from "three/webgpu";
import { GaussianStore } from "./GaussianStore";
import type { AntialiasMode, DepthSortMode, GaussianPassDebugInfo, GaussianPassDebugListener, GaussianPassOptions, GaussianPassResources, GaussianPassStats, ResolvedRadixBackend } from "./pipeline/types";
/**
 * A multi-cloud Three.js RenderPipeline pass backed by explicit WGSL kernels bound through wgslFn.
 */
export declare class GaussianPass extends PassNode {
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
    private readonly ownerRenderer;
    private readonly requestedIntersectionCapacity;
    private resolvedIntersectionCapacity;
    private readonly debugListeners;
    private workingColorNode;
    private pipeline;
    private pipelineLayoutVersion;
    private readonly nodeSlots;
    private dirtyStages;
    private disposed;
    constructor(renderer: WebGPURenderer, camera: PerspectiveCamera, gaussianStore: GaussianStore, options?: GaussianPassOptions);
    /** Resolved after the first render when omitted from GaussianPassOptions. */
    get intersectionCapacity(): number;
    getTexture(name: string): Texture;
    setSize(width: number, height: number): void;
    /** Color-managed output in Three.js' linear working color space. */
    getColorNode(): Node;
    setup(builder: NodeBuilder): Node;
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
    set needsUpdate(value: boolean);
    updateBefore(frame: NodeFrame): boolean | undefined;
    /** Subscribe to allocation, LOD and CPU-side pass diagnostics. */
    subscribeDebug(listener: GaussianPassDebugListener): () => void;
    /** Three.js storage attributes produced by the renderer, available after the first frame. */
    getResources(): GaussianPassResources | null;
    /** Optional diagnostic readback. Normal rendering never reads the GPU count. */
    readStats(): Promise<GaussianPassStats>;
    /** CPU-side lifecycle information; unlike readStats(), this does not perform a GPU readback. */
    getDebugInfo(): GaussianPassDebugInfo;
    dispose(): void;
    private setProjectionNode;
    private setRasterNode;
}
export type { AntialiasMode, DepthSortMode, GaussianPassDebugInfo, GaussianPassDebugListener, GaussianPassDebugSnapshot, GaussianPassOptions, GaussianPassProfileStats, GaussianPassResources, GaussianPassStats, GaussianTileLoadStats, GaussianTileCapStats, RadixBackend, ResolvedRadixBackend, } from "./pipeline/types";
