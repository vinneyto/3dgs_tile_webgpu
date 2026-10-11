import type { Node } from "three/webgpu";
import { vec4, wgslFn } from "three/tsl";
import {
  perspectiveProjectionWGSL,
  projectionResultWGSL,
  viewCovarianceWGSL,
} from "../kernels/projectionHelpers";
import {
  gaussianPositionView,
  gaussianCovarianceView,
  gaussianPassProjectionMatrix,
  gaussianPassViewport,
  gaussianPassDepthRange,
  gaussianPassFilterVariance,
} from "./GaussianContextNodes";

const result = wgslFn<any>(projectionResultWGSL);
const viewCovariance = wgslFn<any>(viewCovarianceWGSL);
const perspective = wgslFn<any>(perspectiveProjectionWGSL, [result as any]);

/** Resolved object shape covariance transformed into the pass view frame. */
export function gaussianViewCovariance(
  scale: Node,
  rotation: Node,
  modelView: Node,
): Node<"mat3"> {
  return viewCovariance({
    scale_input: scale,
    rotation_input: rotation,
    model_view: modelView,
  }) as Node<"mat3">;
}

/** Build the projection-root mat4 from a pixel center, positive scalar and (xx, xy, yy) covariance. */
export function gaussianProjectionResult(
  center: Node,
  depth: Node,
  covariance: Node,
  filterVariance: Node = gaussianPassFilterVariance,
): Node<"mat4"> {
  return result({
    center,
    depth,
    covariance,
    filter_variance: filterVariance,
  }) as Node<"mat4">;
}

/** Default perspective root. Perspective clipping is confined to this graph. */
export function perspectiveGaussianProjection(): Node {
  return perspective({
    view: gaussianPositionView,
    covariance_view: gaussianCovarianceView,
    projection: gaussianPassProjectionMatrix,
    viewport: vec4(gaussianPassViewport, gaussianPassDepthRange),
    filter_variance: gaussianPassFilterVariance,
  });
}
