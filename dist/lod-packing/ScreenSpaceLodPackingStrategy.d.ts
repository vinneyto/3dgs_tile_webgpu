import { type Camera, type Object3D } from "three/webgpu";
import type { GaussianLodPacking } from "../GaussianLod";
import { type GaussianLodPackingContext, type GaussianLodPackingStrategy } from "./GaussianLodPackingStrategy";
export interface ScreenSpaceLodPackingOptions {
    /** Maximum projected group diameter before refinement. Defaults to 4 physical pixels. */
    pixelSize?: number;
}
/** Async CPU hierarchy selection. GPU projection/sorting/rasterization stay unchanged. */
export declare class ScreenSpaceLodPackingStrategy implements GaussianLodPackingStrategy {
    readonly pixelSize: number;
    planningMs: number;
    private roundTripMs;
    private requestStarted;
    get pending(): boolean;
    get targetStats(): {
        planningMs: number;
        roundTripMs: number;
        discardedResults: number;
        pending: boolean;
    };
    private view;
    private requestedView;
    private worker;
    private lod;
    private busy;
    private ready;
    private selection;
    private budget;
    private requestBudget;
    private width;
    private height;
    private disposed;
    private workerError;
    constructor(options?: ScreenSpaceLodPackingOptions);
    setViewport(width: number, height: number): this;
    setFromCamera(camera: Camera, localSpace: Object3D): this;
    /** Poll once per frame. A completed cut is committed atomically by Store.pack(). */
    update(): boolean;
    pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking;
    dispose(): void;
}
