import {
  createRadialLodPlanWorkspace,
  planRadialLod,
  type RadialLodPlanData,
  type RadialLodPlanWorkspace,
} from "./RadialLodPlan";
import type {
  RadialLodWorkerBufferSet,
  RadialLodWorkerMessage,
  RadialLodWorkerResultMessage,
} from "./RadialLodWorkerProtocol";

interface WorkerScope {
  onmessage: ((event: MessageEvent<RadialLodWorkerMessage>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}

const scope = globalThis as unknown as WorkerScope;
let data: RadialLodPlanData | null = null;
let workspace: RadialLodPlanWorkspace | null = null;
const buffers: RadialLodWorkerBufferSet[] = [];

scope.onmessage = ({ data: message }) => {
  if (message.type === "init") {
    data = message.data;
    workspace = createRadialLodPlanWorkspace(message.data.leafNodeIds.length);
    buffers.push(...message.buffers);
    return;
  }
  if (message.type === "recycle") {
    buffers.push(message.buffer);
    return;
  }
  if (data === null || workspace === null) {
    throw new Error("Radial LOD worker was not initialized");
  }
  const buffer = buffers.pop();
  if (buffer === undefined) {
    throw new Error("Radial LOD worker exhausted its output pool");
  }
  const outputNodeIds = new Uint32Array(buffer.nodeIds);
  const outputLodLevels = new Uint8Array(buffer.lodLevels);
  const started = performance.now();
  const result = planRadialLod(
    data,
    message,
    outputNodeIds,
    outputLodLevels,
    workspace,
  );
  const response: RadialLodWorkerResultMessage = {
    type: "result",
    revision: message.revision,
    length: result.length,
    gaussianCount: result.gaussianCount,
    planningMs: performance.now() - started,
    buffer,
  };
  scope.postMessage(response, [buffer.nodeIds, buffer.lodLevels]);
};
