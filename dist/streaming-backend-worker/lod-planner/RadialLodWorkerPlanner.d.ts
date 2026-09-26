import type { GaussianLod } from "../../streaming-backend-impl/GaussianLod";
import type { GaussianLodPackingContext } from "../../streaming-backend-impl/lod-packing/GaussianLodPackingStrategy";
import type { DistanceAwareRadialLodPackingStrategy } from "../../streaming-backend-impl/lod-packing/DistanceAwareRadialLodPackingStrategy";
import type { TieredRadialLodPackingStrategy } from "../../streaming-backend-impl/lod-packing/TieredRadialLodPackingStrategy";
import type { StreamingLodPlannedTarget, StreamingLodTargetPlanner } from "../../streaming-backend-impl/lod-packing/StreamingLodPackingStrategy";
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
