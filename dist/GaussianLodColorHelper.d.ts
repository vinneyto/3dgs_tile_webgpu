import { type ColorRepresentation } from "three/webgpu";
import type { GaussianPass } from "./GaussianPass";
import type { GaussianStorePackedAttribute } from "./store-attributes";
export interface GaussianLodColorHelperOptions {
    /** Coarsest-to-finest colors. Extra LOD levels cycle the palette. */
    colors?: readonly ColorRepresentation[];
    /** Amount of LOD tint mixed into the rendered Gaussian color. Defaults to 0.45. */
    tintStrength?: number;
    /** Defaults to true. */
    enabled?: boolean;
}
/** Tints GaussianPass raster color with a packed current-LOD debug palette. */
export declare class GaussianLodColorHelper {
    readonly pass: GaussianPass;
    readonly isGaussianLodColorHelper = true;
    readonly lodLevelAttribute: GaussianStorePackedAttribute;
    readonly tintStrength: number;
    private readonly colors;
    private baseColorNode;
    private helperColorNode;
    private boundBuffer;
    private readonly unsubscribeDebug;
    private active;
    private disposed;
    constructor(pass: GaussianPass, options?: GaussianLodColorHelperOptions);
    get enabled(): boolean;
    set enabled(value: boolean);
    /** Refresh after store.pack(); only a replaced backing buffer rebuilds the node. */
    update(): void;
    dispose(): void;
    private rebuildColorNode;
    private assertUsable;
}
