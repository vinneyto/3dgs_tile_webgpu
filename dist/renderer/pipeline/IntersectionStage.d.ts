import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { FrameUniforms } from "./FrameUniforms";
import type { DispatchResources, IntersectionBuffers, GaussianPassStats } from "./types";
export declare class IntersectionStage {
    private readonly renderer;
    private readonly capacity;
    readonly buffers: IntersectionBuffers;
    readonly dispatch: DispatchResources;
    private readonly attributes;
    private readonly prepareNode;
    private readonly emitNode;
    constructor(renderer: WebGPURenderer, gaussianCount: number, capacity: number, sortedGaussiansAttribute: StorageBufferAttribute, visibleDispatch: DispatchResources, tileCountsAttribute: StorageBufferAttribute, intersectionOffsetsAttribute: StorageBufferAttribute, projectedMeanAttribute: StorageBufferAttribute, projectedConicAttribute: StorageBufferAttribute, projectedColorAttribute: StorageBufferAttribute, frame: FrameUniforms);
    private readonly visibleLinearDispatch;
    encode(): void;
    readStats(): Promise<GaussianPassStats>;
    dispose(): void;
}
