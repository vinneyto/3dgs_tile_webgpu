import {
  Camera,
  Matrix4,
  PerspectiveCamera,
  OrthographicCamera,
  Vector4,
} from "three/webgpu";
import { uniform } from "three/tsl";
import {
  gaussianPassViewMatrix,
  gaussianPassProjectionMatrix,
  gaussianPassViewport,
  gaussianPassDepthRange,
  gaussianPassFilterVariance,
} from "../nodes/GaussianContextNodes";
import type { GaussianRenderDomain } from "./types";

export class FrameUniforms {
  readonly projection = uniform(new Matrix4());
  readonly view = uniform(new Matrix4());
  readonly viewport = uniform(new Vector4());
  readonly filterVariance = uniform(0.3);
  readonly invalidDepthValue = uniform(1);
  readonly boundaryAxis = uniform(0, "uint");
  readonly activeCount = uniform(0, "uint");
  readonly tilesX = uniform(1, "uint");
  readonly tilesY = uniform(1, "uint");
  readonly tileCount = uniform(1, "uint");

  constructor(
    private readonly camera: Camera,
    readonly background: readonly [number, number, number, number],
    private readonly domain: GaussianRenderDomain = {
      depthRange: null,
      filterVariance: 0.3,
      invalidDepthValue: 1,
      boundaryPolicy: "clip",
    },
  ) {}

  update(width: number, height: number, tilesX: number, tilesY: number): void {
    this.camera.updateWorldMatrix(true, false);
    this.projection.value.copy(this.camera.projectionMatrix);
    this.view.value.copy(this.camera.matrixWorldInverse);
    const range = this.domain.depthRange ?? cameraDepthRange(this.camera);
    this.viewport.value.set(width, height, range[0], range[1]);
    this.filterVariance.value = this.domain.filterVariance;
    this.invalidDepthValue.value = this.domain.invalidDepthValue;
    this.boundaryAxis.value =
      this.domain.boundaryPolicy === "repeat-x"
        ? 1
        : this.domain.boundaryPolicy === "repeat-y"
          ? 2
          : 0;
    this.tilesX.value = tilesX;
    this.tilesY.value = tilesY;
    this.tileCount.value = tilesX * tilesY;
  }
}

export function cameraDepthRange(camera: Camera): readonly [number, number] {
  if (
    camera instanceof PerspectiveCamera ||
    camera instanceof OrthographicCamera
  )
    return [camera.near, camera.far];
  throw new TypeError(
    "GaussianPass with a generic Camera requires an explicit depthRange",
  );
}

export function passContextOverrides(
  frame: FrameUniforms,
): Map<any, () => any> {
  return new Map<any, () => any>([
    [gaussianPassViewMatrix, () => frame.view],
    [gaussianPassProjectionMatrix, () => frame.projection],
    [gaussianPassViewport, () => frame.viewport.xy],
    [gaussianPassDepthRange, () => frame.viewport.zw],
    [gaussianPassFilterVariance, () => frame.filterVariance],
  ]);
}
