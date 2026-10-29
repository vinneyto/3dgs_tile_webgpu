/** Conservative support for Spark's LOD falloff. For a>=1, 1-(1-g)^a <= a*g. */
export declare const gaussianOpacitySupportWGSL = "\nfn gaussian_opacity_support(opacity: f32) -> f32 {\n  if (opacity <= 1.0) { return log(opacity * 255.0); }\n  return log(255.0) + (opacity * opacity - 1.0) / 2.718281828459045;\n}";
/** Matches the upstream Spark fragment shader for ordinary and encoded LOD opacity. */
export declare const gaussianAlphaWGSL = "\nfn gaussian_alpha(opacity: f32, power: f32) -> f32 {\n  let weight = exp(power);\n  if (opacity <= 1.0) { return opacity * weight; }\n  let a = exp((opacity * opacity - 1.0) / 2.718281828459045);\n  return 1.0 - pow(max(0.0, 1.0 - weight), a);\n}";
