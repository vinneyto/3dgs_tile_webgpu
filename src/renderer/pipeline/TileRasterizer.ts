import { StorageBindings } from "./StorageBindings";
import type {
  ComputeNode,
  IndirectStorageBufferAttribute,
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
  atomicAdd,
  atomicStore,
  clamp,
  exp,
  float,
  floor,
  instanceIndex,
  invocationLocalIndex,
  ivec2,
  max,
  select,
  sqrt,
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
  countRasterChunksWGSL,
  emitRasterChunkTasksWGSL,
  prepareRasterChunkDispatchWGSL,
} from "../kernels/rasterChunks";
import {
  compactMortonBitsWGSL,
  workgroupUniformLoadWGSL,
} from "../kernels/rasterHelpers";
import {
  rasterBreakContextNodes,
  rasterOutputContextNodes,
  rasterContextNodes,
  rasterGaussianCenter,
  rasterGaussianColor,
  rasterGaussianCoord,
  rasterGaussianIndex,
  rasterGaussianOpacity,
  rasterObjectId,
  rasterPixelCoordinate,
  rasterPixelDelta,
  rasterPixelValue,
  rasterPower,
  rasterScreenPosition,
  rasterScreenUV,
  rasterUV,
  rasterViewDepth,
  rasterWeight,
  rasterPixelContextNodes,
  validateGaussianNodeAccess,
  validateGaussianNodeDomain,
  resolveGaussianNode,
  type GaussianRasterNodeSlots,
} from "../nodes/GaussianContextNodes";
import { AttributePool } from "./AttributePool";
import { RasterChunkWorkspace } from "./RasterChunkWorkspace";
import { ExclusiveScanStage } from "./ExclusiveScanStage";
import { TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import { decodeActiveSlot } from "./activeSlots";
import { boundaryDeltaWGSL } from "../kernels/tileContribution";
import { finalizeGaussianDepth } from "./finalizeGaussianDepth";
import { passContextOverrides } from "./FrameUniforms";
import type { FrameUniforms } from "./FrameUniforms";
import type { DepthSortMode } from "./types";

type OverrideMap = Map<any, () => any>;
type RasterTarget = "direct" | "chunk";

interface ChunkSchedule {
  counts: StorageBufferAttribute;
  offsets: ExclusiveScanStage;
  tasks: StorageBufferAttribute;
  dispatch: IndirectStorageBufferAttribute;
  partialData: StorageBufferAttribute;
  partialStride: number;
  countNode: ComputeNode;
  prepareNode: ComputeNode;
  emitNode: ComputeNode;
}

/**
 * Rasterizes normal tiles directly and splits only overflowing tiles into
 * independent depth-ordered chunks. Chunk colors and transmittances are
 * composited in order, so no Gaussian is dropped or cut at a tile boundary.
 */
export class TileRasterizer {
  private readonly attributes = new AttributePool();
  private readonly chunks: ChunkSchedule | null;
  private readonly chunkWorkspace: RasterChunkWorkspace | null;
  private readonly ownsChunkWorkspace: boolean;
  private computeNode: ComputeNode | null = null;
  private chunkComputeNode: ComputeNode | null = null;
  private compositeNode: ComputeNode | null = null;
  private metrics: StorageBufferAttribute | null;
  private readonly clearMetrics: ComputeNode | null;

  constructor(
    private readonly renderer: WebGPURenderer,
    private gaussianCount: number,
    private intersectionCapacity: number,
    private readonly mode: DepthSortMode,
    private meansAttribute: StorageBufferAttribute,
    private projectedMeanAttribute: StorageBufferAttribute,
    private projectedConicAttribute: StorageBufferAttribute,
    private projectedColorAttribute: StorageBufferAttribute,
    private sortedRecordsAttribute: StorageBufferAttribute,
    private tileOffsetsAttribute: StorageBufferAttribute,
    private readonly colorTexture: StorageTexture,
    private readonly depthTexture: StorageTexture | null,
    private readonly frame: FrameUniforms,
    private readonly maxSplatsPerTile: number | null,
    private readonly rasterChunkSize: number | null,
    private tileCapacity: number,
    nodes: GaussianRasterNodeSlots,
    rasterStats = false,
    private readonly transmittanceThreshold = 1e-4,
    private readonly depthAlphaThreshold = 0.95,
    chunkWorkspace?: RasterChunkWorkspace,
    private readonly completeDispatch?: IndirectStorageBufferAttribute,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.metrics = rasterStats
      ? this.attributes.createUint("3dgs.raster-work", tileCapacity * 4)
      : null;
    const counters =
      this.metrics === null
        ? null
        : this.attributes
            .storage(this.metrics, "uint", tileCapacity * 4)
            .toAtomic();
    this.clearMetrics =
      counters === null
        ? null
        : Fn(() => {
            If(instanceIndex.lessThan(this.frame.tileCount.mul(4)), () => {
              atomicStore(counters.element(instanceIndex), uint(0));
            });
          })()
            .compute(tileCapacity * 4)
            .setName("3DGS clear raster work metrics");
    this.chunkWorkspace =
      rasterChunkSize === null
        ? null
        : (chunkWorkspace ??
          new RasterChunkWorkspace(
            intersectionCapacity,
            rasterChunkSize,
            depthTexture !== null,
            bindings,
          ));
    this.ownsChunkWorkspace =
      this.chunkWorkspace !== null && chunkWorkspace === undefined;
    this.chunks = this.createChunkSchedule();
    this.rebuild(nodes);
  }

  resize(
    gaussians: number,
    intersections: number,
    tiles: number,
    means: StorageBufferAttribute,
    projectedMean: StorageBufferAttribute,
    projectedConic: StorageBufferAttribute,
    projectedColor: StorageBufferAttribute,
    offsets: StorageBufferAttribute,
  ): void {
    this.gaussianCount = gaussians;
    this.intersectionCapacity = intersections;
    this.tileCapacity = Math.max(this.tileCapacity, tiles);
    this.meansAttribute = means;
    this.projectedMeanAttribute = projectedMean;
    this.projectedConicAttribute = projectedConic;
    this.projectedColorAttribute = projectedColor;
    this.tileOffsetsAttribute = offsets;
    if (this.metrics)
      this.metrics = this.attributes.grow(this.metrics, this.tileCapacity * 4);
    if (this.clearMetrics) this.clearMetrics.count = this.tileCapacity * 4;
    if (this.chunks) {
      this.chunks.counts = this.attributes.grow(
        this.chunks.counts,
        this.tileCapacity,
      );
      this.chunks.offsets.resize(this.tileCapacity);
      this.chunks.countNode.count = this.tileCapacity;
      this.chunks.emitNode.count = this.tileCapacity;
      this.chunks.tasks = this.chunkWorkspace!.tasks;
      this.chunks.partialData = this.chunkWorkspace!.partialData;
    }
  }

  setSortedRecords(next: StorageBufferAttribute): void {
    this.attributes.rebind(this.sortedRecordsAttribute, next);
    this.sortedRecordsAttribute = next;
  }

  getComputeNodes(): ComputeNode[] {
    return [
      this.clearMetrics,
      this.computeNode,
      this.chunkComputeNode,
      this.compositeNode,
      ...(this.chunks
        ? [
            this.chunks.countNode,
            this.chunks.prepareNode,
            this.chunks.emitNode,
            ...this.chunks.offsets.getComputeNodes(),
          ]
        : []),
    ].filter((node): node is ComputeNode => node !== null);
  }

  rebuild(nodes: GaussianRasterNodeSlots): void {
    for (const node of [
      nodes.rasterPixelValueNode,
      nodes.rasterBreakNode,
      nodes.rasterColorNode,
      nodes.rasterAlphaNode,
      nodes.rasterDiscardNode,
    ]) {
      validateGaussianNodeDomain(node, rasterContextNodes, "raster");
    }
    validateGaussianNodeAccess(
      nodes.rasterPixelValueNode,
      rasterPixelContextNodes,
      "rasterPixelValueNode",
    );
    validateGaussianNodeAccess(
      nodes.rasterBreakNode,
      rasterBreakContextNodes,
      "rasterBreakNode",
    );
    validateGaussianNodeAccess(
      nodes.rasterOutputDepthNode,
      rasterOutputContextNodes,
      "rasterOutputDepthNode",
    );
    validateGaussianNodeAccess(
      nodes.rasterOutputValidNode,
      rasterOutputContextNodes,
      "rasterOutputValidNode",
    );
    const nextDirect = this.createRasterNode(nodes, "direct");
    const nextChunk =
      this.chunks === null ? null : this.createRasterNode(nodes, "chunk");
    const nextComposite =
      this.chunks === null ? null : this.createCompositeNode(nodes);
    this.computeNode?.dispose();
    this.chunkComputeNode?.dispose();
    this.compositeNode?.dispose();
    this.computeNode = nextDirect;
    this.chunkComputeNode = nextChunk;
    this.compositeNode = nextComposite;
  }

  encode(tilesX: number, tilesY: number): void {
    const tileCount = tilesX * tilesY;
    if (this.clearMetrics !== null)
      this.renderer.compute(this.clearMetrics, [
        Math.ceil((tileCount * 4) / WORKGROUP_SIZE),
        1,
        1,
      ]);
    if (this.computeNode === null) {
      throw new Error("TileRasterizer has no compute node");
    }
    if (this.chunks === null) {
      this.renderer.compute(
        this.computeNode,
        this.completeDispatch ?? [tilesX, tilesY, 1],
      );
      return;
    }
    if (this.chunkComputeNode === null || this.compositeNode === null) {
      throw new Error("TileRasterizer has no chunk compute nodes");
    }

    const groups = Math.ceil(tileCount / WORKGROUP_SIZE);
    this.renderer.compute(this.chunks.countNode, [groups, 1, 1]);
    this.chunks.offsets.encode(this.renderer);
    this.renderer.compute(this.chunks.prepareNode);
    this.renderer.compute(this.chunks.emitNode, [groups, 1, 1]);
    this.renderer.compute(
      this.computeNode,
      this.completeDispatch ?? [tilesX, tilesY, 1],
    );
    this.renderer.compute(this.chunkComputeNode, this.chunks.dispatch);
    this.renderer.compute(
      this.compositeNode,
      this.completeDispatch ?? [tilesX, tilesY, 1],
    );
  }

  dispose(): void {
    this.clearMetrics?.dispose();
    this.computeNode?.dispose();
    this.computeNode = null;
    this.chunkComputeNode?.dispose();
    this.chunkComputeNode = null;
    this.compositeNode?.dispose();
    this.compositeNode = null;
    this.chunks?.countNode.dispose();
    this.chunks?.prepareNode.dispose();
    this.chunks?.emitNode.dispose();
    this.chunks?.offsets.dispose();
    this.attributes.dispose();
    if (this.ownsChunkWorkspace) this.chunkWorkspace?.dispose();
  }

  private createChunkSchedule(): ChunkSchedule | null {
    if (this.rasterChunkSize === null) return null;

    const { taskCapacity, tasks, dispatch, partialData, partialStride } =
      this.chunkWorkspace!;
    const counts = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCapacity,
    );
    const offsets = new ExclusiveScanStage(
      counts,
      this.tileCapacity,
      "raster-chunks",
      "uint",
      () => Number(this.frame.tileCount.value),
      this.attributes.bindings,
    );
    const tileOffsets = this.attributes
      .storage(
        this.tileOffsetsAttribute,
        "uint",
        this.tileOffsetsAttribute.count,
      )
      .toReadOnly();
    const chunkCounts = this.attributes.storage(
      counts,
      "uint",
      this.tileCapacity,
    );
    const readonlyChunkCounts = this.attributes
      .storage(counts, "uint", this.tileCapacity)
      .toReadOnly();
    const chunkOffsets = this.attributes
      .storage(offsets.output, "uint", this.tileCapacity)
      .toReadOnly();
    const countKernel = wgslFn<Record<string, Node>>(countRasterChunksWGSL);
    const countNode = countKernel({
      tile: instanceIndex,
      tile_count: this.frame.tileCount,
      chunk_size: uint(this.rasterChunkSize),
      sample_limit: uint(this.maxSplatsPerTile ?? 0),
      tile_offsets: tileOffsets,
      chunk_counts: chunkCounts,
    })
      .compute(this.tileCapacity, [WORKGROUP_SIZE])
      .setName("3DGS count exact raster chunks WGSL");
    const prepareKernel = wgslFn<Record<string, Node>>(
      prepareRasterChunkDispatchWGSL,
    );
    const prepareNode = prepareKernel({
      tile_count: this.frame.tileCount,
      task_capacity: this.chunkWorkspace!.taskCapacityNode,
      chunk_counts: readonlyChunkCounts,
      chunk_offsets: chunkOffsets,
      dispatch: this.attributes.storage(dispatch, "uvec4", 1),
    })
      .compute(1)
      .setName("3DGS prepare exact raster chunk dispatch WGSL");
    const emitKernel = wgslFn<Record<string, Node>>(emitRasterChunkTasksWGSL);
    const emitNode = emitKernel({
      tile: instanceIndex,
      tile_count: this.frame.tileCount,
      task_capacity: this.chunkWorkspace!.taskCapacityNode,
      chunk_counts: readonlyChunkCounts,
      chunk_offsets: chunkOffsets,
      tasks: this.attributes.storage(tasks, "uvec2", taskCapacity),
    })
      .compute(this.tileCapacity, [WORKGROUP_SIZE])
      .setName("3DGS emit exact raster chunk tasks WGSL");

    return {
      counts,
      offsets,
      tasks,
      dispatch,
      partialData,
      partialStride,
      countNode,
      prepareNode,
      emitNode,
    };
  }

  private createRasterNode(
    nodes: GaussianRasterNodeSlots,
    target: RasterTarget,
  ): ComputeNode {
    const counters =
      this.metrics === null
        ? null
        : this.attributes
            .storage(this.metrics, "uint", this.tileCapacity * 4)
            .toAtomic();
    const means = this.attributes
      .storage(this.meansAttribute, "vec4", this.gaussianCount)
      .toReadOnly();
    const projectedMean = this.attributes
      .storage(
        this.projectedMeanAttribute,
        "vec4",
        this.projectedMeanAttribute.count,
      )
      .toReadOnly();
    const projectedConic = this.attributes
      .storage(this.projectedConicAttribute, "vec4", this.gaussianCount)
      .toReadOnly();
    const projectedColor = this.attributes
      .storage(this.projectedColorAttribute, "vec4", this.gaussianCount)
      .toReadOnly();
    const records = this.attributes
      .storage(this.sortedRecordsAttribute, "uvec2", this.intersectionCapacity)
      .toReadOnly();
    const tileOffsets = this.attributes
      .storage(
        this.tileOffsetsAttribute,
        "uint",
        this.tileOffsetsAttribute.count,
      )
      .toReadOnly();
    const sharedMean: any = workgroupArray("vec4", WORKGROUP_SIZE);
    const sharedConic: any = workgroupArray("vec4", WORKGROUP_SIZE);
    const sharedColor: any = workgroupArray("vec4", WORKGROUP_SIZE);
    const sharedActive: any = workgroupArray("uint", WORKGROUP_SIZE);
    // Keep reduction outputs separate from flags still read by other lanes.
    const sharedActiveSums: any = workgroupArray("uint", 8);
    const colorOutput =
      target === "direct" ? storageTexture(this.colorTexture) : null;
    const compactMorton = wgslFn<any>(compactMortonBitsWGSL);
    const uniformLoad = wgslFn<any>(workgroupUniformLoadWGSL);
    const chunks = this.chunks;
    const chunkTasks =
      target === "chunk" && chunks !== null
        ? this.attributes
            .storage(chunks.tasks, "uvec2", chunks.tasks.count)
            .toReadOnly()
        : null;
    const partialData =
      target === "chunk" && chunks !== null
        ? this.attributes.storage(
            chunks.partialData,
            "vec4",
            chunks.partialData.count,
          )
        : null;
    const { frame } = this;

    const kernel = Fn(() => {
      const localIndex = uint(invocationLocalIndex);
      const localX = compactMorton({ value: localIndex }) as any;
      const localY = compactMorton({ value: localIndex.shiftRight(1) }) as any;
      const taskIndex = uint(workgroupId.x);
      const tile = (
        target === "direct"
          ? workgroupId.y.mul(frame.tilesX).add(workgroupId.x)
          : chunkTasks!.element(taskIndex).x
      ).toVar("rasterTile");
      const chunkIndex =
        target === "chunk" ? chunkTasks!.element(taskIndex).y : uint(0);
      const tileX =
        target === "direct" ? workgroupId.x : tile.mod(frame.tilesX);
      const tileY =
        target === "direct" ? workgroupId.y : tile.div(frame.tilesX);
      const pixel = uvec2(
        tileX.mul(uint(TILE_SIZE)).add(localX),
        tileY.mul(uint(TILE_SIZE)).add(localY),
      ).toVar("rasterPixelCoordinateValue");
      const activePixel = pixel.x
        .lessThan(uint(frame.viewport.x))
        .and(pixel.y.lessThan(uint(frame.viewport.y)))
        .toVar("rasterActivePixel");
      const begin = tileOffsets.element(tile);
      const sourceEnd = tileOffsets.element(tile.add(1));
      const sourceCount = uint(sourceEnd.sub(begin));
      const rasterCount = sourceCount.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const cap = uint(this.maxSplatsPerTile);
        rasterCount.assign(select(sourceCount.lessThan(cap), sourceCount, cap));
      }
      let sampleStart: any = uint(0);
      const sampleEnd = rasterCount.toVar("rasterSampleEnd");
      if (target === "direct" && this.rasterChunkSize !== null) {
        sampleEnd.assign(
          select(
            rasterCount.greaterThan(uint(this.rasterChunkSize)),
            uint(0),
            rasterCount,
          ),
        );
      } else if (target === "chunk") {
        sampleStart = chunkIndex
          .mul(uint(this.rasterChunkSize!))
          .toVar("rasterSampleStart");
        const chunkEnd = sampleStart.add(uint(this.rasterChunkSize!));
        sampleEnd.assign(
          select(chunkEnd.lessThan(rasterCount), chunkEnd, rasterCount),
        );
      }
      const pixelCenter = vec2(pixel).add(0.5);
      const pixelOverrides: OverrideMap = new Map<any, () => any>([
        ...passContextOverrides(frame),
        [rasterPixelCoordinate, () => pixel],
        [rasterScreenPosition, () => pixelCenter],
        [rasterScreenUV, () => pixelCenter.div(frame.viewport.xy)],
      ]);
      const pixelValue = float(0).toVar("rasterPixelValue");
      If(activePixel, () => {
        pixelValue.assign(
          resolveNode(nodes.rasterPixelValueNode, pixelOverrides),
        );
      });
      const accumulated = vec3(0).toVar("accumulated");
      const transmittance = float(1).toVar("transmittance");
      const weightedViewDepth = float(0).toVar("weightedViewDepth");
      const done = bool(false).toVar("done");
      const checked = counters === null ? null : uint(0).toVar("rasterChecked");
      const blended = counters === null ? null : uint(0).toVar("rasterBlended");
      Loop(
        {
          start: sampleStart,
          end: sampleEnd,
          type: "uint",
          condition: "<",
          update: `+= ${WORKGROUP_SIZE}`,
        },
        ({ i: batchStart }) => {
          const sampleIndex = batchStart.add(localIndex);
          If(sampleIndex.lessThan(sampleEnd), () => {
            let sourceIndex: any = sampleIndex;
            if (this.maxSplatsPerTile !== null) {
              // Preserve the legacy lossy cap as an opt-in experiment. Exact
              // chunking operates on this monotonically sampled list, while
              // the default uncapped path visits every source intersection.
              sourceIndex = uint(
                floor(
                  float(sampleIndex)
                    .add(0.5)
                    .mul(float(sourceCount))
                    .div(float(rasterCount)),
                ),
              );
            }
            const loadIndex = begin
              .add(sourceIndex)
              .toVar("rasterSourceRecordIndex");
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
          });
          If(localIndex.equal(0), () => {
            sharedActive
              .element(uint(0))
              .assign(
                select(
                  batchStart.add(uint(WORKGROUP_SIZE)).lessThan(sampleEnd),
                  uint(1),
                  uint(0),
                ),
              );
          });
          // workgroupUniformLoad is both the lane-0 read and the synchronization
          // point that makes the shared Gaussian batch visible to every lane.
          const hasNextBatch = (
            uniformLoad({ values: sharedActive }) as any
          ).toVar("hasNextBatch");
          const remaining = uint(sampleEnd.sub(batchStart) as any);
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
                checked?.addAssign(1);
                const mean = sharedMean.element(batchIndex);
                const sourceSlot = (
                  decodeActiveSlot({
                    value: sharedColor.element(batchIndex).w,
                  }) as any
                ).toVar("rasterSourceSlot");
                const delta = vec2(
                  wgslFn<any>(boundaryDeltaWGSL)({
                    pixel: pixelCenter,
                    center: mean.xy,
                    conic: sharedConic.element(batchIndex).xyz,
                    viewport: frame.viewport.xy,
                    boundary_axis: frame.boundaryAxis,
                  }) as any,
                ).toVar("rasterBoundaryDelta");
                const earlyOverrides: OverrideMap = new Map(pixelOverrides);
                earlyOverrides.set(rasterPixelValue, () => pixelValue);
                earlyOverrides.set(rasterGaussianIndex, () => sourceSlot);
                earlyOverrides.set(rasterObjectId, () =>
                  uint(means.element(sourceSlot).w),
                );
                earlyOverrides.set(rasterGaussianCenter, () => mean.xy);
                earlyOverrides.set(rasterPixelDelta, () => delta);
                earlyOverrides.set(rasterViewDepth, () => mean.z);
                const shouldBreak = resolveNode(
                  nodes.rasterBreakNode,
                  earlyOverrides,
                );
                If(shouldBreak, () => {
                  done.assign(bool(true));
                  Break();
                });
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
                  () => {
                    Continue();
                  },
                );
                const l00 = sqrt(max(conic.x, 1e-12));
                const l10 = conic.y.div(l00);
                const l11 = sqrt(max(conic.z.sub(l10.mul(l10)), 1e-12));
                const gaussianCoord = vec2(
                  l00.mul(delta.x).add(l10.mul(delta.y)),
                  l11.mul(delta.y),
                );
                const overrides: OverrideMap = new Map<any, () => any>([
                  ...earlyOverrides,
                  [rasterGaussianCoord, () => gaussianCoord],
                  [rasterUV, () => gaussianCoord.div(6).add(0.5)],
                  [
                    rasterGaussianColor,
                    () => sharedColor.element(batchIndex).xyz,
                  ],
                  [rasterGaussianOpacity, () => mean.w],
                  [rasterPower, () => power],
                  [rasterWeight, () => exp(power)],
                ]);
                const discard = resolveNode(nodes.rasterDiscardNode, overrides);
                If(discard, () => {
                  Continue();
                });
                const alpha = clamp(
                  resolveNode(nodes.rasterAlphaNode, overrides),
                  0,
                  0.99,
                );
                If(alpha.lessThan(float(1 / 255)), () => {
                  Continue();
                });
                const color = resolveNode(nodes.rasterColorNode, overrides);
                const contribution = transmittance
                  .mul(alpha)
                  .toVar("rasterContribution");
                accumulated.addAssign(color.mul(contribution));
                weightedViewDepth.addAssign(mean.z.mul(contribution));
                blended?.addAssign(1);
                transmittance.mulAssign(float(1).sub(alpha));
                If(transmittance.lessThan(this.transmittanceThreshold), () => {
                  done.assign(bool(true));
                  Break();
                });
              },
            );
          });
          If(hasNextBatch.equal(0), () => {
            Break();
          });
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
            sharedActiveSums.element(localIndex).assign(subgroupActive);
          });
          workgroupBarrier();
          If(localIndex.equal(0), () => {
            const tileActive = uint(0).toVar("tileActiveReduction");
            Loop(
              { start: uint(0), end: uint(8), type: "uint", condition: "<" },
              ({ i }) => {
                tileActive.bitOrAssign(sharedActiveSums.element(uint(i)));
              },
            );
            sharedActive.element(uint(0)).assign(tileActive);
          });
          const tileActive = uniformLoad({ values: sharedActive }) as any;
          If(tileActive.equal(0), () => {
            Break();
          });
        },
      );

      If(activePixel, () => {
        if (counters !== null) {
          const base = tile.mul(4);
          atomicAdd(counters.element(base), checked!);
          atomicAdd(counters.element(base.add(1)), blended!);
          if (target === "direct") {
            // Chunked tiles are counted by the composite, not this bypass path.
            If(sourceCount.greaterThan(0).and(sampleEnd.greaterThan(0)), () => {
              atomicAdd(counters.element(base.add(2)), uint(1));
              atomicAdd(
                counters.element(base.add(3)),
                select(
                  transmittance.lessThan(this.transmittanceThreshold),
                  uint(1),
                  uint(0),
                ),
              );
            });
          }
        }
        if (target === "direct") {
          storeFinalPixel(
            accumulated,
            transmittance,
            weightedViewDepth,
            pixel,
            colorOutput!,
            this.depthTexture,
            frame,
            this.depthAlphaThreshold,
            nodes,
          );
        } else {
          const partialIndex = taskIndex
            .mul(uint(WORKGROUP_SIZE))
            .add(localIndex)
            .mul(uint(chunks!.partialStride));
          partialData!
            .element(partialIndex)
            .assign(vec4(accumulated, transmittance));
          if (this.depthTexture !== null) {
            partialData!
              .element(partialIndex.add(1))
              .assign(vec4(weightedViewDepth, 0, 0, 0));
          }
        }
      });
    });

    return kernel()
      .computeKernel([TILE_SIZE, TILE_SIZE])
      .setName(
        target === "direct"
          ? `3DGS direct tile rasterizer TSL (${this.mode})`
          : `3DGS exact chunk rasterizer TSL (${this.mode})`,
      );
  }

  private createCompositeNode(nodes: GaussianRasterNodeSlots): ComputeNode {
    const counters =
      this.metrics === null
        ? null
        : this.attributes
            .storage(this.metrics, "uint", this.tileCapacity * 4)
            .toAtomic();
    const chunks = this.chunks!;
    const chunkCounts = this.attributes
      .storage(chunks.counts, "uint", this.tileCapacity)
      .toReadOnly();
    const chunkOffsets = this.attributes
      .storage(chunks.offsets.output, "uint", this.tileCapacity)
      .toReadOnly();
    const partialData = this.attributes
      .storage(chunks.partialData, "vec4", chunks.partialData.count)
      .toReadOnly();
    const colorOutput = storageTexture(this.colorTexture);
    const compactMorton = wgslFn<any>(compactMortonBitsWGSL);
    const { frame } = this;

    const kernel = Fn(() => {
      const localIndex = uint(invocationLocalIndex);
      const localX = compactMorton({ value: localIndex }) as any;
      const localY = compactMorton({ value: localIndex.shiftRight(1) }) as any;
      const tile = workgroupId.y.mul(frame.tilesX).add(workgroupId.x);
      const chunkCount = chunkCounts.element(tile);
      const pixel = uvec2(
        workgroupId.x.mul(uint(TILE_SIZE)).add(localX),
        workgroupId.y.mul(uint(TILE_SIZE)).add(localY),
      );
      const activePixel = pixel.x
        .lessThan(uint(frame.viewport.x))
        .and(pixel.y.lessThan(uint(frame.viewport.y)));
      If(activePixel.and(chunkCount.greaterThan(0)), () => {
        const accumulated = vec3(0).toVar("chunkCompositeColor");
        const transmittance = float(1).toVar("chunkCompositeTransmittance");
        const weightedViewDepth = float(0).toVar(
          "chunkCompositeWeightedViewDepth",
        );
        const firstChunk = chunkOffsets.element(tile);
        Loop(
          {
            start: uint(0),
            end: chunkCount,
            type: "uint",
            condition: "<",
          },
          ({ i }) => {
            const partialIndex = firstChunk
              .add(i)
              .mul(uint(WORKGROUP_SIZE))
              .add(localIndex)
              .mul(uint(chunks.partialStride));
            const partial = partialData.element(partialIndex);
            accumulated.addAssign(partial.xyz.mul(transmittance));
            if (this.depthTexture !== null) {
              weightedViewDepth.addAssign(
                partialData.element(partialIndex.add(1)).x.mul(transmittance),
              );
            }
            transmittance.mulAssign(partial.w);
            If(transmittance.lessThan(this.transmittanceThreshold), () => {
              Break();
            });
          },
        );
        storeFinalPixel(
          accumulated,
          transmittance,
          weightedViewDepth,
          pixel,
          colorOutput,
          this.depthTexture,
          frame,
          this.depthAlphaThreshold,
          nodes,
        );
        if (counters !== null) {
          atomicAdd(counters.element(tile.mul(4).add(2)), uint(1));
          atomicAdd(
            counters.element(tile.mul(4).add(3)),
            select(
              transmittance.lessThan(this.transmittanceThreshold),
              uint(1),
              uint(0),
            ),
          );
        }
      });
    });

    return kernel()
      .computeKernel([TILE_SIZE, TILE_SIZE])
      .setName("3DGS exact raster chunk composite TSL");
  }

  async readWorkStats() {
    if (this.metrics === null) return null;
    // Capture the draw range before awaiting: a resize may happen during readback.
    const componentCount = Number(this.frame.tileCount.value) * 4;
    const values = new Uint32Array(
      await this.renderer.getArrayBufferAsync(
        this.metrics,
        null,
        0,
        componentCount * 4,
      ),
    );
    let checked = 0,
      blended = 0,
      pixels = 0,
      alphaStopped = 0;
    for (let i = 0; i < values.length; i += 4) {
      checked += values[i]!;
      blended += values[i + 1]!;
      pixels += values[i + 2]!;
      alphaStopped += values[i + 3]!;
    }
    return { checked, blended, pixels, alphaStopped };
  }
}

function storeFinalPixel(
  accumulated: any,
  transmittance: any,
  weightedViewDepth: any,
  pixel: any,
  colorOutput: any,
  depthTexture: StorageTexture | null,
  frame: FrameUniforms,
  depthAlphaThreshold: number,
  nodes: GaussianRasterNodeSlots,
): void {
  const backgroundAlpha = clamp(float(frame.background[3]), 0, 1);
  accumulated.addAssign(
    vec3(frame.background[0], frame.background[1], frame.background[2])
      .mul(transmittance)
      .mul(backgroundAlpha),
  );
  const alpha = float(1).sub(transmittance.mul(float(1).sub(backgroundAlpha)));
  textureStore(colorOutput, ivec2(pixel), vec4(accumulated, alpha));
  if (depthTexture !== null) {
    const deviceDepth = finalizeGaussianDepth(
      weightedViewDepth,
      transmittance,
      pixel,
      frame,
      depthAlphaThreshold,
      nodes,
    );
    textureStore(
      storageTexture(depthTexture),
      ivec2(pixel),
      vec4(deviceDepth, 0, 0, 1),
    );
  }
}

function resolveNode(node: Node, overrides: OverrideMap): any {
  return resolveGaussianNode(node, overrides);
}
