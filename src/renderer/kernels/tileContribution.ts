import { TILE_SIZE } from "../pipeline/constants";

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
export function tileContributionWGSL(names: TileContributionNames): string {
  const { center, conic, powerThreshold, tileX, tileY, onHit } = names;
  return /* wgsl */ `
      let rect_min = vec2<f32>(f32(${tileX}), f32(${tileY})) * ${TILE_SIZE}.0;
      let rect_max = rect_min + vec2<f32>(${TILE_SIZE}.0);
      let x_left = ${center}.x < rect_min.x;
      let x_right = ${center}.x > rect_max.x;
      let in_x_range = !(x_left || x_right);
      let y_above = ${center}.y < rect_min.y;
      let y_below = ${center}.y > rect_max.y;
      let in_y_range = !(y_above || y_below);
      var contributes = in_x_range && in_y_range;
      if (!contributes) {
        let corner = vec2<f32>(
          select(rect_max.x, rect_min.x, x_left),
          select(rect_max.y, rect_min.y, y_above)
        );
        let edge = vec2<f32>(
          select(-${TILE_SIZE}.0, ${TILE_SIZE}.0, x_left),
          select(-${TILE_SIZE}.0, ${TILE_SIZE}.0, y_above)
        );
        let difference = ${center} - corner;
        let tx_raw = (
          edge.x * ${conic}.x * difference.x +
          edge.x * ${conic}.y * difference.y
        ) / (edge.x * ${conic}.x * edge.x);
        let ty_raw = (
          edge.y * ${conic}.y * difference.x +
          edge.y * ${conic}.z * difference.y
        ) / (edge.y * ${conic}.z * edge.y);
        let tx = select(clamp(tx_raw, 0.0, 1.0), 0.0, in_y_range);
        let ty = select(clamp(ty_raw, 0.0, 1.0), 0.0, in_x_range);
        let closest = corner + vec2<f32>(tx * edge.x, ty * edge.y);
        let delta = closest - ${center};
        let sigma = 0.5 * (
          ${conic}.x * delta.x * delta.x +
          ${conic}.z * delta.y * delta.y
        ) + ${conic}.y * delta.x * delta.y;
        contributes = sigma <= ${powerThreshold};
      }
      if (contributes) {
        ${onHit}
      }`;
}

/** One image-boundary contract used by count, emission, subpixel and raster kernels.
 * A periodic Gaussian contributes at most once per tile/pixel. At a pixel the
 * minimum quadratic distance selects the strongest periodic image, including
 * tilted footprints wider than a period.
 */
export const boundaryDeltaWGSL = /* wgsl */ `
fn gaussian_boundary_delta(pixel: vec2<f32>, center: vec2<f32>, conic: vec3<f32>, viewport: vec2<f32>, boundary_axis: u32) -> vec2<f32> {
  var canonical_center = center;
  if (boundary_axis == 1u) { canonical_center.x -= floor(center.x / viewport.x) * viewport.x; }
  if (boundary_axis == 2u) { canonical_center.y -= floor(center.y / viewport.y) * viewport.y; }
  var delta = pixel - canonical_center;
  if (boundary_axis == 1u) {
    let optimum = -conic.y * delta.y / conic.x;
    delta.x -= floor((delta.x - optimum) / viewport.x + 0.5) * viewport.x;
  }
  if (boundary_axis == 2u) {
    let optimum = -conic.y * delta.x / conic.z;
    delta.y -= floor((delta.y - optimum) / viewport.y + 0.5) * viewport.y;
  }
  return delta;
}
`;

export function boundaryTileContributionWGSL(): string {
  const test = tileContributionWGSL({
    center: "image_center",
    conic: "conic",
    powerThreshold: "power_threshold",
    tileX: "tile.x",
    tileY: "tile.y",
    onHit: "return true;",
  });
  return /* wgsl */ `
fn gaussian_boundary_tile_hit(center: vec2<f32>, conic: vec3<f32>, power_threshold: f32, radius: vec2<f32>, tile: vec2<i32>, viewport: vec2<f32>, boundary_axis: u32) -> bool {
  var canonical_center = center;
  var first_image = 0i;
  var last_image = 0i;
  if (boundary_axis != 0u) {
    let axis = boundary_axis - 1u;
    let period = viewport[axis];
    canonical_center[axis] -= floor(center[axis] / period) * period;
    let tile_start = f32(tile[axis]) * ${TILE_SIZE}.0;
    first_image = i32(ceil((tile_start - radius[axis] - canonical_center[axis]) / period));
    last_image = i32(floor((tile_start + ${TILE_SIZE}.0 + radius[axis] - canonical_center[axis]) / period));
  }
  for (var image = first_image; image <= last_image; image++) {
    var image_center = canonical_center;
    if (boundary_axis != 0u) { image_center[boundary_axis - 1u] += f32(image) * viewport[boundary_axis - 1u]; }
${test}
  }
  return false;
}
`;
}
