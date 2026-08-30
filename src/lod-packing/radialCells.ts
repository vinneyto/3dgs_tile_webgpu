import { Vector3 } from "three/webgpu";

import type { GaussianLod } from "../GaussianLod";

export type GaussianLodPackingCenter = "bounds-center" | Vector3;

export interface RadialLodCell {
  readonly nodeId: number;
  readonly radius: number;
}

export function radialLodCells(
  lod: GaussianLod,
  configuredCenter: GaussianLodPackingCenter,
): RadialLodCell[] {
  const focus =
    configuredCenter instanceof Vector3
      ? configuredCenter.clone()
      : lod.octree.bounds.getCenter(new Vector3());
  const rootSize = lod.octree.rootBounds.getSize(new Vector3());
  const halfDiagonal = Math.max(rootSize.length() * 0.5, Number.EPSILON);
  const cellCenter = new Vector3();
  const cells = Array.from(lod.octree.leafNodeIds, (nodeId) => {
    lod.octree.nodes[nodeId]!.bounds.getCenter(cellCenter);
    return {
      nodeId,
      radius: cellCenter.distanceTo(focus) / halfDiagonal,
    };
  });
  cells.sort(
    (left, right) => left.radius - right.radius || left.nodeId - right.nodeId,
  );
  return cells;
}
