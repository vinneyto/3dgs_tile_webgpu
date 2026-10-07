import { StorageBufferAttribute } from "three/webgpu";
import type { GaussianShFormat } from "../streaming-backend-impl/GaussianSh";
export interface ActiveSlotRange {
    start: number;
    count: number;
}
export interface GaussianBuffers {
    /** vec4<f32> per Gaussian. xyz is the local-space mean; w holds objectId for occupied slots, or -1 for an unoccupied slot. */
    means: StorageBufferAttribute;
    /** vec4<f32> per Gaussian. xyz is positive linear scale; w is opacity in [0, 1]. */
    scalesOpacity: StorageBufferAttribute;
    /** vec4<f32> per Gaussian, normalized quaternion in xyzw order. */
    rotations: StorageBufferAttribute;
    /** SH coefficients in the representation selected by GaussianDataOptions.shFormat. */
    shCoefficients: StorageBufferAttribute;
}
export interface GaussianDataOptions {
    count: number;
    /** Omit to draw the dense identity slot range. */
    activeSlots?: Uint32Array;
    /** Canonical real spherical-harmonic degree. Supported values are 0 through 3. */
    shDegree?: 0 | 1 | 2 | 3;
    /** float32 uses vec4<f32>; rgb8e8 uses one packed u32 per RGB coefficient. Defaults to float32. */
    shFormat?: GaussianShFormat;
    /** Dispose the supplied Three.js attributes with this object. Defaults to false. */
    ownsBuffers?: boolean;
}
/**
 * Gaussian storage expressed as normal Three.js storage attributes. Parsing and
 * source-format activation deliberately live outside the renderer. The same
 * attributes can be consumed by node materials, wgslFn compute nodes, or geometries.
 */
export declare class GaussianData {
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly shCoefficientCount: number;
    readonly shFormat: GaussianShFormat;
    readonly means: StorageBufferAttribute;
    readonly scalesOpacity: StorageBufferAttribute;
    readonly rotations: StorageBufferAttribute;
    readonly shCoefficients: StorageBufferAttribute;
    /** Compact CPU draw list, mirrored in the SH buffer's reserved tail. */
    private activeValues;
    private activeOrdinals;
    private stagedValues;
    private stagedOrdinals;
    private staging;
    private stagedCount;
    private firstChanged;
    private lastChanged;
    activeCount: number;
    activeVersion: number;
    private readonly activeListeners;
    private readonly ownsShBuffer;
    get activeSlots(): Uint32Array | null;
    private readonly ownsBuffers;
    private disposed;
    constructor(buffers: GaussianBuffers, options: GaussianDataOptions);
    /** Prepare the back list incrementally; commit swaps typed arrays in O(1). */
    stageActivation(added: Uint32Array, removed: Uint32Array, commit: boolean): void;
    subscribeActiveSlots(listener: (range: ActiveSlotRange) => void): () => void;
    dispose(): void;
    private validateVec4Attribute;
    private validateShAttribute;
}
