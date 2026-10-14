import type { GaussianDataPass } from "./GaussianDataPass";
import type { GaussianProjectionPass } from "./GaussianProjectionPass";
import type { GaussianOrderingPass } from "./GaussianOrderingPass";
import type { GaussianIntersectionPass } from "./GaussianIntersectionPass";
import type { GaussianRasterPass } from "./GaussianRasterPass";
/** Explicit connections, not an untyped list of GPU kernels. */
export interface GaussianPassComposition {
    readonly data: GaussianDataPass;
    readonly projection: GaussianProjectionPass;
    readonly ordering: GaussianOrderingPass;
    readonly intersections: GaussianIntersectionPass;
    readonly raster: GaussianRasterPass;
}
export declare function validateGaussianPassComposition(passes: GaussianPassComposition): void;
/** @internal Validate before allocating textures or subscribing to the store. */
export declare function assertGaussianPassCompositionAvailable(passes: GaussianPassComposition): void;
/** @internal Pass resources belong to a single render runtime/device. */
export declare function claimGaussianPassComposition(passes: GaussianPassComposition, owner: object): () => void;
