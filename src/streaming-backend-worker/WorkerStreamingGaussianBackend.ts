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
type SceneCommand = Extract<
  BackendCommand,
  { type: "set-camera" | "set-cloud-transform" }
>;

/** Client-side endpoint: messages only, no computation or GPU objects. */
export class WorkerStreamingGaussianBackend implements GaussianBackend {
  private readonly listeners = new Set<(event: BackendEvent) => void>();
  private readonly port: WorkerPort;
  private disposed = false;
  private readonly sceneInFlight = new Set<string>();
  private readonly pendingScene = new Map<string, SceneCommand>();
  private sceneFlushScheduled = false;

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
    if (
      command.type === "set-camera" ||
      command.type === "set-cloud-transform"
    ) {
      const key =
        command.type === "set-camera" ? "camera" : `cloud:${command.cloudId}`;
      const previous = this.pendingScene.get(key);
      if (previous)
        this.emit({ type: "command-cancelled", commandId: previous.id });
      this.pendingScene.set(key, command);
      this.scheduleSceneFlush();
      return;
    }
    if (command.type === "cancel") {
      for (const [key, pending] of this.pendingScene) {
        if (pending.id !== command.targetCommandId) continue;
        this.pendingScene.delete(key);
        this.emit({ type: "command-cancelled", commandId: pending.id });
        this.emit({ type: "command-completed", commandId: command.id });
        return;
      }
    }
    // A structural command is a barrier: earlier scene updates must precede it.
    if (command.type !== "cancel") this.flushScene(true);
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
    this.pendingScene.clear();
    this.sceneInFlight.clear();
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
      typeof event.commandId === "string" &&
      (event.type === "command-completed" ||
        event.type === "command-cancelled" ||
        event.type === "error") &&
      this.sceneInFlight.delete(event.commandId) &&
      this.sceneInFlight.size === 0
    ) {
      this.scheduleSceneFlush();
    }
  };

  private scheduleSceneFlush(): void {
    if (this.sceneFlushScheduled || this.disposed || this.sceneInFlight.size)
      return;
    this.sceneFlushScheduled = true;
    queueMicrotask(() => {
      this.sceneFlushScheduled = false;
      if (!this.disposed) this.flushScene(false);
    });
  }

  private flushScene(force: boolean): void {
    if (!force && this.sceneInFlight.size) return;
    const commands = [...this.pendingScene.values()];
    this.pendingScene.clear();
    // Transforms and camera in the same revision should reach the worker together.
    commands.sort(
      (left, right) =>
        left.sceneRevision - right.sceneRevision ||
        (left.type === "set-camera" ? 1 : right.type === "set-camera" ? -1 : 0),
    );
    for (const command of commands) {
      this.sceneInFlight.add(command.id);
      this.port.postMessage({
        type: "dispatch",
        command,
      } satisfies WorkerInbound);
    }
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
