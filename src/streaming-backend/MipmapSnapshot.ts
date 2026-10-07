import type { PackedAttributeBuffer } from "./PackedAttributeBuffer";
/** Optional camera-independent hierarchy. Rendering never depends on it. */
export interface MipmapSnapshot {
  sourceVersion: number;
  snapshotVersion: number;
  rootIndex: number;
  nodeCount: number;
  leafCount: number;
  /** One Gaussian per node, indexed identically to the hierarchy buffers. */
  attributes: readonly PackedAttributeBuffer[];
  /** Float32 min.xyz/max.xyz per node, enclosing this node and its subtree. */
  nodeBounds: ArrayBuffer;
  /** Uint32 firstChild/childCount per node; children occupy a contiguous range. */
  nodeChildren: ArrayBuffer;
}
