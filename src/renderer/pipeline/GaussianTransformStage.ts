import {
  StorageBufferAttribute,
  type ComputeNode,
  type WebGPURenderer,
} from "three/webgpu";
import {
  Fn,
  If,
  Return,
  instanceIndex,
  uint,
  vec3,
  vec4,
  wgslFn,
} from "three/tsl";
import { GaussianData } from "../GaussianData";
import {
  compactScaleOpacityWGSL,
  compactRotationWGSL,
} from "../kernels/compactGaussians";
import {
  gaussianIndex,
  gaussianObjectId,
  gaussianPositionLocal,
  gaussianScale,
  gaussianRotation,
  gaussianOpacity,
  validateGaussianNodeAccess,
  resolveGaussianNode,
} from "../nodes/GaussianContextNodes";
import type {
  GaussianDataPassContext,
  GaussianDataPassRuntime,
} from "../passes/GaussianDataPass";
import type { GaussianTransformNodeSlots } from "../passes/GaussianTransformPass";
import { WORKGROUP_SIZE } from "./constants";

const accessors = new Set([
  gaussianIndex,
  gaussianObjectId,
  gaussianPositionLocal,
  gaussianScale,
  gaussianRotation,
  gaussianOpacity,
]);

/** Six storage buffers per dispatch; SH and the active index tail stay in the source representation. */
export class GaussianTransformStage implements GaussianDataPassRuntime {
  private source: GaussianData;
  private output: GaussianData;
  private compute: ComputeNode;
  private compiledNodes: GaussianTransformNodeSlots;
  private activeVersion = -1;
  constructor(
    private readonly context: GaussianDataPassContext,
    private readonly nodes: GaussianTransformNodeSlots,
  ) {
    this.source = context.source;
    this.source.retain();
    let allocated: GaussianData | null = null;
    try {
      this.output = allocated = this.allocate();
      this.compiledNodes = { ...nodes };
      this.compute = this.build();
    } catch (error) {
      // Validation can fail before a runtime is returned to its owner.
      for (const key of ["means", "scalesOpacity", "rotations"] as const)
        if (allocated) context.bindings.retire(allocated[key]);
      allocated?.dispose();
      this.source.release();
      throw error;
    }
  }
  getData(): GaussianData {
    if (
      this.source.activeSlots &&
      this.activeVersion !== this.source.activeVersion
    ) {
      this.output.stageActivation(
        this.source.activeSlots.subarray(0, this.source.activeCount),
        this.output.activeSlots!.slice(0, this.output.activeCount),
        true,
      );
      this.activeVersion = this.source.activeVersion;
    }
    return this.output;
  }
  updateData(source: GaussianData): void {
    if (source === this.source) return;
    const previousSource = this.source;
    const previousOutput = this.output;
    source.retain();
    let nextOutput: GaussianData | null = null;
    let nextCompute: ComputeNode;
    this.source = source;
    try {
      this.output = nextOutput = this.allocate();
      nextCompute = this.build();
    } catch (error) {
      this.source = previousSource;
      this.output = previousOutput;
      if (nextOutput) {
        for (const key of ["means", "scalesOpacity", "rotations"] as const)
          this.context.bindings.retire(nextOutput[key]);
        nextOutput.dispose();
      }
      source.release();
      throw error;
    }
    this.activeVersion = -1;
    for (const key of ["means", "scalesOpacity", "rotations"] as const) {
      this.context.bindings.replace(previousOutput[key], this.output[key]);
      this.context.bindings.retire(previousOutput[key]);
    }
    previousOutput.dispose();
    this.context.bindings.afterSubmittedWork(() => previousSource.release());
    this.compute.dispose();
    this.compute = nextCompute;
  }

