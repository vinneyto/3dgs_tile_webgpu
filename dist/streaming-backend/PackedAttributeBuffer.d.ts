export interface PackedAttributeBuffer {
    name: string;
    format: "f32" | "u32";
    elementsPerGaussian: number;
    data: ArrayBuffer;
}
