import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, storage, uint, uvec2, wgslFn } from "three/tsl";
import type { GaussianData } from "../GaussianData";
import {
  emitIntersectionsWGSL,
  prepareDispatchWGSL,
} from "../kernels/intersections";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import type {
  DepthSortMode,
  DispatchResources,
  GaussianPassStats,
  IntersectionBuffers,
} from "./types";

export class IntersectionStage {
  readonly dispatch: DispatchResources;
  readonly buffers: IntersectionBuffers;

  private readonly attributes = new AttributePool();
  private readonly prepareNode: ComputeNode;
  private readonly emitNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    data: GaussianData,
    mode: DepthSortMode,
    private readonly capacity: number,
    tileCountsAttribute: StorageBufferAttribute,
    intersectionOffsetsAttribute: StorageBufferAttribute,
    projectedMeanAttribute: StorageBufferAttribute,
    projectedConicAttribute: StorageBufferAttribute,
    projectedColorAttribute: StorageBufferAttribute,
    frame: FrameUniforms,
  ) {
    this.dispatch = {
      state: this.attributes.createUint("3dgs.dispatch-state", 1, 4),
      radix: this.attributes.createIndirect("3dgs.radix-dispatch"),
      radixBlock: this.attributes.createIndirect("3dgs.radix-block-dispatch"),
      radixScan: this.attributes.createIndirect("3dgs.radix-scan-dispatch"),
      linear: this.attributes.createIndirect("3dgs.linear-dispatch"),
    };
    this.buffers = this.createIntersectionBuffers(mode);

    const tileCounts = storage(
      tileCountsAttribute,
      "uint",
      data.count,
    ).toReadOnly();
    const intersectionOffsets = storage(
      intersectionOffsetsAttribute,
      "uint",
      data.count,
    ).toReadOnly();
    const prepareKernel = wgslFn<Record<string, Node>>(prepareDispatchWGSL);
    this.prepareNode = prepareKernel({
      gaussian_count: uint(data.count),
      capacity: uint(capacity),
      tile_counts: tileCounts,
      intersection_offsets: intersectionOffsets,
      state: storage(this.dispatch.state, "uvec4", 1),
      radix_dispatch: storage(this.dispatch.radix, "uvec4", 1),
      radix_block_dispatch: storage(this.dispatch.radixBlock, "uvec4", 1),
      radix_scan_dispatch: storage(this.dispatch.radixScan, "uvec4", 1),
      linear_dispatch: storage(this.dispatch.linear, "uvec4", 1),
    })
      .compute(1)
      .setName("3DGS prepare indirect dispatch WGSL");

    const recordType = mode === "float32" ? "uvec4" : "uvec2";
    const emitKernel = wgslFn<Record<string, Node>>(
      emitIntersectionsWGSL(mode),
    );
    this.emitNode = emitKernel({
      gid: instanceIndex,
      gaussian_count: uint(data.count),
      tiles: uvec2(frame.tilesX, frame.tilesY),
      viewport: frame.viewport,
      projected_mean: storage(
        projectedMeanAttribute,
        "vec4",
        data.count,
      ).toReadOnly(),
      projected_conic: storage(
        projectedConicAttribute,
        "vec4",
        data.count,
      ).toReadOnly(),
      projected_color: storage(
        projectedColorAttribute,
        "vec4",
        data.count,
      ).toReadOnly(),
      tile_counts: tileCounts,
      intersection_offsets: intersectionOffsets,
      state: storage(this.dispatch.state, "uvec4", 1).toReadOnly(),
      records: storage(this.buffers.recordsA, recordType, capacity),
    })
      .compute(data.count, [WORKGROUP_SIZE])
      .setName(`3DGS emit intersections WGSL (${mode})`);
  }

  encode(profileKernels = false): void {
    if (profileKernels) {
      this.renderer.compute(this.prepareNode);
      this.renderer.compute(this.emitNode);
    } else {
      this.renderer.compute([this.prepareNode, this.emitNode]);
    }
  }

  async readStats(): Promise<GaussianPassStats> {
    const result = await this.renderer.getArrayBufferAsync(this.dispatch.state);
    const values = new Uint32Array(result);
    return {
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

  private createIntersectionBuffers(mode: DepthSortMode): IntersectionBuffers {
    const itemSize = mode === "float32" ? 4 : 2;
    return {
      kind: mode,
      recordsA: this.attributes.createUint(
        `3dgs.${mode}-records-a`,
        this.capacity,
        itemSize,
      ),
      recordsB: this.attributes.createUint(
        `3dgs.${mode}-records-b`,
        this.capacity,
        itemSize,
      ),
    } as IntersectionBuffers;
  }
}
