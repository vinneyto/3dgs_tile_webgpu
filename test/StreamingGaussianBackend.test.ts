import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, type WebGPURenderer } from "three/webgpu";
import {
  GaussianStore,
  DEFAULT_BACKEND_CONFIG,
} from "../src/renderer/GaussianStore";
import { StreamingGaussianBackend } from "../src/streaming-backend-impl/StreamingGaussianBackend";
import { WorkerStreamingGaussianBackend } from "../src/streaming-backend-worker/WorkerStreamingGaussianBackend";
import { SerialRequestScheduler } from "../src/streaming-backend/RequestScheduler";
import { GaussianPass } from "../src/renderer/GaussianPass";
import {
  transferBuffers,
  type WorkerInbound,
  type WorkerOutbound,
} from "../src/streaming-backend-worker/WorkerMessages";
import type { BackendCommand } from "../src/streaming-backend/commands/BackendCommand";
import type { BackendResponse } from "../src/streaming-backend/BackendResponse";
import {
  createLoadCloudFromBufferCommand,
  createSetCameraCommand,
  createSetFrontendCapabilitiesCommand,
  createWriteAttributeRangeCommand,
} from "../src/streaming-backend/commands/createCommands";

import { initializeTestWasm } from "./helpers/wasm";
beforeAll(initializeTestWasm);

const capabilities = {
  maxStorageBufferBindingSize: 128 * 1024 * 1024,
  maxBufferSize: 256 * 1024 * 1024,
  maxStorageBuffersPerShaderStage: 8,
  supportsPartialBufferUpdates: true,
};
const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
afterEach(() => vi.unstubAllGlobals());

function ply(...positions: number[]): ArrayBuffer {
  const properties = [
    "x",
    "y",
    "z",
    "f_dc_0",
    "f_dc_1",
    "f_dc_2",
    "opacity",
    "scale_0",
    "scale_1",
    "scale_2",
    "rot_0",
    "rot_1",
    "rot_2",
    "rot_3",
  ];
  const content =
    [
      "ply",
      "format ascii 1.0",
      `element vertex ${positions.length}`,
      ...properties.map((name) => `property float ${name}`),
      "end_header",
      ...positions.map((x) => `${x} 0 0 1 1 1 10 0 0 0 1 0 0 0`),
    ].join("\n") + "\n";
  return new TextEncoder().encode(content).buffer as ArrayBuffer;
}

class InMemoryWorker {
  private core: StreamingGaussianBackend | null = null;
  private listener: ((event: MessageEvent<WorkerOutbound>) => void) | null =
    null;
  private errorListener: ((event: ErrorEvent) => void) | null = null;
  readonly commands: BackendCommand[] = [];
  readonly responses: BackendResponse[] = [];
  terminated = false;
  holdAcknowledgements = false;
  private uploadDone: (() => void) | null = null;
  acknowledge(): void {
    const done = this.uploadDone;
    this.uploadDone = null;
    done?.();
  }
  addEventListener(
    type: string,
    listener: (event: MessageEvent<WorkerOutbound>) => void,
  ): void {
    if (type === "message") this.listener = listener;
    if (type === "error")
      this.errorListener = listener as unknown as (event: ErrorEvent) => void;
  }
  removeEventListener(): void {
    this.listener = null;
    this.errorListener = null;
  }
  terminate(): void {
    this.terminated = true;
  }
  fail(message: string): void {
    this.errorListener?.({ message } as ErrorEvent);
  }
  postMessage(message: WorkerInbound, transfer: ArrayBuffer[] = []): void {
    const received = structuredClone(message, { transfer });
    if (received.type === "initialize") {
      this.core = new StreamingGaussianBackend(
        received.config,
        () =>
          new Promise<void>((resolve) => {
            this.uploadDone = resolve;
          }),
      );
      this.core.subscribe((response) => {
        this.responses.push(response);
        const wire = structuredClone(
          { type: "response", response } satisfies WorkerOutbound,
          { transfer: transferBuffers(response) },
        );
        queueMicrotask(() =>
          this.listener?.({ data: wire } as MessageEvent<WorkerOutbound>),
        );
      });
    } else if (received.type === "dispatch") {
      this.commands.push(received.command);
      this.core?.dispatch(received.command);
    } else if (received.type === "abort") {
      this.core?.abort(received.commandId);
    } else if (received.type === "upload-ack") {
      if (!this.holdAcknowledgements) this.acknowledge();
    } else if (received.type === "dispose") {
      this.core?.dispose();
      this.acknowledge();
    }
  }
}

