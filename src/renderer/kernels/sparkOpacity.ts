/** Conservative support for Spark's LOD falloff. For a>=1, 1-(1-g)^a <= a*g. */
export const gaussianOpacitySupportWGSL = /* wgsl */ `
fn gaussian_opacity_support(opacity: f32) -> f32 {
  if (opacity <= 1.0) { return log(opacity * 255.0); }
  return log(255.0) + (opacity * opacity - 1.0) / 2.718281828459045;
}`;
/** Matches the upstream Spark fragment shader for ordinary and encoded LOD opacity. */
export const gaussianAlphaWGSL = /* wgsl */ `
fn gaussian_alpha(opacity: f32, power: f32) -> f32 {
  let weight = exp(power);
  if (opacity <= 1.0) { return opacity * weight; }
  let a = exp((opacity * opacity - 1.0) / 2.718281828459045);
  return 1.0 - pow(max(0.0, 1.0 - weight), a);
}`;
