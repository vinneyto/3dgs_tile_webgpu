import { StorageBufferAttribute as ze, Vector3 as P, Quaternion as kr, Box3 as Yt, Object3D as js, Matrix4 as De, Ray as Sr, LineSegments as Cr, BufferGeometry as Nr, Float32BufferAttribute as Us, LineBasicMaterial as Lr, BoxGeometry as Pr, MeshBasicMaterial as Rr, DoubleSide as Ws, InstancedMesh as Gr, Color as Vs, IndirectStorageBufferAttribute as Mr, Vector4 as Ir, Scene as ut, PassNode as ot, HalfFloatType as Ut, SRGBColorSpace as Fs, StorageTexture as bs, NoColorSpace as Tr, RedFormat as Ar, FloatType as Br, NearestFilter as vs, PerspectiveCamera as qs, Vector2 as Ks, Mesh as Or, InstancedBufferGeometry as zr, MeshBasicNodeMaterial as Dr, WebGPUCoordinateSystem as ys } from "three/webgpu";
import { property as I, bool as he, exp as Xt, float as j, storage as b, uint as g, vec3 as lt, mix as $r, wgslFn as B, instanceIndex as te, workgroupArray as F, workgroupId as Z, invocationLocalIndex as ke, uniform as Me, uvec2 as $e, Fn as Ie, If as M, Return as me, vec4 as K, mat4 as xs, normalize as Er, sqrt as se, clamp as _e, log as Wt, ceil as _s, vec2 as ee, ivec2 as Ze, int as ws, floor as Vt, subgroupIndex as Gt, invocationSubgroupIndex as Mt, subgroupSize as It, atomicStore as jr, storageTexture as Ft, select as ye, Loop as qe, Break as Ke, Continue as Tt, max as xe, workgroupBarrier as ks, atomicAdd as Oe, textureStore as Ss, colorSpaceToWorking as Hs, uvec4 as Ur, varying as it, positionLocal as Cs, screenCoordinate as Wr, Discard as At, perspectiveDepthToViewZ as Vr, viewZToOrthographicDepth as Fr } from "three/tsl";
class Ys {
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
const qr = 16, Xs = 4;
function Kr(a, e, t) {
  const s = Math.max(Math.abs(a), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const r = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), i = 127 / 2 ** r, o = Bt(a, i), n = Bt(e, i), l = Bt(t, i), c = r + 127;
  return (o | n << 8 | l << 16 | c << 24) >>> 0;
}
function Ba(a) {
  const e = 2 ** ((a >>> 24) - 127) / 127;
  return [
    Ot(a) * e,
    Ot(a >>> 8) * e,
    Ot(a >>> 16) * e
  ];
}
function Zs(a) {
  return a === "rgb8e8" ? Xs : qr;
}
function Bt(a, e) {
  return Math.min(127, Math.max(-127, Math.round(a * e))) & 255;
}
function Ot(a) {
  const e = a & 255;
  return e < 128 ? e : e - 256;
}
const Ns = {
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
}, Hr = [
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
class Yr {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = Xr(e), s = new Map(
      t.properties.map((f, y) => [f.name, y])
    );
    for (const f of Hr)
      if (!s.has(f))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${f}`);
    const r = t.properties.map((f) => f.name.match(/^f_rest_(\d+)$/)?.[1]).filter((f) => f !== void 0).map(Number).sort((f, y) => f - y);
    for (let f = 0; f < r.length; f++)
      if (r[f] !== f)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const i = r.length / 3, o = i + 1, n = Math.sqrt(o);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = Zr(e, t), c = (f) => s.get(f), u = r.map(
      (f) => c(`f_rest_${f}`)
    ), h = t.vertexCount, d = new Float32Array(h * 4), p = new Float32Array(h * 4), m = new Float32Array(h * 4), v = new Float32Array(h * o * 4);
    for (let f = 0; f < h; f++) {
      const y = f * 4;
      d[y] = l(f, c("x")), d[y + 1] = l(f, c("y")), d[y + 2] = l(f, c("z")), p[y] = Math.max(
        Math.exp(l(f, c("scale_0"))),
        1e-6
      ), p[y + 1] = Math.max(
        Math.exp(l(f, c("scale_1"))),
        1e-6
      ), p[y + 2] = Math.max(
        Math.exp(l(f, c("scale_2"))),
        1e-6
      );
      const S = l(f, c("opacity"));
      p[y + 3] = 1 / (1 + Math.exp(-S));
      const w = l(f, c("rot_0")), L = l(f, c("rot_1")), _ = l(f, c("rot_2")), C = l(f, c("rot_3")), G = Math.hypot(L, _, C, w);
      G > 1e-12 ? (m[y] = L / G, m[y + 1] = _ / G, m[y + 2] = C / G, m[y + 3] = w / G) : m[y + 3] = 1;
      const N = f * o * 4;
      v[N] = l(f, c("f_dc_0")), v[N + 1] = l(f, c("f_dc_1")), v[N + 2] = l(f, c("f_dc_2"));
      for (let k = 1; k < o; k++) {
        const T = N + k * 4, z = k - 1;
        for (let A = 0; A < 3; A++) {
          const $ = u[A * i + z];
          v[T + A] = l(
            f,
            $
          );
        }
      }
    }
    return new Ys(
      {
        means: at("ply.means", d),
        scalesOpacity: at("ply.scales-opacity", p),
        rotations: at("ply.rotations-xyzw", m),
        shCoefficients: at("ply.sh-coefficients", v)
      },
      {
        count: h,
        shDegree: n - 1,
        ownsBuffers: !0
      }
    );
  }
}
function at(a, e) {
  const t = new ze(e, 4);
  return t.name = a, t;
}
function Xr(a) {
  const e = new Uint8Array(a), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let m = 0; m <= e.length - t.length; m++) {
    let v = !0;
    for (let f = 0; f < t.length; f++)
      if (e[m + f] !== t[f]) {
        v = !1;
        break;
      }
    if (v) {
      s = m;
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
  for (const m of o) {
    const v = m.trim().split(/\s+/);
    if (v[0] === "format") {
      if (v[1] !== "ascii" && v[1] !== "binary_little_endian" && v[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${v[1] ?? "unknown"}`);
      n = v[1];
    } else if (v[0] === "element") {
      l = v[1] ?? "";
      const f = Number(v[2]);
      if (!Number.isInteger(f) || f < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: f }), l === "vertex" && (c = f);
    } else if (v[0] === "property" && l === "vertex") {
      if (v[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const f = v[1], y = v[2];
      if (!(f in Ns) || y === void 0)
        throw new Error(`Unsupported vertex property: ${m}`);
      h.push({ name: y, type: f, byteOffset: u }), u += Ns[f];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (c <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (m) => m.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: c, properties: h, vertexStride: u, dataOffset: r };
}
function Zr(a, e) {
  if (e.format === "ascii") {
    const i = new TextDecoder().decode(
      new Uint8Array(a, e.dataOffset)
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
  if (e.dataOffset + e.vertexCount * e.vertexStride > a.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(a), r = e.format === "binary_little_endian";
  return (i, o) => {
    const n = e.properties[o], l = e.dataOffset + i * e.vertexStride + n.byteOffset;
    return Qr(s, l, n.type, r);
  };
}
function Qr(a, e, t, s) {
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
const Ls = 1 / 255, Jr = 0.99, zt = 1e-12;
function ei(a, e, t, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const r = e.means.array, i = e.scalesOpacity.array, o = e.rotations.array, n = new P(), l = new P(), c = new P(), u = new kr();
  let h = 1;
  for (const d of t) {
    const p = d.gaussianIndex * 4, m = Math.min(1, Math.max(0, i[p + 3]));
    if (m < Ls) continue;
    u.set(
      -o[p],
      -o[p + 1],
      -o[p + 2],
      o[p + 3]
    ).normalize(), n.set(
      a.origin.x - r[p],
      a.origin.y - r[p + 1],
      a.origin.z - r[p + 2]
    ).applyQuaternion(u), l.copy(a.direction).applyQuaternion(u);
    const v = Math.max(i[p], zt), f = Math.max(i[p + 1], zt), y = Math.max(i[p + 2], zt);
    n.set(
      n.x / v,
      n.y / f,
      n.z / y
    ), l.set(
      l.x / v,
      l.y / f,
      l.z / y
    );
    const S = l.lengthSq();
    if (S <= Number.EPSILON) continue;
    const w = Math.max(
      0,
      -n.dot(l) / S
    );
    c.copy(n).addScaledVector(l, w);
    const L = Math.min(
      Jr,
      m * Math.exp(-0.5 * c.lengthSq())
    );
    if (L < Ls || (h *= 1 - L, 1 - h < s)) continue;
    const _ = a.at(w, new P());
    return {
      gaussianIndex: d.gaussianIndex,
      distance: a.origin.distanceTo(_),
      point: _
    };
  }
  return null;
}
class ti {
  constructor(e, t, s, r, i, o, n, l) {
    this.id = e, this.depth = t, this.bounds = s, this.count = r, this.maxSplatRadius = i, this.raycastBounds = l, this.children = o, this.gaussianIndices = n;
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
class Zt {
  constructor(e, t, s, r) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = r, this.bounds = si(e), this.rootBounds = ri(this.bounds);
    const i = e.means.array, o = e.scalesOpacity.array, n = [], l = [], c = Array.from({ length: e.count }, (h, d) => d), u = (h, d, p) => {
      const m = n.length;
      n.push(null);
      const v = h.length > t && p < s && d.max.x - d.min.x > Number.EPSILON, f = [];
      if (v) {
        const w = d.getCenter(new P()), L = Array.from({ length: 8 }, () => []);
        for (const _ of h) {
          const C = _ * 4, G = (i[C] >= w.x ? 1 : 0) | (i[C + 1] >= w.y ? 2 : 0) | (i[C + 2] >= w.z ? 4 : 0);
          L[G].push(_);
        }
        for (let _ = 0; _ < 8; _++) {
          const C = L[_];
          C.length !== 0 && f.push(
            u(
              C,
              ii(d, w, _),
              p + 1
            )
          );
        }
      }
      let y = 0;
      if (f.length > 0)
        for (const w of f)
          y = Math.max(
            y,
            n[w].maxSplatRadius
          );
      else {
        for (const w of h) {
          const L = w * 4;
          y = Math.max(
            y,
            o[L],
            o[L + 1],
            o[L + 2]
          );
        }
        l.push(m);
      }
      const S = d.clone().expandByScalar(y * 3);
      return n[m] = new ti(
        m,
        p,
        d,
        h.length,
        y,
        f,
        f.length === 0 ? Uint32Array.from(h) : null,
        S
      ), m;
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
    return new Zt(
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
    const i = [], o = [this.rootNode];
    for (; o.length > 0; ) {
      const n = this.nodes[o.pop()], l = Math.max(0, s - 3) * n.maxSplatRadius, c = l === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(l);
      if (e.intersectsBox(c))
        if (n.gaussianIndices !== null)
          for (const u of n.gaussianIndices) i.push(u);
        else
          for (const u of n.children) o.push(u);
    }
    return this.raycastIndices(e, i, s, r);
  }
  raycastIndices(e, t, s = 3, r = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(r > 0)) return [];
    const i = this.data.means.array, o = this.data.scalesOpacity.array, n = new P(), l = new P(), c = [];
    for (let u = 0; u < t.length; u++) {
      const h = t[u], d = h * 4;
      n.set(i[d], i[d + 1], i[d + 2]);
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
    return c.sort((u, h) => u.distance - h.distance), c.length > r && (c.length = r), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function si(a) {
  const e = a.means.array, t = new Yt(), s = new P();
  for (let r = 0; r < a.count; r++) {
    const i = r * 4;
    s.set(e[i], e[i + 1], e[i + 2]), t.expandByPoint(s);
  }
  return t;
}
function ri(a) {
  const e = a.getCenter(new P()), t = a.getSize(new P()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new Yt(
    new P(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new P(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function ii(a, e, t) {
  return new Yt(
    new P(
      t & 1 ? e.x : a.min.x,
      t & 2 ? e.y : a.min.y,
      t & 4 ? e.z : a.min.z
    ),
    new P(
      t & 1 ? a.max.x : e.x,
      t & 2 ? a.max.y : e.y,
      t & 4 ? a.max.z : e.z
    )
  );
}
class Ps extends js {
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
  constructor(e, t, s, r = "GaussianCloud", i = null, o = null, n = 0) {
    super(), this.ownerStore = e, this.objectId = t, this.packedGaussianCount = s, this.lod = i, this.packing = o, this.priority = n, this.name = r;
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
    const s = new De().copy(this.matrixWorld).invert(), r = new Sr().copy(e.ray).applyMatrix4(s), i = this.raycastMode === "full" ? this.lod.octree.raycast(r) : this.lod.raycast(r, this.packing), o = ei(
      r,
      this.lod.octree.data,
      i,
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
class Oa extends Cr {
  constructor(e, t = {}) {
    const s = t.minDepth ?? 0, r = t.maxDepth ?? 1 / 0, i = e.nodes.filter(
      (h) => h.depth >= s && h.depth <= r && (t.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(i.length * 12 * 2 * 3);
    let n = 0;
    for (const h of i) {
      const { min: d, max: p } = h.bounds, m = [
        [d.x, d.y, d.z],
        [p.x, d.y, d.z],
        [p.x, p.y, d.z],
        [d.x, p.y, d.z],
        [d.x, d.y, p.z],
        [p.x, d.y, p.z],
        [p.x, p.y, p.z],
        [d.x, p.y, p.z]
      ];
      for (const [v, f] of ai)
        o.set(m[v], n), o.set(m[f], n + 3), n += 6;
    }
    const l = new Nr();
    l.setAttribute("position", new Us(o, 3)), l.computeBoundingSphere();
    const c = t.opacity ?? 0.55, u = new Lr({
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
const ai = [
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
class Rs {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const ni = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class Qt {
  constructor(e, t) {
    this.octree = e, this.levels = oi(t.levels ?? ni), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? li, r = new Float64Array(e.data.count);
    for (let i = 0; i < r.length; i++) {
      const o = s(i, e);
      r[i] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((i) => {
      if (i.gaussianIndices === null)
        return new Rs(
          i.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(i.gaussianIndices).sort(
          (n, l) => r[l] - r[n] || n - l
        )
      );
      return new Rs(
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
    return new Qt(e, t);
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
    const i = s.maxHits ?? 1 / 0;
    if (!(i > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const o = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, l = new P(), c = new P(), u = [], h = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.nodeIds.length; d++) {
      const p = t.nodeIds[d], m = this.getLeafNode(p);
      if (h.has(p))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${p}`
        );
      h.add(p);
      const v = t.lodLevels[d], f = m.levelCounts[v];
      if (f === void 0)
        throw new RangeError(`GaussianLod level ${v} does not exist`);
      const y = this.octree.nodes[p], S = Math.max(0, r - 3) * y.maxSplatRadius, w = S === 0 ? y.raycastBounds : y.raycastBounds.clone().expandByScalar(S);
      if (e.intersectsBox(w))
        for (let L = 0; L < f; L++) {
          const _ = m.sortedGaussianIndices[L], C = _ * 4;
          l.set(o[C], o[C + 1], o[C + 2]);
          const G = Math.max(
            n[C],
            n[C + 1],
            n[C + 2]
          ) * r;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > G * G) && u.push({
            gaussianIndex: _,
            distance: e.origin.distanceTo(c),
            point: c.clone()
          });
        }
    }
    return u.sort((d, p) => d.distance - p.distance), u.length > i && (u.length = i), u;
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
function oi(a) {
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
function li(a, e) {
  const t = e.data.scalesOpacity.array, s = a * 4, r = [t[s], t[s + 1], t[s + 2]];
  return r.sort((i, o) => o - i), t[s + 3] * r[0] * r[1];
}
const ci = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class za extends js {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : ci, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: e.levelCount }, (r, i) => i)
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
    for (let i = 0; i < this.packing.nodeIds.length; i++) {
      const o = this.packing.lodLevels[i], n = e[o];
      if (n === void 0)
        throw new RangeError(`Gaussian LOD level ${o} does not exist`);
      n.push(this.packing.nodeIds[i]);
    }
    const t = new P(), s = new P(), r = new De();
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (o.length === 0) continue;
      const n = new Pr(1, 1, 1), l = new Rr({
        color: this.colors[i % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: Ws,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new Gr(n, l, o.length);
      for (let u = 0; u < o.length; u++) {
        const h = this.lod.octree.nodes[o[u]].bounds;
        h.getCenter(t), h.getSize(s), r.makeScale(s.x, s.y, s.z), r.setPosition(t), c.setMatrixAt(u, r);
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
const Jt = I("uint", "gaussianIndex"), es = I("uint", "gaussianObjectId"), dt = I("vec3", "gaussianPositionLocal"), Je = I("vec3", "gaussianPositionWorld"), ht = I("vec3", "gaussianScale"), pt = I("vec4", "gaussianRotation"), ft = I("float", "gaussianOpacity"), ts = I("vec3", "gaussianColor"), ss = I("mat4", "gaussianObjectMatrix"), rs = I("bool", "gaussianObjectVisible"), is = I("vec3", "gaussianViewDirection"), as = I("float", "gaussianViewDepth"), ns = I(
  "vec2",
  "gaussianScreenPosition"
), Qs = I(
  "vec2",
  "gaussianScreenBoundsMin"
), Js = I(
  "vec2",
  "gaussianScreenBoundsMax"
), os = I(
  "vec2",
  "gaussianProjectedSigma"
), ls = I("float", "gaussianProjectedArea"), tt = I("uint", "rasterGaussianIndex"), gt = I("uint", "rasterObjectId"), mt = I("uvec2", "rasterPixelCoordinate"), bt = I("vec2", "rasterScreenPosition"), vt = I("vec2", "rasterScreenUV"), yt = I("float", "rasterPixelValue"), xt = I("vec2", "rasterGaussianCenter"), _t = I("vec2", "rasterPixelDelta"), cs = I("vec2", "rasterGaussianCoord"), us = I("vec2", "rasterUV"), wt = I("float", "rasterViewDepth"), kt = I("vec3", "rasterGaussianColor"), St = I("float", "rasterGaussianOpacity"), Ct = I("float", "rasterPower"), ds = I("float", "rasterWeight");
function er() {
  return {
    gaussianPositionLocalNode: dt,
    gaussianPositionWorldNode: Je,
    gaussianScaleNode: ht,
    gaussianRotationNode: pt,
    gaussianOpacityNode: ft,
    gaussianColorNode: ts,
    gaussianVisibilityNode: he(!0),
    rasterPixelValueNode: j(0),
    rasterBreakNode: he(!1),
    rasterColorNode: kt,
    rasterAlphaNode: St.mul(Xt(Ct)),
    rasterDiscardNode: he(!1)
  };
}
const Qe = /* @__PURE__ */ new Set([
  Jt,
  es,
  dt,
  Je,
  ht,
  pt,
  ft,
  ts,
  ss,
  rs,
  is,
  as,
  ns,
  Qs,
  Js,
  os,
  ls
]), et = /* @__PURE__ */ new Set([
  tt,
  gt,
  mt,
  bt,
  vt,
  yt,
  xt,
  _t,
  cs,
  us,
  wt,
  kt,
  St,
  Ct,
  ds
]), tr = /* @__PURE__ */ new Set([
  mt,
  bt,
  vt
]), ui = /* @__PURE__ */ new Set([
  ...tr,
  yt,
  tt,
  gt,
  xt,
  _t,
  wt
]);
function hs(a, e, t) {
  a.traverse((s) => {
    if ((Qe.has(s) || et.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function we(a, e, t) {
  a.traverse((s) => {
    if ((Qe.has(s) || et.has(s)) && !e.has(s))
      throw new Error(
        `GaussianPass.${t} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const di = [
  15228264,
  15906891,
  4900235
];
class Da {
  constructor(e, t = {}) {
    if (this.pass = e, t.colors !== void 0 && t.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = t.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...t.colors ?? di], this.tintStrength = s, this.lodLevelAttribute = e.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = e.subscribeDebug(() => this.update()), this.enabled = t.enabled ?? !0;
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
    const e = this.lodLevelAttribute.bufferAttribute, t = b(e, "uint", e.count).toReadOnly().element(tt).mod(g(this.colors.length)), s = this.colors.map((o) => {
      const n = new Vs(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return lt(n.r, n.g, n.b);
    });
    let r = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      r = t.equal(g(o)).select(s[o], r);
    const i = $r(
      this.baseColorNode,
      r,
      j(this.tintStrength)
    );
    this.boundBuffer = e, this.helperColorNode = i, this.pass.rasterColorNode = i;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function Ee(a) {
  if (!Number.isInteger(a) || a < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class $a {
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
    const r = e.octree.leafNodeIds.slice(), i = new Uint8Array(r.length);
    return i.fill(e.finestLevel), { nodeIds: r, lodLevels: i, gaussianCount: s };
  }
}
function ps(a, e, t) {
  return a.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), a.getWorldPosition(t), e.worldToLocal(t);
}
function fs(a, e) {
  const t = e instanceof P ? e.clone() : a.octree.bounds.getCenter(new P()), s = a.octree.rootBounds.getSize(new P()), r = Math.max(s.length() * 0.5, Number.EPSILON), i = new P(), o = Array.from(a.octree.leafNodeIds, (n) => (a.octree.nodes[n].bounds.getCenter(i), {
    nodeId: n,
    radius: i.distanceTo(t) / r
  }));
  return o.sort(
    (n, l) => n.radius - l.radius || n.nodeId - l.nodeId
  ), o;
}
class Ea {
  cameraCenter = new P();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof P ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof P ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ps(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ee(t), t === 0) return hi();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const r = fs(e, this.center), i = [];
    let o = 0;
    for (const l of r) {
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
function hi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class pi {
  cameraCenter = new P();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof P ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = fi(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof P ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ps(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ee(t), t === 0) return gi();
    const s = e.octree.data.count;
    if (s <= t) {
      const h = e.octree.leafNodeIds.slice(), d = new Uint8Array(h.length);
      return d.fill(e.finestLevel), { nodeIds: h, lodLevels: d, gaussianCount: s };
    }
    const r = fs(e, this.center), i = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], o = [], n = [];
    let l = 0, c = 0, u = 0;
    for (let h = 0; h < i.length; h++) {
      const d = this.budgetShares[h];
      if (u += d, d === 0) continue;
      const p = h === i.length - 1 ? t : Math.floor(t * u), m = i[h];
      for (; c < r.length; ) {
        const v = r[c], f = e.nodes[v.nodeId].levelCounts[m];
        if (l + f > p) break;
        o.push(v.nodeId), n.push(m), l += f, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(n),
      gaussianCount: l
    };
  }
}
function fi(a) {
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
function gi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class ja {
  cameraCenter = new P();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof P ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof P ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ps(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (Ee(t), t === 0) return mi();
    const s = fs(e, this.center), r = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let i = s.reduce(
      (n, l, c) => n + e.nodes[l.nodeId].levelCounts[r[c]],
      0
    );
    for (let n = s.length - 1; n >= 0 && i > t; n--) {
      const l = e.nodes[s[n].nodeId];
      for (; r[n] > 0 && i > t; ) {
        const c = l.levelCounts[r[n]];
        r[n] = r[n] - 1, i -= c - l.levelCounts[r[n]];
      }
    }
    let o = s.length;
    for (; o > 0 && i > t; ) {
      o--;
      const n = e.nodes[s[o].nodeId];
      i -= n.levelCounts[r[o]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, o).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(r.slice(0, o)),
      gaussianCount: i
    };
  }
}
function mi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
function bi(a) {
  const e = new Uint32Array(a.octree.leafNodeIds), t = new Float64Array(e.length * 3), s = new Uint32Array(e.length * a.levelCount);
  for (let n = 0; n < e.length; n++) {
    const l = e[n], c = a.octree.nodes[l].bounds, u = n * 3;
    t[u] = (c.min.x + c.max.x) * 0.5, t[u + 1] = (c.min.y + c.max.y) * 0.5, t[u + 2] = (c.min.z + c.max.z) * 0.5, s.set(a.nodes[l].levelCounts, n * a.levelCount);
  }
  const r = a.octree.rootBounds.max.x - a.octree.rootBounds.min.x, i = a.octree.rootBounds.max.y - a.octree.rootBounds.min.y, o = a.octree.rootBounds.max.z - a.octree.rootBounds.min.z;
  return {
    leafNodeIds: e,
    leafCenters: t,
    levelCounts: s,
    levelCount: a.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        r * r + i * i + o * o
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const sr = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, Gs = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", sr], { type: "text/javascript;charset=utf-8" });
function vi(a) {
  let e;
  try {
    if (e = Gs && (self.URL || self.webkitURL).createObjectURL(Gs), !e) throw "";
    const t = new Worker(e, {
      name: a?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(sr),
      {
        name: a?.name
      }
    );
  }
}
const yi = 2;
class xi {
  constructor(e) {
    this.targetStrategy = e;
  }
  targetStrategy;
  worker = null;
  boundsCenter = new P();
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
    this.worker = new vi({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const t = bi(e), s = Array.from(
      { length: yi },
      () => _i(t.leafNodeIds.length)
    ), r = {
      type: "init",
      data: t,
      buffers: s
    };
    this.worker.postMessage(r, [
      t.leafNodeIds.buffer,
      t.leafCenters.buffer,
      t.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: i, lodLevels: o }) => [i, o])
    ]);
  }
  request(e) {
    this.assertUsable(), this.initialize(e.lod), this.initializeWorker(), this.releaseLatestResult();
    const t = this.targetStrategy.center instanceof P ? this.targetStrategy.center : e.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
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
      packing: wi(t),
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
function _i(a) {
  return {
    nodeIds: new ArrayBuffer(a * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(a * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function wi(a) {
  return {
    nodeIds: new Uint32Array(a.buffer.nodeIds, 0, a.length),
    lodLevels: new Uint8Array(a.buffer.lodLevels, 0, a.length),
    gaussianCount: a.gaussianCount
  };
}
const ki = 1024 * 1024, Si = 16, Ci = 1.25;
class rr {
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
    if (this.targetStrategy = e, this.targetPlanner = t.targetPlanner ?? null, this.maxUploadBytesPerPack = t.maxUploadBytesPerPack ?? ki, this.maxChangedCellsPerPack = t.maxChangedCellsPerPack ?? Si, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
      const r = this.changes[this.changeCursor], i = t.length >= this.maxChangedCellsPerPack || s + r.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (t.length > 0 && i && this.appliedGaussianCount <= e.maxGaussians)
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
    return Ts(e.lod, t, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.targetDirty = !1, t;
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
        Ts(e.lod, t.packing, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.changes = this.planChanges(e.lod, t.packing), this.changeCursor = 0, this.latestTargetPlanningMs = t.planningMs, this.latestTargetRoundTripMs = t.roundTripMs;
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
    const r = [], i = [];
    for (let o = this.appliedCellCount - 1; o >= 0; o--) {
      const n = this.appliedNodeIds[o], l = this.appliedLodLevels[o], c = s[n];
      (c < 0 || c < l) && r.push(
        Is(
          e,
          n,
          l,
          c < 0 ? null : c
        )
      );
    }
    for (let o = 0; o < t.nodeIds.length; o++) {
      const n = t.nodeIds[o], l = t.lodLevels[o], c = this.appliedIndices[n], u = c < 0 ? null : this.appliedLodLevels[c];
      (u === null || l > u) && i.push(Is(e, n, u, l));
    }
    return [...r, ...i];
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
function Ms(a) {
  return a instanceof rr;
}
function Is(a, e, t, s) {
  const r = a.nodes[e], i = t === null ? 0 : r.levelCounts[t], o = s === null ? 0 : r.levelCounts[s], n = Math.max(0, o - i), l = Math.max(0, i - o), c = t !== null && s !== null && t !== s ? Math.min(i, o) : 0, u = 48 + a.octree.data.shCoefficientCount * Xs + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: o - i,
    estimatedUploadBytes: Math.ceil(
      (n * u + l * 16 + c * 4) * Ci
    )
  };
}
function Ts(a, e, t) {
  if (e.gaussianCount > t)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${t} Gaussians`
    );
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  for (let i = 0; i < e.nodeIds.length; i++) {
    const o = e.nodeIds[i], n = e.lodLevels[i], c = a.nodes[o]?.levelCounts[n];
    if (c === void 0 || a.octree.nodes[o]?.isLeaf !== !0)
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
class Ni {
  allocate({ remainingGaussians: e }) {
    return e;
  }
}
class Ua {
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
function Ye(a, e, t) {
  if (a.length === 0) return [];
  a.sort((h, d) => h - d);
  const s = [];
  let r = a[0], i = r, o = 1;
  for (let h = 1; h <= a.length; h++) {
    const d = a[h];
    if (d !== i) {
      if (d !== void 0 && o++, d === i + 1) {
        i = d;
        continue;
      }
      s.push({ start: r, count: i - r + 1 }), d !== void 0 && (r = i = d);
    }
  }
  if (s.length < 2) return s;
  const n = Math.floor(o * t);
  let l = 0;
  const c = [];
  let u = { ...s[0] };
  for (let h = 1; h < s.length; h++) {
    const d = s[h], p = u.start + u.count, m = d.start - p;
    m <= e && l + m <= n ? (u.count = d.start + d.count - u.start, l += m) : (c.push(u), u = { ...d });
  }
  return c.push(u), c;
}
function Xe(a) {
  let e = 0;
  for (const t of a) e += t.count;
  return e;
}
function ae(a, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      a.addUpdateRange(
        s.start * t,
        s.count * t
      );
    a.needsUpdate = !0;
  }
}
const ir = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), ar = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), nr = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class Li {
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
  [ir](e) {
    this.assertUsable();
    const t = this.packedBuffer, s = new ze(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [ar](e) {
    ae(this.bufferAttribute, e, 1);
  }
  [nr]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const or = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), lr = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class Pi {
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
  [or](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const r = new Li(e, t);
    return this.attributes.set(e, r), r;
  }
  [lr]() {
    for (const e of this.attributes.values())
      e[nr]();
    this.attributes.clear();
  }
}
class Ri {
  constructor(e) {
    this.attribute = e;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(e) {
    this.writtenSlots.length = 0, this.attribute[ir](new Uint32Array(e)), this.freshBuffer = !0;
  }
  backfill(e) {
    const t = this.attribute.array;
    for (const s of e.cells)
      for (const r of s.slots)
        t[r] = s.lodLevel, this.writtenSlots.push(r);
  }
  updateCell(e) {
    const { previousCell: t, cell: s, retainedCount: r } = e, i = t?.lodLevel === s.lodLevel ? r : 0, o = this.attribute.array;
    for (let n = i; n < s.slots.length; n++) {
      const l = s.slots[n];
      o[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const e = this.writtenSlots.length, t = Ye(this.writtenSlots, 16, 0.25), s = Xe(t);
    return this.freshBuffer || this.attribute[ar](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const Gi = 16777216;
class Wa {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new Pi();
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
    this.loader = e.loader ?? new Yr(), this.budgetingStrategy = e.budgetingStrategy ?? new Ni(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = Ti(
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
    const t = this.attributes[or](
      "lodLevel",
      "u32"
    ), s = new Ri(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let r = null, i = null;
    try {
      return r = Zt.build(s, {
        ...t.octree,
        ownsData: !0
      }), i = Qt.build(r, {
        ...t.lod,
        ownsOctree: !0
      }), this.addLod(i, {
        name: t.name ?? Ii(e),
        priority: t.priority,
        packingStrategy: t.packingStrategy,
        ownsLod: !0
      });
    } catch (o) {
      throw i !== null ? i.dispose() : r !== null ? r.dispose() : s.dispose(), o;
    }
  }
  add(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), r = Et(t.priority ?? 0), i = new Ps(
      this,
      s,
      0,
      t.name,
      null,
      null,
      r
    );
    return this.entries.push({
      cloud: i,
      count: 0,
      sourceGaussianCount: e.count,
      sourceDegree: e.shDegree,
      priority: r,
      packingStrategy: null,
      ownsPackingStrategy: !1,
      lastLodFocus: new P(Number.NaN, Number.NaN, Number.NaN),
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
    const s = this.allocateObjectId(), r = Et(t.priority ?? 0), i = new Ps(
      this,
      s,
      0,
      t.name,
      e,
      null,
      r
    ), o = t.packingStrategy ?? this.defaultPackingStrategy ?? Ai(this.defaultStreamingLod);
    return this.entries.push({
      cloud: i,
      count: 0,
      sourceGaussianCount: e.octree.data.count,
      sourceDegree: e.octree.data.shDegree,
      priority: r,
      packingStrategy: o,
      ownsPackingStrategy: t.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new P(Number.NaN, Number.NaN, Number.NaN),
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
    const t = this.entries.findIndex((r) => r.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && As(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = zi(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), r = performance.now(), i = this.planPackings(s), o = performance.now() - r, n = Math.min(
      s,
      this.entries.reduce((p, m) => p + m.sourceGaussianCount, 0)
    ), l = this.packedData, c = l !== null && l.count === n && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), h = c ? this.updatePackedData(i, l) : this.buildPackedData(i, n), d = performance.now() - u;
    for (const p of i)
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
    const t = this.entries.find((k) => k.cloud === e);
    if (t === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    if (t.lod === null || t.packing === null || t.allocatedBudget === null)
      throw new Error("GaussianCloud is not an initialized LOD entry");
    const s = t.packingStrategy;
    if (!Ms(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const r = performance.now(), i = s.takeNextBatch({
      lod: t.lod,
      maxGaussians: t.allocatedBudget
    }), o = performance.now() - r;
    if (i === null)
      return { applied: !1, pending: s.needsPack };
    const n = this.packedData, l = this.cellSlotsByEntry.get(t);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const c = performance.now(), u = l, h = this.freeSlots, d = this.scratchReleasedSlots;
    d.length = 0;
    const p = /* @__PURE__ */ new Map();
    for (const k of i.transitions) {
      const T = l.get(k.nodeId), z = k.lodLevel === null ? 0 : t.lod.nodes[k.nodeId].levelCounts[k.lodLevel], A = Math.min(
        T?.slots.length ?? 0,
        z
      );
      if (p.set(k.nodeId, {
        previousCell: T,
        retainedCount: A
      }), T !== void 0)
        for (let $ = A; $ < T.slots.length; $++) {
          const D = T.slots[$];
          h.push(D), d.push(D);
        }
    }
    const m = this.scratchWrittenSlots;
    m.length = 0;
    for (const k of i.transitions) {
      const T = p.get(k.nodeId), { previousCell: z, retainedCount: A } = T;
      if (k.lodLevel === null) {
        u.delete(k.nodeId);
        continue;
      }
      const $ = t.lod.nodes[k.nodeId].levelCounts[k.lodLevel], D = z?.slots, H = D !== void 0 && D.length === $ ? D : new Uint32Array($);
      H !== D && D !== void 0 && A > 0 && H.set(D.subarray(0, A));
      for (let W = A; W < $; W++) {
        const ue = h.pop();
        if (ue === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, k.nodeId, W),
          ue,
          n.means.array,
          n.scalesOpacity.array,
          n.rotations.array,
          n.shCoefficients.array,
          n.shCoefficientCount
        ), H[W] = ue, m.push(ue);
      }
      const ce = {
        lodLevel: k.lodLevel,
        slots: H
      };
      for (const W of this.attributePackers)
        W.updateCell({ previousCell: z, cell: ce, retainedCount: A });
      u.set(k.nodeId, ce);
    }
    const v = this.nextSlotMarkGeneration(n.count);
    for (const k of m) this.slotMarks[k] = v;
    const f = this.scratchClearedSlots;
    f.length = 0;
    for (const k of d)
      this.slotMarks[k] !== v && f.push(k);
    const y = n.scalesOpacity.array;
    for (const k of f) y[k * 4 + 3] = 0;
    const S = Ye(m, 4, 0.15), w = Ye(f, 16, 0.25);
    ae(n.means, S, 4), ae(n.scalesOpacity, S, 4), ae(n.scalesOpacity, w, 4), ae(n.rotations, S, 4), ae(
      n.shCoefficients,
      S,
      n.shCoefficientCount * n.shCoefficients.itemSize
    );
    const L = this.commitAttributePackers(), _ = this.count - t.count + i.packing.gaussianCount, C = Xe(S), G = Xe(w), N = performance.now() - c;
    return t.count = i.packing.gaussianCount, t.packing = i.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = h, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: n.count,
      activeGaussians: _,
      reusedSlots: _ - m.length,
      writtenSlots: m.length,
      clearedSlots: f.length,
      estimatedUploadBytes: C * $t(n) + G * 16 + L.estimatedUploadBytes,
      writtenSlotRanges: S,
      clearedSlotRanges: w,
      planningMs: o,
      slotUpdateMs: N
    }, { applied: !0, pending: i.pending };
  }
  planPackings(e) {
    const t = [...this.entries].sort(
      (i, o) => i.priority - o.priority || i.cloud.objectId - o.cloud.objectId
    ), s = [];
    let r = 0;
    for (const i of t) {
      const o = Math.max(0, e - r), n = this.budgetingStrategy.allocate({
        capacity: e,
        allocatedGaussians: r,
        remainingGaussians: o,
        entry: {
          cloud: i.cloud,
          priority: i.priority,
          insertionIndex: i.cloud.objectId,
          sourceGaussianCount: i.sourceGaussianCount
        }
      });
      if (Bi(n, o), i.lod === null) {
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
        }), r += i.sourceGaussianCount;
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
      Oi(i.lod, u), s.push({
        entry: i,
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
    const s = this.entries.find((i) => i.cloud === e);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const r = Et(t);
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
    const t = new P(), s = new P();
    let r = 0, i = !1;
    const o = [];
    for (const n of this.entries) {
      const l = n.packingStrategy;
      if (n.lod === null || l === null || !Ms(l))
        continue;
      n.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(t), n.cloud.worldToLocal(t);
      const c = n.lod.octree.rootBounds.getSize(new P()).length() * 0.5, u = Math.max(0.05, c * 0.025);
      (!Number.isFinite(n.lastLodFocus.x) || t.distanceToSquared(n.lastLodFocus) >= u * u) && (l.setFromCamera(e, n.cloud), n.lastLodFocus.copy(t));
      let h = !1;
      l.needsPack && (h = this.packLodBatch(n.cloud).applied, h && r++);
      const d = l.needsPack;
      i ||= d, n.lod.octree.rootBounds.getCenter(s), o.push({
        cloud: n.cloud,
        focusDistance: t.distanceTo(s),
        applied: h,
        pending: d,
        targetStats: l.targetStats
      });
    }
    return { appliedBatches: r, pending: i, clouds: o };
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
        e.source !== null && e.ownsSource && e.source.dispose(), e.lod !== null && e.ownsLod && e.lod.dispose(), e.ownsPackingStrategy && As(e.packingStrategy), e.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[lr](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(e, t) {
    const s = this.shDegree, r = (s + 1) ** 2, i = new Float32Array(t * 4), o = new Float32Array(t * 4), n = new Float32Array(t * 4), l = new Uint32Array(t * r), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const v of e) {
      const { entry: f } = v, y = /* @__PURE__ */ new Map();
      for (const S of this.plannedCells(v)) {
        const w = new Uint32Array(S.count);
        for (let L = 0; L < S.count; L++) {
          const _ = this.cellSourceIndex(f, S.nodeId, L);
          this.copySourceToSlot(
            f,
            _,
            u,
            i,
            o,
            n,
            l,
            r
          ), w[L] = u++;
        }
        y.set(S.nodeId, {
          lodLevel: S.lodLevel,
          slots: w
        });
      }
      c.set(f, y);
    }
    const h = Array.from(
      { length: t - u },
      (v, f) => t - 1 - f
    ), d = new Ys(
      {
        means: nt("3dgs.store.means-object", i),
        scalesOpacity: nt("3dgs.store.scales-opacity", o),
        rotations: nt("3dgs.store.rotations", n),
        shCoefficients: nt(
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
    for (const v of this.attributePackers)
      v.allocate(t), v.backfill({ cells: p });
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
        estimatedUploadBytes: u * $t(d) + m.estimatedUploadBytes,
        writtenSlotRanges: u === 0 ? [] : [{ start: 0, count: u }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(e, t) {
    const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set();
    let i = 0;
    for (const _ of e) {
      if (r.add(_.entry), i += _.count, !_.selectionChanged) continue;
      const C = /* @__PURE__ */ new Map();
      for (const G of this.plannedCells(_))
        C.set(G.nodeId, G);
      s.set(_.entry, C);
    }
    const o = [...this.freeSlots], n = this.scratchReleasedSlots;
    n.length = 0;
    for (const [_, C] of this.cellSlotsByEntry) {
      const G = s.get(_);
      if (!(G === void 0 && r.has(_)))
        for (const [N, k] of C) {
          const T = k.slots, z = Math.min(
            T.length,
            G?.get(N)?.count ?? 0
          );
          for (let A = z; A < T.length; A++) {
            const $ = T[A];
            o.push($), n.push($);
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
      const G = /* @__PURE__ */ new Map();
      for (const N of s.get(_.entry)?.values() ?? []) {
        const k = C?.get(N.nodeId), T = k?.slots, z = Math.min(T?.length ?? 0, N.count), A = T !== void 0 && T.length === N.count ? T : new Uint32Array(N.count);
        A !== T && T !== void 0 && z > 0 && A.set(T.subarray(0, z)), u += z;
        for (let D = z; D < N.count; D++) {
          const H = o.pop();
          if (H === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            _.entry,
            this.cellSourceIndex(_.entry, N.nodeId, D),
            H,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), A[D] = H, c.push(H);
        }
        const $ = {
          lodLevel: N.lodLevel,
          slots: A
        };
        for (const D of this.attributePackers)
          D.updateCell({
            previousCell: k,
            cell: $,
            retainedCount: z
          });
        G.set(N.nodeId, $);
      }
      l.set(_.entry, G);
    }
    const h = this.nextSlotMarkGeneration(t.count);
    for (const _ of c) this.slotMarks[_] = h;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const _ of n)
      this.slotMarks[_] !== h && d.push(_);
    const p = t.scalesOpacity.array;
    for (const _ of d) p[_ * 4 + 3] = 0;
    const m = c.length, v = d.length, f = Ye(c, 4, 0.15), y = Ye(d, 16, 0.25);
    ae(t.means, f, 4), ae(t.scalesOpacity, f, 4), ae(t.scalesOpacity, y, 4), ae(t.rotations, f, 4), ae(
      t.shCoefficients,
      f,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const S = this.commitAttributePackers(), w = Xe(f), L = Xe(y);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: i,
        reusedSlots: u,
        writtenSlots: m,
        clearedSlots: v,
        estimatedUploadBytes: w * $t(t) + L * 16 + S.estimatedUploadBytes,
        writtenSlotRanges: f,
        clearedSlotRanges: y,
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
    for (const i of this.attributePackers) {
      const o = i.commit();
      e += o.writtenSlots, t += o.uploadedSlots, s += o.estimatedUploadBytes, r.push(...o.slotRanges);
    }
    return { writtenSlots: e, uploadedSlots: t, estimatedUploadBytes: s, slotRanges: r };
  }
  cellSourceIndex(e, t, s) {
    return e.lod === null ? s : e.lod.nodes[t].sortedGaussianIndices[s];
  }
  copySourceToSlot(e, t, s, r, i, o, n, l) {
    const c = e.lod?.octree.data ?? e.source;
    if (c === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    Dt(c.means.array, t, r, s), Dt(
      c.scalesOpacity.array,
      t,
      i,
      s
    ), Dt(
      c.rotations.array,
      t,
      o,
      s
    ), r[s * 4 + 3] = e.cloud.objectId, Mi(
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
    if (e >= Gi)
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
function nt(a, e, t = 4) {
  const s = new ze(e, t);
  return s.name = a, s;
}
function Dt(a, e, t, s) {
  t.set(
    a.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function Mi(a, e, t, s, r) {
  const i = a.shCoefficientCount, o = Math.min(
    i,
    r
  ), n = s * r;
  if (t.fill(
    0,
    n,
    n + r
  ), a.shFormat === "rgb8e8") {
    const u = e * i;
    t.set(
      a.shCoefficients.array.subarray(
        u,
        u + o
      ),
      n
    );
    return;
  }
  const l = a.shCoefficients.array, c = e * i * 4;
  for (let u = 0; u < o; u++) {
    const h = c + u * 4;
    t[n + u] = Kr(
      l[h],
      l[h + 1],
      l[h + 2]
    );
  }
}
function $t(a) {
  return 48 + a.shCoefficientCount * Zs(a.shFormat);
}
function Ii(a) {
  const e = a.split(/[?#]/, 1)[0] ?? a;
  return e.slice(e.lastIndexOf("/") + 1) || "GaussianCloud";
}
function Et(a) {
  if (!Number.isSafeInteger(a))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return a;
}
function Ti(a) {
  if (a !== "auto" && (!Number.isSafeInteger(a) || a <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return a;
}
function Ai(a) {
  const e = new pi();
  return new rr(e, {
    ...a,
    targetPlanner: new xi(e)
  });
}
function As(a) {
  a !== null && "dispose" in a && typeof a.dispose == "function" && a.dispose();
}
function Bi(a, e) {
  if (!Number.isSafeInteger(a) || a < 0 || a > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function Oi(a, e) {
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const t = /* @__PURE__ */ new Set();
  let s = 0;
  for (let r = 0; r < e.nodeIds.length; r++) {
    const i = e.nodeIds[r], o = a.nodes[i], n = a.octree.nodes[i], l = e.lodLevels[r], c = o?.levelCounts[l];
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
function zi(a, e) {
  const t = Bs(
    a.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Bs(a.maxBufferSize, "maxBufferSize"), r = Math.max(
    16,
    (e + 1) ** 2 * Zs("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / r);
}
function Bs(a, e) {
  if (!Number.isSafeInteger(a) || a <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return a;
}
const O = 16, x = 256, Di = 8192, U = 512, qt = 4, R = 1 << qt, ne = 4, pe = x * ne, Q = pe, oe = 32, $i = (
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
), Ei = (
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
), ji = (
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
function cr(a, e) {
  return Math.max(1, Math.ceil(2 * a / e));
}
function Ui(a, e) {
  if (a !== null) {
    if (!Number.isInteger(a) || a < x || a % x !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${x} and at least ${x}`
      );
    if (cr(e, a) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const Wi = (
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
  let radix_blocks = (count + ${pe - 1}u) / ${pe}u;
  let reduce_chunks = (radix_blocks + ${Q - 1}u) / ${Q}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${R}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${x - 1}u) / ${x}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Vi(a) {
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
const Fi = (
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
class le {
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
      new Mr(new Uint32Array(4), 4)
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
class qi {
  constructor(e, t, s, r, i) {
    this.renderer = e, this.visibleDispatch = i, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const o = B(
      Fi
    );
    this.computeNode = o({
      rank: te,
      state: b(i.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: b(
        r,
        "uvec2",
        t
      ).toReadOnly(),
      tile_counts: b(
        s,
        "uint",
        t
      ).toReadOnly(),
      ordered_tile_counts: b(this.tileCounts, "uint", t)
    }).computeKernel([x]).setName("3DGS gather depth-ordered tile counts WGSL");
  }
  renderer;
  visibleDispatch;
  tileCounts;
  attributes = new le();
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function ur(a) {
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
  scratch: ptr<workgroup, array<u32, ${U}>>
) -> u32 {
  let base = group_id * ${U}u;
  let first = base + lane;
  let second = first + ${x}u;
  (*scratch)[lane] = ${a.readValue("first")};
  (*scratch)[lane + ${x}u] = ${a.readValue("second")};
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${U / 2}u;
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
    (*block_sums)[group_id] = (*scratch)[${U - 1}u];
    (*scratch)[${U - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${U / 2}u;
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
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${x}u]; }
  return 0u;
}
`
  );
}
const Ki = ur({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (a) => `select(0u, (*input_values)[${a}], ${a} < length)`
}), Hi = ur({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (a) => `select(0u, 1u, ${a} < length && (*input_values)[${a}].w > 0.0)`
}), Yi = (
  /* wgsl */
  `
fn add_scan_offsets(
  index: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    (*values)[index] += (*block_offsets)[index / ${U}u];
  }
  return 0u;
}
`
);
class ct {
  output;
  attributes = new le();
  levels = [];
  constructor(e, t, s = "intersections", r = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const i = B(Ki), o = B(
      Hi
    ), n = B(Yi);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const h = Math.ceil(u / U), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        h
      ), p = F("uint", U), m = this.levels.length === 0 && r === "projectedVisibility", v = (m ? o : i)({
        lane: ke,
        group_id: Z.x,
        length: g(u),
        input_values: b(
          l,
          m ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: b(c, "uint", u),
        block_sums: b(d, "uint", h),
        scratch: p
      }).computeKernel([x]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
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
      const d = this.levels[h], p = this.levels[h + 1];
      d.addNode = n({
        index: te,
        length: g(d.length),
        values: b(d.output, "uint", d.length),
        block_offsets: b(
          p.output,
          "uint",
          p.length
        ).toReadOnly()
      }).compute(d.length, [x]).setName(`3DGS ${s} add scan offsets WGSL ${h}`);
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
class dr {
  constructor(e, t) {
    this.camera = e, this.background = t;
  }
  camera;
  background;
  projection = Me(new De());
  view = Me(new De());
  viewport = Me(new Ir());
  tilesX = Me(1, "uint");
  tilesY = Me(1, "uint");
  update(e, t, s, r) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = r;
  }
}
function hr(a) {
  const { center: e, conic: t, powerThreshold: s, tileX: r, tileY: i, onHit: o } = a;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${r}), f32(${i})) * ${O}.0;
      let rect_max = rect_min + vec2<f32>(${O}.0);
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
          select(-${O}.0, ${O}.0, x_left),
          select(-${O}.0, ${O}.0, y_above)
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
const Xi = (
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
  let radix_blocks = (count + ${pe - 1}u) / ${pe}u;
  let reduce_chunks = (radix_blocks + ${Q - 1}u) / ${Q}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${R}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${x - 1}u) / ${x}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), Zi = (() => {
  const a = hr({
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
    clamp(i32(floor((center.x - radius.x) / ${O}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${O}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${O}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${O}.0)), 0, max_tile_y)
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
class Qi {
  constructor(e, t, s, r, i, o, n, l, c, u, h) {
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
    ).toReadOnly(), p = b(
      n,
      "uint",
      t
    ).toReadOnly(), m = b(
      i.state,
      "uvec4",
      1
    ).toReadOnly(), v = B(Xi);
    this.prepareNode = v({
      item_count_state: m,
      capacity: g(s),
      tile_counts: d,
      intersection_offsets: p,
      state: b(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: b(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: b(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: b(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const f = B(Zi);
    this.emitNode = f({
      rank: te,
      tiles: $e(h.tilesX, h.tilesY),
      capacity: g(s),
      sorted_gaussians: b(
        r,
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
      intersection_offsets: p,
      visible_state: m,
      records: b(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([x]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = i;
  }
  renderer;
  capacity;
  buffers;
  dispatch;
  attributes = new le();
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
const Kt = 10;
class pr {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * Kt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new ze(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new De();
  inverseModel = new De();
  cameraWorldPosition = new P();
  cameraLocalPosition = new P();
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
    const t = this.frameComponentOffset + e.objectId * Kt * 4;
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = Ji(e, this.camera) ? 1 : 0;
  }
}
function Ji(a, e) {
  if (!a.layers.test(e.layers)) return !1;
  let t = a, s = a;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof ut;
}
function ea(a) {
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
function ta(a) {
  const e = a === "rgb8e8" ? "u32" : "vec4<f32>", t = a === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (r) => {
    const i = r === 0 ? "base" : `base + ${r}u`;
    return a === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${i}])` : `(*sh_coefficients)[${i}].xyz`;
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
const sa = (
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
function ra() {
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
${hr({
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
const fr = /* @__PURE__ */ new Set([
  Jt,
  es,
  dt,
  ht,
  pt,
  ft,
  ss,
  rs
]), gr = /* @__PURE__ */ new Set([
  ...fr,
  Je,
  is
]), ia = /* @__PURE__ */ new Set([
  ...gr,
  as,
  ns,
  os,
  ls
]);
class mr {
  constructor(e, t, s, r, i, o = !0, n = !0) {
    this.data = e, this.frame = t, this.antialiasMode = r, this.subpixelSampleCulling = o, this.countTileIntersections = n, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      e.count
    ), this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      e.count
    ), this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      n ? e.count : 1
    ), this.rebuild(i);
  }
  data;
  frame;
  antialiasMode;
  subpixelSampleCulling;
  countTileIntersections;
  projectedMean;
  projectedConic;
  projectedColor;
  tileCounts;
  attributes = new le();
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
      hs(s, Qe, "projection");
    we(
      e.gaussianPositionLocalNode,
      fr,
      "gaussianPositionLocalNode"
    );
    for (const [s, r] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      we(r, gr, s);
    we(
      e.gaussianOpacityNode,
      ia,
      "gaussianOpacityNode"
    ), we(
      e.gaussianColorNode,
      Qe,
      "gaussianColorNode"
    ), we(
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
    const { data: t, frame: s } = this, r = b(t.means, "vec4", t.count).toReadOnly(), i = b(
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
    ), c = b(this.projectedConic, "vec4", t.count), u = b(this.projectedColor, "vec4", t.count), h = b(this.tileCounts, "uint", t.count), d = B(
      ea(this.antialiasMode)
    ), p = B(ta(t.shFormat)), m = B(ra()), v = B(sa);
    return Ie(() => {
      const y = g(te);
      M(y.greaterThanEqual(g(t.count)), () => {
        me();
      }), this.countTileIntersections && h.element(y).assign(g(0)), l.element(y).assign(K(0));
      const S = r.element(y), w = S.xyz, L = g(S.w), _ = i.element(y), C = _.xyz, G = _.w, N = o.element(y), k = g(t.count).add(
        L.mul(g(Kt))
      ), T = xs(
        l.element(k),
        l.element(k.add(1)),
        l.element(k.add(2)),
        l.element(k.add(3))
      ), z = xs(
        l.element(k.add(4)),
        l.element(k.add(5)),
        l.element(k.add(6)),
        l.element(k.add(7))
      ), A = l.element(k.add(8)).xyz, $ = l.element(k.add(9)).x.greaterThan(0);
      M($.not(), () => {
        me();
      });
      const D = /* @__PURE__ */ new Map([
        [Jt, () => y],
        [es, () => L],
        [dt, () => w],
        [ht, () => C],
        [pt, () => N],
        [ft, () => G],
        [ss, () => T],
        [rs, () => $]
      ]), H = Ge(
        e.gaussianPositionLocalNode,
        D
      ).toVar("gaussianPositionLocalValue"), ce = T.mul(K(H, 1)).xyz, W = new Map(D);
      W.set(Je, () => ce);
      const ue = Er(H.sub(A));
      W.set(is, () => ue);
      let Se;
      if (e.gaussianPositionWorldNode === Je)
        Se = z.mul(K(H, 1));
      else {
        const q = Ge(
          e.gaussianPositionWorldNode,
          W
        ).toVar("gaussianPositionWorldValue");
        Se = s.view.mul(K(q, 1));
      }
      Se = Se.toVar("gaussianViewPosition");
      const Ce = Ge(e.gaussianScaleNode, W).toVar(
        "gaussianScaleValue"
      ), fe = Ge(
        e.gaussianRotationNode,
        W
      ).toVar("gaussianRotationValue"), re = d({
        view: Se,
        scale_input: Ce,
        rotation_input: fe,
        model_view: z,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      M(re.element(0).w.lessThanEqual(0), () => {
        me();
      });
      const Y = re.element(0).xy, Ne = re.element(0).z, Te = re.element(1).xyz, je = re.element(1).w, Le = re.element(2).xyz, be = re.element(2).w, de = new Map(W);
      de.set(as, () => Ne), de.set(ns, () => Y), de.set(os, () => se(Le.xz)), de.set(
        ls,
        () => se(je).mul(Math.PI)
      );
      const Ue = Ge(
        e.gaussianOpacityNode,
        de
      ).clamp(0, 1), ve = this.antialiasMode === "compensated" ? Ue.mul(
        se(_e(be.div(je), 0, 1))
      ) : Ue;
      M(ve.lessThan(j(1 / 255)), () => {
        me();
      });
      const Pe = Wt(ve.mul(255)), We = se(
        Pe.mul(2).mul(_e(Le.x, 1e-12, 1e4))
      ), E = se(
        Pe.mul(2).mul(_e(Le.z, 1e-12, 1e4))
      ), Re = _s(We), Ve = _s(E);
      M(Re.lessThanEqual(0).or(Ve.lessThanEqual(0)), () => {
        me();
      });
      const Fe = ee(Re, Ve), Ae = Y.sub(Fe), Be = Y.add(Fe);
      if (M(
        Be.x.lessThan(0).or(Be.y.lessThan(0)).or(Ae.x.greaterThanEqual(s.viewport.x)).or(Ae.y.greaterThanEqual(s.viewport.y)),
        () => {
          me();
        }
      ), this.subpixelSampleCulling) {
        const q = v({
          center: Y,
          conic: Te,
          power_threshold: Pe,
          extent: ee(We, E),
          viewport: $e(s.viewport.xy)
        });
        M(q.not(), () => {
          l.element(y).assign(K(Y, Ne, -1)), me();
        });
      }
      const J = p({
        gid: y,
        sh_degree: g(t.shDegree),
        direction: ue,
        sh_coefficients: n
      }), V = new Map(de);
      V.set(ts, () => J), V.set(Qs, () => Ae), V.set(Js, () => Be);
      const ie = Ge(
        e.gaussianVisibilityNode,
        V
      );
      if (M(ie.not(), () => {
        me();
      }), this.countTileIntersections) {
        const q = Ze(ws(s.tilesX), ws(s.tilesY)).sub(1), Nt = Ze(
          _e(Vt(Ae.div(j(O))), ee(0), ee(q))
        ), st = Ze(
          _e(Vt(Be.div(j(O))), ee(0), ee(q))
        ), ge = m({
          center: Y,
          conic: Te,
          power_threshold: Pe,
          tile_min: Nt,
          tile_max: st
        });
        M(ge.equal(0), () => {
          me();
        }), h.element(y).assign(ge);
      }
      const X = Ge(
        e.gaussianColorNode,
        V
      ).clamp(0, 1);
      l.element(y).assign(K(Y, Ne, ve)), c.element(y).assign(K(Te, Re)), u.element(y).assign(K(X, Ve));
    })().compute(t.count, [x]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Ge(a, e) {
  return a.context({ overrideNodes: e });
}
const aa = (
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
), na = x, br = 256, oa = [2048, 4096, 8192];
function la(a) {
  const e = Math.max(0, a.length - 1);
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
  let s = 0, r = 0, i = 0, o = 0, n = 0, l = 0, c = 0, u = 0;
  for (let h = 0; h < e; h++) {
    const d = Math.max(0, a[h + 1] - a[h]);
    t[h] = d, s += d, r = Math.max(r, d), d > 256 && i++, d > 512 && o++, d > 1024 && n++, d > 2048 && l++;
    const p = Math.ceil(d / br);
    c += p, u = Math.max(u, p);
  }
  return t.sort(), {
    max: r,
    mean: s / e,
    median: ca(t),
    p95: zs(t, 0.95),
    p99: zs(t, 0.99),
    tilesOver256: i,
    tilesOver512: o,
    tilesOver1024: n,
    tilesOver2048: l,
    totalBatches: c,
    maxBatches: u
  };
}
function Os(a, e) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const t = Math.max(0, a.length - 1);
  let s = 0, r = 0, i = 0, o = 0, n = 0;
  for (let c = 0; c < t; c++) {
    const u = Math.max(0, a[c + 1] - a[c]), h = Math.min(u, e), d = u - h;
    s += h, r += d, d > 0 && i++;
    const p = Math.ceil(h / br);
    o += p, n = Math.max(n, p);
  }
  const l = s + r;
  return {
    cap: e,
    rasterizedIntersections: s,
    droppedIntersections: r,
    droppedFraction: l === 0 ? 0 : r / l,
    affectedTiles: i,
    totalBatches: o,
    maxBatches: n
  };
}
function ca(a) {
  const e = Math.floor(a.length / 2);
  return a.length % 2 !== 0 ? a[e] : (a[e - 1] + a[e]) * 0.5;
}
function zs(a, e) {
  const t = Math.max(0, Math.ceil(a.length * e) - 1);
  return a[t];
}
class ua {
  constructor(e, t, s, r, i, o) {
    this.renderer = e, this.maxRasterizedSplatsPerTile = o, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const n = B(aa);
    this.computeNode = n({
      index: te,
      gaussian_count: g(t),
      viewport: $e(i.viewport.xy),
      projected_mean: b(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: b(
        r,
        "vec4",
        r.count
      ).toReadOnly(),
      zero_pixel_flags: b(this.zeroPixelFlags, "uint", t)
    }).compute(t, [na]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
  attributes = new le();
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
    let i = 0;
    for (const n of r) i += n;
    const o = new Uint32Array(t);
    return {
      tileLoads: la(o),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : Os(o, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: oa.map(
        (n) => Os(o, n)
      ),
      zeroPixelSubpixelSplats: i
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function da(a) {
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
  partials: ptr<workgroup, array<u32, ${R * oe}>>
) -> u32 {
  let block_start = block_index * ${pe}u;
  let count = (*state)[0].x;
  let subgroup_count = (${x}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${R}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${ne}u; item++) {
      let position = block_start + item * ${x}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${a}u) & ${R - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${oe}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${R}u) {
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
const ha = (
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
  let subgroup_count = (${x}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${Q}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ne}u; item++) {
    let block = chunk_start + item * ${x}u + lane;
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
), pa = (
  /* wgsl */
  `
fn scan_radix_reduced(
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  reduced: ptr<storage, array<u32>, read_write>
) -> u32 {
  let chunk_count = ((*state)[0].z + ${Q - 1}u) /
    ${Q}u;
  var running = 0u;
  for (var digit = 0u; digit < ${R}u; digit++) {
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
), fa = (
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
  scratch: ptr<workgroup, array<u32, ${Q}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${Q}u;
  for (var item = 0u; item < ${ne}u; item++) {
    let local = item * ${x}u + lane;
    let block = chunk_start + local;
    var value = 0u;
    if (block < block_count) {
      value = (*block_histograms)[digit * block_stride + block];
    }
    (*scratch)[local] = value;
  }
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${Q / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${ne}u; item++) {
      let worker = item * ${x}u + lane;
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
  if (lane == 0u) { (*scratch)[${Q - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${Q / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${ne}u; item++) {
      let worker = item * ${x}u + lane;
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
  for (var item = 0u; item < ${ne}u; item++) {
    let local = item * ${x}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`
);
function ga(a) {
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
  block_bases: ptr<workgroup, array<u32, ${R}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${R}>>,
  partials: ptr<workgroup, array<u32, ${R * oe}>>
) -> u32 {
  let block_start = block_index * ${pe}u;
  let count = (*state)[0].x;
  let subgroup_count = (${x}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${R}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ne}u; item++) {
    let position = block_start + item * ${x}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${a}u) & ${R - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${R}u; target_digit++) {
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

    if (lane < ${R}u) {
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
function ma(a) {
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
  histogram: ptr<workgroup, array<atomic<u32>, ${R}>>
) -> u32 {
  if (lane < ${R}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${pe}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${ne}u; item++) {
    let position = block_start + item * ${x}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${a}u) & ${R - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${R}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`
  );
}
const ba = (
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
  scratch: ptr<workgroup, array<u32, ${x}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${Q}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ne}u; item++) {
    let block = chunk_start + item * ${x}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${x / 2}u;
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
function va(a) {
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
  block_bases: ptr<workgroup, array<u32, ${R}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${R}>>,
  shared_digits: ptr<workgroup, array<u32, ${x}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${R * (x / 32)}>>
) -> u32 {
  let block_start = block_index * ${pe}u;
  let count = (*state)[0].x;
  let words_per_digit = ${x / 32}u;
  if (lane < ${R}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ne}u; item++) {
    let position = block_start + item * ${x}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${R}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${a}u) & ${R - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${R * (x / 32)}u) {
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

    if (lane < ${R}u) {
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
class Ht {
  constructor(e, t, s, r, i, o) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = r, this.dispatch = i, this.backend = o, this.maxRadixBlocks = Math.ceil(s / pe), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / Q), this.blockHistograms = this.attributes.createUint(
      `3dgs.${t}-radix-histograms`,
      this.maxRadixBlocks * R
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${t}-radix-prefixes`,
      this.maxRadixBlocks * R
    ), this.reduced = this.attributes.createUint(
      `3dgs.${t}-radix-reduced`,
      this.maxReduceChunks * R
    );
    const n = b(i.state, "uvec4", 1).toReadOnly(), l = b(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), c = B(
      o === "subgroup" ? ha : ba
    ), u = {
      lane: ke,
      group_id: Z,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: b(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (u.subgroup_index = Gt, u.subgroup_lane = Mt, u.subgroup_size = It, u.partials = F("uint", oe)) : u.scratch = F("uint", x), this.reduceNode = c(u).computeKernel([x]).setName(`3DGS ${t} radix reduce WGSL`);
    const h = B(pa);
    this.scanReducedNode = h({
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      reduced: b(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const d = B(
      fa
    );
    this.scanAddNode = d({
      lane: ke,
      group_id: Z,
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
      scratch: F("uint", Q)
    }).computeKernel([x]).setName(`3DGS ${t} radix scan-add WGSL`), this.sortedRecords = r.recordsA;
  }
  renderer;
  label;
  capacity;
  buffers;
  dispatch;
  backend;
  sortedRecords;
  attributes = new le();
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
    const t = Math.ceil(Math.max(0, e) / qt);
    this.passes = Array.from(
      { length: t },
      (s, r) => this.createPass(r, r * qt)
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
    const s = e % 2 === 0, r = s ? this.buffers.recordsA : this.buffers.recordsB, i = s ? this.buffers.recordsB : this.buffers.recordsA, o = b(this.dispatch.state, "uvec4", 1).toReadOnly(), n = b(
      r,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = B(
      this.backend === "subgroup" ? da(t) : ma(t)
    ), c = {
      lane: ke,
      block_index: Z.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records: n,
      block_histograms: b(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (c.subgroup_index = Gt, c.subgroup_lane = Mt, c.subgroup_size = It, c.partials = F(
      "uint",
      R * oe
    )) : c.histogram = F("atomic<u32>", R);
    const u = l(c).computeKernel([x]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), h = B(
      this.backend === "subgroup" ? ga(t) : va(t)
    ), d = {
      lane: ke,
      block_index: Z.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records_in: n,
      records_out: b(i, "uvec2", this.capacity),
      block_prefixes: b(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: F("uint", R),
      local_digit_counts: F("uint", R)
    };
    this.backend === "subgroup" ? (d.subgroup_index = Gt, d.subgroup_lane = Mt, d.subgroup_size = It, d.partials = F(
      "uint",
      R * oe
    )) : (d.shared_digits = F("uint", x), d.shared_digit_masks = F(
      "uint",
      R * (x / 32)
    ));
    const p = h(d).computeKernel([x]).setName(`3DGS ${this.label} radix scatter WGSL ${e}`);
    return { histogram: u, scatter: p };
  }
  disposePasses() {
    for (const e of this.passes)
      e.histogram.dispose(), e.scatter.dispose();
    this.passes = [];
  }
}
const ya = (
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
function xa(a) {
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
const _a = (
  /* wgsl */
  `
fn suffix_min_blocks(
  lane: u32,
  group_id: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_mins: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${U}>>
) -> u32 {
  let base = group_id * ${U}u;
  let first_local = lane;
  let second_local = lane + ${x}u;
  let first_source = base + (${U - 1}u - first_local);
  let second_source = base + (${U - 1}u - second_local);
  var first_value = 0xffffffffu;
  var second_value = 0xffffffffu;
  if (first_source < length) { first_value = (*values)[first_source]; }
  if (second_source < length) { second_value = (*values)[second_source]; }
  (*scratch)[first_local] = first_value;
  (*scratch)[second_local] = second_value;
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${U / 2}u;
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
    (*block_mins)[group_id] = (*scratch)[${U - 1}u];
    (*scratch)[${U - 1}u] = 0xffffffffu;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${U / 2}u;
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
), wa = (
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
    let next_block = index / ${U}u + 1u;
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
class ka {
  attributes = new le();
  levels = [];
  constructor(e, t) {
    const s = B(_a), r = B(wa);
    let i = e, o = t;
    for (; ; ) {
      const n = this.levels.length, l = Math.ceil(o / U), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${n}`,
        l
      ), u = s({
        lane: ke,
        group_id: Z.x,
        length: g(o),
        values: b(i, "uint", o),
        block_mins: b(c, "uint", l),
        scratch: F("uint", U)
      }).computeKernel([x]).setName(`3DGS tile offset suffix scan WGSL ${n}`);
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
      l.addNode = r({
        index: te,
        length: g(l.length),
        block_count: g(c.length),
        values: b(l.values, "uint", l.length),
        block_suffix_mins: b(
          c.values,
          "uint",
          c.length
        ).toReadOnly()
      }).compute(l.length, [x]).setName(`3DGS tile add suffix block mins WGSL ${n}`);
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
class Sa {
  constructor(e, t, s, r, i) {
    this.renderer = e, this.dispatch = i, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = b(this.offsets, "uint", s + 1), n = B(ya);
    this.clearNode = n({
      index: te,
      tile_count: g(s),
      state: b(i.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [x]).setName("3DGS clear tile offsets WGSL");
    const l = B(
      xa(t)
    );
    this.boundariesNode = l({
      index: te,
      tile_count: g(s),
      state: b(i.state, "uvec4", 1).toReadOnly(),
      records: b(
        r,
        "uvec2",
        r.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([x]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new ka(this.offsets, s + 1);
  }
  renderer;
  dispatch;
  offsets;
  attributes = new le();
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
const Ds = (
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
), Ca = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${x}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class Na {
  constructor(e, t, s, r, i, o, n, l, c, u, h, d, p, m, v, f, y, S = !1, w = 1e-4) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = r, this.meansAttribute = i, this.projectedMeanAttribute = o, this.projectedConicAttribute = n, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = h, this.depthTexture = d, this.frame = p, this.maxSplatsPerTile = m, this.rasterChunkSize = v, this.tileCount = f, this.transmittanceThreshold = w, this.metrics = S ? this.attributes.createUint("3dgs.raster-work", f * 4) : null;
    const L = this.metrics === null ? null : b(this.metrics, "uint", f * 4).toAtomic();
    this.clearMetrics = L === null ? null : Ie(() => {
      jr(L.element(te), g(0));
    })().compute(f * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(y);
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
  attributes = new le();
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
      hs(i, et, "raster");
    we(
      e.rasterPixelValueNode,
      tr,
      "rasterPixelValueNode"
    ), we(
      e.rasterBreakNode,
      ui,
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
    const e = cr(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new ct(
      t,
      this.tileCount,
      "raster-chunks"
    ), r = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), i = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), o = e * x, n = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
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
    ).toReadOnly(), m = B($i)({
      tile: te,
      tile_count: g(this.tileCount),
      chunk_size: g(this.rasterChunkSize),
      sample_limit: g(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [x]).setName("3DGS count exact raster chunks WGSL"), f = B(
      Ei
    )({
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      dispatch: b(i, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), S = B(ji)({
      tile: te,
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      tasks: b(r, "uvec2", e)
    }).compute(this.tileCount, [x]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: t,
      offsets: s,
      tasks: r,
      dispatch: i,
      partialData: l,
      partialStride: n,
      countNode: m,
      prepareNode: f,
      emitNode: S
    };
  }
  createRasterNode(e, t) {
    const s = this.metrics === null ? null : b(this.metrics, "uint", this.tileCount * 4).toAtomic(), r = b(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), i = b(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), o = b(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), n = b(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), l = b(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), c = b(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = F("vec4", x), h = F("vec4", x), d = F("vec4", x), p = F("uint", x), m = F("uint", x), v = F("uint", 8), f = t === "direct" ? Ft(this.colorTexture) : null, y = B(Ds), S = B(Ca), w = this.chunks, L = t === "chunk" && w !== null ? b(w.tasks, "uvec2", w.tasks.count).toReadOnly() : null, _ = t === "chunk" && w !== null ? b(w.partialData, "vec4", w.partialData.count) : null, { frame: C } = this;
    return Ie(() => {
      const N = g(ke), k = y({ value: N }), T = y({ value: N.shiftRight(1) }), z = g(Z.x), A = (t === "direct" ? Z.y.mul(C.tilesX).add(Z.x) : L.element(z).x).toVar("rasterTile"), $ = t === "chunk" ? L.element(z).y : g(0), D = t === "direct" ? Z.x : A.mod(C.tilesX), H = t === "direct" ? Z.y : A.div(C.tilesX), ce = $e(
        D.mul(g(O)).add(k),
        H.mul(g(O)).add(T)
      ).toVar("rasterPixelCoordinateValue"), W = ce.x.lessThan(g(C.viewport.x)).and(ce.y.lessThan(g(C.viewport.y))).toVar("rasterActivePixel"), ue = c.element(A), Se = c.element(A.add(1)), Ce = g(Se.sub(ue)), fe = Ce.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const E = g(this.maxSplatsPerTile);
        fe.assign(ye(Ce.lessThan(E), Ce, E));
      }
      let re = g(0);
      const Y = fe.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        Y.assign(
          ye(
            fe.greaterThan(g(this.rasterChunkSize)),
            g(0),
            fe
          )
        );
      else if (t === "chunk") {
        re = $.mul(g(this.rasterChunkSize)).toVar("rasterSampleStart");
        const E = re.add(g(this.rasterChunkSize));
        Y.assign(
          ye(E.lessThan(fe), E, fe)
        );
      }
      const Ne = ee(ce).add(0.5), Te = /* @__PURE__ */ new Map([
        [mt, () => ce],
        [bt, () => Ne],
        [vt, () => Ne.div(C.viewport.xy)]
      ]), je = j(0).toVar("rasterPixelValue");
      M(W, () => {
        je.assign(
          He(e.rasterPixelValueNode, Te)
        );
      });
      const Le = lt(0).toVar("accumulated"), be = j(1).toVar("transmittance"), de = j(1).toVar("depth"), Ue = he(!1).toVar("depthWritten"), ve = he(!1).toVar("done"), Pe = s === null ? null : g(0).toVar("rasterChecked"), We = s === null ? null : g(0).toVar("rasterBlended");
      qe(
        {
          start: re,
          end: Y,
          type: "uint",
          condition: "<",
          update: `+= ${x}`
        },
        ({ i: E }) => {
          const Re = E.add(N);
          M(Re.lessThan(Y), () => {
            let J = Re;
            this.maxSplatsPerTile !== null && (J = g(
              Vt(
                j(Re).add(0.5).mul(j(Ce)).div(j(fe))
              )
            ));
            const V = ue.add(J).toVar("rasterSourceRecordIndex"), ie = l.element(V).y, X = i.element(ie), q = o.element(ie);
            u.element(N).assign(X), h.element(N).assign(K(q.xyz, X.w.mul(255).log())), d.element(N).assign(n.element(ie)), p.element(N).assign(ie);
          }), M(N.equal(0), () => {
            m.element(g(0)).assign(
              ye(
                E.add(g(x)).lessThan(Y),
                g(1),
                g(0)
              )
            );
          });
          const Ve = S({ values: m }).toVar("hasNextBatch"), Fe = g(Y.sub(E)), Ae = ye(
            Fe.lessThan(g(x)),
            Fe,
            g(x)
          );
          M(W.and(ve.not()), () => {
            qe(
              {
                start: g(0),
                end: Ae,
                type: "uint",
                condition: "<"
              },
              ({ i: J }) => {
                Pe?.addAssign(1);
                const V = u.element(J), ie = p.element(J), X = Ne.sub(V.xy), q = new Map(Te);
                q.set(yt, () => je), q.set(tt, () => ie), q.set(
                  gt,
                  () => g(r.element(ie).w)
                ), q.set(xt, () => V.xy), q.set(_t, () => X), q.set(wt, () => V.z);
                const Nt = He(
                  e.rasterBreakNode,
                  q
                );
                M(Nt, () => {
                  ve.assign(he(!0)), Ke();
                });
                const st = h.element(J), ge = st.xyz, rt = ge.x.mul(X.x.mul(X.x)).add(ge.y.mul(2).mul(X.x).mul(X.y)).add(ge.z.mul(X.y.mul(X.y))).mul(-0.5);
                M(
                  rt.greaterThan(0).or(rt.lessThan(st.w.negate())),
                  () => {
                    Tt();
                  }
                );
                const gs = se(xe(ge.x, 1e-12)), Lt = ge.y.div(gs), xr = se(xe(ge.z.sub(Lt.mul(Lt)), 1e-12)), ms = ee(
                  gs.mul(X.x).add(Lt.mul(X.y)),
                  xr.mul(X.y)
                ), Pt = new Map([
                  ...q,
                  [cs, () => ms],
                  [us, () => ms.div(6).add(0.5)],
                  [
                    kt,
                    () => d.element(J).xyz
                  ],
                  [St, () => V.w],
                  [Ct, () => rt],
                  [ds, () => Xt(rt)]
                ]), _r = He(e.rasterDiscardNode, Pt);
                M(_r, () => {
                  Tt();
                });
                const Rt = _e(
                  He(e.rasterAlphaNode, Pt),
                  0,
                  0.99
                );
                M(Rt.lessThan(j(1 / 255)), () => {
                  Tt();
                }), M(Ue.not(), () => {
                  de.assign(La(V.z, C)), Ue.assign(he(!0));
                });
                const wr = He(e.rasterColorNode, Pt);
                Le.addAssign(wr.mul(be).mul(Rt)), We?.addAssign(1), be.mulAssign(j(1).sub(Rt)), M(be.lessThan(this.transmittanceThreshold), () => {
                  ve.assign(he(!0)), Ke();
                });
              }
            );
          }), M(Ve.equal(0), () => {
            Ke();
          }), m.element(N).assign(ye(W.and(ve.not()), g(1), g(0))), ks(), M(N.lessThan(8), () => {
            const J = N.mul(32), V = g(0).toVar("subgroupActive");
            qe(
              { start: g(0), end: g(32), type: "uint", condition: "<" },
              ({ i: ie }) => {
                V.bitOrAssign(
                  m.element(J.add(ie))
                );
              }
            ), v.element(N).assign(V);
          }), ks(), M(N.equal(0), () => {
            const J = g(0).toVar("tileActiveReduction");
            qe(
              { start: g(0), end: g(8), type: "uint", condition: "<" },
              ({ i: V }) => {
                J.bitOrAssign(v.element(g(V)));
              }
            ), m.element(g(0)).assign(J);
          });
          const Be = S({ values: m });
          M(Be.equal(0), () => {
            Ke();
          });
        }
      ), M(W, () => {
        if (s !== null) {
          const E = A.mul(4);
          Oe(s.element(E), Pe), Oe(s.element(E.add(1)), We), t === "direct" && M(Ce.greaterThan(0).and(Y.greaterThan(0)), () => {
            Oe(s.element(E.add(2)), g(1)), Oe(
              s.element(E.add(3)),
              ye(
                be.lessThan(this.transmittanceThreshold),
                g(1),
                g(0)
              )
            );
          });
        }
        if (t === "direct")
          $s(
            Le,
            be,
            de,
            ce,
            f,
            this.depthTexture,
            C
          );
        else {
          const E = z.mul(g(x)).add(N).mul(g(w.partialStride));
          _.element(E).assign(K(Le, be)), this.depthTexture !== null && _.element(E.add(1)).assign(K(de, 0, 0, 0));
        }
      });
    })().computeKernel([O, O]).setName(
      t === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const e = this.metrics === null ? null : b(this.metrics, "uint", this.tileCount * 4).toAtomic(), t = this.chunks, s = b(
      t.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), r = b(
      t.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), i = b(
      t.partialData,
      "vec4",
      t.partialData.count
    ).toReadOnly(), o = Ft(this.colorTexture), n = B(Ds), { frame: l } = this;
    return Ie(() => {
      const u = g(ke), h = n({ value: u }), d = n({ value: u.shiftRight(1) }), p = Z.y.mul(l.tilesX).add(Z.x), m = s.element(p), v = $e(
        Z.x.mul(g(O)).add(h),
        Z.y.mul(g(O)).add(d)
      ), f = v.x.lessThan(g(l.viewport.x)).and(v.y.lessThan(g(l.viewport.y)));
      M(f.and(m.greaterThan(0)), () => {
        const y = lt(0).toVar("chunkCompositeColor"), S = j(1).toVar("chunkCompositeTransmittance"), w = j(1).toVar("chunkCompositeDepth"), L = he(!1).toVar("chunkCompositeDepthWritten"), _ = r.element(p);
        qe(
          {
            start: g(0),
            end: m,
            type: "uint",
            condition: "<"
          },
          ({ i: C }) => {
            const G = _.add(C).mul(g(x)).add(u).mul(g(t.partialStride)), N = i.element(G);
            y.addAssign(N.xyz.mul(S)), this.depthTexture !== null && M(L.not().and(N.w.lessThan(1)), () => {
              w.assign(i.element(G.add(1)).x), L.assign(he(!0));
            }), S.mulAssign(N.w), M(S.lessThan(this.transmittanceThreshold), () => {
              Ke();
            });
          }
        ), $s(
          y,
          S,
          w,
          v,
          o,
          this.depthTexture,
          l
        ), e !== null && (Oe(e.element(p.mul(4).add(2)), g(1)), Oe(
          e.element(p.mul(4).add(3)),
          ye(
            S.lessThan(this.transmittanceThreshold),
            g(1),
            g(0)
          )
        ));
      });
    })().computeKernel([O, O]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const e = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let t = 0, s = 0, r = 0, i = 0;
    for (let o = 0; o < e.length; o += 4)
      t += e[o], s += e[o + 1], r += e[o + 2], i += e[o + 3];
    return { checked: t, blended: s, pixels: r, alphaStopped: i };
  }
}
function La(a, e) {
  const t = a.negate();
  return _e(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function $s(a, e, t, s, r, i, o) {
  const n = _e(j(o.background[3]), 0, 1);
  a.addAssign(
    lt(o.background[0], o.background[1], o.background[2]).mul(e).mul(n)
  );
  const l = j(1).sub(e.mul(j(1).sub(n)));
  Ss(r, Ze(s), K(a, l)), i !== null && Ss(
    Ft(i),
    Ze(s),
    K(t, 0, 0, 1)
  );
}
function He(a, e) {
  return a.context({ overrideNodes: e });
}
class vr {
  constructor(e, t, s, r, i, o) {
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
      r,
      "uint",
      s
    ).toReadOnly(), l = B(
      Wi
    );
    this.prepareNode = l({
      gaussian_count: g(s),
      projected_mean: b(
        i,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: n,
      state: b(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: b(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: b(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: b(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const c = B(
      Vi(t)
    );
    this.compactNode = c({
      gid: te,
      gaussian_count: g(s),
      viewport: o,
      visible_offsets: n,
      projected_mean: b(
        i,
        "vec4",
        s
      ).toReadOnly(),
      records: b(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [x]).setName(`3DGS compact visible Gaussians WGSL (${t})`);
  }
  renderer;
  buffers;
  dispatch;
  attributes = new le();
  prepareNode;
  compactNode;
  encode(e = !1) {
    e ? (this.renderer.compute(this.prepareNode), this.renderer.compute(this.compactNode)) : this.renderer.compute([this.prepareNode, this.compactNode]);
  }
  dispose() {
    this.prepareNode.dispose(), this.compactNode.dispose(), this.attributes.dispose();
  }
}
class Pa {
  constructor(e, t, s, r, i, o, n, l, c, u, h, d, p, m, v = 1e-4, f = !1) {
    this.renderer = e, this.data = s, this.mode = i, this.capacity = n, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = d, this.radixBackend = p, this.nodes = m, this.rasterTransmittanceThreshold = v, this.rasterStats = f, this.frame = new dr(t, l), this.objects = new pr(t, r, s.count), this.projection = new mr(
      s,
      this.frame,
      this.objects,
      o,
      m,
      d
    ), this.profileDiagnostics = c || f ? new ua(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new ct(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new vr(
      e,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Ht(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      p
    ), this.depthSorter.configure(i === "float32" ? 32 : 16), this.orderedTiles = new qi(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new ct(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new Qi(
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
    ), this.sorter = new Ht(
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
    const i = Math.ceil(e / O), o = Math.ceil(t / O), n = i * o;
    if (i > 65535 || o > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, n + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new Sa(
      this.renderer,
      this.mode,
      n,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new Na(
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
    ), this.width = e, this.height = t, this.tilesX = i, this.tilesY = o, this.frame.update(e, t, i, o), this.tileStageRebuilds++;
  }
}
function yr(a, e) {
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
const jt = new Ks();
class Ra extends ot {
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
  nodeSlots = er();
  dirtyStages = 0;
  disposed = !1;
  constructor(e, t, s, r = {}) {
    super(ot.COLOR, new ut(), t, {
      type: Ut,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const i = r.depthSortMode ?? "float32", o = r.antialiasMode ?? "compensated", n = r.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    const l = yr(
      n,
      e.hasFeature("subgroups")
    ), c = r.intersectionCapacity ?? null;
    if (c !== null && (!Number.isInteger(c) || c <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (c !== null && c > x * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const u = r.maxRasterizedSplatsPerTile ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const h = r.rasterChunkSize === void 0 ? Di : r.rasterChunkSize;
    if (Ui(
      h,
      c ?? x * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = i, this.antialiasMode = o, this.requestedIntersectionCapacity = c, this.background = r.background ?? [0, 0, 0, 0], this.outputDepth = r.outputDepth ?? !1, this.colorSpace = r.colorSpace ?? Fs, this.profileKernels = r.profileKernels ?? !1, this.rasterStats = r.rasterStats ?? !1, this.rasterTransmittanceThreshold = r.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = r.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new bs(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = Ut, this.colorTexture.colorSpace = Tr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new bs(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = Ar, this.depthTexture.type = Br, this.depthTexture.minFilter = vs, this.depthTexture.magFilter = vs, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    return this.workingColorNode ??= Hs(
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
    if (!(this.camera instanceof qs))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    t.getDrawingBufferSize(jt);
    const s = Math.max(1, Math.floor(jt.x)), r = Math.max(1, Math.floor(jt.y));
    (this.renderTarget.width !== s || this.renderTarget.height !== r) && this.setSize(s, r), this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: Ga(t) });
    const i = this.gaussianStore.updateLod(this.camera), o = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      x * 65535,
      Math.max(1, o.count * 16)
    )), t.initRenderTarget(this.renderTarget), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), o.count > x * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new Pa(
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
        this.rasterStats
      ), this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.pipeline.prepareFrame(
      s,
      r,
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
    Es(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateProjection());
  }
  setRasterNode(e, t) {
    Es(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateRasterizer());
  }
}
function Es(a, e) {
  if (a?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function Ga(a) {
  const e = a.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device.limits;
}
function Va(a, e, t, s) {
  return new Ra(a, e, t, s);
}
class Ma {
  constructor(e, t, s, r, i, o, n, l, c, u, h) {
    this.renderer = e, this.data = s, this.colorSpace = l, this.profileKernels = h, this.frame = new dr(t, [0, 0, 0, 0]), this.objects = new pr(t, r, s.count), this.projection = new mr(
      s,
      this.frame,
      this.objects,
      o,
      c,
      u,
      !1
    ), this.visibleScan = new ct(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new vr(
      e,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Ht(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      n
    ), this.depthSorter.configure(i === "float32" ? 32 : 16);
    const d = b(this.visible.dispatch.state, "uvec4", 1).toReadOnly().element(0).x, p = b(this.drawArguments, "uvec4", 1);
    this.prepareDraw = Ie(() => {
      p.element(0).assign(Ur(g(6), d, g(0), g(0)));
    })().compute(1).setName("3DGS prepare hardware indirect draw"), this.geometry.setAttribute(
      "position",
      new Us(
        [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0],
        3
      )
    ), this.geometry.instanceCount = 1, this.geometry.setIndirect(this.drawArguments), this.mesh = new Or(this.geometry, this.createMaterial(c)), this.mesh.name = "3DGS hardware splats", this.mesh.frustumCulled = !1, this.mesh.layers.enableAll(), this.scene.add(this.mesh);
  }
  renderer;
  data;
  colorSpace;
  profileKernels;
  frame;
  objects;
  projection;
  visibleScan;
  visible;
  depthSorter;
  scene = new ut();
  geometry = new zr();
  mesh;
  attributes = new le();
  drawArguments = this.attributes.createIndirect("3dgs.hardware-draw");
  prepareDraw;
  prepare(e, t) {
    this.frame.update(e, t, 1, 1), this.objects.update(), this.projection.encode(this.renderer), this.visibleScan.encode(this.renderer), this.visible.encode(this.profileKernels), this.depthSorter.encode(this.profileKernels), this.renderer.compute(this.prepareDraw);
  }
  rebuildProjection(e) {
    this.projection.rebuild(e);
  }
  rebuildRasterizer(e) {
    const t = this.createMaterial(e);
    this.mesh.material.dispose(), this.mesh.material = t;
  }
  createMaterial(e) {
    const t = new Set(et);
    t.delete(yt);
    for (const [p, m] of Object.entries({
      rasterColorNode: e.rasterColorNode,
      rasterAlphaNode: e.rasterAlphaNode,
      rasterDiscardNode: e.rasterDiscardNode
    }))
      hs(
        m,
        et,
        "raster"
      ), we(m, t, p);
    const s = b(
      this.projection.projectedMean,
      "vec4",
      this.projection.projectedMean.count
    ).toReadOnly(), r = b(
      this.projection.projectedConic,
      "vec4",
      this.data.count
    ).toReadOnly(), i = b(
      this.projection.projectedColor,
      "vec4",
      this.data.count
    ).toReadOnly(), o = b(
      this.depthSorter.sortedRecords,
      "uvec2",
      this.data.count
    ).toReadOnly(), n = b(this.visible.dispatch.state, "uvec4", 1).toReadOnly().element(0).x, l = it(
      o.element(n.sub(g(1)).sub(g(te))).y,
      "hardwareGaussianId"
    ).setInterpolation("flat"), c = it(
      s.element(l),
      "hardwareMean"
    ).setInterpolation("flat"), u = it(
      r.element(l),
      "hardwareConic"
    ).setInterpolation("flat"), h = it(
      i.element(l),
      "hardwareColor"
    ).setInterpolation("flat"), d = new Dr();
    return d.name = "3DGS hardware Gaussian material", d.transparent = !0, d.premultipliedAlpha = !0, d.depthTest = !0, d.depthWrite = !1, d.side = Ws, d.forceSinglePass = !0, d.toneMapped = !1, d.vertexNode = Ie(() => {
      const p = xe(
        u.x.mul(u.z).sub(u.y.mul(u.y)),
        1e-20
      ), m = u.z.div(p), v = u.y.negate().div(p), f = u.x.div(p), y = se(m.sub(f).pow(2).add(v.pow(2).mul(4))), S = xe(m.add(f).add(y).mul(0.5), 1e-12), w = ee(v, S.sub(m)).toVar("hardwareAxis");
      M(w.dot(w).lessThan(1e-20), () => {
        w.assign(ee(1, 0));
      }), w.assign(w.normalize());
      const L = xe(Wt(c.w.mul(255)).mul(2), 0), _ = se(S.mul(L)), C = se(
        xe(j(1).div(p.mul(S)), 1e-12).mul(L)
      ), G = w.mul(Cs.x.mul(_)).add(ee(w.y.negate(), w.x).mul(Cs.y.mul(C))), N = c.xy.add(G), k = ee(
        N.x.div(this.frame.viewport.x).mul(2).sub(1),
        j(1).sub(N.y.div(this.frame.viewport.y).mul(2))
      ), T = this.frame.projection.mul(
        K(0, 0, c.z.negate(), 1)
      );
      return K(k.mul(T.w), T.z, T.w);
    })(), d.fragmentNode = Ie(() => {
      const p = Wr.xy, m = p.sub(c.xy), v = u.x.mul(m.x.pow(2)).add(u.y.mul(m.x).mul(m.y).mul(2)).add(u.z.mul(m.y.pow(2))).mul(-0.5);
      M(v.lessThan(Wt(c.w.mul(255)).negate()), () => {
        At();
      });
      const f = se(xe(u.x, 1e-12)), y = u.y.div(f), S = se(xe(u.z.sub(y.mul(y)), 1e-12)), w = ee(
        f.mul(m.x).add(y.mul(m.y)),
        S.mul(m.y)
      ), L = b(
        this.data.means,
        "vec4",
        this.data.count
      ).toReadOnly(), _ = /* @__PURE__ */ new Map([
        [tt, () => l],
        [gt, () => g(L.element(l).w)],
        [mt, () => $e(p)],
        [bt, () => p],
        [vt, () => p.div(this.frame.viewport.xy)],
        [xt, () => c.xy],
        [_t, () => m],
        [cs, () => w],
        [us, () => w.div(6).add(0.5)],
        [wt, () => c.z],
        [kt, () => h.xyz],
        [St, () => c.w],
        [Ct, () => v],
        [ds, () => Xt(v)]
      ]), C = (N) => N.context({ overrideNodes: _ });
      M(C(e.rasterDiscardNode), () => {
        At();
      });
      const G = C(e.rasterAlphaNode).clamp(0, 0.99);
      return M(G.lessThan(1 / 255), () => {
        At();
      }), K(
        Hs(
          C(e.rasterColorNode),
          this.colorSpace
        ),
        G
      );
    })(), d;
  }
  async readVisibleCount() {
    const e = await this.renderer.getArrayBufferAsync(
      this.visible.dispatch.state
    );
    return new Uint32Array(e)[0] ?? 0;
  }
  dispose() {
    this.mesh.material.dispose(), this.geometry.dispose(), this.prepareDraw.dispose(), this.depthSorter.dispose(), this.visible.dispose(), this.visibleScan.dispose(), this.projection.dispose(), this.objects.dispose(), this.attributes.dispose();
  }
}
class Ia extends ot {
  gaussianStore;
  depthSortMode;
  antialiasMode;
  colorSpace;
  profileKernels;
  subpixelSampleCulling;
  radixBackend;
  ownerRenderer;
  nodeSlots = er();
  pipeline = null;
  layoutVersion = -1;
  projectionDirty = !1;
  rasterDirty = !1;
  disposed = !1;
  size = new Ks();
  nearNode = Me(0.01);
  farNode = Me(1e3);
  debugListeners = /* @__PURE__ */ new Set();
  constructor(e, t, s, r = {}) {
    if (super(ot.COLOR, r.scene ?? new ut(), t, {
      type: Ut,
      samples: 0,
      depthBuffer: !0,
      stencilBuffer: !1
    }), this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = r.depthSortMode ?? "float32", this.antialiasMode = r.antialiasMode ?? "compensated", !["float32", "packed16"].includes(this.depthSortMode))
      throw new RangeError("Invalid depthSortMode");
    if (!["classic", "compensated"].includes(this.antialiasMode))
      throw new RangeError("Invalid antialiasMode");
    this.colorSpace = r.colorSpace ?? Fs, this.profileKernels = r.profileKernels ?? !1, this.subpixelSampleCulling = r.subpixelSampleCulling ?? !0, this.radixBackend = yr(
      r.radixBackend ?? "auto",
      e.hasFeature("subgroups")
    ), this.name = "3DGS hardware pass";
  }
  invalidateProjection() {
    this.projectionDirty = !0;
  }
  invalidateRasterizer() {
    this.rasterDirty = !0;
  }
  set needsUpdate(e) {
    super.needsUpdate = e, e && (this.projectionDirty = !0, this.rasterDirty = !0);
  }
  getViewZNode(e = "depth") {
    return Vr(
      this.getTextureNode(e),
      this.nearNode,
      this.farNode
    );
  }
  getLinearDepthNode(e = "depth") {
    return Fr(
      this.getViewZNode(e),
      this.nearNode,
      this.farNode
    );
  }
  updateBefore(e) {
    const t = e.renderer;
    if (this.disposed)
      throw new Error("GaussianHardwarePass has been disposed");
    if (t !== this.ownerRenderer)
      throw new Error("GaussianHardwarePass renderer mismatch");
    if (!(this.camera instanceof qs))
      throw new TypeError("GaussianHardwarePass requires a PerspectiveCamera");
    if (t.reversedDepthBuffer || t.logarithmicDepthBuffer)
      throw new Error("GaussianHardwarePass currently requires standard depth");
    const s = this.camera;
    if (s.coordinateSystem !== ys && (s.coordinateSystem = ys, s.updateProjectionMatrix()), this.nearNode.value = s.near, this.farNode.value = s.far, t.getDrawingBufferSize(this.size), this.setSize(Math.max(1, this.size.x), Math.max(1, this.size.y)), this.gaussianStore.needsPack) {
      const o = t.backend;
      if (!o.device)
        throw new Error("Initialize WebGPURenderer before rendering");
      this.gaussianStore.pack({ limits: o.device.limits });
    }
    const r = this.gaussianStore.updateLod(s), i = this.gaussianStore.getPackedData();
    if (i.count > 256 * 65535)
      throw new RangeError("Gaussian projection dispatch limit exceeded");
    if (!this.pipeline || this.layoutVersion !== this.gaussianStore.layoutVersion ? (this.pipeline?.dispose(), this.pipeline = new Ma(
      t,
      s,
      i,
      this.gaussianStore,
      this.depthSortMode,
      this.antialiasMode,
      this.radixBackend,
      this.colorSpace,
      this.nodeSlots,
      this.subpixelSampleCulling,
      this.profileKernels
    ), this.layoutVersion = this.gaussianStore.layoutVersion, this.projectionDirty = this.rasterDirty = !1) : (this.projectionDirty && this.pipeline.rebuildProjection(this.nodeSlots), this.rasterDirty && this.pipeline.rebuildRasterizer(this.nodeSlots), this.projectionDirty = this.rasterDirty = !1), this.pipeline.prepare(this.renderTarget.width, this.renderTarget.height), this.renderScene(t, s), this.debugListeners.size) {
      const o = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: r
      };
      for (const n of this.debugListeners) n(o);
    }
  }
  renderScene(e, t) {
    const s = this.scene, r = e.getRenderTarget(), i = e.getMRT(), o = e.autoClear, n = e.opaque, l = e.transparent, c = s.background, u = e.getClearColor(new Vs()), h = e.getClearAlpha(), d = t.layers.mask;
    try {
      const p = this.getLayers();
      p && (t.layers.mask = p.mask), e.setRenderTarget(this.renderTarget), e.setMRT(null), e.setClearColor(0, 0), e.autoClear = !0, e.opaque = !0, e.transparent = !1, e.render(s, t), e.autoClear = !1, e.opaque = !1, e.transparent = !0, e.render(this.pipeline.scene, t), s.background = null, e.render(s, t);
    } finally {
      s.background = c, t.layers.mask = d, e.setClearColor(u, h), e.autoClear = o, e.opaque = n, e.transparent = l, e.setRenderTarget(r), e.setMRT(i);
    }
  }
  subscribeDebug(e) {
    return this.debugListeners.add(e), () => this.debugListeners.delete(e);
  }
  async readStats() {
    return {
      visibleGaussianCount: await this.pipeline?.readVisibleCount() ?? 0,
      intersectionCount: 0,
      requestedIntersections: 0,
      intersectionCapacity: 0,
      overflow: !1,
      profile: null
    };
  }
  getDebugInfo() {
    const e = this.pipeline?.depthSorter.passCount ?? 0;
    return {
      initialized: this.pipeline !== null,
      width: this.renderTarget.width,
      height: this.renderTarget.height,
      tilesX: 0,
      tilesY: 0,
      tileStageRebuilds: 0,
      radixPasses: e,
      depthRadixPasses: e,
      tileRadixPasses: 0,
      radixBackend: this.radixBackend,
      profileKernels: this.profileKernels,
      maxRasterizedSplatsPerTile: null,
      rasterChunkSize: null,
      subpixelSampleCulling: this.subpixelSampleCulling
    };
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.pipeline?.dispose(), this.pipeline = null, this.debugListeners.clear(), super.dispose());
  }
  setNode(e, t, s) {
    if (!t?.isNode) throw new TypeError(`${e} must be a Three.js Node`);
    this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, s ? this.invalidateProjection() : this.invalidateRasterizer());
  }
  get gaussianPositionLocalNode() {
    return this.nodeSlots.gaussianPositionLocalNode;
  }
  set gaussianPositionLocalNode(e) {
    this.setNode("gaussianPositionLocalNode", e, !0);
  }
  get gaussianPositionWorldNode() {
    return this.nodeSlots.gaussianPositionWorldNode;
  }
  set gaussianPositionWorldNode(e) {
    this.setNode("gaussianPositionWorldNode", e, !0);
  }
  get gaussianScaleNode() {
    return this.nodeSlots.gaussianScaleNode;
  }
  set gaussianScaleNode(e) {
    this.setNode("gaussianScaleNode", e, !0);
  }
  get gaussianRotationNode() {
    return this.nodeSlots.gaussianRotationNode;
  }
  set gaussianRotationNode(e) {
    this.setNode("gaussianRotationNode", e, !0);
  }
  get gaussianOpacityNode() {
    return this.nodeSlots.gaussianOpacityNode;
  }
  set gaussianOpacityNode(e) {
    this.setNode("gaussianOpacityNode", e, !0);
  }
  get gaussianColorNode() {
    return this.nodeSlots.gaussianColorNode;
  }
  set gaussianColorNode(e) {
    this.setNode("gaussianColorNode", e, !0);
  }
  get gaussianVisibilityNode() {
    return this.nodeSlots.gaussianVisibilityNode;
  }
  set gaussianVisibilityNode(e) {
    this.setNode("gaussianVisibilityNode", e, !0);
  }
  get rasterColorNode() {
    return this.nodeSlots.rasterColorNode;
  }
  set rasterColorNode(e) {
    this.setNode("rasterColorNode", e, !1);
  }
  get rasterAlphaNode() {
    return this.nodeSlots.rasterAlphaNode;
  }
  set rasterAlphaNode(e) {
    this.setNode("rasterAlphaNode", e, !1);
  }
  get rasterDiscardNode() {
    return this.nodeSlots.rasterDiscardNode;
  }
  set rasterDiscardNode(e) {
    this.setNode("rasterDiscardNode", e, !1);
  }
}
function Fa(a, e, t, s = {}) {
  return new Ia(a, e, t, s);
}
export {
  Yr as CanonicalGaussianPlyLoader,
  ja as DistanceAwareRadialLodPackingStrategy,
  qr as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  Ps as GaussianCloud,
  Ys as GaussianData,
  Ia as GaussianHardwarePass,
  Qt as GaussianLod,
  Da as GaussianLodColorHelper,
  Rs as GaussianLodNode,
  Zt as GaussianOctree,
  ti as GaussianOctreeNode,
  Ra as GaussianPass,
  Wa as GaussianStore,
  Pi as GaussianStoreAttributes,
  Li as GaussianStorePackedAttribute,
  za as LodHelper,
  $a as MaximumLodPackingStrategy,
  Oa as OctreeHelper,
  Xs as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Ea as RadialLodPackingStrategy,
  xi as RadialLodWorkerPlanner,
  Ni as RemainingCapacityBudgetStrategy,
  Ua as SourceFractionBudgetStrategy,
  rr as StreamingLodPackingStrategy,
  pi as TieredRadialLodPackingStrategy,
  ts as gaussianColor,
  Fa as gaussianHardwarePass,
  Jt as gaussianIndex,
  es as gaussianObjectId,
  ss as gaussianObjectMatrix,
  rs as gaussianObjectVisible,
  ft as gaussianOpacity,
  Va as gaussianPass,
  dt as gaussianPositionLocal,
  Je as gaussianPositionWorld,
  ls as gaussianProjectedArea,
  os as gaussianProjectedSigma,
  pt as gaussianRotation,
  ht as gaussianScale,
  Js as gaussianScreenBoundsMax,
  Qs as gaussianScreenBoundsMin,
  ns as gaussianScreenPosition,
  as as gaussianViewDepth,
  is as gaussianViewDirection,
  Ms as isStreamingLodPackingStrategy,
  Kr as packShRgb8e8,
  xt as rasterGaussianCenter,
  kt as rasterGaussianColor,
  cs as rasterGaussianCoord,
  tt as rasterGaussianIndex,
  St as rasterGaussianOpacity,
  gt as rasterObjectId,
  mt as rasterPixelCoordinate,
  _t as rasterPixelDelta,
  yt as rasterPixelValue,
  Ct as rasterPower,
  bt as rasterScreenPosition,
  vt as rasterScreenUV,
  us as rasterUV,
  wt as rasterViewDepth,
  ds as rasterWeight,
  Zs as shBytesPerCoefficient,
  Ba as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
