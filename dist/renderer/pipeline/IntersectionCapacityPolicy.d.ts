import type { GaussianPassOptions } from "./types";
/** CPU allocation policy; GPU demand remains the authority for correctness. */
export declare class IntersectionCapacityPolicy {
    readonly initial: number;
    readonly maximum: number;
    readonly interval: number;
    private readonly growth;
    private readonly headroom;
    constructor(options: GaussianPassOptions, limits: GPUDevice["limits"], chunkSize: number | null, depth: boolean);
    next(current: number, demand: number): number | null;
}
