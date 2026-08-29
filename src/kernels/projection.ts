import { TILE_SIZE } from "../pipeline/constants";
import type { AntialiasMode } from "../pipeline/types";
import { tileContributionWGSL } from "./tileContribution";

export function projectionWGSL(antialiasMode: AntialiasMode): string {
  const countContributingTile = tileContributionWGSL({
    center: "center",
    conic: "conic",
    powerThreshold: "power_threshold",
    tileX: "tile_x",
    tileY: "tile_y",
    onHit: "count++;",
  });
  const originalDeterminant =
    antialiasMode === "compensated"
      ? /* wgsl */ `
  let original_determinant = max(
    sigma00_unfiltered * sigma11_unfiltered - sigma01 * sigma01,
    0.0
  );`
      : "";
  const opacity =
    antialiasMode === "compensated"
      ? /* wgsl */ `
  let opacity_compensation = sqrt(clamp(
    original_determinant / determinant,
    0.0,
    1.0
  ));
  let opacity = clamp(scale_opacity.w, 0.0, 1.0) * opacity_compensation;`
      : /* wgsl */ `
  let opacity = clamp(scale_opacity.w, 0.0, 1.0);`;

  return /* wgsl */ `
fn project_gaussians(
  gid: u32,
  gaussian_count: u32,
  sh_degree: u32,
  projection: mat4x4<f32>,
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
  // Opacity zero is also the visibility predicate consumed by the compact scan.
  (*projected_mean)[gid] = vec4<f32>(0.0);
  let mean_object = (*means)[gid];
  let mean_local = mean_object.xyz;
  let object_id = u32(mean_object.w);
  // Camera-specific object frames occupy the tail of projected_mean so the
  // projection stage stays within WebGPU's guaranteed eight storage bindings.
  let object_base = gaussian_count + object_id * 6u;
  if ((*projected_mean)[object_base + 5u].x <= 0.0) { return 0u; }
  let model_view = mat4x4<f32>(
    (*projected_mean)[object_base],
    (*projected_mean)[object_base + 1u],
    (*projected_mean)[object_base + 2u],
    (*projected_mean)[object_base + 3u]
  );
  let camera_local = (*projected_mean)[object_base + 4u];
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
  let sigma00_unfiltered = dot(j0, covariance_j0);
  var sigma01 = dot(j0, covariance_j1);
  let sigma11_unfiltered = dot(j1, covariance_j1);
  ${originalDeterminant}
  var sigma00 = sigma00_unfiltered + 0.3;
  var sigma11 = sigma11_unfiltered + 0.3;
  let max_f32 = 3.402823e+38;
  let covariance_is_finite =
    sigma00 == sigma00 && abs(sigma00) <= max_f32 &&
    sigma01 == sigma01 && abs(sigma01) <= max_f32 &&
    sigma11 == sigma11 && abs(sigma11) <= max_f32;
  if (!covariance_is_finite) { return 0u; }

  // Match the Metal reference: bound the projected footprint before inversion.
  // Without the upper bound, Gaussians close to the camera can expand across
  // the entire screen and produce both excessive intersections and fogging.
  let eigen_midpoint = 0.5 * (sigma00 + sigma11);
  let eigen_radius = sqrt(
    0.25 * (sigma00 - sigma11) * (sigma00 - sigma11) + sigma01 * sigma01
  );
  let lambda_min = clamp(eigen_midpoint - eigen_radius, 1e-6, 1e4);
  let lambda_max = clamp(eigen_midpoint + eigen_radius, 1e-6, 1e4);
  let theta = 0.5 * atan2(2.0 * sigma01, sigma00 - sigma11);
  let cs = cos(theta);
  let sn = sin(theta);
  sigma00 = lambda_min * sn * sn + lambda_max * cs * cs;
  sigma01 = (lambda_max - lambda_min) * cs * sn;
  sigma11 = lambda_min * cs * cs + lambda_max * sn * sn;
  let determinant = sigma00 * sigma11 - sigma01 * sigma01;
  if (determinant <= 1e-8) { return 0u; }
  ${opacity}
  if (opacity < (1.0 / 255.0)) { return 0u; }
  let power_threshold = log(opacity * 255.0);
  let radius_x = ceil(sqrt(2.0 * power_threshold * clamp(sigma00, 1e-12, 1e4)));
  let radius_y = ceil(sqrt(2.0 * power_threshold * clamp(sigma11, 1e-12, 1e4)));
  if (radius_x <= 0.0 || radius_y <= 0.0) { return 0u; }

  // Axis-specific radii avoid the square major-eigenvalue AABB, which can
  // multiply K for elongated Gaussians.
  let min_pixel = center - vec2<f32>(radius_x, radius_y);
  let max_pixel = center + vec2<f32>(radius_x, radius_y);
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
  let inverse_determinant = 1.0 / determinant;
  let conic = vec3<f32>(
    sigma11 * inverse_determinant,
    -sigma01 * inverse_determinant,
    sigma00 * inverse_determinant
  );
  var count = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
${countContributingTile}
    }
  }
  if (count == 0u) { return 0u; }

  // Canonical 3DGS evaluates SH in the camera-to-point direction.
  let direction = normalize(mean_local - camera_local.xyz);
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

  (*projected_mean)[gid] = vec4<f32>(center, depth, opacity);
  (*projected_conic)[gid] = vec4<f32>(
    conic,
    radius_x
  );
  (*projected_color)[gid] = vec4<f32>(
    clamp(color + vec3<f32>(0.5), vec3<f32>(0.0), vec3<f32>(1.0)),
    radius_y
  );
  (*tile_counts)[gid] = count;
  return 0u;
}
`;
}
