import { Camera, StorageBufferAttribute, Vector3 } from "three/webgpu";
export type {
  GaussianDataLoader,
  GaussianStoreAddLodOptions,
  GaussianStoreAddOptions,
  GaussianStoreCloudLodUpdate,
  GaussianStoreDefaultLodOptions,
  GaussianStoreLoadOptions,
  GaussianStoreLodBatchResult,
  GaussianStoreLodUpdate,
  GaussianStoreOptions,
  GaussianStorePackLimits,
  GaussianStorePackOptions,
  GaussianStorePackStats,
  GaussianStoreSlotRange,
} from "./legacy/GaussianStoreTypes";
import { GaussianCloud } from "./GaussianCloud";
import { GaussianData } from "./GaussianData";
import type { GaussianBackendListener } from "./legacy/GaussianBackendEvents";
import type { GaussianStoreLodUpdate, GaussianStorePackOptions, GaussianStorePackStats } from "./legacy/GaussianStoreTypes";
import { GaussianRaycastIndex } from "./GaussianRaycastIndex";
import { markSlotRangesUpdated } from "./utils/slotRanges";
import { GaussianStoreAttributes, enableGaussianStoreAttribute, disposeGaussianStoreAttributes } from "./store-attributes/GaussianStoreAttributes";
import { replaceGaussianStoreAttribute, updateGaussianStoreAttribute, type GaussianStorePackedAttribute } from "./store-attributes/GaussianStorePackedAttribute";
import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { CloudLoadOptions } from "../streaming-backend/CloudLoadOptions";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { PackingStrategy } from "../streaming-backend/PackingStrategy";
import type { BackendEvent } from "../streaming-backend/events/BackendEvent";
import type { PackedAttributeBuffer } from "../streaming-backend/PackedAttributeBuffer";
import { WorkerStreamingGaussianBackend } from "../streaming-backend-worker/WorkerStreamingGaussianBackend";
import type { GaussianRenderStore } from "./GaussianRenderStore";

interface ClientCloud {
  cloud: GaussianCloud;
  sourceCount: number;
  bounds: readonly [number, number, number, number, number, number];
  priority: number;
  sourceVersion: number;
  packingStrategy?: PackingStrategy;
}
interface PendingCloud {
  resolve: (cloud: GaussianCloud) => void;
  reject: (error: Error) => void;
  options: CloudLoadOptions;
}
export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  frontend: {
    maxStorageBufferBindingSize: 128 * 1024 * 1024,
    maxBufferSize: 256 * 1024 * 1024,
    maxStorageBuffersPerShaderStage: 8,
    supportsPartialBufferUpdates: true,
  },
  maxGaussians: "auto",
};

/**
 * Main-thread client of a message backend. GPU attributes and full raycast
 * snapshots belong here; parsing, tree building and LOD selection do not.
 */
export class GaussianStore implements GaussianRenderStore {
  readonly attributes = new GaussianStoreAttributes();
  readonly backend: GaussianBackend;
  readonly packedShFormat = "rgb8e8" as const;
  readonly maxGaussiansOption: number | "auto" = "auto";
  private readonly cloudMap = new Map<string, ClientCloud>();
  private readonly cloudIds = new Map<GaussianCloud, string>();
  private readonly pendingLoads = new Map<string, PendingCloud>();
  private readonly listeners = new Set<GaussianBackendListener>();
  private readonly schemas = new Map<string, PackedAttributeBuffer>();
  private readonly extraBuffers = new Map<string, StorageBufferAttribute>();
  private readonly unsubscribe: () => void;
  private data: GaussianData | null = null;
  private revision = 0;
  private commandNumber = 0;
  private cloudNumber = 0;
  private lastView = "";
  private lastError: Error | null = null;
  private capacity = 0;
  private packedObjectCapacity = 0;
  private packedDegree: 0 | 1 | 2 | 3 = 0;
  private packedVersion = 0;
  private packedLayoutVersion = 0;
  private pendingLod = false;
  private packStats: GaussianStorePackStats | null = null;
  private disposed = false;
  private awaitingLayout = false;

