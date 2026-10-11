import { float, If, vec2 } from "three/tsl";
import {
  rasterAccumulatedDepth,
  rasterAccumulatedAlpha,
  rasterOutputDepth,
  rasterOutputValid,
  rasterPixelCoordinate,
  rasterScreenPosition,
  rasterScreenUV,
  resolveGaussianNode,
  type GaussianRasterNodeSlots,
} from "../nodes/GaussianContextNodes";
import { passContextOverrides, type FrameUniforms } from "./FrameUniforms";

type OverrideMap = Map<any, () => any>;

/** Shared final scalar graph. Called only after direct accumulation or ordered chunk composition. */
export function finalizeGaussianDepth(
  weightedViewDepth: any,
  transmittance: any,
  pixel: any,
  frame: FrameUniforms,
  depthAlphaThreshold: number,
  nodes: GaussianRasterNodeSlots,
): any {
  const gaussianAlpha = float(1)
    .sub(transmittance)
    .toVar("rasterAccumulatedAlphaValue");
  const outputDepth = float(0).toVar("rasterOutputDepthValue");
  // Branch explicitly: neither the default nor a custom graph sees 0/0.
  If(gaussianAlpha.greaterThan(0), () => {
    outputDepth.assign(weightedViewDepth.div(gaussianAlpha));
  });
  const finite = (value: any) =>
    value.equal(value).and(value.abs().lessThanEqual(float(3.402823e38)));
  const scalarValid = gaussianAlpha
    .greaterThan(0)
    .and(finite(weightedViewDepth))
    .and(finite(outputDepth))
    .and(outputDepth.greaterThan(0));
  const defaultValid = scalarValid.and(
    gaussianAlpha.greaterThan(depthAlphaThreshold),
  );
  const pixelCenter = vec2(pixel).add(0.5);
  const overrides: OverrideMap = new Map<any, () => any>([
    ...passContextOverrides(frame),
    [rasterPixelCoordinate, () => pixel],
    [rasterScreenPosition, () => pixelCenter],
    [rasterScreenUV, () => pixelCenter.div(frame.viewport.xy)],
    [rasterAccumulatedDepth, () => weightedViewDepth],
    [rasterAccumulatedAlpha, () => gaussianAlpha],
    [rasterOutputDepth, () => outputDepth],
    [rasterOutputValid, () => defaultValid],
  ]);
  const deviceDepth = frame.invalidDepthValue.toVar("rasterEncodedDepth");
  If(
    scalarValid.and(resolveNode(nodes.rasterOutputValidNode, overrides)),
    () => {
      const encoded = resolveNode(nodes.rasterOutputDepthNode, overrides).toVar(
        "rasterEncodedDepthValue",
      );
      If(finite(encoded), () => {
        deviceDepth.assign(encoded);
      });
    },
  );
  return deviceDepth;
}

function resolveNode(
  node: GaussianRasterNodeSlots["rasterOutputDepthNode"],
  overrides: OverrideMap,
): any {
  return resolveGaussianNode(node, overrides);
}
