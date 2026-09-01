import type {
  ColorSpace,
  IndirectStorageBufferAttribute,
  StorageBufferAttribute,
} from "three/webgpu";

export type DepthSortMode = "float32" | "packed16";
export type AntialiasMode = "compensated" | "classic";
export type RadixBackend = "auto" | "subgroup" | "workgroup";
export type ResolvedRadixBackend = Exclude<RadixBackend, "auto">;

export interface GaussianPassOptions {
  /** Exact float32 or quantized 16-bit depth for the visible-Gaussian pre-sort. */
  depthSortMode?: DepthSortMode;
  /** Preserve subpixel Gaussian energy, or retain the original fixed-footprint 3DGS low-pass behavior. */
  antialiasMode?: AntialiasMode;
  /** Maximum emitted tile/Gaussian intersections. Buffers are allocated once at this capacity. */
  intersectionCapacity?: number;
  /** RGBA clear color composited behind the cloud. Defaults to transparent black. */
  background?: readonly [number, number, number, number];
  /** Create a standard perspective-depth texture exposed as pass.getTextureNode("depth"). */
  outputDepth?: boolean;
  /** Encoding of reconstructed SH RGB values. The pass converts it to Three.js working-linear; canonical 3DGS PLY is sRGB. */
  colorSpace?: ColorSpace;
  /** Enable individual kernel profiling plus tile-load and subpixel coverage diagnostics. */
  profileKernels?: boolean;
  /** Select subgroup-accelerated or portable workgroup radix. Defaults to feature-based auto detection. */
  radixBackend?: RadixBackend;
}

export interface GaussianPassStats {
  visibleGaussianCount: number;
  intersectionCount: number;
  requestedIntersections: number;
  intersectionCapacity: number;
  overflow: boolean;
  /** Expensive distribution/readback metrics available with profileKernels. */
  profile: GaussianPassProfileStats | null;
}

export interface GaussianTileLoadStats {
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  tilesOver256: number;
  tilesOver512: number;
  tilesOver1024: number;
  tilesOver2048: number;
}

export interface GaussianPassProfileStats {
  tileLoads: GaussianTileLoadStats;
  zeroPixelSubpixelSplats: number;
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
  depthRadixPasses: number;
  tileRadixPasses: number;
  radixBackend: ResolvedRadixBackend;
  profileKernels: boolean;
}

/** Three.js-owned intermediate attributes reusable by other node code or wgslFn kernels. */
export interface GaussianPassResources {
  /** Gaussian results occupy the first store.count rows; camera-specific object frames use the private tail. */
  projectedMean: StorageBufferAttribute;
  projectedConic: StorageBufferAttribute;
  projectedColor: StorageBufferAttribute;
  visibleOffsets: StorageBufferAttribute;
  /** uvec2(depth key, original Gaussian id), sorted front-to-back. */
  depthSortedGaussians: StorageBufferAttribute;
  tileCounts: StorageBufferAttribute;
  depthOrderedTileCounts: StorageBufferAttribute;
  intersectionOffsets: StorageBufferAttribute;
  dispatchState: StorageBufferAttribute;
  /** uvec2(tile id, original Gaussian id), already depth ordered by stable tile sorting. */
  sortedIntersections: StorageBufferAttribute;
  tileOffsets: StorageBufferAttribute;
}

export interface KeyValueBuffers {
  recordsA: StorageBufferAttribute;
  recordsB: StorageBufferAttribute;
}

export type IntersectionBuffers = KeyValueBuffers;

export interface DispatchResources {
  state: StorageBufferAttribute;
  radixBlock: IndirectStorageBufferAttribute;
  radixReduce: IndirectStorageBufferAttribute;
  linear: IndirectStorageBufferAttribute;
}
