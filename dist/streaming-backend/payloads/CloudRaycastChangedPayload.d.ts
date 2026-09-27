import type { FullRaycastOctreeBuffers } from "../FullRaycastOctreeBuffers";
export interface CloudRaycastChangedPayload {
    type: "cloud-raycast-changed";
    cloudId: string;
    raycastable: boolean;
    raycast?: FullRaycastOctreeBuffers;
}
