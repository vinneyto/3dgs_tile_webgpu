import { type ComputeNode, type WebGPURenderer } from "three/webgpu";
import { GaussianData } from "../GaussianData";
import type { GaussianDataPassContext, GaussianDataPassRuntime } from "../passes/GaussianDataPass";
import type { GaussianTransformNodeSlots } from "../passes/GaussianTransformPass";
/** Six storage buffers per dispatch; SH and the active index tail stay in the source representation. */
export declare class GaussianTransformStage implements GaussianDataPassRuntime {
    private readonly context;
    private readonly nodes;
    private source;
    private output;
    private compute;
    private compiledNodes;
    private activeVersion;
    constructor(context: GaussianDataPassContext, nodes: GaussianTransformNodeSlots);
    getData(): GaussianData;
    updateData(source: GaussianData): void;
    encode(renderer: WebGPURenderer): void;
    getComputeNodes(): ComputeNode[];
    dispose(): void;
    private allocate;
    private build;
}
