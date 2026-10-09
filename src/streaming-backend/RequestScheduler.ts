import type { BackendCommand } from "./commands/BackendCommand";
import type { GaussianBackend } from "./GaussianBackend";
import type { BackendFailure, BackendResponse } from "./BackendResponse";

export type RequestResult = "done" | "superseded";
export type SchedulerState = "waiting" | "ready" | "failed";

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

/** Exactly one in-flight command; only queued commands may be superseded. */
export class SerialRequestScheduler implements RequestScheduler {
  state: SchedulerState = "waiting";
  private readonly queue: Pending[] = [];
  private readonly responses = new Set<(response: BackendResponse) => void>();
  private readonly failures = new Set<(failure: BackendFailure) => void>();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeFailure: () => void;
  private active: Pending | null = null;
  private disposed = false;

  constructor(private readonly backend: GaussianBackend) {
    this.unsubscribe = backend.subscribe(this.receive);
    this.unsubscribeFailure = backend.onFailure(this.fail);
  }

  start(): void {
    if (this.disposed || this.state === "failed") {
      throw new Error("RequestScheduler unavailable");
    }

    this.state = "ready";
    this.pump();
  }

  schedule(command: BackendCommand): Promise<RequestResult> {
    if (this.disposed || this.state === "failed") {
      return Promise.reject(new Error("RequestScheduler unavailable"));
    }

    return new Promise((resolve, reject) => {
      if (command.latestKey !== undefined) {
        const index = this.queue.findIndex(
          (pending) => pending.command.latestKey === command.latestKey,
        );

        if (index >= 0) {
          const [superseded] = this.queue.splice(index, 1);
          superseded!.resolve("superseded");
        }
      }

      const pending = { command, resolve, reject };
      const prefetch = this.queue.findIndex(
        (p) => p.command.type === "prefetch-cache",
      );
      if (command.type !== "prefetch-cache" && prefetch >= 0)
        this.queue.splice(prefetch, 0, pending);
      else this.queue.push(pending);
      this.pump();
    });
  }

  cancel(commandId: string): void {
    const index = this.queue.findIndex(
      (pending) => pending.command.id === commandId,
    );

    if (index >= 0) {
      const [cancelled] = this.queue.splice(index, 1);
      cancelled!.resolve("superseded");
    } else if (this.active?.command.id === commandId) {
      // An active fetch must be interrupted without waiting for the queue.
      this.backend.abort(commandId);
    }
  }

  onResponse(listener: (response: BackendResponse) => void): () => void {
    this.responses.add(listener);
    return () => {
      this.responses.delete(listener);
    };
  }

  onFailure(listener: (failure: BackendFailure) => void): () => void {
    this.failures.add(listener);
    return () => {
      this.failures.delete(listener);
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    const error = new Error("RequestScheduler disposed");
    this.active?.reject(error);
    this.active = null;
    for (const pending of this.queue.splice(0)) {
      pending.reject(error);
    }
    this.unsubscribe();
    this.unsubscribeFailure();
    this.responses.clear();
    this.failures.clear();
    this.backend.dispose();
  }

  private pump(): void {
    if (this.disposed || this.state !== "ready" || this.active) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    this.active = next;
    try {
      this.backend.dispatch(next.command);
    } catch (error) {
      this.active = null;
      next.reject(error instanceof Error ? error : new Error(String(error)));
      queueMicrotask(() => this.pump());
    }
  }

  private readonly receive = (response: BackendResponse): void => {
    if (this.disposed || this.state === "failed") {
      return;
    }

    for (const listener of this.responses) {
      listener(response);
    }

    if (!response.isFinal || response.command.id !== this.active?.command.id) {
      return;
    }

    const finished = this.active;
    this.active = null;
    if (response.error) {
      const error = new Error(response.error.message);
      if (response.error.code === "cancelled") {
        error.name = "AbortError";
      }
      finished.reject(error);
    } else {
      finished.resolve("done");
    }

    // Do not dispatch the next command inside a backend response callback.
    queueMicrotask(() => this.pump());
  };

  private readonly fail = (failure: BackendFailure): void => {
    if (this.disposed || this.state === "failed") {
      return;
    }

    this.state = "failed";
    const error = new Error(failure.message);
    this.active?.reject(error);
    this.active = null;
    for (const pending of this.queue.splice(0)) {
      pending.reject(error);
    }
    for (const listener of this.failures) {
      listener(failure);
    }
  };
}
