import { InstancedBufferGeometry, Mesh, Scene, type ColorSpace, type PerspectiveCamera, type WebGPURenderer, type ComputeNode } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import type { GaussianStore } from "../GaussianStore";
import * as context from "../nodes/GaussianContextNodes";
import { FrameUniforms } from "./FrameUniforms";
import { ObjectFrameState } from "./ObjectFrameState";
import { ProjectionStage } from "./ProjectionStage";
import { ExclusiveScanStage } from "./ExclusiveScanStage";
import { VisibleGaussianStage } from "./VisibleGaussianStage";
import { RadixSorter } from "./RadixSorter";
import type { AntialiasMode, DepthSortMode, ResolvedRadixBackend } from "./types";
export type HardwareGaussianNodeSlots = context.GaussianProjectionNodeSlots & Pick<context.GaussianRasterNodeSlots, "rasterColorNode" | "rasterAlphaNode" | "rasterDiscardNode">;
/** GPU preparation shared with the tiled backend, followed by one indirect draw. */
export declare class HardwareGaussianPipeline {
    private readonly renderer;
    private readonly data;
    private readonly colorSpace;
    private readonly profileKernels;
    readonly frame: FrameUniforms;
    readonly objects: ObjectFrameState;
    readonly projection: ProjectionStage;
    readonly visibleScan: ExclusiveScanStage;
    readonly visible: VisibleGaussianStage;
    readonly depthSorter: RadixSorter;
    readonly scene: Scene<import("three").Object3DEventMap>;
    readonly geometry: InstancedBufferGeometry;
    readonly mesh: Mesh;
    private readonly attributes;
    readonly drawArguments: import("three/webgpu").IndirectStorageBufferAttribute;
    readonly prepareDraw: ComputeNode;
    constructor(renderer: WebGPURenderer, camera: PerspectiveCamera, data: GaussianData, store: GaussianStore, mode: DepthSortMode, antialiasMode: AntialiasMode, radixBackend: ResolvedRadixBackend, colorSpace: ColorSpace, nodes: HardwareGaussianNodeSlots, subpixelSampleCulling: boolean, profileKernels: boolean);
    prepare(width: number, height: number): void;
    rebuildProjection(nodes: HardwareGaussianNodeSlots): void;
    rebuildRasterizer(nodes: HardwareGaussianNodeSlots): void;
    private createMaterial;
    readVisibleCount(): Promise<number>;
    dispose(): void;
}
