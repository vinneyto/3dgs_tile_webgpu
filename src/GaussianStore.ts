import { StorageBufferAttribute } from "three/webgpu";

import { CanonicalGaussianPlyLoader } from "./CanonicalGaussianPlyLoader";
import { GaussianCloud } from "./GaussianCloud";
import { GaussianData } from "./GaussianData";
import {
  GaussianLod,
  type GaussianLodBuildOptions,
  type GaussianLodPacking,
} from "./GaussianLod";
import {
  RadialLodPackingStrategy,
  type GaussianLodPackingStrategy,
} from "./lod-packing";
import {
  RemainingCapacityBudgetStrategy,
  type GaussianStoreBudgetStrategy,
} from "./store-budgeting";
import {
  GaussianOctree,
  type GaussianOctreeBuildOptions,
} from "./GaussianOctree";

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
}

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

export interface GaussianStoreSlotRange {
  readonly start: number;
  readonly count: number;
}

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

interface StoreEntry {
  readonly cloud: GaussianCloud;
  count: number;
  readonly sourceGaussianCount: number;
  readonly sourceDegree: 0 | 1 | 2 | 3;
  priority: number;
  readonly packingStrategy: GaussianLodPackingStrategy | null;
  source: GaussianData | null;
  ownsSource: boolean;
  lod: GaussianLod | null;
  ownsLod: boolean;
  packing: GaussianLodPacking | null;
}

interface PlannedEntry {
  readonly entry: StoreEntry;
  readonly count: number;
  readonly packing: GaussianLodPacking | null;
}

interface PlannedCell {
  readonly nodeId: number;
  readonly lodLevel: number;
  readonly count: number;
}

const MAX_EXACT_FLOAT_INTEGER = 16_777_216;

/**
 * Owns one packed set of Gaussian attributes shared by every GaussianCloud.
 * Registration and packing are separate: add/load invalidate the layout, while
 * pack() resolves every cloud against the limits of the rendering GPUDevice.
 */
export class GaussianStore {
  private readonly loader: GaussianDataLoader;
  readonly budgetingStrategy: GaussianStoreBudgetStrategy;
  readonly defaultPackingStrategy: GaussianLodPackingStrategy;
  private readonly entries: StoreEntry[] = [];
  private readonly cloudList: GaussianCloud[] = [];
  private packedData: GaussianData | null = null;
  private nextObjectId = 0;
  private packedObjectCapacity = 0;
  private gaussianCapacity = 0;
  private cellSlotsByEntry = new Map<StoreEntry, Map<number, Uint32Array>>();
  private freeSlots: number[] = [];
  private packingInvalid = false;
  private latestPackStats: GaussianStorePackStats | null = null;
  private disposed = false;

  /** Changes only after a successful pack() replaces the shared layout. */
  layoutVersion = 0;

  constructor(options: GaussianStoreOptions = {}) {
    this.loader = options.loader ?? new CanonicalGaussianPlyLoader();
    this.budgetingStrategy =
      options.budgetingStrategy ?? new RemainingCapacityBudgetStrategy();
    this.defaultPackingStrategy =
      options.defaultPackingStrategy ?? new RadialLodPackingStrategy();
  }

  get maxGaussians(): number {
    return this.gaussianCapacity;
  }

  /** True after registration changes and until pack() succeeds. */
  get needsPack(): boolean {
    return this.packingInvalid;
  }

  get lastPackStats(): GaussianStorePackStats | null {
    return this.latestPackStats;
  }

  get count(): number {
    return this.entries.reduce((sum, entry) => sum + entry.count, 0);
  }

  get shDegree(): 0 | 1 | 2 | 3 {
    let result: 0 | 1 | 2 | 3 = 0;
    for (const entry of this.entries) {
      if (entry.sourceDegree > result) result = entry.sourceDegree;
    }
    return result;
  }

  /** Number of stable object slots required by camera-specific pass state. */
  get objectCapacity(): number {
    return this.nextObjectId;
  }

  get clouds(): readonly GaussianCloud[] {
    return this.cloudList;
  }

