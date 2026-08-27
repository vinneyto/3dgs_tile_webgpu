import {
  RADIX_BLOCK_ITEMS,
  RADIX_ELEMENTS_PER_THREAD,
  RADIX_MAX_SUBGROUPS,
  RADIX_REDUCE_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "../pipeline/constants";

export function radixHistogramWGSL(shift: number): string {
  return /* wgsl */ `
fn radix_histogram_${shift}(
  lane: u32,
  block_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  partials: ptr<workgroup, array<u32, ${RADIX_SIZE * RADIX_MAX_SUBGROUPS}>>
) -> u32 {
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  let count = (*state)[0].x;
  let subgroup_count = (${WORKGROUP_SIZE}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
      let position = block_start + item * ${WORKGROUP_SIZE}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${shift}u) & ${RADIX_SIZE - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${RADIX_MAX_SUBGROUPS}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${RADIX_SIZE}u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[lane * ${RADIX_MAX_SUBGROUPS}u + subgroup];
    }
    (*block_histograms)[lane * block_stride + block_index] = total;
  }
  return 0u;
}
`;
}

export const reduceRadixHistogramsWGSL = /* wgsl */ `
fn reduce_radix_histograms(
  lane: u32,
  group_id: vec3<u32>,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  reduced: ptr<storage, array<u32>, read_write>,
  partials: ptr<workgroup, array<u32, ${RADIX_MAX_SUBGROUPS}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let subgroup_count = (${WORKGROUP_SIZE}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${RADIX_REDUCE_ITEMS}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
    let block = chunk_start + item * ${WORKGROUP_SIZE}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  let subgroup_total = subgroupAdd(local_sum);
  if (subgroup_lane == 0u) { (*partials)[subgroup_index] = subgroup_total; }
  workgroupBarrier();
  if (lane == 0u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[subgroup];
    }
    (*reduced)[digit * chunk_stride + chunk] = total;
  }
  return 0u;
}
`;

export const scanRadixReducedWGSL = /* wgsl */ `
fn scan_radix_reduced(
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  reduced: ptr<storage, array<u32>, read_write>
) -> u32 {
  let chunk_count = ((*state)[0].z + ${RADIX_REDUCE_ITEMS - 1}u) /
    ${RADIX_REDUCE_ITEMS}u;
  var running = 0u;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    for (var chunk = 0u; chunk < chunk_count; chunk++) {
      let index = digit * chunk_stride + chunk;
      let value = (*reduced)[index];
      (*reduced)[index] = running;
      running += value;
    }
  }
  return 0u;
}
`;

export const scanAddRadixHistogramsWGSL = /* wgsl */ `
fn scan_add_radix_histograms(
  lane: u32,
  group_id: vec3<u32>,
  block_stride: u32,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  reduced: ptr<storage, array<u32>, read>,
  block_prefixes: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${RADIX_REDUCE_ITEMS}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${RADIX_REDUCE_ITEMS}u;
  for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
    let local = item * ${WORKGROUP_SIZE}u + lane;
    let block = chunk_start + local;
    var value = 0u;
    if (block < block_count) {
      value = (*block_histograms)[digit * block_stride + block];
    }
    (*scratch)[local] = value;
  }
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${RADIX_REDUCE_ITEMS / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
      let worker = item * ${WORKGROUP_SIZE}u + lane;
      if (worker < active_count) {
        let left = offset * (2u * worker + 1u) - 1u;
        let right = offset * (2u * worker + 2u) - 1u;
        (*scratch)[right] += (*scratch)[left];
      }
    }
    offset *= 2u;
    active_count /= 2u;
    workgroupBarrier();
  }
  if (lane == 0u) { (*scratch)[${RADIX_REDUCE_ITEMS - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${RADIX_REDUCE_ITEMS / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
      let worker = item * ${WORKGROUP_SIZE}u + lane;
      if (worker < active_count) {
        let left = offset * (2u * worker + 1u) - 1u;
        let right = offset * (2u * worker + 2u) - 1u;
        let value = (*scratch)[left];
        (*scratch)[left] = (*scratch)[right];
        (*scratch)[right] += value;
      }
    }
    active_count *= 2u;
    offset /= 2u;
    workgroupBarrier();
  }

  let global_base = (*reduced)[digit * chunk_stride + chunk];
  for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
    let local = item * ${WORKGROUP_SIZE}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`;

export function radixScatterWGSL(shift: number): string {
  return /* wgsl */ `
fn radix_scatter_${shift}(
  lane: u32,
  block_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<vec2<u32>>, read>,
  records_out: ptr<storage, array<vec2<u32>>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  block_bases: ptr<workgroup, array<u32, ${RADIX_SIZE}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${RADIX_SIZE}>>,
  partials: ptr<workgroup, array<u32, ${RADIX_SIZE * RADIX_MAX_SUBGROUPS}>>
) -> u32 {
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  let count = (*state)[0].x;
  let subgroup_count = (${WORKGROUP_SIZE}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${RADIX_SIZE}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${RADIX_ELEMENTS_PER_THREAD}u; item++) {
    let position = block_start + item * ${WORKGROUP_SIZE}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${shift}u) & ${RADIX_SIZE - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target = 0u; target < ${RADIX_SIZE}u; target++) {
      let matches = select(0u, 1u, valid && digit == target);
      let prefix = subgroupExclusiveAdd(matches);
      let total = subgroupAdd(matches);
      if (subgroup_lane == 0u) {
        (*partials)[target * ${RADIX_MAX_SUBGROUPS}u + subgroup_index] = total;
      }
      if (digit == target) { subgroup_prefix = prefix; }
    }
    workgroupBarrier();

    if (valid) {
      var preceding_subgroups = 0u;
      for (var subgroup = 0u; subgroup < subgroup_index; subgroup++) {
        preceding_subgroups += (*partials)[digit * ${RADIX_MAX_SUBGROUPS}u + subgroup];
      }
      let destination = (*block_bases)[digit]
        + (*local_digit_counts)[digit]
        + preceding_subgroups
        + subgroup_prefix;
      (*records_out)[destination] = record;
    }
    workgroupBarrier();

    if (lane < ${RADIX_SIZE}u) {
      var batch_total = 0u;
      for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
        batch_total += (*partials)[lane * ${RADIX_MAX_SUBGROUPS}u + subgroup];
      }
      (*local_digit_counts)[lane] += batch_total;
    }
    workgroupBarrier();
  }
  return 0u;
}
`;
}
