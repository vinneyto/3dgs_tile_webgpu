import type { WebGPURenderer } from "three/webgpu";
import type { GaussianPass, GaussianPassStats } from "../../src/index";
import type { KernelTimingInspector } from "./KernelTimingInspector";

const STATS_INTERVAL_MS = 1_500;
const DISPLAY_INTERVAL_MS = 250;
const MEMORY_WARMUP_FRAMES = 30;

export class DebugPanel {
  private pass: GaussianPass | null = null;
  private stats: GaussianPassStats | null = null;
  private frameCount = 0;
  private previousFrameTime = 0;
  private averageFrameMs = 0;
  private cpuEncodeMs = 0;
  private computeCalls = 0;
  private statsPending = false;
  private lastStatsTime = -Infinity;
  private lastDisplayTime = -Infinity;
  private memoryBaseline: number | null = null;

  constructor(
    private readonly renderer: WebGPURenderer,
    private readonly element: HTMLElement,
    private readonly kernelElement: HTMLElement,
    private readonly timingInspector: KernelTimingInspector | null,
    private readonly enabled: boolean,
    private readonly statsEnabled: boolean,
  ) {
    this.element.hidden = !enabled;
    this.kernelElement.hidden = !enabled;
  }

  setPass(pass: GaussianPass | null): void {
    this.pass = pass;
    this.stats = null;
    this.frameCount = 0;
    this.memoryBaseline = null;
    this.lastStatsTime = -Infinity;
  }

  update(time: number, cpuEncodeMs: number): void {
    if (!this.enabled) return;

    this.frameCount++;
    this.cpuEncodeMs = cpuEncodeMs;
    this.computeCalls = this.renderer.info.compute.frameCalls;
    if (this.previousFrameTime > 0) {
      const frameMs = time - this.previousFrameTime;
      this.averageFrameMs =
        this.averageFrameMs === 0
          ? frameMs
          : this.averageFrameMs * 0.9 + frameMs * 0.1;
    }
    this.previousFrameTime = time;

    if (
      this.memoryBaseline === null &&
      this.pass !== null &&
      this.frameCount >= MEMORY_WARMUP_FRAMES
    ) {
      this.memoryBaseline = this.renderer.info.memory.total;
    }

    if (
      this.pass !== null &&
      this.statsEnabled &&
      !this.statsPending &&
      time - this.lastStatsTime >= STATS_INTERVAL_MS
    ) {
      this.readIntersectionStats(time);
    }
    if (time - this.lastDisplayTime >= DISPLAY_INTERVAL_MS) {
      this.lastDisplayTime = time;
      this.render();
    }
  }

  private readIntersectionStats(time: number): void {
    const pass = this.pass;
    if (pass === null) return;
    this.statsPending = true;
    this.lastStatsTime = time;
    void pass
      .readStats()
      .then((stats) => {
        if (this.pass === pass) this.stats = stats;
      })
      .catch((error: unknown) => {
        console.warn("3DGS diagnostic readback failed", error);
      })
      .finally(() => {
        if (this.pass === pass) this.statsPending = false;
      });
  }

  private render(): void {
    const info = this.renderer.info;
    const memory = info.memory;
    const debug = this.pass?.getDebugInfo() ?? null;
    const memoryDelta =
      this.memoryBaseline === null ? null : memory.total - this.memoryBaseline;
    const fps = this.averageFrameMs > 0 ? 1_000 / this.averageFrameMs : 0;
    const intersectionLine =
      this.stats === null
        ? "intersections  waiting for GPU readback"
        : `intersections  ${formatInteger(this.stats.intersectionCount)} / ${formatInteger(this.stats.intersectionCapacity)}`;
    const visibleLine =
      this.stats === null
        ? "visible        —"
        : `visible        ${formatInteger(this.stats.visibleGaussianCount)} Gaussians`;
    const requestedLine =
      this.stats === null
        ? "requested      —"
        : `requested      ${formatInteger(this.stats.requestedIntersections)}  overflow ${this.stats.overflow ? "YES" : "no"}`;
    const timings = this.timingInspector?.latest ?? null;
    const timestampLine =
      this.timingInspector === null
        ? "GPU timestamp  unavailable on this adapter"
        : `GPU compute    ${formatMs(timings?.computeMs ?? null)}  present ${formatMs(timings?.renderMs ?? null)}`;
    const pipelineLine =
      debug === null || !debug.initialized
        ? "pipeline       waiting for first frame"
        : `pipeline       ${debug.width}×${debug.height}  tiles ${debug.tilesX}×${debug.tilesY}`;
    const stagesLine =
      debug === null
        ? "stages         —"
        : `stages         rebuilds ${debug.tileStageRebuilds}  radix depth ${debug.depthRadixPasses} + tile ${debug.tileRadixPasses}`;

    this.element.textContent = [
      `FPS ${fps.toFixed(1).padStart(5)}  frame ${formatMs(this.averageFrameMs)}`,
      `CPU encode     ${formatMs(this.cpuEncodeMs)}  compute calls ${this.computeCalls}`,
      timestampLine,
      "",
      visibleLine,
      intersectionLine,
      requestedLine,
      pipelineLine,
      stagesLine,
      "",
      `GPU tracked    ${formatBytes(memory.total)}  Δ ${formatDelta(memoryDelta)}`,
      `storage        ${memory.storageAttributes} / ${formatBytes(memory.storageAttributesSize)}`,
      `indirect       ${memory.indirectStorageAttributes} / ${formatBytes(memory.indirectStorageAttributesSize)}`,
      `textures       ${memory.textures} / ${formatBytes(memory.texturesSize)}`,
      `programs       ${memory.programs} / ${formatBytes(memory.programsSize)}`,
      this.statsEnabled
        ? "stats readback every 1.5 s · ?stats=0 disables it"
        : "stats readback disabled · ?debug=0 disables diagnostics",
    ].join("\n");

    this.renderKernelTimings(debug?.profileKernels ?? false);
  }

  private renderKernelTimings(profileKernels: boolean): void {
    const timings = this.timingInspector?.latest ?? null;
    if (this.timingInspector === null) {
      this.kernelElement.textContent = "Timestamp queries are unavailable.";
      return;
    }
    if (timings === null) {
      this.kernelElement.textContent =
        "Waiting for the first resolved GPU frame…";
      return;
    }

    const rows = timings.kernels.map((kernel) => {
      const calls = kernel.calls > 1 ? ` ×${kernel.calls}` : "";
      return `${kernel.name.padEnd(42)} ${formatMs(kernel.gpuMs)}${calls}`;
    });
    this.kernelElement.textContent = [
      `${profileKernels ? "individual kernels" : "batched groups"} · GPU frame ${timings.frameId}`,
      ...rows,
      "",
      profileKernels
        ? "?profile=kernels splits the batched prepare/emit group"
        : "Radix stages already have individual timing boundaries",
    ].join("\n");
  }
}

function formatInteger(value: number): string {
  return value.toLocaleString("en-US");
}

function formatMs(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? "—".padStart(8)
    : `${value.toFixed(2)} ms`.padStart(8);
}

function formatBytes(value: number): string {
  if (value < 1_024) return `${value} B`;
  if (value < 1_048_576) return `${(value / 1_024).toFixed(1)} KiB`;
  return `${(value / 1_048_576).toFixed(1)} MiB`;
}

function formatDelta(value: number | null): string {
  if (value === null) return "warming up";
  if (value === 0) return "stable";
  return `${value > 0 ? "+" : "−"}${formatBytes(Math.abs(value))}`;
}
