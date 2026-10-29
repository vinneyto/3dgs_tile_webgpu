import type { SparkExtSplats } from "./SparkWasmContract";
import type { PackedAttributeBuffer } from "../streaming-backend/PackedAttributeBuffer";
/** Same shared-exponent/sign representation as spark-lib::encode_ext_rgb. */
export declare function packSparkRgb(r: number, g: number, b: number): number;
/** One-time layout adaptation in the worker; shapes/SH are never unpacked and repacked per view. */
export declare function packSparkAttributes(data: SparkExtSplats, objectId: number, degree: number): PackedAttributeBuffer[];
