import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";
export declare class SuffixMinStage {
    private readonly attributes;
    private readonly levels;
    constructor(values: StorageBufferAttribute, length: number);
    encode(renderer: WebGPURenderer): void;
    dispose(): void;
}
