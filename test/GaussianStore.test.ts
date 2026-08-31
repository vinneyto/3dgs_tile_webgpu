import { describe, expect, it, vi } from "vitest";
import { StorageBufferAttribute, Vector3 } from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLod } from "../src/GaussianLod";
import {
  RadialLodPackingStrategy,
  TieredRadialLodPackingStrategy,
} from "../src/lod-packing";
import { GaussianOctree } from "../src/GaussianOctree";
import { GaussianStore } from "../src/GaussianStore";
import { SourceFractionBudgetStrategy } from "../src/store-budgeting";

const TEST_LIMITS = {
  maxStorageBufferBindingSize: 1_073_741_824,
  maxBufferSize: 1_073_741_824,
};

describe("GaussianStore", () => {
  it("packs clouds sequentially, writes object IDs to means.w, and pads to the maximum SH degree", () => {
    const cat = data(1, 0, 10, [1]);
    const dog = data(1, 1, 20, [2, 3, 4, 5]);
    const store = new GaussianStore();
    const catCloud = store.add(cat, { name: "cat" });
    const dogCloud = store.add(dog, { name: "dog" });
    expect(store.needsPack).toBe(true);
    expect(catCloud.gaussianCount).toBe(0);
    expect(() => store.getPackedData()).toThrow(/call store\.pack/);

    store.pack({ limits: TEST_LIMITS });
    const packed = store.getPackedData();
    expect(store.needsPack).toBe(false);
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
    store.pack({ limits: TEST_LIMITS });
    const version = store.layoutVersion;

    cat.dispose();
    expect(store.needsPack).toBe(true);
    store.pack({ limits: TEST_LIMITS });
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
    store.pack({ limits: TEST_LIMITS });
    expect(store.getPackedData().shDegree).toBe(1);

    high.dispose();
    store.pack({ limits: TEST_LIMITS });
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

    store.pack({ limits: TEST_LIMITS });
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
    const strategy = new RadialLodPackingStrategy({
      center: "bounds-center",
      lodLevel: 0,
    });
    const store = new GaussianStore();
    const cloud = store.addLod(lod, {
      packingStrategy: strategy,
    });

    expect(cloud.lodPacking).toBeNull();
    store.pack({ limits: limitsForGaussianCapacity(2, 0) });
    expect(cloud.gaussianCount).toBe(2);
    expect(cloud.lod?.octree.data.count).toBe(10);
    expect(store.getPackedData().count).toBe(2);
  });

  it("does not allocate the optional packed LOD level attribute by default", () => {
    const store = new GaussianStore();
    store.addLod(singleLevelLod([0, 1, 2, 3]));

    store.pack({ limits: limitsForGaussianCapacity(4, 0) });

    expect(store.attributes.size).toBe(0);
    expect(store.attributes.get("lodLevel")).toBeUndefined();
  });

  it("lazily enables and backfills the packed LOD level attribute", () => {
    const source = data(4, 0, 0, [1]);
    const sourceMeans = source.means.array as Float32Array;
    for (let index = 0; index < source.count; index++) {
      sourceMeans[index * 4] = index;
    }
    const lod = GaussianLod.build(
      GaussianOctree.build(source, { leafCapacity: 1 }),
      { levels: [{ retention: 0.5 }, { retention: 1 }] },
    );
    const nodeIds = lod.octree.leafNodeIds.slice(0, 2);
    const strategy = {
      pack: () => ({
        nodeIds,
        lodLevels: Uint8Array.from([0, 1]),
        gaussianCount: 2,
      }),
    };
    const store = new GaussianStore({ defaultPackingStrategy: strategy });
    store.addLod(lod);
    store.pack({ limits: limitsForGaussianCapacity(4, 0) });

    expect(store.attributes.size).toBe(0);
    const lodLevels = store.enablePackedLodLevelAttribute();

    expect(store.attributes.size).toBe(1);
    expect(store.attributes.get("lodLevel")).toBe(lodLevels);
    expect(store.enablePackedLodLevelAttribute()).toBe(lodLevels);
    expect(lodLevels.format).toBe("u32");
    expect(lodLevels.isAllocated).toBe(true);
    expect(lodLevels.count).toBe(4);
    expect(Array.from(lodLevels.array.slice(0, 2))).toEqual([0, 1]);
  });

  it("derives capacity from device limits and the Store SH degree", () => {
    const lod = singleLevelLod([0, 1, 2, 3], 1, [1, 2, 3, 4]);
    const store = new GaussianStore();
    const cloud = store.addLod(lod);

    store.pack({
      limits: {
        maxStorageBufferBindingSize: 1_024,
        maxBufferSize: 2 * 4 * 16,
      },
    });

    expect(store.shDegree).toBe(1);
    expect(store.maxGaussians).toBe(2);
    expect(cloud.gaussianCount).toBe(2);
  });

  it("can cap a cloud budget to a fraction of its full source", () => {
    const store = new GaussianStore({
      budgetingStrategy: new SourceFractionBudgetStrategy(0.5),
    });
    const cloud = store.addLod(singleLevelLod([0, 1, 2, 3, 4, 5, 6, 7]));

    store.pack({ limits: limitsForGaussianCapacity(8, 0) });

    expect(store.maxGaussians).toBe(8);
    expect(cloud.gaussianCount).toBe(4);
  });

  it("redistributes one global budget by priority and insertion order", () => {
    const store = new GaussianStore();
    const first = store.addLod(singleLevelLod([0, 1, 2, 3]), {
      name: "first",
    });
    const second = store.addLod(singleLevelLod([10, 11, 12, 13]), {
      name: "second",
      priority: -1,
    });

    store.pack({ limits: limitsForGaussianCapacity(6, 0) });
    expect(first.gaussianCount).toBe(2);
    expect(second.gaussianCount).toBe(4);
    expect(store.count).toBe(6);

    first.packingPriority = -2;
    expect(store.needsPack).toBe(true);
    expect(store.count).toBe(0);
    expect(first.lodPacking).toBeNull();
    store.pack({ limits: limitsForGaussianCapacity(6, 0) });
    expect(first.gaussianCount).toBe(4);
    expect(second.gaussianCount).toBe(2);

    first.dispose();
    store.pack({ limits: limitsForGaussianCapacity(6, 0) });
    expect(second.gaussianCount).toBe(4);
  });

  it("reuses stable slots and uploads only the Gaussian delta after a center shift", () => {
    const strategy = new TieredRadialLodPackingStrategy({
      center: new Vector3(2, 0, 0),
    });
    const store = new GaussianStore({ defaultPackingStrategy: strategy });
    store.addLod(singleLevelLod([0, 1, 2, 3, 4, 5, 6, 7]));
    const limits = limitsForGaussianCapacity(4, 0);

    store.pack({ limits });
    const dataBefore = store.getPackedData();
    expect(store.lastPackStats).toMatchObject({
      fullRebuild: true,
      writtenSlots: 4,
    });

    strategy.setCenter(new Vector3(3, 0, 0));
    store.clouds[0]!.invalidatePacking();
    store.pack({ limits });

    expect(store.getPackedData()).toBe(dataBefore);
    expect(store.lastPackStats).toMatchObject({
      fullRebuild: false,
      activeGaussians: 4,
      reusedSlots: 3,
      writtenSlots: 1,
      clearedSlots: 0,
    });
    expect(dataBefore.means.updateRanges.length).toBeGreaterThan(0);
    expect(dataBefore.shCoefficients.updateRanges.length).toBeGreaterThan(0);
  });

  it("re-evaluates only dirty clouds whose allocated budget did not change", () => {
    const fixedStrategy = new RadialLodPackingStrategy();
    const movingStrategy = new RadialLodPackingStrategy({
      center: new Vector3(2, 0, 0),
    });
    const fixedPack = vi.spyOn(fixedStrategy, "pack");
    const movingPack = vi.spyOn(movingStrategy, "pack");
    const store = new GaussianStore();
    const fixed = store.addLod(singleLevelLod([0, 1, 2, 3]), {
      priority: -1,
      packingStrategy: fixedStrategy,
    });
    const moving = store.addLod(singleLevelLod([10, 11, 12, 13]), {
      packingStrategy: movingStrategy,
    });
    const limits = limitsForGaussianCapacity(6, 0);

    store.pack({ limits });
    expect(fixedPack).toHaveBeenCalledOnce();
    expect(movingPack).toHaveBeenCalledOnce();

    movingStrategy.setCenter(new Vector3(12, 0, 0));
    moving.invalidatePacking();
    store.pack({ limits });

    expect(fixedPack).toHaveBeenCalledOnce();
    expect(movingPack).toHaveBeenCalledTimes(2);
    expect(fixed.gaussianCount).toBe(4);
  });

  it("reuses every slot without writes when no cloud selection changed", () => {
    const store = new GaussianStore();
    store.addLod(singleLevelLod([0, 1, 2, 3]));
    const limits = limitsForGaussianCapacity(4, 0);

    store.pack({ limits });
    store.pack({ limits });

    expect(store.lastPackStats).toMatchObject({
      fullRebuild: false,
      activeGaussians: 4,
      reusedSlots: 4,
      writtenSlots: 0,
      clearedSlots: 0,
      estimatedUploadBytes: 0,
    });
  });

  it("reuses a cell LOD prefix and writes or releases only its tail", () => {
    const lod = GaussianLod.build(
      GaussianOctree.build(data(10, 0, 0, [1]), { leafCapacity: 20 }),
      {
        levels: [{ retention: 0.2 }, { retention: 0.5 }, { retention: 1 }],
      },
    );
    let level = 0;
    const strategy = {
      pack: () => ({
        nodeIds: lod.octree.leafNodeIds.slice(),
        lodLevels: new Uint8Array(lod.octree.leafNodeIds.length).fill(level),
        gaussianCount:
          lod.nodes[lod.octree.leafNodeIds[0]!]!.levelCounts[level]!,
      }),
    };
    const store = new GaussianStore({ defaultPackingStrategy: strategy });
    const cloud = store.addLod(lod);
    const limits = limitsForGaussianCapacity(10, 0);

    store.pack({ limits });
    level = 1;
    cloud.invalidatePacking();
    store.pack({ limits });
    expect(store.lastPackStats).toMatchObject({
      reusedSlots: 2,
      writtenSlots: 3,
      clearedSlots: 0,
    });

    level = 0;
    cloud.invalidatePacking();
    store.pack({ limits });
    expect(store.lastPackStats).toMatchObject({
      reusedSlots: 2,
      writtenSlots: 0,
      clearedSlots: 3,
    });
  });

  it("updates retained packed slots when their selected LOD level changes", () => {
    const lod = GaussianLod.build(
      GaussianOctree.build(data(10, 0, 0, [1]), { leafCapacity: 20 }),
      {
        levels: [{ retention: 0.2 }, { retention: 0.5 }, { retention: 1 }],
      },
    );
    let level = 0;
    const strategy = {
      pack: () => ({
        nodeIds: lod.octree.leafNodeIds.slice(),
        lodLevels: new Uint8Array(lod.octree.leafNodeIds.length).fill(level),
        gaussianCount:
          lod.nodes[lod.octree.leafNodeIds[0]!]!.levelCounts[level]!,
      }),
    };
    const store = new GaussianStore({ defaultPackingStrategy: strategy });
    const cloud = store.addLod(lod);
    const lodLevels = store.enablePackedLodLevelAttribute();
    const limits = limitsForGaussianCapacity(10, 0);

    store.pack({ limits });
    expect(activeAttributeValues(store, lodLevels.array)).toEqual([0, 0]);
    expect(store.lastPackStats?.estimatedUploadBytes).toBe(2 * (64 + 4));

    level = 1;
    cloud.invalidatePacking();
    store.pack({ limits });

    expect(store.lastPackStats).toMatchObject({
      reusedSlots: 2,
      writtenSlots: 3,
      estimatedUploadBytes: 3 * 64 + 5 * 4,
    });
    expect(activeAttributeValues(store, lodLevels.array)).toEqual([
      1, 1, 1, 1, 1,
    ]);
    expect(lodLevels.bufferAttribute.updateRanges.length).toBeGreaterThan(0);
  });
});

