import { PerspectiveCamera } from "three/webgpu";
import type { GaussianData } from "../../src/renderer/GaussianData";
import { GaussianStore } from "../../src/renderer/GaussianStore";
import { packShRgb8e8 } from "../../src/streaming-backend-impl/GaussianSh";
import type { GaussianBackend } from "../../src/streaming-backend/GaussianBackend";
import type { BackendEvent } from "../../src/streaming-backend/events/BackendEvent";
import type { GaussianCloud } from "../../src/renderer/GaussianCloud";

export const TEST_FRONTEND = {
  maxStorageBufferBindingSize: 1_073_741_824,
  maxBufferSize: 1_073_741_824,
  maxStorageBuffersPerShaderStage: 8,
  supportsPartialBufferUpdates: true,
};

/** A protocol endpoint for renderer tests, with no old Store or CPU LOD path. */
export function packedStore(
  data: GaussianData,
  ready = true,
): {
  store: GaussianStore;
  cloud: GaussianCloud;
  add: (data: GaussianData) => GaussianCloud;
  request: () => void;
} {
  let listener: ((event: BackendEvent) => void) | null = null;
  const sources: GaussianData[] = [];
  let version = 0;
  let pendingReplacement = false;
  const emit = (event: BackendEvent) => listener?.(event);
  const backend: GaussianBackend = {
    subscribe: (callback) => {
      listener = callback;
      return () => {
        listener = null;
      };
    },
    dispose: () => {
      listener = null;
    },
    dispatch: (command) => {
      if (command.type === "load-cloud-from-buffer") {
        const objectId = sources.length;
        const source = pending.shift()!;
        sources.push(source);
        pendingReplacement = true;
        emit({
          type: "cloud-loaded",
          commandId: command.id,
          cloudId: command.cloudId,
          objectId,
          sourceCount: source.count,
          shDegree: source.shDegree,
          bounds: [0, 0, 0, 0, 0, 0],
        });
      } else if (command.type === "request-gaussians") {
        if (!pendingReplacement) {
          emit({ type: "command-completed", commandId: command.id });
          return;
        }
        pendingReplacement = false;
        const count = sources.reduce((sum, source) => sum + source.count, 0);
        const degree = Math.max(
          0,
          ...sources.map((source) => source.shDegree),
        ) as 0 | 1 | 2 | 3;
        const capacity = Math.max(1, count);
        const coefficients = (degree + 1) ** 2;
        const means = new Float32Array(capacity * 4);
        const scales = new Float32Array(capacity * 4);
        const rotations = new Float32Array(capacity * 4);
        const sh = new Uint32Array(capacity * coefficients);
        let offset = 0;
        for (const [objectId, source] of sources.entries()) {
          const sourceSh = source.shCoefficients.array as Float32Array;
          for (let i = 0; i < source.count; i++) {
            means.set(
              (source.means.array as Float32Array).subarray(i * 4, i * 4 + 4),
              (offset + i) * 4,
            );
            means[(offset + i) * 4 + 3] = objectId;
            scales.set(
              (source.scalesOpacity.array as Float32Array).subarray(
                i * 4,
                i * 4 + 4,
              ),
              (offset + i) * 4,
            );
            rotations.set(
              (source.rotations.array as Float32Array).subarray(
                i * 4,
                i * 4 + 4,
              ),
              (offset + i) * 4,
            );
            for (let j = 0; j < source.shCoefficientCount; j++) {
              const base = (i * source.shCoefficientCount + j) * 4;
              sh[(offset + i) * coefficients + j] = packShRgb8e8(
                sourceSh[base]!,
                sourceSh[base + 1]!,
                sourceSh[base + 2]!,
              );
            }
          }
          offset += source.count;
        }
        emit({
          type: "buffers-replaced",
          requestId: command.id,
          sceneRevision: command.sceneRevision,
          layoutVersion: ++version,
          contentVersion: version,
          count,
          capacity,
          objectCapacity: sources.length,
          shDegree: degree,
          shFormat: "rgb8e8",
          attributes: [
            {
              name: "means",
              format: "f32",
              elementsPerGaussian: 4,
              data: means.buffer,
            },
            {
              name: "scalesOpacity",
              format: "f32",
              elementsPerGaussian: 4,
              data: scales.buffer,
            },
            {
              name: "rotations",
              format: "f32",
              elementsPerGaussian: 4,
              data: rotations.buffer,
            },
            {
              name: "shCoefficients",
              format: "u32",
              elementsPerGaussian: coefficients,
              data: sh.buffer,
            },
            {
              name: "lodLevel",
              format: "u32",
              elementsPerGaussian: 1,
              data: new Uint32Array(capacity).buffer,
            },
          ],
          clouds: sources.map((source, objectId) => ({
            cloudId: `cloud-${objectId + 1}`,
            objectId,
            renderedCount: source.count,
          })),
        });
        emit({ type: "command-completed", commandId: command.id });
      }
    },
  };
  const pending: GaussianData[] = [];
  const store = new GaussianStore(backend);
  const add = (source: GaussianData): GaussianCloud => {
    pending.push(source);
    void store.loadBuffer(new ArrayBuffer(0));
    return store.clouds.at(-1)!;
  };
  const cloud = add(data);
  const request = () => {
    store.updateLod(new PerspectiveCamera(), TEST_FRONTEND);
  };
  if (ready) request();
  return { store, cloud, add, request };
}
