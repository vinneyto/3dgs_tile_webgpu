import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  Continue,
  Fn,
  If,
  Loop,
  Return,
  clamp,
  floatBitsToUint,
  floor,
  instanceIndex,
  int,
  ivec2,
  round,
  select,
  shiftLeft,
  storage,
  uint,
  uvec2,
  uvec4,
} from "three/tsl";
import type { GaussianData } from "../GaussianData";
import { AttributePool } from "./AttributePool";
import { RADIX_BLOCK_ITEMS, TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import type {
  DepthSortMode,
  DispatchResources,
  GaussianPassStats,
  IntersectionBuffers,
} from "./types";

export class IntersectionStage {
  readonly dispatch: DispatchResources;
  readonly buffers: IntersectionBuffers;

  private readonly attributes = new AttributePool();
  private readonly prepareNode: ComputeNode;
  private readonly emitNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    data: GaussianData,
    mode: DepthSortMode,
    private readonly capacity: number,
    tileCountsAttribute: StorageBufferAttribute,
    intersectionOffsetsAttribute: StorageBufferAttribute,
    projectedMeanAttribute: StorageBufferAttribute,
    projectedConicAttribute: StorageBufferAttribute,
    frame: FrameUniforms,
  ) {
    this.dispatch = {
      state: this.attributes.createUint("3dgs.dispatch-state", 1, 4),
      radix: this.attributes.createIndirect("3dgs.radix-dispatch"),
      linear: this.attributes.createIndirect("3dgs.linear-dispatch"),
    };
    this.buffers = this.createIntersectionBuffers(mode);

    const tileCounts = storage(
      tileCountsAttribute,
      "uint",
      data.count,
    ).toReadOnly();
    const intersectionOffsets = storage(
      intersectionOffsetsAttribute,
      "uint",
      data.count,
    ).toReadOnly();
    const state = storage(this.dispatch.state, "uvec4", 1);
    const radixDispatch = storage(this.dispatch.radix, "uvec4", 1);
    const linearDispatch = storage(this.dispatch.linear, "uvec4", 1);
    const prepareKernel = Fn(() => {
      const last = uint(data.count - 1);
      const total = intersectionOffsets
        .element(last)
        .add(tileCounts.element(last))
        .toVar();
      const count = select(
        total.lessThan(uint(capacity)),
        total,
        uint(capacity),
      ).toVar();
      const radixBlocks = count
        .add(RADIX_BLOCK_ITEMS - 1)
        .div(RADIX_BLOCK_ITEMS)
        .toVar();
      radixDispatch
        .element(0)
        .assign(
          uvec4(
            radixBlocks.add(WORKGROUP_SIZE - 1).div(WORKGROUP_SIZE),
            uint(1),
            uint(1),
            uint(0),
          ),
        );
      linearDispatch
        .element(0)
        .assign(
          uvec4(
            count.add(WORKGROUP_SIZE - 1).div(WORKGROUP_SIZE),
            uint(1),
            uint(1),
            uint(0),
          ),
        );
      state
        .element(0)
        .assign(
          uvec4(
            count,
            total,
            radixBlocks,
            select(total.greaterThan(capacity), uint(1), uint(0)),
          ),
        );
    });
    this.prepareNode = prepareKernel()
      .compute(1)
      .setName("3DGS prepare indirect dispatch");

    const projectedMean = storage(
      projectedMeanAttribute,
      "vec4",
      data.count,
    ).toReadOnly();
    const projectedConic = storage(
      projectedConicAttribute,
      "vec4",
      data.count,
    ).toReadOnly();
    const floatRecords =
      this.buffers.kind === "float32"
        ? storage(this.buffers.recordsA, "uvec4", capacity)
        : null;
    const packedRecords =
      this.buffers.kind === "packed16"
        ? storage(this.buffers.recordsA, "uvec2", capacity)
        : null;

    const emitKernel = Fn(() => {
      const gid = instanceIndex;
      If(tileCounts.element(gid).equal(0), () => Return());
      const mean = projectedMean.element(gid).toVar();
      const radius = projectedConic.element(gid).w;
      const center = mean.xy;
      const maxTileX = int(frame.tilesX).sub(1).toVar();
      const maxTileY = int(frame.tilesY).sub(1).toVar();
      const clampTile = (
        value: ReturnType<typeof int>,
        maximum: typeof maxTileX,
      ) =>
        select(
          value.lessThan(0),
          int(0),
          select(value.greaterThan(maximum), maximum, value),
        );
      const tileMin = ivec2(
        clampTile(int(floor(center.x.sub(radius).div(TILE_SIZE))), maxTileX),
        clampTile(int(floor(center.y.sub(radius).div(TILE_SIZE))), maxTileY),
      ).toVar();
      const tileMax = ivec2(
        clampTile(int(floor(center.x.add(radius).div(TILE_SIZE))), maxTileX),
        clampTile(int(floor(center.y.add(radius).div(TILE_SIZE))), maxTileY),
      ).toVar();
      const localIndex = uint(0).toVar();
      Loop(
        {
          start: tileMin.y,
          end: tileMax.y,
          type: "int",
          condition: "<=",
        },
        ({ i: tileY }) => {
          Loop(
            {
              start: tileMin.x,
              end: tileMax.x,
              type: "int",
              condition: "<=",
            },
            ({ i: tileX }) => {
              const destination = intersectionOffsets
                .element(gid)
                .add(localIndex)
                .toVar();
              localIndex.addAssign(1);
              If(destination.greaterThanEqual(state.element(0).x), () =>
                Continue(),
              );
              const tileId = uint(tileY)
                .mul(frame.tilesX)
                .add(uint(tileX))
                .toVar();
              if (mode === "float32") {
                floatRecords!
                  .element(destination)
                  .assign(
                    uvec4(
                      tileId,
                      floatBitsToUint(mean.z) as unknown as Node<"uint">,
                      gid,
                      uint(0),
                    ),
                  );
              } else {
                const normalizedDepth = clamp(
                  mean.z
                    .sub(frame.viewport.z)
                    .div(frame.viewport.w.sub(frame.viewport.z)),
                  0,
                  1,
                ).toVar();
                const depth16 = uint(
                  round(normalizedDepth.mul(65_535)),
                ).toVar();
                packedRecords!
                  .element(destination)
                  .assign(
                    uvec2(shiftLeft(tileId, uint(16)).bitOr(depth16), gid),
                  );
              }
            },
          );
        },
      );
    });
    this.emitNode = emitKernel()
      .compute(data.count, [WORKGROUP_SIZE])
      .setName(`3DGS emit intersections (${mode})`);
  }

  encode(): void {
    this.renderer.compute([this.prepareNode, this.emitNode]);
  }

  async readStats(): Promise<GaussianPassStats> {
    const result = await this.renderer.getArrayBufferAsync(this.dispatch.state);
    const values = new Uint32Array(result);
    return {
      intersectionCount: values[0] ?? 0,
      requestedIntersections: values[1] ?? 0,
      intersectionCapacity: this.capacity,
      overflow: (values[3] ?? 0) !== 0,
    };
  }

  dispose(): void {
    this.prepareNode.dispose();
    this.emitNode.dispose();
    this.attributes.dispose();
  }

  private createIntersectionBuffers(mode: DepthSortMode): IntersectionBuffers {
    if (mode === "float32") {
      return {
        kind: "float32",
        recordsA: this.attributes.createUint(
          "3dgs.float-records-a",
          this.capacity,
          4,
        ),
        recordsB: this.attributes.createUint(
          "3dgs.float-records-b",
          this.capacity,
          4,
        ),
      };
    }
    return {
      kind: "packed16",
      recordsA: this.attributes.createUint(
        "3dgs.packed-records-a",
        this.capacity,
        2,
      ),
      recordsB: this.attributes.createUint(
        "3dgs.packed-records-b",
        this.capacity,
        2,
      ),
    };
  }
}
