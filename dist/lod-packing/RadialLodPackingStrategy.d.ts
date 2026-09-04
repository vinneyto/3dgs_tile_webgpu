import { type Camera, type Object3D } from "three/webgpu";
import type { GaussianLodPacking } from "../GaussianLod";
import { type GaussianLodPackingContext, type GaussianLodPackingStrategy } from "./GaussianLodPackingStrategy";
import { type GaussianLodPackingCenter } from "./radialCells";
export interface RadialLodPackingOptions {
    /** Local-space focus point. Defaults to the tight object-bounds center. */
    center?: GaussianLodPackingCenter;
    /** One LOD used for every selected cell. Defaults to the finest level. */
    lodLevel?: number | "finest";
}
/**
 * Packs one fixed LOD as a continuous radial cut from the focus outwards.
 * Selection stops when the next whole leaf cell exceeds the capacity.
 */
export declare class RadialLodPackingStrategy implements GaussianLodPackingStrategy {
    private readonly cameraCenter;
    center: GaussianLodPackingCenter;
    readonly lodLevel: number | "finest";
    constructor(options?: RadialLodPackingOptions);
    setCenter(center: GaussianLodPackingCenter): this;
    setFromCamera(camera: Camera, localSpace: Object3D): this;
    pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking;
}
