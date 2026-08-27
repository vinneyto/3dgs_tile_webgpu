import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, storage, uint, wgslFn } from "three/tsl";
import {
  compactVisibleWGSL,
  prepareVisibleDispatchWGSL,
} from "../kernels/visibility";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import type {
  DepthSortMode,
  DispatchResources,
  KeyValueBuffers,
} from "./types";

export class VisibleGaussianStage {
  readonly buffers: KeyValueBuffers;
  readonly dispatch: DispatchResources;

  private readonly attributes = new AttributePool();
  private readonly prepareNode: ComputeNode;
  private readonly compactNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    mode: DepthSortMode,
    gaussianCount: number,
    visibleFlagsAttribute: StorageBufferAttribute,
    visibleOffsetsAttribute: StorageBufferAttribute,
    projectedMeanAttribute: StorageBufferAttribute,
    viewport: Node,
  ) {
    this.buffers = {
      recordsA: this.attributes.createUint(
        "3dgs.depth-records-a",
        gaussianCount,
        2,
      ),
      recordsB: this.attributes.createUint(
        "3dgs.depth-records-b",
        gaussianCount,
        2,
      ),
    };
    this.dispatch = {
      state: this.attributes.createUint("3dgs.visible-dispatch-state", 1, 4),
      radixBlock: this.attributes.createIndirect(
        "3dgs.visible-radix-block-dispatch",
      ),
      radixReduce: this.attributes.createIndirect(
        "3dgs.visible-radix-reduce-dispatch",
      ),
      linear: this.attributes.createIndirect("3dgs.visible-linear-dispatch"),
    };

    const visibleFlags = storage(
      visibleFlagsAttribute,
      "uint",
      gaussianCount,
    ).toReadOnly();
    const visibleOffsets = storage(
      visibleOffsetsAttribute,
      "uint",
      gaussianCount,
    ).toReadOnly();
    const prepareKernel = wgslFn<Record<string, Node>>(
      prepareVisibleDispatchWGSL,
    );
    this.prepareNode = prepareKernel({
      gaussian_count: uint(gaussianCount),
      visible_flags: visibleFlags,
      visible_offsets: visibleOffsets,
      state: storage(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: storage(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: storage(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: storage(this.dispatch.linear, "uvec4", 1),
    })
      .compute(1)
      .setName("3DGS prepare visible indirect dispatch WGSL");

    const compactKernel = wgslFn<Record<string, Node>>(
      compactVisibleWGSL(mode),
    );
    this.compactNode = compactKernel({
      gid: instanceIndex,
      gaussian_count: uint(gaussianCount),
      viewport,
      visible_flags: visibleFlags,
      visible_offsets: visibleOffsets,
      projected_mean: storage(
        projectedMeanAttribute,
        "vec4",
        gaussianCount,
      ).toReadOnly(),
      records: storage(this.buffers.recordsA, "uvec2", gaussianCount),
    })
      .compute(gaussianCount, [WORKGROUP_SIZE])
      .setName(`3DGS compact visible Gaussians WGSL (${mode})`);
  }

  encode(profileKernels = false): void {
    if (profileKernels) {
      this.renderer.compute(this.prepareNode);
      this.renderer.compute(this.compactNode);
    } else {
      this.renderer.compute([this.prepareNode, this.compactNode]);
    }
  }

  dispose(): void {
    this.prepareNode.dispose();
    this.compactNode.dispose();
    this.attributes.dispose();
  }
}
