import { StorageBufferAttribute } from "three/webgpu";
import type { GaussianStoreSlotRange } from "../GaussianStore";
export type GaussianStorePackedAttributeFormat = "u32";
/** @internal Store-only lifecycle entry points; intentionally not re-exported. */
export declare const replaceGaussianStoreAttribute: unique symbol;
export declare const updateGaussianStoreAttribute: unique symbol;
export declare const disposeGaussianStoreAttribute: unique symbol;
/**
 * One value per packed GaussianStore slot. The wrapper remains stable when a
 * Store rebuild replaces the underlying Three.js storage attribute.
 */
export declare class GaussianStorePackedAttribute {
    readonly format: GaussianStorePackedAttributeFormat;
    readonly name: string;
    private packedBuffer;
    private disposed;
    constructor(name: string, format: GaussianStorePackedAttributeFormat);
    /** True after the Store has materialized a packed slot layout. */
    get isAllocated(): boolean;
    get count(): number;
    /** Current Three.js storage attribute. A full Store rebuild may replace it. */
    get bufferAttribute(): StorageBufferAttribute;
    /** Current CPU-side packed values indexed by gaussianIndex. */
    get array(): Uint32Array;
    [replaceGaussianStoreAttribute](array: Uint32Array): void;
    [updateGaussianStoreAttribute](ranges: readonly GaussianStoreSlotRange[]): void;
    [disposeGaussianStoreAttribute](): void;
    private assertUsable;
}
