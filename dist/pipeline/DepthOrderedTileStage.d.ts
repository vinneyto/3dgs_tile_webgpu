import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DispatchResources } from "./types";
export declare class DepthOrderedTileStage {
    private readonly renderer;
    private readonly visibleDispatch;
    readonly tileCounts: StorageBufferAttribute;
    private readonly attributes;
    private readonly computeNode;
    constructor(renderer: WebGPURenderer, gaussianCount: number, originalTileCounts: StorageBufferAttribute, sortedGaussians: StorageBufferAttribute, visibleDispatch: DispatchResources);
    encode(): void;
    dispose(): void;
}
