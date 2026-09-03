import type { StorageBufferAttribute } from "three/webgpu";

import type { GaussianShFormat } from "./GaussianSh";

export interface GaussianBuffers {
  /** vec4<f32> per Gaussian. xyz is the local-space mean; GaussianStore writes objectId to w. */
  means: StorageBufferAttribute;
  /** vec4<f32> per Gaussian. xyz is positive linear scale; w is opacity in [0, 1]. */
  scalesOpacity: StorageBufferAttribute;
  /** vec4<f32> per Gaussian, normalized quaternion in xyzw order. */
  rotations: StorageBufferAttribute;
  /** SH coefficients in the representation selected by GaussianDataOptions.shFormat. */
  shCoefficients: StorageBufferAttribute;
}

export interface GaussianDataOptions {
  count: number;
  /** Canonical real spherical-harmonic degree. Supported values are 0 through 3. */
  shDegree?: 0 | 1 | 2 | 3;
  /** float32 uses vec4<f32>; rgb8e8 uses one packed u32 per RGB coefficient. Defaults to float32. */
  shFormat?: GaussianShFormat;
  /** Dispose the supplied Three.js attributes with this object. Defaults to false. */
  ownsBuffers?: boolean;
}

/**
 * Gaussian storage expressed as normal Three.js storage attributes. Parsing and
 * source-format activation deliberately live outside the renderer. The same
 * attributes can be consumed by node materials, wgslFn compute nodes, or geometries.
 */
export class GaussianData {
  readonly count: number;
  readonly shDegree: 0 | 1 | 2 | 3;
  readonly shCoefficientCount: number;
  readonly shFormat: GaussianShFormat;
  readonly means: StorageBufferAttribute;
  readonly scalesOpacity: StorageBufferAttribute;
  readonly rotations: StorageBufferAttribute;
  readonly shCoefficients: StorageBufferAttribute;

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

    this.count = options.count;
    this.shDegree = shDegree;
    this.shCoefficientCount = (shDegree + 1) ** 2;
    this.shFormat = options.shFormat ?? "float32";
    if (this.shFormat !== "float32" && this.shFormat !== "rgb8e8") {
      throw new RangeError("GaussianData shFormat must be float32 or rgb8e8");
    }
    this.means = buffers.means;
    this.scalesOpacity = buffers.scalesOpacity;
    this.rotations = buffers.rotations;
    this.shCoefficients = buffers.shCoefficients;
    this.ownsBuffers = options.ownsBuffers ?? false;

    this.validateVec4Attribute(this.means, "means", this.count);
    this.validateVec4Attribute(this.scalesOpacity, "scalesOpacity", this.count);
    this.validateVec4Attribute(this.rotations, "rotations", this.count);
    this.validateShAttribute(
      this.shCoefficients,
      this.count * this.shCoefficientCount,
    );
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (!this.ownsBuffers) return;

    this.means.dispose();
    this.scalesOpacity.dispose();
    this.rotations.dispose();
    this.shCoefficients.dispose();
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
