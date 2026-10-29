import type { BackendConfig } from "../streaming-backend/BackendConfig";
import { GaussianWorkerProxy } from "./GaussianWorkerProxy";
import StreamingBackendWorker from "./StreamingGaussianBackendWorker?worker&inline";
export class WorkerStreamingGaussianBackend extends GaussianWorkerProxy {
  constructor(
    config: BackendConfig,
    port?: ConstructorParameters<typeof GaussianWorkerProxy>[1],
  ) {
    super(
      config,
      port ?? new StreamingBackendWorker({ name: "3dgs-streaming-backend" }),
    );
  }
}
