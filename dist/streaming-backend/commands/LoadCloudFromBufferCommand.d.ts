import type { CloudLoadOptions } from "../CloudLoadOptions";
import type { Command } from "./Command";
export interface LoadCloudFromBufferCommand extends Command<"load-cloud-from-buffer"> {
    cloudId: string;
    buffer: ArrayBuffer;
    options?: CloudLoadOptions;
}
