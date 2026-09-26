import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendEvent } from "../streaming-backend/events/BackendEvent";
type WorkerPort = Pick<Worker, "postMessage" | "addEventListener" | "removeEventListener" | "terminate">;
/** Client-side endpoint: messages only, no computation or GPU objects. */
export declare class WorkerStreamingGaussianBackend implements GaussianBackend {
    private readonly listeners;
    private readonly port;
    private disposed;
    constructor(config: BackendConfig, port?: WorkerPort);
    subscribe(listener: (event: BackendEvent) => void): () => void;
    dispatch(command: BackendCommand): void;
    dispose(): void;
    private readonly onMessage;
    private readonly onError;
}
export {};
