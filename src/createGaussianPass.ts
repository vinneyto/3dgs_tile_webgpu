import { Object3D, PerspectiveCamera, type WebGPURenderer } from "three/webgpu";
import type { GaussianData } from "./GaussianData";
import { GaussianPass } from "./GaussianPass";
import type { GaussianPassOptions } from "./pipeline/types";

/** Convenience factory matching Three.js pass(), bloom(), and other TSL pass helpers. */
export function gaussianPass(
  renderer: WebGPURenderer,
  camera: PerspectiveCamera,
  gaussianData: GaussianData,
  anchor: Object3D,
  options?: GaussianPassOptions,
): GaussianPass {
  return new GaussianPass(renderer, camera, gaussianData, anchor, options);
}
