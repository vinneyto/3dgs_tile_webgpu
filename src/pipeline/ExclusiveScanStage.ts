import { addScanOffsetsShader, scanBlocksShader } from "../shaders";
import { SCAN_BLOCK_ITEMS, UINT_BYTES, WORKGROUP_SIZE } from "./constants";
import { BufferPool } from "./BufferPool";
import { storage } from "./gpu";

interface ScanLevel {
  length: number;
  blockCount: number;
  output: GPUBuffer;
  scanBindGroup: GPUBindGroup;
  addBindGroup?: GPUBindGroup;
}

export class ExclusiveScanStage {
  readonly output: GPUBuffer;

  private readonly buffers: BufferPool;
  private readonly scanPipeline: GPUComputePipeline;
  private readonly addOffsetsPipeline: GPUComputePipeline;
  private readonly levels: ScanLevel[] = [];

  constructor(device: GPUDevice, input: GPUBuffer, length: number) {
    this.buffers = new BufferPool(device);
    this.output = this.buffers.create(
      "3dgs.intersection-offsets",
      length * UINT_BYTES,
    );
    this.scanPipeline = device.createComputePipeline({
      label: "3dgs.scan-blocks",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.scan-blocks.wgsl",
          code: scanBlocksShader,
        }),
      },
    });
    this.addOffsetsPipeline = device.createComputePipeline({
      label: "3dgs.add-scan-offsets",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.add-scan-offsets.wgsl",
          code: addScanOffsetsShader,
        }),
      },
    });

    let scanInput = input;
    let scanOutput = this.output;
    let scanLength = length;
    while (true) {
      const blockCount = Math.ceil(scanLength / SCAN_BLOCK_ITEMS);
      const blockSums = this.buffers.create(
        `3dgs.scan-sums-${this.levels.length}`,
        blockCount * UINT_BYTES,
      );
      const params = this.buffers.createUniform(
        `3dgs.scan-params-${this.levels.length}`,
        new Uint32Array([scanLength]),
      );
      this.levels.push({
        length: scanLength,
        blockCount,
        output: scanOutput,
        scanBindGroup: device.createBindGroup({
          label: `3dgs.scan-bindings-${this.levels.length}`,
          layout: this.scanPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: storage(scanInput) },
            { binding: 1, resource: storage(scanOutput) },
            { binding: 2, resource: storage(blockSums) },
            { binding: 3, resource: { buffer: params } },
          ],
        }),
      });
      if (blockCount <= 1) break;
      scanInput = blockSums;
      scanLength = blockCount;
      scanOutput = this.buffers.create(
        `3dgs.scan-offsets-${this.levels.length}`,
        scanLength * UINT_BYTES,
      );
    }

    for (let level = 0; level < this.levels.length - 1; level++) {
      const current = this.levels[level]!;
      const parent = this.levels[level + 1]!;
      const params = this.buffers.createUniform(
        `3dgs.scan-add-params-${level}`,
        new Uint32Array([current.length]),
      );
      current.addBindGroup = device.createBindGroup({
        label: `3dgs.scan-add-bindings-${level}`,
        layout: this.addOffsetsPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: storage(current.output) },
          { binding: 1, resource: storage(parent.output) },
          { binding: 2, resource: { buffer: params } },
        ],
      });
    }
  }

  encode(pass: GPUComputePassEncoder): void {
    for (const level of this.levels) {
      pass.setPipeline(this.scanPipeline);
      pass.setBindGroup(0, level.scanBindGroup);
      pass.dispatchWorkgroups(level.blockCount);
    }
    for (let level = this.levels.length - 2; level >= 0; level--) {
      const current = this.levels[level]!;
      pass.setPipeline(this.addOffsetsPipeline);
      pass.setBindGroup(0, current.addBindGroup!);
      pass.dispatchWorkgroups(Math.ceil(current.length / WORKGROUP_SIZE));
    }
  }

  dispose(): void {
    this.buffers.dispose();
  }
}
