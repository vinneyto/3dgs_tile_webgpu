import { align4 } from "./gpu";

export class BufferPool {
  private readonly buffers: GPUBuffer[] = [];

  constructor(private readonly device: GPUDevice) {}

  create(
    label: string,
    size: number,
    usage: GPUBufferUsageFlags = GPUBufferUsage.STORAGE,
  ): GPUBuffer {
    const alignedSize = align4(size);
    if (alignedSize > this.device.limits.maxBufferSize) {
      throw new RangeError(
        `${label} requires ${alignedSize} bytes, exceeding maxBufferSize`,
      );
    }
    const buffer = this.device.createBuffer({
      label,
      size: alignedSize,
      usage,
    });
    this.buffers.push(buffer);
    return buffer;
  }

  createUniform(label: string, values: Uint32Array): GPUBuffer {
    const buffer = this.create(
      label,
      Math.max(16, values.byteLength),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );
    this.device.queue.writeBuffer(
      buffer,
      0,
      values.buffer as ArrayBuffer,
      values.byteOffset,
      values.byteLength,
    );
    return buffer;
  }

  dispose(): void {
    for (const buffer of this.buffers) buffer.destroy();
    this.buffers.length = 0;
  }
}
