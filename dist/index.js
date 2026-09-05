import { StorageBufferAttribute as Be, Vector3 as S, Quaternion as dr, Box3 as Gt, Object3D as Is, Matrix4 as Ae, Ray as hr, LineSegments as pr, BufferGeometry as fr, Float32BufferAttribute as gr, LineBasicMaterial as mr, BoxGeometry as br, MeshBasicMaterial as vr, DoubleSide as xr, InstancedMesh as yr, Color as _r, IndirectStorageBufferAttribute as wr, Vector4 as kr, Scene as Ts, PassNode as ns, HalfFloatType as os, SRGBColorSpace as Sr, StorageTexture as ls, NoColorSpace as Cr, RedFormat as Lr, FloatType as Nr, NearestFilter as cs, PerspectiveCamera as Pr, Vector2 as Rr } from "three/webgpu";
import { property as I, bool as ce, exp as Bs, float as W, storage as m, uint as g, vec3 as it, mix as Gr, wgslFn as B, instanceIndex as J, workgroupArray as j, workgroupId as Y, invocationLocalIndex as we, uniform as je, uvec2 as Xe, Fn as rt, If as T, Return as ge, vec4 as Z, mat4 as us, normalize as Mr, sqrt as Le, clamp as _e, log as Ir, ceil as ds, vec2 as me, ivec2 as Ke, int as hs, floor as Ct, subgroupIndex as gt, invocationSubgroupIndex as mt, subgroupSize as bt, atomicStore as Tr, storageTexture as Lt, select as ye, Loop as Ue, Break as We, Continue as et, max as ps, workgroupBarrier as fs, atomicAdd as Te, textureStore as gs, colorSpaceToWorking as Br } from "three/tsl";
class As {
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
const Ar = 16, zs = 4;
function zr(r, e, t) {
  const s = Math.max(Math.abs(r), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const i = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), a = 127 / 2 ** i, o = vt(r, a), n = vt(e, a), l = vt(t, a), c = i + 127;
  return (o | n << 8 | l << 16 | c << 24) >>> 0;
}
function Pa(r) {
  const e = 2 ** ((r >>> 24) - 127) / 127;
  return [
    xt(r) * e,
    xt(r >>> 8) * e,
    xt(r >>> 16) * e
  ];
}
function Os(r) {
  return r === "rgb8e8" ? zs : Ar;
}
function vt(r, e) {
  return Math.min(127, Math.max(-127, Math.round(r * e))) & 255;
}
function xt(r) {
  const e = r & 255;
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
}, Or = [
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
class $r {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = Er(e), s = new Map(
      t.properties.map((p, v) => [p.name, v])
    );
    for (const p of Or)
      if (!s.has(p))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${p}`);
    const i = t.properties.map((p) => p.name.match(/^f_rest_(\d+)$/)?.[1]).filter((p) => p !== void 0).map(Number).sort((p, v) => p - v);
    for (let p = 0; p < i.length; p++)
      if (i[p] !== p)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (i.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const a = i.length / 3, o = a + 1, n = Math.sqrt(o);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = Dr(e, t), c = (p) => s.get(p), u = i.map(
      (p) => c(`f_rest_${p}`)
    ), h = t.vertexCount, d = new Float32Array(h * 4), f = new Float32Array(h * 4), b = new Float32Array(h * 4), x = new Float32Array(h * o * 4);
    for (let p = 0; p < h; p++) {
      const v = p * 4;
      d[v] = l(p, c("x")), d[v + 1] = l(p, c("y")), d[v + 2] = l(p, c("z")), f[v] = Math.max(
        Math.exp(l(p, c("scale_0"))),
        1e-6
      ), f[v + 1] = Math.max(
        Math.exp(l(p, c("scale_1"))),
        1e-6
      ), f[v + 2] = Math.max(
        Math.exp(l(p, c("scale_2"))),
        1e-6
      );
      const k = l(p, c("opacity"));
      f[v + 3] = 1 / (1 + Math.exp(-k));
      const L = l(p, c("rot_0")), N = l(p, c("rot_1")), y = l(p, c("rot_2")), R = l(p, c("rot_3")), G = Math.hypot(N, y, R, L);
      G > 1e-12 ? (b[v] = N / G, b[v + 1] = y / G, b[v + 2] = R / G, b[v + 3] = L / G) : b[v + 3] = 1;
      const A = p * o * 4;
      x[A] = l(p, c("f_dc_0")), x[A + 1] = l(p, c("f_dc_1")), x[A + 2] = l(p, c("f_dc_2"));
      for (let w = 1; w < o; w++) {
        const M = A + w * 4, U = w - 1;
        for (let C = 0; C < 3; C++) {
          const $ = u[C * a + U];
          x[M + C] = l(
            p,
            $
          );
        }
      }
    }
    return new As(
      {
        means: tt("ply.means", d),
        scalesOpacity: tt("ply.scales-opacity", f),
        rotations: tt("ply.rotations-xyzw", b),
        shCoefficients: tt("ply.sh-coefficients", x)
      },
      {
        count: h,
        shDegree: n - 1,
        ownsBuffers: !0
      }
    );
  }
}
function tt(r, e) {
  const t = new Be(e, 4);
  return t.name = r, t;
}
function Er(r) {
  const e = new Uint8Array(r), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let b = 0; b <= e.length - t.length; b++) {
    let x = !0;
    for (let p = 0; p < t.length; p++)
      if (e[b + p] !== t[p]) {
        x = !1;
        break;
      }
    if (x) {
      s = b;
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
  for (const b of o) {
    const x = b.trim().split(/\s+/);
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
      const p = x[1], v = x[2];
      if (!(p in ms) || v === void 0)
        throw new Error(`Unsupported vertex property: ${b}`);
      h.push({ name: v, type: p, byteOffset: u }), u += ms[p];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (c <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (b) => b.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: c, properties: h, vertexStride: u, dataOffset: i };
}
function Dr(r, e) {
  if (e.format === "ascii") {
    const a = new TextDecoder().decode(
      new Uint8Array(r, e.dataOffset)
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
  if (e.dataOffset + e.vertexCount * e.vertexStride > r.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(r), i = e.format === "binary_little_endian";
  return (a, o) => {
    const n = e.properties[o], l = e.dataOffset + a * e.vertexStride + n.byteOffset;
    return jr(s, l, n.type, i);
  };
}
function jr(r, e, t, s) {
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
const bs = 1 / 255, Ur = 0.99, yt = 1e-12;
function Wr(r, e, t, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const i = e.means.array, a = e.scalesOpacity.array, o = e.rotations.array, n = new S(), l = new S(), c = new S(), u = new dr();
  let h = 1;
  for (const d of t) {
    const f = d.gaussianIndex * 4, b = Math.min(1, Math.max(0, a[f + 3]));
    if (b < bs) continue;
    u.set(
      -o[f],
      -o[f + 1],
      -o[f + 2],
      o[f + 3]
    ).normalize(), n.set(
      r.origin.x - i[f],
      r.origin.y - i[f + 1],
      r.origin.z - i[f + 2]
    ).applyQuaternion(u), l.copy(r.direction).applyQuaternion(u);
    const x = Math.max(a[f], yt), p = Math.max(a[f + 1], yt), v = Math.max(a[f + 2], yt);
    n.set(
      n.x / x,
      n.y / p,
      n.z / v
    ), l.set(
      l.x / x,
      l.y / p,
      l.z / v
    );
    const k = l.lengthSq();
    if (k <= Number.EPSILON) continue;
    const L = Math.max(
      0,
      -n.dot(l) / k
    );
    c.copy(n).addScaledVector(l, L);
    const N = Math.min(
      Ur,
      b * Math.exp(-0.5 * c.lengthSq())
    );
    if (N < bs || (h *= 1 - N, 1 - h < s)) continue;
    const y = r.at(L, new S());
    return {
      gaussianIndex: d.gaussianIndex,
      distance: r.origin.distanceTo(y),
      point: y
    };
  }
  return null;
}
class Fr {
  constructor(e, t, s, i, a, o, n, l) {
    this.id = e, this.depth = t, this.bounds = s, this.count = i, this.maxSplatRadius = a, this.raycastBounds = l, this.children = o, this.gaussianIndices = n;
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
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = i, this.bounds = Vr(e), this.rootBounds = qr(this.bounds);
    const a = e.means.array, o = e.scalesOpacity.array, n = [], l = [], c = Array.from({ length: e.count }, (h, d) => d), u = (h, d, f) => {
      const b = n.length;
      n.push(null);
      const x = h.length > t && f < s && d.max.x - d.min.x > Number.EPSILON, p = [];
      if (x) {
        const L = d.getCenter(new S()), N = Array.from({ length: 8 }, () => []);
        for (const y of h) {
          const R = y * 4, G = (a[R] >= L.x ? 1 : 0) | (a[R + 1] >= L.y ? 2 : 0) | (a[R + 2] >= L.z ? 4 : 0);
          N[G].push(y);
        }
        for (let y = 0; y < 8; y++) {
          const R = N[y];
          R.length !== 0 && p.push(
            u(
              R,
              Kr(d, L, y),
              f + 1
            )
          );
        }
      }
      let v = 0;
      if (p.length > 0)
        for (const L of p)
          v = Math.max(
            v,
            n[L].maxSplatRadius
          );
      else {
        for (const L of h) {
          const N = L * 4;
          v = Math.max(
            v,
            o[N],
            o[N + 1],
            o[N + 2]
          );
        }
        l.push(b);
      }
      const k = d.clone().expandByScalar(v * 3);
      return n[b] = new Fr(
        b,
        f,
        d,
        h.length,
        v,
        p,
        p.length === 0 ? Uint32Array.from(h) : null,
        k
      ), b;
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
    const a = [], o = [this.rootNode];
    for (; o.length > 0; ) {
      const n = this.nodes[o.pop()], l = Math.max(0, s - 3) * n.maxSplatRadius, c = l === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(l);
      if (e.intersectsBox(c))
        if (n.gaussianIndices !== null)
          for (const u of n.gaussianIndices) a.push(u);
        else
          for (const u of n.children) o.push(u);
    }
    return this.raycastIndices(e, a, s, i);
  }
  raycastIndices(e, t, s = 3, i = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(i > 0)) return [];
    const a = this.data.means.array, o = this.data.scalesOpacity.array, n = new S(), l = new S(), c = [];
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
    return c.sort((u, h) => u.distance - h.distance), c.length > i && (c.length = i), c;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function Vr(r) {
  const e = r.means.array, t = new Gt(), s = new S();
  for (let i = 0; i < r.count; i++) {
    const a = i * 4;
    s.set(e[a], e[a + 1], e[a + 2]), t.expandByPoint(s);
  }
  return t;
}
function qr(r) {
  const e = r.getCenter(new S()), t = r.getSize(new S()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new Gt(
    new S(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new S(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function Kr(r, e, t) {
  return new Gt(
    new S(
      t & 1 ? e.x : r.min.x,
      t & 2 ? e.y : r.min.y,
      t & 4 ? e.z : r.min.z
    ),
    new S(
      t & 1 ? r.max.x : e.x,
      t & 2 ? r.max.y : e.y,
      t & 4 ? r.max.z : e.z
    )
  );
}
class vs extends Is {
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
  constructor(e, t, s, i = "GaussianCloud", a = null, o = null, n = 0) {
    super(), this.ownerStore = e, this.objectId = t, this.packedGaussianCount = s, this.lod = a, this.packing = o, this.priority = n, this.name = i;
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
    const s = new Ae().copy(this.matrixWorld).invert(), i = new hr().copy(e.ray).applyMatrix4(s), a = this.raycastMode === "full" ? this.lod.octree.raycast(i) : this.lod.raycast(i, this.packing), o = Wr(
      i,
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
class Ra extends pr {
  constructor(e, t = {}) {
    const s = t.minDepth ?? 0, i = t.maxDepth ?? 1 / 0, a = e.nodes.filter(
      (h) => h.depth >= s && h.depth <= i && (t.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(a.length * 12 * 2 * 3);
    let n = 0;
    for (const h of a) {
      const { min: d, max: f } = h.bounds, b = [
        [d.x, d.y, d.z],
        [f.x, d.y, d.z],
        [f.x, f.y, d.z],
        [d.x, f.y, d.z],
        [d.x, d.y, f.z],
        [f.x, d.y, f.z],
        [f.x, f.y, f.z],
        [d.x, f.y, f.z]
      ];
      for (const [x, p] of Yr)
        o.set(b[x], n), o.set(b[p], n + 3), n += 6;
    }
    const l = new fr();
    l.setAttribute("position", new gr(o, 3)), l.computeBoundingSphere();
    const c = t.opacity ?? 0.55, u = new mr({
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
const Yr = [
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
class xs {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const Xr = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class It {
  constructor(e, t) {
    this.octree = e, this.levels = Hr(t.levels ?? Xr), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? Zr, i = new Float64Array(e.data.count);
    for (let a = 0; a < i.length; a++) {
      const o = s(a, e);
      i[a] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = e.nodes.map((a) => {
      if (a.gaussianIndices === null)
        return new xs(
          a.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(a.gaussianIndices).sort(
          (n, l) => i[l] - i[n] || n - l
        )
      );
      return new xs(
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
    let i = 0;
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
    const a = s.maxHits ?? 1 / 0;
    if (!(a > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const o = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, l = new S(), c = new S(), u = [], h = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.nodeIds.length; d++) {
      const f = t.nodeIds[d], b = this.getLeafNode(f);
      if (h.has(f))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${f}`
        );
      h.add(f);
      const x = t.lodLevels[d], p = b.levelCounts[x];
      if (p === void 0)
        throw new RangeError(`GaussianLod level ${x} does not exist`);
      const v = this.octree.nodes[f], k = Math.max(0, i - 3) * v.maxSplatRadius, L = k === 0 ? v.raycastBounds : v.raycastBounds.clone().expandByScalar(k);
      if (e.intersectsBox(L))
        for (let N = 0; N < p; N++) {
          const y = b.sortedGaussianIndices[N], R = y * 4;
          l.set(o[R], o[R + 1], o[R + 2]);
          const G = Math.max(
            n[R],
            n[R + 1],
            n[R + 2]
          ) * i;
          e.closestPointToPoint(l, c), !(c.distanceToSquared(l) > G * G) && u.push({
            gaussianIndex: y,
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
function Hr(r) {
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
function Zr(r, e) {
  const t = e.data.scalesOpacity.array, s = r * 4, i = [t[s], t[s + 1], t[s + 2]];
  return i.sort((a, o) => o - a), t[s + 3] * i[0] * i[1];
}
const Qr = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class Ga extends Is {
  constructor(e, t, s = {}) {
    super(), this.lod = e, this.packing = t, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : Qr, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, e.indicesForPacking(t), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: e.levelCount }, (i, a) => a)
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
    for (let a = 0; a < this.packing.nodeIds.length; a++) {
      const o = this.packing.lodLevels[a], n = e[o];
      if (n === void 0)
        throw new RangeError(`Gaussian LOD level ${o} does not exist`);
      n.push(this.packing.nodeIds[a]);
    }
    const t = new S(), s = new S(), i = new Ae();
    for (let a = 0; a < e.length; a++) {
      const o = e[a];
      if (o.length === 0) continue;
      const n = new br(1, 1, 1), l = new vr({
        color: this.colors[a % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: xr,
        toneMapped: !1,
        wireframe: this.wireframe
      }), c = new yr(n, l, o.length);
      for (let u = 0; u < o.length; u++) {
        const h = this.lod.octree.nodes[o[u]].bounds;
        h.getCenter(t), h.getSize(s), i.makeScale(s.x, s.y, s.z), i.setPosition(t), c.setMatrixAt(u, i);
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
const Tt = I("uint", "gaussianIndex"), Bt = I("uint", "gaussianObjectId"), at = I("vec3", "gaussianPositionLocal"), He = I("vec3", "gaussianPositionWorld"), nt = I("vec3", "gaussianScale"), ot = I("vec4", "gaussianRotation"), lt = I("float", "gaussianOpacity"), At = I("vec3", "gaussianColor"), zt = I("mat4", "gaussianObjectMatrix"), Ot = I("bool", "gaussianObjectVisible"), $t = I("vec3", "gaussianViewDirection"), Et = I("float", "gaussianViewDepth"), Dt = I(
  "vec2",
  "gaussianScreenPosition"
), $s = I(
  "vec2",
  "gaussianScreenBoundsMin"
), Es = I(
  "vec2",
  "gaussianScreenBoundsMax"
), jt = I(
  "vec2",
  "gaussianProjectedSigma"
), Ut = I("float", "gaussianProjectedArea"), ct = I("uint", "rasterGaussianIndex"), Wt = I("uint", "rasterObjectId"), Ft = I("uvec2", "rasterPixelCoordinate"), Vt = I("vec2", "rasterScreenPosition"), qt = I("vec2", "rasterScreenUV"), Kt = I("float", "rasterPixelValue"), Yt = I("vec2", "rasterGaussianCenter"), Xt = I("vec2", "rasterPixelDelta"), Ds = I("vec2", "rasterGaussianCoord"), js = I("vec2", "rasterUV"), Ht = I("float", "rasterViewDepth"), Zt = I("vec3", "rasterGaussianColor"), Qt = I("float", "rasterGaussianOpacity"), Jt = I("float", "rasterPower"), Us = I("float", "rasterWeight");
function Jr() {
  return {
    gaussianPositionLocalNode: at,
    gaussianPositionWorldNode: He,
    gaussianScaleNode: nt,
    gaussianRotationNode: ot,
    gaussianOpacityNode: lt,
    gaussianColorNode: At,
    gaussianVisibilityNode: ce(!0),
    rasterPixelValueNode: W(0),
    rasterBreakNode: ce(!1),
    rasterColorNode: Zt,
    rasterAlphaNode: Qt.mul(Bs(Jt)),
    rasterDiscardNode: ce(!1)
  };
}
const Ye = /* @__PURE__ */ new Set([
  Tt,
  Bt,
  at,
  He,
  nt,
  ot,
  lt,
  At,
  zt,
  Ot,
  $t,
  Et,
  Dt,
  $s,
  Es,
  jt,
  Ut
]), es = /* @__PURE__ */ new Set([
  ct,
  Wt,
  Ft,
  Vt,
  qt,
  Kt,
  Yt,
  Xt,
  Ds,
  js,
  Ht,
  Zt,
  Qt,
  Jt,
  Us
]), Ws = /* @__PURE__ */ new Set([
  Ft,
  Vt,
  qt
]), ei = /* @__PURE__ */ new Set([
  ...Ws,
  Kt,
  ct,
  Wt,
  Yt,
  Xt,
  Ht
]);
function Fs(r, e, t) {
  r.traverse((s) => {
    if ((Ye.has(s) || es.has(s)) && !e.has(s))
      throw new Error(
        `A ${t} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function Ne(r, e, t) {
  r.traverse((s) => {
    if ((Ye.has(s) || es.has(s)) && !e.has(s))
      throw new Error(
        `GaussianPass.${t} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const ti = [
  15228264,
  15906891,
  4900235
];
class Ma {
  constructor(e, t = {}) {
    if (this.pass = e, t.colors !== void 0 && t.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = t.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...t.colors ?? ti], this.tintStrength = s, this.lodLevelAttribute = e.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = e.subscribeDebug(() => this.update()), this.enabled = t.enabled ?? !0;
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
      const n = new _r(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return it(n.r, n.g, n.b);
    });
    let i = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      i = t.equal(g(o)).select(s[o], i);
    const a = Gr(
      this.baseColorNode,
      i,
      W(this.tintStrength)
    );
    this.boundBuffer = e, this.helperColorNode = a, this.pass.rasterColorNode = a;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function ze(r) {
  if (!Number.isInteger(r) || r < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class Ia {
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
    const i = e.octree.leafNodeIds.slice(), a = new Uint8Array(i.length);
    return a.fill(e.finestLevel), { nodeIds: i, lodLevels: a, gaussianCount: s };
  }
}
function ts(r, e, t) {
  return r.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), r.getWorldPosition(t), e.worldToLocal(t);
}
function ss(r, e) {
  const t = e instanceof S ? e.clone() : r.octree.bounds.getCenter(new S()), s = r.octree.rootBounds.getSize(new S()), i = Math.max(s.length() * 0.5, Number.EPSILON), a = new S(), o = Array.from(r.octree.leafNodeIds, (n) => (r.octree.nodes[n].bounds.getCenter(a), {
    nodeId: n,
    radius: a.distanceTo(t) / i
  }));
  return o.sort(
    (n, l) => n.radius - l.radius || n.nodeId - l.nodeId
  ), o;
}
class Ta {
  cameraCenter = new S();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof S ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof S ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ts(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (ze(t), t === 0) return si();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const i = ss(e, this.center), a = [];
    let o = 0;
    for (const l of i) {
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
function si() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class ri {
  cameraCenter = new S();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof S ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = ii(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof S ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ts(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (ze(t), t === 0) return ai();
    const s = e.octree.data.count;
    if (s <= t) {
      const h = e.octree.leafNodeIds.slice(), d = new Uint8Array(h.length);
      return d.fill(e.finestLevel), { nodeIds: h, lodLevels: d, gaussianCount: s };
    }
    const i = ss(e, this.center), a = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], o = [], n = [];
    let l = 0, c = 0, u = 0;
    for (let h = 0; h < a.length; h++) {
      const d = this.budgetShares[h];
      if (u += d, d === 0) continue;
      const f = h === a.length - 1 ? t : Math.floor(t * u), b = a[h];
      for (; c < i.length; ) {
        const x = i[c], p = e.nodes[x.nodeId].levelCounts[b];
        if (l + p > f) break;
        o.push(x.nodeId), n.push(b), l += p, c++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(n),
      gaussianCount: l
    };
  }
}
function ii(r) {
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
function ai() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Ba {
  cameraCenter = new S();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof S ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof S ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      ts(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (ze(t), t === 0) return ni();
    const s = ss(e, this.center), i = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let a = s.reduce(
      (n, l, c) => n + e.nodes[l.nodeId].levelCounts[i[c]],
      0
    );
    for (let n = s.length - 1; n >= 0 && a > t; n--) {
      const l = e.nodes[s[n].nodeId];
      for (; i[n] > 0 && a > t; ) {
        const c = l.levelCounts[i[n]];
        i[n] = i[n] - 1, a -= c - l.levelCounts[i[n]];
      }
    }
    let o = s.length;
    for (; o > 0 && a > t; ) {
      o--;
      const n = e.nodes[s[o].nodeId];
      a -= n.levelCounts[i[o]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, o).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(i.slice(0, o)),
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
function oi(r) {
  const e = new Uint32Array(r.octree.leafNodeIds), t = new Float64Array(e.length * 3), s = new Uint32Array(e.length * r.levelCount);
  for (let n = 0; n < e.length; n++) {
    const l = e[n], c = r.octree.nodes[l].bounds, u = n * 3;
    t[u] = (c.min.x + c.max.x) * 0.5, t[u + 1] = (c.min.y + c.max.y) * 0.5, t[u + 2] = (c.min.z + c.max.z) * 0.5, s.set(r.nodes[l].levelCounts, n * r.levelCount);
  }
  const i = r.octree.rootBounds.max.x - r.octree.rootBounds.min.x, a = r.octree.rootBounds.max.y - r.octree.rootBounds.min.y, o = r.octree.rootBounds.max.z - r.octree.rootBounds.min.z;
  return {
    leafNodeIds: e,
    leafCenters: t,
    levelCounts: s,
    levelCount: r.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        i * i + a * a + o * o
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const Vs = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, ys = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Vs], { type: "text/javascript;charset=utf-8" });
function li(r) {
  let e;
  try {
    if (e = ys && (self.URL || self.webkitURL).createObjectURL(ys), !e) throw "";
    const t = new Worker(e, {
      name: r?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Vs),
      {
        name: r?.name
      }
    );
  }
}
const ci = 2;
class ui {
  constructor(e) {
    this.targetStrategy = e;
  }
  targetStrategy;
  worker = null;
  boundsCenter = new S();
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
    this.worker = new li({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const t = oi(e), s = Array.from(
      { length: ci },
      () => di(t.leafNodeIds.length)
    ), i = {
      type: "init",
      data: t,
      buffers: s
    };
    this.worker.postMessage(i, [
      t.leafNodeIds.buffer,
      t.leafCenters.buffer,
      t.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: a, lodLevels: o }) => [a, o])
    ]);
  }
  request(e) {
    this.assertUsable(), this.initialize(e.lod), this.initializeWorker(), this.releaseLatestResult();
    const t = this.targetStrategy.center instanceof S ? this.targetStrategy.center : e.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
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
      packing: hi(t),
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
function di(r) {
  return {
    nodeIds: new ArrayBuffer(r * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(r * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function hi(r) {
  return {
    nodeIds: new Uint32Array(r.buffer.nodeIds, 0, r.length),
    lodLevels: new Uint8Array(r.buffer.lodLevels, 0, r.length),
    gaussianCount: r.gaussianCount
  };
}
const pi = 1024 * 1024, fi = 16, gi = 1.25;
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
    if (this.targetStrategy = e, this.targetPlanner = t.targetPlanner ?? null, this.maxUploadBytesPerPack = t.maxUploadBytesPerPack ?? pi, this.maxChangedCellsPerPack = t.maxChangedCellsPerPack ?? fi, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
      const i = this.changes[this.changeCursor], a = t.length >= this.maxChangedCellsPerPack || s + i.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (t.length > 0 && a && this.appliedGaussianCount <= e.maxGaussians)
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
    const i = [], a = [];
    for (let o = this.appliedCellCount - 1; o >= 0; o--) {
      const n = this.appliedNodeIds[o], l = this.appliedLodLevels[o], c = s[n];
      (c < 0 || c < l) && i.push(
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
    return [...i, ...a];
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
function _s(r) {
  return r instanceof qs;
}
function ws(r, e, t, s) {
  const i = r.nodes[e], a = t === null ? 0 : i.levelCounts[t], o = s === null ? 0 : i.levelCounts[s], n = Math.max(0, o - a), l = Math.max(0, a - o), c = t !== null && s !== null && t !== s ? Math.min(a, o) : 0, u = 48 + r.octree.data.shCoefficientCount * zs + 4;
  return {
    nodeId: e,
    lodLevel: s,
    gaussianDelta: o - a,
    estimatedUploadBytes: Math.ceil(
      (n * u + l * 16 + c * 4) * gi
    )
  };
}
function ks(r, e, t) {
  if (e.gaussianCount > t)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${t} Gaussians`
    );
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let i = 0;
  for (let a = 0; a < e.nodeIds.length; a++) {
    const o = e.nodeIds[a], n = e.lodLevels[a], c = r.nodes[o]?.levelCounts[n];
    if (c === void 0 || r.octree.nodes[o]?.isLeaf !== !0)
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
class mi {
  allocate({ remainingGaussians: e }) {
    return e;
  }
}
class Aa {
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
function Ve(r, e, t) {
  if (r.length === 0) return [];
  r.sort((h, d) => h - d);
  const s = [];
  let i = r[0], a = i, o = 1;
  for (let h = 1; h <= r.length; h++) {
    const d = r[h];
    if (d !== a) {
      if (d !== void 0 && o++, d === a + 1) {
        a = d;
        continue;
      }
      s.push({ start: i, count: a - i + 1 }), d !== void 0 && (i = a = d);
    }
  }
  if (s.length < 2) return s;
  const n = Math.floor(o * t);
  let l = 0;
  const c = [];
  let u = { ...s[0] };
  for (let h = 1; h < s.length; h++) {
    const d = s[h], f = u.start + u.count, b = d.start - f;
    b <= e && l + b <= n ? (u.count = d.start + d.count - u.start, l += b) : (c.push(u), u = { ...d });
  }
  return c.push(u), c;
}
function qe(r) {
  let e = 0;
  for (const t of r) e += t.count;
  return e;
}
function re(r, e, t) {
  if (e.length !== 0) {
    for (const s of e)
      r.addUpdateRange(
        s.start * t,
        s.count * t
      );
    r.needsUpdate = !0;
  }
}
const Ks = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), Ys = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), Xs = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class bi {
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
    const t = this.packedBuffer, s = new Be(e, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, t?.dispose();
  }
  [Ys](e) {
    re(this.bufferAttribute, e, 1);
  }
  [Xs]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const Hs = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), Zs = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class vi {
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
  [Hs](e, t) {
    const s = this.attributes.get(e);
    if (s !== void 0) {
      if (s.format !== t)
        throw new Error(
          `GaussianStore attribute ${e} already uses format ${s.format}`
        );
      return s;
    }
    const i = new bi(e, t);
    return this.attributes.set(e, i), i;
  }
  [Zs]() {
    for (const e of this.attributes.values())
      e[Xs]();
    this.attributes.clear();
  }
}
class xi {
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
      for (const i of s.slots)
        t[i] = s.lodLevel, this.writtenSlots.push(i);
  }
  updateCell(e) {
    const { previousCell: t, cell: s, retainedCount: i } = e, a = t?.lodLevel === s.lodLevel ? i : 0, o = this.attribute.array;
    for (let n = a; n < s.slots.length; n++) {
      const l = s.slots[n];
      o[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const e = this.writtenSlots.length, t = Ve(this.writtenSlots, 16, 0.25), s = qe(t);
    return this.freshBuffer || this.attribute[Ys](t), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: e,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: t
    };
  }
}
const yi = 16777216;
class za {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new vi();
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
    this.loader = e.loader ?? new $r(), this.budgetingStrategy = e.budgetingStrategy ?? new mi(), this.defaultPackingStrategy = e.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...e.defaultStreamingLod }, this.maxGaussiansOption = ki(
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
    const t = this.attributes[Hs](
      "lodLevel",
      "u32"
    ), s = new xi(t);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), t;
  }
  async load(e, t = {}) {
    this.assertUsable();
    const s = await this.loader.load(e);
    let i = null, a = null;
    try {
      return i = Mt.build(s, {
        ...t.octree,
        ownsData: !0
      }), a = It.build(i, {
        ...t.lod,
        ownsOctree: !0
      }), this.addLod(a, {
        name: t.name ?? wi(e),
        priority: t.priority,
        packingStrategy: t.packingStrategy,
        ownsLod: !0
      });
    } catch (o) {
      throw a !== null ? a.dispose() : i !== null ? i.dispose() : s.dispose(), o;
    }
  }
  add(e, t = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), i = kt(t.priority ?? 0), a = new vs(
      this,
      s,
      0,
      t.name,
      null,
      null,
      i
    );
    return this.entries.push({
      cloud: a,
      count: 0,
      sourceGaussianCount: e.count,
      sourceDegree: e.shDegree,
      priority: i,
      packingStrategy: null,
      ownsPackingStrategy: !1,
      lastLodFocus: new S(Number.NaN, Number.NaN, Number.NaN),
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
    const s = this.allocateObjectId(), i = kt(t.priority ?? 0), a = new vs(
      this,
      s,
      0,
      t.name,
      e,
      null,
      i
    ), o = t.packingStrategy ?? this.defaultPackingStrategy ?? Si(this.defaultStreamingLod);
    return this.entries.push({
      cloud: a,
      count: 0,
      sourceGaussianCount: e.octree.data.count,
      sourceDegree: e.octree.data.shDegree,
      priority: i,
      packingStrategy: o,
      ownsPackingStrategy: t.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new S(Number.NaN, Number.NaN, Number.NaN),
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
    const t = this.entries.findIndex((i) => i.cloud === e);
    if (t < 0) return;
    const [s] = this.entries.splice(t, 1);
    this.cloudList.splice(this.cloudList.indexOf(e), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && Ss(s.packingStrategy), e.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: e }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const t = Ni(e, this.shDegree), s = this.maxGaussiansOption === "auto" ? t : Math.min(t, this.maxGaussiansOption), i = performance.now(), a = this.planPackings(s), o = performance.now() - i, n = Math.min(
      s,
      this.entries.reduce((f, b) => f + b.sourceGaussianCount, 0)
    ), l = this.packedData, c = l !== null && l.count === n && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), h = c ? this.updatePackedData(a, l) : this.buildPackedData(a, n), d = performance.now() - u;
    for (const f of a)
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
    if (!_s(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const i = performance.now(), a = s.takeNextBatch({
      lod: t.lod,
      maxGaussians: t.allocatedBudget
    }), o = performance.now() - i;
    if (a === null)
      return { applied: !1, pending: s.needsPack };
    const n = this.packedData, l = this.cellSlotsByEntry.get(t);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const c = performance.now(), u = l, h = this.freeSlots, d = this.scratchReleasedSlots;
    d.length = 0;
    const f = /* @__PURE__ */ new Map();
    for (const w of a.transitions) {
      const M = l.get(w.nodeId), U = w.lodLevel === null ? 0 : t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], C = Math.min(
        M?.slots.length ?? 0,
        U
      );
      if (f.set(w.nodeId, {
        previousCell: M,
        retainedCount: C
      }), M !== void 0)
        for (let $ = C; $ < M.slots.length; $++) {
          const z = M.slots[$];
          h.push(z), d.push(z);
        }
    }
    const b = this.scratchWrittenSlots;
    b.length = 0;
    for (const w of a.transitions) {
      const M = f.get(w.nodeId), { previousCell: U, retainedCount: C } = M;
      if (w.lodLevel === null) {
        u.delete(w.nodeId);
        continue;
      }
      const $ = t.lod.nodes[w.nodeId].levelCounts[w.lodLevel], z = U?.slots, F = z !== void 0 && z.length === $ ? z : new Uint32Array($);
      F !== z && z !== void 0 && C > 0 && F.set(z.subarray(0, C));
      for (let q = C; q < $; q++) {
        const oe = h.pop();
        if (oe === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          t,
          this.cellSourceIndex(t, w.nodeId, q),
          oe,
          n.means.array,
          n.scalesOpacity.array,
          n.rotations.array,
          n.shCoefficients.array,
          n.shCoefficientCount
        ), F[q] = oe, b.push(oe);
      }
      const ne = {
        lodLevel: w.lodLevel,
        slots: F
      };
      for (const q of this.attributePackers)
        q.updateCell({ previousCell: U, cell: ne, retainedCount: C });
      u.set(w.nodeId, ne);
    }
    const x = this.nextSlotMarkGeneration(n.count);
    for (const w of b) this.slotMarks[w] = x;
    const p = this.scratchClearedSlots;
    p.length = 0;
    for (const w of d)
      this.slotMarks[w] !== x && p.push(w);
    const v = n.scalesOpacity.array;
    for (const w of p) v[w * 4 + 3] = 0;
    const k = Ve(b, 4, 0.15), L = Ve(p, 16, 0.25);
    re(n.means, k, 4), re(n.scalesOpacity, k, 4), re(n.scalesOpacity, L, 4), re(n.rotations, k, 4), re(
      n.shCoefficients,
      k,
      n.shCoefficientCount * n.shCoefficients.itemSize
    );
    const N = this.commitAttributePackers(), y = this.count - t.count + a.packing.gaussianCount, R = qe(k), G = qe(L), A = performance.now() - c;
    return t.count = a.packing.gaussianCount, t.packing = a.packing, t.packingDirty = !1, t.cloud.updatePacking(t.count, t.packing), this.cellSlotsByEntry.set(t, u), this.freeSlots = h, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: n.count,
      activeGaussians: y,
      reusedSlots: y - b.length,
      writtenSlots: b.length,
      clearedSlots: p.length,
      estimatedUploadBytes: R * wt(n) + G * 16 + N.estimatedUploadBytes,
      writtenSlotRanges: k,
      clearedSlotRanges: L,
      planningMs: o,
      slotUpdateMs: A
    }, { applied: !0, pending: a.pending };
  }
  planPackings(e) {
    const t = [...this.entries].sort(
      (a, o) => a.priority - o.priority || a.cloud.objectId - o.cloud.objectId
    ), s = [];
    let i = 0;
    for (const a of t) {
      const o = Math.max(0, e - i), n = this.budgetingStrategy.allocate({
        capacity: e,
        allocatedGaussians: i,
        remainingGaussians: o,
        entry: {
          cloud: a.cloud,
          priority: a.priority,
          insertionIndex: a.cloud.objectId,
          sourceGaussianCount: a.sourceGaussianCount
        }
      });
      if (Ci(n, o), a.lod === null) {
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
        }), i += a.sourceGaussianCount;
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
      Li(a.lod, u), s.push({
        entry: a,
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
    const s = this.entries.find((a) => a.cloud === e);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const i = kt(t);
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
    const t = new S(), s = new S();
    let i = 0, a = !1;
    const o = [];
    for (const n of this.entries) {
      const l = n.packingStrategy;
      if (n.lod === null || l === null || !_s(l))
        continue;
      n.cloud.updateWorldMatrix(!0, !1), e.getWorldPosition(t), n.cloud.worldToLocal(t);
      const c = n.lod.octree.rootBounds.getSize(new S()).length() * 0.5, u = Math.max(0.05, c * 0.025);
      (!Number.isFinite(n.lastLodFocus.x) || t.distanceToSquared(n.lastLodFocus) >= u * u) && (l.setFromCamera(e, n.cloud), n.lastLodFocus.copy(t));
      let h = !1;
      l.needsPack && (h = this.packLodBatch(n.cloud).applied, h && i++);
      const d = l.needsPack;
      a ||= d, n.lod.octree.rootBounds.getCenter(s), o.push({
        cloud: n.cloud,
        focusDistance: t.distanceTo(s),
        applied: h,
        pending: d,
        targetStats: l.targetStats
      });
    }
    return { appliedBatches: i, pending: a, clouds: o };
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
    const s = this.shDegree, i = (s + 1) ** 2, a = new Float32Array(t * 4), o = new Float32Array(t * 4), n = new Float32Array(t * 4), l = new Uint32Array(t * i), c = /* @__PURE__ */ new Map();
    let u = 0;
    for (const x of e) {
      const { entry: p } = x, v = /* @__PURE__ */ new Map();
      for (const k of this.plannedCells(x)) {
        const L = new Uint32Array(k.count);
        for (let N = 0; N < k.count; N++) {
          const y = this.cellSourceIndex(p, k.nodeId, N);
          this.copySourceToSlot(
            p,
            y,
            u,
            a,
            o,
            n,
            l,
            i
          ), L[N] = u++;
        }
        v.set(k.nodeId, {
          lodLevel: k.lodLevel,
          slots: L
        });
      }
      c.set(p, v);
    }
    const h = Array.from(
      { length: t - u },
      (x, p) => t - 1 - p
    ), d = new As(
      {
        means: st("3dgs.store.means-object", a),
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
    for (const x of this.attributePackers)
      x.allocate(t), x.backfill({ cells: f });
    const b = this.commitAttributePackers();
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
        estimatedUploadBytes: u * wt(d) + b.estimatedUploadBytes,
        writtenSlotRanges: u === 0 ? [] : [{ start: 0, count: u }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(e, t) {
    const s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
    let a = 0;
    for (const y of e) {
      if (i.add(y.entry), a += y.count, !y.selectionChanged) continue;
      const R = /* @__PURE__ */ new Map();
      for (const G of this.plannedCells(y))
        R.set(G.nodeId, G);
      s.set(y.entry, R);
    }
    const o = [...this.freeSlots], n = this.scratchReleasedSlots;
    n.length = 0;
    for (const [y, R] of this.cellSlotsByEntry) {
      const G = s.get(y);
      if (!(G === void 0 && i.has(y)))
        for (const [A, w] of R) {
          const M = w.slots, U = Math.min(
            M.length,
            G?.get(A)?.count ?? 0
          );
          for (let C = U; C < M.length; C++) {
            const $ = M[C];
            o.push($), n.push($);
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
      const G = /* @__PURE__ */ new Map();
      for (const A of s.get(y.entry)?.values() ?? []) {
        const w = R?.get(A.nodeId), M = w?.slots, U = Math.min(M?.length ?? 0, A.count), C = M !== void 0 && M.length === A.count ? M : new Uint32Array(A.count);
        C !== M && M !== void 0 && U > 0 && C.set(M.subarray(0, U)), u += U;
        for (let z = U; z < A.count; z++) {
          const F = o.pop();
          if (F === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            y.entry,
            this.cellSourceIndex(y.entry, A.nodeId, z),
            F,
            t.means.array,
            t.scalesOpacity.array,
            t.rotations.array,
            t.shCoefficients.array,
            t.shCoefficientCount
          ), C[z] = F, c.push(F);
        }
        const $ = {
          lodLevel: A.lodLevel,
          slots: C
        };
        for (const z of this.attributePackers)
          z.updateCell({
            previousCell: w,
            cell: $,
            retainedCount: U
          });
        G.set(A.nodeId, $);
      }
      l.set(y.entry, G);
    }
    const h = this.nextSlotMarkGeneration(t.count);
    for (const y of c) this.slotMarks[y] = h;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const y of n)
      this.slotMarks[y] !== h && d.push(y);
    const f = t.scalesOpacity.array;
    for (const y of d) f[y * 4 + 3] = 0;
    const b = c.length, x = d.length, p = Ve(c, 4, 0.15), v = Ve(d, 16, 0.25);
    re(t.means, p, 4), re(t.scalesOpacity, p, 4), re(t.scalesOpacity, v, 4), re(t.rotations, p, 4), re(
      t.shCoefficients,
      p,
      t.shCoefficientCount * t.shCoefficients.itemSize
    );
    const k = this.commitAttributePackers(), L = qe(p), N = qe(v);
    return {
      data: t,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: t.count,
        activeGaussians: a,
        reusedSlots: u,
        writtenSlots: b,
        clearedSlots: x,
        estimatedUploadBytes: L * wt(t) + N * 16 + k.estimatedUploadBytes,
        writtenSlotRanges: p,
        clearedSlotRanges: v,
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
    for (const a of this.attributePackers) {
      const o = a.commit();
      e += o.writtenSlots, t += o.uploadedSlots, s += o.estimatedUploadBytes, i.push(...o.slotRanges);
    }
    return { writtenSlots: e, uploadedSlots: t, estimatedUploadBytes: s, slotRanges: i };
  }
  cellSourceIndex(e, t, s) {
    return e.lod === null ? s : e.lod.nodes[t].sortedGaussianIndices[s];
  }
  copySourceToSlot(e, t, s, i, a, o, n, l) {
    const c = e.lod?.octree.data ?? e.source;
    if (c === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    _t(c.means.array, t, i, s), _t(
      c.scalesOpacity.array,
      t,
      a,
      s
    ), _t(
      c.rotations.array,
      t,
      o,
      s
    ), i[s * 4 + 3] = e.cloud.objectId, _i(
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
    if (e >= yi)
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
  const s = new Be(e, t);
  return s.name = r, s;
}
function _t(r, e, t, s) {
  t.set(
    r.subarray(e * 4, e * 4 + 4),
    s * 4
  );
}
function _i(r, e, t, s, i) {
  const a = r.shCoefficientCount, o = Math.min(
    a,
    i
  ), n = s * i;
  if (t.fill(
    0,
    n,
    n + i
  ), r.shFormat === "rgb8e8") {
    const u = e * a;
    t.set(
      r.shCoefficients.array.subarray(
        u,
        u + o
      ),
      n
    );
    return;
  }
  const l = r.shCoefficients.array, c = e * a * 4;
  for (let u = 0; u < o; u++) {
    const h = c + u * 4;
    t[n + u] = zr(
      l[h],
      l[h + 1],
      l[h + 2]
    );
  }
}
function wt(r) {
  return 48 + r.shCoefficientCount * Os(r.shFormat);
}
function wi(r) {
  const e = r.split(/[?#]/, 1)[0] ?? r;
  return e.slice(e.lastIndexOf("/") + 1) || "GaussianCloud";
}
function kt(r) {
  if (!Number.isSafeInteger(r))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return r;
}
function ki(r) {
  if (r !== "auto" && (!Number.isSafeInteger(r) || r <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return r;
}
function Si(r) {
  const e = new ri();
  return new qs(e, {
    ...r,
    targetPlanner: new ui(e)
  });
}
function Ss(r) {
  r !== null && "dispose" in r && typeof r.dispose == "function" && r.dispose();
}
function Ci(r, e) {
  if (!Number.isSafeInteger(r) || r < 0 || r > e)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${e}]`
    );
}
function Li(r, e) {
  if (e.nodeIds.length !== e.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const t = /* @__PURE__ */ new Set();
  let s = 0;
  for (let i = 0; i < e.nodeIds.length; i++) {
    const a = e.nodeIds[i], o = r.nodes[a], n = r.octree.nodes[a], l = e.lodLevels[i], c = o?.levelCounts[l];
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
function Ni(r, e) {
  const t = Cs(
    r.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Cs(r.maxBufferSize, "maxBufferSize"), i = Math.max(
    16,
    (e + 1) ** 2 * Os("rgb8e8")
  );
  return Math.floor(Math.min(t, s) / i);
}
function Cs(r, e) {
  if (!Number.isSafeInteger(r) || r <= 0)
    throw new RangeError(
      `GPUDevice limit ${e} must be a positive safe integer`
    );
  return r;
}
const Qs = 16, _ = 256, Pi = 8192, E = 512, Nt = 4, P = 1 << Nt, ie = 4, ue = _ * ie, X = ue, ae = 32, Ri = (
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
), Gi = (
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
), Mi = (
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
function Js(r, e) {
  return Math.max(1, Math.ceil(2 * r / e));
}
function Ii(r, e) {
  if (r !== null) {
    if (!Number.isInteger(r) || r < _ || r % _ !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${_} and at least ${_}`
      );
    if (Js(e, r) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const Ti = (
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
function Bi(r) {
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
const Ai = (
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
      new wr(new Uint32Array(4), 4)
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
class zi {
  constructor(e, t, s, i, a) {
    this.renderer = e, this.visibleDispatch = a, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      t
    );
    const o = B(
      Ai
    );
    this.computeNode = o({
      rank: J,
      state: m(a.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: m(
        i,
        "uvec2",
        t
      ).toReadOnly(),
      tile_counts: m(
        s,
        "uint",
        t
      ).toReadOnly(),
      ordered_tile_counts: m(this.tileCounts, "uint", t)
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
function er(r) {
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
  scratch: ptr<workgroup, array<u32, ${E}>>
) -> u32 {
  let base = group_id * ${E}u;
  let first = base + lane;
  let second = first + ${_}u;
  (*scratch)[lane] = ${r.readValue("first")};
  (*scratch)[lane + ${_}u] = ${r.readValue("second")};
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${E / 2}u;
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
    (*block_sums)[group_id] = (*scratch)[${E - 1}u];
    (*scratch)[${E - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${E / 2}u;
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
const Oi = er({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (r) => `select(0u, (*input_values)[${r}], ${r} < length)`
}), $i = er({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (r) => `select(0u, 1u, ${r} < length && (*input_values)[${r}].w > 0.0)`
}), Ei = (
  /* wgsl */
  `
fn add_scan_offsets(
  index: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    (*values)[index] += (*block_offsets)[index / ${E}u];
  }
  return 0u;
}
`
);
class Pt {
  output;
  attributes = new de();
  levels = [];
  constructor(e, t, s = "intersections", i = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, t);
    const a = B(Oi), o = B(
      $i
    ), n = B(Ei);
    let l = e, c = this.output, u = t;
    for (; ; ) {
      const h = Math.ceil(u / E), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        h
      ), f = j("uint", E), b = this.levels.length === 0 && i === "projectedVisibility", x = (b ? o : a)({
        lane: we,
        group_id: Y.x,
        length: g(u),
        input_values: m(
          l,
          b ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: m(c, "uint", u),
        block_sums: m(d, "uint", h),
        scratch: f
      }).computeKernel([_]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
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
        index: J,
        length: g(d.length),
        values: m(d.output, "uint", d.length),
        block_offsets: m(
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
class Di {
  constructor(e, t, s = 16) {
    this.camera = e, this.background = t, this.tileSize = s;
  }
  camera;
  background;
  tileSize;
  projection = je(new Ae());
  view = je(new Ae());
  viewport = je(new kr());
  tilesX = je(1, "uint");
  tilesY = je(1, "uint");
  update(e, t, s, i) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(e, t, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = i;
  }
}
function tr(r, e = Qs) {
  const { center: t, conic: s, powerThreshold: i, tileX: a, tileY: o, onHit: n } = r;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${a}), f32(${o})) * ${e}.0;
      let rect_max = rect_min + vec2<f32>(${e}.0);
      let x_left = ${t}.x < rect_min.x;
      let x_right = ${t}.x > rect_max.x;
      let in_x_range = !(x_left || x_right);
      let y_above = ${t}.y < rect_min.y;
      let y_below = ${t}.y > rect_max.y;
      let in_y_range = !(y_above || y_below);
      var contributes = in_x_range && in_y_range;
      if (!contributes) {
        let corner = vec2<f32>(
          select(rect_max.x, rect_min.x, x_left),
          select(rect_max.y, rect_min.y, y_above)
        );
        let edge = vec2<f32>(
          select(-${e}.0, ${e}.0, x_left),
          select(-${e}.0, ${e}.0, y_above)
        );
        let difference = ${t} - corner;
        let tx_raw = (
          edge.x * ${s}.x * difference.x +
          edge.x * ${s}.y * difference.y
        ) / (edge.x * ${s}.x * edge.x);
        let ty_raw = (
          edge.y * ${s}.y * difference.x +
          edge.y * ${s}.z * difference.y
        ) / (edge.y * ${s}.z * edge.y);
        let tx = select(clamp(tx_raw, 0.0, 1.0), 0.0, in_y_range);
        let ty = select(clamp(ty_raw, 0.0, 1.0), 0.0, in_x_range);
        let closest = corner + vec2<f32>(tx * edge.x, ty * edge.y);
        let delta = closest - ${t};
        let sigma = 0.5 * (
          ${s}.x * delta.x * delta.x +
          ${s}.z * delta.y * delta.y
        ) + ${s}.y * delta.x * delta.y;
        contributes = sigma <= ${i};
      }
      if (contributes) {
        ${n}
      }`
  );
}
const ji = (
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
);
function sr(r = Qs) {
  const e = tr(
    {
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
    },
    r
  );
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
    clamp(i32(floor((center.x - radius.x) / ${r}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${r}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${r}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${r}.0)), 0, max_tile_y)
  );
  let reserved_count = (*tile_counts)[rank];
  var local_index = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
${e}
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
}
sr();
class Ui {
  constructor(e, t, s, i, a, o, n, l, c, u, h) {
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
    ).toReadOnly(), b = m(
      a.state,
      "uvec4",
      1
    ).toReadOnly(), x = B(ji);
    this.prepareNode = x({
      item_count_state: b,
      capacity: g(s),
      tile_counts: d,
      intersection_offsets: f,
      state: m(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: m(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: m(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: m(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const p = B(
      sr(h.tileSize)
    );
    this.emitNode = p({
      rank: J,
      tiles: Xe(h.tilesX, h.tilesY),
      capacity: g(s),
      sorted_gaussians: m(
        i,
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
      visible_state: b,
      records: m(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([_]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = a;
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
const Rt = 10;
class Wi {
  constructor(e, t, s) {
    this.camera = e, this.store = t, this.frameComponentOffset = s * 4, this.frameComponentCount = t.objectCapacity * Rt * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new Be(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Ae();
  inverseModel = new Ae();
  cameraWorldPosition = new S();
  cameraLocalPosition = new S();
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
    const t = this.frameComponentOffset + e.objectId * Rt * 4;
    this.values.set(e.matrixWorld.elements, t), this.values.set(this.modelView.elements, t + 16), this.values[t + 32] = this.cameraLocalPosition.x, this.values[t + 33] = this.cameraLocalPosition.y, this.values[t + 34] = this.cameraLocalPosition.z, this.values[t + 35] = 1, this.values[t + 36] = Fi(e, this.camera) ? 1 : 0;
  }
}
function Fi(r, e) {
  if (!r.layers.test(e.layers)) return !1;
  let t = r, s = r;
  for (; t !== null; ) {
    if (!t.visible) return !1;
    s = t, t = t.parent;
  }
  return s instanceof Ts;
}
function Vi(r) {
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
function qi(r) {
  const e = r === "rgb8e8" ? "u32" : "vec4<f32>", t = r === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (i) => {
    const a = i === 0 ? "base" : `base + ${i}u`;
    return r === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${a}])` : `(*sh_coefficients)[${a}].xyz`;
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
const Ki = (
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
function Yi(r = 16) {
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
${tr(
      {
        center: "center",
        conic: "conic",
        powerThreshold: "power_threshold",
        tileX: "tile_x",
        tileY: "tile_y",
        onHit: "count++;"
      },
      r
    )}
    }
  }
  return count;
}
`
  );
}
const rr = /* @__PURE__ */ new Set([
  Tt,
  Bt,
  at,
  nt,
  ot,
  lt,
  zt,
  Ot
]), ir = /* @__PURE__ */ new Set([
  ...rr,
  He,
  $t
]), Xi = /* @__PURE__ */ new Set([
  ...ir,
  Et,
  Dt,
  jt,
  Ut
]);
class Hi {
  constructor(e, t, s, i, a, o = !0) {
    this.data = e, this.frame = t, this.antialiasMode = i, this.subpixelSampleCulling = o, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
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
      Fs(s, Ye, "projection");
    Ne(
      e.gaussianPositionLocalNode,
      rr,
      "gaussianPositionLocalNode"
    );
    for (const [s, i] of [
      ["gaussianPositionWorldNode", e.gaussianPositionWorldNode],
      ["gaussianScaleNode", e.gaussianScaleNode],
      ["gaussianRotationNode", e.gaussianRotationNode]
    ])
      Ne(i, ir, s);
    Ne(
      e.gaussianOpacityNode,
      Xi,
      "gaussianOpacityNode"
    ), Ne(
      e.gaussianColorNode,
      Ye,
      "gaussianColorNode"
    ), Ne(
      e.gaussianVisibilityNode,
      Ye,
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
    const { data: t, frame: s } = this, i = m(t.means, "vec4", t.count).toReadOnly(), a = m(
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
    ), c = m(this.projectedConic, "vec4", t.count), u = m(this.projectedColor, "vec4", t.count), h = m(this.tileCounts, "uint", t.count), d = B(
      Vi(this.antialiasMode)
    ), f = B(qi(t.shFormat)), b = B(Yi(s.tileSize)), x = B(Ki);
    return rt(() => {
      const v = g(J);
      T(v.greaterThanEqual(g(t.count)), () => {
        ge();
      }), h.element(v).assign(g(0)), l.element(v).assign(Z(0));
      const k = i.element(v), L = k.xyz, N = g(k.w), y = a.element(v), R = y.xyz, G = y.w, A = o.element(v), w = g(t.count).add(
        N.mul(g(Rt))
      ), M = us(
        l.element(w),
        l.element(w.add(1)),
        l.element(w.add(2)),
        l.element(w.add(3))
      ), U = us(
        l.element(w.add(4)),
        l.element(w.add(5)),
        l.element(w.add(6)),
        l.element(w.add(7))
      ), C = l.element(w.add(8)).xyz, $ = l.element(w.add(9)).x.greaterThan(0);
      T($.not(), () => {
        ge();
      });
      const z = /* @__PURE__ */ new Map([
        [Tt, () => v],
        [Bt, () => N],
        [at, () => L],
        [nt, () => R],
        [ot, () => A],
        [lt, () => G],
        [zt, () => M],
        [Ot, () => $]
      ]), F = Ce(
        e.gaussianPositionLocalNode,
        z
      ).toVar("gaussianPositionLocalValue"), ne = M.mul(Z(F, 1)).xyz, q = new Map(z);
      q.set(He, () => ne);
      const oe = Mr(F.sub(C));
      q.set($t, () => oe);
      let be;
      if (e.gaussianPositionWorldNode === He)
        be = U.mul(Z(F, 1));
      else {
        const K = Ce(
          e.gaussianPositionWorldNode,
          q
        ).toVar("gaussianPositionWorldValue");
        be = s.view.mul(Z(K, 1));
      }
      be = be.toVar("gaussianViewPosition");
      const ke = Ce(e.gaussianScaleNode, q).toVar(
        "gaussianScaleValue"
      ), Pe = Ce(
        e.gaussianRotationNode,
        q
      ).toVar("gaussianRotationValue"), le = d({
        view: be,
        scale_input: ke,
        rotation_input: Pe,
        model_view: U,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      T(le.element(0).w.lessThanEqual(0), () => {
        ge();
      });
      const he = le.element(0).xy, pe = le.element(0).z, ee = le.element(1).xyz, Re = le.element(1).w, te = le.element(2).xyz, Oe = le.element(2).w, fe = new Map(q);
      fe.set(Et, () => pe), fe.set(Dt, () => he), fe.set(jt, () => Le(te.xz)), fe.set(
        Ut,
        () => Le(Re).mul(Math.PI)
      );
      const $e = Ce(
        e.gaussianOpacityNode,
        fe
      ).clamp(0, 1), Se = this.antialiasMode === "compensated" ? $e.mul(
        Le(_e(Oe.div(Re), 0, 1))
      ) : $e;
      T(Se.lessThan(W(1 / 255)), () => {
        ge();
      });
      const se = Ir(Se.mul(255)), Ge = Le(
        se.mul(2).mul(_e(te.x, 1e-12, 1e4))
      ), Ee = Le(
        se.mul(2).mul(_e(te.z, 1e-12, 1e4))
      ), ve = ds(Ge), Me = ds(Ee);
      T(ve.lessThanEqual(0).or(Me.lessThanEqual(0)), () => {
        ge();
      });
      const De = me(ve, Me), O = he.sub(De), xe = he.add(De);
      if (T(
        xe.x.lessThan(0).or(xe.y.lessThan(0)).or(O.x.greaterThanEqual(s.viewport.x)).or(O.y.greaterThanEqual(s.viewport.y)),
        () => {
          ge();
        }
      ), this.subpixelSampleCulling) {
        const K = x({
          center: he,
          conic: ee,
          power_threshold: se,
          extent: me(Ge, Ee),
          viewport: Xe(s.viewport.xy)
        });
        T(K.not(), () => {
          l.element(v).assign(Z(he, pe, -1)), ge();
        });
      }
      const Ze = Ke(hs(s.tilesX), hs(s.tilesY)).sub(1), Qe = Ke(
        _e(
          Ct(O.div(W(s.tileSize))),
          me(0),
          me(Ze)
        )
      ), ut = Ke(
        _e(
          Ct(xe.div(W(s.tileSize))),
          me(0),
          me(Ze)
        )
      ), dt = f({
        gid: v,
        sh_degree: g(t.shDegree),
        direction: oe,
        sh_coefficients: n
      }), D = new Map(fe);
      D.set(At, () => dt), D.set($s, () => O), D.set(Es, () => xe);
      const H = Ce(
        e.gaussianVisibilityNode,
        D
      );
      T(H.not(), () => {
        ge();
      });
      const Q = b({
        center: he,
        conic: ee,
        power_threshold: se,
        tile_min: Qe,
        tile_max: ut
      });
      T(Q.equal(0), () => {
        ge();
      });
      const V = Ce(
        e.gaussianColorNode,
        D
      ).clamp(0, 1);
      l.element(v).assign(Z(he, pe, Se)), c.element(v).assign(Z(ee, ve)), u.element(v).assign(Z(V, Me)), h.element(v).assign(Q);
    })().compute(t.count, [_]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Ce(r, e) {
  return r.context({ overrideNodes: e });
}
const Zi = (
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
), Qi = _, ar = 256, Ji = [2048, 4096, 8192];
function ea(r, e = ar) {
  const t = Math.max(0, r.length - 1);
  if (t === 0)
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
  const s = new Uint32Array(t);
  let i = 0, a = 0, o = 0, n = 0, l = 0, c = 0, u = 0, h = 0;
  for (let d = 0; d < t; d++) {
    const f = Math.max(0, r[d + 1] - r[d]);
    s[d] = f, i += f, a = Math.max(a, f), f > 256 && o++, f > 512 && n++, f > 1024 && l++, f > 2048 && c++;
    const b = Math.ceil(f / e);
    u += b, h = Math.max(h, b);
  }
  return s.sort(), {
    max: a,
    mean: i / t,
    median: ta(s),
    p95: Ns(s, 0.95),
    p99: Ns(s, 0.99),
    tilesOver256: o,
    tilesOver512: n,
    tilesOver1024: l,
    tilesOver2048: c,
    totalBatches: u,
    maxBatches: h
  };
}
function Ls(r, e, t = ar) {
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const s = Math.max(0, r.length - 1);
  let i = 0, a = 0, o = 0, n = 0, l = 0;
  for (let u = 0; u < s; u++) {
    const h = Math.max(0, r[u + 1] - r[u]), d = Math.min(h, e), f = h - d;
    i += d, a += f, f > 0 && o++;
    const b = Math.ceil(d / t);
    n += b, l = Math.max(l, b);
  }
  const c = i + a;
  return {
    cap: e,
    rasterizedIntersections: i,
    droppedIntersections: a,
    droppedFraction: c === 0 ? 0 : a / c,
    affectedTiles: o,
    totalBatches: n,
    maxBatches: l
  };
}
function ta(r) {
  const e = Math.floor(r.length / 2);
  return r.length % 2 !== 0 ? r[e] : (r[e - 1] + r[e]) * 0.5;
}
function Ns(r, e) {
  const t = Math.max(0, Math.ceil(r.length * e) - 1);
  return r[t];
}
class sa {
  constructor(e, t, s, i, a, o) {
    this.renderer = e, this.frame = a, this.maxRasterizedSplatsPerTile = o, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      t
    );
    const n = B(Zi);
    this.computeNode = n({
      index: J,
      gaussian_count: g(t),
      viewport: Xe(a.viewport.xy),
      projected_mean: m(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: m(
        i,
        "vec4",
        i.count
      ).toReadOnly(),
      zero_pixel_flags: m(this.zeroPixelFlags, "uint", t)
    }).compute(t, [Qi]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  frame;
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
    ]), i = new Uint32Array(s);
    let a = 0;
    for (const n of i) a += n;
    const o = new Uint32Array(t);
    return {
      tileLoads: ea(o, this.frame.tileSize ** 2),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : Ls(
        o,
        this.maxRasterizedSplatsPerTile,
        this.frame.tileSize ** 2
      ),
      tileCapEstimates: Ji.map(
        (n) => Ls(o, n, this.frame.tileSize ** 2)
      ),
      zeroPixelSubpixelSplats: a
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function ra(r) {
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
  partials: ptr<workgroup, array<u32, ${P * ae}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${P}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${ie}u; item++) {
      let position = block_start + item * ${_}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${r}u) & ${P - 1}u) == digit);
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
const ia = (
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
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${X}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${ie}u; item++) {
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
), aa = (
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
), na = (
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
  for (var item = 0u; item < ${ie}u; item++) {
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
    for (var item = 0u; item < ${ie}u; item++) {
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
    for (var item = 0u; item < ${ie}u; item++) {
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
  for (var item = 0u; item < ${ie}u; item++) {
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
function oa(r) {
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
  block_bases: ptr<workgroup, array<u32, ${P}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${P}>>,
  partials: ptr<workgroup, array<u32, ${P * ae}>>
) -> u32 {
  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  let subgroup_count = (${_}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${P}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${_}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${r}u) & ${P - 1}u;
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
function la(r) {
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
  histogram: ptr<workgroup, array<atomic<u32>, ${P}>>
) -> u32 {
  if (lane < ${P}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${ue}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${_}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${r}u) & ${P - 1}u;
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
const ca = (
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
  for (var item = 0u; item < ${ie}u; item++) {
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
function ua(r) {
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

  for (var item = 0u; item < ${ie}u; item++) {
    let position = block_start + item * ${_}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${P}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${r}u) & ${P - 1}u;
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
class Ps {
  constructor(e, t, s, i, a, o) {
    this.renderer = e, this.label = t, this.capacity = s, this.buffers = i, this.dispatch = a, this.backend = o, this.maxRadixBlocks = Math.ceil(s / ue), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / X), this.blockHistograms = this.attributes.createUint(
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
    ).toReadOnly(), c = B(
      o === "subgroup" ? ia : ca
    ), u = {
      lane: we,
      group_id: Y,
      block_stride: g(this.maxRadixBlocks),
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      block_histograms: l,
      reduced: m(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (u.subgroup_index = gt, u.subgroup_lane = mt, u.subgroup_size = bt, u.partials = j("uint", ae)) : u.scratch = j("uint", _), this.reduceNode = c(u).computeKernel([_]).setName(`3DGS ${t} radix reduce WGSL`);
    const h = B(aa);
    this.scanReducedNode = h({
      chunk_stride: g(this.maxReduceChunks),
      state: n,
      reduced: m(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${t} radix global scan WGSL`);
    const d = B(
      na
    );
    this.scanAddNode = d({
      lane: we,
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
      scratch: j("uint", X)
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
    const t = Math.ceil(Math.max(0, e) / Nt);
    this.passes = Array.from(
      { length: t },
      (s, i) => this.createPass(i, i * Nt)
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
    const s = e % 2 === 0, i = s ? this.buffers.recordsA : this.buffers.recordsB, a = s ? this.buffers.recordsB : this.buffers.recordsA, o = m(this.dispatch.state, "uvec4", 1).toReadOnly(), n = m(
      i,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = B(
      this.backend === "subgroup" ? ra(t) : la(t)
    ), c = {
      lane: we,
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
    this.backend === "subgroup" ? (c.subgroup_index = gt, c.subgroup_lane = mt, c.subgroup_size = bt, c.partials = j(
      "uint",
      P * ae
    )) : c.histogram = j("atomic<u32>", P);
    const u = l(c).computeKernel([_]).setName(`3DGS ${this.label} radix histogram WGSL ${e}`), h = B(
      this.backend === "subgroup" ? oa(t) : ua(t)
    ), d = {
      lane: we,
      block_index: Y.x,
      block_stride: g(this.maxRadixBlocks),
      state: o,
      records_in: n,
      records_out: m(a, "uvec2", this.capacity),
      block_prefixes: m(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: j("uint", P),
      local_digit_counts: j("uint", P)
    };
    this.backend === "subgroup" ? (d.subgroup_index = gt, d.subgroup_lane = mt, d.subgroup_size = bt, d.partials = j(
      "uint",
      P * ae
    )) : (d.shared_digits = j("uint", _), d.shared_digit_masks = j(
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
const da = (
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
function ha(r) {
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
const pa = (
  /* wgsl */
  `
fn suffix_min_blocks(
  lane: u32,
  group_id: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_mins: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${E}>>
) -> u32 {
  let base = group_id * ${E}u;
  let first_local = lane;
  let second_local = lane + ${_}u;
  let first_source = base + (${E - 1}u - first_local);
  let second_source = base + (${E - 1}u - second_local);
  var first_value = 0xffffffffu;
  var second_value = 0xffffffffu;
  if (first_source < length) { first_value = (*values)[first_source]; }
  if (second_source < length) { second_value = (*values)[second_source]; }
  (*scratch)[first_local] = first_value;
  (*scratch)[second_local] = second_value;
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${E / 2}u;
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
    (*block_mins)[group_id] = (*scratch)[${E - 1}u];
    (*scratch)[${E - 1}u] = 0xffffffffu;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${E / 2}u;
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
), fa = (
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
    let next_block = index / ${E}u + 1u;
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
class ga {
  attributes = new de();
  levels = [];
  constructor(e, t) {
    const s = B(pa), i = B(fa);
    let a = e, o = t;
    for (; ; ) {
      const n = this.levels.length, l = Math.ceil(o / E), c = this.attributes.createUint(
        `3dgs.tile-offset-mins-${n}`,
        l
      ), u = s({
        lane: we,
        group_id: Y.x,
        length: g(o),
        values: m(a, "uint", o),
        block_mins: m(c, "uint", l),
        scratch: j("uint", E)
      }).computeKernel([_]).setName(`3DGS tile offset suffix scan WGSL ${n}`);
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
      l.addNode = i({
        index: J,
        length: g(l.length),
        block_count: g(c.length),
        values: m(l.values, "uint", l.length),
        block_suffix_mins: m(
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
class ma {
  constructor(e, t, s, i, a) {
    this.renderer = e, this.dispatch = a, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = m(this.offsets, "uint", s + 1), n = B(da);
    this.clearNode = n({
      index: J,
      tile_count: g(s),
      state: m(a.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [_]).setName("3DGS clear tile offsets WGSL");
    const l = B(
      ha(t)
    );
    this.boundariesNode = l({
      index: J,
      tile_count: g(s),
      state: m(a.state, "uvec4", 1).toReadOnly(),
      records: m(
        i,
        "uvec2",
        i.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([_]).setName(`3DGS find tile boundaries WGSL (${t})`), this.suffixMin = new ga(this.offsets, s + 1);
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
const Rs = (
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
);
function ba(r = _) {
  return (
    /* wgsl */
    `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${r}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
  );
}
function va(r) {
  return (
    /* wgsl */
    `
fn raster_block_mask(center: vec2<f32>, conic: vec3<f32>, threshold: f32, origin: vec2<f32>) -> u32 {
  let a = conic.x;
  let b = conic.y;
  let c = conic.z;
  let determinant = a * c - b * b;
  if (!(a > 0.0 && c > 0.0 && determinant > 1e-5 * a * c)) { return 65535u; }
  var mask = 0u;
  for (var by = 0u; by < ${r / 4}u; by++) {
    for (var bx = 0u; bx < ${r / 4}u; bx++) {
      let lo = origin + vec2<f32>(f32(bx), f32(by)) * 4.0 - center;
      let hi = lo + vec2<f32>(4.0);
      var minimum = 0.0;
      if (!(lo.x <= 0.0 && hi.x >= 0.0 && lo.y <= 0.0 && hi.y >= 0.0)) {
        minimum = 3.402823e38;
        for (var edge = 0u; edge < 4u; edge++) {
          var p: vec2<f32>;
          if (edge < 2u) {
            let x = select(lo.x, hi.x, edge == 1u);
            p = vec2<f32>(x, clamp(-b * x / c, lo.y, hi.y));
          } else {
            let y = select(lo.y, hi.y, edge == 3u);
            p = vec2<f32>(clamp(-b * y / a, lo.x, hi.x), y);
          }
          // Use the same evaluation order as raster power, with a conservative margin.
          let q = 0.5 * (a * p.x * p.x + 2.0 * b * p.x * p.y + c * p.y * p.y);
          minimum = min(minimum, q);
        }
      }
      let magnitude = max(abs(lo), abs(hi));
      let rounding = 1e-4 * (1.0 + abs(threshold) + a * magnitude.x * magnitude.x + 2.0 * abs(b) * magnitude.x * magnitude.y + c * magnitude.y * magnitude.y);
      if (!(minimum > threshold + rounding)) {
        mask |= 1u << (by * ${r / 4}u + bx);
      }
    }
  }
  return mask;
}
`
  );
}
class xa {
  constructor(e, t, s, i, a, o, n, l, c, u, h, d, f, b, x, p, v, k = !1, L = 1e-4, N = !1) {
    this.renderer = e, this.gaussianCount = t, this.intersectionCapacity = s, this.mode = i, this.meansAttribute = a, this.projectedMeanAttribute = o, this.projectedConicAttribute = n, this.projectedColorAttribute = l, this.sortedRecordsAttribute = c, this.tileOffsetsAttribute = u, this.colorTexture = h, this.depthTexture = d, this.frame = f, this.maxSplatsPerTile = b, this.rasterChunkSize = x, this.tileCount = p, this.transmittanceThreshold = L, this.rasterBlockMask = N, this.metrics = k ? this.attributes.createUint("3dgs.raster-work", p * 4) : null;
    const y = this.metrics === null ? null : m(this.metrics, "uint", p * 4).toAtomic();
    this.clearMetrics = y === null ? null : rt(() => {
      Tr(y.element(J), g(0));
    })().compute(p * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(v);
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
  rasterBlockMask;
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
      Fs(a, es, "raster");
    Ne(
      e.rasterPixelValueNode,
      Ws,
      "rasterPixelValueNode"
    ), Ne(
      e.rasterBreakNode,
      ei,
      "rasterBreakNode"
    );
    const t = this.createRasterNode(e, "direct"), s = this.chunks === null ? null : this.createRasterNode(e, "chunk"), i = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = t, this.chunkComputeNode = s, this.compositeNode = i;
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
    const e = Js(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), t = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Pt(
      t,
      this.tileCount,
      "raster-chunks"
    ), i = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      e,
      2
    ), a = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), o = e * this.frame.tileSize ** 2, n = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
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
    ).toReadOnly(), b = B(Ri)({
      tile: J,
      tile_count: g(this.tileCount),
      chunk_size: g(this.rasterChunkSize),
      sample_limit: g(this.maxSplatsPerTile ?? 0),
      tile_offsets: c,
      chunk_counts: u
    }).compute(this.tileCount, [_]).setName("3DGS count exact raster chunks WGSL"), p = B(
      Gi
    )({
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      dispatch: m(a, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), k = B(Mi)({
      tile: J,
      tile_count: g(this.tileCount),
      task_capacity: g(e),
      chunk_counts: h,
      chunk_offsets: d,
      tasks: m(i, "uvec2", e)
    }).compute(this.tileCount, [_]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: t,
      offsets: s,
      tasks: i,
      dispatch: a,
      partialData: l,
      partialStride: n,
      countNode: b,
      prepareNode: p,
      emitNode: k
    };
  }
  createRasterNode(e, t) {
    const s = this.frame.tileSize, i = s * s, a = this.rasterBlockMask ? B(va(s)) : null, o = this.rasterBlockMask ? j("uint", i) : null, n = this.metrics === null ? null : m(this.metrics, "uint", this.tileCount * 4).toAtomic(), l = m(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), c = m(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), u = m(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), h = m(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), d = m(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), f = m(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), b = j("vec4", i), x = j("vec4", i), p = j("vec4", i), v = j("uint", i), k = j("uint", i), L = j("uint", i / 32), N = t === "direct" ? Lt(this.colorTexture) : null, y = B(Rs), R = B(ba(i)), G = this.chunks, A = t === "chunk" && G !== null ? m(G.tasks, "uvec2", G.tasks.count).toReadOnly() : null, w = t === "chunk" && G !== null ? m(G.partialData, "vec4", G.partialData.count) : null, { frame: M } = this;
    return rt(() => {
      const C = g(we), $ = y({ value: C }), z = y({ value: C.shiftRight(1) }), F = g(Y.x), ne = (t === "direct" ? Y.y.mul(M.tilesX).add(Y.x) : A.element(F).x).toVar("rasterTile"), q = t === "chunk" ? A.element(F).y : g(0), oe = t === "direct" ? Y.x : ne.mod(M.tilesX), be = t === "direct" ? Y.y : ne.div(M.tilesX), ke = Xe(
        oe.mul(g(s)).add($),
        be.mul(g(s)).add(z)
      ).toVar("rasterPixelCoordinateValue"), Pe = ke.x.lessThan(g(M.viewport.x)).and(ke.y.lessThan(g(M.viewport.y))).toVar("rasterActivePixel"), le = f.element(ne), he = f.element(ne.add(1)), pe = g(he.sub(le)), ee = pe.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const O = g(this.maxSplatsPerTile);
        ee.assign(ye(pe.lessThan(O), pe, O));
      }
      let Re = g(0);
      const te = ee.toVar("rasterSampleEnd");
      if (t === "direct" && this.rasterChunkSize !== null)
        te.assign(
          ye(
            ee.greaterThan(g(this.rasterChunkSize)),
            g(0),
            ee
          )
        );
      else if (t === "chunk") {
        Re = q.mul(g(this.rasterChunkSize)).toVar("rasterSampleStart");
        const O = Re.add(g(this.rasterChunkSize));
        te.assign(
          ye(O.lessThan(ee), O, ee)
        );
      }
      const Oe = me(ke).add(0.5), fe = /* @__PURE__ */ new Map([
        [Ft, () => ke],
        [Vt, () => Oe],
        [qt, () => Oe.div(M.viewport.xy)]
      ]), $e = W(0).toVar("rasterPixelValue");
      T(Pe, () => {
        $e.assign(
          Fe(e.rasterPixelValueNode, fe)
        );
      });
      const Se = it(0).toVar("accumulated"), se = W(1).toVar("transmittance"), Ge = W(1).toVar("depth"), Ee = ce(!1).toVar("depthWritten"), ve = ce(!1).toVar("done"), Me = n === null ? null : g(0).toVar("rasterChecked"), De = n === null ? null : g(0).toVar("rasterBlended");
      Ue(
        {
          start: Re,
          end: te,
          type: "uint",
          condition: "<",
          update: `+= ${i}`
        },
        ({ i: O }) => {
          const xe = O.add(C);
          T(xe.lessThan(te), () => {
            let D = xe;
            this.maxSplatsPerTile !== null && (D = g(
              Ct(
                W(xe).add(0.5).mul(W(pe)).div(W(ee))
              )
            ));
            const H = le.add(D).toVar("rasterSourceRecordIndex"), Q = d.element(H).y, V = c.element(Q), K = u.element(Q);
            b.element(C).assign(V), x.element(C).assign(Z(K.xyz, V.w.mul(255).log())), p.element(C).assign(h.element(Q)), v.element(C).assign(Q), a !== null && o.element(C).assign(
              a({
                center: V.xy,
                conic: K.xyz,
                threshold: V.w.mul(255).log(),
                origin: me(oe, be).mul(s)
              })
            );
          }), T(C.equal(0), () => {
            k.element(g(0)).assign(
              ye(
                O.add(g(i)).lessThan(te),
                g(1),
                g(0)
              )
            );
          });
          const Ze = R({ values: k }).toVar("hasNextBatch"), Qe = g(te.sub(O)), ut = ye(
            Qe.lessThan(g(i)),
            Qe,
            g(i)
          );
          T(Pe.and(ve.not()), () => {
            Ue(
              {
                start: g(0),
                end: ut,
                type: "uint",
                condition: "<"
              },
              ({ i: D }) => {
                Me?.addAssign(1);
                const H = b.element(D), Q = v.element(D), V = Oe.sub(H.xy), K = new Map(fe);
                K.set(Kt, () => $e), K.set(ct, () => Q), K.set(
                  Wt,
                  () => g(l.element(Q).w)
                ), K.set(Yt, () => H.xy), K.set(Xt, () => V), K.set(Ht, () => H.z);
                const nr = Fe(
                  e.rasterBreakNode,
                  K
                );
                if (T(nr, () => {
                  ve.assign(ce(!0)), We();
                }), o !== null) {
                  const ur = g(z).shiftRight(g(2)).mul(g(s / 4)).add(g($).shiftRight(g(2)));
                  T(
                    o.element(D).bitAnd(g(1).shiftLeft(ur)).equal(0),
                    () => {
                      et();
                    }
                  );
                }
                const rs = x.element(D), Ie = rs.xyz, Je = Ie.x.mul(V.x.mul(V.x)).add(Ie.y.mul(2).mul(V.x).mul(V.y)).add(Ie.z.mul(V.y.mul(V.y))).mul(-0.5);
                T(
                  Je.greaterThan(0).or(Je.lessThan(rs.w.negate())),
                  () => {
                    et();
                  }
                );
                const is = Le(ps(Ie.x, 1e-12)), ht = Ie.y.div(is), or = Le(ps(Ie.z.sub(ht.mul(ht)), 1e-12)), as = me(
                  is.mul(V.x).add(ht.mul(V.y)),
                  or.mul(V.y)
                ), pt = new Map([
                  ...K,
                  [Ds, () => as],
                  [js, () => as.div(6).add(0.5)],
                  [
                    Zt,
                    () => p.element(D).xyz
                  ],
                  [Qt, () => H.w],
                  [Jt, () => Je],
                  [Us, () => Bs(Je)]
                ]), lr = Fe(e.rasterDiscardNode, pt);
                T(lr, () => {
                  et();
                });
                const ft = _e(
                  Fe(e.rasterAlphaNode, pt),
                  0,
                  0.99
                );
                T(ft.lessThan(W(1 / 255)), () => {
                  et();
                }), T(Ee.not(), () => {
                  Ge.assign(ya(H.z, M)), Ee.assign(ce(!0));
                });
                const cr = Fe(e.rasterColorNode, pt);
                Se.addAssign(cr.mul(se).mul(ft)), De?.addAssign(1), se.mulAssign(W(1).sub(ft)), T(se.lessThan(this.transmittanceThreshold), () => {
                  ve.assign(ce(!0)), We();
                });
              }
            );
          }), T(Ze.equal(0), () => {
            We();
          }), k.element(C).assign(ye(Pe.and(ve.not()), g(1), g(0))), fs(), T(C.lessThan(i / 32), () => {
            const D = C.mul(32), H = g(0).toVar("subgroupActive");
            Ue(
              { start: g(0), end: g(32), type: "uint", condition: "<" },
              ({ i: Q }) => {
                H.bitOrAssign(
                  k.element(D.add(Q))
                );
              }
            ), L.element(C).assign(H);
          }), fs(), T(C.equal(0), () => {
            const D = g(0).toVar("tileActiveReduction");
            Ue(
              {
                start: g(0),
                end: g(i / 32),
                type: "uint",
                condition: "<"
              },
              ({ i: H }) => {
                D.bitOrAssign(L.element(g(H)));
              }
            ), k.element(g(0)).assign(D);
          });
          const dt = R({ values: k });
          T(dt.equal(0), () => {
            We();
          });
        }
      ), T(Pe, () => {
        if (n !== null) {
          const O = ne.mul(4);
          Te(n.element(O), Me), Te(n.element(O.add(1)), De), t === "direct" && T(pe.greaterThan(0).and(te.greaterThan(0)), () => {
            Te(n.element(O.add(2)), g(1)), Te(
              n.element(O.add(3)),
              ye(
                se.lessThan(this.transmittanceThreshold),
                g(1),
                g(0)
              )
            );
          });
        }
        if (t === "direct")
          Gs(
            Se,
            se,
            Ge,
            ke,
            N,
            this.depthTexture,
            M
          );
        else {
          const O = F.mul(g(i)).add(C).mul(g(G.partialStride));
          w.element(O).assign(Z(Se, se)), this.depthTexture !== null && w.element(O.add(1)).assign(Z(Ge, 0, 0, 0));
        }
      });
    })().computeKernel([s, s]).setName(
      t === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const e = this.frame.tileSize, t = this.metrics === null ? null : m(this.metrics, "uint", this.tileCount * 4).toAtomic(), s = this.chunks, i = m(
      s.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), a = m(
      s.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), o = m(
      s.partialData,
      "vec4",
      s.partialData.count
    ).toReadOnly(), n = Lt(this.colorTexture), l = B(Rs), { frame: c } = this;
    return rt(() => {
      const h = g(we), d = l({ value: h }), f = l({ value: h.shiftRight(1) }), b = Y.y.mul(c.tilesX).add(Y.x), x = i.element(b), p = Xe(
        Y.x.mul(g(e)).add(d),
        Y.y.mul(g(e)).add(f)
      ), v = p.x.lessThan(g(c.viewport.x)).and(p.y.lessThan(g(c.viewport.y)));
      T(v.and(x.greaterThan(0)), () => {
        const k = it(0).toVar("chunkCompositeColor"), L = W(1).toVar("chunkCompositeTransmittance"), N = W(1).toVar("chunkCompositeDepth"), y = ce(!1).toVar("chunkCompositeDepthWritten"), R = a.element(b);
        Ue(
          {
            start: g(0),
            end: x,
            type: "uint",
            condition: "<"
          },
          ({ i: G }) => {
            const A = R.add(G).mul(g(e * e)).add(h).mul(g(s.partialStride)), w = o.element(A);
            k.addAssign(w.xyz.mul(L)), this.depthTexture !== null && T(y.not().and(w.w.lessThan(1)), () => {
              N.assign(o.element(A.add(1)).x), y.assign(ce(!0));
            }), L.mulAssign(w.w), T(L.lessThan(this.transmittanceThreshold), () => {
              We();
            });
          }
        ), Gs(
          k,
          L,
          N,
          p,
          n,
          this.depthTexture,
          c
        ), t !== null && (Te(t.element(b.mul(4).add(2)), g(1)), Te(
          t.element(b.mul(4).add(3)),
          ye(
            L.lessThan(this.transmittanceThreshold),
            g(1),
            g(0)
          )
        ));
      });
    })().computeKernel([e, e]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const e = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let t = 0, s = 0, i = 0, a = 0;
    for (let o = 0; o < e.length; o += 4)
      t += e[o], s += e[o + 1], i += e[o + 2], a += e[o + 3];
    return { checked: t, blended: s, pixels: i, alphaStopped: a };
  }
}
function ya(r, e) {
  const t = r.negate();
  return _e(
    e.viewport.z.add(t).mul(e.viewport.w).div(e.viewport.w.sub(e.viewport.z).mul(t)),
    0,
    1
  );
}
function Gs(r, e, t, s, i, a, o) {
  const n = _e(W(o.background[3]), 0, 1);
  r.addAssign(
    it(o.background[0], o.background[1], o.background[2]).mul(e).mul(n)
  );
  const l = W(1).sub(e.mul(W(1).sub(n)));
  gs(i, Ke(s), Z(r, l)), a !== null && gs(
    Lt(a),
    Ke(s),
    Z(t, 0, 0, 1)
  );
}
function Fe(r, e) {
  return r.context({ overrideNodes: e });
}
class _a {
  constructor(e, t, s, i, a, o) {
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
      i,
      "uint",
      s
    ).toReadOnly(), l = B(
      Ti
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
    const c = B(
      Bi(t)
    );
    this.compactNode = c({
      gid: J,
      gaussian_count: g(s),
      viewport: o,
      visible_offsets: n,
      projected_mean: m(
        a,
        "vec4",
        s
      ).toReadOnly(),
      records: m(this.buffers.recordsA, "uvec2", s)
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
class wa {
  constructor(e, t, s, i, a, o, n, l, c, u, h, d, f, b, x = 1e-4, p = 16, v = !1) {
    this.renderer = e, this.data = s, this.mode = a, this.capacity = n, this.profileKernels = c, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = d, this.radixBackend = f, this.nodes = b, this.rasterTransmittanceThreshold = x, this.rasterBlockMask = v, this.frame = new Di(t, l, p), this.objects = new Wi(t, i, s.count), this.projection = new Hi(
      s,
      this.frame,
      this.objects,
      o,
      b,
      d
    ), this.profileDiagnostics = c ? new sa(
      e,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new Pt(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new _a(
      e,
      a,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Ps(
      e,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      f
    ), this.depthSorter.configure(a === "float32" ? 32 : 16), this.orderedTiles = new zi(
      e,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Pt(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new Ui(
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
    ), this.sorter = new Ps(
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
  rasterBlockMask;
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
    const a = Math.ceil(e / this.frame.tileSize), o = Math.ceil(t / this.frame.tileSize), n = a * o;
    if (a > 65535 || o > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, n + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new ma(
      this.renderer,
      this.mode,
      n,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new xa(
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
      this.rasterBlockMask
    ), this.width = e, this.height = t, this.tilesX = a, this.tilesY = o, this.frame.update(e, t, a, o), this.tileStageRebuilds++;
  }
}
function ka(r, e) {
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
const St = new Rr();
class Sa extends ns {
  gaussianStore;
  depthSortMode;
  antialiasMode;
  background;
  outputDepth;
  colorSpace;
  profileKernels;
  tileSize;
  rasterBlockMask;
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
  nodeSlots = Jr();
  dirtyStages = 0;
  disposed = !1;
  constructor(e, t, s, i = {}) {
    super(ns.COLOR, new Ts(), t, {
      type: os,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const a = i.depthSortMode ?? "float32", o = i.antialiasMode ?? "compensated", n = i.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    const l = ka(
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
    const h = i.rasterChunkSize === void 0 ? Pi : i.rasterChunkSize;
    if (Ii(
      h,
      c ?? _ * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = e, this.gaussianStore = s, this.depthSortMode = a, this.antialiasMode = o, this.requestedIntersectionCapacity = c, this.background = i.background ?? [0, 0, 0, 0], this.outputDepth = i.outputDepth ?? !1, this.colorSpace = i.colorSpace ?? Sr, this.profileKernels = i.profileKernels ?? !1, this.tileSize = i.tileSize ?? 16, this.tileSize !== 8 && this.tileSize !== 16)
      throw new RangeError("tileSize must be 8 or 16");
    if (this.rasterBlockMask = i.rasterBlockMask ?? !1, this.rasterTransmittanceThreshold = i.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = h, this.subpixelSampleCulling = i.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new ls(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = os, this.colorTexture.colorSpace = Cr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new ls(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = Lr, this.depthTexture.type = Nr, this.depthTexture.minFilter = cs, this.depthTexture.magFilter = cs, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    return this.workingColorNode ??= Br(
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
    if (!(this.camera instanceof Pr))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    t.getDrawingBufferSize(St);
    const s = Math.max(1, Math.floor(St.x)), i = Math.max(1, Math.floor(St.y));
    (this.renderTarget.width !== s || this.renderTarget.height !== i) && this.setSize(s, i), this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: Ca(t) });
    const a = this.gaussianStore.updateLod(this.camera), o = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      _ * 65535,
      Math.max(1, o.count * 16)
    )), t.initRenderTarget(this.renderTarget), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), o.count > _ * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new wa(
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
        this.tileSize,
        this.rasterBlockMask
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
        lod: a
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
function Ms(r, e) {
  if (r?.isNode !== !0)
    throw new TypeError(`GaussianPass.${e} must be a Three.js Node`);
}
function Ca(r) {
  const e = r.backend;
  if (e.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return e.device.limits;
}
function Oa(r, e, t, s) {
  return new Sa(r, e, t, s);
}
export {
  $r as CanonicalGaussianPlyLoader,
  Ba as DistanceAwareRadialLodPackingStrategy,
  Ar as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  vs as GaussianCloud,
  As as GaussianData,
  It as GaussianLod,
  Ma as GaussianLodColorHelper,
  xs as GaussianLodNode,
  Mt as GaussianOctree,
  Fr as GaussianOctreeNode,
  Sa as GaussianPass,
  za as GaussianStore,
  vi as GaussianStoreAttributes,
  bi as GaussianStorePackedAttribute,
  Ga as LodHelper,
  Ia as MaximumLodPackingStrategy,
  Ra as OctreeHelper,
  zs as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Ta as RadialLodPackingStrategy,
  ui as RadialLodWorkerPlanner,
  mi as RemainingCapacityBudgetStrategy,
  Aa as SourceFractionBudgetStrategy,
  qs as StreamingLodPackingStrategy,
  ri as TieredRadialLodPackingStrategy,
  At as gaussianColor,
  Tt as gaussianIndex,
  Bt as gaussianObjectId,
  zt as gaussianObjectMatrix,
  Ot as gaussianObjectVisible,
  lt as gaussianOpacity,
  Oa as gaussianPass,
  at as gaussianPositionLocal,
  He as gaussianPositionWorld,
  Ut as gaussianProjectedArea,
  jt as gaussianProjectedSigma,
  ot as gaussianRotation,
  nt as gaussianScale,
  Es as gaussianScreenBoundsMax,
  $s as gaussianScreenBoundsMin,
  Dt as gaussianScreenPosition,
  Et as gaussianViewDepth,
  $t as gaussianViewDirection,
  _s as isStreamingLodPackingStrategy,
  zr as packShRgb8e8,
  Yt as rasterGaussianCenter,
  Zt as rasterGaussianColor,
  Ds as rasterGaussianCoord,
  ct as rasterGaussianIndex,
  Qt as rasterGaussianOpacity,
  Wt as rasterObjectId,
  Ft as rasterPixelCoordinate,
  Xt as rasterPixelDelta,
  Kt as rasterPixelValue,
  Jt as rasterPower,
  Vt as rasterScreenPosition,
  qt as rasterScreenUV,
  js as rasterUV,
  Ht as rasterViewDepth,
  Us as rasterWeight,
  Os as shBytesPerCoefficient,
  Pa as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
