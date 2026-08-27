import {
  RADIX_BLOCK_ITEMS,
  TILE_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";
import type { DepthSortMode } from "../pipeline/types";

export const prepareDispatchWGSL = /* wgsl */ `
fn prepare_dispatch(
  gaussian_count: u32,
  capacity: u32,
  tile_counts: ptr<storage, array<u32>, read>,
  intersection_offsets: ptr<storage, array<u32>, read>,
  state: ptr<storage, array<vec4<u32>>, read_write>,
  radix_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  linear_dispatch: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  let last = gaussian_count - 1u;
  let total = (*intersection_offsets)[last] + (*tile_counts)[last];
  let count = min(total, capacity);
  let radix_blocks = (count + ${RADIX_BLOCK_ITEMS - 1}u) / ${RADIX_BLOCK_ITEMS}u;
  (*radix_dispatch)[0] = vec4<u32>(
    (radix_blocks + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u,
    1u, 1u, 0u
  );
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`;

export function emitIntersectionsWGSL(mode: DepthSortMode): string {
  const recordType = mode === "float32" ? "vec4<u32>" : "vec2<u32>";
  const store =
    mode === "float32"
      ? "(*records)[destination] = vec4<u32>(tile_id, bitcast<u32>(mean.z), gid, 0u);"
      : `
      let normalized_depth = clamp((mean.z - viewport.z) / (viewport.w - viewport.z), 0.0, 1.0);
      let depth16 = u32(round(normalized_depth * 65535.0));
      (*records)[destination] = vec2<u32>((tile_id << 16u) | depth16, gid);`;
  return /* wgsl */ `
fn emit_intersections_${mode}(
  gid: u32,
  gaussian_count: u32,
  tiles: vec2<u32>,
  viewport: vec4<f32>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  projected_conic: ptr<storage, array<vec4<f32>>, read>,
  tile_counts: ptr<storage, array<u32>, read>,
  intersection_offsets: ptr<storage, array<u32>, read>,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<${recordType}>, read_write>
) -> u32 {
  if (gid >= gaussian_count || (*tile_counts)[gid] == 0u) { return 0u; }
  let mean = (*projected_mean)[gid];
  let radius = (*projected_conic)[gid].w;
  let center = mean.xy;
  let max_tile_x = i32(tiles.x) - 1;
  let max_tile_y = i32(tiles.y) - 1;
  let tile_min = vec2<i32>(
    clamp(i32(floor((center.x - radius) / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius) / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius) / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius) / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  var local_index = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
      let destination = (*intersection_offsets)[gid] + local_index;
      local_index++;
      if (destination >= (*state)[0].x) { continue; }
      let tile_id = u32(tile_y) * tiles.x + u32(tile_x);
      ${store}
    }
  }
  return 0u;
}
`;
}
