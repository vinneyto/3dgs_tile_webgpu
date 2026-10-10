import type { AttributeInit } from "./AttributeInit";
import type { MipmapConfig } from "./MipmapConfig";
export type GaussianFileFormat =
  "auto" | "ply" | "splat" | "ksplat" | "spz" | "sog" | "rad";
export interface CloudLoadOptions {
  name?: string;
  /** Initial object-to-world transform used for the first view-dependent cut. */
  worldMatrix?: readonly number[];
  priority?: number;
  mipmaps?: MipmapConfig;
  attributes?: readonly AttributeInit[];
  format?: GaussianFileFormat;
  /** Helps detect formats in buffers or URLs without an extension. */
  fileName?: string;
}
