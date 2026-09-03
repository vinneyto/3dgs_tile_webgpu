import type { Vector3 } from "three/webgpu";

import type { GaussianLod, GaussianLodPacking } from "../GaussianLod";

export interface GaussianLodPackingContext {
  readonly lod: GaussianLod;
  readonly maxGaussians: number;
}

/** Selects a non-overlapping octree cell/LOD cut for a GaussianStore budget. */
export interface GaussianLodPackingStrategy {
  /** Explicit opt-in for strategies whose focus follows the render camera. */
  readonly cameraDriven?: boolean;
  pack(context: GaussianLodPackingContext): GaussianLodPacking;
}

/** A packing strategy whose local-space focus can follow the render camera. */
export interface CameraDrivenGaussianLodPackingStrategy extends GaussianLodPackingStrategy {
  readonly cameraDriven: true;
  setCenter(center: Vector3): this;
}

export function isCameraDrivenGaussianLodPackingStrategy(
  strategy: GaussianLodPackingStrategy,
): strategy is CameraDrivenGaussianLodPackingStrategy {
  return strategy.cameraDriven === true;
}

export function validateGaussianLodBudget(maxGaussians: number): void {
  if (!Number.isInteger(maxGaussians) || maxGaussians < 0) {
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
  }
}
