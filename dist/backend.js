import { Vector3 as I, Box3 as D, Matrix4 as j } from "three";
function q(l, e, t) {
  const s = Math.max(Math.abs(l), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const r = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), o = 127 / 2 ** r, i = G(l, o), n = G(e, o), a = G(t, o), d = r + 127;
  return (i | n << 8 | a << 16 | d << 24) >>> 0;
}
function G(l, e) {
  return Math.min(127, Math.max(-127, Math.round(l * e))) & 255;
}
function N(l) {
  if (!Number.isInteger(l) || l < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
function F(l, e, t) {
  return l.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), l.getWorldPosition(t), e.worldToLocal(t);
}
function T(l, e) {
  const t = e instanceof I ? e.clone() : l.octree.bounds.getCenter(new I()), s = l.octree.rootBounds.getSize(new I()), r = Math.max(s.length() * 0.5, Number.EPSILON), o = new I(), i = Array.from(l.octree.leafNodeIds, (n) => (l.octree.nodes[n].bounds.getCenter(o), {
    nodeId: n,
    radius: o.distanceTo(t) / r
  }));
  return i.sort(
    (n, a) => n.radius - a.radius || n.nodeId - a.nodeId
  ), i;
}
class H {
  cameraCenter = new I();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof I ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof I ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      F(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return W();
    const s = T(e, this.center), r = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let o = s.reduce(
      (n, a, d) => n + e.nodes[a.nodeId].levelCounts[r[d]],
      0
    );
    for (let n = s.length - 1; n >= 0 && o > t; n--) {
      const a = e.nodes[s[n].nodeId];
      for (; r[n] > 0 && o > t; ) {
        const d = a.levelCounts[r[n]];
        r[n] = r[n] - 1, o -= d - a.levelCounts[r[n]];
      }
    }
    let i = s.length;
    for (; i > 0 && o > t; ) {
      i--;
      const n = e.nodes[s[i].nodeId];
      o -= n.levelCounts[r[i]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, i).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(r.slice(0, i)),
      gaussianCount: o
    };
  }
}
function W() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class J {
  setFromCamera(e, t) {
    return this;
  }
  pack({ lod: e, maxGaussians: t }) {
    N(t);
    const s = e.octree.data.count;
    if (t < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${t}`
      );
    const r = e.octree.leafNodeIds.slice(), o = new Uint8Array(r.length);
    return o.fill(e.finestLevel), { nodeIds: r, lodLevels: o, gaussianCount: s };
  }
}
class Q {
  cameraCenter = new I();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof I ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof I ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      F(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return X();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const r = T(e, this.center), o = [];
    let i = 0;
    for (const a of r) {
      const d = e.nodes[a.nodeId].levelCounts[s];
      if (i + d > t) break;
      o.push(a.nodeId), i += d;
    }
    const n = new Uint8Array(o.length);
    return n.fill(s), {
      nodeIds: Uint32Array.from(o),
      lodLevels: n,
      gaussianCount: i
    };
  }
}
function X() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Z {
  cameraCenter = new I();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof I ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = K(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof I ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      F(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return ee();
    const s = e.octree.data.count;
    if (s <= t) {
      const f = e.octree.leafNodeIds.slice(), u = new Uint8Array(f.length);
      return u.fill(e.finestLevel), { nodeIds: f, lodLevels: u, gaussianCount: s };
    }
    const r = T(e, this.center), o = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], i = [], n = [];
    let a = 0, d = 0, h = 0;
    for (let f = 0; f < o.length; f++) {
      const u = this.budgetShares[f];
      if (h += u, u === 0) continue;
      const w = f === o.length - 1 ? t : Math.floor(t * h), g = o[f];
      for (; d < r.length; ) {
        const m = r[d], c = e.nodes[m.nodeId].levelCounts[g];
        if (a + c > w) break;
        i.push(m.nodeId), n.push(g), a += c, d++;
      }
    }
    return {
      nodeIds: Uint32Array.from(i),
      lodLevels: Uint8Array.from(n),
      gaussianCount: a
    };
  }
}
function K(l) {
  let e = 0;
  for (const t of l) {
    if (!(t >= 0 && t <= 1))
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    e += t;
  }
  if (Math.abs(e - 1) > 1e-6)
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  return Object.freeze([...l]);
}
function ee() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class te {
  constructor(e, t, s, r, o, i) {
    this.count = e, this.shDegree = t, this.shCoefficientCount = (t + 1) ** 2, this.means = { array: s }, this.scalesOpacity = { array: r }, this.rotations = { array: o }, this.shCoefficients = { array: i };
  }
  count;
  shDegree;
  shCoefficientCount;
  shFormat = "float32";
  means;
  scalesOpacity;
  rotations;
  shCoefficients;
  dispose() {
  }
}
const z = {
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
}, se = [
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
class ne {
  async load(e) {
    const t = await fetch(e);
    if (!t.ok)
      throw new Error(
        `Failed to load PLY: ${t.status} ${t.statusText}`
      );
    if (t.headers.get("content-type")?.includes("text/html"))
      throw new Error(
        `Failed to load PLY: ${t.url || e} returned HTML instead of a PLY file`
      );
    return this.parse(await t.arrayBuffer());
  }
  parse(e) {
    const t = re(e), s = new Map(
      t.properties.map((c, y) => [c.name, y])
    );
    for (const c of se)
      if (!s.has(c))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${c}`);
    const r = t.properties.map((c) => c.name.match(/^f_rest_(\d+)$/)?.[1]).filter((c) => c !== void 0).map(Number).sort((c, y) => c - y);
    for (let c = 0; c < r.length; c++)
      if (r[c] !== c)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const o = r.length / 3, i = o + 1, n = Math.sqrt(i);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const a = oe(e, t), d = (c) => s.get(c), h = r.map(
      (c) => d(`f_rest_${c}`)
    ), f = t.vertexCount, u = new Float32Array(f * 4), w = new Float32Array(f * 4), g = new Float32Array(f * 4), m = new Float32Array(f * i * 4);
    for (let c = 0; c < f; c++) {
      const y = c * 4;
      u[y] = a(c, d("x")), u[y + 1] = a(c, d("y")), u[y + 2] = a(c, d("z")), w[y] = Math.max(
        Math.exp(a(c, d("scale_0"))),
        1e-6
      ), w[y + 1] = Math.max(
        Math.exp(a(c, d("scale_1"))),
        1e-6
      ), w[y + 2] = Math.max(
        Math.exp(a(c, d("scale_2"))),
        1e-6
      );
      const C = a(c, d("opacity"));
      w[y + 3] = 1 / (1 + Math.exp(-C));
      const x = a(c, d("rot_0")), p = a(c, d("rot_1")), b = a(c, d("rot_2")), v = a(c, d("rot_3")), L = Math.hypot(p, b, v, x);
      L > 1e-12 ? (g[y] = p / L, g[y + 1] = b / L, g[y + 2] = v / L, g[y + 3] = x / L) : g[y + 3] = 1;
      const E = c * i * 4;
      m[E] = a(c, d("f_dc_0")), m[E + 1] = a(c, d("f_dc_1")), m[E + 2] = a(c, d("f_dc_2"));
      for (let P = 1; P < i; P++) {
        const R = E + P * 4, M = P - 1;
        for (let S = 0; S < 3; S++) {
          const k = h[S * o + M];
          m[R + S] = a(
            c,
            k
          );
        }
      }
    }
    return new te(
      f,
      n - 1,
      u,
      w,
      g,
      m
    );
  }
}
function re(l) {
  const e = new Uint8Array(l), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let g = 0; g <= e.length - t.length; g++) {
    let m = !0;
    for (let c = 0; c < t.length; c++)
      if (e[g + c] !== t[c]) {
        m = !1;
        break;
      }
    if (m) {
      s = g;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let r = s + t.length;
  if (e[r] === 13 && r++, e[r] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  r++;
  const i = new TextDecoder().decode(e.subarray(0, r)).split(/\r?\n/);
  if (i[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let n = null, a = "", d = -1, h = 0;
  const f = [], u = [];
  for (const g of i) {
    const m = g.trim().split(/\s+/);
    if (m[0] === "format") {
      if (m[1] !== "ascii" && m[1] !== "binary_little_endian" && m[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${m[1] ?? "unknown"}`);
      n = m[1];
    } else if (m[0] === "element") {
      a = m[1] ?? "";
      const c = Number(m[2]);
      if (!Number.isInteger(c) || c < 0)
        throw new Error(`Invalid element count for ${a}`);
      u.push({ name: a, count: c }), a === "vertex" && (d = c);
    } else if (m[0] === "property" && a === "vertex") {
      if (m[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const c = m[1], y = m[2];
      if (!(c in z) || y === void 0)
        throw new Error(`Unsupported vertex property: ${g}`);
      f.push({ name: y, type: c, byteOffset: h }), h += z[c];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (d <= 0) throw new Error("PLY must contain at least one vertex");
  if (u.find(
    (g) => g.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: d, properties: f, vertexStride: h, dataOffset: r };
}
function oe(l, e) {
  if (e.format === "ascii") {
    const o = new TextDecoder().decode(
      new Uint8Array(l, e.dataOffset)
    ), i = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let n = 0;
    for (let a = 0; a < i.length; a++) {
      for (; n < o.length && /\s/.test(o[n]); ) n++;
      const d = n;
      for (; n < o.length && !/\s/.test(o[n]); ) n++;
      const h = Number(o.slice(d, n));
      if (!Number.isFinite(h))
        throw new Error(`Invalid ASCII PLY value at scalar ${a}`);
      i[a] = h;
    }
    return (a, d) => i[a * e.properties.length + d];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > l.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(l), r = e.format === "binary_little_endian";
  return (o, i) => {
    const n = e.properties[i], a = e.dataOffset + o * e.vertexStride + n.byteOffset;
    return ae(s, a, n.type, r);
  };
}
function ae(l, e, t, s) {
  switch (t) {
    case "char":
    case "int8":
      return l.getInt8(e);
    case "uchar":
    case "uint8":
      return l.getUint8(e);
    case "short":
    case "int16":
      return l.getInt16(e, s);
    case "ushort":
    case "uint16":
      return l.getUint16(e, s);
    case "int":
    case "int32":
      return l.getInt32(e, s);
    case "uint":
    case "uint32":
      return l.getUint32(e, s);
    case "float":
    case "float32":
      return l.getFloat32(e, s);
    case "double":
    case "float64":
      return l.getFloat64(e, s);
  }
}
function B(l) {
  const e = l.nodes, t = new Float32Array(e.length * 7), s = new Uint32Array(e.length * 2), r = new Uint32Array(e.length * 2), o = [], i = [];
  for (const a of e) {
    const d = a.id * 7, { min: h, max: f } = a.raycastBounds;
    if (t.set(
      [h.x, h.y, h.z, f.x, f.y, f.z, a.maxSplatRadius],
      d
    ), s.set([o.length, a.children.length], a.id * 2), o.push(...a.children), r.set(
      [i.length, a.gaussianIndices?.length ?? 0],
      a.id * 2
    ), a.gaussianIndices !== null)
      for (const u of a.gaussianIndices) i.push(u);
  }
  const n = l.data;
  return {
    means: Float32Array.from(n.means.array).buffer,
    scalesOpacity: Float32Array.from(n.scalesOpacity.array).buffer,
    rotations: Float32Array.from(n.rotations.array).buffer,
    nodeBounds: t.buffer,
    nodeChildren: s.buffer,
    children: Uint32Array.from(o).buffer,
    nodeIndices: r.buffer,
    indices: Uint32Array.from(i).buffer
  };
}
class V {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const ie = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class O {
  constructor(e, t) {
    this.octree = e, this.levels = ce(t.levels ?? ie), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? le, r = new Float64Array(e.data.count);
    for (let o = 0; o < r.length; o++) {
      const i = s(o, e);
      r[o] = Number.isFinite(i) ? i : -1 / 0;
    }
    this.nodes = e.nodes.map((o) => {
      if (o.gaussianIndices === null)
        return new V(
          o.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const i = Uint32Array.from(
        Array.from(o.gaussianIndices).sort(
          (n, a) => r[a] - r[n] || n - a
        )
      );
      return new V(
        o.id,
        i,
        Uint32Array.from(
          this.levels.map(
            ({ retention: n }) => Math.min(
              i.length,
              Math.max(1, Math.ceil(i.length * n))
            )
          )
        )
      );
    });
  }
  octree;
  static build(e, t = {}) {
    return new O(e, t);
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
    for (let o = 0; o < e.nodeIds.length; o++) {
      const i = e.nodeIds[o], n = this.getLeafNode(i);
      if (s.has(i))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${i}`
        );
      s.add(i);
      const a = e.lodLevels[o], d = n.levelCounts[a];
      if (d === void 0)
        throw new RangeError(`GaussianLod level ${a} does not exist`);
      if (r + d > t.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let h = 0; h < d; h++)
        t[r++] = n.sortedGaussianIndices[h];
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
    const o = s.maxHits ?? 1 / 0;
    if (!(o > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const i = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, a = new I(), d = new I(), h = [], f = /* @__PURE__ */ new Set();
    for (let u = 0; u < t.nodeIds.length; u++) {
      const w = t.nodeIds[u], g = this.getLeafNode(w);
      if (f.has(w))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${w}`
        );
      f.add(w);
      const m = t.lodLevels[u], c = g.levelCounts[m];
      if (c === void 0)
        throw new RangeError(`GaussianLod level ${m} does not exist`);
      const y = this.octree.nodes[w], C = Math.max(0, r - 3) * y.maxSplatRadius, x = C === 0 ? y.raycastBounds : y.raycastBounds.clone().expandByScalar(C);
      if (e.intersectsBox(x))
        for (let p = 0; p < c; p++) {
          const b = g.sortedGaussianIndices[p], v = b * 4;
          a.set(i[v], i[v + 1], i[v + 2]);
          const L = Math.max(
            n[v],
            n[v + 1],
            n[v + 2]
          ) * r;
          e.closestPointToPoint(a, d), !(d.distanceToSquared(a) > L * L) && h.push({
            gaussianIndex: b,
            distance: e.origin.distanceTo(d),
            point: d.clone()
          });
        }
    }
    return h.sort((u, w) => u.distance - w.distance), h.length > o && (h.length = o), h;
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
function ce(l) {
  if (l.length === 0 || l.length > 256)
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  let e = 0;
  const t = l.map(({ retention: s }) => {
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
function le(l, e) {
  const t = e.data.scalesOpacity.array, s = l * 4, r = [t[s], t[s + 1], t[s + 2]];
  return r.sort((o, i) => i - o), t[s + 3] * r[0] * r[1];
}
class de {
  constructor(e, t, s, r, o, i, n, a) {
    this.id = e, this.depth = t, this.bounds = s, this.count = r, this.maxSplatRadius = o, this.raycastBounds = a, this.children = i, this.gaussianIndices = n;
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
class U {
  constructor(e, t, s, r) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = r, this.bounds = ue(e), this.rootBounds = he(this.bounds);
    const o = e.means.array, i = e.scalesOpacity.array, n = [], a = [], d = Array.from({ length: e.count }, (f, u) => u), h = (f, u, w) => {
      const g = n.length;
      n.push(null);
      const m = f.length > t && w < s && u.max.x - u.min.x > Number.EPSILON, c = [];
      if (m) {
        const x = u.getCenter(new I()), p = Array.from({ length: 8 }, () => []);
        for (const b of f) {
          const v = b * 4, L = (o[v] >= x.x ? 1 : 0) | (o[v + 1] >= x.y ? 2 : 0) | (o[v + 2] >= x.z ? 4 : 0);
          p[L].push(b);
        }
        for (let b = 0; b < 8; b++) {
          const v = p[b];
          v.length !== 0 && c.push(
            h(
              v,
              fe(u, x, b),
              w + 1
            )
          );
        }
      }
      let y = 0;
      if (c.length > 0)
        for (const x of c)
          y = Math.max(
            y,
            n[x].maxSplatRadius
          );
      else {
        for (const x of f) {
          const p = x * 4;
          y = Math.max(
            y,
            i[p],
            i[p + 1],
            i[p + 2]
          );
        }
        a.push(g);
      }
      const C = u.clone().expandByScalar(y * 3);
      return n[g] = new de(
        g,
        w,
        u,
        f.length,
        y,
        c,
        c.length === 0 ? Uint32Array.from(f) : null,
        C
      ), g;
    };
    h(d, this.rootBounds.clone(), 0), this.nodes = n, this.leafNodeIds = Uint32Array.from(a);
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
    return new U(
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
    const o = [], i = [this.rootNode];
    for (; i.length > 0; ) {
      const n = this.nodes[i.pop()], a = Math.max(0, s - 3) * n.maxSplatRadius, d = a === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(a);
      if (e.intersectsBox(d))
        if (n.gaussianIndices !== null)
          for (const h of n.gaussianIndices) o.push(h);
        else
          for (const h of n.children) i.push(h);
    }
    return this.raycastIndices(e, o, s, r);
  }
  raycastIndices(e, t, s = 3, r = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(r > 0)) return [];
    const o = this.data.means.array, i = this.data.scalesOpacity.array, n = new I(), a = new I(), d = [];
    for (let h = 0; h < t.length; h++) {
      const f = t[h], u = f * 4;
      n.set(o[u], o[u + 1], o[u + 2]);
      const w = Math.max(
        i[u],
        i[u + 1],
        i[u + 2]
      ) * s;
      e.closestPointToPoint(n, a), !(a.distanceToSquared(n) > w * w) && d.push({
        gaussianIndex: f,
        distance: e.origin.distanceTo(a),
        point: a.clone()
      });
    }
    return d.sort((h, f) => h.distance - f.distance), d.length > r && (d.length = r), d;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function ue(l) {
  const e = l.means.array, t = new D(), s = new I();
  for (let r = 0; r < l.count; r++) {
    const o = r * 4;
    s.set(e[o], e[o + 1], e[o + 2]), t.expandByPoint(s);
  }
  return t;
}
function he(l) {
  const e = l.getCenter(new I()), t = l.getSize(new I()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new D(
    new I(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new I(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function fe(l, e, t) {
  return new D(
    new I(
      t & 1 ? e.x : l.min.x,
      t & 2 ? e.y : l.min.y,
      t & 4 ? e.z : l.min.z
    ),
    new I(
      t & 1 ? l.max.x : e.x,
      t & 2 ? l.max.y : e.y,
      t & 4 ? l.max.z : e.z
    )
  );
}
const ge = /* @__PURE__ */ new Set([
  "means",
  "scalesOpacity",
  "rotations",
  "shCoefficients",
  "lodLevel"
]), pe = new j();
class ye {
  listeners = /* @__PURE__ */ new Set();
  clouds = /* @__PURE__ */ new Map();
  usedCloudIds = /* @__PURE__ */ new Set();
  usedCommandIds = /* @__PURE__ */ new Set();
  cancelled = /* @__PURE__ */ new Set();
  activeLoads = /* @__PURE__ */ new Map();
  parser = new ne();
  config;
  work = Promise.resolve();
  nextObjectId = 0;
  layoutVersion = 0;
  contentVersion = 0;
  sceneRevision = 0;
  cameraPosition = new I();
  packed = null;
  target = null;
  updateScheduled = !1;
  disposed = !1;
  constructor(e) {
    if (e.frontend.maxStorageBufferBindingSize <= 0 || e.frontend.maxBufferSize <= 0)
      throw new RangeError("Frontend buffer limits must be positive");
    this.config = e;
  }
  subscribe(e) {
    if (this.disposed) throw new Error("Backend disposed");
    return this.listeners.add(e), () => this.listeners.delete(e);
  }
  dispatch(e) {
    if (this.disposed) throw new Error("Backend disposed");
    if (this.usedCommandIds.has(e.id))
      throw new Error(`Duplicate backend command id: ${e.id}`);
    if (this.usedCommandIds.add(e.id), e.type === "cancel") {
      this.cancelled.add(e.targetCommandId), this.activeLoads.get(e.targetCommandId)?.abort(), this.emit({ type: "command-completed", commandId: e.id });
      return;
    }
    this.work = this.work.then(async () => {
      if (this.cancelled.delete(e.id)) {
        this.emit({ type: "command-cancelled", commandId: e.id });
        return;
      }
      try {
        await this.handle(e);
      } catch (t) {
        this.cancelled.delete(e.id) ? this.emit({ type: "command-cancelled", commandId: e.id }) : this.emit({
          type: "error",
          commandId: e.id,
          cloudId: "cloudId" in e ? e.cloudId : void 0,
          code: t instanceof RangeError ? "invalid-range" : "backend-error",
          message: t instanceof Error ? t.message : String(t)
        });
      }
    });
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0;
      for (const e of this.activeLoads.values()) e.abort();
      this.activeLoads.clear(), this.listeners.clear(), this.clouds.clear(), this.packed = null, this.target = null;
    }
  }
  emit(e) {
    if (!this.disposed)
      for (const t of this.listeners) t(e);
  }
  async handle(e) {
    switch (e.type) {
      case "load-cloud":
      case "load-cloud-from-buffer": {
        if (this.usedCloudIds.has(e.cloudId))
          throw new Error(`Cloud id already used: ${e.cloudId}`);
        const t = new AbortController();
        this.activeLoads.set(e.id, t);
        let s;
        try {
          if (e.type === "load-cloud") {
            const f = await fetch(e.url, { signal: t.signal });
            if (!f.ok) throw new Error(`PLY fetch failed: ${f.status}`);
            if (f.headers.get("content-type")?.includes("text/html"))
              throw new Error("PLY URL returned HTML instead of a PLY file");
            s = this.parser.parse(await f.arrayBuffer());
          } else
            s = this.parser.parse(e.buffer);
        } finally {
          this.activeLoads.delete(e.id);
        }
        if (this.cancelled.delete(e.id)) {
          this.emit({ type: "command-cancelled", commandId: e.id });
          return;
        }
        const r = e.options ?? {}, o = U.build(s, r.octree), i = O.build(o, r.lod), n = {
          id: e.cloudId,
          objectId: this.nextObjectId++,
          source: s,
          octree: o,
          lod: i,
          octreeOptions: r.octree,
          lodOptions: r.lod,
          attributes: /* @__PURE__ */ new Map(),
          transform: pe.clone(),
          priority: $(r.priority ?? 0),
          packingStrategy: r.packingStrategy ?? this.config.defaultPackingStrategy ?? { type: "tiered-radial" },
          raycastable: r.raycastable ?? !0,
          sourceVersion: 1
        };
        for (const f of r.attributes ?? []) {
          if (ge.has(f.name) || n.attributes.has(f.name))
            throw new Error(`Reserved or duplicate attribute name: ${f.name}`);
          n.attributes.set(f.name, we(f, s.count));
        }
        for (const f of this.clouds.values())
          for (const [u, w] of n.attributes) {
            const g = f.attributes.get(u);
            if (g && (g.format !== w.format || g.elementsPerGaussian !== w.elementsPerGaussian))
              throw new Error(`Attribute schema differs across clouds: ${u}`);
          }
        this.usedCloudIds.add(n.id), this.clouds.set(n.id, n);
        let a;
        try {
          a = this.compute();
        } catch (f) {
          throw this.clouds.delete(n.id), this.usedCloudIds.delete(n.id), f;
        }
        const { min: d, max: h } = o.bounds;
        this.emit({
          type: "cloud-loaded",
          commandId: e.id,
          cloudId: n.id,
          objectId: n.objectId,
          sourceCount: s.count,
          shDegree: s.shDegree,
          bounds: [d.x, d.y, d.z, h.x, h.y, h.z],
          raycast: n.raycastable ? B(o) : void 0
        }), this.target = null, this.replace(a);
        return;
      }
      case "unload-cloud":
        this.clouds.delete(e.cloudId), this.emit({ type: "cloud-unloaded", commandId: e.id, cloudId: e.cloudId }), this.repack();
        return;
      case "set-cloud-priority":
        this.getCloud(e.cloudId).priority = $(e.priority), this.repack();
        break;
      case "set-cloud-packing":
        this.getCloud(e.cloudId).packingStrategy = e.packingStrategy, this.repack();
        break;
      case "set-cloud-transform": {
        const t = this.getCloud(e.cloudId);
        if (e.worldMatrix.length !== 16)
          throw new RangeError("Cloud transform needs sixteen numbers");
        if (e.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = e.sceneRevision, t.transform.fromArray(e.worldMatrix), this.updateTarget();
        break;
      }
      case "set-cloud-raycastable": {
        const t = this.getCloud(e.cloudId);
        t.raycastable = e.raycastable, this.emit({
          type: "cloud-raycast-changed",
          commandId: e.id,
          cloudId: t.id,
          raycastable: t.raycastable,
          raycast: t.raycastable ? B(t.octree) : void 0
        });
        return;
      }
      case "write-attribute-range":
        this.writeRange(e), this.updateTarget();
        break;
      case "set-camera":
        if (e.worldMatrix.length !== 16 || e.projectionMatrix.length !== 16)
          throw new RangeError("Camera matrices need sixteen numbers each");
        if (e.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = e.sceneRevision, this.cameraPosition.set(
          e.worldMatrix[12],
          e.worldMatrix[13],
          e.worldMatrix[14]
        ), this.updateTarget();
        break;
    }
    this.emit({ type: "command-completed", commandId: e.id });
  }
  getCloud(e) {
    const t = this.clouds.get(e);
    if (!t) throw new Error(`Unknown cloud: ${e}`);
    return t;
  }
  writeRange(e) {
    const t = this.getCloud(e.cloudId), { firstGaussian: s, gaussianCount: r, attribute: o } = e;
    if (!Number.isSafeInteger(s) || !Number.isSafeInteger(r) || s < 0 || r < 0 || s + r > t.source.count)
      throw new RangeError("Attribute range exceeds source cloud");
    if (o === "lodLevel") throw new Error("lodLevel is computed by the backend");
    let i, n;
    switch (o) {
      case "means":
        i = t.source.means.array, n = 4;
        break;
      case "scalesOpacity":
        i = t.source.scalesOpacity.array, n = 4;
        break;
      case "rotations":
        i = t.source.rotations.array, n = 4;
        break;
      case "shCoefficients":
        i = t.source.shCoefficients.array, n = t.source.shCoefficientCount * 4;
        break;
      default: {
        const d = t.attributes.get(o);
        if (!d) throw new Error(`Unknown source attribute: ${o}`);
        i = d.values, n = d.elementsPerGaussian;
      }
    }
    if (e.data.byteLength !== r * n * 4)
      throw new RangeError("Attribute update has the wrong byte length");
    const a = i instanceof Uint32Array ? new Uint32Array(e.data) : new Float32Array(e.data);
    if (i.set(a, s * n), (o === "means" || o === "scalesOpacity" || o === "rotations") && (t.octree = U.build(t.source, t.octreeOptions), t.lod = O.build(t.octree, t.lodOptions), t.sourceVersion++, t.raycastable)) {
      const { min: d, max: h } = t.octree.bounds;
      this.emit({
        type: "raycast-replaced",
        cloudId: t.id,
        sourceVersion: t.sourceVersion,
        bounds: [d.x, d.y, d.z, h.x, h.y, h.z],
        raycast: B(t.octree)
      });
    }
  }
  maxSlots(e, t) {
    const s = Math.min(
      this.config.frontend.maxStorageBufferBindingSize,
      this.config.frontend.maxBufferSize
    ), r = [
      16,
      16,
      16,
      (e + 1) ** 2 * 4,
      4,
      ...[...t.values()].map((i) => i.elementsPerGaussian * 4)
    ], o = Math.min(...r.map((i) => Math.floor(s / i)));
    if (o < 1) throw new RangeError("Frontend buffer limits are too small");
    return Math.min(o, this.config.maxGaussians === "auto" || this.config.maxGaussians === void 0 ? o : this.config.maxGaussians);
  }
  compute(e = 0) {
    const t = [...this.clouds.values()].sort((p, b) => p.priority - b.priority || p.objectId - b.objectId), s = t.reduce(
      (p, b) => Math.max(p, b.source.shDegree),
      0
    ), r = /* @__PURE__ */ new Map();
    for (const p of t)
      for (const [b, v] of p.attributes) r.set(b, v);
    let o = this.maxSlots(s, r);
    const i = [];
    for (const p of t) {
      const b = this.select(p, Math.min(o, p.source.count)), v = p.lod.indicesForPacking(b), L = new Uint32Array(v.length), E = [];
      let P = 0;
      for (let R = 0; R < b.nodeIds.length; R++) {
        const M = p.lod.nodes[b.nodeIds[R]], S = b.lodLevels[R], k = M.levelCounts[S];
        L.fill(S, P, P + k), P += k, E.push(P);
      }
      i.push({ entry: p, indices: v, levels: L, cellEnds: E }), o -= v.length;
    }
    const n = i.reduce((p, b) => p + b.indices.length, 0), a = Math.max(1, n, e), d = /* @__PURE__ */ new Map(), h = (p, b, v) => {
      const L = b === "f32" ? new Float32Array(a * v) : new Uint32Array(a * v);
      return d.set(p, { format: b, elementsPerGaussian: v, values: L }), L;
    }, f = h("means", "f32", 4), u = h("scalesOpacity", "f32", 4), w = h("rotations", "f32", 4), g = h("shCoefficients", "u32", (s + 1) ** 2), m = h("lodLevel", "u32", 1), c = new Uint32Array(a);
    for (const [p, b] of r)
      h(p, b.format, b.elementsPerGaussian);
    const y = [];
    let C = 0, x = 1;
    for (const { entry: p, indices: b, levels: v, cellEnds: L } of i) {
      const E = p.source, P = E.shCoefficients.array;
      let R = 0;
      for (let M = 0; M < b.length; M++, C++) {
        for (; M >= L[R]; ) R++;
        c[C] = x + R;
        const S = b[M];
        f.set(E.means.array.subarray(S * 4, S * 4 + 4), C * 4), f[C * 4 + 3] = p.objectId, u.set(
          E.scalesOpacity.array.subarray(S * 4, S * 4 + 4),
          C * 4
        ), w.set(
          E.rotations.array.subarray(S * 4, S * 4 + 4),
          C * 4
        ), m[C] = v[M];
        for (let k = 0; k < E.shCoefficientCount; k++) {
          const A = (S * E.shCoefficientCount + k) * 4;
          g[C * (s + 1) ** 2 + k] = q(
            P[A],
            P[A + 1],
            P[A + 2]
          );
        }
        for (const [k, A] of p.attributes) {
          const Y = d.get(k).values, _ = A.elementsPerGaussian;
          Y.set(A.values.subarray(S * _, (S + 1) * _), C * _);
        }
      }
      x += L.length, y.push({ cloudId: p.id, objectId: p.objectId, renderedCount: b.length });
    }
    return { capacity: a, count: n, degree: s, attributes: d, cells: c, clouds: y };
  }
  select(e, t) {
    const s = this.cameraPosition.clone().applyMatrix4(e.transform.clone().invert()), r = e.packingStrategy;
    switch (r.type) {
      case "maximum":
        return new J().pack({ lod: e.lod, maxGaussians: t });
      case "radial":
        return new Q({ center: s, lodLevel: r.lodLevel }).pack({ lod: e.lod, maxGaussians: t });
      case "tiered-radial":
        return new Z({ center: s, budgetShares: r.budgetShares }).pack({ lod: e.lod, maxGaussians: t });
      case "distance-aware-radial":
        return new H({ center: s, levelDistance: r.levelDistance }).pack({ lod: e.lod, maxGaussians: t });
    }
  }
  repack() {
    this.target = null;
    const e = this.compute();
    this.replace(e);
  }
  updateTarget() {
    if (!this.packed) return;
    const e = this.compute(this.packed.capacity);
    if (e.capacity !== this.packed.capacity || e.degree !== this.packed.degree || [...e.attributes].some(([t, s]) => this.packed?.attributes.get(t)?.elementsPerGaussian !== s.elementsPerGaussian)) {
      this.replace(e);
      return;
    }
    this.target = e, this.scheduleUpdate();
  }
  replace(e) {
    this.packed = e, this.layoutVersion++, this.contentVersion++;
    const t = [...e.attributes].map(([s, r]) => ({
      name: s,
      format: r.format,
      elementsPerGaussian: r.elementsPerGaussian,
      data: r.values.slice().buffer
    }));
    this.emit({
      type: "buffers-replaced",
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      contentVersion: this.contentVersion,
      count: e.count,
      capacity: e.capacity,
      objectCapacity: this.nextObjectId,
      shDegree: e.degree,
      shFormat: "rgb8e8",
      attributes: t,
      clouds: e.clouds
    });
  }
  scheduleUpdate() {
    this.updateScheduled || (this.updateScheduled = !0, setTimeout(() => {
      this.updateScheduled = !1, !(this.disposed || !this.target || !this.packed) && this.emitNextPatch();
    }, 0));
  }
  emitNextPatch() {
    const e = this.packed, t = this.target, s = this.config.streamingLod?.maxUploadBytesPerUpdate ?? 1024 * 1024, r = Math.max(1, this.config.streamingLod?.maxChangedCellsPerUpdate ?? 16), o = [...e.attributes.values()].reduce((u, w) => u + w.elementsPerGaussian * 4, 0), i = Math.max(1, Math.floor(s / o)), n = [], a = /* @__PURE__ */ new Set();
    for (let u = 0; u < e.capacity && n.length < i; u++)
      if ([...e.attributes].some(([w, g]) => {
        const m = t.attributes.get(w).values, c = u * g.elementsPerGaussian;
        for (let y = 0; y < g.elementsPerGaussian; y++)
          if (g.values[c + y] !== m[c + y]) return !0;
        return !1;
      })) {
        const w = t.cells[u];
        if (!a.has(w) && a.size >= r) break;
        a.add(w), n.push(u);
      }
    const d = [];
    if (n.length === 0) {
      if (JSON.stringify(e.clouds) !== JSON.stringify(t.clouds)) {
        const u = this.contentVersion++;
        this.emit({
          type: "buffers-patched",
          sceneRevision: this.sceneRevision,
          layoutVersion: this.layoutVersion,
          baseContentVersion: u,
          contentVersion: this.contentVersion,
          patches: [],
          changedClouds: t.clouds,
          lodPending: !1
        });
      }
      this.packed = { ...e, count: t.count, clouds: t.clouds, cells: t.cells }, this.target = null;
      return;
    }
    for (const [u, w] of e.attributes) {
      const g = w.elementsPerGaussian, m = t.attributes.get(u).values;
      let c = -1, y = -1;
      const C = () => {
        if (c < 0) return;
        const x = c * g, p = (y + 1) * g;
        w.values.set(m.subarray(x, p), x), d.push({
          name: u,
          firstSlot: c,
          slotCount: y - c + 1,
          data: m.slice(x, p).buffer
        }), c = -1;
      };
      for (const x of n) {
        const p = x * g;
        let b = !1;
        for (let v = 0; v < g; v++)
          if (w.values[p + v] !== m[p + v]) {
            b = !0;
            break;
          }
        if (!b) {
          C();
          continue;
        }
        c < 0 ? c = x : x !== y + 1 && (C(), c = x), y = x;
      }
      C();
    }
    const h = [...e.attributes].some(([u, w]) => {
      const g = t.attributes.get(u).values;
      return w.values.some((m, c) => m !== g[c]);
    }), f = this.contentVersion++;
    this.emit({
      type: "buffers-patched",
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      baseContentVersion: f,
      contentVersion: this.contentVersion,
      patches: d,
      changedClouds: h ? e.clouds : t.clouds,
      lodPending: h
    }), h ? this.scheduleUpdate() : (this.packed = { ...e, count: t.count, clouds: t.clouds, cells: t.cells }, this.target = null);
  }
}
function $(l) {
  if (!Number.isSafeInteger(l)) throw new RangeError("Priority must be a safe integer");
  return l;
}
function we(l, e) {
  const t = l.elementsPerGaussian;
  if (!Number.isSafeInteger(t) || t < 1)
    throw new RangeError("Attribute elementsPerGaussian must be positive");
  const s = e * t, r = l.format === "f32" ? new Float32Array(s) : new Uint32Array(s);
  if (l.source.kind === "fill")
    r.fill(l.source.value === "ones" ? 1 : 0);
  else {
    if (l.source.data.byteLength !== s * 4)
      throw new RangeError("Attribute buffer has the wrong byte length");
    r.set(l.format === "f32" ? new Float32Array(l.source.data) : new Uint32Array(l.source.data));
  }
  return { format: l.format, elementsPerGaussian: t, values: r };
}
class be {
  createBackend(e) {
    return new ye(e);
  }
}
export {
  be as DirectStreamingGaussianBackendFactory,
  ye as StreamingGaussianBackend
};
