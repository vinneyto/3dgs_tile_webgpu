import { Camera, StorageBufferAttribute, Vector3 } from "three/webgpu";
import { GaussianCloud } from "../GaussianCloud";
import { GaussianData } from "../GaussianData";
import type { GaussianBackend } from "../GaussianBackend";
import type { GaussianBackendListener } from "../GaussianBackendEvents";
import {
  type GaussianStoreAddLodOptions,
  type GaussianStoreLodBatchResult,
  type GaussianStoreLoadOptions,
  type GaussianStoreLodUpdate,
  type GaussianStoreOptions,
  type GaussianStorePackOptions,
  type GaussianStorePackStats,
} from "../GaussianStoreTypes";
import type { GaussianLod } from "../GaussianLod";
import { GaussianRaycastIndex } from "./GaussianRaycastIndex";
import { markSlotRangesUpdated } from "../utils/slotRanges";
import {
  disposeGaussianStoreAttributes,
  enableGaussianStoreAttribute,
  GaussianStoreAttributes,
} from "../store-attributes/GaussianStoreAttributes";
import {
  replaceGaussianStoreAttribute,
  updateGaussianStoreAttribute,
  type GaussianStorePackedAttribute,
} from "../store-attributes/GaussianStorePackedAttribute";
import type {
  WorkerStoreCloudState,
  WorkerStoreRequest,
  WorkerStoreResult,
  WorkerStoreTransport,
} from "./WorkerGaussianBackendProtocol";
import WorkerGaussianBackendWorker from "./WorkerGaussianBackendWorker?worker&inline";

type RequestBody = WorkerStoreRequest extends infer T
  ? T extends { requestId: number }
    ? Omit<T, "requestId">
    : never
  : never;

interface RemoteCloud {
  readonly remoteId: number;
  readonly cloud: GaussianCloud;
  readonly sourceCount: number;
  readonly degree: 0 | 1 | 2 | 3;
  readonly raycast: GaussianRaycastIndex;
  readonly bounds: readonly [number, number, number, number, number, number];
}

export interface WorkerGaussianBackendOptions extends GaussianStoreOptions {
  /** Custom transport can translate the structured-clone protocol to a remote backend. */
  readonly transport?: WorkerStoreTransport;
}

/**
 * Renderer-facing GaussianStore with all parsing, tree construction, budgeting,
 * packing, and streaming LOD running in a dedicated worker. Only transferable
 * GPU arrays and a synchronous raycast snapshot live in the UI thread.
 */
export class WorkerGaussianBackend implements GaussianBackend {
  readonly attributes = new GaussianStoreAttributes();
  readonly packedShFormat = "rgb8e8" as const;
  readonly maxGaussiansOption: number | "auto";
  layoutVersion = 0;
  private readonly worker: WorkerStoreTransport;
  private readonly ownsTransport: boolean;
  private readonly pending = new Map<
    number,
    {
      resolve: (result: WorkerStoreResult) => void;
      reject: (error: Error) => void;
    }
  >();
  private readonly remoteClouds = new Map<number, RemoteCloud>();
  private readonly changeListeners = new Set<GaussianBackendListener>();
  private readonly initialized: Promise<void>;
  private nextRequestId = 0;
  private nextCloudId = 0;
  private generation = 0;
  private remoteData: GaussianData | null = null;
  private remoteInvalid = false;
  private packInFlight = false;
  private updateInFlight = false;
  private updatePending = false;
  private remoteDisposed = false;
  private remoteCapacity = 0;
  private remoteStats: GaussianStorePackStats | null = null;
  private remoteVersion = 0;
  private remoteObjectCapacity = 0;
  private lastCameraKey = "";
  private lastError: Error | null = null;

