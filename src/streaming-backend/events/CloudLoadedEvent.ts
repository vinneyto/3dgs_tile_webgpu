import type { FullRaycastOctreeBuffers } from "../FullRaycastOctreeBuffers";
export interface CloudLoadedEvent {
  type: "cloud-loaded";
  commandId: string;
  cloudId: string;
  objectId: number;
  sourceCount: number;
  shDegree: 0 | 1 | 2 | 3;
  bounds: readonly [number, number, number, number, number, number];
  raycast?: FullRaycastOctreeBuffers;
}
