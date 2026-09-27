import { describe, expect, it } from "vitest";
import type { GaussianBackend } from "../src/streaming-backend/GaussianBackend";
import type { BackendCommand } from "../src/streaming-backend/commands/BackendCommand";
import type {
  BackendResponse,
  BackendFailure,
} from "../src/streaming-backend/BackendResponse";
import { SerialRequestScheduler } from "../src/streaming-backend/RequestScheduler";
import {
  createSetCameraCommand,
  createSetCloudTransformCommand,
} from "../src/streaming-backend/commands/createCommands";

const capabilities = {
  maxStorageBufferBindingSize: 1024,
  maxBufferSize: 2048,
  maxStorageBuffersPerShaderStage: 8,
  supportsPartialBufferUpdates: true,
};
const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

class ManualBackend implements GaussianBackend {
  readonly sent: BackendCommand[] = [];
  private response?: (response: BackendResponse) => void;
  private failure?: (failure: BackendFailure) => void;
  dispatch(command: BackendCommand): void {
    this.sent.push(command);
  }
  abort(): void {}
  subscribe(listener: (response: BackendResponse) => void): () => void {
    this.response = listener;
    return () => {
      this.response = undefined;
    };
  }
  onFailure(listener: (failure: BackendFailure) => void): () => void {
    this.failure = listener;
    return () => {
      this.failure = undefined;
    };
  }
  answer(
    command: BackendCommand,
    isFinal: boolean,
    error?: BackendResponse["error"],
  ): void {
    if (command.type === "set-frontend-capabilities" && isFinal && !error)
      this.response?.({
        command: { id: command.id, type: command.type },
        durationMs: 10,
        isFinal: false,
        payload: { type: "capabilities-accepted", protocolVersion: 1 },
      });
    this.response?.({
      command: { id: command.id, type: command.type },
      durationMs: 20,
      isFinal,
      error,
    });
  }
  answerWithoutAcknowledgement(command: BackendCommand): void {
    this.response?.({
      command: { id: command.id, type: command.type },
      durationMs: 1,
      isFinal: true,
    });
  }
  crash(): void {
    this.failure?.({ code: "worker-error", message: "worker crashed" });
  }
  dispose(): void {}
}

describe("SerialRequestScheduler", () => {
  it("gates commands behind the handshake and the final response", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    const camera = createSetCameraCommand("camera", 1, matrix, matrix);
    const pending = scheduler.schedule(camera);
    expect(backend.sent).toEqual([]);
    const ready = scheduler.start(capabilities);
    const handshake = backend.sent[0]!;
    expect(handshake.type).toBe("set-frontend-capabilities");
    backend.answer(handshake, false);
    expect(backend.sent).toHaveLength(1);
    backend.answer(handshake, true);
    await ready;
    await Promise.resolve();
    expect(backend.sent[1]).toEqual(camera);
    backend.answer(camera, false);
    expect(scheduler.state).toBe("ready");
    backend.answer(camera, true);
    await expect(pending).resolves.toBe("done");
    scheduler.dispose();
  });

  it("keeps only the last waiting command for each latestKey and appends it to the tail", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    const ready = scheduler.start(capabilities);
    backend.answer(backend.sent[0]!, true);
    await ready;
    const first = createSetCameraCommand("camera-1", 1, matrix, matrix);
    const firstResult = scheduler.schedule(first);
    const stale = scheduler.schedule(
      createSetCameraCommand("camera-2", 2, matrix, matrix),
    );
    const cloudA = createSetCloudTransformCommand("a", "cloud-a", 2, matrix);
    const cloudB = createSetCloudTransformCommand("b", "cloud-b", 2, matrix);
    const a = scheduler.schedule(cloudA);
    const b = scheduler.schedule(cloudB);
    const latest = createSetCameraCommand("camera-3", 3, matrix, matrix);
    const latestResult = scheduler.schedule(latest);
    await expect(stale).resolves.toBe("superseded");
    expect(backend.sent.at(-1)).toEqual(first);
    backend.answer(first, true);
    await firstResult;
    await Promise.resolve();
    expect(backend.sent.at(-1)).toEqual(cloudA);
    backend.answer(cloudA, true);
    await a;
    await Promise.resolve();
    expect(backend.sent.at(-1)).toEqual(cloudB);
    backend.answer(cloudB, true);
    await b;
    await Promise.resolve();
    expect(backend.sent.at(-1)).toEqual(latest);
    backend.answer(latest, true);
    await latestResult;
    expect(backend.sent.map(({ id }) => id)).toEqual([
      "handshake-1",
      "camera-1",
      "a",
      "b",
      "camera-3",
    ]);
    scheduler.dispose();
  });

  it("rejects active and queued requests on transport failure", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    const ready = scheduler.start(capabilities);
    backend.answer(backend.sent[0]!, true);
    await ready;
    const active = scheduler.schedule(
      createSetCameraCommand("active", 1, matrix, matrix),
    );
    const queued = scheduler.schedule(
      createSetCameraCommand("queued", 2, matrix, matrix),
    );
    backend.crash();
    await expect(active).rejects.toThrow("worker crashed");
    await expect(queued).rejects.toThrow("worker crashed");
    expect(scheduler.state).toBe("failed");
    scheduler.dispose();
  });

  it("collapses camera updates while a different command is executing", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    const ready = scheduler.start(capabilities);
    backend.answer(backend.sent[0]!, true);
    await ready;
    const loading = scheduler.schedule({
      type: "load-cloud",
      id: "load",
      cloudId: "cloud",
      url: "/cloud.ply",
    });
    const stale = scheduler.schedule(
      createSetCameraCommand("old-camera", 1, matrix, matrix),
    );
    const fresh = scheduler.schedule(
      createSetCameraCommand("new-camera", 2, matrix, matrix),
    );
    await expect(stale).resolves.toBe("superseded");
    expect(backend.sent.map(({ id }) => id)).toEqual(["handshake-1", "load"]);
    backend.answer(backend.sent[1]!, true);
    await loading;
    await Promise.resolve();
    expect(backend.sent.at(-1)?.id).toBe("new-camera");
    backend.answer(backend.sent.at(-1)!, true);
    await fresh;
    scheduler.dispose();
  });

  it("rejects the waiting queue when the backend omits the handshake acknowledgement", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    const pending = scheduler.schedule(
      createSetCameraCommand("camera", 1, matrix, matrix),
    );
    const ready = scheduler.start(capabilities);
    backend.answerWithoutAcknowledgement(backend.sent[0]!);
    await expect(ready).rejects.toThrow("did not confirm");
    await expect(pending).rejects.toThrow("did not confirm");
    expect(backend.sent).toHaveLength(1);
    scheduler.dispose();
  });
});
