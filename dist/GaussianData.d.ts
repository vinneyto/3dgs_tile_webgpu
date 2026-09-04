import type { StorageBufferAttribute } from "three/webgpu";
import type { GaussianShFormat } from "./GaussianSh";
export interface GaussianBuffers {
    /** vec4<f32> per Gaussian. xyz is the local-space mean; GaussianStore writes objectId to w. */
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
    private readonly ownsBuffers;
    private disposed;
    constructor(buffers: GaussianBuffers, options: GaussianDataOptions);
    dispose(): void;
    private validateVec4Attribute;
    private validateShAttribute;
}