  async load(
    url: string,
    options: GaussianStoreLoadOptions = {},
  ): Promise<GaussianCloud> {
    this.assertUsable();
    const data = await this.loader.load(url);
    let octree: GaussianOctree | null = null;
    let lod: GaussianLod | null = null;
    try {
      octree = GaussianOctree.build(data, {
        ...options.octree,
        ownsData: true,
      });
      lod = GaussianLod.build(octree, {
        ...options.lod,
        ownsOctree: true,
      });
      return this.addLod(lod, {
        name: options.name ?? sourceName(url),
        priority: options.priority,
        packingStrategy: options.packingStrategy,
        ownsLod: true,
      });
    } catch (error) {
      if (lod !== null) lod.dispose();
      else if (octree !== null) octree.dispose();
      else data.dispose();
      throw error;
    }
  }

  add(
    data: GaussianData,
    options: GaussianStoreAddOptions = {},
  ): GaussianCloud {
    this.assertUsable();
    const objectId = this.allocateObjectId();
    const priority = validatePackingPriority(options.priority ?? 0);
    const cloud = new GaussianCloud(
      this,
      objectId,
      0,
      options.name,
      null,
      null,
      priority,
    );
    this.entries.push({
      cloud,
      count: 0,
      sourceGaussianCount: data.count,
      sourceDegree: data.shDegree,
      priority,
      packingStrategy: null,
      source: data,
      ownsSource: options.ownsData ?? false,
      lod: null,
      ownsLod: false,
      packing: null,
    });
    this.cloudList.push(cloud);
    this.invalidatePacking();
    return cloud;
  }

  addLod(
    lod: GaussianLod,
    options: GaussianStoreAddLodOptions = {},
  ): GaussianCloud {
    this.assertUsable();
    const objectId = this.allocateObjectId();
    const priority = validatePackingPriority(options.priority ?? 0);
    const cloud = new GaussianCloud(
      this,
      objectId,
      0,
      options.name,
      lod,
      null,
      priority,
    );
    this.entries.push({
      cloud,
      count: 0,
      sourceGaussianCount: lod.octree.data.count,
      sourceDegree: lod.octree.data.shDegree,
      priority,
      packingStrategy: options.packingStrategy ?? null,
      source: null,
      ownsSource: false,
      lod,
      ownsLod: options.ownsLod ?? false,
      packing: null,
    });
    this.cloudList.push(cloud);
    this.invalidatePacking();
    return cloud;
  }

