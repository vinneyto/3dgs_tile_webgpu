import type { CloudRenderState } from "../CloudRenderState";
import type { PackedAttributeBuffer } from "../PackedAttributeBuffer";
export interface BuffersReplacedPayload {
    type: "buffers-replaced";
    sceneRevision: number;
    layoutVersion: number;
    contentVersion: number;
    count: number;
    capacity: number;
    objectCapacity: number;
    shDegree: 0 | 1 | 2 | 3;
    shFormat: "rgb8e8";
    attributes: readonly PackedAttributeBuffer[];
    clouds: readonly CloudRenderState[];
}
