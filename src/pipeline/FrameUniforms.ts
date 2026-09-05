import { Matrix4, PerspectiveCamera, Vector4 } from "three/webgpu";
import { uniform } from "three/tsl";

export class FrameUniforms {
  readonly projection = uniform(new Matrix4());
  readonly view = uniform(new Matrix4());
  readonly viewport = uniform(new Vector4());
  readonly tilesX = uniform(1, "uint");
  readonly tilesY = uniform(1, "uint");

  constructor(
    private readonly camera: PerspectiveCamera,
    readonly background: readonly [number, number, number, number],
    readonly tileSize: 8 | 16 = 16,
  ) {}

  update(width: number, height: number, tilesX: number, tilesY: number): void {
    this.camera.updateWorldMatrix(true, false);
    this.projection.value.copy(this.camera.projectionMatrix);
    this.view.value.copy(this.camera.matrixWorldInverse);
    this.viewport.value.set(width, height, this.camera.near, this.camera.far);
    this.tilesX.value = tilesX;
    this.tilesY.value = tilesY;
  }
}
