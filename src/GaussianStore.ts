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
  packedOffset: number;
}

interface PlannedEntry {
  readonly entry: StoreEntry;
  readonly count: number;
  readonly packing: GaussianLodPacking | null;
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
  private packedDegree: 0 | 1 | 2 | 3 = 0;
  private nextObjectId = 0;
  private gaussianCapacity = 0;
  private packingInvalid = false;
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
      packedOffset: -1,
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
      packedOffset: -1,
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
    const planned = this.planPackings(capacity);
    const { data, offsets } = this.buildPackedData(planned);
    const oldData = this.packedData;

    for (const plan of planned) {
      plan.entry.count = plan.count;
      plan.entry.packing = plan.packing;
      plan.entry.packedOffset = offsets.get(plan.entry)!;
      plan.entry.cloud.updatePacking(plan.count, plan.packing);
      if (plan.entry.lod === null && plan.entry.source !== null) {
        if (plan.entry.ownsSource) plan.entry.source.dispose();
        plan.entry.source = null;
        plan.entry.ownsSource = false;
      }
    }
    this.packedData = data;
    this.packedDegree = this.shDegree;
    this.gaussianCapacity = capacity;
    this.packingInvalid = false;
    this.layoutVersion++;
    oldData?.dispose();
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
      entry.lod.indicesForPacking(packing);
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

  private buildPackedData(planned: readonly PlannedEntry[]): {
    data: GaussianData;
    offsets: ReadonlyMap<StoreEntry, number>;
  } {
    const count = planned.reduce((sum, plan) => sum + plan.count, 0);
    const degree = this.shDegree;
    const coefficientCount = (degree + 1) ** 2;
    const oldData = this.packedData;
    const oldCoefficientCount = (this.packedDegree + 1) ** 2;
    const means = new Float32Array(count * 4);
    const scalesOpacity = new Float32Array(count * 4);
    const rotations = new Float32Array(count * 4);
    const shCoefficients = new Float32Array(count * coefficientCount * 4);

    const offsets = new Map<StoreEntry, number>();
    let destinationGaussian = 0;
    for (const plan of planned) {
      const { entry } = plan;
      const source = entry.lod?.octree.data ?? entry.source ?? oldData;
      if (source === null) {
        throw new Error("GaussianStore lost the source for a packed cloud");
      }
      const selectedIndices =
        entry.lod !== null && plan.packing !== null
          ? entry.lod.indicesForPacking(plan.packing)
          : null;
      const sourceGaussian =
        entry.lod === null && entry.source === null ? entry.packedOffset : 0;
      const sourceCoefficientCount =
        entry.lod === null && entry.source === null
          ? oldCoefficientCount
          : source.shCoefficientCount;
      offsets.set(entry, destinationGaussian);
      for (let local = 0; local < plan.count; local++) {
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
      destinationGaussian += plan.count;
    }

    const data = new GaussianData(
      {
        means: attribute("3dgs.store.means-object", means),
        scalesOpacity: attribute("3dgs.store.scales-opacity", scalesOpacity),
        rotations: attribute("3dgs.store.rotations", rotations),
        shCoefficients: attribute("3dgs.store.sh-coefficients", shCoefficients),
      },
      { count, shDegree: degree, ownsBuffers: true },
    );

    return { data, offsets };
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
