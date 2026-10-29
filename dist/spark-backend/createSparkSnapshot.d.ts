import type { SparkExtSplats } from "./SparkWasmContract";
import type { MipmapSnapshot } from "../streaming-backend/MipmapSnapshot";
export declare function sparkBounds(data: SparkExtSplats): Float32Array;
/** Bounded camera-independent cut; ancestor bounds enclose every descendant. */
export declare function createSparkSnapshot(data: SparkExtSplats, allBounds: Float32Array, maxLeaves: number): MipmapSnapshot | null;
