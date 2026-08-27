import type { DepthSortMode } from "../pipeline/types";

export const clearTileOffsetsWGSL = /* wgsl */ `
fn clear_tile_offsets(
  index: u32,
  offset_count: u32,
  offsets: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (index < offset_count) {
    (*offsets)[index] = 0xffffffffu;
  }
  return 0u;
}
`;

export function tileBoundariesWGSL(mode: DepthSortMode): string {
  const recordType = mode === "float32" ? "vec4<u32>" : "vec2<u32>";
  const tile =
    mode === "float32" ? "(*records)[index].x" : "(*records)[index].x >> 16u";
  const previousTile =
    mode === "float32"
      ? "(*records)[index - 1u].x"
      : "(*records)[index - 1u].x >> 16u";

  return /* wgsl */ `
fn find_tile_boundaries_${mode}(
  index: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<${recordType}>, read>,
  offsets: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (index >= (*state)[0].x) { return 0u; }
  let tile = ${tile};
  if (index == 0u || ${previousTile} != tile) {
    (*offsets)[tile] = index;
  }
  return 0u;
}
`;
}

export const fillTileOffsetsWGSL = /* wgsl */ `
fn fill_tile_offset_gaps(
  tile_count: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  offsets: ptr<storage, array<u32>, read_write>
) -> u32 {
  var running = (*state)[0].x;
  (*offsets)[tile_count] = running;
  var index = tile_count;
  while (index > 0u) {
    index--;
    if ((*offsets)[index] == 0xffffffffu) {
      (*offsets)[index] = running;
    } else {
      running = (*offsets)[index];
    }
  }
  return 0u;
}
`;
