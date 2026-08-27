import type {
  Object3D,
  PerspectiveCamera,
  StorageTexture,
  WebGPURenderer,
} from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import { ExclusiveScanStage } from "./ExclusiveScanStage";
import { FrameUniforms } from "./FrameUniforms";
import { IntersectionStage } from "./IntersectionStage";
import { ProjectionStage } from "./ProjectionStage";
import { RadixSorter } from "./RadixSorter";
import { TileOffsetBuilder } from "./TileOffsetBuilder";
import { TileRasterizer } from "./TileRasterizer";
import { TILE_SIZE } from "./constants";
import type {
  DepthSortMode,
  GaussianPassDebugInfo,
  GaussianPassResources,
  GaussianPassStats,
} from "./types";

export class TiledGaussianPipeline {
  readonly frame: FrameUniforms;
  readonly projection: ProjectionStage;
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
    anchor: Object3D,
    private readonly mode: DepthSortMode,
    private readonly capacity: number,
    background: readonly [number, number, number, number],
  ) {
    this.frame = new FrameUniforms(camera, data, anchor, background);
    this.projection = new ProjectionStage(data, this.frame);
    this.scan = new ExclusiveScanStage(this.projection.tileCounts, data.count);
    this.intersections = new IntersectionStage(
      renderer,
      data,
      mode,
      capacity,
      this.projection.tileCounts,
      this.scan.output,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.frame,
    );
    this.sorter = new RadixSorter(
      renderer,
      mode,
      capacity,
      this.intersections.buffers,
      this.intersections.dispatch,
    );
  }

  prepareFrame(
    width: number,
    height: number,
    colorTexture: StorageTexture,
    depthTexture: StorageTexture | null,
  ): void {
    if (width !== this.width || height !== this.height) {
      this.rebuildTileStages(width, height, colorTexture, depthTexture);
    }
    this.frame.update(width, height, this.tilesX, this.tilesY);
  }

  render(): void {
    if (this.tileOffsets === null || this.rasterizer === null) {
      throw new Error(
        "TiledGaussianPipeline must be prepared before rendering",
      );
    }
    this.projection.encode(this.renderer);
    this.scan.encode(this.renderer);
    this.intersections.encode();
    this.sorter.encode();
    this.tileOffsets.encode();
    this.rasterizer.encode(this.tilesX, this.tilesY);
  }

  readStats(): Promise<GaussianPassStats> {
    return this.intersections.readStats();
  }

  getDebugInfo(): GaussianPassDebugInfo {
    return {
      initialized: this.tileOffsets !== null && this.rasterizer !== null,
      width: this.width,
      height: this.height,
      tilesX: this.tilesX,
      tilesY: this.tilesY,
      tileStageRebuilds: this.tileStageRebuilds,
      radixPasses: this.sorter.passCount,
    };
  }

  getResources(): GaussianPassResources | null {
    if (this.tileOffsets === null) return null;
    return {
      projectedMean: this.projection.projectedMean,
      projectedConic: this.projection.projectedConic,
      projectedColor: this.projection.projectedColor,
      tileCounts: this.projection.tileCounts,
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
    this.projection.dispose();
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
    if (this.mode === "packed16" && tileCount > 65_535) {
      throw new RangeError(
        `packed16 supports at most 65,535 tiles; ${width}x${height} creates ${tileCount}. Use depthSortMode: 'float32'.`,
      );
    }

    this.tileOffsets?.dispose();
    this.rasterizer?.dispose();
    this.sorter.configure(tileCount);
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
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.sorter.sortedRecords,
      this.tileOffsets.offsets,
      colorTexture,
      depthTexture,
      this.frame,
    );
    this.width = width;
    this.height = height;
    this.tilesX = tilesX;
    this.tilesY = tilesY;
    this.tileStageRebuilds++;
  }
}
