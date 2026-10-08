import { StorageBufferAttribute } from "three/webgpu";

import type { GaussianShFormat } from "../streaming-backend-impl/GaussianSh";

export interface ActiveSlotRange {
  start: number;
  count: number;
}

export interface GaussianBuffers {
  /** vec4<f32> per Gaussian. xyz is the local-space mean; w holds objectId for occupied slots, or -1 for an unoccupied slot. */
  means: StorageBufferAttribute;
  /** float32: vec4<f32> linear scale + opacity. compact: uvec2 packed fp16 log scales + opacity. */
  scalesOpacity: StorageBufferAttribute;
  /** float32: vec4 quaternion (xyzw). compact: u32 Spark oct101012 quaternion. */
  rotations: StorageBufferAttribute;
  /** SH coefficients in the representation selected by GaussianDataOptions.shFormat. */
  shCoefficients: StorageBufferAttribute;
}

export interface GaussianDataOptions {
  count: number;
  /** Omit to draw the dense identity slot range. */
  activeSlots?: Uint32Array;
  /** Canonical real spherical-harmonic degree. Supported values are 0 through 3. */
  shDegree?: 0 | 1 | 2 | 3;
  /** float32 uses vec4<f32>; rgb8e8 uses one packed u32 per RGB coefficient. Defaults to float32. */
  shFormat?: GaussianShFormat;
  /** Dispose the supplied Three.js attributes with this object. Defaults to false. */
  ownsBuffers?: boolean;
  /** Compact geometry keeps float32 means; shape uses u32x2 + u32. */
  geometryFormat?: "float32" | "compact";
}

/**
 * Gaussian storage expressed as normal Three.js storage attributes. Parsing and
 * source-format activation deliberately live outside the renderer. The same
 * attributes can be consumed by node materials, wgslFn compute nodes, or geometries.
 */
export class GaussianData {
  readonly geometryFormat: "float32" | "compact";
  readonly count: number;
  readonly shDegree: 0 | 1 | 2 | 3;
  readonly shCoefficientCount: number;
  readonly shFormat: GaussianShFormat;
  readonly means: StorageBufferAttribute;
  readonly scalesOpacity: StorageBufferAttribute;
  readonly rotations: StorageBufferAttribute;
  readonly shCoefficients: StorageBufferAttribute;

  /** Compact CPU draw list, mirrored in the SH buffer's reserved tail. */
  private activeValues: Uint32Array | null;
  private activeOrdinals: Int32Array | null;
  private stagedValues: Uint32Array | null;
  private stagedOrdinals: Int32Array | null;
  private staging = false;
  private stagedCount = 0;
  private firstChanged = Infinity;
  private lastChanged = -1;
  activeCount: number;
  activeVersion = 0;
  private readonly activeListeners = new Set<
    (range: ActiveSlotRange) => void
  >();
  private readonly ownsShBuffer: boolean;

  get activeSlots(): Uint32Array | null {
    return this.activeValues;
  }

  private readonly ownsBuffers: boolean;
  private disposed = false;

