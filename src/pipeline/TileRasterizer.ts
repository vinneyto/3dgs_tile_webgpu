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
  bool,
  clamp,
  exp,
  float,
  invocationLocalIndex,
  ivec2,
  max,
  select,
  sqrt,
  storage,
  storageTexture,
  textureStore,
  uint,
  uvec2,
  vec2,
  vec3,
  vec4,
  wgslFn,
  workgroupArray,
  workgroupBarrier,
  workgroupId,
} from "three/tsl";
import {
  compactMortonBitsWGSL,
  workgroupUniformLoadWGSL,
} from "../kernels/rasterHelpers";
import {
  rasterContextNodes,
  rasterGaussianCenter,
  rasterGaussianColor,
  rasterGaussianCoord,
  rasterGaussianIndex,
  rasterGaussianOpacity,
  rasterObjectId,
  rasterPixelCoordinate,
  rasterPixelDelta,
  rasterPower,
  rasterScreenPosition,
  rasterScreenUV,
  rasterUV,
  rasterViewDepth,
  rasterWeight,
  validateGaussianNodeDomain,
  type GaussianRasterNodeSlots,
} from "../nodes/GaussianContextNodes";
import { TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import type { DepthSortMode } from "./types";

type OverrideMap = Map<any, () => any>;

export class TileRasterizer {
  private computeNode: ComputeNode | null = null;

  constructor(
    private readonly renderer: WebGPURenderer,
    private readonly gaussianCount: number,
    private readonly intersectionCapacity: number,
    private readonly mode: DepthSortMode,
    private readonly meansAttribute: StorageBufferAttribute,
    private readonly projectedMeanAttribute: StorageBufferAttribute,
    private readonly projectedConicAttribute: StorageBufferAttribute,
    private readonly projectedColorAttribute: StorageBufferAttribute,
    private readonly sortedRecordsAttribute: StorageBufferAttribute,
    private readonly tileOffsetsAttribute: StorageBufferAttribute,
    private readonly colorTexture: StorageTexture,
    private readonly depthTexture: StorageTexture | null,
    private readonly frame: FrameUniforms,
    nodes: GaussianRasterNodeSlots,
  ) {
    this.rebuild(nodes);
  }

  rebuild(nodes: GaussianRasterNodeSlots): void {
    for (const node of [
      nodes.rasterColorNode,
      nodes.rasterAlphaNode,
      nodes.rasterDiscardNode,
    ]) {
      validateGaussianNodeDomain(node, rasterContextNodes, "raster");
    }
    const next = this.createComputeNode(nodes);
    this.computeNode?.dispose();
    this.computeNode = next;
  }

  encode(tilesX: number, tilesY: number): void {
    if (this.computeNode === null) {
      throw new Error("TileRasterizer has no compute node");
    }
    this.renderer.compute(this.computeNode, [tilesX, tilesY, 1]);
  }

  dispose(): void {
    this.computeNode?.dispose();
    this.computeNode = null;
  }

  private createComputeNode(nodes: GaussianRasterNodeSlots): ComputeNode {
    const means = storage(
      this.meansAttribute,
      "vec4",
      this.gaussianCount,
    ).toReadOnly();
    const projectedMean = storage(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount,
    ).toReadOnly();
    const projectedConic = storage(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount,
    ).toReadOnly();
    const projectedColor = storage(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount,
    ).toReadOnly();
    const records = storage(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity,
    ).toReadOnly();
    const tileOffsets = storage(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count,
    ).toReadOnly();
    const sharedMean: any = workgroupArray("vec4", WORKGROUP_SIZE);
    const sharedConic: any = workgroupArray("vec4", WORKGROUP_SIZE);
    const sharedColor: any = workgroupArray("vec4", WORKGROUP_SIZE);
    const sharedGaussianId: any = workgroupArray("uint", WORKGROUP_SIZE);
    const sharedActive: any = workgroupArray("uint", WORKGROUP_SIZE);
    const colorOutput = storageTexture(this.colorTexture);
    const compactMorton = wgslFn<any>(compactMortonBitsWGSL);
    const uniformLoad = wgslFn<any>(workgroupUniformLoadWGSL);
    const { frame } = this;

    const kernel = Fn(() => {
      const localIndex = uint(invocationLocalIndex);
      const localX = compactMorton({ value: localIndex }) as any;
      const localY = compactMorton({ value: localIndex.shiftRight(1) }) as any;
      const pixel = uvec2(
        workgroupId.x.mul(uint(TILE_SIZE)).add(localX),
        workgroupId.y.mul(uint(TILE_SIZE)).add(localY),
      );
      const activePixel = pixel.x
        .lessThan(uint(frame.viewport.x))
        .and(pixel.y.lessThan(uint(frame.viewport.y)));
      const tile = workgroupId.y.mul(frame.tilesX).add(workgroupId.x);
      const begin = tileOffsets.element(tile);
      const end = tileOffsets.element(tile.add(1));
      const pixelCenter = vec2(pixel).add(0.5);
      const accumulated = vec3(0).toVar("accumulated");
      const transmittance = float(1).toVar("transmittance");
      const depth = float(1).toVar("depth");
      const depthWritten = bool(false).toVar("depthWritten");
      const done = bool(false).toVar("done");
      Loop(
        {
          start: uint(begin),
          end,
          type: "uint",
          condition: "<",
          update: `+= ${WORKGROUP_SIZE}`,
        },
        ({ i: batchStart }) => {
          const loadIndex = batchStart.add(localIndex);
          If(loadIndex.lessThan(end), () => {
            const gaussianId = records.element(loadIndex).y;
            const mean = projectedMean.element(gaussianId);
            const conic = projectedConic.element(gaussianId);
            sharedMean.element(localIndex).assign(mean);
            sharedConic
              .element(localIndex)
              .assign(vec4(conic.xyz, mean.w.mul(255).log()));
            sharedColor
              .element(localIndex)
              .assign(projectedColor.element(gaussianId));
            sharedGaussianId.element(localIndex).assign(gaussianId);
          });
          If(localIndex.equal(0), () => {
            sharedActive
              .element(uint(0))
              .assign(
                select(
                  batchStart.add(uint(WORKGROUP_SIZE)).lessThan(end),
                  uint(1),
                  uint(0),
                ),
              );
          });
          const hasNextBatch = uniformLoad({ values: sharedActive }) as any;
          const remaining = uint(end.sub(batchStart) as any);
          const batchCount = select(
            remaining.lessThan(uint(WORKGROUP_SIZE)),
            remaining,
            uint(WORKGROUP_SIZE),
          );
          If(activePixel.and(done.not()), () => {
            Loop(
              {
                start: uint(0),
                end: batchCount,
                type: "uint",
                condition: "<",
              },
              ({ i: batchIndex }) => {
                const mean = sharedMean.element(batchIndex);
                const delta = pixelCenter.sub(mean.xy);
                const conicAndThreshold = sharedConic.element(batchIndex);
                const conic = conicAndThreshold.xyz;
                const power = conic.x
                  .mul(delta.x.mul(delta.x))
                  .add(conic.y.mul(2).mul(delta.x).mul(delta.y))
                  .add(conic.z.mul(delta.y.mul(delta.y)))
                  .mul(-0.5);
                If(
                  power
                    .greaterThan(0)
                    .or(power.lessThan(conicAndThreshold.w.negate())),
                  () => Continue(),
                );
                const gaussianId = sharedGaussianId.element(batchIndex);
                const l00 = sqrt(max(conic.x, 1e-12));
                const l10 = conic.y.div(l00);
                const l11 = sqrt(max(conic.z.sub(l10.mul(l10)), 1e-12));
                const gaussianCoord = vec2(
                  l00.mul(delta.x).add(l10.mul(delta.y)),
                  l11.mul(delta.y),
                );
                const overrides: OverrideMap = new Map<any, () => any>([
                  [rasterGaussianIndex, () => gaussianId],
                  [rasterObjectId, () => uint(means.element(gaussianId).w)],
                  [rasterPixelCoordinate, () => pixel],
                  [rasterScreenPosition, () => pixelCenter],
                  [rasterScreenUV, () => pixelCenter.div(frame.viewport.xy)],
                  [rasterGaussianCenter, () => mean.xy],
                  [rasterPixelDelta, () => delta],
                  [rasterGaussianCoord, () => gaussianCoord],
                  [rasterUV, () => gaussianCoord.div(6).add(0.5)],
                  [rasterViewDepth, () => mean.z],
                  [
                    rasterGaussianColor,
                    () => sharedColor.element(batchIndex).xyz,
                  ],
                  [rasterGaussianOpacity, () => mean.w],
                  [rasterPower, () => power],
                  [rasterWeight, () => exp(power)],
                ]);
                const discard = resolveNode(nodes.rasterDiscardNode, overrides);
                If(discard, () => Continue());
                const alpha = clamp(
                  resolveNode(nodes.rasterAlphaNode, overrides),
                  0,
                  0.99,
                );
                If(alpha.lessThan(float(1 / 255)), () => Continue());
                If(depthWritten.not(), () => {
                  const viewZ = mean.z.negate();
                  depth.assign(
                    clamp(
                      frame.viewport.z
                        .add(viewZ)
                        .mul(frame.viewport.w)
                        .div(frame.viewport.w.sub(frame.viewport.z).mul(viewZ)),
                      0,
                      1,
                    ),
                  );
                  depthWritten.assign(bool(true));
                });
                const color = resolveNode(nodes.rasterColorNode, overrides);
                accumulated.addAssign(color.mul(transmittance).mul(alpha));
                transmittance.mulAssign(float(1).sub(alpha));
                If(transmittance.lessThan(1e-4), () => {
                  done.assign(bool(true));
                  Break();
                });
              },
            );
          });
          If(hasNextBatch.equal(0), () => Break());
          sharedActive
            .element(localIndex)
            .assign(select(activePixel.and(done.not()), uint(1), uint(0)));
          workgroupBarrier();
          If(localIndex.lessThan(8), () => {
            const firstLane = localIndex.mul(32);
            const subgroupActive = uint(0).toVar("subgroupActive");
            Loop(
              { start: uint(0), end: uint(32), type: "uint", condition: "<" },
              ({ i }) => {
                subgroupActive.bitOrAssign(
                  sharedActive.element(firstLane.add(i)),
                );
              },
            );
            sharedActive.element(localIndex).assign(subgroupActive);
          });
          workgroupBarrier();
          If(localIndex.equal(0), () => {
            const tileActive = uint(0).toVar("tileActiveReduction");
            Loop(
              { start: uint(0), end: uint(8), type: "uint", condition: "<" },
              ({ i }) => {
                tileActive.bitOrAssign(sharedActive.element(uint(i)));
              },
            );
            sharedActive.element(uint(0)).assign(tileActive);
          });
          const tileActive = uniformLoad({ values: sharedActive }) as any;
          If(tileActive.equal(0), () => Break());
        },
      );

      If(activePixel, () => {
        const backgroundAlpha = clamp(float(frame.background[3]), 0, 1);
        accumulated.addAssign(
          vec3(frame.background[0], frame.background[1], frame.background[2])
            .mul(transmittance)
            .mul(backgroundAlpha),
        );
        const alpha = float(1).sub(
          transmittance.mul(float(1).sub(backgroundAlpha)),
        );
        textureStore(colorOutput, ivec2(pixel), vec4(accumulated, alpha));
        if (this.depthTexture !== null) {
          textureStore(
            storageTexture(this.depthTexture),
            ivec2(pixel),
            vec4(depth, 0, 0, 1),
          );
        }
      });
    });

    return kernel()
      .computeKernel([TILE_SIZE, TILE_SIZE])
      .setName(`3DGS tile rasterizer TSL (${this.mode})`);
  }
}

function resolveNode(node: Node, overrides: OverrideMap): any {
  return (node as any).context({ overrideNodes: overrides });
}
