import type {
  Camera,
  ComputeNode,
  StorageBufferAttribute,
  StorageTexture,
  WebGPURenderer,
} from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import type { GaussianRenderStore } from "../GaussianRenderStore";
import type {
  GaussianNodeSlots,
  GaussianProjectionNodeSlots,
  GaussianRasterNodeSlots,
} from "../nodes/GaussianContextNodes";
import { DepthOrderedTileStage } from "./DepthOrderedTileStage";
import { ExclusiveScanStage } from "./ExclusiveScanStage";
import { FrameUniforms } from "./FrameUniforms";
import { IntersectionStage } from "./IntersectionStage";
import { ObjectFrameState } from "./ObjectFrameState";
import { ProjectionStage } from "./ProjectionStage";
import { ProfileDiagnosticsStage } from "./ProfileDiagnosticsStage";
import { RasterChunkWorkspace } from "./RasterChunkWorkspace";
import { RadixSorter } from "./RadixSorter";
import { TileOffsetBuilder } from "./TileOffsetBuilder";
import { TileRasterizer } from "./TileRasterizer";
import { VisibleGaussianStage } from "./VisibleGaussianStage";
import { StorageBindings } from "./StorageBindings";
import { createGaussianPassComposition } from "../passes/createGaussianPassComposition";
import {
  validateGaussianPassComposition,
  type GaussianPassComposition,
} from "../passes/GaussianPassComposition";
import type { GaussianDataPassRuntime } from "../passes/GaussianDataPass";
import type { GaussianPassContext } from "../passes/GaussianPassContext";
import type { GaussianOrderingRuntime } from "../passes/GaussianOrderingPass";
import type { GaussianIntersectionRuntime } from "../passes/GaussianIntersectionPass";
import type { GaussianRasterRuntime } from "../passes/GaussianRasterPass";
import { TILE_SIZE } from "./constants";
import type {
  AntialiasMode,
  GaussianRenderDomain,
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassResources,
  GaussianPassStats,
  ResolvedRadixBackend,
} from "./types";

export class TiledGaussianPipeline {
  readonly passes: GaussianPassComposition;
  private readonly dataRuntime: GaussianDataPassRuntime;
  private readonly orderingRuntime: GaussianOrderingRuntime;
  private readonly intersectionRuntime: GaussianIntersectionRuntime;
  private rasterRuntime: GaussianRasterRuntime | null = null;
  readonly frame: FrameUniforms;
  readonly objects: ObjectFrameState;
  readonly projection: ProjectionStage;
  readonly profileDiagnostics: ProfileDiagnosticsStage | null;
  readonly visibleScan: ExclusiveScanStage;
  readonly visible: VisibleGaussianStage;
  readonly depthSorter: RadixSorter;
  readonly orderedTiles: DepthOrderedTileStage;
  readonly scan: ExclusiveScanStage;
  intersections: IntersectionStage;
  sorter: RadixSorter;

  private readonly bindings: StorageBindings;
  private disposed = false;
  private resourceUpdates = 0;
  private shaderGeneration = 0;
  private tileOffsets: TileOffsetBuilder | null = null;
  private rasterizer: TileRasterizer | null = null;
  private width = 0;
  private height = 0;
  private tilesX = 0;
  private tilesY = 0;
  private tileStageRebuilds = 0;
  private tileCapacity = 0;
  private chunkWorkspace: RasterChunkWorkspace | null = null;

