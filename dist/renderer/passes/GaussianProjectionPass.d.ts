import type { GaussianData } from "../GaussianData";
import { type GaussianProjectionNodeSlots } from "../nodes/GaussianContextNodes";
import { ProjectionStage } from "../pipeline/ProjectionStage";
import { GaussianPassOutput } from "./GaussianPassOutput";
import { GaussianPassNodes } from "./GaussianPassNodes";
import type { GaussianPassContext } from "./GaussianPassContext";
export type GaussianProjectionResources = Pick<ProjectionStage, "projectedMean" | "projectedConic" | "projectedColor" | "tileCounts">;
/** Projects ellipses and counts their tile support; owns projection-domain TSL slots. */
export declare class GaussianProjectionPass extends GaussianPassNodes<GaussianProjectionNodeSlots> {
    readonly output: GaussianPassOutput<GaussianProjectionResources>;
    readonly inputs: Readonly<{
        gaussians: GaussianPassOutput<GaussianData>;
    }>;
    readonly defaultProjectionNode: import("three/webgpu").Node;
    constructor(gaussians: GaussianPassOutput<GaussianData>);
    createRuntime(context: GaussianPassContext): ProjectionStage;
}
