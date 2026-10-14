import type { GaussianData } from "../GaussianData";
import type { GaussianPassOutput } from "./GaussianPassOutput";
import type { Node } from "three/webgpu";
import {
  gaussianPositionLocal,
  gaussianScale,
  gaussianRotation,
  gaussianOpacity,
} from "../nodes/GaussianContextNodes";
import type { GaussianRenderStore } from "../GaussianRenderStore";
import { GaussianDataPass } from "./GaussianDataPass";
import { GaussianPassNodes } from "./GaussianPassNodes";
import { GaussianTransformStage } from "../pipeline/GaussianTransformStage";

export interface GaussianTransformNodeSlots {
  positionNode: Node;
  scaleNode: Node;
  rotationNode: Node;
  opacityNode: Node;
}

/** Materializes local-space geometry before any camera-specific consumer. */
export class GaussianTransformPass extends GaussianDataPass {
  readonly nodes: GaussianTransformNodeSlots;
  constructor(store: GaussianRenderStore | GaussianPassOutput<GaussianData>) {
    const slots = new GaussianPassNodes<GaussianTransformNodeSlots>({
      positionNode: gaussianPositionLocal,
      scaleNode: gaussianScale,
      rotationNode: gaussianRotation,
      opacityNode: gaussianOpacity,
    });
    super(store, (context) => new GaussianTransformStage(context, slots.nodes));
    this.nodes = slots.nodes;
    // Each runtime checks these identities before encoding. Uniform changes
    // only need invalidate(), while node changes rebuild this pass alone.
    slots.subscribe(() => this.invalidateNodes());
  }
}
