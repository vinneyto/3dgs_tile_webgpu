import type { StorageBufferAttribute } from "three/webgpu";

export interface GaussianBuffers {
  /** vec4<f32> per Gaussian. xyz is the local-space mean; w is unused. */
  means: StorageBufferAttribute;
  /** vec4<f32> per Gaussian. xyz is positive linear scale; w is opacity in [0, 1]. */
  scalesOpacity: StorageBufferAttribute;
  /** vec4<f32> per Gaussian, normalized quaternion in xyzw order. */
  rotations: StorageBufferAttribute;
  /** vec4<f32> per SH coefficient. xyz is canonical 3DGS RGB; w is unused. */
  shCoefficients: StorageBufferAttribute;
}

export interface GaussianDataOptions {
  count: number;
  /** Canonical real spherical-harmonic degree. Supported values are 0 through 3. */
  shDegree?: 0 | 1 | 2 | 3;
  /** Dispose the supplied Three.js attributes with this object. Defaults to false. */
  ownsBuffers?: boolean;
}

/**
 * Gaussian storage expressed as normal Three.js storage attributes. Parsing and
 * source-format activation deliberately live outside the renderer. The same
 * attributes can be consumed by TSL materials, compute nodes, or geometries.
 */
export class GaussianData {
  readonly count: number;
  readonly shDegree: 0 | 1 | 2 | 3;
  readonly shCoefficientCount: number;
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
    this.means = buffers.means;
    this.scalesOpacity = buffers.scalesOpacity;
    this.rotations = buffers.rotations;
    this.shCoefficients = buffers.shCoefficients;
    this.ownsBuffers = options.ownsBuffers ?? false;

    this.validateAttribute(this.means, "means", this.count);
    this.validateAttribute(this.scalesOpacity, "scalesOpacity", this.count);
    this.validateAttribute(this.rotations, "rotations", this.count);
    this.validateAttribute(
      this.shCoefficients,
      "shCoefficients",
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

  private validateAttribute(
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
}
