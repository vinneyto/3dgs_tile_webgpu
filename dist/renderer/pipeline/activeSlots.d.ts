/** Encode slot bits as normal floats; raw small u32 ids would be subnormals. */
export declare const ACTIVE_SLOT_TAG = 1065353216;
export declare const encodeActiveSlot: (...params: any[] | readonly [import("three/tsl").ProxiedObject<any>]) => import("three/webgpu").Node;
export declare const decodeActiveSlot: (...params: any[] | readonly [import("three/tsl").ProxiedObject<any>]) => import("three/webgpu").Node;
