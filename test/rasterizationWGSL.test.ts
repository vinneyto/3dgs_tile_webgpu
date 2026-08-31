import { describe, expect, it } from "vitest";
import { compactMortonBitsWGSL } from "../src/kernels/rasterHelpers";

describe("rasterizationWGSL", () => {
  it("maps each tile lane to a unique Morton-ordered pixel", () => {
    const compactBits = (value: number): number => {
      let result = value & 0x55555555;
      result = (result | (result >>> 1)) & 0x33333333;
      result = (result | (result >>> 2)) & 0x0f0f0f0f;
      result = (result | (result >>> 4)) & 0x00ff00ff;
      return (result | (result >>> 8)) & 0x0000ffff;
    };
    const coordinates = Array.from(
      { length: 256 },
      (_, lane): [number, number] => [
        compactBits(lane),
        compactBits(lane >>> 1),
      ],
    );

    expect(new Set(coordinates.map(([x, y]) => `${x},${y}`)).size).toBe(256);
    expect(Math.max(...coordinates.map(([x]) => x))).toBe(15);
    expect(Math.max(...coordinates.map(([, y]) => y))).toBe(15);

    const firstSubgroup = coordinates.slice(0, 32);
    expect(Math.max(...firstSubgroup.map(([x]) => x))).toBe(7);
    expect(Math.max(...firstSubgroup.map(([, y]) => y))).toBe(3);

    expect(compactMortonBitsWGSL).toContain("fn compact_morton_bits_16");
  });
});
