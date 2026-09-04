import type { Node } from "three/webgpu";
import { vec4 } from "three/tsl";

/** Composite a regular transparent Three.js pass over another pass. */
export function compositePremultipliedOver(
  base: Node<"vec4">,
  overlay: Node<"vec4">,
): Node<"vec4"> {
  const baseColor = vec4(base);
  const overlayColor = vec4(overlay);
  const inverseOverlayAlpha = overlayColor.a.oneMinus();
  return vec4(
    overlayColor.rgb.add(baseColor.rgb.mul(inverseOverlayAlpha)),
    overlayColor.a.add(baseColor.a.mul(inverseOverlayAlpha)),
  );
}

/** Composite an overlay only where its pass depth is in front of the base. */
export function compositeDepthTestedPremultipliedOver(
  base: Node<"vec4">,
  overlay: Node<"vec4">,
  baseViewZ: Node<"float">,
  overlayViewZ: Node<"float">,
): Node<"vec4"> {
  const visibleOverlay = overlayViewZ
    .greaterThanEqual(baseViewZ)
    .select(vec4(overlay), vec4(0));
  return compositePremultipliedOver(base, visibleOverlay);
}
