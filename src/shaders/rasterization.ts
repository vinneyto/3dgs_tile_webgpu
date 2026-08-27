import { TILE_SIZE } from "../pipeline/constants";
import { frameUniforms } from "./common";

export const rasterizeShader = /* wgsl */ `
${frameUniforms}

@group(0) @binding(0) var<storage, read> projected_mean: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> projected_conic: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> projected_color: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> gaussian_ids: array<u32>;
@group(0) @binding(4) var<storage, read> tile_offsets: array<u32>;
@group(0) @binding(5) var output_texture: texture_storage_2d<rgba16float, write>;
@group(0) @binding(6) var<uniform> frame: FrameUniforms;

@compute @workgroup_size(${TILE_SIZE}, ${TILE_SIZE})
fn main(
  @builtin(workgroup_id) workgroup_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let pixel_u32 = workgroup_id.xy * ${TILE_SIZE}u + local_id.xy;
  if (pixel_u32.x >= u32(frame.viewport.x) || pixel_u32.y >= u32(frame.viewport.y)) { return; }
  let tile = workgroup_id.y * frame.config.x + workgroup_id.x;
  let begin = tile_offsets[tile];
  let end = tile_offsets[tile + 1u];
  let pixel = vec2<f32>(pixel_u32) + vec2<f32>(0.5);
  var accumulated = vec3<f32>(0.0);
  var transmittance = 1.0;

  for (var intersection = begin; intersection < end; intersection++) {
    let gaussian_id = gaussian_ids[intersection];
    let mean = projected_mean[gaussian_id];
    let delta = pixel - mean.xy;
    let conic = projected_conic[gaussian_id].xyz;
    let power = -0.5 * (conic.x * delta.x * delta.x + 2.0 * conic.y * delta.x * delta.y + conic.z * delta.y * delta.y);
    if (power > 0.0) { continue; }
    let alpha = min(0.99, mean.w * exp(power));
    if (alpha < (1.0 / 255.0)) { continue; }
    accumulated += transmittance * alpha * projected_color[gaussian_id].xyz;
    transmittance *= 1.0 - alpha;
    if (transmittance < 1e-4) { break; }
  }

  let background_alpha = clamp(frame.background.a, 0.0, 1.0);
  accumulated += transmittance * background_alpha * frame.background.rgb;
  let alpha = 1.0 - transmittance * (1.0 - background_alpha);
  textureStore(output_texture, vec2<i32>(pixel_u32), vec4<f32>(accumulated, alpha));
}
`;
