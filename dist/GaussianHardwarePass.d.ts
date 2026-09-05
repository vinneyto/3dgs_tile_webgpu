import { PassNode, PerspectiveCamera, Scene, type ColorSpace, type Node, type NodeFrame, type WebGPURenderer } from "three/webgpu";
import { GaussianStore } from "./GaussianStore";
import type { GaussianPassOptions, GaussianPassStats, GaussianPassDebugInfo, GaussianPassDebugListener, DepthSortMode, AntialiasMode, ResolvedRadixBackend } from "./pipeline/types";
export interface GaussianHardwarePassOptions extends Pick<GaussianPassOptions, "depthSortMode" | "antialiasMode" | "colorSpace" | "profileKernels" | "subpixelSampleCulling" | "radixBackend"> {
    /** Optional mesh scene: opaque geometry, splats, then transparent geometry share one depth attachment. */
    scene?: Scene;
}
/** GPU-sorted instanced quads with native blending and opaque-scene depth testing. */
export declare class GaussianHardwarePass extends PassNode {
    readonly gaussianStore: GaussianStore;
    readonly depthSortMode: DepthSortMode;
    readonly antialiasMode: AntialiasMode;
    readonly colorSpace: ColorSpace;
    readonly profileKernels: boolean;
    readonly subpixelSampleCulling: boolean;
    readonly radixBackend: ResolvedRadixBackend;
    private readonly ownerRenderer;
    private readonly nodeSlots;
    private pipeline;
    private layoutVersion;
    private projectionDirty;
    private rasterDirty;
    private disposed;
    private readonly size;
    private readonly nearNode;
    private readonly farNode;
    private readonly debugListeners;
    constructor(renderer: WebGPURenderer, camera: PerspectiveCamera, store: GaussianStore, options?: GaussianHardwarePassOptions);
    invalidateProjection(): void;
    invalidateRasterizer(): void;
    set needsUpdate(value: boolean);
    getViewZNode(name?: string): Node<"float">;
    getLinearDepthNode(name?: string): Node<"float">;
    updateBefore(frame: NodeFrame): undefined;
    private renderScene;
    subscribeDebug(listener: GaussianPassDebugListener): () => void;
    readStats(): Promise<GaussianPassStats>;
    getDebugInfo(): GaussianPassDebugInfo;
    dispose(): void;
    private setNode;
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
    set rasterColorNode(node: Node);
    get rasterAlphaNode(): Node;
    set rasterAlphaNode(node: Node);
    get rasterDiscardNode(): Node;
    set rasterDiscardNode(node: Node);
}
export declare function gaussianHardwarePass(renderer: WebGPURenderer, camera: PerspectiveCamera, store: GaussianStore, options?: GaussianHardwarePassOptions): GaussianHardwarePass;
