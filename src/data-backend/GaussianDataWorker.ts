import { Vector3 } from "three/webgpu";
import { CanonicalGaussianPlyLoader } from "../CanonicalGaussianPlyLoader";
import type { GaussianData } from "../GaussianData";
import { GaussianLod, type GaussianLodPacking } from "../GaussianLod";
import { GaussianOctree } from "../GaussianOctree";
import { packShRgb8e8 } from "../GaussianSh";
import { DistanceAwareRadialLodPackingStrategy } from "../lod-packing/DistanceAwareRadialLodPackingStrategy";
import type {
  GaussianBackendRequest,
  GaussianBackendResult,
  GaussianBackendPackedBuffers,
} from "./GaussianBackendProtocol";
import { createGaussianRaycastBuffers } from "./createGaussianRaycastBuffers";

interface Resource {
  lod: GaussianLod;
  packing: GaussianLodPacking | null;
}
const resources = new Map<string, Resource>();
const released = new Set<string>();
const loader = new CanonicalGaussianPlyLoader();
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<GaussianBackendRequest>) => void) | null;
  postMessage(message: GaussianBackendResult, transfer?: Transferable[]): void;
};

scope.onmessage = ({ data: request }) => {
  void handle(request).catch((error: unknown) => {
    scope.postMessage({
      type: "error",
      requestId: request.requestId,
      resourceId: request.resourceId,
      message: error instanceof Error ? error.message : String(error),
    });
  });
};

async function handle(request: GaussianBackendRequest): Promise<void> {
  if (request.type === "release") {
    released.add(request.resourceId);
    resources.get(request.resourceId)?.lod.dispose();
    resources.delete(request.resourceId);
    scope.postMessage({
      type: "released",
      requestId: request.requestId,
      resourceId: request.resourceId,
    });
    return;
  }
  if (request.type === "load-url" || request.type === "load-buffer") {
    if (resources.has(request.resourceId) || released.has(request.resourceId))
      throw new Error("Resource already exists or was released");
    const data =
      request.type === "load-url"
        ? await loader.load(request.url)
        : loader.parse(request.buffer);
    if (released.has(request.resourceId)) {
      data.dispose();
      throw new Error("Gaussian resource released during load");
    }
    let octree: GaussianOctree | null = null;
    let lod: GaussianLod | null = null;
    try {
      octree = GaussianOctree.build(data, {
        ...request.options.octree,
        ownsData: true,
      });
      lod = GaussianLod.build(octree, {
        ...request.options.lod,
        ownsOctree: true,
      });
      // A release may have been queued during an asynchronous URL fetch.
      if (resources.has(request.resourceId) || released.has(request.resourceId))
        throw new Error("Resource already exists or was released");
      resources.set(request.resourceId, { lod, packing: null });
      const { min, max } = octree.bounds;
      const raycast = createGaussianRaycastBuffers(octree);
      scope.postMessage(
        {
          type: "loaded",
          requestId: request.requestId,
          resourceId: request.resourceId,
          count: data.count,
          shDegree: data.shDegree,
          bounds: [min.x, min.y, min.z, max.x, max.y, max.z],
          raycast,
        },
        Object.values(raycast),
      );
    } catch (error) {
      if (lod !== null) lod.dispose();
      else if (octree !== null) octree.dispose();
      else data.dispose();
      throw error;
    }
    return;
  }
  const resource = resources.get(request.resourceId);
  if (resource === undefined)
    throw new Error(`Unknown Gaussian resource: ${request.resourceId}`);
  if (request.type === "select") {
    const strategy = new DistanceAwareRadialLodPackingStrategy({
      center: new Vector3(...request.center),
      levelDistance: request.levelDistance,
    });
    const packing = strategy.pack({
      lod: resource.lod,
      maxGaussians: request.maxGaussians,
    });
    const buffers = pack(resource.lod, packing);
    const renderedIndices = resource.lod.indicesForPacking(packing)
      .buffer as ArrayBuffer;
    resource.packing = packing;
    scope.postMessage(
      {
        type: "selected",
        requestId: request.requestId,
        resourceId: request.resourceId,
        revision: request.revision,
        count: packing.gaussianCount,
        shDegree: resource.lod.octree.data.shDegree,
        buffers,
        renderedIndices,
      },
      [...Object.values(buffers), renderedIndices],
    );
    return;
  }
}

function pack(
  lod: GaussianLod,
  packing: GaussianLodPacking,
): GaussianBackendPackedBuffers {
  const source: GaussianData = lod.octree.data;
  const indices = lod.indicesForPacking(packing);
  const means = new Float32Array(indices.length * 4);
  const scalesOpacity = new Float32Array(indices.length * 4);
  const rotations = new Float32Array(indices.length * 4);
  const coefficientCount = source.shCoefficientCount;
  const shCoefficients = new Uint32Array(indices.length * coefficientCount);
  const srcMeans = source.means.array as Float32Array;
  const srcScales = source.scalesOpacity.array as Float32Array;
  const srcRotations = source.rotations.array as Float32Array;
  const srcSh = source.shCoefficients.array as Float32Array;
  for (let slot = 0; slot < indices.length; slot++) {
    const index = indices[slot]!;
    means.set(srcMeans.subarray(index * 4, index * 4 + 4), slot * 4);
    scalesOpacity.set(srcScales.subarray(index * 4, index * 4 + 4), slot * 4);
    rotations.set(srcRotations.subarray(index * 4, index * 4 + 4), slot * 4);
    for (let coefficient = 0; coefficient < coefficientCount; coefficient++) {
      const offset = (index * coefficientCount + coefficient) * 4;
      shCoefficients[slot * coefficientCount + coefficient] = packShRgb8e8(
        srcSh[offset]!,
        srcSh[offset + 1]!,
        srcSh[offset + 2]!,
      );
    }
  }
  return {
    means: means.buffer,
    scalesOpacity: scalesOpacity.buffer,
    rotations: rotations.buffer,
    shCoefficients: shCoefficients.buffer,
  };
}
