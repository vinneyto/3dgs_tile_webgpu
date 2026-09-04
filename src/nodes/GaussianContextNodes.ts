import type { Node } from "three/webgpu";
import { bool, exp, float, property } from "three/tsl";

// Projection-domain accessors. gaussianIndex is the current packed
// GaussianStore slot, not a persistent source-data identifier.
export const gaussianIndex = property("uint", "gaussianIndex");
export const gaussianObjectId = property("uint", "gaussianObjectId");
export const gaussianPositionLocal = property("vec3", "gaussianPositionLocal");
export const gaussianPositionWorld = property("vec3", "gaussianPositionWorld");
export const gaussianScale = property("vec3", "gaussianScale");
export const gaussianRotation = property("vec4", "gaussianRotation");
export const gaussianOpacity = property("float", "gaussianOpacity");
export const gaussianColor = property("vec3", "gaussianColor");
export const gaussianObjectMatrix = property("mat4", "gaussianObjectMatrix");
export const gaussianObjectVisible = property("bool", "gaussianObjectVisible");
export const gaussianViewDirection = property("vec3", "gaussianViewDirection");
export const gaussianViewDepth = property("float", "gaussianViewDepth");
export const gaussianScreenPosition = property(
  "vec2",
  "gaussianScreenPosition",
);
export const gaussianScreenBoundsMin = property(
  "vec2",
  "gaussianScreenBoundsMin",
);
export const gaussianScreenBoundsMax = property(
  "vec2",
  "gaussianScreenBoundsMax",
);
export const gaussianProjectedSigma = property(
  "vec2",
  "gaussianProjectedSigma",
);
export const gaussianProjectedArea = property("float", "gaussianProjectedArea");

// Raster-domain accessors.
export const rasterGaussianIndex = property("uint", "rasterGaussianIndex");
export const rasterObjectId = property("uint", "rasterObjectId");
export const rasterPixelCoordinate = property("uvec2", "rasterPixelCoordinate");
export const rasterScreenPosition = property("vec2", "rasterScreenPosition");
export const rasterScreenUV = property("vec2", "rasterScreenUV");
export const rasterPixelValue = property("float", "rasterPixelValue");
export const rasterGaussianCenter = property("vec2", "rasterGaussianCenter");
export const rasterPixelDelta = property("vec2", "rasterPixelDelta");
export const rasterGaussianCoord = property("vec2", "rasterGaussianCoord");
export const rasterUV = property("vec2", "rasterUV");
export const rasterViewDepth = property("float", "rasterViewDepth");
export const rasterGaussianColor = property("vec3", "rasterGaussianColor");
export const rasterGaussianOpacity = property("float", "rasterGaussianOpacity");
export const rasterPower = property("float", "rasterPower");
export const rasterWeight = property("float", "rasterWeight");

export interface GaussianProjectionNodeSlots {
  gaussianPositionLocalNode: Node;
  gaussianPositionWorldNode: Node;
  gaussianScaleNode: Node;
  gaussianRotationNode: Node;
  gaussianOpacityNode: Node;
  gaussianColorNode: Node;
  gaussianVisibilityNode: Node;
}

export interface GaussianRasterNodeSlots {
  rasterPixelValueNode: Node;
  rasterBreakNode: Node;
  rasterColorNode: Node;
  rasterAlphaNode: Node;
  rasterDiscardNode: Node;
}

export type GaussianNodeSlots = GaussianProjectionNodeSlots &
  GaussianRasterNodeSlots;

export function createDefaultGaussianNodeSlots(): GaussianNodeSlots {
  return {
    gaussianPositionLocalNode: gaussianPositionLocal,
    gaussianPositionWorldNode: gaussianPositionWorld,
    gaussianScaleNode: gaussianScale,
    gaussianRotationNode: gaussianRotation,
    gaussianOpacityNode: gaussianOpacity,
    gaussianColorNode: gaussianColor,
    gaussianVisibilityNode: bool(true),
    rasterPixelValueNode: float(0),
    rasterBreakNode: bool(false),
    rasterColorNode: rasterGaussianColor,
    rasterAlphaNode: rasterGaussianOpacity.mul(exp(rasterPower)),
    rasterDiscardNode: bool(false),
  };
}

export const projectionContextNodes = new Set<Node>([
  gaussianIndex,
  gaussianObjectId,
  gaussianPositionLocal,
  gaussianPositionWorld,
  gaussianScale,
  gaussianRotation,
  gaussianOpacity,
  gaussianColor,
  gaussianObjectMatrix,
  gaussianObjectVisible,
  gaussianViewDirection,
  gaussianViewDepth,
  gaussianScreenPosition,
  gaussianScreenBoundsMin,
  gaussianScreenBoundsMax,
  gaussianProjectedSigma,
  gaussianProjectedArea,
]);

export const rasterContextNodes = new Set<Node>([
  rasterGaussianIndex,
  rasterObjectId,
  rasterPixelCoordinate,
  rasterScreenPosition,
  rasterScreenUV,
  rasterPixelValue,
  rasterGaussianCenter,
  rasterPixelDelta,
  rasterGaussianCoord,
  rasterUV,
  rasterViewDepth,
  rasterGaussianColor,
  rasterGaussianOpacity,
  rasterPower,
  rasterWeight,
]);

// Accessors available to the pixel-scoped node before Gaussian iteration.
export const rasterPixelContextNodes = new Set<Node>([
  rasterPixelCoordinate,
  rasterScreenPosition,
  rasterScreenUV,
]);

// Accessors available before ellipse evaluation. A true rasterBreakNode ends
// the current pixel's depth-ordered Gaussian traversal.
export const rasterBreakContextNodes = new Set<Node>([
  ...rasterPixelContextNodes,
  rasterPixelValue,
  rasterGaussianIndex,
  rasterObjectId,
  rasterGaussianCenter,
  rasterPixelDelta,
  rasterViewDepth,
]);

export function validateGaussianNodeDomain(
  node: Node,
  allowed: ReadonlySet<Node>,
  domain: "projection" | "raster",
): void {
  node.traverse((child) => {
    const isGaussianContext =
      projectionContextNodes.has(child) || rasterContextNodes.has(child);
    if (isGaussianContext && !allowed.has(child)) {
      throw new Error(
        `A ${domain} GaussianPass node graph uses an accessor from the other domain`,
      );
    }
  });
}

export function validateGaussianNodeAccess(
  node: Node,
  allowed: ReadonlySet<Node>,
  field: string,
): void {
  node.traverse((child) => {
    const isGaussianContext =
      projectionContextNodes.has(child) || rasterContextNodes.has(child);
    if (isGaussianContext && !allowed.has(child)) {
      throw new Error(
        `GaussianPass.${field} uses a context accessor that is not available at that pipeline point`,
      );
    }
  });
}
