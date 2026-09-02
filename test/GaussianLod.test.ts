import { describe, expect, it, vi } from "vitest";
import { Ray, StorageBufferAttribute, Vector3 } from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLod } from "../src/GaussianLod";
import {
  DistanceAwareRadialLodPackingStrategy,
  MaximumLodPackingStrategy,
  RadialLodPackingStrategy,
  StreamingLodPackingStrategy,
  TieredRadialLodPackingStrategy,
} from "../src/lod-packing";
import {
  createRadialLodPlanData,
  createRadialLodPlanWorkspace,
  planDistanceAwareLod,
  planTieredRadialLod,
} from "../src/lod-packing/RadialLodPlan";
import { GaussianOctree } from "../src/GaussianOctree";

describe("GaussianOctree", () => {
  it("builds adaptive cubic cells containing every source Gaussian once", () => {
    const data = gaussianData([
      [-1, -1, -1],
      [-0.9, -0.9, -0.9],
      [1, 1, 1],
      [0.9, 0.9, 0.9],
      [0.8, 0.8, 0.8],
    ]);
    const octree = GaussianOctree.build(data, {
      leafCapacity: 2,
      maxDepth: 4,
    });

    const size = octree.rootBounds.getSize(new Vector3());
    expect(size.x).toBeCloseTo(size.y);
    expect(size.x).toBeCloseTo(size.z);
    const indices = Array.from(octree.leafNodeIds).flatMap((nodeId) =>
      Array.from(octree.nodes[nodeId]!.gaussianIndices!),
    );
    expect(indices.sort((left, right) => left - right)).toEqual([
      0, 1, 2, 3, 4,
    ]);
    expect(
      Array.from(octree.leafNodeIds).some(
        (nodeId) => octree.nodes[nodeId]!.depth > 1,
      ),
    ).toBe(true);
  });

  it("raycasts the full source through the octree", () => {
    const octree = GaussianOctree.build(
      gaussianData([
        [0, 0, 0],
        [2, 2, 0],
      ]),
    );
    const hits = octree.raycast(
      new Ray(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
    );

    expect(hits.map((hit) => hit.gaussianIndex)).toEqual([0]);
  });
});

describe("GaussianLod", () => {
  it("builds nested importance-sorted levels", () => {
    const source = gaussianData(
      Array.from({ length: 10 }, (_, index) => [index, 0, 0]),
      Array.from({ length: 10 }, (_, index) => index + 1),
    );
    const octree = GaussianOctree.build(source, { leafCapacity: 20 });
    const lod = GaussianLod.build(octree, {
      levels: [{ retention: 0.2 }, { retention: 0.5 }, { retention: 1 }],
    });
    const root = lod.nodes[octree.rootNode]!;

    expect(Array.from(root.levelCounts)).toEqual([2, 5, 10]);
    expect(Array.from(root.sortedGaussianIndices.slice(0, 3))).toEqual([
      9, 8, 7,
    ]);
  });

  it("stores source indices only in leaf LOD nodes", () => {
    const source = gaussianData(
      Array.from({ length: 16 }, (_, index) => [index - 8, index % 2, 0]),
    );
    const octree = GaussianOctree.build(source, { leafCapacity: 2 });
    const lod = GaussianLod.build(octree, {
      levels: [{ retention: 0.5 }, { retention: 1 }],
    });

    const internalNodeIds = octree.nodes
      .filter((node) => !node.isLeaf)
      .map((node) => node.id);
    expect(internalNodeIds.length).toBeGreaterThan(0);
    for (const nodeId of internalNodeIds) {
      expect(lod.nodes[nodeId]!.sortedGaussianIndices).toHaveLength(0);
      expect(Array.from(lod.nodes[nodeId]!.levelCounts)).toEqual([0, 0]);
    }
    expect(
      Array.from(octree.leafNodeIds).reduce(
        (count, nodeId) =>
          count + lod.nodes[nodeId]!.sortedGaussianIndices.length,
        0,
      ),
    ).toBe(source.count);
  });

  it("rejects packings that reference internal octree nodes", () => {
    const octree = GaussianOctree.build(
      gaussianData([
        [-1, 0, 0],
        [1, 0, 0],
      ]),
      { leafCapacity: 1 },
    );
    const lod = GaussianLod.build(octree);
    const packing = {
      nodeIds: Uint32Array.of(octree.rootNode),
      lodLevels: Uint8Array.of(0),
      gaussianCount: 0,
    };

    expect(() => lod.indicesForPacking(packing)).toThrow(/leaf nodes/);
    expect(() =>
      lod.raycast(
        new Ray(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
        packing,
      ),
    ).toThrow(/leaf nodes/);
  });

  it("raycasts selected leaf prefixes without building one candidate list", () => {
    const octree = GaussianOctree.build(
      gaussianData(
        [
          [-1, 0, 0],
          [1, 0, 0],
        ],
        [1, 1],
      ),
      { leafCapacity: 1 },
    );
    const lod = GaussianLod.build(octree);
    const packing = new MaximumLodPackingStrategy().pack({
      lod,
      maxGaussians: 2,
    });
    const ray = new Ray(new Vector3(0, 0, 2), new Vector3(0, 0, -1));
    const expected = octree.raycastIndices(ray, lod.indicesForPacking(packing));
    const raycastIndices = vi.spyOn(octree, "raycastIndices");

    const actual = lod.raycast(ray, packing);

    expect(raycastIndices).not.toHaveBeenCalled();
    expect(actual.map(({ gaussianIndex }) => gaussianIndex)).toEqual(
      expected.map(({ gaussianIndex }) => gaussianIndex),
    );
    expect(actual.map(({ distance }) => distance)).toEqual(
      expected.map(({ distance }) => distance),
    );
  });

  it("packs maximum detail and respects a radial object budget", () => {
    const points: number[][] = [];
    for (let octant = 0; octant < 8; octant++) {
      const x = octant & 1 ? 0.8 : -0.8;
      const y = octant & 2 ? 0.8 : -0.8;
      const z = octant & 4 ? 0.8 : -0.8;
      points.push([x, y, z], [x * 0.9, y * 0.9, z * 0.9]);
    }
    const octree = GaussianOctree.build(gaussianData(points), {
      leafCapacity: 2,
    });
    const lod = GaussianLod.build(octree, {
      levels: [{ retention: 0.5 }, { retention: 1 }],
    });

    const maximumStrategy = new MaximumLodPackingStrategy();
    expect(maximumStrategy).toBeInstanceOf(MaximumLodPackingStrategy);
    const maximum = maximumStrategy.pack({
      lod,
      maxGaussians: points.length,
    });
    expect(maximum.gaussianCount).toBe(points.length);
    expect(lod.indicesForPacking(maximum).length).toBe(points.length);

    const radialStrategy = new RadialLodPackingStrategy({
      center: "bounds-center",
      lodLevel: "finest",
    });
    expect(radialStrategy).toBeInstanceOf(RadialLodPackingStrategy);
    const radial = radialStrategy.pack({ lod, maxGaussians: 12 });
    expect(radial.gaussianCount).toBeLessThanOrEqual(12);
    expect(radial.gaussianCount).toBeGreaterThanOrEqual(8);
    expect(lod.indicesForPacking(radial).length).toBe(radial.gaussianCount);
  });

  it("packs the requested LOD as a continuous radial prefix", () => {
    const points: number[][] = [];
    for (let octant = 0; octant < 8; octant++) {
      const signs = [
        octant & 1 ? 1 : -1,
        octant & 2 ? 1 : -1,
        octant & 4 ? 1 : -1,
      ];
      for (const distance of [0.08, 0.1, 0.12, 0.14, 0.82, 0.86, 0.9, 0.94]) {
        points.push(signs.map((sign) => sign * distance));
      }
    }
    const octree = GaussianOctree.build(gaussianData(points), {
      leafCapacity: 4,
    });
    const lod = GaussianLod.build(octree, {
      levels: [{ retention: 0.25 }, { retention: 0.5 }, { retention: 1 }],
    });
    const packing = new RadialLodPackingStrategy().pack({
      lod,
      maxGaussians: 12,
    });
    const center = octree.bounds.getCenter(new Vector3());
    expect(packing.gaussianCount).toBeLessThanOrEqual(12);
    expect(packing.nodeIds.length).toBeLessThan(octree.leafNodeIds.length);
    expect(new Set(packing.lodLevels)).toEqual(new Set([lod.finestLevel]));

    const allCellsByRadius = Array.from(octree.leafNodeIds, (nodeId) => ({
      nodeId,
      radius: octree.nodes[nodeId]!.bounds.getCenter(new Vector3()).distanceTo(
        center,
      ),
    })).sort(
      (left, right) => left.radius - right.radius || left.nodeId - right.nodeId,
    );
    expect(Array.from(packing.nodeIds)).toEqual(
      allCellsByRadius
        .slice(0, packing.nodeIds.length)
        .map(({ nodeId }) => nodeId),
    );
  });

  it("packs radial detail tiers and keeps full finest detail when it fits", () => {
    const points: number[][] = [];
    for (let octant = 0; octant < 8; octant++) {
      const signs = [
        octant & 1 ? 1 : -1,
        octant & 2 ? 1 : -1,
        octant & 4 ? 1 : -1,
      ];
      for (const distance of [0.08, 0.1, 0.12, 0.14, 0.82, 0.86, 0.9, 0.94]) {
        points.push(signs.map((sign) => sign * distance));
      }
    }
    const lod = GaussianLod.build(
      GaussianOctree.build(gaussianData(points), { leafCapacity: 4 }),
      { levels: [{ retention: 0.25 }, { retention: 0.5 }, { retention: 1 }] },
    );
    const strategy = new TieredRadialLodPackingStrategy();
    const clipped = strategy.pack({ lod, maxGaussians: 12 });

    expect(clipped.gaussianCount).toBeLessThanOrEqual(12);
    expect(Array.from(clipped.lodLevels)).toEqual(
      [...clipped.lodLevels].sort((left, right) => right - left),
    );
    expect(new Set(clipped.lodLevels)).toEqual(new Set([0, 1, 2]));

    const full = strategy.pack({ lod, maxGaussians: points.length });
    expect(full.gaussianCount).toBe(points.length);
    expect(new Set(full.lodLevels)).toEqual(new Set([lod.finestLevel]));
  });

  it("reduces radial detail with focus distance even when finest detail fits", () => {
    const points: number[][] = [];
    for (let octant = 0; octant < 8; octant++) {
      const signs = [
        octant & 1 ? 1 : -1,
        octant & 2 ? 1 : -1,
        octant & 4 ? 1 : -1,
      ];
      for (const distance of [0.7, 0.8, 0.9, 1]) {
        points.push(signs.map((sign) => sign * distance));
      }
    }
    const lod = GaussianLod.build(
      GaussianOctree.build(gaussianData(points), { leafCapacity: 4 }),
      { levels: [{ retention: 0.25 }, { retention: 0.5 }, { retention: 1 }] },
    );
    const strategy = new DistanceAwareRadialLodPackingStrategy({
      center: new Vector3(),
      levelDistance: 2,
    });

    const near = strategy.pack({ lod, maxGaussians: points.length });
    strategy.setCenter(new Vector3(20, 0, 0));
    const far = strategy.pack({ lod, maxGaussians: points.length });

    expect(near.gaussianCount).toBe(points.length);
    expect(new Set(near.lodLevels)).toEqual(new Set([lod.finestLevel]));
    expect(far.nodeIds.length).toBe(lod.octree.leafNodeIds.length);
    expect(new Set(far.lodLevels)).toEqual(new Set([0]));
    expect(far.gaussianCount).toBeLessThan(near.gaussianCount);
  });

  it("enforces the budget by degrading and then clipping far radial cells", () => {
    const points = Array.from({ length: 32 }, (_, index) => [index, 0, 0]);
    const lod = GaussianLod.build(
      GaussianOctree.build(gaussianData(points), { leafCapacity: 4 }),
      { levels: [{ retention: 0.5 }, { retention: 1 }] },
    );
    const strategy = new DistanceAwareRadialLodPackingStrategy({
      center: new Vector3(),
      levelDistance: 100,
    });

    const packing = strategy.pack({ lod, maxGaussians: 7 });

    expect(packing.gaussianCount).toBeLessThanOrEqual(7);
    expect(packing.nodeIds.length).toBeLessThan(lod.octree.leafNodeIds.length);
    expect(lod.indicesForPacking(packing)).toHaveLength(packing.gaussianCount);
  });

  it("validates the radial LOD distance step", () => {
    expect(
      () => new DistanceAwareRadialLodPackingStrategy({ levelDistance: 0 }),
    ).toThrow(/levelDistance/);
  });

  it("plans distance-aware LOD targets into reusable typed arrays", () => {
    const data = {
      leafNodeIds: Uint32Array.of(10, 20),
      leafCenters: Float64Array.of(0, 0, 0, 10, 0, 0),
      levelCounts: Uint32Array.of(1, 2, 1, 2),
      levelCount: 2,
      halfDiagonal: 1,
    };
    const nodeIds = new Uint32Array(2);
    const lodLevels = new Uint8Array(2);
    const workspace = createRadialLodPlanWorkspace(2);

    const first = planDistanceAwareLod(
      data,
      {
        strategy: "distance",
        centerX: 0,
        centerY: 0,
        centerZ: 0,
        levelDistance: 5,
        maxGaussians: 4,
      },
      nodeIds,
      lodLevels,
      workspace,
    );
    expect(first).toEqual({ length: 2, gaussianCount: 3 });
    expect(Array.from(nodeIds)).toEqual([10, 20]);
    expect(Array.from(lodLevels)).toEqual([1, 0]);

    const second = planDistanceAwareLod(
      data,
      {
        strategy: "distance",
        centerX: 10,
        centerY: 0,
        centerZ: 0,
        levelDistance: 5,
        maxGaussians: 2,
      },
      nodeIds,
      lodLevels,
      workspace,
    );
    expect(second).toEqual({ length: 2, gaussianCount: 2 });
    expect(Array.from(nodeIds)).toEqual([20, 10]);
    expect(Array.from(lodLevels)).toEqual([0, 0]);
  });

  it("matches the synchronous distance-aware strategy in the worker planner", () => {
    const lod = GaussianLod.build(
      GaussianOctree.build(
        gaussianData([
          [-1, -1, -1],
          [-0.9, -0.9, -0.9],
          [1, 1, 1],
          [0.9, 0.9, 0.9],
        ]),
        { leafCapacity: 2 },
      ),
      { levels: [{ retention: 0.5 }, { retention: 1 }] },
    );
    const center = new Vector3(0.5, 0.25, -0.25);
    const levelDistance = 0.75;
    const maxGaussians = 3;
    const expected = new DistanceAwareRadialLodPackingStrategy({
      center,
      levelDistance,
    }).pack({ lod, maxGaussians });
    const data = createRadialLodPlanData(lod);
    const nodeIds = new Uint32Array(data.leafNodeIds.length);
    const lodLevels = new Uint8Array(data.leafNodeIds.length);
    const result = planDistanceAwareLod(
      data,
      {
        strategy: "distance",
        centerX: center.x,
        centerY: center.y,
        centerZ: center.z,
        levelDistance,
        maxGaussians,
      },
      nodeIds,
      lodLevels,
      createRadialLodPlanWorkspace(data.leafNodeIds.length),
    );

    expect(result.gaussianCount).toBe(expected.gaussianCount);
    expect(Array.from(nodeIds.subarray(0, result.length))).toEqual(
      Array.from(expected.nodeIds),
    );
    expect(Array.from(lodLevels.subarray(0, result.length))).toEqual(
      Array.from(expected.lodLevels),
    );
  });

  it("matches the synchronous tiered radial strategy in the worker planner", () => {
    const points: number[][] = [];
    for (let octant = 0; octant < 8; octant++) {
      const signs = [
        octant & 1 ? 1 : -1,
        octant & 2 ? 1 : -1,
        octant & 4 ? 1 : -1,
      ];
      for (const distance of [0.08, 0.1, 0.12, 0.14, 0.82, 0.86, 0.9, 0.94]) {
        points.push(signs.map((sign) => sign * distance));
      }
    }
    const lod = GaussianLod.build(
      GaussianOctree.build(gaussianData(points), { leafCapacity: 4 }),
      { levels: [{ retention: 0.25 }, { retention: 0.5 }, { retention: 1 }] },
    );
    const center = new Vector3(0.25, -0.1, 0.2);
    const budgetShares = [0.6, 0.2, 0.2] as const;
    const maxGaussians = 24;
    const expected = new TieredRadialLodPackingStrategy({
      center,
      budgetShares,
    }).pack({ lod, maxGaussians });
    const data = createRadialLodPlanData(lod);
    const nodeIds = new Uint32Array(data.leafNodeIds.length);
    const lodLevels = new Uint8Array(data.leafNodeIds.length);
    const result = planTieredRadialLod(
      data,
      {
        strategy: "tiered",
        centerX: center.x,
        centerY: center.y,
        centerZ: center.z,
        budgetShares,
        maxGaussians,
      },
      nodeIds,
      lodLevels,
      createRadialLodPlanWorkspace(data.leafNodeIds.length),
    );

    expect(result.gaussianCount).toBe(expected.gaussianCount);
    expect(Array.from(nodeIds.subarray(0, result.length))).toEqual(
      Array.from(expected.nodeIds),
    );
    expect(Array.from(lodLevels.subarray(0, result.length))).toEqual(
      Array.from(expected.lodLevels),
    );
  });

  it("streams whole-cell transitions and replaces an unfinished target", () => {
    const lod = GaussianLod.build(
      GaussianOctree.build(
        gaussianData([
          [-1, -1, -1],
          [-0.9, -0.9, -0.9],
          [1, 1, 1],
          [0.9, 0.9, 0.9],
        ]),
        { leafCapacity: 2 },
      ),
      { levels: [{ retention: 0.5 }, { retention: 1 }] },
    );
    let target = packingAtLevel(lod, 0);
    const targetStrategy = { pack: vi.fn(() => target) };
    const streaming = new StreamingLodPackingStrategy(targetStrategy, {
      maxChangedCellsPerPack: 1,
      maxUploadBytesPerPack: 1,
    });
    const context = { lod, maxGaussians: 4 };

    const initial = streaming.pack(context);
    expect(initial).toBe(target);
    expect(streaming.needsPack).toBe(false);

    target = packingAtLevel(lod, 1);
    streaming.invalidateTarget();
    const partialUpgrade = streaming.pack(context);
    expect(
      [...partialUpgrade.lodLevels].filter((level) => level === 1),
    ).toHaveLength(1);
    expect(streaming.needsPack).toBe(true);
    expect(targetStrategy.pack).toHaveBeenCalledTimes(2);

    target = packingAtLevel(lod, 0);
    streaming.invalidateTarget();
    const replaced = streaming.pack(context);
    expect(Array.from(replaced.lodLevels)).toEqual(
      Array.from(target.lodLevels),
    );
    expect(streaming.needsPack).toBe(false);
    expect(targetStrategy.pack).toHaveBeenCalledTimes(3);
  });

  it("waits for an asynchronous target and releases it after building the transition", () => {
    const lod = GaussianLod.build(
      GaussianOctree.build(
        gaussianData([
          [-1, -1, -1],
          [-0.9, -0.9, -0.9],
          [1, 1, 1],
          [0.9, 0.9, 0.9],
        ]),
        { leafCapacity: 2 },
      ),
      { levels: [{ retention: 0.5 }, { retention: 1 }] },
    );
    let pending = false;
    let result: {
      packing: ReturnType<typeof packingAtLevel>;
      maxGaussians: number;
      planningMs: number;
      roundTripMs: number;
      release: ReturnType<typeof vi.fn>;
    } | null = null;
    const planner = {
      get pending() {
        return pending;
      },
      get hasResult() {
        return result !== null;
      },
      discardedResults: 0,
      initialize: vi.fn(),
      request: vi.fn(() => {
        pending = true;
      }),
      cancel: vi.fn(),
      takeLatest: vi.fn(() => {
        const latest = result;
        result = null;
        return latest;
      }),
      dispose: vi.fn(),
    };
    const initial = packingAtLevel(lod, 0);
    const streaming = new StreamingLodPackingStrategy(
      { pack: () => initial },
      {
        maxChangedCellsPerPack: 1,
        maxUploadBytesPerPack: 1,
        targetPlanner: planner,
      },
    );
    const context = { lod, maxGaussians: 4 };
    streaming.pack(context);

    streaming.invalidateTarget();
    const waiting = streaming.takeNextBatch(context);
    expect(waiting).toBeNull();
    expect(planner.request).toHaveBeenCalledOnce();
    expect(streaming.needsPack).toBe(true);

    pending = false;
    const release = vi.fn();
    result = {
      packing: packingAtLevel(lod, 1),
      maxGaussians: 4,
      planningMs: 1.5,
      roundTripMs: 2.5,
      release,
    };
    const partial = streaming.takeNextBatch(context)!.packing;
    expect(
      Array.from(partial.lodLevels).filter((level) => level === 1),
    ).toHaveLength(1);
    expect(release).toHaveBeenCalledOnce();
    expect(streaming.targetStats).toMatchObject({
      planningMs: 1.5,
      roundTripMs: 2.5,
    });
  });

  it("validates streaming batch limits", () => {
    const targetStrategy = {
      pack: () => ({
        nodeIds: new Uint32Array(),
        lodLevels: new Uint8Array(),
        gaussianCount: 0,
      }),
    };
    expect(
      () =>
        new StreamingLodPackingStrategy(targetStrategy, {
          maxUploadBytesPerPack: 0,
        }),
    ).toThrow(/maxUploadBytesPerPack/);
    expect(
      () =>
        new StreamingLodPackingStrategy(targetStrategy, {
          maxChangedCellsPerPack: 1.5,
        }),
    ).toThrow(/maxChangedCellsPerPack/);
  });
});

function packingAtLevel(lod: GaussianLod, level: number) {
  const nodeIds = lod.octree.leafNodeIds.slice();
  const lodLevels = new Uint8Array(nodeIds.length).fill(level);
  return {
    nodeIds,
    lodLevels,
    gaussianCount: Array.from(nodeIds).reduce(
      (count, nodeId) => count + lod.nodes[nodeId]!.levelCounts[level]!,
      0,
    ),
  };
}

function gaussianData(
  points: readonly (readonly number[])[],
  scaleValues: readonly number[] = points.map(() => 0.1),
): GaussianData {
  const means = new Float32Array(points.length * 4);
  const scalesOpacity = new Float32Array(points.length * 4);
  const rotations = new Float32Array(points.length * 4);
  const shCoefficients = new Float32Array(points.length * 4);
  for (let index = 0; index < points.length; index++) {
    const point = points[index]!;
    const scale = scaleValues[index]!;
    means.set([point[0]!, point[1]!, point[2]!, 0], index * 4);
    scalesOpacity.set([scale, scale, scale, 1], index * 4);
    rotations[index * 4 + 3] = 1;
    shCoefficients.set([index, index, index, 0], index * 4);
  }
  return new GaussianData(
    {
      means: attribute(means),
      scalesOpacity: attribute(scalesOpacity),
      rotations: attribute(rotations),
      shCoefficients: attribute(shCoefficients),
    },
    { count: points.length },
  );
}

function attribute(values: Float32Array): StorageBufferAttribute {
  return new StorageBufferAttribute(values, 4);
}
