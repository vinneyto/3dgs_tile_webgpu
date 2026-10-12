import { StorageBindings } from "./StorageBindings";
import {
  Matrix4,
  Camera,
  Scene,
  StorageBufferAttribute,
  Vector3,
} from "three/webgpu";

import type { GaussianCloud } from "../GaussianCloud";
import type { GaussianRenderStore } from "../GaussianRenderStore";

// matrixWorld, modelView, camera position in object-local space, visibility.
export const OBJECT_FRAME_VEC4S = 10;

/** Camera-specific object transforms shared by every Gaussian of one cloud. */
export class ObjectFrameState {
  attribute: StorageBufferAttribute;

  private values: Float32Array;
  private frameComponentOffset: number;
  private frameComponentCount: number;
  private readonly modelView = new Matrix4();
  private readonly inverseModel = new Matrix4();
  private readonly cameraWorldPosition = new Vector3();
  private readonly cameraLocalPosition = new Vector3();

  constructor(
    private readonly camera: Camera,
    private readonly store: GaussianRenderStore,
    gaussianCount: number,
    private readonly bindings = new StorageBindings(),
  ) {
    this.frameComponentOffset = gaussianCount * 4;
    this.frameComponentCount = store.objectCapacity * OBJECT_FRAME_VEC4S * 4;
    this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount,
    );
    this.attribute = new StorageBufferAttribute(this.values, 4);
    this.attribute.name = "3dgs.object-frame-state";
  }

  get slotCapacity(): number {
    return this.frameComponentOffset / 4;
  }

  resize(gaussianCount: number): void {
    const currentObjects = this.frameComponentCount / (OBJECT_FRAME_VEC4S * 4);
    const objectCount =
      this.store.objectCapacity > currentObjects
        ? Math.max(this.store.objectCapacity, currentObjects * 2)
        : currentObjects;
    const maximumSlots =
      this.bindings.maximumCount(4) - objectCount * OBJECT_FRAME_VEC4S;
    if (gaussianCount > maximumSlots)
      throw new RangeError("Object state exceeds device binding size");
    const slotCapacity =
      gaussianCount > this.slotCapacity
        ? Math.min(maximumSlots, Math.max(gaussianCount, this.slotCapacity * 2))
        : this.slotCapacity;
    const offset = slotCapacity * 4;
    const count = objectCount * OBJECT_FRAME_VEC4S * 4;
    if (
      offset === this.frameComponentOffset &&
      count === this.frameComponentCount
    )
      return;
    const previous = this.attribute;
    this.values = new Float32Array(offset + count);
    this.attribute = new StorageBufferAttribute(this.values, 4);
    this.attribute.name = previous.name;
    this.frameComponentOffset = offset;
    this.frameComponentCount = count;
    this.bindings.replace(previous, this.attribute);
    this.bindings.retire(previous);
  }

  update(): void {
    this.camera.updateWorldMatrix(true, false);
    this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);
    // Removed clouds must become invisible even before the new layout arrives.
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
    this.bindings.retire(this.attribute);
  }

  private writeCloud(cloud: GaussianCloud): void {
    // A newly loaded cloud can exist before the backend replaces packed buffers.
    if (cloud.objectId >= this.store.objectCapacity) return;
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
    this.values.set(cloud.matrixWorld.elements, base);
    this.values.set(this.modelView.elements, base + 16);
    this.values[base + 32] = this.cameraLocalPosition.x;
    this.values[base + 33] = this.cameraLocalPosition.y;
    this.values[base + 34] = this.cameraLocalPosition.z;
    this.values[base + 35] = 1;
    this.values[base + 36] = isEffectivelyVisible(cloud, this.camera) ? 1 : 0;
  }
}

function isEffectivelyVisible(cloud: GaussianCloud, camera: Camera): boolean {
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
