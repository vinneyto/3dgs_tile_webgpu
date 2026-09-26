import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendEvent } from "../streaming-backend/events/BackendEvent";
import StreamingBackendWorker from "./StreamingGaussianBackendWorker?worker&inline";
import type { WorkerInbound, WorkerOutbound } from "./WorkerMessages";
import { transferBuffers } from "./WorkerMessages";

type WorkerPort = Pick<
  Worker,
  "postMessage" | "addEventListener" | "removeEventListener" | "terminate"
>;

/** Client-side endpoint: messages only, no computation or GPU objects. */
export class WorkerStreamingGaussianBackend implements GaussianBackend {
  private readonly listeners = new Set<(event: BackendEvent) => void>();
  private readonly port: WorkerPort;
  private disposed = false;
  private cameraInFlight: string | null = null;
  private pendingCamera: Extract<
    BackendCommand,
    { type: "set-camera" }
  > | null = null;

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

  subscribe(listener: (event: BackendEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(command: BackendCommand): void {
    if (this.disposed) throw new Error("Worker streaming backend disposed");
    if (command.type === "set-camera" && this.cameraInFlight) {
      if (this.pendingCamera) {
        this.emit({
          type: "command-cancelled",
          commandId: this.pendingCamera.id,
        });
      }
      this.pendingCamera = command;
      return;
    }
    if (
      command.type === "cancel" &&
      this.pendingCamera?.id === command.targetCommandId
    ) {
      this.pendingCamera = null;
      this.emit({
        type: "command-cancelled",
        commandId: command.targetCommandId,
      });
      this.emit({ type: "command-completed", commandId: command.id });
      return;
    }
    // A scene mutation cannot overtake an earlier camera command.
    if (command.type !== "cancel") this.flushPendingCamera();
    if (command.type === "set-camera") this.cameraInFlight = command.id;
    this.port.postMessage(
      { type: "dispatch", command } satisfies WorkerInbound,
      transferBuffers(command),
    );
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.port.removeEventListener("message", this.onMessage as EventListener);
    this.port.removeEventListener("error", this.onError as EventListener);
    this.port.removeEventListener(
      "messageerror",
      this.onMessageError as EventListener,
    );
    this.port.postMessage({ type: "dispose" } satisfies WorkerInbound);
    this.port.terminate();
    this.pendingCamera = null;
    this.listeners.clear();
  }

  private readonly onMessage = (
    message: MessageEvent<WorkerOutbound>,
  ): void => {
    if (this.disposed || message.data.type !== "event") return;
    const event = message.data.event;
    this.emit(event);
    if (
      "commandId" in event &&
      event.commandId === this.cameraInFlight &&
      (event.type === "command-completed" ||
        event.type === "command-cancelled" ||
        event.type === "error")
    ) {
      this.cameraInFlight = null;
      this.flushPendingCamera();
    }
  };

  private flushPendingCamera(): void {
    if (!this.pendingCamera) return;
    const camera = this.pendingCamera;
    this.pendingCamera = null;
    this.cameraInFlight = camera.id;
    this.port.postMessage({
      type: "dispatch",
      command: camera,
    } satisfies WorkerInbound);
  }

  private emit(event: BackendEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private readonly onError = (event: ErrorEvent): void => {
    const error: BackendEvent = {
      type: "backend-failure",
      code: "worker-error",
      message: event.message || "Worker failed",
    };
    for (const listener of this.listeners) listener(error);
  };

  private readonly onMessageError = (): void => {
    const error: BackendEvent = {
      type: "backend-failure",
      code: "worker-message-error",
      message:
        "Could not deserialize a message from the Gaussian backend worker",
    };
    for (const listener of this.listeners) listener(error);
  };
}
