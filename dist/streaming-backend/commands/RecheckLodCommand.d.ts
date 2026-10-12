import type { Command } from "./Command";
/** Re-evaluate the settled target only for the camera that requested it. */
export interface RecheckLodCommand extends Command<"recheck-lod"> {
    cameraRevision: number;
}
