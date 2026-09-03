import type { Vector3 } from "three/webgpu";

import type { GaussianLod, GaussianLodPacking } from "../GaussianLod";
import { RGB8E8_SH_BYTES_PER_COEFFICIENT } from "../GaussianSh";
import {
  type CameraDrivenGaussianLodPackingStrategy,
  type GaussianLodPackingContext,
  type GaussianLodPackingStrategy,
  isCameraDrivenGaussianLodPackingStrategy,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";

const DEFAULT_MAX_UPLOAD_BYTES = 1024 * 1024;
const DEFAULT_MAX_CHANGED_CELLS = 16;
const RANGE_MERGE_ALLOWANCE = 1.25;

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

interface CellChange extends StreamingLodCellTransition {
  readonly gaussianDelta: number;
  readonly estimatedUploadBytes: number;
}

/**
 * Applies a stateful, latest-target-wins transition around another LOD packing
 * strategy. One instance must belong to one GaussianCloud. The initial packing
 * is immediate; later target changes are planned once and split into bounded
 * whole-leaf batches.
 */
export class StreamingLodPackingStrategy<
  T extends GaussianLodPackingStrategy = GaussianLodPackingStrategy,
> implements GaussianLodPackingStrategy {
  readonly targetStrategy: T;
  readonly targetPlanner: StreamingLodTargetPlanner | null;
  readonly maxUploadBytesPerPack: number;
  readonly maxChangedCellsPerPack: number;

  private readonly cameraTarget: CameraDrivenGaussianLodPackingStrategy | null;
  private lod: GaussianLod | null = null;
  private appliedNodeIds = new Uint32Array();
  private appliedLodLevels = new Uint8Array();
  private appliedIndices = new Int32Array();
  private appliedCellCount = 0;
  private appliedGaussianCount = 0;
  private targetAvailable = false;
  private targetBudget = -1;
  private targetDirty = true;
  private changes: CellChange[] = [];
  private changeCursor = 0;
  private initialized = false;
  private latestTargetPlanningMs = 0;
  private latestTargetRoundTripMs = 0;

  constructor(targetStrategy: T, options: StreamingLodPackingOptions = {}) {
    this.targetStrategy = targetStrategy;
    this.cameraTarget = isCameraDrivenGaussianLodPackingStrategy(targetStrategy)
      ? targetStrategy
      : null;
    this.targetPlanner = options.targetPlanner ?? null;
    this.maxUploadBytesPerPack =
      options.maxUploadBytesPerPack ?? DEFAULT_MAX_UPLOAD_BYTES;
    this.maxChangedCellsPerPack =
      options.maxChangedCellsPerPack ?? DEFAULT_MAX_CHANGED_CELLS;
    if (
      !(this.maxUploadBytesPerPack > 0) ||
      !Number.isFinite(this.maxUploadBytesPerPack)
    ) {
      throw new RangeError(
        "Streaming LOD maxUploadBytesPerPack must be finite and positive",
      );
    }
    if (
      !Number.isInteger(this.maxChangedCellsPerPack) ||
      this.maxChangedCellsPerPack <= 0
    ) {
      throw new RangeError(
        "Streaming LOD maxChangedCellsPerPack must be a positive integer",
      );
    }
  }

  /** Whether this wrapper's target explicitly follows the render camera. */
  get tracksCamera(): boolean {
    return this.cameraTarget !== null;
  }

  /** Update a camera-driven target and invalidate its pending packing. */
  setCenter(center: Vector3): boolean {
    if (this.cameraTarget === null) return false;
    this.cameraTarget.setCenter(center);
    this.invalidateTarget();
    return true;
  }

  /** Discard an unfinished target after changing the wrapped strategy. */
  invalidateTarget(): this {
    this.targetDirty = true;
    if (this.targetPlanner !== null) {
      this.changes = [];
      this.changeCursor = 0;
    }
    return this;
  }

  /** Whether another target plan or bounded batch is needed. */
  get needsPack(): boolean {
    return (
      this.targetDirty ||
      this.targetPlanner?.pending === true ||
      this.targetPlanner?.hasResult === true ||
      this.changeCursor < this.changes.length
    );
  }

  get targetStats(): StreamingLodTargetStats {
    return {
      planningMs: this.latestTargetPlanningMs,
      roundTripMs: this.latestTargetRoundTripMs,
      discardedResults: this.targetPlanner?.discardedResults ?? 0,
      pending: this.targetPlanner?.pending ?? false,
    };
  }

  dispose(): void {
    this.targetPlanner?.dispose();
  }

  /**
   * Compatibility path used by the Store's initial/global pack. For later
   * camera updates prefer GaussianStore.packLodBatch().
   */
  pack(context: GaussianLodPackingContext): GaussianLodPacking {
    validateGaussianLodBudget(context.maxGaussians);
    this.bindLod(context.lod);
    if (!this.initialized) {
      const target = this.buildTarget(context);
      this.initializeApplied(target);
      this.initialized = true;
      this.changes = [];
      this.changeCursor = 0;
      return target;
    }
    if (
      this.targetPlanner !== null &&
      (this.targetDirty ||
        !this.targetAvailable ||
        this.targetBudget !== context.maxGaussians)
    ) {
      this.targetPlanner.cancel();
      const target = this.buildTarget(context);
      this.changes = this.planChanges(context.lod, target);
      this.changeCursor = 0;
    }
    return this.takeNextBatch(context)?.packing ?? this.currentPacking();
  }

  /**
   * Plan the newest target once, then mutate the current dense selection by one
   * bounded batch. A newer invalidation drops all unconsumed old work.
   */
  takeNextBatch(
    context: GaussianLodPackingContext,
  ): StreamingLodPackingBatch | null {
    validateGaussianLodBudget(context.maxGaussians);
    this.bindLod(context.lod);
    if (!this.initialized) {
      throw new Error(
        "StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches",
      );
    }
    this.refreshTarget(context);
    if (this.changeCursor >= this.changes.length) return null;

    const transitions: StreamingLodCellTransition[] = [];
    let uploadBytes = 0;
    while (this.changeCursor < this.changes.length) {
      const change = this.changes[this.changeCursor]!;
      const exceedsBatch =
        transitions.length >= this.maxChangedCellsPerPack ||
        uploadBytes + change.estimatedUploadBytes > this.maxUploadBytesPerPack;
      // Always make progress. Removals may also exceed the batch budget while
      // restoring a newly reduced Store allocation.
      if (
        transitions.length > 0 &&
        exceedsBatch &&
        this.appliedGaussianCount <= context.maxGaussians
      ) {
        break;
      }
      this.applyChange(change);
      transitions.push({ nodeId: change.nodeId, lodLevel: change.lodLevel });
      uploadBytes += change.estimatedUploadBytes;
      this.changeCursor++;
    }

    return {
      packing: this.currentPacking(),
      transitions,
      pending: this.changeCursor < this.changes.length,
    };
  }

  private bindLod(lod: GaussianLod): void {
    if (this.lod === null) {
      this.lod = lod;
      this.appliedNodeIds = new Uint32Array(lod.nodes.length);
      this.appliedLodLevels = new Uint8Array(lod.nodes.length);
      this.appliedIndices = new Int32Array(lod.nodes.length);
      this.appliedIndices.fill(-1);
      this.targetPlanner?.initialize(lod);
      return;
    }
    if (this.lod !== lod) {
      throw new Error(
        "StreamingLodPackingStrategy instances cannot be shared between GaussianLod objects",
      );
    }
  }

  private buildTarget(context: GaussianLodPackingContext): GaussianLodPacking {
    const target = this.targetStrategy.pack(context);
    validatePacking(context.lod, target, context.maxGaussians);
    this.targetAvailable = true;
    this.targetBudget = context.maxGaussians;
    this.targetDirty = false;
    return target;
  }

  private refreshTarget(context: GaussianLodPackingContext): void {
    if (this.targetPlanner === null) {
      if (
        this.targetDirty ||
        !this.targetAvailable ||
        this.targetBudget !== context.maxGaussians
      ) {
        const target = this.buildTarget(context);
        this.changes = this.planChanges(context.lod, target);
        this.changeCursor = 0;
      }
      return;
    }

    if (this.targetDirty || this.targetBudget !== context.maxGaussians) {
      this.targetPlanner.request(context);
      this.targetBudget = context.maxGaussians;
      this.targetDirty = false;
      this.targetAvailable = false;
      this.changes = [];
      this.changeCursor = 0;
    }
    const result = this.targetPlanner.takeLatest();
    if (result === null) return;
    try {
      validatePacking(context.lod, result.packing, result.maxGaussians);
      this.targetAvailable = true;
      this.targetBudget = result.maxGaussians;
      this.changes = this.planChanges(context.lod, result.packing);
      this.changeCursor = 0;
      this.latestTargetPlanningMs = result.planningMs;
      this.latestTargetRoundTripMs = result.roundTripMs;
    } finally {
      result.release();
    }
  }

  private initializeApplied(packing: GaussianLodPacking): void {
    this.appliedCellCount = packing.nodeIds.length;
    this.appliedGaussianCount = packing.gaussianCount;
    this.appliedNodeIds.set(packing.nodeIds);
    this.appliedLodLevels.set(packing.lodLevels);
    for (let index = 0; index < packing.nodeIds.length; index++) {
      this.appliedIndices[packing.nodeIds[index]!] = index;
    }
  }

  private planChanges(
    lod: GaussianLod,
    target: GaussianLodPacking,
  ): CellChange[] {
    const targetLevels = new Int16Array(lod.nodes.length);
    targetLevels.fill(-1);
    for (let index = 0; index < target.nodeIds.length; index++) {
      targetLevels[target.nodeIds[index]!] = target.lodLevels[index]!;
    }

    const cheap: CellChange[] = [];
    const expensive: CellChange[] = [];
    for (let index = this.appliedCellCount - 1; index >= 0; index--) {
      const nodeId = this.appliedNodeIds[index]!;
      const appliedLevel = this.appliedLodLevels[index]!;
      const targetLevel = targetLevels[nodeId]!;
      if (targetLevel < 0 || targetLevel < appliedLevel) {
        cheap.push(
          cellChange(
            lod,
            nodeId,
            appliedLevel,
            targetLevel < 0 ? null : targetLevel,
          ),
        );
      }
    }
    for (let index = 0; index < target.nodeIds.length; index++) {
      const nodeId = target.nodeIds[index]!;
      const targetLevel = target.lodLevels[index]!;
      const appliedIndex = this.appliedIndices[nodeId]!;
      const appliedLevel =
        appliedIndex < 0 ? null : this.appliedLodLevels[appliedIndex]!;
      if (appliedLevel === null || targetLevel > appliedLevel) {
        expensive.push(cellChange(lod, nodeId, appliedLevel, targetLevel));
      }
    }
    return [...cheap, ...expensive];
  }

  private applyChange(change: CellChange): void {
    const index = this.appliedIndices[change.nodeId]!;
    if (change.lodLevel === null) {
      if (index < 0) return;
      const lastIndex = --this.appliedCellCount;
      if (index !== lastIndex) {
        const movedNodeId = this.appliedNodeIds[lastIndex]!;
        this.appliedNodeIds[index] = movedNodeId;
        this.appliedLodLevels[index] = this.appliedLodLevels[lastIndex]!;
        this.appliedIndices[movedNodeId] = index;
      }
      this.appliedIndices[change.nodeId] = -1;
    } else if (index < 0) {
      const nextIndex = this.appliedCellCount++;
      this.appliedNodeIds[nextIndex] = change.nodeId;
      this.appliedLodLevels[nextIndex] = change.lodLevel;
      this.appliedIndices[change.nodeId] = nextIndex;
    } else {
      this.appliedLodLevels[index] = change.lodLevel;
    }
    this.appliedGaussianCount += change.gaussianDelta;
  }

  private currentPacking(): GaussianLodPacking {
    return {
      nodeIds: this.appliedNodeIds.subarray(0, this.appliedCellCount),
      lodLevels: this.appliedLodLevels.subarray(0, this.appliedCellCount),
      gaussianCount: this.appliedGaussianCount,
    };
  }
}

/** Preserve the default generic instead of narrowing an instanceof to `any`. */
export function isStreamingLodPackingStrategy(
  strategy: GaussianLodPackingStrategy,
): strategy is StreamingLodPackingStrategy {
  return strategy instanceof StreamingLodPackingStrategy;
}

function cellChange(
  lod: GaussianLod,
  nodeId: number,
  fromLevel: number | null,
  toLevel: number | null,
): CellChange {
  const node = lod.nodes[nodeId]!;
  const fromCount = fromLevel === null ? 0 : node.levelCounts[fromLevel]!;
  const toCount = toLevel === null ? 0 : node.levelCounts[toLevel]!;
  const added = Math.max(0, toCount - fromCount);
  const removed = Math.max(0, fromCount - toCount);
  const relabeled =
    fromLevel !== null && toLevel !== null && fromLevel !== toLevel
      ? Math.min(fromCount, toCount)
      : 0;
  const fullGaussianBytes =
    3 * 16 +
    lod.octree.data.shCoefficientCount * RGB8E8_SH_BYTES_PER_COEFFICIENT +
    4;
  return {
    nodeId,
    lodLevel: toLevel,
    gaussianDelta: toCount - fromCount,
    estimatedUploadBytes: Math.ceil(
      (added * fullGaussianBytes + removed * 16 + relabeled * 4) *
        RANGE_MERGE_ALLOWANCE,
    ),
  };
}

function validatePacking(
  lod: GaussianLod,
  packing: GaussianLodPacking,
  maxGaussians: number,
): void {
  if (packing.gaussianCount > maxGaussians) {
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${maxGaussians} Gaussians`,
    );
  }
  if (packing.nodeIds.length !== packing.lodLevels.length) {
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  }
  const selected = new Set<number>();
  let gaussianCount = 0;
  for (let index = 0; index < packing.nodeIds.length; index++) {
    const nodeId = packing.nodeIds[index]!;
    const level = packing.lodLevels[index]!;
    const node = lod.nodes[nodeId];
    const count = node?.levelCounts[level];
    if (count === undefined || lod.octree.nodes[nodeId]?.isLeaf !== true) {
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${nodeId} or level ${level}`,
      );
    }
    if (selected.has(nodeId)) {
      throw new Error(`GaussianLod packing contains duplicate node ${nodeId}`);
    }
    selected.add(nodeId);
    gaussianCount += count;
  }
  if (gaussianCount !== packing.gaussianCount) {
    throw new RangeError(
      `GaussianLodPacking declares ${packing.gaussianCount} Gaussians but selects ${gaussianCount}`,
    );
  }
}
