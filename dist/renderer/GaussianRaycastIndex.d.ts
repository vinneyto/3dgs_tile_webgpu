import { Ray } from "three/webgpu";
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
    private renderedIndices;
    constructor(buffers: FullRaycastOctreeBuffers);
    setRenderedIndices(buffer: ArrayBuffer): void;
    raycast(ray: Ray, mode: "full" | "rendered", alphaThreshold?: number): GaussianOctreeRaycastHit | null;
}
