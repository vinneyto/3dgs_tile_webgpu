import type { GaussianLod } from "../GaussianLod";
import type { GaussianLodPackingContext } from "./GaussianLodPackingStrategy";
import type { DistanceAwareRadialLodPackingStrategy } from "./DistanceAwareRadialLodPackingStrategy";
import type { TieredRadialLodPackingStrategy } from "./TieredRadialLodPackingStrategy";
import type { StreamingLodPlannedTarget, StreamingLodTargetPlanner } from "./StreamingLodPackingStrategy";
/**
 * Computes distance-aware or fixed-budget radial target packings in one module
 * worker. At most one request is in flight and one replaceable latest request
 * is retained.
 */
export declare class RadialLodWorkerPlanner implements StreamingLodTargetPlanner {
    readonly targetStrategy: DistanceAwareRadialLodPackingStrategy | TieredRadialLodPackingStrategy;
    private worker;
    private readonly boundsCenter;
    private lod;
    private revision;
    private latestRequestedRevision;
    private busy;
    private queuedRequest;
    private activeMaxGaussians;
    private activeStarted;
    private latestResult;
    private latestError;
    private disposed;
    private discarded;
    constructor(targetStrategy: DistanceAwareRadialLodPackingStrategy | TieredRadialLodPackingStrategy);
    get pending(): boolean;
    get hasResult(): boolean;
    get discardedResults(): number;
    initialize(lod: GaussianLod): void;
    private initializeWorker;
    request(context: GaussianLodPackingContext): void;
    cancel(): void;
    takeLatest(): StreamingLodPlannedTarget | null;
    dispose(): void;
    private readonly handleMessage;
    private readonly handleError;
    private dispatch;
    private releaseLatestResult;
    private recycle;
    private assertUsable;
}
