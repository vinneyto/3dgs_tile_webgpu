import { Vector3 } from "three/webgpu";

import { GaussianLod, type GaussianLodPacking } from "./GaussianLod";

export interface GaussianLodPackingContext {
  readonly lod: GaussianLod;
  readonly maxGaussians: number;
}

export type GaussianLodPackingStrategy = (
  context: GaussianLodPackingContext,
) => GaussianLodPacking;

export interface RadialLodPackingRegion {
  /** Maximum distance divided by half of the root-cell diagonal. */
  maxNormalizedRadius: number;
  /** Fraction of the total object budget assigned to this region. */
  budgetShare: number;
}

export interface RadialLodPackingOptions {
  /** Local-space focus point. Defaults to the tight object-bounds center. */
  center?: "bounds-center" | Vector3;
  /** Regions ordered from the center outwards. */
  regions: readonly RadialLodPackingRegion[];
  /** Reassign unused regional budget from inner to outer cells. Defaults to true. */
  redistributeUnusedBudget?: boolean;
}

interface CellSelection {
  readonly nodeId: number;
  readonly region: number;
  readonly radius: number;
  level: number;
}

/** Pack every leaf at the finest available LOD, reproducing full-detail behavior. */
export function createMaximumLodPackingStrategy(): GaussianLodPackingStrategy {
  return ({ lod, maxGaussians }) => {
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
  };
}

/**
 * Assign a budget to concentric local-space regions and refine cells nearest
 * the focus first. Every leaf is represented by at least the coarsest LOD.
 */
export function createRadialLodPackingStrategy(
  options: RadialLodPackingOptions,
): GaussianLodPackingStrategy {
  const regions = validateRegions(options.regions);
  const explicitCenter =
    options.center instanceof Vector3 ? options.center.clone() : null;
  const redistribute = options.redistributeUnusedBudget ?? true;

  return ({ lod, maxGaussians }) => {
    validateBudget(maxGaussians);
    const focus =
      explicitCenter?.clone() ?? lod.octree.bounds.getCenter(new Vector3());
    const rootSize = lod.octree.rootBounds.getSize(new Vector3());
    const halfDiagonal = Math.max(rootSize.length() * 0.5, Number.EPSILON);
    const cells: CellSelection[] = [];
    const center = new Vector3();
    for (const nodeId of lod.octree.leafNodeIds) {
      const node = lod.octree.nodes[nodeId]!;
      node.bounds.getCenter(center);
      const radius = center.distanceTo(focus) / halfDiagonal;
      cells.push({
        nodeId,
        region: findRegion(regions, radius),
        radius,
        level: 0,
      });
    }
    cells.sort(
      (left, right) =>
        left.region - right.region ||
        left.radius - right.radius ||
        left.nodeId - right.nodeId,
    );

    const regionCounts = new Uint32Array(regions.length);
    let selectedCount = 0;
    for (const cell of cells) {
      const count = lod.nodes[cell.nodeId]!.levelCounts[0]!;
      selectedCount += count;
      regionCounts[cell.region] = regionCounts[cell.region]! + count;
    }
    if (selectedCount > maxGaussians) {
      throw new RangeError(
        `Coarsest radial LOD requires ${selectedCount} Gaussians but the budget allows ${maxGaussians}`,
      );
    }

    const regionTargets = distributeBudget(maxGaussians, regions);
    for (let region = 0; region < regions.length; region++) {
      const target = Math.max(regionTargets[region]!, regionCounts[region]!);
      const result = refineRegion(
        lod,
        cells,
        region,
        Math.min(target - regionCounts[region]!, maxGaussians - selectedCount),
      );
      selectedCount += result.used;
      regionCounts[region] = regionCounts[region]! + result.used;
    }

    if (redistribute && selectedCount < maxGaussians) {
      let remaining = maxGaussians - selectedCount;
      let madeProgress = true;
      while (remaining > 0 && madeProgress) {
        madeProgress = false;
        for (const cell of cells) {
          const nextLevel = cell.level + 1;
          if (nextLevel >= lod.levelCount) continue;
          const counts = lod.nodes[cell.nodeId]!.levelCounts;
          const cost = counts[nextLevel]! - counts[cell.level]!;
          if (cost > remaining) continue;
          cell.level = nextLevel;
          remaining -= cost;
          selectedCount += cost;
          madeProgress = true;
        }
      }
    }

    cells.sort((left, right) => left.nodeId - right.nodeId);
    return {
      nodeIds: Uint32Array.from(cells.map((cell) => cell.nodeId)),
      lodLevels: Uint8Array.from(cells.map((cell) => cell.level)),
      gaussianCount: selectedCount,
    };
  };
}

function refineRegion(
  lod: GaussianLod,
  cells: readonly CellSelection[],
  region: number,
  available: number,
): { used: number } {
  let used = 0;
  for (let targetLevel = 1; targetLevel < lod.levelCount; targetLevel++) {
    for (const cell of cells) {
      if (cell.region !== region || cell.level !== targetLevel - 1) continue;
      const counts = lod.nodes[cell.nodeId]!.levelCounts;
      const cost = counts[targetLevel]! - counts[cell.level]!;
      if (used + cost > available) continue;
      cell.level = targetLevel;
      used += cost;
    }
  }
  return { used };
}

function distributeBudget(
  maxGaussians: number,
  regions: readonly RadialLodPackingRegion[],
): Uint32Array {
  const result = new Uint32Array(regions.length);
  let assigned = 0;
  for (let index = 0; index < regions.length - 1; index++) {
    const count = Math.floor(maxGaussians * regions[index]!.budgetShare);
    result[index] = count;
    assigned += count;
  }
  result[result.length - 1] = maxGaussians - assigned;
  return result;
}

function findRegion(
  regions: readonly RadialLodPackingRegion[],
  radius: number,
): number {
  const index = regions.findIndex(
    ({ maxNormalizedRadius }) => radius <= maxNormalizedRadius,
  );
  return index < 0 ? regions.length - 1 : index;
}

function validateRegions(
  regions: readonly RadialLodPackingRegion[],
): readonly RadialLodPackingRegion[] {
  if (regions.length === 0) {
    throw new RangeError("Radial LOD packing requires at least one region");
  }
  let previousRadius = -Infinity;
  let shareTotal = 0;
  const result = regions.map(({ maxNormalizedRadius, budgetShare }) => {
    if (!(maxNormalizedRadius > previousRadius)) {
      throw new RangeError("Radial LOD region radii must increase");
    }
    if (!(budgetShare >= 0 && budgetShare <= 1)) {
      throw new RangeError("Radial LOD budgetShare must be in [0, 1]");
    }
    previousRadius = maxNormalizedRadius;
    shareTotal += budgetShare;
    return Object.freeze({ maxNormalizedRadius, budgetShare });
  });
  if (previousRadius !== Infinity) {
    throw new RangeError("The final radial LOD region must end at Infinity");
  }
  if (Math.abs(shareTotal - 1) > 1e-6) {
    throw new RangeError("Radial LOD budget shares must sum to 1");
  }
  return Object.freeze(result);
}

function validateBudget(maxGaussians: number): void {
  if (!Number.isInteger(maxGaussians) || maxGaussians <= 0) {
    throw new RangeError("Gaussian LOD budget must be a positive integer");
  }
}
