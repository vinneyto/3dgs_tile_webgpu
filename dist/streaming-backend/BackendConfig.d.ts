import type { PackingStrategy } from "./PackingStrategy";
/** GPU limits and streaming policy supplied by the frontend. */
export interface BackendConfig {
    frontend: {
        maxStorageBufferBindingSize: number;
        maxBufferSize: number;
        maxStorageBuffersPerShaderStage: number;
        supportsPartialBufferUpdates: boolean;
    };
    maxGaussians?: number | "auto";
    defaultPackingStrategy?: PackingStrategy;
    streamingLod?: {
        maxUploadBytesPerUpdate?: number;
        maxChangedCellsPerUpdate?: number;
    };
}
