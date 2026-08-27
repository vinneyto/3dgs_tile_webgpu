import {
  RADIX_BLOCK_ITEMS,
  RADIX_SCAN_CHUNK_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";
import type { DepthSortMode } from "../pipeline/types";

export const scanRadixHistogramChunksWGSL = /* wgsl */ `
fn scan_radix_histogram_chunks(
  lane: u32,
  group_id: vec3<u32>,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  block_prefixes: ptr<storage, array<u32>, read_write>,
  chunk_sums: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${RADIX_SCAN_CHUNK_ITEMS}>, read_write>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${RADIX_SCAN_CHUNK_ITEMS}u;
  let first = chunk_start + lane;
  let second = first + ${WORKGROUP_SIZE}u;

  (*scratch)[lane] = 0u;
  (*scratch)[lane + ${WORKGROUP_SIZE}u] = 0u;
  if (first < block_count) {
    (*scratch)[lane] = (*block_histograms)[first * ${RADIX_SIZE}u + digit];
  }
  if (second < block_count) {
    (*scratch)[lane + ${WORKGROUP_SIZE}u] =
      (*block_histograms)[second * ${RADIX_SIZE}u + digit];
  }
  workgroupBarrier();

  var offset = 1u;
  for (var active = ${RADIX_SCAN_CHUNK_ITEMS >> 1}u; active > 0u; active >>= 1u) {
    if (lane < active) {
      let right = offset * (2u * lane + 2u) - 1u;
      let left = right - offset;
      (*scratch)[right] += (*scratch)[left];
    }
    offset <<= 1u;
    workgroupBarrier();
  }

  if (lane == 0u) {
    (*chunk_sums)[digit * chunk_stride + chunk] =
      (*scratch)[${RADIX_SCAN_CHUNK_ITEMS - 1}u];
    (*scratch)[${RADIX_SCAN_CHUNK_ITEMS - 1}u] = 0u;
  }
  workgroupBarrier();

  for (var active = 1u; active < ${RADIX_SCAN_CHUNK_ITEMS}u; active <<= 1u) {
    offset >>= 1u;
    if (lane < active) {
      let right = offset * (2u * lane + 2u) - 1u;
      let left = right - offset;
      let value = (*scratch)[left];
      (*scratch)[left] = (*scratch)[right];
      (*scratch)[right] += value;
    }
    workgroupBarrier();
  }

  if (first < block_count) {
    (*block_prefixes)[first * ${RADIX_SIZE}u + digit] = (*scratch)[lane];
  }
  if (second < block_count) {
    (*block_prefixes)[second * ${RADIX_SIZE}u + digit] =
      (*scratch)[lane + ${WORKGROUP_SIZE}u];
  }
  return 0u;
}
`;

export const scanRadixChunkSumsWGSL = /* wgsl */ `
fn scan_radix_chunk_sums(
  lane: u32,
  digit: u32,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  chunk_sums: ptr<storage, array<u32>, read>,
  chunk_offsets: ptr<storage, array<u32>, read_write>,
  digit_totals: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${RADIX_SCAN_CHUNK_ITEMS}>, read_write>
) -> u32 {
  let chunk_count = ((*state)[0].z + ${RADIX_SCAN_CHUNK_ITEMS - 1}u) /
    ${RADIX_SCAN_CHUNK_ITEMS}u;
  let first = lane;
  let second = lane + ${WORKGROUP_SIZE}u;
  (*scratch)[first] = 0u;
  (*scratch)[second] = 0u;
  if (first < chunk_count) {
    (*scratch)[first] = (*chunk_sums)[digit * chunk_stride + first];
  }
  if (second < chunk_count) {
    (*scratch)[second] = (*chunk_sums)[digit * chunk_stride + second];
  }
  workgroupBarrier();

  var offset = 1u;
  for (var active = ${RADIX_SCAN_CHUNK_ITEMS >> 1}u; active > 0u; active >>= 1u) {
    if (lane < active) {
      let right = offset * (2u * lane + 2u) - 1u;
      let left = right - offset;
      (*scratch)[right] += (*scratch)[left];
    }
    offset <<= 1u;
    workgroupBarrier();
  }
  if (lane == 0u) {
    (*digit_totals)[digit] = (*scratch)[${RADIX_SCAN_CHUNK_ITEMS - 1}u];
    (*scratch)[${RADIX_SCAN_CHUNK_ITEMS - 1}u] = 0u;
  }
  workgroupBarrier();

  for (var active = 1u; active < ${RADIX_SCAN_CHUNK_ITEMS}u; active <<= 1u) {
    offset >>= 1u;
    if (lane < active) {
      let right = offset * (2u * lane + 2u) - 1u;
      let left = right - offset;
      let value = (*scratch)[left];
      (*scratch)[left] = (*scratch)[right];
      (*scratch)[right] += value;
    }
    workgroupBarrier();
  }
  if (first < chunk_count) {
    (*chunk_offsets)[digit * chunk_stride + first] = (*scratch)[first];
  }
  if (second < chunk_count) {
    (*chunk_offsets)[digit * chunk_stride + second] = (*scratch)[second];
  }
  return 0u;
}
`;

export const addRadixChunkOffsetsWGSL = /* wgsl */ `
fn add_radix_chunk_offsets(
  lane: u32,
  group_id: vec3<u32>,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_prefixes: ptr<storage, array<u32>, read_write>,
  chunk_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${RADIX_SCAN_CHUNK_ITEMS}u;
  let first = chunk_start + lane;
  let second = first + ${WORKGROUP_SIZE}u;
  let chunk_offset = (*chunk_offsets)[digit * chunk_stride + chunk];
  if (first < block_count) {
    (*block_prefixes)[first * ${RADIX_SIZE}u + digit] += chunk_offset;
  }
  if (second < block_count) {
    (*block_prefixes)[second * ${RADIX_SIZE}u + digit] += chunk_offset;
  }
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
