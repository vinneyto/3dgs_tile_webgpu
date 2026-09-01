import { Vector3, type Ray } from "three/webgpu";

import {
  GaussianOctree,
  type GaussianOctreeRaycastHit,
  type GaussianOctreeRaycastOptions,
} from "./GaussianOctree";

export interface GaussianLodLevelOptions {
  /** Fraction of a node's most important Gaussians retained by this level. */
  retention: number;
}

export interface GaussianLodBuildOptions {
  /** Levels ordered from coarsest to finest. The final retention must be 1. */
  levels?: readonly GaussianLodLevelOptions[];
  /** Dispose the supplied octree with this object. Defaults to false. */
  ownsOctree?: boolean;
  /** Optional static importance function used to order Gaussians in every cell. */
  importance?: (gaussianIndex: number, octree: GaussianOctree) => number;
}

export interface GaussianLodPacking {
  readonly nodeIds: Uint32Array;
  readonly lodLevels: Uint8Array;
  readonly gaussianCount: number;
}

/**
 * LOD representations for one leaf cell, stored as nested prefixes. Internal
 * octree nodes keep an empty representation so source indices are not copied
 * into every ancestor.
 */
export class GaussianLodNode {
  constructor(
    readonly octreeNodeId: number,
    readonly sortedGaussianIndices: Uint32Array,
    readonly levelCounts: Uint32Array,
  ) {}
}

const DEFAULT_LEVELS: readonly GaussianLodLevelOptions[] = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 },
];

/** Leaf-cell LOD representations built over a GaussianOctree. */
export class GaussianLod {
  static build(
    octree: GaussianOctree,
    options: GaussianLodBuildOptions = {},
  ): GaussianLod {
    return new GaussianLod(octree, options);
  }

  readonly levels: readonly GaussianLodLevelOptions[];
  readonly nodes: readonly GaussianLodNode[];

  private readonly ownsOctree: boolean;
  private disposed = false;

