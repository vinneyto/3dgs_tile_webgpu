import { uniform } from "three/tsl";
import { StorageBindings } from "./StorageBindings";
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
  taskCapacity: number;
  tasks: StorageBufferAttribute;
  readonly dispatch: IndirectStorageBufferAttribute;
  partialData: StorageBufferAttribute;
  readonly taskCapacityNode = uniform(1, "uint");
  readonly partialStride: number;

  constructor(
    intersectionCapacity: number,
    private readonly chunkSize: number,
    outputDepth: boolean,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.taskCapacity = maxRasterChunkTasks(intersectionCapacity, chunkSize);
    this.taskCapacityNode.value = this.taskCapacity;
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

  resize(capacity: number): void {
    const tasks = maxRasterChunkTasks(capacity, this.chunkSize);
    this.tasks = this.attributes.grow(this.tasks, tasks);
    this.partialData = this.attributes.grow(
      this.partialData,
      tasks * WORKGROUP_SIZE * this.partialStride,
    );
    this.taskCapacity = this.tasks.count;
    this.taskCapacityNode.value = this.taskCapacity;
  }

  dispose(): void {
    this.attributes.dispose();
  }
}
