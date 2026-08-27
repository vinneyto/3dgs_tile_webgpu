import {
  radixHistogramShader,
  radixScatterShader,
  scanBlockHistogramsShader,
  scanDigitTotalsShader,
} from "../shaders";
import {
  RADIX_BITS,
  RADIX_BLOCK_ITEMS,
  RADIX_DISPATCH_OFFSET,
  RADIX_SIZE,
  UINT_BYTES,
} from "./constants";
import { BufferPool } from "./BufferPool";
import { dispatchState, storage } from "./gpu";
import type { DepthSortMode, IntersectionBuffers } from "./types";

interface RadixPassResources {
  histogramPipeline: GPUComputePipeline;
  histogramBindGroup: GPUBindGroup;
  scatterPipeline: GPUComputePipeline;
  scatterBindGroup: GPUBindGroup;
}

export class RadixSorter {
  sortedKey: GPUBuffer;
  sortedGaussianIds: GPUBuffer;

  private readonly buffers: BufferPool;
  private readonly blockHistograms: GPUBuffer;
  private readonly blockPrefixes: GPUBuffer;
  private readonly digitOffsets: GPUBuffer;
  private readonly scanBlockHistogramsPipeline: GPUComputePipeline;
  private readonly scanBlockHistogramsBindGroup: GPUBindGroup;
  private readonly scanDigitTotalsPipeline: GPUComputePipeline;
  private readonly scanDigitTotalsBindGroup: GPUBindGroup;
  private readonly histogramModule: GPUShaderModule;
  private readonly scatterModule: GPUShaderModule;
  private passes: RadixPassResources[] = [];

