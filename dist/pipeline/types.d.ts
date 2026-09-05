import type { ColorSpace, IndirectStorageBufferAttribute, StorageBufferAttribute } from "three/webgpu";
import type { GaussianStoreLodUpdate, GaussianStorePackStats } from "../GaussianStore";
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
    /** Optional per-tile raster sample budget. Disabled by default. Intersections are still emitted and sorted. */
    maxRasterizedSplatsPerTile?: number | null;
    /**
     * Maximum samples evaluated by one raster workgroup. Heavier tiles are split
     * into exact depth-ordered chunks and composited in a second pass. Defaults
     * to 8192; pass null to retain the single-workgroup path for every tile.
     */
    rasterChunkSize?: number | null;
    /** Cull subpixel Gaussians whose alpha support contains no pixel center. Defaults to true. */
    subpixelSampleCulling?: boolean;
    /** Select subgroup-accelerated or portable workgroup radix. Defaults to feature-based auto detection. */
    radixBackend?: RadixBackend;
}
export interface GaussianPassDebugSnapshot {
    readonly pass: GaussianPassDebugInfo;
    readonly storePack: GaussianStorePackStats | null;
    readonly lod: GaussianStoreLodUpdate;
}
export type GaussianPassDebugListener = (snapshot: GaussianPassDebugSnapshot) => void;
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
    /** Number of 256-splat outer-loop iterations summed over all tiles. */
    totalBatches: number;
    /** Longest 256-splat outer loop executed by a single tile. */
    maxBatches: number;
}
export interface GaussianTileCapStats {
    cap: number;
    rasterizedIntersections: number;
    droppedIntersections: number;
    droppedFraction: number;
    affectedTiles: number;
    totalBatches: number;
    maxBatches: number;
}
export interface GaussianPassProfileStats {
    /** Actual pixel/Gaussian work, including all independently executed chunks.
     * Pixels counts in-bounds pixels in nonempty tiles, once after composition.
     * AlphaStopped counts those pixels whose final T is below 1e-4, before background.
     */
    rasterWork?: {
        checked: number;
        blended: number;
        pixels: number;
        alphaStopped: number;
    } | null;
    tileLoads: GaussianTileLoadStats;
    /** What the configured raster-only cap did to this frame, or null when disabled. */
    appliedTileCap: GaussianTileCapStats | null;
    /** Counterfactual raster work at the standard diagnostic caps. */
    tileCapEstimates: readonly GaussianTileCapStats[];
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
    maxRasterizedSplatsPerTile: number | null;
    rasterChunkSize: number | null;
    subpixelSampleCulling: boolean;
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
