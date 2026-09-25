import { Camera } from "three/webgpu";
import { GaussianCloud } from "../GaussianCloud";
import { GaussianData } from "../GaussianData";
import { GaussianStore, type GaussianStoreAddLodOptions, type GaussianStoreLoadOptions, type GaussianStoreLodUpdate, type GaussianStoreOptions, type GaussianStorePackOptions, type GaussianStorePackStats } from "../GaussianStore";
import type { GaussianLod } from "../GaussianLod";
import { type GaussianStorePackedAttribute } from "../store-attributes/GaussianStorePackedAttribute";
import type { WorkerStoreTransport } from "./WorkerGaussianStoreProtocol";
export interface WorkerGaussianStoreOptions extends GaussianStoreOptions {
    /** Custom transport can translate the structured-clone protocol to a remote backend. */
    readonly transport?: WorkerStoreTransport;
}
/**
 * Renderer-facing GaussianStore with all parsing, tree construction, budgeting,
 * packing, and streaming LOD running in a dedicated worker. Only transferable
 * GPU arrays and a synchronous raycast snapshot live in the UI thread.
 */
export declare class WorkerGaussianStore extends GaussianStore {
    private readonly worker;
    private readonly ownsTransport;
    private readonly pending;
    private readonly remoteClouds;
    private readonly changeListeners;
    private readonly initialized;
    private nextRequestId;
    private nextCloudId;
    private generation;
    private remoteData;
    private remoteInvalid;
    private packInFlight;
    private updateInFlight;
    private updatePending;
    private remoteDisposed;
    private remoteCapacity;
    private remoteStats;
    private remoteVersion;
    private remoteObjectCapacity;
    private lastCameraKey;
    private lastError;
    constructor(options?: WorkerGaussianStoreOptions);
    get clouds(): readonly GaussianCloud[];
    get count(): number;
    get shDegree(): 0 | 1 | 2 | 3;
    get needsPack(): boolean;
    get hasPackedData(): boolean;
    get maxGaussians(): number;
    get objectCapacity(): number;
    get lastPackStats(): GaussianStorePackStats | null;
    get contentVersion(): number;
    /** Allow a demand-driven renderer to redraw when a worker result arrives. */
    subscribe(listener: () => void): () => void;
    getBounds(cloud: GaussianCloud): readonly [number, number, number, number, number, number];
    getSourceCount(cloud: GaussianCloud): number;
    load(url: string, options?: GaussianStoreLoadOptions): Promise<GaussianCloud>;
    loadBuffer(buffer: ArrayBuffer, options?: GaussianStoreLoadOptions): Promise<GaussianCloud>;
    add(): GaussianCloud;
    addLod(_lod: GaussianLod, _options?: GaussianStoreAddLodOptions): GaussianCloud;
    enablePackedLodLevelAttribute(): GaussianStorePackedAttribute;
    pack({ limits }: GaussianStorePackOptions): void;
    updateLod(camera: Camera): GaussianStoreLodUpdate;
    getPackedData(): GaussianData;
    remove(cloud: GaussianCloud): void;
    updatePackingPriority(cloud: GaussianCloud, priority: number): void;
    invalidateCloudPacking(cloud: GaussianCloud): void;
    dispose(): void;
    private attachLoaded;
    private applyCloudStates;
    private findCloud;
    private applyPatch;
    private send;
    private readonly handleMessage;
    private readonly handleError;
    private checkError;
    private notify;
}
