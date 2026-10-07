import { wgslFn } from "three/tsl";

/** Encode slot bits as normal floats; raw small u32 ids would be subnormals. */
export const ACTIVE_SLOT_TAG = 0x3f800000;
export const encodeActiveSlot =
  wgslFn<any>(`fn encode_active_slot(slot: u32) -> f32 {
  return bitcast<f32>(slot ^ 0x3f800000u);
}`);
export const decodeActiveSlot =
  wgslFn<any>(`fn decode_active_slot(value: f32) -> u32 {
  return bitcast<u32>(value) ^ 0x3f800000u;
}`);
