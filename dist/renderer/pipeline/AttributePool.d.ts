import { IndirectStorageBufferAttribute, StorageBufferAttribute } from "three/webgpu";
export declare class AttributePool {
    private readonly attributes;
    createFloat(label: string, count: number, itemSize?: number): StorageBufferAttribute;
    createUint(label: string, count: number, itemSize?: number): StorageBufferAttribute;
    createIndirect(label: string): IndirectStorageBufferAttribute;
    dispose(): void;
    private track;
}
