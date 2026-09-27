import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendResponse, BackendFailure } from "../streaming-backend/BackendResponse";
type WorkerPort = Pick<Worker, "postMessage" | "addEventListener" | "removeEventListener" | "terminate">;
/** Transport only. Request ordering and replacement belong to RequestScheduler. */
export declare class WorkerStreamingGaussianBackend implements GaussianBackend {
    private readonly listeners;
    private readonly failureListeners;
    private readonly port;
    private disposed;
    constructor(config: BackendConfig, port?: WorkerPort);
    subscribe(listener: (response: BackendResponse) => void): () => void;
    onFailure(listener: (failure: BackendFailure) => void): () => void;
    dispatch(command: BackendCommand): void;
    abort(commandId: string): void;
    dispose(): void;
    private readonly onMessage;
    private fail;
    private readonly onError;
    private readonly onMessageError;
}
export {};
