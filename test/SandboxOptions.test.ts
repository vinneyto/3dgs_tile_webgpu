import { describe, expect, it } from "vitest";
import { readSandboxOptions } from "../sandbox/src/SandboxOptions";

describe("sandbox raster options", () => {
  it("allows disabling the subgroup raster experiment independently of radix", () => {
    expect(readSandboxOptions(new URLSearchParams()).pass.rasterSubgroups).toBe(
      true,
    );
    const options = readSandboxOptions(
      new URLSearchParams("rasterSubgroups=0&radix=subgroup"),
    );
    expect(options.pass.rasterSubgroups).toBe(false);
    expect(options.pass.radixBackend).toBe("subgroup");
  });
  it("selects hardware rendering explicitly", () => {
    expect(readSandboxOptions(new URLSearchParams()).rendererMode).toBe(
      "tiled",
    );
    expect(
      readSandboxOptions(new URLSearchParams("renderer=hardware")).rendererMode,
    ).toBe("hardware");
  });
  it("keeps work counters independent of kernel timings", () => {
    expect(
      readSandboxOptions(new URLSearchParams("profile=kernels")).pass
        .rasterStats,
    ).toBe(false);
    const options = readSandboxOptions(
      new URLSearchParams("rasterStats=1&stats=0"),
    );
    expect(options.pass.rasterStats).toBe(true);
    expect(options.pass.profileKernels).toBe(false);
    expect(options.statsEnabled).toBe(true);
  });
  it("defaults to 0.0001 and supports an explicit experiment without profiling", () => {
    expect(
      readSandboxOptions(new URLSearchParams()).pass
        .rasterTransmittanceThreshold,
    ).toBe(0.0001);
    const options = readSandboxOptions(new URLSearchParams("rasterT=0.001"));
    expect(options.pass.rasterTransmittanceThreshold).toBe(0.001);
    expect(options.profileEnabled).toBe(false);
  });
  it.each(["0", "-1", "1", "NaN", "Infinity", ""])(
    "rejects invalid threshold %s",
    (value) => {
      expect(
        readSandboxOptions(new URLSearchParams({ rasterT: value })).pass
          .rasterTransmittanceThreshold,
      ).toBe(0.0001);
    },
  );
});
