import type {
  StorageBufferAttribute,
  StorageInstancedBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { storage, uniformGroup } from "three/tsl";

/** Stable TSL nodes: a resource replacement updates bindings, never the shader graph. */
export type StorageElementType = "uint" | "uvec2" | "vec4" | "uvec4";
export interface BoundStorage {
  value: StorageBufferAttribute | StorageInstancedBufferAttribute;
  bufferCount: number;
}

export class StorageBindings {
  private readonly nodes = new Set<WeakRef<BoundStorage>>();
  // r185 caches texture-containing bind groups using texture IDs/versions,
  // without storage identities. Keep mutable storage in its own group so a
  // replacement cannot select a cached group containing a retired GPU buffer.
  private readonly group = uniformGroup("gaussianStorage", 1, "object");
  constructor(private readonly renderer?: WebGPURenderer) {}
  replacements = 0;

  storage<const T extends StorageElementType>(
    attribute: StorageBufferAttribute,
    type: T,
    count = attribute.count,
  ) {
    // A nonzero count makes StorageBufferNode hash by node identity, rather
    // than by the first attribute's identity. WGSL storage arrays are unsized.
    const node = storage(attribute, type, Math.max(1, count)).setGroup(
      this.group,
    );
    this.nodes.add(new WeakRef(node as BoundStorage));
    return node;
  }

  replace(
    previous: StorageBufferAttribute,
    next: StorageBufferAttribute,
  ): void {
    if (previous === next) return;
    if (
      previous.itemSize !== next.itemSize ||
      previous.array.constructor !== next.array.constructor ||
      "isIndirectStorageBufferAttribute" in previous !==
        "isIndirectStorageBufferAttribute" in next
    ) {
      throw new TypeError(
        "Incompatible storage replacement requires a shader variant",
      );
    }
    for (const reference of this.nodes) {
      const node = reference.deref();
      if (!node) {
        this.nodes.delete(reference);
        continue;
      }
      if (node.value !== previous) continue;
      node.value = next;
      node.bufferCount = next.count;
    }
    this.replacements++;
  }

  maximumCount(itemSize: number): number {
    const limits = (this.renderer?.backend as unknown as { device?: GPUDevice })
      ?.device?.limits;
    return limits
      ? Math.floor(
          Math.min(limits.maxBufferSize, limits.maxStorageBufferBindingSize) /
            (itemSize * 4),
        )
      : Number.MAX_SAFE_INTEGER;
  }

  retire(attribute: StorageBufferAttribute): void {
    this.afterSubmittedWork(() => attribute.dispose());
  }

  afterSubmittedWork(dispose: () => void): void {
    const queue = (this.renderer?.backend as unknown as { device?: GPUDevice })
      ?.device?.queue;
    if (queue) void queue.onSubmittedWorkDone().then(dispose, dispose);
    else dispose();
  }
}
