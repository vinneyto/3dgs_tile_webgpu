import type { Node } from "three/webgpu";
import {
  gaussianColor,
  gaussianOpacity,
  gaussianPositionLocal,
  gaussianPositionWorld,
  gaussianRotation,
  gaussianScale,
} from "./nodes/GaussianContextNodes";

/** TSL expressions evaluated once per selected splat, before tiled projection.
 * Replace a node and call needsUpdate after changing the graph. Uniform values
 * can change without rebuilding it. Materials may be shared by several clouds;
 * compute bindings and matrixWorld uniforms always belong to each dispatch.
 */
export class GaussianCloudMaterial {
  positionLocalNode: Node = gaussianPositionLocal;
  positionWorldNode: Node = gaussianPositionWorld;
  scaleNode: Node = gaussianScale;
  rotationNode: Node = gaussianRotation;
  opacityNode: Node = gaussianOpacity;
  colorNode: Node = gaussianColor;
  version = 0;

  set needsUpdate(value: boolean) {
    if (value) this.version++;
  }
}
