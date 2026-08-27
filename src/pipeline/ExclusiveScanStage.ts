import type {
  ComputeNode,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  Fn,
  If,
  Loop,
  instanceIndex,
  invocationLocalIndex,
  select,
  storage,
  uint,
  workgroupArray,
  workgroupBarrier,
  workgroupId,
} from "three/tsl";
import { AttributePool } from "./AttributePool";
import { SCAN_BLOCK_ITEMS, WORKGROUP_SIZE } from "./constants";
import { uintElement } from "./tslTypes";

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

  constructor(input: StorageBufferAttribute, length: number) {
    this.output = this.attributes.createUint(
      "3dgs.intersection-offsets",
      length,
    );

    let scanInput = input;
    let scanOutput = this.output;
    let scanLength = length;
    while (true) {
      const blockCount = Math.ceil(scanLength / SCAN_BLOCK_ITEMS);
      const blockSums = this.attributes.createUint(
        `3dgs.scan-sums-${this.levels.length}`,
        blockCount,
      );
      const inputNode = storage(scanInput, "uint", scanLength).toReadOnly();
      const outputNode = storage(scanOutput, "uint", scanLength);
      const blockSumsNode = storage(blockSums, "uint", blockCount);
      const scratch = workgroupArray("uint", SCAN_BLOCK_ITEMS);

      const scanKernel = Fn(() => {
        const lane = invocationLocalIndex;
        const base = workgroupId.x.mul(SCAN_BLOCK_ITEMS).toVar();
        const first = base.add(lane).toVar();
        const second = first.add(WORKGROUP_SIZE).toVar();
        uintElement(scratch, lane).assign(
          select(first.lessThan(scanLength), inputNode.element(first), uint(0)),
        );
        uintElement(scratch, lane.add(WORKGROUP_SIZE)).assign(
          select(
            second.lessThan(scanLength),
            inputNode.element(second),
            uint(0),
          ),
        );
        workgroupBarrier();

        const offset = uint(1).toVar();
        const activeCount = uint(SCAN_BLOCK_ITEMS / 2).toVar();
        Loop(9, () => {
          If(lane.lessThan(activeCount), () => {
            const left = offset.mul(lane.mul(2).add(1)).sub(1).toVar();
            const right = offset.mul(lane.mul(2).add(2)).sub(1).toVar();
            uintElement(scratch, right).addAssign(uintElement(scratch, left));
          });
          offset.mulAssign(2);
          activeCount.divAssign(2);
          workgroupBarrier();
        });

        If(lane.equal(0), () => {
          blockSumsNode
            .element(workgroupId.x)
            .assign(uintElement(scratch, SCAN_BLOCK_ITEMS - 1));
          uintElement(scratch, SCAN_BLOCK_ITEMS - 1).assign(0);
        });
        workgroupBarrier();

        activeCount.assign(1);
        offset.assign(SCAN_BLOCK_ITEMS / 2);
        Loop(9, () => {
          If(lane.lessThan(activeCount), () => {
            const left = offset.mul(lane.mul(2).add(1)).sub(1).toVar();
            const right = offset.mul(lane.mul(2).add(2)).sub(1).toVar();
            const value = uintElement(scratch, left).toVar();
            uintElement(scratch, left).assign(uintElement(scratch, right));
            uintElement(scratch, right).addAssign(value);
          });
          activeCount.mulAssign(2);
          offset.divAssign(2);
          workgroupBarrier();
        });

        If(first.lessThan(scanLength), () => {
          outputNode.element(first).assign(uintElement(scratch, lane));
        });
        If(second.lessThan(scanLength), () => {
          outputNode
            .element(second)
            .assign(uintElement(scratch, lane.add(WORKGROUP_SIZE)));
        });
      });
      const scanNode = scanKernel()
        .compute(blockCount * WORKGROUP_SIZE, [WORKGROUP_SIZE])
        .setName(`3DGS scan level ${this.levels.length}`);
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
        `3dgs.scan-offsets-${this.levels.length}`,
        scanLength,
      );
    }

    for (let level = 0; level < this.levels.length - 1; level++) {
      const current = this.levels[level]!;
      const parent = this.levels[level + 1]!;
      const values = storage(current.output, "uint", current.length);
      const blockOffsets = storage(
        parent.output,
        "uint",
        parent.length,
      ).toReadOnly();
      const addKernel = Fn(() => {
        values
          .element(instanceIndex)
          .addAssign(blockOffsets.element(instanceIndex.div(SCAN_BLOCK_ITEMS)));
      });
      current.addNode = addKernel()
        .compute(current.length, [WORKGROUP_SIZE])
        .setName(`3DGS add scan offsets ${level}`);
    }
  }

  encode(renderer: WebGPURenderer): void {
    renderer.compute(this.levels.map((level) => level.scanNode));
    const addNodes: ComputeNode[] = [];
    for (let level = this.levels.length - 2; level >= 0; level--) {
      addNodes.push(this.levels[level]!.addNode!);
    }
    if (addNodes.length > 0) renderer.compute(addNodes);
  }

  dispose(): void {
    for (const level of this.levels) {
      level.scanNode.dispose();
      level.addNode?.dispose();
    }
    this.attributes.dispose();
  }
}
