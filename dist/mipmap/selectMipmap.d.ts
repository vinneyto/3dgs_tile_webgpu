export interface MipmapSelectionTree {
    left: Int32Array;
    right: Int32Array;
    counts: Uint32Array;
    spheres: Float32Array;
}
export interface MipmapView {
    matrix: number[];
    projection: number[];
    width: number;
    height: number;
    pixelSize: number;
    perspective: boolean;
}
export interface MipmapSelection {
    nodeIds: Uint32Array;
    gaussianCount: number;
}
/** Largest projected groups refine first, subject to a hard Gaussian budget. */
export declare function selectMipmap(tree: MipmapSelectionTree, view: MipmapView, budget: number): MipmapSelection;
