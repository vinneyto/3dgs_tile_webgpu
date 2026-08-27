export interface GaussianBuffers {
  /** vec4<f32> per Gaussian. xyz is the local-space mean; w is unused. */
  means: GPUBuffer;
  /** vec4<f32> per Gaussian. xyz is positive linear scale; w is opacity in [0, 1]. */
  scalesOpacity: GPUBuffer;
  /** vec4<f32> per Gaussian, normalized quaternion in xyzw order. */
  rotations: GPUBuffer;
  /** vec4<f32> per SH coefficient. xyz is canonical 3DGS RGB; w is unused. */
  shCoefficients: GPUBuffer;
}

export interface GaussianDataOptions {
  count: number;
  /** Canonical real spherical-harmonic degree. Supported values are 0 through 3. */
  shDegree?: 0 | 1 | 2 | 3;
  /** Destroy the supplied buffers when dispose() is called. Defaults to false. */
  ownsBuffers?: boolean;
}

const FLOATS_PER_VEC4 = 4;
const BYTES_PER_FLOAT = 4;
const BYTES_PER_VEC4 = FLOATS_PER_VEC4 * BYTES_PER_FLOAT;

/**
 * GPU-native Gaussian storage. Parsing and activation of PLY fields deliberately
 * live outside the renderer; this class only describes already uploaded buffers.
 */
export class GaussianData {
  readonly count: number;
  readonly shDegree: 0 | 1 | 2 | 3;
  readonly shCoefficientCount: number;
  readonly means: GPUBuffer;
  readonly scalesOpacity: GPUBuffer;
  readonly rotations: GPUBuffer;
  readonly shCoefficients: GPUBuffer;
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

    this.validateBuffer(this.means, "means", this.count * BYTES_PER_VEC4);
    this.validateBuffer(
      this.scalesOpacity,
      "scalesOpacity",
      this.count * BYTES_PER_VEC4,
    );
    this.validateBuffer(
      this.rotations,
      "rotations",
      this.count * BYTES_PER_VEC4,
    );
    this.validateBuffer(
      this.shCoefficients,
      "shCoefficients",
      this.count * this.shCoefficientCount * BYTES_PER_VEC4,
    );
  }

  private validateBuffer(
    buffer: GPUBuffer,
    name: string,
    minimumSize: number,
  ): void {
    if ((buffer.usage & GPUBufferUsage.STORAGE) === 0) {
      throw new TypeError(
        `GaussianData ${name} buffer must include GPUBufferUsage.STORAGE`,
      );
    }
    if (buffer.size < minimumSize) {
      throw new RangeError(
        `GaussianData ${name} buffer is ${buffer.size} bytes; at least ${minimumSize} bytes are required`,
      );
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (!this.ownsBuffers) return;

    this.means.destroy();
    this.scalesOpacity.destroy();
    this.rotations.destroy();
    this.shCoefficients.destroy();
  }
}
