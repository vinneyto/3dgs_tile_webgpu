import type { CloudRenderState } from "../CloudRenderState";
/** Bounded slot deltas. Apply the staged transaction only when commit is true. */
export interface BuffersActivatedPayload {
    type: "buffers-activated";
    sceneRevision: number;
    layoutVersion: number;
    baseContentVersion: number;
    contentVersion: number;
    addedSlots: ArrayBuffer;
    removedSlots: ArrayBuffer;
    commit: boolean;
    changedClouds: readonly CloudRenderState[];
    mipmapPending: boolean;
}
