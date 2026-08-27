import { tileOffsetShaders } from "../shaders";
import {
  LINEAR_DISPATCH_OFFSET,
  UINT_BYTES,
  WORKGROUP_SIZE,
} from "./constants";
import { BufferPool } from "./BufferPool";
import { dispatchState, storage } from "./gpu";
import type { DepthSortMode } from "./types";

export class TileOffsetBuilder {
  readonly offsets: GPUBuffer;

  private readonly buffers: BufferPool;
  private readonly clearPipeline: GPUComputePipeline;
  private readonly clearBindGroup: GPUBindGroup;
  private readonly findBoundariesPipeline: GPUComputePipeline;
  private readonly findBoundariesBindGroup: GPUBindGroup;
  private readonly fillGapsPipeline: GPUComputePipeline;
  private readonly fillGapsBindGroup: GPUBindGroup;

  constructor(
    device: GPUDevice,
    mode: DepthSortMode,
    private readonly tileCount: number,
    sortedKey: GPUBuffer,
    private readonly dispatchBuffer: GPUBuffer,
  ) {
    this.buffers = new BufferPool(device);
    this.offsets = this.buffers.create(
      "3dgs.tile-offsets",
      (tileCount + 1) * UINT_BYTES,
    );
    const params = this.buffers.createUniform(
      "3dgs.tile-offset-params",
      new Uint32Array([tileCount + 1]),
    );
    const shaders = tileOffsetShaders(mode);

    this.clearPipeline = device.createComputePipeline({
      label: "3dgs.clear-tile-offsets",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.clear-tile-offsets.wgsl",
          code: shaders.clear,
        }),
      },
    });
    this.clearBindGroup = device.createBindGroup({
      label: "3dgs.clear-tile-offsets-bindings",
      layout: this.clearPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(this.offsets) },
        { binding: 1, resource: { buffer: params } },
      ],
    });
    this.findBoundariesPipeline = device.createComputePipeline({
      label: "3dgs.find-tile-boundaries",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.find-tile-boundaries.wgsl",
          code: shaders.boundaries,
        }),
      },
    });
    this.findBoundariesBindGroup = device.createBindGroup({
      label: "3dgs.find-tile-boundaries-bindings",
      layout: this.findBoundariesPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(sortedKey) },
        { binding: 1, resource: storage(this.offsets) },
        { binding: 2, resource: dispatchState(dispatchBuffer) },
      ],
    });
    this.fillGapsPipeline = device.createComputePipeline({
      label: "3dgs.fill-tile-offset-gaps",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.fill-tile-offset-gaps.wgsl",
          code: shaders.fill,
        }),
      },
    });
    this.fillGapsBindGroup = device.createBindGroup({
      label: "3dgs.fill-tile-offset-gaps-bindings",
      layout: this.fillGapsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(this.offsets) },
        { binding: 1, resource: dispatchState(dispatchBuffer) },
        { binding: 2, resource: { buffer: params } },
      ],
    });
  }

  encode(pass: GPUComputePassEncoder): void {
    pass.setPipeline(this.clearPipeline);
    pass.setBindGroup(0, this.clearBindGroup);
    pass.dispatchWorkgroups(Math.ceil((this.tileCount + 1) / WORKGROUP_SIZE));
    pass.setPipeline(this.findBoundariesPipeline);
    pass.setBindGroup(0, this.findBoundariesBindGroup);
    pass.dispatchWorkgroupsIndirect(
      this.dispatchBuffer,
      LINEAR_DISPATCH_OFFSET,
    );
    pass.setPipeline(this.fillGapsPipeline);
    pass.setBindGroup(0, this.fillGapsBindGroup);
    pass.dispatchWorkgroups(1);
  }

  dispose(): void {
    this.buffers.dispose();
  }
}
