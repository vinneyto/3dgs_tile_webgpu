import type {
  GaussianBackendLoadOptions,
  GaussianBackendPackedBuffers,
  GaussianBackendRequest,
  GaussianBackendResult,
  GaussianBackendTransport,
  GaussianRaycastBuffers,
} from "./GaussianBackendProtocol";
import GaussianDataWorker from "./GaussianDataWorker?worker&inline";

export interface GaussianBackendResource {
  readonly resourceId: string;
  readonly count: number;
  readonly shDegree: 0 | 1 | 2 | 3;
  readonly bounds: readonly [number, number, number, number, number, number];
  readonly raycast: GaussianRaycastBuffers;
}

export interface GaussianBackendSelection {
  readonly resourceId: string;
  readonly revision: number;
  readonly count: number;
  readonly shDegree: 0 | 1 | 2 | 3;
  readonly buffers: GaussianBackendPackedBuffers;
  readonly renderedIndices: ArrayBuffer;
}

type RequestBody = GaussianBackendRequest extends infer T
  ? T extends { requestId: number }
    ? Omit<T, "requestId">
    : never
  : never;

/** A small promise client for the transport-neutral, worker-owned Gaussian store. */
export class GaussianDataBackend {
  private readonly transport: GaussianBackendTransport;
  private readonly ownsTransport: boolean;
  private readonly pending = new Map<
    number,
    {
      resourceId: string;
      resolve: (result: GaussianBackendResult) => void;
      reject: (reason: Error) => void;
    }
  >();
  private readonly revisions = new Map<string, number>();
  private readonly released = new Set<string>();
  private nextRequestId = 0;
  private nextResourceId = 0;
  private disposed = false;

  constructor(transport?: GaussianBackendTransport) {
    this.ownsTransport = transport === undefined;
    this.transport = transport ?? new GaussianDataWorker({ name: "3dgs-data" });
    this.transport.addEventListener("message", this.handleMessage);
  }

  async loadUrl(
    url: string,
    options: GaussianBackendLoadOptions = {},
  ): Promise<GaussianBackendResource> {
    const resourceId = this.newResourceId();
    const result = await this.send({
      type: "load-url",
      resourceId,
      url,
      options,
    });
    if (result.type !== "loaded")
      throw new Error("Unexpected Gaussian load response");
    return result;
  }

  async loadBuffer(
    buffer: ArrayBuffer,
    options: GaussianBackendLoadOptions = {},
  ): Promise<GaussianBackendResource> {
    const resourceId = this.newResourceId();
    const result = await this.send(
      { type: "load-buffer", resourceId, buffer, options },
      [buffer],
    );
    if (result.type !== "loaded")
      throw new Error("Unexpected Gaussian load response");
    return result;
  }

  /** Selection packs only the chosen splats and transfers ownership of the four GPU input buffers. */
  async select(
    resourceId: string,
    center: readonly [number, number, number],
    maxGaussians: number,
    levelDistance?: number,
  ): Promise<GaussianBackendSelection> {
    const revision = (this.revisions.get(resourceId) ?? 0) + 1;
    this.revisions.set(resourceId, revision);
    const result = await this.send({
      type: "select",
      resourceId,
      revision,
      center,
      maxGaussians,
      levelDistance,
    });
    if (result.type !== "selected")
      throw new Error("Unexpected Gaussian selection response");
    if (this.revisions.get(resourceId) !== result.revision)
      throw new Error("Stale Gaussian selection response");
    return result;
  }

  async release(resourceId: string): Promise<void> {
    if (this.released.has(resourceId)) return;
    this.released.add(resourceId);
    this.revisions.delete(resourceId);
    for (const [id, pending] of this.pending) {
      if (pending.resourceId !== resourceId) continue;
      this.pending.delete(id);
      pending.reject(new Error("Gaussian resource released"));
    }
    const result = await this.send({ type: "release", resourceId });
    if (result.type !== "released")
      throw new Error("Unexpected Gaussian release response");
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.transport.removeEventListener("message", this.handleMessage);
    if (this.ownsTransport) this.transport.terminate?.();
    for (const pending of this.pending.values())
      pending.reject(new Error("Gaussian backend disposed"));
    this.pending.clear();
    this.revisions.clear();
    this.released.clear();
  }

  private newResourceId(): string {
    if (this.disposed) throw new Error("Gaussian backend disposed");
    return `gaussian-${++this.nextResourceId}`;
  }

  private send(
    body: RequestBody,
    transfer?: Transferable[],
  ): Promise<GaussianBackendResult> {
    if (this.disposed)
      return Promise.reject(new Error("Gaussian backend disposed"));
    if (body.type !== "release" && this.released.has(body.resourceId)) {
      return Promise.reject(new Error("Gaussian resource released"));
    }
    const requestId = ++this.nextRequestId;
    const request = { ...body, requestId } as GaussianBackendRequest;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, {
        resourceId: body.resourceId,
        resolve,
        reject,
      });
      try {
        this.transport.postMessage(request, transfer);
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    });
  }

  private readonly handleMessage = ({
    data,
  }: MessageEvent<GaussianBackendResult>): void => {
    const pending = this.pending.get(data.requestId);
    if (pending === undefined) return;
    this.pending.delete(data.requestId);
    if (pending.resourceId !== data.resourceId) {
      pending.reject(new Error("Gaussian backend resource mismatch"));
    } else if (data.type === "error") {
      pending.reject(new Error(data.message));
    } else {
      pending.resolve(data);
    }
  };
}
