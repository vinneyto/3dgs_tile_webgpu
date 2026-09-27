import type { BackendCommand } from "./commands/BackendCommand";
import type { FrontendCapabilities } from "./FrontendCapabilities";
import type { GaussianBackend } from "./GaussianBackend";
import type { BackendFailure, BackendResponse } from "./BackendResponse";
export type RequestResult = "done" | "superseded";
export type SchedulerState = "waiting" | "handshaking" | "ready" | "failed";
export interface RequestScheduler {
    readonly state: SchedulerState;
    start(capabilities: FrontendCapabilities): Promise<void>;
    schedule(command: BackendCommand): Promise<RequestResult>;
    cancel(commandId: string): void;
    onResponse(listener: (response: BackendResponse) => void): () => void;
    onFailure(listener: (failure: BackendFailure) => void): () => void;
    dispose(): void;
}
/** Exactly one in-flight request; only pending entries may be superseded. */
export declare class SerialRequestScheduler implements RequestScheduler {
    private readonly backend;
    state: SchedulerState;
    private readonly queue;
    private readonly responses;
    private readonly failures;
    private readonly unsubscribe;
    private readonly unsubscribeFailure;
    private active;
    private handshake;
    private handshakePromise;
    private handshakeAccepted;
    private sequence;
    private disposed;
    constructor(backend: GaussianBackend);
    start(capabilities: FrontendCapabilities): Promise<void>;
    schedule(command: BackendCommand): Promise<RequestResult>;
    cancel(commandId: string): void;
    onResponse(listener: (response: BackendResponse) => void): () => void;
    onFailure(listener: (failure: BackendFailure) => void): () => void;
    dispose(): void;
    private pump;
    private readonly receive;
    private readonly fail;
}
