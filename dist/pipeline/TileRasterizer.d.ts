import type { StorageBufferAttribute, StorageTexture, WebGPURenderer } from "three/webgpu";
import { type GaussianRasterNodeSlots } from "../nodes/GaussianContextNodes";
import type { FrameUniforms } from "./FrameUniforms";
import type { DepthSortMode } from "./types";
/**
 * Rasterizes normal tiles directly and splits only overflowing tiles into
 * independent depth-ordered chunks. Chunk colors and transmittances are
 * composited in order, so no Gaussian is dropped or cut at a tile boundary.
 */
export declare class TileRasterizer {
    private readonly renderer;
    private readonly gaussianCount;
    private readonly intersectionCapacity;
    private readonly mode;
    private readonly meansAttribute;
    private readonly projectedMeanAttribute;
    private readonly projectedConicAttribute;
    private readonly projectedColorAttribute;
    private readonly sortedRecordsAttribute;
    private readonly tileOffsetsAttribute;
    private readonly colorTexture;
    private readonly depthTexture;
    private readonly frame;
    private readonly maxSplatsPerTile;
    private readonly rasterChunkSize;
    private readonly tileCount;
    private readonly transmittanceThreshold;
    private readonly attributes;
    private readonly chunks;
    private computeNode;
    private chunkComputeNode;
    private compositeNode;
    private readonly metrics;
    private readonly clearMetrics;
    constructor(renderer: WebGPURenderer, gaussianCount: number, intersectionCapacity: number, mode: DepthSortMode, meansAttribute: StorageBufferAttribute, projectedMeanAttribute: StorageBufferAttribute, projectedConicAttribute: StorageBufferAttribute, projectedColorAttribute: StorageBufferAttribute, sortedRecordsAttribute: StorageBufferAttribute, tileOffsetsAttribute: StorageBufferAttribute, colorTexture: StorageTexture, depthTexture: StorageTexture | null, frame: FrameUniforms, maxSplatsPerTile: number | null, rasterChunkSize: number | null, tileCount: number, nodes: GaussianRasterNodeSlots, profileKernels?: boolean, transmittanceThreshold?: number);
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
