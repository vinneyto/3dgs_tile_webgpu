import { StorageBufferAttribute } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import { ACTIVE_SLOT_TAG } from "./activeSlots";
import { coalescePendingRanges } from "../utils/slotRanges";
import { StorageBindings } from "./StorageBindings";

const keys = ["means", "scalesOpacity", "rotations", "shCoefficients"] as const;
type Key = (typeof keys)[number];

/** A cloud-local GPU input. The backend's sparse slot ownership stays on CPU.
 * means.w contains the encoded source slot for optional packed attributes, never an
 * object id. Only changed component spans are uploaded after a LOD transaction.
 */
export class CloudSource {
  readonly buffers = {} as Record<Key, StorageBufferAttribute>;
  count = 0;
  private capacity = 0;
  private schema = "";
  private readonly localSlots: number[] = [];
  private readonly ordinals = new Map<number, number>();
  private readonly slotBits = new Uint32Array(1);
  private readonly slotFloat = new Float32Array(this.slotBits.buffer);

  constructor(private readonly bindings: StorageBindings) {}

  update(data: GaussianData, slots: readonly number[]): boolean {
    // Preserve local order for retained splats. Backend active ordinals can
    // reorder after a swap removal; that must not re-upload an entire cloud.
    const selected = new Set(slots);
    for (let ordinal = 0; ordinal < this.localSlots.length;) {
      const slot = this.localSlots[ordinal]!;
      if (selected.has(slot)) {
        ordinal++;
        continue;
      }
      const last = this.localSlots.pop()!;
      this.ordinals.delete(slot);
      if (ordinal < this.localSlots.length) {
        this.localSlots[ordinal] = last;
        this.ordinals.set(last, ordinal);
      }
    }
    for (const slot of slots) {
      if (this.ordinals.has(slot)) continue;
      this.ordinals.set(slot, this.localSlots.length);
      this.localSlots.push(slot);
    }
    slots = this.localSlots;
    const schema = `${data.geometryFormat}/${data.shFormat}`;
    const variantChanged = this.schema !== schema;
    const maximum = Math.min(
      ...keys.map((key) =>
        this.bindings.maximumCount(
          key === "shCoefficients"
            ? data.shCoefficientCount * data[key].itemSize
            : data[key].itemSize,
        ),
      ),
    );
    if (slots.length > maximum)
      throw new RangeError("Cloud input exceeds device binding size");
    const requiredSh = Math.max(1, slots.length) * data.shCoefficientCount;
    const replace =
      variantChanged ||
      slots.length > this.capacity ||
      (this.buffers.shCoefficients?.count ?? 0) < requiredSh;
    if (replace) {
      this.capacity = Math.min(
        maximum,
        Math.max(
          1,
          slots.length,
          slots.length > this.capacity ? this.capacity * 2 : this.capacity,
        ),
      );
      for (const key of keys) {
        const input = data[key];
        const width =
          key === "shCoefficients"
            ? data.shCoefficientCount * input.itemSize
            : input.itemSize;
        const ArrayType = input.array.constructor as
          Float32ArrayConstructor | Uint32ArrayConstructor;
        const next = new StorageBufferAttribute(
          new ArrayType(this.capacity * width),
          input.itemSize,
        );
        next.name = `3dgs.cloud-${key}`;
        const previous = this.buffers[key];
        if (previous) {
          if (!variantChanged) this.bindings.replace(previous, next);
          this.bindings.retire(previous);
        }
        this.buffers[key] = next;
      }
      this.schema = schema;
    }
    this.count = slots.length;
    for (const key of keys) {
      const input = data[key];
      const output = this.buffers[key];
      const width =
        key === "shCoefficients"
          ? data.shCoefficientCount * input.itemSize
          : input.itemSize;
      let first = -1;
      let changed = false;
      for (let ordinal = 0; ordinal < slots.length; ordinal++) {
        const slot = slots[ordinal]!;
        this.slotBits[0] = slot ^ ACTIVE_SLOT_TAG;
        let slotChanged = false;
        for (let component = 0; component < width; component++) {
          const index = ordinal * width + component;
          const value =
            key === "means" && component === 3
              ? this.slotFloat[0]!
              : input.array[slot * width + component]!;
          if (!Object.is(output.array[index], value)) {
            output.array[index] = value;
            slotChanged = true;
          }
        }
        if (slotChanged) {
          if (first < 0) first = ordinal;
          changed = true;
        } else if (first >= 0) {
          output.addUpdateRange(first * width, (ordinal - first) * width);
          first = -1;
        }
      }
      // Keep pending updates until a draw, including updates while hidden.
      if (first >= 0)
        output.addUpdateRange(first * width, (slots.length - first) * width);
      if (changed) {
        coalescePendingRanges(output);
        output.needsUpdate = true;
      }
    }
    return variantChanged;
  }

  dispose(): void {
    for (const key of keys)
      if (this.buffers[key]) this.bindings.retire(this.buffers[key]);
  }
}
