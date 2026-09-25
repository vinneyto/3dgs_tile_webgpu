import { StorageBufferAttribute as Dt, Vector3 as N, Quaternion as hr, Box3 as ne, Object3D as Is, Matrix4 as Ft, Ray as dr, LineSegments as pr, BufferGeometry as gr, Float32BufferAttribute as fr, LineBasicMaterial as mr, BoxGeometry as yr, MeshBasicMaterial as xr, DoubleSide as br, InstancedMesh as vr, Color as wr, IndirectStorageBufferAttribute as _r, Vector4 as Nr, Scene as Ee, PassNode as as, HalfFloatType as os, SRGBColorSpace as Sr, StorageTexture as ls, NoColorSpace as Tr, RedFormat as Cr, FloatType as Mr, NearestFilter as us, PerspectiveCamera as kr, Vector2 as Ar } from "three/webgpu";
import { property as R, bool as Bt, exp as Os, float as G, storage as y, uint as f, vec3 as ie, mix as Rr, wgslFn as L, instanceIndex as tt, workgroupArray as j, workgroupId as Z, invocationLocalIndex as xt, uniform as $t, uvec2 as Kt, Fn as re, If as O, Return as pt, vec4 as J, mat4 as cs, normalize as Er, sqrt as Mt, clamp as yt, log as Lr, ceil as hs, vec2 as mt, ivec2 as Xt, int as ds, floor as Ce, subgroupIndex as ge, invocationSubgroupIndex as fe, subgroupSize as me, atomicStore as zr, storageTexture as Me, select as ft, Loop as jt, Break as Wt, Continue as ye, max as ps, workgroupBarrier as gs, atomicAdd as Pt, textureStore as fs, colorSpaceToWorking as Ir } from "three/tsl";
class Ps {
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
const Or = 16, Bs = 4;
function Pr(n, t, e) {
  const s = Math.max(Math.abs(n), Math.abs(t), Math.abs(e));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const r = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), i = 127 / 2 ** r, o = xe(n, i), a = xe(t, i), l = xe(e, i), u = r + 127;
  return (o | a << 8 | l << 16 | u << 24) >>> 0;
}
function An(n) {
  const t = 2 ** ((n >>> 24) - 127) / 127;
  return [
    be(n) * t,
    be(n >>> 8) * t,
    be(n >>> 16) * t
  ];
}
function Ds(n) {
  return n === "rgb8e8" ? Bs : Or;
}
function xe(n, t) {
  return Math.min(127, Math.max(-127, Math.round(n * t))) & 255;
}
function be(n) {
  const t = n & 255;
  return t < 128 ? t : t - 256;
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
}, Br = [
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
class Dr {
  async load(t) {
    const e = await fetch(t);
    if (!e.ok)
      throw new Error(
        `Failed to load PLY: ${e.status} ${e.statusText}`
      );
    return this.parse(await e.arrayBuffer());
  }
  parse(t) {
    const e = Fr(t), s = new Map(
      e.properties.map((p, v) => [p.name, v])
    );
    for (const p of Br)
      if (!s.has(p))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${p}`);
    const r = e.properties.map((p) => p.name.match(/^f_rest_(\d+)$/)?.[1]).filter((p) => p !== void 0).map(Number).sort((p, v) => p - v);
    for (let p = 0; p < r.length; p++)
      if (r[p] !== p)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const i = r.length / 3, o = i + 1, a = Math.sqrt(o);
    if (!Number.isInteger(a) || a < 1 || a > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = Ur(t, e), u = (p) => s.get(p), c = r.map(
      (p) => u(`f_rest_${p}`)
    ), d = e.vertexCount, h = new Float32Array(d * 4), g = new Float32Array(d * 4), m = new Float32Array(d * 4), b = new Float32Array(d * o * 4);
    for (let p = 0; p < d; p++) {
      const v = p * 4;
      h[v] = l(p, u("x")), h[v + 1] = l(p, u("y")), h[v + 2] = l(p, u("z")), g[v] = Math.max(
        Math.exp(l(p, u("scale_0"))),
        1e-6
      ), g[v + 1] = Math.max(
        Math.exp(l(p, u("scale_1"))),
        1e-6
      ), g[v + 2] = Math.max(
        Math.exp(l(p, u("scale_2"))),
        1e-6
      );
      const S = l(p, u("opacity"));
      g[v + 3] = 1 / (1 + Math.exp(-S));
      const T = l(p, u("rot_0")), M = l(p, u("rot_1")), w = l(p, u("rot_2")), C = l(p, u("rot_3")), z = Math.hypot(M, w, C, T);
      z > 1e-12 ? (m[v] = M / z, m[v + 1] = w / z, m[v + 2] = C / z, m[v + 3] = T / z) : m[v + 3] = 1;
      const A = p * o * 4;
      b[A] = l(p, u("f_dc_0")), b[A + 1] = l(p, u("f_dc_1")), b[A + 2] = l(p, u("f_dc_2"));
      for (let _ = 1; _ < o; _++) {
        const I = A + _ * 4, B = _ - 1;
        for (let E = 0; E < 3; E++) {
          const F = c[E * i + B];
          b[I + E] = l(
            p,
            F
          );
        }
      }
    }
    return new Ps(
      {
        means: ee("ply.means", h),
        scalesOpacity: ee("ply.scales-opacity", g),
        rotations: ee("ply.rotations-xyzw", m),
        shCoefficients: ee("ply.sh-coefficients", b)
      },
      {
        count: d,
        shDegree: a - 1,
        ownsBuffers: !0
      }
    );
  }
}
function ee(n, t) {
  const e = new Dt(t, 4);
  return e.name = n, e;
}
function Fr(n) {
  const t = new Uint8Array(n), e = new TextEncoder().encode("end_header");
  let s = -1;
  for (let m = 0; m <= t.length - e.length; m++) {
    let b = !0;
    for (let p = 0; p < e.length; p++)
      if (t[m + p] !== e[p]) {
        b = !1;
        break;
      }
    if (b) {
      s = m;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let r = s + e.length;
  if (t[r] === 13 && r++, t[r] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  r++;
  const o = new TextDecoder().decode(t.subarray(0, r)).split(/\r?\n/);
  if (o[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let a = null, l = "", u = -1, c = 0;
  const d = [], h = [];
  for (const m of o) {
    const b = m.trim().split(/\s+/);
    if (b[0] === "format") {
      if (b[1] !== "ascii" && b[1] !== "binary_little_endian" && b[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${b[1] ?? "unknown"}`);
      a = b[1];
    } else if (b[0] === "element") {
      l = b[1] ?? "";
      const p = Number(b[2]);
      if (!Number.isInteger(p) || p < 0)
        throw new Error(`Invalid element count for ${l}`);
      h.push({ name: l, count: p }), l === "vertex" && (u = p);
    } else if (b[0] === "property" && l === "vertex") {
      if (b[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const p = b[1], v = b[2];
      if (!(p in ms) || v === void 0)
        throw new Error(`Unsupported vertex property: ${m}`);
      d.push({ name: v, type: p, byteOffset: c }), c += ms[p];
    }
  }
  if (a === null) throw new Error("Invalid PLY: format is missing");
  if (u <= 0) throw new Error("PLY must contain at least one vertex");
  if (h.find(
    (m) => m.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: a, vertexCount: u, properties: d, vertexStride: c, dataOffset: r };
}
function Ur(n, t) {
  if (t.format === "ascii") {
    const i = new TextDecoder().decode(
      new Uint8Array(n, t.dataOffset)
    ), o = new Float64Array(
      t.vertexCount * t.properties.length
    );
    let a = 0;
    for (let l = 0; l < o.length; l++) {
      for (; a < i.length && /\s/.test(i[a]); ) a++;
      const u = a;
      for (; a < i.length && !/\s/.test(i[a]); ) a++;
      const c = Number(i.slice(u, a));
      if (!Number.isFinite(c))
        throw new Error(`Invalid ASCII PLY value at scalar ${l}`);
      o[l] = c;
    }
    return (l, u) => o[l * t.properties.length + u];
  }
  if (t.dataOffset + t.vertexCount * t.vertexStride > n.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(n), r = t.format === "binary_little_endian";
  return (i, o) => {
    const a = t.properties[o], l = t.dataOffset + i * t.vertexStride + a.byteOffset;
    return Gr(s, l, a.type, r);
  };
}
function Gr(n, t, e, s) {
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
const Fs = '(function(){"use strict";const wt="srgb",Bn="srgb-linear",Dn="linear",Me="srgb",Ai={TEXTURE_COMPARE:"depthTextureCompare"};function Un(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}const Vn={};function bs(...i){const t="THREE."+i.shift();console.log(t,...i)}function kn(i){const t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]=\'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.\'}return i}function L(...i){i=kn(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function q(...i){i=kn(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function kt(...i){const t=i.join(" ");t in Vn||(Vn[t]=!0,L(...i))}class he{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const s=this._listeners;s[t]===void 0&&(s[t]=[]),s[t].indexOf(e)===-1&&s[t].push(e)}hasEventListener(t,e){const s=this._listeners;return s===void 0?!1:s[t]!==void 0&&s[t].indexOf(e)!==-1}removeEventListener(t,e){const s=this._listeners;if(s===void 0)return;const n=s[t];if(n!==void 0){const r=n.indexOf(e);r!==-1&&n.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const s=e[t.type];if(s!==void 0){t.target=this;const n=s.slice(0);for(let r=0,o=n.length;r<o;r++)n[r].call(this,t);t.target=null}}}const rt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Gn=1234567;const $n=Math.PI/180,Wn=180/Math.PI;function jt(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,s=Math.random()*4294967295|0;return(rt[i&255]+rt[i>>8&255]+rt[i>>16&255]+rt[i>>24&255]+"-"+rt[t&255]+rt[t>>8&255]+"-"+rt[t>>16&15|64]+rt[t>>24&255]+"-"+rt[e&63|128]+rt[e>>8&255]+"-"+rt[e>>16&255]+rt[e>>24&255]+rt[s&255]+rt[s>>8&255]+rt[s>>16&255]+rt[s>>24&255]).toLowerCase()}function O(i,t,e){return Math.max(t,Math.min(e,i))}function zs(i,t){return(i%t+t)%t}function Ci(i,t,e,s,n){return s+(i-t)*(n-s)/(e-t)}function vi(i,t,e){return i!==t?(e-i)/(t-i):0}function _e(i,t,e){return(1-e)*i+e*t}function bi(i,t,e,s){return _e(i,t,1-Math.exp(-e*s))}function zi(i,t=1){return t-Math.abs(zs(i,t*2)-t)}function Fi(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Ri(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Ii(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Li(i,t){return i+Math.random()*(t-i)}function Oi(i){return i*(.5-Math.random())}function Pi(i){i!==void 0&&(Gn=i);let t=Gn+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Bi(i){return i*$n}function Di(i){return i*Wn}function Ui(i){return(i&i-1)===0&&i!==0}function Vi(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function ki(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Gi(i,t,e,s,n){const r=Math.cos,o=Math.sin,a=r(e/2),h=o(e/2),c=r((t+s)/2),l=o((t+s)/2),u=r((t-s)/2),p=o((t-s)/2),d=r((s-t)/2),f=o((s-t)/2);switch(n){case"XYX":i.set(a*l,h*u,h*p,a*c);break;case"YZY":i.set(h*p,a*l,h*u,a*c);break;case"ZXZ":i.set(h*u,h*p,a*l,a*c);break;case"XZX":i.set(a*l,h*f,h*d,a*c);break;case"YXY":i.set(h*d,a*l,h*f,a*c);break;case"ZYZ":i.set(h*f,h*d,a*l,a*c);break;default:L("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function St(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function U(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const $i={DEG2RAD:$n,RAD2DEG:Wn,generateUUID:jt,clamp:O,euclideanModulo:zs,mapLinear:Ci,inverseLerp:vi,lerp:_e,damp:bi,pingpong:zi,smoothstep:Fi,smootherstep:Ri,randInt:Ii,randFloat:Li,randFloatSpread:Oi,seededRandom:Pi,degToRad:Bi,radToDeg:Di,isPowerOfTwo:Ui,ceilPowerOfTwo:Vi,floorPowerOfTwo:ki,setQuaternionFromProperEuler:Gi,normalize:U,denormalize:St},Rn=class Rn{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,s=this.y,n=t.elements;return this.x=n[0]*e+n[3]*s+n[6],this.y=n[1]*e+n[4]*s+n[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=O(this.x,t.x,e.x),this.y=O(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=O(this.x,t,e),this.y=O(this.y,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(O(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(O(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y;return e*e+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const s=Math.cos(e),n=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*s-o*n+t.x,this.y=r*n+o*s+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Rn.prototype.isVector2=!0;let Mt=Rn;class Ee{constructor(t=0,e=0,s=0,n=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=s,this._w=n}static slerpFlat(t,e,s,n,r,o,a){let h=s[n+0],c=s[n+1],l=s[n+2],u=s[n+3],p=r[o+0],d=r[o+1],f=r[o+2],g=r[o+3];if(u!==g||h!==p||c!==d||l!==f){let N=h*p+c*d+l*f+u*g;N<0&&(p=-p,d=-d,f=-f,g=-g,N=-N);let T=1-a;if(N<.9995){const A=Math.acos(N),v=Math.sin(A);T=Math.sin(T*A)/v,a=Math.sin(a*A)/v,h=h*T+p*a,c=c*T+d*a,l=l*T+f*a,u=u*T+g*a}else{h=h*T+p*a,c=c*T+d*a,l=l*T+f*a,u=u*T+g*a;const A=1/Math.sqrt(h*h+c*c+l*l+u*u);h*=A,c*=A,l*=A,u*=A}}t[e]=h,t[e+1]=c,t[e+2]=l,t[e+3]=u}static multiplyQuaternionsFlat(t,e,s,n,r,o){const a=s[n],h=s[n+1],c=s[n+2],l=s[n+3],u=r[o],p=r[o+1],d=r[o+2],f=r[o+3];return t[e]=a*f+l*u+h*d-c*p,t[e+1]=h*f+l*p+c*u-a*d,t[e+2]=c*f+l*d+a*p-h*u,t[e+3]=l*f-a*u-h*p-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,s,n){return this._x=t,this._y=e,this._z=s,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const s=t._x,n=t._y,r=t._z,o=t._order,a=Math.cos,h=Math.sin,c=a(s/2),l=a(n/2),u=a(r/2),p=h(s/2),d=h(n/2),f=h(r/2);switch(o){case"XYZ":this._x=p*l*u+c*d*f,this._y=c*d*u-p*l*f,this._z=c*l*f+p*d*u,this._w=c*l*u-p*d*f;break;case"YXZ":this._x=p*l*u+c*d*f,this._y=c*d*u-p*l*f,this._z=c*l*f-p*d*u,this._w=c*l*u+p*d*f;break;case"ZXY":this._x=p*l*u-c*d*f,this._y=c*d*u+p*l*f,this._z=c*l*f+p*d*u,this._w=c*l*u-p*d*f;break;case"ZYX":this._x=p*l*u-c*d*f,this._y=c*d*u+p*l*f,this._z=c*l*f-p*d*u,this._w=c*l*u+p*d*f;break;case"YZX":this._x=p*l*u+c*d*f,this._y=c*d*u+p*l*f,this._z=c*l*f-p*d*u,this._w=c*l*u-p*d*f;break;case"XZY":this._x=p*l*u-c*d*f,this._y=c*d*u-p*l*f,this._z=c*l*f+p*d*u,this._w=c*l*u+p*d*f;break;default:L("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const s=e/2,n=Math.sin(s);return this._x=t.x*n,this._y=t.y*n,this._z=t.z*n,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,s=e[0],n=e[4],r=e[8],o=e[1],a=e[5],h=e[9],c=e[2],l=e[6],u=e[10],p=s+a+u;if(p>0){const d=.5/Math.sqrt(p+1);this._w=.25/d,this._x=(l-h)*d,this._y=(r-c)*d,this._z=(o-n)*d}else if(s>a&&s>u){const d=2*Math.sqrt(1+s-a-u);this._w=(l-h)/d,this._x=.25*d,this._y=(n+o)/d,this._z=(r+c)/d}else if(a>u){const d=2*Math.sqrt(1+a-s-u);this._w=(r-c)/d,this._x=(n+o)/d,this._y=.25*d,this._z=(h+l)/d}else{const d=2*Math.sqrt(1+u-s-a);this._w=(o-n)/d,this._x=(r+c)/d,this._y=(h+l)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let s=t.dot(e)+1;return s<1e-8?(s=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=s):(this._x=0,this._y=-t.z,this._z=t.y,this._w=s)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=s),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(O(this.dot(t),-1,1)))}rotateTowards(t,e){const s=this.angleTo(t);if(s===0)return this;const n=Math.min(1,e/s);return this.slerp(t,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const s=t._x,n=t._y,r=t._z,o=t._w,a=e._x,h=e._y,c=e._z,l=e._w;return this._x=s*l+o*a+n*c-r*h,this._y=n*l+o*h+r*a-s*c,this._z=r*l+o*c+s*h-n*a,this._w=o*l-s*a-n*h-r*c,this._onChangeCallback(),this}slerp(t,e){let s=t._x,n=t._y,r=t._z,o=t._w,a=this.dot(t);a<0&&(s=-s,n=-n,r=-r,o=-o,a=-a);let h=1-e;if(a<.9995){const c=Math.acos(a),l=Math.sin(c);h=Math.sin(h*c)/l,e=Math.sin(e*c)/l,this._x=this._x*h+s*e,this._y=this._y*h+n*e,this._z=this._z*h+r*e,this._w=this._w*h+o*e,this._onChangeCallback()}else this._x=this._x*h+s*e,this._y=this._y*h+n*e,this._z=this._z*h+r*e,this._w=this._w*h+o*e,this.normalize();return this}slerpQuaternions(t,e,s){return this.copy(t).slerp(e,s)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),s=Math.random(),n=Math.sqrt(1-s),r=Math.sqrt(s);return this.set(n*Math.sin(t),n*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const In=class In{constructor(t=0,e=0,s=0){this.x=t,this.y=e,this.z=s}set(t,e,s){return s===void 0&&(s=this.z),this.x=t,this.y=e,this.z=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Hn.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Hn.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,s=this.y,n=this.z,r=t.elements;return this.x=r[0]*e+r[3]*s+r[6]*n,this.y=r[1]*e+r[4]*s+r[7]*n,this.z=r[2]*e+r[5]*s+r[8]*n,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,s=this.y,n=this.z,r=t.elements,o=1/(r[3]*e+r[7]*s+r[11]*n+r[15]);return this.x=(r[0]*e+r[4]*s+r[8]*n+r[12])*o,this.y=(r[1]*e+r[5]*s+r[9]*n+r[13])*o,this.z=(r[2]*e+r[6]*s+r[10]*n+r[14])*o,this}applyQuaternion(t){const e=this.x,s=this.y,n=this.z,r=t.x,o=t.y,a=t.z,h=t.w,c=2*(o*n-a*s),l=2*(a*e-r*n),u=2*(r*s-o*e);return this.x=e+h*c+o*u-a*l,this.y=s+h*l+a*c-r*u,this.z=n+h*u+r*l-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,s=this.y,n=this.z,r=t.elements;return this.x=r[0]*e+r[4]*s+r[8]*n,this.y=r[1]*e+r[5]*s+r[9]*n,this.z=r[2]*e+r[6]*s+r[10]*n,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=O(this.x,t.x,e.x),this.y=O(this.y,t.y,e.y),this.z=O(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=O(this.x,t,e),this.y=O(this.y,t,e),this.z=O(this.z,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(O(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const s=t.x,n=t.y,r=t.z,o=e.x,a=e.y,h=e.z;return this.x=n*h-r*a,this.y=r*o-s*h,this.z=s*a-n*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const s=t.dot(this)/e;return this.copy(t).multiplyScalar(s)}projectOnPlane(t){return Fs.copy(this).projectOnVector(t),this.sub(Fs)}reflect(t){return this.sub(Fs.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(O(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y,n=this.z-t.z;return e*e+s*s+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,s){const n=Math.sin(e)*t;return this.x=n*Math.sin(s),this.y=Math.cos(e)*t,this.z=n*Math.cos(s),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,s){return this.x=t*Math.sin(e),this.y=s,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),s=this.setFromMatrixColumn(t,1).length(),n=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=s,this.z=n,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,s=Math.sqrt(1-e*e);return this.x=s*Math.cos(t),this.y=e,this.z=s*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};In.prototype.isVector3=!0;let S=In;const Fs=new S,Hn=new Ee,Ln=class Ln{constructor(t,e,s,n,r,o,a,h,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,s,n,r,o,a,h,c)}set(t,e,s,n,r,o,a,h,c){const l=this.elements;return l[0]=t,l[1]=n,l[2]=a,l[3]=e,l[4]=r,l[5]=h,l[6]=s,l[7]=o,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],this}extractBasis(t,e,s){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,n=e.elements,r=this.elements,o=s[0],a=s[3],h=s[6],c=s[1],l=s[4],u=s[7],p=s[2],d=s[5],f=s[8],g=n[0],N=n[3],T=n[6],A=n[1],v=n[4],z=n[7],b=n[2],F=n[5],I=n[8];return r[0]=o*g+a*A+h*b,r[3]=o*N+a*v+h*F,r[6]=o*T+a*z+h*I,r[1]=c*g+l*A+u*b,r[4]=c*N+l*v+u*F,r[7]=c*T+l*z+u*I,r[2]=p*g+d*A+f*b,r[5]=p*N+d*v+f*F,r[8]=p*T+d*z+f*I,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[1],n=t[2],r=t[3],o=t[4],a=t[5],h=t[6],c=t[7],l=t[8];return e*o*l-e*a*c-s*r*l+s*a*h+n*r*c-n*o*h}invert(){const t=this.elements,e=t[0],s=t[1],n=t[2],r=t[3],o=t[4],a=t[5],h=t[6],c=t[7],l=t[8],u=l*o-a*c,p=a*h-l*r,d=c*r-o*h,f=e*u+s*p+n*d;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);const g=1/f;return t[0]=u*g,t[1]=(n*c-l*s)*g,t[2]=(a*s-n*o)*g,t[3]=p*g,t[4]=(l*e-n*h)*g,t[5]=(n*r-a*e)*g,t[6]=d*g,t[7]=(s*h-c*e)*g,t[8]=(o*e-s*r)*g,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,s,n,r,o,a){const h=Math.cos(r),c=Math.sin(r);return this.set(s*h,s*c,-s*(h*o+c*a)+o+t,-n*c,n*h,-n*(-c*o+h*a)+a+e,0,0,1),this}scale(t,e){return kt("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Rs.makeScale(t,e)),this}rotate(t){return kt("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Rs.makeRotation(-t)),this}translate(t,e){return kt("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Rs.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,s,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,s=t.elements;for(let n=0;n<9;n++)if(e[n]!==s[n])return!1;return!0}fromArray(t,e=0){for(let s=0;s<9;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Ln.prototype.isMatrix3=!0;let Ct=Ln;const Rs=new Ct,qn=new Ct().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Yn=new Ct().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Wi(){const i={enabled:!0,workingColorSpace:Bn,spaces:{},convert:function(n,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Me&&(n.r=Lt(n.r),n.g=Lt(n.g),n.b=Lt(n.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(n.applyMatrix3(this.spaces[r].toXYZ),n.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Me&&(n.r=ce(n.r),n.g=ce(n.g),n.b=ce(n.b))),n},workingToColorSpace:function(n,r){return this.convert(n,this.workingColorSpace,r)},colorSpaceToWorking:function(n,r){return this.convert(n,r,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===""?Dn:this.spaces[n].transfer},getToneMappingMode:function(n){return this.spaces[n].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(n,r=this.workingColorSpace){return n.fromArray(this.spaces[r].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,r,o){return n.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(n,r){return kt("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(n,r)},toWorkingColorSpace:function(n,r){return kt("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(n,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],s=[.3127,.329];return i.define({[Bn]:{primaries:t,whitePoint:s,transfer:Dn,toXYZ:qn,fromXYZ:Yn,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:wt},outputColorSpaceConfig:{drawingBufferColorSpace:wt}},[wt]:{primaries:t,whitePoint:s,transfer:Me,toXYZ:qn,fromXYZ:Yn,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:wt}}}),i}const Q=Wi();function Lt(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ce(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let le;class Hi{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let s;if(t instanceof HTMLCanvasElement)s=t;else{le===void 0&&(le=Un("canvas")),le.width=t.width,le.height=t.height;const n=le.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),s=le}return s.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Un("canvas");e.width=t.width,e.height=t.height;const s=e.getContext("2d");s.drawImage(t,0,0,t.width,t.height);const n=s.getImageData(0,0,t.width,t.height),r=n.data;for(let o=0;o<r.length;o++)r[o]=Lt(r[o]/255)*255;return s.putImageData(n,0,0),e}else if(t.data){const e=t.data.slice(0);for(let s=0;s<e.length;s++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[s]=Math.floor(Lt(e[s]/255)*255):e[s]=Lt(e[s]);return{data:e,width:t.width,height:t.height}}else return L("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let qi=0;class Is{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:qi++}),this.uuid=jt(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const s={uuid:this.uuid,url:""},n=this.data;if(n!==null){let r;if(Array.isArray(n)){r=[];for(let o=0,a=n.length;o<a;o++)n[o].isDataTexture?r.push(Ls(n[o].image)):r.push(Ls(n[o]))}else r=Ls(n);s.url=r}return e||(t.images[this.uuid]=s),s}}function Ls(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Hi.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(L("Texture: Unable to serialize Texture."),{})}let Yi=0;const Os=new S;class yt extends he{constructor(t=yt.DEFAULT_IMAGE,e=yt.DEFAULT_MAPPING,s=1001,n=1001,r=1006,o=1008,a=1023,h=1009,c=yt.DEFAULT_ANISOTROPY,l=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Yi++}),this.uuid=jt(),this.name="",this.source=new Is(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=s,this.wrapT=n,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=h,this.offset=new Mt(0,0),this.repeat=new Mt(1,1),this.center=new Mt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ct,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=l,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Os).x}get height(){return this.source.getSize(Os).y}get depth(){return this.source.getSize(Os).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const s=t[e];if(s===void 0){L(`Texture.setValues(): parameter \'${e}\' has value of undefined.`);continue}const n=this[e];if(n===void 0){L(`Texture.setValues(): property \'${e}\' does not exist.`);continue}n&&s&&n.isVector2&&s.isVector2||n&&s&&n.isVector3&&s.isVector3||n&&s&&n.isMatrix3&&s.isMatrix3?n.copy(s):this[e]=s}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const s={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(s.userData=this.userData),e||(t.textures[this.uuid]=s),s}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==300)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case 1e3:t.x=t.x-Math.floor(t.x);break;case 1001:t.x=t.x<0?0:1;break;case 1002:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case 1e3:t.y=t.y-Math.floor(t.y);break;case 1001:t.y=t.y<0?0:1;break;case 1002:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}yt.DEFAULT_IMAGE=null,yt.DEFAULT_MAPPING=300,yt.DEFAULT_ANISOTROPY=1;const On=class On{constructor(t=0,e=0,s=0,n=1){this.x=t,this.y=e,this.z=s,this.w=n}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,s,n){return this.x=t,this.y=e,this.z=s,this.w=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,s=this.y,n=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*s+o[8]*n+o[12]*r,this.y=o[1]*e+o[5]*s+o[9]*n+o[13]*r,this.z=o[2]*e+o[6]*s+o[10]*n+o[14]*r,this.w=o[3]*e+o[7]*s+o[11]*n+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,s,n,r;const h=t.elements,c=h[0],l=h[4],u=h[8],p=h[1],d=h[5],f=h[9],g=h[2],N=h[6],T=h[10];if(Math.abs(l-p)<.01&&Math.abs(u-g)<.01&&Math.abs(f-N)<.01){if(Math.abs(l+p)<.1&&Math.abs(u+g)<.1&&Math.abs(f+N)<.1&&Math.abs(c+d+T-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const v=(c+1)/2,z=(d+1)/2,b=(T+1)/2,F=(l+p)/4,I=(u+g)/4,X=(f+N)/4;return v>z&&v>b?v<.01?(s=0,n=.707106781,r=.707106781):(s=Math.sqrt(v),n=F/s,r=I/s):z>b?z<.01?(s=.707106781,n=0,r=.707106781):(n=Math.sqrt(z),s=F/n,r=X/n):b<.01?(s=.707106781,n=.707106781,r=0):(r=Math.sqrt(b),s=I/r,n=X/r),this.set(s,n,r,e),this}let A=Math.sqrt((N-f)*(N-f)+(u-g)*(u-g)+(p-l)*(p-l));return Math.abs(A)<.001&&(A=1),this.x=(N-f)/A,this.y=(u-g)/A,this.z=(p-l)/A,this.w=Math.acos((c+d+T-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=O(this.x,t.x,e.x),this.y=O(this.y,t.y,e.y),this.z=O(this.z,t.z,e.z),this.w=O(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=O(this.x,t,e),this.y=O(this.y,t,e),this.z=O(this.z,t,e),this.w=O(this.w,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(O(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this.w=t.w+(e.w-t.w)*s,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};On.prototype.isVector4=!0;let Gt=On;class Xn extends he{constructor(t=1,e=1,s={}){super(),s=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},s),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=s.depth,this.scissor=new Gt(0,0,t,e),this.scissorTest=!1,this.viewport=new Gt(0,0,t,e),this.textures=[];const n={width:t,height:e,depth:s.depth},r=new yt(n),o=s.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(s),this.depthBuffer=s.depthBuffer,this.stencilBuffer=s.stencilBuffer,this.resolveDepthBuffer=s.resolveDepthBuffer,this.resolveStencilBuffer=s.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=s.depthTexture,this.samples=s.samples,this.multiview=s.multiview,this.useArrayDepthTexture=s.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let s=0;s<this.textures.length;s++)this.textures[s].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,s=1){if(this.width!==t||this.height!==e||this.depth!==s){this.width=t,this.height=e,this.depth=s;for(let n=0,r=this.textures.length;n<r;n++)this.textures[n].image.width=t,this.textures[n].image.height=e,this.textures[n].image.depth=s,this.textures[n].isData3DTexture!==!0&&(this.textures[n].isArrayTexture=this.textures[n].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,s=t.textures.length;e<s;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const n=Object.assign({},t.textures[e].image);this.textures[e].source=new Is(n)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ms=class Ms{constructor(t,e,s,n,r,o,a,h,c,l,u,p,d,f,g,N){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,s,n,r,o,a,h,c,l,u,p,d,f,g,N)}set(t,e,s,n,r,o,a,h,c,l,u,p,d,f,g,N){const T=this.elements;return T[0]=t,T[4]=e,T[8]=s,T[12]=n,T[1]=r,T[5]=o,T[9]=a,T[13]=h,T[2]=c,T[6]=l,T[10]=u,T[14]=p,T[3]=d,T[7]=f,T[11]=g,T[15]=N,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ms().fromArray(this.elements)}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],e[9]=s[9],e[10]=s[10],e[11]=s[11],e[12]=s[12],e[13]=s[13],e[14]=s[14],e[15]=s[15],this}copyPosition(t){const e=this.elements,s=t.elements;return e[12]=s[12],e[13]=s[13],e[14]=s[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,s){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),s.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(t,e,s){return this.set(t.x,e.x,s.x,0,t.y,e.y,s.y,0,t.z,e.z,s.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,s=t.elements,n=1/ue.setFromMatrixColumn(t,0).length(),r=1/ue.setFromMatrixColumn(t,1).length(),o=1/ue.setFromMatrixColumn(t,2).length();return e[0]=s[0]*n,e[1]=s[1]*n,e[2]=s[2]*n,e[3]=0,e[4]=s[4]*r,e[5]=s[5]*r,e[6]=s[6]*r,e[7]=0,e[8]=s[8]*o,e[9]=s[9]*o,e[10]=s[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,s=t.x,n=t.y,r=t.z,o=Math.cos(s),a=Math.sin(s),h=Math.cos(n),c=Math.sin(n),l=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){const p=o*l,d=o*u,f=a*l,g=a*u;e[0]=h*l,e[4]=-h*u,e[8]=c,e[1]=d+f*c,e[5]=p-g*c,e[9]=-a*h,e[2]=g-p*c,e[6]=f+d*c,e[10]=o*h}else if(t.order==="YXZ"){const p=h*l,d=h*u,f=c*l,g=c*u;e[0]=p+g*a,e[4]=f*a-d,e[8]=o*c,e[1]=o*u,e[5]=o*l,e[9]=-a,e[2]=d*a-f,e[6]=g+p*a,e[10]=o*h}else if(t.order==="ZXY"){const p=h*l,d=h*u,f=c*l,g=c*u;e[0]=p-g*a,e[4]=-o*u,e[8]=f+d*a,e[1]=d+f*a,e[5]=o*l,e[9]=g-p*a,e[2]=-o*c,e[6]=a,e[10]=o*h}else if(t.order==="ZYX"){const p=o*l,d=o*u,f=a*l,g=a*u;e[0]=h*l,e[4]=f*c-d,e[8]=p*c+g,e[1]=h*u,e[5]=g*c+p,e[9]=d*c-f,e[2]=-c,e[6]=a*h,e[10]=o*h}else if(t.order==="YZX"){const p=o*h,d=o*c,f=a*h,g=a*c;e[0]=h*l,e[4]=g-p*u,e[8]=f*u+d,e[1]=u,e[5]=o*l,e[9]=-a*l,e[2]=-c*l,e[6]=d*u+f,e[10]=p-g*u}else if(t.order==="XZY"){const p=o*h,d=o*c,f=a*h,g=a*c;e[0]=h*l,e[4]=-u,e[8]=c*l,e[1]=p*u+g,e[5]=o*l,e[9]=d*u-f,e[2]=f*u-d,e[6]=a*l,e[10]=g*u+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Xi,t,Zi)}lookAt(t,e,s){const n=this.elements;return ft.subVectors(t,e),ft.lengthSq()===0&&(ft.z=1),ft.normalize(),$t.crossVectors(s,ft),$t.lengthSq()===0&&(Math.abs(s.z)===1?ft.x+=1e-4:ft.z+=1e-4,ft.normalize(),$t.crossVectors(s,ft)),$t.normalize(),Xe.crossVectors(ft,$t),n[0]=$t.x,n[4]=Xe.x,n[8]=ft.x,n[1]=$t.y,n[5]=Xe.y,n[9]=ft.y,n[2]=$t.z,n[6]=Xe.z,n[10]=ft.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,n=e.elements,r=this.elements,o=s[0],a=s[4],h=s[8],c=s[12],l=s[1],u=s[5],p=s[9],d=s[13],f=s[2],g=s[6],N=s[10],T=s[14],A=s[3],v=s[7],z=s[11],b=s[15],F=n[0],I=n[4],X=n[8],tt=n[12],lt=n[1],pt=n[5],nt=n[9],at=n[13],Vt=n[2],V=n[6],ae=n[10],_s=n[14],Es=n[3],As=n[7],Cs=n[11],vs=n[15];return r[0]=o*F+a*lt+h*Vt+c*Es,r[4]=o*I+a*pt+h*V+c*As,r[8]=o*X+a*nt+h*ae+c*Cs,r[12]=o*tt+a*at+h*_s+c*vs,r[1]=l*F+u*lt+p*Vt+d*Es,r[5]=l*I+u*pt+p*V+d*As,r[9]=l*X+u*nt+p*ae+d*Cs,r[13]=l*tt+u*at+p*_s+d*vs,r[2]=f*F+g*lt+N*Vt+T*Es,r[6]=f*I+g*pt+N*V+T*As,r[10]=f*X+g*nt+N*ae+T*Cs,r[14]=f*tt+g*at+N*_s+T*vs,r[3]=A*F+v*lt+z*Vt+b*Es,r[7]=A*I+v*pt+z*V+b*As,r[11]=A*X+v*nt+z*ae+b*Cs,r[15]=A*tt+v*at+z*_s+b*vs,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[4],n=t[8],r=t[12],o=t[1],a=t[5],h=t[9],c=t[13],l=t[2],u=t[6],p=t[10],d=t[14],f=t[3],g=t[7],N=t[11],T=t[15],A=h*d-c*p,v=a*d-c*u,z=a*p-h*u,b=o*d-c*l,F=o*p-h*l,I=o*u-a*l;return e*(g*A-N*v+T*z)-s*(f*A-N*b+T*F)+n*(f*v-g*b+T*I)-r*(f*z-g*F+N*I)}determinantAffine(){const t=this.elements,e=t[0],s=t[4],n=t[8],r=t[1],o=t[5],a=t[9],h=t[2],c=t[6],l=t[10];return e*(o*l-a*c)-s*(r*l-a*h)+n*(r*c-o*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,s){const n=this.elements;return t.isVector3?(n[12]=t.x,n[13]=t.y,n[14]=t.z):(n[12]=t,n[13]=e,n[14]=s),this}invert(){const t=this.elements,e=t[0],s=t[1],n=t[2],r=t[3],o=t[4],a=t[5],h=t[6],c=t[7],l=t[8],u=t[9],p=t[10],d=t[11],f=t[12],g=t[13],N=t[14],T=t[15],A=e*a-s*o,v=e*h-n*o,z=e*c-r*o,b=s*h-n*a,F=s*c-r*a,I=n*c-r*h,X=l*g-u*f,tt=l*N-p*f,lt=l*T-d*f,pt=u*N-p*g,nt=u*T-d*g,at=p*T-d*N,Vt=A*at-v*nt+z*pt+b*lt-F*tt+I*X;if(Vt===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const V=1/Vt;return t[0]=(a*at-h*nt+c*pt)*V,t[1]=(n*nt-s*at-r*pt)*V,t[2]=(g*I-N*F+T*b)*V,t[3]=(p*F-u*I-d*b)*V,t[4]=(h*lt-o*at-c*tt)*V,t[5]=(e*at-n*lt+r*tt)*V,t[6]=(N*z-f*I-T*v)*V,t[7]=(l*I-p*z+d*v)*V,t[8]=(o*nt-a*lt+c*X)*V,t[9]=(s*lt-e*nt-r*X)*V,t[10]=(f*F-g*z+T*A)*V,t[11]=(u*z-l*F-d*A)*V,t[12]=(a*tt-o*pt-h*X)*V,t[13]=(e*pt-s*tt+n*X)*V,t[14]=(g*v-f*b-N*A)*V,t[15]=(l*b-u*v+p*A)*V,this}scale(t){const e=this.elements,s=t.x,n=t.y,r=t.z;return e[0]*=s,e[4]*=n,e[8]*=r,e[1]*=s,e[5]*=n,e[9]*=r,e[2]*=s,e[6]*=n,e[10]*=r,e[3]*=s,e[7]*=n,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],s=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],n=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,s,n))}makeTranslation(t,e,s){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,s,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),s=Math.sin(t);return this.set(1,0,0,0,0,e,-s,0,0,s,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,0,s,0,0,1,0,0,-s,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,0,s,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const s=Math.cos(e),n=Math.sin(e),r=1-s,o=t.x,a=t.y,h=t.z,c=r*o,l=r*a;return this.set(c*o+s,c*a-n*h,c*h+n*a,0,c*a+n*h,l*a+s,l*h-n*o,0,c*h-n*a,l*h+n*o,r*h*h+s,0,0,0,0,1),this}makeScale(t,e,s){return this.set(t,0,0,0,0,e,0,0,0,0,s,0,0,0,0,1),this}makeShear(t,e,s,n,r,o){return this.set(1,s,r,0,t,1,o,0,e,n,1,0,0,0,0,1),this}compose(t,e,s){const n=this.elements,r=e._x,o=e._y,a=e._z,h=e._w,c=r+r,l=o+o,u=a+a,p=r*c,d=r*l,f=r*u,g=o*l,N=o*u,T=a*u,A=h*c,v=h*l,z=h*u,b=s.x,F=s.y,I=s.z;return n[0]=(1-(g+T))*b,n[1]=(d+z)*b,n[2]=(f-v)*b,n[3]=0,n[4]=(d-z)*F,n[5]=(1-(p+T))*F,n[6]=(N+A)*F,n[7]=0,n[8]=(f+v)*I,n[9]=(N-A)*I,n[10]=(1-(p+g))*I,n[11]=0,n[12]=t.x,n[13]=t.y,n[14]=t.z,n[15]=1,this}decompose(t,e,s){const n=this.elements;t.x=n[12],t.y=n[13],t.z=n[14];const r=this.determinantAffine();if(r===0)return s.set(1,1,1),e.identity(),this;let o=ue.set(n[0],n[1],n[2]).length();const a=ue.set(n[4],n[5],n[6]).length(),h=ue.set(n[8],n[9],n[10]).length();r<0&&(o=-o),_t.copy(this);const c=1/o,l=1/a,u=1/h;return _t.elements[0]*=c,_t.elements[1]*=c,_t.elements[2]*=c,_t.elements[4]*=l,_t.elements[5]*=l,_t.elements[6]*=l,_t.elements[8]*=u,_t.elements[9]*=u,_t.elements[10]*=u,e.setFromRotationMatrix(_t),s.x=o,s.y=a,s.z=h,this}makePerspective(t,e,s,n,r,o,a=2e3,h=!1){const c=this.elements,l=2*r/(e-t),u=2*r/(s-n),p=(e+t)/(e-t),d=(s+n)/(s-n);let f,g;if(h)f=r/(o-r),g=o*r/(o-r);else if(a===2e3)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===2001)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=p,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=f,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,s,n,r,o,a=2e3,h=!1){const c=this.elements,l=2/(e-t),u=2/(s-n),p=-(e+t)/(e-t),d=-(s+n)/(s-n);let f,g;if(h)f=1/(o-r),g=o/(o-r);else if(a===2e3)f=-2/(o-r),g=-(o+r)/(o-r);else if(a===2001)f=-1/(o-r),g=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=0,c[12]=p,c[1]=0,c[5]=u,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=f,c[14]=g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,s=t.elements;for(let n=0;n<16;n++)if(e[n]!==s[n])return!1;return!0}fromArray(t,e=0){for(let s=0;s<16;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t[e+9]=s[9],t[e+10]=s[10],t[e+11]=s[11],t[e+12]=s[12],t[e+13]=s[13],t[e+14]=s[14],t[e+15]=s[15],t}};Ms.prototype.isMatrix4=!0;let xt=Ms;const ue=new S,_t=new xt,Xi=new S(0,0,0),Zi=new S(1,1,1),$t=new S,Xe=new S,ft=new S,Zn=new xt,jn=new Ee;class Ze{constructor(t=0,e=0,s=0,n=Ze.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=s,this._order=n}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,s,n=this._order){return this._x=t,this._y=e,this._z=s,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,s=!0){const n=t.elements,r=n[0],o=n[4],a=n[8],h=n[1],c=n[5],l=n[9],u=n[2],p=n[6],d=n[10];switch(e){case"XYZ":this._y=Math.asin(O(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-l,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-O(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(h,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(O(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(h,r));break;case"ZYX":this._y=Math.asin(-O(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(p,d),this._z=Math.atan2(h,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(O(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-O(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-l,d),this._y=0);break;default:L("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,s===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,s){return Zn.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Zn,e,s)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return jn.setFromEuler(this),this.setFromQuaternion(jn,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ze.DEFAULT_ORDER="XYZ";class ji{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Ji=0;const Jn=new S,de=new Ee,Ot=new xt,je=new S,Ae=new S,Qi=new S,Ki=new Ee,Qn=new S(1,0,0),Kn=new S(0,1,0),tr=new S(0,0,1),er={type:"added"},to={type:"removed"},pe={type:"childadded",child:null},Ps={type:"childremoved",child:null};class Jt extends he{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ji++}),this.uuid=jt(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Jt.DEFAULT_UP.clone();const t=new S,e=new Ze,s=new Ee,n=new S(1,1,1);function r(){s.setFromEuler(e,!1)}function o(){e.setFromQuaternion(s,void 0,!1)}e._onChange(r),s._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:s},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new xt},normalMatrix:{value:new Ct}}),this.matrix=new xt,this.matrixWorld=new xt,this.matrixAutoUpdate=Jt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ji,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return de.setFromAxisAngle(t,e),this.quaternion.multiply(de),this}rotateOnWorldAxis(t,e){return de.setFromAxisAngle(t,e),this.quaternion.premultiply(de),this}rotateX(t){return this.rotateOnAxis(Qn,t)}rotateY(t){return this.rotateOnAxis(Kn,t)}rotateZ(t){return this.rotateOnAxis(tr,t)}translateOnAxis(t,e){return Jn.copy(t).applyQuaternion(this.quaternion),this.position.add(Jn.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Qn,t)}translateY(t){return this.translateOnAxis(Kn,t)}translateZ(t){return this.translateOnAxis(tr,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Ot.copy(this.matrixWorld).invert())}lookAt(t,e,s){t.isVector3?je.copy(t):je.set(t,e,s);const n=this.parent;this.updateWorldMatrix(!0,!1),Ae.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ot.lookAt(Ae,je,this.up):Ot.lookAt(je,Ae,this.up),this.quaternion.setFromRotationMatrix(Ot),n&&(Ot.extractRotation(n.matrixWorld),de.setFromRotationMatrix(Ot),this.quaternion.premultiply(de.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(q("Object3D.add: object can\'t be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(er),pe.child=t,this.dispatchEvent(pe),pe.child=null):q("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let s=0;s<arguments.length;s++)this.remove(arguments[s]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(to),Ps.child=t,this.dispatchEvent(Ps),Ps.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Ot.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Ot.multiply(t.parent.matrixWorld)),t.applyMatrix4(Ot),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(er),pe.child=t,this.dispatchEvent(pe),pe.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let s=0,n=this.children.length;s<n;s++){const o=this.children[s].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,s=[]){this[t]===e&&s.push(this);const n=this.children;for(let r=0,o=n.length;r<o;r++)n[r].getObjectsByProperty(t,e,s);return s}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ae,t,Qi),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ae,Ki,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let s=0,n=e.length;s<n;s++)e[s].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let s=0,n=e.length;s<n;s++)e[s].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,s=t.y,n=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*s-r[8]*n,r[13]+=s-r[1]*e-r[5]*s-r[9]*n,r[14]+=n-r[2]*e-r[6]*s-r[10]*n}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let s=0,n=e.length;s<n;s++)e[s].updateMatrixWorld(t)}updateWorldMatrix(t,e,s=!1){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||s)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,s=!0),e===!0){const r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,s)}}toJSON(t){const e=t===void 0||typeof t=="string",s={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},s.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),this.static!==!1&&(n.static=this.static),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.pivot!==null&&(n.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(n.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(n.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),n.instanceInfo=this._instanceInfo.map(a=>({...a})),n.availableInstanceIds=this._availableInstanceIds.slice(),n.availableGeometryIds=this._availableGeometryIds.slice(),n.nextIndexStart=this._nextIndexStart,n.nextVertexStart=this._nextVertexStart,n.geometryCount=this._geometryCount,n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.matricesTexture=this._matricesTexture.toJSON(t),n.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(n.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(n.boundingBox=this.boundingBox.toJSON()));function r(a,h){return a[h.uuid]===void 0&&(a[h.uuid]=h.toJSON(t)),h.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const h=a.shapes;if(Array.isArray(h))for(let c=0,l=h.length;c<l;c++){const u=h[c];r(t.shapes,u)}else r(t.shapes,h)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let h=0,c=this.material.length;h<c;h++)a.push(r(t.materials,this.material[h]));n.material=a}else n.material=r(t.materials,this.material);if(this.children.length>0){n.children=[];for(let a=0;a<this.children.length;a++)n.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){n.animations=[];for(let a=0;a<this.animations.length;a++){const h=this.animations[a];n.animations.push(r(t.animations,h))}}if(e){const a=o(t.geometries),h=o(t.materials),c=o(t.textures),l=o(t.images),u=o(t.shapes),p=o(t.skeletons),d=o(t.animations),f=o(t.nodes);a.length>0&&(s.geometries=a),h.length>0&&(s.materials=h),c.length>0&&(s.textures=c),l.length>0&&(s.images=l),u.length>0&&(s.shapes=u),p.length>0&&(s.skeletons=p),d.length>0&&(s.animations=d),f.length>0&&(s.nodes=f)}return s.object=n,s;function o(a){const h=[];for(const c in a){const l=a[c];delete l.metadata,h.push(l)}return h}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let s=0;s<t.children.length;s++){const n=t.children[s];this.add(n.clone())}return this}}Jt.DEFAULT_UP=new S(0,1,0),Jt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const sr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Wt={h:0,s:0,l:0},Je={h:0,s:0,l:0};function Bs(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Ds{constructor(t,e,s){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,s)}set(t,e,s){if(e===void 0&&s===void 0){const n=t;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(t,e,s);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=wt){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Q.colorSpaceToWorking(this,e),this}setRGB(t,e,s,n=Q.workingColorSpace){return this.r=t,this.g=e,this.b=s,Q.colorSpaceToWorking(this,n),this}setHSL(t,e,s,n=Q.workingColorSpace){if(t=zs(t,1),e=O(e,0,1),s=O(s,0,1),e===0)this.r=this.g=this.b=s;else{const r=s<=.5?s*(1+e):s+e-s*e,o=2*s-r;this.r=Bs(o,r,t+1/3),this.g=Bs(o,r,t),this.b=Bs(o,r,t-1/3)}return Q.colorSpaceToWorking(this,n),this}setStyle(t,e=wt){function s(r){r!==void 0&&parseFloat(r)<1&&L("Color: Alpha component of "+t+" will be ignored.")}let n;if(n=/^(\\w+)\\(([^\\)]*)\\)/.exec(t)){let r;const o=n[1],a=n[2];switch(o){case"rgb":case"rgba":if(r=/^\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\\s*(\\d*\\.?\\d+)\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:L("Color: Unknown color model "+t)}}else if(n=/^\\#([A-Fa-f\\d]+)$/.exec(t)){const r=n[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);L("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=wt){const s=sr[t.toLowerCase()];return s!==void 0?this.setHex(s,e):L("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Lt(t.r),this.g=Lt(t.g),this.b=Lt(t.b),this}copyLinearToSRGB(t){return this.r=ce(t.r),this.g=ce(t.g),this.b=ce(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=wt){return Q.workingToColorSpace(it.copy(this),t),Math.round(O(it.r*255,0,255))*65536+Math.round(O(it.g*255,0,255))*256+Math.round(O(it.b*255,0,255))}getHexString(t=wt){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Q.workingColorSpace){Q.workingToColorSpace(it.copy(this),e);const s=it.r,n=it.g,r=it.b,o=Math.max(s,n,r),a=Math.min(s,n,r);let h,c;const l=(a+o)/2;if(a===o)h=0,c=0;else{const u=o-a;switch(c=l<=.5?u/(o+a):u/(2-o-a),o){case s:h=(n-r)/u+(n<r?6:0);break;case n:h=(r-s)/u+2;break;case r:h=(s-n)/u+4;break}h/=6}return t.h=h,t.s=c,t.l=l,t}getRGB(t,e=Q.workingColorSpace){return Q.workingToColorSpace(it.copy(this),e),t.r=it.r,t.g=it.g,t.b=it.b,t}getStyle(t=wt){Q.workingToColorSpace(it.copy(this),t);const e=it.r,s=it.g,n=it.b;return t!==wt?`color(${t} ${e.toFixed(3)} ${s.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(s*255)},${Math.round(n*255)})`}offsetHSL(t,e,s){return this.getHSL(Wt),this.setHSL(Wt.h+t,Wt.s+e,Wt.l+s)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,s){return this.r=t.r+(e.r-t.r)*s,this.g=t.g+(e.g-t.g)*s,this.b=t.b+(e.b-t.b)*s,this}lerpHSL(t,e){this.getHSL(Wt),t.getHSL(Je);const s=_e(Wt.h,Je.h,e),n=_e(Wt.s,Je.s,e),r=_e(Wt.l,Je.l,e);return this.setHSL(s,n,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,s=this.g,n=this.b,r=t.elements;return this.r=r[0]*e+r[3]*s+r[6]*n,this.g=r[1]*e+r[4]*s+r[7]*n,this.b=r[2]*e+r[5]*s+r[8]*n,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const it=new Ds;Ds.NAMES=sr;class Ce{constructor(t=new S(1/0,1/0,1/0),e=new S(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e+=3)this.expandByPoint(Et.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,s=t.count;e<s;e++)this.expandByPoint(Et.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const s=Et.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(s),this.max.copy(t).add(s),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const s=t.geometry;if(s!==void 0){const r=s.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Et):Et.fromBufferAttribute(r,o),Et.applyMatrix4(t.matrixWorld),this.expandByPoint(Et);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Qe.copy(t.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),Qe.copy(s.boundingBox)),Qe.applyMatrix4(t.matrixWorld),this.union(Qe)}const n=t.children;for(let r=0,o=n.length;r<o;r++)this.expandByObject(n[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Et),Et.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,s;return t.normal.x>0?(e=t.normal.x*this.min.x,s=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,s=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,s+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,s+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,s+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,s+=t.normal.z*this.min.z),e<=-t.constant&&s>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ve),Ke.subVectors(this.max,ve),fe.subVectors(t.a,ve),me.subVectors(t.b,ve),ge.subVectors(t.c,ve),Ht.subVectors(me,fe),qt.subVectors(ge,me),Qt.subVectors(fe,ge);let e=[0,-Ht.z,Ht.y,0,-qt.z,qt.y,0,-Qt.z,Qt.y,Ht.z,0,-Ht.x,qt.z,0,-qt.x,Qt.z,0,-Qt.x,-Ht.y,Ht.x,0,-qt.y,qt.x,0,-Qt.y,Qt.x,0];return!Us(e,fe,me,ge,Ke)||(e=[1,0,0,0,1,0,0,0,1],!Us(e,fe,me,ge,Ke))?!1:(ts.crossVectors(Ht,qt),e=[ts.x,ts.y,ts.z],Us(e,fe,me,ge,Ke))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Et).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Et).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Pt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Pt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Pt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Pt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Pt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Pt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Pt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Pt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Pt),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Pt=[new S,new S,new S,new S,new S,new S,new S,new S],Et=new S,Qe=new Ce,fe=new S,me=new S,ge=new S,Ht=new S,qt=new S,Qt=new S,ve=new S,Ke=new S,ts=new S,Kt=new S;function Us(i,t,e,s,n){for(let r=0,o=i.length-3;r<=o;r+=3){Kt.fromArray(i,r);const a=n.x*Math.abs(Kt.x)+n.y*Math.abs(Kt.y)+n.z*Math.abs(Kt.z),h=t.dot(Kt),c=e.dot(Kt),l=s.dot(Kt);if(Math.max(-Math.max(h,c,l),Math.min(h,c,l))>a)return!1}return!0}const j=new S,es=new Mt;let eo=0;class nr extends he{constructor(t,e,s=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:eo++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=s,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,s){t*=this.itemSize,s*=e.itemSize;for(let n=0,r=this.itemSize;n<r;n++)this.array[t+n]=e.array[s+n];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,s=this.count;e<s;e++)es.fromBufferAttribute(this,e),es.applyMatrix3(t),this.setXY(e,es.x,es.y);else if(this.itemSize===3)for(let e=0,s=this.count;e<s;e++)j.fromBufferAttribute(this,e),j.applyMatrix3(t),this.setXYZ(e,j.x,j.y,j.z);return this}applyMatrix4(t){for(let e=0,s=this.count;e<s;e++)j.fromBufferAttribute(this,e),j.applyMatrix4(t),this.setXYZ(e,j.x,j.y,j.z);return this}applyNormalMatrix(t){for(let e=0,s=this.count;e<s;e++)j.fromBufferAttribute(this,e),j.applyNormalMatrix(t),this.setXYZ(e,j.x,j.y,j.z);return this}transformDirection(t){for(let e=0,s=this.count;e<s;e++)j.fromBufferAttribute(this,e),j.transformDirection(t),this.setXYZ(e,j.x,j.y,j.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let s=this.array[t*this.itemSize+e];return this.normalized&&(s=St(s,this.array)),s}setComponent(t,e,s){return this.normalized&&(s=U(s,this.array)),this.array[t*this.itemSize+e]=s,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=St(e,this.array)),e}setX(t,e){return this.normalized&&(e=U(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=St(e,this.array)),e}setY(t,e){return this.normalized&&(e=U(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=St(e,this.array)),e}setZ(t,e){return this.normalized&&(e=U(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=St(e,this.array)),e}setW(t,e){return this.normalized&&(e=U(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,s){return t*=this.itemSize,this.normalized&&(e=U(e,this.array),s=U(s,this.array)),this.array[t+0]=e,this.array[t+1]=s,this}setXYZ(t,e,s,n){return t*=this.itemSize,this.normalized&&(e=U(e,this.array),s=U(s,this.array),n=U(n,this.array)),this.array[t+0]=e,this.array[t+1]=s,this.array[t+2]=n,this}setXYZW(t,e,s,n,r){return t*=this.itemSize,this.normalized&&(e=U(e,this.array),s=U(s,this.array),n=U(n,this.array),r=U(r,this.array)),this.array[t+0]=e,this.array[t+1]=s,this.array[t+2]=n,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==35044&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}}const so=new Ce,be=new S,Vs=new S;class no{constructor(t=new S,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const s=this.center;e!==void 0?s.copy(e):so.setFromPoints(t).getCenter(s);let n=0;for(let r=0,o=t.length;r<o;r++)n=Math.max(n,s.distanceToSquared(t[r]));return this.radius=Math.sqrt(n),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const s=this.center.distanceToSquared(t);return e.copy(t),s>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;be.subVectors(t,this.center);const e=be.lengthSq();if(e>this.radius*this.radius){const s=Math.sqrt(e),n=(s-this.radius)*.5;this.center.addScaledVector(be,n/s),this.radius+=n}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Vs.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(be.copy(t.center).add(Vs)),this.expandByPoint(be.copy(t.center).sub(Vs))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}class ro{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=jt()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,s){t*=this.stride,s*=e.stride;for(let n=0,r=this.stride;n<r;n++)this.array[t+n]=e.array[s+n];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=jt()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),s=new this.constructor(e,this.stride);return s.setUsage(this.usage),s}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=jt()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const ht=new S;class ks{constructor(t,e,s,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=s,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,s=this.data.count;e<s;e++)ht.fromBufferAttribute(this,e),ht.applyMatrix4(t),this.setXYZ(e,ht.x,ht.y,ht.z);return this}applyNormalMatrix(t){for(let e=0,s=this.count;e<s;e++)ht.fromBufferAttribute(this,e),ht.applyNormalMatrix(t),this.setXYZ(e,ht.x,ht.y,ht.z);return this}transformDirection(t){for(let e=0,s=this.count;e<s;e++)ht.fromBufferAttribute(this,e),ht.transformDirection(t),this.setXYZ(e,ht.x,ht.y,ht.z);return this}getComponent(t,e){let s=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(s=St(s,this.array)),s}setComponent(t,e,s){return this.normalized&&(s=U(s,this.array)),this.data.array[t*this.data.stride+this.offset+e]=s,this}setX(t,e){return this.normalized&&(e=U(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=U(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=U(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=U(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=St(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=St(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=St(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=St(e,this.array)),e}setXY(t,e,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=U(e,this.array),s=U(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=s,this}setXYZ(t,e,s,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=U(e,this.array),s=U(s,this.array),n=U(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=s,this.data.array[t+2]=n,this}setXYZW(t,e,s,n,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=U(e,this.array),s=U(s,this.array),n=U(n,this.array),r=U(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=s,this.data.array[t+2]=n,this.data.array[t+3]=r,this}clone(t){if(t===void 0){bs("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let s=0;s<this.count;s++){const n=s*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[n+r])}return new nr(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new ks(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){bs("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let s=0;s<this.count;s++){const n=s*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[n+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class io extends yt{constructor(t,e){super({width:t,height:e}),this.isFramebufferTexture=!0,this.magFilter=1003,this.minFilter=1003,this.generateMipmaps=!1,this.needsUpdate=!0}}class oo extends yt{constructor(t=[],e=301,s,n,r,o,a,h,c,l){super(t,e,s,n,r,o,a,h,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Gs extends yt{constructor(t,e,s=1014,n,r,o,a=1003,h=1003,c,l=1026,u=1){if(l!==1026&&l!==1027)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const p={width:t,height:e,depth:u};super(p,n,r,o,a,h,l,s,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Is(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Pn=class Pn{constructor(t,e,s,n){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,s,n)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let s=0;s<4;s++)this.elements[s]=t[s+e];return this}set(t,e,s,n){const r=this.elements;return r[0]=t,r[2]=e,r[1]=s,r[3]=n,this}};Pn.prototype.isMatrix2=!0;let $s=Pn;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}})),typeof window<"u"&&(window.__THREE__?L("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");const ao=[/^StackTrace\\.js$/,/^TSLCore\\.js$/,/^.*Node\\.js$/,/^three\\.webgpu.*\\.js$/];function ho(i){const t=/(?:at\\s+(.+?)\\s+\\()?(?:(.+?)@)?([^@\\s()]+):(\\d+):(\\d+)/;return i.split(`\n`).map(e=>{const s=e.match(t);if(!s)return null;const n=s[1]||s[2]||"",r=s[3].split("?")[0],o=parseInt(s[4],10),a=parseInt(s[5],10),h=r.split("/").pop();return{fn:n,file:h,line:o,column:a}}).filter(e=>e&&!ao.some(s=>s.test(e.file)))}class At{constructor(t=null){this.isStackTrace=!0,this.stack=ho(t||new Error().stack)}getLocation(){if(this.stack.length===0)return"[Unknown location]";const t=this.stack[0],e=t.fn;return`${e?`"${e}()" at `:""}"${t.file}:${t.line}"`}getError(t){if(this.stack.length===0)return t;const e=this.stack.map(s=>{const n=`${s.file}:${s.line}:${s.column}`;return s.fn?`    at ${s.fn} (${n})`:`    at ${n}`}).join(`\n`);return`${t}\n${e}`}}function Ws(i,t=0){let e=3735928559^t,s=1103547991^t;if(Array.isArray(i))for(let n=0,r;n<i.length;n++)r=i[n],e=Math.imul(e^r,2654435761),s=Math.imul(s^r,1597334677);else for(let n=0,r;n<i.length;n++)r=i.charCodeAt(n),e=Math.imul(e^r,2654435761),s=Math.imul(s^r,1597334677);return e=Math.imul(e^e>>>16,2246822507),e^=Math.imul(s^s>>>13,3266489909),s=Math.imul(s^s>>>16,2246822507),s^=Math.imul(e^e>>>13,3266489909),4294967296*(2097151&s)+(e>>>0)}const rr=i=>Ws(i),co=i=>Ws(i),ir=(...i)=>Ws(i);function ss(i){if(i==null)return null;const t=typeof i;return i.isNode===!0?"node":t==="number"?"float":t==="boolean"?"bool":t==="string"?"string":t==="function"?"shader":i.isVector2===!0?"vec2":i.isVector3===!0?"vec3":i.isVector4===!0?"vec4":i.isMatrix2===!0?"mat2":i.isMatrix3===!0?"mat3":i.isMatrix4===!0?"mat4":i.isColor===!0?"color":i instanceof ArrayBuffer?"ArrayBuffer":null}function Hs(i,...t){const e=i?i.slice(-4):void 0;return t.length===1&&(e==="vec2"?t=[t[0],t[0]]:e==="vec3"?t=[t[0],t[0],t[0]]:e==="vec4"&&(t=[t[0],t[0],t[0],t[0]])),i==="color"?new Ds(...t):e==="vec2"?new Mt(...t):e==="vec3"?new S(...t):e==="vec4"?new Gt(...t):e==="mat2"?new $s(...t):e==="mat3"?new Ct(...t):e==="mat4"?new xt(...t):i==="bool"?t[0]||!1:i==="float"||i==="int"||i==="uint"?t[0]||0:i==="string"?t[0]||"":i==="ArrayBuffer"?uo(t[0]):null}function lo(i){let t="";const e=new Uint8Array(i);for(let s=0;s<e.length;s++)t+=String.fromCharCode(e[s]);return btoa(t)}function uo(i){return Uint8Array.from(atob(i),t=>t.charCodeAt(0)).buffer}const ze={VERTEX:"vertex"},D={NONE:"none",FRAME:"frame",RENDER:"render",OBJECT:"object"},qs={READ_ONLY:"readOnly",WRITE_ONLY:"writeOnly",READ_WRITE:"readWrite"};[...["fragment","vertex"]];const Fe=["x","y","z","w"],po={analyze:"setup",generate:"analyze"};let fo=0;class C extends he{static get type(){return"Node"}constructor(t=null){super(),this.nodeType=t,this.updateType=D.NONE,this.updateBeforeType=D.NONE,this.updateAfterType=D.NONE,this.version=0,this.name="",this.global=!1,this.parents=!1,this.isNode=!0,this._beforeNodes=null,this._cacheKey=null,this._uuid=null,this._cacheKeyVersion=0,this.id=fo++,this.stackTrace=null,C.captureStackTrace===!0&&(this.stackTrace=new At)}set needsUpdate(t){t===!0&&this.version++}get uuid(){return this._uuid===null&&(this._uuid=$i.generateUUID()),this._uuid}get type(){return this.constructor.type}onUpdate(t,e){return this.updateType=e,this.update=t.bind(this),this}onFrameUpdate(t){return this.onUpdate(t,D.FRAME)}onRenderUpdate(t){return this.onUpdate(t,D.RENDER)}onObjectUpdate(t){return this.onUpdate(t,D.OBJECT)}onReference(t){return this.updateReference=t.bind(this),this}updateReference(){return this}isGlobal(){return this.global}*getChildren(){for(const{childNode:t}of this._getChildren())yield t}dispose(){this.dispatchEvent({type:"dispose"})}traverse(t){t(this);for(const e of this.getChildren())e.traverse(t)}_getChildren(t=new Set){const e=[];t.add(this);for(const s of Object.getOwnPropertyNames(this)){const n=this[s];if(!(s.startsWith("_")===!0||t.has(n))){if(Array.isArray(n)===!0)for(let r=0;r<n.length;r++){const o=n[r];o&&o.isNode===!0&&e.push({property:s,index:r,childNode:o})}else if(n&&n.isNode===!0)e.push({property:s,childNode:n});else if(n&&Object.getPrototypeOf(n)===Object.prototype)for(const r in n){if(r.startsWith("_")===!0)continue;const o=n[r];o&&o.isNode===!0&&e.push({property:s,index:r,childNode:o})}}}return e}getCacheKey(t=!1,e=null){if(t=t||this.version!==this._cacheKeyVersion,t===!0||this._cacheKey===null){e===null&&(e=new Set);const s=[];for(const{property:n,childNode:r}of this._getChildren(e))s.push(rr(n.slice(0,-4)),r.getCacheKey(t,e));this._cacheKey=ir(co(s),this.customCacheKey()),this._cacheKeyVersion=this.version}return this._cacheKey}customCacheKey(){return this.id}getScope(){return this}getHash(){return String(this.id)}getUpdateType(){return this.updateType}getUpdateBeforeType(){return this.updateBeforeType}getUpdateAfterType(){return this.updateAfterType}getElementType(t){const e=this.getNodeType(t);return t.getElementType(e)}getMemberType(){return"void"}getNodeType(t,e=null){const s=t.getDataFromNode(this);let n;return e!==null?(s.typeFromOutput=s.typeFromOutput||{},n=s.typeFromOutput[e],n===void 0&&(n=this.generateNodeType(t,e),s.typeFromOutput[e]=n)):(n=s.type,n===void 0&&(n=this.generateNodeType(t),s.type=n)),n}generateNodeType(t,e=null){const s=t.getNodeProperties(this);return s.outputNode?s.outputNode.getNodeType(t,e):this.nodeType}getShared(t){const e=this.getHash(t),s=t.getNodeFromHash(e);let n=null;if(s&&s!==this)n=s;else if(t.context.overrideNodes){const r=t.context.overrideNodes.get(this);if(r){const o=t.getDataFromNode(this);o.isOverwritten!==!0?(o.isOverwritten=!0,n=r(t).overrideNode(this,null),o.sharedNode=n):n=o.sharedNode}}return n||this}getArrayCount(){return null}setup(t){const e=t.getNodeProperties(this);let s=0;for(const n of this.getChildren())e["node"+s++]=n;return e.outputNode||null}analyze(t,e=null){const s=t.increaseUsage(this);if(this.parents===!0){const n=t.getDataFromNode(this,"any");n.stages=n.stages||{},n.stages[t.shaderStage]=n.stages[t.shaderStage]||[],n.stages[t.shaderStage].push(e)}if(s===1){const n=t.getNodeProperties(this);for(const r of Object.values(n))r&&r.isNode===!0&&r.build(t,this)}}generate(t,e){const{outputNode:s}=t.getNodeProperties(this);if(s&&s.isNode===!0)return s.build(t,e)}updateBefore(){L("Abstract function.")}updateAfter(){L("Abstract function.")}update(){L("Abstract function.")}before(t){return this._beforeNodes===null&&(this._beforeNodes=[]),this._beforeNodes.push(t),this}build(t,e=null){const s=this.getShared(t);if(this!==s)return s.build(t,e);if(this._beforeNodes!==null){const h=this._beforeNodes;this._beforeNodes=null;for(const c of h)c.build(t,e);this._beforeNodes=h}const n=t.getDataFromNode(this);n.buildStages=n.buildStages||{},n.buildStages[t.buildStage]=!0;const r=po[t.buildStage];if(r&&n.buildStages[r]!==!0){const h=t.getBuildStage();t.setBuildStage(r),this.build(t),t.setBuildStage(h)}t.addChain(this);let o=null;const a=t.getBuildStage();if(a==="setup"){t.addNode(this),this.updateReference(t);const h=t.getNodeProperties(this);if(h.initialized!==!0){h.initialized=!0,h.outputNode=this.setup(t)||h.outputNode||null;for(const c of Object.values(h))if(c&&c.isNode===!0){if(c.parents===!0){const l=t.getNodeProperties(c);l.parents=l.parents||[],l.parents.push(this)}c.build(t)}t.addSequentialNode(this)}o=h.outputNode}else if(a==="analyze")this.analyze(t,e);else if(a==="generate"){if(this.generate.length<2){const c=this.getNodeType(t),l=t.getDataFromNode(this);o=l.snippet,o===void 0?l.generated===void 0?(l.generated=!0,o=this.generate(t)||"",l.snippet=o):(L("Node: Recursion detected.",this),o="/* Recursion detected. */"):l.flowCodes!==void 0&&t.context.nodeBlock!==void 0&&t.addFlowCodeHierarchy(this,t.context.nodeBlock),o=t.format(o,c,e)}else o=this.generate(t,e)||"";o===""&&e!==null&&e!=="void"&&e!=="OutputType"&&(q(`TSL: Invalid generated code, expected a "${e}".`),o=t.generateConst(e))}return t.removeChain(this),o}getSerializeChildren(){return this._getChildren()}serialize(t){const e=this.getSerializeChildren(),s={};for(const{property:n,index:r,childNode:o}of e)r!==void 0?(s[n]===void 0&&(s[n]=Number.isInteger(r)?[]:{}),s[n][r]=o.toJSON(t.meta).uuid):s[n]=o.toJSON(t.meta).uuid;Object.keys(s).length>0&&(t.inputNodes=s)}deserialize(t){if(t.inputNodes!==void 0){const e=t.meta.nodes;for(const s in t.inputNodes)if(Array.isArray(t.inputNodes[s])){const n=[];for(const r of t.inputNodes[s])n.push(e[r]);this[s]=n}else if(typeof t.inputNodes[s]=="object"){const n={};for(const r in t.inputNodes[s]){const o=t.inputNodes[s][r];n[r]=e[o]}this[s]=n}else{const n=t.inputNodes[s];this[s]=e[n]}}}toJSON(t){const{uuid:e,type:s}=this,n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{},nodes:{}});let r=t.nodes[e];r===void 0&&(r={uuid:e,type:s,meta:t,metadata:{version:4.7,type:"Node",generator:"Node.toJSON"}},n!==!0&&(t.nodes[r.uuid]=r),this.serialize(r),delete r.meta);function o(a){const h=[];for(const c in a){const l=a[c];delete l.metadata,h.push(l)}return h}if(n){const a=o(t.textures),h=o(t.images),c=o(t.nodes);a.length>0&&(r.textures=a),h.length>0&&(r.images=h),c.length>0&&(r.nodes=c)}return r}}C.captureStackTrace=!1;class Re extends C{static get type(){return"ArrayElementNode"}constructor(t,e){super(),this.node=t,this.indexNode=e,this.isArrayElementNode=!0}generateNodeType(t){return this.node.getElementType(t)}getMemberType(t,e){return this.node.getMemberType(t,e)}generate(t){const e=this.indexNode.getNodeType(t),s=this.node.build(t),n=this.indexNode.build(t,!t.isVector(e)&&t.isInteger(e)?e:"uint");return`${s}[ ${n} ]`}}class or extends C{static get type(){return"ConvertNode"}constructor(t,e){super(),this.node=t,this.convertTo=e}generateNodeType(t){const e=this.node.getNodeType(t);let s=null;for(const n of this.convertTo.split("|"))(s===null||t.getTypeLength(e)===t.getTypeLength(n))&&(s=n);return s}serialize(t){super.serialize(t),t.convertTo=this.convertTo}deserialize(t){super.deserialize(t),this.convertTo=t.convertTo}generate(t,e){const s=this.node,n=this.getNodeType(t),r=s.build(t,n);return t.format(r,n,e)}}class et extends C{static get type(){return"TempNode"}constructor(t=null){super(t),this.isTempNode=!0}hasDependencies(t){return t.getDataFromNode(this).usageCount>1}build(t,e){if(t.getBuildStage()==="generate"){const n=t.getVectorType(this.getNodeType(t,e)),r=t.getDataFromNode(this);if(r.propertyName!==void 0)return t.format(r.propertyName,n,e);if(n!=="void"&&e!=="void"&&this.hasDependencies(t)){const o=super.build(t,n),a=t.getVarFromNode(this,null,n),h=t.getPropertyName(a);return t.addLineFlowCode(`${h} = ${o}`,this),r.snippet=o,r.propertyName=h,t.format(r.propertyName,n,e)}}return super.build(t,e)}}class mo extends et{static get type(){return"JoinNode"}constructor(t=[],e=null){super(e),this.nodes=t}generateNodeType(t){return this.nodeType!==null?t.getVectorType(this.nodeType):t.getTypeFromLength(this.nodes.reduce((e,s)=>e+t.getTypeLength(s.getNodeType(t)),0))}generate(t,e){const s=this.getNodeType(t),n=t.getTypeLength(s),r=this.nodes,o=t.getComponentType(s),a=[];let h=0;for(const l of r){if(h>=n){q(`TSL: Length of parameters exceeds maximum length of function \'${s}()\' type.`,this.stackTrace);break}let u=l.getNodeType(t),p=t.getTypeLength(u),d;if(h+p>n&&(q(`TSL: Length of \'${s}()\' data exceeds maximum length of output type.`,this.stackTrace),p=n-h,u=t.getTypeFromLength(p)),h+=p,d=l.build(t,u),t.getComponentType(u)!==o){const g=t.getTypeFromLength(p,o);d=t.format(d,u,g)}a.push(d)}const c=`${t.getType(s)}( ${a.join(", ")} )`;return t.format(c,s,e)}}const go=Fe.join("");class yo extends C{static get type(){return"SplitNode"}constructor(t,e="x"){super(),this.node=t,this.components=e,this.isSplitNode=!0}getVectorLength(){let t=this.components.length;for(const e of this.components)t=Math.max(Fe.indexOf(e)+1,t);return t}getComponentType(t){return t.getComponentType(this.node.getNodeType(t))}generateNodeType(t){return t.getTypeFromLength(this.components.length,this.getComponentType(t))}getScope(){return this.node.getScope()}generate(t,e){const s=this.node,n=t.getTypeLength(s.getNodeType(t));let r=null;if(n>1){let o=null;this.getVectorLength()>=n&&(o=t.getTypeFromLength(this.getVectorLength(),this.getComponentType(t)));const h=s.build(t,o);this.components.length===n&&this.components===go.slice(0,this.components.length)?r=t.format(h,o,e):r=t.format(`${h}.${this.components}`,this.getNodeType(t),e)}else r=s.build(t,e);return r}serialize(t){super.serialize(t),t.components=this.components}deserialize(t){super.deserialize(t),this.components=t.components}}class xo extends et{static get type(){return"SetNode"}constructor(t,e,s){super(),this.sourceNode=t,this.components=e,this.targetNode=s}generateNodeType(t){return this.sourceNode.getNodeType(t)}generate(t){const{sourceNode:e,components:s,targetNode:n}=this,r=this.getNodeType(t),o=t.getComponentType(n.getNodeType(t)),a=t.getTypeFromLength(s.length,o),h=n.build(t,a),c=e.build(t,r),l=t.getTypeLength(r),u=[];for(let p=0;p<l;p++){const d=Fe[p];d===s[0]?(u.push(h),p+=s.length-1):u.push(c+"."+d)}return`${t.getType(r)}( ${u.join(", ")} )`}}class No extends et{static get type(){return"FlipNode"}constructor(t,e){super(),this.sourceNode=t,this.components=e}generateNodeType(t){return this.sourceNode.getNodeType(t)}generate(t){const{components:e,sourceNode:s}=this,n=this.getNodeType(t),r=s.build(t),o=t.getVarFromNode(this),a=t.getPropertyName(o);t.addLineFlowCode(a+" = "+r,this);const h=t.getTypeLength(n),c=[];let l=0;for(let u=0;u<h;u++){const p=Fe[u];p===e[l]?(c.push("1.0 - "+(a+"."+p)),l++):c.push(a+"."+p)}return`${t.getType(n)}( ${c.join(", ")} )`}}class Ys extends C{static get type(){return"InputNode"}constructor(t,e=null){super(e),this.isInputNode=!0,this.value=t,this.precision=null}generateNodeType(){return this.nodeType===null?ss(this.value):this.nodeType}getInputType(t){return this.getNodeType(t)}setPrecision(t){return this.precision=t,this}serialize(t){super.serialize(t),t.value=this.value,this.value&&this.value.toArray&&(t.value=this.value.toArray()),t.valueType=ss(this.value),t.nodeType=this.nodeType,t.valueType==="ArrayBuffer"&&(t.value=lo(t.value)),t.precision=this.precision}deserialize(t){super.deserialize(t),this.nodeType=t.nodeType,this.value=Array.isArray(t.value)?Hs(t.valueType,...t.value):t.value,this.precision=t.precision||null,this.value&&this.value.fromArray&&(this.value=this.value.fromArray(t.value))}generate(){L("Abstract function.")}}const ar=/float|u?int/;class vt extends Ys{static get type(){return"ConstNode"}constructor(t,e=null){super(t,e),this.isConstNode=!0}generateConst(t){return t.generateConst(this.getNodeType(t),this.value)}generate(t,e){const s=this.getNodeType(t);return ar.test(s)&&ar.test(e)?t.generateConst(e,this.value):t.format(this.generateConst(t),s,e)}}class To extends C{static get type(){return"MemberNode"}constructor(t,e){super(),this.structNode=t,this.property=e,this.isMemberNode=!0}hasMember(t){return this.structNode.isMemberNode&&this.structNode.hasMember(t)===!1?!1:this.structNode.getMemberType(t,this.property)!=="void"}generateNodeType(t){return this.hasMember(t)===!1?"float":this.structNode.getMemberType(t,this.property)}getMemberType(t,e){if(this.hasMember(t)===!1)return"float";const s=this.getNodeType(t);return t.getStructTypeNode(s).getMemberType(t,e)}generate(t){if(this.hasMember(t)===!1){L(`TSL: Member "${this.property}" does not exist in struct.`,this.stackTrace);const s=this.getNodeType(t);return t.generateConst(s)}return this.structNode.build(t)+"."+this.property}}let wo=null;const Xs=new Map;function y(i,t){if(Xs.has(i)){L(`TSL: Redefinition of method chaining \'${i}\'.`);return}if(typeof t!="function")throw new Error(`THREE.TSL: Node element ${i} is not a function`);Xs.set(i,t),i!=="assign"&&(C.prototype[i]=function(...e){return this.isStackNode?this.addToStack(t(...e)):t(this,...e)},C.prototype[i+"Assign"]=function(...e){return this.isStackNode?this.assign(e[0],t(...e)):this.assign(t(this,...e))})}const So=i=>i.replace(/r|s/g,"x").replace(/g|t/g,"y").replace(/b|p/g,"z").replace(/a|q/g,"w"),hr=i=>So(i).split("").sort().join("");C.prototype.assign=function(...i){if(this.isStackNode!==!0)return q("TSL: No stack defined for assign operation. Make sure the assign is inside a Fn().",new At),this;{const t=Xs.get("assign");return this.addToStack(t(...i))}},C.prototype.toVarIntent=function(){return this},C.prototype.get=function(i){return new To(this,i)};const Ie={};function ns(i,t,e){Ie[i]=Ie[t]=Ie[e]={get(){this._cache=this._cache||{};let o=this._cache[i];return o===void 0&&(o=new yo(this,i),this._cache[i]=o),o},set(o){this[i].assign(M(o))}};const s=i.toUpperCase(),n=t.toUpperCase(),r=e.toUpperCase();C.prototype["set"+s]=C.prototype["set"+n]=C.prototype["set"+r]=function(o){const a=hr(i);return new xo(this,a,M(o))},C.prototype["flip"+s]=C.prototype["flip"+n]=C.prototype["flip"+r]=function(){const o=hr(i);return new No(this,o)}}const bt=["x","y","z","w"],zt=["r","g","b","a"],Ft=["s","t","p","q"];for(let i=0;i<4;i++){let t=bt[i],e=zt[i],s=Ft[i];ns(t,e,s);for(let n=0;n<4;n++){t=bt[i]+bt[n],e=zt[i]+zt[n],s=Ft[i]+Ft[n],ns(t,e,s);for(let r=0;r<4;r++){t=bt[i]+bt[n]+bt[r],e=zt[i]+zt[n]+zt[r],s=Ft[i]+Ft[n]+Ft[r],ns(t,e,s);for(let o=0;o<4;o++)t=bt[i]+bt[n]+bt[r]+bt[o],e=zt[i]+zt[n]+zt[r]+zt[o],s=Ft[i]+Ft[n]+Ft[r]+Ft[o],ns(t,e,s)}}}for(let i=0;i<32;i++)Ie[i]={get(){this._cache=this._cache||{};let t=this._cache[i];return t===void 0&&(t=new Re(this,new vt(i,"uint")),this._cache[i]=t),t},set(t){this[i].assign(M(t))}};Object.defineProperties(C.prototype,Ie);const Mo=function(i,t=null){const e=ss(i);return e==="node"?i:t===null&&(e==="float"||e==="boolean")||e&&e!=="shader"&&e!=="string"?M(Qs(i,t)):e==="shader"?i.isFn?i:E(i):i},_o=function(i,t=null){for(const e in i)i[e]=M(i[e],t);return i},Eo=function(i,t=null){const e=i.length;for(let s=0;s<e;s++)i[s]=M(i[s],t);return i},cr=function(i,t=null,e=null,s=null){function n(l){return s!==null?(l=M(Object.assign(l,s)),s.intent===!0&&(l=l.toVarIntent())):l=M(l),l}let r,o=t,a,h;function c(l){let u;return o?u=/[a-z]/i.test(o)?o+"()":o:u=i.type,a!==void 0&&l.length<a?(q(`TSL: "${u}" parameter length is less than minimum required.`,new At),l.concat(new Array(a-l.length).fill(0))):h!==void 0&&l.length>h?(q(`TSL: "${u}" parameter length exceeds limit.`,new At),l.slice(0,h)):l}return t===null?r=(...l)=>n(new i(...ye(c(l)))):e!==null?(e=M(e),r=(...l)=>n(new i(t,...ye(c(l)),e))):r=(...l)=>n(new i(t,...ye(c(l)))),r.setParameterLength=(...l)=>(l.length===1?a=h=l[0]:l.length===2&&([a,h]=l),r),r.setName=l=>(o=l,r),r},Ao=function(i,...t){return new i(...ye(t))};class Co extends C{constructor(t,e){super(),this.shaderNode=t,this.rawInputs=e,this.isShaderCallNodeInternal=!0}generateNodeType(t){return this.shaderNode.nodeType||this.getOutputNode(t).getNodeType(t)}getElementType(t){return this.getOutputNode(t).getElementType(t)}getMemberType(t,e){return this.getOutputNode(t).getMemberType(t,e)}call(t){const{shaderNode:e,rawInputs:s}=this,n=t.getNodeProperties(e),r=t.getClosestSubBuild(e.subBuilds)||"",o=r||"default";if(n[o])return n[o];const a=t.subBuildFn,h=t.fnCall;t.subBuildFn=r,t.fnCall=this;let c=null;if(e.layout){if(s){const p=e.layout.inputs;if(lr(s)){const d=s;for(let f=0;f<p.length;f++){const g=d[f];g&&g.isNode&&g.build(t)}}else{const d=s[0];for(const f of p){const g=d[f.name];g&&g.isNode&&g.build(t)}}}const l=t.buildFunctionNode(e);t.addInclude(l);const u=s?vo(s):null;c=l.call(u)}else{const l=new Proxy(t,{get:(g,N,T)=>{let A;return Symbol.iterator===N?A=function*(){yield void 0}:A=Reflect.get(g,N,T),A}}),u=s?bo(s):null,p=Array.isArray(s)?s.length>0:s!==null,d=e.jsFunc,f=p||d.length>1?d(u,l):d(l);c=M(f)}return t.subBuildFn=a,t.fnCall=h,e.once&&(n[o]=c),c}setupOutput(t){return t.addStack(),t.stack.outputNode=this.call(t),t.removeStack()}getOutputNode(t){const e=t.getNodeProperties(this),s=t.getSubBuildOutput(this);return e[s]=e[s]||this.setupOutput(t),e[s].subBuild=t.getClosestSubBuild(this),e[s]}build(t,e=null){let s=null;const n=t.getBuildStage(),r=t.getNodeProperties(this),o=t.getSubBuildOutput(this),a=this.getOutputNode(t),h=t.fnCall;if(t.fnCall=this,n==="setup"){const c=t.getSubBuildProperty("initialized",this);if(r[c]!==!0&&(r[c]=!0,r[o]=this.getOutputNode(t),r[o].build(t),this.shaderNode.subBuilds))for(const l of t.chaining){const u=t.getDataFromNode(l,"any");u.subBuilds=u.subBuilds||new Set;for(const p of this.shaderNode.subBuilds)u.subBuilds.add(p)}s=r[o]}else n==="analyze"?a.build(t,e):n==="generate"&&(s=a.build(t,e)||"");return t.fnCall=h,s}}function lr(i){return i[0]&&(i[0].isNode||Object.getPrototypeOf(i[0])!==Object.prototype)}function vo(i){let t;return Ks(i),lr(i)?t=[...i]:t=i[0],t}function bo(i){let t=0;return Ks(i),new Proxy(i,{get:(e,s,n)=>{let r;if(s==="length")return r=i.length,r;if(Symbol.iterator===s)r=function*(){for(const o of i)yield M(o)};else{if(i.length>0)if(Object.getPrototypeOf(i[0])===Object.prototype){const o=i[0];o[s]===void 0?r=o[t++]:r=Reflect.get(o,s,n)}else i[0]instanceof C&&(i[s]===void 0?r=i[t++]:r=Reflect.get(i,s,n));else r=Reflect.get(e,s,n);r=M(r)}return r}})}class zo extends C{constructor(t,e){super(e),this.jsFunc=t,this.layout=null,this.global=!0,this.once=!1}setLayout(t){return this.layout=t,this}getLayout(){return this.layout}call(t=null){return new Co(this,t)}setup(){return this.call()}}const Fo=[!1,!0],Ro=[0,1,2,3],Io=[-1,-2],ur=[.5,1.5,1/3,1e-6,1e6,Math.PI,Math.PI*2,1/Math.PI,2/Math.PI,1/(Math.PI*2),Math.PI/2],Zs=new Map;for(const i of Fo)Zs.set(i,new vt(i));const js=new Map;for(const i of Ro)js.set(i,new vt(i,"uint"));const Js=new Map([...js].map(i=>new vt(i.value,"int")));for(const i of Io)Js.set(i,new vt(i,"int"));const rs=new Map([...Js].map(i=>new vt(i.value)));for(const i of ur)rs.set(i,new vt(i));for(const i of ur)rs.set(-i,new vt(-i));const is={bool:Zs,uint:js,ints:Js,float:rs},dr=new Map([...Zs,...rs]),Qs=(i,t)=>dr.has(i)?dr.get(i):i.isNode===!0?i:new vt(i,t),J=function(i,t=null){return(...e)=>{for(const n of e)if(n===void 0)return q(`TSL: Invalid parameter for the type "${i}".`,new At),new vt(0,i);if((e.length===0||!["bool","float","int","uint"].includes(i)&&e.every(n=>{const r=typeof n;return r!=="object"&&r!=="function"}))&&(e=[Hs(i,...e)]),e.length===1&&t!==null&&t.has(e[0]))return os(t.get(e[0]));if(e.length===1){const n=Qs(e[0],i);return n.nodeType===i?os(n):os(new or(n,i))}const s=e.map(n=>Qs(n));return os(new mo(s,i))}};function Lo(i){return i&&i.isNode&&i.traverse(t=>{t.isConstNode&&(i=t.value)}),!!i}const Oo=i=>i!=null?i.nodeType||i.convertTo||(typeof i=="string"?i:null):null;function Po(i,t){return new zo(i,t)}const M=(i,t=null)=>Mo(i,t),os=(i,t=null)=>M(i,t).toVarIntent(),Ks=(i,t=null)=>new _o(i,t),ye=(i,t=null)=>new Eo(i,t),K=(i,t=null,e=null,s=null)=>new cr(i,t,e,s),_=(i,...t)=>new Ao(i,...t),w=(i,t=null,e=null,s={})=>new cr(i,t,e,{...s,intent:!0});let Bo=0;class Do extends C{constructor(t,e=null){super();let s=null;e!==null&&(typeof e=="object"?s=e.return:(typeof e=="string"?s=e:q("TSL: Invalid layout type.",new At),e=null)),this.shaderNode=new Po(t,s),e!==null&&this.setLayout(e),this.isFn=!0}setLayout(t){const e=this.shaderNode.nodeType;if(typeof t.inputs!="object"){const s={name:"fn"+Bo++,type:e,inputs:[]};for(const n in t)n!=="return"&&s.inputs.push({name:n,type:t[n]});t=s}return this.shaderNode.setLayout(t),this}generateNodeType(t){return this.shaderNode.getNodeType(t)||"float"}call(...t){const e=this.shaderNode.call(t);return this.shaderNode.nodeType==="void"&&e.toStack(),e.toVarIntent()}once(t=null){return this.shaderNode.once=!0,this.shaderNode.subBuilds=t,this}generate(t){const e=this.getNodeType(t);return q(\'TSL: "Fn()" was declared but not invoked. Try calling it like "Fn()( ...params )".\',this.stackTrace),t.generateConst(e)}}function E(i,t=null){const e=new Do(i,t);return new Proxy(()=>{},{apply(s,n,r){return e.call(...r)},get(s,n,r){return Reflect.get(e,n,r)},set(s,n,r,o){return Reflect.set(e,n,r,o)}})}const ut=(...i)=>wo.If(...i);function Uo(i){return i}y("toStack",Uo);const Vo=new J("color"),P=new J("float",is.float),Le=new J("int",is.ints),st=new J("uint",is.uint),tn=new J("bool",is.bool),Bt=new J("vec2"),pr=new J("ivec2"),fr=new J("uvec2"),ko=new J("bvec2"),R=new J("vec3"),mr=new J("ivec3"),gr=new J("uvec3"),Go=new J("bvec3"),k=new J("vec4"),yr=new J("ivec4"),xr=new J("uvec4"),$o=new J("bvec4"),Nr=new J("mat2"),te=new J("mat3"),Tr=new J("mat4");y("toColor",Vo),y("toFloat",P),y("toInt",Le),y("toUint",st),y("toBool",tn),y("toVec2",Bt),y("toIVec2",pr),y("toUVec2",fr),y("toBVec2",ko),y("toVec3",R),y("toIVec3",mr),y("toUVec3",gr),y("toBVec3",Go),y("toVec4",k),y("toIVec4",yr),y("toUVec4",xr),y("toBVec4",$o),y("toMat2",Nr),y("toMat3",te),y("toMat4",Tr);const Wo=K(Re).setParameterLength(2),Ho=(i,t)=>new or(M(i),t);y("element",Wo),y("convert",Ho),y("append",i=>(L("TSL: .append() has been renamed to .toStack().",new At),i));class xe extends C{static get type(){return"PropertyNode"}constructor(t,e=null,s=!1,n=null){super(t),this.name=e,this.varying=s,this.placeholderNode=M(n),this.isPropertyNode=!0,this.global=!0}getNodeType(t){const e=super.getNodeType(t);return e==="output"?t.getOutputType():e}customCacheKey(){return rr(this.type+":"+(this.name||"")+":"+(this.varying?"1":"0"))}getHash(t){return this.name||super.getHash(t)}generate(t){let e;if(this.varying===!0)e=t.getVaryingFromNode(this,this.name),e.needsInterpolation=!0;else if(e=t.getVarFromNode(this,this.name),this.placeholderNode!==null&&t.hasWriteUsage(this)===!1){const s=this.placeholderNode.build(t,this.getNodeType(t));t.addLineFlowCode(`${t.getPropertyName(e)} = ${s}`,this)}return t.getPropertyName(e)}}const ee=(i,t,e=null)=>new xe(i,t,!1,e),as=(i,t,e=null)=>new xe(i,t,!0,e),wr=_(xe,"vec4","DiffuseColor"),Sr=_(xe,"output","Output"),en=_(xe,"float","dashSize"),Mr=_(xe,"float","gapSize");class _r extends C{static get type(){return"UniformGroupNode"}constructor(t,e=!1,s=1,n=null){super("string"),this.name=t,this.shared=e,this.order=s,this.updateType=n,this.isUniformGroup=!0}update(){this.needsUpdate=!0}serialize(t){super.serialize(t),t.name=this.name,t.version=this.version,t.shared=this.shared}deserialize(t){super.deserialize(t),this.name=t.name,this.version=t.version,this.shared=t.shared}}const qo=(i,t=1,e=null)=>new _r(i,!1,t,e),sn=(i,t=0,e=null)=>new _r(i,!0,t,e);D.FRAME;const ot=sn("render",0,D.RENDER),Yo=qo("object",1,D.OBJECT);class Oe extends Ys{static get type(){return"UniformNode"}constructor(t,e=null){super(t,e),this.isUniformNode=!0,this.name="",this.groupNode=Yo}setName(t){return this.name=t,this}label(t){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\',new At),this.setName(t)}setGroup(t){return this.groupNode=t,this}getGroup(){return this.groupNode}getUniformHash(t){return this.getHash(t)}onUpdate(t,e){return t=t.bind(this),super.onUpdate(s=>{const n=t(s,this);n!==void 0&&(this.value=n)},e)}getInputType(t){let e=super.getInputType(t);return e==="bool"&&(e="uint"),e}generate(t,e){const s=this.getNodeType(t),n=this.getUniformHash(t);let r=t.getNodeFromHash(n);r===void 0&&(t.setHashNode(this,n),r=this);const o=r.getInputType(t),a=t.getUniformFromNode(r,o,t.shaderStage,this.name||t.context.nodeName),h=t.getPropertyName(a);t.context.nodeName!==void 0&&delete t.context.nodeName;let c=h;if(s==="bool"){const l=t.getDataFromNode(this);let u=l.propertyName;if(u===void 0){const p=t.getVarFromNode(this,null,"bool");u=t.getPropertyName(p),l.propertyName=u,c=t.format(h,o,s),t.addLineFlowCode(`${u} = ${c}`,this)}c=u}return t.format(c,s,e)}}const Z=(i,t)=>{const e=Oo(t||i);if(e===i&&(i=Hs(e)),i&&i.isNode===!0){let s=i.value;i.traverse(n=>{n.isConstNode===!0&&(s=n.value)}),i=s}return new Oe(i,e)};class Er extends et{static get type(){return"ArrayNode"}constructor(t,e,s=null){super(t),this.count=e,this.values=s,this.isArrayNode=!0}getArrayCount(){return this.count}generateNodeType(t){return this.nodeType===null?this.values[0].getNodeType(t):this.nodeType}getElementType(t){return this.getNodeType(t)}getMemberType(t,e){return this.nodeType===null?this.values[0].getMemberType(t,e):super.getMemberType(t,e)}generate(t){const e=this.getNodeType(t);return t.generateArray(e,this.count,this.values)}}const Xo=(...i)=>{let t;if(i.length===1){const e=i[0];t=new Er(null,e.length,e)}else{const e=i[0],s=i[1];t=new Er(e,s)}return M(t)};y("toArray",(i,t)=>Xo(Array(t).fill(i)));class Zo extends et{static get type(){return"AssignNode"}constructor(t,e){super(),this.targetNode=t,this.sourceNode=e,this.isAssignNode=!0}hasDependencies(){return!1}generateNodeType(t,e){return e!=="void"?this.targetNode.getNodeType(t):"void"}needsSplitAssign(t){const{targetNode:e}=this;if(t.isAvailable("swizzleAssign")===!1&&e.isSplitNode&&e.components.length>1){const s=t.getTypeLength(e.node.getNodeType(t));return Fe.join("").slice(0,s)!==e.components}return!1}setup(t){const{targetNode:e,sourceNode:s}=this,n=e.getScope(),r=t.getDataFromNode(n);r.assign=!0;const o=t.getNodeProperties(this);o.sourceNode=s,o.targetNode=e.context({assign:!0})}generate(t,e){const{targetNode:s,sourceNode:n}=t.getNodeProperties(this),r=this.needsSplitAssign(t),o=s.build(t),a=s.getNodeType(t),h=n.build(t,a),c=n.getNodeType(t),l=t.getDataFromNode(this);let u;if(l.initialized===!0)e!=="void"&&(u=o);else if(r){const p=t.getVarFromNode(this,null,a),d=t.getPropertyName(p);t.addLineFlowCode(`${d} = ${h}`,this);const f=s.node,N=f.node.context({assign:!0}).build(t);for(let T=0;T<f.components.length;T++){const A=f.components[T];t.addLineFlowCode(`${N}.${A} = ${d}[ ${T} ]`,this)}e!=="void"&&(u=o)}else u=`${o} = ${h}`,(e==="void"||c==="void")&&(t.addLineFlowCode(u,this),e!=="void"&&(u=o));return l.initialized=!0,t.format(u,a,e)}}y("assign",K(Zo).setParameterLength(2));class jo extends et{static get type(){return"FunctionCallNode"}constructor(t=null,e={}){super(),this.functionNode=t,this.parameters=e}setParameters(t){return this.parameters=t,this}getParameters(){return this.parameters}generateNodeType(t){return this.functionNode.getNodeType(t)}getMemberType(t,e){return this.functionNode.getMemberType(t,e)}generate(t){const e=[],s=this.functionNode,n=s.getInputs(t),r=this.parameters,o=(h,c)=>{const l=c.type,u=l==="pointer";let p;return u?p="&"+h.build(t):p=h.build(t,l),p};if(Array.isArray(r)){if(r.length>n.length)q("TSL: The number of provided parameters exceeds the expected number of inputs in \'Fn()\'."),r.length=n.length;else if(r.length<n.length)for(q("TSL: The number of provided parameters is less than the expected number of inputs in \'Fn()\'.");r.length<n.length;)r.push(P(0));for(let h=0;h<r.length;h++)e.push(o(r[h],n[h]))}else for(const h of n){const c=r[h.name];c!==void 0?e.push(o(c,h)):(q(`TSL: Input \'${h.name}\' not found in \'Fn()\'.`),e.push(o(P(0),h)))}return`${s.build(t,"property")}( ${e.join(", ")} )`}}y("call",(i,...t)=>(t=t.length>1||t[0]&&t[0].isNode===!0?ye(t):Ks(t[0]),new jo(M(i),t)));const Jo={"==":"equal","!=":"notEqual","<":"lessThan",">":"greaterThan","<=":"lessThanEqual",">=":"greaterThanEqual","%":"mod"};class H extends et{static get type(){return"OperatorNode"}constructor(t,e,s,...n){if(super(),n.length>0){let r=new H(t,e,s);for(let o=0;o<n.length-1;o++)r=new H(t,r,n[o]);e=r,s=n[n.length-1]}this.op=t,this.aNode=e,this.bNode=s,this.isOperatorNode=!0}getOperatorMethod(t,e){return t.getMethod(Jo[this.op],e)}generateNodeType(t,e=null){const s=this.op,n=this.aNode,r=this.bNode,o=n.getNodeType(t),a=r?r.getNodeType(t):null;if(o==="void"||a==="void")return e||"void";if(s==="%")return o;if(s==="~"||s==="&"||s==="|"||s==="^"||s===">>"||s==="<<")return t.getIntegerType(o);if(s==="&&"||s==="||"||s==="^^")return"bool";if(s==="!"){const h=t.getTypeLength(o);return h>1?`bvec${h}`:"bool"}else if(s==="=="||s==="!="||s==="<"||s===">"||s==="<="||s===">="){const h=Math.max(t.getTypeLength(o),t.getTypeLength(a));return h>1?`bvec${h}`:"bool"}else{if(t.isMatrix(o)){if(a==="float")return o;if(t.isVector(a))return t.getVectorFromMatrix(o);if(t.isMatrix(a))return o}else if(t.isMatrix(a)){if(o==="float")return a;if(t.isVector(o))return t.getVectorFromMatrix(a)}return t.getTypeLength(a)>t.getTypeLength(o)?a:o}}generate(t,e){const s=this.op,{aNode:n,bNode:r}=this,o=this.getNodeType(t,e);let a=null,h=null;o!=="void"?(a=n.getNodeType(t),h=r?r.getNodeType(t):null,s==="<"||s===">"||s==="<="||s===">="||s==="=="||s==="!="?t.isVector(a)?h=a:t.isVector(h)?a=h:a!==h&&(a=h="float"):s===">>"||s==="<<"?(a=o,h=t.changeComponentType(h,"uint")):s==="%"?(a=o,h=t.isInteger(a)&&t.isInteger(h)?h:a):t.isMatrix(a)?h==="float"?h="float":t.isVector(h)?h=t.getVectorFromMatrix(a):t.isMatrix(h)||(a=h=o):t.isMatrix(h)?a==="float"?a="float":t.isVector(a)?a=t.getVectorFromMatrix(h):a=h=o:a=h=o):a=h=o;const c=n.build(t,a),l=r?r.build(t,h):null,u=t.getFunctionOperator(s);if(e!=="void"){const p=t.renderer.coordinateSystem===2e3;if(s==="=="||s==="!="||s==="<"||s===">"||s==="<="||s===">=")return p?t.isVector(a)?t.format(`${this.getOperatorMethod(t,e)}( ${c}, ${l} )`,o,e):t.format(`( ${c} ${s} ${l} )`,o,e):t.format(`( ${c} ${s} ${l} )`,o,e);if(s==="%")return t.isInteger(h)?t.format(`( ${c} % ${l} )`,o,e):t.format(`${this.getOperatorMethod(t,o)}( ${c}, ${l} )`,o,e);if(s==="!")return p&&t.isVector(a)?t.format(`not( ${c} )`,e):t.format(`( ${s} ${c} )`,a,e);if(s==="~")return t.format(`( ${s} ${c} )`,a,e);if(u)return t.format(`${u}( ${c}, ${l} )`,o,e);if(t.isMatrix(a)&&h==="float")return t.format(`( ${l} ${s} ${c} )`,o,e);if(a==="float"&&t.isMatrix(h))return t.format(`${c} ${s} ${l}`,o,e);{let d=`( ${c} ${s} ${l} )`;return!p&&o==="bool"&&t.isVector(a)&&t.isVector(h)&&(d=`all${d}`),t.format(d,o,e)}}else if(a!=="void")return u?t.format(`${u}( ${c}, ${l} )`,o,e):t.isMatrix(a)&&h==="float"?t.format(`${l} ${s} ${c}`,o,e):t.format(`${c} ${s} ${l}`,o,e)}serialize(t){super.serialize(t),t.op=this.op}deserialize(t){super.deserialize(t),this.op=t.op}}const Qo=w(H,"+").setParameterLength(2,1/0).setName("add"),nn=w(H,"-").setParameterLength(2,1/0).setName("sub"),Yt=w(H,"*").setParameterLength(2,1/0).setName("mul"),Ar=w(H,"/").setParameterLength(2,1/0).setName("div"),Cr=w(H,"%").setParameterLength(2).setName("mod"),Ko=w(H,"==").setParameterLength(2).setName("equal"),ta=w(H,"!=").setParameterLength(2).setName("notEqual"),ea=w(H,"<").setParameterLength(2).setName("lessThan"),sa=w(H,">").setParameterLength(2).setName("greaterThan"),na=w(H,"<=").setParameterLength(2).setName("lessThanEqual"),ra=w(H,">=").setParameterLength(2).setName("greaterThanEqual"),ia=w(H,"&&").setParameterLength(2,1/0).setName("and"),oa=w(H,"||").setParameterLength(2,1/0).setName("or"),aa=w(H,"!").setParameterLength(1).setName("not"),ha=w(H,"^^").setParameterLength(2).setName("xor"),ca=w(H,"&").setParameterLength(2).setName("bitAnd"),la=w(H,"~").setParameterLength(1).setName("bitNot"),ua=w(H,"|").setParameterLength(2).setName("bitOr"),da=w(H,"^").setParameterLength(2).setName("bitXor"),pa=w(H,"<<").setParameterLength(2).setName("shiftLeft"),fa=w(H,">>").setParameterLength(2).setName("shiftRight"),ma=E(([i])=>(i.addAssign(1),i)),ga=E(([i])=>(i.subAssign(1),i)),ya=E(([i])=>{const t=Le(i).toConst();return i.addAssign(1),t}),xa=E(([i])=>{const t=Le(i).toConst();return i.subAssign(1),t});y("add",Qo),y("sub",nn),y("mul",Yt),y("div",Ar),y("mod",Cr),y("equal",Ko),y("notEqual",ta),y("lessThan",ea),y("greaterThan",sa),y("lessThanEqual",na),y("greaterThanEqual",ra),y("and",ia),y("or",oa),y("not",aa),y("xor",ha),y("bitAnd",ca),y("bitNot",la),y("bitOr",ua),y("bitXor",da),y("shiftLeft",pa),y("shiftRight",fa),y("incrementBefore",ma),y("decrementBefore",ga),y("increment",ya),y("decrement",xa);class m extends et{static get type(){return"MathNode"}constructor(t,e,s=null,n=null){if(super(),(t===m.MAX||t===m.MIN)&&arguments.length>3){let r=new m(t,e,s);for(let o=3;o<arguments.length-1;o++)r=new m(t,r,arguments[o]);e=r,s=arguments[arguments.length-1],n=null}this.method=t,this.aNode=e,this.bNode=s,this.cNode=n,this.isMathNode=!0}getInputType(t){const e=this.aNode.getNodeType(t),s=this.bNode?this.bNode.getNodeType(t):null,n=this.cNode?this.cNode.getNodeType(t):null,r=t.isMatrix(e)?0:t.getTypeLength(e),o=t.isMatrix(s)?0:t.getTypeLength(s),a=t.isMatrix(n)?0:t.getTypeLength(n);return r>o&&r>a?e:o>a?s:a>r?n:e}generateNodeType(t){const e=this.method;return e===m.LENGTH||e===m.DISTANCE||e===m.DOT?"float":e===m.CROSS?"vec3":e===m.ALL||e===m.ANY?"bool":e===m.EQUALS?t.changeComponentType(this.aNode.getNodeType(t),"bool"):this.getInputType(t)}setup(t){const{aNode:e,bNode:s,method:n}=this;let r=null;if(n===m.ONE_MINUS)r=nn(1,e);else if(n===m.RECIPROCAL)r=Ar(1,e);else if(n===m.DIFFERENCE)r=an(nn(e,s));else if(n===m.TRANSFORM_DIRECTION){let o,a;t.isMatrix(e.getNodeType(t))?(o=e,a=s):(o=s,a=e),r=hs(Yt(o,k(R(a),0)).xyz)}return r!==null?r:super.setup(t)}generate(t,e){if(t.getNodeProperties(this).outputNode)return super.generate(t,e);let n=this.method;const r=this.getNodeType(t),o=this.getInputType(t),a=this.aNode,h=this.bNode,c=this.cNode,l=t.renderer.coordinateSystem;if(n===m.NEGATE)return t.format("( - "+a.build(t,o)+" )",r,e);{const u=[];return n===m.CROSS?u.push(a.build(t,r),h.build(t,r)):l===2e3&&n===m.STEP?u.push(a.build(t,t.getTypeLength(a.getNodeType(t))===1?"float":o),h.build(t,o)):l===2e3&&(n===m.MIN||n===m.MAX)?u.push(a.build(t,o),h.build(t,t.getTypeLength(h.getNodeType(t))===1?"float":o)):n===m.REFRACT?u.push(a.build(t,o),h.build(t,o),c.build(t,"float")):n===m.MIX?u.push(a.build(t,o),h.build(t,o),c.build(t,t.getTypeLength(c.getNodeType(t))===1?"float":o)):(l===2001&&n===m.ATAN&&h!==null&&(n="atan2"),t.shaderStage!=="fragment"&&(n===m.DFDX||n===m.DFDY)&&(L(`TSL: \'${n}\' is not supported in the ${t.shaderStage} stage.`,this.stackTrace),n="/*"+n+"*/"),u.push(a.build(t,o)),h!==null&&u.push(h.build(t,o)),c!==null&&u.push(c.build(t,o))),t.format(`${t.getMethod(n,r)}( ${u.join(", ")} )`,r,e)}}serialize(t){super.serialize(t),t.method=this.method}deserialize(t){super.deserialize(t),this.method=t.method}}m.ALL="all",m.ANY="any",m.RADIANS="radians",m.DEGREES="degrees",m.EXP="exp",m.EXP2="exp2",m.LOG="log",m.LOG2="log2",m.SQRT="sqrt",m.INVERSE_SQRT="inversesqrt",m.FLOOR="floor",m.CEIL="ceil",m.NORMALIZE="normalize",m.FRACT="fract",m.SIN="sin",m.SINH="sinh",m.COS="cos",m.COSH="cosh",m.TAN="tan",m.TANH="tanh",m.ASIN="asin",m.ASINH="asinh",m.ACOS="acos",m.ACOSH="acosh",m.ATAN="atan",m.ATANH="atanh",m.ABS="abs",m.SIGN="sign",m.LENGTH="length",m.NEGATE="negate",m.ONE_MINUS="oneMinus",m.DFDX="dFdx",m.DFDY="dFdy",m.ROUND="round",m.RECIPROCAL="reciprocal",m.TRUNC="trunc",m.FWIDTH="fwidth",m.TRANSPOSE="transpose",m.DETERMINANT="determinant",m.INVERSE="inverse",m.EQUALS="equals",m.MIN="min",m.MAX="max",m.STEP="step",m.REFLECT="reflect",m.DISTANCE="distance",m.DIFFERENCE="difference",m.DOT="dot",m.CROSS="cross",m.POW="pow",m.TRANSFORM_DIRECTION="transformDirection",m.MIX="mix",m.CLAMP="clamp",m.REFRACT="refract",m.SMOOTHSTEP="smoothstep",m.FACEFORWARD="faceforward";const Na=P(Math.PI),Ta=w(m,m.ALL).setParameterLength(1),wa=w(m,m.ANY).setParameterLength(1),Sa=w(m,m.RADIANS).setParameterLength(1),Ma=w(m,m.DEGREES).setParameterLength(1),_a=w(m,m.EXP).setParameterLength(1),Ea=w(m,m.EXP2).setParameterLength(1),Aa=w(m,m.LOG).setParameterLength(1),Ca=w(m,m.LOG2).setParameterLength(1),rn=w(m,m.SQRT).setParameterLength(1),va=w(m,m.INVERSE_SQRT).setParameterLength(1),ba=w(m,m.FLOOR).setParameterLength(1),za=w(m,m.CEIL).setParameterLength(1),hs=w(m,m.NORMALIZE).setParameterLength(1),cs=w(m,m.FRACT).setParameterLength(1),on=w(m,m.SIN).setParameterLength(1),Fa=w(m,m.SINH).setParameterLength(1),vr=w(m,m.COS).setParameterLength(1),Ra=w(m,m.COSH).setParameterLength(1),Ia=w(m,m.TAN).setParameterLength(1),La=w(m,m.TANH).setParameterLength(1),Oa=w(m,m.ASIN).setParameterLength(1),Pa=w(m,m.ASINH).setParameterLength(1),Ba=w(m,m.ACOS).setParameterLength(1),Da=w(m,m.ACOSH).setParameterLength(1),Ua=w(m,m.ATAN).setParameterLength(1,2),Va=w(m,m.ATANH).setParameterLength(1),an=w(m,m.ABS).setParameterLength(1),br=w(m,m.SIGN).setParameterLength(1),ka=w(m,m.LENGTH).setParameterLength(1),zr=w(m,m.NEGATE).setParameterLength(1),Ga=w(m,m.ONE_MINUS).setParameterLength(1),$a=w(m,m.DFDX).setParameterLength(1),Wa=w(m,m.DFDY).setParameterLength(1),Ha=w(m,m.ROUND).setParameterLength(1),qa=w(m,m.RECIPROCAL).setParameterLength(1),Ya=w(m,m.TRUNC).setParameterLength(1),Xa=w(m,m.FWIDTH).setParameterLength(1),Za=w(m,m.TRANSPOSE).setParameterLength(1),ja=w(m,m.DETERMINANT).setParameterLength(1),Ja=w(m,m.INVERSE).setParameterLength(1),Qa=w(m,m.MIN).setParameterLength(2,1/0),Ka=w(m,m.MAX).setParameterLength(2,1/0),hn=w(m,m.STEP).setParameterLength(2),th=w(m,m.REFLECT).setParameterLength(2),eh=w(m,m.DISTANCE).setParameterLength(2),sh=w(m,m.DIFFERENCE).setParameterLength(2),Pe=w(m,m.DOT).setParameterLength(2),nh=w(m,m.CROSS).setParameterLength(2),Fr=w(m,m.POW).setParameterLength(2),rh=i=>Yt(i,i),ih=i=>Yt(i,i,i),oh=i=>Yt(i,i,i,i),ah=w(m,m.TRANSFORM_DIRECTION).setParameterLength(2),hh=(i,t)=>hs(Yt(t,k(R(i),0)).xyz),ch=(i,t)=>hs(k(R(i),0).mul(t).xyz),lh=i=>Yt(br(i),Fr(an(i),1/3)),Rr=i=>Pe(i,i),Xt=w(m,m.MIX).setParameterLength(3),Ir=(i,t=0,e=1)=>new m(m.CLAMP,M(i),M(t),M(e)),Lr=i=>Ir(i),uh=w(m,m.REFRACT).setParameterLength(3),se=w(m,m.SMOOTHSTEP).setParameterLength(3),dh=w(m,m.FACEFORWARD).setParameterLength(3),ph=E(([i])=>{const s=43758.5453,n=Pe(i.xy,Bt(12.9898,78.233)),r=Cr(n,Na);return cs(on(r).mul(s))}),fh=(i,t,e)=>Xt(t,e,i),mh=(i,t,e)=>se(t,e,i),gh=(i,t)=>hn(t,i);y("all",Ta),y("any",wa),y("radians",Sa),y("degrees",Ma),y("exp",_a),y("exp2",Ea),y("log",Aa),y("log2",Ca),y("sqrt",rn),y("inverseSqrt",va),y("floor",ba),y("ceil",za),y("normalize",hs),y("fract",cs),y("sin",on),y("sinh",Fa),y("cos",vr),y("cosh",Ra),y("tan",Ia),y("tanh",La),y("asin",Oa),y("asinh",Pa),y("acos",Ba),y("acosh",Da),y("atan",Ua),y("atanh",Va),y("abs",an),y("sign",br),y("length",ka),y("lengthSq",Rr),y("negate",zr),y("oneMinus",Ga),y("dFdx",$a),y("dFdy",Wa),y("round",Ha),y("reciprocal",qa),y("trunc",Ya),y("fwidth",Xa),y("min",Qa),y("max",Ka),y("step",gh),y("reflect",th),y("distance",eh),y("dot",Pe),y("cross",nh),y("pow",Fr),y("pow2",rh),y("pow3",ih),y("pow4",oh),y("transformDirection",ah),y("transformNormalByViewMatrix",hh),y("transformNormalByInverseViewMatrix",ch),y("mix",fh),y("clamp",Ir),y("refract",uh),y("smoothstep",mh),y("faceForward",dh),y("difference",sh),y("saturate",Lr),y("cbrt",lh),y("transpose",Za),y("determinant",ja),y("inverse",Ja),y("rand",ph);class yh extends C{static get type(){return"ConditionalNode"}constructor(t,e,s=null){super(),this.condNode=t,this.ifNode=e,this.elseNode=s}generateNodeType(t){const{ifNode:e,elseNode:s}=t.getNodeProperties(this);if(e===void 0)return t.flowBuildStage(this,"setup"),this.getNodeType(t);const n=e.getNodeType(t);if(s!==null){const r=s.getNodeType(t);if(t.getTypeLength(r)>t.getTypeLength(n))return r}return n}setup(t){const e=this.condNode,s=this.ifNode.isolate(),n=this.elseNode?this.elseNode.isolate():null,r=t.context.nodeBlock;t.getDataFromNode(s).parentNodeBlock=r,n!==null&&(t.getDataFromNode(n).parentNodeBlock=r);const o=t.context.uniformFlow,a=t.getNodeProperties(this);a.condNode=e,a.ifNode=o?s:s.context({nodeBlock:s}),a.elseNode=n?o?n:n.context({nodeBlock:n}):null}generate(t,e){const s=this.getNodeType(t),n=t.getDataFromNode(this);if(n.nodeProperty!==void 0)return n.nodeProperty;const{condNode:r,ifNode:o,elseNode:a}=t.getNodeProperties(this),h=t.currentFunctionNode,c=e!=="void",l=c?ee(s).build(t):"";n.nodeProperty=l;const u=r.build(t,"bool");if(t.context.uniformFlow&&a!==null){const f=o.build(t,s),g=a.build(t,s),N=t.getTernary(u,f,g);return t.format(N,s,e)}t.addFlowCode(`\n${t.tab}if ( ${u} ) {\n\n`).addFlowTab();let d=o.build(t,s);if(d&&(c?d=l+" = "+d+";":(d="return "+d+";",h===null&&(L("TSL: Return statement used in an inline \'Fn()\'. Define a layout struct to allow return values.",this.stackTrace),d="// "+d))),t.removeFlowTab().addFlowCode(t.tab+"	"+d+`\n\n`+t.tab+"}"),a!==null){t.addFlowCode(` else {\n\n`).addFlowTab();let f=a.build(t,s);f&&(c?f=l+" = "+f+";":(f="return "+f+";",h===null&&(L("TSL: Return statement used in an inline \'Fn()\'. Define a layout struct to allow return values.",this.stackTrace),f="// "+f))),t.removeFlowTab().addFlowCode(t.tab+"	"+f+`\n\n`+t.tab+`}\n\n`)}else t.addFlowCode(`\n\n`);return t.format(l,s,e)}}const cn=K(yh).setParameterLength(2,3);y("select",cn);class Or extends C{static get type(){return"ContextNode"}constructor(t=null,e={}){super(),this.isContextNode=!0,this.node=t,this.value=e}getScope(){return this.node.getScope()}generateNodeType(t){return this.node.getNodeType(t)}getFlowContextData(){const t=[];return this.traverse(e=>{e.isContextNode===!0&&t.push(e.value)}),Object.assign({},...t)}getMemberType(t,e){return this.node.getMemberType(t,e)}analyze(t){const e=t.addContext(this.value);this.node.build(t),t.setContext(e)}setup(t){const e=t.addContext(this.value);this.node.build(t),t.setContext(e)}generate(t,e){const s=t.addContext(this.value),n=this.node.build(t,e);return t.setContext(s),n}}const Ne=(i=null,t={})=>{let e=i;return(e===null||e.isNode!==!0)&&(t=e||t,e=null),new Or(e,t)},xh=i=>Ne(i,{uniformFlow:!0}),Pr=(i,t)=>Ne(i,{nodeName:t});function Nh(i,t,e=null){return Ne(e,{getShadow:({light:s,shadowColorNode:n})=>t===s?n.mul(i):n})}function Th(i,t=null){return Ne(t,{getAO:(e,{material:s})=>s.transparent===!0?e:e!==null?e.mul(i):i})}function wh(i,t){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\'),Pr(i,t)}y("context",Ne),y("label",wh),y("uniformFlow",xh),y("setName",Pr),y("builtinShadowContext",(i,t,e)=>Nh(t,e,i)),y("builtinAOContext",(i,t)=>Th(t,i));class Sh extends C{static get type(){return"VarNode"}constructor(t,e=null,s=!1){super(),this.node=t,this.name=e,this.global=!0,this.isVarNode=!0,this.readOnly=s,this.parents=!0,this.intent=!1}setIntent(t){return this.intent=t,this}isIntent(t){return t.getDataFromNode(this).forceDeclaration===!0?!1:this.intent}getIntent(){return this.intent}getMemberType(t,e){return this.node.getMemberType(t,e)}getElementType(t){return this.node.getElementType(t)}generateNodeType(t){return this.node.getNodeType(t)}getArrayCount(t){return this.node.getArrayCount(t)}isAssign(t){return t.getDataFromNode(this).assign}build(...t){const e=t[0],s=this.getShared(e);if(this!==s)return s.build(...t);if(this._hasStack(e)===!1&&e.buildStage==="setup"&&(e.context.nodeLoop||e.context.nodeBlock)){let n=!1;if(this.node.isShaderCallNodeInternal&&this.node.shaderNode.getLayout()===null&&e.fnCall&&e.fnCall.shaderNode&&e.getDataFromNode(this.node.shaderNode).hasLoop){const a=e.getDataFromNode(this);a.forceDeclaration=!0,n=!0}const r=e.getBaseStack();n?r.addToStackBefore(this):r.addToStack(this)}return this.isIntent(e)&&this.isAssign(e)!==!0?this.node.build(...t):super.build(...t)}generate(t){const{node:e,name:s,readOnly:n}=this,{renderer:r}=t,o=r.backend.isWebGPUBackend===!0;let a=!1,h=!1;n&&(a=t.isDeterministic(e),h=o?n:a);const c=this.getNodeType(t);if(c=="void")return this.isIntent(t)!==!0&&q(\'TSL: ".toVar()" can not be used with void type.\',this.stackTrace),e.build(t);const l=t.getVectorType(c),u=e.build(t,l),p=t.getVarFromNode(this,s,l,void 0,h),d=t.getPropertyName(p);let f=d;if(h)if(o)f=a?`const ${d}`:`let ${d}`;else{const g=e.getArrayCount(t);f=`const ${t.getVar(p.type,d,g)}`}return t.addLineFlowCode(`${f} = ${u}`,this),d}_hasStack(t){return t.getDataFromNode(this).stack!==void 0}}const ln=K(Sh),Mh=(i,t=null)=>ln(i,t).toStack(),_h=(i,t=null)=>ln(i,t,!0).toStack(),Eh=i=>ln(i).setIntent(!0).toStack();y("toVar",Mh),y("toConst",_h),y("toVarIntent",Eh);class Ah extends C{static get type(){return"SubBuild"}constructor(t,e,s=null){super(s),this.node=t,this.name=e,this.isSubBuildNode=!0}generateNodeType(t){if(this.nodeType!==null)return this.nodeType;t.addSubBuild(this.name);const e=this.node.getNodeType(t);return t.removeSubBuild(),e}build(t,...e){t.addSubBuild(this.name);const s=this.node.build(t,...e);return t.removeSubBuild(),s}}const Br=(i,t,e=null)=>new Ah(M(i),t,e);class Ch extends C{static get type(){return"VaryingNode"}constructor(t,e=null){super(),this.node=Br(t,"VERTEX"),this.name=e,this.isVaryingNode=!0,this.interpolationType=null,this.interpolationSampling=null,this.global=!0}setInterpolation(t,e=null){return this.interpolationType=t,this.interpolationSampling=e,this}getHash(t){return this.name||super.getHash(t)}generateNodeType(t){return this.node.getNodeType(t)}setupVarying(t){const e=t.getNodeProperties(this);let s=e.varying;if(s===void 0){const n=this.name,r=this.getNodeType(t),o=this.interpolationType,a=this.interpolationSampling;e.varying=s=t.getVaryingFromNode(this,n,r,o,a),e.node=Br(this.node,"VERTEX")}return s.needsInterpolation||(s.needsInterpolation=t.shaderStage==="fragment"),s}setup(t){this.setupVarying(t),t.flowNodeFromShaderStage(ze.VERTEX,this.node)}analyze(t){this.setupVarying(t),t.flowNodeFromShaderStage(ze.VERTEX,this.node)}generate(t){const e=t.getSubBuildProperty("property",t.currentStack),s=t.getNodeProperties(this),n=this.setupVarying(t);if(s[e]===void 0){const r=this.getNodeType(t),o=t.getPropertyName(n,ze.VERTEX);if(t.shaderStage===ze.VERTEX){const a=s.node.build(t,r);t.addLineFlowCode(`${o} = ${a}`,this)}else t.flowNodeFromShaderStage(ze.VERTEX,s.node,r,o);s[e]=o}return t.getPropertyName(n)}}const Be=K(Ch).setParameterLength(1,2),vh=i=>Be(i);y("toVarying",Be),y("toVertexStage",vh);const bh=E(([i])=>{const t=i.mul(.9478672986).add(.0521327014).pow(2.4),e=i.mul(.0773993808),s=i.lessThanEqual(.04045);return Xt(t,e,s)}).setLayout({name:"sRGBTransferEOTF",type:"vec3",inputs:[{name:"color",type:"vec3"}]}),zh=E(([i])=>{const t=i.pow(.41666).mul(1.055).sub(.055),e=i.mul(12.92),s=i.lessThanEqual(.0031308);return Xt(t,e,s)}).setLayout({name:"sRGBTransferOETF",type:"vec3",inputs:[{name:"color",type:"vec3"}]}),un="WorkingColorSpace",Fh="OutputColorSpace";class Dr extends et{static get type(){return"ColorSpaceNode"}constructor(t,e,s){super("vec4"),this.colorNode=t,this.source=e,this.target=s}resolveColorSpace(t,e){return e===un?Q.workingColorSpace:e===Fh?t.context.outputColorSpace||t.renderer.outputColorSpace:e}setup(t){const{colorNode:e}=this,s=this.resolveColorSpace(t,this.source),n=this.resolveColorSpace(t,this.target);let r=e;return Q.enabled===!1||s===n||!s||!n||(Q.getTransfer(s)===Me&&(r=k(bh(r.rgb),r.a)),Q.getPrimaries(s)!==Q.getPrimaries(n)&&(r=k(te(Q._getMatrix(new Ct,s,n)).mul(r.rgb),r.a)),Q.getTransfer(n)===Me&&(r=k(zh(r.rgb),r.a))),r}}const Rh=(i,t)=>new Dr(M(i),un,t),Ur=(i,t)=>new Dr(M(i),t,un);y("workingToColorSpace",Rh),y("colorSpaceToWorking",Ur);let Ih=class extends Re{static get type(){return"ReferenceElementNode"}constructor(t,e){super(t,e),this.referenceNode=t,this.isReferenceElementNode=!0}generateNodeType(){return this.referenceNode.uniformType}generate(t){const e=super.generate(t),s=this.referenceNode.getNodeType(),n=this.getNodeType();return t.format(e,s,n)}};class Lh extends C{static get type(){return"ReferenceBaseNode"}constructor(t,e,s=null,n=null){super(),this.property=t,this.uniformType=e,this.object=s,this.count=n,this.properties=t.split("."),this.reference=s,this.node=null,this.group=null,this.updateType=D.OBJECT}setGroup(t){return this.group=t,this}element(t){return new Ih(this,M(t))}setNodeType(t){const e=Z(null,t);this.group!==null&&e.setGroup(this.group),this.node=e}generateNodeType(t){return this.node===null&&(this.updateReference(t),this.updateValue()),this.node.getNodeType(t)}getValueFromReference(t=this.reference){const{properties:e}=this;let s=t[e[0]];for(let n=1;n<e.length;n++)s=s[e[n]];return s}updateReference(t){return this.reference=this.object!==null?this.object:t.object,this.reference}setup(){return this.updateValue(),this.node}update(){this.updateValue()}updateValue(){this.node===null&&this.setNodeType(this.uniformType);const t=this.getValueFromReference();Array.isArray(t)?this.node.array=t:this.node.value=t}}class Oh extends Lh{static get type(){return"RendererReferenceNode"}constructor(t,e,s=null){super(t,e,s),this.renderer=s,this.setGroup(ot)}updateReference(t){return this.reference=this.renderer!==null?this.renderer:t.renderer,this.reference}}const Ph=(i,t,e=null)=>new Oh(i,t,e);class Bh extends et{static get type(){return"ToneMappingNode"}constructor(t,e=Uh,s=null){super("vec3"),this._toneMapping=t,this.exposureNode=e,this.colorNode=s}customCacheKey(){return ir(this._toneMapping)}setToneMapping(t){return this._toneMapping=t,this}getToneMapping(){return this._toneMapping}setup(t){const e=this.colorNode||t.context.color,s=this._toneMapping;if(s===0)return e;let n=null;const r=t.renderer.library.getToneMappingFunction(s);return r!==null?n=k(r(e.rgb,this.exposureNode),e.a):(q("ToneMappingNode: Unsupported Tone Mapping configuration.",s),n=e),n}}const Dh=(i,t,e)=>new Bh(i,M(t),M(e)),Uh=Ph("toneMappingExposure","float");y("toneMapping",(i,t,e)=>Dh(t,e,i));const Vr=new WeakMap;function kr(i,t){let e=Vr.get(i);return e===void 0&&(e=new ro(i,t),Vr.set(i,e)),e}class Zt extends Ys{static get type(){return"BufferAttributeNode"}constructor(t,e=null,s=0,n=0){super(t,e),this.isBufferNode=!0,this.bufferType=e,this.bufferStride=s,this.bufferOffset=n,this.usage=35044,this.instanced=!1,this.attribute=null,this.global=!0,t&&t.isBufferAttribute===!0&&t.itemSize<=4&&(this.attribute=t,this.usage=t.usage,this.instanced=t.isInstancedBufferAttribute)}getHash(t){let e;if(this.bufferStride===0&&this.bufferOffset===0){let s=t.globalCache.getData(this.value);s===void 0&&(s={node:this},t.globalCache.setData(this.value,s)),e=s.node.id}else e=this.id;return String(e)}generateNodeType(t){return this.bufferType===null&&(this.bufferType=t.getTypeFromAttribute(this.attribute)),this.bufferType}setup(t){if(this.attribute!==null)return;const e=this.getNodeType(t),s=t.getTypeLength(e),n=this.value,r=this.bufferStride||s,o=this.bufferOffset;let a;n.isInterleavedBuffer===!0?a=n:n.isBufferAttribute===!0?a=kr(n.array,r):a=kr(n,r);const h=new ks(a,s,o);a.setUsage(this.usage),this.attribute=h,this.attribute.isInstancedBufferAttribute=this.instanced}generate(t){const e=this.getNodeType(t),s=t.context.nodeName;s!==void 0&&delete t.context.nodeName;const n=t.getBufferAttributeFromNode(this,e,s),r=t.getPropertyName(n);let o=null;if(t.shaderStage==="vertex"||t.shaderStage==="compute")this.name=r,o=r;else{let a;s&&(a=s+"Varying"),o=Be(this,a).build(t,e)}return o}getInputType(){return"bufferAttribute"}setUsage(t){return this.usage=t,this.attribute&&this.attribute.isBufferAttribute===!0&&(this.attribute.usage=t),this}setInstanced(t){return this.instanced=t,this}}function Vh(i,t=null,e=0,s=0,n=35044,r=!1){return t==="mat3"||t===null&&i.itemSize===9?te(new Zt(i,"vec3",9,0).setUsage(n).setInstanced(r),new Zt(i,"vec3",9,3).setUsage(n).setInstanced(r),new Zt(i,"vec3",9,6).setUsage(n).setInstanced(r)):t==="mat4"||t===null&&i.itemSize===16?Tr(new Zt(i,"vec4",16,0).setUsage(n).setInstanced(r),new Zt(i,"vec4",16,4).setUsage(n).setInstanced(r),new Zt(i,"vec4",16,8).setUsage(n).setInstanced(r),new Zt(i,"vec4",16,12).setUsage(n).setInstanced(r)):new Zt(i,t,e,s).setUsage(n)}const kh=(i,t=null,e=0,s=0)=>Vh(i,t,e,s);y("toAttribute",i=>kh(i.value));class W extends C{static get type(){return"IndexNode"}constructor(t){super("uint"),this.scope=t,this.isIndexNode=!0}generate(t){const e=this.getNodeType(t),s=this.scope;let n;if(s===W.VERTEX)n=t.getVertexIndex();else if(s===W.INSTANCE)n=t.getInstanceIndex();else if(s===W.DRAW)n=t.getDrawIndex();else if(s===W.INVOCATION_LOCAL)n=t.getInvocationLocalIndex();else if(s===W.INVOCATION_SUBGROUP)n=t.getInvocationSubgroupIndex();else if(s===W.SUBGROUP)n=t.getSubgroupIndex();else throw new Error("THREE.IndexNode: Unknown scope: "+s);let r;return t.shaderStage==="vertex"||t.shaderStage==="compute"?r=n:r=Be(this).build(t,e),r}}W.VERTEX="vertex",W.INSTANCE="instance",W.SUBGROUP="subgroup",W.INVOCATION_LOCAL="invocationLocal",W.INVOCATION_SUBGROUP="invocationSubgroup",W.DRAW="draw",W.VERTEX;const Gh=_(W,W.INSTANCE);W.SUBGROUP,W.INVOCATION_SUBGROUP,W.INVOCATION_LOCAL,W.DRAW;class $h extends C{static get type(){return"ComputeNode"}constructor(t,e){super("void"),this.isComputeNode=!0,this.computeNode=t,this.workgroupSize=e,this.count=null,this.dispatchSize=null,this.version=1,this.name="",this.updateBeforeType=D.OBJECT,this.onInitFunction=null,this.countNode=null}dispose(){this.dispatchEvent({type:"dispose"})}setName(t){return this.name=t,this}label(t){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\',new At),this.setName(t)}onInit(t){return this.onInitFunction=t,this}updateBefore({renderer:t}){t.compute(this)}setup(t){this.count!==null&&this.countNode===null&&(this.countNode=Z(this.count,"uint").onObjectUpdate(()=>this.count));const e=this.computeNode.build(t);if(e){const s=t.getNodeProperties(this);s.outputComputeNode=e.outputNode,e.outputNode=null}return e}generate(t,e){const{shaderStage:s}=t;if(s==="compute"){const n=this.computeNode.build(t,"void");if(n!==""&&t.addLineFlowCode(n,this),this.count!==null&&t.allowEarlyReturns===!0){const r=this.countNode.build(t,"uint"),o=Gh.build(t,"uint");t.flow.code=`${t.tab}if ( ${o} >= ${r} ) { return; }\n\n${t.flow.code}`}}else{const r=t.getNodeProperties(this).outputComputeNode;if(r)return r.build(t,e)}}}const Gr=(i,t=[64])=>{(t.length===0||t.length>3)&&q("TSL: compute() workgroupSize must have 1, 2, or 3 elements",new At);for(let e=0;e<t.length;e++){const s=t[e];(typeof s!="number"||s<=0||!Number.isInteger(s))&&q(`TSL: compute() workgroupSize element at index [ ${e} ] must be a positive integer`,new At)}for(;t.length<3;)t.push(1);return new $h(M(i),t)};y("compute",(i,t,e)=>{const s=Gr(i,e);return typeof t=="number"?s.count=t:s.dispatchSize=t,s}),y("computeKernel",Gr);class Wh extends C{static get type(){return"IsolateNode"}constructor(t,e=!0){super(),this.node=t,this.parent=e,this.isIsolateNode=!0}generateNodeType(t){const e=t.getCache(),s=t.getCacheFromNode(this,this.parent);t.setCache(s);const n=this.node.getNodeType(t);return t.setCache(e),n}build(t,...e){const s=t.getCache(),n=t.getCacheFromNode(this,this.parent);t.setCache(n);const r=this.node.build(t,...e);return t.setCache(s),r}setParent(t){return this.parent=t,this}getParent(){return this.parent}}const $r=i=>new Wh(M(i));function Hh(i,t=!0){return L(\'TSL: "cache()" has been deprecated. Use "isolate()" instead.\'),$r(i).setParent(t)}y("cache",Hh),y("isolate",$r);class qh extends C{static get type(){return"BypassNode"}constructor(t,e){super(),this.isBypassNode=!0,this.outputNode=t,this.callNode=e}generateNodeType(t){return this.outputNode.getNodeType(t)}generate(t){const e=this.callNode.build(t,"void");return e!==""&&t.addLineFlowCode(e,this),this.outputNode.build(t)}}y("bypass",K(qh).setParameterLength(2));const Wr=E(([i,t,e,s=P(0),n=P(1),r=tn(!1)])=>{let o=i.sub(t).div(e.sub(t));return Lo(r)&&(o=o.clamp()),o.mul(n.sub(s)).add(s)});function Yh(i,t,e,s=P(0),n=P(1)){return Wr(i,t,e,s,n,!0)}y("remap",Wr),y("remapClamp",Yh);class Xh extends C{static get type(){return"ExpressionNode"}constructor(t="",e="void"){super(e),this.snippet=t}generate(t,e){const s=this.getNodeType(t),n=this.snippet;if(s==="void")t.addLineFlowCode(n,this);else return t.format(n,s,e)}}const Dt=K(Xh).setParameterLength(1,2);y("discard",i=>(i?cn(i,Dt("discard")):Dt("discard")).toStack());const Zh=E(([i])=>k(i.rgb.mul(i.a),i.a),{color:"vec4",return:"vec4"}),jh=E(([i])=>i.a.equal(0).select(k(0),k(i.rgb.div(i.a),i.a)),{color:"vec4",return:"vec4"});class Jh extends et{static get type(){return"RenderOutputNode"}constructor(t,e,s){super("vec4"),this.colorNode=t,this._toneMapping=e,this.outputColorSpace=s,this.isRenderOutputNode=!0}setToneMapping(t){return this._toneMapping=t,this}getToneMapping(){return this._toneMapping}setup({context:t}){let e=this.colorNode||t.color;e=k(e.rgb,e.a.clamp(0,1)),e=jh(e);const s=(this._toneMapping!==null?this._toneMapping:t.toneMapping)||0,n=(this.outputColorSpace!==null?this.outputColorSpace:t.outputColorSpace)||"";return s!==0&&(e=e.toneMapping(s)),n!==""&&n!==Q.workingColorSpace&&(e=e.workingToColorSpace(n)),e=Zh(e),e}}y("renderOutput",(i,t=null,e=null)=>new Jh(M(i),t,e));class Qh extends et{static get type(){return"DebugNode"}constructor(t,e=null){super(),this.node=t,this.callback=e}generateNodeType(t){return this.node.getNodeType(t)}setup(t){return this.node.build(t)}analyze(t){return this.node.build(t)}generate(t){const e=this.callback,s=this.node.build(t);if(e!==null)e(t,s);else{const n="--- TSL debug - "+t.shaderStage+" shader ---",r="-".repeat(n.length);let o="";o+="// #"+n+`#\n`,o+=t.flow.code.replace(/^\\t/mg,"")+`\n`,o+="/* ... */ "+s+` /* ... */\n`,o+="// #"+r+`#\n`,bs(o)}return s}}y("debug",(i,t=null)=>new Qh(M(i),t).toStack());class Kh extends he{constructor(){super(),this._renderer=null,this.currentFrame=null}get nodeFrame(){return this._renderer._nodes.nodeFrame}setRenderer(t){return this._renderer=t,this}getRenderer(){return this._renderer}init(){}begin(){}finish(){}inspect(){}computeAsync(){}beginCompute(){}finishCompute(){}beginRender(){}finishRender(){}copyTextureToTexture(){}copyFramebufferToTexture(){}}class tc extends C{static get type(){return"InspectorNode"}constructor(t,e="",s=null){super(),this.node=t,this.name=e,this.callback=s,this.updateType=D.FRAME,this.isInspectorNode=!0}getName(){return this.name||this.node.name}update(t){t.renderer.inspector.inspect(this)}generateNodeType(t){return this.node.getNodeType(t)}setup(t){let e=this.node;return t.context.inspector===!0&&this.callback!==null&&(e=this.callback(e)),t.renderer.backend.isWebGPUBackend!==!0&&t.renderer.inspector.constructor!==Kh&&kt(\'TSL: ".toInspector()" is only available with WebGPU.\'),e}}function ec(i,t="",e=null){return i=M(i),i.before(new tc(i,t,e))}y("toInspector",ec);class sc extends C{static get type(){return"AttributeNode"}constructor(t,e=null){super(e),this.global=!0,this._attributeName=t}getHash(t){return this.getAttributeName(t)}generateNodeType(t){let e=this.nodeType;if(e===null){const s=this.getAttributeName(t);if(t.hasGeometryAttribute(s)){const n=t.geometry.getAttribute(s);e=t.getTypeFromAttribute(n)}else e="float"}return e}setAttributeName(t){return this._attributeName=t,this}getAttributeName(){return this._attributeName}generate(t){const e=this.getAttributeName(t),s=this.getNodeType(t);if(t.hasGeometryAttribute(e)===!0){const r=t.geometry.getAttribute(e),o=t.getTypeFromAttribute(r),a=t.getAttribute(e,o);return t.shaderStage==="vertex"?t.format(a.name,o,s):Be(this).build(t,s)}else return L(`AttributeNode: Vertex attribute "${e}" not found on geometry.`),t.generateConst(s)}serialize(t){super.serialize(t),t.global=this.global,t._attributeName=this._attributeName}deserialize(t){super.deserialize(t),this.global=t.global,this._attributeName=t._attributeName}}const Ut=(i,t=null)=>new sc(i,t),Te=(i=0)=>Ut("uv"+(i>0?i:""),"vec2");class nc extends C{static get type(){return"TextureSizeNode"}constructor(t,e=null){super("uvec2"),this.isTextureSizeNode=!0,this.textureNode=t,this.levelNode=e}generate(t,e){const s=this.textureNode.build(t,"property"),n=this.levelNode===null?"0":this.levelNode.build(t,"int");return t.format(`${t.getMethod("textureDimensions")}( ${s}, ${n} )`,this.getNodeType(t),e)}}const Hr=K(nc).setParameterLength(1,2);class rc extends Oe{static get type(){return"MaxMipLevelNode"}constructor(t){super(0),this._textureNode=t,this.updateType=D.FRAME}get textureNode(){return this._textureNode}get texture(){return this._textureNode.value}update(){const t=this.texture,e=t.images,s=e&&e.length>0?e[0]&&e[0].image||e[0]:t.image;if(s&&s.width!==void 0){const{width:n,height:r}=s;this.value=Math.log2(Math.max(n,r))}}}const ic=K(rc).setParameterLength(1);class oc extends Error{constructor(t,e=null){super(t),this.name="NodeError",this.stackTrace=e}}const qr=new yt;class ls extends Oe{static get type(){return"TextureNode"}constructor(t=qr,e=null,s=null,n=null){super(t),this.isTextureNode=!0,this.uvNode=e,this.levelNode=s,this.biasNode=n,this.compareNode=null,this.depthNode=null,this.gradNode=null,this.gatherNode=null,this.offsetNode=null,this.sampler=!0,this.updateMatrix=!1,this.updateType=D.NONE,this.referenceNode=null,this._value=t,this._matrixUniform=null,this._flipYUniform=null,this.setUpdateMatrix(e===null)}set value(t){this.referenceNode?this.referenceNode.value=t:this._value=t}get value(){return this.referenceNode?this.referenceNode.value:this._value}getUniformHash(){return this.value.uuid}generateNodeType(){return this.value.isDepthTexture===!0?this.gatherNode===null?"float":"vec4":this.value.type===1014?"uvec4":this.value.type===1013?"ivec4":"vec4"}getInputType(){return"texture"}getDefaultUV(){return Te(this.value.channel)}updateReference(){return this.value}getTransformedUV(t){return this._matrixUniform===null&&(this._matrixUniform=Z(this.value.matrix)),this._matrixUniform.mul(R(t,1)).xy}setUpdateMatrix(t){return this.updateMatrix=t,this}setupUV(t,e){return t.isFlipY()&&(this._flipYUniform===null&&(this._flipYUniform=Z(!1)),e=e.toVar(),this.sampler?e=this._flipYUniform.select(e.flipY(),e):e=this._flipYUniform.select(e.setY(Le(Hr(this,this.levelNode).y).sub(e.y).sub(1)),e)),e}setup(t){const e=t.getNodeProperties(this);e.referenceNode=this.referenceNode;const s=this.value;if(!s||s.isTexture!==!0)throw new oc("THREE.TSL: `texture( value )` function expects a valid instance of THREE.Texture().",this.stackTrace);const n=E(()=>{let h=this.uvNode;return(h===null||t.context.forceUVContext===!0)&&t.context.getUV&&(h=t.context.getUV(this,t)),h||(h=this.getDefaultUV()),this.updateMatrix===!0&&(h=this.getTransformedUV(h)),h=this.setupUV(t,h),this.updateType=this._matrixUniform!==null||this._flipYUniform!==null?D.OBJECT:D.NONE,h})();let r=this.levelNode;r===null&&t.context.getTextureLevel&&(r=t.context.getTextureLevel(this));let o=null,a=null;if(this.compareNode!==null)if(t.renderer.hasCompatibility(Ai.TEXTURE_COMPARE))o=this.compareNode;else{const h=s.compareFunction;h===null||h===513||h===515||h===516||h===518?a=this.compareNode:(o=this.compareNode,kt(\'TSL: Only "LessCompare", "LessEqualCompare", "GreaterCompare" and "GreaterEqualCompare" are supported for depth texture comparison fallback.\'))}e.uvNode=n,e.levelNode=r,e.biasNode=this.biasNode,e.compareNode=o,e.compareStepNode=a,e.gradNode=this.gradNode,e.gatherNode=this.gatherNode,e.depthNode=this.depthNode,e.offsetNode=this.offsetNode}generateUV(t,e){return e.build(t,this.sampler===!0?"vec2":"ivec2")}generateOffset(t,e){return e.build(t,"ivec2")}generateSnippet(t,e,s,n,r,o,a,h,c,l,u){const p=this.value;let d;return r?d=t.generateTextureBias(p,e,s,r,o,l):h?d=t.generateTextureGrad(p,e,s,h,o,l):c?a?d=t.generateTextureGatherCompare(p,e,s,a,o,l,u):d=t.generateTextureGather(p,e,s,c,o,l,u):a?d=t.generateTextureCompare(p,e,s,a,o,l):this.sampler===!1?d=t.generateTextureLoad(p,e,s,n,o,l):n?d=t.generateTextureLevel(p,e,s,n,o,l):d=t.generateTexture(p,e,s,o,l),d}generate(t,e){const s=this.value,n=t.getNodeProperties(this),r=super.generate(t,"property");if(/^sampler/.test(e))return r+"_sampler";if(t.isReference(e))return r;{const o=t.getDataFromNode(this);let a=this.getNodeType(t),h=o.propertyName;if(h===void 0){const{uvNode:l,levelNode:u,biasNode:p,compareNode:d,compareStepNode:f,depthNode:g,gradNode:N,gatherNode:T,offsetNode:A}=n,v=this.generateUV(t,l),z=u?u.build(t,"float"):null,b=p?p.build(t,"float"):null,F=g?g.build(t,"int"):null,I=d?d.build(t,"float"):null,X=f?f.build(t,"float"):null,tt=N?[N[0].build(t,"vec2"),N[1].build(t,"vec2")]:null,lt=T?T.build(t,"int"):null,pt=A?this.generateOffset(t,A):null,nt=this._flipYUniform?this._flipYUniform.build(t,"bool"):null;lt&&(a="vec4");let at=F;at===null&&s.isArrayTexture&&this.isTexture3DNode!==!0&&(at="0");const Vt=t.getVarFromNode(this);h=t.getPropertyName(Vt);let V=this.generateSnippet(t,r,v,z,b,at,I,tt,lt,pt,nt);if(X!==null){const ae=s.compareFunction;ae===516||ae===518?V=hn(Dt(V,a),Dt(X,"float")).build(t,a):V=hn(Dt(X,"float"),Dt(V,a)).build(t,a)}t.addLineFlowCode(`${h} = ${V}`,this),o.snippet=V,o.propertyName=h}let c=h;return t.needsToWorkingColorSpace(s)&&(c=Ur(Dt(c,a),s.colorSpace).setup(t).build(t,a)),t.format(c,a,e)}}setSampler(t){return this.sampler=t,this}getSampler(){return this.sampler}sample(t){const e=this.clone();return e.uvNode=M(t),e.referenceNode=this.getBase(),M(e)}load(t){return this.sample(t).setSampler(!1)}blur(t){const e=this.clone();e.biasNode=M(t).mul(ic(e)),e.referenceNode=this.getBase();const s=e.value;return e.generateMipmaps===!1&&(s&&s.generateMipmaps===!1||s.minFilter===1003||s.magFilter===1003)&&(L("TSL: texture().blur() requires mipmaps and sampling. Use .generateMipmaps=true and .minFilter/.magFilter=THREE.LinearFilter in the Texture."),e.biasNode=null),M(e)}level(t){const e=this.clone();return e.levelNode=M(t),e.referenceNode=this.getBase(),M(e)}size(t){return Hr(this,t)}bias(t){const e=this.clone();return e.biasNode=M(t),e.referenceNode=this.getBase(),M(e)}getBase(){return this.referenceNode?this.referenceNode.getBase():this}compare(t){const e=this.clone();return e.compareNode=M(t),e.referenceNode=this.getBase(),M(e)}grad(t,e){const s=this.clone();return s.gradNode=[M(t),M(e)],s.referenceNode=this.getBase(),M(s)}gather(t=0){const e=this.clone();return e.gatherNode=M(t),e.referenceNode=this.getBase(),M(e)}depth(t){const e=this.clone();return e.depthNode=M(t),e.referenceNode=this.getBase(),M(e)}offset(t){const e=this.clone();return e.offsetNode=M(t),e.referenceNode=this.getBase(),M(e)}serialize(t){super.serialize(t),t.value=this.value.toJSON(t.meta).uuid,t.sampler=this.sampler,t.updateMatrix=this.updateMatrix,t.updateType=this.updateType}deserialize(t){super.deserialize(t),this.value=t.meta.textures[t.value],this.sampler=t.sampler,this.updateMatrix=t.updateMatrix,this.updateType=t.updateType}update(){const t=this.value,e=this._matrixUniform;e!==null&&(e.value=t.matrix),t.matrixAutoUpdate===!0&&t.updateMatrix();const s=this._flipYUniform;s!==null&&(s.value=t.image instanceof ImageBitmap&&t.flipY===!0||t.isRenderTargetTexture===!0||t.isFramebufferTexture===!0||t.isDepthTexture===!0)}clone(){const t=new this.constructor(this.value,this.uvNode,this.levelNode,this.biasNode);return t.sampler=this.sampler,t.depthNode=this.depthNode,t.compareNode=this.compareNode,t.gradNode=this.gradNode,t.gatherNode=this.gatherNode,t.offsetNode=this.offsetNode,t}}const ac=K(ls).setParameterLength(1,4).setName("texture"),hc=(i=qr,t=null,e=null,s=null)=>{let n;return i&&i.isTextureNode===!0?(n=M(i.clone()),n.referenceNode=i.getBase(),t!==null&&(n.uvNode=M(t)),e!==null&&(n.levelNode=M(e)),s!==null&&(n.biasNode=M(s))):n=ac(i,t,e,s),n};class Yr extends Oe{static get type(){return"BufferNode"}constructor(t,e,s=0){super(t,e),this.isBufferNode=!0,this.bufferType=e,this.bufferCount=s,this.updateRanges=[]}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}getElementType(t){return this.getNodeType(t)}getInputType(){return"buffer"}}const cc=(i,t,e)=>new Yr(i,t,e);class lc extends Re{static get type(){return"UniformArrayElementNode"}constructor(t,e){super(t,e),this.isArrayBufferElementNode=!0}generate(t){const e=super.generate(t),s=this.getNodeType(t),n=this.node.getPaddedType();return t.format(e,n,s)}}class uc extends Yr{static get type(){return"UniformArrayNode"}constructor(t,e=null){super(null),this.array=t,this.elementType=e===null?ss(t[0]):e,this.paddedType=this.getPaddedType(),this.updateType=D.RENDER,this.isArrayBufferNode=!0}generateNodeType(){return this.paddedType}getElementType(){return this.elementType}getPaddedType(){const t=this.elementType;let e="vec4";return t==="mat2"?e="mat2":/mat/.test(t)===!0?e="mat4":t.charAt(0)==="i"?e="ivec4":t.charAt(0)==="u"&&(e="uvec4"),e}update(){const{array:t,value:e}=this,s=this.elementType;if(s==="float"||s==="int"||s==="uint")for(let n=0;n<t.length;n++){const r=n*4;e[r]=t[n]}else if(s==="color")for(let n=0;n<t.length;n++){const r=n*4,o=t[n];e[r]=o.r,e[r+1]=o.g,e[r+2]=o.b||0}else if(s==="mat2")for(let n=0;n<t.length;n++){const r=n*4,o=t[n];e[r]=o.elements[0],e[r+1]=o.elements[1],e[r+2]=o.elements[2],e[r+3]=o.elements[3]}else if(s==="mat3")for(let n=0;n<t.length;n++){const r=n*16,o=t[n];e[r]=o.elements[0],e[r+1]=o.elements[1],e[r+2]=o.elements[2],e[r+4]=o.elements[3],e[r+5]=o.elements[4],e[r+6]=o.elements[5],e[r+8]=o.elements[6],e[r+9]=o.elements[7],e[r+10]=o.elements[8],e[r+15]=1}else if(s==="mat4")for(let n=0;n<t.length;n++){const r=n*16,o=t[n];for(let a=0;a<o.elements.length;a++)e[r+a]=o.elements[a]}else for(let n=0;n<t.length;n++){const r=n*4,o=t[n];e[r]=o.x,e[r+1]=o.y,e[r+2]=o.z||0,e[r+3]=o.w||0}}setup(t){const e=this.array.length,s=this.elementType;let n=Float32Array;const r=this.paddedType,o=t.getTypeLength(r);return s.charAt(0)==="i"&&(n=Int32Array),s.charAt(0)==="u"&&(n=Uint32Array),this.value=new n(e*o),this.bufferCount=e,this.bufferType=r,this.update(),super.setup(t)}element(t){return new lc(this,M(t))}}const Rt=(i,t)=>new uc(i,t);class dc extends C{constructor(t){super("float"),this.name=t,this.isBuiltinNode=!0}generate(){return this.name}}const De=K(dc).setParameterLength(1);let Ue,Ve;class G extends C{static get type(){return"ScreenNode"}constructor(t){super(),this.scope=t,this._output=null,this.isViewportNode=!0}generateNodeType(){return this.scope===G.DPR?"float":this.scope===G.VIEWPORT?"vec4":"vec2"}getUpdateType(){let t=D.NONE;return(this.scope===G.SIZE||this.scope===G.VIEWPORT||this.scope===G.DPR)&&(t=D.RENDER),this.updateType=t,t}update({renderer:t}){const e=t.getRenderTarget();this.scope===G.VIEWPORT?e!==null?Ve.copy(e.viewport):(t.getViewport(Ve),Ve.multiplyScalar(t.getPixelRatio())):this.scope===G.DPR?this._output.value=t.getPixelRatio():e!==null?(Ue.width=e.width,Ue.height=e.height):t.getDrawingBufferSize(Ue)}setup(){const t=this.scope;let e=null;return t===G.SIZE?e=Z(Ue||(Ue=new Mt)):t===G.VIEWPORT?e=Z(Ve||(Ve=new Gt)):t===G.DPR?e=Z(1):e=Bt(Zr.div(Xr)),this._output=e,e}generate(t){if(this.scope===G.COORDINATE){let e=t.getFragCoord();if(t.isFlipY()){const s=t.getNodeProperties(Xr).outputNode.build(t);e=`${t.getType("vec2")}( ${e}.x, ${s}.y - ${e}.y )`}return e}return super.generate(t)}}G.COORDINATE="coordinate",G.VIEWPORT="viewport",G.SIZE="size",G.UV="uv",G.DPR="dpr";const pc=_(G,G.DPR),dn=_(G,G.UV),Xr=_(G,G.SIZE),Zr=_(G,G.COORDINATE),ke=_(G,G.VIEWPORT);ke.zw,ke.xy;let pn=null,us=null,fn=null,ds=null,mn=null,ps=null,gn=null,fs=null;const ms=Z(0,"uint").setName("u_cameraIndex").setGroup(sn("cameraIndex")).toVarying("v_cameraIndex"),Ge=Z("float").setName("cameraNear").setGroup(ot).onRenderUpdate(({camera:i})=>i.near),$e=Z("float").setName("cameraFar").setGroup(ot).onRenderUpdate(({camera:i})=>i.far),we=E(({camera:i})=>{let t;if(i.isArrayCamera&&i.cameras.length>0){const e=[];for(const s of i.cameras)e.push(s.projectionMatrix);us===null?us=Rt(e).setGroup(ot).setName("cameraProjectionMatrices"):us.array=e,t=us.element(i.isMultiViewCamera?De("gl_ViewID_OVR"):ms)}else pn===null&&(pn=Z(i.projectionMatrix).setName("cameraProjectionMatrix").setGroup(ot).onRenderUpdate(({camera:e})=>e.projectionMatrix)),t=pn;return t}).once()(),fc=E(({camera:i})=>{let t;if(i.isArrayCamera&&i.cameras.length>0){const e=[];for(const s of i.cameras)e.push(s.projectionMatrixInverse);ds===null?ds=Rt(e).setGroup(ot).setName("cameraProjectionMatricesInverse"):ds.array=e,t=ds.element(i.isMultiViewCamera?De("gl_ViewID_OVR"):ms)}else fn===null&&(fn=Z(i.projectionMatrixInverse).setName("cameraProjectionMatrixInverse").setGroup(ot).onRenderUpdate(({camera:e})=>e.projectionMatrixInverse)),t=fn;return t}).once()(),yn=E(({camera:i})=>{let t;if(i.isArrayCamera&&i.cameras.length>0){const e=[];for(const s of i.cameras)e.push(s.matrixWorldInverse);ps===null?ps=Rt(e).setGroup(ot).setName("cameraViewMatrices"):ps.array=e,t=ps.element(i.isMultiViewCamera?De("gl_ViewID_OVR"):ms)}else mn===null&&(mn=Z(i.matrixWorldInverse).setName("cameraViewMatrix").setGroup(ot).onRenderUpdate(({camera:e})=>e.matrixWorldInverse)),t=mn;return t}).once()(),jr=E(({camera:i})=>{let t;if(i.isArrayCamera&&i.cameras.length>0){const e=[];for(const s of i.cameras)e.push(s.matrixWorld);fs===null?fs=Rt(e).setGroup(ot).setName("cameraWorldMatrices"):fs.array=e,t=fs.element(i.isMultiViewCamera?De("gl_ViewID_OVR"):ms)}else gn===null&&(gn=Z(i.matrixWorld).setName("cameraWorldMatrix").setGroup(ot).onRenderUpdate(({camera:e})=>e.matrixWorld)),t=gn;return t}).once()(),Jr=new no;class $ extends C{static get type(){return"Object3DNode"}constructor(t,e=null){super(),this.scope=t,this.object3d=e,this.updateType=D.OBJECT,this.uniformNode=new Oe(null)}generateNodeType(){const t=this.scope;if(t===$.WORLD_MATRIX)return"mat4";if(t===$.POSITION||t===$.VIEW_POSITION||t===$.DIRECTION||t===$.SCALE)return"vec3";if(t===$.RADIUS)return"float"}update(t){const e=this.object3d,s=this.uniformNode,n=this.scope;if(n===$.WORLD_MATRIX)s.value=e.matrixWorld;else if(n===$.POSITION)s.value=s.value||new S,s.value.setFromMatrixPosition(e.matrixWorld);else if(n===$.SCALE)s.value=s.value||new S,s.value.setFromMatrixScale(e.matrixWorld);else if(n===$.DIRECTION)s.value=s.value||new S,e.getWorldDirection(s.value);else if(n===$.VIEW_POSITION){const r=t.camera;s.value=s.value||new S,s.value.setFromMatrixPosition(e.matrixWorld),s.value.applyMatrix4(r.matrixWorldInverse)}else if(n===$.RADIUS){const r=t.object.geometry;r.boundingSphere===null&&r.computeBoundingSphere(),Jr.copy(r.boundingSphere).applyMatrix4(e.matrixWorld),s.value=Jr.radius}}generate(t){const e=this.scope;return e===$.WORLD_MATRIX?this.uniformNode.nodeType="mat4":e===$.POSITION||e===$.VIEW_POSITION||e===$.DIRECTION||e===$.SCALE?this.uniformNode.nodeType="vec3":e===$.RADIUS&&(this.uniformNode.nodeType="float"),this.uniformNode.build(t)}serialize(t){super.serialize(t),t.scope=this.scope}deserialize(t){super.deserialize(t),this.scope=t.scope}}$.WORLD_MATRIX="worldMatrix",$.POSITION="position",$.SCALE="scale",$.VIEW_POSITION="viewPosition",$.DIRECTION="direction",$.RADIUS="radius";class Nt extends ${static get type(){return"ModelNode"}constructor(t){super(t)}update(t){this.object3d=t.object,super.update(t)}}Nt.DIRECTION;const xn=_(Nt,Nt.WORLD_MATRIX);Nt.POSITION,Nt.SCALE,Nt.VIEW_POSITION,Nt.RADIUS;const mc=Z(new Ct).onObjectUpdate(({object:i},t)=>t.value.getNormalMatrix(i.matrixWorld)),Nn=E(i=>i.context.modelViewMatrix||gc).once()().toVar("modelViewMatrix"),gc=yn.mul(xn),yc=E(i=>i.shaderStage!=="fragment"?(kt("TSL: `clipSpace` is only available in fragment stage."),k()):i.context.clipSpace.toVarying("v_clipSpace")).once()(),Tt=Ut("position","vec3"),xc=Tt.toVarying("positionLocal"),Nc=E(i=>xn.mul(xc).xyz.toVarying(i.getSubBuildProperty("v_positionWorld")),"vec3").once(["POSITION"])(),ct=E(i=>{if(i.shaderStage==="fragment"&&i.material.vertexNode){const t=fc.mul(yc);return t.xyz.div(t.w).toVar("positionView")}return i.context.setupPositionView().toVarying("v_positionView")},"vec3").once(["POSITION","VERTEX"])(),Qr=E(i=>{let t;return i.camera.isOrthographicCamera?t=R(0,0,1):t=ct.negate().toVarying("v_positionViewDirection").normalize(),t.toVar("positionViewDirection")},"vec3").once(["POSITION"])();class Tc extends C{static get type(){return"FrontFacingNode"}constructor(){super("bool"),this.isFrontFacingNode=!0}generate(t){if(t.shaderStage!=="fragment")return"true";const{material:e}=t;return e.side===1?"false":t.getFrontFacing()}}const Kr=P(_(Tc)).mul(2).sub(1),gs=E(([i],{material:t})=>{const e=t.side;return e===1?i=i.mul(-1):e===2&&(i=i.mul(Kr)),i}),wc=Ut("normal","vec3"),Sc=E(i=>i.geometry.hasAttribute("normal")===!1?(L(\'TSL: Vertex attribute "normal" not found on geometry.\'),R(0,1,0)):wc,"vec3").once()().toVar("normalLocal"),Mc=ct.dFdx().cross(ct.dFdy()).normalize().toVar("normalFlat"),_c=E(i=>{let t;return i.isFlatShading()?t=Mc:t=ti(Sc).toVarying("v_normalViewGeometry").normalize(),t},"vec3").once()().toVar("normalViewGeometry"),mt=E(i=>{let t;return i.subBuildFn==="NORMAL"||i.subBuildFn==="VERTEX"?(t=_c,i.isFlatShading()!==!0&&(t=gs(t))):t=i.context.setupNormal().context({getUV:null,getTextureLevel:null}),t},"vec3").once(["NORMAL","VERTEX"])().toVar("normalView"),Ec=mt.transformNormalByInverseViewMatrix(yn).toVar("normalWorld"),Ac=E(({subBuildFn:i,context:t})=>{let e;return i==="NORMAL"||i==="VERTEX"?e=mt:e=t.setupClearcoatNormal().context({getUV:null,getTextureLevel:null}),e},"vec3").once(["NORMAL","VERTEX"])().toVar("clearcoatNormalView");y("transformNormal",E(([i,t=xn])=>te(t).inverse().transpose().mul(i).normalize()));const ti=E(([i],t)=>{const e=t.context.modelNormalViewMatrix;return e?i.transformNormalByViewMatrix(e):mc.mul(i).transformNormalByViewMatrix(yn)});E(()=>(L(\'TSL: "transformedNormalView" is deprecated. Use "normalView" instead.\'),mt)).once(["NORMAL","VERTEX"])(),E(()=>(L(\'TSL: "transformedNormalWorld" is deprecated. Use "normalWorld" instead.\'),Ec)).once(["NORMAL","VERTEX"])(),E(()=>(L(\'TSL: "transformedClearcoatNormalView" is deprecated. Use "clearcoatNormalView" instead.\'),Ac)).once(["NORMAL","VERTEX"])();const Tn=new xt,Cc=Z(0).onReference(({material:i})=>i).onObjectUpdate(({material:i})=>i.refractionRatio),vc=Z(new xt).onReference(function(i){return i.material}).onObjectUpdate(function({material:i,scene:t}){const s=(t.environment!==null||t.environmentNode&&t.environmentNode.isNode)&&i.envMap===null?t.environmentRotation:i.envMapRotation;return s?Tn.makeRotationFromEuler(s).transpose():Tn.identity(),Tn}),bc=Qr.negate().reflect(mt),zc=Qr.negate().refract(mt,Cc),Fc=bc.transformDirection(jr).toVar("reflectVector"),Rc=zc.transformDirection(jr).toVar("refractVector"),Ic=new oo;class Lc extends ls{static get type(){return"CubeTextureNode"}constructor(t,e=null,s=null,n=null){super(t,e,s,n),this.isCubeTextureNode=!0}getInputType(){return this.value.isDepthTexture===!0?"cubeDepthTexture":"cubeTexture"}getDefaultUV(){const t=this.value;return t.mapping===301?Fc:t.mapping===302?Rc:(q(\'CubeTextureNode: Mapping "%s" not supported.\',t.mapping),R(0,0,0))}setUpdateMatrix(){}setupUV(t,e){const s=this.value;return s.isDepthTexture===!0?t.renderer.coordinateSystem===2001?R(e.x,e.y.negate(),e.z):e:(e=vc.mul(e),(t.renderer.coordinateSystem===2001||!s.isRenderTargetTexture)&&(e=R(e.x.negate(),e.yz)),e)}generateUV(t,e){return e.build(t,this.sampler===!0?"vec3":"ivec3")}}const Oc=K(Lc).setParameterLength(1,4).setName("cubeTexture"),Pc=(i=Ic,t=null,e=null,s=null)=>{let n;return i&&i.isCubeTextureNode===!0?(n=M(i.clone()),n.referenceNode=i,t!==null&&(n.uvNode=M(t)),e!==null&&(n.levelNode=M(e)),s!==null&&(n.biasNode=M(s))):n=Oc(i,t,e,s),n};class Bc extends Re{static get type(){return"ReferenceElementNode"}constructor(t,e){super(t,e),this.referenceNode=t,this.isReferenceElementNode=!0}generateNodeType(){return this.referenceNode.uniformType}generate(t){const e=super.generate(t),s=this.referenceNode.getNodeType(t),n=this.getNodeType(t);return t.format(e,s,n)}}class ei extends C{static get type(){return"ReferenceNode"}constructor(t,e,s=null,n=null){super(),this.property=t,this.uniformType=e,this.object=s,this.count=n,this.properties=t.split("."),this.reference=s,this.node=null,this.group=null,this.name=null,this.updateType=D.OBJECT}element(t){return new Bc(this,M(t))}setGroup(t){return this.group=t,this}setName(t){return this.name=t,this}label(t){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\'),this.setName(t)}setNodeType(t){let e=null;this.count!==null?e=cc(null,t,this.count):Array.isArray(this.getValueFromReference())?(e=Rt(null,t),e.updateType=D.OBJECT):t==="texture"?e=hc(null):t==="cubeTexture"?e=Pc(null):e=Z(null,t),this.group!==null&&e.setGroup(this.group),this.name!==null&&e.setName(this.name),this.node=e}generateNodeType(t){return this.node===null&&(this.updateReference(t),this.updateValue()),this.node.getNodeType(t)}getValueFromReference(t=this.reference){const{properties:e}=this;let s=t[e[0]];for(let n=1;n<e.length;n++)s=s[e[n]];return s}updateReference(t){return this.reference=this.object!==null?this.object:t.object,this.reference}setup(){return this.updateValue(),this.node}update(){this.updateValue()}updateValue(){this.node===null&&this.setNodeType(this.uniformType);const t=this.getValueFromReference();Array.isArray(t)?this.node.array=t:this.node.value=t}}const si=(i,t,e)=>new ei(i,t,e);class Dc extends ei{static get type(){return"MaterialReferenceNode"}constructor(t,e,s=null){super(t,e,s),this.material=s,this.isMaterialReferenceNode=!0}updateReference(t){return this.reference=this.material!==null?this.material:t.material,this.reference}}const Uc=(i,t,e=null)=>new Dc(i,t,e),ni=Te(),Vc=ct.dFdx(),kc=ct.dFdy(),ri=ni.dFdx(),ii=ni.dFdy(),oi=mt,ai=kc.cross(oi),hi=oi.cross(Vc),wn=ai.mul(ri.x).add(hi.mul(ii.x)),Sn=ai.mul(ri.y).add(hi.mul(ii.y)),ci=wn.dot(wn).max(Sn.dot(Sn)),li=ci.equal(0).select(0,ci.inverseSqrt()),Gc=wn.mul(li).toVar("tangentViewFrame"),$c=Sn.mul(li).toVar("bitangentViewFrame"),ui=Ut("tangent","vec4"),Wc=ui.xyz.toVar("tangentLocal"),di=E(i=>{let t;return i.subBuildFn==="VERTEX"||i.geometry.hasAttribute("tangent")?t=Nn.mul(k(Wc,0)).xyz.toVarying("v_tangentView").normalize():t=Gc,i.isFlatShading()!==!0&&(t=gs(t)),t},"vec3").once(["NORMAL","VERTEX"])().toVar("tangentView"),Hc=E(([i,t],e)=>{let s=i.mul(ui.w).xyz;return e.subBuildFn==="NORMAL"&&e.isFlatShading()!==!0&&(s=s.toVarying(t)),s}).once(["NORMAL"]),qc=te(di,E(i=>{let t;return i.subBuildFn==="VERTEX"||i.geometry.hasAttribute("tangent")?t=Hc(mt.cross(di),"v_bitangentView").normalize():t=$c,i.isFlatShading()!==!0&&(t=gs(t)),t},"vec3").once(["NORMAL","VERTEX"])().toVar("bitangentView"),mt).toVar("TBNViewMatrix"),pi=i=>R(i,rn(Lr(P(1).sub(Pe(i,i)))));class Yc extends et{static get type(){return"NormalMapNode"}constructor(t,e=null){super("vec3"),this.node=t,this.scaleNode=e,this.normalMapType=0,this.unpackNormalMode=""}setup(t){const{normalMapType:e,scaleNode:s,unpackNormalMode:n}=this;let r=this.node.mul(2).sub(1);if(e===0?n==="rg"?r=pi(r.xy):n==="ga"?r=pi(r.yw):n!==""&&q(`THREE.NodeMaterial: Unexpected unpack normal mode: ${n}`):n!==""&&q(`THREE.NodeMaterial: Normal map type \'${e}\' is not compatible with unpack normal mode \'${n}\'`),s!==null){let a=s;t.isFlatShading()===!0&&(a=gs(a)),r=R(r.xy.mul(a),r.z)}let o=null;return e===1?o=ti(r):e===0?o=qc.mul(r).normalize():(q(`NodeMaterial: Unsupported normal map type: ${e}`),o=mt),o}}const fi=K(Yc).setParameterLength(1,2),Xc=E(({textureNode:i,bumpScale:t})=>{const e=n=>i.isolate().context({getUV:r=>n(r.uvNode||Te()),forceUVContext:!0}),s=P(e(n=>n));return Bt(P(e(n=>n.add(n.dFdx()))).sub(s),P(e(n=>n.add(n.dFdy()))).sub(s)).mul(t)}),Zc=E(i=>{const{surf_pos:t,surf_norm:e,dHdxy:s}=i,n=t.dFdx().normalize(),r=t.dFdy().normalize(),o=e,a=r.cross(o),h=o.cross(n),c=n.dot(a).mul(Kr),l=c.sign().mul(s.x.mul(a).add(s.y.mul(h)));return c.abs().mul(e).sub(l).normalize()});class jc extends et{static get type(){return"BumpMapNode"}constructor(t,e=null){super("vec3"),this.textureNode=t,this.scaleNode=e}setup(t){if(t.material.wireframe===!0)return mt;const e=this.scaleNode!==null?this.scaleNode:1,s=Xc({textureNode:this.textureNode,bumpScale:e});return Zc({surf_pos:ct,surf_norm:mt,dHdxy:s})}}const Jc=K(jc).setParameterLength(1,2),mi=new Map;class x extends C{static get type(){return"MaterialNode"}constructor(t){super(),this.scope=t}getCache(t,e){let s=mi.get(t);return s===void 0&&(s=Uc(t,e),mi.set(t,s)),s}getFloat(t){return this.getCache(t,"float")}getColor(t){return this.getCache(t,"color")}getTexture(t){return this.getCache(t==="map"?"map":t+"Map","texture")}setup(t){const e=t.context.material,s=this.scope;let n=null;if(s===x.COLOR){const r=e.color!==void 0?this.getColor(s):R();e.map&&e.map.isTexture===!0?n=r.mul(this.getTexture("map")):n=r}else if(s===x.OPACITY){const r=this.getFloat(s);e.alphaMap&&e.alphaMap.isTexture===!0?n=r.mul(this.getTexture("alpha")):n=r}else if(s===x.SPECULAR_STRENGTH)e.specularMap&&e.specularMap.isTexture===!0?n=this.getTexture("specular").r:n=P(1);else if(s===x.SPECULAR_INTENSITY){const r=this.getFloat(s);e.specularIntensityMap&&e.specularIntensityMap.isTexture===!0?n=r.mul(this.getTexture(s).a):n=r}else if(s===x.SPECULAR_COLOR){const r=this.getColor(s);e.specularColorMap&&e.specularColorMap.isTexture===!0?n=r.mul(this.getTexture(s).rgb):n=r}else if(s===x.ROUGHNESS){const r=this.getFloat(s);e.roughnessMap&&e.roughnessMap.isTexture===!0?n=r.mul(this.getTexture(s).g):n=r}else if(s===x.METALNESS){const r=this.getFloat(s);e.metalnessMap&&e.metalnessMap.isTexture===!0?n=r.mul(this.getTexture(s).b):n=r}else if(s===x.EMISSIVE){const r=this.getFloat("emissiveIntensity"),o=this.getColor(s).mul(r);e.emissiveMap&&e.emissiveMap.isTexture===!0?n=o.mul(this.getTexture(s)):n=o}else if(s===x.NORMAL)e.normalMap?(n=fi(this.getTexture("normal"),this.getCache("normalScale","vec2")),n.normalMapType=e.normalMapType,(e.normalMap.format==1030||e.normalMap.format==36285||e.normalMap.format==37490)&&(n.unpackNormalMode="rg")):e.bumpMap?n=Jc(this.getTexture("bump").r,this.getFloat("bumpScale")):n=mt;else if(s===x.CLEARCOAT){const r=this.getFloat(s);e.clearcoatMap&&e.clearcoatMap.isTexture===!0?n=r.mul(this.getTexture(s).r):n=r}else if(s===x.CLEARCOAT_ROUGHNESS){const r=this.getFloat(s);e.clearcoatRoughnessMap&&e.clearcoatRoughnessMap.isTexture===!0?n=r.mul(this.getTexture(s).r):n=r}else if(s===x.CLEARCOAT_NORMAL)e.clearcoatNormalMap?n=fi(this.getTexture(s),this.getCache(s+"Scale","vec2")):n=mt;else if(s===x.SHEEN){const r=this.getColor("sheenColor").mul(this.getFloat("sheen"));e.sheenColorMap&&e.sheenColorMap.isTexture===!0?n=r.mul(this.getTexture("sheenColor").rgb):n=r}else if(s===x.SHEEN_ROUGHNESS){const r=this.getFloat(s);e.sheenRoughnessMap&&e.sheenRoughnessMap.isTexture===!0?n=r.mul(this.getTexture(s).a):n=r,n=n.clamp(1e-4,1)}else if(s===x.ANISOTROPY)if(e.anisotropyMap&&e.anisotropyMap.isTexture===!0){const r=this.getTexture(s);n=Nr(We.x,We.y,We.y.negate(),We.x).mul(r.rg.mul(2).sub(Bt(1)).normalize().mul(r.b))}else n=We;else if(s===x.IRIDESCENCE_THICKNESS){const r=si("1","float",e.iridescenceThicknessRange);if(e.iridescenceThicknessMap){const o=si("0","float",e.iridescenceThicknessRange);n=r.sub(o).mul(this.getTexture(s).g).add(o)}else n=r}else if(s===x.TRANSMISSION){const r=this.getFloat(s);e.transmissionMap?n=r.mul(this.getTexture(s).r):n=r}else if(s===x.THICKNESS){const r=this.getFloat(s);e.thicknessMap?n=r.mul(this.getTexture(s).g):n=r}else if(s===x.IOR)n=this.getFloat(s);else if(s===x.LIGHT_MAP)e.lightMap?n=this.getTexture(s).rgb.mul(this.getFloat("lightMapIntensity")):n=R(0);else if(s===x.AO)e.aoMap?n=this.getTexture(s).r.sub(1).mul(this.getFloat("aoMapIntensity")).add(1):n=P(1);else if(s===x.LINE_DASH_OFFSET)n=e.dashOffset?this.getFloat(s):P(0);else{const r=this.getNodeType(t);n=this.getCache(s,r)}return n}}x.ALPHA_TEST="alphaTest",x.COLOR="color",x.OPACITY="opacity",x.SHININESS="shininess",x.SPECULAR="specular",x.SPECULAR_STRENGTH="specularStrength",x.SPECULAR_INTENSITY="specularIntensity",x.SPECULAR_COLOR="specularColor",x.REFLECTIVITY="reflectivity",x.ROUGHNESS="roughness",x.METALNESS="metalness",x.NORMAL="normal",x.CLEARCOAT="clearcoat",x.CLEARCOAT_ROUGHNESS="clearcoatRoughness",x.CLEARCOAT_NORMAL="clearcoatNormal",x.EMISSIVE="emissive",x.ROTATION="rotation",x.SHEEN="sheen",x.SHEEN_ROUGHNESS="sheenRoughness",x.ANISOTROPY="anisotropy",x.IRIDESCENCE="iridescence",x.IRIDESCENCE_IOR="iridescenceIOR",x.IRIDESCENCE_THICKNESS="iridescenceThickness",x.IOR="ior",x.TRANSMISSION="transmission",x.THICKNESS="thickness",x.ATTENUATION_DISTANCE="attenuationDistance",x.ATTENUATION_COLOR="attenuationColor",x.LINE_SCALE="scale",x.LINE_DASH_SIZE="dashSize",x.LINE_GAP_SIZE="gapSize",x.LINE_WIDTH="linewidth",x.LINE_DASH_OFFSET="dashOffset",x.POINT_SIZE="size",x.DISPERSION="dispersion",x.LIGHT_MAP="light",x.AO="ao",x.ALPHA_TEST,x.COLOR,x.SHININESS,x.EMISSIVE,x.OPACITY,x.SPECULAR,x.SPECULAR_INTENSITY,x.SPECULAR_COLOR,x.SPECULAR_STRENGTH,x.REFLECTIVITY,x.ROUGHNESS,x.METALNESS,x.NORMAL,x.CLEARCOAT,x.CLEARCOAT_ROUGHNESS,x.CLEARCOAT_NORMAL,x.ROTATION,x.SHEEN,x.SHEEN_ROUGHNESS,x.ANISOTROPY,x.IRIDESCENCE,x.IRIDESCENCE_IOR,x.IRIDESCENCE_THICKNESS,x.TRANSMISSION,x.THICKNESS,x.IOR,x.ATTENUATION_DISTANCE,x.ATTENUATION_COLOR;const Qc=_(x,x.LINE_SCALE),Kc=_(x,x.LINE_DASH_SIZE),tl=_(x,x.LINE_GAP_SIZE),Mn=_(x,x.LINE_WIDTH),el=_(x,x.LINE_DASH_OFFSET);x.POINT_SIZE,x.DISPERSION,x.LIGHT_MAP,x.AO;const We=Z(new Mt).onReference(function(i){return i.material}).onRenderUpdate(function({material:i}){this.value.set(i.anisotropy*Math.cos(i.anisotropyRotation),i.anisotropy*Math.sin(i.anisotropyRotation))});class gt extends C{static get type(){return"EventNode"}constructor(t,e){super("void"),this.eventType=t,this.callback=e,t===gt.OBJECT?this.updateType=D.OBJECT:t===gt.MATERIAL?this.updateType=D.RENDER:t===gt.FRAME?this.updateType=D.FRAME:t===gt.BEFORE_OBJECT?this.updateBeforeType=D.OBJECT:t===gt.BEFORE_MATERIAL?this.updateBeforeType=D.RENDER:t===gt.BEFORE_FRAME&&(this.updateBeforeType=D.FRAME)}update(t){this.callback(t)}updateBefore(t){this.callback(t)}}gt.OBJECT="object",gt.MATERIAL="material",gt.FRAME="frame",gt.BEFORE_OBJECT="beforeObject",gt.BEFORE_MATERIAL="beforeMaterial",gt.BEFORE_FRAME="beforeFrame";class sl extends C{static get type(){return"LoopNode"}constructor(t=[]){super("void"),this.params=t}getVarName(t){return String.fromCharCode(105+t)}getProperties(t){const e=t.getNodeProperties(this);if(e.stackNode!==void 0)return e;const s={};for(let a=0,h=this.params.length-1;a<h;a++){const c=this.params[a],l=c.isNode!==!0&&c.name||this.getVarName(a),u=c.isNode!==!0&&c.type||"int";s[l]=Dt(l,u)}const n=t.addStack(),r=this.params[this.params.length-1](s);e.returnsNode=r.context({nodeLoop:r}),e.stackNode=n;const o=this.params[0];if(o.isNode!==!0&&typeof o.update=="function"){const a=E(this.params[0].update)(s);e.updateNode=a.context({nodeLoop:a})}return t.removeStack(),e}setup(t){if(this.getProperties(t),t.fnCall){const e=t.getDataFromNode(t.fnCall.shaderNode);e.hasLoop=!0}}generate(t){const e=this.getProperties(t),s=this.params,n=e.stackNode;for(let o=0,a=s.length-1;o<a;o++){const h=s[o];let c=!1,l=null,u=null,p=null,d=null,f=null,g=null;h.isNode?h.getNodeType(t)==="bool"?(c=!0,d="bool",u=h.build(t,d)):(d="int",p=this.getVarName(o),l="0",u=h.build(t,d),f="<"):(d=h.type||"int",p=h.name||this.getVarName(o),l=h.start,u=h.end,f=h.condition,g=h.update,typeof l=="number"?l=t.generateConst(d,l):l&&l.isNode&&(l=l.build(t,d)),typeof u=="number"?u=t.generateConst(d,u):u&&u.isNode&&(u=u.build(t,d)),l!==void 0&&u===void 0?(l=l+" - 1",u="0",f=">="):u!==void 0&&l===void 0&&(l="0",f="<"),f===void 0&&(Number(l)>Number(u)?f=">=":f="<"));let N;if(c)N=`while ( ${u} )`;else{const T={start:l,end:u},A=T.start,v=T.end;let z;const b=()=>f.includes("<")?"+=":"-=";if(g!=null)switch(typeof g){case"function":z=t.flowStagesNode(e.updateNode,"void").code.replace(/\\t|;/g,"");break;case"number":z=p+" "+b()+" "+t.generateConst(d,g);break;case"string":z=p+" "+g;break;default:g.isNode?z=p+" "+b()+" "+g.build(t):(q("TSL: \'Loop( { update: ... } )\' is not a function, string or number.",this.stackTrace),z="break /* invalid update */")}else d==="int"||d==="uint"?g=f.includes("<")?"++":"--":g=b()+" 1.",z=p+" "+g;const F=t.getVar(d,p)+" = "+A,I=p+" "+f+" "+v;N=`for ( ${F}; ${I}; ${z} )`}t.addFlowCode((o===0?`\n`:"")+t.tab+N+` {\n\n`).addFlowTab()}const r=n.build(t,"void");e.returnsNode.build(t,"void"),t.removeFlowTab().addFlowCode(`\n`+t.tab+r);for(let o=0,a=this.params.length-1;o<a;o++)t.addFlowCode((o===0?"":t.tab)+`}\n\n`).removeFlowTab();t.addFlowTab()}}const He=(...i)=>new sl(ye(i,"int")).toStack(),ne=new Mt;class nl extends ls{static get type(){return"ViewportTextureNode"}constructor(t=dn,e=null,s=null){let n=null;s===null?(n=new io,n.minFilter=1008,s=n):n=s,super(s,t,e),this.generateMipmaps=!1,this.defaultFramebuffer=n,this.isOutputTextureNode=!0,this.updateBeforeType=D.RENDER,this._cacheTextures=new WeakMap}getTextureForReference(t=null){let e,s;if(this.referenceNode?(e=this.referenceNode.defaultFramebuffer,s=this.referenceNode._cacheTextures):(e=this.defaultFramebuffer,s=this._cacheTextures),t===null)return e;if(s.has(t)===!1){const n=e.clone();s.set(t,n)}return s.get(t)}updateReference(t){const e=t.renderer,s=e.getRenderTarget(),n=e.getCanvasTarget(),r=s||n;return this.value=this.getTextureForReference(r),this.value}updateBefore(t){const e=t.renderer,s=e.getRenderTarget(),n=e.getCanvasTarget(),r=s||n;r===null?e.getDrawingBufferSize(ne):r.getDrawingBufferSize?r.getDrawingBufferSize(ne):ne.set(r.width,r.height);const o=this.getTextureForReference(r);(o.image.width!==ne.width||o.image.height!==ne.height)&&(o.image.width=ne.width,o.image.height=ne.height,o.needsUpdate=!0);const a=o.generateMipmaps;o.generateMipmaps=this.generateMipmaps,e.copyFramebufferToTexture(o),o.generateMipmaps=a}clone(){const t=new this.constructor(this.uvNode,this.levelNode,this.value);return t.generateMipmaps=this.generateMipmaps,t}}let _n=null;class rl extends nl{static get type(){return"ViewportDepthTextureNode"}constructor(t=dn,e=null,s=null){s===null&&(_n===null&&(_n=new Gs),s=_n),super(t,e,s)}}const il=K(rl).setParameterLength(0,3);class dt extends C{static get type(){return"ViewportDepthNode"}constructor(t,e=null){super("float"),this.scope=t,this.valueNode=e,this.isViewportDepthNode=!0}generate(t){const{scope:e}=this;return e===dt.DEPTH_BASE?t.getFragDepth():super.generate(t)}setup({camera:t}){const{scope:e}=this,s=this.valueNode;let n=null;if(e===dt.DEPTH_BASE)s!==null&&(n=yi().assign(s));else if(e===dt.DEPTH)t.isPerspectiveCamera?n=ol(ct.z,Ge,$e):n=ys(ct.z,Ge,$e);else if(e===dt.LINEAR_DEPTH)if(s!==null)if(t.isPerspectiveCamera){const r=gi(s,Ge,$e);n=ys(r,Ge,$e)}else n=s;else n=ys(ct.z,Ge,$e);return n}}dt.DEPTH_BASE="depthBase",dt.DEPTH="depth",dt.LINEAR_DEPTH="linearDepth";const ys=(i,t,e)=>i.add(t).div(t.sub(e)),ol=(i,t,e)=>t.add(i).mul(e).div(e.sub(t).mul(i)),gi=E(([i,t,e],s)=>s.renderer.reversedDepthBuffer===!0?t.mul(e).div(t.sub(e).mul(i).sub(t)):t.mul(e).div(e.sub(t).mul(i).sub(e))),yi=K(dt,dt.DEPTH_BASE),al=_(dt,dt.DEPTH);il(),al.assign=i=>yi(i);class re extends C{static get type(){return"ClippingNode"}constructor(t=re.DEFAULT){super(),this.scope=t}setup(t){super.setup(t);const e=t.clippingContext,{intersectionPlanes:s,unionPlanes:n}=e;return this.hardwareClipping=t.hardwareClipping,this.scope===re.ALPHA_TO_COVERAGE?this.setupAlphaToCoverage(s,n):this.scope===re.HARDWARE?this.setupHardwareClipping(n,t):this.setupDefault(s,n)}setupAlphaToCoverage(t,e){return E(()=>{const s=P().toVar("distanceToPlane"),n=P().toVar("distanceToGradient"),r=P(1).toVar("clipOpacity"),o=e.length;if(this.hardwareClipping===!1&&o>0){const h=Rt(e).setGroup(ot);He(o,({i:c})=>{const l=h.element(c);s.assign(ct.dot(l.xyz).negate().add(l.w)),n.assign(s.fwidth().div(2)),r.mulAssign(se(n.negate(),n,s))})}const a=t.length;if(a>0){const h=Rt(t).setGroup(ot),c=P(1).toVar("intersectionClipOpacity");He(a,({i:l})=>{const u=h.element(l);s.assign(ct.dot(u.xyz).negate().add(u.w)),n.assign(s.fwidth().div(2)),c.mulAssign(se(n.negate(),n,s).oneMinus())}),r.mulAssign(c.oneMinus())}wr.a.mulAssign(r),wr.a.equal(0).discard()})()}setupDefault(t,e){return E(()=>{const s=e.length;if(this.hardwareClipping===!1&&s>0){const r=Rt(e).setGroup(ot);He(s,({i:o})=>{const a=r.element(o);ct.dot(a.xyz).greaterThan(a.w).discard()})}const n=t.length;if(n>0){const r=Rt(t).setGroup(ot),o=tn(!0).toVar("clipped");He(n,({i:a})=>{const h=r.element(a);o.assign(ct.dot(h.xyz).greaterThan(h.w).and(o))}),o.discard()}})()}setupHardwareClipping(t,e){const s=t.length;return e.enableHardwareClipping(s),E(()=>{const n=Rt(t).setGroup(ot),r=De(e.getClipDistance());He(s,({i:o})=>{const a=n.element(o),h=ct.dot(a.xyz).sub(a.w).negate();r.element(o).assign(h)})})()}}re.ALPHA_TO_COVERAGE="alphaToCoverage",re.DEFAULT="default",re.HARDWARE="hardware";const xs=as("vec3","worldStart"),En=as("vec3","worldEnd"),xi=as("float","lineDistance"),ie=as("vec4","worldPos"),Ni=E(({start:i,end:t})=>{const e=we.element(2).element(2),s=we.element(3).element(2);return e.greaterThan(0).select(s.negate().div(e.add(1)),s.mul(-.5).div(e)).sub(i.z).div(t.z.sub(i.z))},{start:"vec4",end:"vec4",return:"float"}),hl=E(({p1:i,p2:t,p3:e,p4:s})=>{const n=i.sub(e),r=s.sub(e),o=t.sub(i),a=n.dot(r),h=r.dot(o),c=n.dot(o),l=r.dot(r),p=o.dot(o).mul(l).sub(h.mul(h)),f=a.mul(h).sub(c.mul(l)).div(p).clamp(),g=a.add(h.mul(f)).div(l).clamp();return Bt(f,g)},{p1:"vec3",p2:"vec3",p3:"vec3",p4:"vec3",return:"vec2"});E(({material:i})=>{const t=i._useDash,e=i._useWorldUnits,s=Ut("instanceStart"),n=Ut("instanceEnd"),r=k(Nn.mul(k(s,1))).toVar("start"),o=k(Nn.mul(k(n,1))).toVar("end");let a,h;t&&(a=P(Ut("instanceDistanceStart")).toVar("distanceStart"),h=P(Ut("instanceDistanceEnd")).toVar("distanceEnd")),e&&(xs.assign(r.xyz),En.assign(o.xyz));const c=ke.z.div(ke.w),l=we.element(2).element(3).equal(-1);if(ut(l,()=>{ut(r.z.lessThan(0).and(o.z.greaterThan(0)),()=>{const T=Ni({start:r,end:o});o.assign(k(Xt(r.xyz,o.xyz,T),o.w)),t&&h.assign(Xt(a,h,T))}).ElseIf(o.z.lessThan(0).and(r.z.greaterThanEqual(0)),()=>{const T=Ni({start:o,end:r});r.assign(k(Xt(o.xyz,r.xyz,T),r.w)),t&&a.assign(Xt(h,a,T))})}),t){const T=i.dashScaleNode?P(i.dashScaleNode):Qc,A=i.offsetNode?P(i.offsetNode):el;let v=Tt.y.lessThan(.5).select(T.mul(a),T.mul(h));v=v.add(A),xi.assign(v)}const u=we.mul(r),p=we.mul(o),d=u.xyz.div(u.w),f=p.xyz.div(p.w),g=f.xy.sub(d.xy).toVar();g.x.assign(g.x.mul(c)),g.assign(g.normalize());const N=k().toVar();if(e){const T=o.xyz.sub(r.xyz).normalize(),A=Xt(r.xyz,o.xyz,.5).normalize(),v=T.cross(A).normalize(),z=T.cross(v);ie.assign(Tt.y.lessThan(.5).select(r,o));const b=Mn.mul(.5);ie.addAssign(k(Tt.x.lessThan(0).select(v.mul(b),v.mul(b).negate()),0)),t||(ie.addAssign(k(Tt.y.lessThan(.5).select(T.mul(b).negate(),T.mul(b)),0)),ie.addAssign(k(z.mul(b),0)),ut(Tt.y.greaterThan(1).or(Tt.y.lessThan(0)),()=>{ie.subAssign(k(z.mul(2).mul(b),0))})),N.assign(we.mul(ie));const F=R().toVar();F.assign(Tt.y.lessThan(.5).select(d,f)),N.z.assign(F.z.mul(N.w))}else{const T=Bt(g.y,g.x.negate()).toVar("offset");g.x.assign(g.x.div(c)),T.x.assign(T.x.div(c)),T.assign(Tt.x.lessThan(0).select(T.negate(),T)),ut(Tt.y.lessThan(0),()=>{T.assign(T.sub(g))}).ElseIf(Tt.y.greaterThan(1),()=>{T.assign(T.add(g))}),T.assign(T.mul(Mn)),T.assign(T.div(ke.w.div(pc))),N.assign(Tt.y.lessThan(.5).select(u,p)),T.assign(T.mul(N.w)),N.assign(N.add(k(T,0,0)))}return N})(),E(({material:i,renderer:t})=>{const e=i._useAlphaToCoverage,s=i._useDash,n=i._useWorldUnits,r=Te();if(s){const a=i.dashSizeNode?P(i.dashSizeNode):Kc,h=i.gapSizeNode?P(i.gapSizeNode):tl;en.assign(a),Mr.assign(h),r.y.lessThan(-1).or(r.y.greaterThan(1)).discard(),xi.mod(en.add(Mr)).greaterThan(en).discard()}const o=P(1).toVar("alpha");if(n){const a=ie.xyz.normalize().mul(1e5),h=En.sub(xs),c=hl({p1:xs,p2:En,p3:R(0,0,0),p4:a}),l=xs.add(h.mul(c.x)),u=a.mul(c.y),f=l.sub(u).length().div(Mn);if(!s)if(e&&t.currentSamples>0){const g=f.fwidth();o.assign(se(g.negate().add(.5),g.add(.5),f).oneMinus())}else f.greaterThan(.5).discard()}else if(e&&t.currentSamples>0){const a=r.x,h=r.y.greaterThan(0).select(r.y.sub(1),r.y.add(1)),c=a.mul(a).add(h.mul(h)),l=P(c.fwidth()).toVar("dlen");ut(r.y.abs().greaterThan(1),()=>{o.assign(se(l.oneMinus(),l.add(1),c).oneMinus())})}else ut(r.y.abs().greaterThan(1),()=>{const a=r.x,h=r.y.greaterThan(0).select(r.y.sub(1),r.y.add(1));a.mul(a).add(h.mul(h)).greaterThan(1).discard()});return o})(),R(.04),P(1);const An=E(([i,t])=>{const e=i.toVar();e.assign(Yt(2,e).sub(1));const s=R(e,1).toVar();return ut(t.equal(0),()=>{s.assign(s.zyx)}).ElseIf(t.equal(1),()=>{s.assign(s.xzy),s.xz.mulAssign(-1)}).ElseIf(t.equal(2),()=>{s.x.mulAssign(-1)}).ElseIf(t.equal(3),()=>{s.assign(s.zyx),s.xz.mulAssign(-1)}).ElseIf(t.equal(4),()=>{s.assign(s.xzy),s.xy.mulAssign(-1)}).ElseIf(t.equal(5),()=>{s.z.mulAssign(-1)}),s}).setLayout({name:"getDirection",type:"vec3",inputs:[{name:"uv",type:"vec2"},{name:"face",type:"float"}]})(Te(),Ut("faceIndex")).normalize();An.x,An.y,An.z,ee("vec3"),ee("vec3"),ee("vec3");class Ti extends Or{static get type(){return"OverrideContextNode"}constructor(t,e=null){super(e,{overrideNodes:t}),this.isOverrideContextNode=!0}getFlowContextData(){const t=[];this.traverse(n=>{n.isOverrideContextNode===!0&&t.push(n.value.overrideNodes)});const e=new Map(t.flatMap(n=>Array.from(n.entries()))),s=super.getFlowContextData();return s.overrideNodes=e,s}}function cl(i,t=null,e=null){if(t&&t.isNode){const s=t;t=()=>s}return new Ti(new Map([[i,t]]),e)}y("overrideNode",(i,t,e)=>cl(t,e,i));function ll(i,t=null){const e=new Map;for(const[s,n]of i){const r=n!==null?typeof n=="function"?n:()=>n:null;e.set(s,r)}return new Ti(e,t)}y("overrideNodes",(i,t)=>ll(t,i));class wi extends et{static get type(){return"BitcastNode"}constructor(t,e,s=null){super(),this.valueNode=t,this.conversionType=e,this.inputType=s,this.isBitcastNode=!0}generateNodeType(t){if(this.inputType!==null){const e=this.valueNode.getNodeType(t),s=t.getTypeLength(e);return t.getTypeFromLength(s,this.conversionType)}return this.conversionType}generate(t){const e=this.getNodeType(t);let s="";if(this.inputType!==null){const n=this.valueNode.getNodeType(t);s=t.getTypeLength(n)===1?this.inputType:t.changeComponentType(n,this.inputType)}else s=this.valueNode.getNodeType(t);return`${t.getBitcastMethod(e,s)}( ${this.valueNode.build(t,s)} )`}}const ul=w(wi).setParameterLength(2),dl=i=>new wi(i,"uint","float"),Ns={};class oe extends m{static get type(){return"BitcountNode"}constructor(t,e){super(t,e),this.isBitcountNode=!0}_resolveElementType(t,e,s){s==="int"?e.assign(ul(t,"uint")):e.assign(t)}_returnDataNode(t){switch(t){case"uint":return st;case"int":return Le;case"uvec2":return fr;case"uvec3":return gr;case"uvec4":return xr;case"ivec2":return pr;case"ivec3":return mr;case"ivec4":return yr}}_createTrailingZerosBaseLayout(t,e){const s=this._returnDataNode(e);return E(([r])=>{const o=st(0);this._resolveElementType(r,o,e);const a=P(o.bitAnd(zr(o))),c=dl(a).shiftRight(23).sub(127);return s(c)}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}_createLeadingZerosBaseLayout(t,e){const s=this._returnDataNode(e);return E(([r])=>{ut(r.equal(st(0)),()=>st(32));const o=st(0),a=st(0);return this._resolveElementType(r,o,e),ut(o.shiftRight(16).equal(0),()=>{a.addAssign(16),o.shiftLeftAssign(16)}),ut(o.shiftRight(24).equal(0),()=>{a.addAssign(8),o.shiftLeftAssign(8)}),ut(o.shiftRight(28).equal(0),()=>{a.addAssign(4),o.shiftLeftAssign(4)}),ut(o.shiftRight(30).equal(0),()=>{a.addAssign(2),o.shiftLeftAssign(2)}),ut(o.shiftRight(31).equal(0),()=>{a.addAssign(1)}),s(a)}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}_createOneBitsBaseLayout(t,e){const s=this._returnDataNode(e);return E(([r])=>{const o=st(0);this._resolveElementType(r,o,e),o.assign(o.sub(o.shiftRight(st(1)).bitAnd(st(1431655765)))),o.assign(o.bitAnd(st(858993459)).add(o.shiftRight(st(2)).bitAnd(st(858993459))));const a=o.add(o.shiftRight(st(4))).bitAnd(st(252645135)).mul(st(16843009)).shiftRight(st(24));return s(a)}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}_createMainLayout(t,e,s,n){const r=this._returnDataNode(e);return E(([a])=>{if(s===1)return r(n(a));{const h=r(0),c=["x","y","z","w"];for(let l=0;l<s;l++){const u=c[l];h[u].assign(n(a[u]))}return h}}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}setup(t){const{method:e,aNode:s}=this,{renderer:n}=t;if(n.backend.isWebGPUBackend)return super.setup(t);const r=this.getInputType(t),o=t.getElementType(r),a=t.getTypeLength(r),h=`${e}_base_${o}`,c=`${e}_${r}`;let l=Ns[h];if(l===void 0){switch(e){case oe.COUNT_LEADING_ZEROS:{l=this._createLeadingZerosBaseLayout(h,o);break}case oe.COUNT_TRAILING_ZEROS:{l=this._createTrailingZerosBaseLayout(h,o);break}case oe.COUNT_ONE_BITS:{l=this._createOneBitsBaseLayout(h,o);break}}Ns[h]=l}let u=Ns[c];return u===void 0&&(u=this._createMainLayout(c,r,a,l),Ns[c]=u),E(()=>u(s))()}}oe.COUNT_TRAILING_ZEROS="countTrailingZeros",oe.COUNT_LEADING_ZEROS="countLeadingZeros",oe.COUNT_ONE_BITS="countOneBits",new xt;const pl=new Xn;dn.flipX(),pl.depthTexture=new Gs(1,1),E(([i])=>cs(P(52.9829189).mul(cs(Pe(i,Bt(.06711056,.00583715)))))).setLayout({name:"interleavedGradientNoise",type:"float",inputs:[{name:"position",type:"vec2"}]}),E(([i,t,e])=>{const s=P(2.399963229728653),n=rn(P(i).add(.5).div(P(t))),r=P(i).mul(s).add(e);return Bt(vr(r),on(r)).mul(n)}).setLayout({name:"vogelDiskSample",type:"vec2",inputs:[{name:"sampleIndex",type:"int"},{name:"samplesCount",type:"int"},{name:"phi",type:"float"}]});class fl extends nr{constructor(t,e,s=Float32Array){const n=ArrayBuffer.isView(t)?t:new s(t*e);super(n,e),this.isStorageBufferAttribute=!0}}E(({texture:i,uv:t})=>{const s=R().toVar();return ut(t.x.lessThan(1e-4),()=>{s.assign(R(1,0,0))}).ElseIf(t.y.lessThan(1e-4),()=>{s.assign(R(0,1,0))}).ElseIf(t.z.lessThan(1e-4),()=>{s.assign(R(0,0,1))}).ElseIf(t.x.greaterThan(1-1e-4),()=>{s.assign(R(-1,0,0))}).ElseIf(t.y.greaterThan(1-1e-4),()=>{s.assign(R(0,-1,0))}).ElseIf(t.z.greaterThan(1-1e-4),()=>{s.assign(R(0,0,-1))}).Else(()=>{const r=i.sample(t.add(R(-.01,0,0))).r.sub(i.sample(t.add(R(.01,0,0))).r),o=i.sample(t.add(R(0,-.01,0))).r.sub(i.sample(t.add(R(0,.01,0))).r),a=i.sample(t.add(R(0,0,-.01))).r.sub(i.sample(t.add(R(0,0,.01))).r);s.assign(R(r,o,a))}),s.normalize()}),E(([i,t])=>i.mul(t).floor().div(t));const Ts=new Mt;class ml extends ls{static get type(){return"PassTextureNode"}constructor(t,e){super(e),this.passNode=t,this.isPassTextureNode=!0,this.setUpdateMatrix(!1)}setup(t){const e=t.getNodeProperties(this);return e.passNode=this.passNode,super.setup(t)}clone(){return new this.constructor(this.passNode,this.value)}}class Si extends ml{static get type(){return"PassMultipleTextureNode"}constructor(t,e,s=!1){super(t,null),this.textureName=e,this.previousTexture=s,this.isPassMultipleTextureNode=!0}updateTexture(){this.value=this.previousTexture?this.passNode.getPreviousTexture(this.textureName):this.passNode.getTexture(this.textureName)}setup(t){return this.updateTexture(),super.setup(t)}clone(){const t=new this.constructor(this.passNode,this.textureName,this.previousTexture);return t.uvNode=this.uvNode,t.levelNode=this.levelNode,t.biasNode=this.biasNode,t.sampler=this.sampler,t.depthNode=this.depthNode,t.compareNode=this.compareNode,t.gradNode=this.gradNode,t.gatherNode=this.gatherNode,t.offsetNode=this.offsetNode,t}}class qe extends et{static get type(){return"PassNode"}constructor(t,e,s,n={}){super("vec4"),this.scope=t,this.scene=e,this.camera=s,this.options=n,this._width=1,this._height=1;const r=new Xn(this._width,this._height,{type:1016,...n});r.texture.name="output";let o=null;(this.scope===qe.DEPTH||n.depthBuffer!==!1)&&(o=new Gs,o.isRenderTargetTexture=!0,o.name="depth",r.depthTexture=o),this.renderTarget=r,this.overrideMaterial=null,this.transparent=!0,this.opaque=!0,this.contextNode=null,this._contextNodeCache=null,this._textures={output:r.texture},o!==null&&(this._textures.depth=o),this._textureNodes={},this._linearDepthNodes={},this._viewZNodes={},this._previousTextures={},this._previousTextureNodes={},this._cameraNear=Z(0),this._cameraFar=Z(0),this._mrt=null,this._layers=null,this._resolutionScale=1,this._viewport=null,this._scissor=null,this.isPassNode=!0,this.updateBeforeType=D.FRAME,this.global=!0}setResolutionScale(t){return this._resolutionScale=t,this}getResolutionScale(){return this._resolutionScale}setResolution(t){return L("PassNode: .setResolution() is deprecated. Use .setResolutionScale() instead."),this.setResolutionScale(t)}getResolution(){return L("PassNode: .getResolution() is deprecated. Use .getResolutionScale() instead."),this.getResolutionScale()}setLayers(t){return this._layers=t,this}getLayers(){return this._layers}setMRT(t){return this._mrt=t,this}getMRT(){return this._mrt}getTexture(t){let e=this._textures[t];if(e===void 0){if(t==="depth")throw new Error("THREE.PassNode: Depth texture is not available for this pass.");e=this.renderTarget.texture.clone(),e.name=t,this._textures[t]=e,this.renderTarget.textures.push(e)}return e}getPreviousTexture(t){let e=this._previousTextures[t];return e===void 0&&(e=this.getTexture(t).clone(),this._previousTextures[t]=e),e}toggleTexture(t){const e=this._previousTextures[t];if(e!==void 0){const s=this._textures[t],n=this.renderTarget.textures.indexOf(s);this.renderTarget.textures[n]=e,this._textures[t]=e,this._previousTextures[t]=s,this._textureNodes[t].updateTexture(),this._previousTextureNodes[t].updateTexture()}}getTextureNode(t="output"){let e=this._textureNodes[t];return e===void 0&&(e=new Si(this,t),e.updateTexture(),this._textureNodes[t]=e),e}getPreviousTextureNode(t="output"){let e=this._previousTextureNodes[t];return e===void 0&&(this._textureNodes[t]===void 0&&this.getTextureNode(t),e=new Si(this,t,!0),e.updateTexture(),this._previousTextureNodes[t]=e),e}getViewZNode(t="depth"){let e=this._viewZNodes[t];if(e===void 0){const s=this._cameraNear,n=this._cameraFar;this._viewZNodes[t]=e=gi(this.getTextureNode(t),s,n)}return e}getLinearDepthNode(t="depth"){let e=this._linearDepthNodes[t];if(e===void 0){const s=this._cameraNear,n=this._cameraFar,r=this.getViewZNode(t);this._linearDepthNodes[t]=e=ys(r,s,n)}return e}async compileAsync(t){const e=t.getRenderTarget(),s=t.getMRT();t.setRenderTarget(this.renderTarget),t.setMRT(this._mrt),await t.compileAsync(this.scene,this.camera),t.setRenderTarget(e),t.setMRT(s)}setup({renderer:t}){return this.renderTarget.samples=this.options.samples===void 0?t.samples:this.options.samples,this.renderTarget.texture.type=t.getOutputBufferType(),t.reversedDepthBuffer===!0&&this.renderTarget.depthTexture!==null&&(this.renderTarget.depthTexture.type=1015),this.scope===qe.COLOR?this.getTextureNode():this.getLinearDepthNode()}updateBefore(t){const{renderer:e}=t,{scene:s}=this;let n;const r=e.getOutputRenderTarget();r&&r.isXRRenderTarget===!0?(n=e.xr.getCamera(),e.xr.updateCamera(n),Ts.set(r.width,r.height)):(n=this.camera,e.getDrawingBufferSize(Ts)),this.setSize(Ts.width,Ts.height);const o=e.getRenderTarget(),a=e.getMRT(),h=e.autoClear,c=e.transparent,l=e.opaque,u=n.layers.mask,p=e.contextNode,d=s.overrideMaterial;this._cameraNear.value=n.near,this._cameraFar.value=n.far,this._layers!==null&&(n.layers.mask=this._layers.mask);for(const g in this._previousTextures)this.toggleTexture(g);this.overrideMaterial!==null&&(s.overrideMaterial=this.overrideMaterial),e.setRenderTarget(this.renderTarget),e.setMRT(this._mrt),e.autoClear=!0,e.transparent=this.transparent,e.opaque=this.opaque,this.contextNode!==null&&((this._contextNodeCache===null||this._contextNodeCache.version!==this.version)&&(this._contextNodeCache={version:this.version,context:Ne({...e.contextNode.getFlowContextData(),...this.contextNode.getFlowContextData()})}),e.contextNode=this._contextNodeCache.context);const f=s.name;s.name=this.name?this.name:s.name,e.render(s,n),s.name=f,s.overrideMaterial=d,e.setRenderTarget(o),e.setMRT(a),e.autoClear=h,e.transparent=c,e.opaque=l,e.contextNode=p,n.layers.mask=u}setSize(t,e){this._width=t,this._height=e;const s=Math.floor(this._width*this._resolutionScale),n=Math.floor(this._height*this._resolutionScale);this.renderTarget.setSize(s,n),this._scissor!==null?(this.renderTarget.scissor.copy(this._scissor).multiplyScalar(this._resolutionScale).floor(),this.renderTarget.scissorTest=!0):this.renderTarget.scissorTest=!1,this._viewport!==null&&this.renderTarget.viewport.copy(this._viewport).multiplyScalar(this._resolutionScale).floor()}setScissor(t,e,s,n){t===null?this._scissor=null:(this._scissor===null&&(this._scissor=new Gt),t.isVector4?this._scissor.copy(t):this._scissor.set(t,e,s,n))}setViewport(t,e,s,n){t===null?this._viewport=null:(this._viewport===null&&(this._viewport=new Gt),t.isVector4?this._viewport.copy(t):this._viewport.set(t,e,s,n))}dispose(){this.renderTarget.dispose()}}qe.COLOR="color",qe.DEPTH="depth",R(1.6605,-.1246,-.0182),R(-.5876,1.1329,-.1006),R(-.0728,-.0083,1.1187),R(.6274,.0691,.0164),R(.3293,.9195,.088),R(.0433,.0113,.8956);class Y extends C{static get type(){return"CodeNode"}constructor(t="",e=[],s=""){super("code"),this.isCodeNode=!0,this.global=!0,this.code=t,this.includes=e,this.language=s}setIncludes(t){return this.includes=t,this}getIncludes(){return this.includes}generate(t){const e=this.getIncludes(t);for(const n of e)n.build(t);const s=t.getCodeFromNode(this,this.getNodeType(t));return s.code=this.code,s.code}serialize(t){super.serialize(t),t.code=this.code,t.language=this.language}deserialize(t){super.deserialize(t),this.code=t.code,this.language=t.language}}function Cn(i){let t;const e=i.context.getViewZ;return e!==void 0&&(t=e(this)),(t||ct.z).negate()}E(([i,t],e)=>{const s=Cn(e);return se(i,t,s)}),E(([i],t)=>{const e=Cn(t);return i.mul(i,e,e).negate().exp().oneMinus()}),E(([i,t],e)=>{const s=Cn(e),r=t.sub(Nc.y).max(0).toConst().mul(s).toConst();return i.mul(i,r,r).negate().exp().oneMinus()}),E(([i,t])=>k(t.toFloat().mix(Sr.rgb,i.toVec3()),Sr.a));class gl extends C{constructor(t){super(),this.scope=t,this.isBarrierNode=!0}setup(t){t.allowEarlyReturns=!1,t.allowGlobalVariables=!1}generate(t){const{scope:e}=this,{renderer:s}=t;s.backend.isWebGLBackend===!0?t.addFlowCode(`	// ${e}Barrier \n`):t.addLineFlowCode(`${e}Barrier()`,this)}}K(gl);class It extends C{static get type(){return"AtomicFunctionNode"}constructor(t,e,s){super("uint"),this.method=t,this.pointerNode=e,this.valueNode=s,this.parents=!0}getInputType(t){return this.pointerNode.getNodeType(t)}generateNodeType(t){return this.getInputType(t)}generate(t){const e=t.getNodeProperties(this),s=e.parents,n=this.method,r=this.getNodeType(t),o=this.getInputType(t),a=this.pointerNode,h=this.valueNode,c=[];c.push(`&${a.build(t,o)}`),h!==null&&c.push(h.build(t,o));const l=`${t.getMethod(n,r)}( ${c.join(", ")} )`;if(s?s.length===1&&s[0].isStackNode===!0:!1)t.addLineFlowCode(l,this);else return e.constNode===void 0&&(e.constNode=Dt(l,r).toConst()),e.constNode.build(t)}}It.ATOMIC_LOAD="atomicLoad",It.ATOMIC_STORE="atomicStore",It.ATOMIC_ADD="atomicAdd",It.ATOMIC_SUB="atomicSub",It.ATOMIC_MAX="atomicMax",It.ATOMIC_MIN="atomicMin",It.ATOMIC_AND="atomicAnd",It.ATOMIC_OR="atomicOr",It.ATOMIC_XOR="atomicXor",K(It);class B extends et{static get type(){return"SubgroupFunctionNode"}constructor(t,e=null,s=null){super(),this.method=t,this.aNode=e,this.bNode=s}getInputType(t){const e=this.aNode?this.aNode.getNodeType(t):null,s=this.bNode?this.bNode.getNodeType(t):null,n=t.isMatrix(e)?0:t.getTypeLength(e),r=t.isMatrix(s)?0:t.getTypeLength(s);return n>r?e:s}generateNodeType(t){const e=this.method;return e===B.SUBGROUP_ELECT?"bool":e===B.SUBGROUP_BALLOT?"uvec4":this.getInputType(t)}generate(t,e){const s=this.method,n=this.getNodeType(t),r=this.getInputType(t),o=this.aNode,a=this.bNode,h=[];if(s===B.SUBGROUP_BROADCAST||s===B.SUBGROUP_SHUFFLE||s===B.QUAD_BROADCAST){const l=a.getNodeType(t);h.push(o.build(t,n),a.build(t,l==="float"?"int":n))}else s===B.SUBGROUP_SHUFFLE_XOR||s===B.SUBGROUP_SHUFFLE_DOWN||s===B.SUBGROUP_SHUFFLE_UP?h.push(o.build(t,n),a.build(t,"uint")):(o!==null&&h.push(o.build(t,r)),a!==null&&h.push(a.build(t,r)));const c=h.length===0?"()":`( ${h.join(", ")} )`;return t.format(`${t.getMethod(s,n)}${c}`,n,e)}serialize(t){super.serialize(t),t.method=this.method}deserialize(t){super.deserialize(t),this.method=t.method}}B.SUBGROUP_ELECT="subgroupElect",B.SUBGROUP_BALLOT="subgroupBallot",B.SUBGROUP_ADD="subgroupAdd",B.SUBGROUP_INCLUSIVE_ADD="subgroupInclusiveAdd",B.SUBGROUP_EXCLUSIVE_AND="subgroupExclusiveAdd",B.SUBGROUP_MUL="subgroupMul",B.SUBGROUP_INCLUSIVE_MUL="subgroupInclusiveMul",B.SUBGROUP_EXCLUSIVE_MUL="subgroupExclusiveMul",B.SUBGROUP_AND="subgroupAnd",B.SUBGROUP_OR="subgroupOr",B.SUBGROUP_XOR="subgroupXor",B.SUBGROUP_MIN="subgroupMin",B.SUBGROUP_MAX="subgroupMax",B.SUBGROUP_ALL="subgroupAll",B.SUBGROUP_ANY="subgroupAny",B.SUBGROUP_BROADCAST_FIRST="subgroupBroadcastFirst",B.QUAD_SWAP_X="quadSwapX",B.QUAD_SWAP_Y="quadSwapY",B.QUAD_SWAP_DIAGONAL="quadSwapDiagonal",B.SUBGROUP_BROADCAST="subgroupBroadcast",B.SUBGROUP_SHUFFLE="subgroupShuffle",B.SUBGROUP_SHUFFLE_XOR="subgroupShuffleXor",B.SUBGROUP_SHUFFLE_UP="subgroupShuffleUp",B.SUBGROUP_SHUFFLE_DOWN="subgroupShuffleDown",B.QUAD_BROADCAST="quadBroadcast",ee("vec3","totalDiffuse"),ee("vec3","totalSpecular"),ee("vec3","outgoingLight"),E(([i=Te()],{renderer:t,material:e})=>{const s=Rr(i.mul(2).sub(1));let n;if(e.alphaToCoverage&&t.currentSamples>0){const r=P(s.fwidth()).toVar();n=se(r.oneMinus(),r.add(1),s).oneMinus()}else n=cn(s.greaterThan(1),0,1);return n}),new Y("uint tsl_bitcast_int_to_uint ( int x ) { return floatBitsToUint( intBitsToFloat ( x ) ); }"),new Y("uint tsl_bitcast_uint_to_int ( uint x ) { return floatBitsToInt( uintBitsToFloat ( x ) ); }"),new Y(`\nvec4 tsl_textureGather( const int comp, sampler2D map, vec2 coord, ivec2 offset, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ) );\n	vec2 st = floor( coord * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, ij.xw, 0.0 )[ comp ],\n		textureLod( map, ij.zw, 0.0 )[ comp ],\n		textureLod( map, ij.zy, 0.0 )[ comp ],\n		textureLod( map, ij.xy, 0.0 )[ comp ]\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new Y(`\nvec4 tsl_textureGather_array( const int comp, sampler2DArray map, vec3 coord, ivec2 offset, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ).xy );\n	vec2 st = floor( coord.xy * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, vec3( ij.xw, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.zw, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.zy, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.xy, coord.z ), 0.0 )[ comp ]\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new Y(`\nvec4 tsl_textureGatherCompare( sampler2DShadow map, vec2 coord, ivec2 offset, float ref, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ) );\n	vec2 st = floor( coord * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, vec3( ij.xw, ref ), 0.0 ),\n		textureLod( map, vec3( ij.zw, ref ), 0.0 ),\n		textureLod( map, vec3( ij.zy, ref ), 0.0 ),\n		textureLod( map, vec3( ij.xy, ref ), 0.0 )\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new Y(`\nvec4 tsl_textureGatherCompare_array( sampler2DArrayShadow map, vec3 coord, ivec2 offset, float ref, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ).xy );\n	vec2 st = floor( coord.xy * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		texture( map, vec4( ij.xw, coord.z, ref ) ),\n		texture( map, vec4( ij.zw, coord.z, ref ) ),\n		texture( map, vec4( ij.zy, coord.z, ref ) ),\n		texture( map, vec4( ij.xy, coord.z, ref ) )\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`);const vn=typeof self<"u"&&self.GPUShaderStage?self.GPUShaderStage:{VERTEX:1,FRAGMENT:2,COMPUTE:4};class yl{constructor(){this.texture=null,this.mipLevel=0,this.origin={x:0,y:0,z:0},this.aspect="all"}reset(){this.texture=null,this.mipLevel=0,this.origin.x=0,this.origin.y=0,this.origin.z=0,this.aspect="all"}}class xl extends yl{constructor(){super(),this.colorSpace="srgb",this.premultipliedAlpha=!1}reset(){super.reset(),this.colorSpace="srgb",this.premultipliedAlpha=!1}}new xl,qs.READ_ONLY+"",qs.WRITE_ONLY+"",qs.READ_WRITE+"",vn.VERTEX,vn.FRAGMENT,vn.COMPUTE,new Y("fn tsl_xor( a : bool, b : bool ) -> bool { return ( a || b ) && !( a && b ); }"),new Y("fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }"),new Y("fn tsl_mod_vec2( x : vec2f, y : vec2f ) -> vec2f { return x - y * floor( x / y ); }"),new Y("fn tsl_mod_vec3( x : vec3f, y : vec3f ) -> vec3f { return x - y * floor( x / y ); }"),new Y("fn tsl_mod_vec4( x : vec4f, y : vec4f ) -> vec4f { return x - y * floor( x / y ); }"),new Y("fn tsl_equals_bool( a : bool, b : bool ) -> bool { return a == b; }"),new Y("fn tsl_equals_bvec2( a : vec2f, b : vec2f ) -> vec2<bool> { return vec2<bool>( a.x == b.x, a.y == b.y ); }"),new Y("fn tsl_equals_bvec3( a : vec3f, b : vec3f ) -> vec3<bool> { return vec3<bool>( a.x == b.x, a.y == b.y, a.z == b.z ); }"),new Y("fn tsl_equals_bvec4( a : vec4f, b : vec4f ) -> vec4<bool> { return vec4<bool>( a.x == b.x, a.y == b.y, a.z == b.z, a.w == b.w ); }"),new Y("fn tsl_repeatWrapping_float( coord: f32 ) -> f32 { return fract( coord ); }"),new Y("fn tsl_mirrorWrapping_float( coord: f32 ) -> f32 { let mirrored = fract( coord * 0.5 ) * 2.0; return 1.0 - abs( 1.0 - mirrored ); }"),new Y("fn tsl_clampWrapping_float( coord: f32 ) -> f32 { return clamp( coord, 0.0, 1.0 ); }"),new Y(`\nfn tsl_inverse_mat2( m : mat2x2<f32> ) -> mat2x2<f32> {\n\n	let det = m[ 0 ][ 0 ] * m[ 1 ][ 1 ] - m[ 0 ][ 1 ] * m[ 1 ][ 0 ];\n\n	return mat2x2<f32>(\n		m[ 1 ][ 1 ], - m[ 0 ][ 1 ],\n		- m[ 1 ][ 0 ], m[ 0 ][ 0 ]\n	) * ( 1.0 / det );\n\n}\n`),new Y(`\nfn tsl_inverse_mat3( m : mat3x3<f32> ) -> mat3x3<f32> {\n\n	let a00 = m[ 0 ][ 0 ]; let a01 = m[ 0 ][ 1 ]; let a02 = m[ 0 ][ 2 ];\n	let a10 = m[ 1 ][ 0 ]; let a11 = m[ 1 ][ 1 ]; let a12 = m[ 1 ][ 2 ];\n	let a20 = m[ 2 ][ 0 ]; let a21 = m[ 2 ][ 1 ]; let a22 = m[ 2 ][ 2 ];\n\n	let b01 = a22 * a11 - a12 * a21;\n	let b11 = - a22 * a10 + a12 * a20;\n	let b21 = a21 * a10 - a11 * a20;\n\n	let det = a00 * b01 + a01 * b11 + a02 * b21;\n\n	return mat3x3<f32>(\n		b01, ( - a22 * a01 + a02 * a21 ), ( a12 * a01 - a02 * a11 ),\n		b11, ( a22 * a00 - a02 * a20 ), ( - a12 * a00 + a02 * a10 ),\n		b21, ( - a21 * a00 + a01 * a20 ), ( a11 * a00 - a01 * a10 )\n	) * ( 1.0 / det );\n\n}\n`),new Y(`\nfn tsl_inverse_mat4( m : mat4x4<f32> ) -> mat4x4<f32> {\n\n	let a00 = m[ 0 ][ 0 ]; let a01 = m[ 0 ][ 1 ]; let a02 = m[ 0 ][ 2 ]; let a03 = m[ 0 ][ 3 ];\n	let a10 = m[ 1 ][ 0 ]; let a11 = m[ 1 ][ 1 ]; let a12 = m[ 1 ][ 2 ]; let a13 = m[ 1 ][ 3 ];\n	let a20 = m[ 2 ][ 0 ]; let a21 = m[ 2 ][ 1 ]; let a22 = m[ 2 ][ 2 ]; let a23 = m[ 2 ][ 3 ];\n	let a30 = m[ 3 ][ 0 ]; let a31 = m[ 3 ][ 1 ]; let a32 = m[ 3 ][ 2 ]; let a33 = m[ 3 ][ 3 ];\n\n	let b00 = a00 * a11 - a01 * a10;\n	let b01 = a00 * a12 - a02 * a10;\n	let b02 = a00 * a13 - a03 * a10;\n	let b03 = a01 * a12 - a02 * a11;\n	let b04 = a01 * a13 - a03 * a11;\n	let b05 = a02 * a13 - a03 * a12;\n	let b06 = a20 * a31 - a21 * a30;\n	let b07 = a20 * a32 - a22 * a30;\n	let b08 = a20 * a33 - a23 * a30;\n	let b09 = a21 * a32 - a22 * a31;\n	let b10 = a21 * a33 - a23 * a31;\n	let b11 = a22 * a33 - a23 * a32;\n\n	let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n\n	return mat4x4<f32>(\n		a11 * b11 - a12 * b10 + a13 * b09,\n		a02 * b10 - a01 * b11 - a03 * b09,\n		a31 * b05 - a32 * b04 + a33 * b03,\n		a22 * b04 - a21 * b05 - a23 * b03,\n		a12 * b08 - a10 * b11 - a13 * b07,\n		a00 * b11 - a02 * b08 + a03 * b07,\n		a32 * b02 - a30 * b05 - a33 * b01,\n		a20 * b05 - a22 * b02 + a23 * b01,\n		a10 * b10 - a11 * b08 + a13 * b06,\n		a01 * b08 - a00 * b10 - a03 * b06,\n		a30 * b04 - a31 * b02 + a33 * b00,\n		a21 * b02 - a20 * b04 - a23 * b00,\n		a11 * b07 - a10 * b09 - a12 * b06,\n		a00 * b09 - a01 * b07 + a02 * b06,\n		a31 * b01 - a30 * b03 - a32 * b00,\n		a20 * b03 - a21 * b01 + a22 * b00\n	) * ( 1.0 / det );\n\n}\n`),new Y(`\nfn tsl_biquadraticTexture( map : texture_2d<f32>, coord : vec2f, iRes : vec2u, level : u32 ) -> vec4f {\n\n	let res = vec2f( iRes );\n\n	let uvScaled = coord * res;\n	let uvWrapping = ( ( uvScaled % res ) + res ) % res;\n\n	// https://www.shadertoy.com/view/WtyXRy\n\n	let uv = uvWrapping - 0.5;\n	let iuv = floor( uv );\n	let f = fract( uv );\n\n	let rg1 = textureLoad( map, vec2u( iuv + vec2( 0.5, 0.5 ) ) % iRes, level );\n	let rg2 = textureLoad( map, vec2u( iuv + vec2( 1.5, 0.5 ) ) % iRes, level );\n	let rg3 = textureLoad( map, vec2u( iuv + vec2( 0.5, 1.5 ) ) % iRes, level );\n	let rg4 = textureLoad( map, vec2u( iuv + vec2( 1.5, 1.5 ) ) % iRes, level );\n\n	return mix( mix( rg1, rg2, f.x ), mix( rg3, rg4, f.x ), f.y );\n\n}\n`),new Y(`\nfn tsl_biquadraticTexture_array( map : texture_2d_array<f32>, coord : vec2f, iRes : vec2u, layer : u32, level : u32 ) -> vec4f {\n\n	let res = vec2f( iRes );\n\n	let uvScaled = coord * res;\n	let uvWrapping = ( ( uvScaled % res ) + res ) % res;\n\n	// https://www.shadertoy.com/view/WtyXRy\n\n	let uv = uvWrapping - 0.5;\n	let iuv = floor( uv );\n	let f = fract( uv );\n\n	let rg1 = textureLoad( map, vec2u( iuv + vec2( 0.5, 0.5 ) ) % iRes, layer, level );\n	let rg2 = textureLoad( map, vec2u( iuv + vec2( 1.5, 0.5 ) ) % iRes, layer, level );\n	let rg3 = textureLoad( map, vec2u( iuv + vec2( 0.5, 1.5 ) ) % iRes, layer, level );\n	let rg4 = textureLoad( map, vec2u( iuv + vec2( 1.5, 1.5 ) ) % iRes, layer, level );\n\n	return mix( mix( rg1, rg2, f.x ), mix( rg3, rg4, f.x ), f.y );\n\n}\n`),typeof Float16Array<"u"&&new Map([[Int8Array,["sint8","snorm8"]],[Uint8Array,["uint8","unorm8"]],[Int16Array,["sint16","snorm16"]],[Uint16Array,["uint16","unorm16"]],[Int32Array,["sint32","snorm32"]],[Uint32Array,["uint32","unorm32"]],[Float32Array,["float32"]]]).set(Float16Array,["float16"]);class Nl{count;shDegree;shCoefficientCount;shFormat;means;scalesOpacity;rotations;shCoefficients;ownsBuffers;disposed=!1;constructor(t,e){if(!Number.isInteger(e.count)||e.count<=0)throw new RangeError("GaussianData count must be a positive integer");const s=e.shDegree??0;if(!Number.isInteger(s)||s<0||s>3)throw new RangeError("GaussianData shDegree must be 0, 1, 2, or 3");if(this.count=e.count,this.shDegree=s,this.shCoefficientCount=(s+1)**2,this.shFormat=e.shFormat??"float32",this.shFormat!=="float32"&&this.shFormat!=="rgb8e8")throw new RangeError("GaussianData shFormat must be float32 or rgb8e8");this.means=t.means,this.scalesOpacity=t.scalesOpacity,this.rotations=t.rotations,this.shCoefficients=t.shCoefficients,this.ownsBuffers=e.ownsBuffers??!1,this.validateVec4Attribute(this.means,"means",this.count),this.validateVec4Attribute(this.scalesOpacity,"scalesOpacity",this.count),this.validateVec4Attribute(this.rotations,"rotations",this.count),this.validateShAttribute(this.shCoefficients,this.count*this.shCoefficientCount)}dispose(){this.disposed||(this.disposed=!0,this.ownsBuffers&&(this.means.dispose(),this.scalesOpacity.dispose(),this.rotations.dispose(),this.shCoefficients.dispose()))}validateVec4Attribute(t,e,s){if(t.isStorageBufferAttribute!==!0)throw new TypeError(`GaussianData ${e} must be a Three.js StorageBufferAttribute`);if(t.itemSize!==4)throw new RangeError(`GaussianData ${e} itemSize is ${t.itemSize}; vec4 data requires itemSize 4`);if(!(t.array instanceof Float32Array))throw new TypeError(`GaussianData ${e} must use Float32Array storage`);if(t.count<s)throw new RangeError(`GaussianData ${e} has ${t.count} items; at least ${s} are required`)}validateShAttribute(t,e){if(t.isStorageBufferAttribute!==!0)throw new TypeError("GaussianData shCoefficients must be a Three.js StorageBufferAttribute");const s=this.shFormat==="rgb8e8"?1:4;if(t.itemSize!==s)throw new RangeError(`GaussianData ${this.shFormat} shCoefficients itemSize is ${t.itemSize}; expected ${s}`);if(!(this.shFormat==="rgb8e8"?t.array instanceof Uint32Array:t.array instanceof Float32Array))throw new TypeError(`GaussianData ${this.shFormat} shCoefficients use the wrong typed array`);if(t.count<e)throw new RangeError(`GaussianData shCoefficients has ${t.count} items; at least ${e} are required`)}}const Mi={char:1,uchar:1,short:2,ushort:2,int:4,uint:4,float:4,double:8,int8:1,uint8:1,int16:2,uint16:2,int32:4,uint32:4,float32:4,float64:8},Tl=["x","y","z","scale_0","scale_1","scale_2","rot_0","rot_1","rot_2","rot_3","opacity","f_dc_0","f_dc_1","f_dc_2"];class wl{async load(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load PLY: ${e.status} ${e.statusText}`);return this.parse(await e.arrayBuffer())}parse(t){const e=Sl(t),s=new Map(e.properties.map((N,T)=>[N.name,T]));for(const N of Tl)if(!s.has(N))throw new Error(`Not a canonical 3DGS PLY: missing property ${N}`);const n=e.properties.map(N=>N.name.match(/^f_rest_(\\d+)$/)?.[1]).filter(N=>N!==void 0).map(Number).sort((N,T)=>N-T);for(let N=0;N<n.length;N++)if(n[N]!==N)throw new Error("f_rest_* properties must be contiguous from f_rest_0");if(n.length%3!==0)throw new Error("f_rest_* property count must be divisible by three");const r=n.length/3,o=r+1,a=Math.sqrt(o);if(!Number.isInteger(a)||a<1||a>4)throw new Error("PLY must contain one, four, nine, or sixteen SH coefficients per channel");const h=Ml(t,e),c=N=>s.get(N),l=n.map(N=>c(`f_rest_${N}`)),u=e.vertexCount,p=new Float32Array(u*4),d=new Float32Array(u*4),f=new Float32Array(u*4),g=new Float32Array(u*o*4);for(let N=0;N<u;N++){const T=N*4;p[T]=h(N,c("x")),p[T+1]=h(N,c("y")),p[T+2]=h(N,c("z")),d[T]=Math.max(Math.exp(h(N,c("scale_0"))),1e-6),d[T+1]=Math.max(Math.exp(h(N,c("scale_1"))),1e-6),d[T+2]=Math.max(Math.exp(h(N,c("scale_2"))),1e-6);const A=h(N,c("opacity"));d[T+3]=1/(1+Math.exp(-A));const v=h(N,c("rot_0")),z=h(N,c("rot_1")),b=h(N,c("rot_2")),F=h(N,c("rot_3")),I=Math.hypot(z,b,F,v);I>1e-12?(f[T]=z/I,f[T+1]=b/I,f[T+2]=F/I,f[T+3]=v/I):f[T+3]=1;const X=N*o*4;g[X]=h(N,c("f_dc_0")),g[X+1]=h(N,c("f_dc_1")),g[X+2]=h(N,c("f_dc_2"));for(let tt=1;tt<o;tt++){const lt=X+tt*4,pt=tt-1;for(let nt=0;nt<3;nt++){const at=l[nt*r+pt];g[lt+nt]=h(N,at)}}}return new Nl({means:ws("ply.means",p),scalesOpacity:ws("ply.scales-opacity",d),rotations:ws("ply.rotations-xyzw",f),shCoefficients:ws("ply.sh-coefficients",g)},{count:u,shDegree:a-1,ownsBuffers:!0})}}function ws(i,t){const e=new fl(t,4);return e.name=i,e}function Sl(i){const t=new Uint8Array(i),e=new TextEncoder().encode("end_header");let s=-1;for(let f=0;f<=t.length-e.length;f++){let g=!0;for(let N=0;N<e.length;N++)if(t[f+N]!==e[N]){g=!1;break}if(g){s=f;break}}if(s<0)throw new Error("Invalid PLY: end_header is missing");let n=s+e.length;if(t[n]===13&&n++,t[n]!==10)throw new Error("Invalid PLY: end_header must terminate a line");n++;const o=new TextDecoder().decode(t.subarray(0,n)).split(/\\r?\\n/);if(o[0]?.trim()!=="ply")throw new Error("Invalid PLY signature");let a=null,h="",c=-1,l=0;const u=[],p=[];for(const f of o){const g=f.trim().split(/\\s+/);if(g[0]==="format"){if(g[1]!=="ascii"&&g[1]!=="binary_little_endian"&&g[1]!=="binary_big_endian")throw new Error(`Unsupported PLY format: ${g[1]??"unknown"}`);a=g[1]}else if(g[0]==="element"){h=g[1]??"";const N=Number(g[2]);if(!Number.isInteger(N)||N<0)throw new Error(`Invalid element count for ${h}`);p.push({name:h,count:N}),h==="vertex"&&(c=N)}else if(g[0]==="property"&&h==="vertex"){if(g[1]==="list")throw new Error("List properties are not supported in the vertex element");const N=g[1],T=g[2];if(!(N in Mi)||T===void 0)throw new Error(`Unsupported vertex property: ${f}`);u.push({name:T,type:N,byteOffset:l}),l+=Mi[N]}}if(a===null)throw new Error("Invalid PLY: format is missing");if(c<=0)throw new Error("PLY must contain at least one vertex");if(p.find(f=>f.count>0)?.name!=="vertex")throw new Error("The canonical 3DGS vertex element must be first");return{format:a,vertexCount:c,properties:u,vertexStride:l,dataOffset:n}}function Ml(i,t){if(t.format==="ascii"){const r=new TextDecoder().decode(new Uint8Array(i,t.dataOffset)),o=new Float64Array(t.vertexCount*t.properties.length);let a=0;for(let h=0;h<o.length;h++){for(;a<r.length&&/\\s/.test(r[a]);)a++;const c=a;for(;a<r.length&&!/\\s/.test(r[a]);)a++;const l=Number(r.slice(c,a));if(!Number.isFinite(l))throw new Error(`Invalid ASCII PLY value at scalar ${h}`);o[h]=l}return(h,c)=>o[h*t.properties.length+c]}if(t.dataOffset+t.vertexCount*t.vertexStride>i.byteLength)throw new Error("Binary PLY ends before the vertex data is complete");const s=new DataView(i),n=t.format==="binary_little_endian";return(r,o)=>{const a=t.properties[o],h=t.dataOffset+r*t.vertexStride+a.byteOffset;return _l(s,h,a.type,n)}}function _l(i,t,e,s){switch(e){case"char":case"int8":return i.getInt8(t);case"uchar":case"uint8":return i.getUint8(t);case"short":case"int16":return i.getInt16(t,s);case"ushort":case"uint16":return i.getUint16(t,s);case"int":case"int32":return i.getInt32(t,s);case"uint":case"uint32":return i.getUint32(t,s);case"float":case"float32":return i.getFloat32(t,s);case"double":case"float64":return i.getFloat64(t,s)}}class _i{constructor(t,e,s){this.octreeNodeId=t,this.sortedGaussianIndices=e,this.levelCounts=s}octreeNodeId;sortedGaussianIndices;levelCounts}const El=[{retention:.2},{retention:.5},{retention:1}];class bn{constructor(t,e){this.octree=t,this.levels=Al(e.levels??El),this.ownsOctree=e.ownsOctree??!1;const s=e.importance??Cl,n=new Float64Array(t.data.count);for(let r=0;r<n.length;r++){const o=s(r,t);n[r]=Number.isFinite(o)?o:-1/0}this.nodes=t.nodes.map(r=>{if(r.gaussianIndices===null)return new _i(r.id,new Uint32Array,new Uint32Array(this.levels.length));const o=Uint32Array.from(Array.from(r.gaussianIndices).sort((a,h)=>n[h]-n[a]||a-h));return new _i(r.id,o,Uint32Array.from(this.levels.map(({retention:a})=>Math.min(o.length,Math.max(1,Math.ceil(o.length*a))))))})}octree;static build(t,e={}){return new bn(t,e)}levels;nodes;ownsOctree;disposed=!1;get levelCount(){return this.levels.length}get finestLevel(){return this.levels.length-1}getNode(t){this.assertUsable();const e=this.nodes[t];if(e===void 0)throw new RangeError(`GaussianLod node ${t} does not exist`);return e}indicesForPacking(t){if(this.assertUsable(),t.nodeIds.length!==t.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const e=new Uint32Array(t.gaussianCount),s=new Set;let n=0;for(let r=0;r<t.nodeIds.length;r++){const o=t.nodeIds[r],a=this.getLeafNode(o);if(s.has(o))throw new Error(`GaussianLodPacking contains duplicate leaf node ${o}`);s.add(o);const h=t.lodLevels[r],c=a.levelCounts[h];if(c===void 0)throw new RangeError(`GaussianLod level ${h} does not exist`);if(n+c>e.length)throw new RangeError("GaussianLodPacking gaussianCount is too small");for(let l=0;l<c;l++)e[n++]=a.sortedGaussianIndices[l]}if(n!==e.length)throw new RangeError(`GaussianLodPacking declares ${e.length} Gaussians but selects ${n}`);return e}raycast(t,e,s={}){this.assertUsable();const n=s.radiusScale??3;if(!(n>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const r=s.maxHits??1/0;if(!(r>0))return[];if(e.nodeIds.length!==e.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const o=this.octree.data.means.array,a=this.octree.data.scalesOpacity.array,h=new S,c=new S,l=[],u=new Set;for(let p=0;p<e.nodeIds.length;p++){const d=e.nodeIds[p],f=this.getLeafNode(d);if(u.has(d))throw new Error(`GaussianLodPacking contains duplicate leaf node ${d}`);u.add(d);const g=e.lodLevels[p],N=f.levelCounts[g];if(N===void 0)throw new RangeError(`GaussianLod level ${g} does not exist`);const T=this.octree.nodes[d],A=Math.max(0,n-3)*T.maxSplatRadius,v=A===0?T.raycastBounds:T.raycastBounds.clone().expandByScalar(A);if(t.intersectsBox(v))for(let z=0;z<N;z++){const b=f.sortedGaussianIndices[z],F=b*4;h.set(o[F],o[F+1],o[F+2]);const I=Math.max(a[F],a[F+1],a[F+2])*n;t.closestPointToPoint(h,c),!(c.distanceToSquared(h)>I*I)&&l.push({gaussianIndex:b,distance:t.origin.distanceTo(c),point:c.clone()})}}return l.sort((p,d)=>p.distance-d.distance),l.length>r&&(l.length=r),l}dispose(){this.disposed||(this.disposed=!0,this.ownsOctree&&this.octree.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianLod has been disposed")}getLeafNode(t){const e=this.getNode(t);if(this.octree.nodes[t]?.isLeaf!==!0)throw new Error(`GaussianLodPacking must reference leaf nodes; node ${t} is internal`);return e}}function Al(i){if(i.length===0||i.length>256)throw new RangeError("GaussianLod requires between 1 and 256 levels");let t=0;const e=i.map(({retention:s})=>{if(!(s>t&&s<=1))throw new RangeError("GaussianLod retention values must increase and stay in (0, 1]");return t=s,Object.freeze({retention:s})});if(Math.abs(t-1)>Number.EPSILON)throw new RangeError("GaussianLod finest retention must be 1");return Object.freeze(e)}function Cl(i,t){const e=t.data.scalesOpacity.array,s=i*4,n=[e[s],e[s+1],e[s+2]];return n.sort((r,o)=>o-r),e[s+3]*n[0]*n[1]}class vl{constructor(t,e,s,n,r,o,a,h){this.id=t,this.depth=e,this.bounds=s,this.count=n,this.maxSplatRadius=r,this.raycastBounds=h,this.children=o,this.gaussianIndices=a}id;depth;bounds;count;maxSplatRadius;raycastBounds;children;gaussianIndices;get isLeaf(){return this.children.length===0}}class zn{constructor(t,e,s,n){this.data=t,this.leafCapacity=e,this.maxDepth=s,this.ownsData=n,this.bounds=bl(t),this.rootBounds=zl(this.bounds);const r=t.means.array,o=t.scalesOpacity.array,a=[],h=[],c=Array.from({length:t.count},(u,p)=>p),l=(u,p,d)=>{const f=a.length;a.push(null);const g=u.length>e&&d<s&&p.max.x-p.min.x>Number.EPSILON,N=[];if(g){const v=p.getCenter(new S),z=Array.from({length:8},()=>[]);for(const b of u){const F=b*4,I=(r[F]>=v.x?1:0)|(r[F+1]>=v.y?2:0)|(r[F+2]>=v.z?4:0);z[I].push(b)}for(let b=0;b<8;b++){const F=z[b];F.length!==0&&N.push(l(F,Fl(p,v,b),d+1))}}let T=0;if(N.length>0)for(const v of N)T=Math.max(T,a[v].maxSplatRadius);else{for(const v of u){const z=v*4;T=Math.max(T,o[z],o[z+1],o[z+2])}h.push(f)}const A=p.clone().expandByScalar(T*3);return a[f]=new vl(f,d,p,u.length,T,N,N.length===0?Uint32Array.from(u):null,A),f};l(c,this.rootBounds.clone(),0),this.nodes=a,this.leafNodeIds=Uint32Array.from(h)}data;leafCapacity;maxDepth;static build(t,e={}){const s=e.leafCapacity??256,n=e.maxDepth??10;if(!Number.isInteger(s)||s<=0)throw new RangeError("GaussianOctree leafCapacity must be positive");if(!Number.isInteger(n)||n<0)throw new RangeError("GaussianOctree maxDepth must be non-negative");return new zn(t,s,n,e.ownsData??!1)}bounds;rootBounds;rootNode=0;nodes;leafNodeIds;ownsData;disposed=!1;raycast(t,e={}){this.assertUsable();const s=e.radiusScale??3;if(!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const n=e.maxHits??1/0;if(!(n>0))return[];const r=[],o=[this.rootNode];for(;o.length>0;){const a=this.nodes[o.pop()],h=Math.max(0,s-3)*a.maxSplatRadius,c=h===0?a.raycastBounds:a.raycastBounds.clone().expandByScalar(h);if(t.intersectsBox(c))if(a.gaussianIndices!==null)for(const l of a.gaussianIndices)r.push(l);else for(const l of a.children)o.push(l)}return this.raycastIndices(t,r,s,n)}raycastIndices(t,e,s=3,n=1/0){if(this.assertUsable(),!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");if(!(n>0))return[];const r=this.data.means.array,o=this.data.scalesOpacity.array,a=new S,h=new S,c=[];for(let l=0;l<e.length;l++){const u=e[l],p=u*4;a.set(r[p],r[p+1],r[p+2]);const d=Math.max(o[p],o[p+1],o[p+2])*s;t.closestPointToPoint(a,h),!(h.distanceToSquared(a)>d*d)&&c.push({gaussianIndex:u,distance:t.origin.distanceTo(h),point:h.clone()})}return c.sort((l,u)=>l.distance-u.distance),c.length>n&&(c.length=n),c}dispose(){this.disposed||(this.disposed=!0,this.ownsData&&this.data.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianOctree has been disposed")}}function bl(i){const t=i.means.array,e=new Ce,s=new S;for(let n=0;n<i.count;n++){const r=n*4;s.set(t[r],t[r+1],t[r+2]),e.expandByPoint(s)}return e}function zl(i){const t=i.getCenter(new S),e=i.getSize(new S),s=Math.max(e.x,e.y,e.z,1e-6)*.5;return new Ce(new S(t.x-s,t.y-s,t.z-s),new S(t.x+s,t.y+s,t.z+s))}function Fl(i,t,e){return new Ce(new S(e&1?t.x:i.min.x,e&2?t.y:i.min.y,e&4?t.z:i.min.z),new S(e&1?i.max.x:t.x,e&2?i.max.y:t.y,e&4?i.max.z:t.z))}function Rl(i,t,e){const s=Math.max(Math.abs(i),Math.abs(t),Math.abs(e));if(!Number.isFinite(s))throw new RangeError("SH coefficients must be finite");if(s===0)return 0;const n=Math.min(127,Math.max(-126,Math.ceil(Math.log2(s)))),r=127/2**n,o=Fn(i,r),a=Fn(t,r),h=Fn(e,r),c=n+127;return(o|a<<8|h<<16|c<<24)>>>0}function Fn(i,t){return Math.min(127,Math.max(-127,Math.round(i*t)))&255}function Il(i){if(!Number.isInteger(i)||i<0)throw new RangeError("Gaussian LOD budget must be a non-negative integer")}function Ll(i,t,e){return i.updateWorldMatrix(!0,!1),t.updateWorldMatrix(!0,!1),i.getWorldPosition(e),t.worldToLocal(e)}function Ol(i,t){const e=t instanceof S?t.clone():i.octree.bounds.getCenter(new S),s=i.octree.rootBounds.getSize(new S),n=Math.max(s.length()*.5,Number.EPSILON),r=new S,o=Array.from(i.octree.leafNodeIds,a=>(i.octree.nodes[a].bounds.getCenter(r),{nodeId:a,radius:r.distanceTo(e)/n}));return o.sort((a,h)=>a.radius-h.radius||a.nodeId-h.nodeId),o}class Pl{cameraCenter=new S;center;levelDistance;constructor(t={}){if(this.center=t.center instanceof S?t.center.clone():t.center??"bounds-center",this.levelDistance=t.levelDistance??2,!(this.levelDistance>0)||!Number.isFinite(this.levelDistance))throw new RangeError("Radial LOD levelDistance must be finite and positive")}setCenter(t){return this.center=t instanceof S?t.clone():t,this}setFromCamera(t,e){return this.setCenter(Ll(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(Il(e),e===0)return Bl();const s=Ol(t,this.center),n=s.map(({radius:a})=>Math.max(0,t.finestLevel-Math.floor(a/this.levelDistance)));let r=s.reduce((a,h,c)=>a+t.nodes[h.nodeId].levelCounts[n[c]],0);for(let a=s.length-1;a>=0&&r>e;a--){const h=t.nodes[s[a].nodeId];for(;n[a]>0&&r>e;){const c=h.levelCounts[n[a]];n[a]=n[a]-1,r-=c-h.levelCounts[n[a]]}}let o=s.length;for(;o>0&&r>e;){o--;const a=t.nodes[s[o].nodeId];r-=a.levelCounts[n[o]]}return{nodeIds:Uint32Array.from(s.slice(0,o).map(({nodeId:a})=>a)),lodLevels:Uint8Array.from(n.slice(0,o)),gaussianCount:r}}}function Bl(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}function Dl(i){const t=i.nodes,e=new Float32Array(t.length*7),s=new Uint32Array(t.length*2),n=new Uint32Array(t.length*2),r=[],o=[];for(const h of t){const c=h.id*7,{min:l,max:u}=h.raycastBounds;if(e.set([l.x,l.y,l.z,u.x,u.y,u.z,h.maxSplatRadius],c),s.set([r.length,h.children.length],h.id*2),r.push(...h.children),n.set([o.length,h.gaussianIndices?.length??0],h.id*2),h.gaussianIndices!==null)for(const p of h.gaussianIndices)o.push(p)}const a=i.data;return{means:a.means.array.slice().buffer,scalesOpacity:a.scalesOpacity.array.slice().buffer,rotations:a.rotations.array.slice().buffer,nodeBounds:e.buffer,nodeChildren:s.buffer,children:Uint32Array.from(r).buffer,nodeIndices:n.buffer,indices:Uint32Array.from(o).buffer}}const Se=new Map,Ss=new Set,Ei=new wl,Ye=globalThis;Ye.onmessage=({data:i})=>{Ul(i).catch(t=>{Ye.postMessage({type:"error",requestId:i.requestId,resourceId:i.resourceId,message:t instanceof Error?t.message:String(t)})})};async function Ul(i){if(i.type==="release"){Ss.add(i.resourceId),Se.get(i.resourceId)?.lod.dispose(),Se.delete(i.resourceId),Ye.postMessage({type:"released",requestId:i.requestId,resourceId:i.resourceId});return}if(i.type==="load-url"||i.type==="load-buffer"){if(Se.has(i.resourceId)||Ss.has(i.resourceId))throw new Error("Resource already exists or was released");const e=i.type==="load-url"?await Ei.load(i.url):Ei.parse(i.buffer);if(Ss.has(i.resourceId))throw e.dispose(),new Error("Gaussian resource released during load");let s=null,n=null;try{if(s=zn.build(e,{...i.options.octree,ownsData:!0}),n=bn.build(s,{...i.options.lod,ownsOctree:!0}),Se.has(i.resourceId)||Ss.has(i.resourceId))throw new Error("Resource already exists or was released");Se.set(i.resourceId,{lod:n,packing:null});const{min:r,max:o}=s.bounds,a=Dl(s);Ye.postMessage({type:"loaded",requestId:i.requestId,resourceId:i.resourceId,count:e.count,shDegree:e.shDegree,bounds:[r.x,r.y,r.z,o.x,o.y,o.z],raycast:a},Object.values(a))}catch(r){throw n!==null?n.dispose():s!==null?s.dispose():e.dispose(),r}return}const t=Se.get(i.resourceId);if(t===void 0)throw new Error(`Unknown Gaussian resource: ${i.resourceId}`);if(i.type==="select"){const s=new Pl({center:new S(...i.center),levelDistance:i.levelDistance}).pack({lod:t.lod,maxGaussians:i.maxGaussians}),n=Vl(t.lod,s),r=t.lod.indicesForPacking(s).buffer;t.packing=s,Ye.postMessage({type:"selected",requestId:i.requestId,resourceId:i.resourceId,revision:i.revision,count:s.gaussianCount,shDegree:t.lod.octree.data.shDegree,buffers:n,renderedIndices:r},[...Object.values(n),r]);return}}function Vl(i,t){const e=i.octree.data,s=i.indicesForPacking(t),n=new Float32Array(s.length*4),r=new Float32Array(s.length*4),o=new Float32Array(s.length*4),a=e.shCoefficientCount,h=new Uint32Array(s.length*a),c=e.means.array,l=e.scalesOpacity.array,u=e.rotations.array,p=e.shCoefficients.array;for(let d=0;d<s.length;d++){const f=s[d];n.set(c.subarray(f*4,f*4+4),d*4),r.set(l.subarray(f*4,f*4+4),d*4),o.set(u.subarray(f*4,f*4+4),d*4);for(let g=0;g<a;g++){const N=(f*a+g)*4;h[d*a+g]=Rl(p[N],p[N+1],p[N+2])}}return{means:n.buffer,scalesOpacity:r.buffer,rotations:o.buffer,shCoefficients:h.buffer}}})();\n//# sourceMappingURL=GaussianDataWorker-CyKRRDqk.js.map\n', ys = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Fs], { type: "text/javascript;charset=utf-8" });
function Vr(n) {
  let t;
  try {
    if (t = ys && (self.URL || self.webkitURL).createObjectURL(ys), !t) throw "";
    const e = new Worker(t, {
      name: n?.name
    });
    return e.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), e;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Fs),
      {
        name: n?.name
      }
    );
  }
}
class Rn {
  transport;
  ownsTransport;
  pending = /* @__PURE__ */ new Map();
  revisions = /* @__PURE__ */ new Map();
  released = /* @__PURE__ */ new Set();
  nextRequestId = 0;
  nextResourceId = 0;
  disposed = !1;
  constructor(t) {
    this.ownsTransport = t === void 0, this.transport = t ?? new Vr({ name: "3dgs-data" }), this.transport.addEventListener("message", this.handleMessage);
  }
  async loadUrl(t, e = {}) {
    const s = this.newResourceId(), r = await this.send({
      type: "load-url",
      resourceId: s,
      url: t,
      options: e
    });
    if (r.type !== "loaded")
      throw new Error("Unexpected Gaussian load response");
    return r;
  }
  async loadBuffer(t, e = {}) {
    const s = this.newResourceId(), r = await this.send(
      { type: "load-buffer", resourceId: s, buffer: t, options: e },
      [t]
    );
    if (r.type !== "loaded")
      throw new Error("Unexpected Gaussian load response");
    return r;
  }
  /** Selection packs only the chosen splats and transfers ownership of the four GPU input buffers. */
  async select(t, e, s, r) {
    const i = (this.revisions.get(t) ?? 0) + 1;
    this.revisions.set(t, i);
    const o = await this.send({
      type: "select",
      resourceId: t,
      revision: i,
      center: e,
      maxGaussians: s,
      levelDistance: r
    });
    if (o.type !== "selected")
      throw new Error("Unexpected Gaussian selection response");
    if (this.revisions.get(t) !== o.revision)
      throw new Error("Stale Gaussian selection response");
    return o;
  }
  async release(t) {
    if (this.released.has(t)) return;
    this.released.add(t), this.revisions.delete(t);
    for (const [s, r] of this.pending)
      r.resourceId === t && (this.pending.delete(s), r.reject(new Error("Gaussian resource released")));
    if ((await this.send({ type: "release", resourceId: t })).type !== "released")
      throw new Error("Unexpected Gaussian release response");
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0, this.transport.removeEventListener("message", this.handleMessage), this.ownsTransport && this.transport.terminate?.();
      for (const t of this.pending.values())
        t.reject(new Error("Gaussian backend disposed"));
      this.pending.clear(), this.revisions.clear(), this.released.clear();
    }
  }
  newResourceId() {
    if (this.disposed) throw new Error("Gaussian backend disposed");
    return `gaussian-${++this.nextResourceId}`;
  }
  send(t, e) {
    if (this.disposed)
      return Promise.reject(new Error("Gaussian backend disposed"));
    if (t.type !== "release" && this.released.has(t.resourceId))
      return Promise.reject(new Error("Gaussian resource released"));
    const s = ++this.nextRequestId, r = { ...t, requestId: s };
    return new Promise((i, o) => {
      this.pending.set(s, {
        resourceId: t.resourceId,
        resolve: i,
        reject: o
      });
      try {
        this.transport.postMessage(r, e);
      } catch (a) {
        this.pending.delete(s), o(a);
      }
    });
  }
  handleMessage = ({
    data: t
  }) => {
    const e = this.pending.get(t.requestId);
    e !== void 0 && (this.pending.delete(t.requestId), e.resourceId !== t.resourceId ? e.reject(new Error("Gaussian backend resource mismatch")) : t.type === "error" ? e.reject(new Error(t.message)) : e.resolve(t));
  };
}
const xs = 1 / 255, $r = 0.99, ve = 1e-12;
function Us(n, t, e, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const r = t.means.array, i = t.scalesOpacity.array, o = t.rotations.array, a = new N(), l = new N(), u = new N(), c = new hr();
  let d = 1;
  for (const h of e) {
    const g = h.gaussianIndex * 4, m = Math.min(1, Math.max(0, i[g + 3]));
    if (m < xs) continue;
    c.set(
      -o[g],
      -o[g + 1],
      -o[g + 2],
      o[g + 3]
    ).normalize(), a.set(
      n.origin.x - r[g],
      n.origin.y - r[g + 1],
      n.origin.z - r[g + 2]
    ).applyQuaternion(c), l.copy(n.direction).applyQuaternion(c);
    const b = Math.max(i[g], ve), p = Math.max(i[g + 1], ve), v = Math.max(i[g + 2], ve);
    a.set(
      a.x / b,
      a.y / p,
      a.z / v
    ), l.set(
      l.x / b,
      l.y / p,
      l.z / v
    );
    const S = l.lengthSq();
    if (S <= Number.EPSILON) continue;
    const T = Math.max(
      0,
      -a.dot(l) / S
    );
    u.copy(a).addScaledVector(l, T);
    const M = Math.min(
      $r,
      m * Math.exp(-0.5 * u.lengthSq())
    );
    if (M < xs || (d *= 1 - M, 1 - d < s)) continue;
    const w = n.at(T, new N());
    return {
      gaussianIndex: h.gaussianIndex,
      distance: n.origin.distanceTo(w),
      point: w
    };
  }
  return null;
}
class jr {
  constructor(t, e, s, r, i, o, a, l) {
    this.id = t, this.depth = e, this.bounds = s, this.count = r, this.maxSplatRadius = i, this.raycastBounds = l, this.children = o, this.gaussianIndices = a;
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
class Le {
  constructor(t, e, s, r) {
    this.data = t, this.leafCapacity = e, this.maxDepth = s, this.ownsData = r, this.bounds = Wr(t), this.rootBounds = qr(this.bounds);
    const i = t.means.array, o = t.scalesOpacity.array, a = [], l = [], u = Array.from({ length: t.count }, (d, h) => h), c = (d, h, g) => {
      const m = a.length;
      a.push(null);
      const b = d.length > e && g < s && h.max.x - h.min.x > Number.EPSILON, p = [];
      if (b) {
        const T = h.getCenter(new N()), M = Array.from({ length: 8 }, () => []);
        for (const w of d) {
          const C = w * 4, z = (i[C] >= T.x ? 1 : 0) | (i[C + 1] >= T.y ? 2 : 0) | (i[C + 2] >= T.z ? 4 : 0);
          M[z].push(w);
        }
        for (let w = 0; w < 8; w++) {
          const C = M[w];
          C.length !== 0 && p.push(
            c(
              C,
              Hr(h, T, w),
              g + 1
            )
          );
        }
      }
      let v = 0;
      if (p.length > 0)
        for (const T of p)
          v = Math.max(
            v,
            a[T].maxSplatRadius
          );
      else {
        for (const T of d) {
          const M = T * 4;
          v = Math.max(
            v,
            o[M],
            o[M + 1],
            o[M + 2]
          );
        }
        l.push(m);
      }
      const S = h.clone().expandByScalar(v * 3);
      return a[m] = new jr(
        m,
        g,
        h,
        d.length,
        v,
        p,
        p.length === 0 ? Uint32Array.from(d) : null,
        S
      ), m;
    };
    c(u, this.rootBounds.clone(), 0), this.nodes = a, this.leafNodeIds = Uint32Array.from(l);
  }
  data;
  leafCapacity;
  maxDepth;
  static build(t, e = {}) {
    const s = e.leafCapacity ?? 256, r = e.maxDepth ?? 10;
    if (!Number.isInteger(s) || s <= 0)
      throw new RangeError("GaussianOctree leafCapacity must be positive");
    if (!Number.isInteger(r) || r < 0)
      throw new RangeError("GaussianOctree maxDepth must be non-negative");
    return new Le(
      t,
      s,
      r,
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
    const r = e.maxHits ?? 1 / 0;
    if (!(r > 0)) return [];
    const i = [], o = [this.rootNode];
    for (; o.length > 0; ) {
      const a = this.nodes[o.pop()], l = Math.max(0, s - 3) * a.maxSplatRadius, u = l === 0 ? a.raycastBounds : a.raycastBounds.clone().expandByScalar(l);
      if (t.intersectsBox(u))
        if (a.gaussianIndices !== null)
          for (const c of a.gaussianIndices) i.push(c);
        else
          for (const c of a.children) o.push(c);
    }
    return this.raycastIndices(t, i, s, r);
  }
  raycastIndices(t, e, s = 3, r = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(r > 0)) return [];
    const i = this.data.means.array, o = this.data.scalesOpacity.array, a = new N(), l = new N(), u = [];
    for (let c = 0; c < e.length; c++) {
      const d = e[c], h = d * 4;
      a.set(i[h], i[h + 1], i[h + 2]);
      const g = Math.max(
        o[h],
        o[h + 1],
        o[h + 2]
      ) * s;
      t.closestPointToPoint(a, l), !(l.distanceToSquared(a) > g * g) && u.push({
        gaussianIndex: d,
        distance: t.origin.distanceTo(l),
        point: l.clone()
      });
    }
    return u.sort((c, d) => c.distance - d.distance), u.length > r && (u.length = r), u;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function Wr(n) {
  const t = n.means.array, e = new ne(), s = new N();
  for (let r = 0; r < n.count; r++) {
    const i = r * 4;
    s.set(t[i], t[i + 1], t[i + 2]), e.expandByPoint(s);
  }
  return e;
}
function qr(n) {
  const t = n.getCenter(new N()), e = n.getSize(new N()), s = Math.max(e.x, e.y, e.z, 1e-6) * 0.5;
  return new ne(
    new N(
      t.x - s,
      t.y - s,
      t.z - s
    ),
    new N(
      t.x + s,
      t.y + s,
      t.z + s
    )
  );
}
function Hr(n, t, e) {
  return new ne(
    new N(
      e & 1 ? t.x : n.min.x,
      e & 2 ? t.y : n.min.y,
      e & 4 ? t.z : n.min.z
    ),
    new N(
      e & 1 ? n.max.x : t.x,
      e & 2 ? n.max.y : t.y,
      e & 4 ? n.max.z : t.z
    )
  );
}
class En {
  means;
  scalesOpacity;
  rotations;
  bounds;
  nodeChildren;
  children;
  nodeIndices;
  indices;
  renderedIndices = null;
  constructor(t) {
    this.means = new Float32Array(t.means), this.scalesOpacity = new Float32Array(t.scalesOpacity), this.rotations = new Float32Array(t.rotations), this.bounds = new Float32Array(t.nodeBounds), this.nodeChildren = new Uint32Array(t.nodeChildren), this.children = new Uint32Array(t.children), this.nodeIndices = new Uint32Array(t.nodeIndices), this.indices = new Uint32Array(t.indices);
  }
  setRenderedIndices(t) {
    this.renderedIndices = new Uint32Array(t);
  }
  raycast(t, e, s = 0.5) {
    const r = [];
    if (e === "rendered") {
      if (this.renderedIndices === null) return null;
      for (const l of this.renderedIndices) r.push(l);
    } else {
      const l = [0], u = new ne();
      for (; l.length > 0; ) {
        const c = l.pop(), d = c * 7;
        if (u.min.set(
          this.bounds[d],
          this.bounds[d + 1],
          this.bounds[d + 2]
        ), u.max.set(
          this.bounds[d + 3],
          this.bounds[d + 4],
          this.bounds[d + 5]
        ), !t.intersectsBox(u)) continue;
        const h = this.nodeChildren[c * 2], g = this.nodeChildren[c * 2 + 1];
        if (g > 0)
          for (let m = 0; m < g; m++)
            l.push(this.children[h + m]);
        else {
          const m = this.nodeIndices[c * 2], b = this.nodeIndices[c * 2 + 1];
          for (let p = 0; p < b; p++)
            r.push(this.indices[m + p]);
        }
      }
    }
    const i = new N(), o = new N(), a = [];
    for (const l of r) {
      const u = l * 4;
      i.set(
        this.means[u],
        this.means[u + 1],
        this.means[u + 2]
      );
      const c = Math.max(
        this.scalesOpacity[u],
        this.scalesOpacity[u + 1],
        this.scalesOpacity[u + 2]
      ) * 3;
      t.closestPointToPoint(i, o), !(o.distanceToSquared(i) > c * c) && a.push({
        gaussianIndex: l,
        distance: t.origin.distanceTo(o),
        point: o.clone()
      });
    }
    return a.sort((l, u) => l.distance - u.distance), Us(
      t,
      {
        means: { array: this.means },
        scalesOpacity: { array: this.scalesOpacity },
        rotations: { array: this.rotations }
      },
      a,
      s
    );
  }
}
class bs extends Is {
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
  raycastIndex = null;
  constructor(t, e, s, r = "GaussianCloud", i = null, o = null, a = 0) {
    super(), this.ownerStore = t, this.objectId = e, this.packedGaussianCount = s, this.lod = i, this.packing = o, this.priority = a, this.name = r;
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
  set packingPriority(t) {
    this.ownerStore.updatePackingPriority(this, t);
  }
  /** Re-evaluate this cloud on the next Store pack after strategy parameters change. */
  invalidatePacking() {
    this.ownerStore.invalidateCloudPacking(this);
  }
  /** Internal Store hook used after a global budget redistribution. */
  updatePacking(t, e) {
    this.packing = e, this.packedGaussianCount = t;
  }
  /** Internal Store hook used while priorities are changed transactionally. */
  updatePackingPriority(t) {
    this.priority = t;
  }
  /** Attach a transferable snapshot built by the data backend. Raycasts remain synchronous. */
  setRaycastIndex(t) {
    this.raycastIndex = t;
  }
  /** Raycast either the packed/rendered LOD or the complete source octree. */
  raycast(t, e) {
    if (this.raycastIndex === null && (this.lod === null || this.packing === null))
      return;
    const s = new Ft().copy(this.matrixWorld).invert(), r = new dr().copy(t.ray).applyMatrix4(s), i = this.raycastIndex !== null ? this.raycastIndex.raycast(
      r,
      this.raycastMode,
      this.raycastAlphaThreshold
    ) : Us(
      r,
      this.lod.octree.data,
      this.raycastMode === "full" ? this.lod.octree.raycast(r) : this.lod.raycast(r, this.packing),
      this.raycastAlphaThreshold
    );
    if (i !== null) {
      const o = i.point.clone().applyMatrix4(this.matrixWorld), a = t.ray.origin.distanceTo(o);
      a >= t.near && a <= t.far && e.push({
        distance: a,
        point: o,
        object: this,
        index: i.gaussianIndex
      });
    }
  }
  /** Remove this cloud's Gaussian range from its store and detach it from the scene graph. */
  dispose() {
    this.ownerStore.remove(this);
  }
}
class Ln extends pr {
  constructor(t, e = {}) {
    const s = e.minDepth ?? 0, r = e.maxDepth ?? 1 / 0, i = t.nodes.filter(
      (d) => d.depth >= s && d.depth <= r && (e.leavesOnly !== !0 || d.isLeaf)
    ), o = new Float32Array(i.length * 12 * 2 * 3);
    let a = 0;
    for (const d of i) {
      const { min: h, max: g } = d.bounds, m = [
        [h.x, h.y, h.z],
        [g.x, h.y, h.z],
        [g.x, g.y, h.z],
        [h.x, g.y, h.z],
        [h.x, h.y, g.z],
        [g.x, h.y, g.z],
        [g.x, g.y, g.z],
        [h.x, g.y, g.z]
      ];
      for (const [b, p] of Yr)
        o.set(m[b], a), o.set(m[p], a + 3), a += 6;
    }
    const l = new gr();
    l.setAttribute("position", new fr(o, 3)), l.computeBoundingSphere();
    const u = e.opacity ?? 0.55, c = new mr({
      color: e.color ?? 7710719,
      opacity: u,
      transparent: u < 1,
      depthTest: e.depthTest ?? !1,
      depthWrite: !1,
      toneMapped: !1
    });
    super(l, c), this.octree = t, this.cellCount = i.length, this.name = "Gaussian octree helper", this.frustumCulled = !1, this.renderOrder = 1e3;
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
class vs {
  constructor(t, e, s) {
    this.octreeNodeId = t, this.sortedGaussianIndices = e, this.levelCounts = s;
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
class ze {
  constructor(t, e) {
    this.octree = t, this.levels = Zr(e.levels ?? Xr), this.ownsOctree = e.ownsOctree ?? !1;
    const s = e.importance ?? Kr, r = new Float64Array(t.data.count);
    for (let i = 0; i < r.length; i++) {
      const o = s(i, t);
      r[i] = Number.isFinite(o) ? o : -1 / 0;
    }
    this.nodes = t.nodes.map((i) => {
      if (i.gaussianIndices === null)
        return new vs(
          i.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const o = Uint32Array.from(
        Array.from(i.gaussianIndices).sort(
          (a, l) => r[l] - r[a] || a - l
        )
      );
      return new vs(
        i.id,
        o,
        Uint32Array.from(
          this.levels.map(
            ({ retention: a }) => Math.min(
              o.length,
              Math.max(1, Math.ceil(o.length * a))
            )
          )
        )
      );
    });
  }
  octree;
  static build(t, e = {}) {
    return new ze(t, e);
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
    let r = 0;
    for (let i = 0; i < t.nodeIds.length; i++) {
      const o = t.nodeIds[i], a = this.getLeafNode(o);
      if (s.has(o))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${o}`
        );
      s.add(o);
      const l = t.lodLevels[i], u = a.levelCounts[l];
      if (u === void 0)
        throw new RangeError(`GaussianLod level ${l} does not exist`);
      if (r + u > e.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let c = 0; c < u; c++)
        e[r++] = a.sortedGaussianIndices[c];
    }
    if (r !== e.length)
      throw new RangeError(
        `GaussianLodPacking declares ${e.length} Gaussians but selects ${r}`
      );
    return e;
  }
  raycast(t, e, s = {}) {
    this.assertUsable();
    const r = s.radiusScale ?? 3;
    if (!(r > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    const i = s.maxHits ?? 1 / 0;
    if (!(i > 0)) return [];
    if (e.nodeIds.length !== e.lodLevels.length)
      throw new RangeError("GaussianLodPacking arrays must have equal lengths");
    const o = this.octree.data.means.array, a = this.octree.data.scalesOpacity.array, l = new N(), u = new N(), c = [], d = /* @__PURE__ */ new Set();
    for (let h = 0; h < e.nodeIds.length; h++) {
      const g = e.nodeIds[h], m = this.getLeafNode(g);
      if (d.has(g))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${g}`
        );
      d.add(g);
      const b = e.lodLevels[h], p = m.levelCounts[b];
      if (p === void 0)
        throw new RangeError(`GaussianLod level ${b} does not exist`);
      const v = this.octree.nodes[g], S = Math.max(0, r - 3) * v.maxSplatRadius, T = S === 0 ? v.raycastBounds : v.raycastBounds.clone().expandByScalar(S);
      if (t.intersectsBox(T))
        for (let M = 0; M < p; M++) {
          const w = m.sortedGaussianIndices[M], C = w * 4;
          l.set(o[C], o[C + 1], o[C + 2]);
          const z = Math.max(
            a[C],
            a[C + 1],
            a[C + 2]
          ) * r;
          t.closestPointToPoint(l, u), !(u.distanceToSquared(l) > z * z) && c.push({
            gaussianIndex: w,
            distance: t.origin.distanceTo(u),
            point: u.clone()
          });
        }
    }
    return c.sort((h, g) => h.distance - g.distance), c.length > i && (c.length = i), c;
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
function Zr(n) {
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
function Kr(n, t) {
  const e = t.data.scalesOpacity.array, s = n * 4, r = [e[s], e[s + 1], e[s + 2]];
  return r.sort((i, o) => o - i), e[s + 3] * r[0] * r[1];
}
const Jr = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class zn extends Is {
  constructor(t, e, s = {}) {
    super(), this.lod = t, this.packing = e, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : Jr, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, t.indicesForPacking(e), this.rebuildMeshes(), this.setLevels(
      s.levels ?? Array.from({ length: t.levelCount }, (r, i) => i)
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
    for (const [s, r] of this.levelMeshes)
      r.visible = e.has(s);
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
    for (let i = 0; i < this.packing.nodeIds.length; i++) {
      const o = this.packing.lodLevels[i], a = t[o];
      if (a === void 0)
        throw new RangeError(`Gaussian LOD level ${o} does not exist`);
      a.push(this.packing.nodeIds[i]);
    }
    const e = new N(), s = new N(), r = new Ft();
    for (let i = 0; i < t.length; i++) {
      const o = t[i];
      if (o.length === 0) continue;
      const a = new yr(1, 1, 1), l = new xr({
        color: this.colors[i % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: br,
        toneMapped: !1,
        wireframe: this.wireframe
      }), u = new vr(a, l, o.length);
      for (let c = 0; c < o.length; c++) {
        const d = this.lod.octree.nodes[o[c]].bounds;
        d.getCenter(e), d.getSize(s), r.makeScale(s.x, s.y, s.z), r.setPosition(e), u.setMatrixAt(c, r);
      }
      u.instanceMatrix.needsUpdate = !0, u.computeBoundingSphere(), u.name = `Gaussian LOD ${i} volumes`, u.frustumCulled = !1, u.renderOrder = 900 + i, u.userData.lodLevel = i, this.levelMeshes.set(i, u), this.add(u);
    }
  }
  disposeMeshes() {
    for (const t of this.levelMeshes.values())
      t.removeFromParent(), t.geometry.dispose(), t.material.dispose();
    this.levelMeshes.clear();
  }
}
const Ie = R("uint", "gaussianIndex"), Oe = R("uint", "gaussianObjectId"), ae = R("vec3", "gaussianPositionLocal"), Jt = R("vec3", "gaussianPositionWorld"), oe = R("vec3", "gaussianScale"), le = R("vec4", "gaussianRotation"), ue = R("float", "gaussianOpacity"), Pe = R("vec3", "gaussianColor"), Be = R("mat4", "gaussianObjectMatrix"), De = R("bool", "gaussianObjectVisible"), Fe = R("vec3", "gaussianViewDirection"), Ue = R("float", "gaussianViewDepth"), Ge = R(
  "vec2",
  "gaussianScreenPosition"
), Gs = R(
  "vec2",
  "gaussianScreenBoundsMin"
), Vs = R(
  "vec2",
  "gaussianScreenBoundsMax"
), Ve = R(
  "vec2",
  "gaussianProjectedSigma"
), $e = R("float", "gaussianProjectedArea"), ce = R("uint", "rasterGaussianIndex"), je = R("uint", "rasterObjectId"), We = R("uvec2", "rasterPixelCoordinate"), qe = R("vec2", "rasterScreenPosition"), He = R("vec2", "rasterScreenUV"), Ye = R("float", "rasterPixelValue"), Xe = R("vec2", "rasterGaussianCenter"), Ze = R("vec2", "rasterPixelDelta"), $s = R("vec2", "rasterGaussianCoord"), js = R("vec2", "rasterUV"), Ke = R("float", "rasterViewDepth"), Je = R("vec3", "rasterGaussianColor"), Qe = R("float", "rasterGaussianOpacity"), ts = R("float", "rasterPower"), Ws = R("float", "rasterWeight");
function Qr() {
  return {
    gaussianPositionLocalNode: ae,
    gaussianPositionWorldNode: Jt,
    gaussianScaleNode: oe,
    gaussianRotationNode: le,
    gaussianOpacityNode: ue,
    gaussianColorNode: Pe,
    gaussianVisibilityNode: Bt(!0),
    rasterPixelValueNode: G(0),
    rasterBreakNode: Bt(!1),
    rasterColorNode: Je,
    rasterAlphaNode: Qe.mul(Os(ts)),
    rasterDiscardNode: Bt(!1)
  };
}
const Zt = /* @__PURE__ */ new Set([
  Ie,
  Oe,
  ae,
  Jt,
  oe,
  le,
  ue,
  Pe,
  Be,
  De,
  Fe,
  Ue,
  Ge,
  Gs,
  Vs,
  Ve,
  $e
]), es = /* @__PURE__ */ new Set([
  ce,
  je,
  We,
  qe,
  He,
  Ye,
  Xe,
  Ze,
  $s,
  js,
  Ke,
  Je,
  Qe,
  ts,
  Ws
]), qs = /* @__PURE__ */ new Set([
  We,
  qe,
  He
]), ti = /* @__PURE__ */ new Set([
  ...qs,
  Ye,
  ce,
  je,
  Xe,
  Ze,
  Ke
]);
function Hs(n, t, e) {
  n.traverse((s) => {
    if ((Zt.has(s) || es.has(s)) && !t.has(s))
      throw new Error(
        `A ${e} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function kt(n, t, e) {
  n.traverse((s) => {
    if ((Zt.has(s) || es.has(s)) && !t.has(s))
      throw new Error(
        `GaussianPass.${e} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const ei = [
  15228264,
  15906891,
  4900235
];
class In {
  constructor(t, e = {}) {
    if (this.pass = t, e.colors !== void 0 && e.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = e.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...e.colors ?? ei], this.tintStrength = s, this.lodLevelAttribute = t.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = t.subscribeDebug(() => this.update()), this.enabled = e.enabled ?? !0;
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
  /** Refresh after store.pack(); only a replaced backing buffer rebuilds the node. */
  update() {
    this.assertUsable(), !(!this.active || !this.lodLevelAttribute.isAllocated) && this.lodLevelAttribute.bufferAttribute !== this.boundBuffer && this.rebuildColorNode();
  }
  dispose() {
    this.disposed || (this.unsubscribeDebug(), this.active && this.pass.rasterColorNode === this.helperColorNode && (this.pass.rasterColorNode = this.baseColorNode), this.active = !1, this.baseColorNode = null, this.helperColorNode = null, this.boundBuffer = null, this.disposed = !0);
  }
  rebuildColorNode() {
    const t = this.lodLevelAttribute.bufferAttribute, e = y(t, "uint", t.count).toReadOnly().element(ce).mod(f(this.colors.length)), s = this.colors.map((o) => {
      const a = new wr(o).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return ie(a.r, a.g, a.b);
    });
    let r = s[s.length - 1];
    for (let o = s.length - 2; o >= 0; o--)
      r = e.equal(f(o)).select(s[o], r);
    const i = Rr(
      this.baseColorNode,
      r,
      G(this.tintStrength)
    );
    this.boundBuffer = t, this.helperColorNode = i, this.pass.rasterColorNode = i;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
function Ut(n) {
  if (!Number.isInteger(n) || n < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class On {
  setFromCamera(t, e) {
    return this;
  }
  pack({ lod: t, maxGaussians: e }) {
    Ut(e);
    const s = t.octree.data.count;
    if (e < s)
      throw new RangeError(
        `Maximum LOD requires ${s} Gaussians but the budget allows ${e}`
      );
    const r = t.octree.leafNodeIds.slice(), i = new Uint8Array(r.length);
    return i.fill(t.finestLevel), { nodeIds: r, lodLevels: i, gaussianCount: s };
  }
}
function ss(n, t, e) {
  return n.updateWorldMatrix(!0, !1), t.updateWorldMatrix(!0, !1), n.getWorldPosition(e), t.worldToLocal(e);
}
function rs(n, t) {
  const e = t instanceof N ? t.clone() : n.octree.bounds.getCenter(new N()), s = n.octree.rootBounds.getSize(new N()), r = Math.max(s.length() * 0.5, Number.EPSILON), i = new N(), o = Array.from(n.octree.leafNodeIds, (a) => (n.octree.nodes[a].bounds.getCenter(i), {
    nodeId: a,
    radius: i.distanceTo(e) / r
  }));
  return o.sort(
    (a, l) => a.radius - l.radius || a.nodeId - l.nodeId
  ), o;
}
class Pn {
  cameraCenter = new N();
  center;
  lodLevel;
  constructor(t = {}) {
    if (this.center = t.center instanceof N ? t.center.clone() : t.center ?? "bounds-center", t.lodLevel !== void 0 && t.lodLevel !== "finest" && (!Number.isInteger(t.lodLevel) || t.lodLevel < 0))
      throw new RangeError(
        'Radial LOD level must be a non-negative integer or "finest"'
      );
    this.lodLevel = t.lodLevel ?? "finest";
  }
  setCenter(t) {
    return this.center = t instanceof N ? t.clone() : t, this;
  }
  setFromCamera(t, e) {
    return this.setCenter(
      ss(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if (Ut(e), e === 0) return si();
    const s = this.lodLevel === "finest" ? t.finestLevel : this.lodLevel;
    if (s >= t.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const r = rs(t, this.center), i = [];
    let o = 0;
    for (const l of r) {
      const u = t.nodes[l.nodeId].levelCounts[s];
      if (o + u > e) break;
      i.push(l.nodeId), o += u;
    }
    const a = new Uint8Array(i.length);
    return a.fill(s), {
      nodeIds: Uint32Array.from(i),
      lodLevels: a,
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
  cameraCenter = new N();
  center;
  budgetShares;
  constructor(t = {}) {
    this.center = t.center instanceof N ? t.center.clone() : t.center ?? "bounds-center", this.budgetShares = ii(
      t.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(t) {
    return this.center = t instanceof N ? t.clone() : t, this;
  }
  setFromCamera(t, e) {
    return this.setCenter(
      ss(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if (Ut(e), e === 0) return ni();
    const s = t.octree.data.count;
    if (s <= e) {
      const d = t.octree.leafNodeIds.slice(), h = new Uint8Array(d.length);
      return h.fill(t.finestLevel), { nodeIds: d, lodLevels: h, gaussianCount: s };
    }
    const r = rs(t, this.center), i = [
      t.finestLevel,
      Math.max(0, t.finestLevel - 1),
      0
    ], o = [], a = [];
    let l = 0, u = 0, c = 0;
    for (let d = 0; d < i.length; d++) {
      const h = this.budgetShares[d];
      if (c += h, h === 0) continue;
      const g = d === i.length - 1 ? e : Math.floor(e * c), m = i[d];
      for (; u < r.length; ) {
        const b = r[u], p = t.nodes[b.nodeId].levelCounts[m];
        if (l + p > g) break;
        o.push(b.nodeId), a.push(m), l += p, u++;
      }
    }
    return {
      nodeIds: Uint32Array.from(o),
      lodLevels: Uint8Array.from(a),
      gaussianCount: l
    };
  }
}
function ii(n) {
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
function ni() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class Bn {
  cameraCenter = new N();
  center;
  levelDistance;
  constructor(t = {}) {
    if (this.center = t.center instanceof N ? t.center.clone() : t.center ?? "bounds-center", this.levelDistance = t.levelDistance ?? 2, !(this.levelDistance > 0) || !Number.isFinite(this.levelDistance))
      throw new RangeError(
        "Radial LOD levelDistance must be finite and positive"
      );
  }
  setCenter(t) {
    return this.center = t instanceof N ? t.clone() : t, this;
  }
  setFromCamera(t, e) {
    return this.setCenter(
      ss(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if (Ut(e), e === 0) return ai();
    const s = rs(t, this.center), r = s.map(
      ({ radius: a }) => Math.max(0, t.finestLevel - Math.floor(a / this.levelDistance))
    );
    let i = s.reduce(
      (a, l, u) => a + t.nodes[l.nodeId].levelCounts[r[u]],
      0
    );
    for (let a = s.length - 1; a >= 0 && i > e; a--) {
      const l = t.nodes[s[a].nodeId];
      for (; r[a] > 0 && i > e; ) {
        const u = l.levelCounts[r[a]];
        r[a] = r[a] - 1, i -= u - l.levelCounts[r[a]];
      }
    }
    let o = s.length;
    for (; o > 0 && i > e; ) {
      o--;
      const a = t.nodes[s[o].nodeId];
      i -= a.levelCounts[r[o]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, o).map(({ nodeId: a }) => a)
      ),
      lodLevels: Uint8Array.from(r.slice(0, o)),
      gaussianCount: i
    };
  }
}
function ai() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
function oi(n) {
  const t = new Uint32Array(n.octree.leafNodeIds), e = new Float64Array(t.length * 3), s = new Uint32Array(t.length * n.levelCount);
  for (let a = 0; a < t.length; a++) {
    const l = t[a], u = n.octree.nodes[l].bounds, c = a * 3;
    e[c] = (u.min.x + u.max.x) * 0.5, e[c + 1] = (u.min.y + u.max.y) * 0.5, e[c + 2] = (u.min.z + u.max.z) * 0.5, s.set(n.nodes[l].levelCounts, a * n.levelCount);
  }
  const r = n.octree.rootBounds.max.x - n.octree.rootBounds.min.x, i = n.octree.rootBounds.max.y - n.octree.rootBounds.min.y, o = n.octree.rootBounds.max.z - n.octree.rootBounds.min.z;
  return {
    leafNodeIds: t,
    leafCenters: e,
    levelCounts: s,
    levelCount: n.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        r * r + i * i + o * o
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const Ys = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
//# sourceMappingURL=RadialLodWorker-CftnehMz.js.map
`, ws = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Ys], { type: "text/javascript;charset=utf-8" });
function li(n) {
  let t;
  try {
    if (t = ws && (self.URL || self.webkitURL).createObjectURL(ws), !t) throw "";
    const e = new Worker(t, {
      name: n?.name
    });
    return e.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), e;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Ys),
      {
        name: n?.name
      }
    );
  }
}
const ui = 2;
class ci {
  constructor(t) {
    this.targetStrategy = t;
  }
  targetStrategy;
  worker = null;
  boundsCenter = new N();
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
  initialize(t) {
    if (this.assertUsable(), this.lod !== t) {
      if (this.lod !== null)
        throw new Error(
          "RadialLodWorkerPlanner instances cannot be shared between GaussianLod objects"
        );
      this.lod = t;
    }
  }
  initializeWorker() {
    if (this.worker !== null) return;
    const t = this.lod;
    if (t === null) throw new Error("Radial LOD worker has no GaussianLod");
    this.worker = new li({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const e = oi(t), s = Array.from(
      { length: ui },
      () => hi(e.leafNodeIds.length)
    ), r = {
      type: "init",
      data: e,
      buffers: s
    };
    this.worker.postMessage(r, [
      e.leafNodeIds.buffer,
      e.leafCenters.buffer,
      e.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: i, lodLevels: o }) => [i, o])
    ]);
  }
  request(t) {
    this.assertUsable(), this.initialize(t.lod), this.initializeWorker(), this.releaseLatestResult();
    const e = this.targetStrategy.center instanceof N ? this.targetStrategy.center : t.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
    this.latestRequestedRevision = s;
    const r = {
      type: "request",
      revision: s,
      centerX: e.x,
      centerY: e.y,
      centerZ: e.z,
      maxGaussians: t.maxGaussians
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
      maxGaussians: t.maxGaussians
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
    const t = this.latestResult;
    if (t === null) return null;
    this.latestResult = null;
    const { message: e } = t;
    let s = !1;
    return {
      packing: di(e),
      maxGaussians: t.maxGaussians,
      planningMs: e.planningMs,
      roundTripMs: t.roundTripMs,
      release: () => {
        s || (s = !0, this.recycle(e.buffer));
      }
    };
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.latestResult = null, this.queuedRequest = null, this.worker?.removeEventListener("message", this.handleMessage), this.worker?.removeEventListener("error", this.handleError), this.worker?.terminate(), this.worker = null);
  }
  handleMessage = (t) => {
    if (this.disposed) return;
    const e = t.data, s = performance.now() - this.activeStarted, r = this.activeMaxGaussians;
    this.busy = !1, e.revision === this.latestRequestedRevision ? (this.releaseLatestResult(), this.latestResult = { message: e, maxGaussians: r, roundTripMs: s }) : (this.discarded++, this.recycle(e.buffer));
    const i = this.queuedRequest;
    this.queuedRequest = null, i !== null && this.dispatch(i);
  };
  handleError = (t) => {
    this.disposed || (this.busy = !1, this.queuedRequest = null, this.latestError = new Error(t.message || "Radial LOD worker failed"));
  };
  dispatch(t) {
    this.busy = !0, this.activeMaxGaussians = t.maxGaussians, this.activeStarted = performance.now(), this.worker.postMessage(t.message);
  }
  releaseLatestResult() {
    const t = this.latestResult;
    t !== null && (this.latestResult = null, this.discarded++, this.recycle(t.message.buffer));
  }
  recycle(t) {
    this.disposed || this.worker.postMessage({ type: "recycle", buffer: t }, [
      t.nodeIds,
      t.lodLevels
    ]);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("RadialLodWorkerPlanner has been disposed");
  }
}
function hi(n) {
  return {
    nodeIds: new ArrayBuffer(n * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(n * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function di(n) {
  return {
    nodeIds: new Uint32Array(n.buffer.nodeIds, 0, n.length),
    lodLevels: new Uint8Array(n.buffer.lodLevels, 0, n.length),
    gaussianCount: n.gaussianCount
  };
}
const pi = 1024 * 1024, gi = 16, fi = 1.25;
class Xs {
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
    if (this.targetStrategy = t, this.targetPlanner = e.targetPlanner ?? null, this.maxUploadBytesPerPack = e.maxUploadBytesPerPack ?? pi, this.maxChangedCellsPerPack = e.maxChangedCellsPerPack ?? gi, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
    if (Ut(t.maxGaussians), this.bindLod(t.lod), !this.initialized) {
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
    if (Ut(t.maxGaussians), this.bindLod(t.lod), !this.initialized)
      throw new Error(
        "StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches"
      );
    if (this.refreshTarget(t), this.changeCursor >= this.changes.length) return null;
    const e = [];
    let s = 0;
    for (; this.changeCursor < this.changes.length; ) {
      const r = this.changes[this.changeCursor], i = e.length >= this.maxChangedCellsPerPack || s + r.estimatedUploadBytes > this.maxUploadBytesPerPack;
      if (e.length > 0 && i && this.appliedGaussianCount <= t.maxGaussians)
        break;
      this.applyChange(r), e.push({ nodeId: r.nodeId, lodLevel: r.lodLevel }), s += r.estimatedUploadBytes, this.changeCursor++;
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
    return Ss(t.lod, e, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.targetDirty = !1, e;
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
        Ss(t.lod, e.packing, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.changes = this.planChanges(t.lod, e.packing), this.changeCursor = 0, this.latestTargetPlanningMs = e.planningMs, this.latestTargetRoundTripMs = e.roundTripMs;
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
    for (let o = 0; o < e.nodeIds.length; o++)
      s[e.nodeIds[o]] = e.lodLevels[o];
    const r = [], i = [];
    for (let o = this.appliedCellCount - 1; o >= 0; o--) {
      const a = this.appliedNodeIds[o], l = this.appliedLodLevels[o], u = s[a];
      (u < 0 || u < l) && r.push(
        Ns(
          t,
          a,
          l,
          u < 0 ? null : u
        )
      );
    }
    for (let o = 0; o < e.nodeIds.length; o++) {
      const a = e.nodeIds[o], l = e.lodLevels[o], u = this.appliedIndices[a], c = u < 0 ? null : this.appliedLodLevels[u];
      (c === null || l > c) && i.push(Ns(t, a, c, l));
    }
    return [...r, ...i];
  }
  applyChange(t) {
    const e = this.appliedIndices[t.nodeId];
    if (t.lodLevel === null) {
      if (e < 0) return;
      const s = --this.appliedCellCount;
      if (e !== s) {
        const r = this.appliedNodeIds[s];
        this.appliedNodeIds[e] = r, this.appliedLodLevels[e] = this.appliedLodLevels[s], this.appliedIndices[r] = e;
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
function _s(n) {
  return n instanceof Xs;
}
function Ns(n, t, e, s) {
  const r = n.nodes[t], i = e === null ? 0 : r.levelCounts[e], o = s === null ? 0 : r.levelCounts[s], a = Math.max(0, o - i), l = Math.max(0, i - o), u = e !== null && s !== null && e !== s ? Math.min(i, o) : 0, c = 48 + n.octree.data.shCoefficientCount * Bs + 4;
  return {
    nodeId: t,
    lodLevel: s,
    gaussianDelta: o - i,
    estimatedUploadBytes: Math.ceil(
      (a * c + l * 16 + u * 4) * fi
    )
  };
}
function Ss(n, t, e) {
  if (t.gaussianCount > e)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${e} Gaussians`
    );
  if (t.nodeIds.length !== t.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  for (let i = 0; i < t.nodeIds.length; i++) {
    const o = t.nodeIds[i], a = t.lodLevels[i], u = n.nodes[o]?.levelCounts[a];
    if (u === void 0 || n.octree.nodes[o]?.isLeaf !== !0)
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${o} or level ${a}`
      );
    if (s.has(o))
      throw new Error(`GaussianLod packing contains duplicate node ${o}`);
    s.add(o), r += u;
  }
  if (r !== t.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${t.gaussianCount} Gaussians but selects ${r}`
    );
}
class mi {
  allocate({ remainingGaussians: t }) {
    return t;
  }
}
class Dn {
  fraction;
  constructor(t) {
    if (!(t > 0 && t <= 1))
      throw new RangeError("Gaussian source budget fraction must be in (0, 1]");
    this.fraction = t;
  }
  allocate({ remainingGaussians: t, entry: e }) {
    return Math.min(
      t,
      Math.floor(e.sourceGaussianCount * this.fraction)
    );
  }
}
function Ht(n, t, e) {
  if (n.length === 0) return [];
  n.sort((d, h) => d - h);
  const s = [];
  let r = n[0], i = r, o = 1;
  for (let d = 1; d <= n.length; d++) {
    const h = n[d];
    if (h !== i) {
      if (h !== void 0 && o++, h === i + 1) {
        i = h;
        continue;
      }
      s.push({ start: r, count: i - r + 1 }), h !== void 0 && (r = i = h);
    }
  }
  if (s.length < 2) return s;
  const a = Math.floor(o * e);
  let l = 0;
  const u = [];
  let c = { ...s[0] };
  for (let d = 1; d < s.length; d++) {
    const h = s[d], g = c.start + c.count, m = h.start - g;
    m <= t && l + m <= a ? (c.count = h.start + h.count - c.start, l += m) : (u.push(c), c = { ...h });
  }
  return u.push(c), u;
}
function Yt(n) {
  let t = 0;
  for (const e of n) t += e.count;
  return t;
}
function rt(n, t, e) {
  if (t.length !== 0) {
    for (const s of t)
      n.addUpdateRange(
        s.start * e,
        s.count * e
      );
    n.needsUpdate = !0;
  }
}
const Zs = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), Ks = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), Js = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class yi {
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
  [Zs](t) {
    this.assertUsable();
    const e = this.packedBuffer, s = new Dt(t, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, e?.dispose();
  }
  [Ks](t) {
    rt(this.bufferAttribute, t, 1);
  }
  [Js]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const Qs = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), tr = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class xi {
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
  [Qs](t, e) {
    const s = this.attributes.get(t);
    if (s !== void 0) {
      if (s.format !== e)
        throw new Error(
          `GaussianStore attribute ${t} already uses format ${s.format}`
        );
      return s;
    }
    const r = new yi(t, e);
    return this.attributes.set(t, r), r;
  }
  [tr]() {
    for (const t of this.attributes.values())
      t[Js]();
    this.attributes.clear();
  }
}
class bi {
  constructor(t) {
    this.attribute = t;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(t) {
    this.writtenSlots.length = 0, this.attribute[Zs](new Uint32Array(t)), this.freshBuffer = !0;
  }
  backfill(t) {
    const e = this.attribute.array;
    for (const s of t.cells)
      for (const r of s.slots)
        e[r] = s.lodLevel, this.writtenSlots.push(r);
  }
  updateCell(t) {
    const { previousCell: e, cell: s, retainedCount: r } = t, i = e?.lodLevel === s.lodLevel ? r : 0, o = this.attribute.array;
    for (let a = i; a < s.slots.length; a++) {
      const l = s.slots[a];
      o[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const t = this.writtenSlots.length, e = Ht(this.writtenSlots, 16, 0.25), s = Yt(e);
    return this.freshBuffer || this.attribute[Ks](e), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: t,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: e
    };
  }
}
const vi = 16777216;
class Fn {
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new xi();
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
  packedContentVersion = 0;
  constructor(t = {}) {
    this.loader = t.loader ?? new Dr(), this.budgetingStrategy = t.budgetingStrategy ?? new mi(), this.defaultPackingStrategy = t.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...t.defaultStreamingLod }, this.maxGaussiansOption = Ni(
      t.maxGaussians ?? "auto"
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
  /** Changes after a successful full or incremental packed-data update. */
  get contentVersion() {
    return this.packedContentVersion;
  }
  get count() {
    return this.entries.reduce((t, e) => t + e.count, 0);
  }
  get shDegree() {
    let t = 0;
    for (const e of this.entries)
      e.sourceDegree > t && (t = e.sourceDegree);
    return t;
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
    const t = this.attributes.get("lodLevel");
    if (t !== void 0) return t;
    const e = this.attributes[Qs](
      "lodLevel",
      "u32"
    ), s = new bi(e);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), e;
  }
  async load(t, e = {}) {
    this.assertUsable();
    const s = await this.loader.load(t);
    let r = null, i = null;
    try {
      return r = Le.build(s, {
        ...e.octree,
        ownsData: !0
      }), i = ze.build(r, {
        ...e.lod,
        ownsOctree: !0
      }), this.addLod(i, {
        name: e.name ?? _i(t),
        priority: e.priority,
        packingStrategy: e.packingStrategy,
        ownsLod: !0
      });
    } catch (o) {
      throw i !== null ? i.dispose() : r !== null ? r.dispose() : s.dispose(), o;
    }
  }
  add(t, e = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), r = Ne(e.priority ?? 0), i = new bs(
      this,
      s,
      0,
      e.name,
      null,
      null,
      r
    );
    return this.entries.push({
      cloud: i,
      count: 0,
      sourceGaussianCount: t.count,
      sourceDegree: t.shDegree,
      priority: r,
      packingStrategy: null,
      ownsPackingStrategy: !1,
      lastLodFocus: new N(Number.NaN, Number.NaN, Number.NaN),
      source: t,
      ownsSource: e.ownsData ?? !1,
      lod: null,
      ownsLod: !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(i), this.invalidatePacking(), i;
  }
  addLod(t, e = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), r = Ne(e.priority ?? 0), i = new bs(
      this,
      s,
      0,
      e.name,
      t,
      null,
      r
    ), o = e.packingStrategy ?? this.defaultPackingStrategy ?? Si(this.defaultStreamingLod);
    return this.entries.push({
      cloud: i,
      count: 0,
      sourceGaussianCount: t.octree.data.count,
      sourceDegree: t.octree.data.shDegree,
      priority: r,
      packingStrategy: o,
      ownsPackingStrategy: e.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new N(Number.NaN, Number.NaN, Number.NaN),
      source: null,
      ownsSource: !1,
      lod: t,
      ownsLod: e.ownsLod ?? !1,
      packing: null,
      allocatedBudget: null,
      packingDirty: !0
    }), this.cloudList.push(i), this.invalidatePacking(), i;
  }
  remove(t) {
    if (this.disposed) return;
    const e = this.entries.findIndex((r) => r.cloud === t);
    if (e < 0) return;
    const [s] = this.entries.splice(e, 1);
    this.cloudList.splice(this.cloudList.indexOf(t), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && Ts(s.packingStrategy), t.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: t }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const e = Mi(t, this.shDegree), s = this.maxGaussiansOption === "auto" ? e : Math.min(e, this.maxGaussiansOption), r = performance.now(), i = this.planPackings(s), o = performance.now() - r, a = Math.min(
      s,
      this.entries.reduce((g, m) => g + m.sourceGaussianCount, 0)
    ), l = this.packedData, u = l !== null && l.count === a && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, c = performance.now(), d = u ? this.updatePackedData(i, l) : this.buildPackedData(i, a), h = performance.now() - c;
    for (const g of i)
      g.entry.count = g.count, g.entry.packing = g.packing, g.entry.allocatedBudget = g.allocatedBudget, g.entry.packingDirty = !1, g.entry.cloud.updatePacking(g.count, g.packing);
    this.packedData = d.data, this.cellSlotsByEntry = d.cellSlotsByEntry, this.freeSlots = d.freeSlots, this.gaussianCapacity = s, this.packedObjectCapacity = this.objectCapacity, this.packingInvalid = !1, this.latestPackStats = { ...d.stats, planningMs: o, slotUpdateMs: h }, u || (this.layoutVersion++, l?.dispose()), this.packedContentVersion++;
  }
  /**
   * Apply one bounded batch from a StreamingLodPackingStrategy without global
   * budget planning or scanning unchanged clouds/cells.
   */
  packLodBatch(t) {
    if (this.assertUsable(), this.packingInvalid || this.packedData === null)
      throw new Error(
        "GaussianStore layout is invalidated; call store.pack({ limits: device.limits }) before streaming LOD batches"
      );
    const e = this.entries.find((_) => _.cloud === t);
    if (e === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    if (e.lod === null || e.packing === null || e.allocatedBudget === null)
      throw new Error("GaussianCloud is not an initialized LOD entry");
    const s = e.packingStrategy;
    if (!_s(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const r = performance.now(), i = s.takeNextBatch({
      lod: e.lod,
      maxGaussians: e.allocatedBudget
    }), o = performance.now() - r;
    if (i === null)
      return { applied: !1, pending: s.needsPack };
    const a = this.packedData, l = this.cellSlotsByEntry.get(e);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const u = performance.now(), c = l, d = this.freeSlots, h = this.scratchReleasedSlots;
    h.length = 0;
    const g = /* @__PURE__ */ new Map();
    for (const _ of i.transitions) {
      const I = l.get(_.nodeId), B = _.lodLevel === null ? 0 : e.lod.nodes[_.nodeId].levelCounts[_.lodLevel], E = Math.min(
        I?.slots.length ?? 0,
        B
      );
      if (g.set(_.nodeId, {
        previousCell: I,
        retainedCount: E
      }), I !== void 0)
        for (let F = E; F < I.slots.length; F++) {
          const D = I.slots[F];
          d.push(D), h.push(D);
        }
    }
    const m = this.scratchWrittenSlots;
    m.length = 0;
    for (const _ of i.transitions) {
      const I = g.get(_.nodeId), { previousCell: B, retainedCount: E } = I;
      if (_.lodLevel === null) {
        c.delete(_.nodeId);
        continue;
      }
      const F = e.lod.nodes[_.nodeId].levelCounts[_.lodLevel], D = B?.slots, q = D !== void 0 && D.length === F ? D : new Uint32Array(F);
      q !== D && D !== void 0 && E > 0 && q.set(D.subarray(0, E));
      for (let $ = E; $ < F; $++) {
        const ot = d.pop();
        if (ot === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          e,
          this.cellSourceIndex(e, _.nodeId, $),
          ot,
          a.means.array,
          a.scalesOpacity.array,
          a.rotations.array,
          a.shCoefficients.array,
          a.shCoefficientCount
        ), q[$] = ot, m.push(ot);
      }
      const at = {
        lodLevel: _.lodLevel,
        slots: q
      };
      for (const $ of this.attributePackers)
        $.updateCell({ previousCell: B, cell: at, retainedCount: E });
      c.set(_.nodeId, at);
    }
    const b = this.nextSlotMarkGeneration(a.count);
    for (const _ of m) this.slotMarks[_] = b;
    const p = this.scratchClearedSlots;
    p.length = 0;
    for (const _ of h)
      this.slotMarks[_] !== b && p.push(_);
    const v = a.scalesOpacity.array;
    for (const _ of p) v[_ * 4 + 3] = 0;
    const S = Ht(m, 4, 0.15), T = Ht(p, 16, 0.25);
    rt(a.means, S, 4), rt(a.scalesOpacity, S, 4), rt(a.scalesOpacity, T, 4), rt(a.rotations, S, 4), rt(
      a.shCoefficients,
      S,
      a.shCoefficientCount * a.shCoefficients.itemSize
    );
    const M = this.commitAttributePackers(), w = this.count - e.count + i.packing.gaussianCount, C = Yt(S), z = Yt(T), A = performance.now() - u;
    return e.count = i.packing.gaussianCount, e.packing = i.packing, e.packingDirty = !1, e.cloud.updatePacking(e.count, e.packing), this.cellSlotsByEntry.set(e, c), this.freeSlots = d, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: a.count,
      activeGaussians: w,
      reusedSlots: w - m.length,
      writtenSlots: m.length,
      clearedSlots: p.length,
      estimatedUploadBytes: C * _e(a) + z * 16 + M.estimatedUploadBytes,
      writtenSlotRanges: S,
      clearedSlotRanges: T,
      planningMs: o,
      slotUpdateMs: A
    }, this.packedContentVersion++, { applied: !0, pending: i.pending };
  }
  planPackings(t) {
    const e = [...this.entries].sort(
      (i, o) => i.priority - o.priority || i.cloud.objectId - o.cloud.objectId
    ), s = [];
    let r = 0;
    for (const i of e) {
      const o = Math.max(0, t - r), a = this.budgetingStrategy.allocate({
        capacity: t,
        allocatedGaussians: r,
        remainingGaussians: o,
        entry: {
          cloud: i.cloud,
          priority: i.priority,
          insertionIndex: i.cloud.objectId,
          sourceGaussianCount: i.sourceGaussianCount
        }
      });
      if (Ti(a, o), i.lod === null) {
        if (i.sourceGaussianCount > a)
          throw new RangeError(
            `${i.cloud.name} requires ${i.sourceGaussianCount} Gaussians but its Store allocation is ${a}`
          );
        s.push({
          entry: i,
          count: i.sourceGaussianCount,
          packing: null,
          allocatedBudget: a,
          selectionChanged: i.packingDirty || i.allocatedBudget !== a
        }), r += i.sourceGaussianCount;
        continue;
      }
      const l = i.packingStrategy, u = i.packingDirty || i.allocatedBudget !== a || i.packing === null, c = !u && i.packing !== null ? i.packing : l.pack({
        lod: i.lod,
        maxGaussians: a
      });
      if (c.gaussianCount > a)
        throw new RangeError(
          `${l.constructor.name} exceeded its allocation of ${a} Gaussians`
        );
      Ci(i.lod, c), s.push({
        entry: i,
        count: c.gaussianCount,
        packing: c,
        allocatedBudget: a,
        selectionChanged: u
      }), r += c.gaussianCount;
    }
    return s;
  }
  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(t, e) {
    this.assertUsable();
    const s = this.entries.find((i) => i.cloud === t);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const r = Ne(e);
    s.priority = r, t.updatePackingPriority(r), this.invalidatePacking();
  }
  /** Mark one cloud for strategy re-evaluation after its strategy parameters change. */
  invalidateCloudPacking(t) {
    this.assertUsable();
    const e = this.entries.find((s) => s.cloud === t);
    if (e === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    e.packingDirty = !0, this.packingInvalid = !0;
  }
  /**
   * Update camera-relative streaming LODs and apply at most one
   * bounded upload batch per cloud. GaussianPass calls this automatically.
   */
  updateLod(t) {
    if (this.assertUsable(), this.packingInvalid || this.packedData === null)
      return { appliedBatches: 0, pending: !1, clouds: [] };
    t.updateWorldMatrix(!0, !1);
    const e = new N(), s = new N();
    let r = 0, i = !1;
    const o = [];
    for (const a of this.entries) {
      const l = a.packingStrategy;
      if (a.lod === null || l === null || !_s(l))
        continue;
      a.cloud.updateWorldMatrix(!0, !1), t.getWorldPosition(e), a.cloud.worldToLocal(e);
      const u = a.lod.octree.rootBounds.getSize(new N()).length() * 0.5, c = Math.max(0.05, u * 0.025);
      (!Number.isFinite(a.lastLodFocus.x) || e.distanceToSquared(a.lastLodFocus) >= c * c) && (l.setFromCamera(t, a.cloud), a.lastLodFocus.copy(e));
      let d = !1;
      l.needsPack && (d = this.packLodBatch(a.cloud).applied, d && r++);
      const h = l.needsPack;
      i ||= h, a.lod.octree.rootBounds.getCenter(s), o.push({
        cloud: a.cloud,
        focusDistance: e.distanceTo(s),
        applied: d,
        pending: h,
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
      for (const t of this.entries)
        t.source !== null && t.ownsSource && t.source.dispose(), t.lod !== null && t.ownsLod && t.lod.dispose(), t.ownsPackingStrategy && Ts(t.packingStrategy), t.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[tr](), this.attributePackers.length = 0;
    }
  }
  buildPackedData(t, e) {
    const s = this.shDegree, r = (s + 1) ** 2, i = new Float32Array(e * 4), o = new Float32Array(e * 4), a = new Float32Array(e * 4), l = new Uint32Array(e * r), u = /* @__PURE__ */ new Map();
    let c = 0;
    for (const b of t) {
      const { entry: p } = b, v = /* @__PURE__ */ new Map();
      for (const S of this.plannedCells(b)) {
        const T = new Uint32Array(S.count);
        for (let M = 0; M < S.count; M++) {
          const w = this.cellSourceIndex(p, S.nodeId, M);
          this.copySourceToSlot(
            p,
            w,
            c,
            i,
            o,
            a,
            l,
            r
          ), T[M] = c++;
        }
        v.set(S.nodeId, {
          lodLevel: S.lodLevel,
          slots: T
        });
      }
      u.set(p, v);
    }
    const d = Array.from(
      { length: e - c },
      (b, p) => e - 1 - p
    ), h = new Ps(
      {
        means: se("3dgs.store.means-object", i),
        scalesOpacity: se("3dgs.store.scales-opacity", o),
        rotations: se("3dgs.store.rotations", a),
        shCoefficients: se(
          "3dgs.store.sh-coefficients",
          l,
          1
        )
      },
      {
        count: e,
        shDegree: s,
        shFormat: this.packedShFormat,
        ownsBuffers: !0
      }
    ), g = this.collectPackedLayoutCells(u);
    for (const b of this.attributePackers)
      b.allocate(e), b.backfill({ cells: g });
    const m = this.commitAttributePackers();
    return {
      data: h,
      cellSlotsByEntry: u,
      freeSlots: d,
      stats: {
        fullRebuild: !0,
        slotCapacity: e,
        activeGaussians: c,
        reusedSlots: 0,
        writtenSlots: c,
        clearedSlots: 0,
        estimatedUploadBytes: c * _e(h) + m.estimatedUploadBytes,
        writtenSlotRanges: c === 0 ? [] : [{ start: 0, count: c }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(t, e) {
    const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set();
    let i = 0;
    for (const w of t) {
      if (r.add(w.entry), i += w.count, !w.selectionChanged) continue;
      const C = /* @__PURE__ */ new Map();
      for (const z of this.plannedCells(w))
        C.set(z.nodeId, z);
      s.set(w.entry, C);
    }
    const o = [...this.freeSlots], a = this.scratchReleasedSlots;
    a.length = 0;
    for (const [w, C] of this.cellSlotsByEntry) {
      const z = s.get(w);
      if (!(z === void 0 && r.has(w)))
        for (const [A, _] of C) {
          const I = _.slots, B = Math.min(
            I.length,
            z?.get(A)?.count ?? 0
          );
          for (let E = B; E < I.length; E++) {
            const F = I[E];
            o.push(F), a.push(F);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), u = this.scratchWrittenSlots;
    u.length = 0;
    let c = 0;
    for (const w of t) {
      const C = this.cellSlotsByEntry.get(w.entry);
      if (!w.selectionChanged && C !== void 0) {
        l.set(w.entry, C), c += w.count;
        continue;
      }
      const z = /* @__PURE__ */ new Map();
      for (const A of s.get(w.entry)?.values() ?? []) {
        const _ = C?.get(A.nodeId), I = _?.slots, B = Math.min(I?.length ?? 0, A.count), E = I !== void 0 && I.length === A.count ? I : new Uint32Array(A.count);
        E !== I && I !== void 0 && B > 0 && E.set(I.subarray(0, B)), c += B;
        for (let D = B; D < A.count; D++) {
          const q = o.pop();
          if (q === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            w.entry,
            this.cellSourceIndex(w.entry, A.nodeId, D),
            q,
            e.means.array,
            e.scalesOpacity.array,
            e.rotations.array,
            e.shCoefficients.array,
            e.shCoefficientCount
          ), E[D] = q, u.push(q);
        }
        const F = {
          lodLevel: A.lodLevel,
          slots: E
        };
        for (const D of this.attributePackers)
          D.updateCell({
            previousCell: _,
            cell: F,
            retainedCount: B
          });
        z.set(A.nodeId, F);
      }
      l.set(w.entry, z);
    }
    const d = this.nextSlotMarkGeneration(e.count);
    for (const w of u) this.slotMarks[w] = d;
    const h = this.scratchClearedSlots;
    h.length = 0;
    for (const w of a)
      this.slotMarks[w] !== d && h.push(w);
    const g = e.scalesOpacity.array;
    for (const w of h) g[w * 4 + 3] = 0;
    const m = u.length, b = h.length, p = Ht(u, 4, 0.15), v = Ht(h, 16, 0.25);
    rt(e.means, p, 4), rt(e.scalesOpacity, p, 4), rt(e.scalesOpacity, v, 4), rt(e.rotations, p, 4), rt(
      e.shCoefficients,
      p,
      e.shCoefficientCount * e.shCoefficients.itemSize
    );
    const S = this.commitAttributePackers(), T = Yt(p), M = Yt(v);
    return {
      data: e,
      cellSlotsByEntry: l,
      freeSlots: o,
      stats: {
        fullRebuild: !1,
        slotCapacity: e.count,
        activeGaussians: i,
        reusedSlots: c,
        writtenSlots: m,
        clearedSlots: b,
        estimatedUploadBytes: T * _e(e) + M * 16 + S.estimatedUploadBytes,
        writtenSlotRanges: p,
        clearedSlotRanges: v,
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  plannedCells(t) {
    return t.entry.lod === null || t.packing === null ? [{ nodeId: -1, lodLevel: 0, count: t.count }] : Array.from(t.packing.nodeIds, (e, s) => ({
      nodeId: e,
      lodLevel: t.packing.lodLevels[s],
      count: t.entry.lod.nodes[e].levelCounts[t.packing.lodLevels[s]]
    }));
  }
  collectPackedLayoutCells(t = this.cellSlotsByEntry) {
    const e = [];
    for (const s of t.values())
      for (const r of s.values())
        e.push(r);
    return e;
  }
  commitAttributePackers() {
    let t = 0, e = 0, s = 0;
    const r = [];
    for (const i of this.attributePackers) {
      const o = i.commit();
      t += o.writtenSlots, e += o.uploadedSlots, s += o.estimatedUploadBytes, r.push(...o.slotRanges);
    }
    return { writtenSlots: t, uploadedSlots: e, estimatedUploadBytes: s, slotRanges: r };
  }
  cellSourceIndex(t, e, s) {
    return t.lod === null ? s : t.lod.nodes[e].sortedGaussianIndices[s];
  }
  copySourceToSlot(t, e, s, r, i, o, a, l) {
    const u = t.lod?.octree.data ?? t.source;
    if (u === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    we(u.means.array, e, r, s), we(
      u.scalesOpacity.array,
      e,
      i,
      s
    ), we(
      u.rotations.array,
      e,
      o,
      s
    ), r[s * 4 + 3] = t.cloud.objectId, wi(
      u,
      e,
      a,
      s,
      l
    );
  }
  invalidatePacking() {
    this.packingInvalid = !0;
    for (const t of this.entries)
      t.packingDirty = !0, t.allocatedBudget = null, t.count = 0, t.packing = null, t.cloud.updatePacking(0, null);
  }
  allocateObjectId() {
    const t = this.nextObjectId++;
    if (t >= vi)
      throw new RangeError(
        "GaussianStore exhausted object IDs exactly representable in means.w"
      );
    return t;
  }
  nextSlotMarkGeneration(t) {
    return this.slotMarks.length !== t && (this.slotMarks = new Uint32Array(t), this.slotMarkGeneration = 0), this.slotMarkGeneration++, this.slotMarkGeneration === 4294967295 && (this.slotMarks.fill(0), this.slotMarkGeneration = 1), this.slotMarkGeneration;
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianStore has been disposed");
  }
}
function se(n, t, e = 4) {
  const s = new Dt(t, e);
  return s.name = n, s;
}
function we(n, t, e, s) {
  e.set(
    n.subarray(t * 4, t * 4 + 4),
    s * 4
  );
}
function wi(n, t, e, s, r) {
  const i = n.shCoefficientCount, o = Math.min(
    i,
    r
  ), a = s * r;
  if (e.fill(
    0,
    a,
    a + r
  ), n.shFormat === "rgb8e8") {
    const c = t * i;
    e.set(
      n.shCoefficients.array.subarray(
        c,
        c + o
      ),
      a
    );
    return;
  }
  const l = n.shCoefficients.array, u = t * i * 4;
  for (let c = 0; c < o; c++) {
    const d = u + c * 4;
    e[a + c] = Pr(
      l[d],
      l[d + 1],
      l[d + 2]
    );
  }
}
function _e(n) {
  return 48 + n.shCoefficientCount * Ds(n.shFormat);
}
function _i(n) {
  const t = n.split(/[?#]/, 1)[0] ?? n;
  return t.slice(t.lastIndexOf("/") + 1) || "GaussianCloud";
}
function Ne(n) {
  if (!Number.isSafeInteger(n))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return n;
}
function Ni(n) {
  if (n !== "auto" && (!Number.isSafeInteger(n) || n <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return n;
}
function Si(n) {
  const t = new ri();
  return new Xs(t, {
    ...n,
    targetPlanner: new ci(t)
  });
}
function Ts(n) {
  n !== null && "dispose" in n && typeof n.dispose == "function" && n.dispose();
}
function Ti(n, t) {
  if (!Number.isSafeInteger(n) || n < 0 || n > t)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${t}]`
    );
}
function Ci(n, t) {
  if (t.nodeIds.length !== t.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const e = /* @__PURE__ */ new Set();
  let s = 0;
  for (let r = 0; r < t.nodeIds.length; r++) {
    const i = t.nodeIds[r], o = n.nodes[i], a = n.octree.nodes[i], l = t.lodLevels[r], u = o?.levelCounts[l];
    if (u === void 0 || a === void 0)
      throw new RangeError(
        `GaussianLod packing references invalid node ${i} or level ${l}`
      );
    if (!a.isLeaf)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${i} is internal`
      );
    if (e.has(i))
      throw new Error(`GaussianLod packing contains duplicate node ${i}`);
    e.add(i), s += u;
  }
  if (s !== t.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${t.gaussianCount} Gaussians but selects ${s}`
    );
}
function Mi(n, t) {
  const e = Cs(
    n.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Cs(n.maxBufferSize, "maxBufferSize"), r = Math.max(
    16,
    (t + 1) ** 2 * Ds("rgb8e8")
  );
  return Math.floor(Math.min(e, s) / r);
}
function Cs(n, t) {
  if (!Number.isSafeInteger(n) || n <= 0)
    throw new RangeError(
      `GPUDevice limit ${t} must be a positive safe integer`
    );
  return n;
}
const P = 16, x = 256, ki = 8192, V = 512, ke = 4, k = 1 << ke, it = 4, ut = x * it, K = ut, nt = 32, Ai = (
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
), Ri = (
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
), Ei = (
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
function er(n, t) {
  return Math.max(1, Math.ceil(2 * n / t));
}
function Li(n, t) {
  if (n !== null) {
    if (!Number.isInteger(n) || n < x || n % x !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${x} and at least ${x}`
      );
    if (er(t, n) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const zi = (
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
  let radix_blocks = (count + ${ut - 1}u) / ${ut}u;
  let reduce_chunks = (radix_blocks + ${K - 1}u) / ${K}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${k}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${x - 1}u) / ${x}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function Ii(n) {
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
const Oi = (
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
      new Dt(new Float32Array(e * s), s)
    );
  }
  createUint(t, e, s = 1) {
    return this.track(
      t,
      new Dt(new Uint32Array(e * s), s)
    );
  }
  createIndirect(t) {
    return this.track(
      t,
      new _r(new Uint32Array(4), 4)
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
class Pi {
  constructor(t, e, s, r, i) {
    this.renderer = t, this.visibleDispatch = i, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      e
    );
    const o = L(
      Oi
    );
    this.computeNode = o({
      rank: tt,
      state: y(i.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: y(
        r,
        "uvec2",
        e
      ).toReadOnly(),
      tile_counts: y(
        s,
        "uint",
        e
      ).toReadOnly(),
      ordered_tile_counts: y(this.tileCounts, "uint", e)
    }).computeKernel([x]).setName("3DGS gather depth-ordered tile counts WGSL");
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
function sr(n) {
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
  scratch: ptr<workgroup, array<u32, ${V}>>
) -> u32 {
  let base = group_id * ${V}u;
  let first = base + lane;
  let second = first + ${x}u;
  (*scratch)[lane] = ${n.readValue("first")};
  (*scratch)[lane + ${x}u] = ${n.readValue("second")};
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
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${x}u]; }
  return 0u;
}
`
  );
}
const Bi = sr({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (n) => `select(0u, (*input_values)[${n}], ${n} < length)`
}), Di = sr({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (n) => `select(0u, 1u, ${n} < length && (*input_values)[${n}].w > 0.0)`
}), Fi = (
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
class Ae {
  output;
  attributes = new ct();
  levels = [];
  constructor(t, e, s = "intersections", r = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, e);
    const i = L(Bi), o = L(
      Di
    ), a = L(Fi);
    let l = t, u = this.output, c = e;
    for (; ; ) {
      const d = Math.ceil(c / V), h = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        d
      ), g = j("uint", V), m = this.levels.length === 0 && r === "projectedVisibility", b = (m ? o : i)({
        lane: xt,
        group_id: Z.x,
        length: f(c),
        input_values: y(
          l,
          m ? "vec4" : "uint",
          c
        ).toReadOnly(),
        output_values: y(u, "uint", c),
        block_sums: y(h, "uint", d),
        scratch: g
      }).computeKernel([x]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
      if (this.levels.push({
        length: c,
        blockCount: d,
        output: u,
        scanNode: b
      }), d <= 1) break;
      l = h, c = d, u = this.attributes.createUint(
        `3dgs.${s}-scan-offsets-${this.levels.length}`,
        c
      );
    }
    for (let d = 0; d < this.levels.length - 1; d++) {
      const h = this.levels[d], g = this.levels[d + 1];
      h.addNode = a({
        index: tt,
        length: f(h.length),
        values: y(h.output, "uint", h.length),
        block_offsets: y(
          g.output,
          "uint",
          g.length
        ).toReadOnly()
      }).compute(h.length, [x]).setName(`3DGS ${s} add scan offsets WGSL ${d}`);
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
class Ui {
  constructor(t, e) {
    this.camera = t, this.background = e;
  }
  camera;
  background;
  projection = $t(new Ft());
  view = $t(new Ft());
  viewport = $t(new Nr());
  tilesX = $t(1, "uint");
  tilesY = $t(1, "uint");
  update(t, e, s, r) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(t, e, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = r;
  }
}
function rr(n) {
  const { center: t, conic: e, powerThreshold: s, tileX: r, tileY: i, onHit: o } = n;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${r}), f32(${i})) * ${P}.0;
      let rect_max = rect_min + vec2<f32>(${P}.0);
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
          select(-${P}.0, ${P}.0, x_left),
          select(-${P}.0, ${P}.0, y_above)
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
        ${o}
      }`
  );
}
const Gi = (
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
  let radix_blocks = (count + ${ut - 1}u) / ${ut}u;
  let reduce_chunks = (radix_blocks + ${K - 1}u) / ${K}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${k}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${x - 1}u) / ${x}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), Vi = (() => {
  const n = rr({
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
    clamp(i32(floor((center.x - radius.x) / ${P}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${P}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${P}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${P}.0)), 0, max_tile_y)
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
class $i {
  constructor(t, e, s, r, i, o, a, l, u, c, d) {
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
      o,
      "uint",
      e
    ).toReadOnly(), g = y(
      a,
      "uint",
      e
    ).toReadOnly(), m = y(
      i.state,
      "uvec4",
      1
    ).toReadOnly(), b = L(Gi);
    this.prepareNode = b({
      item_count_state: m,
      capacity: f(s),
      tile_counts: h,
      intersection_offsets: g,
      state: y(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: y(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: y(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: y(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const p = L(Vi);
    this.emitNode = p({
      rank: tt,
      tiles: Kt(d.tilesX, d.tilesY),
      capacity: f(s),
      sorted_gaussians: y(
        r,
        "uvec2",
        e
      ).toReadOnly(),
      projected_mean: y(
        l,
        "vec4",
        e
      ).toReadOnly(),
      projected_conic: y(
        u,
        "vec4",
        e
      ).toReadOnly(),
      projected_color: y(
        c,
        "vec4",
        e
      ).toReadOnly(),
      tile_counts: h,
      intersection_offsets: g,
      visible_state: m,
      records: y(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([x]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = i;
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
const Re = 10;
class ji {
  constructor(t, e, s) {
    this.camera = t, this.store = e, this.frameComponentOffset = s * 4, this.frameComponentCount = e.objectCapacity * Re * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new Dt(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Ft();
  inverseModel = new Ft();
  cameraWorldPosition = new N();
  cameraLocalPosition = new N();
  update() {
    this.camera.updateWorldMatrix(!0, !1), this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld), this.values.fill(0, this.frameComponentOffset);
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
    t.updateWorldMatrix(!0, !1), this.modelView.multiplyMatrices(
      this.camera.matrixWorldInverse,
      t.matrixWorld
    ), this.inverseModel.copy(t.matrixWorld).invert(), this.cameraLocalPosition.copy(this.cameraWorldPosition).applyMatrix4(this.inverseModel);
    const e = this.frameComponentOffset + t.objectId * Re * 4;
    this.values.set(t.matrixWorld.elements, e), this.values.set(this.modelView.elements, e + 16), this.values[e + 32] = this.cameraLocalPosition.x, this.values[e + 33] = this.cameraLocalPosition.y, this.values[e + 34] = this.cameraLocalPosition.z, this.values[e + 35] = 1, this.values[e + 36] = Wi(t, this.camera) ? 1 : 0;
  }
}
function Wi(n, t) {
  if (!n.layers.test(t.layers)) return !1;
  let e = n, s = n;
  for (; e !== null; ) {
    if (!e.visible) return !1;
    s = e, e = e.parent;
  }
  return s instanceof Ee;
}
function qi(n) {
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
function Hi(n) {
  const t = n === "rgb8e8" ? "u32" : "vec4<f32>", e = n === "rgb8e8" ? (
    /* wgsl */
    `
fn decode_sh_rgb8e8(packed: u32) -> vec3<f32> {
  let mantissa = unpack4x8snorm(packed).xyz;
  let exponent = i32((packed >> 24u) & 255u) - 127;
  return mantissa * exp2(f32(exponent));
}`
  ) : "", s = (r) => {
    const i = r === 0 ? "base" : `base + ${r}u`;
    return n === "rgb8e8" ? `decode_sh_rgb8e8((*sh_coefficients)[${i}])` : `(*sh_coefficients)[${i}].xyz`;
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
const Yi = (
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
function Xi() {
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
${rr({
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
const ir = /* @__PURE__ */ new Set([
  Ie,
  Oe,
  ae,
  oe,
  le,
  ue,
  Be,
  De
]), nr = /* @__PURE__ */ new Set([
  ...ir,
  Jt,
  Fe
]), Zi = /* @__PURE__ */ new Set([
  ...nr,
  Ue,
  Ge,
  Ve,
  $e
]);
class Ki {
  constructor(t, e, s, r, i, o = !0) {
    this.data = t, this.frame = e, this.antialiasMode = r, this.subpixelSampleCulling = o, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      t.count
    ), this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      t.count
    ), this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      t.count
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
      Hs(s, Zt, "projection");
    kt(
      t.gaussianPositionLocalNode,
      ir,
      "gaussianPositionLocalNode"
    );
    for (const [s, r] of [
      ["gaussianPositionWorldNode", t.gaussianPositionWorldNode],
      ["gaussianScaleNode", t.gaussianScaleNode],
      ["gaussianRotationNode", t.gaussianRotationNode]
    ])
      kt(r, nr, s);
    kt(
      t.gaussianOpacityNode,
      Zi,
      "gaussianOpacityNode"
    ), kt(
      t.gaussianColorNode,
      Zt,
      "gaussianColorNode"
    ), kt(
      t.gaussianVisibilityNode,
      Zt,
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
    const { data: e, frame: s } = this, r = y(e.means, "vec4", e.count).toReadOnly(), i = y(
      e.scalesOpacity,
      "vec4",
      e.count
    ).toReadOnly(), o = y(e.rotations, "vec4", e.count).toReadOnly(), a = e.shFormat === "rgb8e8" ? y(
      e.shCoefficients,
      "uint",
      e.count * e.shCoefficientCount
    ).toReadOnly() : y(
      e.shCoefficients,
      "vec4",
      e.count * e.shCoefficientCount
    ).toReadOnly(), l = y(
      this.projectedMean,
      "vec4",
      this.projectedMean.count
    ), u = y(this.projectedConic, "vec4", e.count), c = y(this.projectedColor, "vec4", e.count), d = y(this.tileCounts, "uint", e.count), h = L(
      qi(this.antialiasMode)
    ), g = L(Hi(e.shFormat)), m = L(Xi()), b = L(Yi);
    return re(() => {
      const v = f(tt);
      O(v.greaterThanEqual(f(e.count)), () => {
        pt();
      }), d.element(v).assign(f(0)), l.element(v).assign(J(0));
      const S = r.element(v), T = S.xyz, M = f(S.w), w = i.element(v), C = w.xyz, z = w.w, A = o.element(v), _ = f(e.count).add(
        M.mul(f(Re))
      ), I = cs(
        l.element(_),
        l.element(_.add(1)),
        l.element(_.add(2)),
        l.element(_.add(3))
      ), B = cs(
        l.element(_.add(4)),
        l.element(_.add(5)),
        l.element(_.add(6)),
        l.element(_.add(7))
      ), E = l.element(_.add(8)).xyz, F = l.element(_.add(9)).x.greaterThan(0);
      O(F.not(), () => {
        pt();
      });
      const D = /* @__PURE__ */ new Map([
        [Ie, () => v],
        [Oe, () => M],
        [ae, () => T],
        [oe, () => C],
        [le, () => A],
        [ue, () => z],
        [Be, () => I],
        [De, () => F]
      ]), q = Ct(
        t.gaussianPositionLocalNode,
        D
      ).toVar("gaussianPositionLocalValue"), at = I.mul(J(q, 1)).xyz, $ = new Map(D);
      $.set(Jt, () => at);
      const ot = Er(q.sub(E));
      $.set(Fe, () => ot);
      let bt;
      if (t.gaussianPositionWorldNode === Jt)
        bt = B.mul(J(q, 1));
      else {
        const Ot = Ct(
          t.gaussianPositionWorldNode,
          $
        ).toVar("gaussianPositionWorldValue");
        bt = s.view.mul(J(Ot, 1));
      }
      bt = bt.toVar("gaussianViewPosition");
      const vt = Ct(t.gaussianScaleNode, $).toVar(
        "gaussianScaleValue"
      ), ht = Ct(
        t.gaussianRotationNode,
        $
      ).toVar("gaussianRotationValue"), et = h({
        view: bt,
        scale_input: vt,
        rotation_input: ht,
        model_view: B,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      O(et.element(0).w.lessThanEqual(0), () => {
        pt();
      });
      const H = et.element(0).xy, wt = et.element(0).z, At = et.element(1).xyz, Gt = et.element(1).w, _t = et.element(2).xyz, gt = et.element(2).w, lt = new Map($);
      lt.set(Ue, () => wt), lt.set(Ge, () => H), lt.set(Ve, () => Mt(_t.xz)), lt.set(
        $e,
        () => Mt(Gt).mul(Math.PI)
      );
      const Nt = Ct(
        t.gaussianOpacityNode,
        lt
      ).clamp(0, 1), Rt = this.antialiasMode === "compensated" ? Nt.mul(
        Mt(yt(gt.div(Gt), 0, 1))
      ) : Nt;
      O(Rt.lessThan(G(1 / 255)), () => {
        pt();
      });
      const St = Lr(Rt.mul(255)), U = Mt(
        St.mul(2).mul(yt(_t.x, 1e-12, 1e4))
      ), Et = Mt(
        St.mul(2).mul(yt(_t.z, 1e-12, 1e4))
      ), Vt = hs(U), Lt = hs(Et);
      O(Vt.lessThanEqual(0).or(Lt.lessThanEqual(0)), () => {
        pt();
      });
      const Qt = mt(Vt, Lt), zt = H.sub(Qt), W = H.add(Qt);
      if (O(
        W.x.lessThan(0).or(W.y.lessThan(0)).or(zt.x.greaterThanEqual(s.viewport.x)).or(zt.y.greaterThanEqual(s.viewport.y)),
        () => {
          pt();
        }
      ), this.subpixelSampleCulling) {
        const Ot = b({
          center: H,
          conic: At,
          power_threshold: St,
          extent: mt(U, Et),
          viewport: Kt(s.viewport.xy)
        });
        O(Ot.not(), () => {
          l.element(v).assign(J(H, wt, -1)), pt();
        });
      }
      const Y = Xt(ds(s.tilesX), ds(s.tilesY)).sub(1), st = Xt(
        yt(Ce(zt.div(G(P))), mt(0), mt(Y))
      ), X = Xt(
        yt(Ce(W.div(G(P))), mt(0), mt(Y))
      ), Q = g({
        gid: v,
        sh_degree: f(e.shDegree),
        direction: ot,
        sh_coefficients: a
      }), Tt = new Map(lt);
      Tt.set(Pe, () => Q), Tt.set(Gs, () => zt), Tt.set(Vs, () => W);
      const te = Ct(
        t.gaussianVisibilityNode,
        Tt
      );
      O(te.not(), () => {
        pt();
      });
      const dt = m({
        center: H,
        conic: At,
        power_threshold: St,
        tile_min: st,
        tile_max: X
      });
      O(dt.equal(0), () => {
        pt();
      });
      const It = Ct(
        t.gaussianColorNode,
        Tt
      ).clamp(0, 1);
      l.element(v).assign(J(H, wt, Rt)), u.element(v).assign(J(At, Vt)), c.element(v).assign(J(It, Lt)), d.element(v).assign(dt);
    })().compute(e.count, [x]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Ct(n, t) {
  return n.context({ overrideNodes: t });
}
const Ji = (
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
), Qi = x, ar = 256, tn = [2048, 4096, 8192];
function en(n) {
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
  let s = 0, r = 0, i = 0, o = 0, a = 0, l = 0, u = 0, c = 0;
  for (let d = 0; d < t; d++) {
    const h = Math.max(0, n[d + 1] - n[d]);
    e[d] = h, s += h, r = Math.max(r, h), h > 256 && i++, h > 512 && o++, h > 1024 && a++, h > 2048 && l++;
    const g = Math.ceil(h / ar);
    u += g, c = Math.max(c, g);
  }
  return e.sort(), {
    max: r,
    mean: s / t,
    median: sn(e),
    p95: ks(e, 0.95),
    p99: ks(e, 0.99),
    tilesOver256: i,
    tilesOver512: o,
    tilesOver1024: a,
    tilesOver2048: l,
    totalBatches: u,
    maxBatches: c
  };
}
function Ms(n, t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const e = Math.max(0, n.length - 1);
  let s = 0, r = 0, i = 0, o = 0, a = 0;
  for (let u = 0; u < e; u++) {
    const c = Math.max(0, n[u + 1] - n[u]), d = Math.min(c, t), h = c - d;
    s += d, r += h, h > 0 && i++;
    const g = Math.ceil(d / ar);
    o += g, a = Math.max(a, g);
  }
  const l = s + r;
  return {
    cap: t,
    rasterizedIntersections: s,
    droppedIntersections: r,
    droppedFraction: l === 0 ? 0 : r / l,
    affectedTiles: i,
    totalBatches: o,
    maxBatches: a
  };
}
function sn(n) {
  const t = Math.floor(n.length / 2);
  return n.length % 2 !== 0 ? n[t] : (n[t - 1] + n[t]) * 0.5;
}
function ks(n, t) {
  const e = Math.max(0, Math.ceil(n.length * t) - 1);
  return n[e];
}
class rn {
  constructor(t, e, s, r, i, o) {
    this.renderer = t, this.maxRasterizedSplatsPerTile = o, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      e
    );
    const a = L(Ji);
    this.computeNode = a({
      index: tt,
      gaussian_count: f(e),
      viewport: Kt(i.viewport.xy),
      projected_mean: y(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: y(
        r,
        "vec4",
        r.count
      ).toReadOnly(),
      zero_pixel_flags: y(this.zeroPixelFlags, "uint", e)
    }).compute(e, [Qi]).setName("3DGS profile subpixel coverage WGSL");
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
    ]), r = new Uint32Array(s);
    let i = 0;
    for (const a of r) i += a;
    const o = new Uint32Array(e);
    return {
      tileLoads: en(o),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : Ms(o, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: tn.map(
        (a) => Ms(o, a)
      ),
      zeroPixelSubpixelSplats: i
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function nn(n) {
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
  partials: ptr<workgroup, array<u32, ${k * nt}>>
) -> u32 {
  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  let subgroup_count = (${x}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${k}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${it}u; item++) {
      let position = block_start + item * ${x}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${n}u) & ${k - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${nt}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${k}u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[lane * ${nt}u + subgroup];
    }
    (*block_histograms)[lane * block_stride + block_index] = total;
  }
  return 0u;
}
`
  );
}
const an = (
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
  partials: ptr<workgroup, array<u32, ${nt}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let subgroup_count = (${x}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${K}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${it}u; item++) {
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
), on = (
  /* wgsl */
  `
fn scan_radix_reduced(
  chunk_stride: u32,
  state: ptr<storage, array<vec4<u32>>, read>,
  reduced: ptr<storage, array<u32>, read_write>
) -> u32 {
  let chunk_count = ((*state)[0].z + ${K - 1}u) /
    ${K}u;
  var running = 0u;
  for (var digit = 0u; digit < ${k}u; digit++) {
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
), ln = (
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
  scratch: ptr<workgroup, array<u32, ${K}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${K}u;
  for (var item = 0u; item < ${it}u; item++) {
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
  var active_count = ${K / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${it}u; item++) {
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
  if (lane == 0u) { (*scratch)[${K - 1}u] = 0u; }
  workgroupBarrier();

  active_count = 1u;
  offset = ${K / 2}u;
  for (var step = 0u; step < 10u; step++) {
    for (var item = 0u; item < ${it}u; item++) {
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
  for (var item = 0u; item < ${it}u; item++) {
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
function un(n) {
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
  block_bases: ptr<workgroup, array<u32, ${k}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${k}>>,
  partials: ptr<workgroup, array<u32, ${k * nt}>>
) -> u32 {
  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  let subgroup_count = (${x}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${k}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${it}u; item++) {
    let position = block_start + item * ${x}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${n}u) & ${k - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${k}u; target_digit++) {
      let matches = select(0u, 1u, valid && digit == target_digit);
      let prefix = subgroupExclusiveAdd(matches);
      let total = subgroupAdd(matches);
      if (subgroup_lane == 0u) {
        (*partials)[target_digit * ${nt}u + subgroup_index] = total;
      }
      if (digit == target_digit) { subgroup_prefix = prefix; }
    }
    workgroupBarrier();

    if (valid) {
      var preceding_subgroups = 0u;
      for (var subgroup = 0u; subgroup < subgroup_index; subgroup++) {
        preceding_subgroups += (*partials)[digit * ${nt}u + subgroup];
      }
      let destination = (*block_bases)[digit]
        + (*local_digit_counts)[digit]
        + preceding_subgroups
        + subgroup_prefix;
      (*records_out)[destination] = record;
    }
    workgroupBarrier();

    if (lane < ${k}u) {
      var batch_total = 0u;
      for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
        batch_total += (*partials)[lane * ${nt}u + subgroup];
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
function cn(n) {
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
  histogram: ptr<workgroup, array<atomic<u32>, ${k}>>
) -> u32 {
  if (lane < ${k}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${it}u; item++) {
    let position = block_start + item * ${x}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${n}u) & ${k - 1}u;
      atomicAdd(&(*histogram)[digit], 1u);
    }
  }
  workgroupBarrier();

  if (lane < ${k}u) {
    (*block_histograms)[lane * block_stride + block_index] =
      atomicLoad(&(*histogram)[lane]);
  }
  return 0u;
}
`
  );
}
const hn = (
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
  let chunk_start = chunk * ${K}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${it}u; item++) {
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
function dn(n) {
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
  block_bases: ptr<workgroup, array<u32, ${k}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${k}>>,
  shared_digits: ptr<workgroup, array<u32, ${x}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${k * (x / 32)}>>
) -> u32 {
  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  let words_per_digit = ${x / 32}u;
  if (lane < ${k}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${it}u; item++) {
    let position = block_start + item * ${x}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${k}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${n}u) & ${k - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${k * (x / 32)}u) {
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

    if (lane < ${k}u) {
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
class As {
  constructor(t, e, s, r, i, o) {
    this.renderer = t, this.label = e, this.capacity = s, this.buffers = r, this.dispatch = i, this.backend = o, this.maxRadixBlocks = Math.ceil(s / ut), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / K), this.blockHistograms = this.attributes.createUint(
      `3dgs.${e}-radix-histograms`,
      this.maxRadixBlocks * k
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${e}-radix-prefixes`,
      this.maxRadixBlocks * k
    ), this.reduced = this.attributes.createUint(
      `3dgs.${e}-radix-reduced`,
      this.maxReduceChunks * k
    );
    const a = y(i.state, "uvec4", 1).toReadOnly(), l = y(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), u = L(
      o === "subgroup" ? an : hn
    ), c = {
      lane: xt,
      group_id: Z,
      block_stride: f(this.maxRadixBlocks),
      chunk_stride: f(this.maxReduceChunks),
      state: a,
      block_histograms: l,
      reduced: y(this.reduced, "uint", this.reduced.count)
    };
    o === "subgroup" ? (c.subgroup_index = ge, c.subgroup_lane = fe, c.subgroup_size = me, c.partials = j("uint", nt)) : c.scratch = j("uint", x), this.reduceNode = u(c).computeKernel([x]).setName(`3DGS ${e} radix reduce WGSL`);
    const d = L(on);
    this.scanReducedNode = d({
      chunk_stride: f(this.maxReduceChunks),
      state: a,
      reduced: y(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${e} radix global scan WGSL`);
    const h = L(
      ln
    );
    this.scanAddNode = h({
      lane: xt,
      group_id: Z,
      block_stride: f(this.maxRadixBlocks),
      chunk_stride: f(this.maxReduceChunks),
      state: a,
      block_histograms: l,
      reduced: y(this.reduced, "uint", this.reduced.count).toReadOnly(),
      block_prefixes: y(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ),
      scratch: j("uint", K)
    }).computeKernel([x]).setName(`3DGS ${e} radix scan-add WGSL`), this.sortedRecords = r.recordsA;
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
    const e = Math.ceil(Math.max(0, t) / ke);
    this.passes = Array.from(
      { length: e },
      (s, r) => this.createPass(r, r * ke)
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
    const s = t % 2 === 0, r = s ? this.buffers.recordsA : this.buffers.recordsB, i = s ? this.buffers.recordsB : this.buffers.recordsA, o = y(this.dispatch.state, "uvec4", 1).toReadOnly(), a = y(
      r,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = L(
      this.backend === "subgroup" ? nn(e) : cn(e)
    ), u = {
      lane: xt,
      block_index: Z.x,
      block_stride: f(this.maxRadixBlocks),
      state: o,
      records: a,
      block_histograms: y(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (u.subgroup_index = ge, u.subgroup_lane = fe, u.subgroup_size = me, u.partials = j(
      "uint",
      k * nt
    )) : u.histogram = j("atomic<u32>", k);
    const c = l(u).computeKernel([x]).setName(`3DGS ${this.label} radix histogram WGSL ${t}`), d = L(
      this.backend === "subgroup" ? un(e) : dn(e)
    ), h = {
      lane: xt,
      block_index: Z.x,
      block_stride: f(this.maxRadixBlocks),
      state: o,
      records_in: a,
      records_out: y(i, "uvec2", this.capacity),
      block_prefixes: y(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: j("uint", k),
      local_digit_counts: j("uint", k)
    };
    this.backend === "subgroup" ? (h.subgroup_index = ge, h.subgroup_lane = fe, h.subgroup_size = me, h.partials = j(
      "uint",
      k * nt
    )) : (h.shared_digits = j("uint", x), h.shared_digit_masks = j(
      "uint",
      k * (x / 32)
    ));
    const g = d(h).computeKernel([x]).setName(`3DGS ${this.label} radix scatter WGSL ${t}`);
    return { histogram: c, scatter: g };
  }
  disposePasses() {
    for (const t of this.passes)
      t.histogram.dispose(), t.scatter.dispose();
    this.passes = [];
  }
}
const pn = (
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
function gn(n) {
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
const fn = (
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
  let second_local = lane + ${x}u;
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
), mn = (
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
class yn {
  attributes = new ct();
  levels = [];
  constructor(t, e) {
    const s = L(fn), r = L(mn);
    let i = t, o = e;
    for (; ; ) {
      const a = this.levels.length, l = Math.ceil(o / V), u = this.attributes.createUint(
        `3dgs.tile-offset-mins-${a}`,
        l
      ), c = s({
        lane: xt,
        group_id: Z.x,
        length: f(o),
        values: y(i, "uint", o),
        block_mins: y(u, "uint", l),
        scratch: j("uint", V)
      }).computeKernel([x]).setName(`3DGS tile offset suffix scan WGSL ${a}`);
      if (this.levels.push({
        length: o,
        blockCount: l,
        values: i,
        scanNode: c
      }), l <= 1) break;
      i = u, o = l;
    }
    for (let a = 0; a < this.levels.length - 1; a++) {
      const l = this.levels[a], u = this.levels[a + 1];
      l.addNode = r({
        index: tt,
        length: f(l.length),
        block_count: f(u.length),
        values: y(l.values, "uint", l.length),
        block_suffix_mins: y(
          u.values,
          "uint",
          u.length
        ).toReadOnly()
      }).compute(l.length, [x]).setName(`3DGS tile add suffix block mins WGSL ${a}`);
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
class xn {
  constructor(t, e, s, r, i) {
    this.renderer = t, this.dispatch = i, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const o = y(this.offsets, "uint", s + 1), a = L(pn);
    this.clearNode = a({
      index: tt,
      tile_count: f(s),
      state: y(i.state, "uvec4", 1).toReadOnly(),
      offsets: o
    }).compute(s + 1, [x]).setName("3DGS clear tile offsets WGSL");
    const l = L(
      gn(e)
    );
    this.boundariesNode = l({
      index: tt,
      tile_count: f(s),
      state: y(i.state, "uvec4", 1).toReadOnly(),
      records: y(
        r,
        "uvec2",
        r.count
      ).toReadOnly(),
      offsets: o
    }).computeKernel([x]).setName(`3DGS find tile boundaries WGSL (${e})`), this.suffixMin = new yn(this.offsets, s + 1);
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
), bn = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${x}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class vn {
  constructor(t, e, s, r, i, o, a, l, u, c, d, h, g, m, b, p, v, S = !1, T = 1e-4, M = 0.95) {
    this.renderer = t, this.gaussianCount = e, this.intersectionCapacity = s, this.mode = r, this.meansAttribute = i, this.projectedMeanAttribute = o, this.projectedConicAttribute = a, this.projectedColorAttribute = l, this.sortedRecordsAttribute = u, this.tileOffsetsAttribute = c, this.colorTexture = d, this.depthTexture = h, this.frame = g, this.maxSplatsPerTile = m, this.rasterChunkSize = b, this.tileCount = p, this.transmittanceThreshold = T, this.depthAlphaThreshold = M, this.metrics = S ? this.attributes.createUint("3dgs.raster-work", p * 4) : null;
    const w = this.metrics === null ? null : y(this.metrics, "uint", p * 4).toAtomic();
    this.clearMetrics = w === null ? null : re(() => {
      zr(w.element(tt), f(0));
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
  depthAlphaThreshold;
  attributes = new ct();
  chunks;
  computeNode = null;
  chunkComputeNode = null;
  compositeNode = null;
  metrics;
  clearMetrics;
  rebuild(t) {
    for (const i of [
      t.rasterPixelValueNode,
      t.rasterBreakNode,
      t.rasterColorNode,
      t.rasterAlphaNode,
      t.rasterDiscardNode
    ])
      Hs(i, es, "raster");
    kt(
      t.rasterPixelValueNode,
      qs,
      "rasterPixelValueNode"
    ), kt(
      t.rasterBreakNode,
      ti,
      "rasterBreakNode"
    );
    const e = this.createRasterNode(t, "direct"), s = this.chunks === null ? null : this.createRasterNode(t, "chunk"), r = this.chunks === null ? null : this.createCompositeNode();
    this.computeNode?.dispose(), this.chunkComputeNode?.dispose(), this.compositeNode?.dispose(), this.computeNode = e, this.chunkComputeNode = s, this.compositeNode = r;
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
    const t = er(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), e = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Ae(
      e,
      this.tileCount,
      "raster-chunks"
    ), r = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      t,
      2
    ), i = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), o = t * x, a = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
      "3dgs.raster-chunk-partials",
      o * a
    ), u = y(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), c = y(e, "uint", this.tileCount), d = y(
      e,
      "uint",
      this.tileCount
    ).toReadOnly(), h = y(
      s.output,
      "uint",
      this.tileCount
    ).toReadOnly(), m = L(Ai)({
      tile: tt,
      tile_count: f(this.tileCount),
      chunk_size: f(this.rasterChunkSize),
      sample_limit: f(this.maxSplatsPerTile ?? 0),
      tile_offsets: u,
      chunk_counts: c
    }).compute(this.tileCount, [x]).setName("3DGS count exact raster chunks WGSL"), p = L(
      Ri
    )({
      tile_count: f(this.tileCount),
      task_capacity: f(t),
      chunk_counts: d,
      chunk_offsets: h,
      dispatch: y(i, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), S = L(Ei)({
      tile: tt,
      tile_count: f(this.tileCount),
      task_capacity: f(t),
      chunk_counts: d,
      chunk_offsets: h,
      tasks: y(r, "uvec2", t)
    }).compute(this.tileCount, [x]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: e,
      offsets: s,
      tasks: r,
      dispatch: i,
      partialData: l,
      partialStride: a,
      countNode: m,
      prepareNode: p,
      emitNode: S
    };
  }
  createRasterNode(t, e) {
    const s = this.metrics === null ? null : y(this.metrics, "uint", this.tileCount * 4).toAtomic(), r = y(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), i = y(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), o = y(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), a = y(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), l = y(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), u = y(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), c = j("vec4", x), d = j("vec4", x), h = j("vec4", x), g = j("uint", x), m = j("uint", x), b = j("uint", 8), p = e === "direct" ? Me(this.colorTexture) : null, v = L(Rs), S = L(bn), T = this.chunks, M = e === "chunk" && T !== null ? y(T.tasks, "uvec2", T.tasks.count).toReadOnly() : null, w = e === "chunk" && T !== null ? y(T.partialData, "vec4", T.partialData.count) : null, { frame: C } = this;
    return re(() => {
      const A = f(xt), _ = v({ value: A }), I = v({ value: A.shiftRight(1) }), B = f(Z.x), E = (e === "direct" ? Z.y.mul(C.tilesX).add(Z.x) : M.element(B).x).toVar("rasterTile"), F = e === "chunk" ? M.element(B).y : f(0), D = e === "direct" ? Z.x : E.mod(C.tilesX), q = e === "direct" ? Z.y : E.div(C.tilesX), at = Kt(
        D.mul(f(P)).add(_),
        q.mul(f(P)).add(I)
      ).toVar("rasterPixelCoordinateValue"), $ = at.x.lessThan(f(C.viewport.x)).and(at.y.lessThan(f(C.viewport.y))).toVar("rasterActivePixel"), ot = u.element(E), bt = u.element(E.add(1)), vt = f(bt.sub(ot)), ht = vt.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const U = f(this.maxSplatsPerTile);
        ht.assign(ft(vt.lessThan(U), vt, U));
      }
      let et = f(0);
      const H = ht.toVar("rasterSampleEnd");
      if (e === "direct" && this.rasterChunkSize !== null)
        H.assign(
          ft(
            ht.greaterThan(f(this.rasterChunkSize)),
            f(0),
            ht
          )
        );
      else if (e === "chunk") {
        et = F.mul(f(this.rasterChunkSize)).toVar("rasterSampleStart");
        const U = et.add(f(this.rasterChunkSize));
        H.assign(
          ft(U.lessThan(ht), U, ht)
        );
      }
      const wt = mt(at).add(0.5), At = /* @__PURE__ */ new Map([
        [We, () => at],
        [qe, () => wt],
        [He, () => wt.div(C.viewport.xy)]
      ]), Gt = G(0).toVar("rasterPixelValue");
      O($, () => {
        Gt.assign(
          qt(t.rasterPixelValueNode, At)
        );
      });
      const _t = ie(0).toVar("accumulated"), gt = G(1).toVar("transmittance"), lt = G(0).toVar("weightedViewDepth"), Nt = Bt(!1).toVar("done"), Rt = s === null ? null : f(0).toVar("rasterChecked"), St = s === null ? null : f(0).toVar("rasterBlended");
      jt(
        {
          start: et,
          end: H,
          type: "uint",
          condition: "<",
          update: `+= ${x}`
        },
        ({ i: U }) => {
          const Et = U.add(A);
          O(Et.lessThan(H), () => {
            let W = Et;
            this.maxSplatsPerTile !== null && (W = f(
              Ce(
                G(Et).add(0.5).mul(G(vt)).div(G(ht))
              )
            ));
            const Y = ot.add(W).toVar("rasterSourceRecordIndex"), st = l.element(Y).y, X = i.element(st), Q = o.element(st);
            c.element(A).assign(X), d.element(A).assign(J(Q.xyz, X.w.mul(255).log())), h.element(A).assign(a.element(st)), g.element(A).assign(st);
          }), O(A.equal(0), () => {
            m.element(f(0)).assign(
              ft(
                U.add(f(x)).lessThan(H),
                f(1),
                f(0)
              )
            );
          });
          const Vt = S({ values: m }).toVar("hasNextBatch"), Lt = f(H.sub(U)), Qt = ft(
            Lt.lessThan(f(x)),
            Lt,
            f(x)
          );
          O($.and(Nt.not()), () => {
            jt(
              {
                start: f(0),
                end: Qt,
                type: "uint",
                condition: "<"
              },
              ({ i: W }) => {
                Rt?.addAssign(1);
                const Y = c.element(W), st = g.element(W), X = wt.sub(Y.xy), Q = new Map(At);
                Q.set(Ye, () => Gt), Q.set(ce, () => st), Q.set(
                  je,
                  () => f(r.element(st).w)
                ), Q.set(Xe, () => Y.xy), Q.set(Ze, () => X), Q.set(Ke, () => Y.z);
                const Tt = qt(
                  t.rasterBreakNode,
                  Q
                );
                O(Tt, () => {
                  Nt.assign(Bt(!0)), Wt();
                });
                const te = d.element(W), dt = te.xyz, It = dt.x.mul(X.x.mul(X.x)).add(dt.y.mul(2).mul(X.x).mul(X.y)).add(dt.z.mul(X.y.mul(X.y))).mul(-0.5);
                O(
                  It.greaterThan(0).or(It.lessThan(te.w.negate())),
                  () => {
                    ye();
                  }
                );
                const Ot = Mt(ps(dt.x, 1e-12)), he = dt.y.div(Ot), lr = Mt(ps(dt.z.sub(he.mul(he)), 1e-12)), is = mt(
                  Ot.mul(X.x).add(he.mul(X.y)),
                  lr.mul(X.y)
                ), de = new Map([
                  ...Q,
                  [$s, () => is],
                  [js, () => is.div(6).add(0.5)],
                  [
                    Je,
                    () => h.element(W).xyz
                  ],
                  [Qe, () => Y.w],
                  [ts, () => It],
                  [Ws, () => Os(It)]
                ]), ur = qt(t.rasterDiscardNode, de);
                O(ur, () => {
                  ye();
                });
                const pe = yt(
                  qt(t.rasterAlphaNode, de),
                  0,
                  0.99
                );
                O(pe.lessThan(G(1 / 255)), () => {
                  ye();
                });
                const cr = qt(t.rasterColorNode, de), ns = gt.mul(pe).toVar("rasterContribution");
                _t.addAssign(cr.mul(ns)), lt.addAssign(Y.z.mul(ns)), St?.addAssign(1), gt.mulAssign(G(1).sub(pe)), O(gt.lessThan(this.transmittanceThreshold), () => {
                  Nt.assign(Bt(!0)), Wt();
                });
              }
            );
          }), O(Vt.equal(0), () => {
            Wt();
          }), m.element(A).assign(ft($.and(Nt.not()), f(1), f(0))), gs(), O(A.lessThan(8), () => {
            const W = A.mul(32), Y = f(0).toVar("subgroupActive");
            jt(
              { start: f(0), end: f(32), type: "uint", condition: "<" },
              ({ i: st }) => {
                Y.bitOrAssign(
                  m.element(W.add(st))
                );
              }
            ), b.element(A).assign(Y);
          }), gs(), O(A.equal(0), () => {
            const W = f(0).toVar("tileActiveReduction");
            jt(
              { start: f(0), end: f(8), type: "uint", condition: "<" },
              ({ i: Y }) => {
                W.bitOrAssign(b.element(f(Y)));
              }
            ), m.element(f(0)).assign(W);
          });
          const zt = S({ values: m });
          O(zt.equal(0), () => {
            Wt();
          });
        }
      ), O($, () => {
        if (s !== null) {
          const U = E.mul(4);
          Pt(s.element(U), Rt), Pt(s.element(U.add(1)), St), e === "direct" && O(vt.greaterThan(0).and(H.greaterThan(0)), () => {
            Pt(s.element(U.add(2)), f(1)), Pt(
              s.element(U.add(3)),
              ft(
                gt.lessThan(this.transmittanceThreshold),
                f(1),
                f(0)
              )
            );
          });
        }
        if (e === "direct")
          Es(
            _t,
            gt,
            lt,
            at,
            p,
            this.depthTexture,
            C,
            this.depthAlphaThreshold
          );
        else {
          const U = B.mul(f(x)).add(A).mul(f(T.partialStride));
          w.element(U).assign(J(_t, gt)), this.depthTexture !== null && w.element(U.add(1)).assign(J(lt, 0, 0, 0));
        }
      });
    })().computeKernel([P, P]).setName(
      e === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const t = this.metrics === null ? null : y(this.metrics, "uint", this.tileCount * 4).toAtomic(), e = this.chunks, s = y(
      e.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), r = y(
      e.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), i = y(
      e.partialData,
      "vec4",
      e.partialData.count
    ).toReadOnly(), o = Me(this.colorTexture), a = L(Rs), { frame: l } = this;
    return re(() => {
      const c = f(xt), d = a({ value: c }), h = a({ value: c.shiftRight(1) }), g = Z.y.mul(l.tilesX).add(Z.x), m = s.element(g), b = Kt(
        Z.x.mul(f(P)).add(d),
        Z.y.mul(f(P)).add(h)
      ), p = b.x.lessThan(f(l.viewport.x)).and(b.y.lessThan(f(l.viewport.y)));
      O(p.and(m.greaterThan(0)), () => {
        const v = ie(0).toVar("chunkCompositeColor"), S = G(1).toVar("chunkCompositeTransmittance"), T = G(0).toVar(
          "chunkCompositeWeightedViewDepth"
        ), M = r.element(g);
        jt(
          {
            start: f(0),
            end: m,
            type: "uint",
            condition: "<"
          },
          ({ i: w }) => {
            const C = M.add(w).mul(f(x)).add(c).mul(f(e.partialStride)), z = i.element(C);
            v.addAssign(z.xyz.mul(S)), this.depthTexture !== null && T.addAssign(
              i.element(C.add(1)).x.mul(S)
            ), S.mulAssign(z.w), O(S.lessThan(this.transmittanceThreshold), () => {
              Wt();
            });
          }
        ), Es(
          v,
          S,
          T,
          b,
          o,
          this.depthTexture,
          l,
          this.depthAlphaThreshold
        ), t !== null && (Pt(t.element(g.mul(4).add(2)), f(1)), Pt(
          t.element(g.mul(4).add(3)),
          ft(
            S.lessThan(this.transmittanceThreshold),
            f(1),
            f(0)
          )
        ));
      });
    })().computeKernel([P, P]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const t = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let e = 0, s = 0, r = 0, i = 0;
    for (let o = 0; o < t.length; o += 4)
      e += t[o], s += t[o + 1], r += t[o + 2], i += t[o + 3];
    return { checked: e, blended: s, pixels: r, alphaStopped: i };
  }
}
function wn(n, t) {
  const e = n.negate();
  return yt(
    t.viewport.z.add(e).mul(t.viewport.w).div(t.viewport.w.sub(t.viewport.z).mul(e)),
    0,
    1
  );
}
function Es(n, t, e, s, r, i, o, a) {
  const l = yt(G(o.background[3]), 0, 1);
  n.addAssign(
    ie(o.background[0], o.background[1], o.background[2]).mul(t).mul(l)
  );
  const u = G(1).sub(t.mul(G(1).sub(l)));
  if (fs(r, Xt(s), J(n, u)), i !== null) {
    const c = G(1).sub(t), d = c.greaterThan(a).select(
      wn(e.div(c), o),
      G(1)
    );
    fs(
      Me(i),
      Xt(s),
      J(d, 0, 0, 1)
    );
  }
}
function qt(n, t) {
  return n.context({ overrideNodes: t });
}
class _n {
  constructor(t, e, s, r, i, o) {
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
    const a = y(
      r,
      "uint",
      s
    ).toReadOnly(), l = L(
      zi
    );
    this.prepareNode = l({
      gaussian_count: f(s),
      projected_mean: y(
        i,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: a,
      state: y(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: y(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: y(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: y(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const u = L(
      Ii(e)
    );
    this.compactNode = u({
      gid: tt,
      gaussian_count: f(s),
      viewport: o,
      visible_offsets: a,
      projected_mean: y(
        i,
        "vec4",
        s
      ).toReadOnly(),
      records: y(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [x]).setName(`3DGS compact visible Gaussians WGSL (${e})`);
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
class Nn {
  constructor(t, e, s, r, i, o, a, l, u, c, d, h, g, m, b = 1e-4, p = !1, v = 0.95) {
    this.renderer = t, this.data = s, this.mode = i, this.capacity = a, this.profileKernels = u, this.maxRasterizedSplatsPerTile = c, this.rasterChunkSize = d, this.subpixelSampleCulling = h, this.radixBackend = g, this.nodes = m, this.rasterTransmittanceThreshold = b, this.rasterStats = p, this.depthAlphaThreshold = v, this.frame = new Ui(e, l), this.objects = new ji(e, r, s.count), this.projection = new Ki(
      s,
      this.frame,
      this.objects,
      o,
      m,
      h
    ), this.profileDiagnostics = u || p ? new rn(
      t,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      c
    ) : null, this.visibleScan = new Ae(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new _n(
      t,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new As(
      t,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      g
    ), this.depthSorter.configure(i === "float32" ? 32 : 16), this.orderedTiles = new Pi(
      t,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Ae(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new $i(
      t,
      s.count,
      a,
      this.depthSorter.sortedRecords,
      this.visible.dispatch,
      this.orderedTiles.tileCounts,
      this.scan.output,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.projection.projectedColor,
      this.frame
    ), this.sorter = new As(
      t,
      "tile",
      a,
      this.intersections.buffers,
      this.intersections.dispatch,
      g
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
  prepareFrame(t, e, s, r) {
    if (this.frame.update(t, e, this.tilesX, this.tilesY), this.objects.update(), (t !== this.width || e !== this.height) && this.rebuildTileStages(t, e, s, r), this.tileOffsets === null || this.rasterizer === null)
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
  rebuildTileStages(t, e, s, r) {
    const i = Math.ceil(t / P), o = Math.ceil(e / P), a = i * o;
    if (i > 65535 || o > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, a + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new xn(
      this.renderer,
      this.mode,
      a,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new vn(
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
      a,
      this.nodes,
      this.rasterStats,
      this.rasterTransmittanceThreshold,
      this.depthAlphaThreshold
    ), this.width = t, this.height = e, this.tilesX = i, this.tilesY = o, this.frame.update(t, e, i, o), this.tileStageRebuilds++;
  }
}
function Sn(n, t) {
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
const Se = new Ar();
class Tn extends as {
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
  nodeSlots = Qr();
  dirtyStages = 0;
  frameDirty = !0;
  successfulRenderCount = 0;
  cachedFrameCount = 0;
  autoSnapshot = null;
  pipelineDevice = null;
  disposed = !1;
  constructor(t, e, s, r = {}) {
    super(as.COLOR, new Ee(), e, {
      type: os,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const i = r.depthSortMode ?? "float32", o = r.antialiasMode ?? "compensated", a = r.redrawStrategy ?? "always", l = r.radixBackend ?? "auto";
    if (o !== "compensated" && o !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    if (a !== "always" && a !== "auto" && a !== "never")
      throw new RangeError(
        'redrawStrategy must be "always", "auto", or "never"'
      );
    const u = Sn(
      l,
      t.hasFeature("subgroups")
    ), c = r.intersectionCapacity ?? null;
    if (c !== null && (!Number.isInteger(c) || c <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (c !== null && c > x * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const d = r.maxRasterizedSplatsPerTile ?? null;
    if (d !== null && (!Number.isInteger(d) || d <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const h = r.rasterChunkSize === void 0 ? ki : r.rasterChunkSize;
    if (Li(
      h,
      c ?? x * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = t, this.gaussianStore = s, this.redrawStrategy = a, this.depthSortMode = i, this.antialiasMode = o, this.requestedIntersectionCapacity = c, this.background = r.background ?? [0, 0, 0, 0], this.outputDepth = r.outputDepth ?? !1, this.depthAlphaThreshold = r.depthAlphaThreshold ?? 0.95, !Number.isFinite(this.depthAlphaThreshold) || this.depthAlphaThreshold < 0 || this.depthAlphaThreshold > 1)
      throw new RangeError("depthAlphaThreshold must be finite and in [0, 1]");
    if (this.colorSpace = r.colorSpace ?? Sr, this.profileKernels = r.profileKernels ?? !1, this.rasterStats = r.rasterStats ?? !1, this.rasterTransmittanceThreshold = r.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = d, this.rasterChunkSize = h, this.subpixelSampleCulling = r.subpixelSampleCulling ?? !0, this.radixBackend = u, this.renderTarget.texture.dispose(), this.colorTexture = new ls(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = os, this.colorTexture.colorSpace = Tr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new ls(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = Cr, this.depthTexture.type = Mr, this.depthTexture.minFilter = us, this.depthTexture.magFilter = us, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    const s = this.renderTarget.width, r = this.renderTarget.height;
    super.setSize(t, e), this.depthTexture?.setSize(
      this.renderTarget.width,
      this.renderTarget.height,
      1
    ), (s !== this.renderTarget.width || r !== this.renderTarget.height) && (this.frameDirty = !0);
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
    return this.workingColorNode ??= Ir(
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
    if (!(this.camera instanceof kr))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    e.getDrawingBufferSize(Se);
    const s = Math.max(1, Math.floor(Se.x)), r = Math.max(1, Math.floor(Se.y)), i = this.getResolutionScale(), o = Math.max(1, Math.floor(s * i)), a = Math.max(
      1,
      Math.floor(r * i)
    );
    (this.renderTarget.width !== o || this.renderTarget.height !== a) && this.setSize(s, r);
    const l = or(e);
    if (this.pipelineDevice !== null && this.pipelineDevice !== l && (this.pipeline?.dispose(), this.pipeline = null, this.pipelineLayoutVersion = -1, this.frameDirty = !0, this.autoSnapshot = null), this.redrawStrategy === "never" && !this.frameDirty && this.pipeline !== null) {
      this.cachedFrameCount++;
      return;
    }
    this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: Cn(e) });
    const u = this.gaussianStore.updateLod(this.camera);
    this.redrawStrategy === "auto" && this.autoInputsChanged(o, a) && (this.frameDirty = !0);
    const c = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      x * 65535,
      Math.max(1, c.count * 16)
    )), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), c.count > x * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new Nn(
        e,
        this.camera,
        c,
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
      ), this.pipelineDevice = l, this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0, this.frameDirty = !0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.redrawStrategy !== "always" && !this.frameDirty) {
      this.cachedFrameCount++;
      return;
    }
    if (e.initRenderTarget(this.renderTarget), this.pipeline.prepareFrame(
      o,
      a,
      this.colorTexture,
      this.depthTexture
    ), this.pipeline.render(), this.frameDirty = !1, this.successfulRenderCount++, this.redrawStrategy === "auto" && (this.autoSnapshot = this.captureAutoSnapshot(o, a)), this.debugListeners.size > 0) {
      const d = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: u
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
    this.disposed || (this.disposed = !0, this.pipeline?.dispose(), this.pipeline = null, this.pipelineDevice = null, this.frameDirty = !0, this.autoSnapshot = null, this.debugListeners.clear(), this.depthTexture?.dispose(), super.dispose());
  }
  setProjectionNode(t, e) {
    zs(e, t), this.nodeSlots[t] !== e && (this.nodeSlots[t] = e, this.invalidateProjection());
  }
  setRasterNode(t, e) {
    zs(e, t), this.nodeSlots[t] !== e && (this.nodeSlots[t] = e, this.invalidateRasterizer());
  }
  invalidateAutomatically() {
    this.redrawStrategy === "auto" && (this.frameDirty = !0);
  }
  autoInputsChanged(t, e) {
    const s = this.autoSnapshot;
    if (s === null) return !0;
    const r = this.camera;
    if (r.updateWorldMatrix(!0, !1), s.width !== t || s.height !== e || s.cameraNear !== r.near || s.cameraFar !== r.far || s.cameraLayers !== r.layers.mask || s.storeContentVersion !== this.gaussianStore.contentVersion || !Te(
      s.projectionMatrix,
      r.projectionMatrix.elements
    ) || !Te(
      s.cameraMatrixWorldInverse,
      r.matrixWorldInverse.elements
    ) || s.clouds.length !== this.gaussianStore.clouds.length)
      return !0;
    for (let i = 0; i < s.clouds.length; i++) {
      const o = s.clouds[i], a = this.gaussianStore.clouds[i];
      if (a.updateWorldMatrix(!0, !1), o.cloud !== a || o.visible !== Ls(a, r) || !Te(o.matrixWorld, a.matrixWorld.elements))
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
      clouds: this.gaussianStore.clouds.map((r) => (r.updateWorldMatrix(!0, !1), {
        cloud: r,
        visible: Ls(r, s),
        matrixWorld: [...r.matrixWorld.elements]
      }))
    };
  }
}
function Te(n, t) {
  for (let e = 0; e < 16; e++)
    if (n[e] !== t[e]) return !1;
  return !0;
}
function Ls(n, t) {
  if (!n.layers.test(t.layers)) return !1;
  let e = n, s = n;
  for (; e !== null; ) {
    if (!e.visible) return !1;
    s = e, e = e.parent;
  }
  return s instanceof Ee;
}
function zs(n, t) {
  if (n?.isNode !== !0)
    throw new TypeError(`GaussianPass.${t} must be a Three.js Node`);
}
function Cn(n) {
  return or(n).limits;
}
function or(n) {
  const t = n.backend;
  if (t.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return t.device;
}
function Un(n, t, e, s) {
  return new Tn(n, t, e, s);
}
export {
  Dr as CanonicalGaussianPlyLoader,
  Bn as DistanceAwareRadialLodPackingStrategy,
  Or as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  bs as GaussianCloud,
  Ps as GaussianData,
  Rn as GaussianDataBackend,
  ze as GaussianLod,
  In as GaussianLodColorHelper,
  vs as GaussianLodNode,
  Le as GaussianOctree,
  jr as GaussianOctreeNode,
  Tn as GaussianPass,
  En as GaussianRaycastIndex,
  Fn as GaussianStore,
  xi as GaussianStoreAttributes,
  yi as GaussianStorePackedAttribute,
  zn as LodHelper,
  On as MaximumLodPackingStrategy,
  Ln as OctreeHelper,
  Bs as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  Pn as RadialLodPackingStrategy,
  ci as RadialLodWorkerPlanner,
  mi as RemainingCapacityBudgetStrategy,
  Dn as SourceFractionBudgetStrategy,
  Xs as StreamingLodPackingStrategy,
  ri as TieredRadialLodPackingStrategy,
  Pe as gaussianColor,
  Ie as gaussianIndex,
  Oe as gaussianObjectId,
  Be as gaussianObjectMatrix,
  De as gaussianObjectVisible,
  ue as gaussianOpacity,
  Un as gaussianPass,
  ae as gaussianPositionLocal,
  Jt as gaussianPositionWorld,
  $e as gaussianProjectedArea,
  Ve as gaussianProjectedSigma,
  le as gaussianRotation,
  oe as gaussianScale,
  Vs as gaussianScreenBoundsMax,
  Gs as gaussianScreenBoundsMin,
  Ge as gaussianScreenPosition,
  Ue as gaussianViewDepth,
  Fe as gaussianViewDirection,
  _s as isStreamingLodPackingStrategy,
  Pr as packShRgb8e8,
  Xe as rasterGaussianCenter,
  Je as rasterGaussianColor,
  $s as rasterGaussianCoord,
  ce as rasterGaussianIndex,
  Qe as rasterGaussianOpacity,
  je as rasterObjectId,
  We as rasterPixelCoordinate,
  Ze as rasterPixelDelta,
  Ye as rasterPixelValue,
  ts as rasterPower,
  qe as rasterScreenPosition,
  He as rasterScreenUV,
  js as rasterUV,
  Ke as rasterViewDepth,
  Ws as rasterWeight,
  Ds as shBytesPerCoefficient,
  An as unpackShRgb8e8
};
//# sourceMappingURL=index.js.map
