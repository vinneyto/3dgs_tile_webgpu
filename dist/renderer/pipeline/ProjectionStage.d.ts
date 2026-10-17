import { StorageBindings } from "./StorageBindings";
import type { ComputeNode, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import { type GaussianProjectionNodeSlots } from "../nodes/GaussianContextNodes";
import type { FrameUniforms } from "./FrameUniforms";
import { type CloudAccumulationStage } from "./CloudAccumulationStage";
import type { AntialiasMode } from "./types";
export declare class ProjectionStage {
    private data;
    private readonly frame;
    private readonly accumulated;
    private readonly antialiasMode;
    private readonly subpixelSampleCulling;
    projectedMean: StorageBufferAttribute;
    projectedConic: StorageBufferAttribute;
    projectedColor: StorageBufferAttribute;
    tileCounts: StorageBufferAttribute;
    private readonly attributes;
    private computeNode;
    constructor(data: GaussianData, frame: FrameUniforms, accumulated: CloudAccumulationStage, antialiasMode: AntialiasMode, nodes: GaussianProjectionNodeSlots, subpixelSampleCulling?: boolean, bindings?: StorageBindings);
    compatible(_data: GaussianData): boolean;
    updateData(data: GaussianData, _nodes?: GaussianProjectionNodeSlots): void;
    getComputeNodes(): ComputeNode[];
    rebuild(nodes: GaussianProjectionNodeSlots): void;
    encode(renderer: WebGPURenderer): void;
    dispose(): void;
    private createComputeNode;
}
