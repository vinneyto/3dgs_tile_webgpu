import { DataUtils } from "three";
import type { SparkExtSplats } from "./SparkWasmContract";
import type { PackedAttributeBuffer } from "../streaming-backend/PackedAttributeBuffer";

/** Same shared-exponent/sign representation as spark-lib::encode_ext_rgb. */
export function packSparkRgb(r: number, g: number, b: number): number {
  const maximum = Math.max(Math.abs(r), Math.abs(g), Math.abs(b));
  if (maximum === 0) return 0;
  const base = Math.min(31, Math.max(0, Math.ceil(Math.log2(maximum)) + 15));
  const divisor = 2 ** (base - 15) / 255;
  const byte = (value: number) =>
    Math.min(255, Math.round(Math.abs(value) / divisor));
  const signs = (r < 0 ? 1 : 0) | (g < 0 ? 2 : 0) | (b < 0 ? 4 : 0);
  return (
    (byte(r) |
      (byte(g) << 8) |
      (byte(b) << 16) |
      (((base << 3) | signs) << 24)) >>>
    0
  );
}

/** One-time layout adaptation in the worker; shapes/SH are never unpacked and repacked per view. */
export function packSparkAttributes(
  data: SparkExtSplats,
  objectId: number,
  degree: number,
): PackedAttributeBuffer[] {
  const n = data.numSplats,
    coefficients = (degree + 1) ** 2;
  const means = new Float32Array(n * 4);
  const extFloats = new Float32Array(
    data.ext0.buffer,
    data.ext0.byteOffset,
    data.ext0.length,
  );
  const shape = new Uint32Array(n * 2),
    rotations = new Uint32Array(n);
  const sh = new Uint32Array(n * coefficients);
  for (let i = 0; i < n; i++) {
    const p = i * 4,
      q = i * 2,
      c = i * coefficients;
    means[p] = extFloats[p]!;
    means[p + 1] = extFloats[p + 1]!;
    means[p + 2] = extFloats[p + 2]!;
    means[p + 3] = objectId;
    // Bit-preserving rearrangement of upstream float16 logarithms and opacity.
    shape[q] =
      (data.ext1[p + 1]! >>> 16) | ((data.ext1[p + 2]! & 0xffff) << 16);
    shape[q + 1] =
      (data.ext1[p + 2]! >>> 16) | ((data.ext0[p + 3]! & 0xffff) << 16);
    rotations[i] = data.ext1[p + 3]!;
    sh[c] = packSparkRgb(
      DataUtils.fromHalfFloat(data.ext1[p]! & 0xffff),
      DataUtils.fromHalfFloat(data.ext1[p]! >>> 16),
      DataUtils.fromHalfFloat(data.ext1[p + 1]! & 0xffff),
    );
    if (data.maxShDegree >= 1)
      for (let k = 0; k < 3; k++) sh[c + 1 + k] = data.sh1![p + k]!;
    if (data.maxShDegree >= 2) {
      sh[c + 4] = data.sh1![p + 3]!;
      for (let k = 0; k < 4; k++) sh[c + 5 + k] = data.sh2![p + k]!;
    }
    if (data.maxShDegree >= 3) {
      for (let k = 0; k < 4; k++) sh[c + 9 + k] = data.sh3a![p + k]!;
      for (let k = 0; k < 3; k++) sh[c + 13 + k] = data.sh3b![p + k]!;
    }
  }
  const levels = new Uint32Array(n);
  if (data.lodTree)
    for (let i = n - 1; i >= 0; i--) {
      const start = data.lodTree[i * 4 + 3]!,
        count = data.lodTree[i * 4 + 2]! & 0xffff;
      for (let child = start; child < start + count; child++)
        levels[i] = Math.max(levels[i]!, levels[child]! + 1);
    }
  return [
    {
      name: "mipmapLevel",
      format: "u32",
      elementsPerGaussian: 1,
      data: levels.buffer,
    },
    {
      name: "means",
      format: "f32",
      elementsPerGaussian: 4,
      data: means.buffer,
    },
    {
      name: "scalesOpacity",
      format: "u32",
      elementsPerGaussian: 2,
      data: shape.buffer,
    },
    {
      name: "rotations",
      format: "u32",
      elementsPerGaussian: 1,
      data: rotations.buffer,
    },
    {
      name: "shCoefficients",
      format: "u32",
      elementsPerGaussian: coefficients,
      data: sh.buffer,
    },
  ];
}
