import type { BackendConfig } from "../streaming-backend/BackendConfig";
import { GaussianWorkerProxy } from "../streaming-backend-worker/GaussianWorkerProxy";
import SparkWorker from "./SparkGaussianBackendWorker?worker&inline";
/** Transport only; GaussianStore's serial scheduler owns request ordering. */
export class WorkerSparkGaussianBackend extends GaussianWorkerProxy {
  constructor(config: BackendConfig = {}) {
    super(config, new SparkWorker({ name: "upstream-spark-gaussian-backend" }));
  }
}
