import type { FullRaycastOctreeBuffers } from "../streaming-backend/FullRaycastOctreeBuffers";
import type { GaussianOctree } from "./GaussianOctree";

/** Clone only the arrays needed by a synchronous client-side raycast. */
export function createRaycastSnapshot(
  octree: GaussianOctree,
): FullRaycastOctreeBuffers {
  const nodes = octree.nodes;
  const nodeBounds = new Float32Array(nodes.length * 7);
  const nodeChildren = new Uint32Array(nodes.length * 2);
  const nodeIndices = new Uint32Array(nodes.length * 2);
  const children: number[] = [];
  const indices: number[] = [];
  for (const node of nodes) {
    const offset = node.id * 7;
    const { min, max } = node.raycastBounds;
    nodeBounds.set(
      [min.x, min.y, min.z, max.x, max.y, max.z, node.maxSplatRadius],
      offset,
    );
    nodeChildren.set([children.length, node.children.length], node.id * 2);
    children.push(...node.children);
    nodeIndices.set(
      [indices.length, node.gaussianIndices?.length ?? 0],
      node.id * 2,
    );
    if (node.gaussianIndices !== null) {
      for (const index of node.gaussianIndices) indices.push(index);
    }
  }
  const data = octree.data;
  return {
    means: Float32Array.from(data.means.array).buffer,
    scalesOpacity: Float32Array.from(data.scalesOpacity.array).buffer,
    rotations: Float32Array.from(data.rotations.array).buffer,
    nodeBounds: nodeBounds.buffer,
    nodeChildren: nodeChildren.buffer,
    children: Uint32Array.from(children).buffer,
    nodeIndices: nodeIndices.buffer,
    indices: Uint32Array.from(indices).buffer,
  };
}
