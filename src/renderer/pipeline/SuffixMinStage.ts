import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  instanceIndex,
  invocationLocalIndex,
  uniform,
  wgslFn,
  workgroupArray,
  workgroupId,
} from "three/tsl";
import {
  addSuffixBlockMinsWGSL,
  suffixMinBlocksWGSL,
} from "../kernels/tileOffsets";
import { AttributePool } from "./AttributePool";
import { StorageBindings } from "./StorageBindings";
import { SCAN_BLOCK_ITEMS, WORKGROUP_SIZE } from "./constants";

interface SuffixMinLevel {
  length: number;
  runtimeLength: ReturnType<typeof uniform>;
  runtimeBlockCount: ReturnType<typeof uniform>;
  values: StorageBufferAttribute;
  mins: StorageBufferAttribute;
  scanNode: ComputeNode;
  addNode?: ComputeNode;
}
export class SuffixMinStage {
  private readonly attributes = new AttributePool();
  private readonly levels: SuffixMinLevel[] = [];
  private capacity: number;
  constructor(
    values: StorageBufferAttribute,
    length: number,
    private readonly getLength?: () => number,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.capacity = length;
    let levelValues = values,
      levelLength = length;
    for (let index = 0; index < 5; index++) {
      const blocks = Math.max(1, Math.ceil(levelLength / SCAN_BLOCK_ITEMS));
      const mins = this.attributes.createUint(
        `3dgs.tile-offset-mins-${index}`,
        blocks,
      );
      const runtimeLength = uniform(levelLength, "uint"),
        runtimeBlockCount = uniform(blocks, "uint");
      const scanNode = wgslFn<Record<string, Node>>(suffixMinBlocksWGSL)({
        lane: invocationLocalIndex,
        group_id: workgroupId.x,
        length: runtimeLength,
        values: this.attributes.storage(levelValues, "uint", levelLength),
        block_mins: this.attributes.storage(mins, "uint", blocks),
        scratch: workgroupArray("uint", SCAN_BLOCK_ITEMS),
      })
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS tile offset suffix scan WGSL ${index}`);
      this.levels.push({
        length: levelLength,
        runtimeLength,
        runtimeBlockCount,
        values: levelValues,
        mins,
        scanNode,
      });
      levelValues = mins;
      levelLength = blocks;
    }
    for (let index = 0; index < this.levels.length - 1; index++) {
      const current = this.levels[index]!,
        parent = this.levels[index + 1]!;
      current.addNode = wgslFn<Record<string, Node>>(addSuffixBlockMinsWGSL)({
        index: instanceIndex,
        length: current.runtimeLength,
        block_count: current.runtimeBlockCount,
        values: this.attributes.storage(current.values, "uint", current.length),
        block_suffix_mins: this.attributes
          .storage(parent.values, "uint", parent.length)
          .toReadOnly(),
      })
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS tile add suffix block mins WGSL ${index}`);
    }
  }
  resize(values: StorageBufferAttribute, length: number): void {
    this.capacity = Math.max(this.capacity, length);
    let capacity = this.capacity,
      current = values;
    for (const level of this.levels) {
      this.attributes.rebind(level.values, current);
      level.values = current;
      level.length = capacity;
      const blocks = Math.max(1, Math.ceil(capacity / SCAN_BLOCK_ITEMS));
      level.mins = this.attributes.grow(level.mins, blocks);
      current = level.mins;
      capacity = blocks;
    }
  }
  encode(renderer: WebGPURenderer): void {
    let length = this.getLength?.() ?? this.capacity,
      active = 0;
    for (const level of this.levels) {
      const blocks = Math.max(1, Math.ceil(length / SCAN_BLOCK_ITEMS));
      level.runtimeLength.value = length;
      level.runtimeBlockCount.value = blocks;
      renderer.compute(level.scanNode, [blocks, 1, 1]);
      active++;
      if (blocks === 1) break;
      length = blocks;
    }
    for (const level of this.levels.slice(active)) {
      level.runtimeLength.value = 0;
      level.runtimeBlockCount.value = 0;
    }
    for (let index = active - 2; index >= 0; index--) {
      const level = this.levels[index]!;
      renderer.compute(level.addNode!, [
        Math.max(
          1,
          Math.ceil(Number(level.runtimeLength.value) / WORKGROUP_SIZE),
        ),
        1,
        1,
      ]);
    }
  }
  getComputeNodes(): ComputeNode[] {
    return this.levels.flatMap((level) =>
      level.addNode ? [level.scanNode, level.addNode] : [level.scanNode],
    );
  }
  dispose(): void {
    for (const node of this.getComputeNodes()) node.dispose();
    this.attributes.dispose();
  }
}
