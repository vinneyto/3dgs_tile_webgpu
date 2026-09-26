import type { Command } from "./Command";
export interface SetCloudRaycastableCommand extends Command<"set-cloud-raycastable"> {
    cloudId: string;
    raycastable: boolean;
}
