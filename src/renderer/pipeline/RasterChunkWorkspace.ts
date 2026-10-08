import type {
  IndirectStorageBufferAttribute,
  StorageBufferAttribute,
} from "three/webgpu";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import { maxRasterChunkTasks } from "../kernels/rasterChunks";

/** Large chunk buffers depend on intersection capacity, not viewport size. */
export class RasterChunkWorkspace {
  private readonly attributes = new AttributePool();
  readonly taskCapacity: number;
  readonly tasks: StorageBufferAttribute;
  readonly dispatch: IndirectStorageBufferAttribute;
  readonly partialData: StorageBufferAttribute;
  readonly partialStride: number;

  constructor(
    intersectionCapacity: number,
    chunkSize: number,
    outputDepth: boolean,
  ) {
    this.taskCapacity = maxRasterChunkTasks(intersectionCapacity, chunkSize);
    this.tasks = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      this.taskCapacity,
      2,
    );
    this.dispatch = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch",
    );
    this.partialStride = outputDepth ? 2 : 1;
    this.partialData = this.attributes.createFloat(
      "3dgs.raster-chunk-partials",
      this.taskCapacity * WORKGROUP_SIZE * this.partialStride,
    );
  }

  dispose(): void {
    this.attributes.dispose();
  }
}
