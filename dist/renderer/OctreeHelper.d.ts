import { BufferGeometry, LineBasicMaterial, LineSegments, type Box3, type ColorRepresentation } from "three/webgpu";
import type { GaussianOctree } from "../streaming-backend-impl/GaussianOctree";
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
export interface OctreeDebugCell {
    readonly bounds: Box3;
    readonly depth: number;
    readonly isLeaf: boolean;
}
/** Local-space wireframe visualization of octree cells or a client snapshot. */
export declare class OctreeHelper extends LineSegments<BufferGeometry, LineBasicMaterial> {
    readonly octree: GaussianOctree | readonly OctreeDebugCell[];
    readonly isOctreeHelper = true;
    readonly cellCount: number;
    constructor(octree: GaussianOctree | readonly OctreeDebugCell[], options?: OctreeHelperOptions);
    dispose(): void;
}
