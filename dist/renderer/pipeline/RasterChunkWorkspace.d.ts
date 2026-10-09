import type { IndirectStorageBufferAttribute, StorageBufferAttribute } from "three/webgpu";
/** Large chunk buffers depend on intersection capacity, not viewport size. */
export declare class RasterChunkWorkspace {
    private readonly attributes;
    readonly taskCapacity: number;
    readonly tasks: StorageBufferAttribute;
    readonly dispatch: IndirectStorageBufferAttribute;
    readonly partialData: StorageBufferAttribute;
    readonly partialStride: number;
    constructor(intersectionCapacity: number, chunkSize: number, outputDepth: boolean);
    dispose(): void;
}
