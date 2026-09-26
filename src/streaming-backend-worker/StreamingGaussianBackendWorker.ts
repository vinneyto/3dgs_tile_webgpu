import { StreamingGaussianBackend } from "../streaming-backend-impl/StreamingGaussianBackend";
import type { WorkerInbound, WorkerOutbound } from "./WorkerMessages";
import { transferBuffers } from "./WorkerMessages";

const scope = globalThis as unknown as {
  onmessage: ((message: MessageEvent<WorkerInbound>) => void) | null;
  postMessage(message: WorkerOutbound, transfer?: Transferable[]): void;
};
let backend: StreamingGaussianBackend | null = null;
scope.onmessage = ({ data }) => {
  try {
    if (data.type === "initialize") {
      if (backend) throw new Error("Streaming backend already initialized");
      backend = new StreamingGaussianBackend(data.config);
      backend.subscribe((event) => {
        scope.postMessage({ type: "event", event }, transferBuffers(event));
      });
      scope.postMessage({ type: "ready" });
    } else if (data.type === "dispatch") {
      if (!backend) throw new Error("Streaming backend not initialized");
      backend.dispatch(data.command);
    } else {
      backend?.dispose();
      backend = null;
    }
  } catch (error) {
    scope.postMessage({
      type: "event",
      event: {
        type: "backend-failure",
        commandId: data.type === "dispatch" ? data.command.id : undefined,
        code: "worker-dispatch-error",
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
};

globalThis.addEventListener("unhandledrejection", (event) => {
  scope.postMessage({
    type: "event",
    event: {
      type: "backend-failure",
      code: "worker-unhandled-rejection",
      message:
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason),
    },
  });
});
