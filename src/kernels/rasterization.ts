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
  shared_control: ptr<workgroup, array<u32, 2>>,
  shared_done: ptr<workgroup, array<atomic<u32>, 1>>,
  color_output: texture_storage_2d<rgba16float, write>${depthParameter}
) -> u32 {
  // Morton order keeps each subgroup spatially compact inside the tile,
  // reducing divergence for ellipse coverage and transmittance early-out.
  let local_x = compact_morton_bits_16(local_index);
  let local_y = compact_morton_bits_16(local_index >> 1u);
  let pixel = vec2<u32>(
    group_id.x * ${TILE_SIZE}u + local_x,
    group_id.y * ${TILE_SIZE}u + local_y
  );
  let active_pixel = pixel.x < u32(viewport.x) && pixel.y < u32(viewport.y);

  let tile = group_id.y * tiles.x + group_id.x;
  if (local_index == 0u) {
    (*shared_control)[0] = (*tile_offsets)[tile];
    (*shared_control)[1] = (*tile_offsets)[tile + 1u];
    atomicStore(&(*shared_done)[0], 0u);
  }
  let begin = workgroupUniformLoad(&(*shared_control)[0]);
  let end = workgroupUniformLoad(&(*shared_control)[1]);
  if (!active_pixel) {
    atomicAdd(&(*shared_done)[0], 1u);
  }

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
    workgroupBarrier();

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
          atomicAdd(&(*shared_done)[0], 1u);
          break;
        }
      }
    }
    if (batch_start + ${WORKGROUP_SIZE}u >= end) { break; }

    // All atomic increments must be visible before lane 0 snapshots the
    // counter. The following uniform load both broadcasts that snapshot and
    // keeps the next batch (and its workgroup barrier) in uniform control flow.
    workgroupBarrier();
    if (local_index == 0u) {
      (*shared_control)[0] = atomicLoad(&(*shared_done)[0]);
    }
    let done_count = workgroupUniformLoad(&(*shared_control)[0]);
    if (done_count == ${WORKGROUP_SIZE}u) { break; }
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

fn compact_morton_bits_16(value: u32) -> u32 {
  var result = value & 0x55555555u;
  result = (result | (result >> 1u)) & 0x33333333u;
  result = (result | (result >> 2u)) & 0x0f0f0f0fu;
  result = (result | (result >> 4u)) & 0x00ff00ffu;
  result = (result | (result >> 8u)) & 0x0000ffffu;
  return result;
}
`;
}
