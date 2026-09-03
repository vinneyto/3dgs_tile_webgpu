import { describe, expect, it } from "vitest";

import {
  FLOAT32_SH_BYTES_PER_COEFFICIENT,
  RGB8E8_SH_BYTES_PER_COEFFICIENT,
  packShRgb8e8,
  shBytesPerCoefficient,
  unpackShRgb8e8,
} from "../src/GaussianSh";

describe("RGB8E8 spherical harmonics", () => {
  it("uses four bytes per RGB coefficient", () => {
    expect(RGB8E8_SH_BYTES_PER_COEFFICIENT).toBe(4);
    expect(FLOAT32_SH_BYTES_PER_COEFFICIENT).toBe(16);
    expect(shBytesPerCoefficient("rgb8e8")).toBe(4);
    expect(shBytesPerCoefficient("float32")).toBe(16);
  });

  it("round-trips zero and representative signed coefficients", () => {
    const coefficients = [
      [0, 0, 0],
      [1, -0.5, 0.25],
      [-3.75, 2.125, 0.03125],
      [1e-4, -2e-4, 3e-4],
    ] as const;

    for (const input of coefficients) {
      const decoded = unpackShRgb8e8(
        packShRgb8e8(input[0], input[1], input[2]),
      );
      const maximum = Math.max(...input.map(Math.abs));
      const tolerance =
        maximum === 0 ? 0 : 2 ** Math.ceil(Math.log2(maximum)) / 127;
      input.forEach((value, channel) => {
        expect(Math.abs(decoded[channel]! - value)).toBeLessThanOrEqual(
          tolerance + Number.EPSILON,
        );
      });
    }
  });

  it("rejects non-finite coefficients", () => {
    expect(() => packShRgb8e8(Number.NaN, 0, 0)).toThrow(/finite/);
    expect(() => packShRgb8e8(0, Number.POSITIVE_INFINITY, 0)).toThrow(
      /finite/,
    );
  });
});
