import { Object3D, type ColorRepresentation } from "three/webgpu";
import type { GaussianLod, GaussianLodPacking } from "./GaussianLod";
export interface LodHelperOptions {
    /** Initially visible LOD levels. Defaults to every level. */
    levels?: readonly number[];
    /** Color by LOD level. Missing colors cycle through the default palette. */
    colors?: readonly ColorRepresentation[];
    opacity?: number;
    wireframe?: boolean;
    /** Defaults to false so volumes remain visible through the cloud. */
    depthTest?: boolean;
}
/** Color-coded local-space volumes for the active cells in a LOD packing. */
export declare class LodHelper extends Object3D {
    readonly lod: GaussianLod;
    readonly isLodHelper = true;
    private readonly colors;
    private readonly opacity;
    private readonly wireframe;
    private readonly depthTest;
    private readonly levelMeshes;
    private visibleLevelSet;
    private packing;
    constructor(lod: GaussianLod, packing: GaussianLodPacking, options?: LodHelperOptions);
    get lodPacking(): GaussianLodPacking;
    get visibleLevels(): readonly number[];
    get instanceCounts(): readonly number[];
    setLevels(levels: readonly number[]): this;
    /** Replace the active cell/level cut, for example after a future dynamic repack. */
    setPacking(packing: GaussianLodPacking): this;
    dispose(): void;
    private rebuildMeshes;
    private disposeMeshes;
}
