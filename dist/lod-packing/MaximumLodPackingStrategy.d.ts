import type { GaussianLodPacking } from "../GaussianLod";
import { type GaussianLodPackingContext, type GaussianLodPackingStrategy } from "./GaussianLodPackingStrategy";
/** Packs every leaf at the finest available LOD or fails if it does not fit. */
export declare class MaximumLodPackingStrategy implements GaussianLodPackingStrategy {
    setFromCamera(_camera: Camera, _localSpace: Object3D): this;
    pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking;
}
import type { Camera, Object3D } from "three/webgpu";
