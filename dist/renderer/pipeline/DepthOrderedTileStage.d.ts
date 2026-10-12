import { StorageBindings } from "./StorageBindings";
import type { ComputeNode, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DispatchResources } from "./types";
export declare class DepthOrderedTileStage {
    private readonly renderer;
    private readonly visibleDispatch;
    tileCounts: StorageBufferAttribute;
    private readonly attributes;
    private readonly computeNode;
    constructor(renderer: WebGPURenderer, gaussianCount: number, originalTileCounts: StorageBufferAttribute, sortedGaussians: StorageBufferAttribute, visibleDispatch: DispatchResources, bindings?: StorageBindings);
    resize(count: number): void;
    getComputeNodes(): ComputeNode[];
    encode(): void;
    dispose(): void;
}
