import type { Node, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DepthSortMode, DispatchResources, KeyValueBuffers } from "./types";
export declare class VisibleGaussianStage {
    private readonly renderer;
    readonly buffers: KeyValueBuffers;
    readonly dispatch: DispatchResources;
    private readonly attributes;
    private readonly prepareNode;
    private readonly compactNode;
    constructor(renderer: WebGPURenderer, mode: DepthSortMode, gaussianCount: number, visibleOffsetsAttribute: StorageBufferAttribute, projectedMeanAttribute: StorageBufferAttribute, viewport: Node);
    encode(profileKernels?: boolean): void;
    dispose(): void;
}
