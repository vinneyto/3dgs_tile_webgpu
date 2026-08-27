import { DISPATCH_STATE_BYTES } from "./constants";

export function align4(size: number): number {
  return Math.max(4, Math.ceil(size / 4) * 4);
}

export function storage(buffer: GPUBuffer, size?: number): GPUBufferBinding {
  return size === undefined ? { buffer } : { buffer, size: align4(size) };
}

export function dispatchState(buffer: GPUBuffer): GPUBufferBinding {
  return { buffer, offset: 0, size: DISPATCH_STATE_BYTES };
}
