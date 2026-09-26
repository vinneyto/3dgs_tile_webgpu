import type {
  GaussianStorePackLimits,
  GaussianStorePackStats,
  GaussianStoreSlotRange,
} from "../../renderer/GaussianStore";
import type { GaussianRaycastBuffers } from "./GaussianBackendProtocol";

export type WorkerStoreRequest =
  | {
      type: "init";
      requestId: number;
      maxGaussians: number | "auto";
      defaultStreamingLod?: {
        maxUploadBytesPerPack?: number;
        maxChangedCellsPerPack?: number;
      };
    }
  | {
      type: "load";
      requestId: number;
      cloudId: number;
      url?: string;
      buffer?: ArrayBuffer;
      name?: string;
      priority?: number;
      octree?: { leafCapacity?: number; maxDepth?: number };
      lod?: { levels?: readonly { retention: number }[] };
    }
  | { type: "pack"; requestId: number; limits: GaussianStorePackLimits }
  | {
      type: "update";
      requestId: number;
      position: readonly [number, number, number];
      transforms: readonly { cloudId: number; matrix: readonly number[] }[];
    }
  | { type: "remove"; requestId: number; cloudId: number }
  | { type: "invalidate"; requestId: number; cloudId: number }
  | { type: "enable-lod-level"; requestId: number }
  | { type: "priority"; requestId: number; cloudId: number; priority: number };

export interface WorkerStoreCloudState {
  readonly cloudId: number;
  readonly count: number;
  readonly renderedIndices: ArrayBuffer;
}

export interface WorkerStoreAttributes {
  readonly means: ArrayBuffer;
  readonly scalesOpacity: ArrayBuffer;
  readonly rotations: ArrayBuffer;
  readonly shCoefficients: ArrayBuffer;
  readonly lodLevel?: ArrayBuffer;
}

export interface WorkerStorePatch {
  readonly start: number;
  readonly count: number;
  readonly means?: ArrayBuffer;
  readonly scalesOpacity?: ArrayBuffer;
  readonly rotations?: ArrayBuffer;
  readonly shCoefficients?: ArrayBuffer;
  readonly lodLevel?: ArrayBuffer;
}

export type WorkerStoreResult =
  | { type: "initialized"; requestId: number }
  | {
      type: "loaded";
      requestId: number;
      cloudId: number;
      objectId: number;
      count: number;
      degree: 0 | 1 | 2 | 3;
      bounds: readonly [number, number, number, number, number, number];
      raycast: GaussianRaycastBuffers;
    }
  | {
      type: "packed";
      requestId: number;
      count: number;
      degree: 0 | 1 | 2 | 3;
      capacity: number;
      objectCapacity: number;
      buffers: WorkerStoreAttributes;
      clouds: readonly WorkerStoreCloudState[];
      stats: GaussianStorePackStats | null;
    }
  | {
      type: "updated";
      requestId: number;
      appliedBatches: number;
      pending: boolean;
      clouds: readonly WorkerStoreCloudState[];
      patches: readonly WorkerStorePatch[];
      clearedSlotRanges: readonly GaussianStoreSlotRange[];
      stats: GaussianStorePackStats | null;
    }
  | { type: "removed"; requestId: number; cloudId: number }
  | { type: "invalidated"; requestId: number; cloudId: number }
  | { type: "priority-set"; requestId: number; cloudId: number }
  | { type: "lod-level-enabled"; requestId: number; lodLevel?: ArrayBuffer }
  | { type: "error"; requestId: number; message: string };

/** Replace this adapter to communicate with a remote service. Payloads stay the same. */
export interface WorkerStoreTransport {
  postMessage(message: WorkerStoreRequest, transfer?: Transferable[]): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerStoreResult>) => void,
  ): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerStoreResult>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  terminate?(): void;
}
