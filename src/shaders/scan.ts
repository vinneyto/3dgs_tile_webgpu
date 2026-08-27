import { SCAN_BLOCK_ITEMS, WORKGROUP_SIZE } from "../pipeline/constants";

export const scanBlocksShader = /* wgsl */ `
struct ScanParams {
  length: u32,
}

@group(0) @binding(0) var<storage, read> input_values: array<u32>;
@group(0) @binding(1) var<storage, read_write> output_values: array<u32>;
@group(0) @binding(2) var<storage, read_write> block_sums: array<u32>;
@group(0) @binding(3) var<uniform> params: ScanParams;
var<workgroup> scratch: array<u32, ${SCAN_BLOCK_ITEMS}>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let lane = local_id.x;
  let base = workgroup_id.x * ${SCAN_BLOCK_ITEMS}u;
  let first = base + lane;
  let second = first + ${WORKGROUP_SIZE}u;
  scratch[lane] = select(0u, input_values[first], first < params.length);
  scratch[lane + ${WORKGROUP_SIZE}u] = select(0u, input_values[second], second < params.length);
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${SCAN_BLOCK_ITEMS / 2}u;
  loop {
    if (active_count == 0u) { break; }
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      scratch[right] += scratch[left];
    }
    offset *= 2u;
    active_count /= 2u;
    workgroupBarrier();
  }

  if (lane == 0u) {
    block_sums[workgroup_id.x] = scratch[${SCAN_BLOCK_ITEMS - 1}u];
    scratch[${SCAN_BLOCK_ITEMS - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${SCAN_BLOCK_ITEMS / 2}u;
  loop {
    if (active_count >= ${SCAN_BLOCK_ITEMS}u) { break; }
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      let value = scratch[left];
      scratch[left] = scratch[right];
      scratch[right] += value;
    }
    active_count *= 2u;
    offset /= 2u;
    workgroupBarrier();
  }

  if (first < params.length) { output_values[first] = scratch[lane]; }
  if (second < params.length) { output_values[second] = scratch[lane + ${WORKGROUP_SIZE}u]; }
}
`;

export const addScanOffsetsShader = /* wgsl */ `
struct ScanParams {
  length: u32,
}

@group(0) @binding(0) var<storage, read_write> values: array<u32>;
@group(0) @binding(1) var<storage, read> block_offsets: array<u32>;
@group(0) @binding(2) var<uniform> params: ScanParams;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= params.length) { return; }
  values[index] += block_offsets[index / ${SCAN_BLOCK_ITEMS}u];
}
`;
