import { StorageBindings } from "./StorageBindings";
import { Camera, StorageBufferAttribute } from "three/webgpu";
import type { GaussianRenderStore } from "../GaussianRenderStore";
export declare const OBJECT_FRAME_VEC4S = 10;
/** Camera-specific object transforms shared by every Gaussian of one cloud. */
export declare class ObjectFrameState {
    private readonly camera;
    private readonly store;
    private readonly bindings;
    attribute: StorageBufferAttribute;
    private values;
    private frameComponentOffset;
    private frameComponentCount;
    private readonly modelView;
    private readonly inverseModel;
    private readonly cameraWorldPosition;
    private readonly cameraLocalPosition;
    constructor(camera: Camera, store: GaussianRenderStore, gaussianCount: number, bindings?: StorageBindings);
    get slotCapacity(): number;
    resize(gaussianCount: number): void;
    update(): void;
    dispose(): void;
    private writeCloud;
}
