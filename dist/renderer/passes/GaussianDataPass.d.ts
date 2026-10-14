import type { ComputeNode, WebGPURenderer } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import type { GaussianRenderStore } from "../GaussianRenderStore";
import type { StorageBindings } from "../pipeline/StorageBindings";
import { GaussianPassOutput } from "./GaussianPassOutput";
/** A buffer-producing pass. It need not draw or use the camera. */
export interface GaussianDataPassRuntime {
    /** Current buffers; source slot IDs/object IDs and active draw cut must be preserved. */
    getData(): GaussianData;
    /** Called before consumers rebind a new store layout. */
    updateData(source: GaussianData): void;
    encode(renderer: WebGPURenderer): void;
    getComputeNodes(): ComputeNode[];
    dispose(): void;
}
export interface GaussianDataPassContext {
    readonly source: GaussianData;
    readonly renderer: WebGPURenderer;
    readonly bindings: StorageBindings;
}
export type GaussianDataPassFactory = (context: GaussianDataPassContext) => GaussianDataPassRuntime;
/** Default is zero-copy. Supply a runtime factory to materialize deformed buffers on the GPU. */
export declare class GaussianDataPass {
    private readonly factory?;
    readonly output: GaussianPassOutput<GaussianData>;
    readonly inputs: Readonly<{
        store: GaussianRenderStore;
    } | {
        gaussians: GaussianPassOutput<GaussianData>;
    }>;
    /** The store remains the owner of source loading/LOD; prepared buffers are downstream. */
    get sourceStore(): GaussianRenderStore;
    get upstream(): GaussianDataPass | null;
    private readonly nodeListeners;
    private readonly listeners;
    constructor(input: GaussianRenderStore | GaussianPassOutput<GaussianData>, factory?: GaussianDataPassFactory | undefined);
    /** Uniform/animation changes require a new frame, not a new shader graph. */
    invalidate(): void;
    subscribe(listener: () => void): () => void;
    protected invalidateNodes(): void;
    subscribeNodes(listener: () => void): () => void;
    createRuntime(context: GaussianDataPassContext): GaussianDataPassRuntime;
}
