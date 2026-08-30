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

export interface RadialLodPackingOptions {
  /** Local-space focus point. Defaults to the tight object-bounds center. */
  center?: "bounds-center" | Vector3;
  /** One LOD used for every selected cell. Defaults to the finest level. */
  lodLevel?: number | "finest";
}

interface RadialCell {
  readonly nodeId: number;
  readonly radius: number;
}

/** Packs every leaf at the finest available LOD or fails if it does not fit. */
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
 * Packs one fixed LOD as a continuous radial cut from the focus outwards.
 * Selection stops when the next whole leaf cell exceeds the capacity.
 */
export class RadialLodPackingStrategy implements GaussianLodPackingStrategy {
  readonly center: "bounds-center" | Vector3;
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
    validateBudget(maxGaussians);
    const lodLevel =
      this.lodLevel === "finest" ? lod.finestLevel : this.lodLevel;
    if (lodLevel >= lod.levelCount) {
      throw new RangeError(`Gaussian LOD level ${lodLevel} does not exist`);
    }

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
    let selectedCount = 0;
    for (const cell of cells) {
      const cost = lod.nodes[cell.nodeId]!.levelCounts[lodLevel]!;
      if (selectedCount + cost > maxGaussians) break;
      selectedNodeIds.push(cell.nodeId);
      selectedCount += cost;
    }

    if (selectedNodeIds.length === 0) {
      throw new RangeError(
        `Radial LOD ${lodLevel} cannot fit its nearest cell in a budget of ${maxGaussians} Gaussians`,
      );
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

function validateBudget(maxGaussians: number): void {
  if (!Number.isInteger(maxGaussians) || maxGaussians <= 0) {
    throw new RangeError("Gaussian LOD budget must be a positive integer");
  }
}