  constructor(
    private readonly device: GPUDevice,
    private readonly mode: DepthSortMode,
    capacity: number,
    private readonly intersections: IntersectionBuffers,
    private readonly dispatchBuffer: GPUBuffer,
  ) {
    this.buffers = new BufferPool(device);
    const maxRadixBlocks = Math.ceil(capacity / RADIX_BLOCK_ITEMS);
    const histogramBytes = maxRadixBlocks * RADIX_SIZE * UINT_BYTES;
    this.blockHistograms = this.buffers.create(
      "3dgs.radix-histograms",
      histogramBytes,
    );
    this.blockPrefixes = this.buffers.create(
      "3dgs.radix-prefixes",
      histogramBytes,
    );
    const digitTotals = this.buffers.create(
      "3dgs.radix-digit-totals",
      RADIX_SIZE * UINT_BYTES,
    );
    this.digitOffsets = this.buffers.create(
      "3dgs.radix-digit-offsets",
      RADIX_SIZE * UINT_BYTES,
    );

    this.scanBlockHistogramsPipeline = device.createComputePipeline({
      label: "3dgs.radix-scan-blocks",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.radix-scan-blocks.wgsl",
          code: scanBlockHistogramsShader,
        }),
      },
    });
    this.scanBlockHistogramsBindGroup = device.createBindGroup({
      label: "3dgs.radix-scan-blocks-bindings",
      layout: this.scanBlockHistogramsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(this.blockHistograms) },
        { binding: 1, resource: storage(this.blockPrefixes) },
        { binding: 2, resource: storage(digitTotals) },
        { binding: 3, resource: dispatchState(dispatchBuffer) },
      ],
    });
    this.scanDigitTotalsPipeline = device.createComputePipeline({
      label: "3dgs.radix-scan-digits",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.radix-scan-digits.wgsl",
          code: scanDigitTotalsShader,
        }),
      },
    });
    this.scanDigitTotalsBindGroup = device.createBindGroup({
      label: "3dgs.radix-scan-digits-bindings",
      layout: this.scanDigitTotalsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(digitTotals) },
        { binding: 1, resource: storage(this.digitOffsets) },
      ],
    });
    this.histogramModule = device.createShaderModule({
      label: `3dgs.radix-histogram-${mode}.wgsl`,
      code: radixHistogramShader(mode),
    });
    this.scatterModule = device.createShaderModule({
      label: `3dgs.radix-scatter-${mode}.wgsl`,
      code: radixScatterShader(mode),
    });
    this.sortedKey =
      intersections.kind === "float32"
        ? intersections.tileA
        : intersections.keyA;
    this.sortedGaussianIds = intersections.gaussianA;
  }

  configure(tileCount: number): void {
    const tileBits = Math.max(1, Math.ceil(Math.log2(Math.max(1, tileCount))));
    const tilePassCount = Math.ceil(tileBits / RADIX_BITS);
    const descriptors: Array<{ shift: number; keyKind: number }> = [];
    if (this.mode === "float32") {
      for (let shift = 0; shift < 32; shift += RADIX_BITS) {
        descriptors.push({ shift, keyKind: 0 });
      }
      for (let pass = 0; pass < tilePassCount; pass++) {
        descriptors.push({ shift: pass * RADIX_BITS, keyKind: 1 });
      }
    } else {
      for (let shift = 0; shift < 32; shift += RADIX_BITS) {
        descriptors.push({ shift, keyKind: 0 });
      }
    }

    this.passes = descriptors.map(({ shift, keyKind }, passIndex) =>
      this.createPass(passIndex, shift, keyKind),
    );
    const finalInputA = this.passes.length % 2 === 0;
    if (this.intersections.kind === "float32") {
      this.sortedKey = finalInputA
        ? this.intersections.tileA
        : this.intersections.tileB;
      this.sortedGaussianIds = finalInputA
        ? this.intersections.gaussianA
        : this.intersections.gaussianB;
    } else {
      this.sortedKey = finalInputA
        ? this.intersections.keyA
        : this.intersections.keyB;
      this.sortedGaussianIds = finalInputA
        ? this.intersections.gaussianA
        : this.intersections.gaussianB;
    }
  }

  encode(pass: GPUComputePassEncoder): void {
    for (const radix of this.passes) {
      pass.setPipeline(radix.histogramPipeline);
      pass.setBindGroup(0, radix.histogramBindGroup);
      pass.dispatchWorkgroupsIndirect(
        this.dispatchBuffer,
        RADIX_DISPATCH_OFFSET,
      );
      pass.setPipeline(this.scanBlockHistogramsPipeline);
      pass.setBindGroup(0, this.scanBlockHistogramsBindGroup);
      pass.dispatchWorkgroups(1);
      pass.setPipeline(this.scanDigitTotalsPipeline);
      pass.setBindGroup(0, this.scanDigitTotalsBindGroup);
      pass.dispatchWorkgroups(1);
      pass.setPipeline(radix.scatterPipeline);
      pass.setBindGroup(0, radix.scatterBindGroup);
      pass.dispatchWorkgroupsIndirect(
        this.dispatchBuffer,
        RADIX_DISPATCH_OFFSET,
      );
    }
  }

  dispose(): void {
    this.buffers.dispose();
  }

  private createPass(
    passIndex: number,
    shift: number,
    keyKind: number,
  ): RadixPassResources {
    const inputA = passIndex % 2 === 0;
    const histogramPipeline = this.device.createComputePipeline({
      label: `3dgs.radix-histogram-${passIndex}`,
      layout: "auto",
      compute: {
        module: this.histogramModule,
        constants: { SHIFT: shift, KEY_KIND: keyKind },
      },
    });
    const scatterPipeline = this.device.createComputePipeline({
      label: `3dgs.radix-scatter-${passIndex}`,
      layout: "auto",
      compute: {
        module: this.scatterModule,
        constants: { SHIFT: shift, KEY_KIND: keyKind },
      },
    });
    let histogramEntries: GPUBindGroupEntry[];
    let scatterEntries: GPUBindGroupEntry[];

    if (this.intersections.kind === "float32") {
      const inputTile = inputA
        ? this.intersections.tileA
        : this.intersections.tileB;
      const inputDepth = inputA
        ? this.intersections.depthA
        : this.intersections.depthB;
      const inputGaussian = inputA
        ? this.intersections.gaussianA
        : this.intersections.gaussianB;
      const outputTile = inputA
        ? this.intersections.tileB
        : this.intersections.tileA;
      const outputDepth = inputA
        ? this.intersections.depthB
        : this.intersections.depthA;
      const outputGaussian = inputA
        ? this.intersections.gaussianB
        : this.intersections.gaussianA;
      histogramEntries = [
        { binding: 0, resource: storage(inputTile) },
        { binding: 1, resource: storage(inputDepth) },
        { binding: 2, resource: storage(this.blockHistograms) },
        { binding: 3, resource: dispatchState(this.dispatchBuffer) },
      ];
      scatterEntries = [
        { binding: 0, resource: storage(inputTile) },
        { binding: 1, resource: storage(inputDepth) },
        { binding: 2, resource: storage(inputGaussian) },
        { binding: 3, resource: storage(this.blockPrefixes) },
        { binding: 4, resource: storage(this.digitOffsets) },
        { binding: 5, resource: storage(outputTile) },
        { binding: 6, resource: storage(outputDepth) },
        { binding: 7, resource: storage(outputGaussian) },
        { binding: 8, resource: dispatchState(this.dispatchBuffer) },
      ];
    } else {
      const inputKey = inputA
        ? this.intersections.keyA
        : this.intersections.keyB;
      const inputGaussian = inputA
        ? this.intersections.gaussianA
        : this.intersections.gaussianB;
      const outputKey = inputA
        ? this.intersections.keyB
        : this.intersections.keyA;
      const outputGaussian = inputA
        ? this.intersections.gaussianB
        : this.intersections.gaussianA;
      histogramEntries = [
        { binding: 0, resource: storage(inputKey) },
        { binding: 1, resource: storage(this.blockHistograms) },
        { binding: 2, resource: dispatchState(this.dispatchBuffer) },
      ];
      scatterEntries = [
        { binding: 0, resource: storage(inputKey) },
        { binding: 1, resource: storage(inputGaussian) },
        { binding: 2, resource: storage(this.blockPrefixes) },
        { binding: 3, resource: storage(this.digitOffsets) },
        { binding: 4, resource: storage(outputKey) },
        { binding: 5, resource: storage(outputGaussian) },
        { binding: 6, resource: dispatchState(this.dispatchBuffer) },
      ];
    }

    return {
      histogramPipeline,
      histogramBindGroup: this.device.createBindGroup({
        label: `3dgs.radix-histogram-bindings-${passIndex}`,
        layout: histogramPipeline.getBindGroupLayout(0),
        entries: histogramEntries,
      }),
      scatterPipeline,
      scatterBindGroup: this.device.createBindGroup({
        label: `3dgs.radix-scatter-bindings-${passIndex}`,
        layout: scatterPipeline.getBindGroupLayout(0),
        entries: scatterEntries,
      }),
    };
  }
}
