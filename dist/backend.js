import { Vector3 as x, Box3 as B, Matrix4 as Z } from "three";
function K(c, e, t) {
  const s = Math.max(Math.abs(c), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const n = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), o = 127 / 2 ** n, i = _(c, o), r = _(e, o), a = _(t, o), d = n + 127;
  return (i | r << 8 | a << 16 | d << 24) >>> 0;
}
function _(c, e) {
  return Math.min(127, Math.max(-127, Math.round(c * e))) & 255;
}
function N(c) {
  if (!Number.isInteger(c) || c < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
function G(c, e, t) {
  return c.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), c.getWorldPosition(t), e.worldToLocal(t);
}
function F(c, e) {
  const t = e instanceof x ? e.clone() : c.octree.bounds.getCenter(new x()), s = c.octree.rootBounds.getSize(new x()), n = Math.max(s.length() * 0.5, Number.EPSILON), o = new x(), i = Array.from(c.octree.leafNodeIds, (r) => (c.octree.nodes[r].bounds.getCenter(o), {
    nodeId: r,
    radius: o.distanceTo(t) / n
  }));
  return i.sort(
    (r, a) => r.radius - a.radius || r.nodeId - a.nodeId
  ), i;
}
class ee {
  cameraCenter = new x();
  center;
  levelDistance;
  constructor(e = {}) {
    if (this.center = e.center instanceof x ? e.center.clone() : e.center ?? "bounds-center", this.levelDistance = e.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(e) {
    return this.center = e instanceof x ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      G(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return te();
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
function te() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class se {
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
class ne {
  cameraCenter = new x();
  center;
  lodLevel;
  constructor(e = {}) {
    if (this.center = e.center instanceof x ? e.center.clone() : e.center ?? "bounds-center", e.lodLevel !== void 0 && e.lodLevel !== "finest" && (!Number.isInteger(e.lodLevel) || e.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = e.lodLevel ?? "finest";
  }
  setCenter(e) {
    return this.center = e instanceof x ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      G(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return re();
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
function re() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class oe {
  cameraCenter = new x();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof x ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = ae(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof x ? e.clone() : e, this;
  }
  setFromCamera(e, t) {
    return this.setCenter(
      G(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return ie();
    const s = e.octree.data.count;
    if (s <= t) {
      const f = e.octree.leafNodeIds.slice(), h = new Uint8Array(f.length);
      return h.fill(e.finestLevel), { nodeIds: f, lodLevels: h, gaussianCount: s };
    }
    const n = F(e, this.center), o = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], i = [], r = [];
    let a = 0, d = 0, u = 0;
    for (let f = 0; f < o.length; f++) {
      const h = this.budgetShares[f];
      if (u += h, h === 0) continue;
      const p = f === o.length - 1 ? t : Math.floor(t * u), g = o[f];
      for (; d < n.length; ) {
        const y = n[d], l = e.nodes[y.nodeId].levelCounts[g];
        if (a + l > p) break;
        i.push(y.nodeId), r.push(g), a += l, d++;
      }
    }
    return {
      nodeIds: Uint32Array.from(i),
      lodLevels: Uint8Array.from(r),
      gaussianCount: a
    };
  }
}
function ae(c) {
  let e = 0;
  for (const t of c) {
    if (!(t >= 0 && t <= 1))
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    e += t;
  }
  if (Math.abs(e - 1) > 1e-6)
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  return Object.freeze([...c]);
}
function ie() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class ce {
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
function z(c) {
  let e = c.next();
  for (; !e.done; ) e = c.next();
  return e.value;
}
async function V(c, e) {
  let t = c.next();
  for (; !t.done; ) {
    if (await new Promise((s) => setTimeout(s, 0)), e.aborted) throw new DOMException("Load cancelled", "AbortError");
    t = c.next();
  }
  if (e.aborted) throw new DOMException("Load cancelled", "AbortError");
  return t.value;
}
const $ = {
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
}, le = [
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
class de {
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
    return z(this.parseChunks(e));
  }
  async parseAsync(e, t) {
    return V(this.parseChunks(e), t);
  }
  *parseChunks(e) {
    const t = ue(e), s = new Map(
      t.properties.map((l, b) => [l.name, b])
    );
    for (const l of le)
      if (!s.has(l))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${l}`);
    const n = t.properties.map((l) => l.name.match(/^f_rest_(\d+)$/)?.[1]).filter((l) => l !== void 0).map(Number).sort((l, b) => l - b);
    for (let l = 0; l < n.length; l++)
      if (n[l] !== l)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (n.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const o = n.length / 3, i = o + 1, r = Math.sqrt(i);
    if (!Number.isInteger(r) || r < 1 || r > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const a = he(e, t), d = (l) => s.get(l), u = n.map(
      (l) => d(`f_rest_${l}`)
    ), f = t.vertexCount, h = new Float32Array(f * 4), p = new Float32Array(f * 4), g = new Float32Array(f * 4), y = new Float32Array(f * i * 4);
    for (let l = 0; l < f; l++) {
      l > 0 && l % 4096 === 0 && (yield);
      const b = l * 4;
      h[b] = a(l, d("x")), h[b + 1] = a(l, d("y")), h[b + 2] = a(l, d("z")), p[b] = Math.max(
        Math.exp(a(l, d("scale_0"))),
        1e-6
      ), p[b + 1] = Math.max(
        Math.exp(a(l, d("scale_1"))),
        1e-6
      ), p[b + 2] = Math.max(
        Math.exp(a(l, d("scale_2"))),
        1e-6
      );
      const C = a(l, d("opacity"));
      p[b + 3] = 1 / (1 + Math.exp(-C));
      const L = a(l, d("rot_0")), m = a(l, d("rot_1")), w = a(l, d("rot_2")), v = a(l, d("rot_3")), I = Math.hypot(m, w, v, L);
      I > 1e-12 ? (g[b] = m / I, g[b + 1] = w / I, g[b + 2] = v / I, g[b + 3] = L / I) : g[b + 3] = 1;
      const S = l * i * 4;
      y[S] = a(l, d("f_dc_0")), y[S + 1] = a(l, d("f_dc_1")), y[S + 2] = a(l, d("f_dc_2"));
      for (let k = 1; k < i; k++) {
        const A = S + k * 4, R = k - 1;
        for (let E = 0; E < 3; E++) {
          const P = u[E * o + R];
          y[A + E] = a(
            l,
            P
          );
        }
      }
    }
    return new ce(
      f,
      r - 1,
      h,
      p,
      g,
      y
    );
  }
}
function ue(c) {
  const e = new Uint8Array(c), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let g = 0; g <= e.length - t.length; g++) {
    let y = !0;
    for (let l = 0; l < t.length; l++)
      if (e[g + l] !== t[l]) {
        y = !1;
        break;
      }
    if (y) {
      s = g;
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
  let r = null, a = "", d = -1, u = 0;
  const f = [], h = [];
  for (const g of i) {
    const y = g.trim().split(/\s+/);
    if (y[0] === "format") {
      if (y[1] !== "ascii" && y[1] !== "binary_little_endian" && y[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${y[1] ?? "unknown"}`);
      r = y[1];
    } else if (y[0] === "element") {
      a = y[1] ?? "";
      const l = Number(y[2]);
      if (!Number.isInteger(l) || l < 0)
        throw new Error(`Invalid element count for ${a}`);
      h.push({ name: a, count: l }), a === "vertex" && (d = l);
    } else if (y[0] === "property" && a === "vertex") {
      if (y[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const l = y[1], b = y[2];
      if (!(l in $) || b === void 0)
        throw new Error(`Unsupported vertex property: ${g}`);
      f.push({ name: b, type: l, byteOffset: u }), u += $[l];
    }
  }
  if (r === null) throw new Error("Invalid PLY: format is missing");
  if (d <= 0) throw new Error("PLY must contain at least one vertex");
  if (h.find(
    (g) => g.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: r, vertexCount: d, properties: f, vertexStride: u, dataOffset: n };
}
function he(c, e) {
  if (e.format === "ascii") {
    const o = new TextDecoder().decode(
      new Uint8Array(c, e.dataOffset)
    ), i = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let r = 0;
    for (let a = 0; a < i.length; a++) {
      for (; r < o.length && /\s/.test(o[r]); ) r++;
      const d = r;
      for (; r < o.length && !/\s/.test(o[r]); ) r++;
      const u = Number(o.slice(d, r));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${a}`);
      i[a] = u;
    }
    return (a, d) => i[a * e.properties.length + d];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > c.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(c), n = e.format === "binary_little_endian";
  return (o, i) => {
    const r = e.properties[i], a = e.dataOffset + o * e.vertexStride + r.byteOffset;
    return fe(s, a, r.type, n);
  };
}
function fe(c, e, t, s) {
  switch (t) {
    case "char":
    case "int8":
      return c.getInt8(e);
    case "uchar":
    case "uint8":
      return c.getUint8(e);
    case "short":
    case "int16":
      return c.getInt16(e, s);
    case "ushort":
    case "uint16":
      return c.getUint16(e, s);
    case "int":
    case "int32":
      return c.getInt32(e, s);
    case "uint":
    case "uint32":
      return c.getUint32(e, s);
    case "float":
    case "float32":
      return c.getFloat32(e, s);
    case "double":
    case "float64":
      return c.getFloat64(e, s);
  }
}
function D(c) {
  const e = c.nodes, t = new Float32Array(e.length * 7), s = new Uint32Array(e.length * 2), n = new Uint32Array(e.length * 2), o = [], i = [];
  for (const a of e) {
    const d = a.id * 7, { min: u, max: f } = a.raycastBounds;
    if (t.set(
      [u.x, u.y, u.z, f.x, f.y, f.z, a.maxSplatRadius],
      d
    ), s.set([o.length, a.children.length], a.id * 2), o.push(...a.children), n.set(
      [i.length, a.gaussianIndices?.length ?? 0],
      a.id * 2
    ), a.gaussianIndices !== null)
      for (const h of a.gaussianIndices) i.push(h);
  }
  const r = c.data;
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
class Y {
  constructor(e, t, s) {
    this.octreeNodeId = e, this.sortedGaussianIndices = t, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const j = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class M {
  constructor(e, t, s, n) {
    this.octree = e, this.ownsOctree = n, this.levels = t, this.nodes = s;
  }
  octree;
  ownsOctree;
  static build(e, t = {}) {
    const s = H(t.levels ?? j);
    return new M(
      e,
      s,
      z(q(e, s, t)),
      t.ownsOctree ?? !1
    );
  }
  static async buildAsync(e, t = {}, s) {
    const n = H(t.levels ?? j), o = await V(q(e, n, t), s);
    return new M(e, n, o, t.ownsOctree ?? !1);
  }
  levels;
  nodes;
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
      for (let u = 0; u < d; u++)
        t[n++] = r.sortedGaussianIndices[u];
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
    const i = this.octree.data.means.array, r = this.octree.data.scalesOpacity.array, a = new x(), d = new x(), u = [], f = /* @__PURE__ */ new Set();
    for (let h = 0; h < t.nodeIds.length; h++) {
      const p = t.nodeIds[h], g = this.getLeafNode(p);
      if (f.has(p))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${p}`
        );
      f.add(p);
      const y = t.lodLevels[h], l = g.levelCounts[y];
      if (l === void 0)
        throw new RangeError(`GaussianLod level ${y} does not exist`);
      const b = this.octree.nodes[p], C = Math.max(0, n - 3) * b.maxSplatRadius, L = C === 0 ? b.raycastBounds : b.raycastBounds.clone().expandByScalar(C);
      if (e.intersectsBox(L))
        for (let m = 0; m < l; m++) {
          const w = g.sortedGaussianIndices[m], v = w * 4;
          a.set(i[v], i[v + 1], i[v + 2]);
          const I = Math.max(
            r[v],
            r[v + 1],
            r[v + 2]
          ) * n;
          e.closestPointToPoint(a, d), !(d.distanceToSquared(a) > I * I) && u.push({
            gaussianIndex: w,
            distance: e.origin.distanceTo(d),
            point: d.clone()
          });
        }
    }
    return u.sort((h, p) => h.distance - p.distance), u.length > o && (u.length = o), u;
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
function* q(c, e, t) {
  const s = t.importance ?? ge, n = new Float64Array(c.data.count);
  for (let i = 0; i < n.length; i++) {
    i > 0 && i % 8192 === 0 && (yield);
    const r = s(i, c);
    n[i] = Number.isFinite(r) ? r : -1 / 0;
  }
  const o = [];
  for (const i of c.nodes) {
    if (o.length > 0 && o.length % 8192 === 0 && (yield), i.gaussianIndices === null) {
      o.push(new Y(
        i.id,
        new Uint32Array(),
        new Uint32Array(e.length)
      ));
      continue;
    }
    const r = Uint32Array.from(
      Array.from(i.gaussianIndices).sort(
        (a, d) => n[d] - n[a] || a - d
      )
    );
    o.push(new Y(
      i.id,
      r,
      Uint32Array.from(e.map(({ retention: a }) => Math.min(
        r.length,
        Math.max(1, Math.ceil(r.length * a))
      )))
    ));
  }
  return o;
}
function H(c) {
  if (c.length === 0 || c.length > 256)
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  let e = 0;
  const t = c.map(({ retention: s }) => {
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
function ge(c, e) {
  const t = e.data.scalesOpacity.array, s = c * 4, n = [t[s], t[s + 1], t[s + 2]];
  return n.sort((o, i) => i - o), t[s + 3] * n[0] * n[1];
}
class pe {
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
  constructor(e, t, s, n, o) {
    this.data = e, this.leafCapacity = t, this.maxDepth = s, this.ownsData = n, this.bounds = o.bounds, this.rootBounds = o.rootBounds, this.nodes = o.nodes, this.leafNodeIds = o.leafNodeIds;
  }
  data;
  leafCapacity;
  maxDepth;
  ownsData;
  static build(e, t = {}) {
    const [s, n] = W(t);
    return new O(
      e,
      s,
      n,
      t.ownsData ?? !1,
      z(J(e, s, n))
    );
  }
  static async buildAsync(e, t = {}, s) {
    const [n, o] = W(t), i = await V(J(e, n, o), s);
    return new O(e, n, o, t.ownsData ?? !1, i);
  }
  bounds;
  rootBounds;
  rootNode = 0;
  nodes;
  leafNodeIds;
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
          for (const u of r.gaussianIndices) o.push(u);
        else
          for (const u of r.children) i.push(u);
    }
    return this.raycastIndices(e, o, s, n);
  }
  raycastIndices(e, t, s = 3, n = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(n > 0)) return [];
    const o = this.data.means.array, i = this.data.scalesOpacity.array, r = new x(), a = new x(), d = [];
    for (let u = 0; u < t.length; u++) {
      const f = t[u], h = f * 4;
      r.set(o[h], o[h + 1], o[h + 2]);
      const p = Math.max(
        i[h],
        i[h + 1],
        i[h + 2]
      ) * s;
      e.closestPointToPoint(r, a), !(a.distanceToSquared(r) > p * p) && d.push({
        gaussianIndex: f,
        distance: e.origin.distanceTo(a),
        point: a.clone()
      });
    }
    return d.sort((u, f) => u.distance - f.distance), d.length > n && (d.length = n), d;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function W(c) {
  const e = c.leafCapacity ?? 256, t = c.maxDepth ?? 10;
  if (!Number.isInteger(e) || e <= 0)
    throw new RangeError("GaussianOctree leafCapacity must be positive");
  if (!Number.isInteger(t) || t < 0)
    throw new RangeError("GaussianOctree maxDepth must be non-negative");
  return [e, t];
}
function* J(c, e, t) {
  const s = c.means.array, n = c.scalesOpacity.array, o = new B(), i = new x();
  for (let p = 0; p < c.count; p++) {
    p > 0 && p % 8192 === 0 && (yield);
    const g = p * 4;
    i.set(s[g], s[g + 1], s[g + 2]), o.expandByPoint(i);
  }
  const r = ye(o), a = [], d = [], u = Array.from({ length: c.count }, (p, g) => g);
  let f = 0;
  function* h(p, g, y) {
    const l = a.length;
    a.push(null);
    const b = p.length > e && y < t && g.max.x - g.min.x > Number.EPSILON, C = [];
    if (b) {
      const w = g.getCenter(new x()), v = Array.from({ length: 8 }, () => []);
      for (const I of p) {
        ++f % 8192 === 0 && (yield);
        const S = I * 4, k = (s[S] >= w.x ? 1 : 0) | (s[S + 1] >= w.y ? 2 : 0) | (s[S + 2] >= w.z ? 4 : 0);
        v[k].push(I);
      }
      for (let I = 0; I < 8; I++) {
        const S = v[I];
        S.length !== 0 && C.push(yield* h(S, we(g, w, I), y + 1));
      }
    }
    let L = 0;
    if (C.length > 0)
      for (const w of C)
        L = Math.max(L, a[w].maxSplatRadius);
    else {
      for (const w of p) {
        ++f % 8192 === 0 && (yield);
        const v = w * 4;
        L = Math.max(
          L,
          n[v],
          n[v + 1],
          n[v + 2]
        );
      }
      d.push(l);
    }
    const m = g.clone().expandByScalar(L * 3);
    return a[l] = new pe(
      l,
      y,
      g,
      p.length,
      L,
      C,
      C.length === 0 ? Uint32Array.from(p) : null,
      m
    ), l;
  }
  return yield* h(u, r.clone(), 0), { bounds: o, rootBounds: r, nodes: a, leafNodeIds: Uint32Array.from(d) };
}
function ye(c) {
  const e = c.getCenter(new x()), t = c.getSize(new x()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new B(
    new x(
      e.x - s,
      e.y - s,
      e.z - s
    ),
    new x(
      e.x + s,
      e.y + s,
      e.z + s
    )
  );
}
function we(c, e, t) {
  return new B(
    new x(
      t & 1 ? e.x : c.min.x,
      t & 2 ? e.y : c.min.y,
      t & 4 ? e.z : c.min.z
    ),
    new x(
      t & 1 ? c.max.x : e.x,
      t & 2 ? c.max.y : e.y,
      t & 4 ? c.max.z : e.z
    )
  );
}
const me = /* @__PURE__ */ new Set([
  "means",
  "scalesOpacity",
  "rotations",
  "shCoefficients",
  "lodLevel"
]), be = new Z();
class ve {
  listeners = /* @__PURE__ */ new Set();
  clouds = /* @__PURE__ */ new Map();
  usedCloudIds = /* @__PURE__ */ new Set();
  usedCommandIds = /* @__PURE__ */ new Set();
  cancelled = /* @__PURE__ */ new Set();
  pendingCommands = /* @__PURE__ */ new Set();
  activeLoads = /* @__PURE__ */ new Map();
  parser = new de();
  config;
  work = Promise.resolve();
  nextObjectId = 0;
  layoutVersion = 0;
  contentVersion = 0;
  sceneRevision = 0;
  cameraPosition = new x();
  packed = null;
  target = null;
  updateScheduled = !1;
  sceneUpdateTimer = null;
  pendingTransforms = [];
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
            const h = await f.arrayBuffer();
            await this.loadCheckpoint(t.signal), s = await this.parser.parseAsync(h, t.signal);
          } else
            await this.loadCheckpoint(t.signal), s = await this.parser.parseAsync(
              e.buffer,
              t.signal
            );
          await this.loadCheckpoint(t.signal);
          const n = e.options ?? {}, o = await O.buildAsync(s, n.octree, t.signal);
          await this.loadCheckpoint(t.signal);
          const i = await M.buildAsync(o, n.lod, t.signal);
          await this.loadCheckpoint(t.signal);
          const r = {
            id: e.cloudId,
            objectId: this.nextObjectId++,
            source: s,
            octree: o,
            lod: i,
            octreeOptions: n.octree,
            lodOptions: n.lod,
            attributes: /* @__PURE__ */ new Map(),
            transform: be.clone(),
            priority: Q(n.priority ?? 0),
            packingStrategy: n.packingStrategy ?? this.config.defaultPackingStrategy ?? { type: "tiered-radial" },
            raycastable: n.raycastable ?? !0,
            sourceVersion: 1
          };
          for (const f of n.attributes ?? []) {
            if (me.has(f.name) || r.attributes.has(f.name))
              throw new Error(
                `Reserved or duplicate attribute name: ${f.name}`
              );
            r.attributes.set(
              f.name,
              xe(f, s.count)
            );
          }
          for (const f of this.clouds.values())
            for (const [h, p] of r.attributes) {
              const g = f.attributes.get(h);
              if (g && (g.format !== p.format || g.elementsPerGaussian !== p.elementsPerGaussian))
                throw new Error(
                  `Attribute schema differs across clouds: ${h}`
                );
            }
          await this.loadCheckpoint(t.signal), this.usedCloudIds.add(r.id), this.clouds.set(r.id, r);
          let a;
          try {
            a = this.compute(), await this.loadCheckpoint(t.signal);
          } catch (f) {
            throw this.clouds.delete(r.id), this.usedCloudIds.delete(r.id), f;
          }
          const { min: d, max: u } = o.bounds;
          this.emit({
            type: "cloud-loaded",
            commandId: e.id,
            cloudId: r.id,
            objectId: r.objectId,
            sourceCount: s.count,
            shDegree: s.shDegree,
            bounds: [d.x, d.y, d.z, u.x, u.y, u.z],
            raycast: r.raycastable ? D(o) : void 0
          }), this.target = null, this.replace(a);
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
          t.priority = Q(e.priority);
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
          raycast: t.raycastable ? D(t.octree) : void 0
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
        ), this.flushSceneUpdate();
        break;
    }
    this.emit({ type: "command-completed", commandId: e.id });
  }
  async loadCheckpoint(e) {
    if (await new Promise((t) => setTimeout(t, 0)), e.aborted) throw new DOMException("Load cancelled", "AbortError");
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
    if (i.set(a, s * r), (o === "means" || o === "scalesOpacity" || o === "rotations") && (t.octree = O.build(t.source, t.octreeOptions), t.lod = M.build(t.octree, t.lodOptions), t.sourceVersion++, t.raycastable)) {
      const { min: d, max: u } = t.octree.bounds;
      this.emit({
        type: "raycast-replaced",
        cloudId: t.id,
        sourceVersion: t.sourceVersion,
        bounds: [d.x, d.y, d.z, u.x, u.y, u.z],
        raycast: D(t.octree)
      });
    }
  }
  maxSlots(e, t) {
    const s = Math.min(
      this.config.frontend.maxStorageBufferBindingSize,
      this.config.frontend.maxBufferSize
    ), n = [
      16,
      16,
      16,
      (e + 1) ** 2 * 4,
      4,
      ...[...t.values()].map((i) => i.elementsPerGaussian * 4)
    ], o = Math.min(
      ...n.map((i) => Math.floor(s / i))
    );
    if (o < 1)
      throw new RangeError("Frontend buffer limits are too small");
    return Math.min(
      o,
      this.config.maxGaussians === "auto" || this.config.maxGaussians === void 0 ? o : this.config.maxGaussians
    );
  }
  compute(e = 0) {
    const t = [...this.clouds.values()].sort(
      (m, w) => m.priority - w.priority || m.objectId - w.objectId
    ), s = t.reduce(
      (m, w) => Math.max(m, w.source.shDegree),
      0
    ), n = /* @__PURE__ */ new Map();
    for (const m of t)
      for (const [w, v] of m.attributes) n.set(w, v);
    let o = this.maxSlots(s, n);
    const i = [];
    for (const m of t) {
      const w = this.select(
        m,
        Math.min(o, m.source.count)
      ), v = m.lod.indicesForPacking(w), I = new Uint32Array(v.length), S = [];
      let k = 0;
      for (let A = 0; A < w.nodeIds.length; A++) {
        const R = m.lod.nodes[w.nodeIds[A]], E = w.lodLevels[A], P = R.levelCounts[E];
        I.fill(E, k, k + P), k += P, S.push(k);
      }
      i.push({ entry: m, indices: v, levels: I, cellEnds: S }), o -= v.length;
    }
    const r = i.reduce(
      (m, w) => m + w.indices.length,
      0
    ), a = Math.max(1, r, e), d = /* @__PURE__ */ new Map(), u = (m, w, v) => {
      const I = w === "f32" ? new Float32Array(a * v) : new Uint32Array(a * v);
      return d.set(m, { format: w, elementsPerGaussian: v, values: I }), I;
    }, f = u("means", "f32", 4), h = u("scalesOpacity", "f32", 4), p = u("rotations", "f32", 4), g = u("shCoefficients", "u32", (s + 1) ** 2), y = u("lodLevel", "u32", 1), l = new Uint32Array(a);
    for (const [m, w] of n)
      u(m, w.format, w.elementsPerGaussian);
    const b = [];
    let C = 0, L = 1;
    for (const { entry: m, indices: w, levels: v, cellEnds: I } of i) {
      const S = m.source, k = S.shCoefficients.array;
      let A = 0;
      for (let R = 0; R < w.length; R++, C++) {
        for (; R >= I[A]; ) A++;
        l[C] = L + A;
        const E = w[R];
        f.set(
          S.means.array.subarray(E * 4, E * 4 + 4),
          C * 4
        ), f[C * 4 + 3] = m.objectId, h.set(
          S.scalesOpacity.array.subarray(E * 4, E * 4 + 4),
          C * 4
        ), p.set(
          S.rotations.array.subarray(E * 4, E * 4 + 4),
          C * 4
        ), y[C] = v[R];
        for (let P = 0; P < S.shCoefficientCount; P++) {
          const U = (E * S.shCoefficientCount + P) * 4;
          g[C * (s + 1) ** 2 + P] = K(
            k[U],
            k[U + 1],
            k[U + 2]
          );
        }
        for (const [P, U] of m.attributes) {
          const X = d.get(P).values, T = U.elementsPerGaussian;
          X.set(
            U.values.subarray(E * T, (E + 1) * T),
            C * T
          );
        }
      }
      L += I.length, b.push({
        cloudId: m.id,
        objectId: m.objectId,
        renderedCount: w.length
      });
    }
    return { capacity: a, count: r, degree: s, attributes: d, cells: l, clouds: b };
  }
  select(e, t) {
    const s = this.cameraPosition.clone().applyMatrix4(e.transform.clone().invert()), n = e.packingStrategy;
    switch (n.type) {
      case "maximum":
        return new se().pack({
          lod: e.lod,
          maxGaussians: t
        });
      case "radial":
        return new ne({
          center: s,
          lodLevel: n.lodLevel
        }).pack({ lod: e.lod, maxGaussians: t });
      case "tiered-radial":
        return new oe({
          center: s,
          budgetShares: n.budgetShares
        }).pack({ lod: e.lod, maxGaussians: t });
      case "distance-aware-radial":
        return new ee({
          center: s,
          levelDistance: n.levelDistance
        }).pack({ lod: e.lod, maxGaussians: t });
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
      (h, p) => h + p.elementsPerGaussian * 4,
      0
    ), i = Math.max(1, Math.floor(s / o)), r = [], a = /* @__PURE__ */ new Set();
    for (let h = 0; h < e.capacity && r.length < i; h++)
      if ([...e.attributes].some(([p, g]) => {
        const y = t.attributes.get(p).values, l = h * g.elementsPerGaussian;
        for (let b = 0; b < g.elementsPerGaussian; b++)
          if (g.values[l + b] !== y[l + b]) return !0;
        return !1;
      })) {
        const p = t.cells[h];
        if (!a.has(p) && a.size >= n) break;
        a.add(p), r.push(h);
      }
    const d = [];
    if (r.length === 0) {
      if (JSON.stringify(e.clouds) !== JSON.stringify(t.clouds)) {
        const h = this.contentVersion++;
        this.emit({
          type: "buffers-patched",
          sceneRevision: this.sceneRevision,
          layoutVersion: this.layoutVersion,
          baseContentVersion: h,
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
    for (const [h, p] of e.attributes) {
      const g = p.elementsPerGaussian, y = t.attributes.get(h).values;
      let l = -1, b = -1;
      const C = () => {
        if (l < 0) return;
        const L = l * g, m = (b + 1) * g;
        p.values.set(y.subarray(L, m), L), d.push({
          name: h,
          firstSlot: l,
          slotCount: b - l + 1,
          data: y.slice(L, m).buffer
        }), l = -1;
      };
      for (const L of r) {
        const m = L * g;
        let w = !1;
        for (let v = 0; v < g; v++)
          if (p.values[m + v] !== y[m + v]) {
            w = !0;
            break;
          }
        if (!w) {
          C();
          continue;
        }
        l < 0 ? l = L : L !== b + 1 && (C(), l = L), b = L;
      }
      C();
    }
    const u = [...e.attributes].some(([h, p]) => {
      const g = t.attributes.get(h).values;
      return p.values.some((y, l) => y !== g[l]);
    }), f = this.contentVersion++;
    this.emit({
      type: "buffers-patched",
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      baseContentVersion: f,
      contentVersion: this.contentVersion,
      patches: d,
      changedClouds: u ? e.clouds : t.clouds,
      lodPending: u
    }), u ? this.scheduleUpdate() : (this.packed = {
      ...e,
      count: t.count,
      clouds: t.clouds,
      cells: t.cells
    }, this.target = null);
  }
}
function Q(c) {
  if (!Number.isSafeInteger(c))
    throw new RangeError("Priority must be a safe integer");
  return c;
}
function xe(c, e) {
  const t = c.elementsPerGaussian;
  if (!Number.isSafeInteger(t) || t < 1)
    throw new RangeError("Attribute elementsPerGaussian must be positive");
  const s = e * t, n = c.format === "f32" ? new Float32Array(s) : new Uint32Array(s);
  if (c.source.kind === "fill")
    n.fill(c.source.value === "ones" ? 1 : 0);
  else {
    if (c.source.data.byteLength !== s * 4)
      throw new RangeError("Attribute buffer has the wrong byte length");
    n.set(
      c.format === "f32" ? new Float32Array(c.source.data) : new Uint32Array(c.source.data)
    );
  }
  return { format: c.format, elementsPerGaussian: t, values: n };
}
class Ce {
  createBackend(e) {
    return new ve(e);
  }
}
export {
  Ce as DirectStreamingGaussianBackendFactory,
  ve as StreamingGaussianBackend
};
