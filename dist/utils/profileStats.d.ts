import type { GaussianTileCapStats, GaussianTileLoadStats } from "../pipeline/types";
export declare const PROFILE_TILE_CAPS: readonly [2048, 4096, 8192];
export declare function summarizeTileLoads(offsets: Uint32Array, batchSize?: number): GaussianTileLoadStats;
export declare function estimateTileCap(offsets: Uint32Array, cap: number, batchSize?: number): GaussianTileCapStats;
