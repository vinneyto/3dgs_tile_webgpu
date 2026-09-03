import type {
  PerspectiveCamera,
  StorageTexture,
  WebGPURenderer,
} from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import type { GaussianStore } from "../GaussianStore";
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
import { RadixSorter } from "./RadixSorter";
import { TileOffsetBuilder } from "./TileOffsetBuilder";
import { TileRasterizer } from "./TileRasterizer";
import { VisibleGaussianStage } from "./VisibleGaussianStage";
import { TILE_SIZE } from "./constants";
import type {
  AntialiasMode,
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
  readonly intersections: IntersectionStage;
  readonly sorter: RadixSorter;

  private tileOffsets: TileOffsetBuilder | null = null;
  private rasterizer: TileRasterizer | null = null;
  private width = 0;
  private height = 0;
  private tilesX = 0;
  private tilesY = 0;
  private tileStageRebuilds = 0;

  constructor(
    private readonly renderer: WebGPURenderer,
    camera: PerspectiveCamera,
    private readonly data: GaussianData,
    store: GaussianStore,
    private readonly mode: DepthSortMode,
    antialiasMode: AntialiasMode,
    private readonly capacity: number,
    background: readonly [number, number, number, number],
    private readonly profileKernels: boolean,
    private readonly maxRasterizedSplatsPerTile: number | null,
    private readonly rasterChunkSize: number | null,
    private readonly subpixelSampleCulling: boolean,
    private readonly radixBackend: ResolvedRadixBackend,
    private readonly nodes: GaussianNodeSlots,
  ) {
    this.frame = new FrameUniforms(camera, background);
    this.objects = new ObjectFrameState(camera, store, data.count);
    this.projection = new ProjectionStage(
      data,
      this.frame,
      this.objects,
      antialiasMode,
      nodes,
      subpixelSampleCulling,
    );
    this.profileDiagnostics = profileKernels
      ? new ProfileDiagnosticsStage(
          renderer,
          data.count,
          this.projection.projectedMean,
          this.projection.projectedConic,
          this.frame,
          maxRasterizedSplatsPerTile,
        )
      : null;
    this.visibleScan = new ExclusiveScanStage(
      this.projection.projectedMean,
      data.count,
      "visible",
      "projectedVisibility",
    );
    this.visible = new VisibleGaussianStage(
      renderer,
      mode,
      data.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport,
    );
    this.depthSorter = new RadixSorter(
      renderer,
      "depth",
      data.count,
      this.visible.buffers,
      this.visible.dispatch,
      radixBackend,
    );
    this.depthSorter.configure(mode === "float32" ? 32 : 16);
    this.orderedTiles = new DepthOrderedTileStage(
      renderer,
      data.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch,
    );
    this.scan = new ExclusiveScanStage(
      this.orderedTiles.tileCounts,
      data.count,
      "intersections",
    );
    this.intersections = new IntersectionStage(
      renderer,
      data.count,
      capacity,
      this.depthSorter.sortedRecords,
      this.visible.dispatch,
      this.orderedTiles.tileCounts,
      this.scan.output,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.frame,
    );
    this.sorter = new RadixSorter(
      renderer,
      "tile",
      capacity,
      this.intersections.buffers,
      this.intersections.dispatch,
      radixBackend,
    );
  }

  prepareFrame(
    width: number,
    height: number,
    colorTexture: StorageTexture,
    depthTexture: StorageTexture | null,
  ): void {
    this.frame.update(width, height, this.tilesX, this.tilesY);
    this.objects.update();
    if (width !== this.width || height !== this.height) {
      this.rebuildTileStages(width, height, colorTexture, depthTexture);
    }
    if (this.tileOffsets === null || this.rasterizer === null) {
      throw new Error("TiledGaussianPipeline failed to create tile stages");
    }
  }

  render(): void {
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
    this.intersections.encode();
    this.sorter.encode(this.profileKernels);
    this.tileOffsets.encode();
    this.rasterizer.encode(this.tilesX, this.tilesY);
  }

  rebuildProjection(nodes: GaussianProjectionNodeSlots): void {
    this.projection.rebuild(nodes);
  }

  rebuildRasterizer(nodes: GaussianRasterNodeSlots): void {
    this.rasterizer?.rebuild(nodes);
  }

  async readStats(): Promise<GaussianPassStats> {
    if (this.profileDiagnostics === null || this.tileOffsets === null) {
      return this.intersections.readStats();
    }
    const [stats, profile] = await Promise.all([
      this.intersections.readStats(),
      this.profileDiagnostics.readStats(this.tileOffsets.offsets),
    ]);
    return {
      ...stats,
      profile,
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
    width: number,
    height: number,
    colorTexture: StorageTexture,
    depthTexture: StorageTexture | null,
  ): void {
    const tilesX = Math.ceil(width / TILE_SIZE);
    const tilesY = Math.ceil(height / TILE_SIZE);
    const tileCount = tilesX * tilesY;
    if (tilesX > 65_535 || tilesY > 65_535) {
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    }

    this.tileOffsets?.dispose();
    this.rasterizer?.dispose();
    const tileBits = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, tileCount + 1))),
    );
    this.sorter.configure(tileBits);
    this.tileOffsets = new TileOffsetBuilder(
      this.renderer,
      this.mode,
      tileCount,
      this.sorter.sortedRecords,
      this.intersections.dispatch,
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
      tileCount,
      this.nodes,
    );
    this.width = width;
    this.height = height;
    this.tilesX = tilesX;
    this.tilesY = tilesY;
    this.frame.update(width, height, tilesX, tilesY);
    this.tileStageRebuilds++;
  }
}
