import type { GaussianData } from "../GaussianData";
import { projectShader } from "../shaders";
import {
  PROJECTED_COMPONENT_BYTES,
  UINT_BYTES,
  WORKGROUP_SIZE,
} from "./constants";
import { BufferPool } from "./BufferPool";
import { storage } from "./gpu";

export class ProjectionStage {
  readonly projectedMean: GPUBuffer;
  readonly projectedConic: GPUBuffer;
  readonly projectedColor: GPUBuffer;
  readonly tileCounts: GPUBuffer;

  private readonly buffers: BufferPool;
  private readonly pipeline: GPUComputePipeline;
  private readonly bindGroup: GPUBindGroup;

  constructor(
    device: GPUDevice,
    private readonly data: GaussianData,
    frameUniforms: GPUBuffer,
  ) {
    this.buffers = new BufferPool(device);
    this.projectedMean = this.buffers.create(
      "3dgs.projected-mean",
      data.count * PROJECTED_COMPONENT_BYTES,
    );
    this.projectedConic = this.buffers.create(
      "3dgs.projected-conic",
      data.count * PROJECTED_COMPONENT_BYTES,
    );
    this.projectedColor = this.buffers.create(
      "3dgs.projected-color",
      data.count * PROJECTED_COMPONENT_BYTES,
    );
    this.tileCounts = this.buffers.create(
      "3dgs.tile-counts",
      data.count * UINT_BYTES,
    );

    this.pipeline = device.createComputePipeline({
      label: "3dgs.project",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.project.wgsl",
          code: projectShader,
        }),
      },
    });
    this.bindGroup = device.createBindGroup({
      label: "3dgs.project-bindings",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(data.means, data.count * 16) },
        {
          binding: 1,
          resource: storage(data.scalesOpacity, data.count * 16),
        },
        { binding: 2, resource: storage(data.rotations, data.count * 16) },
        {
          binding: 3,
          resource: storage(
            data.shCoefficients,
            data.count * data.shCoefficientCount * 16,
          ),
        },
        { binding: 4, resource: storage(this.projectedMean) },
        { binding: 5, resource: storage(this.projectedConic) },
        { binding: 6, resource: storage(this.projectedColor) },
        { binding: 7, resource: storage(this.tileCounts) },
        { binding: 8, resource: { buffer: frameUniforms } },
      ],
    });
  }

  encode(pass: GPUComputePassEncoder): void {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(Math.ceil(this.data.count / WORKGROUP_SIZE));
  }

  dispose(): void {
    this.buffers.dispose();
  }
}
