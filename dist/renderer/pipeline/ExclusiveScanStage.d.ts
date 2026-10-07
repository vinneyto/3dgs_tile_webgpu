import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
export declare class ExclusiveScanStage {
    private readonly getLength?;
    readonly output: StorageBufferAttribute;
    private readonly attributes;
    private readonly levels;
    constructor(input: StorageBufferAttribute, length: number, label?: string, inputMode?: "uint" | "projectedVisibility", getLength?: (() => number) | undefined);
    encode(renderer: WebGPURenderer): void;
    dispose(): void;
}
