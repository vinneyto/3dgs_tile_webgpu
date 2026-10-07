import init, { GaussianEngine } from "./generated/gaussian_backend";
import wasmUrl from "./generated/gaussian_backend_bg.wasm?url&inline";
import type { GaussianBackend } from "../streaming-backend/GaussianBackend";
import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type {
  BackendResponse,
  BackendFailure,
  BackendPayload,
  BackendMetrics,
} from "../streaming-backend/BackendResponse";
import type { CloudLoadOptions } from "../streaming-backend/CloudLoadOptions";

// wasm-bindgen's initializer does not coalesce concurrent calls. All engines
// in one realm must share the same WASM instance and its linear memory.
let wasmReady: Promise<unknown> | null = null;
function initializeWasm(): Promise<unknown> {
  return (wasmReady ??= init({ module_or_path: wasmUrl }).catch(
    (error: unknown) => {
      wasmReady = null;
      throw error;
    },
  ));
}

/** Transport-neutral TS shell. Parsing, mipmaps, selection, budgets and packing
 * run in Rust. In production instantiate this inside the worker endpoint. */
export class WasmGaussianBackend implements GaussianBackend {
  private readonly listeners = new Set<(response: BackendResponse) => void>();
  private readonly failures = new Set<(failure: BackendFailure) => void>();
  private readonly ready: Promise<GaussianEngine>;
  private engine: GaussianEngine | null = null;
  private active: AbortController | null = null;
  private activeId: string | null = null;
  private disposed = false;

  constructor(
    config: BackendConfig = {},
    private readonly afterUpload?: () => Promise<void>,
  ) {
    this.ready = initializeWasm().then(() => {
      const engine = new GaussianEngine(config);
      if (this.disposed) {
        engine.free();
        throw new Error("Gaussian backend disposed");
      }
      this.engine = engine;
      return engine;
    });
    // Initialization failures are reported with the first command; suppress
    // an unhandled rejection if a store is disposed before dispatching one.
    void this.ready.catch(() => {});
  }
  subscribe(listener: (response: BackendResponse) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  onFailure(listener: (failure: BackendFailure) => void): () => void {
    this.failures.add(listener);
    return () => this.failures.delete(listener);
  }
  dispatch(command: BackendCommand): void {
    if (this.disposed) throw new Error("Gaussian backend disposed");
    if (this.active)
      throw new Error("Gaussian backend requires serial dispatch");
    const controller = new AbortController();
    this.active = controller;
    this.activeId = command.id;
    void this.execute(command, controller);
  }
  abort(commandId: string): void {
    if (commandId === this.activeId) this.active?.abort();
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active?.abort();
    this.engine?.free();
    this.engine = null;
    this.listeners.clear();
    this.failures.clear();
  }
  private async execute(
    command: BackendCommand,
    controller: AbortController,
  ): Promise<void> {
    const start = performance.now();
    let metrics: BackendMetrics | undefined;
    const emit = (
      payload?: BackendPayload,
      error?: BackendResponse["error"],
      isFinal = false,
    ): void => {
      if (this.disposed) return;
      const response: BackendResponse = {
        command: { id: command.id, type: command.type },
        durationMs: performance.now() - start,
        metrics: metrics ? { ...metrics } : undefined,
        isFinal,
        payload,
        error,
      };
      for (const listener of this.listeners) listener(response);
    };
    try {
      const engine = await this.ready;
      let bytes = new Uint8Array();
      let wire: unknown = command;
      if (command.type === "load-cloud") {
        const response = await fetch(command.url, {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            `Gaussian fetch failed: ${response.status} ${response.statusText}`,
          );
        bytes = new Uint8Array(await response.arrayBuffer());
        wire = {
          ...command,
          type: "load-cloud-from-buffer",
          options: encodeOptions({
            ...command.options,
            fileName: command.options?.fileName ?? command.url,
          }),
        };
      } else if (command.type === "load-cloud-from-buffer") {
        bytes = new Uint8Array(command.buffer);
        wire = {
          ...command,
          buffer: undefined,
          options: encodeOptions(command.options),
        };
      } else if (command.type === "write-attribute-range") {
        const isUint =
          command.attribute === "shCoefficients" ||
          this.attributeFormats.get(
            `${command.cloudId}:${command.attribute}`,
          ) === "u32";
        if (command.data.byteLength % 4 !== 0)
          throw new RangeError(
            "Attribute update must contain complete 32-bit values",
          );
        wire = {
          ...command,
          data: Array.from(
            isUint
              ? new Uint32Array(command.data)
              : new Float32Array(command.data),
          ),
        };
      }
      controller.signal.throwIfAborted();
      const computeStart = performance.now();
      const payloads = engine.begin(wire, bytes) as BackendPayload[];
      metrics = {
        computeMs: performance.now() - computeStart,
        ...engine.timings(),
        streamCopyMs: 0,
        uploadWaitMs: 0,
        uploadedBytes: 0,
        uploadBatches: 0,
      };
      const deliver = async (payload: BackendPayload): Promise<void> => {
        const upload =
          payload.type === "buffers-patched" ||
          payload.type === "buffers-replaced" ||
          payload.type === "buffers-allocated";
        if (metrics && upload) {
          const buffers =
            payload.type === "buffers-patched"
              ? payload.patches
              : payload.type === "buffers-replaced"
                ? payload.attributes
                : [];
          metrics.uploadedBytes += buffers.reduce(
            (sum, item) => sum + item.data.byteLength,
            0,
          );
          metrics.uploadBatches += 1;
        }
        emit(payload);
        if (upload) {
          const waitStart = performance.now();
          await (this.afterUpload?.() ??
            new Promise<void>((resolve) => setTimeout(resolve, 0)));
          if (metrics) metrics.uploadWaitMs += performance.now() - waitStart;
        }
      };
      if (
        command.type === "load-cloud" ||
        command.type === "load-cloud-from-buffer"
      ) {
        for (const a of command.options?.attributes ?? [])
          this.attributeFormats.set(`${command.cloudId}:${a.name}`, a.format);
      } else if (command.type === "unload-cloud") {
        for (const key of this.attributeFormats.keys())
          if (key.startsWith(`${command.cloudId}:`))
            this.attributeFormats.delete(key);
      }
      // Once committed, complete every patch even if an abort arrives.
      for (const payload of payloads) {
        if (this.disposed) return;
        await deliver(payload);
      }
      while (!this.disposed) {
        const copyStart = performance.now();
        const payload = engine.nextPayload() as BackendPayload | null;
        if (metrics) metrics.streamCopyMs += performance.now() - copyStart;
        if (!payload) break;
        await deliver(payload);
      }
      this.active = null;
      this.activeId = null;
      emit(undefined, undefined, true);
    } catch (e) {
      this.active = null;
      this.activeId = null;
      emit(
        undefined,
        {
          code: controller.signal.aborted
            ? "cancelled"
            : "backend-command-error",
          message: e instanceof Error ? e.message : String(e),
        },
        true,
      );
    } finally {
      if (this.active === controller) {
        this.active = null;
        this.activeId = null;
      }
    }
  }
  private readonly attributeFormats = new Map<string, "f32" | "u32">();
}

function encodeOptions(options: CloudLoadOptions = {}): unknown {
  return {
    ...options,
    attributes: (options.attributes ?? []).map((a) => ({
      ...a,
      source:
        a.source.kind === "buffer"
          ? {
              kind: "buffer",
              data: Array.from(
                a.format === "f32"
                  ? new Float32Array(a.source.data)
                  : new Uint32Array(a.source.data),
              ),
            }
          : a.source,
    })),
  };
}
