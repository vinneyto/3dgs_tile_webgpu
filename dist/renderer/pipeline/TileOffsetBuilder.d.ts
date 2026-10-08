import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { DepthSortMode, DispatchResources } from "./types";
export declare class TileOffsetBuilder {
    private readonly renderer;
    private readonly dispatch;
    private readonly getTileCount?;
    readonly offsets: StorageBufferAttribute;
    private readonly attributes;
    private readonly clearNode;
    private readonly boundariesNode;
    private readonly suffixMin;
    private readonly runtimeTileCount;
    constructor(renderer: WebGPURenderer, mode: DepthSortMode, tileCapacity: number, sortedRecordsAttribute: StorageBufferAttribute, dispatch: DispatchResources, getTileCount?: (() => number) | undefined);
    encode(): void;
    dispose(): void;
}
