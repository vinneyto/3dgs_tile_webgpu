import { Box3 as ss, Vector3 as nt, Object3D as Ps, Matrix4 as Ot, Ray as ei, LineSegments as si, BufferGeometry as ii, Float32BufferAttribute as ri, LineBasicMaterial as ai, BoxGeometry as ni, MeshBasicMaterial as oi, DoubleSide as ci, InstancedMesh as li, Color as ui, StorageBufferAttribute as Gt, IndirectStorageBufferAttribute as hi, Vector4 as di, Scene as Le, PassNode as is, HalfFloatType as rs, SRGBColorSpace as pi, StorageTexture as as, NoColorSpace as fi, RedFormat as mi, FloatType as gi, NearestFilter as ns, PerspectiveCamera as yi, Vector2 as xi } from "three/webgpu";
import { Vector3 as P, Box3 as Pe, Quaternion as bi, Matrix4 as wi } from "three";
import { property as z, bool as Bt, exp as Is, float as O, storage as y, uint as m, vec3 as ee, mix as _i, wgslFn as I, instanceIndex as Z, workgroupArray as $, workgroupId as Y, invocationLocalIndex as gt, uniform as Ut, uvec2 as Kt, Fn as te, If as R, Return as ht, vec4 as K, mat4 as os, normalize as vi, sqrt as Mt, clamp as mt, log as ki, ceil as cs, vec2 as ft, ivec2 as Yt, int as ls, floor as ke, subgroupIndex as de, invocationSubgroupIndex as pe, subgroupSize as fe, atomicStore as Si, storageTexture as Se, select as pt, Loop as Ft, Break as Wt, Continue as me, max as us, workgroupBarrier as hs, atomicAdd as Tt, textureStore as ds, colorSpaceToWorking as Ci } from "three/tsl";
class Mi {
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
  constructor(t, e) {
    if (!Number.isInteger(e.count) || e.count <= 0)
      throw new RangeError("GaussianData count must be a positive integer");
    const s = e.shDegree ?? 0;
    if (!Number.isInteger(s) || s < 0 || s > 3)
      throw new RangeError("GaussianData shDegree must be 0, 1, 2, or 3");
    if (this.count = e.count, this.shDegree = s, this.shCoefficientCount = (s + 1) ** 2, this.shFormat = e.shFormat ?? "float32", this.shFormat !== "float32" && this.shFormat !== "rgb8e8")
      throw new RangeError("GaussianData shFormat must be float32 or rgb8e8");
    this.means = t.means, this.scalesOpacity = t.scalesOpacity, this.rotations = t.rotations, this.shCoefficients = t.shCoefficients, this.ownsBuffers = e.ownsBuffers ?? !1, this.validateVec4Attribute(this.means, "means", this.count), this.validateVec4Attribute(this.scalesOpacity, "scalesOpacity", this.count), this.validateVec4Attribute(this.rotations, "rotations", this.count), this.validateShAttribute(
      this.shCoefficients,
      this.count * this.shCoefficientCount
    );
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsBuffers && (this.means.dispose(), this.scalesOpacity.dispose(), this.rotations.dispose(), this.shCoefficients.dispose()));
  }
  validateVec4Attribute(t, e, s) {
    if (t.isStorageBufferAttribute !== !0)
      throw new TypeError(
        `GaussianData ${e} must be a Three.js StorageBufferAttribute`
      );
    if (t.itemSize !== 4)
      throw new RangeError(
        `GaussianData ${e} itemSize is ${t.itemSize}; vec4 data requires itemSize 4`
      );
    if (!(t.array instanceof Float32Array))
      throw new TypeError(`GaussianData ${e} must use Float32Array storage`);
    if (t.count < s)
      throw new RangeError(
        `GaussianData ${e} has ${t.count} items; at least ${s} are required`
      );
  }
  validateShAttribute(t, e) {
    if (t.isStorageBufferAttribute !== !0)
      throw new TypeError(
        "GaussianData shCoefficients must be a Three.js StorageBufferAttribute"
      );
    const s = this.shFormat === "rgb8e8" ? 1 : 4;
    if (t.itemSize !== s)
      throw new RangeError(
        `GaussianData ${this.shFormat} shCoefficients itemSize is ${t.itemSize}; expected ${s}`
      );
    if (!(this.shFormat === "rgb8e8" ? t.array instanceof Uint32Array : t.array instanceof Float32Array))
      throw new TypeError(
        `GaussianData ${this.shFormat} shCoefficients use the wrong typed array`
      );
    if (t.count < e)
      throw new RangeError(
        `GaussianData shCoefficients has ${t.count} items; at least ${e} are required`
      );
  }
}
const zi = 16, As = 4;
function Li(n, t, e) {
  const s = Math.max(Math.abs(n), Math.abs(t), Math.abs(e));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const i = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), r = 127 / 2 ** i, a = ge(n, r), o = ge(t, r), c = ge(e, r), l = i + 127;
  return (a | o << 8 | c << 16 | l << 24) >>> 0;
}
function La(n) {
  const t = 2 ** ((n >>> 24) - 127) / 127;
  return [
    ye(n) * t,
    ye(n >>> 8) * t,
    ye(n >>> 16) * t
  ];
}
function Pa(n) {
  return n === "rgb8e8" ? As : zi;
}
function ge(n, t) {
  return Math.min(127, Math.max(-127, Math.round(n * t))) & 255;
}
function ye(n) {
  const t = n & 255;
  return t < 128 ? t : t - 256;
}
const ps = 1 / 255, Pi = 0.99, xe = 1e-12;
function Ii(n, t, e, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const i = t.means.array, r = t.scalesOpacity.array, a = t.rotations.array, o = new P(), c = new P(), l = new P(), u = new bi();
  let d = 1;
  for (const h of e) {
    const p = h.gaussianIndex * 4, g = Math.min(1, Math.max(0, r[p + 3]));
    if (g < ps) continue;
    u.set(
      -a[p],
      -a[p + 1],
      -a[p + 2],
      a[p + 3]
    ).normalize(), o.set(
      n.origin.x - i[p],
      n.origin.y - i[p + 1],
      n.origin.z - i[p + 2]
    ).applyQuaternion(u), c.copy(n.direction).applyQuaternion(u);
    const w = Math.max(r[p], xe), f = Math.max(r[p + 1], xe), x = Math.max(r[p + 2], xe);
    o.set(
      o.x / w,
      o.y / f,
      o.z / x
    ), c.set(
      c.x / w,
      c.y / f,
      c.z / x
    );
    const C = c.lengthSq();
    if (C <= Number.EPSILON) continue;
    const S = Math.max(
      0,
      -o.dot(c) / C
    );
    l.copy(o).addScaledVector(c, S);
    const _ = Math.min(
      Pi,
      g * Math.exp(-0.5 * l.lengthSq())
    );
    if (_ < ps || (d *= 1 - _, 1 - d < s)) continue;
    const v = n.at(S, new P());
    return {
      gaussianIndex: h.gaussianIndex,
      distance: n.origin.distanceTo(v),
      point: v
    };
  }
  return null;
}
class Ai {
  constructor(t, e, s, i, r, a, o, c) {
    this.id = t, this.depth = e, this.bounds = s, this.count = i, this.maxSplatRadius = r, this.raycastBounds = c, this.children = a, this.gaussianIndices = o;
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
class se {
  constructor(t, e, s, i) {
    this.data = t, this.leafCapacity = e, this.maxDepth = s, this.ownsData = i, this.bounds = Ri(t), this.rootBounds = Ei(this.bounds);
    const r = t.means.array, a = t.scalesOpacity.array, o = [], c = [], l = Array.from({ length: t.count }, (d, h) => h), u = (d, h, p) => {
      const g = o.length;
      o.push(null);
      const w = d.length > e && p < s && h.max.x - h.min.x > Number.EPSILON, f = [];
      if (w) {
        const S = h.getCenter(new P()), _ = Array.from({ length: 8 }, () => []);
        for (const v of d) {
          const k = v * 4, E = (r[k] >= S.x ? 1 : 0) | (r[k + 1] >= S.y ? 2 : 0) | (r[k + 2] >= S.z ? 4 : 0);
          _[E].push(v);
        }
        for (let v = 0; v < 8; v++) {
          const k = _[v];
          k.length !== 0 && f.push(
            u(
              k,
              Ni(h, S, v),
              p + 1
            )
          );
        }
      }
      let x = 0;
      if (f.length > 0)
        for (const S of f)
          x = Math.max(
            x,
            o[S].maxSplatRadius
          );
      else {
        for (const S of d) {
          const _ = S * 4;
          x = Math.max(
            x,
            a[_],
            a[_ + 1],
            a[_ + 2]
          );
        }
        c.push(g);
      }
      const C = h.clone().expandByScalar(x * 3);
      return o[g] = new Ai(
        g,
        p,
        h,
        d.length,
        x,
        f,
        f.length === 0 ? Uint32Array.from(d) : null,
        C
      ), g;
    };
    u(l, this.rootBounds.clone(), 0), this.nodes = o, this.leafNodeIds = Uint32Array.from(c);
  }
  data;
  leafCapacity;
  maxDepth;
  static build(t, e = {}) {
    const s = e.leafCapacity ?? 256, i = e.maxDepth ?? 10;
    if (!Number.isInteger(s) || s <= 0)
      throw new RangeError("GaussianOctree leafCapacity must be positive");
    if (!Number.isInteger(i) || i < 0)
      throw new RangeError("GaussianOctree maxDepth must be non-negative");
    return new se(
      t,
      s,
      i,
      e.ownsData ?? !1
    );
  }
  bounds;
  rootBounds;
  rootNode = 0;
  nodes;
  leafNodeIds;
  ownsData;
  disposed = !1;
  raycast(t, e = {}) {
    this.assertUsable();
    const s = e.radiusScale ?? 3;
    if (!(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const i = e.maxHits ?? 1 / 0;
    if (!(i > 0)) return [];
    const r = [], a = [this.rootNode];
    for (; a.length > 0; ) {
      const o = this.nodes[a.pop()], c = Math.max(0, s - 3) * o.maxSplatRadius, l = c === 0 ? o.raycastBounds : o.raycastBounds.clone().expandByScalar(c);
      if (t.intersectsBox(l))
        if (o.gaussianIndices !== null)
          for (const u of o.gaussianIndices) r.push(u);
        else
          for (const u of o.children) a.push(u);
    }
    return this.raycastIndices(t, r, s, i);
  }
  raycastIndices(t, e, s = 3, i = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(i > 0)) return [];
    const r = this.data.means.array, a = this.data.scalesOpacity.array, o = new P(), c = new P(), l = [];
    for (let u = 0; u < e.length; u++) {
      const d = e[u], h = d * 4;
      o.set(r[h], r[h + 1], r[h + 2]);
      const p = Math.max(
        a[h],
        a[h + 1],
        a[h + 2]
      ) * s;
      t.closestPointToPoint(o, c), !(c.distanceToSquared(o) > p * p) && l.push({
        gaussianIndex: d,
        distance: t.origin.distanceTo(c),
        point: c.clone()
      });
    }
    return l.sort((u, d) => u.distance - d.distance), l.length > i && (l.length = i), l;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function Ri(n) {
  const t = n.means.array, e = new Pe(), s = new P();
  for (let i = 0; i < n.count; i++) {
    const r = i * 4;
    s.set(t[r], t[r + 1], t[r + 2]), e.expandByPoint(s);
  }
  return e;
}
function Ei(n) {
  const t = n.getCenter(new P()), e = n.getSize(new P()), s = Math.max(e.x, e.y, e.z, 1e-6) * 0.5;
  return new Pe(
    new P(
      t.x - s,
      t.y - s,
      t.z - s
    ),
    new P(
      t.x + s,
      t.y + s,
      t.z + s
    )
  );
}
function Ni(n, t, e) {
  return new Pe(
    new P(
      e & 1 ? t.x : n.min.x,
      e & 2 ? t.y : n.min.y,
      e & 4 ? t.z : n.min.z
    ),
    new P(
      e & 1 ? n.max.x : t.x,
      e & 2 ? n.max.y : t.y,
      e & 4 ? n.max.z : t.z
    )
  );
}
class be {
  means;
  scalesOpacity;
  rotations;
  bounds;
  nodeChildren;
  children;
  nodeIndices;
  indices;
  constructor(t) {
    this.means = new Float32Array(t.means), this.scalesOpacity = new Float32Array(t.scalesOpacity), this.rotations = new Float32Array(t.rotations), this.bounds = new Float32Array(t.nodeBounds), this.nodeChildren = new Uint32Array(t.nodeChildren), this.children = new Uint32Array(t.children), this.nodeIndices = new Uint32Array(t.nodeIndices), this.indices = new Uint32Array(t.indices);
  }
  /** Cell bounds and depth for the sandbox's octree visualization. */
  debugCells() {
    const t = [], e = [[0, 0]];
    for (; e.length; ) {
      const [s, i] = e.pop(), r = s * 7;
      t.push({
        bounds: new ss(
          new nt(
            this.bounds[r],
            this.bounds[r + 1],
            this.bounds[r + 2]
          ),
          new nt(
            this.bounds[r + 3],
            this.bounds[r + 4],
            this.bounds[r + 5]
          )
        ),
        depth: i,
        isLeaf: this.nodeChildren[s * 2 + 1] === 0
      });
      const a = this.nodeChildren[s * 2], o = this.nodeChildren[s * 2 + 1];
      for (let c = 0; c < o; c++)
        e.push([this.children[a + c], i + 1]);
    }
    return t;
  }
  raycast(t, e = 0.5) {
    const s = [], i = [0], r = new ss();
    for (; i.length > 0; ) {
      const l = i.pop(), u = l * 7;
      if (r.min.set(
        this.bounds[u],
        this.bounds[u + 1],
        this.bounds[u + 2]
      ), r.max.set(
        this.bounds[u + 3],
        this.bounds[u + 4],
        this.bounds[u + 5]
      ), !t.intersectsBox(r)) continue;
      const d = this.nodeChildren[l * 2], h = this.nodeChildren[l * 2 + 1];
      if (h > 0)
        for (let p = 0; p < h; p++)
          i.push(this.children[d + p]);
      else {
        const p = this.nodeIndices[l * 2], g = this.nodeIndices[l * 2 + 1];
        for (let w = 0; w < g; w++)
          s.push(this.indices[p + w]);
      }
    }
    const a = new nt(), o = new nt(), c = [];
    for (const l of s) {
      const u = l * 4;
      a.set(
        this.means[u],
        this.means[u + 1],
        this.means[u + 2]
      );
      const d = Math.max(
        this.scalesOpacity[u],
        this.scalesOpacity[u + 1],
        this.scalesOpacity[u + 2]
      ) * 3;
      t.closestPointToPoint(a, o), !(o.distanceToSquared(a) > d * d) && c.push({
        gaussianIndex: l,
        distance: t.origin.distanceTo(o),
        point: o.clone()
      });
    }
    return c.sort((l, u) => l.distance - u.distance), Ii(
      t,
      {
        means: { array: this.means },
        scalesOpacity: { array: this.scalesOpacity },
        rotations: { array: this.rotations }
      },
      c,
      e
    );
  }
}
const Ti = (n, t, e, s) => ({ type: "load-cloud", id: n, cloudId: t, url: e, options: s }), Bi = (n, t, e, s) => ({
  type: "load-cloud-from-buffer",
  id: n,
  cloudId: t,
  buffer: e,
  options: s
}), Oi = (n, t) => ({ type: "unload-cloud", id: n, cloudId: t }), Gi = (n, t, e) => ({
  type: "set-cloud-priority",
  id: n,
  cloudId: t,
  priority: e
}), $i = (n, t, e) => ({
  type: "set-cloud-packing",
  id: n,
  cloudId: t,
  packingStrategy: e
}), Di = (n, t, e, s) => ({
  type: "set-cloud-transform",
  id: n,
  cloudId: t,
  sceneRevision: e,
  worldMatrix: s,
  latestKey: `cloud-transform:${t}`
}), ji = (n, t, e) => ({
  type: "set-cloud-raycastable",
  id: n,
  cloudId: t,
  raycastable: e
}), Vi = (n, t, e, s, i, r) => ({
  type: "write-attribute-range",
  id: n,
  cloudId: t,
  attribute: e,
  firstGaussian: s,
  gaussianCount: i,
  data: r
}), Ui = (n, t, e, s) => ({
  type: "set-camera",
  id: n,
  sceneRevision: t,
  worldMatrix: e,
  projectionMatrix: s,
  latestKey: "camera"
}), Fi = (n, t) => ({
  type: "set-frontend-capabilities",
  id: n,
  protocolVersion: 1,
  capabilities: { ...t }
});
class fs {
  constructor(t) {
    this.backend = t, this.unsubscribe = t.subscribe(this.receive), this.unsubscribeFailure = t.onFailure(this.fail);
  }
  backend;
  state = "waiting";
  queue = [];
  responses = /* @__PURE__ */ new Set();
  failures = /* @__PURE__ */ new Set();
  unsubscribe;
  unsubscribeFailure;
  active = null;
  handshake = null;
  handshakePromise = null;
  handshakeAccepted = !1;
  sequence = 0;
  disposed = !1;
  start(t) {
    return this.disposed || this.state === "failed" ? Promise.reject(new Error("RequestScheduler unavailable")) : this.handshake ? this.handshakePromise.then(() => this.start(t)) : (this.state = "handshaking", this.handshakeAccepted = !1, this.handshakePromise = new Promise((e, s) => {
      this.handshake = {
        command: Fi(
          `handshake-${++this.sequence}`,
          t
        ),
        resolve: () => e(),
        reject: s
      }, this.pump();
    }), this.handshakePromise);
  }
  schedule(t) {
    return this.disposed || this.state === "failed" ? Promise.reject(new Error("RequestScheduler unavailable")) : new Promise((e, s) => {
      const i = t.latestKey;
      if (i !== void 0) {
        const r = this.queue.findIndex(
          (a) => a.command.latestKey === i
        );
        r >= 0 && this.queue.splice(r, 1)[0].resolve("superseded");
      }
      this.queue.push({ command: t, resolve: e, reject: s }), this.pump();
    });
  }
  cancel(t) {
    const e = this.queue.findIndex(
      ({ command: s }) => s.id === t
    );
    e >= 0 ? this.queue.splice(e, 1)[0].resolve("superseded") : this.active?.command.id === t && this.backend.abort(t);
  }
  onResponse(t) {
    return this.responses.add(t), () => this.responses.delete(t);
  }
  onFailure(t) {
    return this.failures.add(t), () => this.failures.delete(t);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = !0;
    const t = new Error("RequestScheduler disposed");
    this.active?.reject(t), this.active = null, this.handshake?.reject(t), this.handshake = null, this.handshakePromise = null;
    for (const e of this.queue.splice(0)) e.reject(t);
    this.unsubscribe(), this.unsubscribeFailure(), this.responses.clear(), this.failures.clear(), this.backend.dispose();
  }
  pump() {
    if (this.disposed || this.active || this.state === "failed") return;
    const t = this.handshake ?? (this.state === "ready" ? this.queue.shift() : void 0);
    if (t) {
      this.active = t;
      try {
        this.backend.dispatch(t.command);
      } catch (e) {
        this.active = null;
        const s = e instanceof Error ? e : new Error(String(e));
        t.reject(s), t === this.handshake ? this.fail({ code: "handshake-failed", message: s.message }) : queueMicrotask(() => this.pump());
      }
    }
  }
  receive = (t) => {
    if (t.command.id !== this.active?.command.id || t.command.type !== this.active.command.type || t.error !== void 0 && (!t.isFinal || t.payload !== void 0)) {
      this.fail({
        code: "protocol-error",
        message: `Invalid response to ${t.command.id}`
      });
      return;
    }
    this.active === this.handshake && t.payload?.type === "capabilities-accepted" && t.payload.protocolVersion === 1 && (this.handshakeAccepted = !0);
    for (const i of this.responses) i(t);
    if (!t.isFinal) return;
    const e = this.active;
    this.active = null;
    const s = e === this.handshake;
    if (s && !t.error && !this.handshakeAccepted) {
      const i = new Error(
        "Backend did not confirm the frontend capabilities"
      );
      e.reject(i), this.fail({ code: "handshake-failed", message: i.message });
      return;
    }
    if (s && (this.handshake = null, this.handshakePromise = null, t.error || (this.state = "ready")), t.error) {
      const i = new Error(t.error.message);
      t.error.code === "cancelled" && (i.name = "AbortError"), e.reject(i), s && this.fail({ code: t.error.code, message: i.message });
    } else
      e.resolve("done");
    queueMicrotask(() => this.pump());
  };
  fail = (t) => {
    if (this.disposed || this.state === "failed") return;
    this.state = "failed";
    const e = new Error(t.message);
    this.active?.reject(e), this.active = null, this.handshake?.reject(e), this.handshake = null, this.handshakePromise = null;
    for (const s of this.queue.splice(0)) s.reject(e);
    for (const s of this.failures) s(t);
  };
}
function $t(n) {
  if (!Number.isInteger(n) || n < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
function Ie(n, t, e) {
  return n.updateWorldMatrix(!0, !1), t.updateWorldMatrix(!0, !1), n.getWorldPosition(e), t.worldToLocal(e);
}
function Ae(n, t) {
  const e = t instanceof P ? t.clone() : n.octree.bounds.getCenter(new P()), s = n.octree.rootBounds.getSize(new P()), i = Math.max(s.length() * 0.5, Number.EPSILON), r = new P(), a = Array.from(n.octree.leafNodeIds, (o) => (n.octree.nodes[o].bounds.getCenter(r), {
    nodeId: o,
    radius: r.distanceTo(e) / i
  }));
  return a.sort(
    (o, c) => o.radius - c.radius || o.nodeId - c.nodeId
  ), a;
}
class Wi {
  cameraCenter = new P();
  center;
  levelDistance;
  constructor(t = {}) {
    if (this.center = t.center instanceof P ? t.center.clone() : t.center ?? "bounds-center", this.levelDistance = t.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(t) {
    return this.center = t instanceof P ? t.clone() : t, this;
  }
  setFromCamera(t, e) {
    return this.setCenter(
      Ie(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if ($t(e), e === 0) return qi();
    const s = Ae(t, this.center), i = s.map(
      ({ radius: o }) => Math.max(0, t.finestLevel - Math.floor(o / this.levelDistance))
    );
    let r = s.reduce(
      (o, c, l) => o + t.nodes[c.nodeId].levelCounts[i[l]],
      0
    );
    for (let o = s.length - 1; o >= 0 && r > e; o--) {
      const c = t.nodes[s[o].nodeId];
      for (; i[o] > 0 && r > e; ) {
        const l = c.levelCounts[i[o]];
        i[o] = i[o] - 1, r -= l - c.levelCounts[i[o]];
      }
    }
    let a = s.length;
    for (; a > 0 && r > e; ) {
      a--;
      const o = t.nodes[s[a].nodeId];
      r -= o.levelCounts[i[a]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, a).map(({ nodeId: o }) => o)
      ),
      lodLevels: Uint8Array.from(i.slice(0, a)),
      gaussianCount: r
    };
  }
}
function qi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Yi {
  setFromCamera(t, e) {
    return this;
  }
  pack({ lod: t, maxGaussians: e }) {
    $t(e);
    const s = t.octree.data.count;
    if (e < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${e}`
      );
    const i = t.octree.leafNodeIds.slice(), r = new Uint8Array(i.length);
    return r.fill(t.finestLevel), { nodeIds: i, lodLevels: r, gaussianCount: s };
  }
}
class Hi {
  cameraCenter = new P();
  center;
  lodLevel;
  constructor(t = {}) {
    if (this.center = t.center instanceof P ? t.center.clone() : t.center ?? "bounds-center", t.lodLevel !== void 0 && t.lodLevel !== "finest" && (!Number.isInteger(t.lodLevel) || t.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = t.lodLevel ?? "finest";
  }
  setCenter(t) {
    return this.center = t instanceof P ? t.clone() : t, this;
  }
  setFromCamera(t, e) {
    return this.setCenter(
      Ie(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if ($t(e), e === 0) return Ki();
    const s = this.lodLevel === "finest" ? t.finestLevel : this.lodLevel;
    if (s >= t.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const i = Ae(t, this.center), r = [];
    let a = 0;
    for (const c of i) {
      const l = t.nodes[c.nodeId].levelCounts[s];
      if (a + l > e) break;
      r.push(c.nodeId), a += l;
    }
    const o = new Uint8Array(r.length);
    return o.fill(s), {
      nodeIds: Uint32Array.from(r),
      lodLevels: o,
      gaussianCount: a
    };
  }
}
function Ki() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Xi {
  cameraCenter = new P();
  center;
  budgetShares;
  constructor(t = {}) {
    this.center = t.center instanceof P ? t.center.clone() : t.center ?? "bounds-center", this.budgetShares = Zi(
      t.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(t) {
    return this.center = t instanceof P ? t.clone() : t, this;
  }
  setFromCamera(t, e) {
    return this.setCenter(
      Ie(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if ($t(e), e === 0) return Qi();
    const s = t.octree.data.count;
    if (s <= e) {
      const d = t.octree.leafNodeIds.slice(), h = new Uint8Array(d.length);
      return h.fill(t.finestLevel), { nodeIds: d, lodLevels: h, gaussianCount: s };
    }
    const i = Ae(t, this.center), r = [
      t.finestLevel,
      Math.max(0, t.finestLevel - 1),
      0
    ], a = [], o = [];
    let c = 0, l = 0, u = 0;
    for (let d = 0; d < r.length; d++) {
      const h = this.budgetShares[d];
      if (u += h, h === 0) continue;
      const p = d === r.length - 1 ? e : Math.floor(e * u), g = r[d];
      for (; l < i.length; ) {
        const w = i[l], f = t.nodes[w.nodeId].levelCounts[g];
        if (c + f > p) break;
        a.push(w.nodeId), o.push(g), c += f, l++;
      }
    }
    return {
      nodeIds: Uint32Array.from(a),
      lodLevels: Uint8Array.from(o),
      gaussianCount: c
    };
  }
}
function Zi(n) {
  let t = 0;
  for (const e of n) {
    if (!(e >= 0 && e <= 1))
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    t += e;
  }
  if (Math.abs(t - 1) > 1e-6)
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  return Object.freeze([...n]);
}
function Qi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Ji {
  constructor(t, e, s, i, r, a) {
    this.count = t, this.shDegree = e, this.shCoefficientCount = (e + 1) ** 2, this.means = { array: s }, this.scalesOpacity = { array: i }, this.rotations = { array: r }, this.shCoefficients = { array: a };
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
}, tr = [
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
class er {
  async load(t) {
    const e = await fetch(t);
    if (!e.ok)
      throw new Error(
        `Failed to load PLY: ${e.status} ${e.statusText}`
      );
    if (e.headers.get("content-type")?.includes("text/html"))
      throw new Error(
        `Failed to load PLY: ${e.url || t} returned HTML instead of a PLY file`
      );
    return this.parse(await e.arrayBuffer());
  }
  parse(t) {
    const e = sr(t), s = new Map(
      e.properties.map((f, x) => [f.name, x])
    );
    for (const f of tr)
      if (!s.has(f))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${f}`);
    const i = e.properties.map((f) => f.name.match(/^f_rest_(\d+)$/)?.[1]).filter((f) => f !== void 0).map(Number).sort((f, x) => f - x);
    for (let f = 0; f < i.length; f++)
      if (i[f] !== f)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (i.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const r = i.length / 3, a = r + 1, o = Math.sqrt(a);
    if (!Number.isInteger(o) || o < 1 || o > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const c = ir(t, e), l = (f) => s.get(f), u = i.map(
      (f) => l(`f_rest_${f}`)
    ), d = e.vertexCount, h = new Float32Array(d * 4), p = new Float32Array(d * 4), g = new Float32Array(d * 4), w = new Float32Array(d * a * 4);
    for (let f = 0; f < d; f++) {
      const x = f * 4;
      h[x] = c(f, l("x")), h[x + 1] = c(f, l("y")), h[x + 2] = c(f, l("z")), p[x] = Math.max(
        Math.exp(c(f, l("scale_0"))),
        1e-6
      ), p[x + 1] = Math.max(
        Math.exp(c(f, l("scale_1"))),
        1e-6
      ), p[x + 2] = Math.max(
        Math.exp(c(f, l("scale_2"))),
        1e-6
      );
      const C = c(f, l("opacity"));
      p[x + 3] = 1 / (1 + Math.exp(-C));
      const S = c(f, l("rot_0")), _ = c(f, l("rot_1")), v = c(f, l("rot_2")), k = c(f, l("rot_3")), E = Math.hypot(_, v, k, S);
      E > 1e-12 ? (g[x] = _ / E, g[x + 1] = v / E, g[x + 2] = k / E, g[x + 3] = S / E) : g[x + 3] = 1;
      const L = f * a * 4;
      w[L] = c(f, l("f_dc_0")), w[L + 1] = c(f, l("f_dc_1")), w[L + 2] = c(f, l("f_dc_2"));
      for (let A = 1; A < a; A++) {
        const U = L + A * 4, j = A - 1;
        for (let N = 0; N < 3; N++) {
          const V = u[N * r + j];
          w[U + N] = c(
            f,
            V
          );
        }
      }
    }
    return new Ji(
      d,
      o - 1,
      h,
      p,
      g,
      w
    );
  }
}
function sr(n) {
  const t = new Uint8Array(n), e = new TextEncoder().encode("end_header");
  let s = -1;
  for (let g = 0; g <= t.length - e.length; g++) {
    let w = !0;
    for (let f = 0; f < e.length; f++)
      if (t[g + f] !== e[f]) {
        w = !1;
        break;
      }
    if (w) {
      s = g;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let i = s + e.length;
  if (t[i] === 13 && i++, t[i] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  i++;
  const a = new TextDecoder().decode(t.subarray(0, i)).split(/\r?\n/);
  if (a[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let o = null, c = "", l = -1, u = 0;
  const d = [], h = [];
  for (const g of a) {
    const w = g.trim().split(/\s+/);
    if (w[0] === "format") {
      if (w[1] !== "ascii" && w[1] !== "binary_little_endian" && w[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${w[1] ?? "unknown"}`);
      o = w[1];
    } else if (w[0] === "element") {
      c = w[1] ?? "";
      const f = Number(w[2]);
      if (!Number.isInteger(f) || f < 0)
        throw new Error(`Invalid element count for ${c}`);
      h.push({ name: c, count: f }), c === "vertex" && (l = f);
    } else if (w[0] === "property" && c === "vertex") {
      if (w[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const f = w[1], x = w[2];
      if (!(f in ms) || x === void 0)
        throw new Error(`Unsupported vertex property: ${g}`);
      d.push({ name: x, type: f, byteOffset: u }), u += ms[f];
    }
  }
  if (o === null) throw new Error("Invalid PLY: format is missing");
  if (l <= 0) throw new Error("PLY must contain at least one vertex");
  if (h.find(
    (g) => g.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: o, vertexCount: l, properties: d, vertexStride: u, dataOffset: i };
}
function ir(n, t) {
  if (t.format === "ascii") {
    const r = new TextDecoder().decode(
      new Uint8Array(n, t.dataOffset)
    ), a = new Float64Array(
      t.vertexCount * t.properties.length
    );
    let o = 0;
    for (let c = 0; c < a.length; c++) {
      for (; o < r.length && /\s/.test(r[o]); ) o++;
      const l = o;
      for (; o < r.length && !/\s/.test(r[o]); ) o++;
      const u = Number(r.slice(l, o));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${c}`);
      a[c] = u;
    }
    return (c, l) => a[c * t.properties.length + l];
  }
  if (t.dataOffset + t.vertexCount * t.vertexStride > n.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(n), i = t.format === "binary_little_endian";
  return (r, a) => {
    const o = t.properties[a], c = t.dataOffset + r * t.vertexStride + o.byteOffset;
    return rr(s, c, o.type, i);
  };
}
function rr(n, t, e, s) {
  switch (e) {
    case "char":
    case "int8":
      return n.getInt8(t);
    case "uchar":
    case "uint8":
      return n.getUint8(t);
    case "short":
    case "int16":
      return n.getInt16(t, s);
    case "ushort":
    case "uint16":
      return n.getUint16(t, s);
    case "int":
    case "int32":
      return n.getInt32(t, s);
    case "uint":
    case "uint32":
      return n.getUint32(t, s);
    case "float":
    case "float32":
      return n.getFloat32(t, s);
    case "double":
    case "float64":
      return n.getFloat64(t, s);
  }
}
function we(n) {
  const t = n.nodes, e = new Float32Array(t.length * 7), s = new Uint32Array(t.length * 2), i = new Uint32Array(t.length * 2), r = [], a = [];
  for (const c of t) {
    const l = c.id * 7, { min: u, max: d } = c.raycastBounds;
    if (e.set(
      [u.x, u.y, u.z, d.x, d.y, d.z, c.maxSplatRadius],
      l
    ), s.set([r.length, c.children.length], c.id * 2), r.push(...c.children), i.set(
      [a.length, c.gaussianIndices?.length ?? 0],
      c.id * 2
    ), c.gaussianIndices !== null)
      for (const h of c.gaussianIndices) a.push(h);
  }
  const o = n.data;
  return {
    means: Float32Array.from(o.means.array).buffer,
    scalesOpacity: Float32Array.from(o.scalesOpacity.array).buffer,
    rotations: Float32Array.from(o.rotations.array).buffer,
    nodeBounds: e.buffer,
    nodeChildren: s.buffer,
    children: Uint32Array.from(r).buffer,
    nodeIndices: i.buffer,
    indices: Uint32Array.from(a).buffer
  };
}
class gs {
  constructor(t, e, s) {
    this.octreeNodeId = t, this.sortedGaussianIndices = e, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const ar = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class ie {
  constructor(t, e) {
    this.octree = t, this.levels = nr(e.levels ?? ar), this.ownsOctree = e.ownsOctree ?? !1;
    const s = e.importance ?? or, i = new Float64Array(t.data.count);
    for (let r = 0; r < i.length; r++) {
      const a = s(r, t);
      i[r] = Number.isFinite(a) ? a : -1 / 0;
    }
    this.nodes = t.nodes.map((r) => {
      if (r.gaussianIndices === null)
        return new gs(
          r.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const a = Uint32Array.from(
        Array.from(r.gaussianIndices).sort(
          (o, c) => i[c] - i[o] || o - c
        )
      );
      return new gs(
        r.id,
        a,
        Uint32Array.from(
          this.levels.map(
            ({ retention: o }) => Math.min(
              a.length,
              Math.max(1, Math.ceil(a.length * o))
            )
          )
        )
      );
    });
  }
  octree;
  static build(t, e = {}) {
    return new ie(t, e);
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
  getNode(t) {
    this.assertUsable();
    const e = this.nodes[t];
    if (e === void 0)
      throw new RangeError(`GaussianLod node ${t} does not exist`);
    return e;
  }
  /** Expand a compact cell/level packing into source Gaussian indices. */
  indicesForPacking(t) {
    if (this.assertUsable(), t.nodeIds.length !== t.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const e = new Uint32Array(t.gaussianCount), s = /* @__PURE__ */ new Set();
    let i = 0;
    for (let r = 0; r < t.nodeIds.length; r++) {
      const a = t.nodeIds[r], o = this.getLeafNode(a);
      if (s.has(a))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${a}`
        );
      s.add(a);
      const c = t.lodLevels[r], l = o.levelCounts[c];
      if (l === void 0)
        throw new RangeError(`GaussianLod level ${c} does not exist`);
      if (i + l > e.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let u = 0; u < l; u++)
        e[i++] = o.sortedGaussianIndices[u];
    }
    if (i !== e.length)
      throw new RangeError(
        `GaussianLodPacking declares ${e.length} Gaussians but selects ${i}`
      );
    return e;
  }
  raycast(t, e, s = {}) {
    this.assertUsable();
    const i = s.radiusScale ?? 3;
    if (!(i > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const r = s.maxHits ?? 1 / 0;
    if (!(r > 0)) return [];
    if (e.nodeIds.length !== e.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const a = this.octree.data.means.array, o = this.octree.data.scalesOpacity.array, c = new P(), l = new P(), u = [], d = /* @__PURE__ */ new Set();
    for (let h = 0; h < e.nodeIds.length; h++) {
      const p = e.nodeIds[h], g = this.getLeafNode(p);
      if (d.has(p))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${p}`
        );
      d.add(p);
      const w = e.lodLevels[h], f = g.levelCounts[w];
      if (f === void 0)
        throw new RangeError(`GaussianLod level ${w} does not exist`);
      const x = this.octree.nodes[p], C = Math.max(0, i - 3) * x.maxSplatRadius, S = C === 0 ? x.raycastBounds : x.raycastBounds.clone().expandByScalar(C);
      if (t.intersectsBox(S))
        for (let _ = 0; _ < f; _++) {
          const v = g.sortedGaussianIndices[_], k = v * 4;
          c.set(a[k], a[k + 1], a[k + 2]);
          const E = Math.max(
            o[k],
            o[k + 1],
            o[k + 2]
          ) * i;
          t.closestPointToPoint(c, l), !(l.distanceToSquared(c) > E * E) && u.push({
            gaussianIndex: v,
            distance: t.origin.distanceTo(l),
            point: l.clone()
          });
        }
    }
    return u.sort((h, p) => h.distance - p.distance), u.length > r && (u.length = r), u;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsOctree && this.octree.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianLod has been disposed");
  }
  getLeafNode(t) {
    const e = this.getNode(t);
    if (this.octree.nodes[t]?.isLeaf !== !0)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${t} is internal`
      );
    return e;
  }
}
function nr(n) {
  if (n.length === 0 || n.length > 256)
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  let t = 0;
  const e = n.map(({ retention: s }) => {
    if (!(s > t && s <= 1))
      throw new RangeError(
        "GaussianLod retention values must increase and stay in (0, 1]"
      );
    return t = s, Object.freeze({ retention: s });
  });
  if (Math.abs(t - 1) > Number.EPSILON)
    throw new RangeError("GaussianLod finest retention must be 1");
  return Object.freeze(e);
}
function or(n, t) {
  const e = t.data.scalesOpacity.array, s = n * 4, i = [e[s], e[s + 1], e[s + 2]];
  return i.sort((r, a) => a - r), e[s + 3] * i[0] * i[1];
}
const cr = /* @__PURE__ */ new Set([
  "means",
  "scalesOpacity",
  "rotations",
  "shCoefficients",
  "lodLevel"
]), lr = new wi();
class Ia {
  listeners = /* @__PURE__ */ new Set();
  failureListeners = /* @__PURE__ */ new Set();
  clouds = /* @__PURE__ */ new Map();
  usedCloudIds = /* @__PURE__ */ new Set();
  usedCommandIds = /* @__PURE__ */ new Set();
  activeLoads = /* @__PURE__ */ new Map();
  parser = new er();
  config;
  frontend = null;
  nextObjectId = 0;
  layoutVersion = 0;
  contentVersion = 0;
  sceneRevision = 0;
  cameraPosition = new P();
  packed = null;
  target = null;
  updateScheduled = !1;
  active = null;
  startedAt = 0;
  drain = null;
  disposed = !1;
  constructor(t) {
    this.config = t;
  }
  subscribe(t) {
    if (this.disposed) throw new Error("Backend disposed");
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  onFailure(t) {
    return this.failureListeners.add(t), () => this.failureListeners.delete(t);
  }
  dispatch(t) {
    if (this.disposed) throw new Error("Backend disposed");
    if (this.usedCommandIds.has(t.id))
      throw new Error(`Duplicate backend command id: ${t.id}`);
    if (this.usedCommandIds.add(t.id), this.active)
      throw new Error("Backend accepts only one command at a time");
    if (!this.frontend && t.type !== "set-frontend-capabilities")
      throw new Error("Frontend handshake is required before commands");
    this.active = t, this.startedAt = performance.now(), this.run(t);
  }
  abort(t) {
    this.activeLoads.get(t)?.abort();
  }
  async run(t) {
    try {
      await this.handle(t), this.target && await new Promise((e, s) => {
        this.drain = { resolve: e, reject: s };
      }), this.respond(t, { isFinal: !0 });
    } catch (e) {
      this.respond(t, {
        isFinal: !0,
        error: {
          code: e instanceof DOMException && e.name === "AbortError" ? "cancelled" : e instanceof RangeError ? "invalid-range" : "backend-error",
          message: e instanceof Error ? e.message : String(e),
          cloudId: "cloudId" in t ? t.cloudId : void 0
        }
      });
    } finally {
      this.active = null;
    }
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0;
      for (const t of this.activeLoads.values()) t.abort();
      this.activeLoads.clear(), this.drain?.reject(new Error("Backend disposed")), this.drain = null, this.listeners.clear(), this.failureListeners.clear(), this.clouds.clear(), this.packed = null, this.target = null;
    }
  }
  respond(t, e) {
    if (this.disposed) return;
    const s = {
      command: { id: t.id, type: t.type },
      durationMs: t === this.active || t.id === this.active?.id ? performance.now() - this.startedAt : 0,
      ...e
    };
    for (const i of this.listeners) i(s);
  }
  emit(t) {
    if (!this.active) throw new Error("Unsolicited backend output");
    this.respond(this.active, { isFinal: !1, payload: t });
  }
  async handle(t) {
    switch (t.type) {
      case "load-cloud":
      case "load-cloud-from-buffer": {
        if (this.usedCloudIds.has(t.cloudId))
          throw new Error(`Cloud id already used: ${t.cloudId}`);
        const e = new AbortController();
        this.activeLoads.set(t.id, e);
        try {
          let s;
          if (t.type === "load-cloud") {
            const d = await fetch(t.url, {
              signal: e.signal
            });
            if (!d.ok)
              throw new Error(`PLY fetch failed: ${d.status}`);
            if (d.headers.get("content-type")?.includes("text/html"))
              throw new Error("PLY URL returned HTML instead of a PLY file");
            const h = await d.arrayBuffer();
            if (e.signal.aborted)
              throw new DOMException("Load cancelled", "AbortError");
            s = this.parser.parse(h);
          } else
            s = this.parser.parse(t.buffer);
          const i = t.options ?? {}, r = se.build(s, i.octree), a = ie.build(r, i.lod), o = {
            id: t.cloudId,
            objectId: this.nextObjectId++,
            source: s,
            octree: r,
            lod: a,
            octreeOptions: i.octree,
            lodOptions: i.lod,
            attributes: /* @__PURE__ */ new Map(),
            transform: lr.clone(),
            priority: ys(i.priority ?? 0),
            packingStrategy: i.packingStrategy ?? this.config.defaultPackingStrategy ?? { type: "tiered-radial" },
            raycastable: i.raycastable ?? !0,
            sourceVersion: 1
          };
          for (const d of i.attributes ?? []) {
            if (cr.has(d.name) || o.attributes.has(d.name))
              throw new Error(
                `Reserved or duplicate attribute name: ${d.name}`
              );
            o.attributes.set(
              d.name,
              ur(d, s.count)
            );
          }
          for (const d of this.clouds.values())
            for (const [h, p] of o.attributes) {
              const g = d.attributes.get(h);
              if (g && (g.format !== p.format || g.elementsPerGaussian !== p.elementsPerGaussian))
                throw new Error(
                  `Attribute schema differs across clouds: ${h}`
                );
            }
          this.usedCloudIds.add(o.id), this.clouds.set(o.id, o);
          let c = null;
          if (this.frontend)
            try {
              c = this.compute();
            } catch (d) {
              throw this.clouds.delete(o.id), this.usedCloudIds.delete(o.id), d;
            }
          const { min: l, max: u } = r.bounds;
          this.emit({
            type: "cloud-loaded",
            cloudId: o.id,
            objectId: o.objectId,
            sourceCount: s.count,
            shDegree: s.shDegree,
            bounds: [l.x, l.y, l.z, u.x, u.y, u.z],
            raycast: o.raycastable ? we(r) : void 0
          }), c && (this.target = null, this.replace(c));
          return;
        } finally {
          this.activeLoads.delete(t.id);
        }
      }
      case "unload-cloud":
        this.clouds.delete(t.cloudId), this.emit({
          type: "cloud-unloaded",
          cloudId: t.cloudId
        }), this.repack();
        return;
      case "set-cloud-priority":
        {
          const e = this.getCloud(t.cloudId), s = e.priority;
          e.priority = ys(t.priority);
          try {
            this.repack();
          } catch (i) {
            throw e.priority = s, i;
          }
        }
        break;
      case "set-cloud-packing":
        {
          const e = this.getCloud(t.cloudId), s = e.packingStrategy;
          e.packingStrategy = t.packingStrategy;
          try {
            this.repack();
          } catch (i) {
            throw e.packingStrategy = s, i;
          }
        }
        break;
      case "set-cloud-transform": {
        const e = this.getCloud(t.cloudId);
        if (t.worldMatrix.length !== 16)
          throw new RangeError("Cloud transform needs sixteen numbers");
        if (t.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = t.sceneRevision, e.transform.fromArray(t.worldMatrix), this.updateTarget();
        return;
      }
      case "set-cloud-raycastable": {
        const e = this.getCloud(t.cloudId);
        e.raycastable = t.raycastable, this.emit({
          type: "cloud-raycast-changed",
          cloudId: e.id,
          raycastable: e.raycastable,
          raycast: e.raycastable ? we(e.octree) : void 0
        });
        return;
      }
      case "write-attribute-range":
        this.writeRange(t), this.updateTarget();
        break;
      case "set-frontend-capabilities": {
        if (t.protocolVersion !== 1)
          throw new Error(
            `Unsupported frontend protocol: ${t.protocolVersion}`
          );
        const { capabilities: e } = t;
        for (const i of [
          e.maxStorageBufferBindingSize,
          e.maxBufferSize,
          e.maxStorageBuffersPerShaderStage
        ])
          if (!Number.isSafeInteger(i) || i <= 0)
            throw new RangeError(
              "Frontend buffer limits must be positive integers"
            );
        if (typeof e.supportsPartialBufferUpdates != "boolean")
          throw new TypeError(
            "Frontend partial update support must be boolean"
          );
        const s = this.frontend;
        this.frontend = { ...e };
        try {
          this.clouds.size > 0 && this.repack();
        } catch (i) {
          throw this.frontend = s, i;
        }
        this.emit({ type: "capabilities-accepted", protocolVersion: 1 });
        break;
      }
      case "set-camera":
        if (t.worldMatrix.length !== 16 || t.projectionMatrix.length !== 16)
          throw new RangeError("Camera matrices need sixteen numbers each");
        if (t.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = t.sceneRevision, this.cameraPosition.set(
          t.worldMatrix[12],
          t.worldMatrix[13],
          t.worldMatrix[14]
        ), this.updateTarget();
        break;
    }
  }
  getCloud(t) {
    const e = this.clouds.get(t);
    if (!e) throw new Error(`Unknown cloud: ${t}`);
    return e;
  }
  writeRange(t) {
    const e = this.getCloud(t.cloudId), {
      firstGaussian: s,
      gaussianCount: i,
      attribute: r
    } = t;
    if (!Number.isSafeInteger(s) || !Number.isSafeInteger(i) || s < 0 || i < 0 || s + i > e.source.count)
      throw new RangeError("Attribute range exceeds source cloud");
    if (r === "lodLevel")
      throw new Error("lodLevel is computed by the backend");
    let a, o;
    switch (r) {
      case "means":
        a = e.source.means.array, o = 4;
        break;
      case "scalesOpacity":
        a = e.source.scalesOpacity.array, o = 4;
        break;
      case "rotations":
        a = e.source.rotations.array, o = 4;
        break;
      case "shCoefficients":
        a = e.source.shCoefficients.array, o = e.source.shCoefficientCount * 4;
        break;
      default: {
        const l = e.attributes.get(r);
        if (!l) throw new Error(`Unknown source attribute: ${r}`);
        a = l.values, o = l.elementsPerGaussian;
      }
    }
    if (t.data.byteLength !== i * o * 4)
      throw new RangeError("Attribute update has the wrong byte length");
    const c = a instanceof Uint32Array ? new Uint32Array(t.data) : new Float32Array(t.data);
    if (a.set(c, s * o), (r === "means" || r === "scalesOpacity" || r === "rotations") && (e.octree = se.build(e.source, e.octreeOptions), e.lod = ie.build(e.octree, e.lodOptions), e.sourceVersion++, e.raycastable)) {
      const { min: l, max: u } = e.octree.bounds;
      this.emit({
        type: "raycast-replaced",
        cloudId: e.id,
        sourceVersion: e.sourceVersion,
        bounds: [l.x, l.y, l.z, u.x, u.y, u.z],
        raycast: we(e.octree)
      });
    }
  }
  maxSlots(t, e) {
    const s = this.frontend;
    if (!s)
      throw new Error("Frontend capabilities have not been supplied");
    const i = Math.min(
      s.maxStorageBufferBindingSize,
      s.maxBufferSize
    ), r = [
      16,
      16,
      16,
      (t + 1) ** 2 * 4,
      4,
      ...[...e.values()].map((o) => o.elementsPerGaussian * 4)
    ], a = Math.min(
      ...r.map((o) => Math.floor(i / o))
    );
    if (a < 1)
      throw new RangeError("Frontend buffer limits are too small");
    return Math.min(
      a,
      this.config.maxGaussians === "auto" || this.config.maxGaussians === void 0 ? a : this.config.maxGaussians
    );
  }
  compute(t = 0) {
    const e = [...this.clouds.values()].sort(
      (_, v) => _.priority - v.priority || _.objectId - v.objectId
    ), s = e.reduce(
      (_, v) => Math.max(_, v.source.shDegree),
      0
    ), i = /* @__PURE__ */ new Map();
    for (const _ of e)
      for (const [v, k] of _.attributes) i.set(v, k);
    let r = this.maxSlots(s, i);
    const a = [];
    for (const _ of e) {
      const v = this.select(
        _,
        Math.min(r, _.source.count)
      ), k = _.lod.indicesForPacking(v), E = new Uint32Array(k.length), L = [];
      let A = 0;
      for (let U = 0; U < v.nodeIds.length; U++) {
        const j = _.lod.nodes[v.nodeIds[U]], N = v.lodLevels[U], V = j.levelCounts[N];
        E.fill(N, A, A + V), A += V, L.push(A);
      }
      a.push({ entry: _, indices: k, levels: E, cellEnds: L }), r -= k.length;
    }
    const o = a.reduce(
      (_, v) => _ + v.indices.length,
      0
    ), c = Math.max(1, o, t), l = /* @__PURE__ */ new Map(), u = (_, v, k) => {
      const E = v === "f32" ? new Float32Array(c * k) : new Uint32Array(c * k);
      return l.set(_, { format: v, elementsPerGaussian: k, values: E }), E;
    }, d = u("means", "f32", 4), h = u("scalesOpacity", "f32", 4), p = u("rotations", "f32", 4), g = u("shCoefficients", "u32", (s + 1) ** 2), w = u("lodLevel", "u32", 1), f = new Uint32Array(c);
    for (const [_, v] of i)
      u(_, v.format, v.elementsPerGaussian);
    const x = [];
    let C = 0, S = 1;
    for (const { entry: _, indices: v, levels: k, cellEnds: E } of a) {
      const L = _.source, A = L.shCoefficients.array;
      let U = 0;
      for (let j = 0; j < v.length; j++, C++) {
        for (; j >= E[U]; ) U++;
        f[C] = S + U;
        const N = v[j];
        d.set(
          L.means.array.subarray(N * 4, N * 4 + 4),
          C * 4
        ), d[C * 4 + 3] = _.objectId, h.set(
          L.scalesOpacity.array.subarray(N * 4, N * 4 + 4),
          C * 4
        ), p.set(
          L.rotations.array.subarray(N * 4, N * 4 + 4),
          C * 4
        ), w[C] = k[j];
        for (let V = 0; V < L.shCoefficientCount; V++) {
          const Q = (N * L.shCoefficientCount + V) * 4;
          g[C * (s + 1) ** 2 + V] = Li(
            A[Q],
            A[Q + 1],
            A[Q + 2]
          );
        }
        for (const [V, Q] of _.attributes) {
          const yt = l.get(V).values, J = Q.elementsPerGaussian;
          yt.set(
            Q.values.subarray(N * J, (N + 1) * J),
            C * J
          );
        }
      }
      S += E.length, x.push({
        cloudId: _.id,
        objectId: _.objectId,
        renderedCount: v.length
      });
    }
    return { capacity: c, count: o, degree: s, attributes: l, cells: f, clouds: x };
  }
  select(t, e) {
    const s = this.cameraPosition.clone().applyMatrix4(t.transform.clone().invert()), i = t.packingStrategy;
    switch (i.type) {
      case "maximum":
        return new Yi().pack({
          lod: t.lod,
          maxGaussians: e
        });
      case "radial":
        return new Hi({
          center: s,
          lodLevel: i.lodLevel
        }).pack({ lod: t.lod, maxGaussians: e });
      case "tiered-radial":
        return new Xi({
          center: s,
          budgetShares: i.budgetShares
        }).pack({ lod: t.lod, maxGaussians: e });
      case "distance-aware-radial":
        return new Wi({
          center: s,
          levelDistance: i.levelDistance
        }).pack({ lod: t.lod, maxGaussians: e });
    }
  }
  repack() {
    if (!this.frontend) return;
    this.target = null;
    const t = this.compute();
    this.replace(t);
  }
  updateTarget() {
    if (!this.frontend || !this.packed) return;
    const t = this.compute(this.packed.capacity);
    if (!this.frontend.supportsPartialBufferUpdates) {
      this.replace(t);
      return;
    }
    if (t.capacity !== this.packed.capacity || t.degree !== this.packed.degree || [...t.attributes].some(
      ([e, s]) => this.packed?.attributes.get(e)?.elementsPerGaussian !== s.elementsPerGaussian
    )) {
      this.replace(t);
      return;
    }
    this.target = t, this.scheduleUpdate();
  }
  replace(t) {
    this.packed = t, this.layoutVersion++, this.contentVersion++;
    const e = [...t.attributes].map(
      ([s, i]) => ({
        name: s,
        format: i.format,
        elementsPerGaussian: i.elementsPerGaussian,
        data: i.values.slice().buffer
      })
    );
    this.emit({
      type: "buffers-replaced",
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      contentVersion: this.contentVersion,
      count: t.count,
      capacity: t.capacity,
      objectCapacity: this.nextObjectId,
      shDegree: t.degree,
      shFormat: "rgb8e8",
      attributes: e,
      clouds: t.clouds
    });
  }
  scheduleUpdate() {
    this.updateScheduled || (this.updateScheduled = !0, setTimeout(() => {
      if (this.updateScheduled = !1, !(this.disposed || !this.target || !this.packed))
        try {
          this.emitNextPatch();
        } catch (t) {
          this.drain?.reject(
            t instanceof Error ? t : new Error(String(t))
          ), this.drain = null, this.target = null;
        }
    }, 0));
  }
  emitNextPatch() {
    const t = this.packed, e = this.target, s = this.config.streamingLod?.maxUploadBytesPerUpdate ?? 1024 * 1024, i = Math.max(
      1,
      this.config.streamingLod?.maxChangedCellsPerUpdate ?? 16
    ), r = [...t.attributes.values()].reduce(
      (h, p) => h + p.elementsPerGaussian * 4,
      0
    ), a = Math.max(1, Math.floor(s / r)), o = [], c = /* @__PURE__ */ new Set();
    for (let h = 0; h < t.capacity && o.length < a; h++)
      if ([...t.attributes].some(([p, g]) => {
        const w = e.attributes.get(p).values, f = h * g.elementsPerGaussian;
        for (let x = 0; x < g.elementsPerGaussian; x++)
          if (g.values[f + x] !== w[f + x]) return !0;
        return !1;
      })) {
        const p = e.cells[h];
        if (!c.has(p) && c.size >= i) break;
        c.add(p), o.push(h);
      }
    const l = [];
    if (o.length === 0) {
      if (JSON.stringify(t.clouds) !== JSON.stringify(e.clouds)) {
        const h = this.contentVersion++;
        this.emit({
          type: "buffers-patched",
          sceneRevision: this.sceneRevision,
          layoutVersion: this.layoutVersion,
          baseContentVersion: h,
          contentVersion: this.contentVersion,
          patches: [],
          changedClouds: e.clouds,
          lodPending: !1
        });
      }
      this.packed = {
        ...t,
        count: e.count,
        clouds: e.clouds,
        cells: e.cells
      }, this.target = null, this.drain?.resolve(), this.drain = null;
      return;
    }
    for (const [h, p] of t.attributes) {
      const g = p.elementsPerGaussian, w = e.attributes.get(h).values;
      let f = -1, x = -1;
      const C = () => {
        if (f < 0) return;
        const S = f * g, _ = (x + 1) * g;
        p.values.set(w.subarray(S, _), S), l.push({
          name: h,
          firstSlot: f,
          slotCount: x - f + 1,
          data: w.slice(S, _).buffer
        }), f = -1;
      };
      for (const S of o) {
        const _ = S * g;
        let v = !1;
        for (let k = 0; k < g; k++)
          if (p.values[_ + k] !== w[_ + k]) {
            v = !0;
            break;
          }
        if (!v) {
          C();
          continue;
        }
        f < 0 ? f = S : S !== x + 1 && (C(), f = S), x = S;
      }
      C();
    }
    const u = [...t.attributes].some(([h, p]) => {
      const g = e.attributes.get(h).values;
      return p.values.some((w, f) => w !== g[f]);
    }), d = this.contentVersion++;
    this.emit({
      type: "buffers-patched",
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      baseContentVersion: d,
      contentVersion: this.contentVersion,
      patches: l,
      changedClouds: u ? t.clouds : e.clouds,
      lodPending: u
    }), u ? this.scheduleUpdate() : (this.packed = {
      ...t,
      count: e.count,
      clouds: e.clouds,
      cells: e.cells
    }, this.target = null, this.drain?.resolve(), this.drain = null);
  }
}
function ys(n) {
  if (!Number.isSafeInteger(n))
    throw new RangeError("Priority must be a safe integer");
  return n;
}
function ur(n, t) {
  const e = n.elementsPerGaussian;
  if (!Number.isSafeInteger(e) || e < 1)
    throw new RangeError("Attribute elementsPerGaussian must be positive");
  const s = t * e, i = n.format === "f32" ? new Float32Array(s) : new Uint32Array(s);
  if (n.source.kind === "fill")
    i.fill(n.source.value === "ones" ? 1 : 0);
  else {
    if (n.source.data.byteLength !== s * 4)
      throw new RangeError("Attribute buffer has the wrong byte length");
    i.set(
      n.format === "f32" ? new Float32Array(n.source.data) : new Uint32Array(n.source.data)
    );
  }
  return { format: n.format, elementsPerGaussian: e, values: i };
}
const Rs = '(function(){"use strict";const It={};function Tt(f){const t=f[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=f[1];e&&e.isStackTrace?f[0]+=" "+e.getLocation():f[1]=\'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.\'}return f}function yt(...f){f=Tt(f);const t="THREE."+f.shift();{const e=f[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...f)}}function mt(...f){const t=f.join(" ");t in It||(It[t]=!0,yt(...f))}function I(f,t,e){return Math.max(t,Math.min(e,f))}const Mt=class Mt{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,s=this.y,i=t.elements;return this.x=i[0]*e+i[3]*s+i[6],this.y=i[1]*e+i[4]*s+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=I(this.x,t.x,e.x),this.y=I(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=I(this.x,t,e),this.y=I(this.y,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(I(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(I(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y;return e*e+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const s=Math.cos(e),i=Math.sin(e),n=this.x-t.x,r=this.y-t.y;return this.x=n*s-r*i+t.x,this.y=n*i+r*s+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Mt.prototype.isVector2=!0;let kt=Mt;class Ft{constructor(t=0,e=0,s=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=s,this._w=i}static slerpFlat(t,e,s,i,n,r,o){let h=s[i+0],a=s[i+1],c=s[i+2],l=s[i+3],u=n[r+0],d=n[r+1],y=n[r+2],x=n[r+3];if(l!==x||h!==u||a!==d||c!==y){let m=h*u+a*d+c*y+l*x;m<0&&(u=-u,d=-d,y=-y,x=-x,m=-m);let p=1-o;if(m<.9995){const M=Math.acos(m),_=Math.sin(M);p=Math.sin(p*M)/_,o=Math.sin(o*M)/_,h=h*p+u*o,a=a*p+d*o,c=c*p+y*o,l=l*p+x*o}else{h=h*p+u*o,a=a*p+d*o,c=c*p+y*o,l=l*p+x*o;const M=1/Math.sqrt(h*h+a*a+c*c+l*l);h*=M,a*=M,c*=M,l*=M}}t[e]=h,t[e+1]=a,t[e+2]=c,t[e+3]=l}static multiplyQuaternionsFlat(t,e,s,i,n,r){const o=s[i],h=s[i+1],a=s[i+2],c=s[i+3],l=n[r],u=n[r+1],d=n[r+2],y=n[r+3];return t[e]=o*y+c*l+h*d-a*u,t[e+1]=h*y+c*u+a*l-o*d,t[e+2]=a*y+c*d+o*u-h*l,t[e+3]=c*y-o*l-h*u-a*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,s,i){return this._x=t,this._y=e,this._z=s,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const s=t._x,i=t._y,n=t._z,r=t._order,o=Math.cos,h=Math.sin,a=o(s/2),c=o(i/2),l=o(n/2),u=h(s/2),d=h(i/2),y=h(n/2);switch(r){case"XYZ":this._x=u*c*l+a*d*y,this._y=a*d*l-u*c*y,this._z=a*c*y+u*d*l,this._w=a*c*l-u*d*y;break;case"YXZ":this._x=u*c*l+a*d*y,this._y=a*d*l-u*c*y,this._z=a*c*y-u*d*l,this._w=a*c*l+u*d*y;break;case"ZXY":this._x=u*c*l-a*d*y,this._y=a*d*l+u*c*y,this._z=a*c*y+u*d*l,this._w=a*c*l-u*d*y;break;case"ZYX":this._x=u*c*l-a*d*y,this._y=a*d*l+u*c*y,this._z=a*c*y-u*d*l,this._w=a*c*l+u*d*y;break;case"YZX":this._x=u*c*l+a*d*y,this._y=a*d*l+u*c*y,this._z=a*c*y-u*d*l,this._w=a*c*l-u*d*y;break;case"XZY":this._x=u*c*l-a*d*y,this._y=a*d*l-u*c*y,this._z=a*c*y+u*d*l,this._w=a*c*l+u*d*y;break;default:yt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const s=e/2,i=Math.sin(s);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,s=e[0],i=e[4],n=e[8],r=e[1],o=e[5],h=e[9],a=e[2],c=e[6],l=e[10],u=s+o+l;if(u>0){const d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(c-h)*d,this._y=(n-a)*d,this._z=(r-i)*d}else if(s>o&&s>l){const d=2*Math.sqrt(1+s-o-l);this._w=(c-h)/d,this._x=.25*d,this._y=(i+r)/d,this._z=(n+a)/d}else if(o>l){const d=2*Math.sqrt(1+o-s-l);this._w=(n-a)/d,this._x=(i+r)/d,this._y=.25*d,this._z=(h+c)/d}else{const d=2*Math.sqrt(1+l-s-o);this._w=(r-i)/d,this._x=(n+a)/d,this._y=(h+c)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let s=t.dot(e)+1;return s<1e-8?(s=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=s):(this._x=0,this._y=-t.z,this._z=t.y,this._w=s)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=s),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(I(this.dot(t),-1,1)))}rotateTowards(t,e){const s=this.angleTo(t);if(s===0)return this;const i=Math.min(1,e/s);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const s=t._x,i=t._y,n=t._z,r=t._w,o=e._x,h=e._y,a=e._z,c=e._w;return this._x=s*c+r*o+i*a-n*h,this._y=i*c+r*h+n*o-s*a,this._z=n*c+r*a+s*h-i*o,this._w=r*c-s*o-i*h-n*a,this._onChangeCallback(),this}slerp(t,e){let s=t._x,i=t._y,n=t._z,r=t._w,o=this.dot(t);o<0&&(s=-s,i=-i,n=-n,r=-r,o=-o);let h=1-e;if(o<.9995){const a=Math.acos(o),c=Math.sin(a);h=Math.sin(h*a)/c,e=Math.sin(e*a)/c,this._x=this._x*h+s*e,this._y=this._y*h+i*e,this._z=this._z*h+n*e,this._w=this._w*h+r*e,this._onChangeCallback()}else this._x=this._x*h+s*e,this._y=this._y*h+i*e,this._z=this._z*h+n*e,this._w=this._w*h+r*e,this.normalize();return this}slerpQuaternions(t,e,s){return this.copy(t).slerp(e,s)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),s=Math.random(),i=Math.sqrt(1-s),n=Math.sqrt(s);return this.set(i*Math.sin(t),i*Math.cos(t),n*Math.sin(e),n*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const _t=class _t{constructor(t=0,e=0,s=0){this.x=t,this.y=e,this.z=s}set(t,e,s){return s===void 0&&(s=this.z),this.x=t,this.y=e,this.z=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Lt.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Lt.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,s=this.y,i=this.z,n=t.elements;return this.x=n[0]*e+n[3]*s+n[6]*i,this.y=n[1]*e+n[4]*s+n[7]*i,this.z=n[2]*e+n[5]*s+n[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,s=this.y,i=this.z,n=t.elements,r=1/(n[3]*e+n[7]*s+n[11]*i+n[15]);return this.x=(n[0]*e+n[4]*s+n[8]*i+n[12])*r,this.y=(n[1]*e+n[5]*s+n[9]*i+n[13])*r,this.z=(n[2]*e+n[6]*s+n[10]*i+n[14])*r,this}applyQuaternion(t){const e=this.x,s=this.y,i=this.z,n=t.x,r=t.y,o=t.z,h=t.w,a=2*(r*i-o*s),c=2*(o*e-n*i),l=2*(n*s-r*e);return this.x=e+h*a+r*l-o*c,this.y=s+h*c+o*a-n*l,this.z=i+h*l+n*c-r*a,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,s=this.y,i=this.z,n=t.elements;return this.x=n[0]*e+n[4]*s+n[8]*i,this.y=n[1]*e+n[5]*s+n[9]*i,this.z=n[2]*e+n[6]*s+n[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=I(this.x,t.x,e.x),this.y=I(this.y,t.y,e.y),this.z=I(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=I(this.x,t,e),this.y=I(this.y,t,e),this.z=I(this.z,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(I(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const s=t.x,i=t.y,n=t.z,r=e.x,o=e.y,h=e.z;return this.x=i*h-n*o,this.y=n*r-s*h,this.z=s*o-i*r,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const s=t.dot(this)/e;return this.copy(t).multiplyScalar(s)}projectOnPlane(t){return xt.copy(this).projectOnVector(t),this.sub(xt)}reflect(t){return this.sub(xt.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(I(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y,i=this.z-t.z;return e*e+s*s+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,s){const i=Math.sin(e)*t;return this.x=i*Math.sin(s),this.y=Math.cos(e)*t,this.z=i*Math.cos(s),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,s){return this.x=t*Math.sin(e),this.y=s,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),s=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=s,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,s=Math.sqrt(1-e*e);return this.x=s*Math.cos(t),this.y=e,this.z=s*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};_t.prototype.isVector3=!0;let b=_t;const xt=new b,Lt=new Ft,St=class St{constructor(t,e,s,i,n,r,o,h,a){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,s,i,n,r,o,h,a)}set(t,e,s,i,n,r,o,h,a){const c=this.elements;return c[0]=t,c[1]=i,c[2]=o,c[3]=e,c[4]=n,c[5]=h,c[6]=s,c[7]=r,c[8]=a,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],this}extractBasis(t,e,s){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,i=e.elements,n=this.elements,r=s[0],o=s[3],h=s[6],a=s[1],c=s[4],l=s[7],u=s[2],d=s[5],y=s[8],x=i[0],m=i[3],p=i[6],M=i[1],_=i[4],w=i[7],g=i[2],z=i[5],S=i[8];return n[0]=r*x+o*M+h*g,n[3]=r*m+o*_+h*z,n[6]=r*p+o*w+h*S,n[1]=a*x+c*M+l*g,n[4]=a*m+c*_+l*z,n[7]=a*p+c*w+l*S,n[2]=u*x+d*M+y*g,n[5]=u*m+d*_+y*z,n[8]=u*p+d*w+y*S,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[1],i=t[2],n=t[3],r=t[4],o=t[5],h=t[6],a=t[7],c=t[8];return e*r*c-e*o*a-s*n*c+s*o*h+i*n*a-i*r*h}invert(){const t=this.elements,e=t[0],s=t[1],i=t[2],n=t[3],r=t[4],o=t[5],h=t[6],a=t[7],c=t[8],l=c*r-o*a,u=o*h-c*n,d=a*n-r*h,y=e*l+s*u+i*d;if(y===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/y;return t[0]=l*x,t[1]=(i*a-c*s)*x,t[2]=(o*s-i*r)*x,t[3]=u*x,t[4]=(c*e-i*h)*x,t[5]=(i*n-o*e)*x,t[6]=d*x,t[7]=(s*h-a*e)*x,t[8]=(r*e-s*n)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,s,i,n,r,o){const h=Math.cos(n),a=Math.sin(n);return this.set(s*h,s*a,-s*(h*r+a*o)+r+t,-i*a,i*h,-i*(-a*r+h*o)+o+e,0,0,1),this}scale(t,e){return mt("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ft.makeScale(t,e)),this}rotate(t){return mt("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ft.makeRotation(-t)),this}translate(t,e){return mt("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ft.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,s,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,s=t.elements;for(let i=0;i<9;i++)if(e[i]!==s[i])return!1;return!0}fromArray(t,e=0){for(let s=0;s<9;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t}clone(){return new this.constructor().fromArray(this.elements)}};St.prototype.isMatrix3=!0;let H=St;const ft=new H,Ct=class Ct{constructor(t=0,e=0,s=0,i=1){this.x=t,this.y=e,this.z=s,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,s,i){return this.x=t,this.y=e,this.z=s,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,s=this.y,i=this.z,n=this.w,r=t.elements;return this.x=r[0]*e+r[4]*s+r[8]*i+r[12]*n,this.y=r[1]*e+r[5]*s+r[9]*i+r[13]*n,this.z=r[2]*e+r[6]*s+r[10]*i+r[14]*n,this.w=r[3]*e+r[7]*s+r[11]*i+r[15]*n,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,s,i,n;const h=t.elements,a=h[0],c=h[4],l=h[8],u=h[1],d=h[5],y=h[9],x=h[2],m=h[6],p=h[10];if(Math.abs(c-u)<.01&&Math.abs(l-x)<.01&&Math.abs(y-m)<.01){if(Math.abs(c+u)<.1&&Math.abs(l+x)<.1&&Math.abs(y+m)<.1&&Math.abs(a+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const _=(a+1)/2,w=(d+1)/2,g=(p+1)/2,z=(c+u)/4,S=(l+x)/4,C=(y+m)/4;return _>w&&_>g?_<.01?(s=0,i=.707106781,n=.707106781):(s=Math.sqrt(_),i=z/s,n=S/s):w>g?w<.01?(s=.707106781,i=0,n=.707106781):(i=Math.sqrt(w),s=z/i,n=C/i):g<.01?(s=.707106781,i=.707106781,n=0):(n=Math.sqrt(g),s=S/n,i=C/n),this.set(s,i,n,e),this}let M=Math.sqrt((m-y)*(m-y)+(l-x)*(l-x)+(u-c)*(u-c));return Math.abs(M)<.001&&(M=1),this.x=(m-y)/M,this.y=(l-x)/M,this.z=(u-c)/M,this.w=Math.acos((a+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=I(this.x,t.x,e.x),this.y=I(this.y,t.y,e.y),this.z=I(this.z,t.z,e.z),this.w=I(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=I(this.x,t,e),this.y=I(this.y,t,e),this.z=I(this.z,t,e),this.w=I(this.w,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(I(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this.w=t.w+(e.w-t.w)*s,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ct.prototype.isVector4=!0;let At=Ct;const at=class at{constructor(t,e,s,i,n,r,o,h,a,c,l,u,d,y,x,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,s,i,n,r,o,h,a,c,l,u,d,y,x,m)}set(t,e,s,i,n,r,o,h,a,c,l,u,d,y,x,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=s,p[12]=i,p[1]=n,p[5]=r,p[9]=o,p[13]=h,p[2]=a,p[6]=c,p[10]=l,p[14]=u,p[3]=d,p[7]=y,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new at().fromArray(this.elements)}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],e[9]=s[9],e[10]=s[10],e[11]=s[11],e[12]=s[12],e[13]=s[13],e[14]=s[14],e[15]=s[15],this}copyPosition(t){const e=this.elements,s=t.elements;return e[12]=s[12],e[13]=s[13],e[14]=s[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,s){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),s.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(t,e,s){return this.set(t.x,e.x,s.x,0,t.y,e.y,s.y,0,t.z,e.z,s.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,s=t.elements,i=1/Y.setFromMatrixColumn(t,0).length(),n=1/Y.setFromMatrixColumn(t,1).length(),r=1/Y.setFromMatrixColumn(t,2).length();return e[0]=s[0]*i,e[1]=s[1]*i,e[2]=s[2]*i,e[3]=0,e[4]=s[4]*n,e[5]=s[5]*n,e[6]=s[6]*n,e[7]=0,e[8]=s[8]*r,e[9]=s[9]*r,e[10]=s[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,s=t.x,i=t.y,n=t.z,r=Math.cos(s),o=Math.sin(s),h=Math.cos(i),a=Math.sin(i),c=Math.cos(n),l=Math.sin(n);if(t.order==="XYZ"){const u=r*c,d=r*l,y=o*c,x=o*l;e[0]=h*c,e[4]=-h*l,e[8]=a,e[1]=d+y*a,e[5]=u-x*a,e[9]=-o*h,e[2]=x-u*a,e[6]=y+d*a,e[10]=r*h}else if(t.order==="YXZ"){const u=h*c,d=h*l,y=a*c,x=a*l;e[0]=u+x*o,e[4]=y*o-d,e[8]=r*a,e[1]=r*l,e[5]=r*c,e[9]=-o,e[2]=d*o-y,e[6]=x+u*o,e[10]=r*h}else if(t.order==="ZXY"){const u=h*c,d=h*l,y=a*c,x=a*l;e[0]=u-x*o,e[4]=-r*l,e[8]=y+d*o,e[1]=d+y*o,e[5]=r*c,e[9]=x-u*o,e[2]=-r*a,e[6]=o,e[10]=r*h}else if(t.order==="ZYX"){const u=r*c,d=r*l,y=o*c,x=o*l;e[0]=h*c,e[4]=y*a-d,e[8]=u*a+x,e[1]=h*l,e[5]=x*a+u,e[9]=d*a-y,e[2]=-a,e[6]=o*h,e[10]=r*h}else if(t.order==="YZX"){const u=r*h,d=r*a,y=o*h,x=o*a;e[0]=h*c,e[4]=x-u*l,e[8]=y*l+d,e[1]=l,e[5]=r*c,e[9]=-o*c,e[2]=-a*c,e[6]=d*l+y,e[10]=u-x*l}else if(t.order==="XZY"){const u=r*h,d=r*a,y=o*h,x=o*a;e[0]=h*c,e[4]=-l,e[8]=a*c,e[1]=u*l+x,e[5]=r*c,e[9]=d*l-y,e[2]=y*l-d,e[6]=o*c,e[10]=x*l+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Ut,t,Ot)}lookAt(t,e,s){const i=this.elements;return B.subVectors(t,e),B.lengthSq()===0&&(B.z=1),B.normalize(),O.crossVectors(s,B),O.lengthSq()===0&&(Math.abs(s.z)===1?B.x+=1e-4:B.z+=1e-4,B.normalize(),O.crossVectors(s,B)),O.normalize(),J.crossVectors(B,O),i[0]=O.x,i[4]=J.x,i[8]=B.x,i[1]=O.y,i[5]=J.y,i[9]=B.y,i[2]=O.z,i[6]=J.z,i[10]=B.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,i=e.elements,n=this.elements,r=s[0],o=s[4],h=s[8],a=s[12],c=s[1],l=s[5],u=s[9],d=s[13],y=s[2],x=s[6],m=s[10],p=s[14],M=s[3],_=s[7],w=s[11],g=s[15],z=i[0],S=i[4],C=i[8],k=i[12],P=i[1],v=i[5],E=i[9],A=i[13],R=i[2],L=i[6],q=i[10],ht=i[14],ct=i[3],lt=i[7],ut=i[11],dt=i[15];return n[0]=r*z+o*P+h*R+a*ct,n[4]=r*S+o*v+h*L+a*lt,n[8]=r*C+o*E+h*q+a*ut,n[12]=r*k+o*A+h*ht+a*dt,n[1]=c*z+l*P+u*R+d*ct,n[5]=c*S+l*v+u*L+d*lt,n[9]=c*C+l*E+u*q+d*ut,n[13]=c*k+l*A+u*ht+d*dt,n[2]=y*z+x*P+m*R+p*ct,n[6]=y*S+x*v+m*L+p*lt,n[10]=y*C+x*E+m*q+p*ut,n[14]=y*k+x*A+m*ht+p*dt,n[3]=M*z+_*P+w*R+g*ct,n[7]=M*S+_*v+w*L+g*lt,n[11]=M*C+_*E+w*q+g*ut,n[15]=M*k+_*A+w*ht+g*dt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[4],i=t[8],n=t[12],r=t[1],o=t[5],h=t[9],a=t[13],c=t[2],l=t[6],u=t[10],d=t[14],y=t[3],x=t[7],m=t[11],p=t[15],M=h*d-a*u,_=o*d-a*l,w=o*u-h*l,g=r*d-a*c,z=r*u-h*c,S=r*l-o*c;return e*(x*M-m*_+p*w)-s*(y*M-m*g+p*z)+i*(y*_-x*g+p*S)-n*(y*w-x*z+m*S)}determinantAffine(){const t=this.elements,e=t[0],s=t[4],i=t[8],n=t[1],r=t[5],o=t[9],h=t[2],a=t[6],c=t[10];return e*(r*c-o*a)-s*(n*c-o*h)+i*(n*a-r*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,s){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=s),this}invert(){const t=this.elements,e=t[0],s=t[1],i=t[2],n=t[3],r=t[4],o=t[5],h=t[6],a=t[7],c=t[8],l=t[9],u=t[10],d=t[11],y=t[12],x=t[13],m=t[14],p=t[15],M=e*o-s*r,_=e*h-i*r,w=e*a-n*r,g=s*h-i*o,z=s*a-n*o,S=i*a-n*h,C=c*x-l*y,k=c*m-u*y,P=c*p-d*y,v=l*m-u*x,E=l*p-d*x,A=u*p-d*m,R=M*A-_*E+w*v+g*P-z*k+S*C;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const L=1/R;return t[0]=(o*A-h*E+a*v)*L,t[1]=(i*E-s*A-n*v)*L,t[2]=(x*S-m*z+p*g)*L,t[3]=(u*z-l*S-d*g)*L,t[4]=(h*P-r*A-a*k)*L,t[5]=(e*A-i*P+n*k)*L,t[6]=(m*w-y*S-p*_)*L,t[7]=(c*S-u*w+d*_)*L,t[8]=(r*E-o*P+a*C)*L,t[9]=(s*P-e*E-n*C)*L,t[10]=(y*z-x*w+p*M)*L,t[11]=(l*w-c*z-d*M)*L,t[12]=(o*k-r*v-h*C)*L,t[13]=(e*v-s*k+i*C)*L,t[14]=(x*_-y*g-m*M)*L,t[15]=(c*g-l*_+u*M)*L,this}scale(t){const e=this.elements,s=t.x,i=t.y,n=t.z;return e[0]*=s,e[4]*=i,e[8]*=n,e[1]*=s,e[5]*=i,e[9]*=n,e[2]*=s,e[6]*=i,e[10]*=n,e[3]*=s,e[7]*=i,e[11]*=n,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],s=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,s,i))}makeTranslation(t,e,s){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,s,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),s=Math.sin(t);return this.set(1,0,0,0,0,e,-s,0,0,s,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,0,s,0,0,1,0,0,-s,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,0,s,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const s=Math.cos(e),i=Math.sin(e),n=1-s,r=t.x,o=t.y,h=t.z,a=n*r,c=n*o;return this.set(a*r+s,a*o-i*h,a*h+i*o,0,a*o+i*h,c*o+s,c*h-i*r,0,a*h-i*o,c*h+i*r,n*h*h+s,0,0,0,0,1),this}makeScale(t,e,s){return this.set(t,0,0,0,0,e,0,0,0,0,s,0,0,0,0,1),this}makeShear(t,e,s,i,n,r){return this.set(1,s,n,0,t,1,r,0,e,i,1,0,0,0,0,1),this}compose(t,e,s){const i=this.elements,n=e._x,r=e._y,o=e._z,h=e._w,a=n+n,c=r+r,l=o+o,u=n*a,d=n*c,y=n*l,x=r*c,m=r*l,p=o*l,M=h*a,_=h*c,w=h*l,g=s.x,z=s.y,S=s.z;return i[0]=(1-(x+p))*g,i[1]=(d+w)*g,i[2]=(y-_)*g,i[3]=0,i[4]=(d-w)*z,i[5]=(1-(u+p))*z,i[6]=(m+M)*z,i[7]=0,i[8]=(y+_)*S,i[9]=(m-M)*S,i[10]=(1-(u+x))*S,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,s){const i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];const n=this.determinantAffine();if(n===0)return s.set(1,1,1),e.identity(),this;let r=Y.set(i[0],i[1],i[2]).length();const o=Y.set(i[4],i[5],i[6]).length(),h=Y.set(i[8],i[9],i[10]).length();n<0&&(r=-r),T.copy(this);const a=1/r,c=1/o,l=1/h;return T.elements[0]*=a,T.elements[1]*=a,T.elements[2]*=a,T.elements[4]*=c,T.elements[5]*=c,T.elements[6]*=c,T.elements[8]*=l,T.elements[9]*=l,T.elements[10]*=l,e.setFromRotationMatrix(T),s.x=r,s.y=o,s.z=h,this}makePerspective(t,e,s,i,n,r,o=2e3,h=!1){const a=this.elements,c=2*n/(e-t),l=2*n/(s-i),u=(e+t)/(e-t),d=(s+i)/(s-i);let y,x;if(h)y=n/(r-n),x=r*n/(r-n);else if(o===2e3)y=-(r+n)/(r-n),x=-2*r*n/(r-n);else if(o===2001)y=-r/(r-n),x=-r*n/(r-n);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return a[0]=c,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=l,a[9]=d,a[13]=0,a[2]=0,a[6]=0,a[10]=y,a[14]=x,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(t,e,s,i,n,r,o=2e3,h=!1){const a=this.elements,c=2/(e-t),l=2/(s-i),u=-(e+t)/(e-t),d=-(s+i)/(s-i);let y,x;if(h)y=1/(r-n),x=r/(r-n);else if(o===2e3)y=-2/(r-n),x=-(r+n)/(r-n);else if(o===2001)y=-1/(r-n),x=-n/(r-n);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return a[0]=c,a[4]=0,a[8]=0,a[12]=u,a[1]=0,a[5]=l,a[9]=0,a[13]=d,a[2]=0,a[6]=0,a[10]=y,a[14]=x,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(t){const e=this.elements,s=t.elements;for(let i=0;i<16;i++)if(e[i]!==s[i])return!1;return!0}fromArray(t,e=0){for(let s=0;s<16;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t[e+9]=s[9],t[e+10]=s[10],t[e+11]=s[11],t[e+12]=s[12],t[e+13]=s[13],t[e+14]=s[14],t[e+15]=s[15],t}};at.prototype.isMatrix4=!0;let Q=at;const Y=new b,T=new Q,Ut=new b(0,0,0),Ot=new b(1,1,1),O=new b,J=new b,B=new b;class K{constructor(t=new b(1/0,1/0,1/0),e=new b(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e+=3)this.expandByPoint(F.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,s=t.count;e<s;e++)this.expandByPoint(F.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const s=F.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(s),this.max.copy(t).add(s),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const s=t.geometry;if(s!==void 0){const n=s.getAttribute("position");if(e===!0&&n!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=n.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,F):F.fromBufferAttribute(n,r),F.applyMatrix4(t.matrixWorld),this.expandByPoint(F);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),tt.copy(t.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),tt.copy(s.boundingBox)),tt.applyMatrix4(t.matrixWorld),this.union(tt)}const i=t.children;for(let n=0,r=i.length;n<r;n++)this.expandByObject(i[n],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,F),F.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,s;return t.normal.x>0?(e=t.normal.x*this.min.x,s=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,s=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,s+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,s+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,s+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,s+=t.normal.z*this.min.z),e<=-t.constant&&s>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(W),et.subVectors(this.max,W),j.subVectors(t.a,W),Z.subVectors(t.b,W),X.subVectors(t.c,W),V.subVectors(Z,j),N.subVectors(X,Z),D.subVectors(j,X);let e=[0,-V.z,V.y,0,-N.z,N.y,0,-D.z,D.y,V.z,0,-V.x,N.z,0,-N.x,D.z,0,-D.x,-V.y,V.x,0,-N.y,N.x,0,-D.y,D.x,0];return!pt(e,j,Z,X,et)||(e=[1,0,0,0,1,0,0,0,1],!pt(e,j,Z,X,et))?!1:(st.crossVectors(V,N),e=[st.x,st.y,st.z],pt(e,j,Z,X,et))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,F).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(F).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(U[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),U[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),U[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),U[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),U[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),U[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),U[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),U[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(U),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const U=[new b,new b,new b,new b,new b,new b,new b,new b],F=new b,tt=new K,j=new b,Z=new b,X=new b,V=new b,N=new b,D=new b,W=new b,et=new b,st=new b,$=new b;function pt(f,t,e,s,i){for(let n=0,r=f.length-3;n<=r;n+=3){$.fromArray(f,n);const o=i.x*Math.abs($.x)+i.y*Math.abs($.y)+i.z*Math.abs($.z),h=t.dot($),a=e.dot($),c=s.dot($);if(Math.max(-Math.max(h,a,c),Math.min(h,a,c))>o)return!1}return!0}const Et=class Et{constructor(t,e,s,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,s,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let s=0;s<4;s++)this.elements[s]=t[s+e];return this}set(t,e,s,i){const n=this.elements;return n[0]=t,n[2]=e,n[1]=s,n[3]=i,this}};Et.prototype.isMatrix2=!0;let Pt=Et;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}})),typeof window<"u"&&(window.__THREE__?yt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");new H().set(-1,0,0,0,1,0,0,0,1),new H().set(-1,0,0,0,1,0,0,0,1);function Vt(f,t,e){const s=Math.max(Math.abs(f),Math.abs(t),Math.abs(e));if(!Number.isFinite(s))throw new RangeError("SH coefficients must be finite");if(s===0)return 0;const i=Math.min(127,Math.max(-126,Math.ceil(Math.log2(s)))),n=127/2**i,r=wt(f,n),o=wt(t,n),h=wt(e,n),a=i+127;return(r|o<<8|h<<16|a<<24)>>>0}function wt(f,t){return Math.min(127,Math.max(-127,Math.round(f*t)))&255}function it(f){if(!Number.isInteger(f)||f<0)throw new RangeError("Gaussian LOD budget must be a non-negative integer")}function gt(f,t,e){return f.updateWorldMatrix(!0,!1),t.updateWorldMatrix(!0,!1),f.getWorldPosition(e),t.worldToLocal(e)}function zt(f,t){const e=t instanceof b?t.clone():f.octree.bounds.getCenter(new b),s=f.octree.rootBounds.getSize(new b),i=Math.max(s.length()*.5,Number.EPSILON),n=new b,r=Array.from(f.octree.leafNodeIds,o=>(f.octree.nodes[o].bounds.getCenter(n),{nodeId:o,radius:n.distanceTo(e)/i}));return r.sort((o,h)=>o.radius-h.radius||o.nodeId-h.nodeId),r}class Nt{cameraCenter=new b;center;levelDistance;constructor(t={}){if(this.center=t.center instanceof b?t.center.clone():t.center??"bounds-center",this.levelDistance=t.levelDistance??2,!(this.levelDistance>0)||!Number.isFinite(this.levelDistance))throw new RangeError("Radial LOD levelDistance must be finite and positive")}setCenter(t){return this.center=t instanceof b?t.clone():t,this}setFromCamera(t,e){return this.setCenter(gt(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(it(e),e===0)return Gt();const s=zt(t,this.center),i=s.map(({radius:o})=>Math.max(0,t.finestLevel-Math.floor(o/this.levelDistance)));let n=s.reduce((o,h,a)=>o+t.nodes[h.nodeId].levelCounts[i[a]],0);for(let o=s.length-1;o>=0&&n>e;o--){const h=t.nodes[s[o].nodeId];for(;i[o]>0&&n>e;){const a=h.levelCounts[i[o]];i[o]=i[o]-1,n-=a-h.levelCounts[i[o]]}}let r=s.length;for(;r>0&&n>e;){r--;const o=t.nodes[s[r].nodeId];n-=o.levelCounts[i[r]]}return{nodeIds:Uint32Array.from(s.slice(0,r).map(({nodeId:o})=>o)),lodLevels:Uint8Array.from(i.slice(0,r)),gaussianCount:n}}}function Gt(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}class qt{setFromCamera(t,e){return this}pack({lod:t,maxGaussians:e}){it(e);const s=t.octree.data.count;if(e<s)throw new RangeError(`Maximum LOD requires ${s} Gaussians but the budget allows ${e}`);const i=t.octree.leafNodeIds.slice(),n=new Uint8Array(i.length);return n.fill(t.finestLevel),{nodeIds:i,lodLevels:n,gaussianCount:s}}}class Dt{cameraCenter=new b;center;lodLevel;constructor(t={}){if(this.center=t.center instanceof b?t.center.clone():t.center??"bounds-center",t.lodLevel!==void 0&&t.lodLevel!=="finest"&&(!Number.isInteger(t.lodLevel)||t.lodLevel<0))throw new RangeError(\'Radial LOD level must be a non-negative integer or "finest"\');this.lodLevel=t.lodLevel??"finest"}setCenter(t){return this.center=t instanceof b?t.clone():t,this}setFromCamera(t,e){return this.setCenter(gt(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(it(e),e===0)return $t();const s=this.lodLevel==="finest"?t.finestLevel:this.lodLevel;if(s>=t.levelCount)throw new RangeError(`Gaussian LOD level ${s} does not exist`);const i=zt(t,this.center),n=[];let r=0;for(const h of i){const a=t.nodes[h.nodeId].levelCounts[s];if(r+a>e)break;n.push(h.nodeId),r+=a}const o=new Uint8Array(n.length);return o.fill(s),{nodeIds:Uint32Array.from(n),lodLevels:o,gaussianCount:r}}}function $t(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}class Yt{cameraCenter=new b;center;budgetShares;constructor(t={}){this.center=t.center instanceof b?t.center.clone():t.center??"bounds-center",this.budgetShares=jt(t.budgetShares??[.8,.1,.1])}setCenter(t){return this.center=t instanceof b?t.clone():t,this}setFromCamera(t,e){return this.setCenter(gt(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(it(e),e===0)return Zt();const s=t.octree.data.count;if(s<=e){const l=t.octree.leafNodeIds.slice(),u=new Uint8Array(l.length);return u.fill(t.finestLevel),{nodeIds:l,lodLevels:u,gaussianCount:s}}const i=zt(t,this.center),n=[t.finestLevel,Math.max(0,t.finestLevel-1),0],r=[],o=[];let h=0,a=0,c=0;for(let l=0;l<n.length;l++){const u=this.budgetShares[l];if(c+=u,u===0)continue;const d=l===n.length-1?e:Math.floor(e*c),y=n[l];for(;a<i.length;){const x=i[a],m=t.nodes[x.nodeId].levelCounts[y];if(h+m>d)break;r.push(x.nodeId),o.push(y),h+=m,a++}}return{nodeIds:Uint32Array.from(r),lodLevels:Uint8Array.from(o),gaussianCount:h}}}function jt(f){let t=0;for(const e of f){if(!(e>=0&&e<=1))throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");t+=e}if(Math.abs(t-1)>1e-6)throw new RangeError("Tiered radial LOD budget shares must sum to 1");return Object.freeze([...f])}function Zt(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}class Xt{constructor(t,e,s,i,n,r){this.count=t,this.shDegree=e,this.shCoefficientCount=(e+1)**2,this.means={array:s},this.scalesOpacity={array:i},this.rotations={array:n},this.shCoefficients={array:r}}count;shDegree;shCoefficientCount;shFormat="float32";means;scalesOpacity;rotations;shCoefficients;dispose(){}}const vt={char:1,uchar:1,short:2,ushort:2,int:4,uint:4,float:4,double:8,int8:1,uint8:1,int16:2,uint16:2,int32:4,uint32:4,float32:4,float64:8},Ht=["x","y","z","scale_0","scale_1","scale_2","rot_0","rot_1","rot_2","rot_3","opacity","f_dc_0","f_dc_1","f_dc_2"];class Wt{async load(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load PLY: ${e.status} ${e.statusText}`);if(e.headers.get("content-type")?.includes("text/html"))throw new Error(`Failed to load PLY: ${e.url||t} returned HTML instead of a PLY file`);return this.parse(await e.arrayBuffer())}parse(t){const e=Qt(t),s=new Map(e.properties.map((m,p)=>[m.name,p]));for(const m of Ht)if(!s.has(m))throw new Error(`Not a canonical 3DGS PLY: missing property ${m}`);const i=e.properties.map(m=>m.name.match(/^f_rest_(\\d+)$/)?.[1]).filter(m=>m!==void 0).map(Number).sort((m,p)=>m-p);for(let m=0;m<i.length;m++)if(i[m]!==m)throw new Error("f_rest_* properties must be contiguous from f_rest_0");if(i.length%3!==0)throw new Error("f_rest_* property count must be divisible by three");const n=i.length/3,r=n+1,o=Math.sqrt(r);if(!Number.isInteger(o)||o<1||o>4)throw new Error("PLY must contain one, four, nine, or sixteen SH coefficients per channel");const h=Jt(t,e),a=m=>s.get(m),c=i.map(m=>a(`f_rest_${m}`)),l=e.vertexCount,u=new Float32Array(l*4),d=new Float32Array(l*4),y=new Float32Array(l*4),x=new Float32Array(l*r*4);for(let m=0;m<l;m++){const p=m*4;u[p]=h(m,a("x")),u[p+1]=h(m,a("y")),u[p+2]=h(m,a("z")),d[p]=Math.max(Math.exp(h(m,a("scale_0"))),1e-6),d[p+1]=Math.max(Math.exp(h(m,a("scale_1"))),1e-6),d[p+2]=Math.max(Math.exp(h(m,a("scale_2"))),1e-6);const M=h(m,a("opacity"));d[p+3]=1/(1+Math.exp(-M));const _=h(m,a("rot_0")),w=h(m,a("rot_1")),g=h(m,a("rot_2")),z=h(m,a("rot_3")),S=Math.hypot(w,g,z,_);S>1e-12?(y[p]=w/S,y[p+1]=g/S,y[p+2]=z/S,y[p+3]=_/S):y[p+3]=1;const C=m*r*4;x[C]=h(m,a("f_dc_0")),x[C+1]=h(m,a("f_dc_1")),x[C+2]=h(m,a("f_dc_2"));for(let k=1;k<r;k++){const P=C+k*4,v=k-1;for(let E=0;E<3;E++){const A=c[E*n+v];x[P+E]=h(m,A)}}}return new Xt(l,o-1,u,d,y,x)}}function Qt(f){const t=new Uint8Array(f),e=new TextEncoder().encode("end_header");let s=-1;for(let y=0;y<=t.length-e.length;y++){let x=!0;for(let m=0;m<e.length;m++)if(t[y+m]!==e[m]){x=!1;break}if(x){s=y;break}}if(s<0)throw new Error("Invalid PLY: end_header is missing");let i=s+e.length;if(t[i]===13&&i++,t[i]!==10)throw new Error("Invalid PLY: end_header must terminate a line");i++;const r=new TextDecoder().decode(t.subarray(0,i)).split(/\\r?\\n/);if(r[0]?.trim()!=="ply")throw new Error("Invalid PLY signature");let o=null,h="",a=-1,c=0;const l=[],u=[];for(const y of r){const x=y.trim().split(/\\s+/);if(x[0]==="format"){if(x[1]!=="ascii"&&x[1]!=="binary_little_endian"&&x[1]!=="binary_big_endian")throw new Error(`Unsupported PLY format: ${x[1]??"unknown"}`);o=x[1]}else if(x[0]==="element"){h=x[1]??"";const m=Number(x[2]);if(!Number.isInteger(m)||m<0)throw new Error(`Invalid element count for ${h}`);u.push({name:h,count:m}),h==="vertex"&&(a=m)}else if(x[0]==="property"&&h==="vertex"){if(x[1]==="list")throw new Error("List properties are not supported in the vertex element");const m=x[1],p=x[2];if(!(m in vt)||p===void 0)throw new Error(`Unsupported vertex property: ${y}`);l.push({name:p,type:m,byteOffset:c}),c+=vt[m]}}if(o===null)throw new Error("Invalid PLY: format is missing");if(a<=0)throw new Error("PLY must contain at least one vertex");if(u.find(y=>y.count>0)?.name!=="vertex")throw new Error("The canonical 3DGS vertex element must be first");return{format:o,vertexCount:a,properties:l,vertexStride:c,dataOffset:i}}function Jt(f,t){if(t.format==="ascii"){const n=new TextDecoder().decode(new Uint8Array(f,t.dataOffset)),r=new Float64Array(t.vertexCount*t.properties.length);let o=0;for(let h=0;h<r.length;h++){for(;o<n.length&&/\\s/.test(n[o]);)o++;const a=o;for(;o<n.length&&!/\\s/.test(n[o]);)o++;const c=Number(n.slice(a,o));if(!Number.isFinite(c))throw new Error(`Invalid ASCII PLY value at scalar ${h}`);r[h]=c}return(h,a)=>r[h*t.properties.length+a]}if(t.dataOffset+t.vertexCount*t.vertexStride>f.byteLength)throw new Error("Binary PLY ends before the vertex data is complete");const s=new DataView(f),i=t.format==="binary_little_endian";return(n,r)=>{const o=t.properties[r],h=t.dataOffset+n*t.vertexStride+o.byteOffset;return Kt(s,h,o.type,i)}}function Kt(f,t,e,s){switch(e){case"char":case"int8":return f.getInt8(t);case"uchar":case"uint8":return f.getUint8(t);case"short":case"int16":return f.getInt16(t,s);case"ushort":case"uint16":return f.getUint16(t,s);case"int":case"int32":return f.getInt32(t,s);case"uint":case"uint32":return f.getUint32(t,s);case"float":case"float32":return f.getFloat32(t,s);case"double":case"float64":return f.getFloat64(t,s)}}function bt(f){const t=f.nodes,e=new Float32Array(t.length*7),s=new Uint32Array(t.length*2),i=new Uint32Array(t.length*2),n=[],r=[];for(const h of t){const a=h.id*7,{min:c,max:l}=h.raycastBounds;if(e.set([c.x,c.y,c.z,l.x,l.y,l.z,h.maxSplatRadius],a),s.set([n.length,h.children.length],h.id*2),n.push(...h.children),i.set([r.length,h.gaussianIndices?.length??0],h.id*2),h.gaussianIndices!==null)for(const u of h.gaussianIndices)r.push(u)}const o=f.data;return{means:Float32Array.from(o.means.array).buffer,scalesOpacity:Float32Array.from(o.scalesOpacity.array).buffer,rotations:Float32Array.from(o.rotations.array).buffer,nodeBounds:e.buffer,nodeChildren:s.buffer,children:Uint32Array.from(n).buffer,nodeIndices:i.buffer,indices:Uint32Array.from(r).buffer}}class Rt{constructor(t,e,s){this.octreeNodeId=t,this.sortedGaussianIndices=e,this.levelCounts=s}octreeNodeId;sortedGaussianIndices;levelCounts}const te=[{retention:.2},{retention:.5},{retention:1}];class nt{constructor(t,e){this.octree=t,this.levels=ee(e.levels??te),this.ownsOctree=e.ownsOctree??!1;const s=e.importance??se,i=new Float64Array(t.data.count);for(let n=0;n<i.length;n++){const r=s(n,t);i[n]=Number.isFinite(r)?r:-1/0}this.nodes=t.nodes.map(n=>{if(n.gaussianIndices===null)return new Rt(n.id,new Uint32Array,new Uint32Array(this.levels.length));const r=Uint32Array.from(Array.from(n.gaussianIndices).sort((o,h)=>i[h]-i[o]||o-h));return new Rt(n.id,r,Uint32Array.from(this.levels.map(({retention:o})=>Math.min(r.length,Math.max(1,Math.ceil(r.length*o))))))})}octree;static build(t,e={}){return new nt(t,e)}levels;nodes;ownsOctree;disposed=!1;get levelCount(){return this.levels.length}get finestLevel(){return this.levels.length-1}getNode(t){this.assertUsable();const e=this.nodes[t];if(e===void 0)throw new RangeError(`GaussianLod node ${t} does not exist`);return e}indicesForPacking(t){if(this.assertUsable(),t.nodeIds.length!==t.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const e=new Uint32Array(t.gaussianCount),s=new Set;let i=0;for(let n=0;n<t.nodeIds.length;n++){const r=t.nodeIds[n],o=this.getLeafNode(r);if(s.has(r))throw new Error(`GaussianLodPacking contains duplicate leaf node ${r}`);s.add(r);const h=t.lodLevels[n],a=o.levelCounts[h];if(a===void 0)throw new RangeError(`GaussianLod level ${h} does not exist`);if(i+a>e.length)throw new RangeError("GaussianLodPacking gaussianCount is too small");for(let c=0;c<a;c++)e[i++]=o.sortedGaussianIndices[c]}if(i!==e.length)throw new RangeError(`GaussianLodPacking declares ${e.length} Gaussians but selects ${i}`);return e}raycast(t,e,s={}){this.assertUsable();const i=s.radiusScale??3;if(!(i>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const n=s.maxHits??1/0;if(!(n>0))return[];if(e.nodeIds.length!==e.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const r=this.octree.data.means.array,o=this.octree.data.scalesOpacity.array,h=new b,a=new b,c=[],l=new Set;for(let u=0;u<e.nodeIds.length;u++){const d=e.nodeIds[u],y=this.getLeafNode(d);if(l.has(d))throw new Error(`GaussianLodPacking contains duplicate leaf node ${d}`);l.add(d);const x=e.lodLevels[u],m=y.levelCounts[x];if(m===void 0)throw new RangeError(`GaussianLod level ${x} does not exist`);const p=this.octree.nodes[d],M=Math.max(0,i-3)*p.maxSplatRadius,_=M===0?p.raycastBounds:p.raycastBounds.clone().expandByScalar(M);if(t.intersectsBox(_))for(let w=0;w<m;w++){const g=y.sortedGaussianIndices[w],z=g*4;h.set(r[z],r[z+1],r[z+2]);const S=Math.max(o[z],o[z+1],o[z+2])*i;t.closestPointToPoint(h,a),!(a.distanceToSquared(h)>S*S)&&c.push({gaussianIndex:g,distance:t.origin.distanceTo(a),point:a.clone()})}}return c.sort((u,d)=>u.distance-d.distance),c.length>n&&(c.length=n),c}dispose(){this.disposed||(this.disposed=!0,this.ownsOctree&&this.octree.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianLod has been disposed")}getLeafNode(t){const e=this.getNode(t);if(this.octree.nodes[t]?.isLeaf!==!0)throw new Error(`GaussianLodPacking must reference leaf nodes; node ${t} is internal`);return e}}function ee(f){if(f.length===0||f.length>256)throw new RangeError("GaussianLod requires between 1 and 256 levels");let t=0;const e=f.map(({retention:s})=>{if(!(s>t&&s<=1))throw new RangeError("GaussianLod retention values must increase and stay in (0, 1]");return t=s,Object.freeze({retention:s})});if(Math.abs(t-1)>Number.EPSILON)throw new RangeError("GaussianLod finest retention must be 1");return Object.freeze(e)}function se(f,t){const e=t.data.scalesOpacity.array,s=f*4,i=[e[s],e[s+1],e[s+2]];return i.sort((n,r)=>r-n),e[s+3]*i[0]*i[1]}class ie{constructor(t,e,s,i,n,r,o,h){this.id=t,this.depth=e,this.bounds=s,this.count=i,this.maxSplatRadius=n,this.raycastBounds=h,this.children=r,this.gaussianIndices=o}id;depth;bounds;count;maxSplatRadius;raycastBounds;children;gaussianIndices;get isLeaf(){return this.children.length===0}}class rt{constructor(t,e,s,i){this.data=t,this.leafCapacity=e,this.maxDepth=s,this.ownsData=i,this.bounds=ne(t),this.rootBounds=re(this.bounds);const n=t.means.array,r=t.scalesOpacity.array,o=[],h=[],a=Array.from({length:t.count},(l,u)=>u),c=(l,u,d)=>{const y=o.length;o.push(null);const x=l.length>e&&d<s&&u.max.x-u.min.x>Number.EPSILON,m=[];if(x){const _=u.getCenter(new b),w=Array.from({length:8},()=>[]);for(const g of l){const z=g*4,S=(n[z]>=_.x?1:0)|(n[z+1]>=_.y?2:0)|(n[z+2]>=_.z?4:0);w[S].push(g)}for(let g=0;g<8;g++){const z=w[g];z.length!==0&&m.push(c(z,oe(u,_,g),d+1))}}let p=0;if(m.length>0)for(const _ of m)p=Math.max(p,o[_].maxSplatRadius);else{for(const _ of l){const w=_*4;p=Math.max(p,r[w],r[w+1],r[w+2])}h.push(y)}const M=u.clone().expandByScalar(p*3);return o[y]=new ie(y,d,u,l.length,p,m,m.length===0?Uint32Array.from(l):null,M),y};c(a,this.rootBounds.clone(),0),this.nodes=o,this.leafNodeIds=Uint32Array.from(h)}data;leafCapacity;maxDepth;static build(t,e={}){const s=e.leafCapacity??256,i=e.maxDepth??10;if(!Number.isInteger(s)||s<=0)throw new RangeError("GaussianOctree leafCapacity must be positive");if(!Number.isInteger(i)||i<0)throw new RangeError("GaussianOctree maxDepth must be non-negative");return new rt(t,s,i,e.ownsData??!1)}bounds;rootBounds;rootNode=0;nodes;leafNodeIds;ownsData;disposed=!1;raycast(t,e={}){this.assertUsable();const s=e.radiusScale??3;if(!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const i=e.maxHits??1/0;if(!(i>0))return[];const n=[],r=[this.rootNode];for(;r.length>0;){const o=this.nodes[r.pop()],h=Math.max(0,s-3)*o.maxSplatRadius,a=h===0?o.raycastBounds:o.raycastBounds.clone().expandByScalar(h);if(t.intersectsBox(a))if(o.gaussianIndices!==null)for(const c of o.gaussianIndices)n.push(c);else for(const c of o.children)r.push(c)}return this.raycastIndices(t,n,s,i)}raycastIndices(t,e,s=3,i=1/0){if(this.assertUsable(),!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");if(!(i>0))return[];const n=this.data.means.array,r=this.data.scalesOpacity.array,o=new b,h=new b,a=[];for(let c=0;c<e.length;c++){const l=e[c],u=l*4;o.set(n[u],n[u+1],n[u+2]);const d=Math.max(r[u],r[u+1],r[u+2])*s;t.closestPointToPoint(o,h),!(h.distanceToSquared(o)>d*d)&&a.push({gaussianIndex:l,distance:t.origin.distanceTo(h),point:h.clone()})}return a.sort((c,l)=>c.distance-l.distance),a.length>i&&(a.length=i),a}dispose(){this.disposed||(this.disposed=!0,this.ownsData&&this.data.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianOctree has been disposed")}}function ne(f){const t=f.means.array,e=new K,s=new b;for(let i=0;i<f.count;i++){const n=i*4;s.set(t[n],t[n+1],t[n+2]),e.expandByPoint(s)}return e}function re(f){const t=f.getCenter(new b),e=f.getSize(new b),s=Math.max(e.x,e.y,e.z,1e-6)*.5;return new K(new b(t.x-s,t.y-s,t.z-s),new b(t.x+s,t.y+s,t.z+s))}function oe(f,t,e){return new K(new b(e&1?t.x:f.min.x,e&2?t.y:f.min.y,e&4?t.z:f.min.z),new b(e&1?f.max.x:t.x,e&2?f.max.y:t.y,e&4?f.max.z:t.z))}const ae=new Set(["means","scalesOpacity","rotations","shCoefficients","lodLevel"]),he=new Q;class ce{listeners=new Set;failureListeners=new Set;clouds=new Map;usedCloudIds=new Set;usedCommandIds=new Set;activeLoads=new Map;parser=new Wt;config;frontend=null;nextObjectId=0;layoutVersion=0;contentVersion=0;sceneRevision=0;cameraPosition=new b;packed=null;target=null;updateScheduled=!1;active=null;startedAt=0;drain=null;disposed=!1;constructor(t){this.config=t}subscribe(t){if(this.disposed)throw new Error("Backend disposed");return this.listeners.add(t),()=>this.listeners.delete(t)}onFailure(t){return this.failureListeners.add(t),()=>this.failureListeners.delete(t)}dispatch(t){if(this.disposed)throw new Error("Backend disposed");if(this.usedCommandIds.has(t.id))throw new Error(`Duplicate backend command id: ${t.id}`);if(this.usedCommandIds.add(t.id),this.active)throw new Error("Backend accepts only one command at a time");if(!this.frontend&&t.type!=="set-frontend-capabilities")throw new Error("Frontend handshake is required before commands");this.active=t,this.startedAt=performance.now(),this.run(t)}abort(t){this.activeLoads.get(t)?.abort()}async run(t){try{await this.handle(t),this.target&&await new Promise((e,s)=>{this.drain={resolve:e,reject:s}}),this.respond(t,{isFinal:!0})}catch(e){this.respond(t,{isFinal:!0,error:{code:e instanceof DOMException&&e.name==="AbortError"?"cancelled":e instanceof RangeError?"invalid-range":"backend-error",message:e instanceof Error?e.message:String(e),cloudId:"cloudId"in t?t.cloudId:void 0}})}finally{this.active=null}}dispose(){if(!this.disposed){this.disposed=!0;for(const t of this.activeLoads.values())t.abort();this.activeLoads.clear(),this.drain?.reject(new Error("Backend disposed")),this.drain=null,this.listeners.clear(),this.failureListeners.clear(),this.clouds.clear(),this.packed=null,this.target=null}}respond(t,e){if(this.disposed)return;const s={command:{id:t.id,type:t.type},durationMs:t===this.active||t.id===this.active?.id?performance.now()-this.startedAt:0,...e};for(const i of this.listeners)i(s)}emit(t){if(!this.active)throw new Error("Unsolicited backend output");this.respond(this.active,{isFinal:!1,payload:t})}async handle(t){switch(t.type){case"load-cloud":case"load-cloud-from-buffer":{if(this.usedCloudIds.has(t.cloudId))throw new Error(`Cloud id already used: ${t.cloudId}`);const e=new AbortController;this.activeLoads.set(t.id,e);try{let s;if(t.type==="load-cloud"){const l=await fetch(t.url,{signal:e.signal});if(!l.ok)throw new Error(`PLY fetch failed: ${l.status}`);if(l.headers.get("content-type")?.includes("text/html"))throw new Error("PLY URL returned HTML instead of a PLY file");const u=await l.arrayBuffer();if(e.signal.aborted)throw new DOMException("Load cancelled","AbortError");s=this.parser.parse(u)}else s=this.parser.parse(t.buffer);const i=t.options??{},n=rt.build(s,i.octree),r=nt.build(n,i.lod),o={id:t.cloudId,objectId:this.nextObjectId++,source:s,octree:n,lod:r,octreeOptions:i.octree,lodOptions:i.lod,attributes:new Map,transform:he.clone(),priority:Bt(i.priority??0),packingStrategy:i.packingStrategy??this.config.defaultPackingStrategy??{type:"tiered-radial"},raycastable:i.raycastable??!0,sourceVersion:1};for(const l of i.attributes??[]){if(ae.has(l.name)||o.attributes.has(l.name))throw new Error(`Reserved or duplicate attribute name: ${l.name}`);o.attributes.set(l.name,le(l,s.count))}for(const l of this.clouds.values())for(const[u,d]of o.attributes){const y=l.attributes.get(u);if(y&&(y.format!==d.format||y.elementsPerGaussian!==d.elementsPerGaussian))throw new Error(`Attribute schema differs across clouds: ${u}`)}this.usedCloudIds.add(o.id),this.clouds.set(o.id,o);let h=null;if(this.frontend)try{h=this.compute()}catch(l){throw this.clouds.delete(o.id),this.usedCloudIds.delete(o.id),l}const{min:a,max:c}=n.bounds;this.emit({type:"cloud-loaded",cloudId:o.id,objectId:o.objectId,sourceCount:s.count,shDegree:s.shDegree,bounds:[a.x,a.y,a.z,c.x,c.y,c.z],raycast:o.raycastable?bt(n):void 0}),h&&(this.target=null,this.replace(h));return}finally{this.activeLoads.delete(t.id)}}case"unload-cloud":this.clouds.delete(t.cloudId),this.emit({type:"cloud-unloaded",cloudId:t.cloudId}),this.repack();return;case"set-cloud-priority":{const e=this.getCloud(t.cloudId),s=e.priority;e.priority=Bt(t.priority);try{this.repack()}catch(i){throw e.priority=s,i}}break;case"set-cloud-packing":{const e=this.getCloud(t.cloudId),s=e.packingStrategy;e.packingStrategy=t.packingStrategy;try{this.repack()}catch(i){throw e.packingStrategy=s,i}}break;case"set-cloud-transform":{const e=this.getCloud(t.cloudId);if(t.worldMatrix.length!==16)throw new RangeError("Cloud transform needs sixteen numbers");if(t.sceneRevision<this.sceneRevision)break;this.sceneRevision=t.sceneRevision,e.transform.fromArray(t.worldMatrix),this.updateTarget();return}case"set-cloud-raycastable":{const e=this.getCloud(t.cloudId);e.raycastable=t.raycastable,this.emit({type:"cloud-raycast-changed",cloudId:e.id,raycastable:e.raycastable,raycast:e.raycastable?bt(e.octree):void 0});return}case"write-attribute-range":this.writeRange(t),this.updateTarget();break;case"set-frontend-capabilities":{if(t.protocolVersion!==1)throw new Error(`Unsupported frontend protocol: ${t.protocolVersion}`);const{capabilities:e}=t;for(const i of[e.maxStorageBufferBindingSize,e.maxBufferSize,e.maxStorageBuffersPerShaderStage])if(!Number.isSafeInteger(i)||i<=0)throw new RangeError("Frontend buffer limits must be positive integers");if(typeof e.supportsPartialBufferUpdates!="boolean")throw new TypeError("Frontend partial update support must be boolean");const s=this.frontend;this.frontend={...e};try{this.clouds.size>0&&this.repack()}catch(i){throw this.frontend=s,i}this.emit({type:"capabilities-accepted",protocolVersion:1});break}case"set-camera":if(t.worldMatrix.length!==16||t.projectionMatrix.length!==16)throw new RangeError("Camera matrices need sixteen numbers each");if(t.sceneRevision<this.sceneRevision)break;this.sceneRevision=t.sceneRevision,this.cameraPosition.set(t.worldMatrix[12],t.worldMatrix[13],t.worldMatrix[14]),this.updateTarget();break}}getCloud(t){const e=this.clouds.get(t);if(!e)throw new Error(`Unknown cloud: ${t}`);return e}writeRange(t){const e=this.getCloud(t.cloudId),{firstGaussian:s,gaussianCount:i,attribute:n}=t;if(!Number.isSafeInteger(s)||!Number.isSafeInteger(i)||s<0||i<0||s+i>e.source.count)throw new RangeError("Attribute range exceeds source cloud");if(n==="lodLevel")throw new Error("lodLevel is computed by the backend");let r,o;switch(n){case"means":r=e.source.means.array,o=4;break;case"scalesOpacity":r=e.source.scalesOpacity.array,o=4;break;case"rotations":r=e.source.rotations.array,o=4;break;case"shCoefficients":r=e.source.shCoefficients.array,o=e.source.shCoefficientCount*4;break;default:{const a=e.attributes.get(n);if(!a)throw new Error(`Unknown source attribute: ${n}`);r=a.values,o=a.elementsPerGaussian}}if(t.data.byteLength!==i*o*4)throw new RangeError("Attribute update has the wrong byte length");const h=r instanceof Uint32Array?new Uint32Array(t.data):new Float32Array(t.data);if(r.set(h,s*o),(n==="means"||n==="scalesOpacity"||n==="rotations")&&(e.octree=rt.build(e.source,e.octreeOptions),e.lod=nt.build(e.octree,e.lodOptions),e.sourceVersion++,e.raycastable)){const{min:a,max:c}=e.octree.bounds;this.emit({type:"raycast-replaced",cloudId:e.id,sourceVersion:e.sourceVersion,bounds:[a.x,a.y,a.z,c.x,c.y,c.z],raycast:bt(e.octree)})}}maxSlots(t,e){const s=this.frontend;if(!s)throw new Error("Frontend capabilities have not been supplied");const i=Math.min(s.maxStorageBufferBindingSize,s.maxBufferSize),n=[16,16,16,(t+1)**2*4,4,...[...e.values()].map(o=>o.elementsPerGaussian*4)],r=Math.min(...n.map(o=>Math.floor(i/o)));if(r<1)throw new RangeError("Frontend buffer limits are too small");return Math.min(r,this.config.maxGaussians==="auto"||this.config.maxGaussians===void 0?r:this.config.maxGaussians)}compute(t=0){const e=[...this.clouds.values()].sort((w,g)=>w.priority-g.priority||w.objectId-g.objectId),s=e.reduce((w,g)=>Math.max(w,g.source.shDegree),0),i=new Map;for(const w of e)for(const[g,z]of w.attributes)i.set(g,z);let n=this.maxSlots(s,i);const r=[];for(const w of e){const g=this.select(w,Math.min(n,w.source.count)),z=w.lod.indicesForPacking(g),S=new Uint32Array(z.length),C=[];let k=0;for(let P=0;P<g.nodeIds.length;P++){const v=w.lod.nodes[g.nodeIds[P]],E=g.lodLevels[P],A=v.levelCounts[E];S.fill(E,k,k+A),k+=A,C.push(k)}r.push({entry:w,indices:z,levels:S,cellEnds:C}),n-=z.length}const o=r.reduce((w,g)=>w+g.indices.length,0),h=Math.max(1,o,t),a=new Map,c=(w,g,z)=>{const S=g==="f32"?new Float32Array(h*z):new Uint32Array(h*z);return a.set(w,{format:g,elementsPerGaussian:z,values:S}),S},l=c("means","f32",4),u=c("scalesOpacity","f32",4),d=c("rotations","f32",4),y=c("shCoefficients","u32",(s+1)**2),x=c("lodLevel","u32",1),m=new Uint32Array(h);for(const[w,g]of i)c(w,g.format,g.elementsPerGaussian);const p=[];let M=0,_=1;for(const{entry:w,indices:g,levels:z,cellEnds:S}of r){const C=w.source,k=C.shCoefficients.array;let P=0;for(let v=0;v<g.length;v++,M++){for(;v>=S[P];)P++;m[M]=_+P;const E=g[v];l.set(C.means.array.subarray(E*4,E*4+4),M*4),l[M*4+3]=w.objectId,u.set(C.scalesOpacity.array.subarray(E*4,E*4+4),M*4),d.set(C.rotations.array.subarray(E*4,E*4+4),M*4),x[M]=z[v];for(let A=0;A<C.shCoefficientCount;A++){const R=(E*C.shCoefficientCount+A)*4;y[M*(s+1)**2+A]=Vt(k[R],k[R+1],k[R+2])}for(const[A,R]of w.attributes){const L=a.get(A).values,q=R.elementsPerGaussian;L.set(R.values.subarray(E*q,(E+1)*q),M*q)}}_+=S.length,p.push({cloudId:w.id,objectId:w.objectId,renderedCount:g.length})}return{capacity:h,count:o,degree:s,attributes:a,cells:m,clouds:p}}select(t,e){const s=this.cameraPosition.clone().applyMatrix4(t.transform.clone().invert()),i=t.packingStrategy;switch(i.type){case"maximum":return new qt().pack({lod:t.lod,maxGaussians:e});case"radial":return new Dt({center:s,lodLevel:i.lodLevel}).pack({lod:t.lod,maxGaussians:e});case"tiered-radial":return new Yt({center:s,budgetShares:i.budgetShares}).pack({lod:t.lod,maxGaussians:e});case"distance-aware-radial":return new Nt({center:s,levelDistance:i.levelDistance}).pack({lod:t.lod,maxGaussians:e})}}repack(){if(!this.frontend)return;this.target=null;const t=this.compute();this.replace(t)}updateTarget(){if(!this.frontend||!this.packed)return;const t=this.compute(this.packed.capacity);if(!this.frontend.supportsPartialBufferUpdates){this.replace(t);return}if(t.capacity!==this.packed.capacity||t.degree!==this.packed.degree||[...t.attributes].some(([e,s])=>this.packed?.attributes.get(e)?.elementsPerGaussian!==s.elementsPerGaussian)){this.replace(t);return}this.target=t,this.scheduleUpdate()}replace(t){this.packed=t,this.layoutVersion++,this.contentVersion++;const e=[...t.attributes].map(([s,i])=>({name:s,format:i.format,elementsPerGaussian:i.elementsPerGaussian,data:i.values.slice().buffer}));this.emit({type:"buffers-replaced",sceneRevision:this.sceneRevision,layoutVersion:this.layoutVersion,contentVersion:this.contentVersion,count:t.count,capacity:t.capacity,objectCapacity:this.nextObjectId,shDegree:t.degree,shFormat:"rgb8e8",attributes:e,clouds:t.clouds})}scheduleUpdate(){this.updateScheduled||(this.updateScheduled=!0,setTimeout(()=>{if(this.updateScheduled=!1,!(this.disposed||!this.target||!this.packed))try{this.emitNextPatch()}catch(t){this.drain?.reject(t instanceof Error?t:new Error(String(t))),this.drain=null,this.target=null}},0))}emitNextPatch(){const t=this.packed,e=this.target,s=this.config.streamingLod?.maxUploadBytesPerUpdate??1024*1024,i=Math.max(1,this.config.streamingLod?.maxChangedCellsPerUpdate??16),n=[...t.attributes.values()].reduce((u,d)=>u+d.elementsPerGaussian*4,0),r=Math.max(1,Math.floor(s/n)),o=[],h=new Set;for(let u=0;u<t.capacity&&o.length<r;u++)if([...t.attributes].some(([d,y])=>{const x=e.attributes.get(d).values,m=u*y.elementsPerGaussian;for(let p=0;p<y.elementsPerGaussian;p++)if(y.values[m+p]!==x[m+p])return!0;return!1})){const d=e.cells[u];if(!h.has(d)&&h.size>=i)break;h.add(d),o.push(u)}const a=[];if(o.length===0){if(JSON.stringify(t.clouds)!==JSON.stringify(e.clouds)){const u=this.contentVersion++;this.emit({type:"buffers-patched",sceneRevision:this.sceneRevision,layoutVersion:this.layoutVersion,baseContentVersion:u,contentVersion:this.contentVersion,patches:[],changedClouds:e.clouds,lodPending:!1})}this.packed={...t,count:e.count,clouds:e.clouds,cells:e.cells},this.target=null,this.drain?.resolve(),this.drain=null;return}for(const[u,d]of t.attributes){const y=d.elementsPerGaussian,x=e.attributes.get(u).values;let m=-1,p=-1;const M=()=>{if(m<0)return;const _=m*y,w=(p+1)*y;d.values.set(x.subarray(_,w),_),a.push({name:u,firstSlot:m,slotCount:p-m+1,data:x.slice(_,w).buffer}),m=-1};for(const _ of o){const w=_*y;let g=!1;for(let z=0;z<y;z++)if(d.values[w+z]!==x[w+z]){g=!0;break}if(!g){M();continue}m<0?m=_:_!==p+1&&(M(),m=_),p=_}M()}const c=[...t.attributes].some(([u,d])=>{const y=e.attributes.get(u).values;return d.values.some((x,m)=>x!==y[m])}),l=this.contentVersion++;this.emit({type:"buffers-patched",sceneRevision:this.sceneRevision,layoutVersion:this.layoutVersion,baseContentVersion:l,contentVersion:this.contentVersion,patches:a,changedClouds:c?t.clouds:e.clouds,lodPending:c}),c?this.scheduleUpdate():(this.packed={...t,count:e.count,clouds:e.clouds,cells:e.cells},this.target=null,this.drain?.resolve(),this.drain=null)}}function Bt(f){if(!Number.isSafeInteger(f))throw new RangeError("Priority must be a safe integer");return f}function le(f,t){const e=f.elementsPerGaussian;if(!Number.isSafeInteger(e)||e<1)throw new RangeError("Attribute elementsPerGaussian must be positive");const s=t*e,i=f.format==="f32"?new Float32Array(s):new Uint32Array(s);if(f.source.kind==="fill")i.fill(f.source.value==="ones"?1:0);else{if(f.source.data.byteLength!==s*4)throw new RangeError("Attribute buffer has the wrong byte length");i.set(f.format==="f32"?new Float32Array(f.source.data):new Uint32Array(f.source.data))}return{format:f.format,elementsPerGaussian:e,values:i}}function ue(f){const t=new Set,e=new Set,s=i=>{if(i instanceof ArrayBuffer){t.add(i);return}if(!(i===null||typeof i!="object"||e.has(i)))if(e.add(i),Array.isArray(i))for(const n of i)s(n);else for(const n of Object.values(i))s(n)};return s(f),[...t]}const ot=globalThis;let G=null;ot.onmessage=({data:f})=>{try{if(f.type==="initialize"){if(G)throw new Error("Streaming backend already initialized");G=new ce(f.config),G.subscribe(t=>{ot.postMessage({type:"response",response:t},ue(t))})}else if(f.type==="dispatch"){if(!G)throw new Error("Streaming backend not initialized");G.dispatch(f.command)}else f.type==="abort"?G?.abort(f.commandId):(G?.dispose(),G=null)}catch(t){ot.postMessage({type:"failure",failure:{code:"worker-dispatch-error",message:t instanceof Error?t.message:String(t)}})}},globalThis.addEventListener("unhandledrejection",f=>{ot.postMessage({type:"failure",failure:{code:"worker-unhandled-rejection",message:f.reason instanceof Error?f.reason.message:String(f.reason)}})})})();\n', xs = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Rs], { type: "text/javascript;charset=utf-8" });
function hr(n) {
  let t;
  try {
    if (t = xs && (self.URL || self.webkitURL).createObjectURL(xs), !t) throw "";
    const e = new Worker(t, {
      name: n?.name
    });
    return e.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), e;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Rs),
      {
        name: n?.name
      }
    );
  }
}
function dr(n) {
  const t = /* @__PURE__ */ new Set(), e = /* @__PURE__ */ new Set(), s = (i) => {
    if (i instanceof ArrayBuffer) {
      t.add(i);
      return;
    }
    if (!(i === null || typeof i != "object" || e.has(i)))
      if (e.add(i), Array.isArray(i))
        for (const r of i) s(r);
      else
        for (const r of Object.values(i)) s(r);
  };
  return s(n), [...t];
}
class pr {
  listeners = /* @__PURE__ */ new Set();
  failureListeners = /* @__PURE__ */ new Set();
  port;
  disposed = !1;
  constructor(t, e) {
    this.port = e ?? new hr({ name: "3dgs-streaming-backend" }), this.port.addEventListener("message", this.onMessage), this.port.addEventListener("error", this.onError), this.port.addEventListener(
      "messageerror",
      this.onMessageError
    ), this.port.postMessage({
      type: "initialize",
      config: t
    });
  }
  subscribe(t) {
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  onFailure(t) {
    return this.failureListeners.add(t), () => this.failureListeners.delete(t);
  }
  dispatch(t) {
    if (this.disposed) throw new Error("Worker streaming backend disposed");
    this.port.postMessage(
      { type: "dispatch", command: t },
      dr(t)
    );
  }
  abort(t) {
    this.disposed || this.port.postMessage({ type: "abort", commandId: t });
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.port.removeEventListener("message", this.onMessage), this.port.removeEventListener("error", this.onError), this.port.removeEventListener(
      "messageerror",
      this.onMessageError
    ), this.port.postMessage({ type: "dispose" }), this.port.terminate(), this.listeners.clear(), this.failureListeners.clear());
  }
  onMessage = (t) => {
    if (!this.disposed)
      if (t.data.type === "response")
        for (const e of this.listeners) e(t.data.response);
      else t.data.type === "failure" && this.fail(t.data.failure);
  };
  fail(t) {
    for (const e of this.failureListeners) e(t);
  }
  onError = (t) => {
    this.fail({
      code: "worker-error",
      message: t.message || "Worker failed"
    });
  };
  onMessageError = () => {
    this.fail({
      code: "worker-message-error",
      message: "Could not deserialize a message from the Gaussian backend worker"
    });
  };
}
class fr extends Ps {
  isGaussianCloud = !0;
  objectId;
  /** Accumulated alpha required for a pointer hit. Must be in (0, 1). */
  raycastAlphaThreshold = 0.5;
  ownerStore;
  packedGaussianCount;
  priority;
  raycastIndex = null;
  constructor(t, e, s, i = "GaussianCloud", r = 0) {
    super(), this.ownerStore = t, this.objectId = e, this.packedGaussianCount = s, this.priority = r, this.name = i;
  }
  get gaussianCount() {
    return this.packedGaussianCount;
  }
  /** Lower priorities receive Store budget first. Defaults to 0. */
  get packingPriority() {
    return this.priority;
  }
  set packingPriority(t) {
    this.ownerStore.updatePackingPriority(this, t);
  }
  /** Ask the backend to re-evaluate this cloud after strategy parameters change. */
  invalidatePacking() {
    this.ownerStore.invalidateCloudPacking(this);
  }
  /** Internal Store hook used after a global budget redistribution. */
  updatePacking(t) {
    this.packedGaussianCount = t;
  }
  /** Internal Store hook used while priorities are changed transactionally. */
  updatePackingPriority(t) {
    this.priority = t;
  }
  /** Attach a transferable snapshot built by the data backend. Raycasts remain synchronous. */
  setRaycastIndex(t) {
    this.raycastIndex = t;
  }
  getRaycastIndex() {
    return this.raycastIndex;
  }
  /** Synchronous raycast against the complete source octree snapshot. */
  raycast(t, e) {
    if (this.raycastIndex === null) return;
    const s = new Ot().copy(this.matrixWorld).invert(), i = new ei().copy(t.ray).applyMatrix4(s), r = this.raycastIndex.raycast(i, this.raycastAlphaThreshold);
    if (r !== null) {
      const a = r.point.clone().applyMatrix4(this.matrixWorld), o = t.ray.origin.distanceTo(a);
      o >= t.near && o <= t.far && e.push({
        distance: o,
        point: a,
        object: this,
        index: r.gaussianIndex
      });
    }
  }
  /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
  dispose() {
    this.ownerStore.remove(this);
  }
}
class Aa extends si {
  constructor(t, e = {}) {
    const s = e.minDepth ?? 0, i = e.maxDepth ?? 1 / 0, a = ("nodes" in t ? t.nodes : t).filter(
      (h) => h.depth >= s && h.depth <= i && (e.leavesOnly !== !0 || h.isLeaf)
    ), o = new Float32Array(a.length * 12 * 2 * 3);
    let c = 0;
    for (const h of a) {
      const { min: p, max: g } = h.bounds, w = [
        [p.x, p.y, p.z],
        [g.x, p.y, p.z],
        [g.x, g.y, p.z],
        [p.x, g.y, p.z],
        [p.x, p.y, g.z],
        [g.x, p.y, g.z],
        [g.x, g.y, g.z],
        [p.x, g.y, g.z]
      ];
      for (const [f, x] of mr)
        o.set(w[f], c), o.set(w[x], c + 3), c += 6;
    }
    const l = new ii();
    l.setAttribute("position", new ri(o, 3)), l.computeBoundingSphere();
    const u = e.opacity ?? 0.55, d = new ai({
      color: e.color ?? 7710719,
      opacity: u,
      transparent: u < 1,
      depthTest: e.depthTest ?? !1,
      depthWrite: !1,
      toneMapped: !1
    });
    super(l, d), this.octree = t, this.cellCount = a.length, this.name = "Gaussian octree helper", this.frustumCulled = !1, this.renderOrder = 1e3;
  }
  octree;
  isOctreeHelper = !0;
  cellCount;
  dispose() {
    this.removeFromParent(), this.geometry.dispose(), this.material.dispose();
  }
}
const mr = [
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
], gr = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class Ra extends Ps {
  constructor(t, e, s = {}) {
    super(), this.lod = t, this.packing = e, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : gr, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, t.indicesForPacking(e), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: t.levelCount }, (i, r) => r)
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
    return [...this.visibleLevelSet].sort((t, e) => t - e);
  }
  get instanceCounts() {
    return Array.from(
      { length: this.lod.levelCount },
      (t, e) => this.levelMeshes.get(e)?.count ?? 0
    );
  }
  setLevels(t) {
    const e = /* @__PURE__ */ new Set();
    for (const s of t) {
      if (!Number.isInteger(s) || s < 0 || s >= this.lod.levelCount)
        throw new RangeError(`Gaussian LOD level ${s} does not exist`);
      e.add(s);
    }
    this.visibleLevelSet = e;
    for (const [s, i] of this.levelMeshes)
      i.visible = e.has(s);
    return this;
  }
  /** Replace the active cell/level cut, for example after a future dynamic repack. */
  setPacking(t) {
    return this.lod.indicesForPacking(t), this.packing = t, this.rebuildMeshes(), this.setLevels(this.visibleLevels), this;
  }
  dispose() {
    this.removeFromParent(), this.disposeMeshes();
  }
  rebuildMeshes() {
    this.disposeMeshes();
    const t = Array.from(
      { length: this.lod.levelCount },
      () => []
    );
    for (let r = 0; r < this.packing.nodeIds.length; r++) {
      const a = this.packing.lodLevels[r], o = t[a];
      if (o === void 0)
        throw new RangeError(`Gaussian LOD level ${a} does not exist`);
      o.push(this.packing.nodeIds[r]);
    }
    const e = new nt(), s = new nt(), i = new Ot();
    for (let r = 0; r < t.length; r++) {
      const a = t[r];
      if (a.length === 0) continue;
      const o = new ni(1, 1, 1), c = new oi({
        color: this.colors[r % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: ci,
        toneMapped: !1,
        wireframe: this.wireframe
      }), l = new li(o, c, a.length);
      for (let u = 0; u < a.length; u++) {
        const d = this.lod.octree.nodes[a[u]].bounds;
        d.getCenter(e), d.getSize(s), i.makeScale(s.x, s.y, s.z), i.setPosition(e), l.setMatrixAt(u, i);
      }
      l.instanceMatrix.needsUpdate = !0, l.computeBoundingSphere(), l.name = `Gaussian LOD ${r} volumes`, l.frustumCulled = !1, l.renderOrder = 900 + r, l.userData.lodLevel = r, this.levelMeshes.set(r, l), this.add(l);
    }
  }
  disposeMeshes() {
    for (const t of this.levelMeshes.values())
      t.removeFromParent(), t.geometry.dispose(), t.material.dispose();
    this.levelMeshes.clear();
  }
}
const Re = z("uint", "gaussianIndex"), Ee = z("uint", "gaussianObjectId"), re = z("vec3", "gaussianPositionLocal"), Xt = z("vec3", "gaussianPositionWorld"), ae = z("vec3", "gaussianScale"), ne = z("vec4", "gaussianRotation"), oe = z("float", "gaussianOpacity"), Ne = z("vec3", "gaussianColor"), Te = z("mat4", "gaussianObjectMatrix"), Be = z("bool", "gaussianObjectVisible"), Oe = z("vec3", "gaussianViewDirection"), Ge = z("float", "gaussianViewDepth"), $e = z(
  "vec2",
  "gaussianScreenPosition"
), Es = z(
  "vec2",
  "gaussianScreenBoundsMin"
), Ns = z(
  "vec2",
  "gaussianScreenBoundsMax"
), De = z(
  "vec2",
  "gaussianProjectedSigma"
), je = z("float", "gaussianProjectedArea"), ce = z("uint", "rasterGaussianIndex"), Ve = z("uint", "rasterObjectId"), Ue = z("uvec2", "rasterPixelCoordinate"), Fe = z("vec2", "rasterScreenPosition"), We = z("vec2", "rasterScreenUV"), qe = z("float", "rasterPixelValue"), Ye = z("vec2", "rasterGaussianCenter"), He = z("vec2", "rasterPixelDelta"), Ts = z("vec2", "rasterGaussianCoord"), Bs = z("vec2", "rasterUV"), Ke = z("float", "rasterViewDepth"), Xe = z("vec3", "rasterGaussianColor"), Ze = z("float", "rasterGaussianOpacity"), Qe = z("float", "rasterPower"), Os = z("float", "rasterWeight");
function yr() {
  return {
    gaussianPositionLocalNode: re,
    gaussianPositionWorldNode: Xt,
    gaussianScaleNode: ae,
    gaussianRotationNode: ne,
    gaussianOpacityNode: oe,
    gaussianColorNode: Ne,
    gaussianVisibilityNode: Bt(!0),
    rasterPixelValueNode: O(0),
    rasterBreakNode: Bt(!1),
    rasterColorNode: Xe,
    rasterAlphaNode: Ze.mul(Is(Qe)),
    rasterDiscardNode: Bt(!1)
  };
}
const Ht = /* @__PURE__ */ new Set([
  Re,
  Ee,
  re,
  Xt,
  ae,
  ne,
  oe,
  Ne,
  Te,
  Be,
  Oe,
  Ge,
  $e,
  Es,
  Ns,
  De,
  je
]), Je = /* @__PURE__ */ new Set([
  ce,
  Ve,
  Ue,
  Fe,
  We,
  qe,
  Ye,
  He,
  Ts,
  Bs,
  Ke,
  Xe,
  Ze,
  Qe,
  Os
]), Gs = /* @__PURE__ */ new Set([
  Ue,
  Fe,
  We
]), xr = /* @__PURE__ */ new Set([
  ...Gs,
  qe,
  ce,
  Ve,
  Ye,
  He,
  Ke
]);
function $s(n, t, e) {
  n.traverse((s) => {
    if ((Ht.has(s) || Je.has(s)) && !t.has(s))
      throw new Error(
        `A ${e} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function zt(n, t, e) {
  n.traverse((s) => {
    if ((Ht.has(s) || Je.has(s)) && !t.has(s))
      throw new Error(
        `GaussianPass.${e} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const br = [
  15228264,
  15906891,
  4900235
];
class Ea {
  constructor(t, e = {}) {
    if (this.pass = t, e.colors !== void 0 && e.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = e.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...e.colors ?? br], this.tintStrength = s, this.lodLevelAttribute = t.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = t.subscribeDebug(() => this.update()), this.enabled = e.enabled ?? !0;
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
  set enabled(t) {
    if (this.assertUsable(), t !== this.active) {
      if (t) {
        this.baseColorNode = this.pass.rasterColorNode, this.active = !0, this.lodLevelAttribute.isAllocated && this.rebuildColorNode();
        return;
      }
      this.pass.rasterColorNode === this.helperColorNode && (this.pass.rasterColorNode = this.baseColorNode), this.active = !1, this.baseColorNode = null, this.helperColorNode = null, this.boundBuffer = null;
    }
  }
  /** Refresh after a layout event; only a replaced backing buffer rebuilds the node. */
  update() {
    this.assertUsable(), !(!this.active || !this.lodLevelAttribute.isAllocated) && this.lodLevelAttribute.bufferAttribute !== this.boundBuffer && this.rebuildColorNode();
  }
  dispose() {
    this.disposed || (this.unsubscribeDebug(), this.active && this.pass.rasterColorNode === this.helperColorNode && (this.pass.rasterColorNode = this.baseColorNode), this.active = !1, this.baseColorNode = null, this.helperColorNode = null, this.boundBuffer = null, this.disposed = !0);
  }
  rebuildColorNode() {
    const t = this.lodLevelAttribute.bufferAttribute, e = y(t, "uint", t.count).toReadOnly().element(ce).mod(m(this.colors.length)), s = this.colors.map((a) => {
      const o = new ui(a).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return ee(o.r, o.g, o.b);
    });
    let i = s[s.length - 1];
    for (let a = s.length - 2; a >= 0; a--)
      i = e.equal(m(a)).select(s[a], i);
    const r = _i(
      this.baseColorNode,
      i,
      O(this.tintStrength)
    );
    this.boundBuffer = t, this.helperColorNode = r, this.pass.rasterColorNode = r;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
const wr = 1024 * 1024, _r = 16, vr = 1.25;
class kr {
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
  constructor(t, e = {}) {
    if (this.targetStrategy = t, this.targetPlanner = e.targetPlanner ?? null, this.maxUploadBytesPerPack = e.maxUploadBytesPerPack ?? wr, this.maxChangedCellsPerPack = e.maxChangedCellsPerPack ?? _r, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
      throw new RangeError(
        "Streaming LOD maxUploadBytesPerPack must be finite and positive"
      );
    if (!Number.isInteger(this.maxChangedCellsPerPack) || this.maxChangedCellsPerPack <= 0)
      throw new RangeError(
        "Streaming LOD maxChangedCellsPerPack must be a positive integer"
      );
  }
  setFromCamera(t, e) {
    return this.targetStrategy.setFromCamera(t, e), this.invalidateTarget();
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
  pack(t) {
    if ($t(t.maxGaussians), this.bindLod(t.lod), !this.initialized) {
      const e = this.buildTarget(t);
      return this.initializeApplied(e), this.initialized = !0, this.changes = [], this.changeCursor = 0, e;
    }
    if (this.targetPlanner !== null && (this.targetDirty || !this.targetAvailable || this.targetBudget !== t.maxGaussians)) {
      this.targetPlanner.cancel();
      const e = this.buildTarget(t);
      this.changes = this.planChanges(t.lod, e), this.changeCursor = 0;
    }
    return this.takeNextBatch(t)?.packing ?? this.currentPacking();
  }
  /**
   * Plan the newest target once, then mutate the current dense selection by one
   * bounded batch. A newer invalidation drops all unconsumed old work.
   */
  takeNextBatch(t) {
    if ($t(t.maxGaussians), this.bindLod(t.lod), !this.initialized)
      throw new Error(
        "StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches"
      );
    if (this.refreshTarget(t), this.changeCursor >= this.changes.length) return null;
    const e = [];
    let s = 0;
    for (; this.changeCursor < this.changes.length; ) {
      const i = this.changes[this.changeCursor], r = e.length >= this.maxChangedCellsPerPack || s + i.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (e.length > 0 && r && this.appliedGaussianCount <= t.maxGaussians)
        break;
      this.applyChange(i), e.push({ nodeId: i.nodeId, lodLevel: i.lodLevel }), s += i.estimatedUploadBytes, this.changeCursor++;
    }
    return {
      packing: this.currentPacking(),
      transitions: e,
      pending: this.changeCursor < this.changes.length
    };
  }
  bindLod(t) {
    if (this.lod === null) {
      this.lod = t, this.appliedNodeIds = new Uint32Array(t.nodes.length), this.appliedLodLevels = new Uint8Array(t.nodes.length), this.appliedIndices = new Int32Array(t.nodes.length), this.appliedIndices.fill(-1), this.targetPlanner?.initialize(t);
      return;
    }
    if (this.lod !== t)
      throw new Error(
        "StreamingLodPackingStrategy instances cannot be shared between GaussianLod objects"
      );
  }
  buildTarget(t) {
    const e = this.targetStrategy.pack(t);
    return ws(t.lod, e, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.targetDirty = !1, e;
  }
  refreshTarget(t) {
    if (this.targetPlanner === null) {
      if (this.targetDirty || !this.targetAvailable || this.targetBudget !== t.maxGaussians) {
        const s = this.buildTarget(t);
        this.changes = this.planChanges(t.lod, s), this.changeCursor = 0;
      }
      return;
    }
    (this.targetDirty || this.targetBudget !== t.maxGaussians) && (this.targetPlanner.request(t), this.targetBudget = t.maxGaussians, this.targetDirty = !1, this.targetAvailable = !1, this.changes = [], this.changeCursor = 0);
    const e = this.targetPlanner.takeLatest();
    if (e !== null)
      try {
        ws(t.lod, e.packing, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.changes = this.planChanges(t.lod, e.packing), this.changeCursor = 0, this.latestTargetPlanningMs = e.planningMs, this.latestTargetRoundTripMs = e.roundTripMs;
      } finally {
        e.release();
      }
  }
  initializeApplied(t) {
    this.appliedCellCount = t.nodeIds.length, this.appliedGaussianCount = t.gaussianCount, this.appliedNodeIds.set(t.nodeIds), this.appliedLodLevels.set(t.lodLevels);
    for (let e = 0; e < t.nodeIds.length; e++)
      this.appliedIndices[t.nodeIds[e]] = e;
  }
  planChanges(t, e) {
    const s = new Int16Array(t.nodes.length);
    s.fill(-1);
    for (let a = 0; a < e.nodeIds.length; a++)
      s[e.nodeIds[a]] = e.lodLevels[a];
    const i = [], r = [];
    for (let a = this.appliedCellCount - 1; a >= 0; a--) {
      const o = this.appliedNodeIds[a], c = this.appliedLodLevels[a], l = s[o];
      (l < 0 || l < c) && i.push(
        bs(
          t,
          o,
          c,
          l < 0 ? null : l
        )
      );
    }
    for (let a = 0; a < e.nodeIds.length; a++) {
      const o = e.nodeIds[a], c = e.lodLevels[a], l = this.appliedIndices[o], u = l < 0 ? null : this.appliedLodLevels[l];
      (u === null || c > u) && r.push(bs(t, o, u, c));
    }
    return [...i, ...r];
  }
  applyChange(t) {
    const e = this.appliedIndices[t.nodeId];
    if (t.lodLevel === null) {
      if (e < 0) return;
      const s = --this.appliedCellCount;
      if (e !== s) {
        const i = this.appliedNodeIds[s];
        this.appliedNodeIds[e] = i, this.appliedLodLevels[e] = this.appliedLodLevels[s], this.appliedIndices[i] = e;
      }
      this.appliedIndices[t.nodeId] = -1;
    } else if (e < 0) {
      const s = this.appliedCellCount++;
      this.appliedNodeIds[s] = t.nodeId, this.appliedLodLevels[s] = t.lodLevel, this.appliedIndices[t.nodeId] = s;
    } else
      this.appliedLodLevels[e] = t.lodLevel;
    this.appliedGaussianCount += t.gaussianDelta;
  }
  currentPacking() {
    return {
      nodeIds: this.appliedNodeIds.subarray(0, this.appliedCellCount),
      lodLevels: this.appliedLodLevels.subarray(0, this.appliedCellCount),
      gaussianCount: this.appliedGaussianCount
    };
  }
}
function Na(n) {
  return n instanceof kr;
}
function bs(n, t, e, s) {
  const i = n.nodes[t], r = e === null ? 0 : i.levelCounts[e], a = s === null ? 0 : i.levelCounts[s], o = Math.max(0, a - r), c = Math.max(0, r - a), l = e !== null && s !== null && e !== s ? Math.min(r, a) : 0, u = 48 + n.octree.data.shCoefficientCount * As + 4;
  return {
    nodeId: t,
    lodLevel: s,
    gaussianDelta: a - r,
    estimatedUploadBytes: Math.ceil(
      (o * u + c * 16 + l * 4) * vr
    )
  };
}
function ws(n, t, e) {
  if (t.gaussianCount > e)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${e} Gaussians`
    );
  if (t.nodeIds.length !== t.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let i = 0;
  for (let r = 0; r < t.nodeIds.length; r++) {
    const a = t.nodeIds[r], o = t.lodLevels[r], l = n.nodes[a]?.levelCounts[o];
    if (l === void 0 || n.octree.nodes[a]?.isLeaf !== !0)
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${a} or level ${o}`
      );
    if (s.has(a))
      throw new Error(`GaussianLod packing contains duplicate node ${a}`);
    s.add(a), i += l;
  }
  if (i !== t.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${t.gaussianCount} Gaussians but selects ${i}`
    );
}
function Ds(n, t, e) {
  if (t.length !== 0) {
    for (const s of t)
      n.addUpdateRange(
        s.start * e,
        s.count * e
      );
    n.needsUpdate = !0;
  }
}
const js = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), Vs = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), Us = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class Sr {
  format;
  name;
  packedBuffer = null;
  disposed = !1;
  constructor(t, e) {
    this.name = t, this.format = e;
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
  [js](t) {
    this.assertUsable();
    const e = this.packedBuffer, s = new Gt(t, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, e?.dispose();
  }
  [Vs](t) {
    Ds(this.bufferAttribute, t, 1);
  }
  [Us]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const Fs = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), Ws = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class Cr {
  attributes = /* @__PURE__ */ new Map();
  get size() {
    return this.attributes.size;
  }
  get(t) {
    return this.attributes.get(t);
  }
  has(t) {
    return this.attributes.has(t);
  }
  values() {
    return this.attributes.values();
  }
  [Symbol.iterator]() {
    return this.values();
  }
  [Fs](t, e) {
    const s = this.attributes.get(t);
    if (s !== void 0) {
      if (s.format !== e)
        throw new Error(
          `GaussianStore attribute ${t} already uses format ${s.format}`
        );
      return s;
    }
    const i = new Sr(t, e);
    return this.attributes.set(t, i), i;
  }
  [Ws]() {
    for (const t of this.attributes.values())
      t[Us]();
    this.attributes.clear();
  }
}
const Mr = {
  maxGaussians: "auto"
};
class Ta {
  attributes = new Cr();
  scheduler;
  packedShFormat = "rgb8e8";
  maxGaussiansOption = "auto";
  cloudMap = /* @__PURE__ */ new Map();
  cloudIds = /* @__PURE__ */ new Map();
  pendingLoads = /* @__PURE__ */ new Map();
  abortedLoads = /* @__PURE__ */ new Set();
  pendingMutations = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  schemas = /* @__PURE__ */ new Map();
  extraBuffers = /* @__PURE__ */ new Map();
  unsubscribe;
  unsubscribeFailure;
  data = null;
  revision = 0;
  commandNumber = 0;
  cloudNumber = 0;
  lastCameraView = "";
  lastCloudTransforms = /* @__PURE__ */ new Map();
  lastError = null;
  commandError = null;
  capacity = 0;
  packedObjectCapacity = 0;
  packedDegree = 0;
  packedVersion = 0;
  packedLayoutVersion = 0;
  pendingLod = !1;
  packStats = null;
  disposed = !1;
  awaitingCapabilities = !1;
  frontendCapabilities = null;
  constructor(t = new fs(
    new pr(Mr)
  )) {
    this.scheduler = "schedule" in t ? t : new fs(t), this.unsubscribe = this.scheduler.onResponse(this.handleResponse), this.unsubscribeFailure = this.scheduler.onFailure(this.handleFailure);
  }
  get clouds() {
    return [...this.cloudMap.values()].map(({ cloud: t }) => t);
  }
  get count() {
    return this.clouds.reduce((t, e) => t + e.gaussianCount, 0);
  }
  get shDegree() {
    return this.packedDegree;
  }
  get maxGaussians() {
    return this.capacity;
  }
  get objectCapacity() {
    return this.packedObjectCapacity;
  }
  get layoutVersion() {
    return this.packedLayoutVersion;
  }
  get contentVersion() {
    return this.packedVersion;
  }
  get hasPackedData() {
    return this.data !== null && !this.awaitingCapabilities;
  }
  get lastPackStats() {
    return this.packStats;
  }
  get lastCommandError() {
    return this.commandError;
  }
  subscribe(t) {
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  async load(t, e = {}, s) {
    if (s?.aborted) throw new DOMException("Load cancelled", "AbortError");
    const i = typeof document > "u" ? t : new URL(t, document.baseURI).href, r = this.nextCommandId(), a = this.nextCloudId(), o = this.awaitLoad(r, e, s);
    try {
      this.submit(Ti(r, a, i, e));
    } catch (c) {
      this.rejectLoad(r, c);
    }
    return o;
  }
  async loadBuffer(t, e = {}, s) {
    if (s?.aborted) throw new DOMException("Load cancelled", "AbortError");
    const i = this.nextCommandId(), r = this.nextCloudId(), a = this.awaitLoad(i, e, s);
    try {
      this.submit(
        Bi(i, r, t, e)
      );
    } catch (o) {
      this.rejectLoad(i, o);
    }
    return a;
  }
  remove(t) {
    const e = this.cloudIds.get(t);
    e !== void 0 && (this.cloudMap.delete(e), this.cloudIds.delete(t), t.setRaycastIndex(null), t.removeFromParent(), this.notify("clouds"), this.submit(Oi(this.nextCommandId(), e)));
  }
  updatePackingPriority(t, e) {
    if (!Number.isSafeInteger(e))
      throw new RangeError("Priority must be a safe integer");
    const s = this.requireId(t), i = this.cloudMap.get(s), r = i.priority;
    i.priority = e, t.updatePackingPriority(e);
    const a = this.nextCommandId();
    this.pendingMutations.set(a, () => {
      i.priority === e && (i.priority = r, t.updatePackingPriority(r));
    });
    try {
      this.submit(Gi(a, s, e));
    } catch (o) {
      throw this.pendingMutations.get(a)?.(), this.pendingMutations.delete(a), o;
    }
  }
  setCloudPacking(t, e) {
    const s = this.requireId(t), i = this.cloudMap.get(s), r = i.packingStrategy;
    i.packingStrategy = e;
    const a = this.nextCommandId();
    this.pendingMutations.set(a, () => {
      i.packingStrategy === e && (i.packingStrategy = r);
    });
    try {
      this.submit(
        $i(a, s, e)
      );
    } catch (o) {
      throw this.pendingMutations.get(a)?.(), this.pendingMutations.delete(a), o;
    }
  }
  setCloudRaycastable(t, e) {
    const s = this.requireId(t);
    e || t.setRaycastIndex(null), this.submit(
      ji(
        this.nextCommandId(),
        s,
        e
      )
    );
  }
  writeAttributeRange(t, e, s, i, r) {
    this.submit(
      Vi(
        this.nextCommandId(),
        this.requireId(t),
        e,
        s,
        i,
        r
      )
    );
  }
  invalidateCloudPacking(t) {
    const e = this.requireId(t), s = this.cloudMap.get(e).packingStrategy;
    s && this.setCloudPacking(t, s);
  }
  enablePackedLodLevelAttribute() {
    return this.attributes.get("lodLevel") ?? this.attributes[Fs]("lodLevel", "u32");
  }
  getPackedAttribute(t) {
    return t === "lodLevel" ? this.attributes.get(t)?.bufferAttribute : this.extraBuffers.get(t);
  }
  setFrontendCapabilities(t) {
    if (this.disposed) throw new Error("GaussianStore disposed");
    const e = this.frontendCapabilities;
    if (e && e.maxStorageBufferBindingSize === t.maxStorageBufferBindingSize && e.maxBufferSize === t.maxBufferSize && e.maxStorageBuffersPerShaderStage === t.maxStorageBuffersPerShaderStage && e.supportsPartialBufferUpdates === t.supportsPartialBufferUpdates)
      return;
    const s = this.awaitingCapabilities;
    this.awaitingCapabilities = !0, this.frontendCapabilities = { ...t }, this.scheduler.start(t).then(
      () => {
        this.frontendCapabilities === null || this.frontendCapabilities.maxBufferSize !== t.maxBufferSize || this.frontendCapabilities.maxStorageBufferBindingSize !== t.maxStorageBufferBindingSize || this.frontendCapabilities.maxStorageBuffersPerShaderStage !== t.maxStorageBuffersPerShaderStage || this.frontendCapabilities.supportsPartialBufferUpdates !== t.supportsPartialBufferUpdates || (this.awaitingCapabilities = !1, this.notify("content"));
      },
      (i) => {
        this.frontendCapabilities = e, this.awaitingCapabilities = s, this.lastError = i instanceof Error ? i : new Error(String(i)), this.notify("content");
      }
    );
  }
  updateLod(t) {
    if (this.disposed) return { appliedBatches: 0, pending: !1, clouds: [] };
    t.updateWorldMatrix(!0, !1);
    const e = t.getWorldPosition(new nt()), s = t.matrixWorld.elements.slice(), i = t.projectionMatrix.elements.slice(), r = this.clouds.map((u) => (u.updateWorldMatrix(!0, !1), [
      this.requireId(u),
      u.matrixWorld.elements.slice()
    ])), a = new Set(r.map(([u]) => u));
    for (const u of this.lastCloudTransforms.keys())
      a.has(u) || this.lastCloudTransforms.delete(u);
    const o = r.filter(
      ([u, d]) => this.lastCloudTransforms.get(u) !== JSON.stringify(d)
    ), c = JSON.stringify([s, i]), l = c !== this.lastCameraView;
    if (l || o.length > 0) {
      const u = ++this.revision;
      for (const [d, h] of o)
        this.submit(
          Di(
            this.nextCommandId(),
            d,
            u,
            h
          )
        ), this.lastCloudTransforms.set(d, JSON.stringify(h));
      l && (this.submit(
        Ui(
          this.nextCommandId(),
          u,
          s,
          i
        )
      ), this.lastCameraView = c);
    }
    return {
      appliedBatches: 0,
      pending: this.pendingLod,
      clouds: this.clouds.map((u) => ({
        cloud: u,
        focusDistance: e.distanceTo(
          u.getWorldPosition(new nt())
        ),
        applied: !1,
        pending: this.pendingLod,
        targetStats: {
          planningMs: 0,
          roundTripMs: 0,
          discardedResults: 0,
          pending: this.pendingLod
        }
      }))
    };
  }
  getPackedData() {
    if (this.lastError) throw this.lastError;
    if (!this.data || this.awaitingCapabilities)
      throw new Error("Gaussian buffers are not ready");
    return this.data;
  }
  getBounds(t) {
    return this.cloudMap.get(this.requireId(t)).bounds;
  }
  getSourceCount(t) {
    return this.cloudMap.get(this.requireId(t)).sourceCount;
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0, this.unsubscribe(), this.unsubscribeFailure(), this.scheduler.dispose();
      for (const t of this.pendingLoads.values())
        t.cleanup(), t.reject(new Error("GaussianStore disposed"));
      this.pendingLoads.clear(), this.abortedLoads.clear(), this.pendingMutations.clear();
      for (const { cloud: t } of this.cloudMap.values())
        t.setRaycastIndex(null), t.removeFromParent();
      this.cloudMap.clear(), this.data?.dispose(), this.data = null;
      for (const t of this.extraBuffers.values()) t.dispose();
      this.extraBuffers.clear(), this.attributes[Ws](), this.listeners.clear();
    }
  }
  submit(t) {
    this.scheduler.schedule(t).then(
      (e) => {
        e === "superseded" && (this.pendingMutations.delete(t.id), this.abortedLoads.delete(t.id));
      },
      (e) => {
        const s = e instanceof Error ? e : new Error(String(e));
        this.pendingLoads.has(t.id) ? this.rejectLoad(t.id, s) : this.pendingMutations.has(t.id) && (this.pendingMutations.get(t.id)?.(), this.pendingMutations.delete(t.id), this.commandError = s, this.notify("content"));
      }
    );
  }
  handleFailure = (t) => {
    const e = new Error(t.message);
    for (const s of [...this.pendingLoads.keys()]) this.rejectLoad(s, e);
    for (const s of this.pendingMutations.values()) s();
    this.pendingMutations.clear(), this.lastError = e, this.awaitingCapabilities = !1, this.notify("content");
  };
  handleResponse = (t) => {
    if (!this.disposed) {
      if (t.payload && this.handlePayload(t.payload, t.command.id), t.error) {
        const e = new Error(t.error.message);
        t.error.code === "cancelled" && (e.name = "AbortError"), this.pendingLoads.has(t.command.id) ? this.rejectLoad(t.command.id, e) : (this.pendingMutations.get(t.command.id)?.(), this.pendingMutations.delete(t.command.id), this.commandError = e, this.awaitingCapabilities = !1), this.notify("content");
      } else t.isFinal && (this.pendingMutations.delete(t.command.id), this.commandError && (this.commandError = null, this.notify("content")));
      t.isFinal && this.abortedLoads.delete(t.command.id);
    }
  };
  handlePayload(t, e) {
    switch (t.type) {
      case "capabilities-accepted":
        break;
      case "cloud-loaded": {
        if (this.abortedLoads.has(e)) break;
        const s = this.pendingLoads.get(e)?.options ?? {}, i = s.priority ?? 0, r = new fr(
          this,
          t.objectId,
          0,
          s.name ?? t.cloudId,
          i
        );
        t.raycast && r.setRaycastIndex(new be(t.raycast)), this.cloudMap.set(t.cloudId, {
          cloud: r,
          sourceCount: t.sourceCount,
          bounds: t.bounds,
          priority: i,
          sourceVersion: 1,
          packingStrategy: s.packingStrategy
        }), this.cloudIds.set(r, t.cloudId), this.pendingLoads.get(e)?.cleanup(), this.pendingLoads.get(e)?.resolve(r), this.pendingLoads.delete(e), this.notify("clouds");
        break;
      }
      case "cloud-unloaded":
        break;
      case "cloud-raycast-changed": {
        const s = this.cloudMap.get(t.cloudId);
        s && s.cloud.setRaycastIndex(
          t.raycast ? new be(t.raycast) : null
        );
        break;
      }
      case "raycast-replaced": {
        const s = this.cloudMap.get(t.cloudId);
        s && t.sourceVersion > s.sourceVersion && (s.sourceVersion = t.sourceVersion, s.bounds = t.bounds, s.cloud.setRaycastIndex(new be(t.raycast)));
        break;
      }
      case "buffers-replaced":
        this.replace(t);
        break;
      case "buffers-patched":
        this.patch(t);
        break;
    }
  }
  replace(t) {
    if (t.layoutVersion <= this.packedLayoutVersion) return;
    const e = new Map(
      t.attributes.map((r) => [r.name, r])
    ), s = (r) => {
      const a = e.get(r);
      if (!a) throw new Error(`Missing backend attribute: ${r}`);
      return a;
    }, i = this.data;
    this.data = t.clouds.length > 0 ? new Mi(
      {
        means: Jt("means", s("means").data),
        scalesOpacity: Jt(
          "scalesOpacity",
          s("scalesOpacity").data
        ),
        rotations: Jt(
          "rotations",
          s("rotations").data
        ),
        shCoefficients: _s(
          "shCoefficients",
          s("shCoefficients").data
        )
      },
      {
        count: t.capacity,
        shDegree: t.shDegree,
        shFormat: "rgb8e8",
        ownsBuffers: !0
      }
    ) : null, i?.dispose(), this.schemas.clear();
    for (const r of t.attributes)
      this.schemas.set(r.name, r);
    for (const r of this.extraBuffers.values()) r.dispose();
    this.extraBuffers.clear();
    for (const r of t.attributes)
      r.name === "lodLevel" ? this.enablePackedLodLevelAttribute()[js](
        new Uint32Array(r.data)
      ) : ["means", "scalesOpacity", "rotations", "shCoefficients"].includes(
        r.name
      ) || this.extraBuffers.set(
        r.name,
        r.format === "f32" ? Jt(
          r.name,
          r.data,
          r.elementsPerGaussian
        ) : _s(
          r.name,
          r.data,
          r.elementsPerGaussian
        )
      );
    this.applyCloudStates(t.clouds), this.capacity = t.capacity, this.packedObjectCapacity = t.objectCapacity, this.packedDegree = t.shDegree, this.packedLayoutVersion = t.layoutVersion, this.packedVersion = t.contentVersion, this.pendingLod = !1, this.packStats = {
      fullRebuild: !0,
      slotCapacity: t.capacity,
      activeGaussians: t.count,
      reusedSlots: 0,
      writtenSlots: t.count,
      clearedSlots: 0,
      estimatedUploadBytes: t.attributes.reduce(
        (r, a) => r + a.data.byteLength,
        0
      ),
      writtenSlotRanges: t.count ? [{ start: 0, count: t.count }] : [],
      clearedSlotRanges: [],
      planningMs: 0,
      slotUpdateMs: 0
    }, this.awaitingCapabilities = !1, this.notify("layout");
  }
  patch(t) {
    if (t.layoutVersion !== this.packedLayoutVersion || t.baseContentVersion !== this.packedVersion)
      return;
    for (const r of t.patches) {
      const a = this.schemas.get(r.name);
      if (!a) continue;
      const o = this.attributeArray(r.name);
      if (!o) continue;
      const c = r.firstSlot * a.elementsPerGaussian, l = a.format === "f32" ? new Float32Array(r.data) : new Uint32Array(r.data);
      if (o.set(l, c), r.name === "lodLevel")
        this.enablePackedLodLevelAttribute()[Vs]([
          { start: r.firstSlot, count: r.slotCount }
        ]);
      else {
        const u = this.getPackedAttribute(r.name) ?? this.data?.[r.name];
        u && Ds(
          u,
          [{ start: r.firstSlot, count: r.slotCount }],
          a.elementsPerGaussian
        );
      }
    }
    this.applyCloudStates(t.changedClouds), this.packedVersion = t.contentVersion, this.pendingLod = t.lodPending;
    const e = t.patches.map((r) => ({
      start: r.firstSlot,
      count: r.slotCount
    })), s = /* @__PURE__ */ new Set();
    for (const r of e)
      for (let a = r.start; a < r.start + r.count; a++)
        s.add(a);
    const i = t.changedClouds.reduce(
      (r, a) => r + a.renderedCount,
      0
    );
    this.packStats = {
      fullRebuild: !1,
      slotCapacity: this.capacity,
      activeGaussians: i,
      reusedSlots: Math.max(0, i - s.size),
      writtenSlots: s.size,
      clearedSlots: 0,
      estimatedUploadBytes: t.patches.reduce(
        (r, a) => r + a.data.byteLength,
        0
      ),
      writtenSlotRanges: e,
      clearedSlotRanges: [],
      planningMs: 0,
      slotUpdateMs: 0
    }, this.notify("content");
  }
  attributeArray(t) {
    return t === "lodLevel" ? this.enablePackedLodLevelAttribute().array : t === "means" ? this.data?.means.array ?? null : t === "scalesOpacity" ? this.data?.scalesOpacity.array ?? null : t === "rotations" ? this.data?.rotations.array ?? null : t === "shCoefficients" ? this.data?.shCoefficients.array ?? null : this.extraBuffers.get(t)?.array ?? null;
  }
  applyCloudStates(t) {
    for (const e of t)
      this.cloudMap.get(e.cloudId)?.cloud.updatePacking(e.renderedCount);
  }
  notify(t) {
    for (const e of this.listeners)
      e({ type: "changed", reason: t });
  }
  nextCloudId() {
    return `cloud-${++this.cloudNumber}`;
  }
  nextCommandId() {
    return `command-${++this.commandNumber}`;
  }
  requireId(t) {
    const e = this.cloudIds.get(t);
    if (!e) throw new Error("Cloud does not belong to this GaussianStore");
    return e;
  }
  awaitLoad(t, e, s) {
    return new Promise((i, r) => {
      const a = () => {
        this.abortedLoads.add(t), this.scheduler.cancel(t), this.rejectLoad(t, new DOMException("Load cancelled", "AbortError"));
      };
      s?.addEventListener("abort", a, { once: !0 }), this.pendingLoads.set(t, {
        resolve: i,
        reject: r,
        options: e,
        cleanup: () => s?.removeEventListener("abort", a)
      });
    });
  }
  rejectLoad(t, e) {
    const s = this.pendingLoads.get(t);
    s && (s.cleanup(), this.pendingLoads.delete(t), s.reject(e));
  }
}
function Jt(n, t, e = 4) {
  const s = new Gt(new Float32Array(t), e);
  return s.name = `3dgs.store.${n}`, s;
}
function _s(n, t, e = 1) {
  const s = new Gt(new Uint32Array(t), e);
  return s.name = `3dgs.store.${n}`, s;
}
const T = 16, b = 256, zr = 8192, G = 512, Ce = 4, M = 1 << Ce, it = 4, ot = b * it, H = ot, rt = 32, Lr = (
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
), Pr = (
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
), Ir = (
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
function qs(n, t) {
  return Math.max(1, Math.ceil(2 * n / t));
}
function Ar(n, t) {
  if (n !== null) {
    if (!Number.isInteger(n) || n < b || n % b !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${b} and at least ${b}`
      );
    if (qs(t, n) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const Rr = (
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
  let radix_blocks = (count + ${ot - 1}u) / ${ot}u;
  let reduce_chunks = (radix_blocks + ${H - 1}u) / ${H}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${M}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${b - 1}u) / ${b}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Er(n) {
  return (
    /* wgsl */
    `
fn compact_visible_${n}(
  gid: u32,
  gaussian_count: u32,
  viewport: vec4<f32>,
  visible_offsets: ptr<storage, array<u32>, read>,
  projected_mean: ptr<storage, array<vec4<f32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read_write>
) -> u32 {
  if (gid >= gaussian_count || (*projected_mean)[gid].w <= 0.0) { return 0u; }
  let depth = (*projected_mean)[gid].z;
  (*records)[(*visible_offsets)[gid]] = vec2<u32>(${n === "float32" ? "bitcast<u32>(depth)" : `u32(round(clamp(
          (depth - viewport.z) / (viewport.w - viewport.z),
          0.0,
          1.0
        ) * 65535.0))`}, gid);
  return 0u;
}
`
  );
}
const Nr = (
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
class ct {
  attributes = [];
  createFloat(t, e, s = 4) {
    return this.track(
      t,
      new Gt(new Float32Array(e * s), s)
    );
  }
  createUint(t, e, s = 1) {
    return this.track(
      t,
      new Gt(new Uint32Array(e * s), s)
    );
  }
  createIndirect(t) {
    return this.track(
      t,
      new hi(new Uint32Array(4), 4)
    );
  }
  dispose() {
    for (const t of this.attributes) t.dispose();
    this.attributes.length = 0;
  }
  track(t, e) {
    return e.name = t, this.attributes.push(e), e;
  }
}
class Tr {
  constructor(t, e, s, i, r) {
    this.renderer = t, this.visibleDispatch = r, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      e
    );
    const a = I(
      Nr
    );
    this.computeNode = a({
      rank: Z,
      state: y(r.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: y(
        i,
        "uvec2",
        e
      ).toReadOnly(),
      tile_counts: y(
        s,
        "uint",
        e
      ).toReadOnly(),
      ordered_tile_counts: y(this.tileCounts, "uint", e)
    }).computeKernel([b]).setName("3DGS gather depth-ordered tile counts WGSL");
  }
  renderer;
  visibleDispatch;
  tileCounts;
  attributes = new ct();
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function Ys(n) {
  return (
    /* wgsl */
    `
fn ${n.functionName}(
  lane: u32,
  group_id: u32,
  length: u32,
  input_values: ptr<storage, array<${n.inputType}>, read>,
  output_values: ptr<storage, array<u32>, read_write>,
  block_sums: ptr<storage, array<u32>, read_write>,
  scratch: ptr<workgroup, array<u32, ${G}>>
) -> u32 {
  let base = group_id * ${G}u;
  let first = base + lane;
  let second = first + ${b}u;
  (*scratch)[lane] = ${n.readValue("first")};
  (*scratch)[lane + ${b}u] = ${n.readValue("second")};
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${G / 2}u;
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
    (*block_sums)[group_id] = (*scratch)[${G - 1}u];
    (*scratch)[${G - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${G / 2}u;
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
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${b}u]; }
  return 0u;
}
`
  );
}
const Br = Ys({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (n) => `select(0u, (*input_values)[${n}], ${n} < length)`
}), Or = Ys({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (n) => `select(0u, 1u, ${n} < length && (*input_values)[${n}].w > 0.0)`
}), Gr = (
  /* wgsl */
  `
fn add_scan_offsets(
  index: u32,
  length: u32,
  values: ptr<storage, array<u32>, read_write>,
  block_offsets: ptr<storage, array<u32>, read>
) -> u32 {
  if (index < length) {
    (*values)[index] += (*block_offsets)[index / ${G}u];
  }
  return 0u;
}
`
);
class Me {
  output;
  attributes = new ct();
  levels = [];
  constructor(t, e, s = "intersections", i = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, e);
    const r = I(Br), a = I(
      Or
    ), o = I(Gr);
    let c = t, l = this.output, u = e;
    for (; ; ) {
      const d = Math.ceil(u / G), h = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        d
      ), p = $("uint", G), g = this.levels.length === 0 && i === "projectedVisibility", w = (g ? a : r)({
        lane: gt,
        group_id: Y.x,
        length: m(u),
        input_values: y(
          c,
          g ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: y(l, "uint", u),
        block_sums: y(h, "uint", d),
        scratch: p
      }).computeKernel([b]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
      if (this.levels.push({
        length: u,
        blockCount: d,
        output: l,
        scanNode: w
      }), d <= 1) break;
      c = h, u = d, l = this.attributes.createUint(
        `3dgs.${s}-scan-offsets-${this.levels.length}`,
        u
      );
    }
    for (let d = 0; d < this.levels.length - 1; d++) {
      const h = this.levels[d], p = this.levels[d + 1];
      h.addNode = o({
        index: Z,
        length: m(h.length),
        values: y(h.output, "uint", h.length),
        block_offsets: y(
          p.output,
          "uint",
          p.length
        ).toReadOnly()
      }).compute(h.length, [b]).setName(`3DGS ${s} add scan offsets WGSL ${d}`);
    }
  }
  encode(t) {
    for (const e of this.levels)
      t.compute(e.scanNode, [e.blockCount, 1, 1]);
    for (let e = this.levels.length - 2; e >= 0; e--)
      t.compute(this.levels[e].addNode);
  }
  dispose() {
    for (const t of this.levels)
      t.scanNode.dispose(), t.addNode?.dispose();
    this.attributes.dispose();
  }
}
class $r {
  constructor(t, e) {
    this.camera = t, this.background = e;
  }
  camera;
  background;
  projection = Ut(new Ot());
  view = Ut(new Ot());
  viewport = Ut(new di());
  tilesX = Ut(1, "uint");
  tilesY = Ut(1, "uint");
  update(t, e, s, i) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(t, e, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = i;
  }
}
function Hs(n) {
  const { center: t, conic: e, powerThreshold: s, tileX: i, tileY: r, onHit: a } = n;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${i}), f32(${r})) * ${T}.0;
      let rect_max = rect_min + vec2<f32>(${T}.0);
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
          select(-${T}.0, ${T}.0, x_left),
          select(-${T}.0, ${T}.0, y_above)
        );
        let difference = ${t} - corner;
        let tx_raw = (
          edge.x * ${e}.x * difference.x +
          edge.x * ${e}.y * difference.y
        ) / (edge.x * ${e}.x * edge.x);
        let ty_raw = (
          edge.y * ${e}.y * difference.x +
          edge.y * ${e}.z * difference.y
        ) / (edge.y * ${e}.z * edge.y);
        let tx = select(clamp(tx_raw, 0.0, 1.0), 0.0, in_y_range);
        let ty = select(clamp(ty_raw, 0.0, 1.0), 0.0, in_x_range);
        let closest = corner + vec2<f32>(tx * edge.x, ty * edge.y);
        let delta = closest - ${t};
        let sigma = 0.5 * (
          ${e}.x * delta.x * delta.x +
          ${e}.z * delta.y * delta.y
        ) + ${e}.y * delta.x * delta.y;
        contributes = sigma <= ${s};
      }
      if (contributes) {
        ${a}
      }`
  );
}
const Dr = (
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
  let radix_blocks = (count + ${ot - 1}u) / ${ot}u;
  let reduce_chunks = (radix_blocks + ${H - 1}u) / ${H}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${M}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${b - 1}u) / ${b}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), jr = (() => {
  const n = Hs({
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
    clamp(i32(floor((center.x - radius.x) / ${T}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${T}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${T}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${T}.0)), 0, max_tile_y)
  );
  let reserved_count = (*tile_counts)[rank];
  var local_index = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
${n}
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
class Vr {
  constructor(t, e, s, i, r, a, o, c, l, u, d) {
    this.renderer = t, this.capacity = s, this.dispatch = {
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
    const h = y(
      a,
      "uint",
      e
    ).toReadOnly(), p = y(
      o,
      "uint",
      e
    ).toReadOnly(), g = y(
      r.state,
      "uvec4",
      1
    ).toReadOnly(), w = I(Dr);
    this.prepareNode = w({
      item_count_state: g,
      capacity: m(s),
      tile_counts: h,
      intersection_offsets: p,
      state: y(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: y(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: y(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: y(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const f = I(jr);
    this.emitNode = f({
      rank: Z,
      tiles: Kt(d.tilesX, d.tilesY),
      capacity: m(s),
      sorted_gaussians: y(
        i,
        "uvec2",
        e
      ).toReadOnly(),
      projected_mean: y(
        c,
        "vec4",
        e
      ).toReadOnly(),
      projected_conic: y(
        l,
        "vec4",
        e
      ).toReadOnly(),
      projected_color: y(
        u,
        "vec4",
        e
      ).toReadOnly(),
      tile_counts: h,
      intersection_offsets: p,
      visible_state: g,
      records: y(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([b]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = r;
  }
  renderer;
  capacity;
  buffers;
  dispatch;
  attributes = new ct();
  prepareNode;
  emitNode;
  visibleLinearDispatch;
  encode() {
    this.renderer.compute(this.prepareNode), this.renderer.compute(this.emitNode, this.visibleLinearDispatch.linear);
  }
  async readStats() {
    const [t, e] = await Promise.all([
      this.renderer.getArrayBufferAsync(this.dispatch.state),
      this.renderer.getArrayBufferAsync(this.visibleLinearDispatch.state)
    ]), s = new Uint32Array(t);
    return {
      visibleGaussianCount: new Uint32Array(e)[0] ?? 0,
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
const ze = 10;
class Ur {
  constructor(t, e, s) {
    this.camera = t, this.store = e, this.frameComponentOffset = s * 4, this.frameComponentCount = e.objectCapacity * ze * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new Gt(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Ot();
  inverseModel = new Ot();
  cameraWorldPosition = new nt();
  cameraLocalPosition = new nt();
  update() {
    this.camera.updateWorldMatrix(!0, !1), this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld), this.values.fill(0);
    for (const t of this.store.clouds) this.writeCloud(t);
    this.attribute.clearUpdateRanges(), this.attribute.addUpdateRange(
      this.frameComponentOffset,
      this.frameComponentCount
    ), this.attribute.needsUpdate = !0;
  }
  dispose() {
    this.attribute.dispose();
  }
  writeCloud(t) {
    if (t.objectId >= this.store.objectCapacity) return;
    t.updateWorldMatrix(!0, !1), this.modelView.multiplyMatrices(
      this.camera.matrixWorldInverse,
      t.matrixWorld
    ), this.inverseModel.copy(t.matrixWorld).invert(), this.cameraLocalPosition.copy(this.cameraWorldPosition).applyMatrix4(this.inverseModel);
    const e = this.frameComponentOffset + t.objectId * ze * 4;
    this.values.set(t.matrixWorld.elements, e), this.values.set(this.modelView.elements, e + 16), this.values[e + 32] = this.cameraLocalPosition.x, this.values[e + 33] = this.cameraLocalPosition.y, this.values[e + 34] = this.cameraLocalPosition.z, this.values[e + 35] = 1, this.values[e + 36] = Fr(t, this.camera) ? 1 : 0;
  }
}
function Fr(n, t) {
  if (!n.layers.test(t.layers)) return !1;
  let e = n, s = n;
  for (; e !== null; ) {
    if (!e.visible) return !1;
    s = e, e = e.parent;
  }
  return s instanceof Le;
}
function Wr(n) {
  return (
    /* wgsl */
    `
fn project_gaussian_covariance_${n}(
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
  let original_determinant = ${n === "compensated" ? "max(sigma00_unfiltered * sigma11_unfiltered - sigma01 * sigma01, 0.0)" : "1.0"};
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
function qr(n) {
  const t = n === "rgb8e8" ? "u32" : "vec4<f32>", e = n === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (i) => {
    const r = i === 0 ? "base" : `base + ${i}u`;
    return n === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${r}])` : `(*sh_coefficients)[${r}].xyz`;
  };
  return (
    /* wgsl */
    `
fn evaluate_gaussian_sh_${n}(
  gid: u32,
  sh_degree: u32,
  direction: vec3<f32>,
  sh_coefficients: ptr<storage, array<${t}>, read>
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
${e}
`
  );
}
const Yr = (
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
function Hr() {
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
${Hs({
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
const Ks = /* @__PURE__ */ new Set([
  Re,
  Ee,
  re,
  ae,
  ne,
  oe,
  Te,
  Be
]), Xs = /* @__PURE__ */ new Set([
  ...Ks,
  Xt,
  Oe
]), Kr = /* @__PURE__ */ new Set([
  ...Xs,
  Ge,
  $e,
  De,
  je
]);
class Xr {
  constructor(t, e, s, i, r, a = !0) {
    this.data = t, this.frame = e, this.antialiasMode = i, this.subpixelSampleCulling = a, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      t.count
    ), this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      t.count
    ), this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      t.count
    ), this.rebuild(r);
  }
  data;
  frame;
  antialiasMode;
  subpixelSampleCulling;
  projectedMean;
  projectedConic;
  projectedColor;
  tileCounts;
  attributes = new ct();
  computeNode = null;
  rebuild(t) {
    for (const s of [
      t.gaussianPositionLocalNode,
      t.gaussianPositionWorldNode,
      t.gaussianScaleNode,
      t.gaussianRotationNode,
      t.gaussianOpacityNode,
      t.gaussianColorNode,
      t.gaussianVisibilityNode
    ])
      $s(s, Ht, "projection");
    zt(
      t.gaussianPositionLocalNode,
      Ks,
      "gaussianPositionLocalNode"
    );
    for (const [s, i] of [
      ["gaussianPositionWorldNode", t.gaussianPositionWorldNode],
      ["gaussianScaleNode", t.gaussianScaleNode],
      ["gaussianRotationNode", t.gaussianRotationNode]
    ])
      zt(i, Xs, s);
    zt(
      t.gaussianOpacityNode,
      Kr,
      "gaussianOpacityNode"
    ), zt(
      t.gaussianColorNode,
      Ht,
      "gaussianColorNode"
    ), zt(
      t.gaussianVisibilityNode,
      Ht,
      "gaussianVisibilityNode"
    );
    const e = this.createComputeNode(t);
    this.computeNode?.dispose(), this.computeNode = e;
  }
  encode(t) {
    if (this.computeNode === null)
      throw new Error("ProjectionStage has no compute node");
    t.compute(this.computeNode);
  }
  dispose() {
    this.computeNode?.dispose(), this.computeNode = null, this.attributes.dispose();
  }
  createComputeNode(t) {
    const { data: e, frame: s } = this, i = y(e.means, "vec4", e.count).toReadOnly(), r = y(
      e.scalesOpacity,
      "vec4",
      e.count
    ).toReadOnly(), a = y(e.rotations, "vec4", e.count).toReadOnly(), o = e.shFormat === "rgb8e8" ? y(
      e.shCoefficients,
      "uint",
      e.count * e.shCoefficientCount
    ).toReadOnly() : y(
      e.shCoefficients,
      "vec4",
      e.count * e.shCoefficientCount
    ).toReadOnly(), c = y(
      this.projectedMean,
      "vec4",
      this.projectedMean.count
    ), l = y(this.projectedConic, "vec4", e.count), u = y(this.projectedColor, "vec4", e.count), d = y(this.tileCounts, "uint", e.count), h = I(
      Wr(this.antialiasMode)
    ), p = I(qr(e.shFormat)), g = I(Hr()), w = I(Yr);
    return te(() => {
      const x = m(Z);
      R(x.greaterThanEqual(m(e.count)), () => {
        ht();
      }), d.element(x).assign(m(0)), c.element(x).assign(K(0));
      const C = i.element(x), S = C.xyz, _ = m(C.w), v = r.element(x), k = v.xyz, E = v.w, L = a.element(x), A = m(e.count).add(
        _.mul(m(ze))
      ), U = os(
        c.element(A),
        c.element(A.add(1)),
        c.element(A.add(2)),
        c.element(A.add(3))
      ), j = os(
        c.element(A.add(4)),
        c.element(A.add(5)),
        c.element(A.add(6)),
        c.element(A.add(7))
      ), N = c.element(A.add(8)).xyz, V = c.element(A.add(9)).x.greaterThan(0);
      R(V.not(), () => {
        ht();
      });
      const Q = /* @__PURE__ */ new Map([
        [Re, () => x],
        [Ee, () => _],
        [re, () => S],
        [ae, () => k],
        [ne, () => L],
        [oe, () => E],
        [Te, () => U],
        [Be, () => V]
      ]), yt = Ct(
        t.gaussianPositionLocalNode,
        Q
      ).toVar("gaussianPositionLocalValue"), J = U.mul(K(yt, 1)).xyz, tt = new Map(Q);
      tt.set(Xt, () => J);
      const Dt = vi(yt.sub(N));
      tt.set(Oe, () => Dt);
      let xt;
      if (t.gaussianPositionWorldNode === Xt)
        xt = j.mul(K(yt, 1));
      else {
        const Nt = Ct(
          t.gaussianPositionWorldNode,
          tt
        ).toVar("gaussianPositionWorldValue");
        xt = s.view.mul(K(Nt, 1));
      }
      xt = xt.toVar("gaussianViewPosition");
      const bt = Ct(t.gaussianScaleNode, tt).toVar(
        "gaussianScaleValue"
      ), lt = Ct(
        t.gaussianRotationNode,
        tt
      ).toVar("gaussianRotationValue"), et = h({
        view: xt,
        scale_input: bt,
        rotation_input: lt,
        model_view: j,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      R(et.element(0).w.lessThanEqual(0), () => {
        ht();
      });
      const F = et.element(0).xy, wt = et.element(0).z, Lt = et.element(1).xyz, jt = et.element(1).w, _t = et.element(2).xyz, dt = et.element(2).w, at = new Map(tt);
      at.set(Ge, () => wt), at.set($e, () => F), at.set(De, () => Mt(_t.xz)), at.set(
        je,
        () => Mt(jt).mul(Math.PI)
      );
      const vt = Ct(
        t.gaussianOpacityNode,
        at
      ).clamp(0, 1), Pt = this.antialiasMode === "compensated" ? vt.mul(
        Mt(mt(dt.div(jt), 0, 1))
      ) : vt;
      R(Pt.lessThan(O(1 / 255)), () => {
        ht();
      });
      const kt = ki(Pt.mul(255)), B = Mt(
        kt.mul(2).mul(mt(_t.x, 1e-12, 1e4))
      ), It = Mt(
        kt.mul(2).mul(mt(_t.z, 1e-12, 1e4))
      ), Vt = cs(B), At = cs(It);
      R(Vt.lessThanEqual(0).or(At.lessThanEqual(0)), () => {
        ht();
      });
      const Zt = ft(Vt, At), Rt = F.sub(Zt), D = F.add(Zt);
      if (R(
        D.x.lessThan(0).or(D.y.lessThan(0)).or(Rt.x.greaterThanEqual(s.viewport.x)).or(Rt.y.greaterThanEqual(s.viewport.y)),
        () => {
          ht();
        }
      ), this.subpixelSampleCulling) {
        const Nt = w({
          center: F,
          conic: Lt,
          power_threshold: kt,
          extent: ft(B, It),
          viewport: Kt(s.viewport.xy)
        });
        R(Nt.not(), () => {
          c.element(x).assign(K(F, wt, -1)), ht();
        });
      }
      const W = Yt(ls(s.tilesX), ls(s.tilesY)).sub(1), st = Yt(
        mt(ke(Rt.div(O(T))), ft(0), ft(W))
      ), q = Yt(
        mt(ke(D.div(O(T))), ft(0), ft(W))
      ), X = p({
        gid: x,
        sh_degree: m(e.shDegree),
        direction: Dt,
        sh_coefficients: o
      }), St = new Map(at);
      St.set(Ne, () => X), St.set(Es, () => Rt), St.set(Ns, () => D);
      const Qt = Ct(
        t.gaussianVisibilityNode,
        St
      );
      R(Qt.not(), () => {
        ht();
      });
      const ut = g({
        center: F,
        conic: Lt,
        power_threshold: kt,
        tile_min: st,
        tile_max: q
      });
      R(ut.equal(0), () => {
        ht();
      });
      const Et = Ct(
        t.gaussianColorNode,
        St
      ).clamp(0, 1);
      c.element(x).assign(K(F, wt, Pt)), l.element(x).assign(K(Lt, Vt)), u.element(x).assign(K(Et, At)), d.element(x).assign(ut);
    })().compute(e.count, [b]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Ct(n, t) {
  return n.context({ overrideNodes: t });
}
const Zr = (
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
), Qr = b, Zs = 256, Jr = [2048, 4096, 8192];
function ta(n) {
  const t = Math.max(0, n.length - 1);
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
  const e = new Uint32Array(t);
  let s = 0, i = 0, r = 0, a = 0, o = 0, c = 0, l = 0, u = 0;
  for (let d = 0; d < t; d++) {
    const h = Math.max(0, n[d + 1] - n[d]);
    e[d] = h, s += h, i = Math.max(i, h), h > 256 && r++, h > 512 && a++, h > 1024 && o++, h > 2048 && c++;
    const p = Math.ceil(h / Zs);
    l += p, u = Math.max(u, p);
  }
  return e.sort(), {
    max: i,
    mean: s / t,
    median: ea(e),
    p95: ks(e, 0.95),
    p99: ks(e, 0.99),
    tilesOver256: r,
    tilesOver512: a,
    tilesOver1024: o,
    tilesOver2048: c,
    totalBatches: l,
    maxBatches: u
  };
}
function vs(n, t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const e = Math.max(0, n.length - 1);
  let s = 0, i = 0, r = 0, a = 0, o = 0;
  for (let l = 0; l < e; l++) {
    const u = Math.max(0, n[l + 1] - n[l]), d = Math.min(u, t), h = u - d;
    s += d, i += h, h > 0 && r++;
    const p = Math.ceil(d / Zs);
    a += p, o = Math.max(o, p);
  }
  const c = s + i;
  return {
    cap: t,
    rasterizedIntersections: s,
    droppedIntersections: i,
    droppedFraction: c === 0 ? 0 : i / c,
    affectedTiles: r,
    totalBatches: a,
    maxBatches: o
  };
}
function ea(n) {
  const t = Math.floor(n.length / 2);
  return n.length % 2 !== 0 ? n[t] : (n[t - 1] + n[t]) * 0.5;
}
function ks(n, t) {
  const e = Math.max(0, Math.ceil(n.length * t) - 1);
  return n[e];
}
class sa {
  constructor(t, e, s, i, r, a) {
    this.renderer = t, this.maxRasterizedSplatsPerTile = a, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      e
    );
    const o = I(Zr);
    this.computeNode = o({
      index: Z,
      gaussian_count: m(e),
      viewport: Kt(r.viewport.xy),
      projected_mean: y(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: y(
        i,
        "vec4",
        i.count
      ).toReadOnly(),
      zero_pixel_flags: y(this.zeroPixelFlags, "uint", e)
    }).compute(e, [Qr]).setName("3DGS profile subpixel coverage WGSL");
  }
  renderer;
  maxRasterizedSplatsPerTile;
  attributes = new ct();
  zeroPixelFlags;
  computeNode;
  encode() {
    this.renderer.compute(this.computeNode);
  }
  async readStats(t) {
    const [e, s] = await Promise.all([
      this.renderer.getArrayBufferAsync(t),
      this.renderer.getArrayBufferAsync(this.zeroPixelFlags)
    ]), i = new Uint32Array(s);
    let r = 0;
    for (const o of i) r += o;
    const a = new Uint32Array(e);
    return {
      tileLoads: ta(a),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : vs(a, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: Jr.map(
        (o) => vs(a, o)
      ),
      zeroPixelSubpixelSplats: r
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function ia(n) {
  return (
    /* wgsl */
    `
fn radix_histogram_${n}(
  lane: u32,
  block_index: u32,
  subgroup_index: u32,
  subgroup_lane: u32,
  subgroup_size: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  partials: ptr<workgroup, array<u32, ${M * rt}>>
) -> u32 {
  let block_start = block_index * ${ot}u;
  let count = (*state)[0].x;
  let subgroup_count = (${b}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${M}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${it}u; item++) {
      let position = block_start + item * ${b}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${n}u) & ${M - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${rt}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${M}u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[lane * ${rt}u + subgroup];
    }
    (*block_histograms)[lane * block_stride + block_index] = total;
  }
  return 0u;
}
`
  );
}
const ra = (
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
  partials: ptr<workgroup, array<u32, ${rt}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let subgroup_count = (${b}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${H}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${it}u; item++) {
    let block = chunk_start + item * ${b}u + lane;
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
  let chunk_count = ((*state)[0].z + ${H - 1}u) /
    ${H}u;
  var running = 0u;
  for (var digit = 0u; digit < ${M}u; digit++) {
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
  scratch: ptr<workgroup, array<u32, ${H}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${H}u;
  for (var item = 0u; item < ${it}u; item++) {
    let local = item * ${b}u + lane;
    let block = chunk_start + local;
    var value = 0u;
    if (block < block_count) {
      value = (*block_histograms)[digit * block_stride + block];
    }
    (*scratch)[local] = value;
  }
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${H / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${it}u; item++) {
      let worker = item * ${b}u + lane;
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
  if (lane == 0u) { (*scratch)[${H - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${H / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${it}u; item++) {
      let worker = item * ${b}u + lane;
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
  for (var item = 0u; item < ${it}u; item++) {
    let local = item * ${b}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`
);
function oa(n) {
  return (
    /* wgsl */
    `
fn radix_scatter_${n}(
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
  block_bases: ptr<workgroup, array<u32, ${M}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${M}>>,
  partials: ptr<workgroup, array<u32, ${M * rt}>>
) -> u32 {
  let block_start = block_index * ${ot}u;
  let count = (*state)[0].x;
  let subgroup_count = (${b}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${M}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${it}u; item++) {
    let position = block_start + item * ${b}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${n}u) & ${M - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${M}u; target_digit++) {
      let matches = select(0u, 1u, valid && digit == target_digit);
      let prefix = subgroupExclusiveAdd(matches);
      let total = subgroupAdd(matches);
      if (subgroup_lane == 0u) {
        (*partials)[target_digit * ${rt}u + subgroup_index] = total;
      }
      if (digit == target_digit) { subgroup_prefix = prefix; }
    }
    workgroupBarrier();

    if (valid) {
      var preceding_subgroups = 0u;
      for (var subgroup = 0u; subgroup < subgroup_index; subgroup++) {
        preceding_subgroups += (*partials)[digit * ${rt}u + subgroup];
      }
      let destination = (*block_bases)[digit]
        + (*local_digit_counts)[digit]
        + preceding_subgroups
        + subgroup_prefix;
      (*records_out)[destination] = record;
    }
    workgroupBarrier();

    if (lane < ${M}u) {
      var batch_total = 0u;
      for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
        batch_total += (*partials)[lane * ${rt}u + subgroup];
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
function ca(n) {
  return (
    /* wgsl */
    `
fn radix_workgroup_histogram_${n}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records: ptr<storage, array<vec2<u32>>, read>,
  block_histograms: ptr<storage, array<u32>, read_write>,
  histogram: ptr<workgroup, array<atomic<u32>, ${M}>>
) -> u32 {
  if (lane < ${M}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${ot}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${it}u; item++) {
    let position = block_start + item * ${b}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${n}u) & ${M - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${M}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`
  );
}
const la = (
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
  scratch: ptr<workgroup, array<u32, ${b}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${H}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${it}u; item++) {
    let block = chunk_start + item * ${b}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${b / 2}u;
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
function ua(n) {
  return (
    /* wgsl */
    `
fn radix_workgroup_scatter_${n}(
  lane: u32,
  block_index: u32,
  block_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  records_in: ptr<storage, array<vec2<u32>>, read>,
  records_out: ptr<storage, array<vec2<u32>>, read_write>,
  block_prefixes: ptr<storage, array<u32>, read>,
  block_bases: ptr<workgroup, array<u32, ${M}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${M}>>,
  shared_digits: ptr<workgroup, array<u32, ${b}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${M * (b / 32)}>>
) -> u32 {
  let block_start = block_index * ${ot}u;
  let count = (*state)[0].x;
  let words_per_digit = ${b / 32}u;
  if (lane < ${M}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${it}u; item++) {
    let position = block_start + item * ${b}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${M}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${n}u) & ${M - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${M * (b / 32)}u) {
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

    if (lane < ${M}u) {
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
class Ss {
  constructor(t, e, s, i, r, a) {
    this.renderer = t, this.label = e, this.capacity = s, this.buffers = i, this.dispatch = r, this.backend = a, this.maxRadixBlocks = Math.ceil(s / ot), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / H), this.blockHistograms = this.attributes.createUint(
      `3dgs.${e}-radix-histograms`,
      this.maxRadixBlocks * M
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${e}-radix-prefixes`,
      this.maxRadixBlocks * M
    ), this.reduced = this.attributes.createUint(
      `3dgs.${e}-radix-reduced`,
      this.maxReduceChunks * M
    );
    const o = y(r.state, "uvec4", 1).toReadOnly(), c = y(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), l = I(
      a === "subgroup" ? ra : la
    ), u = {
      lane: gt,
      group_id: Y,
      block_stride: m(this.maxRadixBlocks),
      chunk_stride: m(this.maxReduceChunks),
      state: o,
      block_histograms: c,
      reduced: y(this.reduced, "uint", this.reduced.count)
    };
    a === "subgroup" ? (u.subgroup_index = de, u.subgroup_lane = pe, u.subgroup_size = fe, u.partials = $("uint", rt)) : u.scratch = $("uint", b), this.reduceNode = l(u).computeKernel([b]).setName(`3DGS ${e} radix reduce WGSL`);
    const d = I(aa);
    this.scanReducedNode = d({
      chunk_stride: m(this.maxReduceChunks),
      state: o,
      reduced: y(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${e} radix global scan WGSL`);
    const h = I(
      na
    );
    this.scanAddNode = h({
      lane: gt,
      group_id: Y,
      block_stride: m(this.maxRadixBlocks),
      chunk_stride: m(this.maxReduceChunks),
      state: o,
      block_histograms: c,
      reduced: y(this.reduced, "uint", this.reduced.count).toReadOnly(),
      block_prefixes: y(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ),
      scratch: $("uint", H)
    }).computeKernel([b]).setName(`3DGS ${e} radix scan-add WGSL`), this.sortedRecords = i.recordsA;
  }
  renderer;
  label;
  capacity;
  buffers;
  dispatch;
  backend;
  sortedRecords;
  attributes = new ct();
  blockHistograms;
  blockPrefixes;
  reduced;
  reduceNode;
  scanReducedNode;
  scanAddNode;
  maxRadixBlocks;
  maxReduceChunks;
  passes = [];
  configure(t) {
    this.disposePasses();
    const e = Math.ceil(Math.max(0, t) / Ce);
    this.passes = Array.from(
      { length: e },
      (s, i) => this.createPass(i, i * Ce)
    ), this.sortedRecords = e % 2 === 0 ? this.buffers.recordsA : this.buffers.recordsB;
  }
  get passCount() {
    return this.passes.length;
  }
  encode(t = !1) {
    for (const e of this.passes)
      this.renderer.compute(e.histogram, this.dispatch.radixBlock), this.renderer.compute(this.reduceNode, this.dispatch.radixReduce), this.renderer.compute(this.scanReducedNode), this.renderer.compute(this.scanAddNode, this.dispatch.radixReduce), this.renderer.compute(e.scatter, this.dispatch.radixBlock);
  }
  dispose() {
    this.disposePasses(), this.reduceNode.dispose(), this.scanReducedNode.dispose(), this.scanAddNode.dispose(), this.attributes.dispose();
  }
  createPass(t, e) {
    const s = t % 2 === 0, i = s ? this.buffers.recordsA : this.buffers.recordsB, r = s ? this.buffers.recordsB : this.buffers.recordsA, a = y(this.dispatch.state, "uvec4", 1).toReadOnly(), o = y(
      i,
      "uvec2",
      this.capacity
    ).toReadOnly(), c = I(
      this.backend === "subgroup" ? ia(e) : ca(e)
    ), l = {
      lane: gt,
      block_index: Y.x,
      block_stride: m(this.maxRadixBlocks),
      state: a,
      records: o,
      block_histograms: y(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (l.subgroup_index = de, l.subgroup_lane = pe, l.subgroup_size = fe, l.partials = $(
      "uint",
      M * rt
    )) : l.histogram = $("atomic<u32>", M);
    const u = c(l).computeKernel([b]).setName(`3DGS ${this.label} radix histogram WGSL ${t}`), d = I(
      this.backend === "subgroup" ? oa(e) : ua(e)
    ), h = {
      lane: gt,
      block_index: Y.x,
      block_stride: m(this.maxRadixBlocks),
      state: a,
      records_in: o,
      records_out: y(r, "uvec2", this.capacity),
      block_prefixes: y(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: $("uint", M),
      local_digit_counts: $("uint", M)
    };
    this.backend === "subgroup" ? (h.subgroup_index = de, h.subgroup_lane = pe, h.subgroup_size = fe, h.partials = $(
      "uint",
      M * rt
    )) : (h.shared_digits = $("uint", b), h.shared_digit_masks = $(
      "uint",
      M * (b / 32)
    ));
    const p = d(h).computeKernel([b]).setName(`3DGS ${this.label} radix scatter WGSL ${t}`);
    return { histogram: u, scatter: p };
  }
  disposePasses() {
    for (const t of this.passes)
      t.histogram.dispose(), t.scatter.dispose();
    this.passes = [];
  }
}
const ha = (
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
function da(n) {
  return (
    /* wgsl */
    `
fn find_tile_boundaries_${n}(
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
  scratch: ptr<workgroup, array<u32, ${G}>>
) -> u32 {
  let base = group_id * ${G}u;
  let first_local = lane;
  let second_local = lane + ${b}u;
  let first_source = base + (${G - 1}u - first_local);
  let second_source = base + (${G - 1}u - second_local);
  var first_value = 0xffffffffu;
  var second_value = 0xffffffffu;
  if (first_source < length) { first_value = (*values)[first_source]; }
  if (second_source < length) { second_value = (*values)[second_source]; }
  (*scratch)[first_local] = first_value;
  (*scratch)[second_local] = second_value;
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${G / 2}u;
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
    (*block_mins)[group_id] = (*scratch)[${G - 1}u];
    (*scratch)[${G - 1}u] = 0xffffffffu;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${G / 2}u;
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
    let next_block = index / ${G}u + 1u;
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
class ma {
  attributes = new ct();
  levels = [];
  constructor(t, e) {
    const s = I(pa), i = I(fa);
    let r = t, a = e;
    for (; ; ) {
      const o = this.levels.length, c = Math.ceil(a / G), l = this.attributes.createUint(
        `3dgs.tile-offset-mins-${o}`,
        c
      ), u = s({
        lane: gt,
        group_id: Y.x,
        length: m(a),
        values: y(r, "uint", a),
        block_mins: y(l, "uint", c),
        scratch: $("uint", G)
      }).computeKernel([b]).setName(`3DGS tile offset suffix scan WGSL ${o}`);
      if (this.levels.push({
        length: a,
        blockCount: c,
        values: r,
        scanNode: u
      }), c <= 1) break;
      r = l, a = c;
    }
    for (let o = 0; o < this.levels.length - 1; o++) {
      const c = this.levels[o], l = this.levels[o + 1];
      c.addNode = i({
        index: Z,
        length: m(c.length),
        block_count: m(l.length),
        values: y(c.values, "uint", c.length),
        block_suffix_mins: y(
          l.values,
          "uint",
          l.length
        ).toReadOnly()
      }).compute(c.length, [b]).setName(`3DGS tile add suffix block mins WGSL ${o}`);
    }
  }
  encode(t) {
    for (const e of this.levels)
      t.compute(e.scanNode, [e.blockCount, 1, 1]);
    for (let e = this.levels.length - 2; e >= 0; e--)
      t.compute(this.levels[e].addNode);
  }
  dispose() {
    for (const t of this.levels)
      t.scanNode.dispose(), t.addNode?.dispose();
    this.attributes.dispose();
  }
}
class ga {
  constructor(t, e, s, i, r) {
    this.renderer = t, this.dispatch = r, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const a = y(this.offsets, "uint", s + 1), o = I(ha);
    this.clearNode = o({
      index: Z,
      tile_count: m(s),
      state: y(r.state, "uvec4", 1).toReadOnly(),
      offsets: a
    }).compute(s + 1, [b]).setName("3DGS clear tile offsets WGSL");
    const c = I(
      da(e)
    );
    this.boundariesNode = c({
      index: Z,
      tile_count: m(s),
      state: y(r.state, "uvec4", 1).toReadOnly(),
      records: y(
        i,
        "uvec2",
        i.count
      ).toReadOnly(),
      offsets: a
    }).computeKernel([b]).setName(`3DGS find tile boundaries WGSL (${e})`), this.suffixMin = new ma(this.offsets, s + 1);
  }
  renderer;
  dispatch;
  offsets;
  attributes = new ct();
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
const Cs = (
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
), ya = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${b}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class xa {
  constructor(t, e, s, i, r, a, o, c, l, u, d, h, p, g, w, f, x, C = !1, S = 1e-4, _ = 0.95) {
    this.renderer = t, this.gaussianCount = e, this.intersectionCapacity = s, this.mode = i, this.meansAttribute = r, this.projectedMeanAttribute = a, this.projectedConicAttribute = o, this.projectedColorAttribute = c, this.sortedRecordsAttribute = l, this.tileOffsetsAttribute = u, this.colorTexture = d, this.depthTexture = h, this.frame = p, this.maxSplatsPerTile = g, this.rasterChunkSize = w, this.tileCount = f, this.transmittanceThreshold = S, this.depthAlphaThreshold = _, this.metrics = C ? this.attributes.createUint("3dgs.raster-work", f * 4) : null;
    const v = this.metrics === null ? null : y(this.metrics, "uint", f * 4).toAtomic();
    this.clearMetrics = v === null ? null : te(() => {
      Si(v.element(Z), m(0));
    })().compute(f * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(x);
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
  depthAlphaThreshold;
  attributes = new ct();
  chunks;
  computeNode = null;
  chunkComputeNode = null;
  compositeNode = null;
  metrics;
  clearMetrics;
  rebuild(t) {
    for (const r of [
      t.rasterPixelValueNode,
      t.rasterBreakNode,
      t.rasterColorNode,
      t.rasterAlphaNode,
      t.rasterDiscardNode
    ])
      $s(r, Je, "raster");
    zt(
      t.rasterPixelValueNode,
      Gs,
      "rasterPixelValueNode"
    ), zt(
      t.rasterBreakNode,
      xr,
      "rasterBreakNode"
    );
    const e = this.createRasterNode(t, "direct"), s = this.chunks === null ? null : this.createRasterNode(t, "chunk"), i = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = e, this.chunkComputeNode = s, this.compositeNode = i;
  }
  encode(t, e) {
    if (this.clearMetrics !== null && this.renderer.compute(this.clearMetrics), this.computeNode === null)
      throw new Error("TileRasterizer has no compute node");
    if (this.chunks === null) {
      this.renderer.compute(this.computeNode, [t, e, 1]);
      return;
    }
    if (this.chunkComputeNode === null || this.compositeNode === null)
      throw new Error("TileRasterizer has no chunk compute nodes");
    this.renderer.compute(this.chunks.countNode), this.chunks.offsets.encode(this.renderer), this.renderer.compute(this.chunks.prepareNode), this.renderer.compute(this.chunks.emitNode), this.renderer.compute(this.computeNode, [t, e, 1]), this.renderer.compute(this.chunkComputeNode, this.chunks.dispatch), this.renderer.compute(this.compositeNode, [t, e, 1]);
  }
  dispose() {
    this.clearMetrics?.dispose(), this.computeNode?.dispose(), this.computeNode = null, this.chunkComputeNode?.dispose(), this.chunkComputeNode = null, this.compositeNode?.dispose(), this.compositeNode = null, this.chunks?.countNode.dispose(), this.chunks?.prepareNode.dispose(), this.chunks?.emitNode.dispose(), this.chunks?.offsets.dispose(), this.attributes.dispose();
  }
  createChunkSchedule() {
    if (this.rasterChunkSize === null) return null;
    const t = qs(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), e = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Me(
      e,
      this.tileCount,
      "raster-chunks"
    ), i = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      t,
      2
    ), r = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), a = t * b, o = this.depthTexture === null ? 1 : 2, c = this.attributes.createFloat(
      "3dgs.raster-chunk-partials",
      a * o
    ), l = y(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = y(e, "uint", this.tileCount), d = y(
      e,
      "uint",
      this.tileCount
    ).toReadOnly(), h = y(
      s.output,
      "uint",
      this.tileCount
    ).toReadOnly(), g = I(Lr)({
      tile: Z,
      tile_count: m(this.tileCount),
      chunk_size: m(this.rasterChunkSize),
      sample_limit: m(this.maxSplatsPerTile ?? 0),
      tile_offsets: l,
      chunk_counts: u
    }).compute(this.tileCount, [b]).setName("3DGS count exact raster chunks WGSL"), f = I(
      Pr
    )({
      tile_count: m(this.tileCount),
      task_capacity: m(t),
      chunk_counts: d,
      chunk_offsets: h,
      dispatch: y(r, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), C = I(Ir)({
      tile: Z,
      tile_count: m(this.tileCount),
      task_capacity: m(t),
      chunk_counts: d,
      chunk_offsets: h,
      tasks: y(i, "uvec2", t)
    }).compute(this.tileCount, [b]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: e,
      offsets: s,
      tasks: i,
      dispatch: r,
      partialData: c,
      partialStride: o,
      countNode: g,
      prepareNode: f,
      emitNode: C
    };
  }
  createRasterNode(t, e) {
    const s = this.metrics === null ? null : y(this.metrics, "uint", this.tileCount * 4).toAtomic(), i = y(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), r = y(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), a = y(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), o = y(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), c = y(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), l = y(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = $("vec4", b), d = $("vec4", b), h = $("vec4", b), p = $("uint", b), g = $("uint", b), w = $("uint", 8), f = e === "direct" ? Se(this.colorTexture) : null, x = I(Cs), C = I(ya), S = this.chunks, _ = e === "chunk" && S !== null ? y(S.tasks, "uvec2", S.tasks.count).toReadOnly() : null, v = e === "chunk" && S !== null ? y(S.partialData, "vec4", S.partialData.count) : null, { frame: k } = this;
    return te(() => {
      const L = m(gt), A = x({ value: L }), U = x({ value: L.shiftRight(1) }), j = m(Y.x), N = (e === "direct" ? Y.y.mul(k.tilesX).add(Y.x) : _.element(j).x).toVar("rasterTile"), V = e === "chunk" ? _.element(j).y : m(0), Q = e === "direct" ? Y.x : N.mod(k.tilesX), yt = e === "direct" ? Y.y : N.div(k.tilesX), J = Kt(
        Q.mul(m(T)).add(A),
        yt.mul(m(T)).add(U)
      ).toVar("rasterPixelCoordinateValue"), tt = J.x.lessThan(m(k.viewport.x)).and(J.y.lessThan(m(k.viewport.y))).toVar("rasterActivePixel"), Dt = l.element(N), xt = l.element(N.add(1)), bt = m(xt.sub(Dt)), lt = bt.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const B = m(this.maxSplatsPerTile);
        lt.assign(pt(bt.lessThan(B), bt, B));
      }
      let et = m(0);
      const F = lt.toVar("rasterSampleEnd");
      if (e === "direct" && this.rasterChunkSize !== null)
        F.assign(
          pt(
            lt.greaterThan(m(this.rasterChunkSize)),
            m(0),
            lt
          )
        );
      else if (e === "chunk") {
        et = V.mul(m(this.rasterChunkSize)).toVar("rasterSampleStart");
        const B = et.add(m(this.rasterChunkSize));
        F.assign(
          pt(B.lessThan(lt), B, lt)
        );
      }
      const wt = ft(J).add(0.5), Lt = /* @__PURE__ */ new Map([
        [Ue, () => J],
        [Fe, () => wt],
        [We, () => wt.div(k.viewport.xy)]
      ]), jt = O(0).toVar("rasterPixelValue");
      R(tt, () => {
        jt.assign(
          qt(t.rasterPixelValueNode, Lt)
        );
      });
      const _t = ee(0).toVar("accumulated"), dt = O(1).toVar("transmittance"), at = O(0).toVar("weightedViewDepth"), vt = Bt(!1).toVar("done"), Pt = s === null ? null : m(0).toVar("rasterChecked"), kt = s === null ? null : m(0).toVar("rasterBlended");
      Ft(
        {
          start: et,
          end: F,
          type: "uint",
          condition: "<",
          update: `+= ${b}`
        },
        ({ i: B }) => {
          const It = B.add(L);
          R(It.lessThan(F), () => {
            let D = It;
            this.maxSplatsPerTile !== null && (D = m(
              ke(
                O(It).add(0.5).mul(O(bt)).div(O(lt))
              )
            ));
            const W = Dt.add(D).toVar("rasterSourceRecordIndex"), st = c.element(W).y, q = r.element(st), X = a.element(st);
            u.element(L).assign(q), d.element(L).assign(K(X.xyz, q.w.mul(255).log())), h.element(L).assign(o.element(st)), p.element(L).assign(st);
          }), R(L.equal(0), () => {
            g.element(m(0)).assign(
              pt(
                B.add(m(b)).lessThan(F),
                m(1),
                m(0)
              )
            );
          });
          const Vt = C({ values: g }).toVar("hasNextBatch"), At = m(F.sub(B)), Zt = pt(
            At.lessThan(m(b)),
            At,
            m(b)
          );
          R(tt.and(vt.not()), () => {
            Ft(
              {
                start: m(0),
                end: Zt,
                type: "uint",
                condition: "<"
              },
              ({ i: D }) => {
                Pt?.addAssign(1);
                const W = u.element(D), st = p.element(D), q = wt.sub(W.xy), X = new Map(Lt);
                X.set(qe, () => jt), X.set(ce, () => st), X.set(
                  Ve,
                  () => m(i.element(st).w)
                ), X.set(Ye, () => W.xy), X.set(He, () => q), X.set(Ke, () => W.z);
                const St = qt(
                  t.rasterBreakNode,
                  X
                );
                R(St, () => {
                  vt.assign(Bt(!0)), Wt();
                });
                const Qt = d.element(D), ut = Qt.xyz, Et = ut.x.mul(q.x.mul(q.x)).add(ut.y.mul(2).mul(q.x).mul(q.y)).add(ut.z.mul(q.y.mul(q.y))).mul(-0.5);
                R(
                  Et.greaterThan(0).or(Et.lessThan(Qt.w.negate())),
                  () => {
                    me();
                  }
                );
                const Nt = Mt(us(ut.x, 1e-12)), le = ut.y.div(Nt), Qs = Mt(us(ut.z.sub(le.mul(le)), 1e-12)), ts = ft(
                  Nt.mul(q.x).add(le.mul(q.y)),
                  Qs.mul(q.y)
                ), ue = new Map([
                  ...X,
                  [Ts, () => ts],
                  [Bs, () => ts.div(6).add(0.5)],
                  [
                    Xe,
                    () => h.element(D).xyz
                  ],
                  [Ze, () => W.w],
                  [Qe, () => Et],
                  [Os, () => Is(Et)]
                ]), Js = qt(t.rasterDiscardNode, ue);
                R(Js, () => {
                  me();
                });
                const he = mt(
                  qt(t.rasterAlphaNode, ue),
                  0,
                  0.99
                );
                R(he.lessThan(O(1 / 255)), () => {
                  me();
                });
                const ti = qt(t.rasterColorNode, ue), es = dt.mul(he).toVar("rasterContribution");
                _t.addAssign(ti.mul(es)), at.addAssign(W.z.mul(es)), kt?.addAssign(1), dt.mulAssign(O(1).sub(he)), R(dt.lessThan(this.transmittanceThreshold), () => {
                  vt.assign(Bt(!0)), Wt();
                });
              }
            );
          }), R(Vt.equal(0), () => {
            Wt();
          }), g.element(L).assign(pt(tt.and(vt.not()), m(1), m(0))), hs(), R(L.lessThan(8), () => {
            const D = L.mul(32), W = m(0).toVar("subgroupActive");
            Ft(
              { start: m(0), end: m(32), type: "uint", condition: "<" },
              ({ i: st }) => {
                W.bitOrAssign(
                  g.element(D.add(st))
                );
              }
            ), w.element(L).assign(W);
          }), hs(), R(L.equal(0), () => {
            const D = m(0).toVar("tileActiveReduction");
            Ft(
              { start: m(0), end: m(8), type: "uint", condition: "<" },
              ({ i: W }) => {
                D.bitOrAssign(w.element(m(W)));
              }
            ), g.element(m(0)).assign(D);
          });
          const Rt = C({ values: g });
          R(Rt.equal(0), () => {
            Wt();
          });
        }
      ), R(tt, () => {
        if (s !== null) {
          const B = N.mul(4);
          Tt(s.element(B), Pt), Tt(s.element(B.add(1)), kt), e === "direct" && R(bt.greaterThan(0).and(F.greaterThan(0)), () => {
            Tt(s.element(B.add(2)), m(1)), Tt(
              s.element(B.add(3)),
              pt(
                dt.lessThan(this.transmittanceThreshold),
                m(1),
                m(0)
              )
            );
          });
        }
        if (e === "direct")
          Ms(
            _t,
            dt,
            at,
            J,
            f,
            this.depthTexture,
            k,
            this.depthAlphaThreshold
          );
        else {
          const B = j.mul(m(b)).add(L).mul(m(S.partialStride));
          v.element(B).assign(K(_t, dt)), this.depthTexture !== null && v.element(B.add(1)).assign(K(at, 0, 0, 0));
        }
      });
    })().computeKernel([T, T]).setName(
      e === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const t = this.metrics === null ? null : y(this.metrics, "uint", this.tileCount * 4).toAtomic(), e = this.chunks, s = y(
      e.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), i = y(
      e.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), r = y(
      e.partialData,
      "vec4",
      e.partialData.count
    ).toReadOnly(), a = Se(this.colorTexture), o = I(Cs), { frame: c } = this;
    return te(() => {
      const u = m(gt), d = o({ value: u }), h = o({ value: u.shiftRight(1) }), p = Y.y.mul(c.tilesX).add(Y.x), g = s.element(p), w = Kt(
        Y.x.mul(m(T)).add(d),
        Y.y.mul(m(T)).add(h)
      ), f = w.x.lessThan(m(c.viewport.x)).and(w.y.lessThan(m(c.viewport.y)));
      R(f.and(g.greaterThan(0)), () => {
        const x = ee(0).toVar("chunkCompositeColor"), C = O(1).toVar("chunkCompositeTransmittance"), S = O(0).toVar(
          "chunkCompositeWeightedViewDepth"
        ), _ = i.element(p);
        Ft(
          {
            start: m(0),
            end: g,
            type: "uint",
            condition: "<"
          },
          ({ i: v }) => {
            const k = _.add(v).mul(m(b)).add(u).mul(m(e.partialStride)), E = r.element(k);
            x.addAssign(E.xyz.mul(C)), this.depthTexture !== null && S.addAssign(
              r.element(k.add(1)).x.mul(C)
            ), C.mulAssign(E.w), R(C.lessThan(this.transmittanceThreshold), () => {
              Wt();
            });
          }
        ), Ms(
          x,
          C,
          S,
          w,
          a,
          this.depthTexture,
          c,
          this.depthAlphaThreshold
        ), t !== null && (Tt(t.element(p.mul(4).add(2)), m(1)), Tt(
          t.element(p.mul(4).add(3)),
          pt(
            C.lessThan(this.transmittanceThreshold),
            m(1),
            m(0)
          )
        ));
      });
    })().computeKernel([T, T]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const t = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let e = 0, s = 0, i = 0, r = 0;
    for (let a = 0; a < t.length; a += 4)
      e += t[a], s += t[a + 1], i += t[a + 2], r += t[a + 3];
    return { checked: e, blended: s, pixels: i, alphaStopped: r };
  }
}
function ba(n, t) {
  const e = n.negate();
  return mt(
    t.viewport.z.add(e).mul(t.viewport.w).div(t.viewport.w.sub(t.viewport.z).mul(e)),
    0,
    1
  );
}
function Ms(n, t, e, s, i, r, a, o) {
  const c = mt(O(a.background[3]), 0, 1);
  n.addAssign(
    ee(a.background[0], a.background[1], a.background[2]).mul(t).mul(c)
  );
  const l = O(1).sub(t.mul(O(1).sub(c)));
  if (ds(i, Yt(s), K(n, l)), r !== null) {
    const u = O(1).sub(t), d = u.greaterThan(o).select(
      ba(e.div(u), a),
      O(1)
    );
    ds(
      Se(r),
      Yt(s),
      K(d, 0, 0, 1)
    );
  }
}
function qt(n, t) {
  return n.context({ overrideNodes: t });
}
class wa {
  constructor(t, e, s, i, r, a) {
    this.renderer = t, this.buffers = {
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
    const o = y(
      i,
      "uint",
      s
    ).toReadOnly(), c = I(
      Rr
    );
    this.prepareNode = c({
      gaussian_count: m(s),
      projected_mean: y(
        r,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: o,
      state: y(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: y(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: y(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: y(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const l = I(
      Er(e)
    );
    this.compactNode = l({
      gid: Z,
      gaussian_count: m(s),
      viewport: a,
      visible_offsets: o,
      projected_mean: y(
        r,
        "vec4",
        s
      ).toReadOnly(),
      records: y(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [b]).setName(`3DGS compact visible Gaussians WGSL (${e})`);
  }
  renderer;
  buffers;
  dispatch;
  attributes = new ct();
  prepareNode;
  compactNode;
  encode(t = !1) {
    t ? (this.renderer.compute(this.prepareNode), this.renderer.compute(this.compactNode)) : this.renderer.compute([this.prepareNode, this.compactNode]);
  }
  dispose() {
    this.prepareNode.dispose(), this.compactNode.dispose(), this.attributes.dispose();
  }
}
class _a {
  constructor(t, e, s, i, r, a, o, c, l, u, d, h, p, g, w = 1e-4, f = !1, x = 0.95) {
    this.renderer = t, this.data = s, this.mode = r, this.capacity = o, this.profileKernels = l, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = d, this.subpixelSampleCulling = h, this.radixBackend = p, this.nodes = g, this.rasterTransmittanceThreshold = w, this.rasterStats = f, this.depthAlphaThreshold = x, this.frame = new $r(e, c), this.objects = new Ur(e, i, s.count), this.projection = new Xr(
      s,
      this.frame,
      this.objects,
      a,
      g,
      h
    ), this.profileDiagnostics = l || f ? new sa(
      t,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new Me(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new wa(
      t,
      r,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Ss(
      t,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      p
    ), this.depthSorter.configure(r === "float32" ? 32 : 16), this.orderedTiles = new Tr(
      t,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Me(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new Vr(
      t,
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
    ), this.sorter = new Ss(
      t,
      "tile",
      o,
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
  depthAlphaThreshold;
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
  prepareFrame(t, e, s, i) {
    if (this.frame.update(t, e, this.tilesX, this.tilesY), this.objects.update(), (t !== this.width || e !== this.height) && this.rebuildTileStages(t, e, s, i), this.tileOffsets === null || this.rasterizer === null)
      throw new Error("TiledGaussianPipeline failed to create tile stages");
  }
  render() {
    if (this.tileOffsets === null || this.rasterizer === null)
      throw new Error(
        "TiledGaussianPipeline must be prepared before rendering"
      );
    this.projection.encode(this.renderer), this.profileDiagnostics?.encode(), this.visibleScan.encode(this.renderer), this.visible.encode(), this.depthSorter.encode(this.profileKernels), this.orderedTiles.encode(), this.scan.encode(this.renderer), this.intersections.encode(), this.sorter.encode(this.profileKernels), this.tileOffsets.encode(), this.rasterizer.encode(this.tilesX, this.tilesY);
  }
  rebuildProjection(t) {
    this.projection.rebuild(t);
  }
  rebuildRasterizer(t) {
    this.rasterizer?.rebuild(t);
  }
  async readStats() {
    if (this.profileDiagnostics === null || this.tileOffsets === null)
      return this.intersections.readStats();
    const [t, e, s] = await Promise.all([
      this.intersections.readStats(),
      this.profileDiagnostics.readStats(this.tileOffsets.offsets),
      this.rasterizer?.readWorkStats() ?? Promise.resolve(null)
    ]);
    return {
      ...t,
      profile: { ...e, rasterWork: s }
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
  rebuildTileStages(t, e, s, i) {
    const r = Math.ceil(t / T), a = Math.ceil(e / T), o = r * a;
    if (r > 65535 || a > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const c = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, o + 1)))
    );
    this.sorter.configure(c), this.tileOffsets = new ga(
      this.renderer,
      this.mode,
      o,
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
      o,
      this.nodes,
      this.rasterStats,
      this.rasterTransmittanceThreshold,
      this.depthAlphaThreshold
    ), this.width = t, this.height = e, this.tilesX = r, this.tilesY = a, this.frame.update(t, e, r, a), this.tileStageRebuilds++;
  }
}
function va(n, t) {
  if (n !== "auto" && n !== "subgroup" && n !== "workgroup")
    throw new RangeError(
      'radixBackend must be "auto", "subgroup", or "workgroup"'
    );
  if (n === "subgroup" && !t)
    throw new Error(
      'radixBackend "subgroup" requires the WebGPU "subgroups" feature'
    );
  return n === "auto" ? t ? "subgroup" : "workgroup" : n;
}
const _e = new xi();
class ka extends is {
  gaussianStore;
  redrawStrategy;
  depthSortMode;
  antialiasMode;
  background;
  outputDepth;
  depthAlphaThreshold;
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
  nodeSlots = yr();
  dirtyStages = 0;
  frameDirty = !0;
  successfulRenderCount = 0;
  cachedFrameCount = 0;
  autoSnapshot = null;
  pipelineDevice = null;
  disposed = !1;
  unsubscribeStore = null;
  constructor(t, e, s, i = {}) {
    super(is.COLOR, new Le(), e, {
      type: rs,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const r = i.depthSortMode ?? "float32", a = i.antialiasMode ?? "compensated", o = i.redrawStrategy ?? "always", c = i.radixBackend ?? "auto";
    if (a !== "compensated" && a !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    if (o !== "always" && o !== "auto" && o !== "never")
      throw new RangeError(
        'redrawStrategy must be "always", "auto", or "never"'
      );
    const l = va(
      c,
      t.hasFeature("subgroups")
    ), u = i.intersectionCapacity ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (u !== null && u > b * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const d = i.maxRasterizedSplatsPerTile ?? null;
    if (d !== null && (!Number.isInteger(d) || d <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const h = i.rasterChunkSize === void 0 ? zr : i.rasterChunkSize;
    if (Ar(
      h,
      u ?? b * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = t, this.gaussianStore = s, this.unsubscribeStore = s.subscribe(() => this.invalidate()), this.redrawStrategy = o, this.depthSortMode = r, this.antialiasMode = a, this.requestedIntersectionCapacity = u, this.background = i.background ?? [0, 0, 0, 0], this.outputDepth = i.outputDepth ?? !1, this.depthAlphaThreshold = i.depthAlphaThreshold ?? 0.95, !Number.isFinite(this.depthAlphaThreshold) || this.depthAlphaThreshold < 0 || this.depthAlphaThreshold > 1)
      throw new RangeError("depthAlphaThreshold must be finite and in [0, 1]");
    if (this.colorSpace = i.colorSpace ?? pi, this.profileKernels = i.profileKernels ?? !1, this.rasterStats = i.rasterStats ?? !1, this.rasterTransmittanceThreshold = i.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = d, this.rasterChunkSize = h, this.subpixelSampleCulling = i.subpixelSampleCulling ?? !0, this.radixBackend = l, this.renderTarget.texture.dispose(), this.colorTexture = new as(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = rs, this.colorTexture.colorSpace = fi, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new as(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = mi, this.depthTexture.type = gi, this.depthTexture.minFilter = ns, this.depthTexture.magFilter = ns, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
  }
  /** Resolved after the first render when omitted from GaussianPassOptions. */
  get intersectionCapacity() {
    return this.requestedIntersectionCapacity ?? this.resolvedIntersectionCapacity;
  }
  getTexture(t) {
    if (t === "output") return this.colorTexture;
    if (t === "depth") {
      if (this.depthTexture === null)
        throw new Error(
          'GaussianPass depth output is disabled. Pass { outputDepth: true } and request getTextureNode("depth") again.'
        );
      return this.depthTexture;
    }
    return super.getTexture(t);
  }
  setSize(t, e) {
    const s = this.renderTarget.width, i = this.renderTarget.height;
    super.setSize(t, e), this.depthTexture?.setSize(
      this.renderTarget.width,
      this.renderTarget.height,
      1
    ), (s !== this.renderTarget.width || i !== this.renderTarget.height) && (this.frameDirty = !0);
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
    return this.workingColorNode ??= Ci(
      this.getTextureNode("output"),
      this.colorSpace
    ), this.workingColorNode;
  }
  setup(t) {
    const e = super.setup(t);
    if (e == null)
      throw new Error("GaussianPass color output node is unavailable");
    return this.getColorNode();
  }
  get gaussianPositionLocalNode() {
    return this.nodeSlots.gaussianPositionLocalNode;
  }
  set gaussianPositionLocalNode(t) {
    this.setProjectionNode("gaussianPositionLocalNode", t);
  }
  get gaussianPositionWorldNode() {
    return this.nodeSlots.gaussianPositionWorldNode;
  }
  set gaussianPositionWorldNode(t) {
    this.setProjectionNode("gaussianPositionWorldNode", t);
  }
  get gaussianScaleNode() {
    return this.nodeSlots.gaussianScaleNode;
  }
  set gaussianScaleNode(t) {
    this.setProjectionNode("gaussianScaleNode", t);
  }
  get gaussianRotationNode() {
    return this.nodeSlots.gaussianRotationNode;
  }
  set gaussianRotationNode(t) {
    this.setProjectionNode("gaussianRotationNode", t);
  }
  get gaussianOpacityNode() {
    return this.nodeSlots.gaussianOpacityNode;
  }
  set gaussianOpacityNode(t) {
    this.setProjectionNode("gaussianOpacityNode", t);
  }
  get gaussianColorNode() {
    return this.nodeSlots.gaussianColorNode;
  }
  set gaussianColorNode(t) {
    this.setProjectionNode("gaussianColorNode", t);
  }
  get gaussianVisibilityNode() {
    return this.nodeSlots.gaussianVisibilityNode;
  }
  set gaussianVisibilityNode(t) {
    this.setProjectionNode("gaussianVisibilityNode", t);
  }
  get rasterColorNode() {
    return this.nodeSlots.rasterColorNode;
  }
  get rasterPixelValueNode() {
    return this.nodeSlots.rasterPixelValueNode;
  }
  set rasterPixelValueNode(t) {
    this.setRasterNode("rasterPixelValueNode", t);
  }
  get rasterBreakNode() {
    return this.nodeSlots.rasterBreakNode;
  }
  set rasterBreakNode(t) {
    this.setRasterNode("rasterBreakNode", t);
  }
  set rasterColorNode(t) {
    this.setRasterNode("rasterColorNode", t);
  }
  get rasterAlphaNode() {
    return this.nodeSlots.rasterAlphaNode;
  }
  set rasterAlphaNode(t) {
    this.setRasterNode("rasterAlphaNode", t);
  }
  get rasterDiscardNode() {
    return this.nodeSlots.rasterDiscardNode;
  }
  set rasterDiscardNode(t) {
    this.setRasterNode("rasterDiscardNode", t);
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
  set needsUpdate(t) {
    super.needsUpdate = t, t && (this.dirtyStages |= 3, this.invalidateAutomatically());
  }
  updateBefore(t) {
    const e = t.renderer;
    if (e === null)
      throw new Error("GaussianPass received a NodeFrame without a renderer");
    if (this.disposed) throw new Error("GaussianPass has been disposed");
    if (e !== this.ownerRenderer)
      throw new Error(
        "GaussianPass must be rendered by the WebGPURenderer passed to its constructor"
      );
    if (!(this.camera instanceof yi))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    e.getDrawingBufferSize(_e);
    const s = Math.max(1, Math.floor(_e.x)), i = Math.max(1, Math.floor(_e.y)), r = this.getResolutionScale(), a = Math.max(1, Math.floor(s * r)), o = Math.max(
      1,
      Math.floor(i * r)
    );
    (this.renderTarget.width !== a || this.renderTarget.height !== o) && this.setSize(s, i);
    const c = Sa(e);
    if (this.gaussianStore.setFrontendCapabilities({
      maxStorageBufferBindingSize: c.limits.maxStorageBufferBindingSize,
      maxBufferSize: c.limits.maxBufferSize,
      maxStorageBuffersPerShaderStage: c.limits.maxStorageBuffersPerShaderStage,
      supportsPartialBufferUpdates: !0
    }), this.pipelineDevice !== null && this.pipelineDevice !== c && (this.pipeline?.dispose(), this.pipeline = null, this.pipelineLayoutVersion = -1, this.frameDirty = !0, this.autoSnapshot = null), this.redrawStrategy === "never" && !this.frameDirty && this.pipeline !== null) {
      this.cachedFrameCount++;
      return;
    }
    if (!this.gaussianStore.hasPackedData) return;
    const l = this.gaussianStore.updateLod(this.camera);
    this.redrawStrategy === "auto" && this.autoInputsChanged(a, o) && (this.frameDirty = !0);
    const u = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      b * 65535,
      Math.max(1, u.count * 16)
    )), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), u.count > b * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new _a(
        e,
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
        this.rasterStats,
        this.depthAlphaThreshold
      ), this.pipelineDevice = c, this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0, this.frameDirty = !0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.redrawStrategy !== "always" && !this.frameDirty) {
      this.cachedFrameCount++;
      return;
    }
    if (e.initRenderTarget(this.renderTarget), this.pipeline.prepareFrame(
      a,
      o,
      this.colorTexture,
      this.depthTexture
    ), this.pipeline.render(), this.frameDirty = !1, this.successfulRenderCount++, this.redrawStrategy === "auto" && (this.autoSnapshot = this.captureAutoSnapshot(a, o)), this.debugListeners.size > 0) {
      const d = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: l
      };
      for (const h of this.debugListeners) h(d);
    }
  }
  /** Subscribe to allocation, LOD and CPU-side pass diagnostics. */
  subscribeDebug(t) {
    return this.debugListeners.add(t), () => this.debugListeners.delete(t);
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
    this.disposed || (this.disposed = !0, this.unsubscribeStore?.(), this.unsubscribeStore = null, this.pipeline?.dispose(), this.pipeline = null, this.pipelineDevice = null, this.frameDirty = !0, this.autoSnapshot = null, this.debugListeners.clear(), this.depthTexture?.dispose(), super.dispose());
  }
  setProjectionNode(t, e) {
    Ls(e, t), this.nodeSlots[t] !== e && (this.nodeSlots[t] = e, this.invalidateProjection());
  }
  setRasterNode(t, e) {
    Ls(e, t), this.nodeSlots[t] !== e && (this.nodeSlots[t] = e, this.invalidateRasterizer());
  }
  invalidateAutomatically() {
    this.redrawStrategy === "auto" && (this.frameDirty = !0);
  }
  autoInputsChanged(t, e) {
    const s = this.autoSnapshot;
    if (s === null) return !0;
    const i = this.camera;
    if (i.updateWorldMatrix(!0, !1), s.width !== t || s.height !== e || s.cameraNear !== i.near || s.cameraFar !== i.far || s.cameraLayers !== i.layers.mask || s.storeContentVersion !== this.gaussianStore.contentVersion || !ve(
      s.projectionMatrix,
      i.projectionMatrix.elements
    ) || !ve(
      s.cameraMatrixWorldInverse,
      i.matrixWorldInverse.elements
    ) || s.clouds.length !== this.gaussianStore.clouds.length)
      return !0;
    for (let r = 0; r < s.clouds.length; r++) {
      const a = s.clouds[r], o = this.gaussianStore.clouds[r];
      if (o.updateWorldMatrix(!0, !1), a.cloud !== o || a.visible !== zs(o, i) || !ve(a.matrixWorld, o.matrixWorld.elements))
        return !0;
    }
    return !1;
  }
  captureAutoSnapshot(t, e) {
    const s = this.camera;
    return s.updateWorldMatrix(!0, !1), {
      width: t,
      height: e,
      cameraNear: s.near,
      cameraFar: s.far,
      cameraLayers: s.layers.mask,
      projectionMatrix: [...s.projectionMatrix.elements],
      cameraMatrixWorldInverse: [...s.matrixWorldInverse.elements],
      storeContentVersion: this.gaussianStore.contentVersion,
      clouds: this.gaussianStore.clouds.map((i) => (i.updateWorldMatrix(!0, !1), {
        cloud: i,
        visible: zs(i, s),
        matrixWorld: [...i.matrixWorld.elements]
      }))
    };
  }
}
function ve(n, t) {
  for (let e = 0; e < 16; e++)
    if (n[e] !== t[e]) return !1;
  return !0;
}
function zs(n, t) {
  if (!n.layers.test(t.layers)) return !1;
  let e = n, s = n;
  for (; e !== null; ) {
    if (!e.visible) return !1;
    s = e, e = e.parent;
  }
  return s instanceof Le;
}
function Ls(n, t) {
  if (n?.isNode !== !0)
    throw new TypeError(`GaussianPass.${t} must be a Three.js Node`);
}
function Sa(n) {
  const t = n.backend;
  if (t.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return t.device;
}
function Ba(n, t, e, s) {
  return new ka(n, t, e, s);
}
export {
  Wi as DistanceAwareRadialLodPackingStrategy,
  zi as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  fr as GaussianCloud,
  Mi as GaussianData,
  ie as GaussianLod,
  Ea as GaussianLodColorHelper,
  gs as GaussianLodNode,
  se as GaussianOctree,
  Ai as GaussianOctreeNode,
  ka as GaussianPass,
  be as GaussianRaycastIndex,
  Ta as GaussianStore,
  Cr as GaussianStoreAttributes,
  Sr as GaussianStorePackedAttribute,
  Ra as LodHelper,
  Yi as MaximumLodPackingStrategy,
  Aa as OctreeHelper,
  As as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Hi as RadialLodPackingStrategy,
  fs as SerialRequestScheduler,
  Ia as StreamingGaussianBackend,
  kr as StreamingLodPackingStrategy,
  Xi as TieredRadialLodPackingStrategy,
  pr as WorkerStreamingGaussianBackend,
  Ti as createLoadCloudCommand,
  Bi as createLoadCloudFromBufferCommand,
  Ui as createSetCameraCommand,
  $i as createSetCloudPackingCommand,
  Gi as createSetCloudPriorityCommand,
  ji as createSetCloudRaycastableCommand,
  Di as createSetCloudTransformCommand,
  Fi as createSetFrontendCapabilitiesCommand,
  Oi as createUnloadCloudCommand,
  Vi as createWriteAttributeRangeCommand,
  Ne as gaussianColor,
  Re as gaussianIndex,
  Ee as gaussianObjectId,
  Te as gaussianObjectMatrix,
  Be as gaussianObjectVisible,
  oe as gaussianOpacity,
  Ba as gaussianPass,
  re as gaussianPositionLocal,
  Xt as gaussianPositionWorld,
  je as gaussianProjectedArea,
  De as gaussianProjectedSigma,
  ne as gaussianRotation,
  ae as gaussianScale,
  Ns as gaussianScreenBoundsMax,
  Es as gaussianScreenBoundsMin,
  $e as gaussianScreenPosition,
  Ge as gaussianViewDepth,
  Oe as gaussianViewDirection,
  Na as isStreamingLodPackingStrategy,
  Li as packShRgb8e8,
  Ye as rasterGaussianCenter,
  Xe as rasterGaussianColor,
  Ts as rasterGaussianCoord,
  ce as rasterGaussianIndex,
  Ze as rasterGaussianOpacity,
  Ve as rasterObjectId,
  Ue as rasterPixelCoordinate,
  He as rasterPixelDelta,
  qe as rasterPixelValue,
  Qe as rasterPower,
  Fe as rasterScreenPosition,
  We as rasterScreenUV,
  Bs as rasterUV,
  Ke as rasterViewDepth,
  Os as rasterWeight,
  Pa as shBytesPerCoefficient,
  La as unpackShRgb8e8
};
