import type { PackingStrategy } from "./PackingStrategy";
/** Backend policy independent of the rendering device. */
export interface BackendConfig {
    maxGaussians?: number | "auto";
    defaultPackingStrategy?: PackingStrategy;
    streamingLod?: {
        maxUploadBytesPerUpdate?: number;
        maxChangedCellsPerUpdate?: number;
    };
}
