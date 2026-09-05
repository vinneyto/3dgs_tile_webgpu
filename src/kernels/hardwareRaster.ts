/** Native-draw arguments: vertex count, instance count, first vertex/instance. */
export const prepareHardwareDrawWGSL = /* wgsl */ `
fn prepare_hardware_draw(
  state: ptr<storage, array<vec4<u32>>, read>,
  draw: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  (*draw)[0] = vec4<u32>(6u, (*state)[0].x, 0u, 0u);
  return 0u;
}
`;

/** Project an oriented Gaussian quad. All vector dimensions are explicit. */
export const hardwareVertexWGSL = /* wgsl */ `
fn hardware_vertex(
  mean: vec4<f32>, conic: vec4<f32>, corner: vec2<f32>,
  projection: mat4x4<f32>, viewport: vec2<f32>
) -> vec4<f32> {
  let determinant = max(conic.x * conic.z - conic.y * conic.y, 1e-20);
  let xx = conic.z / determinant;
  let xy = -conic.y / determinant;
  let yy = conic.x / determinant;
  let difference = xx - yy;
  let discriminant = sqrt(difference * difference + 4.0 * xy * xy);
  let lambda = max(0.5 * (xx + yy + discriminant), 1e-12);
  var axis = vec2<f32>(xy, lambda - xx);
  if (dot(axis, axis) < 1e-20) { axis = vec2<f32>(1.0, 0.0); }
  axis = normalize(axis);
  let cutoff = max(2.0 * log(mean.w * 255.0), 0.0);
  let extent1 = sqrt(lambda * cutoff);
  let extent2 = sqrt(max(1.0 / (determinant * lambda), 1e-12) * cutoff);
  let offset = axis * (corner.x * extent1)
    + vec2<f32>(-axis.y, axis.x) * (corner.y * extent2);
  let pixel = mean.xy + offset;
  let ndc = vec2<f32>(2.0 * pixel.x / viewport.x - 1.0,
                     1.0 - 2.0 * pixel.y / viewport.y);
  let clip = projection * vec4<f32>(0.0, 0.0, -mean.z, 1.0);
  return vec4<f32>(ndc * clip.w, clip.z, clip.w);
}
`;

/** Fragment-only support test, evaluated before the user's raster nodes. */
export const hardwarePowerWGSL = /* wgsl */ `
fn hardware_power(mean: vec4<f32>, conic: vec4<f32>, pixel: vec2<f32>) -> f32 {
  let delta = pixel - mean.xy;
  let power = -0.5 * (conic.x * delta.x * delta.x
    + 2.0 * conic.y * delta.x * delta.y + conic.z * delta.y * delta.y);
  if (power < -log(mean.w * 255.0)) { discard; }
  return power;
}
`;

/** Only linked when a custom node requests Gaussian coordinates / UV. */
export const hardwareCoordinateWGSL = /* wgsl */ `
fn hardware_coordinate(conic: vec4<f32>, delta: vec2<f32>) -> vec2<f32> {
  let l00 = sqrt(max(conic.x, 1e-12));
  let l10 = conic.y / l00;
  let l11 = sqrt(max(conic.z - l10 * l10, 1e-12));
  return vec2<f32>(l00 * delta.x + l10 * delta.y, l11 * delta.y);
}
`;

/** NodeMaterial premultiplies this straight RGBA exactly once. */
export const hardwareFragmentWGSL = /* wgsl */ `
fn hardware_fragment(color: vec3<f32>, alpha: f32, rejected: bool) -> vec4<f32> {
  if (rejected) { discard; }
  let opacity = clamp(alpha, 0.0, 0.99);
  if (opacity < 1.0 / 255.0) { discard; }
  return vec4<f32>(color, opacity);
}
`;
