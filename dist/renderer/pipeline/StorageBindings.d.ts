import type { StorageBufferAttribute, StorageInstancedBufferAttribute, WebGPURenderer } from "three/webgpu";
/** Stable TSL nodes: a resource replacement updates bindings, never the shader graph. */
export type StorageElementType = "uint" | "uvec2" | "vec4" | "uvec4";
export interface BoundStorage {
    value: StorageBufferAttribute | StorageInstancedBufferAttribute;
    bufferCount: number;
}
export declare class StorageBindings {
    private readonly renderer?;
    private readonly nodes;
    private readonly group;
    constructor(renderer?: WebGPURenderer | undefined);
    replacements: number;
    storage<const T extends StorageElementType>(attribute: StorageBufferAttribute, type: T, count?: number): import("three/webgpu").StorageBufferNode<T>;
    replace(previous: StorageBufferAttribute, next: StorageBufferAttribute): void;
    maximumCount(itemSize: number): number;
    retire(attribute: StorageBufferAttribute): void;
    afterSubmittedWork(dispose: () => void): void;
}
