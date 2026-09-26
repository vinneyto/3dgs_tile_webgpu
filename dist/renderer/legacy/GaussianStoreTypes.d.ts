import type { GaussianCloud } from "../GaussianCloud";
import type { GaussianData } from "../GaussianData";
import type { GaussianLodBuildOptions } from "../../streaming-backend-impl/GaussianLod";
import type { GaussianOctreeBuildOptions } from "../../streaming-backend-impl/GaussianOctree";
import type { GaussianLodPackingStrategy, StreamingLodPackingOptions, StreamingLodTargetStats } from "../../streaming-backend-impl/lod-packing";
import type { GaussianStoreBudgetStrategy } from "../../streaming-backend-impl/legacy/store-budgeting";
import type { SlotRange } from "../utils/slotRanges";
export interface GaussianDataLoader {
    load(url: string): Promise<GaussianData>;
}
export interface GaussianStoreOptions {
    /** Optional source-format loader used by store.load(). */
    loader?: GaussianDataLoader;
    /** Defaults to RemainingCapacityBudgetStrategy. */
    budgetingStrategy?: GaussianStoreBudgetStrategy;
    /** Used by LOD entries without an individual override. */
    defaultPackingStrategy?: GaussianLodPackingStrategy;
    /** Upload limits for the built-in streaming LOD strategy. */
    defaultStreamingLod?: GaussianStoreDefaultLodOptions;
    /** Maximum packed Gaussian count. Defaults to the rendering device limit. */
    maxGaussians?: number | "auto";
}
export type GaussianStoreDefaultLodOptions = Omit<StreamingLodPackingOptions, "targetPlanner">;
/** The device limits that constrain every packed storage-buffer binding. */
export interface GaussianStorePackLimits {
    readonly maxStorageBufferBindingSize: number;
    readonly maxBufferSize: number;
}
export interface GaussianStorePackOptions {
    /** Pass the limits of the GPUDevice that will render this Store. */
    readonly limits: GaussianStorePackLimits;
}
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
export interface GaussianStoreLodBatchResult {
    readonly applied: boolean;
    readonly pending: boolean;
}
export interface GaussianStoreLodUpdate {
    readonly appliedBatches: number;
    readonly pending: boolean;
    readonly clouds: readonly GaussianStoreCloudLodUpdate[];
    /** Combined GPU slot ranges touched by all clouds in this frame. */
    readonly writtenSlotRanges?: readonly GaussianStoreSlotRange[];
    readonly clearedSlotRanges?: readonly GaussianStoreSlotRange[];
}
export interface GaussianStoreCloudLodUpdate {
    readonly cloud: GaussianCloud;
    readonly focusDistance: number;
    readonly applied: boolean;
    readonly pending: boolean;
    readonly targetStats: StreamingLodTargetStats;
}
export type GaussianStoreSlotRange = SlotRange;
export interface GaussianStoreAddOptions {
    name?: string;
    /** Lower values are packed first. Defaults to 0. */
    priority?: number;
    /** Dispose the source GaussianData after its values have been packed. Defaults to false. */
    ownsData?: boolean;
}
export interface GaussianStoreAddLodOptions {
    name?: string;
    /** Lower values are packed first. Defaults to 0. */
    priority?: number;
    /** Defaults to the GaussianStore defaultPackingStrategy. */
    packingStrategy?: GaussianLodPackingStrategy;
    /** Dispose the supplied GaussianLod when its cloud is removed. Defaults to false. */
    ownsLod?: boolean;
}
export interface GaussianStoreLoadOptions {
    name?: string;
    octree?: Omit<GaussianOctreeBuildOptions, "ownsData">;
    lod?: Omit<GaussianLodBuildOptions, "ownsOctree">;
    priority?: number;
    packingStrategy?: GaussianLodPackingStrategy;
}
