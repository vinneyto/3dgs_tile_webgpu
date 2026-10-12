import { StorageBindings } from "./StorageBindings";
import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  invocationLocalIndex,
  invocationSubgroupIndex,
  subgroupIndex,
  subgroupSize,
  uniform,
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
import {
  radixWorkgroupHistogramWGSL,
  radixWorkgroupScatterWGSL,
  reduceRadixHistogramsWorkgroupWGSL,
} from "../kernels/radixWorkgroup";
import { AttributePool } from "./AttributePool";
import {
  RADIX_BITS,
  RADIX_BLOCK_ITEMS,
  RADIX_MAX_SUBGROUPS,
  RADIX_REDUCE_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "./constants";
import type {
  DispatchResources,
  KeyValueBuffers,
  ResolvedRadixBackend,
} from "./types";

interface RadixPass {
  histogram: ComputeNode;
  scatter: ComputeNode;
}

/** Stable GPU radix sort for uvec2(key, value) records. */
export class RadixSorter {
  sortedRecords: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private blockHistograms: StorageBufferAttribute;
  private blockPrefixes: StorageBufferAttribute;
  private reduced: StorageBufferAttribute;
  private readonly reduceNode: ComputeNode;
  private readonly scanReducedNode: ComputeNode;
  private readonly scanAddNode: ComputeNode;
  private maxRadixBlocks: number;
  private maxReduceChunks: number;
  private passes: RadixPass[] = [];
  private activePassCount = 0;
  private readonly blockStride = uniform(1, "uint");
  private readonly chunkStride = uniform(1, "uint");

  constructor(
    private readonly renderer: WebGPURenderer,
    private readonly label: string,
    private capacity: number,
    private readonly buffers: KeyValueBuffers,
    private readonly dispatch: DispatchResources,
    private readonly backend: ResolvedRadixBackend,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
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

    this.blockStride.value = this.maxRadixBlocks;
    this.chunkStride.value = this.maxReduceChunks;
    const state = this.attributes
      .storage(dispatch.state, "uvec4", 1)
      .toReadOnly();
    const histograms = this.attributes
      .storage(this.blockHistograms, "uint", this.blockHistograms.count)
      .toReadOnly();
    const reduceKernel = wgslFn<Record<string, Node>>(
      backend === "subgroup"
        ? reduceRadixHistogramsWGSL
        : reduceRadixHistogramsWorkgroupWGSL,
    );
    const reduceParameters: Record<string, Node> = {
      lane: invocationLocalIndex,
      group_id: workgroupId,
      block_stride: this.blockStride,
      chunk_stride: this.chunkStride,
      state,
      block_histograms: histograms,
      reduced: this.attributes.storage(
        this.reduced,
        "uint",
        this.reduced.count,
      ),
    };
    if (backend === "subgroup") {
      reduceParameters.subgroup_index = subgroupIndex;
      reduceParameters.subgroup_lane = invocationSubgroupIndex;
      reduceParameters.subgroup_size = subgroupSize;
      reduceParameters.partials = workgroupArray("uint", RADIX_MAX_SUBGROUPS);
    } else {
      reduceParameters.scratch = workgroupArray("uint", WORKGROUP_SIZE);
    }
    this.reduceNode = reduceKernel(reduceParameters)
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS ${label} radix reduce WGSL`);

    const scanReducedKernel =
      wgslFn<Record<string, Node>>(scanRadixReducedWGSL);
    this.scanReducedNode = scanReducedKernel({
      chunk_stride: this.chunkStride,
      state,
      reduced: this.attributes.storage(
        this.reduced,
        "uint",
        this.reduced.count,
      ),
    })
      .compute(1)
      .setName(`3DGS ${label} radix global scan WGSL`);

    const scanAddKernel = wgslFn<Record<string, Node>>(
      scanAddRadixHistogramsWGSL,
    );
    this.scanAddNode = scanAddKernel({
      lane: invocationLocalIndex,
      group_id: workgroupId,
      block_stride: this.blockStride,
      chunk_stride: this.chunkStride,
      state,
      block_histograms: histograms,
      reduced: this.attributes
        .storage(this.reduced, "uint", this.reduced.count)
        .toReadOnly(),
      block_prefixes: this.attributes.storage(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count,
      ),
      scratch: workgroupArray("uint", RADIX_REDUCE_ITEMS),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS ${label} radix scan-add WGSL`);
    this.sortedRecords = buffers.recordsA;
    this.passes = Array.from({ length: 8 }, (_, index) =>
      this.createPass(index, index * RADIX_BITS),
    );
  }

  configure(bitCount: number): void {
    const count = Math.ceil(Math.max(0, bitCount) / RADIX_BITS);
    if (count > 8) throw new RangeError("Radix keys exceed 32 bits");
    this.activePassCount = count;
    this.sortedRecords =
      count % 2 === 0 ? this.buffers.recordsA : this.buffers.recordsB;
  }

  resize(capacity: number): void {
    this.capacity = Math.max(this.capacity, capacity);
    this.maxRadixBlocks = Math.ceil(this.capacity / RADIX_BLOCK_ITEMS);
    this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / RADIX_REDUCE_ITEMS);
    this.blockHistograms = this.attributes.grow(
      this.blockHistograms,
      this.maxRadixBlocks * RADIX_SIZE,
    );
    this.blockPrefixes = this.attributes.grow(
      this.blockPrefixes,
      this.maxRadixBlocks * RADIX_SIZE,
    );
    this.reduced = this.attributes.grow(
      this.reduced,
      this.maxReduceChunks * RADIX_SIZE,
    );
    this.blockStride.value = this.maxRadixBlocks;
    this.chunkStride.value = this.maxReduceChunks;
    this.configure(this.activePassCount * RADIX_BITS);
  }

  getComputeNodes(): ComputeNode[] {
    return [
      this.reduceNode,
      this.scanReducedNode,
      this.scanAddNode,
      ...this.passes.flatMap((pass) => [pass.histogram, pass.scatter]),
    ];
  }

  get passCount(): number {
    return this.activePassCount;
  }

  encode(_profileKernels = false): void {
    for (const pass of this.passes.slice(0, this.activePassCount)) {
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
    const state = this.attributes
      .storage(this.dispatch.state, "uvec4", 1)
      .toReadOnly();
    const recordsInput = this.attributes
      .storage(recordsIn, "uvec2", this.capacity)
      .toReadOnly();

    const histogramKernel = wgslFn<Record<string, Node>>(
      this.backend === "subgroup"
        ? radixHistogramWGSL(shift)
        : radixWorkgroupHistogramWGSL(shift),
    );
    const histogramParameters: Record<string, Node> = {
      lane: invocationLocalIndex,
      block_index: workgroupId.x,
      block_stride: this.blockStride,
      state,
      records: recordsInput,
      block_histograms: this.attributes.storage(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count,
      ),
    };
    if (this.backend === "subgroup") {
      histogramParameters.subgroup_index = subgroupIndex;
      histogramParameters.subgroup_lane = invocationSubgroupIndex;
      histogramParameters.subgroup_size = subgroupSize;
      histogramParameters.partials = workgroupArray(
        "uint",
        RADIX_SIZE * RADIX_MAX_SUBGROUPS,
      );
    } else {
      histogramParameters.histogram = workgroupArray("atomic<u32>", RADIX_SIZE);
    }
    const histogram = histogramKernel(histogramParameters)
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS ${this.label} radix histogram WGSL ${passIndex}`);

    const scatterKernel = wgslFn<Record<string, Node>>(
      this.backend === "subgroup"
        ? radixScatterWGSL(shift)
        : radixWorkgroupScatterWGSL(shift),
    );
    const scatterParameters: Record<string, Node> = {
      lane: invocationLocalIndex,
      block_index: workgroupId.x,
      block_stride: this.blockStride,
      state,
      records_in: recordsInput,
      records_out: this.attributes.storage(recordsOut, "uvec2", this.capacity),
      block_prefixes: this.attributes
        .storage(this.blockPrefixes, "uint", this.blockPrefixes.count)
        .toReadOnly(),
      block_bases: workgroupArray("uint", RADIX_SIZE),
      local_digit_counts: workgroupArray("uint", RADIX_SIZE),
    };
    if (this.backend === "subgroup") {
      scatterParameters.subgroup_index = subgroupIndex;
      scatterParameters.subgroup_lane = invocationSubgroupIndex;
      scatterParameters.subgroup_size = subgroupSize;
      scatterParameters.partials = workgroupArray(
        "uint",
        RADIX_SIZE * RADIX_MAX_SUBGROUPS,
      );
    } else {
      scatterParameters.shared_digits = workgroupArray("uint", WORKGROUP_SIZE);
      scatterParameters.shared_digit_masks = workgroupArray(
        "uint",
        RADIX_SIZE * (WORKGROUP_SIZE / 32),
      );
    }
    const scatter = scatterKernel(scatterParameters)
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
