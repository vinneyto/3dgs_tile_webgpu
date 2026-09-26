import type { Camera } from "three/webgpu";
import type { GaussianCloud } from "./GaussianCloud";
import type { GaussianData } from "./GaussianData";
import type { GaussianBackendListener } from "./legacy/GaussianBackendEvents";
import type { GaussianStoreAttributes } from "./store-attributes/GaussianStoreAttributes";
import type { GaussianStorePackedAttribute } from "./store-attributes/GaussianStorePackedAttribute";
import type {
  GaussianStoreLodUpdate, GaussianStorePackOptions, GaussianStorePackStats,
} from "./legacy/GaussianStoreTypes";

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
  readonly needsPack: boolean;
  readonly hasPackedData: boolean;
  readonly lastPackStats: GaussianStorePackStats | null;
  subscribe(listener: GaussianBackendListener): () => void;
  enablePackedLodLevelAttribute(): GaussianStorePackedAttribute;
  pack(options: GaussianStorePackOptions): void;
  updateLod(camera: Camera): GaussianStoreLodUpdate;
  getPackedData(): GaussianData;
}
