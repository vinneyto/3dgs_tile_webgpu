import { StorageBufferAttribute as de, Vector3 as M, Quaternion as fr, Box3 as nt, Object3D as Es, Matrix4 as Ae, Ray as gr, LineSegments as mr, BufferGeometry as yr, Float32BufferAttribute as br, LineBasicMaterial as vr, BoxGeometry as xr, MeshBasicMaterial as _r, DoubleSide as wr, InstancedMesh as kr, Color as Sr, IndirectStorageBufferAttribute as Cr, Vector4 as Lr, Scene as $s, PassNode as cs, HalfFloatType as us, SRGBColorSpace as Nr, StorageTexture as ds, NoColorSpace as Pr, RedFormat as Rr, FloatType as Mr, NearestFilter as hs, PerspectiveCamera as Ir, Vector2 as Ar } from "three/webgpu";
import { property as E, bool as ue, exp as Ds, float as q, storage as v, uint as y, vec3 as it, mix as Gr, wgslFn as U, instanceIndex as se, workgroupArray as K, workgroupId as Q, invocationLocalIndex as ke, uniform as Ve, uvec2 as Je, Fn as rt, If as D, Return as ge, vec4 as te, mat4 as ps, normalize as Tr, sqrt as Me, clamp as we, log as zr, ceil as fs, vec2 as _e, ivec2 as Ze, int as gs, floor as Pt, subgroupIndex as mt, invocationSubgroupIndex as yt, subgroupSize as bt, atomicStore as Br, storageTexture as Rt, select as xe, Loop as qe, Break as Ke, Continue as vt, max as ms, workgroupBarrier as ys, atomicAdd as Oe, textureStore as bs, colorSpaceToWorking as Or } from "three/tsl";
import { Quaternion as Us, Matrix4 as js } from "three";
class zt {
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
const Er = 16, Ws = 4;
function Mt(r, e, t) {
  const s = Math.max(Math.abs(r), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const n = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), i = 127 / 2 ** n, a = xt(r, i), o = xt(e, i), l = xt(t, i), c = n + 127;
  return (a | o << 8 | l << 16 | c << 24) >>> 0;
}
function $r(r) {
  const e = 2 ** ((r >>> 24) - 127) / 127;
  return [
    _t(r) * e,
    _t(r >>> 8) * e,
    _t(r >>> 16) * e
  ];
}
function Fs(r) {
  return r === "rgb8e8" ? Ws : Er;
}
function xt(r, e) {
  return Math.min(127, Math.max(-127, Math.round(r * e))) & 255;
}
function _t(r) {
  const e = r & 255;
  return e < 128 ? e : e - 256;
}
const vs = {
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
}, Dr = [
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
class Ur {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = jr(e), s = new Map(
      t.properties.map((p, m) => [p.name, m])
    );
    for (const p of Dr)
      if (!s.has(p))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${p}`);
    const n = t.properties.map((p) => p.name.match(/^f_rest_(\d+)$/)?.[1]).filter((p) => p !== void 0).map(Number).sort((p, m) => p - m);
    for (let p = 0; p < n.length; p++)
      if (n[p] !== p)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (n.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const i = n.length / 3, a = i + 1, o = Math.sqrt(a);
    if (!Number.isInteger(o) || o < 1 || o > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = Wr(e, t), c = (p) => s.get(p), u = n.map(
      (p) => c(`f_rest_${p}`)
    ), d = t.vertexCount, h = new Float32Array(d * 4), f = new Float32Array(d * 4), g = new Float32Array(d * 4), b = new Float32Array(d * a * 4);
    for (let p = 0; p < d; p++) {
      const m = p * 4;
      h[m] = l(p, c("x")), h[m + 1] = l(p, c("y")), h[m + 2] = l(p, c("z")), f[m] = Math.max(
        Math.exp(l(p, c("scale_0"))),
        1e-6
      ), f[m + 1] = Math.max(
        Math.exp(l(p, c("scale_1"))),
        1e-6
      ), f[m + 2] = Math.max(
        Math.exp(l(p, c("scale_2"))),
        1e-6
      );
      const N = l(p, c("opacity"));
      f[m + 3] = 1 / (1 + Math.exp(-N));
      const P = l(p, c("rot_0")), I = l(p, c("rot_1")), C = l(p, c("rot_2")), w = l(p, c("rot_3")), k = Math.hypot(I, C, w, P);
      k > 1e-12 ? (g[m] = I / k, g[m + 1] = C / k, g[m + 2] = w / k, g[m + 3] = P / k) : g[m + 3] = 1;
      const x = p * a * 4;
      b[x] = l(p, c("f_dc_0")), b[x + 1] = l(p, c("f_dc_1")), b[x + 2] = l(p, c("f_dc_2"));
      for (let S = 1; S < a; S++) {
        const G = x + S * 4, A = S - 1;
        for (let R = 0; R < 3; R++) {
          const z = u[R * i + A];
          b[G + R] = l(
            p,
            z
          );
        }
      }
    }
    return new zt(
      {
        means: tt("ply.means", h),
        scalesOpacity: tt("ply.scales-opacity", f),
        rotations: tt("ply.rotations-xyzw", g),
        shCoefficients: tt("ply.sh-coefficients", b)
      },
      {
        count: d,
        shDegree: o - 1,
        ownsBuffers: !0
      }
    );
  }
}
function tt(r, e) {
  const t = new de(e, 4);
  return t.name = r, t;
}
function jr(r) {
  const e = new Uint8Array(r), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let g = 0; g <= e.length - t.length; g++) {
    let b = !0;
    for (let p = 0; p < t.length; p++)
      if (e[g + p] !== t[p]) {
        b = !1;
        break;
      }
    if (b) {
      s = g;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let n = s + t.length;
  if (e[n] === 13 && n++, e[n] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  n++;
  const a = new TextDecoder().decode(e.subarray(0, n)).split(/\r?\n/);
  if (a[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let o = null, l = "", c = -1, u = 0;
  const d = [], h = [];
  for (const g of a) {
    const b = g.trim().split(/\s+/);
    if (b[0] === "format") {
      if (b[1] !== "ascii" && b[1] !== "binary_little_endian" && b[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${b[1] ?? "unknown"}`);
      o = b[1];
    } else if (b[0] === "element") {
      l = b[1] ?? "";
      const p = Number(b[2]);
      if (!Number.isInteger(p) || p < 0)
        throw new Error(`Invalid element count for ${l}`);
      h.push({ name: l, count: p }), l === "vertex" && (c = p);
    } else if (b[0] === "property" && l === "vertex") {
      if (b[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const p = b[1], m = b[2];
      if (!(p in vs) || m === void 0)
        throw new Error(`Unsupported vertex property: ${g}`);
      d.push({ name: m, type: p, byteOffset: u }), u += vs[p];
    }
  }
  if (o === null) throw new Error("Invalid PLY: format is missing");
  if (c <= 0) throw new Error("PLY must contain at least one vertex");
  if (h.find(
    (g) => g.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: o, vertexCount: c, properties: d, vertexStride: u, dataOffset: n };
}
function Wr(r, e) {
  if (e.format === "ascii") {
    const i = new TextDecoder().decode(
      new Uint8Array(r, e.dataOffset)
    ), a = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let o = 0;
    for (let l = 0; l < a.length; l++) {
      for (; o < i.length && /\s/.test(i[o]); ) o++;
      const c = o;
      for (; o < i.length && !/\s/.test(i[o]); ) o++;
      const u = Number(i.slice(c, o));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${l}`);
      a[l] = u;
    }
    return (l, c) => a[l * e.properties.length + c];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > r.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(r), n = e.format === "binary_little_endian";
  return (i, a) => {
    const o = e.properties[a], l = e.dataOffset + i * e.vertexStride + o.byteOffset;
    return Fr(s, l, o.type, n);
  };
}
function Fr(r, e, t, s) {
  switch (t) {
    case "char":
    case "int8":
      return r.getInt8(e);
    case "uchar":
    case "uint8":
      return r.getUint8(e);
    case "short":
    case "int16":
      return r.getInt16(e, s);
    case "ushort":
    case "uint16":
      return r.getUint16(e, s);
    case "int":
    case "int32":
      return r.getInt32(e, s);
    case "uint":
    case "uint32":
      return r.getUint32(e, s);
    case "float":
    case "float32":
      return r.getFloat32(e, s);
    case "double":
    case "float64":
      return r.getFloat64(e, s);
  }
}
const xs = 1 / 255, Vr = 0.99, wt = 1e-12;
function qr(r, e, t, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const n = e.means.array, i = e.scalesOpacity.array, a = e.rotations.array, o = new M(), l = new M(), c = new M(), u = new fr();
  let d = 1;
  for (const h of t) {
    const f = h.gaussianIndex * 4, g = Math.min(1, Math.max(0, i[f + 3]));
    if (g < xs) continue;
    u.set(
      -a[f],
      -a[f + 1],
      -a[f + 2],
      a[f + 3]
    ).normalize(), o.set(
      r.origin.x - n[f],
      r.origin.y - n[f + 1],
      r.origin.z - n[f + 2]
    ).applyQuaternion(u), l.copy(r.direction).applyQuaternion(u);
    const b = Math.max(i[f], wt), p = Math.max(i[f + 1], wt), m = Math.max(i[f + 2], wt);
    o.set(
      o.x / b,
      o.y / p,
      o.z / m
    ), l.set(
      l.x / b,
      l.y / p,
      l.z / m
    );
    const N = l.lengthSq();
    if (N <= Number.EPSILON) continue;
    const P = Math.max(
      0,
      -o.dot(l) / N
    );
    c.copy(o).addScaledVector(l, P);
    const I = Math.min(
      Vr,
      g * Math.exp(-0.5 * c.lengthSq())
    );
    if (I < xs || (d *= 1 - I, 1 - d < s)) continue;
    const C = r.at(P, new M());
    return {
      gaussianIndex: h.gaussianIndex,
      distance: r.origin.distanceTo(C),
      point: C
    };
  }
  return null;
}
class Kr {
  constructor(e, t, s, n, i, a, o, l) {
    this.id = e, this.depth = t, this.bounds = s, this.count = n, this.maxSplatRadius = i, this.raycastBounds = l, this.children = a, this.gaussianIndices = o;
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
class Bt {
  constructor(e, t, s, n) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = n, this.bounds = Yr(e), this.rootBounds = Xr(this.bounds);
    const i = e.means.array, a = e.scalesOpacity.array, o = [], l = [], c = Array.from({ length: e.count }, (d, h) => h), u = (d, h, f) => {
      const g = o.length;
      o.push(null);
      const b = d.length > t && f < s && h.max.x - h.min.x > Number.EPSILON, p = [];
      if (b) {
        const P = h.getCenter(new M()), I = Array.from({ length: 8 }, () => []);
        for (const C of d) {
          const w = C * 4, k = (i[w] >= P.x ? 1 : 0) | (i[w + 1] >= P.y ? 2 : 0) | (i[w + 2] >= P.z ? 4 : 0);
          I[k].push(C);
        }
        for (let C = 0; C < 8; C++) {
          const w = I[C];
          w.length !== 0 && p.push(
            u(
              w,
              Hr(h, P, C),
              f + 1
            )
          );
        }
      }
      let m = 0;
      if (p.length > 0)
        for (const P of p)
          m = Math.max(
            m,
            o[P].maxSplatRadius
          );
      else {
        for (const P of d) {
          const I = P * 4;
          m = Math.max(
            m,
            a[I],
            a[I + 1],
            a[I + 2]
          );
        }
        l.push(g);
      }
      const N = h.clone().expandByScalar(m * 3);
      return o[g] = new Kr(
        g,
        f,
        h,
        d.length,
        m,
        p,
        p.length === 0 ? Uint32Array.from(d) : null,
        N
      ), g;
    };
    u(c, this.rootBounds.clone(), 0), this.nodes = o, this.leafNodeIds = Uint32Array.from(l);
  }
  data;
  leafCapacity;
  maxDepth;
  static build(e, t = {}) {
    const s = t.leafCapacity ?? 256, n = t.maxDepth ?? 10;
    if (!Number.isInteger(s) || s <= 0)
      throw new RangeError("GaussianOctree leafCapacity must be positive");
    if (!Number.isInteger(n) || n < 0)
      throw new RangeError("GaussianOctree maxDepth must be non-negative");
    return new Bt(
      e,
      s,
      n,
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
    const n = t.maxHits ?? 1 / 0;
    if (!(n > 0)) return [];
    const i = [], a = [this.rootNode];
    for (; a.length > 0; ) {
      const o = this.nodes[a.pop()], l = Math.max(0, s - 3) * o.maxSplatRadius, c = l === 0 ? o.raycastBounds : o.raycastBounds.clone().expandByScalar(l);
      if (e.intersectsBox(c))
        if (o.gaussianIndices !== null)
          for (const u of o.gaussianIndices) i.push(u);
        else
          for (const u of o.children) a.push(u);
    }
    return this.raycastIndices(e, i, s, n);
  }
  raycastIndices(e, t, s = 3, n = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(n > 0)) return [];
    const i = this.data.means.array, a = this.data.scalesOpacity.array, o = new M(), l = new M(), c = [];
    for (let u = 0; u < t.length; u++) {
      const d = t[u], h = d * 4;
      o.set(i[h], i[h + 1], i[h + 2]);
      const f = Math.max(
        a[h],
        a[h + 1],
        a[h + 2]
      ) * s;
      e.closestPointToPoint(o, l), !(l.distanceToSquared(o) > f * f) && c.push({
        gaussianIndex: d,
        distance: e.origin.distanceTo(l),
        point: l.clone()
      });
    }
    return c.sort((u, d) => u.distance - d.distance), c.length > n && (c.length = n), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function Yr(r) {
  const e = r.means.array, t = new nt(), s = new M();
  for (let n = 0; n < r.count; n++) {
    const i = n * 4;
    s.set(e[i], e[i + 1], e[i + 2]), t.expandByPoint(s);
  }
  return t;
}
function Xr(r) {
  const e = r.getCenter(new M()), t = r.getSize(new M()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new nt(
    new M(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new M(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function Hr(r, e, t) {
  return new nt(
    new M(
      t & 1 ? e.x : r.min.x,
      t & 2 ? e.y : r.min.y,
      t & 4 ? e.z : r.min.z
    ),
    new M(
      t & 1 ? r.max.x : e.x,
      t & 2 ? r.max.y : e.y,
      t & 4 ? r.max.z : e.z
    )
  );
}
class _s extends Es {
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
  constructor(e, t, s, n = "GaussianCloud", i = null, a = null, o = 0) {
    super(), this.ownerStore = e, this.objectId = t, this.packedGaussianCount = s, this.lod = i, this.packing = a, this.priority = o, this.name = n;
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
    const s = new Ae().copy(this.matrixWorld).invert(), n = new gr().copy(e.ray).applyMatrix4(s), i = this.raycastMode === "full" ? this.lod.octree.raycast(n) : this.lod.raycast(n, this.packing), a = qr(
      n,
      this.raycastMode === "full" ? this.lod.octree.data : this.lod.data,
      i,
      this.raycastAlphaThreshold
    );
    if (a !== null) {
      const o = a.point.clone().applyMatrix4(this.matrixWorld), l = e.ray.origin.distanceTo(o);
      l >= e.near && l <= e.far && t.push({
        distance: l,
        point: o,
        object: this,
        index: a.gaussianIndex
      });
    }
  }
  /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
  dispose() {
    this.ownerStore.remove(this);
  }
}
class Bn extends mr {
  constructor(e, t = {}) {
    const s = t.minDepth ?? 0, n = t.maxDepth ?? 1 / 0, i = e.nodes.filter(
      (d) => d.depth >= s && d.depth <= n && (t.leavesOnly !== !0 || d.isLeaf)
    ), a = new Float32Array(i.length * 12 * 2 * 3);
    let o = 0;
    for (const d of i) {
      const { min: h, max: f } = d.bounds, g = [
        [h.x, h.y, h.z],
        [f.x, h.y, h.z],
        [f.x, f.y, h.z],
        [h.x, f.y, h.z],
        [h.x, h.y, f.z],
        [f.x, h.y, f.z],
        [f.x, f.y, f.z],
        [h.x, f.y, f.z]
      ];
      for (const [b, p] of Zr)
        a.set(g[b], o), a.set(g[p], o + 3), o += 6;
    }
    const l = new yr();
    l.setAttribute("position", new br(a, 3)), l.computeBoundingSphere();
    const c = t.opacity ?? 0.55, u = new vr({
      color: t.color ?? 7710719,
      opacity: c,
      transparent: c < 1,
      depthTest: t.depthTest ?? !1,
      depthWrite: !1,
      toneMapped: !1
    });
    super(l, u), this.octree = e, this.cellCount = i.length, this.name = "Gaussian octree helper", this.frustumCulled = !1, this.renderOrder = 1e3;
  }
  octree;
  isOctreeHelper = !0;
  cellCount;
  dispose() {
    this.removeFromParent(), this.geometry.dispose(), this.material.dispose();
  }
}
const Zr = [
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
class It {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const Qr = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class at {
  constructor(e, t, s = !1) {
    if (this.octree = e, this.levels = Jr(t.levels ?? Qr), this.ownsOctree = t.ownsOctree ?? !1, s) {
      this.nodes = [];
      return;
    }
    const n = t.importance ?? ei, i = new Float64Array(e.data.count);
    for (let a = 0; a < i.length; a++) {
      const o = n(a, e);
      i[a] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((a) => {
      if (a.gaussianIndices === null)
        return new It(
          a.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(a.gaussianIndices).sort(
          (l, c) => i[c] - i[l] || l - c
        )
      );
      return new It(
        a.id,
        o,
        Uint32Array.from(
          this.levels.map(
            ({ retention: l }) => Math.min(
              o.length,
              Math.max(1, Math.ceil(o.length * l))
            )
          )
        )
      );
    });
  }
  octree;
  static build(e, t = {}) {
    return new at(e, t);
  }
  levels;
  nodes;
  ownsOctree;
  disposed = !1;
  /** Data addressed by packing indices; mipmap LOD includes merged parents. */
  get data() {
    return this.octree.data;
  }
  getNodeBounds(e) {
    return this.octree.nodes[e].bounds;
  }
  raycastBounds(e, t) {
    const s = this.octree.nodes[e], n = Math.max(0, t - 3) * s.maxSplatRadius;
    return n === 0 ? s.raycastBounds : s.raycastBounds.clone().expandByScalar(n);
  }
  validateCut(e) {
  }
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
    this.validateCut(e);
    const t = new Uint32Array(e.gaussianCount), s = /* @__PURE__ */ new Set();
    let n = 0;
    for (let i = 0; i < e.nodeIds.length; i++) {
      const a = e.nodeIds[i], o = this.getPackingNode(a);
      if (s.has(a))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${a}`
        );
      s.add(a);
      const l = e.lodLevels[i], c = o.levelCounts[l];
      if (c === void 0)
        throw new RangeError(`GaussianLod level ${l} does not exist`);
      if (n + c > t.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let u = 0; u < c; u++)
        t[n++] = o.sortedGaussianIndices[u];
    }
    if (n !== t.length)
      throw new RangeError(
        `GaussianLodPacking declares ${t.length} Gaussians but selects ${n}`
      );
    return t;
  }
  raycast(e, t, s = {}) {
    this.assertUsable();
    const n = s.radiusScale ?? 3;
    if (!(n > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const i = s.maxHits ?? 1 / 0;
    if (!(i > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const a = this.data.means.array, o = this.data.scalesOpacity.array, l = new M(), c = new M(), u = [], d = /* @__PURE__ */ new Set();
    for (let h = 0; h < t.nodeIds.length; h++) {
      const f = t.nodeIds[h], g = this.getPackingNode(f);
      if (d.has(f))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${f}`
        );
      d.add(f);
      const b = t.lodLevels[h], p = g.levelCounts[b];
      if (p === void 0)
        throw new RangeError(`GaussianLod level ${b} does not exist`);
      if (e.intersectsBox(this.raycastBounds(f, n)))
        for (let m = 0; m < p; m++) {
          const N = g.sortedGaussianIndices[m], P = N * 4;
          l.set(a[P], a[P + 1], a[P + 2]);
          const I = Math.max(
            o[P],
            o[P + 1],
            o[P + 2]
          ) * n;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > I * I) && u.push({
            gaussianIndex: N,
            distance: e.origin.distanceTo(c),
            point: c.clone()
          });
        }
    }
    return u.sort((h, f) => h.distance - f.distance), u.length > i && (u.length = i), u;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsOctree && this.octree.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianLod has been disposed");
  }
  getPackingNode(e) {
    const t = this.getNode(e);
    if (this.octree.nodes[e]?.isLeaf !== !0)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${e} is internal`
      );
    return t;
  }
}
function Jr(r) {
  if (r.length === 0 || r.length > 256)
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  let e = 0;
  const t = r.map(({ retention: s }) => {
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
function ei(r, e) {
  const t = e.data.scalesOpacity.array, s = r * 4, n = [t[s], t[s + 1], t[s + 2]];
  return n.sort((i, a) => a - i), t[s + 3] * n[0] * n[1];
}
const ti = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class On extends Es {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : ti, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: e.levelCount }, (n, i) => i)
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
    for (const [s, n] of this.levelMeshes)
      n.visible = t.has(s);
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
    for (let i = 0; i < this.packing.nodeIds.length; i++) {
      const a = this.packing.lodLevels[i], o = e[a];
      if (o === void 0)
        throw new RangeError(`Gaussian LOD level ${a} does not exist`);
      o.push(this.packing.nodeIds[i]);
    }
    const t = new M(), s = new M(), n = new Ae();
    for (let i = 0; i < e.length; i++) {
      const a = e[i];
      if (a.length === 0) continue;
      const o = new xr(1, 1, 1), l = new _r({
        color: this.colors[i % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: wr,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new kr(o, l, a.length);
      for (let u = 0; u < a.length; u++) {
        const d = this.lod.getNodeBounds(a[u]);
        d.getCenter(t), d.getSize(s), n.makeScale(s.x, s.y, s.z), n.setPosition(t), c.setMatrixAt(u, n);
      }
      c.instanceMatrix.needsUpdate = !0, c.computeBoundingSphere(), c.name = `Gaussian LOD ${i} volumes`, c.frustumCulled = !1, c.renderOrder = 900 + i, c.userData.lodLevel = i, this.levelMeshes.set(i, c), this.add(c);
    }
  }
  disposeMeshes() {
    for (const e of this.levelMeshes.values())
      e.removeFromParent(), e.geometry.dispose(), e.material.dispose();
    this.levelMeshes.clear();
  }
}
const Ot = E("uint", "gaussianIndex"), Et = E("uint", "gaussianObjectId"), ot = E("vec3", "gaussianPositionLocal"), et = E("vec3", "gaussianPositionWorld"), lt = E("vec3", "gaussianScale"), ct = E("vec4", "gaussianRotation"), ut = E("float", "gaussianOpacity"), $t = E("vec3", "gaussianColor"), Dt = E("mat4", "gaussianObjectMatrix"), Ut = E("bool", "gaussianObjectVisible"), jt = E("vec3", "gaussianViewDirection"), Wt = E("float", "gaussianViewDepth"), Ft = E(
  "vec2",
  "gaussianScreenPosition"
), Vs = E(
  "vec2",
  "gaussianScreenBoundsMin"
), qs = E(
  "vec2",
  "gaussianScreenBoundsMax"
), Vt = E(
  "vec2",
  "gaussianProjectedSigma"
), qt = E("float", "gaussianProjectedArea"), dt = E("uint", "rasterGaussianIndex"), Kt = E("uint", "rasterObjectId"), Yt = E("uvec2", "rasterPixelCoordinate"), Xt = E("vec2", "rasterScreenPosition"), Ht = E("vec2", "rasterScreenUV"), Zt = E("float", "rasterPixelValue"), Qt = E("vec2", "rasterGaussianCenter"), Jt = E("vec2", "rasterPixelDelta"), Ks = E("vec2", "rasterGaussianCoord"), Ys = E("vec2", "rasterUV"), es = E("float", "rasterViewDepth"), ts = E("vec3", "rasterGaussianColor"), ss = E("float", "rasterGaussianOpacity"), rs = E("float", "rasterPower"), Xs = E("float", "rasterWeight");
function si() {
  return {
    gaussianPositionLocalNode: ot,
    gaussianPositionWorldNode: et,
    gaussianScaleNode: lt,
    gaussianRotationNode: ct,
    gaussianOpacityNode: ut,
    gaussianColorNode: $t,
    gaussianVisibilityNode: ue(!0),
    rasterPixelValueNode: q(0),
    rasterBreakNode: ue(!1),
    rasterColorNode: ts,
    rasterAlphaNode: ss.mul(Ds(rs)),
    rasterDiscardNode: ue(!1)
  };
}
const Qe = /* @__PURE__ */ new Set([
  Ot,
  Et,
  ot,
  et,
  lt,
  ct,
  ut,
  $t,
  Dt,
  Ut,
  jt,
  Wt,
  Ft,
  Vs,
  qs,
  Vt,
  qt
]), is = /* @__PURE__ */ new Set([
  dt,
  Kt,
  Yt,
  Xt,
  Ht,
  Zt,
  Qt,
  Jt,
  Ks,
  Ys,
  es,
  ts,
  ss,
  rs,
  Xs
]), Hs = /* @__PURE__ */ new Set([
  Yt,
  Xt,
  Ht
]), ri = /* @__PURE__ */ new Set([
  ...Hs,
  Zt,
  dt,
  Kt,
  Qt,
  Jt,
  es
]);
function Zs(r, e, t) {
  r.traverse((s) => {
    if ((Qe.has(s) || is.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function Ie(r, e, t) {
  r.traverse((s) => {
    if ((Qe.has(s) || is.has(s)) && !e.has(s))
      throw new Error(
        `GaussianPass.${t} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const ii = [
  15228264,
  15906891,
  4900235
];
class En {
  constructor(e, t = {}) {
    if (this.pass = e, t.colors !== void 0 && t.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = t.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...t.colors ?? ii], this.tintStrength = s, this.lodLevelAttribute = e.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = e.subscribeDebug(() => this.update()), this.enabled = t.enabled ?? !0;
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
    const e = this.lodLevelAttribute.bufferAttribute, t = v(e, "uint", e.count).toReadOnly().element(dt).mod(y(this.colors.length)), s = this.colors.map((a) => {
      const o = new Sr(a).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return it(o.r, o.g, o.b);
    });
    let n = s[s.length - 1];
    for (let a = s.length - 2; a >= 0; a--)
      n = t.equal(y(a)).select(s[a], n);
    const i = Gr(
      this.baseColorNode,
      n,
      q(this.tintStrength)
    );
    this.boundBuffer = e, this.helperColorNode = i, this.pass.rasterColorNode = i;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function Ge(r) {
  if (!Number.isInteger(r) || r < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class $n {
  setFromCamera(e, t) {
    return this;
  }
  pack({ lod: e, maxGaussians: t }) {
    Ge(t);
    const s = e.octree.data.count;
    if (t < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${t}`
      );
    const n = e.octree.leafNodeIds.slice(), i = new Uint8Array(n.length);
    return i.fill(e.finestLevel), { nodeIds: n, lodLevels: i, gaussianCount: s };
  }
}
function ns(r, e, t) {
  return r.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), r.getWorldPosition(t), e.worldToLocal(t);
}
function as(r, e) {
  const t = e instanceof M ? e.clone() : r.octree.bounds.getCenter(new M()), s = r.octree.rootBounds.getSize(new M()), n = Math.max(s.length() * 0.5, Number.EPSILON), i = new M(), a = Array.from(r.octree.leafNodeIds, (o) => (r.octree.nodes[o].bounds.getCenter(i), {
    nodeId: o,
    radius: i.distanceTo(t) / n
  }));
  return a.sort(
    (o, l) => o.radius - l.radius || o.nodeId - l.nodeId
  ), a;
}
class Dn {
  cameraCenter = new M();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof M ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof M ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ns(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ge(t), t === 0) return ni();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const n = as(e, this.center), i = [];
    let a = 0;
    for (const l of n) {
      const c = e.nodes[l.nodeId].levelCounts[s];
      if (a + c > t) break;
      i.push(l.nodeId), a += c;
    }
    const o = new Uint8Array(i.length);
    return o.fill(s), {
      nodeIds: Uint32Array.from(i),
      lodLevels: o,
      gaussianCount: a
    };
  }
}
function ni() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class ai {
  cameraCenter = new M();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof M ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = oi(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof M ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ns(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ge(t), t === 0) return li();
    const s = e.octree.data.count;
    if (s <= t) {
      const d = e.octree.leafNodeIds.slice(), h = new Uint8Array(d.length);
      return h.fill(e.finestLevel), { nodeIds: d, lodLevels: h, gaussianCount: s };
    }
    const n = as(e, this.center), i = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], a = [], o = [];
    let l = 0, c = 0, u = 0;
    for (let d = 0; d < i.length; d++) {
      const h = this.budgetShares[d];
      if (u += h, h === 0) continue;
      const f = d === i.length - 1 ? t : Math.floor(t * u), g = i[d];
      for (; c < n.length; ) {
        const b = n[c], p = e.nodes[b.nodeId].levelCounts[g];
        if (l + p > f) break;
        a.push(b.nodeId), o.push(g), l += p, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(a),
      lodLevels: Uint8Array.from(o),
      gaussianCount: l
    };
  }
}
function oi(r) {
  let e = 0;
  for (const t of r) {
    if (!(t >= 0 && t <= 1))
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    e += t;
  }
  if (Math.abs(e - 1) > 1e-6)
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  return Object.freeze([...r]);
}
function li() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Un {
  cameraCenter = new M();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof M ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof M ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ns(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ge(t), t === 0) return ci();
    const s = as(e, this.center), n = s.map(
      ({ radius: o }) => Math.max(0, e.finestLevel - Math.floor(o / this.levelDistance))
    );
    let i = s.reduce(
      (o, l, c) => o + e.nodes[l.nodeId].levelCounts[n[c]],
      0
    );
    for (let o = s.length - 1; o >= 0 && i > t; o--) {
      const l = e.nodes[s[o].nodeId];
      for (; n[o] > 0 && i > t; ) {
        const c = l.levelCounts[n[o]];
        n[o] = n[o] - 1, i -= c - l.levelCounts[n[o]];
      }
    }
    let a = s.length;
    for (; a > 0 && i > t; ) {
      a--;
      const o = e.nodes[s[a].nodeId];
      i -= o.levelCounts[n[a]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, a).map(({ nodeId: o }) => o)
      ),
      lodLevels: Uint8Array.from(n.slice(0, a)),
      gaussianCount: i
    };
  }
}
function ci() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
function ui(r) {
  const e = new Uint32Array(r.octree.leafNodeIds), t = new Float64Array(e.length * 3), s = new Uint32Array(e.length * r.levelCount);
  for (let o = 0; o < e.length; o++) {
    const l = e[o], c = r.octree.nodes[l].bounds, u = o * 3;
    t[u] = (c.min.x + c.max.x) * 0.5, t[u + 1] = (c.min.y + c.max.y) * 0.5, t[u + 2] = (c.min.z + c.max.z) * 0.5, s.set(r.nodes[l].levelCounts, o * r.levelCount);
  }
  const n = r.octree.rootBounds.max.x - r.octree.rootBounds.min.x, i = r.octree.rootBounds.max.y - r.octree.rootBounds.min.y, a = r.octree.rootBounds.max.z - r.octree.rootBounds.min.z;
  return {
    leafNodeIds: e,
    leafCenters: t,
    levelCounts: s,
    levelCount: r.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        n * n + i * i + a * a
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const Qs = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, ws = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Qs], { type: "text/javascript;charset=utf-8" });
function di(r) {
  let e;
  try {
    if (e = ws && (self.URL || self.webkitURL).createObjectURL(ws), !e) throw "";
    const t = new Worker(e, {
      name: r?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Qs),
      {
        name: r?.name
      }
    );
  }
}
const hi = 2;
class pi {
  constructor(e) {
    this.targetStrategy = e;
  }
  targetStrategy;
  worker = null;
  boundsCenter = new M();
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
    this.worker = new di({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const t = ui(e), s = Array.from(
      { length: hi },
      () => fi(t.leafNodeIds.length)
    ), n = {
      type: "init",
      data: t,
      buffers: s
    };
    this.worker.postMessage(n, [
      t.leafNodeIds.buffer,
      t.leafCenters.buffer,
      t.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: i, lodLevels: a }) => [i, a])
    ]);
  }
  request(e) {
    this.assertUsable(), this.initialize(e.lod), this.initializeWorker(), this.releaseLatestResult();
    const t = this.targetStrategy.center instanceof M ? this.targetStrategy.center : e.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
    this.latestRequestedRevision = s;
    const n = {
      type: "request",
      revision: s,
      centerX: t.x,
      centerY: t.y,
      centerZ: t.z,
      maxGaussians: e.maxGaussians
    }, a = {
      message: "budgetShares" in this.targetStrategy ? {
        ...n,
        strategy: "tiered",
        budgetShares: this.targetStrategy.budgetShares
      } : {
        ...n,
        strategy: "distance",
        levelDistance: this.targetStrategy.levelDistance
      },
      maxGaussians: e.maxGaussians
    };
    if (this.busy) {
      this.queuedRequest !== null && this.discarded++, this.queuedRequest = a;
      return;
    }
    this.dispatch(a);
  }
  cancel() {
    this.assertUsable(), this.latestRequestedRevision = ++this.revision, this.releaseLatestResult(), this.queuedRequest !== null && (this.queuedRequest = null, this.discarded++);
  }
  takeLatest() {
    if (this.assertUsable(), this.latestError !== null) {
      const n = this.latestError;
      throw this.latestError = null, n;
    }
    const e = this.latestResult;
    if (e === null) return null;
    this.latestResult = null;
    const { message: t } = e;
    let s = !1;
    return {
      packing: gi(t),
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
    const t = e.data, s = performance.now() - this.activeStarted, n = this.activeMaxGaussians;
    this.busy = !1, t.revision === this.latestRequestedRevision ? (this.releaseLatestResult(), this.latestResult = { message: t, maxGaussians: n, roundTripMs: s }) : (this.discarded++, this.recycle(t.buffer));
    const i = this.queuedRequest;
    this.queuedRequest = null, i !== null && this.dispatch(i);
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
function fi(r) {
  return {
    nodeIds: new ArrayBuffer(r * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(r * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function gi(r) {
  return {
    nodeIds: new Uint32Array(r.buffer.nodeIds, 0, r.length),
    lodLevels: new Uint8Array(r.buffer.lodLevels, 0, r.length),
    gaussianCount: r.gaussianCount
  };
}
const mi = 1024 * 1024, yi = 16, bi = 1.25;
class Js {
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
    if (this.targetStrategy = e, this.targetPlanner = t.targetPlanner ?? null, this.maxUploadBytesPerPack = t.maxUploadBytesPerPack ?? mi, this.maxChangedCellsPerPack = t.maxChangedCellsPerPack ?? yi, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
    if (Ge(e.maxGaussians), this.bindLod(e.lod), !this.initialized) {
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
    if (Ge(e.maxGaussians), this.bindLod(e.lod), !this.initialized)
      throw new Error(
        "StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches"
      );
    if (this.refreshTarget(e), this.changeCursor >= this.changes.length) return null;
    const t = [];
    let s = 0;
    for (; this.changeCursor < this.changes.length; ) {
      const n = this.changes[this.changeCursor], i = t.length >= this.maxChangedCellsPerPack || s + n.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (t.length > 0 && i && this.appliedGaussianCount <= e.maxGaussians)
        break;
      this.applyChange(n), t.push({ nodeId: n.nodeId, lodLevel: n.lodLevel }), s += n.estimatedUploadBytes, this.changeCursor++;
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
    return Cs(e.lod, t, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.targetDirty = !1, t;
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
        Cs(e.lod, t.packing, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.changes = this.planChanges(e.lod, t.packing), this.changeCursor = 0, this.latestTargetPlanningMs = t.planningMs, this.latestTargetRoundTripMs = t.roundTripMs;
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
    for (let a = 0; a < t.nodeIds.length; a++)
      s[t.nodeIds[a]] = t.lodLevels[a];
    const n = [], i = [];
    for (let a = this.appliedCellCount - 1; a >= 0; a--) {
      const o = this.appliedNodeIds[a], l = this.appliedLodLevels[a], c = s[o];
      (c < 0 || c < l) && n.push(
        Ss(
          e,
          o,
          l,
          c < 0 ? null : c
        )
      );
    }
    for (let a = 0; a < t.nodeIds.length; a++) {
      const o = t.nodeIds[a], l = t.lodLevels[a], c = this.appliedIndices[o], u = c < 0 ? null : this.appliedLodLevels[c];
      (u === null || l > u) && i.push(Ss(e, o, u, l));
    }
    return [...n, ...i];
  }
  applyChange(e) {
    const t = this.appliedIndices[e.nodeId];
    if (e.lodLevel === null) {
      if (t < 0) return;
      const s = --this.appliedCellCount;
      if (t !== s) {
        const n = this.appliedNodeIds[s];
        this.appliedNodeIds[t] = n, this.appliedLodLevels[t] = this.appliedLodLevels[s], this.appliedIndices[n] = t;
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
function ks(r) {
  return r instanceof Js;
}
function Ss(r, e, t, s) {
  const n = r.nodes[e], i = t === null ? 0 : n.levelCounts[t], a = s === null ? 0 : n.levelCounts[s], o = Math.max(0, a - i), l = Math.max(0, i - a), c = t !== null && s !== null && t !== s ? Math.min(i, a) : 0, u = 48 + r.octree.data.shCoefficientCount * Ws + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: a - i,
    estimatedUploadBytes: Math.ceil(
      (o * u + l * 16 + c * 4) * bi
    )
  };
}
function Cs(r, e, t) {
  if (e.gaussianCount > t)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${t} Gaussians`
    );
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let n = 0;
  for (let i = 0; i < e.nodeIds.length; i++) {
    const a = e.nodeIds[i], o = e.lodLevels[i], c = r.nodes[a]?.levelCounts[o];
    if (c === void 0 || r.octree.nodes[a]?.isLeaf !== !0)
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${a} or level ${o}`
      );
    if (s.has(a))
      throw new Error(`GaussianLod packing contains duplicate node ${a}`);
    s.add(a), n += c;
  }
  if (n !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${n}`
    );
}
class vi {
  allocate({ remainingGaussians: e }) {
    return e;
  }
}
class jn {
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
function xi(r, e = 8) {
  const t = r.count, s = Uint32Array.from({ length: t }, (w, k) => k), n = [], i = [], a = [], o = [], l = [], c = [], u = [], d = [], h = [], f = [], g = [], b = [], p = (w, k) => r.sh instanceof Uint32Array ? $r(r.sh[w * r.coefficients + k]) : r.sh.subarray(
    (w * r.coefficients + k) * 4,
    (w * r.coefficients + k) * 4 + 3
  );
  function m(w) {
    const k = w * 4, x = Array.from(r.scales.subarray(k, k + 3)), S = new Us().fromArray(r.rotations, k).normalize(), G = new js().makeRotationFromQuaternion(S).elements, A = Array.from({ length: 9 }, (R, z) => {
      const L = Math.floor(z / 3), T = z % 3;
      return x.reduce(
        (W, $, B) => W + G[B * 4 + L] * G[B * 4 + T] * $ * $,
        0
      );
    });
    return {
      mean: Array.from(r.means.subarray(k, k + 3)),
      covariance: A,
      mass: Math.max(0, r.scales[k + 3]) * Ls(A),
      sh: Array.from(
        { length: r.coefficients },
        (R, z) => Array.from(p(w, z))
      ).flat()
    };
  }
  function N(w) {
    const k = w.reduce((R, z) => R + z.mass, 0), x = w.map(
      (R) => k > 0 ? R.mass / k : 1 / w.length
    ), S = [0, 1, 2].map(
      (R) => w.reduce((z, L, T) => z + L.mean[R] * x[T], 0)
    ), G = Array.from({ length: 9 }, (R, z) => {
      const L = Math.floor(z / 3), T = z % 3;
      return w.reduce(
        (W, $, B) => W + x[B] * ($.covariance[z] + ($.mean[L] - S[L]) * ($.mean[T] - S[T])),
        0
      );
    }), A = Array.from(
      { length: r.coefficients * 3 },
      (R, z) => w.reduce((L, T, W) => L + x[W] * T.sh[z], 0)
    );
    return { mean: S, covariance: G, mass: k, sh: A };
  }
  function P(w, k) {
    const x = n.length;
    n.push(-1), i.push(-1), a.push(0), o.push(0);
    const S = [1 / 0, 1 / 0, 1 / 0], G = [-1 / 0, -1 / 0, -1 / 0];
    for (let L = w; L < k; L++)
      for (let T = 0; T < 3; T++) {
        const W = r.means[s[L] * 4 + T];
        S[T] = Math.min(S[T], W), G[T] = Math.max(G[T], W);
      }
    let A, R = 0;
    if (k - w <= e && x !== 0 || k - w === 1) {
      A = N(Array.from(s.subarray(w, k), m)), a[x] = l.length, o[x] = k - w;
      for (let L = w; L < k; L++) {
        l.push(s[L]);
        const T = s[L] * 4;
        R = Math.max(
          R,
          r.scales[T],
          r.scales[T + 1],
          r.scales[T + 2]
        );
      }
      for (let L = 0; L < 3; L++)
        u[x * 6 + L] = S[L] - 3 * R, u[x * 6 + L + 3] = G[L] + 3 * R;
    } else {
      let L = 0;
      for (let B = 1; B < 3; B++)
        G[B] - S[B] > G[L] - S[L] && (L = B);
      s.subarray(w, k).sort(
        (B, le) => r.means[B * 4 + L] - r.means[le * 4 + L] || B - le
      );
      const T = w + k >>> 1;
      n[x] = P(w, T), i[x] = P(T, k), A = N([d[n[x]], d[i[x]]]);
      const W = t + h.length / 4;
      a[x] = l.length, o[x] = 1, l.push(W);
      const $ = _i(A.covariance);
      R = Math.max(...$.scales);
      for (let B = 0; B < 3; B++)
        u[x * 6 + B] = A.mean[B] - 3 * R, u[x * 6 + B + 3] = A.mean[B] + 3 * R;
      h.push(...A.mean, 0), f.push(
        ...$.scales,
        Math.min(1, A.mass / Math.max(Ls(A.covariance), 1e-30))
      ), g.push(...$.rotation);
      for (let B = 0; B < r.coefficients; B++)
        b.push(
          Mt(A.sh[B * 3], A.sh[B * 3 + 1], A.sh[B * 3 + 2])
        );
    }
    d[x] = A;
    const z = Math.hypot(...G.map((L, T) => L - S[T])) * 0.5 + Math.sqrt(
      Math.max(0, A.covariance[0] + A.covariance[4] + A.covariance[8])
    );
    return c[x * 4] = (S[0] + G[0]) * 0.5, c[x * 4 + 1] = (S[1] + G[1]) * 0.5, c[x * 4 + 2] = (S[2] + G[2]) * 0.5, c[x * 4 + 3] = z, n[x] >= 0 && (d[n[x]] = null, d[i[x]] = null), x;
  }
  P(0, t);
  const I = (w, k) => {
    const x = new Float32Array(t * 4 + k.length);
    return x.set(w.subarray(0, t * 4)), x.set(k, t * 4), x;
  }, C = new Uint32Array(t * r.coefficients + b.length);
  for (let w = 0; w < t; w++)
    for (let k = 0; k < r.coefficients; k++) {
      const x = p(w, k);
      C[w * r.coefficients + k] = Mt(x[0], x[1], x[2]);
    }
  return C.set(b, t * r.coefficients), {
    left: Int32Array.from(n),
    right: Int32Array.from(i),
    offsets: Uint32Array.from(a),
    counts: Uint32Array.from(o),
    indices: Uint32Array.from(l),
    spheres: Float32Array.from(c),
    bounds: Float32Array.from(u),
    means: I(r.means, h),
    scales: I(r.scales, f),
    rotations: I(r.rotations, g),
    sh: C
  };
}
function Ls(r) {
  return Math.sqrt(
    Math.max(
      1e-60,
      r[0] * r[4] + r[0] * r[8] + r[4] * r[8] - r[1] ** 2 - r[2] ** 2 - r[5] ** 2
    )
  );
}
function _i(r) {
  const e = r.slice(), t = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let n = 0; n < 24; n++) {
    let i = 0, a = 1;
    for (const [u, d] of [
      [0, 2],
      [1, 2]
    ])
      Math.abs(e[u * 3 + d]) > Math.abs(e[i * 3 + a]) && (i = u, a = d);
    if (Math.abs(e[i * 3 + a]) <= 1e-14 * Math.max(1e-30, Math.abs(e[0]), Math.abs(e[4]), Math.abs(e[8])))
      break;
    const o = 0.5 * Math.atan2(2 * e[i * 3 + a], e[a * 3 + a] - e[i * 3 + i]), l = Math.cos(o), c = Math.sin(o);
    for (let u = 0; u < 3; u++) {
      const d = e[u * 3 + i], h = e[u * 3 + a];
      e[u * 3 + i] = l * d - c * h, e[u * 3 + a] = c * d + l * h;
      const f = t[u * 3 + i], g = t[u * 3 + a];
      t[u * 3 + i] = l * f - c * g, t[u * 3 + a] = c * f + l * g;
    }
    for (let u = 0; u < 3; u++) {
      const d = e[i * 3 + u], h = e[a * 3 + u];
      e[i * 3 + u] = l * d - c * h, e[a * 3 + u] = c * d + l * h;
    }
  }
  const s = new js().set(
    t[0],
    t[1],
    t[2],
    0,
    t[3],
    t[4],
    t[5],
    0,
    t[6],
    t[7],
    t[8],
    0,
    0,
    0,
    0,
    1
  );
  return {
    scales: [0, 4, 8].map((n) => Math.sqrt(Math.max(1e-24, e[n]))),
    rotation: new Us().setFromRotationMatrix(s).normalize().toArray()
  };
}
class Ee extends at {
  constructor(e, t, s) {
    super(
      e,
      { levels: [{ retention: 1 }], ownsOctree: s.ownsOctree },
      !0
    ), this.tree = t, this.mergedData = new zt(
      {
        means: new de(t.means, 4),
        scalesOpacity: new de(t.scales, 4),
        rotations: new de(t.rotations, 4),
        shCoefficients: new de(t.sh, 1)
      },
      {
        count: t.means.length / 4,
        shDegree: e.data.shDegree,
        shFormat: "rgb8e8",
        ownsBuffers: !0
      }
    ), this.nodes = Array.from(
      t.counts,
      (n, i) => new It(
        i,
        t.indices.subarray(t.offsets[i], t.offsets[i] + n),
        Uint32Array.of(n)
      )
    );
  }
  tree;
  nodes;
  get data() {
    return this.mergedData;
  }
  mergedData;
  static build(e, t = {}) {
    return new Ee(
      e,
      xi(Ns(e), Ps(t)),
      t
    );
  }
  /** Builds in a worker in browsers; does not detach the caller's source buffers. */
  static async buildAsync(e, t = {}) {
    const s = Ps(t);
    if (typeof Worker > "u") return this.build(e, t);
    const n = new Worker(
      new URL(
        /* @vite-ignore */
        "" + new URL("assets/MipmapWorker-Bk0bBmzK.js", import.meta.url).href,
        import.meta.url
      ),
      { type: "module" }
    );
    try {
      const i = await new Promise((a, o) => {
        n.onerror = (c) => o(new Error(c.message)), n.onmessage = (c) => c.data.error ? o(new Error(c.data.error)) : a(c.data.tree);
        const l = Ns(e);
        n.postMessage({ source: l, leafSize: s });
      });
      return new Ee(e, i, t);
    } finally {
      n.terminate();
    }
  }
  getPackingNode(e) {
    return this.getNode(e);
  }
  getNodeBounds(e) {
    this.getNode(e);
    const t = e * 6;
    return new nt(
      new M().fromArray(this.tree.bounds, t),
      new M().fromArray(this.tree.bounds, t + 3)
    );
  }
  raycastBounds(e, t) {
    const s = this.getNodeBounds(e);
    if (t > 3) {
      const n = s.getSize(new M()).multiplyScalar((t / 3 - 1) * 0.5);
      s.expandByVector(n);
    }
    return s;
  }
  validateCut(e) {
    const t = new Set(e.nodeIds), s = (n, i) => {
      if (t.has(n)) {
        if (i)
          throw new Error(
            "Mipmap cut contains both an ancestor and its descendant"
          );
        i = !0;
      }
      this.tree.left[n] >= 0 && (s(this.tree.left[n], i), s(this.tree.right[n], i));
    };
    s(0, !1);
  }
  dispose() {
    this.mergedData.dispose(), super.dispose();
  }
}
function Ns(r) {
  const e = r.data;
  return {
    means: e.means.array,
    scales: e.scalesOpacity.array,
    rotations: e.rotations.array,
    sh: e.shCoefficients.array,
    count: e.count,
    coefficients: e.shCoefficientCount
  };
}
function Ps(r) {
  const e = r.leafSize ?? 8;
  if (!Number.isInteger(e) || e < 1 || e > 256)
    throw new RangeError("Mipmap leafSize must be an integer in [1, 256]");
  return e;
}
function wi(r, e, t) {
  const s = /* @__PURE__ */ new Set(), n = [], i = e.matrix, a = e.projection, o = Math.max(
    Math.hypot(i[0], i[1], i[2]),
    Math.hypot(i[4], i[5], i[6]),
    Math.hypot(i[8], i[9], i[10])
  ), l = Math.max(Math.abs(a[0]) * e.width, Math.abs(a[5]) * e.height) * 0.5;
  function c(g) {
    const b = g * 4, p = r.spheres, m = p[b], N = p[b + 1], P = p[b + 2], I = i[0] * m + i[4] * N + i[8] * P + i[12], C = i[1] * m + i[5] * N + i[9] * P + i[13], w = i[2] * m + i[6] * N + i[10] * P + i[14], k = p[b + 3] * o;
    return 2 * k * l / (e.perspective ? Math.max(1e-6, Math.hypot(I, C, w) - k) : 1);
  }
  function u(g, b) {
    if (r.left[g] < 0 || b <= e.pixelSize) return;
    const p = { id: g, error: b };
    let m = n.length;
    for (n.push(p); m > 0; ) {
      const N = m - 1 >>> 1;
      if (n[N].error >= b) break;
      n[m] = n[N], m = N;
    }
    n[m] = p;
  }
  function d() {
    const g = n[0], b = n.pop();
    if (n.length) {
      let p = 0;
      for (; p * 2 + 1 < n.length; ) {
        let m = p * 2 + 1;
        if (m + 1 < n.length && n[m + 1].error > n[m].error && m++, n[m].error <= b.error) break;
        n[p] = n[m], p = m;
      }
      n[p] = b;
    }
    return g;
  }
  const h = c(0);
  if (t < r.counts[0] || h < 0)
    return { nodeIds: new Uint32Array(), gaussianCount: 0 };
  let f = r.counts[0];
  for (s.add(0), u(0, h); n.length; ) {
    const { id: g } = d(), b = [r.left[g], r.right[g]].map((m) => ({ id: m, error: c(m) })).filter((m) => m.error >= 0), p = f - r.counts[g] + b.reduce((m, N) => m + r.counts[N.id], 0);
    if (!(p > t)) {
      s.delete(g), f = p;
      for (const m of b)
        s.add(m.id), u(m.id, m.error);
    }
  }
  return { nodeIds: Uint32Array.from(s).sort(), gaussianCount: f };
}
class kt {
  pixelSize;
  planningMs = 0;
  roundTripMs = 0;
  requestStarted = 0;
  get pending() {
    return this.busy || this.ready !== null;
  }
  get targetStats() {
    return {
      planningMs: this.planningMs,
      roundTripMs: this.roundTripMs,
      discardedResults: 0,
      pending: this.pending
    };
  }
  view = null;
  requestedView = "";
  worker = null;
  lod = null;
  busy = !1;
  ready = null;
  selection = null;
  budget = -1;
  requestBudget = -1;
  width = 1;
  height = 1;
  disposed = !1;
  workerError = null;
  constructor(e = {}) {
    if (this.pixelSize = e.pixelSize ?? 4, !Number.isFinite(this.pixelSize) || this.pixelSize <= 0)
      throw new RangeError("LOD pixelSize must be finite and positive");
  }
  setViewport(e, t) {
    if (!(e > 0 && t > 0 && Number.isFinite(e + t)))
      throw new RangeError("LOD viewport must be positive and finite");
    return this.width = e, this.height = t, this;
  }
  setFromCamera(e, t) {
    return e.updateWorldMatrix(!0, !1), t.updateWorldMatrix(!0, !1), this.view = {
      matrix: new Ae().copy(e.matrixWorld).invert().multiply(t.matrixWorld).toArray(),
      projection: e.projectionMatrix.toArray(),
      width: this.width,
      height: this.height,
      pixelSize: this.pixelSize,
      perspective: e.isPerspectiveCamera === !0
    }, this;
  }
  /** Poll once per frame. A completed cut is committed atomically by Store.pack(). */
  update() {
    if (this.workerError)
      throw new Error(`Mipmap LOD worker: ${this.workerError}`);
    if (this.disposed || !this.lod || !this.view) return !1;
    let e = !1;
    if (this.ready) {
      const s = this.ready;
      this.ready = null, s.gaussianCount <= this.budget && (e = !Rs(this.selection, s), this.selection = s);
    }
    const t = JSON.stringify(this.view) + ":" + this.budget;
    if (!this.busy && t !== this.requestedView)
      if (this.requestedView = t, this.requestBudget = this.budget, this.worker)
        this.busy = !0, this.requestStarted = performance.now(), this.worker.postMessage({ view: this.view, budget: this.budget });
      else {
        const s = performance.now(), n = wi(this.lod.tree, this.view, this.budget);
        this.planningMs = performance.now() - s, e ||= !Rs(this.selection, n), this.selection = n;
      }
    return e;
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ge(t), !(e instanceof Ee))
      throw new TypeError(
        "ScreenSpaceLodPackingStrategy requires GaussianMipmapLod"
      );
    if (this.lod && this.lod !== e)
      throw new Error("Use one screen-space strategy per cloud");
    if (!this.lod && (this.lod = e, typeof Worker < "u")) {
      this.worker = new Worker(
        new URL(
          /* @vite-ignore */
          "" + new URL("assets/SelectionWorker-C2NFnxa5.js", import.meta.url).href,
          import.meta.url
        ),
        { type: "module" }
      );
      const { left: s, right: n, counts: i, spheres: a } = e.tree;
      this.worker.postMessage({ tree: { left: s, right: n, counts: i, spheres: a } }), this.worker.onerror = (o) => {
        this.workerError = o.message, this.busy = !1;
      }, this.worker.onmessage = (o) => {
        if (this.busy = !1, this.roundTripMs = performance.now() - this.requestStarted, o.data.error) {
          this.workerError = o.data.error;
          return;
        }
        this.planningMs = o.data.planningMs, this.requestBudget === this.budget && (this.ready = o.data.selection);
      };
    }
    return this.budget !== t && (this.budget = t, this.requestedView = "", this.ready = null, this.selection && this.selection.gaussianCount > t && (this.selection = null)), this.selection || (this.selection = {
      nodeIds: t >= e.tree.counts[0] ? Uint32Array.of(0) : new Uint32Array(),
      gaussianCount: t >= e.tree.counts[0] ? e.tree.counts[0] : 0
    }), {
      ...this.selection,
      lodLevels: new Uint8Array(this.selection.nodeIds.length)
    };
  }
  dispose() {
    this.disposed = !0, this.worker?.terminate(), this.worker = null, this.ready = null;
  }
}
function Rs(r, e) {
  return r !== null && r.nodeIds.length === e.nodeIds.length && r.nodeIds.every((t, s) => t === e.nodeIds[s]);
}
function Xe(r, e, t) {
  if (r.length === 0) return [];
  r.sort((d, h) => d - h);
  const s = [];
  let n = r[0], i = n, a = 1;
  for (let d = 1; d <= r.length; d++) {
    const h = r[d];
    if (h !== i) {
      if (h !== void 0 && a++, h === i + 1) {
        i = h;
        continue;
      }
      s.push({ start: n, count: i - n + 1 }), h !== void 0 && (n = i = h);
    }
  }
  if (s.length < 2) return s;
  const o = Math.floor(a * t);
  let l = 0;
  const c = [];
  let u = { ...s[0] };
  for (let d = 1; d < s.length; d++) {
    const h = s[d], f = u.start + u.count, g = h.start - f;
    g <= e && l + g <= o ? (u.count = h.start + h.count - u.start, l += g) : (c.push(u), u = { ...h });
  }
  return c.push(u), c;
}
function He(r) {
  let e = 0;
  for (const t of r) e += t.count;
  return e;
}
function ne(r, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      r.addUpdateRange(
        s.start * t,
        s.count * t
      );
    r.needsUpdate = !0;
  }
}
const er = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), tr = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), sr = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class ki {
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
  [er](e) {
    this.assertUsable();
    const t = this.packedBuffer, s = new de(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [tr](e) {
    ne(this.bufferAttribute, e, 1);
  }
  [sr]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const rr = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), ir = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class Si {
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
  [rr](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const n = new ki(e, t);
    return this.attributes.set(e, n), n;
  }
  [ir]() {
    for (const e of this.attributes.values())
      e[sr]();
    this.attributes.clear();
  }
}
class Ci {
  constructor(e) {
    this.attribute = e;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(e) {
    this.writtenSlots.length = 0, this.attribute[er](new Uint32Array(e)), this.freshBuffer = !0;
  }
  backfill(e) {
    const t = this.attribute.array;
    for (const s of e.cells)
      for (const n of s.slots)
        t[n] = s.lodLevel, this.writtenSlots.push(n);
  }
  updateCell(e) {
    const { previousCell: t, cell: s, retainedCount: n } = e, i = t?.lodLevel === s.lodLevel ? n : 0, a = this.attribute.array;
    for (let o = i; o < s.slots.length; o++) {
      const l = s.slots[o];
      a[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const e = this.writtenSlots.length, t = Xe(this.writtenSlots, 16, 0.25), s = He(t);
    return this.freshBuffer || this.attribute[tr](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const Li = 16777216;
class Wn {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultScreenSpaceLod;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new Si();
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
  lastPackLimits = null;
  /** Changes only after a successful pack() replaces the shared layout. */
  layoutVersion = 0;
  constructor(e = {}) {
    this.loader = e.loader ?? new Ur(), this.budgetingStrategy = e.budgetingStrategy ?? new vi(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultScreenSpaceLod = e.defaultScreenSpaceLod ?? {}, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = Ri(
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
    const t = this.attributes[rr](
      "lodLevel",
      "u32"
    ), s = new Ci(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let n = null, i = null;
    try {
      return n = Bt.build(s, {
        ...t.octree,
        ownsData: !0
      }), i = t.mipmap !== void 0 ? await Ee.buildAsync(n, {
        ...t.mipmap,
        ownsOctree: !0
      }) : at.build(n, { ...t.lod, ownsOctree: !0 }), this.addLod(i, {
        name: t.name ?? Pi(e),
        priority: t.priority,
        packingStrategy: t.packingStrategy,
        ownsLod: !0
      });
    } catch (a) {
      throw i !== null ? i.dispose() : n !== null ? n.dispose() : s.dispose(), a;
    }
  }
  add(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), n = Lt(t.priority ?? 0), i = new _s(
      this,
      s,
      0,
      t.name,
      null,
      null,
      n
    );
    return this.entries.push({
      cloud: i,
      count: 0,
      sourceGaussianCount: e.count,
      sourceDegree: e.shDegree,
      priority: n,
      packingStrategy: null,
      ownsPackingStrategy: !1,
      lastLodFocus: new M(Number.NaN, Number.NaN, Number.NaN),
      source: e,
      ownsSource: t.ownsData ?? !1,
      lod: null,
      ownsLod: !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(i), this.invalidatePacking(), i;
  }
  addLod(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), n = Lt(t.priority ?? 0), i = new _s(
      this,
      s,
      0,
      t.name,
      e,
      null,
      n
    ), a = t.packingStrategy ?? this.defaultPackingStrategy ?? (e instanceof Ee ? new kt(this.defaultScreenSpaceLod) : Mi(this.defaultStreamingLod));
    return this.entries.push({
      cloud: i,
      count: 0,
      sourceGaussianCount: e.octree.data.count,
      sourceDegree: e.octree.data.shDegree,
      priority: n,
      packingStrategy: a,
      ownsPackingStrategy: t.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new M(Number.NaN, Number.NaN, Number.NaN),
      source: null,
      ownsSource: !1,
      lod: e,
      ownsLod: t.ownsLod ?? !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(i), this.invalidatePacking(), i;
  }
  remove(e) {
    if (this.disposed) return;
    const t = this.entries.findIndex((n) => n.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && Ms(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = Gi(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), n = performance.now(), i = this.planPackings(s), a = performance.now() - n, o = Math.min(
      s,
      this.entries.reduce((f, g) => f + g.sourceGaussianCount, 0)
    ), l = this.packedData, c = l !== null && l.count === o && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), d = c ? this.updatePackedData(i, l) : this.buildPackedData(i, o), h = performance.now() - u;
    for (const f of i)
      f.entry.count = f.count, f.entry.packing = f.packing, f.entry.allocatedBudget = f.allocatedBudget, f.entry.packingDirty = !1, f.entry.cloud.updatePacking(f.count, f.packing);
    this.packedData = d.data, this.cellSlotsByEntry = d.cellSlotsByEntry, this.freeSlots = d.freeSlots, this.gaussianCapacity = s, this.packedObjectCapacity = this.objectCapacity, this.packingInvalid = !1, this.latestPackStats = { ...d.stats, planningMs: a, slotUpdateMs: h }, this.lastPackLimits = e, c || (this.layoutVersion++, l?.dispose());
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
    const t = this.entries.find((S) => S.cloud === e);
    if (t === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    if (t.lod === null || t.packing === null || t.allocatedBudget === null)
      throw new Error("GaussianCloud is not an initialized LOD entry");
    const s = t.packingStrategy;
    if (!ks(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const n = performance.now(), i = s.takeNextBatch({
      lod: t.lod,
      maxGaussians: t.allocatedBudget
    }), a = performance.now() - n;
    if (i === null)
      return { applied: !1, pending: s.needsPack };
    const o = this.packedData, l = this.cellSlotsByEntry.get(t);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const c = performance.now(), u = l, d = this.freeSlots, h = this.scratchReleasedSlots;
    h.length = 0;
    const f = /* @__PURE__ */ new Map();
    for (const S of i.transitions) {
      const G = l.get(S.nodeId), A = S.lodLevel === null ? 0 : t.lod.nodes[S.nodeId].levelCounts[S.lodLevel], R = Math.min(
        G?.slots.length ?? 0,
        A
      );
      if (f.set(S.nodeId, {
        previousCell: G,
        retainedCount: R
      }), G !== void 0)
        for (let z = R; z < G.slots.length; z++) {
          const L = G.slots[z];
          d.push(L), h.push(L);
        }
    }
    const g = this.scratchWrittenSlots;
    g.length = 0;
    for (const S of i.transitions) {
      const G = f.get(S.nodeId), { previousCell: A, retainedCount: R } = G;
      if (S.lodLevel === null) {
        u.delete(S.nodeId);
        continue;
      }
      const z = t.lod.nodes[S.nodeId].levelCounts[S.lodLevel], L = A?.slots, T = L !== void 0 && L.length === z ? L : new Uint32Array(z);
      T !== L && L !== void 0 && R > 0 && T.set(L.subarray(0, R));
      for (let $ = R; $ < z; $++) {
        const B = d.pop();
        if (B === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, S.nodeId, $),
          B,
          o.means.array,
          o.scalesOpacity.array,
          o.rotations.array,
          o.shCoefficients.array,
          o.shCoefficientCount
        ), T[$] = B, g.push(B);
      }
      const W = {
        lodLevel: S.lodLevel,
        slots: T
      };
      for (const $ of this.attributePackers)
        $.updateCell({ previousCell: A, cell: W, retainedCount: R });
      u.set(S.nodeId, W);
    }
    const b = this.nextSlotMarkGeneration(o.count);
    for (const S of g) this.slotMarks[S] = b;
    const p = this.scratchClearedSlots;
    p.length = 0;
    for (const S of h)
      this.slotMarks[S] !== b && p.push(S);
    const m = o.scalesOpacity.array;
    for (const S of p) m[S * 4 + 3] = 0;
    const N = Xe(g, 4, 0.15), P = Xe(p, 16, 0.25);
    ne(o.means, N, 4), ne(o.scalesOpacity, N, 4), ne(o.scalesOpacity, P, 4), ne(o.rotations, N, 4), ne(
      o.shCoefficients,
      N,
      o.shCoefficientCount * o.shCoefficients.itemSize
    );
    const I = this.commitAttributePackers(), C = this.count - t.count + i.packing.gaussianCount, w = He(N), k = He(P), x = performance.now() - c;
    return t.count = i.packing.gaussianCount, t.packing = i.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = d, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: o.count,
      activeGaussians: C,
      reusedSlots: C - g.length,
      writtenSlots: g.length,
      clearedSlots: p.length,
      estimatedUploadBytes: w * Ct(o) + k * 16 + I.estimatedUploadBytes,
      writtenSlotRanges: N,
      clearedSlotRanges: P,
      planningMs: a,
      slotUpdateMs: x
    }, { applied: !0, pending: i.pending };
  }
  planPackings(e) {
    const t = [...this.entries].sort(
      (i, a) => i.priority - a.priority || i.cloud.objectId - a.cloud.objectId
    ), s = [];
    let n = 0;
    for (const i of t) {
      const a = Math.max(0, e - n), o = this.budgetingStrategy.allocate({
        capacity: e,
        allocatedGaussians: n,
        remainingGaussians: a,
        entry: {
          cloud: i.cloud,
          priority: i.priority,
          insertionIndex: i.cloud.objectId,
          sourceGaussianCount: i.sourceGaussianCount
        }
      });
      if (Ii(o, a), i.lod === null) {
        if (i.sourceGaussianCount > o)
          throw new RangeError(
            `${i.cloud.name} requires ${i.sourceGaussianCount} Gaussians but its Store allocation is ${o}`
          );
        s.push({
          entry: i,
          count: i.sourceGaussianCount,
          packing: null,
          allocatedBudget: o,
          selectionChanged: i.packingDirty || i.allocatedBudget !== o
        }), n += i.sourceGaussianCount;
        continue;
      }
      const l = i.packingStrategy, c = i.packingDirty || i.allocatedBudget !== o || i.packing === null, u = !c && i.packing !== null ? i.packing : l.pack({
        lod: i.lod,
        maxGaussians: o
      });
      if (u.gaussianCount > o)
        throw new RangeError(
          `${l.constructor.name} exceeded its allocation of ${o} Gaussians`
        );
      Ai(i.lod, u), s.push({
        entry: i,
        count: u.gaussianCount,
        packing: u,
        allocatedBudget: o,
        selectionChanged: c
      }), n += u.gaussianCount;
    }
    return s;
  }
  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(e, t) {
    this.assertUsable();
    const s = this.entries.find((i) => i.cloud === e);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const n = Lt(t);
    s.priority = n, e.updatePackingPriority(n), this.invalidatePacking();
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
   * Update camera-relative LODs. Mipmap cuts commit atomically; legacy
   * streaming applies one bounded batch per cloud. Viewport dimensions are
   * physical pixels. GaussianPass calls this automatically.
   */
  updateLod(e, t = 1, s = 1) {
    if (this.assertUsable(), this.packingInvalid || this.packedData === null)
      return { appliedBatches: 0, pending: !1, clouds: [] };
    const n = /* @__PURE__ */ new Set();
    for (const u of this.entries)
      u.packingStrategy instanceof kt && (u.packingStrategy.setViewport(t, s).setFromCamera(e, u.cloud), u.packingStrategy.update() && (n.add(u), this.invalidateCloudPacking(u.cloud)));
    n.size && this.lastPackLimits && this.pack({ limits: this.lastPackLimits }), e.updateWorldMatrix(!0, !1);
    const i = new M(), a = new M();
    let o = n.size, l = !1;
    const c = [];
    for (const u of this.entries) {
      const d = u.packingStrategy;
      if (u.lod && d instanceof kt) {
        e.getWorldPosition(i), u.cloud.worldToLocal(i), u.lod.octree.rootBounds.getCenter(a), l ||= d.pending, c.push({
          cloud: u.cloud,
          focusDistance: i.distanceTo(a),
          applied: n.has(u),
          pending: d.pending,
          targetStats: d.targetStats
        });
        continue;
      }
      if (u.lod === null || d === null || !ks(d))
        continue;
      u.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(i), u.cloud.worldToLocal(i);
      const h = u.lod.octree.rootBounds.getSize(new M()).length() * 0.5, f = Math.max(0.05, h * 0.025);
      (!Number.isFinite(u.lastLodFocus.x) || i.distanceToSquared(u.lastLodFocus) >= f * f) && (d.setFromCamera(e, u.cloud), u.lastLodFocus.copy(i));
      let g = !1;
      d.needsPack && (g = this.packLodBatch(u.cloud).applied, g && o++);
      const b = d.needsPack;
      l ||= b, u.lod.octree.rootBounds.getCenter(a), c.push({
        cloud: u.cloud,
        focusDistance: i.distanceTo(a),
        applied: g,
        pending: b,
        targetStats: d.targetStats
      });
    }
    return { appliedBatches: o, pending: l, clouds: c };
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
        e.source !== null && e.ownsSource && e.source.dispose(), e.lod !== null && e.ownsLod && e.lod.dispose(), e.ownsPackingStrategy && Ms(e.packingStrategy), e.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[ir](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(e, t) {
    const s = this.shDegree, n = (s + 1) ** 2, i = new Float32Array(t * 4), a = new Float32Array(t * 4), o = new Float32Array(t * 4), l = new Uint32Array(t * n), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const b of e) {
      const { entry: p } = b, m = /* @__PURE__ */ new Map();
      for (const N of this.plannedCells(b)) {
        const P = new Uint32Array(N.count);
        for (let I = 0; I < N.count; I++) {
          const C = this.cellSourceIndex(p, N.nodeId, I);
          this.copySourceToSlot(
            p,
            C,
            u,
            i,
            a,
            o,
            l,
            n
          ), P[I] = u++;
        }
        m.set(N.nodeId, {
          lodLevel: N.lodLevel,
          slots: P
        });
      }
      c.set(p, m);
    }
    const d = Array.from(
      { length: t - u },
      (b, p) => t - 1 - p
    ), h = new zt(
      {
        means: st("3dgs.store.means-object", i),
        scalesOpacity: st("3dgs.store.scales-opacity", a),
        rotations: st("3dgs.store.rotations", o),
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
    for (const b of this.attributePackers)
      b.allocate(t), b.backfill({ cells: f });
    const g = this.commitAttributePackers();
    return {
      data: h,
      cellSlotsByEntry: c,
      freeSlots: d,
      stats: {
        fullRebuild: !0,
        slotCapacity: t,
        activeGaussians: u,
        reusedSlots: 0,
        writtenSlots: u,
        clearedSlots: 0,
        estimatedUploadBytes: u * Ct(h) + g.estimatedUploadBytes,
        writtenSlotRanges: u === 0 ? [] : [{ start: 0, count: u }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(e, t) {
    const s = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
    let i = 0;
    for (const C of e) {
      if (n.add(C.entry), i += C.count, !C.selectionChanged) continue;
      const w = /* @__PURE__ */ new Map();
      for (const k of this.plannedCells(C))
        w.set(k.nodeId, k);
      s.set(C.entry, w);
    }
    const a = [...this.freeSlots], o = this.scratchReleasedSlots;
    o.length = 0;
    for (const [C, w] of this.cellSlotsByEntry) {
      const k = s.get(C);
      if (!(k === void 0 && n.has(C)))
        for (const [x, S] of w) {
          const G = S.slots, A = Math.min(
            G.length,
            k?.get(x)?.count ?? 0
          );
          for (let R = A; R < G.length; R++) {
            const z = G[R];
            a.push(z), o.push(z);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), c = this.scratchWrittenSlots;
    c.length = 0;
    let u = 0;
    for (const C of e) {
      const w = this.cellSlotsByEntry.get(C.entry);
      if (!C.selectionChanged && w !== void 0) {
        l.set(C.entry, w), u += C.count;
        continue;
      }
      const k = /* @__PURE__ */ new Map();
      for (const x of s.get(C.entry)?.values() ?? []) {
        const S = w?.get(x.nodeId), G = S?.slots, A = Math.min(G?.length ?? 0, x.count), R = G !== void 0 && G.length === x.count ? G : new Uint32Array(x.count);
        R !== G && G !== void 0 && A > 0 && R.set(G.subarray(0, A)), u += A;
        for (let L = A; L < x.count; L++) {
          const T = a.pop();
          if (T === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            C.entry,
            this.cellSourceIndex(C.entry, x.nodeId, L),
            T,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), R[L] = T, c.push(T);
        }
        const z = {
          lodLevel: x.lodLevel,
          slots: R
        };
        for (const L of this.attributePackers)
          L.updateCell({
            previousCell: S,
            cell: z,
            retainedCount: A
          });
        k.set(x.nodeId, z);
      }
      l.set(C.entry, k);
    }
    const d = this.nextSlotMarkGeneration(t.count);
    for (const C of c) this.slotMarks[C] = d;
    const h = this.scratchClearedSlots;
    h.length = 0;
    for (const C of o)
      this.slotMarks[C] !== d && h.push(C);
    const f = t.scalesOpacity.array;
    for (const C of h) f[C * 4 + 3] = 0;
    const g = c.length, b = h.length, p = Xe(c, 4, 0.15), m = Xe(h, 16, 0.25);
    ne(t.means, p, 4), ne(t.scalesOpacity, p, 4), ne(t.scalesOpacity, m, 4), ne(t.rotations, p, 4), ne(
      t.shCoefficients,
      p,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const N = this.commitAttributePackers(), P = He(p), I = He(m);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: a,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: i,
        reusedSlots: u,
        writtenSlots: g,
        clearedSlots: b,
        estimatedUploadBytes: P * Ct(t) + I * 16 + N.estimatedUploadBytes,
        writtenSlotRanges: p,
        clearedSlotRanges: m,
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
      for (const n of s.values())
        t.push(n);
    return t;
  }
  commitAttributePackers() {
    let e = 0, t = 0, s = 0;
    const n = [];
    for (const i of this.attributePackers) {
      const a = i.commit();
      e += a.writtenSlots, t += a.uploadedSlots, s += a.estimatedUploadBytes, n.push(...a.slotRanges);
    }
    return { writtenSlots: e, uploadedSlots: t, estimatedUploadBytes: s, slotRanges: n };
  }
  cellSourceIndex(e, t, s) {
    return e.lod === null ? s : e.lod.nodes[t].sortedGaussianIndices[s];
  }
  copySourceToSlot(e, t, s, n, i, a, o, l) {
    const c = e.lod?.data ?? e.source;
    if (c === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    St(c.means.array, t, n, s), St(
      c.scalesOpacity.array,
      t,
      i,
      s
    ), St(
      c.rotations.array,
      t,
      a,
      s
    ), n[s * 4 + 3] = e.cloud.objectId, Ni(
      c,
      t,
      o,
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
    if (e >= Li)
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
function st(r, e, t = 4) {
  const s = new de(e, t);
  return s.name = r, s;
}
function St(r, e, t, s) {
  t.set(
    r.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function Ni(r, e, t, s, n) {
  const i = r.shCoefficientCount, a = Math.min(
    i,
    n
  ), o = s * n;
  if (t.fill(
    0,
    o,
    o + n
  ), r.shFormat === "rgb8e8") {
    const u = e * i;
    t.set(
      r.shCoefficients.array.subarray(
        u,
        u + a
      ),
      o
    );
    return;
  }
  const l = r.shCoefficients.array, c = e * i * 4;
  for (let u = 0; u < a; u++) {
    const d = c + u * 4;
    t[o + u] = Mt(
      l[d],
      l[d + 1],
      l[d + 2]
    );
  }
}
function Ct(r) {
  return 48 + r.shCoefficientCount * Fs(r.shFormat);
}
function Pi(r) {
  const e = r.split(/[?#]/, 1)[0] ?? r;
  return e.slice(e.lastIndexOf("/") + 1) || "GaussianCloud";
}
function Lt(r) {
  if (!Number.isSafeInteger(r))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return r;
}
function Ri(r) {
  if (r !== "auto" && (!Number.isSafeInteger(r) || r <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return r;
}
function Mi(r) {
  const e = new ai();
  return new Js(e, {
    ...r,
    targetPlanner: new pi(e)
  });
}
function Ms(r) {
  r !== null && "dispose" in r && typeof r.dispose == "function" && r.dispose();
}
function Ii(r, e) {
  if (!Number.isSafeInteger(r) || r < 0 || r > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function Ai(r, e) {
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  r.validateCut(e);
  const t = /* @__PURE__ */ new Set();
  let s = 0;
  for (let n = 0; n < e.nodeIds.length; n++) {
    const i = e.nodeIds[n], a = r.getPackingNode(i), o = e.lodLevels[n], l = a?.levelCounts[o];
    if (l === void 0)
      throw new RangeError(
        `GaussianLod packing references invalid node ${i} or level ${o}`
      );
    if (t.has(i))
      throw new Error(`GaussianLod packing contains duplicate node ${i}`);
    t.add(i), s += l;
  }
  if (s !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${s}`
    );
}
function Gi(r, e) {
  const t = Is(
    r.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Is(r.maxBufferSize, "maxBufferSize"), n = Math.max(
    16,
    (e + 1) ** 2 * Fs("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / n);
}
function Is(r, e) {
  if (!Number.isSafeInteger(r) || r <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return r;
}
const j = 16, _ = 256, Ti = 8192, V = 512, At = 4, O = 1 << At, ae = 4, he = _ * ae, J = he, oe = 32, zi = (
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
), Bi = (
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
), Oi = (
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
function nr(r, e) {
  return Math.max(1, Math.ceil(2 * r / e));
}
function Ei(r, e) {
  if (r !== null) {
    if (!Number.isInteger(r) || r < _ || r % _ !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${_} and at least ${_}`
      );
    if (nr(e, r) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const $i = (
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
  let radix_blocks = (count + ${he - 1}u) / ${he}u;
  let reduce_chunks = (radix_blocks + ${J - 1}u) / ${J}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${O}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${_ - 1}u) / ${_}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Di(r) {
  return (
    /* wgsl */
    `
fn compact_visible_${r}(
  gid: u32,
  gaussian_count: u32,
  viewport: vec4<f32>,
  visible_offsets: ptr<storage, array<u32>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (gid >= gaussian_count || (*projected_mean)[gid].w <= 0.0) { return 0u; }
  let depth = (*projected_mean)[gid].z;
  (*records)[(*visible_offsets)[gid]] = vec2<u32>(${r === "float32" ? "bitcast<u32>(depth)" : `u32(round(clamp(
          (depth - viewport.z) / (viewport.w - viewport.z),
          0.0,
          1.0
        ) * 65535.0))`}, gid);
  return 0u;
}
`
  );
}
const Ui = (
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
class pe {
  attributes = [];
  createFloat(e, t, s = 4) {
    return this.track(
      e,
      new de(new Float32Array(t * s), s)
    );
  }
  createUint(e, t, s = 1) {
    return this.track(
      e,
      new de(new Uint32Array(t * s), s)
    );
  }
  createIndirect(e) {
    return this.track(
      e,
      new Cr(new Uint32Array(4), 4)
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
class ji {
  constructor(e, t, s, n, i) {
    this.renderer = e, this.visibleDispatch = i, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const a = U(
      Ui
    );
    this.computeNode = a({
      rank: se,
      state: v(i.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: v(
        n,
        "uvec2",
        t
      ).toReadOnly(),
      tile_counts: v(
        s,
        "uint",
        t
      ).toReadOnly(),
      ordered_tile_counts: v(this.tileCounts, "uint", t)
    }).computeKernel([_]).setName("3DGS gather depth-ordered tile counts WGSL");
  }
  renderer;
  visibleDispatch;
  tileCounts;
  attributes = new pe();
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function ar(r) {
  return (
    /* wgsl */
    `
fn ${r.functionName}(
  lane: u32,
  group_id: u32,
  length: u32,
  input_values: ptr<storage, array<${r.inputType}>, read>,
  output_values: ptr<storage, array<u32>, read_write>,
  block_sums: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${V}>>
) -> u32 {
  let base = group_id * ${V}u;
  let first = base + lane;
  let second = first + ${_}u;
  (*scratch)[lane] = ${r.readValue("first")};
  (*scratch)[lane + ${_}u] = ${r.readValue("second")};
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${V / 2}u;
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
    (*block_sums)[group_id] = (*scratch)[${V - 1}u];
    (*scratch)[${V - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${V / 2}u;
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
const Wi = ar({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (r) => `select(0u, (*input_values)[${r}], ${r} < length)`
}), Fi = ar({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (r) => `select(0u, 1u, ${r} < length && (*input_values)[${r}].w > 0.0)`
}), Vi = (
  /* wgsl */
  `
fn add_scan_offsets(
  index: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    (*values)[index] += (*block_offsets)[index / ${V}u];
  }
  return 0u;
}
`
);
class Gt {
  output;
  attributes = new pe();
  levels = [];
  constructor(e, t, s = "intersections", n = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const i = U(Wi), a = U(
      Fi
    ), o = U(Vi);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const d = Math.ceil(u / V), h = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        d
      ), f = K("uint", V), g = this.levels.length === 0 && n === "projectedVisibility", b = (g ? a : i)({
        lane: ke,
        group_id: Q.x,
        length: y(u),
        input_values: v(
          l,
          g ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: v(c, "uint", u),
        block_sums: v(h, "uint", d),
        scratch: f
      }).computeKernel([_]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
      if (this.levels.push({
        length: u,
        blockCount: d,
        output: c,
        scanNode: b
      }), d <= 1) break;
      l = h, u = d, c = this.attributes.createUint(
        `3dgs.${s}-scan-offsets-${this.levels.length}`,
        u
      );
    }
    for (let d = 0; d < this.levels.length - 1; d++) {
      const h = this.levels[d], f = this.levels[d + 1];
      h.addNode = o({
        index: se,
        length: y(h.length),
        values: v(h.output, "uint", h.length),
        block_offsets: v(
          f.output,
          "uint",
          f.length
        ).toReadOnly()
      }).compute(h.length, [_]).setName(`3DGS ${s} add scan offsets WGSL ${d}`);
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
class qi {
  constructor(e, t) {
    this.camera = e, this.background = t;
  }
  camera;
  background;
  projection = Ve(new Ae());
  view = Ve(new Ae());
  viewport = Ve(new Lr());
  tilesX = Ve(1, "uint");
  tilesY = Ve(1, "uint");
  update(e, t, s, n) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = n;
  }
}
function or(r) {
  const { center: e, conic: t, powerThreshold: s, tileX: n, tileY: i, onHit: a } = r;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${n}), f32(${i})) * ${j}.0;
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
        ${a}
      }`
  );
}
const Ki = (
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
  let radix_blocks = (count + ${he - 1}u) / ${he}u;
  let reduce_chunks = (radix_blocks + ${J - 1}u) / ${J}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${O}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${_ - 1}u) / ${_}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), Yi = (() => {
  const r = or({
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
${r}
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
class Xi {
  constructor(e, t, s, n, i, a, o, l, c, u, d) {
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
    const h = v(
      a,
      "uint",
      t
    ).toReadOnly(), f = v(
      o,
      "uint",
      t
    ).toReadOnly(), g = v(
      i.state,
      "uvec4",
      1
    ).toReadOnly(), b = U(Ki);
    this.prepareNode = b({
      item_count_state: g,
      capacity: y(s),
      tile_counts: h,
      intersection_offsets: f,
      state: v(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: v(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: v(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: v(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const p = U(Yi);
    this.emitNode = p({
      rank: se,
      tiles: Je(d.tilesX, d.tilesY),
      capacity: y(s),
      sorted_gaussians: v(
        n,
        "uvec2",
        t
      ).toReadOnly(),
      projected_mean: v(
        l,
        "vec4",
        t
      ).toReadOnly(),
      projected_conic: v(
        c,
        "vec4",
        t
      ).toReadOnly(),
      projected_color: v(
        u,
        "vec4",
        t
      ).toReadOnly(),
      tile_counts: h,
      intersection_offsets: f,
      visible_state: g,
      records: v(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([_]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = i;
  }
  renderer;
  capacity;
  buffers;
  dispatch;
  attributes = new pe();
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
const Tt = 10;
class Hi {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * Tt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new de(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Ae();
  inverseModel = new Ae();
  cameraWorldPosition = new M();
  cameraLocalPosition = new M();
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
    const t = this.frameComponentOffset + e.objectId * Tt * 4;
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = Zi(e, this.camera) ? 1 : 0;
  }
}
function Zi(r, e) {
  if (!r.layers.test(e.layers)) return !1;
  let t = r, s = r;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof $s;
}
function Qi(r) {
  return (
    /* wgsl */
    `
fn project_gaussian_covariance_${r}(
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
  let original_determinant = ${r === "compensated" ? "max(sigma00_unfiltered * sigma11_unfiltered - sigma01 * sigma01, 0.0)" : "1.0"};
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
function Ji(r) {
  const e = r === "rgb8e8" ? "u32" : "vec4<f32>", t = r === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (n) => {
    const i = n === 0 ? "base" : `base + ${n}u`;
    return r === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${i}])` : `(*sh_coefficients)[${i}].xyz`;
  };
  return (
    /* wgsl */
    `
fn evaluate_gaussian_sh_${r}(
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
const en = (
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
function tn() {
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
${or({
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
const lr = /* @__PURE__ */ new Set([
  Ot,
  Et,
  ot,
  lt,
  ct,
  ut,
  Dt,
  Ut
]), cr = /* @__PURE__ */ new Set([
  ...lr,
  et,
  jt
]), sn = /* @__PURE__ */ new Set([
  ...cr,
  Wt,
  Ft,
  Vt,
  qt
]);
class rn {
  constructor(e, t, s, n, i, a = !0) {
    this.data = e, this.frame = t, this.antialiasMode = n, this.subpixelSampleCulling = a, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      e.count
    ), this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      e.count
    ), this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      e.count
    ), this.rebuild(i);
  }
  data;
  frame;
  antialiasMode;
  subpixelSampleCulling;
  projectedMean;
  projectedConic;
  projectedColor;
  tileCounts;
  attributes = new pe();
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
      Zs(s, Qe, "projection");
    Ie(
      e.gaussianPositionLocalNode,
      lr,
      "gaussianPositionLocalNode"
    );
    for (const [s, n] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      Ie(n, cr, s);
    Ie(
      e.gaussianOpacityNode,
      sn,
      "gaussianOpacityNode"
    ), Ie(
      e.gaussianColorNode,
      Qe,
      "gaussianColorNode"
    ), Ie(
      e.gaussianVisibilityNode,
      Qe,
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
    const { data: t, frame: s } = this, n = v(t.means, "vec4", t.count).toReadOnly(), i = v(
      t.scalesOpacity,
      "vec4",
      t.count
    ).toReadOnly(), a = v(t.rotations, "vec4", t.count).toReadOnly(), o = t.shFormat === "rgb8e8" ? v(
      t.shCoefficients,
      "uint",
      t.count * t.shCoefficientCount
    ).toReadOnly() : v(
      t.shCoefficients,
      "vec4",
      t.count * t.shCoefficientCount
    ).toReadOnly(), l = v(
      this.projectedMean,
      "vec4",
      this.projectedMean.count
    ), c = v(this.projectedConic, "vec4", t.count), u = v(this.projectedColor, "vec4", t.count), d = v(this.tileCounts, "uint", t.count), h = U(
      Qi(this.antialiasMode)
    ), f = U(Ji(t.shFormat)), g = U(tn()), b = U(en);
    return rt(() => {
      const m = y(se);
      D(m.greaterThanEqual(y(t.count)), () => {
        ge();
      }), d.element(m).assign(y(0)), l.element(m).assign(te(0));
      const N = n.element(m), P = N.xyz, I = y(N.w), C = i.element(m), w = C.xyz, k = C.w, x = a.element(m), S = y(t.count).add(
        I.mul(y(Tt))
      ), G = ps(
        l.element(S),
        l.element(S.add(1)),
        l.element(S.add(2)),
        l.element(S.add(3))
      ), A = ps(
        l.element(S.add(4)),
        l.element(S.add(5)),
        l.element(S.add(6)),
        l.element(S.add(7))
      ), R = l.element(S.add(8)).xyz, z = l.element(S.add(9)).x.greaterThan(0);
      D(z.not(), () => {
        ge();
      });
      const L = /* @__PURE__ */ new Map([
        [Ot, () => m],
        [Et, () => I],
        [ot, () => P],
        [lt, () => w],
        [ct, () => x],
        [ut, () => k],
        [Dt, () => G],
        [Ut, () => z]
      ]), T = Re(
        e.gaussianPositionLocalNode,
        L
      ).toVar("gaussianPositionLocalValue"), W = G.mul(te(T, 1)).xyz, $ = new Map(L);
      $.set(et, () => W);
      const B = Tr(T.sub(R));
      $.set(jt, () => B);
      let le;
      if (e.gaussianPositionWorldNode === et)
        le = A.mul(te(T, 1));
      else {
        const ve = Re(
          e.gaussianPositionWorldNode,
          $
        ).toVar("gaussianPositionWorldValue");
        le = s.view.mul(te(ve, 1));
      }
      le = le.toVar("gaussianViewPosition");
      const Se = Re(e.gaussianScaleNode, $).toVar(
        "gaussianScaleValue"
      ), fe = Re(
        e.gaussianRotationNode,
        $
      ).toVar("gaussianRotationValue"), re = h({
        view: le,
        scale_input: Se,
        rotation_input: fe,
        model_view: A,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      D(re.element(0).w.lessThanEqual(0), () => {
        ge();
      });
      const X = re.element(0).xy, Ce = re.element(0).z, Te = re.element(1).xyz, $e = re.element(1).w, Le = re.element(2).xyz, me = re.element(2).w, ce = new Map($);
      ce.set(Wt, () => Ce), ce.set(Ft, () => X), ce.set(Vt, () => Me(Le.xz)), ce.set(
        qt,
        () => Me($e).mul(Math.PI)
      );
      const De = Re(
        e.gaussianOpacityNode,
        ce
      ).clamp(0, 1), ye = this.antialiasMode === "compensated" ? De.mul(
        Me(we(me.div($e), 0, 1))
      ) : De;
      D(ye.lessThan(q(1 / 255)), () => {
        ge();
      });
      const Ne = zr(ye.mul(255)), Ue = Me(
        Ne.mul(2).mul(we(Le.x, 1e-12, 1e4))
      ), F = Me(
        Ne.mul(2).mul(we(Le.z, 1e-12, 1e4))
      ), Pe = fs(Ue), je = fs(F);
      D(Pe.lessThanEqual(0).or(je.lessThanEqual(0)), () => {
        ge();
      });
      const We = _e(Pe, je), ze = X.sub(We), Be = X.add(We);
      if (D(
        Be.x.lessThan(0).or(Be.y.lessThan(0)).or(ze.x.greaterThanEqual(s.viewport.x)).or(ze.y.greaterThanEqual(s.viewport.y)),
        () => {
          ge();
        }
      ), this.subpixelSampleCulling) {
        const ve = b({
          center: X,
          conic: Te,
          power_threshold: Ne,
          extent: _e(Ue, F),
          viewport: Je(s.viewport.xy)
        });
        D(ve.not(), () => {
          l.element(m).assign(te(X, Ce, -1)), ge();
        });
      }
      const H = Ze(gs(s.tilesX), gs(s.tilesY)).sub(1), ee = Ze(
        we(Pt(ze.div(q(j))), _e(0), _e(H))
      ), ie = Ze(
        we(Pt(Be.div(q(j))), _e(0), _e(H))
      ), Z = f({
        gid: m,
        sh_degree: y(t.shDegree),
        direction: B,
        sh_coefficients: o
      }), Y = new Map(ce);
      Y.set($t, () => Z), Y.set(Vs, () => ze), Y.set(qs, () => Be);
      const ht = Re(
        e.gaussianVisibilityNode,
        Y
      );
      D(ht.not(), () => {
        ge();
      });
      const Fe = g({
        center: X,
        conic: Te,
        power_threshold: Ne,
        tile_min: ee,
        tile_max: ie
      });
      D(Fe.equal(0), () => {
        ge();
      });
      const be = Re(
        e.gaussianColorNode,
        Y
      ).clamp(0, 1);
      l.element(m).assign(te(X, Ce, ye)), c.element(m).assign(te(Te, Pe)), u.element(m).assign(te(be, je)), d.element(m).assign(Fe);
    })().compute(t.count, [_]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Re(r, e) {
  return r.context({ overrideNodes: e });
}
const nn = (
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
), an = _, ur = 256, on = [2048, 4096, 8192];
function ln(r) {
  const e = Math.max(0, r.length - 1);
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
  let s = 0, n = 0, i = 0, a = 0, o = 0, l = 0, c = 0, u = 0;
  for (let d = 0; d < e; d++) {
    const h = Math.max(0, r[d + 1] - r[d]);
    t[d] = h, s += h, n = Math.max(n, h), h > 256 && i++, h > 512 && a++, h > 1024 && o++, h > 2048 && l++;
    const f = Math.ceil(h / ur);
    c += f, u = Math.max(u, f);
  }
  return t.sort(), {
    max: n,
    mean: s / e,
    median: cn(t),
    p95: Gs(t, 0.95),
    p99: Gs(t, 0.99),
    tilesOver256: i,
    tilesOver512: a,
    tilesOver1024: o,
    tilesOver2048: l,
    totalBatches: c,
    maxBatches: u
  };
}
function As(r, e) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const t = Math.max(0, r.length - 1);
  let s = 0, n = 0, i = 0, a = 0, o = 0;
  for (let c = 0; c < t; c++) {
    const u = Math.max(0, r[c + 1] - r[c]), d = Math.min(u, e), h = u - d;
    s += d, n += h, h > 0 && i++;
    const f = Math.ceil(d / ur);
    a += f, o = Math.max(o, f);
  }
  const l = s + n;
  return {
    cap: e,
    rasterizedIntersections: s,
    droppedIntersections: n,
    droppedFraction: l === 0 ? 0 : n / l,
    affectedTiles: i,
    totalBatches: a,
    maxBatches: o
  };
}
function cn(r) {
  const e = Math.floor(r.length / 2);
  return r.length % 2 !== 0 ? r[e] : (r[e - 1] + r[e]) * 0.5;
}
function Gs(r, e) {
  const t = Math.max(0, Math.ceil(r.length * e) - 1);
  return r[t];
}
class un {
  constructor(e, t, s, n, i, a) {
    this.renderer = e, this.maxRasterizedSplatsPerTile = a, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const o = U(nn);
    this.computeNode = o({
      index: se,
      gaussian_count: y(t),
      viewport: Je(i.viewport.xy),
      projected_mean: v(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: v(
        n,
        "vec4",
        n.count
      ).toReadOnly(),
      zero_pixel_flags: v(this.zeroPixelFlags, "uint", t)
    }).compute(t, [an]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
  attributes = new pe();
  zeroPixelFlags;
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode);
  }
  async readStats(e) {
    const [t, s] = await Promise.all([
      this.renderer.getArrayBufferAsync(e),
      this.renderer.getArrayBufferAsync(this.zeroPixelFlags)
    ]), n = new Uint32Array(s);
    let i = 0;
    for (const o of n) i += o;
    const a = new Uint32Array(t);
    return {
      tileLoads: ln(a),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : As(a, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: on.map(
        (o) => As(a, o)
      ),
      zeroPixelSubpixelSplats: i
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function dn(r) {
  return (
    /* wgsl */
    `
fn radix_histogram_${r}(
  lane: u32,
  block_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  partials: ptr<workgroup, array<u32, ${O * oe}>>
) -> u32 {
  let block_start = block_index * ${he}u;
  let count = (*state)[0].x;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${O}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${ae}u; item++) {
      let position = block_start + item * ${_}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${r}u) & ${O - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${oe}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${O}u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[lane * ${oe}u + subgroup];
    }
    (*block_histograms)[lane * block_stride + block_index] = total;
  }
  return 0u;
}
`
  );
}
const hn = (
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
  partials: ptr<workgroup, array<u32, ${oe}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${J}u;
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
), pn = (
  /* wgsl */
  `
fn scan_radix_reduced(
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  reduced: ptr<storage, array<u32>, read_write>
) -> u32 {
  let chunk_count = ((*state)[0].z + ${J - 1}u) /
    ${J}u;
  var running = 0u;
  for (var digit = 0u; digit < ${O}u; digit++) {
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
), fn = (
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
  scratch: ptr<workgroup, array<u32, ${J}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${J}u;
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
  var active_count = ${J / 2}u;
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
  if (lane == 0u) { (*scratch)[${J - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${J / 2}u;
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
function gn(r) {
  return (
    /* wgsl */
    `
fn radix_scatter_${r}(
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
  block_bases: ptr<workgroup, array<u32, ${O}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${O}>>,
  partials: ptr<workgroup, array<u32, ${O * oe}>>
) -> u32 {
  let block_start = block_index * ${he}u;
  let count = (*state)[0].x;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${O}u) {
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
      digit = (record.x >> ${r}u) & ${O - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${O}u; target_digit++) {
      let matches = select(0u, 1u, valid && digit == target_digit);
      let prefix = subgroupExclusiveAdd(matches);
      let total = subgroupAdd(matches);
      if (subgroup_lane == 0u) {
        (*partials)[target_digit * ${oe}u + subgroup_index] = total;
      }
      if (digit == target_digit) { subgroup_prefix = prefix; }
    }
    workgroupBarrier();

    if (valid) {
      var preceding_subgroups = 0u;
      for (var subgroup = 0u; subgroup < subgroup_index; subgroup++) {
        preceding_subgroups += (*partials)[digit * ${oe}u + subgroup];
      }
      let destination = (*block_bases)[digit]
        + (*local_digit_counts)[digit]
        + preceding_subgroups
        + subgroup_prefix;
      (*records_out)[destination] = record;
    }
    workgroupBarrier();

    if (lane < ${O}u) {
      var batch_total = 0u;
      for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
        batch_total += (*partials)[lane * ${oe}u + subgroup];
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
function mn(r) {
  return (
    /* wgsl */
    `
fn radix_workgroup_histogram_${r}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  histogram: ptr<workgroup, array<atomic<u32>, ${O}>>
) -> u32 {
  if (lane < ${O}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${he}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${_}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${r}u) & ${O - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${O}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`
  );
}
const yn = (
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
  let chunk_start = chunk * ${J}u;
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
function bn(r) {
  return (
    /* wgsl */
    `
fn radix_workgroup_scatter_${r}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<vec2<u32>>, read>,
  records_out: ptr<storage, array<vec2<u32>>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  block_bases: ptr<workgroup, array<u32, ${O}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${O}>>,
  shared_digits: ptr<workgroup, array<u32, ${_}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${O * (_ / 32)}>>
) -> u32 {
  let block_start = block_index * ${he}u;
  let count = (*state)[0].x;
  let words_per_digit = ${_ / 32}u;
  if (lane < ${O}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ae}u; item++) {
    let position = block_start + item * ${_}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${O}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${r}u) & ${O - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${O * (_ / 32)}u) {
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

    if (lane < ${O}u) {
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
class Ts {
  constructor(e, t, s, n, i, a) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = n, this.dispatch = i, this.backend = a, this.maxRadixBlocks = Math.ceil(s / he), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / J), this.blockHistograms = this.attributes.createUint(
      `3dgs.${t}-radix-histograms`,
      this.maxRadixBlocks * O
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${t}-radix-prefixes`,
      this.maxRadixBlocks * O
    ), this.reduced = this.attributes.createUint(
      `3dgs.${t}-radix-reduced`,
      this.maxReduceChunks * O
    );
    const o = v(i.state, "uvec4", 1).toReadOnly(), l = v(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), c = U(
      a === "subgroup" ? hn : yn
    ), u = {
      lane: ke,
      group_id: Q,
      block_stride: y(this.maxRadixBlocks),
      chunk_stride: y(this.maxReduceChunks),
      state: o,
      block_histograms: l,
      reduced: v(this.reduced, "uint", this.reduced.count)
    };
    a === "subgroup" ? (u.subgroup_index = mt, u.subgroup_lane = yt, u.subgroup_size = bt, u.partials = K("uint", oe)) : u.scratch = K("uint", _), this.reduceNode = c(u).computeKernel([_]).setName(`3DGS ${t} radix reduce WGSL`);
    const d = U(pn);
    this.scanReducedNode = d({
      chunk_stride: y(this.maxReduceChunks),
      state: o,
      reduced: v(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const h = U(
      fn
    );
    this.scanAddNode = h({
      lane: ke,
      group_id: Q,
      block_stride: y(this.maxRadixBlocks),
      chunk_stride: y(this.maxReduceChunks),
      state: o,
      block_histograms: l,
      reduced: v(this.reduced, "uint", this.reduced.count).toReadOnly(),
      block_prefixes: v(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ),
      scratch: K("uint", J)
    }).computeKernel([_]).setName(`3DGS ${t} radix scan-add WGSL`), this.sortedRecords = n.recordsA;
  }
  renderer;
  label;
  capacity;
  buffers;
  dispatch;
  backend;
  sortedRecords;
  attributes = new pe();
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
    const t = Math.ceil(Math.max(0, e) / At);
    this.passes = Array.from(
      { length: t },
      (s, n) => this.createPass(n, n * At)
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
    const s = e % 2 === 0, n = s ? this.buffers.recordsA : this.buffers.recordsB, i = s ? this.buffers.recordsB : this.buffers.recordsA, a = v(this.dispatch.state, "uvec4", 1).toReadOnly(), o = v(
      n,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = U(
      this.backend === "subgroup" ? dn(t) : mn(t)
    ), c = {
      lane: ke,
      block_index: Q.x,
      block_stride: y(this.maxRadixBlocks),
      state: a,
      records: o,
      block_histograms: v(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (c.subgroup_index = mt, c.subgroup_lane = yt, c.subgroup_size = bt, c.partials = K(
      "uint",
      O * oe
    )) : c.histogram = K("atomic<u32>", O);
    const u = l(c).computeKernel([_]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), d = U(
      this.backend === "subgroup" ? gn(t) : bn(t)
    ), h = {
      lane: ke,
      block_index: Q.x,
      block_stride: y(this.maxRadixBlocks),
      state: a,
      records_in: o,
      records_out: v(i, "uvec2", this.capacity),
      block_prefixes: v(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: K("uint", O),
      local_digit_counts: K("uint", O)
    };
    this.backend === "subgroup" ? (h.subgroup_index = mt, h.subgroup_lane = yt, h.subgroup_size = bt, h.partials = K(
      "uint",
      O * oe
    )) : (h.shared_digits = K("uint", _), h.shared_digit_masks = K(
      "uint",
      O * (_ / 32)
    ));
    const f = d(h).computeKernel([_]).setName(`3DGS ${this.label} radix scatter WGSL ${e}`);
    return { histogram: u, scatter: f };
  }
  disposePasses() {
    for (const e of this.passes)
      e.histogram.dispose(), e.scatter.dispose();
    this.passes = [];
  }
}
const vn = (
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
function xn(r) {
  return (
    /* wgsl */
    `
fn find_tile_boundaries_${r}(
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
const _n = (
  /* wgsl */
  `
fn suffix_min_blocks(
  lane: u32,
  group_id: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_mins: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${V}>>
) -> u32 {
  let base = group_id * ${V}u;
  let first_local = lane;
  let second_local = lane + ${_}u;
  let first_source = base + (${V - 1}u - first_local);
  let second_source = base + (${V - 1}u - second_local);
  var first_value = 0xffffffffu;
  var second_value = 0xffffffffu;
  if (first_source < length) { first_value = (*values)[first_source]; }
  if (second_source < length) { second_value = (*values)[second_source]; }
  (*scratch)[first_local] = first_value;
  (*scratch)[second_local] = second_value;
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${V / 2}u;
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
    (*block_mins)[group_id] = (*scratch)[${V - 1}u];
    (*scratch)[${V - 1}u] = 0xffffffffu;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${V / 2}u;
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
), wn = (
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
    let next_block = index / ${V}u + 1u;
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
class kn {
  attributes = new pe();
  levels = [];
  constructor(e, t) {
    const s = U(_n), n = U(wn);
    let i = e, a = t;
    for (; ; ) {
      const o = this.levels.length, l = Math.ceil(a / V), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${o}`,
        l
      ), u = s({
        lane: ke,
        group_id: Q.x,
        length: y(a),
        values: v(i, "uint", a),
        block_mins: v(c, "uint", l),
        scratch: K("uint", V)
      }).computeKernel([_]).setName(`3DGS tile offset suffix scan WGSL ${o}`);
      if (this.levels.push({
        length: a,
        blockCount: l,
        values: i,
        scanNode: u
      }), l <= 1) break;
      i = c, a = l;
    }
    for (let o = 0; o < this.levels.length - 1; o++) {
      const l = this.levels[o], c = this.levels[o + 1];
      l.addNode = n({
        index: se,
        length: y(l.length),
        block_count: y(c.length),
        values: v(l.values, "uint", l.length),
        block_suffix_mins: v(
          c.values,
          "uint",
          c.length
        ).toReadOnly()
      }).compute(l.length, [_]).setName(`3DGS tile add suffix block mins WGSL ${o}`);
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
class Sn {
  constructor(e, t, s, n, i) {
    this.renderer = e, this.dispatch = i, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const a = v(this.offsets, "uint", s + 1), o = U(vn);
    this.clearNode = o({
      index: se,
      tile_count: y(s),
      state: v(i.state, "uvec4", 1).toReadOnly(),
      offsets: a
    }).compute(s + 1, [_]).setName("3DGS clear tile offsets WGSL");
    const l = U(
      xn(t)
    );
    this.boundariesNode = l({
      index: se,
      tile_count: y(s),
      state: v(i.state, "uvec4", 1).toReadOnly(),
      records: v(
        n,
        "uvec2",
        n.count
      ).toReadOnly(),
      offsets: a
    }).computeKernel([_]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new kn(this.offsets, s + 1);
  }
  renderer;
  dispatch;
  offsets;
  attributes = new pe();
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
const zs = (
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
), Cn = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${_}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class Ln {
  constructor(e, t, s, n, i, a, o, l, c, u, d, h, f, g, b, p, m, N = !1, P = 1e-4) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = n, this.meansAttribute = i, this.projectedMeanAttribute = a, this.projectedConicAttribute = o, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = d, this.depthTexture = h, this.frame = f, this.maxSplatsPerTile = g, this.rasterChunkSize = b, this.tileCount = p, this.transmittanceThreshold = P, this.metrics = N ? this.attributes.createUint("3dgs.raster-work", p * 4) : null;
    const I = this.metrics === null ? null : v(this.metrics, "uint", p * 4).toAtomic();
    this.clearMetrics = I === null ? null : rt(() => {
      Br(I.element(se), y(0));
    })().compute(p * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(m);
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
  attributes = new pe();
  chunks;
  computeNode = null;
  chunkComputeNode = null;
  compositeNode = null;
  metrics;
  clearMetrics;
  rebuild(e) {
    for (const i of [
      e.rasterPixelValueNode,
      e.rasterBreakNode,
      e.rasterColorNode,
      e.rasterAlphaNode,
      e.rasterDiscardNode
    ])
      Zs(i, is, "raster");
    Ie(
      e.rasterPixelValueNode,
      Hs,
      "rasterPixelValueNode"
    ), Ie(
      e.rasterBreakNode,
      ri,
      "rasterBreakNode"
    );
    const t = this.createRasterNode(e, "direct"), s = this.chunks === null ? null : this.createRasterNode(e, "chunk"), n = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = t, this.chunkComputeNode = s, this.compositeNode = n;
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
    const e = nr(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Gt(
      t,
      this.tileCount,
      "raster-chunks"
    ), n = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), i = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), a = e * _, o = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
      "3dgs.raster-chunk-partials",
      a * o
    ), c = v(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = v(t, "uint", this.tileCount), d = v(
      t,
      "uint",
      this.tileCount
    ).toReadOnly(), h = v(
      s.output,
      "uint",
      this.tileCount
    ).toReadOnly(), g = U(zi)({
      tile: se,
      tile_count: y(this.tileCount),
      chunk_size: y(this.rasterChunkSize),
      sample_limit: y(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [_]).setName("3DGS count exact raster chunks WGSL"), p = U(
      Bi
    )({
      tile_count: y(this.tileCount),
      task_capacity: y(e),
      chunk_counts: d,
      chunk_offsets: h,
      dispatch: v(i, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), N = U(Oi)({
      tile: se,
      tile_count: y(this.tileCount),
      task_capacity: y(e),
      chunk_counts: d,
      chunk_offsets: h,
      tasks: v(n, "uvec2", e)
    }).compute(this.tileCount, [_]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: t,
      offsets: s,
      tasks: n,
      dispatch: i,
      partialData: l,
      partialStride: o,
      countNode: g,
      prepareNode: p,
      emitNode: N
    };
  }
  createRasterNode(e, t) {
    const s = this.metrics === null ? null : v(this.metrics, "uint", this.tileCount * 4).toAtomic(), n = v(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), i = v(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), a = v(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), o = v(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), l = v(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), c = v(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = K("vec4", _), d = K("vec4", _), h = K("vec4", _), f = K("uint", _), g = K("uint", _), b = K("uint", 8), p = t === "direct" ? Rt(this.colorTexture) : null, m = U(zs), N = U(Cn), P = this.chunks, I = t === "chunk" && P !== null ? v(P.tasks, "uvec2", P.tasks.count).toReadOnly() : null, C = t === "chunk" && P !== null ? v(P.partialData, "vec4", P.partialData.count) : null, { frame: w } = this;
    return rt(() => {
      const x = y(ke), S = m({ value: x }), G = m({ value: x.shiftRight(1) }), A = y(Q.x), R = (t === "direct" ? Q.y.mul(w.tilesX).add(Q.x) : I.element(A).x).toVar("rasterTile"), z = t === "chunk" ? I.element(A).y : y(0), L = t === "direct" ? Q.x : R.mod(w.tilesX), T = t === "direct" ? Q.y : R.div(w.tilesX), W = Je(
        L.mul(y(j)).add(S),
        T.mul(y(j)).add(G)
      ).toVar("rasterPixelCoordinateValue"), $ = W.x.lessThan(y(w.viewport.x)).and(W.y.lessThan(y(w.viewport.y))).toVar("rasterActivePixel"), B = c.element(R), le = c.element(R.add(1)), Se = y(le.sub(B)), fe = Se.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const F = y(this.maxSplatsPerTile);
        fe.assign(xe(Se.lessThan(F), Se, F));
      }
      let re = y(0);
      const X = fe.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        X.assign(
          xe(
            fe.greaterThan(y(this.rasterChunkSize)),
            y(0),
            fe
          )
        );
      else if (t === "chunk") {
        re = z.mul(y(this.rasterChunkSize)).toVar("rasterSampleStart");
        const F = re.add(y(this.rasterChunkSize));
        X.assign(
          xe(F.lessThan(fe), F, fe)
        );
      }
      const Ce = _e(W).add(0.5), Te = /* @__PURE__ */ new Map([
        [Yt, () => W],
        [Xt, () => Ce],
        [Ht, () => Ce.div(w.viewport.xy)]
      ]), $e = q(0).toVar("rasterPixelValue");
      D($, () => {
        $e.assign(
          Ye(e.rasterPixelValueNode, Te)
        );
      });
      const Le = it(0).toVar("accumulated"), me = q(1).toVar("transmittance"), ce = q(1).toVar("depth"), De = ue(!1).toVar("depthWritten"), ye = ue(!1).toVar("done"), Ne = s === null ? null : y(0).toVar("rasterChecked"), Ue = s === null ? null : y(0).toVar("rasterBlended");
      qe(
        {
          start: re,
          end: X,
          type: "uint",
          condition: "<",
          update: `+= ${_}`
        },
        ({ i: F }) => {
          const Pe = F.add(x);
          D(Pe.lessThan(X), () => {
            let H = Pe;
            this.maxSplatsPerTile !== null && (H = y(
              Pt(
                q(Pe).add(0.5).mul(q(Se)).div(q(fe))
              )
            ));
            const ee = B.add(H).toVar("rasterSourceRecordIndex"), ie = l.element(ee).y, Z = i.element(ie), Y = a.element(ie);
            u.element(x).assign(Z), d.element(x).assign(te(Y.xyz, Z.w.mul(255).log())), h.element(x).assign(o.element(ie)), f.element(x).assign(ie);
          }), D(x.equal(0), () => {
            g.element(y(0)).assign(
              xe(
                F.add(y(_)).lessThan(X),
                y(1),
                y(0)
              )
            );
          });
          const je = N({ values: g }).toVar("hasNextBatch"), We = y(X.sub(F)), ze = xe(
            We.lessThan(y(_)),
            We,
            y(_)
          );
          D($.and(ye.not()), () => {
            qe(
              {
                start: y(0),
                end: ze,
                type: "uint",
                condition: "<"
              },
              ({ i: H }) => {
                Ne?.addAssign(1);
                const ee = u.element(H), ie = f.element(H), Z = Ce.sub(ee.xy), Y = new Map(Te);
                Y.set(Zt, () => $e), Y.set(dt, () => ie), Y.set(
                  Kt,
                  () => y(n.element(ie).w)
                ), Y.set(Qt, () => ee.xy), Y.set(Jt, () => Z), Y.set(es, () => ee.z);
                const ht = Ye(
                  e.rasterBreakNode,
                  Y
                );
                D(ht, () => {
                  ye.assign(ue(!0)), Ke();
                });
                const Fe = d.element(H), be = Fe.xyz, ve = be.x.mul(Z.x.mul(Z.x)).add(be.y.mul(2).mul(Z.x).mul(Z.y)).add(be.z.mul(Z.y.mul(Z.y))).mul(-0.5);
                D(
                  ve.greaterThan(0).or(ve.lessThan(Fe.w.negate())),
                  () => {
                    vt();
                  }
                );
                const os = Me(ms(be.x, 1e-12)), pt = be.y.div(os), dr = Me(ms(be.z.sub(pt.mul(pt)), 1e-12)), ls = _e(
                  os.mul(Z.x).add(pt.mul(Z.y)),
                  dr.mul(Z.y)
                ), ft = new Map([
                  ...Y,
                  [Ks, () => ls],
                  [Ys, () => ls.div(6).add(0.5)],
                  [
                    ts,
                    () => h.element(H).xyz
                  ],
                  [ss, () => ee.w],
                  [rs, () => ve],
                  [Xs, () => Ds(ve)]
                ]), hr = Ye(e.rasterDiscardNode, ft);
                D(hr, () => {
                  vt();
                });
                const gt = we(
                  Ye(e.rasterAlphaNode, ft),
                  0,
                  0.99
                );
                D(gt.lessThan(q(1 / 255)), () => {
                  vt();
                }), D(De.not(), () => {
                  ce.assign(Nn(ee.z, w)), De.assign(ue(!0));
                });
                const pr = Ye(e.rasterColorNode, ft);
                Le.addAssign(pr.mul(me).mul(gt)), Ue?.addAssign(1), me.mulAssign(q(1).sub(gt)), D(me.lessThan(this.transmittanceThreshold), () => {
                  ye.assign(ue(!0)), Ke();
                });
              }
            );
          }), D(je.equal(0), () => {
            Ke();
          }), g.element(x).assign(xe($.and(ye.not()), y(1), y(0))), ys(), D(x.lessThan(8), () => {
            const H = x.mul(32), ee = y(0).toVar("subgroupActive");
            qe(
              { start: y(0), end: y(32), type: "uint", condition: "<" },
              ({ i: ie }) => {
                ee.bitOrAssign(
                  g.element(H.add(ie))
                );
              }
            ), b.element(x).assign(ee);
          }), ys(), D(x.equal(0), () => {
            const H = y(0).toVar("tileActiveReduction");
            qe(
              { start: y(0), end: y(8), type: "uint", condition: "<" },
              ({ i: ee }) => {
                H.bitOrAssign(b.element(y(ee)));
              }
            ), g.element(y(0)).assign(H);
          });
          const Be = N({ values: g });
          D(Be.equal(0), () => {
            Ke();
          });
        }
      ), D($, () => {
        if (s !== null) {
          const F = R.mul(4);
          Oe(s.element(F), Ne), Oe(s.element(F.add(1)), Ue), t === "direct" && D(Se.greaterThan(0).and(X.greaterThan(0)), () => {
            Oe(s.element(F.add(2)), y(1)), Oe(
              s.element(F.add(3)),
              xe(
                me.lessThan(this.transmittanceThreshold),
                y(1),
                y(0)
              )
            );
          });
        }
        if (t === "direct")
          Bs(
            Le,
            me,
            ce,
            W,
            p,
            this.depthTexture,
            w
          );
        else {
          const F = A.mul(y(_)).add(x).mul(y(P.partialStride));
          C.element(F).assign(te(Le, me)), this.depthTexture !== null && C.element(F.add(1)).assign(te(ce, 0, 0, 0));
        }
      });
    })().computeKernel([j, j]).setName(
      t === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const e = this.metrics === null ? null : v(this.metrics, "uint", this.tileCount * 4).toAtomic(), t = this.chunks, s = v(
      t.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), n = v(
      t.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), i = v(
      t.partialData,
      "vec4",
      t.partialData.count
    ).toReadOnly(), a = Rt(this.colorTexture), o = U(zs), { frame: l } = this;
    return rt(() => {
      const u = y(ke), d = o({ value: u }), h = o({ value: u.shiftRight(1) }), f = Q.y.mul(l.tilesX).add(Q.x), g = s.element(f), b = Je(
        Q.x.mul(y(j)).add(d),
        Q.y.mul(y(j)).add(h)
      ), p = b.x.lessThan(y(l.viewport.x)).and(b.y.lessThan(y(l.viewport.y)));
      D(p.and(g.greaterThan(0)), () => {
        const m = it(0).toVar("chunkCompositeColor"), N = q(1).toVar("chunkCompositeTransmittance"), P = q(1).toVar("chunkCompositeDepth"), I = ue(!1).toVar("chunkCompositeDepthWritten"), C = n.element(f);
        qe(
          {
            start: y(0),
            end: g,
            type: "uint",
            condition: "<"
          },
          ({ i: w }) => {
            const k = C.add(w).mul(y(_)).add(u).mul(y(t.partialStride)), x = i.element(k);
            m.addAssign(x.xyz.mul(N)), this.depthTexture !== null && D(I.not().and(x.w.lessThan(1)), () => {
              P.assign(i.element(k.add(1)).x), I.assign(ue(!0));
            }), N.mulAssign(x.w), D(N.lessThan(this.transmittanceThreshold), () => {
              Ke();
            });
          }
        ), Bs(
          m,
          N,
          P,
          b,
          a,
          this.depthTexture,
          l
        ), e !== null && (Oe(e.element(f.mul(4).add(2)), y(1)), Oe(
          e.element(f.mul(4).add(3)),
          xe(
            N.lessThan(this.transmittanceThreshold),
            y(1),
            y(0)
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
    let t = 0, s = 0, n = 0, i = 0;
    for (let a = 0; a < e.length; a += 4)
      t += e[a], s += e[a + 1], n += e[a + 2], i += e[a + 3];
    return { checked: t, blended: s, pixels: n, alphaStopped: i };
  }
}
function Nn(r, e) {
  const t = r.negate();
  return we(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function Bs(r, e, t, s, n, i, a) {
  const o = we(q(a.background[3]), 0, 1);
  r.addAssign(
    it(a.background[0], a.background[1], a.background[2]).mul(e).mul(o)
  );
  const l = q(1).sub(e.mul(q(1).sub(o)));
  bs(n, Ze(s), te(r, l)), i !== null && bs(
    Rt(i),
    Ze(s),
    te(t, 0, 0, 1)
  );
}
function Ye(r, e) {
  return r.context({ overrideNodes: e });
}
class Pn {
  constructor(e, t, s, n, i, a) {
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
    const o = v(
      n,
      "uint",
      s
    ).toReadOnly(), l = U(
      $i
    );
    this.prepareNode = l({
      gaussian_count: y(s),
      projected_mean: v(
        i,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: o,
      state: v(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: v(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: v(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: v(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const c = U(
      Di(t)
    );
    this.compactNode = c({
      gid: se,
      gaussian_count: y(s),
      viewport: a,
      visible_offsets: o,
      projected_mean: v(
        i,
        "vec4",
        s
      ).toReadOnly(),
      records: v(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [_]).setName(`3DGS compact visible Gaussians WGSL (${t})`);
  }
  renderer;
  buffers;
  dispatch;
  attributes = new pe();
  prepareNode;
  compactNode;
  encode(e = !1) {
    e ? (this.renderer.compute(this.prepareNode), this.renderer.compute(this.compactNode)) : this.renderer.compute([this.prepareNode, this.compactNode]);
  }
  dispose() {
    this.prepareNode.dispose(), this.compactNode.dispose(), this.attributes.dispose();
  }
}
class Rn {
  constructor(e, t, s, n, i, a, o, l, c, u, d, h, f, g, b = 1e-4, p = !1) {
    this.renderer = e, this.data = s, this.mode = i, this.capacity = o, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = d, this.subpixelSampleCulling = h, this.radixBackend = f, this.nodes = g, this.rasterTransmittanceThreshold = b, this.rasterStats = p, this.frame = new qi(t, l), this.objects = new Hi(t, n, s.count), this.projection = new rn(
      s,
      this.frame,
      this.objects,
      a,
      g,
      h
    ), this.profileDiagnostics = c || p ? new un(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new Gt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new Pn(
      e,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Ts(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      f
    ), this.depthSorter.configure(i === "float32" ? 32 : 16), this.orderedTiles = new ji(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Gt(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new Xi(
      e,
      s.count,
      o,
      this.depthSorter.sortedRecords,
      this.visible.dispatch,
      this.orderedTiles.tileCounts,
      this.scan.output,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.frame
    ), this.sorter = new Ts(
      e,
      "tile",
      o,
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
  prepareFrame(e, t, s, n) {
    if (this.frame.update(e, t, this.tilesX, this.tilesY), this.objects.update(), (e !== this.width || t !== this.height) && this.rebuildTileStages(e, t, s, n), this.tileOffsets === null || this.rasterizer === null)
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
  rebuildTileStages(e, t, s, n) {
    const i = Math.ceil(e / j), a = Math.ceil(t / j), o = i * a;
    if (i > 65535 || a > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, o + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new Sn(
      this.renderer,
      this.mode,
      o,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new Ln(
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
      n,
      this.frame,
      this.maxRasterizedSplatsPerTile,
      this.rasterChunkSize,
      o,
      this.nodes,
      this.rasterStats,
      this.rasterTransmittanceThreshold
    ), this.width = e, this.height = t, this.tilesX = i, this.tilesY = a, this.frame.update(e, t, i, a), this.tileStageRebuilds++;
  }
}
function Mn(r, e) {
  if (r !== "auto" && r !== "subgroup" && r !== "workgroup")
    throw new RangeError(
      'radixBackend must be "auto", "subgroup", or "workgroup"'
    );
  if (r === "subgroup" && !e)
    throw new Error(
      'radixBackend "subgroup" requires the WebGPU "subgroups" feature'
    );
  return r === "auto" ? e ? "subgroup" : "workgroup" : r;
}
const Nt = new Ar();
class In extends cs {
  gaussianStore;
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
  nodeSlots = si();
  dirtyStages = 0;
  disposed = !1;
  constructor(e, t, s, n = {}) {
    super(cs.COLOR, new $s(), t, {
      type: us,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const i = n.depthSortMode ?? "float32", a = n.antialiasMode ?? "compensated", o = n.radixBackend ?? "auto";
    if (a !== "compensated" && a !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    const l = Mn(
      o,
      e.hasFeature("subgroups")
    ), c = n.intersectionCapacity ?? null;
    if (c !== null && (!Number.isInteger(c) || c <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (c !== null && c > _ * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const u = n.maxRasterizedSplatsPerTile ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const d = n.rasterChunkSize === void 0 ? Ti : n.rasterChunkSize;
    if (Ei(
      d,
      c ?? _ * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = i, this.antialiasMode = a, this.requestedIntersectionCapacity = c, this.background = n.background ?? [0, 0, 0, 0], this.outputDepth = n.outputDepth ?? !1, this.colorSpace = n.colorSpace ?? Nr, this.profileKernels = n.profileKernels ?? !1, this.rasterStats = n.rasterStats ?? !1, this.rasterTransmittanceThreshold = n.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = d, this.subpixelSampleCulling = n.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new ds(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = us, this.colorTexture.colorSpace = Pr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new ds(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = Rr, this.depthTexture.type = Mr, this.depthTexture.minFilter = hs, this.depthTexture.magFilter = hs, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    return this.workingColorNode ??= Or(
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
    if (!(this.camera instanceof Ir))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    t.getDrawingBufferSize(Nt);
    const s = Math.max(1, Math.floor(Nt.x)), n = Math.max(1, Math.floor(Nt.y));
    (this.renderTarget.width !== s || this.renderTarget.height !== n) && this.setSize(s, n), this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: An(t) });
    const i = this.gaussianStore.updateLod(this.camera, s, n), a = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      _ * 65535,
      Math.max(1, a.count * 16)
    )), t.initRenderTarget(this.renderTarget), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), a.count > _ * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new Rn(
        t,
        this.camera,
        a,
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
      ), this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.pipeline.prepareFrame(
      s,
      n,
      this.colorTexture,
      this.depthTexture
    ), this.pipeline.render(), this.debugListeners.size > 0) {
      const o = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: i
      };
      for (const l of this.debugListeners) l(o);
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
    Os(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateProjection());
  }
  setRasterNode(e, t) {
    Os(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateRasterizer());
  }
}
function Os(r, e) {
  if (r?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function An(r) {
  const e = r.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device.limits;
}
function Fn(r, e, t, s) {
  return new In(r, e, t, s);
}
export {
  Ur as CanonicalGaussianPlyLoader,
  Un as DistanceAwareRadialLodPackingStrategy,
  Er as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  _s as GaussianCloud,
  zt as GaussianData,
  at as GaussianLod,
  En as GaussianLodColorHelper,
  It as GaussianLodNode,
  Ee as GaussianMipmapLod,
  Bt as GaussianOctree,
  Kr as GaussianOctreeNode,
  In as GaussianPass,
  Wn as GaussianStore,
  Si as GaussianStoreAttributes,
  ki as GaussianStorePackedAttribute,
  On as LodHelper,
  $n as MaximumLodPackingStrategy,
  Bn as OctreeHelper,
  Ws as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Dn as RadialLodPackingStrategy,
  pi as RadialLodWorkerPlanner,
  vi as RemainingCapacityBudgetStrategy,
  kt as ScreenSpaceLodPackingStrategy,
  jn as SourceFractionBudgetStrategy,
  Js as StreamingLodPackingStrategy,
  ai as TieredRadialLodPackingStrategy,
  $t as gaussianColor,
  Ot as gaussianIndex,
  Et as gaussianObjectId,
  Dt as gaussianObjectMatrix,
  Ut as gaussianObjectVisible,
  ut as gaussianOpacity,
  Fn as gaussianPass,
  ot as gaussianPositionLocal,
  et as gaussianPositionWorld,
  qt as gaussianProjectedArea,
  Vt as gaussianProjectedSigma,
  ct as gaussianRotation,
  lt as gaussianScale,
  qs as gaussianScreenBoundsMax,
  Vs as gaussianScreenBoundsMin,
  Ft as gaussianScreenPosition,
  Wt as gaussianViewDepth,
  jt as gaussianViewDirection,
  ks as isStreamingLodPackingStrategy,
  Mt as packShRgb8e8,
  Qt as rasterGaussianCenter,
  ts as rasterGaussianColor,
  Ks as rasterGaussianCoord,
  dt as rasterGaussianIndex,
  ss as rasterGaussianOpacity,
  Kt as rasterObjectId,
  Yt as rasterPixelCoordinate,
  Jt as rasterPixelDelta,
  Zt as rasterPixelValue,
  rs as rasterPower,
  Xt as rasterScreenPosition,
  Ht as rasterScreenUV,
  Ys as rasterUV,
  es as rasterViewDepth,
  Xs as rasterWeight,
  Fs as shBytesPerCoefficient,
  $r as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
