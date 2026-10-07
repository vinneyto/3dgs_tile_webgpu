import {
  Matrix4,
  Object3D,
  Ray,
  Matrix3,
  Vector3,
  type Intersection,
  type Raycaster,
} from "three/webgpu";

import type { GaussianRaycastIndex } from "./GaussianRaycastIndex";

/** Actions the scene object delegates to its owning client store. */
export interface GaussianCloudOwner {
  remove(cloud: GaussianCloud): void;
  setPackingPriority(cloud: GaussianCloud, priority: number): Promise<void>;
  invalidateCloudPacking(cloud: GaussianCloud): Promise<void>;
}

/** A transformable Three.js scene object backed by a range in a GaussianStore. */
export class GaussianCloud extends Object3D {
  readonly isGaussianCloud = true;
  readonly objectId: number;
  /** Ignore coarse snapshot Gaussians below this opacity. */
  minRaycastOpacity = 0.2;
  raycastable = true;

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

  /** Last confirmed priority. Lower priorities receive Store budget first. Defaults to 0. */
  get packingPriority(): number {
    return this.priority;
  }

  setPackingPriority(priority: number): Promise<void> {
    return this.ownerStore.setPackingPriority(this, priority);
  }

  /** Ask the backend to re-evaluate this cloud after strategy parameters change. */
  invalidatePacking(): Promise<void> {
    return this.ownerStore.invalidateCloudPacking(this);
  }

  /** Internal Store hook used after a global budget redistribution. */
  updatePacking(gaussianCount: number): void {
    this.packedGaussianCount = gaussianCount;
  }

  /** Internal Store hook used after the backend confirms a priority change. */
  applyPackingPriority(priority: number): void {
    this.priority = priority;
  }

  /** Attach a coarse snapshot exported by the data backend. Raycasts remain synchronous. */
  setRaycastIndex(index: GaussianRaycastIndex | null): void {
    this.raycastIndex = index;
  }

  getRaycastIndex(): GaussianRaycastIndex | null {
    return this.raycastIndex;
  }

  /** Synchronous raycast against the coarse mipmap snapshot. */
  raycast(raycaster: Raycaster, intersections: Intersection[]): void {
    if (!this.raycastable || this.raycastIndex === null) return;
    const inverseWorld = new Matrix4().copy(this.matrixWorld).invert();
    const localRay = new Ray().copy(raycaster.ray).applyMatrix4(inverseWorld);
    const localScale = new Vector3()
      .copy(raycaster.ray.direction)
      .applyMatrix3(new Matrix3().setFromMatrix4(inverseWorld))
      .length();
    const hit = this.raycastIndex.raycast(
      localRay,
      this.minRaycastOpacity,
      raycaster.near * localScale,
      raycaster.far * localScale,
    );
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
