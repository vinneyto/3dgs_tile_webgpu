import { Vector3 } from "three/webgpu";

import type { GaussianLodPacking } from "../GaussianLod";
import {
  type CameraDrivenGaussianLodPackingStrategy,
  type GaussianLodPackingContext,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";
import { type GaussianLodPackingCenter, radialLodCells } from "./radialCells";

export interface DistanceAwareRadialLodPackingOptions {
  /** Local-space camera/focus point. Defaults to the tight bounds center. */
  center?: GaussianLodPackingCenter;
  /**
   * Distance, measured in octree-root half-diagonals, between adjacent LOD
   * levels. Defaults to 2.
   */
  levelDistance?: number;
}

/**
 * Selects LOD from distance to a local-space focus while enforcing a strict
 * Gaussian budget. Farther cells are degraded first when the desired packing
 * does not fit; if the coarsest representation still exceeds the budget, its
 * farthest cells are clipped.
 */
export class DistanceAwareRadialLodPackingStrategy implements CameraDrivenGaussianLodPackingStrategy {
  readonly cameraDriven = true as const;
  center: GaussianLodPackingCenter;
  readonly levelDistance: number;

  constructor(options: DistanceAwareRadialLodPackingOptions = {}) {
    this.center =
      options.center instanceof Vector3
        ? options.center.clone()
        : (options.center ?? "bounds-center");
    this.levelDistance = options.levelDistance ?? 2;
    if (!(this.levelDistance > 0) || !Number.isFinite(this.levelDistance)) {
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive",
      );
    }
  }

  setCenter(center: GaussianLodPackingCenter): this {
    this.center = center instanceof Vector3 ? center.clone() : center;
    return this;
  }

  pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking {
    validateGaussianLodBudget(maxGaussians);
    if (maxGaussians === 0) return emptyPacking();

    const cells = radialLodCells(lod, this.center);
    const levels = cells.map(({ radius }) =>
      Math.max(0, lod.finestLevel - Math.floor(radius / this.levelDistance)),
    );
    let selectedCount = cells.reduce(
      (count, cell, index) =>
        count + lod.nodes[cell.nodeId]!.levelCounts[levels[index]!]!,
      0,
    );

    // Preserve the closest detail and turn excess capacity into concentric
    // LOD tiers by degrading the farthest cells first.
    for (
      let index = cells.length - 1;
      index >= 0 && selectedCount > maxGaussians;
      index--
    ) {
      const node = lod.nodes[cells[index]!.nodeId]!;
      while (levels[index]! > 0 && selectedCount > maxGaussians) {
        const previousCount = node.levelCounts[levels[index]!]!;
        levels[index] = levels[index]! - 1;
        selectedCount -= previousCount - node.levelCounts[levels[index]!]!;
      }
    }

    // A budget below the complete coarsest representation keeps a continuous
    // nearest-cell prefix, matching the other radial packing strategies.
    let selectedLength = cells.length;
    while (selectedLength > 0 && selectedCount > maxGaussians) {
      selectedLength--;
      const node = lod.nodes[cells[selectedLength]!.nodeId]!;
      selectedCount -= node.levelCounts[levels[selectedLength]!]!;
    }

    return {
      nodeIds: Uint32Array.from(
        cells.slice(0, selectedLength).map(({ nodeId }) => nodeId),
      ),
      lodLevels: Uint8Array.from(levels.slice(0, selectedLength)),
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
