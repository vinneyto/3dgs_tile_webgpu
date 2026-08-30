import { Vector3 } from "three/webgpu";

import type { GaussianLodPacking } from "../GaussianLod";
import {
  type GaussianLodPackingContext,
  type GaussianLodPackingStrategy,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";

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
    validateGaussianLodBudget(maxGaussians);
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
