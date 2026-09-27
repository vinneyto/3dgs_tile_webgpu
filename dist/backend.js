import { Vector3 as C, Box3 as G, Matrix4 as q } from "three";
class we {
  constructor(e) {
    this.backend = e, this.unsubscribe = e.subscribe(this.receive), this.unsubscribeFailure = e.onFailure(this.fail);
  }
  backend;
  state = "waiting";
  queue = [];
  responses = /* @__PURE__ */ new Set();
  failures = /* @__PURE__ */ new Set();
  unsubscribe;
  unsubscribeFailure;
  active = null;
  handshakeAccepted = !1;
  disposed = !1;
  start() {
    if (this.disposed || this.state === "failed")
      throw new Error("RequestScheduler unavailable");
    this.state === "waiting" && (this.state = "ready"), this.pump();
  }
  schedule(e) {
    return this.disposed || this.state === "failed" ? Promise.reject(new Error("RequestScheduler unavailable")) : new Promise((t, s) => {
      const r = e.latestKey;
      if (r !== void 0) {
        const o = this.queue.findIndex(
          (c) => c.command.latestKey === r
        );
        o >= 0 && this.queue.splice(o, 1)[0].resolve("superseded");
      }
      this.queue.push({ command: e, resolve: t, reject: s }), this.pump();
    });
  }
  cancel(e) {
    const t = this.queue.findIndex(
      ({ command: s }) => s.id === e
    );
    t >= 0 ? this.queue.splice(t, 1)[0].resolve("superseded") : this.active?.command.id === e && this.backend.abort(e);
  }
  onResponse(e) {
    return this.responses.add(e), () => this.responses.delete(e);
  }
  onFailure(e) {
    return this.failures.add(e), () => this.failures.delete(e);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = !0;
    const e = new Error("RequestScheduler disposed");
    this.active?.reject(e), this.active = null;
    for (const t of this.queue.splice(0)) t.reject(e);
    this.unsubscribe(), this.unsubscribeFailure(), this.responses.clear(), this.failures.clear(), this.backend.dispose();
  }
  pump() {
    if (this.disposed || this.active || this.state === "failed") return;
    const e = this.state === "ready" ? this.queue.shift() : void 0;
    if (e) {
      this.active = e, e.command.type === "set-frontend-capabilities" && (this.handshakeAccepted = !1, this.state = "handshaking");
      try {
        this.backend.dispatch(e.command);
      } catch (t) {
        this.active = null;
        const s = t instanceof Error ? t : new Error(String(t));
        e.reject(s), e.command.type === "set-frontend-capabilities" ? this.fail({ code: "handshake-failed", message: s.message }) : queueMicrotask(() => this.pump());
      }
    }
  }
  receive = (e) => {
    if (e.command.id !== this.active?.command.id || e.command.type !== this.active.command.type || e.error !== void 0 && (!e.isFinal || e.payload !== void 0)) {
      this.fail({
        code: "protocol-error",
        message: `Invalid response to ${e.command.id}`
      });
      return;
    }
    this.active.command.type === "set-frontend-capabilities" && e.payload?.type === "capabilities-accepted" && e.payload.protocolVersion === 1 && (this.handshakeAccepted = !0);
    for (const r of this.responses) r(e);
    if (!e.isFinal) return;
    const t = this.active;
    this.active = null;
    const s = t.command.type === "set-frontend-capabilities";
    if (s && !e.error && !this.handshakeAccepted) {
      const r = new Error(
        "Backend did not confirm the frontend capabilities"
      );
      t.reject(r), this.fail({ code: "handshake-failed", message: r.message });
      return;
    }
    if (s && (e.error || (this.state = "ready")), e.error) {
      const r = new Error(e.error.message);
      e.error.code === "cancelled" && (r.name = "AbortError"), t.reject(r), s && this.fail({ code: e.error.code, message: r.message });
    } else
      t.resolve("done");
    queueMicrotask(() => this.pump());
  };
  fail = (e) => {
    if (this.disposed || this.state === "failed") return;
    this.state = "failed";
    const t = new Error(e.message);
    this.active?.reject(t), this.active = null;
    for (const s of this.queue.splice(0)) s.reject(t);
    for (const s of this.failures) s(e);
  };
}
const be = (a, e, t, s) => ({ type: "load-cloud", id: a, cloudId: e, url: t, options: s }), ve = (a, e, t, s) => ({
  type: "load-cloud-from-buffer",
  id: a,
  cloudId: e,
  buffer: t,
  options: s
}), xe = (a, e) => ({ type: "unload-cloud", id: a, cloudId: e }), Ce = (a, e, t) => ({
  type: "set-cloud-priority",
  id: a,
  cloudId: e,
  priority: t
}), Ie = (a, e, t) => ({
  type: "set-cloud-packing",
  id: a,
  cloudId: e,
  packingStrategy: t
}), Le = (a, e, t, s) => ({
  type: "set-cloud-transform",
  id: a,
  cloudId: e,
  sceneRevision: t,
  worldMatrix: s,
  latestKey: `cloud-transform:${e}`
}), Se = (a, e, t) => ({
  type: "set-cloud-raycastable",
  id: a,
  cloudId: e,
  raycastable: t
}), Ee = (a, e, t, s, r, o) => ({
  type: "write-attribute-range",
  id: a,
  cloudId: e,
  attribute: t,
  firstGaussian: s,
  gaussianCount: r,
  data: o
}), ke = (a, e, t, s) => ({
  type: "set-camera",
  id: a,
  sceneRevision: e,
  worldMatrix: t,
  projectionMatrix: s,
  latestKey: "camera"
}), Re = (a, e, t, s, r, o) => ({
  type: "set-frontend-capabilities",
  id: a,
  protocolVersion: 1,
  capabilities: { ...e },
  sceneRevision: t,
  cameraWorldMatrix: s,
  projectionMatrix: r,
  cloudTransforms: o
});
function Y(a, e, t) {
  const s = Math.max(Math.abs(a), Math.abs(e), Math.abs(t));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const r = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), o = 127 / 2 ** r, c = B(a, o), n = B(e, o), i = B(t, o), d = r + 127;
  return (c | n << 8 | i << 16 | d << 24) >>> 0;
}
function B(a, e) {
  return Math.min(127, Math.max(-127, Math.round(a * e))) & 255;
}
function N(a) {
  if (!Number.isInteger(a) || a < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
function D(a, e, t) {
  return a.updateWorldMatrix(!0, !1), e.updateWorldMatrix(!0, !1), a.getWorldPosition(t), e.worldToLocal(t);
}
function T(a, e) {
  const t = e instanceof C ? e.clone() : a.octree.bounds.getCenter(new C()), s = a.octree.rootBounds.getSize(new C()), r = Math.max(s.length() * 0.5, Number.EPSILON), o = new C(), c = Array.from(a.octree.leafNodeIds, (n) => (a.octree.nodes[n].bounds.getCenter(o), {
    nodeId: n,
    radius: o.distanceTo(t) / r
  }));
  return c.sort(
    (n, i) => n.radius - i.radius || n.nodeId - i.nodeId
  ), c;
}
class H {
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
      D(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return W();
    const s = T(e, this.center), r = s.map(
      ({ radius: n }) => Math.max(0, e.finestLevel - Math.floor(n / this.levelDistance))
    );
    let o = s.reduce(
      (n, i, d) => n + e.nodes[i.nodeId].levelCounts[r[d]],
      0
    );
    for (let n = s.length - 1; n >= 0 && o > t; n--) {
      const i = e.nodes[s[n].nodeId];
      for (; r[n] > 0 && o > t; ) {
        const d = i.levelCounts[r[n]];
        r[n] = r[n] - 1, o -= d - i.levelCounts[r[n]];
      }
    }
    let c = s.length;
    for (; c > 0 && o > t; ) {
      c--;
      const n = e.nodes[s[c].nodeId];
      o -= n.levelCounts[r[c]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, c).map(({ nodeId: n }) => n)
      ),
      lodLevels: Uint8Array.from(r.slice(0, c)),
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
class K {
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
class J {
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
      D(e, t, this.cameraCenter)
    );
  }
  pack({ lod: e, maxGaussians: t }) {
    if (N(t), t === 0) return Q();
    const s = this.lodLevel === "finest" ? e.finestLevel : this.lodLevel;
    if (s >= e.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const r = T(e, this.center), o = [];
    let c = 0;
    for (const i of r) {
      const d = e.nodes[i.nodeId].levelCounts[s];
      if (c + d > t) break;
      o.push(i.nodeId), c += d;
    }
    const n = new Uint8Array(o.length);
    return n.fill(s), {
      nodeIds: Uint32Array.from(o),
      lodLevels: n,
      gaussianCount: c
    };
  }
}
function Q() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class X {
  cameraCenter = new C();
  center;
  budgetShares;
  constructor(e = {}) {
    this.center = e.center instanceof C ? e.center.clone() : e.center ?? "bounds-center", this.budgetShares = Z(
      e.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(e) {
    return this.center = e instanceof C ? e.clone() : e, this;
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
    const r = T(e, this.center), o = [
      e.finestLevel,
      Math.max(0, e.finestLevel - 1),
      0
    ], c = [], n = [];
    let i = 0, d = 0, h = 0;
    for (let f = 0; f < o.length; f++) {
      const u = this.budgetShares[f];
      if (h += u, u === 0) continue;
      const m = f === o.length - 1 ? t : Math.floor(t * h), p = o[f];
      for (; d < r.length; ) {
        const w = r[d], l = e.nodes[w.nodeId].levelCounts[p];
        if (i + l > m) break;
        c.push(w.nodeId), n.push(p), i += l, d++;
      }
    }
    return {
      nodeIds: Uint32Array.from(c),
      lodLevels: Uint8Array.from(n),
      gaussianCount: i
    };
  }
}
function Z(a) {
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
function ee() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class te {
  constructor(e, t, s, r, o, c) {
    this.count = e, this.shDegree = t, this.shCoefficientCount = (t + 1) ** 2, this.means = { array: s }, this.scalesOpacity = { array: r }, this.rotations = { array: o }, this.shCoefficients = { array: c };
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
const V = {
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
class re {
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
    const t = ne(e), s = new Map(
      t.properties.map((l, y) => [l.name, y])
    );
    for (const l of se)
      if (!s.has(l))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${l}`);
    const r = t.properties.map((l) => l.name.match(/^f_rest_(\d+)$/)?.[1]).filter((l) => l !== void 0).map(Number).sort((l, y) => l - y);
    for (let l = 0; l < r.length; l++)
      if (r[l] !== l)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const o = r.length / 3, c = o + 1, n = Math.sqrt(c);
    if (!Number.isInteger(n) || n < 1 || n > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const i = oe(e, t), d = (l) => s.get(l), h = r.map(
      (l) => d(`f_rest_${l}`)
    ), f = t.vertexCount, u = new Float32Array(f * 4), m = new Float32Array(f * 4), p = new Float32Array(f * 4), w = new Float32Array(f * c * 4);
    for (let l = 0; l < f; l++) {
      const y = l * 4;
      u[y] = i(l, d("x")), u[y + 1] = i(l, d("y")), u[y + 2] = i(l, d("z")), m[y] = Math.max(
        Math.exp(i(l, d("scale_0"))),
        1e-6
      ), m[y + 1] = Math.max(
        Math.exp(i(l, d("scale_1"))),
        1e-6
      ), m[y + 2] = Math.max(
        Math.exp(i(l, d("scale_2"))),
        1e-6
      );
      const I = i(l, d("opacity"));
      m[y + 3] = 1 / (1 + Math.exp(-I));
      const x = i(l, d("rot_0")), g = i(l, d("rot_1")), b = i(l, d("rot_2")), v = i(l, d("rot_3")), L = Math.hypot(g, b, v, x);
      L > 1e-12 ? (p[y] = g / L, p[y + 1] = b / L, p[y + 2] = v / L, p[y + 3] = x / L) : p[y + 3] = 1;
      const E = l * c * 4;
      w[E] = i(l, d("f_dc_0")), w[E + 1] = i(l, d("f_dc_1")), w[E + 2] = i(l, d("f_dc_2"));
      for (let k = 1; k < c; k++) {
        const P = E + k * 4, M = k - 1;
        for (let S = 0; S < 3; S++) {
          const R = h[S * o + M];
          w[P + S] = i(
            l,
            R
          );
        }
      }
    }
    return new te(
      f,
      n - 1,
      u,
      m,
      p,
      w
    );
  }
}
function ne(a) {
  const e = new Uint8Array(a), t = new TextEncoder().encode("end_header");
  let s = -1;
  for (let p = 0; p <= e.length - t.length; p++) {
    let w = !0;
    for (let l = 0; l < t.length; l++)
      if (e[p + l] !== t[l]) {
        w = !1;
        break;
      }
    if (w) {
      s = p;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let r = s + t.length;
  if (e[r] === 13 && r++, e[r] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  r++;
  const c = new TextDecoder().decode(e.subarray(0, r)).split(/\r?\n/);
  if (c[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let n = null, i = "", d = -1, h = 0;
  const f = [], u = [];
  for (const p of c) {
    const w = p.trim().split(/\s+/);
    if (w[0] === "format") {
      if (w[1] !== "ascii" && w[1] !== "binary_little_endian" && w[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${w[1] ?? "unknown"}`);
      n = w[1];
    } else if (w[0] === "element") {
      i = w[1] ?? "";
      const l = Number(w[2]);
      if (!Number.isInteger(l) || l < 0)
        throw new Error(`Invalid element count for ${i}`);
      u.push({ name: i, count: l }), i === "vertex" && (d = l);
    } else if (w[0] === "property" && i === "vertex") {
      if (w[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const l = w[1], y = w[2];
      if (!(l in V) || y === void 0)
        throw new Error(`Unsupported vertex property: ${p}`);
      f.push({ name: y, type: l, byteOffset: h }), h += V[l];
    }
  }
  if (n === null) throw new Error("Invalid PLY: format is missing");
  if (d <= 0) throw new Error("PLY must contain at least one vertex");
  if (u.find(
    (p) => p.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: n, vertexCount: d, properties: f, vertexStride: h, dataOffset: r };
}
function oe(a, e) {
  if (e.format === "ascii") {
    const o = new TextDecoder().decode(
      new Uint8Array(a, e.dataOffset)
    ), c = new Float64Array(
      e.vertexCount * e.properties.length
    );
    let n = 0;
    for (let i = 0; i < c.length; i++) {
      for (; n < o.length && /\s/.test(o[n]); ) n++;
      const d = n;
      for (; n < o.length && !/\s/.test(o[n]); ) n++;
      const h = Number(o.slice(d, n));
      if (!Number.isFinite(h))
        throw new Error(`Invalid ASCII PLY value at scalar ${i}`);
      c[i] = h;
    }
    return (i, d) => c[i * e.properties.length + d];
  }
  if (e.dataOffset + e.vertexCount * e.vertexStride > a.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(a), r = e.format === "binary_little_endian";
  return (o, c) => {
    const n = e.properties[c], i = e.dataOffset + o * e.vertexStride + n.byteOffset;
    return ae(s, i, n.type, r);
  };
}
function ae(a, e, t, s) {
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
function F(a) {
  const e = a.nodes, t = new Float32Array(e.length * 7), s = new Uint32Array(e.length * 2), r = new Uint32Array(e.length * 2), o = [], c = [];
  for (const i of e) {
    const d = i.id * 7, { min: h, max: f } = i.raycastBounds;
    if (t.set(
      [h.x, h.y, h.z, f.x, f.y, f.z, i.maxSplatRadius],
      d
    ), s.set([o.length, i.children.length], i.id * 2), o.push(...i.children), r.set(
      [c.length, i.gaussianIndices?.length ?? 0],
      i.id * 2
    ), i.gaussianIndices !== null)
      for (const u of i.gaussianIndices) c.push(u);
  }
  const n = a.data;
  return {
    means: Float32Array.from(n.means.array).buffer,
    scalesOpacity: Float32Array.from(n.scalesOpacity.array).buffer,
    rotations: Float32Array.from(n.rotations.array).buffer,
    nodeBounds: t.buffer,
    nodeChildren: s.buffer,
    children: Uint32Array.from(o).buffer,
    nodeIndices: r.buffer,
    indices: Uint32Array.from(c).buffer
  };
}
class z {
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
      const c = s(o, e);
      r[o] = Number.isFinite(c) ? c : -1 / 0;
    }
    this.nodes = e.nodes.map((o) => {
      if (o.gaussianIndices === null)
        return new z(
          o.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const c = Uint32Array.from(
        Array.from(o.gaussianIndices).sort(
          (n, i) => r[i] - r[n] || n - i
        )
      );
      return new z(
        o.id,
        c,
        Uint32Array.from(
          this.levels.map(
            ({ retention: n }) => Math.min(
              c.length,
              Math.max(1, Math.ceil(c.length * n))
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
      const c = e.nodeIds[o], n = this.getLeafNode(c);
      if (s.has(c))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${c}`
        );
      s.add(c);
      const i = e.lodLevels[o], d = n.levelCounts[i];
      if (d === void 0)
        throw new RangeError(`GaussianLod level ${i} does not exist`);
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
    const c = this.octree.data.means.array, n = this.octree.data.scalesOpacity.array, i = new C(), d = new C(), h = [], f = /* @__PURE__ */ new Set();
    for (let u = 0; u < t.nodeIds.length; u++) {
      const m = t.nodeIds[u], p = this.getLeafNode(m);
      if (f.has(m))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${m}`
        );
      f.add(m);
      const w = t.lodLevels[u], l = p.levelCounts[w];
      if (l === void 0)
        throw new RangeError(`GaussianLod level ${w} does not exist`);
      const y = this.octree.nodes[m], I = Math.max(0, r - 3) * y.maxSplatRadius, x = I === 0 ? y.raycastBounds : y.raycastBounds.clone().expandByScalar(I);
      if (e.intersectsBox(x))
        for (let g = 0; g < l; g++) {
          const b = p.sortedGaussianIndices[g], v = b * 4;
          i.set(c[v], c[v + 1], c[v + 2]);
          const L = Math.max(
            n[v],
            n[v + 1],
            n[v + 2]
          ) * r;
          e.closestPointToPoint(i, d), !(d.distanceToSquared(i) > L * L) && h.push({
            gaussianIndex: b,
            distance: e.origin.distanceTo(d),
            point: d.clone()
          });
        }
    }
    return h.sort((u, m) => u.distance - m.distance), h.length > o && (h.length = o), h;
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
function ce(a) {
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
function le(a, e) {
  const t = e.data.scalesOpacity.array, s = a * 4, r = [t[s], t[s + 1], t[s + 2]];
  return r.sort((o, c) => c - o), t[s + 3] * r[0] * r[1];
}
class de {
  constructor(e, t, s, r, o, c, n, i) {
    this.id = e, this.depth = t, this.bounds = s, this.count = r, this.maxSplatRadius = o, this.raycastBounds = i, this.children = c, this.gaussianIndices = n;
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
    const o = e.means.array, c = e.scalesOpacity.array, n = [], i = [], d = Array.from({ length: e.count }, (f, u) => u), h = (f, u, m) => {
      const p = n.length;
      n.push(null);
      const w = f.length > t && m < s && u.max.x - u.min.x > Number.EPSILON, l = [];
      if (w) {
        const x = u.getCenter(new C()), g = Array.from({ length: 8 }, () => []);
        for (const b of f) {
          const v = b * 4, L = (o[v] >= x.x ? 1 : 0) | (o[v + 1] >= x.y ? 2 : 0) | (o[v + 2] >= x.z ? 4 : 0);
          g[L].push(b);
        }
        for (let b = 0; b < 8; b++) {
          const v = g[b];
          v.length !== 0 && l.push(
            h(
              v,
              fe(u, x, b),
              m + 1
            )
          );
        }
      }
      let y = 0;
      if (l.length > 0)
        for (const x of l)
          y = Math.max(
            y,
            n[x].maxSplatRadius
          );
      else {
        for (const x of f) {
          const g = x * 4;
          y = Math.max(
            y,
            c[g],
            c[g + 1],
            c[g + 2]
          );
        }
        i.push(p);
      }
      const I = u.clone().expandByScalar(y * 3);
      return n[p] = new de(
        p,
        m,
        u,
        f.length,
        y,
        l,
        l.length === 0 ? Uint32Array.from(f) : null,
        I
      ), p;
    };
    h(d, this.rootBounds.clone(), 0), this.nodes = n, this.leafNodeIds = Uint32Array.from(i);
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
    const o = [], c = [this.rootNode];
    for (; c.length > 0; ) {
      const n = this.nodes[c.pop()], i = Math.max(0, s - 3) * n.maxSplatRadius, d = i === 0 ? n.raycastBounds : n.raycastBounds.clone().expandByScalar(i);
      if (e.intersectsBox(d))
        if (n.gaussianIndices !== null)
          for (const h of n.gaussianIndices) o.push(h);
        else
          for (const h of n.children) c.push(h);
    }
    return this.raycastIndices(e, o, s, r);
  }
  raycastIndices(e, t, s = 3, r = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(r > 0)) return [];
    const o = this.data.means.array, c = this.data.scalesOpacity.array, n = new C(), i = new C(), d = [];
    for (let h = 0; h < t.length; h++) {
      const f = t[h], u = f * 4;
      n.set(o[u], o[u + 1], o[u + 2]);
      const m = Math.max(
        c[u],
        c[u + 1],
        c[u + 2]
      ) * s;
      e.closestPointToPoint(n, i), !(i.distanceToSquared(n) > m * m) && d.push({
        gaussianIndex: f,
        distance: e.origin.distanceTo(i),
        point: i.clone()
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
function ue(a) {
  const e = a.means.array, t = new G(), s = new C();
  for (let r = 0; r < a.count; r++) {
    const o = r * 4;
    s.set(e[o], e[o + 1], e[o + 2]), t.expandByPoint(s);
  }
  return t;
}
function he(a) {
  const e = a.getCenter(new C()), t = a.getSize(new C()), s = Math.max(t.x, t.y, t.z, 1e-6) * 0.5;
  return new G(
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
function fe(a, e, t) {
  return new G(
    new C(
      t & 1 ? e.x : a.min.x,
      t & 2 ? e.y : a.min.y,
      t & 4 ? e.z : a.min.z
    ),
    new C(
      t & 1 ? a.max.x : e.x,
      t & 2 ? a.max.y : e.y,
      t & 4 ? a.max.z : e.z
    )
  );
}
const pe = /* @__PURE__ */ new Set([
  "means",
  "scalesOpacity",
  "rotations",
  "shCoefficients",
  "lodLevel"
]), ge = new q();
class Pe {
  listeners = /* @__PURE__ */ new Set();
  failureListeners = /* @__PURE__ */ new Set();
  clouds = /* @__PURE__ */ new Map();
  usedCloudIds = /* @__PURE__ */ new Set();
  usedCommandIds = /* @__PURE__ */ new Set();
  activeLoads = /* @__PURE__ */ new Map();
  parser = new re();
  config;
  frontend = null;
  nextObjectId = 0;
  layoutVersion = 0;
  contentVersion = 0;
  sceneRevision = 0;
  cameraPosition = new C();
  packed = null;
  target = null;
  updateScheduled = !1;
  active = null;
  startedAt = 0;
  drain = null;
  disposed = !1;
  constructor(e) {
    this.config = e;
  }
  subscribe(e) {
    if (this.disposed) throw new Error("Backend disposed");
    return this.listeners.add(e), () => this.listeners.delete(e);
  }
  onFailure(e) {
    return this.failureListeners.add(e), () => this.failureListeners.delete(e);
  }
  dispatch(e) {
    if (this.disposed) throw new Error("Backend disposed");
    if (this.usedCommandIds.has(e.id))
      throw new Error(`Duplicate backend command id: ${e.id}`);
    if (this.usedCommandIds.add(e.id), this.active)
      throw new Error("Backend accepts only one command at a time");
    this.active = e, this.startedAt = performance.now(), this.run(e);
  }
  abort(e) {
    this.activeLoads.get(e)?.abort();
  }
  async run(e) {
    try {
      await this.handle(e), this.target && await new Promise((t, s) => {
        this.drain = { resolve: t, reject: s };
      }), this.respond(e, { isFinal: !0 });
    } catch (t) {
      this.respond(e, {
        isFinal: !0,
        error: {
          code: t instanceof DOMException && t.name === "AbortError" ? "cancelled" : t instanceof RangeError ? "invalid-range" : "backend-error",
          message: t instanceof Error ? t.message : String(t),
          cloudId: "cloudId" in e ? e.cloudId : void 0
        }
      });
    } finally {
      this.active = null;
    }
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0;
      for (const e of this.activeLoads.values()) e.abort();
      this.activeLoads.clear(), this.drain?.reject(new Error("Backend disposed")), this.drain = null, this.listeners.clear(), this.failureListeners.clear(), this.clouds.clear(), this.packed = null, this.target = null;
    }
  }
  respond(e, t) {
    if (this.disposed) return;
    const s = {
      command: { id: e.id, type: e.type },
      durationMs: e === this.active || e.id === this.active?.id ? performance.now() - this.startedAt : 0,
      ...t
    };
    for (const r of this.listeners) r(s);
  }
  emit(e) {
    if (!this.active) throw new Error("Unsolicited backend output");
    this.respond(this.active, { isFinal: !1, payload: e });
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
            if (t.signal.aborted)
              throw new DOMException("Load cancelled", "AbortError");
            s = this.parser.parse(u);
          } else
            s = this.parser.parse(e.buffer);
          const r = e.options ?? {}, o = U.build(s, r.octree), c = O.build(o, r.lod), n = {
            id: e.cloudId,
            objectId: this.nextObjectId++,
            source: s,
            octree: o,
            lod: c,
            octreeOptions: r.octree,
            lodOptions: r.lod,
            attributes: /* @__PURE__ */ new Map(),
            transform: ge.clone(),
            priority: $(r.priority ?? 0),
            packingStrategy: r.packingStrategy ?? this.config.defaultPackingStrategy ?? { type: "tiered-radial" },
            raycastable: r.raycastable ?? !0,
            sourceVersion: 1
          };
          for (const f of r.attributes ?? []) {
            if (pe.has(f.name) || n.attributes.has(f.name))
              throw new Error(
                `Reserved or duplicate attribute name: ${f.name}`
              );
            n.attributes.set(
              f.name,
              ye(f, s.count)
            );
          }
          for (const f of this.clouds.values())
            for (const [u, m] of n.attributes) {
              const p = f.attributes.get(u);
              if (p && (p.format !== m.format || p.elementsPerGaussian !== m.elementsPerGaussian))
                throw new Error(
                  `Attribute schema differs across clouds: ${u}`
                );
            }
          this.usedCloudIds.add(n.id), this.clouds.set(n.id, n);
          let i = null;
          if (this.frontend)
            try {
              i = this.compute();
            } catch (f) {
              throw this.clouds.delete(n.id), this.usedCloudIds.delete(n.id), f;
            }
          const { min: d, max: h } = o.bounds;
          this.emit({
            type: "cloud-loaded",
            cloudId: n.id,
            objectId: n.objectId,
            sourceCount: s.count,
            shDegree: s.shDegree,
            bounds: [d.x, d.y, d.z, h.x, h.y, h.z],
            raycast: n.raycastable ? F(o) : void 0
          }), i && (this.target = null, this.replace(i));
          return;
        } finally {
          this.activeLoads.delete(e.id);
        }
      }
      case "unload-cloud":
        this.clouds.delete(e.cloudId), this.emit({
          type: "cloud-unloaded",
          cloudId: e.cloudId
        }), this.repack();
        return;
      case "set-cloud-priority":
        {
          const t = this.getCloud(e.cloudId), s = t.priority;
          t.priority = $(e.priority);
          try {
            this.repack();
          } catch (r) {
            throw t.priority = s, r;
          }
        }
        break;
      case "set-cloud-packing":
        {
          const t = this.getCloud(e.cloudId), s = t.packingStrategy;
          t.packingStrategy = e.packingStrategy;
          try {
            this.repack();
          } catch (r) {
            throw t.packingStrategy = s, r;
          }
        }
        break;
      case "set-cloud-transform": {
        const t = this.getCloud(e.cloudId);
        if (e.worldMatrix.length !== 16)
          throw new RangeError("Cloud transform needs sixteen numbers");
        if (e.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = e.sceneRevision, t.transform.fromArray(e.worldMatrix), this.updateTarget();
        return;
      }
      case "set-cloud-raycastable": {
        const t = this.getCloud(e.cloudId);
        t.raycastable = e.raycastable, this.emit({
          type: "cloud-raycast-changed",
          cloudId: t.id,
          raycastable: t.raycastable,
          raycast: t.raycastable ? F(t.octree) : void 0
        });
        return;
      }
      case "write-attribute-range":
        this.writeRange(e), this.updateTarget();
        break;
      case "set-frontend-capabilities": {
        if (e.protocolVersion !== 1)
          throw new Error(
            `Unsupported frontend protocol: ${e.protocolVersion}`
          );
        const { capabilities: t } = e;
        for (const r of [
          t.maxStorageBufferBindingSize,
          t.maxBufferSize,
          t.maxStorageBuffersPerShaderStage
        ])
          if (!Number.isSafeInteger(r) || r <= 0)
            throw new RangeError(
              "Frontend buffer limits must be positive integers"
            );
        if (typeof t.supportsPartialBufferUpdates != "boolean")
          throw new TypeError(
            "Frontend partial update support must be boolean"
          );
        if (e.cameraWorldMatrix.length !== 16 || e.projectionMatrix.length !== 16 || e.cloudTransforms.some(
          ({ worldMatrix: r }) => r.length !== 16
        ))
          throw new RangeError("Scene matrices need sixteen numbers each");
        if (e.sceneRevision >= this.sceneRevision) {
          for (const { cloudId: r, worldMatrix: o } of e.cloudTransforms)
            this.getCloud(r).transform.fromArray(o);
          this.cameraPosition.set(
            e.cameraWorldMatrix[12],
            e.cameraWorldMatrix[13],
            e.cameraWorldMatrix[14]
          ), this.sceneRevision = e.sceneRevision;
        }
        const s = this.frontend;
        this.frontend = { ...t };
        try {
          this.clouds.size > 0 && this.repack();
        } catch (r) {
          throw this.frontend = s, r;
        }
        this.emit({ type: "capabilities-accepted", protocolVersion: 1 });
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
        ), this.updateTarget();
        break;
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
      gaussianCount: r,
      attribute: o
    } = e;
    if (!Number.isSafeInteger(s) || !Number.isSafeInteger(r) || s < 0 || r < 0 || s + r > t.source.count)
      throw new RangeError("Attribute range exceeds source cloud");
    if (o === "lodLevel")
      throw new Error("lodLevel is computed by the backend");
    let c, n;
    switch (o) {
      case "means":
        c = t.source.means.array, n = 4;
        break;
      case "scalesOpacity":
        c = t.source.scalesOpacity.array, n = 4;
        break;
      case "rotations":
        c = t.source.rotations.array, n = 4;
        break;
      case "shCoefficients":
        c = t.source.shCoefficients.array, n = t.source.shCoefficientCount * 4;
        break;
      default: {
        const d = t.attributes.get(o);
        if (!d) throw new Error(`Unknown source attribute: ${o}`);
        c = d.values, n = d.elementsPerGaussian;
      }
    }
    if (e.data.byteLength !== r * n * 4)
      throw new RangeError("Attribute update has the wrong byte length");
    const i = c instanceof Uint32Array ? new Uint32Array(e.data) : new Float32Array(e.data);
    if (c.set(i, s * n), (o === "means" || o === "scalesOpacity" || o === "rotations") && (t.octree = U.build(t.source, t.octreeOptions), t.lod = O.build(t.octree, t.lodOptions), t.sourceVersion++, t.raycastable)) {
      const { min: d, max: h } = t.octree.bounds;
      this.emit({
        type: "raycast-replaced",
        cloudId: t.id,
        sourceVersion: t.sourceVersion,
        bounds: [d.x, d.y, d.z, h.x, h.y, h.z],
        raycast: F(t.octree)
      });
    }
  }
  maxSlots(e, t) {
    const s = this.frontend;
    if (!s)
      throw new Error("Frontend capabilities have not been supplied");
    const r = Math.min(
      s.maxStorageBufferBindingSize,
      s.maxBufferSize
    ), o = [
      16,
      16,
      16,
      (e + 1) ** 2 * 4,
      4,
      ...[...t.values()].map((n) => n.elementsPerGaussian * 4)
    ], c = Math.min(
      ...o.map((n) => Math.floor(r / n))
    );
    if (c < 1)
      throw new RangeError("Frontend buffer limits are too small");
    return Math.min(
      c,
      this.config.maxGaussians === "auto" || this.config.maxGaussians === void 0 ? c : this.config.maxGaussians
    );
  }
  compute(e = 0) {
    const t = [...this.clouds.values()].sort(
      (g, b) => g.priority - b.priority || g.objectId - b.objectId
    ), s = t.reduce(
      (g, b) => Math.max(g, b.source.shDegree),
      0
    ), r = /* @__PURE__ */ new Map();
    for (const g of t)
      for (const [b, v] of g.attributes) r.set(b, v);
    let o = this.maxSlots(s, r);
    const c = [];
    for (const g of t) {
      const b = this.select(
        g,
        Math.min(o, g.source.count)
      ), v = g.lod.indicesForPacking(b), L = new Uint32Array(v.length), E = [];
      let k = 0;
      for (let P = 0; P < b.nodeIds.length; P++) {
        const M = g.lod.nodes[b.nodeIds[P]], S = b.lodLevels[P], R = M.levelCounts[S];
        L.fill(S, k, k + R), k += R, E.push(k);
      }
      c.push({ entry: g, indices: v, levels: L, cellEnds: E }), o -= v.length;
    }
    const n = c.reduce(
      (g, b) => g + b.indices.length,
      0
    ), i = Math.max(1, n, e), d = /* @__PURE__ */ new Map(), h = (g, b, v) => {
      const L = b === "f32" ? new Float32Array(i * v) : new Uint32Array(i * v);
      return d.set(g, { format: b, elementsPerGaussian: v, values: L }), L;
    }, f = h("means", "f32", 4), u = h("scalesOpacity", "f32", 4), m = h("rotations", "f32", 4), p = h("shCoefficients", "u32", (s + 1) ** 2), w = h("lodLevel", "u32", 1), l = new Uint32Array(i);
    for (const [g, b] of r)
      h(g, b.format, b.elementsPerGaussian);
    const y = [];
    let I = 0, x = 1;
    for (const { entry: g, indices: b, levels: v, cellEnds: L } of c) {
      const E = g.source, k = E.shCoefficients.array;
      let P = 0;
      for (let M = 0; M < b.length; M++, I++) {
        for (; M >= L[P]; ) P++;
        l[I] = x + P;
        const S = b[M];
        f.set(
          E.means.array.subarray(S * 4, S * 4 + 4),
          I * 4
        ), f[I * 4 + 3] = g.objectId, u.set(
          E.scalesOpacity.array.subarray(S * 4, S * 4 + 4),
          I * 4
        ), m.set(
          E.rotations.array.subarray(S * 4, S * 4 + 4),
          I * 4
        ), w[I] = v[M];
        for (let R = 0; R < E.shCoefficientCount; R++) {
          const A = (S * E.shCoefficientCount + R) * 4;
          p[I * (s + 1) ** 2 + R] = Y(
            k[A],
            k[A + 1],
            k[A + 2]
          );
        }
        for (const [R, A] of g.attributes) {
          const j = d.get(R).values, _ = A.elementsPerGaussian;
          j.set(
            A.values.subarray(S * _, (S + 1) * _),
            I * _
          );
        }
      }
      x += L.length, y.push({
        cloudId: g.id,
        objectId: g.objectId,
        renderedCount: b.length
      });
    }
    return { capacity: i, count: n, degree: s, attributes: d, cells: l, clouds: y };
  }
  select(e, t) {
    const s = this.cameraPosition.clone().applyMatrix4(e.transform.clone().invert()), r = e.packingStrategy;
    switch (r.type) {
      case "maximum":
        return new K().pack({
          lod: e.lod,
          maxGaussians: t
        });
      case "radial":
        return new J({
          center: s,
          lodLevel: r.lodLevel
        }).pack({ lod: e.lod, maxGaussians: t });
      case "tiered-radial":
        return new X({
          center: s,
          budgetShares: r.budgetShares
        }).pack({ lod: e.lod, maxGaussians: t });
      case "distance-aware-radial":
        return new H({
          center: s,
          levelDistance: r.levelDistance
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
      ([s, r]) => ({
        name: s,
        format: r.format,
        elementsPerGaussian: r.elementsPerGaussian,
        data: r.values.slice().buffer
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
      if (this.updateScheduled = !1, !(this.disposed || !this.target || !this.packed))
        try {
          this.emitNextPatch();
        } catch (e) {
          this.drain?.reject(
            e instanceof Error ? e : new Error(String(e))
          ), this.drain = null, this.target = null;
        }
    }, 0));
  }
  emitNextPatch() {
    const e = this.packed, t = this.target, s = this.config.streamingLod?.maxUploadBytesPerUpdate ?? 1024 * 1024, r = Math.max(
      1,
      this.config.streamingLod?.maxChangedCellsPerUpdate ?? 16
    ), o = [...e.attributes.values()].reduce(
      (u, m) => u + m.elementsPerGaussian * 4,
      0
    ), c = Math.max(1, Math.floor(s / o)), n = [], i = /* @__PURE__ */ new Set();
    for (let u = 0; u < e.capacity && n.length < c; u++)
      if ([...e.attributes].some(([m, p]) => {
        const w = t.attributes.get(m).values, l = u * p.elementsPerGaussian;
        for (let y = 0; y < p.elementsPerGaussian; y++)
          if (p.values[l + y] !== w[l + y]) return !0;
        return !1;
      })) {
        const m = t.cells[u];
        if (!i.has(m) && i.size >= r) break;
        i.add(m), n.push(u);
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
      this.packed = {
        ...e,
        count: t.count,
        clouds: t.clouds,
        cells: t.cells
      }, this.target = null, this.drain?.resolve(), this.drain = null;
      return;
    }
    for (const [u, m] of e.attributes) {
      const p = m.elementsPerGaussian, w = t.attributes.get(u).values;
      let l = -1, y = -1;
      const I = () => {
        if (l < 0) return;
        const x = l * p, g = (y + 1) * p;
        m.values.set(w.subarray(x, g), x), d.push({
          name: u,
          firstSlot: l,
          slotCount: y - l + 1,
          data: w.slice(x, g).buffer
        }), l = -1;
      };
      for (const x of n) {
        const g = x * p;
        let b = !1;
        for (let v = 0; v < p; v++)
          if (m.values[g + v] !== w[g + v]) {
            b = !0;
            break;
          }
        if (!b) {
          I();
          continue;
        }
        l < 0 ? l = x : x !== y + 1 && (I(), l = x), y = x;
      }
      I();
    }
    const h = [...e.attributes].some(([u, m]) => {
      const p = t.attributes.get(u).values;
      return m.values.some((w, l) => w !== p[l]);
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
    }, this.target = null, this.drain?.resolve(), this.drain = null);
  }
}
function $(a) {
  if (!Number.isSafeInteger(a))
    throw new RangeError("Priority must be a safe integer");
  return a;
}
function ye(a, e) {
  const t = a.elementsPerGaussian;
  if (!Number.isSafeInteger(t) || t < 1)
    throw new RangeError("Attribute elementsPerGaussian must be positive");
  const s = e * t, r = a.format === "f32" ? new Float32Array(s) : new Uint32Array(s);
  if (a.source.kind === "fill")
    r.fill(a.source.value === "ones" ? 1 : 0);
  else {
    if (a.source.data.byteLength !== s * 4)
      throw new RangeError("Attribute buffer has the wrong byte length");
    r.set(
      a.format === "f32" ? new Float32Array(a.source.data) : new Uint32Array(a.source.data)
    );
  }
  return { format: a.format, elementsPerGaussian: t, values: r };
}
export {
  we as SerialRequestScheduler,
  Pe as StreamingGaussianBackend,
  be as createLoadCloudCommand,
  ve as createLoadCloudFromBufferCommand,
  ke as createSetCameraCommand,
  Ie as createSetCloudPackingCommand,
  Ce as createSetCloudPriorityCommand,
  Se as createSetCloudRaycastableCommand,
  Le as createSetCloudTransformCommand,
  Re as createSetFrontendCapabilitiesCommand,
  xe as createUnloadCloudCommand,
  Ee as createWriteAttributeRangeCommand
};
