import type {
  DistanceAwareLodPlanData,
  DistanceAwareLodPlanRequest,
} from "./DistanceAwareLodPlan";

export interface DistanceAwareLodWorkerBufferSet {
  readonly nodeIds: ArrayBuffer;
  readonly lodLevels: ArrayBuffer;
}

export interface DistanceAwareLodWorkerInitMessage {
  readonly type: "init";
  readonly data: DistanceAwareLodPlanData;
  readonly buffers: readonly DistanceAwareLodWorkerBufferSet[];
}

export interface DistanceAwareLodWorkerRequestMessage extends DistanceAwareLodPlanRequest {
  readonly type: "request";
  readonly revision: number;
}

export interface DistanceAwareLodWorkerRecycleMessage {
  readonly type: "recycle";
  readonly buffer: DistanceAwareLodWorkerBufferSet;
}

export type DistanceAwareLodWorkerMessage =
  | DistanceAwareLodWorkerInitMessage
  | DistanceAwareLodWorkerRequestMessage
  | DistanceAwareLodWorkerRecycleMessage;

export interface DistanceAwareLodWorkerResultMessage {
  readonly type: "result";
  readonly revision: number;
  readonly length: number;
  readonly gaussianCount: number;
  readonly planningMs: number;
  readonly buffer: DistanceAwareLodWorkerBufferSet;
}
