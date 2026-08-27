import type {
  ColorSpace,
  IndirectStorageBufferAttribute,
  StorageBufferAttribute,
} from "three/webgpu";

export type DepthSortMode = "float32" | "packed16";

export interface GaussianPassOptions {
  /** Exact float32 depth, or a packed 16-bit tile + 16-bit quantized depth key. */
  depthSortMode?: DepthSortMode;
  /** Maximum emitted tile/Gaussian intersections. Buffers are allocated once at this capacity. */
  intersectionCapacity?: number;
  /** RGBA clear color composited behind the cloud. Defaults to transparent black. */
  background?: readonly [number, number, number, number];
  /** Create a standard perspective-depth texture exposed as pass.getTextureNode("depth"). */
  outputDepth?: boolean;
  /** Color space represented by the reconstructed SH colors. Canonical 3DGS PLY is sRGB. */
  colorSpace?: ColorSpace;
  /** Split normally batched compute groups so timestamp tools can measure every kernel. */
  profileKernels?: boolean;
}

export interface GaussianPassStats {
  intersectionCount: number;
  requestedIntersections: number;
  intersectionCapacity: number;
  overflow: boolean;
}

/** CPU-side lifecycle counters. Reading these values never synchronizes with the GPU. */
export interface GaussianPassDebugInfo {
  initialized: boolean;
  width: number;
  height: number;
  tilesX: number;
  tilesY: number;
  tileStageRebuilds: number;
  radixPasses: number;
  profileKernels: boolean;
}

/** Three.js-owned intermediate attributes reusable by other node code or wgslFn kernels. */
export interface GaussianPassResources {
  projectedMean: StorageBufferAttribute;
  projectedConic: StorageBufferAttribute;
  projectedColor: StorageBufferAttribute;
  tileCounts: StorageBufferAttribute;
  intersectionOffsets: StorageBufferAttribute;
  dispatchState: StorageBufferAttribute;
  /** float32: uvec4(tile, depthBits, gaussianId, 0); packed16: uvec2(key, gaussianId). */
  sortedIntersections: StorageBufferAttribute;
  tileOffsets: StorageBufferAttribute;
}

export interface FloatIntersectionBuffers {
  kind: "float32";
  recordsA: StorageBufferAttribute;
  recordsB: StorageBufferAttribute;
}

export interface PackedIntersectionBuffers {
  kind: "packed16";
  recordsA: StorageBufferAttribute;
  recordsB: StorageBufferAttribute;
}

export type IntersectionBuffers =
  FloatIntersectionBuffers | PackedIntersectionBuffers;

export interface DispatchResources {
  state: StorageBufferAttribute;
  radix: IndirectStorageBufferAttribute;
  linear: IndirectStorageBufferAttribute;
}
