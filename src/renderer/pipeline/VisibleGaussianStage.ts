import { StorageBindings } from "./StorageBindings";
import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, uniform, wgslFn } from "three/tsl";
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
  private readonly logicalCount = uniform(0, "uint");

  constructor(
    private readonly renderer: WebGPURenderer,
    mode: DepthSortMode,
    gaussianCount: number,
    visibleOffsetsAttribute: StorageBufferAttribute,
    projectedMeanAttribute: StorageBufferAttribute,
    viewport: Node,
    activeCount?: Node,
    private readonly getActiveCount?: () => number,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.logicalCount.value = gaussianCount;
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

    const visibleOffsets = this.attributes
      .storage(visibleOffsetsAttribute, "uint", gaussianCount)
      .toReadOnly();
    const prepareKernel = wgslFn<Record<string, Node>>(
      prepareVisibleDispatchWGSL,
    );
    this.prepareNode = prepareKernel({
      gaussian_count: activeCount ?? this.logicalCount,
      projected_mean: this.attributes
        .storage(projectedMeanAttribute, "vec4", gaussianCount)
        .toReadOnly(),
      visible_offsets: visibleOffsets,
      state: this.attributes.storage(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: this.attributes.storage(
        this.dispatch.radixBlock,
        "uvec4",
        1,
      ),
      radix_reduce_dispatch: this.attributes.storage(
        this.dispatch.radixReduce,
        "uvec4",
        1,
      ),
      linear_dispatch: this.attributes.storage(
        this.dispatch.linear,
        "uvec4",
        1,
      ),
    })
      .compute(1)
      .setName("3DGS prepare visible indirect dispatch WGSL");

    const compactKernel = wgslFn<Record<string, Node>>(
      compactVisibleWGSL(mode),
    );
    this.compactNode = compactKernel({
      gid: instanceIndex,
      gaussian_count: activeCount ?? this.logicalCount,
      viewport,
      visible_offsets: visibleOffsets,
      projected_mean: this.attributes
        .storage(projectedMeanAttribute, "vec4", gaussianCount)
        .toReadOnly(),
      records: this.attributes.storage(
        this.buffers.recordsA,
        "uvec2",
        gaussianCount,
      ),
    })
      .compute(gaussianCount, [WORKGROUP_SIZE])
      .setName(`3DGS compact visible Gaussians WGSL (${mode})`);
  }

  resize(count: number): void {
    this.buffers.recordsA = this.attributes.grow(this.buffers.recordsA, count);
    this.buffers.recordsB = this.attributes.grow(this.buffers.recordsB, count);
    this.logicalCount.value = count;
    this.compactNode.count = count;
  }
  getComputeNodes(): ComputeNode[] {
    return [this.prepareNode, this.compactNode];
  }

  encode(profileKernels = false): void {
    if (this.getActiveCount) {
      this.renderer.compute(this.prepareNode);
      const count = this.getActiveCount();
      if (count > 0)
        this.renderer.compute(this.compactNode, [
          Math.ceil(count / WORKGROUP_SIZE),
          1,
          1,
        ]);
    } else if (profileKernels) {
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
