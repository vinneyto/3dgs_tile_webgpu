import { describe, expect, it, vi } from "vitest";
import { PerspectiveCamera } from "three/webgpu";
import { GaussianStore } from "../src/renderer/GaussianStore";
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
  createSetFrontendCapabilitiesCommand,
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
  emit(response: BackendResponse): void {
    this.response?.(response);
  }
  crash(): void {
    this.failure?.({ code: "worker-error", message: "worker crashed" });
  }
  dispose(): void {}
}

describe("SerialRequestScheduler", () => {
  it("runs loads before handshake, and waits for the final response", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    scheduler.start();
    const load = {
      type: "load-cloud" as const,
      id: "load",
      cloudId: "cloud",
      url: "/cloud.ply",
    };
    const loading = scheduler.schedule(load);
    const handshake = createSetFrontendCapabilitiesCommand(
      "handshake",
      capabilities,
      1,
      matrix,
      matrix,
      [],
    );
    const ready = scheduler.schedule(handshake);
    expect(backend.sent).toEqual([load]);
    backend.answer(load, false);
    expect(backend.sent).toHaveLength(1);
    backend.answer(load, true);
    await loading;
    await Promise.resolve();
    expect(backend.sent[1]).toEqual(handshake);
    backend.answer(handshake, true);
    await ready;
    expect(scheduler.state).toBe("ready");
    scheduler.dispose();
  });

  it("keeps only the last waiting command for each latestKey and appends it to the tail", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    scheduler.start();
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
    for (const [command, promise] of [
      [first, firstResult],
      [cloudA, a],
      [cloudB, b],
      [latest, latestResult],
    ] as const) {
      expect(backend.sent.at(-1)).toEqual(command);
      backend.answer(command, true);
      await promise;
      await Promise.resolve();
    }
    expect(backend.sent.map(({ id }) => id)).toEqual([
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
    scheduler.start();
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

  it("collapses camera updates while a load is executing", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    scheduler.start();
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
    expect(backend.sent.map(({ id }) => id)).toEqual(["load"]);
    backend.answer(backend.sent[0]!, true);
    await loading;
    await Promise.resolve();
    expect(backend.sent.at(-1)?.id).toBe("new-camera");
    backend.answer(backend.sent.at(-1)!, true);
    await fresh;
    scheduler.dispose();
  });

  it("treats a handshake like any other command", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    scheduler.start();
    const ready = scheduler.schedule(
      createSetFrontendCapabilitiesCommand(
        "handshake",
        capabilities,
        1,
        matrix,
        matrix,
        [],
      ),
    );
    const pending = scheduler.schedule(
      createSetCameraCommand("camera", 1, matrix, matrix),
    );
    backend.answerWithoutAcknowledgement(backend.sent[0]!);
    await expect(ready).resolves.toBe("done");
    await Promise.resolve();
    expect(backend.sent.map(({ id }) => id)).toEqual(["handshake", "camera"]);
    backend.answerWithoutAcknowledgement(backend.sent[1]!);
    await expect(pending).resolves.toBe("done");
    expect(scheduler.state).toBe("ready");
    scheduler.dispose();
  });

  it("forwards unrelated responses but only releases the matching active command", async () => {
    const backend = new ManualBackend();
    const scheduler = new SerialRequestScheduler(backend);
    const received: BackendResponse[] = [];
    scheduler.onResponse((response) => {
      received.push(response);
    });
    scheduler.start();
    const first = createSetCameraCommand("first", 1, matrix, matrix);
    const second = createSetCameraCommand("second", 2, matrix, matrix);
    const firstResult = scheduler.schedule(first);
    const secondResult = scheduler.schedule(second);
    const unrelated: BackendResponse = {
      command: { id: "other", type: "set-camera" },
      durationMs: 1,
      isFinal: true,
    };
    backend.emit(unrelated);
    backend.answer(first, false);
    expect(received).toContain(unrelated);
    expect(backend.sent).toEqual([first]);
    backend.answer(first, true);
    await firstResult;
    await Promise.resolve();
    expect(backend.sent).toEqual([first, second]);
    backend.answer(second, true);
    await secondResult;
    scheduler.dispose();
  });
});

describe("GaussianStore handshake", () => {
  it("reports a missing capabilities acknowledgement", async () => {
    const backend = new ManualBackend();
    const store = new GaussianStore(backend);
    store.setFrontendCapabilities(capabilities, new PerspectiveCamera());
    expect(backend.sent[0]?.type).toBe("set-frontend-capabilities");
    backend.answerWithoutAcknowledgement(backend.sent[0]!);
    await vi.waitFor(() => {
      expect(() => store.getPackedData()).toThrow(
        "Backend did not confirm the frontend capabilities",
      );
    });
    expect(store.scheduler.state).toBe("ready");
    store.dispose();
  });
});
