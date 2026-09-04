import type { Camera, Object3D } from "three/webgpu";
import type { GaussianLod, GaussianLodPacking } from "../GaussianLod";
export interface GaussianLodPackingContext {
    readonly lod: GaussianLod;
    readonly maxGaussians: number;
}
/** Selects a non-overlapping octree cell/LOD cut for a GaussianStore budget. */
export interface GaussianLodPackingStrategy {
    /** Update view-dependent parameters in the packed cloud's local space. */
    setFromCamera(camera: Camera, localSpace: Object3D): this;
    pack(context: GaussianLodPackingContext): GaussianLodPacking;
}
export declare function validateGaussianLodBudget(maxGaussians: number): void;
