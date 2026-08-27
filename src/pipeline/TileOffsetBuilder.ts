import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, storage, uint, wgslFn } from "three/tsl";
import {
  clearTileOffsetsWGSL,
  tileBoundariesWGSL,
} from "../kernels/tileOffsets";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import { SuffixMinStage } from "./SuffixMinStage";
import type { DepthSortMode, DispatchResources } from "./types";

export class TileOffsetBuilder {
  readonly offsets: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly clearNode: ComputeNode;
  private readonly boundariesNode: ComputeNode;
  private readonly suffixMin: SuffixMinStage;

  constructor(
    private readonly renderer: WebGPURenderer,
    mode: DepthSortMode,
    tileCount: number,
    sortedRecordsAttribute: StorageBufferAttribute,
    private readonly dispatch: DispatchResources,
  ) {
    this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      tileCount + 1,
    );
    const offsets = storage(this.offsets, "uint", tileCount + 1);

    const clearKernel = wgslFn<Record<string, Node>>(clearTileOffsetsWGSL);
    this.clearNode = clearKernel({
      index: instanceIndex,
      tile_count: uint(tileCount),
      state: storage(dispatch.state, "uvec4", 1).toReadOnly(),
      offsets,
    })
      .compute(tileCount + 1, [WORKGROUP_SIZE])
      .setName("3DGS clear tile offsets WGSL");

    const recordType = mode === "float32" ? "uvec4" : "uvec2";
    const boundariesKernel = wgslFn<Record<string, Node>>(
      tileBoundariesWGSL(mode),
    );
    this.boundariesNode = boundariesKernel({
      index: instanceIndex,
      state: storage(dispatch.state, "uvec4", 1).toReadOnly(),
      records: storage(
        sortedRecordsAttribute,
        recordType,
        sortedRecordsAttribute.count,
      ).toReadOnly(),
      offsets,
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS find tile boundaries WGSL (${mode})`);

    this.suffixMin = new SuffixMinStage(this.offsets, tileCount + 1);
  }

  encode(): void {
    this.renderer.compute(this.clearNode);
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
