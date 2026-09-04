import {
  TimestampQuery,
  type ComputeNode,
  type WebGPURenderer,
} from "three/webgpu";
import { RendererInspector } from "three/addons/inspector/RendererInspector.js";

export interface KernelTiming {
  name: string;
  calls: number;
  gpuMs: number;
  cpuMs: number;
}

export interface FrameKernelTimings {
  frameId: number;
  computeMs: number;
  renderMs: number;
  kernels: KernelTiming[];
}

interface InspectorComputeStats {
  uid: string;
  computeNode: ComputeNode | ComputeNode[];
  cpu: number;
  gpu: number;
}

interface InspectorRenderStats {
  uid: string;
  gpu: number;
}

interface ResolvedInspectorFrame {
  frameId: number;
  computes: InspectorComputeStats[];
  renders: InspectorRenderStats[];
  resolvedCompute?: boolean;
  resolvedRender?: boolean;
}

interface TimestampBackend {
  trackTimestamp: boolean;
  timestampQueryPool?: {
    compute?: TimestampPool | null;
    render?: TimestampPool | null;
  };
  hasTimestampQuery(uid: string): boolean;
  getTimestamp(uid: string): number;
}

interface TimestampPool {
  trackTimestamp: boolean;
}

/** Uses Three.js' inspector/timestamp integration without accessing GPUDevice. */
export class KernelTimingInspector extends RendererInspector {
  latest: FrameKernelTimings | null = null;
  private timestampResolution: Promise<void> | null = null;
  private timestampReadback: Promise<unknown> | null = null;
  private sampledFramePending = false;
  private timestampErrorReported = false;

  constructor() {
    super();
    // Frames rendered while a timestamp readback is pending are intentionally
    // not sampled. Keep enough metadata for a slow GPU to finish the sampled
    // frame without it being evicted by RendererInspector.
    Object.assign(this, { maxFrames: 256 });
  }

  resolveFrame(value: unknown): void {
    const frame = value as ResolvedInspectorFrame;
    this.releaseTimestampSamples(frame);
    const kernels = new Map<string, KernelTiming>();
    let computeMs = 0;

    for (const stats of frame.computes) {
      const name = computeGroupName(stats.computeNode);
      if (!name.startsWith("3DGS ")) continue;
      computeMs += stats.gpu;
      const existing = kernels.get(name);
      if (existing === undefined) {
        kernels.set(name, {
          name: compactName(name),
          calls: 1,
          gpuMs: stats.gpu,
          cpuMs: stats.cpu,
        });
      } else {
        existing.calls++;
        existing.gpuMs += stats.gpu;
        existing.cpuMs += stats.cpu;
      }
    }

    this.latest = {
      frameId: frame.frameId,
      computeMs,
      renderMs: frame.renders.reduce((sum, stats) => sum + stats.gpu, 0),
      kernels: [...kernels.values()],
    };
  }

  /** Disable Three.js' continuous query allocation and sample on demand. */
  enableControlledSampling(renderer: WebGPURenderer): void {
    setTimestampTracking(renderer, false);
  }

  /** Enable timestamp allocation for one frame when no readback is pending. */
  beginFrameSample(renderer: WebGPURenderer): boolean {
    if (
      this.timestampResolution !== null ||
      this.timestampReadback !== null ||
      this.sampledFramePending
    ) {
      setTimestampTracking(renderer, false);
      return false;
    }
    this.sampledFramePending = true;
    setTimestampTracking(renderer, true);
    return true;
  }

  /** Stop allocation and drain both pools as soon as frame encoding completes. */
  endFrameSample(renderer: WebGPURenderer): void {
    if (!this.sampledFramePending || this.timestampReadback !== null) {
      setTimestampTracking(renderer, false);
      return;
    }
    // The renderer is already initialized, so both calls synchronously enter
    // Three.js' pools and reset their cursors before waiting for mapAsync().
    setTimestampTracking(renderer, true);
    this.timestampReadback = Promise.all([
      renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE),
      renderer.resolveTimestampsAsync(TimestampQuery.RENDER),
    ]);
    setTimestampTracking(renderer, false);
  }

  /**
   * RendererInspector calls this from finish(), after all queries for the
   * sampled frame have been registered. Pause new query allocation until the
   * GPU readback completes; Three.js cannot start another resolve while the
   * query pool has a pending mapAsync().
   */
  resolveTimestamp(): Promise<void> {
    if (this.timestampResolution !== null) return this.timestampResolution;
    if (!this.sampledFramePending) return Promise.resolve();
    this.sampledFramePending = false;
    const renderer = this.getRenderer() as WebGPURenderer | null;
    if (renderer === null) return Promise.resolve();
    const backend = timestampBackend(renderer);
    const frames = (this as unknown as { frames: ResolvedInspectorFrame[] })
      .frames;
    const frame = frames.at(-1);
    if (frame === undefined) return Promise.resolve();

    const readback = this.timestampReadback ?? Promise.resolve();
    this.timestampResolution = readback
      .then(() => this.resolveSampledFrame(frame, backend))
      .catch((error: unknown) => this.reportTimestampError(error))
      .finally(() => {
        setTimestampTracking(renderer, false);
        this.timestampReadback = null;
        this.timestampResolution = null;
      });
    return this.timestampResolution;
  }

  private resolveSampledFrame(
    frame: ResolvedInspectorFrame,
    backend: TimestampBackend,
  ): void {
    for (const stats of frame.computes) {
      stats.gpu = backend.hasTimestampQuery(stats.uid)
        ? backend.getTimestamp(stats.uid)
        : 0;
    }
    for (const stats of frame.renders) {
      stats.gpu = backend.hasTimestampQuery(stats.uid)
        ? backend.getTimestamp(stats.uid)
        : 0;
    }
    frame.resolvedCompute = true;
    frame.resolvedRender = true;
    this.resolveFrame(frame);
  }

  private reportTimestampError(error: unknown): void {
    if (this.timestampErrorReported) return;
    this.timestampErrorReported = true;
    console.error("Unable to resolve WebGPU timestamps", error);
  }

  private releaseTimestampSamples(frame: ResolvedInspectorFrame): void {
    const renderer = this.getRenderer() as unknown as {
      backend?: {
        timestampQueryPool?: {
          compute?: { timestamps: Map<string, number> };
          render?: { timestamps: Map<string, number> };
        };
      };
    } | null;
    const pools = renderer?.backend?.timestampQueryPool;
    if (pools === undefined) return;
    for (const stats of frame.computes) {
      pools.compute?.timestamps.delete(stats.uid);
    }
    for (const stats of frame.renders) {
      pools.render?.timestamps.delete(stats.uid);
    }
  }
}

function timestampBackend(renderer: WebGPURenderer): TimestampBackend {
  return renderer.backend as unknown as TimestampBackend;
}

function setTimestampTracking(
  renderer: WebGPURenderer,
  enabled: boolean,
): void {
  const backend = timestampBackend(renderer);
  backend.trackTimestamp = enabled;
  const computePool = backend.timestampQueryPool?.compute;
  const renderPool = backend.timestampQueryPool?.render;
  if (computePool != null) computePool.trackTimestamp = enabled;
  if (renderPool != null) renderPool.trackTimestamp = enabled;
}

function computeGroupName(group: ComputeNode | ComputeNode[]): string {
  if (!Array.isArray(group)) return group.name;
  return group.map((node) => node.name).join(" + ");
}

function compactName(name: string): string {
  return name
    .replaceAll("3DGS ", "")
    .replaceAll(" WGSL", "")
    .replaceAll("radix ", "radix/")
    .replaceAll("tile ", "tile/");
}
