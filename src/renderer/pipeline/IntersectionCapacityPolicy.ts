import { maxRasterChunkTasks } from "../kernels/rasterChunks";
import { WORKGROUP_SIZE, RADIX_BLOCK_ITEMS, RADIX_SIZE } from "./constants";
import type { GaussianPassOptions } from "./types";

/** CPU allocation policy; GPU demand remains the authority for correctness. */
export class IntersectionCapacityPolicy {
  readonly initial: number;
  readonly maximum: number;
  readonly interval: number;
  private readonly growth: number;
  private readonly headroom: number;

  constructor(
    options: GaussianPassOptions,
    limits: GPUDevice["limits"],
    chunkSize: number | null,
    depth: boolean,
  ) {
    const bufferLimit = Math.min(
      limits.maxBufferSize,
      limits.maxStorageBufferBindingSize,
    );
    let low = 1,
      high = Math.min(
        WORKGROUP_SIZE *
          Math.min(65_535, limits.maxComputeWorkgroupsPerDimension),
        Math.floor(bufferLimit / 8),
      );
    const fits = (capacity: number) => {
      if (
        Math.ceil(capacity / RADIX_BLOCK_ITEMS) * RADIX_SIZE * 4 >
        bufferLimit
      )
        return false;
      if (chunkSize === null) return true;
      const tasks = maxRasterChunkTasks(capacity, chunkSize);
      return (
        tasks <= Math.min(65_535, limits.maxComputeWorkgroupsPerDimension) &&
        tasks * WORKGROUP_SIZE * 16 * (depth ? 2 : 1) <= bufferLimit
      );
    };
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (fits(middle)) low = middle;
      else high = middle - 1;
    }
    if (high < 1 || !fits(high))
      throw new RangeError("Device cannot allocate intersection workspace");
    const fixed = options.intersectionCapacity;
    for (const [name, value] of Object.entries({
      intersectionCapacity: fixed,
      initialIntersectionCapacity: options.initialIntersectionCapacity,
      maxIntersectionCapacity: options.maxIntersectionCapacity,
    })) {
      if (value !== undefined && (!Number.isSafeInteger(value) || value < 1))
        throw new RangeError(`${name} must be a positive safe integer`);
    }
    if (
      fixed !== undefined &&
      (options.initialIntersectionCapacity !== undefined ||
        options.maxIntersectionCapacity !== undefined)
    )
      throw new RangeError(
        "intersectionCapacity cannot be combined with dynamic capacity options",
      );
    this.maximum = fixed ?? options.maxIntersectionCapacity ?? high;
    if (this.maximum > high)
      throw new RangeError(
        "Intersection capacity exceeds device buffer or dispatch limits",
      );
    this.initial =
      fixed ??
      options.initialIntersectionCapacity ??
      Math.min(262_144, this.maximum);
    if (this.initial > this.maximum)
      throw new RangeError(
        "initialIntersectionCapacity exceeds maximum capacity",
      );
    this.growth = options.intersectionGrowthFactor ?? 2;
    this.headroom = options.intersectionHeadroom ?? 1.25;
    this.interval = options.intersectionReadbackInterval ?? 100;
    if (!Number.isFinite(this.growth) || this.growth <= 1)
      throw new RangeError("intersectionGrowthFactor must exceed 1");
    if (!Number.isFinite(this.headroom) || this.headroom < 1)
      throw new RangeError("intersectionHeadroom must be at least 1");
    if (!Number.isFinite(this.interval) || this.interval < 0)
      throw new RangeError("intersectionReadbackInterval must be nonnegative");
  }

  next(current: number, demand: number): number | null {
    if (demand > this.maximum) return null;
    const desired = Math.max(
      Math.ceil(demand * this.headroom),
      Math.ceil(current * this.growth),
    );
    return Math.min(
      this.maximum,
      Math.ceil(desired / WORKGROUP_SIZE) * WORKGROUP_SIZE,
    );
  }
}
