import { WORKGROUP_SIZE } from "../pipeline/constants";

export const countRasterChunksWGSL = /* wgsl */ `
fn count_raster_chunks(
  tile: u32,
  tile_count: u32,
  chunk_size: u32,
  sample_limit: u32,
  tile_offsets: ptr<storage, array<u32>, read>,
  chunk_counts: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (tile >= tile_count) { return 0u; }
  let source_count = (*tile_offsets)[tile + 1u] - (*tile_offsets)[tile];
  let raster_count = select(
    source_count,
    min(source_count, sample_limit),
    sample_limit > 0u
  );
  (*chunk_counts)[tile] = select(
    0u,
    (raster_count + chunk_size - 1u) / chunk_size,
    raster_count > chunk_size
  );
  return 0u;
}
`;

export const prepareRasterChunkDispatchWGSL = /* wgsl */ `
fn prepare_raster_chunk_dispatch(
  tile_count: u32,
  task_capacity: u32,
  chunk_counts: ptr<storage, array<u32>, read>,
  chunk_offsets: ptr<storage, array<u32>, read>,
  dispatch: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  var count = 0u;
  if (tile_count > 0u) {
    let last = tile_count - 1u;
    count = (*chunk_offsets)[last] + (*chunk_counts)[last];
  }
  count = min(count, task_capacity);
  (*dispatch)[0] = vec4<u32>(count, 1u, 1u, 0u);
  return 0u;
}
`;

export const emitRasterChunkTasksWGSL = /* wgsl */ `
fn emit_raster_chunk_tasks(
  tile: u32,
  tile_count: u32,
  task_capacity: u32,
  chunk_counts: ptr<storage, array<u32>, read>,
  chunk_offsets: ptr<storage, array<u32>, read>,
  tasks: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (tile >= tile_count) { return 0u; }
  let count = (*chunk_counts)[tile];
  let destination = (*chunk_offsets)[tile];
  for (var chunk = 0u; chunk < count; chunk++) {
    if (destination + chunk < task_capacity) {
      (*tasks)[destination + chunk] = vec2<u32>(tile, chunk);
    }
  }
  return 0u;
}
`;

/**
 * Every chunked tile has more than chunkSize samples, so ceil(K / chunkSize)
 * is strictly below 2K / chunkSize. This conservative bound avoids reserving
 * one task per screen tile while keeping the indirect task buffer fixed-size.
 */
export function maxRasterChunkTasks(
  intersectionCapacity: number,
  chunkSize: number,
): number {
  return Math.max(1, Math.ceil((2 * intersectionCapacity) / chunkSize));
}

export function validateRasterChunkSize(
  chunkSize: number | null,
  intersectionCapacity: number,
): void {
  if (chunkSize === null) return;
  if (
    !Number.isInteger(chunkSize) ||
    chunkSize < WORKGROUP_SIZE ||
    chunkSize % WORKGROUP_SIZE !== 0
  ) {
    throw new RangeError(
      `rasterChunkSize must be a multiple of ${WORKGROUP_SIZE} and at least ${WORKGROUP_SIZE}`,
    );
  }
  if (maxRasterChunkTasks(intersectionCapacity, chunkSize) > 65_535) {
    throw new RangeError(
      "rasterChunkSize creates more than 65,535 worst-case chunk tasks",
    );
  }
}
