import type { GaussianData } from "../GaussianData";
import type { ComputeNode, StorageTexture } from "three/webgpu";
import {
  createDefaultGaussianNodeSlots,
  type GaussianRasterNodeSlots,
} from "../nodes/GaussianContextNodes";
import { TileOffsetBuilder } from "../pipeline/TileOffsetBuilder";
import { TileRasterizer } from "../pipeline/TileRasterizer";
import type { RasterChunkWorkspace } from "../pipeline/RasterChunkWorkspace";
import { GaussianPassOutput } from "./GaussianPassOutput";
import { GaussianPassNodes } from "./GaussianPassNodes";
import type { GaussianProjectionResources } from "./GaussianProjectionPass";
import type { GaussianIntersectionResources } from "./GaussianIntersectionPass";
import type { GaussianPassContext } from "./GaussianPassContext";

export interface GaussianRasterResources {
  tileOffsets: TileOffsetBuilder["offsets"];
  color: StorageTexture;
  depth: StorageTexture | null;
}
export interface GaussianRasterContext extends GaussianPassContext {
  readonly tileCapacity: number;
  readonly colorTexture: StorageTexture;
  readonly depthTexture: StorageTexture | null;
  readonly maxRasterizedSplatsPerTile: number | null;
  readonly rasterChunkSize: number | null;
  readonly rasterStats: boolean;
  readonly rasterTransmittanceThreshold: number;
  readonly depthAlphaThreshold: number;
  readonly chunkWorkspace?: RasterChunkWorkspace;
}
export interface GaussianRasterRuntime {
  tileOffsets: TileOffsetBuilder;
  rasterizer: TileRasterizer;
  encode(tilesX: number, tilesY: number): void;
  getComputeNodes(): ComputeNode[];
  dispose(): void;
}

/** Tile ranges, raster chunks and final composition; owns all raster-domain TSL slots. */
export class GaussianRasterPass extends GaussianPassNodes<GaussianRasterNodeSlots> {
  readonly output = new GaussianPassOutput<GaussianRasterResources>(
    this,
    "raster.textures",
  );
  readonly inputs;
  constructor(
    gaussians: GaussianPassOutput<GaussianData>,
    projection: GaussianPassOutput<GaussianProjectionResources>,
    intersections: GaussianPassOutput<GaussianIntersectionResources>,
  ) {
    const {
      rasterOutputDepthNode,
      rasterOutputValidNode,
      rasterPixelValueNode,
      rasterBreakNode,
      rasterColorNode,
      rasterAlphaNode,
      rasterDiscardNode,
    } = createDefaultGaussianNodeSlots();
    super({
      rasterOutputDepthNode,
      rasterOutputValidNode,
      rasterPixelValueNode,
      rasterBreakNode,
      rasterColorNode,
      rasterAlphaNode,
      rasterDiscardNode,
    });
    this.inputs = Object.freeze({ gaussians, projection, intersections });
  }
  createRuntime(context: GaussianRasterContext): GaussianRasterRuntime {
    const data = this.inputs.gaussians.read();
    const projection = this.inputs.projection.read();
    const intersections = this.inputs.intersections.read();
    const tileOffsets = new TileOffsetBuilder(
      context.renderer,
      context.mode,
      context.tileCapacity,
      intersections.sortedIntersections,
      intersections.dispatch,
      () => Number(context.frame.tileCount.value),
      context.bindings,
    );
    const rasterizer = new TileRasterizer(
      context.renderer,
      data.count,
      context.capacity,
      context.mode,
      data.means,
      projection.projectedMean,
      projection.projectedConic,
      projection.projectedColor,
      intersections.sortedIntersections,
      tileOffsets.offsets,
      context.colorTexture,
      context.depthTexture,
      context.frame,
      context.maxRasterizedSplatsPerTile,
      context.rasterChunkSize,
      context.tileCapacity,
      this.nodes,
      context.rasterStats,
      context.rasterTransmittanceThreshold,
      context.depthAlphaThreshold,
      context.chunkWorkspace,
      intersections.rasterDispatch,
      context.bindings,
    );
    this.output.bind(() => ({
      tileOffsets: tileOffsets.offsets,
      color: context.colorTexture,
      depth: context.depthTexture,
    }));
    return {
      tileOffsets,
      rasterizer,
      encode: (tilesX, tilesY) => {
        tileOffsets.encode();
        rasterizer.encode(tilesX, tilesY);
      },
      getComputeNodes: () => [
        ...tileOffsets.getComputeNodes(),
        ...rasterizer.getComputeNodes(),
      ],
      dispose: () => {
        rasterizer.dispose();
        tileOffsets.dispose();
      },
    };
  }
}
