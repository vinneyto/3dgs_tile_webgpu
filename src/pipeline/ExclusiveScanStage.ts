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
import { addScanOffsetsWGSL, scanBlocksWGSL } from "../kernels/scan";
import { AttributePool } from "./AttributePool";
import { SCAN_BLOCK_ITEMS, WORKGROUP_SIZE } from "./constants";

interface ScanLevel {
  length: number;
  blockCount: number;
  output: StorageBufferAttribute;
  scanNode: ComputeNode;
  addNode?: ComputeNode;
}

export class ExclusiveScanStage {
  readonly output: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly levels: ScanLevel[] = [];

  constructor(
    input: StorageBufferAttribute,
    length: number,
    label = "intersections",
  ) {
    this.output = this.attributes.createUint(`3dgs.${label}-offsets`, length);
    const scanKernel = wgslFn<Record<string, Node>>(scanBlocksWGSL);
    const addKernel = wgslFn<Record<string, Node>>(addScanOffsetsWGSL);

    let scanInput = input;
    let scanOutput = this.output;
    let scanLength = length;
    while (true) {
      const blockCount = Math.ceil(scanLength / SCAN_BLOCK_ITEMS);
      const blockSums = this.attributes.createUint(
        `3dgs.${label}-scan-sums-${this.levels.length}`,
        blockCount,
      );
      const scratch = workgroupArray("uint", SCAN_BLOCK_ITEMS);
      const scanNode = scanKernel({
        lane: invocationLocalIndex,
        group_id: workgroupId.x,
        length: uint(scanLength),
        input_values: storage(scanInput, "uint", scanLength).toReadOnly(),
        output_values: storage(scanOutput, "uint", scanLength),
        block_sums: storage(blockSums, "uint", blockCount),
        scratch,
      })
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS ${label} scan WGSL level ${this.levels.length}`);
      this.levels.push({
        length: scanLength,
        blockCount,
        output: scanOutput,
        scanNode,
      });
      if (blockCount <= 1) break;
      scanInput = blockSums;
      scanLength = blockCount;
      scanOutput = this.attributes.createUint(
        `3dgs.${label}-scan-offsets-${this.levels.length}`,
        scanLength,
      );
    }

    for (let level = 0; level < this.levels.length - 1; level++) {
      const current = this.levels[level]!;
      const parent = this.levels[level + 1]!;
      current.addNode = addKernel({
        index: instanceIndex,
        length: uint(current.length),
        values: storage(current.output, "uint", current.length),
        block_offsets: storage(
          parent.output,
          "uint",
          parent.length,
        ).toReadOnly(),
      })
        .compute(current.length, [WORKGROUP_SIZE])
        .setName(`3DGS ${label} add scan offsets WGSL ${level}`);
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
