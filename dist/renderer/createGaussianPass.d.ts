import { Camera, type WebGPURenderer } from "three/webgpu";
import type { GaussianRenderStore } from "./GaussianRenderStore";
import { GaussianPass } from "./GaussianPass";
import type { GaussianPassOptions } from "./pipeline/types";
/** Convenience factory matching Three.js pass(), bloom(), and other TSL pass helpers. */
export declare function gaussianPass(renderer: WebGPURenderer, camera: Camera, gaussianStore: GaussianRenderStore, options?: GaussianPassOptions): GaussianPass;
