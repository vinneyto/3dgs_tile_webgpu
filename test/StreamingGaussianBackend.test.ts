import { afterEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Raycaster, Vector3 } from "three/webgpu";
import { GaussianStore } from "../src/renderer/GaussianStore";
import { DEFAULT_BACKEND_CONFIG } from "../src/renderer/GaussianStore";
import { StreamingGaussianBackend } from "../src/streaming-backend-impl/StreamingGaussianBackend";
import { WorkerStreamingGaussianBackend } from "../src/streaming-backend-worker/WorkerStreamingGaussianBackend";
import {
  transferBuffers,
  type WorkerInbound,
  type WorkerOutbound,
} from "../src/streaming-backend-worker/WorkerMessages";
import type { BackendEvent } from "../src/streaming-backend/events/BackendEvent";
import type { BackendCommand } from "../src/streaming-backend/commands/BackendCommand";

afterEach(() => vi.unstubAllGlobals());

describe("message backend", () => {
  it("resolves relative PLY URLs on the client before loading", async () => {
    vi.stubGlobal("document", { baseURI: "http://localhost:5173/sandbox/" });
    const fetcher = vi.fn(async () => new Response(ply(0)));
    vi.stubGlobal("fetch", fetcher);
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    await store.load("mug.ply");
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5173/sandbox/mug.ply",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    store.dispose();
  });

  it("transfers source data, keeps full raycast on client, and patches custom attributes", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    const input = ply(0);
    const cloud = await store.loadBuffer(input, {
      attributes: [
        {
          name: "weight",
          format: "u32",
          elementsPerGaussian: 1,
          source: { kind: "fill", value: "ones" },
        },
      ],
    });
    expect(input.byteLength).toBe(0); // The input was transferred, not cloned.
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    expect(store.getPackedData().count).toBeGreaterThan(0);
    expect((store.getPackedAttribute("weight")!.array as Uint32Array)[0]).toBe(
      1,
    );
    const raycast = () => {
      const hits: ReturnType<Raycaster["intersectObject"]> = [];
      cloud.raycast(
        new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
        hits,
      );
      return hits;
    };
    expect(raycast()[0]?.index).toBe(0);

    const changed = new Uint32Array([7]).buffer;
    store.writeAttributeRange(cloud, "weight", 0, 1, changed);
    await vi.waitFor(() =>
      expect(
        (store.getPackedAttribute("weight")!.array as Uint32Array)[0],
      ).toBe(7),
    );
    store.setCloudRaycastable(cloud, false);
    expect(raycast()).toHaveLength(0);
    store.setCloudRaycastable(cloud, true);
    await vi.waitFor(() => expect(raycast()[0]?.index).toBe(0));
    expect(port.events.some((event) => event.type === "buffers-patched")).toBe(
      true,
    );
    store.dispose();
    expect(port.terminated).toBe(true);
  });

  it("cancels an in-flight URL load and never publishes its cloud", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const events: BackendEvent[] = [];
    backend.subscribe((event) => events.push(event));
    const fetcher = vi.fn(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        ),
    );
    vi.stubGlobal("fetch", fetcher);
    backend.dispatch({
      type: "load-cloud",
      id: "load",
      cloudId: "cloud",
      url: "https://example.test/a.ply",
    });
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalled());
    backend.dispatch({ type: "cancel", id: "cancel", targetCommandId: "load" });
    await vi.waitFor(() =>
      expect(events).toContainEqual({
        type: "command-cancelled",
        commandId: "load",
      }),
    );
    expect(events.some((event) => event.type === "cloud-loaded")).toBe(false);
    backend.dispose();
  });

  it("cancels a load through GaussianStore and releases its pending promise", async () => {
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
    const controller = new AbortController();
    const load = store.load(
      "https://example.test/a.ply",
      {},
      controller.signal,
    );
    await fetching;
    controller.abort();
    await expect(load).rejects.toMatchObject({ name: "AbortError" });
    expect(port.commands.map((command) => command.type)).toContain("cancel");
    expect(port.events.some((event) => event.type === "cloud-loaded")).toBe(
      false,
    );
    expect(store.clouds).toHaveLength(0);
    store.dispose();
  });

  it("leaves a client buffer untouched when cancellation precedes dispatch", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never));
    const controller = new AbortController();
    controller.abort();
    const input = ply(0);
    await expect(store.loadBuffer(input, {}, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(input.byteLength).toBeGreaterThan(0);
    expect(port.commands).toHaveLength(0);
    store.dispose();
  });

  it("honors cancellation after parsing before building the octree", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const events: BackendEvent[] = [];
    backend.subscribe((event) => events.push(event));
    const { CanonicalGaussianPlyLoader } =
      await import("../src/streaming-backend-impl/CanonicalGaussianPlyLoader");
    const parse = CanonicalGaussianPlyLoader.prototype.parse;
    const spy = vi
      .spyOn(CanonicalGaussianPlyLoader.prototype, "parseAsync")
      .mockImplementation(async function (this: InstanceType<typeof CanonicalGaussianPlyLoader>, buffer) {
        const source = parse.call(this, buffer);
        backend.dispatch({
          type: "cancel",
          id: "cancel",
          targetCommandId: "load",
        });
        return source;
      });
    backend.dispatch({
      type: "load-cloud-from-buffer",
      id: "load",
      cloudId: "cloud",
      buffer: ply(0),
    });
    await vi.waitFor(() =>
      expect(events).toContainEqual({
        type: "command-cancelled",
        commandId: "load",
      }),
    );
    expect(events.some((event) => event.type === "cloud-loaded")).toBe(false);
    spy.mockRestore();
    backend.dispose();
  });

  it("interrupts a long PLY parse at a chunk boundary", async () => {
    const { CanonicalGaussianPlyLoader } = await import("../src/streaming-backend-impl/CanonicalGaussianPlyLoader");
    const single = new TextDecoder().decode(ply(0));
    const [header, row] = single.split("end_header\n");
    const input = new TextEncoder().encode(
      `${header!.replace("element vertex 1", "element vertex 8193")}end_header\n${row!.repeat(8193)}`,
    ).buffer as ArrayBuffer;
    const controller = new AbortController();
    const parsing = new CanonicalGaussianPlyLoader().parseAsync(input, controller.signal);
    queueMicrotask(() => controller.abort());
    await expect(parsing).rejects.toMatchObject({ name: "AbortError" });
  });

  it("computes a scene revision once for multiple transforms and a camera update", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const events: BackendEvent[] = [];
    backend.subscribe((event) => events.push(event));
    backend.dispatch({
      type: "load-cloud-from-buffer",
      id: "load-1",
      cloudId: "one",
      buffer: ply(0),
    });
    backend.dispatch({
      type: "load-cloud-from-buffer",
      id: "load-2",
      cloudId: "two",
      buffer: ply(3),
    });
    await vi.waitFor(() =>
      expect(
        events.filter((event) => event.type === "cloud-loaded"),
      ).toHaveLength(2),
    );
    const compute = vi.spyOn(
      backend as unknown as { compute: () => unknown },
      "compute",
    );
    const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    backend.dispatch({
      type: "set-cloud-transform",
      id: "transform-1",
      cloudId: "one",
      sceneRevision: 1,
      worldMatrix: matrix,
    });
    backend.dispatch({
      type: "set-cloud-transform",
      id: "transform-2",
      cloudId: "two",
      sceneRevision: 1,
      worldMatrix: matrix,
    });
    backend.dispatch({
      type: "set-camera",
      id: "camera",
      sceneRevision: 1,
      worldMatrix: matrix,
      projectionMatrix: matrix,
    });
    await vi.waitFor(() =>
      expect(events).toContainEqual({
        type: "command-completed",
        commandId: "camera",
      }),
    );
    expect(compute).toHaveBeenCalledTimes(1);
    expect(
      events.filter(
        (event) =>
          event.type === "command-completed" &&
          event.commandId.startsWith("transform-"),
      ),
    ).toHaveLength(2);
    compute.mockRestore();
    backend.dispose();
  });

  it("applies a standalone transform without waiting for a camera command", async () => {
    const backend = new StreamingGaussianBackend(DEFAULT_BACKEND_CONFIG);
    const events: BackendEvent[] = [];
    backend.subscribe((event) => events.push(event));
    backend.dispatch({ type: "load-cloud-from-buffer", id: "load", cloudId: "cloud", buffer: ply(0) });
    await vi.waitFor(() => expect(events.some((event) => event.type === "buffers-replaced")).toBe(true));
    const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 0, 0, 1];
    backend.dispatch({ type: "set-cloud-transform", id: "transform", cloudId: "cloud",
      sceneRevision: 1, worldMatrix: matrix });
    await vi.waitFor(() => expect(events).toContainEqual({ type: "command-completed", commandId: "transform" }));
    backend.dispose();
  });

  it("recovers after an invalid command and keeps the previous buffers available", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    const cloud = await store.loadBuffer(ply(0));
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    const previous = store.getPackedData();
    store.setCloudPacking(cloud, { type: "radial", lodLevel: 100 });
    await vi.waitFor(() => expect(store.lastCommandError).not.toBeNull());
    expect(store.hasPackedData).toBe(true);
    expect(store.getPackedData()).toBe(previous);
    store.setCloudPacking(cloud, { type: "maximum" });
    await vi.waitFor(() => expect(store.lastCommandError).toBeNull());
    expect(store.hasPackedData).toBe(true);
    expect(store.getPackedData().count).toBeGreaterThan(0);
    store.dispose();
  });

  it("packs several clouds, fills missing attributes and sends only changed ranges", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(
        { ...DEFAULT_BACKEND_CONFIG, maxGaussians: 2 },
        port as never,
      ),
    );
    const first = await store.loadBuffer(ply(0), {
      name: "first",
      priority: 2,
      attributes: [
        {
          name: "tag",
          format: "u32",
          elementsPerGaussian: 1,
          source: { kind: "fill", value: "ones" },
        },
      ],
    });
    const second = await store.loadBuffer(ply(3), {
      name: "second",
      priority: 1,
    });
    await vi.waitFor(() => expect(store.count).toBe(2));
    expect([first.name, second.name]).toEqual(["first", "second"]);
    expect(first.packingPriority).toBe(2);
    expect(
      Array.from(store.getPackedAttribute("tag")!.array as Uint32Array),
    ).toEqual([0, 1]);

    const before = port.events.length;
    store.writeAttributeRange(
      first,
      "scalesOpacity",
      0,
      1,
      new Float32Array([2, 2, 2, 1]).buffer,
    );
    await vi.waitFor(() =>
      expect(
        port.events
          .slice(before)
          .some((event) => event.type === "buffers-patched"),
      ).toBe(true),
    );
    const patch = port.events
      .slice(before)
      .find((event) => event.type === "buffers-patched");
    if (patch?.type !== "buffers-patched") throw new Error("Missing patch");
    expect(patch.patches.map((item) => item.name)).toEqual(["scalesOpacity"]);
    await vi.waitFor(() =>
      expect(
        (store.getPackedData().scalesOpacity.array as Float32Array)[4],
      ).toBe(2),
    );
    store.dispose();
  });

  it("ignores patches from an obsolete layout or content version", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    await store.loadBuffer(ply(0));
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    const version = store.contentVersion;
    const layout = store.layoutVersion;
    const forged = (
      layoutVersion: number,
      baseContentVersion: number,
    ): BackendEvent => ({
      type: "buffers-patched",
      sceneRevision: 0,
      layoutVersion,
      baseContentVersion,
      contentVersion: version + 1,
      patches: [
        {
          name: "means",
          firstSlot: 0,
          slotCount: 1,
          data: new Float32Array([100, 0, 0, 0]).buffer,
        },
      ],
      changedClouds: [{ cloudId: "cloud-1", objectId: 0, renderedCount: 1 }],
      lodPending: false,
    });
    port.send(forged(layout - 1, version));
    port.send(forged(layout, version - 1));
    expect((store.getPackedData().means.array as Float32Array)[0]).toBe(0);
    expect(store.contentVersion).toBe(version);
    store.dispose();
  });

  it("sends both camera matrices and reports projection-only changes", async () => {
    const port = new InMemoryWorker();
    const store = new GaussianStore(
      new WorkerStreamingGaussianBackend(DEFAULT_BACKEND_CONFIG, port as never),
    );
    await store.loadBuffer(ply(0));
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(3, 4, 5);
    store.updateLod(camera);
    const commands = () =>
      port.commands.filter((command) => command.type === "set-camera");
    expect(commands()).toHaveLength(1);
    expect(commands()[0]?.worldMatrix.slice(12, 15)).toEqual([3, 4, 5]);
    expect(commands()[0]?.projectionMatrix).toEqual(
      camera.projectionMatrix.elements,
    );

    camera.fov = 60;
    camera.updateProjectionMatrix();
    store.updateLod(camera);
    expect(commands()).toHaveLength(2);
    expect(commands()[1]?.worldMatrix).toEqual(commands()[0]?.worldMatrix);
    expect(commands()[1]?.projectionMatrix).not.toEqual(
      commands()[0]?.projectionMatrix,
    );
    store.dispose();
  });
});

