import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendEvent } from "../streaming-backend/events/BackendEvent";
/**
 * Session-local, transport-independent computation engine. The source and
 * current layout remain owned here; every emitted buffer is a separate,
 * disposable copy which a worker is free to transfer to its client.
 */
export declare class StreamingGaussianBackend implements GaussianBackend {
    private readonly listeners;
    private readonly clouds;
    private readonly usedCloudIds;
    private readonly usedCommandIds;
    private readonly cancelled;
    private readonly pendingCommands;
    private readonly activeLoads;
    private readonly parser;
    private readonly config;
    private work;
    private nextObjectId;
    private layoutVersion;
    private contentVersion;
    private sceneRevision;
    private cameraPosition;
    private frontend;
    private requestId;
    private packed;
    private target;
    private disposed;
    constructor(config: BackendConfig);
    subscribe(listener: (event: BackendEvent) => void): () => void;
    dispatch(command: BackendCommand): void;
    dispose(): void;
    private emit;
    private handle;
    private getCloud;
    private writeRange;
    private maxSlots;
    private compute;
    private select;
    private updateTarget;
    private replace;
    private emitNextPatch;
}
