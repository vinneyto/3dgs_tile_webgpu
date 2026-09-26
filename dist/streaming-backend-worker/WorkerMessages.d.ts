import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendEvent } from "../streaming-backend/events/BackendEvent";
export type WorkerInbound = {
    type: "initialize";
    config: BackendConfig;
} | {
    type: "dispatch";
    command: BackendCommand;
} | {
    type: "dispose";
};
export type WorkerOutbound = {
    type: "ready";
} | {
    type: "event";
    event: BackendEvent;
};
/** Transfer only protocol-owned buffers, never an engine's internal storage. */
export declare function transferBuffers(value: unknown): ArrayBuffer[];
