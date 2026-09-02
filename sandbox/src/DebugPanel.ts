import type { WebGPURenderer } from "three/webgpu";
import type {
  GaussianPass,
  GaussianPassStats,
  GaussianStorePackStats,
  GaussianStoreSlotRange,
  GaussianTileCapStats,
} from "../../src/index";
import type { KernelTimingInspector } from "./KernelTimingInspector";

const STATS_INTERVAL_MS = 1_500;
const DISPLAY_INTERVAL_MS = 250;
const MEMORY_WARMUP_FRAMES = 30;
const KERNEL_SCROLL_IDLE_MS = 500;

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
  private packStats: GaussianStorePackStats | null = null;
  private packDurationMs = 0;
  private packCount = 0;
  private packingCenterX = 0;
  private kernelScrollActiveUntil = -Infinity;

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
    this.kernelElement.addEventListener(
      "scroll",
      () => {
        this.kernelScrollActiveUntil =
          performance.now() + KERNEL_SCROLL_IDLE_MS;
      },
      { passive: true },
    );
  }

  setPass(pass: GaussianPass | null): void {
    this.pass = pass;
    this.stats = null;
    this.frameCount = 0;
    this.memoryBaseline = null;
    this.lastStatsTime = -Infinity;
    this.packStats = null;
    this.packDurationMs = 0;
    this.packCount = 0;
    this.packingCenterX = 0;
  }

  recordPack(
    stats: GaussianStorePackStats,
    durationMs: number,
    centerX: number,
  ): void {
    this.packStats = stats;
    this.packDurationMs = durationMs;
    this.packingCenterX = centerX;
    this.packCount++;
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
    const profileKernels = debug?.profileKernels ?? false;
    const timestampLine =
      this.timingInspector === null
        ? profileKernels
          ? "GPU timestamp  unavailable: adapter lacks timestamp-query"
          : "GPU timings    ?profile=kernels enables timestamp profiling"
        : timings === null
          ? "GPU timings    waiting for timestamp resolution"
          : `GPU compute    ${formatMs(timings.computeMs)}  present ${formatMs(timings.renderMs)}`;
    const pipelineLine =
      debug === null || !debug.initialized
        ? "pipeline       waiting for first frame"
        : `pipeline       ${debug.width}×${debug.height}  tiles ${debug.tilesX}×${debug.tilesY}`;
    const stagesLine =
      debug === null
        ? "stages         —"
        : `stages         rebuilds ${debug.tileStageRebuilds}  radix ${debug.radixBackend} depth ${debug.depthRadixPasses} + tile ${debug.tileRadixPasses}`;
    const packingLines = this.packStatsLines();
    const profileLines = this.profileStatsLines(profileKernels);

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
      ...profileLines,
      "",
      ...packingLines,
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

    this.renderKernelTimings(profileKernels);
  }

  private profileStatsLines(profileKernels: boolean): string[] {
    if (!profileKernels) {
      return ["tile profile   ?profile=kernels enables distribution stats"];
    }
    const profile = this.stats?.profile ?? null;
    if (profile === null) {
      return ["tile profile   waiting for GPU readback"];
    }
    const loads = profile.tileLoads;
    return [
      `tile splats    max ${formatInteger(loads.max)}  mean ${loads.mean.toFixed(1)}  median ${loads.median.toFixed(1)}`,
      `percentiles    p95 ${formatInteger(loads.p95)}  p99 ${formatInteger(loads.p99)}`,
      `heavy tiles    >256 ${formatInteger(loads.tilesOver256)}  >512 ${formatInteger(loads.tilesOver512)}`,
      `               >1024 ${formatInteger(loads.tilesOver1024)}  >2048 ${formatInteger(loads.tilesOver2048)}`,
      `raster batches total ${formatInteger(loads.totalBatches)}  max/tile ${formatInteger(loads.maxBatches)}`,
      `subpixel       zero-pixel ${formatInteger(profile.zeroPixelSubpixelSplats)}`,
      ...profile.tileCapEstimates.flatMap((estimate) =>
        formatTileCap("cap estimate", estimate),
      ),
      ...(profile.appliedTileCap === null
        ? ["raster cap     off · ?tileCap=2048 enables it"]
        : formatTileCap("raster cap", profile.appliedTileCap)),
    ];
  }

  private packStatsLines(): string[] {
    const stats = this.packStats;
    if (stats === null) return ["LOD repack     waiting for moving center"];
    return [
      `LOD repack     #${this.packCount}  CPU ${formatMs(this.packDurationMs)}  center.x ${this.packingCenterX.toFixed(2)} m`,
      `pack phases    plan ${formatMs(stats.planningMs)}  slots ${formatMs(stats.slotUpdateMs)}`,
      `slots          active ${formatInteger(stats.activeGaussians)} / ${formatInteger(stats.slotCapacity)}`,
      `slot delta     reused ${formatInteger(stats.reusedSlots)}  written ${formatInteger(stats.writtenSlots)}  cleared ${formatInteger(stats.clearedSlots)}`,
      `GPU upload     approximately ${formatBytes(stats.estimatedUploadBytes)}`,
      ...formatRanges("full upload", stats.writtenSlotRanges),
      ...formatRanges("opacity only", stats.clearedSlotRanges),
    ];
  }

  private renderKernelTimings(profileKernels: boolean): void {
    if (performance.now() < this.kernelScrollActiveUntil) return;
    const timings = this.timingInspector?.latest ?? null;
    if (this.timingInspector === null) {
      setTextPreservingScroll(
        this.kernelElement,
        profileKernels
          ? "Timestamp queries are unavailable on this adapter.\nThe tile and subpixel profile remains available above."
          : "Open with ?profile=kernels to collect individual GPU kernel timings and distribution metrics.",
      );
      return;
    }
    if (timings === null) {
      setTextPreservingScroll(
        this.kernelElement,
        "Waiting for the first resolved GPU frame…",
      );
      return;
    }

    const rows = timings.kernels.map((kernel) => {
      const calls = kernel.calls > 1 ? ` ×${kernel.calls}` : "";
      return `${kernel.name.padEnd(42)} ${formatMs(kernel.gpuMs)}${calls}`;
    });
    setTextPreservingScroll(
      this.kernelElement,
      [
        `${profileKernels ? "individual kernels" : "batched groups"} · GPU frame ${timings.frameId}`,
        ...rows,
        "",
        profileKernels
          ? "?profile=kernels splits the batched prepare/emit group"
          : "Radix stages already have individual timing boundaries",
      ].join("\n"),
    );
  }
}

