import type { GaussianData } from "../GaussianData";
import type { ComputeNode, IndirectStorageBufferAttribute, StorageBufferAttribute } from "three/webgpu";
import type { DispatchResources } from "../pipeline/types";
import { ExclusiveScanStage } from "../pipeline/ExclusiveScanStage";
import { IntersectionStage } from "../pipeline/IntersectionStage";
import { RadixSorter } from "../pipeline/RadixSorter";
import { GaussianPassOutput } from "./GaussianPassOutput";
import type { GaussianProjectionResources } from "./GaussianProjectionPass";
import type { GaussianOrderingResources } from "./GaussianOrderingPass";
import type { GaussianPassContext } from "./GaussianPassContext";
export interface GaussianIntersectionResources {
    intersectionOffsets: StorageBufferAttribute;
    sortedIntersections: StorageBufferAttribute;
    dispatch: DispatchResources;
    rasterDispatch: IndirectStorageBufferAttribute;
}
export interface GaussianIntersectionRuntime {
    scan: ExclusiveScanStage;
    intersections: IntersectionStage;
    sorter: RadixSorter;
    resizeGaussianCount(count: number): void;
    resizeCapacity(capacity: number): void;
    encode(attempt: number, resetValid: boolean, profileKernels: boolean): void;
    getComputeNodes(): ComputeNode[];
    dispose(): void;
}
/** Counts, emits and stably sorts tile records, including completeness/overflow gating. */
export declare class GaussianIntersectionPass {
    readonly output: GaussianPassOutput<GaussianIntersectionResources>;
    readonly inputs: Readonly<{
        gaussians: GaussianPassOutput<GaussianData>;
        projection: GaussianPassOutput<GaussianProjectionResources>;
        ordering: GaussianPassOutput<GaussianOrderingResources>;
    }>;
    constructor(gaussians: GaussianPassOutput<GaussianData>, projection: GaussianPassOutput<GaussianProjectionResources>, ordering: GaussianPassOutput<GaussianOrderingResources>);
    createRuntime(context: GaussianPassContext): GaussianIntersectionRuntime;
}
