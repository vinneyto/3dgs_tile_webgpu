import { StorageBufferAttribute as Pe, Object3D as ps, Matrix4 as Re, Ray as Fs, Vector3 as C, Box3 as kt, LineSegments as Vs, BufferGeometry as qs, Float32BufferAttribute as Ks, LineBasicMaterial as Ys, BoxGeometry as Xs, MeshBasicMaterial as Hs, DoubleSide as Zs, InstancedMesh as Js, Color as Qs, IndirectStorageBufferAttribute as ei, Vector4 as ti, Scene as fs, PassNode as Wt, HalfFloatType as Ft, SRGBColorSpace as si, StorageTexture as Vt, NoColorSpace as ii, RedFormat as ri, FloatType as ai, NearestFilter as qt, PerspectiveCamera as ni, Vector2 as oi } from "three/webgpu";
import { property as P, bool as me, exp as gs, storage as m, uint as g, vec3 as et, mix as li, float as V, wgslFn as $, instanceIndex as ne, workgroupArray as W, workgroupId as Y, invocationLocalIndex as _e, uniform as Te, uvec2 as Ve, Fn as bt, If as B, Return as he, vec4 as Q, mat4 as Kt, normalize as ci, sqrt as Se, clamp as ve, log as ui, ceil as Yt, vec2 as be, ivec2 as We, int as Xt, floor as vt, subgroupIndex as nt, invocationSubgroupIndex as ot, subgroupSize as lt, storageTexture as _t, select as Ne, Loop as Ae, Continue as ct, max as Ht, Break as Ze, workgroupBarrier as Zt, textureStore as Jt, colorSpaceToWorking as di } from "three/tsl";
class ms {
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
const hi = 16, bs = 4;
function pi(r, e, t) {
  const s = Math.max(Math.abs(r), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const a = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), i = 127 / 2 ** a, o = ut(r, i), n = ut(e, i), l = ut(t, i), c = a + 127;
  return (o | n << 8 | l << 16 | c << 24) >>> 0;
}
function ta(r) {
  const e = 2 ** ((r >>> 24) - 127) / 127;
  return [
    dt(r) * e,
    dt(r >>> 8) * e,
    dt(r >>> 16) * e
  ];
}
function vs(r) {
  return r === "rgb8e8" ? bs : hi;
}
function ut(r, e) {
  return Math.min(127, Math.max(-127, Math.round(r * e))) & 255;
}
function dt(r) {
  const e = r & 255;
  return e < 128 ? e : e - 256;
}
const Qt = {
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
}, fi = [
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
class gi {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = mi(e), s = new Map(
      t.properties.map((p, b) => [p.name, b])
    );
    for (const p of fi)
      if (!s.has(p))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${p}`);
    const a = t.properties.map((p) => p.name.match(/^f_rest_(\d+)$/)?.[1]).filter((p) => p !== void 0).map(Number).sort((p, b) => p - b);
    for (let p = 0; p < a.length; p++)
      if (a[p] !== p)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (a.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const i = a.length / 3, o = i + 1, n = Math.sqrt(o);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = bi(e, t), c = (p) => s.get(p), u = a.map(
      (p) => c(`f_rest_${p}`)
    ), h = t.vertexCount, d = new Float32Array(h * 4), f = new Float32Array(h * 4), _ = new Float32Array(h * 4), y = new Float32Array(h * o * 4);
    for (let p = 0; p < h; p++) {
      const b = p * 4;
      d[b] = l(p, c("x")), d[b + 1] = l(p, c("y")), d[b + 2] = l(p, c("z")), f[b] = Math.max(
        Math.exp(l(p, c("scale_0"))),
        1e-6
      ), f[b + 1] = Math.max(
        Math.exp(l(p, c("scale_1"))),
        1e-6
      ), f[b + 2] = Math.max(
        Math.exp(l(p, c("scale_2"))),
        1e-6
      );
      const N = l(p, c("opacity"));
      f[b + 3] = 1 / (1 + Math.exp(-N));
      const R = l(p, c("rot_0")), S = l(p, c("rot_1")), x = l(p, c("rot_2")), k = l(p, c("rot_3")), G = Math.hypot(S, x, k, R);
      G > 1e-12 ? (_[b] = S / G, _[b + 1] = x / G, _[b + 2] = k / G, _[b + 3] = R / G) : _[b + 3] = 1;
      const E = p * o * 4;
      y[E] = l(p, c("f_dc_0")), y[E + 1] = l(p, c("f_dc_1")), y[E + 2] = l(p, c("f_dc_2"));
      for (let w = 1; w < o; w++) {
        const I = E + w * 4, j = w - 1;
        for (let M = 0; M < 3; M++) {
          const A = u[M * i + j];
          y[I + M] = l(
            p,
            A
          );
        }
      }
    }
    return new ms(
      {
        means: Je("ply.means", d),
        scalesOpacity: Je("ply.scales-opacity", f),
        rotations: Je("ply.rotations-xyzw", _),
        shCoefficients: Je("ply.sh-coefficients", y)
      },
      {
        count: h,
        shDegree: n - 1,
        ownsBuffers: !0
      }
    );
  }
}
function Je(r, e) {
  const t = new Pe(e, 4);
  return t.name = r, t;
}
function mi(r) {
  const e = new Uint8Array(r), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let _ = 0; _ <= e.length - t.length; _++) {
    let y = !0;
    for (let p = 0; p < t.length; p++)
      if (e[_ + p] !== t[p]) {
        y = !1;
        break;
      }
    if (y) {
      s = _;
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
  for (const _ of o) {
    const y = _.trim().split(/\s+/);
    if (y[0] === "format") {
      if (y[1] !== "ascii" && y[1] !== "binary_little_endian" && y[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${y[1] ?? "unknown"}`);
      n = y[1];
    } else if (y[0] === "element") {
      l = y[1] ?? "";
      const p = Number(y[2]);
      if (!Number.isInteger(p) || p < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: p }), l === "vertex" && (c = p);
    } else if (y[0] === "property" && l === "vertex") {
      if (y[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const p = y[1], b = y[2];
      if (!(p in Qt) || b === void 0)
        throw new Error(`Unsupported vertex property: ${_}`);
      h.push({ name: b, type: p, byteOffset: u }), u += Qt[p];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (c <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (_) => _.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: c, properties: h, vertexStride: u, dataOffset: a };
}
function bi(r, e) {
  if (e.format === "ascii") {
    const i = new TextDecoder().decode(
      new Uint8Array(r, e.dataOffset)
    ), o = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let n = 0;
    for (let l = 0; l < o.length; l++) {
      for (; n < i.length && /\s/.test(i[n]); ) n++;
      const c = n;
      for (; n < i.length && !/\s/.test(i[n]); ) n++;
      const u = Number(i.slice(c, n));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${l}`);
      o[l] = u;
    }
    return (l, c) => o[l * e.properties.length + c];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > r.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(r), a = e.format === "binary_little_endian";
  return (i, o) => {
    const n = e.properties[o], l = e.dataOffset + i * e.vertexStride + n.byteOffset;
    return vi(s, l, n.type, a);
  };
}
function vi(r, e, t, s) {
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
class es extends ps {
  isGaussianCloud = !0;
  objectId;
  lod;
  raycastMode = "rendered";
  ownerStore;
  packing;
  packedGaussianCount;
  priority;
  constructor(e, t, s, a = "GaussianCloud", i = null, o = null, n = 0) {
    super(), this.ownerStore = e, this.objectId = t, this.packedGaussianCount = s, this.lod = i, this.packing = o, this.priority = n, this.name = a;
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
    const s = new Re().copy(this.matrixWorld).invert(), a = new Fs().copy(e.ray).applyMatrix4(s), i = this.raycastMode === "full" ? this.lod.octree.raycast(a) : this.lod.raycast(a, this.packing);
    for (const o of i) {
      const n = o.point.clone().applyMatrix4(this.matrixWorld), l = e.ray.origin.distanceTo(n);
      l < e.near || l > e.far || t.push({
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
class _i {
  constructor(e, t, s, a, i, o, n, l) {
    this.id = e, this.depth = t, this.bounds = s, this.count = a, this.maxSplatRadius = i, this.raycastBounds = l, this.children = o, this.gaussianIndices = n;
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
class St {
  constructor(e, t, s, a) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = a, this.bounds = yi(e), this.rootBounds = xi(this.bounds);
    const i = e.means.array, o = e.scalesOpacity.array, n = [], l = [], c = Array.from({ length: e.count }, (h, d) => d), u = (h, d, f) => {
      const _ = n.length;
      n.push(null);
      const y = h.length > t && f < s && d.max.x - d.min.x > Number.EPSILON, p = [];
      if (y) {
        const R = d.getCenter(new C()), S = Array.from({ length: 8 }, () => []);
        for (const x of h) {
          const k = x * 4, G = (i[k] >= R.x ? 1 : 0) | (i[k + 1] >= R.y ? 2 : 0) | (i[k + 2] >= R.z ? 4 : 0);
          S[G].push(x);
        }
        for (let x = 0; x < 8; x++) {
          const k = S[x];
          k.length !== 0 && p.push(
            u(
              k,
              wi(d, R, x),
              f + 1
            )
          );
        }
      }
      let b = 0;
      if (p.length > 0)
        for (const R of p)
          b = Math.max(
            b,
            n[R].maxSplatRadius
          );
      else {
        for (const R of h) {
          const S = R * 4;
          b = Math.max(
            b,
            o[S],
            o[S + 1],
            o[S + 2]
          );
        }
        l.push(_);
      }
      const N = d.clone().expandByScalar(b * 3);
      return n[_] = new _i(
        _,
        f,
        d,
        h.length,
        b,
        p,
        p.length === 0 ? Uint32Array.from(h) : null,
        N
      ), _;
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
    return new St(
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
    const i = [], o = [this.rootNode];
    for (; o.length > 0; ) {
      const n = this.nodes[o.pop()], l = Math.max(0, s - 3) * n.maxSplatRadius, c = l === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(l);
      if (e.intersectsBox(c))
        if (n.gaussianIndices !== null)
          for (const u of n.gaussianIndices) i.push(u);
        else
          for (const u of n.children) o.push(u);
    }
    return this.raycastIndices(e, i, s, a);
  }
  raycastIndices(e, t, s = 3, a = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(a > 0)) return [];
    const i = this.data.means.array, o = this.data.scalesOpacity.array, n = new C(), l = new C(), c = [];
    for (let u = 0; u < t.length; u++) {
      const h = t[u], d = h * 4;
      n.set(i[d], i[d + 1], i[d + 2]);
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
    return c.sort((u, h) => u.distance - h.distance), c.length > a && (c.length = a), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function yi(r) {
  const e = r.means.array, t = new kt(), s = new C();
  for (let a = 0; a < r.count; a++) {
    const i = a * 4;
    s.set(e[i], e[i + 1], e[i + 2]), t.expandByPoint(s);
  }
  return t;
}
function xi(r) {
  const e = r.getCenter(new C()), t = r.getSize(new C()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new kt(
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
function wi(r, e, t) {
  return new kt(
    new C(
      t & 1 ? e.x : r.min.x,
      t & 2 ? e.y : r.min.y,
      t & 4 ? e.z : r.min.z
    ),
    new C(
      t & 1 ? r.max.x : e.x,
      t & 2 ? r.max.y : e.y,
      t & 4 ? r.max.z : e.z
    )
  );
}
class sa extends Vs {
  constructor(e, t = {}) {
    const s = t.minDepth ?? 0, a = t.maxDepth ?? 1 / 0, i = e.nodes.filter(
      (h) => h.depth >= s && h.depth <= a && (t.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(i.length * 12 * 2 * 3);
    let n = 0;
    for (const h of i) {
      const { min: d, max: f } = h.bounds, _ = [
        [d.x, d.y, d.z],
        [f.x, d.y, d.z],
        [f.x, f.y, d.z],
        [d.x, f.y, d.z],
        [d.x, d.y, f.z],
        [f.x, d.y, f.z],
        [f.x, f.y, f.z],
        [d.x, f.y, f.z]
      ];
      for (const [y, p] of ki)
        o.set(_[y], n), o.set(_[p], n + 3), n += 6;
    }
    const l = new qs();
    l.setAttribute("position", new Ks(o, 3)), l.computeBoundingSphere();
    const c = t.opacity ?? 0.55, u = new Ys({
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
const ki = [
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
class ts {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const Si = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class Ct {
  constructor(e, t) {
    this.octree = e, this.levels = Ci(t.levels ?? Si), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? Li, a = new Float64Array(e.data.count);
    for (let i = 0; i < a.length; i++) {
      const o = s(i, e);
      a[i] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((i) => {
      if (i.gaussianIndices === null)
        return new ts(
          i.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(i.gaussianIndices).sort(
          (n, l) => a[l] - a[n] || n - l
        )
      );
      return new ts(
        i.id,
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
    return new Ct(e, t);
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
    for (let i = 0; i < e.nodeIds.length; i++) {
      const o = e.nodeIds[i], n = this.getLeafNode(o);
      if (s.has(o))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${o}`
        );
      s.add(o);
      const l = e.lodLevels[i], c = n.levelCounts[l];
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
    const i = s.maxHits ?? 1 / 0;
    if (!(i > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const o = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, l = new C(), c = new C(), u = [], h = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.nodeIds.length; d++) {
      const f = t.nodeIds[d], _ = this.getLeafNode(f);
      if (h.has(f))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${f}`
        );
      h.add(f);
      const y = t.lodLevels[d], p = _.levelCounts[y];
      if (p === void 0)
        throw new RangeError(`GaussianLod level ${y} does not exist`);
      const b = this.octree.nodes[f], N = Math.max(0, a - 3) * b.maxSplatRadius, R = N === 0 ? b.raycastBounds : b.raycastBounds.clone().expandByScalar(N);
      if (e.intersectsBox(R))
        for (let S = 0; S < p; S++) {
          const x = _.sortedGaussianIndices[S], k = x * 4;
          l.set(o[k], o[k + 1], o[k + 2]);
          const G = Math.max(
            n[k],
            n[k + 1],
            n[k + 2]
          ) * a;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > G * G) && u.push({
            gaussianIndex: x,
            distance: e.origin.distanceTo(c),
            point: c.clone()
          });
        }
    }
    return u.sort((d, f) => d.distance - f.distance), u.length > i && (u.length = i), u;
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
function Ci(r) {
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
function Li(r, e) {
  const t = e.data.scalesOpacity.array, s = r * 4, a = [t[s], t[s + 1], t[s + 2]];
  return a.sort((i, o) => o - i), t[s + 3] * a[0] * a[1];
}
const Ni = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class ia extends ps {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : Ni, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: e.levelCount }, (a, i) => i)
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
    for (let i = 0; i < this.packing.nodeIds.length; i++) {
      const o = this.packing.lodLevels[i], n = e[o];
      if (n === void 0)
        throw new RangeError(`Gaussian LOD level ${o} does not exist`);
      n.push(this.packing.nodeIds[i]);
    }
    const t = new C(), s = new C(), a = new Re();
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (o.length === 0) continue;
      const n = new Xs(1, 1, 1), l = new Hs({
        color: this.colors[i % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: Zs,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new Js(n, l, o.length);
      for (let u = 0; u < o.length; u++) {
        const h = this.lod.octree.nodes[o[u]].bounds;
        h.getCenter(t), h.getSize(s), a.makeScale(s.x, s.y, s.z), a.setPosition(t), c.setMatrixAt(u, a);
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
const Lt = P("uint", "gaussianIndex"), Nt = P("uint", "gaussianObjectId"), tt = P("vec3", "gaussianPositionLocal"), qe = P("vec3", "gaussianPositionWorld"), st = P("vec3", "gaussianScale"), it = P("vec4", "gaussianRotation"), rt = P("float", "gaussianOpacity"), Pt = P("vec3", "gaussianColor"), Rt = P("mat4", "gaussianObjectMatrix"), Gt = P("bool", "gaussianObjectVisible"), It = P("vec3", "gaussianViewDirection"), $t = P("float", "gaussianViewDepth"), Mt = P(
  "vec2",
  "gaussianScreenPosition"
), _s = P(
  "vec2",
  "gaussianScreenBoundsMin"
), ys = P(
  "vec2",
  "gaussianScreenBoundsMax"
), Ot = P(
  "vec2",
  "gaussianProjectedSigma"
), Bt = P("float", "gaussianProjectedArea"), zt = P("uint", "rasterGaussianIndex"), xs = P("uint", "rasterObjectId"), ws = P("uvec2", "rasterPixelCoordinate"), ks = P("vec2", "rasterScreenPosition"), Ss = P("vec2", "rasterScreenUV"), Cs = P("vec2", "rasterGaussianCenter"), Ls = P("vec2", "rasterPixelDelta"), Ns = P("vec2", "rasterGaussianCoord"), Ps = P("vec2", "rasterUV"), Rs = P("float", "rasterViewDepth"), Et = P("vec3", "rasterGaussianColor"), Tt = P("float", "rasterGaussianOpacity"), At = P("float", "rasterPower"), Gs = P("float", "rasterWeight");
function Pi() {
  return {
    gaussianPositionLocalNode: tt,
    gaussianPositionWorldNode: qe,
    gaussianScaleNode: st,
    gaussianRotationNode: it,
    gaussianOpacityNode: rt,
    gaussianColorNode: Pt,
    gaussianVisibilityNode: me(!0),
    rasterColorNode: Et,
    rasterAlphaNode: Tt.mul(gs(At)),
    rasterDiscardNode: me(!1)
  };
}
const Fe = /* @__PURE__ */ new Set([
  Lt,
  Nt,
  tt,
  qe,
  st,
  it,
  rt,
  Pt,
  Rt,
  Gt,
  It,
  $t,
  Mt,
  _s,
  ys,
  Ot,
  Bt
]), Dt = /* @__PURE__ */ new Set([
  zt,
  xs,
  ws,
  ks,
  Ss,
  Cs,
  Ls,
  Ns,
  Ps,
  Rs,
  Et,
  Tt,
  At,
  Gs
]);
function Is(r, e, t) {
  r.traverse((s) => {
    if ((Fe.has(s) || Dt.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function De(r, e, t) {
  r.traverse((s) => {
    if ((Fe.has(s) || Dt.has(s)) && !e.has(s))
      throw new Error(
        `GaussianPass.${t} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const Ri = [
  15228264,
  15906891,
  4900235
];
class ra {
  constructor(e, t = {}) {
    if (this.pass = e, t.colors !== void 0 && t.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = t.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...t.colors ?? Ri], this.tintStrength = s, this.lodLevelAttribute = e.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = e.subscribeDebug(() => this.update()), this.enabled = t.enabled ?? !0;
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
    const e = this.lodLevelAttribute.bufferAttribute, t = m(e, "uint", e.count).toReadOnly().element(zt).mod(g(this.colors.length)), s = this.colors.map((o) => {
      const n = new Qs(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return et(n.r, n.g, n.b);
    });
    let a = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      a = t.equal(g(o)).select(s[o], a);
    const i = li(
      this.baseColorNode,
      a,
      V(this.tintStrength)
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
class aa {
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
    const a = e.octree.leafNodeIds.slice(), i = new Uint8Array(a.length);
    return i.fill(e.finestLevel), { nodeIds: a, lodLevels: i, gaussianCount: s };
  }
}
function jt(r, e, t) {
  return r.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), r.getWorldPosition(t), e.worldToLocal(t);
}
function Ut(r, e) {
  const t = e instanceof C ? e.clone() : r.octree.bounds.getCenter(new C()), s = r.octree.rootBounds.getSize(new C()), a = Math.max(s.length() * 0.5, Number.EPSILON), i = new C(), o = Array.from(r.octree.leafNodeIds, (n) => (r.octree.nodes[n].bounds.getCenter(i), {
    nodeId: n,
    radius: i.distanceTo(t) / a
  }));
  return o.sort(
    (n, l) => n.radius - l.radius || n.nodeId - l.nodeId
  ), o;
}
class na {
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
      jt(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ge(t), t === 0) return Gi();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const a = Ut(e, this.center), i = [];
    let o = 0;
    for (const l of a) {
      const c = e.nodes[l.nodeId].levelCounts[s];
      if (o + c > t) break;
      i.push(l.nodeId), o += c;
    }
    const n = new Uint8Array(i.length);
    return n.fill(s), {
      nodeIds: Uint32Array.from(i),
      lodLevels: n,
      gaussianCount: o
    };
  }
}
function Gi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Ii {
  cameraCenter = new C();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof C ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = $i(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof C ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      jt(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ge(t), t === 0) return Mi();
    const s = e.octree.data.count;
    if (s <= t) {
      const h = e.octree.leafNodeIds.slice(), d = new Uint8Array(h.length);
      return d.fill(e.finestLevel), { nodeIds: h, lodLevels: d, gaussianCount: s };
    }
    const a = Ut(e, this.center), i = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], o = [], n = [];
    let l = 0, c = 0, u = 0;
    for (let h = 0; h < i.length; h++) {
      const d = this.budgetShares[h];
      if (u += d, d === 0) continue;
      const f = h === i.length - 1 ? t : Math.floor(t * u), _ = i[h];
      for (; c < a.length; ) {
        const y = a[c], p = e.nodes[y.nodeId].levelCounts[_];
        if (l + p > f) break;
        o.push(y.nodeId), n.push(_), l += p, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(n),
      gaussianCount: l
    };
  }
}
function $i(r) {
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
function Mi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class oa {
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
      jt(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ge(t), t === 0) return Oi();
    const s = Ut(e, this.center), a = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let i = s.reduce(
      (n, l, c) => n + e.nodes[l.nodeId].levelCounts[a[c]],
      0
    );
    for (let n = s.length - 1; n >= 0 && i > t; n--) {
      const l = e.nodes[s[n].nodeId];
      for (; a[n] > 0 && i > t; ) {
        const c = l.levelCounts[a[n]];
        a[n] = a[n] - 1, i -= c - l.levelCounts[a[n]];
      }
    }
    let o = s.length;
    for (; o > 0 && i > t; ) {
      o--;
      const n = e.nodes[s[o].nodeId];
      i -= n.levelCounts[a[o]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, o).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(a.slice(0, o)),
      gaussianCount: i
    };
  }
}
function Oi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
function Bi(r) {
  const e = new Uint32Array(r.octree.leafNodeIds), t = new Float64Array(e.length * 3), s = new Uint32Array(e.length * r.levelCount);
  for (let n = 0; n < e.length; n++) {
    const l = e[n], c = r.octree.nodes[l].bounds, u = n * 3;
    t[u] = (c.min.x + c.max.x) * 0.5, t[u + 1] = (c.min.y + c.max.y) * 0.5, t[u + 2] = (c.min.z + c.max.z) * 0.5, s.set(r.nodes[l].levelCounts, n * r.levelCount);
  }
  const a = r.octree.rootBounds.max.x - r.octree.rootBounds.min.x, i = r.octree.rootBounds.max.y - r.octree.rootBounds.min.y, o = r.octree.rootBounds.max.z - r.octree.rootBounds.min.z;
  return {
    leafNodeIds: e,
    leafCenters: t,
    levelCounts: s,
    levelCount: r.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        a * a + i * i + o * o
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const zi = 2;
class Ei {
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
    this.worker = new Worker(new URL(
      /* @vite-ignore */
      "" + new URL("assets/RadialLodWorker-CftnehMz.js", import.meta.url).href,
      import.meta.url
    ), {
      type: "module",
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const t = Bi(e), s = Array.from(
      { length: zi },
      () => Ti(t.leafNodeIds.length)
    ), a = {
      type: "init",
      data: t,
      buffers: s
    };
    this.worker.postMessage(a, [
      t.leafNodeIds.buffer,
      t.leafCenters.buffer,
      t.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: i, lodLevels: o }) => [i, o])
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
      packing: Ai(t),
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
function Ti(r) {
  return {
    nodeIds: new ArrayBuffer(r * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(r * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function Ai(r) {
  return {
    nodeIds: new Uint32Array(r.buffer.nodeIds, 0, r.length),
    lodLevels: new Uint8Array(r.buffer.lodLevels, 0, r.length),
    gaussianCount: r.gaussianCount
  };
}
const Di = 1024 * 1024, ji = 16, Ui = 1.25;
class $s {
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
    if (this.targetStrategy = e, this.targetPlanner = t.targetPlanner ?? null, this.maxUploadBytesPerPack = t.maxUploadBytesPerPack ?? Di, this.maxChangedCellsPerPack = t.maxChangedCellsPerPack ?? ji, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
      const a = this.changes[this.changeCursor], i = t.length >= this.maxChangedCellsPerPack || s + a.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (t.length > 0 && i && this.appliedGaussianCount <= e.maxGaussians)
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
    return rs(e.lod, t, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.targetDirty = !1, t;
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
        rs(e.lod, t.packing, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.changes = this.planChanges(e.lod, t.packing), this.changeCursor = 0, this.latestTargetPlanningMs = t.planningMs, this.latestTargetRoundTripMs = t.roundTripMs;
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
    const a = [], i = [];
    for (let o = this.appliedCellCount - 1; o >= 0; o--) {
      const n = this.appliedNodeIds[o], l = this.appliedLodLevels[o], c = s[n];
      (c < 0 || c < l) && a.push(
        is(
          e,
          n,
          l,
          c < 0 ? null : c
        )
      );
    }
    for (let o = 0; o < t.nodeIds.length; o++) {
      const n = t.nodeIds[o], l = t.lodLevels[o], c = this.appliedIndices[n], u = c < 0 ? null : this.appliedLodLevels[c];
      (u === null || l > u) && i.push(is(e, n, u, l));
    }
    return [...a, ...i];
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
function ss(r) {
  return r instanceof $s;
}
function is(r, e, t, s) {
  const a = r.nodes[e], i = t === null ? 0 : a.levelCounts[t], o = s === null ? 0 : a.levelCounts[s], n = Math.max(0, o - i), l = Math.max(0, i - o), c = t !== null && s !== null && t !== s ? Math.min(i, o) : 0, u = 48 + r.octree.data.shCoefficientCount * bs + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: o - i,
    estimatedUploadBytes: Math.ceil(
      (n * u + l * 16 + c * 4) * Ui
    )
  };
}
function rs(r, e, t) {
  if (e.gaussianCount > t)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${t} Gaussians`
    );
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let a = 0;
  for (let i = 0; i < e.nodeIds.length; i++) {
    const o = e.nodeIds[i], n = e.lodLevels[i], c = r.nodes[o]?.levelCounts[n];
    if (c === void 0 || r.octree.nodes[o]?.isLeaf !== !0)
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
class Wi {
  allocate({ remainingGaussians: e }) {
    return e;
  }
}
class la {
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
function je(r, e, t) {
  if (r.length === 0) return [];
  r.sort((h, d) => h - d);
  const s = [];
  let a = r[0], i = a, o = 1;
  for (let h = 1; h <= r.length; h++) {
    const d = r[h];
    if (d !== i) {
      if (d !== void 0 && o++, d === i + 1) {
        i = d;
        continue;
      }
      s.push({ start: a, count: i - a + 1 }), d !== void 0 && (a = i = d);
    }
  }
  if (s.length < 2) return s;
  const n = Math.floor(o * t);
  let l = 0;
  const c = [];
  let u = { ...s[0] };
  for (let h = 1; h < s.length; h++) {
    const d = s[h], f = u.start + u.count, _ = d.start - f;
    _ <= e && l + _ <= n ? (u.count = d.start + d.count - u.start, l += _) : (c.push(u), u = { ...d });
  }
  return c.push(u), c;
}
function Ue(r) {
  let e = 0;
  for (const t of r) e += t.count;
  return e;
}
function ie(r, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      r.addUpdateRange(
        s.start * t,
        s.count * t
      );
    r.needsUpdate = !0;
  }
}
const Ms = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), Os = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), Bs = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class Fi {
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
  [Ms](e) {
    this.assertUsable();
    const t = this.packedBuffer, s = new Pe(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [Os](e) {
    ie(this.bufferAttribute, e, 1);
  }
  [Bs]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const zs = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), Es = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class Vi {
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
  [zs](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const a = new Fi(e, t);
    return this.attributes.set(e, a), a;
  }
  [Es]() {
    for (const e of this.attributes.values())
      e[Bs]();
    this.attributes.clear();
  }
}
class qi {
  constructor(e) {
    this.attribute = e;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(e) {
    this.writtenSlots.length = 0, this.attribute[Ms](new Uint32Array(e)), this.freshBuffer = !0;
  }
  backfill(e) {
    const t = this.attribute.array;
    for (const s of e.cells)
      for (const a of s.slots)
        t[a] = s.lodLevel, this.writtenSlots.push(a);
  }
  updateCell(e) {
    const { previousCell: t, cell: s, retainedCount: a } = e, i = t?.lodLevel === s.lodLevel ? a : 0, o = this.attribute.array;
    for (let n = i; n < s.slots.length; n++) {
      const l = s.slots[n];
      o[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const e = this.writtenSlots.length, t = je(this.writtenSlots, 16, 0.25), s = Ue(t);
    return this.freshBuffer || this.attribute[Os](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const Ki = 16777216;
class ca {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new Vi();
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
    this.loader = e.loader ?? new gi(), this.budgetingStrategy = e.budgetingStrategy ?? new Wi(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = Hi(
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
    const t = this.attributes[zs](
      "lodLevel",
      "u32"
    ), s = new qi(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let a = null, i = null;
    try {
      return a = St.build(s, {
        ...t.octree,
        ownsData: !0
      }), i = Ct.build(a, {
        ...t.lod,
        ownsOctree: !0
      }), this.addLod(i, {
        name: t.name ?? Xi(e),
        priority: t.priority,
        packingStrategy: t.packingStrategy,
        ownsLod: !0
      });
    } catch (o) {
      throw i !== null ? i.dispose() : a !== null ? a.dispose() : s.dispose(), o;
    }
  }
  add(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), a = ft(t.priority ?? 0), i = new es(
      this,
      s,
      0,
      t.name,
      null,
      null,
      a
    );
    return this.entries.push({
      cloud: i,
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
    }), this.cloudList.push(i), this.invalidatePacking(), i;
  }
  addLod(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), a = ft(t.priority ?? 0), i = new es(
      this,
      s,
      0,
      t.name,
      e,
      null,
      a
    ), o = t.packingStrategy ?? this.defaultPackingStrategy ?? Zi(this.defaultStreamingLod);
    return this.entries.push({
      cloud: i,
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
    }), this.cloudList.push(i), this.invalidatePacking(), i;
  }
  remove(e) {
    if (this.disposed) return;
    const t = this.entries.findIndex((a) => a.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && as(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = er(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), a = performance.now(), i = this.planPackings(s), o = performance.now() - a, n = Math.min(
      s,
      this.entries.reduce((f, _) => f + _.sourceGaussianCount, 0)
    ), l = this.packedData, c = l !== null && l.count === n && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), h = c ? this.updatePackedData(i, l) : this.buildPackedData(i, n), d = performance.now() - u;
    for (const f of i)
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
    if (!ss(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const a = performance.now(), i = s.takeNextBatch({
      lod: t.lod,
      maxGaussians: t.allocatedBudget
    }), o = performance.now() - a;
    if (i === null)
      return { applied: !1, pending: s.needsPack };
    const n = this.packedData, l = this.cellSlotsByEntry.get(t);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const c = performance.now(), u = l, h = this.freeSlots, d = this.scratchReleasedSlots;
    d.length = 0;
    const f = /* @__PURE__ */ new Map();
    for (const w of i.transitions) {
      const I = l.get(w.nodeId), j = w.lodLevel === null ? 0 : t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], M = Math.min(
        I?.slots.length ?? 0,
        j
      );
      if (f.set(w.nodeId, {
        previousCell: I,
        retainedCount: M
      }), I !== void 0)
        for (let A = M; A < I.slots.length; A++) {
          const O = I.slots[A];
          h.push(O), d.push(O);
        }
    }
    const _ = this.scratchWrittenSlots;
    _.length = 0;
    for (const w of i.transitions) {
      const I = f.get(w.nodeId), { previousCell: j, retainedCount: M } = I;
      if (w.lodLevel === null) {
        u.delete(w.nodeId);
        continue;
      }
      const A = t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], O = j?.slots, U = O !== void 0 && O.length === A ? O : new Uint32Array(A);
      U !== O && O !== void 0 && M > 0 && U.set(O.subarray(0, M));
      for (let q = M; q < A; q++) {
        const ee = h.pop();
        if (ee === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, w.nodeId, q),
          ee,
          n.means.array,
          n.scalesOpacity.array,
          n.rotations.array,
          n.shCoefficients.array,
          n.shCoefficientCount
        ), U[q] = ee, _.push(ee);
      }
      const ye = {
        lodLevel: w.lodLevel,
        slots: U
      };
      for (const q of this.attributePackers)
        q.updateCell({ previousCell: j, cell: ye, retainedCount: M });
      u.set(w.nodeId, ye);
    }
    const y = this.nextSlotMarkGeneration(n.count);
    for (const w of _) this.slotMarks[w] = y;
    const p = this.scratchClearedSlots;
    p.length = 0;
    for (const w of d)
      this.slotMarks[w] !== y && p.push(w);
    const b = n.scalesOpacity.array;
    for (const w of p) b[w * 4 + 3] = 0;
    const N = je(_, 4, 0.15), R = je(p, 16, 0.25);
    ie(n.means, N, 4), ie(n.scalesOpacity, N, 4), ie(n.scalesOpacity, R, 4), ie(n.rotations, N, 4), ie(
      n.shCoefficients,
      N,
      n.shCoefficientCount * n.shCoefficients.itemSize
    );
    const S = this.commitAttributePackers(), x = this.count - t.count + i.packing.gaussianCount, k = Ue(N), G = Ue(R), E = performance.now() - c;
    return t.count = i.packing.gaussianCount, t.packing = i.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = h, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: n.count,
      activeGaussians: x,
      reusedSlots: x - _.length,
      writtenSlots: _.length,
      clearedSlots: p.length,
      estimatedUploadBytes: k * pt(n) + G * 16 + S.estimatedUploadBytes,
      writtenSlotRanges: N,
      clearedSlotRanges: R,
      planningMs: o,
      slotUpdateMs: E
    }, { applied: !0, pending: i.pending };
  }
  planPackings(e) {
    const t = [...this.entries].sort(
      (i, o) => i.priority - o.priority || i.cloud.objectId - o.cloud.objectId
    ), s = [];
    let a = 0;
    for (const i of t) {
      const o = Math.max(0, e - a), n = this.budgetingStrategy.allocate({
        capacity: e,
        allocatedGaussians: a,
        remainingGaussians: o,
        entry: {
          cloud: i.cloud,
          priority: i.priority,
          insertionIndex: i.cloud.objectId,
          sourceGaussianCount: i.sourceGaussianCount
        }
      });
      if (Ji(n, o), i.lod === null) {
        if (i.sourceGaussianCount > n)
          throw new RangeError(
            `${i.cloud.name} requires ${i.sourceGaussianCount} Gaussians but its Store allocation is ${n}`
          );
        s.push({
          entry: i,
          count: i.sourceGaussianCount,
          packing: null,
          allocatedBudget: n,
          selectionChanged: i.packingDirty || i.allocatedBudget !== n
        }), a += i.sourceGaussianCount;
        continue;
      }
      const l = i.packingStrategy, c = i.packingDirty || i.allocatedBudget !== n || i.packing === null, u = !c && i.packing !== null ? i.packing : l.pack({
        lod: i.lod,
        maxGaussians: n
      });
      if (u.gaussianCount > n)
        throw new RangeError(
          `${l.constructor.name} exceeded its allocation of ${n} Gaussians`
        );
      Qi(i.lod, u), s.push({
        entry: i,
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
    const s = this.entries.find((i) => i.cloud === e);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const a = ft(t);
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
    let a = 0, i = !1;
    const o = [];
    for (const n of this.entries) {
      const l = n.packingStrategy;
      if (n.lod === null || l === null || !ss(l))
        continue;
      n.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(t), n.cloud.worldToLocal(t);
      const c = n.lod.octree.rootBounds.getSize(new C()).length() * 0.5, u = Math.max(0.05, c * 0.025);
      (!Number.isFinite(n.lastLodFocus.x) || t.distanceToSquared(n.lastLodFocus) >= u * u) && (l.setFromCamera(e, n.cloud), n.lastLodFocus.copy(t));
      let h = !1;
      l.needsPack && (h = this.packLodBatch(n.cloud).applied, h && a++);
      const d = l.needsPack;
      i ||= d, n.lod.octree.rootBounds.getCenter(s), o.push({
        cloud: n.cloud,
        focusDistance: t.distanceTo(s),
        applied: h,
        pending: d,
        targetStats: l.targetStats
      });
    }
    return { appliedBatches: a, pending: i, clouds: o };
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
        e.source !== null && e.ownsSource && e.source.dispose(), e.lod !== null && e.ownsLod && e.lod.dispose(), e.ownsPackingStrategy && as(e.packingStrategy), e.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[Es](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(e, t) {
    const s = this.shDegree, a = (s + 1) ** 2, i = new Float32Array(t * 4), o = new Float32Array(t * 4), n = new Float32Array(t * 4), l = new Uint32Array(t * a), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const y of e) {
      const { entry: p } = y, b = /* @__PURE__ */ new Map();
      for (const N of this.plannedCells(y)) {
        const R = new Uint32Array(N.count);
        for (let S = 0; S < N.count; S++) {
          const x = this.cellSourceIndex(p, N.nodeId, S);
          this.copySourceToSlot(
            p,
            x,
            u,
            i,
            o,
            n,
            l,
            a
          ), R[S] = u++;
        }
        b.set(N.nodeId, {
          lodLevel: N.lodLevel,
          slots: R
        });
      }
      c.set(p, b);
    }
    const h = Array.from(
      { length: t - u },
      (y, p) => t - 1 - p
    ), d = new ms(
      {
        means: Qe("3dgs.store.means-object", i),
        scalesOpacity: Qe("3dgs.store.scales-opacity", o),
        rotations: Qe("3dgs.store.rotations", n),
        shCoefficients: Qe(
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
    for (const y of this.attributePackers)
      y.allocate(t), y.backfill({ cells: f });
    const _ = this.commitAttributePackers();
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
        estimatedUploadBytes: u * pt(d) + _.estimatedUploadBytes,
        writtenSlotRanges: u === 0 ? [] : [{ start: 0, count: u }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(e, t) {
    const s = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Set();
    let i = 0;
    for (const x of e) {
      if (a.add(x.entry), i += x.count, !x.selectionChanged) continue;
      const k = /* @__PURE__ */ new Map();
      for (const G of this.plannedCells(x))
        k.set(G.nodeId, G);
      s.set(x.entry, k);
    }
    const o = [...this.freeSlots], n = this.scratchReleasedSlots;
    n.length = 0;
    for (const [x, k] of this.cellSlotsByEntry) {
      const G = s.get(x);
      if (!(G === void 0 && a.has(x)))
        for (const [E, w] of k) {
          const I = w.slots, j = Math.min(
            I.length,
            G?.get(E)?.count ?? 0
          );
          for (let M = j; M < I.length; M++) {
            const A = I[M];
            o.push(A), n.push(A);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), c = this.scratchWrittenSlots;
    c.length = 0;
    let u = 0;
    for (const x of e) {
      const k = this.cellSlotsByEntry.get(x.entry);
      if (!x.selectionChanged && k !== void 0) {
        l.set(x.entry, k), u += x.count;
        continue;
      }
      const G = /* @__PURE__ */ new Map();
      for (const E of s.get(x.entry)?.values() ?? []) {
        const w = k?.get(E.nodeId), I = w?.slots, j = Math.min(I?.length ?? 0, E.count), M = I !== void 0 && I.length === E.count ? I : new Uint32Array(E.count);
        M !== I && I !== void 0 && j > 0 && M.set(I.subarray(0, j)), u += j;
        for (let O = j; O < E.count; O++) {
          const U = o.pop();
          if (U === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            x.entry,
            this.cellSourceIndex(x.entry, E.nodeId, O),
            U,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), M[O] = U, c.push(U);
        }
        const A = {
          lodLevel: E.lodLevel,
          slots: M
        };
        for (const O of this.attributePackers)
          O.updateCell({
            previousCell: w,
            cell: A,
            retainedCount: j
          });
        G.set(E.nodeId, A);
      }
      l.set(x.entry, G);
    }
    const h = this.nextSlotMarkGeneration(t.count);
    for (const x of c) this.slotMarks[x] = h;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const x of n)
      this.slotMarks[x] !== h && d.push(x);
    const f = t.scalesOpacity.array;
    for (const x of d) f[x * 4 + 3] = 0;
    const _ = c.length, y = d.length, p = je(c, 4, 0.15), b = je(d, 16, 0.25);
    ie(t.means, p, 4), ie(t.scalesOpacity, p, 4), ie(t.scalesOpacity, b, 4), ie(t.rotations, p, 4), ie(
      t.shCoefficients,
      p,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const N = this.commitAttributePackers(), R = Ue(p), S = Ue(b);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: i,
        reusedSlots: u,
        writtenSlots: _,
        clearedSlots: y,
        estimatedUploadBytes: R * pt(t) + S * 16 + N.estimatedUploadBytes,
        writtenSlotRanges: p,
        clearedSlotRanges: b,
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
    for (const i of this.attributePackers) {
      const o = i.commit();
      e += o.writtenSlots, t += o.uploadedSlots, s += o.estimatedUploadBytes, a.push(...o.slotRanges);
    }
    return { writtenSlots: e, uploadedSlots: t, estimatedUploadBytes: s, slotRanges: a };
  }
  cellSourceIndex(e, t, s) {
    return e.lod === null ? s : e.lod.nodes[t].sortedGaussianIndices[s];
  }
  copySourceToSlot(e, t, s, a, i, o, n, l) {
    const c = e.lod?.octree.data ?? e.source;
    if (c === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    ht(c.means.array, t, a, s), ht(
      c.scalesOpacity.array,
      t,
      i,
      s
    ), ht(
      c.rotations.array,
      t,
      o,
      s
    ), a[s * 4 + 3] = e.cloud.objectId, Yi(
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
    if (e >= Ki)
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
function Qe(r, e, t = 4) {
  const s = new Pe(e, t);
  return s.name = r, s;
}
function ht(r, e, t, s) {
  t.set(
    r.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function Yi(r, e, t, s, a) {
  const i = r.shCoefficientCount, o = Math.min(
    i,
    a
  ), n = s * a;
  if (t.fill(
    0,
    n,
    n + a
  ), r.shFormat === "rgb8e8") {
    const u = e * i;
    t.set(
      r.shCoefficients.array.subarray(
        u,
        u + o
      ),
      n
    );
    return;
  }
  const l = r.shCoefficients.array, c = e * i * 4;
  for (let u = 0; u < o; u++) {
    const h = c + u * 4;
    t[n + u] = pi(
      l[h],
      l[h + 1],
      l[h + 2]
    );
  }
}
function pt(r) {
  return 48 + r.shCoefficientCount * vs(r.shFormat);
}
function Xi(r) {
  const e = r.split(/[?#]/, 1)[0] ?? r;
  return e.slice(e.lastIndexOf("/") + 1) || "GaussianCloud";
}
function ft(r) {
  if (!Number.isSafeInteger(r))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return r;
}
function Hi(r) {
  if (r !== "auto" && (!Number.isSafeInteger(r) || r <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return r;
}
function Zi(r) {
  const e = new Ii();
  return new $s(e, {
    ...r,
    targetPlanner: new Ei(e)
  });
}
function as(r) {
  r !== null && "dispose" in r && typeof r.dispose == "function" && r.dispose();
}
function Ji(r, e) {
  if (!Number.isSafeInteger(r) || r < 0 || r > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function Qi(r, e) {
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const t = /* @__PURE__ */ new Set();
  let s = 0;
  for (let a = 0; a < e.nodeIds.length; a++) {
    const i = e.nodeIds[a], o = r.nodes[i], n = r.octree.nodes[i], l = e.lodLevels[a], c = o?.levelCounts[l];
    if (c === void 0 || n === void 0)
      throw new RangeError(
        `GaussianLod packing references invalid node ${i} or level ${l}`
      );
    if (!n.isLeaf)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${i} is internal`
      );
    if (t.has(i))
      throw new Error(`GaussianLod packing contains duplicate node ${i}`);
    t.add(i), s += c;
  }
  if (s !== e.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${e.gaussianCount} Gaussians but selects ${s}`
    );
}
function er(r, e) {
  const t = ns(
    r.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = ns(r.maxBufferSize, "maxBufferSize"), a = Math.max(
    16,
    (e + 1) ** 2 * vs("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / a);
}
function ns(r, e) {
  if (!Number.isSafeInteger(r) || r <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return r;
}
const z = 16, v = 256, tr = 8192, D = 512, yt = 4, L = 1 << yt, re = 4, le = v * re, X = le, ae = 32, sr = (
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
), ir = (
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
), rr = (
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
function Ts(r, e) {
  return Math.max(1, Math.ceil(2 * r / e));
}
function ar(r, e) {
  if (r !== null) {
    if (!Number.isInteger(r) || r < v || r % v !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${v} and at least ${v}`
      );
    if (Ts(e, r) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const nr = (
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
  let radix_blocks = (count + ${le - 1}u) / ${le}u;
  let reduce_chunks = (radix_blocks + ${X - 1}u) / ${X}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${L}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${v - 1}u) / ${v}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function or(r) {
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
const lr = (
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
class ce {
  attributes = [];
  createFloat(e, t, s = 4) {
    return this.track(
      e,
      new Pe(new Float32Array(t * s), s)
    );
  }
  createUint(e, t, s = 1) {
    return this.track(
      e,
      new Pe(new Uint32Array(t * s), s)
    );
  }
  createIndirect(e) {
    return this.track(
      e,
      new ei(new Uint32Array(4), 4)
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
class cr {
  constructor(e, t, s, a, i) {
    this.renderer = e, this.visibleDispatch = i, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const o = $(
      lr
    );
    this.computeNode = o({
      rank: ne,
      state: m(i.state, "uvec4", 1).toReadOnly(),
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
    }).computeKernel([v]).setName("3DGS gather depth-ordered tile counts WGSL");
  }
  renderer;
  visibleDispatch;
  tileCounts;
  attributes = new ce();
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function As(r) {
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
  scratch: ptr<workgroup, array<u32, ${D}>>
) -> u32 {
  let base = group_id * ${D}u;
  let first = base + lane;
  let second = first + ${v}u;
  (*scratch)[lane] = ${r.readValue("first")};
  (*scratch)[lane + ${v}u] = ${r.readValue("second")};
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
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${v}u]; }
  return 0u;
}
`
  );
}
const ur = As({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (r) => `select(0u, (*input_values)[${r}], ${r} < length)`
}), dr = As({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (r) => `select(0u, 1u, ${r} < length && (*input_values)[${r}].w > 0.0)`
}), hr = (
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
class xt {
  output;
  attributes = new ce();
  levels = [];
  constructor(e, t, s = "intersections", a = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const i = $(ur), o = $(
      dr
    ), n = $(hr);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const h = Math.ceil(u / D), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        h
      ), f = W("uint", D), _ = this.levels.length === 0 && a === "projectedVisibility", y = (_ ? o : i)({
        lane: _e,
        group_id: Y.x,
        length: g(u),
        input_values: m(
          l,
          _ ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: m(c, "uint", u),
        block_sums: m(d, "uint", h),
        scratch: f
      }).computeKernel([v]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
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
      const d = this.levels[h], f = this.levels[h + 1];
      d.addNode = n({
        index: ne,
        length: g(d.length),
        values: m(d.output, "uint", d.length),
        block_offsets: m(
          f.output,
          "uint",
          f.length
        ).toReadOnly()
      }).compute(d.length, [v]).setName(`3DGS ${s} add scan offsets WGSL ${h}`);
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
class pr {
  constructor(e, t) {
    this.camera = e, this.background = t;
  }
  camera;
  background;
  projection = Te(new Re());
  view = Te(new Re());
  viewport = Te(new ti());
  tilesX = Te(1, "uint");
  tilesY = Te(1, "uint");
  update(e, t, s, a) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = a;
  }
}
function Ds(r) {
  const { center: e, conic: t, powerThreshold: s, tileX: a, tileY: i, onHit: o } = r;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${a}), f32(${i})) * ${z}.0;
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
const fr = (
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
  let radix_blocks = (count + ${le - 1}u) / ${le}u;
  let reduce_chunks = (radix_blocks + ${X - 1}u) / ${X}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${L}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${v - 1}u) / ${v}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), gr = (() => {
  const r = Ds({
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
class mr {
  constructor(e, t, s, a, i, o, n, l, c, u, h) {
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
    ).toReadOnly(), _ = m(
      i.state,
      "uvec4",
      1
    ).toReadOnly(), y = $(fr);
    this.prepareNode = y({
      item_count_state: _,
      capacity: g(s),
      tile_counts: d,
      intersection_offsets: f,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const p = $(gr);
    this.emitNode = p({
      rank: ne,
      tiles: Ve(h.tilesX, h.tilesY),
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
      intersection_offsets: f,
      visible_state: _,
      records: m(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([v]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = i;
  }
  renderer;
  capacity;
  buffers;
  dispatch;
  attributes = new ce();
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
const wt = 10;
class br {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * wt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new Pe(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Re();
  inverseModel = new Re();
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
    const t = this.frameComponentOffset + e.objectId * wt * 4;
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = vr(e, this.camera) ? 1 : 0;
  }
}
function vr(r, e) {
  if (!r.layers.test(e.layers)) return !1;
  let t = r, s = r;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof fs;
}
function _r(r) {
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
function yr(r) {
  const e = r === "rgb8e8" ? "u32" : "vec4<f32>", t = r === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (a) => {
    const i = a === 0 ? "base" : `base + ${a}u`;
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
const xr = (
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
function wr() {
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
${Ds({
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
const js = /* @__PURE__ */ new Set([
  Lt,
  Nt,
  tt,
  st,
  it,
  rt,
  Rt,
  Gt
]), Us = /* @__PURE__ */ new Set([
  ...js,
  qe,
  It
]), kr = /* @__PURE__ */ new Set([
  ...Us,
  $t,
  Mt,
  Ot,
  Bt
]);
class Sr {
  constructor(e, t, s, a, i, o = !0) {
    this.data = e, this.frame = t, this.antialiasMode = a, this.subpixelSampleCulling = o, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
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
  attributes = new ce();
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
      Is(s, Fe, "projection");
    De(
      e.gaussianPositionLocalNode,
      js,
      "gaussianPositionLocalNode"
    );
    for (const [s, a] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      De(a, Us, s);
    De(
      e.gaussianOpacityNode,
      kr,
      "gaussianOpacityNode"
    ), De(
      e.gaussianColorNode,
      Fe,
      "gaussianColorNode"
    ), De(
      e.gaussianVisibilityNode,
      Fe,
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
    const { data: t, frame: s } = this, a = m(t.means, "vec4", t.count).toReadOnly(), i = m(
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
    ), c = m(this.projectedConic, "vec4", t.count), u = m(this.projectedColor, "vec4", t.count), h = m(this.tileCounts, "uint", t.count), d = $(
      _r(this.antialiasMode)
    ), f = $(yr(t.shFormat)), _ = $(wr()), y = $(xr);
    return bt(() => {
      const b = g(ne);
      B(b.greaterThanEqual(g(t.count)), () => {
        he();
      }), h.element(b).assign(g(0)), l.element(b).assign(Q(0));
      const N = a.element(b), R = N.xyz, S = g(N.w), x = i.element(b), k = x.xyz, G = x.w, E = o.element(b), w = g(t.count).add(
        S.mul(g(wt))
      ), I = Kt(
        l.element(w),
        l.element(w.add(1)),
        l.element(w.add(2)),
        l.element(w.add(3))
      ), j = Kt(
        l.element(w.add(4)),
        l.element(w.add(5)),
        l.element(w.add(6)),
        l.element(w.add(7))
      ), M = l.element(w.add(8)).xyz, A = l.element(w.add(9)).x.greaterThan(0);
      B(A.not(), () => {
        he();
      });
      const O = /* @__PURE__ */ new Map([
        [Lt, () => b],
        [Nt, () => S],
        [tt, () => R],
        [st, () => k],
        [it, () => E],
        [rt, () => G],
        [Rt, () => I],
        [Gt, () => A]
      ]), U = ke(
        e.gaussianPositionLocalNode,
        O
      ).toVar("gaussianPositionLocalValue"), ye = I.mul(Q(U, 1)).xyz, q = new Map(O);
      q.set(qe, () => ye);
      const ee = ci(U.sub(M));
      q.set(It, () => ee);
      let Z;
      if (e.gaussianPositionWorldNode === qe)
        Z = j.mul(Q(U, 1));
      else {
        const Ee = ke(
          e.gaussianPositionWorldNode,
          q
        ).toVar("gaussianPositionWorldValue");
        Z = s.view.mul(Q(Ee, 1));
      }
      Z = Z.toVar("gaussianViewPosition");
      const Ie = ke(e.gaussianScaleNode, q).toVar(
        "gaussianScaleValue"
      ), pe = ke(
        e.gaussianRotationNode,
        q
      ).toVar("gaussianRotationValue"), te = d({
        view: Z,
        scale_input: Ie,
        rotation_input: pe,
        model_view: j,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      B(te.element(0).w.lessThanEqual(0), () => {
        he();
      });
      const se = te.element(0).xy, ue = te.element(0).z, xe = te.element(1).xyz, $e = te.element(1).w, we = te.element(2).xyz, H = te.element(2).w, oe = new Map(q);
      oe.set($t, () => ue), oe.set(Mt, () => se), oe.set(Ot, () => Se(we.xz)), oe.set(
        Bt,
        () => Se($e).mul(Math.PI)
      );
      const Ke = ke(
        e.gaussianOpacityNode,
        oe
      ).clamp(0, 1), Ce = this.antialiasMode === "compensated" ? Ke.mul(
        Se(ve(H.div($e), 0, 1))
      ) : Ke;
      B(Ce.lessThan(V(1 / 255)), () => {
        he();
      });
      const Le = ui(Ce.mul(255)), Ye = Se(
        Le.mul(2).mul(ve(we.x, 1e-12, 1e4))
      ), K = Se(
        Le.mul(2).mul(ve(we.z, 1e-12, 1e4))
      ), F = Yt(Ye), T = Yt(K);
      B(F.lessThanEqual(0).or(T.lessThanEqual(0)), () => {
        he();
      });
      const fe = be(F, T), J = se.sub(fe), de = se.add(fe);
      if (B(
        de.x.lessThan(0).or(de.y.lessThan(0)).or(J.x.greaterThanEqual(s.viewport.x)).or(J.y.greaterThanEqual(s.viewport.y)),
        () => {
          he();
        }
      ), this.subpixelSampleCulling) {
        const Ee = y({
          center: se,
          conic: xe,
          power_threshold: Le,
          extent: be(Ye, K),
          viewport: Ve(s.viewport.xy)
        });
        B(Ee.not(), () => {
          l.element(b).assign(Q(se, ue, -1)), he();
        });
      }
      const Me = We(Xt(s.tilesX), Xt(s.tilesY)).sub(1), Xe = We(
        ve(vt(J.div(V(z))), be(0), be(Me))
      ), Oe = We(
        ve(vt(de.div(V(z))), be(0), be(Me))
      ), at = f({
        gid: b,
        sh_degree: g(t.shDegree),
        direction: ee,
        sh_coefficients: n
      }), ge = new Map(oe);
      ge.set(Pt, () => at), ge.set(_s, () => J), ge.set(ys, () => de);
      const Be = ke(
        e.gaussianVisibilityNode,
        ge
      );
      B(Be.not(), () => {
        he();
      });
      const He = _({
        center: se,
        conic: xe,
        power_threshold: Le,
        tile_min: Xe,
        tile_max: Oe
      });
      B(He.equal(0), () => {
        he();
      });
      const ze = ke(
        e.gaussianColorNode,
        ge
      ).clamp(0, 1);
      l.element(b).assign(Q(se, ue, Ce)), c.element(b).assign(Q(xe, F)), u.element(b).assign(Q(ze, T)), h.element(b).assign(He);
    })().compute(t.count, [v]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function ke(r, e) {
  return r.context({ overrideNodes: e });
}
const Cr = (
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
), Lr = v, Ws = 256, Nr = [2048, 4096, 8192];
function Pr(r) {
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
  let s = 0, a = 0, i = 0, o = 0, n = 0, l = 0, c = 0, u = 0;
  for (let h = 0; h < e; h++) {
    const d = Math.max(0, r[h + 1] - r[h]);
    t[h] = d, s += d, a = Math.max(a, d), d > 256 && i++, d > 512 && o++, d > 1024 && n++, d > 2048 && l++;
    const f = Math.ceil(d / Ws);
    c += f, u = Math.max(u, f);
  }
  return t.sort(), {
    max: a,
    mean: s / e,
    median: Rr(t),
    p95: ls(t, 0.95),
    p99: ls(t, 0.99),
    tilesOver256: i,
    tilesOver512: o,
    tilesOver1024: n,
    tilesOver2048: l,
    totalBatches: c,
    maxBatches: u
  };
}
function os(r, e) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const t = Math.max(0, r.length - 1);
  let s = 0, a = 0, i = 0, o = 0, n = 0;
  for (let c = 0; c < t; c++) {
    const u = Math.max(0, r[c + 1] - r[c]), h = Math.min(u, e), d = u - h;
    s += h, a += d, d > 0 && i++;
    const f = Math.ceil(h / Ws);
    o += f, n = Math.max(n, f);
  }
  const l = s + a;
  return {
    cap: e,
    rasterizedIntersections: s,
    droppedIntersections: a,
    droppedFraction: l === 0 ? 0 : a / l,
    affectedTiles: i,
    totalBatches: o,
    maxBatches: n
  };
}
function Rr(r) {
  const e = Math.floor(r.length / 2);
  return r.length % 2 !== 0 ? r[e] : (r[e - 1] + r[e]) * 0.5;
}
function ls(r, e) {
  const t = Math.max(0, Math.ceil(r.length * e) - 1);
  return r[t];
}
class Gr {
  constructor(e, t, s, a, i, o) {
    this.renderer = e, this.maxRasterizedSplatsPerTile = o, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const n = $(Cr);
    this.computeNode = n({
      index: ne,
      gaussian_count: g(t),
      viewport: Ve(i.viewport.xy),
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
    }).compute(t, [Lr]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
  attributes = new ce();
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
    let i = 0;
    for (const n of a) i += n;
    const o = new Uint32Array(t);
    return {
      tileLoads: Pr(o),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : os(o, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: Nr.map(
        (n) => os(o, n)
      ),
      zeroPixelSubpixelSplats: i
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function Ir(r) {
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
  partials: ptr<workgroup, array<u32, ${L * ae}>>
) -> u32 {
  let block_start = block_index * ${le}u;
  let count = (*state)[0].x;
  let subgroup_count = (${v}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${L}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${re}u; item++) {
      let position = block_start + item * ${v}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${r}u) & ${L - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${ae}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${L}u) {
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
const $r = (
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
  let subgroup_count = (${v}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${X}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${re}u; item++) {
    let block = chunk_start + item * ${v}u + lane;
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
), Mr = (
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
  for (var digit = 0u; digit < ${L}u; digit++) {
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
), Or = (
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
  for (var item = 0u; item < ${re}u; item++) {
    let local = item * ${v}u + lane;
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
    for (var item = 0u; item < ${re}u; item++) {
      let worker = item * ${v}u + lane;
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
    for (var item = 0u; item < ${re}u; item++) {
      let worker = item * ${v}u + lane;
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
  for (var item = 0u; item < ${re}u; item++) {
    let local = item * ${v}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`
);
function Br(r) {
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
  block_bases: ptr<workgroup, array<u32, ${L}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${L}>>,
  partials: ptr<workgroup, array<u32, ${L * ae}>>
) -> u32 {
  let block_start = block_index * ${le}u;
  let count = (*state)[0].x;
  let subgroup_count = (${v}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${L}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${re}u; item++) {
    let position = block_start + item * ${v}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${r}u) & ${L - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${L}u; target_digit++) {
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

    if (lane < ${L}u) {
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
function zr(r) {
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
  histogram: ptr<workgroup, array<atomic<u32>, ${L}>>
) -> u32 {
  if (lane < ${L}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${le}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${re}u; item++) {
    let position = block_start + item * ${v}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${r}u) & ${L - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${L}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`
  );
}
const Er = (
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
  scratch: ptr<workgroup, array<u32, ${v}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${X}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${re}u; item++) {
    let block = chunk_start + item * ${v}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${v / 2}u;
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
function Tr(r) {
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
  block_bases: ptr<workgroup, array<u32, ${L}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${L}>>,
  shared_digits: ptr<workgroup, array<u32, ${v}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${L * (v / 32)}>>
) -> u32 {
  let block_start = block_index * ${le}u;
  let count = (*state)[0].x;
  let words_per_digit = ${v / 32}u;
  if (lane < ${L}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${re}u; item++) {
    let position = block_start + item * ${v}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${L}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${r}u) & ${L - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${L * (v / 32)}u) {
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

    if (lane < ${L}u) {
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
class cs {
  constructor(e, t, s, a, i, o) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = a, this.dispatch = i, this.backend = o, this.maxRadixBlocks = Math.ceil(s / le), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / X), this.blockHistograms = this.attributes.createUint(
      `3dgs.${t}-radix-histograms`,
      this.maxRadixBlocks * L
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${t}-radix-prefixes`,
      this.maxRadixBlocks * L
    ), this.reduced = this.attributes.createUint(
      `3dgs.${t}-radix-reduced`,
      this.maxReduceChunks * L
    );
    const n = m(i.state, "uvec4", 1).toReadOnly(), l = m(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), c = $(
      o === "subgroup" ? $r : Er
    ), u = {
      lane: _e,
      group_id: Y,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: m(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (u.subgroup_index = nt, u.subgroup_lane = ot, u.subgroup_size = lt, u.partials = W("uint", ae)) : u.scratch = W("uint", v), this.reduceNode = c(u).computeKernel([v]).setName(`3DGS ${t} radix reduce WGSL`);
    const h = $(Mr);
    this.scanReducedNode = h({
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      reduced: m(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const d = $(
      Or
    );
    this.scanAddNode = d({
      lane: _e,
      group_id: Y,
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
      scratch: W("uint", X)
    }).computeKernel([v]).setName(`3DGS ${t} radix scan-add WGSL`), this.sortedRecords = a.recordsA;
  }
  renderer;
  label;
  capacity;
  buffers;
  dispatch;
  backend;
  sortedRecords;
  attributes = new ce();
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
    const t = Math.ceil(Math.max(0, e) / yt);
    this.passes = Array.from(
      { length: t },
      (s, a) => this.createPass(a, a * yt)
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
    const s = e % 2 === 0, a = s ? this.buffers.recordsA : this.buffers.recordsB, i = s ? this.buffers.recordsB : this.buffers.recordsA, o = m(this.dispatch.state, "uvec4", 1).toReadOnly(), n = m(
      a,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = $(
      this.backend === "subgroup" ? Ir(t) : zr(t)
    ), c = {
      lane: _e,
      block_index: Y.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records: n,
      block_histograms: m(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (c.subgroup_index = nt, c.subgroup_lane = ot, c.subgroup_size = lt, c.partials = W(
      "uint",
      L * ae
    )) : c.histogram = W("atomic<u32>", L);
    const u = l(c).computeKernel([v]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), h = $(
      this.backend === "subgroup" ? Br(t) : Tr(t)
    ), d = {
      lane: _e,
      block_index: Y.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records_in: n,
      records_out: m(i, "uvec2", this.capacity),
      block_prefixes: m(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: W("uint", L),
      local_digit_counts: W("uint", L)
    };
    this.backend === "subgroup" ? (d.subgroup_index = nt, d.subgroup_lane = ot, d.subgroup_size = lt, d.partials = W(
      "uint",
      L * ae
    )) : (d.shared_digits = W("uint", v), d.shared_digit_masks = W(
      "uint",
      L * (v / 32)
    ));
    const f = h(d).computeKernel([v]).setName(`3DGS ${this.label} radix scatter WGSL ${e}`);
    return { histogram: u, scatter: f };
  }
  disposePasses() {
    for (const e of this.passes)
      e.histogram.dispose(), e.scatter.dispose();
    this.passes = [];
  }
}
const Ar = (
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
function Dr(r) {
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
const jr = (
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
  let second_local = lane + ${v}u;
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
), Ur = (
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
class Wr {
  attributes = new ce();
  levels = [];
  constructor(e, t) {
    const s = $(jr), a = $(Ur);
    let i = e, o = t;
    for (; ; ) {
      const n = this.levels.length, l = Math.ceil(o / D), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${n}`,
        l
      ), u = s({
        lane: _e,
        group_id: Y.x,
        length: g(o),
        values: m(i, "uint", o),
        block_mins: m(c, "uint", l),
        scratch: W("uint", D)
      }).computeKernel([v]).setName(`3DGS tile offset suffix scan WGSL ${n}`);
      if (this.levels.push({
        length: o,
        blockCount: l,
        values: i,
        scanNode: u
      }), l <= 1) break;
      i = c, o = l;
    }
    for (let n = 0; n < this.levels.length - 1; n++) {
      const l = this.levels[n], c = this.levels[n + 1];
      l.addNode = a({
        index: ne,
        length: g(l.length),
        block_count: g(c.length),
        values: m(l.values, "uint", l.length),
        block_suffix_mins: m(
          c.values,
          "uint",
          c.length
        ).toReadOnly()
      }).compute(l.length, [v]).setName(`3DGS tile add suffix block mins WGSL ${n}`);
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
class Fr {
  constructor(e, t, s, a, i) {
    this.renderer = e, this.dispatch = i, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = m(this.offsets, "uint", s + 1), n = $(Ar);
    this.clearNode = n({
      index: ne,
      tile_count: g(s),
      state: m(i.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [v]).setName("3DGS clear tile offsets WGSL");
    const l = $(
      Dr(t)
    );
    this.boundariesNode = l({
      index: ne,
      tile_count: g(s),
      state: m(i.state, "uvec4", 1).toReadOnly(),
      records: m(
        a,
        "uvec2",
        a.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([v]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new Wr(this.offsets, s + 1);
  }
  renderer;
  dispatch;
  offsets;
  attributes = new ce();
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
const us = (
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
), Vr = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${v}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class qr {
  constructor(e, t, s, a, i, o, n, l, c, u, h, d, f, _, y, p, b) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = a, this.meansAttribute = i, this.projectedMeanAttribute = o, this.projectedConicAttribute = n, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = h, this.depthTexture = d, this.frame = f, this.maxSplatsPerTile = _, this.rasterChunkSize = y, this.tileCount = p, this.chunks = this.createChunkSchedule(), this.rebuild(b);
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
  attributes = new ce();
  chunks;
  computeNode = null;
  chunkComputeNode = null;
  compositeNode = null;
  rebuild(e) {
    for (const i of [
      e.rasterColorNode,
      e.rasterAlphaNode,
      e.rasterDiscardNode
    ])
      Is(i, Dt, "raster");
    const t = this.createRasterNode(e, "direct"), s = this.chunks === null ? null : this.createRasterNode(e, "chunk"), a = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = t, this.chunkComputeNode = s, this.compositeNode = a;
  }
  encode(e, t) {
    if (this.computeNode === null)
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
    this.computeNode?.dispose(), this.computeNode = null, this.chunkComputeNode?.dispose(), this.chunkComputeNode = null, this.compositeNode?.dispose(), this.compositeNode = null, this.chunks?.countNode.dispose(), this.chunks?.prepareNode.dispose(), this.chunks?.emitNode.dispose(), this.chunks?.offsets.dispose(), this.attributes.dispose();
  }
  createChunkSchedule() {
    if (this.rasterChunkSize === null) return null;
    const e = Ts(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new xt(
      t,
      this.tileCount,
      "raster-chunks"
    ), a = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), i = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), o = e * v, n = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
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
    ).toReadOnly(), _ = $(sr)({
      tile: ne,
      tile_count: g(this.tileCount),
      chunk_size: g(this.rasterChunkSize),
      sample_limit: g(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [v]).setName("3DGS count exact raster chunks WGSL"), p = $(
      ir
    )({
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      dispatch: m(i, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), N = $(rr)({
      tile: ne,
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      tasks: m(a, "uvec2", e)
    }).compute(this.tileCount, [v]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: t,
      offsets: s,
      tasks: a,
      dispatch: i,
      partialData: l,
      partialStride: n,
      countNode: _,
      prepareNode: p,
      emitNode: N
    };
  }
  createRasterNode(e, t) {
    const s = m(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), a = m(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), i = m(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), o = m(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), n = m(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), l = m(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), c = W("vec4", v), u = W("vec4", v), h = W("vec4", v), d = W("uint", v), f = W("uint", v), _ = t === "direct" ? _t(this.colorTexture) : null, y = $(us), p = $(Vr), b = this.chunks, N = t === "chunk" && b !== null ? m(b.tasks, "uvec2", b.tasks.count).toReadOnly() : null, R = t === "chunk" && b !== null ? m(b.partialData, "vec4", b.partialData.count) : null, { frame: S } = this;
    return bt(() => {
      const k = g(_e), G = y({ value: k }), E = y({ value: k.shiftRight(1) }), w = g(Y.x), I = (t === "direct" ? Y.y.mul(S.tilesX).add(Y.x) : N.element(w).x).toVar("rasterTile"), j = t === "chunk" ? N.element(w).y : g(0), M = t === "direct" ? Y.x : I.mod(S.tilesX), A = t === "direct" ? Y.y : I.div(S.tilesX), O = Ve(
        M.mul(g(z)).add(G),
        A.mul(g(z)).add(E)
      ).toVar("rasterPixelCoordinateValue"), U = O.x.lessThan(g(S.viewport.x)).and(O.y.lessThan(g(S.viewport.y))).toVar("rasterActivePixel"), ye = l.element(I), q = l.element(I.add(1)), ee = g(q.sub(ye)), Z = ee.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const H = g(this.maxSplatsPerTile);
        Z.assign(Ne(ee.lessThan(H), ee, H));
      }
      let Ie = g(0);
      const pe = Z.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        pe.assign(
          Ne(
            Z.greaterThan(g(this.rasterChunkSize)),
            g(0),
            Z
          )
        );
      else if (t === "chunk") {
        Ie = j.mul(g(this.rasterChunkSize)).toVar("rasterSampleStart");
        const H = Ie.add(g(this.rasterChunkSize));
        pe.assign(
          Ne(H.lessThan(Z), H, Z)
        );
      }
      const te = be(O).add(0.5), se = et(0).toVar("accumulated"), ue = V(1).toVar("transmittance"), xe = V(1).toVar("depth"), $e = me(!1).toVar("depthWritten"), we = me(!1).toVar("done");
      Ae(
        {
          start: Ie,
          end: pe,
          type: "uint",
          condition: "<",
          update: `+= ${v}`
        },
        ({ i: H }) => {
          const oe = H.add(k);
          B(oe.lessThan(pe), () => {
            let K = oe;
            this.maxSplatsPerTile !== null && (K = g(
              vt(
                V(oe).add(0.5).mul(V(ee)).div(V(Z))
              )
            ));
            const F = ye.add(K).toVar("rasterSourceRecordIndex"), T = n.element(F).y, fe = a.element(T), J = i.element(T);
            c.element(k).assign(fe), u.element(k).assign(Q(J.xyz, fe.w.mul(255).log())), h.element(k).assign(o.element(T)), d.element(k).assign(T);
          }), B(k.equal(0), () => {
            f.element(g(0)).assign(
              Ne(
                H.add(g(v)).lessThan(pe),
                g(1),
                g(0)
              )
            );
          });
          const Ke = p({ values: f }).toVar("hasNextBatch"), Ce = g(pe.sub(H)), Le = Ne(
            Ce.lessThan(g(v)),
            Ce,
            g(v)
          );
          B(U.and(we.not()), () => {
            Ae(
              {
                start: g(0),
                end: Le,
                type: "uint",
                condition: "<"
              },
              ({ i: K }) => {
                const F = c.element(K), T = te.sub(F.xy), fe = u.element(K), J = fe.xyz, de = J.x.mul(T.x.mul(T.x)).add(J.y.mul(2).mul(T.x).mul(T.y)).add(J.z.mul(T.y.mul(T.y))).mul(-0.5);
                B(
                  de.greaterThan(0).or(de.lessThan(fe.w.negate())),
                  () => {
                    ct();
                  }
                );
                const Me = d.element(K), Xe = Se(Ht(J.x, 1e-12)), Oe = J.y.div(Xe), at = Se(Ht(J.z.sub(Oe.mul(Oe)), 1e-12)), ge = be(
                  Xe.mul(T.x).add(Oe.mul(T.y)),
                  at.mul(T.y)
                ), Be = /* @__PURE__ */ new Map([
                  [zt, () => Me],
                  [xs, () => g(s.element(Me).w)],
                  [ws, () => O],
                  [ks, () => te],
                  [Ss, () => te.div(S.viewport.xy)],
                  [Cs, () => F.xy],
                  [Ls, () => T],
                  [Ns, () => ge],
                  [Ps, () => ge.div(6).add(0.5)],
                  [Rs, () => F.z],
                  [
                    Et,
                    () => h.element(K).xyz
                  ],
                  [Tt, () => F.w],
                  [At, () => de],
                  [Gs, () => gs(de)]
                ]), He = gt(e.rasterDiscardNode, Be);
                B(He, () => {
                  ct();
                });
                const ze = ve(
                  gt(e.rasterAlphaNode, Be),
                  0,
                  0.99
                );
                B(ze.lessThan(V(1 / 255)), () => {
                  ct();
                }), B($e.not(), () => {
                  xe.assign(Kr(F.z, S)), $e.assign(me(!0));
                });
                const Ee = gt(e.rasterColorNode, Be);
                se.addAssign(Ee.mul(ue).mul(ze)), ue.mulAssign(V(1).sub(ze)), B(ue.lessThan(1e-4), () => {
                  we.assign(me(!0)), Ze();
                });
              }
            );
          }), B(Ke.equal(0), () => {
            Ze();
          }), f.element(k).assign(Ne(U.and(we.not()), g(1), g(0))), Zt(), B(k.lessThan(8), () => {
            const K = k.mul(32), F = g(0).toVar("subgroupActive");
            Ae(
              { start: g(0), end: g(32), type: "uint", condition: "<" },
              ({ i: T }) => {
                F.bitOrAssign(
                  f.element(K.add(T))
                );
              }
            ), f.element(k).assign(F);
          }), Zt(), B(k.equal(0), () => {
            const K = g(0).toVar("tileActiveReduction");
            Ae(
              { start: g(0), end: g(8), type: "uint", condition: "<" },
              ({ i: F }) => {
                K.bitOrAssign(f.element(g(F)));
              }
            ), f.element(g(0)).assign(K);
          });
          const Ye = p({ values: f });
          B(Ye.equal(0), () => {
            Ze();
          });
        }
      ), B(U, () => {
        if (t === "direct")
          ds(
            se,
            ue,
            xe,
            O,
            _,
            this.depthTexture,
            S
          );
        else {
          const H = w.mul(g(v)).add(k).mul(g(b.partialStride));
          R.element(H).assign(Q(se, ue)), this.depthTexture !== null && R.element(H.add(1)).assign(Q(xe, 0, 0, 0));
        }
      });
    })().computeKernel([z, z]).setName(
      t === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const e = this.chunks, t = m(
      e.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), s = m(
      e.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), a = m(
      e.partialData,
      "vec4",
      e.partialData.count
    ).toReadOnly(), i = _t(this.colorTexture), o = $(us), { frame: n } = this;
    return bt(() => {
      const c = g(_e), u = o({ value: c }), h = o({ value: c.shiftRight(1) }), d = Y.y.mul(n.tilesX).add(Y.x), f = t.element(d), _ = Ve(
        Y.x.mul(g(z)).add(u),
        Y.y.mul(g(z)).add(h)
      ), y = _.x.lessThan(g(n.viewport.x)).and(_.y.lessThan(g(n.viewport.y)));
      B(y.and(f.greaterThan(0)), () => {
        const p = et(0).toVar("chunkCompositeColor"), b = V(1).toVar("chunkCompositeTransmittance"), N = V(1).toVar("chunkCompositeDepth"), R = me(!1).toVar("chunkCompositeDepthWritten"), S = s.element(d);
        Ae(
          {
            start: g(0),
            end: f,
            type: "uint",
            condition: "<"
          },
          ({ i: x }) => {
            const k = S.add(x).mul(g(v)).add(c).mul(g(e.partialStride)), G = a.element(k);
            p.addAssign(G.xyz.mul(b)), this.depthTexture !== null && B(R.not().and(G.w.lessThan(1)), () => {
              N.assign(a.element(k.add(1)).x), R.assign(me(!0));
            }), b.mulAssign(G.w), B(b.lessThan(1e-4), () => {
              Ze();
            });
          }
        ), ds(
          p,
          b,
          N,
          _,
          i,
          this.depthTexture,
          n
        );
      });
    })().computeKernel([z, z]).setName("3DGS exact raster chunk composite TSL");
  }
}
function Kr(r, e) {
  const t = r.negate();
  return ve(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function ds(r, e, t, s, a, i, o) {
  const n = ve(V(o.background[3]), 0, 1);
  r.addAssign(
    et(o.background[0], o.background[1], o.background[2]).mul(e).mul(n)
  );
  const l = V(1).sub(e.mul(V(1).sub(n)));
  Jt(a, We(s), Q(r, l)), i !== null && Jt(
    _t(i),
    We(s),
    Q(t, 0, 0, 1)
  );
}
function gt(r, e) {
  return r.context({ overrideNodes: e });
}
class Yr {
  constructor(e, t, s, a, i, o) {
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
    ).toReadOnly(), l = $(
      nr
    );
    this.prepareNode = l({
      gaussian_count: g(s),
      projected_mean: m(
        i,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: n,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const c = $(
      or(t)
    );
    this.compactNode = c({
      gid: ne,
      gaussian_count: g(s),
      viewport: o,
      visible_offsets: n,
      projected_mean: m(
        i,
        "vec4",
        s
      ).toReadOnly(),
      records: m(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [v]).setName(`3DGS compact visible Gaussians WGSL (${t})`);
  }
  renderer;
  buffers;
  dispatch;
  attributes = new ce();
  prepareNode;
  compactNode;
  encode(e = !1) {
    e ? (this.renderer.compute(this.prepareNode), this.renderer.compute(this.compactNode)) : this.renderer.compute([this.prepareNode, this.compactNode]);
  }
  dispose() {
    this.prepareNode.dispose(), this.compactNode.dispose(), this.attributes.dispose();
  }
}
class Xr {
  constructor(e, t, s, a, i, o, n, l, c, u, h, d, f, _) {
    this.renderer = e, this.data = s, this.mode = i, this.capacity = n, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = d, this.radixBackend = f, this.nodes = _, this.frame = new pr(t, l), this.objects = new br(t, a, s.count), this.projection = new Sr(
      s,
      this.frame,
      this.objects,
      o,
      _,
      d
    ), this.profileDiagnostics = c ? new Gr(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new xt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new Yr(
      e,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new cs(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      f
    ), this.depthSorter.configure(i === "float32" ? 32 : 16), this.orderedTiles = new cr(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new xt(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new mr(
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
    ), this.sorter = new cs(
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
    const [e, t] = await Promise.all([
      this.intersections.readStats(),
      this.profileDiagnostics.readStats(this.tileOffsets.offsets)
    ]);
    return {
      ...e,
      profile: t
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
    const i = Math.ceil(e / z), o = Math.ceil(t / z), n = i * o;
    if (i > 65535 || o > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, n + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new Fr(
      this.renderer,
      this.mode,
      n,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new qr(
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
      this.nodes
    ), this.width = e, this.height = t, this.tilesX = i, this.tilesY = o, this.frame.update(e, t, i, o), this.tileStageRebuilds++;
  }
}
function Hr(r, e) {
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
const mt = new oi();
class Zr extends Wt {
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
  nodeSlots = Pi();
  dirtyStages = 0;
  disposed = !1;
  constructor(e, t, s, a = {}) {
    super(Wt.COLOR, new fs(), t, {
      type: Ft,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const i = a.depthSortMode ?? "float32", o = a.antialiasMode ?? "compensated", n = a.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    const l = Hr(
      n,
      e.hasFeature("subgroups")
    ), c = a.intersectionCapacity ?? null;
    if (c !== null && (!Number.isInteger(c) || c <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (c !== null && c > v * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const u = a.maxRasterizedSplatsPerTile ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const h = a.rasterChunkSize === void 0 ? tr : a.rasterChunkSize;
    ar(
      h,
      c ?? v * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = i, this.antialiasMode = o, this.requestedIntersectionCapacity = c, this.background = a.background ?? [0, 0, 0, 0], this.outputDepth = a.outputDepth ?? !1, this.colorSpace = a.colorSpace ?? si, this.profileKernels = a.profileKernels ?? !1, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = a.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new Vt(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = Ft, this.colorTexture.colorSpace = ii, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new Vt(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = ri, this.depthTexture.type = ai, this.depthTexture.minFilter = qt, this.depthTexture.magFilter = qt, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    return this.workingColorNode ??= di(
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
    if (!(this.camera instanceof ni))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    t.getDrawingBufferSize(mt);
    const s = Math.max(1, Math.floor(mt.x)), a = Math.max(1, Math.floor(mt.y));
    (this.renderTarget.width !== s || this.renderTarget.height !== a) && this.setSize(s, a), this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: Jr(t) });
    const i = this.gaussianStore.updateLod(this.camera), o = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      v * 65535,
      Math.max(1, o.count * 16)
    )), t.initRenderTarget(this.renderTarget), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), o.count > v * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new Xr(
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
        lod: i
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
    hs(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateProjection());
  }
  setRasterNode(e, t) {
    hs(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateRasterizer());
  }
}
function hs(r, e) {
  if (r?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function Jr(r) {
  const e = r.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device.limits;
}
function ua(r, e, t, s) {
  return new Zr(r, e, t, s);
}
export {
  gi as CanonicalGaussianPlyLoader,
  oa as DistanceAwareRadialLodPackingStrategy,
  hi as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  es as GaussianCloud,
  ms as GaussianData,
  Ct as GaussianLod,
  ra as GaussianLodColorHelper,
  ts as GaussianLodNode,
  St as GaussianOctree,
  _i as GaussianOctreeNode,
  Zr as GaussianPass,
  ca as GaussianStore,
  Vi as GaussianStoreAttributes,
  Fi as GaussianStorePackedAttribute,
  ia as LodHelper,
  aa as MaximumLodPackingStrategy,
  sa as OctreeHelper,
  bs as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  na as RadialLodPackingStrategy,
  Ei as RadialLodWorkerPlanner,
  Wi as RemainingCapacityBudgetStrategy,
  la as SourceFractionBudgetStrategy,
  $s as StreamingLodPackingStrategy,
  Ii as TieredRadialLodPackingStrategy,
  Pt as gaussianColor,
  Lt as gaussianIndex,
  Nt as gaussianObjectId,
  Rt as gaussianObjectMatrix,
  Gt as gaussianObjectVisible,
  rt as gaussianOpacity,
  ua as gaussianPass,
  tt as gaussianPositionLocal,
  qe as gaussianPositionWorld,
  Bt as gaussianProjectedArea,
  Ot as gaussianProjectedSigma,
  it as gaussianRotation,
  st as gaussianScale,
  ys as gaussianScreenBoundsMax,
  _s as gaussianScreenBoundsMin,
  Mt as gaussianScreenPosition,
  $t as gaussianViewDepth,
  It as gaussianViewDirection,
  ss as isStreamingLodPackingStrategy,
  pi as packShRgb8e8,
  Cs as rasterGaussianCenter,
  Et as rasterGaussianColor,
  Ns as rasterGaussianCoord,
  zt as rasterGaussianIndex,
  Tt as rasterGaussianOpacity,
  xs as rasterObjectId,
  ws as rasterPixelCoordinate,
  Ls as rasterPixelDelta,
  At as rasterPower,
  ks as rasterScreenPosition,
  Ss as rasterScreenUV,
  Ps as rasterUV,
  Rs as rasterViewDepth,
  Gs as rasterWeight,
  vs as shBytesPerCoefficient,
  ta as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
