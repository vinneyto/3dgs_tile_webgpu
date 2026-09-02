import type { GaussianLod } from "../GaussianLod";

export interface DistanceAwareLodPlanData {
  readonly leafNodeIds: Uint32Array;
  /** XYZ center for every leaf, in cloud-local space. */
  readonly leafCenters: Float64Array;
  /** Leaf-major counts for every LOD level. */
  readonly levelCounts: Uint32Array;
  readonly levelCount: number;
  readonly halfDiagonal: number;
}

export interface DistanceAwareLodPlanRequest {
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly levelDistance: number;
  readonly maxGaussians: number;
}

export interface DistanceAwareLodPlanResult {
  readonly length: number;
  readonly gaussianCount: number;
}

export interface DistanceAwareLodPlanWorkspace {
  readonly radii: Float64Array;
  readonly levels: Uint8Array;
  readonly order: number[];
}

export function createDistanceAwareLodPlanWorkspace(
  leafCount: number,
): DistanceAwareLodPlanWorkspace {
  return {
    radii: new Float64Array(leafCount),
    levels: new Uint8Array(leafCount),
    order: Array.from({ length: leafCount }, (_, index) => index),
  };
}

export function createDistanceAwareLodPlanData(
  lod: GaussianLod,
): DistanceAwareLodPlanData {
  const leafNodeIds = new Uint32Array(lod.octree.leafNodeIds);
  const leafCenters = new Float64Array(leafNodeIds.length * 3);
  const levelCounts = new Uint32Array(leafNodeIds.length * lod.levelCount);
  for (let leafIndex = 0; leafIndex < leafNodeIds.length; leafIndex++) {
    const nodeId = leafNodeIds[leafIndex]!;
    const bounds = lod.octree.nodes[nodeId]!.bounds;
    const centerOffset = leafIndex * 3;
    leafCenters[centerOffset] = (bounds.min.x + bounds.max.x) * 0.5;
    leafCenters[centerOffset + 1] = (bounds.min.y + bounds.max.y) * 0.5;
    leafCenters[centerOffset + 2] = (bounds.min.z + bounds.max.z) * 0.5;
    levelCounts.set(lod.nodes[nodeId]!.levelCounts, leafIndex * lod.levelCount);
  }
  const rootSizeX = lod.octree.rootBounds.max.x - lod.octree.rootBounds.min.x;
  const rootSizeY = lod.octree.rootBounds.max.y - lod.octree.rootBounds.min.y;
  const rootSizeZ = lod.octree.rootBounds.max.z - lod.octree.rootBounds.min.z;
  return {
    leafNodeIds,
    leafCenters,
    levelCounts,
    levelCount: lod.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        rootSizeX * rootSizeX + rootSizeY * rootSizeY + rootSizeZ * rootSizeZ,
      ) * 0.5,
      Number.EPSILON,
    ),
  };
}

/**
 * Pure typed-array implementation shared by the main-thread strategy tests and
 * the module worker. Output arrays must have room for every leaf.
 */
export function planDistanceAwareLod(
  data: DistanceAwareLodPlanData,
  request: DistanceAwareLodPlanRequest,
  outputNodeIds: Uint32Array,
  outputLodLevels: Uint8Array,
  workspace: DistanceAwareLodPlanWorkspace,
): DistanceAwareLodPlanResult {
  const leafCount = data.leafNodeIds.length;
  if (
    outputNodeIds.length < leafCount ||
    outputLodLevels.length < leafCount ||
    workspace.radii.length < leafCount ||
    workspace.levels.length < leafCount ||
    workspace.order.length < leafCount
  ) {
    throw new RangeError("Distance-aware LOD worker buffers are too small");
  }
  const finestLevel = data.levelCount - 1;
  for (let index = 0; index < leafCount; index++) {
    const centerOffset = index * 3;
    const dx = data.leafCenters[centerOffset]! - request.centerX;
    const dy = data.leafCenters[centerOffset + 1]! - request.centerY;
    const dz = data.leafCenters[centerOffset + 2]! - request.centerZ;
    workspace.radii[index] =
      Math.sqrt(dx * dx + dy * dy + dz * dz) / data.halfDiagonal;
    workspace.order[index] = index;
  }
  workspace.order.sort(
    (left, right) =>
      workspace.radii[left]! - workspace.radii[right]! ||
      data.leafNodeIds[left]! - data.leafNodeIds[right]!,
  );

  let gaussianCount = 0;
  for (let orderIndex = 0; orderIndex < leafCount; orderIndex++) {
    const leafIndex = workspace.order[orderIndex]!;
    const level = Math.max(
      0,
      finestLevel -
        Math.floor(workspace.radii[leafIndex]! / request.levelDistance),
    );
    workspace.levels[orderIndex] = level;
    gaussianCount += data.levelCounts[leafIndex * data.levelCount + level]!;
  }

  for (
    let orderIndex = leafCount - 1;
    orderIndex >= 0 && gaussianCount > request.maxGaussians;
    orderIndex--
  ) {
    const leafIndex = workspace.order[orderIndex]!;
    while (
      workspace.levels[orderIndex]! > 0 &&
      gaussianCount > request.maxGaussians
    ) {
      const level = workspace.levels[orderIndex]!;
      const base = leafIndex * data.levelCount;
      gaussianCount -=
        data.levelCounts[base + level]! - data.levelCounts[base + level - 1]!;
      workspace.levels[orderIndex] = level - 1;
    }
  }

  let selectedLength = leafCount;
  while (selectedLength > 0 && gaussianCount > request.maxGaussians) {
    selectedLength--;
    const leafIndex = workspace.order[selectedLength]!;
    gaussianCount -=
      data.levelCounts[
        leafIndex * data.levelCount + workspace.levels[selectedLength]!
      ]!;
  }

  for (let orderIndex = 0; orderIndex < selectedLength; orderIndex++) {
    const leafIndex = workspace.order[orderIndex]!;
    outputNodeIds[orderIndex] = data.leafNodeIds[leafIndex]!;
    outputLodLevels[orderIndex] = workspace.levels[orderIndex]!;
  }
  return { length: selectedLength, gaussianCount };
}