function formatTileCap(label: string, stats: GaussianTileCapStats): string[] {
  return [
    `${label.padEnd(14)} ${formatInteger(stats.cap)}  drop ${formatInteger(stats.droppedIntersections)} (${(stats.droppedFraction * 100).toFixed(1)}%)  tiles ${formatInteger(stats.affectedTiles)}`,
    `               raster ${formatInteger(stats.rasterizedIntersections)}  batches ${formatInteger(stats.totalBatches)}  max/tile ${formatInteger(stats.maxBatches)}`,
  ];
}

function setTextPreservingScroll(element: HTMLElement, text: string): void {
  if (element.textContent === text) return;
  const scrollTop = element.scrollTop;
  element.textContent = text;
  element.scrollTop = scrollTop;
}

function formatRanges(
  label: string,
  ranges: readonly GaussianStoreSlotRange[],
): string[] {
  const shown = ranges
    .slice(0, 10)
    .map((range) => `[${range.start}, ${range.start + range.count})`);
  const rows: string[] = [];
  for (let index = 0; index < shown.length; index += 3) {
    rows.push(`  ${shown.slice(index, index + 3).join(" ")}`);
  }
  if (rows.length === 0) rows.push("  —");
  if (ranges.length > shown.length) rows[rows.length - 1] += " …";
  return [`${label.padEnd(14)} ${ranges.length} ranges`, ...rows];
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
