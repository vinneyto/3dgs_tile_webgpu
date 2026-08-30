import type { GaussianLod, GaussianLodPacking } from "../GaussianLod";

export interface GaussianLodPackingContext {
  readonly lod: GaussianLod;
  readonly maxGaussians: number;
}

/** Selects a non-overlapping octree cell/LOD cut for a GaussianStore budget. */
export interface GaussianLodPackingStrategy {
  pack(context: GaussianLodPackingContext): GaussianLodPacking;
}

export function validateGaussianLodBudget(maxGaussians: number): void {
  if (!Number.isInteger(maxGaussians) || maxGaussians <= 0) {
    throw new RangeError("Gaussian LOD budget must be a positive integer");
  }
}
