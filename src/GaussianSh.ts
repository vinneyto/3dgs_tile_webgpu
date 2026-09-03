export type GaussianShFormat = "float32" | "rgb8e8";

export const FLOAT32_SH_BYTES_PER_COEFFICIENT = 16;
export const RGB8E8_SH_BYTES_PER_COEFFICIENT = 4;

/** Pack one signed RGB SH coefficient into three snorm8 mantissas and a shared exponent. */
export function packShRgb8e8(red: number, green: number, blue: number): number {
  const maximum = Math.max(Math.abs(red), Math.abs(green), Math.abs(blue));
  if (!Number.isFinite(maximum)) {
    throw new RangeError("SH coefficients must be finite");
  }
  if (maximum === 0) return 0;

  const exponent = Math.min(127, Math.max(-126, Math.ceil(Math.log2(maximum))));
  const multiplier = 127 / 2 ** exponent;
  const redByte = quantizeSnorm8(red, multiplier);
  const greenByte = quantizeSnorm8(green, multiplier);
  const blueByte = quantizeSnorm8(blue, multiplier);
  const exponentByte = exponent + 127;
  return (
    (redByte | (greenByte << 8) | (blueByte << 16) | (exponentByte << 24)) >>> 0
  );
}

/** CPU reference decoder used by conversion paths and tests. */
export function unpackShRgb8e8(
  packed: number,
): readonly [red: number, green: number, blue: number] {
  const scale = 2 ** ((packed >>> 24) - 127) / 127;
  return [
    signedByte(packed) * scale,
    signedByte(packed >>> 8) * scale,
    signedByte(packed >>> 16) * scale,
  ];
}

export function shBytesPerCoefficient(format: GaussianShFormat): number {
  return format === "rgb8e8"
    ? RGB8E8_SH_BYTES_PER_COEFFICIENT
    : FLOAT32_SH_BYTES_PER_COEFFICIENT;
}

function quantizeSnorm8(value: number, multiplier: number): number {
  return Math.min(127, Math.max(-127, Math.round(value * multiplier))) & 0xff;
}

function signedByte(value: number): number {
  const byte = value & 0xff;
  return byte < 128 ? byte : byte - 256;
}
