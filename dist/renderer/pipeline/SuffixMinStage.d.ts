import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
export declare class SuffixMinStage {
    private readonly getLength?;
    private readonly attributes;
    private readonly levels;
    constructor(values: StorageBufferAttribute, length: number, getLength?: (() => number) | undefined);
    encode(renderer: WebGPURenderer): void;
    dispose(): void;
}
