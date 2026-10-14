import type { GaussianData } from "../GaussianData";
import type { ComputeNode, StorageBufferAttribute } from "three/webgpu";
import type { DispatchResources } from "../pipeline/types";
import { ExclusiveScanStage } from "../pipeline/ExclusiveScanStage";
import { VisibleGaussianStage } from "../pipeline/VisibleGaussianStage";
import { RadixSorter } from "../pipeline/RadixSorter";
import { DepthOrderedTileStage } from "../pipeline/DepthOrderedTileStage";
import { GaussianPassOutput } from "./GaussianPassOutput";
import type { GaussianProjectionResources } from "./GaussianProjectionPass";
import type { GaussianPassContext } from "./GaussianPassContext";
export interface GaussianOrderingResources {
    visibleOffsets: StorageBufferAttribute;
    depthSortedGaussians: StorageBufferAttribute;
    depthOrderedTileCounts: StorageBufferAttribute;
    dispatch: DispatchResources;
}
export interface GaussianOrderingRuntime {
    visibleScan: ExclusiveScanStage;
    visible: VisibleGaussianStage;
    depthSorter: RadixSorter;
    orderedTiles: DepthOrderedTileStage;
    resize(count: number): void;
    encode(profileKernels: boolean): void;
    getComputeNodes(): ComputeNode[];
    dispose(): void;
}
/** Visibility scan, compaction, depth sort and ordered tile counts form one logical pass. */
export declare class GaussianOrderingPass {
    readonly output: GaussianPassOutput<GaussianOrderingResources>;
    readonly inputs: Readonly<{
        gaussians: GaussianPassOutput<GaussianData>;
        projection: GaussianPassOutput<GaussianProjectionResources>;
    }>;
    constructor(gaussians: GaussianPassOutput<GaussianData>, projection: GaussianPassOutput<GaussianProjectionResources>);
    createRuntime(context: GaussianPassContext): GaussianOrderingRuntime;
}
