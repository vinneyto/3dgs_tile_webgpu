export interface MipmapSource {
    means: Float32Array;
    scales: Float32Array;
    rotations: Float32Array;
    sh: Float32Array | Uint32Array;
    count: number;
    coefficients: number;
}
export interface MipmapTree {
    /** Children are -1 for terminal groups of original Gaussians. */
    left: Int32Array;
    right: Int32Array;
    offsets: Uint32Array;
    counts: Uint32Array;
    indices: Uint32Array;
    /** xyz center, w conservative spatial refinement radius. */
    spheres: Float32Array;
    bounds: Float32Array;
    means: Float32Array;
    scales: Float32Array;
    rotations: Float32Array;
    sh: Uint32Array;
}
/** Moment-matched binary spatial hierarchy. Originals remain unchanged. */
export declare function buildMipmap(source: MipmapSource, leafSize?: number): MipmapTree;
/** Symmetric Jacobi eigensolver; eigenvectors become the Gaussian rotation. */
export declare function diagonalize(covariance: number[]): {
    scales: number[];
    rotation: number[];
};