  private constructor(
    readonly octree: GaussianOctree,
    options: GaussianLodBuildOptions,
  ) {
    this.levels = validateLevels(options.levels ?? DEFAULT_LEVELS);
    this.ownsOctree = options.ownsOctree ?? false;
    const importance = options.importance ?? defaultImportance;
    const scores = new Float64Array(octree.data.count);
    for (let index = 0; index < scores.length; index++) {
      const score = importance(index, octree);
      scores[index] = Number.isFinite(score) ? score : -Infinity;
    }

    this.nodes = octree.nodes.map((octreeNode) => {
      if (octreeNode.gaussianIndices === null) {
        return new GaussianLodNode(
          octreeNode.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length),
        );
      }
      const sortedIndices = Uint32Array.from(
        Array.from(octreeNode.gaussianIndices).sort(
          (left, right) => scores[right]! - scores[left]! || left - right,
        ),
      );
      return new GaussianLodNode(
        octreeNode.id,
        sortedIndices,
        Uint32Array.from(
          this.levels.map(({ retention }) =>
            Math.min(
              sortedIndices.length,
              Math.max(1, Math.ceil(sortedIndices.length * retention)),
            ),
          ),
        ),
      );
    });
  }

  get levelCount(): number {
    return this.levels.length;
  }

  get finestLevel(): number {
    return this.levels.length - 1;
  }

  getNode(nodeId: number): GaussianLodNode {
    this.assertUsable();
    const node = this.nodes[nodeId];
    if (node === undefined) {
      throw new RangeError(`GaussianLod node ${nodeId} does not exist`);
    }
    return node;
  }

  /** Expand a compact cell/level packing into source Gaussian indices. */
  indicesForPacking(packing: GaussianLodPacking): Uint32Array {
    this.assertUsable();
    if (packing.nodeIds.length !== packing.lodLevels.length) {
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    }

    const result = new Uint32Array(packing.gaussianCount);
    const selectedNodes = new Set<number>();
    let destination = 0;
    for (let entry = 0; entry < packing.nodeIds.length; entry++) {
      const nodeId = packing.nodeIds[entry]!;
      const node = this.getLeafNode(nodeId);
      if (selectedNodes.has(nodeId)) {
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${nodeId}`,
        );
      }
      selectedNodes.add(nodeId);
      const level = packing.lodLevels[entry]!;
      const count = node.levelCounts[level];
      if (count === undefined) {
        throw new RangeError(`GaussianLod level ${level} does not exist`);
      }
      if (destination + count > result.length) {
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      }
      for (let local = 0; local < count; local++) {
        result[destination++] = node.sortedGaussianIndices[local]!;
      }
    }
    if (destination !== result.length) {
      throw new RangeError(
        `GaussianLodPacking declares ${result.length} Gaussians but selects ${destination}`,
      );
    }
    return result;
  }

  raycast(
    ray: Ray,
    packing: GaussianLodPacking,
    options: GaussianOctreeRaycastOptions = {},
  ): GaussianOctreeRaycastHit[] {
    this.assertUsable();
    const radiusScale = options.radiusScale ?? 3;
    if (!(radiusScale > 0)) {
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive",
      );
    }
    const maxHits = options.maxHits ?? Infinity;
    if (!(maxHits > 0)) return [];
    if (packing.nodeIds.length !== packing.lodLevels.length) {
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    }

    const means = this.octree.data.means.array as Float32Array;
    const scalesOpacity = this.octree.data.scalesOpacity.array as Float32Array;
    const center = new Vector3();
    const closest = new Vector3();
    const hits: GaussianOctreeRaycastHit[] = [];
    const selectedNodes = new Set<number>();
    for (let entry = 0; entry < packing.nodeIds.length; entry++) {
      const nodeId = packing.nodeIds[entry]!;
      const lodNode = this.getLeafNode(nodeId);
      if (selectedNodes.has(nodeId)) {
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${nodeId}`,
        );
      }
      selectedNodes.add(nodeId);
      const level = packing.lodLevels[entry]!;
      const count = lodNode.levelCounts[level];
      if (count === undefined) {
        throw new RangeError(`GaussianLod level ${level} does not exist`);
      }
      const octreeNode = this.octree.nodes[nodeId]!;
      const expansion =
        Math.max(0, radiusScale - 3) * octreeNode.maxSplatRadius;
      const hitBounds =
        expansion === 0
          ? octreeNode.raycastBounds
          : octreeNode.raycastBounds.clone().expandByScalar(expansion);
      if (!ray.intersectsBox(hitBounds)) continue;
      for (let local = 0; local < count; local++) {
        const gaussianIndex = lodNode.sortedGaussianIndices[local]!;
        const offset = gaussianIndex * 4;
        center.set(means[offset]!, means[offset + 1]!, means[offset + 2]!);
        const radius =
          Math.max(
            scalesOpacity[offset]!,
            scalesOpacity[offset + 1]!,
            scalesOpacity[offset + 2]!,
          ) * radiusScale;
        ray.closestPointToPoint(center, closest);
        if (closest.distanceToSquared(center) > radius * radius) continue;
        hits.push({
          gaussianIndex,
          distance: ray.origin.distanceTo(closest),
          point: closest.clone(),
        });
      }
    }
    hits.sort((left, right) => left.distance - right.distance);
    if (hits.length > maxHits) hits.length = maxHits;
    return hits;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.ownsOctree) this.octree.dispose();
  }

  private assertUsable(): void {
    if (this.disposed) throw new Error("GaussianLod has been disposed");
  }

  private getLeafNode(nodeId: number): GaussianLodNode {
    const node = this.getNode(nodeId);
    if (this.octree.nodes[nodeId]?.isLeaf !== true) {
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${nodeId} is internal`,
      );
    }
    return node;
  }
}

function validateLevels(
  levels: readonly GaussianLodLevelOptions[],
): readonly GaussianLodLevelOptions[] {
  if (levels.length === 0 || levels.length > 256) {
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  }
  let previous = 0;
  const result = levels.map(({ retention }) => {
    if (!(retention > previous && retention <= 1)) {
      throw new RangeError(
        "GaussianLod retention values must increase and stay in (0, 1]",
      );
    }
    previous = retention;
    return Object.freeze({ retention });
  });
  if (Math.abs(previous - 1) > Number.EPSILON) {
    throw new RangeError("GaussianLod finest retention must be 1");
  }
  return Object.freeze(result);
}

function defaultImportance(
  gaussianIndex: number,
  octree: GaussianOctree,
): number {
  const values = octree.data.scalesOpacity.array as Float32Array;
  const offset = gaussianIndex * 4;
  const scales = [values[offset]!, values[offset + 1]!, values[offset + 2]!];
  scales.sort((left, right) => right - left);
  return values[offset + 3]! * scales[0]! * scales[1]!;
}
