import { Vector3, type Camera, type Object3D } from "three/webgpu";

import type { GaussianLod } from "../GaussianLod";

export type GaussianLodPackingCenter = "bounds-center" | Vector3;

export interface RadialLodCell {
  readonly nodeId: number;
  readonly radius: number;
}

export function cameraPositionInLocalSpace(
  camera: Camera,
  localSpace: Object3D,
  target: Vector3,
): Vector3 {
  camera.updateWorldMatrix(true, false);
  localSpace.updateWorldMatrix(true, false);
  camera.getWorldPosition(target);
  return localSpace.worldToLocal(target);
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
