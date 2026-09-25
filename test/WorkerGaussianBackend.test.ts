import { afterEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Raycaster, Vector3 } from "three/webgpu";
import { GaussianStore } from "../src/GaussianStore";
import type {
  WorkerStoreRequest,
  WorkerStoreResult,
} from "../src/data-backend/WorkerGaussianBackendProtocol";

afterEach(() => {
  vi.unstubAllGlobals();
  FakeWorker.failFirstLoad = false;
});

describe("worker-backed GaussianStore client", () => {
  it("uses worker buffers for rendering and a local synchronous raycast index", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const store = new GaussianStore();
    const changes = vi.fn();
    store.subscribe(changes);
    const cloud = await store.load("sample.ply");
    expect(store.needsPack).toBe(true);
    const hits: ReturnType<Raycaster["intersectObject"]> = [];
    cloud.raycast(
      new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
      hits,
    );
    expect(hits).toHaveLength(0); // rendered selection is not available until the first pack
    cloud.raycastMode = "full";
    cloud.raycast(
      new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
      hits,
    );
    expect(hits[0]?.index).toBe(0);

    store.pack({
      limits: { maxStorageBufferBindingSize: 1024, maxBufferSize: 1024 },
    });
    await vi.waitFor(() => expect(store.hasPackedData).toBe(true));
    expect(store.getPackedData().count).toBe(1);
    expect(store.needsPack).toBe(false);
    expect(store.clouds[0]).toBe(cloud);
    expect(cloud.gaussianCount).toBe(1);
    cloud.raycastMode = "rendered";
    hits.length = 0;
    cloud.raycast(
      new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
      hits,
    );
    expect(hits[0]?.index).toBe(0);

    store.updateLod(new PerspectiveCamera());
    await vi.waitFor(() => expect(store.contentVersion).toBe(2));
    expect((store.getPackedData().means.array as Float32Array)[0]).toBe(0.5);
    expect(changes).toHaveBeenCalled();
    store.dispose();
    expect(FakeWorker.latest?.terminated).toBe(true);
  });

  it("uses worker object IDs after a failed load without confusing resource IDs", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    FakeWorker.failFirstLoad = true;
    const store = new GaussianStore();
    const events: string[] = [];
    store.subscribe((event) => events.push(event.type));
    await expect(store.load("bad.ply")).rejects.toThrow("invalid PLY");
    expect(events).toEqual(["error"]);
    const cloud = await store.load("good.ply");
    expect(cloud.objectId).toBe(0);
    cloud.packingPriority = 2;
    store.remove(cloud);
    expect(FakeWorker.latest?.requests.slice(-2)).toMatchObject([
      { type: "priority", cloudId: 1 },
      { type: "remove", cloudId: 1 },
    ]);
    store.dispose();
  });
});

class FakeWorker {
  static latest: FakeWorker | null = null;
  static failFirstLoad = false;
  readonly requests: WorkerStoreRequest[] = [];
  terminated = false;
  private onMessage: ((event: MessageEvent<WorkerStoreResult>) => void) | null =
    null;
  constructor() {
    FakeWorker.latest = this;
  }
  addEventListener(
    type: string,
    listener: (event: MessageEvent<WorkerStoreResult>) => void,
  ): void {
    if (type === "message") this.onMessage = listener;
  }
  removeEventListener(): void {
    this.onMessage = null;
  }
  terminate(): void {
    this.terminated = true;
  }
  postMessage(request: WorkerStoreRequest): void {
    this.requests.push(request);
    let result: WorkerStoreResult;
    switch (request.type) {
      case "init":
        result = { type: "initialized", requestId: request.requestId };
        break;
      case "load":
        if (FakeWorker.failFirstLoad && request.cloudId === 0) {
          result = {
            type: "error",
            requestId: request.requestId,
            message: "invalid PLY",
          };
          break;
        }
        result = {
          type: "loaded",
          requestId: request.requestId,
          cloudId: request.cloudId,
          objectId: 0,
          count: 1,
          degree: 0,
          bounds: [-1, -1, -1, 1, 1, 1],
          raycast: {
            means: new Float32Array([0, 0, 0, 0]).buffer,
            scalesOpacity: new Float32Array([1, 1, 1, 1]).buffer,
            rotations: new Float32Array([0, 0, 0, 1]).buffer,
            nodeBounds: new Float32Array([-3, -3, -3, 3, 3, 3, 1]).buffer,
            nodeChildren: new Uint32Array([0, 0]).buffer,
            children: new Uint32Array().buffer,
            nodeIndices: new Uint32Array([0, 1]).buffer,
            indices: new Uint32Array([0]).buffer,
          },
        };
        break;
      case "pack":
        result = {
          type: "packed",
          requestId: request.requestId,
          count: 1,
          degree: 0,
          capacity: 1,
          objectCapacity: 1,
          buffers: {
            means: new Float32Array([0, 0, 0, 0]).buffer,
            scalesOpacity: new Float32Array([1, 1, 1, 1]).buffer,
            rotations: new Float32Array([0, 0, 0, 1]).buffer,
            shCoefficients: new Uint32Array(1).buffer,
          },
          clouds: [
            {
              cloudId: 0,
              count: 1,
              renderedIndices: new Uint32Array([0]).buffer,
            },
          ],
          stats: null,
        };
        break;
      case "update":
        result = {
          type: "updated",
          requestId: request.requestId,
          appliedBatches: 1,
          pending: false,
          clouds: [
            {
              cloudId: 0,
              count: 1,
              renderedIndices: new Uint32Array([0]).buffer,
            },
          ],
          patches: [
            {
              start: 0,
              count: 1,
              means: new Float32Array([0.5, 0, 0, 0]).buffer,
            },
          ],
          clearedSlotRanges: [],
          stats: null,
        };
        break;
      case "remove":
        result = {
          type: "removed",
          requestId: request.requestId,
          cloudId: request.cloudId,
        };
        break;
      case "priority":
        result = {
          type: "priority-set",
          requestId: request.requestId,
          cloudId: request.cloudId,
        };
        break;
      case "enable-lod-level":
        result = { type: "lod-level-enabled", requestId: request.requestId };
        break;
    }
    queueMicrotask(() =>
      this.onMessage?.({ data: result } as MessageEvent<WorkerStoreResult>),
    );
  }
}
