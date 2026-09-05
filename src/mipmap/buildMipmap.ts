import { Matrix4, Quaternion } from "three";
import { packShRgb8e8, unpackShRgb8e8 } from "../GaussianSh";

export interface MipmapSource {
  means: Float32Array;
  scales: Float32Array;
  rotations: Float32Array;
  sh: Float32Array | Uint32Array;
  count: number;
  coefficients: number;
}
export interface MipmapTree {
  /** Children are -1 for terminal groups of original Gaussians. */
  left: Int32Array;
  right: Int32Array;
  offsets: Uint32Array;
  counts: Uint32Array;
  indices: Uint32Array;
  /** xyz center, w conservative spatial refinement radius. */
  spheres: Float32Array;
  bounds: Float32Array;
  means: Float32Array;
  scales: Float32Array;
  rotations: Float32Array;
  sh: Uint32Array;
}

/** Moment-matched binary spatial hierarchy. Originals remain unchanged. */
export function buildMipmap(source: MipmapSource, leafSize = 8): MipmapTree {
  const n = source.count;
  const order = Uint32Array.from({ length: n }, (_, i) => i);
  const left: number[] = [],
    right: number[] = [],
    offsets: number[] = [],
    counts: number[] = [],
    indices: number[] = [];
  const spheres: number[] = [],
    bounds: number[] = [];
  const aggregates: {
    mean: number[];
    covariance: number[];
    mass: number;
    sh: number[];
  }[] = [];
  const outputMeans: number[] = [],
    outputScales: number[] = [],
    outputRotations: number[] = [],
    outputSh: number[] = [];
  const coefficient = (i: number, k: number) =>
    source.sh instanceof Uint32Array
      ? unpackShRgb8e8(source.sh[i * source.coefficients + k]!)
      : source.sh.subarray(
          (i * source.coefficients + k) * 4,
          (i * source.coefficients + k) * 4 + 3,
        );
  function original(i: number) {
    const o = i * 4;
    const s = Array.from(source.scales.subarray(o, o + 3));
    const q = new Quaternion().fromArray(source.rotations, o).normalize();
    const r = new Matrix4().makeRotationFromQuaternion(q).elements;
    const covariance = Array.from({ length: 9 }, (_, j) => {
      const a = Math.floor(j / 3),
        b = j % 3;
      return s.reduce(
        (sum, scale, k) => sum + r[k * 4 + a]! * r[k * 4 + b]! * scale * scale,
        0,
      );
    });
    return {
      mean: Array.from(source.means.subarray(o, o + 3)),
      covariance,
      mass: Math.max(0, source.scales[o + 3]!) * area(covariance),
      sh: Array.from({ length: source.coefficients }, (_, k) =>
        Array.from(coefficient(i, k)),
      ).flat(),
    };
  }
  function merge(items: ReturnType<typeof original>[]) {
    const mass = items.reduce((sum, a) => sum + a.mass, 0);
    const weights = items.map((a) =>
      mass > 0 ? a.mass / mass : 1 / items.length,
    );
    const mean = [0, 1, 2].map((k) =>
      items.reduce((s, a, i) => s + a.mean[k]! * weights[i]!, 0),
    );
    const covariance = Array.from({ length: 9 }, (_, j) => {
      const x = Math.floor(j / 3),
        y = j % 3;
      return items.reduce(
        (sum, a, i) =>
          sum +
          weights[i]! *
            (a.covariance[j]! +
              (a.mean[x]! - mean[x]!) * (a.mean[y]! - mean[y]!)),
        0,
      );
    });
    const sh = Array.from({ length: source.coefficients * 3 }, (_, k) =>
      items.reduce((s, a, i) => s + weights[i]! * a.sh[k]!, 0),
    );
    return { mean, covariance, mass, sh };
  }
  function visit(start: number, end: number): number {
    const id = left.length;
    left.push(-1);
    right.push(-1);
    offsets.push(0);
    counts.push(0);
    const lo = [Infinity, Infinity, Infinity],
      hi = [-Infinity, -Infinity, -Infinity];
    for (let j = start; j < end; j++)
      for (let k = 0; k < 3; k++) {
        const v = source.means[order[j]! * 4 + k]!;
        lo[k] = Math.min(lo[k]!, v);
        hi[k] = Math.max(hi[k]!, v);
      }
    let a: ReturnType<typeof original>;
    let renderedRadius = 0;
    if ((end - start <= leafSize && id !== 0) || end - start === 1) {
      a = merge(Array.from(order.subarray(start, end), original));
      offsets[id] = indices.length;
      counts[id] = end - start;
      for (let j = start; j < end; j++) {
        indices.push(order[j]!);
        const o = order[j]! * 4;
        renderedRadius = Math.max(
          renderedRadius,
          source.scales[o]!,
          source.scales[o + 1]!,
          source.scales[o + 2]!,
        );
      }
      for (let k = 0; k < 3; k++) {
        bounds[id * 6 + k] = lo[k]! - 3 * renderedRadius;
        bounds[id * 6 + k + 3] = hi[k]! + 3 * renderedRadius;
      }
    } else {
      let axis = 0;
      for (let k = 1; k < 3; k++)
        if (hi[k]! - lo[k]! > hi[axis]! - lo[axis]!) axis = k;
      order
        .subarray(start, end)
        .sort(
          (a, b) =>
            source.means[a * 4 + axis]! - source.means[b * 4 + axis]! || a - b,
        );
      const middle = (start + end) >>> 1;
      left[id] = visit(start, middle);
      right[id] = visit(middle, end);
      a = merge([aggregates[left[id]!]!, aggregates[right[id]!]!]);
      // The parent replaces its entire subtree, never a prefix of the children.
      const mergedIndex = n + outputMeans.length / 4;
      offsets[id] = indices.length;
      counts[id] = 1;
      indices.push(mergedIndex);
      const eigen = diagonalize(a.covariance);
      renderedRadius = Math.max(...eigen.scales);
      for (let k = 0; k < 3; k++) {
        bounds[id * 6 + k] = a.mean[k]! - 3 * renderedRadius;
        bounds[id * 6 + k + 3] = a.mean[k]! + 3 * renderedRadius;
      }
      outputMeans.push(...a.mean, 0);
      outputScales.push(
        ...eigen.scales,
        Math.min(1, a.mass / Math.max(area(a.covariance), 1e-30)),
      );
      outputRotations.push(...eigen.rotation);
      for (let k = 0; k < source.coefficients; k++)
        outputSh.push(
          packShRgb8e8(a.sh[k * 3]!, a.sh[k * 3 + 1]!, a.sh[k * 3 + 2]!),
        );
    }
    aggregates[id] = a;
    // Use spatial extent, not opacity: transparent parents must still refine.
    const radius =
      Math.hypot(...hi.map((v, k) => v - lo[k]!)) * 0.5 +
      Math.sqrt(
        Math.max(0, a.covariance[0]! + a.covariance[4]! + a.covariance[8]!),
      );
    spheres[id * 4] = (lo[0]! + hi[0]!) * 0.5;
    spheres[id * 4 + 1] = (lo[1]! + hi[1]!) * 0.5;
    spheres[id * 4 + 2] = (lo[2]! + hi[2]!) * 0.5;
    spheres[id * 4 + 3] = radius;
    if (left[id]! >= 0) {
      aggregates[left[id]!] = null!;
      aggregates[right[id]!] = null!;
    }
    return id;
  }
  visit(0, n);
  const append = (original: Float32Array, extra: number[]) => {
    const result = new Float32Array(n * 4 + extra.length);
    result.set(original.subarray(0, n * 4));
    result.set(extra, n * 4);
    return result;
  };
  const sh = new Uint32Array(n * source.coefficients + outputSh.length);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < source.coefficients; k++) {
      const c = coefficient(i, k);
      sh[i * source.coefficients + k] = packShRgb8e8(c[0]!, c[1]!, c[2]!);
    }
  sh.set(outputSh, n * source.coefficients);
  return {
    left: Int32Array.from(left),
    right: Int32Array.from(right),
    offsets: Uint32Array.from(offsets),
    counts: Uint32Array.from(counts),
    indices: Uint32Array.from(indices),
    spheres: Float32Array.from(spheres),
    bounds: Float32Array.from(bounds),
    means: append(source.means, outputMeans),
    scales: append(source.scales, outputScales),
    rotations: append(source.rotations, outputRotations),
    sh,
  };
}

