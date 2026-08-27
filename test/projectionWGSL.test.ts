import { describe, expect, it } from "vitest";
import { projectionWGSL } from "../src/kernels/projection";

describe("projectionWGSL antialias specialization", () => {
  it("preserves subpixel energy in compensated mode", () => {
    const source = projectionWGSL("compensated");

    expect(source).toContain("original_determinant");
    expect(source).toContain("opacity_compensation");
    expect(source).toContain("if (opacity < (1.0 / 255.0))");
  });

  it("keeps the classic fixed-opacity low-pass mode", () => {
    const source = projectionWGSL("classic");

    expect(source).not.toContain("original_determinant");
    expect(source).not.toContain("opacity_compensation");
    expect(source).toContain("let opacity = clamp(scale_opacity.w, 0.0, 1.0);");
  });
});