  constructor(options: WorkerGaussianBackendOptions = {}) {
    if (
      options.loader ||
      options.budgetingStrategy ||
      options.defaultPackingStrategy
    ) {
      throw new Error(
        "WorkerGaussianBackend currently supports the built-in loader and packing strategies",
      );
    }
    this.maxGaussiansOption = options.maxGaussians ?? "auto";
    this.ownsTransport = options.transport === undefined;
    this.worker =
      options.transport ??
      new WorkerGaussianBackendWorker({ name: "3dgs-store" });
    this.worker.addEventListener("message", this.handleMessage);
    this.worker.addEventListener("error", this.handleError);
    this.initialized = this.send({
      type: "init",
      maxGaussians: this.maxGaussiansOption,
      defaultStreamingLod: options.defaultStreamingLod,
    }).then((result) => {
      if (result.type !== "initialized")
        throw new Error("Unexpected Store initialization result");
    });
  }

  get clouds(): readonly GaussianCloud[] {
    return [...this.remoteClouds.values()].map(({ cloud }) => cloud);
  }
  get count(): number {
    return this.clouds.reduce((sum, cloud) => sum + cloud.gaussianCount, 0);
  }
  get shDegree(): 0 | 1 | 2 | 3 {
    let degree: 0 | 1 | 2 | 3 = 0;
    for (const item of this.remoteClouds.values())
      if (item.degree > degree) degree = item.degree;
    return degree;
  }
  get needsPack(): boolean {
    return this.remoteInvalid;
  }
  get hasPackedData(): boolean {
    return this.remoteData !== null && !this.remoteInvalid;
  }
  get maxGaussians(): number {
    return this.remoteCapacity;
  }
  get objectCapacity(): number {
    return this.remoteObjectCapacity;
  }
  get lastPackStats(): GaussianStorePackStats | null {
    return this.remoteStats;
  }
  get contentVersion(): number {
    return this.remoteVersion;
  }

  /** Allow a demand-driven renderer to redraw when a worker result arrives. */
  subscribe(listener: GaussianBackendListener): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  getBounds(
    cloud: GaussianCloud,
  ): readonly [number, number, number, number, number, number] {
    const item = this.findCloud(cloud);
    if (item?.cloud !== cloud)
      throw new Error("Cloud does not belong to this Store");
    return item.bounds;
  }

  getSourceCount(cloud: GaussianCloud): number {
    const item = this.findCloud(cloud);
    if (item?.cloud !== cloud)
      throw new Error("Cloud does not belong to this Store");
    return item.sourceCount;
  }

  async load(
    url: string,
    options: GaussianStoreLoadOptions = {},
  ): Promise<GaussianCloud> {
    if (options.packingStrategy !== undefined)
      throw new Error("Custom packing strategies are not serializable");
    await this.initialized;
    const cloudId = this.nextCloudId++;
    const result = await this.send({
      type: "load",
      cloudId,
      url,
      name: options.name,
      priority: options.priority,
      octree: options.octree,
      lod: options.lod,
    }).catch((error: unknown) => {
      this.emitError(toError(error));
      throw error;
    });
    return this.attachLoaded(
      result,
      cloudId,
      options.name ?? url,
      options.priority ?? 0,
    );
  }

  async loadBuffer(
    buffer: ArrayBuffer,
    options: GaussianStoreLoadOptions = {},
  ): Promise<GaussianCloud> {
    if (options.packingStrategy !== undefined)
      throw new Error("Custom packing strategies are not serializable");
    await this.initialized;
    const cloudId = this.nextCloudId++;
    const result = await this.send(
      {
        type: "load",
        cloudId,
        buffer,
        name: options.name,
        priority: options.priority,
        octree: options.octree,
        lod: options.lod,
      },
      [buffer],
    ).catch((error: unknown) => {
      this.emitError(toError(error));
      throw error;
    });
    return this.attachLoaded(
      result,
      cloudId,
      options.name ?? "GaussianCloud",
      options.priority ?? 0,
    );
  }

  add(): GaussianCloud {
    throw new Error(
      "Use loadBuffer() to transfer source data to WorkerGaussianBackend",
    );
  }
  addLod(
    _lod: GaussianLod,
    _options?: GaussianStoreAddLodOptions,
  ): GaussianCloud {
    throw new Error("Build the LOD in the worker with load() or loadBuffer()");
  }

