import type { Camera, WebGPURenderer } from "three/webgpu";
import { GaussianPass } from "./GaussianPass";
import type { GaussianPassComposition } from "./passes/GaussianPassComposition";
import type { GaussianPassOptions } from "./pipeline/types";
/** Attach an explicitly assembled logical graph to Three.js' render pipeline. */
export declare function composeGaussianPass(renderer: WebGPURenderer, camera: Camera, passes: GaussianPassComposition, options?: GaussianPassOptions): GaussianPass;
