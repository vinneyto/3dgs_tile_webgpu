import { Box3, Ray, Vector3 } from "three/webgpu";
import {
  alphaCompositeRaycastHit,
  type GaussianOctreeRaycastHit,
} from "../streaming-backend-impl/GaussianOctree";
import type { FullRaycastOctreeBuffers } from "../streaming-backend/FullRaycastOctreeBuffers";

/** Transferable snapshot built with the worker's octree; raycasts remain synchronous. */
export class GaussianRaycastIndex {
  private readonly means: Float32Array;
  private readonly scalesOpacity: Float32Array;
  private readonly rotations: Float32Array;
  private readonly bounds: Float32Array;
  private readonly nodeChildren: Uint32Array;
  private readonly children: Uint32Array;
  private readonly nodeIndices: Uint32Array;
  private readonly indices: Uint32Array;

  constructor(buffers: FullRaycastOctreeBuffers) {
    this.means = new Float32Array(buffers.means);
    this.scalesOpacity = new Float32Array(buffers.scalesOpacity);
    this.rotations = new Float32Array(buffers.rotations);
    this.bounds = new Float32Array(buffers.nodeBounds);
    this.nodeChildren = new Uint32Array(buffers.nodeChildren);
    this.children = new Uint32Array(buffers.children);
    this.nodeIndices = new Uint32Array(buffers.nodeIndices);
    this.indices = new Uint32Array(buffers.indices);
  }

  /** Cell bounds and depth for the sandbox's octree visualization. */
  debugCells(): readonly { bounds: Box3; depth: number; isLeaf: boolean }[] {
    const cells: { bounds: Box3; depth: number; isLeaf: boolean }[] = [];
    const stack: [number, number][] = [[0, 0]];
    while (stack.length) {
      const [node, depth] = stack.pop()!;
      const offset = node * 7;
      cells.push({
        bounds: new Box3(
          new Vector3(
            this.bounds[offset]!,
            this.bounds[offset + 1]!,
            this.bounds[offset + 2]!,
          ),
          new Vector3(
            this.bounds[offset + 3]!,
            this.bounds[offset + 4]!,
            this.bounds[offset + 5]!,
          ),
        ),
        depth,
        isLeaf: this.nodeChildren[node * 2 + 1] === 0,
      });
      const start = this.nodeChildren[node * 2]!;
      const count = this.nodeChildren[node * 2 + 1]!;
      for (let child = 0; child < count; child++)
        stack.push([this.children[start + child]!, depth + 1]);
    }
    return cells;
  }

  raycast(ray: Ray, alphaThreshold = 0.5): GaussianOctreeRaycastHit | null {
    const candidates: number[] = [];
    const stack = [0];
    const box = new Box3();
    while (stack.length > 0) {
      const node = stack.pop()!;
      const offset = node * 7;
      box.min.set(
        this.bounds[offset]!,
        this.bounds[offset + 1]!,
        this.bounds[offset + 2]!,
      );
      box.max.set(
        this.bounds[offset + 3]!,
        this.bounds[offset + 4]!,
        this.bounds[offset + 5]!,
      );
      if (!ray.intersectsBox(box)) continue;
      const childOffset = this.nodeChildren[node * 2]!;
      const childCount = this.nodeChildren[node * 2 + 1]!;
      if (childCount > 0) {
        for (let child = 0; child < childCount; child++)
          stack.push(this.children[childOffset + child]!);
      } else {
        const start = this.nodeIndices[node * 2]!;
        const count = this.nodeIndices[node * 2 + 1]!;
        for (let item = 0; item < count; item++)
          candidates.push(this.indices[start + item]!);
      }
    }
    const center = new Vector3();
    const closest = new Vector3();
    const hits: GaussianOctreeRaycastHit[] = [];
    for (const gaussianIndex of candidates) {
      const offset = gaussianIndex * 4;
      center.set(
        this.means[offset]!,
        this.means[offset + 1]!,
        this.means[offset + 2]!,
      );
      const radius =
        Math.max(
          this.scalesOpacity[offset]!,
          this.scalesOpacity[offset + 1]!,
          this.scalesOpacity[offset + 2]!,
        ) * 3;
      ray.closestPointToPoint(center, closest);
      if (closest.distanceToSquared(center) > radius * radius) continue;
      hits.push({
        gaussianIndex,
        distance: ray.origin.distanceTo(closest),
        point: closest.clone(),
      });
    }
    hits.sort((left, right) => left.distance - right.distance);
    return alphaCompositeRaycastHit(
      ray,
      {
        means: { array: this.means },
        scalesOpacity: { array: this.scalesOpacity },
        rotations: { array: this.rotations },
      },
      hits,
      alphaThreshold,
    );
  }
}
