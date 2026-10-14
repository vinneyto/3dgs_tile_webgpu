import { Camera, type WebGPURenderer } from "three/webgpu";
import type { GaussianRenderStore } from "./GaussianRenderStore";
import { createGaussianPassComposition } from "./passes/createGaussianPassComposition";
import { composeGaussianPass } from "./composeGaussianPass";
import { GaussianPass } from "./GaussianPass";
import type { GaussianPassOptions } from "./pipeline/types";

/** Convenience factory matching Three.js pass(), bloom(), and other TSL pass helpers. */
export function gaussianPass(
  renderer: WebGPURenderer,
  camera: Camera,
  gaussianStore: GaussianRenderStore,
  options?: GaussianPassOptions,
): GaussianPass {
  return composeGaussianPass(
    renderer,
    camera,
    createGaussianPassComposition(gaussianStore),
    options,
  );
}
