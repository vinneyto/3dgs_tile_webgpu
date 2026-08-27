import { TILE_SIZE, WORKGROUP_SIZE } from "../pipeline/constants";
import { frameUniforms } from "./common";

export const projectShader = /* wgsl */ `
${frameUniforms}

const SH_C0 = 0.28209479177387814;
const SH_C1 = 0.4886025119029199;
const SH_C2_0 = 1.0925484305920792;
const SH_C2_1 = -1.0925484305920792;
const SH_C2_2 = 0.31539156525252005;
const SH_C2_3 = -1.0925484305920792;
const SH_C2_4 = 0.5462742152960396;
const SH_C3_0 = -0.5900435899266435;
const SH_C3_1 = 2.890611442640554;
const SH_C3_2 = -0.4570457994644658;
const SH_C3_3 = 0.3731763325901154;
const SH_C3_4 = -0.4570457994644658;
const SH_C3_5 = 1.445305721320277;
const SH_C3_6 = -0.5900435899266435;

@group(0) @binding(0) var<storage, read> means: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> scales_opacity: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> rotations: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> sh_coefficients: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> projected_mean: array<vec4<f32>>;
@group(0) @binding(5) var<storage, read_write> projected_conic: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> projected_color: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read_write> tile_counts: array<u32>;
@group(0) @binding(8) var<uniform> frame: FrameUniforms;

fn quaternion_matrix(q_in: vec4<f32>) -> mat3x3<f32> {
  let q = normalize(q_in);
  let x = q.x;
  let y = q.y;
  let z = q.z;
  let w = q.w;
  let xx = x * x;
  let yy = y * y;
  let zz = z * z;
  let xy = x * y;
  let xz = x * z;
  let yz = y * z;
  let xw = x * w;
  let yw = y * w;
  let zw = z * w;

  return mat3x3<f32>(
    vec3<f32>(1.0 - 2.0 * (yy + zz), 2.0 * (xy + zw), 2.0 * (xz - yw)),
    vec3<f32>(2.0 * (xy - zw), 1.0 - 2.0 * (xx + zz), 2.0 * (yz + xw)),
    vec3<f32>(2.0 * (xz + yw), 2.0 * (yz - xw), 1.0 - 2.0 * (xx + yy))
  );
}

fn evaluate_sh(gid: u32, direction: vec3<f32>) -> vec3<f32> {
  let degree = frame.config.w;
  let coefficient_count = (degree + 1u) * (degree + 1u);
  let base = gid * coefficient_count;
  let x = direction.x;
  let y = direction.y;
  let z = direction.z;
  var color = SH_C0 * sh_coefficients[base].xyz;

  if (degree >= 1u) {
    color += (-SH_C1 * y) * sh_coefficients[base + 1u].xyz;
    color += ( SH_C1 * z) * sh_coefficients[base + 2u].xyz;
    color += (-SH_C1 * x) * sh_coefficients[base + 3u].xyz;
  }

  if (degree >= 2u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += (SH_C2_0 * x * y) * sh_coefficients[base + 4u].xyz;
    color += (SH_C2_1 * y * z) * sh_coefficients[base + 5u].xyz;
    color += (SH_C2_2 * (2.0 * zz - xx - yy)) * sh_coefficients[base + 6u].xyz;
    color += (SH_C2_3 * x * z) * sh_coefficients[base + 7u].xyz;
    color += (SH_C2_4 * (xx - yy)) * sh_coefficients[base + 8u].xyz;
  }

  if (degree >= 3u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += (SH_C3_0 * y * (3.0 * xx - yy)) * sh_coefficients[base + 9u].xyz;
    color += (SH_C3_1 * x * y * z) * sh_coefficients[base + 10u].xyz;
    color += (SH_C3_2 * y * (4.0 * zz - xx - yy)) * sh_coefficients[base + 11u].xyz;
    color += (SH_C3_3 * z * (2.0 * zz - 3.0 * xx - 3.0 * yy)) * sh_coefficients[base + 12u].xyz;
    color += (SH_C3_4 * x * (4.0 * zz - xx - yy)) * sh_coefficients[base + 13u].xyz;
    color += (SH_C3_5 * z * (xx - yy)) * sh_coefficients[base + 14u].xyz;
    color += (SH_C3_6 * x * (xx - 3.0 * yy)) * sh_coefficients[base + 15u].xyz;
  }

  return max(color + vec3<f32>(0.5), vec3<f32>(0.0));
}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gid = global_id.x;
  if (gid >= frame.config.z) {
    return;
  }

  tile_counts[gid] = 0u;
  let mean_local = means[gid].xyz;
  let view = frame.model_view * vec4<f32>(mean_local, 1.0);
  let depth = -view.z;
  let near_plane = frame.viewport.z;
  let far_plane = frame.viewport.w;
  if (!(depth > near_plane && depth < far_plane)) {
    return;
  }

  let clip = frame.projection * view;
  if (clip.w <= 0.0) {
    return;
  }
  let ndc = clip.xy / clip.w;
  let width = frame.viewport.x;
  let height = frame.viewport.y;
  let center = vec2<f32>((ndc.x * 0.5 + 0.5) * width, (0.5 - ndc.y * 0.5) * height);

  let scale_opacity = scales_opacity[gid];
  let scale = max(scale_opacity.xyz, vec3<f32>(1e-7));
  let rotation = quaternion_matrix(rotations[gid]);
  let covariance_local = rotation * mat3x3<f32>(
    vec3<f32>(scale.x * scale.x, 0.0, 0.0),
    vec3<f32>(0.0, scale.y * scale.y, 0.0),
    vec3<f32>(0.0, 0.0, scale.z * scale.z)
  ) * transpose(rotation);

  let local_to_view = mat3x3<f32>(
    frame.model_view[0].xyz,
    frame.model_view[1].xyz,
    frame.model_view[2].xyz
  );
  let covariance_view = local_to_view * covariance_local * transpose(local_to_view);
  let fx = 0.5 * width * frame.projection[0][0];
  let fy = 0.5 * height * frame.projection[1][1];
  let inverse_depth = 1.0 / depth;
  let j0 = vec3<f32>(fx * inverse_depth, 0.0, fx * view.x * inverse_depth * inverse_depth);
  let j1 = vec3<f32>(0.0, -fy * inverse_depth, -fy * view.y * inverse_depth * inverse_depth);
  let covariance_j0 = covariance_view * j0;
  let covariance_j1 = covariance_view * j1;
  let sigma00 = dot(j0, covariance_j0) + 0.3;
  let sigma01 = dot(j0, covariance_j1);
  let sigma11 = dot(j1, covariance_j1) + 0.3;
  let determinant = sigma00 * sigma11 - sigma01 * sigma01;
  if (!(determinant > 1e-8)) {
    return;
  }

  let discriminant = sqrt(max(0.0, (sigma00 - sigma11) * (sigma00 - sigma11) + 4.0 * sigma01 * sigma01));
  let major_variance = max(0.5 * (sigma00 + sigma11 + discriminant), 1e-8);
  let radius = ceil(3.0 * sqrt(major_variance));
  if (!(radius > 0.0)) {
    return;
  }

  let min_pixel = center - vec2<f32>(radius);
  let max_pixel = center + vec2<f32>(radius);
  if (max_pixel.x < 0.0 || max_pixel.y < 0.0 || min_pixel.x >= width || min_pixel.y >= height) {
    return;
  }

  let max_tile_x = i32(frame.config.x) - 1;
  let max_tile_y = i32(frame.config.y) - 1;
  let tile_min = vec2<i32>(
    clamp(i32(floor(min_pixel.x / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor(min_pixel.y / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor(max_pixel.x / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor(max_pixel.y / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  let tile_extent = tile_max - tile_min + vec2<i32>(1);
  let count = u32(tile_extent.x * tile_extent.y);
  if (count == 0u) {
    return;
  }

  let inverse_determinant = 1.0 / determinant;
  let direction = normalize(frame.camera_local.xyz - mean_local);
  projected_mean[gid] = vec4<f32>(center, depth, clamp(scale_opacity.w, 0.0, 1.0));
  projected_conic[gid] = vec4<f32>(sigma11 * inverse_determinant, -sigma01 * inverse_determinant, sigma00 * inverse_determinant, radius);
  projected_color[gid] = vec4<f32>(evaluate_sh(gid, direction), 1.0);
  tile_counts[gid] = count;
}
`;
