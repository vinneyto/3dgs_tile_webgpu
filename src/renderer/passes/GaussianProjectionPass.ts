import type { GaussianData } from "../GaussianData";
import {
  createDefaultGaussianNodeSlots,
  type GaussianProjectionNodeSlots,
} from "../nodes/GaussianContextNodes";
import { ProjectionStage } from "../pipeline/ProjectionStage";
import { GaussianPassOutput } from "./GaussianPassOutput";
import { GaussianPassNodes } from "./GaussianPassNodes";
import type { GaussianPassContext } from "./GaussianPassContext";

export type GaussianProjectionResources = Pick<
  ProjectionStage,
  "projectedMean" | "projectedConic" | "projectedColor" | "tileCounts"
>;

/** Projects ellipses and counts their tile support; owns projection-domain TSL slots. */
export class GaussianProjectionPass extends GaussianPassNodes<GaussianProjectionNodeSlots> {
  readonly output = new GaussianPassOutput<GaussianProjectionResources>(
    this,
    "projection.ellipses",
  );
  readonly inputs: Readonly<{ gaussians: GaussianPassOutput<GaussianData> }>;
  readonly defaultProjectionNode;
  constructor(gaussians: GaussianPassOutput<GaussianData>) {
    const defaults = createDefaultGaussianNodeSlots();
    const {
      gaussianProjectionNode,
      gaussianPositionLocalNode,
      gaussianPositionWorldNode,
      gaussianScaleNode,
      gaussianRotationNode,
      gaussianOpacityNode,
      gaussianColorNode,
      gaussianVisibilityNode,
    } = defaults;
    super({
      gaussianProjectionNode,
      gaussianPositionLocalNode,
      gaussianPositionWorldNode,
      gaussianScaleNode,
      gaussianRotationNode,
      gaussianOpacityNode,
      gaussianColorNode,
      gaussianVisibilityNode,
    });
    this.defaultProjectionNode = gaussianProjectionNode;
    this.inputs = Object.freeze({ gaussians });
  }
  createRuntime(context: GaussianPassContext): ProjectionStage {
    const stage = new ProjectionStage(
      this.inputs.gaussians.read(),
      context.frame,
      context.objects,
      context.antialiasMode,
      this.nodes,
      context.subpixelSampleCulling,
      context.bindings,
    );
    this.output.bind(() => ({
      projectedMean: stage.projectedMean,
      projectedConic: stage.projectedConic,
      projectedColor: stage.projectedColor,
      tileCounts: stage.tileCounts,
    }));
    return stage;
  }
}
