import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { FrameUniforms } from "./FrameUniforms";
import type { GaussianPassProfileStats } from "./types";
export declare class ProfileDiagnosticsStage {
    private readonly renderer;
    private readonly maxRasterizedSplatsPerTile;
    private readonly rasterSubtiles;
    private readonly attributes;
    private readonly zeroPixelFlags;
    private readonly computeNode;
    constructor(renderer: WebGPURenderer, gaussianCount: number, projectedMeanAttribute: StorageBufferAttribute, projectedConicAttribute: StorageBufferAttribute, frame: FrameUniforms, maxRasterizedSplatsPerTile: number | null, rasterSubtiles?: boolean);
    encode(): void;
    readStats(tileOffsets: StorageBufferAttribute): Promise<GaussianPassProfileStats>;
    dispose(): void;
}
