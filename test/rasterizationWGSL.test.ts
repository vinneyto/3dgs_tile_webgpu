import { describe, expect, it } from "vitest";
import { rasterizationWGSL } from "../src/kernels/rasterization";

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

    const source = rasterizationWGSL("float32", false);
    expect(source.trimStart()).toMatch(/^fn rasterize_tiles_float32\(/);
    expect(source).toContain("compact_morton_bits_16(local_index)");
    expect(source).toContain("compact_morton_bits_16(local_index >> 1u)");
  });

  it("rejects insignificant contributions before exp", () => {
    const source = rasterizationWGSL("float32", false);
    const threshold = source.indexOf("log(mean.w * 255.0)");
    const rejection = source.indexOf(
      "power > 0.0 || power < -conic_and_threshold.w",
    );
    const exponential = source.indexOf("mean.w * exp(power)");

    expect(threshold).toBeGreaterThan(-1);
    expect(rejection).toBeGreaterThan(threshold);
    expect(exponential).toBeGreaterThan(rejection);
    expect(source).toContain("if (alpha < (1.0 / 255.0))");
  });

  it("uses one atomic counter for whole-tile completion", () => {
    const source = rasterizationWGSL("float32", false);

    expect(source).toContain(
      "shared_done: ptr<workgroup, array<atomic<u32>, 1>>",
    );
    expect(source).toContain("atomicStore(&(*shared_done)[0], 0u)");
    expect(source).toContain("atomicAdd(&(*shared_done)[0], 1u)");
    expect(source).toContain("atomicLoad(&(*shared_done)[0])");
    expect(source).toContain("if (done_count == 256u) { break; }");
    expect(source).toContain("if (batch_start + 256u >= end) { break; }");
    expect(source).not.toContain("shared_active");
    expect(source).not.toContain("lane_offset");
    expect(source).not.toContain("subgroup_active");
  });
});
