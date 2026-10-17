import type { Node } from "three/webgpu";
/** TSL expressions evaluated once per selected splat, before tiled projection.
 * Replace a node and call needsUpdate after changing the graph. Uniform values
 * can change without rebuilding it. Materials may be shared by several clouds;
 * compute bindings and matrixWorld uniforms always belong to each dispatch.
 */
export declare class GaussianCloudMaterial {
    positionLocalNode: Node;
    positionWorldNode: Node;
    scaleNode: Node;
    rotationNode: Node;
    opacityNode: Node;
    colorNode: Node;
    version: number;
    set needsUpdate(value: boolean);
}
