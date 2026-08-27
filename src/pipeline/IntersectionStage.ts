import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, storage, uint, uvec2, wgslFn } from "three/tsl";
import {
  emitIntersectionsWGSL,
  prepareDispatchWGSL,
} from "../kernels/intersections";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import type {
  DispatchResources,
  IntersectionBuffers,
  GaussianPassStats,
} from "./types";

export class IntersectionStage {
  readonly buffers: IntersectionBuffers;
  readonly dispatch: DispatchResources;

  private readonly attributes = new AttributePool();
  private readonly prepareNode: ComputeNode;
  private readonly emitNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    gaussianCount: number,
    private readonly capacity: number,
    sortedGaussiansAttribute: StorageBufferAttribute,
    visibleDispatch: DispatchResources,
    tileCountsAttribute: StorageBufferAttribute,
    intersectionOffsetsAttribute: StorageBufferAttribute,
    projectedMeanAttribute: StorageBufferAttribute,
    projectedConicAttribute: StorageBufferAttribute,
    projectedColorAttribute: StorageBufferAttribute,
    frame: FrameUniforms,
  ) {
    this.dispatch = {
      state: this.attributes.createUint("3dgs.dispatch-state", 1, 4),
      radixBlock: this.attributes.createIndirect("3dgs.radix-block-dispatch"),
      radixReduce: this.attributes.createIndirect("3dgs.radix-reduce-dispatch"),
      linear: this.attributes.createIndirect("3dgs.linear-dispatch"),
    };
    this.buffers = {
      recordsA: this.attributes.createUint(
        "3dgs.intersection-records-a",
        capacity,
        2,
      ),
      recordsB: this.attributes.createUint(
        "3dgs.intersection-records-b",
        capacity,
        2,
      ),
    };

    const tileCounts = storage(
      tileCountsAttribute,
      "uint",
      gaussianCount,
    ).toReadOnly();
    const intersectionOffsets = storage(
      intersectionOffsetsAttribute,
      "uint",
      gaussianCount,
    ).toReadOnly();
    const visibleState = storage(
      visibleDispatch.state,
      "uvec4",
      1,
    ).toReadOnly();
    const prepareKernel = wgslFn<Record<string, Node>>(prepareDispatchWGSL);
    this.prepareNode = prepareKernel({
      item_count_state: visibleState,
      capacity: uint(capacity),
      tile_counts: tileCounts,
      intersection_offsets: intersectionOffsets,
      state: storage(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: storage(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: storage(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: storage(this.dispatch.linear, "uvec4", 1),
    })
      .compute(1)
      .setName("3DGS prepare intersection indirect dispatch WGSL");

    const emitKernel = wgslFn<Record<string, Node>>(emitIntersectionsWGSL);
    this.emitNode = emitKernel({
      rank: instanceIndex,
      tiles: uvec2(frame.tilesX, frame.tilesY),
      sorted_gaussians: storage(
        sortedGaussiansAttribute,
        "uvec2",
        gaussianCount,
      ).toReadOnly(),
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
      tile_counts: tileCounts,
      intersection_offsets: intersectionOffsets,
      visible_state: visibleState,
      state: storage(this.dispatch.state, "uvec4", 1).toReadOnly(),
      records: storage(this.buffers.recordsA, "uvec2", capacity),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName("3DGS emit depth-ordered intersections WGSL");

    this.visibleLinearDispatch = visibleDispatch;
  }

  private readonly visibleLinearDispatch: DispatchResources;

  encode(): void {
    this.renderer.compute(this.prepareNode);
    this.renderer.compute(this.emitNode, this.visibleLinearDispatch.linear);
  }

  async readStats(): Promise<GaussianPassStats> {
    const [intersectionResult, visibleResult] = await Promise.all([
      this.renderer.getArrayBufferAsync(this.dispatch.state),
      this.renderer.getArrayBufferAsync(this.visibleLinearDispatch.state),
    ]);
    const values = new Uint32Array(intersectionResult);
    const visibleValues = new Uint32Array(visibleResult);
    return {
      visibleGaussianCount: visibleValues[0] ?? 0,
      intersectionCount: values[0] ?? 0,
      requestedIntersections: values[1] ?? 0,
      intersectionCapacity: this.capacity,
      overflow: (values[3] ?? 0) !== 0,
    };
  }

  dispose(): void {
    this.prepareNode.dispose();
    this.emitNode.dispose();
    this.attributes.dispose();
  }
}
