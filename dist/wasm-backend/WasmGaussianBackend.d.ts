import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendResponse, BackendFailure } from "../streaming-backend/BackendResponse";
/** Transport-neutral TS shell. Parsing, mipmaps, selection, budgets and packing
 * run in Rust. In production instantiate this inside the worker endpoint. */
export declare class WasmGaussianBackend implements GaussianBackend {
    private readonly listeners;
    private readonly failures;
    private readonly ready;
    private engine;
    private active;
    private activeId;
    private disposed;
    constructor(config?: BackendConfig);
    subscribe(listener: (response: BackendResponse) => void): () => void;
    onFailure(listener: (failure: BackendFailure) => void): () => void;
    dispatch(command: BackendCommand): void;
    abort(commandId: string): void;
    dispose(): void;
    private execute;
    private readonly attributeFormats;
}
