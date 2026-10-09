import type { CloudRenderState } from "../CloudRenderState";
export interface PackedAttributeSchema {
    name: string;
    format: "f32" | "u32";
    elementsPerGaussian: number;
}
/** Allocate empty sparse buffers once; bounded patches populate them afterward. */
export interface BuffersAllocatedPayload {
    type: "buffers-allocated";
    sceneRevision: number;
    layoutVersion: number;
    contentVersion: number;
    capacity: number;
    objectCapacity: number;
    shDegree: 0 | 1 | 2 | 3;
    shFormat: "rgb8e8";
    attributes: readonly PackedAttributeSchema[];
    clouds: readonly CloudRenderState[];
}
