import { Matrix4, Vector3 } from "three";
import { packShRgb8e8 } from "./GaussianSh";
import type { AttributeInit } from "../streaming-backend/AttributeInit";
import type {
  BackendConfig,
  FrontendCapabilities,
} from "../streaming-backend/BackendConfig";
import type { CloudLoadOptions } from "../streaming-backend/CloudLoadOptions";
import type { CloudRenderState } from "../streaming-backend/CloudRenderState";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { PackedAttributeBuffer } from "../streaming-backend/PackedAttributeBuffer";
import type { PackedAttributePatch } from "../streaming-backend/PackedAttributePatch";
import type { PackingStrategy } from "../streaming-backend/PackingStrategy";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendEvent } from "../streaming-backend/events/BackendEvent";
import { DistanceAwareRadialLodPackingStrategy } from "./lod-packing/DistanceAwareRadialLodPackingStrategy";
import { MaximumLodPackingStrategy } from "./lod-packing/MaximumLodPackingStrategy";
import { RadialLodPackingStrategy } from "./lod-packing/RadialLodPackingStrategy";
import { TieredRadialLodPackingStrategy } from "./lod-packing/TieredRadialLodPackingStrategy";
import { CanonicalGaussianPlyLoader } from "./CanonicalGaussianPlyLoader";
import { createRaycastSnapshot } from "./createRaycastSnapshot";
import { CpuGaussianSource } from "./GaussianSource";
import { GaussianLod, type GaussianLodPacking } from "./GaussianLod";
import { GaussianOctree } from "./GaussianOctree";

type Values = Float32Array | Uint32Array;
interface AttributeValues {
  readonly format: "f32" | "u32";
  readonly elementsPerGaussian: number;
  readonly values: Values;
}
interface CloudEntry {
  readonly id: string;
  readonly objectId: number;
  readonly source: CpuGaussianSource;
  octree: GaussianOctree;
  lod: GaussianLod;
  readonly octreeOptions: CloudLoadOptions["octree"];
  readonly lodOptions: CloudLoadOptions["lod"];
  readonly attributes: Map<string, AttributeValues>;
  readonly transform: Matrix4;
  priority: number;
  packingStrategy: PackingStrategy;
  raycastable: boolean;
  sourceVersion: number;
}
interface PackedState {
  readonly capacity: number;
  readonly count: number;
  readonly degree: 0 | 1 | 2 | 3;
  readonly attributes: Map<string, AttributeValues>;
  readonly cells: Uint32Array;
  readonly clouds: readonly CloudRenderState[];
}

const CORE_ATTRIBUTES = new Set([
  "means",
  "scalesOpacity",
  "rotations",
  "shCoefficients",
  "lodLevel",
]);
const IDENTITY_MATRIX = new Matrix4();

/**
 * Session-local, transport-independent computation engine. The source and
 * current layout remain owned here; every emitted buffer is a separate,
 * disposable copy which a worker is free to transfer to its client.
 */
export class StreamingGaussianBackend implements GaussianBackend {
  private readonly listeners = new Set<(event: BackendEvent) => void>();
  private readonly clouds = new Map<string, CloudEntry>();
  private readonly usedCloudIds = new Set<string>();
  private readonly usedCommandIds = new Set<string>();
  private readonly cancelled = new Set<string>();
  private readonly pendingCommands = new Set<string>();
  private readonly activeLoads = new Map<string, AbortController>();
  private readonly parser = new CanonicalGaussianPlyLoader();
  private readonly config: BackendConfig;
  private work: Promise<void> = Promise.resolve();
  private nextObjectId = 0;
  private layoutVersion = 0;
  private contentVersion = 0;
  private sceneRevision = 0;
  private cameraPosition = new Vector3();
  private frontend: FrontendCapabilities | null = null;
  private requestId = "";
  private packed: PackedState | null = null;
  private target: PackedState | null = null;
  private disposed = false;

  constructor(config: BackendConfig) {
    this.config = config;
  }

