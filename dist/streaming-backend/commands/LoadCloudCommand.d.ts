import type { CloudLoadOptions } from "../CloudLoadOptions";
import type { Command } from "./Command";
export interface LoadCloudCommand extends Command<"load-cloud"> {
    cloudId: string;
    url: string;
    options?: CloudLoadOptions;
}
