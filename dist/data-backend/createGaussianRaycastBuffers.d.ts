import type { GaussianOctree } from "../GaussianOctree";
import type { GaussianRaycastBuffers } from "./GaussianBackendProtocol";
/** Clone only the arrays needed by a synchronous client-side raycast. */
export declare function createGaussianRaycastBuffers(octree: GaussianOctree): GaussianRaycastBuffers;
