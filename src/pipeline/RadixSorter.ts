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
  addRadixChunkOffsetsWGSL,
  radixHistogramWGSL,
  radixScatterWGSL,
  scanDigitTotalsWGSL,
  scanRadixChunkSumsWGSL,
  scanRadixHistogramChunksWGSL,
} from "../kernels/radix";
import { AttributePool } from "./AttributePool";
import {
  RADIX_BITS,
  RADIX_BLOCK_ITEMS,
  RADIX_SCAN_CHUNK_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "./constants";
import type {
  DepthSortMode,
  DispatchResources,
  IntersectionBuffers,
} from "./types";

interface RadixPass {
  histogram: ComputeNode;
  scatter: ComputeNode;
}

export class RadixSorter {
  sortedRecords: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly blockHistograms: StorageBufferAttribute;
  private readonly blockPrefixes: StorageBufferAttribute;
  private readonly digitTotals: StorageBufferAttribute;
  private readonly digitOffsets: StorageBufferAttribute;
  private readonly chunkSums: StorageBufferAttribute;
  private readonly chunkOffsets: StorageBufferAttribute;
  private readonly scanHistogramChunksNode: ComputeNode;
  private readonly scanChunkSumsNode: ComputeNode;
  private readonly addChunkOffsetsNode: ComputeNode;
  private readonly scanDigitTotalsNode: ComputeNode;
  private passes: RadixPass[] = [];

  constructor(
    private readonly renderer: WebGPURenderer,
    private readonly mode: DepthSortMode,
    private readonly capacity: number,
    private readonly intersections: IntersectionBuffers,
    private readonly dispatch: DispatchResources,
  ) {
    const maxRadixBlocks = Math.ceil(capacity / RADIX_BLOCK_ITEMS);
    const maxScanChunks = Math.ceil(maxRadixBlocks / RADIX_SCAN_CHUNK_ITEMS);
    this.blockHistograms = this.attributes.createUint(
      "3dgs.radix-histograms",
      maxRadixBlocks * RADIX_SIZE,
    );
    this.blockPrefixes = this.attributes.createUint(
      "3dgs.radix-prefixes",
      maxRadixBlocks * RADIX_SIZE,
    );
    this.digitTotals = this.attributes.createUint(
      "3dgs.radix-digit-totals",
      RADIX_SIZE,
    );
    this.digitOffsets = this.attributes.createUint(
      "3dgs.radix-digit-offsets",
      RADIX_SIZE,
    );
    this.chunkSums = this.attributes.createUint(
      "3dgs.radix-chunk-sums",
      maxScanChunks * RADIX_SIZE,
    );
    this.chunkOffsets = this.attributes.createUint(
      "3dgs.radix-chunk-offsets",
      maxScanChunks * RADIX_SIZE,
    );

    const state = storage(dispatch.state, "uvec4", 1).toReadOnly();
    const blockPrefixes = storage(
      this.blockPrefixes,
      "uint",
      this.blockPrefixes.count,
    );
    const scanChunksKernel = wgslFn<Record<string, Node>>(
      scanRadixHistogramChunksWGSL,
    );
    this.scanHistogramChunksNode = scanChunksKernel({
      lane: invocationLocalIndex,
      group_id: workgroupId,
      chunk_stride: uint(maxScanChunks),
      state,
      block_histograms: storage(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count,
      ).toReadOnly(),
      block_prefixes: blockPrefixes,
      chunk_sums: storage(this.chunkSums, "uint", this.chunkSums.count),
      scratch: workgroupArray("uint", RADIX_SCAN_CHUNK_ITEMS),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName("3DGS radix scan histogram chunks WGSL");

    const scanChunkSumsKernel = wgslFn<Record<string, Node>>(
      scanRadixChunkSumsWGSL,
    );
    this.scanChunkSumsNode = scanChunkSumsKernel({
      lane: invocationLocalIndex,
      digit: workgroupId.x,
      chunk_stride: uint(maxScanChunks),
      state,
      chunk_sums: storage(
        this.chunkSums,
        "uint",
        this.chunkSums.count,
      ).toReadOnly(),
      chunk_offsets: storage(
        this.chunkOffsets,
        "uint",
        this.chunkOffsets.count,
      ),
      digit_totals: storage(this.digitTotals, "uint", RADIX_SIZE),
      scratch: workgroupArray("uint", RADIX_SCAN_CHUNK_ITEMS),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName("3DGS radix scan chunk sums WGSL");

    const addChunkOffsetsKernel = wgslFn<Record<string, Node>>(
      addRadixChunkOffsetsWGSL,
    );
    this.addChunkOffsetsNode = addChunkOffsetsKernel({
      lane: invocationLocalIndex,
      group_id: workgroupId,
      chunk_stride: uint(maxScanChunks),
      state,
      block_prefixes: blockPrefixes,
      chunk_offsets: storage(
        this.chunkOffsets,
        "uint",
        this.chunkOffsets.count,
      ).toReadOnly(),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName("3DGS radix add chunk offsets WGSL");

    const scanDigitsKernel = wgslFn<Record<string, Node>>(scanDigitTotalsWGSL);
    this.scanDigitTotalsNode = scanDigitsKernel({
      digit_totals: storage(this.digitTotals, "uint", RADIX_SIZE).toReadOnly(),
      digit_offsets: storage(this.digitOffsets, "uint", RADIX_SIZE),
    })
      .compute(1)
      .setName("3DGS radix scan digit totals WGSL");

    this.sortedRecords = intersections.recordsA;
  }

  configure(tileCount: number): void {
    this.disposePasses();
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
    this.sortedRecords =
      this.passes.length % 2 === 0
        ? this.intersections.recordsA
        : this.intersections.recordsB;
  }

  get passCount(): number {
    return this.passes.length;
  }

  encode(_profileKernels = false): void {
    for (const pass of this.passes) {
      this.renderer.compute(pass.histogram, this.dispatch.radix);
      this.renderer.compute(
        this.scanHistogramChunksNode,
        this.dispatch.radixScan,
      );
      this.renderer.compute(this.scanChunkSumsNode, [RADIX_SIZE, 1, 1]);
      this.renderer.compute(this.addChunkOffsetsNode, this.dispatch.radixScan);
      this.renderer.compute(this.scanDigitTotalsNode);
      this.renderer.compute(pass.scatter, this.dispatch.radix);
    }
  }

  dispose(): void {
    this.disposePasses();
    this.scanHistogramChunksNode.dispose();
    this.scanChunkSumsNode.dispose();
    this.addChunkOffsetsNode.dispose();
    this.scanDigitTotalsNode.dispose();
    this.attributes.dispose();
  }

  private createPass(
    passIndex: number,
    shift: number,
    keyKind: number,
  ): RadixPass {
    const inputA = passIndex % 2 === 0;
    const recordsIn = inputA
      ? this.intersections.recordsA
      : this.intersections.recordsB;
    const recordsOut = inputA
      ? this.intersections.recordsB
      : this.intersections.recordsA;
    const recordType = this.mode === "float32" ? "uvec4" : "uvec2";
    const state = storage(this.dispatch.state, "uvec4", 1).toReadOnly();
    const recordsInput = storage(
      recordsIn,
      recordType,
      this.capacity,
    ).toReadOnly();

    const histogramKernel = wgslFn<Record<string, Node>>(
      radixHistogramWGSL(this.mode, shift, keyKind),
    );
    const histogram = histogramKernel({
      block_index: instanceIndex,
      state,
      records: recordsInput,
      block_histograms: storage(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count,
      ),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS radix histogram WGSL ${passIndex}`);

    const scatterKernel = wgslFn<Record<string, Node>>(
      radixScatterWGSL(this.mode, shift, keyKind),
    );
    const scatter = scatterKernel({
      block_index: instanceIndex,
      state,
      records_in: recordsInput,
      records_out: storage(recordsOut, recordType, this.capacity),
      block_prefixes: storage(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count,
      ).toReadOnly(),
      digit_offsets: storage(
        this.digitOffsets,
        "uint",
        RADIX_SIZE,
      ).toReadOnly(),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName(`3DGS radix scatter WGSL ${passIndex}`);

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
