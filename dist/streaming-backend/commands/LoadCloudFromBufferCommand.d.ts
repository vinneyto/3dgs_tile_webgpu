import type { CloudLoadOptions } from "../CloudLoadOptions";
export interface LoadCloudFromBufferCommand {
    type: "load-cloud-from-buffer";
    id: string;
    cloudId: string;
    buffer: ArrayBuffer;
    options?: CloudLoadOptions;
}
