import { describe, expect, it } from "vitest";
import { CanonicalGaussianPlyLoader } from "../sandbox/src/CanonicalGaussianPlyLoader";

describe("CanonicalGaussianPlyLoader", () => {
  it("activates scales and opacity, converts wxyz, and interleaves SH channels", () => {
    const properties = [
      "x",
      "y",
      "z",
      "f_dc_0",
      "f_dc_1",
      "f_dc_2",
      "opacity",
      "scale_0",
      "scale_1",
      "scale_2",
      "rot_0",
      "rot_1",
      "rot_2",
      "rot_3",
      ...Array.from({ length: 9 }, (_, index) => `f_rest_${index}`),
    ];
    const header = [
      "ply",
      "format ascii 1.0",
      "element vertex 1",
      ...properties.map((name) => `property float ${name}`),
      "end_header",
    ];
    const values = [
      1,
      2,
      3,
      10,
      20,
      30,
      0,
      Math.log(2),
      Math.log(3),
      Math.log(4),
      2,
      0,
      0,
      0,
      ...Array.from({ length: 9 }, (_, index) => 100 + index),
    ];
    const source = `${header.join("\n")}\n${values.join(" ")}\n`;
    const encoded = new TextEncoder().encode(source);
    const buffer = encoded.buffer.slice(
      encoded.byteOffset,
      encoded.byteOffset + encoded.byteLength,
    ) as ArrayBuffer;

    const data = new CanonicalGaussianPlyLoader().parse(buffer);

    expect(data.count).toBe(1);
    expect(data.shDegree).toBe(1);
    expect(Array.from(data.means.array)).toEqual([1, 2, 3, 0]);
    expect(Array.from(data.scalesOpacity.array)).toEqual([
      expect.closeTo(2, 5),
      expect.closeTo(3, 5),
      expect.closeTo(4, 5),
      0.5,
    ]);
    expect(Array.from(data.rotations.array)).toEqual([0, 0, 0, 1]);
    expect(Array.from(data.shCoefficients.array)).toEqual([
      10, 20, 30, 0, 100, 103, 106, 0, 101, 104, 107, 0, 102, 105, 108, 0,
    ]);
    data.dispose();
  });

  it("reads canonical binary little-endian vertex data", () => {
    const properties = [
      "x",
      "y",
      "z",
      "f_dc_0",
      "f_dc_1",
      "f_dc_2",
      "opacity",
      "scale_0",
      "scale_1",
      "scale_2",
      "rot_0",
      "rot_1",
      "rot_2",
      "rot_3",
    ];
    const header = new TextEncoder().encode(
      [
        "ply",
        "format binary_little_endian 1.0",
        "element vertex 1",
        ...properties.map((name) => `property float ${name}`),
        "end_header",
        "",
      ].join("\n"),
    );
    const values = [1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 1, 0, 0, 0];
    const buffer = new ArrayBuffer(header.byteLength + values.length * 4);
    new Uint8Array(buffer).set(header);
    const view = new DataView(buffer);
    values.forEach((value, index) => {
      view.setFloat32(header.byteLength + index * 4, value, true);
    });

    const data = new CanonicalGaussianPlyLoader().parse(buffer);

    expect(data.shDegree).toBe(0);
    expect(Array.from(data.means.array)).toEqual([1, 2, 3, 0]);
    expect(Array.from(data.scalesOpacity.array)).toEqual([1, 1, 1, 0.5]);
    expect(Array.from(data.rotations.array)).toEqual([0, 0, 0, 1]);
    expect(Array.from(data.shCoefficients.array)).toEqual([4, 5, 6, 0]);
    data.dispose();
  });
});
