import {
  IndirectStorageBufferAttribute,
  StorageBufferAttribute,
} from "three/webgpu";

export class AttributePool {
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
    for (const attribute of this.attributes) attribute.dispose();
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
