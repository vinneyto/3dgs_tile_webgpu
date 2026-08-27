import {
  RADIX_BLOCK_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";
import { dispatchData } from "./common";

export const scanBlockHistogramsShader = /* wgsl */ `
${dispatchData}
@group(0) @binding(0) var<storage, read> block_histograms: array<u32>;
@group(0) @binding(1) var<storage, read_write> block_prefixes: array<u32>;
@group(0) @binding(2) var<storage, read_write> digit_totals: array<u32>;
@group(0) @binding(3) var<uniform> dispatch_state: DispatchState;

@compute @workgroup_size(${RADIX_SIZE})
fn main(@builtin(local_invocation_id) local_id: vec3<u32>) {
  let digit = local_id.x;
  var running = 0u;
  for (var block_index = 0u; block_index < dispatch_state.radix_blocks; block_index++) {
    let address = block_index * ${RADIX_SIZE}u + digit;
    block_prefixes[address] = running;
    running += block_histograms[address];
  }
  digit_totals[digit] = running;
}
`;

export const scanDigitTotalsShader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> digit_totals: array<u32>;
@group(0) @binding(1) var<storage, read_write> digit_offsets: array<u32>;

@compute @workgroup_size(1)
fn main() {
  var running = 0u;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    digit_offsets[digit] = running;
    running += digit_totals[digit];
  }
}
`;

export function radixHistogramShader(mode: "float32" | "packed16"): string {
  const inputs =
    mode === "float32"
      ? `
@group(0) @binding(0) var<storage, read> tile_ids: array<u32>;
@group(0) @binding(1) var<storage, read> depth_keys: array<u32>;
@group(0) @binding(2) var<storage, read_write> block_histograms: array<u32>;
@group(0) @binding(3) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return select(depth_keys[index], tile_ids[index], KEY_KIND == 1u); }`
      : `
@group(0) @binding(0) var<storage, read> packed_keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> block_histograms: array<u32>;
@group(0) @binding(2) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return packed_keys[index]; }`;

  return /* wgsl */ `
override SHIFT: u32;
override KEY_KIND: u32 = 0u;
${dispatchData}
${inputs}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let block_index = global_id.x;
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  if (block_start >= dispatch_state.count) { return; }
  var histogram: array<u32, ${RADIX_SIZE}>;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) { histogram[digit] = 0u; }
  let block_end = min(block_start + ${RADIX_BLOCK_ITEMS}u, dispatch_state.count);
  for (var position = block_start; position < block_end; position++) {
    let digit = (selected_key(position) >> SHIFT) & ${RADIX_SIZE - 1}u;
    histogram[digit]++;
  }
  let output_start = block_index * ${RADIX_SIZE}u;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    block_histograms[output_start + digit] = histogram[digit];
  }
}
`;
}

export function radixScatterShader(mode: "float32" | "packed16"): string {
  const bindings =
    mode === "float32"
      ? `
@group(0) @binding(0) var<storage, read> tile_ids_in: array<u32>;
@group(0) @binding(1) var<storage, read> depth_keys_in: array<u32>;
@group(0) @binding(2) var<storage, read> gaussian_ids_in: array<u32>;
@group(0) @binding(3) var<storage, read> block_prefixes: array<u32>;
@group(0) @binding(4) var<storage, read> digit_offsets: array<u32>;
@group(0) @binding(5) var<storage, read_write> tile_ids_out: array<u32>;
@group(0) @binding(6) var<storage, read_write> depth_keys_out: array<u32>;
@group(0) @binding(7) var<storage, read_write> gaussian_ids_out: array<u32>;
@group(0) @binding(8) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return select(depth_keys_in[index], tile_ids_in[index], KEY_KIND == 1u); }
fn move_record(source: u32, destination: u32) {
  tile_ids_out[destination] = tile_ids_in[source];
  depth_keys_out[destination] = depth_keys_in[source];
  gaussian_ids_out[destination] = gaussian_ids_in[source];
}`
      : `
@group(0) @binding(0) var<storage, read> packed_keys_in: array<u32>;
@group(0) @binding(1) var<storage, read> gaussian_ids_in: array<u32>;
@group(0) @binding(2) var<storage, read> block_prefixes: array<u32>;
@group(0) @binding(3) var<storage, read> digit_offsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> packed_keys_out: array<u32>;
@group(0) @binding(5) var<storage, read_write> gaussian_ids_out: array<u32>;
@group(0) @binding(6) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return packed_keys_in[index]; }
fn move_record(source: u32, destination: u32) {
  packed_keys_out[destination] = packed_keys_in[source];
  gaussian_ids_out[destination] = gaussian_ids_in[source];
}`;

  return /* wgsl */ `
override SHIFT: u32;
override KEY_KIND: u32 = 0u;
${dispatchData}
${bindings}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let block_index = global_id.x;
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  if (block_start >= dispatch_state.count) { return; }
  var local_counts: array<u32, ${RADIX_SIZE}>;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) { local_counts[digit] = 0u; }
  let block_end = min(block_start + ${RADIX_BLOCK_ITEMS}u, dispatch_state.count);
  let prefix_start = block_index * ${RADIX_SIZE}u;
  for (var position = block_start; position < block_end; position++) {
    let digit = (selected_key(position) >> SHIFT) & ${RADIX_SIZE - 1}u;
    let destination = digit_offsets[digit] + block_prefixes[prefix_start + digit] + local_counts[digit];
    local_counts[digit]++;
    move_record(position, destination);
  }
}
`;
}
