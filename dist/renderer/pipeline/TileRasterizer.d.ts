import { StorageBindings } from "./StorageBindings";
import type { ComputeNode, IndirectStorageBufferAttribute, StorageBufferAttribute, StorageTexture, WebGPURenderer } from "three/webgpu";
import { type GaussianRasterNodeSlots } from "../nodes/GaussianContextNodes";
import { RasterChunkWorkspace } from "./RasterChunkWorkspace";
import type { FrameUniforms } from "./FrameUniforms";
import type { DepthSortMode } from "./types";
/**
 * Rasterizes normal tiles directly and splits only overflowing tiles into
 * independent depth-ordered chunks. Chunk colors and transmittances are
 * composited in order, so no Gaussian is dropped or cut at a tile boundary.
 */
export declare class TileRasterizer {
    private readonly renderer;
    private gaussianCount;
    private intersectionCapacity;
    private readonly mode;
    private meansAttribute;
    private projectedMeanAttribute;
    private projectedConicAttribute;
    private projectedColorAttribute;
    private sortedRecordsAttribute;
    private tileOffsetsAttribute;
    private readonly colorTexture;
    private readonly depthTexture;
    private readonly frame;
    private readonly maxSplatsPerTile;
    private readonly rasterChunkSize;
    private tileCapacity;
    private readonly transmittanceThreshold;
    private readonly depthAlphaThreshold;
    private readonly completeDispatch?;
    private readonly attributes;
    private readonly chunks;
    private readonly chunkWorkspace;
    private readonly ownsChunkWorkspace;
    private computeNode;
    private chunkComputeNode;
    private compositeNode;
    private metrics;
    private readonly clearMetrics;
    constructor(renderer: WebGPURenderer, gaussianCount: number, intersectionCapacity: number, mode: DepthSortMode, meansAttribute: StorageBufferAttribute, projectedMeanAttribute: StorageBufferAttribute, projectedConicAttribute: StorageBufferAttribute, projectedColorAttribute: StorageBufferAttribute, sortedRecordsAttribute: StorageBufferAttribute, tileOffsetsAttribute: StorageBufferAttribute, colorTexture: StorageTexture, depthTexture: StorageTexture | null, frame: FrameUniforms, maxSplatsPerTile: number | null, rasterChunkSize: number | null, tileCapacity: number, nodes: GaussianRasterNodeSlots, rasterStats?: boolean, transmittanceThreshold?: number, depthAlphaThreshold?: number, chunkWorkspace?: RasterChunkWorkspace, completeDispatch?: IndirectStorageBufferAttribute | undefined, bindings?: StorageBindings);
    resize(gaussians: number, intersections: number, tiles: number, means: StorageBufferAttribute, projectedMean: StorageBufferAttribute, projectedConic: StorageBufferAttribute, projectedColor: StorageBufferAttribute, offsets: StorageBufferAttribute): void;
    setSortedRecords(next: StorageBufferAttribute): void;
    getComputeNodes(): ComputeNode[];
    rebuild(nodes: GaussianRasterNodeSlots): void;
    encode(tilesX: number, tilesY: number): void;
    dispose(): void;
    private createChunkSchedule;
    private createRasterNode;
    private createCompositeNode;
    readWorkStats(): Promise<{
        checked: number;
        blended: number;
        pixels: number;
        alphaStopped: number;
    } | null>;
}
