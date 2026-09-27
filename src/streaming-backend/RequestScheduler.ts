import type { BackendCommand } from "./commands/BackendCommand";
import type { GaussianBackend } from "./GaussianBackend";
import type { BackendFailure, BackendResponse } from "./BackendResponse";

export type RequestResult = "done" | "superseded";
export type SchedulerState = "waiting" | "handshaking" | "ready" | "failed";
export interface RequestScheduler {
  readonly state: SchedulerState;
  start(): void;
  schedule(command: BackendCommand): Promise<RequestResult>;
  cancel(commandId: string): void;
  onResponse(listener: (response: BackendResponse) => void): () => void;
  onFailure(listener: (failure: BackendFailure) => void): () => void;
  dispose(): void;
}

interface Pending {
  command: BackendCommand;
  resolve: (result: RequestResult) => void;
  reject: (error: Error) => void;
}

/** Exactly one in-flight request; only pending entries may be superseded. */
export class SerialRequestScheduler implements RequestScheduler {
  state: SchedulerState = "waiting";
  private readonly queue: Pending[] = [];
  private readonly responses = new Set<(response: BackendResponse) => void>();
  private readonly failures = new Set<(failure: BackendFailure) => void>();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeFailure: () => void;
  private active: Pending | null = null;
  private handshakeAccepted = false;
  private disposed = false;

  constructor(private readonly backend: GaussianBackend) {
    this.unsubscribe = backend.subscribe(this.receive);
    this.unsubscribeFailure = backend.onFailure(this.fail);
  }

  start(): void {
    if (this.disposed || this.state === "failed")
      throw new Error("RequestScheduler unavailable");
    if (this.state === "waiting") this.state = "ready";
    this.pump();
  }

  schedule(command: BackendCommand): Promise<RequestResult> {
    if (this.disposed || this.state === "failed")
      return Promise.reject(new Error("RequestScheduler unavailable"));
    return new Promise((resolve, reject) => {
      const key = command.latestKey;
      if (key !== undefined) {
        const index = this.queue.findIndex(
          (pending) => pending.command.latestKey === key,
        );
        if (index >= 0) this.queue.splice(index, 1)[0]!.resolve("superseded");
      }
      this.queue.push({ command, resolve, reject });
      this.pump();
    });
  }

  cancel(commandId: string): void {
    const index = this.queue.findIndex(
      ({ command }) => command.id === commandId,
    );
    if (index >= 0) {
      this.queue.splice(index, 1)[0]!.resolve("superseded");
    } else if (this.active?.command.id === commandId) {
      // An abort must interrupt an active fetch; it cannot wait behind that fetch.
      this.backend.abort(commandId);
    }
  }

  onResponse(listener: (response: BackendResponse) => void): () => void {
    this.responses.add(listener);
    return () => this.responses.delete(listener);
  }
  onFailure(listener: (failure: BackendFailure) => void): () => void {
    this.failures.add(listener);
    return () => this.failures.delete(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const error = new Error("RequestScheduler disposed");
    this.active?.reject(error);
    this.active = null;
    for (const pending of this.queue.splice(0)) pending.reject(error);
    this.unsubscribe();
    this.unsubscribeFailure();
    this.responses.clear();
    this.failures.clear();
    this.backend.dispose();
  }

  private pump(): void {
    if (this.disposed || this.active || this.state === "failed") return;
    const next = this.state === "ready" ? this.queue.shift() : undefined;
    if (!next) return;
    this.active = next;
    if (next.command.type === "set-frontend-capabilities") {
      this.handshakeAccepted = false;
      this.state = "handshaking";
    }
    try {
      this.backend.dispatch(next.command);
    } catch (error) {
      this.active = null;
      const failure = error instanceof Error ? error : new Error(String(error));
      next.reject(failure);
      if (next.command.type === "set-frontend-capabilities")
        this.fail({ code: "handshake-failed", message: failure.message });
      else queueMicrotask(() => this.pump());
    }
  }

  private readonly receive = (response: BackendResponse): void => {
    if (
      response.command.id !== this.active?.command.id ||
      response.command.type !== this.active.command.type ||
      (response.error !== undefined &&
        (!response.isFinal || response.payload !== undefined))
    ) {
      this.fail({
        code: "protocol-error",
        message: `Invalid response to ${response.command.id}`,
      });
      return;
    }
    if (
      this.active.command.type === "set-frontend-capabilities" &&
      response.payload?.type === "capabilities-accepted" &&
      response.payload.protocolVersion === 1
    )
      this.handshakeAccepted = true;
    for (const listener of this.responses) listener(response);
    if (!response.isFinal) return;
    const finished = this.active;
    this.active = null;
    const wasHandshake = finished.command.type === "set-frontend-capabilities";
    if (wasHandshake && !response.error && !this.handshakeAccepted) {
      const error = new Error(
        "Backend did not confirm the frontend capabilities",
      );
      finished.reject(error);
      this.fail({ code: "handshake-failed", message: error.message });
      return;
    }
    if (wasHandshake) {
      if (!response.error) this.state = "ready";
    }
    if (response.error) {
      const error = new Error(response.error.message);
      if (response.error.code === "cancelled") error.name = "AbortError";
      finished.reject(error);
      if (wasHandshake)
        this.fail({ code: response.error.code, message: error.message });
    } else {
      finished.resolve("done");
    }
    // Avoid dispatching the next command inside a backend response callback.
    queueMicrotask(() => this.pump());
  };

  private readonly fail = (failure: BackendFailure): void => {
    if (this.disposed || this.state === "failed") return;
    this.state = "failed";
    const error = new Error(failure.message);
    this.active?.reject(error);
    this.active = null;
    for (const pending of this.queue.splice(0)) pending.reject(error);
    for (const listener of this.failures) listener(failure);
  };
}
