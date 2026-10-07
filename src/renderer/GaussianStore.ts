import { Camera, StorageBufferAttribute, Vector3 } from "three/webgpu";
export type {
  GaussianStoreCloudLodUpdate,
  GaussianStoreLodUpdate,
  GaussianStorePackStats,
  GaussianStoreSlotRange,
} from "./GaussianStoreTypes";
import { GaussianCloud } from "./GaussianCloud";
import { GaussianData } from "./GaussianData";
import type { GaussianStoreListener } from "./GaussianStoreEvents";
import type {
  GaussianStoreLodUpdate,
  GaussianStorePackStats,
} from "./GaussianStoreTypes";
import { GaussianRaycastIndex } from "./GaussianRaycastIndex";
import { markSlotRangesUpdated, mergeSlotRanges } from "./utils/slotRanges";
import {
  GaussianStoreAttributes,
  enableGaussianStoreAttribute,
  disposeGaussianStoreAttributes,
} from "./store-attributes/GaussianStoreAttributes";
import {
  replaceGaussianStoreAttribute,
  updateGaussianStoreAttribute,
  type GaussianStorePackedAttribute,
} from "./store-attributes/GaussianStorePackedAttribute";
import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { FrontendCapabilities } from "../streaming-backend/FrontendCapabilities";
import type { CloudLoadOptions } from "../streaming-backend/CloudLoadOptions";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { MipmapConfig } from "../streaming-backend/MipmapConfig";
import type {
  BackendPayload,
  BackendResponse,
  BackendFailure,
} from "../streaming-backend/BackendResponse";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import {
  SerialRequestScheduler,
  type RequestScheduler,
} from "../streaming-backend/RequestScheduler";
import {
  createLoadCloudCommand,
  createLoadCloudFromBufferCommand,
  createUnloadCloudCommand,
  createSetCloudPriorityCommand,
  createSetCloudMipmapsCommand,
  createWriteAttributeRangeCommand,
  createSetCloudTransformCommand,
  createSetCameraCommand,
  createSetFrontendCapabilitiesCommand,
} from "../streaming-backend/commands/createCommands";
import type { PackedAttributeBuffer } from "../streaming-backend/PackedAttributeBuffer";
import { WorkerWasmGaussianBackend } from "../wasm-backend/WorkerWasmGaussianBackend";
import type { GaussianRenderStore } from "./GaussianRenderStore";

interface ClientCloud {
  cloud: GaussianCloud;
  sourceCount: number;
  bounds: readonly [number, number, number, number, number, number];
  sourceVersion: number;
  snapshotVersion: number;
  mipmaps?: MipmapConfig;
}
interface PendingCloud {
  resolve: (cloud: GaussianCloud) => void;
  reject: (error: Error) => void;
  options: CloudLoadOptions;
  cleanup: () => void;
}
export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  defaultMipmaps: { type: "standard" },
};

/**
 * Main-thread client of a message backend. GPU attributes and full raycast
 * snapshots belong here; parsing, tree building and LOD selection do not.
 */
export class GaussianStore implements GaussianRenderStore {
  readonly attributes = new GaussianStoreAttributes();
  readonly scheduler: RequestScheduler;
  readonly packedShFormat = "rgb8e8" as const;
  private readonly cloudMap = new Map<string, ClientCloud>();
  private readonly cloudIds = new Map<GaussianCloud, string>();
  private readonly pendingLoads = new Map<string, PendingCloud>();
  private readonly abortedLoads = new Set<string>();
  private readonly capabilitiesAcknowledged = new Map<string, boolean>();
  private readonly listeners = new Set<GaussianStoreListener>();
  private readonly schemas = new Map<string, PackedAttributeBuffer>();
  private readonly extraBuffers = new Map<string, StorageBufferAttribute>();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeFailure: () => void;
  private data: GaussianData | null = null;
  private revision = 0;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private lastCameraView = "";
  private readonly lastCloudTransforms = new Map<string, string>();
  private lastError: Error | null = null;
  private commandError: Error | null = null;
  private capacity = 0;
  private packedObjectCapacity = 0;
  private packedDegree: 0 | 1 | 2 | 3 = 0;
  private packedVersion = 0;
  private packedLayoutVersion = 0;
  private pendingLod = false;
  private lastRoundTripMs = 0;
  private packStats: GaussianStorePackStats | null = null;
  private disposed = false;
  private awaitingCapabilities = false;
  private frontendCapabilities: FrontendCapabilities | null = null;

