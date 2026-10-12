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
    antialiasMode: AntialiasMode,
    private capacity: number,
    background: readonly [number, number, number, number],
    private readonly profileKernels: boolean,
    private readonly maxRasterizedSplatsPerTile: number | null,
    private readonly rasterChunkSize: number | null,
    private readonly subpixelSampleCulling: boolean,
    private readonly radixBackend: ResolvedRadixBackend,
    private readonly nodes: GaussianNodeSlots,
    private readonly rasterTransmittanceThreshold = 1e-4,
    private readonly rasterStats = false,
    private readonly depthAlphaThreshold = 0.95,
    domain?: GaussianRenderDomain,
    private readonly outputState?: StorageBufferAttribute,
  ) {
    this.bindings = new StorageBindings(renderer);
    this.frame = new FrameUniforms(camera, background, domain);
    this.objects = new ObjectFrameState(
      camera,
      store,
      data.count,
      this.bindings,
    );
    this.frame.activeCount.value = data.activeCount;
    this.projection = new ProjectionStage(
      data,
      this.frame,
      this.objects,
      antialiasMode,
      nodes,
      subpixelSampleCulling,
      this.bindings,
    );
    this.profileDiagnostics =
      profileKernels || rasterStats
        ? new ProfileDiagnosticsStage(
            renderer,
            data.count,
            this.projection.projectedMean,
            this.projection.projectedConic,
            this.frame,
            maxRasterizedSplatsPerTile,
            this.bindings,
          )
        : null;
    this.visibleScan = new ExclusiveScanStage(
      this.projection.projectedMean,
      data.count,
      "visible",
      "projectedVisibility",
      () => this.data.activeCount,
      this.bindings,
    );
    this.visible = new VisibleGaussianStage(
      renderer,
      mode,
      data.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport,
      this.frame.activeCount,
      () => this.data.activeCount,
      this.bindings,
    );
    this.depthSorter = new RadixSorter(
      renderer,
      "depth",
      data.count,
      this.visible.buffers,
      this.visible.dispatch,
      radixBackend,
      this.bindings,
    );
    this.depthSorter.configure(mode === "float32" ? 32 : 16);
    this.orderedTiles = new DepthOrderedTileStage(
      renderer,
      data.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch,
      this.bindings,
    );
    this.scan = new ExclusiveScanStage(
      this.orderedTiles.tileCounts,
      data.count,
      "intersections",
      "uint",
      () => this.data.activeCount,
      this.bindings,
    );
    this.intersections = this.createIntersections();
    this.sorter = this.createSorter();
  }

  private createIntersections(): IntersectionStage {
    return new IntersectionStage(
      this.renderer,
      this.data.count,
      this.capacity,
      this.depthSorter.sortedRecords,
      this.visible.dispatch,
      this.orderedTiles.tileCounts,
      this.scan.output,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.frame,
      this.outputState,
      this.bindings,
    );
  }

  private createSorter(): RadixSorter {
    return new RadixSorter(
      this.renderer,
      "tile",
      this.capacity,
      this.intersections.buffers,
      this.intersections.dispatch,
      this.radixBackend,
      this.bindings,
    );
  }

  compatible(data: GaussianData): boolean {
    return this.projection.compatible(data);
  }

  getShaderGeneration(): number {
    return this.shaderGeneration;
  }

  updateData(data: GaussianData): void {
    const variantChanged = !this.compatible(data);
    this.objects.resize(data.count);
    this.projection.updateData(data, this.nodes);
    if (variantChanged) this.shaderGeneration++;
    this.visibleScan.resize(data.count);
    this.visible.resize(data.count);
    this.depthSorter.resize(data.count);
    this.orderedTiles.resize(data.count);
    this.scan.resize(data.count);
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
    this.intersections.resize(capacity);
    this.sorter.resize(capacity);
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
      this.projection,
      this.profileDiagnostics,
      this.visibleScan,
      this.visible,
      this.depthSorter,
      this.orderedTiles,
      this.scan,
      this.intersections,
      this.sorter,
      this.tileOffsets,
      this.rasterizer,
    ].flatMap((stage) => stage?.getComputeNodes() ?? []);
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
    this.projection.encode(this.renderer);
    this.profileDiagnostics?.encode();
    this.visibleScan.encode(this.renderer);
    this.visible.encode();
    this.depthSorter.encode(this.profileKernels);
    this.orderedTiles.encode();
    this.scan.encode(this.renderer);
    this.intersections.encode(attempt, resetValid);
    this.sorter.encode(this.profileKernels);
    this.tileOffsets.encode();
    this.rasterizer.encode(this.tilesX, this.tilesY);
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
    this.tileOffsets?.dispose();
    this.tileOffsets = null;
    this.rasterizer?.dispose();
    this.rasterizer = null;
    this.chunkWorkspace?.dispose();
    this.chunkWorkspace = null;
    this.sorter.dispose();
    this.intersections.dispose();
    this.scan.dispose();
    this.orderedTiles.dispose();
    this.depthSorter.dispose();
    this.visible.dispose();
    this.visibleScan.dispose();
    this.profileDiagnostics?.dispose();
    this.projection.dispose();
    this.objects.dispose();
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
    this.tileOffsets?.dispose();
    this.rasterizer?.dispose();
    const tileBits = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, tileCapacity + 1))),
    );
    this.sorter.configure(tileBits);
    this.tileOffsets = new TileOffsetBuilder(
      this.renderer,
      this.mode,
      tileCapacity,
      this.sorter.sortedRecords,
      this.intersections.dispatch,
      () => Number(this.frame.tileCount.value),
      this.bindings,
    );
    this.rasterizer = new TileRasterizer(
      this.renderer,
      this.data.count,
      this.capacity,
      this.mode,
      this.data.means,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.sorter.sortedRecords,
      this.tileOffsets.offsets,
      colorTexture,
      depthTexture,
      this.frame,
      this.maxRasterizedSplatsPerTile,
      this.rasterChunkSize,
      tileCapacity,
      this.nodes,
      this.rasterStats,
      this.rasterTransmittanceThreshold,
      this.depthAlphaThreshold,
      this.chunkWorkspace ?? undefined,
      this.intersections.rasterDispatch,
      this.bindings,
    );
    this.tileCapacity = tileCapacity;
    this.tileStageRebuilds++;
  }
}
