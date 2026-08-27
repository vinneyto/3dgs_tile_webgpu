import { TILE_SIZE } from "../pipeline/constants";
import type { DepthSortMode } from "../pipeline/types";

export function rasterizationWGSL(
  mode: DepthSortMode,
  outputDepth: boolean,
): string {
  const recordType = mode === "float32" ? "vec4<u32>" : "vec2<u32>";
  const gaussianId =
    mode === "float32"
      ? "(*records)[intersection].z"
      : "(*records)[intersection].y";
  const depthParameter = outputDepth
    ? ",\n  depth_output: texture_storage_2d<r32float, write>"
    : "";
  const depthStore = outputDepth
    ? "textureStore(depth_output, vec2<i32>(pixel), vec4<f32>(depth, 0.0, 0.0, 1.0));"
    : "";

  return /* wgsl */ `
fn rasterize_tiles_${mode}${outputDepth ? "_with_depth" : ""}(
  local_index: u32,
  group_id: vec3<u32>,
  viewport: vec4<f32>,
  tiles: vec2<u32>,
  background: vec4<f32>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  projected_conic: ptr<storage, array<vec4<f32>>, read>,
  projected_color: ptr<storage, array<vec4<f32>>, read>,
  records: ptr<storage, array<${recordType}>, read>,
  tile_offsets: ptr<storage, array<u32>, read>,
  color_output: texture_storage_2d<rgba16float, write>${depthParameter}
) -> u32 {
  let local_x = local_index % ${TILE_SIZE}u;
  let local_y = local_index / ${TILE_SIZE}u;
  let pixel = vec2<u32>(
    group_id.x * ${TILE_SIZE}u + local_x,
    group_id.y * ${TILE_SIZE}u + local_y
  );
  if (pixel.x >= u32(viewport.x) || pixel.y >= u32(viewport.y)) {
    return 0u;
  }

  let tile = group_id.y * tiles.x + group_id.x;
  let begin = (*tile_offsets)[tile];
  let end = (*tile_offsets)[tile + 1u];
  let pixel_center = vec2<f32>(pixel) + vec2<f32>(0.5);
  var accumulated = vec3<f32>(0.0);
  var transmittance = 1.0;
  var depth = 1.0;
  var depth_written = false;

  for (var intersection = begin; intersection < end; intersection++) {
    let gaussian_id = ${gaussianId};
    let mean = (*projected_mean)[gaussian_id];
    let delta = pixel_center - mean.xy;
    let conic = (*projected_conic)[gaussian_id].xyz;
    let power = -0.5 * (
      conic.x * delta.x * delta.x +
      2.0 * conic.y * delta.x * delta.y +
      conic.z * delta.y * delta.y
    );
    if (power > 0.0) { continue; }
    let alpha = min(0.99, mean.w * exp(power));
    if (alpha < (1.0 / 255.0)) { continue; }

    if (!depth_written) {
      let view_z = -mean.z;
      depth = clamp(
        ((viewport.z + view_z) * viewport.w) /
          ((viewport.w - viewport.z) * view_z),
        0.0,
        1.0
      );
      depth_written = true;
    }

    accumulated += (*projected_color)[gaussian_id].xyz * transmittance * alpha;
    transmittance *= 1.0 - alpha;
    if (transmittance < 1e-4) { break; }
  }

  let background_alpha = clamp(background.w, 0.0, 1.0);
  accumulated += background.xyz * transmittance * background_alpha;
  let alpha = 1.0 - transmittance * (1.0 - background_alpha);
  textureStore(
    color_output,
    vec2<i32>(pixel),
    vec4<f32>(accumulated, alpha)
  );
  ${depthStore}
  return 0u;
}
`;
}
