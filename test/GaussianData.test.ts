import { describe, expect, it, vi } from "vitest";
import { StorageBufferAttribute } from "three/webgpu";
import { GaussianData } from "../src/GaussianData";

function attribute(items: number, itemSize = 4): StorageBufferAttribute {
  return new StorageBufferAttribute(
    new Float32Array(items * itemSize),
    itemSize,
  );
}

function uintAttribute(items: number): StorageBufferAttribute {
  return new StorageBufferAttribute(new Uint32Array(items), 1);
}

describe("GaussianData", () => {
  it("accepts shareable Three.js storage attributes", () => {
    const data = new GaussianData(
      {
        means: attribute(2),
        scalesOpacity: attribute(2),
        rotations: attribute(2),
        shCoefficients: attribute(2 * 16),
      },
      { count: 2, shDegree: 3 },
    );
    expect(data.shCoefficientCount).toBe(16);
    expect(data.means.isStorageBufferAttribute).toBe(true);
  });

  it("rejects undersized or non-vec4 attributes", () => {
    const valid = attribute(1);
    expect(
      () =>
        new GaussianData(
          {
            means: attribute(1, 3),
            scalesOpacity: valid,
            rotations: valid,
            shCoefficients: valid,
          },
          { count: 1 },
        ),
    ).toThrow(/itemSize 4/);
    expect(
      () =>
        new GaussianData(
          {
            means: attribute(1),
            scalesOpacity: valid,
            rotations: valid,
            shCoefficients: attribute(1),
          },
          { count: 1, shDegree: 1 },
        ),
    ).toThrow(/at least 4/);
  });

  it("accepts packed rgb8e8 SH and rejects representation mismatches", () => {
    const buffers = {
      means: attribute(2),
      scalesOpacity: attribute(2),
      rotations: attribute(2),
      shCoefficients: uintAttribute(2 * 4),
    };
    const packed = new GaussianData(buffers, {
      count: 2,
      shDegree: 1,
      shFormat: "rgb8e8",
    });
    expect(packed.shFormat).toBe("rgb8e8");
    expect(packed.shCoefficients.itemSize).toBe(1);

    expect(
      () =>
        new GaussianData(
          { ...buffers, shCoefficients: attribute(2 * 4) },
          { count: 2, shDegree: 1, shFormat: "rgb8e8" },
        ),
    ).toThrow(/itemSize.*expected 1/);
    expect(
      () =>
        new GaussianData(
          { ...buffers, shCoefficients: uintAttribute(2 * 4) },
          { count: 2, shDegree: 1, shFormat: "float32" },
        ),
    ).toThrow(/itemSize.*expected 4/);
  });

  it("disposes owned attributes exactly once", () => {
    const buffers = {
      means: attribute(1),
      scalesOpacity: attribute(1),
      rotations: attribute(1),
      shCoefficients: attribute(1),
    };
    for (const value of Object.values(buffers)) {
      vi.spyOn(value, "dispose");
    }
    const data = new GaussianData(buffers, { count: 1, ownsBuffers: true });
    data.dispose();
    data.dispose();
    for (const value of Object.values(buffers)) {
      expect(value.dispose).toHaveBeenCalledOnce();
    }
  });
});
