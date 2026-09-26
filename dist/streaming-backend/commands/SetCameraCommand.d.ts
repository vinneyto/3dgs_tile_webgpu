import type { Command } from "./Command";
export interface SetCameraCommand extends Command<"set-camera"> {
    sceneRevision: number;
    /** Column-major 4x4 camera-to-world transform, with exactly sixteen elements. */
    worldMatrix: readonly number[];
    /** Column-major 4x4 projection transform, with exactly sixteen elements. */
    projectionMatrix: readonly number[];
}
