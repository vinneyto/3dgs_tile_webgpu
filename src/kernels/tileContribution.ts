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
