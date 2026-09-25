import { afterEach, describe, expect, it, vi } from "vitest";
import { Ray, Vector3 } from "three/webgpu";
import type {
  GaussianBackendRequest,
  GaussianBackendResult,
} from "../src/data-backend/GaussianBackendProtocol";
import { GaussianRaycastIndex } from "../src/data-backend/GaussianRaycastIndex";

afterEach(() => {
  vi.unstubAllGlobals();
  delete (globalThis as { onmessage?: unknown }).onmessage;
});

describe("Gaussian data worker", () => {
  it("parses, builds the BVH/LOD, transfers buffers and leaves raycast synchronous", async () => {
    const replies: {
      result: GaussianBackendResult;
      transfer: Transferable[];
    }[] = [];
    vi.stubGlobal(
      "postMessage",
      (result: GaussianBackendResult, transfer: Transferable[] = []) => {
        replies.push({ result, transfer });
      },
    );
    await import("../src/data-backend/GaussianDataWorker");
    const dispatch = (request: GaussianBackendRequest) => {
      const scope = globalThis as {
        onmessage: (event: MessageEvent<GaussianBackendRequest>) => void;
      };
      scope.onmessage({
        data: request,
      } as MessageEvent<GaussianBackendRequest>);
    };
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
    const source =
      [
        "ply",
        "format ascii 1.0",
        "element vertex 1",
        ...properties.map((name) => `property float ${name}`),
        "end_header",
        "0 0 0 1 1 1 10 0 0 0 1 0 0 0",
      ].join("\n") + "\n";
    const buffer = new TextEncoder().encode(source).buffer as ArrayBuffer;
    dispatch({
      type: "load-buffer",
      requestId: 1,
      resourceId: "cloud",
      buffer,
      options: {},
    });
    await vi.waitFor(() => expect(replies.length).toBe(1));
    const loaded = replies[0]!;
    expect(loaded.result.type).toBe("loaded");
    if (loaded.result.type !== "loaded") return;
    expect(loaded.transfer).toHaveLength(8);
    const raycast = new GaussianRaycastIndex(loaded.result.raycast);
    const ray = new Ray(new Vector3(0, 0, 2), new Vector3(0, 0, -1));
    expect(raycast.raycast(ray, "full")?.gaussianIndex).toBe(0);
    dispatch({
      type: "select",
      requestId: 2,
      resourceId: "cloud",
      revision: 1,
      center: [0, 0, 2],
      maxGaussians: 1,
    });
    await vi.waitFor(() => expect(replies.length).toBe(2));
    const selected = replies[1]!;
    expect(selected.result.type).toBe("selected");
    if (selected.result.type !== "selected") return;
    expect(selected.result.count).toBe(1);
    expect(selected.transfer).toHaveLength(5);
    raycast.setRenderedIndices(selected.result.renderedIndices);
    expect(raycast.raycast(ray, "rendered")?.gaussianIndex).toBe(0);
    dispatch({ type: "release", requestId: 3, resourceId: "cloud" });
    await vi.waitFor(() => expect(replies[2]?.result.type).toBe("released"));
  });
});
