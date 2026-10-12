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
  addScanOffsetsWGSL,
  scanBlocksWGSL,
  scanVisibilityBlocksWGSL,
} from "../kernels/scan";
import { AttributePool } from "./AttributePool";
import { StorageBindings } from "./StorageBindings";
import { SCAN_BLOCK_ITEMS, WORKGROUP_SIZE } from "./constants";

// Five levels cover every uint32 logical length. Allocate tiny inactive levels
// now, so crossing a block boundary never creates a new ComputeNode.
const SCAN_LEVELS = 5;
interface ScanLevel {
  length: number;
  runtimeLength: ReturnType<typeof uniform>;
  blockCount: number;
  output: StorageBufferAttribute;
  sums: StorageBufferAttribute;
  scanNode: ComputeNode;
  addNode?: ComputeNode;
}

export class ExclusiveScanStage {
  output: StorageBufferAttribute;
  private readonly attributes = new AttributePool();
  private readonly levels: ScanLevel[] = [];
  private capacity: number;

  constructor(
    input: StorageBufferAttribute,
    length: number,
    label = "intersections",
    inputMode: "uint" | "projectedVisibility" = "uint",
    private readonly getLength?: () => number,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.capacity = length;
    this.output = this.attributes.createUint(`3dgs.${label}-offsets`, length);
    let scanInput = input,
      scanOutput = this.output,
      scanLength = length;
    for (let index = 0; index < SCAN_LEVELS; index++) {
      const blockCount = Math.max(1, Math.ceil(scanLength / SCAN_BLOCK_ITEMS));
      const sums = this.attributes.createUint(
        `3dgs.${label}-scan-sums-${index}`,
        blockCount,
      );
      const visible = index === 0 && inputMode === "projectedVisibility";
      const runtimeLength = uniform(scanLength, "uint");
      const scanNode = wgslFn<Record<string, Node>>(
        visible ? scanVisibilityBlocksWGSL : scanBlocksWGSL,
      )({
        lane: invocationLocalIndex,
        group_id: workgroupId.x,
        length: runtimeLength,
        input_values: this.attributes
          .storage(scanInput, visible ? "vec4" : "uint", scanLength)
          .toReadOnly(),
        output_values: this.attributes.storage(scanOutput, "uint", scanLength),
        block_sums: this.attributes.storage(sums, "uint", blockCount),
        scratch: workgroupArray("uint", SCAN_BLOCK_ITEMS),
      })
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS ${label} scan WGSL level ${index}`);
      this.levels.push({
        length: scanLength,
        runtimeLength,
        blockCount,
        output: scanOutput,
        sums,
        scanNode,
      });
      scanInput = sums;
      scanLength = blockCount;
      if (index < SCAN_LEVELS - 1)
        scanOutput = this.attributes.createUint(
          `3dgs.${label}-scan-offsets-${index + 1}`,
          scanLength,
        );
    }
    for (let index = 0; index < this.levels.length - 1; index++) {
      const current = this.levels[index]!,
        parent = this.levels[index + 1]!;
      current.addNode = wgslFn<Record<string, Node>>(addScanOffsetsWGSL)({
        index: instanceIndex,
        length: current.runtimeLength,
        values: this.attributes.storage(current.output, "uint", current.length),
        block_offsets: this.attributes
          .storage(parent.output, "uint", parent.length)
          .toReadOnly(),
      })
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS ${label} add scan offsets WGSL ${index}`);
    }
  }

  resize(length: number): void {
    this.capacity = Math.max(this.capacity, length);
    let capacity = this.capacity;
    for (const level of this.levels) {
      level.length = capacity;
      level.blockCount = Math.max(1, Math.ceil(capacity / SCAN_BLOCK_ITEMS));
      level.output = this.attributes.grow(level.output, capacity);
      level.sums = this.attributes.grow(level.sums, level.blockCount);
      capacity = level.blockCount;
    }
    this.output = this.levels[0]!.output;
  }

  encode(renderer: WebGPURenderer): void {
    let length = this.getLength?.() ?? this.capacity;
    let activeLevels = 0;
    for (const level of this.levels) {
      level.runtimeLength.value = length;
      const blocks = Math.max(1, Math.ceil(length / SCAN_BLOCK_ITEMS));
      renderer.compute(level.scanNode, [blocks, 1, 1]);
      activeLevels++;
      if (blocks === 1) break;
      length = blocks;
    }
    for (const level of this.levels.slice(activeLevels))
      level.runtimeLength.value = 0;
    for (let index = activeLevels - 2; index >= 0; index--) {
      const level = this.levels[index]!;
      if (Number(level.runtimeLength.value) > 0)
        renderer.compute(level.addNode!, [
          Math.ceil(Number(level.runtimeLength.value) / WORKGROUP_SIZE),
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
