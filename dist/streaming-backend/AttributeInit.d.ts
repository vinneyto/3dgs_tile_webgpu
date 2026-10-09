export interface BufferAttributeSource {
    kind: "buffer";
    data: ArrayBuffer;
}
export interface FillAttributeSource {
    kind: "fill";
    value: "zeros" | "ones";
}
export type AttributeSource = BufferAttributeSource | FillAttributeSource;
/** Values indexed by source Gaussian, before selection and packing. */
export type MipmapAggregation = "weighted-mean" | "first" | "min" | "max";
export interface AttributeInit {
    name: string;
    format: "f32" | "u32";
    elementsPerGaussian: number;
    source: AttributeSource;
    /** Defaults to weighted-mean for f32, first for u32. */
    mipmapAggregation?: MipmapAggregation;
}
