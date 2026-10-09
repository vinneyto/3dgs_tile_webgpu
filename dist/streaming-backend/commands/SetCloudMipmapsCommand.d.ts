import type { Command } from "./Command";
import type { MipmapConfig } from "../MipmapConfig";
export interface SetCloudMipmapsCommand extends Command<"set-cloud-mipmaps"> {
    cloudId: string;
    mipmaps: MipmapConfig;
}
