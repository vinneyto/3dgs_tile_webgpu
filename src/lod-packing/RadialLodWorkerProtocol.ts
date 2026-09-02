import type { RadialLodPlanData, RadialLodPlanRequest } from "./RadialLodPlan";

export interface RadialLodWorkerBufferSet {
  readonly nodeIds: ArrayBuffer;
  readonly lodLevels: ArrayBuffer;
}

export interface RadialLodWorkerInitMessage {
  readonly type: "init";
  readonly data: RadialLodPlanData;
  readonly buffers: readonly RadialLodWorkerBufferSet[];
}

export type RadialLodWorkerRequestMessage = RadialLodPlanRequest & {
  readonly type: "request";
  readonly revision: number;
};

export interface RadialLodWorkerRecycleMessage {
  readonly type: "recycle";
  readonly buffer: RadialLodWorkerBufferSet;
}

export type RadialLodWorkerMessage =
  | RadialLodWorkerInitMessage
  | RadialLodWorkerRequestMessage
  | RadialLodWorkerRecycleMessage;

export interface RadialLodWorkerResultMessage {
  readonly type: "result";
  readonly revision: number;
  readonly length: number;
  readonly gaussianCount: number;
  readonly planningMs: number;
  readonly buffer: RadialLodWorkerBufferSet;
}