  constructor(
    private readonly renderer: WebGPURenderer,
    camera: Camera,
    private data: GaussianData,
    store: GaussianRenderStore,
    private readonly mode: DepthSortMode,
    private readonly antialiasMode: AntialiasMode,
    private capacity: number,
    background: readonly [number, number, number, number],
    private readonly profileKernels: boolean,
    private readonly maxRasterizedSplatsPerTile: number | null,
    private readonly rasterChunkSize: number | null,
    private readonly subpixelSampleCulling: boolean,
    private readonly radixBackend: ResolvedRadixBackend,
    nodes: GaussianNodeSlots,
    private readonly rasterTransmittanceThreshold = 1e-4,
    private readonly rasterStats = false,
    private readonly depthAlphaThreshold = 0.95,
    domain?: GaussianRenderDomain,
    private readonly outputState?: StorageBufferAttribute,
    passes?: GaussianPassComposition,
  ) {
    this.bindings = new StorageBindings(renderer);
    this.frame = new FrameUniforms(camera, background, domain);
    this.objects = new ObjectFrameState(
      camera,
      store,
      data.count,
      this.bindings,
    );
    this.passes = passes ?? createGaussianPassComposition(store);
    validateGaussianPassComposition(this.passes);
    if (!passes) {
      for (const key of Object.keys(
        this.passes.projection.nodes,
      ) as (keyof GaussianProjectionNodeSlots)[])
        this.passes.projection.nodes[key] = nodes[key];
      for (const key of Object.keys(
        this.passes.raster.nodes,
      ) as (keyof GaussianRasterNodeSlots)[])
        this.passes.raster.nodes[key] = nodes[key];
    }
    try {
      this.dataRuntime = this.passes.data.createRuntime({
        source: data,
        renderer,
        bindings: this.bindings,
      });
      this.data = this.dataRuntime.getData();
      this.objects.resize(this.data.count);
      this.frame.activeCount.value = this.data.activeCount;
      const context = this.getPassContext();
      this.projection = this.passes.projection.createRuntime(context);
      this.profileDiagnostics =
        profileKernels || rasterStats
          ? new ProfileDiagnosticsStage(
              renderer,
              this.data.count,
              this.projection.projectedMean,
              this.projection.projectedConic,
              this.frame,
              maxRasterizedSplatsPerTile,
              this.bindings,
            )
          : null;
      const ordering = (this.orderingRuntime =
        this.passes.ordering.createRuntime(context));
      this.visibleScan = ordering.visibleScan;
      this.visible = ordering.visible;
      this.depthSorter = ordering.depthSorter;
      this.orderedTiles = ordering.orderedTiles;
      const intersections = (this.intersectionRuntime =
        this.passes.intersections.createRuntime(context));
      this.scan = intersections.scan;
      this.intersections = intersections.intersections;
      this.sorter = intersections.sorter;
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  private getPassContext(): GaussianPassContext {
    return {
      renderer: this.renderer,
      bindings: this.bindings,
      frame: this.frame,
      objects: this.objects,
      mode: this.mode,
      antialiasMode: this.antialiasMode,
      subpixelSampleCulling: this.subpixelSampleCulling,
      radixBackend: this.radixBackend,
      capacity: this.capacity,
      outputState: this.outputState,
    };
  }

  compatible(data: GaussianData): boolean {
    return this.projection.compatible(data);
  }

  getShaderGeneration(): number {
    return this.shaderGeneration;
  }

  updateData(data: GaussianData): void {
    this.dataRuntime.updateData(data);
    data = this.dataRuntime.getData();
    const variantChanged = !this.compatible(data);
    this.objects.resize(data.count);
    this.projection.updateData(data, this.passes.projection.nodes);
    if (variantChanged) this.shaderGeneration++;
    this.orderingRuntime.resize(data.count);
    this.intersectionRuntime.resizeGaussianCount(data.count);
    this.profileDiagnostics?.resize(data.count);
    this.data = data;
    this.frame.activeCount.value = data.activeCount;
    this.updateRasterResources();
    this.resourceUpdates++;
  }

  resizeIntersections(
    capacity: number,
    _color: StorageTexture,
    _depth: StorageTexture | null,
  ): void {
    this.intersectionRuntime.resizeCapacity(capacity);
    this.chunkWorkspace?.resize(capacity);
    this.capacity = capacity;
    this.updateRasterResources();
    this.resourceUpdates++;
  }

  private updateRasterResources(): void {
    this.rasterizer?.resize(
      this.data.count,
      this.capacity,
      this.tileCapacity,
      this.data.means,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.tileOffsets!.offsets,
    );
    this.rasterizer?.setSortedRecords(this.sorter.sortedRecords);
  }

  getComputeNodes(): ComputeNode[] {
    return [
      ...this.dataRuntime.getComputeNodes(),
      ...this.projection.getComputeNodes(),
      ...(this.profileDiagnostics?.getComputeNodes() ?? []),
      ...this.orderingRuntime.getComputeNodes(),
      ...this.intersectionRuntime.getComputeNodes(),
      ...(this.rasterRuntime?.getComputeNodes() ?? []),
    ];
  }

  /** Compile/bind every reserved stage with zero work, including inactive scan/radix levels. */
  async warmup(isCancelled: () => boolean = () => false): Promise<void> {
    const nodes = this.getComputeNodes();
    const generation = this.shaderGeneration;
    for (let index = 0; index < nodes.length; index++) {
      if (isCancelled() || generation !== this.shaderGeneration) return;
      this.renderer.compute(nodes[index]!, [0, 0, 0]);
      if (index % 4 === 3)
        await new Promise<void>((resolve) => {
          if (
            typeof requestAnimationFrame === "function" &&
            typeof document !== "undefined" &&
            document.visibilityState === "visible"
          )
            requestAnimationFrame(() => setTimeout(resolve, 0));
          else setTimeout(resolve, 0);
        });
    }
    const device = (this.renderer.backend as unknown as { device?: GPUDevice })
      ?.device;
    await device?.queue.onSubmittedWorkDone();
  }

  prepareFrame(
    width: number,
    height: number,
    colorTexture: StorageTexture,
    depthTexture: StorageTexture | null,
  ): void {
    const tilesX = Math.ceil(width / TILE_SIZE);
    const tilesY = Math.ceil(height / TILE_SIZE);
    if (tilesX > 65_535 || tilesY > 65_535) {
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    }
    this.width = width;
    this.height = height;
    this.tilesX = tilesX;
    this.tilesY = tilesY;
    this.frame.update(width, height, tilesX, tilesY);
    this.data = this.dataRuntime.getData();
    this.frame.activeCount.value = this.data.activeCount;
    this.objects.update();
    if (this.tileOffsets === null || this.rasterizer === null) {
      this.rebuildTileStages(colorTexture, depthTexture);
    } else if (tilesX * tilesY > this.tileCapacity) {
      const capacity = 2 ** Math.ceil(Math.log2(tilesX * tilesY));
      const previousSorted = this.sorter.sortedRecords;
      this.sorter.configure(Math.ceil(Math.log2(capacity + 1)));
      this.tileOffsets.setSortedRecords(
        previousSorted,
        this.sorter.sortedRecords,
      );
      this.tileOffsets.resize(capacity);
      this.tileCapacity = capacity;
      this.updateRasterResources();
      this.resourceUpdates++;
    }
    if (this.tileOffsets === null || this.rasterizer === null) {
      throw new Error("TiledGaussianPipeline failed to create tile stages");
    }
  }

  render(attempt = 1, resetValid = false): void {
    if (this.tileOffsets === null || this.rasterizer === null) {
      throw new Error(
        "TiledGaussianPipeline must be prepared before rendering",
      );
    }
    this.dataRuntime.encode(this.renderer);
    this.projection.encode(this.renderer);
    this.profileDiagnostics?.encode();
    this.orderingRuntime.encode(this.profileKernels);
    this.intersectionRuntime.encode(attempt, resetValid, this.profileKernels);
    this.rasterRuntime!.encode(this.tilesX, this.tilesY);
  }

  rebuildData(): void {
    this.dataRuntime.getComputeNodes();
    this.shaderGeneration++;
  }

  rebuildProjection(nodes: GaussianProjectionNodeSlots): void {
    this.projection.rebuild(nodes);
    this.shaderGeneration++;
  }

  rebuildRasterizer(nodes: GaussianRasterNodeSlots): void {
    this.rasterizer?.rebuild(nodes);
    this.shaderGeneration++;
  }

  async readStats(): Promise<GaussianPassStats> {
    if (this.profileDiagnostics === null || this.tileOffsets === null) {
      return this.intersections.readStats();
    }
    const [stats, profile, rasterWork] = await Promise.all([
      this.intersections.readStats(),
      this.profileDiagnostics.readStats(this.tileOffsets.offsets),
      this.rasterizer?.readWorkStats() ?? Promise.resolve(null),
    ]);
    return {
      ...stats,
      profile: { ...profile, rasterWork },
    };
  }

  getDebugInfo(): GaussianPassDebugInfo {
    return {
      initialized: this.tileOffsets !== null && this.rasterizer !== null,
      width: this.width,
      height: this.height,
      tilesX: this.tilesX,
      tilesY: this.tilesY,
      tileStageRebuilds: this.tileStageRebuilds,
      tileCapacity: this.tileCapacity,
      resourceUpdates: this.resourceUpdates,
      bufferReplacements: this.bindings.replacements,
      shaderVariantChanges: this.shaderGeneration,
      radixPasses: this.depthSorter.passCount + this.sorter.passCount,
      depthRadixPasses: this.depthSorter.passCount,
      tileRadixPasses: this.sorter.passCount,
      radixBackend: this.radixBackend,
      profileKernels: this.profileKernels,
      maxRasterizedSplatsPerTile: this.maxRasterizedSplatsPerTile,
      rasterChunkSize: this.rasterChunkSize,
      subpixelSampleCulling: this.subpixelSampleCulling,
    };
  }

  getResources(): GaussianPassResources | null {
    if (this.tileOffsets === null) return null;
    return {
      projectedMean: this.projection.projectedMean,
      projectedConic: this.projection.projectedConic,
      projectedColor: this.projection.projectedColor,
      visibleOffsets: this.visibleScan.output,
      depthSortedGaussians: this.depthSorter.sortedRecords,
      tileCounts: this.projection.tileCounts,
      depthOrderedTileCounts: this.orderedTiles.tileCounts,
      intersectionOffsets: this.scan.output,
      dispatchState: this.intersections.dispatch.state,
      sortedIntersections: this.sorter.sortedRecords,
      tileOffsets: this.tileOffsets.offsets,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.rasterRuntime?.dispose();
    this.rasterRuntime = null;
    this.tileOffsets = null;
    this.rasterizer = null;
    this.chunkWorkspace?.dispose();
    this.chunkWorkspace = null;
    this.intersectionRuntime?.dispose();
    this.orderingRuntime?.dispose();
    this.profileDiagnostics?.dispose();
    this.projection?.dispose();
    this.objects?.dispose();
    this.dataRuntime?.dispose();
    for (const pass of Object.values(this.passes)) pass.output.bind(null);
  }

  private rebuildTileStages(
    colorTexture: StorageTexture,
    depthTexture: StorageTexture | null,
  ): void {
    const tileCapacity = 2 ** Math.ceil(Math.log2(this.tilesX * this.tilesY));
    if (this.chunkWorkspace === null && this.rasterChunkSize !== null) {
      this.chunkWorkspace = new RasterChunkWorkspace(
        this.capacity,
        this.rasterChunkSize,
        depthTexture !== null,
        this.bindings,
      );
    }
    this.rasterRuntime?.dispose();
    const tileBits = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, tileCapacity + 1))),
    );
    this.sorter.configure(tileBits);
    const raster = (this.rasterRuntime = this.passes.raster.createRuntime({
      ...this.getPassContext(),
      tileCapacity,
      colorTexture,
      depthTexture,
      maxRasterizedSplatsPerTile: this.maxRasterizedSplatsPerTile,
      rasterChunkSize: this.rasterChunkSize,
      rasterStats: this.rasterStats,
      rasterTransmittanceThreshold: this.rasterTransmittanceThreshold,
      depthAlphaThreshold: this.depthAlphaThreshold,
      chunkWorkspace: this.chunkWorkspace ?? undefined,
    }));
    this.tileOffsets = raster.tileOffsets;
    this.rasterizer = raster.rasterizer;
    this.tileCapacity = tileCapacity;
    this.tileStageRebuilds++;
  }
}
