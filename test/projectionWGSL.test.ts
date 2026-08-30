import { describe, expect, it } from "vitest";
import { projectionCovarianceWGSL } from "../src/kernels/projectionHelpers";

describe("projectionWGSL antialias specialization", () => {
  it("preserves subpixel energy in compensated mode", () => {
    const source = projectionCovarianceWGSL("compensated");

    expect(source).toContain("max(sigma00_unfiltered * sigma11_unfiltered");
  });

  it("keeps the classic fixed-opacity low-pass mode", () => {
    const source = projectionCovarianceWGSL("classic");

    expect(source).toContain("let original_determinant = 1.0;");
  });

  it("keeps covariance and projection in one substantial WGSL helper", () => {
    const source = projectionCovarianceWGSL("compensated");

    expect(source).toContain("let covariance_local");
    expect(source).toContain("let covariance_view");
    expect(source).toContain("let conic = vec3<f32>");
    expect(source).toContain("return mat4x4<f32>(");
  });
});
