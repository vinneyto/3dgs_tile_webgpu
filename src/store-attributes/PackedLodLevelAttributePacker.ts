import {
  type GaussianStoreAttributePacker,
  type GaussianStoreAttributeUploadStats,
  mergeSlotRanges,
  type PackedCellUpdateContext,
  type PackedLayoutContext,
  rangeSlotCount,
} from "./GaussianStoreAttributePacker";
import {
  replaceGaussianStoreAttribute,
  updateGaussianStoreAttribute,
  type GaussianStorePackedAttribute,
} from "./GaussianStorePackedAttribute";

/** Fills the built-in current-cell LOD value for every active packed slot. */
export class PackedLodLevelAttributePacker implements GaussianStoreAttributePacker {
  private readonly writtenSlots: number[] = [];
  private freshBuffer = false;

  constructor(readonly attribute: GaussianStorePackedAttribute) {}

  allocate(capacity: number): void {
    this.writtenSlots.length = 0;
    this.attribute[replaceGaussianStoreAttribute](new Uint32Array(capacity));
    this.freshBuffer = true;
  }

  backfill(context: PackedLayoutContext): void {
    const destination = this.attribute.array;
    for (const cell of context.cells) {
      for (const slot of cell.slots) {
        destination[slot] = cell.lodLevel;
        this.writtenSlots.push(slot);
      }
    }
  }

  updateCell(context: PackedCellUpdateContext): void {
    const { previousCell, cell, retainedCount } = context;
    const start = previousCell?.lodLevel === cell.lodLevel ? retainedCount : 0;
    const destination = this.attribute.array;
    for (let local = start; local < cell.slots.length; local++) {
      const slot = cell.slots[local]!;
      destination[slot] = cell.lodLevel;
      this.writtenSlots.push(slot);
    }
  }

  commit(): GaussianStoreAttributeUploadStats {
    const writtenSlots = this.writtenSlots.length;
    const slotRanges = mergeSlotRanges(this.writtenSlots, 16, 0.25);
    const uploadedSlots = rangeSlotCount(slotRanges);
    if (!this.freshBuffer) {
      this.attribute[updateGaussianStoreAttribute](slotRanges);
    }
    this.writtenSlots.length = 0;
    this.freshBuffer = false;
    return {
      writtenSlots,
      uploadedSlots,
      estimatedUploadBytes: uploadedSlots * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges,
    };
  }
}
