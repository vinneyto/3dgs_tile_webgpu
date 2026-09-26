import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { GaussianBackendFactory } from "../streaming-backend/GaussianBackendFactory";
import { StreamingGaussianBackend } from "./StreamingGaussianBackend";

/** Runs the same core directly, useful in Node and in CPU-only tests. */
export class DirectStreamingGaussianBackendFactory implements GaussianBackendFactory {
  createBackend(config: BackendConfig): StreamingGaussianBackend {
    return new StreamingGaussianBackend(config);
  }
}
