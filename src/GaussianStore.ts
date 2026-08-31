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
import {
  disposeGaussianStoreAttributes,
  GaussianStoreAttributes,
  enableGaussianStoreAttribute,
} from "./store-attributes/GaussianStoreAttributes";
import {
  replaceGaussianStoreAttribute,
  updateGaussianStoreAttribute,
} from "./store-attributes/GaussianStorePackedAttribute";
import type { GaussianStorePackedAttribute } from "./store-attributes";

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
  allocatedBudget: number | null;
  packingDirty: boolean;
}

interface PlannedEntry {
  readonly entry: StoreEntry;
  readonly count: number;
  readonly packing: GaussianLodPacking | null;
  readonly allocatedBudget: number;
  readonly selectionChanged: boolean;
}

interface PlannedCell {
  readonly nodeId: number;
  readonly lodLevel: number;
  readonly count: number;
}

interface PackedCellState {
  readonly lodLevel: number;
  readonly slots: Uint32Array;
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
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  readonly attributes = new GaussianStoreAttributes();
  private readonly entries: StoreEntry[] = [];
  private readonly cloudList: GaussianCloud[] = [];
  private packedData: GaussianData | null = null;
  private nextObjectId = 0;
  private packedObjectCapacity = 0;
  private gaussianCapacity = 0;
  private cellSlotsByEntry = new Map<
    StoreEntry,
    Map<number, PackedCellState>
  >();
  private freeSlots: number[] = [];
  private readonly scratchWrittenSlots: number[] = [];
  private readonly scratchLodLevelWrittenSlots: number[] = [];
  private readonly scratchReleasedSlots: number[] = [];
  private readonly scratchClearedSlots: number[] = [];
  private slotMarks = new Uint32Array();
  private slotMarkGeneration = 0;
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