  constructor(buffers: GaussianBuffers, options: GaussianDataOptions) {
    if (!Number.isInteger(options.count) || options.count <= 0) {
      throw new RangeError("GaussianData count must be a positive integer");
    }

    const shDegree = options.shDegree ?? 0;
    if (!Number.isInteger(shDegree) || shDegree < 0 || shDegree > 3) {
      throw new RangeError("GaussianData shDegree must be 0, 1, 2, or 3");
    }

    this.geometryFormat = options.geometryFormat ?? "float32";
    this.count = options.count;
    this.activeValues = options.activeSlots
      ? new Uint32Array(this.count)
      : null;
    this.activeOrdinals = this.activeValues
      ? new Int32Array(this.count).fill(-1)
      : null;
    this.stagedValues = this.activeValues ? new Uint32Array(this.count) : null;
    this.stagedOrdinals = this.activeValues ? new Int32Array(this.count) : null;
    this.activeCount = this.activeValues ? 0 : this.count;
    if (options.activeSlots)
      this.stageActivation(options.activeSlots, new Uint32Array(), true);
    this.shDegree = shDegree;
    this.shCoefficientCount = (shDegree + 1) ** 2;
    this.shFormat = options.shFormat ?? "float32";
    if (this.shFormat !== "float32" && this.shFormat !== "rgb8e8") {
      throw new RangeError("GaussianData shFormat must be float32 or rgb8e8");
    }
    this.means = buffers.means;
    this.scalesOpacity = buffers.scalesOpacity;
    this.rotations = buffers.rotations;
    // Share the existing SH binding with the compact index list. The tail
    // contains one u32 per slot (normal-float bit encoding for float32 SH).
    const sourceSh = buffers.shCoefficients;
    this.validateShAttribute(sourceSh, this.count * this.shCoefficientCount);
    const sourceScalars =
      this.count *
      this.shCoefficientCount *
      (this.shFormat === "rgb8e8" ? 1 : 4);
    const requiredShLength =
      sourceScalars +
      Math.ceil(this.count / sourceSh.itemSize) * sourceSh.itemSize;
    if (this.activeValues && sourceSh.array.length < requiredShLength) {
      const length =
        sourceScalars +
        Math.ceil(this.count / sourceSh.itemSize) * sourceSh.itemSize;
      const values =
        this.shFormat === "rgb8e8"
          ? new Uint32Array(length)
          : new Float32Array(length);
      values.set(sourceSh.array.subarray(0, sourceScalars));
      this.shCoefficients = new StorageBufferAttribute(
        values,
        sourceSh.itemSize,
      );
      this.shCoefficients.name = sourceSh.name;
      this.ownsShBuffer = true;
      if (options.ownsBuffers) sourceSh.dispose();
    } else {
      this.shCoefficients = sourceSh;
      this.ownsShBuffer = false;
    }
    this.ownsBuffers = options.ownsBuffers ?? false;

    this.validateVec4Attribute(this.means, "means", this.count);
    if (this.geometryFormat === "compact") {
      for (const [attribute, width] of [
        [this.scalesOpacity, 2],
        [this.rotations, 1],
      ] as const) {
        if (
          !attribute.isStorageBufferAttribute ||
          !(attribute.array instanceof Uint32Array) ||
          attribute.itemSize !== width ||
          attribute.count < this.count
        )
          throw new TypeError("Invalid compact Gaussian shape attribute");
      }
    } else {
      this.validateVec4Attribute(
        this.scalesOpacity,
        "scalesOpacity",
        this.count,
      );
      this.validateVec4Attribute(this.rotations, "rotations", this.count);
    }
    this.validateShAttribute(
      this.shCoefficients,
      this.count * this.shCoefficientCount,
    );
  }

