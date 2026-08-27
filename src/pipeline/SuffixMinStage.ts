import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  instanceIndex,
  invocationLocalIndex,
  storage,
  uint,
  wgslFn,
  workgroupArray,
  workgroupId,
} from "three/tsl";
import {
  addSuffixBlockMinsWGSL,
  suffixMinBlocksWGSL,
} from "../kernels/tileOffsets";
import { AttributePool } from "./AttributePool";
import { SCAN_BLOCK_ITEMS, WORKGROUP_SIZE } from "./constants";

interface SuffixMinLevel {
  length: number;
  blockCount: number;
  values: StorageBufferAttribute;
  scanNode: ComputeNode;
  addNode?: ComputeNode;
}

export class SuffixMinStage {
  private readonly attributes = new AttributePool();
  private readonly levels: SuffixMinLevel[] = [];

  constructor(values: StorageBufferAttribute, length: number) {
    const scanKernel = wgslFn<Record<string, Node>>(suffixMinBlocksWGSL);
    const addKernel = wgslFn<Record<string, Node>>(addSuffixBlockMinsWGSL);
    let levelValues = values;
    let levelLength = length;

    while (true) {
      const level = this.levels.length;
      const blockCount = Math.ceil(levelLength / SCAN_BLOCK_ITEMS);
      const blockMins = this.attributes.createUint(
        `3dgs.tile-offset-mins-${level}`,
        blockCount,
      );
      const scanNode = scanKernel({
        lane: invocationLocalIndex,
        group_id: workgroupId.x,
        length: uint(levelLength),
        values: storage(levelValues, "uint", levelLength),
        block_mins: storage(blockMins, "uint", blockCount),
        scratch: workgroupArray("uint", SCAN_BLOCK_ITEMS),
      })
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS tile offset suffix scan WGSL ${level}`);
      this.levels.push({
        length: levelLength,
        blockCount,
        values: levelValues,
        scanNode,
      });
      if (blockCount <= 1) break;
      levelValues = blockMins;
      levelLength = blockCount;
    }

    for (let level = 0; level < this.levels.length - 1; level++) {
      const current = this.levels[level]!;
      const parent = this.levels[level + 1]!;
      current.addNode = addKernel({
        index: instanceIndex,
        length: uint(current.length),
        block_count: uint(parent.length),
        values: storage(current.values, "uint", current.length),
        block_suffix_mins: storage(
          parent.values,
          "uint",
          parent.length,
        ).toReadOnly(),
      })
        .compute(current.length, [WORKGROUP_SIZE])
        .setName(`3DGS tile add suffix block mins WGSL ${level}`);
    }
  }

  encode(renderer: WebGPURenderer): void {
    for (const level of this.levels) {
      renderer.compute(level.scanNode, [level.blockCount, 1, 1]);
    }
    for (let level = this.levels.length - 2; level >= 0; level--) {
      renderer.compute(this.levels[level]!.addNode!);
    }
  }

  dispose(): void {
    for (const level of this.levels) {
      level.scanNode.dispose();
      level.addNode?.dispose();
    }
    this.attributes.dispose();
  }
}
