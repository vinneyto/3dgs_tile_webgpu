import { describe, expect, it } from "vitest";
import { readSandboxOptions } from "../sandbox/src/SandboxOptions";

describe("raster T experiment", () => {
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
