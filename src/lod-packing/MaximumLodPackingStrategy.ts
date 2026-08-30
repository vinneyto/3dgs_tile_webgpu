import type { GaussianLodPacking } from "../GaussianLod";
import {
  type GaussianLodPackingContext,
  type GaussianLodPackingStrategy,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";

/** Packs every leaf at the finest available LOD or fails if it does not fit. */
export class MaximumLodPackingStrategy implements GaussianLodPackingStrategy {
  pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking {
    validateGaussianLodBudget(maxGaussians);
    const sourceCount = lod.octree.data.count;
    if (maxGaussians < sourceCount) {
      throw new RangeError(
        `Maximum LOD requires ${sourceCount} Gaussians but the budget allows ${maxGaussians}`,
      );
    }
    const nodeIds = lod.octree.leafNodeIds.slice();
    const lodLevels = new Uint8Array(nodeIds.length);
    lodLevels.fill(lod.finestLevel);
    return { nodeIds, lodLevels, gaussianCount: sourceCount };
  }
}
