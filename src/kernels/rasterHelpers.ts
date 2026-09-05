import { WORKGROUP_SIZE } from "../pipeline/constants";

export const compactMortonBitsWGSL = /* wgsl */ `
fn compact_morton_bits_16(value: u32) -> u32 {
  var result = value & 0x55555555u;
  result = (result | (result >> 1u)) & 0x33333333u;
  result = (result | (result >> 2u)) & 0x0f0f0f0fu;
  result = (result | (result >> 4u)) & 0x00ff00ffu;
  result = (result | (result >> 8u)) & 0x0000ffffu;
  return result;
}
`;

export const workgroupUniformLoadWGSL = /* wgsl */ `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${WORKGROUP_SIZE}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`;

/** All workgroup lanes must call this, including finished/out-of-bounds pixels. */
export const subgroupActiveWGSL = /* wgsl */ `
fn raster_subgroup_active(
  pixel_active: u32,
  local_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  partials: ptr<workgroup, array<u32, ${WORKGROUP_SIZE}>>
) -> u32 {
  let any_active = subgroupOr(pixel_active);
  if (subgroup_lane == 0u) {
    (*partials)[subgroup_index] = any_active;
  }
  workgroupBarrier();
  if (local_index == 0u) {
    let count = (${WORKGROUP_SIZE}u + subgroup_size - 1u) / subgroup_size;
    var total = 0u;
    for (var i = 0u; i < count; i++) {
      total |= (*partials)[i];
    }
    (*partials)[0] = total;
  }
  return workgroupUniformLoad(&(*partials)[0]);
}
`;
