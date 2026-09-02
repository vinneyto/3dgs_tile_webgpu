import {
  createDistanceAwareLodPlanWorkspace,
  planDistanceAwareLod,
  type DistanceAwareLodPlanData,
  type DistanceAwareLodPlanWorkspace,
} from "./DistanceAwareLodPlan";
import type {
  DistanceAwareLodWorkerBufferSet,
  DistanceAwareLodWorkerMessage,
  DistanceAwareLodWorkerResultMessage,
} from "./DistanceAwareLodWorkerProtocol";

interface WorkerScope {
  onmessage:
    ((event: MessageEvent<DistanceAwareLodWorkerMessage>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}

const scope = globalThis as unknown as WorkerScope;
let data: DistanceAwareLodPlanData | null = null;
let workspace: DistanceAwareLodPlanWorkspace | null = null;
const buffers: DistanceAwareLodWorkerBufferSet[] = [];

scope.onmessage = ({ data: message }) => {
  if (message.type === "init") {
    data = message.data;
    workspace = createDistanceAwareLodPlanWorkspace(
      message.data.leafNodeIds.length,
    );
    buffers.push(...message.buffers);
    return;
  }
  if (message.type === "recycle") {
    buffers.push(message.buffer);
    return;
  }
  if (data === null || workspace === null) {
    throw new Error("Distance-aware LOD worker was not initialized");
  }
  const buffer = buffers.pop();
  if (buffer === undefined) {
    throw new Error("Distance-aware LOD worker exhausted its output pool");
  }
  const outputNodeIds = new Uint32Array(buffer.nodeIds);
  const outputLodLevels = new Uint8Array(buffer.lodLevels);
  const started = performance.now();
  const result = planDistanceAwareLod(
    data,
    message,
    outputNodeIds,
    outputLodLevels,
    workspace,
  );
  const response: DistanceAwareLodWorkerResultMessage = {
    type: "result",
    revision: message.revision,
    length: result.length,
    gaussianCount: result.gaussianCount,
    planningMs: performance.now() - started,
    buffer,
  };
  scope.postMessage(response, [buffer.nodeIds, buffer.lodLevels]);
};
