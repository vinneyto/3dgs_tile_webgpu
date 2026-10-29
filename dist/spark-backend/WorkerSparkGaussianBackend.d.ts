import type { BackendConfig } from "../streaming-backend/BackendConfig";
import { GaussianWorkerProxy } from "../streaming-backend-worker/GaussianWorkerProxy";
/** Transport only; GaussianStore's serial scheduler owns request ordering. */
export declare class WorkerSparkGaussianBackend extends GaussianWorkerProxy {
    constructor(config?: BackendConfig);
}
