import { Vector3 as I, Box3 as B, Matrix4 as j } from "three";
function q(l, e, t) {
  const s = Math.max(Math.abs(l), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const n = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), o = 127 / 2 ** n, i = _(l, o), r = _(e, o), a = _(t, o), d = n + 127;
  return (i | r << 8 | a << 16 | d << 24) >>> 0;
}
function _(l, e) {
  return Math.min(127, Math.max(-127, Math.round(l * e))) & 255;
}
function N(l) {
  if (!Number.isInteger(l) || l < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
function D(l, e, t) {
  return l.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), l.getWorldPosition(t), e.worldToLocal(t);
}
function F(l, e) {
  const t = e instanceof I ? e.clone() : l.octree.bounds.getCenter(new I()), s = l.octree.rootBounds.getSize(new I()), n = Math.max(s.length() * 0.5, Number.EPSILON), o = new I(), i = Array.from(l.octree.leafNodeIds, (r) => (l.octree.nodes[r].bounds.getCenter(o), {
    nodeId: r,
    radius: o.distanceTo(t) / n
  }));
  return i.sort(
    (r, a) => r.radius - a.radius || r.nodeId - a.nodeId
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
      D(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return W();
    const s = F(e, this.center), n = s.map(
      ({ radius: r }) => Math.max(0, e.finestLevel - Math.floor(r / this.levelDistance))
    );
    let o = s.reduce(
      (r, a, d) => r + e.nodes[a.nodeId].levelCounts[n[d]],
      0
    );
    for (let r = s.length - 1; r >= 0 && o > t; r--) {
      const a = e.nodes[s[r].nodeId];
      for (; n[r] > 0 && o > t; ) {
        const d = a.levelCounts[n[r]];
        n[r] = n[r] - 1, o -= d - a.levelCounts[n[r]];
      }
    }
    let i = s.length;
    for (; i > 0 && o > t; ) {
      i--;
      const r = e.nodes[s[i].nodeId];
      o -= r.levelCounts[n[i]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, i).map(({ nodeId: r }) => r)
      ),
      lodLevels: Uint8Array.from(n.slice(0, i)),
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
    const n = e.octree.leafNodeIds.slice(), o = new Uint8Array(n.length);
    return o.fill(e.finestLevel), { nodeIds: n, lodLevels: o, gaussianCount: s };
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
      D(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return X();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const n = F(e, this.center), o = [];
    let i = 0;
    for (const a of n) {
      const d = e.nodes[a.nodeId].levelCounts[s];
      if (i + d > t) break;
      o.push(a.nodeId), i += d;
    }
    const r = new Uint8Array(o.length);
    return r.fill(s), {
      nodeIds: Uint32Array.from(o),
      lodLevels: r,
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
      D(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return ee();
    const s = e.octree.data.count;
    if (s <= t) {
      const f = e.octree.leafNodeIds.slice(), u = new Uint8Array(f.length);
      return u.fill(e.finestLevel), { nodeIds: f, lodLevels: u, gaussianCount: s };
    }
    const n = F(e, this.center), o = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], i = [], r = [];
    let a = 0, d = 0, h = 0;
    for (let f = 0; f < o.length; f++) {
      const u = this.budgetShares[f];
      if (h += u, u === 0) continue;
      const y = f === o.length - 1 ? t : Math.floor(t * h), p = o[f];
      for (; d < n.length; ) {
        const w = n[d], c = e.nodes[w.nodeId].levelCounts[p];
        if (a + c > y) break;
        i.push(w.nodeId), r.push(p), a += c, d++;
      }
    }
    return {
      nodeIds: Uint32Array.from(i),
      lodLevels: Uint8Array.from(r),
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
  constructor(e, t, s, n, o, i) {
    this.count = e, this.shDegree = t, this.shCoefficientCount = (t + 1) ** 2, this.means = { array: s }, this.scalesOpacity = { array: n }, this.rotations = { array: o }, this.shCoefficients = { array: i };
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
      t.properties.map((c, m) => [c.name, m])
    );
    for (const c of se)
      if (!s.has(c))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${c}`);
    const n = t.properties.map((c) => c.name.match(/^f_rest_(\d+)$/)?.[1]).filter((c) => c !== void 0).map(Number).sort((c, m) => c - m);
    for (let c = 0; c < n.length; c++)
      if (n[c] !== c)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (n.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const o = n.length / 3, i = o + 1, r = Math.sqrt(i);
    if (!Number.isInteger(r) || r < 1 || r > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const a = oe(e, t), d = (c) => s.get(c), h = n.map(
      (c) => d(`f_rest_${c}`)
    ), f = t.vertexCount, u = new Float32Array(f * 4), y = new Float32Array(f * 4), p = new Float32Array(f * 4), w = new Float32Array(f * i * 4);
    for (let c = 0; c < f; c++) {
      const m = c * 4;
      u[m] = a(c, d("x")), u[m + 1] = a(c, d("y")), u[m + 2] = a(c, d("z")), y[m] = Math.max(
        Math.exp(a(c, d("scale_0"))),
        1e-6
      ), y[m + 1] = Math.max(
        Math.exp(a(c, d("scale_1"))),
        1e-6
      ), y[m + 2] = Math.max(
        Math.exp(a(c, d("scale_2"))),
        1e-6
      );
      const C = a(c, d("opacity"));
      y[m + 3] = 1 / (1 + Math.exp(-C));
      const x = a(c, d("rot_0")), g = a(c, d("rot_1")), b = a(c, d("rot_2")), v = a(c, d("rot_3")), L = Math.hypot(g, b, v, x);
      L > 1e-12 ? (p[m] = g / L, p[m + 1] = b / L, p[m + 2] = v / L, p[m + 3] = x / L) : p[m + 3] = 1;
      const E = c * i * 4;
      w[E] = a(c, d("f_dc_0")), w[E + 1] = a(c, d("f_dc_1")), w[E + 2] = a(c, d("f_dc_2"));
      for (let P = 1; P < i; P++) {
        const R = E + P * 4, U = P - 1;
        for (let S = 0; S < 3; S++) {
          const k = h[S * o + U];
          w[R + S] = a(
            c,
            k
          );
        }
      }
    }
    return new te(
      f,
      r - 1,
      u,
      y,
      p,
      w
    );
  }
}
function re(l) {
  const e = new Uint8Array(l), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let p = 0; p <= e.length - t.length; p++) {
    let w = !0;
    for (let c = 0; c < t.length; c++)
      if (e[p + c] !== t[c]) {
        w = !1;
        break;
      }
    if (w) {
      s = p;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let n = s + t.length;
  if (e[n] === 13 && n++, e[n] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  n++;
  const i = new TextDecoder().decode(e.subarray(0, n)).split(/\r?\n/);
  if (i[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let r = null, a = "", d = -1, h = 0;
  const f = [], u = [];
  for (const p of i) {
    const w = p.trim().split(/\s+/);
    if (w[0] === "format") {
      if (w[1] !== "ascii" && w[1] !== "binary_little_endian" && w[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${w[1] ?? "unknown"}`);
      r = w[1];
    } else if (w[0] === "element") {
      a = w[1] ?? "";
      const c = Number(w[2]);
      if (!Number.isInteger(c) || c < 0)
        throw new Error(`Invalid element count for ${a}`);
      u.push({ name: a, count: c }), a === "vertex" && (d = c);
    } else if (w[0] === "property" && a === "vertex") {
      if (w[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const c = w[1], m = w[2];
      if (!(c in z) || m === void 0)
        throw new Error(`Unsupported vertex property: ${p}`);
      f.push({ name: m, type: c, byteOffset: h }), h += z[c];
    }
  }
  if (r === null) throw new Error("Invalid PLY: format is missing");
  if (d <= 0) throw new Error("PLY must contain at least one vertex");
  if (u.find(
    (p) => p.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: r, vertexCount: d, properties: f, vertexStride: h, dataOffset: n };
}
function oe(l, e) {
  if (e.format === "ascii") {
    const o = new TextDecoder().decode(
      new Uint8Array(l, e.dataOffset)
    ), i = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let r = 0;
    for (let a = 0; a < i.length; a++) {
      for (; r < o.length && /\s/.test(o[r]); ) r++;
      const d = r;
      for (; r < o.length && !/\s/.test(o[r]); ) r++;
      const h = Number(o.slice(d, r));
      if (!Number.isFinite(h))
        throw new Error(`Invalid ASCII PLY value at scalar ${a}`);
      i[a] = h;
    }
    return (a, d) => i[a * e.properties.length + d];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > l.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(l), n = e.format === "binary_little_endian";
  return (o, i) => {
    const r = e.properties[i], a = e.dataOffset + o * e.vertexStride + r.byteOffset;
    return ae(s, a, r.type, n);
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
function G(l) {
  const e = l.nodes, t = new Float32Array(e.length * 7), s = new Uint32Array(e.length * 2), n = new Uint32Array(e.length * 2), o = [], i = [];
  for (const a of e) {
    const d = a.id * 7, { min: h, max: f } = a.raycastBounds;
    if (t.set(
      [h.x, h.y, h.z, f.x, f.y, f.z, a.maxSplatRadius],
      d
    ), s.set([o.length, a.children.length], a.id * 2), o.push(...a.children), n.set(
      [i.length, a.gaussianIndices?.length ?? 0],
      a.id * 2
    ), a.gaussianIndices !== null)
      for (const u of a.gaussianIndices) i.push(u);
  }
  const r = l.data;
  return {
    means: Float32Array.from(r.means.array).buffer,
    scalesOpacity: Float32Array.from(r.scalesOpacity.array).buffer,
    rotations: Float32Array.from(r.rotations.array).buffer,
    nodeBounds: t.buffer,
    nodeChildren: s.buffer,
    children: Uint32Array.from(o).buffer,
    nodeIndices: n.buffer,
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
class A {
  constructor(e, t) {
    this.octree = e, this.levels = ce(t.levels ?? ie), this.ownsOctree = t.ownsOctree ?? !1;
    const s = t.importance ?? le, n = new Float64Array(e.data.count);
    for (let o = 0; o < n.length; o++) {
      const i = s(o, e);
      n[o] = Number.isFinite(i) ? i : -1 / 0;
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
          (r, a) => n[a] - n[r] || r - a
        )
      );
      return new V(
        o.id,
        i,
        Uint32Array.from(
          this.levels.map(
            ({ retention: r }) => Math.min(
              i.length,
              Math.max(1, Math.ceil(i.length * r))
            )
          )
        )
      );
    });
  }
  octree;
  static build(e, t = {}) {
    return new A(e, t);
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
    let n = 0;
    for (let o = 0; o < e.nodeIds.length; o++) {
      const i = e.nodeIds[o], r = this.getLeafNode(i);
      if (s.has(i))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${i}`
        );
      s.add(i);
      const a = e.lodLevels[o], d = r.levelCounts[a];
      if (d === void 0)
        throw new RangeError(`GaussianLod level ${a} does not exist`);
      if (n + d > t.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let h = 0; h < d; h++)
        t[n++] = r.sortedGaussianIndices[h];
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
    const o = s.maxHits ?? 1 / 0;
    if (!(o > 0)) return [];
    if (t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const i = this.octree.data.means.array, r = this.octree.data.scalesOpacity.array, a = new I(), d = new I(), h = [], f = /* @__PURE__ */ new Set();
    for (let u = 0; u < t.nodeIds.length; u++) {
      const y = t.nodeIds[u], p = this.getLeafNode(y);
      if (f.has(y))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${y}`
        );
      f.add(y);
      const w = t.lodLevels[u], c = p.levelCounts[w];
      if (c === void 0)
        throw new RangeError(`GaussianLod level ${w} does not exist`);
      const m = this.octree.nodes[y], C = Math.max(0, n - 3) * m.maxSplatRadius, x = C === 0 ? m.raycastBounds : m.raycastBounds.clone().expandByScalar(C);
      if (e.intersectsBox(x))
        for (let g = 0; g < c; g++) {
          const b = p.sortedGaussianIndices[g], v = b * 4;
          a.set(i[v], i[v + 1], i[v + 2]);
          const L = Math.max(
            r[v],
            r[v + 1],
            r[v + 2]
          ) * n;
          e.closestPointToPoint(a, d), !(d.distanceToSquared(a) > L * L) && h.push({
            gaussianIndex: b,
            distance: e.origin.distanceTo(d),
            point: d.clone()
          });
        }
    }
    return h.sort((u, y) => u.distance - y.distance), h.length > o && (h.length = o), h;
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
  const t = e.data.scalesOpacity.array, s = l * 4, n = [t[s], t[s + 1], t[s + 2]];
  return n.sort((o, i) => i - o), t[s + 3] * n[0] * n[1];
}
class de {
  constructor(e, t, s, n, o, i, r, a) {
    this.id = e, this.depth = t, this.bounds = s, this.count = n, this.maxSplatRadius = o, this.raycastBounds = a, this.children = i, this.gaussianIndices = r;
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
class O {
  constructor(e, t, s, n) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = n, this.bounds = ue(e), this.rootBounds = he(this.bounds);
    const o = e.means.array, i = e.scalesOpacity.array, r = [], a = [], d = Array.from({ length: e.count }, (f, u) => u), h = (f, u, y) => {
      const p = r.length;
      r.push(null);
      const w = f.length > t && y < s && u.max.x - u.min.x > Number.EPSILON, c = [];
      if (w) {
        const x = u.getCenter(new I()), g = Array.from({ length: 8 }, () => []);
        for (const b of f) {
          const v = b * 4, L = (o[v] >= x.x ? 1 : 0) | (o[v + 1] >= x.y ? 2 : 0) | (o[v + 2] >= x.z ? 4 : 0);
          g[L].push(b);
        }
        for (let b = 0; b < 8; b++) {
          const v = g[b];
          v.length !== 0 && c.push(
            h(
              v,
              fe(u, x, b),
              y + 1
            )
          );
        }
      }
      let m = 0;
      if (c.length > 0)
        for (const x of c)
          m = Math.max(
            m,
            r[x].maxSplatRadius
          );
      else {
        for (const x of f) {
          const g = x * 4;
          m = Math.max(
            m,
            i[g],
            i[g + 1],
            i[g + 2]
          );
        }
        a.push(p);
      }
      const C = u.clone().expandByScalar(m * 3);
      return r[p] = new de(
        p,
        y,
        u,
        f.length,
        m,
        c,
        c.length === 0 ? Uint32Array.from(f) : null,
        C
      ), p;
    };
    h(d, this.rootBounds.clone(), 0), this.nodes = r, this.leafNodeIds = Uint32Array.from(a);
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
    return new O(
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
    const o = [], i = [this.rootNode];
    for (; i.length > 0; ) {
      const r = this.nodes[i.pop()], a = Math.max(0, s - 3) * r.maxSplatRadius, d = a === 0 ? r.raycastBounds : r.raycastBounds.clone().expandByScalar(a);
      if (e.intersectsBox(d))
        if (r.gaussianIndices !== null)
          for (const h of r.gaussianIndices) o.push(h);
        else
          for (const h of r.children) i.push(h);
    }
    return this.raycastIndices(e, o, s, n);
  }
  raycastIndices(e, t, s = 3, n = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(n > 0)) return [];
    const o = this.data.means.array, i = this.data.scalesOpacity.array, r = new I(), a = new I(), d = [];
    for (let h = 0; h < t.length; h++) {
      const f = t[h], u = f * 4;
      r.set(o[u], o[u + 1], o[u + 2]);
      const y = Math.max(
        i[u],
        i[u + 1],
        i[u + 2]
      ) * s;
      e.closestPointToPoint(r, a), !(a.distanceToSquared(r) > y * y) && d.push({
        gaussianIndex: f,
        distance: e.origin.distanceTo(a),
        point: a.clone()
      });
    }
    return d.sort((h, f) => h.distance - f.distance), d.length > n && (d.length = n), d;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function ue(l) {
  const e = l.means.array, t = new B(), s = new I();
  for (let n = 0; n < l.count; n++) {
    const o = n * 4;
    s.set(e[o], e[o + 1], e[o + 2]), t.expandByPoint(s);
  }
  return t;
}
function he(l) {
  const e = l.getCenter(new I()), t = l.getSize(new I()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new B(
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
  return new B(
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
const pe = /* @__PURE__ */ new Set([
  "means",
  "scalesOpacity",
  "rotations",
  "shCoefficients",
  "lodLevel"
]), ge = new j();
class we {
  listeners = /* @__PURE__ */ new Set();
  clouds = /* @__PURE__ */ new Map();
  usedCloudIds = /* @__PURE__ */ new Set();
  usedCommandIds = /* @__PURE__ */ new Set();
  cancelled = /* @__PURE__ */ new Set();
  pendingCommands = /* @__PURE__ */ new Set();
  activeLoads = /* @__PURE__ */ new Map();
  parser = new ne();
  config;
  frontend = null;
  work = Promise.resolve();
  nextObjectId = 0;
  layoutVersion = 0;
  contentVersion = 0;
  sceneRevision = 0;
  cameraPosition = new I();
  packed = null;
  target = null;
  updateScheduled = !1;
  sceneUpdateTimer = null;
  pendingTransforms = [];
  disposed = !1;
  constructor(e) {
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
      this.pendingCommands.has(e.targetCommandId) && (this.cancelled.add(e.targetCommandId), this.activeLoads.get(e.targetCommandId)?.abort()), this.emit({ type: "command-completed", commandId: e.id });
      return;
    }
    this.pendingCommands.add(e.id), this.work = this.work.then(async () => {
      try {
        if (this.cancelled.delete(e.id)) {
          this.emit({ type: "command-cancelled", commandId: e.id });
          return;
        }
        await this.handle(e);
      } catch (t) {
        this.cancelled.delete(e.id) ? this.emit({ type: "command-cancelled", commandId: e.id }) : this.emit({
          type: "error",
          commandId: e.id,
          cloudId: "cloudId" in e ? e.cloudId : void 0,
          code: t instanceof RangeError ? "invalid-range" : "backend-error",
          message: t instanceof Error ? t.message : String(t)
        });
      } finally {
        this.pendingCommands.delete(e.id);
      }
    });
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0, this.sceneUpdateTimer !== null && clearTimeout(this.sceneUpdateTimer);
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
        try {
          let s;
          if (e.type === "load-cloud") {
            const f = await fetch(e.url, {
              signal: t.signal
            });
            if (!f.ok)
              throw new Error(`PLY fetch failed: ${f.status}`);
            if (f.headers.get("content-type")?.includes("text/html"))
              throw new Error("PLY URL returned HTML instead of a PLY file");
            const u = await f.arrayBuffer();
            if (t.signal.aborted) throw new DOMException("Load cancelled", "AbortError");
            s = this.parser.parse(u);
          } else
            s = this.parser.parse(e.buffer);
          const n = e.options ?? {}, o = O.build(s, n.octree), i = A.build(o, n.lod), r = {
            id: e.cloudId,
            objectId: this.nextObjectId++,
            source: s,
            octree: o,
            lod: i,
            octreeOptions: n.octree,
            lodOptions: n.lod,
            attributes: /* @__PURE__ */ new Map(),
            transform: ge.clone(),
            priority: $(n.priority ?? 0),
            packingStrategy: n.packingStrategy ?? this.config.defaultPackingStrategy ?? { type: "tiered-radial" },
            raycastable: n.raycastable ?? !0,
            sourceVersion: 1
          };
          for (const f of n.attributes ?? []) {
            if (pe.has(f.name) || r.attributes.has(f.name))
              throw new Error(
                `Reserved or duplicate attribute name: ${f.name}`
              );
            r.attributes.set(
              f.name,
              me(f, s.count)
            );
          }
          for (const f of this.clouds.values())
            for (const [u, y] of r.attributes) {
              const p = f.attributes.get(u);
              if (p && (p.format !== y.format || p.elementsPerGaussian !== y.elementsPerGaussian))
                throw new Error(
                  `Attribute schema differs across clouds: ${u}`
                );
            }
          this.usedCloudIds.add(r.id), this.clouds.set(r.id, r);
          let a = null;
          if (this.frontend)
            try {
              a = this.compute();
            } catch (f) {
              throw this.clouds.delete(r.id), this.usedCloudIds.delete(r.id), f;
            }
          const { min: d, max: h } = o.bounds;
          this.emit({
            type: "cloud-loaded",
            commandId: e.id,
            cloudId: r.id,
            objectId: r.objectId,
            sourceCount: s.count,
            shDegree: s.shDegree,
            bounds: [d.x, d.y, d.z, h.x, h.y, h.z],
            raycast: r.raycastable ? G(o) : void 0
          }), a && (this.target = null, this.replace(a));
          return;
        } finally {
          this.activeLoads.delete(e.id);
        }
      }
      case "unload-cloud":
        this.clouds.delete(e.cloudId), this.emit({
          type: "cloud-unloaded",
          commandId: e.id,
          cloudId: e.cloudId
        }), this.repack();
        return;
      case "set-cloud-priority":
        {
          const t = this.getCloud(e.cloudId), s = t.priority;
          t.priority = $(e.priority);
          try {
            this.repack();
          } catch (n) {
            throw t.priority = s, n;
          }
        }
        break;
      case "set-cloud-packing":
        {
          const t = this.getCloud(e.cloudId), s = t.packingStrategy;
          t.packingStrategy = e.packingStrategy;
          try {
            this.repack();
          } catch (n) {
            throw t.packingStrategy = s, n;
          }
        }
        break;
      case "set-cloud-transform": {
        const t = this.getCloud(e.cloudId);
        if (e.worldMatrix.length !== 16)
          throw new RangeError("Cloud transform needs sixteen numbers");
        if (e.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = e.sceneRevision, t.transform.fromArray(e.worldMatrix), this.pendingTransforms.push(e.id), this.scheduleSceneUpdate();
        return;
      }
      case "set-cloud-raycastable": {
        const t = this.getCloud(e.cloudId);
        t.raycastable = e.raycastable, this.emit({
          type: "cloud-raycast-changed",
          commandId: e.id,
          cloudId: t.id,
          raycastable: t.raycastable,
          raycast: t.raycastable ? G(t.octree) : void 0
        });
        return;
      }
      case "write-attribute-range":
        this.writeRange(e), this.updateTarget();
        break;
      case "set-frontend-capabilities": {
        const { capabilities: t } = e;
        for (const n of [
          t.maxStorageBufferBindingSize,
          t.maxBufferSize,
          t.maxStorageBuffersPerShaderStage
        ])
          if (!Number.isSafeInteger(n) || n <= 0)
            throw new RangeError("Frontend buffer limits must be positive integers");
        if (typeof t.supportsPartialBufferUpdates != "boolean")
          throw new TypeError("Frontend partial update support must be boolean");
        const s = this.frontend;
        this.frontend = { ...t };
        try {
          this.clouds.size > 0 && this.repack();
        } catch (n) {
          throw this.frontend = s, n;
        }
        break;
      }
      case "set-camera":
        if (e.worldMatrix.length !== 16 || e.projectionMatrix.length !== 16)
          throw new RangeError("Camera matrices need sixteen numbers each");
        if (e.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = e.sceneRevision, this.cameraPosition.set(
          e.worldMatrix[12],
          e.worldMatrix[13],
          e.worldMatrix[14]
        ), this.flushSceneUpdate();
        break;
    }
    this.emit({ type: "command-completed", commandId: e.id });
  }
  scheduleSceneUpdate() {
    this.sceneUpdateTimer !== null && clearTimeout(this.sceneUpdateTimer), this.sceneUpdateTimer = setTimeout(() => {
      if (this.sceneUpdateTimer = null, !this.disposed)
        try {
          this.flushSceneUpdate();
        } catch {
        }
    }, 16);
  }
  flushSceneUpdate() {
    this.sceneUpdateTimer !== null && clearTimeout(this.sceneUpdateTimer), this.sceneUpdateTimer = null;
    const e = this.pendingTransforms.splice(0);
    try {
      this.updateTarget();
      for (const t of e)
        this.emit({ type: "command-completed", commandId: t });
    } catch (t) {
      for (const s of e)
        this.emit({
          type: "error",
          commandId: s,
          code: t instanceof RangeError ? "invalid-range" : "backend-error",
          message: t instanceof Error ? t.message : String(t)
        });
      throw t;
    }
  }
  getCloud(e) {
    const t = this.clouds.get(e);
    if (!t) throw new Error(`Unknown cloud: ${e}`);
    return t;
  }
  writeRange(e) {
    const t = this.getCloud(e.cloudId), {
      firstGaussian: s,
      gaussianCount: n,
      attribute: o
    } = e;
    if (!Number.isSafeInteger(s) || !Number.isSafeInteger(n) || s < 0 || n < 0 || s + n > t.source.count)
      throw new RangeError("Attribute range exceeds source cloud");
    if (o === "lodLevel")
      throw new Error("lodLevel is computed by the backend");
    let i, r;
    switch (o) {
      case "means":
        i = t.source.means.array, r = 4;
        break;
      case "scalesOpacity":
        i = t.source.scalesOpacity.array, r = 4;
        break;
      case "rotations":
        i = t.source.rotations.array, r = 4;
        break;
      case "shCoefficients":
        i = t.source.shCoefficients.array, r = t.source.shCoefficientCount * 4;
        break;
      default: {
        const d = t.attributes.get(o);
        if (!d) throw new Error(`Unknown source attribute: ${o}`);
        i = d.values, r = d.elementsPerGaussian;
      }
    }
    if (e.data.byteLength !== n * r * 4)
      throw new RangeError("Attribute update has the wrong byte length");
    const a = i instanceof Uint32Array ? new Uint32Array(e.data) : new Float32Array(e.data);
    if (i.set(a, s * r), (o === "means" || o === "scalesOpacity" || o === "rotations") && (t.octree = O.build(t.source, t.octreeOptions), t.lod = A.build(t.octree, t.lodOptions), t.sourceVersion++, t.raycastable)) {
      const { min: d, max: h } = t.octree.bounds;
      this.emit({
        type: "raycast-replaced",
        cloudId: t.id,
        sourceVersion: t.sourceVersion,
        bounds: [d.x, d.y, d.z, h.x, h.y, h.z],
        raycast: G(t.octree)
      });
    }
  }
  maxSlots(e, t) {
    const s = this.frontend;
    if (!s)
      throw new Error("Frontend capabilities have not been supplied");
    const n = Math.min(
      s.maxStorageBufferBindingSize,
      s.maxBufferSize
    ), o = [
      16,
      16,
      16,
      (e + 1) ** 2 * 4,
      4,
      ...[...t.values()].map((r) => r.elementsPerGaussian * 4)
    ], i = Math.min(
      ...o.map((r) => Math.floor(n / r))
    );
    if (i < 1)
      throw new RangeError("Frontend buffer limits are too small");
    return Math.min(
      i,
      this.config.maxGaussians === "auto" || this.config.maxGaussians === void 0 ? i : this.config.maxGaussians
    );
  }
  compute(e = 0) {
    const t = [...this.clouds.values()].sort(
      (g, b) => g.priority - b.priority || g.objectId - b.objectId
    ), s = t.reduce(
      (g, b) => Math.max(g, b.source.shDegree),
      0
    ), n = /* @__PURE__ */ new Map();
    for (const g of t)
      for (const [b, v] of g.attributes) n.set(b, v);
    let o = this.maxSlots(s, n);
    const i = [];
    for (const g of t) {
      const b = this.select(
        g,
        Math.min(o, g.source.count)
      ), v = g.lod.indicesForPacking(b), L = new Uint32Array(v.length), E = [];
      let P = 0;
      for (let R = 0; R < b.nodeIds.length; R++) {
        const U = g.lod.nodes[b.nodeIds[R]], S = b.lodLevels[R], k = U.levelCounts[S];
        L.fill(S, P, P + k), P += k, E.push(P);
      }
      i.push({ entry: g, indices: v, levels: L, cellEnds: E }), o -= v.length;
    }
    const r = i.reduce(
      (g, b) => g + b.indices.length,
      0
    ), a = Math.max(1, r, e), d = /* @__PURE__ */ new Map(), h = (g, b, v) => {
      const L = b === "f32" ? new Float32Array(a * v) : new Uint32Array(a * v);
      return d.set(g, { format: b, elementsPerGaussian: v, values: L }), L;
    }, f = h("means", "f32", 4), u = h("scalesOpacity", "f32", 4), y = h("rotations", "f32", 4), p = h("shCoefficients", "u32", (s + 1) ** 2), w = h("lodLevel", "u32", 1), c = new Uint32Array(a);
    for (const [g, b] of n)
      h(g, b.format, b.elementsPerGaussian);
    const m = [];
    let C = 0, x = 1;
    for (const { entry: g, indices: b, levels: v, cellEnds: L } of i) {
      const E = g.source, P = E.shCoefficients.array;
      let R = 0;
      for (let U = 0; U < b.length; U++, C++) {
        for (; U >= L[R]; ) R++;
        c[C] = x + R;
        const S = b[U];
        f.set(
          E.means.array.subarray(S * 4, S * 4 + 4),
          C * 4
        ), f[C * 4 + 3] = g.objectId, u.set(
          E.scalesOpacity.array.subarray(S * 4, S * 4 + 4),
          C * 4
        ), y.set(
          E.rotations.array.subarray(S * 4, S * 4 + 4),
          C * 4
        ), w[C] = v[U];
        for (let k = 0; k < E.shCoefficientCount; k++) {
          const M = (S * E.shCoefficientCount + k) * 4;
          p[C * (s + 1) ** 2 + k] = q(
            P[M],
            P[M + 1],
            P[M + 2]
          );
        }
        for (const [k, M] of g.attributes) {
          const Y = d.get(k).values, T = M.elementsPerGaussian;
          Y.set(
            M.values.subarray(S * T, (S + 1) * T),
            C * T
          );
        }
      }
      x += L.length, m.push({
        cloudId: g.id,
        objectId: g.objectId,
        renderedCount: b.length
      });
    }
    return { capacity: a, count: r, degree: s, attributes: d, cells: c, clouds: m };
  }
  select(e, t) {
    const s = this.cameraPosition.clone().applyMatrix4(e.transform.clone().invert()), n = e.packingStrategy;
    switch (n.type) {
      case "maximum":
        return new J().pack({
          lod: e.lod,
          maxGaussians: t
        });
      case "radial":
        return new Q({
          center: s,
          lodLevel: n.lodLevel
        }).pack({ lod: e.lod, maxGaussians: t });
      case "tiered-radial":
        return new Z({
          center: s,
          budgetShares: n.budgetShares
        }).pack({ lod: e.lod, maxGaussians: t });
      case "distance-aware-radial":
        return new H({
          center: s,
          levelDistance: n.levelDistance
        }).pack({ lod: e.lod, maxGaussians: t });
    }
  }
  repack() {
    if (!this.frontend) return;
    this.target = null;
    const e = this.compute();
    this.replace(e);
  }
  updateTarget() {
    if (!this.frontend || !this.packed) return;
    const e = this.compute(this.packed.capacity);
    if (!this.frontend.supportsPartialBufferUpdates) {
      this.replace(e);
      return;
    }
    if (e.capacity !== this.packed.capacity || e.degree !== this.packed.degree || [...e.attributes].some(
      ([t, s]) => this.packed?.attributes.get(t)?.elementsPerGaussian !== s.elementsPerGaussian
    )) {
      this.replace(e);
      return;
    }
    this.target = e, this.scheduleUpdate();
  }
  replace(e) {
    this.packed = e, this.layoutVersion++, this.contentVersion++;
    const t = [...e.attributes].map(
      ([s, n]) => ({
        name: s,
        format: n.format,
        elementsPerGaussian: n.elementsPerGaussian,
        data: n.values.slice().buffer
      })
    );
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
    const e = this.packed, t = this.target, s = this.config.streamingLod?.maxUploadBytesPerUpdate ?? 1024 * 1024, n = Math.max(
      1,
      this.config.streamingLod?.maxChangedCellsPerUpdate ?? 16
    ), o = [...e.attributes.values()].reduce(
      (u, y) => u + y.elementsPerGaussian * 4,
      0
    ), i = Math.max(1, Math.floor(s / o)), r = [], a = /* @__PURE__ */ new Set();
    for (let u = 0; u < e.capacity && r.length < i; u++)
      if ([...e.attributes].some(([y, p]) => {
        const w = t.attributes.get(y).values, c = u * p.elementsPerGaussian;
        for (let m = 0; m < p.elementsPerGaussian; m++)
          if (p.values[c + m] !== w[c + m]) return !0;
        return !1;
      })) {
        const y = t.cells[u];
        if (!a.has(y) && a.size >= n) break;
        a.add(y), r.push(u);
      }
    const d = [];
    if (r.length === 0) {
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
      this.packed = {
        ...e,
        count: t.count,
        clouds: t.clouds,
        cells: t.cells
      }, this.target = null;
      return;
    }
    for (const [u, y] of e.attributes) {
      const p = y.elementsPerGaussian, w = t.attributes.get(u).values;
      let c = -1, m = -1;
      const C = () => {
        if (c < 0) return;
        const x = c * p, g = (m + 1) * p;
        y.values.set(w.subarray(x, g), x), d.push({
          name: u,
          firstSlot: c,
          slotCount: m - c + 1,
          data: w.slice(x, g).buffer
        }), c = -1;
      };
      for (const x of r) {
        const g = x * p;
        let b = !1;
        for (let v = 0; v < p; v++)
          if (y.values[g + v] !== w[g + v]) {
            b = !0;
            break;
          }
        if (!b) {
          C();
          continue;
        }
        c < 0 ? c = x : x !== m + 1 && (C(), c = x), m = x;
      }
      C();
    }
    const h = [...e.attributes].some(([u, y]) => {
      const p = t.attributes.get(u).values;
      return y.values.some((w, c) => w !== p[c]);
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
    }), h ? this.scheduleUpdate() : (this.packed = {
      ...e,
      count: t.count,
      clouds: t.clouds,
      cells: t.cells
    }, this.target = null);
  }
}
function $(l) {
  if (!Number.isSafeInteger(l))
    throw new RangeError("Priority must be a safe integer");
  return l;
}
function me(l, e) {
  const t = l.elementsPerGaussian;
  if (!Number.isSafeInteger(t) || t < 1)
    throw new RangeError("Attribute elementsPerGaussian must be positive");
  const s = e * t, n = l.format === "f32" ? new Float32Array(s) : new Uint32Array(s);
  if (l.source.kind === "fill")
    n.fill(l.source.value === "ones" ? 1 : 0);
  else {
    if (l.source.data.byteLength !== s * 4)
      throw new RangeError("Attribute buffer has the wrong byte length");
    n.set(
      l.format === "f32" ? new Float32Array(l.source.data) : new Uint32Array(l.source.data)
    );
  }
  return { format: l.format, elementsPerGaussian: t, values: n };
}
export {
  we as StreamingGaussianBackend
};
