import { Vector3 } from "three/webgpu";

import type { GaussianLod, GaussianLodPacking } from "../GaussianLod";
import type { GaussianLodPackingContext } from "./GaussianLodPackingStrategy";
import type { DistanceAwareRadialLodPackingStrategy } from "./DistanceAwareRadialLodPackingStrategy";
import type { TieredRadialLodPackingStrategy } from "./TieredRadialLodPackingStrategy";
import { createRadialLodPlanData } from "./RadialLodPlan";
import type {
  RadialLodWorkerBufferSet,
  RadialLodWorkerInitMessage,
  RadialLodWorkerRequestMessage,
  RadialLodWorkerResultMessage,
} from "./RadialLodWorkerProtocol";
import type {
  StreamingLodPlannedTarget,
  StreamingLodTargetPlanner,
} from "./StreamingLodPackingStrategy";

const OUTPUT_POOL_SIZE = 2;

interface QueuedRequest {
  readonly message: RadialLodWorkerRequestMessage;
  readonly maxGaussians: number;
}

interface LatestResult {
  readonly message: RadialLodWorkerResultMessage;
  readonly maxGaussians: number;
  readonly roundTripMs: number;
}

/**
 * Computes distance-aware or fixed-budget radial target packings in one module
 * worker. At most one request is in flight and one replaceable latest request
 * is retained.
 */
export class RadialLodWorkerPlanner implements StreamingLodTargetPlanner {
  private readonly worker: Worker;
  private readonly boundsCenter = new Vector3();
  private lod: GaussianLod | null = null;
  private revision = 0;
  private latestRequestedRevision = 0;
  private busy = false;
  private queuedRequest: QueuedRequest | null = null;
  private activeMaxGaussians = 0;
  private activeStarted = 0;
  private latestResult: LatestResult | null = null;
  private latestError: Error | null = null;
  private disposed = false;
  private discarded = 0;

  constructor(
    readonly targetStrategy:
      DistanceAwareRadialLodPackingStrategy | TieredRadialLodPackingStrategy,
  ) {
    this.worker = new Worker(new URL("./RadialLodWorker.ts", import.meta.url), {
      type: "module",
      name: "3dgs-radial-lod",
    });
    this.worker.addEventListener("message", this.handleMessage);
    this.worker.addEventListener("error", this.handleError);
  }

  get pending(): boolean {
    return this.busy || this.queuedRequest !== null;
  }

  get hasResult(): boolean {
    return this.latestResult !== null || this.latestError !== null;
  }

  get discardedResults(): number {
    return this.discarded;
  }

  initialize(lod: GaussianLod): void {
    this.assertUsable();
    if (this.lod === lod) return;
    if (this.lod !== null) {
      throw new Error(
        "RadialLodWorkerPlanner instances cannot be shared between GaussianLod objects",
      );
    }
    this.lod = lod;
    const data = createRadialLodPlanData(lod);
    const buffers = Array.from({ length: OUTPUT_POOL_SIZE }, () =>
      createOutputBufferSet(data.leafNodeIds.length),
    );
    const message: RadialLodWorkerInitMessage = {
      type: "init",
      data,
      buffers,
    };
    this.worker.postMessage(message, [
      data.leafNodeIds.buffer,
      data.leafCenters.buffer,
      data.levelCounts.buffer,
      ...buffers.flatMap(({ nodeIds, lodLevels }) => [nodeIds, lodLevels]),
    ]);
  }

