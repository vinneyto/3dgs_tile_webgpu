import { Vector3 } from "three/webgpu";

import { GaussianLod, type GaussianLodPacking } from "./GaussianLod";

export interface GaussianLodPackingContext {
  readonly lod: GaussianLod;
  readonly maxGaussians: number;
}

/** Selects a non-overlapping octree cell/LOD cut for a GaussianStore budget. */
export interface GaussianLodPackingStrategy {
  pack(context: GaussianLodPackingContext): GaussianLodPacking;
}

export interface RadialLodPackingRegion {
  /** Maximum cell-center distance divided by half the root-cell diagonal. */
  maxNormalizedRadius: number;
  /** LOD assigned while this radial phase has capacity. */
  lodLevel: number;
  /** Maximum total budget consumed after this phase, in (0, 1]. */
  cumulativeBudgetShare: number;
}

export interface RadialLodPackingOptions {
  /** Local-space focus point. Defaults to the tight object-bounds center. */
  center?: "bounds-center" | Vector3;
  /** Regions ordered from the center outwards. The final region must cover Infinity and 100% of the budget. */
  regions: readonly RadialLodPackingRegion[];
}

interface RadialCell {
  readonly nodeId: number;
  readonly radius: number;
}

/** Packs every leaf at the finest available LOD. */
export class MaximumLodPackingStrategy implements GaussianLodPackingStrategy {
  pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking {
    validateBudget(maxGaussians);
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

/**
 * Packs a continuous radial cut from the focus outwards. Higher-detail phases
 * consume their cumulative budget first. A cell that does not fit a phase is
 * retried at the next, lower LOD; cells beyond the final capacity are clipped.
 */
export class RadialLodPackingStrategy implements GaussianLodPackingStrategy {
  readonly center: "bounds-center" | Vector3;
  readonly regions: readonly Readonly<RadialLodPackingRegion>[];

  constructor(options: RadialLodPackingOptions) {
    this.center =
      options.center instanceof Vector3
        ? options.center.clone()
        : (options.center ?? "bounds-center");
    this.regions = validateRegions(options.regions);
  }

  pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking {
    validateBudget(maxGaussians);
    validateRegionLevels(this.regions, lod.levelCount);

    const focus =
      this.center instanceof Vector3
        ? this.center.clone()
        : lod.octree.bounds.getCenter(new Vector3());
    const rootSize = lod.octree.rootBounds.getSize(new Vector3());
    const halfDiagonal = Math.max(rootSize.length() * 0.5, Number.EPSILON);
    const cellCenter = new Vector3();
    const cells: RadialCell[] = Array.from(lod.octree.leafNodeIds, (nodeId) => {
      lod.octree.nodes[nodeId]!.bounds.getCenter(cellCenter);
      return {
        nodeId,
        radius: cellCenter.distanceTo(focus) / halfDiagonal,
      };
    });
    cells.sort(
      (left, right) => left.radius - right.radius || left.nodeId - right.nodeId,
    );

    const selectedNodeIds: number[] = [];
    const selectedLevels: number[] = [];
    let selectedCount = 0;
    let cursor = 0;

    for (const region of this.regions) {
      const phaseLimit = Math.floor(
        maxGaussians * region.cumulativeBudgetShare,
      );
      while (
        cursor < cells.length &&
        cells[cursor]!.radius <= region.maxNormalizedRadius
      ) {
        const cell = cells[cursor]!;
        const cost = lod.nodes[cell.nodeId]!.levelCounts[region.lodLevel]!;
        if (selectedCount + cost > phaseLimit) break;
        selectedNodeIds.push(cell.nodeId);
        selectedLevels.push(region.lodLevel);
        selectedCount += cost;
        cursor++;
      }
    }

    if (selectedNodeIds.length === 0) {
      throw new RangeError(
        `Radial LOD cannot fit its nearest coarsest cell in a budget of ${maxGaussians} Gaussians`,
      );
    }

    return {
      nodeIds: Uint32Array.from(selectedNodeIds),
      lodLevels: Uint8Array.from(selectedLevels),
      gaussianCount: selectedCount,
    };
  }
}

function validateRegions(
  regions: readonly RadialLodPackingRegion[],
): readonly Readonly<RadialLodPackingRegion>[] {
  if (regions.length === 0) {
    throw new RangeError("Radial LOD packing requires at least one region");
  }
  let previousRadius = -Infinity;
  let previousLevel = Infinity;
  let previousBudgetShare = 0;
  const result = regions.map(
    ({ maxNormalizedRadius, lodLevel, cumulativeBudgetShare }) => {
      if (!(maxNormalizedRadius > previousRadius)) {
        throw new RangeError("Radial LOD region radii must increase");
      }
      if (!Number.isInteger(lodLevel) || lodLevel < 0) {
        throw new RangeError(
          "Radial LOD region levels must be non-negative integers",
        );
      }
      if (lodLevel >= previousLevel) {
        throw new RangeError(
          "Radial LOD region levels must decrease away from the center",
        );
      }
      if (
        !(cumulativeBudgetShare > previousBudgetShare) ||
        cumulativeBudgetShare > 1
      ) {
        throw new RangeError(
          "Radial LOD cumulative budget shares must increase and stay in (0, 1]",
        );
      }
      previousRadius = maxNormalizedRadius;
      previousLevel = lodLevel;
      previousBudgetShare = cumulativeBudgetShare;
      return Object.freeze({
        maxNormalizedRadius,
        lodLevel,
        cumulativeBudgetShare,
      });
    },
  );
  if (previousRadius !== Infinity) {
    throw new RangeError("The final radial LOD region must end at Infinity");
  }
  if (Math.abs(previousBudgetShare - 1) > Number.EPSILON) {
    throw new RangeError(
      "The final radial LOD cumulative budget share must be 1",
    );
  }
  return Object.freeze(result);
}

function validateRegionLevels(
  regions: readonly Readonly<RadialLodPackingRegion>[],
  levelCount: number,
): void {
  for (const { lodLevel } of regions) {
    if (lodLevel >= levelCount) {
      throw new RangeError(`Gaussian LOD level ${lodLevel} does not exist`);
    }
  }
}

function validateBudget(maxGaussians: number): void {
  if (!Number.isInteger(maxGaussians) || maxGaussians <= 0) {
    throw new RangeError("Gaussian LOD budget must be a positive integer");
  }
}
