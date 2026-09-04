import { type Camera, type Object3D } from "three/webgpu";
import type { GaussianLodPacking } from "../GaussianLod";
import { type GaussianLodPackingContext, type GaussianLodPackingStrategy } from "./GaussianLodPackingStrategy";
import { type GaussianLodPackingCenter } from "./radialCells";
export interface DistanceAwareRadialLodPackingOptions {
    /** Local-space camera/focus point. Defaults to the tight bounds center. */
    center?: GaussianLodPackingCenter;
    /**
     * Distance, measured in octree-root half-diagonals, between adjacent LOD
     * levels. Defaults to 2.
     */
    levelDistance?: number;
}
/**
 * Selects LOD from distance to a local-space focus while enforcing a strict
 * Gaussian budget. Farther cells are degraded first when the desired packing
 * does not fit; if the coarsest representation still exceeds the budget, its
 * farthest cells are clipped.
 */
export declare class DistanceAwareRadialLodPackingStrategy implements GaussianLodPackingStrategy {
    private readonly cameraCenter;
    center: GaussianLodPackingCenter;
    readonly levelDistance: number;
    constructor(options?: DistanceAwareRadialLodPackingOptions);
    setCenter(center: GaussianLodPackingCenter): this;
    setFromCamera(camera: Camera, localSpace: Object3D): this;
    pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking;
}
