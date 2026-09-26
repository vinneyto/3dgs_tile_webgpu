import type { BackendConfig } from "./BackendConfig";
import type { GaussianBackend } from "./GaussianBackend";
export interface GaussianBackendFactory {
    createBackend(config: BackendConfig): GaussianBackend;
}
