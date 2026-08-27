import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  Fn,
  If,
  Loop,
  Return,
  instanceIndex,
  invocationLocalIndex,
  select,
  storage,
  uint,
  workgroupArray,
} from "three/tsl";
import { AttributePool } from "./AttributePool";
import {
  RADIX_BITS,
  RADIX_BLOCK_ITEMS,
  RADIX_SIZE,
  WORKGROUP_SIZE,
} from "./constants";
import type {
  DepthSortMode,
  DispatchResources,
  IntersectionBuffers,
} from "./types";
import { uintElement } from "./tslTypes";

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
  private readonly scanBlockHistogramsNode: ComputeNode;
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

    const blockHistograms = storage(
      this.blockHistograms,
      "uint",
      maxRadixBlocks * RADIX_SIZE,
    ).toReadOnly();
    const blockPrefixes = storage(
      this.blockPrefixes,
      "uint",
      maxRadixBlocks * RADIX_SIZE,
    );
    const digitTotals = storage(this.digitTotals, "uint", RADIX_SIZE);
    const state = storage(this.dispatch.state, "uvec4", 1).toReadOnly();
    const scanBlocksKernel = Fn(() => {
      const digit = instanceIndex;
      const running = uint(0).toVar();
      Loop(
        {
          start: uint(0),
          end: state.element(0).z,
          type: "uint",
          condition: "<",
        },
        ({ i: blockIndex }) => {
          const address = blockIndex.mul(RADIX_SIZE).add(digit).toVar();
          blockPrefixes.element(address).assign(running);
          running.addAssign(blockHistograms.element(address));
        },
      );
      digitTotals.element(digit).assign(running);
    });
    this.scanBlockHistogramsNode = scanBlocksKernel()
      .compute(RADIX_SIZE, [RADIX_SIZE])
      .setName("3DGS radix scan block histograms");

    const digitTotalsRead = storage(
      this.digitTotals,
      "uint",
      RADIX_SIZE,
    ).toReadOnly();
    const digitOffsets = storage(this.digitOffsets, "uint", RADIX_SIZE);
    const scanDigitsKernel = Fn(() => {
      const running = uint(0).toVar();
      Loop(RADIX_SIZE, ({ i }) => {
        digitOffsets.element(i).assign(running);
        running.addAssign(digitTotalsRead.element(i));
      });
    });
    this.scanDigitTotalsNode = scanDigitsKernel()
      .compute(1)
      .setName("3DGS radix scan digit totals");

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
    const finalInputA = this.passes.length % 2 === 0;
    this.sortedRecords = finalInputA
      ? this.intersections.recordsA
      : this.intersections.recordsB;
  }

  encode(): void {
    for (const pass of this.passes) {
      this.renderer.compute(pass.histogram, this.dispatch.radix);
      this.renderer.compute([
        this.scanBlockHistogramsNode,
        this.scanDigitTotalsNode,
      ]);
      this.renderer.compute(pass.scatter, this.dispatch.radix);
    }
  }

  dispose(): void {
    this.disposePasses();
    this.scanBlockHistogramsNode.dispose();
    this.scanDigitTotalsNode.dispose();
    this.attributes.dispose();
  }

  private createPass(
    passIndex: number,
    shift: number,
    keyKind: number,
  ): RadixPass {
    const inputA = passIndex % 2 === 0;
    const blockHistogram = storage(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count,
    );
    const state = storage(this.dispatch.state, "uvec4", 1).toReadOnly();
    const histogramScratch = workgroupArray(
      "uint",
      WORKGROUP_SIZE * RADIX_SIZE,
    );

    let readKey: (index: Node<"uint">) => Node<"uint">;
    let writeRecord: (
      destination: Node<"uint">,
      position: Node<"uint">,
    ) => void;
    if (this.intersections.kind === "float32") {
      const inputRecords = storage(
        inputA ? this.intersections.recordsA : this.intersections.recordsB,
        "uvec4",
        this.capacity,
      ).toReadOnly();
      const outputRecords = storage(
        inputA ? this.intersections.recordsB : this.intersections.recordsA,
        "uvec4",
        this.capacity,
      );
      readKey = (index) =>
        keyKind === 0
          ? inputRecords.element(index).y
          : inputRecords.element(index).x;
      writeRecord = (destination, position) => {
        outputRecords
          .element(destination)
          .assign(inputRecords.element(position));
      };
    } else {
      const inputRecords = storage(
        inputA ? this.intersections.recordsA : this.intersections.recordsB,
        "uvec2",
        this.capacity,
      ).toReadOnly();
      const outputRecords = storage(
        inputA ? this.intersections.recordsB : this.intersections.recordsA,
        "uvec2",
        this.capacity,
      );
      readKey = (index) => inputRecords.element(index).x;
      writeRecord = (destination, position) => {
        outputRecords
          .element(destination)
          .assign(inputRecords.element(position));
      };
    }

    const histogramKernel = Fn(() => {
      const blockIndex = instanceIndex;
      const blockStart = blockIndex.mul(RADIX_BLOCK_ITEMS).toVar();
      If(blockStart.greaterThanEqual(state.element(0).x), () => Return());
      const localBase = invocationLocalIndex.mul(RADIX_SIZE).toVar();
      Loop(RADIX_SIZE, ({ i }) => {
        uintElement(histogramScratch, localBase.add(uint(i))).assign(0);
      });
      const proposedEnd = blockStart.add(RADIX_BLOCK_ITEMS).toVar();
      const blockEnd = select(
        proposedEnd.lessThan(state.element(0).x),
        proposedEnd,
        state.element(0).x,
      ).toVar();
      Loop(
        {
          start: blockStart,
          end: blockEnd,
          type: "uint",
          condition: "<",
        },
        ({ i: position }) => {
          const digit = readKey(position)
            .shiftRight(shift)
            .bitAnd(RADIX_SIZE - 1)
            .toVar();
          uintElement(histogramScratch, localBase.add(digit)).addAssign(1);
        },
      );
      const outputStart = blockIndex.mul(RADIX_SIZE).toVar();
      Loop(RADIX_SIZE, ({ i }) => {
        blockHistogram
          .element(outputStart.add(uint(i)))
          .assign(uintElement(histogramScratch, localBase.add(uint(i))));
      });
    });

    const blockPrefixes = storage(
      this.blockPrefixes,
      "uint",
      this.blockPrefixes.count,
    ).toReadOnly();
    const digitOffsets = storage(
      this.digitOffsets,
      "uint",
      RADIX_SIZE,
    ).toReadOnly();
    const scatterScratch = workgroupArray("uint", WORKGROUP_SIZE * RADIX_SIZE);
    const scatterKernel = Fn(() => {
      const blockIndex = instanceIndex;
      const blockStart = blockIndex.mul(RADIX_BLOCK_ITEMS).toVar();
      If(blockStart.greaterThanEqual(state.element(0).x), () => Return());
      const localBase = invocationLocalIndex.mul(RADIX_SIZE).toVar();
      Loop(RADIX_SIZE, ({ i }) => {
        uintElement(scatterScratch, localBase.add(uint(i))).assign(0);
      });
      const proposedEnd = blockStart.add(RADIX_BLOCK_ITEMS).toVar();
      const blockEnd = select(
        proposedEnd.lessThan(state.element(0).x),
        proposedEnd,
        state.element(0).x,
      ).toVar();
      const prefixStart = blockIndex.mul(RADIX_SIZE).toVar();
      Loop(
        {
          start: blockStart,
          end: blockEnd,
          type: "uint",
          condition: "<",
        },
        ({ i: position }) => {
          const digit = readKey(position)
            .shiftRight(shift)
            .bitAnd(RADIX_SIZE - 1)
            .toVar();
          const localAddress = localBase.add(digit).toVar();
          const destination = digitOffsets
            .element(digit)
            .add(blockPrefixes.element(prefixStart.add(digit)))
            .add(uintElement(scatterScratch, localAddress))
            .toVar();
          uintElement(scatterScratch, localAddress).addAssign(1);
          writeRecord(destination, position);
        },
      );
    });

    return {
      histogram: histogramKernel()
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS radix histogram ${passIndex}`),
      scatter: scatterKernel()
        .computeKernel([WORKGROUP_SIZE])
        .setName(`3DGS radix scatter ${passIndex}`),
    };
  }

  private disposePasses(): void {
    for (const pass of this.passes) {
      pass.histogram.dispose();
      pass.scatter.dispose();
    }
    this.passes = [];
  }
}
