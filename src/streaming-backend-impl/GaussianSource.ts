/** CPU-owned source attributes. No GPU buffer or frontend class enters the core. */
export interface GaussianSource {
  readonly count: number;
  readonly shDegree: 0 | 1 | 2 | 3;
  readonly shCoefficientCount: number;
  readonly shFormat: "float32" | "rgb8e8";
  readonly means: { readonly array: ArrayLike<number> };
  readonly scalesOpacity: { readonly array: ArrayLike<number> };
  readonly rotations: { readonly array: ArrayLike<number> };
  readonly shCoefficients: { readonly array: ArrayLike<number> };
  dispose(): void;
}

export class CpuGaussianSource implements GaussianSource {
  readonly shCoefficientCount: number;
  readonly shFormat = "float32" as const;
  readonly means: { readonly array: Float32Array };
  readonly scalesOpacity: { readonly array: Float32Array };
  readonly rotations: { readonly array: Float32Array };
  readonly shCoefficients: { readonly array: Float32Array };

  constructor(
    readonly count: number,
    readonly shDegree: 0 | 1 | 2 | 3,
    means: Float32Array,
    scalesOpacity: Float32Array,
    rotations: Float32Array,
    shCoefficients: Float32Array,
  ) {
    this.shCoefficientCount = (shDegree + 1) ** 2;
    this.means = { array: means };
    this.scalesOpacity = { array: scalesOpacity };
    this.rotations = { array: rotations };
    this.shCoefficients = { array: shCoefficients };
  }

  dispose(): void {
    // Typed arrays are released when the cloud entry is no longer referenced.
  }
}
