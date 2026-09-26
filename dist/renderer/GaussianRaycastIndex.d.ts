import { Box3, Ray } from "three/webgpu";
import { type GaussianOctreeRaycastHit } from "../streaming-backend-impl/GaussianOctree";
import type { FullRaycastOctreeBuffers } from "../streaming-backend/FullRaycastOctreeBuffers";
/** Transferable snapshot built with the worker's octree; raycasts remain synchronous. */
export declare class GaussianRaycastIndex {
    private readonly means;
    private readonly scalesOpacity;
    private readonly rotations;
    private readonly bounds;
    private readonly nodeChildren;
    private readonly children;
    private readonly nodeIndices;
    private readonly indices;
    constructor(buffers: FullRaycastOctreeBuffers);
    /** Cell bounds and depth for the sandbox's octree visualization. */
    debugCells(): readonly {
        bounds: Box3;
        depth: number;
        isLeaf: boolean;
    }[];
    raycast(ray: Ray, alphaThreshold?: number): GaussianOctreeRaycastHit | null;
}
