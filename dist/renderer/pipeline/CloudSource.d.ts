import { StorageBufferAttribute } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import { StorageBindings } from "./StorageBindings";
declare const keys: readonly ["means", "scalesOpacity", "rotations", "shCoefficients"];
type Key = (typeof keys)[number];
/** A cloud-local GPU input. The backend's sparse slot ownership stays on CPU.
 * means.w contains the encoded source slot for optional packed attributes, never an
 * object id. Only changed component spans are uploaded after a LOD transaction.
 */
export declare class CloudSource {
    private readonly bindings;
    readonly buffers: Record<Key, StorageBufferAttribute>;
    count: number;
    private capacity;
    private schema;
    private readonly localSlots;
    private readonly ordinals;
    private readonly slotBits;
    private readonly slotFloat;
    constructor(bindings: StorageBindings);
    update(data: GaussianData, slots: readonly number[]): boolean;
    dispose(): void;
}
export {};
