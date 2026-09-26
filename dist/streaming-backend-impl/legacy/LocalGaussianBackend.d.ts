import { Camera } from "three/webgpu";
import type { GaussianBackend } from "../../renderer/legacy/GaussianBackend";
import type { GaussianBackendListener } from "../../renderer/legacy/GaussianBackendEvents";
import { GaussianCloud } from "../../renderer/GaussianCloud";
import { GaussianData } from "../../renderer/GaussianData";
import { GaussianLod } from "../GaussianLod";
import { type GaussianLodPackingStrategy } from "../lod-packing";
import { type GaussianStoreBudgetStrategy } from "./store-budgeting";
import { GaussianStoreAttributes } from "../../renderer/store-attributes/GaussianStoreAttributes";
import type { GaussianStorePackedAttribute } from "../../renderer/store-attributes";
import type { GaussianStoreOptions, GaussianStorePackOptions, GaussianStorePackStats, GaussianStoreLodBatchResult, GaussianStoreLodUpdate, GaussianStoreAddOptions, GaussianStoreAddLodOptions, GaussianStoreLoadOptions } from "../../renderer/legacy/GaussianStoreTypes";
export type { GaussianDataLoader, GaussianStoreOptions, GaussianStoreDefaultLodOptions, GaussianStorePackLimits, GaussianStorePackOptions, GaussianStorePackStats, GaussianStoreLodBatchResult, GaussianStoreLodUpdate, GaussianStoreCloudLodUpdate, GaussianStoreSlotRange, GaussianStoreAddOptions, GaussianStoreAddLodOptions, GaussianStoreLoadOptions, } from "../../renderer/legacy/GaussianStoreTypes";
/**
 * Owns one packed set of Gaussian attributes shared by every GaussianCloud.
 * Registration and packing are separate: add/load invalidate the layout, while
 * pack() resolves every cloud against the limits of the rendering GPUDevice.
 */
export declare class LocalGaussianBackend implements GaussianBackend {
    private readonly changeListeners;
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
    private packedContentVersion;
    constructor(options?: GaussianStoreOptions);
    subscribe(listener: GaussianBackendListener): () => void;
    loadBuffer(buffer: ArrayBuffer, options?: GaussianStoreLoadOptions): Promise<GaussianCloud>;
    getSourceCount(cloud: GaussianCloud): number;
    getBounds(cloud: GaussianCloud): readonly [number, number, number, number, number, number];
    get maxGaussians(): number;
    /** True after registration changes and until pack() succeeds. */
    get needsPack(): boolean;
    get hasPackedData(): boolean;
    get lastPackStats(): GaussianStorePackStats | null;
    /** Changes after a successful full or incremental packed-data update. */
    get contentVersion(): number;
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
