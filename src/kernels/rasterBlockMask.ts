/** Conservative minimum of the positive-definite conic over each 4x4 block.
 * The rectangle includes the full pixel cells, not only their centers.
 * Fail open for poorly conditioned conics; inflate the threshold for rounding.
 */
export function rasterBlockMaskWGSL(tileSize: 8 | 16): string {
  return /* wgsl */ `
fn raster_block_mask(center: vec2<f32>, conic: vec3<f32>, threshold: f32, origin: vec2<f32>) -> u32 {
  let a = conic.x;
  let b = conic.y;
  let c = conic.z;
  let determinant = a * c - b * b;
  if (!(a > 0.0 && c > 0.0 && determinant > 1e-5 * a * c)) { return 65535u; }
  var mask = 0u;
  for (var by = 0u; by < ${tileSize / 4}u; by++) {
    for (var bx = 0u; bx < ${tileSize / 4}u; bx++) {
      let lo = origin + vec2<f32>(f32(bx), f32(by)) * 4.0 - center;
      let hi = lo + vec2<f32>(4.0);
      var minimum = 0.0;
      if (!(lo.x <= 0.0 && hi.x >= 0.0 && lo.y <= 0.0 && hi.y >= 0.0)) {
        minimum = 3.402823e38;
        for (var edge = 0u; edge < 4u; edge++) {
          var p: vec2<f32>;
          if (edge < 2u) {
            let x = select(lo.x, hi.x, edge == 1u);
            p = vec2<f32>(x, clamp(-b * x / c, lo.y, hi.y));
          } else {
            let y = select(lo.y, hi.y, edge == 3u);
            p = vec2<f32>(clamp(-b * y / a, lo.x, hi.x), y);
          }
          // Use the same evaluation order as raster power, with a conservative margin.
          let q = 0.5 * (a * p.x * p.x + 2.0 * b * p.x * p.y + c * p.y * p.y);
          minimum = min(minimum, q);
        }
      }
      let magnitude = max(abs(lo), abs(hi));
      let rounding = 1e-4 * (1.0 + abs(threshold) + a * magnitude.x * magnitude.x + 2.0 * abs(b) * magnitude.x * magnitude.y + c * magnitude.y * magnitude.y);
      if (!(minimum > threshold + rounding)) {
        mask |= 1u << (by * ${tileSize / 4}u + bx);
      }
    }
  }
  return mask;
}
`;
}
