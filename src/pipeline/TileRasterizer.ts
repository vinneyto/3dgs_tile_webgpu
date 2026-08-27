import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  StorageTexture,
  WebGPURenderer,
} from "three/webgpu";
import {
  Break,
  Continue,
  Fn,
  If,
  Loop,
  Return,
  bool,
  clamp,
  exp,
  float,
  invocationLocalIndex,
  min,
  storage,
  storageTexture,
  textureStore,
  uint,
  uvec2,
  vec2,
  vec3,
  vec4,
  viewZToPerspectiveDepth,
  workgroupId,
} from "three/tsl";
import { TILE_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import type { DepthSortMode } from "./types";

export class TileRasterizer {
  private readonly computeNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    gaussianCount: number,
    intersectionCapacity: number,
    mode: DepthSortMode,
    projectedMeanAttribute: StorageBufferAttribute,
    projectedConicAttribute: StorageBufferAttribute,
    projectedColorAttribute: StorageBufferAttribute,
    sortedRecordsAttribute: StorageBufferAttribute,
    tileOffsetsAttribute: StorageBufferAttribute,
    colorTexture: StorageTexture,
    depthTexture: StorageTexture | null,
    frame: FrameUniforms,
  ) {
    const projectedMean = storage(
      projectedMeanAttribute,
      "vec4",
      gaussianCount,
    ).toReadOnly();
    const projectedConic = storage(
      projectedConicAttribute,
      "vec4",
      gaussianCount,
    ).toReadOnly();
    const projectedColor = storage(
      projectedColorAttribute,
      "vec4",
      gaussianCount,
    ).toReadOnly();
    const floatRecords =
      mode === "float32"
        ? storage(
            sortedRecordsAttribute,
            "uvec4",
            intersectionCapacity,
          ).toReadOnly()
        : null;
    const packedRecords =
      mode === "packed16"
        ? storage(
            sortedRecordsAttribute,
            "uvec2",
            intersectionCapacity,
          ).toReadOnly()
        : null;
    const gaussianAt = (index: Node<"uint">) =>
      mode === "float32"
        ? floatRecords!.element(index).z
        : packedRecords!.element(index).y;
    const tileOffsets = storage(
      tileOffsetsAttribute,
      "uint",
      tileOffsetsAttribute.count,
    ).toReadOnly();
    const colorOutput = storageTexture(colorTexture);
    const depthOutput =
      depthTexture === null ? null : storageTexture(depthTexture);

    const rasterizeKernel = Fn(() => {
      const localX = invocationLocalIndex.mod(TILE_SIZE).toVar();
      const localY = invocationLocalIndex.div(TILE_SIZE).toVar();
      const pixel = uvec2(
        workgroupId.x.mul(TILE_SIZE).add(localX),
        workgroupId.y.mul(TILE_SIZE).add(localY),
      ).toVar();
      If(
        pixel.x
          .greaterThanEqual(uint(frame.viewport.x))
          .or(pixel.y.greaterThanEqual(uint(frame.viewport.y))),
        () => Return(),
      );
      const tile = workgroupId.y.mul(frame.tilesX).add(workgroupId.x).toVar();
      const begin = tileOffsets.element(tile).toVar();
      const end = tileOffsets.element(tile.add(1)).toVar();
      const pixelCenter = vec2(pixel).add(0.5).toVar();
      const accumulated = vec3(0).toVar();
      const transmittance = float(1).toVar();
      const depth = float(1).toVar();
      const depthWritten = bool(false).toVar();

      Loop(
        {
          start: begin,
          end,
          type: "uint",
          condition: "<",
        },
        ({ i: intersection }) => {
          const gaussianId = gaussianAt(intersection).toVar();
          const mean = projectedMean.element(gaussianId).toVar();
          const delta = pixelCenter.sub(mean.xy).toVar();
          const conic = projectedConic.element(gaussianId).xyz.toVar();
          const power = conic.x
            .mul(delta.x)
            .mul(delta.x)
            .add(conic.y.mul(delta.x).mul(delta.y).mul(2))
            .add(conic.z.mul(delta.y).mul(delta.y))
            .mul(-0.5)
            .toVar();
          If(power.greaterThan(0), () => Continue());
          const alpha = min(0.99, mean.w.mul(exp(power))).toVar();
          If(alpha.lessThan(1 / 255), () => Continue());
          If(depthWritten.not(), () => {
            depth.assign(
              clamp(
                viewZToPerspectiveDepth(
                  mean.z.negate(),
                  frame.viewport.z,
                  frame.viewport.w,
                ),
                0,
                1,
              ),
            );
            depthWritten.assign(bool(true));
          });
          accumulated.addAssign(
            projectedColor
              .element(gaussianId)
              .xyz.mul(transmittance)
              .mul(alpha),
          );
          transmittance.mulAssign(float(1).sub(alpha));
          If(transmittance.lessThan(1e-4), () => Break());
        },
      );

      const backgroundAlpha = clamp(frame.background[3] ?? 0, 0, 1);
      accumulated.addAssign(
        vec3(
          frame.background[0] ?? 0,
          frame.background[1] ?? 0,
          frame.background[2] ?? 0,
        )
          .mul(transmittance)
          .mul(backgroundAlpha),
      );
      const alpha = float(1)
        .sub(transmittance.mul(float(1).sub(backgroundAlpha)))
        .toVar();
      textureStore(colorOutput, pixel, vec4(accumulated, alpha)).toWriteOnly();
      if (depthOutput !== null) {
        textureStore(depthOutput, pixel, vec4(depth, 0, 0, 1)).toWriteOnly();
      }
    });
    this.computeNode = rasterizeKernel()
      .computeKernel([TILE_SIZE, TILE_SIZE])
      .setName("3DGS tile rasterizer");
  }

  encode(tilesX: number, tilesY: number): void {
    this.renderer.compute(this.computeNode, [tilesX, tilesY, 1]);
  }

  dispose(): void {
    this.computeNode.dispose();
  }
}
