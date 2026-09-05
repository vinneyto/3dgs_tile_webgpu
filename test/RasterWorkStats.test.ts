import { describe, expect, it, vi } from "vitest";
import { TileRasterizer } from "../src/pipeline/TileRasterizer";

describe("raster work readback", () => {
  it("sums tile counters using CPU numbers without frame-wide uint overflow", async () => {
    const raster = Object.create(TileRasterizer.prototype);
    raster.metrics = {};
    raster.renderer = {
      getArrayBufferAsync: vi
        .fn()
        .mockResolvedValue(
          new Uint32Array([
            3_000_000_000, 200, 256, 100, 3_000_000_000, 300, 128, 50,
          ]).buffer,
        ),
    };
    expect(await raster.readWorkStats()).toEqual({
      checked: 6_000_000_000,
      blended: 500,
      pixels: 384,
      alphaStopped: 150,
    });
  });

  it("does not read a GPU buffer when profiling is disabled", async () => {
    const raster = Object.create(TileRasterizer.prototype);
    raster.metrics = null;
    raster.renderer = { getArrayBufferAsync: vi.fn() };
    expect(await raster.readWorkStats()).toBeNull();
    expect(raster.renderer.getArrayBufferAsync).not.toHaveBeenCalled();
  });
});
