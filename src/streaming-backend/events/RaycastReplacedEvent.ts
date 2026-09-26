import type { FullRaycastOctreeBuffers } from "../FullRaycastOctreeBuffers";
export interface RaycastReplacedEvent {
  type: "raycast-replaced";
  cloudId: string;
  sourceVersion: number;
  bounds: readonly [number, number, number, number, number, number];
  raycast: FullRaycastOctreeBuffers;
}
