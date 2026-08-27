import { SCAN_BLOCK_ITEMS, WORKGROUP_SIZE } from "../pipeline/constants";

interface ScanBlocksWGSLConfig {
  functionName: string;
  inputType: "u32" | "vec4<f32>";
  readValue(index: string): string;
}

function buildScanBlocksWGSL(config: ScanBlocksWGSLConfig): string {
  return /* wgsl */ `
fn ${config.functionName}(
  lane: u32,
  group_id: u32,
  length: u32,
  input_values: ptr<storage, array<${config.inputType}>, read>,
  output_values: ptr<storage, array<u32>, read_write>,
  block_sums: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${SCAN_BLOCK_ITEMS}>>
) -> u32 {
  let base = group_id * ${SCAN_BLOCK_ITEMS}u;
  let first = base + lane;
  let second = first + ${WORKGROUP_SIZE}u;
  (*scratch)[lane] = ${config.readValue("first")};
  (*scratch)[lane + ${WORKGROUP_SIZE}u] = ${config.readValue("second")};
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${SCAN_BLOCK_ITEMS / 2}u;
  for (var step = 0u; step < 9u; step++) {
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      (*scratch)[right] += (*scratch)[left];
    }
    offset *= 2u;
    active_count /= 2u;
    workgroupBarrier();
  }

  if (lane == 0u) {
    (*block_sums)[group_id] = (*scratch)[${SCAN_BLOCK_ITEMS - 1}u];
    (*scratch)[${SCAN_BLOCK_ITEMS - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${SCAN_BLOCK_ITEMS / 2}u;
  for (var step = 0u; step < 9u; step++) {
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      let value = (*scratch)[left];
      (*scratch)[left] = (*scratch)[right];
      (*scratch)[right] += value;
    }
    active_count *= 2u;
    offset /= 2u;
    workgroupBarrier();
  }

  if (first < length) { (*output_values)[first] = (*scratch)[lane]; }
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${WORKGROUP_SIZE}u]; }
  return 0u;
}
`;
}

export const scanBlocksWGSL = buildScanBlocksWGSL({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (index) =>
    `select(0u, (*input_values)[${index}], ${index} < length)`,
});

export const scanVisibilityBlocksWGSL = buildScanBlocksWGSL({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (index) =>
    `select(0u, 1u, ${index} < length && (*input_values)[${index}].w > 0.0)`,
});

export const addScanOffsetsWGSL = /* wgsl */ `
fn add_scan_offsets(
  index: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    (*values)[index] += (*block_offsets)[index / ${SCAN_BLOCK_ITEMS}u];
  }
  return 0u;
}
`;
