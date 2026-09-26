import type { CloudRenderState } from "../CloudRenderState";
import type { PackedAttributePatch } from "../PackedAttributePatch";
export interface BuffersPatchedEvent {
  type: "buffers-patched";
  requestId: string;
  sceneRevision: number;
  layoutVersion: number;
  baseContentVersion: number;
  contentVersion: number;
  patches: readonly PackedAttributePatch[];
  changedClouds: readonly CloudRenderState[];
  lodPending: boolean;
}
