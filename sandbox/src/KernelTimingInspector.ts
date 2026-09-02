import type { ComputeNode } from "three/webgpu";
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
}

/** Uses Three.js' inspector/timestamp integration without accessing GPUDevice. */
export class KernelTimingInspector extends RendererInspector {
  latest: FrameKernelTimings | null = null;

  constructor() {
    super();
    // RendererInspector retains frame metadata for its UI. The sandbox only
    // needs the latest samples, so keep this bounded and small.
    Object.assign(this, { maxFrames: 8 });
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