  remove(cloud: GaussianCloud): void {
    if (this.disposed) return;
    const index = this.entries.findIndex((entry) => entry.cloud === cloud);
    if (index < 0) return;
    const [entry] = this.entries.splice(index, 1);
    this.cloudList.splice(this.cloudList.indexOf(cloud), 1);
    if (entry?.source !== null && entry?.ownsSource === true) {
      entry.source.dispose();
    }
    if (entry?.lod !== null && entry?.ownsLod === true) entry.lod.dispose();
    cloud.removeFromParent();
    this.invalidatePacking();
  }

  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits }: GaussianStorePackOptions): void {
    this.assertUsable();
    if (this.entries.length === 0) {
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    }
    const capacity = capacityFromLimits(limits, this.shDegree);
    const planningStarted = performance.now();
    const planned = this.planPackings(capacity);
    const planningMs = performance.now() - planningStarted;
    const slotCapacity = Math.min(
      capacity,
      this.entries.reduce((sum, entry) => sum + entry.sourceGaussianCount, 0),
    );
    const oldData = this.packedData;
    const canUpdateInPlace =
      oldData !== null &&
      oldData.count === slotCapacity &&
      oldData.shDegree === this.shDegree &&
      this.packedObjectCapacity === this.objectCapacity;
    const slotUpdateStarted = performance.now();
    const result = canUpdateInPlace
      ? this.updatePackedData(planned, oldData)
      : this.buildPackedData(planned, slotCapacity);
    const slotUpdateMs = performance.now() - slotUpdateStarted;

    for (const plan of planned) {
      plan.entry.count = plan.count;
      plan.entry.packing = plan.packing;
      plan.entry.cloud.updatePacking(plan.count, plan.packing);
    }
    this.packedData = result.data;
    this.cellSlotsByEntry = result.cellSlotsByEntry;
    this.freeSlots = result.freeSlots;
    this.gaussianCapacity = capacity;
    this.packedObjectCapacity = this.objectCapacity;
    this.packingInvalid = false;
    this.latestPackStats = { ...result.stats, planningMs, slotUpdateMs };
    if (!canUpdateInPlace) {
      this.layoutVersion++;
      oldData?.dispose();
    }
  }

  private planPackings(capacity: number): PlannedEntry[] {
    const orderedEntries = [...this.entries].sort(
      (left, right) =>
        left.priority - right.priority ||
        left.cloud.objectId - right.cloud.objectId,
    );
    const planned: PlannedEntry[] = [];
    let allocatedGaussians = 0;

    for (const entry of orderedEntries) {
      const remainingGaussians = Math.max(0, capacity - allocatedGaussians);
      const allocatedBudget = this.budgetingStrategy.allocate({
        capacity,
        allocatedGaussians,
        remainingGaussians,
        entry: {
          cloud: entry.cloud,
          priority: entry.priority,
          insertionIndex: entry.cloud.objectId,
          sourceGaussianCount: entry.sourceGaussianCount,
        },
      });
      validateBudgetAllocation(allocatedBudget, remainingGaussians);

      if (entry.lod === null) {
        if (entry.sourceGaussianCount > allocatedBudget) {
          throw new RangeError(
            `${entry.cloud.name} requires ${entry.sourceGaussianCount} Gaussians but its Store allocation is ${allocatedBudget}`,
          );
        }
        planned.push({
          entry,
          count: entry.sourceGaussianCount,
          packing: null,
        });
        allocatedGaussians += entry.sourceGaussianCount;
        continue;
      }

      const strategy = entry.packingStrategy ?? this.defaultPackingStrategy;
      const packing = strategy.pack({
        lod: entry.lod,
        maxGaussians: allocatedBudget,
      });
      if (packing.gaussianCount > allocatedBudget) {
        throw new RangeError(
          `${strategy.constructor.name} exceeded its allocation of ${allocatedBudget} Gaussians`,
        );
      }
      validatePackingStructure(entry.lod, packing);
      planned.push({ entry, count: packing.gaussianCount, packing });
      allocatedGaussians += packing.gaussianCount;
    }
    return planned;
  }

  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(cloud: GaussianCloud, priority: number): void {
    this.assertUsable();
    const entry = this.entries.find((candidate) => candidate.cloud === cloud);
    if (entry === undefined) {
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    }
    const nextPriority = validatePackingPriority(priority);
    entry.priority = nextPriority;
    cloud.updatePackingPriority(nextPriority);
    this.invalidatePacking();
  }

  /** Current packed attributes. pack() must have resolved all invalidations. */
  getPackedData(): GaussianData {
    this.assertUsable();
    if (this.entries.length === 0) {
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    }
    if (this.packingInvalid || this.packedData === null) {
      throw new Error(
        "GaussianStore layout is invalidated; call store.pack({ limits: device.limits }) before rendering",
      );
    }
    return this.packedData!;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.entries) {
      if (entry.source !== null && entry.ownsSource) entry.source.dispose();
      if (entry.lod !== null && entry.ownsLod) entry.lod.dispose();
      entry.cloud.removeFromParent();
    }
    this.entries.length = 0;
    this.cloudList.length = 0;
    this.packedData?.dispose();
    this.packedData = null;
  }

  private buildPackedData(
    planned: readonly PlannedEntry[],
    slotCapacity: number,
  ): {
    data: GaussianData;
    cellSlotsByEntry: Map<StoreEntry, Map<number, Uint32Array>>;
    freeSlots: number[];
    stats: GaussianStorePackStats;
  } {
    const degree = this.shDegree;
    const coefficientCount = (degree + 1) ** 2;
    const means = new Float32Array(slotCapacity * 4);
    const scalesOpacity = new Float32Array(slotCapacity * 4);
    const rotations = new Float32Array(slotCapacity * 4);
    const shCoefficients = new Float32Array(
      slotCapacity * coefficientCount * 4,
    );

    const cellSlotsByEntry = new Map<StoreEntry, Map<number, Uint32Array>>();
    let slot = 0;
    for (const plan of planned) {
      const { entry } = plan;
      const entryCells = new Map<number, Uint32Array>();
      for (const cell of this.plannedCells(plan)) {
        const cellSlots = new Uint32Array(cell.count);
        for (let local = 0; local < cell.count; local++) {
          const sourceIndex = this.cellSourceIndex(entry, cell.nodeId, local);
          this.copySourceToSlot(
            entry,
            sourceIndex,
            slot,
            means,
            scalesOpacity,
            rotations,
            shCoefficients,
            coefficientCount,
          );
          cellSlots[local] = slot++;
        }
        entryCells.set(cell.nodeId, cellSlots);
      }
      cellSlotsByEntry.set(entry, entryCells);
    }
    const freeSlots = Array.from(
      { length: slotCapacity - slot },
      (_, index) => slotCapacity - 1 - index,
    );

    const data = new GaussianData(
      {
        means: attribute("3dgs.store.means-object", means),
        scalesOpacity: attribute("3dgs.store.scales-opacity", scalesOpacity),
        rotations: attribute("3dgs.store.rotations", rotations),
        shCoefficients: attribute("3dgs.store.sh-coefficients", shCoefficients),
      },
      { count: slotCapacity, shDegree: degree, ownsBuffers: true },
    );

    return {
      data,
      cellSlotsByEntry,
      freeSlots,
      stats: {
        fullRebuild: true,
        slotCapacity,
        activeGaussians: slot,
        reusedSlots: 0,
        writtenSlots: slot,
        clearedSlots: 0,
        estimatedUploadBytes: slot * (3 * 16 + coefficientCount * 16),
        writtenSlotRanges: slot === 0 ? [] : [{ start: 0, count: slot }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0,
      },
    };
  }

  private updatePackedData(
    planned: readonly PlannedEntry[],
    data: GaussianData,
  ): {
    data: GaussianData;
    cellSlotsByEntry: Map<StoreEntry, Map<number, Uint32Array>>;
    freeSlots: number[];
    stats: GaussianStorePackStats;
  } {
    const targetCells = new Map<StoreEntry, Map<number, PlannedCell>>();
    let activeGaussians = 0;
    for (const plan of planned) {
      const cells = new Map<number, PlannedCell>();
      for (const cell of this.plannedCells(plan)) {
        cells.set(cell.nodeId, cell);
        activeGaussians += cell.count;
      }
      targetCells.set(plan.entry, cells);
    }

    const freeSlots = [...this.freeSlots];
    const releasedSlots: number[] = [];
    for (const [entry, previousCells] of this.cellSlotsByEntry) {
      const nextCells = targetCells.get(entry);
      for (const [nodeId, previousSlots] of previousCells) {
        const retainedCount = Math.min(
          previousSlots.length,
          nextCells?.get(nodeId)?.count ?? 0,
        );
        for (let local = retainedCount; local < previousSlots.length; local++) {
          const slot = previousSlots[local]!;
          freeSlots.push(slot);
          releasedSlots.push(slot);
        }
      }
    }

    const cellSlotsByEntry = new Map<StoreEntry, Map<number, Uint32Array>>();
    const writtenSlots: number[] = [];
    let reusedSlots = 0;
    for (const plan of planned) {
      const previousCells = this.cellSlotsByEntry.get(plan.entry);
      const nextCells = new Map<number, Uint32Array>();
      for (const cell of targetCells.get(plan.entry)!.values()) {
        const previousSlots = previousCells?.get(cell.nodeId);
        const retainedCount = Math.min(previousSlots?.length ?? 0, cell.count);
        const nextSlots = new Uint32Array(cell.count);
        if (previousSlots !== undefined && retainedCount > 0) {
          nextSlots.set(previousSlots.subarray(0, retainedCount));
          reusedSlots += retainedCount;
        }
        for (let local = retainedCount; local < cell.count; local++) {
          const slot = freeSlots.pop();
          if (slot === undefined) {
            throw new Error("GaussianStore slot allocator exhausted capacity");
          }
          this.copySourceToSlot(
            plan.entry,
            this.cellSourceIndex(plan.entry, cell.nodeId, local),
            slot,
            data.means.array as Float32Array,
            data.scalesOpacity.array as Float32Array,
            data.rotations.array as Float32Array,
            data.shCoefficients.array as Float32Array,
            data.shCoefficientCount,
          );
          nextSlots[local] = slot;
          writtenSlots.push(slot);
        }
        nextCells.set(cell.nodeId, nextSlots);
      }
      cellSlotsByEntry.set(plan.entry, nextCells);
    }

    const newlyUsed = new Set(writtenSlots);
    const clearedSlots = releasedSlots.filter((slot) => !newlyUsed.has(slot));
    const scalesOpacity = data.scalesOpacity.array as Float32Array;
    for (const slot of clearedSlots) scalesOpacity[slot * 4 + 3] = 0;
    markSlotsUpdated(data.means, writtenSlots, 4);
    markSlotsUpdated(data.scalesOpacity, [...writtenSlots, ...clearedSlots], 4);
    markSlotsUpdated(data.rotations, writtenSlots, 4);
    markSlotsUpdated(
      data.shCoefficients,
      writtenSlots,
      data.shCoefficientCount * 4,
    );

    return {
      data,
      cellSlotsByEntry,
      freeSlots,
      stats: {
        fullRebuild: false,
        slotCapacity: data.count,
        activeGaussians,
        reusedSlots,
        writtenSlots: writtenSlots.length,
        clearedSlots: clearedSlots.length,
        estimatedUploadBytes:
          writtenSlots.length * (3 * 16 + data.shCoefficientCount * 16) +
          clearedSlots.length * 16,
        writtenSlotRanges: slotRanges(writtenSlots),
        clearedSlotRanges: slotRanges(clearedSlots),
        planningMs: 0,
        slotUpdateMs: 0,
      },
    };
  }

  private plannedCells(plan: PlannedEntry): PlannedCell[] {
    if (plan.entry.lod === null || plan.packing === null) {
      return [{ nodeId: -1, lodLevel: 0, count: plan.count }];
    }
    return Array.from(plan.packing.nodeIds, (nodeId, index) => ({
      nodeId,
      lodLevel: plan.packing!.lodLevels[index]!,
      count:
        plan.entry.lod!.nodes[nodeId]!.levelCounts[
          plan.packing!.lodLevels[index]!
        ]!,
    }));
  }

  private cellSourceIndex(
    entry: StoreEntry,
    nodeId: number,
    local: number,
  ): number {
    return entry.lod === null
      ? local
      : entry.lod.nodes[nodeId]!.sortedGaussianIndices[local]!;
  }

  private copySourceToSlot(
    entry: StoreEntry,
    sourceIndex: number,
    slot: number,
    means: Float32Array,
    scalesOpacity: Float32Array,
    rotations: Float32Array,
    shCoefficients: Float32Array,
    destinationCoefficientCount: number,
  ): void {
    const source = entry.lod?.octree.data ?? entry.source;
    if (source === null) {
      throw new Error("GaussianStore lost the source for a packed cloud");
    }
    copyVec4Item(source.means.array as Float32Array, sourceIndex, means, slot);
    copyVec4Item(
      source.scalesOpacity.array as Float32Array,
      sourceIndex,
      scalesOpacity,
      slot,
    );
    copyVec4Item(
      source.rotations.array as Float32Array,
      sourceIndex,
      rotations,
      slot,
    );
    means[slot * 4 + 3] = entry.cloud.objectId;
    const sourceCoefficientCount = source.shCoefficientCount;
    const sourceBase = sourceIndex * sourceCoefficientCount * 4;
    const destinationBase = slot * destinationCoefficientCount * 4;
    shCoefficients.fill(
      0,
      destinationBase,
      destinationBase + destinationCoefficientCount * 4,
    );
    shCoefficients.set(
      (source.shCoefficients.array as Float32Array).subarray(
        sourceBase,
        sourceBase + sourceCoefficientCount * 4,
      ),
      destinationBase,
    );
  }

  private invalidatePacking(): void {
    this.packingInvalid = true;
    for (const entry of this.entries) {
      entry.count = 0;
      entry.packing = null;
      entry.cloud.updatePacking(0, null);
    }
  }

  private allocateObjectId(): number {
    const objectId = this.nextObjectId++;
    if (objectId >= MAX_EXACT_FLOAT_INTEGER) {
      throw new RangeError(
        "GaussianStore exhausted object IDs exactly representable in means.w",
      );
    }
    return objectId;
  }

  private assertUsable(): void {
    if (this.disposed) throw new Error("GaussianStore has been disposed");
  }
}

