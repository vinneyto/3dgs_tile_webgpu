import {
  RADIX_BLOCK_ITEMS,
  RADIX_REDUCE_ITEMS,
  RADIX_SIZE,
  TILE_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";
import { gaussianOpacitySupportWGSL } from "./sparkOpacity";
import { boundaryTileContributionWGSL } from "./tileContribution";

export const prepareDispatchWGSL = /* wgsl */ `
fn prepare_dispatch(
  item_count_state: ptr<storage, array<vec4<u32>>, read>,
  capacity: u32,
  tile_counts: ptr<storage, array<u32>, read>,
  intersection_offsets: ptr<storage, array<u32>, read>,
  state: ptr<storage, array<vec4<u32>>, read_write>,
  radix_block_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  radix_reduce_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  linear_dispatch: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  let item_count = (*item_count_state)[0].x;
  var total = 0u;
  if (item_count > 0u) {
    let last = item_count - 1u;
    let offset = (*intersection_offsets)[last];
    total = offset + min((*tile_counts)[last], 0xffffffffu - offset);
  }
  // Never sort or publish a truncated set.
  let count = select(total, 0u, total > capacity);
  let radix_blocks = (count + ${RADIX_BLOCK_ITEMS - 1}u) / ${RADIX_BLOCK_ITEMS}u;
  let reduce_chunks = (radix_blocks + ${RADIX_REDUCE_ITEMS - 1}u) / ${RADIX_REDUCE_ITEMS}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${RADIX_SIZE}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`;

export const emitIntersectionsWGSL = (() => {
  return /* wgsl */ `
fn emit_intersections(
  rank: u32,
  tiles: vec2<u32>,
  viewport: vec2<f32>,
  boundary_axis: u32,
  capacity: u32,
  sorted_gaussians: ptr<storage, array<vec2<u32>>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  projected_conic: ptr<storage, array<vec4<f32>>, read>,
  projected_color: ptr<storage, array<vec4<f32>>, read>,
  tile_counts: ptr<storage, array<u32>, read>,
  intersection_offsets: ptr<storage, array<u32>, read>,
  visible_state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (rank >= (*visible_state)[0].x) { return 0u; }
  let gaussian_id = (*sorted_gaussians)[rank].y;
  let mean = (*projected_mean)[gaussian_id];
  let conic = (*projected_conic)[gaussian_id];
  let packed_radius = u32(conic.w);
  let radius = vec2<f32>(f32(packed_radius % 2048u), f32(packed_radius / 2048u));
  let center = mean.xy;
  let power_threshold = gaussian_opacity_support(mean.w);
  let max_tile_x = i32(tiles.x) - 1;
  let max_tile_y = i32(tiles.y) - 1;
  var tile_min = vec2<i32>(
    clamp(i32(floor((center.x - radius.x) / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  var tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  if (boundary_axis == 1u) { tile_min.x = 0; tile_max.x = max_tile_x; }
  if (boundary_axis == 2u) { tile_min.y = 0; tile_max.y = max_tile_y; }
  let reserved_count = (*tile_counts)[rank];
  var local_index = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
      if (gaussian_boundary_tile_hit(center, conic.xyz, power_threshold, radius, vec2<i32>(tile_x, tile_y), viewport, boundary_axis)) {
        if (local_index < reserved_count) {
          let destination = (*intersection_offsets)[rank] + local_index;
          if (destination < capacity) {
            let tile_id = u32(tile_y) * tiles.x + u32(tile_x);
            (*records)[destination] = vec2<u32>(tile_id, gaussian_id);
          }
        }
        local_index++;
      }
    }
  }

  // Defensive padding: projection and emission share the same test, but a
  // sentinel keeps every reserved slot initialized if shader optimization
  // ever makes the two evaluations disagree by one ULP.
  let sentinel_tile = tiles.x * tiles.y;
  for (var pad = local_index; pad < reserved_count; pad++) {
    let destination = (*intersection_offsets)[rank] + pad;
    if (destination < capacity) {
      (*records)[destination] = vec2<u32>(sentinel_tile, gaussian_id);
    }
  }
  return 0u;
}
${boundaryTileContributionWGSL()}
${gaussianOpacitySupportWGSL}
`;
})();

/** Separate kernel keeps every stage within the portable eight-storage-binding limit. */
export const prepareIntersectionOutputWGSL = /* wgsl */ `
fn prepare_intersection_output(
  state: ptr<storage, array<vec4<u32>>, read>,
  visible_state: ptr<storage, array<vec4<u32>>, read>,
  emit_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  raster_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  output_state: ptr<storage, array<vec4<u32>>, read_write>,
  tiles: vec2<u32>,
  attempt: u32,
  reset_valid: u32
) -> u32 {
  let overflow = (*state)[0].w;
  let complete = overflow == 0u;
  (*emit_dispatch)[0] = vec4<u32>(select(0u, ((*visible_state)[0].x + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u, complete), 1u, 1u, 0u);
  (*raster_dispatch)[0] = vec4<u32>(select(0u, tiles.x, complete), tiles.y, 1u, 0u);
  var last_version = (*output_state)[0].y;
  if (reset_valid != 0u) { last_version = 0u; }
  (*output_state)[0] = vec4<u32>(attempt, select(last_version, attempt, complete), (*state)[0].y, overflow);
  return 0u;
}
`;