function area(c: number[]): number {
  return Math.sqrt(
    Math.max(
      1e-60,
      c[0]! * c[4]! +
        c[0]! * c[8]! +
        c[4]! * c[8]! -
        c[1]! ** 2 -
        c[2]! ** 2 -
        c[5]! ** 2,
    ),
  );
}

/** Symmetric Jacobi eigensolver; eigenvectors become the Gaussian rotation. */
export function diagonalize(covariance: number[]): {
  scales: number[];
  rotation: number[];
} {
  const a = covariance.slice(),
    v = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let iteration = 0; iteration < 24; iteration++) {
    let p = 0,
      q = 1;
    for (const [x, y] of [
      [0, 2],
      [1, 2],
    ])
      if (Math.abs(a[x! * 3 + y!]!) > Math.abs(a[p * 3 + q]!)) {
        p = x!;
        q = y!;
      }
    if (
      Math.abs(a[p * 3 + q]!) <=
      1e-14 * Math.max(1e-30, Math.abs(a[0]!), Math.abs(a[4]!), Math.abs(a[8]!))
    )
      break;
    const angle =
      0.5 * Math.atan2(2 * a[p * 3 + q]!, a[q * 3 + q]! - a[p * 3 + p]!);
    const c = Math.cos(angle),
      s = Math.sin(angle);
    for (let k = 0; k < 3; k++) {
      const x = a[k * 3 + p]!,
        y = a[k * 3 + q]!;
      a[k * 3 + p] = c * x - s * y;
      a[k * 3 + q] = s * x + c * y;
      const vx = v[k * 3 + p]!,
        vy = v[k * 3 + q]!;
      v[k * 3 + p] = c * vx - s * vy;
      v[k * 3 + q] = s * vx + c * vy;
    }
    for (let k = 0; k < 3; k++) {
      const x = a[p * 3 + k]!,
        y = a[q * 3 + k]!;
      a[p * 3 + k] = c * x - s * y;
      a[q * 3 + k] = s * x + c * y;
    }
  }
  const m = new Matrix4().set(
    v[0]!,
    v[1]!,
    v[2]!,
    0,
    v[3]!,
    v[4]!,
    v[5]!,
    0,
    v[6]!,
    v[7]!,
    v[8]!,
    0,
    0,
    0,
    0,
    1,
  );
  return {
    scales: [0, 4, 8].map((i) => Math.sqrt(Math.max(1e-24, a[i]!))),
    rotation: new Quaternion().setFromRotationMatrix(m).normalize().toArray(),
  };
}
