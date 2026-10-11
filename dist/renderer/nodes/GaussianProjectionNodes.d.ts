import type { Node } from "three/webgpu";
/** Resolved object shape covariance transformed into the pass view frame. */
export declare function gaussianViewCovariance(scale: Node, rotation: Node, modelView: Node): Node<"mat3">;
/** Build the projection-root mat4 from a pixel center, positive scalar and (xx, xy, yy) covariance. */
export declare function gaussianProjectionResult(center: Node, depth: Node, covariance: Node, filterVariance?: Node): Node<"mat4">;
/** Default perspective root. Perspective clipping is confined to this graph. */
export declare function perspectiveGaussianProjection(): Node;
