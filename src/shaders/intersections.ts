import {
  RADIX_BLOCK_ITEMS,
  TILE_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";
import { dispatchData, frameUniforms } from "./common";

export const prepareDispatchShader = /* wgsl */ `
${dispatchData}

struct PrepareParams {
  gaussian_count: u32,
  intersection_capacity: u32,
}

@group(0) @binding(0) var<storage, read> tile_counts: array<u32>;
@group(0) @binding(1) var<storage, read> intersection_offsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> dispatch: DispatchData;
@group(0) @binding(3) var<uniform> params: PrepareParams;

@compute @workgroup_size(1)
fn main() {
  let last = params.gaussian_count - 1u;
  let total = intersection_offsets[last] + tile_counts[last];
  let count = min(total, params.intersection_capacity);
  let radix_blocks = (count + ${RADIX_BLOCK_ITEMS - 1}u) / ${RADIX_BLOCK_ITEMS}u;
  dispatch.radix = vec4<u32>((radix_blocks + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u, 1u, 1u, count);
  dispatch.linear = vec4<u32>((count + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u, 1u, 1u, count);
  dispatch.state = DispatchState(count, total, radix_blocks, select(0u, 1u, total > params.intersection_capacity));
}
`;

export function emitIntersectionsShader(mode: "float32" | "packed16"): string {
  const outputs =
    mode === "float32"
      ? `
@group(0) @binding(4) var<storage, read_write> tile_ids: array<u32>;
@group(0) @binding(5) var<storage, read_write> depth_keys: array<u32>;
@group(0) @binding(6) var<storage, read_write> gaussian_ids: array<u32>;
@group(0) @binding(7) var<uniform> dispatch_state: DispatchState;
@group(0) @binding(8) var<uniform> frame: FrameUniforms;`
      : `
@group(0) @binding(4) var<storage, read_write> packed_keys: array<u32>;
@group(0) @binding(5) var<storage, read_write> gaussian_ids: array<u32>;
@group(0) @binding(6) var<uniform> dispatch_state: DispatchState;
@group(0) @binding(7) var<uniform> frame: FrameUniforms;`;

  const store =
    mode === "float32"
      ? `tile_ids[destination] = tile_id;
      depth_keys[destination] = bitcast<u32>(mean.z);`
      : `let normalized_depth = clamp((mean.z - frame.viewport.z) / (frame.viewport.w - frame.viewport.z), 0.0, 1.0);
      let depth16 = u32(round(normalized_depth * 65535.0));
      packed_keys[destination] = (tile_id << 16u) | depth16;`;

  return /* wgsl */ `
${frameUniforms}
${dispatchData}

@group(0) @binding(0) var<storage, read> projected_mean: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> projected_conic: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> tile_counts: array<u32>;
@group(0) @binding(3) var<storage, read> intersection_offsets: array<u32>;
${outputs}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gid = global_id.x;
  if (gid >= frame.config.z || tile_counts[gid] == 0u) { return; }
  let mean = projected_mean[gid];
  let radius = projected_conic[gid].w;
  let center = mean.xy;
  let max_tile_x = i32(frame.config.x) - 1;
  let max_tile_y = i32(frame.config.y) - 1;
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
      let destination = intersection_offsets[gid] + local_index;
      local_index++;
      if (destination >= dispatch_state.count) { continue; }
      let tile_id = u32(tile_y) * frame.config.x + u32(tile_x);
      ${store}
      gaussian_ids[destination] = gid;
    }
  }
}
`;
}
