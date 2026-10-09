import type { Node, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DepthSortMode, DispatchResources, KeyValueBuffers } from "./types";
export declare class VisibleGaussianStage {
    private readonly renderer;
    private readonly getActiveCount?;
    readonly buffers: KeyValueBuffers;
    readonly dispatch: DispatchResources;
    private readonly attributes;
    private readonly prepareNode;
    private readonly compactNode;
    constructor(renderer: WebGPURenderer, mode: DepthSortMode, gaussianCount: number, visibleOffsetsAttribute: StorageBufferAttribute, projectedMeanAttribute: StorageBufferAttribute, viewport: Node, activeCount?: Node, getActiveCount?: (() => number) | undefined);
    encode(profileKernels?: boolean): void;
    dispose(): void;
}
