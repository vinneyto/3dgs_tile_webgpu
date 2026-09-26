import type { StorageBufferAttribute } from "three/webgpu";
export interface SlotRange {
    readonly start: number;
    readonly count: number;
}
export declare function mergeSlotRanges(slots: number[], maxGapSlots: number, maxExpansion: number): SlotRange[];
export declare function rangeSlotCount(ranges: readonly SlotRange[]): number;
export declare function markSlotRangesUpdated(attribute: StorageBufferAttribute, ranges: readonly SlotRange[], componentsPerSlot: number): void;
