import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendResponse, BackendFailure } from "../streaming-backend/BackendResponse";
export type WorkerInbound = {
    type: "initialize";
    config: BackendConfig;
} | {
    type: "dispatch";
    command: BackendCommand;
} | {
    type: "abort";
    commandId: string;
} | {
    type: "dispose";
};
export type WorkerOutbound = {
    type: "response";
    response: BackendResponse;
} | {
    type: "failure";
    failure: BackendFailure;
};
/** Transfer only protocol-owned buffers, never an engine's internal storage. */
export declare function transferBuffers(value: unknown): ArrayBuffer[];