  /**
   * Lazily enables one u32 per packed slot containing its selected cell LOD.
   * Repeated calls return the same stable wrapper.
   */
  enablePackedLodLevelAttribute(): GaussianStorePackedAttribute {
    this.assertUsable();
    const existing = this.attributes.get("lodLevel");
    if (existing !== undefined) return existing;
    const attribute = this.attributes[enableGaussianStoreAttribute](
      "lodLevel",
      "u32",
    );
    if (this.packedData !== null) {
      attribute[replaceGaussianStoreAttribute](
        new Uint32Array(this.packedData.count),
      );
      this.populateAllLodLevels(this.cellSlotsByEntry, attribute.array);
    }
    return attribute;
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
      allocatedBudget: null,
      packingDirty: true,
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
      allocatedBudget: null,
      packingDirty: true,
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
      plan.entry.allocatedBudget = plan.allocatedBudget;
      plan.entry.packingDirty = false;
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
          allocatedBudget,
          selectionChanged:
            entry.packingDirty || entry.allocatedBudget !== allocatedBudget,
        });
        allocatedGaussians += entry.sourceGaussianCount;
        continue;
      }

      const strategy = entry.packingStrategy ?? this.defaultPackingStrategy;
      const selectionChanged =
        entry.packingDirty ||
        entry.allocatedBudget !== allocatedBudget ||
        entry.packing === null;
      const packing =
        !selectionChanged && entry.packing !== null
          ? entry.packing
          : strategy.pack({
              lod: entry.lod,
              maxGaussians: allocatedBudget,
            });
      if (packing.gaussianCount > allocatedBudget) {
        throw new RangeError(
          `${strategy.constructor.name} exceeded its allocation of ${allocatedBudget} Gaussians`,
        );
      }
      validatePackingStructure(entry.lod, packing);
      planned.push({
        entry,
        count: packing.gaussianCount,
        packing,
        allocatedBudget,
        selectionChanged,
      });
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

  /** Mark one cloud for strategy re-evaluation after its strategy parameters change. */
  invalidateCloudPacking(cloud: GaussianCloud): void {
    this.assertUsable();
    const entry = this.entries.find((candidate) => candidate.cloud === cloud);
    if (entry === undefined) {
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    }
    entry.packingDirty = true;
    this.packingInvalid = true;
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
    this.attributes[disposeGaussianStoreAttributes]();
  }

  private buildPackedData(
    planned: readonly PlannedEntry[],
    slotCapacity: number,
  ): {
    data: GaussianData;
    cellSlotsByEntry: Map<StoreEntry, Map<number, PackedCellState>>;
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
    const lodLevelAttribute = this.attributes.get("lodLevel");
    const lodLevels =
      lodLevelAttribute === undefined ? null : new Uint32Array(slotCapacity);

    const cellSlotsByEntry = new Map<
      StoreEntry,
      Map<number, PackedCellState>
    >();
    let slot = 0;
    for (const plan of planned) {
      const { entry } = plan;
      const entryCells = new Map<number, PackedCellState>();
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
        entryCells.set(cell.nodeId, {
          lodLevel: cell.lodLevel,
          slots: cellSlots,
        });
      }
      cellSlotsByEntry.set(entry, entryCells);
    }
    if (lodLevels !== null) {
      this.populateAllLodLevels(cellSlotsByEntry, lodLevels);
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
    if (lodLevelAttribute !== undefined && lodLevels !== null) {
      lodLevelAttribute[replaceGaussianStoreAttribute](lodLevels);
    }

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
        estimatedUploadBytes:
          slot *
          (3 * 16 +
            coefficientCount * 16 +
            (lodLevelAttribute === undefined ? 0 : 4)),
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
    cellSlotsByEntry: Map<StoreEntry, Map<number, PackedCellState>>;
    freeSlots: number[];
    stats: GaussianStorePackStats;
  } {
    const targetCells = new Map<StoreEntry, Map<number, PlannedCell>>();
    const plannedEntries = new Set<StoreEntry>();
    let activeGaussians = 0;
    for (const plan of planned) {
      plannedEntries.add(plan.entry);
      activeGaussians += plan.count;
      if (!plan.selectionChanged) continue;
      const cells = new Map<number, PlannedCell>();
      for (const cell of this.plannedCells(plan)) {
        cells.set(cell.nodeId, cell);
      }
      targetCells.set(plan.entry, cells);
    }

    const freeSlots = [...this.freeSlots];
    const releasedSlots = this.scratchReleasedSlots;
    releasedSlots.length = 0;
    for (const [entry, previousCells] of this.cellSlotsByEntry) {
      const nextCells = targetCells.get(entry);
      if (nextCells === undefined && plannedEntries.has(entry)) continue;
      for (const [nodeId, previousCell] of previousCells) {
        const previousSlots = previousCell.slots;
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

    const cellSlotsByEntry = new Map<
      StoreEntry,
      Map<number, PackedCellState>
    >();
    const writtenSlots = this.scratchWrittenSlots;
    writtenSlots.length = 0;
    const lodLevelAttribute = this.attributes.get("lodLevel");
    const lodLevelWrittenSlots = this.scratchLodLevelWrittenSlots;
    lodLevelWrittenSlots.length = 0;
    let reusedSlots = 0;
    for (const plan of planned) {
      const previousCells = this.cellSlotsByEntry.get(plan.entry);
      if (!plan.selectionChanged && previousCells !== undefined) {
        cellSlotsByEntry.set(plan.entry, previousCells);
        reusedSlots += plan.count;
        continue;
      }
      const nextCells = new Map<number, PackedCellState>();
      for (const cell of targetCells.get(plan.entry)?.values() ?? []) {
        const previousCell = previousCells?.get(cell.nodeId);
        const previousSlots = previousCell?.slots;
        const retainedCount = Math.min(previousSlots?.length ?? 0, cell.count);
        const nextSlots =
          previousSlots !== undefined && previousSlots.length === cell.count
            ? previousSlots
            : new Uint32Array(cell.count);
        if (
          nextSlots !== previousSlots &&
          previousSlots !== undefined &&
          retainedCount > 0
        ) {
          nextSlots.set(previousSlots.subarray(0, retainedCount));
        }
        reusedSlots += retainedCount;
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
        if (lodLevelAttribute !== undefined) {
          const lodStart =
            previousCell?.lodLevel === cell.lodLevel ? retainedCount : 0;
          for (let local = lodStart; local < nextSlots.length; local++) {
            const slot = nextSlots[local]!;
            lodLevelAttribute.array[slot] = cell.lodLevel;
            lodLevelWrittenSlots.push(slot);
          }
        }
        nextCells.set(cell.nodeId, {
          lodLevel: cell.lodLevel,
          slots: nextSlots,
        });
      }
      cellSlotsByEntry.set(plan.entry, nextCells);
    }

    const slotMarkGeneration = this.nextSlotMarkGeneration(data.count);
    for (const slot of writtenSlots) this.slotMarks[slot] = slotMarkGeneration;
    const clearedSlots = this.scratchClearedSlots;
    clearedSlots.length = 0;
    for (const slot of releasedSlots) {
      if (this.slotMarks[slot] !== slotMarkGeneration) clearedSlots.push(slot);
    }
    const scalesOpacity = data.scalesOpacity.array as Float32Array;
    for (const slot of clearedSlots) scalesOpacity[slot * 4 + 3] = 0;
    const writtenSlotCount = writtenSlots.length;
    const clearedSlotCount = clearedSlots.length;
    const writtenSlotRanges = mergedSlotRanges(writtenSlots, 4, 0.15);
    const clearedSlotRanges = mergedSlotRanges(clearedSlots, 16, 0.25);
    const lodLevelSlotRanges = mergedSlotRanges(lodLevelWrittenSlots, 16, 0.25);
    markRangesUpdated(data.means, writtenSlotRanges, 4);
    markRangesUpdated(data.scalesOpacity, writtenSlotRanges, 4);
    markRangesUpdated(data.scalesOpacity, clearedSlotRanges, 4);
    markRangesUpdated(data.rotations, writtenSlotRanges, 4);
    markRangesUpdated(
      data.shCoefficients,
      writtenSlotRanges,
      data.shCoefficientCount * 4,
    );
    lodLevelAttribute?.[updateGaussianStoreAttribute](lodLevelSlotRanges);

    const uploadedWrittenSlots = rangeSlotCount(writtenSlotRanges);
    const uploadedClearedSlots = rangeSlotCount(clearedSlotRanges);
    const uploadedLodLevelSlots = rangeSlotCount(lodLevelSlotRanges);

    return {
      data,
      cellSlotsByEntry,
      freeSlots,
      stats: {
        fullRebuild: false,
        slotCapacity: data.count,
        activeGaussians,
        reusedSlots,
        writtenSlots: writtenSlotCount,
        clearedSlots: clearedSlotCount,
        estimatedUploadBytes:
          uploadedWrittenSlots * (3 * 16 + data.shCoefficientCount * 16) +
          uploadedClearedSlots * 16 +
          uploadedLodLevelSlots * 4,
        writtenSlotRanges,
        clearedSlotRanges,
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

  private populateAllLodLevels(
    cellsByEntry: ReadonlyMap<StoreEntry, ReadonlyMap<number, PackedCellState>>,
    destination: Uint32Array,
  ): void {
    for (const cells of cellsByEntry.values()) {
      for (const cell of cells.values()) {
        for (const slot of cell.slots) destination[slot] = cell.lodLevel;
      }
    }
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
      entry.packingDirty = true;
      entry.allocatedBudget = null;
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

  private nextSlotMarkGeneration(slotCapacity: number): number {
    if (this.slotMarks.length !== slotCapacity) {
      this.slotMarks = new Uint32Array(slotCapacity);
      this.slotMarkGeneration = 0;
    }
    this.slotMarkGeneration++;
    if (this.slotMarkGeneration === 0xffff_ffff) {
      this.slotMarks.fill(0);
      this.slotMarkGeneration = 1;
    }
    return this.slotMarkGeneration;
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

function markRangesUpdated(
  attribute: StorageBufferAttribute,
  ranges: readonly GaussianStoreSlotRange[],
  componentsPerSlot: number,
): void {
  if (ranges.length === 0) return;
  for (const range of ranges) {
    attribute.addUpdateRange(
      range.start * componentsPerSlot,
      range.count * componentsPerSlot,
    );
  }
  attribute.needsUpdate = true;
}

function mergedSlotRanges(
  slots: number[],
  maxGapSlots: number,
  maxExpansion: number,
): GaussianStoreSlotRange[] {
  if (slots.length === 0) return [];
  slots.sort((left, right) => left - right);
  const exactRanges: GaussianStoreSlotRange[] = [];
  let start = slots[0]!;
  let previous = start;
  let exactSlotCount = 1;
  for (let index = 1; index <= slots.length; index++) {
    const slot = slots[index];
    if (slot === previous) continue;
    if (slot !== undefined) exactSlotCount++;
    if (slot === previous + 1) {
      previous = slot;
      continue;
    }
    exactRanges.push({ start, count: previous - start + 1 });
    if (slot !== undefined) start = previous = slot;
  }
  if (exactRanges.length < 2) return exactRanges;

  const allowedExtraSlots = Math.floor(exactSlotCount * maxExpansion);
  let usedExtraSlots = 0;
  const merged: GaussianStoreSlotRange[] = [];
  let current = { ...exactRanges[0]! };
  for (let index = 1; index < exactRanges.length; index++) {
    const next = exactRanges[index]!;
    const currentEnd = current.start + current.count;
    const gap = next.start - currentEnd;
    if (gap <= maxGapSlots && usedExtraSlots + gap <= allowedExtraSlots) {
      current.count = next.start + next.count - current.start;
      usedExtraSlots += gap;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

function rangeSlotCount(ranges: readonly GaussianStoreSlotRange[]): number {
  let count = 0;
  for (const range of ranges) count += range.count;
  return count;
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
