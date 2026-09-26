import { StorageBufferAttribute } from "three/webgpu";

import type { GaussianStoreSlotRange } from "../GaussianStore";
import { markSlotRangesUpdated } from "../utils/slotRanges";

export type GaussianStorePackedAttributeFormat = "u32";

/** @internal Store-only lifecycle entry points; intentionally not re-exported. */
export const replaceGaussianStoreAttribute = Symbol(
  "replaceGaussianStoreAttribute",
);
export const updateGaussianStoreAttribute = Symbol(
  "updateGaussianStoreAttribute",
);
export const disposeGaussianStoreAttribute = Symbol(
  "disposeGaussianStoreAttribute",
);

/**
 * One value per packed GaussianStore slot. The wrapper remains stable when a
 * Store rebuild replaces the underlying Three.js storage attribute.
 */
export class GaussianStorePackedAttribute {
  readonly format: GaussianStorePackedAttributeFormat;
  readonly name: string;

  private packedBuffer: StorageBufferAttribute | null = null;
  private disposed = false;

  constructor(name: string, format: GaussianStorePackedAttributeFormat) {
    this.name = name;
    this.format = format;
  }

  /** True after the Store has materialized a packed slot layout. */
  get isAllocated(): boolean {
    return this.packedBuffer !== null;
  }

  get count(): number {
    return this.packedBuffer?.count ?? 0;
  }

  /** Current Three.js storage attribute. A full Store rebuild may replace it. */
  get bufferAttribute(): StorageBufferAttribute {
    this.assertUsable();
    if (this.packedBuffer === null) {
      throw new Error(
        `GaussianStore attribute ${this.name} is not allocated; call store.pack() first`,
      );
    }
    return this.packedBuffer;
  }

  /** Current CPU-side packed values indexed by gaussianIndex. */
  get array(): Uint32Array {
    return this.bufferAttribute.array as Uint32Array;
  }

  [replaceGaussianStoreAttribute](array: Uint32Array): void {
    this.assertUsable();
    const previous = this.packedBuffer;
    const result = new StorageBufferAttribute(array, 1);
    result.name = `3dgs.store.attribute.${this.name}`;
    this.packedBuffer = result;
    previous?.dispose();
  }

  [updateGaussianStoreAttribute](
    ranges: readonly GaussianStoreSlotRange[],
  ): void {
    markSlotRangesUpdated(this.bufferAttribute, ranges, 1);
  }

  [disposeGaussianStoreAttribute](): void {
    if (this.disposed) return;
    this.disposed = true;
    this.packedBuffer?.dispose();
    this.packedBuffer = null;
  }

  private assertUsable(): void {
    if (this.disposed) {
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
    }
  }
}
