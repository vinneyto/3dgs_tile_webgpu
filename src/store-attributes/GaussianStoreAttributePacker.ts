import type { GaussianStoreSlotRange } from "../GaussianStore";
import type { GaussianStorePackedAttribute } from "./GaussianStorePackedAttribute";

export interface PackedLayoutCell {
  readonly lodLevel: number;
  readonly slots: Uint32Array;
}

export interface PackedLayoutContext {
  readonly cells: readonly PackedLayoutCell[];
}

export interface PackedCellUpdateContext {
  readonly previousCell: PackedLayoutCell | undefined;
  readonly cell: PackedLayoutCell;
  readonly retainedCount: number;
}

export interface GaussianStoreAttributeUploadStats {
  readonly writtenSlots: number;
  readonly uploadedSlots: number;
  readonly estimatedUploadBytes: number;
  readonly slotRanges: readonly GaussianStoreSlotRange[];
}

/** Internal strategy responsible for filling one optional packed attribute. */
export interface GaussianStoreAttributePacker {
  readonly attribute: GaussianStorePackedAttribute;

  allocate(capacity: number): void;
  backfill(context: PackedLayoutContext): void;
  updateCell(context: PackedCellUpdateContext): void;
  commit(): GaussianStoreAttributeUploadStats;
}
