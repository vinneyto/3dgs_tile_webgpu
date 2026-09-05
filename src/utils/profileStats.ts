import type {
  GaussianTileCapStats,
  GaussianTileLoadStats,
} from "../pipeline/types";

const RASTER_BATCH_SIZE = 256;

export const PROFILE_TILE_CAPS = [2_048, 4_096, 8_192] as const;

export function summarizeTileLoads(
  offsets: Uint32Array,
  batchSize = RASTER_BATCH_SIZE,
  rasterGroups = 1,
): GaussianTileLoadStats {
  const tileCount = Math.max(0, offsets.length - 1);
  if (tileCount === 0) {
    return {
      max: 0,
      mean: 0,
      median: 0,
      p95: 0,
      p99: 0,
      tilesOver256: 0,
      tilesOver512: 0,
      tilesOver1024: 0,
      tilesOver2048: 0,
      totalBatches: 0,
      maxBatches: 0,
    };
  }

  const loads = new Uint32Array(tileCount);
  let total = 0;
  let max = 0;
  let tilesOver256 = 0;
  let tilesOver512 = 0;
  let tilesOver1024 = 0;
  let tilesOver2048 = 0;
  let totalBatches = 0;
  let maxBatches = 0;
  for (let tile = 0; tile < tileCount; tile++) {
    const load = Math.max(0, offsets[tile + 1]! - offsets[tile]!);
    loads[tile] = load;
    total += load;
    max = Math.max(max, load);
    if (load > 256) tilesOver256++;
    if (load > 512) tilesOver512++;
    if (load > 1_024) tilesOver1024++;
    if (load > 2_048) tilesOver2048++;
    const batches = Math.ceil(load / batchSize) * rasterGroups;
    totalBatches += batches;
    maxBatches = Math.max(maxBatches, batches);
  }
  loads.sort();

  return {
    max,
    mean: total / tileCount,
    median: median(loads),
    p95: percentile(loads, 0.95),
    p99: percentile(loads, 0.99),
    tilesOver256,
    tilesOver512,
    tilesOver1024,
    tilesOver2048,
    totalBatches,
    maxBatches,
  };
}

export function estimateTileCap(
  offsets: Uint32Array,
  cap: number,
  batchSize = RASTER_BATCH_SIZE,
  rasterGroups = 1,
): GaussianTileCapStats {
  if (!Number.isInteger(cap) || cap <= 0) {
    throw new RangeError("tile cap must be a positive integer");
  }
  const tileCount = Math.max(0, offsets.length - 1);
  let rasterizedIntersections = 0;
  let droppedIntersections = 0;
  let affectedTiles = 0;
  let totalBatches = 0;
  let maxBatches = 0;
  for (let tile = 0; tile < tileCount; tile++) {
    const load = Math.max(0, offsets[tile + 1]! - offsets[tile]!);
    const rasterized = Math.min(load, cap);
    const dropped = load - rasterized;
    rasterizedIntersections += rasterized;
    droppedIntersections += dropped;
    if (dropped > 0) affectedTiles++;
    const batches = Math.ceil(rasterized / batchSize) * rasterGroups;
    totalBatches += batches;
    maxBatches = Math.max(maxBatches, batches);
  }
  const emitted = rasterizedIntersections + droppedIntersections;
  return {
    cap,
    rasterizedIntersections,
    droppedIntersections,
    droppedFraction: emitted === 0 ? 0 : droppedIntersections / emitted,
    affectedTiles,
    totalBatches,
    maxBatches,
  };
}

function median(values: Uint32Array): number {
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 !== 0) return values[middle]!;
  return (values[middle - 1]! + values[middle]!) * 0.5;
}

function percentile(values: Uint32Array, fraction: number): number {
  const index = Math.max(0, Math.ceil(values.length * fraction) - 1);
  return values[index]!;
}
