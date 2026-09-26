import type { Command } from "./Command";

export interface UnloadCloudCommand extends Command<"unload-cloud"> {
  cloudId: string;
}
