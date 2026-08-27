import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  invocationLocalIndex,
  invocationSubgroupIndex,
  storage,
  subgroupIndex,
  subgroupSize,
  uint,
  wgslFn,
  workgroupArray,
  workgroupId,
} from "three/tsl";
import {
  radixHistogramWGSL,
  radixScatterWGSL,
  reduceRadixHistogramsWGSL,
  scanAddRadixHistogramsWGSL,
  scanRadixReducedWGSL,
} from "../kernels/radix";
import { AttributePool } from "./AttributePool";
import {
  RADIX_BITS,
  RADIX_BLOCK_ITEMS,
  RADIX_MAX_SUBGROUPS,
  RADIX_REDUCE_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "./constants";
import type { DispatchResources, KeyValueBuffers } from "./types";

interface RadixPass {
  histogram: ComputeNode;
  scatter: ComputeNode;
}

/** Stable GPU radix sort for uvec2(key, value) records. */
export class RadixSorter {
  sortedRecords: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly blockHistograms: StorageBufferAttribute;
  private readonly blockPrefixes: StorageBufferAttribute;
  private readonly reduced: StorageBufferAttribute;
  private readonly reduceNode: ComputeNode;
  private readonly scanReducedNode: ComputeNode;
  private readonly scanAddNode: ComputeNode;
  private readonly maxRadixBlocks: number;
  private readonly maxReduceChunks: number;
  private passes: RadixPass[] = [];

  constructor(
    private readonly renderer: WebGPURenderer,
    private readonly label: string,
    private readonly capacity: number,
    private readonly buffers: KeyValueBuffers,
    private readonly dispatch: DispatchResources,
  ) {
    this.maxRadixBlocks = Math.ceil(capacity / RADIX_BLOCK_ITEMS);
    this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / RADIX_REDUCE_ITEMS);
    this.blockHistograms = this.attributes.createUint(
      `3dgs.${label}-radix-histograms`,
      this.maxRadixBlocks * RADIX_SIZE,
    );
    this.blockPrefixes = this.attributes.createUint(
      `3dgs.${label}-radix-prefixes`,
      this.maxRadixBlocks * RADIX_SIZE,
    );
    this.reduced = this.attributes.createUint(
      `3dgs.${label}-radix-reduced`,
      this.maxReduceChunks * RADIX_SIZE,
    );

    const state = storage(dispatch.state, "uvec4", 1).toReadOnly();
    const histograms = storage(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count,
    ).toReadOnly();
    const reduceKernel = wgslFn<Record<string, Node>>(
      reduceRadixHistogramsWGSL,
    );
    this.reduceNode = reduceKernel({
      lane: invocationLocalIndex,
      group_id: workgroupId,
      subgroup_index: subgroupIndex,
      subgroup_lane: invocationSubgroupIndex,
      subgroup_size: subgroupSize,
      block_stride: uint(this.maxRadixBlocks),
      chunk_stride: uint(this.maxReduceChunks),
      state,
      block_histograms: histograms,
      reduced: storage(this.reduced, "uint", this.reduced.count),
      partials: workgroupArray("uint", RADIX_MAX_SUBGROUPS),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS ${label} radix reduce WGSL`);

    const scanReducedKernel =
      wgslFn<Record<string, Node>>(scanRadixReducedWGSL);
    this.scanReducedNode = scanReducedKernel({
      chunk_stride: uint(this.maxReduceChunks),
      state,
      reduced: storage(this.reduced, "uint", this.reduced.count),
    })
      .compute(1)
      .setName(`3DGS ${label} radix global scan WGSL`);

    const scanAddKernel = wgslFn<Record<string, Node>>(
      scanAddRadixHistogramsWGSL,
    );
    this.scanAddNode = scanAddKernel({
      lane: invocationLocalIndex,
      group_id: workgroupId,
      block_stride: uint(this.maxRadixBlocks),
      chunk_stride: uint(this.maxReduceChunks),
      state,
      block_histograms: histograms,
      reduced: storage(this.reduced, "uint", this.reduced.count).toReadOnly(),
      block_prefixes: storage(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count,
      ),
      scratch: workgroupArray("uint", RADIX_REDUCE_ITEMS),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS ${label} radix scan-add WGSL`);
    this.sortedRecords = buffers.recordsA;
  }

  configure(bitCount: number): void {
    this.disposePasses();
    const passCount = Math.ceil(Math.max(0, bitCount) / RADIX_BITS);
    this.passes = Array.from({ length: passCount }, (_, passIndex) =>
      this.createPass(passIndex, passIndex * RADIX_BITS),
    );
    this.sortedRecords =
      passCount % 2 === 0 ? this.buffers.recordsA : this.buffers.recordsB;
  }

  get passCount(): number {
    return this.passes.length;
  }

  encode(_profileKernels = false): void {
    for (const pass of this.passes) {
      this.renderer.compute(pass.histogram, this.dispatch.radixBlock);
      this.renderer.compute(this.reduceNode, this.dispatch.radixReduce);
      this.renderer.compute(this.scanReducedNode);
      this.renderer.compute(this.scanAddNode, this.dispatch.radixReduce);
      this.renderer.compute(pass.scatter, this.dispatch.radixBlock);
    }
  }

  dispose(): void {
    this.disposePasses();
    this.reduceNode.dispose();
    this.scanReducedNode.dispose();
    this.scanAddNode.dispose();
    this.attributes.dispose();
  }

  private createPass(passIndex: number, shift: number): RadixPass {
    const inputA = passIndex % 2 === 0;
    const recordsIn = inputA ? this.buffers.recordsA : this.buffers.recordsB;
    const recordsOut = inputA ? this.buffers.recordsB : this.buffers.recordsA;
    const state = storage(this.dispatch.state, "uvec4", 1).toReadOnly();
    const recordsInput = storage(
      recordsIn,
      "uvec2",
      this.capacity,
    ).toReadOnly();

    const histogramKernel = wgslFn<Record<string, Node>>(
      radixHistogramWGSL(shift),
    );
    const histogram = histogramKernel({
      lane: invocationLocalIndex,
      block_index: workgroupId.x,
      subgroup_index: subgroupIndex,
      subgroup_lane: invocationSubgroupIndex,
      subgroup_size: subgroupSize,
      block_stride: uint(this.maxRadixBlocks),
      state,
      records: recordsInput,
      block_histograms: storage(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count,
      ),
      partials: workgroupArray("uint", RADIX_SIZE * RADIX_MAX_SUBGROUPS),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS ${this.label} radix histogram WGSL ${passIndex}`);

    const scatterKernel = wgslFn<Record<string, Node>>(radixScatterWGSL(shift));
    const scatter = scatterKernel({
      lane: invocationLocalIndex,
      block_index: workgroupId.x,
      subgroup_index: subgroupIndex,
      subgroup_lane: invocationSubgroupIndex,
      subgroup_size: subgroupSize,
      block_stride: uint(this.maxRadixBlocks),
      state,
      records_in: recordsInput,
      records_out: storage(recordsOut, "uvec2", this.capacity),
      block_prefixes: storage(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count,
      ).toReadOnly(),
      block_bases: workgroupArray("uint", RADIX_SIZE),
      local_digit_counts: workgroupArray("uint", RADIX_SIZE),
      partials: workgroupArray("uint", RADIX_SIZE * RADIX_MAX_SUBGROUPS),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS ${this.label} radix scatter WGSL ${passIndex}`);
    return { histogram, scatter };
  }

  private disposePasses(): void {
    for (const pass of this.passes) {
      pass.histogram.dispose();
      pass.scatter.dispose();
    }
    this.passes = [];
  }
}
