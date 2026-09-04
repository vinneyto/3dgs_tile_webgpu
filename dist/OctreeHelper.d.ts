import { BufferGeometry, LineBasicMaterial, LineSegments, type ColorRepresentation } from "three/webgpu";
import type { GaussianOctree } from "./GaussianOctree";
export interface OctreeHelperOptions {
    color?: ColorRepresentation;
    opacity?: number;
    /** Draw only terminal cells. Defaults to false. */
    leavesOnly?: boolean;
    minDepth?: number;
    maxDepth?: number;
    /** Defaults to false so the complete local grid remains visible. */
    depthTest?: boolean;
}
/** Local-space wireframe visualization of a GaussianOctree. */
export declare class OctreeHelper extends LineSegments<BufferGeometry, LineBasicMaterial> {
    readonly octree: GaussianOctree;
    readonly isOctreeHelper = true;
    readonly cellCount: number;
    constructor(octree: GaussianOctree, options?: OctreeHelperOptions);
    dispose(): void;
}
