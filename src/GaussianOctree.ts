import { Box3, Quaternion, Ray, Vector3 } from "three/webgpu";

import type { GaussianData } from "./GaussianData";

export interface GaussianOctreeBuildOptions {
  /** Maximum number of source Gaussians in a leaf. Defaults to 256. */
  leafCapacity?: number;
  /** Maximum subdivision depth. Defaults to 10. */
  maxDepth?: number;
  /** Dispose the source GaussianData with the octree. Defaults to false. */
  ownsData?: boolean;
}

export interface GaussianOctreeRaycastOptions {
  /** Number of Gaussian standard deviations used as the hit radius. Defaults to 3. */
  radiusScale?: number;
  /** Stop after this many nearest hits. Defaults to no limit. */
  maxHits?: number;
}

export interface GaussianOctreeRaycastHit {
  readonly gaussianIndex: number;
  readonly distance: number;
  readonly point: Vector3;
}

const RAYCAST_ALPHA_CUTOFF = 1 / 255;
const RAYCAST_ALPHA_MAX = 0.99;
const MIN_GAUSSIAN_SCALE = 1e-12;

/**
 * Return the Gaussian that makes front-to-back accumulated alpha cross the
 * requested threshold. Candidate hits must be ordered nearest first.
 */
export function alphaCompositeRaycastHit(
  ray: Ray,
  data: GaussianData,
  hits: readonly GaussianOctreeRaycastHit[],
  alphaThreshold: number,
): GaussianOctreeRaycastHit | null {
  if (!(alphaThreshold > 0 && alphaThreshold < 1)) {
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1",
    );
  }

  const means = data.means.array as Float32Array;
  const scalesOpacity = data.scalesOpacity.array as Float32Array;
  const rotations = data.rotations.array as Float32Array;
  const relativeOrigin = new Vector3();
  const scaledDirection = new Vector3();
  const closest = new Vector3();
  const inverseRotation = new Quaternion();
  let transmittance = 1;

  for (const hit of hits) {
    const offset = hit.gaussianIndex * 4;
    const opacity = Math.min(1, Math.max(0, scalesOpacity[offset + 3]!));
    if (opacity < RAYCAST_ALPHA_CUTOFF) continue;

    inverseRotation
      .set(
        -rotations[offset]!,
        -rotations[offset + 1]!,
        -rotations[offset + 2]!,
        rotations[offset + 3]!,
      )
      .normalize();
    relativeOrigin
      .set(
        ray.origin.x - means[offset]!,
        ray.origin.y - means[offset + 1]!,
        ray.origin.z - means[offset + 2]!,
      )
      .applyQuaternion(inverseRotation);
    scaledDirection.copy(ray.direction).applyQuaternion(inverseRotation);

    const scaleX = Math.max(scalesOpacity[offset]!, MIN_GAUSSIAN_SCALE);
    const scaleY = Math.max(scalesOpacity[offset + 1]!, MIN_GAUSSIAN_SCALE);
    const scaleZ = Math.max(scalesOpacity[offset + 2]!, MIN_GAUSSIAN_SCALE);
    relativeOrigin.set(
      relativeOrigin.x / scaleX,
      relativeOrigin.y / scaleY,
      relativeOrigin.z / scaleZ,
    );
    scaledDirection.set(
      scaledDirection.x / scaleX,
      scaledDirection.y / scaleY,
      scaledDirection.z / scaleZ,
    );

    const directionLengthSquared = scaledDirection.lengthSq();
    if (directionLengthSquared <= Number.EPSILON) continue;
    const rayDistance = Math.max(
      0,
      -relativeOrigin.dot(scaledDirection) / directionLengthSquared,
    );
    closest.copy(relativeOrigin).addScaledVector(scaledDirection, rayDistance);
    const alpha = Math.min(
      RAYCAST_ALPHA_MAX,
      opacity * Math.exp(-0.5 * closest.lengthSq()),
    );
    if (alpha < RAYCAST_ALPHA_CUTOFF) continue;

    transmittance *= 1 - alpha;
    if (1 - transmittance < alphaThreshold) continue;
    const point = ray.at(rayDistance, new Vector3());
    return {
      gaussianIndex: hit.gaussianIndex,
      distance: ray.origin.distanceTo(point),
      point,
    };
  }
  return null;
}

