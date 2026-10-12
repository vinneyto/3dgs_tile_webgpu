import { IndirectStorageBufferAttribute, StorageBufferAttribute } from "three/webgpu";
import { StorageBindings, type StorageElementType } from "./StorageBindings";
export declare class AttributePool {
    private readonly storageNodes;
    bindings: StorageBindings;
    storage<const T extends StorageElementType>(attribute: StorageBufferAttribute, type: T, count?: number): import("three/webgpu").StorageBufferNode<T>;
    rebind(previous: StorageBufferAttribute, next: StorageBufferAttribute): void;
    grow(attribute: StorageBufferAttribute, count: number, reserve?: boolean): StorageBufferAttribute;
    private readonly attributes;
    createFloat(label: string, count: number, itemSize?: number): StorageBufferAttribute;
    createUint(label: string, count: number, itemSize?: number): StorageBufferAttribute;
    createIndirect(label: string): IndirectStorageBufferAttribute;
    dispose(): void;
    private track;
}
