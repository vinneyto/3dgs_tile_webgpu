import { StorageBufferAttribute as ze, Vector3 as C, Quaternion as ir, Box3 as Rt, Object3D as Rs, Matrix4 as Te, Ray as ar, LineSegments as nr, BufferGeometry as or, Float32BufferAttribute as lr, LineBasicMaterial as cr, BoxGeometry as ur, MeshBasicMaterial as dr, DoubleSide as hr, InstancedMesh as pr, Color as fr, IndirectStorageBufferAttribute as gr, Vector4 as mr, Scene as Gs, PassNode as rs, HalfFloatType as is, SRGBColorSpace as vr, StorageTexture as as, NoColorSpace as br, RedFormat as xr, FloatType as yr, NearestFilter as ns, PerspectiveCamera as _r, Vector2 as wr } from "three/webgpu";
import { property as G, bool as le, exp as Is, float as W, storage as m, uint as g, vec3 as it, mix as kr, wgslFn as A, instanceIndex as ee, workgroupArray as V, workgroupId as H, invocationLocalIndex as ye, uniform as We, uvec2 as Ze, Fn as rt, If as M, Return as me, vec4 as Q, mat4 as os, normalize as Sr, sqrt as Ce, clamp as xe, log as Cr, ceil as ls, vec2 as be, ivec2 as Xe, int as cs, floor as St, subgroupIndex as pt, invocationSubgroupIndex as ft, subgroupSize as gt, atomicStore as Lr, storageTexture as Ct, select as ve, Loop as Fe, Break as Ve, Continue as mt, max as us, workgroupBarrier as ds, atomicAdd as $e, textureStore as hs, colorSpaceToWorking as Nr } from "three/tsl";
class Ms {
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
const Pr = 16, As = 4;
function Rr(i, e, t) {
  const s = Math.max(Math.abs(i), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const a = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), r = 127 / 2 ** a, o = vt(i, r), n = vt(e, r), l = vt(t, r), c = a + 127;
  return (o | n << 8 | l << 16 | c << 24) >>> 0;
}
function _a(i) {
  const e = 2 ** ((i >>> 24) - 127) / 127;
  return [
    bt(i) * e,
    bt(i >>> 8) * e,
    bt(i >>> 16) * e
  ];
}
function Os(i) {
  return i === "rgb8e8" ? As : Pr;
}
function vt(i, e) {
  return Math.min(127, Math.max(-127, Math.round(i * e))) & 255;
}
function bt(i) {
  const e = i & 255;
  return e < 128 ? e : e - 256;
}
const ps = {
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
}, Gr = [
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
class Ir {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = Mr(e), s = new Map(
      t.properties.map((f, x) => [f.name, x])
    );
    for (const f of Gr)
      if (!s.has(f))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${f}`);
    const a = t.properties.map((f) => f.name.match(/^f_rest_(\d+)$/)?.[1]).filter((f) => f !== void 0).map(Number).sort((f, x) => f - x);
    for (let f = 0; f < a.length; f++)
      if (a[f] !== f)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (a.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const r = a.length / 3, o = r + 1, n = Math.sqrt(o);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = Ar(e, t), c = (f) => s.get(f), u = a.map(
      (f) => c(`f_rest_${f}`)
    ), h = t.vertexCount, d = new Float32Array(h * 4), p = new Float32Array(h * 4), v = new Float32Array(h * 4), y = new Float32Array(h * o * 4);
    for (let f = 0; f < h; f++) {
      const x = f * 4;
      d[x] = l(f, c("x")), d[x + 1] = l(f, c("y")), d[x + 2] = l(f, c("z")), p[x] = Math.max(
        Math.exp(l(f, c("scale_0"))),
        1e-6
      ), p[x + 1] = Math.max(
        Math.exp(l(f, c("scale_1"))),
        1e-6
      ), p[x + 2] = Math.max(
        Math.exp(l(f, c("scale_2"))),
        1e-6
      );
      const k = l(f, c("opacity"));
      p[x + 3] = 1 / (1 + Math.exp(-k));
      const L = l(f, c("rot_0")), P = l(f, c("rot_1")), _ = l(f, c("rot_2")), R = l(f, c("rot_3")), S = Math.hypot(P, _, R, L);
      S > 1e-12 ? (v[x] = P / S, v[x + 1] = _ / S, v[x + 2] = R / S, v[x + 3] = L / S) : v[x + 3] = 1;
      const O = f * o * 4;
      y[O] = l(f, c("f_dc_0")), y[O + 1] = l(f, c("f_dc_1")), y[O + 2] = l(f, c("f_dc_2"));
      for (let w = 1; w < o; w++) {
        const I = O + w * 4, $ = w - 1;
        for (let B = 0; B < 3; B++) {
          const E = u[B * r + $];
          y[I + B] = l(
            f,
            E
          );
        }
      }
    }
    return new Ms(
      {
        means: tt("ply.means", d),
        scalesOpacity: tt("ply.scales-opacity", p),
        rotations: tt("ply.rotations-xyzw", v),
        shCoefficients: tt("ply.sh-coefficients", y)
      },
      {
        count: h,
        shDegree: n - 1,
        ownsBuffers: !0
      }
    );
  }
}
function tt(i, e) {
  const t = new ze(e, 4);
  return t.name = i, t;
}
function Mr(i) {
  const e = new Uint8Array(i), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let v = 0; v <= e.length - t.length; v++) {
    let y = !0;
    for (let f = 0; f < t.length; f++)
      if (e[v + f] !== t[f]) {
        y = !1;
        break;
      }
    if (y) {
      s = v;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let a = s + t.length;
  if (e[a] === 13 && a++, e[a] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  a++;
  const o = new TextDecoder().decode(e.subarray(0, a)).split(/\r?\n/);
  if (o[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let n = null, l = "", c = -1, u = 0;
  const h = [], d = [];
  for (const v of o) {
    const y = v.trim().split(/\s+/);
    if (y[0] === "format") {
      if (y[1] !== "ascii" && y[1] !== "binary_little_endian" && y[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${y[1] ?? "unknown"}`);
      n = y[1];
    } else if (y[0] === "element") {
      l = y[1] ?? "";
      const f = Number(y[2]);
      if (!Number.isInteger(f) || f < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: f }), l === "vertex" && (c = f);
    } else if (y[0] === "property" && l === "vertex") {
      if (y[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const f = y[1], x = y[2];
      if (!(f in ps) || x === void 0)
        throw new Error(`Unsupported vertex property: ${v}`);
      h.push({ name: x, type: f, byteOffset: u }), u += ps[f];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (c <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (v) => v.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: c, properties: h, vertexStride: u, dataOffset: a };
}
function Ar(i, e) {
  if (e.format === "ascii") {
    const r = new TextDecoder().decode(
      new Uint8Array(i, e.dataOffset)
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
  if (e.dataOffset + e.vertexCount * e.vertexStride > i.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(i), a = e.format === "binary_little_endian";
  return (r, o) => {
    const n = e.properties[o], l = e.dataOffset + r * e.vertexStride + n.byteOffset;
    return Or(s, l, n.type, a);
  };
}
function Or(i, e, t, s) {
  switch (t) {
    case "char":
    case "int8":
      return i.getInt8(e);
    case "uchar":
    case "uint8":
      return i.getUint8(e);
    case "short":
    case "int16":
      return i.getInt16(e, s);
    case "ushort":
    case "uint16":
      return i.getUint16(e, s);
    case "int":
    case "int32":
      return i.getInt32(e, s);
    case "uint":
    case "uint32":
      return i.getUint32(e, s);
    case "float":
    case "float32":
      return i.getFloat32(e, s);
    case "double":
    case "float64":
      return i.getFloat64(e, s);
  }
}
const fs = 1 / 255, Br = 0.99, xt = 1e-12;
function $r(i, e, t, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const a = e.means.array, r = e.scalesOpacity.array, o = e.rotations.array, n = new C(), l = new C(), c = new C(), u = new ir();
  let h = 1;
  for (const d of t) {
    const p = d.gaussianIndex * 4, v = Math.min(1, Math.max(0, r[p + 3]));
    if (v < fs) continue;
    u.set(
      -o[p],
      -o[p + 1],
      -o[p + 2],
      o[p + 3]
    ).normalize(), n.set(
      i.origin.x - a[p],
      i.origin.y - a[p + 1],
      i.origin.z - a[p + 2]
    ).applyQuaternion(u), l.copy(i.direction).applyQuaternion(u);
    const y = Math.max(r[p], xt), f = Math.max(r[p + 1], xt), x = Math.max(r[p + 2], xt);
    n.set(
      n.x / y,
      n.y / f,
      n.z / x
    ), l.set(
      l.x / y,
      l.y / f,
      l.z / x
    );
    const k = l.lengthSq();
    if (k <= Number.EPSILON) continue;
    const L = Math.max(
      0,
      -n.dot(l) / k
    );
    c.copy(n).addScaledVector(l, L);
    const P = Math.min(
      Br,
      v * Math.exp(-0.5 * c.lengthSq())
    );
    if (P < fs || (h *= 1 - P, 1 - h < s)) continue;
    const _ = i.at(L, new C());
    return {
      gaussianIndex: d.gaussianIndex,
      distance: i.origin.distanceTo(_),
      point: _
    };
  }
  return null;
}
class zr {
  constructor(e, t, s, a, r, o, n, l) {
    this.id = e, this.depth = t, this.bounds = s, this.count = a, this.maxSplatRadius = r, this.raycastBounds = l, this.children = o, this.gaussianIndices = n;
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
class Gt {
  constructor(e, t, s, a) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = a, this.bounds = Tr(e), this.rootBounds = Er(this.bounds);
    const r = e.means.array, o = e.scalesOpacity.array, n = [], l = [], c = Array.from({ length: e.count }, (h, d) => d), u = (h, d, p) => {
      const v = n.length;
      n.push(null);
      const y = h.length > t && p < s && d.max.x - d.min.x > Number.EPSILON, f = [];
      if (y) {
        const L = d.getCenter(new C()), P = Array.from({ length: 8 }, () => []);
        for (const _ of h) {
          const R = _ * 4, S = (r[R] >= L.x ? 1 : 0) | (r[R + 1] >= L.y ? 2 : 0) | (r[R + 2] >= L.z ? 4 : 0);
          P[S].push(_);
        }
        for (let _ = 0; _ < 8; _++) {
          const R = P[_];
          R.length !== 0 && f.push(
            u(
              R,
              Dr(d, L, _),
              p + 1
            )
          );
        }
      }
      let x = 0;
      if (f.length > 0)
        for (const L of f)
          x = Math.max(
            x,
            n[L].maxSplatRadius
          );
      else {
        for (const L of h) {
          const P = L * 4;
          x = Math.max(
            x,
            o[P],
            o[P + 1],
            o[P + 2]
          );
        }
        l.push(v);
      }
      const k = d.clone().expandByScalar(x * 3);
      return n[v] = new zr(
        v,
        p,
        d,
        h.length,
        x,
        f,
        f.length === 0 ? Uint32Array.from(h) : null,
        k
      ), v;
    };
    u(c, this.rootBounds.clone(), 0), this.nodes = n, this.leafNodeIds = Uint32Array.from(l);
  }
  data;
  leafCapacity;
  maxDepth;
  static build(e, t = {}) {
    const s = t.leafCapacity ?? 256, a = t.maxDepth ?? 10;
    if (!Number.isInteger(s) || s <= 0)
      throw new RangeError("GaussianOctree leafCapacity must be positive");
    if (!Number.isInteger(a) || a < 0)
      throw new RangeError("GaussianOctree maxDepth must be non-negative");
    return new Gt(
      e,
      s,
      a,
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
    const a = t.maxHits ?? 1 / 0;
    if (!(a > 0)) return [];
    const r = [], o = [this.rootNode];
    for (; o.length > 0; ) {
      const n = this.nodes[o.pop()], l = Math.max(0, s - 3) * n.maxSplatRadius, c = l === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(l);
      if (e.intersectsBox(c))
        if (n.gaussianIndices !== null)
          for (const u of n.gaussianIndices) r.push(u);
        else
          for (const u of n.children) o.push(u);
    }
    return this.raycastIndices(e, r, s, a);
  }
  raycastIndices(e, t, s = 3, a = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(a > 0)) return [];
    const r = this.data.means.array, o = this.data.scalesOpacity.array, n = new C(), l = new C(), c = [];
    for (let u = 0; u < t.length; u++) {
      const h = t[u], d = h * 4;
      n.set(r[d], r[d + 1], r[d + 2]);
      const p = Math.max(
        o[d],
        o[d + 1],
        o[d + 2]
      ) * s;
      e.closestPointToPoint(n, l), !(l.distanceToSquared(n) > p * p) && c.push({
        gaussianIndex: h,
        distance: e.origin.distanceTo(l),
        point: l.clone()
      });
    }
    return c.sort((u, h) => u.distance - h.distance), c.length > a && (c.length = a), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function Tr(i) {
  const e = i.means.array, t = new Rt(), s = new C();
  for (let a = 0; a < i.count; a++) {
    const r = a * 4;
    s.set(e[r], e[r + 1], e[r + 2]), t.expandByPoint(s);
  }
  return t;
}
function Er(i) {
  const e = i.getCenter(new C()), t = i.getSize(new C()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new Rt(
    new C(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new C(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function Dr(i, e, t) {
  return new Rt(
    new C(
      t & 1 ? e.x : i.min.x,
      t & 2 ? e.y : i.min.y,
      t & 4 ? e.z : i.min.z
    ),
    new C(
      t & 1 ? i.max.x : e.x,
      t & 2 ? i.max.y : e.y,
      t & 4 ? i.max.z : e.z
    )
  );
}
class gs extends Rs {
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
  constructor(e, t, s, a = "GaussianCloud", r = null, o = null, n = 0) {
    super(), this.ownerStore = e, this.objectId = t, this.packedGaussianCount = s, this.lod = r, this.packing = o, this.priority = n, this.name = a;
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
    const s = new Te().copy(this.matrixWorld).invert(), a = new ar().copy(e.ray).applyMatrix4(s), r = this.raycastMode === "full" ? this.lod.octree.raycast(a) : this.lod.raycast(a, this.packing), o = $r(
      a,
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
class wa extends nr {
  constructor(e, t = {}) {
    const s = t.minDepth ?? 0, a = t.maxDepth ?? 1 / 0, r = e.nodes.filter(
      (h) => h.depth >= s && h.depth <= a && (t.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(r.length * 12 * 2 * 3);
    let n = 0;
    for (const h of r) {
      const { min: d, max: p } = h.bounds, v = [
        [d.x, d.y, d.z],
        [p.x, d.y, d.z],
        [p.x, p.y, d.z],
        [d.x, p.y, d.z],
        [d.x, d.y, p.z],
        [p.x, d.y, p.z],
        [p.x, p.y, p.z],
        [d.x, p.y, p.z]
      ];
      for (const [y, f] of jr)
        o.set(v[y], n), o.set(v[f], n + 3), n += 6;
    }
    const l = new or();
    l.setAttribute("position", new lr(o, 3)), l.computeBoundingSphere();
    const c = t.opacity ?? 0.55, u = new cr({
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
const jr = [
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
class ms {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const Ur = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class It {
  constructor(e, t) {
    this.octree = e, this.levels = Wr(t.levels ?? Ur), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? Fr, a = new Float64Array(e.data.count);
    for (let r = 0; r < a.length; r++) {
      const o = s(r, e);
      a[r] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((r) => {
      if (r.gaussianIndices === null)
        return new ms(
          r.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(r.gaussianIndices).sort(
          (n, l) => a[l] - a[n] || n - l
        )
      );
      return new ms(
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
    return new It(e, t);
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
    let a = 0;
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
      if (a + c > t.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let u = 0; u < c; u++)
        t[a++] = n.sortedGaussianIndices[u];
    }
    if (a !== t.length)
      throw new RangeError(
        `GaussianLodPacking declares ${t.length} Gaussians but selects ${a}`
      );
    return t;
  }
  raycast(e, t, s = {}) {
    this.assertUsable();
    const a = s.radiusScale ?? 3;
    if (!(a > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const r = s.maxHits ?? 1 / 0;
    if (!(r > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const o = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, l = new C(), c = new C(), u = [], h = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.nodeIds.length; d++) {
      const p = t.nodeIds[d], v = this.getLeafNode(p);
      if (h.has(p))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${p}`
        );
      h.add(p);
      const y = t.lodLevels[d], f = v.levelCounts[y];
      if (f === void 0)
        throw new RangeError(`GaussianLod level ${y} does not exist`);
      const x = this.octree.nodes[p], k = Math.max(0, a - 3) * x.maxSplatRadius, L = k === 0 ? x.raycastBounds : x.raycastBounds.clone().expandByScalar(k);
      if (e.intersectsBox(L))
        for (let P = 0; P < f; P++) {
          const _ = v.sortedGaussianIndices[P], R = _ * 4;
          l.set(o[R], o[R + 1], o[R + 2]);
          const S = Math.max(
            n[R],
            n[R + 1],
            n[R + 2]
          ) * a;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > S * S) && u.push({
            gaussianIndex: _,
            distance: e.origin.distanceTo(c),
            point: c.clone()
          });
        }
    }
    return u.sort((d, p) => d.distance - p.distance), u.length > r && (u.length = r), u;
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
function Wr(i) {
  if (i.length === 0 || i.length > 256)
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  let e = 0;
  const t = i.map(({ retention: s }) => {
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
function Fr(i, e) {
  const t = e.data.scalesOpacity.array, s = i * 4, a = [t[s], t[s + 1], t[s + 2]];
  return a.sort((r, o) => o - r), t[s + 3] * a[0] * a[1];
}
const Vr = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class ka extends Rs {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : Vr, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: e.levelCount }, (a, r) => r)
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
    for (const [s, a] of this.levelMeshes)
      a.visible = t.has(s);
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
    const t = new C(), s = new C(), a = new Te();
    for (let r = 0; r < e.length; r++) {
      const o = e[r];
      if (o.length === 0) continue;
      const n = new ur(1, 1, 1), l = new dr({
        color: this.colors[r % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: hr,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new pr(n, l, o.length);
      for (let u = 0; u < o.length; u++) {
        const h = this.lod.octree.nodes[o[u]].bounds;
        h.getCenter(t), h.getSize(s), a.makeScale(s.x, s.y, s.z), a.setPosition(t), c.setMatrixAt(u, a);
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
const Mt = G("uint", "gaussianIndex"), At = G("uint", "gaussianObjectId"), at = G("vec3", "gaussianPositionLocal"), Qe = G("vec3", "gaussianPositionWorld"), nt = G("vec3", "gaussianScale"), ot = G("vec4", "gaussianRotation"), lt = G("float", "gaussianOpacity"), Ot = G("vec3", "gaussianColor"), Bt = G("mat4", "gaussianObjectMatrix"), $t = G("bool", "gaussianObjectVisible"), zt = G("vec3", "gaussianViewDirection"), Tt = G("float", "gaussianViewDepth"), Et = G(
  "vec2",
  "gaussianScreenPosition"
), Bs = G(
  "vec2",
  "gaussianScreenBoundsMin"
), $s = G(
  "vec2",
  "gaussianScreenBoundsMax"
), Dt = G(
  "vec2",
  "gaussianProjectedSigma"
), jt = G("float", "gaussianProjectedArea"), ct = G("uint", "rasterGaussianIndex"), Ut = G("uint", "rasterObjectId"), Wt = G("uvec2", "rasterPixelCoordinate"), Ft = G("vec2", "rasterScreenPosition"), Vt = G("vec2", "rasterScreenUV"), qt = G("float", "rasterPixelValue"), Kt = G("vec2", "rasterGaussianCenter"), Yt = G("vec2", "rasterPixelDelta"), zs = G("vec2", "rasterGaussianCoord"), Ts = G("vec2", "rasterUV"), Xt = G("float", "rasterViewDepth"), Ht = G("vec3", "rasterGaussianColor"), Zt = G("float", "rasterGaussianOpacity"), Qt = G("float", "rasterPower"), Es = G("float", "rasterWeight");
function qr() {
  return {
    gaussianPositionLocalNode: at,
    gaussianPositionWorldNode: Qe,
    gaussianScaleNode: nt,
    gaussianRotationNode: ot,
    gaussianOpacityNode: lt,
    gaussianColorNode: Ot,
    gaussianVisibilityNode: le(!0),
    rasterPixelValueNode: W(0),
    rasterBreakNode: le(!1),
    rasterColorNode: Ht,
    rasterAlphaNode: Zt.mul(Is(Qt)),
    rasterDiscardNode: le(!1)
  };
}
const He = /* @__PURE__ */ new Set([
  Mt,
  At,
  at,
  Qe,
  nt,
  ot,
  lt,
  Ot,
  Bt,
  $t,
  zt,
  Tt,
  Et,
  Bs,
  $s,
  Dt,
  jt
]), Jt = /* @__PURE__ */ new Set([
  ct,
  Ut,
  Wt,
  Ft,
  Vt,
  qt,
  Kt,
  Yt,
  zs,
  Ts,
  Xt,
  Ht,
  Zt,
  Qt,
  Es
]), Ds = /* @__PURE__ */ new Set([
  Wt,
  Ft,
  Vt
]), Kr = /* @__PURE__ */ new Set([
  ...Ds,
  qt,
  ct,
  Ut,
  Kt,
  Yt,
  Xt
]);
function js(i, e, t) {
  i.traverse((s) => {
    if ((He.has(s) || Jt.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function Le(i, e, t) {
  i.traverse((s) => {
    if ((He.has(s) || Jt.has(s)) && !e.has(s))
      throw new Error(
        `GaussianPass.${t} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const Yr = [
  15228264,
  15906891,
  4900235
];
class Sa {
  constructor(e, t = {}) {
    if (this.pass = e, t.colors !== void 0 && t.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = t.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...t.colors ?? Yr], this.tintStrength = s, this.lodLevelAttribute = e.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = e.subscribeDebug(() => this.update()), this.enabled = t.enabled ?? !0;
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
    const e = this.lodLevelAttribute.bufferAttribute, t = m(e, "uint", e.count).toReadOnly().element(ct).mod(g(this.colors.length)), s = this.colors.map((o) => {
      const n = new fr(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return it(n.r, n.g, n.b);
    });
    let a = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      a = t.equal(g(o)).select(s[o], a);
    const r = kr(
      this.baseColorNode,
      a,
      W(this.tintStrength)
    );
    this.boundBuffer = e, this.helperColorNode = r, this.pass.rasterColorNode = r;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function Ee(i) {
  if (!Number.isInteger(i) || i < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class Ca {
  setFromCamera(e, t) {
    return this;
  }
  pack({ lod: e, maxGaussians: t }) {
    Ee(t);
    const s = e.octree.data.count;
    if (t < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${t}`
      );
    const a = e.octree.leafNodeIds.slice(), r = new Uint8Array(a.length);
    return r.fill(e.finestLevel), { nodeIds: a, lodLevels: r, gaussianCount: s };
  }
}
function es(i, e, t) {
  return i.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), i.getWorldPosition(t), e.worldToLocal(t);
}
function ts(i, e) {
  const t = e instanceof C ? e.clone() : i.octree.bounds.getCenter(new C()), s = i.octree.rootBounds.getSize(new C()), a = Math.max(s.length() * 0.5, Number.EPSILON), r = new C(), o = Array.from(i.octree.leafNodeIds, (n) => (i.octree.nodes[n].bounds.getCenter(r), {
    nodeId: n,
    radius: r.distanceTo(t) / a
  }));
  return o.sort(
    (n, l) => n.radius - l.radius || n.nodeId - l.nodeId
  ), o;
}
class La {
  cameraCenter = new C();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof C ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof C ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      es(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ee(t), t === 0) return Xr();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const a = ts(e, this.center), r = [];
    let o = 0;
    for (const l of a) {
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
function Xr() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Hr {
  cameraCenter = new C();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof C ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = Zr(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof C ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      es(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ee(t), t === 0) return Qr();
    const s = e.octree.data.count;
    if (s <= t) {
      const h = e.octree.leafNodeIds.slice(), d = new Uint8Array(h.length);
      return d.fill(e.finestLevel), { nodeIds: h, lodLevels: d, gaussianCount: s };
    }
    const a = ts(e, this.center), r = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], o = [], n = [];
    let l = 0, c = 0, u = 0;
    for (let h = 0; h < r.length; h++) {
      const d = this.budgetShares[h];
      if (u += d, d === 0) continue;
      const p = h === r.length - 1 ? t : Math.floor(t * u), v = r[h];
      for (; c < a.length; ) {
        const y = a[c], f = e.nodes[y.nodeId].levelCounts[v];
        if (l + f > p) break;
        o.push(y.nodeId), n.push(v), l += f, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(n),
      gaussianCount: l
    };
  }
}
function Zr(i) {
  let e = 0;
  for (const t of i) {
    if (!(t >= 0 && t <= 1))
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    e += t;
  }
  if (Math.abs(e - 1) > 1e-6)
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  return Object.freeze([...i]);
}
function Qr() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Na {
  cameraCenter = new C();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof C ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof C ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      es(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ee(t), t === 0) return Jr();
    const s = ts(e, this.center), a = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let r = s.reduce(
      (n, l, c) => n + e.nodes[l.nodeId].levelCounts[a[c]],
      0
    );
    for (let n = s.length - 1; n >= 0 && r > t; n--) {
      const l = e.nodes[s[n].nodeId];
      for (; a[n] > 0 && r > t; ) {
        const c = l.levelCounts[a[n]];
        a[n] = a[n] - 1, r -= c - l.levelCounts[a[n]];
      }
    }
    let o = s.length;
    for (; o > 0 && r > t; ) {
      o--;
      const n = e.nodes[s[o].nodeId];
      r -= n.levelCounts[a[o]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, o).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(a.slice(0, o)),
      gaussianCount: r
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
function ei(i) {
  const e = new Uint32Array(i.octree.leafNodeIds), t = new Float64Array(e.length * 3), s = new Uint32Array(e.length * i.levelCount);
  for (let n = 0; n < e.length; n++) {
    const l = e[n], c = i.octree.nodes[l].bounds, u = n * 3;
    t[u] = (c.min.x + c.max.x) * 0.5, t[u + 1] = (c.min.y + c.max.y) * 0.5, t[u + 2] = (c.min.z + c.max.z) * 0.5, s.set(i.nodes[l].levelCounts, n * i.levelCount);
  }
  const a = i.octree.rootBounds.max.x - i.octree.rootBounds.min.x, r = i.octree.rootBounds.max.y - i.octree.rootBounds.min.y, o = i.octree.rootBounds.max.z - i.octree.rootBounds.min.z;
  return {
    leafNodeIds: e,
    leafCenters: t,
    levelCounts: s,
    levelCount: i.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        a * a + r * r + o * o
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const Us = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, vs = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Us], { type: "text/javascript;charset=utf-8" });
function ti(i) {
  let e;
  try {
    if (e = vs && (self.URL || self.webkitURL).createObjectURL(vs), !e) throw "";
    const t = new Worker(e, {
      name: i?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Us),
      {
        name: i?.name
      }
    );
  }
}
const si = 2;
class ri {
  constructor(e) {
    this.targetStrategy = e;
  }
  targetStrategy;
  worker = null;
  boundsCenter = new C();
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
    this.worker = new ti({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const t = ei(e), s = Array.from(
      { length: si },
      () => ii(t.leafNodeIds.length)
    ), a = {
      type: "init",
      data: t,
      buffers: s
    };
    this.worker.postMessage(a, [
      t.leafNodeIds.buffer,
      t.leafCenters.buffer,
      t.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: r, lodLevels: o }) => [r, o])
    ]);
  }
  request(e) {
    this.assertUsable(), this.initialize(e.lod), this.initializeWorker(), this.releaseLatestResult();
    const t = this.targetStrategy.center instanceof C ? this.targetStrategy.center : e.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
    this.latestRequestedRevision = s;
    const a = {
      type: "request",
      revision: s,
      centerX: t.x,
      centerY: t.y,
      centerZ: t.z,
      maxGaussians: e.maxGaussians
    }, o = {
      message: "budgetShares" in this.targetStrategy ? {
        ...a,
        strategy: "tiered",
        budgetShares: this.targetStrategy.budgetShares
      } : {
        ...a,
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
      const a = this.latestError;
      throw this.latestError = null, a;
    }
    const e = this.latestResult;
    if (e === null) return null;
    this.latestResult = null;
    const { message: t } = e;
    let s = !1;
    return {
      packing: ai(t),
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
    const t = e.data, s = performance.now() - this.activeStarted, a = this.activeMaxGaussians;
    this.busy = !1, t.revision === this.latestRequestedRevision ? (this.releaseLatestResult(), this.latestResult = { message: t, maxGaussians: a, roundTripMs: s }) : (this.discarded++, this.recycle(t.buffer));
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
function ii(i) {
  return {
    nodeIds: new ArrayBuffer(i * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(i * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function ai(i) {
  return {
    nodeIds: new Uint32Array(i.buffer.nodeIds, 0, i.length),
    lodLevels: new Uint8Array(i.buffer.lodLevels, 0, i.length),
    gaussianCount: i.gaussianCount
  };
}
const ni = 1024 * 1024, oi = 16, li = 1.25;
class Ws {
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
    if (this.targetStrategy = e, this.targetPlanner = t.targetPlanner ?? null, this.maxUploadBytesPerPack = t.maxUploadBytesPerPack ?? ni, this.maxChangedCellsPerPack = t.maxChangedCellsPerPack ?? oi, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
    if (Ee(e.maxGaussians), this.bindLod(e.lod), !this.initialized) {
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
    if (Ee(e.maxGaussians), this.bindLod(e.lod), !this.initialized)
      throw new Error(
        "StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches"
      );
    if (this.refreshTarget(e), this.changeCursor >= this.changes.length) return null;
    const t = [];
    let s = 0;
    for (; this.changeCursor < this.changes.length; ) {
      const a = this.changes[this.changeCursor], r = t.length >= this.maxChangedCellsPerPack || s + a.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (t.length > 0 && r && this.appliedGaussianCount <= e.maxGaussians)
        break;
      this.applyChange(a), t.push({ nodeId: a.nodeId, lodLevel: a.lodLevel }), s += a.estimatedUploadBytes, this.changeCursor++;
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
    return ys(e.lod, t, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.targetDirty = !1, t;
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
        ys(e.lod, t.packing, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.changes = this.planChanges(e.lod, t.packing), this.changeCursor = 0, this.latestTargetPlanningMs = t.planningMs, this.latestTargetRoundTripMs = t.roundTripMs;
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
    const a = [], r = [];
    for (let o = this.appliedCellCount - 1; o >= 0; o--) {
      const n = this.appliedNodeIds[o], l = this.appliedLodLevels[o], c = s[n];
      (c < 0 || c < l) && a.push(
        xs(
          e,
          n,
          l,
          c < 0 ? null : c
        )
      );
    }
    for (let o = 0; o < t.nodeIds.length; o++) {
      const n = t.nodeIds[o], l = t.lodLevels[o], c = this.appliedIndices[n], u = c < 0 ? null : this.appliedLodLevels[c];
      (u === null || l > u) && r.push(xs(e, n, u, l));
    }
    return [...a, ...r];
  }
  applyChange(e) {
    const t = this.appliedIndices[e.nodeId];
    if (e.lodLevel === null) {
      if (t < 0) return;
      const s = --this.appliedCellCount;
      if (t !== s) {
        const a = this.appliedNodeIds[s];
        this.appliedNodeIds[t] = a, this.appliedLodLevels[t] = this.appliedLodLevels[s], this.appliedIndices[a] = t;
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
function bs(i) {
  return i instanceof Ws;
}
function xs(i, e, t, s) {
  const a = i.nodes[e], r = t === null ? 0 : a.levelCounts[t], o = s === null ? 0 : a.levelCounts[s], n = Math.max(0, o - r), l = Math.max(0, r - o), c = t !== null && s !== null && t !== s ? Math.min(r, o) : 0, u = 48 + i.octree.data.shCoefficientCount * As + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: o - r,
    estimatedUploadBytes: Math.ceil(
      (n * u + l * 16 + c * 4) * li
    )
  };
}
function ys(i, e, t) {
  if (e.gaussianCount > t)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${t} Gaussians`
    );
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let a = 0;
  for (let r = 0; r < e.nodeIds.length; r++) {
    const o = e.nodeIds[r], n = e.lodLevels[r], c = i.nodes[o]?.levelCounts[n];
    if (c === void 0 || i.octree.nodes[o]?.isLeaf !== !0)
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${o} or level ${n}`
      );
    if (s.has(o))
      throw new Error(`GaussianLod packing contains duplicate node ${o}`);
    s.add(o), a += c;
  }
  if (a !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${a}`
    );
}
class ci {
  allocate({ remainingGaussians: e }) {
    return e;
  }
}
class Pa {
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
function Ke(i, e, t) {
  if (i.length === 0) return [];
  i.sort((h, d) => h - d);
  const s = [];
  let a = i[0], r = a, o = 1;
  for (let h = 1; h <= i.length; h++) {
    const d = i[h];
    if (d !== r) {
      if (d !== void 0 && o++, d === r + 1) {
        r = d;
        continue;
      }
      s.push({ start: a, count: r - a + 1 }), d !== void 0 && (a = r = d);
    }
  }
  if (s.length < 2) return s;
  const n = Math.floor(o * t);
  let l = 0;
  const c = [];
  let u = { ...s[0] };
  for (let h = 1; h < s.length; h++) {
    const d = s[h], p = u.start + u.count, v = d.start - p;
    v <= e && l + v <= n ? (u.count = d.start + d.count - u.start, l += v) : (c.push(u), u = { ...d });
  }
  return c.push(u), c;
}
function Ye(i) {
  let e = 0;
  for (const t of i) e += t.count;
  return e;
}
function ie(i, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      i.addUpdateRange(
        s.start * t,
        s.count * t
      );
    i.needsUpdate = !0;
  }
}
const Fs = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), Vs = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), qs = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class ui {
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
  [Fs](e) {
    this.assertUsable();
    const t = this.packedBuffer, s = new ze(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [Vs](e) {
    ie(this.bufferAttribute, e, 1);
  }
  [qs]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const Ks = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), Ys = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class di {
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
  [Ks](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const a = new ui(e, t);
    return this.attributes.set(e, a), a;
  }
  [Ys]() {
    for (const e of this.attributes.values())
      e[qs]();
    this.attributes.clear();
  }
}
class hi {
  constructor(e) {
    this.attribute = e;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(e) {
    this.writtenSlots.length = 0, this.attribute[Fs](new Uint32Array(e)), this.freshBuffer = !0;
  }
  backfill(e) {
    const t = this.attribute.array;
    for (const s of e.cells)
      for (const a of s.slots)
        t[a] = s.lodLevel, this.writtenSlots.push(a);
  }
  updateCell(e) {
    const { previousCell: t, cell: s, retainedCount: a } = e, r = t?.lodLevel === s.lodLevel ? a : 0, o = this.attribute.array;
    for (let n = r; n < s.slots.length; n++) {
      const l = s.slots[n];
      o[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const e = this.writtenSlots.length, t = Ke(this.writtenSlots, 16, 0.25), s = Ye(t);
    return this.freshBuffer || this.attribute[Vs](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const pi = 16777216;
class Ra {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new di();
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
    this.loader = e.loader ?? new Ir(), this.budgetingStrategy = e.budgetingStrategy ?? new ci(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = mi(
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
    const t = this.attributes[Ks](
      "lodLevel",
      "u32"
    ), s = new hi(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let a = null, r = null;
    try {
      return a = Gt.build(s, {
        ...t.octree,
        ownsData: !0
      }), r = It.build(a, {
        ...t.lod,
        ownsOctree: !0
      }), this.addLod(r, {
        name: t.name ?? gi(e),
        priority: t.priority,
        packingStrategy: t.packingStrategy,
        ownsLod: !0
      });
    } catch (o) {
      throw r !== null ? r.dispose() : a !== null ? a.dispose() : s.dispose(), o;
    }
  }
  add(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), a = wt(t.priority ?? 0), r = new gs(
      this,
      s,
      0,
      t.name,
      null,
      null,
      a
    );
    return this.entries.push({
      cloud: r,
      count: 0,
      sourceGaussianCount: e.count,
      sourceDegree: e.shDegree,
      priority: a,
      packingStrategy: null,
      ownsPackingStrategy: !1,
      lastLodFocus: new C(Number.NaN, Number.NaN, Number.NaN),
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
    const s = this.allocateObjectId(), a = wt(t.priority ?? 0), r = new gs(
      this,
      s,
      0,
      t.name,
      e,
      null,
      a
    ), o = t.packingStrategy ?? this.defaultPackingStrategy ?? vi(this.defaultStreamingLod);
    return this.entries.push({
      cloud: r,
      count: 0,
      sourceGaussianCount: e.octree.data.count,
      sourceDegree: e.octree.data.shDegree,
      priority: a,
      packingStrategy: o,
      ownsPackingStrategy: t.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new C(Number.NaN, Number.NaN, Number.NaN),
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
    const t = this.entries.findIndex((a) => a.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && _s(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = yi(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), a = performance.now(), r = this.planPackings(s), o = performance.now() - a, n = Math.min(
      s,
      this.entries.reduce((p, v) => p + v.sourceGaussianCount, 0)
    ), l = this.packedData, c = l !== null && l.count === n && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), h = c ? this.updatePackedData(r, l) : this.buildPackedData(r, n), d = performance.now() - u;
    for (const p of r)
      p.entry.count = p.count, p.entry.packing = p.packing, p.entry.allocatedBudget = p.allocatedBudget, p.entry.packingDirty = !1, p.entry.cloud.updatePacking(p.count, p.packing);
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
    if (!bs(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const a = performance.now(), r = s.takeNextBatch({
      lod: t.lod,
      maxGaussians: t.allocatedBudget
    }), o = performance.now() - a;
    if (r === null)
      return { applied: !1, pending: s.needsPack };
    const n = this.packedData, l = this.cellSlotsByEntry.get(t);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const c = performance.now(), u = l, h = this.freeSlots, d = this.scratchReleasedSlots;
    d.length = 0;
    const p = /* @__PURE__ */ new Map();
    for (const w of r.transitions) {
      const I = l.get(w.nodeId), $ = w.lodLevel === null ? 0 : t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], B = Math.min(
        I?.slots.length ?? 0,
        $
      );
      if (p.set(w.nodeId, {
        previousCell: I,
        retainedCount: B
      }), I !== void 0)
        for (let E = B; E < I.slots.length; E++) {
          const T = I.slots[E];
          h.push(T), d.push(T);
        }
    }
    const v = this.scratchWrittenSlots;
    v.length = 0;
    for (const w of r.transitions) {
      const I = p.get(w.nodeId), { previousCell: $, retainedCount: B } = I;
      if (w.lodLevel === null) {
        u.delete(w.nodeId);
        continue;
      }
      const E = t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], T = $?.slots, U = T !== void 0 && T.length === E ? T : new Uint32Array(E);
      U !== T && T !== void 0 && B > 0 && U.set(T.subarray(0, B));
      for (let q = B; q < E; q++) {
        const he = h.pop();
        if (he === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, w.nodeId, q),
          he,
          n.means.array,
          n.scalesOpacity.array,
          n.rotations.array,
          n.shCoefficients.array,
          n.shCoefficientCount
        ), U[q] = he, v.push(he);
      }
      const de = {
        lodLevel: w.lodLevel,
        slots: U
      };
      for (const q of this.attributePackers)
        q.updateCell({ previousCell: $, cell: de, retainedCount: B });
      u.set(w.nodeId, de);
    }
    const y = this.nextSlotMarkGeneration(n.count);
    for (const w of v) this.slotMarks[w] = y;
    const f = this.scratchClearedSlots;
    f.length = 0;
    for (const w of d)
      this.slotMarks[w] !== y && f.push(w);
    const x = n.scalesOpacity.array;
    for (const w of f) x[w * 4 + 3] = 0;
    const k = Ke(v, 4, 0.15), L = Ke(f, 16, 0.25);
    ie(n.means, k, 4), ie(n.scalesOpacity, k, 4), ie(n.scalesOpacity, L, 4), ie(n.rotations, k, 4), ie(
      n.shCoefficients,
      k,
      n.shCoefficientCount * n.shCoefficients.itemSize
    );
    const P = this.commitAttributePackers(), _ = this.count - t.count + r.packing.gaussianCount, R = Ye(k), S = Ye(L), O = performance.now() - c;
    return t.count = r.packing.gaussianCount, t.packing = r.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = h, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: n.count,
      activeGaussians: _,
      reusedSlots: _ - v.length,
      writtenSlots: v.length,
      clearedSlots: f.length,
      estimatedUploadBytes: R * _t(n) + S * 16 + P.estimatedUploadBytes,
      writtenSlotRanges: k,
      clearedSlotRanges: L,
      planningMs: o,
      slotUpdateMs: O
    }, { applied: !0, pending: r.pending };
  }
  planPackings(e) {
    const t = [...this.entries].sort(
      (r, o) => r.priority - o.priority || r.cloud.objectId - o.cloud.objectId
    ), s = [];
    let a = 0;
    for (const r of t) {
      const o = Math.max(0, e - a), n = this.budgetingStrategy.allocate({
        capacity: e,
        allocatedGaussians: a,
        remainingGaussians: o,
        entry: {
          cloud: r.cloud,
          priority: r.priority,
          insertionIndex: r.cloud.objectId,
          sourceGaussianCount: r.sourceGaussianCount
        }
      });
      if (bi(n, o), r.lod === null) {
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
        }), a += r.sourceGaussianCount;
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
      xi(r.lod, u), s.push({
        entry: r,
        count: u.gaussianCount,
        packing: u,
        allocatedBudget: n,
        selectionChanged: c
      }), a += u.gaussianCount;
    }
    return s;
  }
  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(e, t) {
    this.assertUsable();
    const s = this.entries.find((r) => r.cloud === e);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const a = wt(t);
    s.priority = a, e.updatePackingPriority(a), this.invalidatePacking();
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
    const t = new C(), s = new C();
    let a = 0, r = !1;
    const o = [];
    for (const n of this.entries) {
      const l = n.packingStrategy;
      if (n.lod === null || l === null || !bs(l))
        continue;
      n.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(t), n.cloud.worldToLocal(t);
      const c = n.lod.octree.rootBounds.getSize(new C()).length() * 0.5, u = Math.max(0.05, c * 0.025);
      (!Number.isFinite(n.lastLodFocus.x) || t.distanceToSquared(n.lastLodFocus) >= u * u) && (l.setFromCamera(e, n.cloud), n.lastLodFocus.copy(t));
      let h = !1;
      l.needsPack && (h = this.packLodBatch(n.cloud).applied, h && a++);
      const d = l.needsPack;
      r ||= d, n.lod.octree.rootBounds.getCenter(s), o.push({
        cloud: n.cloud,
        focusDistance: t.distanceTo(s),
        applied: h,
        pending: d,
        targetStats: l.targetStats
      });
    }
    return { appliedBatches: a, pending: r, clouds: o };
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
        e.source !== null && e.ownsSource && e.source.dispose(), e.lod !== null && e.ownsLod && e.lod.dispose(), e.ownsPackingStrategy && _s(e.packingStrategy), e.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[Ys](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(e, t) {
    const s = this.shDegree, a = (s + 1) ** 2, r = new Float32Array(t * 4), o = new Float32Array(t * 4), n = new Float32Array(t * 4), l = new Uint32Array(t * a), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const y of e) {
      const { entry: f } = y, x = /* @__PURE__ */ new Map();
      for (const k of this.plannedCells(y)) {
        const L = new Uint32Array(k.count);
        for (let P = 0; P < k.count; P++) {
          const _ = this.cellSourceIndex(f, k.nodeId, P);
          this.copySourceToSlot(
            f,
            _,
            u,
            r,
            o,
            n,
            l,
            a
          ), L[P] = u++;
        }
        x.set(k.nodeId, {
          lodLevel: k.lodLevel,
          slots: L
        });
      }
      c.set(f, x);
    }
    const h = Array.from(
      { length: t - u },
      (y, f) => t - 1 - f
    ), d = new Ms(
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
    ), p = this.collectPackedLayoutCells(c);
    for (const y of this.attributePackers)
      y.allocate(t), y.backfill({ cells: p });
    const v = this.commitAttributePackers();
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
        estimatedUploadBytes: u * _t(d) + v.estimatedUploadBytes,
        writtenSlotRanges: u === 0 ? [] : [{ start: 0, count: u }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(e, t) {
    const s = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Set();
    let r = 0;
    for (const _ of e) {
      if (a.add(_.entry), r += _.count, !_.selectionChanged) continue;
      const R = /* @__PURE__ */ new Map();
      for (const S of this.plannedCells(_))
        R.set(S.nodeId, S);
      s.set(_.entry, R);
    }
    const o = [...this.freeSlots], n = this.scratchReleasedSlots;
    n.length = 0;
    for (const [_, R] of this.cellSlotsByEntry) {
      const S = s.get(_);
      if (!(S === void 0 && a.has(_)))
        for (const [O, w] of R) {
          const I = w.slots, $ = Math.min(
            I.length,
            S?.get(O)?.count ?? 0
          );
          for (let B = $; B < I.length; B++) {
            const E = I[B];
            o.push(E), n.push(E);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), c = this.scratchWrittenSlots;
    c.length = 0;
    let u = 0;
    for (const _ of e) {
      const R = this.cellSlotsByEntry.get(_.entry);
      if (!_.selectionChanged && R !== void 0) {
        l.set(_.entry, R), u += _.count;
        continue;
      }
      const S = /* @__PURE__ */ new Map();
      for (const O of s.get(_.entry)?.values() ?? []) {
        const w = R?.get(O.nodeId), I = w?.slots, $ = Math.min(I?.length ?? 0, O.count), B = I !== void 0 && I.length === O.count ? I : new Uint32Array(O.count);
        B !== I && I !== void 0 && $ > 0 && B.set(I.subarray(0, $)), u += $;
        for (let T = $; T < O.count; T++) {
          const U = o.pop();
          if (U === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            _.entry,
            this.cellSourceIndex(_.entry, O.nodeId, T),
            U,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), B[T] = U, c.push(U);
        }
        const E = {
          lodLevel: O.lodLevel,
          slots: B
        };
        for (const T of this.attributePackers)
          T.updateCell({
            previousCell: w,
            cell: E,
            retainedCount: $
          });
        S.set(O.nodeId, E);
      }
      l.set(_.entry, S);
    }
    const h = this.nextSlotMarkGeneration(t.count);
    for (const _ of c) this.slotMarks[_] = h;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const _ of n)
      this.slotMarks[_] !== h && d.push(_);
    const p = t.scalesOpacity.array;
    for (const _ of d) p[_ * 4 + 3] = 0;
    const v = c.length, y = d.length, f = Ke(c, 4, 0.15), x = Ke(d, 16, 0.25);
    ie(t.means, f, 4), ie(t.scalesOpacity, f, 4), ie(t.scalesOpacity, x, 4), ie(t.rotations, f, 4), ie(
      t.shCoefficients,
      f,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const k = this.commitAttributePackers(), L = Ye(f), P = Ye(x);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: r,
        reusedSlots: u,
        writtenSlots: v,
        clearedSlots: y,
        estimatedUploadBytes: L * _t(t) + P * 16 + k.estimatedUploadBytes,
        writtenSlotRanges: f,
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
      for (const a of s.values())
        t.push(a);
    return t;
  }
  commitAttributePackers() {
    let e = 0, t = 0, s = 0;
    const a = [];
    for (const r of this.attributePackers) {
      const o = r.commit();
      e += o.writtenSlots, t += o.uploadedSlots, s += o.estimatedUploadBytes, a.push(...o.slotRanges);
    }
    return { writtenSlots: e, uploadedSlots: t, estimatedUploadBytes: s, slotRanges: a };
  }
  cellSourceIndex(e, t, s) {
    return e.lod === null ? s : e.lod.nodes[t].sortedGaussianIndices[s];
  }
  copySourceToSlot(e, t, s, a, r, o, n, l) {
    const c = e.lod?.octree.data ?? e.source;
    if (c === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    yt(c.means.array, t, a, s), yt(
      c.scalesOpacity.array,
      t,
      r,
      s
    ), yt(
      c.rotations.array,
      t,
      o,
      s
    ), a[s * 4 + 3] = e.cloud.objectId, fi(
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
    if (e >= pi)
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
function st(i, e, t = 4) {
  const s = new ze(e, t);
  return s.name = i, s;
}
function yt(i, e, t, s) {
  t.set(
    i.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function fi(i, e, t, s, a) {
  const r = i.shCoefficientCount, o = Math.min(
    r,
    a
  ), n = s * a;
  if (t.fill(
    0,
    n,
    n + a
  ), i.shFormat === "rgb8e8") {
    const u = e * r;
    t.set(
      i.shCoefficients.array.subarray(
        u,
        u + o
      ),
      n
    );
    return;
  }
  const l = i.shCoefficients.array, c = e * r * 4;
  for (let u = 0; u < o; u++) {
    const h = c + u * 4;
    t[n + u] = Rr(
      l[h],
      l[h + 1],
      l[h + 2]
    );
  }
}
function _t(i) {
  return 48 + i.shCoefficientCount * Os(i.shFormat);
}
function gi(i) {
  const e = i.split(/[?#]/, 1)[0] ?? i;
  return e.slice(e.lastIndexOf("/") + 1) || "GaussianCloud";
}
function wt(i) {
  if (!Number.isSafeInteger(i))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return i;
}
function mi(i) {
  if (i !== "auto" && (!Number.isSafeInteger(i) || i <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return i;
}
function vi(i) {
  const e = new Hr();
  return new Ws(e, {
    ...i,
    targetPlanner: new ri(e)
  });
}
function _s(i) {
  i !== null && "dispose" in i && typeof i.dispose == "function" && i.dispose();
}
function bi(i, e) {
  if (!Number.isSafeInteger(i) || i < 0 || i > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function xi(i, e) {
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const t = /* @__PURE__ */ new Set();
  let s = 0;
  for (let a = 0; a < e.nodeIds.length; a++) {
    const r = e.nodeIds[a], o = i.nodes[r], n = i.octree.nodes[r], l = e.lodLevels[a], c = o?.levelCounts[l];
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
function yi(i, e) {
  const t = ws(
    i.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = ws(i.maxBufferSize, "maxBufferSize"), a = Math.max(
    16,
    (e + 1) ** 2 * Os("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / a);
}
function ws(i, e) {
  if (!Number.isSafeInteger(i) || i <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return i;
}
const z = 16, b = 256, _i = 8192, j = 512, Lt = 4, N = 1 << Lt, ae = 4, ce = b * ae, Z = ce, ne = 32, wi = (
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
), ki = (
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
  (*dispatch)[0] = vec4<u32>(count, 1u, 1u, 0u);
  return 0u;
}
`
), Si = (
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
function Xs(i, e) {
  return Math.max(1, Math.ceil(2 * i / e));
}
function Ci(i, e) {
  if (i !== null) {
    if (!Number.isInteger(i) || i < b || i % b !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${b} and at least ${b}`
      );
    if (Xs(e, i) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const Li = (
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
  let radix_blocks = (count + ${ce - 1}u) / ${ce}u;
  let reduce_chunks = (radix_blocks + ${Z - 1}u) / ${Z}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${N}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${b - 1}u) / ${b}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Ni(i) {
  return (
    /* wgsl */
    `
fn compact_visible_${i}(
  gid: u32,
  gaussian_count: u32,
  viewport: vec4<f32>,
  visible_offsets: ptr<storage, array<u32>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (gid >= gaussian_count || (*projected_mean)[gid].w <= 0.0) { return 0u; }
  let depth = (*projected_mean)[gid].z;
  (*records)[(*visible_offsets)[gid]] = vec2<u32>(${i === "float32" ? "bitcast<u32>(depth)" : `u32(round(clamp(
          (depth - viewport.z) / (viewport.w - viewport.z),
          0.0,
          1.0
        ) * 65535.0))`}, gid);
  return 0u;
}
`
  );
}
const Pi = (
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
class ue {
  attributes = [];
  createFloat(e, t, s = 4) {
    return this.track(
      e,
      new ze(new Float32Array(t * s), s)
    );
  }
  createUint(e, t, s = 1) {
    return this.track(
      e,
      new ze(new Uint32Array(t * s), s)
    );
  }
  createIndirect(e) {
    return this.track(
      e,
      new gr(new Uint32Array(4), 4)
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
class Ri {
  constructor(e, t, s, a, r) {
    this.renderer = e, this.visibleDispatch = r, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const o = A(
      Pi
    );
    this.computeNode = o({
      rank: ee,
      state: m(r.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: m(
        a,
        "uvec2",
        t
      ).toReadOnly(),
      tile_counts: m(
        s,
        "uint",
        t
      ).toReadOnly(),
      ordered_tile_counts: m(this.tileCounts, "uint", t)
    }).computeKernel([b]).setName("3DGS gather depth-ordered tile counts WGSL");
  }
  renderer;
  visibleDispatch;
  tileCounts;
  attributes = new ue();
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function Hs(i) {
  return (
    /* wgsl */
    `
fn ${i.functionName}(
  lane: u32,
  group_id: u32,
  length: u32,
  input_values: ptr<storage, array<${i.inputType}>, read>,
  output_values: ptr<storage, array<u32>, read_write>,
  block_sums: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${j}>>
) -> u32 {
  let base = group_id * ${j}u;
  let first = base + lane;
  let second = first + ${b}u;
  (*scratch)[lane] = ${i.readValue("first")};
  (*scratch)[lane + ${b}u] = ${i.readValue("second")};
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${j / 2}u;
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
    (*block_sums)[group_id] = (*scratch)[${j - 1}u];
    (*scratch)[${j - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${j / 2}u;
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
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${b}u]; }
  return 0u;
}
`
  );
}
const Gi = Hs({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (i) => `select(0u, (*input_values)[${i}], ${i} < length)`
}), Ii = Hs({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (i) => `select(0u, 1u, ${i} < length && (*input_values)[${i}].w > 0.0)`
}), Mi = (
  /* wgsl */
  `
fn add_scan_offsets(
  index: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    (*values)[index] += (*block_offsets)[index / ${j}u];
  }
  return 0u;
}
`
);
class Nt {
  output;
  attributes = new ue();
  levels = [];
  constructor(e, t, s = "intersections", a = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const r = A(Gi), o = A(
      Ii
    ), n = A(Mi);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const h = Math.ceil(u / j), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        h
      ), p = V("uint", j), v = this.levels.length === 0 && a === "projectedVisibility", y = (v ? o : r)({
        lane: ye,
        group_id: H.x,
        length: g(u),
        input_values: m(
          l,
          v ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: m(c, "uint", u),
        block_sums: m(d, "uint", h),
        scratch: p
      }).computeKernel([b]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
      if (this.levels.push({
        length: u,
        blockCount: h,
        output: c,
        scanNode: y
      }), h <= 1) break;
      l = d, u = h, c = this.attributes.createUint(
        `3dgs.${s}-scan-offsets-${this.levels.length}`,
        u
      );
    }
    for (let h = 0; h < this.levels.length - 1; h++) {
      const d = this.levels[h], p = this.levels[h + 1];
      d.addNode = n({
        index: ee,
        length: g(d.length),
        values: m(d.output, "uint", d.length),
        block_offsets: m(
          p.output,
          "uint",
          p.length
        ).toReadOnly()
      }).compute(d.length, [b]).setName(`3DGS ${s} add scan offsets WGSL ${h}`);
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
class Ai {
  constructor(e, t) {
    this.camera = e, this.background = t;
  }
  camera;
  background;
  projection = We(new Te());
  view = We(new Te());
  viewport = We(new mr());
  tilesX = We(1, "uint");
  tilesY = We(1, "uint");
  update(e, t, s, a) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = a;
  }
}
function Zs(i) {
  const { center: e, conic: t, powerThreshold: s, tileX: a, tileY: r, onHit: o } = i;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${a}), f32(${r})) * ${z}.0;
      let rect_max = rect_min + vec2<f32>(${z}.0);
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
          select(-${z}.0, ${z}.0, x_left),
          select(-${z}.0, ${z}.0, y_above)
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
const Oi = (
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
  let radix_blocks = (count + ${ce - 1}u) / ${ce}u;
  let reduce_chunks = (radix_blocks + ${Z - 1}u) / ${Z}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${N}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${b - 1}u) / ${b}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), Bi = (() => {
  const i = Zs({
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
    clamp(i32(floor((center.x - radius.x) / ${z}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${z}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${z}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${z}.0)), 0, max_tile_y)
  );
  let reserved_count = (*tile_counts)[rank];
  var local_index = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
${i}
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
class $i {
  constructor(e, t, s, a, r, o, n, l, c, u, h) {
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
    const d = m(
      o,
      "uint",
      t
    ).toReadOnly(), p = m(
      n,
      "uint",
      t
    ).toReadOnly(), v = m(
      r.state,
      "uvec4",
      1
    ).toReadOnly(), y = A(Oi);
    this.prepareNode = y({
      item_count_state: v,
      capacity: g(s),
      tile_counts: d,
      intersection_offsets: p,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const f = A(Bi);
    this.emitNode = f({
      rank: ee,
      tiles: Ze(h.tilesX, h.tilesY),
      capacity: g(s),
      sorted_gaussians: m(
        a,
        "uvec2",
        t
      ).toReadOnly(),
      projected_mean: m(
        l,
        "vec4",
        t
      ).toReadOnly(),
      projected_conic: m(
        c,
        "vec4",
        t
      ).toReadOnly(),
      projected_color: m(
        u,
        "vec4",
        t
      ).toReadOnly(),
      tile_counts: d,
      intersection_offsets: p,
      visible_state: v,
      records: m(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([b]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = r;
  }
  renderer;
  capacity;
  buffers;
  dispatch;
  attributes = new ue();
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
const Pt = 10;
class zi {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * Pt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new ze(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Te();
  inverseModel = new Te();
  cameraWorldPosition = new C();
  cameraLocalPosition = new C();
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
    const t = this.frameComponentOffset + e.objectId * Pt * 4;
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = Ti(e, this.camera) ? 1 : 0;
  }
}
function Ti(i, e) {
  if (!i.layers.test(e.layers)) return !1;
  let t = i, s = i;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof Gs;
}
function Ei(i) {
  return (
    /* wgsl */
    `
fn project_gaussian_covariance_${i}(
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
  let original_determinant = ${i === "compensated" ? "max(sigma00_unfiltered * sigma11_unfiltered - sigma01 * sigma01, 0.0)" : "1.0"};
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
function Di(i) {
  const e = i === "rgb8e8" ? "u32" : "vec4<f32>", t = i === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (a) => {
    const r = a === 0 ? "base" : `base + ${a}u`;
    return i === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${r}])` : `(*sh_coefficients)[${r}].xyz`;
  };
  return (
    /* wgsl */
    `
fn evaluate_gaussian_sh_${i}(
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
const ji = (
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
function Ui() {
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
${Zs({
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
const Qs = /* @__PURE__ */ new Set([
  Mt,
  At,
  at,
  nt,
  ot,
  lt,
  Bt,
  $t
]), Js = /* @__PURE__ */ new Set([
  ...Qs,
  Qe,
  zt
]), Wi = /* @__PURE__ */ new Set([
  ...Js,
  Tt,
  Et,
  Dt,
  jt
]);
class Fi {
  constructor(e, t, s, a, r, o = !0) {
    this.data = e, this.frame = t, this.antialiasMode = a, this.subpixelSampleCulling = o, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
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
  attributes = new ue();
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
      js(s, He, "projection");
    Le(
      e.gaussianPositionLocalNode,
      Qs,
      "gaussianPositionLocalNode"
    );
    for (const [s, a] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      Le(a, Js, s);
    Le(
      e.gaussianOpacityNode,
      Wi,
      "gaussianOpacityNode"
    ), Le(
      e.gaussianColorNode,
      He,
      "gaussianColorNode"
    ), Le(
      e.gaussianVisibilityNode,
      He,
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
    const { data: t, frame: s } = this, a = m(t.means, "vec4", t.count).toReadOnly(), r = m(
      t.scalesOpacity,
      "vec4",
      t.count
    ).toReadOnly(), o = m(t.rotations, "vec4", t.count).toReadOnly(), n = t.shFormat === "rgb8e8" ? m(
      t.shCoefficients,
      "uint",
      t.count * t.shCoefficientCount
    ).toReadOnly() : m(
      t.shCoefficients,
      "vec4",
      t.count * t.shCoefficientCount
    ).toReadOnly(), l = m(
      this.projectedMean,
      "vec4",
      this.projectedMean.count
    ), c = m(this.projectedConic, "vec4", t.count), u = m(this.projectedColor, "vec4", t.count), h = m(this.tileCounts, "uint", t.count), d = A(
      Ei(this.antialiasMode)
    ), p = A(Di(t.shFormat)), v = A(Ui()), y = A(ji);
    return rt(() => {
      const x = g(ee);
      M(x.greaterThanEqual(g(t.count)), () => {
        me();
      }), h.element(x).assign(g(0)), l.element(x).assign(Q(0));
      const k = a.element(x), L = k.xyz, P = g(k.w), _ = r.element(x), R = _.xyz, S = _.w, O = o.element(x), w = g(t.count).add(
        P.mul(g(Pt))
      ), I = os(
        l.element(w),
        l.element(w.add(1)),
        l.element(w.add(2)),
        l.element(w.add(3))
      ), $ = os(
        l.element(w.add(4)),
        l.element(w.add(5)),
        l.element(w.add(6)),
        l.element(w.add(7))
      ), B = l.element(w.add(8)).xyz, E = l.element(w.add(9)).x.greaterThan(0);
      M(E.not(), () => {
        me();
      });
      const T = /* @__PURE__ */ new Map([
        [Mt, () => x],
        [At, () => P],
        [at, () => L],
        [nt, () => R],
        [ot, () => O],
        [lt, () => S],
        [Bt, () => I],
        [$t, () => E]
      ]), U = Se(
        e.gaussianPositionLocalNode,
        T
      ).toVar("gaussianPositionLocalValue"), de = I.mul(Q(U, 1)).xyz, q = new Map(T);
      q.set(Qe, () => de);
      const he = Sr(U.sub(B));
      q.set(zt, () => he);
      let te;
      if (e.gaussianPositionWorldNode === Qe)
        te = $.mul(Q(U, 1));
      else {
        const Be = Se(
          e.gaussianPositionWorldNode,
          q
        ).toVar("gaussianPositionWorldValue");
        te = s.view.mul(Q(Be, 1));
      }
      te = te.toVar("gaussianViewPosition");
      const pe = Se(e.gaussianScaleNode, q).toVar(
        "gaussianScaleValue"
      ), De = Se(
        e.gaussianRotationNode,
        q
      ).toVar("gaussianRotationValue"), K = d({
        view: te,
        scale_input: pe,
        rotation_input: De,
        model_view: $,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      M(K.element(0).w.lessThanEqual(0), () => {
        me();
      });
      const se = K.element(0).xy, Ne = K.element(0).z, Pe = K.element(1).xyz, Re = K.element(1).w, oe = K.element(2).xyz, je = K.element(2).w, fe = new Map(q);
      fe.set(Tt, () => Ne), fe.set(Et, () => se), fe.set(Dt, () => Ce(oe.xz)), fe.set(
        jt,
        () => Ce(Re).mul(Math.PI)
      );
      const _e = Se(
        e.gaussianOpacityNode,
        fe
      ).clamp(0, 1), Ge = this.antialiasMode === "compensated" ? _e.mul(
        Ce(xe(je.div(Re), 0, 1))
      ) : _e;
      M(Ge.lessThan(W(1 / 255)), () => {
        me();
      });
      const we = Cr(Ge.mul(255)), D = Ce(
        we.mul(2).mul(xe(oe.x, 1e-12, 1e4))
      ), Ie = Ce(
        we.mul(2).mul(xe(oe.z, 1e-12, 1e4))
      ), Ue = ls(D), Me = ls(Ie);
      M(Ue.lessThanEqual(0).or(Me.lessThanEqual(0)), () => {
        me();
      });
      const Je = be(Ue, Me), Ae = se.sub(Je), F = se.add(Je);
      if (M(
        F.x.lessThan(0).or(F.y.lessThan(0)).or(Ae.x.greaterThanEqual(s.viewport.x)).or(Ae.y.greaterThanEqual(s.viewport.y)),
        () => {
          me();
        }
      ), this.subpixelSampleCulling) {
        const Be = y({
          center: se,
          conic: Pe,
          power_threshold: we,
          extent: be(D, Ie),
          viewport: Ze(s.viewport.xy)
        });
        M(Be.not(), () => {
          l.element(x).assign(Q(se, Ne, -1)), me();
        });
      }
      const Y = Xe(cs(s.tilesX), cs(s.tilesY)).sub(1), re = Xe(
        xe(St(Ae.div(W(z))), be(0), be(Y))
      ), X = Xe(
        xe(St(F.div(W(z))), be(0), be(Y))
      ), J = p({
        gid: x,
        sh_degree: g(t.shDegree),
        direction: he,
        sh_coefficients: n
      }), ke = new Map(fe);
      ke.set(Ot, () => J), ke.set(Bs, () => Ae), ke.set($s, () => F);
      const et = Se(
        e.gaussianVisibilityNode,
        ke
      );
      M(et.not(), () => {
        me();
      });
      const ge = v({
        center: se,
        conic: Pe,
        power_threshold: we,
        tile_min: re,
        tile_max: X
      });
      M(ge.equal(0), () => {
        me();
      });
      const Oe = Se(
        e.gaussianColorNode,
        ke
      ).clamp(0, 1);
      l.element(x).assign(Q(se, Ne, Ge)), c.element(x).assign(Q(Pe, Ue)), u.element(x).assign(Q(Oe, Me)), h.element(x).assign(ge);
    })().compute(t.count, [b]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Se(i, e) {
  return i.context({ overrideNodes: e });
}
const Vi = (
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
), qi = b, er = 256, Ki = [2048, 4096, 8192];
function Yi(i) {
  const e = Math.max(0, i.length - 1);
  if (e === 0)
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
  const t = new Uint32Array(e);
  let s = 0, a = 0, r = 0, o = 0, n = 0, l = 0, c = 0, u = 0;
  for (let h = 0; h < e; h++) {
    const d = Math.max(0, i[h + 1] - i[h]);
    t[h] = d, s += d, a = Math.max(a, d), d > 256 && r++, d > 512 && o++, d > 1024 && n++, d > 2048 && l++;
    const p = Math.ceil(d / er);
    c += p, u = Math.max(u, p);
  }
  return t.sort(), {
    max: a,
    mean: s / e,
    median: Xi(t),
    p95: Ss(t, 0.95),
    p99: Ss(t, 0.99),
    tilesOver256: r,
    tilesOver512: o,
    tilesOver1024: n,
    tilesOver2048: l,
    totalBatches: c,
    maxBatches: u
  };
}
function ks(i, e) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const t = Math.max(0, i.length - 1);
  let s = 0, a = 0, r = 0, o = 0, n = 0;
  for (let c = 0; c < t; c++) {
    const u = Math.max(0, i[c + 1] - i[c]), h = Math.min(u, e), d = u - h;
    s += h, a += d, d > 0 && r++;
    const p = Math.ceil(h / er);
    o += p, n = Math.max(n, p);
  }
  const l = s + a;
  return {
    cap: e,
    rasterizedIntersections: s,
    droppedIntersections: a,
    droppedFraction: l === 0 ? 0 : a / l,
    affectedTiles: r,
    totalBatches: o,
    maxBatches: n
  };
}
function Xi(i) {
  const e = Math.floor(i.length / 2);
  return i.length % 2 !== 0 ? i[e] : (i[e - 1] + i[e]) * 0.5;
}
function Ss(i, e) {
  const t = Math.max(0, Math.ceil(i.length * e) - 1);
  return i[t];
}
class Hi {
  constructor(e, t, s, a, r, o) {
    this.renderer = e, this.maxRasterizedSplatsPerTile = o, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const n = A(Vi);
    this.computeNode = n({
      index: ee,
      gaussian_count: g(t),
      viewport: Ze(r.viewport.xy),
      projected_mean: m(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: m(
        a,
        "vec4",
        a.count
      ).toReadOnly(),
      zero_pixel_flags: m(this.zeroPixelFlags, "uint", t)
    }).compute(t, [qi]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
  attributes = new ue();
  zeroPixelFlags;
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode);
  }
  async readStats(e) {
    const [t, s] = await Promise.all([
      this.renderer.getArrayBufferAsync(e),
      this.renderer.getArrayBufferAsync(this.zeroPixelFlags)
    ]), a = new Uint32Array(s);
    let r = 0;
    for (const n of a) r += n;
    const o = new Uint32Array(t);
    return {
      tileLoads: Yi(o),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : ks(o, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: Ki.map(
        (n) => ks(o, n)
      ),
      zeroPixelSubpixelSplats: r
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function Zi(i) {
  return (
    /* wgsl */
    `
fn radix_histogram_${i}(
  lane: u32,
  block_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  partials: ptr<workgroup, array<u32, ${N * ne}>>
) -> u32 {
  let block_start = block_index * ${ce}u;
  let count = (*state)[0].x;
  let subgroup_count = (${b}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${N}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${ae}u; item++) {
      let position = block_start + item * ${b}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${i}u) & ${N - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${ne}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${N}u) {
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
const Qi = (
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
  let subgroup_count = (${b}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${Z}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ae}u; item++) {
    let block = chunk_start + item * ${b}u + lane;
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
), Ji = (
  /* wgsl */
  `
fn scan_radix_reduced(
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  reduced: ptr<storage, array<u32>, read_write>
) -> u32 {
  let chunk_count = ((*state)[0].z + ${Z - 1}u) /
    ${Z}u;
  var running = 0u;
  for (var digit = 0u; digit < ${N}u; digit++) {
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
), ea = (
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
  scratch: ptr<workgroup, array<u32, ${Z}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${Z}u;
  for (var item = 0u; item < ${ae}u; item++) {
    let local = item * ${b}u + lane;
    let block = chunk_start + local;
    var value = 0u;
    if (block < block_count) {
      value = (*block_histograms)[digit * block_stride + block];
    }
    (*scratch)[local] = value;
  }
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${Z / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${ae}u; item++) {
      let worker = item * ${b}u + lane;
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
  if (lane == 0u) { (*scratch)[${Z - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${Z / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${ae}u; item++) {
      let worker = item * ${b}u + lane;
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
    let local = item * ${b}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`
);
function ta(i) {
  return (
    /* wgsl */
    `
fn radix_scatter_${i}(
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
  block_bases: ptr<workgroup, array<u32, ${N}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${N}>>,
  partials: ptr<workgroup, array<u32, ${N * ne}>>
) -> u32 {
  let block_start = block_index * ${ce}u;
  let count = (*state)[0].x;
  let subgroup_count = (${b}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${N}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${b}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${i}u) & ${N - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${N}u; target_digit++) {
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

    if (lane < ${N}u) {
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
function sa(i) {
  return (
    /* wgsl */
    `
fn radix_workgroup_histogram_${i}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  histogram: ptr<workgroup, array<atomic<u32>, ${N}>>
) -> u32 {
  if (lane < ${N}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${ce}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${b}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${i}u) & ${N - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${N}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`
  );
}
const ra = (
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
  scratch: ptr<workgroup, array<u32, ${b}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${Z}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ae}u; item++) {
    let block = chunk_start + item * ${b}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${b / 2}u;
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
function ia(i) {
  return (
    /* wgsl */
    `
fn radix_workgroup_scatter_${i}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<vec2<u32>>, read>,
  records_out: ptr<storage, array<vec2<u32>>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  block_bases: ptr<workgroup, array<u32, ${N}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${N}>>,
  shared_digits: ptr<workgroup, array<u32, ${b}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${N * (b / 32)}>>
) -> u32 {
  let block_start = block_index * ${ce}u;
  let count = (*state)[0].x;
  let words_per_digit = ${b / 32}u;
  if (lane < ${N}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${b}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${N}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${i}u) & ${N - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${N * (b / 32)}u) {
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

    if (lane < ${N}u) {
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
class Cs {
  constructor(e, t, s, a, r, o) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = a, this.dispatch = r, this.backend = o, this.maxRadixBlocks = Math.ceil(s / ce), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / Z), this.blockHistograms = this.attributes.createUint(
      `3dgs.${t}-radix-histograms`,
      this.maxRadixBlocks * N
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${t}-radix-prefixes`,
      this.maxRadixBlocks * N
    ), this.reduced = this.attributes.createUint(
      `3dgs.${t}-radix-reduced`,
      this.maxReduceChunks * N
    );
    const n = m(r.state, "uvec4", 1).toReadOnly(), l = m(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), c = A(
      o === "subgroup" ? Qi : ra
    ), u = {
      lane: ye,
      group_id: H,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: m(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (u.subgroup_index = pt, u.subgroup_lane = ft, u.subgroup_size = gt, u.partials = V("uint", ne)) : u.scratch = V("uint", b), this.reduceNode = c(u).computeKernel([b]).setName(`3DGS ${t} radix reduce WGSL`);
    const h = A(Ji);
    this.scanReducedNode = h({
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      reduced: m(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const d = A(
      ea
    );
    this.scanAddNode = d({
      lane: ye,
      group_id: H,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: m(this.reduced, "uint", this.reduced.count).toReadOnly(),
      block_prefixes: m(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ),
      scratch: V("uint", Z)
    }).computeKernel([b]).setName(`3DGS ${t} radix scan-add WGSL`), this.sortedRecords = a.recordsA;
  }
  renderer;
  label;
  capacity;
  buffers;
  dispatch;
  backend;
  sortedRecords;
  attributes = new ue();
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
    const t = Math.ceil(Math.max(0, e) / Lt);
    this.passes = Array.from(
      { length: t },
      (s, a) => this.createPass(a, a * Lt)
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
    const s = e % 2 === 0, a = s ? this.buffers.recordsA : this.buffers.recordsB, r = s ? this.buffers.recordsB : this.buffers.recordsA, o = m(this.dispatch.state, "uvec4", 1).toReadOnly(), n = m(
      a,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = A(
      this.backend === "subgroup" ? Zi(t) : sa(t)
    ), c = {
      lane: ye,
      block_index: H.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records: n,
      block_histograms: m(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (c.subgroup_index = pt, c.subgroup_lane = ft, c.subgroup_size = gt, c.partials = V(
      "uint",
      N * ne
    )) : c.histogram = V("atomic<u32>", N);
    const u = l(c).computeKernel([b]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), h = A(
      this.backend === "subgroup" ? ta(t) : ia(t)
    ), d = {
      lane: ye,
      block_index: H.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records_in: n,
      records_out: m(r, "uvec2", this.capacity),
      block_prefixes: m(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: V("uint", N),
      local_digit_counts: V("uint", N)
    };
    this.backend === "subgroup" ? (d.subgroup_index = pt, d.subgroup_lane = ft, d.subgroup_size = gt, d.partials = V(
      "uint",
      N * ne
    )) : (d.shared_digits = V("uint", b), d.shared_digit_masks = V(
      "uint",
      N * (b / 32)
    ));
    const p = h(d).computeKernel([b]).setName(`3DGS ${this.label} radix scatter WGSL ${e}`);
    return { histogram: u, scatter: p };
  }
  disposePasses() {
    for (const e of this.passes)
      e.histogram.dispose(), e.scatter.dispose();
    this.passes = [];
  }
}
const aa = (
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
function na(i) {
  return (
    /* wgsl */
    `
fn find_tile_boundaries_${i}(
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
const oa = (
  /* wgsl */
  `
fn suffix_min_blocks(
  lane: u32,
  group_id: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_mins: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${j}>>
) -> u32 {
  let base = group_id * ${j}u;
  let first_local = lane;
  let second_local = lane + ${b}u;
  let first_source = base + (${j - 1}u - first_local);
  let second_source = base + (${j - 1}u - second_local);
  var first_value = 0xffffffffu;
  var second_value = 0xffffffffu;
  if (first_source < length) { first_value = (*values)[first_source]; }
  if (second_source < length) { second_value = (*values)[second_source]; }
  (*scratch)[first_local] = first_value;
  (*scratch)[second_local] = second_value;
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${j / 2}u;
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
    (*block_mins)[group_id] = (*scratch)[${j - 1}u];
    (*scratch)[${j - 1}u] = 0xffffffffu;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${j / 2}u;
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
), la = (
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
    let next_block = index / ${j}u + 1u;
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
class ca {
  attributes = new ue();
  levels = [];
  constructor(e, t) {
    const s = A(oa), a = A(la);
    let r = e, o = t;
    for (; ; ) {
      const n = this.levels.length, l = Math.ceil(o / j), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${n}`,
        l
      ), u = s({
        lane: ye,
        group_id: H.x,
        length: g(o),
        values: m(r, "uint", o),
        block_mins: m(c, "uint", l),
        scratch: V("uint", j)
      }).computeKernel([b]).setName(`3DGS tile offset suffix scan WGSL ${n}`);
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
      l.addNode = a({
        index: ee,
        length: g(l.length),
        block_count: g(c.length),
        values: m(l.values, "uint", l.length),
        block_suffix_mins: m(
          c.values,
          "uint",
          c.length
        ).toReadOnly()
      }).compute(l.length, [b]).setName(`3DGS tile add suffix block mins WGSL ${n}`);
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
class ua {
  constructor(e, t, s, a, r) {
    this.renderer = e, this.dispatch = r, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = m(this.offsets, "uint", s + 1), n = A(aa);
    this.clearNode = n({
      index: ee,
      tile_count: g(s),
      state: m(r.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [b]).setName("3DGS clear tile offsets WGSL");
    const l = A(
      na(t)
    );
    this.boundariesNode = l({
      index: ee,
      tile_count: g(s),
      state: m(r.state, "uvec4", 1).toReadOnly(),
      records: m(
        a,
        "uvec2",
        a.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([b]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new ca(this.offsets, s + 1);
  }
  renderer;
  dispatch;
  offsets;
  attributes = new ue();
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
const Ls = (
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
), da = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${b}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class ha {
  constructor(e, t, s, a, r, o, n, l, c, u, h, d, p, v, y, f, x, k = !1) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = a, this.meansAttribute = r, this.projectedMeanAttribute = o, this.projectedConicAttribute = n, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = h, this.depthTexture = d, this.frame = p, this.maxSplatsPerTile = v, this.rasterChunkSize = y, this.tileCount = f, this.metrics = k ? this.attributes.createUint("3dgs.raster-work", f * 4) : null;
    const L = this.metrics === null ? null : m(this.metrics, "uint", f * 4).toAtomic();
    this.clearMetrics = L === null ? null : rt(() => {
      Lr(L.element(ee), g(0));
    })().compute(f * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(x);
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
  attributes = new ue();
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
      js(r, Jt, "raster");
    Le(
      e.rasterPixelValueNode,
      Ds,
      "rasterPixelValueNode"
    ), Le(
      e.rasterBreakNode,
      Kr,
      "rasterBreakNode"
    );
    const t = this.createRasterNode(e, "direct"), s = this.chunks === null ? null : this.createRasterNode(e, "chunk"), a = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = t, this.chunkComputeNode = s, this.compositeNode = a;
  }
  encode(e, t) {
    if (this.clearMetrics !== null && this.renderer.compute(this.clearMetrics), this.computeNode === null)
      throw new Error("TileRasterizer has no compute node");
    if (this.chunks === null) {
      this.renderer.compute(this.computeNode, [e, t, 1]);
      return;
    }
    if (this.chunkComputeNode === null || this.compositeNode === null)
      throw new Error("TileRasterizer has no chunk compute nodes");
    this.renderer.compute(this.chunks.countNode), this.chunks.offsets.encode(this.renderer), this.renderer.compute(this.chunks.prepareNode), this.renderer.compute(this.chunks.emitNode), this.renderer.compute(this.computeNode, [e, t, 1]), this.renderer.compute(this.chunkComputeNode, this.chunks.dispatch), this.renderer.compute(this.compositeNode, [e, t, 1]);
  }
  dispose() {
    this.clearMetrics?.dispose(), this.computeNode?.dispose(), this.computeNode = null, this.chunkComputeNode?.dispose(), this.chunkComputeNode = null, this.compositeNode?.dispose(), this.compositeNode = null, this.chunks?.countNode.dispose(), this.chunks?.prepareNode.dispose(), this.chunks?.emitNode.dispose(), this.chunks?.offsets.dispose(), this.attributes.dispose();
  }
  createChunkSchedule() {
    if (this.rasterChunkSize === null) return null;
    const e = Xs(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Nt(
      t,
      this.tileCount,
      "raster-chunks"
    ), a = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), r = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), o = e * b, n = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
      "3dgs.raster-chunk-partials",
      o * n
    ), c = m(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = m(t, "uint", this.tileCount), h = m(
      t,
      "uint",
      this.tileCount
    ).toReadOnly(), d = m(
      s.output,
      "uint",
      this.tileCount
    ).toReadOnly(), v = A(wi)({
      tile: ee,
      tile_count: g(this.tileCount),
      chunk_size: g(this.rasterChunkSize),
      sample_limit: g(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [b]).setName("3DGS count exact raster chunks WGSL"), f = A(
      ki
    )({
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      dispatch: m(r, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), k = A(Si)({
      tile: ee,
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      tasks: m(a, "uvec2", e)
    }).compute(this.tileCount, [b]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: t,
      offsets: s,
      tasks: a,
      dispatch: r,
      partialData: l,
      partialStride: n,
      countNode: v,
      prepareNode: f,
      emitNode: k
    };
  }
  createRasterNode(e, t) {
    const s = this.metrics === null ? null : m(this.metrics, "uint", this.tileCount * 4).toAtomic(), a = m(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), r = m(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), o = m(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), n = m(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), l = m(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), c = m(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = V("vec4", b), h = V("vec4", b), d = V("vec4", b), p = V("uint", b), v = V("uint", b), y = t === "direct" ? Ct(this.colorTexture) : null, f = A(Ls), x = A(da), k = this.chunks, L = t === "chunk" && k !== null ? m(k.tasks, "uvec2", k.tasks.count).toReadOnly() : null, P = t === "chunk" && k !== null ? m(k.partialData, "vec4", k.partialData.count) : null, { frame: _ } = this;
    return rt(() => {
      const S = g(ye), O = f({ value: S }), w = f({ value: S.shiftRight(1) }), I = g(H.x), $ = (t === "direct" ? H.y.mul(_.tilesX).add(H.x) : L.element(I).x).toVar("rasterTile"), B = t === "chunk" ? L.element(I).y : g(0), E = t === "direct" ? H.x : $.mod(_.tilesX), T = t === "direct" ? H.y : $.div(_.tilesX), U = Ze(
        E.mul(g(z)).add(O),
        T.mul(g(z)).add(w)
      ).toVar("rasterPixelCoordinateValue"), de = U.x.lessThan(g(_.viewport.x)).and(U.y.lessThan(g(_.viewport.y))).toVar("rasterActivePixel"), q = c.element($), he = c.element($.add(1)), te = g(he.sub(q)), pe = te.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const D = g(this.maxSplatsPerTile);
        pe.assign(ve(te.lessThan(D), te, D));
      }
      let De = g(0);
      const K = pe.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        K.assign(
          ve(
            pe.greaterThan(g(this.rasterChunkSize)),
            g(0),
            pe
          )
        );
      else if (t === "chunk") {
        De = B.mul(g(this.rasterChunkSize)).toVar("rasterSampleStart");
        const D = De.add(g(this.rasterChunkSize));
        K.assign(
          ve(D.lessThan(pe), D, pe)
        );
      }
      const se = be(U).add(0.5), Ne = /* @__PURE__ */ new Map([
        [Wt, () => U],
        [Ft, () => se],
        [Vt, () => se.div(_.viewport.xy)]
      ]), Pe = W(0).toVar("rasterPixelValue");
      M(de, () => {
        Pe.assign(
          qe(e.rasterPixelValueNode, Ne)
        );
      });
      const Re = it(0).toVar("accumulated"), oe = W(1).toVar("transmittance"), je = W(1).toVar("depth"), fe = le(!1).toVar("depthWritten"), _e = le(!1).toVar("done"), Ge = s === null ? null : g(0).toVar("rasterChecked"), we = s === null ? null : g(0).toVar("rasterBlended");
      Fe(
        {
          start: De,
          end: K,
          type: "uint",
          condition: "<",
          update: `+= ${b}`
        },
        ({ i: D }) => {
          const Ie = D.add(S);
          M(Ie.lessThan(K), () => {
            let F = Ie;
            this.maxSplatsPerTile !== null && (F = g(
              St(
                W(Ie).add(0.5).mul(W(te)).div(W(pe))
              )
            ));
            const Y = q.add(F).toVar("rasterSourceRecordIndex"), re = l.element(Y).y, X = r.element(re), J = o.element(re);
            u.element(S).assign(X), h.element(S).assign(Q(J.xyz, X.w.mul(255).log())), d.element(S).assign(n.element(re)), p.element(S).assign(re);
          }), M(S.equal(0), () => {
            v.element(g(0)).assign(
              ve(
                D.add(g(b)).lessThan(K),
                g(1),
                g(0)
              )
            );
          });
          const Ue = x({ values: v }).toVar("hasNextBatch"), Me = g(K.sub(D)), Je = ve(
            Me.lessThan(g(b)),
            Me,
            g(b)
          );
          M(de.and(_e.not()), () => {
            Fe(
              {
                start: g(0),
                end: Je,
                type: "uint",
                condition: "<"
              },
              ({ i: F }) => {
                Ge?.addAssign(1);
                const Y = u.element(F), re = p.element(F), X = se.sub(Y.xy), J = new Map(Ne);
                J.set(qt, () => Pe), J.set(ct, () => re), J.set(
                  Ut,
                  () => g(a.element(re).w)
                ), J.set(Kt, () => Y.xy), J.set(Yt, () => X), J.set(Xt, () => Y.z);
                const ke = qe(
                  e.rasterBreakNode,
                  J
                );
                M(ke, () => {
                  _e.assign(le(!0)), Ve();
                });
                const et = h.element(F), ge = et.xyz, Oe = ge.x.mul(X.x.mul(X.x)).add(ge.y.mul(2).mul(X.x).mul(X.y)).add(ge.z.mul(X.y.mul(X.y))).mul(-0.5);
                M(
                  Oe.greaterThan(0).or(Oe.lessThan(et.w.negate())),
                  () => {
                    mt();
                  }
                );
                const Be = Ce(us(ge.x, 1e-12)), ut = ge.y.div(Be), tr = Ce(us(ge.z.sub(ut.mul(ut)), 1e-12)), ss = be(
                  Be.mul(X.x).add(ut.mul(X.y)),
                  tr.mul(X.y)
                ), dt = new Map([
                  ...J,
                  [zs, () => ss],
                  [Ts, () => ss.div(6).add(0.5)],
                  [
                    Ht,
                    () => d.element(F).xyz
                  ],
                  [Zt, () => Y.w],
                  [Qt, () => Oe],
                  [Es, () => Is(Oe)]
                ]), sr = qe(e.rasterDiscardNode, dt);
                M(sr, () => {
                  mt();
                });
                const ht = xe(
                  qe(e.rasterAlphaNode, dt),
                  0,
                  0.99
                );
                M(ht.lessThan(W(1 / 255)), () => {
                  mt();
                }), M(fe.not(), () => {
                  je.assign(pa(Y.z, _)), fe.assign(le(!0));
                });
                const rr = qe(e.rasterColorNode, dt);
                Re.addAssign(rr.mul(oe).mul(ht)), we?.addAssign(1), oe.mulAssign(W(1).sub(ht)), M(oe.lessThan(1e-4), () => {
                  _e.assign(le(!0)), Ve();
                });
              }
            );
          }), M(Ue.equal(0), () => {
            Ve();
          }), v.element(S).assign(ve(de.and(_e.not()), g(1), g(0))), ds(), M(S.lessThan(8), () => {
            const F = S.mul(32), Y = g(0).toVar("subgroupActive");
            Fe(
              { start: g(0), end: g(32), type: "uint", condition: "<" },
              ({ i: re }) => {
                Y.bitOrAssign(
                  v.element(F.add(re))
                );
              }
            ), v.element(S).assign(Y);
          }), ds(), M(S.equal(0), () => {
            const F = g(0).toVar("tileActiveReduction");
            Fe(
              { start: g(0), end: g(8), type: "uint", condition: "<" },
              ({ i: Y }) => {
                F.bitOrAssign(v.element(g(Y)));
              }
            ), v.element(g(0)).assign(F);
          });
          const Ae = x({ values: v });
          M(Ae.equal(0), () => {
            Ve();
          });
        }
      ), M(de, () => {
        if (s !== null) {
          const D = $.mul(4);
          $e(s.element(D), Ge), $e(s.element(D.add(1)), we), t === "direct" && M(te.greaterThan(0).and(K.greaterThan(0)), () => {
            $e(s.element(D.add(2)), g(1)), $e(
              s.element(D.add(3)),
              ve(oe.lessThan(1e-4), g(1), g(0))
            );
          });
        }
        if (t === "direct")
          Ns(
            Re,
            oe,
            je,
            U,
            y,
            this.depthTexture,
            _
          );
        else {
          const D = I.mul(g(b)).add(S).mul(g(k.partialStride));
          P.element(D).assign(Q(Re, oe)), this.depthTexture !== null && P.element(D.add(1)).assign(Q(je, 0, 0, 0));
        }
      });
    })().computeKernel([z, z]).setName(
      t === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const e = this.metrics === null ? null : m(this.metrics, "uint", this.tileCount * 4).toAtomic(), t = this.chunks, s = m(
      t.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), a = m(
      t.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), r = m(
      t.partialData,
      "vec4",
      t.partialData.count
    ).toReadOnly(), o = Ct(this.colorTexture), n = A(Ls), { frame: l } = this;
    return rt(() => {
      const u = g(ye), h = n({ value: u }), d = n({ value: u.shiftRight(1) }), p = H.y.mul(l.tilesX).add(H.x), v = s.element(p), y = Ze(
        H.x.mul(g(z)).add(h),
        H.y.mul(g(z)).add(d)
      ), f = y.x.lessThan(g(l.viewport.x)).and(y.y.lessThan(g(l.viewport.y)));
      M(f.and(v.greaterThan(0)), () => {
        const x = it(0).toVar("chunkCompositeColor"), k = W(1).toVar("chunkCompositeTransmittance"), L = W(1).toVar("chunkCompositeDepth"), P = le(!1).toVar("chunkCompositeDepthWritten"), _ = a.element(p);
        Fe(
          {
            start: g(0),
            end: v,
            type: "uint",
            condition: "<"
          },
          ({ i: R }) => {
            const S = _.add(R).mul(g(b)).add(u).mul(g(t.partialStride)), O = r.element(S);
            x.addAssign(O.xyz.mul(k)), this.depthTexture !== null && M(P.not().and(O.w.lessThan(1)), () => {
              L.assign(r.element(S.add(1)).x), P.assign(le(!0));
            }), k.mulAssign(O.w), M(k.lessThan(1e-4), () => {
              Ve();
            });
          }
        ), Ns(
          x,
          k,
          L,
          y,
          o,
          this.depthTexture,
          l
        ), e !== null && ($e(e.element(p.mul(4).add(2)), g(1)), $e(
          e.element(p.mul(4).add(3)),
          ve(k.lessThan(1e-4), g(1), g(0))
        ));
      });
    })().computeKernel([z, z]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const e = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let t = 0, s = 0, a = 0, r = 0;
    for (let o = 0; o < e.length; o += 4)
      t += e[o], s += e[o + 1], a += e[o + 2], r += e[o + 3];
    return { checked: t, blended: s, pixels: a, alphaStopped: r };
  }
}
function pa(i, e) {
  const t = i.negate();
  return xe(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function Ns(i, e, t, s, a, r, o) {
  const n = xe(W(o.background[3]), 0, 1);
  i.addAssign(
    it(o.background[0], o.background[1], o.background[2]).mul(e).mul(n)
  );
  const l = W(1).sub(e.mul(W(1).sub(n)));
  hs(a, Xe(s), Q(i, l)), r !== null && hs(
    Ct(r),
    Xe(s),
    Q(t, 0, 0, 1)
  );
}
function qe(i, e) {
  return i.context({ overrideNodes: e });
}
class fa {
  constructor(e, t, s, a, r, o) {
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
    const n = m(
      a,
      "uint",
      s
    ).toReadOnly(), l = A(
      Li
    );
    this.prepareNode = l({
      gaussian_count: g(s),
      projected_mean: m(
        r,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: n,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const c = A(
      Ni(t)
    );
    this.compactNode = c({
      gid: ee,
      gaussian_count: g(s),
      viewport: o,
      visible_offsets: n,
      projected_mean: m(
        r,
        "vec4",
        s
      ).toReadOnly(),
      records: m(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [b]).setName(`3DGS compact visible Gaussians WGSL (${t})`);
  }
  renderer;
  buffers;
  dispatch;
  attributes = new ue();
  prepareNode;
  compactNode;
  encode(e = !1) {
    e ? (this.renderer.compute(this.prepareNode), this.renderer.compute(this.compactNode)) : this.renderer.compute([this.prepareNode, this.compactNode]);
  }
  dispose() {
    this.prepareNode.dispose(), this.compactNode.dispose(), this.attributes.dispose();
  }
}
class ga {
  constructor(e, t, s, a, r, o, n, l, c, u, h, d, p, v) {
    this.renderer = e, this.data = s, this.mode = r, this.capacity = n, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = d, this.radixBackend = p, this.nodes = v, this.frame = new Ai(t, l), this.objects = new zi(t, a, s.count), this.projection = new Fi(
      s,
      this.frame,
      this.objects,
      o,
      v,
      d
    ), this.profileDiagnostics = c ? new Hi(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new Nt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new fa(
      e,
      r,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Cs(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      p
    ), this.depthSorter.configure(r === "float32" ? 32 : 16), this.orderedTiles = new Ri(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Nt(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new $i(
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
    ), this.sorter = new Cs(
      e,
      "tile",
      n,
      this.intersections.buffers,
      this.intersections.dispatch,
      p
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
  prepareFrame(e, t, s, a) {
    if (this.frame.update(e, t, this.tilesX, this.tilesY), this.objects.update(), (e !== this.width || t !== this.height) && this.rebuildTileStages(e, t, s, a), this.tileOffsets === null || this.rasterizer === null)
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
  rebuildTileStages(e, t, s, a) {
    const r = Math.ceil(e / z), o = Math.ceil(t / z), n = r * o;
    if (r > 65535 || o > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, n + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new ua(
      this.renderer,
      this.mode,
      n,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new ha(
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
      a,
      this.frame,
      this.maxRasterizedSplatsPerTile,
      this.rasterChunkSize,
      n,
      this.nodes,
      this.profileKernels
    ), this.width = e, this.height = t, this.tilesX = r, this.tilesY = o, this.frame.update(e, t, r, o), this.tileStageRebuilds++;
  }
}
function ma(i, e) {
  if (i !== "auto" && i !== "subgroup" && i !== "workgroup")
    throw new RangeError(
      'radixBackend must be "auto", "subgroup", or "workgroup"'
    );
  if (i === "subgroup" && !e)
    throw new Error(
      'radixBackend "subgroup" requires the WebGPU "subgroups" feature'
    );
  return i === "auto" ? e ? "subgroup" : "workgroup" : i;
}
const kt = new wr();
class va extends rs {
  gaussianStore;
  depthSortMode;
  antialiasMode;
  background;
  outputDepth;
  colorSpace;
  profileKernels;
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
  nodeSlots = qr();
  dirtyStages = 0;
  disposed = !1;
  constructor(e, t, s, a = {}) {
    super(rs.COLOR, new Gs(), t, {
      type: is,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const r = a.depthSortMode ?? "float32", o = a.antialiasMode ?? "compensated", n = a.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    const l = ma(
      n,
      e.hasFeature("subgroups")
    ), c = a.intersectionCapacity ?? null;
    if (c !== null && (!Number.isInteger(c) || c <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (c !== null && c > b * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const u = a.maxRasterizedSplatsPerTile ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const h = a.rasterChunkSize === void 0 ? _i : a.rasterChunkSize;
    Ci(
      h,
      c ?? b * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = r, this.antialiasMode = o, this.requestedIntersectionCapacity = c, this.background = a.background ?? [0, 0, 0, 0], this.outputDepth = a.outputDepth ?? !1, this.colorSpace = a.colorSpace ?? vr, this.profileKernels = a.profileKernels ?? !1, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = a.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new as(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = is, this.colorTexture.colorSpace = br, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new as(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = xr, this.depthTexture.type = yr, this.depthTexture.minFilter = ns, this.depthTexture.magFilter = ns, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    return this.workingColorNode ??= Nr(
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
    if (!(this.camera instanceof _r))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    t.getDrawingBufferSize(kt);
    const s = Math.max(1, Math.floor(kt.x)), a = Math.max(1, Math.floor(kt.y));
    (this.renderTarget.width !== s || this.renderTarget.height !== a) && this.setSize(s, a), this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: ba(t) });
    const r = this.gaussianStore.updateLod(this.camera), o = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      b * 65535,
      Math.max(1, o.count * 16)
    )), t.initRenderTarget(this.renderTarget), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), o.count > b * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new ga(
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
        this.nodeSlots
      ), this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.pipeline.prepareFrame(
      s,
      a,
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
    Ps(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateProjection());
  }
  setRasterNode(e, t) {
    Ps(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateRasterizer());
  }
}
function Ps(i, e) {
  if (i?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function ba(i) {
  const e = i.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device.limits;
}
function Ga(i, e, t, s) {
  return new va(i, e, t, s);
}
export {
  Ir as CanonicalGaussianPlyLoader,
  Na as DistanceAwareRadialLodPackingStrategy,
  Pr as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  gs as GaussianCloud,
  Ms as GaussianData,
  It as GaussianLod,
  Sa as GaussianLodColorHelper,
  ms as GaussianLodNode,
  Gt as GaussianOctree,
  zr as GaussianOctreeNode,
  va as GaussianPass,
  Ra as GaussianStore,
  di as GaussianStoreAttributes,
  ui as GaussianStorePackedAttribute,
  ka as LodHelper,
  Ca as MaximumLodPackingStrategy,
  wa as OctreeHelper,
  As as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  La as RadialLodPackingStrategy,
  ri as RadialLodWorkerPlanner,
  ci as RemainingCapacityBudgetStrategy,
  Pa as SourceFractionBudgetStrategy,
  Ws as StreamingLodPackingStrategy,
  Hr as TieredRadialLodPackingStrategy,
  Ot as gaussianColor,
  Mt as gaussianIndex,
  At as gaussianObjectId,
  Bt as gaussianObjectMatrix,
  $t as gaussianObjectVisible,
  lt as gaussianOpacity,
  Ga as gaussianPass,
  at as gaussianPositionLocal,
  Qe as gaussianPositionWorld,
  jt as gaussianProjectedArea,
  Dt as gaussianProjectedSigma,
  ot as gaussianRotation,
  nt as gaussianScale,
  $s as gaussianScreenBoundsMax,
  Bs as gaussianScreenBoundsMin,
  Et as gaussianScreenPosition,
  Tt as gaussianViewDepth,
  zt as gaussianViewDirection,
  bs as isStreamingLodPackingStrategy,
  Rr as packShRgb8e8,
  Kt as rasterGaussianCenter,
  Ht as rasterGaussianColor,
  zs as rasterGaussianCoord,
  ct as rasterGaussianIndex,
  Zt as rasterGaussianOpacity,
  Ut as rasterObjectId,
  Wt as rasterPixelCoordinate,
  Yt as rasterPixelDelta,
  qt as rasterPixelValue,
  Qt as rasterPower,
  Ft as rasterScreenPosition,
  Vt as rasterScreenUV,
  Ts as rasterUV,
  Xt as rasterViewDepth,
  Es as rasterWeight,
  Os as shBytesPerCoefficient,
  _a as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