/** One adaptive octree cell. Source indices are stored only for leaves. */
export class GaussianOctreeNode {
  readonly children: readonly number[];
  readonly gaussianIndices: Uint32Array | null;

  constructor(
    readonly id: number,
    readonly depth: number,
    readonly bounds: Box3,
    readonly count: number,
    readonly maxSplatRadius: number,
    children: readonly number[],
    gaussianIndices: Uint32Array | null,
    /** Cell bounds expanded by the largest splat radius in the subtree. */
    readonly raycastBounds: Box3,
  ) {
    this.children = children;
    this.gaussianIndices = gaussianIndices;
  }

  get isLeaf(): boolean {
    return this.children.length === 0;
  }
}

/**
 * Full CPU-side spatial index for one GaussianData object. The tree is adaptive:
 * occupied cells split until leafCapacity or maxDepth is reached.
 */
export class GaussianOctree {
  static build(
    data: GaussianData,
    options: GaussianOctreeBuildOptions = {},
  ): GaussianOctree {
    const leafCapacity = options.leafCapacity ?? 256;
    const maxDepth = options.maxDepth ?? 10;
    if (!Number.isInteger(leafCapacity) || leafCapacity <= 0) {
      throw new RangeError("GaussianOctree leafCapacity must be positive");
    }
    if (!Number.isInteger(maxDepth) || maxDepth < 0) {
      throw new RangeError("GaussianOctree maxDepth must be non-negative");
    }

    return new GaussianOctree(
      data,
      leafCapacity,
      maxDepth,
      options.ownsData ?? false,
    );
  }

  readonly bounds: Box3;
  readonly rootBounds: Box3;
  readonly rootNode = 0;
  readonly nodes: readonly GaussianOctreeNode[];
  readonly leafNodeIds: Uint32Array;

  private readonly ownsData: boolean;
  private disposed = false;

  private constructor(
    readonly data: GaussianData,
    readonly leafCapacity: number,
    readonly maxDepth: number,
    ownsData: boolean,
  ) {
    this.ownsData = ownsData;
    this.bounds = measureBounds(data);
    this.rootBounds = enclosingCube(this.bounds);

    const means = data.means.array as Float32Array;
    const scalesOpacity = data.scalesOpacity.array as Float32Array;
    const mutableNodes: GaussianOctreeNode[] = [];
    const leafIds: number[] = [];
    const indices = Array.from({ length: data.count }, (_, index) => index);

    const buildNode = (
      nodeIndices: number[],
      cellBounds: Box3,
      depth: number,
    ): number => {
      const id = mutableNodes.length;
      mutableNodes.push(null as unknown as GaussianOctreeNode);

      const canSplit =
        nodeIndices.length > leafCapacity &&
        depth < maxDepth &&
        cellBounds.max.x - cellBounds.min.x > Number.EPSILON;
      const childIds: number[] = [];

      if (canSplit) {
        const center = cellBounds.getCenter(new Vector3());
        const partitions = Array.from({ length: 8 }, () => [] as number[]);
        for (const gaussianIndex of nodeIndices) {
          const offset = gaussianIndex * 4;
          const octant =
            (means[offset]! >= center.x ? 1 : 0) |
            (means[offset + 1]! >= center.y ? 2 : 0) |
            (means[offset + 2]! >= center.z ? 4 : 0);
          partitions[octant]!.push(gaussianIndex);
        }
        for (let octant = 0; octant < 8; octant++) {
          const partition = partitions[octant]!;
          if (partition.length === 0) continue;
          childIds.push(
            buildNode(
              partition,
              childBounds(cellBounds, center, octant),
              depth + 1,
            ),
          );
        }
      }

      let maxSplatRadius = 0;
      if (childIds.length > 0) {
        for (const childId of childIds) {
          maxSplatRadius = Math.max(
            maxSplatRadius,
            mutableNodes[childId]!.maxSplatRadius,
          );
        }
      } else {
        for (const gaussianIndex of nodeIndices) {
          const offset = gaussianIndex * 4;
          maxSplatRadius = Math.max(
            maxSplatRadius,
            scalesOpacity[offset]!,
            scalesOpacity[offset + 1]!,
            scalesOpacity[offset + 2]!,
          );
        }
        leafIds.push(id);
      }

      const raycastBounds = cellBounds
        .clone()
        .expandByScalar(maxSplatRadius * 3);
      mutableNodes[id] = new GaussianOctreeNode(
        id,
        depth,
        cellBounds,
        nodeIndices.length,
        maxSplatRadius,
        childIds,
        childIds.length === 0 ? Uint32Array.from(nodeIndices) : null,
        raycastBounds,
      );
      return id;
    };

    buildNode(indices, this.rootBounds.clone(), 0);
    this.nodes = mutableNodes;
    this.leafNodeIds = Uint32Array.from(leafIds);
  }

