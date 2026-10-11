interface TileContributionNames {
    center: string;
    conic: string;
    powerThreshold: string;
    tileX: string;
    tileY: string;
    onHit: string;
}
/**
 * Conservative StopThePop tile/ellipse test shared verbatim by projection
 * and emission. Keeping the two loops identical prevents count/emission drift.
 */
export declare function tileContributionWGSL(names: TileContributionNames): string;
/** One image-boundary contract used by count, emission, subpixel and raster kernels.
 * A periodic Gaussian contributes at most once per tile/pixel. At a pixel the
 * minimum quadratic distance selects the strongest periodic image, including
 * tilted footprints wider than a period.
 */
export declare const boundaryDeltaWGSL = "\nfn gaussian_boundary_delta(pixel: vec2<f32>, center: vec2<f32>, conic: vec3<f32>, viewport: vec2<f32>, boundary_axis: u32) -> vec2<f32> {\n  var canonical_center = center;\n  if (boundary_axis == 1u) { canonical_center.x -= floor(center.x / viewport.x) * viewport.x; }\n  if (boundary_axis == 2u) { canonical_center.y -= floor(center.y / viewport.y) * viewport.y; }\n  var delta = pixel - canonical_center;\n  if (boundary_axis == 1u) {\n    let optimum = -conic.y * delta.y / conic.x;\n    delta.x -= floor((delta.x - optimum) / viewport.x + 0.5) * viewport.x;\n  }\n  if (boundary_axis == 2u) {\n    let optimum = -conic.y * delta.x / conic.z;\n    delta.y -= floor((delta.y - optimum) / viewport.y + 0.5) * viewport.y;\n  }\n  return delta;\n}\n";
export declare function boundaryTileContributionWGSL(): string;
export {};
