import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  StorageTexture,
  WebGPURenderer,
} from "three/webgpu";
import {
  invocationLocalIndex,
  storage,
  storageTexture,
  uvec2,
  vec4,
  wgslFn,
  workgroupArray,
  workgroupId,
} from "three/tsl";
import { rasterizationWGSL } from "../kernels/rasterization";
import { TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import type { DepthSortMode } from "./types";

export class TileRasterizer {
  private readonly computeNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    gaussianCount: number,
    intersectionCapacity: number,
    mode: DepthSortMode,
    projectedMeanAttribute: StorageBufferAttribute,
    projectedConicAttribute: StorageBufferAttribute,
    projectedColorAttribute: StorageBufferAttribute,
    sortedRecordsAttribute: StorageBufferAttribute,
    tileOffsetsAttribute: StorageBufferAttribute,
    colorTexture: StorageTexture,
    depthTexture: StorageTexture | null,
    frame: FrameUniforms,
  ) {
    const rasterizeKernel = wgslFn<Record<string, Node>>(
      rasterizationWGSL(mode, depthTexture !== null),
    );
    const parameters: Record<string, Node> = {
      local_index: invocationLocalIndex,
      group_id: workgroupId,
      viewport: frame.viewport,
      tiles: uvec2(frame.tilesX, frame.tilesY),
      background: vec4(...frame.background),
      projected_mean: storage(
        projectedMeanAttribute,
        "vec4",
        gaussianCount,
      ).toReadOnly(),
      projected_conic: storage(
        projectedConicAttribute,
        "vec4",
        gaussianCount,
      ).toReadOnly(),
      projected_color: storage(
        projectedColorAttribute,
        "vec4",
        gaussianCount,
      ).toReadOnly(),
      records: storage(
        sortedRecordsAttribute,
        "uvec2",
        intersectionCapacity,
      ).toReadOnly(),
      tile_offsets: storage(
        tileOffsetsAttribute,
        "uint",
        tileOffsetsAttribute.count,
      ).toReadOnly(),
      shared_mean: workgroupArray("vec4", WORKGROUP_SIZE),
      shared_conic: workgroupArray("vec4", WORKGROUP_SIZE),
      shared_color: workgroupArray("vec4", WORKGROUP_SIZE),
      shared_control: workgroupArray("uint", 2),
      // Nested scalar aliases are not expanded by WGSLNodeBuilder.getType().
      shared_done: workgroupArray("atomic<u32>", 1),
      color_output: storageTexture(colorTexture),
    };
    if (depthTexture !== null) {
      parameters.depth_output = storageTexture(depthTexture);
    }
    this.computeNode = rasterizeKernel(parameters)
      .computeKernel([TILE_SIZE, TILE_SIZE])
      .setName(`3DGS tile rasterizer WGSL (${mode})`);
  }

  encode(tilesX: number, tilesY: number): void {
    this.renderer.compute(this.computeNode, [tilesX, tilesY, 1]);
  }

  dispose(): void {
    this.computeNode.dispose();
  }
}
