import { WORKGROUP_SIZE } from "../pipeline/constants";
import { dispatchData } from "./common";

export function tileOffsetShaders(mode: "float32" | "packed16"): {
  clear: string;
  boundaries: string;
  fill: string;
} {
  const keyBinding =
    mode === "float32"
      ? "@group(0) @binding(0) var<storage, read> tile_ids: array<u32>;\nfn tile_at(index: u32) -> u32 { return tile_ids[index]; }"
      : "@group(0) @binding(0) var<storage, read> packed_keys: array<u32>;\nfn tile_at(index: u32) -> u32 { return packed_keys[index] >> 16u; }";

  return {
    clear: /* wgsl */ `
struct OffsetParams { count: u32, }
@group(0) @binding(0) var<storage, read_write> tile_offsets: array<u32>;
@group(0) @binding(1) var<uniform> params: OffsetParams;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if (global_id.x < params.count) { tile_offsets[global_id.x] = 0xffffffffu; }
}`,
    boundaries: /* wgsl */ `
${dispatchData}
${keyBinding}
@group(0) @binding(1) var<storage, read_write> tile_offsets: array<u32>;
@group(0) @binding(2) var<uniform> dispatch_state: DispatchState;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= dispatch_state.count) { return; }
  let tile = tile_at(index);
  if (index == 0u || tile_at(index - 1u) != tile) { tile_offsets[tile] = index; }
}`,
    fill: /* wgsl */ `
${dispatchData}
struct OffsetParams { count: u32, }
@group(0) @binding(0) var<storage, read_write> tile_offsets: array<u32>;
@group(0) @binding(1) var<uniform> dispatch_state: DispatchState;
@group(0) @binding(2) var<uniform> params: OffsetParams;
@compute @workgroup_size(1)
fn main() {
  var running = dispatch_state.count;
  tile_offsets[params.count - 1u] = running;
  var index = params.count - 1u;
  loop {
    if (index == 0u) { break; }
    index--;
    if (tile_offsets[index] == 0xffffffffu) {
      tile_offsets[index] = running;
    } else {
      running = tile_offsets[index];
    }
  }
}`,
  };
}
