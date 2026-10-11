import { describe, expect, it } from "vitest";
import {
  evaluateShWGSL,
  perspectiveProjectionWGSL,
  projectionResultWGSL,
  viewCovarianceWGSL,
} from "../src/renderer/kernels/projectionHelpers";

describe("generic projection helpers", () => {
  it("uses one covariance stabilization helper for custom and default projections", () => {
    expect(perspectiveProjectionWGSL).toContain(
      "return gaussian_projection_result(center, depth, covariance, filter_variance)",
    );
    expect(projectionResultWGSL).toContain("covariance.x + filter_variance");
    expect(projectionResultWGSL).toContain(
      "max(covariance.x * covariance.z - covariance.y * covariance.y, 0.0)",
    );
    expect(projectionResultWGSL).toContain("let conic = vec3<f32>");
  });
  it("confines perspective clipping to the default projection", () => {
    expect(perspectiveProjectionWGSL).toContain(
      "depth > viewport.z && depth < viewport.w",
    );
    expect(projectionResultWGSL).not.toContain("viewport");
    expect(viewCovarianceWGSL).toContain(
      "local_to_view * covariance_local * transpose(local_to_view)",
    );
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
