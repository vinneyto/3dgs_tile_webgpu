import { describe, expect, it } from "vitest";
import { rasterizationWGSL } from "../src/kernels/rasterization";

describe("rasterizationWGSL", () => {
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
});
