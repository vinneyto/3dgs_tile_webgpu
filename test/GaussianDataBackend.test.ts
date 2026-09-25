import { describe, expect, it } from "vitest";
import { GaussianDataBackend } from "../src/data-backend/GaussianDataBackend";
import type {
  GaussianBackendRequest,
  GaussianBackendResult,
  GaussianBackendTransport,
} from "../src/data-backend/GaussianBackendProtocol";

const RAYCAST = {
  means: new ArrayBuffer(0),
  scalesOpacity: new ArrayBuffer(0),
  rotations: new ArrayBuffer(0),
  nodeBounds: new ArrayBuffer(0),
  nodeChildren: new ArrayBuffer(0),
  children: new ArrayBuffer(0),
  nodeIndices: new ArrayBuffer(0),
  indices: new ArrayBuffer(0),
};

class FakeTransport implements GaussianBackendTransport {
  requests: GaussianBackendRequest[] = [];
  transfers: Transferable[][] = [];
  listener: ((event: MessageEvent<GaussianBackendResult>) => void) | null =
    null;
  postMessage(
    request: GaussianBackendRequest,
    transfer: Transferable[] = [],
  ): void {
    this.requests.push(request);
    this.transfers.push(transfer);
  }
  addEventListener(
    _type: "message",
    listener: (event: MessageEvent<GaussianBackendResult>) => void,
  ): void {
    this.listener = listener;
  }
  removeEventListener(
    _type: "message",
    listener: (event: MessageEvent<GaussianBackendResult>) => void,
  ): void {
    if (this.listener === listener) this.listener = null;
  }
  reply(result: GaussianBackendResult): void {
    this.listener?.({ data: result } as MessageEvent<GaussianBackendResult>);
  }
}

describe("GaussianDataBackend request lifecycle", () => {
  it("transfers input ownership and correlates responses by request and resource", async () => {
    const transport = new FakeTransport();
    const backend = new GaussianDataBackend(transport);
    const buffer = new ArrayBuffer(64);
    const loaded = backend.loadBuffer(buffer);
    const request = transport.requests[0]!;
    expect(request.type).toBe("load-buffer");
    expect(transport.transfers[0]).toEqual([buffer]);
    transport.reply({
      type: "loaded",
      requestId: request.requestId + 1,
      resourceId: request.resourceId,
      count: 3,
      shDegree: 0,
      bounds: [0, 0, 0, 1, 1, 1],
      raycast: RAYCAST,
    });
    transport.reply({
      type: "loaded",
      requestId: request.requestId,
      resourceId: request.resourceId,
      count: 3,
      shDegree: 0,
      bounds: [0, 0, 0, 1, 1, 1],
      raycast: RAYCAST,
    });
    expect((await loaded).count).toBe(3);
    backend.dispose();
  });

  it("rejects stale selections and prevents a released resource from being queried", async () => {
    const transport = new FakeTransport();
    const backend = new GaussianDataBackend(transport);
    const old = backend.select("cloud", [0, 0, 0], 10);
    const next = backend.select("cloud", [1, 0, 0], 10);
    const [oldRequest, nextRequest] = transport.requests;
    const buffers = {
      means: new ArrayBuffer(0),
      scalesOpacity: new ArrayBuffer(0),
      rotations: new ArrayBuffer(0),
      shCoefficients: new ArrayBuffer(0),
    };
    transport.reply({
      type: "selected",
      requestId: oldRequest!.requestId,
      resourceId: "cloud",
      revision: 1,
      count: 0,
      shDegree: 0,
      buffers,
      renderedIndices: new ArrayBuffer(0),
    });
    await expect(old).rejects.toThrow(/Stale/);
    transport.reply({
      type: "selected",
      requestId: nextRequest!.requestId,
      resourceId: "cloud",
      revision: 2,
      count: 0,
      shDegree: 0,
      buffers,
      renderedIndices: new ArrayBuffer(0),
    });
    await expect(next).resolves.toMatchObject({ revision: 2 });
    const released = backend.release("cloud");
    await expect(backend.select("cloud", [0, 0, 0], 10)).rejects.toThrow(
      /released/,
    );
    transport.reply({
      type: "released",
      requestId: transport.requests[2]!.requestId,
      resourceId: "cloud",
    });
    await released;
    backend.dispose();
  });

  it("rejects pending calls on disposal and propagates worker errors", async () => {
    const transport = new FakeTransport();
    const backend = new GaussianDataBackend(transport);
    const failed = backend.loadUrl("bad.ply");
    transport.reply({
      type: "error",
      requestId: transport.requests[0]!.requestId,
      resourceId: transport.requests[0]!.resourceId,
      message: "invalid PLY",
    });
    await expect(failed).rejects.toThrow("invalid PLY");
    const pending = backend.loadUrl("slow.ply");
    backend.dispose();
    await expect(pending).rejects.toThrow(/disposed/);
    expect(transport.listener).toBeNull();
  });
});
