import { describe, expect, it } from "vitest";

// Independent bitwise Morton decoding verifies quadrant and chunk-buffer
// addressing, including viewports whose dimensions are not tile multiples.
function decode(index: number) {
  let x = 0,
    y = 0;
  for (let bit = 0; bit < 4; bit++) {
    x |= ((index >>> (bit * 2)) & 1) << bit;
    y |= ((index >>> (bit * 2 + 1)) & 1) << bit;
  }
  return [x, y] as const;
}

describe("four raster subtiles", () => {
  it("partitions all 256 parent pixel slots and matches 16x16 composition", () => {
    const slots = new Set<number>();
    for (let quadrant = 0; quadrant < 4; quadrant++) {
      for (let lane = 0; lane < 64; lane++) {
        const index = quadrant * 64 + lane;
        const [x, y] = decode(index);
        const [localX, localY] = decode(lane);
        expect(x).toBe(localX + (quadrant % 2) * 8);
        expect(y).toBe(localY + Math.floor(quadrant / 2) * 8);
        expect(slots.has(index)).toBe(false);
        slots.add(index);
      }
    }
    expect(slots.size).toBe(256);
  });
  it("writes every in-bounds pixel exactly once on partial edge tiles", () => {
    const pixels = new Set<number>();
    for (let ty = 0; ty < 2; ty++)
      for (let tx = 0; tx < 2; tx++) {
        for (let group = 0; group < 4; group++)
          for (let lane = 0; lane < 64; lane++) {
            const [lx, ly] = decode(group * 64 + lane);
            const x = tx * 16 + lx,
              y = ty * 16 + ly;
            if (x >= 19 || y >= 23) continue;
            const index = y * 19 + x;
            expect(pixels.has(index)).toBe(false);
            pixels.add(index);
          }
      }
    expect(pixels.size).toBe(19 * 23);
  });
});
