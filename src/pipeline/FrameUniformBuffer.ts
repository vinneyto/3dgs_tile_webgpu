import { Matrix4, PerspectiveCamera, Vector3, Object3D } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import { FRAME_UNIFORM_BYTES } from "./constants";

export class FrameUniformBuffer {
  readonly buffer: GPUBuffer;

  private readonly modelView = new Matrix4();
  private readonly inverseModel = new Matrix4();
  private readonly cameraWorldPosition = new Vector3();
  private readonly cameraLocalPosition = new Vector3();

  constructor(
    private readonly device: GPUDevice,
    private readonly camera: PerspectiveCamera,
    private readonly data: GaussianData,
    private readonly anchor: Object3D,
    private readonly background: readonly [number, number, number, number],
  ) {
    this.buffer = device.createBuffer({
      label: "3dgs.frame-uniforms",
      size: FRAME_UNIFORM_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  update(width: number, height: number, tilesX: number, tilesY: number): void {
    this.anchor.updateWorldMatrix(true, false);
    this.camera.updateWorldMatrix(true, false);
    this.modelView.multiplyMatrices(
      this.camera.matrixWorldInverse,
      this.anchor.matrixWorld,
    );
    this.inverseModel.copy(this.anchor.matrixWorld).invert();
    this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);
    this.cameraLocalPosition
      .copy(this.cameraWorldPosition)
      .applyMatrix4(this.inverseModel);

    const bytes = new ArrayBuffer(FRAME_UNIFORM_BYTES);
    const floats = new Float32Array(bytes);
    const uints = new Uint32Array(bytes);
    this.modelView.toArray(floats, 0);
    this.camera.projectionMatrix.toArray(floats, 16);
    floats.set(
      [
        this.cameraLocalPosition.x,
        this.cameraLocalPosition.y,
        this.cameraLocalPosition.z,
        1,
      ],
      32,
    );
    floats.set([width, height, this.camera.near, this.camera.far], 36);
    uints.set([tilesX, tilesY, this.data.count, this.data.shDegree], 40);
    floats.set(this.background, 44);
    this.device.queue.writeBuffer(this.buffer, 0, bytes);
  }

  dispose(): void {
    this.buffer.destroy();
  }
}