  constructor(
    schedulerOrBackend:
      RequestScheduler | GaussianBackend = new SerialRequestScheduler(
      new WorkerWasmGaussianBackend(DEFAULT_BACKEND_CONFIG),
    ),
  ) {
    // Accept an existing backend for applications that provide a debug transport.
    this.scheduler =
      "schedule" in schedulerOrBackend
        ? schedulerOrBackend
        : new SerialRequestScheduler(schedulerOrBackend);
    this.unsubscribe = this.scheduler.onResponse(this.handleResponse);
    this.unsubscribeFailure = this.scheduler.onFailure(this.handleFailure);
    this.scheduler.start();
  }

  get clouds(): readonly GaussianCloud[] {
    return [...this.cloudMap.values()].map(({ cloud }) => cloud);
  }
  get count(): number {
    return this.clouds.reduce((sum, cloud) => sum + cloud.gaussianCount, 0);
  }
  get shDegree(): 0 | 1 | 2 | 3 {
    return this.packedDegree;
  }
  get maxGaussians(): number {
    return this.capacity;
  }
  get objectCapacity(): number {
    return this.packedObjectCapacity;
  }
  get layoutVersion(): number {
    return this.packedLayoutVersion;
  }
  get contentVersion(): number {
    return this.packedVersion;
  }
  get hasPackedData(): boolean {
    return this.data !== null && !this.awaitingCapabilities;
  }
  get lastPackStats(): GaussianStorePackStats | null {
    return this.packStats;
  }
  get lastCommandError(): Error | null {
    return this.commandError;
  }

