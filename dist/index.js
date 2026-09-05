import { StorageBufferAttribute as Be, Vector3 as L, Quaternion as xr, Box3 as qt, Object3D as Ds, Matrix4 as Oe, Ray as wr, LineSegments as _r, BufferGeometry as kr, Float32BufferAttribute as $s, LineBasicMaterial as Sr, BoxGeometry as Cr, MeshBasicMaterial as Nr, DoubleSide as Es, InstancedMesh as Lr, Color as js, IndirectStorageBufferAttribute as Pr, Vector4 as Rr, Scene as ct, PassNode as nt, HalfFloatType as Et, SRGBColorSpace as Us, StorageTexture as fs, NoColorSpace as Gr, RedFormat as Mr, FloatType as Ir, NearestFilter as gs, PerspectiveCamera as Ws, Vector2 as Vs, Mesh as Tr, InstancedBufferGeometry as Ar, MeshBasicNodeMaterial as Br, WebGPUCoordinateSystem as ms } from "three/webgpu";
import { property as M, bool as ue, exp as Kt, float as U, storage as m, uint as g, vec3 as ot, mix as Or, wgslFn as G, instanceIndex as ee, workgroupArray as F, workgroupId as X, invocationLocalIndex as we, uniform as Re, uvec2 as ze, Fn as Ye, If as A, Return as fe, vec4 as Z, mat4 as vs, normalize as zr, sqrt as Ge, clamp as ye, log as Dr, ceil as bs, vec2 as ge, ivec2 as Xe, int as ys, floor as jt, subgroupIndex as Rt, invocationSubgroupIndex as Gt, subgroupSize as Mt, atomicStore as $r, storageTexture as Ut, select as be, Loop as Ve, Break as Fe, Continue as It, max as xs, workgroupBarrier as ws, atomicAdd as Ae, textureStore as _s, colorSpaceToWorking as Fs, varying as rt, positionLocal as Er, screenCoordinate as jr, perspectiveDepthToViewZ as Ur, viewZToOrthographicDepth as Wr } from "three/tsl";
class qs {
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
const Vr = 16, Ks = 4;
function Fr(a, e, t) {
  const s = Math.max(Math.abs(a), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const r = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), i = 127 / 2 ** r, o = Tt(a, i), n = Tt(e, i), l = Tt(t, i), c = r + 127;
  return (o | n << 8 | l << 16 | c << 24) >>> 0;
}
function Da(a) {
  const e = 2 ** ((a >>> 24) - 127) / 127;
  return [
    At(a) * e,
    At(a >>> 8) * e,
    At(a >>> 16) * e
  ];
}
function Hs(a) {
  return a === "rgb8e8" ? Ks : Vr;
}
function Tt(a, e) {
  return Math.min(127, Math.max(-127, Math.round(a * e))) & 255;
}
function At(a) {
  const e = a & 255;
  return e < 128 ? e : e - 256;
}
const ks = {
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
}, qr = [
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
class Kr {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = Hr(e), s = new Map(
      t.properties.map((p, b) => [p.name, b])
    );
    for (const p of qr)
      if (!s.has(p))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${p}`);
    const r = t.properties.map((p) => p.name.match(/^f_rest_(\d+)$/)?.[1]).filter((p) => p !== void 0).map(Number).sort((p, b) => p - b);
    for (let p = 0; p < r.length; p++)
      if (r[p] !== p)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const i = r.length / 3, o = i + 1, n = Math.sqrt(o);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = Yr(e, t), c = (p) => s.get(p), u = r.map(
      (p) => c(`f_rest_${p}`)
    ), h = t.vertexCount, d = new Float32Array(h * 4), f = new Float32Array(h * 4), v = new Float32Array(h * 4), x = new Float32Array(h * o * 4);
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
      const k = l(p, c("opacity"));
      f[b + 3] = 1 / (1 + Math.exp(-k));
      const C = l(p, c("rot_0")), P = l(p, c("rot_1")), w = l(p, c("rot_2")), S = l(p, c("rot_3")), I = Math.hypot(P, w, S, C);
      I > 1e-12 ? (v[b] = P / I, v[b + 1] = w / I, v[b + 2] = S / I, v[b + 3] = C / I) : v[b + 3] = 1;
      const N = p * o * 4;
      x[N] = l(p, c("f_dc_0")), x[N + 1] = l(p, c("f_dc_1")), x[N + 2] = l(p, c("f_dc_2"));
      for (let _ = 1; _ < o; _++) {
        const B = N + _ * 4, z = _ - 1;
        for (let T = 0; T < 3; T++) {
          const $ = u[T * i + z];
          x[B + T] = l(
            p,
            $
          );
        }
      }
    }
    return new qs(
      {
        means: it("ply.means", d),
        scalesOpacity: it("ply.scales-opacity", f),
        rotations: it("ply.rotations-xyzw", v),
        shCoefficients: it("ply.sh-coefficients", x)
      },
      {
        count: h,
        shDegree: n - 1,
        ownsBuffers: !0
      }
    );
  }
}
function it(a, e) {
  const t = new Be(e, 4);
  return t.name = a, t;
}
function Hr(a) {
  const e = new Uint8Array(a), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let v = 0; v <= e.length - t.length; v++) {
    let x = !0;
    for (let p = 0; p < t.length; p++)
      if (e[v + p] !== t[p]) {
        x = !1;
        break;
      }
    if (x) {
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
    const x = v.trim().split(/\s+/);
    if (x[0] === "format") {
      if (x[1] !== "ascii" && x[1] !== "binary_little_endian" && x[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${x[1] ?? "unknown"}`);
      n = x[1];
    } else if (x[0] === "element") {
      l = x[1] ?? "";
      const p = Number(x[2]);
      if (!Number.isInteger(p) || p < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: p }), l === "vertex" && (c = p);
    } else if (x[0] === "property" && l === "vertex") {
      if (x[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const p = x[1], b = x[2];
      if (!(p in ks) || b === void 0)
        throw new Error(`Unsupported vertex property: ${v}`);
      h.push({ name: b, type: p, byteOffset: u }), u += ks[p];
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
function Yr(a, e) {
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
    return Xr(s, l, n.type, r);
  };
}
function Xr(a, e, t, s) {
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
const Ss = 1 / 255, Zr = 0.99, Bt = 1e-12;
function Qr(a, e, t, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const r = e.means.array, i = e.scalesOpacity.array, o = e.rotations.array, n = new L(), l = new L(), c = new L(), u = new xr();
  let h = 1;
  for (const d of t) {
    const f = d.gaussianIndex * 4, v = Math.min(1, Math.max(0, i[f + 3]));
    if (v < Ss) continue;
    u.set(
      -o[f],
      -o[f + 1],
      -o[f + 2],
      o[f + 3]
    ).normalize(), n.set(
      a.origin.x - r[f],
      a.origin.y - r[f + 1],
      a.origin.z - r[f + 2]
    ).applyQuaternion(u), l.copy(a.direction).applyQuaternion(u);
    const x = Math.max(i[f], Bt), p = Math.max(i[f + 1], Bt), b = Math.max(i[f + 2], Bt);
    n.set(
      n.x / x,
      n.y / p,
      n.z / b
    ), l.set(
      l.x / x,
      l.y / p,
      l.z / b
    );
    const k = l.lengthSq();
    if (k <= Number.EPSILON) continue;
    const C = Math.max(
      0,
      -n.dot(l) / k
    );
    c.copy(n).addScaledVector(l, C);
    const P = Math.min(
      Zr,
      v * Math.exp(-0.5 * c.lengthSq())
    );
    if (P < Ss || (h *= 1 - P, 1 - h < s)) continue;
    const w = a.at(C, new L());
    return {
      gaussianIndex: d.gaussianIndex,
      distance: a.origin.distanceTo(w),
      point: w
    };
  }
  return null;
}
class Jr {
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
class Ht {
  constructor(e, t, s, r) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = r, this.bounds = ei(e), this.rootBounds = ti(this.bounds);
    const i = e.means.array, o = e.scalesOpacity.array, n = [], l = [], c = Array.from({ length: e.count }, (h, d) => d), u = (h, d, f) => {
      const v = n.length;
      n.push(null);
      const x = h.length > t && f < s && d.max.x - d.min.x > Number.EPSILON, p = [];
      if (x) {
        const C = d.getCenter(new L()), P = Array.from({ length: 8 }, () => []);
        for (const w of h) {
          const S = w * 4, I = (i[S] >= C.x ? 1 : 0) | (i[S + 1] >= C.y ? 2 : 0) | (i[S + 2] >= C.z ? 4 : 0);
          P[I].push(w);
        }
        for (let w = 0; w < 8; w++) {
          const S = P[w];
          S.length !== 0 && p.push(
            u(
              S,
              si(d, C, w),
              f + 1
            )
          );
        }
      }
      let b = 0;
      if (p.length > 0)
        for (const C of p)
          b = Math.max(
            b,
            n[C].maxSplatRadius
          );
      else {
        for (const C of h) {
          const P = C * 4;
          b = Math.max(
            b,
            o[P],
            o[P + 1],
            o[P + 2]
          );
        }
        l.push(v);
      }
      const k = d.clone().expandByScalar(b * 3);
      return n[v] = new Jr(
        v,
        f,
        d,
        h.length,
        b,
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
    return new Ht(
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
    const i = this.data.means.array, o = this.data.scalesOpacity.array, n = new L(), l = new L(), c = [];
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
    return c.sort((u, h) => u.distance - h.distance), c.length > r && (c.length = r), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function ei(a) {
  const e = a.means.array, t = new qt(), s = new L();
  for (let r = 0; r < a.count; r++) {
    const i = r * 4;
    s.set(e[i], e[i + 1], e[i + 2]), t.expandByPoint(s);
  }
  return t;
}
function ti(a) {
  const e = a.getCenter(new L()), t = a.getSize(new L()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new qt(
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
function si(a, e, t) {
  return new qt(
    new L(
      t & 1 ? e.x : a.min.x,
      t & 2 ? e.y : a.min.y,
      t & 4 ? e.z : a.min.z
    ),
    new L(
      t & 1 ? a.max.x : e.x,
      t & 2 ? a.max.y : e.y,
      t & 4 ? a.max.z : e.z
    )
  );
}
class Cs extends Ds {
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
    const s = new Oe().copy(this.matrixWorld).invert(), r = new wr().copy(e.ray).applyMatrix4(s), i = this.raycastMode === "full" ? this.lod.octree.raycast(r) : this.lod.raycast(r, this.packing), o = Qr(
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
class $a extends _r {
  constructor(e, t = {}) {
    const s = t.minDepth ?? 0, r = t.maxDepth ?? 1 / 0, i = e.nodes.filter(
      (h) => h.depth >= s && h.depth <= r && (t.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(i.length * 12 * 2 * 3);
    let n = 0;
    for (const h of i) {
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
      for (const [x, p] of ri)
        o.set(v[x], n), o.set(v[p], n + 3), n += 6;
    }
    const l = new kr();
    l.setAttribute("position", new $s(o, 3)), l.computeBoundingSphere();
    const c = t.opacity ?? 0.55, u = new Sr({
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
const ri = [
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
class Ns {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const ii = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class Yt {
  constructor(e, t) {
    this.octree = e, this.levels = ai(t.levels ?? ii), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? ni, r = new Float64Array(e.data.count);
    for (let i = 0; i < r.length; i++) {
      const o = s(i, e);
      r[i] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((i) => {
      if (i.gaussianIndices === null)
        return new Ns(
          i.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(i.gaussianIndices).sort(
          (n, l) => r[l] - r[n] || n - l
        )
      );
      return new Ns(
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
    return new Yt(e, t);
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
    const o = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, l = new L(), c = new L(), u = [], h = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.nodeIds.length; d++) {
      const f = t.nodeIds[d], v = this.getLeafNode(f);
      if (h.has(f))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${f}`
        );
      h.add(f);
      const x = t.lodLevels[d], p = v.levelCounts[x];
      if (p === void 0)
        throw new RangeError(`GaussianLod level ${x} does not exist`);
      const b = this.octree.nodes[f], k = Math.max(0, r - 3) * b.maxSplatRadius, C = k === 0 ? b.raycastBounds : b.raycastBounds.clone().expandByScalar(k);
      if (e.intersectsBox(C))
        for (let P = 0; P < p; P++) {
          const w = v.sortedGaussianIndices[P], S = w * 4;
          l.set(o[S], o[S + 1], o[S + 2]);
          const I = Math.max(
            n[S],
            n[S + 1],
            n[S + 2]
          ) * r;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > I * I) && u.push({
            gaussianIndex: w,
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
function ai(a) {
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
function ni(a, e) {
  const t = e.data.scalesOpacity.array, s = a * 4, r = [t[s], t[s + 1], t[s + 2]];
  return r.sort((i, o) => o - i), t[s + 3] * r[0] * r[1];
}
const oi = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class Ea extends Ds {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : oi, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
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
    const t = new L(), s = new L(), r = new Oe();
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (o.length === 0) continue;
      const n = new Cr(1, 1, 1), l = new Nr({
        color: this.colors[i % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: Es,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new Lr(n, l, o.length);
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
const Xt = M("uint", "gaussianIndex"), Zt = M("uint", "gaussianObjectId"), ut = M("vec3", "gaussianPositionLocal"), Qe = M("vec3", "gaussianPositionWorld"), dt = M("vec3", "gaussianScale"), ht = M("vec4", "gaussianRotation"), pt = M("float", "gaussianOpacity"), Qt = M("vec3", "gaussianColor"), Jt = M("mat4", "gaussianObjectMatrix"), es = M("bool", "gaussianObjectVisible"), ts = M("vec3", "gaussianViewDirection"), ss = M("float", "gaussianViewDepth"), rs = M(
  "vec2",
  "gaussianScreenPosition"
), Ys = M(
  "vec2",
  "gaussianScreenBoundsMin"
), Xs = M(
  "vec2",
  "gaussianScreenBoundsMax"
), is = M(
  "vec2",
  "gaussianProjectedSigma"
), as = M("float", "gaussianProjectedArea"), et = M("uint", "rasterGaussianIndex"), ft = M("uint", "rasterObjectId"), gt = M("uvec2", "rasterPixelCoordinate"), mt = M("vec2", "rasterScreenPosition"), vt = M("vec2", "rasterScreenUV"), bt = M("float", "rasterPixelValue"), yt = M("vec2", "rasterGaussianCenter"), xt = M("vec2", "rasterPixelDelta"), ns = M("vec2", "rasterGaussianCoord"), os = M("vec2", "rasterUV"), wt = M("float", "rasterViewDepth"), _t = M("vec3", "rasterGaussianColor"), kt = M("float", "rasterGaussianOpacity"), St = M("float", "rasterPower"), ls = M("float", "rasterWeight");
function Zs() {
  return {
    gaussianPositionLocalNode: ut,
    gaussianPositionWorldNode: Qe,
    gaussianScaleNode: dt,
    gaussianRotationNode: ht,
    gaussianOpacityNode: pt,
    gaussianColorNode: Qt,
    gaussianVisibilityNode: ue(!0),
    rasterPixelValueNode: U(0),
    rasterBreakNode: ue(!1),
    rasterColorNode: _t,
    rasterAlphaNode: kt.mul(Kt(St)),
    rasterDiscardNode: ue(!1)
  };
}
const Ze = /* @__PURE__ */ new Set([
  Xt,
  Zt,
  ut,
  Qe,
  dt,
  ht,
  pt,
  Qt,
  Jt,
  es,
  ts,
  ss,
  rs,
  Ys,
  Xs,
  is,
  as
]), Je = /* @__PURE__ */ new Set([
  et,
  ft,
  gt,
  mt,
  vt,
  bt,
  yt,
  xt,
  ns,
  os,
  wt,
  _t,
  kt,
  St,
  ls
]), Qs = /* @__PURE__ */ new Set([
  gt,
  mt,
  vt
]), li = /* @__PURE__ */ new Set([
  ...Qs,
  bt,
  et,
  ft,
  yt,
  xt,
  wt
]);
function cs(a, e, t) {
  a.traverse((s) => {
    if ((Ze.has(s) || Je.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function xe(a, e, t) {
  a.traverse((s) => {
    if ((Ze.has(s) || Je.has(s)) && !e.has(s))
      throw new Error(
        `GaussianPass.${t} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const ci = [
  15228264,
  15906891,
  4900235
];
class ja {
  constructor(e, t = {}) {
    if (this.pass = e, t.colors !== void 0 && t.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = t.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...t.colors ?? ci], this.tintStrength = s, this.lodLevelAttribute = e.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = e.subscribeDebug(() => this.update()), this.enabled = t.enabled ?? !0;
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
    const e = this.lodLevelAttribute.bufferAttribute, t = m(e, "uint", e.count).toReadOnly().element(et).mod(g(this.colors.length)), s = this.colors.map((o) => {
      const n = new js(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return ot(n.r, n.g, n.b);
    });
    let r = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      r = t.equal(g(o)).select(s[o], r);
    const i = Or(
      this.baseColorNode,
      r,
      U(this.tintStrength)
    );
    this.boundBuffer = e, this.helperColorNode = i, this.pass.rasterColorNode = i;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function De(a) {
  if (!Number.isInteger(a) || a < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class Ua {
  setFromCamera(e, t) {
    return this;
  }
  pack({ lod: e, maxGaussians: t }) {
    De(t);
    const s = e.octree.data.count;
    if (t < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${t}`
      );
    const r = e.octree.leafNodeIds.slice(), i = new Uint8Array(r.length);
    return i.fill(e.finestLevel), { nodeIds: r, lodLevels: i, gaussianCount: s };
  }
}
function us(a, e, t) {
  return a.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), a.getWorldPosition(t), e.worldToLocal(t);
}
function ds(a, e) {
  const t = e instanceof L ? e.clone() : a.octree.bounds.getCenter(new L()), s = a.octree.rootBounds.getSize(new L()), r = Math.max(s.length() * 0.5, Number.EPSILON), i = new L(), o = Array.from(a.octree.leafNodeIds, (n) => (a.octree.nodes[n].bounds.getCenter(i), {
    nodeId: n,
    radius: i.distanceTo(t) / r
  }));
  return o.sort(
    (n, l) => n.radius - l.radius || n.nodeId - l.nodeId
  ), o;
}
class Wa {
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
      us(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (De(t), t === 0) return ui();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const r = ds(e, this.center), i = [];
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
function ui() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class di {
  cameraCenter = new L();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof L ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = hi(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof L ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      us(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (De(t), t === 0) return pi();
    const s = e.octree.data.count;
    if (s <= t) {
      const h = e.octree.leafNodeIds.slice(), d = new Uint8Array(h.length);
      return d.fill(e.finestLevel), { nodeIds: h, lodLevels: d, gaussianCount: s };
    }
    const r = ds(e, this.center), i = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], o = [], n = [];
    let l = 0, c = 0, u = 0;
    for (let h = 0; h < i.length; h++) {
      const d = this.budgetShares[h];
      if (u += d, d === 0) continue;
      const f = h === i.length - 1 ? t : Math.floor(t * u), v = i[h];
      for (; c < r.length; ) {
        const x = r[c], p = e.nodes[x.nodeId].levelCounts[v];
        if (l + p > f) break;
        o.push(x.nodeId), n.push(v), l += p, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(n),
      gaussianCount: l
    };
  }
}
function hi(a) {
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
function pi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Va {
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
      us(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (De(t), t === 0) return fi();
    const s = ds(e, this.center), r = s.map(
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
function fi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
function gi(a) {
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
const Js = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, Ls = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Js], { type: "text/javascript;charset=utf-8" });
function mi(a) {
  let e;
  try {
    if (e = Ls && (self.URL || self.webkitURL).createObjectURL(Ls), !e) throw "";
    const t = new Worker(e, {
      name: a?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Js),
      {
        name: a?.name
      }
    );
  }
}
const vi = 2;
class bi {
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
    this.worker = new mi({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const t = gi(e), s = Array.from(
      { length: vi },
      () => yi(t.leafNodeIds.length)
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
      packing: xi(t),
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
function yi(a) {
  return {
    nodeIds: new ArrayBuffer(a * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(a * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function xi(a) {
  return {
    nodeIds: new Uint32Array(a.buffer.nodeIds, 0, a.length),
    lodLevels: new Uint8Array(a.buffer.lodLevels, 0, a.length),
    gaussianCount: a.gaussianCount
  };
}
const wi = 1024 * 1024, _i = 16, ki = 1.25;
class er {
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
    if (this.targetStrategy = e, this.targetPlanner = t.targetPlanner ?? null, this.maxUploadBytesPerPack = t.maxUploadBytesPerPack ?? wi, this.maxChangedCellsPerPack = t.maxChangedCellsPerPack ?? _i, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
    if (De(e.maxGaussians), this.bindLod(e.lod), !this.initialized) {
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
    if (De(e.maxGaussians), this.bindLod(e.lod), !this.initialized)
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
    return Gs(e.lod, t, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.targetDirty = !1, t;
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
        Gs(e.lod, t.packing, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.changes = this.planChanges(e.lod, t.packing), this.changeCursor = 0, this.latestTargetPlanningMs = t.planningMs, this.latestTargetRoundTripMs = t.roundTripMs;
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
        Rs(
          e,
          n,
          l,
          c < 0 ? null : c
        )
      );
    }
    for (let o = 0; o < t.nodeIds.length; o++) {
      const n = t.nodeIds[o], l = t.lodLevels[o], c = this.appliedIndices[n], u = c < 0 ? null : this.appliedLodLevels[c];
      (u === null || l > u) && i.push(Rs(e, n, u, l));
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
function Ps(a) {
  return a instanceof er;
}
function Rs(a, e, t, s) {
  const r = a.nodes[e], i = t === null ? 0 : r.levelCounts[t], o = s === null ? 0 : r.levelCounts[s], n = Math.max(0, o - i), l = Math.max(0, i - o), c = t !== null && s !== null && t !== s ? Math.min(i, o) : 0, u = 48 + a.octree.data.shCoefficientCount * Ks + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: o - i,
    estimatedUploadBytes: Math.ceil(
      (n * u + l * 16 + c * 4) * ki
    )
  };
}
function Gs(a, e, t) {
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
class Si {
  allocate({ remainingGaussians: e }) {
    return e;
  }
}
class Fa {
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
function Ke(a, e, t) {
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
    const d = s[h], f = u.start + u.count, v = d.start - f;
    v <= e && l + v <= n ? (u.count = d.start + d.count - u.start, l += v) : (c.push(u), u = { ...d });
  }
  return c.push(u), c;
}
function He(a) {
  let e = 0;
  for (const t of a) e += t.count;
  return e;
}
function re(a, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      a.addUpdateRange(
        s.start * t,
        s.count * t
      );
    a.needsUpdate = !0;
  }
}
const tr = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), sr = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), rr = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class Ci {
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
  [tr](e) {
    this.assertUsable();
    const t = this.packedBuffer, s = new Be(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [sr](e) {
    re(this.bufferAttribute, e, 1);
  }
  [rr]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const ir = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), ar = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class Ni {
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
  [ir](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const r = new Ci(e, t);
    return this.attributes.set(e, r), r;
  }
  [ar]() {
    for (const e of this.attributes.values())
      e[rr]();
    this.attributes.clear();
  }
}
class Li {
  constructor(e) {
    this.attribute = e;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(e) {
    this.writtenSlots.length = 0, this.attribute[tr](new Uint32Array(e)), this.freshBuffer = !0;
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
    const e = this.writtenSlots.length, t = Ke(this.writtenSlots, 16, 0.25), s = He(t);
    return this.freshBuffer || this.attribute[sr](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const Pi = 16777216;
class qa {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new Ni();
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
    this.loader = e.loader ?? new Kr(), this.budgetingStrategy = e.budgetingStrategy ?? new Si(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = Mi(
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
    const t = this.attributes[ir](
      "lodLevel",
      "u32"
    ), s = new Li(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let r = null, i = null;
    try {
      return r = Ht.build(s, {
        ...t.octree,
        ownsData: !0
      }), i = Yt.build(r, {
        ...t.lod,
        ownsOctree: !0
      }), this.addLod(i, {
        name: t.name ?? Gi(e),
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
    const s = this.allocateObjectId(), r = Dt(t.priority ?? 0), i = new Cs(
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
      lastLodFocus: new L(Number.NaN, Number.NaN, Number.NaN),
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
    const s = this.allocateObjectId(), r = Dt(t.priority ?? 0), i = new Cs(
      this,
      s,
      0,
      t.name,
      e,
      null,
      r
    ), o = t.packingStrategy ?? this.defaultPackingStrategy ?? Ii(this.defaultStreamingLod);
    return this.entries.push({
      cloud: i,
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
    }), this.cloudList.push(i), this.invalidatePacking(), i;
  }
  remove(e) {
    if (this.disposed) return;
    const t = this.entries.findIndex((r) => r.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && Ms(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = Bi(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), r = performance.now(), i = this.planPackings(s), o = performance.now() - r, n = Math.min(
      s,
      this.entries.reduce((f, v) => f + v.sourceGaussianCount, 0)
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
    const t = this.entries.find((_) => _.cloud === e);
    if (t === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    if (t.lod === null || t.packing === null || t.allocatedBudget === null)
      throw new Error("GaussianCloud is not an initialized LOD entry");
    const s = t.packingStrategy;
    if (!Ps(s))
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
    const f = /* @__PURE__ */ new Map();
    for (const _ of i.transitions) {
      const B = l.get(_.nodeId), z = _.lodLevel === null ? 0 : t.lod.nodes[_.nodeId].levelCounts[_.lodLevel], T = Math.min(
        B?.slots.length ?? 0,
        z
      );
      if (f.set(_.nodeId, {
        previousCell: B,
        retainedCount: T
      }), B !== void 0)
        for (let $ = T; $ < B.slots.length; $++) {
          const D = B.slots[$];
          h.push(D), d.push(D);
        }
    }
    const v = this.scratchWrittenSlots;
    v.length = 0;
    for (const _ of i.transitions) {
      const B = f.get(_.nodeId), { previousCell: z, retainedCount: T } = B;
      if (_.lodLevel === null) {
        u.delete(_.nodeId);
        continue;
      }
      const $ = t.lod.nodes[_.nodeId].levelCounts[_.lodLevel], D = z?.slots, K = D !== void 0 && D.length === $ ? D : new Uint32Array($);
      K !== D && D !== void 0 && T > 0 && K.set(D.subarray(0, T));
      for (let W = T; W < $; W++) {
        const le = h.pop();
        if (le === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, _.nodeId, W),
          le,
          n.means.array,
          n.scalesOpacity.array,
          n.rotations.array,
          n.shCoefficients.array,
          n.shCoefficientCount
        ), K[W] = le, v.push(le);
      }
      const oe = {
        lodLevel: _.lodLevel,
        slots: K
      };
      for (const W of this.attributePackers)
        W.updateCell({ previousCell: z, cell: oe, retainedCount: T });
      u.set(_.nodeId, oe);
    }
    const x = this.nextSlotMarkGeneration(n.count);
    for (const _ of v) this.slotMarks[_] = x;
    const p = this.scratchClearedSlots;
    p.length = 0;
    for (const _ of d)
      this.slotMarks[_] !== x && p.push(_);
    const b = n.scalesOpacity.array;
    for (const _ of p) b[_ * 4 + 3] = 0;
    const k = Ke(v, 4, 0.15), C = Ke(p, 16, 0.25);
    re(n.means, k, 4), re(n.scalesOpacity, k, 4), re(n.scalesOpacity, C, 4), re(n.rotations, k, 4), re(
      n.shCoefficients,
      k,
      n.shCoefficientCount * n.shCoefficients.itemSize
    );
    const P = this.commitAttributePackers(), w = this.count - t.count + i.packing.gaussianCount, S = He(k), I = He(C), N = performance.now() - c;
    return t.count = i.packing.gaussianCount, t.packing = i.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = h, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: n.count,
      activeGaussians: w,
      reusedSlots: w - v.length,
      writtenSlots: v.length,
      clearedSlots: p.length,
      estimatedUploadBytes: S * zt(n) + I * 16 + P.estimatedUploadBytes,
      writtenSlotRanges: k,
      clearedSlotRanges: C,
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
      if (Ti(n, o), i.lod === null) {
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
      Ai(i.lod, u), s.push({
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
    const r = Dt(t);
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
    let r = 0, i = !1;
    const o = [];
    for (const n of this.entries) {
      const l = n.packingStrategy;
      if (n.lod === null || l === null || !Ps(l))
        continue;
      n.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(t), n.cloud.worldToLocal(t);
      const c = n.lod.octree.rootBounds.getSize(new L()).length() * 0.5, u = Math.max(0.05, c * 0.025);
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
        e.source !== null && e.ownsSource && e.source.dispose(), e.lod !== null && e.ownsLod && e.lod.dispose(), e.ownsPackingStrategy && Ms(e.packingStrategy), e.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[ar](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(e, t) {
    const s = this.shDegree, r = (s + 1) ** 2, i = new Float32Array(t * 4), o = new Float32Array(t * 4), n = new Float32Array(t * 4), l = new Uint32Array(t * r), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const x of e) {
      const { entry: p } = x, b = /* @__PURE__ */ new Map();
      for (const k of this.plannedCells(x)) {
        const C = new Uint32Array(k.count);
        for (let P = 0; P < k.count; P++) {
          const w = this.cellSourceIndex(p, k.nodeId, P);
          this.copySourceToSlot(
            p,
            w,
            u,
            i,
            o,
            n,
            l,
            r
          ), C[P] = u++;
        }
        b.set(k.nodeId, {
          lodLevel: k.lodLevel,
          slots: C
        });
      }
      c.set(p, b);
    }
    const h = Array.from(
      { length: t - u },
      (x, p) => t - 1 - p
    ), d = new qs(
      {
        means: at("3dgs.store.means-object", i),
        scalesOpacity: at("3dgs.store.scales-opacity", o),
        rotations: at("3dgs.store.rotations", n),
        shCoefficients: at(
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
    for (const x of this.attributePackers)
      x.allocate(t), x.backfill({ cells: f });
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
        estimatedUploadBytes: u * zt(d) + v.estimatedUploadBytes,
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
    for (const w of e) {
      if (r.add(w.entry), i += w.count, !w.selectionChanged) continue;
      const S = /* @__PURE__ */ new Map();
      for (const I of this.plannedCells(w))
        S.set(I.nodeId, I);
      s.set(w.entry, S);
    }
    const o = [...this.freeSlots], n = this.scratchReleasedSlots;
    n.length = 0;
    for (const [w, S] of this.cellSlotsByEntry) {
      const I = s.get(w);
      if (!(I === void 0 && r.has(w)))
        for (const [N, _] of S) {
          const B = _.slots, z = Math.min(
            B.length,
            I?.get(N)?.count ?? 0
          );
          for (let T = z; T < B.length; T++) {
            const $ = B[T];
            o.push($), n.push($);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), c = this.scratchWrittenSlots;
    c.length = 0;
    let u = 0;
    for (const w of e) {
      const S = this.cellSlotsByEntry.get(w.entry);
      if (!w.selectionChanged && S !== void 0) {
        l.set(w.entry, S), u += w.count;
        continue;
      }
      const I = /* @__PURE__ */ new Map();
      for (const N of s.get(w.entry)?.values() ?? []) {
        const _ = S?.get(N.nodeId), B = _?.slots, z = Math.min(B?.length ?? 0, N.count), T = B !== void 0 && B.length === N.count ? B : new Uint32Array(N.count);
        T !== B && B !== void 0 && z > 0 && T.set(B.subarray(0, z)), u += z;
        for (let D = z; D < N.count; D++) {
          const K = o.pop();
          if (K === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            w.entry,
            this.cellSourceIndex(w.entry, N.nodeId, D),
            K,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), T[D] = K, c.push(K);
        }
        const $ = {
          lodLevel: N.lodLevel,
          slots: T
        };
        for (const D of this.attributePackers)
          D.updateCell({
            previousCell: _,
            cell: $,
            retainedCount: z
          });
        I.set(N.nodeId, $);
      }
      l.set(w.entry, I);
    }
    const h = this.nextSlotMarkGeneration(t.count);
    for (const w of c) this.slotMarks[w] = h;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const w of n)
      this.slotMarks[w] !== h && d.push(w);
    const f = t.scalesOpacity.array;
    for (const w of d) f[w * 4 + 3] = 0;
    const v = c.length, x = d.length, p = Ke(c, 4, 0.15), b = Ke(d, 16, 0.25);
    re(t.means, p, 4), re(t.scalesOpacity, p, 4), re(t.scalesOpacity, b, 4), re(t.rotations, p, 4), re(
      t.shCoefficients,
      p,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const k = this.commitAttributePackers(), C = He(p), P = He(b);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: i,
        reusedSlots: u,
        writtenSlots: v,
        clearedSlots: x,
        estimatedUploadBytes: C * zt(t) + P * 16 + k.estimatedUploadBytes,
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
    Ot(c.means.array, t, r, s), Ot(
      c.scalesOpacity.array,
      t,
      i,
      s
    ), Ot(
      c.rotations.array,
      t,
      o,
      s
    ), r[s * 4 + 3] = e.cloud.objectId, Ri(
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
    if (e >= Pi)
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
function at(a, e, t = 4) {
  const s = new Be(e, t);
  return s.name = a, s;
}
function Ot(a, e, t, s) {
  t.set(
    a.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function Ri(a, e, t, s, r) {
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
    t[n + u] = Fr(
      l[h],
      l[h + 1],
      l[h + 2]
    );
  }
}
function zt(a) {
  return 48 + a.shCoefficientCount * Hs(a.shFormat);
}
function Gi(a) {
  const e = a.split(/[?#]/, 1)[0] ?? a;
  return e.slice(e.lastIndexOf("/") + 1) || "GaussianCloud";
}
function Dt(a) {
  if (!Number.isSafeInteger(a))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return a;
}
function Mi(a) {
  if (a !== "auto" && (!Number.isSafeInteger(a) || a <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return a;
}
function Ii(a) {
  const e = new di();
  return new er(e, {
    ...a,
    targetPlanner: new bi(e)
  });
}
function Ms(a) {
  a !== null && "dispose" in a && typeof a.dispose == "function" && a.dispose();
}
function Ti(a, e) {
  if (!Number.isSafeInteger(a) || a < 0 || a > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function Ai(a, e) {
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
function Bi(a, e) {
  const t = Is(
    a.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Is(a.maxBufferSize, "maxBufferSize"), r = Math.max(
    16,
    (e + 1) ** 2 * Hs("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / r);
}
function Is(a, e) {
  if (!Number.isSafeInteger(a) || a <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return a;
}
const O = 16, y = 256, Oi = 8192, j = 512, Wt = 4, R = 1 << Wt, ie = 4, de = y * ie, Q = de, ae = 32, zi = (
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
), Di = (
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
), $i = (
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
function nr(a, e) {
  return Math.max(1, Math.ceil(2 * a / e));
}
function Ei(a, e) {
  if (a !== null) {
    if (!Number.isInteger(a) || a < y || a % y !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${y} and at least ${y}`
      );
    if (nr(e, a) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const ji = (
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
  let radix_blocks = (count + ${de - 1}u) / ${de}u;
  let reduce_chunks = (radix_blocks + ${Q - 1}u) / ${Q}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${R}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${y - 1}u) / ${y}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Ui(a) {
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
const Wi = (
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
class ne {
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
      new Pr(new Uint32Array(4), 4)
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
class Vi {
  constructor(e, t, s, r, i) {
    this.renderer = e, this.visibleDispatch = i, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const o = G(
      Wi
    );
    this.computeNode = o({
      rank: ee,
      state: m(i.state, "uvec4", 1).toReadOnly(),
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
  attributes = new ne();
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function or(a) {
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
  scratch: ptr<workgroup, array<u32, ${j}>>
) -> u32 {
  let base = group_id * ${j}u;
  let first = base + lane;
  let second = first + ${y}u;
  (*scratch)[lane] = ${a.readValue("first")};
  (*scratch)[lane + ${y}u] = ${a.readValue("second")};
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
const Fi = or({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (a) => `select(0u, (*input_values)[${a}], ${a} < length)`
}), qi = or({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (a) => `select(0u, 1u, ${a} < length && (*input_values)[${a}].w > 0.0)`
}), Ki = (
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
class lt {
  output;
  attributes = new ne();
  levels = [];
  constructor(e, t, s = "intersections", r = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const i = G(Fi), o = G(
      qi
    ), n = G(Ki);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const h = Math.ceil(u / j), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        h
      ), f = F("uint", j), v = this.levels.length === 0 && r === "projectedVisibility", x = (v ? o : i)({
        lane: we,
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
        scanNode: x
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
class lr {
  constructor(e, t) {
    this.camera = e, this.background = t;
  }
  camera;
  background;
  projection = Re(new Oe());
  view = Re(new Oe());
  viewport = Re(new Rr());
  tilesX = Re(1, "uint");
  tilesY = Re(1, "uint");
  update(e, t, s, r) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = r;
  }
}
function cr(a) {
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
const Hi = (
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
  let radix_blocks = (count + ${de - 1}u) / ${de}u;
  let reduce_chunks = (radix_blocks + ${Q - 1}u) / ${Q}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${R}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${y - 1}u) / ${y}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), Yi = (() => {
  const a = cr({
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
class Xi {
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
    const d = m(
      o,
      "uint",
      t
    ).toReadOnly(), f = m(
      n,
      "uint",
      t
    ).toReadOnly(), v = m(
      i.state,
      "uvec4",
      1
    ).toReadOnly(), x = G(Hi);
    this.prepareNode = x({
      item_count_state: v,
      capacity: g(s),
      tile_counts: d,
      intersection_offsets: f,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const p = G(Yi);
    this.emitNode = p({
      rank: ee,
      tiles: ze(h.tilesX, h.tilesY),
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
    }).computeKernel([y]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = i;
  }
  renderer;
  capacity;
  buffers;
  dispatch;
  attributes = new ne();
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
const Vt = 10;
class ur {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * Vt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new Be(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Oe();
  inverseModel = new Oe();
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
    const t = this.frameComponentOffset + e.objectId * Vt * 4;
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = Zi(e, this.camera) ? 1 : 0;
  }
}
function Zi(a, e) {
  if (!a.layers.test(e.layers)) return !1;
  let t = a, s = a;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof ct;
}
function Qi(a) {
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
function Ji(a) {
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
const ea = (
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
function ta() {
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
${cr({
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
const dr = /* @__PURE__ */ new Set([
  Xt,
  Zt,
  ut,
  dt,
  ht,
  pt,
  Jt,
  es
]), hr = /* @__PURE__ */ new Set([
  ...dr,
  Qe,
  ts
]), sa = /* @__PURE__ */ new Set([
  ...hr,
  ss,
  rs,
  is,
  as
]);
class pr {
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
  attributes = new ne();
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
      cs(s, Ze, "projection");
    xe(
      e.gaussianPositionLocalNode,
      dr,
      "gaussianPositionLocalNode"
    );
    for (const [s, r] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      xe(r, hr, s);
    xe(
      e.gaussianOpacityNode,
      sa,
      "gaussianOpacityNode"
    ), xe(
      e.gaussianColorNode,
      Ze,
      "gaussianColorNode"
    ), xe(
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
    const { data: t, frame: s } = this, r = m(t.means, "vec4", t.count).toReadOnly(), i = m(
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
    ), c = m(this.projectedConic, "vec4", t.count), u = m(this.projectedColor, "vec4", t.count), h = m(this.tileCounts, "uint", t.count), d = G(
      Qi(this.antialiasMode)
    ), f = G(Ji(t.shFormat)), v = G(ta()), x = G(ea);
    return Ye(() => {
      const b = g(ee);
      A(b.greaterThanEqual(g(t.count)), () => {
        fe();
      }), this.countTileIntersections && h.element(b).assign(g(0)), l.element(b).assign(Z(0));
      const k = r.element(b), C = k.xyz, P = g(k.w), w = i.element(b), S = w.xyz, I = w.w, N = o.element(b), _ = g(t.count).add(
        P.mul(g(Vt))
      ), B = vs(
        l.element(_),
        l.element(_.add(1)),
        l.element(_.add(2)),
        l.element(_.add(3))
      ), z = vs(
        l.element(_.add(4)),
        l.element(_.add(5)),
        l.element(_.add(6)),
        l.element(_.add(7))
      ), T = l.element(_.add(8)).xyz, $ = l.element(_.add(9)).x.greaterThan(0);
      A($.not(), () => {
        fe();
      });
      const D = /* @__PURE__ */ new Map([
        [Xt, () => b],
        [Zt, () => P],
        [ut, () => C],
        [dt, () => S],
        [ht, () => N],
        [pt, () => I],
        [Jt, () => B],
        [es, () => $]
      ]), K = Pe(
        e.gaussianPositionLocalNode,
        D
      ).toVar("gaussianPositionLocalValue"), oe = B.mul(Z(K, 1)).xyz, W = new Map(D);
      W.set(Qe, () => oe);
      const le = zr(K.sub(T));
      W.set(ts, () => le);
      let _e;
      if (e.gaussianPositionWorldNode === Qe)
        _e = z.mul(Z(K, 1));
      else {
        const q = Pe(
          e.gaussianPositionWorldNode,
          W
        ).toVar("gaussianPositionWorldValue");
        _e = s.view.mul(Z(q, 1));
      }
      _e = _e.toVar("gaussianViewPosition");
      const ke = Pe(e.gaussianScaleNode, W).toVar(
        "gaussianScaleValue"
      ), he = Pe(
        e.gaussianRotationNode,
        W
      ).toVar("gaussianRotationValue"), te = d({
        view: _e,
        scale_input: ke,
        rotation_input: he,
        model_view: z,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      A(te.element(0).w.lessThanEqual(0), () => {
        fe();
      });
      const H = te.element(0).xy, Se = te.element(0).z, Me = te.element(1).xyz, $e = te.element(1).w, Ce = te.element(2).xyz, me = te.element(2).w, ce = new Map(W);
      ce.set(ss, () => Se), ce.set(rs, () => H), ce.set(is, () => Ge(Ce.xz)), ce.set(
        as,
        () => Ge($e).mul(Math.PI)
      );
      const Ee = Pe(
        e.gaussianOpacityNode,
        ce
      ).clamp(0, 1), ve = this.antialiasMode === "compensated" ? Ee.mul(
        Ge(ye(me.div($e), 0, 1))
      ) : Ee;
      A(ve.lessThan(U(1 / 255)), () => {
        fe();
      });
      const Ne = Dr(ve.mul(255)), je = Ge(
        Ne.mul(2).mul(ye(Ce.x, 1e-12, 1e4))
      ), E = Ge(
        Ne.mul(2).mul(ye(Ce.z, 1e-12, 1e4))
      ), Le = bs(je), Ue = bs(E);
      A(Le.lessThanEqual(0).or(Ue.lessThanEqual(0)), () => {
        fe();
      });
      const We = ge(Le, Ue), Ie = H.sub(We), Te = H.add(We);
      if (A(
        Te.x.lessThan(0).or(Te.y.lessThan(0)).or(Ie.x.greaterThanEqual(s.viewport.x)).or(Ie.y.greaterThanEqual(s.viewport.y)),
        () => {
          fe();
        }
      ), this.subpixelSampleCulling) {
        const q = x({
          center: H,
          conic: Me,
          power_threshold: Ne,
          extent: ge(je, E),
          viewport: ze(s.viewport.xy)
        });
        A(q.not(), () => {
          l.element(b).assign(Z(H, Se, -1)), fe();
        });
      }
      const J = f({
        gid: b,
        sh_degree: g(t.shDegree),
        direction: le,
        sh_coefficients: n
      }), V = new Map(ce);
      V.set(Qt, () => J), V.set(Ys, () => Ie), V.set(Xs, () => Te);
      const se = Pe(
        e.gaussianVisibilityNode,
        V
      );
      if (A(se.not(), () => {
        fe();
      }), this.countTileIntersections) {
        const q = Xe(ys(s.tilesX), ys(s.tilesY)).sub(1), Ct = Xe(
          ye(jt(Ie.div(U(O))), ge(0), ge(q))
        ), tt = Xe(
          ye(jt(Te.div(U(O))), ge(0), ge(q))
        ), pe = v({
          center: H,
          conic: Me,
          power_threshold: Ne,
          tile_min: Ct,
          tile_max: tt
        });
        A(pe.equal(0), () => {
          fe();
        }), h.element(b).assign(pe);
      }
      const Y = Pe(
        e.gaussianColorNode,
        V
      ).clamp(0, 1);
      l.element(b).assign(Z(H, Se, ve)), c.element(b).assign(Z(Me, Le)), u.element(b).assign(Z(Y, Ue));
    })().compute(t.count, [y]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Pe(a, e) {
  return a.context({ overrideNodes: e });
}
const ra = (
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
), ia = y, fr = 256, aa = [2048, 4096, 8192];
function na(a) {
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
    const f = Math.ceil(d / fr);
    c += f, u = Math.max(u, f);
  }
  return t.sort(), {
    max: r,
    mean: s / e,
    median: oa(t),
    p95: As(t, 0.95),
    p99: As(t, 0.99),
    tilesOver256: i,
    tilesOver512: o,
    tilesOver1024: n,
    tilesOver2048: l,
    totalBatches: c,
    maxBatches: u
  };
}
function Ts(a, e) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const t = Math.max(0, a.length - 1);
  let s = 0, r = 0, i = 0, o = 0, n = 0;
  for (let c = 0; c < t; c++) {
    const u = Math.max(0, a[c + 1] - a[c]), h = Math.min(u, e), d = u - h;
    s += h, r += d, d > 0 && i++;
    const f = Math.ceil(h / fr);
    o += f, n = Math.max(n, f);
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
function oa(a) {
  const e = Math.floor(a.length / 2);
  return a.length % 2 !== 0 ? a[e] : (a[e - 1] + a[e]) * 0.5;
}
function As(a, e) {
  const t = Math.max(0, Math.ceil(a.length * e) - 1);
  return a[t];
}
class la {
  constructor(e, t, s, r, i, o) {
    this.renderer = e, this.maxRasterizedSplatsPerTile = o, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const n = G(ra);
    this.computeNode = n({
      index: ee,
      gaussian_count: g(t),
      viewport: ze(i.viewport.xy),
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
    }).compute(t, [ia]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
  attributes = new ne();
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
      tileLoads: na(o),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : Ts(o, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: aa.map(
        (n) => Ts(o, n)
      ),
      zeroPixelSubpixelSplats: i
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function ca(a) {
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
  partials: ptr<workgroup, array<u32, ${R * ae}>>
) -> u32 {
  let block_start = block_index * ${de}u;
  let count = (*state)[0].x;
  let subgroup_count = (${y}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${R}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${ie}u; item++) {
      let position = block_start + item * ${y}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${a}u) & ${R - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${ae}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${R}u) {
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
const ua = (
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
  let chunk_start = chunk * ${Q}u;
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
), da = (
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
), ha = (
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
  var active_count = ${Q / 2}u;
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
  if (lane == 0u) { (*scratch)[${Q - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${Q / 2}u;
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
function pa(a) {
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
  partials: ptr<workgroup, array<u32, ${R * ae}>>
) -> u32 {
  let block_start = block_index * ${de}u;
  let count = (*state)[0].x;
  let subgroup_count = (${y}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${R}u) {
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
      digit = (record.x >> ${a}u) & ${R - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${R}u; target_digit++) {
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

    if (lane < ${R}u) {
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
function fa(a) {
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

  let block_start = block_index * ${de}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${y}u + lane;
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
const ga = (
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
  let chunk_start = chunk * ${Q}u;
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
function ma(a) {
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
  shared_digits: ptr<workgroup, array<u32, ${y}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${R * (y / 32)}>>
) -> u32 {
  let block_start = block_index * ${de}u;
  let count = (*state)[0].x;
  let words_per_digit = ${y / 32}u;
  if (lane < ${R}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${y}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${R}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${a}u) & ${R - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${R * (y / 32)}u) {
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
class Ft {
  constructor(e, t, s, r, i, o) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = r, this.dispatch = i, this.backend = o, this.maxRadixBlocks = Math.ceil(s / de), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / Q), this.blockHistograms = this.attributes.createUint(
      `3dgs.${t}-radix-histograms`,
      this.maxRadixBlocks * R
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${t}-radix-prefixes`,
      this.maxRadixBlocks * R
    ), this.reduced = this.attributes.createUint(
      `3dgs.${t}-radix-reduced`,
      this.maxReduceChunks * R
    );
    const n = m(i.state, "uvec4", 1).toReadOnly(), l = m(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), c = G(
      o === "subgroup" ? ua : ga
    ), u = {
      lane: we,
      group_id: X,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: m(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (u.subgroup_index = Rt, u.subgroup_lane = Gt, u.subgroup_size = Mt, u.partials = F("uint", ae)) : u.scratch = F("uint", y), this.reduceNode = c(u).computeKernel([y]).setName(`3DGS ${t} radix reduce WGSL`);
    const h = G(da);
    this.scanReducedNode = h({
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      reduced: m(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const d = G(
      ha
    );
    this.scanAddNode = d({
      lane: we,
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
      scratch: F("uint", Q)
    }).computeKernel([y]).setName(`3DGS ${t} radix scan-add WGSL`), this.sortedRecords = r.recordsA;
  }
  renderer;
  label;
  capacity;
  buffers;
  dispatch;
  backend;
  sortedRecords;
  attributes = new ne();
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
    const t = Math.ceil(Math.max(0, e) / Wt);
    this.passes = Array.from(
      { length: t },
      (s, r) => this.createPass(r, r * Wt)
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
    const s = e % 2 === 0, r = s ? this.buffers.recordsA : this.buffers.recordsB, i = s ? this.buffers.recordsB : this.buffers.recordsA, o = m(this.dispatch.state, "uvec4", 1).toReadOnly(), n = m(
      r,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = G(
      this.backend === "subgroup" ? ca(t) : fa(t)
    ), c = {
      lane: we,
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
    this.backend === "subgroup" ? (c.subgroup_index = Rt, c.subgroup_lane = Gt, c.subgroup_size = Mt, c.partials = F(
      "uint",
      R * ae
    )) : c.histogram = F("atomic<u32>", R);
    const u = l(c).computeKernel([y]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), h = G(
      this.backend === "subgroup" ? pa(t) : ma(t)
    ), d = {
      lane: we,
      block_index: X.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records_in: n,
      records_out: m(i, "uvec2", this.capacity),
      block_prefixes: m(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: F("uint", R),
      local_digit_counts: F("uint", R)
    };
    this.backend === "subgroup" ? (d.subgroup_index = Rt, d.subgroup_lane = Gt, d.subgroup_size = Mt, d.partials = F(
      "uint",
      R * ae
    )) : (d.shared_digits = F("uint", y), d.shared_digit_masks = F(
      "uint",
      R * (y / 32)
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
const va = (
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
function ba(a) {
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
const ya = (
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
), xa = (
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
class wa {
  attributes = new ne();
  levels = [];
  constructor(e, t) {
    const s = G(ya), r = G(xa);
    let i = e, o = t;
    for (; ; ) {
      const n = this.levels.length, l = Math.ceil(o / j), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${n}`,
        l
      ), u = s({
        lane: we,
        group_id: X.x,
        length: g(o),
        values: m(i, "uint", o),
        block_mins: m(c, "uint", l),
        scratch: F("uint", j)
      }).computeKernel([y]).setName(`3DGS tile offset suffix scan WGSL ${n}`);
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
class _a {
  constructor(e, t, s, r, i) {
    this.renderer = e, this.dispatch = i, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = m(this.offsets, "uint", s + 1), n = G(va);
    this.clearNode = n({
      index: ee,
      tile_count: g(s),
      state: m(i.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [y]).setName("3DGS clear tile offsets WGSL");
    const l = G(
      ba(t)
    );
    this.boundariesNode = l({
      index: ee,
      tile_count: g(s),
      state: m(i.state, "uvec4", 1).toReadOnly(),
      records: m(
        r,
        "uvec2",
        r.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([y]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new wa(this.offsets, s + 1);
  }
  renderer;
  dispatch;
  offsets;
  attributes = new ne();
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
const Bs = (
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
), ka = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${y}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class Sa {
  constructor(e, t, s, r, i, o, n, l, c, u, h, d, f, v, x, p, b, k = !1, C = 1e-4) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = r, this.meansAttribute = i, this.projectedMeanAttribute = o, this.projectedConicAttribute = n, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = h, this.depthTexture = d, this.frame = f, this.maxSplatsPerTile = v, this.rasterChunkSize = x, this.tileCount = p, this.transmittanceThreshold = C, this.metrics = k ? this.attributes.createUint("3dgs.raster-work", p * 4) : null;
    const P = this.metrics === null ? null : m(this.metrics, "uint", p * 4).toAtomic();
    this.clearMetrics = P === null ? null : Ye(() => {
      $r(P.element(ee), g(0));
    })().compute(p * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(b);
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
  attributes = new ne();
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
      cs(i, Je, "raster");
    xe(
      e.rasterPixelValueNode,
      Qs,
      "rasterPixelValueNode"
    ), xe(
      e.rasterBreakNode,
      li,
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
    const e = nr(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new lt(
      t,
      this.tileCount,
      "raster-chunks"
    ), r = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), i = this.attributes.createIndirect(
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
    ).toReadOnly(), v = G(zi)({
      tile: ee,
      tile_count: g(this.tileCount),
      chunk_size: g(this.rasterChunkSize),
      sample_limit: g(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [y]).setName("3DGS count exact raster chunks WGSL"), p = G(
      Di
    )({
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      dispatch: m(i, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), k = G($i)({
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
      dispatch: i,
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
    ).toReadOnly(), i = m(
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
    ).toReadOnly(), u = F("vec4", y), h = F("vec4", y), d = F("vec4", y), f = F("uint", y), v = F("uint", y), x = F("uint", 8), p = t === "direct" ? Ut(this.colorTexture) : null, b = G(Bs), k = G(ka), C = this.chunks, P = t === "chunk" && C !== null ? m(C.tasks, "uvec2", C.tasks.count).toReadOnly() : null, w = t === "chunk" && C !== null ? m(C.partialData, "vec4", C.partialData.count) : null, { frame: S } = this;
    return Ye(() => {
      const N = g(we), _ = b({ value: N }), B = b({ value: N.shiftRight(1) }), z = g(X.x), T = (t === "direct" ? X.y.mul(S.tilesX).add(X.x) : P.element(z).x).toVar("rasterTile"), $ = t === "chunk" ? P.element(z).y : g(0), D = t === "direct" ? X.x : T.mod(S.tilesX), K = t === "direct" ? X.y : T.div(S.tilesX), oe = ze(
        D.mul(g(O)).add(_),
        K.mul(g(O)).add(B)
      ).toVar("rasterPixelCoordinateValue"), W = oe.x.lessThan(g(S.viewport.x)).and(oe.y.lessThan(g(S.viewport.y))).toVar("rasterActivePixel"), le = c.element(T), _e = c.element(T.add(1)), ke = g(_e.sub(le)), he = ke.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const E = g(this.maxSplatsPerTile);
        he.assign(be(ke.lessThan(E), ke, E));
      }
      let te = g(0);
      const H = he.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        H.assign(
          be(
            he.greaterThan(g(this.rasterChunkSize)),
            g(0),
            he
          )
        );
      else if (t === "chunk") {
        te = $.mul(g(this.rasterChunkSize)).toVar("rasterSampleStart");
        const E = te.add(g(this.rasterChunkSize));
        H.assign(
          be(E.lessThan(he), E, he)
        );
      }
      const Se = ge(oe).add(0.5), Me = /* @__PURE__ */ new Map([
        [gt, () => oe],
        [mt, () => Se],
        [vt, () => Se.div(S.viewport.xy)]
      ]), $e = U(0).toVar("rasterPixelValue");
      A(W, () => {
        $e.assign(
          qe(e.rasterPixelValueNode, Me)
        );
      });
      const Ce = ot(0).toVar("accumulated"), me = U(1).toVar("transmittance"), ce = U(1).toVar("depth"), Ee = ue(!1).toVar("depthWritten"), ve = ue(!1).toVar("done"), Ne = s === null ? null : g(0).toVar("rasterChecked"), je = s === null ? null : g(0).toVar("rasterBlended");
      Ve(
        {
          start: te,
          end: H,
          type: "uint",
          condition: "<",
          update: `+= ${y}`
        },
        ({ i: E }) => {
          const Le = E.add(N);
          A(Le.lessThan(H), () => {
            let J = Le;
            this.maxSplatsPerTile !== null && (J = g(
              jt(
                U(Le).add(0.5).mul(U(ke)).div(U(he))
              )
            ));
            const V = le.add(J).toVar("rasterSourceRecordIndex"), se = l.element(V).y, Y = i.element(se), q = o.element(se);
            u.element(N).assign(Y), h.element(N).assign(Z(q.xyz, Y.w.mul(255).log())), d.element(N).assign(n.element(se)), f.element(N).assign(se);
          }), A(N.equal(0), () => {
            v.element(g(0)).assign(
              be(
                E.add(g(y)).lessThan(H),
                g(1),
                g(0)
              )
            );
          });
          const Ue = k({ values: v }).toVar("hasNextBatch"), We = g(H.sub(E)), Ie = be(
            We.lessThan(g(y)),
            We,
            g(y)
          );
          A(W.and(ve.not()), () => {
            Ve(
              {
                start: g(0),
                end: Ie,
                type: "uint",
                condition: "<"
              },
              ({ i: J }) => {
                Ne?.addAssign(1);
                const V = u.element(J), se = f.element(J), Y = Se.sub(V.xy), q = new Map(Me);
                q.set(bt, () => $e), q.set(et, () => se), q.set(
                  ft,
                  () => g(r.element(se).w)
                ), q.set(yt, () => V.xy), q.set(xt, () => Y), q.set(wt, () => V.z);
                const Ct = qe(
                  e.rasterBreakNode,
                  q
                );
                A(Ct, () => {
                  ve.assign(ue(!0)), Fe();
                });
                const tt = h.element(J), pe = tt.xyz, st = pe.x.mul(Y.x.mul(Y.x)).add(pe.y.mul(2).mul(Y.x).mul(Y.y)).add(pe.z.mul(Y.y.mul(Y.y))).mul(-0.5);
                A(
                  st.greaterThan(0).or(st.lessThan(tt.w.negate())),
                  () => {
                    It();
                  }
                );
                const hs = Ge(xs(pe.x, 1e-12)), Nt = pe.y.div(hs), vr = Ge(xs(pe.z.sub(Nt.mul(Nt)), 1e-12)), ps = ge(
                  hs.mul(Y.x).add(Nt.mul(Y.y)),
                  vr.mul(Y.y)
                ), Lt = new Map([
                  ...q,
                  [ns, () => ps],
                  [os, () => ps.div(6).add(0.5)],
                  [
                    _t,
                    () => d.element(J).xyz
                  ],
                  [kt, () => V.w],
                  [St, () => st],
                  [ls, () => Kt(st)]
                ]), br = qe(e.rasterDiscardNode, Lt);
                A(br, () => {
                  It();
                });
                const Pt = ye(
                  qe(e.rasterAlphaNode, Lt),
                  0,
                  0.99
                );
                A(Pt.lessThan(U(1 / 255)), () => {
                  It();
                }), A(Ee.not(), () => {
                  ce.assign(Ca(V.z, S)), Ee.assign(ue(!0));
                });
                const yr = qe(e.rasterColorNode, Lt);
                Ce.addAssign(yr.mul(me).mul(Pt)), je?.addAssign(1), me.mulAssign(U(1).sub(Pt)), A(me.lessThan(this.transmittanceThreshold), () => {
                  ve.assign(ue(!0)), Fe();
                });
              }
            );
          }), A(Ue.equal(0), () => {
            Fe();
          }), v.element(N).assign(be(W.and(ve.not()), g(1), g(0))), ws(), A(N.lessThan(8), () => {
            const J = N.mul(32), V = g(0).toVar("subgroupActive");
            Ve(
              { start: g(0), end: g(32), type: "uint", condition: "<" },
              ({ i: se }) => {
                V.bitOrAssign(
                  v.element(J.add(se))
                );
              }
            ), x.element(N).assign(V);
          }), ws(), A(N.equal(0), () => {
            const J = g(0).toVar("tileActiveReduction");
            Ve(
              { start: g(0), end: g(8), type: "uint", condition: "<" },
              ({ i: V }) => {
                J.bitOrAssign(x.element(g(V)));
              }
            ), v.element(g(0)).assign(J);
          });
          const Te = k({ values: v });
          A(Te.equal(0), () => {
            Fe();
          });
        }
      ), A(W, () => {
        if (s !== null) {
          const E = T.mul(4);
          Ae(s.element(E), Ne), Ae(s.element(E.add(1)), je), t === "direct" && A(ke.greaterThan(0).and(H.greaterThan(0)), () => {
            Ae(s.element(E.add(2)), g(1)), Ae(
              s.element(E.add(3)),
              be(
                me.lessThan(this.transmittanceThreshold),
                g(1),
                g(0)
              )
            );
          });
        }
        if (t === "direct")
          Os(
            Ce,
            me,
            ce,
            oe,
            p,
            this.depthTexture,
            S
          );
        else {
          const E = z.mul(g(y)).add(N).mul(g(C.partialStride));
          w.element(E).assign(Z(Ce, me)), this.depthTexture !== null && w.element(E.add(1)).assign(Z(ce, 0, 0, 0));
        }
      });
    })().computeKernel([O, O]).setName(
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
    ).toReadOnly(), i = m(
      t.partialData,
      "vec4",
      t.partialData.count
    ).toReadOnly(), o = Ut(this.colorTexture), n = G(Bs), { frame: l } = this;
    return Ye(() => {
      const u = g(we), h = n({ value: u }), d = n({ value: u.shiftRight(1) }), f = X.y.mul(l.tilesX).add(X.x), v = s.element(f), x = ze(
        X.x.mul(g(O)).add(h),
        X.y.mul(g(O)).add(d)
      ), p = x.x.lessThan(g(l.viewport.x)).and(x.y.lessThan(g(l.viewport.y)));
      A(p.and(v.greaterThan(0)), () => {
        const b = ot(0).toVar("chunkCompositeColor"), k = U(1).toVar("chunkCompositeTransmittance"), C = U(1).toVar("chunkCompositeDepth"), P = ue(!1).toVar("chunkCompositeDepthWritten"), w = r.element(f);
        Ve(
          {
            start: g(0),
            end: v,
            type: "uint",
            condition: "<"
          },
          ({ i: S }) => {
            const I = w.add(S).mul(g(y)).add(u).mul(g(t.partialStride)), N = i.element(I);
            b.addAssign(N.xyz.mul(k)), this.depthTexture !== null && A(P.not().and(N.w.lessThan(1)), () => {
              C.assign(i.element(I.add(1)).x), P.assign(ue(!0));
            }), k.mulAssign(N.w), A(k.lessThan(this.transmittanceThreshold), () => {
              Fe();
            });
          }
        ), Os(
          b,
          k,
          C,
          x,
          o,
          this.depthTexture,
          l
        ), e !== null && (Ae(e.element(f.mul(4).add(2)), g(1)), Ae(
          e.element(f.mul(4).add(3)),
          be(
            k.lessThan(this.transmittanceThreshold),
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
function Ca(a, e) {
  const t = a.negate();
  return ye(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function Os(a, e, t, s, r, i, o) {
  const n = ye(U(o.background[3]), 0, 1);
  a.addAssign(
    ot(o.background[0], o.background[1], o.background[2]).mul(e).mul(n)
  );
  const l = U(1).sub(e.mul(U(1).sub(n)));
  _s(r, Xe(s), Z(a, l)), i !== null && _s(
    Ut(i),
    Xe(s),
    Z(t, 0, 0, 1)
  );
}
function qe(a, e) {
  return a.context({ overrideNodes: e });
}
class gr {
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
    const n = m(
      r,
      "uint",
      s
    ).toReadOnly(), l = G(
      ji
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
    const c = G(
      Ui(t)
    );
    this.compactNode = c({
      gid: ee,
      gaussian_count: g(s),
      viewport: o,
      visible_offsets: n,
      projected_mean: m(
        i,
        "vec4",
        s
      ).toReadOnly(),
      records: m(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [y]).setName(`3DGS compact visible Gaussians WGSL (${t})`);
  }
  renderer;
  buffers;
  dispatch;
  attributes = new ne();
  prepareNode;
  compactNode;
  encode(e = !1) {
    e ? (this.renderer.compute(this.prepareNode), this.renderer.compute(this.compactNode)) : this.renderer.compute([this.prepareNode, this.compactNode]);
  }
  dispose() {
    this.prepareNode.dispose(), this.compactNode.dispose(), this.attributes.dispose();
  }
}
class Na {
  constructor(e, t, s, r, i, o, n, l, c, u, h, d, f, v, x = 1e-4, p = !1) {
    this.renderer = e, this.data = s, this.mode = i, this.capacity = n, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = d, this.radixBackend = f, this.nodes = v, this.rasterTransmittanceThreshold = x, this.rasterStats = p, this.frame = new lr(t, l), this.objects = new ur(t, r, s.count), this.projection = new pr(
      s,
      this.frame,
      this.objects,
      o,
      v,
      d
    ), this.profileDiagnostics = c || p ? new la(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new lt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new gr(
      e,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Ft(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      f
    ), this.depthSorter.configure(i === "float32" ? 32 : 16), this.orderedTiles = new Vi(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new lt(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new Xi(
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
    ), this.sorter = new Ft(
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
    const i = Math.ceil(e / O), o = Math.ceil(t / O), n = i * o;
    if (i > 65535 || o > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, n + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new _a(
      this.renderer,
      this.mode,
      n,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new Sa(
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
function mr(a, e) {
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
const $t = new Vs();
class La extends nt {
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
  nodeSlots = Zs();
  dirtyStages = 0;
  disposed = !1;
  constructor(e, t, s, r = {}) {
    super(nt.COLOR, new ct(), t, {
      type: Et,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const i = r.depthSortMode ?? "float32", o = r.antialiasMode ?? "compensated", n = r.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    const l = mr(
      n,
      e.hasFeature("subgroups")
    ), c = r.intersectionCapacity ?? null;
    if (c !== null && (!Number.isInteger(c) || c <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (c !== null && c > y * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const u = r.maxRasterizedSplatsPerTile ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const h = r.rasterChunkSize === void 0 ? Oi : r.rasterChunkSize;
    if (Ei(
      h,
      c ?? y * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = i, this.antialiasMode = o, this.requestedIntersectionCapacity = c, this.background = r.background ?? [0, 0, 0, 0], this.outputDepth = r.outputDepth ?? !1, this.colorSpace = r.colorSpace ?? Us, this.profileKernels = r.profileKernels ?? !1, this.rasterStats = r.rasterStats ?? !1, this.rasterTransmittanceThreshold = r.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = r.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new fs(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = Et, this.colorTexture.colorSpace = Gr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new fs(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = Mr, this.depthTexture.type = Ir, this.depthTexture.minFilter = gs, this.depthTexture.magFilter = gs, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    return this.workingColorNode ??= Fs(
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
    if (!(this.camera instanceof Ws))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    t.getDrawingBufferSize($t);
    const s = Math.max(1, Math.floor($t.x)), r = Math.max(1, Math.floor($t.y));
    (this.renderTarget.width !== s || this.renderTarget.height !== r) && this.setSize(s, r), this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: Pa(t) });
    const i = this.gaussianStore.updateLod(this.camera), o = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      y * 65535,
      Math.max(1, o.count * 16)
    )), t.initRenderTarget(this.renderTarget), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), o.count > y * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new Na(
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
    zs(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateProjection());
  }
  setRasterNode(e, t) {
    zs(t, e), this.nodeSlots[e] !== t && (this.nodeSlots[e] = t, this.invalidateRasterizer());
  }
}
function zs(a, e) {
  if (a?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function Pa(a) {
  const e = a.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device.limits;
}
function Ka(a, e, t, s) {
  return new La(a, e, t, s);
}
const Ra = (
  /* wgsl */
  `
fn prepare_hardware_draw(
  state: ptr<storage, array<vec4<u32>>, read>,
  draw: ptr<storage, array<vec4<u32>>, read_write>
) -> u32 {
  (*draw)[0] = vec4<u32>(6u, (*state)[0].x, 0u, 0u);
  return 0u;
}
`
), Ga = (
  /* wgsl */
  `
fn hardware_vertex(
  mean: vec4<f32>, conic: vec4<f32>, corner: vec2<f32>,
  projection: mat4x4<f32>, viewport: vec2<f32>
) -> vec4<f32> {
  let determinant = max(conic.x * conic.z - conic.y * conic.y, 1e-20);
  let xx = conic.z / determinant;
  let xy = -conic.y / determinant;
  let yy = conic.x / determinant;
  let difference = xx - yy;
  let discriminant = sqrt(difference * difference + 4.0 * xy * xy);
  let lambda = max(0.5 * (xx + yy + discriminant), 1e-12);
  var axis = vec2<f32>(xy, lambda - xx);
  if (dot(axis, axis) < 1e-20) { axis = vec2<f32>(1.0, 0.0); }
  axis = normalize(axis);
  let cutoff = max(2.0 * log(mean.w * 255.0), 0.0);
  let extent1 = sqrt(lambda * cutoff);
  let extent2 = sqrt(max(1.0 / (determinant * lambda), 1e-12) * cutoff);
  let offset = axis * (corner.x * extent1)
    + vec2<f32>(-axis.y, axis.x) * (corner.y * extent2);
  let pixel = mean.xy + offset;
  let ndc = vec2<f32>(2.0 * pixel.x / viewport.x - 1.0,
                     1.0 - 2.0 * pixel.y / viewport.y);
  let clip = projection * vec4<f32>(0.0, 0.0, -mean.z, 1.0);
  return vec4<f32>(ndc * clip.w, clip.z, clip.w);
}
`
), Ma = (
  /* wgsl */
  `
fn hardware_power(mean: vec4<f32>, conic: vec4<f32>, pixel: vec2<f32>) -> f32 {
  let delta = pixel - mean.xy;
  let power = -0.5 * (conic.x * delta.x * delta.x
    + 2.0 * conic.y * delta.x * delta.y + conic.z * delta.y * delta.y);
  if (power < -log(mean.w * 255.0)) { discard; }
  return power;
}
`
), Ia = (
  /* wgsl */
  `
fn hardware_coordinate(conic: vec4<f32>, delta: vec2<f32>) -> vec2<f32> {
  let l00 = sqrt(max(conic.x, 1e-12));
  let l10 = conic.y / l00;
  let l11 = sqrt(max(conic.z - l10 * l10, 1e-12));
  return vec2<f32>(l00 * delta.x + l10 * delta.y, l11 * delta.y);
}
`
), Ta = (
  /* wgsl */
  `
fn hardware_fragment(color: vec3<f32>, alpha: f32, rejected: bool) -> vec4<f32> {
  if (rejected) { discard; }
  let opacity = clamp(alpha, 0.0, 0.99);
  if (opacity < 1.0 / 255.0) { discard; }
  return vec4<f32>(color, opacity);
}
`
);
class Aa {
  constructor(e, t, s, r, i, o, n, l, c, u, h) {
    this.renderer = e, this.data = s, this.colorSpace = l, this.profileKernels = h, this.frame = new lr(t, [0, 0, 0, 0]), this.objects = new ur(t, r, s.count), this.projection = new pr(
      s,
      this.frame,
      this.objects,
      o,
      c,
      u,
      !1
    ), this.visibleScan = new lt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new gr(
      e,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Ft(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      n
    ), this.depthSorter.configure(i === "float32" ? 32 : 16), this.prepareDraw = G(Ra)({
      state: m(this.visible.dispatch.state, "uvec4", 1).toReadOnly(),
      draw: m(this.drawArguments, "uvec4", 1)
    }).compute(1).setName("3DGS prepare hardware indirect draw"), this.geometry.setAttribute(
      "position",
      new $s(
        [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0],
        3
      )
    ), this.geometry.instanceCount = 1, this.geometry.setIndirect(this.drawArguments), this.mesh = new Tr(this.geometry, this.createMaterial(c)), this.mesh.name = "3DGS hardware splats", this.scene.name = "3DGS hardware rasterization", this.mesh.frustumCulled = !1, this.mesh.layers.enableAll(), this.scene.add(this.mesh);
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
  scene = new ct();
  geometry = new Ar();
  mesh;
  attributes = new ne();
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
    const t = new Set(Je);
    t.delete(bt);
    for (const [p, b] of Object.entries({
      rasterColorNode: e.rasterColorNode,
      rasterAlphaNode: e.rasterAlphaNode,
      rasterDiscardNode: e.rasterDiscardNode
    }))
      cs(
        b,
        Je,
        "raster"
      ), xe(b, t, p);
    const s = m(
      this.projection.projectedMean,
      "vec4",
      this.projection.projectedMean.count
    ).toReadOnly(), r = m(
      this.projection.projectedConic,
      "vec4",
      this.data.count
    ).toReadOnly(), i = m(
      this.projection.projectedColor,
      "vec4",
      this.data.count
    ).toReadOnly(), o = m(
      this.depthSorter.sortedRecords,
      "uvec2",
      this.data.count
    ).toReadOnly(), n = m(this.visible.dispatch.state, "uvec4", 1).toReadOnly().element(0).x, l = rt(
      o.element(n.sub(g(1)).sub(g(ee))).y,
      "hardwareGaussianId"
    ).setInterpolation("flat"), c = rt(
      s.element(l),
      "hardwareMean"
    ).setInterpolation("flat"), u = rt(
      r.element(l),
      "hardwareConic"
    ).setInterpolation("flat"), h = rt(
      i.element(l),
      "hardwareColor"
    ).setInterpolation("flat"), d = new Br();
    d.name = "3DGS hardware Gaussian material", d.transparent = !0, d.premultipliedAlpha = !0, d.depthTest = !0, d.depthWrite = !1, d.side = Es, d.forceSinglePass = !0, d.toneMapped = !1, d.vertexNode = G(Ga)({
      mean: c,
      conic: u,
      corner: Er.xy,
      projection: this.frame.projection,
      viewport: this.frame.viewport.xy
    });
    const f = G(Ma), v = G(
      Ia
    ), x = G(Ta);
    return d.fragmentNode = Ye(() => {
      const p = jr.xy, b = p.sub(c.xy), k = U(
        f({ mean: c, conic: u, pixel: p })
      ).toVar("hardwarePower");
      k.toStack();
      const C = ge(v({ conic: u, delta: b })), P = m(
        this.data.means,
        "vec4",
        this.data.count
      ).toReadOnly(), w = /* @__PURE__ */ new Map([
        [et, () => l],
        [ft, () => g(P.element(l).w)],
        [gt, () => ze(p)],
        [mt, () => p],
        [vt, () => p.div(this.frame.viewport.xy)],
        [yt, () => c.xy],
        [xt, () => b],
        [ns, () => C],
        [os, () => C.div(6).add(0.5)],
        [wt, () => c.z],
        [_t, () => h.xyz],
        [kt, () => c.w],
        [St, () => k],
        [ls, () => Kt(k)]
      ]), S = (N) => N.context({ overrideNodes: w }), I = Z(
        Fs(
          Z(S(e.rasterColorNode), 1),
          this.colorSpace
        )
      );
      return x({
        color: I.rgb,
        alpha: S(e.rasterAlphaNode),
        rejected: S(e.rasterDiscardNode)
      });
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
class Ba extends nt {
  gaussianStore;
  depthSortMode;
  antialiasMode;
  colorSpace;
  profileKernels;
  subpixelSampleCulling;
  radixBackend;
  ownerRenderer;
  nodeSlots = Zs();
  pipeline = null;
  layoutVersion = -1;
  projectionDirty = !1;
  rasterDirty = !1;
  disposed = !1;
  size = new Vs();
  nearNode = Re(0.01);
  farNode = Re(1e3);
  debugListeners = /* @__PURE__ */ new Set();
  constructor(e, t, s, r = {}) {
    if (super(nt.COLOR, r.scene ?? new ct(), t, {
      type: Et,
      samples: 0,
      depthBuffer: !0,
      stencilBuffer: !1
    }), this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = r.depthSortMode ?? "float32", this.antialiasMode = r.antialiasMode ?? "compensated", !["float32", "packed16"].includes(this.depthSortMode))
      throw new RangeError("Invalid depthSortMode");
    if (!["classic", "compensated"].includes(this.antialiasMode))
      throw new RangeError("Invalid antialiasMode");
    this.colorSpace = r.colorSpace ?? Us, this.profileKernels = r.profileKernels ?? !1, this.subpixelSampleCulling = r.subpixelSampleCulling ?? !0, this.radixBackend = mr(
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
    return Ur(
      this.getTextureNode(e),
      this.nearNode,
      this.farNode
    );
  }
  getLinearDepthNode(e = "depth") {
    return Wr(
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
    if (!(this.camera instanceof Ws))
      throw new TypeError("GaussianHardwarePass requires a PerspectiveCamera");
    if (t.reversedDepthBuffer || t.logarithmicDepthBuffer)
      throw new Error("GaussianHardwarePass currently requires standard depth");
    const s = this.camera;
    if (s.coordinateSystem !== ms && (s.coordinateSystem = ms, s.updateProjectionMatrix()), this.nearNode.value = s.near, this.farNode.value = s.far, t.getDrawingBufferSize(this.size), this.setSize(Math.max(1, this.size.x), Math.max(1, this.size.y)), this.gaussianStore.needsPack) {
      const o = t.backend;
      if (!o.device)
        throw new Error("Initialize WebGPURenderer before rendering");
      this.gaussianStore.pack({ limits: o.device.limits });
    }
    const r = this.gaussianStore.updateLod(s), i = this.gaussianStore.getPackedData();
    if (i.count > 256 * 65535)
      throw new RangeError("Gaussian projection dispatch limit exceeded");
    if (!this.pipeline || this.layoutVersion !== this.gaussianStore.layoutVersion ? (this.pipeline?.dispose(), this.pipeline = new Aa(
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
    const s = this.scene, r = e.getRenderTarget(), i = e.getMRT(), o = e.autoClear, n = e.opaque, l = e.transparent, c = s.background, u = e.getClearColor(new js()), h = e.getClearAlpha(), d = t.layers.mask;
    try {
      const f = this.getLayers();
      f && (t.layers.mask = f.mask), e.setRenderTarget(this.renderTarget), e.setMRT(null), e.setClearColor(0, 0), e.autoClear = !0, e.opaque = !0, e.transparent = !1, e.render(s, t), e.autoClear = !1, e.opaque = !1, e.transparent = !0, e.render(this.pipeline.scene, t), s.background = null, e.render(s, t);
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
function Ha(a, e, t, s = {}) {
  return new Ba(a, e, t, s);
}
export {
  Kr as CanonicalGaussianPlyLoader,
  Va as DistanceAwareRadialLodPackingStrategy,
  Vr as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  Cs as GaussianCloud,
  qs as GaussianData,
  Ba as GaussianHardwarePass,
  Yt as GaussianLod,
  ja as GaussianLodColorHelper,
  Ns as GaussianLodNode,
  Ht as GaussianOctree,
  Jr as GaussianOctreeNode,
  La as GaussianPass,
  qa as GaussianStore,
  Ni as GaussianStoreAttributes,
  Ci as GaussianStorePackedAttribute,
  Ea as LodHelper,
  Ua as MaximumLodPackingStrategy,
  $a as OctreeHelper,
  Ks as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Wa as RadialLodPackingStrategy,
  bi as RadialLodWorkerPlanner,
  Si as RemainingCapacityBudgetStrategy,
  Fa as SourceFractionBudgetStrategy,
  er as StreamingLodPackingStrategy,
  di as TieredRadialLodPackingStrategy,
  Qt as gaussianColor,
  Ha as gaussianHardwarePass,
  Xt as gaussianIndex,
  Zt as gaussianObjectId,
  Jt as gaussianObjectMatrix,
  es as gaussianObjectVisible,
  pt as gaussianOpacity,
  Ka as gaussianPass,
  ut as gaussianPositionLocal,
  Qe as gaussianPositionWorld,
  as as gaussianProjectedArea,
  is as gaussianProjectedSigma,
  ht as gaussianRotation,
  dt as gaussianScale,
  Xs as gaussianScreenBoundsMax,
  Ys as gaussianScreenBoundsMin,
  rs as gaussianScreenPosition,
  ss as gaussianViewDepth,
  ts as gaussianViewDirection,
  Ps as isStreamingLodPackingStrategy,
  Fr as packShRgb8e8,
  yt as rasterGaussianCenter,
  _t as rasterGaussianColor,
  ns as rasterGaussianCoord,
  et as rasterGaussianIndex,
  kt as rasterGaussianOpacity,
  ft as rasterObjectId,
  gt as rasterPixelCoordinate,
  xt as rasterPixelDelta,
  bt as rasterPixelValue,
  St as rasterPower,
  mt as rasterScreenPosition,
  vt as rasterScreenUV,
  os as rasterUV,
  wt as rasterViewDepth,
  ls as rasterWeight,
  Hs as shBytesPerCoefficient,
  Da as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
