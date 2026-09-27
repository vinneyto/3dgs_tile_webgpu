import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendResponse, BackendFailure } from "../streaming-backend/BackendResponse";
/**
 * Session-local, transport-independent computation engine. The source and
 * current layout remain owned here; every emitted buffer is a separate,
 * disposable copy which a worker is free to transfer to its client.
 */
export declare class StreamingGaussianBackend implements GaussianBackend {
    private readonly listeners;
    private readonly failureListeners;
    private readonly clouds;
    private readonly usedCloudIds;
    private readonly usedCommandIds;
    private readonly activeLoads;
    private readonly parser;
    private readonly config;
    private frontend;
    private nextObjectId;
    private layoutVersion;
    private contentVersion;
    private sceneRevision;
    private cameraPosition;
    private packed;
    private target;
    private updateScheduled;
    private active;
    private startedAt;
    private drain;
    private disposed;
    constructor(config: BackendConfig);
    subscribe(listener: (response: BackendResponse) => void): () => void;
    onFailure(listener: (failure: BackendFailure) => void): () => void;
    dispatch(command: BackendCommand): void;
    abort(commandId: string): void;
    private run;
    dispose(): void;
    private respond;
    private emit;
    private handle;
    private getCloud;
    private writeRange;
    private maxSlots;
    private compute;
    private select;
    private repack;
    private updateTarget;
    private replace;
    private scheduleUpdate;
    private emitNextPatch;
}
