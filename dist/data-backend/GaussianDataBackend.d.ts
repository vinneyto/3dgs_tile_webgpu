import type { GaussianBackendLoadOptions, GaussianBackendPackedBuffers, GaussianBackendTransport, GaussianRaycastBuffers } from "./GaussianBackendProtocol";
export interface GaussianBackendResource {
    readonly resourceId: string;
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly bounds: readonly [number, number, number, number, number, number];
    readonly raycast: GaussianRaycastBuffers;
}
export interface GaussianBackendSelection {
    readonly resourceId: string;
    readonly revision: number;
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly buffers: GaussianBackendPackedBuffers;
    readonly renderedIndices: ArrayBuffer;
}
/** A small promise client for the transport-neutral, worker-owned Gaussian store. */
export declare class GaussianDataBackend {
    private readonly transport;
    private readonly ownsTransport;
    private readonly pending;
    private readonly revisions;
    private readonly released;
    private nextRequestId;
    private nextResourceId;
    private disposed;
    constructor(transport?: GaussianBackendTransport);
    loadUrl(url: string, options?: GaussianBackendLoadOptions): Promise<GaussianBackendResource>;
    loadBuffer(buffer: ArrayBuffer, options?: GaussianBackendLoadOptions): Promise<GaussianBackendResource>;
    /** Selection packs only the chosen splats and transfers ownership of the four GPU input buffers. */
    select(resourceId: string, center: readonly [number, number, number], maxGaussians: number, levelDistance?: number): Promise<GaussianBackendSelection>;
    release(resourceId: string): Promise<void>;
    dispose(): void;
    private newResourceId;
    private send;
    private readonly handleMessage;
}
