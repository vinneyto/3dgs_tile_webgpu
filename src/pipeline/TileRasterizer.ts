import { rasterizeShader } from "../shaders";
import { storage } from "./gpu";

export class TileRasterizer {
  private readonly pipeline: GPUComputePipeline;
  private readonly bindGroup: GPUBindGroup;

  constructor(
    device: GPUDevice,
    projectedMean: GPUBuffer,
    projectedConic: GPUBuffer,
    projectedColor: GPUBuffer,
    sortedGaussianIds: GPUBuffer,
    tileOffsets: GPUBuffer,
    outputTexture: GPUTexture,
    frameUniforms: GPUBuffer,
  ) {
    this.pipeline = device.createComputePipeline({
      label: "3dgs.rasterize",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.rasterize.wgsl",
          code: rasterizeShader,
        }),
      },
    });
    this.bindGroup = device.createBindGroup({
      label: "3dgs.rasterize-bindings",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(projectedMean) },
        { binding: 1, resource: storage(projectedConic) },
        { binding: 2, resource: storage(projectedColor) },
        { binding: 3, resource: storage(sortedGaussianIds) },
        { binding: 4, resource: storage(tileOffsets) },
        { binding: 5, resource: outputTexture.createView() },
        { binding: 6, resource: { buffer: frameUniforms } },
      ],
    });
  }

  encode(pass: GPUComputePassEncoder, tilesX: number, tilesY: number): void {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(tilesX, tilesY);
  }
}
