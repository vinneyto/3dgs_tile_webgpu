import { describe, expect, it } from "vitest";
import { Ray, Raycaster, StorageBufferAttribute, Vector3 } from "three/webgpu";
import { GaussianCloud } from "../src/renderer/GaussianCloud";
import type { GaussianStore } from "../src/renderer/GaussianStore";
import { GaussianData } from "../src/renderer/GaussianData";
import {
  GaussianOctree,
  alphaCompositeRaycastHit,
} from "../src/streaming-backend-impl/GaussianOctree";
import { GaussianRaycastIndex } from "../src/renderer/GaussianRaycastIndex";
import { createRaycastSnapshot } from "../src/streaming-backend-impl/createRaycastSnapshot";

describe("transferable client raycast index", () => {
  it("matches the full source BVH synchronously", () => {
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
    const index = new GaussianRaycastIndex(createRaycastSnapshot(octree));
    const ray = new Ray(new Vector3(0, 0, 3), new Vector3(0, 0, -1));
    const expected = alphaCompositeRaycastHit(
      ray,
      data,
      octree.raycast(ray),
      0.5,
    );
    expect(index.raycast(ray, 0.5)?.gaussianIndex).toBe(
      expected?.gaussianIndex,
    );
    const cloud = new GaussianCloud({} as GaussianStore, 0, 0);
    cloud.setRaycastIndex(index);
    const intersections: ReturnType<Raycaster["intersectObject"]> = [];
    cloud.raycast(new Raycaster(ray.origin, ray.direction), intersections);
    expect(intersections[0]?.index).toBe(0);
    octree.dispose();
    data.dispose();
  });
});