  /** Prepare the back list incrementally; commit swaps typed arrays in O(1). */
  stageActivation(
    added: Uint32Array,
    removed: Uint32Array,
    commit: boolean,
  ): void {
    if (
      !this.activeValues ||
      !this.activeOrdinals ||
      !this.stagedValues ||
      !this.stagedOrdinals
    )
      throw new Error("GaussianData has no active slot list");
    if (!this.staging && added.length === 0 && removed.length === 0) return;
    for (const slot of added)
      if (slot >= this.count)
        throw new RangeError("Active GPU slot exceeds capacity");
    for (const slot of removed)
      if (slot >= this.count)
        throw new RangeError("Removed GPU slot exceeds capacity");
    if (!this.staging) {
      this.stagedValues.set(this.activeValues.subarray(0, this.activeCount));
      this.stagedOrdinals.set(this.activeOrdinals);
      this.stagedCount = this.activeCount;
      this.firstChanged = Infinity;
      this.lastChanged = -1;
      this.staging = true;
    }
    // The transport sends removals before additions across delta batches.
    for (const slot of removed) {
      const ordinal = this.stagedOrdinals[slot]!;
      if (ordinal < 0) continue;
      const last = this.stagedValues[--this.stagedCount]!;
      this.stagedValues[ordinal] = last;
      this.stagedOrdinals[last] = ordinal;
      this.stagedOrdinals[slot] = -1;
      this.firstChanged = Math.min(this.firstChanged, ordinal);
      this.lastChanged = Math.max(this.lastChanged, ordinal);
    }
    for (const slot of added) {
      if (this.stagedOrdinals[slot]! >= 0) continue;
      const ordinal = this.stagedCount++;
      this.stagedValues[ordinal] = slot;
      this.stagedOrdinals[slot] = ordinal;
      this.firstChanged = Math.min(this.firstChanged, ordinal);
      this.lastChanged = Math.max(this.lastChanged, ordinal);
    }
    if (!commit) return;
    [this.activeValues, this.stagedValues] = [
      this.stagedValues,
      this.activeValues,
    ];
    [this.activeOrdinals, this.stagedOrdinals] = [
      this.stagedOrdinals,
      this.activeOrdinals,
    ];
    this.activeCount = this.stagedCount;
    this.staging = false;
    this.activeVersion++;
    const start = Math.min(this.firstChanged, this.activeCount);
    const end = Math.min(this.lastChanged + 1, this.activeCount);
    const range = { start, count: Math.max(0, end - start) };
    for (const listener of this.activeListeners) listener(range);
  }

  subscribeActiveSlots(listener: (range: ActiveSlotRange) => void): () => void {
    this.activeListeners.add(listener);
    return () => this.activeListeners.delete(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.activeListeners.clear();
    if (this.ownsShBuffer) this.shCoefficients.dispose();
    if (!this.ownsBuffers) return;

    this.means.dispose();
    this.scalesOpacity.dispose();
    this.rotations.dispose();
    if (!this.ownsShBuffer) this.shCoefficients.dispose();
  }

  private validateVec4Attribute(
    attribute: StorageBufferAttribute,
    name: string,
    minimumCount: number,
  ): void {
    if (attribute.isStorageBufferAttribute !== true) {
      throw new TypeError(
        `GaussianData ${name} must be a Three.js StorageBufferAttribute`,
      );
    }
    if (attribute.itemSize !== 4) {
      throw new RangeError(
        `GaussianData ${name} itemSize is ${attribute.itemSize}; vec4 data requires itemSize 4`,
      );
    }
    if (!(attribute.array instanceof Float32Array)) {
      throw new TypeError(`GaussianData ${name} must use Float32Array storage`);
    }
    if (attribute.count < minimumCount) {
      throw new RangeError(
        `GaussianData ${name} has ${attribute.count} items; at least ${minimumCount} are required`,
      );
    }
  }

  private validateShAttribute(
    attribute: StorageBufferAttribute,
    minimumCount: number,
  ): void {
    if (attribute.isStorageBufferAttribute !== true) {
      throw new TypeError(
        "GaussianData shCoefficients must be a Three.js StorageBufferAttribute",
      );
    }
    const itemSize = this.shFormat === "rgb8e8" ? 1 : 4;
    if (attribute.itemSize !== itemSize) {
      throw new RangeError(
        `GaussianData ${this.shFormat} shCoefficients itemSize is ${attribute.itemSize}; expected ${itemSize}`,
      );
    }
    const validArray =
      this.shFormat === "rgb8e8"
        ? attribute.array instanceof Uint32Array
        : attribute.array instanceof Float32Array;
    if (!validArray) {
      throw new TypeError(
        `GaussianData ${this.shFormat} shCoefficients use the wrong typed array`,
      );
    }
    if (attribute.count < minimumCount) {
      throw new RangeError(
        `GaussianData shCoefficients has ${attribute.count} items; at least ${minimumCount} are required`,
      );
    }
  }
}
