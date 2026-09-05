import type { AntialiasMode } from "../pipeline/types";
import type { GaussianShFormat } from "../GaussianSh";
export declare function projectionCovarianceWGSL(antialiasMode: AntialiasMode): string;
export declare function evaluateShWGSL(format: GaussianShFormat): string;
/**
 * Exact sampled-alpha test for support AABBs no larger than one pixel in both
 * dimensions. Larger splats are conservatively retained without enumeration.
 */
export declare const subpixelHasSampleWGSL = "\nfn subpixel_has_sample(\n  center: vec2<f32>,\n  conic: vec3<f32>,\n  power_threshold: f32,\n  extent: vec2<f32>,\n  viewport: vec2<u32>\n) -> bool {\n  if (extent.x * 2.0 > 1.0 || extent.y * 2.0 > 1.0) { return true; }\n  let pixel_min = vec2<i32>(\n    max(i32(ceil(center.x - extent.x - 0.5)), 0),\n    max(i32(ceil(center.y - extent.y - 0.5)), 0)\n  );\n  let pixel_max = vec2<i32>(\n    min(i32(floor(center.x + extent.x - 0.5)), i32(viewport.x) - 1),\n    min(i32(floor(center.y + extent.y - 0.5)), i32(viewport.y) - 1)\n  );\n  for (var pixel_y = pixel_min.y; pixel_y <= pixel_max.y; pixel_y++) {\n    for (var pixel_x = pixel_min.x; pixel_x <= pixel_max.x; pixel_x++) {\n      let delta = vec2<f32>(f32(pixel_x) + 0.5, f32(pixel_y) + 0.5) - center;\n      let sigma = 0.5 * (\n        conic.x * delta.x * delta.x +\n        2.0 * conic.y * delta.x * delta.y +\n        conic.z * delta.y * delta.y\n      );\n      if (sigma <= power_threshold) { return true; }\n    }\n  }\n  return false;\n}\n";
export declare function countContributingTilesWGSL(): string;
