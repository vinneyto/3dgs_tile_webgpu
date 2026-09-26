import type { Command } from "./Command";
export interface SetCloudTransformCommand extends Command<"set-cloud-transform"> {
    cloudId: string;
    sceneRevision: number;
    /** Column-major 4x4 world transform, with exactly sixteen elements. */
    worldMatrix: readonly number[];
}