  request(context: GaussianLodPackingContext): void {
    this.assertUsable();
    this.initialize(context.lod);
    this.releaseLatestResult();
    const focus =
      this.targetStrategy.center instanceof Vector3
        ? this.targetStrategy.center
        : context.lod.octree.bounds.getCenter(this.boundsCenter);
    const revision = ++this.revision;
    this.latestRequestedRevision = revision;
    const baseRequest = {
      type: "request" as const,
      revision,
      centerX: focus.x,
      centerY: focus.y,
      centerZ: focus.z,
      maxGaussians: context.maxGaussians,
    };
    const message: RadialLodWorkerRequestMessage =
      "budgetShares" in this.targetStrategy
        ? {
            ...baseRequest,
            strategy: "tiered",
            budgetShares: this.targetStrategy.budgetShares,
          }
        : {
            ...baseRequest,
            strategy: "distance",
            levelDistance: this.targetStrategy.levelDistance,
          };
    const request: QueuedRequest = {
      message,
      maxGaussians: context.maxGaussians,
    };
    if (this.busy) {
      if (this.queuedRequest !== null) this.discarded++;
      this.queuedRequest = request;
      return;
    }
    this.dispatch(request);
  }

  cancel(): void {
    this.assertUsable();
    this.latestRequestedRevision = ++this.revision;
    this.releaseLatestResult();
    if (this.queuedRequest !== null) {
      this.queuedRequest = null;
      this.discarded++;
    }
  }

  takeLatest(): StreamingLodPlannedTarget | null {
    this.assertUsable();
    if (this.latestError !== null) {
      const error = this.latestError;
      this.latestError = null;
      throw error;
    }
    const result = this.latestResult;
    if (result === null) return null;
    this.latestResult = null;
    const { message } = result;
    let released = false;
    return {
      packing: packingFromResult(message),
      maxGaussians: result.maxGaussians,
      planningMs: message.planningMs,
      roundTripMs: result.roundTripMs,
      release: () => {
        if (released) return;
        released = true;
        this.recycle(message.buffer);
      },
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.latestResult = null;
    this.queuedRequest = null;
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.removeEventListener("error", this.handleError);
    this.worker.terminate();
  }

  private readonly handleMessage = (
    event: MessageEvent<RadialLodWorkerResultMessage>,
  ): void => {
    if (this.disposed) return;
    const message = event.data;
    const roundTripMs = performance.now() - this.activeStarted;
    const maxGaussians = this.activeMaxGaussians;
    this.busy = false;
    if (message.revision === this.latestRequestedRevision) {
      this.releaseLatestResult();
      this.latestResult = { message, maxGaussians, roundTripMs };
    } else {
      this.discarded++;
      this.recycle(message.buffer);
    }
    const queued = this.queuedRequest;
    this.queuedRequest = null;
    if (queued !== null) this.dispatch(queued);
  };

  private readonly handleError = (event: ErrorEvent): void => {
    if (this.disposed) return;
    this.busy = false;
    this.queuedRequest = null;
    this.latestError = new Error(event.message || "Radial LOD worker failed");
  };

  private dispatch(request: QueuedRequest): void {
    this.busy = true;
    this.activeMaxGaussians = request.maxGaussians;
    this.activeStarted = performance.now();
    this.worker.postMessage(request.message);
  }

  private releaseLatestResult(): void {
    const result = this.latestResult;
    if (result === null) return;
    this.latestResult = null;
    this.discarded++;
    this.recycle(result.message.buffer);
  }

  private recycle(buffer: RadialLodWorkerBufferSet): void {
    if (this.disposed) return;
    this.worker.postMessage({ type: "recycle", buffer }, [
      buffer.nodeIds,
      buffer.lodLevels,
    ]);
  }

  private assertUsable(): void {
    if (this.disposed) {
      throw new Error("RadialLodWorkerPlanner has been disposed");
    }
  }
}

function createOutputBufferSet(leafCount: number): RadialLodWorkerBufferSet {
  return {
    nodeIds: new ArrayBuffer(leafCount * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(leafCount * Uint8Array.BYTES_PER_ELEMENT),
  };
}

function packingFromResult(
  result: RadialLodWorkerResultMessage,
): GaussianLodPacking {
  return {
    nodeIds: new Uint32Array(result.buffer.nodeIds, 0, result.length),
    lodLevels: new Uint8Array(result.buffer.lodLevels, 0, result.length),
    gaussianCount: result.gaussianCount,
  };
}
