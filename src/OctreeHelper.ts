import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  type ColorRepresentation,
} from "three/webgpu";

import type { GaussianOctree } from "./GaussianOctree";

export interface OctreeHelperOptions {
  color?: ColorRepresentation;
  opacity?: number;
  /** Draw only terminal cells. Defaults to false. */
  leavesOnly?: boolean;
  minDepth?: number;
  maxDepth?: number;
  /** Defaults to false so the complete local grid remains visible. */
  depthTest?: boolean;
}

/** Local-space wireframe visualization of a GaussianOctree. */
export class OctreeHelper extends LineSegments<
  BufferGeometry,
  LineBasicMaterial
> {
  readonly isOctreeHelper = true;
  readonly cellCount: number;

  constructor(
    readonly octree: GaussianOctree,
    options: OctreeHelperOptions = {},
  ) {
    const minDepth = options.minDepth ?? 0;
    const maxDepth = options.maxDepth ?? Infinity;
    const nodes = octree.nodes.filter(
      (node) =>
        node.depth >= minDepth &&
        node.depth <= maxDepth &&
        (options.leavesOnly !== true || node.isLeaf),
    );
    const positions = new Float32Array(nodes.length * 12 * 2 * 3);
    let offset = 0;
    for (const node of nodes) {
      const { min, max } = node.bounds;
      const corners = [
        [min.x, min.y, min.z],
        [max.x, min.y, min.z],
        [max.x, max.y, min.z],
        [min.x, max.y, min.z],
        [min.x, min.y, max.z],
        [max.x, min.y, max.z],
        [max.x, max.y, max.z],
        [min.x, max.y, max.z],
      ] as const;
      for (const [start, end] of BOX_EDGES) {
        positions.set(corners[start], offset);
        positions.set(corners[end], offset + 3);
        offset += 6;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    const opacity = options.opacity ?? 0.55;
    const material = new LineBasicMaterial({
      color: options.color ?? 0x75a7ff,
      opacity,
      transparent: opacity < 1,
      depthTest: options.depthTest ?? false,
      depthWrite: false,
      toneMapped: false,
    });
    super(geometry, material);
    this.cellCount = nodes.length;
    this.name = "Gaussian octree helper";
    this.frustumCulled = false;
    this.renderOrder = 1_000;
  }

  dispose(): void {
    this.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }
}

const BOX_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;
