import { describe, expect, it } from "vitest";
import { profileSubpixelCoverageWGSL } from "../src/kernels/profileDiagnostics";
import { estimateTileCap, summarizeTileLoads } from "../src/utils/profileStats";

describe("profile diagnostics", () => {
  it("summarizes emitted intersections per tile", () => {
    const stats = summarizeTileLoads(
      new Uint32Array([0, 0, 10, 266, 779, 1_804, 3_853]),
    );

    expect(stats).toEqual({
      max: 2_049,
      mean: 3_853 / 6,
      median: 384.5,
      p95: 2_049,
      p99: 2_049,
      tilesOver256: 3,
      tilesOver512: 3,
      tilesOver1024: 2,
      tilesOver2048: 1,
      totalBatches: 19,
      maxBatches: 9,
    });
  });

  it("handles an empty tile-offset array", () => {
    expect(summarizeTileLoads(new Uint32Array())).toEqual({
      max: 0,
      mean: 0,
      median: 0,
      p95: 0,
      p99: 0,
      tilesOver256: 0,
      tilesOver512: 0,
      tilesOver1024: 0,
      tilesOver2048: 0,
      totalBatches: 0,
      maxBatches: 0,
    });
  });

  it("estimates raster-only tile caps", () => {
    expect(
      estimateTileCap(new Uint32Array([0, 100, 2_100, 7_100]), 2_048),
    ).toEqual({
      cap: 2_048,
      rasterizedIntersections: 4_148,
      droppedIntersections: 2_952,
      droppedFraction: 2_952 / 7_100,
      affectedTiles: 1,
      totalBatches: 17,
      maxBatches: 8,
    });
  });

  it("tests subpixel support against actual pixel centers", () => {
    expect(profileSubpixelCoverageWGSL).toContain("extent.x * 2.0 > 1.0");
    expect(profileSubpixelCoverageWGSL).toContain(
      "f32(pixel_x) + 0.5, f32(pixel_y) + 0.5",
    );
    expect(profileSubpixelCoverageWGSL).toContain(
      "(*zero_pixel_flags)[index] = select(1u, 0u, has_sample)",
    );
    expect(profileSubpixelCoverageWGSL).toContain("mean.w < 0.0");
  });
});
