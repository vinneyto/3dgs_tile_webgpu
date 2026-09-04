import { Object3D, type Intersection, type Raycaster } from "three/webgpu";
import type { GaussianStore } from "./GaussianStore";
import type { GaussianLod, GaussianLodPacking } from "./GaussianLod";
export type GaussianRaycastMode = "rendered" | "full";
/** A transformable Three.js scene object backed by a range in a GaussianStore. */
export declare class GaussianCloud extends Object3D {
    readonly isGaussianCloud = true;
    readonly objectId: number;
    readonly lod: GaussianLod | null;
    raycastMode: GaussianRaycastMode;
    private readonly ownerStore;
    private packing;
    private packedGaussianCount;
    private priority;
    constructor(store: GaussianStore, objectId: number, gaussianCount: number, name?: string, lod?: GaussianLod | null, packing?: GaussianLodPacking | null, priority?: number);
    get lodPacking(): GaussianLodPacking | null;
    get gaussianCount(): number;
    /** Lower priorities receive Store budget first. Defaults to 0. */
    get packingPriority(): number;
    set packingPriority(priority: number);
    /** Re-evaluate this cloud on the next Store pack after strategy parameters change. */
    invalidatePacking(): void;
    /** Internal Store hook used after a global budget redistribution. */
    updatePacking(gaussianCount: number, packing: GaussianLodPacking | null): void;
    /** Internal Store hook used while priorities are changed transactionally. */
    updatePackingPriority(priority: number): void;
    /** Raycast either the packed/rendered LOD or the complete source octree. */
    raycast(raycaster: Raycaster, intersections: Intersection[]): void;
    /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
    dispose(): void;
}
