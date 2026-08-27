import { describe, expect, it } from "vitest";
import {
  radixHistogramWGSL,
  radixScatterWGSL,
  reduceRadixHistogramsWGSL,
  scanAddRadixHistogramsWGSL,
  scanRadixReducedWGSL,
} from "../src/kernels/radix";
import { emitIntersectionsWGSL } from "../src/kernels/intersections";
import { projectionWGSL } from "../src/kernels/projection";
import { scanBlocksWGSL, scanVisibilityBlocksWGSL } from "../src/kernels/scan";
import {
  RADIX_BLOCK_ITEMS,
  RADIX_ELEMENTS_PER_THREAD,
} from "../src/pipeline/constants";

describe("depth/tile radix pipeline", () => {
  it("processes four records per thread with subgroup-stable scatter", () => {
    expect(RADIX_ELEMENTS_PER_THREAD).toBe(4);
    expect(RADIX_BLOCK_ITEMS).toBe(1024);
    expect(radixHistogramWGSL(0)).toContain("subgroupAdd(local_count)");
    expect(radixScatterWGSL(0)).toContain("subgroupExclusiveAdd(matches)");
    expect(radixScatterWGSL(0)).not.toMatch(/\btarget\b/);
  });

  it("uses the five Brush-style stages", () => {
    expect(reduceRadixHistogramsWGSL).toContain("reduce_radix_histograms");
    expect(scanRadixReducedWGSL).toContain("scan_radix_reduced");
    expect(scanAddRadixHistogramsWGSL).toContain("scan_add_radix_histograms");
  });

  it("shares the conservative tile contribution test", () => {
    const projection = projectionWGSL("compensated");
    expect(projection).toContain("contributes = sigma <= power_threshold");
    expect(emitIntersectionsWGSL).toContain(
      "contributes = sigma <= power_threshold",
    );
  });

  it("stays within the default eight-storage-buffer stage limit", () => {
    expect(projectionWGSL("compensated").match(/ptr<storage/g)).toHaveLength(8);
    expect(emitIntersectionsWGSL.match(/ptr<storage/g)).toHaveLength(8);
  });

  it("scans projected opacity into compact visibility offsets", () => {
    expect(scanBlocksWGSL).toContain("fn scan_blocks(");
    expect(scanBlocksWGSL).toContain(
      "input_values: ptr<storage, array<u32>, read>",
    );
    expect(scanBlocksWGSL).toContain(
      "select(0u, (*input_values)[first], first < length)",
    );

    expect(scanVisibilityBlocksWGSL).toContain("fn scan_visibility_blocks(");
    expect(scanVisibilityBlocksWGSL).toContain(
      "input_values: ptr<storage, array<vec4<f32>>, read>",
    );
    expect(scanVisibilityBlocksWGSL).toContain(
      "(*input_values)[first].w > 0.0",
    );
    expect(scanVisibilityBlocksWGSL).not.toContain("array<u32>, read>");
  });
});
