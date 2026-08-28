import {
  RADIX_BLOCK_ITEMS,
  RADIX_ELEMENTS_PER_THREAD,
  RADIX_REDUCE_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";

/** Portable histogram using only workgroup atomics and barriers. */
export function radixWorkgroupHistogramWGSL(shift: number): string {
  return /* wgsl */ `
fn radix_workgroup_histogram_${shift}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  histogram: ptr<workgroup, array<atomic<u32>, ${RADIX_SIZE}>>
) -> u32 {
  if (lane < ${RADIX_SIZE}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
    let position = block_start + item * ${WORKGROUP_SIZE}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${shift}u) & ${RADIX_SIZE - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${RADIX_SIZE}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`;
}

/** Portable reduction of 1024 block histograms without subgroup operations. */
export const reduceRadixHistogramsWorkgroupWGSL = /* wgsl */ `
fn reduce_radix_histograms_workgroup(
  lane: u32,
  group_id: vec3<u32>,
  block_stride: u32,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  reduced: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${WORKGROUP_SIZE}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${RADIX_REDUCE_ITEMS}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
    let block = chunk_start + item * ${WORKGROUP_SIZE}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${WORKGROUP_SIZE / 2}u;
  for (var step = 0u; step < 8u; step++) {
    if (lane < active_count) {
      (*scratch)[lane] += (*scratch)[lane + active_count];
    }
    active_count /= 2u;
    workgroupBarrier();
  }
  if (lane == 0u) {
    (*reduced)[digit * chunk_stride + chunk] = (*scratch)[0];
  }
  return 0u;
}
`;

/** Stable scatter using 32-lane bit masks stored in workgroup memory. */
export function radixWorkgroupScatterWGSL(shift: number): string {
  return /* wgsl */ `
fn radix_workgroup_scatter_${shift}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<vec2<u32>>, read>,
  records_out: ptr<storage, array<vec2<u32>>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  block_bases: ptr<workgroup, array<u32, ${RADIX_SIZE}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${RADIX_SIZE}>>,
  shared_digits: ptr<workgroup, array<u32, ${WORKGROUP_SIZE}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${RADIX_SIZE * (WORKGROUP_SIZE / 32)}>>
) -> u32 {
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  let count = (*state)[0].x;
  let words_per_digit = ${WORKGROUP_SIZE / 32}u;
  if (lane < ${RADIX_SIZE}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
    let position = block_start + item * ${WORKGROUP_SIZE}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${RADIX_SIZE}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${shift}u) & ${RADIX_SIZE - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${RADIX_SIZE * (WORKGROUP_SIZE / 32)}u) {
      let mask_digit = lane / words_per_digit;
      let word = lane % words_per_digit;
      let first_lane = word * 32u;
      var mask = 0u;
      for (var bit_index = 0u; bit_index < 32u; bit_index++) {
        if ((*shared_digits)[first_lane + bit_index] == mask_digit) {
          mask |= 1u << bit_index;
        }
      }
      (*shared_digit_masks)[lane] = mask;
    }
    workgroupBarrier();

    if (valid) {
      let word = lane / 32u;
      let bit_index = lane % 32u;
      let mask_start = digit * words_per_digit;
      var local_rank = 0u;
      for (var previous_word = 0u; previous_word < word; previous_word++) {
        local_rank += countOneBits(
          (*shared_digit_masks)[mask_start + previous_word]
        );
      }
      local_rank += countOneBits(
        (*shared_digit_masks)[mask_start + word] &
          ((1u << bit_index) - 1u)
      );
      let destination = (*block_bases)[digit]
        + (*local_digit_counts)[digit]
        + local_rank;
      (*records_out)[destination] = record;
    }
    workgroupBarrier();

    if (lane < ${RADIX_SIZE}u) {
      var batch_total = 0u;
      for (var word = 0u; word < words_per_digit; word++) {
        batch_total += countOneBits(
          (*shared_digit_masks)[lane * words_per_digit + word]
        );
      }
      (*local_digit_counts)[lane] += batch_total;
    }
    workgroupBarrier();
  }
  return 0u;
}
`;
}
