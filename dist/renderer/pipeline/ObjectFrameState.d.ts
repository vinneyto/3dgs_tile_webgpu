import { PerspectiveCamera, StorageBufferAttribute } from "three/webgpu";
import type { GaussianRenderStore } from "../GaussianRenderStore";
export declare const OBJECT_FRAME_VEC4S = 10;
/** Camera-specific object transforms shared by every Gaussian of one cloud. */
export declare class ObjectFrameState {
    private readonly camera;
    private readonly store;
    readonly attribute: StorageBufferAttribute;
    private readonly values;
    private readonly frameComponentOffset;
    private readonly frameComponentCount;
    private readonly modelView;
    private readonly inverseModel;
    private readonly cameraWorldPosition;
    private readonly cameraLocalPosition;
    constructor(camera: PerspectiveCamera, store: GaussianRenderStore, gaussianCount: number);
    update(): void;
    dispose(): void;
    private writeCloud;
}
