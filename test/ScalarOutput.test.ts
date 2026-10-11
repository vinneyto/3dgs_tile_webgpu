import { describe, expect, it } from "vitest";
import {
  type Node,
  PerspectiveCamera,
  StorageBufferAttribute,
} from "three/webgpu";
import { Fn, float, instanceIndex, storage, uvec2, wgslFn } from "three/tsl";
import { WgslExec, WgslParser } from "wgsl_reflect/wgsl_reflect.module.js";
import {
  createDefaultGaussianNodeSlots,
  rasterAccumulatedAlpha,
  rasterOutputDepth,
} from "../src/renderer/nodes/GaussianContextNodes";
import { FrameUniforms } from "../src/renderer/pipeline/FrameUniforms";
import { finalizeGaussianDepth } from "../src/renderer/pipeline/finalizeGaussianDepth";
import { buildCompute } from "./helpers/buildCompute";

function evaluate(
  samples: readonly (readonly [number, number])[],
  encoding?: Node,
) {
  const input = new StorageBufferAttribute(new Float32Array(samples.flat()), 2);
  const output = new StorageBufferAttribute(samples.length, 1);
  const nodes = createDefaultGaussianNodeSlots();
  nodes.rasterOutputDepthNode = rasterOutputDepth;
  if (encoding) nodes.rasterOutputDepthNode = encoding;
  const frame = new FrameUniforms(new PerspectiveCamera(), [0, 0, 0, 1]);
  // An Infinity uniform is represented by the same float32 bits. Constant
  // bitcast here avoids binding a uniform block in the CPU execution harness.
  const infinity = wgslFn<any>(
    "fn invalid_scalar() -> f32 { return bitcast<f32>(0x7f800000u); }",
  );
  Object.assign(frame, { invalidDepthValue: infinity() });
  const source = storage(input, "vec2", input.count).toReadOnly();
  const result = storage(output, "float", output.count);
  const shader = buildCompute(
    Fn(() => {
      const sample = source.element(instanceIndex);
      const value = finalizeGaussianDepth(
        sample.x,
        sample.y,
        uvec2(0),
        frame,
        0.5,
        nodes,
      );
      result.element(instanceIndex).assign(value);
    })().computeKernel([1]),
  );
  const exec = new WgslExec(new WgslParser().parse(shader));
  const bindings: Record<number, Record<number, ArrayBufferLike>> = {};
  for (const resource of exec.reflection.storage) {
    const group = (bindings[resource.group] ??= {});
    group[resource.binding] =
      resource.access === "read" ? input.array.buffer : output.array.buffer;
  }
  exec.dispatchWorkgroups("main", samples.length, bindings);
  return Array.from(output.array);
}

describe("executed shared scalar finalization", () => {
  it("uses Infinity for empty pixels, insufficient coverage and non-finite accumulation", () => {
    expect(
      evaluate([
        [0, 1],
        [0.6, 0.8],
        [Infinity, 0.1],
        [NaN, 0.1],
        [0, 0.1],
      ]),
    ).toEqual([Infinity, Infinity, Infinity, Infinity, Infinity]);
  });
  it("returns the finite alpha-weighted scalar without device-depth normalization", () => {
    // Both direct accumulation and composed partial sums reach this graph with
    // weighted scalar 8.8, coverage 0.8. Background alpha is excluded.
    const values = evaluate([
      [8.8, 0.2],
      [880, 0.2],
    ]);
    expect(values[0]).toBeCloseTo(11, 5);
    expect(values[1]).toBeCloseTo(1100, 3);
  });
  it("rejects non-finite custom encodings and never divides by zero", () => {
    expect(
      evaluate(
        [
          [8.8, 0.2],
          [0, 1],
        ],
        rasterOutputDepth.div(float(0)),
      ),
    ).toEqual([Infinity, Infinity]);
  });
  it("does not conflate accumulated coverage with background alpha", () => {
    expect(evaluate([[0.1, 0.9]], rasterAccumulatedAlpha)).toEqual([Infinity]);
  });
});
