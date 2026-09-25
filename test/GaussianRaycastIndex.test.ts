import { describe, expect, it } from "vitest";
import { Ray, Raycaster, StorageBufferAttribute, Vector3 } from "three/webgpu";
import { GaussianCloud } from "../src/GaussianCloud";
import type { GaussianBackend as GaussianStore } from "../src/GaussianBackend";
import { GaussianData } from "../src/GaussianData";
import {
  GaussianOctree,
  alphaCompositeRaycastHit,
} from "../src/GaussianOctree";
import { GaussianRaycastIndex } from "../src/data-backend/GaussianRaycastIndex";
import { createGaussianRaycastBuffers } from "../src/data-backend/createGaussianRaycastBuffers";

describe("transferable client raycast index", () => {
  it("matches full BVH raycast and respects the rendered selection synchronously", () => {
    const data = new GaussianData(
      {
        means: new StorageBufferAttribute(
          new Float32Array([0, 0, 0, 0, 2, 0, 0, 0]),
          4,
        ),
        scalesOpacity: new StorageBufferAttribute(
          new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]),
          4,
        ),
        rotations: new StorageBufferAttribute(
          new Float32Array([0, 0, 0, 1, 0, 0, 0, 1]),
          4,
        ),
        shCoefficients: new StorageBufferAttribute(new Float32Array(8), 4),
      },
      { count: 2 },
    );
    const octree = GaussianOctree.build(data, { leafCapacity: 1 });
    const index = new GaussianRaycastIndex(
      createGaussianRaycastBuffers(octree),
    );
    const ray = new Ray(new Vector3(0, 0, 3), new Vector3(0, 0, -1));
    const expected = alphaCompositeRaycastHit(
      ray,
      data,
      octree.raycast(ray),
      0.5,
    );
    expect(index.raycast(ray, "full", 0.5)?.gaussianIndex).toBe(
      expected?.gaussianIndex,
    );
    expect(index.raycast(ray, "rendered", 0.5)).toBeNull();
    index.setRenderedIndices(Uint32Array.from([1]).buffer);
    expect(index.raycast(ray, "rendered", 0.5)).toBeNull();
    index.setRenderedIndices(Uint32Array.from([0]).buffer);
    expect(index.raycast(ray, "rendered", 0.5)?.gaussianIndex).toBe(0);
    const cloud = new GaussianCloud({} as GaussianStore, 0, 0);
    cloud.setRaycastIndex(index);
    cloud.raycastMode = "rendered";
    const intersections: ReturnType<Raycaster["intersectObject"]> = [];
    cloud.raycast(new Raycaster(ray.origin, ray.direction), intersections);
    expect(intersections[0]?.index).toBe(0);
    octree.dispose();
    data.dispose();
  });
});
