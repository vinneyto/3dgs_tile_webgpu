/** The range refers to the shared packed scene, never to source indices. */
export interface PackedAttributePatch {
    name: string;
    firstSlot: number;
    slotCount: number;
    data: ArrayBuffer;
}
