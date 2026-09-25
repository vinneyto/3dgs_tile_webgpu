import { Matrix4, PerspectiveCamera } from "three/webgpu";
import { GaussianStore } from "../GaussianStore";
import type { GaussianCloud } from "../GaussianCloud";
import { CanonicalGaussianPlyLoader } from "../CanonicalGaussianPlyLoader";
import { GaussianOctree } from "../GaussianOctree";
import { GaussianLod } from "../GaussianLod";
import { createGaussianRaycastBuffers } from "./createGaussianRaycastBuffers";
import type {
  WorkerStoreAttributes,
  WorkerStoreCloudState,
  WorkerStorePatch,
  WorkerStoreRequest,
  WorkerStoreResult,
} from "./WorkerGaussianStoreProtocol";

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerStoreRequest>) => void) | null;
  postMessage(message: WorkerStoreResult, transfer?: Transferable[]): void;
};
let store: GaussianStore | null = null;
const clouds = new Map<number, GaussianCloud>();
const camera = new PerspectiveCamera();

scope.onmessage = ({ data: request }) => {
  void handle(request).catch((error: unknown) => {
    scope.postMessage({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error),
    });
  });
};

async function handle(request: WorkerStoreRequest): Promise<void> {
  if (request.type === "init") {
    if (store !== null) throw new Error("Gaussian Store already initialized");
    store = new GaussianStore({
      maxGaussians: request.maxGaussians,
      defaultStreamingLod: request.defaultStreamingLod,
    });
    scope.postMessage({ type: "initialized", requestId: request.requestId });
    return;
  }
  const activeStore = store;
  if (activeStore === null)
    throw new Error("Gaussian Store is not initialized");
  if (request.type === "load") {
    if (clouds.has(request.cloudId))
      throw new Error("Gaussian cloud already exists");
    // Use a blob URL for an input buffer only through the parser; no data comes back to the UI except raycast buffers.
    const cloud =
      request.buffer !== undefined
        ? await loadBuffer(request.buffer, request)
        : await activeStore.load(request.url!, {
            name: request.name,
            priority: request.priority,
            octree: request.octree,
            lod: request.lod,
          });
    clouds.set(request.cloudId, cloud);
    const octree = cloud.lod!.octree;
    const { min, max } = octree.bounds;
    const raycast = createGaussianRaycastBuffers(octree);
    scope.postMessage(
      {
        type: "loaded",
        requestId: request.requestId,
        cloudId: request.cloudId,
        objectId: cloud.objectId,
        count: octree.data.count,
        degree: octree.data.shDegree,
        bounds: [min.x, min.y, min.z, max.x, max.y, max.z],
        raycast,
      },
      Object.values(raycast),
    );
    return;
  }
  if (request.type === "remove") {
    const cloud = clouds.get(request.cloudId);
    if (cloud !== undefined) {
      activeStore.remove(cloud);
      clouds.delete(request.cloudId);
    }
    scope.postMessage({
      type: "removed",
      requestId: request.requestId,
      cloudId: request.cloudId,
    });
    return;
  }
  if (request.type === "priority") {
    const cloud = clouds.get(request.cloudId);
    if (cloud === undefined) throw new Error("Unknown Gaussian cloud");
    cloud.packingPriority = request.priority;
    scope.postMessage({
      type: "priority-set",
      requestId: request.requestId,
      cloudId: request.cloudId,
    });
    return;
  }
  if (request.type === "invalidate") {
    const cloud = clouds.get(request.cloudId);
    if (cloud === undefined) throw new Error("Unknown Gaussian cloud");
    cloud.invalidatePacking();
    scope.postMessage({
      type: "invalidated",
      requestId: request.requestId,
      cloudId: request.cloudId,
    });
    return;
  }
  if (request.type === "enable-lod-level") {
    const attribute = activeStore.enablePackedLodLevelAttribute();
    const lodLevel = attribute.isAllocated
      ? attribute.array.slice().buffer
      : undefined;
    scope.postMessage(
      { type: "lod-level-enabled", requestId: request.requestId, lodLevel },
      lodLevel === undefined ? [] : [lodLevel],
    );
    return;
  }
  if (request.type === "pack") {
    activeStore.pack({ limits: request.limits });
    const data = activeStore.getPackedData();
    const buffers = copyAttributes(data);
    const states = cloudStates();
    scope.postMessage(
      {
        type: "packed",
        requestId: request.requestId,
        count: data.count,
        degree: data.shDegree,
        capacity: activeStore.maxGaussians,
        objectCapacity: activeStore.objectCapacity,
        buffers,
        clouds: states,
        stats: activeStore.lastPackStats,
      },
      [
        ...Object.values(buffers).filter(
          (value): value is ArrayBuffer => value !== undefined,
        ),
        ...states.map(({ renderedIndices }) => renderedIndices),
      ],
    );
    return;
  }
  camera.position.set(...request.position);
  camera.updateWorldMatrix(true, false);
  for (const { cloudId, matrix } of request.transforms) {
    const cloud = clouds.get(cloudId);
    if (cloud === undefined) continue;
    cloud.matrixAutoUpdate = false;
    cloud.matrix.copy(new Matrix4().fromArray(matrix));
  }
  const result = activeStore.updateLod(camera);
  const patches: WorkerStorePatch[] = [];
  if (result.appliedBatches > 0) {
    const data = activeStore.getPackedData();
    const ranges = mergeRanges(result.writtenSlotRanges ?? []);
    for (const range of ranges)
      patches.push(patchForRange(data, range.start, range.count));
    const cleared = mergeRanges(result.clearedSlotRanges ?? []);
    for (const range of cleared) {
      patches.push({
        start: range.start,
        count: range.count,
        scalesOpacity: (data.scalesOpacity.array as Float32Array).slice(
          range.start * 4,
          (range.start + range.count) * 4,
        ).buffer,
      });
    }
  }
  const states = result.appliedBatches > 0 ? cloudStates() : [];
  scope.postMessage(
    {
      type: "updated",
      requestId: request.requestId,
      appliedBatches: result.appliedBatches,
      pending: result.pending,
      clouds: states,
      patches,
      clearedSlotRanges: result.clearedSlotRanges ?? [],
      stats: activeStore.lastPackStats,
    },
    [
      ...patches.flatMap(
        ({ means, scalesOpacity, rotations, shCoefficients, lodLevel }) =>
          [means, scalesOpacity, rotations, shCoefficients, lodLevel].filter(
            (value): value is ArrayBuffer => value !== undefined,
          ),
      ),
      ...states.map(({ renderedIndices }) => renderedIndices),
    ],
  );
}