  packLodBatch(_cloud: GaussianCloud): GaussianStoreLodBatchResult {
    throw new Error("Streaming LOD batches are scheduled by the worker");
  }

  enablePackedLodLevelAttribute(): GaussianStorePackedAttribute {
    const existing = this.attributes.get("lodLevel");
    if (existing !== undefined) return existing;
    const attribute = this.attributes[enableGaussianStoreAttribute](
      "lodLevel",
      "u32",
    );
    void this.initialized
      .then(() => this.send({ type: "enable-lod-level" }))
      .then((result) => {
        if (result.type !== "lod-level-enabled")
          throw new Error("Unexpected LOD attribute response");
        if (result.lodLevel !== undefined && !this.remoteDisposed) {
          attribute[replaceGaussianStoreAttribute](
            new Uint32Array(result.lodLevel),
          );
          this.notify("content");
        }
      })
      .catch((error: unknown) => {
        this.fail(error);
      });
    return attribute;
  }

  pack({ limits }: GaussianStorePackOptions): void {
    this.checkError();
    if (!this.remoteInvalid || this.packInFlight || this.remoteDisposed) return;
    this.packInFlight = true;
    const generation = this.generation;
    void this.send({ type: "pack", limits })
      .then((result) => {
        if (result.type !== "packed")
          throw new Error("Unexpected Store pack result");
        if (generation !== this.generation || this.remoteDisposed) return;
        const old = this.remoteData;
        this.remoteData = new GaussianData(
          {
            means: attribute(
              "3dgs.store.means-object",
              new Float32Array(result.buffers.means),
            ),
            scalesOpacity: attribute(
              "3dgs.store.scales-opacity",
              new Float32Array(result.buffers.scalesOpacity),
            ),
            rotations: attribute(
              "3dgs.store.rotations",
              new Float32Array(result.buffers.rotations),
            ),
            shCoefficients: attribute(
              "3dgs.store.sh-coefficients",
              new Uint32Array(result.buffers.shCoefficients),
              1,
            ),
          },
          {
            count: result.count,
            shDegree: result.degree,
            shFormat: "rgb8e8",
            ownsBuffers: true,
          },
        );
        old?.dispose();
        this.remoteCapacity = result.capacity;
        this.remoteObjectCapacity = result.objectCapacity;
        this.remoteStats = result.stats;
        const lodLevel = this.attributes.get("lodLevel");
        if (lodLevel !== undefined && result.buffers.lodLevel !== undefined) {
          lodLevel[replaceGaussianStoreAttribute](
            new Uint32Array(result.buffers.lodLevel),
          );
        }
        this.applyCloudStates(result.clouds);
        this.remoteInvalid = false;
        this.updatePending = true;
        this.lastCameraKey = "";
        this.layoutVersion++;
        this.remoteVersion++;
        this.notify("layout");
      })
      .catch((error: unknown) => {
        this.fail(error);
      })
      .finally(() => {
        this.packInFlight = false;
      });
  }

