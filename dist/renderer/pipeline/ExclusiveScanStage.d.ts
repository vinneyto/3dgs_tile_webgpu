import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
export declare class ExclusiveScanStage {
    readonly output: StorageBufferAttribute;
    private readonly attributes;
    private readonly levels;
    constructor(input: StorageBufferAttribute, length: number, label?: string, inputMode?: "uint" | "projectedVisibility");
    encode(renderer: WebGPURenderer): void;
    dispose(): void;
}