  subscribe(listener: (event: BackendEvent) => void): () => void {
    if (this.disposed) throw new Error("Backend disposed");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(command: BackendCommand): void {
    if (this.disposed) throw new Error("Backend disposed");
    if (this.usedCommandIds.has(command.id))
      throw new Error(`Duplicate backend command id: ${command.id}`);
    this.usedCommandIds.add(command.id);
    if (command.type === "cancel") {
      if (this.pendingCommands.has(command.targetCommandId)) {
        this.cancelled.add(command.targetCommandId);
        this.activeLoads.get(command.targetCommandId)?.abort();
      }
      this.emit({ type: "command-completed", commandId: command.id });
      return;
    }
    this.pendingCommands.add(command.id);
    // Serialize scene mutations. Cancellation is handled outside the queue,
    // so it can interrupt a fetch or a command still waiting in the queue.
    this.work = this.work.then(async () => {
      try {
        if (this.cancelled.delete(command.id)) {
          this.emit({ type: "command-cancelled", commandId: command.id });
          return;
        }
        await this.handle(command);
      } catch (error) {
        if (this.cancelled.delete(command.id)) {
          this.emit({ type: "command-cancelled", commandId: command.id });
        } else {
          this.emit({
            type: "error",
            commandId: command.id,
            cloudId: "cloudId" in command ? command.cloudId : undefined,
            code:
              error instanceof RangeError ? "invalid-range" : "backend-error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      } finally {
        this.pendingCommands.delete(command.id);
      }
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const controller of this.activeLoads.values()) controller.abort();
    this.activeLoads.clear();
    this.listeners.clear();
    this.clouds.clear();
    this.packed = null;
    this.target = null;
  }

  private emit(event: BackendEvent): void {
    if (this.disposed) return;
    for (const listener of this.listeners) listener(event);
  }

  private async handle(
    command: Exclude<BackendCommand, { type: "cancel" }>,
  ): Promise<void> {
    switch (command.type) {
      case "load-cloud":
      case "load-cloud-from-buffer": {
        if (this.usedCloudIds.has(command.cloudId))
          throw new Error(`Cloud id already used: ${command.cloudId}`);
        const controller = new AbortController();
        this.activeLoads.set(command.id, controller);
        try {
          let source: CpuGaussianSource;
          if (command.type === "load-cloud") {
            const response = await fetch(command.url, {
              signal: controller.signal,
            });
            if (!response.ok)
              throw new Error(`PLY fetch failed: ${response.status}`);
            if (response.headers.get("content-type")?.includes("text/html"))
              throw new Error("PLY URL returned HTML instead of a PLY file");
            const buffer = await response.arrayBuffer();
            if (controller.signal.aborted)
              throw new DOMException("Load cancelled", "AbortError");
            source = this.parser.parse(buffer);
          } else {
            source = this.parser.parse(command.buffer);
          }
          const options = command.options ?? {};
          const octree = GaussianOctree.build(source, options.octree);
          const lod = GaussianLod.build(octree, options.lod);
          const entry: CloudEntry = {
            id: command.cloudId,
            objectId: this.nextObjectId++,
            source,
            octree,
            lod,
            octreeOptions: options.octree,
            lodOptions: options.lod,
            attributes: new Map(),
            transform: IDENTITY_MATRIX.clone(),
            priority: validatePriority(options.priority ?? 0),
            packingStrategy: options.packingStrategy ??
              this.config.defaultPackingStrategy ?? { type: "tiered-radial" },
            raycastable: options.raycastable ?? true,
            sourceVersion: 1,
          };
          for (const attribute of options.attributes ?? []) {
            if (
              CORE_ATTRIBUTES.has(attribute.name) ||
              entry.attributes.has(attribute.name)
            )
              throw new Error(
                `Reserved or duplicate attribute name: ${attribute.name}`,
              );
            entry.attributes.set(
              attribute.name,
              createAttribute(attribute, source.count),
            );
          }
          for (const other of this.clouds.values())
            for (const [name, attribute] of entry.attributes) {
              const existing = other.attributes.get(name);
              if (
                existing &&
                (existing.format !== attribute.format ||
                  existing.elementsPerGaussian !==
                    attribute.elementsPerGaussian)
              )
                throw new Error(
                  `Attribute schema differs across clouds: ${name}`,
                );
            }
          this.usedCloudIds.add(entry.id);
          this.clouds.set(entry.id, entry);
          const { min, max } = octree.bounds;
          this.emit({
            type: "cloud-loaded",
            commandId: command.id,
            cloudId: entry.id,
            objectId: entry.objectId,
            sourceCount: source.count,
            shDegree: source.shDegree,
            bounds: [min.x, min.y, min.z, max.x, max.y, max.z],
            raycast: entry.raycastable
              ? createRaycastSnapshot(octree)
              : undefined,
          });
          return;
        } finally {
          this.activeLoads.delete(command.id);
        }
      }
      case "unload-cloud":
        this.clouds.delete(command.cloudId);
        this.emit({
          type: "cloud-unloaded",
          commandId: command.id,
          cloudId: command.cloudId,
        });
        return;
      case "set-cloud-priority":
        this.getCloud(command.cloudId).priority = validatePriority(
          command.priority,
        );
        break;
      case "set-cloud-packing":
        {
          const entry = this.getCloud(command.cloudId);
          const previous = entry.packingStrategy;
          entry.packingStrategy = command.packingStrategy;
          try {
            this.select(entry, Math.min(entry.source.count, 1));
          } catch (error) {
            entry.packingStrategy = previous;
            throw error;
          }
        }
        break;
      case "set-cloud-transform": {
        const entry = this.getCloud(command.cloudId);
        if (command.worldMatrix.length !== 16)
          throw new RangeError("Cloud transform needs sixteen numbers");
        if (command.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = command.sceneRevision;
        entry.transform.fromArray(command.worldMatrix);
        break;
      }
      case "set-cloud-raycastable": {
        const entry = this.getCloud(command.cloudId);
        entry.raycastable = command.raycastable;
        this.emit({
          type: "cloud-raycast-changed",
          commandId: command.id,
          cloudId: entry.id,
          raycastable: entry.raycastable,
          raycast: entry.raycastable
            ? createRaycastSnapshot(entry.octree)
            : undefined,
        });
        return;
      }
      case "write-attribute-range":
        this.writeRange(command);
        break;
      case "request-gaussians":
        if (
          command.worldMatrix.length !== 16 ||
          command.projectionMatrix.length !== 16
        )
          throw new RangeError("Camera matrices need sixteen numbers each");
        if (command.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = command.sceneRevision;
        if (
          command.frontend.maxStorageBufferBindingSize <= 0 ||
          command.frontend.maxBufferSize <= 0 ||
          command.frontend.maxStorageBuffersPerShaderStage <= 0
        )
          throw new RangeError("Frontend buffer limits must be positive");
        this.frontend = command.frontend;
        this.requestId = command.id;
        this.cameraPosition.set(
          command.worldMatrix[12]!,
          command.worldMatrix[13]!,
          command.worldMatrix[14]!,
        );
        this.updateTarget();
        break;
    }
    this.emit({ type: "command-completed", commandId: command.id });
  }

  private getCloud(id: string): CloudEntry {
    const entry = this.clouds.get(id);
    if (!entry) throw new Error(`Unknown cloud: ${id}`);
    return entry;
  }

  private writeRange(
    command: Extract<BackendCommand, { type: "write-attribute-range" }>,
  ): void {
    const entry = this.getCloud(command.cloudId);
    const {
      firstGaussian: start,
      gaussianCount: count,
      attribute: name,
    } = command;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(count) ||
      start < 0 ||
      count < 0 ||
      start + count > entry.source.count
    )
      throw new RangeError("Attribute range exceeds source cloud");
    if (name === "lodLevel")
      throw new Error("lodLevel is computed by the backend");
    let target: Values;
    let elements: number;
    switch (name) {
      case "means":
        target = entry.source.means.array;
        elements = 4;
        break;
      case "scalesOpacity":
        target = entry.source.scalesOpacity.array;
        elements = 4;
        break;
      case "rotations":
        target = entry.source.rotations.array;
        elements = 4;
        break;
      case "shCoefficients":
        target = entry.source.shCoefficients.array;
        elements = entry.source.shCoefficientCount * 4;
        break;
      default: {
        const extra = entry.attributes.get(name);
        if (!extra) throw new Error(`Unknown source attribute: ${name}`);
        target = extra.values;
        elements = extra.elementsPerGaussian;
      }
    }
    if (command.data.byteLength !== count * elements * 4)
      throw new RangeError("Attribute update has the wrong byte length");
    const values =
      target instanceof Uint32Array
        ? new Uint32Array(command.data)
        : new Float32Array(command.data);
    target.set(values, start * elements);
    if (name === "means" || name === "scalesOpacity" || name === "rotations") {
      entry.octree = GaussianOctree.build(entry.source, entry.octreeOptions);
      entry.lod = GaussianLod.build(entry.octree, entry.lodOptions);
      entry.sourceVersion++;
      if (entry.raycastable) {
        const { min, max } = entry.octree.bounds;
        this.emit({
          type: "raycast-replaced",
          cloudId: entry.id,
          sourceVersion: entry.sourceVersion,
          bounds: [min.x, min.y, min.z, max.x, max.y, max.z],
          raycast: createRaycastSnapshot(entry.octree),
        });
      }
    }
  }

  private maxSlots(
    degree: number,
    extra: Map<string, AttributeValues>,
  ): number {
    if (!this.frontend) throw new Error("Frontend capabilities not supplied");
    const limit = Math.min(
      this.frontend.maxStorageBufferBindingSize,
      this.frontend.maxBufferSize,
    );
    const widths = [
      16,
      16,
      16,
      (degree + 1) ** 2 * 4,
      4,
      ...[...extra.values()].map((value) => value.elementsPerGaussian * 4),
    ];
    const supported = Math.min(
      ...widths.map((width) => Math.floor(limit / width)),
    );
    if (supported < 1)
      throw new RangeError("Frontend buffer limits are too small");
    return Math.min(
      supported,
      this.config.maxGaussians === "auto" ||
        this.config.maxGaussians === undefined
        ? supported
        : this.config.maxGaussians,
    );
  }

  private compute(reserveCapacity = 0): PackedState {
    const ordered = [...this.clouds.values()].sort(
      (a, b) => a.priority - b.priority || a.objectId - b.objectId,
    );
    const degree = ordered.reduce<0 | 1 | 2 | 3>(
      (result, entry) =>
        Math.max(result, entry.source.shDegree) as 0 | 1 | 2 | 3,
      0,
    );
    const extras = new Map<string, AttributeValues>();
    for (const entry of ordered)
      for (const [name, value] of entry.attributes) extras.set(name, value);
    let remaining = this.maxSlots(degree, extras);
    const selections: {
      entry: CloudEntry;
      indices: Uint32Array;
      levels: Uint32Array;
      cellEnds: number[];
    }[] = [];
    for (const entry of ordered) {
      const packing = this.select(
        entry,
        Math.min(remaining, entry.source.count),
      );
      const indices = entry.lod.indicesForPacking(packing);
      const levels = new Uint32Array(indices.length);
      const cellEnds: number[] = [];
      let offset = 0;
      for (let i = 0; i < packing.nodeIds.length; i++) {
        const node = entry.lod.nodes[packing.nodeIds[i]!]!;
        const level = packing.lodLevels[i]!;
        const count = node.levelCounts[level]!;
        levels.fill(level, offset, offset + count);
        offset += count;
        cellEnds.push(offset);
      }
      selections.push({ entry, indices, levels, cellEnds });
      remaining -= indices.length;
    }
    const count = selections.reduce(
      (sum, selection) => sum + selection.indices.length,
      0,
    );
    const capacity = Math.max(1, count, reserveCapacity);
    const attributes = new Map<string, AttributeValues>();
    const allocate = (
      name: string,
      format: "f32" | "u32",
      elementsPerGaussian: number,
    ) => {
      const values =
        format === "f32"
          ? new Float32Array(capacity * elementsPerGaussian)
          : new Uint32Array(capacity * elementsPerGaussian);
      attributes.set(name, { format, elementsPerGaussian, values });
      return values;
    };
    const means = allocate("means", "f32", 4);
    const scalesOpacity = allocate("scalesOpacity", "f32", 4);
    const rotations = allocate("rotations", "f32", 4);
    const sh = allocate("shCoefficients", "u32", (degree + 1) ** 2);
    const lodLevel = allocate("lodLevel", "u32", 1);
    const cells = new Uint32Array(capacity);
    for (const [name, value] of extras)
      allocate(name, value.format, value.elementsPerGaussian);
    const states: CloudRenderState[] = [];
    let slot = 0;
    let nextCellId = 1;
    for (const { entry, indices, levels, cellEnds } of selections) {
      const source = entry.source;
      const shValues = source.shCoefficients.array;
      let cellIndex = 0;
      for (let i = 0; i < indices.length; i++, slot++) {
        while (i >= cellEnds[cellIndex]!) cellIndex++;
        cells[slot] = nextCellId + cellIndex;
        const index = indices[i]!;
        (means as Float32Array).set(
          source.means.array.subarray(index * 4, index * 4 + 4),
          slot * 4,
        );
        means[slot * 4 + 3] = entry.objectId;
        (scalesOpacity as Float32Array).set(
          source.scalesOpacity.array.subarray(index * 4, index * 4 + 4),
          slot * 4,
        );
        (rotations as Float32Array).set(
          source.rotations.array.subarray(index * 4, index * 4 + 4),
          slot * 4,
        );
        lodLevel[slot] = levels[i]!;
        for (
          let coefficient = 0;
          coefficient < source.shCoefficientCount;
          coefficient++
        ) {
          const base = (index * source.shCoefficientCount + coefficient) * 4;
          sh[slot * (degree + 1) ** 2 + coefficient] = packShRgb8e8(
            shValues[base]!,
            shValues[base + 1]!,
            shValues[base + 2]!,
          );
        }
        for (const [name, value] of entry.attributes) {
          const dest = attributes.get(name)!.values;
          const size = value.elementsPerGaussian;
          dest.set(
            value.values.subarray(index * size, (index + 1) * size),
            slot * size,
          );
        }
      }
      nextCellId += cellEnds.length;
      states.push({
        cloudId: entry.id,
        objectId: entry.objectId,
        renderedCount: indices.length,
      });
    }
    return { capacity, count, degree, attributes, cells, clouds: states };
  }

  private select(entry: CloudEntry, budget: number): GaussianLodPacking {
    const center = this.cameraPosition
      .clone()
      .applyMatrix4(entry.transform.clone().invert());
    const config = entry.packingStrategy;
    switch (config.type) {
      case "maximum":
        return new MaximumLodPackingStrategy().pack({
          lod: entry.lod,
          maxGaussians: budget,
        });
      case "radial":
        return new RadialLodPackingStrategy({
          center,
          lodLevel: config.lodLevel,
        }).pack({ lod: entry.lod, maxGaussians: budget });
      case "tiered-radial":
        return new TieredRadialLodPackingStrategy({
          center,
          budgetShares: config.budgetShares,
        }).pack({ lod: entry.lod, maxGaussians: budget });
      case "distance-aware-radial":
        return new DistanceAwareRadialLodPackingStrategy({
          center,
          levelDistance: config.levelDistance,
        }).pack({ lod: entry.lod, maxGaussians: budget });
    }
  }

  private updateTarget(): void {
    if (!this.packed) {
      this.replace(this.compute());
      return;
    }
    const desired = this.compute(
      this.packed.capacity <=
        this.maxSlots(this.packed.degree, this.packed.attributes)
        ? this.packed.capacity
        : 0,
    );
    if (
      !this.frontend?.supportsPartialBufferUpdates ||
      desired.capacity !== this.packed.capacity ||
      desired.degree !== this.packed.degree ||
      [...desired.attributes].some(
        ([name, descriptor]) =>
          this.packed?.attributes.get(name)?.elementsPerGaussian !==
          descriptor.elementsPerGaussian,
      )
    ) {
      this.replace(desired);
      return;
    }
    this.target = desired;
    this.emitNextPatch();
  }

  private replace(packed: PackedState): void {
    this.packed = packed;
    this.layoutVersion++;
    this.contentVersion++;
    const attributes: PackedAttributeBuffer[] = [...packed.attributes].map(
      ([name, attribute]) => ({
        name,
        format: attribute.format,
        elementsPerGaussian: attribute.elementsPerGaussian,
        data: attribute.values.slice().buffer,
      }),
    );
    this.emit({
      type: "buffers-replaced",
      requestId: this.requestId,
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      contentVersion: this.contentVersion,
      count: packed.count,
      capacity: packed.capacity,
      objectCapacity: this.nextObjectId,
      shDegree: packed.degree,
      shFormat: "rgb8e8",
      attributes,
      clouds: packed.clouds,
    });
  }

  private emitNextPatch(): void {
    const current = this.packed!;
    const target = this.target!;
    const maxBytes =
      this.config.streamingLod?.maxUploadBytesPerUpdate ?? 1024 * 1024;
    const maxCells = Math.max(
      1,
      this.config.streamingLod?.maxChangedCellsPerUpdate ?? 16,
    );
    const bytesPerSlot = [...current.attributes.values()].reduce(
      (sum, attribute) => sum + attribute.elementsPerGaussian * 4,
      0,
    );
    const batchSlots = Math.max(1, Math.floor(maxBytes / bytesPerSlot));
    const changed: number[] = [];
    const changedCells = new Set<number>();
    for (
      let slot = 0;
      slot < current.capacity && changed.length < batchSlots;
      slot++
    ) {
      if (
        [...current.attributes].some(([name, attribute]) => {
          const other = target.attributes.get(name)!.values;
          const start = slot * attribute.elementsPerGaussian;
          for (let i = 0; i < attribute.elementsPerGaussian; i++)
            if (attribute.values[start + i] !== other[start + i]) return true;
          return false;
        })
      ) {
        const cell = target.cells[slot]!;
        if (!changedCells.has(cell) && changedCells.size >= maxCells) break;
        changedCells.add(cell);
        changed.push(slot);
      }
    }
    const patches: PackedAttributePatch[] = [];
    if (changed.length === 0) {
      const baseContentVersion = this.contentVersion++;
      this.emit({
        type: "buffers-patched",
        requestId: this.requestId,
        sceneRevision: this.sceneRevision,
        layoutVersion: this.layoutVersion,
        baseContentVersion,
        contentVersion: this.contentVersion,
        patches: [],
        changedClouds: target.clouds,
        lodPending: false,
      });
      this.packed = {
        ...current,
        count: target.count,
        clouds: target.clouds,
        cells: target.cells,
      };
      this.target = null;
      return;
    }
    for (const [name, attribute] of current.attributes) {
      const size = attribute.elementsPerGaussian;
      const dest = target.attributes.get(name)!.values;
      let first = -1;
      let previous = -1;
      const flush = () => {
        if (first < 0) return;
        const start = first * size;
        const end = (previous + 1) * size;
        attribute.values.set(dest.subarray(start, end), start);
        patches.push({
          name,
          firstSlot: first,
          slotCount: previous - first + 1,
          data: dest.slice(start, end).buffer,
        });
        first = -1;
      };
      for (const slot of changed) {
        const start = slot * size;
        let differs = false;
        for (let component = 0; component < size; component++)
          if (attribute.values[start + component] !== dest[start + component]) {
            differs = true;
            break;
          }
        if (!differs) {
          flush();
          continue;
        }
        if (first < 0) first = slot;
        else if (slot !== previous + 1) {
          flush();
          first = slot;
        }
        previous = slot;
      }
      flush();
    }
    const pending = [...current.attributes].some(([name, attr]) => {
      const other = target.attributes.get(name)!.values;
      return attr.values.some((value, index) => value !== other[index]);
    });
    const baseContentVersion = this.contentVersion++;
    this.emit({
      type: "buffers-patched",
      requestId: this.requestId,
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      baseContentVersion,
      contentVersion: this.contentVersion,
      patches,
      changedClouds: pending ? current.clouds : target.clouds,
      lodPending: pending,
    });
    if (!pending) {
      this.packed = {
        ...current,
        count: target.count,
        clouds: target.clouds,
        cells: target.cells,
      };
      this.target = null;
    }
  }
}

function validatePriority(priority: number): number {
  if (!Number.isSafeInteger(priority))
    throw new RangeError("Priority must be a safe integer");
  return priority;
}

function createAttribute(input: AttributeInit, count: number): AttributeValues {
  const elements = input.elementsPerGaussian;
  if (!Number.isSafeInteger(elements) || elements < 1)
    throw new RangeError("Attribute elementsPerGaussian must be positive");
  const length = count * elements;
  const values =
    input.format === "f32" ? new Float32Array(length) : new Uint32Array(length);
  if (input.source.kind === "fill")
    values.fill(input.source.value === "ones" ? 1 : 0);
  else {
    if (input.source.data.byteLength !== length * 4)
      throw new RangeError("Attribute buffer has the wrong byte length");
    values.set(
      input.format === "f32"
        ? new Float32Array(input.source.data)
        : new Uint32Array(input.source.data),
    );
  }
  return { format: input.format, elementsPerGaussian: elements, values };
}
