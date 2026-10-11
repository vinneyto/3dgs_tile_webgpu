import { type GaussianRasterNodeSlots } from "../nodes/GaussianContextNodes";
import { type FrameUniforms } from "./FrameUniforms";
/** Shared final scalar graph. Called only after direct accumulation or ordered chunk composition. */
export declare function finalizeGaussianDepth(weightedViewDepth: any, transmittance: any, pixel: any, frame: FrameUniforms, depthAlphaThreshold: number, nodes: GaussianRasterNodeSlots): any;
