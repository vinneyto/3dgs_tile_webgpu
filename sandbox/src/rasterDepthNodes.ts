import { bool } from "three/tsl";
import type { Node } from "three/webgpu";
import {
  rasterPixelValue,
  rasterViewDepth,
  type DepthSortMode,
} from "../../src/index";

/** Cache scene depth before traversal; quantized sorting cannot safely break. */
export function rasterDepthNodes(viewDepth: Node, mode: DepthSortMode) {
  const occluded = rasterPixelValue.lessThan(rasterViewDepth);
  return {
    rasterPixelValueNode: viewDepth,
    rasterBreakNode: mode === "float32" ? occluded : bool(false),
    rasterDiscardNode: mode === "packed16" ? occluded : bool(false),
  };
}
