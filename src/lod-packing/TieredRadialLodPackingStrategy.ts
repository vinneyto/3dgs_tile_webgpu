import { Vector3 } from "three/webgpu";

import type { GaussianLodPacking } from "../GaussianLod";
import {
  type CameraDrivenGaussianLodPackingStrategy,
  type GaussianLodPackingContext,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";
import { type GaussianLodPackingCenter, radialLodCells } from "./radialCells";

export interface TieredRadialLodPackingOptions {
  /** Local-space focus point. Defaults to the tight object-bounds center. */
  center?: GaussianLodPackingCenter;
  /** Finest, middle and coarsest shares. Defaults to [0.8, 0.1, 0.1]. */
  budgetShares?: readonly [number, number, number];
}

/**
 * Packs concentric finest, middle and coarsest LOD tiers. If the complete
 * finest representation fits, it is returned without degrading outer cells.
 */
export class TieredRadialLodPackingStrategy implements CameraDrivenGaussianLodPackingStrategy {
  readonly cameraDriven = true as const;
  center: GaussianLodPackingCenter;
  readonly budgetShares: readonly [number, number, number];

  constructor(options: TieredRadialLodPackingOptions = {}) {
    this.center =
      options.center instanceof Vector3
        ? options.center.clone()
        : (options.center ?? "bounds-center");
    this.budgetShares = validateBudgetShares(
      options.budgetShares ?? [0.8, 0.1, 0.1],
    );
  }

  setCenter(center: GaussianLodPackingCenter): this {
    this.center = center instanceof Vector3 ? center.clone() : center;
    return this;
  }

  pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking {
    validateGaussianLodBudget(maxGaussians);
    if (maxGaussians === 0) return emptyPacking();

    const sourceCount = lod.octree.data.count;
    if (sourceCount <= maxGaussians) {
      const nodeIds = lod.octree.leafNodeIds.slice();
      const lodLevels = new Uint8Array(nodeIds.length);
      lodLevels.fill(lod.finestLevel);
      return { nodeIds, lodLevels, gaussianCount: sourceCount };
    }

    const cells = radialLodCells(lod, this.center);
    const levels = [
      lod.finestLevel,
      Math.max(0, lod.finestLevel - 1),
      0,
    ] as const;
    const selectedNodeIds: number[] = [];
    const selectedLevels: number[] = [];
    let selectedCount = 0;
    let cursor = 0;
    let cumulativeShare = 0;

    for (let tier = 0; tier < levels.length; tier++) {
      const share = this.budgetShares[tier]!;
      cumulativeShare += share;
      if (share === 0) continue;
      const tierLimit =
        tier === levels.length - 1
          ? maxGaussians
          : Math.floor(maxGaussians * cumulativeShare);
      const level = levels[tier]!;
      while (cursor < cells.length) {
        const cell = cells[cursor]!;
        const cost = lod.nodes[cell.nodeId]!.levelCounts[level]!;
        if (selectedCount + cost > tierLimit) break;
        selectedNodeIds.push(cell.nodeId);
        selectedLevels.push(level);
        selectedCount += cost;
        cursor++;
      }
    }

    return {
      nodeIds: Uint32Array.from(selectedNodeIds),
      lodLevels: Uint8Array.from(selectedLevels),
      gaussianCount: selectedCount,
    };
  }
}

function validateBudgetShares(
  shares: readonly [number, number, number],
): readonly [number, number, number] {
  let total = 0;
  for (const share of shares) {
    if (!(share >= 0 && share <= 1)) {
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    }
    total += share;
  }
  if (Math.abs(total - 1) > 1e-6) {
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  }
  return Object.freeze([...shares]) as unknown as readonly [
    number,
    number,
    number,
  ];
}

function emptyPacking(): GaussianLodPacking {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0,
  };
}
