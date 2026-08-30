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
  /** Total Gaussian capacity derived from the active WebGPU resource limits. */
  maxGaussians?: number;
  /** Defaults to RemainingCapacityBudgetStrategy. */
  budgetingStrategy?: GaussianStoreBudgetStrategy;
  /** Used by LOD entries without an individual override. */
  defaultPackingStrategy?: GaussianLodPackingStrategy;
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
  readonly sourceDegree: 0 | 1 | 2 | 3;
  priority: number;
  readonly packingStrategy: GaussianLodPackingStrategy | null;
  source: GaussianData | null;
  ownsSource: boolean;
  lod: GaussianLod | null;
  ownsLod: boolean;
  packing: GaussianLodPacking | null;
  packedOffset: number;
}

const MAX_EXACT_FLOAT_INTEGER = 16_777_216;
/**
 * Conservative degree-3 capacity for WebGPU's 128 MiB default maximum storage
 * buffer binding: 16 SH coefficients * one 16-byte vec4 per Gaussian.
 */
export const DEFAULT_GAUSSIAN_STORE_CAPACITY = 524_288;

/**
 * Owns one packed set of Gaussian attributes shared by every GaussianCloud.
 * Structural changes are packed lazily when a pass next requests the data.
 */
export class GaussianStore {
  private readonly loader: GaussianDataLoader;
  readonly budgetingStrategy: GaussianStoreBudgetStrategy;
  readonly defaultPackingStrategy: GaussianLodPackingStrategy;
  private readonly entries: StoreEntry[] = [];
  private readonly cloudList: GaussianCloud[] = [];
  private packedData: GaussianData | null = null;
  private packedDegree: 0 | 1 | 2 | 3 = 0;
  private nextObjectId = 0;
  private gaussianCapacity: number;
  private dirty = false;
  private disposed = false;

  /** Changes only when clouds are added, removed, or repacked structurally. */
  layoutVersion = 0;

  constructor(options: GaussianStoreOptions = {}) {
    this.loader = options.loader ?? new CanonicalGaussianPlyLoader();
    this.gaussianCapacity = validateStoreCapacity(
      options.maxGaussians ?? DEFAULT_GAUSSIAN_STORE_CAPACITY,
    );
    this.budgetingStrategy =
      options.budgetingStrategy ?? new RemainingCapacityBudgetStrategy();
    this.defaultPackingStrategy =
      options.defaultPackingStrategy ?? new RadialLodPackingStrategy();
  }

  get maxGaussians(): number {
    return this.gaussianCapacity;
  }

