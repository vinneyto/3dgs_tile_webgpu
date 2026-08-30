import { Vector3 } from "three/webgpu";

import type { GaussianLodPacking } from "../GaussianLod";
import {
  type GaussianLodPackingContext,
  type GaussianLodPackingStrategy,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";
import { type GaussianLodPackingCenter, radialLodCells } from "./radialCells";

export interface RadialLodPackingOptions {
  /** Local-space focus point. Defaults to the tight object-bounds center. */
  center?: GaussianLodPackingCenter;
  /** One LOD used for every selected cell. Defaults to the finest level. */
  lodLevel?: number | "finest";
}

/**
 * Packs one fixed LOD as a continuous radial cut from the focus outwards.
 * Selection stops when the next whole leaf cell exceeds the capacity.
 */
export class RadialLodPackingStrategy implements GaussianLodPackingStrategy {
  readonly center: GaussianLodPackingCenter;
  readonly lodLevel: number | "finest";

  constructor(options: RadialLodPackingOptions = {}) {
    this.center =
      options.center instanceof Vector3
        ? options.center.clone()
        : (options.center ?? "bounds-center");
    if (
      options.lodLevel !== undefined &&
      options.lodLevel !== "finest" &&
      (!Number.isInteger(options.lodLevel) || options.lodLevel < 0)
    ) {
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"',
      );
    }
    this.lodLevel = options.lodLevel ?? "finest";
  }

  pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking {
    validateGaussianLodBudget(maxGaussians);
    if (maxGaussians === 0) return emptyPacking();
    const lodLevel =
      this.lodLevel === "finest" ? lod.finestLevel : this.lodLevel;
    if (lodLevel >= lod.levelCount) {
      throw new RangeError(`Gaussian LOD level ${lodLevel} does not exist`);
    }

    const cells = radialLodCells(lod, this.center);

    const selectedNodeIds: number[] = [];
    let selectedCount = 0;
    for (const cell of cells) {
      const cost = lod.nodes[cell.nodeId]!.levelCounts[lodLevel]!;
      if (selectedCount + cost > maxGaussians) break;
      selectedNodeIds.push(cell.nodeId);
      selectedCount += cost;
    }

    const lodLevels = new Uint8Array(selectedNodeIds.length);
    lodLevels.fill(lodLevel);
    return {
      nodeIds: Uint32Array.from(selectedNodeIds),
      lodLevels,
      gaussianCount: selectedCount,
    };
  }
}

function emptyPacking(): GaussianLodPacking {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0,
  };
}
