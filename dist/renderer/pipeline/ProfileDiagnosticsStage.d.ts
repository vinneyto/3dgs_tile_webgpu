import { StorageBindings } from "./StorageBindings";
import type { ComputeNode, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { FrameUniforms } from "./FrameUniforms";
import type { GaussianPassProfileStats } from "./types";
export declare class ProfileDiagnosticsStage {
    private readonly renderer;
    private readonly frame;
    private readonly maxRasterizedSplatsPerTile;
    private readonly attributes;
    private zeroPixelFlags;
    private readonly computeNode;
    constructor(renderer: WebGPURenderer, gaussianCount: number, projectedMeanAttribute: StorageBufferAttribute, projectedConicAttribute: StorageBufferAttribute, frame: FrameUniforms, maxRasterizedSplatsPerTile: number | null, bindings?: StorageBindings);
    resize(count: number): void;
    getComputeNodes(): ComputeNode[];
    encode(): void;
    readStats(tileOffsets: StorageBufferAttribute): Promise<GaussianPassProfileStats>;
    dispose(): void;
}
