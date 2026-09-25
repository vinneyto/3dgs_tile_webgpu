import { afterEach, describe, expect, it, vi } from "vitest";
import { Ray, Vector3 } from "three/webgpu";
import { GaussianRaycastIndex } from "../src/data-backend/GaussianRaycastIndex";
import type {
  WorkerStoreRequest,
  WorkerStoreResult,
} from "../src/data-backend/WorkerGaussianStoreProtocol";

afterEach(() => {
  vi.unstubAllGlobals();
  delete (globalThis as { onmessage?: unknown }).onmessage;
});

describe("worker-owned GaussianStore", () => {
  it("parses and packs two clouds without returning source LOD structures", async () => {
    vi.stubGlobal("Worker", FakeNestedWorker);
    const replies: WorkerStoreResult[] = [];
    vi.stubGlobal("postMessage", (response: WorkerStoreResult) => {
      replies.push(response);
    });
    await import("../src/data-backend/WorkerGaussianStoreWorker");
    const dispatch = (request: WorkerStoreRequest) => {
      const scope = globalThis as {
        onmessage: (event: MessageEvent<WorkerStoreRequest>) => void;
      };
      scope.onmessage({ data: request } as MessageEvent<WorkerStoreRequest>);
    };
    dispatch({ type: "init", requestId: 1, maxGaussians: 4 });
    await vi.waitFor(() => expect(replies[0]?.type).toBe("initialized"));
    dispatch({ type: "load", requestId: 2, cloudId: 0, buffer: ply(0) });
    await vi.waitFor(() => expect(replies[1]?.type).toBe("loaded"));
    dispatch({ type: "load", requestId: 3, cloudId: 1, buffer: ply(5) });
    await vi.waitFor(() => expect(replies[2]?.type).toBe("loaded"));
    const loaded = replies[1]!;
    if (loaded.type !== "loaded") throw new Error("Expected loaded result");
    const raycast = new GaussianRaycastIndex(loaded.raycast);
    expect(
      raycast.raycast(
        new Ray(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
        "full",
      )?.gaussianIndex,
    ).toBe(0);
    dispatch({
      type: "pack",
      requestId: 4,
      limits: { maxStorageBufferBindingSize: 1024, maxBufferSize: 1024 },
    });
    await vi.waitFor(() => expect(replies[3]?.type).toBe("packed"));
    const packed = replies[3]!;
    if (packed.type !== "packed") throw new Error("Expected packed result");
    expect(packed.clouds).toHaveLength(2);
    expect(packed.clouds.map(({ count }) => count)).toEqual([1, 1]);
    expect(new Float32Array(packed.buffers.means).length).toBe(
      packed.count * 4,
    );
    raycast.setRenderedIndices(packed.clouds[0]!.renderedIndices);
    expect(
      raycast.raycast(
        new Ray(new Vector3(0, 0, 2), new Vector3(0, 0, -1)),
        "rendered",
      )?.gaussianIndex,
    ).toBe(0);
    dispatch({
      type: "update",
      requestId: 5,
      position: [1, 0, 2],
      transforms: [
        {
          cloudId: 0,
          matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        },
        {
          cloudId: 1,
          matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        },
      ],
    });
    await vi.waitFor(() => expect(replies[4]?.type).toBe("updated"));
    dispatch({ type: "remove", requestId: 6, cloudId: 0 });
    await vi.waitFor(() => expect(replies[5]?.type).toBe("removed"));
  });
});

class FakeNestedWorker {
  addEventListener(): void {}
  removeEventListener(): void {}
  postMessage(): void {}
  terminate(): void {}
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
