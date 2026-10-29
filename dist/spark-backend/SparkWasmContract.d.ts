/** Exact JS result layouts exported by the pinned, unmodified Spark spark-rs module. */
export interface SparkExtSplats {
    numSplats: number;
    maxShDegree: 0 | 1 | 2 | 3;
    ext0: Uint32Array;
    ext1: Uint32Array;
    sh1?: Uint32Array;
    sh2?: Uint32Array;
    sh3a?: Uint32Array;
    sh3b?: Uint32Array;
    lodTree?: Uint32Array;
}
export interface SparkLodTree {
    lodId: number;
}
export interface SparkTraversal {
    instanceIndices: {
        lodId: number;
        numSplats: number;
        indices: Uint32Array;
    }[];
    chunks: [number, number][];
    pixelLimit?: number;
}
export interface SparkBackendOptions {
    /** Active draw budget; all geometry remains resident. Default: device-safe capacity. */
    maxActiveSplats?: number;
    /** Projected LOD feature size in physical pixels. Default: 1. */
    pixelLimit?: number;
}
export declare const SPARK_UPSTREAM_COMMIT = "f5368253780bed4d863c96b1fdea9dd3d614d131";
