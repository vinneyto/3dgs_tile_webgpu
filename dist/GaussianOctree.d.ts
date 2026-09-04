import { Box3, Ray, Vector3 } from "three/webgpu";
import type { GaussianData } from "./GaussianData";
export interface GaussianOctreeBuildOptions {
    /** Maximum number of source Gaussians in a leaf. Defaults to 256. */
    leafCapacity?: number;
    /** Maximum subdivision depth. Defaults to 10. */
    maxDepth?: number;
    /** Dispose the source GaussianData with the octree. Defaults to false. */
    ownsData?: boolean;
}
export interface GaussianOctreeRaycastOptions {
    /** Number of Gaussian standard deviations used as the hit radius. Defaults to 3. */
    radiusScale?: number;
    /** Stop after this many nearest hits. Defaults to no limit. */
    maxHits?: number;
}
export interface GaussianOctreeRaycastHit {
    readonly gaussianIndex: number;
    readonly distance: number;
    readonly point: Vector3;
}
/**
 * Return the Gaussian that makes front-to-back accumulated alpha cross the
 * requested threshold. Candidate hits must be ordered nearest first.
 */
export declare function alphaCompositeRaycastHit(ray: Ray, data: GaussianData, hits: readonly GaussianOctreeRaycastHit[], alphaThreshold: number): GaussianOctreeRaycastHit | null;
/** One adaptive octree cell. Source indices are stored only for leaves. */
export declare class GaussianOctreeNode {
    readonly id: number;
    readonly depth: number;
    readonly bounds: Box3;
    readonly count: number;
    readonly maxSplatRadius: number;
    /** Cell bounds expanded by the largest splat radius in the subtree. */
    readonly raycastBounds: Box3;
    readonly children: readonly number[];
    readonly gaussianIndices: Uint32Array | null;
    constructor(id: number, depth: number, bounds: Box3, count: number, maxSplatRadius: number, children: readonly number[], gaussianIndices: Uint32Array | null, 
    /** Cell bounds expanded by the largest splat radius in the subtree. */
    raycastBounds: Box3);
    get isLeaf(): boolean;
}
/**
 * Full CPU-side spatial index for one GaussianData object. The tree is adaptive:
 * occupied cells split until leafCapacity or maxDepth is reached.
 */
export declare class GaussianOctree {
    readonly data: GaussianData;
    readonly leafCapacity: number;
    readonly maxDepth: number;
    static build(data: GaussianData, options?: GaussianOctreeBuildOptions): GaussianOctree;
    readonly bounds: Box3;
    readonly rootBounds: Box3;
    readonly rootNode = 0;
    readonly nodes: readonly GaussianOctreeNode[];
    readonly leafNodeIds: Uint32Array;
    private readonly ownsData;
    private disposed;
    private constructor();
    raycast(ray: Ray, options?: GaussianOctreeRaycastOptions): GaussianOctreeRaycastHit[];
    raycastIndices(ray: Ray, indices: ArrayLike<number>, radiusScale?: number, maxHits?: number): GaussianOctreeRaycastHit[];
    dispose(): void;
    private assertUsable;
}
