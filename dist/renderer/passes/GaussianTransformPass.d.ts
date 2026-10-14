import type { GaussianData } from "../GaussianData";
import type { GaussianPassOutput } from "./GaussianPassOutput";
import type { Node } from "three/webgpu";
import type { GaussianRenderStore } from "../GaussianRenderStore";
import { GaussianDataPass } from "./GaussianDataPass";
export interface GaussianTransformNodeSlots {
    positionNode: Node;
    scaleNode: Node;
    rotationNode: Node;
    opacityNode: Node;
}
/** Materializes local-space geometry before any camera-specific consumer. */
export declare class GaussianTransformPass extends GaussianDataPass {
    readonly nodes: GaussianTransformNodeSlots;
    constructor(store: GaussianRenderStore | GaussianPassOutput<GaussianData>);
}
