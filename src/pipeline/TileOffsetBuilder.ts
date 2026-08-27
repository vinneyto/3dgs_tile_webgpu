import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { Fn, If, Loop, Return, instanceIndex, storage, uint } from "three/tsl";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import type { DepthSortMode, DispatchResources } from "./types";

export class TileOffsetBuilder {
  readonly offsets: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly clearNode: ComputeNode;
  private readonly boundariesNode: ComputeNode;
  private readonly fillNode: ComputeNode;

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
    const clearKernel = Fn(() => {
      offsets.element(instanceIndex).assign(uint(0xffffffff));
    });
    this.clearNode = clearKernel()
      .compute(tileCount + 1, [WORKGROUP_SIZE])
      .setName("3DGS clear tile offsets");

    const floatRecords =
      mode === "float32"
        ? storage(
            sortedRecordsAttribute,
            "uvec4",
            sortedRecordsAttribute.count,
          ).toReadOnly()
        : null;
    const packedRecords =
      mode === "packed16"
        ? storage(
            sortedRecordsAttribute,
            "uvec2",
            sortedRecordsAttribute.count,
          ).toReadOnly()
        : null;
    const state = storage(dispatch.state, "uvec4", 1).toReadOnly();
    const tileAt = (index: Node<"uint">) =>
      mode === "float32"
        ? floatRecords!.element(index).x
        : packedRecords!.element(index).x.shiftRight(16);
    const boundariesKernel = Fn(() => {
      const index = instanceIndex;
      If(index.greaterThanEqual(state.element(0).x), () => Return());
      const tile = tileAt(index).toVar();
      If(index.equal(0).or(tileAt(index.sub(1)).notEqual(tile)), () => {
        offsets.element(tile).assign(index);
      });
    });
    this.boundariesNode = boundariesKernel()
      .computeKernel([WORKGROUP_SIZE])
      .setName("3DGS find tile boundaries");

    const fillKernel = Fn(() => {
      const running = state.element(0).x.toVar();
      offsets.element(tileCount).assign(running);
      Loop(
        {
          start: uint(tileCount),
          end: uint(0),
          type: "uint",
          condition: ">",
          update: "--",
        },
        ({ i }) => {
          const index = i.sub(1).toVar();
          If(offsets.element(index).equal(uint(0xffffffff)), () => {
            offsets.element(index).assign(running);
          }).Else(() => {
            running.assign(offsets.element(index));
          });
        },
      );
    });
    this.fillNode = fillKernel()
      .compute(1)
      .setName("3DGS fill tile offset gaps");
  }

  encode(): void {
    this.renderer.compute(this.clearNode);
    this.renderer.compute(this.boundariesNode, this.dispatch.linear);
    this.renderer.compute(this.fillNode);
  }

  dispose(): void {
    this.clearNode.dispose();
    this.boundariesNode.dispose();
    this.fillNode.dispose();
    this.attributes.dispose();
  }
}
