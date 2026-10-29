import { DataUtils } from "three";
import type { SparkExtSplats } from "./SparkWasmContract";
import type { MipmapSnapshot } from "../streaming-backend/MipmapSnapshot";

export function sparkBounds(data: SparkExtSplats): Float32Array {
  const n = data.numSplats,
    bounds = new Float32Array(n * 6);
  const f = new Float32Array(
    data.ext0.buffer,
    data.ext0.byteOffset,
    data.ext0.length,
  );
  for (let i = n - 1; i >= 0; i--) {
    const p = i * 4,
      b = i * 6;
    const radius =
      3 *
      Math.max(
        Math.exp(DataUtils.fromHalfFloat(data.ext1[p + 1]! >>> 16)),
        Math.exp(DataUtils.fromHalfFloat(data.ext1[p + 2]! & 0xffff)),
        Math.exp(DataUtils.fromHalfFloat(data.ext1[p + 2]! >>> 16)),
      );
    for (let d = 0; d < 3; d++) {
      bounds[b + d] = f[p + d]! - radius;
      bounds[b + d + 3] = f[p + d]! + radius;
    }
    const count = data.lodTree ? data.lodTree[p + 2]! & 0xffff : 0;
    const start = data.lodTree?.[p + 3] ?? 0;
    if (count && (start <= i || start + count > n))
      throw new RangeError("Invalid upstream Spark child range");
    for (let c = start; c < start + count; c++)
      for (let d = 0; d < 3; d++) {
        bounds[b + d] = Math.min(bounds[b + d]!, bounds[c * 6 + d]!);
        bounds[b + d + 3] = Math.max(
          bounds[b + d + 3]!,
          bounds[c * 6 + d + 3]!,
        );
      }
  }
  return bounds;
}

/** Bounded camera-independent cut; ancestor bounds enclose every descendant. */
export function createSparkSnapshot(
  data: SparkExtSplats,
  allBounds: Float32Array,
  maxLeaves: number,
): MipmapSnapshot | null {
  const tree = data.lodTree;
  if (!tree || !data.numSplats) return null;
  if (!Number.isSafeInteger(maxLeaves) || maxLeaves < 1)
    throw new RangeError("snapshot.maxLeaves must be positive");
  const ids = [0],
    children: number[] = [];
  let leaves = 1;
  for (let i = 0; i < ids.length; i++) {
    const source = ids[i]!,
      count = tree[source * 4 + 2]! & 0xffff,
      start = tree[source * 4 + 3]!;
    if (count && leaves + count - 1 <= maxLeaves) {
      children.push(ids.length, count);
      for (let c = start; c < start + count; c++) ids.push(c);
      leaves += count - 1;
    } else children.push(0, 0);
  }
  const means = new Float32Array(ids.length * 4),
    shapes = new Float32Array(ids.length * 4),
    rotations = new Float32Array(ids.length * 4),
    bounds = new Float32Array(ids.length * 6);
  const f = new Float32Array(
    data.ext0.buffer,
    data.ext0.byteOffset,
    data.ext0.length,
  );
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!,
      p = id * 4,
      q = i * 4;
    means.set(f.subarray(p, p + 3), q);
    const e = data.ext1;
    shapes.set(
      [
        Math.exp(DataUtils.fromHalfFloat(e[p + 1]! >>> 16)),
        Math.exp(DataUtils.fromHalfFloat(e[p + 2]! & 0xffff)),
        Math.exp(DataUtils.fromHalfFloat(e[p + 2]! >>> 16)),
        Math.min(1, DataUtils.fromHalfFloat(data.ext0[p + 3]! & 0xffff)),
      ],
      q,
    );
    const packed = e[p + 3]!,
      x = ((packed & 1023) / 1023) * 2 - 1,
      y = (((packed >>> 10) & 1023) / 1023) * 2 - 1,
      z = 1 - Math.abs(x) - Math.abs(y),
      t = Math.max(-z, 0);
    const ax = x + (x >= 0 ? -t : t),
      ay = y + (y >= 0 ? -t : t),
      length = Math.hypot(ax, ay, z);
    const halfAngle = (((packed >>> 20) / 4095) * Math.PI) / 2,
      s = Math.sin(halfAngle) / length;
    rotations.set([ax * s, ay * s, z * s, Math.cos(halfAngle)], q);
    bounds.set(allBounds.subarray(id * 6, id * 6 + 6), i * 6);
  }
  return {
    sourceVersion: 1,
    snapshotVersion: 1,
    rootIndex: 0,
    nodeCount: ids.length,
    leafCount: leaves,
    attributes: [
      {
        name: "means",
        format: "f32",
        elementsPerGaussian: 4,
        data: means.buffer,
      },
      {
        name: "scalesOpacity",
        format: "f32",
        elementsPerGaussian: 4,
        data: shapes.buffer,
      },
      {
        name: "rotations",
        format: "f32",
        elementsPerGaussian: 4,
        data: rotations.buffer,
      },
    ],
    nodeBounds: bounds.buffer,
    nodeChildren: new Uint32Array(children).buffer,
  };
}
