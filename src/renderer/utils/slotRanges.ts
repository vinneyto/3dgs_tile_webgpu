import type { StorageBufferAttribute } from "three/webgpu";

export interface SlotRange {
  readonly start: number;
  readonly count: number;
}

export function mergeSlotRanges(
  slots: number[],
  maxGapSlots: number,
  maxExpansion: number,
): SlotRange[] {
  if (slots.length === 0) return [];
  slots.sort((left, right) => left - right);
  const exactRanges: SlotRange[] = [];
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
  const merged: SlotRange[] = [];
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

export function rangeSlotCount(ranges: readonly SlotRange[]): number {
  let count = 0;
  for (const range of ranges) count += range.count;
  return count;
}

export function markSlotRangesUpdated(
  attribute: StorageBufferAttribute,
  ranges: readonly SlotRange[],
  componentsPerSlot: number,
): void {
  if (ranges.length === 0) return;
  for (const range of ranges) {
    attribute.addUpdateRange(
      range.start * componentsPerSlot,
      range.count * componentsPerSlot,
    );
  }
  attribute.needsUpdate = true;
}
