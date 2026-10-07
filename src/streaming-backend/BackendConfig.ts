import type { MipmapConfig } from "./MipmapConfig";
export interface BackendStreamingConfig {
  maxUploadBytesPerUpdate?: number;
}
/** Device-independent configuration. Buffer capacity comes from capabilities. */
export interface BackendConfig {
  defaultMipmaps?: MipmapConfig;
  streaming?: BackendStreamingConfig;
}
