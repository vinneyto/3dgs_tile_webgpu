import { Matrix4 } from "three";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type {
  BackendResponse,
  BackendFailure,
  BackendPayload,
  BackendMetrics,
} from "../streaming-backend/BackendResponse";
import type { FrontendCapabilities } from "../streaming-backend/FrontendCapabilities";
import type { CloudLoadOptions } from "../streaming-backend/CloudLoadOptions";
import type { CloudRenderState } from "../streaming-backend/CloudRenderState";
import type { PackedAttributeBuffer } from "../streaming-backend/PackedAttributeBuffer";
import type {
  SparkBackendOptions,
  SparkExtSplats,
  SparkLodTree,
} from "./SparkWasmContract";
import { SparkRuntime } from "./SparkRuntime";
import { packSparkAttributes } from "./packSparkAttributes";
import { sparkBounds, createSparkSnapshot } from "./createSparkSnapshot";

interface Cloud {
  id: string;
  objectId: number;
  data: SparkExtSplats;
  sourceCount: number;
  tree?: SparkLodTree;
  options: CloudLoadOptions;
  offset: number;
  world: Matrix4;
  priority: number;
  bounds: Float32Array;
}
/** Explicit worker-side adapter. All decoding, merging and LOD selection use Spark exports. */
export class SparkGaussianBackend implements GaussianBackend {
  private readonly ready = SparkRuntime.initialize();
  private readonly listeners = new Set<(response: BackendResponse) => void>();
  private readonly failures = new Set<(failure: BackendFailure) => void>();
  private readonly clouds = new Map<string, Cloud>();
  private active: { id: string; controller: AbortController } | null = null;
  private disposed = false;
  private capabilities: FrontendCapabilities | null = null;
  private world = new Matrix4();
  private projection = new Matrix4();
  private viewportHeight = 1;
  private sceneRevision = 0;
  private cameraRevision = 0;
  private layoutVersion = 0;
  private contentVersion = 0;
  private nextObjectId = 0;
  private activeSlots = new Uint32Array();
  private capacity = 0;
  private membership = new Uint32Array();
  private epoch = 1;
  private dirty = true;
  private metrics!: BackendMetrics;
  constructor(
    private readonly config: BackendConfig = {},
    private readonly afterUpload?: () => Promise<void>,
    private readonly options: SparkBackendOptions = {},
  ) {
    void this.ready.catch(() => {});
    if (config.lod && Object.keys(config.lod).length)
      throw new Error(
        "Upstream Spark owns LOD selection; custom resident-Rust LOD settings are unsupported",
      );
    if (
      options.maxActiveSplats !== undefined &&
      (!Number.isSafeInteger(options.maxActiveSplats) ||
        options.maxActiveSplats < 1)
    )
      throw new RangeError("maxActiveSplats must be positive");
    if (
      options.pixelLimit !== undefined &&
      (!(options.pixelLimit > 0) || !Number.isFinite(options.pixelLimit))
    )
      throw new RangeError("pixelLimit must be finite and positive");
  }
  subscribe(listener: (response: BackendResponse) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  onFailure(listener: (failure: BackendFailure) => void) {
    this.failures.add(listener);
    return () => {
      this.failures.delete(listener);
    };
  }
  dispatch(command: BackendCommand): void {
    if (this.disposed) throw new Error("Spark backend disposed");
    if (this.active) throw new Error("Spark backend requires serial dispatch");
    const controller = new AbortController();
    this.active = { id: command.id, controller };
    void this.execute(command, controller);
  }
  abort(id: string) {
    if (this.active?.id === id) this.active.controller.abort();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.active?.controller.abort();
    void this.ready
      .then((runtime) => {
        for (const cloud of this.clouds.values())
          if (cloud.tree) runtime.disposeTree(cloud.tree);
        this.clouds.clear();
      })
      .catch(() => {});
    this.listeners.clear();
    this.failures.clear();
  }
  private async execute(command: BackendCommand, controller: AbortController) {
    const started = performance.now();
    this.metrics = {
      computeMs: 0,
      selectionMs: 0,
      slotMappingMs: 0,
      packingMs: 0,
      streamCopyMs: 0,
      uploadWaitMs: 0,
      uploadedBytes: 0,
      uploadBatches: 0,
      residentGaussians: this.capacity,
      activeGaussians: this.activeSlots.length,
      pinnedGaussians: 0,
      cacheHits: 0,
      cacheMisses: 0,
      evictedGaussians: 0,
    };
    const emit = (
      payload?: BackendPayload,
      error?: BackendResponse["error"],
      isFinal = false,
    ) => {
      if (this.disposed) return;
      const response = {
        command: { id: command.id, type: command.type },
        durationMs: performance.now() - started,
        metrics: { ...this.metrics },
        isFinal,
        payload,
        error,
      };
      for (const listener of this.listeners) listener(response);
    };
    const deliver = async (payload: BackendPayload) => {
      if (this.disposed) return;
      const upload = "contentVersion" in payload;
      if (payload.type === "buffers-patched")
        this.metrics.uploadedBytes += payload.patches.reduce(
          (s, p) => s + p.data.byteLength,
          0,
        );
      if (payload.type === "buffers-activated")
        this.metrics.uploadedBytes +=
          payload.addedSlots.byteLength + payload.removedSlots.byteLength;
      // Install the ACK waiter before publishing: synchronous test transports may acknowledge immediately.
      const wait = upload ? this.afterUpload?.() : undefined;
      emit(payload);
      if (upload) {
        this.metrics.uploadBatches++;
        const t = performance.now();
        await (wait ?? Promise.resolve());
        this.metrics.uploadWaitMs += performance.now() - t;
      }
    };
    try {
      const runtime = await this.ready;
      controller.signal.throwIfAborted();
      if ("sceneRevision" in command)
        this.sceneRevision = command.sceneRevision;
      if (command.type === "set-frontend-capabilities") {
        if (command.protocolVersion !== 2)
          throw new Error("Unsupported Gaussian protocol version");
        if (
          !command.capabilities.supportsCompactGaussians ||
          !command.capabilities.supportsSparkSplats
        )
          throw new Error(
            "Renderer must advertise compact geometry and Spark splat decoding support",
          );
        this.capabilities = command.capabilities;
        this.world.fromArray(command.cameraWorldMatrix);
        this.projection.fromArray(command.projectionMatrix);
        this.viewportHeight = command.viewportHeight;
        for (const value of command.cloudTransforms)
          this.clouds.get(value.cloudId)?.world.fromArray(value.worldMatrix);
        emit({
          type: "capabilities-accepted",
          protocolVersion: 2,
          supportsCachePrefetch: false,
          supportsLodRecheck: false,
        });
      } else if (
        command.type === "load-cloud" ||
        command.type === "load-cloud-from-buffer"
      ) {
        if (this.clouds.has(command.cloudId))
          throw new Error("Duplicate cloud ID");
        const options: CloudLoadOptions = {
          ...command.options,
          mipmaps: command.options?.mipmaps ??
            this.config.defaultMipmaps ?? { type: "standard" },
        };
        if (
          options.mipmaps?.type === "standard" &&
          options.mipmaps.snapshot &&
          (!Number.isSafeInteger(options.mipmaps.snapshot.maxLeaves) ||
            options.mipmaps.snapshot.maxLeaves < 1)
        )
          throw new RangeError("snapshot.maxLeaves must be positive");
        if (options.attributes?.length)
          throw new Error(
            "Upstream Spark experiment does not support source custom attributes",
          );
        let bytes: Uint8Array;
        if (command.type === "load-cloud") {
          const result = await fetch(command.url, {
            signal: controller.signal,
          });
          if (!result.ok)
            throw new Error(`Spark fetch failed: ${result.status}`);
          bytes = new Uint8Array(await result.arrayBuffer());
          options.fileName ??= command.url;
        } else bytes = new Uint8Array(command.buffer);
        controller.signal.throwIfAborted();
        const t = performance.now();
        const decoded = runtime.decode(bytes, options, controller.signal);
        this.metrics.computeMs = performance.now() - t;
        const cloud: Cloud = {
          ...decoded,
          id: command.cloudId,
          objectId: this.nextObjectId++,
          options,
          offset: 0,
          world: new Matrix4().fromArray(
            options.worldMatrix ?? new Matrix4().elements,
          ),
          priority: options.priority ?? 0,
          bounds: sparkBounds(decoded.data),
        };
        this.clouds.set(cloud.id, cloud);
        this.dirty = true;
        const bounds = this.boundsOf(cloud);
        const snapshot =
          options.mipmaps?.type === "standard" && options.mipmaps.snapshot
            ? createSparkSnapshot(
                cloud.data,
                cloud.bounds,
                options.mipmaps.snapshot.maxLeaves,
              )
            : null;
        emit({
          type: "cloud-loaded",
          cloudId: cloud.id,
          objectId: cloud.objectId,
          sourceCount: cloud.sourceCount,
          shDegree: cloud.data.maxShDegree,
          bounds,
          sourceVersion: 1,
          mipmapSnapshot: snapshot,
        });
      } else if (command.type === "unload-cloud") {
        const cloud = this.required(command.cloudId);
        if (cloud.tree) runtime.disposeTree(cloud.tree);
        this.clouds.delete(cloud.id);
        this.dirty = true;
        emit({ type: "cloud-unloaded", cloudId: cloud.id });
      } else if (command.type === "set-camera") {
        this.world.fromArray(command.worldMatrix);
        this.projection.fromArray(command.projectionMatrix);
        this.viewportHeight = command.viewportHeight;
        this.cameraRevision++;
      } else if (command.type === "set-cloud-transform")
        this.required(command.cloudId).world.fromArray(command.worldMatrix);
      else if (command.type === "set-cloud-priority")
        this.required(command.cloudId).priority = command.priority;
      else if (
        command.type === "write-attribute-range" ||
        command.type === "set-cloud-mipmaps"
      )
        throw new Error(
          `Upstream Spark experiment does not support ${command.type}; reload the cloud with new options`,
        );
      if (this.capabilities) await this.update(runtime, deliver);
      this.active = null;
      emit(undefined, undefined, true);
    } catch (error) {
      this.active = null;
      emit(
        undefined,
        {
          code: controller.signal.aborted ? "cancelled" : "spark-command-error",
          message: error instanceof Error ? error.message : String(error),
        },
        true,
      );
    }
  }
  private required(id: string): Cloud {
    const cloud = this.clouds.get(id);
    if (!cloud) throw new Error(`Unknown cloud ${id}`);
    return cloud;
  }
  private boundsOf(
    cloud: Cloud,
  ): [number, number, number, number, number, number] {
    if (!cloud.data.numSplats) return [0, 0, 0, 0, 0, 0];
    const result: [number, number, number, number, number, number] = [
      Infinity,
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
      -Infinity,
    ];
    for (let i = 0; i < cloud.data.numSplats; i++)
      if (!cloud.data.lodTree || !(cloud.data.lodTree[i * 4 + 2]! & 0xffff))
        for (let d = 0; d < 3; d++) {
          result[d] = Math.min(result[d]!, cloud.bounds[i * 6 + d]!);
          result[d + 3] = Math.max(
            result[d + 3]!,
            cloud.bounds[i * 6 + d + 3]!,
          );
        }
    return result;
  }
  private async update(
    runtime: SparkRuntime,
    deliver: (payload: BackendPayload) => Promise<void>,
  ) {
    const clouds = [...this.clouds.values()],
      degree = Math.max(0, ...clouds.map((c) => c.data.maxShDegree)) as
        0 | 1 | 2 | 3;
    const coefficientCount = (degree + 1) ** 2;
    let capacity = 0;
    for (const cloud of clouds) {
      cloud.offset = capacity;
      capacity += cloud.data.numSplats;
    }
    const bindingLimit = Math.min(
      this.capabilities!.maxBufferSize,
      this.capabilities!.maxStorageBufferBindingSize,
    );
    const objectCapacity = Math.max(1, this.nextObjectId);
    if (
      Math.max(
        capacity * 16 + objectCapacity * 160,
        capacity * (coefficientCount + 1) * 4,
      ) > bindingLimit
    )
      throw new RangeError(
        "Upstream Spark resident geometry exceeds device storage binding limits; out-of-core residency is not implemented in this experiment",
      );
    const t = performance.now();
    const trees = clouds.filter((c) => c.tree && c.data.numSplats);
    const noLod = clouds.filter((c) => !c.tree);
    const denseCount = noLod.reduce((s, c) => s + c.data.numSplats, 0);
    const budget = Math.min(capacity, this.options.maxActiveSplats ?? capacity);
    if (denseCount + trees.length > budget)
      throw new RangeError(
        "Active budget cannot contain all non-LOD splats and tree roots",
      );
    const selected = new Map<string, Uint32Array>();
    if (trees.length) {
      const viewToObjects = new Float32Array(trees.length * 16);
      for (let i = 0; i < trees.length; i++)
        viewToObjects.set(
          trees[i]!.world.clone().invert().multiply(this.world).elements,
          i * 16,
        );
      const result = runtime.traverse(
        Math.max(trees.length, budget - denseCount),
        ((this.options.pixelLimit ?? 1) * 2) /
          (Math.max(1, this.viewportHeight) *
            Math.abs(this.projection.elements[5]!)),
        new Uint32Array(trees.map((c) => c.tree!.lodId)),
        viewToObjects,
        new Float32Array(trees.map((c) => 2 ** -c.priority)),
      );
      result.instanceIndices.forEach((value, i) => {
        if (
          value.lodId !== trees[i]!.tree!.lodId ||
          value.numSplats > value.indices.length
        )
          throw new RangeError("Invalid upstream Spark traversal result");
        // Spark pads indices to a texture allocation. Only numSplats entries are active.
        selected.set(trees[i]!.id, value.indices.subarray(0, value.numSplats));
      });
    }
    for (const cloud of noLod)
      selected.set(
        cloud.id,
        Uint32Array.from({ length: cloud.data.numSplats }, (_, i) => i),
      );
    const totalActive = [...selected.values()].reduce(
      (s, ids) => s + ids.length,
      0,
    );
    const next = new Uint32Array(totalActive);
    let cursor = 0;
    const states: CloudRenderState[] = clouds.map((cloud) => {
      const indices = selected.get(cloud.id) ?? new Uint32Array();
      for (const id of indices) {
        if (id >= cloud.data.numSplats)
          throw new RangeError("Upstream traversal returned an invalid index");
        next[cursor++] = cloud.offset + id;
      }
      return {
        cloudId: cloud.id,
        objectId: cloud.objectId,
        renderedCount: indices.length,
      };
    });
    this.metrics.selectionMs = performance.now() - t;
    this.metrics.residentGaussians = capacity;
    this.metrics.activeGaussians = totalActive;
    const previous = this.activeSlots;
    let mappingStart = performance.now();
    if (this.dirty) {
      const version = ++this.contentVersion,
        layout = ++this.layoutVersion;
      const schemas = [
        { name: "mipmapLevel", format: "u32" as const, elementsPerGaussian: 1 },
        { name: "means", format: "f32" as const, elementsPerGaussian: 4 },
        {
          name: "scalesOpacity",
          format: "u32" as const,
          elementsPerGaussian: 2,
        },
        { name: "rotations", format: "u32" as const, elementsPerGaussian: 1 },
        {
          name: "shCoefficients",
          format: "u32" as const,
          elementsPerGaussian: coefficientCount,
        },
      ];
      await deliver({
        type: "buffers-allocated",
        sceneRevision: this.sceneRevision,
        layoutVersion: layout,
        contentVersion: version,
        capacity: Math.max(1, capacity),
        objectCapacity,
        shDegree: degree,
        shFormat: "spark-rgb8e8",
        sparkLodOpacity: true,
        attributes: schemas,
        clouds: states,
      });
      for (const cloud of clouds) {
        const packingStart = performance.now();
        const attributes = packSparkAttributes(
          cloud.data,
          cloud.objectId,
          degree,
        );
        this.metrics.packingMs += performance.now() - packingStart;
        const bytesPerSlot = attributes.reduce(
          (s, a) => s + a.elementsPerGaussian * 4,
          0,
        );
        const batchSlots = Math.max(
          1,
          Math.floor(
            (this.config.streaming?.maxUploadBytesPerUpdate ?? 1048576) /
              bytesPerSlot,
          ),
        );
        for (let first = 0; first < cloud.data.numSplats; first += batchSlots) {
          const count = Math.min(batchSlots, cloud.data.numSplats - first);
          const copyStart = performance.now();
          const patches = attributes.map((a: PackedAttributeBuffer) => ({
            name: a.name,
            firstSlot: cloud.offset + first,
            slotCount: count,
            data: a.data.slice(
              first * a.elementsPerGaussian * 4,
              (first + count) * a.elementsPerGaussian * 4,
            ),
          }));
          this.metrics.streamCopyMs += performance.now() - copyStart;
          const base = this.contentVersion++;
          await deliver({
            type: "buffers-patched",
            sceneRevision: this.sceneRevision,
            layoutVersion: layout,
            baseContentVersion: base,
            contentVersion: this.contentVersion,
            patches,
            changedClouds: [],
            mipmapPending: true,
          });
          if (this.disposed) return;
        }
      }
      this.capacity = capacity;
      this.dirty = false;
      this.membership = new Uint32Array(capacity);
      this.epoch = 1;
      await this.activate(next, new Uint32Array(), states, deliver);
    } else {
      const nextEpoch = this.epoch + 1;
      const additions: number[] = [],
        removals: number[] = [];
      for (const id of next) {
        if (this.membership[id] !== this.epoch) additions.push(id);
        this.membership[id] = nextEpoch;
      }
      for (const id of previous)
        if (this.membership[id] !== nextEpoch) removals.push(id);
      const added = new Uint32Array(additions),
        removed = new Uint32Array(removals);
      this.epoch = nextEpoch;
      this.metrics.cacheHits = next.length - added.length;
      this.metrics.slotMappingMs = performance.now() - mappingStart;
      if (added.length || removed.length)
        await this.activate(added, removed, states, deliver);
    }
    mappingStart = performance.now();
    if (this.membership.length !== capacity || this.epoch >= 0xfffffffe) {
      this.membership = new Uint32Array(capacity);
      this.epoch = 1;
    }
    for (const id of next) this.membership[id] = this.epoch;
    this.metrics.slotMappingMs += performance.now() - mappingStart;
    this.activeSlots = next;
  }
  private async activate(
    added: Uint32Array,
    removed: Uint32Array,
    states: CloudRenderState[],
    deliver: (payload: BackendPayload) => Promise<void>,
  ) {
    const chunk = Math.max(
      1,
      Math.floor(
        (this.config.streaming?.maxUploadBytesPerUpdate ?? 1048576) / 4,
      ),
    );
    let r = 0,
      a = 0;
    do {
      const removals = removed.slice(r, r + chunk);
      r += removals.length;
      const additions = added.slice(a, a + chunk - removals.length);
      a += additions.length;
      const base = this.contentVersion++;
      await deliver({
        type: "buffers-activated",
        sceneRevision: this.sceneRevision,
        cameraRevision: this.cameraRevision,
        layoutVersion: this.layoutVersion,
        baseContentVersion: base,
        contentVersion: this.contentVersion,
        addedSlots: additions.buffer,
        removedSlots: removals.buffer,
        commit: r === removed.length && a === added.length,
        changedClouds: states,
        mipmapPending: false,
      });
      if (this.disposed) return;
    } while (r < removed.length || a < added.length);
  }
}
