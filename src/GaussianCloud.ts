import {
  Matrix4,
  Object3D,
  Ray,
  type Intersection,
  type Raycaster,
} from "three/webgpu";

import type { GaussianStore } from "./GaussianStore";
import type { GaussianLod, GaussianLodPacking } from "./GaussianLod";

export type GaussianRaycastMode = "rendered" | "full";

/** A transformable Three.js scene object backed by a range in a GaussianStore. */
export class GaussianCloud extends Object3D {
  readonly isGaussianCloud = true;
  readonly objectId: number;
  readonly gaussianCount: number;
  readonly lod: GaussianLod | null;

  raycastMode: GaussianRaycastMode = "rendered";

  private readonly ownerStore: GaussianStore;
  private readonly packing: GaussianLodPacking | null;

  constructor(
    store: GaussianStore,
    objectId: number,
    gaussianCount: number,
    name = "GaussianCloud",
    lod: GaussianLod | null = null,
    packing: GaussianLodPacking | null = null,
  ) {
    super();
    this.ownerStore = store;
    this.objectId = objectId;
    this.gaussianCount = gaussianCount;
    this.lod = lod;
    this.packing = packing;
    this.name = name;
  }

  get lodPacking(): GaussianLodPacking | null {
    return this.packing;
  }

  /** Raycast either the packed/rendered LOD or the complete source octree. */
  raycast(raycaster: Raycaster, intersections: Intersection[]): void {
    if (this.lod === null || this.packing === null) return;
    const inverseWorld = new Matrix4().copy(this.matrixWorld).invert();
    const localRay = new Ray().copy(raycaster.ray).applyMatrix4(inverseWorld);
    const hits =
      this.raycastMode === "full"
        ? this.lod.octree.raycast(localRay)
        : this.lod.raycast(localRay, this.packing);
    for (const hit of hits) {
      const point = hit.point.clone().applyMatrix4(this.matrixWorld);
      const distance = raycaster.ray.origin.distanceTo(point);
      if (distance < raycaster.near || distance > raycaster.far) continue;
      intersections.push({
        distance,
        point,
        object: this,
        index: hit.gaussianIndex,
      });
    }
  }

  /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
  dispose(): void {
    this.ownerStore.remove(this);
  }
}
