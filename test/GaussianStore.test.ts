import { describe, expect, it, vi } from "vitest";
import { StorageBufferAttribute } from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLod } from "../src/GaussianLod";
import { createRadialLodPackingStrategy } from "../src/GaussianLodPacking";
import { GaussianOctree } from "../src/GaussianOctree";
import { GaussianStore } from "../src/GaussianStore";

describe("GaussianStore", () => {
  it("packs clouds sequentially, writes object IDs to means.w, and pads to the maximum SH degree", () => {
    const cat = data(1, 0, 10, [1]);
    const dog = data(1, 1, 20, [2, 3, 4, 5]);
    const store = new GaussianStore();
    const catCloud = store.add(cat, { name: "cat" });
    const dogCloud = store.add(dog, { name: "dog" });

    const packed = store.getPackedData();
    expect(packed.count).toBe(2);
    expect(packed.shDegree).toBe(1);
    expect(packed.shCoefficientCount).toBe(4);
    expect(Array.from(packed.means.array as Float32Array)).toEqual([
      10,
      11,
      12,
      catCloud.objectId,
      20,
      21,
      22,
      dogCloud.objectId,
    ]);
    expect(Array.from(packed.shCoefficients.array as Float32Array)).toEqual([
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 3, 3, 3, 0, 4,
      4, 4, 0, 5, 5, 5, 0,
    ]);
  });

  it("keeps stable object IDs when a packed cloud is removed", () => {
    const store = new GaussianStore();
    const cat = store.add(data(1, 0, 10, [1]));
    const dog = store.add(data(1, 0, 20, [2]));
    store.getPackedData();
    const version = store.layoutVersion;

    cat.dispose();
    const packed = store.getPackedData();

    expect(store.layoutVersion).toBe(version + 1);
    expect(store.objectCapacity).toBe(2);
    expect(packed.count).toBe(1);
    expect((packed.means.array as Float32Array)[3]).toBe(dog.objectId);
  });

  it("can lower the packed SH stride after removing the highest-degree cloud", () => {
    const store = new GaussianStore();
    const low = store.add(data(1, 0, 10, [7]));
    const high = store.add(data(1, 1, 20, [2, 3, 4, 5]));
    expect(store.getPackedData().shDegree).toBe(1);

    high.dispose();
    const packed = store.getPackedData();

    expect(packed.shDegree).toBe(0);
    expect(packed.shCoefficients.count).toBe(1);
    expect((packed.means.array as Float32Array)[3]).toBe(low.objectId);
    expect(Array.from(packed.shCoefficients.array as Float32Array)).toEqual([
      7, 7, 7, 0,
    ]);
  });

  it("loads through an injected parser and retains the source for octree raycasts", async () => {
    const source = data(1, 0, 1, [1]);
    const dispose = vi.spyOn(source, "dispose");
    const loader = { load: vi.fn(async () => source) };
    const store = new GaussianStore({ loader });

    const cloud = await store.load("/models/cat.ply?cache=1");
    expect(cloud.name).toBe("cat.ply");
    expect(loader.load).toHaveBeenCalledWith("/models/cat.ply?cache=1");

    store.getPackedData();
    expect(dispose).not.toHaveBeenCalled();

    store.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("packs only the LOD selection while retaining the full source tree", () => {
    const source = data(10, 0, 1, [1]);
    const octree = GaussianOctree.build(source, { leafCapacity: 20 });
    const lod = GaussianLod.build(octree, {
      levels: [{ retention: 0.2 }, { retention: 1 }],
    });
    const strategy = createRadialLodPackingStrategy({
      center: "bounds-center",
      regions: [{ maxNormalizedRadius: Infinity, budgetShare: 1 }],
    });
    const store = new GaussianStore();
    const cloud = store.addLod(lod, {
      budget: { maxGaussians: 2 },
      packingStrategy: strategy,
    });

    expect(cloud.gaussianCount).toBe(2);
    expect(cloud.lod?.octree.data.count).toBe(10);
    expect(store.getPackedData().count).toBe(2);
  });
});

function data(
  count: number,
  degree: 0 | 1 | 2 | 3,
  meanStart: number,
  coefficients: readonly number[],
): GaussianData {
  const means = new Float32Array(count * 4);
  const scalesOpacity = new Float32Array(count * 4);
  const rotations = new Float32Array(count * 4);
  for (let index = 0; index < count; index++) {
    means.set([meanStart, meanStart + 1, meanStart + 2, 999], index * 4);
    scalesOpacity.set([1, 1, 1, 1], index * 4);
    rotations[index * 4 + 3] = 1;
  }
  const sh = new Float32Array(count * coefficients.length * 4);
  for (let gaussian = 0; gaussian < count; gaussian++) {
    for (
      let coefficient = 0;
      coefficient < coefficients.length;
      coefficient++
    ) {
      const value = coefficients[coefficient]!;
      sh.set(
        [value, value, value, 0],
        (gaussian * coefficients.length + coefficient) * 4,
      );
    }
  }
  return new GaussianData(
    {
      means: attribute(means),
      scalesOpacity: attribute(scalesOpacity),
      rotations: attribute(rotations),
      shCoefficients: attribute(sh),
    },
    { count, shDegree: degree },
  );
}

function attribute(values: Float32Array): StorageBufferAttribute {
  return new StorageBufferAttribute(values, 4);
}
