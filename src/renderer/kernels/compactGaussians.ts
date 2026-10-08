/** Spark ExtSplats precision, adapted to separate shape buffers. No shader-f16 feature required. */
export const compactScaleOpacityWGSL = /* wgsl */ `
fn decodeCompactScaleOpacity(packed: vec2<u32>) -> vec4<f32> {
  let xy = unpack2x16float(packed.x);
  let za = unpack2x16float(packed.y);
  return vec4<f32>(exp(vec3<f32>(xy, za.x)), za.y);
}`;

/** Octahedral axis (10+10 bits), half-angle (12 bits). Matches Spark's oct101012. */
export const compactRotationWGSL = /* wgsl */ `
fn decodeCompactRotation(packed: u32) -> vec4<f32> {
  let p = vec2<f32>(f32(packed & 1023u), f32((packed >> 10u) & 1023u)) / 1023.0 * 2.0 - 1.0;
  let z = 1.0 - abs(p.x) - abs(p.y);
  let t = max(-z, 0.0);
  let xy = p + select(vec2<f32>(t), vec2<f32>(-t), p >= vec2<f32>(0.0));
  let axis = normalize(vec3<f32>(xy, z));
  let halfAngle = f32(packed >> 20u) / 4095.0 * 1.5707963267948966;
  return vec4<f32>(axis * sin(halfAngle), cos(halfAngle));
}`;
