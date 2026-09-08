import { StorageBufferAttribute as Oe, Vector3 as L, Quaternion as lr, Box3 as Gt, Object3D as Ts, Matrix4 as Be, Ray as cr, LineSegments as ur, BufferGeometry as dr, Float32BufferAttribute as hr, LineBasicMaterial as pr, BoxGeometry as fr, MeshBasicMaterial as gr, DoubleSide as mr, InstancedMesh as vr, Color as yr, IndirectStorageBufferAttribute as br, Vector4 as xr, Scene as It, PassNode as ns, HalfFloatType as os, SRGBColorSpace as _r, StorageTexture as ls, NoColorSpace as wr, RedFormat as kr, FloatType as Sr, NearestFilter as cs, PerspectiveCamera as Cr, Vector2 as Lr } from "three/webgpu";
import { property as G, bool as ce, exp as As, float as W, storage as m, uint as g, vec3 as rt, mix as Nr, wgslFn as T, instanceIndex as ee, workgroupArray as V, workgroupId as X, invocationLocalIndex as _e, uniform as Ve, uvec2 as Qe, Fn as st, If as M, Return as pe, vec4 as J, mat4 as us, normalize as Rr, sqrt as Pe, clamp as xe, log as Pr, ceil as ds, vec2 as be, ivec2 as Xe, int as hs, floor as Ct, subgroupIndex as pt, invocationSubgroupIndex as ft, subgroupSize as gt, atomicStore as Gr, storageTexture as Lt, select as ye, Loop as Fe, Break as qe, Continue as mt, max as ps, workgroupBarrier as fs, atomicAdd as Ae, textureStore as gs, colorSpaceToWorking as Ir } from "three/tsl";
class Os {
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
const Mr = 16, Bs = 4;
function Tr(i, e, t) {
  const s = Math.max(Math.abs(i), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const r = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), a = 127 / 2 ** r, o = vt(i, a), n = vt(e, a), l = vt(t, a), c = r + 127;
  return (o | n << 8 | l << 16 | c << 24) >>> 0;
}
function Ca(i) {
  const e = 2 ** ((i >>> 24) - 127) / 127;
  return [
    yt(i) * e,
    yt(i >>> 8) * e,
    yt(i >>> 16) * e
  ];
}
function $s(i) {
  return i === "rgb8e8" ? Bs : Mr;
}
function vt(i, e) {
  return Math.min(127, Math.max(-127, Math.round(i * e))) & 255;
}
function yt(i) {
  const e = i & 255;
  return e < 128 ? e : e - 256;
}
const ms = {
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
    const r = t.properties.map((p) => p.name.match(/^f_rest_(\d+)$/)?.[1]).filter((p) => p !== void 0).map(Number).sort((p, x) => p - x);
    for (let p = 0; p < r.length; p++)
      if (r[p] !== p)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const a = r.length / 3, o = a + 1, n = Math.sqrt(o);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = $r(e, t), c = (p) => s.get(p), u = r.map(
      (p) => c(`f_rest_${p}`)
    ), h = t.vertexCount, d = new Float32Array(h * 4), f = new Float32Array(h * 4), v = new Float32Array(h * 4), b = new Float32Array(h * o * 4);
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
      const k = l(p, c("opacity"));
      f[x + 3] = 1 / (1 + Math.exp(-k));
      const S = l(p, c("rot_0")), R = l(p, c("rot_1")), _ = l(p, c("rot_2")), C = l(p, c("rot_3")), A = Math.hypot(R, _, C, S);
      A > 1e-12 ? (v[x] = R / A, v[x + 1] = _ / A, v[x + 2] = C / A, v[x + 3] = S / A) : v[x + 3] = 1;
      const N = p * o * 4;
      b[N] = l(p, c("f_dc_0")), b[N + 1] = l(p, c("f_dc_1")), b[N + 2] = l(p, c("f_dc_2"));
      for (let w = 1; w < o; w++) {
        const O = N + w * 4, $ = w - 1;
        for (let I = 0; I < 3; I++) {
          const E = u[I * a + $];
          b[O + I] = l(
            p,
            E
          );
        }
      }
    }
    return new Os(
      {
        means: et("ply.means", d),
        scalesOpacity: et("ply.scales-opacity", f),
        rotations: et("ply.rotations-xyzw", v),
        shCoefficients: et("ply.sh-coefficients", b)
      },
      {
        count: h,
        shDegree: n - 1,
        ownsBuffers: !0
      }
    );
  }
}
function et(i, e) {
  const t = new Oe(e, 4);
  return t.name = i, t;
}
function Br(i) {
  const e = new Uint8Array(i), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let v = 0; v <= e.length - t.length; v++) {
    let b = !0;
    for (let p = 0; p < t.length; p++)
      if (e[v + p] !== t[p]) {
        b = !1;
        break;
      }
    if (b) {
      s = v;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let r = s + t.length;
  if (e[r] === 13 && r++, e[r] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  r++;
  const o = new TextDecoder().decode(e.subarray(0, r)).split(/\r?\n/);
  if (o[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let n = null, l = "", c = -1, u = 0;
  const h = [], d = [];
  for (const v of o) {
    const b = v.trim().split(/\s+/);
    if (b[0] === "format") {
      if (b[1] !== "ascii" && b[1] !== "binary_little_endian" && b[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${b[1] ?? "unknown"}`);
      n = b[1];
    } else if (b[0] === "element") {
      l = b[1] ?? "";
      const p = Number(b[2]);
      if (!Number.isInteger(p) || p < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: p }), l === "vertex" && (c = p);
    } else if (b[0] === "property" && l === "vertex") {
      if (b[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const p = b[1], x = b[2];
      if (!(p in ms) || x === void 0)
        throw new Error(`Unsupported vertex property: ${v}`);
      h.push({ name: x, type: p, byteOffset: u }), u += ms[p];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (c <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (v) => v.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: c, properties: h, vertexStride: u, dataOffset: r };
}
function $r(i, e) {
  if (e.format === "ascii") {
    const a = new TextDecoder().decode(
      new Uint8Array(i, e.dataOffset)
    ), o = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let n = 0;
    for (let l = 0; l < o.length; l++) {
      for (; n < a.length && /\s/.test(a[n]); ) n++;
      const c = n;
      for (; n < a.length && !/\s/.test(a[n]); ) n++;
      const u = Number(a.slice(c, n));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${l}`);
      o[l] = u;
    }
    return (l, c) => o[l * e.properties.length + c];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > i.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(i), r = e.format === "binary_little_endian";
  return (a, o) => {
    const n = e.properties[o], l = e.dataOffset + a * e.vertexStride + n.byteOffset;
    return Dr(s, l, n.type, r);
  };
}
function Dr(i, e, t, s) {
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
const vs = 1 / 255, Er = 0.99, bt = 1e-12;
function zr(i, e, t, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const r = e.means.array, a = e.scalesOpacity.array, o = e.rotations.array, n = new L(), l = new L(), c = new L(), u = new lr();
  let h = 1;
  for (const d of t) {
    const f = d.gaussianIndex * 4, v = Math.min(1, Math.max(0, a[f + 3]));
    if (v < vs) continue;
    u.set(
      -o[f],
      -o[f + 1],
      -o[f + 2],
      o[f + 3]
    ).normalize(), n.set(
      i.origin.x - r[f],
      i.origin.y - r[f + 1],
      i.origin.z - r[f + 2]
    ).applyQuaternion(u), l.copy(i.direction).applyQuaternion(u);
    const b = Math.max(a[f], bt), p = Math.max(a[f + 1], bt), x = Math.max(a[f + 2], bt);
    n.set(
      n.x / b,
      n.y / p,
      n.z / x
    ), l.set(
      l.x / b,
      l.y / p,
      l.z / x
    );
    const k = l.lengthSq();
    if (k <= Number.EPSILON) continue;
    const S = Math.max(
      0,
      -n.dot(l) / k
    );
    c.copy(n).addScaledVector(l, S);
    const R = Math.min(
      Er,
      v * Math.exp(-0.5 * c.lengthSq())
    );
    if (R < vs || (h *= 1 - R, 1 - h < s)) continue;
    const _ = i.at(S, new L());
    return {
      gaussianIndex: d.gaussianIndex,
      distance: i.origin.distanceTo(_),
      point: _
    };
  }
  return null;
}
class jr {
  constructor(e, t, s, r, a, o, n, l) {
    this.id = e, this.depth = t, this.bounds = s, this.count = r, this.maxSplatRadius = a, this.raycastBounds = l, this.children = o, this.gaussianIndices = n;
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
  constructor(e, t, s, r) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = r, this.bounds = Ur(e), this.rootBounds = Wr(this.bounds);
    const a = e.means.array, o = e.scalesOpacity.array, n = [], l = [], c = Array.from({ length: e.count }, (h, d) => d), u = (h, d, f) => {
      const v = n.length;
      n.push(null);
      const b = h.length > t && f < s && d.max.x - d.min.x > Number.EPSILON, p = [];
      if (b) {
        const S = d.getCenter(new L()), R = Array.from({ length: 8 }, () => []);
        for (const _ of h) {
          const C = _ * 4, A = (a[C] >= S.x ? 1 : 0) | (a[C + 1] >= S.y ? 2 : 0) | (a[C + 2] >= S.z ? 4 : 0);
          R[A].push(_);
        }
        for (let _ = 0; _ < 8; _++) {
          const C = R[_];
          C.length !== 0 && p.push(
            u(
              C,
              Vr(d, S, _),
              f + 1
            )
          );
        }
      }
      let x = 0;
      if (p.length > 0)
        for (const S of p)
          x = Math.max(
            x,
            n[S].maxSplatRadius
          );
      else {
        for (const S of h) {
          const R = S * 4;
          x = Math.max(
            x,
            o[R],
            o[R + 1],
            o[R + 2]
          );
        }
        l.push(v);
      }
      const k = d.clone().expandByScalar(x * 3);
      return n[v] = new jr(
        v,
        f,
        d,
        h.length,
        x,
        p,
        p.length === 0 ? Uint32Array.from(h) : null,
        k
      ), v;
    };
    u(c, this.rootBounds.clone(), 0), this.nodes = n, this.leafNodeIds = Uint32Array.from(l);
  }
  data;
  leafCapacity;
  maxDepth;
  static build(e, t = {}) {
    const s = t.leafCapacity ?? 256, r = t.maxDepth ?? 10;
    if (!Number.isInteger(s) || s <= 0)
      throw new RangeError("GaussianOctree leafCapacity must be positive");
    if (!Number.isInteger(r) || r < 0)
      throw new RangeError("GaussianOctree maxDepth must be non-negative");
    return new Mt(
      e,
      s,
      r,
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
    const r = t.maxHits ?? 1 / 0;
    if (!(r > 0)) return [];
    const a = [], o = [this.rootNode];
    for (; o.length > 0; ) {
      const n = this.nodes[o.pop()], l = Math.max(0, s - 3) * n.maxSplatRadius, c = l === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(l);
      if (e.intersectsBox(c))
        if (n.gaussianIndices !== null)
          for (const u of n.gaussianIndices) a.push(u);
        else
          for (const u of n.children) o.push(u);
    }
    return this.raycastIndices(e, a, s, r);
  }
  raycastIndices(e, t, s = 3, r = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(r > 0)) return [];
    const a = this.data.means.array, o = this.data.scalesOpacity.array, n = new L(), l = new L(), c = [];
    for (let u = 0; u < t.length; u++) {
      const h = t[u], d = h * 4;
      n.set(a[d], a[d + 1], a[d + 2]);
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
    return c.sort((u, h) => u.distance - h.distance), c.length > r && (c.length = r), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function Ur(i) {
  const e = i.means.array, t = new Gt(), s = new L();
  for (let r = 0; r < i.count; r++) {
    const a = r * 4;
    s.set(e[a], e[a + 1], e[a + 2]), t.expandByPoint(s);
  }
  return t;
}
function Wr(i) {
  const e = i.getCenter(new L()), t = i.getSize(new L()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new Gt(
    new L(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new L(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function Vr(i, e, t) {
  return new Gt(
    new L(
      t & 1 ? e.x : i.min.x,
      t & 2 ? e.y : i.min.y,
      t & 4 ? e.z : i.min.z
    ),
    new L(
      t & 1 ? i.max.x : e.x,
      t & 2 ? i.max.y : e.y,
      t & 4 ? i.max.z : e.z
    )
  );
}
class ys extends Ts {
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
  constructor(e, t, s, r = "GaussianCloud", a = null, o = null, n = 0) {
    super(), this.ownerStore = e, this.objectId = t, this.packedGaussianCount = s, this.lod = a, this.packing = o, this.priority = n, this.name = r;
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
    const s = new Be().copy(this.matrixWorld).invert(), r = new cr().copy(e.ray).applyMatrix4(s), a = this.raycastMode === "full" ? this.lod.octree.raycast(r) : this.lod.raycast(r, this.packing), o = zr(
      r,
      this.lod.octree.data,
      a,
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
    const s = t.minDepth ?? 0, r = t.maxDepth ?? 1 / 0, a = e.nodes.filter(
      (h) => h.depth >= s && h.depth <= r && (t.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(a.length * 12 * 2 * 3);
    let n = 0;
    for (const h of a) {
      const { min: d, max: f } = h.bounds, v = [
        [d.x, d.y, d.z],
        [f.x, d.y, d.z],
        [f.x, f.y, d.z],
        [d.x, f.y, d.z],
        [d.x, d.y, f.z],
        [f.x, d.y, f.z],
        [f.x, f.y, f.z],
        [d.x, f.y, f.z]
      ];
      for (const [b, p] of Fr)
        o.set(v[b], n), o.set(v[p], n + 3), n += 6;
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
    super(l, u), this.octree = e, this.cellCount = a.length, this.name = "Gaussian octree helper", this.frustumCulled = !1, this.renderOrder = 1e3;
  }
  octree;
  isOctreeHelper = !0;
  cellCount;
  dispose() {
    this.removeFromParent(), this.geometry.dispose(), this.material.dispose();
  }
}
const Fr = [
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
class bs {
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
    const s = t.importance ?? Yr, r = new Float64Array(e.data.count);
    for (let a = 0; a < r.length; a++) {
      const o = s(a, e);
      r[a] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((a) => {
      if (a.gaussianIndices === null)
        return new bs(
          a.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(a.gaussianIndices).sort(
          (n, l) => r[l] - r[n] || n - l
        )
      );
      return new bs(
        a.id,
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
    let r = 0;
    for (let a = 0; a < e.nodeIds.length; a++) {
      const o = e.nodeIds[a], n = this.getLeafNode(o);
      if (s.has(o))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${o}`
        );
      s.add(o);
      const l = e.lodLevels[a], c = n.levelCounts[l];
      if (c === void 0)
        throw new RangeError(`GaussianLod level ${l} does not exist`);
      if (r + c > t.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let u = 0; u < c; u++)
        t[r++] = n.sortedGaussianIndices[u];
    }
    if (r !== t.length)
      throw new RangeError(
        `GaussianLodPacking declares ${t.length} Gaussians but selects ${r}`
      );
    return t;
  }
  raycast(e, t, s = {}) {
    this.assertUsable();
    const r = s.radiusScale ?? 3;
    if (!(r > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const a = s.maxHits ?? 1 / 0;
    if (!(a > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const o = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, l = new L(), c = new L(), u = [], h = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.nodeIds.length; d++) {
      const f = t.nodeIds[d], v = this.getLeafNode(f);
      if (h.has(f))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${f}`
        );
      h.add(f);
      const b = t.lodLevels[d], p = v.levelCounts[b];
      if (p === void 0)
        throw new RangeError(`GaussianLod level ${b} does not exist`);
      const x = this.octree.nodes[f], k = Math.max(0, r - 3) * x.maxSplatRadius, S = k === 0 ? x.raycastBounds : x.raycastBounds.clone().expandByScalar(k);
      if (e.intersectsBox(S))
        for (let R = 0; R < p; R++) {
          const _ = v.sortedGaussianIndices[R], C = _ * 4;
          l.set(o[C], o[C + 1], o[C + 2]);
          const A = Math.max(
            n[C],
            n[C + 1],
            n[C + 2]
          ) * r;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > A * A) && u.push({
            gaussianIndex: _,
            distance: e.origin.distanceTo(c),
            point: c.clone()
          });
        }
    }
    return u.sort((d, f) => d.distance - f.distance), u.length > a && (u.length = a), u;
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
function Kr(i) {
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
function Yr(i, e) {
  const t = e.data.scalesOpacity.array, s = i * 4, r = [t[s], t[s + 1], t[s + 2]];
  return r.sort((a, o) => o - a), t[s + 3] * r[0] * r[1];
}
const Hr = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class Na extends Ts {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : Hr, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: e.levelCount }, (r, a) => a)
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
    for (const [s, r] of this.levelMeshes)
      r.visible = t.has(s);
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
    for (let a = 0; a < this.packing.nodeIds.length; a++) {
      const o = this.packing.lodLevels[a], n = e[o];
      if (n === void 0)
        throw new RangeError(`Gaussian LOD level ${o} does not exist`);
      n.push(this.packing.nodeIds[a]);
    }
    const t = new L(), s = new L(), r = new Be();
    for (let a = 0; a < e.length; a++) {
      const o = e[a];
      if (o.length === 0) continue;
      const n = new fr(1, 1, 1), l = new gr({
        color: this.colors[a % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: mr,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new vr(n, l, o.length);
      for (let u = 0; u < o.length; u++) {
        const h = this.lod.octree.nodes[o[u]].bounds;
        h.getCenter(t), h.getSize(s), r.makeScale(s.x, s.y, s.z), r.setPosition(t), c.setMatrixAt(u, r);
      }
      c.instanceMatrix.needsUpdate = !0, c.computeBoundingSphere(), c.name = `Gaussian LOD ${a} volumes`, c.frustumCulled = !1, c.renderOrder = 900 + a, c.userData.lodLevel = a, this.levelMeshes.set(a, c), this.add(c);
    }
  }
  disposeMeshes() {
    for (const e of this.levelMeshes.values())
      e.removeFromParent(), e.geometry.dispose(), e.material.dispose();
    this.levelMeshes.clear();
  }
}
const At = G("uint", "gaussianIndex"), Ot = G("uint", "gaussianObjectId"), it = G("vec3", "gaussianPositionLocal"), Je = G("vec3", "gaussianPositionWorld"), at = G("vec3", "gaussianScale"), nt = G("vec4", "gaussianRotation"), ot = G("float", "gaussianOpacity"), Bt = G("vec3", "gaussianColor"), $t = G("mat4", "gaussianObjectMatrix"), Dt = G("bool", "gaussianObjectVisible"), Et = G("vec3", "gaussianViewDirection"), zt = G("float", "gaussianViewDepth"), jt = G(
  "vec2",
  "gaussianScreenPosition"
), Ds = G(
  "vec2",
  "gaussianScreenBoundsMin"
), Es = G(
  "vec2",
  "gaussianScreenBoundsMax"
), Ut = G(
  "vec2",
  "gaussianProjectedSigma"
), Wt = G("float", "gaussianProjectedArea"), lt = G("uint", "rasterGaussianIndex"), Vt = G("uint", "rasterObjectId"), Ft = G("uvec2", "rasterPixelCoordinate"), qt = G("vec2", "rasterScreenPosition"), Kt = G("vec2", "rasterScreenUV"), Yt = G("float", "rasterPixelValue"), Ht = G("vec2", "rasterGaussianCenter"), Xt = G("vec2", "rasterPixelDelta"), zs = G("vec2", "rasterGaussianCoord"), js = G("vec2", "rasterUV"), Zt = G("float", "rasterViewDepth"), Qt = G("vec3", "rasterGaussianColor"), Jt = G("float", "rasterGaussianOpacity"), es = G("float", "rasterPower"), Us = G("float", "rasterWeight");
function Xr() {
  return {
    gaussianPositionLocalNode: it,
    gaussianPositionWorldNode: Je,
    gaussianScaleNode: at,
    gaussianRotationNode: nt,
    gaussianOpacityNode: ot,
    gaussianColorNode: Bt,
    gaussianVisibilityNode: ce(!0),
    rasterPixelValueNode: W(0),
    rasterBreakNode: ce(!1),
    rasterColorNode: Qt,
    rasterAlphaNode: Jt.mul(As(es)),
    rasterDiscardNode: ce(!1)
  };
}
const Ze = /* @__PURE__ */ new Set([
  At,
  Ot,
  it,
  Je,
  at,
  nt,
  ot,
  Bt,
  $t,
  Dt,
  Et,
  zt,
  jt,
  Ds,
  Es,
  Ut,
  Wt
]), ts = /* @__PURE__ */ new Set([
  lt,
  Vt,
  Ft,
  qt,
  Kt,
  Yt,
  Ht,
  Xt,
  zs,
  js,
  Zt,
  Qt,
  Jt,
  es,
  Us
]), Ws = /* @__PURE__ */ new Set([
  Ft,
  qt,
  Kt
]), Zr = /* @__PURE__ */ new Set([
  ...Ws,
  Yt,
  lt,
  Vt,
  Ht,
  Xt,
  Zt
]);
function Vs(i, e, t) {
  i.traverse((s) => {
    if ((Ze.has(s) || ts.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function Ge(i, e, t) {
  i.traverse((s) => {
    if ((Ze.has(s) || ts.has(s)) && !e.has(s))
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
class Ra {
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
    const e = this.lodLevelAttribute.bufferAttribute, t = m(e, "uint", e.count).toReadOnly().element(lt).mod(g(this.colors.length)), s = this.colors.map((o) => {
      const n = new yr(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return rt(n.r, n.g, n.b);
    });
    let r = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      r = t.equal(g(o)).select(s[o], r);
    const a = Nr(
      this.baseColorNode,
      r,
      W(this.tintStrength)
    );
    this.boundBuffer = e, this.helperColorNode = a, this.pass.rasterColorNode = a;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function $e(i) {
  if (!Number.isInteger(i) || i < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class Pa {
  setFromCamera(e, t) {
    return this;
  }
  pack({ lod: e, maxGaussians: t }) {
    $e(t);
    const s = e.octree.data.count;
    if (t < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${t}`
      );
    const r = e.octree.leafNodeIds.slice(), a = new Uint8Array(r.length);
    return a.fill(e.finestLevel), { nodeIds: r, lodLevels: a, gaussianCount: s };
  }
}
function ss(i, e, t) {
  return i.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), i.getWorldPosition(t), e.worldToLocal(t);
}
function rs(i, e) {
  const t = e instanceof L ? e.clone() : i.octree.bounds.getCenter(new L()), s = i.octree.rootBounds.getSize(new L()), r = Math.max(s.length() * 0.5, Number.EPSILON), a = new L(), o = Array.from(i.octree.leafNodeIds, (n) => (i.octree.nodes[n].bounds.getCenter(a), {
    nodeId: n,
    radius: a.distanceTo(t) / r
  }));
  return o.sort(
    (n, l) => n.radius - l.radius || n.nodeId - l.nodeId
  ), o;
}
class Ga {
  cameraCenter = new L();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof L ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof L ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ss(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if ($e(t), t === 0) return Jr();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const r = rs(e, this.center), a = [];
    let o = 0;
    for (const l of r) {
      const c = e.nodes[l.nodeId].levelCounts[s];
      if (o + c > t) break;
      a.push(l.nodeId), o += c;
    }
    const n = new Uint8Array(a.length);
    return n.fill(s), {
      nodeIds: Uint32Array.from(a),
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
  cameraCenter = new L();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof L ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = ti(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof L ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ss(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if ($e(t), t === 0) return si();
    const s = e.octree.data.count;
    if (s <= t) {
      const h = e.octree.leafNodeIds.slice(), d = new Uint8Array(h.length);
      return d.fill(e.finestLevel), { nodeIds: h, lodLevels: d, gaussianCount: s };
    }
    const r = rs(e, this.center), a = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], o = [], n = [];
    let l = 0, c = 0, u = 0;
    for (let h = 0; h < a.length; h++) {
      const d = this.budgetShares[h];
      if (u += d, d === 0) continue;
      const f = h === a.length - 1 ? t : Math.floor(t * u), v = a[h];
      for (; c < r.length; ) {
        const b = r[c], p = e.nodes[b.nodeId].levelCounts[v];
        if (l + p > f) break;
        o.push(b.nodeId), n.push(v), l += p, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(n),
      gaussianCount: l
    };
  }
}
function ti(i) {
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
function si() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Ia {
  cameraCenter = new L();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof L ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof L ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ss(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if ($e(t), t === 0) return ri();
    const s = rs(e, this.center), r = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let a = s.reduce(
      (n, l, c) => n + e.nodes[l.nodeId].levelCounts[r[c]],
      0
    );
    for (let n = s.length - 1; n >= 0 && a > t; n--) {
      const l = e.nodes[s[n].nodeId];
      for (; r[n] > 0 && a > t; ) {
        const c = l.levelCounts[r[n]];
        r[n] = r[n] - 1, a -= c - l.levelCounts[r[n]];
      }
    }
    let o = s.length;
    for (; o > 0 && a > t; ) {
      o--;
      const n = e.nodes[s[o].nodeId];
      a -= n.levelCounts[r[o]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, o).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(r.slice(0, o)),
      gaussianCount: a
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
function ii(i) {
  const e = new Uint32Array(i.octree.leafNodeIds), t = new Float64Array(e.length * 3), s = new Uint32Array(e.length * i.levelCount);
  for (let n = 0; n < e.length; n++) {
    const l = e[n], c = i.octree.nodes[l].bounds, u = n * 3;
    t[u] = (c.min.x + c.max.x) * 0.5, t[u + 1] = (c.min.y + c.max.y) * 0.5, t[u + 2] = (c.min.z + c.max.z) * 0.5, s.set(i.nodes[l].levelCounts, n * i.levelCount);
  }
  const r = i.octree.rootBounds.max.x - i.octree.rootBounds.min.x, a = i.octree.rootBounds.max.y - i.octree.rootBounds.min.y, o = i.octree.rootBounds.max.z - i.octree.rootBounds.min.z;
  return {
    leafNodeIds: e,
    leafCenters: t,
    levelCounts: s,
    levelCount: i.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        r * r + a * a + o * o
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const Fs = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, xs = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Fs], { type: "text/javascript;charset=utf-8" });
function ai(i) {
  let e;
  try {
    if (e = xs && (self.URL || self.webkitURL).createObjectURL(xs), !e) throw "";
    const t = new Worker(e, {
      name: i?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Fs),
      {
        name: i?.name
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
  boundsCenter = new L();
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
    ), r = {
      type: "init",
      data: t,
      buffers: s
    };
    this.worker.postMessage(r, [
      t.leafNodeIds.buffer,
      t.leafCenters.buffer,
      t.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: a, lodLevels: o }) => [a, o])
    ]);
  }
  request(e) {
    this.assertUsable(), this.initialize(e.lod), this.initializeWorker(), this.releaseLatestResult();
    const t = this.targetStrategy.center instanceof L ? this.targetStrategy.center : e.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
    this.latestRequestedRevision = s;
    const r = {
      type: "request",
      revision: s,
      centerX: t.x,
      centerY: t.y,
      centerZ: t.z,
      maxGaussians: e.maxGaussians
    }, o = {
      message: "budgetShares" in this.targetStrategy ? {
        ...r,
        strategy: "tiered",
        budgetShares: this.targetStrategy.budgetShares
      } : {
        ...r,
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
      const r = this.latestError;
      throw this.latestError = null, r;
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
    const t = e.data, s = performance.now() - this.activeStarted, r = this.activeMaxGaussians;
    this.busy = !1, t.revision === this.latestRequestedRevision ? (this.releaseLatestResult(), this.latestResult = { message: t, maxGaussians: r, roundTripMs: s }) : (this.discarded++, this.recycle(t.buffer));
    const a = this.queuedRequest;
    this.queuedRequest = null, a !== null && this.dispatch(a);
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
function li(i) {
  return {
    nodeIds: new ArrayBuffer(i * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(i * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function ci(i) {
  return {
    nodeIds: new Uint32Array(i.buffer.nodeIds, 0, i.length),
    lodLevels: new Uint8Array(i.buffer.lodLevels, 0, i.length),
    gaussianCount: i.gaussianCount
  };
}
const ui = 1024 * 1024, di = 16, hi = 1.25;
class qs {
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
    if ($e(e.maxGaussians), this.bindLod(e.lod), !this.initialized) {
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
    if ($e(e.maxGaussians), this.bindLod(e.lod), !this.initialized)
      throw new Error(
        "StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches"
      );
    if (this.refreshTarget(e), this.changeCursor >= this.changes.length) return null;
    const t = [];
    let s = 0;
    for (; this.changeCursor < this.changes.length; ) {
      const r = this.changes[this.changeCursor], a = t.length >= this.maxChangedCellsPerPack || s + r.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (t.length > 0 && a && this.appliedGaussianCount <= e.maxGaussians)
        break;
      this.applyChange(r), t.push({ nodeId: r.nodeId, lodLevel: r.lodLevel }), s += r.estimatedUploadBytes, this.changeCursor++;
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
    return ks(e.lod, t, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.targetDirty = !1, t;
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
        ks(e.lod, t.packing, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.changes = this.planChanges(e.lod, t.packing), this.changeCursor = 0, this.latestTargetPlanningMs = t.planningMs, this.latestTargetRoundTripMs = t.roundTripMs;
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
    const r = [], a = [];
    for (let o = this.appliedCellCount - 1; o >= 0; o--) {
      const n = this.appliedNodeIds[o], l = this.appliedLodLevels[o], c = s[n];
      (c < 0 || c < l) && r.push(
        ws(
          e,
          n,
          l,
          c < 0 ? null : c
        )
      );
    }
    for (let o = 0; o < t.nodeIds.length; o++) {
      const n = t.nodeIds[o], l = t.lodLevels[o], c = this.appliedIndices[n], u = c < 0 ? null : this.appliedLodLevels[c];
      (u === null || l > u) && a.push(ws(e, n, u, l));
    }
    return [...r, ...a];
  }
  applyChange(e) {
    const t = this.appliedIndices[e.nodeId];
    if (e.lodLevel === null) {
      if (t < 0) return;
      const s = --this.appliedCellCount;
      if (t !== s) {
        const r = this.appliedNodeIds[s];
        this.appliedNodeIds[t] = r, this.appliedLodLevels[t] = this.appliedLodLevels[s], this.appliedIndices[r] = t;
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
function _s(i) {
  return i instanceof qs;
}
function ws(i, e, t, s) {
  const r = i.nodes[e], a = t === null ? 0 : r.levelCounts[t], o = s === null ? 0 : r.levelCounts[s], n = Math.max(0, o - a), l = Math.max(0, a - o), c = t !== null && s !== null && t !== s ? Math.min(a, o) : 0, u = 48 + i.octree.data.shCoefficientCount * Bs + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: o - a,
    estimatedUploadBytes: Math.ceil(
      (n * u + l * 16 + c * 4) * hi
    )
  };
}
function ks(i, e, t) {
  if (e.gaussianCount > t)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${t} Gaussians`
    );
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  for (let a = 0; a < e.nodeIds.length; a++) {
    const o = e.nodeIds[a], n = e.lodLevels[a], c = i.nodes[o]?.levelCounts[n];
    if (c === void 0 || i.octree.nodes[o]?.isLeaf !== !0)
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${o} or level ${n}`
      );
    if (s.has(o))
      throw new Error(`GaussianLod packing contains duplicate node ${o}`);
    s.add(o), r += c;
  }
  if (r !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${r}`
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
function Ye(i, e, t) {
  if (i.length === 0) return [];
  i.sort((h, d) => h - d);
  const s = [];
  let r = i[0], a = r, o = 1;
  for (let h = 1; h <= i.length; h++) {
    const d = i[h];
    if (d !== a) {
      if (d !== void 0 && o++, d === a + 1) {
        a = d;
        continue;
      }
      s.push({ start: r, count: a - r + 1 }), d !== void 0 && (r = a = d);
    }
  }
  if (s.length < 2) return s;
  const n = Math.floor(o * t);
  let l = 0;
  const c = [];
  let u = { ...s[0] };
  for (let h = 1; h < s.length; h++) {
    const d = s[h], f = u.start + u.count, v = d.start - f;
    v <= e && l + v <= n ? (u.count = d.start + d.count - u.start, l += v) : (c.push(u), u = { ...d });
  }
  return c.push(u), c;
}
function He(i) {
  let e = 0;
  for (const t of i) e += t.count;
  return e;
}
function re(i, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      i.addUpdateRange(
        s.start * t,
        s.count * t
      );
    i.needsUpdate = !0;
  }
}
const Ks = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), Ys = /* @__PURE__ */ Symbol(
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
  [Ks](e) {
    this.assertUsable();
    const t = this.packedBuffer, s = new Oe(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [Ys](e) {
    re(this.bufferAttribute, e, 1);
  }
  [Hs]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const Xs = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), Zs = /* @__PURE__ */ Symbol(
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
  [Xs](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const r = new fi(e, t);
    return this.attributes.set(e, r), r;
  }
  [Zs]() {
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
    this.writtenSlots.length = 0, this.attribute[Ks](new Uint32Array(e)), this.freshBuffer = !0;
  }
  backfill(e) {
    const t = this.attribute.array;
    for (const s of e.cells)
      for (const r of s.slots)
        t[r] = s.lodLevel, this.writtenSlots.push(r);
  }
  updateCell(e) {
    const { previousCell: t, cell: s, retainedCount: r } = e, a = t?.lodLevel === s.lodLevel ? r : 0, o = this.attribute.array;
    for (let n = a; n < s.slots.length; n++) {
      const l = s.slots[n];
      o[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const e = this.writtenSlots.length, t = Ye(this.writtenSlots, 16, 0.25), s = He(t);
    return this.freshBuffer || this.attribute[Ys](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const vi = 16777216;
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
  packedContentVersion = 0;
  constructor(e = {}) {
    this.loader = e.loader ?? new Or(), this.budgetingStrategy = e.budgetingStrategy ?? new pi(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = xi(
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
  /** Changes after a successful full or incremental packed-data update. */
  get contentVersion() {
    return this.packedContentVersion;
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
    const t = this.attributes[Xs](
      "lodLevel",
      "u32"
    ), s = new mi(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let r = null, a = null;
    try {
      return r = Mt.build(s, {
        ...t.octree,
        ownsData: !0
      }), a = Tt.build(r, {
        ...t.lod,
        ownsOctree: !0
      }), this.addLod(a, {
        name: t.name ?? bi(e),
        priority: t.priority,
        packingStrategy: t.packingStrategy,
        ownsLod: !0
      });
    } catch (o) {
      throw a !== null ? a.dispose() : r !== null ? r.dispose() : s.dispose(), o;
    }
  }
  add(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), r = wt(t.priority ?? 0), a = new ys(
      this,
      s,
      0,
      t.name,
      null,
      null,
      r
    );
    return this.entries.push({
      cloud: a,
      count: 0,
      sourceGaussianCount: e.count,
      sourceDegree: e.shDegree,
      priority: r,
      packingStrategy: null,
      ownsPackingStrategy: !1,
      lastLodFocus: new L(Number.NaN, Number.NaN, Number.NaN),
      source: e,
      ownsSource: t.ownsData ?? !1,
      lod: null,
      ownsLod: !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(a), this.invalidatePacking(), a;
  }
  addLod(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), r = wt(t.priority ?? 0), a = new ys(
      this,
      s,
      0,
      t.name,
      e,
      null,
      r
    ), o = t.packingStrategy ?? this.defaultPackingStrategy ?? _i(this.defaultStreamingLod);
    return this.entries.push({
      cloud: a,
      count: 0,
      sourceGaussianCount: e.octree.data.count,
      sourceDegree: e.octree.data.shDegree,
      priority: r,
      packingStrategy: o,
      ownsPackingStrategy: t.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new L(Number.NaN, Number.NaN, Number.NaN),
      source: null,
      ownsSource: !1,
      lod: e,
      ownsLod: t.ownsLod ?? !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(a), this.invalidatePacking(), a;
  }
  remove(e) {
    if (this.disposed) return;
    const t = this.entries.findIndex((r) => r.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && Ss(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = Si(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), r = performance.now(), a = this.planPackings(s), o = performance.now() - r, n = Math.min(
      s,
      this.entries.reduce((f, v) => f + v.sourceGaussianCount, 0)
    ), l = this.packedData, c = l !== null && l.count === n && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), h = c ? this.updatePackedData(a, l) : this.buildPackedData(a, n), d = performance.now() - u;
    for (const f of a)
      f.entry.count = f.count, f.entry.packing = f.packing, f.entry.allocatedBudget = f.allocatedBudget, f.entry.packingDirty = !1, f.entry.cloud.updatePacking(f.count, f.packing);
    this.packedData = h.data, this.cellSlotsByEntry = h.cellSlotsByEntry, this.freeSlots = h.freeSlots, this.gaussianCapacity = s, this.packedObjectCapacity = this.objectCapacity, this.packingInvalid = !1, this.latestPackStats = { ...h.stats, planningMs: o, slotUpdateMs: d }, c || (this.layoutVersion++, l?.dispose()), this.packedContentVersion++;
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
    if (!_s(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const r = performance.now(), a = s.takeNextBatch({
      lod: t.lod,
      maxGaussians: t.allocatedBudget
    }), o = performance.now() - r;
    if (a === null)
      return { applied: !1, pending: s.needsPack };
    const n = this.packedData, l = this.cellSlotsByEntry.get(t);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const c = performance.now(), u = l, h = this.freeSlots, d = this.scratchReleasedSlots;
    d.length = 0;
    const f = /* @__PURE__ */ new Map();
    for (const w of a.transitions) {
      const O = l.get(w.nodeId), $ = w.lodLevel === null ? 0 : t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], I = Math.min(
        O?.slots.length ?? 0,
        $
      );
      if (f.set(w.nodeId, {
        previousCell: O,
        retainedCount: I
      }), O !== void 0)
        for (let E = I; E < O.slots.length; E++) {
          const D = O.slots[E];
          h.push(D), d.push(D);
        }
    }
    const v = this.scratchWrittenSlots;
    v.length = 0;
    for (const w of a.transitions) {
      const O = f.get(w.nodeId), { previousCell: $, retainedCount: I } = O;
      if (w.lodLevel === null) {
        u.delete(w.nodeId);
        continue;
      }
      const E = t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], D = $?.slots, q = D !== void 0 && D.length === E ? D : new Uint32Array(E);
      q !== D && D !== void 0 && I > 0 && q.set(D.subarray(0, I));
      for (let U = I; U < E; U++) {
        const oe = h.pop();
        if (oe === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, w.nodeId, U),
          oe,
          n.means.array,
          n.scalesOpacity.array,
          n.rotations.array,
          n.shCoefficients.array,
          n.shCoefficientCount
        ), q[U] = oe, v.push(oe);
      }
      const ne = {
        lodLevel: w.lodLevel,
        slots: q
      };
      for (const U of this.attributePackers)
        U.updateCell({ previousCell: $, cell: ne, retainedCount: I });
      u.set(w.nodeId, ne);
    }
    const b = this.nextSlotMarkGeneration(n.count);
    for (const w of v) this.slotMarks[w] = b;
    const p = this.scratchClearedSlots;
    p.length = 0;
    for (const w of d)
      this.slotMarks[w] !== b && p.push(w);
    const x = n.scalesOpacity.array;
    for (const w of p) x[w * 4 + 3] = 0;
    const k = Ye(v, 4, 0.15), S = Ye(p, 16, 0.25);
    re(n.means, k, 4), re(n.scalesOpacity, k, 4), re(n.scalesOpacity, S, 4), re(n.rotations, k, 4), re(
      n.shCoefficients,
      k,
      n.shCoefficientCount * n.shCoefficients.itemSize
    );
    const R = this.commitAttributePackers(), _ = this.count - t.count + a.packing.gaussianCount, C = He(k), A = He(S), N = performance.now() - c;
    return t.count = a.packing.gaussianCount, t.packing = a.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = h, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: n.count,
      activeGaussians: _,
      reusedSlots: _ - v.length,
      writtenSlots: v.length,
      clearedSlots: p.length,
      estimatedUploadBytes: C * _t(n) + A * 16 + R.estimatedUploadBytes,
      writtenSlotRanges: k,
      clearedSlotRanges: S,
      planningMs: o,
      slotUpdateMs: N
    }, this.packedContentVersion++, { applied: !0, pending: a.pending };
  }
  planPackings(e) {
    const t = [...this.entries].sort(
      (a, o) => a.priority - o.priority || a.cloud.objectId - o.cloud.objectId
    ), s = [];
    let r = 0;
    for (const a of t) {
      const o = Math.max(0, e - r), n = this.budgetingStrategy.allocate({
        capacity: e,
        allocatedGaussians: r,
        remainingGaussians: o,
        entry: {
          cloud: a.cloud,
          priority: a.priority,
          insertionIndex: a.cloud.objectId,
          sourceGaussianCount: a.sourceGaussianCount
        }
      });
      if (wi(n, o), a.lod === null) {
        if (a.sourceGaussianCount > n)
          throw new RangeError(
            `${a.cloud.name} requires ${a.sourceGaussianCount} Gaussians but its Store allocation is ${n}`
          );
        s.push({
          entry: a,
          count: a.sourceGaussianCount,
          packing: null,
          allocatedBudget: n,
          selectionChanged: a.packingDirty || a.allocatedBudget !== n
        }), r += a.sourceGaussianCount;
        continue;
      }
      const l = a.packingStrategy, c = a.packingDirty || a.allocatedBudget !== n || a.packing === null, u = !c && a.packing !== null ? a.packing : l.pack({
        lod: a.lod,
        maxGaussians: n
      });
      if (u.gaussianCount > n)
        throw new RangeError(
          `${l.constructor.name} exceeded its allocation of ${n} Gaussians`
        );
      ki(a.lod, u), s.push({
        entry: a,
        count: u.gaussianCount,
        packing: u,
        allocatedBudget: n,
        selectionChanged: c
      }), r += u.gaussianCount;
    }
    return s;
  }
  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(e, t) {
    this.assertUsable();
    const s = this.entries.find((a) => a.cloud === e);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const r = wt(t);
    s.priority = r, e.updatePackingPriority(r), this.invalidatePacking();
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
    const t = new L(), s = new L();
    let r = 0, a = !1;
    const o = [];
    for (const n of this.entries) {
      const l = n.packingStrategy;
      if (n.lod === null || l === null || !_s(l))
        continue;
      n.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(t), n.cloud.worldToLocal(t);
      const c = n.lod.octree.rootBounds.getSize(new L()).length() * 0.5, u = Math.max(0.05, c * 0.025);
      (!Number.isFinite(n.lastLodFocus.x) || t.distanceToSquared(n.lastLodFocus) >= u * u) && (l.setFromCamera(e, n.cloud), n.lastLodFocus.copy(t));
      let h = !1;
      l.needsPack && (h = this.packLodBatch(n.cloud).applied, h && r++);
      const d = l.needsPack;
      a ||= d, n.lod.octree.rootBounds.getCenter(s), o.push({
        cloud: n.cloud,
        focusDistance: t.distanceTo(s),
        applied: h,
        pending: d,
        targetStats: l.targetStats
      });
    }
    return { appliedBatches: r, pending: a, clouds: o };
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
        e.source !== null && e.ownsSource && e.source.dispose(), e.lod !== null && e.ownsLod && e.lod.dispose(), e.ownsPackingStrategy && Ss(e.packingStrategy), e.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[Zs](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(e, t) {
    const s = this.shDegree, r = (s + 1) ** 2, a = new Float32Array(t * 4), o = new Float32Array(t * 4), n = new Float32Array(t * 4), l = new Uint32Array(t * r), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const b of e) {
      const { entry: p } = b, x = /* @__PURE__ */ new Map();
      for (const k of this.plannedCells(b)) {
        const S = new Uint32Array(k.count);
        for (let R = 0; R < k.count; R++) {
          const _ = this.cellSourceIndex(p, k.nodeId, R);
          this.copySourceToSlot(
            p,
            _,
            u,
            a,
            o,
            n,
            l,
            r
          ), S[R] = u++;
        }
        x.set(k.nodeId, {
          lodLevel: k.lodLevel,
          slots: S
        });
      }
      c.set(p, x);
    }
    const h = Array.from(
      { length: t - u },
      (b, p) => t - 1 - p
    ), d = new Os(
      {
        means: tt("3dgs.store.means-object", a),
        scalesOpacity: tt("3dgs.store.scales-opacity", o),
        rotations: tt("3dgs.store.rotations", n),
        shCoefficients: tt(
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
    for (const b of this.attributePackers)
      b.allocate(t), b.backfill({ cells: f });
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
    const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set();
    let a = 0;
    for (const _ of e) {
      if (r.add(_.entry), a += _.count, !_.selectionChanged) continue;
      const C = /* @__PURE__ */ new Map();
      for (const A of this.plannedCells(_))
        C.set(A.nodeId, A);
      s.set(_.entry, C);
    }
    const o = [...this.freeSlots], n = this.scratchReleasedSlots;
    n.length = 0;
    for (const [_, C] of this.cellSlotsByEntry) {
      const A = s.get(_);
      if (!(A === void 0 && r.has(_)))
        for (const [N, w] of C) {
          const O = w.slots, $ = Math.min(
            O.length,
            A?.get(N)?.count ?? 0
          );
          for (let I = $; I < O.length; I++) {
            const E = O[I];
            o.push(E), n.push(E);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), c = this.scratchWrittenSlots;
    c.length = 0;
    let u = 0;
    for (const _ of e) {
      const C = this.cellSlotsByEntry.get(_.entry);
      if (!_.selectionChanged && C !== void 0) {
        l.set(_.entry, C), u += _.count;
        continue;
      }
      const A = /* @__PURE__ */ new Map();
      for (const N of s.get(_.entry)?.values() ?? []) {
        const w = C?.get(N.nodeId), O = w?.slots, $ = Math.min(O?.length ?? 0, N.count), I = O !== void 0 && O.length === N.count ? O : new Uint32Array(N.count);
        I !== O && O !== void 0 && $ > 0 && I.set(O.subarray(0, $)), u += $;
        for (let D = $; D < N.count; D++) {
          const q = o.pop();
          if (q === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            _.entry,
            this.cellSourceIndex(_.entry, N.nodeId, D),
            q,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), I[D] = q, c.push(q);
        }
        const E = {
          lodLevel: N.lodLevel,
          slots: I
        };
        for (const D of this.attributePackers)
          D.updateCell({
            previousCell: w,
            cell: E,
            retainedCount: $
          });
        A.set(N.nodeId, E);
      }
      l.set(_.entry, A);
    }
    const h = this.nextSlotMarkGeneration(t.count);
    for (const _ of c) this.slotMarks[_] = h;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const _ of n)
      this.slotMarks[_] !== h && d.push(_);
    const f = t.scalesOpacity.array;
    for (const _ of d) f[_ * 4 + 3] = 0;
    const v = c.length, b = d.length, p = Ye(c, 4, 0.15), x = Ye(d, 16, 0.25);
    re(t.means, p, 4), re(t.scalesOpacity, p, 4), re(t.scalesOpacity, x, 4), re(t.rotations, p, 4), re(
      t.shCoefficients,
      p,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const k = this.commitAttributePackers(), S = He(p), R = He(x);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: a,
        reusedSlots: u,
        writtenSlots: v,
        clearedSlots: b,
        estimatedUploadBytes: S * _t(t) + R * 16 + k.estimatedUploadBytes,
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
      for (const r of s.values())
        t.push(r);
    return t;
  }
  commitAttributePackers() {
    let e = 0, t = 0, s = 0;
    const r = [];
    for (const a of this.attributePackers) {
      const o = a.commit();
      e += o.writtenSlots, t += o.uploadedSlots, s += o.estimatedUploadBytes, r.push(...o.slotRanges);
    }
    return { writtenSlots: e, uploadedSlots: t, estimatedUploadBytes: s, slotRanges: r };
  }
  cellSourceIndex(e, t, s) {
    return e.lod === null ? s : e.lod.nodes[t].sortedGaussianIndices[s];
  }
  copySourceToSlot(e, t, s, r, a, o, n, l) {
    const c = e.lod?.octree.data ?? e.source;
    if (c === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    xt(c.means.array, t, r, s), xt(
      c.scalesOpacity.array,
      t,
      a,
      s
    ), xt(
      c.rotations.array,
      t,
      o,
      s
    ), r[s * 4 + 3] = e.cloud.objectId, yi(
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
    if (e >= vi)
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
function tt(i, e, t = 4) {
  const s = new Oe(e, t);
  return s.name = i, s;
}
function xt(i, e, t, s) {
  t.set(
    i.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function yi(i, e, t, s, r) {
  const a = i.shCoefficientCount, o = Math.min(
    a,
    r
  ), n = s * r;
  if (t.fill(
    0,
    n,
    n + r
  ), i.shFormat === "rgb8e8") {
    const u = e * a;
    t.set(
      i.shCoefficients.array.subarray(
        u,
        u + o
      ),
      n
    );
    return;
  }
  const l = i.shCoefficients.array, c = e * a * 4;
  for (let u = 0; u < o; u++) {
    const h = c + u * 4;
    t[n + u] = Tr(
      l[h],
      l[h + 1],
      l[h + 2]
    );
  }
}
function _t(i) {
  return 48 + i.shCoefficientCount * $s(i.shFormat);
}
function bi(i) {
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
function xi(i) {
  if (i !== "auto" && (!Number.isSafeInteger(i) || i <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return i;
}
function _i(i) {
  const e = new ei();
  return new qs(e, {
    ...i,
    targetPlanner: new oi(e)
  });
}
function Ss(i) {
  i !== null && "dispose" in i && typeof i.dispose == "function" && i.dispose();
}
function wi(i, e) {
  if (!Number.isSafeInteger(i) || i < 0 || i > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function ki(i, e) {
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const t = /* @__PURE__ */ new Set();
  let s = 0;
  for (let r = 0; r < e.nodeIds.length; r++) {
    const a = e.nodeIds[r], o = i.nodes[a], n = i.octree.nodes[a], l = e.lodLevels[r], c = o?.levelCounts[l];
    if (c === void 0 || n === void 0)
      throw new RangeError(
        `GaussianLod packing references invalid node ${a} or level ${l}`
      );
    if (!n.isLeaf)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${a} is internal`
      );
    if (t.has(a))
      throw new Error(`GaussianLod packing contains duplicate node ${a}`);
    t.add(a), s += c;
  }
  if (s !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${s}`
    );
}
function Si(i, e) {
  const t = Cs(
    i.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Cs(i.maxBufferSize, "maxBufferSize"), r = Math.max(
    16,
    (e + 1) ** 2 * $s("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / r);
}
function Cs(i, e) {
  if (!Number.isSafeInteger(i) || i <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return i;
}
const B = 16, y = 256, Ci = 8192, j = 512, Nt = 4, P = 1 << Nt, ie = 4, ue = y * ie, Z = ue, ae = 32, Li = (
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
), Ni = (
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
), Ri = (
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
function Qs(i, e) {
  return Math.max(1, Math.ceil(2 * i / e));
}
function Pi(i, e) {
  if (i !== null) {
    if (!Number.isInteger(i) || i < y || i % y !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${y} and at least ${y}`
      );
    if (Qs(e, i) > 65535)
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
  let reduce_chunks = (radix_blocks + ${Z - 1}u) / ${Z}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${P}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${y - 1}u) / ${y}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Ii(i) {
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
      new Oe(new Float32Array(t * s), s)
    );
  }
  createUint(e, t, s = 1) {
    return this.track(
      e,
      new Oe(new Uint32Array(t * s), s)
    );
  }
  createIndirect(e) {
    return this.track(
      e,
      new br(new Uint32Array(4), 4)
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
  constructor(e, t, s, r, a) {
    this.renderer = e, this.visibleDispatch = a, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const o = T(
      Mi
    );
    this.computeNode = o({
      rank: ee,
      state: m(a.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: m(
        r,
        "uvec2",
        t
      ).toReadOnly(),
      tile_counts: m(
        s,
        "uint",
        t
      ).toReadOnly(),
      ordered_tile_counts: m(this.tileCounts, "uint", t)
    }).computeKernel([y]).setName("3DGS gather depth-ordered tile counts WGSL");
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
function Js(i) {
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
  let second = first + ${y}u;
  (*scratch)[lane] = ${i.readValue("first")};
  (*scratch)[lane + ${y}u] = ${i.readValue("second")};
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
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${y}u]; }
  return 0u;
}
`
  );
}
const Ai = Js({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (i) => `select(0u, (*input_values)[${i}], ${i} < length)`
}), Oi = Js({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (i) => `select(0u, 1u, ${i} < length && (*input_values)[${i}].w > 0.0)`
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
    (*values)[index] += (*block_offsets)[index / ${j}u];
  }
  return 0u;
}
`
);
class Rt {
  output;
  attributes = new de();
  levels = [];
  constructor(e, t, s = "intersections", r = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const a = T(Ai), o = T(
      Oi
    ), n = T(Bi);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const h = Math.ceil(u / j), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        h
      ), f = V("uint", j), v = this.levels.length === 0 && r === "projectedVisibility", b = (v ? o : a)({
        lane: _e,
        group_id: X.x,
        length: g(u),
        input_values: m(
          l,
          v ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: m(c, "uint", u),
        block_sums: m(d, "uint", h),
        scratch: f
      }).computeKernel([y]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
      if (this.levels.push({
        length: u,
        blockCount: h,
        output: c,
        scanNode: b
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
        values: m(d.output, "uint", d.length),
        block_offsets: m(
          f.output,
          "uint",
          f.length
        ).toReadOnly()
      }).compute(d.length, [y]).setName(`3DGS ${s} add scan offsets WGSL ${h}`);
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
  projection = Ve(new Be());
  view = Ve(new Be());
  viewport = Ve(new xr());
  tilesX = Ve(1, "uint");
  tilesY = Ve(1, "uint");
  update(e, t, s, r) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = r;
  }
}
function er(i) {
  const { center: e, conic: t, powerThreshold: s, tileX: r, tileY: a, onHit: o } = i;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${r}), f32(${a})) * ${B}.0;
      let rect_max = rect_min + vec2<f32>(${B}.0);
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
          select(-${B}.0, ${B}.0, x_left),
          select(-${B}.0, ${B}.0, y_above)
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
const Di = (
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
  let reduce_chunks = (radix_blocks + ${Z - 1}u) / ${Z}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${P}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${y - 1}u) / ${y}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), Ei = (() => {
  const i = er({
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
    clamp(i32(floor((center.x - radius.x) / ${B}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${B}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${B}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${B}.0)), 0, max_tile_y)
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
class zi {
  constructor(e, t, s, r, a, o, n, l, c, u, h) {
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
    ).toReadOnly(), f = m(
      n,
      "uint",
      t
    ).toReadOnly(), v = m(
      a.state,
      "uvec4",
      1
    ).toReadOnly(), b = T(Di);
    this.prepareNode = b({
      item_count_state: v,
      capacity: g(s),
      tile_counts: d,
      intersection_offsets: f,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const p = T(Ei);
    this.emitNode = p({
      rank: ee,
      tiles: Qe(h.tilesX, h.tilesY),
      capacity: g(s),
      sorted_gaussians: m(
        r,
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
      intersection_offsets: f,
      visible_state: v,
      records: m(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([y]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = a;
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
const Pt = 10;
class ji {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * Pt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new Oe(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Be();
  inverseModel = new Be();
  cameraWorldPosition = new L();
  cameraLocalPosition = new L();
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
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = Ui(e, this.camera) ? 1 : 0;
  }
}
function Ui(i, e) {
  if (!i.layers.test(e.layers)) return !1;
  let t = i, s = i;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof It;
}
function Wi(i) {
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
function Vi(i) {
  const e = i === "rgb8e8" ? "u32" : "vec4<f32>", t = i === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (r) => {
    const a = r === 0 ? "base" : `base + ${r}u`;
    return i === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${a}])` : `(*sh_coefficients)[${a}].xyz`;
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
const Fi = (
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
${er({
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
const tr = /* @__PURE__ */ new Set([
  At,
  Ot,
  it,
  at,
  nt,
  ot,
  $t,
  Dt
]), sr = /* @__PURE__ */ new Set([
  ...tr,
  Je,
  Et
]), Ki = /* @__PURE__ */ new Set([
  ...sr,
  zt,
  jt,
  Ut,
  Wt
]);
class Yi {
  constructor(e, t, s, r, a, o = !0) {
    this.data = e, this.frame = t, this.antialiasMode = r, this.subpixelSampleCulling = o, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      e.count
    ), this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      e.count
    ), this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      e.count
    ), this.rebuild(a);
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
      Vs(s, Ze, "projection");
    Ge(
      e.gaussianPositionLocalNode,
      tr,
      "gaussianPositionLocalNode"
    );
    for (const [s, r] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      Ge(r, sr, s);
    Ge(
      e.gaussianOpacityNode,
      Ki,
      "gaussianOpacityNode"
    ), Ge(
      e.gaussianColorNode,
      Ze,
      "gaussianColorNode"
    ), Ge(
      e.gaussianVisibilityNode,
      Ze,
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
    const { data: t, frame: s } = this, r = m(t.means, "vec4", t.count).toReadOnly(), a = m(
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
    ), c = m(this.projectedConic, "vec4", t.count), u = m(this.projectedColor, "vec4", t.count), h = m(this.tileCounts, "uint", t.count), d = T(
      Wi(this.antialiasMode)
    ), f = T(Vi(t.shFormat)), v = T(qi()), b = T(Fi);
    return st(() => {
      const x = g(ee);
      M(x.greaterThanEqual(g(t.count)), () => {
        pe();
      }), h.element(x).assign(g(0)), l.element(x).assign(J(0));
      const k = r.element(x), S = k.xyz, R = g(k.w), _ = a.element(x), C = _.xyz, A = _.w, N = o.element(x), w = g(t.count).add(
        R.mul(g(Pt))
      ), O = us(
        l.element(w),
        l.element(w.add(1)),
        l.element(w.add(2)),
        l.element(w.add(3))
      ), $ = us(
        l.element(w.add(4)),
        l.element(w.add(5)),
        l.element(w.add(6)),
        l.element(w.add(7))
      ), I = l.element(w.add(8)).xyz, E = l.element(w.add(9)).x.greaterThan(0);
      M(E.not(), () => {
        pe();
      });
      const D = /* @__PURE__ */ new Map([
        [At, () => x],
        [Ot, () => R],
        [it, () => S],
        [at, () => C],
        [nt, () => N],
        [ot, () => A],
        [$t, () => O],
        [Dt, () => E]
      ]), q = Re(
        e.gaussianPositionLocalNode,
        D
      ).toVar("gaussianPositionLocalValue"), ne = O.mul(J(q, 1)).xyz, U = new Map(D);
      U.set(Je, () => ne);
      const oe = Rr(q.sub(I));
      U.set(Et, () => oe);
      let we;
      if (e.gaussianPositionWorldNode === Je)
        we = $.mul(J(q, 1));
      else {
        const ve = Re(
          e.gaussianPositionWorldNode,
          U
        ).toVar("gaussianPositionWorldValue");
        we = s.view.mul(J(ve, 1));
      }
      we = we.toVar("gaussianViewPosition");
      const ke = Re(e.gaussianScaleNode, U).toVar(
        "gaussianScaleValue"
      ), he = Re(
        e.gaussianRotationNode,
        U
      ).toVar("gaussianRotationValue"), te = d({
        view: we,
        scale_input: ke,
        rotation_input: he,
        model_view: $,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      M(te.element(0).w.lessThanEqual(0), () => {
        pe();
      });
      const K = te.element(0).xy, Se = te.element(0).z, Ie = te.element(1).xyz, De = te.element(1).w, Ce = te.element(2).xyz, fe = te.element(2).w, le = new Map(U);
      le.set(zt, () => Se), le.set(jt, () => K), le.set(Ut, () => Pe(Ce.xz)), le.set(
        Wt,
        () => Pe(De).mul(Math.PI)
      );
      const Ee = Re(
        e.gaussianOpacityNode,
        le
      ).clamp(0, 1), ge = this.antialiasMode === "compensated" ? Ee.mul(
        Pe(xe(fe.div(De), 0, 1))
      ) : Ee;
      M(ge.lessThan(W(1 / 255)), () => {
        pe();
      });
      const Le = Pr(ge.mul(255)), ze = Pe(
        Le.mul(2).mul(xe(Ce.x, 1e-12, 1e4))
      ), z = Pe(
        Le.mul(2).mul(xe(Ce.z, 1e-12, 1e4))
      ), Ne = ds(ze), je = ds(z);
      M(Ne.lessThanEqual(0).or(je.lessThanEqual(0)), () => {
        pe();
      });
      const Ue = be(Ne, je), Me = K.sub(Ue), Te = K.add(Ue);
      if (M(
        Te.x.lessThan(0).or(Te.y.lessThan(0)).or(Me.x.greaterThanEqual(s.viewport.x)).or(Me.y.greaterThanEqual(s.viewport.y)),
        () => {
          pe();
        }
      ), this.subpixelSampleCulling) {
        const ve = b({
          center: K,
          conic: Ie,
          power_threshold: Le,
          extent: be(ze, z),
          viewport: Qe(s.viewport.xy)
        });
        M(ve.not(), () => {
          l.element(x).assign(J(K, Se, -1)), pe();
        });
      }
      const Y = Xe(hs(s.tilesX), hs(s.tilesY)).sub(1), Q = Xe(
        xe(Ct(Me.div(W(B))), be(0), be(Y))
      ), se = Xe(
        xe(Ct(Te.div(W(B))), be(0), be(Y))
      ), H = f({
        gid: x,
        sh_degree: g(t.shDegree),
        direction: oe,
        sh_coefficients: n
      }), F = new Map(le);
      F.set(Bt, () => H), F.set(Ds, () => Me), F.set(Es, () => Te);
      const ct = Re(
        e.gaussianVisibilityNode,
        F
      );
      M(ct.not(), () => {
        pe();
      });
      const We = v({
        center: K,
        conic: Ie,
        power_threshold: Le,
        tile_min: Q,
        tile_max: se
      });
      M(We.equal(0), () => {
        pe();
      });
      const me = Re(
        e.gaussianColorNode,
        F
      ).clamp(0, 1);
      l.element(x).assign(J(K, Se, ge)), c.element(x).assign(J(Ie, Ne)), u.element(x).assign(J(me, je)), h.element(x).assign(We);
    })().compute(t.count, [y]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Re(i, e) {
  return i.context({ overrideNodes: e });
}
const Hi = (
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
), Xi = y, rr = 256, Zi = [2048, 4096, 8192];
function Qi(i) {
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
  let s = 0, r = 0, a = 0, o = 0, n = 0, l = 0, c = 0, u = 0;
  for (let h = 0; h < e; h++) {
    const d = Math.max(0, i[h + 1] - i[h]);
    t[h] = d, s += d, r = Math.max(r, d), d > 256 && a++, d > 512 && o++, d > 1024 && n++, d > 2048 && l++;
    const f = Math.ceil(d / rr);
    c += f, u = Math.max(u, f);
  }
  return t.sort(), {
    max: r,
    mean: s / e,
    median: Ji(t),
    p95: Ns(t, 0.95),
    p99: Ns(t, 0.99),
    tilesOver256: a,
    tilesOver512: o,
    tilesOver1024: n,
    tilesOver2048: l,
    totalBatches: c,
    maxBatches: u
  };
}
function Ls(i, e) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const t = Math.max(0, i.length - 1);
  let s = 0, r = 0, a = 0, o = 0, n = 0;
  for (let c = 0; c < t; c++) {
    const u = Math.max(0, i[c + 1] - i[c]), h = Math.min(u, e), d = u - h;
    s += h, r += d, d > 0 && a++;
    const f = Math.ceil(h / rr);
    o += f, n = Math.max(n, f);
  }
  const l = s + r;
  return {
    cap: e,
    rasterizedIntersections: s,
    droppedIntersections: r,
    droppedFraction: l === 0 ? 0 : r / l,
    affectedTiles: a,
    totalBatches: o,
    maxBatches: n
  };
}
function Ji(i) {
  const e = Math.floor(i.length / 2);
  return i.length % 2 !== 0 ? i[e] : (i[e - 1] + i[e]) * 0.5;
}
function Ns(i, e) {
  const t = Math.max(0, Math.ceil(i.length * e) - 1);
  return i[t];
}
class ea {
  constructor(e, t, s, r, a, o) {
    this.renderer = e, this.maxRasterizedSplatsPerTile = o, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const n = T(Hi);
    this.computeNode = n({
      index: ee,
      gaussian_count: g(t),
      viewport: Qe(a.viewport.xy),
      projected_mean: m(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: m(
        r,
        "vec4",
        r.count
      ).toReadOnly(),
      zero_pixel_flags: m(this.zeroPixelFlags, "uint", t)
    }).compute(t, [Xi]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
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
    ]), r = new Uint32Array(s);
    let a = 0;
    for (const n of r) a += n;
    const o = new Uint32Array(t);
    return {
      tileLoads: Qi(o),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : Ls(o, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: Zi.map(
        (n) => Ls(o, n)
      ),
      zeroPixelSubpixelSplats: a
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function ta(i) {
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
  partials: ptr<workgroup, array<u32, ${P * ae}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let subgroup_count = (${y}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${P}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${ie}u; item++) {
      let position = block_start + item * ${y}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${i}u) & ${P - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${ae}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${P}u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[lane * ${ae}u + subgroup];
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
  partials: ptr<workgroup, array<u32, ${ae}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let subgroup_count = (${y}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${Z}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ie}u; item++) {
    let block = chunk_start + item * ${y}u + lane;
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
  let chunk_count = ((*state)[0].z + ${Z - 1}u) /
    ${Z}u;
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
  scratch: ptr<workgroup, array<u32, ${Z}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${Z}u;
  for (var item = 0u; item < ${ie}u; item++) {
    let local = item * ${y}u + lane;
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
    for (var item = 0u; item < ${ie}u; item++) {
      let worker = item * ${y}u + lane;
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
    for (var item = 0u; item < ${ie}u; item++) {
      let worker = item * ${y}u + lane;
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
  for (var item = 0u; item < ${ie}u; item++) {
    let local = item * ${y}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`
);
function aa(i) {
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
  block_bases: ptr<workgroup, array<u32, ${P}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${P}>>,
  partials: ptr<workgroup, array<u32, ${P * ae}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let subgroup_count = (${y}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${P}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${y}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${i}u) & ${P - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${P}u; target_digit++) {
      let matches = select(0u, 1u, valid && digit == target_digit);
      let prefix = subgroupExclusiveAdd(matches);
      let total = subgroupAdd(matches);
      if (subgroup_lane == 0u) {
        (*partials)[target_digit * ${ae}u + subgroup_index] = total;
      }
      if (digit == target_digit) { subgroup_prefix = prefix; }
    }
    workgroupBarrier();

    if (valid) {
      var preceding_subgroups = 0u;
      for (var subgroup = 0u; subgroup < subgroup_index; subgroup++) {
        preceding_subgroups += (*partials)[digit * ${ae}u + subgroup];
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
        batch_total += (*partials)[lane * ${ae}u + subgroup];
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
function na(i) {
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
  histogram: ptr<workgroup, array<atomic<u32>, ${P}>>
) -> u32 {
  if (lane < ${P}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${y}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${i}u) & ${P - 1}u;
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
  scratch: ptr<workgroup, array<u32, ${y}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${Z}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ie}u; item++) {
    let block = chunk_start + item * ${y}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${y / 2}u;
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
function la(i) {
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
  block_bases: ptr<workgroup, array<u32, ${P}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${P}>>,
  shared_digits: ptr<workgroup, array<u32, ${y}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${P * (y / 32)}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let words_per_digit = ${y / 32}u;
  if (lane < ${P}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${y}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${P}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${i}u) & ${P - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${P * (y / 32)}u) {
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
  constructor(e, t, s, r, a, o) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = r, this.dispatch = a, this.backend = o, this.maxRadixBlocks = Math.ceil(s / ue), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / Z), this.blockHistograms = this.attributes.createUint(
      `3dgs.${t}-radix-histograms`,
      this.maxRadixBlocks * P
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${t}-radix-prefixes`,
      this.maxRadixBlocks * P
    ), this.reduced = this.attributes.createUint(
      `3dgs.${t}-radix-reduced`,
      this.maxReduceChunks * P
    );
    const n = m(a.state, "uvec4", 1).toReadOnly(), l = m(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), c = T(
      o === "subgroup" ? sa : oa
    ), u = {
      lane: _e,
      group_id: X,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: m(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (u.subgroup_index = pt, u.subgroup_lane = ft, u.subgroup_size = gt, u.partials = V("uint", ae)) : u.scratch = V("uint", y), this.reduceNode = c(u).computeKernel([y]).setName(`3DGS ${t} radix reduce WGSL`);
    const h = T(ra);
    this.scanReducedNode = h({
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      reduced: m(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const d = T(
      ia
    );
    this.scanAddNode = d({
      lane: _e,
      group_id: X,
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
    }).computeKernel([y]).setName(`3DGS ${t} radix scan-add WGSL`), this.sortedRecords = r.recordsA;
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
    const t = Math.ceil(Math.max(0, e) / Nt);
    this.passes = Array.from(
      { length: t },
      (s, r) => this.createPass(r, r * Nt)
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
    const s = e % 2 === 0, r = s ? this.buffers.recordsA : this.buffers.recordsB, a = s ? this.buffers.recordsB : this.buffers.recordsA, o = m(this.dispatch.state, "uvec4", 1).toReadOnly(), n = m(
      r,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = T(
      this.backend === "subgroup" ? ta(t) : na(t)
    ), c = {
      lane: _e,
      block_index: X.x,
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
      P * ae
    )) : c.histogram = V("atomic<u32>", P);
    const u = l(c).computeKernel([y]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), h = T(
      this.backend === "subgroup" ? aa(t) : la(t)
    ), d = {
      lane: _e,
      block_index: X.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records_in: n,
      records_out: m(a, "uvec2", this.capacity),
      block_prefixes: m(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: V("uint", P),
      local_digit_counts: V("uint", P)
    };
    this.backend === "subgroup" ? (d.subgroup_index = pt, d.subgroup_lane = ft, d.subgroup_size = gt, d.partials = V(
      "uint",
      P * ae
    )) : (d.shared_digits = V("uint", y), d.shared_digit_masks = V(
      "uint",
      P * (y / 32)
    ));
    const f = h(d).computeKernel([y]).setName(`3DGS ${this.label} radix scatter WGSL ${e}`);
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
function ua(i) {
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
const da = (
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
  let second_local = lane + ${y}u;
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
class pa {
  attributes = new de();
  levels = [];
  constructor(e, t) {
    const s = T(da), r = T(ha);
    let a = e, o = t;
    for (; ; ) {
      const n = this.levels.length, l = Math.ceil(o / j), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${n}`,
        l
      ), u = s({
        lane: _e,
        group_id: X.x,
        length: g(o),
        values: m(a, "uint", o),
        block_mins: m(c, "uint", l),
        scratch: V("uint", j)
      }).computeKernel([y]).setName(`3DGS tile offset suffix scan WGSL ${n}`);
      if (this.levels.push({
        length: o,
        blockCount: l,
        values: a,
        scanNode: u
      }), l <= 1) break;
      a = c, o = l;
    }
    for (let n = 0; n < this.levels.length - 1; n++) {
      const l = this.levels[n], c = this.levels[n + 1];
      l.addNode = r({
        index: ee,
        length: g(l.length),
        block_count: g(c.length),
        values: m(l.values, "uint", l.length),
        block_suffix_mins: m(
          c.values,
          "uint",
          c.length
        ).toReadOnly()
      }).compute(l.length, [y]).setName(`3DGS tile add suffix block mins WGSL ${n}`);
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
  constructor(e, t, s, r, a) {
    this.renderer = e, this.dispatch = a, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = m(this.offsets, "uint", s + 1), n = T(ca);
    this.clearNode = n({
      index: ee,
      tile_count: g(s),
      state: m(a.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [y]).setName("3DGS clear tile offsets WGSL");
    const l = T(
      ua(t)
    );
    this.boundariesNode = l({
      index: ee,
      tile_count: g(s),
      state: m(a.state, "uvec4", 1).toReadOnly(),
      records: m(
        r,
        "uvec2",
        r.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([y]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new pa(this.offsets, s + 1);
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
const Ps = (
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
  values: ptr<workgroup, array<u32, ${y}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class ma {
  constructor(e, t, s, r, a, o, n, l, c, u, h, d, f, v, b, p, x, k = !1, S = 1e-4) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = r, this.meansAttribute = a, this.projectedMeanAttribute = o, this.projectedConicAttribute = n, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = h, this.depthTexture = d, this.frame = f, this.maxSplatsPerTile = v, this.rasterChunkSize = b, this.tileCount = p, this.transmittanceThreshold = S, this.metrics = k ? this.attributes.createUint("3dgs.raster-work", p * 4) : null;
    const R = this.metrics === null ? null : m(this.metrics, "uint", p * 4).toAtomic();
    this.clearMetrics = R === null ? null : st(() => {
      Gr(R.element(ee), g(0));
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
  attributes = new de();
  chunks;
  computeNode = null;
  chunkComputeNode = null;
  compositeNode = null;
  metrics;
  clearMetrics;
  rebuild(e) {
    for (const a of [
      e.rasterPixelValueNode,
      e.rasterBreakNode,
      e.rasterColorNode,
      e.rasterAlphaNode,
      e.rasterDiscardNode
    ])
      Vs(a, ts, "raster");
    Ge(
      e.rasterPixelValueNode,
      Ws,
      "rasterPixelValueNode"
    ), Ge(
      e.rasterBreakNode,
      Zr,
      "rasterBreakNode"
    );
    const t = this.createRasterNode(e, "direct"), s = this.chunks === null ? null : this.createRasterNode(e, "chunk"), r = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = t, this.chunkComputeNode = s, this.compositeNode = r;
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
    const e = Qs(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Rt(
      t,
      this.tileCount,
      "raster-chunks"
    ), r = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), a = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), o = e * y, n = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
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
    ).toReadOnly(), v = T(Li)({
      tile: ee,
      tile_count: g(this.tileCount),
      chunk_size: g(this.rasterChunkSize),
      sample_limit: g(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [y]).setName("3DGS count exact raster chunks WGSL"), p = T(
      Ni
    )({
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      dispatch: m(a, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), k = T(Ri)({
      tile: ee,
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      tasks: m(r, "uvec2", e)
    }).compute(this.tileCount, [y]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: t,
      offsets: s,
      tasks: r,
      dispatch: a,
      partialData: l,
      partialStride: n,
      countNode: v,
      prepareNode: p,
      emitNode: k
    };
  }
  createRasterNode(e, t) {
    const s = this.metrics === null ? null : m(this.metrics, "uint", this.tileCount * 4).toAtomic(), r = m(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), a = m(
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
    ).toReadOnly(), u = V("vec4", y), h = V("vec4", y), d = V("vec4", y), f = V("uint", y), v = V("uint", y), b = V("uint", 8), p = t === "direct" ? Lt(this.colorTexture) : null, x = T(Ps), k = T(ga), S = this.chunks, R = t === "chunk" && S !== null ? m(S.tasks, "uvec2", S.tasks.count).toReadOnly() : null, _ = t === "chunk" && S !== null ? m(S.partialData, "vec4", S.partialData.count) : null, { frame: C } = this;
    return st(() => {
      const N = g(_e), w = x({ value: N }), O = x({ value: N.shiftRight(1) }), $ = g(X.x), I = (t === "direct" ? X.y.mul(C.tilesX).add(X.x) : R.element($).x).toVar("rasterTile"), E = t === "chunk" ? R.element($).y : g(0), D = t === "direct" ? X.x : I.mod(C.tilesX), q = t === "direct" ? X.y : I.div(C.tilesX), ne = Qe(
        D.mul(g(B)).add(w),
        q.mul(g(B)).add(O)
      ).toVar("rasterPixelCoordinateValue"), U = ne.x.lessThan(g(C.viewport.x)).and(ne.y.lessThan(g(C.viewport.y))).toVar("rasterActivePixel"), oe = c.element(I), we = c.element(I.add(1)), ke = g(we.sub(oe)), he = ke.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const z = g(this.maxSplatsPerTile);
        he.assign(ye(ke.lessThan(z), ke, z));
      }
      let te = g(0);
      const K = he.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        K.assign(
          ye(
            he.greaterThan(g(this.rasterChunkSize)),
            g(0),
            he
          )
        );
      else if (t === "chunk") {
        te = E.mul(g(this.rasterChunkSize)).toVar("rasterSampleStart");
        const z = te.add(g(this.rasterChunkSize));
        K.assign(
          ye(z.lessThan(he), z, he)
        );
      }
      const Se = be(ne).add(0.5), Ie = /* @__PURE__ */ new Map([
        [Ft, () => ne],
        [qt, () => Se],
        [Kt, () => Se.div(C.viewport.xy)]
      ]), De = W(0).toVar("rasterPixelValue");
      M(U, () => {
        De.assign(
          Ke(e.rasterPixelValueNode, Ie)
        );
      });
      const Ce = rt(0).toVar("accumulated"), fe = W(1).toVar("transmittance"), le = W(1).toVar("depth"), Ee = ce(!1).toVar("depthWritten"), ge = ce(!1).toVar("done"), Le = s === null ? null : g(0).toVar("rasterChecked"), ze = s === null ? null : g(0).toVar("rasterBlended");
      Fe(
        {
          start: te,
          end: K,
          type: "uint",
          condition: "<",
          update: `+= ${y}`
        },
        ({ i: z }) => {
          const Ne = z.add(N);
          M(Ne.lessThan(K), () => {
            let Y = Ne;
            this.maxSplatsPerTile !== null && (Y = g(
              Ct(
                W(Ne).add(0.5).mul(W(ke)).div(W(he))
              )
            ));
            const Q = oe.add(Y).toVar("rasterSourceRecordIndex"), se = l.element(Q).y, H = a.element(se), F = o.element(se);
            u.element(N).assign(H), h.element(N).assign(J(F.xyz, H.w.mul(255).log())), d.element(N).assign(n.element(se)), f.element(N).assign(se);
          }), M(N.equal(0), () => {
            v.element(g(0)).assign(
              ye(
                z.add(g(y)).lessThan(K),
                g(1),
                g(0)
              )
            );
          });
          const je = k({ values: v }).toVar("hasNextBatch"), Ue = g(K.sub(z)), Me = ye(
            Ue.lessThan(g(y)),
            Ue,
            g(y)
          );
          M(U.and(ge.not()), () => {
            Fe(
              {
                start: g(0),
                end: Me,
                type: "uint",
                condition: "<"
              },
              ({ i: Y }) => {
                Le?.addAssign(1);
                const Q = u.element(Y), se = f.element(Y), H = Se.sub(Q.xy), F = new Map(Ie);
                F.set(Yt, () => De), F.set(lt, () => se), F.set(
                  Vt,
                  () => g(r.element(se).w)
                ), F.set(Ht, () => Q.xy), F.set(Xt, () => H), F.set(Zt, () => Q.z);
                const ct = Ke(
                  e.rasterBreakNode,
                  F
                );
                M(ct, () => {
                  ge.assign(ce(!0)), qe();
                });
                const We = h.element(Y), me = We.xyz, ve = me.x.mul(H.x.mul(H.x)).add(me.y.mul(2).mul(H.x).mul(H.y)).add(me.z.mul(H.y.mul(H.y))).mul(-0.5);
                M(
                  ve.greaterThan(0).or(ve.lessThan(We.w.negate())),
                  () => {
                    mt();
                  }
                );
                const is = Pe(ps(me.x, 1e-12)), ut = me.y.div(is), ar = Pe(ps(me.z.sub(ut.mul(ut)), 1e-12)), as = be(
                  is.mul(H.x).add(ut.mul(H.y)),
                  ar.mul(H.y)
                ), dt = new Map([
                  ...F,
                  [zs, () => as],
                  [js, () => as.div(6).add(0.5)],
                  [
                    Qt,
                    () => d.element(Y).xyz
                  ],
                  [Jt, () => Q.w],
                  [es, () => ve],
                  [Us, () => As(ve)]
                ]), nr = Ke(e.rasterDiscardNode, dt);
                M(nr, () => {
                  mt();
                });
                const ht = xe(
                  Ke(e.rasterAlphaNode, dt),
                  0,
                  0.99
                );
                M(ht.lessThan(W(1 / 255)), () => {
                  mt();
                }), M(Ee.not(), () => {
                  le.assign(va(Q.z, C)), Ee.assign(ce(!0));
                });
                const or = Ke(e.rasterColorNode, dt);
                Ce.addAssign(or.mul(fe).mul(ht)), ze?.addAssign(1), fe.mulAssign(W(1).sub(ht)), M(fe.lessThan(this.transmittanceThreshold), () => {
                  ge.assign(ce(!0)), qe();
                });
              }
            );
          }), M(je.equal(0), () => {
            qe();
          }), v.element(N).assign(ye(U.and(ge.not()), g(1), g(0))), fs(), M(N.lessThan(8), () => {
            const Y = N.mul(32), Q = g(0).toVar("subgroupActive");
            Fe(
              { start: g(0), end: g(32), type: "uint", condition: "<" },
              ({ i: se }) => {
                Q.bitOrAssign(
                  v.element(Y.add(se))
                );
              }
            ), b.element(N).assign(Q);
          }), fs(), M(N.equal(0), () => {
            const Y = g(0).toVar("tileActiveReduction");
            Fe(
              { start: g(0), end: g(8), type: "uint", condition: "<" },
              ({ i: Q }) => {
                Y.bitOrAssign(b.element(g(Q)));
              }
            ), v.element(g(0)).assign(Y);
          });
          const Te = k({ values: v });
          M(Te.equal(0), () => {
            qe();
          });
        }
      ), M(U, () => {
        if (s !== null) {
          const z = I.mul(4);
          Ae(s.element(z), Le), Ae(s.element(z.add(1)), ze), t === "direct" && M(ke.greaterThan(0).and(K.greaterThan(0)), () => {
            Ae(s.element(z.add(2)), g(1)), Ae(
              s.element(z.add(3)),
              ye(
                fe.lessThan(this.transmittanceThreshold),
                g(1),
                g(0)
              )
            );
          });
        }
        if (t === "direct")
          Gs(
            Ce,
            fe,
            le,
            ne,
            p,
            this.depthTexture,
            C
          );
        else {
          const z = $.mul(g(y)).add(N).mul(g(S.partialStride));
          _.element(z).assign(J(Ce, fe)), this.depthTexture !== null && _.element(z.add(1)).assign(J(le, 0, 0, 0));
        }
      });
    })().computeKernel([B, B]).setName(
      t === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const e = this.metrics === null ? null : m(this.metrics, "uint", this.tileCount * 4).toAtomic(), t = this.chunks, s = m(
      t.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), r = m(
      t.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), a = m(
      t.partialData,
      "vec4",
      t.partialData.count
    ).toReadOnly(), o = Lt(this.colorTexture), n = T(Ps), { frame: l } = this;
    return st(() => {
      const u = g(_e), h = n({ value: u }), d = n({ value: u.shiftRight(1) }), f = X.y.mul(l.tilesX).add(X.x), v = s.element(f), b = Qe(
        X.x.mul(g(B)).add(h),
        X.y.mul(g(B)).add(d)
      ), p = b.x.lessThan(g(l.viewport.x)).and(b.y.lessThan(g(l.viewport.y)));
      M(p.and(v.greaterThan(0)), () => {
        const x = rt(0).toVar("chunkCompositeColor"), k = W(1).toVar("chunkCompositeTransmittance"), S = W(1).toVar("chunkCompositeDepth"), R = ce(!1).toVar("chunkCompositeDepthWritten"), _ = r.element(f);
        Fe(
          {
            start: g(0),
            end: v,
            type: "uint",
            condition: "<"
          },
          ({ i: C }) => {
            const A = _.add(C).mul(g(y)).add(u).mul(g(t.partialStride)), N = a.element(A);
            x.addAssign(N.xyz.mul(k)), this.depthTexture !== null && M(R.not().and(N.w.lessThan(1)), () => {
              S.assign(a.element(A.add(1)).x), R.assign(ce(!0));
            }), k.mulAssign(N.w), M(k.lessThan(this.transmittanceThreshold), () => {
              qe();
            });
          }
        ), Gs(
          x,
          k,
          S,
          b,
          o,
          this.depthTexture,
          l
        ), e !== null && (Ae(e.element(f.mul(4).add(2)), g(1)), Ae(
          e.element(f.mul(4).add(3)),
          ye(
            k.lessThan(this.transmittanceThreshold),
            g(1),
            g(0)
          )
        ));
      });
    })().computeKernel([B, B]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const e = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let t = 0, s = 0, r = 0, a = 0;
    for (let o = 0; o < e.length; o += 4)
      t += e[o], s += e[o + 1], r += e[o + 2], a += e[o + 3];
    return { checked: t, blended: s, pixels: r, alphaStopped: a };
  }
}
function va(i, e) {
  const t = i.negate();
  return xe(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function Gs(i, e, t, s, r, a, o) {
  const n = xe(W(o.background[3]), 0, 1);
  i.addAssign(
    rt(o.background[0], o.background[1], o.background[2]).mul(e).mul(n)
  );
  const l = W(1).sub(e.mul(W(1).sub(n)));
  gs(r, Xe(s), J(i, l)), a !== null && gs(
    Lt(a),
    Xe(s),
    J(t, 0, 0, 1)
  );
}
function Ke(i, e) {
  return i.context({ overrideNodes: e });
}
class ya {
  constructor(e, t, s, r, a, o) {
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
      r,
      "uint",
      s
    ).toReadOnly(), l = T(
      Gi
    );
    this.prepareNode = l({
      gaussian_count: g(s),
      projected_mean: m(
        a,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: n,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const c = T(
      Ii(t)
    );
    this.compactNode = c({
      gid: ee,
      gaussian_count: g(s),
      viewport: o,
      visible_offsets: n,
      projected_mean: m(
        a,
        "vec4",
        s
      ).toReadOnly(),
      records: m(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [y]).setName(`3DGS compact visible Gaussians WGSL (${t})`);
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
class ba {
  constructor(e, t, s, r, a, o, n, l, c, u, h, d, f, v, b = 1e-4, p = !1) {
    this.renderer = e, this.data = s, this.mode = a, this.capacity = n, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = d, this.radixBackend = f, this.nodes = v, this.rasterTransmittanceThreshold = b, this.rasterStats = p, this.frame = new $i(t, l), this.objects = new ji(t, r, s.count), this.projection = new Yi(
      s,
      this.frame,
      this.objects,
      o,
      v,
      d
    ), this.profileDiagnostics = c || p ? new ea(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new Rt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new ya(
      e,
      a,
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
    ), this.depthSorter.configure(a === "float32" ? 32 : 16), this.orderedTiles = new Ti(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Rt(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new zi(
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
  rasterStats;
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
  prepareFrame(e, t, s, r) {
    if (this.frame.update(e, t, this.tilesX, this.tilesY), this.objects.update(), (e !== this.width || t !== this.height) && this.rebuildTileStages(e, t, s, r), this.tileOffsets === null || this.rasterizer === null)
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
  rebuildTileStages(e, t, s, r) {
    const a = Math.ceil(e / B), o = Math.ceil(t / B), n = a * o;
    if (a > 65535 || o > 65535)
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
      r,
      this.frame,
      this.maxRasterizedSplatsPerTile,
      this.rasterChunkSize,
      n,
      this.nodes,
      this.rasterStats,
      this.rasterTransmittanceThreshold
    ), this.width = e, this.height = t, this.tilesX = a, this.tilesY = o, this.frame.update(e, t, a, o), this.tileStageRebuilds++;
  }
}
function xa(i, e) {
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
const kt = new Lr();
class _a extends ns {
  gaussianStore;
  redrawStrategy;
  depthSortMode;
  antialiasMode;
  background;
  outputDepth;
  colorSpace;
  profileKernels;
  rasterStats;
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
  nodeSlots = Xr();
  dirtyStages = 0;
  frameDirty = !0;
  successfulRenderCount = 0;
  cachedFrameCount = 0;
  autoSnapshot = null;
  pipelineDevice = null;
  disposed = !1;
  constructor(e, t, s, r = {}) {
    super(ns.COLOR, new It(), t, {
      type: os,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const a = r.depthSortMode ?? "float32", o = r.antialiasMode ?? "compensated", n = r.redrawStrategy ?? "always", l = r.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    if (n !== "always" && n !== "auto" && n !== "never")
      throw new RangeError(
        'redrawStrategy must be "always", "auto", or "never"'
      );
    const c = xa(
      l,
      e.hasFeature("subgroups")
    ), u = r.intersectionCapacity ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (u !== null && u > y * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const h = r.maxRasterizedSplatsPerTile ?? null;
    if (h !== null && (!Number.isInteger(h) || h <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const d = r.rasterChunkSize === void 0 ? Ci : r.rasterChunkSize;
    if (Pi(
      d,
      u ?? y * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.redrawStrategy = n, this.depthSortMode = a, this.antialiasMode = o, this.requestedIntersectionCapacity = u, this.background = r.background ?? [0, 0, 0, 0], this.outputDepth = r.outputDepth ?? !1, this.colorSpace = r.colorSpace ?? _r, this.profileKernels = r.profileKernels ?? !1, this.rasterStats = r.rasterStats ?? !1, this.rasterTransmittanceThreshold = r.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = h, this.rasterChunkSize = d, this.subpixelSampleCulling = r.subpixelSampleCulling ?? !0, this.radixBackend = c, this.renderTarget.texture.dispose(), this.colorTexture = new ls(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = os, this.colorTexture.colorSpace = wr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new ls(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = kr, this.depthTexture.type = Sr, this.depthTexture.minFilter = cs, this.depthTexture.magFilter = cs, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    const s = this.renderTarget.width, r = this.renderTarget.height;
    super.setSize(e, t), this.depthTexture?.setSize(
      this.renderTarget.width,
      this.renderTarget.height,
      1
    ), (s !== this.renderTarget.width || r !== this.renderTarget.height) && (this.frameDirty = !0);
  }
  /** Number of complete Gaussian kernel chains successfully encoded. */
  get renderCount() {
    return this.successfulRenderCount;
  }
  /** Number of frames that reused the last valid output textures. */
  get cacheHitCount() {
    return this.cachedFrameCount;
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
    this.dirtyStages |= 1, this.invalidateAutomatically();
  }
  invalidateRasterizer() {
    this.dirtyStages |= 2, this.invalidateAutomatically();
  }
  /** Force the next frame to run the complete Gaussian kernel chain. */
  invalidate() {
    this.frameDirty = !0;
  }
  set needsUpdate(e) {
    super.needsUpdate = e, e && (this.dirtyStages |= 3, this.invalidateAutomatically());
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
    t.getDrawingBufferSize(kt);
    const s = Math.max(1, Math.floor(kt.x)), r = Math.max(1, Math.floor(kt.y)), a = this.getResolutionScale(), o = Math.max(1, Math.floor(s * a)), n = Math.max(
      1,
      Math.floor(r * a)
    );
    (this.renderTarget.width !== o || this.renderTarget.height !== n) && this.setSize(s, r);
    const l = ir(t);
    if (this.pipelineDevice !== null && this.pipelineDevice !== l && (this.pipeline?.dispose(), this.pipeline = null, this.pipelineLayoutVersion = -1, this.frameDirty = !0, this.autoSnapshot = null), this.redrawStrategy === "never" && !this.frameDirty && this.pipeline !== null) {
      this.cachedFrameCount++;
      return;
    }
    this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: wa(t) });
    const c = this.gaussianStore.updateLod(this.camera);
    this.redrawStrategy === "auto" && this.autoInputsChanged(o, n) && (this.frameDirty = !0);
    const u = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      y * 65535,
      Math.max(1, u.count * 16)
    )), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), u.count > y * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new ba(
        t,
        this.camera,
        u,
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
        this.rasterStats
      ), this.pipelineDevice = l, this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0, this.frameDirty = !0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.redrawStrategy !== "always" && !this.frameDirty) {
      this.cachedFrameCount++;
      return;
    }
    if (t.initRenderTarget(this.renderTarget), this.pipeline.prepareFrame(
      o,
      n,
      this.colorTexture,
      this.depthTexture
    ), this.pipeline.render(), this.frameDirty = !1, this.successfulRenderCount++, this.redrawStrategy === "auto" && (this.autoSnapshot = this.captureAutoSnapshot(o, n)), this.debugListeners.size > 0) {
      const h = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: c
      };
      for (const d of this.debugListeners) d(h);
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
    this.disposed || (this.disposed = !0, this.pipeline?.dispose(), this.pipeline = null, this.pipelineDevice = null, this.frameDirty = !0, this.autoSnapshot = null, this.debugListeners.clear(), this.depthTexture?.dispose(), super.dispose());
  }
  setProjectionNode(e, t) {
    Ms(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateProjection());
  }
  setRasterNode(e, t) {
    Ms(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateRasterizer());
  }
  invalidateAutomatically() {
    this.redrawStrategy === "auto" && (this.frameDirty = !0);
  }
  autoInputsChanged(e, t) {
    const s = this.autoSnapshot;
    if (s === null) return !0;
    const r = this.camera;
    if (r.updateWorldMatrix(!0, !1), s.width !== e || s.height !== t || s.cameraNear !== r.near || s.cameraFar !== r.far || s.cameraLayers !== r.layers.mask || s.storeContentVersion !== this.gaussianStore.contentVersion || !St(
      s.projectionMatrix,
      r.projectionMatrix.elements
    ) || !St(
      s.cameraMatrixWorldInverse,
      r.matrixWorldInverse.elements
    ) || s.clouds.length !== this.gaussianStore.clouds.length)
      return !0;
    for (let a = 0; a < s.clouds.length; a++) {
      const o = s.clouds[a], n = this.gaussianStore.clouds[a];
      if (n.updateWorldMatrix(!0, !1), o.cloud !== n || o.visible !== Is(n, r) || !St(o.matrixWorld, n.matrixWorld.elements))
        return !0;
    }
    return !1;
  }
  captureAutoSnapshot(e, t) {
    const s = this.camera;
    return s.updateWorldMatrix(!0, !1), {
      width: e,
      height: t,
      cameraNear: s.near,
      cameraFar: s.far,
      cameraLayers: s.layers.mask,
      projectionMatrix: [...s.projectionMatrix.elements],
      cameraMatrixWorldInverse: [...s.matrixWorldInverse.elements],
      storeContentVersion: this.gaussianStore.contentVersion,
      clouds: this.gaussianStore.clouds.map((r) => (r.updateWorldMatrix(!0, !1), {
        cloud: r,
        visible: Is(r, s),
        matrixWorld: [...r.matrixWorld.elements]
      }))
    };
  }
}
function St(i, e) {
  for (let t = 0; t < 16; t++)
    if (i[t] !== e[t]) return !1;
  return !0;
}
function Is(i, e) {
  if (!i.layers.test(e.layers)) return !1;
  let t = i, s = i;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof It;
}
function Ms(i, e) {
  if (i?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function wa(i) {
  return ir(i).limits;
}
function ir(i) {
  const e = i.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device;
}
function Aa(i, e, t, s) {
  return new _a(i, e, t, s);
}
export {
  Or as CanonicalGaussianPlyLoader,
  Ia as DistanceAwareRadialLodPackingStrategy,
  Mr as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  ys as GaussianCloud,
  Os as GaussianData,
  Tt as GaussianLod,
  Ra as GaussianLodColorHelper,
  bs as GaussianLodNode,
  Mt as GaussianOctree,
  jr as GaussianOctreeNode,
  _a as GaussianPass,
  Ta as GaussianStore,
  gi as GaussianStoreAttributes,
  fi as GaussianStorePackedAttribute,
  Na as LodHelper,
  Pa as MaximumLodPackingStrategy,
  La as OctreeHelper,
  Bs as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Ga as RadialLodPackingStrategy,
  oi as RadialLodWorkerPlanner,
  pi as RemainingCapacityBudgetStrategy,
  Ma as SourceFractionBudgetStrategy,
  qs as StreamingLodPackingStrategy,
  ei as TieredRadialLodPackingStrategy,
  Bt as gaussianColor,
  At as gaussianIndex,
  Ot as gaussianObjectId,
  $t as gaussianObjectMatrix,
  Dt as gaussianObjectVisible,
  ot as gaussianOpacity,
  Aa as gaussianPass,
  it as gaussianPositionLocal,
  Je as gaussianPositionWorld,
  Wt as gaussianProjectedArea,
  Ut as gaussianProjectedSigma,
  nt as gaussianRotation,
  at as gaussianScale,
  Es as gaussianScreenBoundsMax,
  Ds as gaussianScreenBoundsMin,
  jt as gaussianScreenPosition,
  zt as gaussianViewDepth,
  Et as gaussianViewDirection,
  _s as isStreamingLodPackingStrategy,
  Tr as packShRgb8e8,
  Ht as rasterGaussianCenter,
  Qt as rasterGaussianColor,
  zs as rasterGaussianCoord,
  lt as rasterGaussianIndex,
  Jt as rasterGaussianOpacity,
  Vt as rasterObjectId,
  Ft as rasterPixelCoordinate,
  Xt as rasterPixelDelta,
  Yt as rasterPixelValue,
  es as rasterPower,
  qt as rasterScreenPosition,
  Kt as rasterScreenUV,
  js as rasterUV,
  Zt as rasterViewDepth,
  Us as rasterWeight,
  $s as shBytesPerCoefficient,
  Ca as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
