import { Vector3, type Camera, type Object3D } from "three/webgpu";
import type { GaussianLod } from "../GaussianLod";
export type GaussianLodPackingCenter = "bounds-center" | Vector3;
export interface RadialLodCell {
    readonly nodeId: number;
    readonly radius: number;
}
export declare function cameraPositionInLocalSpace(camera: Camera, localSpace: Object3D, target: Vector3): Vector3;
export declare function radialLodCells(lod: GaussianLod, configuredCenter: GaussianLodPackingCenter): RadialLodCell[];
