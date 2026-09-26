import type { FullRaycastOctreeBuffers } from "../streaming-backend/FullRaycastOctreeBuffers";
import type { GaussianOctree } from "./GaussianOctree";
/** Clone only the arrays needed by a synchronous client-side raycast. */
export declare function createRaycastSnapshot(octree: GaussianOctree): FullRaycastOctreeBuffers;
