import type { GaussianCloud } from "./GaussianCloud";
import type { SlotRange } from "./utils/slotRanges";
import type { StreamingLodTargetStats } from "../streaming-backend-impl/lod-packing";

export type GaussianStoreSlotRange = SlotRange;
export interface GaussianStorePackStats {
  readonly fullRebuild: boolean;
  readonly slotCapacity: number;
  readonly activeGaussians: number;
  readonly reusedSlots: number;
  readonly writtenSlots: number;
  readonly clearedSlots: number;
  readonly estimatedUploadBytes: number;
  readonly writtenSlotRanges: readonly GaussianStoreSlotRange[];
  readonly clearedSlotRanges: readonly GaussianStoreSlotRange[];
  readonly planningMs: number;
  readonly slotUpdateMs: number;
}
export interface GaussianStoreCloudLodUpdate {
  readonly cloud: GaussianCloud;
  readonly focusDistance: number;
  readonly applied: boolean;
  readonly pending: boolean;
  readonly targetStats: StreamingLodTargetStats;
}
export interface GaussianStoreLodUpdate {
  readonly appliedBatches: number;
  readonly pending: boolean;
  readonly clouds: readonly GaussianStoreCloudLodUpdate[];
  readonly writtenSlotRanges?: readonly GaussianStoreSlotRange[];
  readonly clearedSlotRanges?: readonly GaussianStoreSlotRange[];
}
