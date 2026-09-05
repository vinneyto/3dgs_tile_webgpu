import { StorageBufferAttribute as Be, Vector3 as k, Quaternion as lr, Box3 as It, Object3D as Ts, Matrix4 as $e, Ray as cr, LineSegments as ur, BufferGeometry as dr, Float32BufferAttribute as hr, LineBasicMaterial as pr, BoxGeometry as fr, MeshBasicMaterial as gr, DoubleSide as mr, InstancedMesh as br, Color as vr, IndirectStorageBufferAttribute as xr, Vector4 as yr, Scene as As, PassNode as os, HalfFloatType as ls, SRGBColorSpace as _r, StorageTexture as cs, NoColorSpace as wr, RedFormat as kr, FloatType as Sr, NearestFilter as us, PerspectiveCamera as Cr, Vector2 as Lr } from "three/webgpu";
import { property as I, bool as ce, exp as Os, float as F, storage as b, uint as g, vec3 as it, mix as Nr, wgslFn as A, instanceIndex as ee, workgroupArray as V, workgroupId as K, invocationLocalIndex as _e, uniform as Ue, uvec2 as He, Fn as rt, If as T, Return as ge, vec4 as Q, mat4 as ds, normalize as Pr, sqrt as Le, clamp as ye, log as Rr, ceil as hs, vec2 as xe, ivec2 as Ye, int as ps, floor as Lt, subgroupIndex as gt, invocationSubgroupIndex as mt, subgroupSize as bt, atomicStore as Gr, storageTexture as Nt, select as ve, Loop as We, Break as Fe, Continue as vt, max as fs, workgroupBarrier as gs, atomicAdd as Oe, textureStore as ms, colorSpaceToWorking as Ir } from "three/tsl";
class Bs {
  count;
  shDegree;
  shCoefficientCount;
  shFormat;
  means;
  scalesOpacity;
  rotations;
  shCoefficients;
  ownsBuffers;
  disposed = !1;
  constructor(e, t) {
    if (!Number.isInteger(t.count) || t.count <= 0)
      throw new RangeError("GaussianData count must be a positive integer");
    const s = t.shDegree ?? 0;
    if (!Number.isInteger(s) || s < 0 || s > 3)
      throw new RangeError("GaussianData shDegree must be 0, 1, 2, or 3");
    if (this.count = t.count, this.shDegree = s, this.shCoefficientCount = (s + 1) ** 2, this.shFormat = t.shFormat ?? "float32", this.shFormat !== "float32" && this.shFormat !== "rgb8e8")
      throw new RangeError("GaussianData shFormat must be float32 or rgb8e8");
    this.means = e.means, this.scalesOpacity = e.scalesOpacity, this.rotations = e.rotations, this.shCoefficients = e.shCoefficients, this.ownsBuffers = t.ownsBuffers ?? !1, this.validateVec4Attribute(this.means, "means", this.count), this.validateVec4Attribute(this.scalesOpacity, "scalesOpacity", this.count), this.validateVec4Attribute(this.rotations, "rotations", this.count), this.validateShAttribute(
      this.shCoefficients,
      this.count * this.shCoefficientCount
    );
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsBuffers && (this.means.dispose(), this.scalesOpacity.dispose(), this.rotations.dispose(), this.shCoefficients.dispose()));
  }
  validateVec4Attribute(e, t, s) {
    if (e.isStorageBufferAttribute !== !0)
      throw new TypeError(
        `GaussianData ${t} must be a Three.js StorageBufferAttribute`
      );
    if (e.itemSize !== 4)
      throw new RangeError(
        `GaussianData ${t} itemSize is ${e.itemSize}; vec4 data requires itemSize 4`
      );
    if (!(e.array instanceof Float32Array))
      throw new TypeError(`GaussianData ${t} must use Float32Array storage`);
    if (e.count < s)
      throw new RangeError(
        `GaussianData ${t} has ${e.count} items; at least ${s} are required`
      );
  }
  validateShAttribute(e, t) {
    if (e.isStorageBufferAttribute !== !0)
      throw new TypeError(
        "GaussianData shCoefficients must be a Three.js StorageBufferAttribute"
      );
    const s = this.shFormat === "rgb8e8" ? 1 : 4;
    if (e.itemSize !== s)
      throw new RangeError(
        `GaussianData ${this.shFormat} shCoefficients itemSize is ${e.itemSize}; expected ${s}`
      );
    if (!(this.shFormat === "rgb8e8" ? e.array instanceof Uint32Array : e.array instanceof Float32Array))
      throw new TypeError(
        `GaussianData ${this.shFormat} shCoefficients use the wrong typed array`
      );
    if (e.count < t)
      throw new RangeError(
        `GaussianData shCoefficients has ${e.count} items; at least ${t} are required`
      );
  }
}
const Mr = 16, $s = 4;
function Tr(a, e, t) {
  const s = Math.max(Math.abs(a), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const i = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), r = 127 / 2 ** i, o = xt(a, r), n = xt(e, r), l = xt(t, r), c = i + 127;
  return (o | n << 8 | l << 16 | c << 24) >>> 0;
}
function Ca(a) {
  const e = 2 ** ((a >>> 24) - 127) / 127;
  return [
    yt(a) * e,
    yt(a >>> 8) * e,
    yt(a >>> 16) * e
  ];
}
function zs(a) {
  return a === "rgb8e8" ? $s : Mr;
}
function xt(a, e) {
  return Math.min(127, Math.max(-127, Math.round(a * e))) & 255;
}
function yt(a) {
  const e = a & 255;
  return e < 128 ? e : e - 256;
}
const bs = {
  char: 1,
  uchar: 1,
  short: 2,
  ushort: 2,
  int: 4,
  uint: 4,
  float: 4,
  double: 8,
  int8: 1,
  uint8: 1,
  int16: 2,
  uint16: 2,
  int32: 4,
  uint32: 4,
  float32: 4,
  float64: 8
}, Ar = [
  "x",
  "y",
  "z",
  "scale_0",
  "scale_1",
  "scale_2",
  "rot_0",
  "rot_1",
  "rot_2",
  "rot_3",
  "opacity",
  "f_dc_0",
  "f_dc_1",
  "f_dc_2"
];
class Or {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = Br(e), s = new Map(
      t.properties.map((p, x) => [p.name, x])
    );
    for (const p of Ar)
      if (!s.has(p))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${p}`);
    const i = t.properties.map((p) => p.name.match(/^f_rest_(\d+)$/)?.[1]).filter((p) => p !== void 0).map(Number).sort((p, x) => p - x);
    for (let p = 0; p < i.length; p++)
      if (i[p] !== p)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (i.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const r = i.length / 3, o = r + 1, n = Math.sqrt(o);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = $r(e, t), c = (p) => s.get(p), u = i.map(
      (p) => c(`f_rest_${p}`)
    ), h = t.vertexCount, d = new Float32Array(h * 4), f = new Float32Array(h * 4), m = new Float32Array(h * 4), v = new Float32Array(h * o * 4);
    for (let p = 0; p < h; p++) {
      const x = p * 4;
      d[x] = l(p, c("x")), d[x + 1] = l(p, c("y")), d[x + 2] = l(p, c("z")), f[x] = Math.max(
        Math.exp(l(p, c("scale_0"))),
        1e-6
      ), f[x + 1] = Math.max(
        Math.exp(l(p, c("scale_1"))),
        1e-6
      ), f[x + 2] = Math.max(
        Math.exp(l(p, c("scale_2"))),
        1e-6
      );
      const S = l(p, c("opacity"));
      f[x + 3] = 1 / (1 + Math.exp(-S));
      const N = l(p, c("rot_0")), L = l(p, c("rot_1")), y = l(p, c("rot_2")), R = l(p, c("rot_3")), M = Math.hypot(L, y, R, N);
      M > 1e-12 ? (m[x] = L / M, m[x + 1] = y / M, m[x + 2] = R / M, m[x + 3] = N / M) : m[x + 3] = 1;
      const G = p * o * 4;
      v[G] = l(p, c("f_dc_0")), v[G + 1] = l(p, c("f_dc_1")), v[G + 2] = l(p, c("f_dc_2"));
      for (let w = 1; w < o; w++) {
        const C = G + w * 4, $ = w - 1;
        for (let O = 0; O < 3; O++) {
          const z = u[O * r + $];
          v[C + O] = l(
            p,
            z
          );
        }
      }
    }
    return new Bs(
      {
        means: tt("ply.means", d),
        scalesOpacity: tt("ply.scales-opacity", f),
        rotations: tt("ply.rotations-xyzw", m),
        shCoefficients: tt("ply.sh-coefficients", v)
      },
      {
        count: h,
        shDegree: n - 1,
        ownsBuffers: !0
      }
    );
  }
}
function tt(a, e) {
  const t = new Be(e, 4);
  return t.name = a, t;
}
function Br(a) {
  const e = new Uint8Array(a), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let m = 0; m <= e.length - t.length; m++) {
    let v = !0;
    for (let p = 0; p < t.length; p++)
      if (e[m + p] !== t[p]) {
        v = !1;
        break;
      }
    if (v) {
      s = m;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let i = s + t.length;
  if (e[i] === 13 && i++, e[i] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  i++;
  const o = new TextDecoder().decode(e.subarray(0, i)).split(/\r?\n/);
  if (o[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let n = null, l = "", c = -1, u = 0;
  const h = [], d = [];
  for (const m of o) {
    const v = m.trim().split(/\s+/);
    if (v[0] === "format") {
      if (v[1] !== "ascii" && v[1] !== "binary_little_endian" && v[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${v[1] ?? "unknown"}`);
      n = v[1];
    } else if (v[0] === "element") {
      l = v[1] ?? "";
      const p = Number(v[2]);
      if (!Number.isInteger(p) || p < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: p }), l === "vertex" && (c = p);
    } else if (v[0] === "property" && l === "vertex") {
      if (v[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const p = v[1], x = v[2];
      if (!(p in bs) || x === void 0)
        throw new Error(`Unsupported vertex property: ${m}`);
      h.push({ name: x, type: p, byteOffset: u }), u += bs[p];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (c <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (m) => m.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: c, properties: h, vertexStride: u, dataOffset: i };
}
function $r(a, e) {
  if (e.format === "ascii") {
    const r = new TextDecoder().decode(
      new Uint8Array(a, e.dataOffset)
    ), o = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let n = 0;
    for (let l = 0; l < o.length; l++) {
      for (; n < r.length && /\s/.test(r[n]); ) n++;
      const c = n;
      for (; n < r.length && !/\s/.test(r[n]); ) n++;
      const u = Number(r.slice(c, n));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${l}`);
      o[l] = u;
    }
    return (l, c) => o[l * e.properties.length + c];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > a.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(a), i = e.format === "binary_little_endian";
  return (r, o) => {
    const n = e.properties[o], l = e.dataOffset + r * e.vertexStride + n.byteOffset;
    return zr(s, l, n.type, i);
  };
}
function zr(a, e, t, s) {
  switch (t) {
    case "char":
    case "int8":
      return a.getInt8(e);
    case "uchar":
    case "uint8":
      return a.getUint8(e);
    case "short":
    case "int16":
      return a.getInt16(e, s);
    case "ushort":
    case "uint16":
      return a.getUint16(e, s);
    case "int":
    case "int32":
      return a.getInt32(e, s);
    case "uint":
    case "uint32":
      return a.getUint32(e, s);
    case "float":
    case "float32":
      return a.getFloat32(e, s);
    case "double":
    case "float64":
      return a.getFloat64(e, s);
  }
}
const vs = 1 / 255, Er = 0.99, _t = 1e-12;
function Dr(a, e, t, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const i = e.means.array, r = e.scalesOpacity.array, o = e.rotations.array, n = new k(), l = new k(), c = new k(), u = new lr();
  let h = 1;
  for (const d of t) {
    const f = d.gaussianIndex * 4, m = Math.min(1, Math.max(0, r[f + 3]));
    if (m < vs) continue;
    u.set(
      -o[f],
      -o[f + 1],
      -o[f + 2],
      o[f + 3]
    ).normalize(), n.set(
      a.origin.x - i[f],
      a.origin.y - i[f + 1],
      a.origin.z - i[f + 2]
    ).applyQuaternion(u), l.copy(a.direction).applyQuaternion(u);
    const v = Math.max(r[f], _t), p = Math.max(r[f + 1], _t), x = Math.max(r[f + 2], _t);
    n.set(
      n.x / v,
      n.y / p,
      n.z / x
    ), l.set(
      l.x / v,
      l.y / p,
      l.z / x
    );
    const S = l.lengthSq();
    if (S <= Number.EPSILON) continue;
    const N = Math.max(
      0,
      -n.dot(l) / S
    );
    c.copy(n).addScaledVector(l, N);
    const L = Math.min(
      Er,
      m * Math.exp(-0.5 * c.lengthSq())
    );
    if (L < vs || (h *= 1 - L, 1 - h < s)) continue;
    const y = a.at(N, new k());
    return {
      gaussianIndex: d.gaussianIndex,
      distance: a.origin.distanceTo(y),
      point: y
    };
  }
  return null;
}
class jr {
  constructor(e, t, s, i, r, o, n, l) {
    this.id = e, this.depth = t, this.bounds = s, this.count = i, this.maxSplatRadius = r, this.raycastBounds = l, this.children = o, this.gaussianIndices = n;
  }
  id;
  depth;
  bounds;
  count;
  maxSplatRadius;
  raycastBounds;
  children;
  gaussianIndices;
  get isLeaf() {
    return this.children.length === 0;
  }
}
class Mt {
  constructor(e, t, s, i) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = i, this.bounds = Ur(e), this.rootBounds = Wr(this.bounds);
    const r = e.means.array, o = e.scalesOpacity.array, n = [], l = [], c = Array.from({ length: e.count }, (h, d) => d), u = (h, d, f) => {
      const m = n.length;
      n.push(null);
      const v = h.length > t && f < s && d.max.x - d.min.x > Number.EPSILON, p = [];
      if (v) {
        const N = d.getCenter(new k()), L = Array.from({ length: 8 }, () => []);
        for (const y of h) {
          const R = y * 4, M = (r[R] >= N.x ? 1 : 0) | (r[R + 1] >= N.y ? 2 : 0) | (r[R + 2] >= N.z ? 4 : 0);
          L[M].push(y);
        }
        for (let y = 0; y < 8; y++) {
          const R = L[y];
          R.length !== 0 && p.push(
            u(
              R,
              Fr(d, N, y),
              f + 1
            )
          );
        }
      }
      let x = 0;
      if (p.length > 0)
        for (const N of p)
          x = Math.max(
            x,
            n[N].maxSplatRadius
          );
      else {
        for (const N of h) {
          const L = N * 4;
          x = Math.max(
            x,
            o[L],
            o[L + 1],
            o[L + 2]
          );
        }
        l.push(m);
      }
      const S = d.clone().expandByScalar(x * 3);
      return n[m] = new jr(
        m,
        f,
        d,
        h.length,
        x,
        p,
        p.length === 0 ? Uint32Array.from(h) : null,
        S
      ), m;
    };
    u(c, this.rootBounds.clone(), 0), this.nodes = n, this.leafNodeIds = Uint32Array.from(l);
  }
  data;
  leafCapacity;
  maxDepth;
  static build(e, t = {}) {
    const s = t.leafCapacity ?? 256, i = t.maxDepth ?? 10;
    if (!Number.isInteger(s) || s <= 0)
      throw new RangeError("GaussianOctree leafCapacity must be positive");
    if (!Number.isInteger(i) || i < 0)
      throw new RangeError("GaussianOctree maxDepth must be non-negative");
    return new Mt(
      e,
      s,
      i,
      t.ownsData ?? !1
    );
  }
  bounds;
  rootBounds;
  rootNode = 0;
  nodes;
  leafNodeIds;
  ownsData;
  disposed = !1;
  raycast(e, t = {}) {
    this.assertUsable();
    const s = t.radiusScale ?? 3;
    if (!(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const i = t.maxHits ?? 1 / 0;
    if (!(i > 0)) return [];
    const r = [], o = [this.rootNode];
    for (; o.length > 0; ) {
      const n = this.nodes[o.pop()], l = Math.max(0, s - 3) * n.maxSplatRadius, c = l === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(l);
      if (e.intersectsBox(c))
        if (n.gaussianIndices !== null)
          for (const u of n.gaussianIndices) r.push(u);
        else
          for (const u of n.children) o.push(u);
    }
    return this.raycastIndices(e, r, s, i);
  }
  raycastIndices(e, t, s = 3, i = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(i > 0)) return [];
    const r = this.data.means.array, o = this.data.scalesOpacity.array, n = new k(), l = new k(), c = [];
    for (let u = 0; u < t.length; u++) {
      const h = t[u], d = h * 4;
      n.set(r[d], r[d + 1], r[d + 2]);
      const f = Math.max(
        o[d],
        o[d + 1],
        o[d + 2]
      ) * s;
      e.closestPointToPoint(n, l), !(l.distanceToSquared(n) > f * f) && c.push({
        gaussianIndex: h,
        distance: e.origin.distanceTo(l),
        point: l.clone()
      });
    }
    return c.sort((u, h) => u.distance - h.distance), c.length > i && (c.length = i), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function Ur(a) {
  const e = a.means.array, t = new It(), s = new k();
  for (let i = 0; i < a.count; i++) {
    const r = i * 4;
    s.set(e[r], e[r + 1], e[r + 2]), t.expandByPoint(s);
  }
  return t;
}
function Wr(a) {
  const e = a.getCenter(new k()), t = a.getSize(new k()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new It(
    new k(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new k(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function Fr(a, e, t) {
  return new It(
    new k(
      t & 1 ? e.x : a.min.x,
      t & 2 ? e.y : a.min.y,
      t & 4 ? e.z : a.min.z
    ),
    new k(
      t & 1 ? a.max.x : e.x,
      t & 2 ? a.max.y : e.y,
      t & 4 ? a.max.z : e.z
    )
  );
}
class xs extends Ts {
  isGaussianCloud = !0;
  objectId;
  lod;
  raycastMode = "rendered";
  /** Accumulated alpha required for a pointer hit. Must be in (0, 1). */
  raycastAlphaThreshold = 0.5;
  ownerStore;
  packing;
  packedGaussianCount;
  priority;
  constructor(e, t, s, i = "GaussianCloud", r = null, o = null, n = 0) {
    super(), this.ownerStore = e, this.objectId = t, this.packedGaussianCount = s, this.lod = r, this.packing = o, this.priority = n, this.name = i;
  }
  get lodPacking() {
    return this.packing;
  }
  get gaussianCount() {
    return this.packedGaussianCount;
  }
  /** Lower priorities receive Store budget first. Defaults to 0. */
  get packingPriority() {
    return this.priority;
  }
  set packingPriority(e) {
    this.ownerStore.updatePackingPriority(this, e);
  }
  /** Re-evaluate this cloud on the next Store pack after strategy parameters change. */
  invalidatePacking() {
    this.ownerStore.invalidateCloudPacking(this);
  }
  /** Internal Store hook used after a global budget redistribution. */
  updatePacking(e, t) {
    this.packing = t, this.packedGaussianCount = e;
  }
  /** Internal Store hook used while priorities are changed transactionally. */
  updatePackingPriority(e) {
    this.priority = e;
  }
  /** Raycast either the packed/rendered LOD or the complete source octree. */
  raycast(e, t) {
    if (this.lod === null || this.packing === null) return;
    const s = new $e().copy(this.matrixWorld).invert(), i = new cr().copy(e.ray).applyMatrix4(s), r = this.raycastMode === "full" ? this.lod.octree.raycast(i) : this.lod.raycast(i, this.packing), o = Dr(
      i,
      this.lod.octree.data,
      r,
      this.raycastAlphaThreshold
    );
    if (o !== null) {
      const n = o.point.clone().applyMatrix4(this.matrixWorld), l = e.ray.origin.distanceTo(n);
      l >= e.near && l <= e.far && t.push({
        distance: l,
        point: n,
        object: this,
        index: o.gaussianIndex
      });
    }
  }
  /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
  dispose() {
    this.ownerStore.remove(this);
  }
}
class La extends ur {
  constructor(e, t = {}) {
    const s = t.minDepth ?? 0, i = t.maxDepth ?? 1 / 0, r = e.nodes.filter(
      (h) => h.depth >= s && h.depth <= i && (t.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(r.length * 12 * 2 * 3);
    let n = 0;
    for (const h of r) {
      const { min: d, max: f } = h.bounds, m = [
        [d.x, d.y, d.z],
        [f.x, d.y, d.z],
        [f.x, f.y, d.z],
        [d.x, f.y, d.z],
        [d.x, d.y, f.z],
        [f.x, d.y, f.z],
        [f.x, f.y, f.z],
        [d.x, f.y, f.z]
      ];
      for (const [v, p] of Vr)
        o.set(m[v], n), o.set(m[p], n + 3), n += 6;
    }
    const l = new dr();
    l.setAttribute("position", new hr(o, 3)), l.computeBoundingSphere();
    const c = t.opacity ?? 0.55, u = new pr({
      color: t.color ?? 7710719,
      opacity: c,
      transparent: c < 1,
      depthTest: t.depthTest ?? !1,
      depthWrite: !1,
      toneMapped: !1
    });
    super(l, u), this.octree = e, this.cellCount = r.length, this.name = "Gaussian octree helper", this.frustumCulled = !1, this.renderOrder = 1e3;
  }
  octree;
  isOctreeHelper = !0;
  cellCount;
  dispose() {
    this.removeFromParent(), this.geometry.dispose(), this.material.dispose();
  }
}
const Vr = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7]
];
class ys {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const qr = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class Tt {
  constructor(e, t) {
    this.octree = e, this.levels = Kr(t.levels ?? qr), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? Yr, i = new Float64Array(e.data.count);
    for (let r = 0; r < i.length; r++) {
      const o = s(r, e);
      i[r] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((r) => {
      if (r.gaussianIndices === null)
        return new ys(
          r.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(r.gaussianIndices).sort(
          (n, l) => i[l] - i[n] || n - l
        )
      );
      return new ys(
        r.id,
        o,
        Uint32Array.from(
          this.levels.map(
            ({ retention: n }) => Math.min(
              o.length,
              Math.max(1, Math.ceil(o.length * n))
            )
          )
        )
      );
    });
  }
  octree;
  static build(e, t = {}) {
    return new Tt(e, t);
  }
  levels;
  nodes;
  ownsOctree;
  disposed = !1;
  get levelCount() {
    return this.levels.length;
  }
  get finestLevel() {
    return this.levels.length - 1;
  }
  getNode(e) {
    this.assertUsable();
    const t = this.nodes[e];
    if (t === void 0)
      throw new RangeError(`GaussianLod node ${e} does not exist`);
    return t;
  }
  /** Expand a compact cell/level packing into source Gaussian indices. */
  indicesForPacking(e) {
    if (this.assertUsable(), e.nodeIds.length !== e.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const t = new Uint32Array(e.gaussianCount), s = /* @__PURE__ */ new Set();
    let i = 0;
    for (let r = 0; r < e.nodeIds.length; r++) {
      const o = e.nodeIds[r], n = this.getLeafNode(o);
      if (s.has(o))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${o}`
        );
      s.add(o);
      const l = e.lodLevels[r], c = n.levelCounts[l];
      if (c === void 0)
        throw new RangeError(`GaussianLod level ${l} does not exist`);
      if (i + c > t.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let u = 0; u < c; u++)
        t[i++] = n.sortedGaussianIndices[u];
    }
    if (i !== t.length)
      throw new RangeError(
        `GaussianLodPacking declares ${t.length} Gaussians but selects ${i}`
      );
    return t;
  }
  raycast(e, t, s = {}) {
    this.assertUsable();
    const i = s.radiusScale ?? 3;
    if (!(i > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const r = s.maxHits ?? 1 / 0;
    if (!(r > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const o = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, l = new k(), c = new k(), u = [], h = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.nodeIds.length; d++) {
      const f = t.nodeIds[d], m = this.getLeafNode(f);
      if (h.has(f))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${f}`
        );
      h.add(f);
      const v = t.lodLevels[d], p = m.levelCounts[v];
      if (p === void 0)
        throw new RangeError(`GaussianLod level ${v} does not exist`);
      const x = this.octree.nodes[f], S = Math.max(0, i - 3) * x.maxSplatRadius, N = S === 0 ? x.raycastBounds : x.raycastBounds.clone().expandByScalar(S);
      if (e.intersectsBox(N))
        for (let L = 0; L < p; L++) {
          const y = m.sortedGaussianIndices[L], R = y * 4;
          l.set(o[R], o[R + 1], o[R + 2]);
          const M = Math.max(
            n[R],
            n[R + 1],
            n[R + 2]
          ) * i;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > M * M) && u.push({
            gaussianIndex: y,
            distance: e.origin.distanceTo(c),
            point: c.clone()
          });
        }
    }
    return u.sort((d, f) => d.distance - f.distance), u.length > r && (u.length = r), u;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsOctree && this.octree.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianLod has been disposed");
  }
  getLeafNode(e) {
    const t = this.getNode(e);
    if (this.octree.nodes[e]?.isLeaf !== !0)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${e} is internal`
      );
    return t;
  }
}
function Kr(a) {
  if (a.length === 0 || a.length > 256)
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  let e = 0;
  const t = a.map(({ retention: s }) => {
    if (!(s > e && s <= 1))
      throw new RangeError(
        "GaussianLod retention values must increase and stay in (0, 1]"
      );
    return e = s, Object.freeze({ retention: s });
  });
  if (Math.abs(e - 1) > Number.EPSILON)
    throw new RangeError("GaussianLod finest retention must be 1");
  return Object.freeze(t);
}
function Yr(a, e) {
  const t = e.data.scalesOpacity.array, s = a * 4, i = [t[s], t[s + 1], t[s + 2]];
  return i.sort((r, o) => o - r), t[s + 3] * i[0] * i[1];
}
const Xr = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class Na extends Ts {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : Xr, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: e.levelCount }, (i, r) => r)
    );
  }
  lod;
  isLodHelper = !0;
  colors;
  opacity;
  wireframe;
  depthTest;
  levelMeshes = /* @__PURE__ */ new Map();
  visibleLevelSet = /* @__PURE__ */ new Set();
  packing;
  get lodPacking() {
    return this.packing;
  }
  get visibleLevels() {
    return [...this.visibleLevelSet].sort((e, t) => e - t);
  }
  get instanceCounts() {
    return Array.from(
      { length: this.lod.levelCount },
      (e, t) => this.levelMeshes.get(t)?.count ?? 0
    );
  }
  setLevels(e) {
    const t = /* @__PURE__ */ new Set();
    for (const s of e) {
      if (!Number.isInteger(s) || s < 0 || s >= this.lod.levelCount)
        throw new RangeError(`Gaussian LOD level ${s} does not exist`);
      t.add(s);
    }
    this.visibleLevelSet = t;
    for (const [s, i] of this.levelMeshes)
      i.visible = t.has(s);
    return this;
  }
  /** Replace the active cell/level cut, for example after a future dynamic repack. */
  setPacking(e) {
    return this.lod.indicesForPacking(e), this.packing = e, this.rebuildMeshes(), this.setLevels(this.visibleLevels), this;
  }
  dispose() {
    this.removeFromParent(), this.disposeMeshes();
  }
  rebuildMeshes() {
    this.disposeMeshes();
    const e = Array.from(
      { length: this.lod.levelCount },
      () => []
    );
    for (let r = 0; r < this.packing.nodeIds.length; r++) {
      const o = this.packing.lodLevels[r], n = e[o];
      if (n === void 0)
        throw new RangeError(`Gaussian LOD level ${o} does not exist`);
      n.push(this.packing.nodeIds[r]);
    }
    const t = new k(), s = new k(), i = new $e();
    for (let r = 0; r < e.length; r++) {
      const o = e[r];
      if (o.length === 0) continue;
      const n = new fr(1, 1, 1), l = new gr({
        color: this.colors[r % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: mr,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new br(n, l, o.length);
      for (let u = 0; u < o.length; u++) {
        const h = this.lod.octree.nodes[o[u]].bounds;
        h.getCenter(t), h.getSize(s), i.makeScale(s.x, s.y, s.z), i.setPosition(t), c.setMatrixAt(u, i);
      }
      c.instanceMatrix.needsUpdate = !0, c.computeBoundingSphere(), c.name = `Gaussian LOD ${r} volumes`, c.frustumCulled = !1, c.renderOrder = 900 + r, c.userData.lodLevel = r, this.levelMeshes.set(r, c), this.add(c);
    }
  }
  disposeMeshes() {
    for (const e of this.levelMeshes.values())
      e.removeFromParent(), e.geometry.dispose(), e.material.dispose();
    this.levelMeshes.clear();
  }
}
const At = I("uint", "gaussianIndex"), Ot = I("uint", "gaussianObjectId"), at = I("vec3", "gaussianPositionLocal"), Ze = I("vec3", "gaussianPositionWorld"), nt = I("vec3", "gaussianScale"), ot = I("vec4", "gaussianRotation"), lt = I("float", "gaussianOpacity"), Bt = I("vec3", "gaussianColor"), $t = I("mat4", "gaussianObjectMatrix"), zt = I("bool", "gaussianObjectVisible"), Et = I("vec3", "gaussianViewDirection"), Dt = I("float", "gaussianViewDepth"), jt = I(
  "vec2",
  "gaussianScreenPosition"
), Es = I(
  "vec2",
  "gaussianScreenBoundsMin"
), Ds = I(
  "vec2",
  "gaussianScreenBoundsMax"
), Ut = I(
  "vec2",
  "gaussianProjectedSigma"
), Wt = I("float", "gaussianProjectedArea"), ct = I("uint", "rasterGaussianIndex"), Ft = I("uint", "rasterObjectId"), Vt = I("uvec2", "rasterPixelCoordinate"), qt = I("vec2", "rasterScreenPosition"), Kt = I("vec2", "rasterScreenUV"), Yt = I("float", "rasterPixelValue"), Xt = I("vec2", "rasterGaussianCenter"), Ht = I("vec2", "rasterPixelDelta"), js = I("vec2", "rasterGaussianCoord"), Us = I("vec2", "rasterUV"), Zt = I("float", "rasterViewDepth"), Qt = I("vec3", "rasterGaussianColor"), Jt = I("float", "rasterGaussianOpacity"), es = I("float", "rasterPower"), Ws = I("float", "rasterWeight");
function Hr() {
  return {
    gaussianPositionLocalNode: at,
    gaussianPositionWorldNode: Ze,
    gaussianScaleNode: nt,
    gaussianRotationNode: ot,
    gaussianOpacityNode: lt,
    gaussianColorNode: Bt,
    gaussianVisibilityNode: ce(!0),
    rasterPixelValueNode: F(0),
    rasterBreakNode: ce(!1),
    rasterColorNode: Qt,
    rasterAlphaNode: Jt.mul(Os(es)),
    rasterDiscardNode: ce(!1)
  };
}
const Xe = /* @__PURE__ */ new Set([
  At,
  Ot,
  at,
  Ze,
  nt,
  ot,
  lt,
  Bt,
  $t,
  zt,
  Et,
  Dt,
  jt,
  Es,
  Ds,
  Ut,
  Wt
]), ts = /* @__PURE__ */ new Set([
  ct,
  Ft,
  Vt,
  qt,
  Kt,
  Yt,
  Xt,
  Ht,
  js,
  Us,
  Zt,
  Qt,
  Jt,
  es,
  Ws
]), Fs = /* @__PURE__ */ new Set([
  Vt,
  qt,
  Kt
]), Zr = /* @__PURE__ */ new Set([
  ...Fs,
  Yt,
  ct,
  Ft,
  Xt,
  Ht,
  Zt
]);
function Vs(a, e, t) {
  a.traverse((s) => {
    if ((Xe.has(s) || ts.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function Ne(a, e, t) {
  a.traverse((s) => {
    if ((Xe.has(s) || ts.has(s)) && !e.has(s))
      throw new Error(
        `GaussianPass.${t} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const Qr = [
  15228264,
  15906891,
  4900235
];
class Pa {
  constructor(e, t = {}) {
    if (this.pass = e, t.colors !== void 0 && t.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = t.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...t.colors ?? Qr], this.tintStrength = s, this.lodLevelAttribute = e.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = e.subscribeDebug(() => this.update()), this.enabled = t.enabled ?? !0;
  }
  pass;
  isGaussianLodColorHelper = !0;
  lodLevelAttribute;
  tintStrength;
  colors;
  baseColorNode = null;
  helperColorNode = null;
  boundBuffer = null;
  unsubscribeDebug;
  active = !1;
  disposed = !1;
  get enabled() {
    return this.active;
  }
  set enabled(e) {
    if (this.assertUsable(), e !== this.active) {
      if (e) {
        this.baseColorNode = this.pass.rasterColorNode, this.active = !0, this.lodLevelAttribute.isAllocated && this.rebuildColorNode();
        return;
      }
      this.pass.rasterColorNode === this.helperColorNode && (this.pass.rasterColorNode = this.baseColorNode), this.active = !1, this.baseColorNode = null, this.helperColorNode = null, this.boundBuffer = null;
    }
  }
  /** Refresh after store.pack(); only a replaced backing buffer rebuilds the node. */
  update() {
    this.assertUsable(), !(!this.active || !this.lodLevelAttribute.isAllocated) && this.lodLevelAttribute.bufferAttribute !== this.boundBuffer && this.rebuildColorNode();
  }
  dispose() {
    this.disposed || (this.unsubscribeDebug(), this.active && this.pass.rasterColorNode === this.helperColorNode && (this.pass.rasterColorNode = this.baseColorNode), this.active = !1, this.baseColorNode = null, this.helperColorNode = null, this.boundBuffer = null, this.disposed = !0);
  }
  rebuildColorNode() {
    const e = this.lodLevelAttribute.bufferAttribute, t = b(e, "uint", e.count).toReadOnly().element(ct).mod(g(this.colors.length)), s = this.colors.map((o) => {
      const n = new vr(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return it(n.r, n.g, n.b);
    });
    let i = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      i = t.equal(g(o)).select(s[o], i);
    const r = Nr(
      this.baseColorNode,
      i,
      F(this.tintStrength)
    );
    this.boundBuffer = e, this.helperColorNode = r, this.pass.rasterColorNode = r;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function ze(a) {
  if (!Number.isInteger(a) || a < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class Ra {
  setFromCamera(e, t) {
    return this;
  }
  pack({ lod: e, maxGaussians: t }) {
    ze(t);
    const s = e.octree.data.count;
    if (t < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${t}`
      );
    const i = e.octree.leafNodeIds.slice(), r = new Uint8Array(i.length);
    return r.fill(e.finestLevel), { nodeIds: i, lodLevels: r, gaussianCount: s };
  }
}
function ss(a, e, t) {
  return a.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), a.getWorldPosition(t), e.worldToLocal(t);
}
function rs(a, e) {
  const t = e instanceof k ? e.clone() : a.octree.bounds.getCenter(new k()), s = a.octree.rootBounds.getSize(new k()), i = Math.max(s.length() * 0.5, Number.EPSILON), r = new k(), o = Array.from(a.octree.leafNodeIds, (n) => (a.octree.nodes[n].bounds.getCenter(r), {
    nodeId: n,
    radius: r.distanceTo(t) / i
  }));
  return o.sort(
    (n, l) => n.radius - l.radius || n.nodeId - l.nodeId
  ), o;
}
class Ga {
  cameraCenter = new k();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof k ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof k ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ss(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (ze(t), t === 0) return Jr();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const i = rs(e, this.center), r = [];
    let o = 0;
    for (const l of i) {
      const c = e.nodes[l.nodeId].levelCounts[s];
      if (o + c > t) break;
      r.push(l.nodeId), o += c;
    }
    const n = new Uint8Array(r.length);
    return n.fill(s), {
      nodeIds: Uint32Array.from(r),
      lodLevels: n,
      gaussianCount: o
    };
  }
}
function Jr() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class ei {
  cameraCenter = new k();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof k ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = ti(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof k ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ss(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (ze(t), t === 0) return si();
    const s = e.octree.data.count;
    if (s <= t) {
      const h = e.octree.leafNodeIds.slice(), d = new Uint8Array(h.length);
      return d.fill(e.finestLevel), { nodeIds: h, lodLevels: d, gaussianCount: s };
    }
    const i = rs(e, this.center), r = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], o = [], n = [];
    let l = 0, c = 0, u = 0;
    for (let h = 0; h < r.length; h++) {
      const d = this.budgetShares[h];
      if (u += d, d === 0) continue;
      const f = h === r.length - 1 ? t : Math.floor(t * u), m = r[h];
      for (; c < i.length; ) {
        const v = i[c], p = e.nodes[v.nodeId].levelCounts[m];
        if (l + p > f) break;
        o.push(v.nodeId), n.push(m), l += p, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(n),
      gaussianCount: l
    };
  }
}
function ti(a) {
  let e = 0;
  for (const t of a) {
    if (!(t >= 0 && t <= 1))
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    e += t;
  }
  if (Math.abs(e - 1) > 1e-6)
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  return Object.freeze([...a]);
}
function si() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Ia {
  cameraCenter = new k();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof k ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof k ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ss(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (ze(t), t === 0) return ri();
    const s = rs(e, this.center), i = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let r = s.reduce(
      (n, l, c) => n + e.nodes[l.nodeId].levelCounts[i[c]],
      0
    );
    for (let n = s.length - 1; n >= 0 && r > t; n--) {
      const l = e.nodes[s[n].nodeId];
      for (; i[n] > 0 && r > t; ) {
        const c = l.levelCounts[i[n]];
        i[n] = i[n] - 1, r -= c - l.levelCounts[i[n]];
      }
    }
    let o = s.length;
    for (; o > 0 && r > t; ) {
      o--;
      const n = e.nodes[s[o].nodeId];
      r -= n.levelCounts[i[o]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, o).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(i.slice(0, o)),
      gaussianCount: r
    };
  }
}
function ri() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
function ii(a) {
  const e = new Uint32Array(a.octree.leafNodeIds), t = new Float64Array(e.length * 3), s = new Uint32Array(e.length * a.levelCount);
  for (let n = 0; n < e.length; n++) {
    const l = e[n], c = a.octree.nodes[l].bounds, u = n * 3;
    t[u] = (c.min.x + c.max.x) * 0.5, t[u + 1] = (c.min.y + c.max.y) * 0.5, t[u + 2] = (c.min.z + c.max.z) * 0.5, s.set(a.nodes[l].levelCounts, n * a.levelCount);
  }
  const i = a.octree.rootBounds.max.x - a.octree.rootBounds.min.x, r = a.octree.rootBounds.max.y - a.octree.rootBounds.min.y, o = a.octree.rootBounds.max.z - a.octree.rootBounds.min.z;
  return {
    leafNodeIds: e,
    leafCenters: t,
    levelCounts: s,
    levelCount: a.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        i * i + r * r + o * o
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const qs = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, _s = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", qs], { type: "text/javascript;charset=utf-8" });
function ai(a) {
  let e;
  try {
    if (e = _s && (self.URL || self.webkitURL).createObjectURL(_s), !e) throw "";
    const t = new Worker(e, {
      name: a?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(qs),
      {
        name: a?.name
      }
    );
  }
}
const ni = 2;
class oi {
  constructor(e) {
    this.targetStrategy = e;
  }
  targetStrategy;
  worker = null;
  boundsCenter = new k();
  lod = null;
  revision = 0;
  latestRequestedRevision = 0;
  busy = !1;
  queuedRequest = null;
  activeMaxGaussians = 0;
  activeStarted = 0;
  latestResult = null;
  latestError = null;
  disposed = !1;
  discarded = 0;
  get pending() {
    return this.busy || this.queuedRequest !== null;
  }
  get hasResult() {
    return this.latestResult !== null || this.latestError !== null;
  }
  get discardedResults() {
    return this.discarded;
  }
  initialize(e) {
    if (this.assertUsable(), this.lod !== e) {
      if (this.lod !== null)
        throw new Error(
          "RadialLodWorkerPlanner instances cannot be shared between GaussianLod objects"
        );
      this.lod = e;
    }
  }
  initializeWorker() {
    if (this.worker !== null) return;
    const e = this.lod;
    if (e === null) throw new Error("Radial LOD worker has no GaussianLod");
    this.worker = new ai({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const t = ii(e), s = Array.from(
      { length: ni },
      () => li(t.leafNodeIds.length)
    ), i = {
      type: "init",
      data: t,
      buffers: s
    };
    this.worker.postMessage(i, [
      t.leafNodeIds.buffer,
      t.leafCenters.buffer,
      t.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: r, lodLevels: o }) => [r, o])
    ]);
  }
  request(e) {
    this.assertUsable(), this.initialize(e.lod), this.initializeWorker(), this.releaseLatestResult();
    const t = this.targetStrategy.center instanceof k ? this.targetStrategy.center : e.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
    this.latestRequestedRevision = s;
    const i = {
      type: "request",
      revision: s,
      centerX: t.x,
      centerY: t.y,
      centerZ: t.z,
      maxGaussians: e.maxGaussians
    }, o = {
      message: "budgetShares" in this.targetStrategy ? {
        ...i,
        strategy: "tiered",
        budgetShares: this.targetStrategy.budgetShares
      } : {
        ...i,
        strategy: "distance",
        levelDistance: this.targetStrategy.levelDistance
      },
      maxGaussians: e.maxGaussians
    };
    if (this.busy) {
      this.queuedRequest !== null && this.discarded++, this.queuedRequest = o;
      return;
    }
    this.dispatch(o);
  }
  cancel() {
    this.assertUsable(), this.latestRequestedRevision = ++this.revision, this.releaseLatestResult(), this.queuedRequest !== null && (this.queuedRequest = null, this.discarded++);
  }
  takeLatest() {
    if (this.assertUsable(), this.latestError !== null) {
      const i = this.latestError;
      throw this.latestError = null, i;
    }
    const e = this.latestResult;
    if (e === null) return null;
    this.latestResult = null;
    const { message: t } = e;
    let s = !1;
    return {
      packing: ci(t),
      maxGaussians: e.maxGaussians,
      planningMs: t.planningMs,
      roundTripMs: e.roundTripMs,
      release: () => {
        s || (s = !0, this.recycle(t.buffer));
      }
    };
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.latestResult = null, this.queuedRequest = null, this.worker?.removeEventListener("message", this.handleMessage), this.worker?.removeEventListener("error", this.handleError), this.worker?.terminate(), this.worker = null);
  }
  handleMessage = (e) => {
    if (this.disposed) return;
    const t = e.data, s = performance.now() - this.activeStarted, i = this.activeMaxGaussians;
    this.busy = !1, t.revision === this.latestRequestedRevision ? (this.releaseLatestResult(), this.latestResult = { message: t, maxGaussians: i, roundTripMs: s }) : (this.discarded++, this.recycle(t.buffer));
    const r = this.queuedRequest;
    this.queuedRequest = null, r !== null && this.dispatch(r);
  };
  handleError = (e) => {
    this.disposed || (this.busy = !1, this.queuedRequest = null, this.latestError = new Error(e.message || "Radial LOD worker failed"));
  };
  dispatch(e) {
    this.busy = !0, this.activeMaxGaussians = e.maxGaussians, this.activeStarted = performance.now(), this.worker.postMessage(e.message);
  }
  releaseLatestResult() {
    const e = this.latestResult;
    e !== null && (this.latestResult = null, this.discarded++, this.recycle(e.message.buffer));
  }
  recycle(e) {
    this.disposed || this.worker.postMessage({ type: "recycle", buffer: e }, [
      e.nodeIds,
      e.lodLevels
    ]);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("RadialLodWorkerPlanner has been disposed");
  }
}
function li(a) {
  return {
    nodeIds: new ArrayBuffer(a * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(a * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function ci(a) {
  return {
    nodeIds: new Uint32Array(a.buffer.nodeIds, 0, a.length),
    lodLevels: new Uint8Array(a.buffer.lodLevels, 0, a.length),
    gaussianCount: a.gaussianCount
  };
}
const ui = 1024 * 1024, di = 16, hi = 1.25;
class Ks {
  targetStrategy;
  targetPlanner;
  maxUploadBytesPerPack;
  maxChangedCellsPerPack;
  lod = null;
  appliedNodeIds = new Uint32Array();
  appliedLodLevels = new Uint8Array();
  appliedIndices = new Int32Array();
  appliedCellCount = 0;
  appliedGaussianCount = 0;
  targetAvailable = !1;
  targetBudget = -1;
  targetDirty = !0;
  changes = [];
  changeCursor = 0;
  initialized = !1;
  latestTargetPlanningMs = 0;
  latestTargetRoundTripMs = 0;
  constructor(e, t = {}) {
    if (this.targetStrategy = e, this.targetPlanner = t.targetPlanner ?? null, this.maxUploadBytesPerPack = t.maxUploadBytesPerPack ?? ui, this.maxChangedCellsPerPack = t.maxChangedCellsPerPack ?? di, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
      throw new RangeError(
        "Streaming LOD maxUploadBytesPerPack must be finite and positive"
      );
    if (!Number.isInteger(this.maxChangedCellsPerPack) || this.maxChangedCellsPerPack <= 0)
      throw new RangeError(
        "Streaming LOD maxChangedCellsPerPack must be a positive integer"
      );
  }
  setFromCamera(e, t) {
    return this.targetStrategy.setFromCamera(e, t), this.invalidateTarget();
  }
  /** Discard an unfinished target after changing the wrapped strategy. */
  invalidateTarget() {
    return this.targetDirty = !0, this.targetPlanner !== null && (this.changes = [], this.changeCursor = 0), this;
  }
  /** Whether another target plan or bounded batch is needed. */
  get needsPack() {
    return this.targetDirty || this.targetPlanner?.pending === !0 || this.targetPlanner?.hasResult === !0 || this.changeCursor < this.changes.length;
  }
  get targetStats() {
    return {
      planningMs: this.latestTargetPlanningMs,
      roundTripMs: this.latestTargetRoundTripMs,
      discardedResults: this.targetPlanner?.discardedResults ?? 0,
      pending: this.targetPlanner?.pending ?? !1
    };
  }
  dispose() {
    this.targetPlanner?.dispose();
  }
  /**
   * Compatibility path used by the Store's initial/global pack. For later
   * camera updates prefer GaussianStore.packLodBatch().
   */
  pack(e) {
    if (ze(e.maxGaussians), this.bindLod(e.lod), !this.initialized) {
      const t = this.buildTarget(e);
      return this.initializeApplied(t), this.initialized = !0, this.changes = [], this.changeCursor = 0, t;
    }
    if (this.targetPlanner !== null && (this.targetDirty || !this.targetAvailable || this.targetBudget !== e.maxGaussians)) {
      this.targetPlanner.cancel();
      const t = this.buildTarget(e);
      this.changes = this.planChanges(e.lod, t), this.changeCursor = 0;
    }
    return this.takeNextBatch(e)?.packing ?? this.currentPacking();
  }
  /**
   * Plan the newest target once, then mutate the current dense selection by one
   * bounded batch. A newer invalidation drops all unconsumed old work.
   */
  takeNextBatch(e) {
    if (ze(e.maxGaussians), this.bindLod(e.lod), !this.initialized)
      throw new Error(
        "StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches"
      );
    if (this.refreshTarget(e), this.changeCursor >= this.changes.length) return null;
    const t = [];
    let s = 0;
    for (; this.changeCursor < this.changes.length; ) {
      const i = this.changes[this.changeCursor], r = t.length >= this.maxChangedCellsPerPack || s + i.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (t.length > 0 && r && this.appliedGaussianCount <= e.maxGaussians)
        break;
      this.applyChange(i), t.push({ nodeId: i.nodeId, lodLevel: i.lodLevel }), s += i.estimatedUploadBytes, this.changeCursor++;
    }
    return {
      packing: this.currentPacking(),
      transitions: t,
      pending: this.changeCursor < this.changes.length
    };
  }
  bindLod(e) {
    if (this.lod === null) {
      this.lod = e, this.appliedNodeIds = new Uint32Array(e.nodes.length), this.appliedLodLevels = new Uint8Array(e.nodes.length), this.appliedIndices = new Int32Array(e.nodes.length), this.appliedIndices.fill(-1), this.targetPlanner?.initialize(e);
      return;
    }
    if (this.lod !== e)
      throw new Error(
        "StreamingLodPackingStrategy instances cannot be shared between GaussianLod objects"
      );
  }
  buildTarget(e) {
    const t = this.targetStrategy.pack(e);
    return Ss(e.lod, t, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.targetDirty = !1, t;
  }
  refreshTarget(e) {
    if (this.targetPlanner === null) {
      if (this.targetDirty || !this.targetAvailable || this.targetBudget !== e.maxGaussians) {
        const s = this.buildTarget(e);
        this.changes = this.planChanges(e.lod, s), this.changeCursor = 0;
      }
      return;
    }
    (this.targetDirty || this.targetBudget !== e.maxGaussians) && (this.targetPlanner.request(e), this.targetBudget = e.maxGaussians, this.targetDirty = !1, this.targetAvailable = !1, this.changes = [], this.changeCursor = 0);
    const t = this.targetPlanner.takeLatest();
    if (t !== null)
      try {
        Ss(e.lod, t.packing, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.changes = this.planChanges(e.lod, t.packing), this.changeCursor = 0, this.latestTargetPlanningMs = t.planningMs, this.latestTargetRoundTripMs = t.roundTripMs;
      } finally {
        t.release();
      }
  }
  initializeApplied(e) {
    this.appliedCellCount = e.nodeIds.length, this.appliedGaussianCount = e.gaussianCount, this.appliedNodeIds.set(e.nodeIds), this.appliedLodLevels.set(e.lodLevels);
    for (let t = 0; t < e.nodeIds.length; t++)
      this.appliedIndices[e.nodeIds[t]] = t;
  }
  planChanges(e, t) {
    const s = new Int16Array(e.nodes.length);
    s.fill(-1);
    for (let o = 0; o < t.nodeIds.length; o++)
      s[t.nodeIds[o]] = t.lodLevels[o];
    const i = [], r = [];
    for (let o = this.appliedCellCount - 1; o >= 0; o--) {
      const n = this.appliedNodeIds[o], l = this.appliedLodLevels[o], c = s[n];
      (c < 0 || c < l) && i.push(
        ks(
          e,
          n,
          l,
          c < 0 ? null : c
        )
      );
    }
    for (let o = 0; o < t.nodeIds.length; o++) {
      const n = t.nodeIds[o], l = t.lodLevels[o], c = this.appliedIndices[n], u = c < 0 ? null : this.appliedLodLevels[c];
      (u === null || l > u) && r.push(ks(e, n, u, l));
    }
    return [...i, ...r];
  }
  applyChange(e) {
    const t = this.appliedIndices[e.nodeId];
    if (e.lodLevel === null) {
      if (t < 0) return;
      const s = --this.appliedCellCount;
      if (t !== s) {
        const i = this.appliedNodeIds[s];
        this.appliedNodeIds[t] = i, this.appliedLodLevels[t] = this.appliedLodLevels[s], this.appliedIndices[i] = t;
      }
      this.appliedIndices[e.nodeId] = -1;
    } else if (t < 0) {
      const s = this.appliedCellCount++;
      this.appliedNodeIds[s] = e.nodeId, this.appliedLodLevels[s] = e.lodLevel, this.appliedIndices[e.nodeId] = s;
    } else
      this.appliedLodLevels[t] = e.lodLevel;
    this.appliedGaussianCount += e.gaussianDelta;
  }
  currentPacking() {
    return {
      nodeIds: this.appliedNodeIds.subarray(0, this.appliedCellCount),
      lodLevels: this.appliedLodLevels.subarray(0, this.appliedCellCount),
      gaussianCount: this.appliedGaussianCount
    };
  }
}
function ws(a) {
  return a instanceof Ks;
}
function ks(a, e, t, s) {
  const i = a.nodes[e], r = t === null ? 0 : i.levelCounts[t], o = s === null ? 0 : i.levelCounts[s], n = Math.max(0, o - r), l = Math.max(0, r - o), c = t !== null && s !== null && t !== s ? Math.min(r, o) : 0, u = 48 + a.octree.data.shCoefficientCount * $s + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: o - r,
    estimatedUploadBytes: Math.ceil(
      (n * u + l * 16 + c * 4) * hi
    )
  };
}
function Ss(a, e, t) {
  if (e.gaussianCount > t)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${t} Gaussians`
    );
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let i = 0;
  for (let r = 0; r < e.nodeIds.length; r++) {
    const o = e.nodeIds[r], n = e.lodLevels[r], c = a.nodes[o]?.levelCounts[n];
    if (c === void 0 || a.octree.nodes[o]?.isLeaf !== !0)
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${o} or level ${n}`
      );
    if (s.has(o))
      throw new Error(`GaussianLod packing contains duplicate node ${o}`);
    s.add(o), i += c;
  }
  if (i !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${i}`
    );
}
class pi {
  allocate({ remainingGaussians: e }) {
    return e;
  }
}
class Ma {
  fraction;
  constructor(e) {
    if (!(e > 0 && e <= 1))
      throw new RangeError("Gaussian source budget fraction must be in (0, 1]");
    this.fraction = e;
  }
  allocate({ remainingGaussians: e, entry: t }) {
    return Math.min(
      e,
      Math.floor(t.sourceGaussianCount * this.fraction)
    );
  }
}
function qe(a, e, t) {
  if (a.length === 0) return [];
  a.sort((h, d) => h - d);
  const s = [];
  let i = a[0], r = i, o = 1;
  for (let h = 1; h <= a.length; h++) {
    const d = a[h];
    if (d !== r) {
      if (d !== void 0 && o++, d === r + 1) {
        r = d;
        continue;
      }
      s.push({ start: i, count: r - i + 1 }), d !== void 0 && (i = r = d);
    }
  }
  if (s.length < 2) return s;
  const n = Math.floor(o * t);
  let l = 0;
  const c = [];
  let u = { ...s[0] };
  for (let h = 1; h < s.length; h++) {
    const d = s[h], f = u.start + u.count, m = d.start - f;
    m <= e && l + m <= n ? (u.count = d.start + d.count - u.start, l += m) : (c.push(u), u = { ...d });
  }
  return c.push(u), c;
}
function Ke(a) {
  let e = 0;
  for (const t of a) e += t.count;
  return e;
}
function ie(a, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      a.addUpdateRange(
        s.start * t,
        s.count * t
      );
    a.needsUpdate = !0;
  }
}
const Ys = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), Xs = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), Hs = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class fi {
  format;
  name;
  packedBuffer = null;
  disposed = !1;
  constructor(e, t) {
    this.name = e, this.format = t;
  }
  /** True after the Store has materialized a packed slot layout. */
  get isAllocated() {
    return this.packedBuffer !== null;
  }
  get count() {
    return this.packedBuffer?.count ?? 0;
  }
  /** Current Three.js storage attribute. A full Store rebuild may replace it. */
  get bufferAttribute() {
    if (this.assertUsable(), this.packedBuffer === null)
      throw new Error(
        `GaussianStore attribute ${this.name} is not allocated; call store.pack() first`
      );
    return this.packedBuffer;
  }
  /** Current CPU-side packed values indexed by gaussianIndex. */
  get array() {
    return this.bufferAttribute.array;
  }
  [Ys](e) {
    this.assertUsable();
    const t = this.packedBuffer, s = new Be(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [Xs](e) {
    ie(this.bufferAttribute, e, 1);
  }
  [Hs]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const Zs = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), Qs = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class gi {
  attributes = /* @__PURE__ */ new Map();
  get size() {
    return this.attributes.size;
  }
  get(e) {
    return this.attributes.get(e);
  }
  has(e) {
    return this.attributes.has(e);
  }
  values() {
    return this.attributes.values();
  }
  [Symbol.iterator]() {
    return this.values();
  }
  [Zs](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const i = new fi(e, t);
    return this.attributes.set(e, i), i;
  }
  [Qs]() {
    for (const e of this.attributes.values())
      e[Hs]();
    this.attributes.clear();
  }
}
class mi {
  constructor(e) {
    this.attribute = e;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(e) {
    this.writtenSlots.length = 0, this.attribute[Ys](new Uint32Array(e)), this.freshBuffer = !0;
  }
  backfill(e) {
    const t = this.attribute.array;
    for (const s of e.cells)
      for (const i of s.slots)
        t[i] = s.lodLevel, this.writtenSlots.push(i);
  }
  updateCell(e) {
    const { previousCell: t, cell: s, retainedCount: i } = e, r = t?.lodLevel === s.lodLevel ? i : 0, o = this.attribute.array;
    for (let n = r; n < s.slots.length; n++) {
      const l = s.slots[n];
      o[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const e = this.writtenSlots.length, t = qe(this.writtenSlots, 16, 0.25), s = Ke(t);
    return this.freshBuffer || this.attribute[Xs](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const bi = 16777216;
class Ta {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new gi();
  attributePackers = [];
  entries = [];
  cloudList = [];
  packedData = null;
  nextObjectId = 0;
  packedObjectCapacity = 0;
  gaussianCapacity = 0;
  cellSlotsByEntry = /* @__PURE__ */ new Map();
  freeSlots = [];
  scratchWrittenSlots = [];
  scratchReleasedSlots = [];
  scratchClearedSlots = [];
  slotMarks = new Uint32Array();
  slotMarkGeneration = 0;
  packingInvalid = !1;
  latestPackStats = null;
  disposed = !1;
  /** Changes only after a successful pack() replaces the shared layout. */
  layoutVersion = 0;
  constructor(e = {}) {
    this.loader = e.loader ?? new Or(), this.budgetingStrategy = e.budgetingStrategy ?? new pi(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = yi(
      e.maxGaussians ?? "auto"
    );
  }
  get maxGaussians() {
    return this.gaussianCapacity;
  }
  /** True after registration changes and until pack() succeeds. */
  get needsPack() {
    return this.packingInvalid;
  }
  get lastPackStats() {
    return this.latestPackStats;
  }
  get count() {
    return this.entries.reduce((e, t) => e + t.count, 0);
  }
  get shDegree() {
    let e = 0;
    for (const t of this.entries)
      t.sourceDegree > e && (e = t.sourceDegree);
    return e;
  }
  /** Number of stable object slots required by camera-specific pass state. */
  get objectCapacity() {
    return this.nextObjectId;
  }
  get clouds() {
    return this.cloudList;
  }
  /**
   * Lazily enables one u32 per packed slot containing its selected cell LOD.
   * Repeated calls return the same stable wrapper.
   */
  enablePackedLodLevelAttribute() {
    this.assertUsable();
    const e = this.attributes.get("lodLevel");
    if (e !== void 0) return e;
    const t = this.attributes[Zs](
      "lodLevel",
      "u32"
    ), s = new mi(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let i = null, r = null;
    try {
      return i = Mt.build(s, {
        ...t.octree,
        ownsData: !0
      }), r = Tt.build(i, {
        ...t.lod,
        ownsOctree: !0
      }), this.addLod(r, {
        name: t.name ?? xi(e),
        priority: t.priority,
        packingStrategy: t.packingStrategy,
        ownsLod: !0
      });
    } catch (o) {
      throw r !== null ? r.dispose() : i !== null ? i.dispose() : s.dispose(), o;
    }
  }
  add(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), i = St(t.priority ?? 0), r = new xs(
      this,
      s,
      0,
      t.name,
      null,
      null,
      i
    );
    return this.entries.push({
      cloud: r,
      count: 0,
      sourceGaussianCount: e.count,
      sourceDegree: e.shDegree,
      priority: i,
      packingStrategy: null,
      ownsPackingStrategy: !1,
      lastLodFocus: new k(Number.NaN, Number.NaN, Number.NaN),
      source: e,
      ownsSource: t.ownsData ?? !1,
      lod: null,
      ownsLod: !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(r), this.invalidatePacking(), r;
  }
  addLod(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), i = St(t.priority ?? 0), r = new xs(
      this,
      s,
      0,
      t.name,
      e,
      null,
      i
    ), o = t.packingStrategy ?? this.defaultPackingStrategy ?? _i(this.defaultStreamingLod);
    return this.entries.push({
      cloud: r,
      count: 0,
      sourceGaussianCount: e.octree.data.count,
      sourceDegree: e.octree.data.shDegree,
      priority: i,
      packingStrategy: o,
      ownsPackingStrategy: t.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new k(Number.NaN, Number.NaN, Number.NaN),
      source: null,
      ownsSource: !1,
      lod: e,
      ownsLod: t.ownsLod ?? !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(r), this.invalidatePacking(), r;
  }
  remove(e) {
    if (this.disposed) return;
    const t = this.entries.findIndex((i) => i.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && Cs(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = Si(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), i = performance.now(), r = this.planPackings(s), o = performance.now() - i, n = Math.min(
      s,
      this.entries.reduce((f, m) => f + m.sourceGaussianCount, 0)
    ), l = this.packedData, c = l !== null && l.count === n && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), h = c ? this.updatePackedData(r, l) : this.buildPackedData(r, n), d = performance.now() - u;
    for (const f of r)
      f.entry.count = f.count, f.entry.packing = f.packing, f.entry.allocatedBudget = f.allocatedBudget, f.entry.packingDirty = !1, f.entry.cloud.updatePacking(f.count, f.packing);
    this.packedData = h.data, this.cellSlotsByEntry = h.cellSlotsByEntry, this.freeSlots = h.freeSlots, this.gaussianCapacity = s, this.packedObjectCapacity = this.objectCapacity, this.packingInvalid = !1, this.latestPackStats = { ...h.stats, planningMs: o, slotUpdateMs: d }, c || (this.layoutVersion++, l?.dispose());
  }
  /**
   * Apply one bounded batch from a StreamingLodPackingStrategy without global
   * budget planning or scanning unchanged clouds/cells.
   */
  packLodBatch(e) {
    if (this.assertUsable(), this.packingInvalid || this.packedData === null)
      throw new Error(
        "GaussianStore layout is invalidated; call store.pack({ limits: device.limits }) before streaming LOD batches"
      );
    const t = this.entries.find((w) => w.cloud === e);
    if (t === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    if (t.lod === null || t.packing === null || t.allocatedBudget === null)
      throw new Error("GaussianCloud is not an initialized LOD entry");
    const s = t.packingStrategy;
    if (!ws(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const i = performance.now(), r = s.takeNextBatch({
      lod: t.lod,
      maxGaussians: t.allocatedBudget
    }), o = performance.now() - i;
    if (r === null)
      return { applied: !1, pending: s.needsPack };
    const n = this.packedData, l = this.cellSlotsByEntry.get(t);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const c = performance.now(), u = l, h = this.freeSlots, d = this.scratchReleasedSlots;
    d.length = 0;
    const f = /* @__PURE__ */ new Map();
    for (const w of r.transitions) {
      const C = l.get(w.nodeId), $ = w.lodLevel === null ? 0 : t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], O = Math.min(
        C?.slots.length ?? 0,
        $
      );
      if (f.set(w.nodeId, {
        previousCell: C,
        retainedCount: O
      }), C !== void 0)
        for (let z = O; z < C.slots.length; z++) {
          const B = C.slots[z];
          h.push(B), d.push(B);
        }
    }
    const m = this.scratchWrittenSlots;
    m.length = 0;
    for (const w of r.transitions) {
      const C = f.get(w.nodeId), { previousCell: $, retainedCount: O } = C;
      if (w.lodLevel === null) {
        u.delete(w.nodeId);
        continue;
      }
      const z = t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], B = $?.slots, U = B !== void 0 && B.length === z ? B : new Uint32Array(z);
      U !== B && B !== void 0 && O > 0 && U.set(B.subarray(0, O));
      for (let Y = O; Y < z; Y++) {
        const he = h.pop();
        if (he === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, w.nodeId, Y),
          he,
          n.means.array,
          n.scalesOpacity.array,
          n.rotations.array,
          n.shCoefficients.array,
          n.shCoefficientCount
        ), U[Y] = he, m.push(he);
      }
      const Pe = {
        lodLevel: w.lodLevel,
        slots: U
      };
      for (const Y of this.attributePackers)
        Y.updateCell({ previousCell: $, cell: Pe, retainedCount: O });
      u.set(w.nodeId, Pe);
    }
    const v = this.nextSlotMarkGeneration(n.count);
    for (const w of m) this.slotMarks[w] = v;
    const p = this.scratchClearedSlots;
    p.length = 0;
    for (const w of d)
      this.slotMarks[w] !== v && p.push(w);
    const x = n.scalesOpacity.array;
    for (const w of p) x[w * 4 + 3] = 0;
    const S = qe(m, 4, 0.15), N = qe(p, 16, 0.25);
    ie(n.means, S, 4), ie(n.scalesOpacity, S, 4), ie(n.scalesOpacity, N, 4), ie(n.rotations, S, 4), ie(
      n.shCoefficients,
      S,
      n.shCoefficientCount * n.shCoefficients.itemSize
    );
    const L = this.commitAttributePackers(), y = this.count - t.count + r.packing.gaussianCount, R = Ke(S), M = Ke(N), G = performance.now() - c;
    return t.count = r.packing.gaussianCount, t.packing = r.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = h, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: n.count,
      activeGaussians: y,
      reusedSlots: y - m.length,
      writtenSlots: m.length,
      clearedSlots: p.length,
      estimatedUploadBytes: R * kt(n) + M * 16 + L.estimatedUploadBytes,
      writtenSlotRanges: S,
      clearedSlotRanges: N,
      planningMs: o,
      slotUpdateMs: G
    }, { applied: !0, pending: r.pending };
  }
  planPackings(e) {
    const t = [...this.entries].sort(
      (r, o) => r.priority - o.priority || r.cloud.objectId - o.cloud.objectId
    ), s = [];
    let i = 0;
    for (const r of t) {
      const o = Math.max(0, e - i), n = this.budgetingStrategy.allocate({
        capacity: e,
        allocatedGaussians: i,
        remainingGaussians: o,
        entry: {
          cloud: r.cloud,
          priority: r.priority,
          insertionIndex: r.cloud.objectId,
          sourceGaussianCount: r.sourceGaussianCount
        }
      });
      if (wi(n, o), r.lod === null) {
        if (r.sourceGaussianCount > n)
          throw new RangeError(
            `${r.cloud.name} requires ${r.sourceGaussianCount} Gaussians but its Store allocation is ${n}`
          );
        s.push({
          entry: r,
          count: r.sourceGaussianCount,
          packing: null,
          allocatedBudget: n,
          selectionChanged: r.packingDirty || r.allocatedBudget !== n
        }), i += r.sourceGaussianCount;
        continue;
      }
      const l = r.packingStrategy, c = r.packingDirty || r.allocatedBudget !== n || r.packing === null, u = !c && r.packing !== null ? r.packing : l.pack({
        lod: r.lod,
        maxGaussians: n
      });
      if (u.gaussianCount > n)
        throw new RangeError(
          `${l.constructor.name} exceeded its allocation of ${n} Gaussians`
        );
      ki(r.lod, u), s.push({
        entry: r,
        count: u.gaussianCount,
        packing: u,
        allocatedBudget: n,
        selectionChanged: c
      }), i += u.gaussianCount;
    }
    return s;
  }
  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(e, t) {
    this.assertUsable();
    const s = this.entries.find((r) => r.cloud === e);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const i = St(t);
    s.priority = i, e.updatePackingPriority(i), this.invalidatePacking();
  }
  /** Mark one cloud for strategy re-evaluation after its strategy parameters change. */
  invalidateCloudPacking(e) {
    this.assertUsable();
    const t = this.entries.find((s) => s.cloud === e);
    if (t === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    t.packingDirty = !0, this.packingInvalid = !0;
  }
  /**
   * Update camera-relative streaming LODs and apply at most one
   * bounded upload batch per cloud. GaussianPass calls this automatically.
   */
  updateLod(e) {
    if (this.assertUsable(), this.packingInvalid || this.packedData === null)
      return { appliedBatches: 0, pending: !1, clouds: [] };
    e.updateWorldMatrix(!0, !1);
    const t = new k(), s = new k();
    let i = 0, r = !1;
    const o = [];
    for (const n of this.entries) {
      const l = n.packingStrategy;
      if (n.lod === null || l === null || !ws(l))
        continue;
      n.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(t), n.cloud.worldToLocal(t);
      const c = n.lod.octree.rootBounds.getSize(new k()).length() * 0.5, u = Math.max(0.05, c * 0.025);
      (!Number.isFinite(n.lastLodFocus.x) || t.distanceToSquared(n.lastLodFocus) >= u * u) && (l.setFromCamera(e, n.cloud), n.lastLodFocus.copy(t));
      let h = !1;
      l.needsPack && (h = this.packLodBatch(n.cloud).applied, h && i++);
      const d = l.needsPack;
      r ||= d, n.lod.octree.rootBounds.getCenter(s), o.push({
        cloud: n.cloud,
        focusDistance: t.distanceTo(s),
        applied: h,
        pending: d,
        targetStats: l.targetStats
      });
    }
    return { appliedBatches: i, pending: r, clouds: o };
  }
  /** Current packed attributes. pack() must have resolved all invalidations. */
  getPackedData() {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    if (this.packingInvalid || this.packedData === null)
      throw new Error(
        "GaussianStore layout is invalidated; call store.pack({ limits: device.limits }) before rendering"
      );
    return this.packedData;
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0;
      for (const e of this.entries)
        e.source !== null && e.ownsSource && e.source.dispose(), e.lod !== null && e.ownsLod && e.lod.dispose(), e.ownsPackingStrategy && Cs(e.packingStrategy), e.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[Qs](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(e, t) {
    const s = this.shDegree, i = (s + 1) ** 2, r = new Float32Array(t * 4), o = new Float32Array(t * 4), n = new Float32Array(t * 4), l = new Uint32Array(t * i), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const v of e) {
      const { entry: p } = v, x = /* @__PURE__ */ new Map();
      for (const S of this.plannedCells(v)) {
        const N = new Uint32Array(S.count);
        for (let L = 0; L < S.count; L++) {
          const y = this.cellSourceIndex(p, S.nodeId, L);
          this.copySourceToSlot(
            p,
            y,
            u,
            r,
            o,
            n,
            l,
            i
          ), N[L] = u++;
        }
        x.set(S.nodeId, {
          lodLevel: S.lodLevel,
          slots: N
        });
      }
      c.set(p, x);
    }
    const h = Array.from(
      { length: t - u },
      (v, p) => t - 1 - p
    ), d = new Bs(
      {
        means: st("3dgs.store.means-object", r),
        scalesOpacity: st("3dgs.store.scales-opacity", o),
        rotations: st("3dgs.store.rotations", n),
        shCoefficients: st(
          "3dgs.store.sh-coefficients",
          l,
          1
        )
      },
      {
        count: t,
        shDegree: s,
        shFormat: this.packedShFormat,
        ownsBuffers: !0
      }
    ), f = this.collectPackedLayoutCells(c);
    for (const v of this.attributePackers)
      v.allocate(t), v.backfill({ cells: f });
    const m = this.commitAttributePackers();
    return {
      data: d,
      cellSlotsByEntry: c,
      freeSlots: h,
      stats: {
        fullRebuild: !0,
        slotCapacity: t,
        activeGaussians: u,
        reusedSlots: 0,
        writtenSlots: u,
        clearedSlots: 0,
        estimatedUploadBytes: u * kt(d) + m.estimatedUploadBytes,
        writtenSlotRanges: u === 0 ? [] : [{ start: 0, count: u }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(e, t) {
    const s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
    let r = 0;
    for (const y of e) {
      if (i.add(y.entry), r += y.count, !y.selectionChanged) continue;
      const R = /* @__PURE__ */ new Map();
      for (const M of this.plannedCells(y))
        R.set(M.nodeId, M);
      s.set(y.entry, R);
    }
    const o = [...this.freeSlots], n = this.scratchReleasedSlots;
    n.length = 0;
    for (const [y, R] of this.cellSlotsByEntry) {
      const M = s.get(y);
      if (!(M === void 0 && i.has(y)))
        for (const [G, w] of R) {
          const C = w.slots, $ = Math.min(
            C.length,
            M?.get(G)?.count ?? 0
          );
          for (let O = $; O < C.length; O++) {
            const z = C[O];
            o.push(z), n.push(z);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), c = this.scratchWrittenSlots;
    c.length = 0;
    let u = 0;
    for (const y of e) {
      const R = this.cellSlotsByEntry.get(y.entry);
      if (!y.selectionChanged && R !== void 0) {
        l.set(y.entry, R), u += y.count;
        continue;
      }
      const M = /* @__PURE__ */ new Map();
      for (const G of s.get(y.entry)?.values() ?? []) {
        const w = R?.get(G.nodeId), C = w?.slots, $ = Math.min(C?.length ?? 0, G.count), O = C !== void 0 && C.length === G.count ? C : new Uint32Array(G.count);
        O !== C && C !== void 0 && $ > 0 && O.set(C.subarray(0, $)), u += $;
        for (let B = $; B < G.count; B++) {
          const U = o.pop();
          if (U === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            y.entry,
            this.cellSourceIndex(y.entry, G.nodeId, B),
            U,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), O[B] = U, c.push(U);
        }
        const z = {
          lodLevel: G.lodLevel,
          slots: O
        };
        for (const B of this.attributePackers)
          B.updateCell({
            previousCell: w,
            cell: z,
            retainedCount: $
          });
        M.set(G.nodeId, z);
      }
      l.set(y.entry, M);
    }
    const h = this.nextSlotMarkGeneration(t.count);
    for (const y of c) this.slotMarks[y] = h;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const y of n)
      this.slotMarks[y] !== h && d.push(y);
    const f = t.scalesOpacity.array;
    for (const y of d) f[y * 4 + 3] = 0;
    const m = c.length, v = d.length, p = qe(c, 4, 0.15), x = qe(d, 16, 0.25);
    ie(t.means, p, 4), ie(t.scalesOpacity, p, 4), ie(t.scalesOpacity, x, 4), ie(t.rotations, p, 4), ie(
      t.shCoefficients,
      p,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const S = this.commitAttributePackers(), N = Ke(p), L = Ke(x);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: r,
        reusedSlots: u,
        writtenSlots: m,
        clearedSlots: v,
        estimatedUploadBytes: N * kt(t) + L * 16 + S.estimatedUploadBytes,
        writtenSlotRanges: p,
        clearedSlotRanges: x,
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  plannedCells(e) {
    return e.entry.lod === null || e.packing === null ? [{ nodeId: -1, lodLevel: 0, count: e.count }] : Array.from(e.packing.nodeIds, (t, s) => ({
      nodeId: t,
      lodLevel: e.packing.lodLevels[s],
      count: e.entry.lod.nodes[t].levelCounts[e.packing.lodLevels[s]]
    }));
  }
  collectPackedLayoutCells(e = this.cellSlotsByEntry) {
    const t = [];
    for (const s of e.values())
      for (const i of s.values())
        t.push(i);
    return t;
  }
  commitAttributePackers() {
    let e = 0, t = 0, s = 0;
    const i = [];
    for (const r of this.attributePackers) {
      const o = r.commit();
      e += o.writtenSlots, t += o.uploadedSlots, s += o.estimatedUploadBytes, i.push(...o.slotRanges);
    }
    return { writtenSlots: e, uploadedSlots: t, estimatedUploadBytes: s, slotRanges: i };
  }
  cellSourceIndex(e, t, s) {
    return e.lod === null ? s : e.lod.nodes[t].sortedGaussianIndices[s];
  }
  copySourceToSlot(e, t, s, i, r, o, n, l) {
    const c = e.lod?.octree.data ?? e.source;
    if (c === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    wt(c.means.array, t, i, s), wt(
      c.scalesOpacity.array,
      t,
      r,
      s
    ), wt(
      c.rotations.array,
      t,
      o,
      s
    ), i[s * 4 + 3] = e.cloud.objectId, vi(
      c,
      t,
      n,
      s,
      l
    );
  }
  invalidatePacking() {
    this.packingInvalid = !0;
    for (const e of this.entries)
      e.packingDirty = !0, e.allocatedBudget = null, e.count = 0, e.packing = null, e.cloud.updatePacking(0, null);
  }
  allocateObjectId() {
    const e = this.nextObjectId++;
    if (e >= bi)
      throw new RangeError(
        "GaussianStore exhausted object IDs exactly representable in means.w"
      );
    return e;
  }
  nextSlotMarkGeneration(e) {
    return this.slotMarks.length !== e && (this.slotMarks = new Uint32Array(e), this.slotMarkGeneration = 0), this.slotMarkGeneration++, this.slotMarkGeneration === 4294967295 && (this.slotMarks.fill(0), this.slotMarkGeneration = 1), this.slotMarkGeneration;
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianStore has been disposed");
  }
}
function st(a, e, t = 4) {
  const s = new Be(e, t);
  return s.name = a, s;
}
function wt(a, e, t, s) {
  t.set(
    a.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function vi(a, e, t, s, i) {
  const r = a.shCoefficientCount, o = Math.min(
    r,
    i
  ), n = s * i;
  if (t.fill(
    0,
    n,
    n + i
  ), a.shFormat === "rgb8e8") {
    const u = e * r;
    t.set(
      a.shCoefficients.array.subarray(
        u,
        u + o
      ),
      n
    );
    return;
  }
  const l = a.shCoefficients.array, c = e * r * 4;
  for (let u = 0; u < o; u++) {
    const h = c + u * 4;
    t[n + u] = Tr(
      l[h],
      l[h + 1],
      l[h + 2]
    );
  }
}
function kt(a) {
  return 48 + a.shCoefficientCount * zs(a.shFormat);
}
function xi(a) {
  const e = a.split(/[?#]/, 1)[0] ?? a;
  return e.slice(e.lastIndexOf("/") + 1) || "GaussianCloud";
}
function St(a) {
  if (!Number.isSafeInteger(a))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return a;
}
function yi(a) {
  if (a !== "auto" && (!Number.isSafeInteger(a) || a <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return a;
}
function _i(a) {
  const e = new ei();
  return new Ks(e, {
    ...a,
    targetPlanner: new oi(e)
  });
}
function Cs(a) {
  a !== null && "dispose" in a && typeof a.dispose == "function" && a.dispose();
}
function wi(a, e) {
  if (!Number.isSafeInteger(a) || a < 0 || a > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function ki(a, e) {
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const t = /* @__PURE__ */ new Set();
  let s = 0;
  for (let i = 0; i < e.nodeIds.length; i++) {
    const r = e.nodeIds[i], o = a.nodes[r], n = a.octree.nodes[r], l = e.lodLevels[i], c = o?.levelCounts[l];
    if (c === void 0 || n === void 0)
      throw new RangeError(
        `GaussianLod packing references invalid node ${r} or level ${l}`
      );
    if (!n.isLeaf)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${r} is internal`
      );
    if (t.has(r))
      throw new Error(`GaussianLod packing contains duplicate node ${r}`);
    t.add(r), s += c;
  }
  if (s !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${s}`
    );
}
function Si(a, e) {
  const t = Ls(
    a.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Ls(a.maxBufferSize, "maxBufferSize"), i = Math.max(
    16,
    (e + 1) ** 2 * zs("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / i);
}
function Ls(a, e) {
  if (!Number.isSafeInteger(a) || a <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return a;
}
const j = 16, _ = 256, Ci = 8192, D = 512, Pt = 4, P = 1 << Pt, ae = 4, ue = _ * ae, X = ue, ne = 32, Li = (
  /* wgsl */
  `
fn count_raster_chunks(
  tile: u32,
  tile_count: u32,
  chunk_size: u32,
  sample_limit: u32,
  tile_offsets: ptr<storage, array<u32>, read>,
  chunk_counts: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (tile >= tile_count) { return 0u; }
  let source_count = (*tile_offsets)[tile + 1u] - (*tile_offsets)[tile];
  let raster_count = select(
    source_count,
    min(source_count, sample_limit),
    sample_limit > 0u
  );
  (*chunk_counts)[tile] = select(
    0u,
    (raster_count + chunk_size - 1u) / chunk_size,
    raster_count > chunk_size
  );
  return 0u;
}
`
);
function Ni(a = !1) {
  return (
    /* wgsl */
    `
fn prepare_raster_chunk_dispatch(
  tile_count: u32,
  task_capacity: u32,
  chunk_counts: ptr<storage, array<u32>, read>,
  chunk_offsets: ptr<storage, array<u32>, read>,
  dispatch: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  var count = 0u;
  if (tile_count > 0u) {
    let last = tile_count - 1u;
    count = (*chunk_offsets)[last] + (*chunk_counts)[last];
  }
  count = min(count, task_capacity);
  (*dispatch)[0] = vec4<u32>(count, 1u, ${a ? 4 : 1}u, 0u);
  return 0u;
}
`
  );
}
const Pi = (
  /* wgsl */
  `
fn emit_raster_chunk_tasks(
  tile: u32,
  tile_count: u32,
  task_capacity: u32,
  chunk_counts: ptr<storage, array<u32>, read>,
  chunk_offsets: ptr<storage, array<u32>, read>,
  tasks: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (tile >= tile_count) { return 0u; }
  let count = (*chunk_counts)[tile];
  let destination = (*chunk_offsets)[tile];
  for (var chunk = 0u; chunk < count; chunk++) {
    if (destination + chunk < task_capacity) {
      (*tasks)[destination + chunk] = vec2<u32>(tile, chunk);
    }
  }
  return 0u;
}
`
);
function Js(a, e) {
  return Math.max(1, Math.ceil(2 * a / e));
}
function Ri(a, e) {
  if (a !== null) {
    if (!Number.isInteger(a) || a < _ || a % _ !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${_} and at least ${_}`
      );
    if (Js(e, a) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const Gi = (
  /* wgsl */
  `
fn prepare_visible_dispatch(
  gaussian_count: u32,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  visible_offsets: ptr<storage, array<u32>, read>,
  state: ptr<storage, array<vec4<u32>>, read_write>,
  radix_block_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  radix_reduce_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  linear_dispatch: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  var count = 0u;
  if (gaussian_count > 0u) {
    let last = gaussian_count - 1u;
    count = (*visible_offsets)[last] + select(0u, 1u, (*projected_mean)[last].w > 0.0);
  }
  let radix_blocks = (count + ${ue - 1}u) / ${ue}u;
  let reduce_chunks = (radix_blocks + ${X - 1}u) / ${X}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${P}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${_ - 1}u) / ${_}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Ii(a) {
  return (
    /* wgsl */
    `
fn compact_visible_${a}(
  gid: u32,
  gaussian_count: u32,
  viewport: vec4<f32>,
  visible_offsets: ptr<storage, array<u32>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (gid >= gaussian_count || (*projected_mean)[gid].w <= 0.0) { return 0u; }
  let depth = (*projected_mean)[gid].z;
  (*records)[(*visible_offsets)[gid]] = vec2<u32>(${a === "float32" ? "bitcast<u32>(depth)" : `u32(round(clamp(
          (depth - viewport.z) / (viewport.w - viewport.z),
          0.0,
          1.0
        ) * 65535.0))`}, gid);
  return 0u;
}
`
  );
}
const Mi = (
  /* wgsl */
  `
fn gather_depth_ordered_tile_counts(
  rank: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  depth_sorted_gaussians: ptr<storage, array<vec2<u32>>, read>,
  tile_counts: ptr<storage, array<u32>, read>,
  ordered_tile_counts: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (rank >= (*state)[0].x) { return 0u; }
  let gaussian_id = (*depth_sorted_gaussians)[rank].y;
  (*ordered_tile_counts)[rank] = (*tile_counts)[gaussian_id];
  return 0u;
}
`
);
class de {
  attributes = [];
  createFloat(e, t, s = 4) {
    return this.track(
      e,
      new Be(new Float32Array(t * s), s)
    );
  }
  createUint(e, t, s = 1) {
    return this.track(
      e,
      new Be(new Uint32Array(t * s), s)
    );
  }
  createIndirect(e) {
    return this.track(
      e,
      new xr(new Uint32Array(4), 4)
    );
  }
  dispose() {
    for (const e of this.attributes) e.dispose();
    this.attributes.length = 0;
  }
  track(e, t) {
    return t.name = e, this.attributes.push(t), t;
  }
}
class Ti {
  constructor(e, t, s, i, r) {
    this.renderer = e, this.visibleDispatch = r, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const o = A(
      Mi
    );
    this.computeNode = o({
      rank: ee,
      state: b(r.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: b(
        i,
        "uvec2",
        t
      ).toReadOnly(),
      tile_counts: b(
        s,
        "uint",
        t
      ).toReadOnly(),
      ordered_tile_counts: b(this.tileCounts, "uint", t)
    }).computeKernel([_]).setName("3DGS gather depth-ordered tile counts WGSL");
  }
  renderer;
  visibleDispatch;
  tileCounts;
  attributes = new de();
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function er(a) {
  return (
    /* wgsl */
    `
fn ${a.functionName}(
  lane: u32,
  group_id: u32,
  length: u32,
  input_values: ptr<storage, array<${a.inputType}>, read>,
  output_values: ptr<storage, array<u32>, read_write>,
  block_sums: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${D}>>
) -> u32 {
  let base = group_id * ${D}u;
  let first = base + lane;
  let second = first + ${_}u;
  (*scratch)[lane] = ${a.readValue("first")};
  (*scratch)[lane + ${_}u] = ${a.readValue("second")};
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${D / 2}u;
  for (var step = 0u; step < 9u; step++) {
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      (*scratch)[right] += (*scratch)[left];
    }
    offset *= 2u;
    active_count /= 2u;
    workgroupBarrier();
  }

  if (lane == 0u) {
    (*block_sums)[group_id] = (*scratch)[${D - 1}u];
    (*scratch)[${D - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${D / 2}u;
  for (var step = 0u; step < 9u; step++) {
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      let value = (*scratch)[left];
      (*scratch)[left] = (*scratch)[right];
      (*scratch)[right] += value;
    }
    active_count *= 2u;
    offset /= 2u;
    workgroupBarrier();
  }

  if (first < length) { (*output_values)[first] = (*scratch)[lane]; }
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${_}u]; }
  return 0u;
}
`
  );
}
const Ai = er({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (a) => `select(0u, (*input_values)[${a}], ${a} < length)`
}), Oi = er({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (a) => `select(0u, 1u, ${a} < length && (*input_values)[${a}].w > 0.0)`
}), Bi = (
  /* wgsl */
  `
fn add_scan_offsets(
  index: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    (*values)[index] += (*block_offsets)[index / ${D}u];
  }
  return 0u;
}
`
);
class Rt {
  output;
  attributes = new de();
  levels = [];
  constructor(e, t, s = "intersections", i = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const r = A(Ai), o = A(
      Oi
    ), n = A(Bi);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const h = Math.ceil(u / D), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        h
      ), f = V("uint", D), m = this.levels.length === 0 && i === "projectedVisibility", v = (m ? o : r)({
        lane: _e,
        group_id: K.x,
        length: g(u),
        input_values: b(
          l,
          m ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: b(c, "uint", u),
        block_sums: b(d, "uint", h),
        scratch: f
      }).computeKernel([_]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
      if (this.levels.push({
        length: u,
        blockCount: h,
        output: c,
        scanNode: v
      }), h <= 1) break;
      l = d, u = h, c = this.attributes.createUint(
        `3dgs.${s}-scan-offsets-${this.levels.length}`,
        u
      );
    }
    for (let h = 0; h < this.levels.length - 1; h++) {
      const d = this.levels[h], f = this.levels[h + 1];
      d.addNode = n({
        index: ee,
        length: g(d.length),
        values: b(d.output, "uint", d.length),
        block_offsets: b(
          f.output,
          "uint",
          f.length
        ).toReadOnly()
      }).compute(d.length, [_]).setName(`3DGS ${s} add scan offsets WGSL ${h}`);
    }
  }
  encode(e) {
    for (const t of this.levels)
      e.compute(t.scanNode, [t.blockCount, 1, 1]);
    for (let t = this.levels.length - 2; t >= 0; t--)
      e.compute(this.levels[t].addNode);
  }
  dispose() {
    for (const e of this.levels)
      e.scanNode.dispose(), e.addNode?.dispose();
    this.attributes.dispose();
  }
}
class $i {
  constructor(e, t) {
    this.camera = e, this.background = t;
  }
  camera;
  background;
  projection = Ue(new $e());
  view = Ue(new $e());
  viewport = Ue(new yr());
  tilesX = Ue(1, "uint");
  tilesY = Ue(1, "uint");
  update(e, t, s, i) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = i;
  }
}
function tr(a) {
  const { center: e, conic: t, powerThreshold: s, tileX: i, tileY: r, onHit: o } = a;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${i}), f32(${r})) * ${j}.0;
      let rect_max = rect_min + vec2<f32>(${j}.0);
      let x_left = ${e}.x < rect_min.x;
      let x_right = ${e}.x > rect_max.x;
      let in_x_range = !(x_left || x_right);
      let y_above = ${e}.y < rect_min.y;
      let y_below = ${e}.y > rect_max.y;
      let in_y_range = !(y_above || y_below);
      var contributes = in_x_range && in_y_range;
      if (!contributes) {
        let corner = vec2<f32>(
          select(rect_max.x, rect_min.x, x_left),
          select(rect_max.y, rect_min.y, y_above)
        );
        let edge = vec2<f32>(
          select(-${j}.0, ${j}.0, x_left),
          select(-${j}.0, ${j}.0, y_above)
        );
        let difference = ${e} - corner;
        let tx_raw = (
          edge.x * ${t}.x * difference.x +
          edge.x * ${t}.y * difference.y
        ) / (edge.x * ${t}.x * edge.x);
        let ty_raw = (
          edge.y * ${t}.y * difference.x +
          edge.y * ${t}.z * difference.y
        ) / (edge.y * ${t}.z * edge.y);
        let tx = select(clamp(tx_raw, 0.0, 1.0), 0.0, in_y_range);
        let ty = select(clamp(ty_raw, 0.0, 1.0), 0.0, in_x_range);
        let closest = corner + vec2<f32>(tx * edge.x, ty * edge.y);
        let delta = closest - ${e};
        let sigma = 0.5 * (
          ${t}.x * delta.x * delta.x +
          ${t}.z * delta.y * delta.y
        ) + ${t}.y * delta.x * delta.y;
        contributes = sigma <= ${s};
      }
      if (contributes) {
        ${o}
      }`
  );
}
const zi = (
  /* wgsl */
  `
fn prepare_dispatch(
  item_count_state: ptr<storage, array<vec4<u32>>, read>,
  capacity: u32,
  tile_counts: ptr<storage, array<u32>, read>,
  intersection_offsets: ptr<storage, array<u32>, read>,
  state: ptr<storage, array<vec4<u32>>, read_write>,
  radix_block_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  radix_reduce_dispatch: ptr<storage, array<vec4<u32>>, read_write>,
  linear_dispatch: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  let item_count = (*item_count_state)[0].x;
  var total = 0u;
  if (item_count > 0u) {
    let last = item_count - 1u;
    total = (*intersection_offsets)[last] + (*tile_counts)[last];
  }
  let count = min(total, capacity);
  let radix_blocks = (count + ${ue - 1}u) / ${ue}u;
  let reduce_chunks = (radix_blocks + ${X - 1}u) / ${X}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${P}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${_ - 1}u) / ${_}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), Ei = (() => {
  const a = tr({
    center: "center",
    conic: "conic",
    powerThreshold: "power_threshold",
    tileX: "tile_x",
    tileY: "tile_y",
    onHit: (
      /* wgsl */
      `
        if (local_index < reserved_count) {
          let destination = (*intersection_offsets)[rank] + local_index;
          if (destination < capacity) {
            let tile_id = u32(tile_y) * tiles.x + u32(tile_x);
            (*records)[destination] = vec2<u32>(tile_id, gaussian_id);
          }
        }
        local_index++;`
    )
  });
  return (
    /* wgsl */
    `
fn emit_intersections(
  rank: u32,
  tiles: vec2<u32>,
  capacity: u32,
  sorted_gaussians: ptr<storage, array<vec2<u32>>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  projected_conic: ptr<storage, array<vec4<f32>>, read>,
  projected_color: ptr<storage, array<vec4<f32>>, read>,
  tile_counts: ptr<storage, array<u32>, read>,
  intersection_offsets: ptr<storage, array<u32>, read>,
  visible_state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (rank >= (*visible_state)[0].x) { return 0u; }
  let gaussian_id = (*sorted_gaussians)[rank].y;
  let mean = (*projected_mean)[gaussian_id];
  let conic = (*projected_conic)[gaussian_id];
  let radius = vec2<f32>(conic.w, (*projected_color)[gaussian_id].w);
  let center = mean.xy;
  let power_threshold = log(mean.w * 255.0);
  let max_tile_x = i32(tiles.x) - 1;
  let max_tile_y = i32(tiles.y) - 1;
  let tile_min = vec2<i32>(
    clamp(i32(floor((center.x - radius.x) / ${j}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${j}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${j}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${j}.0)), 0, max_tile_y)
  );
  let reserved_count = (*tile_counts)[rank];
  var local_index = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
${a}
    }
  }

  // Defensive padding: projection and emission share the same test, but a
  // sentinel keeps every reserved slot initialized if shader optimization
  // ever makes the two evaluations disagree by one ULP.
  let sentinel_tile = tiles.x * tiles.y;
  for (var pad = local_index; pad < reserved_count; pad++) {
    let destination = (*intersection_offsets)[rank] + pad;
    if (destination < capacity) {
      (*records)[destination] = vec2<u32>(sentinel_tile, gaussian_id);
    }
  }
  return 0u;
}
`
  );
})();
class Di {
  constructor(e, t, s, i, r, o, n, l, c, u, h) {
    this.renderer = e, this.capacity = s, this.dispatch = {
      state: this.attributes.createUint("3dgs.dispatch-state", 1, 4),
      radixBlock: this.attributes.createIndirect("3dgs.radix-block-dispatch"),
      radixReduce: this.attributes.createIndirect("3dgs.radix-reduce-dispatch"),
      linear: this.attributes.createIndirect("3dgs.linear-dispatch")
    }, this.buffers = {
      recordsA: this.attributes.createUint(
        "3dgs.intersection-records-a",
        s,
        2
      ),
      recordsB: this.attributes.createUint(
        "3dgs.intersection-records-b",
        s,
        2
      )
    };
    const d = b(
      o,
      "uint",
      t
    ).toReadOnly(), f = b(
      n,
      "uint",
      t
    ).toReadOnly(), m = b(
      r.state,
      "uvec4",
      1
    ).toReadOnly(), v = A(zi);
    this.prepareNode = v({
      item_count_state: m,
      capacity: g(s),
      tile_counts: d,
      intersection_offsets: f,
      state: b(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: b(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: b(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: b(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const p = A(Ei);
    this.emitNode = p({
      rank: ee,
      tiles: He(h.tilesX, h.tilesY),
      capacity: g(s),
      sorted_gaussians: b(
        i,
        "uvec2",
        t
      ).toReadOnly(),
      projected_mean: b(
        l,
        "vec4",
        t
      ).toReadOnly(),
      projected_conic: b(
        c,
        "vec4",
        t
      ).toReadOnly(),
      projected_color: b(
        u,
        "vec4",
        t
      ).toReadOnly(),
      tile_counts: d,
      intersection_offsets: f,
      visible_state: m,
      records: b(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([_]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = r;
  }
  renderer;
  capacity;
  buffers;
  dispatch;
  attributes = new de();
  prepareNode;
  emitNode;
  visibleLinearDispatch;
  encode() {
    this.renderer.compute(this.prepareNode), this.renderer.compute(this.emitNode, this.visibleLinearDispatch.linear);
  }
  async readStats() {
    const [e, t] = await Promise.all([
      this.renderer.getArrayBufferAsync(this.dispatch.state),
      this.renderer.getArrayBufferAsync(this.visibleLinearDispatch.state)
    ]), s = new Uint32Array(e);
    return {
      visibleGaussianCount: new Uint32Array(t)[0] ?? 0,
      intersectionCount: s[0] ?? 0,
      requestedIntersections: s[1] ?? 0,
      intersectionCapacity: this.capacity,
      overflow: (s[3] ?? 0) !== 0,
      profile: null
    };
  }
  dispose() {
    this.prepareNode.dispose(), this.emitNode.dispose(), this.attributes.dispose();
  }
}
const Gt = 10;
class ji {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * Gt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new Be(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new $e();
  inverseModel = new $e();
  cameraWorldPosition = new k();
  cameraLocalPosition = new k();
  update() {
    this.camera.updateWorldMatrix(!0, !1), this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld), this.values.fill(0, this.frameComponentOffset);
    for (const e of this.store.clouds) this.writeCloud(e);
    this.attribute.clearUpdateRanges(), this.attribute.addUpdateRange(
      this.frameComponentOffset,
      this.frameComponentCount
    ), this.attribute.needsUpdate = !0;
  }
  dispose() {
    this.attribute.dispose();
  }
  writeCloud(e) {
    e.updateWorldMatrix(!0, !1), this.modelView.multiplyMatrices(
      this.camera.matrixWorldInverse,
      e.matrixWorld
    ), this.inverseModel.copy(e.matrixWorld).invert(), this.cameraLocalPosition.copy(this.cameraWorldPosition).applyMatrix4(this.inverseModel);
    const t = this.frameComponentOffset + e.objectId * Gt * 4;
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = Ui(e, this.camera) ? 1 : 0;
  }
}
function Ui(a, e) {
  if (!a.layers.test(e.layers)) return !1;
  let t = a, s = a;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof As;
}
function Wi(a) {
  return (
    /* wgsl */
    `
fn project_gaussian_covariance_${a}(
  view: vec4<f32>,
  scale_input: vec3<f32>,
  rotation_input: vec4<f32>,
  model_view: mat4x4<f32>,
  projection: mat4x4<f32>,
  viewport: vec4<f32>
) -> mat4x4<f32> {
  let depth = -view.z;
  if (!(depth > viewport.z && depth < viewport.w)) { return mat4x4<f32>(); }
  let clip = projection * view;
  if (clip.w <= 0.0) { return mat4x4<f32>(); }
  let ndc = clip.xy / clip.w;
  let width = viewport.x;
  let height = viewport.y;
  let center = vec2<f32>(
    (ndc.x * 0.5 + 0.5) * width,
    (0.5 - ndc.y * 0.5) * height
  );

  let scale = max(scale_input, vec3<f32>(1e-7));
  let q = normalize(rotation_input);
  let xx = q.x * q.x;
  let yy = q.y * q.y;
  let zz = q.z * q.z;
  let xy = q.x * q.y;
  let xz = q.x * q.z;
  let yz = q.y * q.z;
  let xw = q.x * q.w;
  let yw = q.y * q.w;
  let zw = q.z * q.w;
  let rotation = mat3x3<f32>(
    vec3<f32>(1.0 - 2.0 * (yy + zz), 2.0 * (xy + zw), 2.0 * (xz - yw)),
    vec3<f32>(2.0 * (xy - zw), 1.0 - 2.0 * (xx + zz), 2.0 * (yz + xw)),
    vec3<f32>(2.0 * (xz + yw), 2.0 * (yz - xw), 1.0 - 2.0 * (xx + yy))
  );
  let covariance_local = rotation * mat3x3<f32>(
    vec3<f32>(scale.x * scale.x, 0.0, 0.0),
    vec3<f32>(0.0, scale.y * scale.y, 0.0),
    vec3<f32>(0.0, 0.0, scale.z * scale.z)
  ) * transpose(rotation);
  let local_to_view = mat3x3<f32>(
    model_view[0].xyz,
    model_view[1].xyz,
    model_view[2].xyz
  );
  let covariance_view = local_to_view * covariance_local * transpose(local_to_view);
  let fx = 0.5 * width * projection[0][0];
  let fy = 0.5 * height * projection[1][1];
  let inverse_depth = 1.0 / depth;
  let j0 = vec3<f32>(
    fx * inverse_depth,
    0.0,
    fx * view.x * inverse_depth * inverse_depth
  );
  let j1 = vec3<f32>(
    0.0,
    -fy * inverse_depth,
    -fy * view.y * inverse_depth * inverse_depth
  );
  let covariance_j0 = covariance_view * j0;
  let covariance_j1 = covariance_view * j1;
  let sigma00_unfiltered = dot(j0, covariance_j0);
  var sigma01 = dot(j0, covariance_j1);
  let sigma11_unfiltered = dot(j1, covariance_j1);
  let original_determinant = ${a === "compensated" ? "max(sigma00_unfiltered * sigma11_unfiltered - sigma01 * sigma01, 0.0)" : "1.0"};
  var sigma00 = sigma00_unfiltered + 0.3;
  var sigma11 = sigma11_unfiltered + 0.3;
  let max_f32 = 3.402823e+38;
  let covariance_is_finite =
    sigma00 == sigma00 && abs(sigma00) <= max_f32 &&
    sigma01 == sigma01 && abs(sigma01) <= max_f32 &&
    sigma11 == sigma11 && abs(sigma11) <= max_f32;
  if (!covariance_is_finite) { return mat4x4<f32>(); }

  let eigen_midpoint = 0.5 * (sigma00 + sigma11);
  let eigen_radius = sqrt(
    0.25 * (sigma00 - sigma11) * (sigma00 - sigma11) + sigma01 * sigma01
  );
  let lambda_min = clamp(eigen_midpoint - eigen_radius, 1e-6, 1e4);
  let lambda_max = clamp(eigen_midpoint + eigen_radius, 1e-6, 1e4);
  let theta = 0.5 * atan2(2.0 * sigma01, sigma00 - sigma11);
  let cs = cos(theta);
  let sn = sin(theta);
  sigma00 = lambda_min * sn * sn + lambda_max * cs * cs;
  sigma01 = (lambda_max - lambda_min) * cs * sn;
  sigma11 = lambda_min * cs * cs + lambda_max * sn * sn;
  let determinant = sigma00 * sigma11 - sigma01 * sigma01;
  if (determinant <= 1e-8) { return mat4x4<f32>(); }
  let inverse_determinant = 1.0 / determinant;
  let conic = vec3<f32>(
    sigma11 * inverse_determinant,
    -sigma01 * inverse_determinant,
    sigma00 * inverse_determinant
  );
  return mat4x4<f32>(
    vec4<f32>(center, depth, 1.0),
    vec4<f32>(conic, determinant),
    vec4<f32>(sigma00, sigma01, sigma11, original_determinant),
    vec4<f32>(0.0)
  );
}
`
  );
}
function Fi(a) {
  const e = a === "rgb8e8" ? "u32" : "vec4<f32>", t = a === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (i) => {
    const r = i === 0 ? "base" : `base + ${i}u`;
    return a === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${r}])` : `(*sh_coefficients)[${r}].xyz`;
  };
  return (
    /* wgsl */
    `
fn evaluate_gaussian_sh_${a}(
  gid: u32,
  sh_degree: u32,
  direction: vec3<f32>,
  sh_coefficients: ptr<storage, array<${e}>, read>
) -> vec3<f32> {
  let x = direction.x;
  let y = direction.y;
  let z = direction.z;
  let coefficient_count = (sh_degree + 1u) * (sh_degree + 1u);
  let base = gid * coefficient_count;
  var color = 0.28209479177387814 * ${s(0)};
  if (sh_degree >= 1u) {
    color += (-0.4886025119029199 * y) * ${s(1)};
    color += ( 0.4886025119029199 * z) * ${s(2)};
    color += (-0.4886025119029199 * x) * ${s(3)};
  }
  if (sh_degree >= 2u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += ( 1.0925484305920792 * x * y) * ${s(4)};
    color += (-1.0925484305920792 * y * z) * ${s(5)};
    color += ( 0.31539156525252005 * (2.0 * zz - xx - yy)) * ${s(6)};
    color += (-1.0925484305920792 * x * z) * ${s(7)};
    color += ( 0.5462742152960396 * (xx - yy)) * ${s(8)};
  }
  if (sh_degree >= 3u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += (-0.5900435899266435 * y * (3.0 * xx - yy)) * ${s(9)};
    color += ( 2.890611442640554 * x * y * z) * ${s(10)};
    color += (-0.4570457994644658 * y * (4.0 * zz - xx - yy)) * ${s(11)};
    color += ( 0.3731763325901154 * z * (2.0 * zz - 3.0 * xx - 3.0 * yy)) * ${s(12)};
    color += (-0.4570457994644658 * x * (4.0 * zz - xx - yy)) * ${s(13)};
    color += ( 1.445305721320277 * z * (xx - yy)) * ${s(14)};
    color += (-0.5900435899266435 * x * (xx - 3.0 * yy)) * ${s(15)};
  }
  return clamp(color + vec3<f32>(0.5), vec3<f32>(0.0), vec3<f32>(1.0));
}
${t}
`
  );
}
const Vi = (
  /* wgsl */
  `
fn subpixel_has_sample(
  center: vec2<f32>,
  conic: vec3<f32>,
  power_threshold: f32,
  extent: vec2<f32>,
  viewport: vec2<u32>
) -> bool {
  if (extent.x * 2.0 > 1.0 || extent.y * 2.0 > 1.0) { return true; }
  let pixel_min = vec2<i32>(
    max(i32(ceil(center.x - extent.x - 0.5)), 0),
    max(i32(ceil(center.y - extent.y - 0.5)), 0)
  );
  let pixel_max = vec2<i32>(
    min(i32(floor(center.x + extent.x - 0.5)), i32(viewport.x) - 1),
    min(i32(floor(center.y + extent.y - 0.5)), i32(viewport.y) - 1)
  );
  for (var pixel_y = pixel_min.y; pixel_y <= pixel_max.y; pixel_y++) {
    for (var pixel_x = pixel_min.x; pixel_x <= pixel_max.x; pixel_x++) {
      let delta = vec2<f32>(f32(pixel_x) + 0.5, f32(pixel_y) + 0.5) - center;
      let sigma = 0.5 * (
        conic.x * delta.x * delta.x +
        2.0 * conic.y * delta.x * delta.y +
        conic.z * delta.y * delta.y
      );
      if (sigma <= power_threshold) { return true; }
    }
  }
  return false;
}
`
);
function qi() {
  return (
    /* wgsl */
    `
fn count_contributing_tiles(
  center: vec2<f32>,
  conic: vec3<f32>,
  power_threshold: f32,
  tile_min: vec2<i32>,
  tile_max: vec2<i32>
) -> u32 {
  var count = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
${tr({
      center: "center",
      conic: "conic",
      powerThreshold: "power_threshold",
      tileX: "tile_x",
      tileY: "tile_y",
      onHit: "count++;"
    })}
    }
  }
  return count;
}
`
  );
}
const sr = /* @__PURE__ */ new Set([
  At,
  Ot,
  at,
  nt,
  ot,
  lt,
  $t,
  zt
]), rr = /* @__PURE__ */ new Set([
  ...sr,
  Ze,
  Et
]), Ki = /* @__PURE__ */ new Set([
  ...rr,
  Dt,
  jt,
  Ut,
  Wt
]);
class Yi {
  constructor(e, t, s, i, r, o = !0) {
    this.data = e, this.frame = t, this.antialiasMode = i, this.subpixelSampleCulling = o, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      e.count
    ), this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      e.count
    ), this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      e.count
    ), this.rebuild(r);
  }
  data;
  frame;
  antialiasMode;
  subpixelSampleCulling;
  projectedMean;
  projectedConic;
  projectedColor;
  tileCounts;
  attributes = new de();
  computeNode = null;
  rebuild(e) {
    for (const s of [
      e.gaussianPositionLocalNode,
      e.gaussianPositionWorldNode,
      e.gaussianScaleNode,
      e.gaussianRotationNode,
      e.gaussianOpacityNode,
      e.gaussianColorNode,
      e.gaussianVisibilityNode
    ])
      Vs(s, Xe, "projection");
    Ne(
      e.gaussianPositionLocalNode,
      sr,
      "gaussianPositionLocalNode"
    );
    for (const [s, i] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      Ne(i, rr, s);
    Ne(
      e.gaussianOpacityNode,
      Ki,
      "gaussianOpacityNode"
    ), Ne(
      e.gaussianColorNode,
      Xe,
      "gaussianColorNode"
    ), Ne(
      e.gaussianVisibilityNode,
      Xe,
      "gaussianVisibilityNode"
    );
    const t = this.createComputeNode(e);
    this.computeNode?.dispose(), this.computeNode = t;
  }
  encode(e) {
    if (this.computeNode === null)
      throw new Error("ProjectionStage has no compute node");
    e.compute(this.computeNode);
  }
  dispose() {
    this.computeNode?.dispose(), this.computeNode = null, this.attributes.dispose();
  }
  createComputeNode(e) {
    const { data: t, frame: s } = this, i = b(t.means, "vec4", t.count).toReadOnly(), r = b(
      t.scalesOpacity,
      "vec4",
      t.count
    ).toReadOnly(), o = b(t.rotations, "vec4", t.count).toReadOnly(), n = t.shFormat === "rgb8e8" ? b(
      t.shCoefficients,
      "uint",
      t.count * t.shCoefficientCount
    ).toReadOnly() : b(
      t.shCoefficients,
      "vec4",
      t.count * t.shCoefficientCount
    ).toReadOnly(), l = b(
      this.projectedMean,
      "vec4",
      this.projectedMean.count
    ), c = b(this.projectedConic, "vec4", t.count), u = b(this.projectedColor, "vec4", t.count), h = b(this.tileCounts, "uint", t.count), d = A(
      Wi(this.antialiasMode)
    ), f = A(Fi(t.shFormat)), m = A(qi()), v = A(Vi);
    return rt(() => {
      const x = g(ee);
      T(x.greaterThanEqual(g(t.count)), () => {
        ge();
      }), h.element(x).assign(g(0)), l.element(x).assign(Q(0));
      const S = i.element(x), N = S.xyz, L = g(S.w), y = r.element(x), R = y.xyz, M = y.w, G = o.element(x), w = g(t.count).add(
        L.mul(g(Gt))
      ), C = ds(
        l.element(w),
        l.element(w.add(1)),
        l.element(w.add(2)),
        l.element(w.add(3))
      ), $ = ds(
        l.element(w.add(4)),
        l.element(w.add(5)),
        l.element(w.add(6)),
        l.element(w.add(7))
      ), O = l.element(w.add(8)).xyz, z = l.element(w.add(9)).x.greaterThan(0);
      T(z.not(), () => {
        ge();
      });
      const B = /* @__PURE__ */ new Map([
        [At, () => x],
        [Ot, () => L],
        [at, () => N],
        [nt, () => R],
        [ot, () => G],
        [lt, () => M],
        [$t, () => C],
        [zt, () => z]
      ]), U = Ce(
        e.gaussianPositionLocalNode,
        B
      ).toVar("gaussianPositionLocalValue"), Pe = C.mul(Q(U, 1)).xyz, Y = new Map(B);
      Y.set(Ze, () => Pe);
      const he = Pr(U.sub(O));
      Y.set(Et, () => he);
      let te;
      if (e.gaussianPositionWorldNode === Ze)
        te = $.mul(Q(U, 1));
      else {
        const je = Ce(
          e.gaussianPositionWorldNode,
          Y
        ).toVar("gaussianPositionWorldValue");
        te = s.view.mul(Q(je, 1));
      }
      te = te.toVar("gaussianViewPosition");
      const Re = Ce(e.gaussianScaleNode, Y).toVar(
        "gaussianScaleValue"
      ), Qe = Ce(
        e.gaussianRotationNode,
        Y
      ).toVar("gaussianRotationValue"), pe = d({
        view: te,
        scale_input: Re,
        rotation_input: Qe,
        model_view: $,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      T(pe.element(0).w.lessThanEqual(0), () => {
        ge();
      });
      const Z = pe.element(0).xy, se = pe.element(0).z, we = pe.element(1).xyz, oe = pe.element(1).w, ke = pe.element(2).xyz, Je = pe.element(2).w, fe = new Map(Y);
      fe.set(Dt, () => se), fe.set(jt, () => Z), fe.set(Ut, () => Le(ke.xz)), fe.set(
        Wt,
        () => Le(oe).mul(Math.PI)
      );
      const Ge = Ce(
        e.gaussianOpacityNode,
        fe
      ).clamp(0, 1), le = this.antialiasMode === "compensated" ? Ge.mul(
        Le(ye(Je.div(oe), 0, 1))
      ) : Ge;
      T(le.lessThan(F(1 / 255)), () => {
        ge();
      });
      const me = Rr(le.mul(255)), Ee = Le(
        me.mul(2).mul(ye(ke.x, 1e-12, 1e4))
      ), Se = Le(
        me.mul(2).mul(ye(ke.z, 1e-12, 1e4))
      ), Ie = hs(Ee), Me = hs(Se);
      T(Ie.lessThanEqual(0).or(Me.lessThanEqual(0)), () => {
        ge();
      });
      const E = xe(Ie, Me), be = Z.sub(E), Te = Z.add(E);
      if (T(
        Te.x.lessThan(0).or(Te.y.lessThan(0)).or(be.x.greaterThanEqual(s.viewport.x)).or(be.y.greaterThanEqual(s.viewport.y)),
        () => {
          ge();
        }
      ), this.subpixelSampleCulling) {
        const je = v({
          center: Z,
          conic: we,
          power_threshold: me,
          extent: xe(Ee, Se),
          viewport: He(s.viewport.xy)
        });
        T(je.not(), () => {
          l.element(x).assign(Q(Z, se, -1)), ge();
        });
      }
      const De = Ye(ps(s.tilesX), ps(s.tilesY)).sub(1), ut = Ye(
        ye(Lt(be.div(F(j))), xe(0), xe(De))
      ), dt = Ye(
        ye(Lt(Te.div(F(j))), xe(0), xe(De))
      ), H = f({
        gid: x,
        sh_degree: g(t.shDegree),
        direction: he,
        sh_coefficients: n
      }), W = new Map(fe);
      W.set(Bt, () => H), W.set(Es, () => be), W.set(Ds, () => Te);
      const re = Ce(
        e.gaussianVisibilityNode,
        W
      );
      T(re.not(), () => {
        ge();
      });
      const q = m({
        center: Z,
        conic: we,
        power_threshold: me,
        tile_min: ut,
        tile_max: dt
      });
      T(q.equal(0), () => {
        ge();
      });
      const J = Ce(
        e.gaussianColorNode,
        W
      ).clamp(0, 1);
      l.element(x).assign(Q(Z, se, le)), c.element(x).assign(Q(we, Ie)), u.element(x).assign(Q(J, Me)), h.element(x).assign(q);
    })().compute(t.count, [_]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Ce(a, e) {
  return a.context({ overrideNodes: e });
}
const Xi = (
  /* wgsl */
  `
fn profile_subpixel_coverage(
  index: u32,
  gaussian_count: u32,
  viewport: vec2<u32>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  projected_conic: ptr<storage, array<vec4<f32>>, read>,
  zero_pixel_flags: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (index >= gaussian_count) { return 0u; }
  (*zero_pixel_flags)[index] = 0u;

  let mean = (*projected_mean)[index];
  if (mean.w < 0.0) {
    (*zero_pixel_flags)[index] = 1u;
    return 0u;
  }
  if (mean.w <= 0.0) { return 0u; }
  let conic = (*projected_conic)[index].xyz;
  let conic_determinant = conic.x * conic.z - conic.y * conic.y;
  if (conic_determinant <= 1e-12) { return 0u; }
  let power_threshold = log(mean.w * 255.0);
  if (power_threshold <= 0.0) { return 0u; }

  let sigma00 = conic.z / conic_determinant;
  let sigma11 = conic.x / conic_determinant;
  let extent = sqrt(max(
    vec2<f32>(2.0 * power_threshold) * vec2<f32>(sigma00, sigma11),
    vec2<f32>(0.0)
  ));
  if (extent.x * 2.0 > 1.0 || extent.y * 2.0 > 1.0) {
    return 0u;
  }

  let center = mean.xy;
  let pixel_min = vec2<i32>(
    max(i32(ceil(center.x - extent.x - 0.5)), 0),
    max(i32(ceil(center.y - extent.y - 0.5)), 0)
  );
  let pixel_max = vec2<i32>(
    min(i32(floor(center.x + extent.x - 0.5)), i32(viewport.x) - 1),
    min(i32(floor(center.y + extent.y - 0.5)), i32(viewport.y) - 1)
  );
  var has_sample = false;
  for (var pixel_y = pixel_min.y; pixel_y <= pixel_max.y; pixel_y++) {
    for (var pixel_x = pixel_min.x; pixel_x <= pixel_max.x; pixel_x++) {
      let delta = vec2<f32>(f32(pixel_x) + 0.5, f32(pixel_y) + 0.5) - center;
      let sigma = 0.5 * (
        conic.x * delta.x * delta.x +
        2.0 * conic.y * delta.x * delta.y +
        conic.z * delta.y * delta.y
      );
      if (sigma <= power_threshold) { has_sample = true; }
    }
  }
  (*zero_pixel_flags)[index] = select(1u, 0u, has_sample);
  return 0u;
}
`
), Hi = _, ir = 256, Zi = [2048, 4096, 8192];
function Qi(a, e = ir, t = 1) {
  const s = Math.max(0, a.length - 1);
  if (s === 0)
    return {
      max: 0,
      mean: 0,
      median: 0,
      p95: 0,
      p99: 0,
      tilesOver256: 0,
      tilesOver512: 0,
      tilesOver1024: 0,
      tilesOver2048: 0,
      totalBatches: 0,
      maxBatches: 0
    };
  const i = new Uint32Array(s);
  let r = 0, o = 0, n = 0, l = 0, c = 0, u = 0, h = 0, d = 0;
  for (let f = 0; f < s; f++) {
    const m = Math.max(0, a[f + 1] - a[f]);
    i[f] = m, r += m, o = Math.max(o, m), m > 256 && n++, m > 512 && l++, m > 1024 && c++, m > 2048 && u++;
    const v = Math.ceil(m / e) * t;
    h += v, d = Math.max(d, v);
  }
  return i.sort(), {
    max: o,
    mean: r / s,
    median: Ji(i),
    p95: Ps(i, 0.95),
    p99: Ps(i, 0.99),
    tilesOver256: n,
    tilesOver512: l,
    tilesOver1024: c,
    tilesOver2048: u,
    totalBatches: h,
    maxBatches: d
  };
}
function Ns(a, e, t = ir, s = 1) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const i = Math.max(0, a.length - 1);
  let r = 0, o = 0, n = 0, l = 0, c = 0;
  for (let h = 0; h < i; h++) {
    const d = Math.max(0, a[h + 1] - a[h]), f = Math.min(d, e), m = d - f;
    r += f, o += m, m > 0 && n++;
    const v = Math.ceil(f / t) * s;
    l += v, c = Math.max(c, v);
  }
  const u = r + o;
  return {
    cap: e,
    rasterizedIntersections: r,
    droppedIntersections: o,
    droppedFraction: u === 0 ? 0 : o / u,
    affectedTiles: n,
    totalBatches: l,
    maxBatches: c
  };
}
function Ji(a) {
  const e = Math.floor(a.length / 2);
  return a.length % 2 !== 0 ? a[e] : (a[e - 1] + a[e]) * 0.5;
}
function Ps(a, e) {
  const t = Math.max(0, Math.ceil(a.length * e) - 1);
  return a[t];
}
class ea {
  constructor(e, t, s, i, r, o, n = !1) {
    this.renderer = e, this.maxRasterizedSplatsPerTile = o, this.rasterSubtiles = n, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const l = A(Xi);
    this.computeNode = l({
      index: ee,
      gaussian_count: g(t),
      viewport: He(r.viewport.xy),
      projected_mean: b(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: b(
        i,
        "vec4",
        i.count
      ).toReadOnly(),
      zero_pixel_flags: b(this.zeroPixelFlags, "uint", t)
    }).compute(t, [Hi]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
  rasterSubtiles;
  attributes = new de();
  zeroPixelFlags;
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode);
  }
  async readStats(e) {
    const [t, s] = await Promise.all([
      this.renderer.getArrayBufferAsync(e),
      this.renderer.getArrayBufferAsync(this.zeroPixelFlags)
    ]), i = new Uint32Array(s);
    let r = 0;
    for (const c of i) r += c;
    const o = new Uint32Array(t), n = this.rasterSubtiles ? 64 : 256, l = this.rasterSubtiles ? 4 : 1;
    return {
      tileLoads: Qi(o, n, l),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : Ns(
        o,
        this.maxRasterizedSplatsPerTile,
        n,
        l
      ),
      tileCapEstimates: Zi.map(
        (c) => Ns(o, c, n, l)
      ),
      zeroPixelSubpixelSplats: r
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function ta(a) {
  return (
    /* wgsl */
    `
fn radix_histogram_${a}(
  lane: u32,
  block_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  partials: ptr<workgroup, array<u32, ${P * ne}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${P}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${ae}u; item++) {
      let position = block_start + item * ${_}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${a}u) & ${P - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${ne}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${P}u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[lane * ${ne}u + subgroup];
    }
    (*block_histograms)[lane * block_stride + block_index] = total;
  }
  return 0u;
}
`
  );
}
const sa = (
  /* wgsl */
  `
fn reduce_radix_histograms(
  lane: u32,
  group_id: vec3<u32>,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  reduced: ptr<storage, array<u32>, read_write>,
  partials: ptr<workgroup, array<u32, ${ne}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${X}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ae}u; item++) {
    let block = chunk_start + item * ${_}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  let subgroup_total = subgroupAdd(local_sum);
  if (subgroup_lane == 0u) { (*partials)[subgroup_index] = subgroup_total; }
  workgroupBarrier();
  if (lane == 0u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[subgroup];
    }
    (*reduced)[digit * chunk_stride + chunk] = total;
  }
  return 0u;
}
`
), ra = (
  /* wgsl */
  `
fn scan_radix_reduced(
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  reduced: ptr<storage, array<u32>, read_write>
) -> u32 {
  let chunk_count = ((*state)[0].z + ${X - 1}u) /
    ${X}u;
  var running = 0u;
  for (var digit = 0u; digit < ${P}u; digit++) {
    for (var chunk = 0u; chunk < chunk_count; chunk++) {
      let index = digit * chunk_stride + chunk;
      let value = (*reduced)[index];
      (*reduced)[index] = running;
      running += value;
    }
  }
  return 0u;
}
`
), ia = (
  /* wgsl */
  `
fn scan_add_radix_histograms(
  lane: u32,
  group_id: vec3<u32>,
  block_stride: u32,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  reduced: ptr<storage, array<u32>, read>,
  block_prefixes: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${X}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${X}u;
  for (var item = 0u; item < ${ae}u; item++) {
    let local = item * ${_}u + lane;
    let block = chunk_start + local;
    var value = 0u;
    if (block < block_count) {
      value = (*block_histograms)[digit * block_stride + block];
    }
    (*scratch)[local] = value;
  }
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${X / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${ae}u; item++) {
      let worker = item * ${_}u + lane;
      if (worker < active_count) {
        let left = offset * (2u * worker + 1u) - 1u;
        let right = offset * (2u * worker + 2u) - 1u;
        (*scratch)[right] += (*scratch)[left];
      }
    }
    offset *= 2u;
    active_count /= 2u;
    workgroupBarrier();
  }
  if (lane == 0u) { (*scratch)[${X - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${X / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${ae}u; item++) {
      let worker = item * ${_}u + lane;
      if (worker < active_count) {
        let left = offset * (2u * worker + 1u) - 1u;
        let right = offset * (2u * worker + 2u) - 1u;
        let value = (*scratch)[left];
        (*scratch)[left] = (*scratch)[right];
        (*scratch)[right] += value;
      }
    }
    active_count *= 2u;
    offset /= 2u;
    workgroupBarrier();
  }

  let global_base = (*reduced)[digit * chunk_stride + chunk];
  for (var item = 0u; item < ${ae}u; item++) {
    let local = item * ${_}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`
);
function aa(a) {
  return (
    /* wgsl */
    `
fn radix_scatter_${a}(
  lane: u32,
  block_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<vec2<u32>>, read>,
  records_out: ptr<storage, array<vec2<u32>>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  block_bases: ptr<workgroup, array<u32, ${P}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${P}>>,
  partials: ptr<workgroup, array<u32, ${P * ne}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${P}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${_}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${a}u) & ${P - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${P}u; target_digit++) {
      let matches = select(0u, 1u, valid && digit == target_digit);
      let prefix = subgroupExclusiveAdd(matches);
      let total = subgroupAdd(matches);
      if (subgroup_lane == 0u) {
        (*partials)[target_digit * ${ne}u + subgroup_index] = total;
      }
      if (digit == target_digit) { subgroup_prefix = prefix; }
    }
    workgroupBarrier();

    if (valid) {
      var preceding_subgroups = 0u;
      for (var subgroup = 0u; subgroup < subgroup_index; subgroup++) {
        preceding_subgroups += (*partials)[digit * ${ne}u + subgroup];
      }
      let destination = (*block_bases)[digit]
        + (*local_digit_counts)[digit]
        + preceding_subgroups
        + subgroup_prefix;
      (*records_out)[destination] = record;
    }
    workgroupBarrier();

    if (lane < ${P}u) {
      var batch_total = 0u;
      for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
        batch_total += (*partials)[lane * ${ne}u + subgroup];
      }
      (*local_digit_counts)[lane] += batch_total;
    }
    workgroupBarrier();
  }
  return 0u;
}
`
  );
}
function na(a) {
  return (
    /* wgsl */
    `
fn radix_workgroup_histogram_${a}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  histogram: ptr<workgroup, array<atomic<u32>, ${P}>>
) -> u32 {
  if (lane < ${P}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${_}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${a}u) & ${P - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${P}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`
  );
}
const oa = (
  /* wgsl */
  `
fn reduce_radix_histograms_workgroup(
  lane: u32,
  group_id: vec3<u32>,
  block_stride: u32,
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read>,
  reduced: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${_}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${X}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ae}u; item++) {
    let block = chunk_start + item * ${_}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${_ / 2}u;
  for (var step = 0u; step < 8u; step++) {
    if (lane < active_count) {
      (*scratch)[lane] += (*scratch)[lane + active_count];
    }
    active_count /= 2u;
    workgroupBarrier();
  }
  if (lane == 0u) {
    (*reduced)[digit * chunk_stride + chunk] = (*scratch)[0];
  }
  return 0u;
}
`
);
function la(a) {
  return (
    /* wgsl */
    `
fn radix_workgroup_scatter_${a}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<vec2<u32>>, read>,
  records_out: ptr<storage, array<vec2<u32>>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  block_bases: ptr<workgroup, array<u32, ${P}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${P}>>,
  shared_digits: ptr<workgroup, array<u32, ${_}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${P * (_ / 32)}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let words_per_digit = ${_ / 32}u;
  if (lane < ${P}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${_}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${P}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${a}u) & ${P - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${P * (_ / 32)}u) {
      let mask_digit = lane / words_per_digit;
      let word = lane % words_per_digit;
      let first_lane = word * 32u;
      var mask = 0u;
      for (var bit_index = 0u; bit_index < 32u; bit_index++) {
        if ((*shared_digits)[first_lane + bit_index] == mask_digit) {
          mask |= 1u << bit_index;
        }
      }
      (*shared_digit_masks)[lane] = mask;
    }
    workgroupBarrier();

    if (valid) {
      let word = lane / 32u;
      let bit_index = lane % 32u;
      let mask_start = digit * words_per_digit;
      var local_rank = 0u;
      for (var previous_word = 0u; previous_word < word; previous_word++) {
        local_rank += countOneBits(
          (*shared_digit_masks)[mask_start + previous_word]
        );
      }
      local_rank += countOneBits(
        (*shared_digit_masks)[mask_start + word] &
          ((1u << bit_index) - 1u)
      );
      let destination = (*block_bases)[digit]
        + (*local_digit_counts)[digit]
        + local_rank;
      (*records_out)[destination] = record;
    }
    workgroupBarrier();

    if (lane < ${P}u) {
      var batch_total = 0u;
      for (var word = 0u; word < words_per_digit; word++) {
        batch_total += countOneBits(
          (*shared_digit_masks)[lane * words_per_digit + word]
        );
      }
      (*local_digit_counts)[lane] += batch_total;
    }
    workgroupBarrier();
  }
  return 0u;
}
`
  );
}
class Rs {
  constructor(e, t, s, i, r, o) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = i, this.dispatch = r, this.backend = o, this.maxRadixBlocks = Math.ceil(s / ue), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / X), this.blockHistograms = this.attributes.createUint(
      `3dgs.${t}-radix-histograms`,
      this.maxRadixBlocks * P
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${t}-radix-prefixes`,
      this.maxRadixBlocks * P
    ), this.reduced = this.attributes.createUint(
      `3dgs.${t}-radix-reduced`,
      this.maxReduceChunks * P
    );
    const n = b(r.state, "uvec4", 1).toReadOnly(), l = b(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), c = A(
      o === "subgroup" ? sa : oa
    ), u = {
      lane: _e,
      group_id: K,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: b(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (u.subgroup_index = gt, u.subgroup_lane = mt, u.subgroup_size = bt, u.partials = V("uint", ne)) : u.scratch = V("uint", _), this.reduceNode = c(u).computeKernel([_]).setName(`3DGS ${t} radix reduce WGSL`);
    const h = A(ra);
    this.scanReducedNode = h({
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      reduced: b(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const d = A(
      ia
    );
    this.scanAddNode = d({
      lane: _e,
      group_id: K,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: b(this.reduced, "uint", this.reduced.count).toReadOnly(),
      block_prefixes: b(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ),
      scratch: V("uint", X)
    }).computeKernel([_]).setName(`3DGS ${t} radix scan-add WGSL`), this.sortedRecords = i.recordsA;
  }
  renderer;
  label;
  capacity;
  buffers;
  dispatch;
  backend;
  sortedRecords;
  attributes = new de();
  blockHistograms;
  blockPrefixes;
  reduced;
  reduceNode;
  scanReducedNode;
  scanAddNode;
  maxRadixBlocks;
  maxReduceChunks;
  passes = [];
  configure(e) {
    this.disposePasses();
    const t = Math.ceil(Math.max(0, e) / Pt);
    this.passes = Array.from(
      { length: t },
      (s, i) => this.createPass(i, i * Pt)
    ), this.sortedRecords = t % 2 === 0 ? this.buffers.recordsA : this.buffers.recordsB;
  }
  get passCount() {
    return this.passes.length;
  }
  encode(e = !1) {
    for (const t of this.passes)
      this.renderer.compute(t.histogram, this.dispatch.radixBlock), this.renderer.compute(this.reduceNode, this.dispatch.radixReduce), this.renderer.compute(this.scanReducedNode), this.renderer.compute(this.scanAddNode, this.dispatch.radixReduce), this.renderer.compute(t.scatter, this.dispatch.radixBlock);
  }
  dispose() {
    this.disposePasses(), this.reduceNode.dispose(), this.scanReducedNode.dispose(), this.scanAddNode.dispose(), this.attributes.dispose();
  }
  createPass(e, t) {
    const s = e % 2 === 0, i = s ? this.buffers.recordsA : this.buffers.recordsB, r = s ? this.buffers.recordsB : this.buffers.recordsA, o = b(this.dispatch.state, "uvec4", 1).toReadOnly(), n = b(
      i,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = A(
      this.backend === "subgroup" ? ta(t) : na(t)
    ), c = {
      lane: _e,
      block_index: K.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records: n,
      block_histograms: b(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (c.subgroup_index = gt, c.subgroup_lane = mt, c.subgroup_size = bt, c.partials = V(
      "uint",
      P * ne
    )) : c.histogram = V("atomic<u32>", P);
    const u = l(c).computeKernel([_]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), h = A(
      this.backend === "subgroup" ? aa(t) : la(t)
    ), d = {
      lane: _e,
      block_index: K.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records_in: n,
      records_out: b(r, "uvec2", this.capacity),
      block_prefixes: b(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: V("uint", P),
      local_digit_counts: V("uint", P)
    };
    this.backend === "subgroup" ? (d.subgroup_index = gt, d.subgroup_lane = mt, d.subgroup_size = bt, d.partials = V(
      "uint",
      P * ne
    )) : (d.shared_digits = V("uint", _), d.shared_digit_masks = V(
      "uint",
      P * (_ / 32)
    ));
    const f = h(d).computeKernel([_]).setName(`3DGS ${this.label} radix scatter WGSL ${e}`);
    return { histogram: u, scatter: f };
  }
  disposePasses() {
    for (const e of this.passes)
      e.histogram.dispose(), e.scatter.dispose();
    this.passes = [];
  }
}
const ca = (
  /* wgsl */
  `
fn clear_tile_offsets(
  index: u32,
  tile_count: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  offsets: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (index <= tile_count) {
    (*offsets)[index] = select(
      0xffffffffu,
      (*state)[0].x,
      index == tile_count
    );
  }
  return 0u;
}
`
);
function ua(a) {
  return (
    /* wgsl */
    `
fn find_tile_boundaries_${a}(
  index: u32,
  tile_count: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  offsets: ptr<storage, array<u32>, read_write>
) -> u32 {
  if (index >= (*state)[0].x) { return 0u; }
  let tile = (*records)[index].x;
  // tile == tile_count is the defensive padding sentinel. Recording its
  // first position keeps padding out of the last real tile's range.
  if (tile <= tile_count && (index == 0u || (*records)[index - 1u].x != tile)) {
    (*offsets)[tile] = index;
  }
  return 0u;
}
`
  );
}
const da = (
  /* wgsl */
  `
fn suffix_min_blocks(
  lane: u32,
  group_id: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_mins: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${D}>>
) -> u32 {
  let base = group_id * ${D}u;
  let first_local = lane;
  let second_local = lane + ${_}u;
  let first_source = base + (${D - 1}u - first_local);
  let second_source = base + (${D - 1}u - second_local);
  var first_value = 0xffffffffu;
  var second_value = 0xffffffffu;
  if (first_source < length) { first_value = (*values)[first_source]; }
  if (second_source < length) { second_value = (*values)[second_source]; }
  (*scratch)[first_local] = first_value;
  (*scratch)[second_local] = second_value;
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${D / 2}u;
  for (var step = 0u; step < 9u; step++) {
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      (*scratch)[right] = min((*scratch)[right], (*scratch)[left]);
    }
    offset *= 2u;
    active_count /= 2u;
    workgroupBarrier();
  }

  if (lane == 0u) {
    (*block_mins)[group_id] = (*scratch)[${D - 1}u];
    (*scratch)[${D - 1}u] = 0xffffffffu;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${D / 2}u;
  for (var step = 0u; step < 9u; step++) {
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      let value = (*scratch)[left];
      (*scratch)[left] = (*scratch)[right];
      (*scratch)[right] = min((*scratch)[right], value);
    }
    active_count *= 2u;
    offset /= 2u;
    workgroupBarrier();
  }

  if (first_source < length) {
    (*values)[first_source] = min(first_value, (*scratch)[first_local]);
  }
  if (second_source < length) {
    (*values)[second_source] = min(second_value, (*scratch)[second_local]);
  }
  return 0u;
}
`
), ha = (
  /* wgsl */
  `
fn add_suffix_block_mins(
  index: u32,
  length: u32,
  block_count: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_suffix_mins: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    let next_block = index / ${D}u + 1u;
    if (next_block < block_count) {
      (*values)[index] = min(
        (*values)[index],
        (*block_suffix_mins)[next_block]
      );
    }
  }
  return 0u;
}
`
);
class pa {
  attributes = new de();
  levels = [];
  constructor(e, t) {
    const s = A(da), i = A(ha);
    let r = e, o = t;
    for (; ; ) {
      const n = this.levels.length, l = Math.ceil(o / D), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${n}`,
        l
      ), u = s({
        lane: _e,
        group_id: K.x,
        length: g(o),
        values: b(r, "uint", o),
        block_mins: b(c, "uint", l),
        scratch: V("uint", D)
      }).computeKernel([_]).setName(`3DGS tile offset suffix scan WGSL ${n}`);
      if (this.levels.push({
        length: o,
        blockCount: l,
        values: r,
        scanNode: u
      }), l <= 1) break;
      r = c, o = l;
    }
    for (let n = 0; n < this.levels.length - 1; n++) {
      const l = this.levels[n], c = this.levels[n + 1];
      l.addNode = i({
        index: ee,
        length: g(l.length),
        block_count: g(c.length),
        values: b(l.values, "uint", l.length),
        block_suffix_mins: b(
          c.values,
          "uint",
          c.length
        ).toReadOnly()
      }).compute(l.length, [_]).setName(`3DGS tile add suffix block mins WGSL ${n}`);
    }
  }
  encode(e) {
    for (const t of this.levels)
      e.compute(t.scanNode, [t.blockCount, 1, 1]);
    for (let t = this.levels.length - 2; t >= 0; t--)
      e.compute(this.levels[t].addNode);
  }
  dispose() {
    for (const e of this.levels)
      e.scanNode.dispose(), e.addNode?.dispose();
    this.attributes.dispose();
  }
}
class fa {
  constructor(e, t, s, i, r) {
    this.renderer = e, this.dispatch = r, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = b(this.offsets, "uint", s + 1), n = A(ca);
    this.clearNode = n({
      index: ee,
      tile_count: g(s),
      state: b(r.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [_]).setName("3DGS clear tile offsets WGSL");
    const l = A(
      ua(t)
    );
    this.boundariesNode = l({
      index: ee,
      tile_count: g(s),
      state: b(r.state, "uvec4", 1).toReadOnly(),
      records: b(
        i,
        "uvec2",
        i.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([_]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new pa(this.offsets, s + 1);
  }
  renderer;
  dispatch;
  offsets;
  attributes = new de();
  clearNode;
  boundariesNode;
  suffixMin;
  encode() {
    this.renderer.compute(this.clearNode), this.renderer.compute(this.boundariesNode, this.dispatch.linear), this.suffixMin.encode(this.renderer);
  }
  dispose() {
    this.clearNode.dispose(), this.boundariesNode.dispose(), this.suffixMin.dispose(), this.attributes.dispose();
  }
}
const Gs = (
  /* wgsl */
  `
fn compact_morton_bits_16(value: u32) -> u32 {
  var result = value & 0x55555555u;
  result = (result | (result >> 1u)) & 0x33333333u;
  result = (result | (result >> 2u)) & 0x0f0f0f0fu;
  result = (result | (result >> 4u)) & 0x00ff00ffu;
  result = (result | (result >> 8u)) & 0x0000ffffu;
  return result;
}
`
), ga = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${_}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class ma {
  constructor(e, t, s, i, r, o, n, l, c, u, h, d, f, m, v, p, x, S = !1, N = 1e-4, L = !1) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = i, this.meansAttribute = r, this.projectedMeanAttribute = o, this.projectedConicAttribute = n, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = h, this.depthTexture = d, this.frame = f, this.maxSplatsPerTile = m, this.rasterChunkSize = v, this.tileCount = p, this.transmittanceThreshold = N, this.rasterSubtiles = L, this.metrics = S ? this.attributes.createUint("3dgs.raster-work", p * 4) : null;
    const y = this.metrics === null ? null : b(this.metrics, "uint", p * 4).toAtomic();
    this.clearMetrics = y === null ? null : rt(() => {
      Gr(y.element(ee), g(0));
    })().compute(p * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(x);
  }
  renderer;
  gaussianCount;
  intersectionCapacity;
  mode;
  meansAttribute;
  projectedMeanAttribute;
  projectedConicAttribute;
  projectedColorAttribute;
  sortedRecordsAttribute;
  tileOffsetsAttribute;
  colorTexture;
  depthTexture;
  frame;
  maxSplatsPerTile;
  rasterChunkSize;
  tileCount;
  transmittanceThreshold;
  rasterSubtiles;
  attributes = new de();
  chunks;
  computeNode = null;
  chunkComputeNode = null;
  compositeNode = null;
  metrics;
  clearMetrics;
  rebuild(e) {
    for (const r of [
      e.rasterPixelValueNode,
      e.rasterBreakNode,
      e.rasterColorNode,
      e.rasterAlphaNode,
      e.rasterDiscardNode
    ])
      Vs(r, ts, "raster");
    Ne(
      e.rasterPixelValueNode,
      Fs,
      "rasterPixelValueNode"
    ), Ne(
      e.rasterBreakNode,
      Zr,
      "rasterBreakNode"
    );
    const t = this.createRasterNode(e, "direct"), s = this.chunks === null ? null : this.createRasterNode(e, "chunk"), i = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = t, this.chunkComputeNode = s, this.compositeNode = i;
  }
  encode(e, t) {
    if (this.clearMetrics !== null && this.renderer.compute(this.clearMetrics), this.computeNode === null)
      throw new Error("TileRasterizer has no compute node");
    if (this.chunks === null) {
      this.renderer.compute(this.computeNode, [
        e,
        t,
        this.rasterSubtiles ? 4 : 1
      ]);
      return;
    }
    if (this.chunkComputeNode === null || this.compositeNode === null)
      throw new Error("TileRasterizer has no chunk compute nodes");
    this.renderer.compute(this.chunks.countNode), this.chunks.offsets.encode(this.renderer), this.renderer.compute(this.chunks.prepareNode), this.renderer.compute(this.chunks.emitNode), this.renderer.compute(this.computeNode, [
      e,
      t,
      this.rasterSubtiles ? 4 : 1
    ]), this.renderer.compute(this.chunkComputeNode, this.chunks.dispatch), this.renderer.compute(this.compositeNode, [e, t, 1]);
  }
  dispose() {
    this.clearMetrics?.dispose(), this.computeNode?.dispose(), this.computeNode = null, this.chunkComputeNode?.dispose(), this.chunkComputeNode = null, this.compositeNode?.dispose(), this.compositeNode = null, this.chunks?.countNode.dispose(), this.chunks?.prepareNode.dispose(), this.chunks?.emitNode.dispose(), this.chunks?.offsets.dispose(), this.attributes.dispose();
  }
  createChunkSchedule() {
    if (this.rasterChunkSize === null) return null;
    const e = Js(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Rt(
      t,
      this.tileCount,
      "raster-chunks"
    ), i = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), r = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), o = e * _, n = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
      "3dgs.raster-chunk-partials",
      o * n
    ), c = b(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = b(t, "uint", this.tileCount), h = b(
      t,
      "uint",
      this.tileCount
    ).toReadOnly(), d = b(
      s.output,
      "uint",
      this.tileCount
    ).toReadOnly(), m = A(Li)({
      tile: ee,
      tile_count: g(this.tileCount),
      chunk_size: g(this.rasterChunkSize),
      sample_limit: g(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [_]).setName("3DGS count exact raster chunks WGSL"), p = A(
      Ni(this.rasterSubtiles)
    )({
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      dispatch: b(r, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), S = A(Pi)({
      tile: ee,
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      tasks: b(i, "uvec2", e)
    }).compute(this.tileCount, [_]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: t,
      offsets: s,
      tasks: i,
      dispatch: r,
      partialData: l,
      partialStride: n,
      countNode: m,
      prepareNode: p,
      emitNode: S
    };
  }
  createRasterNode(e, t) {
    const s = this.rasterSubtiles ? 8 : 16, i = s * s, r = this.metrics === null ? null : b(this.metrics, "uint", this.tileCount * 4).toAtomic(), o = b(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), n = b(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), l = b(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), c = b(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), u = b(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), h = b(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), d = V("vec4", i), f = V("vec4", i), m = V("vec4", i), v = V("uint", i), p = V("uint", _), x = V("uint", i / 32), S = t === "direct" ? Nt(this.colorTexture) : null, N = A(Gs), L = A(ga), y = this.chunks, R = t === "chunk" && y !== null ? b(y.tasks, "uvec2", y.tasks.count).toReadOnly() : null, M = t === "chunk" && y !== null ? b(y.partialData, "vec4", y.partialData.count) : null, { frame: G } = this;
    return rt(() => {
      const C = g(_e), $ = this.rasterSubtiles ? g(K.z).mul(g(64)).add(C) : C, O = N({ value: $ }), z = N({
        value: $.shiftRight(1)
      }), B = g(K.x), U = (t === "direct" ? K.y.mul(G.tilesX).add(K.x) : R.element(B).x).toVar("rasterTile"), Pe = t === "chunk" ? R.element(B).y : g(0), Y = t === "direct" ? K.x : U.mod(G.tilesX), he = t === "direct" ? K.y : U.div(G.tilesX), te = He(
        Y.mul(g(j)).add(O),
        he.mul(g(j)).add(z)
      ).toVar("rasterPixelCoordinateValue"), Re = te.x.lessThan(g(G.viewport.x)).and(te.y.lessThan(g(G.viewport.y))).toVar("rasterActivePixel"), Qe = h.element(U), pe = h.element(U.add(1)), Z = g(pe.sub(Qe)), se = Z.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const E = g(this.maxSplatsPerTile);
        se.assign(ve(Z.lessThan(E), Z, E));
      }
      let we = g(0);
      const oe = se.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        oe.assign(
          ve(
            se.greaterThan(g(this.rasterChunkSize)),
            g(0),
            se
          )
        );
      else if (t === "chunk") {
        we = Pe.mul(g(this.rasterChunkSize)).toVar("rasterSampleStart");
        const E = we.add(g(this.rasterChunkSize));
        oe.assign(
          ve(E.lessThan(se), E, se)
        );
      }
      const ke = xe(te).add(0.5), Je = /* @__PURE__ */ new Map([
        [Vt, () => te],
        [qt, () => ke],
        [Kt, () => ke.div(G.viewport.xy)]
      ]), fe = F(0).toVar("rasterPixelValue");
      T(Re, () => {
        fe.assign(
          Ve(e.rasterPixelValueNode, Je)
        );
      });
      const Ge = it(0).toVar("accumulated"), le = F(1).toVar("transmittance"), me = F(1).toVar("depth"), Ee = ce(!1).toVar("depthWritten"), Se = ce(!1).toVar("done"), Ie = r === null ? null : g(0).toVar("rasterChecked"), Me = r === null ? null : g(0).toVar("rasterBlended");
      We(
        {
          start: we,
          end: oe,
          type: "uint",
          condition: "<",
          update: `+= ${i}`
        },
        ({ i: E }) => {
          const be = E.add(C);
          T(be.lessThan(oe), () => {
            let H = be;
            this.maxSplatsPerTile !== null && (H = g(
              Lt(
                F(be).add(0.5).mul(F(Z)).div(F(se))
              )
            ));
            const W = Qe.add(H).toVar("rasterSourceRecordIndex"), re = u.element(W).y, q = n.element(re), J = l.element(re);
            d.element(C).assign(q), f.element(C).assign(Q(J.xyz, q.w.mul(255).log())), m.element(C).assign(c.element(re)), v.element(C).assign(re);
          }), T(C.equal(0), () => {
            p.element(g(0)).assign(
              ve(
                E.add(g(i)).lessThan(oe),
                g(1),
                g(0)
              )
            );
          });
          const Te = L({ values: p }).toVar("hasNextBatch"), De = g(oe.sub(E)), ut = ve(
            De.lessThan(g(i)),
            De,
            g(i)
          );
          T(Re.and(Se.not()), () => {
            We(
              {
                start: g(0),
                end: ut,
                type: "uint",
                condition: "<"
              },
              ({ i: H }) => {
                Ie?.addAssign(1);
                const W = d.element(H), re = v.element(H), q = ke.sub(W.xy), J = new Map(Je);
                J.set(Yt, () => fe), J.set(ct, () => re), J.set(
                  Ft,
                  () => g(o.element(re).w)
                ), J.set(Xt, () => W.xy), J.set(Ht, () => q), J.set(Zt, () => W.z);
                const je = Ve(
                  e.rasterBreakNode,
                  J
                );
                T(je, () => {
                  Se.assign(ce(!0)), Fe();
                });
                const is = f.element(H), Ae = is.xyz, et = Ae.x.mul(q.x.mul(q.x)).add(Ae.y.mul(2).mul(q.x).mul(q.y)).add(Ae.z.mul(q.y.mul(q.y))).mul(-0.5);
                T(
                  et.greaterThan(0).or(et.lessThan(is.w.negate())),
                  () => {
                    vt();
                  }
                );
                const as = Le(fs(Ae.x, 1e-12)), ht = Ae.y.div(as), ar = Le(fs(Ae.z.sub(ht.mul(ht)), 1e-12)), ns = xe(
                  as.mul(q.x).add(ht.mul(q.y)),
                  ar.mul(q.y)
                ), pt = new Map([
                  ...J,
                  [js, () => ns],
                  [Us, () => ns.div(6).add(0.5)],
                  [
                    Qt,
                    () => m.element(H).xyz
                  ],
                  [Jt, () => W.w],
                  [es, () => et],
                  [Ws, () => Os(et)]
                ]), nr = Ve(e.rasterDiscardNode, pt);
                T(nr, () => {
                  vt();
                });
                const ft = ye(
                  Ve(e.rasterAlphaNode, pt),
                  0,
                  0.99
                );
                T(ft.lessThan(F(1 / 255)), () => {
                  vt();
                }), T(Ee.not(), () => {
                  me.assign(ba(W.z, G)), Ee.assign(ce(!0));
                });
                const or = Ve(e.rasterColorNode, pt);
                Ge.addAssign(or.mul(le).mul(ft)), Me?.addAssign(1), le.mulAssign(F(1).sub(ft)), T(le.lessThan(this.transmittanceThreshold), () => {
                  Se.assign(ce(!0)), Fe();
                });
              }
            );
          }), T(Te.equal(0), () => {
            Fe();
          }), p.element(C).assign(ve(Re.and(Se.not()), g(1), g(0))), gs(), T(C.lessThan(i / 32), () => {
            const H = C.mul(32), W = g(0).toVar("subgroupActive");
            We(
              { start: g(0), end: g(32), type: "uint", condition: "<" },
              ({ i: re }) => {
                W.bitOrAssign(
                  p.element(H.add(re))
                );
              }
            ), x.element(C).assign(W);
          }), gs(), T(C.equal(0), () => {
            const H = g(0).toVar("tileActiveReduction");
            We(
              {
                start: g(0),
                end: g(i / 32),
                type: "uint",
                condition: "<"
              },
              ({ i: W }) => {
                H.bitOrAssign(x.element(g(W)));
              }
            ), p.element(g(0)).assign(H);
          });
          const dt = L({ values: p });
          T(dt.equal(0), () => {
            Fe();
          });
        }
      ), T(Re, () => {
        if (r !== null) {
          const E = U.mul(4);
          Oe(r.element(E), Ie), Oe(r.element(E.add(1)), Me), t === "direct" && T(Z.greaterThan(0).and(oe.greaterThan(0)), () => {
            Oe(r.element(E.add(2)), g(1)), Oe(
              r.element(E.add(3)),
              ve(
                le.lessThan(this.transmittanceThreshold),
                g(1),
                g(0)
              )
            );
          });
        }
        if (t === "direct")
          Is(
            Ge,
            le,
            me,
            te,
            S,
            this.depthTexture,
            G
          );
        else {
          const E = B.mul(g(_)).add($).mul(g(y.partialStride));
          M.element(E).assign(Q(Ge, le)), this.depthTexture !== null && M.element(E.add(1)).assign(Q(me, 0, 0, 0));
        }
      });
    })().computeKernel([s, s]).setName(
      t === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const e = this.metrics === null ? null : b(this.metrics, "uint", this.tileCount * 4).toAtomic(), t = this.chunks, s = b(
      t.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), i = b(
      t.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), r = b(
      t.partialData,
      "vec4",
      t.partialData.count
    ).toReadOnly(), o = Nt(this.colorTexture), n = A(Gs), { frame: l } = this;
    return rt(() => {
      const u = g(_e), h = n({ value: u }), d = n({ value: u.shiftRight(1) }), f = K.y.mul(l.tilesX).add(K.x), m = s.element(f), v = He(
        K.x.mul(g(j)).add(h),
        K.y.mul(g(j)).add(d)
      ), p = v.x.lessThan(g(l.viewport.x)).and(v.y.lessThan(g(l.viewport.y)));
      T(p.and(m.greaterThan(0)), () => {
        const x = it(0).toVar("chunkCompositeColor"), S = F(1).toVar("chunkCompositeTransmittance"), N = F(1).toVar("chunkCompositeDepth"), L = ce(!1).toVar("chunkCompositeDepthWritten"), y = i.element(f);
        We(
          {
            start: g(0),
            end: m,
            type: "uint",
            condition: "<"
          },
          ({ i: R }) => {
            const M = y.add(R).mul(g(_)).add(u).mul(g(t.partialStride)), G = r.element(M);
            x.addAssign(G.xyz.mul(S)), this.depthTexture !== null && T(L.not().and(G.w.lessThan(1)), () => {
              N.assign(r.element(M.add(1)).x), L.assign(ce(!0));
            }), S.mulAssign(G.w), T(S.lessThan(this.transmittanceThreshold), () => {
              Fe();
            });
          }
        ), Is(
          x,
          S,
          N,
          v,
          o,
          this.depthTexture,
          l
        ), e !== null && (Oe(e.element(f.mul(4).add(2)), g(1)), Oe(
          e.element(f.mul(4).add(3)),
          ve(
            S.lessThan(this.transmittanceThreshold),
            g(1),
            g(0)
          )
        ));
      });
    })().computeKernel([j, j]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const e = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let t = 0, s = 0, i = 0, r = 0;
    for (let o = 0; o < e.length; o += 4)
      t += e[o], s += e[o + 1], i += e[o + 2], r += e[o + 3];
    return { checked: t, blended: s, pixels: i, alphaStopped: r };
  }
}
function ba(a, e) {
  const t = a.negate();
  return ye(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function Is(a, e, t, s, i, r, o) {
  const n = ye(F(o.background[3]), 0, 1);
  a.addAssign(
    it(o.background[0], o.background[1], o.background[2]).mul(e).mul(n)
  );
  const l = F(1).sub(e.mul(F(1).sub(n)));
  ms(i, Ye(s), Q(a, l)), r !== null && ms(
    Nt(r),
    Ye(s),
    Q(t, 0, 0, 1)
  );
}
function Ve(a, e) {
  return a.context({ overrideNodes: e });
}
class va {
  constructor(e, t, s, i, r, o) {
    this.renderer = e, this.buffers = {
      recordsA: this.attributes.createUint(
        "3dgs.depth-records-a",
        s,
        2
      ),
      recordsB: this.attributes.createUint(
        "3dgs.depth-records-b",
        s,
        2
      )
    }, this.dispatch = {
      state: this.attributes.createUint("3dgs.visible-dispatch-state", 1, 4),
      radixBlock: this.attributes.createIndirect(
        "3dgs.visible-radix-block-dispatch"
      ),
      radixReduce: this.attributes.createIndirect(
        "3dgs.visible-radix-reduce-dispatch"
      ),
      linear: this.attributes.createIndirect("3dgs.visible-linear-dispatch")
    };
    const n = b(
      i,
      "uint",
      s
    ).toReadOnly(), l = A(
      Gi
    );
    this.prepareNode = l({
      gaussian_count: g(s),
      projected_mean: b(
        r,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: n,
      state: b(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: b(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: b(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: b(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const c = A(
      Ii(t)
    );
    this.compactNode = c({
      gid: ee,
      gaussian_count: g(s),
      viewport: o,
      visible_offsets: n,
      projected_mean: b(
        r,
        "vec4",
        s
      ).toReadOnly(),
      records: b(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [_]).setName(`3DGS compact visible Gaussians WGSL (${t})`);
  }
  renderer;
  buffers;
  dispatch;
  attributes = new de();
  prepareNode;
  compactNode;
  encode(e = !1) {
    e ? (this.renderer.compute(this.prepareNode), this.renderer.compute(this.compactNode)) : this.renderer.compute([this.prepareNode, this.compactNode]);
  }
  dispose() {
    this.prepareNode.dispose(), this.compactNode.dispose(), this.attributes.dispose();
  }
}
class xa {
  constructor(e, t, s, i, r, o, n, l, c, u, h, d, f, m, v = 1e-4, p = !1) {
    this.renderer = e, this.data = s, this.mode = r, this.capacity = n, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = d, this.radixBackend = f, this.nodes = m, this.rasterTransmittanceThreshold = v, this.rasterSubtiles = p, this.frame = new $i(t, l), this.objects = new ji(t, i, s.count), this.projection = new Yi(
      s,
      this.frame,
      this.objects,
      o,
      m,
      d
    ), this.profileDiagnostics = c ? new ea(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u,
      this.rasterSubtiles
    ) : null, this.visibleScan = new Rt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new va(
      e,
      r,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Rs(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      f
    ), this.depthSorter.configure(r === "float32" ? 32 : 16), this.orderedTiles = new Ti(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Rt(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new Di(
      e,
      s.count,
      n,
      this.depthSorter.sortedRecords,
      this.visible.dispatch,
      this.orderedTiles.tileCounts,
      this.scan.output,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.frame
    ), this.sorter = new Rs(
      e,
      "tile",
      n,
      this.intersections.buffers,
      this.intersections.dispatch,
      f
    );
  }
  renderer;
  data;
  mode;
  capacity;
  profileKernels;
  maxRasterizedSplatsPerTile;
  rasterChunkSize;
  subpixelSampleCulling;
  radixBackend;
  nodes;
  rasterTransmittanceThreshold;
  rasterSubtiles;
  frame;
  objects;
  projection;
  profileDiagnostics;
  visibleScan;
  visible;
  depthSorter;
  orderedTiles;
  scan;
  intersections;
  sorter;
  tileOffsets = null;
  rasterizer = null;
  width = 0;
  height = 0;
  tilesX = 0;
  tilesY = 0;
  tileStageRebuilds = 0;
  prepareFrame(e, t, s, i) {
    if (this.frame.update(e, t, this.tilesX, this.tilesY), this.objects.update(), (e !== this.width || t !== this.height) && this.rebuildTileStages(e, t, s, i), this.tileOffsets === null || this.rasterizer === null)
      throw new Error("TiledGaussianPipeline failed to create tile stages");
  }
  render() {
    if (this.tileOffsets === null || this.rasterizer === null)
      throw new Error(
        "TiledGaussianPipeline must be prepared before rendering"
      );
    this.projection.encode(this.renderer), this.profileDiagnostics?.encode(), this.visibleScan.encode(this.renderer), this.visible.encode(), this.depthSorter.encode(this.profileKernels), this.orderedTiles.encode(), this.scan.encode(this.renderer), this.intersections.encode(), this.sorter.encode(this.profileKernels), this.tileOffsets.encode(), this.rasterizer.encode(this.tilesX, this.tilesY);
  }
  rebuildProjection(e) {
    this.projection.rebuild(e);
  }
  rebuildRasterizer(e) {
    this.rasterizer?.rebuild(e);
  }
  async readStats() {
    if (this.profileDiagnostics === null || this.tileOffsets === null)
      return this.intersections.readStats();
    const [e, t, s] = await Promise.all([
      this.intersections.readStats(),
      this.profileDiagnostics.readStats(this.tileOffsets.offsets),
      this.rasterizer?.readWorkStats() ?? Promise.resolve(null)
    ]);
    return {
      ...e,
      profile: { ...t, rasterWork: s }
    };
  }
  getDebugInfo() {
    return {
      initialized: this.tileOffsets !== null && this.rasterizer !== null,
      width: this.width,
      height: this.height,
      tilesX: this.tilesX,
      tilesY: this.tilesY,
      tileStageRebuilds: this.tileStageRebuilds,
      radixPasses: this.depthSorter.passCount + this.sorter.passCount,
      depthRadixPasses: this.depthSorter.passCount,
      tileRadixPasses: this.sorter.passCount,
      radixBackend: this.radixBackend,
      profileKernels: this.profileKernels,
      maxRasterizedSplatsPerTile: this.maxRasterizedSplatsPerTile,
      rasterChunkSize: this.rasterChunkSize,
      subpixelSampleCulling: this.subpixelSampleCulling
    };
  }
  getResources() {
    return this.tileOffsets === null ? null : {
      projectedMean: this.projection.projectedMean,
      projectedConic: this.projection.projectedConic,
      projectedColor: this.projection.projectedColor,
      visibleOffsets: this.visibleScan.output,
      depthSortedGaussians: this.depthSorter.sortedRecords,
      tileCounts: this.projection.tileCounts,
      depthOrderedTileCounts: this.orderedTiles.tileCounts,
      intersectionOffsets: this.scan.output,
      dispatchState: this.intersections.dispatch.state,
      sortedIntersections: this.sorter.sortedRecords,
      tileOffsets: this.tileOffsets.offsets
    };
  }
  dispose() {
    this.tileOffsets?.dispose(), this.tileOffsets = null, this.rasterizer?.dispose(), this.rasterizer = null, this.sorter.dispose(), this.intersections.dispose(), this.scan.dispose(), this.orderedTiles.dispose(), this.depthSorter.dispose(), this.visible.dispose(), this.visibleScan.dispose(), this.profileDiagnostics?.dispose(), this.projection.dispose(), this.objects.dispose();
  }
  rebuildTileStages(e, t, s, i) {
    const r = Math.ceil(e / j), o = Math.ceil(t / j), n = r * o;
    if (r > 65535 || o > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, n + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new fa(
      this.renderer,
      this.mode,
      n,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new ma(
      this.renderer,
      this.data.count,
      this.capacity,
      this.mode,
      this.data.means,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.sorter.sortedRecords,
      this.tileOffsets.offsets,
      s,
      i,
      this.frame,
      this.maxRasterizedSplatsPerTile,
      this.rasterChunkSize,
      n,
      this.nodes,
      this.profileKernels,
      this.rasterTransmittanceThreshold,
      this.rasterSubtiles
    ), this.width = e, this.height = t, this.tilesX = r, this.tilesY = o, this.frame.update(e, t, r, o), this.tileStageRebuilds++;
  }
}
function ya(a, e) {
  if (a !== "auto" && a !== "subgroup" && a !== "workgroup")
    throw new RangeError(
      'radixBackend must be "auto", "subgroup", or "workgroup"'
    );
  if (a === "subgroup" && !e)
    throw new Error(
      'radixBackend "subgroup" requires the WebGPU "subgroups" feature'
    );
  return a === "auto" ? e ? "subgroup" : "workgroup" : a;
}
const Ct = new Lr();
class _a extends os {
  gaussianStore;
  depthSortMode;
  antialiasMode;
  background;
  outputDepth;
  colorSpace;
  profileKernels;
  rasterSubtiles;
  rasterTransmittanceThreshold;
  maxRasterizedSplatsPerTile;
  rasterChunkSize;
  subpixelSampleCulling;
  radixBackend;
  colorTexture;
  depthTexture;
  ownerRenderer;
  requestedIntersectionCapacity;
  resolvedIntersectionCapacity = 0;
  debugListeners = /* @__PURE__ */ new Set();
  workingColorNode = null;
  pipeline = null;
  pipelineLayoutVersion = -1;
  nodeSlots = Hr();
  dirtyStages = 0;
  disposed = !1;
  constructor(e, t, s, i = {}) {
    super(os.COLOR, new As(), t, {
      type: ls,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const r = i.depthSortMode ?? "float32", o = i.antialiasMode ?? "compensated", n = i.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    const l = ya(
      n,
      e.hasFeature("subgroups")
    ), c = i.intersectionCapacity ?? null;
    if (c !== null && (!Number.isInteger(c) || c <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (c !== null && c > _ * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const u = i.maxRasterizedSplatsPerTile ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const h = i.rasterChunkSize === void 0 ? Ci : i.rasterChunkSize;
    if (Ri(
      h,
      c ?? _ * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = r, this.antialiasMode = o, this.requestedIntersectionCapacity = c, this.background = i.background ?? [0, 0, 0, 0], this.outputDepth = i.outputDepth ?? !1, this.colorSpace = i.colorSpace ?? _r, this.profileKernels = i.profileKernels ?? !1, this.rasterSubtiles = i.rasterSubtiles ?? !1, this.rasterTransmittanceThreshold = i.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = i.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new cs(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = ls, this.colorTexture.colorSpace = wr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new cs(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = kr, this.depthTexture.type = Sr, this.depthTexture.minFilter = us, this.depthTexture.magFilter = us, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
  }
  /** Resolved after the first render when omitted from GaussianPassOptions. */
  get intersectionCapacity() {
    return this.requestedIntersectionCapacity ?? this.resolvedIntersectionCapacity;
  }
  getTexture(e) {
    if (e === "output") return this.colorTexture;
    if (e === "depth") {
      if (this.depthTexture === null)
        throw new Error(
          'GaussianPass depth output is disabled. Pass { outputDepth: true } and request getTextureNode("depth") again.'
        );
      return this.depthTexture;
    }
    return super.getTexture(e);
  }
  setSize(e, t) {
    super.setSize(e, t), this.depthTexture?.setSize(e, t, 1);
  }
  /** Color-managed output in Three.js' linear working color space. */
  getColorNode() {
    return this.workingColorNode ??= Ir(
      this.getTextureNode("output"),
      this.colorSpace
    ), this.workingColorNode;
  }
  setup(e) {
    const t = super.setup(e);
    if (t == null)
      throw new Error("GaussianPass color output node is unavailable");
    return this.getColorNode();
  }
  get gaussianPositionLocalNode() {
    return this.nodeSlots.gaussianPositionLocalNode;
  }
  set gaussianPositionLocalNode(e) {
    this.setProjectionNode("gaussianPositionLocalNode", e);
  }
  get gaussianPositionWorldNode() {
    return this.nodeSlots.gaussianPositionWorldNode;
  }
  set gaussianPositionWorldNode(e) {
    this.setProjectionNode("gaussianPositionWorldNode", e);
  }
  get gaussianScaleNode() {
    return this.nodeSlots.gaussianScaleNode;
  }
  set gaussianScaleNode(e) {
    this.setProjectionNode("gaussianScaleNode", e);
  }
  get gaussianRotationNode() {
    return this.nodeSlots.gaussianRotationNode;
  }
  set gaussianRotationNode(e) {
    this.setProjectionNode("gaussianRotationNode", e);
  }
  get gaussianOpacityNode() {
    return this.nodeSlots.gaussianOpacityNode;
  }
  set gaussianOpacityNode(e) {
    this.setProjectionNode("gaussianOpacityNode", e);
  }
  get gaussianColorNode() {
    return this.nodeSlots.gaussianColorNode;
  }
  set gaussianColorNode(e) {
    this.setProjectionNode("gaussianColorNode", e);
  }
  get gaussianVisibilityNode() {
    return this.nodeSlots.gaussianVisibilityNode;
  }
  set gaussianVisibilityNode(e) {
    this.setProjectionNode("gaussianVisibilityNode", e);
  }
  get rasterColorNode() {
    return this.nodeSlots.rasterColorNode;
  }
  get rasterPixelValueNode() {
    return this.nodeSlots.rasterPixelValueNode;
  }
  set rasterPixelValueNode(e) {
    this.setRasterNode("rasterPixelValueNode", e);
  }
  get rasterBreakNode() {
    return this.nodeSlots.rasterBreakNode;
  }
  set rasterBreakNode(e) {
    this.setRasterNode("rasterBreakNode", e);
  }
  set rasterColorNode(e) {
    this.setRasterNode("rasterColorNode", e);
  }
  get rasterAlphaNode() {
    return this.nodeSlots.rasterAlphaNode;
  }
  set rasterAlphaNode(e) {
    this.setRasterNode("rasterAlphaNode", e);
  }
  get rasterDiscardNode() {
    return this.nodeSlots.rasterDiscardNode;
  }
  set rasterDiscardNode(e) {
    this.setRasterNode("rasterDiscardNode", e);
  }
  invalidateProjection() {
    this.dirtyStages |= 1;
  }
  invalidateRasterizer() {
    this.dirtyStages |= 2;
  }
  set needsUpdate(e) {
    super.needsUpdate = e, e && (this.dirtyStages |= 3);
  }
  updateBefore(e) {
    const t = e.renderer;
    if (t === null)
      throw new Error("GaussianPass received a NodeFrame without a renderer");
    if (this.disposed) throw new Error("GaussianPass has been disposed");
    if (t !== this.ownerRenderer)
      throw new Error(
        "GaussianPass must be rendered by the WebGPURenderer passed to its constructor"
      );
    if (!(this.camera instanceof Cr))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    t.getDrawingBufferSize(Ct);
    const s = Math.max(1, Math.floor(Ct.x)), i = Math.max(1, Math.floor(Ct.y));
    (this.renderTarget.width !== s || this.renderTarget.height !== i) && this.setSize(s, i), this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: wa(t) });
    const r = this.gaussianStore.updateLod(this.camera), o = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      _ * 65535,
      Math.max(1, o.count * 16)
    )), t.initRenderTarget(this.renderTarget), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), o.count > _ * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new xa(
        t,
        this.camera,
        o,
        this.gaussianStore,
        this.depthSortMode,
        this.antialiasMode,
        this.intersectionCapacity,
        this.background,
        this.profileKernels,
        this.maxRasterizedSplatsPerTile,
        this.rasterChunkSize,
        this.subpixelSampleCulling,
        this.radixBackend,
        this.nodeSlots,
        this.rasterTransmittanceThreshold,
        this.rasterSubtiles
      ), this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.pipeline.prepareFrame(
      s,
      i,
      this.colorTexture,
      this.depthTexture
    ), this.pipeline.render(), this.debugListeners.size > 0) {
      const n = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: r
      };
      for (const l of this.debugListeners) l(n);
    }
  }
  /** Subscribe to allocation, LOD and CPU-side pass diagnostics. */
  subscribeDebug(e) {
    return this.debugListeners.add(e), () => this.debugListeners.delete(e);
  }
  /** Three.js storage attributes produced by the renderer, available after the first frame. */
  getResources() {
    return this.pipeline?.getResources() ?? null;
  }
  /** Optional diagnostic readback. Normal rendering never reads the GPU count. */
  readStats() {
    return this.pipeline !== null ? this.pipeline.readStats() : Promise.resolve({
      visibleGaussianCount: 0,
      intersectionCount: 0,
      requestedIntersections: 0,
      intersectionCapacity: this.intersectionCapacity,
      overflow: !1,
      profile: null
    });
  }
  /** CPU-side lifecycle information; unlike readStats(), this does not perform a GPU readback. */
  getDebugInfo() {
    return this.pipeline?.getDebugInfo() ?? {
      initialized: !1,
      width: 0,
      height: 0,
      tilesX: 0,
      tilesY: 0,
      tileStageRebuilds: 0,
      radixPasses: 0,
      depthRadixPasses: 0,
      tileRadixPasses: 0,
      radixBackend: this.radixBackend,
      profileKernels: this.profileKernels,
      maxRasterizedSplatsPerTile: this.maxRasterizedSplatsPerTile,
      rasterChunkSize: this.rasterChunkSize,
      subpixelSampleCulling: this.subpixelSampleCulling
    };
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.pipeline?.dispose(), this.pipeline = null, this.debugListeners.clear(), this.depthTexture?.dispose(), super.dispose());
  }
  setProjectionNode(e, t) {
    Ms(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateProjection());
  }
  setRasterNode(e, t) {
    Ms(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateRasterizer());
  }
}
function Ms(a, e) {
  if (a?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function wa(a) {
  const e = a.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device.limits;
}
function Aa(a, e, t, s) {
  return new _a(a, e, t, s);
}
export {
  Or as CanonicalGaussianPlyLoader,
  Ia as DistanceAwareRadialLodPackingStrategy,
  Mr as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  xs as GaussianCloud,
  Bs as GaussianData,
  Tt as GaussianLod,
  Pa as GaussianLodColorHelper,
  ys as GaussianLodNode,
  Mt as GaussianOctree,
  jr as GaussianOctreeNode,
  _a as GaussianPass,
  Ta as GaussianStore,
  gi as GaussianStoreAttributes,
  fi as GaussianStorePackedAttribute,
  Na as LodHelper,
  Ra as MaximumLodPackingStrategy,
  La as OctreeHelper,
  $s as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Ga as RadialLodPackingStrategy,
  oi as RadialLodWorkerPlanner,
  pi as RemainingCapacityBudgetStrategy,
  Ma as SourceFractionBudgetStrategy,
  Ks as StreamingLodPackingStrategy,
  ei as TieredRadialLodPackingStrategy,
  Bt as gaussianColor,
  At as gaussianIndex,
  Ot as gaussianObjectId,
  $t as gaussianObjectMatrix,
  zt as gaussianObjectVisible,
  lt as gaussianOpacity,
  Aa as gaussianPass,
  at as gaussianPositionLocal,
  Ze as gaussianPositionWorld,
  Wt as gaussianProjectedArea,
  Ut as gaussianProjectedSigma,
  ot as gaussianRotation,
  nt as gaussianScale,
  Ds as gaussianScreenBoundsMax,
  Es as gaussianScreenBoundsMin,
  jt as gaussianScreenPosition,
  Dt as gaussianViewDepth,
  Et as gaussianViewDirection,
  ws as isStreamingLodPackingStrategy,
  Tr as packShRgb8e8,
  Xt as rasterGaussianCenter,
  Qt as rasterGaussianColor,
  js as rasterGaussianCoord,
  ct as rasterGaussianIndex,
  Jt as rasterGaussianOpacity,
  Ft as rasterObjectId,
  Vt as rasterPixelCoordinate,
  Ht as rasterPixelDelta,
  Yt as rasterPixelValue,
  es as rasterPower,
  qt as rasterScreenPosition,
  Kt as rasterScreenUV,
  Us as rasterUV,
  Zt as rasterViewDepth,
  Ws as rasterWeight,
  zs as shBytesPerCoefficient,
  Ca as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
