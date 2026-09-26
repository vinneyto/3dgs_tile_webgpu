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
