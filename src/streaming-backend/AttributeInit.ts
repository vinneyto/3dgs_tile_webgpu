/** Values indexed by source Gaussian, before selection and packing. */
export interface AttributeInit {
  name: string;
  format: "f32" | "u32";
  elementsPerGaussian: number;
  source:
    | { kind: "buffer"; data: ArrayBuffer }
    | { kind: "fill"; value: "zeros" | "ones" };
}
