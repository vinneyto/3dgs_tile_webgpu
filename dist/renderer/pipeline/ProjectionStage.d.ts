import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import { type GaussianProjectionNodeSlots } from "../nodes/GaussianContextNodes";
import type { FrameUniforms } from "./FrameUniforms";
import { type ObjectFrameState } from "./ObjectFrameState";
import type { AntialiasMode } from "./types";
export declare class ProjectionStage {
    private readonly data;
    private readonly frame;
    private readonly antialiasMode;
    private readonly subpixelSampleCulling;
    readonly projectedMean: StorageBufferAttribute;
    readonly projectedConic: StorageBufferAttribute;
    readonly projectedColor: StorageBufferAttribute;
    readonly tileCounts: StorageBufferAttribute;
    private readonly attributes;
    private computeNode;
    constructor(data: GaussianData, frame: FrameUniforms, objects: ObjectFrameState, antialiasMode: AntialiasMode, nodes: GaussianProjectionNodeSlots, subpixelSampleCulling?: boolean);
    rebuild(nodes: GaussianProjectionNodeSlots): void;
    encode(renderer: WebGPURenderer): void;
    dispose(): void;
    private createComputeNode;
}
