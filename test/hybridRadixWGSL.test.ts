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
import {
  RADIX_BLOCK_ITEMS,
  RADIX_ELEMENTS_PER_THREAD,
} from "../src/pipeline/constants";

describe("hybrid depth/tile radix pipeline", () => {
  it("processes four records per thread with subgroup-stable scatter", () => {
    expect(RADIX_ELEMENTS_PER_THREAD).toBe(4);
    expect(RADIX_BLOCK_ITEMS).toBe(1024);
    expect(radixHistogramWGSL(0)).toContain("subgroupAdd(local_count)");
    expect(radixScatterWGSL(0)).toContain("subgroupExclusiveAdd(matches)");
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
});
