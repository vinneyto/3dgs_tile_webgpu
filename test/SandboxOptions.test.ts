import { describe, expect, it } from "vitest";
import { readSandboxOptions } from "../sandbox/src/SandboxOptions";

describe("raster T experiment", () => {
  it("supports all four independent tile/mask combinations", () => {
    for (const tileSize of [8, 16]) {
      for (const enabled of [false, true]) {
        const options = readSandboxOptions(
          new URLSearchParams(
            `tileSize=${tileSize}&blockMask=${enabled ? 1 : 0}`,
          ),
        );
        expect(options.pass.tileSize).toBe(tileSize);
        expect(options.pass.rasterBlockMask).toBe(enabled);
      }
    }
    const defaults = readSandboxOptions(new URLSearchParams());
    expect(defaults.pass.tileSize).toBe(8);
    expect(defaults.pass.rasterBlockMask).toBe(true);
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