  encode(renderer: WebGPURenderer): void {
    if (
      Object.keys(this.nodes).some(
        (key) =>
          this.nodes[key as keyof GaussianTransformNodeSlots] !==
          this.compiledNodes[key as keyof GaussianTransformNodeSlots],
      )
    ) {
      const next = this.build();
      this.compute.dispose();
      this.compute = next;
    }
    renderer.compute(this.compute);
  }
  getComputeNodes(): ComputeNode[] {
    // Warmup also compiles node replacements before the next encoded frame.
    if (
      Object.keys(this.nodes).some(
        (key) =>
          this.nodes[key as keyof GaussianTransformNodeSlots] !==
          this.compiledNodes[key as keyof GaussianTransformNodeSlots],
      )
    ) {
      const next = this.build();
      this.compute.dispose();
      this.compute = next;
    }
    return [this.compute];
  }
  dispose(): void {
    this.compute.dispose();
    for (const key of ["means", "scalesOpacity", "rotations"] as const)
      this.context.bindings.retire(this.output[key]);
    this.output.dispose();
    const source = this.source;
    this.context.bindings.afterSubmittedWork(() => source.release());
  }
  private allocate(): GaussianData {
    const count = this.source.count;
    if (count > this.context.bindings.maximumCount(4))
      throw new RangeError(
        "Transformed Gaussian buffer exceeds device binding size",
      );
    const attribute = (name: string) => {
      const value = new StorageBufferAttribute(new Float32Array(count * 4), 4);
      value.name = `3dgs.transformed-${name}`;
      return value;
    };
    return new GaussianData(
      {
        means: attribute("means"),
        scalesOpacity: attribute("shape"),
        rotations: attribute("rotations"),
        shCoefficients: this.source.shCoefficients,
      },
      {
        count,
        shDegree: this.source.shDegree,
        shFormat: this.source.shFormat,
        activeSlots: this.source.activeSlots ? new Uint32Array() : undefined,
      },
    );
  }
  private build(): ComputeNode {
    for (const [key, node] of Object.entries(this.nodes))
      validateGaussianNodeAccess(node, accessors, `data.${key}`);
    const { source, output, nodes } = this;
    const { bindings } = this.context;
    const means = bindings.storage(source.means, "vec4").toReadOnly();
    const shapes = bindings
      .storage(
        source.scalesOpacity,
        source.geometryFormat === "compact" ? "uvec2" : "vec4",
      )
      .toReadOnly();
    const rotations = bindings
      .storage(
        source.rotations,
        source.geometryFormat === "compact" ? "uint" : "vec4",
      )
      .toReadOnly();
    const outMean = bindings.storage(output.means, "vec4");
    const outShape = bindings.storage(output.scalesOpacity, "vec4");
    const outRotation = bindings.storage(output.rotations, "vec4");
    const decodeShape = wgslFn(compactScaleOpacityWGSL);
    const decodeRotation = wgslFn(compactRotationWGSL);
    const kernel = Fn(() => {
      const slot = uint(instanceIndex);
      If(slot.greaterThanEqual(source.count), () => {
        Return();
      });
      const mean = means.element(slot).toVar();
      outMean.element(slot).assign(vec4(0, 0, 0, -1));
      outShape.element(slot).assign(vec4(0));
      outRotation.element(slot).assign(vec4(0, 0, 0, 1));
      If(mean.w.lessThan(0), () => {
        Return();
      });
      const shape =
        source.geometryFormat === "compact"
          ? (decodeShape({ packed: shapes.element(slot) }) as any)
          : shapes.element(slot);
      const rotation =
        source.geometryFormat === "compact"
          ? (decodeRotation({ packed: rotations.element(slot) }) as any)
          : rotations.element(slot);
      const overrides = new Map<any, () => any>([
        [gaussianIndex, () => slot],
        [gaussianObjectId, () => uint(mean.w)],
        [gaussianPositionLocal, () => mean.xyz],
        [gaussianScale, () => shape.xyz],
        [gaussianRotation, () => rotation],
        [gaussianOpacity, () => shape.w],
      ]);
      const resolve = (node: any): any => resolveGaussianNode(node, overrides);
      outMean.element(slot).assign(vec4(resolve(nodes.positionNode), mean.w));
      outShape
        .element(slot)
        .assign(
          vec4(vec3(resolve(nodes.scaleNode)), resolve(nodes.opacityNode)),
        );
      outRotation.element(slot).assign(resolve(nodes.rotationNode));
    });
    const compute = kernel()
      .compute(source.count, [WORKGROUP_SIZE])
      .setName("3DGS prepare transformed Gaussian data TSL");
    this.compiledNodes = { ...nodes };
    return compute;
  }
}
