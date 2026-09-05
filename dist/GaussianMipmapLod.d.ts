import { Box3 } from "three/webgpu";
import { GaussianData } from "./GaussianData";
import { GaussianLod, GaussianLodNode, type GaussianLodPacking } from "./GaussianLod";
import type { GaussianOctree } from "./GaussianOctree";
import { type MipmapTree } from "./mipmap/buildMipmap";
export interface GaussianMipmapLodOptions {
    /** Terminal groups retain their original Gaussians. Defaults to 8. */
    leafSize?: number;
    ownsOctree?: boolean;
}
/** Spatial mipmap hierarchy, with original Gaussians at the finest cut. */
export declare class GaussianMipmapLod extends GaussianLod {
    readonly tree: MipmapTree;
    readonly nodes: readonly GaussianLodNode[];
    get data(): GaussianData;
    private readonly mergedData;
    static build(octree: GaussianOctree, options?: GaussianMipmapLodOptions): GaussianMipmapLod;
    /** Builds in a worker in browsers; does not detach the caller's source buffers. */
    static buildAsync(octree: GaussianOctree, options?: GaussianMipmapLodOptions): Promise<GaussianMipmapLod>;
    private constructor();
    getPackingNode(id: number): GaussianLodNode;
    getNodeBounds(id: number): Box3;
    protected raycastBounds(id: number, radiusScale: number): Box3;
    validateCut(packing: GaussianLodPacking): void;
    dispose(): void;
}
