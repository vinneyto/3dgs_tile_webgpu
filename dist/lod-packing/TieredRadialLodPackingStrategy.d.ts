import { type Camera, type Object3D } from "three/webgpu";
import type { GaussianLodPacking } from "../GaussianLod";
import { type GaussianLodPackingContext, type GaussianLodPackingStrategy } from "./GaussianLodPackingStrategy";
import { type GaussianLodPackingCenter } from "./radialCells";
export interface TieredRadialLodPackingOptions {
    /** Local-space focus point. Defaults to the tight object-bounds center. */
    center?: GaussianLodPackingCenter;
    /** Finest, middle and coarsest shares. Defaults to [0.8, 0.1, 0.1]. */
    budgetShares?: readonly [number, number, number];
}
/**
 * Packs concentric finest, middle and coarsest LOD tiers. If the complete
 * finest representation fits, it is returned without degrading outer cells.
 */
export declare class TieredRadialLodPackingStrategy implements GaussianLodPackingStrategy {
    private readonly cameraCenter;
    center: GaussianLodPackingCenter;
    readonly budgetShares: readonly [number, number, number];
    constructor(options?: TieredRadialLodPackingOptions);
    setCenter(center: GaussianLodPackingCenter): this;
    setFromCamera(camera: Camera, localSpace: Object3D): this;
    pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking;
}
