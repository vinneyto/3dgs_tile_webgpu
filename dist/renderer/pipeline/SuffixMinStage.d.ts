import type { ComputeNode, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import { StorageBindings } from "./StorageBindings";
export declare class SuffixMinStage {
    private readonly getLength?;
    private readonly attributes;
    private readonly levels;
    private capacity;
    constructor(values: StorageBufferAttribute, length: number, getLength?: (() => number) | undefined, bindings?: StorageBindings);
    resize(values: StorageBufferAttribute, length: number): void;
    encode(renderer: WebGPURenderer): void;
    getComputeNodes(): ComputeNode[];
    dispose(): void;
}
