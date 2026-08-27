import { TILE_SIZE } from "../pipeline/constants";

export const projectionWGSL = /* wgsl */ `
fn project_gaussians(
  gid: u32,
  gaussian_count: u32,
  sh_degree: u32,
  model_view: mat4x4<f32>,
  projection: mat4x4<f32>,
  camera_local: vec4<f32>,
  viewport: vec4<f32>,
  tiles: vec2<u32>,
  means: ptr<storage, array<vec4<f32>>, read>,
  scales_opacity: ptr<storage, array<vec4<f32>>, read>,
  rotations: ptr<storage, array<vec4<f32>>, read>,
  sh_coefficients: ptr<storage, array<vec4<f32>>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read_write>,
  projected_conic: ptr<storage, array<vec4<f32>>, read_write>,
  projected_color: ptr<storage, array<vec4<f32>>, read_write>,
  tile_counts: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (gid >= gaussian_count) { return 0u; }
  (*tile_counts)[gid] = 0u;
  let mean_local = (*means)[gid].xyz;
  let view = model_view * vec4<f32>(mean_local, 1.0);
  let depth = -view.z;
  if (!(depth > viewport.z && depth < viewport.w)) { return 0u; }
  let clip = projection * view;
  if (clip.w <= 0.0) { return 0u; }
  let ndc = clip.xy / clip.w;
  let width = viewport.x;
  let height = viewport.y;
  let center = vec2<f32>((ndc.x * 0.5 + 0.5) * width, (0.5 - ndc.y * 0.5) * height);

  let scale_opacity = (*scales_opacity)[gid];
  let scale = max(scale_opacity.xyz, vec3<f32>(1e-7));
  let q = normalize((*rotations)[gid]);
  let xx = q.x * q.x;
  let yy = q.y * q.y;
  let zz = q.z * q.z;
  let xy = q.x * q.y;
  let xz = q.x * q.z;
  let yz = q.y * q.z;
  let xw = q.x * q.w;
  let yw = q.y * q.w;
  let zw = q.z * q.w;
  let rotation = mat3x3<f32>(
    vec3<f32>(1.0 - 2.0 * (yy + zz), 2.0 * (xy + zw), 2.0 * (xz - yw)),
    vec3<f32>(2.0 * (xy - zw), 1.0 - 2.0 * (xx + zz), 2.0 * (yz + xw)),
    vec3<f32>(2.0 * (xz + yw), 2.0 * (yz - xw), 1.0 - 2.0 * (xx + yy))
  );
  let covariance_local = rotation * mat3x3<f32>(
    vec3<f32>(scale.x * scale.x, 0.0, 0.0),
    vec3<f32>(0.0, scale.y * scale.y, 0.0),
    vec3<f32>(0.0, 0.0, scale.z * scale.z)
  ) * transpose(rotation);
  let local_to_view = mat3x3<f32>(model_view[0].xyz, model_view[1].xyz, model_view[2].xyz);
  let covariance_view = local_to_view * covariance_local * transpose(local_to_view);
  let fx = 0.5 * width * projection[0][0];
  let fy = 0.5 * height * projection[1][1];
  let inverse_depth = 1.0 / depth;
  let j0 = vec3<f32>(fx * inverse_depth, 0.0, fx * view.x * inverse_depth * inverse_depth);
  let j1 = vec3<f32>(0.0, -fy * inverse_depth, -fy * view.y * inverse_depth * inverse_depth);
  let covariance_j0 = covariance_view * j0;
  let covariance_j1 = covariance_view * j1;
  let sigma00 = dot(j0, covariance_j0) + 0.3;
  let sigma01 = dot(j0, covariance_j1);
  let sigma11 = dot(j1, covariance_j1) + 0.3;
  let determinant = sigma00 * sigma11 - sigma01 * sigma01;
  if (determinant <= 1e-8) { return 0u; }
  let discriminant = sqrt(max(0.0, (sigma00 - sigma11) * (sigma00 - sigma11) + 4.0 * sigma01 * sigma01));
  let major_variance = max(0.5 * (sigma00 + sigma11 + discriminant), 1e-8);
  let radius = ceil(3.0 * sqrt(major_variance));
  if (radius <= 0.0) { return 0u; }

  let min_pixel = center - vec2<f32>(radius);
  let max_pixel = center + vec2<f32>(radius);
  if (max_pixel.x < 0.0 || max_pixel.y < 0.0 || min_pixel.x >= width || min_pixel.y >= height) { return 0u; }
  let max_tile_x = i32(tiles.x) - 1;
  let max_tile_y = i32(tiles.y) - 1;
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
  if (count == 0u) { return 0u; }

  let direction = normalize(camera_local.xyz - mean_local);
  let x = direction.x;
  let y = direction.y;
  let z = direction.z;
  let coefficient_count = (sh_degree + 1u) * (sh_degree + 1u);
  let base = gid * coefficient_count;
  var color = 0.28209479177387814 * (*sh_coefficients)[base].xyz;
  if (sh_degree >= 1u) {
    color += (-0.4886025119029199 * y) * (*sh_coefficients)[base + 1u].xyz;
    color += ( 0.4886025119029199 * z) * (*sh_coefficients)[base + 2u].xyz;
    color += (-0.4886025119029199 * x) * (*sh_coefficients)[base + 3u].xyz;
  }
  if (sh_degree >= 2u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += ( 1.0925484305920792 * x * y) * (*sh_coefficients)[base + 4u].xyz;
    color += (-1.0925484305920792 * y * z) * (*sh_coefficients)[base + 5u].xyz;
    color += ( 0.31539156525252005 * (2.0 * zz - xx - yy)) * (*sh_coefficients)[base + 6u].xyz;
    color += (-1.0925484305920792 * x * z) * (*sh_coefficients)[base + 7u].xyz;
    color += ( 0.5462742152960396 * (xx - yy)) * (*sh_coefficients)[base + 8u].xyz;
  }
  if (sh_degree >= 3u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += (-0.5900435899266435 * y * (3.0 * xx - yy)) * (*sh_coefficients)[base + 9u].xyz;
    color += ( 2.890611442640554 * x * y * z) * (*sh_coefficients)[base + 10u].xyz;
    color += (-0.4570457994644658 * y * (4.0 * zz - xx - yy)) * (*sh_coefficients)[base + 11u].xyz;
    color += ( 0.3731763325901154 * z * (2.0 * zz - 3.0 * xx - 3.0 * yy)) * (*sh_coefficients)[base + 12u].xyz;
    color += (-0.4570457994644658 * x * (4.0 * zz - xx - yy)) * (*sh_coefficients)[base + 13u].xyz;
    color += ( 1.445305721320277 * z * (xx - yy)) * (*sh_coefficients)[base + 14u].xyz;
    color += (-0.5900435899266435 * x * (xx - 3.0 * yy)) * (*sh_coefficients)[base + 15u].xyz;
  }

  let inverse_determinant = 1.0 / determinant;
  (*projected_mean)[gid] = vec4<f32>(center, depth, clamp(scale_opacity.w, 0.0, 1.0));
  (*projected_conic)[gid] = vec4<f32>(
    sigma11 * inverse_determinant,
    -sigma01 * inverse_determinant,
    sigma00 * inverse_determinant,
    radius
  );
  (*projected_color)[gid] = vec4<f32>(max(color + vec3<f32>(0.5), vec3<f32>(0.0)), 1.0);
  (*tile_counts)[gid] = count;
  return 0u;
}
`;