describe("streaming backend request protocol", () => {
  it("bounds initial uploads and waits for client acknowledgement before copying the next batch", async () => {
    const port = new InMemoryWorker();
    const backend = new WorkerStreamingGaussianBackend(
      { streaming: { maxUploadBytesPerUpdate: 112 } },
      port as unknown as Worker,
    );
    const scheduler = new SerialRequestScheduler(backend);
    scheduler.start();
    await scheduler.schedule(
      createSetFrontendCapabilitiesCommand(
        "caps",
        capabilities,
        1,
        matrix,
        matrix,
        [],
      ),
    );
    port.holdAcknowledgements = true;
    const pending = scheduler.schedule(
      createLoadCloudFromBufferCommand("load", "cloud", ply(0, 1, 2, 3, 4), {
        mipmaps: { type: "none" },
      }),
    );
    await vi.waitFor(() =>
      expect(
        port.responses.filter(
          (r) =>
            r.command.id === "load" && r.payload?.type === "buffers-allocated",
        ),
      ).toHaveLength(1),
    );
    expect(
      port.responses.filter(
        (r) => r.command.id === "load" && r.payload?.type === "buffers-patched",
      ),
    ).toHaveLength(0);
    port.acknowledge();
    await vi.waitFor(() =>
      expect(
        port.responses.filter(
          (r) =>
            r.command.id === "load" && r.payload?.type === "buffers-patched",
        ),
      ).toHaveLength(1),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(
      port.responses.filter(
        (r) => r.command.id === "load" && r.payload?.type === "buffers-patched",
      ),
    ).toHaveLength(1);
    expect(
      port.responses.some((r) => r.command.id === "load" && r.isFinal),
    ).toBe(false);
    port.holdAcknowledgements = false;
    port.acknowledge();
    await expect(pending).resolves.toBe("done");
    const final = [...port.responses]
      .reverse()
      .find((r) => r.command.id === "load" && r.isFinal)!;
    expect(final.metrics?.uploadedBytes).toBe(5 * 56 + 5 * 4);
    expect(final.metrics?.uploadBatches).toBe(5); // descriptor + three data batches + activation
    scheduler.dispose();
  });

  it("warms compact GPU slots automatically and pans using activation deltas only", async () => {
    const backend = new StreamingGaussianBackend({
      defaultMipmaps: { type: "standard" },
      streaming: { maxUploadBytesPerUpdate: 512 },
    });
    const store = new GaussianStore(backend);
    const responses: BackendResponse[] = [];
    store.scheduler.onResponse((r) => responses.push(r));
    const camera = new PerspectiveCamera();
    camera.position.z = 100000;
    camera.updateMatrixWorld();
    store.setFrontendCapabilities(
      { ...capabilities, supportsCompactGaussians: true },
      camera,
      1024,
      1024,
    );
    await store.loadBuffer(ply(...Array.from({ length: 32 }, (_, i) => i)), {
      mipmaps: { type: "standard", snapshot: { maxLeaves: 8 } },
    });
    await vi.waitFor(
      () =>
        expect(
          responses.some(
            (r) =>
              r.command.type === "prefetch-cache" &&
              r.isFinal &&
              r.metrics?.residentGaussians === store.maxGaussians,
          ),
        ).toBe(true),
      { timeout: 5000 },
    );
    const data = store.getPackedData();
    expect(data.geometryFormat).toBe("compact");
    expect(data.scalesOpacity.array).toBeInstanceOf(Uint32Array);
    expect(data.scalesOpacity.itemSize).toBe(2);
    expect(data.rotations.itemSize).toBe(1);
    const layout = store.layoutVersion;
    responses.length = 0;
    camera.position.set(16, 0, 10);
    camera.lookAt(16, 0, 0);
    camera.updateMatrixWorld();
    store.updateLod(camera);
    await vi.waitFor(() =>
      expect(
        responses.some((r) => r.command.type === "set-camera" && r.isFinal),
      ).toBe(true),
    );
    expect(responses.some((r) => r.payload?.type === "buffers-patched")).toBe(
      false,
    );
    expect(store.getPackedData()).toBe(data);
    expect(store.layoutVersion).toBe(layout);
    expect(store.lastCommandError).toBeNull();
    expect(store.clouds[0]!.raycast).toBeDefined();
    store.dispose();
  });

  it("loads without handshake, then renders after receiving capabilities", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const scheduler = new SerialRequestScheduler(backend);
    const responses: BackendResponse[] = [];
    scheduler.onResponse((response) => responses.push(response));
    scheduler.start();
    const load = scheduler.schedule(
      createLoadCloudFromBufferCommand("load", "cloud", ply(0)),
    );
    await expect(load).resolves.toBe("done");
    const loadResponses = responses.filter(
      ({ command }) => command.id === "load",
    );
    expect(loadResponses.map(({ payload }) => payload?.type)).toContain(
      "cloud-loaded",
    );
    expect(loadResponses.map(({ payload }) => payload?.type)).not.toContain(
      "buffers-replaced",
    );
    expect(loadResponses.at(-1)?.isFinal).toBe(true);
    expect(
      loadResponses.every(
        ({ command, durationMs }) =>
          command.type === "load-cloud-from-buffer" && durationMs >= 0,
      ),
    ).toBe(true);
    expect(responses[0]?.command.type).toBe("load-cloud-from-buffer");
    await scheduler.schedule(
      createSetFrontendCapabilitiesCommand(
        "handshake",
        capabilities,
        1,
        matrix,
        matrix,
        [],
      ),
    );
    expect(
      responses.some(
        ({ command, payload }) =>
          command.id === "handshake" && payload?.type === "buffers-allocated",
      ),
    ).toBe(true);
    scheduler.dispose();
  });

  it("keeps the request open until the last streamed buffer patch", async () => {
    const backend = new StreamingGaussianBackend({
      streaming: { maxUploadBytesPerUpdate: 48 },
    });
    const scheduler = new SerialRequestScheduler(backend);
    const responses: BackendResponse[] = [];
    scheduler.onResponse((response) => responses.push(response));
    scheduler.start();
    await scheduler.schedule(
      createSetFrontendCapabilitiesCommand(
        "handshake",
        capabilities,
        1,
        matrix,
        matrix,
        [],
      ),
    );
    await scheduler.schedule(
      createLoadCloudFromBufferCommand(
        "load",
        "cloud",
        ply(...Array.from({ length: 10 }, (_, x) => x)),
      ),
    );
    const values = new Float32Array(10 * 4);
    for (let i = 0; i < 10; i++) values.set([i + 100, 0, 0, 0], i * 4);
    const update = scheduler.schedule(
      createWriteAttributeRangeCommand(
        "write",
        "cloud",
        "means",
        0,
        10,
        values.buffer,
      ),
    );
    await update;
    const stream = responses.filter(({ command }) => command.id === "write");
    expect(
      stream.some(
        ({ payload }) => payload?.type === "mipmap-snapshot-replaced",
      ),
    ).toBe(true);
    expect(
      stream.some(({ payload }) => payload?.type === "buffers-patched"),
    ).toBe(true);
    expect(stream.at(-1)?.isFinal).toBe(true);
    expect(stream.slice(0, -1).every(({ isFinal }) => !isFinal)).toBe(true);
    scheduler.dispose();
  });

  it("loads and enables raycast before GaussianPass exists, then produces LOD", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    const cloud = await store.loadBuffer(ply(0), {
      name: "first",
      mipmaps: { type: "standard", snapshot: { maxLeaves: 100 } },
    });
    expect(port.commands.map(({ type }) => type)).toEqual([
      "load-cloud-from-buffer",
    ]);
    expect(store.hasPackedData).toBe(false);
    expect(cloud.getRaycastIndex()).not.toBeNull();
    const renderer = {
      hasFeature: () => false,
      backend: { device: { limits: capabilities } },
    } as unknown as WebGPURenderer;
    const pass = new GaussianPass(renderer, new PerspectiveCamera(), store);
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    expect(port.commands.map(({ type }) => type)).toEqual([
      "load-cloud-from-buffer",
      "set-frontend-capabilities",
    ]);
    const loadCommand = port.commands[0];
    if (loadCommand?.type !== "load-cloud-from-buffer") {
      throw new Error("Expected a cloud load");
    }
    expect(loadCommand.id).toMatch(uuidPattern);
    expect(loadCommand.cloudId).toMatch(uuidPattern);
    expect(loadCommand.id).not.toBe(loadCommand.cloudId);
    expect(port.commands[1]?.id).toMatch(uuidPattern);
    expect(port.commands[1]?.id).not.toBe(loadCommand.id);
    expect(cloud.name).toBe("first");
    expect(cloud.getRaycastIndex()).not.toBeNull();
    pass.dispose();
    store.dispose();
    expect(port.terminated).toBe(true);
  });

  it("includes the current camera and loaded cloud transforms in the handshake", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    const cloud = await store.loadBuffer(ply(0));
    cloud.position.x = 7;
    const camera = new PerspectiveCamera();
    camera.position.x = 3;
    store.setFrontendCapabilities(capabilities, camera);
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    const handshake = port.commands.find(
      (command) => command.type === "set-frontend-capabilities",
    );
    const loadCommand = port.commands.find(
      (command) => command.type === "load-cloud-from-buffer",
    );
    expect(handshake).toMatchObject({
      cameraWorldMatrix: expect.arrayContaining([3]),
      cloudTransforms: [
        {
          cloudId: loadCommand?.cloudId,
          worldMatrix: expect.arrayContaining([7]),
        },
      ],
    });
    store.dispose();
  });

  it("packs a cloud loaded after handshake with an unchanged camera", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const store = new GaussianStore(backend);
    const camera = new PerspectiveCamera();
    store.setFrontendCapabilities(capabilities, camera);
    await store.loadBuffer(ply(0));
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    const version = store.layoutVersion;
    await store.loadBuffer(ply(1));
    await vi.waitFor(() =>
      expect(store.layoutVersion).toBeGreaterThan(version),
    );
    expect(store.clouds).toHaveLength(2);
    store.dispose();
  });

  it("aborts an active URL fetch and settles its load promise", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    store.setFrontendCapabilities(capabilities, new PerspectiveCamera());
    let started!: () => void;
    const fetching = new Promise<void>((resolve) => {
      started = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, { signal }: { signal: AbortSignal }) => {
        started();
        return new Promise<Response>((_resolve, reject) =>
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          ),
        );
      }),
    );
    const controller = new AbortController();
    const load = store.load(
      "https://example.test/slow.ply",
      {},
      controller.signal,
    );
    await fetching;
    controller.abort();
    await expect(load).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() =>
      expect(
        port.responses.some(
          ({ command, error }) =>
            command.type === "load-cloud" && error?.code === "cancelled",
        ),
      ).toBe(true),
    );
    expect(store.clouds).toHaveLength(0);
    store.dispose();
  });

  it("keeps an aborted queued buffer on the client without dispatching its load", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    let started!: () => void;
    const fetching = new Promise<void>((resolve) => {
      started = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, { signal }: { signal: AbortSignal }) => {
        started();
        return new Promise<Response>((_resolve, reject) =>
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          ),
        );
      }),
    );
    const activeController = new AbortController();
    const active = store.load(
      "https://example.test/slow.ply",
      {},
      activeController.signal,
    );
    await fetching;
    const controller = new AbortController();
    const buffer = ply(0);
    const loading = store.loadBuffer(buffer, {}, controller.signal);
    controller.abort();
    await expect(loading).rejects.toMatchObject({ name: "AbortError" });
    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(port.commands.map(({ type }) => type)).toEqual(["load-cloud"]);
    activeController.abort();
    await expect(active).rejects.toMatchObject({ name: "AbortError" });
    store.dispose();
  });

  it("rejects queued loads when the worker crashes", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    const pending = store.load("https://example.test/a.ply");
    port.fail("Worker crashed");
    await expect(pending).rejects.toThrow("Worker crashed");
    store.dispose();
  });

  it("sends changed camera and cloud transforms, without frame-by-frame spam", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const store = new GaussianStore(backend);
    store.setFrontendCapabilities(capabilities, new PerspectiveCamera());
    const cloud = await store.loadBuffer(ply(0));
    const camera = new PerspectiveCamera();
    store.updateLod(camera);
    await vi.waitFor(() => expect(store.scheduler.state).toBe("ready"));
    const responses: BackendResponse[] = [];
    store.scheduler.onResponse((response) => responses.push(response));
    store.updateLod(camera);
    expect(responses).toHaveLength(0);
    camera.position.x = 2;
    store.updateLod(camera);
    await vi.waitFor(() =>
      expect(
        responses.some(({ command }) => command.type === "set-camera"),
      ).toBe(true),
    );
    cloud.position.x = 3;
    store.updateLod(camera);
    await vi.waitFor(() =>
      expect(
        responses.some(({ command }) => command.type === "set-cloud-transform"),
      ).toBe(true),
    );
    store.dispose();
  });

  it("returns an error response and continues with the next queued command", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const scheduler = new SerialRequestScheduler(backend);
    const responses: BackendResponse[] = [];
    scheduler.onResponse((response) => responses.push(response));
    scheduler.start();
    await scheduler.schedule(
      createSetFrontendCapabilitiesCommand(
        "handshake",
        capabilities,
        1,
        matrix,
        matrix,
        [],
      ),
    );
    const invalid = scheduler.schedule(
      createSetCameraCommand("invalid", 1, [], matrix),
    );
    const valid = scheduler.schedule(
      createSetCameraCommand("valid", 2, matrix, matrix),
    );
    await expect(invalid).rejects.toThrow(/sixteen/);
    await expect(valid).resolves.toBe("done");
    expect(
      responses.find(({ command }) => command.id === "invalid")?.error?.code,
    ).toBe("backend-command-error");
    scheduler.dispose();
  });
});
