import {
  Matrix4,
  Object3D,
  PerspectiveCamera,
  Vector3,
  Vector4,
} from "three/webgpu";
import { uniform } from "three/tsl";
import type { GaussianData } from "../GaussianData";

export class FrameUniforms {
  readonly modelView = uniform(new Matrix4());
  readonly projection = uniform(new Matrix4());
  readonly cameraLocal = uniform(new Vector4());
  readonly viewport = uniform(new Vector4());
  readonly tilesX = uniform(1, "uint");
  readonly tilesY = uniform(1, "uint");

  private readonly modelViewValue = new Matrix4();
  private readonly inverseModel = new Matrix4();
  private readonly cameraWorldPosition = new Vector3();
  private readonly cameraLocalPosition = new Vector3();

  constructor(
    private readonly camera: PerspectiveCamera,
    readonly data: GaussianData,
    private readonly anchor: Object3D,
    readonly background: readonly [number, number, number, number],
  ) {}

  update(width: number, height: number, tilesX: number, tilesY: number): void {
    this.anchor.updateWorldMatrix(true, false);
    this.camera.updateWorldMatrix(true, false);
    this.modelViewValue.multiplyMatrices(
      this.camera.matrixWorldInverse,
      this.anchor.matrixWorld,
    );
    this.inverseModel.copy(this.anchor.matrixWorld).invert();
    this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);
    this.cameraLocalPosition
      .copy(this.cameraWorldPosition)
      .applyMatrix4(this.inverseModel);

    this.modelView.value.copy(this.modelViewValue);
    this.projection.value.copy(this.camera.projectionMatrix);
    this.cameraLocal.value.set(
      this.cameraLocalPosition.x,
      this.cameraLocalPosition.y,
      this.cameraLocalPosition.z,
      1,
    );
    this.viewport.value.set(width, height, this.camera.near, this.camera.far);
    this.tilesX.value = tilesX;
    this.tilesY.value = tilesY;
  }
}
