import type { GaussianData } from "../GaussianData";
import type { ComputeNode, StorageTexture } from "three/webgpu";
import { type GaussianRasterNodeSlots } from "../nodes/GaussianContextNodes";
import { TileOffsetBuilder } from "../pipeline/TileOffsetBuilder";
import { TileRasterizer } from "../pipeline/TileRasterizer";
import type { RasterChunkWorkspace } from "../pipeline/RasterChunkWorkspace";
import { GaussianPassOutput } from "./GaussianPassOutput";
import { GaussianPassNodes } from "./GaussianPassNodes";
import type { GaussianProjectionResources } from "./GaussianProjectionPass";
import type { GaussianIntersectionResources } from "./GaussianIntersectionPass";
import type { GaussianPassContext } from "./GaussianPassContext";
export interface GaussianRasterResources {
    tileOffsets: TileOffsetBuilder["offsets"];
    color: StorageTexture;
    depth: StorageTexture | null;
}
export interface GaussianRasterContext extends GaussianPassContext {
    readonly tileCapacity: number;
    readonly colorTexture: StorageTexture;
    readonly depthTexture: StorageTexture | null;
    readonly maxRasterizedSplatsPerTile: number | null;
    readonly rasterChunkSize: number | null;
    readonly rasterStats: boolean;
    readonly rasterTransmittanceThreshold: number;
    readonly depthAlphaThreshold: number;
    readonly chunkWorkspace?: RasterChunkWorkspace;
}
export interface GaussianRasterRuntime {
    tileOffsets: TileOffsetBuilder;
    rasterizer: TileRasterizer;
    encode(tilesX: number, tilesY: number): void;
    getComputeNodes(): ComputeNode[];
    dispose(): void;
}
/** Tile ranges, raster chunks and final composition; owns all raster-domain TSL slots. */
export declare class GaussianRasterPass extends GaussianPassNodes<GaussianRasterNodeSlots> {
    readonly output: GaussianPassOutput<GaussianRasterResources>;
    readonly inputs: Readonly<{
        gaussians: GaussianPassOutput<GaussianData>;
        projection: GaussianPassOutput<GaussianProjectionResources>;
        intersections: GaussianPassOutput<GaussianIntersectionResources>;
    }>;
    constructor(gaussians: GaussianPassOutput<GaussianData>, projection: GaussianPassOutput<GaussianProjectionResources>, intersections: GaussianPassOutput<GaussianIntersectionResources>);
    createRuntime(context: GaussianRasterContext): GaussianRasterRuntime;
}
