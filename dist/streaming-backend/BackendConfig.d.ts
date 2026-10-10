import type { MipmapConfig } from "./MipmapConfig";
export interface BackendStreamingConfig {
    maxUploadBytesPerUpdate?: number;
}
export interface BackendLodConfig {
    /** Hold weak existing detail before coarsening; default 400 ms. Zero disables the delay. */
    downgradeDelayMs?: number;
    /** Interval between collapsing successive tree levels; default 100 ms. */
    downgradeStepMs?: number;
    /** Existing branches coarsen below this weighted pixel size; refinement starts above 1. Default 0.7. */
    downgradeThreshold?: number;
    /** Preparation halo in normalized clip coordinates; default 0.15. */
    frustumMargin?: number;
}
/** Device-independent configuration. Buffer capacity comes from capabilities. */
export interface BackendConfig {
    defaultMipmaps?: MipmapConfig;
    streaming?: BackendStreamingConfig;
    lod?: BackendLodConfig;
}
