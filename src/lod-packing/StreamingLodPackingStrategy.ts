import type { GaussianLod, GaussianLodPacking } from "../GaussianLod";
import {
  type GaussianLodPackingContext,
  type GaussianLodPackingStrategy,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";

const DEFAULT_MAX_UPLOAD_BYTES = 1024 * 1024;
const DEFAULT_MAX_CHANGED_CELLS = 16;
const RANGE_MERGE_ALLOWANCE = 1.25;

export interface StreamingLodPackingOptions {
  /** Approximate upload budget applied by each pack(). Defaults to 1 MiB. */
  maxUploadBytesPerPack?: number;
  /** Maximum whole leaf transitions applied by each pack(). Defaults to 16. */
  maxChangedCellsPerPack?: number;
}

interface CellChange {
  readonly nodeId: number;
  readonly targetLevel: number | null;
  readonly gaussianDelta: number;
  readonly estimatedUploadBytes: number;
}

/**
 * Applies a stateful, latest-target-wins transition around another LOD packing
 * strategy. One instance must belong to one GaussianCloud. The initial packing
 * is immediate; later target changes are split into bounded whole-leaf batches.
 */
export class StreamingLodPackingStrategy<
  T extends GaussianLodPackingStrategy = GaussianLodPackingStrategy,
> implements GaussianLodPackingStrategy {
  readonly targetStrategy: T;
  readonly maxUploadBytesPerPack: number;
  readonly maxChangedCellsPerPack: number;

  private lod: GaussianLod | null = null;
  private appliedPacking: GaussianLodPacking | null = null;
  private targetPacking: GaussianLodPacking | null = null;
  private targetBudget = -1;
  private targetDirty = true;
  private transitionPending = false;

  constructor(targetStrategy: T, options: StreamingLodPackingOptions = {}) {
    this.targetStrategy = targetStrategy;
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

  /** Discard an unfinished target after changing the wrapped strategy. */
  invalidateTarget(): this {
    this.targetDirty = true;
    this.transitionPending = true;
    return this;
  }

  /** Whether another bounded pack() step is needed. */
  get needsPack(): boolean {
    return this.targetDirty || this.transitionPending;
  }

  pack(context: GaussianLodPackingContext): GaussianLodPacking {
    validateGaussianLodBudget(context.maxGaussians);
    this.bindLod(context.lod);
    if (
      this.targetDirty ||
      this.targetPacking === null ||
      this.targetBudget !== context.maxGaussians
    ) {
      this.targetPacking = this.targetStrategy.pack(context);
      this.targetBudget = context.maxGaussians;
      this.targetDirty = false;
    }

    if (this.appliedPacking === null) {
      this.appliedPacking = this.targetPacking;
      this.transitionPending = false;
      return this.appliedPacking;
    }

    const next = this.applyBatch(
      context.lod,
      context.maxGaussians,
      this.appliedPacking,
      this.targetPacking,
    );
    this.appliedPacking = next;
    this.transitionPending = !samePacking(next, this.targetPacking);
    return next;
  }

  private bindLod(lod: GaussianLod): void {
    if (this.lod === null) {
      this.lod = lod;
      return;
    }
    if (this.lod !== lod) {
      throw new Error(
        "StreamingLodPackingStrategy instances cannot be shared between GaussianLod objects",
      );
    }
  }

  private applyBatch(
    lod: GaussianLod,
    maxGaussians: number,
    applied: GaussianLodPacking,
    target: GaussianLodPacking,
  ): GaussianLodPacking {
    if (samePacking(applied, target)) return applied;
    const appliedLevels = packingLevels(applied);
    const targetLevels = packingLevels(target);
    const changes = orderedChanges(
      lod,
      applied,
      target,
      appliedLevels,
      targetLevels,
    );
    let gaussianCount = applied.gaussianCount;
    let changedCells = 0;
    let uploadBytes = 0;

    for (const change of changes) {
      const exceedsBatch =
        changedCells >= this.maxChangedCellsPerPack ||
        uploadBytes + change.estimatedUploadBytes > this.maxUploadBytesPerPack;
      // Always make progress. A reduced Store allocation is also a hard limit,
      // so cheap removals may exceed the streaming budget until it is restored.
      if (changedCells > 0 && exceedsBatch && gaussianCount <= maxGaussians) {
        break;
      }
      if (change.targetLevel === null) appliedLevels.delete(change.nodeId);
      else appliedLevels.set(change.nodeId, change.targetLevel);
      gaussianCount += change.gaussianDelta;
      uploadBytes += change.estimatedUploadBytes;
      changedCells++;
    }

    return packingFromLevels(lod, appliedLevels, target);
  }
}

function orderedChanges(
  lod: GaussianLod,
  applied: GaussianLodPacking,
  target: GaussianLodPacking,
  appliedLevels: ReadonlyMap<number, number>,
  targetLevels: ReadonlyMap<number, number>,
): CellChange[] {
  const cheap: CellChange[] = [];
  const expensive: CellChange[] = [];
  for (let index = applied.nodeIds.length - 1; index >= 0; index--) {
    const nodeId = applied.nodeIds[index]!;
    const appliedLevel = applied.lodLevels[index]!;
    const targetLevel = targetLevels.get(nodeId);
    if (targetLevel === undefined || targetLevel < appliedLevel) {
      cheap.push(cellChange(lod, nodeId, appliedLevel, targetLevel ?? null));
    }
  }
  for (let index = 0; index < target.nodeIds.length; index++) {
    const nodeId = target.nodeIds[index]!;
    const targetLevel = target.lodLevels[index]!;
    const appliedLevel = appliedLevels.get(nodeId);
    if (appliedLevel === undefined || targetLevel > appliedLevel) {
      expensive.push(
        cellChange(lod, nodeId, appliedLevel ?? null, targetLevel),
      );
    }
  }
  return [...cheap, ...expensive];
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
    3 * 16 + lod.octree.data.shCoefficientCount * 16 + 4;
  return {
    nodeId,
    targetLevel: toLevel,
    gaussianDelta: toCount - fromCount,
    estimatedUploadBytes: Math.ceil(
      (added * fullGaussianBytes + removed * 16 + relabeled * 4) *
        RANGE_MERGE_ALLOWANCE,
    ),
  };
}

function packingLevels(packing: GaussianLodPacking): Map<number, number> {
  return new Map(
    Array.from(packing.nodeIds, (nodeId, index) => [
      nodeId,
      packing.lodLevels[index]!,
    ]),
  );
}

function packingFromLevels(
  lod: GaussianLod,
  levels: ReadonlyMap<number, number>,
  target: GaussianLodPacking,
): GaussianLodPacking {
  const targetOrder = new Map(
    Array.from(target.nodeIds, (nodeId, index) => [nodeId, index]),
  );
  const cells = [...levels].sort(
    ([left], [right]) =>
      (targetOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (targetOrder.get(right) ?? Number.MAX_SAFE_INTEGER) || left - right,
  );
  let gaussianCount = 0;
  for (const [nodeId, level] of cells) {
    gaussianCount += lod.nodes[nodeId]!.levelCounts[level]!;
  }
  return {
    nodeIds: Uint32Array.from(cells.map(([nodeId]) => nodeId)),
    lodLevels: Uint8Array.from(cells.map(([, level]) => level)),
    gaussianCount,
  };
}

function samePacking(
  left: GaussianLodPacking,
  right: GaussianLodPacking,
): boolean {
  if (
    left.gaussianCount !== right.gaussianCount ||
    left.nodeIds.length !== right.nodeIds.length
  ) {
    return false;
  }
  const rightLevels = packingLevels(right);
  for (let index = 0; index < left.nodeIds.length; index++) {
    if (rightLevels.get(left.nodeIds[index]!) !== left.lodLevels[index]) {
      return false;
    }
  }
  return true;
}