  set maxGaussians(value: number) {
    this.assertUsable();
    const previous = this.gaussianCapacity;
    this.gaussianCapacity = validateStoreCapacity(value);
    try {
      this.repackLods();
    } catch (error) {
      this.gaussianCapacity = previous;
      throw error;
    }
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
      data.count,
      options.name,
      null,
      null,
      priority,
    );
    this.entries.push({
      cloud,
      count: data.count,
      sourceDegree: data.shDegree,
      priority,
      packingStrategy: null,
      source: data,
      ownsSource: options.ownsData ?? false,
      lod: null,
      ownsLod: false,
      packing: null,
      packedOffset: -1,
    });
    this.cloudList.push(cloud);
    try {
      this.repackLods();
    } catch (error) {
      this.entries.pop();
      this.cloudList.pop();
      throw error;
    }
    return cloud;
  }

  addLod(
    lod: GaussianLod,
    options: GaussianStoreAddLodOptions = {},
  ): GaussianCloud {
    this.assertUsable();
    const objectId = this.allocateObjectId();
    const priority = validatePackingPriority(options.priority ?? 0);
    const packing = emptyPacking();
    const cloud = new GaussianCloud(
      this,
      objectId,
      0,
      options.name,
      lod,
      packing,
      priority,
    );
    this.entries.push({
      cloud,
      count: 0,
      sourceDegree: lod.octree.data.shDegree,
      priority,
      packingStrategy: options.packingStrategy ?? null,
      source: null,
      ownsSource: false,
      lod,
      ownsLod: options.ownsLod ?? false,
      packing,
      packedOffset: -1,
    });
    this.cloudList.push(cloud);
    try {
      this.repackLods();
    } catch (error) {
      this.entries.pop();
      this.cloudList.pop();
      throw error;
    }
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
    this.repackLods();
  }

  /** Reassign the global budget and rebuild every LOD packing deterministically. */
  repackLods(): void {
    this.assertUsable();
    const orderedEntries = [...this.entries].sort(
      (left, right) =>
        left.priority - right.priority ||
        left.cloud.objectId - right.cloud.objectId,
    );
    const nextPackings = new Map<StoreEntry, GaussianLodPacking>();
    let allocatedGaussians = 0;

    for (const entry of orderedEntries) {
      const remainingGaussians = Math.max(
        0,
        this.gaussianCapacity - allocatedGaussians,
      );
      const allocatedBudget = this.budgetingStrategy.allocate({
        capacity: this.gaussianCapacity,
        allocatedGaussians,
        remainingGaussians,
        entry: {
          cloud: entry.cloud,
          priority: entry.priority,
          insertionIndex: entry.cloud.objectId,
          sourceGaussianCount: entry.lod?.octree.data.count ?? entry.count,
        },
      });
      validateBudgetAllocation(allocatedBudget, remainingGaussians);

      if (entry.lod === null) {
        if (entry.count > allocatedBudget) {
          throw new RangeError(
            `${entry.cloud.name} requires ${entry.count} Gaussians but its Store allocation is ${allocatedBudget}`,
          );
        }
        allocatedGaussians += entry.count;
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
      entry.lod.indicesForPacking(packing);
      nextPackings.set(entry, packing);
      allocatedGaussians += packing.gaussianCount;
    }

    for (const [entry, packing] of nextPackings) {
      entry.packing = packing;
      entry.count = packing.gaussianCount;
      entry.cloud.updateLodPacking(packing);
    }
    this.markDirty();
  }

  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(cloud: GaussianCloud, priority: number): void {
    this.assertUsable();
    const entry = this.entries.find((candidate) => candidate.cloud === cloud);
    if (entry === undefined) {
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    }
    const nextPriority = validatePackingPriority(priority);
    const previous = entry.priority;
    entry.priority = nextPriority;
    cloud.updatePackingPriority(nextPriority);
    try {
      this.repackLods();
    } catch (error) {
      entry.priority = previous;
      cloud.updatePackingPriority(previous);
      throw error;
    }
  }

  /** Current packed attributes. Rebuilds them once after pending structural edits. */
  getPackedData(): GaussianData {
    this.assertUsable();
    if (this.entries.length === 0) {
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    }
    if (this.dirty || this.packedData === null) this.repackPackedData();
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

  private repackPackedData(): void {
    const count = this.count;
    const degree = this.shDegree;
    const coefficientCount = (degree + 1) ** 2;
    const oldData = this.packedData;
    const oldCoefficientCount = (this.packedDegree + 1) ** 2;
    const means = new Float32Array(count * 4);
    const scalesOpacity = new Float32Array(count * 4);
    const rotations = new Float32Array(count * 4);
    const shCoefficients = new Float32Array(count * coefficientCount * 4);

    let destinationGaussian = 0;
    for (const entry of this.entries) {
      const source = entry.lod?.octree.data ?? entry.source ?? oldData;
      if (source === null) {
        throw new Error("GaussianStore lost the source for a packed cloud");
      }
      const selectedIndices =
        entry.lod !== null && entry.packing !== null
          ? entry.lod.indicesForPacking(entry.packing)
          : null;
      const sourceGaussian =
        entry.lod === null && entry.source === null ? entry.packedOffset : 0;
      const sourceCoefficientCount =
        entry.lod === null && entry.source === null
          ? oldCoefficientCount
          : source.shCoefficientCount;
      for (let local = 0; local < entry.count; local++) {
        const selectedSource =
          selectedIndices?.[local] ?? sourceGaussian + local;
        copyVec4Item(
          source.means.array as Float32Array,
          selectedSource,
          means,
          destinationGaussian + local,
        );
        copyVec4Item(
          source.scalesOpacity.array as Float32Array,
          selectedSource,
          scalesOpacity,
          destinationGaussian + local,
        );
        copyVec4Item(
          source.rotations.array as Float32Array,
          selectedSource,
          rotations,
          destinationGaussian + local,
        );
        means[(destinationGaussian + local) * 4 + 3] = entry.cloud.objectId;
        const sourceBase = selectedSource * sourceCoefficientCount * 4;
        const destinationBase =
          (destinationGaussian + local) * coefficientCount * 4;
        const copiedCoefficientCount = Math.min(
          sourceCoefficientCount,
          coefficientCount,
        );
        shCoefficients.set(
          (source.shCoefficients.array as Float32Array).subarray(
            sourceBase,
            sourceBase + copiedCoefficientCount * 4,
          ),
          destinationBase,
        );
      }
      entry.packedOffset = destinationGaussian;
      destinationGaussian += entry.count;
    }

    const packed = new GaussianData(
      {
        means: attribute("3dgs.store.means-object", means),
        scalesOpacity: attribute("3dgs.store.scales-opacity", scalesOpacity),
        rotations: attribute("3dgs.store.rotations", rotations),
        shCoefficients: attribute("3dgs.store.sh-coefficients", shCoefficients),
      },
      { count, shDegree: degree, ownsBuffers: true },
    );

    for (const entry of this.entries) {
      if (entry.lod === null) {
        if (entry.source !== null && entry.ownsSource) entry.source.dispose();
        entry.source = null;
        entry.ownsSource = false;
      }
    }
    this.packedData = packed;
    this.packedDegree = degree;
    this.dirty = false;
    oldData?.dispose();
  }

  private markDirty(): void {
    this.dirty = true;
    this.layoutVersion++;
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

function sourceName(url: string): string {
  const clean = url.split(/[?#]/, 1)[0] ?? url;
  return clean.slice(clean.lastIndexOf("/") + 1) || "GaussianCloud";
}

function validateStoreCapacity(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(
      "GaussianStore maxGaussians must be a positive safe integer",
    );
  }
  return value;
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

function emptyPacking(): GaussianLodPacking {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0,
  };
}
