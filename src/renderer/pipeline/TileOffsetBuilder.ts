import { StorageBindings } from "./StorageBindings";
import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, uniform, wgslFn } from "three/tsl";
import {
  clearTileOffsetsWGSL,
  tileBoundariesWGSL,
} from "../kernels/tileOffsets";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import { SuffixMinStage } from "./SuffixMinStage";
import type { DepthSortMode, DispatchResources } from "./types";

export class TileOffsetBuilder {
  offsets: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly clearNode: ComputeNode;
  private readonly boundariesNode: ComputeNode;
  private readonly suffixMin: SuffixMinStage;
  private readonly runtimeTileCount = uniform(0, "uint");

  constructor(
    private readonly renderer: WebGPURenderer,
    mode: DepthSortMode,
    tileCapacity: number,
    sortedRecordsAttribute: StorageBufferAttribute,
    private readonly dispatch: DispatchResources,
    private readonly getTileCount?: () => number,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      tileCapacity + 1,
    );
    this.runtimeTileCount.value = tileCapacity;
    const offsets = this.attributes.storage(
      this.offsets,
      "uint",
      tileCapacity + 1,
    );

    const clearKernel = wgslFn<Record<string, Node>>(clearTileOffsetsWGSL);
    this.clearNode = clearKernel({
      index: instanceIndex,
      tile_count: this.runtimeTileCount,
      state: this.attributes.storage(dispatch.state, "uvec4", 1).toReadOnly(),
      offsets,
    })
      .compute(tileCapacity + 1, [WORKGROUP_SIZE])
      .setName("3DGS clear tile offsets WGSL");

    const boundariesKernel = wgslFn<Record<string, Node>>(
      tileBoundariesWGSL(mode),
    );
    this.boundariesNode = boundariesKernel({
      index: instanceIndex,
      tile_count: this.runtimeTileCount,
      state: this.attributes.storage(dispatch.state, "uvec4", 1).toReadOnly(),
      records: this.attributes
        .storage(sortedRecordsAttribute, "uvec2", sortedRecordsAttribute.count)
        .toReadOnly(),
      offsets,
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS find tile boundaries WGSL (${mode})`);

    this.suffixMin = new SuffixMinStage(
      this.offsets,
      tileCapacity + 1,
      getTileCount ? () => getTileCount() + 1 : undefined,
      bindings,
    );
  }

  resize(capacity: number): void {
    this.offsets = this.attributes.grow(this.offsets, capacity + 1);
    this.clearNode.count = capacity + 1;
    this.runtimeTileCount.value = capacity;
    this.suffixMin.resize(this.offsets, capacity + 1);
  }
  setSortedRecords(
    previous: StorageBufferAttribute,
    next: StorageBufferAttribute,
  ): void {
    this.attributes.rebind(previous, next);
  }
  getComputeNodes(): ComputeNode[] {
    return [
      this.clearNode,
      this.boundariesNode,
      ...this.suffixMin.getComputeNodes(),
    ];
  }

  encode(): void {
    if (this.getTileCount) {
      this.runtimeTileCount.value = this.getTileCount();
      this.renderer.compute(this.clearNode, [
        Math.ceil((this.getTileCount() + 1) / WORKGROUP_SIZE),
        1,
        1,
      ]);
    } else this.renderer.compute(this.clearNode);
    this.renderer.compute(this.boundariesNode, this.dispatch.linear);
    this.suffixMin.encode(this.renderer);
  }

  dispose(): void {
    this.clearNode.dispose();
    this.boundariesNode.dispose();
    this.suffixMin.dispose();
    this.attributes.dispose();
  }
}
