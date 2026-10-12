import { StorageBindings } from "./StorageBindings";
import type { ComputeNode, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DepthSortMode, DispatchResources } from "./types";
export declare class TileOffsetBuilder {
    private readonly renderer;
    private readonly dispatch;
    private readonly getTileCount?;
    offsets: StorageBufferAttribute;
    private readonly attributes;
    private readonly clearNode;
    private readonly boundariesNode;
    private readonly suffixMin;
    private readonly runtimeTileCount;
    constructor(renderer: WebGPURenderer, mode: DepthSortMode, tileCapacity: number, sortedRecordsAttribute: StorageBufferAttribute, dispatch: DispatchResources, getTileCount?: (() => number) | undefined, bindings?: StorageBindings);
    resize(capacity: number): void;
    setSortedRecords(previous: StorageBufferAttribute, next: StorageBufferAttribute): void;
    getComputeNodes(): ComputeNode[];
    encode(): void;
    dispose(): void;
}
