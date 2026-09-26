import type { Command } from "./Command";

export interface WriteAttributeRangeCommand extends Command<"write-attribute-range"> {
  cloudId: string;
  attribute: string;
  /** Source-cloud index, not the packed scene slot. */
  firstGaussian: number;
  gaussianCount: number;
  data: ArrayBuffer;
}