  updateLod(camera: Camera): GaussianStoreLodUpdate {
    this.checkError();
    if (this.remoteData === null || this.remoteInvalid || this.remoteDisposed)
      return { appliedBatches: 0, pending: this.remoteInvalid, clouds: [] };
    camera.updateWorldMatrix(true, false);
    const position = camera.getWorldPosition(new Vector3());
    const transforms = this.clouds.map((cloud) => {
      cloud.updateWorldMatrix(true, false);
      return {
        cloudId: this.findCloud(cloud)!.remoteId,
        matrix: cloud.matrixWorld.toArray(),
      };
    });
    const key = JSON.stringify([
      position.x,
      position.y,
      position.z,
      transforms,
    ]);
    if (
      !this.updateInFlight &&
      (this.updatePending || key !== this.lastCameraKey)
    ) {
      this.updateInFlight = true;
      this.lastCameraKey = key;
      const generation = this.generation;
      void this.send({
        type: "update",
        position: [position.x, position.y, position.z],
        transforms,
      })
        .then((result) => {
          if (result.type !== "updated")
            throw new Error("Unexpected Store update result");
          if (generation !== this.generation || this.remoteDisposed) return;
          this.updatePending = result.pending;
          if (result.appliedBatches === 0 || this.remoteData === null) return;
          for (const patch of result.patches) this.applyPatch(patch);
          this.applyCloudStates(result.clouds);
          this.remoteStats = result.stats;
          this.remoteVersion++;
          this.notify("content");
        })
        .catch((error: unknown) => {
          this.fail(error);
        })
        .finally(() => {
          this.updateInFlight = false;
        });
    }
    return {
      appliedBatches: 0,
      pending: this.updateInFlight || this.updatePending,
      clouds: [],
    };
  }

  getPackedData(): GaussianData {
    this.checkError();
    if (this.remoteData === null || this.remoteInvalid)
      throw new Error(
        "WorkerGaussianBackend is not packed yet or its layout has changed",
      );
    return this.remoteData;
  }

  remove(cloud: GaussianCloud): void {
    const item = this.findCloud(cloud);
    if (item === undefined) return;
    this.remoteClouds.delete(item.remoteId);
    cloud.removeFromParent();
    this.generation++;
    this.remoteInvalid = true;
    this.notify("clouds");
    void this.send({ type: "remove", cloudId: item.remoteId }).catch(
      (error: unknown) => {
        this.fail(error);
      },
    );
  }

  updatePackingPriority(cloud: GaussianCloud, priority: number): void {
    const item = this.findCloud(cloud);
    if (item === undefined)
      throw new Error("Cloud does not belong to this Store");
    if (!Number.isSafeInteger(priority))
      throw new RangeError("Packing priority must be a safe integer");
    cloud.updatePackingPriority(priority);
    this.generation++;
    this.remoteInvalid = true;
    this.notify("layout");
    void this.send({
      type: "priority",
      cloudId: item.remoteId,
      priority,
    }).catch((error: unknown) => {
      this.fail(error);
    });
  }

  invalidateCloudPacking(cloud: GaussianCloud): void {
    const item = this.findCloud(cloud);
    if (item === undefined)
      throw new Error("Cloud does not belong to this Store");
    this.generation++;
    this.remoteInvalid = true;
    this.notify("layout");
    void this.send({ type: "invalidate", cloudId: item.remoteId }).catch(
      (error: unknown) => {
        this.fail(error);
      },
    );
  }

  dispose(): void {
    if (this.remoteDisposed) return;
    this.remoteDisposed = true;
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.removeEventListener("error", this.handleError);
    if (this.ownsTransport) this.worker.terminate?.();
    for (const pending of this.pending.values())
      pending.reject(new Error("WorkerGaussianBackend disposed"));
    this.pending.clear();
    for (const { cloud } of this.remoteClouds.values())
      cloud.removeFromParent();
    this.remoteClouds.clear();
    this.remoteData?.dispose();
    this.remoteData = null;
    this.changeListeners.clear();
    this.attributes[disposeGaussianStoreAttributes]();
  }

  private attachLoaded(
    result: WorkerStoreResult,
    cloudId: number,
    name: string,
    priority: number,
  ): GaussianCloud {
    if (result.type !== "loaded" || result.cloudId !== cloudId)
      throw new Error("Unexpected Store load result");
    if (this.remoteDisposed) throw new Error("WorkerGaussianBackend disposed");
    const cloud = new GaussianCloud(
      this,
      result.objectId,
      0,
      name,
      null,
      null,
      priority,
    );
    const raycast = new GaussianRaycastIndex(result.raycast);
    cloud.setRaycastIndex(raycast);
    this.remoteClouds.set(cloudId, {
      remoteId: cloudId,
      cloud,
      raycast,
      bounds: result.bounds,
      sourceCount: result.count,
      degree: result.degree,
    });
    this.generation++;
    this.remoteInvalid = true;
    this.notify("clouds");
    return cloud;
  }

