import type { IndirectStorageBufferAttribute, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
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
    private readonly outputNode;
    readonly rasterDispatch: IndirectStorageBufferAttribute;
    private readonly emitDispatch;
    private readonly attempt;
    private readonly resetValid;
    readonly outputState: StorageBufferAttribute;
    constructor(renderer: WebGPURenderer, gaussianCount: number, capacity: number, sortedGaussiansAttribute: StorageBufferAttribute, visibleDispatch: DispatchResources, tileCountsAttribute: StorageBufferAttribute, intersectionOffsetsAttribute: StorageBufferAttribute, projectedMeanAttribute: StorageBufferAttribute, projectedConicAttribute: StorageBufferAttribute, projectedColorAttribute: StorageBufferAttribute, frame: FrameUniforms, outputState?: StorageBufferAttribute);
    private readonly visibleLinearDispatch;
    encode(attempt?: number, resetValid?: boolean): void;
    readStats(): Promise<GaussianPassStats>;
    dispose(): void;
}
