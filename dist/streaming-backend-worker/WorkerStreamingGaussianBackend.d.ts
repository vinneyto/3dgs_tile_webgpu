import type { BackendConfig } from "../streaming-backend/BackendConfig";
import { GaussianWorkerProxy } from "./GaussianWorkerProxy";
export declare class WorkerStreamingGaussianBackend extends GaussianWorkerProxy {
    constructor(config: BackendConfig, port?: ConstructorParameters<typeof GaussianWorkerProxy>[1]);
}
