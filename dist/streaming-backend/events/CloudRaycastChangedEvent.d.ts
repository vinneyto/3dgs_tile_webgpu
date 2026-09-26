import type { FullRaycastOctreeBuffers } from "../FullRaycastOctreeBuffers";
export interface CloudRaycastChangedEvent {
    type: "cloud-raycast-changed";
    commandId: string;
    cloudId: string;
    raycastable: boolean;
    raycast?: FullRaycastOctreeBuffers;
}
