import type { CloudRenderState } from "../CloudRenderState";
import type { PackedAttributePatch } from "../PackedAttributePatch";
export interface BuffersPatchedPayload {
    type: "buffers-patched";
    /** Keep the old draw cut intact until the final activation commits. */
    deferUntilActivation?: boolean;
    sceneRevision: number;
    layoutVersion: number;
    baseContentVersion: number;
    contentVersion: number;
    /** Complete records for changed slots; empty for metadata-only updates. */
    patches: readonly PackedAttributePatch[];
    changedClouds: readonly CloudRenderState[];
    mipmapPending: boolean;
}
