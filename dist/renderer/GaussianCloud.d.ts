import { Object3D, type Intersection, type Raycaster } from "three/webgpu";
import type { GaussianRaycastIndex } from "./GaussianRaycastIndex";
/** Actions the scene object delegates to its owning client store. */
export interface GaussianCloudOwner {
    remove(cloud: GaussianCloud): void;
    updatePackingPriority(cloud: GaussianCloud, priority: number): void;
    invalidateCloudPacking(cloud: GaussianCloud): void;
}
/** A transformable Three.js scene object backed by a range in a GaussianStore. */
export declare class GaussianCloud extends Object3D {
    readonly isGaussianCloud = true;
    readonly objectId: number;
    /** Accumulated alpha required for a pointer hit. Must be in (0, 1). */
    raycastAlphaThreshold: number;
    private readonly ownerStore;
    private packedGaussianCount;
    private priority;
    private raycastIndex;
    constructor(store: GaussianCloudOwner, objectId: number, gaussianCount: number, name?: string, priority?: number);
    get gaussianCount(): number;
    /** Lower priorities receive Store budget first. Defaults to 0. */
    get packingPriority(): number;
    set packingPriority(priority: number);
    /** Ask the backend to re-evaluate this cloud after strategy parameters change. */
    invalidatePacking(): void;
    /** Internal Store hook used after a global budget redistribution. */
    updatePacking(gaussianCount: number): void;
    /** Internal Store hook used while priorities are changed transactionally. */
    updatePackingPriority(priority: number): void;
    /** Attach a transferable snapshot built by the data backend. Raycasts remain synchronous. */
    setRaycastIndex(index: GaussianRaycastIndex | null): void;
    getRaycastIndex(): GaussianRaycastIndex | null;
    /** Synchronous raycast against the complete source octree snapshot. */
    raycast(raycaster: Raycaster, intersections: Intersection[]): void;
    /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
    dispose(): void;
}
