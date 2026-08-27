import { RADIX_BLOCK_ITEMS, RADIX_SIZE } from "../pipeline/constants";
import type { DepthSortMode } from "../pipeline/types";

export const scanBlockHistogramsWGSL = /* wgsl */ `
fn scan_block_histograms(
  digit: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  block_prefixes: ptr<storage, array<u32>, read_write>,
  digit_totals: ptr<storage, array<u32>, read_write>
) -> u32 {
  var running = 0u;
  for (var block_index = 0u; block_index < (*state)[0].z; block_index++) {
    let address = block_index * ${RADIX_SIZE}u + digit;
    (*block_prefixes)[address] = running;
    running += (*block_histograms)[address];
  }
  (*digit_totals)[digit] = running;
  return 0u;
}
`;

export const scanDigitTotalsWGSL = /* wgsl */ `
fn scan_digit_totals(
  digit_totals: ptr<storage, array<u32>, read>,
  digit_offsets: ptr<storage, array<u32>, read_write>
) -> u32 {
  var running = 0u;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    (*digit_offsets)[digit] = running;
    running += (*digit_totals)[digit];
  }
  return 0u;
}
`;

function recordType(mode: DepthSortMode): string {
  return mode === "float32" ? "vec4<u32>" : "vec2<u32>";
}

function selectedKey(mode: DepthSortMode, keyKind: number): string {
  if (mode === "packed16") return "(*records)[position].x";
  return keyKind === 0 ? "(*records)[position].y" : "(*records)[position].x";
}

export function radixHistogramWGSL(
  mode: DepthSortMode,
  shift: number,
  keyKind: number,
): string {
  return /* wgsl */ `
fn radix_histogram_${mode}_${shift}_${keyKind}(
  block_index: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<${recordType(mode)}>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>
) -> u32 {
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  if (block_start >= (*state)[0].x) { return 0u; }
  var histogram: array<u32, ${RADIX_SIZE}>;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    histogram[digit] = 0u;
  }
  let block_end = min(block_start + ${RADIX_BLOCK_ITEMS}u, (*state)[0].x);
  for (var position = block_start; position < block_end; position++) {
    let key = ${selectedKey(mode, keyKind)};
    let digit = (key >> ${shift}u) & ${RADIX_SIZE - 1}u;
    histogram[digit]++;
  }
  let output_start = block_index * ${RADIX_SIZE}u;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    (*block_histograms)[output_start + digit] = histogram[digit];
  }
  return 0u;
}
`;
}

export function radixScatterWGSL(
  mode: DepthSortMode,
  shift: number,
  keyKind: number,
): string {
  return /* wgsl */ `
fn radix_scatter_${mode}_${shift}_${keyKind}(
  block_index: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<${recordType(mode)}>, read>,
  records_out: ptr<storage, array<${recordType(mode)}>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  digit_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  if (block_start >= (*state)[0].x) { return 0u; }
  var local_counts: array<u32, ${RADIX_SIZE}>;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    local_counts[digit] = 0u;
  }
  let block_end = min(block_start + ${RADIX_BLOCK_ITEMS}u, (*state)[0].x);
  let prefix_start = block_index * ${RADIX_SIZE}u;
  for (var position = block_start; position < block_end; position++) {
    let key = ${selectedKey(mode, keyKind).replaceAll("records", "records_in")};
    let digit = (key >> ${shift}u) & ${RADIX_SIZE - 1}u;
    let destination = (*digit_offsets)[digit]
      + (*block_prefixes)[prefix_start + digit]
      + local_counts[digit];
    local_counts[digit]++;
    (*records_out)[destination] = (*records_in)[position];
  }
  return 0u;
}
`;
}
