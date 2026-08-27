export type DepthSortMode = "float32" | "packed16";

export interface GaussianPassOptions {
  /** Exact float32 depth, or a packed 16-bit tile + 16-bit quantized depth key. */
  depthSortMode?: DepthSortMode;
  /** Maximum emitted tile/Gaussian intersections. Buffers are allocated once at this capacity. */
  intersectionCapacity?: number;
  /** RGBA clear color composited behind the cloud. Defaults to transparent black. */
  background?: readonly [number, number, number, number];
}

export interface GaussianPassStats {
  intersectionCount: number;
  requestedIntersections: number;
  intersectionCapacity: number;
  overflow: boolean;
}

export interface WebGPUBackendAccess {
  isWebGPUBackend?: boolean;
  device: GPUDevice | null;
  get(object: object): { texture?: GPUTexture };
}

export interface FloatIntersectionBuffers {
  kind: "float32";
  tileA: GPUBuffer;
  depthA: GPUBuffer;
  gaussianA: GPUBuffer;
  tileB: GPUBuffer;
  depthB: GPUBuffer;
  gaussianB: GPUBuffer;
}

export interface PackedIntersectionBuffers {
  kind: "packed16";
  keyA: GPUBuffer;
  gaussianA: GPUBuffer;
  keyB: GPUBuffer;
  gaussianB: GPUBuffer;
}

export type IntersectionBuffers =
  FloatIntersectionBuffers | PackedIntersectionBuffers;
