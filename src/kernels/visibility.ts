import {
  RADIX_BLOCK_ITEMS,
  RADIX_REDUCE_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";
import type { DepthSortMode } from "../pipeline/types";

export const prepareVisibleDispatchWGSL = /* wgsl */ `
fn prepare_visible_dispatch(
  gaussian_count: u32,
  visible_flags: ptr<storage, array<u32>, read>,
  visible_offsets: ptr<storage, array<u32>, read>,
  state: ptr<storage, array<vec4<u32>>, read_write>,
  radix_block_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  radix_reduce_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  linear_dispatch: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  var count = 0u;
  if (gaussian_count > 0u) {
    let last = gaussian_count - 1u;
    count = (*visible_offsets)[last] + (*visible_flags)[last];
  }
  let radix_blocks = (count + ${RADIX_BLOCK_ITEMS - 1}u) / ${RADIX_BLOCK_ITEMS}u;
  let reduce_chunks = (radix_blocks + ${RADIX_REDUCE_ITEMS - 1}u) / ${RADIX_REDUCE_ITEMS}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${RADIX_SIZE}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`;

export function compactVisibleWGSL(mode: DepthSortMode): string {
  const depthKey =
    mode === "float32"
      ? "bitcast<u32>(depth)"
      : `u32(round(clamp(
          (depth - viewport.z) / (viewport.w - viewport.z),
          0.0,
          1.0
        ) * 65535.0))`;
  return /* wgsl */ `
fn compact_visible_${mode}(
  gid: u32,
  gaussian_count: u32,
  viewport: vec4<f32>,
  visible_flags: ptr<storage, array<u32>, read>,
  visible_offsets: ptr<storage, array<u32>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (gid >= gaussian_count || (*visible_flags)[gid] == 0u) { return 0u; }
  let depth = (*projected_mean)[gid].z;
  (*records)[(*visible_offsets)[gid]] = vec2<u32>(${depthKey}, gid);
  return 0u;
}
`;
}

export const gatherDepthOrderedTileCountsWGSL = /* wgsl */ `
fn gather_depth_ordered_tile_counts(
  rank: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  depth_sorted_gaussians: ptr<storage, array<vec2<u32>>, read>,
  tile_counts: ptr<storage, array<u32>, read>,
  ordered_tile_counts: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (rank >= (*state)[0].x) { return 0u; }
  let gaussian_id = (*depth_sorted_gaussians)[rank].y;
  (*ordered_tile_counts)[rank] = (*tile_counts)[gaussian_id];
  return 0u;
}
`;
