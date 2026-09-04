import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DepthSortMode, DispatchResources } from "./types";
export declare class TileOffsetBuilder {
    private readonly renderer;
    private readonly dispatch;
    readonly offsets: StorageBufferAttribute;
    private readonly attributes;
    private readonly clearNode;
    private readonly boundariesNode;
    private readonly suffixMin;
    constructor(renderer: WebGPURenderer, mode: DepthSortMode, tileCount: number, sortedRecordsAttribute: StorageBufferAttribute, dispatch: DispatchResources);
    encode(): void;
    dispose(): void;
}
