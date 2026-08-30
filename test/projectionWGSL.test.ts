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

  it("uses projected opacity as the visibility predicate", () => {
    const source = projectionWGSL("compensated");

    expect(source).toContain("(*projected_mean)[gid] = vec4<f32>(0.0);");
    expect(source).not.toContain("visible_flags");
    expect(source.indexOf("scale_opacity.w <")).toBeLessThan(
      source.indexOf("let covariance_local"),
    );
  });

  it("loads the cloud ID from means.w and uses camera-specific object state", () => {
    const source = projectionWGSL("compensated");

    expect(source).toContain("let object_id = u32(mean_object.w);");
    expect(source).toContain(
      "let object_base = gaussian_count + object_id * 6u;",
    );
    expect(source).toContain("let model_view = mat4x4<f32>(");
    expect(source).not.toContain("model_view: mat4x4<f32>");
    expect(source).not.toContain("camera_local: vec4<f32>");
  });
});
