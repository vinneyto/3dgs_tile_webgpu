export type GaussianShFormat = "float32" | "rgb8e8";
export declare const FLOAT32_SH_BYTES_PER_COEFFICIENT = 16;
export declare const RGB8E8_SH_BYTES_PER_COEFFICIENT = 4;
/** Pack one signed RGB SH coefficient into three snorm8 mantissas and a shared exponent. */
export declare function packShRgb8e8(red: number, green: number, blue: number): number;
/** CPU reference decoder used by conversion paths and tests. */
export declare function unpackShRgb8e8(packed: number): readonly [red: number, green: number, blue: number];
export declare function shBytesPerCoefficient(format: GaussianShFormat): number;
