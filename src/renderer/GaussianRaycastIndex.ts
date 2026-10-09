import { Box3, Quaternion, Ray, Vector3 } from "three/webgpu";
import type { MipmapSnapshot } from "../streaming-backend/MipmapSnapshot";

export interface GaussianMipmapRaycastHit {
  /** Index in this snapshot, not an original source or packed render index. */
  gaussianIndex: number;
  distance: number;
  point: Vector3;
}

/** Client-only synchronous traversal over an optional coarse mipmap snapshot. */
export class GaussianRaycastIndex {
  private readonly means: Float32Array;
  private readonly scalesOpacity: Float32Array;
  private readonly rotations: Float32Array;
  private readonly bounds: Float32Array;
  private readonly children: Uint32Array;
  private readonly root: number;
  constructor(snapshot: MipmapSnapshot) {
    const buffers = new Map(snapshot.attributes.map((a) => [a.name, a]));
    const get = (name: string): Float32Array => {
      const a = buffers.get(name);
      if (
        !a ||
        a.format !== "f32" ||
        a.elementsPerGaussian !== 4 ||
        a.data.byteLength !== snapshot.nodeCount * 16
      )
        throw new RangeError(`Invalid snapshot attribute ${name}`);
      return new Float32Array(a.data);
    };
    this.means = get("means");
    this.scalesOpacity = get("scalesOpacity");
    this.rotations = get("rotations");
    this.bounds = new Float32Array(snapshot.nodeBounds);
    this.children = new Uint32Array(snapshot.nodeChildren);
    this.root = snapshot.rootIndex;
    if (
      !Number.isSafeInteger(snapshot.nodeCount) ||
      snapshot.nodeCount < 1 ||
      this.root >= snapshot.nodeCount ||
      this.bounds.length !== snapshot.nodeCount * 6 ||
      this.children.length !== snapshot.nodeCount * 2
    )
      throw new RangeError("Invalid mipmap snapshot hierarchy");
    const seen = new Set<number>();
    const stack = [this.root];
    let leaves = 0;
    while (stack.length) {
      const i = stack.pop()!;
      if (seen.has(i))
        throw new RangeError("Mipmap snapshot has a cycle or shared child");
      seen.add(i);
      const start = this.children[i * 2]!;
      const count = this.children[i * 2 + 1]!;
      if (start + count > snapshot.nodeCount)
        throw new RangeError("Invalid mipmap child range");
      if (count === 0) leaves++;
      for (let c = start; c < start + count; c++) stack.push(c);
    }
    if (seen.size !== snapshot.nodeCount || leaves !== snapshot.leafCount)
      throw new RangeError("Invalid mipmap snapshot topology");
  }
  debugCells(): readonly { bounds: Box3; depth: number; isLeaf: boolean }[] {
    const result: { bounds: Box3; depth: number; isLeaf: boolean }[] = [];
    const stack: [number, number][] = [[this.root, 0]];
    while (stack.length) {
      const [i, depth] = stack.pop()!;
      const count = this.children[i * 2 + 1]!;
      result.push({
        bounds: this.box(i, new Box3()),
        depth,
        isLeaf: count === 0,
      });
      const start = this.children[i * 2]!;
      for (let c = start; c < start + count; c++) stack.push([c, depth + 1]);
    }
    return result;
  }
  raycast(
    ray: Ray,
    minOpacity = 0.2,
    near = 0,
    far = Infinity,
  ): GaussianMipmapRaycastHit | null {
    if (!Number.isFinite(minOpacity) || minOpacity < 0 || minOpacity > 1)
      throw new RangeError("minOpacity must be in [0, 1]");
    let nearest = far;
    let hitIndex = -1;
    const stack = [this.root];
    const box = new Box3();
    const entry = new Vector3();
    while (stack.length) {
      const i = stack.pop()!;
      this.box(i, box);
      if (!ray.intersectBox(box, entry)) continue;
      if (
        !box.containsPoint(ray.origin) &&
        entry.distanceTo(ray.origin) > nearest
      )
        continue;
      const start = this.children[i * 2]!;
      const count = this.children[i * 2 + 1]!;
      if (count) {
        for (let c = start; c < start + count; c++) stack.push(c);
        continue;
      }
      const opacity = this.scalesOpacity[i * 4 + 3]!;
      if (opacity <= 0 || opacity < minOpacity) continue;
      const distance = this.intersectEllipsoid(ray, i, near);
      if (distance !== null && distance >= near && distance <= nearest) {
        nearest = distance;
        hitIndex = i;
      }
    }
    return hitIndex < 0
      ? null
      : {
          gaussianIndex: hitIndex,
          distance: nearest,
          point: ray.at(nearest, new Vector3()),
        };
  }
  private box(i: number, box: Box3): Box3 {
    box.min.fromArray(this.bounds, i * 6);
    box.max.fromArray(this.bounds, i * 6 + 3);
    return box;
  }
  /** Ellipsoid/disk intersection adapted from Spark's MIT raycast.rs. Bounds
   * traversal is ours; internal representative Gaussians are never hit-tested. */
  private intersectEllipsoid(ray: Ray, i: number, near: number): number | null {
    const at = i * 4;
    const q = new Quaternion().fromArray(this.rotations, at).invert();
    const origin = ray.origin
      .clone()
      .sub(new Vector3().fromArray(this.means, at))
      .applyQuaternion(q);
    const direction = ray.direction.clone().applyQuaternion(q);
    const scale = new Vector3().fromArray(this.scalesOpacity, at);
    const minimum = Math.max(scale.x, scale.y, scale.z) * 0.01;
    const flat =
      scale.z < minimum
        ? "z"
        : scale.y < minimum
          ? "y"
          : scale.x < minimum
            ? "x"
            : null;
    if (flat) {
      if (Math.abs(direction[flat]) < 1e-6) return null;
      const t = -origin[flat] / direction[flat];
      const p = origin.addScaledVector(direction, t);
      const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
      const radius = axes
        .filter((axis) => axis !== flat)
        .reduce((sum, axis) => sum + (p[axis] / scale[axis]) ** 2, 0);
      return t >= near && Number.isFinite(radius) && radius <= 1 ? t : null;
    }
    if (scale.x <= 0 || scale.y <= 0 || scale.z <= 0) return null;
    origin.divide(scale);
    direction.divide(scale);
    const a = direction.lengthSq();
    const b = origin.dot(direction);
    const c = origin.lengthSq() - 1;
    const discriminant = b * b - a * c;
    if (discriminant < 0 || a === 0) return null;
    const first = (-b - Math.sqrt(discriminant)) / a;
    const second = (-b + Math.sqrt(discriminant)) / a;
    return first >= near ? first : second >= near ? second : null;
  }
}
