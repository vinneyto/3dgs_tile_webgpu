/** Full source data and acceleration structure for synchronous client raycasts. */
export interface FullRaycastOctreeBuffers {
    means: ArrayBuffer;
    scalesOpacity: ArrayBuffer;
    rotations: ArrayBuffer;
    nodeBounds: ArrayBuffer;
    nodeChildren: ArrayBuffer;
    children: ArrayBuffer;
    nodeIndices: ArrayBuffer;
    indices: ArrayBuffer;
}