async function loadBuffer(
  buffer: ArrayBuffer,
  request: Extract<WorkerStoreRequest, { type: "load" }>,
): Promise<GaussianCloud> {
  const data = new CanonicalGaussianPlyLoader().parse(buffer);
  let octree: GaussianOctree | null = null;
  let lod: GaussianLod | null = null;
  try {
    octree = GaussianOctree.build(data, { ...request.octree, ownsData: true });
    lod = GaussianLod.build(octree, { ...request.lod, ownsOctree: true });
    if (store === null) throw new Error("Gaussian Store is not initialized");
    return store.addLod(lod, {
      name: request.name,
      priority: request.priority,
      ownsLod: true,
    });
  } catch (error) {
    if (lod !== null) lod.dispose();
    else if (octree !== null) octree.dispose();
    else data.dispose();
    throw error;
  }
}

function cloudStates(): WorkerStoreCloudState[] {
  return [...clouds].map(([cloudId, cloud]) => ({
    cloudId,
    count: cloud.gaussianCount,
    renderedIndices:
      cloud.lodPacking === null
        ? new ArrayBuffer(0)
        : (cloud.lod!.indicesForPacking(cloud.lodPacking)
            .buffer as ArrayBuffer),
  }));
}

function copyAttributes(
  data: ReturnType<GaussianStore["getPackedData"]>,
): WorkerStoreAttributes {
  return {
    means: (data.means.array as Float32Array).slice().buffer,
    scalesOpacity: (data.scalesOpacity.array as Float32Array).slice().buffer,
    rotations: (data.rotations.array as Float32Array).slice().buffer,
    shCoefficients: (data.shCoefficients.array as Uint32Array).slice().buffer,
    lodLevel: store?.attributes.get("lodLevel")?.array.slice().buffer,
  };
}

function patchForRange(
  data: ReturnType<GaussianStore["getPackedData"]>,
  start: number,
  count: number,
): WorkerStorePatch {
  const end = start + count;
  return {
    start,
    count,
    means: (data.means.array as Float32Array).slice(start * 4, end * 4).buffer,
    scalesOpacity: (data.scalesOpacity.array as Float32Array).slice(
      start * 4,
      end * 4,
    ).buffer,
    rotations: (data.rotations.array as Float32Array).slice(start * 4, end * 4)
      .buffer,
    shCoefficients: (data.shCoefficients.array as Uint32Array).slice(
      start * data.shCoefficientCount,
      end * data.shCoefficientCount,
    ).buffer,
    lodLevel: store?.attributes.get("lodLevel")?.array.slice(start, end).buffer,
  };
}

function mergeRanges(
  ranges: readonly { start: number; count: number }[],
): { start: number; count: number }[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const result: { start: number; count: number }[] = [];
  for (const range of sorted) {
    const last = result[result.length - 1];
    if (last !== undefined && range.start <= last.start + last.count) {
      last.count =
        Math.max(last.start + last.count, range.start + range.count) -
        last.start;
    } else result.push({ ...range });
  }
  return result;
}
