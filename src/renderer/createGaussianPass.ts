import { PerspectiveCamera, type WebGPURenderer } from "three/webgpu";
import type { GaussianRenderStore } from "./GaussianRenderStore";
import { GaussianPass } from "./GaussianPass";
import type { GaussianPassOptions } from "./pipeline/types";

/** Convenience factory matching Three.js pass(), bloom(), and other TSL pass helpers. */
export function gaussianPass(
  renderer: WebGPURenderer,
  camera: PerspectiveCamera,
  gaussianStore: GaussianRenderStore,
  options?: GaussianPassOptions,
): GaussianPass {
  return new GaussianPass(renderer, camera, gaussianStore, options);
}
