import { Camera } from "three/webgpu";
import { GaussianCloud } from "./GaussianCloud";
import { GaussianData } from "./GaussianData";
import { GaussianLod, type GaussianLodBuildOptions } from "./GaussianLod";
import { type GaussianLodPackingStrategy, type StreamingLodPackingOptions, type StreamingLodTargetStats } from "./lod-packing";
import { type GaussianStoreBudgetStrategy } from "./store-budgeting";
import { type GaussianOctreeBuildOptions } from "./GaussianOctree";
import { GaussianStoreAttributes } from "./store-attributes/GaussianStoreAttributes";
import type { GaussianStorePackedAttribute } from "./store-attributes";
import { type SlotRange } from "./utils/slotRanges";
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
/**
 * Owns one packed set of Gaussian attributes shared by every GaussianCloud.
 * Registration and packing are separate: add/load invalidate the layout, while
 * pack() resolves every cloud against the limits of the rendering GPUDevice.
 */
export declare class GaussianStore {
    private readonly loader;
    readonly budgetingStrategy: GaussianStoreBudgetStrategy;
    readonly defaultPackingStrategy: GaussianLodPackingStrategy | null;
    private readonly defaultStreamingLod;
    readonly maxGaussiansOption: number | "auto";
    readonly packedShFormat: "rgb8e8";
    /** Optional attributes indexed by the same gaussianIndex as the packed data. */
    readonly attributes: GaussianStoreAttributes;
    private readonly attributePackers;
    private readonly entries;
    private readonly cloudList;
    private packedData;
    private nextObjectId;
    private packedObjectCapacity;
    private gaussianCapacity;
    private cellSlotsByEntry;
    private freeSlots;
    private readonly scratchWrittenSlots;
    private readonly scratchReleasedSlots;
    private readonly scratchClearedSlots;
    private slotMarks;
    private slotMarkGeneration;
    private packingInvalid;
    private latestPackStats;
    private disposed;
    /** Changes only after a successful pack() replaces the shared layout. */
    layoutVersion: number;
    constructor(options?: GaussianStoreOptions);
    get maxGaussians(): number;
    /** True after registration changes and until pack() succeeds. */
    get needsPack(): boolean;
    get lastPackStats(): GaussianStorePackStats | null;
    get count(): number;
    get shDegree(): 0 | 1 | 2 | 3;
    /** Number of stable object slots required by camera-specific pass state. */
    get objectCapacity(): number;
    get clouds(): readonly GaussianCloud[];
    /**
     * Lazily enables one u32 per packed slot containing its selected cell LOD.
     * Repeated calls return the same stable wrapper.
     */
    enablePackedLodLevelAttribute(): GaussianStorePackedAttribute;
    load(url: string, options?: GaussianStoreLoadOptions): Promise<GaussianCloud>;
    add(data: GaussianData, options?: GaussianStoreAddOptions): GaussianCloud;
    addLod(lod: GaussianLod, options?: GaussianStoreAddLodOptions): GaussianCloud;
    remove(cloud: GaussianCloud): void;
    /** Resolve all registered clouds and materialize one packed buffer set. */
    pack({ limits }: GaussianStorePackOptions): void;
    /**
     * Apply one bounded batch from a StreamingLodPackingStrategy without global
     * budget planning or scanning unchanged clouds/cells.
     */
    packLodBatch(cloud: GaussianCloud): GaussianStoreLodBatchResult;
    private planPackings;
    /** Called by GaussianCloud when its priority changes. */
    updatePackingPriority(cloud: GaussianCloud, priority: number): void;
    /** Mark one cloud for strategy re-evaluation after its strategy parameters change. */
    invalidateCloudPacking(cloud: GaussianCloud): void;
    /**
     * Update camera-relative streaming LODs and apply at most one
     * bounded upload batch per cloud. GaussianPass calls this automatically.
     */
    updateLod(camera: Camera): GaussianStoreLodUpdate;
    /** Current packed attributes. pack() must have resolved all invalidations. */
    getPackedData(): GaussianData;
    dispose(): void;
    private buildPackedData;
    private updatePackedData;
    private plannedCells;
    private collectPackedLayoutCells;
    private commitAttributePackers;
    private cellSourceIndex;
    private copySourceToSlot;
    private invalidatePacking;
    private allocateObjectId;
    private nextSlotMarkGeneration;
    private assertUsable;
}
