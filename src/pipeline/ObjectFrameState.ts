import {
  Matrix4,
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
  Vector3,
} from "three/webgpu";

import type { GaussianCloud } from "../GaussianCloud";
import type { GaussianStore } from "../GaussianStore";

export const OBJECT_FRAME_VEC4S = 6;

/** Camera-specific object transforms shared by every Gaussian of one cloud. */
export class ObjectFrameState {
  readonly attribute: StorageBufferAttribute;

  private readonly values: Float32Array;
  private readonly frameComponentOffset: number;
  private readonly frameComponentCount: number;
  private readonly modelView = new Matrix4();
  private readonly inverseModel = new Matrix4();
  private readonly cameraWorldPosition = new Vector3();
  private readonly cameraLocalPosition = new Vector3();

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly store: GaussianStore,
    gaussianCount: number,
  ) {
    this.frameComponentOffset = gaussianCount * 4;
    this.frameComponentCount = store.objectCapacity * OBJECT_FRAME_VEC4S * 4;
    this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount,
    );
    this.attribute = new StorageBufferAttribute(this.values, 4);
    this.attribute.name = "3dgs.object-frame-state";
  }

  update(): void {
    this.camera.updateWorldMatrix(true, false);
    this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);
    this.values.fill(0, this.frameComponentOffset);

    for (const cloud of this.store.clouds) this.writeCloud(cloud);
    this.attribute.clearUpdateRanges();
    this.attribute.addUpdateRange(
      this.frameComponentOffset,
      this.frameComponentCount,
    );
    this.attribute.needsUpdate = true;
  }

  dispose(): void {
    this.attribute.dispose();
  }

  private writeCloud(cloud: GaussianCloud): void {
    cloud.updateWorldMatrix(true, false);
    this.modelView.multiplyMatrices(
      this.camera.matrixWorldInverse,
      cloud.matrixWorld,
    );
    this.inverseModel.copy(cloud.matrixWorld).invert();
    this.cameraLocalPosition
      .copy(this.cameraWorldPosition)
      .applyMatrix4(this.inverseModel);

    const base =
      this.frameComponentOffset + cloud.objectId * OBJECT_FRAME_VEC4S * 4;
    this.values.set(this.modelView.elements, base);
    this.values[base + 16] = this.cameraLocalPosition.x;
    this.values[base + 17] = this.cameraLocalPosition.y;
    this.values[base + 18] = this.cameraLocalPosition.z;
    this.values[base + 19] = 1;
    this.values[base + 20] = isEffectivelyVisible(cloud, this.camera) ? 1 : 0;
  }
}

function isEffectivelyVisible(
  cloud: GaussianCloud,
  camera: PerspectiveCamera,
): boolean {
  if (!cloud.layers.test(camera.layers)) return false;
  let current = cloud as GaussianCloud["parent"] | GaussianCloud;
  let root: GaussianCloud["parent"] | GaussianCloud = cloud;
  while (current !== null) {
    if (!current.visible) return false;
    root = current;
    current = current.parent;
  }
  return root instanceof Scene;
}
