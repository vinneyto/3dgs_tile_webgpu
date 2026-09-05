import { describe, expect, it } from "vitest";
import { readSandboxOptions } from "../sandbox/src/SandboxOptions";

describe("raster T experiment", () => {
  it("enables split raster workgroups only with the dedicated flag", () => {
    expect(readSandboxOptions(new URLSearchParams()).pass.rasterSubtiles).toBe(
      false,
    );
    expect(
      readSandboxOptions(new URLSearchParams("rasterSubtiles=1")).pass
        .rasterSubtiles,
    ).toBe(true);
    expect(
      readSandboxOptions(
        new URLSearchParams("rasterSubtiles=0&tileSize=8&blockMask=1"),
      ).pass.rasterSubtiles,
    ).toBe(false);
  });
  it("defaults to 0.001 and supports the original baseline without profiling", () => {
    expect(
      readSandboxOptions(new URLSearchParams()).pass
        .rasterTransmittanceThreshold,
    ).toBe(0.001);
    const options = readSandboxOptions(new URLSearchParams("rasterT=0.0001"));
    expect(options.pass.rasterTransmittanceThreshold).toBe(0.0001);
    expect(options.profileEnabled).toBe(false);
  });
  it.each(["0", "-1", "1", "NaN", "Infinity", ""])(
    "rejects invalid threshold %s",
    (value) => {
      expect(
        readSandboxOptions(new URLSearchParams({ rasterT: value })).pass
          .rasterTransmittanceThreshold,
      ).toBe(0.001);
    },
  );
});
