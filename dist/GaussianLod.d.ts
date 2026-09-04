import { type Ray } from "three/webgpu";
import { GaussianOctree, type GaussianOctreeRaycastHit, type GaussianOctreeRaycastOptions } from "./GaussianOctree";
export interface GaussianLodLevelOptions {
    /** Fraction of a node's most important Gaussians retained by this level. */
    retention: number;
}
export interface GaussianLodBuildOptions {
    /** Levels ordered from coarsest to finest. The final retention must be 1. */
    levels?: readonly GaussianLodLevelOptions[];
    /** Dispose the supplied octree with this object. Defaults to false. */
    ownsOctree?: boolean;
    /** Optional static importance function used to order Gaussians in every cell. */
    importance?: (gaussianIndex: number, octree: GaussianOctree) => number;
}
export interface GaussianLodPacking {
    readonly nodeIds: Uint32Array;
    readonly lodLevels: Uint8Array;
    readonly gaussianCount: number;
}
/**
 * LOD representations for one leaf cell, stored as nested prefixes. Internal
 * octree nodes keep an empty representation so source indices are not copied
 * into every ancestor.
 */
export declare class GaussianLodNode {
    readonly octreeNodeId: number;
    readonly sortedGaussianIndices: Uint32Array;
    readonly levelCounts: Uint32Array;
    constructor(octreeNodeId: number, sortedGaussianIndices: Uint32Array, levelCounts: Uint32Array);
}
/** Leaf-cell LOD representations built over a GaussianOctree. */
export declare class GaussianLod {
    readonly octree: GaussianOctree;
    static build(octree: GaussianOctree, options?: GaussianLodBuildOptions): GaussianLod;
    readonly levels: readonly GaussianLodLevelOptions[];
    readonly nodes: readonly GaussianLodNode[];
    private readonly ownsOctree;
    private disposed;
    private constructor();
    get levelCount(): number;
    get finestLevel(): number;
    getNode(nodeId: number): GaussianLodNode;
    /** Expand a compact cell/level packing into source Gaussian indices. */
    indicesForPacking(packing: GaussianLodPacking): Uint32Array;
    raycast(ray: Ray, packing: GaussianLodPacking, options?: GaussianOctreeRaycastOptions): GaussianOctreeRaycastHit[];
    dispose(): void;
    private assertUsable;
    private getLeafNode;
}
