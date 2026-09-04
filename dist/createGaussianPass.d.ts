import { PerspectiveCamera, type WebGPURenderer } from "three/webgpu";
import type { GaussianStore } from "./GaussianStore";
import { GaussianPass } from "./GaussianPass";
import type { GaussianPassOptions } from "./pipeline/types";
/** Convenience factory matching Three.js pass(), bloom(), and other TSL pass helpers. */
export declare function gaussianPass(renderer: WebGPURenderer, camera: PerspectiveCamera, gaussianStore: GaussianStore, options?: GaussianPassOptions): GaussianPass;
