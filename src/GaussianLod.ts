import type { Ray } from "three/webgpu";

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

/** LOD representations for one spatial cell, stored as nested prefixes. */
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

/** Full CPU-side LOD hierarchy built over a GaussianOctree. */
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

    const mutableNodes = new Array<GaussianLodNode>(octree.nodes.length);
    const buildNode = (nodeId: number): Uint32Array => {
      const octreeNode = octree.nodes[nodeId]!;
      let sortedIndices: Uint32Array;
      if (octreeNode.gaussianIndices !== null) {
        sortedIndices = Uint32Array.from(
          Array.from(octreeNode.gaussianIndices).sort(
            (left, right) => scores[right]! - scores[left]! || left - right,
          ),
        );
      } else {
        sortedIndices = mergeSortedIndices(
          octreeNode.children.map((childId) => buildNode(childId)),
          scores,
        );
      }

      mutableNodes[nodeId] = new GaussianLodNode(
        nodeId,
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
      return sortedIndices;
    };

    buildNode(octree.rootNode);
    this.nodes = mutableNodes;
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
    const selected = new Uint8Array(this.octree.data.count);
    let destination = 0;
    for (let entry = 0; entry < packing.nodeIds.length; entry++) {
      const node = this.getNode(packing.nodeIds[entry]!);
      const level = packing.lodLevels[entry]!;
      const count = node.levelCounts[level];
      if (count === undefined) {
        throw new RangeError(`GaussianLod level ${level} does not exist`);
      }
      if (destination + count > result.length) {
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      }
      for (let local = 0; local < count; local++) {
        const sourceIndex = node.sortedGaussianIndices[local]!;
        if (selected[sourceIndex] !== 0) {
          throw new Error(
            "GaussianLodPacking contains overlapping octree representations",
          );
        }
        selected[sourceIndex] = 1;
        result[destination++] = sourceIndex;
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
    const maxHits = options.maxHits ?? Infinity;
    const candidates: number[] = [];
    for (let entry = 0; entry < packing.nodeIds.length; entry++) {
      const nodeId = packing.nodeIds[entry]!;
      const octreeNode = this.octree.nodes[nodeId]!;
      const expansion =
        Math.max(0, radiusScale - 3) * octreeNode.maxSplatRadius;
      const hitBounds =
        expansion === 0
          ? octreeNode.raycastBounds
          : octreeNode.raycastBounds.clone().expandByScalar(expansion);
      if (!ray.intersectsBox(hitBounds)) continue;
      const lodNode = this.nodes[nodeId]!;
      const count = lodNode.levelCounts[packing.lodLevels[entry]!]!;
      for (let local = 0; local < count; local++) {
        candidates.push(lodNode.sortedGaussianIndices[local]!);
      }
    }
    return this.octree.raycastIndices(ray, candidates, radiusScale, maxHits);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.ownsOctree) this.octree.dispose();
  }

  private assertUsable(): void {
    if (this.disposed) throw new Error("GaussianLod has been disposed");
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

function mergeSortedIndices(
  sources: readonly Uint32Array[],
  scores: Float64Array,
): Uint32Array {
  const length = sources.reduce((sum, source) => sum + source.length, 0);
  const result = new Uint32Array(length);
  const offsets = new Uint32Array(sources.length);
  for (let destination = 0; destination < length; destination++) {
    let bestSource = -1;
    let bestIndex = -1;
    for (let source = 0; source < sources.length; source++) {
      const candidate = sources[source]![offsets[source]!];
      if (candidate === undefined) continue;
      if (
        bestSource < 0 ||
        scores[candidate]! > scores[bestIndex]! ||
        (scores[candidate] === scores[bestIndex] && candidate < bestIndex)
      ) {
        bestSource = source;
        bestIndex = candidate;
      }
    }
    result[destination] = bestIndex;
    offsets[bestSource] = offsets[bestSource]! + 1;
  }
  return result;
}
