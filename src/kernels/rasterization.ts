import { TILE_SIZE, WORKGROUP_SIZE } from "../pipeline/constants";
import type { DepthSortMode } from "../pipeline/types";

export function rasterizationWGSL(
  mode: DepthSortMode,
  outputDepth: boolean,
): string {
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
  records: ptr<storage, array<vec2<u32>>, read>,
  tile_offsets: ptr<storage, array<u32>, read>,
  shared_mean: ptr<workgroup, array<vec4<f32>, ${WORKGROUP_SIZE}>>,
  shared_conic: ptr<workgroup, array<vec4<f32>, ${WORKGROUP_SIZE}>>,
  shared_color: ptr<workgroup, array<vec4<f32>, ${WORKGROUP_SIZE}>>,
  shared_active: ptr<workgroup, array<u32, ${WORKGROUP_SIZE}>>,
  color_output: texture_storage_2d<rgba16float, write>${depthParameter}
) -> u32 {
  let local_x = local_index % ${TILE_SIZE}u;
  let local_y = local_index / ${TILE_SIZE}u;
  let pixel = vec2<u32>(
    group_id.x * ${TILE_SIZE}u + local_x,
    group_id.y * ${TILE_SIZE}u + local_y
  );
  let active_pixel = pixel.x < u32(viewport.x) && pixel.y < u32(viewport.y);

  let tile = group_id.y * tiles.x + group_id.x;
  let begin = (*tile_offsets)[tile];
  let end = (*tile_offsets)[tile + 1u];
  let pixel_center = vec2<f32>(pixel) + vec2<f32>(0.5);
  var accumulated = vec3<f32>(0.0);
  var transmittance = 1.0;
  var depth = 1.0;
  var depth_written = false;
  var done = false;

  for (var batch_start = begin; batch_start < end; batch_start += ${WORKGROUP_SIZE}u) {
    let load_index = batch_start + local_index;
    if (load_index < end) {
      let gaussian_id = (*records)[load_index].y;
      let mean = (*projected_mean)[gaussian_id];
      let conic = (*projected_conic)[gaussian_id];
      (*shared_mean)[local_index] = mean;
      // Rasterization does not use the projected x radius in conic.w.
      // Cache the alpha cutoff in its place once per splat/tile so every
      // pixel can reject insignificant contributions before calling exp().
      (*shared_conic)[local_index] = vec4<f32>(
        conic.xyz,
        log(mean.w * 255.0)
      );
      (*shared_color)[local_index] = (*projected_color)[gaussian_id];
    }
    if (local_index == 0u) {
      (*shared_active)[0] = select(
        0u,
        1u,
        batch_start + ${WORKGROUP_SIZE}u < end
      );
    }
    let has_next_batch = workgroupUniformLoad(&(*shared_active)[0]);

    let batch_count = min(${WORKGROUP_SIZE}u, end - batch_start);
    if (active_pixel && !done) {
      for (var batch_index = 0u; batch_index < batch_count; batch_index++) {
        let mean = (*shared_mean)[batch_index];
        let delta = pixel_center - mean.xy;
        let conic_and_threshold = (*shared_conic)[batch_index];
        let conic = conic_and_threshold.xyz;
        let power = -0.5 * (
          conic.x * delta.x * delta.x +
          2.0 * conic.y * delta.x * delta.y +
          conic.z * delta.y * delta.y
        );
        if (power > 0.0 || power < -conic_and_threshold.w) { continue; }
        let alpha = min(0.99, mean.w * exp(power));
        // Keep the original test as a defensive guard for exp/log rounding.
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

        accumulated += (*shared_color)[batch_index].xyz * transmittance * alpha;
        transmittance *= 1.0 - alpha;
        if (transmittance < 1e-4) {
          done = true;
          break;
        }
      }
    }
    if (has_next_batch == 0u) { break; }

    (*shared_active)[local_index] = select(
      0u,
      1u,
      active_pixel && !done
    );
    workgroupBarrier();

    if (local_index < 8u) {
      let first_lane = local_index * 32u;
      var subgroup_active = 0u;
      for (var lane_offset = 0u; lane_offset < 32u; lane_offset++) {
        subgroup_active |= (*shared_active)[first_lane + lane_offset];
      }
      (*shared_active)[local_index] = subgroup_active;
    }
    workgroupBarrier();

    if (local_index == 0u) {
      var tile_active = 0u;
      for (var subgroup = 0u; subgroup < 8u; subgroup++) {
        tile_active |= (*shared_active)[subgroup];
      }
      (*shared_active)[0] = tile_active;
    }
    let tile_active = workgroupUniformLoad(&(*shared_active)[0]);
    if (tile_active == 0u) { break; }
  }

  if (active_pixel) {
    let background_alpha = clamp(background.w, 0.0, 1.0);
    accumulated += background.xyz * transmittance * background_alpha;
    let alpha = 1.0 - transmittance * (1.0 - background_alpha);
    textureStore(
      color_output,
      vec2<i32>(pixel),
      vec4<f32>(accumulated, alpha)
    );
    ${depthStore}
  }
  return 0u;
}
`;
}
