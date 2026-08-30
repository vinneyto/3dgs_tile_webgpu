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
  GaussianOctree,
  type GaussianOctreeBuildOptions,
} from "./GaussianOctree";

export interface GaussianDataLoader {
  load(url: string): Promise<GaussianData>;
}

export interface GaussianStoreOptions {
  /** Optional source-format loader used by store.load(). */
  loader?: GaussianDataLoader;
}

export interface GaussianStoreAddOptions {
  name?: string;
  /** Dispose the source GaussianData after its values have been packed. Defaults to false. */
  ownsData?: boolean;
}

export interface GaussianLodBudget {
  maxGaussians: number;
}

export interface GaussianStoreAddLodOptions {
  name?: string;
  /** Defaults to the full source count. */
  budget?: GaussianLodBudget;
  /** Defaults to radial clipping at the finest LOD. */
  packingStrategy?: GaussianLodPackingStrategy;
  /** Dispose the supplied GaussianLod when its cloud is removed. Defaults to false. */
  ownsLod?: boolean;
}

export interface GaussianStoreLoadOptions {
  name?: string;
  octree?: Omit<GaussianOctreeBuildOptions, "ownsData">;
  lod?: Omit<GaussianLodBuildOptions, "ownsOctree">;
  budget?: GaussianLodBudget;
  packingStrategy?: GaussianLodPackingStrategy;
}

interface StoreEntry {
  readonly cloud: GaussianCloud;
  readonly count: number;
  readonly sourceDegree: 0 | 1 | 2 | 3;
  source: GaussianData | null;
  ownsSource: boolean;
  lod: GaussianLod | null;
  ownsLod: boolean;
  packing: GaussianLodPacking | null;
  packedOffset: number;
}

const MAX_EXACT_FLOAT_INTEGER = 16_777_216;

/**
 * Owns one packed set of Gaussian attributes shared by every GaussianCloud.
 * Structural changes are packed lazily when a pass next requests the data.
 */
export class GaussianStore {
  private readonly loader: GaussianDataLoader;
  private readonly entries: StoreEntry[] = [];
  private readonly cloudList: GaussianCloud[] = [];
  private packedData: GaussianData | null = null;
  private packedDegree: 0 | 1 | 2 | 3 = 0;
  private nextObjectId = 0;
  private dirty = false;
  private disposed = false;

  /** Changes only when clouds are added, removed, or repacked structurally. */
  layoutVersion = 0;

  constructor(options: GaussianStoreOptions = {}) {
    this.loader = options.loader ?? new CanonicalGaussianPlyLoader();
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
        budget: options.budget,
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
    const cloud = new GaussianCloud(this, objectId, data.count, options.name);
    this.entries.push({
      cloud,
      count: data.count,
      sourceDegree: data.shDegree,
      source: data,
      ownsSource: options.ownsData ?? false,
      lod: null,
      ownsLod: false,
      packing: null,
      packedOffset: -1,
    });
    this.cloudList.push(cloud);
    this.markDirty();
    return cloud;
  }

  addLod(
    lod: GaussianLod,
    options: GaussianStoreAddLodOptions = {},
  ): GaussianCloud {
    this.assertUsable();
    const maxGaussians = options.budget?.maxGaussians ?? lod.octree.data.count;
    const strategy = options.packingStrategy ?? new RadialLodPackingStrategy();
    const packing = strategy.pack({ lod, maxGaussians });
    // Validate overlap, levels and declared count before mutating the store.
    lod.indicesForPacking(packing);

    const objectId = this.allocateObjectId();
    const cloud = new GaussianCloud(
      this,
      objectId,
      packing.gaussianCount,
      options.name,
      lod,
      packing,
    );
    this.entries.push({
      cloud,
      count: packing.gaussianCount,
      sourceDegree: lod.octree.data.shDegree,
      source: null,
      ownsSource: false,
      lod,
      ownsLod: options.ownsLod ?? false,
      packing,
      packedOffset: -1,
    });
    this.cloudList.push(cloud);
    this.markDirty();
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
    this.markDirty();
  }

  /** Current packed attributes. Rebuilds them once after pending structural edits. */
  getPackedData(): GaussianData {
    this.assertUsable();
    if (this.entries.length === 0) {
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    }
    if (this.dirty || this.packedData === null) this.repack();
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

  private repack(): void {
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