function attribute(name: string, array: Float32Array): StorageBufferAttribute {
  const result = new StorageBufferAttribute(array, 4);
  result.name = name;
  return result;
}

function copyVec4Item(
  source: Float32Array,
  sourceItem: number,
  destination: Float32Array,
  destinationItem: number,
): void {
  destination.set(
    source.subarray(sourceItem * 4, sourceItem * 4 + 4),
    destinationItem * 4,
  );
}

function markSlotsUpdated(
  attribute: StorageBufferAttribute,
  slots: readonly number[],
  componentsPerSlot: number,
): void {
  if (slots.length === 0) return;
  const sorted = [...new Set(slots)].sort((left, right) => left - right);
  let start = sorted[0]!;
  let previous = start;
  for (let index = 1; index <= sorted.length; index++) {
    const slot = sorted[index];
    if (slot === previous + 1) {
      previous = slot;
      continue;
    }
    attribute.addUpdateRange(
      start * componentsPerSlot,
      (previous - start + 1) * componentsPerSlot,
    );
    if (slot !== undefined) start = previous = slot;
  }
  attribute.needsUpdate = true;
}

function slotRanges(slots: readonly number[]): GaussianStoreSlotRange[] {
  if (slots.length === 0) return [];
  const sorted = [...new Set(slots)].sort((left, right) => left - right);
  const ranges: GaussianStoreSlotRange[] = [];
  let start = sorted[0]!;
  let previous = start;
  for (let index = 1; index <= sorted.length; index++) {
    const slot = sorted[index];
    if (slot === previous + 1) {
      previous = slot;
      continue;
    }
    ranges.push({ start, count: previous - start + 1 });
    if (slot !== undefined) start = previous = slot;
  }
  return ranges;
}

