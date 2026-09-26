/** CPU-owned source attributes. No GPU buffer or frontend class enters the core. */
export interface GaussianSource {
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly shCoefficientCount: number;
    readonly shFormat: "float32" | "rgb8e8";
    readonly means: {
        readonly array: ArrayLike<number>;
    };
    readonly scalesOpacity: {
        readonly array: ArrayLike<number>;
    };
    readonly rotations: {
        readonly array: ArrayLike<number>;
    };
    readonly shCoefficients: {
        readonly array: ArrayLike<number>;
    };
    dispose(): void;
}
export declare class CpuGaussianSource implements GaussianSource {
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly shCoefficientCount: number;
    readonly shFormat: "float32";
    readonly means: {
        readonly array: Float32Array;
    };
    readonly scalesOpacity: {
        readonly array: Float32Array;
    };
    readonly rotations: {
        readonly array: Float32Array;
    };
    readonly shCoefficients: {
        readonly array: Float32Array;
    };
    constructor(count: number, shDegree: 0 | 1 | 2 | 3, means: Float32Array, scalesOpacity: Float32Array, rotations: Float32Array, shCoefficients: Float32Array);
    dispose(): void;
}
