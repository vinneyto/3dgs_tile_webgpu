import type { CloudRenderState } from "../CloudRenderState";
import type { PackedAttributeBuffer } from "../PackedAttributeBuffer";
export interface BuffersReplacedPayload {
  type: "buffers-replaced";
  sceneRevision: number;
  layoutVersion: number;
  contentVersion: number;
  /** Active draw count, independent of GPU residency. */
  count: number;
  /** Compact active GPU slot list; absent for legacy backends with a dense prefix. */
  activeSlots?: ArrayBuffer;
  /** Full GPU slot range. Unoccupied means.w values are -1. */
  capacity: number;
  objectCapacity: number;
  shDegree: 0 | 1 | 2 | 3;
  shFormat: "rgb8e8";
  attributes: readonly PackedAttributeBuffer[];
  clouds: readonly CloudRenderState[];
}