function activeAttributeValues(
  store: GaussianStore,
  values: Uint32Array,
): number[] {
  const scalesOpacity = store.getPackedData().scalesOpacity
    .array as Float32Array;
  const result: number[] = [];
  for (let slot = 0; slot < store.getPackedData().count; slot++) {
    if (scalesOpacity[slot * 4 + 3]! > 0) result.push(values[slot]!);
  }
  return result;
}

function limitsForGaussianCapacity(capacity: number, shDegree: 0 | 1 | 2 | 3) {
  const bytes = capacity * (shDegree + 1) ** 2 * 16;
  return {
    maxStorageBufferBindingSize: bytes,
    maxBufferSize: bytes,
  };
}

function singleLevelLod(
  xs: readonly number[],
  degree: 0 | 1 | 2 | 3 = 0,
  coefficients: readonly number[] = [1],
): GaussianLod {
  const source = data(xs.length, degree, 0, coefficients);
  const means = source.means.array as Float32Array;
  xs.forEach((x, index) => {
    means[index * 4] = x;
    means[index * 4 + 1] = index % 2;
    means[index * 4 + 2] = index % 3;
  });
  return GaussianLod.build(GaussianOctree.build(source, { leafCapacity: 1 }), {
    levels: [{ retention: 1 }],
  });
}

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