  private applyCloudStates(states: readonly WorkerStoreCloudState[]): void {
    for (const state of states) {
      const item = this.remoteClouds.get(state.cloudId);
      if (item === undefined) continue;
      item.cloud.updatePacking(state.count, null);
      item.raycast.setRenderedIndices(state.renderedIndices);
    }
  }

  private findCloud(cloud: GaussianCloud): RemoteCloud | undefined {
    for (const item of this.remoteClouds.values()) {
      if (item.cloud === cloud) return item;
    }
    return undefined;
  }

  private applyPatch(patch: {
    start: number;
    count: number;
    means?: ArrayBuffer;
    scalesOpacity?: ArrayBuffer;
    rotations?: ArrayBuffer;
    shCoefficients?: ArrayBuffer;
    lodLevel?: ArrayBuffer;
  }): void {
    const data = this.remoteData!;
    const range = [{ start: patch.start, count: patch.count }];
    if (patch.means !== undefined) {
      (data.means.array as Float32Array).set(
        new Float32Array(patch.means),
        patch.start * 4,
      );
      markSlotRangesUpdated(data.means, range, 4);
    }
    if (patch.scalesOpacity !== undefined) {
      (data.scalesOpacity.array as Float32Array).set(
        new Float32Array(patch.scalesOpacity),
        patch.start * 4,
      );
      markSlotRangesUpdated(data.scalesOpacity, range, 4);
    }
    if (patch.rotations !== undefined) {
      (data.rotations.array as Float32Array).set(
        new Float32Array(patch.rotations),
        patch.start * 4,
      );
      markSlotRangesUpdated(data.rotations, range, 4);
    }
    if (patch.shCoefficients !== undefined) {
      (data.shCoefficients.array as Uint32Array).set(
        new Uint32Array(patch.shCoefficients),
        patch.start * data.shCoefficientCount,
      );
      markSlotRangesUpdated(
        data.shCoefficients,
        range,
        data.shCoefficientCount,
      );
    }
    const lodLevel = this.attributes.get("lodLevel");
    if (patch.lodLevel !== undefined && lodLevel?.isAllocated) {
      lodLevel.array.set(new Uint32Array(patch.lodLevel), patch.start);
      lodLevel[updateGaussianStoreAttribute](range);
    }
  }

  private send(
    body: RequestBody,
    transfer?: Transferable[],
  ): Promise<WorkerStoreResult> {
    if (this.remoteDisposed)
      return Promise.reject(new Error("WorkerGaussianBackend disposed"));
    const requestId = ++this.nextRequestId;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      try {
        this.worker.postMessage({ ...body, requestId }, transfer ?? []);
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    });
  }

  private readonly handleMessage = ({
    data,
  }: MessageEvent<WorkerStoreResult>): void => {
    const pending = this.pending.get(data.requestId);
    if (pending === undefined) return;
    this.pending.delete(data.requestId);
    if (data.type === "error") pending.reject(new Error(data.message));
    else pending.resolve(data);
  };

  private readonly handleError = (event: ErrorEvent): void => {
    const error = new Error(event.message);
    this.fail(error);
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  };

  private checkError(): void {
    if (this.lastError !== null) throw this.lastError;
  }

  private notify(reason: "clouds" | "layout" | "content"): void {
    for (const listener of this.changeListeners)
      listener({ type: "changed", reason });
  }

  private fail(error: unknown): void {
    this.lastError = toError(error);
    this.emitError(this.lastError);
  }

  private emitError(error: Error): void {
    for (const listener of this.changeListeners)
      listener({ type: "error", error });
  }
}

function attribute(
  name: string,
  values: Float32Array | Uint32Array,
  itemSize = 4,
): StorageBufferAttribute {
  const result = new StorageBufferAttribute(values, itemSize);
  result.name = name;
  return result;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
