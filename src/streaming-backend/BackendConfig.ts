import type { PackingStrategy } from "./PackingStrategy";

/** Stable backend policy. GPU limits arrive with each rendering request. */
export interface BackendConfig {
  maxGaussians?: number | "auto";
  defaultPackingStrategy?: PackingStrategy;
  streamingLod?: {
    maxUploadBytesPerUpdate?: number;
    maxChangedCellsPerUpdate?: number;
  };
}

export interface FrontendCapabilities {
  maxStorageBufferBindingSize: number;
  maxBufferSize: number;
  maxStorageBuffersPerShaderStage: number;
  supportsPartialBufferUpdates: boolean;
}
