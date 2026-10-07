import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendResponse, BackendFailure } from "../streaming-backend/BackendResponse";
export interface WorkerInitialize {
    type: "initialize";
    config: BackendConfig;
}
export interface WorkerDispatch {
    type: "dispatch";
    command: BackendCommand;
}
export interface WorkerAbort {
    type: "abort";
    commandId: string;
}
export interface WorkerDispose {
    type: "dispose";
}
export interface WorkerUploadAcknowledgement {
    type: "upload-ack";
    contentVersion: number;
}
export type WorkerInbound = WorkerInitialize | WorkerDispatch | WorkerAbort | WorkerDispose | WorkerUploadAcknowledgement;
export interface WorkerResponse {
    type: "response";
    response: BackendResponse;
}
export interface WorkerFailure {
    type: "failure";
    failure: BackendFailure;
}
export type WorkerOutbound = WorkerResponse | WorkerFailure;
/** Transfer only protocol-owned buffers, never an engine's internal storage. */
export declare function transferBuffers(value: unknown): ArrayBuffer[];
