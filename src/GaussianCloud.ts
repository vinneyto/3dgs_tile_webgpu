import { Object3D } from "three/webgpu";

import type { GaussianStore } from "./GaussianStore";

/** A transformable Three.js scene object backed by a range in a GaussianStore. */
export class GaussianCloud extends Object3D {
  readonly isGaussianCloud = true;
  readonly objectId: number;
  readonly gaussianCount: number;

  private readonly ownerStore: GaussianStore;

  constructor(
    store: GaussianStore,
    objectId: number,
    gaussianCount: number,
    name = "GaussianCloud",
  ) {
    super();
    this.ownerStore = store;
    this.objectId = objectId;
    this.gaussianCount = gaussianCount;
    this.name = name;
  }

  /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
  dispose(): void {
    this.ownerStore.remove(this);
  }
}
