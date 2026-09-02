import type { GaussianLod } from "../GaussianLod";

export interface RadialLodPlanData {
  readonly leafNodeIds: Uint32Array;
  /** XYZ center for every leaf, in cloud-local space. */
  readonly leafCenters: Float64Array;
  /** Leaf-major counts for every LOD level. */
  readonly levelCounts: Uint32Array;
  readonly levelCount: number;
  readonly halfDiagonal: number;
}

export interface RadialLodPlanCenterRequest {
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly maxGaussians: number;
}

export interface DistanceAwareLodPlanRequest extends RadialLodPlanCenterRequest {
  readonly strategy: "distance";
  readonly levelDistance: number;
}

export interface TieredRadialLodPlanRequest extends RadialLodPlanCenterRequest {
  readonly strategy: "tiered";
  readonly budgetShares: readonly [number, number, number];
}

export type RadialLodPlanRequest =
  DistanceAwareLodPlanRequest | TieredRadialLodPlanRequest;

export interface RadialLodPlanResult {
  readonly length: number;
  readonly gaussianCount: number;
}

export interface RadialLodPlanWorkspace {
  readonly radii: Float64Array;
  readonly levels: Uint8Array;
  readonly order: number[];
}

export function createRadialLodPlanWorkspace(
  leafCount: number,
): RadialLodPlanWorkspace {
  return {
    radii: new Float64Array(leafCount),
    levels: new Uint8Array(leafCount),
    order: Array.from({ length: leafCount }, (_, index) => index),
  };
}

export function createRadialLodPlanData(lod: GaussianLod): RadialLodPlanData {
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
  data: RadialLodPlanData,
  request: DistanceAwareLodPlanRequest,
  outputNodeIds: Uint32Array,
  outputLodLevels: Uint8Array,
  workspace: RadialLodPlanWorkspace,
): RadialLodPlanResult {
  const leafCount = data.leafNodeIds.length;
  validateBuffers(leafCount, outputNodeIds, outputLodLevels, workspace);
  sortLeavesByRadius(data, request, workspace);
  const finestLevel = data.levelCount - 1;

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

/** Typed-array implementation of TieredRadialLodPackingStrategy for workers. */
export function planTieredRadialLod(
  data: RadialLodPlanData,
  request: TieredRadialLodPlanRequest,
  outputNodeIds: Uint32Array,
  outputLodLevels: Uint8Array,
  workspace: RadialLodPlanWorkspace,
): RadialLodPlanResult {
  const leafCount = data.leafNodeIds.length;
  validateBuffers(leafCount, outputNodeIds, outputLodLevels, workspace);
  const finestLevel = data.levelCount - 1;
  let sourceCount = 0;
  for (let leafIndex = 0; leafIndex < leafCount; leafIndex++) {
    sourceCount += data.levelCounts[leafIndex * data.levelCount + finestLevel]!;
  }
  if (sourceCount <= request.maxGaussians) {
    outputNodeIds.set(data.leafNodeIds);
    outputLodLevels.fill(finestLevel, 0, leafCount);
    return { length: leafCount, gaussianCount: sourceCount };
  }

  sortLeavesByRadius(data, request, workspace);
  const tierLevels = [finestLevel, Math.max(0, finestLevel - 1), 0] as const;
  let selectedLength = 0;
  let gaussianCount = 0;
  let cumulativeShare = 0;
  for (let tier = 0; tier < tierLevels.length; tier++) {
    const share = request.budgetShares[tier]!;
    cumulativeShare += share;
    if (share === 0) continue;
    const tierLimit =
      tier === tierLevels.length - 1
        ? request.maxGaussians
        : Math.floor(request.maxGaussians * cumulativeShare);
    const level = tierLevels[tier]!;
    while (selectedLength < leafCount) {
      const leafIndex = workspace.order[selectedLength]!;
      const cost = data.levelCounts[leafIndex * data.levelCount + level]!;
      if (gaussianCount + cost > tierLimit) break;
      outputNodeIds[selectedLength] = data.leafNodeIds[leafIndex]!;
      outputLodLevels[selectedLength] = level;
      gaussianCount += cost;
      selectedLength++;
    }
  }
  return { length: selectedLength, gaussianCount };
}

export function planRadialLod(
  data: RadialLodPlanData,
  request: RadialLodPlanRequest,
  outputNodeIds: Uint32Array,
  outputLodLevels: Uint8Array,
  workspace: RadialLodPlanWorkspace,
): RadialLodPlanResult {
  return request.strategy === "tiered"
    ? planTieredRadialLod(
        data,
        request,
        outputNodeIds,
        outputLodLevels,
        workspace,
      )
    : planDistanceAwareLod(
        data,
        request,
        outputNodeIds,
        outputLodLevels,
        workspace,
      );
}

function sortLeavesByRadius(
  data: RadialLodPlanData,
  request: RadialLodPlanCenterRequest,
  workspace: RadialLodPlanWorkspace,
): void {
  for (let index = 0; index < data.leafNodeIds.length; index++) {
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
}

function validateBuffers(
  leafCount: number,
  outputNodeIds: Uint32Array,
  outputLodLevels: Uint8Array,
  workspace: RadialLodPlanWorkspace,
): void {
  if (
    outputNodeIds.length < leafCount ||
    outputLodLevels.length < leafCount ||
    workspace.radii.length < leafCount ||
    workspace.levels.length < leafCount ||
    workspace.order.length < leafCount
  ) {
    throw new RangeError("Radial LOD worker buffers are too small");
  }
}
