import { describe, expect, it, vi } from "vitest";
import {
  PerspectiveCamera,
  StorageBufferAttribute,
  type Node,
} from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLod } from "../src/GaussianLod";
import { createGaussianRippleNode } from "../src/GaussianRippleNode";
import { GaussianOctree } from "../src/GaussianOctree";
import { GaussianStore } from "../src/GaussianStore";

describe("createGaussianRippleNode", () => {
  it("starts a ripple from the nearest full-source octree hit", () => {
    const data = oneGaussian();
    const octree = GaussianOctree.build(data);
    const lod = GaussianLod.build(octree, {
      levels: [{ retention: 1 }],
    });
    const store = new GaussianStore();
    const cloud = store.addLod(lod);
    const camera = new PerspectiveCamera(50, 1, 0.01, 100);
    camera.position.set(0, 0, 2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    let clickListener: ((event: MouseEvent) => void) | undefined;
    const domElement = {
      addEventListener: (
        type: string,
        listener: (event: MouseEvent) => void,
      ) => {
        if (type === "click") clickListener = listener;
      },
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      }),
    } as unknown as HTMLElement;
    const raycast = vi.spyOn(octree, "raycast");
    const controller = new AbortController();

    const node = createGaussianRippleNode({
      cloud,
      camera,
      domElement,
      signal: controller.signal,
    });
    clickListener?.({ button: 0, clientX: 50, clientY: 50 } as MouseEvent);

    expect((node as Node).isNode).toBe(true);
    expect(raycast).toHaveBeenCalledOnce();
    expect(raycast.mock.calls[0]?.[1]).toEqual({
      radiusScale: 3,
      maxHits: 1,
    });
    controller.abort();
  });
});

function oneGaussian(): GaussianData {
  const attribute = (values: readonly number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  return new GaussianData(
    {
      means: attribute([0, 0, 0, 0]),
      scalesOpacity: attribute([0.1, 0.1, 0.1, 1]),
      rotations: attribute([0, 0, 0, 1]),
      shCoefficients: attribute([0, 0, 0, 0]),
    },
    { count: 1 },
  );
}
