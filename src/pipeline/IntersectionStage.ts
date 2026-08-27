import type { GaussianData } from "../GaussianData";
import { emitIntersectionsShader, prepareDispatchShader } from "../shaders";
import { DISPATCH_BYTES, UINT_BYTES, WORKGROUP_SIZE } from "./constants";
import { BufferPool } from "./BufferPool";
import { dispatchState, storage } from "./gpu";
import type {
  DepthSortMode,
  GaussianPassStats,
  IntersectionBuffers,
} from "./types";

export class IntersectionStage {
  readonly dispatchBuffer: GPUBuffer;
  readonly buffers: IntersectionBuffers;

  private readonly ownedBuffers: BufferPool;
  private readonly preparePipeline: GPUComputePipeline;
  private readonly prepareBindGroup: GPUBindGroup;
  private readonly emitPipeline: GPUComputePipeline;
  private readonly emitBindGroup: GPUBindGroup;

  constructor(
    private readonly device: GPUDevice,
    private readonly data: GaussianData,
    mode: DepthSortMode,
    private readonly capacity: number,
    tileCounts: GPUBuffer,
    intersectionOffsets: GPUBuffer,
    projectedMean: GPUBuffer,
    projectedConic: GPUBuffer,
    frameUniforms: GPUBuffer,
  ) {
    this.ownedBuffers = new BufferPool(device);
    this.dispatchBuffer = this.ownedBuffers.create(
      "3dgs.indirect-dispatch",
      DISPATCH_BYTES,
      GPUBufferUsage.STORAGE |
        GPUBufferUsage.INDIRECT |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.UNIFORM,
    );
    const prepareParams = this.ownedBuffers.createUniform(
      "3dgs.prepare-dispatch-params",
      new Uint32Array([data.count, capacity]),
    );
    this.preparePipeline = device.createComputePipeline({
      label: "3dgs.prepare-dispatch",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.prepare-dispatch.wgsl",
          code: prepareDispatchShader,
        }),
      },
    });
    this.prepareBindGroup = device.createBindGroup({
      label: "3dgs.prepare-dispatch-bindings",
      layout: this.preparePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(tileCounts) },
        { binding: 1, resource: storage(intersectionOffsets) },
        { binding: 2, resource: storage(this.dispatchBuffer) },
        { binding: 3, resource: { buffer: prepareParams } },
      ],
    });

    this.buffers = this.createIntersectionBuffers(mode);
    this.emitPipeline = device.createComputePipeline({
      label: `3dgs.emit-${mode}`,
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: `3dgs.emit-${mode}.wgsl`,
          code: emitIntersectionsShader(mode),
        }),
      },
    });
    const emitEntries: GPUBindGroupEntry[] = [
      { binding: 0, resource: storage(projectedMean) },
      { binding: 1, resource: storage(projectedConic) },
      { binding: 2, resource: storage(tileCounts) },
      { binding: 3, resource: storage(intersectionOffsets) },
    ];
    if (this.buffers.kind === "float32") {
      emitEntries.push(
        { binding: 4, resource: storage(this.buffers.tileA) },
        { binding: 5, resource: storage(this.buffers.depthA) },
        { binding: 6, resource: storage(this.buffers.gaussianA) },
        { binding: 7, resource: dispatchState(this.dispatchBuffer) },
        { binding: 8, resource: { buffer: frameUniforms } },
      );
    } else {
      emitEntries.push(
        { binding: 4, resource: storage(this.buffers.keyA) },
        { binding: 5, resource: storage(this.buffers.gaussianA) },
        { binding: 6, resource: dispatchState(this.dispatchBuffer) },
        { binding: 7, resource: { buffer: frameUniforms } },
      );
    }
    this.emitBindGroup = device.createBindGroup({
      label: `3dgs.emit-${mode}-bindings`,
      layout: this.emitPipeline.getBindGroupLayout(0),
      entries: emitEntries,
    });
  }

  encode(pass: GPUComputePassEncoder): void {
    pass.setPipeline(this.preparePipeline);
    pass.setBindGroup(0, this.prepareBindGroup);
    pass.dispatchWorkgroups(1);

    pass.setPipeline(this.emitPipeline);
    pass.setBindGroup(0, this.emitBindGroup);
    pass.dispatchWorkgroups(Math.ceil(this.data.count / WORKGROUP_SIZE));
  }

  async readStats(): Promise<GaussianPassStats> {
    const readback = this.device.createBuffer({
      label: "3dgs.stats-readback",
      size: DISPATCH_BYTES,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = this.device.createCommandEncoder({
      label: "3dgs.read-stats",
    });
    encoder.copyBufferToBuffer(
      this.dispatchBuffer,
      0,
      readback,
      0,
      DISPATCH_BYTES,
    );
    this.device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const values = new Uint32Array(readback.getMappedRange().slice(0));
    readback.unmap();
    readback.destroy();
    return {
      intersectionCount: values[0] ?? 0,
      requestedIntersections: values[1] ?? 0,
      intersectionCapacity: this.capacity,
      overflow: (values[3] ?? 0) !== 0,
    };
  }

  dispose(): void {
    this.ownedBuffers.dispose();
  }

  private createIntersectionBuffers(mode: DepthSortMode): IntersectionBuffers {
    const bytes = this.capacity * UINT_BYTES;
    if (mode === "float32") {
      return {
        kind: "float32",
        tileA: this.ownedBuffers.create("3dgs.tile-a", bytes),
        depthA: this.ownedBuffers.create("3dgs.depth-a", bytes),
        gaussianA: this.ownedBuffers.create("3dgs.gaussian-a", bytes),
        tileB: this.ownedBuffers.create("3dgs.tile-b", bytes),
        depthB: this.ownedBuffers.create("3dgs.depth-b", bytes),
        gaussianB: this.ownedBuffers.create("3dgs.gaussian-b", bytes),
      };
    }
    return {
      kind: "packed16",
      keyA: this.ownedBuffers.create("3dgs.packed-key-a", bytes),
      gaussianA: this.ownedBuffers.create("3dgs.gaussian-a", bytes),
      keyB: this.ownedBuffers.create("3dgs.packed-key-b", bytes),
      gaussianB: this.ownedBuffers.create("3dgs.gaussian-b", bytes),
    };
  }
}
