import { describe, expect, it, vi } from "vitest";
import {
  Group,
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
} from "three/webgpu";

import { GaussianData } from "../src/renderer/GaussianData";
import { GaussianCloud } from "../src/renderer/GaussianCloud";
import { packedStore } from "./helpers/packedStore";
import { ObjectFrameState } from "../src/renderer/pipeline/ObjectFrameState";

describe("ObjectFrameState", () => {
  it("tracks scene hierarchy visibility without changing the store layout", () => {
    const { store, cloud } = packedStore(oneGaussian());
    const group = new Group();
    const scene = new Scene();
    scene.add(group);
    group.add(cloud);
    const camera = new PerspectiveCamera();
    scene.add(camera);
    const state = new ObjectFrameState(camera, store, store.count);
    const version = store.layoutVersion;

    state.update();
    expect(values(state)[40]).toBe(1);

    group.visible = false;
    state.update();
    expect(values(state)[40]).toBe(0);
    expect(store.layoutVersion).toBe(version);

    group.remove(cloud);
    state.update();
    expect(values(state)[40]).toBe(0);

    group.add(cloud);
    group.visible = true;
    state.update();
    expect(values(state)[40]).toBe(1);
    vi.spyOn(store, "clouds", "get").mockReturnValue([]);
    state.update();
    expect(values(state)[40]).toBe(0);
  });

  it("creates independent camera-specific buffers for the same store", () => {
    const { store, cloud } = packedStore(oneGaussian());
    new Scene().add(cloud);
    const leftCamera = new PerspectiveCamera();
    leftCamera.position.x = -2;
    const rightCamera = new PerspectiveCamera();
    rightCamera.position.x = 3;
    const left = new ObjectFrameState(leftCamera, store, store.count);
    const right = new ObjectFrameState(rightCamera, store, store.count);

    left.update();
    right.update();

    expect(left.attribute).not.toBe(right.attribute);
    expect(values(left).slice(20, 40)).not.toEqual(values(right).slice(20, 40));
  });

  it("ignores a loaded cloud until its object slot arrives in packed buffers", () => {
    const { store, cloud } = packedStore(oneGaussian());
    const extra = new GaussianCloud(store, store.objectCapacity, 0);
    const scene = new Scene();
    scene.add(cloud, extra);
    vi.spyOn(store, "clouds", "get").mockReturnValue([cloud, extra]);
    const state = new ObjectFrameState(new PerspectiveCamera(), store, store.count);

    expect(() => state.update()).not.toThrow();
    expect(values(state)[40]).toBe(1);
    state.dispose();
    store.dispose();
  });
});

function values(state: ObjectFrameState): number[] {
  return Array.from(state.attribute.array as Float32Array);
}

function oneGaussian(): GaussianData {
  const attribute = (values: readonly number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  return new GaussianData(
    {
      means: attribute([0, 0, 0, 0]),
      scalesOpacity: attribute([1, 1, 1, 1]),
      rotations: attribute([0, 0, 0, 1]),
      shCoefficients: attribute([0, 0, 0, 0]),
    },
    { count: 1 },
  );
}
