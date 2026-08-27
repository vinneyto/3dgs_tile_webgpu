import { Object3D, PerspectiveCamera } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import { ExclusiveScanStage } from "./ExclusiveScanStage";
import { FrameUniformBuffer } from "./FrameUniformBuffer";
import { IntersectionStage } from "./IntersectionStage";
import { ProjectionStage } from "./ProjectionStage";
import { RadixSorter } from "./RadixSorter";
import { TileOffsetBuilder } from "./TileOffsetBuilder";
import { TileRasterizer } from "./TileRasterizer";
import { TILE_SIZE } from "./constants";
import type { DepthSortMode, GaussianPassStats } from "./types";

export class TiledGaussianPipeline {
  private readonly frameUniforms: FrameUniformBuffer;
  private readonly projection: ProjectionStage;
  private readonly scan: ExclusiveScanStage;
  private readonly intersections: IntersectionStage;
  private readonly sorter: RadixSorter;
  private tileOffsets: TileOffsetBuilder | null = null;
  private rasterizer: TileRasterizer | null = null;
  private width = 0;
  private height = 0;
  private tilesX = 0;
  private tilesY = 0;
  private outputTexture: GPUTexture | null = null;

  constructor(
    private readonly device: GPUDevice,
    camera: PerspectiveCamera,
    data: GaussianData,
    anchor: Object3D,
    private readonly mode: DepthSortMode,
    capacity: number,
    background: readonly [number, number, number, number],
  ) {
    this.frameUniforms = new FrameUniformBuffer(
      device,
      camera,
      data,
      anchor,
      background,
    );
    this.projection = new ProjectionStage(
      device,
      data,
      this.frameUniforms.buffer,
    );
    this.scan = new ExclusiveScanStage(
      device,
      this.projection.tileCounts,
      data.count,
    );
    this.intersections = new IntersectionStage(
      device,
      data,
      mode,
      capacity,
      this.projection.tileCounts,
      this.scan.output,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frameUniforms.buffer,
    );
    this.sorter = new RadixSorter(
      device,
      mode,
      capacity,
      this.intersections.buffers,
      this.intersections.dispatchBuffer,
    );
  }

  prepareFrame(width: number, height: number, outputTexture: GPUTexture): void {
    const textureChanged = outputTexture !== this.outputTexture;
    if (width !== this.width || height !== this.height || textureChanged) {
      this.rebuildTileStages(width, height, outputTexture);
    }
    this.frameUniforms.update(width, height, this.tilesX, this.tilesY);
  }

  render(): void {
    if (this.tileOffsets === null || this.rasterizer === null) {
      throw new Error(
        "TiledGaussianPipeline must be prepared before rendering",
      );
    }
    const encoder = this.device.createCommandEncoder({ label: "3dgs.frame" });
    const pass = encoder.beginComputePass({ label: "3dgs.tiled-render" });
    this.projection.encode(pass);
    this.scan.encode(pass);
    this.intersections.encode(pass);
    this.sorter.encode(pass);
    this.tileOffsets.encode(pass);
    this.rasterizer.encode(pass, this.tilesX, this.tilesY);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  readStats(): Promise<GaussianPassStats> {
    return this.intersections.readStats();
  }

  dispose(): void {
    this.tileOffsets?.dispose();
    this.tileOffsets = null;
    this.rasterizer = null;
    this.sorter.dispose();
    this.intersections.dispose();
    this.scan.dispose();
    this.projection.dispose();
    this.frameUniforms.dispose();
  }

  private rebuildTileStages(
    width: number,
    height: number,
    outputTexture: GPUTexture,
  ): void {
    const tilesX = Math.ceil(width / TILE_SIZE);
    const tilesY = Math.ceil(height / TILE_SIZE);
    const tileCount = tilesX * tilesY;
    if (
      tilesX > this.device.limits.maxComputeWorkgroupsPerDimension ||
      tilesY > this.device.limits.maxComputeWorkgroupsPerDimension
    ) {
      throw new RangeError(
        "Render size exceeds the device's tile dispatch limit",
      );
    }
    if (this.mode === "packed16" && tileCount > 65_535) {
      throw new RangeError(
        `packed16 supports at most 65,535 tiles; ${width}x${height} creates ${tileCount}. Use depthSortMode: 'float32'.`,
      );
    }

    this.tileOffsets?.dispose();
    this.sorter.configure(tileCount);
    this.tileOffsets = new TileOffsetBuilder(
      this.device,
      this.mode,
      tileCount,
      this.sorter.sortedKey,
      this.intersections.dispatchBuffer,
    );
    this.rasterizer = new TileRasterizer(
      this.device,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.sorter.sortedGaussianIds,
      this.tileOffsets.offsets,
      outputTexture,
      this.frameUniforms.buffer,
    );
    this.width = width;
    this.height = height;
    this.tilesX = tilesX;
    this.tilesY = tilesY;
    this.outputTexture = outputTexture;
  }
}
