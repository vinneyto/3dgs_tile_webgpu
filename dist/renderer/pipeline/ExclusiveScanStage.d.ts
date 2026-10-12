import type { ComputeNode, StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
import { StorageBindings } from "./StorageBindings";
export declare class ExclusiveScanStage {
    private readonly getLength?;
    output: StorageBufferAttribute;
    private readonly attributes;
    private readonly levels;
    private capacity;
    constructor(input: StorageBufferAttribute, length: number, label?: string, inputMode?: "uint" | "projectedVisibility", getLength?: (() => number) | undefined, bindings?: StorageBindings);
    resize(length: number): void;
    encode(renderer: WebGPURenderer): void;
    getComputeNodes(): ComputeNode[];
    dispose(): void;
}
