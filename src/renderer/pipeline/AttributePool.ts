import {
  IndirectStorageBufferAttribute,
  StorageBufferAttribute,
} from "three/webgpu";

import {
  StorageBindings,
  type BoundStorage,
  type StorageElementType,
} from "./StorageBindings";

export class AttributePool {
  private readonly storageNodes = new Set<WeakRef<BoundStorage>>();
  bindings = new StorageBindings();

  storage<const T extends StorageElementType>(
    attribute: StorageBufferAttribute,
    type: T,
    count = attribute.count,
  ) {
    const node = this.bindings.storage(attribute, type, count);
    this.storageNodes.add(new WeakRef(node as BoundStorage));
    return node;
  }

  rebind(previous: StorageBufferAttribute, next: StorageBufferAttribute): void {
    if (previous === next) return;
    for (const reference of this.storageNodes) {
      const node = reference.deref();
      if (!node) {
        this.storageNodes.delete(reference);
        continue;
      }
      if (node.value === previous) {
        node.value = next;
        node.bufferCount = next.count;
      }
    }
  }

  grow(
    attribute: StorageBufferAttribute,
    count: number,
    reserve = true,
  ): StorageBufferAttribute {
    if (attribute.count >= count) return attribute;
    const maximum = this.bindings.maximumCount(attribute.itemSize);
    if (count > maximum)
      throw new RangeError("Storage workspace exceeds device binding size");
    count = Math.min(
      maximum,
      reserve ? Math.max(count, attribute.count * 2) : count,
    );
    const index = this.attributes.indexOf(attribute);
    if (index < 0) throw new Error("Cannot grow an unowned attribute");
    const ArrayType = attribute.array.constructor as
      Float32ArrayConstructor | Uint32ArrayConstructor;
    const next = new StorageBufferAttribute(
      new ArrayType(count * attribute.itemSize),
      attribute.itemSize,
    );
    next.name = attribute.name;
    this.attributes[index] = next;
    this.bindings.replace(attribute, next);
    this.bindings.retire(attribute);
    return next;
  }
  private readonly attributes: StorageBufferAttribute[] = [];

  createFloat(
    label: string,
    count: number,
    itemSize = 4,
  ): StorageBufferAttribute {
    return this.track(
      label,
      new StorageBufferAttribute(new Float32Array(count * itemSize), itemSize),
    );
  }

  createUint(
    label: string,
    count: number,
    itemSize = 1,
  ): StorageBufferAttribute {
    return this.track(
      label,
      new StorageBufferAttribute(new Uint32Array(count * itemSize), itemSize),
    );
  }

  createIndirect(label: string): IndirectStorageBufferAttribute {
    return this.track(
      label,
      new IndirectStorageBufferAttribute(new Uint32Array(4), 4),
    ) as IndirectStorageBufferAttribute;
  }

  dispose(): void {
    for (const attribute of this.attributes) this.bindings.retire(attribute);
    this.attributes.length = 0;
  }

  private track(
    label: string,
    attribute: StorageBufferAttribute,
  ): StorageBufferAttribute {
    attribute.name = label;
    this.attributes.push(attribute);
    return attribute;
  }
}