  constructor(backend: GaussianBackend = new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG)) {
    this.backend = backend;
    this.unsubscribe = backend.subscribe(this.handleEvent);
  }

  get clouds(): readonly GaussianCloud[] {
    return [...this.cloudMap.values()].map(({ cloud }) => cloud);
  }
  get count(): number {
    return this.clouds.reduce((sum, cloud) => sum + cloud.gaussianCount, 0);
  }
  get shDegree(): 0 | 1 | 2 | 3 { return this.packedDegree; }
  get maxGaussians(): number { return this.capacity; }
  get objectCapacity(): number { return this.packedObjectCapacity; }
  get layoutVersion(): number { return this.packedLayoutVersion; }
  get contentVersion(): number { return this.packedVersion; }
  get needsPack(): boolean { return false; }
  get hasPackedData(): boolean { return this.data !== null && !this.awaitingLayout; }
  get lastPackStats(): GaussianStorePackStats | null { return this.packStats; }

  subscribe(listener: GaussianBackendListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async load(url: string, options: CloudLoadOptions = {}): Promise<GaussianCloud> {
    const resolvedUrl = typeof document === "undefined"
      ? url : new URL(url, document.baseURI).href;
    const id = this.nextCommandId();
    const cloudId = this.nextCloudId();
    const result = this.awaitLoad(id, options);
    this.awaitingLayout = true;
    this.backend.dispatch({ type: "load-cloud", id, cloudId, url: resolvedUrl, options });
    return result;
  }

  async loadBuffer(buffer: ArrayBuffer, options: CloudLoadOptions = {}): Promise<GaussianCloud> {
    const id = this.nextCommandId();
    const cloudId = this.nextCloudId();
    const result = this.awaitLoad(id, options);
    this.awaitingLayout = true;
    this.backend.dispatch({ type: "load-cloud-from-buffer", id, cloudId, buffer, options });
    return result;
  }

  remove(cloud: GaussianCloud): void {
    const id = this.cloudIds.get(cloud);
    if (id === undefined) return;
    this.cloudMap.delete(id);
    this.cloudIds.delete(cloud);
    cloud.setRaycastIndex(null);
    cloud.removeFromParent();
    this.awaitingLayout = true;
    this.notify("clouds");
    this.backend.dispatch({ type: "unload-cloud", id: this.nextCommandId(), cloudId: id });
  }

  updatePackingPriority(cloud: GaussianCloud, priority: number): void {
    if (!Number.isSafeInteger(priority)) throw new RangeError("Priority must be a safe integer");
    const id = this.requireId(cloud);
    this.cloudMap.get(id)!.priority = priority;
    cloud.updatePackingPriority(priority);
    this.awaitingLayout = true;
    this.backend.dispatch({ type: "set-cloud-priority", id: this.nextCommandId(), cloudId: id, priority });
  }

  setCloudPacking(cloud: GaussianCloud, packingStrategy: PackingStrategy): void {
    const cloudId = this.requireId(cloud);
    this.cloudMap.get(cloudId)!.packingStrategy = packingStrategy;
    this.awaitingLayout = true;
    this.backend.dispatch({
      type: "set-cloud-packing", id: this.nextCommandId(), cloudId, packingStrategy,
    });
  }

  setCloudRaycastable(cloud: GaussianCloud, raycastable: boolean): void {
    const cloudId = this.requireId(cloud);
    if (!raycastable) cloud.setRaycastIndex(null);
    this.backend.dispatch({
      type: "set-cloud-raycastable", id: this.nextCommandId(), cloudId, raycastable,
    });
  }

  writeAttributeRange(
    cloud: GaussianCloud, attribute: string, firstGaussian: number,
    gaussianCount: number, data: ArrayBuffer,
  ): void {
    this.backend.dispatch({
      type: "write-attribute-range", id: this.nextCommandId(),
      cloudId: this.requireId(cloud), attribute, firstGaussian, gaussianCount, data,
    });
  }

  invalidateCloudPacking(cloud: GaussianCloud): void {
    const cloudId = this.requireId(cloud);
    const strategy = this.cloudMap.get(cloudId)!.packingStrategy;
    if (strategy) this.setCloudPacking(cloud, strategy);
  }

  enablePackedLodLevelAttribute(): GaussianStorePackedAttribute {
    return this.attributes.get("lodLevel") ??
      this.attributes[enableGaussianStoreAttribute]("lodLevel", "u32");
  }

  getPackedAttribute(name: string): StorageBufferAttribute | undefined {
    return name === "lodLevel"
      ? this.attributes.get(name)?.bufferAttribute
      : this.extraBuffers.get(name);
  }

  pack(_options: GaussianStorePackOptions): void {
    // The backend responds to commands and sends buffers without a frame request.
  }

  updateLod(camera: Camera): GaussianStoreLodUpdate {
    if (this.disposed) return { appliedBatches: 0, pending: false, clouds: [] };
    camera.updateWorldMatrix(true, false);
    const position = camera.getWorldPosition(new Vector3());
    const transforms = this.clouds.map((cloud) => {
      cloud.updateWorldMatrix(true, false);
      return [this.requireId(cloud), ...cloud.matrixWorld.elements] as const;
    });
    const key = JSON.stringify([position.toArray(), transforms]);
    if (key !== this.lastView) {
      this.lastView = key;
      const sceneRevision = ++this.revision;
      for (const [cloudId, ...worldMatrix] of transforms) {
        this.backend.dispatch({
          type: "set-cloud-transform", id: this.nextCommandId(),
          cloudId: cloudId as string, sceneRevision, worldMatrix: worldMatrix as number[],
        });
      }
      this.backend.dispatch({
        type: "set-camera", id: this.nextCommandId(), sceneRevision,
        position: [position.x, position.y, position.z],
      });
    }
    return {
      appliedBatches: 0,
      pending: this.pendingLod,
      clouds: this.clouds.map((cloud) => ({
        cloud,
        focusDistance: position.distanceTo(cloud.getWorldPosition(new Vector3())),
        applied: false,
        pending: this.pendingLod,
        targetStats: { planningMs: 0, roundTripMs: 0,
          discardedResults: 0, pending: this.pendingLod },
      })),
    };
  }

  getPackedData(): GaussianData {
    if (this.lastError) throw this.lastError;
    if (!this.data || this.awaitingLayout) throw new Error("Gaussian buffers are not ready");
    return this.data;
  }

  getBounds(cloud: GaussianCloud): readonly [number, number, number, number, number, number] {
    return this.cloudMap.get(this.requireId(cloud))!.bounds;
  }
  getSourceCount(cloud: GaussianCloud): number {
    return this.cloudMap.get(this.requireId(cloud))!.sourceCount;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe();
    this.backend.dispose();
    for (const pending of this.pendingLoads.values())
      pending.reject(new Error("GaussianStore disposed"));
    this.pendingLoads.clear();
    for (const { cloud } of this.cloudMap.values()) {
      cloud.setRaycastIndex(null);
      cloud.removeFromParent();
    }
    this.cloudMap.clear();
    this.data?.dispose();
    this.data = null;
    for (const buffer of this.extraBuffers.values()) buffer.dispose();
    this.extraBuffers.clear();
    this.attributes[disposeGaussianStoreAttributes]();
    this.listeners.clear();
  }

  private readonly handleEvent = (event: BackendEvent): void => {
    if (this.disposed) return;
    switch (event.type) {
      case "cloud-loaded": {
        const options = this.pendingLoads.get(event.commandId)?.options ?? {};
        const priority = options.priority ?? 0;
        const cloud = new GaussianCloud(this, event.objectId, 0,
          options.name ?? event.cloudId, null, null, priority);
        cloud.raycastMode = "full";
        if (event.raycast) cloud.setRaycastIndex(new GaussianRaycastIndex(event.raycast));
        this.cloudMap.set(event.cloudId, {
          cloud, sourceCount: event.sourceCount, bounds: event.bounds,
          priority, sourceVersion: 1,
          packingStrategy: options.packingStrategy,
        });
        this.cloudIds.set(cloud, event.cloudId);
        this.pendingLoads.get(event.commandId)?.resolve(cloud);
        this.pendingLoads.delete(event.commandId);
        this.lastView = "";
        this.notify("clouds");
        break;
      }
      case "cloud-unloaded": break;
      case "cloud-raycast-changed": {
        const item = this.cloudMap.get(event.cloudId);
        if (item)
          item.cloud.setRaycastIndex(event.raycast
            ? new GaussianRaycastIndex(event.raycast) : null);
        break;
      }
      case "raycast-replaced": {
        const item = this.cloudMap.get(event.cloudId);
        if (item && event.sourceVersion > item.sourceVersion) {
          item.sourceVersion = event.sourceVersion;
          item.bounds = event.bounds;
          item.cloud.setRaycastIndex(new GaussianRaycastIndex(event.raycast));
        }
        break;
      }
      case "buffers-replaced":
        this.replace(event);
        break;
      case "buffers-patched":
        this.patch(event);
        break;
      case "error": {
        const error = new Error(event.message);
        if (event.commandId && this.pendingLoads.has(event.commandId)) {
          this.pendingLoads.get(event.commandId)!.reject(error);
          this.pendingLoads.delete(event.commandId);
          this.awaitingLayout = false;
        } else this.lastError = error;
        this.notify("content");
        break;
      }
      case "command-cancelled":
        this.pendingLoads.get(event.commandId)?.reject(new Error("Load cancelled"));
        this.pendingLoads.delete(event.commandId);
        this.awaitingLayout = false;
        break;
      case "command-completed": break;
    }
  };

  private replace(event: Extract<BackendEvent, { type: "buffers-replaced" }>): void {
    if (event.layoutVersion <= this.packedLayoutVersion) return;
    const lookup = new Map(event.attributes.map((attribute) => [attribute.name, attribute]));
    const required = (name: string): PackedAttributeBuffer => {
      const result = lookup.get(name);
      if (!result) throw new Error(`Missing backend attribute: ${name}`);
      return result;
    };
    const previous = this.data;
    this.data = event.clouds.length > 0
      ? new GaussianData({
          means: floatAttribute("means", required("means").data),
          scalesOpacity: floatAttribute("scalesOpacity", required("scalesOpacity").data),
          rotations: floatAttribute("rotations", required("rotations").data),
          shCoefficients: uintAttribute("shCoefficients", required("shCoefficients").data),
        }, {
          count: event.capacity, shDegree: event.shDegree,
          shFormat: "rgb8e8", ownsBuffers: true,
        })
      : null;
    previous?.dispose();
    this.schemas.clear();
    for (const attribute of event.attributes) this.schemas.set(attribute.name, attribute);
    for (const buffer of this.extraBuffers.values()) buffer.dispose();
    this.extraBuffers.clear();
    for (const attribute of event.attributes) {
      if (attribute.name === "lodLevel") {
        this.enablePackedLodLevelAttribute()[replaceGaussianStoreAttribute](
          new Uint32Array(attribute.data));
      } else if (!["means", "scalesOpacity", "rotations", "shCoefficients"].includes(attribute.name)) {
        this.extraBuffers.set(attribute.name,
          attribute.format === "f32"
            ? floatAttribute(attribute.name, attribute.data, attribute.elementsPerGaussian)
            : uintAttribute(attribute.name, attribute.data, attribute.elementsPerGaussian));
      }
    }
    this.applyCloudStates(event.clouds);
    this.capacity = event.capacity;
    this.packedObjectCapacity = event.objectCapacity;
    this.packedDegree = event.shDegree;
    this.packedLayoutVersion = event.layoutVersion;
    this.packedVersion = event.contentVersion;
    this.pendingLod = false;
    this.packStats = {
      fullRebuild: true, slotCapacity: event.capacity,
      activeGaussians: event.count, reusedSlots: 0,
      writtenSlots: event.count, clearedSlots: 0,
      estimatedUploadBytes: event.attributes.reduce((sum, item) => sum + item.data.byteLength, 0),
      writtenSlotRanges: event.count ? [{ start: 0, count: event.count }] : [],
      clearedSlotRanges: [], planningMs: 0, slotUpdateMs: 0,
    };
    this.awaitingLayout = false;
    this.lastView = "";
    this.notify("layout");
  }

  private patch(event: Extract<BackendEvent, { type: "buffers-patched" }>): void {
    if (event.layoutVersion !== this.packedLayoutVersion ||
      event.baseContentVersion !== this.packedVersion) return;
    for (const patch of event.patches) {
      const schema = this.schemas.get(patch.name);
      if (!schema) continue;
      const array = this.attributeArray(patch.name);
      if (!array) continue;
      const start = patch.firstSlot * schema.elementsPerGaussian;
      const incoming = schema.format === "f32"
        ? new Float32Array(patch.data) : new Uint32Array(patch.data);
      array.set(incoming, start);
      if (patch.name === "lodLevel")
        this.enablePackedLodLevelAttribute()[updateGaussianStoreAttribute]([
          { start: patch.firstSlot, count: patch.slotCount },
        ]);
      else {
        const gpu = this.getPackedAttribute(patch.name) ??
          (this.data?.[patch.name as keyof GaussianData] as StorageBufferAttribute | undefined);
        if (gpu) markSlotRangesUpdated(gpu, [
          { start: patch.firstSlot, count: patch.slotCount },
        ], schema.elementsPerGaussian);
      }
    }
    this.applyCloudStates(event.changedClouds);
    this.packedVersion = event.contentVersion;
    this.pendingLod = event.lodPending;
    const ranges = event.patches.map((item) => ({ start: item.firstSlot, count: item.slotCount }));
    const touched = new Set<number>();
    for (const range of ranges)
      for (let i = range.start; i < range.start + range.count; i++) touched.add(i);
    const active = event.changedClouds.reduce((sum, state) => sum + state.renderedCount, 0);
    this.packStats = {
      fullRebuild: false, slotCapacity: this.capacity, activeGaussians: active,
      reusedSlots: Math.max(0, active - touched.size), writtenSlots: touched.size,
      clearedSlots: 0,
      estimatedUploadBytes: event.patches.reduce((sum, item) => sum + item.data.byteLength, 0),
      writtenSlotRanges: ranges, clearedSlotRanges: [], planningMs: 0, slotUpdateMs: 0,
    };
    this.notify("content");
  }

  private attributeArray(name: string): Float32Array | Uint32Array | null {
    if (name === "lodLevel") return this.enablePackedLodLevelAttribute().array;
    if (name === "means") return this.data?.means.array as Float32Array ?? null;
    if (name === "scalesOpacity") return this.data?.scalesOpacity.array as Float32Array ?? null;
    if (name === "rotations") return this.data?.rotations.array as Float32Array ?? null;
    if (name === "shCoefficients") return this.data?.shCoefficients.array as Uint32Array ?? null;
    return this.extraBuffers.get(name)?.array as Float32Array | Uint32Array ?? null;
  }

  private applyCloudStates(states: readonly { cloudId: string; renderedCount: number }[]): void {
    for (const state of states)
      this.cloudMap.get(state.cloudId)?.cloud.updatePacking(state.renderedCount, null);
  }
  private notify(reason: "clouds" | "layout" | "content"): void {
    for (const listener of this.listeners) listener({ type: "changed", reason });
  }
  private nextCloudId(): string { return `cloud-${++this.cloudNumber}`; }
  private nextCommandId(): string { return `command-${++this.commandNumber}`; }
  private requireId(cloud: GaussianCloud): string {
    const id = this.cloudIds.get(cloud);
    if (!id) throw new Error("Cloud does not belong to this GaussianStore");
    return id;
  }
  private awaitLoad(id: string, options: CloudLoadOptions): Promise<GaussianCloud> {
    return new Promise((resolve, reject) => this.pendingLoads.set(id, { resolve, reject, options }));
  }
}

function floatAttribute(name: string, buffer: ArrayBuffer, size = 4): StorageBufferAttribute {
  const attribute = new StorageBufferAttribute(new Float32Array(buffer), size);
  attribute.name = `3dgs.store.${name}`;
  return attribute;
}
function uintAttribute(name: string, buffer: ArrayBuffer, size = 1): StorageBufferAttribute {
  const attribute = new StorageBufferAttribute(new Uint32Array(buffer), size);
  attribute.name = `3dgs.store.${name}`;
  return attribute;
}