function sourceName(url: string): string {
  const clean = url.split(/[?#]/, 1)[0] ?? url;
  return clean.slice(clean.lastIndexOf("/") + 1) || "GaussianCloud";
}

function validatePackingPriority(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer",
    );
  }
  return value;
}

function validateBudgetAllocation(
  allocation: number,
  remainingGaussians: number,
): void {
  if (
    !Number.isSafeInteger(allocation) ||
    allocation < 0 ||
    allocation > remainingGaussians
  ) {
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${remainingGaussians}]`,
    );
  }
}

function validatePackingStructure(
  lod: GaussianLod,
  packing: GaussianLodPacking,
): void {
  if (packing.nodeIds.length !== packing.lodLevels.length) {
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  }
  const selected = new Set<number>();
  let gaussianCount = 0;
  for (let index = 0; index < packing.nodeIds.length; index++) {
    const nodeId = packing.nodeIds[index]!;
    const node = lod.nodes[nodeId];
    const level = packing.lodLevels[index]!;
    const count = node?.levelCounts[level];
    if (count === undefined) {
      throw new RangeError(
        `GaussianLod packing references invalid node ${nodeId} or level ${level}`,
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

  const visit = (nodeId: number, selectedAncestor: boolean): void => {
    const selectedHere = selected.has(nodeId);
    if (selectedAncestor && selectedHere) {
      throw new Error(
        "GaussianLodPacking contains overlapping octree representations",
      );
    }
    for (const childId of lod.octree.nodes[nodeId]!.children) {
      visit(childId, selectedAncestor || selectedHere);
    }
  };
  visit(lod.octree.rootNode, false);
}

function capacityFromLimits(
  limits: GaussianStorePackLimits,
  shDegree: 0 | 1 | 2 | 3,
): number {
  const bindingSize = validateDeviceLimit(
    limits.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize",
  );
  const bufferSize = validateDeviceLimit(limits.maxBufferSize, "maxBufferSize");
  const bytesPerGaussian = Math.max(16, (shDegree + 1) ** 2 * 16);
  return Math.floor(Math.min(bindingSize, bufferSize) / bytesPerGaussian);
}

function validateDeviceLimit(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(
      `GPUDevice limit ${name} must be a positive safe integer`,
    );
  }
  return value;
}
