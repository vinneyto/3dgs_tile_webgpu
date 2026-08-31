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

export function mergeSlotRanges(
  slots: number[],
  maxGapSlots: number,
  maxExpansion: number,
): GaussianStoreSlotRange[] {
  if (slots.length === 0) return [];
  slots.sort((left, right) => left - right);
  const exactRanges: GaussianStoreSlotRange[] = [];
  let start = slots[0]!;
  let previous = start;
  let exactSlotCount = 1;
  for (let index = 1; index <= slots.length; index++) {
    const slot = slots[index];
    if (slot === previous) continue;
    if (slot !== undefined) exactSlotCount++;
    if (slot === previous + 1) {
      previous = slot;
      continue;
    }
    exactRanges.push({ start, count: previous - start + 1 });
    if (slot !== undefined) start = previous = slot;
  }
  if (exactRanges.length < 2) return exactRanges;

  const allowedExtraSlots = Math.floor(exactSlotCount * maxExpansion);
  let usedExtraSlots = 0;
  const merged: GaussianStoreSlotRange[] = [];
  let current = { ...exactRanges[0]! };
  for (let index = 1; index < exactRanges.length; index++) {
    const next = exactRanges[index]!;
    const currentEnd = current.start + current.count;
    const gap = next.start - currentEnd;
    if (gap <= maxGapSlots && usedExtraSlots + gap <= allowedExtraSlots) {
      current.count = next.start + next.count - current.start;
      usedExtraSlots += gap;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

export function rangeSlotCount(
  ranges: readonly GaussianStoreSlotRange[],
): number {
  let count = 0;
  for (const range of ranges) count += range.count;
  return count;
}
