import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type {
  BackendResponse,
  BackendFailure,
} from "../streaming-backend/BackendResponse";
import StreamingBackendWorker from "./StreamingGaussianBackendWorker?worker&inline";
import type { WorkerInbound, WorkerOutbound } from "./WorkerMessages";
import { transferBuffers } from "./WorkerMessages";

type WorkerPort = Pick<
  Worker,
  "postMessage" | "addEventListener" | "removeEventListener" | "terminate"
>;

/** Transport only. Request ordering and replacement belong to RequestScheduler. */
export class WorkerStreamingGaussianBackend implements GaussianBackend {
  private readonly listeners = new Set<(response: BackendResponse) => void>();
  private readonly failureListeners = new Set<
    (failure: BackendFailure) => void
  >();
  private readonly port: WorkerPort;
  private disposed = false;
  private readonly cancelAcknowledgements = new Set<() => void>();

  constructor(config: BackendConfig, port?: WorkerPort) {
    this.port =
      port ?? new StreamingBackendWorker({ name: "3dgs-streaming-backend" });
    this.port.addEventListener("message", this.onMessage as EventListener);
    this.port.addEventListener("error", this.onError as EventListener);
    this.port.addEventListener(
      "messageerror",
      this.onMessageError as EventListener,
    );
    this.port.postMessage({
      type: "initialize",
      config,
    } satisfies WorkerInbound);
  }

  subscribe(listener: (response: BackendResponse) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onFailure(listener: (failure: BackendFailure) => void): () => void {
    this.failureListeners.add(listener);
    return () => this.failureListeners.delete(listener);
  }

  dispatch(command: BackendCommand): void {
    if (this.disposed) throw new Error("Worker streaming backend disposed");
    this.port.postMessage(
      { type: "dispatch", command } satisfies WorkerInbound,
      transferBuffers(command),
    );
  }

  abort(commandId: string): void {
    if (this.disposed) return;
    this.port.postMessage({ type: "abort", commandId } satisfies WorkerInbound);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const cancel of this.cancelAcknowledgements) cancel();
    this.cancelAcknowledgements.clear();
    this.port.removeEventListener("message", this.onMessage as EventListener);
    this.port.removeEventListener("error", this.onError as EventListener);
    this.port.removeEventListener(
      "messageerror",
      this.onMessageError as EventListener,
    );
    this.port.postMessage({ type: "dispose" } satisfies WorkerInbound);
    this.port.terminate();
    this.listeners.clear();
    this.failureListeners.clear();
  }

  private readonly onMessage = (
    message: MessageEvent<WorkerOutbound>,
  ): void => {
    if (this.disposed) return;
    if (message.data.type === "response") {
      for (const listener of this.listeners) listener(message.data.response);
      const payload = message.data.response.payload;
      if (payload && "contentVersion" in payload)
        this.acknowledgeAfterFrame(payload.contentVersion);
    } else if (message.data.type === "failure") this.fail(message.data.failure);
  };

  private acknowledgeAfterFrame(contentVersion: number): void {
    let frame: number | undefined;
    const cancel = (): void => {
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      this.cancelAcknowledgements.delete(cancel);
    };
    const acknowledge = (): void => {
      cancel();
      if (!this.disposed)
        this.port.postMessage({
          type: "upload-ack",
          contentVersion,
        } satisfies WorkerInbound);
    };
    // A hidden tab may not receive animation frames. Keep the serial protocol
    // moving, while allowing visible tabs to render each bounded batch.
    const timer = setTimeout(
      acknowledge,
      typeof requestAnimationFrame === "function" ? 32 : 0,
    );
    this.cancelAcknowledgements.add(cancel);
    if (typeof requestAnimationFrame === "function")
      frame = requestAnimationFrame(acknowledge);
  }

  private fail(failure: BackendFailure): void {
    for (const listener of this.failureListeners) listener(failure);
  }
  private readonly onError = (event: ErrorEvent): void => {
    this.fail({
      code: "worker-error",
      message: event.message || "Worker failed",
    });
  };
  private readonly onMessageError = (): void => {
    this.fail({
      code: "worker-message-error",
      message:
        "Could not deserialize a message from the Gaussian backend worker",
    });
  };
}
