import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  StorageBufferAttribute,
  type WebGPURenderer,
} from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLodColorHelper } from "../src/GaussianLodColorHelper";
import { GaussianPass } from "../src/GaussianPass";
import { GaussianStore } from "../src/GaussianStore";

const TEST_LIMITS = {
  maxStorageBufferBindingSize: 1_073_741_824,
  maxBufferSize: 1_073_741_824,
};

describe("GaussianLodColorHelper", () => {
  it("overrides and restores the GaussianPass color node", () => {
    const { pass, store } = createPass();
    const original = pass.rasterColorNode;
    const helper = new GaussianLodColorHelper(pass);

    expect(store.attributes.get("lodLevel")).toBe(helper.lodLevelAttribute);
    expect(pass.rasterColorNode).not.toBe(original);

    helper.enabled = false;
    expect(pass.rasterColorNode).toBe(original);

    helper.enabled = true;
    expect(pass.rasterColorNode).not.toBe(original);
    helper.dispose();
    expect(pass.rasterColorNode).toBe(original);
  });

  it("validates the LOD tint strength", () => {
    const { pass } = createPass();

    expect(
      () => new GaussianLodColorHelper(pass, { tintStrength: -0.01 }),
    ).toThrow(RangeError);
    expect(
      () => new GaussianLodColorHelper(pass, { tintStrength: 1.01 }),
    ).toThrow(RangeError);
  });

  it("rebuilds its color graph after a full Store buffer replacement", () => {
    const { pass, store } = createPass();
    const helper = new GaussianLodColorHelper(pass);
    const previousNode = pass.rasterColorNode;
    const previousBuffer = helper.lodLevelAttribute.bufferAttribute;

    store.add(oneGaussian());
    store.pack({ limits: TEST_LIMITS });
    helper.update();

    expect(helper.lodLevelAttribute.bufferAttribute).not.toBe(previousBuffer);
    expect(pass.rasterColorNode).not.toBe(previousNode);
  });
});

function createPass(): { pass: GaussianPass; store: GaussianStore } {
  const store = new GaussianStore();
  store.add(oneGaussian());
  store.pack({ limits: TEST_LIMITS });
  const renderer = {
    hasFeature: () => false,
    getDrawingBufferSize: vi.fn(),
    initRenderTarget: vi.fn(),
  } as unknown as WebGPURenderer;
  const pass = new GaussianPass(renderer, new PerspectiveCamera(), store);
  return { pass, store };
}

function oneGaussian(): GaussianData {
  const attribute = (values: readonly number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  return new GaussianData(
    {
      means: attribute([0, 0, -2, 0]),
      scalesOpacity: attribute([1, 1, 1, 1]),
      rotations: attribute([0, 0, 0, 1]),
      shCoefficients: attribute([0, 0, 0, 0]),
    },
    { count: 1 },
  );
}
