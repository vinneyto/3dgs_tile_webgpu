import type { GaussianTileLoadStats } from "../pipeline/types";

export function summarizeTileLoads(
  offsets: Uint32Array,
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
    };
  }

  const loads = new Uint32Array(tileCount);
  let total = 0;
  let max = 0;
  let tilesOver256 = 0;
  let tilesOver512 = 0;
  let tilesOver1024 = 0;
  let tilesOver2048 = 0;
  for (let tile = 0; tile < tileCount; tile++) {
    const load = Math.max(0, offsets[tile + 1]! - offsets[tile]!);
    loads[tile] = load;
    total += load;
    max = Math.max(max, load);
    if (load > 256) tilesOver256++;
    if (load > 512) tilesOver512++;
    if (load > 1_024) tilesOver1024++;
    if (load > 2_048) tilesOver2048++;
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
