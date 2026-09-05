import { describe, expect, it } from "vitest";
import {
  evaluateShWGSL,
  projectionCovarianceWGSL,
  countContributingTilesWGSL,
} from "../src/kernels/projectionHelpers";
import { createEmitIntersectionsWGSL } from "../src/kernels/intersections";

describe("projectionWGSL antialias specialization", () => {
  it.each([8, 16])(
    "uses the same %i-pixel rectangles for count and emission",
    (size) => {
      const count = countContributingTilesWGSL(size);
      const emit = createEmitIntersectionsWGSL(size);
      const region = (source: string) =>
        source.slice(
          source.indexOf("let rect_min"),
          source.indexOf("if (contributes)"),
        );
      expect(region(count)).toEqual(region(emit));
      expect(count).toContain(`* ${size}.0`);
      expect(emit).toContain(`/ ${size}.0`);
    },
  );
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

describe("projectionWGSL SH specialization", () => {
  it("decodes packed RGB8E8 coefficients in the projection kernel", () => {
    const source = evaluateShWGSL("rgb8e8");

    expect(source).toContain("array<u32>");
    expect(source).toContain("unpack4x8snorm");
    expect(source).toContain("exp2(f32(exponent))");
  });

  it("retains the float32 path for unpacked GaussianData", () => {
    const source = evaluateShWGSL("float32");

    expect(source).toContain("array<vec4<f32>>");
    expect(source).not.toContain("unpack4x8snorm");
  });
});
