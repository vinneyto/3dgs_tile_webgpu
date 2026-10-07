import { Box3, Ray, Vector3 } from "three/webgpu";
import type { MipmapSnapshot } from "../streaming-backend/MipmapSnapshot";
export interface GaussianMipmapRaycastHit {
    /** Index in this snapshot, not an original source or packed render index. */
    gaussianIndex: number;
    distance: number;
    point: Vector3;
}
/** Client-only synchronous traversal over an optional coarse mipmap snapshot. */
export declare class GaussianRaycastIndex {
    private readonly means;
    private readonly scalesOpacity;
    private readonly rotations;
    private readonly bounds;
    private readonly children;
    private readonly root;
    constructor(snapshot: MipmapSnapshot);
    debugCells(): readonly {
        bounds: Box3;
        depth: number;
        isLeaf: boolean;
    }[];
    raycast(ray: Ray, minOpacity?: number, near?: number, far?: number): GaussianMipmapRaycastHit | null;
    private box;
    /** Ellipsoid/disk intersection adapted from Spark's MIT raycast.rs. Bounds
     * traversal is ours; internal representative Gaussians are never hit-tested. */
    private intersectEllipsoid;
}
