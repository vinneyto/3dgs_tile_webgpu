import type { Camera, Object3D } from "three/webgpu";
import type { GaussianLod, GaussianLodPacking } from "../GaussianLod";
import { type GaussianLodPackingContext, type GaussianLodPackingStrategy } from "./GaussianLodPackingStrategy";
export interface StreamingLodPackingOptions {
    /** Approximate upload budget applied by each batch. Defaults to 1 MiB. */
    maxUploadBytesPerPack?: number;
    /** Maximum whole leaf transitions applied by each batch. Defaults to 16. */
    maxChangedCellsPerPack?: number;
    /** Optional asynchronous producer for later target packings. */
    targetPlanner?: StreamingLodTargetPlanner;
}
export interface StreamingLodPlannedTarget {
    readonly packing: GaussianLodPacking;
    readonly maxGaussians: number;
    readonly planningMs: number;
    readonly roundTripMs: number;
    release(): void;
}
export interface StreamingLodTargetPlanner {
    readonly pending: boolean;
    readonly hasResult: boolean;
    readonly discardedResults: number;
    initialize(lod: GaussianLod): void;
    request(context: GaussianLodPackingContext): void;
    cancel(): void;
    takeLatest(): StreamingLodPlannedTarget | null;
    dispose(): void;
}
export interface StreamingLodTargetStats {
    readonly planningMs: number;
    readonly roundTripMs: number;
    readonly discardedResults: number;
    readonly pending: boolean;
}
export interface StreamingLodCellTransition {
    readonly nodeId: number;
    readonly lodLevel: number | null;
}
export interface StreamingLodPackingBatch {
    /** A transient view of the strategy's current selection. */
    readonly packing: GaussianLodPacking;
    readonly transitions: readonly StreamingLodCellTransition[];
    readonly pending: boolean;
}
/**
 * Applies a stateful, latest-target-wins transition around another LOD packing
 * strategy. One instance must belong to one GaussianCloud. The initial packing
 * is immediate; later target changes are planned once and split into bounded
 * whole-leaf batches.
 */
export declare class StreamingLodPackingStrategy<T extends GaussianLodPackingStrategy = GaussianLodPackingStrategy> implements GaussianLodPackingStrategy {
    readonly targetStrategy: T;
    readonly targetPlanner: StreamingLodTargetPlanner | null;
    readonly maxUploadBytesPerPack: number;
    readonly maxChangedCellsPerPack: number;
    private lod;
    private appliedNodeIds;
    private appliedLodLevels;
    private appliedIndices;
    private appliedCellCount;
    private appliedGaussianCount;
    private targetAvailable;
    private targetBudget;
    private targetDirty;
    private changes;
    private changeCursor;
    private initialized;
    private latestTargetPlanningMs;
    private latestTargetRoundTripMs;
    constructor(targetStrategy: T, options?: StreamingLodPackingOptions);
    setFromCamera(camera: Camera, localSpace: Object3D): this;
    /** Discard an unfinished target after changing the wrapped strategy. */
    invalidateTarget(): this;
    /** Whether another target plan or bounded batch is needed. */
    get needsPack(): boolean;
    get targetStats(): StreamingLodTargetStats;
    dispose(): void;
    /**
     * Compatibility path used by the Store's initial/global pack. For later
     * camera updates prefer GaussianStore.packLodBatch().
     */
    pack(context: GaussianLodPackingContext): GaussianLodPacking;
    /**
     * Plan the newest target once, then mutate the current dense selection by one
     * bounded batch. A newer invalidation drops all unconsumed old work.
     */
    takeNextBatch(context: GaussianLodPackingContext): StreamingLodPackingBatch | null;
    private bindLod;
    private buildTarget;
    private refreshTarget;
    private initializeApplied;
    private planChanges;
    private applyChange;
    private currentPacking;
}
/** Preserve the default generic instead of narrowing an instanceof to `any`. */
export declare function isStreamingLodPackingStrategy(strategy: GaussianLodPackingStrategy): strategy is StreamingLodPackingStrategy;
