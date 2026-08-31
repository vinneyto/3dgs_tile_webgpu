import { describe, expect, it } from "vitest";
import {
  Group,
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
} from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianStore } from "../src/GaussianStore";
import { ObjectFrameState } from "../src/pipeline/ObjectFrameState";

const TEST_LIMITS = {
  maxStorageBufferBindingSize: 1_073_741_824,
  maxBufferSize: 1_073_741_824,
};

describe("ObjectFrameState", () => {
  it("tracks scene hierarchy visibility without changing the store layout", () => {
    const store = new GaussianStore();
    const cloud = store.add(oneGaussian());
    store.pack({ limits: TEST_LIMITS });
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
  });

  it("creates independent camera-specific buffers for the same store", () => {
    const store = new GaussianStore();
    const cloud = store.add(oneGaussian());
    store.pack({ limits: TEST_LIMITS });
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
