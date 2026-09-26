export interface WriteAttributeRangeCommand {
  type: "write-attribute-range";
  id: string;
  cloudId: string;
  attribute: string;
  /** Source-cloud index, not the packed scene slot. */
  firstGaussian: number;
  gaussianCount: number;
  data: ArrayBuffer;
}
