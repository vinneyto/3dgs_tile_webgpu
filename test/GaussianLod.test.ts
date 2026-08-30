import { describe, expect, it } from "vitest";
import { Ray, StorageBufferAttribute, Vector3 } from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLod } from "../src/GaussianLod";
import {
  MaximumLodPackingStrategy,
  RadialLodPackingStrategy,
} from "../src/lod-packing";
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
});

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
