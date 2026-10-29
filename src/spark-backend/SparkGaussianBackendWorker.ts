import { SparkGaussianBackend } from "./SparkGaussianBackend";
import type {
  WorkerInbound,
  WorkerOutbound,
} from "../streaming-backend-worker/WorkerMessages";
import { transferBuffers } from "../streaming-backend-worker/WorkerMessages";

const scope = globalThis as unknown as {
  onmessage: ((message: MessageEvent<WorkerInbound>) => void) | null;
  postMessage(message: WorkerOutbound, transfer?: Transferable[]): void;
};
let backend: SparkGaussianBackend | null = null;
let uploadVersion = 0;
let uploadDone: (() => void) | null = null;
scope.onmessage = ({ data }) => {
  try {
    if (data.type === "initialize") {
      if (backend) throw new Error("Streaming backend already initialized");
      backend = new SparkGaussianBackend(
        data.config,
        () =>
          new Promise<void>((resolve) => {
            uploadDone = resolve;
          }),
      );
      backend.subscribe((response) => {
        if (response.payload && "contentVersion" in response.payload)
          uploadVersion = response.payload.contentVersion;
        scope.postMessage(
          { type: "response", response },
          transferBuffers(response),
        );
      });
    } else if (data.type === "dispatch") {
      if (!backend) throw new Error("Streaming backend not initialized");
      backend.dispatch(data.command);
    } else if (data.type === "upload-ack") {
      if (data.contentVersion === uploadVersion) {
        const done = uploadDone;
        uploadDone = null;
        done?.();
      }
    } else if (data.type === "abort") {
      backend?.abort(data.commandId);
    } else {
      backend?.dispose();
      uploadDone?.();
      uploadDone = null;
      backend = null;
    }
  } catch (error) {
    scope.postMessage({
      type: "failure",
      failure: {
        code: "worker-dispatch-error",
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
};

globalThis.addEventListener("unhandledrejection", (event) => {
  scope.postMessage({
    type: "failure",
    failure: {
      code: "worker-unhandled-rejection",
      message:
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason),
    },
  });
});