class InMemoryWorker {
  private core: StreamingGaussianBackend | null = null;
  private listener: ((event: MessageEvent<WorkerOutbound>) => void) | null =
    null;
  readonly events: BackendEvent[] = [];
  readonly commands: BackendCommand[] = [];
  terminated = false;

  addEventListener(
    type: string,
    listener: (event: MessageEvent<WorkerOutbound>) => void,
  ): void {
    if (type === "message") this.listener = listener;
  }
  removeEventListener(): void {
    this.listener = null;
  }
  terminate(): void {
    this.terminated = true;
  }
  send(event: BackendEvent): void {
    this.listener?.({
      data: { type: "event", event },
    } as MessageEvent<WorkerOutbound>);
  }
  postMessage(message: WorkerInbound, transfer: ArrayBuffer[] = []): void {
    const cloned = structuredClone(message, { transfer });
    if (cloned.type === "initialize") {
      this.core = new StreamingGaussianBackend(cloned.config);
      this.core.subscribe((event) => {
        this.events.push(event);
        const received = structuredClone(
          { type: "event", event } as WorkerOutbound,
          {
            transfer: transferBuffers(event),
          },
        );
        queueMicrotask(() =>
          this.listener?.({ data: received } as MessageEvent<WorkerOutbound>),
        );
      });
    } else if (cloned.type === "dispatch") {
      this.commands.push(cloned.command);
      this.core?.dispatch(cloned.command);
    } else this.core?.dispose();
  }
}

function ply(x: number): ArrayBuffer {
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
  const text =
    [
      "ply",
      "format ascii 1.0",
      "element vertex 1",
      ...properties.map((name) => `property float ${name}`),
      "end_header",
      `${x} 0 0 1 1 1 10 0 0 0 1 0 0 0`,
    ].join("\n") + "\n";
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}
