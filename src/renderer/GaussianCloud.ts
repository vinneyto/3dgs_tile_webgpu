import {
  Matrix4,
  Object3D,
  Ray,
  type Intersection,
  type Raycaster,
} from "three/webgpu";

import type { GaussianRaycastIndex } from "./GaussianRaycastIndex";

/** Actions the scene object delegates to its owning client store. */
export interface GaussianCloudOwner {
  remove(cloud: GaussianCloud): void;
  updatePackingPriority(cloud: GaussianCloud, priority: number): void;
  invalidateCloudPacking(cloud: GaussianCloud): void;
}

/** A transformable Three.js scene object backed by a range in a GaussianStore. */
export class GaussianCloud extends Object3D {
  readonly isGaussianCloud = true;
  readonly objectId: number;
  /** Accumulated alpha required for a pointer hit. Must be in (0, 1). */
  raycastAlphaThreshold = 0.5;

  private readonly ownerStore: GaussianCloudOwner;
  private packedGaussianCount: number;
  private priority: number;
  private raycastIndex: GaussianRaycastIndex | null = null;

  constructor(
    store: GaussianCloudOwner,
    objectId: number,
    gaussianCount: number,
    name = "GaussianCloud",
    priority = 0,
  ) {
    super();
    this.ownerStore = store;
    this.objectId = objectId;
    this.packedGaussianCount = gaussianCount;
    this.priority = priority;
    this.name = name;
  }

  get gaussianCount(): number {
    return this.packedGaussianCount;
  }

  /** Lower priorities receive Store budget first. Defaults to 0. */
  get packingPriority(): number {
    return this.priority;
  }

  set packingPriority(priority: number) {
    this.ownerStore.updatePackingPriority(this, priority);
  }

  /** Re-evaluate this cloud on the next Store pack after strategy parameters change. */
  invalidatePacking(): void {
    this.ownerStore.invalidateCloudPacking(this);
  }

  /** Internal Store hook used after a global budget redistribution. */
  updatePacking(gaussianCount: number): void {
    this.packedGaussianCount = gaussianCount;
  }

  /** Internal Store hook used while priorities are changed transactionally. */
  updatePackingPriority(priority: number): void {
    this.priority = priority;
  }

  /** Attach a transferable snapshot built by the data backend. Raycasts remain synchronous. */
  setRaycastIndex(index: GaussianRaycastIndex | null): void {
    this.raycastIndex = index;
  }

  getRaycastIndex(): GaussianRaycastIndex | null {
    return this.raycastIndex;
  }

  /** Synchronous raycast against the complete source octree snapshot. */
  raycast(raycaster: Raycaster, intersections: Intersection[]): void {
    if (this.raycastIndex === null) return;
    const inverseWorld = new Matrix4().copy(this.matrixWorld).invert();
    const localRay = new Ray().copy(raycaster.ray).applyMatrix4(inverseWorld);
    const hit = this.raycastIndex.raycast(localRay, this.raycastAlphaThreshold);
    if (hit !== null) {
      const point = hit.point.clone().applyMatrix4(this.matrixWorld);
      const distance = raycaster.ray.origin.distanceTo(point);
      if (distance >= raycaster.near && distance <= raycaster.far) {
        intersections.push({
          distance,
          point,
          object: this,
          index: hit.gaussianIndex,
        });
      }
    }
  }

  /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
  dispose(): void {
    this.ownerStore.remove(this);
  }
}
