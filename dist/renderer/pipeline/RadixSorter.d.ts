import { StorageBindings } from "./StorageBindings";
import type { ComputeNode, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DispatchResources, KeyValueBuffers, ResolvedRadixBackend } from "./types";
/** Stable GPU radix sort for uvec2(key, value) records. */
export declare class RadixSorter {
    private readonly renderer;
    private readonly label;
    private capacity;
    private readonly buffers;
    private readonly dispatch;
    private readonly backend;
    sortedRecords: StorageBufferAttribute;
    private readonly attributes;
    private blockHistograms;
    private blockPrefixes;
    private reduced;
    private readonly reduceNode;
    private readonly scanReducedNode;
    private readonly scanAddNode;
    private maxRadixBlocks;
    private maxReduceChunks;
    private passes;
    private activePassCount;
    private readonly blockStride;
    private readonly chunkStride;
    constructor(renderer: WebGPURenderer, label: string, capacity: number, buffers: KeyValueBuffers, dispatch: DispatchResources, backend: ResolvedRadixBackend, bindings?: StorageBindings);
    configure(bitCount: number): void;
    resize(capacity: number): void;
    getComputeNodes(): ComputeNode[];
    get passCount(): number;
    encode(_profileKernels?: boolean): void;
    dispose(): void;
    private createPass;
    private disposePasses;
}
