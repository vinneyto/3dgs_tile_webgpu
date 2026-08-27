import { beforeAll, describe, expect, it, vi } from "vitest";
import { GaussianData } from "../src/GaussianData";

const STORAGE = 0x80;

function buffer(size: number, usage = STORAGE): GPUBuffer {
  return { size, usage, destroy: vi.fn() } as unknown as GPUBuffer;
}

beforeAll(() => {
  Object.defineProperty(globalThis, "GPUBufferUsage", {
    configurable: true,
    value: { STORAGE },
  });
});

describe("GaussianData", () => {
  it("accepts externally owned canonical buffers", () => {
    const data = new GaussianData(
      {
        means: buffer(32),
        scalesOpacity: buffer(32),
        rotations: buffer(32),
        shCoefficients: buffer(32 * 16),
      },
      { count: 2, shDegree: 3 },
    );
    expect(data.shCoefficientCount).toBe(16);
    data.dispose();
    expect(data.means.destroy).not.toHaveBeenCalled();
  });

  it("rejects undersized or non-storage buffers", () => {
    const valid = buffer(16);
    expect(
      () =>
        new GaussianData(
          {
            means: buffer(12),
            scalesOpacity: valid,
            rotations: valid,
            shCoefficients: valid,
          },
          { count: 1 },
        ),
    ).toThrow(/means buffer/);
    expect(
      () =>
        new GaussianData(
          {
            means: buffer(16, 0),
            scalesOpacity: valid,
            rotations: valid,
            shCoefficients: valid,
          },
          { count: 1 },
        ),
    ).toThrow(/GPUBufferUsage.STORAGE/);
  });

  it("destroys owned buffers exactly once", () => {
    const buffers = {
      means: buffer(16),
      scalesOpacity: buffer(16),
      rotations: buffer(16),
      shCoefficients: buffer(16),
    };
    const data = new GaussianData(buffers, { count: 1, ownsBuffers: true });
    data.dispose();
    data.dispose();
    for (const value of Object.values(buffers))
      expect(value.destroy).toHaveBeenCalledOnce();
  });
});
