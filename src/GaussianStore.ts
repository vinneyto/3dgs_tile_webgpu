import type { Camera } from "three/webgpu";
import type { GaussianCloud } from "./GaussianCloud";
import type { GaussianData } from "./GaussianData";
import type { GaussianLod } from "./GaussianLod";
import type { GaussianBackend } from "./GaussianBackend";
import type { GaussianBackendListener } from "./GaussianBackendEvents";
import { WorkerGaussianBackend } from "./data-backend/WorkerGaussianBackend";
import type {
  GaussianStoreAddLodOptions,
  GaussianStoreAddOptions,
  GaussianStoreLoadOptions,
  GaussianStorePackOptions,
} from "./GaussianStoreTypes";

export type {
  GaussianDataLoader,
  GaussianStoreAddLodOptions,
  GaussianStoreAddOptions,
  GaussianStoreCloudLodUpdate,
  GaussianStoreDefaultLodOptions,
  GaussianStoreLoadOptions,
  GaussianStoreLodBatchResult,
  GaussianStoreLodUpdate,
  GaussianStorePackLimits,
  GaussianStorePackOptions,
  GaussianStorePackStats,
  GaussianStoreSlotRange,
} from "./GaussianStoreTypes";

export type { GaussianStoreOptions } from "./GaussianStoreTypes";

/** Scene/renderer client of a replaceable Gaussian computation backend. */
export class GaussianStore {
  readonly backend: GaussianBackend;

  constructor(backend: GaussianBackend = new WorkerGaussianBackend()) {
    this.backend = backend;
  }

  get attributes() {
    return this.backend.attributes;
  }
  get maxGaussiansOption() {
    return this.backend.maxGaussiansOption;
  }
  get packedShFormat() {
    return this.backend.packedShFormat;
  }
  get layoutVersion() {
    return this.backend.layoutVersion;
  }
  get contentVersion() {
    return this.backend.contentVersion;
  }
  get maxGaussians() {
    return this.backend.maxGaussians;
  }
  get objectCapacity() {
    return this.backend.objectCapacity;
  }
  get count() {
    return this.backend.count;
  }
  get shDegree() {
    return this.backend.shDegree;
  }
  get clouds() {
    return this.backend.clouds;
  }
  get needsPack() {
    return this.backend.needsPack;
  }
  get hasPackedData() {
    return this.backend.hasPackedData;
  }
  get lastPackStats() {
    return this.backend.lastPackStats;
  }

  subscribe(listener: GaussianBackendListener): () => void {
    return this.backend.subscribe(listener);
  }
  load(
    url: string,
    options?: GaussianStoreLoadOptions,
  ): Promise<GaussianCloud> {
    return this.backend.load(url, options);
  }
  loadBuffer(
    buffer: ArrayBuffer,
    options?: GaussianStoreLoadOptions,
  ): Promise<GaussianCloud> {
    return this.backend.loadBuffer(buffer, options);
  }
  add(data: GaussianData, options?: GaussianStoreAddOptions): GaussianCloud {
    return this.backend.add(data, options);
  }
  addLod(
    lod: GaussianLod,
    options?: GaussianStoreAddLodOptions,
  ): GaussianCloud {
    return this.backend.addLod(lod, options);
  }
  remove(cloud: GaussianCloud): void {
    this.backend.remove(cloud);
  }
  updatePackingPriority(cloud: GaussianCloud, priority: number): void {
    this.backend.updatePackingPriority(cloud, priority);
  }
  invalidateCloudPacking(cloud: GaussianCloud): void {
    this.backend.invalidateCloudPacking(cloud);
  }
  enablePackedLodLevelAttribute() {
    return this.backend.enablePackedLodLevelAttribute();
  }
  pack(options: GaussianStorePackOptions): void {
    this.backend.pack(options);
  }
  packLodBatch(cloud: GaussianCloud) {
    return this.backend.packLodBatch(cloud);
  }
  updateLod(camera: Camera) {
    return this.backend.updateLod(camera);
  }
  getPackedData(): GaussianData {
    return this.backend.getPackedData();
  }
  getBounds(cloud: GaussianCloud) {
    return this.backend.getBounds(cloud);
  }
  getSourceCount(cloud: GaussianCloud) {
    return this.backend.getSourceCount(cloud);
  }
  dispose(): void {
    this.backend.dispose();
  }
}