  raycast(
    ray: Ray,
    options: GaussianOctreeRaycastOptions = {},
  ): GaussianOctreeRaycastHit[] {
    this.assertUsable();
    const radiusScale = options.radiusScale ?? 3;
    if (!(radiusScale > 0)) {
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive",
      );
    }
    const maxHits = options.maxHits ?? Infinity;
    if (!(maxHits > 0)) return [];

    const candidateIndices: number[] = [];
    const stack = [this.rootNode];
    while (stack.length > 0) {
      const node = this.nodes[stack.pop()!]!;
      const expansion = Math.max(0, radiusScale - 3) * node.maxSplatRadius;
      const hitBounds =
        expansion === 0
          ? node.raycastBounds
          : node.raycastBounds.clone().expandByScalar(expansion);
      if (!ray.intersectsBox(hitBounds)) continue;
      if (node.gaussianIndices !== null) {
        for (const index of node.gaussianIndices) candidateIndices.push(index);
      } else {
        for (const child of node.children) stack.push(child);
      }
    }
    return this.raycastIndices(ray, candidateIndices, radiusScale, maxHits);
  }

  raycastIndices(
    ray: Ray,
    indices: ArrayLike<number>,
    radiusScale = 3,
    maxHits = Infinity,
  ): GaussianOctreeRaycastHit[] {
    this.assertUsable();
    if (!(radiusScale > 0)) {
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive",
      );
    }
    if (!(maxHits > 0)) return [];
    const means = this.data.means.array as Float32Array;
    const scalesOpacity = this.data.scalesOpacity.array as Float32Array;
    const center = new Vector3();
    const closest = new Vector3();
    const hits: GaussianOctreeRaycastHit[] = [];

    for (let local = 0; local < indices.length; local++) {
      const gaussianIndex = indices[local]!;
      const offset = gaussianIndex * 4;
      center.set(means[offset]!, means[offset + 1]!, means[offset + 2]!);
      const radius =
        Math.max(
          scalesOpacity[offset]!,
          scalesOpacity[offset + 1]!,
          scalesOpacity[offset + 2]!,
        ) * radiusScale;
      ray.closestPointToPoint(center, closest);
      if (closest.distanceToSquared(center) > radius * radius) continue;
      hits.push({
        gaussianIndex,
        distance: ray.origin.distanceTo(closest),
        point: closest.clone(),
      });
    }

    hits.sort((left, right) => left.distance - right.distance);
    if (hits.length > maxHits) hits.length = maxHits;
    return hits;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.ownsData) this.data.dispose();
  }

  private assertUsable(): void {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}

function measureBounds(data: GaussianData): Box3 {
  const means = data.means.array as Float32Array;
  const result = new Box3();
  const point = new Vector3();
  for (let index = 0; index < data.count; index++) {
    const offset = index * 4;
    point.set(means[offset]!, means[offset + 1]!, means[offset + 2]!);
    result.expandByPoint(point);
  }
  return result;
}

function enclosingCube(bounds: Box3): Box3 {
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const halfExtent = Math.max(size.x, size.y, size.z, 1e-6) * 0.5;
  return new Box3(
    new Vector3(
      center.x - halfExtent,
      center.y - halfExtent,
      center.z - halfExtent,
    ),
    new Vector3(
      center.x + halfExtent,
      center.y + halfExtent,
      center.z + halfExtent,
    ),
  );
}

function childBounds(parent: Box3, center: Vector3, octant: number): Box3 {
  return new Box3(
    new Vector3(
      octant & 1 ? center.x : parent.min.x,
      octant & 2 ? center.y : parent.min.y,
      octant & 4 ? center.z : parent.min.z,
    ),
    new Vector3(
      octant & 1 ? parent.max.x : center.x,
      octant & 2 ? parent.max.y : center.y,
      octant & 4 ? parent.max.z : center.z,
    ),
  );
}
