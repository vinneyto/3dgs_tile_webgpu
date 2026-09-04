import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DispatchResources, KeyValueBuffers, ResolvedRadixBackend } from "./types";
/** Stable GPU radix sort for uvec2(key, value) records. */
export declare class RadixSorter {
    private readonly renderer;
    private readonly label;
    private readonly capacity;
    private readonly buffers;
    private readonly dispatch;
    private readonly backend;
    sortedRecords: StorageBufferAttribute;
    private readonly attributes;
    private readonly blockHistograms;
    private readonly blockPrefixes;
    private readonly reduced;
    private readonly reduceNode;
    private readonly scanReducedNode;
    private readonly scanAddNode;
    private readonly maxRadixBlocks;
    private readonly maxReduceChunks;
    private passes;
    constructor(renderer: WebGPURenderer, label: string, capacity: number, buffers: KeyValueBuffers, dispatch: DispatchResources, backend: ResolvedRadixBackend);
    configure(bitCount: number): void;
    get passCount(): number;
    encode(_profileKernels?: boolean): void;
    dispose(): void;
    private createPass;
    private disposePasses;
}
