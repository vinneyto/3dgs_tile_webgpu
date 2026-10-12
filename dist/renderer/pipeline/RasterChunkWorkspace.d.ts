import { StorageBindings } from "./StorageBindings";
import type { IndirectStorageBufferAttribute, StorageBufferAttribute } from "three/webgpu";
/** Large chunk buffers depend on intersection capacity, not viewport size. */
export declare class RasterChunkWorkspace {
    private readonly chunkSize;
    private readonly attributes;
    taskCapacity: number;
    tasks: StorageBufferAttribute;
    readonly dispatch: IndirectStorageBufferAttribute;
    partialData: StorageBufferAttribute;
    readonly taskCapacityNode: import("three/webgpu").UniformNode<"uint", number>;
    readonly partialStride: number;
    constructor(intersectionCapacity: number, chunkSize: number, outputDepth: boolean, bindings?: StorageBindings);
    resize(capacity: number): void;
    dispose(): void;
}