  subscribe(listener: GaussianStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async load(
    url: string,
    options: CloudLoadOptions = {},
    signal?: AbortSignal,
  ): Promise<GaussianCloud> {
    if (signal?.aborted) throw new DOMException("Load cancelled", "AbortError");
    const resolvedUrl =
      typeof document === "undefined"
        ? url
        : new URL(url, document.baseURI).href;
    const id = crypto.randomUUID();
    const cloudId = crypto.randomUUID();
    const result = this.awaitLoad(id, options, signal);
    try {
      this.submit(createLoadCloudCommand(id, cloudId, resolvedUrl, options));
    } catch (error) {
      this.rejectLoad(id, error as Error);
    }
    return result;
  }

  async loadBuffer(
    buffer: ArrayBuffer,
    options: CloudLoadOptions = {},
    signal?: AbortSignal,
  ): Promise<GaussianCloud> {
    if (signal?.aborted) throw new DOMException("Load cancelled", "AbortError");
    const id = crypto.randomUUID();
    const cloudId = crypto.randomUUID();
    const result = this.awaitLoad(id, options, signal);
    try {
      this.submit(
        createLoadCloudFromBufferCommand(id, cloudId, buffer, options),
      );
    } catch (error) {
      this.rejectLoad(id, error as Error);
    }
    return result;
  }

  remove(cloud: GaussianCloud): void {
    const id = this.cloudIds.get(cloud);
    if (id === undefined) return;
    this.cloudMap.delete(id);
    this.cloudIds.delete(cloud);
    cloud.setRaycastIndex(null);
    cloud.removeFromParent();
    this.notify("clouds");
    this.submit(createUnloadCloudCommand(crypto.randomUUID(), id));
  }

  async setPackingPriority(
    cloud: GaussianCloud,
    priority: number,
  ): Promise<void> {
    if (!Number.isSafeInteger(priority)) {
      throw new RangeError("Priority must be a safe integer");
    }
    const id = this.requireId(cloud);
    const result = await this.scheduler.schedule(
      createSetCloudPriorityCommand(crypto.randomUUID(), id, priority),
    );
    if (result === "done" && this.cloudMap.get(id)?.cloud === cloud) {
      cloud.applyPackingPriority(priority);
    }
  }

  async setCloudMipmaps(
    cloud: GaussianCloud,
    mipmaps: MipmapConfig,
  ): Promise<void> {
    const cloudId = this.requireId(cloud);
    const result = await this.scheduler.schedule(
      createSetCloudMipmapsCommand(crypto.randomUUID(), cloudId, mipmaps),
    );
    const item = this.cloudMap.get(cloudId);
    if (result === "done" && item?.cloud === cloud) {
      item.mipmaps = mipmaps;
    }
  }

  writeAttributeRange(
    cloud: GaussianCloud,
    attribute: string,
    firstGaussian: number,
    gaussianCount: number,
    data: ArrayBuffer,
  ): void {
    this.submit(
      createWriteAttributeRangeCommand(
        crypto.randomUUID(),
        this.requireId(cloud),
        attribute,
        firstGaussian,
        gaussianCount,
        data,
      ),
    );
  }

  async invalidateCloudPacking(cloud: GaussianCloud): Promise<void> {
    const cloudId = this.requireId(cloud);
    const strategy = this.cloudMap.get(cloudId)!.mipmaps;
    if (strategy) {
      await this.setCloudMipmaps(cloud, strategy);
    }
  }

  enablePackedLodLevelAttribute(): GaussianStorePackedAttribute {
    return (
      this.attributes.get("mipmapLevel") ??
      this.attributes[enableGaussianStoreAttribute]("mipmapLevel", "u32")
    );
  }

  getPackedAttribute(name: string): StorageBufferAttribute | undefined {
    return name === "mipmapLevel"
      ? this.attributes.get(name)?.bufferAttribute
      : this.extraBuffers.get(name);
  }

  setFrontendCapabilities(
    capabilities: FrontendCapabilities,
    camera: Camera,
    viewportWidth = 1,
    viewportHeight = 1,
  ): void {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    if (this.disposed) throw new Error("GaussianStore disposed");
    const previous = this.frontendCapabilities;
    if (
      previous &&
      previous.maxStorageBufferBindingSize ===
        capabilities.maxStorageBufferBindingSize &&
      previous.maxBufferSize === capabilities.maxBufferSize &&
      previous.maxStorageBuffersPerShaderStage ===
        capabilities.maxStorageBuffersPerShaderStage &&
      previous.supportsPartialBufferUpdates ===
        capabilities.supportsPartialBufferUpdates
    )
      return;
    const wasAwaitingCapabilities = this.awaitingCapabilities;
    this.awaitingCapabilities = true;
    this.frontendCapabilities = { ...capabilities };
    camera.updateWorldMatrix(true, false);
    const transforms = this.clouds.map((cloud) => {
      cloud.updateWorldMatrix(true, false);
      return {
        cloudId: this.requireId(cloud),
        worldMatrix: cloud.matrixWorld.elements.slice(),
      };
    });
    const command = createSetFrontendCapabilitiesCommand(
      crypto.randomUUID(),
      capabilities,
      ++this.revision,
      camera.matrixWorld.elements.slice(),
      camera.projectionMatrix.elements.slice(),
      transforms,
      viewportWidth,
      viewportHeight,
    );
    this.capabilitiesAcknowledged.set(command.id, false);
    const rejectCapabilities = (error: unknown): void => {
      this.frontendCapabilities = previous;
      this.awaitingCapabilities = wasAwaitingCapabilities;
      this.lastError =
        error instanceof Error ? error : new Error(String(error));
      this.notify("content");
    };
    void this.scheduler.schedule(command).then(
      (result) => {
        const acknowledged = this.capabilitiesAcknowledged.get(command.id);
        this.capabilitiesAcknowledged.delete(command.id);
        if (result === "superseded") {
          return;
        }
        if (!acknowledged) {
          rejectCapabilities(
            new Error("Backend did not confirm the frontend capabilities"),
          );
          return;
        }
        if (
          this.frontendCapabilities === null ||
          this.frontendCapabilities.maxBufferSize !==
            capabilities.maxBufferSize ||
          this.frontendCapabilities.maxStorageBufferBindingSize !==
            capabilities.maxStorageBufferBindingSize ||
          this.frontendCapabilities.maxStorageBuffersPerShaderStage !==
            capabilities.maxStorageBuffersPerShaderStage ||
          this.frontendCapabilities.supportsPartialBufferUpdates !==
            capabilities.supportsPartialBufferUpdates
        ) {
          return;
        }
        this.awaitingCapabilities = false;
        this.notify("content");
      },
      (error: unknown) => {
        this.capabilitiesAcknowledged.delete(command.id);
        rejectCapabilities(error);
      },
    );
  }

  updateLod(camera: Camera): GaussianStoreLodUpdate {
    if (this.disposed) return { appliedBatches: 0, pending: false, clouds: [] };
    camera.updateWorldMatrix(true, false);
    const position = camera.getWorldPosition(new Vector3());
    const cameraWorldMatrix = camera.matrixWorld.elements.slice();
    const projectionMatrix = camera.projectionMatrix.elements.slice();
    const transforms = this.clouds.map((cloud) => {
      cloud.updateWorldMatrix(true, false);
      return [
        this.requireId(cloud),
        cloud.matrixWorld.elements.slice(),
      ] as const;
    });
    const activeIds = new Set(transforms.map(([cloudId]) => cloudId));
    for (const cloudId of this.lastCloudTransforms.keys())
      if (!activeIds.has(cloudId)) this.lastCloudTransforms.delete(cloudId);
    const changedTransforms = transforms.filter(
      ([cloudId, worldMatrix]) =>
        this.lastCloudTransforms.get(cloudId) !== JSON.stringify(worldMatrix),
    );
    const cameraKey = JSON.stringify([
      cameraWorldMatrix,
      projectionMatrix,
      this.viewportWidth,
      this.viewportHeight,
    ]);
    const cameraChanged = cameraKey !== this.lastCameraView;
    if (cameraChanged || changedTransforms.length > 0) {
      const sceneRevision = ++this.revision;
      for (const [cloudId, worldMatrix] of changedTransforms) {
        this.submit(
          createSetCloudTransformCommand(
            crypto.randomUUID(),
            cloudId,
            sceneRevision,
            worldMatrix,
          ),
        );
        this.lastCloudTransforms.set(cloudId, JSON.stringify(worldMatrix));
      }
      if (cameraChanged) {
        this.submit(
          createSetCameraCommand(
            crypto.randomUUID(),
            sceneRevision,
            cameraWorldMatrix,
            projectionMatrix,
            this.viewportWidth,
            this.viewportHeight,
          ),
        );
        this.lastCameraView = cameraKey;
      }
    }
    return {
      appliedBatches: 0,
      pending: this.pendingLod,
      clouds: this.clouds.map((cloud) => ({
        cloud,
        focusDistance: position.distanceTo(
          cloud.getWorldPosition(new Vector3()),
        ),
        applied: false,
        pending: this.pendingLod,
        targetStats: {
          planningMs: this.packStats?.backendMetrics?.selectionMs ?? 0,
          roundTripMs: this.lastRoundTripMs,
          discardedResults: 0,
          pending: this.pendingLod,
        },
      })),
    };
  }

  getPackedData(): GaussianData {
    if (this.lastError) throw this.lastError;
    if (!this.data || this.awaitingCapabilities)
      throw new Error("Gaussian buffers are not ready");
    return this.data;
  }

  getBounds(
    cloud: GaussianCloud,
  ): readonly [number, number, number, number, number, number] {
    return this.cloudMap.get(this.requireId(cloud))!.bounds;
  }
  getSourceCount(cloud: GaussianCloud): number {
    return this.cloudMap.get(this.requireId(cloud))!.sourceCount;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe();
    this.unsubscribeFailure();
    this.scheduler.dispose();
    for (const pending of this.pendingLoads.values()) {
      pending.cleanup();
      pending.reject(new Error("GaussianStore disposed"));
    }
    this.pendingLoads.clear();
    this.abortedLoads.clear();
    this.capabilitiesAcknowledged.clear();
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

  private submit(command: BackendCommand): void {
    void this.scheduler.schedule(command).then(
      (result) => {
        if (result === "superseded") {
          this.abortedLoads.delete(command.id);
        }
      },
      (error: unknown) => {
        const failure =
          error instanceof Error ? error : new Error(String(error));
        if (this.pendingLoads.has(command.id)) {
          this.rejectLoad(command.id, failure);
        }
      },
    );
  }

  private readonly handleFailure = (failure: BackendFailure): void => {
    const error = new Error(failure.message);
    for (const id of [...this.pendingLoads.keys()]) this.rejectLoad(id, error);
    this.lastError = error;
    this.awaitingCapabilities = false;
    this.notify("content");
  };

  private readonly handleResponse = (response: BackendResponse): void => {
    if (this.disposed) return;
    if (
      this.capabilitiesAcknowledged.has(response.command.id) &&
      response.payload?.type === "capabilities-accepted" &&
      response.payload.protocolVersion === 2
    ) {
      this.capabilitiesAcknowledged.set(response.command.id, true);
    }
    if (response.payload)
      this.handlePayload(response.payload, response.command.id);
    if (response.metrics && this.packStats)
      this.packStats = {
        ...this.packStats,
        backendMetrics: response.metrics,
        planningMs: response.metrics.selectionMs,
        slotUpdateMs:
          response.metrics.slotMappingMs + response.metrics.packingMs,
      };
    if (response.error) {
      const error = new Error(response.error.message);
      if (response.error.code === "cancelled") error.name = "AbortError";
      if (this.pendingLoads.has(response.command.id))
        this.rejectLoad(response.command.id, error);
      else {
        this.commandError = error;
        this.awaitingCapabilities = false;
      }
      this.notify("content");
    } else if (response.isFinal) {
      if (this.commandError) {
        this.commandError = null;
        this.notify("content");
      }
    }
    if (response.isFinal) {
      this.lastRoundTripMs = response.durationMs;
      this.abortedLoads.delete(response.command.id);
    }
  };

  private handlePayload(event: BackendPayload, commandId: string): void {
    switch (event.type) {
      case "capabilities-accepted":
        break;
      case "cloud-loaded": {
        if (this.abortedLoads.has(commandId)) break;
        const options = this.pendingLoads.get(commandId)?.options ?? {};
        const priority = options.priority ?? 0;
        const cloud = new GaussianCloud(
          this,
          event.objectId,
          0,
          options.name ?? event.cloudId,
          priority,
        );
        if (event.mipmapSnapshot)
          cloud.setRaycastIndex(new GaussianRaycastIndex(event.mipmapSnapshot));
        this.cloudMap.set(event.cloudId, {
          cloud,
          sourceCount: event.sourceCount,
          bounds: event.bounds,
          sourceVersion: event.sourceVersion,
          snapshotVersion: event.mipmapSnapshot?.snapshotVersion ?? 0,
          mipmaps: options.mipmaps,
        });
        this.cloudIds.set(cloud, event.cloudId);
        this.pendingLoads.get(commandId)?.cleanup();
        this.pendingLoads.get(commandId)?.resolve(cloud);
        this.pendingLoads.delete(commandId);
        this.notify("clouds");
        break;
      }
      case "cloud-unloaded":
        break;
      case "mipmap-snapshot-replaced": {
        const item = this.cloudMap.get(event.cloudId);
        if (
          item &&
          event.sourceVersion >= item.sourceVersion &&
          event.snapshotVersion > item.snapshotVersion
        ) {
          item.sourceVersion = event.sourceVersion;
          item.snapshotVersion = event.snapshotVersion;
          item.bounds = event.bounds;
          item.cloud.setRaycastIndex(
            event.snapshot ? new GaussianRaycastIndex(event.snapshot) : null,
          );
          this.notify("clouds");
        }
        break;
      }
      case "buffers-allocated": {
        if (event.layoutVersion <= this.packedLayoutVersion) break;
        const attributes = event.attributes.map((schema) => {
          const values =
            schema.format === "f32"
              ? new Float32Array(event.capacity * schema.elementsPerGaussian)
              : new Uint32Array(
                  event.capacity * schema.elementsPerGaussian +
                    (schema.name === "shCoefficients" ? event.capacity : 0),
                );
          if (schema.name === "means")
            for (let slot = 0; slot < event.capacity; slot++)
              values[slot * 4 + 3] = -1;
          return { ...schema, data: values.buffer };
        });
        this.replace({
          ...event,
          type: "buffers-replaced",
          count: 0,
          activeSlots: new Uint32Array().buffer,
          attributes,
        });
        this.pendingLod = true;
        break;
      }
      case "buffers-replaced":
        this.replace(event);
        break;
      case "buffers-activated":
        this.activate(event);
        break;
      case "buffers-patched":
        this.patch(event);
        break;
    }
  }

  private replace(
    event: Extract<BackendPayload, { type: "buffers-replaced" }>,
  ): void {
    if (event.layoutVersion <= this.packedLayoutVersion) return;
    const lookup = new Map(
      event.attributes.map((attribute) => [attribute.name, attribute]),
    );
    const required = (name: string): PackedAttributeBuffer => {
      const result = lookup.get(name);
      if (!result) throw new Error(`Missing backend attribute: ${name}`);
      return result;
    };
    const previous = this.data;
    this.data =
      event.clouds.length > 0
        ? new GaussianData(
            {
              means: floatAttribute("means", required("means").data),
              scalesOpacity: floatAttribute(
                "scalesOpacity",
                required("scalesOpacity").data,
              ),
              rotations: floatAttribute(
                "rotations",
                required("rotations").data,
              ),
              shCoefficients: uintAttribute(
                "shCoefficients",
                required("shCoefficients").data,
              ),
            },
            {
              count: event.capacity,
              activeSlots: event.activeSlots
                ? new Uint32Array(event.activeSlots)
                : undefined,
              shDegree: event.shDegree,
              shFormat: "rgb8e8",
              ownsBuffers: true,
            },
          )
        : null;
    previous?.dispose();
    this.schemas.clear();
    for (const attribute of event.attributes)
      this.schemas.set(attribute.name, attribute);
    for (const buffer of this.extraBuffers.values()) buffer.dispose();
    this.extraBuffers.clear();
    for (const attribute of event.attributes) {
      if (attribute.name === "mipmapLevel") {
        this.enablePackedLodLevelAttribute()[replaceGaussianStoreAttribute](
          new Uint32Array(attribute.data),
        );
      } else if (
        !["means", "scalesOpacity", "rotations", "shCoefficients"].includes(
          attribute.name,
        )
      ) {
        this.extraBuffers.set(
          attribute.name,
          attribute.format === "f32"
            ? floatAttribute(
                attribute.name,
                attribute.data,
                attribute.elementsPerGaussian,
              )
            : uintAttribute(
                attribute.name,
                attribute.data,
                attribute.elementsPerGaussian,
              ),
        );
      }
    }
    this.applyCloudStates(event.clouds);
    this.capacity = event.capacity;
    this.packedObjectCapacity = event.objectCapacity;
    this.packedDegree = event.shDegree;
    this.packedLayoutVersion = event.layoutVersion;
    this.packedVersion = event.contentVersion;
    this.pendingLod = false;
    const occupied: number[] = [];
    if (this.data)
      for (let slot = 0; slot < event.capacity; slot++)
        if (this.data.means.array[slot * 4 + 3]! >= 0) occupied.push(slot);
    this.packStats = {
      fullRebuild: true,
      layoutVersion: event.layoutVersion,
      slotCapacity: event.capacity,
      activeGaussians: event.count,
      reusedSlots: 0,
      writtenSlots: occupied.length,
      clearedSlots: 0,
      estimatedUploadBytes: event.attributes.reduce(
        (sum, item) => sum + item.data.byteLength,
        0,
      ),
      writtenSlotRanges: mergeSlotRanges(occupied, 0, 0),
      clearedSlotRanges: [],
      planningMs: 0,
      slotUpdateMs: 0,
    };
    this.awaitingCapabilities = false;
    this.notify("layout");
  }

  private patch(
    event: Extract<BackendPayload, { type: "buffers-patched" }>,
  ): void {
    if (
      event.layoutVersion !== this.packedLayoutVersion ||
      event.baseContentVersion !== this.packedVersion
    )
      return;
    for (const patch of event.patches) {
      const schema = this.schemas.get(patch.name);
      if (!schema) continue;
      const array = this.attributeArray(patch.name);
      if (!array) continue;
      const start = patch.firstSlot * schema.elementsPerGaussian;
      const incoming =
        schema.format === "f32"
          ? new Float32Array(patch.data)
          : new Uint32Array(patch.data);
      array.set(incoming, start);
      if (patch.name === "mipmapLevel")
        this.enablePackedLodLevelAttribute()[updateGaussianStoreAttribute]([
          { start: patch.firstSlot, count: patch.slotCount },
        ]);
      else {
        const gpu =
          this.getPackedAttribute(patch.name) ??
          (this.data?.[patch.name as keyof GaussianData] as
            StorageBufferAttribute | undefined);
        if (gpu)
          markSlotRangesUpdated(
            gpu,
            [{ start: patch.firstSlot, count: patch.slotCount }],
            schema.elementsPerGaussian,
          );
      }
    }
    this.applyCloudStates(event.changedClouds);
    this.packedVersion = event.contentVersion;
    this.pendingLod = event.mipmapPending;
    const ranges = event.patches.map((item) => ({
      start: item.firstSlot,
      count: item.slotCount,
    }));
    const touched = new Set<number>();
    for (const range of ranges)
      for (let i = range.start; i < range.start + range.count; i++)
        touched.add(i);
    const active = this.count;
    const means = this.data?.means.array as Float32Array | undefined;
    const written: number[] = [];
    const cleared: number[] = [];
    for (const slot of touched)
      (means && means[slot * 4 + 3]! < 0 ? cleared : written).push(slot);
    this.packStats = {
      fullRebuild: false,
      layoutVersion: event.layoutVersion,
      slotCapacity: this.capacity,
      activeGaussians: active,
      reusedSlots: Math.max(0, active - written.length),
      writtenSlots: written.length,
      clearedSlots: cleared.length,
      estimatedUploadBytes: event.patches.reduce(
        (sum, item) => sum + item.data.byteLength,
        0,
      ),
      writtenSlotRanges: mergeSlotRanges(written, 0, 0),
      clearedSlotRanges: mergeSlotRanges(cleared, 0, 0),
      planningMs: 0,
      slotUpdateMs: 0,
    };
    this.notify("content");
  }

  private activate(
    event: Extract<BackendPayload, { type: "buffers-activated" }>,
  ): void {
    if (
      event.layoutVersion !== this.packedLayoutVersion ||
      event.baseContentVersion !== this.packedVersion
    )
      return;
    this.data?.stageActivation(
      new Uint32Array(event.addedSlots),
      new Uint32Array(event.removedSlots),
      event.commit,
    );
    this.packedVersion = event.contentVersion;
    this.pendingLod = event.mipmapPending;
    if (event.commit) this.applyCloudStates(event.changedClouds);
    if (this.packStats)
      this.packStats = {
        ...this.packStats,
        fullRebuild: false,
        activeGaussians: this.count,
        estimatedUploadBytes:
          event.addedSlots.byteLength + event.removedSlots.byteLength,
      };
    this.notify("content");
  }

  private attributeArray(name: string): Float32Array | Uint32Array | null {
    if (name === "mipmapLevel")
      return this.enablePackedLodLevelAttribute().array;
    if (name === "means")
      return (this.data?.means.array as Float32Array) ?? null;
    if (name === "scalesOpacity")
      return (this.data?.scalesOpacity.array as Float32Array) ?? null;
    if (name === "rotations")
      return (this.data?.rotations.array as Float32Array) ?? null;
    if (name === "shCoefficients")
      return (this.data?.shCoefficients.array as Uint32Array) ?? null;
    return (
      (this.extraBuffers.get(name)?.array as Float32Array | Uint32Array) ?? null
    );
  }

  private applyCloudStates(
    states: readonly { cloudId: string; renderedCount: number }[],
  ): void {
    for (const state of states)
      this.cloudMap
        .get(state.cloudId)
        ?.cloud.updatePacking(state.renderedCount);
  }
  private notify(reason: "clouds" | "layout" | "content"): void {
    for (const listener of this.listeners)
      listener({ type: "changed", reason });
  }
  private requireId(cloud: GaussianCloud): string {
    const id = this.cloudIds.get(cloud);
    if (!id) throw new Error("Cloud does not belong to this GaussianStore");
    return id;
  }
  private awaitLoad(
    id: string,
    options: CloudLoadOptions,
    signal?: AbortSignal,
  ): Promise<GaussianCloud> {
    return new Promise((resolve, reject) => {
      const abort = () => {
        this.abortedLoads.add(id);
        this.scheduler.cancel(id);
        this.rejectLoad(id, new DOMException("Load cancelled", "AbortError"));
      };
      signal?.addEventListener("abort", abort, { once: true });
      this.pendingLoads.set(id, {
        resolve,
        reject,
        options,
        cleanup: () => signal?.removeEventListener("abort", abort),
      });
    });
  }
  private rejectLoad(id: string, error: Error): void {
    const pending = this.pendingLoads.get(id);
    if (!pending) return;
    pending.cleanup();
    this.pendingLoads.delete(id);
    pending.reject(error);
  }
}

function floatAttribute(
  name: string,
  buffer: ArrayBuffer,
  size = 4,
): StorageBufferAttribute {
  const attribute = new StorageBufferAttribute(new Float32Array(buffer), size);
  attribute.name = `3dgs.store.${name}`;
  return attribute;
}
function uintAttribute(
  name: string,
  buffer: ArrayBuffer,
  size = 1,
): StorageBufferAttribute {
  const attribute = new StorageBufferAttribute(new Uint32Array(buffer), size);
  attribute.name = `3dgs.store.${name}`;
  return attribute;
}
