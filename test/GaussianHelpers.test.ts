import { describe, expect, it } from "vitest";
import { StorageBufferAttribute } from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLod, type GaussianLodPacking } from "../src/GaussianLod";
import { GaussianOctree } from "../src/GaussianOctree";
import { LodHelper } from "../src/LodHelper";
import { OctreeHelper } from "../src/OctreeHelper";

describe("Gaussian debug helpers", () => {
  it("builds one local-space wireframe box per selected octree cell", () => {
    const octree = tree();
    const helper = new OctreeHelper(octree);

    expect(helper.cellCount).toBe(octree.nodes.length);
    expect(helper.geometry.getAttribute("position").count).toBe(
      helper.cellCount * 24,
    );
    expect(helper.position.toArray()).toEqual([0, 0, 0]);

    helper.dispose();
  });

  it("colors active LOD cell volumes and filters visible levels", () => {
    const octree = tree();
    const lod = GaussianLod.build(octree, {
      levels: [{ retention: 0.25 }, { retention: 0.5 }, { retention: 1 }],
    });
    const nodeIds = octree.leafNodeIds.slice();
    const lodLevels = Uint8Array.from(nodeIds, (_, index) => index % 3);
    let gaussianCount = 0;
    for (let entry = 0; entry < nodeIds.length; entry++) {
      gaussianCount +=
        lod.nodes[nodeIds[entry]!]!.levelCounts[lodLevels[entry]!]!;
    }
    const packing: GaussianLodPacking = {
      nodeIds,
      lodLevels,
      gaussianCount,
    };
    const helper = new LodHelper(lod, packing, { levels: [0, 2] });

    expect(helper.instanceCounts.reduce((sum, count) => sum + count, 0)).toBe(
      nodeIds.length,
    );
    expect(helper.visibleLevels).toEqual([0, 2]);
    helper.setLevels([1]);
    expect(helper.visibleLevels).toEqual([1]);

    helper.dispose();
  });
});

function tree(): GaussianOctree {
  const points = [
    [-1, -1, -1],
    [1, -1, -1],
    [-1, 1, -1],
    [1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, 1],
    [1, 1, 1],
  ];
  const means = new Float32Array(points.length * 4);
  const scalesOpacity = new Float32Array(points.length * 4);
  const rotations = new Float32Array(points.length * 4);
  const shCoefficients = new Float32Array(points.length * 4);
  for (let index = 0; index < points.length; index++) {
    means.set([...points[index]!, 0], index * 4);
    scalesOpacity.set([0.1, 0.1, 0.1, 1], index * 4);
    rotations[index * 4 + 3] = 1;
  }
  const data = new GaussianData(
    {
      means: new StorageBufferAttribute(means, 4),
      scalesOpacity: new StorageBufferAttribute(scalesOpacity, 4),
      rotations: new StorageBufferAttribute(rotations, 4),
      shCoefficients: new StorageBufferAttribute(shCoefficients, 4),
    },
    { count: points.length },
  );
  return GaussianOctree.build(data, { leafCapacity: 1 });
}
