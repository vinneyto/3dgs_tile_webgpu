import { PerspectiveCamera, type WebGPURenderer } from "three/webgpu";
import type { GaussianBackend } from "./GaussianBackend";
import { GaussianPass } from "./GaussianPass";
import type { GaussianPassOptions } from "./pipeline/types";

/** Convenience factory matching Three.js pass(), bloom(), and other TSL pass helpers. */
export function gaussianPass(
  renderer: WebGPURenderer,
  camera: PerspectiveCamera,
  gaussianStore: GaussianBackend,
  options?: GaussianPassOptions,
): GaussianPass {
  return new GaussianPass(renderer, camera, gaussianStore, options);
}
