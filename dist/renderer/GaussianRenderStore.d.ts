import type { Camera } from "three/webgpu";
import type { FrontendCapabilities } from "../streaming-backend/BackendConfig";
import type { GaussianCloud } from "./GaussianCloud";
import type { GaussianData } from "./GaussianData";
import type { GaussianStoreListener } from "./GaussianStoreEvents";
import type { GaussianStoreAttributes } from "./store-attributes/GaussianStoreAttributes";
import type { GaussianStorePackedAttribute } from "./store-attributes/GaussianStorePackedAttribute";
import type { GaussianStoreLodUpdate, GaussianStorePackStats } from "./GaussianStoreTypes";
/** Synchronous renderer-facing view maintained by GaussianStore. */
export interface GaussianRenderStore {
    readonly attributes: GaussianStoreAttributes;
    readonly layoutVersion: number;
    readonly contentVersion: number;
    readonly maxGaussians: number;
    readonly objectCapacity: number;
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly clouds: readonly GaussianCloud[];
    readonly hasPackedData: boolean;
    readonly lastPackStats: GaussianStorePackStats | null;
    subscribe(listener: GaussianStoreListener): () => void;
    enablePackedLodLevelAttribute(): GaussianStorePackedAttribute;
    updateLod(camera: Camera, frontend: FrontendCapabilities): GaussianStoreLodUpdate;
    getPackedData(): GaussianData;
}
