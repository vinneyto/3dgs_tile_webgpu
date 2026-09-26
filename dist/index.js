import { StorageBufferAttribute as gt, Box3 as Er, Vector3 as Y, Object3D as Ks, Matrix4 as Dt, Ray as kr, LineSegments as zr, BufferGeometry as Lr, Float32BufferAttribute as Ir, LineBasicMaterial as Ar, BoxGeometry as Rr, MeshBasicMaterial as Pr, DoubleSide as Or, InstancedMesh as Br, Color as Fr, IndirectStorageBufferAttribute as Ur, Vector4 as Dr, Scene as je, PassNode as bs, HalfFloatType as ws, SRGBColorSpace as Vr, StorageTexture as vs, NoColorSpace as Gr, RedFormat as $r, FloatType as jr, NearestFilter as Ss, PerspectiveCamera as Wr, Vector2 as qr } from "three/webgpu";
import { Vector3 as P, Quaternion as Hr, Box3 as We, Matrix4 as Yr } from "three";
import { property as A, bool as Ut, exp as Qs, float as V, storage as w, uint as x, vec3 as ce, mix as Xr, wgslFn as B, instanceIndex as rt, workgroupArray as j, workgroupId as K, invocationLocalIndex as wt, uniform as qt, uvec2 as te, Fn as he, If as F, Return as mt, vec4 as et, mat4 as Ns, normalize as Zr, sqrt as kt, clamp as bt, log as Jr, ceil as Ts, vec2 as xt, ivec2 as Kt, int as _s, floor as Ue, subgroupIndex as _e, invocationSubgroupIndex as Me, subgroupSize as Ce, atomicStore as Kr, storageTexture as De, select as yt, Loop as Ht, Break as Yt, Continue as Ee, max as Ms, workgroupBarrier as Cs, atomicAdd as Ft, textureStore as Es, colorSpaceToWorking as Qr } from "three/tsl";
class pe {
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
const ti = 16, tr = 4;
function er(a, t, e) {
  const s = Math.max(Math.abs(a), Math.abs(t), Math.abs(e));
  if (!Number.isFinite(s))
    throw new RangeError("SH coefficients must be finite");
  if (s === 0) return 0;
  const r = Math.min(127, Math.max(-126, Math.ceil(Math.log2(s)))), i = 127 / 2 ** r, n = ke(a, i), o = ke(t, i), l = ke(e, i), h = r + 127;
  return (n | o << 8 | l << 16 | h << 24) >>> 0;
}
function la(a) {
  const t = 2 ** ((a >>> 24) - 127) / 127;
  return [
    ze(a) * t,
    ze(a >>> 8) * t,
    ze(a >>> 16) * t
  ];
}
function sr(a) {
  return a === "rgb8e8" ? tr : ti;
}
function ke(a, t) {
  return Math.min(127, Math.max(-127, Math.round(a * t))) & 255;
}
function ze(a) {
  const t = a & 255;
  return t < 128 ? t : t - 256;
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
}, ei = [
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
let zs = class {
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
    const e = si(t), s = new Map(
      e.properties.map((c, y) => [c.name, y])
    );
    for (const c of ei)
      if (!s.has(c))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${c}`);
    const r = e.properties.map((c) => c.name.match(/^f_rest_(\d+)$/)?.[1]).filter((c) => c !== void 0).map(Number).sort((c, y) => c - y);
    for (let c = 0; c < r.length; c++)
      if (r[c] !== c)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const i = r.length / 3, n = i + 1, o = Math.sqrt(n);
    if (!Number.isInteger(o) || o < 1 || o > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = ri(t, e), h = (c) => s.get(c), u = r.map(
      (c) => h(`f_rest_${c}`)
    ), p = e.vertexCount, d = new Float32Array(p * 4), m = new Float32Array(p * 4), g = new Float32Array(p * 4), f = new Float32Array(p * n * 4);
    for (let c = 0; c < p; c++) {
      const y = c * 4;
      d[y] = l(c, h("x")), d[y + 1] = l(c, h("y")), d[y + 2] = l(c, h("z")), m[y] = Math.max(
        Math.exp(l(c, h("scale_0"))),
        1e-6
      ), m[y + 1] = Math.max(
        Math.exp(l(c, h("scale_1"))),
        1e-6
      ), m[y + 2] = Math.max(
        Math.exp(l(c, h("scale_2"))),
        1e-6
      );
      const _ = l(c, h("opacity"));
      m[y + 3] = 1 / (1 + Math.exp(-_));
      const M = l(c, h("rot_0")), v = l(c, h("rot_1")), b = l(c, h("rot_2")), T = l(c, h("rot_3")), k = Math.hypot(v, b, T, M);
      k > 1e-12 ? (g[y] = v / k, g[y + 1] = b / k, g[y + 2] = T / k, g[y + 3] = M / k) : g[y + 3] = 1;
      const C = c * n * 4;
      f[C] = l(c, h("f_dc_0")), f[C + 1] = l(c, h("f_dc_1")), f[C + 2] = l(c, h("f_dc_2"));
      for (let N = 1; N < n; N++) {
        const z = C + N * 4, R = N - 1;
        for (let E = 0; E < 3; E++) {
          const I = u[E * i + R];
          f[z + E] = l(
            c,
            I
          );
        }
      }
    }
    return new pe(
      {
        means: ne("ply.means", d),
        scalesOpacity: ne("ply.scales-opacity", m),
        rotations: ne("ply.rotations-xyzw", g),
        shCoefficients: ne("ply.sh-coefficients", f)
      },
      {
        count: p,
        shDegree: o - 1,
        ownsBuffers: !0
      }
    );
  }
};
function ne(a, t) {
  const e = new gt(t, 4);
  return e.name = a, e;
}
function si(a) {
  const t = new Uint8Array(a), e = new TextEncoder().encode("end_header");
  let s = -1;
  for (let g = 0; g <= t.length - e.length; g++) {
    let f = !0;
    for (let c = 0; c < e.length; c++)
      if (t[g + c] !== e[c]) {
        f = !1;
        break;
      }
    if (f) {
      s = g;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let r = s + e.length;
  if (t[r] === 13 && r++, t[r] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  r++;
  const n = new TextDecoder().decode(t.subarray(0, r)).split(/\r?\n/);
  if (n[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let o = null, l = "", h = -1, u = 0;
  const p = [], d = [];
  for (const g of n) {
    const f = g.trim().split(/\s+/);
    if (f[0] === "format") {
      if (f[1] !== "ascii" && f[1] !== "binary_little_endian" && f[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${f[1] ?? "unknown"}`);
      o = f[1];
    } else if (f[0] === "element") {
      l = f[1] ?? "";
      const c = Number(f[2]);
      if (!Number.isInteger(c) || c < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: c }), l === "vertex" && (h = c);
    } else if (f[0] === "property" && l === "vertex") {
      if (f[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const c = f[1], y = f[2];
      if (!(c in ks) || y === void 0)
        throw new Error(`Unsupported vertex property: ${g}`);
      p.push({ name: y, type: c, byteOffset: u }), u += ks[c];
    }
  }
  if (o === null) throw new Error("Invalid PLY: format is missing");
  if (h <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (g) => g.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: o, vertexCount: h, properties: p, vertexStride: u, dataOffset: r };
}
function ri(a, t) {
  if (t.format === "ascii") {
    const i = new TextDecoder().decode(
      new Uint8Array(a, t.dataOffset)
    ), n = new Float64Array(
      t.vertexCount * t.properties.length
    );
    let o = 0;
    for (let l = 0; l < n.length; l++) {
      for (; o < i.length && /\s/.test(i[o]); ) o++;
      const h = o;
      for (; o < i.length && !/\s/.test(i[o]); ) o++;
      const u = Number(i.slice(h, o));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${l}`);
      n[l] = u;
    }
    return (l, h) => n[l * t.properties.length + h];
  }
  if (t.dataOffset + t.vertexCount * t.vertexStride > a.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(a), r = t.format === "binary_little_endian";
  return (i, n) => {
    const o = t.properties[n], l = t.dataOffset + i * t.vertexStride + o.byteOffset;
    return ii(s, l, o.type, r);
  };
}
function ii(a, t, e, s) {
  switch (e) {
    case "char":
    case "int8":
      return a.getInt8(t);
    case "uchar":
    case "uint8":
      return a.getUint8(t);
    case "short":
    case "int16":
      return a.getInt16(t, s);
    case "ushort":
    case "uint16":
      return a.getUint16(t, s);
    case "int":
    case "int32":
      return a.getInt32(t, s);
    case "uint":
    case "uint32":
      return a.getUint32(t, s);
    case "float":
    case "float32":
      return a.getFloat32(t, s);
    case "double":
    case "float64":
      return a.getFloat64(t, s);
  }
}
const rr = '(function(){"use strict";const we="srgb",Bn="srgb-linear",Dn="linear",Mt="srgb",Ai={TEXTURE_COMPARE:"depthTextureCompare"};function Un(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}const Vn={};function bs(...i){const e="THREE."+i.shift();console.log(e,...i)}function kn(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]=\'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.\'}return i}function L(...i){i=kn(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function q(...i){i=kn(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function ke(...i){const e=i.join(" ");e in Vn||(Vn[e]=!0,L(...i))}class ht{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const s=this._listeners;s[e]===void 0&&(s[e]=[]),s[e].indexOf(t)===-1&&s[e].push(t)}hasEventListener(e,t){const s=this._listeners;return s===void 0?!1:s[e]!==void 0&&s[e].indexOf(t)!==-1}removeEventListener(e,t){const s=this._listeners;if(s===void 0)return;const n=s[e];if(n!==void 0){const r=n.indexOf(t);r!==-1&&n.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const s=t[e.type];if(s!==void 0){e.target=this;const n=s.slice(0);for(let r=0,o=n.length;r<o;r++)n[r].call(this,e);e.target=null}}}const re=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Gn=1234567;const $n=Math.PI/180,Wn=180/Math.PI;function je(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,s=Math.random()*4294967295|0;return(re[i&255]+re[i>>8&255]+re[i>>16&255]+re[i>>24&255]+"-"+re[e&255]+re[e>>8&255]+"-"+re[e>>16&15|64]+re[e>>24&255]+"-"+re[t&63|128]+re[t>>8&255]+"-"+re[t>>16&255]+re[t>>24&255]+re[s&255]+re[s>>8&255]+re[s>>16&255]+re[s>>24&255]).toLowerCase()}function O(i,e,t){return Math.max(e,Math.min(t,i))}function zs(i,e){return(i%e+e)%e}function Ci(i,e,t,s,n){return s+(i-e)*(n-s)/(t-e)}function vi(i,e,t){return i!==e?(t-i)/(e-i):0}function _t(i,e,t){return(1-t)*i+t*e}function bi(i,e,t,s){return _t(i,e,1-Math.exp(-t*s))}function zi(i,e=1){return e-Math.abs(zs(i,e*2)-e)}function Fi(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Ri(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Ii(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Li(i,e){return i+Math.random()*(e-i)}function Oi(i){return i*(.5-Math.random())}function Pi(i){i!==void 0&&(Gn=i);let e=Gn+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Bi(i){return i*$n}function Di(i){return i*Wn}function Ui(i){return(i&i-1)===0&&i!==0}function Vi(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function ki(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Gi(i,e,t,s,n){const r=Math.cos,o=Math.sin,a=r(t/2),h=o(t/2),c=r((e+s)/2),l=o((e+s)/2),u=r((e-s)/2),p=o((e-s)/2),d=r((s-e)/2),f=o((s-e)/2);switch(n){case"XYX":i.set(a*l,h*u,h*p,a*c);break;case"YZY":i.set(h*p,a*l,h*u,a*c);break;case"ZXZ":i.set(h*u,h*p,a*l,a*c);break;case"XZX":i.set(a*l,h*f,h*d,a*c);break;case"YXY":i.set(h*d,a*l,h*f,a*c);break;case"ZYZ":i.set(h*f,h*d,a*l,a*c);break;default:L("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function Se(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function U(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const $i={DEG2RAD:$n,RAD2DEG:Wn,generateUUID:je,clamp:O,euclideanModulo:zs,mapLinear:Ci,inverseLerp:vi,lerp:_t,damp:bi,pingpong:zi,smoothstep:Fi,smootherstep:Ri,randInt:Ii,randFloat:Li,randFloatSpread:Oi,seededRandom:Pi,degToRad:Bi,radToDeg:Di,isPowerOfTwo:Ui,ceilPowerOfTwo:Vi,floorPowerOfTwo:ki,setQuaternionFromProperEuler:Gi,normalize:U,denormalize:Se},Rn=class Rn{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,s=this.y,n=e.elements;return this.x=n[0]*t+n[3]*s+n[6],this.y=n[1]*t+n[4]*s+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=O(this.x,e.x,t.x),this.y=O(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=O(this.x,e,t),this.y=O(this.y,e,t),this}clampLength(e,t){const s=this.length();return this.divideScalar(s||1).multiplyScalar(O(s,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const s=this.dot(e)/t;return Math.acos(O(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,s=this.y-e.y;return t*t+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,s){return this.x=e.x+(t.x-e.x)*s,this.y=e.y+(t.y-e.y)*s,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const s=Math.cos(t),n=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*s-o*n+e.x,this.y=r*n+o*s+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Rn.prototype.isVector2=!0;let Me=Rn;class Et{constructor(e=0,t=0,s=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=s,this._w=n}static slerpFlat(e,t,s,n,r,o,a){let h=s[n+0],c=s[n+1],l=s[n+2],u=s[n+3],p=r[o+0],d=r[o+1],f=r[o+2],g=r[o+3];if(u!==g||h!==p||c!==d||l!==f){let N=h*p+c*d+l*f+u*g;N<0&&(p=-p,d=-d,f=-f,g=-g,N=-N);let T=1-a;if(N<.9995){const A=Math.acos(N),v=Math.sin(A);T=Math.sin(T*A)/v,a=Math.sin(a*A)/v,h=h*T+p*a,c=c*T+d*a,l=l*T+f*a,u=u*T+g*a}else{h=h*T+p*a,c=c*T+d*a,l=l*T+f*a,u=u*T+g*a;const A=1/Math.sqrt(h*h+c*c+l*l+u*u);h*=A,c*=A,l*=A,u*=A}}e[t]=h,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,s,n,r,o){const a=s[n],h=s[n+1],c=s[n+2],l=s[n+3],u=r[o],p=r[o+1],d=r[o+2],f=r[o+3];return e[t]=a*f+l*u+h*d-c*p,e[t+1]=h*f+l*p+c*u-a*d,e[t+2]=c*f+l*d+a*p-h*u,e[t+3]=l*f-a*u-h*p-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,s,n){return this._x=e,this._y=t,this._z=s,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const s=e._x,n=e._y,r=e._z,o=e._order,a=Math.cos,h=Math.sin,c=a(s/2),l=a(n/2),u=a(r/2),p=h(s/2),d=h(n/2),f=h(r/2);switch(o){case"XYZ":this._x=p*l*u+c*d*f,this._y=c*d*u-p*l*f,this._z=c*l*f+p*d*u,this._w=c*l*u-p*d*f;break;case"YXZ":this._x=p*l*u+c*d*f,this._y=c*d*u-p*l*f,this._z=c*l*f-p*d*u,this._w=c*l*u+p*d*f;break;case"ZXY":this._x=p*l*u-c*d*f,this._y=c*d*u+p*l*f,this._z=c*l*f+p*d*u,this._w=c*l*u-p*d*f;break;case"ZYX":this._x=p*l*u-c*d*f,this._y=c*d*u+p*l*f,this._z=c*l*f-p*d*u,this._w=c*l*u+p*d*f;break;case"YZX":this._x=p*l*u+c*d*f,this._y=c*d*u+p*l*f,this._z=c*l*f-p*d*u,this._w=c*l*u-p*d*f;break;case"XZY":this._x=p*l*u-c*d*f,this._y=c*d*u-p*l*f,this._z=c*l*f+p*d*u,this._w=c*l*u+p*d*f;break;default:L("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const s=t/2,n=Math.sin(s);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,s=t[0],n=t[4],r=t[8],o=t[1],a=t[5],h=t[9],c=t[2],l=t[6],u=t[10],p=s+a+u;if(p>0){const d=.5/Math.sqrt(p+1);this._w=.25/d,this._x=(l-h)*d,this._y=(r-c)*d,this._z=(o-n)*d}else if(s>a&&s>u){const d=2*Math.sqrt(1+s-a-u);this._w=(l-h)/d,this._x=.25*d,this._y=(n+o)/d,this._z=(r+c)/d}else if(a>u){const d=2*Math.sqrt(1+a-s-u);this._w=(r-c)/d,this._x=(n+o)/d,this._y=.25*d,this._z=(h+l)/d}else{const d=2*Math.sqrt(1+u-s-a);this._w=(o-n)/d,this._x=(r+c)/d,this._y=(h+l)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let s=e.dot(t)+1;return s<1e-8?(s=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=s):(this._x=0,this._y=-e.z,this._z=e.y,this._w=s)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=s),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(O(this.dot(e),-1,1)))}rotateTowards(e,t){const s=this.angleTo(e);if(s===0)return this;const n=Math.min(1,t/s);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const s=e._x,n=e._y,r=e._z,o=e._w,a=t._x,h=t._y,c=t._z,l=t._w;return this._x=s*l+o*a+n*c-r*h,this._y=n*l+o*h+r*a-s*c,this._z=r*l+o*c+s*h-n*a,this._w=o*l-s*a-n*h-r*c,this._onChangeCallback(),this}slerp(e,t){let s=e._x,n=e._y,r=e._z,o=e._w,a=this.dot(e);a<0&&(s=-s,n=-n,r=-r,o=-o,a=-a);let h=1-t;if(a<.9995){const c=Math.acos(a),l=Math.sin(c);h=Math.sin(h*c)/l,t=Math.sin(t*c)/l,this._x=this._x*h+s*t,this._y=this._y*h+n*t,this._z=this._z*h+r*t,this._w=this._w*h+o*t,this._onChangeCallback()}else this._x=this._x*h+s*t,this._y=this._y*h+n*t,this._z=this._z*h+r*t,this._w=this._w*h+o*t,this.normalize();return this}slerpQuaternions(e,t,s){return this.copy(e).slerp(t,s)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),s=Math.random(),n=Math.sqrt(1-s),r=Math.sqrt(s);return this.set(n*Math.sin(e),n*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const In=class In{constructor(e=0,t=0,s=0){this.x=e,this.y=t,this.z=s}set(e,t,s){return s===void 0&&(s=this.z),this.x=e,this.y=t,this.z=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Hn.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Hn.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,s=this.y,n=this.z,r=e.elements;return this.x=r[0]*t+r[3]*s+r[6]*n,this.y=r[1]*t+r[4]*s+r[7]*n,this.z=r[2]*t+r[5]*s+r[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,s=this.y,n=this.z,r=e.elements,o=1/(r[3]*t+r[7]*s+r[11]*n+r[15]);return this.x=(r[0]*t+r[4]*s+r[8]*n+r[12])*o,this.y=(r[1]*t+r[5]*s+r[9]*n+r[13])*o,this.z=(r[2]*t+r[6]*s+r[10]*n+r[14])*o,this}applyQuaternion(e){const t=this.x,s=this.y,n=this.z,r=e.x,o=e.y,a=e.z,h=e.w,c=2*(o*n-a*s),l=2*(a*t-r*n),u=2*(r*s-o*t);return this.x=t+h*c+o*u-a*l,this.y=s+h*l+a*c-r*u,this.z=n+h*u+r*l-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,s=this.y,n=this.z,r=e.elements;return this.x=r[0]*t+r[4]*s+r[8]*n,this.y=r[1]*t+r[5]*s+r[9]*n,this.z=r[2]*t+r[6]*s+r[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=O(this.x,e.x,t.x),this.y=O(this.y,e.y,t.y),this.z=O(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=O(this.x,e,t),this.y=O(this.y,e,t),this.z=O(this.z,e,t),this}clampLength(e,t){const s=this.length();return this.divideScalar(s||1).multiplyScalar(O(s,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,s){return this.x=e.x+(t.x-e.x)*s,this.y=e.y+(t.y-e.y)*s,this.z=e.z+(t.z-e.z)*s,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const s=e.x,n=e.y,r=e.z,o=t.x,a=t.y,h=t.z;return this.x=n*h-r*a,this.y=r*o-s*h,this.z=s*a-n*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const s=e.dot(this)/t;return this.copy(e).multiplyScalar(s)}projectOnPlane(e){return Fs.copy(this).projectOnVector(e),this.sub(Fs)}reflect(e){return this.sub(Fs.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const s=this.dot(e)/t;return Math.acos(O(s,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,s=this.y-e.y,n=this.z-e.z;return t*t+s*s+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,s){const n=Math.sin(t)*e;return this.x=n*Math.sin(s),this.y=Math.cos(t)*e,this.z=n*Math.cos(s),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,s){return this.x=e*Math.sin(t),this.y=s,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),s=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=s,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,s=Math.sqrt(1-t*t);return this.x=s*Math.cos(e),this.y=t,this.z=s*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};In.prototype.isVector3=!0;let S=In;const Fs=new S,Hn=new Et,Ln=class Ln{constructor(e,t,s,n,r,o,a,h,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,s,n,r,o,a,h,c)}set(e,t,s,n,r,o,a,h,c){const l=this.elements;return l[0]=e,l[1]=n,l[2]=a,l[3]=t,l[4]=r,l[5]=h,l[6]=s,l[7]=o,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,s=e.elements;return t[0]=s[0],t[1]=s[1],t[2]=s[2],t[3]=s[3],t[4]=s[4],t[5]=s[5],t[6]=s[6],t[7]=s[7],t[8]=s[8],this}extractBasis(e,t,s){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const s=e.elements,n=t.elements,r=this.elements,o=s[0],a=s[3],h=s[6],c=s[1],l=s[4],u=s[7],p=s[2],d=s[5],f=s[8],g=n[0],N=n[3],T=n[6],A=n[1],v=n[4],z=n[7],b=n[2],F=n[5],I=n[8];return r[0]=o*g+a*A+h*b,r[3]=o*N+a*v+h*F,r[6]=o*T+a*z+h*I,r[1]=c*g+l*A+u*b,r[4]=c*N+l*v+u*F,r[7]=c*T+l*z+u*I,r[2]=p*g+d*A+f*b,r[5]=p*N+d*v+f*F,r[8]=p*T+d*z+f*I,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],s=e[1],n=e[2],r=e[3],o=e[4],a=e[5],h=e[6],c=e[7],l=e[8];return t*o*l-t*a*c-s*r*l+s*a*h+n*r*c-n*o*h}invert(){const e=this.elements,t=e[0],s=e[1],n=e[2],r=e[3],o=e[4],a=e[5],h=e[6],c=e[7],l=e[8],u=l*o-a*c,p=a*h-l*r,d=c*r-o*h,f=t*u+s*p+n*d;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);const g=1/f;return e[0]=u*g,e[1]=(n*c-l*s)*g,e[2]=(a*s-n*o)*g,e[3]=p*g,e[4]=(l*t-n*h)*g,e[5]=(n*r-a*t)*g,e[6]=d*g,e[7]=(s*h-c*t)*g,e[8]=(o*t-s*r)*g,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,s,n,r,o,a){const h=Math.cos(r),c=Math.sin(r);return this.set(s*h,s*c,-s*(h*o+c*a)+o+e,-n*c,n*h,-n*(-c*o+h*a)+a+t,0,0,1),this}scale(e,t){return ke("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Rs.makeScale(e,t)),this}rotate(e){return ke("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Rs.makeRotation(-e)),this}translate(e,t){return ke("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Rs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),s=Math.sin(e);return this.set(t,-s,0,s,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,s=e.elements;for(let n=0;n<9;n++)if(t[n]!==s[n])return!1;return!0}fromArray(e,t=0){for(let s=0;s<9;s++)this.elements[s]=e[s+t];return this}toArray(e=[],t=0){const s=this.elements;return e[t]=s[0],e[t+1]=s[1],e[t+2]=s[2],e[t+3]=s[3],e[t+4]=s[4],e[t+5]=s[5],e[t+6]=s[6],e[t+7]=s[7],e[t+8]=s[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Ln.prototype.isMatrix3=!0;let Ce=Ln;const Rs=new Ce,qn=new Ce().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Yn=new Ce().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Wi(){const i={enabled:!0,workingColorSpace:Bn,spaces:{},convert:function(n,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Mt&&(n.r=Le(n.r),n.g=Le(n.g),n.b=Le(n.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(n.applyMatrix3(this.spaces[r].toXYZ),n.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Mt&&(n.r=ct(n.r),n.g=ct(n.g),n.b=ct(n.b))),n},workingToColorSpace:function(n,r){return this.convert(n,this.workingColorSpace,r)},colorSpaceToWorking:function(n,r){return this.convert(n,r,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===""?Dn:this.spaces[n].transfer},getToneMappingMode:function(n){return this.spaces[n].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(n,r=this.workingColorSpace){return n.fromArray(this.spaces[r].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,r,o){return n.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(n,r){return ke("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(n,r)},toWorkingColorSpace:function(n,r){return ke("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(n,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],s=[.3127,.329];return i.define({[Bn]:{primaries:e,whitePoint:s,transfer:Dn,toXYZ:qn,fromXYZ:Yn,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:we},outputColorSpaceConfig:{drawingBufferColorSpace:we}},[we]:{primaries:e,whitePoint:s,transfer:Mt,toXYZ:qn,fromXYZ:Yn,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:we}}}),i}const Q=Wi();function Le(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ct(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let lt;class Hi{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let s;if(e instanceof HTMLCanvasElement)s=e;else{lt===void 0&&(lt=Un("canvas")),lt.width=e.width,lt.height=e.height;const n=lt.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),s=lt}return s.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Un("canvas");t.width=e.width,t.height=e.height;const s=t.getContext("2d");s.drawImage(e,0,0,e.width,e.height);const n=s.getImageData(0,0,e.width,e.height),r=n.data;for(let o=0;o<r.length;o++)r[o]=Le(r[o]/255)*255;return s.putImageData(n,0,0),t}else if(e.data){const t=e.data.slice(0);for(let s=0;s<t.length;s++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[s]=Math.floor(Le(t[s]/255)*255):t[s]=Le(t[s]);return{data:t,width:e.width,height:e.height}}else return L("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let qi=0;class Is{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:qi++}),this.uuid=je(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const s={uuid:this.uuid,url:""},n=this.data;if(n!==null){let r;if(Array.isArray(n)){r=[];for(let o=0,a=n.length;o<a;o++)n[o].isDataTexture?r.push(Ls(n[o].image)):r.push(Ls(n[o]))}else r=Ls(n);s.url=r}return t||(e.images[this.uuid]=s),s}}function Ls(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Hi.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(L("Texture: Unable to serialize Texture."),{})}let Yi=0;const Os=new S;class ye extends ht{constructor(e=ye.DEFAULT_IMAGE,t=ye.DEFAULT_MAPPING,s=1001,n=1001,r=1006,o=1008,a=1023,h=1009,c=ye.DEFAULT_ANISOTROPY,l=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Yi++}),this.uuid=je(),this.name="",this.source=new Is(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=s,this.wrapT=n,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=h,this.offset=new Me(0,0),this.repeat=new Me(1,1),this.center=new Me(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ce,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=l,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Os).x}get height(){return this.source.getSize(Os).y}get depth(){return this.source.getSize(Os).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const s=e[t];if(s===void 0){L(`Texture.setValues(): parameter \'${t}\' has value of undefined.`);continue}const n=this[t];if(n===void 0){L(`Texture.setValues(): property \'${t}\' does not exist.`);continue}n&&s&&n.isVector2&&s.isVector2||n&&s&&n.isVector3&&s.isVector3||n&&s&&n.isMatrix3&&s.isMatrix3?n.copy(s):this[t]=s}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const s={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(s.userData=this.userData),t||(e.textures[this.uuid]=s),s}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1e3:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1e3:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}ye.DEFAULT_IMAGE=null,ye.DEFAULT_MAPPING=300,ye.DEFAULT_ANISOTROPY=1;const On=class On{constructor(e=0,t=0,s=0,n=1){this.x=e,this.y=t,this.z=s,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,s,n){return this.x=e,this.y=t,this.z=s,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,s=this.y,n=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*s+o[8]*n+o[12]*r,this.y=o[1]*t+o[5]*s+o[9]*n+o[13]*r,this.z=o[2]*t+o[6]*s+o[10]*n+o[14]*r,this.w=o[3]*t+o[7]*s+o[11]*n+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,s,n,r;const h=e.elements,c=h[0],l=h[4],u=h[8],p=h[1],d=h[5],f=h[9],g=h[2],N=h[6],T=h[10];if(Math.abs(l-p)<.01&&Math.abs(u-g)<.01&&Math.abs(f-N)<.01){if(Math.abs(l+p)<.1&&Math.abs(u+g)<.1&&Math.abs(f+N)<.1&&Math.abs(c+d+T-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const v=(c+1)/2,z=(d+1)/2,b=(T+1)/2,F=(l+p)/4,I=(u+g)/4,X=(f+N)/4;return v>z&&v>b?v<.01?(s=0,n=.707106781,r=.707106781):(s=Math.sqrt(v),n=F/s,r=I/s):z>b?z<.01?(s=.707106781,n=0,r=.707106781):(n=Math.sqrt(z),s=F/n,r=X/n):b<.01?(s=.707106781,n=.707106781,r=0):(r=Math.sqrt(b),s=I/r,n=X/r),this.set(s,n,r,t),this}let A=Math.sqrt((N-f)*(N-f)+(u-g)*(u-g)+(p-l)*(p-l));return Math.abs(A)<.001&&(A=1),this.x=(N-f)/A,this.y=(u-g)/A,this.z=(p-l)/A,this.w=Math.acos((c+d+T-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=O(this.x,e.x,t.x),this.y=O(this.y,e.y,t.y),this.z=O(this.z,e.z,t.z),this.w=O(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=O(this.x,e,t),this.y=O(this.y,e,t),this.z=O(this.z,e,t),this.w=O(this.w,e,t),this}clampLength(e,t){const s=this.length();return this.divideScalar(s||1).multiplyScalar(O(s,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,s){return this.x=e.x+(t.x-e.x)*s,this.y=e.y+(t.y-e.y)*s,this.z=e.z+(t.z-e.z)*s,this.w=e.w+(t.w-e.w)*s,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};On.prototype.isVector4=!0;let Ge=On;class Xn extends ht{constructor(e=1,t=1,s={}){super(),s=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},s),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=s.depth,this.scissor=new Ge(0,0,e,t),this.scissorTest=!1,this.viewport=new Ge(0,0,e,t),this.textures=[];const n={width:e,height:t,depth:s.depth},r=new ye(n),o=s.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(s),this.depthBuffer=s.depthBuffer,this.stencilBuffer=s.stencilBuffer,this.resolveDepthBuffer=s.resolveDepthBuffer,this.resolveStencilBuffer=s.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=s.depthTexture,this.samples=s.samples,this.multiview=s.multiview,this.useArrayDepthTexture=s.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let s=0;s<this.textures.length;s++)this.textures[s].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,s=1){if(this.width!==e||this.height!==t||this.depth!==s){this.width=e,this.height=t,this.depth=s;for(let n=0,r=this.textures.length;n<r;n++)this.textures[n].image.width=e,this.textures[n].image.height=t,this.textures[n].image.depth=s,this.textures[n].isData3DTexture!==!0&&(this.textures[n].isArrayTexture=this.textures[n].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,s=e.textures.length;t<s;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const n=Object.assign({},e.textures[t].image);this.textures[t].source=new Is(n)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ms=class Ms{constructor(e,t,s,n,r,o,a,h,c,l,u,p,d,f,g,N){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,s,n,r,o,a,h,c,l,u,p,d,f,g,N)}set(e,t,s,n,r,o,a,h,c,l,u,p,d,f,g,N){const T=this.elements;return T[0]=e,T[4]=t,T[8]=s,T[12]=n,T[1]=r,T[5]=o,T[9]=a,T[13]=h,T[2]=c,T[6]=l,T[10]=u,T[14]=p,T[3]=d,T[7]=f,T[11]=g,T[15]=N,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ms().fromArray(this.elements)}copy(e){const t=this.elements,s=e.elements;return t[0]=s[0],t[1]=s[1],t[2]=s[2],t[3]=s[3],t[4]=s[4],t[5]=s[5],t[6]=s[6],t[7]=s[7],t[8]=s[8],t[9]=s[9],t[10]=s[10],t[11]=s[11],t[12]=s[12],t[13]=s[13],t[14]=s[14],t[15]=s[15],this}copyPosition(e){const t=this.elements,s=e.elements;return t[12]=s[12],t[13]=s[13],t[14]=s[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,s){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),s.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(e,t,s){return this.set(e.x,t.x,s.x,0,e.y,t.y,s.y,0,e.z,t.z,s.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,s=e.elements,n=1/ut.setFromMatrixColumn(e,0).length(),r=1/ut.setFromMatrixColumn(e,1).length(),o=1/ut.setFromMatrixColumn(e,2).length();return t[0]=s[0]*n,t[1]=s[1]*n,t[2]=s[2]*n,t[3]=0,t[4]=s[4]*r,t[5]=s[5]*r,t[6]=s[6]*r,t[7]=0,t[8]=s[8]*o,t[9]=s[9]*o,t[10]=s[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,s=e.x,n=e.y,r=e.z,o=Math.cos(s),a=Math.sin(s),h=Math.cos(n),c=Math.sin(n),l=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){const p=o*l,d=o*u,f=a*l,g=a*u;t[0]=h*l,t[4]=-h*u,t[8]=c,t[1]=d+f*c,t[5]=p-g*c,t[9]=-a*h,t[2]=g-p*c,t[6]=f+d*c,t[10]=o*h}else if(e.order==="YXZ"){const p=h*l,d=h*u,f=c*l,g=c*u;t[0]=p+g*a,t[4]=f*a-d,t[8]=o*c,t[1]=o*u,t[5]=o*l,t[9]=-a,t[2]=d*a-f,t[6]=g+p*a,t[10]=o*h}else if(e.order==="ZXY"){const p=h*l,d=h*u,f=c*l,g=c*u;t[0]=p-g*a,t[4]=-o*u,t[8]=f+d*a,t[1]=d+f*a,t[5]=o*l,t[9]=g-p*a,t[2]=-o*c,t[6]=a,t[10]=o*h}else if(e.order==="ZYX"){const p=o*l,d=o*u,f=a*l,g=a*u;t[0]=h*l,t[4]=f*c-d,t[8]=p*c+g,t[1]=h*u,t[5]=g*c+p,t[9]=d*c-f,t[2]=-c,t[6]=a*h,t[10]=o*h}else if(e.order==="YZX"){const p=o*h,d=o*c,f=a*h,g=a*c;t[0]=h*l,t[4]=g-p*u,t[8]=f*u+d,t[1]=u,t[5]=o*l,t[9]=-a*l,t[2]=-c*l,t[6]=d*u+f,t[10]=p-g*u}else if(e.order==="XZY"){const p=o*h,d=o*c,f=a*h,g=a*c;t[0]=h*l,t[4]=-u,t[8]=c*l,t[1]=p*u+g,t[5]=o*l,t[9]=d*u-f,t[2]=f*u-d,t[6]=a*l,t[10]=g*u+p}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Xi,e,Zi)}lookAt(e,t,s){const n=this.elements;return fe.subVectors(e,t),fe.lengthSq()===0&&(fe.z=1),fe.normalize(),$e.crossVectors(s,fe),$e.lengthSq()===0&&(Math.abs(s.z)===1?fe.x+=1e-4:fe.z+=1e-4,fe.normalize(),$e.crossVectors(s,fe)),$e.normalize(),Xt.crossVectors(fe,$e),n[0]=$e.x,n[4]=Xt.x,n[8]=fe.x,n[1]=$e.y,n[5]=Xt.y,n[9]=fe.y,n[2]=$e.z,n[6]=Xt.z,n[10]=fe.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const s=e.elements,n=t.elements,r=this.elements,o=s[0],a=s[4],h=s[8],c=s[12],l=s[1],u=s[5],p=s[9],d=s[13],f=s[2],g=s[6],N=s[10],T=s[14],A=s[3],v=s[7],z=s[11],b=s[15],F=n[0],I=n[4],X=n[8],ee=n[12],le=n[1],pe=n[5],ne=n[9],ae=n[13],Ve=n[2],V=n[6],at=n[10],_s=n[14],Es=n[3],As=n[7],Cs=n[11],vs=n[15];return r[0]=o*F+a*le+h*Ve+c*Es,r[4]=o*I+a*pe+h*V+c*As,r[8]=o*X+a*ne+h*at+c*Cs,r[12]=o*ee+a*ae+h*_s+c*vs,r[1]=l*F+u*le+p*Ve+d*Es,r[5]=l*I+u*pe+p*V+d*As,r[9]=l*X+u*ne+p*at+d*Cs,r[13]=l*ee+u*ae+p*_s+d*vs,r[2]=f*F+g*le+N*Ve+T*Es,r[6]=f*I+g*pe+N*V+T*As,r[10]=f*X+g*ne+N*at+T*Cs,r[14]=f*ee+g*ae+N*_s+T*vs,r[3]=A*F+v*le+z*Ve+b*Es,r[7]=A*I+v*pe+z*V+b*As,r[11]=A*X+v*ne+z*at+b*Cs,r[15]=A*ee+v*ae+z*_s+b*vs,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],s=e[4],n=e[8],r=e[12],o=e[1],a=e[5],h=e[9],c=e[13],l=e[2],u=e[6],p=e[10],d=e[14],f=e[3],g=e[7],N=e[11],T=e[15],A=h*d-c*p,v=a*d-c*u,z=a*p-h*u,b=o*d-c*l,F=o*p-h*l,I=o*u-a*l;return t*(g*A-N*v+T*z)-s*(f*A-N*b+T*F)+n*(f*v-g*b+T*I)-r*(f*z-g*F+N*I)}determinantAffine(){const e=this.elements,t=e[0],s=e[4],n=e[8],r=e[1],o=e[5],a=e[9],h=e[2],c=e[6],l=e[10];return t*(o*l-a*c)-s*(r*l-a*h)+n*(r*c-o*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,s){const n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=s),this}invert(){const e=this.elements,t=e[0],s=e[1],n=e[2],r=e[3],o=e[4],a=e[5],h=e[6],c=e[7],l=e[8],u=e[9],p=e[10],d=e[11],f=e[12],g=e[13],N=e[14],T=e[15],A=t*a-s*o,v=t*h-n*o,z=t*c-r*o,b=s*h-n*a,F=s*c-r*a,I=n*c-r*h,X=l*g-u*f,ee=l*N-p*f,le=l*T-d*f,pe=u*N-p*g,ne=u*T-d*g,ae=p*T-d*N,Ve=A*ae-v*ne+z*pe+b*le-F*ee+I*X;if(Ve===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const V=1/Ve;return e[0]=(a*ae-h*ne+c*pe)*V,e[1]=(n*ne-s*ae-r*pe)*V,e[2]=(g*I-N*F+T*b)*V,e[3]=(p*F-u*I-d*b)*V,e[4]=(h*le-o*ae-c*ee)*V,e[5]=(t*ae-n*le+r*ee)*V,e[6]=(N*z-f*I-T*v)*V,e[7]=(l*I-p*z+d*v)*V,e[8]=(o*ne-a*le+c*X)*V,e[9]=(s*le-t*ne-r*X)*V,e[10]=(f*F-g*z+T*A)*V,e[11]=(u*z-l*F-d*A)*V,e[12]=(a*ee-o*pe-h*X)*V,e[13]=(t*pe-s*ee+n*X)*V,e[14]=(g*v-f*b-N*A)*V,e[15]=(l*b-u*v+p*A)*V,this}scale(e){const t=this.elements,s=e.x,n=e.y,r=e.z;return t[0]*=s,t[4]*=n,t[8]*=r,t[1]*=s,t[5]*=n,t[9]*=r,t[2]*=s,t[6]*=n,t[10]*=r,t[3]*=s,t[7]*=n,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],s=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,s,n))}makeTranslation(e,t,s){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,s,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),s=Math.sin(e);return this.set(1,0,0,0,0,t,-s,0,0,s,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),s=Math.sin(e);return this.set(t,0,s,0,0,1,0,0,-s,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),s=Math.sin(e);return this.set(t,-s,0,0,s,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const s=Math.cos(t),n=Math.sin(t),r=1-s,o=e.x,a=e.y,h=e.z,c=r*o,l=r*a;return this.set(c*o+s,c*a-n*h,c*h+n*a,0,c*a+n*h,l*a+s,l*h-n*o,0,c*h-n*a,l*h+n*o,r*h*h+s,0,0,0,0,1),this}makeScale(e,t,s){return this.set(e,0,0,0,0,t,0,0,0,0,s,0,0,0,0,1),this}makeShear(e,t,s,n,r,o){return this.set(1,s,r,0,e,1,o,0,t,n,1,0,0,0,0,1),this}compose(e,t,s){const n=this.elements,r=t._x,o=t._y,a=t._z,h=t._w,c=r+r,l=o+o,u=a+a,p=r*c,d=r*l,f=r*u,g=o*l,N=o*u,T=a*u,A=h*c,v=h*l,z=h*u,b=s.x,F=s.y,I=s.z;return n[0]=(1-(g+T))*b,n[1]=(d+z)*b,n[2]=(f-v)*b,n[3]=0,n[4]=(d-z)*F,n[5]=(1-(p+T))*F,n[6]=(N+A)*F,n[7]=0,n[8]=(f+v)*I,n[9]=(N-A)*I,n[10]=(1-(p+g))*I,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,s){const n=this.elements;e.x=n[12],e.y=n[13],e.z=n[14];const r=this.determinantAffine();if(r===0)return s.set(1,1,1),t.identity(),this;let o=ut.set(n[0],n[1],n[2]).length();const a=ut.set(n[4],n[5],n[6]).length(),h=ut.set(n[8],n[9],n[10]).length();r<0&&(o=-o),_e.copy(this);const c=1/o,l=1/a,u=1/h;return _e.elements[0]*=c,_e.elements[1]*=c,_e.elements[2]*=c,_e.elements[4]*=l,_e.elements[5]*=l,_e.elements[6]*=l,_e.elements[8]*=u,_e.elements[9]*=u,_e.elements[10]*=u,t.setFromRotationMatrix(_e),s.x=o,s.y=a,s.z=h,this}makePerspective(e,t,s,n,r,o,a=2e3,h=!1){const c=this.elements,l=2*r/(t-e),u=2*r/(s-n),p=(t+e)/(t-e),d=(s+n)/(s-n);let f,g;if(h)f=r/(o-r),g=o*r/(o-r);else if(a===2e3)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===2001)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=p,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=f,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,s,n,r,o,a=2e3,h=!1){const c=this.elements,l=2/(t-e),u=2/(s-n),p=-(t+e)/(t-e),d=-(s+n)/(s-n);let f,g;if(h)f=1/(o-r),g=o/(o-r);else if(a===2e3)f=-2/(o-r),g=-(o+r)/(o-r);else if(a===2001)f=-1/(o-r),g=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=0,c[12]=p,c[1]=0,c[5]=u,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=f,c[14]=g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,s=e.elements;for(let n=0;n<16;n++)if(t[n]!==s[n])return!1;return!0}fromArray(e,t=0){for(let s=0;s<16;s++)this.elements[s]=e[s+t];return this}toArray(e=[],t=0){const s=this.elements;return e[t]=s[0],e[t+1]=s[1],e[t+2]=s[2],e[t+3]=s[3],e[t+4]=s[4],e[t+5]=s[5],e[t+6]=s[6],e[t+7]=s[7],e[t+8]=s[8],e[t+9]=s[9],e[t+10]=s[10],e[t+11]=s[11],e[t+12]=s[12],e[t+13]=s[13],e[t+14]=s[14],e[t+15]=s[15],e}};Ms.prototype.isMatrix4=!0;let xe=Ms;const ut=new S,_e=new xe,Xi=new S(0,0,0),Zi=new S(1,1,1),$e=new S,Xt=new S,fe=new S,Zn=new xe,jn=new Et;class Zt{constructor(e=0,t=0,s=0,n=Zt.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=s,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,s,n=this._order){return this._x=e,this._y=t,this._z=s,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,s=!0){const n=e.elements,r=n[0],o=n[4],a=n[8],h=n[1],c=n[5],l=n[9],u=n[2],p=n[6],d=n[10];switch(t){case"XYZ":this._y=Math.asin(O(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-l,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-O(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(h,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(O(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(h,r));break;case"ZYX":this._y=Math.asin(-O(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(p,d),this._z=Math.atan2(h,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(O(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-O(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-l,d),this._y=0);break;default:L("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,s===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,s){return Zn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Zn,t,s)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return jn.setFromEuler(this),this.setFromQuaternion(jn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Zt.DEFAULT_ORDER="XYZ";class ji{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Ji=0;const Jn=new S,dt=new Et,Oe=new xe,jt=new S,At=new S,Qi=new S,Ki=new Et,Qn=new S(1,0,0),Kn=new S(0,1,0),er=new S(0,0,1),tr={type:"added"},eo={type:"removed"},pt={type:"childadded",child:null},Ps={type:"childremoved",child:null};class Je extends ht{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ji++}),this.uuid=je(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Je.DEFAULT_UP.clone();const e=new S,t=new Zt,s=new Et,n=new S(1,1,1);function r(){s.setFromEuler(t,!1)}function o(){t.setFromQuaternion(s,void 0,!1)}t._onChange(r),s._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:s},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new xe},normalMatrix:{value:new Ce}}),this.matrix=new xe,this.matrixWorld=new xe,this.matrixAutoUpdate=Je.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Je.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ji,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return dt.setFromAxisAngle(e,t),this.quaternion.multiply(dt),this}rotateOnWorldAxis(e,t){return dt.setFromAxisAngle(e,t),this.quaternion.premultiply(dt),this}rotateX(e){return this.rotateOnAxis(Qn,e)}rotateY(e){return this.rotateOnAxis(Kn,e)}rotateZ(e){return this.rotateOnAxis(er,e)}translateOnAxis(e,t){return Jn.copy(e).applyQuaternion(this.quaternion),this.position.add(Jn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Qn,e)}translateY(e){return this.translateOnAxis(Kn,e)}translateZ(e){return this.translateOnAxis(er,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Oe.copy(this.matrixWorld).invert())}lookAt(e,t,s){e.isVector3?jt.copy(e):jt.set(e,t,s);const n=this.parent;this.updateWorldMatrix(!0,!1),At.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Oe.lookAt(At,jt,this.up):Oe.lookAt(jt,At,this.up),this.quaternion.setFromRotationMatrix(Oe),n&&(Oe.extractRotation(n.matrixWorld),dt.setFromRotationMatrix(Oe),this.quaternion.premultiply(dt.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(q("Object3D.add: object can\'t be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(tr),pt.child=e,this.dispatchEvent(pt),pt.child=null):q("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let s=0;s<arguments.length;s++)this.remove(arguments[s]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(eo),Ps.child=e,this.dispatchEvent(Ps),Ps.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Oe.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Oe.multiply(e.parent.matrixWorld)),e.applyMatrix4(Oe),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(tr),pt.child=e,this.dispatchEvent(pt),pt.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let s=0,n=this.children.length;s<n;s++){const o=this.children[s].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,s=[]){this[e]===t&&s.push(this);const n=this.children;for(let r=0,o=n.length;r<o;r++)n[r].getObjectsByProperty(e,t,s);return s}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(At,e,Qi),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(At,Ki,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let s=0,n=t.length;s<n;s++)t[s].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let s=0,n=t.length;s<n;s++)t[s].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,s=e.y,n=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*s-r[8]*n,r[13]+=s-r[1]*t-r[5]*s-r[9]*n,r[14]+=n-r[2]*t-r[6]*s-r[10]*n}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let s=0,n=t.length;s<n;s++)t[s].updateMatrixWorld(e)}updateWorldMatrix(e,t,s=!1){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||s)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,s=!0),t===!0){const r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,s)}}toJSON(e){const t=e===void 0||typeof e=="string",s={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},s.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),this.static!==!1&&(n.static=this.static),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.pivot!==null&&(n.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(n.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(n.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),n.instanceInfo=this._instanceInfo.map(a=>({...a})),n.availableInstanceIds=this._availableInstanceIds.slice(),n.availableGeometryIds=this._availableGeometryIds.slice(),n.nextIndexStart=this._nextIndexStart,n.nextVertexStart=this._nextVertexStart,n.geometryCount=this._geometryCount,n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.matricesTexture=this._matricesTexture.toJSON(e),n.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(n.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(n.boundingBox=this.boundingBox.toJSON()));function r(a,h){return a[h.uuid]===void 0&&(a[h.uuid]=h.toJSON(e)),h.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const h=a.shapes;if(Array.isArray(h))for(let c=0,l=h.length;c<l;c++){const u=h[c];r(e.shapes,u)}else r(e.shapes,h)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let h=0,c=this.material.length;h<c;h++)a.push(r(e.materials,this.material[h]));n.material=a}else n.material=r(e.materials,this.material);if(this.children.length>0){n.children=[];for(let a=0;a<this.children.length;a++)n.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let a=0;a<this.animations.length;a++){const h=this.animations[a];n.animations.push(r(e.animations,h))}}if(t){const a=o(e.geometries),h=o(e.materials),c=o(e.textures),l=o(e.images),u=o(e.shapes),p=o(e.skeletons),d=o(e.animations),f=o(e.nodes);a.length>0&&(s.geometries=a),h.length>0&&(s.materials=h),c.length>0&&(s.textures=c),l.length>0&&(s.images=l),u.length>0&&(s.shapes=u),p.length>0&&(s.skeletons=p),d.length>0&&(s.animations=d),f.length>0&&(s.nodes=f)}return s.object=n,s;function o(a){const h=[];for(const c in a){const l=a[c];delete l.metadata,h.push(l)}return h}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let s=0;s<e.children.length;s++){const n=e.children[s];this.add(n.clone())}return this}}Je.DEFAULT_UP=new S(0,1,0),Je.DEFAULT_MATRIX_AUTO_UPDATE=!0,Je.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const sr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},We={h:0,s:0,l:0},Jt={h:0,s:0,l:0};function Bs(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Ds{constructor(e,t,s){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,s)}set(e,t,s){if(t===void 0&&s===void 0){const n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,s);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=we){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Q.colorSpaceToWorking(this,t),this}setRGB(e,t,s,n=Q.workingColorSpace){return this.r=e,this.g=t,this.b=s,Q.colorSpaceToWorking(this,n),this}setHSL(e,t,s,n=Q.workingColorSpace){if(e=zs(e,1),t=O(t,0,1),s=O(s,0,1),t===0)this.r=this.g=this.b=s;else{const r=s<=.5?s*(1+t):s+t-s*t,o=2*s-r;this.r=Bs(o,r,e+1/3),this.g=Bs(o,r,e),this.b=Bs(o,r,e-1/3)}return Q.colorSpaceToWorking(this,n),this}setStyle(e,t=we){function s(r){r!==void 0&&parseFloat(r)<1&&L("Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\\w+)\\(([^\\)]*)\\)/.exec(e)){let r;const o=n[1],a=n[2];switch(o){case"rgb":case"rgba":if(r=/^\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\\s*(\\d*\\.?\\d+)\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:L("Color: Unknown color model "+e)}}else if(n=/^\\#([A-Fa-f\\d]+)$/.exec(e)){const r=n[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);L("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=we){const s=sr[e.toLowerCase()];return s!==void 0?this.setHex(s,t):L("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Le(e.r),this.g=Le(e.g),this.b=Le(e.b),this}copyLinearToSRGB(e){return this.r=ct(e.r),this.g=ct(e.g),this.b=ct(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=we){return Q.workingToColorSpace(ie.copy(this),e),Math.round(O(ie.r*255,0,255))*65536+Math.round(O(ie.g*255,0,255))*256+Math.round(O(ie.b*255,0,255))}getHexString(e=we){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Q.workingColorSpace){Q.workingToColorSpace(ie.copy(this),t);const s=ie.r,n=ie.g,r=ie.b,o=Math.max(s,n,r),a=Math.min(s,n,r);let h,c;const l=(a+o)/2;if(a===o)h=0,c=0;else{const u=o-a;switch(c=l<=.5?u/(o+a):u/(2-o-a),o){case s:h=(n-r)/u+(n<r?6:0);break;case n:h=(r-s)/u+2;break;case r:h=(s-n)/u+4;break}h/=6}return e.h=h,e.s=c,e.l=l,e}getRGB(e,t=Q.workingColorSpace){return Q.workingToColorSpace(ie.copy(this),t),e.r=ie.r,e.g=ie.g,e.b=ie.b,e}getStyle(e=we){Q.workingToColorSpace(ie.copy(this),e);const t=ie.r,s=ie.g,n=ie.b;return e!==we?`color(${e} ${t.toFixed(3)} ${s.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(s*255)},${Math.round(n*255)})`}offsetHSL(e,t,s){return this.getHSL(We),this.setHSL(We.h+e,We.s+t,We.l+s)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,s){return this.r=e.r+(t.r-e.r)*s,this.g=e.g+(t.g-e.g)*s,this.b=e.b+(t.b-e.b)*s,this}lerpHSL(e,t){this.getHSL(We),e.getHSL(Jt);const s=_t(We.h,Jt.h,t),n=_t(We.s,Jt.s,t),r=_t(We.l,Jt.l,t);return this.setHSL(s,n,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,s=this.g,n=this.b,r=e.elements;return this.r=r[0]*t+r[3]*s+r[6]*n,this.g=r[1]*t+r[4]*s+r[7]*n,this.b=r[2]*t+r[5]*s+r[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ie=new Ds;Ds.NAMES=sr;class Ct{constructor(e=new S(1/0,1/0,1/0),t=new S(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,s=e.length;t<s;t+=3)this.expandByPoint(Ee.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,s=e.count;t<s;t++)this.expandByPoint(Ee.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,s=e.length;t<s;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const s=Ee.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(s),this.max.copy(e).add(s),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const s=e.geometry;if(s!==void 0){const r=s.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Ee):Ee.fromBufferAttribute(r,o),Ee.applyMatrix4(e.matrixWorld),this.expandByPoint(Ee);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Qt.copy(e.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),Qt.copy(s.boundingBox)),Qt.applyMatrix4(e.matrixWorld),this.union(Qt)}const n=e.children;for(let r=0,o=n.length;r<o;r++)this.expandByObject(n[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ee),Ee.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,s;return e.normal.x>0?(t=e.normal.x*this.min.x,s=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,s=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,s+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,s+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,s+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,s+=e.normal.z*this.min.z),t<=-e.constant&&s>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(vt),Kt.subVectors(this.max,vt),ft.subVectors(e.a,vt),mt.subVectors(e.b,vt),gt.subVectors(e.c,vt),He.subVectors(mt,ft),qe.subVectors(gt,mt),Qe.subVectors(ft,gt);let t=[0,-He.z,He.y,0,-qe.z,qe.y,0,-Qe.z,Qe.y,He.z,0,-He.x,qe.z,0,-qe.x,Qe.z,0,-Qe.x,-He.y,He.x,0,-qe.y,qe.x,0,-Qe.y,Qe.x,0];return!Us(t,ft,mt,gt,Kt)||(t=[1,0,0,0,1,0,0,0,1],!Us(t,ft,mt,gt,Kt))?!1:(es.crossVectors(He,qe),t=[es.x,es.y,es.z],Us(t,ft,mt,gt,Kt))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ee).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ee).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Pe[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Pe[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Pe[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Pe[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Pe[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Pe[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Pe[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Pe[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Pe),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Pe=[new S,new S,new S,new S,new S,new S,new S,new S],Ee=new S,Qt=new Ct,ft=new S,mt=new S,gt=new S,He=new S,qe=new S,Qe=new S,vt=new S,Kt=new S,es=new S,Ke=new S;function Us(i,e,t,s,n){for(let r=0,o=i.length-3;r<=o;r+=3){Ke.fromArray(i,r);const a=n.x*Math.abs(Ke.x)+n.y*Math.abs(Ke.y)+n.z*Math.abs(Ke.z),h=e.dot(Ke),c=t.dot(Ke),l=s.dot(Ke);if(Math.max(-Math.max(h,c,l),Math.min(h,c,l))>a)return!1}return!0}const j=new S,ts=new Me;let to=0;class nr extends ht{constructor(e,t,s=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:to++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=s,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,s){e*=this.itemSize,s*=t.itemSize;for(let n=0,r=this.itemSize;n<r;n++)this.array[e+n]=t.array[s+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,s=this.count;t<s;t++)ts.fromBufferAttribute(this,t),ts.applyMatrix3(e),this.setXY(t,ts.x,ts.y);else if(this.itemSize===3)for(let t=0,s=this.count;t<s;t++)j.fromBufferAttribute(this,t),j.applyMatrix3(e),this.setXYZ(t,j.x,j.y,j.z);return this}applyMatrix4(e){for(let t=0,s=this.count;t<s;t++)j.fromBufferAttribute(this,t),j.applyMatrix4(e),this.setXYZ(t,j.x,j.y,j.z);return this}applyNormalMatrix(e){for(let t=0,s=this.count;t<s;t++)j.fromBufferAttribute(this,t),j.applyNormalMatrix(e),this.setXYZ(t,j.x,j.y,j.z);return this}transformDirection(e){for(let t=0,s=this.count;t<s;t++)j.fromBufferAttribute(this,t),j.transformDirection(e),this.setXYZ(t,j.x,j.y,j.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let s=this.array[e*this.itemSize+t];return this.normalized&&(s=Se(s,this.array)),s}setComponent(e,t,s){return this.normalized&&(s=U(s,this.array)),this.array[e*this.itemSize+t]=s,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Se(t,this.array)),t}setX(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Se(t,this.array)),t}setY(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Se(t,this.array)),t}setZ(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Se(t,this.array)),t}setW(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,s){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),s=U(s,this.array)),this.array[e+0]=t,this.array[e+1]=s,this}setXYZ(e,t,s,n){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),s=U(s,this.array),n=U(n,this.array)),this.array[e+0]=t,this.array[e+1]=s,this.array[e+2]=n,this}setXYZW(e,t,s,n,r){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),s=U(s,this.array),n=U(n,this.array),r=U(r,this.array)),this.array[e+0]=t,this.array[e+1]=s,this.array[e+2]=n,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}const so=new Ct,bt=new S,Vs=new S;class no{constructor(e=new S,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const s=this.center;t!==void 0?s.copy(t):so.setFromPoints(e).getCenter(s);let n=0;for(let r=0,o=e.length;r<o;r++)n=Math.max(n,s.distanceToSquared(e[r]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const s=this.center.distanceToSquared(e);return t.copy(e),s>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;bt.subVectors(e,this.center);const t=bt.lengthSq();if(t>this.radius*this.radius){const s=Math.sqrt(t),n=(s-this.radius)*.5;this.center.addScaledVector(bt,n/s),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Vs.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(bt.copy(e.center).add(Vs)),this.expandByPoint(bt.copy(e.center).sub(Vs))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}class ro{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=je()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,s){e*=this.stride,s*=t.stride;for(let n=0,r=this.stride;n<r;n++)this.array[e+n]=t.array[s+n];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=je()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),s=new this.constructor(t,this.stride);return s.setUsage(this.usage),s}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=je()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const he=new S;class ks{constructor(e,t,s,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=s,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,s=this.data.count;t<s;t++)he.fromBufferAttribute(this,t),he.applyMatrix4(e),this.setXYZ(t,he.x,he.y,he.z);return this}applyNormalMatrix(e){for(let t=0,s=this.count;t<s;t++)he.fromBufferAttribute(this,t),he.applyNormalMatrix(e),this.setXYZ(t,he.x,he.y,he.z);return this}transformDirection(e){for(let t=0,s=this.count;t<s;t++)he.fromBufferAttribute(this,t),he.transformDirection(e),this.setXYZ(t,he.x,he.y,he.z);return this}getComponent(e,t){let s=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(s=Se(s,this.array)),s}setComponent(e,t,s){return this.normalized&&(s=U(s,this.array)),this.data.array[e*this.data.stride+this.offset+t]=s,this}setX(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Se(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Se(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Se(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Se(t,this.array)),t}setXY(e,t,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),s=U(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=s,this}setXYZ(e,t,s,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),s=U(s,this.array),n=U(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=s,this.data.array[e+2]=n,this}setXYZW(e,t,s,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),s=U(s,this.array),n=U(n,this.array),r=U(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=s,this.data.array[e+2]=n,this.data.array[e+3]=r,this}clone(e){if(e===void 0){bs("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let s=0;s<this.count;s++){const n=s*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[n+r])}return new nr(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new ks(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){bs("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let s=0;s<this.count;s++){const n=s*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[n+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class io extends ye{constructor(e,t){super({width:e,height:t}),this.isFramebufferTexture=!0,this.magFilter=1003,this.minFilter=1003,this.generateMipmaps=!1,this.needsUpdate=!0}}class oo extends ye{constructor(e=[],t=301,s,n,r,o,a,h,c,l){super(e,t,s,n,r,o,a,h,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Gs extends ye{constructor(e,t,s=1014,n,r,o,a=1003,h=1003,c,l=1026,u=1){if(l!==1026&&l!==1027)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const p={width:e,height:t,depth:u};super(p,n,r,o,a,h,l,s,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Is(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const Pn=class Pn{constructor(e,t,s,n){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,s,n)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let s=0;s<4;s++)this.elements[s]=e[s+t];return this}set(e,t,s,n){const r=this.elements;return r[0]=e,r[2]=t,r[1]=s,r[3]=n,this}};Pn.prototype.isMatrix2=!0;let $s=Pn;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}})),typeof window<"u"&&(window.__THREE__?L("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");const ao=[/^StackTrace\\.js$/,/^TSLCore\\.js$/,/^.*Node\\.js$/,/^three\\.webgpu.*\\.js$/];function ho(i){const e=/(?:at\\s+(.+?)\\s+\\()?(?:(.+?)@)?([^@\\s()]+):(\\d+):(\\d+)/;return i.split(`\n`).map(t=>{const s=t.match(e);if(!s)return null;const n=s[1]||s[2]||"",r=s[3].split("?")[0],o=parseInt(s[4],10),a=parseInt(s[5],10),h=r.split("/").pop();return{fn:n,file:h,line:o,column:a}}).filter(t=>t&&!ao.some(s=>s.test(t.file)))}class Ae{constructor(e=null){this.isStackTrace=!0,this.stack=ho(e||new Error().stack)}getLocation(){if(this.stack.length===0)return"[Unknown location]";const e=this.stack[0],t=e.fn;return`${t?`"${t}()" at `:""}"${e.file}:${e.line}"`}getError(e){if(this.stack.length===0)return e;const t=this.stack.map(s=>{const n=`${s.file}:${s.line}:${s.column}`;return s.fn?`    at ${s.fn} (${n})`:`    at ${n}`}).join(`\n`);return`${e}\n${t}`}}function Ws(i,e=0){let t=3735928559^e,s=1103547991^e;if(Array.isArray(i))for(let n=0,r;n<i.length;n++)r=i[n],t=Math.imul(t^r,2654435761),s=Math.imul(s^r,1597334677);else for(let n=0,r;n<i.length;n++)r=i.charCodeAt(n),t=Math.imul(t^r,2654435761),s=Math.imul(s^r,1597334677);return t=Math.imul(t^t>>>16,2246822507),t^=Math.imul(s^s>>>13,3266489909),s=Math.imul(s^s>>>16,2246822507),s^=Math.imul(t^t>>>13,3266489909),4294967296*(2097151&s)+(t>>>0)}const rr=i=>Ws(i),co=i=>Ws(i),ir=(...i)=>Ws(i);function ss(i){if(i==null)return null;const e=typeof i;return i.isNode===!0?"node":e==="number"?"float":e==="boolean"?"bool":e==="string"?"string":e==="function"?"shader":i.isVector2===!0?"vec2":i.isVector3===!0?"vec3":i.isVector4===!0?"vec4":i.isMatrix2===!0?"mat2":i.isMatrix3===!0?"mat3":i.isMatrix4===!0?"mat4":i.isColor===!0?"color":i instanceof ArrayBuffer?"ArrayBuffer":null}function Hs(i,...e){const t=i?i.slice(-4):void 0;return e.length===1&&(t==="vec2"?e=[e[0],e[0]]:t==="vec3"?e=[e[0],e[0],e[0]]:t==="vec4"&&(e=[e[0],e[0],e[0],e[0]])),i==="color"?new Ds(...e):t==="vec2"?new Me(...e):t==="vec3"?new S(...e):t==="vec4"?new Ge(...e):t==="mat2"?new $s(...e):t==="mat3"?new Ce(...e):t==="mat4"?new xe(...e):i==="bool"?e[0]||!1:i==="float"||i==="int"||i==="uint"?e[0]||0:i==="string"?e[0]||"":i==="ArrayBuffer"?uo(e[0]):null}function lo(i){let e="";const t=new Uint8Array(i);for(let s=0;s<t.length;s++)e+=String.fromCharCode(t[s]);return btoa(e)}function uo(i){return Uint8Array.from(atob(i),e=>e.charCodeAt(0)).buffer}const zt={VERTEX:"vertex"},D={NONE:"none",FRAME:"frame",RENDER:"render",OBJECT:"object"},qs={READ_ONLY:"readOnly",WRITE_ONLY:"writeOnly",READ_WRITE:"readWrite"};[...["fragment","vertex"]];const Ft=["x","y","z","w"],po={analyze:"setup",generate:"analyze"};let fo=0;class C extends ht{static get type(){return"Node"}constructor(e=null){super(),this.nodeType=e,this.updateType=D.NONE,this.updateBeforeType=D.NONE,this.updateAfterType=D.NONE,this.version=0,this.name="",this.global=!1,this.parents=!1,this.isNode=!0,this._beforeNodes=null,this._cacheKey=null,this._uuid=null,this._cacheKeyVersion=0,this.id=fo++,this.stackTrace=null,C.captureStackTrace===!0&&(this.stackTrace=new Ae)}set needsUpdate(e){e===!0&&this.version++}get uuid(){return this._uuid===null&&(this._uuid=$i.generateUUID()),this._uuid}get type(){return this.constructor.type}onUpdate(e,t){return this.updateType=t,this.update=e.bind(this),this}onFrameUpdate(e){return this.onUpdate(e,D.FRAME)}onRenderUpdate(e){return this.onUpdate(e,D.RENDER)}onObjectUpdate(e){return this.onUpdate(e,D.OBJECT)}onReference(e){return this.updateReference=e.bind(this),this}updateReference(){return this}isGlobal(){return this.global}*getChildren(){for(const{childNode:e}of this._getChildren())yield e}dispose(){this.dispatchEvent({type:"dispose"})}traverse(e){e(this);for(const t of this.getChildren())t.traverse(e)}_getChildren(e=new Set){const t=[];e.add(this);for(const s of Object.getOwnPropertyNames(this)){const n=this[s];if(!(s.startsWith("_")===!0||e.has(n))){if(Array.isArray(n)===!0)for(let r=0;r<n.length;r++){const o=n[r];o&&o.isNode===!0&&t.push({property:s,index:r,childNode:o})}else if(n&&n.isNode===!0)t.push({property:s,childNode:n});else if(n&&Object.getPrototypeOf(n)===Object.prototype)for(const r in n){if(r.startsWith("_")===!0)continue;const o=n[r];o&&o.isNode===!0&&t.push({property:s,index:r,childNode:o})}}}return t}getCacheKey(e=!1,t=null){if(e=e||this.version!==this._cacheKeyVersion,e===!0||this._cacheKey===null){t===null&&(t=new Set);const s=[];for(const{property:n,childNode:r}of this._getChildren(t))s.push(rr(n.slice(0,-4)),r.getCacheKey(e,t));this._cacheKey=ir(co(s),this.customCacheKey()),this._cacheKeyVersion=this.version}return this._cacheKey}customCacheKey(){return this.id}getScope(){return this}getHash(){return String(this.id)}getUpdateType(){return this.updateType}getUpdateBeforeType(){return this.updateBeforeType}getUpdateAfterType(){return this.updateAfterType}getElementType(e){const t=this.getNodeType(e);return e.getElementType(t)}getMemberType(){return"void"}getNodeType(e,t=null){const s=e.getDataFromNode(this);let n;return t!==null?(s.typeFromOutput=s.typeFromOutput||{},n=s.typeFromOutput[t],n===void 0&&(n=this.generateNodeType(e,t),s.typeFromOutput[t]=n)):(n=s.type,n===void 0&&(n=this.generateNodeType(e),s.type=n)),n}generateNodeType(e,t=null){const s=e.getNodeProperties(this);return s.outputNode?s.outputNode.getNodeType(e,t):this.nodeType}getShared(e){const t=this.getHash(e),s=e.getNodeFromHash(t);let n=null;if(s&&s!==this)n=s;else if(e.context.overrideNodes){const r=e.context.overrideNodes.get(this);if(r){const o=e.getDataFromNode(this);o.isOverwritten!==!0?(o.isOverwritten=!0,n=r(e).overrideNode(this,null),o.sharedNode=n):n=o.sharedNode}}return n||this}getArrayCount(){return null}setup(e){const t=e.getNodeProperties(this);let s=0;for(const n of this.getChildren())t["node"+s++]=n;return t.outputNode||null}analyze(e,t=null){const s=e.increaseUsage(this);if(this.parents===!0){const n=e.getDataFromNode(this,"any");n.stages=n.stages||{},n.stages[e.shaderStage]=n.stages[e.shaderStage]||[],n.stages[e.shaderStage].push(t)}if(s===1){const n=e.getNodeProperties(this);for(const r of Object.values(n))r&&r.isNode===!0&&r.build(e,this)}}generate(e,t){const{outputNode:s}=e.getNodeProperties(this);if(s&&s.isNode===!0)return s.build(e,t)}updateBefore(){L("Abstract function.")}updateAfter(){L("Abstract function.")}update(){L("Abstract function.")}before(e){return this._beforeNodes===null&&(this._beforeNodes=[]),this._beforeNodes.push(e),this}build(e,t=null){const s=this.getShared(e);if(this!==s)return s.build(e,t);if(this._beforeNodes!==null){const h=this._beforeNodes;this._beforeNodes=null;for(const c of h)c.build(e,t);this._beforeNodes=h}const n=e.getDataFromNode(this);n.buildStages=n.buildStages||{},n.buildStages[e.buildStage]=!0;const r=po[e.buildStage];if(r&&n.buildStages[r]!==!0){const h=e.getBuildStage();e.setBuildStage(r),this.build(e),e.setBuildStage(h)}e.addChain(this);let o=null;const a=e.getBuildStage();if(a==="setup"){e.addNode(this),this.updateReference(e);const h=e.getNodeProperties(this);if(h.initialized!==!0){h.initialized=!0,h.outputNode=this.setup(e)||h.outputNode||null;for(const c of Object.values(h))if(c&&c.isNode===!0){if(c.parents===!0){const l=e.getNodeProperties(c);l.parents=l.parents||[],l.parents.push(this)}c.build(e)}e.addSequentialNode(this)}o=h.outputNode}else if(a==="analyze")this.analyze(e,t);else if(a==="generate"){if(this.generate.length<2){const c=this.getNodeType(e),l=e.getDataFromNode(this);o=l.snippet,o===void 0?l.generated===void 0?(l.generated=!0,o=this.generate(e)||"",l.snippet=o):(L("Node: Recursion detected.",this),o="/* Recursion detected. */"):l.flowCodes!==void 0&&e.context.nodeBlock!==void 0&&e.addFlowCodeHierarchy(this,e.context.nodeBlock),o=e.format(o,c,t)}else o=this.generate(e,t)||"";o===""&&t!==null&&t!=="void"&&t!=="OutputType"&&(q(`TSL: Invalid generated code, expected a "${t}".`),o=e.generateConst(t))}return e.removeChain(this),o}getSerializeChildren(){return this._getChildren()}serialize(e){const t=this.getSerializeChildren(),s={};for(const{property:n,index:r,childNode:o}of t)r!==void 0?(s[n]===void 0&&(s[n]=Number.isInteger(r)?[]:{}),s[n][r]=o.toJSON(e.meta).uuid):s[n]=o.toJSON(e.meta).uuid;Object.keys(s).length>0&&(e.inputNodes=s)}deserialize(e){if(e.inputNodes!==void 0){const t=e.meta.nodes;for(const s in e.inputNodes)if(Array.isArray(e.inputNodes[s])){const n=[];for(const r of e.inputNodes[s])n.push(t[r]);this[s]=n}else if(typeof e.inputNodes[s]=="object"){const n={};for(const r in e.inputNodes[s]){const o=e.inputNodes[s][r];n[r]=t[o]}this[s]=n}else{const n=e.inputNodes[s];this[s]=t[n]}}}toJSON(e){const{uuid:t,type:s}=this,n=e===void 0||typeof e=="string";n&&(e={textures:{},images:{},nodes:{}});let r=e.nodes[t];r===void 0&&(r={uuid:t,type:s,meta:e,metadata:{version:4.7,type:"Node",generator:"Node.toJSON"}},n!==!0&&(e.nodes[r.uuid]=r),this.serialize(r),delete r.meta);function o(a){const h=[];for(const c in a){const l=a[c];delete l.metadata,h.push(l)}return h}if(n){const a=o(e.textures),h=o(e.images),c=o(e.nodes);a.length>0&&(r.textures=a),h.length>0&&(r.images=h),c.length>0&&(r.nodes=c)}return r}}C.captureStackTrace=!1;class Rt extends C{static get type(){return"ArrayElementNode"}constructor(e,t){super(),this.node=e,this.indexNode=t,this.isArrayElementNode=!0}generateNodeType(e){return this.node.getElementType(e)}getMemberType(e,t){return this.node.getMemberType(e,t)}generate(e){const t=this.indexNode.getNodeType(e),s=this.node.build(e),n=this.indexNode.build(e,!e.isVector(t)&&e.isInteger(t)?t:"uint");return`${s}[ ${n} ]`}}class or extends C{static get type(){return"ConvertNode"}constructor(e,t){super(),this.node=e,this.convertTo=t}generateNodeType(e){const t=this.node.getNodeType(e);let s=null;for(const n of this.convertTo.split("|"))(s===null||e.getTypeLength(t)===e.getTypeLength(n))&&(s=n);return s}serialize(e){super.serialize(e),e.convertTo=this.convertTo}deserialize(e){super.deserialize(e),this.convertTo=e.convertTo}generate(e,t){const s=this.node,n=this.getNodeType(e),r=s.build(e,n);return e.format(r,n,t)}}class te extends C{static get type(){return"TempNode"}constructor(e=null){super(e),this.isTempNode=!0}hasDependencies(e){return e.getDataFromNode(this).usageCount>1}build(e,t){if(e.getBuildStage()==="generate"){const n=e.getVectorType(this.getNodeType(e,t)),r=e.getDataFromNode(this);if(r.propertyName!==void 0)return e.format(r.propertyName,n,t);if(n!=="void"&&t!=="void"&&this.hasDependencies(e)){const o=super.build(e,n),a=e.getVarFromNode(this,null,n),h=e.getPropertyName(a);return e.addLineFlowCode(`${h} = ${o}`,this),r.snippet=o,r.propertyName=h,e.format(r.propertyName,n,t)}}return super.build(e,t)}}class mo extends te{static get type(){return"JoinNode"}constructor(e=[],t=null){super(t),this.nodes=e}generateNodeType(e){return this.nodeType!==null?e.getVectorType(this.nodeType):e.getTypeFromLength(this.nodes.reduce((t,s)=>t+e.getTypeLength(s.getNodeType(e)),0))}generate(e,t){const s=this.getNodeType(e),n=e.getTypeLength(s),r=this.nodes,o=e.getComponentType(s),a=[];let h=0;for(const l of r){if(h>=n){q(`TSL: Length of parameters exceeds maximum length of function \'${s}()\' type.`,this.stackTrace);break}let u=l.getNodeType(e),p=e.getTypeLength(u),d;if(h+p>n&&(q(`TSL: Length of \'${s}()\' data exceeds maximum length of output type.`,this.stackTrace),p=n-h,u=e.getTypeFromLength(p)),h+=p,d=l.build(e,u),e.getComponentType(u)!==o){const g=e.getTypeFromLength(p,o);d=e.format(d,u,g)}a.push(d)}const c=`${e.getType(s)}( ${a.join(", ")} )`;return e.format(c,s,t)}}const go=Ft.join("");class yo extends C{static get type(){return"SplitNode"}constructor(e,t="x"){super(),this.node=e,this.components=t,this.isSplitNode=!0}getVectorLength(){let e=this.components.length;for(const t of this.components)e=Math.max(Ft.indexOf(t)+1,e);return e}getComponentType(e){return e.getComponentType(this.node.getNodeType(e))}generateNodeType(e){return e.getTypeFromLength(this.components.length,this.getComponentType(e))}getScope(){return this.node.getScope()}generate(e,t){const s=this.node,n=e.getTypeLength(s.getNodeType(e));let r=null;if(n>1){let o=null;this.getVectorLength()>=n&&(o=e.getTypeFromLength(this.getVectorLength(),this.getComponentType(e)));const h=s.build(e,o);this.components.length===n&&this.components===go.slice(0,this.components.length)?r=e.format(h,o,t):r=e.format(`${h}.${this.components}`,this.getNodeType(e),t)}else r=s.build(e,t);return r}serialize(e){super.serialize(e),e.components=this.components}deserialize(e){super.deserialize(e),this.components=e.components}}class xo extends te{static get type(){return"SetNode"}constructor(e,t,s){super(),this.sourceNode=e,this.components=t,this.targetNode=s}generateNodeType(e){return this.sourceNode.getNodeType(e)}generate(e){const{sourceNode:t,components:s,targetNode:n}=this,r=this.getNodeType(e),o=e.getComponentType(n.getNodeType(e)),a=e.getTypeFromLength(s.length,o),h=n.build(e,a),c=t.build(e,r),l=e.getTypeLength(r),u=[];for(let p=0;p<l;p++){const d=Ft[p];d===s[0]?(u.push(h),p+=s.length-1):u.push(c+"."+d)}return`${e.getType(r)}( ${u.join(", ")} )`}}class No extends te{static get type(){return"FlipNode"}constructor(e,t){super(),this.sourceNode=e,this.components=t}generateNodeType(e){return this.sourceNode.getNodeType(e)}generate(e){const{components:t,sourceNode:s}=this,n=this.getNodeType(e),r=s.build(e),o=e.getVarFromNode(this),a=e.getPropertyName(o);e.addLineFlowCode(a+" = "+r,this);const h=e.getTypeLength(n),c=[];let l=0;for(let u=0;u<h;u++){const p=Ft[u];p===t[l]?(c.push("1.0 - "+(a+"."+p)),l++):c.push(a+"."+p)}return`${e.getType(n)}( ${c.join(", ")} )`}}class Ys extends C{static get type(){return"InputNode"}constructor(e,t=null){super(t),this.isInputNode=!0,this.value=e,this.precision=null}generateNodeType(){return this.nodeType===null?ss(this.value):this.nodeType}getInputType(e){return this.getNodeType(e)}setPrecision(e){return this.precision=e,this}serialize(e){super.serialize(e),e.value=this.value,this.value&&this.value.toArray&&(e.value=this.value.toArray()),e.valueType=ss(this.value),e.nodeType=this.nodeType,e.valueType==="ArrayBuffer"&&(e.value=lo(e.value)),e.precision=this.precision}deserialize(e){super.deserialize(e),this.nodeType=e.nodeType,this.value=Array.isArray(e.value)?Hs(e.valueType,...e.value):e.value,this.precision=e.precision||null,this.value&&this.value.fromArray&&(this.value=this.value.fromArray(e.value))}generate(){L("Abstract function.")}}const ar=/float|u?int/;class ve extends Ys{static get type(){return"ConstNode"}constructor(e,t=null){super(e,t),this.isConstNode=!0}generateConst(e){return e.generateConst(this.getNodeType(e),this.value)}generate(e,t){const s=this.getNodeType(e);return ar.test(s)&&ar.test(t)?e.generateConst(t,this.value):e.format(this.generateConst(e),s,t)}}class To extends C{static get type(){return"MemberNode"}constructor(e,t){super(),this.structNode=e,this.property=t,this.isMemberNode=!0}hasMember(e){return this.structNode.isMemberNode&&this.structNode.hasMember(e)===!1?!1:this.structNode.getMemberType(e,this.property)!=="void"}generateNodeType(e){return this.hasMember(e)===!1?"float":this.structNode.getMemberType(e,this.property)}getMemberType(e,t){if(this.hasMember(e)===!1)return"float";const s=this.getNodeType(e);return e.getStructTypeNode(s).getMemberType(e,t)}generate(e){if(this.hasMember(e)===!1){L(`TSL: Member "${this.property}" does not exist in struct.`,this.stackTrace);const s=this.getNodeType(e);return e.generateConst(s)}return this.structNode.build(e)+"."+this.property}}let wo=null;const Xs=new Map;function y(i,e){if(Xs.has(i)){L(`TSL: Redefinition of method chaining \'${i}\'.`);return}if(typeof e!="function")throw new Error(`THREE.TSL: Node element ${i} is not a function`);Xs.set(i,e),i!=="assign"&&(C.prototype[i]=function(...t){return this.isStackNode?this.addToStack(e(...t)):e(this,...t)},C.prototype[i+"Assign"]=function(...t){return this.isStackNode?this.assign(t[0],e(...t)):this.assign(e(this,...t))})}const So=i=>i.replace(/r|s/g,"x").replace(/g|t/g,"y").replace(/b|p/g,"z").replace(/a|q/g,"w"),hr=i=>So(i).split("").sort().join("");C.prototype.assign=function(...i){if(this.isStackNode!==!0)return q("TSL: No stack defined for assign operation. Make sure the assign is inside a Fn().",new Ae),this;{const e=Xs.get("assign");return this.addToStack(e(...i))}},C.prototype.toVarIntent=function(){return this},C.prototype.get=function(i){return new To(this,i)};const It={};function ns(i,e,t){It[i]=It[e]=It[t]={get(){this._cache=this._cache||{};let o=this._cache[i];return o===void 0&&(o=new yo(this,i),this._cache[i]=o),o},set(o){this[i].assign(M(o))}};const s=i.toUpperCase(),n=e.toUpperCase(),r=t.toUpperCase();C.prototype["set"+s]=C.prototype["set"+n]=C.prototype["set"+r]=function(o){const a=hr(i);return new xo(this,a,M(o))},C.prototype["flip"+s]=C.prototype["flip"+n]=C.prototype["flip"+r]=function(){const o=hr(i);return new No(this,o)}}const be=["x","y","z","w"],ze=["r","g","b","a"],Fe=["s","t","p","q"];for(let i=0;i<4;i++){let e=be[i],t=ze[i],s=Fe[i];ns(e,t,s);for(let n=0;n<4;n++){e=be[i]+be[n],t=ze[i]+ze[n],s=Fe[i]+Fe[n],ns(e,t,s);for(let r=0;r<4;r++){e=be[i]+be[n]+be[r],t=ze[i]+ze[n]+ze[r],s=Fe[i]+Fe[n]+Fe[r],ns(e,t,s);for(let o=0;o<4;o++)e=be[i]+be[n]+be[r]+be[o],t=ze[i]+ze[n]+ze[r]+ze[o],s=Fe[i]+Fe[n]+Fe[r]+Fe[o],ns(e,t,s)}}}for(let i=0;i<32;i++)It[i]={get(){this._cache=this._cache||{};let e=this._cache[i];return e===void 0&&(e=new Rt(this,new ve(i,"uint")),this._cache[i]=e),e},set(e){this[i].assign(M(e))}};Object.defineProperties(C.prototype,It);const Mo=function(i,e=null){const t=ss(i);return t==="node"?i:e===null&&(t==="float"||t==="boolean")||t&&t!=="shader"&&t!=="string"?M(Qs(i,e)):t==="shader"?i.isFn?i:E(i):i},_o=function(i,e=null){for(const t in i)i[t]=M(i[t],e);return i},Eo=function(i,e=null){const t=i.length;for(let s=0;s<t;s++)i[s]=M(i[s],e);return i},cr=function(i,e=null,t=null,s=null){function n(l){return s!==null?(l=M(Object.assign(l,s)),s.intent===!0&&(l=l.toVarIntent())):l=M(l),l}let r,o=e,a,h;function c(l){let u;return o?u=/[a-z]/i.test(o)?o+"()":o:u=i.type,a!==void 0&&l.length<a?(q(`TSL: "${u}" parameter length is less than minimum required.`,new Ae),l.concat(new Array(a-l.length).fill(0))):h!==void 0&&l.length>h?(q(`TSL: "${u}" parameter length exceeds limit.`,new Ae),l.slice(0,h)):l}return e===null?r=(...l)=>n(new i(...yt(c(l)))):t!==null?(t=M(t),r=(...l)=>n(new i(e,...yt(c(l)),t))):r=(...l)=>n(new i(e,...yt(c(l)))),r.setParameterLength=(...l)=>(l.length===1?a=h=l[0]:l.length===2&&([a,h]=l),r),r.setName=l=>(o=l,r),r},Ao=function(i,...e){return new i(...yt(e))};class Co extends C{constructor(e,t){super(),this.shaderNode=e,this.rawInputs=t,this.isShaderCallNodeInternal=!0}generateNodeType(e){return this.shaderNode.nodeType||this.getOutputNode(e).getNodeType(e)}getElementType(e){return this.getOutputNode(e).getElementType(e)}getMemberType(e,t){return this.getOutputNode(e).getMemberType(e,t)}call(e){const{shaderNode:t,rawInputs:s}=this,n=e.getNodeProperties(t),r=e.getClosestSubBuild(t.subBuilds)||"",o=r||"default";if(n[o])return n[o];const a=e.subBuildFn,h=e.fnCall;e.subBuildFn=r,e.fnCall=this;let c=null;if(t.layout){if(s){const p=t.layout.inputs;if(lr(s)){const d=s;for(let f=0;f<p.length;f++){const g=d[f];g&&g.isNode&&g.build(e)}}else{const d=s[0];for(const f of p){const g=d[f.name];g&&g.isNode&&g.build(e)}}}const l=e.buildFunctionNode(t);e.addInclude(l);const u=s?vo(s):null;c=l.call(u)}else{const l=new Proxy(e,{get:(g,N,T)=>{let A;return Symbol.iterator===N?A=function*(){yield void 0}:A=Reflect.get(g,N,T),A}}),u=s?bo(s):null,p=Array.isArray(s)?s.length>0:s!==null,d=t.jsFunc,f=p||d.length>1?d(u,l):d(l);c=M(f)}return e.subBuildFn=a,e.fnCall=h,t.once&&(n[o]=c),c}setupOutput(e){return e.addStack(),e.stack.outputNode=this.call(e),e.removeStack()}getOutputNode(e){const t=e.getNodeProperties(this),s=e.getSubBuildOutput(this);return t[s]=t[s]||this.setupOutput(e),t[s].subBuild=e.getClosestSubBuild(this),t[s]}build(e,t=null){let s=null;const n=e.getBuildStage(),r=e.getNodeProperties(this),o=e.getSubBuildOutput(this),a=this.getOutputNode(e),h=e.fnCall;if(e.fnCall=this,n==="setup"){const c=e.getSubBuildProperty("initialized",this);if(r[c]!==!0&&(r[c]=!0,r[o]=this.getOutputNode(e),r[o].build(e),this.shaderNode.subBuilds))for(const l of e.chaining){const u=e.getDataFromNode(l,"any");u.subBuilds=u.subBuilds||new Set;for(const p of this.shaderNode.subBuilds)u.subBuilds.add(p)}s=r[o]}else n==="analyze"?a.build(e,t):n==="generate"&&(s=a.build(e,t)||"");return e.fnCall=h,s}}function lr(i){return i[0]&&(i[0].isNode||Object.getPrototypeOf(i[0])!==Object.prototype)}function vo(i){let e;return Ks(i),lr(i)?e=[...i]:e=i[0],e}function bo(i){let e=0;return Ks(i),new Proxy(i,{get:(t,s,n)=>{let r;if(s==="length")return r=i.length,r;if(Symbol.iterator===s)r=function*(){for(const o of i)yield M(o)};else{if(i.length>0)if(Object.getPrototypeOf(i[0])===Object.prototype){const o=i[0];o[s]===void 0?r=o[e++]:r=Reflect.get(o,s,n)}else i[0]instanceof C&&(i[s]===void 0?r=i[e++]:r=Reflect.get(i,s,n));else r=Reflect.get(t,s,n);r=M(r)}return r}})}class zo extends C{constructor(e,t){super(t),this.jsFunc=e,this.layout=null,this.global=!0,this.once=!1}setLayout(e){return this.layout=e,this}getLayout(){return this.layout}call(e=null){return new Co(this,e)}setup(){return this.call()}}const Fo=[!1,!0],Ro=[0,1,2,3],Io=[-1,-2],ur=[.5,1.5,1/3,1e-6,1e6,Math.PI,Math.PI*2,1/Math.PI,2/Math.PI,1/(Math.PI*2),Math.PI/2],Zs=new Map;for(const i of Fo)Zs.set(i,new ve(i));const js=new Map;for(const i of Ro)js.set(i,new ve(i,"uint"));const Js=new Map([...js].map(i=>new ve(i.value,"int")));for(const i of Io)Js.set(i,new ve(i,"int"));const rs=new Map([...Js].map(i=>new ve(i.value)));for(const i of ur)rs.set(i,new ve(i));for(const i of ur)rs.set(-i,new ve(-i));const is={bool:Zs,uint:js,ints:Js,float:rs},dr=new Map([...Zs,...rs]),Qs=(i,e)=>dr.has(i)?dr.get(i):i.isNode===!0?i:new ve(i,e),J=function(i,e=null){return(...t)=>{for(const n of t)if(n===void 0)return q(`TSL: Invalid parameter for the type "${i}".`,new Ae),new ve(0,i);if((t.length===0||!["bool","float","int","uint"].includes(i)&&t.every(n=>{const r=typeof n;return r!=="object"&&r!=="function"}))&&(t=[Hs(i,...t)]),t.length===1&&e!==null&&e.has(t[0]))return os(e.get(t[0]));if(t.length===1){const n=Qs(t[0],i);return n.nodeType===i?os(n):os(new or(n,i))}const s=t.map(n=>Qs(n));return os(new mo(s,i))}};function Lo(i){return i&&i.isNode&&i.traverse(e=>{e.isConstNode&&(i=e.value)}),!!i}const Oo=i=>i!=null?i.nodeType||i.convertTo||(typeof i=="string"?i:null):null;function Po(i,e){return new zo(i,e)}const M=(i,e=null)=>Mo(i,e),os=(i,e=null)=>M(i,e).toVarIntent(),Ks=(i,e=null)=>new _o(i,e),yt=(i,e=null)=>new Eo(i,e),K=(i,e=null,t=null,s=null)=>new cr(i,e,t,s),_=(i,...e)=>new Ao(i,...e),w=(i,e=null,t=null,s={})=>new cr(i,e,t,{...s,intent:!0});let Bo=0;class Do extends C{constructor(e,t=null){super();let s=null;t!==null&&(typeof t=="object"?s=t.return:(typeof t=="string"?s=t:q("TSL: Invalid layout type.",new Ae),t=null)),this.shaderNode=new Po(e,s),t!==null&&this.setLayout(t),this.isFn=!0}setLayout(e){const t=this.shaderNode.nodeType;if(typeof e.inputs!="object"){const s={name:"fn"+Bo++,type:t,inputs:[]};for(const n in e)n!=="return"&&s.inputs.push({name:n,type:e[n]});e=s}return this.shaderNode.setLayout(e),this}generateNodeType(e){return this.shaderNode.getNodeType(e)||"float"}call(...e){const t=this.shaderNode.call(e);return this.shaderNode.nodeType==="void"&&t.toStack(),t.toVarIntent()}once(e=null){return this.shaderNode.once=!0,this.shaderNode.subBuilds=e,this}generate(e){const t=this.getNodeType(e);return q(\'TSL: "Fn()" was declared but not invoked. Try calling it like "Fn()( ...params )".\',this.stackTrace),e.generateConst(t)}}function E(i,e=null){const t=new Do(i,e);return new Proxy(()=>{},{apply(s,n,r){return t.call(...r)},get(s,n,r){return Reflect.get(t,n,r)},set(s,n,r,o){return Reflect.set(t,n,r,o)}})}const ue=(...i)=>wo.If(...i);function Uo(i){return i}y("toStack",Uo);const Vo=new J("color"),P=new J("float",is.float),Lt=new J("int",is.ints),se=new J("uint",is.uint),en=new J("bool",is.bool),Be=new J("vec2"),pr=new J("ivec2"),fr=new J("uvec2"),ko=new J("bvec2"),R=new J("vec3"),mr=new J("ivec3"),gr=new J("uvec3"),Go=new J("bvec3"),k=new J("vec4"),yr=new J("ivec4"),xr=new J("uvec4"),$o=new J("bvec4"),Nr=new J("mat2"),et=new J("mat3"),Tr=new J("mat4");y("toColor",Vo),y("toFloat",P),y("toInt",Lt),y("toUint",se),y("toBool",en),y("toVec2",Be),y("toIVec2",pr),y("toUVec2",fr),y("toBVec2",ko),y("toVec3",R),y("toIVec3",mr),y("toUVec3",gr),y("toBVec3",Go),y("toVec4",k),y("toIVec4",yr),y("toUVec4",xr),y("toBVec4",$o),y("toMat2",Nr),y("toMat3",et),y("toMat4",Tr);const Wo=K(Rt).setParameterLength(2),Ho=(i,e)=>new or(M(i),e);y("element",Wo),y("convert",Ho),y("append",i=>(L("TSL: .append() has been renamed to .toStack().",new Ae),i));class xt extends C{static get type(){return"PropertyNode"}constructor(e,t=null,s=!1,n=null){super(e),this.name=t,this.varying=s,this.placeholderNode=M(n),this.isPropertyNode=!0,this.global=!0}getNodeType(e){const t=super.getNodeType(e);return t==="output"?e.getOutputType():t}customCacheKey(){return rr(this.type+":"+(this.name||"")+":"+(this.varying?"1":"0"))}getHash(e){return this.name||super.getHash(e)}generate(e){let t;if(this.varying===!0)t=e.getVaryingFromNode(this,this.name),t.needsInterpolation=!0;else if(t=e.getVarFromNode(this,this.name),this.placeholderNode!==null&&e.hasWriteUsage(this)===!1){const s=this.placeholderNode.build(e,this.getNodeType(e));e.addLineFlowCode(`${e.getPropertyName(t)} = ${s}`,this)}return e.getPropertyName(t)}}const tt=(i,e,t=null)=>new xt(i,e,!1,t),as=(i,e,t=null)=>new xt(i,e,!0,t),wr=_(xt,"vec4","DiffuseColor"),Sr=_(xt,"output","Output"),tn=_(xt,"float","dashSize"),Mr=_(xt,"float","gapSize");class _r extends C{static get type(){return"UniformGroupNode"}constructor(e,t=!1,s=1,n=null){super("string"),this.name=e,this.shared=t,this.order=s,this.updateType=n,this.isUniformGroup=!0}update(){this.needsUpdate=!0}serialize(e){super.serialize(e),e.name=this.name,e.version=this.version,e.shared=this.shared}deserialize(e){super.deserialize(e),this.name=e.name,this.version=e.version,this.shared=e.shared}}const qo=(i,e=1,t=null)=>new _r(i,!1,e,t),sn=(i,e=0,t=null)=>new _r(i,!0,e,t);D.FRAME;const oe=sn("render",0,D.RENDER),Yo=qo("object",1,D.OBJECT);class Ot extends Ys{static get type(){return"UniformNode"}constructor(e,t=null){super(e,t),this.isUniformNode=!0,this.name="",this.groupNode=Yo}setName(e){return this.name=e,this}label(e){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\',new Ae),this.setName(e)}setGroup(e){return this.groupNode=e,this}getGroup(){return this.groupNode}getUniformHash(e){return this.getHash(e)}onUpdate(e,t){return e=e.bind(this),super.onUpdate(s=>{const n=e(s,this);n!==void 0&&(this.value=n)},t)}getInputType(e){let t=super.getInputType(e);return t==="bool"&&(t="uint"),t}generate(e,t){const s=this.getNodeType(e),n=this.getUniformHash(e);let r=e.getNodeFromHash(n);r===void 0&&(e.setHashNode(this,n),r=this);const o=r.getInputType(e),a=e.getUniformFromNode(r,o,e.shaderStage,this.name||e.context.nodeName),h=e.getPropertyName(a);e.context.nodeName!==void 0&&delete e.context.nodeName;let c=h;if(s==="bool"){const l=e.getDataFromNode(this);let u=l.propertyName;if(u===void 0){const p=e.getVarFromNode(this,null,"bool");u=e.getPropertyName(p),l.propertyName=u,c=e.format(h,o,s),e.addLineFlowCode(`${u} = ${c}`,this)}c=u}return e.format(c,s,t)}}const Z=(i,e)=>{const t=Oo(e||i);if(t===i&&(i=Hs(t)),i&&i.isNode===!0){let s=i.value;i.traverse(n=>{n.isConstNode===!0&&(s=n.value)}),i=s}return new Ot(i,t)};class Er extends te{static get type(){return"ArrayNode"}constructor(e,t,s=null){super(e),this.count=t,this.values=s,this.isArrayNode=!0}getArrayCount(){return this.count}generateNodeType(e){return this.nodeType===null?this.values[0].getNodeType(e):this.nodeType}getElementType(e){return this.getNodeType(e)}getMemberType(e,t){return this.nodeType===null?this.values[0].getMemberType(e,t):super.getMemberType(e,t)}generate(e){const t=this.getNodeType(e);return e.generateArray(t,this.count,this.values)}}const Xo=(...i)=>{let e;if(i.length===1){const t=i[0];e=new Er(null,t.length,t)}else{const t=i[0],s=i[1];e=new Er(t,s)}return M(e)};y("toArray",(i,e)=>Xo(Array(e).fill(i)));class Zo extends te{static get type(){return"AssignNode"}constructor(e,t){super(),this.targetNode=e,this.sourceNode=t,this.isAssignNode=!0}hasDependencies(){return!1}generateNodeType(e,t){return t!=="void"?this.targetNode.getNodeType(e):"void"}needsSplitAssign(e){const{targetNode:t}=this;if(e.isAvailable("swizzleAssign")===!1&&t.isSplitNode&&t.components.length>1){const s=e.getTypeLength(t.node.getNodeType(e));return Ft.join("").slice(0,s)!==t.components}return!1}setup(e){const{targetNode:t,sourceNode:s}=this,n=t.getScope(),r=e.getDataFromNode(n);r.assign=!0;const o=e.getNodeProperties(this);o.sourceNode=s,o.targetNode=t.context({assign:!0})}generate(e,t){const{targetNode:s,sourceNode:n}=e.getNodeProperties(this),r=this.needsSplitAssign(e),o=s.build(e),a=s.getNodeType(e),h=n.build(e,a),c=n.getNodeType(e),l=e.getDataFromNode(this);let u;if(l.initialized===!0)t!=="void"&&(u=o);else if(r){const p=e.getVarFromNode(this,null,a),d=e.getPropertyName(p);e.addLineFlowCode(`${d} = ${h}`,this);const f=s.node,N=f.node.context({assign:!0}).build(e);for(let T=0;T<f.components.length;T++){const A=f.components[T];e.addLineFlowCode(`${N}.${A} = ${d}[ ${T} ]`,this)}t!=="void"&&(u=o)}else u=`${o} = ${h}`,(t==="void"||c==="void")&&(e.addLineFlowCode(u,this),t!=="void"&&(u=o));return l.initialized=!0,e.format(u,a,t)}}y("assign",K(Zo).setParameterLength(2));class jo extends te{static get type(){return"FunctionCallNode"}constructor(e=null,t={}){super(),this.functionNode=e,this.parameters=t}setParameters(e){return this.parameters=e,this}getParameters(){return this.parameters}generateNodeType(e){return this.functionNode.getNodeType(e)}getMemberType(e,t){return this.functionNode.getMemberType(e,t)}generate(e){const t=[],s=this.functionNode,n=s.getInputs(e),r=this.parameters,o=(h,c)=>{const l=c.type,u=l==="pointer";let p;return u?p="&"+h.build(e):p=h.build(e,l),p};if(Array.isArray(r)){if(r.length>n.length)q("TSL: The number of provided parameters exceeds the expected number of inputs in \'Fn()\'."),r.length=n.length;else if(r.length<n.length)for(q("TSL: The number of provided parameters is less than the expected number of inputs in \'Fn()\'.");r.length<n.length;)r.push(P(0));for(let h=0;h<r.length;h++)t.push(o(r[h],n[h]))}else for(const h of n){const c=r[h.name];c!==void 0?t.push(o(c,h)):(q(`TSL: Input \'${h.name}\' not found in \'Fn()\'.`),t.push(o(P(0),h)))}return`${s.build(e,"property")}( ${t.join(", ")} )`}}y("call",(i,...e)=>(e=e.length>1||e[0]&&e[0].isNode===!0?yt(e):Ks(e[0]),new jo(M(i),e)));const Jo={"==":"equal","!=":"notEqual","<":"lessThan",">":"greaterThan","<=":"lessThanEqual",">=":"greaterThanEqual","%":"mod"};class H extends te{static get type(){return"OperatorNode"}constructor(e,t,s,...n){if(super(),n.length>0){let r=new H(e,t,s);for(let o=0;o<n.length-1;o++)r=new H(e,r,n[o]);t=r,s=n[n.length-1]}this.op=e,this.aNode=t,this.bNode=s,this.isOperatorNode=!0}getOperatorMethod(e,t){return e.getMethod(Jo[this.op],t)}generateNodeType(e,t=null){const s=this.op,n=this.aNode,r=this.bNode,o=n.getNodeType(e),a=r?r.getNodeType(e):null;if(o==="void"||a==="void")return t||"void";if(s==="%")return o;if(s==="~"||s==="&"||s==="|"||s==="^"||s===">>"||s==="<<")return e.getIntegerType(o);if(s==="&&"||s==="||"||s==="^^")return"bool";if(s==="!"){const h=e.getTypeLength(o);return h>1?`bvec${h}`:"bool"}else if(s==="=="||s==="!="||s==="<"||s===">"||s==="<="||s===">="){const h=Math.max(e.getTypeLength(o),e.getTypeLength(a));return h>1?`bvec${h}`:"bool"}else{if(e.isMatrix(o)){if(a==="float")return o;if(e.isVector(a))return e.getVectorFromMatrix(o);if(e.isMatrix(a))return o}else if(e.isMatrix(a)){if(o==="float")return a;if(e.isVector(o))return e.getVectorFromMatrix(a)}return e.getTypeLength(a)>e.getTypeLength(o)?a:o}}generate(e,t){const s=this.op,{aNode:n,bNode:r}=this,o=this.getNodeType(e,t);let a=null,h=null;o!=="void"?(a=n.getNodeType(e),h=r?r.getNodeType(e):null,s==="<"||s===">"||s==="<="||s===">="||s==="=="||s==="!="?e.isVector(a)?h=a:e.isVector(h)?a=h:a!==h&&(a=h="float"):s===">>"||s==="<<"?(a=o,h=e.changeComponentType(h,"uint")):s==="%"?(a=o,h=e.isInteger(a)&&e.isInteger(h)?h:a):e.isMatrix(a)?h==="float"?h="float":e.isVector(h)?h=e.getVectorFromMatrix(a):e.isMatrix(h)||(a=h=o):e.isMatrix(h)?a==="float"?a="float":e.isVector(a)?a=e.getVectorFromMatrix(h):a=h=o:a=h=o):a=h=o;const c=n.build(e,a),l=r?r.build(e,h):null,u=e.getFunctionOperator(s);if(t!=="void"){const p=e.renderer.coordinateSystem===2e3;if(s==="=="||s==="!="||s==="<"||s===">"||s==="<="||s===">=")return p?e.isVector(a)?e.format(`${this.getOperatorMethod(e,t)}( ${c}, ${l} )`,o,t):e.format(`( ${c} ${s} ${l} )`,o,t):e.format(`( ${c} ${s} ${l} )`,o,t);if(s==="%")return e.isInteger(h)?e.format(`( ${c} % ${l} )`,o,t):e.format(`${this.getOperatorMethod(e,o)}( ${c}, ${l} )`,o,t);if(s==="!")return p&&e.isVector(a)?e.format(`not( ${c} )`,t):e.format(`( ${s} ${c} )`,a,t);if(s==="~")return e.format(`( ${s} ${c} )`,a,t);if(u)return e.format(`${u}( ${c}, ${l} )`,o,t);if(e.isMatrix(a)&&h==="float")return e.format(`( ${l} ${s} ${c} )`,o,t);if(a==="float"&&e.isMatrix(h))return e.format(`${c} ${s} ${l}`,o,t);{let d=`( ${c} ${s} ${l} )`;return!p&&o==="bool"&&e.isVector(a)&&e.isVector(h)&&(d=`all${d}`),e.format(d,o,t)}}else if(a!=="void")return u?e.format(`${u}( ${c}, ${l} )`,o,t):e.isMatrix(a)&&h==="float"?e.format(`${l} ${s} ${c}`,o,t):e.format(`${c} ${s} ${l}`,o,t)}serialize(e){super.serialize(e),e.op=this.op}deserialize(e){super.deserialize(e),this.op=e.op}}const Qo=w(H,"+").setParameterLength(2,1/0).setName("add"),nn=w(H,"-").setParameterLength(2,1/0).setName("sub"),Ye=w(H,"*").setParameterLength(2,1/0).setName("mul"),Ar=w(H,"/").setParameterLength(2,1/0).setName("div"),Cr=w(H,"%").setParameterLength(2).setName("mod"),Ko=w(H,"==").setParameterLength(2).setName("equal"),ea=w(H,"!=").setParameterLength(2).setName("notEqual"),ta=w(H,"<").setParameterLength(2).setName("lessThan"),sa=w(H,">").setParameterLength(2).setName("greaterThan"),na=w(H,"<=").setParameterLength(2).setName("lessThanEqual"),ra=w(H,">=").setParameterLength(2).setName("greaterThanEqual"),ia=w(H,"&&").setParameterLength(2,1/0).setName("and"),oa=w(H,"||").setParameterLength(2,1/0).setName("or"),aa=w(H,"!").setParameterLength(1).setName("not"),ha=w(H,"^^").setParameterLength(2).setName("xor"),ca=w(H,"&").setParameterLength(2).setName("bitAnd"),la=w(H,"~").setParameterLength(1).setName("bitNot"),ua=w(H,"|").setParameterLength(2).setName("bitOr"),da=w(H,"^").setParameterLength(2).setName("bitXor"),pa=w(H,"<<").setParameterLength(2).setName("shiftLeft"),fa=w(H,">>").setParameterLength(2).setName("shiftRight"),ma=E(([i])=>(i.addAssign(1),i)),ga=E(([i])=>(i.subAssign(1),i)),ya=E(([i])=>{const e=Lt(i).toConst();return i.addAssign(1),e}),xa=E(([i])=>{const e=Lt(i).toConst();return i.subAssign(1),e});y("add",Qo),y("sub",nn),y("mul",Ye),y("div",Ar),y("mod",Cr),y("equal",Ko),y("notEqual",ea),y("lessThan",ta),y("greaterThan",sa),y("lessThanEqual",na),y("greaterThanEqual",ra),y("and",ia),y("or",oa),y("not",aa),y("xor",ha),y("bitAnd",ca),y("bitNot",la),y("bitOr",ua),y("bitXor",da),y("shiftLeft",pa),y("shiftRight",fa),y("incrementBefore",ma),y("decrementBefore",ga),y("increment",ya),y("decrement",xa);class m extends te{static get type(){return"MathNode"}constructor(e,t,s=null,n=null){if(super(),(e===m.MAX||e===m.MIN)&&arguments.length>3){let r=new m(e,t,s);for(let o=3;o<arguments.length-1;o++)r=new m(e,r,arguments[o]);t=r,s=arguments[arguments.length-1],n=null}this.method=e,this.aNode=t,this.bNode=s,this.cNode=n,this.isMathNode=!0}getInputType(e){const t=this.aNode.getNodeType(e),s=this.bNode?this.bNode.getNodeType(e):null,n=this.cNode?this.cNode.getNodeType(e):null,r=e.isMatrix(t)?0:e.getTypeLength(t),o=e.isMatrix(s)?0:e.getTypeLength(s),a=e.isMatrix(n)?0:e.getTypeLength(n);return r>o&&r>a?t:o>a?s:a>r?n:t}generateNodeType(e){const t=this.method;return t===m.LENGTH||t===m.DISTANCE||t===m.DOT?"float":t===m.CROSS?"vec3":t===m.ALL||t===m.ANY?"bool":t===m.EQUALS?e.changeComponentType(this.aNode.getNodeType(e),"bool"):this.getInputType(e)}setup(e){const{aNode:t,bNode:s,method:n}=this;let r=null;if(n===m.ONE_MINUS)r=nn(1,t);else if(n===m.RECIPROCAL)r=Ar(1,t);else if(n===m.DIFFERENCE)r=an(nn(t,s));else if(n===m.TRANSFORM_DIRECTION){let o,a;e.isMatrix(t.getNodeType(e))?(o=t,a=s):(o=s,a=t),r=hs(Ye(o,k(R(a),0)).xyz)}return r!==null?r:super.setup(e)}generate(e,t){if(e.getNodeProperties(this).outputNode)return super.generate(e,t);let n=this.method;const r=this.getNodeType(e),o=this.getInputType(e),a=this.aNode,h=this.bNode,c=this.cNode,l=e.renderer.coordinateSystem;if(n===m.NEGATE)return e.format("( - "+a.build(e,o)+" )",r,t);{const u=[];return n===m.CROSS?u.push(a.build(e,r),h.build(e,r)):l===2e3&&n===m.STEP?u.push(a.build(e,e.getTypeLength(a.getNodeType(e))===1?"float":o),h.build(e,o)):l===2e3&&(n===m.MIN||n===m.MAX)?u.push(a.build(e,o),h.build(e,e.getTypeLength(h.getNodeType(e))===1?"float":o)):n===m.REFRACT?u.push(a.build(e,o),h.build(e,o),c.build(e,"float")):n===m.MIX?u.push(a.build(e,o),h.build(e,o),c.build(e,e.getTypeLength(c.getNodeType(e))===1?"float":o)):(l===2001&&n===m.ATAN&&h!==null&&(n="atan2"),e.shaderStage!=="fragment"&&(n===m.DFDX||n===m.DFDY)&&(L(`TSL: \'${n}\' is not supported in the ${e.shaderStage} stage.`,this.stackTrace),n="/*"+n+"*/"),u.push(a.build(e,o)),h!==null&&u.push(h.build(e,o)),c!==null&&u.push(c.build(e,o))),e.format(`${e.getMethod(n,r)}( ${u.join(", ")} )`,r,t)}}serialize(e){super.serialize(e),e.method=this.method}deserialize(e){super.deserialize(e),this.method=e.method}}m.ALL="all",m.ANY="any",m.RADIANS="radians",m.DEGREES="degrees",m.EXP="exp",m.EXP2="exp2",m.LOG="log",m.LOG2="log2",m.SQRT="sqrt",m.INVERSE_SQRT="inversesqrt",m.FLOOR="floor",m.CEIL="ceil",m.NORMALIZE="normalize",m.FRACT="fract",m.SIN="sin",m.SINH="sinh",m.COS="cos",m.COSH="cosh",m.TAN="tan",m.TANH="tanh",m.ASIN="asin",m.ASINH="asinh",m.ACOS="acos",m.ACOSH="acosh",m.ATAN="atan",m.ATANH="atanh",m.ABS="abs",m.SIGN="sign",m.LENGTH="length",m.NEGATE="negate",m.ONE_MINUS="oneMinus",m.DFDX="dFdx",m.DFDY="dFdy",m.ROUND="round",m.RECIPROCAL="reciprocal",m.TRUNC="trunc",m.FWIDTH="fwidth",m.TRANSPOSE="transpose",m.DETERMINANT="determinant",m.INVERSE="inverse",m.EQUALS="equals",m.MIN="min",m.MAX="max",m.STEP="step",m.REFLECT="reflect",m.DISTANCE="distance",m.DIFFERENCE="difference",m.DOT="dot",m.CROSS="cross",m.POW="pow",m.TRANSFORM_DIRECTION="transformDirection",m.MIX="mix",m.CLAMP="clamp",m.REFRACT="refract",m.SMOOTHSTEP="smoothstep",m.FACEFORWARD="faceforward";const Na=P(Math.PI),Ta=w(m,m.ALL).setParameterLength(1),wa=w(m,m.ANY).setParameterLength(1),Sa=w(m,m.RADIANS).setParameterLength(1),Ma=w(m,m.DEGREES).setParameterLength(1),_a=w(m,m.EXP).setParameterLength(1),Ea=w(m,m.EXP2).setParameterLength(1),Aa=w(m,m.LOG).setParameterLength(1),Ca=w(m,m.LOG2).setParameterLength(1),rn=w(m,m.SQRT).setParameterLength(1),va=w(m,m.INVERSE_SQRT).setParameterLength(1),ba=w(m,m.FLOOR).setParameterLength(1),za=w(m,m.CEIL).setParameterLength(1),hs=w(m,m.NORMALIZE).setParameterLength(1),cs=w(m,m.FRACT).setParameterLength(1),on=w(m,m.SIN).setParameterLength(1),Fa=w(m,m.SINH).setParameterLength(1),vr=w(m,m.COS).setParameterLength(1),Ra=w(m,m.COSH).setParameterLength(1),Ia=w(m,m.TAN).setParameterLength(1),La=w(m,m.TANH).setParameterLength(1),Oa=w(m,m.ASIN).setParameterLength(1),Pa=w(m,m.ASINH).setParameterLength(1),Ba=w(m,m.ACOS).setParameterLength(1),Da=w(m,m.ACOSH).setParameterLength(1),Ua=w(m,m.ATAN).setParameterLength(1,2),Va=w(m,m.ATANH).setParameterLength(1),an=w(m,m.ABS).setParameterLength(1),br=w(m,m.SIGN).setParameterLength(1),ka=w(m,m.LENGTH).setParameterLength(1),zr=w(m,m.NEGATE).setParameterLength(1),Ga=w(m,m.ONE_MINUS).setParameterLength(1),$a=w(m,m.DFDX).setParameterLength(1),Wa=w(m,m.DFDY).setParameterLength(1),Ha=w(m,m.ROUND).setParameterLength(1),qa=w(m,m.RECIPROCAL).setParameterLength(1),Ya=w(m,m.TRUNC).setParameterLength(1),Xa=w(m,m.FWIDTH).setParameterLength(1),Za=w(m,m.TRANSPOSE).setParameterLength(1),ja=w(m,m.DETERMINANT).setParameterLength(1),Ja=w(m,m.INVERSE).setParameterLength(1),Qa=w(m,m.MIN).setParameterLength(2,1/0),Ka=w(m,m.MAX).setParameterLength(2,1/0),hn=w(m,m.STEP).setParameterLength(2),eh=w(m,m.REFLECT).setParameterLength(2),th=w(m,m.DISTANCE).setParameterLength(2),sh=w(m,m.DIFFERENCE).setParameterLength(2),Pt=w(m,m.DOT).setParameterLength(2),nh=w(m,m.CROSS).setParameterLength(2),Fr=w(m,m.POW).setParameterLength(2),rh=i=>Ye(i,i),ih=i=>Ye(i,i,i),oh=i=>Ye(i,i,i,i),ah=w(m,m.TRANSFORM_DIRECTION).setParameterLength(2),hh=(i,e)=>hs(Ye(e,k(R(i),0)).xyz),ch=(i,e)=>hs(k(R(i),0).mul(e).xyz),lh=i=>Ye(br(i),Fr(an(i),1/3)),Rr=i=>Pt(i,i),Xe=w(m,m.MIX).setParameterLength(3),Ir=(i,e=0,t=1)=>new m(m.CLAMP,M(i),M(e),M(t)),Lr=i=>Ir(i),uh=w(m,m.REFRACT).setParameterLength(3),st=w(m,m.SMOOTHSTEP).setParameterLength(3),dh=w(m,m.FACEFORWARD).setParameterLength(3),ph=E(([i])=>{const s=43758.5453,n=Pt(i.xy,Be(12.9898,78.233)),r=Cr(n,Na);return cs(on(r).mul(s))}),fh=(i,e,t)=>Xe(e,t,i),mh=(i,e,t)=>st(e,t,i),gh=(i,e)=>hn(e,i);y("all",Ta),y("any",wa),y("radians",Sa),y("degrees",Ma),y("exp",_a),y("exp2",Ea),y("log",Aa),y("log2",Ca),y("sqrt",rn),y("inverseSqrt",va),y("floor",ba),y("ceil",za),y("normalize",hs),y("fract",cs),y("sin",on),y("sinh",Fa),y("cos",vr),y("cosh",Ra),y("tan",Ia),y("tanh",La),y("asin",Oa),y("asinh",Pa),y("acos",Ba),y("acosh",Da),y("atan",Ua),y("atanh",Va),y("abs",an),y("sign",br),y("length",ka),y("lengthSq",Rr),y("negate",zr),y("oneMinus",Ga),y("dFdx",$a),y("dFdy",Wa),y("round",Ha),y("reciprocal",qa),y("trunc",Ya),y("fwidth",Xa),y("min",Qa),y("max",Ka),y("step",gh),y("reflect",eh),y("distance",th),y("dot",Pt),y("cross",nh),y("pow",Fr),y("pow2",rh),y("pow3",ih),y("pow4",oh),y("transformDirection",ah),y("transformNormalByViewMatrix",hh),y("transformNormalByInverseViewMatrix",ch),y("mix",fh),y("clamp",Ir),y("refract",uh),y("smoothstep",mh),y("faceForward",dh),y("difference",sh),y("saturate",Lr),y("cbrt",lh),y("transpose",Za),y("determinant",ja),y("inverse",Ja),y("rand",ph);class yh extends C{static get type(){return"ConditionalNode"}constructor(e,t,s=null){super(),this.condNode=e,this.ifNode=t,this.elseNode=s}generateNodeType(e){const{ifNode:t,elseNode:s}=e.getNodeProperties(this);if(t===void 0)return e.flowBuildStage(this,"setup"),this.getNodeType(e);const n=t.getNodeType(e);if(s!==null){const r=s.getNodeType(e);if(e.getTypeLength(r)>e.getTypeLength(n))return r}return n}setup(e){const t=this.condNode,s=this.ifNode.isolate(),n=this.elseNode?this.elseNode.isolate():null,r=e.context.nodeBlock;e.getDataFromNode(s).parentNodeBlock=r,n!==null&&(e.getDataFromNode(n).parentNodeBlock=r);const o=e.context.uniformFlow,a=e.getNodeProperties(this);a.condNode=t,a.ifNode=o?s:s.context({nodeBlock:s}),a.elseNode=n?o?n:n.context({nodeBlock:n}):null}generate(e,t){const s=this.getNodeType(e),n=e.getDataFromNode(this);if(n.nodeProperty!==void 0)return n.nodeProperty;const{condNode:r,ifNode:o,elseNode:a}=e.getNodeProperties(this),h=e.currentFunctionNode,c=t!=="void",l=c?tt(s).build(e):"";n.nodeProperty=l;const u=r.build(e,"bool");if(e.context.uniformFlow&&a!==null){const f=o.build(e,s),g=a.build(e,s),N=e.getTernary(u,f,g);return e.format(N,s,t)}e.addFlowCode(`\n${e.tab}if ( ${u} ) {\n\n`).addFlowTab();let d=o.build(e,s);if(d&&(c?d=l+" = "+d+";":(d="return "+d+";",h===null&&(L("TSL: Return statement used in an inline \'Fn()\'. Define a layout struct to allow return values.",this.stackTrace),d="// "+d))),e.removeFlowTab().addFlowCode(e.tab+"	"+d+`\n\n`+e.tab+"}"),a!==null){e.addFlowCode(` else {\n\n`).addFlowTab();let f=a.build(e,s);f&&(c?f=l+" = "+f+";":(f="return "+f+";",h===null&&(L("TSL: Return statement used in an inline \'Fn()\'. Define a layout struct to allow return values.",this.stackTrace),f="// "+f))),e.removeFlowTab().addFlowCode(e.tab+"	"+f+`\n\n`+e.tab+`}\n\n`)}else e.addFlowCode(`\n\n`);return e.format(l,s,t)}}const cn=K(yh).setParameterLength(2,3);y("select",cn);class Or extends C{static get type(){return"ContextNode"}constructor(e=null,t={}){super(),this.isContextNode=!0,this.node=e,this.value=t}getScope(){return this.node.getScope()}generateNodeType(e){return this.node.getNodeType(e)}getFlowContextData(){const e=[];return this.traverse(t=>{t.isContextNode===!0&&e.push(t.value)}),Object.assign({},...e)}getMemberType(e,t){return this.node.getMemberType(e,t)}analyze(e){const t=e.addContext(this.value);this.node.build(e),e.setContext(t)}setup(e){const t=e.addContext(this.value);this.node.build(e),e.setContext(t)}generate(e,t){const s=e.addContext(this.value),n=this.node.build(e,t);return e.setContext(s),n}}const Nt=(i=null,e={})=>{let t=i;return(t===null||t.isNode!==!0)&&(e=t||e,t=null),new Or(t,e)},xh=i=>Nt(i,{uniformFlow:!0}),Pr=(i,e)=>Nt(i,{nodeName:e});function Nh(i,e,t=null){return Nt(t,{getShadow:({light:s,shadowColorNode:n})=>e===s?n.mul(i):n})}function Th(i,e=null){return Nt(e,{getAO:(t,{material:s})=>s.transparent===!0?t:t!==null?t.mul(i):i})}function wh(i,e){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\'),Pr(i,e)}y("context",Nt),y("label",wh),y("uniformFlow",xh),y("setName",Pr),y("builtinShadowContext",(i,e,t)=>Nh(e,t,i)),y("builtinAOContext",(i,e)=>Th(e,i));class Sh extends C{static get type(){return"VarNode"}constructor(e,t=null,s=!1){super(),this.node=e,this.name=t,this.global=!0,this.isVarNode=!0,this.readOnly=s,this.parents=!0,this.intent=!1}setIntent(e){return this.intent=e,this}isIntent(e){return e.getDataFromNode(this).forceDeclaration===!0?!1:this.intent}getIntent(){return this.intent}getMemberType(e,t){return this.node.getMemberType(e,t)}getElementType(e){return this.node.getElementType(e)}generateNodeType(e){return this.node.getNodeType(e)}getArrayCount(e){return this.node.getArrayCount(e)}isAssign(e){return e.getDataFromNode(this).assign}build(...e){const t=e[0],s=this.getShared(t);if(this!==s)return s.build(...e);if(this._hasStack(t)===!1&&t.buildStage==="setup"&&(t.context.nodeLoop||t.context.nodeBlock)){let n=!1;if(this.node.isShaderCallNodeInternal&&this.node.shaderNode.getLayout()===null&&t.fnCall&&t.fnCall.shaderNode&&t.getDataFromNode(this.node.shaderNode).hasLoop){const a=t.getDataFromNode(this);a.forceDeclaration=!0,n=!0}const r=t.getBaseStack();n?r.addToStackBefore(this):r.addToStack(this)}return this.isIntent(t)&&this.isAssign(t)!==!0?this.node.build(...e):super.build(...e)}generate(e){const{node:t,name:s,readOnly:n}=this,{renderer:r}=e,o=r.backend.isWebGPUBackend===!0;let a=!1,h=!1;n&&(a=e.isDeterministic(t),h=o?n:a);const c=this.getNodeType(e);if(c=="void")return this.isIntent(e)!==!0&&q(\'TSL: ".toVar()" can not be used with void type.\',this.stackTrace),t.build(e);const l=e.getVectorType(c),u=t.build(e,l),p=e.getVarFromNode(this,s,l,void 0,h),d=e.getPropertyName(p);let f=d;if(h)if(o)f=a?`const ${d}`:`let ${d}`;else{const g=t.getArrayCount(e);f=`const ${e.getVar(p.type,d,g)}`}return e.addLineFlowCode(`${f} = ${u}`,this),d}_hasStack(e){return e.getDataFromNode(this).stack!==void 0}}const ln=K(Sh),Mh=(i,e=null)=>ln(i,e).toStack(),_h=(i,e=null)=>ln(i,e,!0).toStack(),Eh=i=>ln(i).setIntent(!0).toStack();y("toVar",Mh),y("toConst",_h),y("toVarIntent",Eh);class Ah extends C{static get type(){return"SubBuild"}constructor(e,t,s=null){super(s),this.node=e,this.name=t,this.isSubBuildNode=!0}generateNodeType(e){if(this.nodeType!==null)return this.nodeType;e.addSubBuild(this.name);const t=this.node.getNodeType(e);return e.removeSubBuild(),t}build(e,...t){e.addSubBuild(this.name);const s=this.node.build(e,...t);return e.removeSubBuild(),s}}const Br=(i,e,t=null)=>new Ah(M(i),e,t);class Ch extends C{static get type(){return"VaryingNode"}constructor(e,t=null){super(),this.node=Br(e,"VERTEX"),this.name=t,this.isVaryingNode=!0,this.interpolationType=null,this.interpolationSampling=null,this.global=!0}setInterpolation(e,t=null){return this.interpolationType=e,this.interpolationSampling=t,this}getHash(e){return this.name||super.getHash(e)}generateNodeType(e){return this.node.getNodeType(e)}setupVarying(e){const t=e.getNodeProperties(this);let s=t.varying;if(s===void 0){const n=this.name,r=this.getNodeType(e),o=this.interpolationType,a=this.interpolationSampling;t.varying=s=e.getVaryingFromNode(this,n,r,o,a),t.node=Br(this.node,"VERTEX")}return s.needsInterpolation||(s.needsInterpolation=e.shaderStage==="fragment"),s}setup(e){this.setupVarying(e),e.flowNodeFromShaderStage(zt.VERTEX,this.node)}analyze(e){this.setupVarying(e),e.flowNodeFromShaderStage(zt.VERTEX,this.node)}generate(e){const t=e.getSubBuildProperty("property",e.currentStack),s=e.getNodeProperties(this),n=this.setupVarying(e);if(s[t]===void 0){const r=this.getNodeType(e),o=e.getPropertyName(n,zt.VERTEX);if(e.shaderStage===zt.VERTEX){const a=s.node.build(e,r);e.addLineFlowCode(`${o} = ${a}`,this)}else e.flowNodeFromShaderStage(zt.VERTEX,s.node,r,o);s[t]=o}return e.getPropertyName(n)}}const Bt=K(Ch).setParameterLength(1,2),vh=i=>Bt(i);y("toVarying",Bt),y("toVertexStage",vh);const bh=E(([i])=>{const e=i.mul(.9478672986).add(.0521327014).pow(2.4),t=i.mul(.0773993808),s=i.lessThanEqual(.04045);return Xe(e,t,s)}).setLayout({name:"sRGBTransferEOTF",type:"vec3",inputs:[{name:"color",type:"vec3"}]}),zh=E(([i])=>{const e=i.pow(.41666).mul(1.055).sub(.055),t=i.mul(12.92),s=i.lessThanEqual(.0031308);return Xe(e,t,s)}).setLayout({name:"sRGBTransferOETF",type:"vec3",inputs:[{name:"color",type:"vec3"}]}),un="WorkingColorSpace",Fh="OutputColorSpace";class Dr extends te{static get type(){return"ColorSpaceNode"}constructor(e,t,s){super("vec4"),this.colorNode=e,this.source=t,this.target=s}resolveColorSpace(e,t){return t===un?Q.workingColorSpace:t===Fh?e.context.outputColorSpace||e.renderer.outputColorSpace:t}setup(e){const{colorNode:t}=this,s=this.resolveColorSpace(e,this.source),n=this.resolveColorSpace(e,this.target);let r=t;return Q.enabled===!1||s===n||!s||!n||(Q.getTransfer(s)===Mt&&(r=k(bh(r.rgb),r.a)),Q.getPrimaries(s)!==Q.getPrimaries(n)&&(r=k(et(Q._getMatrix(new Ce,s,n)).mul(r.rgb),r.a)),Q.getTransfer(n)===Mt&&(r=k(zh(r.rgb),r.a))),r}}const Rh=(i,e)=>new Dr(M(i),un,e),Ur=(i,e)=>new Dr(M(i),e,un);y("workingToColorSpace",Rh),y("colorSpaceToWorking",Ur);let Ih=class extends Rt{static get type(){return"ReferenceElementNode"}constructor(e,t){super(e,t),this.referenceNode=e,this.isReferenceElementNode=!0}generateNodeType(){return this.referenceNode.uniformType}generate(e){const t=super.generate(e),s=this.referenceNode.getNodeType(),n=this.getNodeType();return e.format(t,s,n)}};class Lh extends C{static get type(){return"ReferenceBaseNode"}constructor(e,t,s=null,n=null){super(),this.property=e,this.uniformType=t,this.object=s,this.count=n,this.properties=e.split("."),this.reference=s,this.node=null,this.group=null,this.updateType=D.OBJECT}setGroup(e){return this.group=e,this}element(e){return new Ih(this,M(e))}setNodeType(e){const t=Z(null,e);this.group!==null&&t.setGroup(this.group),this.node=t}generateNodeType(e){return this.node===null&&(this.updateReference(e),this.updateValue()),this.node.getNodeType(e)}getValueFromReference(e=this.reference){const{properties:t}=this;let s=e[t[0]];for(let n=1;n<t.length;n++)s=s[t[n]];return s}updateReference(e){return this.reference=this.object!==null?this.object:e.object,this.reference}setup(){return this.updateValue(),this.node}update(){this.updateValue()}updateValue(){this.node===null&&this.setNodeType(this.uniformType);const e=this.getValueFromReference();Array.isArray(e)?this.node.array=e:this.node.value=e}}class Oh extends Lh{static get type(){return"RendererReferenceNode"}constructor(e,t,s=null){super(e,t,s),this.renderer=s,this.setGroup(oe)}updateReference(e){return this.reference=this.renderer!==null?this.renderer:e.renderer,this.reference}}const Ph=(i,e,t=null)=>new Oh(i,e,t);class Bh extends te{static get type(){return"ToneMappingNode"}constructor(e,t=Uh,s=null){super("vec3"),this._toneMapping=e,this.exposureNode=t,this.colorNode=s}customCacheKey(){return ir(this._toneMapping)}setToneMapping(e){return this._toneMapping=e,this}getToneMapping(){return this._toneMapping}setup(e){const t=this.colorNode||e.context.color,s=this._toneMapping;if(s===0)return t;let n=null;const r=e.renderer.library.getToneMappingFunction(s);return r!==null?n=k(r(t.rgb,this.exposureNode),t.a):(q("ToneMappingNode: Unsupported Tone Mapping configuration.",s),n=t),n}}const Dh=(i,e,t)=>new Bh(i,M(e),M(t)),Uh=Ph("toneMappingExposure","float");y("toneMapping",(i,e,t)=>Dh(e,t,i));const Vr=new WeakMap;function kr(i,e){let t=Vr.get(i);return t===void 0&&(t=new ro(i,e),Vr.set(i,t)),t}class Ze extends Ys{static get type(){return"BufferAttributeNode"}constructor(e,t=null,s=0,n=0){super(e,t),this.isBufferNode=!0,this.bufferType=t,this.bufferStride=s,this.bufferOffset=n,this.usage=35044,this.instanced=!1,this.attribute=null,this.global=!0,e&&e.isBufferAttribute===!0&&e.itemSize<=4&&(this.attribute=e,this.usage=e.usage,this.instanced=e.isInstancedBufferAttribute)}getHash(e){let t;if(this.bufferStride===0&&this.bufferOffset===0){let s=e.globalCache.getData(this.value);s===void 0&&(s={node:this},e.globalCache.setData(this.value,s)),t=s.node.id}else t=this.id;return String(t)}generateNodeType(e){return this.bufferType===null&&(this.bufferType=e.getTypeFromAttribute(this.attribute)),this.bufferType}setup(e){if(this.attribute!==null)return;const t=this.getNodeType(e),s=e.getTypeLength(t),n=this.value,r=this.bufferStride||s,o=this.bufferOffset;let a;n.isInterleavedBuffer===!0?a=n:n.isBufferAttribute===!0?a=kr(n.array,r):a=kr(n,r);const h=new ks(a,s,o);a.setUsage(this.usage),this.attribute=h,this.attribute.isInstancedBufferAttribute=this.instanced}generate(e){const t=this.getNodeType(e),s=e.context.nodeName;s!==void 0&&delete e.context.nodeName;const n=e.getBufferAttributeFromNode(this,t,s),r=e.getPropertyName(n);let o=null;if(e.shaderStage==="vertex"||e.shaderStage==="compute")this.name=r,o=r;else{let a;s&&(a=s+"Varying"),o=Bt(this,a).build(e,t)}return o}getInputType(){return"bufferAttribute"}setUsage(e){return this.usage=e,this.attribute&&this.attribute.isBufferAttribute===!0&&(this.attribute.usage=e),this}setInstanced(e){return this.instanced=e,this}}function Vh(i,e=null,t=0,s=0,n=35044,r=!1){return e==="mat3"||e===null&&i.itemSize===9?et(new Ze(i,"vec3",9,0).setUsage(n).setInstanced(r),new Ze(i,"vec3",9,3).setUsage(n).setInstanced(r),new Ze(i,"vec3",9,6).setUsage(n).setInstanced(r)):e==="mat4"||e===null&&i.itemSize===16?Tr(new Ze(i,"vec4",16,0).setUsage(n).setInstanced(r),new Ze(i,"vec4",16,4).setUsage(n).setInstanced(r),new Ze(i,"vec4",16,8).setUsage(n).setInstanced(r),new Ze(i,"vec4",16,12).setUsage(n).setInstanced(r)):new Ze(i,e,t,s).setUsage(n)}const kh=(i,e=null,t=0,s=0)=>Vh(i,e,t,s);y("toAttribute",i=>kh(i.value));class W extends C{static get type(){return"IndexNode"}constructor(e){super("uint"),this.scope=e,this.isIndexNode=!0}generate(e){const t=this.getNodeType(e),s=this.scope;let n;if(s===W.VERTEX)n=e.getVertexIndex();else if(s===W.INSTANCE)n=e.getInstanceIndex();else if(s===W.DRAW)n=e.getDrawIndex();else if(s===W.INVOCATION_LOCAL)n=e.getInvocationLocalIndex();else if(s===W.INVOCATION_SUBGROUP)n=e.getInvocationSubgroupIndex();else if(s===W.SUBGROUP)n=e.getSubgroupIndex();else throw new Error("THREE.IndexNode: Unknown scope: "+s);let r;return e.shaderStage==="vertex"||e.shaderStage==="compute"?r=n:r=Bt(this).build(e,t),r}}W.VERTEX="vertex",W.INSTANCE="instance",W.SUBGROUP="subgroup",W.INVOCATION_LOCAL="invocationLocal",W.INVOCATION_SUBGROUP="invocationSubgroup",W.DRAW="draw",W.VERTEX;const Gh=_(W,W.INSTANCE);W.SUBGROUP,W.INVOCATION_SUBGROUP,W.INVOCATION_LOCAL,W.DRAW;class $h extends C{static get type(){return"ComputeNode"}constructor(e,t){super("void"),this.isComputeNode=!0,this.computeNode=e,this.workgroupSize=t,this.count=null,this.dispatchSize=null,this.version=1,this.name="",this.updateBeforeType=D.OBJECT,this.onInitFunction=null,this.countNode=null}dispose(){this.dispatchEvent({type:"dispose"})}setName(e){return this.name=e,this}label(e){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\',new Ae),this.setName(e)}onInit(e){return this.onInitFunction=e,this}updateBefore({renderer:e}){e.compute(this)}setup(e){this.count!==null&&this.countNode===null&&(this.countNode=Z(this.count,"uint").onObjectUpdate(()=>this.count));const t=this.computeNode.build(e);if(t){const s=e.getNodeProperties(this);s.outputComputeNode=t.outputNode,t.outputNode=null}return t}generate(e,t){const{shaderStage:s}=e;if(s==="compute"){const n=this.computeNode.build(e,"void");if(n!==""&&e.addLineFlowCode(n,this),this.count!==null&&e.allowEarlyReturns===!0){const r=this.countNode.build(e,"uint"),o=Gh.build(e,"uint");e.flow.code=`${e.tab}if ( ${o} >= ${r} ) { return; }\n\n${e.flow.code}`}}else{const r=e.getNodeProperties(this).outputComputeNode;if(r)return r.build(e,t)}}}const Gr=(i,e=[64])=>{(e.length===0||e.length>3)&&q("TSL: compute() workgroupSize must have 1, 2, or 3 elements",new Ae);for(let t=0;t<e.length;t++){const s=e[t];(typeof s!="number"||s<=0||!Number.isInteger(s))&&q(`TSL: compute() workgroupSize element at index [ ${t} ] must be a positive integer`,new Ae)}for(;e.length<3;)e.push(1);return new $h(M(i),e)};y("compute",(i,e,t)=>{const s=Gr(i,t);return typeof e=="number"?s.count=e:s.dispatchSize=e,s}),y("computeKernel",Gr);class Wh extends C{static get type(){return"IsolateNode"}constructor(e,t=!0){super(),this.node=e,this.parent=t,this.isIsolateNode=!0}generateNodeType(e){const t=e.getCache(),s=e.getCacheFromNode(this,this.parent);e.setCache(s);const n=this.node.getNodeType(e);return e.setCache(t),n}build(e,...t){const s=e.getCache(),n=e.getCacheFromNode(this,this.parent);e.setCache(n);const r=this.node.build(e,...t);return e.setCache(s),r}setParent(e){return this.parent=e,this}getParent(){return this.parent}}const $r=i=>new Wh(M(i));function Hh(i,e=!0){return L(\'TSL: "cache()" has been deprecated. Use "isolate()" instead.\'),$r(i).setParent(e)}y("cache",Hh),y("isolate",$r);class qh extends C{static get type(){return"BypassNode"}constructor(e,t){super(),this.isBypassNode=!0,this.outputNode=e,this.callNode=t}generateNodeType(e){return this.outputNode.getNodeType(e)}generate(e){const t=this.callNode.build(e,"void");return t!==""&&e.addLineFlowCode(t,this),this.outputNode.build(e)}}y("bypass",K(qh).setParameterLength(2));const Wr=E(([i,e,t,s=P(0),n=P(1),r=en(!1)])=>{let o=i.sub(e).div(t.sub(e));return Lo(r)&&(o=o.clamp()),o.mul(n.sub(s)).add(s)});function Yh(i,e,t,s=P(0),n=P(1)){return Wr(i,e,t,s,n,!0)}y("remap",Wr),y("remapClamp",Yh);class Xh extends C{static get type(){return"ExpressionNode"}constructor(e="",t="void"){super(t),this.snippet=e}generate(e,t){const s=this.getNodeType(e),n=this.snippet;if(s==="void")e.addLineFlowCode(n,this);else return e.format(n,s,t)}}const De=K(Xh).setParameterLength(1,2);y("discard",i=>(i?cn(i,De("discard")):De("discard")).toStack());const Zh=E(([i])=>k(i.rgb.mul(i.a),i.a),{color:"vec4",return:"vec4"}),jh=E(([i])=>i.a.equal(0).select(k(0),k(i.rgb.div(i.a),i.a)),{color:"vec4",return:"vec4"});class Jh extends te{static get type(){return"RenderOutputNode"}constructor(e,t,s){super("vec4"),this.colorNode=e,this._toneMapping=t,this.outputColorSpace=s,this.isRenderOutputNode=!0}setToneMapping(e){return this._toneMapping=e,this}getToneMapping(){return this._toneMapping}setup({context:e}){let t=this.colorNode||e.color;t=k(t.rgb,t.a.clamp(0,1)),t=jh(t);const s=(this._toneMapping!==null?this._toneMapping:e.toneMapping)||0,n=(this.outputColorSpace!==null?this.outputColorSpace:e.outputColorSpace)||"";return s!==0&&(t=t.toneMapping(s)),n!==""&&n!==Q.workingColorSpace&&(t=t.workingToColorSpace(n)),t=Zh(t),t}}y("renderOutput",(i,e=null,t=null)=>new Jh(M(i),e,t));class Qh extends te{static get type(){return"DebugNode"}constructor(e,t=null){super(),this.node=e,this.callback=t}generateNodeType(e){return this.node.getNodeType(e)}setup(e){return this.node.build(e)}analyze(e){return this.node.build(e)}generate(e){const t=this.callback,s=this.node.build(e);if(t!==null)t(e,s);else{const n="--- TSL debug - "+e.shaderStage+" shader ---",r="-".repeat(n.length);let o="";o+="// #"+n+`#\n`,o+=e.flow.code.replace(/^\\t/mg,"")+`\n`,o+="/* ... */ "+s+` /* ... */\n`,o+="// #"+r+`#\n`,bs(o)}return s}}y("debug",(i,e=null)=>new Qh(M(i),e).toStack());class Kh extends ht{constructor(){super(),this._renderer=null,this.currentFrame=null}get nodeFrame(){return this._renderer._nodes.nodeFrame}setRenderer(e){return this._renderer=e,this}getRenderer(){return this._renderer}init(){}begin(){}finish(){}inspect(){}computeAsync(){}beginCompute(){}finishCompute(){}beginRender(){}finishRender(){}copyTextureToTexture(){}copyFramebufferToTexture(){}}class ec extends C{static get type(){return"InspectorNode"}constructor(e,t="",s=null){super(),this.node=e,this.name=t,this.callback=s,this.updateType=D.FRAME,this.isInspectorNode=!0}getName(){return this.name||this.node.name}update(e){e.renderer.inspector.inspect(this)}generateNodeType(e){return this.node.getNodeType(e)}setup(e){let t=this.node;return e.context.inspector===!0&&this.callback!==null&&(t=this.callback(t)),e.renderer.backend.isWebGPUBackend!==!0&&e.renderer.inspector.constructor!==Kh&&ke(\'TSL: ".toInspector()" is only available with WebGPU.\'),t}}function tc(i,e="",t=null){return i=M(i),i.before(new ec(i,e,t))}y("toInspector",tc);class sc extends C{static get type(){return"AttributeNode"}constructor(e,t=null){super(t),this.global=!0,this._attributeName=e}getHash(e){return this.getAttributeName(e)}generateNodeType(e){let t=this.nodeType;if(t===null){const s=this.getAttributeName(e);if(e.hasGeometryAttribute(s)){const n=e.geometry.getAttribute(s);t=e.getTypeFromAttribute(n)}else t="float"}return t}setAttributeName(e){return this._attributeName=e,this}getAttributeName(){return this._attributeName}generate(e){const t=this.getAttributeName(e),s=this.getNodeType(e);if(e.hasGeometryAttribute(t)===!0){const r=e.geometry.getAttribute(t),o=e.getTypeFromAttribute(r),a=e.getAttribute(t,o);return e.shaderStage==="vertex"?e.format(a.name,o,s):Bt(this).build(e,s)}else return L(`AttributeNode: Vertex attribute "${t}" not found on geometry.`),e.generateConst(s)}serialize(e){super.serialize(e),e.global=this.global,e._attributeName=this._attributeName}deserialize(e){super.deserialize(e),this.global=e.global,this._attributeName=e._attributeName}}const Ue=(i,e=null)=>new sc(i,e),Tt=(i=0)=>Ue("uv"+(i>0?i:""),"vec2");class nc extends C{static get type(){return"TextureSizeNode"}constructor(e,t=null){super("uvec2"),this.isTextureSizeNode=!0,this.textureNode=e,this.levelNode=t}generate(e,t){const s=this.textureNode.build(e,"property"),n=this.levelNode===null?"0":this.levelNode.build(e,"int");return e.format(`${e.getMethod("textureDimensions")}( ${s}, ${n} )`,this.getNodeType(e),t)}}const Hr=K(nc).setParameterLength(1,2);class rc extends Ot{static get type(){return"MaxMipLevelNode"}constructor(e){super(0),this._textureNode=e,this.updateType=D.FRAME}get textureNode(){return this._textureNode}get texture(){return this._textureNode.value}update(){const e=this.texture,t=e.images,s=t&&t.length>0?t[0]&&t[0].image||t[0]:e.image;if(s&&s.width!==void 0){const{width:n,height:r}=s;this.value=Math.log2(Math.max(n,r))}}}const ic=K(rc).setParameterLength(1);class oc extends Error{constructor(e,t=null){super(e),this.name="NodeError",this.stackTrace=t}}const qr=new ye;class ls extends Ot{static get type(){return"TextureNode"}constructor(e=qr,t=null,s=null,n=null){super(e),this.isTextureNode=!0,this.uvNode=t,this.levelNode=s,this.biasNode=n,this.compareNode=null,this.depthNode=null,this.gradNode=null,this.gatherNode=null,this.offsetNode=null,this.sampler=!0,this.updateMatrix=!1,this.updateType=D.NONE,this.referenceNode=null,this._value=e,this._matrixUniform=null,this._flipYUniform=null,this.setUpdateMatrix(t===null)}set value(e){this.referenceNode?this.referenceNode.value=e:this._value=e}get value(){return this.referenceNode?this.referenceNode.value:this._value}getUniformHash(){return this.value.uuid}generateNodeType(){return this.value.isDepthTexture===!0?this.gatherNode===null?"float":"vec4":this.value.type===1014?"uvec4":this.value.type===1013?"ivec4":"vec4"}getInputType(){return"texture"}getDefaultUV(){return Tt(this.value.channel)}updateReference(){return this.value}getTransformedUV(e){return this._matrixUniform===null&&(this._matrixUniform=Z(this.value.matrix)),this._matrixUniform.mul(R(e,1)).xy}setUpdateMatrix(e){return this.updateMatrix=e,this}setupUV(e,t){return e.isFlipY()&&(this._flipYUniform===null&&(this._flipYUniform=Z(!1)),t=t.toVar(),this.sampler?t=this._flipYUniform.select(t.flipY(),t):t=this._flipYUniform.select(t.setY(Lt(Hr(this,this.levelNode).y).sub(t.y).sub(1)),t)),t}setup(e){const t=e.getNodeProperties(this);t.referenceNode=this.referenceNode;const s=this.value;if(!s||s.isTexture!==!0)throw new oc("THREE.TSL: `texture( value )` function expects a valid instance of THREE.Texture().",this.stackTrace);const n=E(()=>{let h=this.uvNode;return(h===null||e.context.forceUVContext===!0)&&e.context.getUV&&(h=e.context.getUV(this,e)),h||(h=this.getDefaultUV()),this.updateMatrix===!0&&(h=this.getTransformedUV(h)),h=this.setupUV(e,h),this.updateType=this._matrixUniform!==null||this._flipYUniform!==null?D.OBJECT:D.NONE,h})();let r=this.levelNode;r===null&&e.context.getTextureLevel&&(r=e.context.getTextureLevel(this));let o=null,a=null;if(this.compareNode!==null)if(e.renderer.hasCompatibility(Ai.TEXTURE_COMPARE))o=this.compareNode;else{const h=s.compareFunction;h===null||h===513||h===515||h===516||h===518?a=this.compareNode:(o=this.compareNode,ke(\'TSL: Only "LessCompare", "LessEqualCompare", "GreaterCompare" and "GreaterEqualCompare" are supported for depth texture comparison fallback.\'))}t.uvNode=n,t.levelNode=r,t.biasNode=this.biasNode,t.compareNode=o,t.compareStepNode=a,t.gradNode=this.gradNode,t.gatherNode=this.gatherNode,t.depthNode=this.depthNode,t.offsetNode=this.offsetNode}generateUV(e,t){return t.build(e,this.sampler===!0?"vec2":"ivec2")}generateOffset(e,t){return t.build(e,"ivec2")}generateSnippet(e,t,s,n,r,o,a,h,c,l,u){const p=this.value;let d;return r?d=e.generateTextureBias(p,t,s,r,o,l):h?d=e.generateTextureGrad(p,t,s,h,o,l):c?a?d=e.generateTextureGatherCompare(p,t,s,a,o,l,u):d=e.generateTextureGather(p,t,s,c,o,l,u):a?d=e.generateTextureCompare(p,t,s,a,o,l):this.sampler===!1?d=e.generateTextureLoad(p,t,s,n,o,l):n?d=e.generateTextureLevel(p,t,s,n,o,l):d=e.generateTexture(p,t,s,o,l),d}generate(e,t){const s=this.value,n=e.getNodeProperties(this),r=super.generate(e,"property");if(/^sampler/.test(t))return r+"_sampler";if(e.isReference(t))return r;{const o=e.getDataFromNode(this);let a=this.getNodeType(e),h=o.propertyName;if(h===void 0){const{uvNode:l,levelNode:u,biasNode:p,compareNode:d,compareStepNode:f,depthNode:g,gradNode:N,gatherNode:T,offsetNode:A}=n,v=this.generateUV(e,l),z=u?u.build(e,"float"):null,b=p?p.build(e,"float"):null,F=g?g.build(e,"int"):null,I=d?d.build(e,"float"):null,X=f?f.build(e,"float"):null,ee=N?[N[0].build(e,"vec2"),N[1].build(e,"vec2")]:null,le=T?T.build(e,"int"):null,pe=A?this.generateOffset(e,A):null,ne=this._flipYUniform?this._flipYUniform.build(e,"bool"):null;le&&(a="vec4");let ae=F;ae===null&&s.isArrayTexture&&this.isTexture3DNode!==!0&&(ae="0");const Ve=e.getVarFromNode(this);h=e.getPropertyName(Ve);let V=this.generateSnippet(e,r,v,z,b,ae,I,ee,le,pe,ne);if(X!==null){const at=s.compareFunction;at===516||at===518?V=hn(De(V,a),De(X,"float")).build(e,a):V=hn(De(X,"float"),De(V,a)).build(e,a)}e.addLineFlowCode(`${h} = ${V}`,this),o.snippet=V,o.propertyName=h}let c=h;return e.needsToWorkingColorSpace(s)&&(c=Ur(De(c,a),s.colorSpace).setup(e).build(e,a)),e.format(c,a,t)}}setSampler(e){return this.sampler=e,this}getSampler(){return this.sampler}sample(e){const t=this.clone();return t.uvNode=M(e),t.referenceNode=this.getBase(),M(t)}load(e){return this.sample(e).setSampler(!1)}blur(e){const t=this.clone();t.biasNode=M(e).mul(ic(t)),t.referenceNode=this.getBase();const s=t.value;return t.generateMipmaps===!1&&(s&&s.generateMipmaps===!1||s.minFilter===1003||s.magFilter===1003)&&(L("TSL: texture().blur() requires mipmaps and sampling. Use .generateMipmaps=true and .minFilter/.magFilter=THREE.LinearFilter in the Texture."),t.biasNode=null),M(t)}level(e){const t=this.clone();return t.levelNode=M(e),t.referenceNode=this.getBase(),M(t)}size(e){return Hr(this,e)}bias(e){const t=this.clone();return t.biasNode=M(e),t.referenceNode=this.getBase(),M(t)}getBase(){return this.referenceNode?this.referenceNode.getBase():this}compare(e){const t=this.clone();return t.compareNode=M(e),t.referenceNode=this.getBase(),M(t)}grad(e,t){const s=this.clone();return s.gradNode=[M(e),M(t)],s.referenceNode=this.getBase(),M(s)}gather(e=0){const t=this.clone();return t.gatherNode=M(e),t.referenceNode=this.getBase(),M(t)}depth(e){const t=this.clone();return t.depthNode=M(e),t.referenceNode=this.getBase(),M(t)}offset(e){const t=this.clone();return t.offsetNode=M(e),t.referenceNode=this.getBase(),M(t)}serialize(e){super.serialize(e),e.value=this.value.toJSON(e.meta).uuid,e.sampler=this.sampler,e.updateMatrix=this.updateMatrix,e.updateType=this.updateType}deserialize(e){super.deserialize(e),this.value=e.meta.textures[e.value],this.sampler=e.sampler,this.updateMatrix=e.updateMatrix,this.updateType=e.updateType}update(){const e=this.value,t=this._matrixUniform;t!==null&&(t.value=e.matrix),e.matrixAutoUpdate===!0&&e.updateMatrix();const s=this._flipYUniform;s!==null&&(s.value=e.image instanceof ImageBitmap&&e.flipY===!0||e.isRenderTargetTexture===!0||e.isFramebufferTexture===!0||e.isDepthTexture===!0)}clone(){const e=new this.constructor(this.value,this.uvNode,this.levelNode,this.biasNode);return e.sampler=this.sampler,e.depthNode=this.depthNode,e.compareNode=this.compareNode,e.gradNode=this.gradNode,e.gatherNode=this.gatherNode,e.offsetNode=this.offsetNode,e}}const ac=K(ls).setParameterLength(1,4).setName("texture"),hc=(i=qr,e=null,t=null,s=null)=>{let n;return i&&i.isTextureNode===!0?(n=M(i.clone()),n.referenceNode=i.getBase(),e!==null&&(n.uvNode=M(e)),t!==null&&(n.levelNode=M(t)),s!==null&&(n.biasNode=M(s))):n=ac(i,e,t,s),n};class Yr extends Ot{static get type(){return"BufferNode"}constructor(e,t,s=0){super(e,t),this.isBufferNode=!0,this.bufferType=t,this.bufferCount=s,this.updateRanges=[]}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}getElementType(e){return this.getNodeType(e)}getInputType(){return"buffer"}}const cc=(i,e,t)=>new Yr(i,e,t);class lc extends Rt{static get type(){return"UniformArrayElementNode"}constructor(e,t){super(e,t),this.isArrayBufferElementNode=!0}generate(e){const t=super.generate(e),s=this.getNodeType(e),n=this.node.getPaddedType();return e.format(t,n,s)}}class uc extends Yr{static get type(){return"UniformArrayNode"}constructor(e,t=null){super(null),this.array=e,this.elementType=t===null?ss(e[0]):t,this.paddedType=this.getPaddedType(),this.updateType=D.RENDER,this.isArrayBufferNode=!0}generateNodeType(){return this.paddedType}getElementType(){return this.elementType}getPaddedType(){const e=this.elementType;let t="vec4";return e==="mat2"?t="mat2":/mat/.test(e)===!0?t="mat4":e.charAt(0)==="i"?t="ivec4":e.charAt(0)==="u"&&(t="uvec4"),t}update(){const{array:e,value:t}=this,s=this.elementType;if(s==="float"||s==="int"||s==="uint")for(let n=0;n<e.length;n++){const r=n*4;t[r]=e[n]}else if(s==="color")for(let n=0;n<e.length;n++){const r=n*4,o=e[n];t[r]=o.r,t[r+1]=o.g,t[r+2]=o.b||0}else if(s==="mat2")for(let n=0;n<e.length;n++){const r=n*4,o=e[n];t[r]=o.elements[0],t[r+1]=o.elements[1],t[r+2]=o.elements[2],t[r+3]=o.elements[3]}else if(s==="mat3")for(let n=0;n<e.length;n++){const r=n*16,o=e[n];t[r]=o.elements[0],t[r+1]=o.elements[1],t[r+2]=o.elements[2],t[r+4]=o.elements[3],t[r+5]=o.elements[4],t[r+6]=o.elements[5],t[r+8]=o.elements[6],t[r+9]=o.elements[7],t[r+10]=o.elements[8],t[r+15]=1}else if(s==="mat4")for(let n=0;n<e.length;n++){const r=n*16,o=e[n];for(let a=0;a<o.elements.length;a++)t[r+a]=o.elements[a]}else for(let n=0;n<e.length;n++){const r=n*4,o=e[n];t[r]=o.x,t[r+1]=o.y,t[r+2]=o.z||0,t[r+3]=o.w||0}}setup(e){const t=this.array.length,s=this.elementType;let n=Float32Array;const r=this.paddedType,o=e.getTypeLength(r);return s.charAt(0)==="i"&&(n=Int32Array),s.charAt(0)==="u"&&(n=Uint32Array),this.value=new n(t*o),this.bufferCount=t,this.bufferType=r,this.update(),super.setup(e)}element(e){return new lc(this,M(e))}}const Re=(i,e)=>new uc(i,e);class dc extends C{constructor(e){super("float"),this.name=e,this.isBuiltinNode=!0}generate(){return this.name}}const Dt=K(dc).setParameterLength(1);let Ut,Vt;class G extends C{static get type(){return"ScreenNode"}constructor(e){super(),this.scope=e,this._output=null,this.isViewportNode=!0}generateNodeType(){return this.scope===G.DPR?"float":this.scope===G.VIEWPORT?"vec4":"vec2"}getUpdateType(){let e=D.NONE;return(this.scope===G.SIZE||this.scope===G.VIEWPORT||this.scope===G.DPR)&&(e=D.RENDER),this.updateType=e,e}update({renderer:e}){const t=e.getRenderTarget();this.scope===G.VIEWPORT?t!==null?Vt.copy(t.viewport):(e.getViewport(Vt),Vt.multiplyScalar(e.getPixelRatio())):this.scope===G.DPR?this._output.value=e.getPixelRatio():t!==null?(Ut.width=t.width,Ut.height=t.height):e.getDrawingBufferSize(Ut)}setup(){const e=this.scope;let t=null;return e===G.SIZE?t=Z(Ut||(Ut=new Me)):e===G.VIEWPORT?t=Z(Vt||(Vt=new Ge)):e===G.DPR?t=Z(1):t=Be(Zr.div(Xr)),this._output=t,t}generate(e){if(this.scope===G.COORDINATE){let t=e.getFragCoord();if(e.isFlipY()){const s=e.getNodeProperties(Xr).outputNode.build(e);t=`${e.getType("vec2")}( ${t}.x, ${s}.y - ${t}.y )`}return t}return super.generate(e)}}G.COORDINATE="coordinate",G.VIEWPORT="viewport",G.SIZE="size",G.UV="uv",G.DPR="dpr";const pc=_(G,G.DPR),dn=_(G,G.UV),Xr=_(G,G.SIZE),Zr=_(G,G.COORDINATE),kt=_(G,G.VIEWPORT);kt.zw,kt.xy;let pn=null,us=null,fn=null,ds=null,mn=null,ps=null,gn=null,fs=null;const ms=Z(0,"uint").setName("u_cameraIndex").setGroup(sn("cameraIndex")).toVarying("v_cameraIndex"),Gt=Z("float").setName("cameraNear").setGroup(oe).onRenderUpdate(({camera:i})=>i.near),$t=Z("float").setName("cameraFar").setGroup(oe).onRenderUpdate(({camera:i})=>i.far),wt=E(({camera:i})=>{let e;if(i.isArrayCamera&&i.cameras.length>0){const t=[];for(const s of i.cameras)t.push(s.projectionMatrix);us===null?us=Re(t).setGroup(oe).setName("cameraProjectionMatrices"):us.array=t,e=us.element(i.isMultiViewCamera?Dt("gl_ViewID_OVR"):ms)}else pn===null&&(pn=Z(i.projectionMatrix).setName("cameraProjectionMatrix").setGroup(oe).onRenderUpdate(({camera:t})=>t.projectionMatrix)),e=pn;return e}).once()(),fc=E(({camera:i})=>{let e;if(i.isArrayCamera&&i.cameras.length>0){const t=[];for(const s of i.cameras)t.push(s.projectionMatrixInverse);ds===null?ds=Re(t).setGroup(oe).setName("cameraProjectionMatricesInverse"):ds.array=t,e=ds.element(i.isMultiViewCamera?Dt("gl_ViewID_OVR"):ms)}else fn===null&&(fn=Z(i.projectionMatrixInverse).setName("cameraProjectionMatrixInverse").setGroup(oe).onRenderUpdate(({camera:t})=>t.projectionMatrixInverse)),e=fn;return e}).once()(),yn=E(({camera:i})=>{let e;if(i.isArrayCamera&&i.cameras.length>0){const t=[];for(const s of i.cameras)t.push(s.matrixWorldInverse);ps===null?ps=Re(t).setGroup(oe).setName("cameraViewMatrices"):ps.array=t,e=ps.element(i.isMultiViewCamera?Dt("gl_ViewID_OVR"):ms)}else mn===null&&(mn=Z(i.matrixWorldInverse).setName("cameraViewMatrix").setGroup(oe).onRenderUpdate(({camera:t})=>t.matrixWorldInverse)),e=mn;return e}).once()(),jr=E(({camera:i})=>{let e;if(i.isArrayCamera&&i.cameras.length>0){const t=[];for(const s of i.cameras)t.push(s.matrixWorld);fs===null?fs=Re(t).setGroup(oe).setName("cameraWorldMatrices"):fs.array=t,e=fs.element(i.isMultiViewCamera?Dt("gl_ViewID_OVR"):ms)}else gn===null&&(gn=Z(i.matrixWorld).setName("cameraWorldMatrix").setGroup(oe).onRenderUpdate(({camera:t})=>t.matrixWorld)),e=gn;return e}).once()(),Jr=new no;class $ extends C{static get type(){return"Object3DNode"}constructor(e,t=null){super(),this.scope=e,this.object3d=t,this.updateType=D.OBJECT,this.uniformNode=new Ot(null)}generateNodeType(){const e=this.scope;if(e===$.WORLD_MATRIX)return"mat4";if(e===$.POSITION||e===$.VIEW_POSITION||e===$.DIRECTION||e===$.SCALE)return"vec3";if(e===$.RADIUS)return"float"}update(e){const t=this.object3d,s=this.uniformNode,n=this.scope;if(n===$.WORLD_MATRIX)s.value=t.matrixWorld;else if(n===$.POSITION)s.value=s.value||new S,s.value.setFromMatrixPosition(t.matrixWorld);else if(n===$.SCALE)s.value=s.value||new S,s.value.setFromMatrixScale(t.matrixWorld);else if(n===$.DIRECTION)s.value=s.value||new S,t.getWorldDirection(s.value);else if(n===$.VIEW_POSITION){const r=e.camera;s.value=s.value||new S,s.value.setFromMatrixPosition(t.matrixWorld),s.value.applyMatrix4(r.matrixWorldInverse)}else if(n===$.RADIUS){const r=e.object.geometry;r.boundingSphere===null&&r.computeBoundingSphere(),Jr.copy(r.boundingSphere).applyMatrix4(t.matrixWorld),s.value=Jr.radius}}generate(e){const t=this.scope;return t===$.WORLD_MATRIX?this.uniformNode.nodeType="mat4":t===$.POSITION||t===$.VIEW_POSITION||t===$.DIRECTION||t===$.SCALE?this.uniformNode.nodeType="vec3":t===$.RADIUS&&(this.uniformNode.nodeType="float"),this.uniformNode.build(e)}serialize(e){super.serialize(e),e.scope=this.scope}deserialize(e){super.deserialize(e),this.scope=e.scope}}$.WORLD_MATRIX="worldMatrix",$.POSITION="position",$.SCALE="scale",$.VIEW_POSITION="viewPosition",$.DIRECTION="direction",$.RADIUS="radius";class Ne extends ${static get type(){return"ModelNode"}constructor(e){super(e)}update(e){this.object3d=e.object,super.update(e)}}Ne.DIRECTION;const xn=_(Ne,Ne.WORLD_MATRIX);Ne.POSITION,Ne.SCALE,Ne.VIEW_POSITION,Ne.RADIUS;const mc=Z(new Ce).onObjectUpdate(({object:i},e)=>e.value.getNormalMatrix(i.matrixWorld)),Nn=E(i=>i.context.modelViewMatrix||gc).once()().toVar("modelViewMatrix"),gc=yn.mul(xn),yc=E(i=>i.shaderStage!=="fragment"?(ke("TSL: `clipSpace` is only available in fragment stage."),k()):i.context.clipSpace.toVarying("v_clipSpace")).once()(),Te=Ue("position","vec3"),xc=Te.toVarying("positionLocal"),Nc=E(i=>xn.mul(xc).xyz.toVarying(i.getSubBuildProperty("v_positionWorld")),"vec3").once(["POSITION"])(),ce=E(i=>{if(i.shaderStage==="fragment"&&i.material.vertexNode){const e=fc.mul(yc);return e.xyz.div(e.w).toVar("positionView")}return i.context.setupPositionView().toVarying("v_positionView")},"vec3").once(["POSITION","VERTEX"])(),Qr=E(i=>{let e;return i.camera.isOrthographicCamera?e=R(0,0,1):e=ce.negate().toVarying("v_positionViewDirection").normalize(),e.toVar("positionViewDirection")},"vec3").once(["POSITION"])();class Tc extends C{static get type(){return"FrontFacingNode"}constructor(){super("bool"),this.isFrontFacingNode=!0}generate(e){if(e.shaderStage!=="fragment")return"true";const{material:t}=e;return t.side===1?"false":e.getFrontFacing()}}const Kr=P(_(Tc)).mul(2).sub(1),gs=E(([i],{material:e})=>{const t=e.side;return t===1?i=i.mul(-1):t===2&&(i=i.mul(Kr)),i}),wc=Ue("normal","vec3"),Sc=E(i=>i.geometry.hasAttribute("normal")===!1?(L(\'TSL: Vertex attribute "normal" not found on geometry.\'),R(0,1,0)):wc,"vec3").once()().toVar("normalLocal"),Mc=ce.dFdx().cross(ce.dFdy()).normalize().toVar("normalFlat"),_c=E(i=>{let e;return i.isFlatShading()?e=Mc:e=ei(Sc).toVarying("v_normalViewGeometry").normalize(),e},"vec3").once()().toVar("normalViewGeometry"),me=E(i=>{let e;return i.subBuildFn==="NORMAL"||i.subBuildFn==="VERTEX"?(e=_c,i.isFlatShading()!==!0&&(e=gs(e))):e=i.context.setupNormal().context({getUV:null,getTextureLevel:null}),e},"vec3").once(["NORMAL","VERTEX"])().toVar("normalView"),Ec=me.transformNormalByInverseViewMatrix(yn).toVar("normalWorld"),Ac=E(({subBuildFn:i,context:e})=>{let t;return i==="NORMAL"||i==="VERTEX"?t=me:t=e.setupClearcoatNormal().context({getUV:null,getTextureLevel:null}),t},"vec3").once(["NORMAL","VERTEX"])().toVar("clearcoatNormalView");y("transformNormal",E(([i,e=xn])=>et(e).inverse().transpose().mul(i).normalize()));const ei=E(([i],e)=>{const t=e.context.modelNormalViewMatrix;return t?i.transformNormalByViewMatrix(t):mc.mul(i).transformNormalByViewMatrix(yn)});E(()=>(L(\'TSL: "transformedNormalView" is deprecated. Use "normalView" instead.\'),me)).once(["NORMAL","VERTEX"])(),E(()=>(L(\'TSL: "transformedNormalWorld" is deprecated. Use "normalWorld" instead.\'),Ec)).once(["NORMAL","VERTEX"])(),E(()=>(L(\'TSL: "transformedClearcoatNormalView" is deprecated. Use "clearcoatNormalView" instead.\'),Ac)).once(["NORMAL","VERTEX"])();const Tn=new xe,Cc=Z(0).onReference(({material:i})=>i).onObjectUpdate(({material:i})=>i.refractionRatio),vc=Z(new xe).onReference(function(i){return i.material}).onObjectUpdate(function({material:i,scene:e}){const s=(e.environment!==null||e.environmentNode&&e.environmentNode.isNode)&&i.envMap===null?e.environmentRotation:i.envMapRotation;return s?Tn.makeRotationFromEuler(s).transpose():Tn.identity(),Tn}),bc=Qr.negate().reflect(me),zc=Qr.negate().refract(me,Cc),Fc=bc.transformDirection(jr).toVar("reflectVector"),Rc=zc.transformDirection(jr).toVar("refractVector"),Ic=new oo;class Lc extends ls{static get type(){return"CubeTextureNode"}constructor(e,t=null,s=null,n=null){super(e,t,s,n),this.isCubeTextureNode=!0}getInputType(){return this.value.isDepthTexture===!0?"cubeDepthTexture":"cubeTexture"}getDefaultUV(){const e=this.value;return e.mapping===301?Fc:e.mapping===302?Rc:(q(\'CubeTextureNode: Mapping "%s" not supported.\',e.mapping),R(0,0,0))}setUpdateMatrix(){}setupUV(e,t){const s=this.value;return s.isDepthTexture===!0?e.renderer.coordinateSystem===2001?R(t.x,t.y.negate(),t.z):t:(t=vc.mul(t),(e.renderer.coordinateSystem===2001||!s.isRenderTargetTexture)&&(t=R(t.x.negate(),t.yz)),t)}generateUV(e,t){return t.build(e,this.sampler===!0?"vec3":"ivec3")}}const Oc=K(Lc).setParameterLength(1,4).setName("cubeTexture"),Pc=(i=Ic,e=null,t=null,s=null)=>{let n;return i&&i.isCubeTextureNode===!0?(n=M(i.clone()),n.referenceNode=i,e!==null&&(n.uvNode=M(e)),t!==null&&(n.levelNode=M(t)),s!==null&&(n.biasNode=M(s))):n=Oc(i,e,t,s),n};class Bc extends Rt{static get type(){return"ReferenceElementNode"}constructor(e,t){super(e,t),this.referenceNode=e,this.isReferenceElementNode=!0}generateNodeType(){return this.referenceNode.uniformType}generate(e){const t=super.generate(e),s=this.referenceNode.getNodeType(e),n=this.getNodeType(e);return e.format(t,s,n)}}class ti extends C{static get type(){return"ReferenceNode"}constructor(e,t,s=null,n=null){super(),this.property=e,this.uniformType=t,this.object=s,this.count=n,this.properties=e.split("."),this.reference=s,this.node=null,this.group=null,this.name=null,this.updateType=D.OBJECT}element(e){return new Bc(this,M(e))}setGroup(e){return this.group=e,this}setName(e){return this.name=e,this}label(e){return L(\'TSL: "label()" has been deprecated. Use "setName()" instead.\'),this.setName(e)}setNodeType(e){let t=null;this.count!==null?t=cc(null,e,this.count):Array.isArray(this.getValueFromReference())?(t=Re(null,e),t.updateType=D.OBJECT):e==="texture"?t=hc(null):e==="cubeTexture"?t=Pc(null):t=Z(null,e),this.group!==null&&t.setGroup(this.group),this.name!==null&&t.setName(this.name),this.node=t}generateNodeType(e){return this.node===null&&(this.updateReference(e),this.updateValue()),this.node.getNodeType(e)}getValueFromReference(e=this.reference){const{properties:t}=this;let s=e[t[0]];for(let n=1;n<t.length;n++)s=s[t[n]];return s}updateReference(e){return this.reference=this.object!==null?this.object:e.object,this.reference}setup(){return this.updateValue(),this.node}update(){this.updateValue()}updateValue(){this.node===null&&this.setNodeType(this.uniformType);const e=this.getValueFromReference();Array.isArray(e)?this.node.array=e:this.node.value=e}}const si=(i,e,t)=>new ti(i,e,t);class Dc extends ti{static get type(){return"MaterialReferenceNode"}constructor(e,t,s=null){super(e,t,s),this.material=s,this.isMaterialReferenceNode=!0}updateReference(e){return this.reference=this.material!==null?this.material:e.material,this.reference}}const Uc=(i,e,t=null)=>new Dc(i,e,t),ni=Tt(),Vc=ce.dFdx(),kc=ce.dFdy(),ri=ni.dFdx(),ii=ni.dFdy(),oi=me,ai=kc.cross(oi),hi=oi.cross(Vc),wn=ai.mul(ri.x).add(hi.mul(ii.x)),Sn=ai.mul(ri.y).add(hi.mul(ii.y)),ci=wn.dot(wn).max(Sn.dot(Sn)),li=ci.equal(0).select(0,ci.inverseSqrt()),Gc=wn.mul(li).toVar("tangentViewFrame"),$c=Sn.mul(li).toVar("bitangentViewFrame"),ui=Ue("tangent","vec4"),Wc=ui.xyz.toVar("tangentLocal"),di=E(i=>{let e;return i.subBuildFn==="VERTEX"||i.geometry.hasAttribute("tangent")?e=Nn.mul(k(Wc,0)).xyz.toVarying("v_tangentView").normalize():e=Gc,i.isFlatShading()!==!0&&(e=gs(e)),e},"vec3").once(["NORMAL","VERTEX"])().toVar("tangentView"),Hc=E(([i,e],t)=>{let s=i.mul(ui.w).xyz;return t.subBuildFn==="NORMAL"&&t.isFlatShading()!==!0&&(s=s.toVarying(e)),s}).once(["NORMAL"]),qc=et(di,E(i=>{let e;return i.subBuildFn==="VERTEX"||i.geometry.hasAttribute("tangent")?e=Hc(me.cross(di),"v_bitangentView").normalize():e=$c,i.isFlatShading()!==!0&&(e=gs(e)),e},"vec3").once(["NORMAL","VERTEX"])().toVar("bitangentView"),me).toVar("TBNViewMatrix"),pi=i=>R(i,rn(Lr(P(1).sub(Pt(i,i)))));class Yc extends te{static get type(){return"NormalMapNode"}constructor(e,t=null){super("vec3"),this.node=e,this.scaleNode=t,this.normalMapType=0,this.unpackNormalMode=""}setup(e){const{normalMapType:t,scaleNode:s,unpackNormalMode:n}=this;let r=this.node.mul(2).sub(1);if(t===0?n==="rg"?r=pi(r.xy):n==="ga"?r=pi(r.yw):n!==""&&q(`THREE.NodeMaterial: Unexpected unpack normal mode: ${n}`):n!==""&&q(`THREE.NodeMaterial: Normal map type \'${t}\' is not compatible with unpack normal mode \'${n}\'`),s!==null){let a=s;e.isFlatShading()===!0&&(a=gs(a)),r=R(r.xy.mul(a),r.z)}let o=null;return t===1?o=ei(r):t===0?o=qc.mul(r).normalize():(q(`NodeMaterial: Unsupported normal map type: ${t}`),o=me),o}}const fi=K(Yc).setParameterLength(1,2),Xc=E(({textureNode:i,bumpScale:e})=>{const t=n=>i.isolate().context({getUV:r=>n(r.uvNode||Tt()),forceUVContext:!0}),s=P(t(n=>n));return Be(P(t(n=>n.add(n.dFdx()))).sub(s),P(t(n=>n.add(n.dFdy()))).sub(s)).mul(e)}),Zc=E(i=>{const{surf_pos:e,surf_norm:t,dHdxy:s}=i,n=e.dFdx().normalize(),r=e.dFdy().normalize(),o=t,a=r.cross(o),h=o.cross(n),c=n.dot(a).mul(Kr),l=c.sign().mul(s.x.mul(a).add(s.y.mul(h)));return c.abs().mul(t).sub(l).normalize()});class jc extends te{static get type(){return"BumpMapNode"}constructor(e,t=null){super("vec3"),this.textureNode=e,this.scaleNode=t}setup(e){if(e.material.wireframe===!0)return me;const t=this.scaleNode!==null?this.scaleNode:1,s=Xc({textureNode:this.textureNode,bumpScale:t});return Zc({surf_pos:ce,surf_norm:me,dHdxy:s})}}const Jc=K(jc).setParameterLength(1,2),mi=new Map;class x extends C{static get type(){return"MaterialNode"}constructor(e){super(),this.scope=e}getCache(e,t){let s=mi.get(e);return s===void 0&&(s=Uc(e,t),mi.set(e,s)),s}getFloat(e){return this.getCache(e,"float")}getColor(e){return this.getCache(e,"color")}getTexture(e){return this.getCache(e==="map"?"map":e+"Map","texture")}setup(e){const t=e.context.material,s=this.scope;let n=null;if(s===x.COLOR){const r=t.color!==void 0?this.getColor(s):R();t.map&&t.map.isTexture===!0?n=r.mul(this.getTexture("map")):n=r}else if(s===x.OPACITY){const r=this.getFloat(s);t.alphaMap&&t.alphaMap.isTexture===!0?n=r.mul(this.getTexture("alpha")):n=r}else if(s===x.SPECULAR_STRENGTH)t.specularMap&&t.specularMap.isTexture===!0?n=this.getTexture("specular").r:n=P(1);else if(s===x.SPECULAR_INTENSITY){const r=this.getFloat(s);t.specularIntensityMap&&t.specularIntensityMap.isTexture===!0?n=r.mul(this.getTexture(s).a):n=r}else if(s===x.SPECULAR_COLOR){const r=this.getColor(s);t.specularColorMap&&t.specularColorMap.isTexture===!0?n=r.mul(this.getTexture(s).rgb):n=r}else if(s===x.ROUGHNESS){const r=this.getFloat(s);t.roughnessMap&&t.roughnessMap.isTexture===!0?n=r.mul(this.getTexture(s).g):n=r}else if(s===x.METALNESS){const r=this.getFloat(s);t.metalnessMap&&t.metalnessMap.isTexture===!0?n=r.mul(this.getTexture(s).b):n=r}else if(s===x.EMISSIVE){const r=this.getFloat("emissiveIntensity"),o=this.getColor(s).mul(r);t.emissiveMap&&t.emissiveMap.isTexture===!0?n=o.mul(this.getTexture(s)):n=o}else if(s===x.NORMAL)t.normalMap?(n=fi(this.getTexture("normal"),this.getCache("normalScale","vec2")),n.normalMapType=t.normalMapType,(t.normalMap.format==1030||t.normalMap.format==36285||t.normalMap.format==37490)&&(n.unpackNormalMode="rg")):t.bumpMap?n=Jc(this.getTexture("bump").r,this.getFloat("bumpScale")):n=me;else if(s===x.CLEARCOAT){const r=this.getFloat(s);t.clearcoatMap&&t.clearcoatMap.isTexture===!0?n=r.mul(this.getTexture(s).r):n=r}else if(s===x.CLEARCOAT_ROUGHNESS){const r=this.getFloat(s);t.clearcoatRoughnessMap&&t.clearcoatRoughnessMap.isTexture===!0?n=r.mul(this.getTexture(s).r):n=r}else if(s===x.CLEARCOAT_NORMAL)t.clearcoatNormalMap?n=fi(this.getTexture(s),this.getCache(s+"Scale","vec2")):n=me;else if(s===x.SHEEN){const r=this.getColor("sheenColor").mul(this.getFloat("sheen"));t.sheenColorMap&&t.sheenColorMap.isTexture===!0?n=r.mul(this.getTexture("sheenColor").rgb):n=r}else if(s===x.SHEEN_ROUGHNESS){const r=this.getFloat(s);t.sheenRoughnessMap&&t.sheenRoughnessMap.isTexture===!0?n=r.mul(this.getTexture(s).a):n=r,n=n.clamp(1e-4,1)}else if(s===x.ANISOTROPY)if(t.anisotropyMap&&t.anisotropyMap.isTexture===!0){const r=this.getTexture(s);n=Nr(Wt.x,Wt.y,Wt.y.negate(),Wt.x).mul(r.rg.mul(2).sub(Be(1)).normalize().mul(r.b))}else n=Wt;else if(s===x.IRIDESCENCE_THICKNESS){const r=si("1","float",t.iridescenceThicknessRange);if(t.iridescenceThicknessMap){const o=si("0","float",t.iridescenceThicknessRange);n=r.sub(o).mul(this.getTexture(s).g).add(o)}else n=r}else if(s===x.TRANSMISSION){const r=this.getFloat(s);t.transmissionMap?n=r.mul(this.getTexture(s).r):n=r}else if(s===x.THICKNESS){const r=this.getFloat(s);t.thicknessMap?n=r.mul(this.getTexture(s).g):n=r}else if(s===x.IOR)n=this.getFloat(s);else if(s===x.LIGHT_MAP)t.lightMap?n=this.getTexture(s).rgb.mul(this.getFloat("lightMapIntensity")):n=R(0);else if(s===x.AO)t.aoMap?n=this.getTexture(s).r.sub(1).mul(this.getFloat("aoMapIntensity")).add(1):n=P(1);else if(s===x.LINE_DASH_OFFSET)n=t.dashOffset?this.getFloat(s):P(0);else{const r=this.getNodeType(e);n=this.getCache(s,r)}return n}}x.ALPHA_TEST="alphaTest",x.COLOR="color",x.OPACITY="opacity",x.SHININESS="shininess",x.SPECULAR="specular",x.SPECULAR_STRENGTH="specularStrength",x.SPECULAR_INTENSITY="specularIntensity",x.SPECULAR_COLOR="specularColor",x.REFLECTIVITY="reflectivity",x.ROUGHNESS="roughness",x.METALNESS="metalness",x.NORMAL="normal",x.CLEARCOAT="clearcoat",x.CLEARCOAT_ROUGHNESS="clearcoatRoughness",x.CLEARCOAT_NORMAL="clearcoatNormal",x.EMISSIVE="emissive",x.ROTATION="rotation",x.SHEEN="sheen",x.SHEEN_ROUGHNESS="sheenRoughness",x.ANISOTROPY="anisotropy",x.IRIDESCENCE="iridescence",x.IRIDESCENCE_IOR="iridescenceIOR",x.IRIDESCENCE_THICKNESS="iridescenceThickness",x.IOR="ior",x.TRANSMISSION="transmission",x.THICKNESS="thickness",x.ATTENUATION_DISTANCE="attenuationDistance",x.ATTENUATION_COLOR="attenuationColor",x.LINE_SCALE="scale",x.LINE_DASH_SIZE="dashSize",x.LINE_GAP_SIZE="gapSize",x.LINE_WIDTH="linewidth",x.LINE_DASH_OFFSET="dashOffset",x.POINT_SIZE="size",x.DISPERSION="dispersion",x.LIGHT_MAP="light",x.AO="ao",x.ALPHA_TEST,x.COLOR,x.SHININESS,x.EMISSIVE,x.OPACITY,x.SPECULAR,x.SPECULAR_INTENSITY,x.SPECULAR_COLOR,x.SPECULAR_STRENGTH,x.REFLECTIVITY,x.ROUGHNESS,x.METALNESS,x.NORMAL,x.CLEARCOAT,x.CLEARCOAT_ROUGHNESS,x.CLEARCOAT_NORMAL,x.ROTATION,x.SHEEN,x.SHEEN_ROUGHNESS,x.ANISOTROPY,x.IRIDESCENCE,x.IRIDESCENCE_IOR,x.IRIDESCENCE_THICKNESS,x.TRANSMISSION,x.THICKNESS,x.IOR,x.ATTENUATION_DISTANCE,x.ATTENUATION_COLOR;const Qc=_(x,x.LINE_SCALE),Kc=_(x,x.LINE_DASH_SIZE),el=_(x,x.LINE_GAP_SIZE),Mn=_(x,x.LINE_WIDTH),tl=_(x,x.LINE_DASH_OFFSET);x.POINT_SIZE,x.DISPERSION,x.LIGHT_MAP,x.AO;const Wt=Z(new Me).onReference(function(i){return i.material}).onRenderUpdate(function({material:i}){this.value.set(i.anisotropy*Math.cos(i.anisotropyRotation),i.anisotropy*Math.sin(i.anisotropyRotation))});class ge extends C{static get type(){return"EventNode"}constructor(e,t){super("void"),this.eventType=e,this.callback=t,e===ge.OBJECT?this.updateType=D.OBJECT:e===ge.MATERIAL?this.updateType=D.RENDER:e===ge.FRAME?this.updateType=D.FRAME:e===ge.BEFORE_OBJECT?this.updateBeforeType=D.OBJECT:e===ge.BEFORE_MATERIAL?this.updateBeforeType=D.RENDER:e===ge.BEFORE_FRAME&&(this.updateBeforeType=D.FRAME)}update(e){this.callback(e)}updateBefore(e){this.callback(e)}}ge.OBJECT="object",ge.MATERIAL="material",ge.FRAME="frame",ge.BEFORE_OBJECT="beforeObject",ge.BEFORE_MATERIAL="beforeMaterial",ge.BEFORE_FRAME="beforeFrame";class sl extends C{static get type(){return"LoopNode"}constructor(e=[]){super("void"),this.params=e}getVarName(e){return String.fromCharCode(105+e)}getProperties(e){const t=e.getNodeProperties(this);if(t.stackNode!==void 0)return t;const s={};for(let a=0,h=this.params.length-1;a<h;a++){const c=this.params[a],l=c.isNode!==!0&&c.name||this.getVarName(a),u=c.isNode!==!0&&c.type||"int";s[l]=De(l,u)}const n=e.addStack(),r=this.params[this.params.length-1](s);t.returnsNode=r.context({nodeLoop:r}),t.stackNode=n;const o=this.params[0];if(o.isNode!==!0&&typeof o.update=="function"){const a=E(this.params[0].update)(s);t.updateNode=a.context({nodeLoop:a})}return e.removeStack(),t}setup(e){if(this.getProperties(e),e.fnCall){const t=e.getDataFromNode(e.fnCall.shaderNode);t.hasLoop=!0}}generate(e){const t=this.getProperties(e),s=this.params,n=t.stackNode;for(let o=0,a=s.length-1;o<a;o++){const h=s[o];let c=!1,l=null,u=null,p=null,d=null,f=null,g=null;h.isNode?h.getNodeType(e)==="bool"?(c=!0,d="bool",u=h.build(e,d)):(d="int",p=this.getVarName(o),l="0",u=h.build(e,d),f="<"):(d=h.type||"int",p=h.name||this.getVarName(o),l=h.start,u=h.end,f=h.condition,g=h.update,typeof l=="number"?l=e.generateConst(d,l):l&&l.isNode&&(l=l.build(e,d)),typeof u=="number"?u=e.generateConst(d,u):u&&u.isNode&&(u=u.build(e,d)),l!==void 0&&u===void 0?(l=l+" - 1",u="0",f=">="):u!==void 0&&l===void 0&&(l="0",f="<"),f===void 0&&(Number(l)>Number(u)?f=">=":f="<"));let N;if(c)N=`while ( ${u} )`;else{const T={start:l,end:u},A=T.start,v=T.end;let z;const b=()=>f.includes("<")?"+=":"-=";if(g!=null)switch(typeof g){case"function":z=e.flowStagesNode(t.updateNode,"void").code.replace(/\\t|;/g,"");break;case"number":z=p+" "+b()+" "+e.generateConst(d,g);break;case"string":z=p+" "+g;break;default:g.isNode?z=p+" "+b()+" "+g.build(e):(q("TSL: \'Loop( { update: ... } )\' is not a function, string or number.",this.stackTrace),z="break /* invalid update */")}else d==="int"||d==="uint"?g=f.includes("<")?"++":"--":g=b()+" 1.",z=p+" "+g;const F=e.getVar(d,p)+" = "+A,I=p+" "+f+" "+v;N=`for ( ${F}; ${I}; ${z} )`}e.addFlowCode((o===0?`\n`:"")+e.tab+N+` {\n\n`).addFlowTab()}const r=n.build(e,"void");t.returnsNode.build(e,"void"),e.removeFlowTab().addFlowCode(`\n`+e.tab+r);for(let o=0,a=this.params.length-1;o<a;o++)e.addFlowCode((o===0?"":e.tab)+`}\n\n`).removeFlowTab();e.addFlowTab()}}const Ht=(...i)=>new sl(yt(i,"int")).toStack(),nt=new Me;class nl extends ls{static get type(){return"ViewportTextureNode"}constructor(e=dn,t=null,s=null){let n=null;s===null?(n=new io,n.minFilter=1008,s=n):n=s,super(s,e,t),this.generateMipmaps=!1,this.defaultFramebuffer=n,this.isOutputTextureNode=!0,this.updateBeforeType=D.RENDER,this._cacheTextures=new WeakMap}getTextureForReference(e=null){let t,s;if(this.referenceNode?(t=this.referenceNode.defaultFramebuffer,s=this.referenceNode._cacheTextures):(t=this.defaultFramebuffer,s=this._cacheTextures),e===null)return t;if(s.has(e)===!1){const n=t.clone();s.set(e,n)}return s.get(e)}updateReference(e){const t=e.renderer,s=t.getRenderTarget(),n=t.getCanvasTarget(),r=s||n;return this.value=this.getTextureForReference(r),this.value}updateBefore(e){const t=e.renderer,s=t.getRenderTarget(),n=t.getCanvasTarget(),r=s||n;r===null?t.getDrawingBufferSize(nt):r.getDrawingBufferSize?r.getDrawingBufferSize(nt):nt.set(r.width,r.height);const o=this.getTextureForReference(r);(o.image.width!==nt.width||o.image.height!==nt.height)&&(o.image.width=nt.width,o.image.height=nt.height,o.needsUpdate=!0);const a=o.generateMipmaps;o.generateMipmaps=this.generateMipmaps,t.copyFramebufferToTexture(o),o.generateMipmaps=a}clone(){const e=new this.constructor(this.uvNode,this.levelNode,this.value);return e.generateMipmaps=this.generateMipmaps,e}}let _n=null;class rl extends nl{static get type(){return"ViewportDepthTextureNode"}constructor(e=dn,t=null,s=null){s===null&&(_n===null&&(_n=new Gs),s=_n),super(e,t,s)}}const il=K(rl).setParameterLength(0,3);class de extends C{static get type(){return"ViewportDepthNode"}constructor(e,t=null){super("float"),this.scope=e,this.valueNode=t,this.isViewportDepthNode=!0}generate(e){const{scope:t}=this;return t===de.DEPTH_BASE?e.getFragDepth():super.generate(e)}setup({camera:e}){const{scope:t}=this,s=this.valueNode;let n=null;if(t===de.DEPTH_BASE)s!==null&&(n=yi().assign(s));else if(t===de.DEPTH)e.isPerspectiveCamera?n=ol(ce.z,Gt,$t):n=ys(ce.z,Gt,$t);else if(t===de.LINEAR_DEPTH)if(s!==null)if(e.isPerspectiveCamera){const r=gi(s,Gt,$t);n=ys(r,Gt,$t)}else n=s;else n=ys(ce.z,Gt,$t);return n}}de.DEPTH_BASE="depthBase",de.DEPTH="depth",de.LINEAR_DEPTH="linearDepth";const ys=(i,e,t)=>i.add(e).div(e.sub(t)),ol=(i,e,t)=>e.add(i).mul(t).div(t.sub(e).mul(i)),gi=E(([i,e,t],s)=>s.renderer.reversedDepthBuffer===!0?e.mul(t).div(e.sub(t).mul(i).sub(e)):e.mul(t).div(t.sub(e).mul(i).sub(t))),yi=K(de,de.DEPTH_BASE),al=_(de,de.DEPTH);il(),al.assign=i=>yi(i);class rt extends C{static get type(){return"ClippingNode"}constructor(e=rt.DEFAULT){super(),this.scope=e}setup(e){super.setup(e);const t=e.clippingContext,{intersectionPlanes:s,unionPlanes:n}=t;return this.hardwareClipping=e.hardwareClipping,this.scope===rt.ALPHA_TO_COVERAGE?this.setupAlphaToCoverage(s,n):this.scope===rt.HARDWARE?this.setupHardwareClipping(n,e):this.setupDefault(s,n)}setupAlphaToCoverage(e,t){return E(()=>{const s=P().toVar("distanceToPlane"),n=P().toVar("distanceToGradient"),r=P(1).toVar("clipOpacity"),o=t.length;if(this.hardwareClipping===!1&&o>0){const h=Re(t).setGroup(oe);Ht(o,({i:c})=>{const l=h.element(c);s.assign(ce.dot(l.xyz).negate().add(l.w)),n.assign(s.fwidth().div(2)),r.mulAssign(st(n.negate(),n,s))})}const a=e.length;if(a>0){const h=Re(e).setGroup(oe),c=P(1).toVar("intersectionClipOpacity");Ht(a,({i:l})=>{const u=h.element(l);s.assign(ce.dot(u.xyz).negate().add(u.w)),n.assign(s.fwidth().div(2)),c.mulAssign(st(n.negate(),n,s).oneMinus())}),r.mulAssign(c.oneMinus())}wr.a.mulAssign(r),wr.a.equal(0).discard()})()}setupDefault(e,t){return E(()=>{const s=t.length;if(this.hardwareClipping===!1&&s>0){const r=Re(t).setGroup(oe);Ht(s,({i:o})=>{const a=r.element(o);ce.dot(a.xyz).greaterThan(a.w).discard()})}const n=e.length;if(n>0){const r=Re(e).setGroup(oe),o=en(!0).toVar("clipped");Ht(n,({i:a})=>{const h=r.element(a);o.assign(ce.dot(h.xyz).greaterThan(h.w).and(o))}),o.discard()}})()}setupHardwareClipping(e,t){const s=e.length;return t.enableHardwareClipping(s),E(()=>{const n=Re(e).setGroup(oe),r=Dt(t.getClipDistance());Ht(s,({i:o})=>{const a=n.element(o),h=ce.dot(a.xyz).sub(a.w).negate();r.element(o).assign(h)})})()}}rt.ALPHA_TO_COVERAGE="alphaToCoverage",rt.DEFAULT="default",rt.HARDWARE="hardware";const xs=as("vec3","worldStart"),En=as("vec3","worldEnd"),xi=as("float","lineDistance"),it=as("vec4","worldPos"),Ni=E(({start:i,end:e})=>{const t=wt.element(2).element(2),s=wt.element(3).element(2);return t.greaterThan(0).select(s.negate().div(t.add(1)),s.mul(-.5).div(t)).sub(i.z).div(e.z.sub(i.z))},{start:"vec4",end:"vec4",return:"float"}),hl=E(({p1:i,p2:e,p3:t,p4:s})=>{const n=i.sub(t),r=s.sub(t),o=e.sub(i),a=n.dot(r),h=r.dot(o),c=n.dot(o),l=r.dot(r),p=o.dot(o).mul(l).sub(h.mul(h)),f=a.mul(h).sub(c.mul(l)).div(p).clamp(),g=a.add(h.mul(f)).div(l).clamp();return Be(f,g)},{p1:"vec3",p2:"vec3",p3:"vec3",p4:"vec3",return:"vec2"});E(({material:i})=>{const e=i._useDash,t=i._useWorldUnits,s=Ue("instanceStart"),n=Ue("instanceEnd"),r=k(Nn.mul(k(s,1))).toVar("start"),o=k(Nn.mul(k(n,1))).toVar("end");let a,h;e&&(a=P(Ue("instanceDistanceStart")).toVar("distanceStart"),h=P(Ue("instanceDistanceEnd")).toVar("distanceEnd")),t&&(xs.assign(r.xyz),En.assign(o.xyz));const c=kt.z.div(kt.w),l=wt.element(2).element(3).equal(-1);if(ue(l,()=>{ue(r.z.lessThan(0).and(o.z.greaterThan(0)),()=>{const T=Ni({start:r,end:o});o.assign(k(Xe(r.xyz,o.xyz,T),o.w)),e&&h.assign(Xe(a,h,T))}).ElseIf(o.z.lessThan(0).and(r.z.greaterThanEqual(0)),()=>{const T=Ni({start:o,end:r});r.assign(k(Xe(o.xyz,r.xyz,T),r.w)),e&&a.assign(Xe(h,a,T))})}),e){const T=i.dashScaleNode?P(i.dashScaleNode):Qc,A=i.offsetNode?P(i.offsetNode):tl;let v=Te.y.lessThan(.5).select(T.mul(a),T.mul(h));v=v.add(A),xi.assign(v)}const u=wt.mul(r),p=wt.mul(o),d=u.xyz.div(u.w),f=p.xyz.div(p.w),g=f.xy.sub(d.xy).toVar();g.x.assign(g.x.mul(c)),g.assign(g.normalize());const N=k().toVar();if(t){const T=o.xyz.sub(r.xyz).normalize(),A=Xe(r.xyz,o.xyz,.5).normalize(),v=T.cross(A).normalize(),z=T.cross(v);it.assign(Te.y.lessThan(.5).select(r,o));const b=Mn.mul(.5);it.addAssign(k(Te.x.lessThan(0).select(v.mul(b),v.mul(b).negate()),0)),e||(it.addAssign(k(Te.y.lessThan(.5).select(T.mul(b).negate(),T.mul(b)),0)),it.addAssign(k(z.mul(b),0)),ue(Te.y.greaterThan(1).or(Te.y.lessThan(0)),()=>{it.subAssign(k(z.mul(2).mul(b),0))})),N.assign(wt.mul(it));const F=R().toVar();F.assign(Te.y.lessThan(.5).select(d,f)),N.z.assign(F.z.mul(N.w))}else{const T=Be(g.y,g.x.negate()).toVar("offset");g.x.assign(g.x.div(c)),T.x.assign(T.x.div(c)),T.assign(Te.x.lessThan(0).select(T.negate(),T)),ue(Te.y.lessThan(0),()=>{T.assign(T.sub(g))}).ElseIf(Te.y.greaterThan(1),()=>{T.assign(T.add(g))}),T.assign(T.mul(Mn)),T.assign(T.div(kt.w.div(pc))),N.assign(Te.y.lessThan(.5).select(u,p)),T.assign(T.mul(N.w)),N.assign(N.add(k(T,0,0)))}return N})(),E(({material:i,renderer:e})=>{const t=i._useAlphaToCoverage,s=i._useDash,n=i._useWorldUnits,r=Tt();if(s){const a=i.dashSizeNode?P(i.dashSizeNode):Kc,h=i.gapSizeNode?P(i.gapSizeNode):el;tn.assign(a),Mr.assign(h),r.y.lessThan(-1).or(r.y.greaterThan(1)).discard(),xi.mod(tn.add(Mr)).greaterThan(tn).discard()}const o=P(1).toVar("alpha");if(n){const a=it.xyz.normalize().mul(1e5),h=En.sub(xs),c=hl({p1:xs,p2:En,p3:R(0,0,0),p4:a}),l=xs.add(h.mul(c.x)),u=a.mul(c.y),f=l.sub(u).length().div(Mn);if(!s)if(t&&e.currentSamples>0){const g=f.fwidth();o.assign(st(g.negate().add(.5),g.add(.5),f).oneMinus())}else f.greaterThan(.5).discard()}else if(t&&e.currentSamples>0){const a=r.x,h=r.y.greaterThan(0).select(r.y.sub(1),r.y.add(1)),c=a.mul(a).add(h.mul(h)),l=P(c.fwidth()).toVar("dlen");ue(r.y.abs().greaterThan(1),()=>{o.assign(st(l.oneMinus(),l.add(1),c).oneMinus())})}else ue(r.y.abs().greaterThan(1),()=>{const a=r.x,h=r.y.greaterThan(0).select(r.y.sub(1),r.y.add(1));a.mul(a).add(h.mul(h)).greaterThan(1).discard()});return o})(),R(.04),P(1);const An=E(([i,e])=>{const t=i.toVar();t.assign(Ye(2,t).sub(1));const s=R(t,1).toVar();return ue(e.equal(0),()=>{s.assign(s.zyx)}).ElseIf(e.equal(1),()=>{s.assign(s.xzy),s.xz.mulAssign(-1)}).ElseIf(e.equal(2),()=>{s.x.mulAssign(-1)}).ElseIf(e.equal(3),()=>{s.assign(s.zyx),s.xz.mulAssign(-1)}).ElseIf(e.equal(4),()=>{s.assign(s.xzy),s.xy.mulAssign(-1)}).ElseIf(e.equal(5),()=>{s.z.mulAssign(-1)}),s}).setLayout({name:"getDirection",type:"vec3",inputs:[{name:"uv",type:"vec2"},{name:"face",type:"float"}]})(Tt(),Ue("faceIndex")).normalize();An.x,An.y,An.z,tt("vec3"),tt("vec3"),tt("vec3");class Ti extends Or{static get type(){return"OverrideContextNode"}constructor(e,t=null){super(t,{overrideNodes:e}),this.isOverrideContextNode=!0}getFlowContextData(){const e=[];this.traverse(n=>{n.isOverrideContextNode===!0&&e.push(n.value.overrideNodes)});const t=new Map(e.flatMap(n=>Array.from(n.entries()))),s=super.getFlowContextData();return s.overrideNodes=t,s}}function cl(i,e=null,t=null){if(e&&e.isNode){const s=e;e=()=>s}return new Ti(new Map([[i,e]]),t)}y("overrideNode",(i,e,t)=>cl(e,t,i));function ll(i,e=null){const t=new Map;for(const[s,n]of i){const r=n!==null?typeof n=="function"?n:()=>n:null;t.set(s,r)}return new Ti(t,e)}y("overrideNodes",(i,e)=>ll(e,i));class wi extends te{static get type(){return"BitcastNode"}constructor(e,t,s=null){super(),this.valueNode=e,this.conversionType=t,this.inputType=s,this.isBitcastNode=!0}generateNodeType(e){if(this.inputType!==null){const t=this.valueNode.getNodeType(e),s=e.getTypeLength(t);return e.getTypeFromLength(s,this.conversionType)}return this.conversionType}generate(e){const t=this.getNodeType(e);let s="";if(this.inputType!==null){const n=this.valueNode.getNodeType(e);s=e.getTypeLength(n)===1?this.inputType:e.changeComponentType(n,this.inputType)}else s=this.valueNode.getNodeType(e);return`${e.getBitcastMethod(t,s)}( ${this.valueNode.build(e,s)} )`}}const ul=w(wi).setParameterLength(2),dl=i=>new wi(i,"uint","float"),Ns={};class ot extends m{static get type(){return"BitcountNode"}constructor(e,t){super(e,t),this.isBitcountNode=!0}_resolveElementType(e,t,s){s==="int"?t.assign(ul(e,"uint")):t.assign(e)}_returnDataNode(e){switch(e){case"uint":return se;case"int":return Lt;case"uvec2":return fr;case"uvec3":return gr;case"uvec4":return xr;case"ivec2":return pr;case"ivec3":return mr;case"ivec4":return yr}}_createTrailingZerosBaseLayout(e,t){const s=this._returnDataNode(t);return E(([r])=>{const o=se(0);this._resolveElementType(r,o,t);const a=P(o.bitAnd(zr(o))),c=dl(a).shiftRight(23).sub(127);return s(c)}).setLayout({name:e,type:t,inputs:[{name:"value",type:t}]})}_createLeadingZerosBaseLayout(e,t){const s=this._returnDataNode(t);return E(([r])=>{ue(r.equal(se(0)),()=>se(32));const o=se(0),a=se(0);return this._resolveElementType(r,o,t),ue(o.shiftRight(16).equal(0),()=>{a.addAssign(16),o.shiftLeftAssign(16)}),ue(o.shiftRight(24).equal(0),()=>{a.addAssign(8),o.shiftLeftAssign(8)}),ue(o.shiftRight(28).equal(0),()=>{a.addAssign(4),o.shiftLeftAssign(4)}),ue(o.shiftRight(30).equal(0),()=>{a.addAssign(2),o.shiftLeftAssign(2)}),ue(o.shiftRight(31).equal(0),()=>{a.addAssign(1)}),s(a)}).setLayout({name:e,type:t,inputs:[{name:"value",type:t}]})}_createOneBitsBaseLayout(e,t){const s=this._returnDataNode(t);return E(([r])=>{const o=se(0);this._resolveElementType(r,o,t),o.assign(o.sub(o.shiftRight(se(1)).bitAnd(se(1431655765)))),o.assign(o.bitAnd(se(858993459)).add(o.shiftRight(se(2)).bitAnd(se(858993459))));const a=o.add(o.shiftRight(se(4))).bitAnd(se(252645135)).mul(se(16843009)).shiftRight(se(24));return s(a)}).setLayout({name:e,type:t,inputs:[{name:"value",type:t}]})}_createMainLayout(e,t,s,n){const r=this._returnDataNode(t);return E(([a])=>{if(s===1)return r(n(a));{const h=r(0),c=["x","y","z","w"];for(let l=0;l<s;l++){const u=c[l];h[u].assign(n(a[u]))}return h}}).setLayout({name:e,type:t,inputs:[{name:"value",type:t}]})}setup(e){const{method:t,aNode:s}=this,{renderer:n}=e;if(n.backend.isWebGPUBackend)return super.setup(e);const r=this.getInputType(e),o=e.getElementType(r),a=e.getTypeLength(r),h=`${t}_base_${o}`,c=`${t}_${r}`;let l=Ns[h];if(l===void 0){switch(t){case ot.COUNT_LEADING_ZEROS:{l=this._createLeadingZerosBaseLayout(h,o);break}case ot.COUNT_TRAILING_ZEROS:{l=this._createTrailingZerosBaseLayout(h,o);break}case ot.COUNT_ONE_BITS:{l=this._createOneBitsBaseLayout(h,o);break}}Ns[h]=l}let u=Ns[c];return u===void 0&&(u=this._createMainLayout(c,r,a,l),Ns[c]=u),E(()=>u(s))()}}ot.COUNT_TRAILING_ZEROS="countTrailingZeros",ot.COUNT_LEADING_ZEROS="countLeadingZeros",ot.COUNT_ONE_BITS="countOneBits",new xe;const pl=new Xn;dn.flipX(),pl.depthTexture=new Gs(1,1),E(([i])=>cs(P(52.9829189).mul(cs(Pt(i,Be(.06711056,.00583715)))))).setLayout({name:"interleavedGradientNoise",type:"float",inputs:[{name:"position",type:"vec2"}]}),E(([i,e,t])=>{const s=P(2.399963229728653),n=rn(P(i).add(.5).div(P(e))),r=P(i).mul(s).add(t);return Be(vr(r),on(r)).mul(n)}).setLayout({name:"vogelDiskSample",type:"vec2",inputs:[{name:"sampleIndex",type:"int"},{name:"samplesCount",type:"int"},{name:"phi",type:"float"}]});class fl extends nr{constructor(e,t,s=Float32Array){const n=ArrayBuffer.isView(e)?e:new s(e*t);super(n,t),this.isStorageBufferAttribute=!0}}E(({texture:i,uv:e})=>{const s=R().toVar();return ue(e.x.lessThan(1e-4),()=>{s.assign(R(1,0,0))}).ElseIf(e.y.lessThan(1e-4),()=>{s.assign(R(0,1,0))}).ElseIf(e.z.lessThan(1e-4),()=>{s.assign(R(0,0,1))}).ElseIf(e.x.greaterThan(1-1e-4),()=>{s.assign(R(-1,0,0))}).ElseIf(e.y.greaterThan(1-1e-4),()=>{s.assign(R(0,-1,0))}).ElseIf(e.z.greaterThan(1-1e-4),()=>{s.assign(R(0,0,-1))}).Else(()=>{const r=i.sample(e.add(R(-.01,0,0))).r.sub(i.sample(e.add(R(.01,0,0))).r),o=i.sample(e.add(R(0,-.01,0))).r.sub(i.sample(e.add(R(0,.01,0))).r),a=i.sample(e.add(R(0,0,-.01))).r.sub(i.sample(e.add(R(0,0,.01))).r);s.assign(R(r,o,a))}),s.normalize()}),E(([i,e])=>i.mul(e).floor().div(e));const Ts=new Me;class ml extends ls{static get type(){return"PassTextureNode"}constructor(e,t){super(t),this.passNode=e,this.isPassTextureNode=!0,this.setUpdateMatrix(!1)}setup(e){const t=e.getNodeProperties(this);return t.passNode=this.passNode,super.setup(e)}clone(){return new this.constructor(this.passNode,this.value)}}class Si extends ml{static get type(){return"PassMultipleTextureNode"}constructor(e,t,s=!1){super(e,null),this.textureName=t,this.previousTexture=s,this.isPassMultipleTextureNode=!0}updateTexture(){this.value=this.previousTexture?this.passNode.getPreviousTexture(this.textureName):this.passNode.getTexture(this.textureName)}setup(e){return this.updateTexture(),super.setup(e)}clone(){const e=new this.constructor(this.passNode,this.textureName,this.previousTexture);return e.uvNode=this.uvNode,e.levelNode=this.levelNode,e.biasNode=this.biasNode,e.sampler=this.sampler,e.depthNode=this.depthNode,e.compareNode=this.compareNode,e.gradNode=this.gradNode,e.gatherNode=this.gatherNode,e.offsetNode=this.offsetNode,e}}class qt extends te{static get type(){return"PassNode"}constructor(e,t,s,n={}){super("vec4"),this.scope=e,this.scene=t,this.camera=s,this.options=n,this._width=1,this._height=1;const r=new Xn(this._width,this._height,{type:1016,...n});r.texture.name="output";let o=null;(this.scope===qt.DEPTH||n.depthBuffer!==!1)&&(o=new Gs,o.isRenderTargetTexture=!0,o.name="depth",r.depthTexture=o),this.renderTarget=r,this.overrideMaterial=null,this.transparent=!0,this.opaque=!0,this.contextNode=null,this._contextNodeCache=null,this._textures={output:r.texture},o!==null&&(this._textures.depth=o),this._textureNodes={},this._linearDepthNodes={},this._viewZNodes={},this._previousTextures={},this._previousTextureNodes={},this._cameraNear=Z(0),this._cameraFar=Z(0),this._mrt=null,this._layers=null,this._resolutionScale=1,this._viewport=null,this._scissor=null,this.isPassNode=!0,this.updateBeforeType=D.FRAME,this.global=!0}setResolutionScale(e){return this._resolutionScale=e,this}getResolutionScale(){return this._resolutionScale}setResolution(e){return L("PassNode: .setResolution() is deprecated. Use .setResolutionScale() instead."),this.setResolutionScale(e)}getResolution(){return L("PassNode: .getResolution() is deprecated. Use .getResolutionScale() instead."),this.getResolutionScale()}setLayers(e){return this._layers=e,this}getLayers(){return this._layers}setMRT(e){return this._mrt=e,this}getMRT(){return this._mrt}getTexture(e){let t=this._textures[e];if(t===void 0){if(e==="depth")throw new Error("THREE.PassNode: Depth texture is not available for this pass.");t=this.renderTarget.texture.clone(),t.name=e,this._textures[e]=t,this.renderTarget.textures.push(t)}return t}getPreviousTexture(e){let t=this._previousTextures[e];return t===void 0&&(t=this.getTexture(e).clone(),this._previousTextures[e]=t),t}toggleTexture(e){const t=this._previousTextures[e];if(t!==void 0){const s=this._textures[e],n=this.renderTarget.textures.indexOf(s);this.renderTarget.textures[n]=t,this._textures[e]=t,this._previousTextures[e]=s,this._textureNodes[e].updateTexture(),this._previousTextureNodes[e].updateTexture()}}getTextureNode(e="output"){let t=this._textureNodes[e];return t===void 0&&(t=new Si(this,e),t.updateTexture(),this._textureNodes[e]=t),t}getPreviousTextureNode(e="output"){let t=this._previousTextureNodes[e];return t===void 0&&(this._textureNodes[e]===void 0&&this.getTextureNode(e),t=new Si(this,e,!0),t.updateTexture(),this._previousTextureNodes[e]=t),t}getViewZNode(e="depth"){let t=this._viewZNodes[e];if(t===void 0){const s=this._cameraNear,n=this._cameraFar;this._viewZNodes[e]=t=gi(this.getTextureNode(e),s,n)}return t}getLinearDepthNode(e="depth"){let t=this._linearDepthNodes[e];if(t===void 0){const s=this._cameraNear,n=this._cameraFar,r=this.getViewZNode(e);this._linearDepthNodes[e]=t=ys(r,s,n)}return t}async compileAsync(e){const t=e.getRenderTarget(),s=e.getMRT();e.setRenderTarget(this.renderTarget),e.setMRT(this._mrt),await e.compileAsync(this.scene,this.camera),e.setRenderTarget(t),e.setMRT(s)}setup({renderer:e}){return this.renderTarget.samples=this.options.samples===void 0?e.samples:this.options.samples,this.renderTarget.texture.type=e.getOutputBufferType(),e.reversedDepthBuffer===!0&&this.renderTarget.depthTexture!==null&&(this.renderTarget.depthTexture.type=1015),this.scope===qt.COLOR?this.getTextureNode():this.getLinearDepthNode()}updateBefore(e){const{renderer:t}=e,{scene:s}=this;let n;const r=t.getOutputRenderTarget();r&&r.isXRRenderTarget===!0?(n=t.xr.getCamera(),t.xr.updateCamera(n),Ts.set(r.width,r.height)):(n=this.camera,t.getDrawingBufferSize(Ts)),this.setSize(Ts.width,Ts.height);const o=t.getRenderTarget(),a=t.getMRT(),h=t.autoClear,c=t.transparent,l=t.opaque,u=n.layers.mask,p=t.contextNode,d=s.overrideMaterial;this._cameraNear.value=n.near,this._cameraFar.value=n.far,this._layers!==null&&(n.layers.mask=this._layers.mask);for(const g in this._previousTextures)this.toggleTexture(g);this.overrideMaterial!==null&&(s.overrideMaterial=this.overrideMaterial),t.setRenderTarget(this.renderTarget),t.setMRT(this._mrt),t.autoClear=!0,t.transparent=this.transparent,t.opaque=this.opaque,this.contextNode!==null&&((this._contextNodeCache===null||this._contextNodeCache.version!==this.version)&&(this._contextNodeCache={version:this.version,context:Nt({...t.contextNode.getFlowContextData(),...this.contextNode.getFlowContextData()})}),t.contextNode=this._contextNodeCache.context);const f=s.name;s.name=this.name?this.name:s.name,t.render(s,n),s.name=f,s.overrideMaterial=d,t.setRenderTarget(o),t.setMRT(a),t.autoClear=h,t.transparent=c,t.opaque=l,t.contextNode=p,n.layers.mask=u}setSize(e,t){this._width=e,this._height=t;const s=Math.floor(this._width*this._resolutionScale),n=Math.floor(this._height*this._resolutionScale);this.renderTarget.setSize(s,n),this._scissor!==null?(this.renderTarget.scissor.copy(this._scissor).multiplyScalar(this._resolutionScale).floor(),this.renderTarget.scissorTest=!0):this.renderTarget.scissorTest=!1,this._viewport!==null&&this.renderTarget.viewport.copy(this._viewport).multiplyScalar(this._resolutionScale).floor()}setScissor(e,t,s,n){e===null?this._scissor=null:(this._scissor===null&&(this._scissor=new Ge),e.isVector4?this._scissor.copy(e):this._scissor.set(e,t,s,n))}setViewport(e,t,s,n){e===null?this._viewport=null:(this._viewport===null&&(this._viewport=new Ge),e.isVector4?this._viewport.copy(e):this._viewport.set(e,t,s,n))}dispose(){this.renderTarget.dispose()}}qt.COLOR="color",qt.DEPTH="depth",R(1.6605,-.1246,-.0182),R(-.5876,1.1329,-.1006),R(-.0728,-.0083,1.1187),R(.6274,.0691,.0164),R(.3293,.9195,.088),R(.0433,.0113,.8956);class Y extends C{static get type(){return"CodeNode"}constructor(e="",t=[],s=""){super("code"),this.isCodeNode=!0,this.global=!0,this.code=e,this.includes=t,this.language=s}setIncludes(e){return this.includes=e,this}getIncludes(){return this.includes}generate(e){const t=this.getIncludes(e);for(const n of t)n.build(e);const s=e.getCodeFromNode(this,this.getNodeType(e));return s.code=this.code,s.code}serialize(e){super.serialize(e),e.code=this.code,e.language=this.language}deserialize(e){super.deserialize(e),this.code=e.code,this.language=e.language}}function Cn(i){let e;const t=i.context.getViewZ;return t!==void 0&&(e=t(this)),(e||ce.z).negate()}E(([i,e],t)=>{const s=Cn(t);return st(i,e,s)}),E(([i],e)=>{const t=Cn(e);return i.mul(i,t,t).negate().exp().oneMinus()}),E(([i,e],t)=>{const s=Cn(t),r=e.sub(Nc.y).max(0).toConst().mul(s).toConst();return i.mul(i,r,r).negate().exp().oneMinus()}),E(([i,e])=>k(e.toFloat().mix(Sr.rgb,i.toVec3()),Sr.a));class gl extends C{constructor(e){super(),this.scope=e,this.isBarrierNode=!0}setup(e){e.allowEarlyReturns=!1,e.allowGlobalVariables=!1}generate(e){const{scope:t}=this,{renderer:s}=e;s.backend.isWebGLBackend===!0?e.addFlowCode(`	// ${t}Barrier \n`):e.addLineFlowCode(`${t}Barrier()`,this)}}K(gl);class Ie extends C{static get type(){return"AtomicFunctionNode"}constructor(e,t,s){super("uint"),this.method=e,this.pointerNode=t,this.valueNode=s,this.parents=!0}getInputType(e){return this.pointerNode.getNodeType(e)}generateNodeType(e){return this.getInputType(e)}generate(e){const t=e.getNodeProperties(this),s=t.parents,n=this.method,r=this.getNodeType(e),o=this.getInputType(e),a=this.pointerNode,h=this.valueNode,c=[];c.push(`&${a.build(e,o)}`),h!==null&&c.push(h.build(e,o));const l=`${e.getMethod(n,r)}( ${c.join(", ")} )`;if(s?s.length===1&&s[0].isStackNode===!0:!1)e.addLineFlowCode(l,this);else return t.constNode===void 0&&(t.constNode=De(l,r).toConst()),t.constNode.build(e)}}Ie.ATOMIC_LOAD="atomicLoad",Ie.ATOMIC_STORE="atomicStore",Ie.ATOMIC_ADD="atomicAdd",Ie.ATOMIC_SUB="atomicSub",Ie.ATOMIC_MAX="atomicMax",Ie.ATOMIC_MIN="atomicMin",Ie.ATOMIC_AND="atomicAnd",Ie.ATOMIC_OR="atomicOr",Ie.ATOMIC_XOR="atomicXor",K(Ie);class B extends te{static get type(){return"SubgroupFunctionNode"}constructor(e,t=null,s=null){super(),this.method=e,this.aNode=t,this.bNode=s}getInputType(e){const t=this.aNode?this.aNode.getNodeType(e):null,s=this.bNode?this.bNode.getNodeType(e):null,n=e.isMatrix(t)?0:e.getTypeLength(t),r=e.isMatrix(s)?0:e.getTypeLength(s);return n>r?t:s}generateNodeType(e){const t=this.method;return t===B.SUBGROUP_ELECT?"bool":t===B.SUBGROUP_BALLOT?"uvec4":this.getInputType(e)}generate(e,t){const s=this.method,n=this.getNodeType(e),r=this.getInputType(e),o=this.aNode,a=this.bNode,h=[];if(s===B.SUBGROUP_BROADCAST||s===B.SUBGROUP_SHUFFLE||s===B.QUAD_BROADCAST){const l=a.getNodeType(e);h.push(o.build(e,n),a.build(e,l==="float"?"int":n))}else s===B.SUBGROUP_SHUFFLE_XOR||s===B.SUBGROUP_SHUFFLE_DOWN||s===B.SUBGROUP_SHUFFLE_UP?h.push(o.build(e,n),a.build(e,"uint")):(o!==null&&h.push(o.build(e,r)),a!==null&&h.push(a.build(e,r)));const c=h.length===0?"()":`( ${h.join(", ")} )`;return e.format(`${e.getMethod(s,n)}${c}`,n,t)}serialize(e){super.serialize(e),e.method=this.method}deserialize(e){super.deserialize(e),this.method=e.method}}B.SUBGROUP_ELECT="subgroupElect",B.SUBGROUP_BALLOT="subgroupBallot",B.SUBGROUP_ADD="subgroupAdd",B.SUBGROUP_INCLUSIVE_ADD="subgroupInclusiveAdd",B.SUBGROUP_EXCLUSIVE_AND="subgroupExclusiveAdd",B.SUBGROUP_MUL="subgroupMul",B.SUBGROUP_INCLUSIVE_MUL="subgroupInclusiveMul",B.SUBGROUP_EXCLUSIVE_MUL="subgroupExclusiveMul",B.SUBGROUP_AND="subgroupAnd",B.SUBGROUP_OR="subgroupOr",B.SUBGROUP_XOR="subgroupXor",B.SUBGROUP_MIN="subgroupMin",B.SUBGROUP_MAX="subgroupMax",B.SUBGROUP_ALL="subgroupAll",B.SUBGROUP_ANY="subgroupAny",B.SUBGROUP_BROADCAST_FIRST="subgroupBroadcastFirst",B.QUAD_SWAP_X="quadSwapX",B.QUAD_SWAP_Y="quadSwapY",B.QUAD_SWAP_DIAGONAL="quadSwapDiagonal",B.SUBGROUP_BROADCAST="subgroupBroadcast",B.SUBGROUP_SHUFFLE="subgroupShuffle",B.SUBGROUP_SHUFFLE_XOR="subgroupShuffleXor",B.SUBGROUP_SHUFFLE_UP="subgroupShuffleUp",B.SUBGROUP_SHUFFLE_DOWN="subgroupShuffleDown",B.QUAD_BROADCAST="quadBroadcast",tt("vec3","totalDiffuse"),tt("vec3","totalSpecular"),tt("vec3","outgoingLight"),E(([i=Tt()],{renderer:e,material:t})=>{const s=Rr(i.mul(2).sub(1));let n;if(t.alphaToCoverage&&e.currentSamples>0){const r=P(s.fwidth()).toVar();n=st(r.oneMinus(),r.add(1),s).oneMinus()}else n=cn(s.greaterThan(1),0,1);return n}),new Y("uint tsl_bitcast_int_to_uint ( int x ) { return floatBitsToUint( intBitsToFloat ( x ) ); }"),new Y("uint tsl_bitcast_uint_to_int ( uint x ) { return floatBitsToInt( uintBitsToFloat ( x ) ); }"),new Y(`\nvec4 tsl_textureGather( const int comp, sampler2D map, vec2 coord, ivec2 offset, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ) );\n	vec2 st = floor( coord * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, ij.xw, 0.0 )[ comp ],\n		textureLod( map, ij.zw, 0.0 )[ comp ],\n		textureLod( map, ij.zy, 0.0 )[ comp ],\n		textureLod( map, ij.xy, 0.0 )[ comp ]\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new Y(`\nvec4 tsl_textureGather_array( const int comp, sampler2DArray map, vec3 coord, ivec2 offset, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ).xy );\n	vec2 st = floor( coord.xy * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, vec3( ij.xw, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.zw, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.zy, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.xy, coord.z ), 0.0 )[ comp ]\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new Y(`\nvec4 tsl_textureGatherCompare( sampler2DShadow map, vec2 coord, ivec2 offset, float ref, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ) );\n	vec2 st = floor( coord * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, vec3( ij.xw, ref ), 0.0 ),\n		textureLod( map, vec3( ij.zw, ref ), 0.0 ),\n		textureLod( map, vec3( ij.zy, ref ), 0.0 ),\n		textureLod( map, vec3( ij.xy, ref ), 0.0 )\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new Y(`\nvec4 tsl_textureGatherCompare_array( sampler2DArrayShadow map, vec3 coord, ivec2 offset, float ref, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ).xy );\n	vec2 st = floor( coord.xy * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		texture( map, vec4( ij.xw, coord.z, ref ) ),\n		texture( map, vec4( ij.zw, coord.z, ref ) ),\n		texture( map, vec4( ij.zy, coord.z, ref ) ),\n		texture( map, vec4( ij.xy, coord.z, ref ) )\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`);const vn=typeof self<"u"&&self.GPUShaderStage?self.GPUShaderStage:{VERTEX:1,FRAGMENT:2,COMPUTE:4};class yl{constructor(){this.texture=null,this.mipLevel=0,this.origin={x:0,y:0,z:0},this.aspect="all"}reset(){this.texture=null,this.mipLevel=0,this.origin.x=0,this.origin.y=0,this.origin.z=0,this.aspect="all"}}class xl extends yl{constructor(){super(),this.colorSpace="srgb",this.premultipliedAlpha=!1}reset(){super.reset(),this.colorSpace="srgb",this.premultipliedAlpha=!1}}new xl,qs.READ_ONLY+"",qs.WRITE_ONLY+"",qs.READ_WRITE+"",vn.VERTEX,vn.FRAGMENT,vn.COMPUTE,new Y("fn tsl_xor( a : bool, b : bool ) -> bool { return ( a || b ) && !( a && b ); }"),new Y("fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }"),new Y("fn tsl_mod_vec2( x : vec2f, y : vec2f ) -> vec2f { return x - y * floor( x / y ); }"),new Y("fn tsl_mod_vec3( x : vec3f, y : vec3f ) -> vec3f { return x - y * floor( x / y ); }"),new Y("fn tsl_mod_vec4( x : vec4f, y : vec4f ) -> vec4f { return x - y * floor( x / y ); }"),new Y("fn tsl_equals_bool( a : bool, b : bool ) -> bool { return a == b; }"),new Y("fn tsl_equals_bvec2( a : vec2f, b : vec2f ) -> vec2<bool> { return vec2<bool>( a.x == b.x, a.y == b.y ); }"),new Y("fn tsl_equals_bvec3( a : vec3f, b : vec3f ) -> vec3<bool> { return vec3<bool>( a.x == b.x, a.y == b.y, a.z == b.z ); }"),new Y("fn tsl_equals_bvec4( a : vec4f, b : vec4f ) -> vec4<bool> { return vec4<bool>( a.x == b.x, a.y == b.y, a.z == b.z, a.w == b.w ); }"),new Y("fn tsl_repeatWrapping_float( coord: f32 ) -> f32 { return fract( coord ); }"),new Y("fn tsl_mirrorWrapping_float( coord: f32 ) -> f32 { let mirrored = fract( coord * 0.5 ) * 2.0; return 1.0 - abs( 1.0 - mirrored ); }"),new Y("fn tsl_clampWrapping_float( coord: f32 ) -> f32 { return clamp( coord, 0.0, 1.0 ); }"),new Y(`\nfn tsl_inverse_mat2( m : mat2x2<f32> ) -> mat2x2<f32> {\n\n	let det = m[ 0 ][ 0 ] * m[ 1 ][ 1 ] - m[ 0 ][ 1 ] * m[ 1 ][ 0 ];\n\n	return mat2x2<f32>(\n		m[ 1 ][ 1 ], - m[ 0 ][ 1 ],\n		- m[ 1 ][ 0 ], m[ 0 ][ 0 ]\n	) * ( 1.0 / det );\n\n}\n`),new Y(`\nfn tsl_inverse_mat3( m : mat3x3<f32> ) -> mat3x3<f32> {\n\n	let a00 = m[ 0 ][ 0 ]; let a01 = m[ 0 ][ 1 ]; let a02 = m[ 0 ][ 2 ];\n	let a10 = m[ 1 ][ 0 ]; let a11 = m[ 1 ][ 1 ]; let a12 = m[ 1 ][ 2 ];\n	let a20 = m[ 2 ][ 0 ]; let a21 = m[ 2 ][ 1 ]; let a22 = m[ 2 ][ 2 ];\n\n	let b01 = a22 * a11 - a12 * a21;\n	let b11 = - a22 * a10 + a12 * a20;\n	let b21 = a21 * a10 - a11 * a20;\n\n	let det = a00 * b01 + a01 * b11 + a02 * b21;\n\n	return mat3x3<f32>(\n		b01, ( - a22 * a01 + a02 * a21 ), ( a12 * a01 - a02 * a11 ),\n		b11, ( a22 * a00 - a02 * a20 ), ( - a12 * a00 + a02 * a10 ),\n		b21, ( - a21 * a00 + a01 * a20 ), ( a11 * a00 - a01 * a10 )\n	) * ( 1.0 / det );\n\n}\n`),new Y(`\nfn tsl_inverse_mat4( m : mat4x4<f32> ) -> mat4x4<f32> {\n\n	let a00 = m[ 0 ][ 0 ]; let a01 = m[ 0 ][ 1 ]; let a02 = m[ 0 ][ 2 ]; let a03 = m[ 0 ][ 3 ];\n	let a10 = m[ 1 ][ 0 ]; let a11 = m[ 1 ][ 1 ]; let a12 = m[ 1 ][ 2 ]; let a13 = m[ 1 ][ 3 ];\n	let a20 = m[ 2 ][ 0 ]; let a21 = m[ 2 ][ 1 ]; let a22 = m[ 2 ][ 2 ]; let a23 = m[ 2 ][ 3 ];\n	let a30 = m[ 3 ][ 0 ]; let a31 = m[ 3 ][ 1 ]; let a32 = m[ 3 ][ 2 ]; let a33 = m[ 3 ][ 3 ];\n\n	let b00 = a00 * a11 - a01 * a10;\n	let b01 = a00 * a12 - a02 * a10;\n	let b02 = a00 * a13 - a03 * a10;\n	let b03 = a01 * a12 - a02 * a11;\n	let b04 = a01 * a13 - a03 * a11;\n	let b05 = a02 * a13 - a03 * a12;\n	let b06 = a20 * a31 - a21 * a30;\n	let b07 = a20 * a32 - a22 * a30;\n	let b08 = a20 * a33 - a23 * a30;\n	let b09 = a21 * a32 - a22 * a31;\n	let b10 = a21 * a33 - a23 * a31;\n	let b11 = a22 * a33 - a23 * a32;\n\n	let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n\n	return mat4x4<f32>(\n		a11 * b11 - a12 * b10 + a13 * b09,\n		a02 * b10 - a01 * b11 - a03 * b09,\n		a31 * b05 - a32 * b04 + a33 * b03,\n		a22 * b04 - a21 * b05 - a23 * b03,\n		a12 * b08 - a10 * b11 - a13 * b07,\n		a00 * b11 - a02 * b08 + a03 * b07,\n		a32 * b02 - a30 * b05 - a33 * b01,\n		a20 * b05 - a22 * b02 + a23 * b01,\n		a10 * b10 - a11 * b08 + a13 * b06,\n		a01 * b08 - a00 * b10 - a03 * b06,\n		a30 * b04 - a31 * b02 + a33 * b00,\n		a21 * b02 - a20 * b04 - a23 * b00,\n		a11 * b07 - a10 * b09 - a12 * b06,\n		a00 * b09 - a01 * b07 + a02 * b06,\n		a31 * b01 - a30 * b03 - a32 * b00,\n		a20 * b03 - a21 * b01 + a22 * b00\n	) * ( 1.0 / det );\n\n}\n`),new Y(`\nfn tsl_biquadraticTexture( map : texture_2d<f32>, coord : vec2f, iRes : vec2u, level : u32 ) -> vec4f {\n\n	let res = vec2f( iRes );\n\n	let uvScaled = coord * res;\n	let uvWrapping = ( ( uvScaled % res ) + res ) % res;\n\n	// https://www.shadertoy.com/view/WtyXRy\n\n	let uv = uvWrapping - 0.5;\n	let iuv = floor( uv );\n	let f = fract( uv );\n\n	let rg1 = textureLoad( map, vec2u( iuv + vec2( 0.5, 0.5 ) ) % iRes, level );\n	let rg2 = textureLoad( map, vec2u( iuv + vec2( 1.5, 0.5 ) ) % iRes, level );\n	let rg3 = textureLoad( map, vec2u( iuv + vec2( 0.5, 1.5 ) ) % iRes, level );\n	let rg4 = textureLoad( map, vec2u( iuv + vec2( 1.5, 1.5 ) ) % iRes, level );\n\n	return mix( mix( rg1, rg2, f.x ), mix( rg3, rg4, f.x ), f.y );\n\n}\n`),new Y(`\nfn tsl_biquadraticTexture_array( map : texture_2d_array<f32>, coord : vec2f, iRes : vec2u, layer : u32, level : u32 ) -> vec4f {\n\n	let res = vec2f( iRes );\n\n	let uvScaled = coord * res;\n	let uvWrapping = ( ( uvScaled % res ) + res ) % res;\n\n	// https://www.shadertoy.com/view/WtyXRy\n\n	let uv = uvWrapping - 0.5;\n	let iuv = floor( uv );\n	let f = fract( uv );\n\n	let rg1 = textureLoad( map, vec2u( iuv + vec2( 0.5, 0.5 ) ) % iRes, layer, level );\n	let rg2 = textureLoad( map, vec2u( iuv + vec2( 1.5, 0.5 ) ) % iRes, layer, level );\n	let rg3 = textureLoad( map, vec2u( iuv + vec2( 0.5, 1.5 ) ) % iRes, layer, level );\n	let rg4 = textureLoad( map, vec2u( iuv + vec2( 1.5, 1.5 ) ) % iRes, layer, level );\n\n	return mix( mix( rg1, rg2, f.x ), mix( rg3, rg4, f.x ), f.y );\n\n}\n`),typeof Float16Array<"u"&&new Map([[Int8Array,["sint8","snorm8"]],[Uint8Array,["uint8","unorm8"]],[Int16Array,["sint16","snorm16"]],[Uint16Array,["uint16","unorm16"]],[Int32Array,["sint32","snorm32"]],[Uint32Array,["uint32","unorm32"]],[Float32Array,["float32"]]]).set(Float16Array,["float16"]);class Nl{count;shDegree;shCoefficientCount;shFormat;means;scalesOpacity;rotations;shCoefficients;ownsBuffers;disposed=!1;constructor(e,t){if(!Number.isInteger(t.count)||t.count<=0)throw new RangeError("GaussianData count must be a positive integer");const s=t.shDegree??0;if(!Number.isInteger(s)||s<0||s>3)throw new RangeError("GaussianData shDegree must be 0, 1, 2, or 3");if(this.count=t.count,this.shDegree=s,this.shCoefficientCount=(s+1)**2,this.shFormat=t.shFormat??"float32",this.shFormat!=="float32"&&this.shFormat!=="rgb8e8")throw new RangeError("GaussianData shFormat must be float32 or rgb8e8");this.means=e.means,this.scalesOpacity=e.scalesOpacity,this.rotations=e.rotations,this.shCoefficients=e.shCoefficients,this.ownsBuffers=t.ownsBuffers??!1,this.validateVec4Attribute(this.means,"means",this.count),this.validateVec4Attribute(this.scalesOpacity,"scalesOpacity",this.count),this.validateVec4Attribute(this.rotations,"rotations",this.count),this.validateShAttribute(this.shCoefficients,this.count*this.shCoefficientCount)}dispose(){this.disposed||(this.disposed=!0,this.ownsBuffers&&(this.means.dispose(),this.scalesOpacity.dispose(),this.rotations.dispose(),this.shCoefficients.dispose()))}validateVec4Attribute(e,t,s){if(e.isStorageBufferAttribute!==!0)throw new TypeError(`GaussianData ${t} must be a Three.js StorageBufferAttribute`);if(e.itemSize!==4)throw new RangeError(`GaussianData ${t} itemSize is ${e.itemSize}; vec4 data requires itemSize 4`);if(!(e.array instanceof Float32Array))throw new TypeError(`GaussianData ${t} must use Float32Array storage`);if(e.count<s)throw new RangeError(`GaussianData ${t} has ${e.count} items; at least ${s} are required`)}validateShAttribute(e,t){if(e.isStorageBufferAttribute!==!0)throw new TypeError("GaussianData shCoefficients must be a Three.js StorageBufferAttribute");const s=this.shFormat==="rgb8e8"?1:4;if(e.itemSize!==s)throw new RangeError(`GaussianData ${this.shFormat} shCoefficients itemSize is ${e.itemSize}; expected ${s}`);if(!(this.shFormat==="rgb8e8"?e.array instanceof Uint32Array:e.array instanceof Float32Array))throw new TypeError(`GaussianData ${this.shFormat} shCoefficients use the wrong typed array`);if(e.count<t)throw new RangeError(`GaussianData shCoefficients has ${e.count} items; at least ${t} are required`)}}const Mi={char:1,uchar:1,short:2,ushort:2,int:4,uint:4,float:4,double:8,int8:1,uint8:1,int16:2,uint16:2,int32:4,uint32:4,float32:4,float64:8},Tl=["x","y","z","scale_0","scale_1","scale_2","rot_0","rot_1","rot_2","rot_3","opacity","f_dc_0","f_dc_1","f_dc_2"];class wl{async load(e){const t=await fetch(e);if(!t.ok)throw new Error(`Failed to load PLY: ${t.status} ${t.statusText}`);if(t.headers.get("content-type")?.includes("text/html"))throw new Error(`Failed to load PLY: ${t.url||e} returned HTML instead of a PLY file`);return this.parse(await t.arrayBuffer())}parse(e){const t=Sl(e),s=new Map(t.properties.map((N,T)=>[N.name,T]));for(const N of Tl)if(!s.has(N))throw new Error(`Not a canonical 3DGS PLY: missing property ${N}`);const n=t.properties.map(N=>N.name.match(/^f_rest_(\\d+)$/)?.[1]).filter(N=>N!==void 0).map(Number).sort((N,T)=>N-T);for(let N=0;N<n.length;N++)if(n[N]!==N)throw new Error("f_rest_* properties must be contiguous from f_rest_0");if(n.length%3!==0)throw new Error("f_rest_* property count must be divisible by three");const r=n.length/3,o=r+1,a=Math.sqrt(o);if(!Number.isInteger(a)||a<1||a>4)throw new Error("PLY must contain one, four, nine, or sixteen SH coefficients per channel");const h=Ml(e,t),c=N=>s.get(N),l=n.map(N=>c(`f_rest_${N}`)),u=t.vertexCount,p=new Float32Array(u*4),d=new Float32Array(u*4),f=new Float32Array(u*4),g=new Float32Array(u*o*4);for(let N=0;N<u;N++){const T=N*4;p[T]=h(N,c("x")),p[T+1]=h(N,c("y")),p[T+2]=h(N,c("z")),d[T]=Math.max(Math.exp(h(N,c("scale_0"))),1e-6),d[T+1]=Math.max(Math.exp(h(N,c("scale_1"))),1e-6),d[T+2]=Math.max(Math.exp(h(N,c("scale_2"))),1e-6);const A=h(N,c("opacity"));d[T+3]=1/(1+Math.exp(-A));const v=h(N,c("rot_0")),z=h(N,c("rot_1")),b=h(N,c("rot_2")),F=h(N,c("rot_3")),I=Math.hypot(z,b,F,v);I>1e-12?(f[T]=z/I,f[T+1]=b/I,f[T+2]=F/I,f[T+3]=v/I):f[T+3]=1;const X=N*o*4;g[X]=h(N,c("f_dc_0")),g[X+1]=h(N,c("f_dc_1")),g[X+2]=h(N,c("f_dc_2"));for(let ee=1;ee<o;ee++){const le=X+ee*4,pe=ee-1;for(let ne=0;ne<3;ne++){const ae=l[ne*r+pe];g[le+ne]=h(N,ae)}}}return new Nl({means:ws("ply.means",p),scalesOpacity:ws("ply.scales-opacity",d),rotations:ws("ply.rotations-xyzw",f),shCoefficients:ws("ply.sh-coefficients",g)},{count:u,shDegree:a-1,ownsBuffers:!0})}}function ws(i,e){const t=new fl(e,4);return t.name=i,t}function Sl(i){const e=new Uint8Array(i),t=new TextEncoder().encode("end_header");let s=-1;for(let f=0;f<=e.length-t.length;f++){let g=!0;for(let N=0;N<t.length;N++)if(e[f+N]!==t[N]){g=!1;break}if(g){s=f;break}}if(s<0)throw new Error("Invalid PLY: end_header is missing");let n=s+t.length;if(e[n]===13&&n++,e[n]!==10)throw new Error("Invalid PLY: end_header must terminate a line");n++;const o=new TextDecoder().decode(e.subarray(0,n)).split(/\\r?\\n/);if(o[0]?.trim()!=="ply")throw new Error("Invalid PLY signature");let a=null,h="",c=-1,l=0;const u=[],p=[];for(const f of o){const g=f.trim().split(/\\s+/);if(g[0]==="format"){if(g[1]!=="ascii"&&g[1]!=="binary_little_endian"&&g[1]!=="binary_big_endian")throw new Error(`Unsupported PLY format: ${g[1]??"unknown"}`);a=g[1]}else if(g[0]==="element"){h=g[1]??"";const N=Number(g[2]);if(!Number.isInteger(N)||N<0)throw new Error(`Invalid element count for ${h}`);p.push({name:h,count:N}),h==="vertex"&&(c=N)}else if(g[0]==="property"&&h==="vertex"){if(g[1]==="list")throw new Error("List properties are not supported in the vertex element");const N=g[1],T=g[2];if(!(N in Mi)||T===void 0)throw new Error(`Unsupported vertex property: ${f}`);u.push({name:T,type:N,byteOffset:l}),l+=Mi[N]}}if(a===null)throw new Error("Invalid PLY: format is missing");if(c<=0)throw new Error("PLY must contain at least one vertex");if(p.find(f=>f.count>0)?.name!=="vertex")throw new Error("The canonical 3DGS vertex element must be first");return{format:a,vertexCount:c,properties:u,vertexStride:l,dataOffset:n}}function Ml(i,e){if(e.format==="ascii"){const r=new TextDecoder().decode(new Uint8Array(i,e.dataOffset)),o=new Float64Array(e.vertexCount*e.properties.length);let a=0;for(let h=0;h<o.length;h++){for(;a<r.length&&/\\s/.test(r[a]);)a++;const c=a;for(;a<r.length&&!/\\s/.test(r[a]);)a++;const l=Number(r.slice(c,a));if(!Number.isFinite(l))throw new Error(`Invalid ASCII PLY value at scalar ${h}`);o[h]=l}return(h,c)=>o[h*e.properties.length+c]}if(e.dataOffset+e.vertexCount*e.vertexStride>i.byteLength)throw new Error("Binary PLY ends before the vertex data is complete");const s=new DataView(i),n=e.format==="binary_little_endian";return(r,o)=>{const a=e.properties[o],h=e.dataOffset+r*e.vertexStride+a.byteOffset;return _l(s,h,a.type,n)}}function _l(i,e,t,s){switch(t){case"char":case"int8":return i.getInt8(e);case"uchar":case"uint8":return i.getUint8(e);case"short":case"int16":return i.getInt16(e,s);case"ushort":case"uint16":return i.getUint16(e,s);case"int":case"int32":return i.getInt32(e,s);case"uint":case"uint32":return i.getUint32(e,s);case"float":case"float32":return i.getFloat32(e,s);case"double":case"float64":return i.getFloat64(e,s)}}class _i{constructor(e,t,s){this.octreeNodeId=e,this.sortedGaussianIndices=t,this.levelCounts=s}octreeNodeId;sortedGaussianIndices;levelCounts}const El=[{retention:.2},{retention:.5},{retention:1}];class bn{constructor(e,t){this.octree=e,this.levels=Al(t.levels??El),this.ownsOctree=t.ownsOctree??!1;const s=t.importance??Cl,n=new Float64Array(e.data.count);for(let r=0;r<n.length;r++){const o=s(r,e);n[r]=Number.isFinite(o)?o:-1/0}this.nodes=e.nodes.map(r=>{if(r.gaussianIndices===null)return new _i(r.id,new Uint32Array,new Uint32Array(this.levels.length));const o=Uint32Array.from(Array.from(r.gaussianIndices).sort((a,h)=>n[h]-n[a]||a-h));return new _i(r.id,o,Uint32Array.from(this.levels.map(({retention:a})=>Math.min(o.length,Math.max(1,Math.ceil(o.length*a))))))})}octree;static build(e,t={}){return new bn(e,t)}levels;nodes;ownsOctree;disposed=!1;get levelCount(){return this.levels.length}get finestLevel(){return this.levels.length-1}getNode(e){this.assertUsable();const t=this.nodes[e];if(t===void 0)throw new RangeError(`GaussianLod node ${e} does not exist`);return t}indicesForPacking(e){if(this.assertUsable(),e.nodeIds.length!==e.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const t=new Uint32Array(e.gaussianCount),s=new Set;let n=0;for(let r=0;r<e.nodeIds.length;r++){const o=e.nodeIds[r],a=this.getLeafNode(o);if(s.has(o))throw new Error(`GaussianLodPacking contains duplicate leaf node ${o}`);s.add(o);const h=e.lodLevels[r],c=a.levelCounts[h];if(c===void 0)throw new RangeError(`GaussianLod level ${h} does not exist`);if(n+c>t.length)throw new RangeError("GaussianLodPacking gaussianCount is too small");for(let l=0;l<c;l++)t[n++]=a.sortedGaussianIndices[l]}if(n!==t.length)throw new RangeError(`GaussianLodPacking declares ${t.length} Gaussians but selects ${n}`);return t}raycast(e,t,s={}){this.assertUsable();const n=s.radiusScale??3;if(!(n>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const r=s.maxHits??1/0;if(!(r>0))return[];if(t.nodeIds.length!==t.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const o=this.octree.data.means.array,a=this.octree.data.scalesOpacity.array,h=new S,c=new S,l=[],u=new Set;for(let p=0;p<t.nodeIds.length;p++){const d=t.nodeIds[p],f=this.getLeafNode(d);if(u.has(d))throw new Error(`GaussianLodPacking contains duplicate leaf node ${d}`);u.add(d);const g=t.lodLevels[p],N=f.levelCounts[g];if(N===void 0)throw new RangeError(`GaussianLod level ${g} does not exist`);const T=this.octree.nodes[d],A=Math.max(0,n-3)*T.maxSplatRadius,v=A===0?T.raycastBounds:T.raycastBounds.clone().expandByScalar(A);if(e.intersectsBox(v))for(let z=0;z<N;z++){const b=f.sortedGaussianIndices[z],F=b*4;h.set(o[F],o[F+1],o[F+2]);const I=Math.max(a[F],a[F+1],a[F+2])*n;e.closestPointToPoint(h,c),!(c.distanceToSquared(h)>I*I)&&l.push({gaussianIndex:b,distance:e.origin.distanceTo(c),point:c.clone()})}}return l.sort((p,d)=>p.distance-d.distance),l.length>r&&(l.length=r),l}dispose(){this.disposed||(this.disposed=!0,this.ownsOctree&&this.octree.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianLod has been disposed")}getLeafNode(e){const t=this.getNode(e);if(this.octree.nodes[e]?.isLeaf!==!0)throw new Error(`GaussianLodPacking must reference leaf nodes; node ${e} is internal`);return t}}function Al(i){if(i.length===0||i.length>256)throw new RangeError("GaussianLod requires between 1 and 256 levels");let e=0;const t=i.map(({retention:s})=>{if(!(s>e&&s<=1))throw new RangeError("GaussianLod retention values must increase and stay in (0, 1]");return e=s,Object.freeze({retention:s})});if(Math.abs(e-1)>Number.EPSILON)throw new RangeError("GaussianLod finest retention must be 1");return Object.freeze(t)}function Cl(i,e){const t=e.data.scalesOpacity.array,s=i*4,n=[t[s],t[s+1],t[s+2]];return n.sort((r,o)=>o-r),t[s+3]*n[0]*n[1]}class vl{constructor(e,t,s,n,r,o,a,h){this.id=e,this.depth=t,this.bounds=s,this.count=n,this.maxSplatRadius=r,this.raycastBounds=h,this.children=o,this.gaussianIndices=a}id;depth;bounds;count;maxSplatRadius;raycastBounds;children;gaussianIndices;get isLeaf(){return this.children.length===0}}class zn{constructor(e,t,s,n){this.data=e,this.leafCapacity=t,this.maxDepth=s,this.ownsData=n,this.bounds=bl(e),this.rootBounds=zl(this.bounds);const r=e.means.array,o=e.scalesOpacity.array,a=[],h=[],c=Array.from({length:e.count},(u,p)=>p),l=(u,p,d)=>{const f=a.length;a.push(null);const g=u.length>t&&d<s&&p.max.x-p.min.x>Number.EPSILON,N=[];if(g){const v=p.getCenter(new S),z=Array.from({length:8},()=>[]);for(const b of u){const F=b*4,I=(r[F]>=v.x?1:0)|(r[F+1]>=v.y?2:0)|(r[F+2]>=v.z?4:0);z[I].push(b)}for(let b=0;b<8;b++){const F=z[b];F.length!==0&&N.push(l(F,Fl(p,v,b),d+1))}}let T=0;if(N.length>0)for(const v of N)T=Math.max(T,a[v].maxSplatRadius);else{for(const v of u){const z=v*4;T=Math.max(T,o[z],o[z+1],o[z+2])}h.push(f)}const A=p.clone().expandByScalar(T*3);return a[f]=new vl(f,d,p,u.length,T,N,N.length===0?Uint32Array.from(u):null,A),f};l(c,this.rootBounds.clone(),0),this.nodes=a,this.leafNodeIds=Uint32Array.from(h)}data;leafCapacity;maxDepth;static build(e,t={}){const s=t.leafCapacity??256,n=t.maxDepth??10;if(!Number.isInteger(s)||s<=0)throw new RangeError("GaussianOctree leafCapacity must be positive");if(!Number.isInteger(n)||n<0)throw new RangeError("GaussianOctree maxDepth must be non-negative");return new zn(e,s,n,t.ownsData??!1)}bounds;rootBounds;rootNode=0;nodes;leafNodeIds;ownsData;disposed=!1;raycast(e,t={}){this.assertUsable();const s=t.radiusScale??3;if(!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const n=t.maxHits??1/0;if(!(n>0))return[];const r=[],o=[this.rootNode];for(;o.length>0;){const a=this.nodes[o.pop()],h=Math.max(0,s-3)*a.maxSplatRadius,c=h===0?a.raycastBounds:a.raycastBounds.clone().expandByScalar(h);if(e.intersectsBox(c))if(a.gaussianIndices!==null)for(const l of a.gaussianIndices)r.push(l);else for(const l of a.children)o.push(l)}return this.raycastIndices(e,r,s,n)}raycastIndices(e,t,s=3,n=1/0){if(this.assertUsable(),!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");if(!(n>0))return[];const r=this.data.means.array,o=this.data.scalesOpacity.array,a=new S,h=new S,c=[];for(let l=0;l<t.length;l++){const u=t[l],p=u*4;a.set(r[p],r[p+1],r[p+2]);const d=Math.max(o[p],o[p+1],o[p+2])*s;e.closestPointToPoint(a,h),!(h.distanceToSquared(a)>d*d)&&c.push({gaussianIndex:u,distance:e.origin.distanceTo(h),point:h.clone()})}return c.sort((l,u)=>l.distance-u.distance),c.length>n&&(c.length=n),c}dispose(){this.disposed||(this.disposed=!0,this.ownsData&&this.data.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianOctree has been disposed")}}function bl(i){const e=i.means.array,t=new Ct,s=new S;for(let n=0;n<i.count;n++){const r=n*4;s.set(e[r],e[r+1],e[r+2]),t.expandByPoint(s)}return t}function zl(i){const e=i.getCenter(new S),t=i.getSize(new S),s=Math.max(t.x,t.y,t.z,1e-6)*.5;return new Ct(new S(e.x-s,e.y-s,e.z-s),new S(e.x+s,e.y+s,e.z+s))}function Fl(i,e,t){return new Ct(new S(t&1?e.x:i.min.x,t&2?e.y:i.min.y,t&4?e.z:i.min.z),new S(t&1?i.max.x:e.x,t&2?i.max.y:e.y,t&4?i.max.z:e.z))}function Rl(i,e,t){const s=Math.max(Math.abs(i),Math.abs(e),Math.abs(t));if(!Number.isFinite(s))throw new RangeError("SH coefficients must be finite");if(s===0)return 0;const n=Math.min(127,Math.max(-126,Math.ceil(Math.log2(s)))),r=127/2**n,o=Fn(i,r),a=Fn(e,r),h=Fn(t,r),c=n+127;return(o|a<<8|h<<16|c<<24)>>>0}function Fn(i,e){return Math.min(127,Math.max(-127,Math.round(i*e)))&255}function Il(i){if(!Number.isInteger(i)||i<0)throw new RangeError("Gaussian LOD budget must be a non-negative integer")}function Ll(i,e,t){return i.updateWorldMatrix(!0,!1),e.updateWorldMatrix(!0,!1),i.getWorldPosition(t),e.worldToLocal(t)}function Ol(i,e){const t=e instanceof S?e.clone():i.octree.bounds.getCenter(new S),s=i.octree.rootBounds.getSize(new S),n=Math.max(s.length()*.5,Number.EPSILON),r=new S,o=Array.from(i.octree.leafNodeIds,a=>(i.octree.nodes[a].bounds.getCenter(r),{nodeId:a,radius:r.distanceTo(t)/n}));return o.sort((a,h)=>a.radius-h.radius||a.nodeId-h.nodeId),o}class Pl{cameraCenter=new S;center;levelDistance;constructor(e={}){if(this.center=e.center instanceof S?e.center.clone():e.center??"bounds-center",this.levelDistance=e.levelDistance??2,!(this.levelDistance>0)||!Number.isFinite(this.levelDistance))throw new RangeError("Radial LOD levelDistance must be finite and positive")}setCenter(e){return this.center=e instanceof S?e.clone():e,this}setFromCamera(e,t){return this.setCenter(Ll(e,t,this.cameraCenter))}pack({lod:e,maxGaussians:t}){if(Il(t),t===0)return Bl();const s=Ol(e,this.center),n=s.map(({radius:a})=>Math.max(0,e.finestLevel-Math.floor(a/this.levelDistance)));let r=s.reduce((a,h,c)=>a+e.nodes[h.nodeId].levelCounts[n[c]],0);for(let a=s.length-1;a>=0&&r>t;a--){const h=e.nodes[s[a].nodeId];for(;n[a]>0&&r>t;){const c=h.levelCounts[n[a]];n[a]=n[a]-1,r-=c-h.levelCounts[n[a]]}}let o=s.length;for(;o>0&&r>t;){o--;const a=e.nodes[s[o].nodeId];r-=a.levelCounts[n[o]]}return{nodeIds:Uint32Array.from(s.slice(0,o).map(({nodeId:a})=>a)),lodLevels:Uint8Array.from(n.slice(0,o)),gaussianCount:r}}}function Bl(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}function Dl(i){const e=i.nodes,t=new Float32Array(e.length*7),s=new Uint32Array(e.length*2),n=new Uint32Array(e.length*2),r=[],o=[];for(const h of e){const c=h.id*7,{min:l,max:u}=h.raycastBounds;if(t.set([l.x,l.y,l.z,u.x,u.y,u.z,h.maxSplatRadius],c),s.set([r.length,h.children.length],h.id*2),r.push(...h.children),n.set([o.length,h.gaussianIndices?.length??0],h.id*2),h.gaussianIndices!==null)for(const p of h.gaussianIndices)o.push(p)}const a=i.data;return{means:a.means.array.slice().buffer,scalesOpacity:a.scalesOpacity.array.slice().buffer,rotations:a.rotations.array.slice().buffer,nodeBounds:t.buffer,nodeChildren:s.buffer,children:Uint32Array.from(r).buffer,nodeIndices:n.buffer,indices:Uint32Array.from(o).buffer}}const St=new Map,Ss=new Set,Ei=new wl,Yt=globalThis;Yt.onmessage=({data:i})=>{Ul(i).catch(e=>{Yt.postMessage({type:"error",requestId:i.requestId,resourceId:i.resourceId,message:e instanceof Error?e.message:String(e)})})};async function Ul(i){if(i.type==="release"){Ss.add(i.resourceId),St.get(i.resourceId)?.lod.dispose(),St.delete(i.resourceId),Yt.postMessage({type:"released",requestId:i.requestId,resourceId:i.resourceId});return}if(i.type==="load-url"||i.type==="load-buffer"){if(St.has(i.resourceId)||Ss.has(i.resourceId))throw new Error("Resource already exists or was released");const t=i.type==="load-url"?await Ei.load(i.url):Ei.parse(i.buffer);if(Ss.has(i.resourceId))throw t.dispose(),new Error("Gaussian resource released during load");let s=null,n=null;try{if(s=zn.build(t,{...i.options.octree,ownsData:!0}),n=bn.build(s,{...i.options.lod,ownsOctree:!0}),St.has(i.resourceId)||Ss.has(i.resourceId))throw new Error("Resource already exists or was released");St.set(i.resourceId,{lod:n,packing:null});const{min:r,max:o}=s.bounds,a=Dl(s);Yt.postMessage({type:"loaded",requestId:i.requestId,resourceId:i.resourceId,count:t.count,shDegree:t.shDegree,bounds:[r.x,r.y,r.z,o.x,o.y,o.z],raycast:a},Object.values(a))}catch(r){throw n!==null?n.dispose():s!==null?s.dispose():t.dispose(),r}return}const e=St.get(i.resourceId);if(e===void 0)throw new Error(`Unknown Gaussian resource: ${i.resourceId}`);if(i.type==="select"){const s=new Pl({center:new S(...i.center),levelDistance:i.levelDistance}).pack({lod:e.lod,maxGaussians:i.maxGaussians}),n=Vl(e.lod,s),r=e.lod.indicesForPacking(s).buffer;e.packing=s,Yt.postMessage({type:"selected",requestId:i.requestId,resourceId:i.resourceId,revision:i.revision,count:s.gaussianCount,shDegree:e.lod.octree.data.shDegree,buffers:n,renderedIndices:r},[...Object.values(n),r]);return}}function Vl(i,e){const t=i.octree.data,s=i.indicesForPacking(e),n=new Float32Array(s.length*4),r=new Float32Array(s.length*4),o=new Float32Array(s.length*4),a=t.shCoefficientCount,h=new Uint32Array(s.length*a),c=t.means.array,l=t.scalesOpacity.array,u=t.rotations.array,p=t.shCoefficients.array;for(let d=0;d<s.length;d++){const f=s[d];n.set(c.subarray(f*4,f*4+4),d*4),r.set(l.subarray(f*4,f*4+4),d*4),o.set(u.subarray(f*4,f*4+4),d*4);for(let g=0;g<a;g++){const N=(f*a+g)*4;h[d*a+g]=Rl(p[N],p[N+1],p[N+2])}}return{means:n.buffer,scalesOpacity:r.buffer,rotations:o.buffer,shCoefficients:h.buffer}}})();\n', Ls = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", rr], { type: "text/javascript;charset=utf-8" });
function ni(a) {
  let t;
  try {
    if (t = Ls && (self.URL || self.webkitURL).createObjectURL(Ls), !t) throw "";
    const e = new Worker(t, {
      name: a?.name
    });
    return e.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), e;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(rr),
      {
        name: a?.name
      }
    );
  }
}
class ua {
  transport;
  ownsTransport;
  pending = /* @__PURE__ */ new Map();
  revisions = /* @__PURE__ */ new Map();
  released = /* @__PURE__ */ new Set();
  nextRequestId = 0;
  nextResourceId = 0;
  disposed = !1;
  constructor(t) {
    this.ownsTransport = t === void 0, this.transport = t ?? new ni({ name: "3dgs-data" }), this.transport.addEventListener("message", this.handleMessage);
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
    const n = await this.send({
      type: "select",
      resourceId: t,
      revision: i,
      center: e,
      maxGaussians: s,
      levelDistance: r
    });
    if (n.type !== "selected")
      throw new Error("Unexpected Gaussian selection response");
    if (this.revisions.get(t) !== n.revision)
      throw new Error("Stale Gaussian selection response");
    return n;
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
    return new Promise((i, n) => {
      this.pending.set(s, {
        resourceId: t.resourceId,
        resolve: i,
        reject: n
      });
      try {
        this.transport.postMessage(r, e);
      } catch (o) {
        this.pending.delete(s), n(o);
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
const Is = 1 / 255, ai = 0.99, Le = 1e-12;
function ir(a, t, e, s) {
  if (!(s > 0 && s < 1))
    throw new RangeError(
      "Gaussian raycast alphaThreshold must be between 0 and 1"
    );
  const r = t.means.array, i = t.scalesOpacity.array, n = t.rotations.array, o = new P(), l = new P(), h = new P(), u = new Hr();
  let p = 1;
  for (const d of e) {
    const m = d.gaussianIndex * 4, g = Math.min(1, Math.max(0, i[m + 3]));
    if (g < Is) continue;
    u.set(
      -n[m],
      -n[m + 1],
      -n[m + 2],
      n[m + 3]
    ).normalize(), o.set(
      a.origin.x - r[m],
      a.origin.y - r[m + 1],
      a.origin.z - r[m + 2]
    ).applyQuaternion(u), l.copy(a.direction).applyQuaternion(u);
    const f = Math.max(i[m], Le), c = Math.max(i[m + 1], Le), y = Math.max(i[m + 2], Le);
    o.set(
      o.x / f,
      o.y / c,
      o.z / y
    ), l.set(
      l.x / f,
      l.y / c,
      l.z / y
    );
    const _ = l.lengthSq();
    if (_ <= Number.EPSILON) continue;
    const M = Math.max(
      0,
      -o.dot(l) / _
    );
    h.copy(o).addScaledVector(l, M);
    const v = Math.min(
      ai,
      g * Math.exp(-0.5 * h.lengthSq())
    );
    if (v < Is || (p *= 1 - v, 1 - p < s)) continue;
    const b = a.at(M, new P());
    return {
      gaussianIndex: d.gaussianIndex,
      distance: a.origin.distanceTo(b),
      point: b
    };
  }
  return null;
}
class oi {
  constructor(t, e, s, r, i, n, o, l) {
    this.id = t, this.depth = e, this.bounds = s, this.count = r, this.maxSplatRadius = i, this.raycastBounds = l, this.children = n, this.gaussianIndices = o;
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
class Vt {
  constructor(t, e, s, r) {
    this.data = t, this.leafCapacity = e, this.maxDepth = s, this.ownsData = r, this.bounds = li(t), this.rootBounds = hi(this.bounds);
    const i = t.means.array, n = t.scalesOpacity.array, o = [], l = [], h = Array.from({ length: t.count }, (p, d) => d), u = (p, d, m) => {
      const g = o.length;
      o.push(null);
      const f = p.length > e && m < s && d.max.x - d.min.x > Number.EPSILON, c = [];
      if (f) {
        const M = d.getCenter(new P()), v = Array.from({ length: 8 }, () => []);
        for (const b of p) {
          const T = b * 4, k = (i[T] >= M.x ? 1 : 0) | (i[T + 1] >= M.y ? 2 : 0) | (i[T + 2] >= M.z ? 4 : 0);
          v[k].push(b);
        }
        for (let b = 0; b < 8; b++) {
          const T = v[b];
          T.length !== 0 && c.push(
            u(
              T,
              ui(d, M, b),
              m + 1
            )
          );
        }
      }
      let y = 0;
      if (c.length > 0)
        for (const M of c)
          y = Math.max(
            y,
            o[M].maxSplatRadius
          );
      else {
        for (const M of p) {
          const v = M * 4;
          y = Math.max(
            y,
            n[v],
            n[v + 1],
            n[v + 2]
          );
        }
        l.push(g);
      }
      const _ = d.clone().expandByScalar(y * 3);
      return o[g] = new oi(
        g,
        m,
        d,
        p.length,
        y,
        c,
        c.length === 0 ? Uint32Array.from(p) : null,
        _
      ), g;
    };
    u(h, this.rootBounds.clone(), 0), this.nodes = o, this.leafNodeIds = Uint32Array.from(l);
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
    return new Vt(
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
    const i = [], n = [this.rootNode];
    for (; n.length > 0; ) {
      const o = this.nodes[n.pop()], l = Math.max(0, s - 3) * o.maxSplatRadius, h = l === 0 ? o.raycastBounds : o.raycastBounds.clone().expandByScalar(l);
      if (t.intersectsBox(h))
        if (o.gaussianIndices !== null)
          for (const u of o.gaussianIndices) i.push(u);
        else
          for (const u of o.children) n.push(u);
    }
    return this.raycastIndices(t, i, s, r);
  }
  raycastIndices(t, e, s = 3, r = 1 / 0) {
    if (this.assertUsable(), !(s > 0))
      throw new RangeError(
        "GaussianOctree raycast radiusScale must be positive"
      );
    if (!(r > 0)) return [];
    const i = this.data.means.array, n = this.data.scalesOpacity.array, o = new P(), l = new P(), h = [];
    for (let u = 0; u < e.length; u++) {
      const p = e[u], d = p * 4;
      o.set(i[d], i[d + 1], i[d + 2]);
      const m = Math.max(
        n[d],
        n[d + 1],
        n[d + 2]
      ) * s;
      t.closestPointToPoint(o, l), !(l.distanceToSquared(o) > m * m) && h.push({
        gaussianIndex: p,
        distance: t.origin.distanceTo(l),
        point: l.clone()
      });
    }
    return h.sort((u, p) => u.distance - p.distance), h.length > r && (h.length = r), h;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.ownsData && this.data.dispose());
  }
  assertUsable() {
    if (this.disposed) throw new Error("GaussianOctree has been disposed");
  }
}
function li(a) {
  const t = a.means.array, e = new We(), s = new P();
  for (let r = 0; r < a.count; r++) {
    const i = r * 4;
    s.set(t[i], t[i + 1], t[i + 2]), e.expandByPoint(s);
  }
  return e;
}
function hi(a) {
  const t = a.getCenter(new P()), e = a.getSize(new P()), s = Math.max(e.x, e.y, e.z, 1e-6) * 0.5;
  return new We(
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
function ui(a, t, e) {
  return new We(
    new P(
      e & 1 ? t.x : a.min.x,
      e & 2 ? t.y : a.min.y,
      e & 4 ? t.z : a.min.z
    ),
    new P(
      e & 1 ? a.max.x : t.x,
      e & 2 ? a.max.y : t.y,
      e & 4 ? a.max.z : t.z
    )
  );
}
class ue {
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
      const l = [0], h = new Er();
      for (; l.length > 0; ) {
        const u = l.pop(), p = u * 7;
        if (h.min.set(
          this.bounds[p],
          this.bounds[p + 1],
          this.bounds[p + 2]
        ), h.max.set(
          this.bounds[p + 3],
          this.bounds[p + 4],
          this.bounds[p + 5]
        ), !t.intersectsBox(h)) continue;
        const d = this.nodeChildren[u * 2], m = this.nodeChildren[u * 2 + 1];
        if (m > 0)
          for (let g = 0; g < m; g++)
            l.push(this.children[d + g]);
        else {
          const g = this.nodeIndices[u * 2], f = this.nodeIndices[u * 2 + 1];
          for (let c = 0; c < f; c++)
            r.push(this.indices[g + c]);
        }
      }
    }
    const i = new Y(), n = new Y(), o = [];
    for (const l of r) {
      const h = l * 4;
      i.set(
        this.means[h],
        this.means[h + 1],
        this.means[h + 2]
      );
      const u = Math.max(
        this.scalesOpacity[h],
        this.scalesOpacity[h + 1],
        this.scalesOpacity[h + 2]
      ) * 3;
      t.closestPointToPoint(i, n), !(n.distanceToSquared(i) > u * u) && o.push({
        gaussianIndex: l,
        distance: t.origin.distanceTo(n),
        point: n.clone()
      });
    }
    return o.sort((l, h) => l.distance - h.distance), ir(
      t,
      {
        means: { array: this.means },
        scalesOpacity: { array: this.scalesOpacity },
        rotations: { array: this.rotations }
      },
      o,
      s
    );
  }
}
class de extends Ks {
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
  constructor(t, e, s, r = "GaussianCloud", i = null, n = null, o = 0) {
    super(), this.ownerStore = t, this.objectId = e, this.packedGaussianCount = s, this.lod = i, this.packing = n, this.priority = o, this.name = r;
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
    const s = new Dt().copy(this.matrixWorld).invert(), r = new kr().copy(t.ray).applyMatrix4(s), i = this.raycastIndex !== null ? this.raycastIndex.raycast(
      r,
      "full",
      this.raycastAlphaThreshold
    ) : ir(
      r,
      this.lod.octree.data,
      this.raycastMode === "full" ? this.lod.octree.raycast(r) : this.lod.raycast(r, this.packing),
      this.raycastAlphaThreshold
    );
    if (i !== null) {
      const n = i.point.clone().applyMatrix4(this.matrixWorld), o = t.ray.origin.distanceTo(n);
      o >= t.near && o <= t.far && e.push({
        distance: o,
        point: n,
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
function Zt(a, t, e) {
  if (a.length === 0) return [];
  a.sort((p, d) => p - d);
  const s = [];
  let r = a[0], i = r, n = 1;
  for (let p = 1; p <= a.length; p++) {
    const d = a[p];
    if (d !== i) {
      if (d !== void 0 && n++, d === i + 1) {
        i = d;
        continue;
      }
      s.push({ start: r, count: i - r + 1 }), d !== void 0 && (r = i = d);
    }
  }
  if (s.length < 2) return s;
  const o = Math.floor(n * e);
  let l = 0;
  const h = [];
  let u = { ...s[0] };
  for (let p = 1; p < s.length; p++) {
    const d = s[p], m = u.start + u.count, g = d.start - m;
    g <= t && l + g <= o ? (u.count = d.start + d.count - u.start, l += g) : (h.push(u), u = { ...d });
  }
  return h.push(u), h;
}
function Jt(a) {
  let t = 0;
  for (const e of a) t += e.count;
  return t;
}
function H(a, t, e) {
  if (t.length !== 0) {
    for (const s of t)
      a.addUpdateRange(
        s.start * e,
        s.count * e
      );
    a.needsUpdate = !0;
  }
}
const ee = /* @__PURE__ */ Symbol(
  "replaceGaussianStoreAttribute"
), me = /* @__PURE__ */ Symbol(
  "updateGaussianStoreAttribute"
), nr = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttribute"
);
class ci {
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
  [ee](t) {
    this.assertUsable();
    const e = this.packedBuffer, s = new gt(t, 1);
    s.name = `3dgs.store.attribute.${this.name}`, this.packedBuffer = s, e?.dispose();
  }
  [me](t) {
    H(this.bufferAttribute, t, 1);
  }
  [nr]() {
    this.disposed || (this.disposed = !0, this.packedBuffer?.dispose(), this.packedBuffer = null);
  }
  assertUsable() {
    if (this.disposed)
      throw new Error(`GaussianStore attribute ${this.name} has been disposed`);
  }
}
const ge = /* @__PURE__ */ Symbol(
  "enableGaussianStoreAttribute"
), fe = /* @__PURE__ */ Symbol(
  "disposeGaussianStoreAttributes"
);
class qe {
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
  [ge](t, e) {
    const s = this.attributes.get(t);
    if (s !== void 0) {
      if (s.format !== e)
        throw new Error(
          `GaussianStore attribute ${t} already uses format ${s.format}`
        );
      return s;
    }
    const r = new ci(t, e);
    return this.attributes.set(t, r), r;
  }
  [fe]() {
    for (const t of this.attributes.values())
      t[nr]();
    this.attributes.clear();
  }
}
const ar = '(function(){"use strict";const vt="srgb",li="srgb-linear",hi="linear",ze="srgb",yo={TEXTURE_COMPARE:"depthTextureCompare"};function ci(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}const ui={};function qs(...r){const t="THREE."+r.shift();console.log(t,...r)}function di(r){const t=r[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=r[1];e&&e.isStackTrace?r[0]+=" "+e.getLocation():r[1]=\'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.\'}return r}function O(...r){r=di(r);const t="THREE."+r.shift();{const e=r[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...r)}}function K(...r){r=di(r);const t="THREE."+r.shift();{const e=r[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...r)}}function Xt(...r){const t=r.join(" ");t in ui||(ui[t]=!0,O(...r))}class we{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const s=this._listeners;s[t]===void 0&&(s[t]=[]),s[t].indexOf(e)===-1&&s[t].push(e)}hasEventListener(t,e){const s=this._listeners;return s===void 0?!1:s[t]!==void 0&&s[t].indexOf(e)!==-1}removeEventListener(t,e){const s=this._listeners;if(s===void 0)return;const n=s[t];if(n!==void 0){const i=n.indexOf(e);i!==-1&&n.splice(i,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const s=e[t.type];if(s!==void 0){t.target=this;const n=s.slice(0);for(let i=0,o=n.length;i<o;i++)n[i].call(this,t);t.target=null}}}const ht=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let pi=1234567;const Fe=Math.PI/180,as=180/Math.PI;function ae(){const r=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,s=Math.random()*4294967295|0;return(ht[r&255]+ht[r>>8&255]+ht[r>>16&255]+ht[r>>24&255]+"-"+ht[t&255]+ht[t>>8&255]+"-"+ht[t>>16&15|64]+ht[t>>24&255]+"-"+ht[e&63|128]+ht[e>>8&255]+"-"+ht[e>>16&255]+ht[e>>24&255]+ht[s&255]+ht[s>>8&255]+ht[s>>16&255]+ht[s>>24&255]).toLowerCase()}function k(r,t,e){return Math.max(t,Math.min(e,r))}function Hs(r,t){return(r%t+t)%t}function xo(r,t,e,s,n){return s+(r-t)*(n-s)/(e-t)}function wo(r,t,e){return r!==t?(e-r)/(t-r):0}function Pe(r,t,e){return(1-e)*r+e*t}function No(r,t,e,s){return Pe(r,t,1-Math.exp(-e*s))}function To(r,t=1){return t-Math.abs(Hs(r,t*2)-t)}function So(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*(3-2*r))}function vo(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*r*(r*(r*6-15)+10))}function Mo(r,t){return r+Math.floor(Math.random()*(t-r+1))}function Co(r,t){return r+Math.random()*(t-r)}function bo(r){return r*(.5-Math.random())}function Eo(r){r!==void 0&&(pi=r);let t=pi+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ao(r){return r*Fe}function _o(r){return r*as}function Ro(r){return(r&r-1)===0&&r!==0}function Lo(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function Io(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function zo(r,t,e,s,n){const i=Math.cos,o=Math.sin,a=i(e/2),l=o(e/2),h=i((t+s)/2),c=o((t+s)/2),u=i((t-s)/2),d=o((t-s)/2),p=i((s-t)/2),f=o((s-t)/2);switch(n){case"XYX":r.set(a*c,l*u,l*d,a*h);break;case"YZY":r.set(l*d,a*c,l*u,a*h);break;case"ZXZ":r.set(l*u,l*d,a*c,a*h);break;case"XZX":r.set(a*c,l*f,l*p,a*h);break;case"YXY":r.set(l*p,a*c,l*f,a*h);break;case"ZYZ":r.set(l*f,l*p,a*c,a*h);break;default:O("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function Mt(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function q(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Fo={DEG2RAD:Fe,RAD2DEG:as,generateUUID:ae,clamp:k,euclideanModulo:Hs,mapLinear:xo,inverseLerp:wo,lerp:Pe,damp:No,pingpong:To,smoothstep:So,smootherstep:vo,randInt:Mo,randFloat:Co,randFloatSpread:bo,seededRandom:Eo,degToRad:Ao,radToDeg:_o,isPowerOfTwo:Ro,ceilPowerOfTwo:Lo,floorPowerOfTwo:Io,setQuaternionFromProperEuler:zo,normalize:q,denormalize:Mt},ni=class ni{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,s=this.y,n=t.elements;return this.x=n[0]*e+n[3]*s+n[6],this.y=n[1]*e+n[4]*s+n[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=k(this.x,t.x,e.x),this.y=k(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=k(this.x,t,e),this.y=k(this.y,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(k(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(k(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y;return e*e+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const s=Math.cos(e),n=Math.sin(e),i=this.x-t.x,o=this.y-t.y;return this.x=i*s-o*n+t.x,this.y=i*n+o*s+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};ni.prototype.isVector2=!0;let mt=ni;class le{constructor(t=0,e=0,s=0,n=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=s,this._w=n}static slerpFlat(t,e,s,n,i,o,a){let l=s[n+0],h=s[n+1],c=s[n+2],u=s[n+3],d=i[o+0],p=i[o+1],f=i[o+2],m=i[o+3];if(u!==m||l!==d||h!==p||c!==f){let y=l*d+h*p+c*f+u*m;y<0&&(d=-d,p=-p,f=-f,m=-m,y=-y);let w=1-a;if(y<.9995){const M=Math.acos(y),C=Math.sin(M);w=Math.sin(w*M)/C,a=Math.sin(a*M)/C,l=l*w+d*a,h=h*w+p*a,c=c*w+f*a,u=u*w+m*a}else{l=l*w+d*a,h=h*w+p*a,c=c*w+f*a,u=u*w+m*a;const M=1/Math.sqrt(l*l+h*h+c*c+u*u);l*=M,h*=M,c*=M,u*=M}}t[e]=l,t[e+1]=h,t[e+2]=c,t[e+3]=u}static multiplyQuaternionsFlat(t,e,s,n,i,o){const a=s[n],l=s[n+1],h=s[n+2],c=s[n+3],u=i[o],d=i[o+1],p=i[o+2],f=i[o+3];return t[e]=a*f+c*u+l*p-h*d,t[e+1]=l*f+c*d+h*u-a*p,t[e+2]=h*f+c*p+a*d-l*u,t[e+3]=c*f-a*u-l*d-h*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,s,n){return this._x=t,this._y=e,this._z=s,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const s=t._x,n=t._y,i=t._z,o=t._order,a=Math.cos,l=Math.sin,h=a(s/2),c=a(n/2),u=a(i/2),d=l(s/2),p=l(n/2),f=l(i/2);switch(o){case"XYZ":this._x=d*c*u+h*p*f,this._y=h*p*u-d*c*f,this._z=h*c*f+d*p*u,this._w=h*c*u-d*p*f;break;case"YXZ":this._x=d*c*u+h*p*f,this._y=h*p*u-d*c*f,this._z=h*c*f-d*p*u,this._w=h*c*u+d*p*f;break;case"ZXY":this._x=d*c*u-h*p*f,this._y=h*p*u+d*c*f,this._z=h*c*f+d*p*u,this._w=h*c*u-d*p*f;break;case"ZYX":this._x=d*c*u-h*p*f,this._y=h*p*u+d*c*f,this._z=h*c*f-d*p*u,this._w=h*c*u+d*p*f;break;case"YZX":this._x=d*c*u+h*p*f,this._y=h*p*u+d*c*f,this._z=h*c*f-d*p*u,this._w=h*c*u-d*p*f;break;case"XZY":this._x=d*c*u-h*p*f,this._y=h*p*u-d*c*f,this._z=h*c*f+d*p*u,this._w=h*c*u+d*p*f;break;default:O("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const s=e/2,n=Math.sin(s);return this._x=t.x*n,this._y=t.y*n,this._z=t.z*n,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,s=e[0],n=e[4],i=e[8],o=e[1],a=e[5],l=e[9],h=e[2],c=e[6],u=e[10],d=s+a+u;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(c-l)*p,this._y=(i-h)*p,this._z=(o-n)*p}else if(s>a&&s>u){const p=2*Math.sqrt(1+s-a-u);this._w=(c-l)/p,this._x=.25*p,this._y=(n+o)/p,this._z=(i+h)/p}else if(a>u){const p=2*Math.sqrt(1+a-s-u);this._w=(i-h)/p,this._x=(n+o)/p,this._y=.25*p,this._z=(l+c)/p}else{const p=2*Math.sqrt(1+u-s-a);this._w=(o-n)/p,this._x=(i+h)/p,this._y=(l+c)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let s=t.dot(e)+1;return s<1e-8?(s=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=s):(this._x=0,this._y=-t.z,this._z=t.y,this._w=s)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=s),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(k(this.dot(t),-1,1)))}rotateTowards(t,e){const s=this.angleTo(t);if(s===0)return this;const n=Math.min(1,e/s);return this.slerp(t,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const s=t._x,n=t._y,i=t._z,o=t._w,a=e._x,l=e._y,h=e._z,c=e._w;return this._x=s*c+o*a+n*h-i*l,this._y=n*c+o*l+i*a-s*h,this._z=i*c+o*h+s*l-n*a,this._w=o*c-s*a-n*l-i*h,this._onChangeCallback(),this}slerp(t,e){let s=t._x,n=t._y,i=t._z,o=t._w,a=this.dot(t);a<0&&(s=-s,n=-n,i=-i,o=-o,a=-a);let l=1-e;if(a<.9995){const h=Math.acos(a),c=Math.sin(h);l=Math.sin(l*h)/c,e=Math.sin(e*h)/c,this._x=this._x*l+s*e,this._y=this._y*l+n*e,this._z=this._z*l+i*e,this._w=this._w*l+o*e,this._onChangeCallback()}else this._x=this._x*l+s*e,this._y=this._y*l+n*e,this._z=this._z*l+i*e,this._w=this._w*l+o*e,this.normalize();return this}slerpQuaternions(t,e,s){return this.copy(t).slerp(e,s)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),s=Math.random(),n=Math.sqrt(1-s),i=Math.sqrt(s);return this.set(n*Math.sin(t),n*Math.cos(t),i*Math.sin(e),i*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const ii=class ii{constructor(t=0,e=0,s=0){this.x=t,this.y=e,this.z=s}set(t,e,s){return s===void 0&&(s=this.z),this.x=t,this.y=e,this.z=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(fi.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(fi.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,s=this.y,n=this.z,i=t.elements;return this.x=i[0]*e+i[3]*s+i[6]*n,this.y=i[1]*e+i[4]*s+i[7]*n,this.z=i[2]*e+i[5]*s+i[8]*n,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,s=this.y,n=this.z,i=t.elements,o=1/(i[3]*e+i[7]*s+i[11]*n+i[15]);return this.x=(i[0]*e+i[4]*s+i[8]*n+i[12])*o,this.y=(i[1]*e+i[5]*s+i[9]*n+i[13])*o,this.z=(i[2]*e+i[6]*s+i[10]*n+i[14])*o,this}applyQuaternion(t){const e=this.x,s=this.y,n=this.z,i=t.x,o=t.y,a=t.z,l=t.w,h=2*(o*n-a*s),c=2*(a*e-i*n),u=2*(i*s-o*e);return this.x=e+l*h+o*u-a*c,this.y=s+l*c+a*h-i*u,this.z=n+l*u+i*c-o*h,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,s=this.y,n=this.z,i=t.elements;return this.x=i[0]*e+i[4]*s+i[8]*n,this.y=i[1]*e+i[5]*s+i[9]*n,this.z=i[2]*e+i[6]*s+i[10]*n,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=k(this.x,t.x,e.x),this.y=k(this.y,t.y,e.y),this.z=k(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=k(this.x,t,e),this.y=k(this.y,t,e),this.z=k(this.z,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(k(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const s=t.x,n=t.y,i=t.z,o=e.x,a=e.y,l=e.z;return this.x=n*l-i*a,this.y=i*o-s*l,this.z=s*a-n*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const s=t.dot(this)/e;return this.copy(t).multiplyScalar(s)}projectOnPlane(t){return js.copy(this).projectOnVector(t),this.sub(js)}reflect(t){return this.sub(js.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(k(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y,n=this.z-t.z;return e*e+s*s+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,s){const n=Math.sin(e)*t;return this.x=n*Math.sin(s),this.y=Math.cos(e)*t,this.z=n*Math.cos(s),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,s){return this.x=t*Math.sin(e),this.y=s,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),s=this.setFromMatrixColumn(t,1).length(),n=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=s,this.z=n,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,s=Math.sqrt(1-e*e);return this.x=s*Math.cos(t),this.y=e,this.z=s*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};ii.prototype.isVector3=!0;let T=ii;const js=new T,fi=new le,ri=class ri{constructor(t,e,s,n,i,o,a,l,h){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,s,n,i,o,a,l,h)}set(t,e,s,n,i,o,a,l,h){const c=this.elements;return c[0]=t,c[1]=n,c[2]=a,c[3]=e,c[4]=i,c[5]=l,c[6]=s,c[7]=o,c[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],this}extractBasis(t,e,s){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,n=e.elements,i=this.elements,o=s[0],a=s[3],l=s[6],h=s[1],c=s[4],u=s[7],d=s[2],p=s[5],f=s[8],m=n[0],y=n[3],w=n[6],M=n[1],C=n[4],b=n[7],S=n[2],R=n[5],I=n[8];return i[0]=o*m+a*M+l*S,i[3]=o*y+a*C+l*R,i[6]=o*w+a*b+l*I,i[1]=h*m+c*M+u*S,i[4]=h*y+c*C+u*R,i[7]=h*w+c*b+u*I,i[2]=d*m+p*M+f*S,i[5]=d*y+p*C+f*R,i[8]=d*w+p*b+f*I,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[1],n=t[2],i=t[3],o=t[4],a=t[5],l=t[6],h=t[7],c=t[8];return e*o*c-e*a*h-s*i*c+s*a*l+n*i*h-n*o*l}invert(){const t=this.elements,e=t[0],s=t[1],n=t[2],i=t[3],o=t[4],a=t[5],l=t[6],h=t[7],c=t[8],u=c*o-a*h,d=a*l-c*i,p=h*i-o*l,f=e*u+s*d+n*p;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);const m=1/f;return t[0]=u*m,t[1]=(n*h-c*s)*m,t[2]=(a*s-n*o)*m,t[3]=d*m,t[4]=(c*e-n*l)*m,t[5]=(n*i-a*e)*m,t[6]=p*m,t[7]=(s*l-h*e)*m,t[8]=(o*e-s*i)*m,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,s,n,i,o,a){const l=Math.cos(i),h=Math.sin(i);return this.set(s*l,s*h,-s*(l*o+h*a)+o+t,-n*h,n*l,-n*(-h*o+l*a)+a+e,0,0,1),this}scale(t,e){return Xt("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ys.makeScale(t,e)),this}rotate(t){return Xt("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ys.makeRotation(-t)),this}translate(t,e){return Xt("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ys.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,s,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,s=t.elements;for(let n=0;n<9;n++)if(e[n]!==s[n])return!1;return!0}fromArray(t,e=0){for(let s=0;s<9;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t}clone(){return new this.constructor().fromArray(this.elements)}};ri.prototype.isMatrix3=!0;let Rt=ri;const Ys=new Rt,gi=new Rt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),mi=new Rt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Po(){const r={enabled:!0,workingColorSpace:li,spaces:{},convert:function(n,i,o){return this.enabled===!1||i===o||!i||!o||(this.spaces[i].transfer===ze&&(n.r=Ut(n.r),n.g=Ut(n.g),n.b=Ut(n.b)),this.spaces[i].primaries!==this.spaces[o].primaries&&(n.applyMatrix3(this.spaces[i].toXYZ),n.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===ze&&(n.r=Ne(n.r),n.g=Ne(n.g),n.b=Ne(n.b))),n},workingToColorSpace:function(n,i){return this.convert(n,this.workingColorSpace,i)},colorSpaceToWorking:function(n,i){return this.convert(n,i,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===""?hi:this.spaces[n].transfer},getToneMappingMode:function(n){return this.spaces[n].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(n,i=this.workingColorSpace){return n.fromArray(this.spaces[i].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,i,o){return n.copy(this.spaces[i].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(n,i){return Xt("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),r.workingToColorSpace(n,i)},toWorkingColorSpace:function(n,i){return Xt("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),r.colorSpaceToWorking(n,i)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],s=[.3127,.329];return r.define({[li]:{primaries:t,whitePoint:s,transfer:hi,toXYZ:gi,fromXYZ:mi,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:vt},outputColorSpaceConfig:{drawingBufferColorSpace:vt}},[vt]:{primaries:t,whitePoint:s,transfer:ze,toXYZ:gi,fromXYZ:mi,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:vt}}}),r}const it=Po();function Ut(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Ne(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}let Te;class Oo{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let s;if(t instanceof HTMLCanvasElement)s=t;else{Te===void 0&&(Te=ci("canvas")),Te.width=t.width,Te.height=t.height;const n=Te.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),s=Te}return s.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=ci("canvas");e.width=t.width,e.height=t.height;const s=e.getContext("2d");s.drawImage(t,0,0,t.width,t.height);const n=s.getImageData(0,0,t.width,t.height),i=n.data;for(let o=0;o<i.length;o++)i[o]=Ut(i[o]/255)*255;return s.putImageData(n,0,0),e}else if(t.data){const e=t.data.slice(0);for(let s=0;s<e.length;s++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[s]=Math.floor(Ut(e[s]/255)*255):e[s]=Ut(e[s]);return{data:e,width:t.width,height:t.height}}else return O("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let ko=0;class Xs{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:ko++}),this.uuid=ae(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const s={uuid:this.uuid,url:""},n=this.data;if(n!==null){let i;if(Array.isArray(n)){i=[];for(let o=0,a=n.length;o<a;o++)n[o].isDataTexture?i.push(Zs(n[o].image)):i.push(Zs(n[o]))}else i=Zs(n);s.url=i}return e||(t.images[this.uuid]=s),s}}function Zs(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Oo.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(O("Texture: Unable to serialize Texture."),{})}let Bo=0;const Js=new T;class Nt extends we{constructor(t=Nt.DEFAULT_IMAGE,e=Nt.DEFAULT_MAPPING,s=1001,n=1001,i=1006,o=1008,a=1023,l=1009,h=Nt.DEFAULT_ANISOTROPY,c=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Bo++}),this.uuid=ae(),this.name="",this.source=new Xs(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=s,this.wrapT=n,this.magFilter=i,this.minFilter=o,this.anisotropy=h,this.format=a,this.internalFormat=null,this.type=l,this.offset=new mt(0,0),this.repeat=new mt(1,1),this.center=new mt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Rt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Js).x}get height(){return this.source.getSize(Js).y}get depth(){return this.source.getSize(Js).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const s=t[e];if(s===void 0){O(`Texture.setValues(): parameter \'${e}\' has value of undefined.`);continue}const n=this[e];if(n===void 0){O(`Texture.setValues(): property \'${e}\' does not exist.`);continue}n&&s&&n.isVector2&&s.isVector2||n&&s&&n.isVector3&&s.isVector3||n&&s&&n.isMatrix3&&s.isMatrix3?n.copy(s):this[e]=s}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const s={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(s.userData=this.userData),e||(t.textures[this.uuid]=s),s}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==300)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case 1e3:t.x=t.x-Math.floor(t.x);break;case 1001:t.x=t.x<0?0:1;break;case 1002:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case 1e3:t.y=t.y-Math.floor(t.y);break;case 1001:t.y=t.y<0?0:1;break;case 1002:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Nt.DEFAULT_IMAGE=null,Nt.DEFAULT_MAPPING=300,Nt.DEFAULT_ANISOTROPY=1;const oi=class oi{constructor(t=0,e=0,s=0,n=1){this.x=t,this.y=e,this.z=s,this.w=n}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,s,n){return this.x=t,this.y=e,this.z=s,this.w=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,s=this.y,n=this.z,i=this.w,o=t.elements;return this.x=o[0]*e+o[4]*s+o[8]*n+o[12]*i,this.y=o[1]*e+o[5]*s+o[9]*n+o[13]*i,this.z=o[2]*e+o[6]*s+o[10]*n+o[14]*i,this.w=o[3]*e+o[7]*s+o[11]*n+o[15]*i,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,s,n,i;const l=t.elements,h=l[0],c=l[4],u=l[8],d=l[1],p=l[5],f=l[9],m=l[2],y=l[6],w=l[10];if(Math.abs(c-d)<.01&&Math.abs(u-m)<.01&&Math.abs(f-y)<.01){if(Math.abs(c+d)<.1&&Math.abs(u+m)<.1&&Math.abs(f+y)<.1&&Math.abs(h+p+w-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const C=(h+1)/2,b=(p+1)/2,S=(w+1)/2,R=(c+d)/4,I=(u+m)/4,D=(f+y)/4;return C>b&&C>S?C<.01?(s=0,n=.707106781,i=.707106781):(s=Math.sqrt(C),n=R/s,i=I/s):b>S?b<.01?(s=.707106781,n=0,i=.707106781):(n=Math.sqrt(b),s=R/n,i=D/n):S<.01?(s=.707106781,n=.707106781,i=0):(i=Math.sqrt(S),s=I/i,n=D/i),this.set(s,n,i,e),this}let M=Math.sqrt((y-f)*(y-f)+(u-m)*(u-m)+(d-c)*(d-c));return Math.abs(M)<.001&&(M=1),this.x=(y-f)/M,this.y=(u-m)/M,this.z=(d-c)/M,this.w=Math.acos((h+p+w-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=k(this.x,t.x,e.x),this.y=k(this.y,t.y,e.y),this.z=k(this.z,t.z,e.z),this.w=k(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=k(this.x,t,e),this.y=k(this.y,t,e),this.z=k(this.z,t,e),this.w=k(this.w,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(k(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this.w=t.w+(e.w-t.w)*s,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};oi.prototype.isVector4=!0;let Zt=oi;class yi extends we{constructor(t=1,e=1,s={}){super(),s=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},s),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=s.depth,this.scissor=new Zt(0,0,t,e),this.scissorTest=!1,this.viewport=new Zt(0,0,t,e),this.textures=[];const n={width:t,height:e,depth:s.depth},i=new Nt(n),o=s.count;for(let a=0;a<o;a++)this.textures[a]=i.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(s),this.depthBuffer=s.depthBuffer,this.stencilBuffer=s.stencilBuffer,this.resolveDepthBuffer=s.resolveDepthBuffer,this.resolveStencilBuffer=s.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=s.depthTexture,this.samples=s.samples,this.multiview=s.multiview,this.useArrayDepthTexture=s.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let s=0;s<this.textures.length;s++)this.textures[s].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,s=1){if(this.width!==t||this.height!==e||this.depth!==s){this.width=t,this.height=e,this.depth=s;for(let n=0,i=this.textures.length;n<i;n++)this.textures[n].image.width=t,this.textures[n].image.height=e,this.textures[n].image.depth=s,this.textures[n].isData3DTexture!==!0&&(this.textures[n].isArrayTexture=this.textures[n].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,s=t.textures.length;e<s;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const n=Object.assign({},t.textures[e].image);this.textures[e].source=new Xs(n)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Vs=class Vs{constructor(t,e,s,n,i,o,a,l,h,c,u,d,p,f,m,y){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,s,n,i,o,a,l,h,c,u,d,p,f,m,y)}set(t,e,s,n,i,o,a,l,h,c,u,d,p,f,m,y){const w=this.elements;return w[0]=t,w[4]=e,w[8]=s,w[12]=n,w[1]=i,w[5]=o,w[9]=a,w[13]=l,w[2]=h,w[6]=c,w[10]=u,w[14]=d,w[3]=p,w[7]=f,w[11]=m,w[15]=y,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Vs().fromArray(this.elements)}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],e[9]=s[9],e[10]=s[10],e[11]=s[11],e[12]=s[12],e[13]=s[13],e[14]=s[14],e[15]=s[15],this}copyPosition(t){const e=this.elements,s=t.elements;return e[12]=s[12],e[13]=s[13],e[14]=s[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,s){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),s.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(t,e,s){return this.set(t.x,e.x,s.x,0,t.y,e.y,s.y,0,t.z,e.z,s.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,s=t.elements,n=1/Se.setFromMatrixColumn(t,0).length(),i=1/Se.setFromMatrixColumn(t,1).length(),o=1/Se.setFromMatrixColumn(t,2).length();return e[0]=s[0]*n,e[1]=s[1]*n,e[2]=s[2]*n,e[3]=0,e[4]=s[4]*i,e[5]=s[5]*i,e[6]=s[6]*i,e[7]=0,e[8]=s[8]*o,e[9]=s[9]*o,e[10]=s[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,s=t.x,n=t.y,i=t.z,o=Math.cos(s),a=Math.sin(s),l=Math.cos(n),h=Math.sin(n),c=Math.cos(i),u=Math.sin(i);if(t.order==="XYZ"){const d=o*c,p=o*u,f=a*c,m=a*u;e[0]=l*c,e[4]=-l*u,e[8]=h,e[1]=p+f*h,e[5]=d-m*h,e[9]=-a*l,e[2]=m-d*h,e[6]=f+p*h,e[10]=o*l}else if(t.order==="YXZ"){const d=l*c,p=l*u,f=h*c,m=h*u;e[0]=d+m*a,e[4]=f*a-p,e[8]=o*h,e[1]=o*u,e[5]=o*c,e[9]=-a,e[2]=p*a-f,e[6]=m+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*c,p=l*u,f=h*c,m=h*u;e[0]=d-m*a,e[4]=-o*u,e[8]=f+p*a,e[1]=p+f*a,e[5]=o*c,e[9]=m-d*a,e[2]=-o*h,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*c,p=o*u,f=a*c,m=a*u;e[0]=l*c,e[4]=f*h-p,e[8]=d*h+m,e[1]=l*u,e[5]=m*h+d,e[9]=p*h-f,e[2]=-h,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,p=o*h,f=a*l,m=a*h;e[0]=l*c,e[4]=m-d*u,e[8]=f*u+p,e[1]=u,e[5]=o*c,e[9]=-a*c,e[2]=-h*c,e[6]=p*u+f,e[10]=d-m*u}else if(t.order==="XZY"){const d=o*l,p=o*h,f=a*l,m=a*h;e[0]=l*c,e[4]=-u,e[8]=h*c,e[1]=d*u+m,e[5]=o*c,e[9]=p*u-f,e[2]=f*u-p,e[6]=a*c,e[10]=m*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Do,t,Uo)}lookAt(t,e,s){const n=this.elements;return yt.subVectors(t,e),yt.lengthSq()===0&&(yt.z=1),yt.normalize(),Jt.crossVectors(s,yt),Jt.lengthSq()===0&&(Math.abs(s.z)===1?yt.x+=1e-4:yt.z+=1e-4,yt.normalize(),Jt.crossVectors(s,yt)),Jt.normalize(),ls.crossVectors(yt,Jt),n[0]=Jt.x,n[4]=ls.x,n[8]=yt.x,n[1]=Jt.y,n[5]=ls.y,n[9]=yt.y,n[2]=Jt.z,n[6]=ls.z,n[10]=yt.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,n=e.elements,i=this.elements,o=s[0],a=s[4],l=s[8],h=s[12],c=s[1],u=s[5],d=s[9],p=s[13],f=s[2],m=s[6],y=s[10],w=s[14],M=s[3],C=s[7],b=s[11],S=s[15],R=n[0],I=n[4],D=n[8],z=n[12],U=n[1],Y=n[5],G=n[9],$=n[13],Z=n[2],P=n[6],Dt=n[10],_t=n[14],Yt=n[3],Gs=n[7],Ws=n[11],$s=n[15];return i[0]=o*R+a*U+l*Z+h*Yt,i[4]=o*I+a*Y+l*P+h*Gs,i[8]=o*D+a*G+l*Dt+h*Ws,i[12]=o*z+a*$+l*_t+h*$s,i[1]=c*R+u*U+d*Z+p*Yt,i[5]=c*I+u*Y+d*P+p*Gs,i[9]=c*D+u*G+d*Dt+p*Ws,i[13]=c*z+u*$+d*_t+p*$s,i[2]=f*R+m*U+y*Z+w*Yt,i[6]=f*I+m*Y+y*P+w*Gs,i[10]=f*D+m*G+y*Dt+w*Ws,i[14]=f*z+m*$+y*_t+w*$s,i[3]=M*R+C*U+b*Z+S*Yt,i[7]=M*I+C*Y+b*P+S*Gs,i[11]=M*D+C*G+b*Dt+S*Ws,i[15]=M*z+C*$+b*_t+S*$s,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[4],n=t[8],i=t[12],o=t[1],a=t[5],l=t[9],h=t[13],c=t[2],u=t[6],d=t[10],p=t[14],f=t[3],m=t[7],y=t[11],w=t[15],M=l*p-h*d,C=a*p-h*u,b=a*d-l*u,S=o*p-h*c,R=o*d-l*c,I=o*u-a*c;return e*(m*M-y*C+w*b)-s*(f*M-y*S+w*R)+n*(f*C-m*S+w*I)-i*(f*b-m*R+y*I)}determinantAffine(){const t=this.elements,e=t[0],s=t[4],n=t[8],i=t[1],o=t[5],a=t[9],l=t[2],h=t[6],c=t[10];return e*(o*c-a*h)-s*(i*c-a*l)+n*(i*h-o*l)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,s){const n=this.elements;return t.isVector3?(n[12]=t.x,n[13]=t.y,n[14]=t.z):(n[12]=t,n[13]=e,n[14]=s),this}invert(){const t=this.elements,e=t[0],s=t[1],n=t[2],i=t[3],o=t[4],a=t[5],l=t[6],h=t[7],c=t[8],u=t[9],d=t[10],p=t[11],f=t[12],m=t[13],y=t[14],w=t[15],M=e*a-s*o,C=e*l-n*o,b=e*h-i*o,S=s*l-n*a,R=s*h-i*a,I=n*h-i*l,D=c*m-u*f,z=c*y-d*f,U=c*w-p*f,Y=u*y-d*m,G=u*w-p*m,$=d*w-p*y,Z=M*$-C*G+b*Y+S*U-R*z+I*D;if(Z===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const P=1/Z;return t[0]=(a*$-l*G+h*Y)*P,t[1]=(n*G-s*$-i*Y)*P,t[2]=(m*I-y*R+w*S)*P,t[3]=(d*R-u*I-p*S)*P,t[4]=(l*U-o*$-h*z)*P,t[5]=(e*$-n*U+i*z)*P,t[6]=(y*b-f*I-w*C)*P,t[7]=(c*I-d*b+p*C)*P,t[8]=(o*G-a*U+h*D)*P,t[9]=(s*U-e*G-i*D)*P,t[10]=(f*R-m*b+w*M)*P,t[11]=(u*b-c*R-p*M)*P,t[12]=(a*z-o*Y-l*D)*P,t[13]=(e*Y-s*z+n*D)*P,t[14]=(m*C-f*S-y*M)*P,t[15]=(c*S-u*C+d*M)*P,this}scale(t){const e=this.elements,s=t.x,n=t.y,i=t.z;return e[0]*=s,e[4]*=n,e[8]*=i,e[1]*=s,e[5]*=n,e[9]*=i,e[2]*=s,e[6]*=n,e[10]*=i,e[3]*=s,e[7]*=n,e[11]*=i,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],s=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],n=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,s,n))}makeTranslation(t,e,s){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,s,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),s=Math.sin(t);return this.set(1,0,0,0,0,e,-s,0,0,s,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,0,s,0,0,1,0,0,-s,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,0,s,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const s=Math.cos(e),n=Math.sin(e),i=1-s,o=t.x,a=t.y,l=t.z,h=i*o,c=i*a;return this.set(h*o+s,h*a-n*l,h*l+n*a,0,h*a+n*l,c*a+s,c*l-n*o,0,h*l-n*a,c*l+n*o,i*l*l+s,0,0,0,0,1),this}makeScale(t,e,s){return this.set(t,0,0,0,0,e,0,0,0,0,s,0,0,0,0,1),this}makeShear(t,e,s,n,i,o){return this.set(1,s,i,0,t,1,o,0,e,n,1,0,0,0,0,1),this}compose(t,e,s){const n=this.elements,i=e._x,o=e._y,a=e._z,l=e._w,h=i+i,c=o+o,u=a+a,d=i*h,p=i*c,f=i*u,m=o*c,y=o*u,w=a*u,M=l*h,C=l*c,b=l*u,S=s.x,R=s.y,I=s.z;return n[0]=(1-(m+w))*S,n[1]=(p+b)*S,n[2]=(f-C)*S,n[3]=0,n[4]=(p-b)*R,n[5]=(1-(d+w))*R,n[6]=(y+M)*R,n[7]=0,n[8]=(f+C)*I,n[9]=(y-M)*I,n[10]=(1-(d+m))*I,n[11]=0,n[12]=t.x,n[13]=t.y,n[14]=t.z,n[15]=1,this}decompose(t,e,s){const n=this.elements;t.x=n[12],t.y=n[13],t.z=n[14];const i=this.determinantAffine();if(i===0)return s.set(1,1,1),e.identity(),this;let o=Se.set(n[0],n[1],n[2]).length();const a=Se.set(n[4],n[5],n[6]).length(),l=Se.set(n[8],n[9],n[10]).length();i<0&&(o=-o),Ct.copy(this);const h=1/o,c=1/a,u=1/l;return Ct.elements[0]*=h,Ct.elements[1]*=h,Ct.elements[2]*=h,Ct.elements[4]*=c,Ct.elements[5]*=c,Ct.elements[6]*=c,Ct.elements[8]*=u,Ct.elements[9]*=u,Ct.elements[10]*=u,e.setFromRotationMatrix(Ct),s.x=o,s.y=a,s.z=l,this}makePerspective(t,e,s,n,i,o,a=2e3,l=!1){const h=this.elements,c=2*i/(e-t),u=2*i/(s-n),d=(e+t)/(e-t),p=(s+n)/(s-n);let f,m;if(l)f=i/(o-i),m=o*i/(o-i);else if(a===2e3)f=-(o+i)/(o-i),m=-2*o*i/(o-i);else if(a===2001)f=-o/(o-i),m=-o*i/(o-i);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return h[0]=c,h[4]=0,h[8]=d,h[12]=0,h[1]=0,h[5]=u,h[9]=p,h[13]=0,h[2]=0,h[6]=0,h[10]=f,h[14]=m,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(t,e,s,n,i,o,a=2e3,l=!1){const h=this.elements,c=2/(e-t),u=2/(s-n),d=-(e+t)/(e-t),p=-(s+n)/(s-n);let f,m;if(l)f=1/(o-i),m=o/(o-i);else if(a===2e3)f=-2/(o-i),m=-(o+i)/(o-i);else if(a===2001)f=-1/(o-i),m=-i/(o-i);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return h[0]=c,h[4]=0,h[8]=0,h[12]=d,h[1]=0,h[5]=u,h[9]=0,h[13]=p,h[2]=0,h[6]=0,h[10]=f,h[14]=m,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(t){const e=this.elements,s=t.elements;for(let n=0;n<16;n++)if(e[n]!==s[n])return!1;return!0}fromArray(t,e=0){for(let s=0;s<16;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t[e+9]=s[9],t[e+10]=s[10],t[e+11]=s[11],t[e+12]=s[12],t[e+13]=s[13],t[e+14]=s[14],t[e+15]=s[15],t}};Vs.prototype.isMatrix4=!0;let ot=Vs;const Se=new T,Ct=new ot,Do=new T(0,0,0),Uo=new T(1,1,1),Jt=new T,ls=new T,yt=new T,xi=new ot,wi=new le;class hs{constructor(t=0,e=0,s=0,n=hs.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=s,this._order=n}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,s,n=this._order){return this._x=t,this._y=e,this._z=s,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,s=!0){const n=t.elements,i=n[0],o=n[4],a=n[8],l=n[1],h=n[5],c=n[9],u=n[2],d=n[6],p=n[10];switch(e){case"XYZ":this._y=Math.asin(k(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-c,p),this._z=Math.atan2(-o,i)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-k(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-u,i),this._z=0);break;case"ZXY":this._x=Math.asin(k(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-o,h)):(this._y=0,this._z=Math.atan2(l,i));break;case"ZYX":this._y=Math.asin(-k(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,i)):(this._x=0,this._z=Math.atan2(-o,h));break;case"YZX":this._z=Math.asin(k(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,h),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-k(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(a,i)):(this._x=Math.atan2(-c,p),this._y=0);break;default:O("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,s===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,s){return xi.makeRotationFromQuaternion(t),this.setFromRotationMatrix(xi,e,s)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return wi.setFromEuler(this),this.setFromQuaternion(wi,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}hs.DEFAULT_ORDER="XYZ";class Vo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Go=0;const Ni=new T,ve=new le,Vt=new ot,cs=new T,Oe=new T,Wo=new T,$o=new le,Ti=new T(1,0,0),Si=new T(0,1,0),vi=new T(0,0,1),Mi={type:"added"},qo={type:"removed"},Me={type:"childadded",child:null},Qs={type:"childremoved",child:null};class Gt extends we{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Go++}),this.uuid=ae(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Gt.DEFAULT_UP.clone();const t=new T,e=new hs,s=new le,n=new T(1,1,1);function i(){s.setFromEuler(e,!1)}function o(){e.setFromQuaternion(s,void 0,!1)}e._onChange(i),s._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:s},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new ot},normalMatrix:{value:new Rt}}),this.matrix=new ot,this.matrixWorld=new ot,this.matrixAutoUpdate=Gt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Vo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ve.setFromAxisAngle(t,e),this.quaternion.multiply(ve),this}rotateOnWorldAxis(t,e){return ve.setFromAxisAngle(t,e),this.quaternion.premultiply(ve),this}rotateX(t){return this.rotateOnAxis(Ti,t)}rotateY(t){return this.rotateOnAxis(Si,t)}rotateZ(t){return this.rotateOnAxis(vi,t)}translateOnAxis(t,e){return Ni.copy(t).applyQuaternion(this.quaternion),this.position.add(Ni.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ti,t)}translateY(t){return this.translateOnAxis(Si,t)}translateZ(t){return this.translateOnAxis(vi,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Vt.copy(this.matrixWorld).invert())}lookAt(t,e,s){t.isVector3?cs.copy(t):cs.set(t,e,s);const n=this.parent;this.updateWorldMatrix(!0,!1),Oe.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Vt.lookAt(Oe,cs,this.up):Vt.lookAt(cs,Oe,this.up),this.quaternion.setFromRotationMatrix(Vt),n&&(Vt.extractRotation(n.matrixWorld),ve.setFromRotationMatrix(Vt),this.quaternion.premultiply(ve.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(K("Object3D.add: object can\'t be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Mi),Me.child=t,this.dispatchEvent(Me),Me.child=null):K("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let s=0;s<arguments.length;s++)this.remove(arguments[s]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(qo),Qs.child=t,this.dispatchEvent(Qs),Qs.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Vt.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Vt.multiply(t.parent.matrixWorld)),t.applyMatrix4(Vt),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Mi),Me.child=t,this.dispatchEvent(Me),Me.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let s=0,n=this.children.length;s<n;s++){const o=this.children[s].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,s=[]){this[t]===e&&s.push(this);const n=this.children;for(let i=0,o=n.length;i<o;i++)n[i].getObjectsByProperty(t,e,s);return s}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Oe,t,Wo),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Oe,$o,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let s=0,n=e.length;s<n;s++)e[s].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let s=0,n=e.length;s<n;s++)e[s].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,s=t.y,n=t.z,i=this.matrix.elements;i[12]+=e-i[0]*e-i[4]*s-i[8]*n,i[13]+=s-i[1]*e-i[5]*s-i[9]*n,i[14]+=n-i[2]*e-i[6]*s-i[10]*n}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let s=0,n=e.length;s<n;s++)e[s].updateMatrixWorld(t)}updateWorldMatrix(t,e,s=!1){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||s)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,s=!0),e===!0){const i=this.children;for(let o=0,a=i.length;o<a;o++)i[o].updateWorldMatrix(!1,!0,s)}}toJSON(t){const e=t===void 0||typeof t=="string",s={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},s.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),this.static!==!1&&(n.static=this.static),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.pivot!==null&&(n.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(n.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(n.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),n.instanceInfo=this._instanceInfo.map(a=>({...a})),n.availableInstanceIds=this._availableInstanceIds.slice(),n.availableGeometryIds=this._availableGeometryIds.slice(),n.nextIndexStart=this._nextIndexStart,n.nextVertexStart=this._nextVertexStart,n.geometryCount=this._geometryCount,n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.matricesTexture=this._matricesTexture.toJSON(t),n.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(n.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(n.boundingBox=this.boundingBox.toJSON()));function i(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=i(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let h=0,c=l.length;h<c;h++){const u=l[h];i(t.shapes,u)}else i(t.shapes,l)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(t.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,h=this.material.length;l<h;l++)a.push(i(t.materials,this.material[l]));n.material=a}else n.material=i(t.materials,this.material);if(this.children.length>0){n.children=[];for(let a=0;a<this.children.length;a++)n.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){n.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];n.animations.push(i(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),h=o(t.textures),c=o(t.images),u=o(t.shapes),d=o(t.skeletons),p=o(t.animations),f=o(t.nodes);a.length>0&&(s.geometries=a),l.length>0&&(s.materials=l),h.length>0&&(s.textures=h),c.length>0&&(s.images=c),u.length>0&&(s.shapes=u),d.length>0&&(s.skeletons=d),p.length>0&&(s.animations=p),f.length>0&&(s.nodes=f)}return s.object=n,s;function o(a){const l=[];for(const h in a){const c=a[h];delete c.metadata,l.push(c)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let s=0;s<t.children.length;s++){const n=t.children[s];this.add(n.clone())}return this}}Gt.DEFAULT_UP=new T(0,1,0),Gt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ci={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Qt={h:0,s:0,l:0},us={h:0,s:0,l:0};function Ks(r,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?r+(t-r)*6*e:e<1/2?t:e<2/3?r+(t-r)*6*(2/3-e):r}class tn{constructor(t,e,s){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,s)}set(t,e,s){if(e===void 0&&s===void 0){const n=t;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(t,e,s);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=vt){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,it.colorSpaceToWorking(this,e),this}setRGB(t,e,s,n=it.workingColorSpace){return this.r=t,this.g=e,this.b=s,it.colorSpaceToWorking(this,n),this}setHSL(t,e,s,n=it.workingColorSpace){if(t=Hs(t,1),e=k(e,0,1),s=k(s,0,1),e===0)this.r=this.g=this.b=s;else{const i=s<=.5?s*(1+e):s+e-s*e,o=2*s-i;this.r=Ks(o,i,t+1/3),this.g=Ks(o,i,t),this.b=Ks(o,i,t-1/3)}return it.colorSpaceToWorking(this,n),this}setStyle(t,e=vt){function s(i){i!==void 0&&parseFloat(i)<1&&O("Color: Alpha component of "+t+" will be ignored.")}let n;if(n=/^(\\w+)\\(([^\\)]*)\\)/.exec(t)){let i;const o=n[1],a=n[2];switch(o){case"rgb":case"rgba":if(i=/^\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,e);if(i=/^\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,e);break;case"hsl":case"hsla":if(i=/^\\s*(\\d*\\.?\\d+)\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return s(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,e);break;default:O("Color: Unknown color model "+t)}}else if(n=/^\\#([A-Fa-f\\d]+)$/.exec(t)){const i=n[1],o=i.length;if(o===3)return this.setRGB(parseInt(i.charAt(0),16)/15,parseInt(i.charAt(1),16)/15,parseInt(i.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(i,16),e);O("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=vt){const s=Ci[t.toLowerCase()];return s!==void 0?this.setHex(s,e):O("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ut(t.r),this.g=Ut(t.g),this.b=Ut(t.b),this}copyLinearToSRGB(t){return this.r=Ne(t.r),this.g=Ne(t.g),this.b=Ne(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=vt){return it.workingToColorSpace(ct.copy(this),t),Math.round(k(ct.r*255,0,255))*65536+Math.round(k(ct.g*255,0,255))*256+Math.round(k(ct.b*255,0,255))}getHexString(t=vt){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=it.workingColorSpace){it.workingToColorSpace(ct.copy(this),e);const s=ct.r,n=ct.g,i=ct.b,o=Math.max(s,n,i),a=Math.min(s,n,i);let l,h;const c=(a+o)/2;if(a===o)l=0,h=0;else{const u=o-a;switch(h=c<=.5?u/(o+a):u/(2-o-a),o){case s:l=(n-i)/u+(n<i?6:0);break;case n:l=(i-s)/u+2;break;case i:l=(s-n)/u+4;break}l/=6}return t.h=l,t.s=h,t.l=c,t}getRGB(t,e=it.workingColorSpace){return it.workingToColorSpace(ct.copy(this),e),t.r=ct.r,t.g=ct.g,t.b=ct.b,t}getStyle(t=vt){it.workingToColorSpace(ct.copy(this),t);const e=ct.r,s=ct.g,n=ct.b;return t!==vt?`color(${t} ${e.toFixed(3)} ${s.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(s*255)},${Math.round(n*255)})`}offsetHSL(t,e,s){return this.getHSL(Qt),this.setHSL(Qt.h+t,Qt.s+e,Qt.l+s)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,s){return this.r=t.r+(e.r-t.r)*s,this.g=t.g+(e.g-t.g)*s,this.b=t.b+(e.b-t.b)*s,this}lerpHSL(t,e){this.getHSL(Qt),t.getHSL(us);const s=Pe(Qt.h,us.h,e),n=Pe(Qt.s,us.s,e),i=Pe(Qt.l,us.l,e);return this.setHSL(s,n,i),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,s=this.g,n=this.b,i=t.elements;return this.r=i[0]*e+i[3]*s+i[6]*n,this.g=i[1]*e+i[4]*s+i[7]*n,this.b=i[2]*e+i[5]*s+i[8]*n,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ct=new tn;tn.NAMES=Ci;class ke{constructor(t=new T(1/0,1/0,1/0),e=new T(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e+=3)this.expandByPoint(bt.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,s=t.count;e<s;e++)this.expandByPoint(bt.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const s=bt.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(s),this.max.copy(t).add(s),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const s=t.geometry;if(s!==void 0){const i=s.getAttribute("position");if(e===!0&&i!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=i.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,bt):bt.fromBufferAttribute(i,o),bt.applyMatrix4(t.matrixWorld),this.expandByPoint(bt);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ds.copy(t.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),ds.copy(s.boundingBox)),ds.applyMatrix4(t.matrixWorld),this.union(ds)}const n=t.children;for(let i=0,o=n.length;i<o;i++)this.expandByObject(n[i],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,bt),bt.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,s;return t.normal.x>0?(e=t.normal.x*this.min.x,s=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,s=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,s+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,s+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,s+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,s+=t.normal.z*this.min.z),e<=-t.constant&&s>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Be),ps.subVectors(this.max,Be),Ce.subVectors(t.a,Be),be.subVectors(t.b,Be),Ee.subVectors(t.c,Be),Kt.subVectors(be,Ce),te.subVectors(Ee,be),he.subVectors(Ce,Ee);let e=[0,-Kt.z,Kt.y,0,-te.z,te.y,0,-he.z,he.y,Kt.z,0,-Kt.x,te.z,0,-te.x,he.z,0,-he.x,-Kt.y,Kt.x,0,-te.y,te.x,0,-he.y,he.x,0];return!en(e,Ce,be,Ee,ps)||(e=[1,0,0,0,1,0,0,0,1],!en(e,Ce,be,Ee,ps))?!1:(fs.crossVectors(Kt,te),e=[fs.x,fs.y,fs.z],en(e,Ce,be,Ee,ps))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,bt).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(bt).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Wt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Wt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Wt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Wt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Wt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Wt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Wt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Wt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Wt),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Wt=[new T,new T,new T,new T,new T,new T,new T,new T],bt=new T,ds=new ke,Ce=new T,be=new T,Ee=new T,Kt=new T,te=new T,he=new T,Be=new T,ps=new T,fs=new T,ce=new T;function en(r,t,e,s,n){for(let i=0,o=r.length-3;i<=o;i+=3){ce.fromArray(r,i);const a=n.x*Math.abs(ce.x)+n.y*Math.abs(ce.y)+n.z*Math.abs(ce.z),l=t.dot(ce),h=e.dot(ce),c=s.dot(ce);if(Math.max(-Math.max(l,h,c),Math.min(l,h,c))>a)return!1}return!0}const st=new T,gs=new mt;let Ho=0;class bi extends we{constructor(t,e,s=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Ho++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=s,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,s){t*=this.itemSize,s*=e.itemSize;for(let n=0,i=this.itemSize;n<i;n++)this.array[t+n]=e.array[s+n];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,s=this.count;e<s;e++)gs.fromBufferAttribute(this,e),gs.applyMatrix3(t),this.setXY(e,gs.x,gs.y);else if(this.itemSize===3)for(let e=0,s=this.count;e<s;e++)st.fromBufferAttribute(this,e),st.applyMatrix3(t),this.setXYZ(e,st.x,st.y,st.z);return this}applyMatrix4(t){for(let e=0,s=this.count;e<s;e++)st.fromBufferAttribute(this,e),st.applyMatrix4(t),this.setXYZ(e,st.x,st.y,st.z);return this}applyNormalMatrix(t){for(let e=0,s=this.count;e<s;e++)st.fromBufferAttribute(this,e),st.applyNormalMatrix(t),this.setXYZ(e,st.x,st.y,st.z);return this}transformDirection(t){for(let e=0,s=this.count;e<s;e++)st.fromBufferAttribute(this,e),st.transformDirection(t),this.setXYZ(e,st.x,st.y,st.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let s=this.array[t*this.itemSize+e];return this.normalized&&(s=Mt(s,this.array)),s}setComponent(t,e,s){return this.normalized&&(s=q(s,this.array)),this.array[t*this.itemSize+e]=s,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Mt(e,this.array)),e}setX(t,e){return this.normalized&&(e=q(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Mt(e,this.array)),e}setY(t,e){return this.normalized&&(e=q(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Mt(e,this.array)),e}setZ(t,e){return this.normalized&&(e=q(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Mt(e,this.array)),e}setW(t,e){return this.normalized&&(e=q(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,s){return t*=this.itemSize,this.normalized&&(e=q(e,this.array),s=q(s,this.array)),this.array[t+0]=e,this.array[t+1]=s,this}setXYZ(t,e,s,n){return t*=this.itemSize,this.normalized&&(e=q(e,this.array),s=q(s,this.array),n=q(n,this.array)),this.array[t+0]=e,this.array[t+1]=s,this.array[t+2]=n,this}setXYZW(t,e,s,n,i){return t*=this.itemSize,this.normalized&&(e=q(e,this.array),s=q(s,this.array),n=q(n,this.array),i=q(i,this.array)),this.array[t+0]=e,this.array[t+1]=s,this.array[t+2]=n,this.array[t+3]=i,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==35044&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}}const jo=new ke,De=new T,sn=new T;class Yo{constructor(t=new T,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const s=this.center;e!==void 0?s.copy(e):jo.setFromPoints(t).getCenter(s);let n=0;for(let i=0,o=t.length;i<o;i++)n=Math.max(n,s.distanceToSquared(t[i]));return this.radius=Math.sqrt(n),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const s=this.center.distanceToSquared(t);return e.copy(t),s>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;De.subVectors(t,this.center);const e=De.lengthSq();if(e>this.radius*this.radius){const s=Math.sqrt(e),n=(s-this.radius)*.5;this.center.addScaledVector(De,n/s),this.radius+=n}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(sn.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(De.copy(t.center).add(sn)),this.expandByPoint(De.copy(t.center).sub(sn))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}class Xo{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=ae()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,s){t*=this.stride,s*=e.stride;for(let n=0,i=this.stride;n<i;n++)this.array[t+n]=e.array[s+n];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ae()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),s=new this.constructor(e,this.stride);return s.setUsage(this.usage),s}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ae()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const dt=new T;class nn{constructor(t,e,s,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=s,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,s=this.data.count;e<s;e++)dt.fromBufferAttribute(this,e),dt.applyMatrix4(t),this.setXYZ(e,dt.x,dt.y,dt.z);return this}applyNormalMatrix(t){for(let e=0,s=this.count;e<s;e++)dt.fromBufferAttribute(this,e),dt.applyNormalMatrix(t),this.setXYZ(e,dt.x,dt.y,dt.z);return this}transformDirection(t){for(let e=0,s=this.count;e<s;e++)dt.fromBufferAttribute(this,e),dt.transformDirection(t),this.setXYZ(e,dt.x,dt.y,dt.z);return this}getComponent(t,e){let s=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(s=Mt(s,this.array)),s}setComponent(t,e,s){return this.normalized&&(s=q(s,this.array)),this.data.array[t*this.data.stride+this.offset+e]=s,this}setX(t,e){return this.normalized&&(e=q(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=q(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=q(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=q(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Mt(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Mt(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Mt(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Mt(e,this.array)),e}setXY(t,e,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=q(e,this.array),s=q(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=s,this}setXYZ(t,e,s,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=q(e,this.array),s=q(s,this.array),n=q(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=s,this.data.array[t+2]=n,this}setXYZW(t,e,s,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=q(e,this.array),s=q(s,this.array),n=q(n,this.array),i=q(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=s,this.data.array[t+2]=n,this.data.array[t+3]=i,this}clone(t){if(t===void 0){qs("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let s=0;s<this.count;s++){const n=s*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)e.push(this.data.array[n+i])}return new bi(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new nn(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){qs("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let s=0;s<this.count;s++){const n=s*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)e.push(this.data.array[n+i])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const $t=new T,rn=new T,ms=new T,ee=new T,on=new T,ys=new T,an=new T;class Zo{constructor(t=new T,e=new T(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,$t)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const s=e.dot(this.direction);return s<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,s)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=$t.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):($t.copy(this.origin).addScaledVector(this.direction,e),$t.distanceToSquared(t))}distanceSqToSegment(t,e,s,n){rn.copy(t).add(e).multiplyScalar(.5),ms.copy(e).sub(t).normalize(),ee.copy(this.origin).sub(rn);const i=t.distanceTo(e)*.5,o=-this.direction.dot(ms),a=ee.dot(this.direction),l=-ee.dot(ms),h=ee.lengthSq(),c=Math.abs(1-o*o);let u,d,p,f;if(c>0)if(u=o*l-a,d=o*a-l,f=i*c,u>=0)if(d>=-f)if(d<=f){const m=1/c;u*=m,d*=m,p=u*(u+o*d+2*a)+d*(o*u+d+2*l)+h}else d=i,u=Math.max(0,-(o*d+a)),p=-u*u+d*(d+2*l)+h;else d=-i,u=Math.max(0,-(o*d+a)),p=-u*u+d*(d+2*l)+h;else d<=-f?(u=Math.max(0,-(-o*i+a)),d=u>0?-i:Math.min(Math.max(-i,-l),i),p=-u*u+d*(d+2*l)+h):d<=f?(u=0,d=Math.min(Math.max(-i,-l),i),p=d*(d+2*l)+h):(u=Math.max(0,-(o*i+a)),d=u>0?i:Math.min(Math.max(-i,-l),i),p=-u*u+d*(d+2*l)+h);else d=o>0?-i:i,u=Math.max(0,-(o*d+a)),p=-u*u+d*(d+2*l)+h;return s&&s.copy(this.origin).addScaledVector(this.direction,u),n&&n.copy(rn).addScaledVector(ms,d),p}intersectSphere(t,e){$t.subVectors(t.center,this.origin);const s=$t.dot(this.direction),n=$t.dot($t)-s*s,i=t.radius*t.radius;if(n>i)return null;const o=Math.sqrt(i-n),a=s-o,l=s+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const s=-(this.origin.dot(t.normal)+t.constant)/e;return s>=0?s:null}intersectPlane(t,e){const s=this.distanceToPlane(t);return s===null?null:this.at(s,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let s,n,i,o,a,l;const h=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,d=this.origin;return h>=0?(s=(t.min.x-d.x)*h,n=(t.max.x-d.x)*h):(s=(t.max.x-d.x)*h,n=(t.min.x-d.x)*h),c>=0?(i=(t.min.y-d.y)*c,o=(t.max.y-d.y)*c):(i=(t.max.y-d.y)*c,o=(t.min.y-d.y)*c),s>o||i>n||((i>s||isNaN(s))&&(s=i),(o<n||isNaN(n))&&(n=o),u>=0?(a=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),s>l||a>n)||((a>s||s!==s)&&(s=a),(l<n||n!==n)&&(n=l),n<0)?null:this.at(s>=0?s:n,e)}intersectsBox(t){return this.intersectBox(t,$t)!==null}intersectTriangle(t,e,s,n,i){on.subVectors(e,t),ys.subVectors(s,t),an.crossVectors(on,ys);let o=this.direction.dot(an),a;if(o>0){if(n)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ee.subVectors(this.origin,t);const l=a*this.direction.dot(ys.crossVectors(ee,ys));if(l<0)return null;const h=a*this.direction.dot(on.cross(ee));if(h<0||l+h>o)return null;const c=-a*ee.dot(an);return c<0?null:this.at(c/o,i)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Jo extends Nt{constructor(t,e){super({width:t,height:e}),this.isFramebufferTexture=!0,this.magFilter=1003,this.minFilter=1003,this.generateMipmaps=!1,this.needsUpdate=!0}}class Qo extends Nt{constructor(t=[],e=301,s,n,i,o,a,l,h,c){super(t,e,s,n,i,o,a,l,h,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class ln extends Nt{constructor(t,e,s=1014,n,i,o,a=1003,l=1003,h,c=1026,u=1){if(c!==1026&&c!==1027)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:t,height:e,depth:u};super(d,n,i,o,a,l,c,s,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Xs(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const xs=new T,ws=new le,Lt=new T;class Ko extends Gt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ot,this.projectionMatrix=new ot,this.projectionMatrixInverse=new ot,this.coordinateSystem=2e3,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(xs,ws,Lt),Lt.x===1&&Lt.y===1&&Lt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(xs,ws,Lt.set(1,1,1)).invert()}updateWorldMatrix(t,e,s=!1){super.updateWorldMatrix(t,e,s),this.matrixWorld.decompose(xs,ws,Lt),Lt.x===1&&Lt.y===1&&Lt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(xs,ws,Lt.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const se=new T,Ei=new mt,Ai=new mt;class ta extends Ko{constructor(t=50,e=1,s=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=s,this.far=n,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=as*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Fe*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return as*2*Math.atan(Math.tan(Fe*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,s){se.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(se.x,se.y).multiplyScalar(-t/se.z),se.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),s.set(se.x,se.y).multiplyScalar(-t/se.z)}getViewSize(t,e){return this.getViewBounds(t,Ei,Ai),e.subVectors(Ai,Ei)}setViewOffset(t,e,s,n,i,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=s,this.view.offsetY=n,this.view.width=i,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Fe*.5*this.fov)/this.zoom,s=2*e,n=this.aspect*s,i=-.5*n;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,h=o.fullHeight;i+=o.offsetX*n/l,e-=o.offsetY*s/h,n*=o.width/l,s*=o.height/h}const a=this.filmOffset;a!==0&&(i+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+n,e,e-s,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const ai=class ai{constructor(t,e,s,n){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,s,n)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let s=0;s<4;s++)this.elements[s]=t[s+e];return this}set(t,e,s,n){const i=this.elements;return i[0]=t,i[2]=e,i[1]=s,i[3]=n,this}};ai.prototype.isMatrix2=!0;let hn=ai;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}})),typeof window<"u"&&(window.__THREE__?O("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");const ea=[/^StackTrace\\.js$/,/^TSLCore\\.js$/,/^.*Node\\.js$/,/^three\\.webgpu.*\\.js$/];function sa(r){const t=/(?:at\\s+(.+?)\\s+\\()?(?:(.+?)@)?([^@\\s()]+):(\\d+):(\\d+)/;return r.split(`\n`).map(e=>{const s=e.match(t);if(!s)return null;const n=s[1]||s[2]||"",i=s[3].split("?")[0],o=parseInt(s[4],10),a=parseInt(s[5],10),l=i.split("/").pop();return{fn:n,file:l,line:o,column:a}}).filter(e=>e&&!ea.some(s=>s.test(e.file)))}class Et{constructor(t=null){this.isStackTrace=!0,this.stack=sa(t||new Error().stack)}getLocation(){if(this.stack.length===0)return"[Unknown location]";const t=this.stack[0],e=t.fn;return`${e?`"${e}()" at `:""}"${t.file}:${t.line}"`}getError(t){if(this.stack.length===0)return t;const e=this.stack.map(s=>{const n=`${s.file}:${s.line}:${s.column}`;return s.fn?`    at ${s.fn} (${n})`:`    at ${n}`}).join(`\n`);return`${t}\n${e}`}}function cn(r,t=0){let e=3735928559^t,s=1103547991^t;if(Array.isArray(r))for(let n=0,i;n<r.length;n++)i=r[n],e=Math.imul(e^i,2654435761),s=Math.imul(s^i,1597334677);else for(let n=0,i;n<r.length;n++)i=r.charCodeAt(n),e=Math.imul(e^i,2654435761),s=Math.imul(s^i,1597334677);return e=Math.imul(e^e>>>16,2246822507),e^=Math.imul(s^s>>>13,3266489909),s=Math.imul(s^s>>>16,2246822507),s^=Math.imul(e^e>>>13,3266489909),4294967296*(2097151&s)+(e>>>0)}const _i=r=>cn(r),na=r=>cn(r),Ri=(...r)=>cn(r);function Ns(r){if(r==null)return null;const t=typeof r;return r.isNode===!0?"node":t==="number"?"float":t==="boolean"?"bool":t==="string"?"string":t==="function"?"shader":r.isVector2===!0?"vec2":r.isVector3===!0?"vec3":r.isVector4===!0?"vec4":r.isMatrix2===!0?"mat2":r.isMatrix3===!0?"mat3":r.isMatrix4===!0?"mat4":r.isColor===!0?"color":r instanceof ArrayBuffer?"ArrayBuffer":null}function un(r,...t){const e=r?r.slice(-4):void 0;return t.length===1&&(e==="vec2"?t=[t[0],t[0]]:e==="vec3"?t=[t[0],t[0],t[0]]:e==="vec4"&&(t=[t[0],t[0],t[0],t[0]])),r==="color"?new tn(...t):e==="vec2"?new mt(...t):e==="vec3"?new T(...t):e==="vec4"?new Zt(...t):e==="mat2"?new hn(...t):e==="mat3"?new Rt(...t):e==="mat4"?new ot(...t):r==="bool"?t[0]||!1:r==="float"||r==="int"||r==="uint"?t[0]||0:r==="string"?t[0]||"":r==="ArrayBuffer"?ra(t[0]):null}function ia(r){let t="";const e=new Uint8Array(r);for(let s=0;s<e.length;s++)t+=String.fromCharCode(e[s]);return btoa(t)}function ra(r){return Uint8Array.from(atob(r),t=>t.charCodeAt(0)).buffer}const Ue={VERTEX:"vertex"},W={NONE:"none",FRAME:"frame",RENDER:"render",OBJECT:"object"},dn={READ_ONLY:"readOnly",WRITE_ONLY:"writeOnly",READ_WRITE:"readWrite"};[...["fragment","vertex"]];const Ve=["x","y","z","w"],oa={analyze:"setup",generate:"analyze"};let aa=0;class L extends we{static get type(){return"Node"}constructor(t=null){super(),this.nodeType=t,this.updateType=W.NONE,this.updateBeforeType=W.NONE,this.updateAfterType=W.NONE,this.version=0,this.name="",this.global=!1,this.parents=!1,this.isNode=!0,this._beforeNodes=null,this._cacheKey=null,this._uuid=null,this._cacheKeyVersion=0,this.id=aa++,this.stackTrace=null,L.captureStackTrace===!0&&(this.stackTrace=new Et)}set needsUpdate(t){t===!0&&this.version++}get uuid(){return this._uuid===null&&(this._uuid=Fo.generateUUID()),this._uuid}get type(){return this.constructor.type}onUpdate(t,e){return this.updateType=e,this.update=t.bind(this),this}onFrameUpdate(t){return this.onUpdate(t,W.FRAME)}onRenderUpdate(t){return this.onUpdate(t,W.RENDER)}onObjectUpdate(t){return this.onUpdate(t,W.OBJECT)}onReference(t){return this.updateReference=t.bind(this),this}updateReference(){return this}isGlobal(){return this.global}*getChildren(){for(const{childNode:t}of this._getChildren())yield t}dispose(){this.dispatchEvent({type:"dispose"})}traverse(t){t(this);for(const e of this.getChildren())e.traverse(t)}_getChildren(t=new Set){const e=[];t.add(this);for(const s of Object.getOwnPropertyNames(this)){const n=this[s];if(!(s.startsWith("_")===!0||t.has(n))){if(Array.isArray(n)===!0)for(let i=0;i<n.length;i++){const o=n[i];o&&o.isNode===!0&&e.push({property:s,index:i,childNode:o})}else if(n&&n.isNode===!0)e.push({property:s,childNode:n});else if(n&&Object.getPrototypeOf(n)===Object.prototype)for(const i in n){if(i.startsWith("_")===!0)continue;const o=n[i];o&&o.isNode===!0&&e.push({property:s,index:i,childNode:o})}}}return e}getCacheKey(t=!1,e=null){if(t=t||this.version!==this._cacheKeyVersion,t===!0||this._cacheKey===null){e===null&&(e=new Set);const s=[];for(const{property:n,childNode:i}of this._getChildren(e))s.push(_i(n.slice(0,-4)),i.getCacheKey(t,e));this._cacheKey=Ri(na(s),this.customCacheKey()),this._cacheKeyVersion=this.version}return this._cacheKey}customCacheKey(){return this.id}getScope(){return this}getHash(){return String(this.id)}getUpdateType(){return this.updateType}getUpdateBeforeType(){return this.updateBeforeType}getUpdateAfterType(){return this.updateAfterType}getElementType(t){const e=this.getNodeType(t);return t.getElementType(e)}getMemberType(){return"void"}getNodeType(t,e=null){const s=t.getDataFromNode(this);let n;return e!==null?(s.typeFromOutput=s.typeFromOutput||{},n=s.typeFromOutput[e],n===void 0&&(n=this.generateNodeType(t,e),s.typeFromOutput[e]=n)):(n=s.type,n===void 0&&(n=this.generateNodeType(t),s.type=n)),n}generateNodeType(t,e=null){const s=t.getNodeProperties(this);return s.outputNode?s.outputNode.getNodeType(t,e):this.nodeType}getShared(t){const e=this.getHash(t),s=t.getNodeFromHash(e);let n=null;if(s&&s!==this)n=s;else if(t.context.overrideNodes){const i=t.context.overrideNodes.get(this);if(i){const o=t.getDataFromNode(this);o.isOverwritten!==!0?(o.isOverwritten=!0,n=i(t).overrideNode(this,null),o.sharedNode=n):n=o.sharedNode}}return n||this}getArrayCount(){return null}setup(t){const e=t.getNodeProperties(this);let s=0;for(const n of this.getChildren())e["node"+s++]=n;return e.outputNode||null}analyze(t,e=null){const s=t.increaseUsage(this);if(this.parents===!0){const n=t.getDataFromNode(this,"any");n.stages=n.stages||{},n.stages[t.shaderStage]=n.stages[t.shaderStage]||[],n.stages[t.shaderStage].push(e)}if(s===1){const n=t.getNodeProperties(this);for(const i of Object.values(n))i&&i.isNode===!0&&i.build(t,this)}}generate(t,e){const{outputNode:s}=t.getNodeProperties(this);if(s&&s.isNode===!0)return s.build(t,e)}updateBefore(){O("Abstract function.")}updateAfter(){O("Abstract function.")}update(){O("Abstract function.")}before(t){return this._beforeNodes===null&&(this._beforeNodes=[]),this._beforeNodes.push(t),this}build(t,e=null){const s=this.getShared(t);if(this!==s)return s.build(t,e);if(this._beforeNodes!==null){const l=this._beforeNodes;this._beforeNodes=null;for(const h of l)h.build(t,e);this._beforeNodes=l}const n=t.getDataFromNode(this);n.buildStages=n.buildStages||{},n.buildStages[t.buildStage]=!0;const i=oa[t.buildStage];if(i&&n.buildStages[i]!==!0){const l=t.getBuildStage();t.setBuildStage(i),this.build(t),t.setBuildStage(l)}t.addChain(this);let o=null;const a=t.getBuildStage();if(a==="setup"){t.addNode(this),this.updateReference(t);const l=t.getNodeProperties(this);if(l.initialized!==!0){l.initialized=!0,l.outputNode=this.setup(t)||l.outputNode||null;for(const h of Object.values(l))if(h&&h.isNode===!0){if(h.parents===!0){const c=t.getNodeProperties(h);c.parents=c.parents||[],c.parents.push(this)}h.build(t)}t.addSequentialNode(this)}o=l.outputNode}else if(a==="analyze")this.analyze(t,e);else if(a==="generate"){if(this.generate.length<2){const h=this.getNodeType(t),c=t.getDataFromNode(this);o=c.snippet,o===void 0?c.generated===void 0?(c.generated=!0,o=this.generate(t)||"",c.snippet=o):(O("Node: Recursion detected.",this),o="/* Recursion detected. */"):c.flowCodes!==void 0&&t.context.nodeBlock!==void 0&&t.addFlowCodeHierarchy(this,t.context.nodeBlock),o=t.format(o,h,e)}else o=this.generate(t,e)||"";o===""&&e!==null&&e!=="void"&&e!=="OutputType"&&(K(`TSL: Invalid generated code, expected a "${e}".`),o=t.generateConst(e))}return t.removeChain(this),o}getSerializeChildren(){return this._getChildren()}serialize(t){const e=this.getSerializeChildren(),s={};for(const{property:n,index:i,childNode:o}of e)i!==void 0?(s[n]===void 0&&(s[n]=Number.isInteger(i)?[]:{}),s[n][i]=o.toJSON(t.meta).uuid):s[n]=o.toJSON(t.meta).uuid;Object.keys(s).length>0&&(t.inputNodes=s)}deserialize(t){if(t.inputNodes!==void 0){const e=t.meta.nodes;for(const s in t.inputNodes)if(Array.isArray(t.inputNodes[s])){const n=[];for(const i of t.inputNodes[s])n.push(e[i]);this[s]=n}else if(typeof t.inputNodes[s]=="object"){const n={};for(const i in t.inputNodes[s]){const o=t.inputNodes[s][i];n[i]=e[o]}this[s]=n}else{const n=t.inputNodes[s];this[s]=e[n]}}}toJSON(t){const{uuid:e,type:s}=this,n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{},nodes:{}});let i=t.nodes[e];i===void 0&&(i={uuid:e,type:s,meta:t,metadata:{version:4.7,type:"Node",generator:"Node.toJSON"}},n!==!0&&(t.nodes[i.uuid]=i),this.serialize(i),delete i.meta);function o(a){const l=[];for(const h in a){const c=a[h];delete c.metadata,l.push(c)}return l}if(n){const a=o(t.textures),l=o(t.images),h=o(t.nodes);a.length>0&&(i.textures=a),l.length>0&&(i.images=l),h.length>0&&(i.nodes=h)}return i}}L.captureStackTrace=!1;class Ge extends L{static get type(){return"ArrayElementNode"}constructor(t,e){super(),this.node=t,this.indexNode=e,this.isArrayElementNode=!0}generateNodeType(t){return this.node.getElementType(t)}getMemberType(t,e){return this.node.getMemberType(t,e)}generate(t){const e=this.indexNode.getNodeType(t),s=this.node.build(t),n=this.indexNode.build(t,!t.isVector(e)&&t.isInteger(e)?e:"uint");return`${s}[ ${n} ]`}}class Li extends L{static get type(){return"ConvertNode"}constructor(t,e){super(),this.node=t,this.convertTo=e}generateNodeType(t){const e=this.node.getNodeType(t);let s=null;for(const n of this.convertTo.split("|"))(s===null||t.getTypeLength(e)===t.getTypeLength(n))&&(s=n);return s}serialize(t){super.serialize(t),t.convertTo=this.convertTo}deserialize(t){super.deserialize(t),this.convertTo=t.convertTo}generate(t,e){const s=this.node,n=this.getNodeType(t),i=s.build(t,n);return t.format(i,n,e)}}class at extends L{static get type(){return"TempNode"}constructor(t=null){super(t),this.isTempNode=!0}hasDependencies(t){return t.getDataFromNode(this).usageCount>1}build(t,e){if(t.getBuildStage()==="generate"){const n=t.getVectorType(this.getNodeType(t,e)),i=t.getDataFromNode(this);if(i.propertyName!==void 0)return t.format(i.propertyName,n,e);if(n!=="void"&&e!=="void"&&this.hasDependencies(t)){const o=super.build(t,n),a=t.getVarFromNode(this,null,n),l=t.getPropertyName(a);return t.addLineFlowCode(`${l} = ${o}`,this),i.snippet=o,i.propertyName=l,t.format(i.propertyName,n,e)}}return super.build(t,e)}}class la extends at{static get type(){return"JoinNode"}constructor(t=[],e=null){super(e),this.nodes=t}generateNodeType(t){return this.nodeType!==null?t.getVectorType(this.nodeType):t.getTypeFromLength(this.nodes.reduce((e,s)=>e+t.getTypeLength(s.getNodeType(t)),0))}generate(t,e){const s=this.getNodeType(t),n=t.getTypeLength(s),i=this.nodes,o=t.getComponentType(s),a=[];let l=0;for(const c of i){if(l>=n){K(`TSL: Length of parameters exceeds maximum length of function \'${s}()\' type.`,this.stackTrace);break}let u=c.getNodeType(t),d=t.getTypeLength(u),p;if(l+d>n&&(K(`TSL: Length of \'${s}()\' data exceeds maximum length of output type.`,this.stackTrace),d=n-l,u=t.getTypeFromLength(d)),l+=d,p=c.build(t,u),t.getComponentType(u)!==o){const m=t.getTypeFromLength(d,o);p=t.format(p,u,m)}a.push(p)}const h=`${t.getType(s)}( ${a.join(", ")} )`;return t.format(h,s,e)}}const ha=Ve.join("");class ca extends L{static get type(){return"SplitNode"}constructor(t,e="x"){super(),this.node=t,this.components=e,this.isSplitNode=!0}getVectorLength(){let t=this.components.length;for(const e of this.components)t=Math.max(Ve.indexOf(e)+1,t);return t}getComponentType(t){return t.getComponentType(this.node.getNodeType(t))}generateNodeType(t){return t.getTypeFromLength(this.components.length,this.getComponentType(t))}getScope(){return this.node.getScope()}generate(t,e){const s=this.node,n=t.getTypeLength(s.getNodeType(t));let i=null;if(n>1){let o=null;this.getVectorLength()>=n&&(o=t.getTypeFromLength(this.getVectorLength(),this.getComponentType(t)));const l=s.build(t,o);this.components.length===n&&this.components===ha.slice(0,this.components.length)?i=t.format(l,o,e):i=t.format(`${l}.${this.components}`,this.getNodeType(t),e)}else i=s.build(t,e);return i}serialize(t){super.serialize(t),t.components=this.components}deserialize(t){super.deserialize(t),this.components=t.components}}class ua extends at{static get type(){return"SetNode"}constructor(t,e,s){super(),this.sourceNode=t,this.components=e,this.targetNode=s}generateNodeType(t){return this.sourceNode.getNodeType(t)}generate(t){const{sourceNode:e,components:s,targetNode:n}=this,i=this.getNodeType(t),o=t.getComponentType(n.getNodeType(t)),a=t.getTypeFromLength(s.length,o),l=n.build(t,a),h=e.build(t,i),c=t.getTypeLength(i),u=[];for(let d=0;d<c;d++){const p=Ve[d];p===s[0]?(u.push(l),d+=s.length-1):u.push(h+"."+p)}return`${t.getType(i)}( ${u.join(", ")} )`}}class da extends at{static get type(){return"FlipNode"}constructor(t,e){super(),this.sourceNode=t,this.components=e}generateNodeType(t){return this.sourceNode.getNodeType(t)}generate(t){const{components:e,sourceNode:s}=this,n=this.getNodeType(t),i=s.build(t),o=t.getVarFromNode(this),a=t.getPropertyName(o);t.addLineFlowCode(a+" = "+i,this);const l=t.getTypeLength(n),h=[];let c=0;for(let u=0;u<l;u++){const d=Ve[u];d===e[c]?(h.push("1.0 - "+(a+"."+d)),c++):h.push(a+"."+d)}return`${t.getType(n)}( ${h.join(", ")} )`}}class pn extends L{static get type(){return"InputNode"}constructor(t,e=null){super(e),this.isInputNode=!0,this.value=t,this.precision=null}generateNodeType(){return this.nodeType===null?Ns(this.value):this.nodeType}getInputType(t){return this.getNodeType(t)}setPrecision(t){return this.precision=t,this}serialize(t){super.serialize(t),t.value=this.value,this.value&&this.value.toArray&&(t.value=this.value.toArray()),t.valueType=Ns(this.value),t.nodeType=this.nodeType,t.valueType==="ArrayBuffer"&&(t.value=ia(t.value)),t.precision=this.precision}deserialize(t){super.deserialize(t),this.nodeType=t.nodeType,this.value=Array.isArray(t.value)?un(t.valueType,...t.value):t.value,this.precision=t.precision||null,this.value&&this.value.fromArray&&(this.value=this.value.fromArray(t.value))}generate(){O("Abstract function.")}}const Ii=/float|u?int/;class It extends pn{static get type(){return"ConstNode"}constructor(t,e=null){super(t,e),this.isConstNode=!0}generateConst(t){return t.generateConst(this.getNodeType(t),this.value)}generate(t,e){const s=this.getNodeType(t);return Ii.test(s)&&Ii.test(e)?t.generateConst(e,this.value):t.format(this.generateConst(t),s,e)}}class pa extends L{static get type(){return"MemberNode"}constructor(t,e){super(),this.structNode=t,this.property=e,this.isMemberNode=!0}hasMember(t){return this.structNode.isMemberNode&&this.structNode.hasMember(t)===!1?!1:this.structNode.getMemberType(t,this.property)!=="void"}generateNodeType(t){return this.hasMember(t)===!1?"float":this.structNode.getMemberType(t,this.property)}getMemberType(t,e){if(this.hasMember(t)===!1)return"float";const s=this.getNodeType(t);return t.getStructTypeNode(s).getMemberType(t,e)}generate(t){if(this.hasMember(t)===!1){O(`TSL: Member "${this.property}" does not exist in struct.`,this.stackTrace);const s=this.getNodeType(t);return t.generateConst(s)}return this.structNode.build(t)+"."+this.property}}let fa=null;const fn=new Map;function x(r,t){if(fn.has(r)){O(`TSL: Redefinition of method chaining \'${r}\'.`);return}if(typeof t!="function")throw new Error(`THREE.TSL: Node element ${r} is not a function`);fn.set(r,t),r!=="assign"&&(L.prototype[r]=function(...e){return this.isStackNode?this.addToStack(t(...e)):t(this,...e)},L.prototype[r+"Assign"]=function(...e){return this.isStackNode?this.assign(e[0],t(...e)):this.assign(t(this,...e))})}const ga=r=>r.replace(/r|s/g,"x").replace(/g|t/g,"y").replace(/b|p/g,"z").replace(/a|q/g,"w"),zi=r=>ga(r).split("").sort().join("");L.prototype.assign=function(...r){if(this.isStackNode!==!0)return K("TSL: No stack defined for assign operation. Make sure the assign is inside a Fn().",new Et),this;{const t=fn.get("assign");return this.addToStack(t(...r))}},L.prototype.toVarIntent=function(){return this},L.prototype.get=function(r){return new pa(this,r)};const We={};function Ts(r,t,e){We[r]=We[t]=We[e]={get(){this._cache=this._cache||{};let o=this._cache[r];return o===void 0&&(o=new ca(this,r),this._cache[r]=o),o},set(o){this[r].assign(E(o))}};const s=r.toUpperCase(),n=t.toUpperCase(),i=e.toUpperCase();L.prototype["set"+s]=L.prototype["set"+n]=L.prototype["set"+i]=function(o){const a=zi(r);return new ua(this,a,E(o))},L.prototype["flip"+s]=L.prototype["flip"+n]=L.prototype["flip"+i]=function(){const o=zi(r);return new da(this,o)}}const zt=["x","y","z","w"],Ft=["r","g","b","a"],Pt=["s","t","p","q"];for(let r=0;r<4;r++){let t=zt[r],e=Ft[r],s=Pt[r];Ts(t,e,s);for(let n=0;n<4;n++){t=zt[r]+zt[n],e=Ft[r]+Ft[n],s=Pt[r]+Pt[n],Ts(t,e,s);for(let i=0;i<4;i++){t=zt[r]+zt[n]+zt[i],e=Ft[r]+Ft[n]+Ft[i],s=Pt[r]+Pt[n]+Pt[i],Ts(t,e,s);for(let o=0;o<4;o++)t=zt[r]+zt[n]+zt[i]+zt[o],e=Ft[r]+Ft[n]+Ft[i]+Ft[o],s=Pt[r]+Pt[n]+Pt[i]+Pt[o],Ts(t,e,s)}}}for(let r=0;r<32;r++)We[r]={get(){this._cache=this._cache||{};let t=this._cache[r];return t===void 0&&(t=new Ge(this,new It(r,"uint")),this._cache[r]=t),t},set(t){this[r].assign(E(t))}};Object.defineProperties(L.prototype,We);const ma=function(r,t=null){const e=Ns(r);return e==="node"?r:t===null&&(e==="float"||e==="boolean")||e&&e!=="shader"&&e!=="string"?E(xn(r,t)):e==="shader"?r.isFn?r:_(r):r},ya=function(r,t=null){for(const e in r)r[e]=E(r[e],t);return r},xa=function(r,t=null){const e=r.length;for(let s=0;s<e;s++)r[s]=E(r[s],t);return r},Fi=function(r,t=null,e=null,s=null){function n(c){return s!==null?(c=E(Object.assign(c,s)),s.intent===!0&&(c=c.toVarIntent())):c=E(c),c}let i,o=t,a,l;function h(c){let u;return o?u=/[a-z]/i.test(o)?o+"()":o:u=r.type,a!==void 0&&c.length<a?(K(`TSL: "${u}" parameter length is less than minimum required.`,new Et),c.concat(new Array(a-c.length).fill(0))):l!==void 0&&c.length>l?(K(`TSL: "${u}" parameter length exceeds limit.`,new Et),c.slice(0,l)):c}return t===null?i=(...c)=>n(new r(...Ae(h(c)))):e!==null?(e=E(e),i=(...c)=>n(new r(t,...Ae(h(c)),e))):i=(...c)=>n(new r(t,...Ae(h(c)))),i.setParameterLength=(...c)=>(c.length===1?a=l=c[0]:c.length===2&&([a,l]=c),i),i.setName=c=>(o=c,i),i},wa=function(r,...t){return new r(...Ae(t))};class Na extends L{constructor(t,e){super(),this.shaderNode=t,this.rawInputs=e,this.isShaderCallNodeInternal=!0}generateNodeType(t){return this.shaderNode.nodeType||this.getOutputNode(t).getNodeType(t)}getElementType(t){return this.getOutputNode(t).getElementType(t)}getMemberType(t,e){return this.getOutputNode(t).getMemberType(t,e)}call(t){const{shaderNode:e,rawInputs:s}=this,n=t.getNodeProperties(e),i=t.getClosestSubBuild(e.subBuilds)||"",o=i||"default";if(n[o])return n[o];const a=t.subBuildFn,l=t.fnCall;t.subBuildFn=i,t.fnCall=this;let h=null;if(e.layout){if(s){const d=e.layout.inputs;if(Pi(s)){const p=s;for(let f=0;f<d.length;f++){const m=p[f];m&&m.isNode&&m.build(t)}}else{const p=s[0];for(const f of d){const m=p[f.name];m&&m.isNode&&m.build(t)}}}const c=t.buildFunctionNode(e);t.addInclude(c);const u=s?Ta(s):null;h=c.call(u)}else{const c=new Proxy(t,{get:(m,y,w)=>{let M;return Symbol.iterator===y?M=function*(){yield void 0}:M=Reflect.get(m,y,w),M}}),u=s?Sa(s):null,d=Array.isArray(s)?s.length>0:s!==null,p=e.jsFunc,f=d||p.length>1?p(u,c):p(c);h=E(f)}return t.subBuildFn=a,t.fnCall=l,e.once&&(n[o]=h),h}setupOutput(t){return t.addStack(),t.stack.outputNode=this.call(t),t.removeStack()}getOutputNode(t){const e=t.getNodeProperties(this),s=t.getSubBuildOutput(this);return e[s]=e[s]||this.setupOutput(t),e[s].subBuild=t.getClosestSubBuild(this),e[s]}build(t,e=null){let s=null;const n=t.getBuildStage(),i=t.getNodeProperties(this),o=t.getSubBuildOutput(this),a=this.getOutputNode(t),l=t.fnCall;if(t.fnCall=this,n==="setup"){const h=t.getSubBuildProperty("initialized",this);if(i[h]!==!0&&(i[h]=!0,i[o]=this.getOutputNode(t),i[o].build(t),this.shaderNode.subBuilds))for(const c of t.chaining){const u=t.getDataFromNode(c,"any");u.subBuilds=u.subBuilds||new Set;for(const d of this.shaderNode.subBuilds)u.subBuilds.add(d)}s=i[o]}else n==="analyze"?a.build(t,e):n==="generate"&&(s=a.build(t,e)||"");return t.fnCall=l,s}}function Pi(r){return r[0]&&(r[0].isNode||Object.getPrototypeOf(r[0])!==Object.prototype)}function Ta(r){let t;return wn(r),Pi(r)?t=[...r]:t=r[0],t}function Sa(r){let t=0;return wn(r),new Proxy(r,{get:(e,s,n)=>{let i;if(s==="length")return i=r.length,i;if(Symbol.iterator===s)i=function*(){for(const o of r)yield E(o)};else{if(r.length>0)if(Object.getPrototypeOf(r[0])===Object.prototype){const o=r[0];o[s]===void 0?i=o[t++]:i=Reflect.get(o,s,n)}else r[0]instanceof L&&(r[s]===void 0?i=r[t++]:i=Reflect.get(r,s,n));else i=Reflect.get(e,s,n);i=E(i)}return i}})}class va extends L{constructor(t,e){super(e),this.jsFunc=t,this.layout=null,this.global=!0,this.once=!1}setLayout(t){return this.layout=t,this}getLayout(){return this.layout}call(t=null){return new Na(this,t)}setup(){return this.call()}}const Ma=[!1,!0],Ca=[0,1,2,3],ba=[-1,-2],Oi=[.5,1.5,1/3,1e-6,1e6,Math.PI,Math.PI*2,1/Math.PI,2/Math.PI,1/(Math.PI*2),Math.PI/2],gn=new Map;for(const r of Ma)gn.set(r,new It(r));const mn=new Map;for(const r of Ca)mn.set(r,new It(r,"uint"));const yn=new Map([...mn].map(r=>new It(r.value,"int")));for(const r of ba)yn.set(r,new It(r,"int"));const Ss=new Map([...yn].map(r=>new It(r.value)));for(const r of Oi)Ss.set(r,new It(r));for(const r of Oi)Ss.set(-r,new It(-r));const vs={bool:gn,uint:mn,ints:yn,float:Ss},ki=new Map([...gn,...Ss]),xn=(r,t)=>ki.has(r)?ki.get(r):r.isNode===!0?r:new It(r,t),nt=function(r,t=null){return(...e)=>{for(const n of e)if(n===void 0)return K(`TSL: Invalid parameter for the type "${r}".`,new Et),new It(0,r);if((e.length===0||!["bool","float","int","uint"].includes(r)&&e.every(n=>{const i=typeof n;return i!=="object"&&i!=="function"}))&&(e=[un(r,...e)]),e.length===1&&t!==null&&t.has(e[0]))return Ms(t.get(e[0]));if(e.length===1){const n=xn(e[0],r);return n.nodeType===r?Ms(n):Ms(new Li(n,r))}const s=e.map(n=>xn(n));return Ms(new la(s,r))}};function Ea(r){return r&&r.isNode&&r.traverse(t=>{t.isConstNode&&(r=t.value)}),!!r}const Aa=r=>r!=null?r.nodeType||r.convertTo||(typeof r=="string"?r:null):null;function _a(r,t){return new va(r,t)}const E=(r,t=null)=>ma(r,t),Ms=(r,t=null)=>E(r,t).toVarIntent(),wn=(r,t=null)=>new ya(r,t),Ae=(r,t=null)=>new xa(r,t),rt=(r,t=null,e=null,s=null)=>new Fi(r,t,e,s),A=(r,...t)=>new wa(r,...t),v=(r,t=null,e=null,s={})=>new Fi(r,t,e,{...s,intent:!0});let Ra=0;class La extends L{constructor(t,e=null){super();let s=null;e!==null&&(typeof e=="object"?s=e.return:(typeof e=="string"?s=e:K("TSL: Invalid layout type.",new Et),e=null)),this.shaderNode=new _a(t,s),e!==null&&this.setLayout(e),this.isFn=!0}setLayout(t){const e=this.shaderNode.nodeType;if(typeof t.inputs!="object"){const s={name:"fn"+Ra++,type:e,inputs:[]};for(const n in t)n!=="return"&&s.inputs.push({name:n,type:t[n]});t=s}return this.shaderNode.setLayout(t),this}generateNodeType(t){return this.shaderNode.getNodeType(t)||"float"}call(...t){const e=this.shaderNode.call(t);return this.shaderNode.nodeType==="void"&&e.toStack(),e.toVarIntent()}once(t=null){return this.shaderNode.once=!0,this.shaderNode.subBuilds=t,this}generate(t){const e=this.getNodeType(t);return K(\'TSL: "Fn()" was declared but not invoked. Try calling it like "Fn()( ...params )".\',this.stackTrace),t.generateConst(e)}}function _(r,t=null){const e=new La(r,t);return new Proxy(()=>{},{apply(s,n,i){return e.call(...i)},get(s,n,i){return Reflect.get(e,n,i)},set(s,n,i,o){return Reflect.set(e,n,i,o)}})}const ft=(...r)=>fa.If(...r);function Ia(r){return r}x("toStack",Ia);const za=new nt("color"),B=new nt("float",vs.float),$e=new nt("int",vs.ints),lt=new nt("uint",vs.uint),Nn=new nt("bool",vs.bool),qt=new nt("vec2"),Bi=new nt("ivec2"),Di=new nt("uvec2"),Fa=new nt("bvec2"),F=new nt("vec3"),Ui=new nt("ivec3"),Vi=new nt("uvec3"),Pa=new nt("bvec3"),H=new nt("vec4"),Gi=new nt("ivec4"),Wi=new nt("uvec4"),Oa=new nt("bvec4"),$i=new nt("mat2"),ue=new nt("mat3"),qi=new nt("mat4");x("toColor",za),x("toFloat",B),x("toInt",$e),x("toUint",lt),x("toBool",Nn),x("toVec2",qt),x("toIVec2",Bi),x("toUVec2",Di),x("toBVec2",Fa),x("toVec3",F),x("toIVec3",Ui),x("toUVec3",Vi),x("toBVec3",Pa),x("toVec4",H),x("toIVec4",Gi),x("toUVec4",Wi),x("toBVec4",Oa),x("toMat2",$i),x("toMat3",ue),x("toMat4",qi);const ka=rt(Ge).setParameterLength(2),Ba=(r,t)=>new Li(E(r),t);x("element",ka),x("convert",Ba),x("append",r=>(O("TSL: .append() has been renamed to .toStack().",new Et),r));class _e extends L{static get type(){return"PropertyNode"}constructor(t,e=null,s=!1,n=null){super(t),this.name=e,this.varying=s,this.placeholderNode=E(n),this.isPropertyNode=!0,this.global=!0}getNodeType(t){const e=super.getNodeType(t);return e==="output"?t.getOutputType():e}customCacheKey(){return _i(this.type+":"+(this.name||"")+":"+(this.varying?"1":"0"))}getHash(t){return this.name||super.getHash(t)}generate(t){let e;if(this.varying===!0)e=t.getVaryingFromNode(this,this.name),e.needsInterpolation=!0;else if(e=t.getVarFromNode(this,this.name),this.placeholderNode!==null&&t.hasWriteUsage(this)===!1){const s=this.placeholderNode.build(t,this.getNodeType(t));t.addLineFlowCode(`${t.getPropertyName(e)} = ${s}`,this)}return t.getPropertyName(e)}}const de=(r,t,e=null)=>new _e(r,t,!1,e),Cs=(r,t,e=null)=>new _e(r,t,!0,e),Hi=A(_e,"vec4","DiffuseColor"),ji=A(_e,"output","Output"),Tn=A(_e,"float","dashSize"),Yi=A(_e,"float","gapSize");class Xi extends L{static get type(){return"UniformGroupNode"}constructor(t,e=!1,s=1,n=null){super("string"),this.name=t,this.shared=e,this.order=s,this.updateType=n,this.isUniformGroup=!0}update(){this.needsUpdate=!0}serialize(t){super.serialize(t),t.name=this.name,t.version=this.version,t.shared=this.shared}deserialize(t){super.deserialize(t),this.name=t.name,this.version=t.version,this.shared=t.shared}}const Da=(r,t=1,e=null)=>new Xi(r,!1,t,e),Sn=(r,t=0,e=null)=>new Xi(r,!0,t,e);W.FRAME;const ut=Sn("render",0,W.RENDER),Ua=Da("object",1,W.OBJECT);class qe extends pn{static get type(){return"UniformNode"}constructor(t,e=null){super(t,e),this.isUniformNode=!0,this.name="",this.groupNode=Ua}setName(t){return this.name=t,this}label(t){return O(\'TSL: "label()" has been deprecated. Use "setName()" instead.\',new Et),this.setName(t)}setGroup(t){return this.groupNode=t,this}getGroup(){return this.groupNode}getUniformHash(t){return this.getHash(t)}onUpdate(t,e){return t=t.bind(this),super.onUpdate(s=>{const n=t(s,this);n!==void 0&&(this.value=n)},e)}getInputType(t){let e=super.getInputType(t);return e==="bool"&&(e="uint"),e}generate(t,e){const s=this.getNodeType(t),n=this.getUniformHash(t);let i=t.getNodeFromHash(n);i===void 0&&(t.setHashNode(this,n),i=this);const o=i.getInputType(t),a=t.getUniformFromNode(i,o,t.shaderStage,this.name||t.context.nodeName),l=t.getPropertyName(a);t.context.nodeName!==void 0&&delete t.context.nodeName;let h=l;if(s==="bool"){const c=t.getDataFromNode(this);let u=c.propertyName;if(u===void 0){const d=t.getVarFromNode(this,null,"bool");u=t.getPropertyName(d),c.propertyName=u,h=t.format(l,o,s),t.addLineFlowCode(`${u} = ${h}`,this)}h=u}return t.format(h,s,e)}}const et=(r,t)=>{const e=Aa(t||r);if(e===r&&(r=un(e)),r&&r.isNode===!0){let s=r.value;r.traverse(n=>{n.isConstNode===!0&&(s=n.value)}),r=s}return new qe(r,e)};class Zi extends at{static get type(){return"ArrayNode"}constructor(t,e,s=null){super(t),this.count=e,this.values=s,this.isArrayNode=!0}getArrayCount(){return this.count}generateNodeType(t){return this.nodeType===null?this.values[0].getNodeType(t):this.nodeType}getElementType(t){return this.getNodeType(t)}getMemberType(t,e){return this.nodeType===null?this.values[0].getMemberType(t,e):super.getMemberType(t,e)}generate(t){const e=this.getNodeType(t);return t.generateArray(e,this.count,this.values)}}const Va=(...r)=>{let t;if(r.length===1){const e=r[0];t=new Zi(null,e.length,e)}else{const e=r[0],s=r[1];t=new Zi(e,s)}return E(t)};x("toArray",(r,t)=>Va(Array(t).fill(r)));class Ga extends at{static get type(){return"AssignNode"}constructor(t,e){super(),this.targetNode=t,this.sourceNode=e,this.isAssignNode=!0}hasDependencies(){return!1}generateNodeType(t,e){return e!=="void"?this.targetNode.getNodeType(t):"void"}needsSplitAssign(t){const{targetNode:e}=this;if(t.isAvailable("swizzleAssign")===!1&&e.isSplitNode&&e.components.length>1){const s=t.getTypeLength(e.node.getNodeType(t));return Ve.join("").slice(0,s)!==e.components}return!1}setup(t){const{targetNode:e,sourceNode:s}=this,n=e.getScope(),i=t.getDataFromNode(n);i.assign=!0;const o=t.getNodeProperties(this);o.sourceNode=s,o.targetNode=e.context({assign:!0})}generate(t,e){const{targetNode:s,sourceNode:n}=t.getNodeProperties(this),i=this.needsSplitAssign(t),o=s.build(t),a=s.getNodeType(t),l=n.build(t,a),h=n.getNodeType(t),c=t.getDataFromNode(this);let u;if(c.initialized===!0)e!=="void"&&(u=o);else if(i){const d=t.getVarFromNode(this,null,a),p=t.getPropertyName(d);t.addLineFlowCode(`${p} = ${l}`,this);const f=s.node,y=f.node.context({assign:!0}).build(t);for(let w=0;w<f.components.length;w++){const M=f.components[w];t.addLineFlowCode(`${y}.${M} = ${p}[ ${w} ]`,this)}e!=="void"&&(u=o)}else u=`${o} = ${l}`,(e==="void"||h==="void")&&(t.addLineFlowCode(u,this),e!=="void"&&(u=o));return c.initialized=!0,t.format(u,a,e)}}x("assign",rt(Ga).setParameterLength(2));class Wa extends at{static get type(){return"FunctionCallNode"}constructor(t=null,e={}){super(),this.functionNode=t,this.parameters=e}setParameters(t){return this.parameters=t,this}getParameters(){return this.parameters}generateNodeType(t){return this.functionNode.getNodeType(t)}getMemberType(t,e){return this.functionNode.getMemberType(t,e)}generate(t){const e=[],s=this.functionNode,n=s.getInputs(t),i=this.parameters,o=(l,h)=>{const c=h.type,u=c==="pointer";let d;return u?d="&"+l.build(t):d=l.build(t,c),d};if(Array.isArray(i)){if(i.length>n.length)K("TSL: The number of provided parameters exceeds the expected number of inputs in \'Fn()\'."),i.length=n.length;else if(i.length<n.length)for(K("TSL: The number of provided parameters is less than the expected number of inputs in \'Fn()\'.");i.length<n.length;)i.push(B(0));for(let l=0;l<i.length;l++)e.push(o(i[l],n[l]))}else for(const l of n){const h=i[l.name];h!==void 0?e.push(o(h,l)):(K(`TSL: Input \'${l.name}\' not found in \'Fn()\'.`),e.push(o(B(0),l)))}return`${s.build(t,"property")}( ${e.join(", ")} )`}}x("call",(r,...t)=>(t=t.length>1||t[0]&&t[0].isNode===!0?Ae(t):wn(t[0]),new Wa(E(r),t)));const $a={"==":"equal","!=":"notEqual","<":"lessThan",">":"greaterThan","<=":"lessThanEqual",">=":"greaterThanEqual","%":"mod"};class Q extends at{static get type(){return"OperatorNode"}constructor(t,e,s,...n){if(super(),n.length>0){let i=new Q(t,e,s);for(let o=0;o<n.length-1;o++)i=new Q(t,i,n[o]);e=i,s=n[n.length-1]}this.op=t,this.aNode=e,this.bNode=s,this.isOperatorNode=!0}getOperatorMethod(t,e){return t.getMethod($a[this.op],e)}generateNodeType(t,e=null){const s=this.op,n=this.aNode,i=this.bNode,o=n.getNodeType(t),a=i?i.getNodeType(t):null;if(o==="void"||a==="void")return e||"void";if(s==="%")return o;if(s==="~"||s==="&"||s==="|"||s==="^"||s===">>"||s==="<<")return t.getIntegerType(o);if(s==="&&"||s==="||"||s==="^^")return"bool";if(s==="!"){const l=t.getTypeLength(o);return l>1?`bvec${l}`:"bool"}else if(s==="=="||s==="!="||s==="<"||s===">"||s==="<="||s===">="){const l=Math.max(t.getTypeLength(o),t.getTypeLength(a));return l>1?`bvec${l}`:"bool"}else{if(t.isMatrix(o)){if(a==="float")return o;if(t.isVector(a))return t.getVectorFromMatrix(o);if(t.isMatrix(a))return o}else if(t.isMatrix(a)){if(o==="float")return a;if(t.isVector(o))return t.getVectorFromMatrix(a)}return t.getTypeLength(a)>t.getTypeLength(o)?a:o}}generate(t,e){const s=this.op,{aNode:n,bNode:i}=this,o=this.getNodeType(t,e);let a=null,l=null;o!=="void"?(a=n.getNodeType(t),l=i?i.getNodeType(t):null,s==="<"||s===">"||s==="<="||s===">="||s==="=="||s==="!="?t.isVector(a)?l=a:t.isVector(l)?a=l:a!==l&&(a=l="float"):s===">>"||s==="<<"?(a=o,l=t.changeComponentType(l,"uint")):s==="%"?(a=o,l=t.isInteger(a)&&t.isInteger(l)?l:a):t.isMatrix(a)?l==="float"?l="float":t.isVector(l)?l=t.getVectorFromMatrix(a):t.isMatrix(l)||(a=l=o):t.isMatrix(l)?a==="float"?a="float":t.isVector(a)?a=t.getVectorFromMatrix(l):a=l=o:a=l=o):a=l=o;const h=n.build(t,a),c=i?i.build(t,l):null,u=t.getFunctionOperator(s);if(e!=="void"){const d=t.renderer.coordinateSystem===2e3;if(s==="=="||s==="!="||s==="<"||s===">"||s==="<="||s===">=")return d?t.isVector(a)?t.format(`${this.getOperatorMethod(t,e)}( ${h}, ${c} )`,o,e):t.format(`( ${h} ${s} ${c} )`,o,e):t.format(`( ${h} ${s} ${c} )`,o,e);if(s==="%")return t.isInteger(l)?t.format(`( ${h} % ${c} )`,o,e):t.format(`${this.getOperatorMethod(t,o)}( ${h}, ${c} )`,o,e);if(s==="!")return d&&t.isVector(a)?t.format(`not( ${h} )`,e):t.format(`( ${s} ${h} )`,a,e);if(s==="~")return t.format(`( ${s} ${h} )`,a,e);if(u)return t.format(`${u}( ${h}, ${c} )`,o,e);if(t.isMatrix(a)&&l==="float")return t.format(`( ${c} ${s} ${h} )`,o,e);if(a==="float"&&t.isMatrix(l))return t.format(`${h} ${s} ${c}`,o,e);{let p=`( ${h} ${s} ${c} )`;return!d&&o==="bool"&&t.isVector(a)&&t.isVector(l)&&(p=`all${p}`),t.format(p,o,e)}}else if(a!=="void")return u?t.format(`${u}( ${h}, ${c} )`,o,e):t.isMatrix(a)&&l==="float"?t.format(`${c} ${s} ${h}`,o,e):t.format(`${h} ${s} ${c}`,o,e)}serialize(t){super.serialize(t),t.op=this.op}deserialize(t){super.deserialize(t),this.op=t.op}}const qa=v(Q,"+").setParameterLength(2,1/0).setName("add"),vn=v(Q,"-").setParameterLength(2,1/0).setName("sub"),ne=v(Q,"*").setParameterLength(2,1/0).setName("mul"),Ji=v(Q,"/").setParameterLength(2,1/0).setName("div"),Qi=v(Q,"%").setParameterLength(2).setName("mod"),Ha=v(Q,"==").setParameterLength(2).setName("equal"),ja=v(Q,"!=").setParameterLength(2).setName("notEqual"),Ya=v(Q,"<").setParameterLength(2).setName("lessThan"),Xa=v(Q,">").setParameterLength(2).setName("greaterThan"),Za=v(Q,"<=").setParameterLength(2).setName("lessThanEqual"),Ja=v(Q,">=").setParameterLength(2).setName("greaterThanEqual"),Qa=v(Q,"&&").setParameterLength(2,1/0).setName("and"),Ka=v(Q,"||").setParameterLength(2,1/0).setName("or"),tl=v(Q,"!").setParameterLength(1).setName("not"),el=v(Q,"^^").setParameterLength(2).setName("xor"),sl=v(Q,"&").setParameterLength(2).setName("bitAnd"),nl=v(Q,"~").setParameterLength(1).setName("bitNot"),il=v(Q,"|").setParameterLength(2).setName("bitOr"),rl=v(Q,"^").setParameterLength(2).setName("bitXor"),ol=v(Q,"<<").setParameterLength(2).setName("shiftLeft"),al=v(Q,">>").setParameterLength(2).setName("shiftRight"),ll=_(([r])=>(r.addAssign(1),r)),hl=_(([r])=>(r.subAssign(1),r)),cl=_(([r])=>{const t=$e(r).toConst();return r.addAssign(1),t}),ul=_(([r])=>{const t=$e(r).toConst();return r.subAssign(1),t});x("add",qa),x("sub",vn),x("mul",ne),x("div",Ji),x("mod",Qi),x("equal",Ha),x("notEqual",ja),x("lessThan",Ya),x("greaterThan",Xa),x("lessThanEqual",Za),x("greaterThanEqual",Ja),x("and",Qa),x("or",Ka),x("not",tl),x("xor",el),x("bitAnd",sl),x("bitNot",nl),x("bitOr",il),x("bitXor",rl),x("shiftLeft",ol),x("shiftRight",al),x("incrementBefore",ll),x("decrementBefore",hl),x("increment",cl),x("decrement",ul);class g extends at{static get type(){return"MathNode"}constructor(t,e,s=null,n=null){if(super(),(t===g.MAX||t===g.MIN)&&arguments.length>3){let i=new g(t,e,s);for(let o=3;o<arguments.length-1;o++)i=new g(t,i,arguments[o]);e=i,s=arguments[arguments.length-1],n=null}this.method=t,this.aNode=e,this.bNode=s,this.cNode=n,this.isMathNode=!0}getInputType(t){const e=this.aNode.getNodeType(t),s=this.bNode?this.bNode.getNodeType(t):null,n=this.cNode?this.cNode.getNodeType(t):null,i=t.isMatrix(e)?0:t.getTypeLength(e),o=t.isMatrix(s)?0:t.getTypeLength(s),a=t.isMatrix(n)?0:t.getTypeLength(n);return i>o&&i>a?e:o>a?s:a>i?n:e}generateNodeType(t){const e=this.method;return e===g.LENGTH||e===g.DISTANCE||e===g.DOT?"float":e===g.CROSS?"vec3":e===g.ALL||e===g.ANY?"bool":e===g.EQUALS?t.changeComponentType(this.aNode.getNodeType(t),"bool"):this.getInputType(t)}setup(t){const{aNode:e,bNode:s,method:n}=this;let i=null;if(n===g.ONE_MINUS)i=vn(1,e);else if(n===g.RECIPROCAL)i=Ji(1,e);else if(n===g.DIFFERENCE)i=bn(vn(e,s));else if(n===g.TRANSFORM_DIRECTION){let o,a;t.isMatrix(e.getNodeType(t))?(o=e,a=s):(o=s,a=e),i=bs(ne(o,H(F(a),0)).xyz)}return i!==null?i:super.setup(t)}generate(t,e){if(t.getNodeProperties(this).outputNode)return super.generate(t,e);let n=this.method;const i=this.getNodeType(t),o=this.getInputType(t),a=this.aNode,l=this.bNode,h=this.cNode,c=t.renderer.coordinateSystem;if(n===g.NEGATE)return t.format("( - "+a.build(t,o)+" )",i,e);{const u=[];return n===g.CROSS?u.push(a.build(t,i),l.build(t,i)):c===2e3&&n===g.STEP?u.push(a.build(t,t.getTypeLength(a.getNodeType(t))===1?"float":o),l.build(t,o)):c===2e3&&(n===g.MIN||n===g.MAX)?u.push(a.build(t,o),l.build(t,t.getTypeLength(l.getNodeType(t))===1?"float":o)):n===g.REFRACT?u.push(a.build(t,o),l.build(t,o),h.build(t,"float")):n===g.MIX?u.push(a.build(t,o),l.build(t,o),h.build(t,t.getTypeLength(h.getNodeType(t))===1?"float":o)):(c===2001&&n===g.ATAN&&l!==null&&(n="atan2"),t.shaderStage!=="fragment"&&(n===g.DFDX||n===g.DFDY)&&(O(`TSL: \'${n}\' is not supported in the ${t.shaderStage} stage.`,this.stackTrace),n="/*"+n+"*/"),u.push(a.build(t,o)),l!==null&&u.push(l.build(t,o)),h!==null&&u.push(h.build(t,o))),t.format(`${t.getMethod(n,i)}( ${u.join(", ")} )`,i,e)}}serialize(t){super.serialize(t),t.method=this.method}deserialize(t){super.deserialize(t),this.method=t.method}}g.ALL="all",g.ANY="any",g.RADIANS="radians",g.DEGREES="degrees",g.EXP="exp",g.EXP2="exp2",g.LOG="log",g.LOG2="log2",g.SQRT="sqrt",g.INVERSE_SQRT="inversesqrt",g.FLOOR="floor",g.CEIL="ceil",g.NORMALIZE="normalize",g.FRACT="fract",g.SIN="sin",g.SINH="sinh",g.COS="cos",g.COSH="cosh",g.TAN="tan",g.TANH="tanh",g.ASIN="asin",g.ASINH="asinh",g.ACOS="acos",g.ACOSH="acosh",g.ATAN="atan",g.ATANH="atanh",g.ABS="abs",g.SIGN="sign",g.LENGTH="length",g.NEGATE="negate",g.ONE_MINUS="oneMinus",g.DFDX="dFdx",g.DFDY="dFdy",g.ROUND="round",g.RECIPROCAL="reciprocal",g.TRUNC="trunc",g.FWIDTH="fwidth",g.TRANSPOSE="transpose",g.DETERMINANT="determinant",g.INVERSE="inverse",g.EQUALS="equals",g.MIN="min",g.MAX="max",g.STEP="step",g.REFLECT="reflect",g.DISTANCE="distance",g.DIFFERENCE="difference",g.DOT="dot",g.CROSS="cross",g.POW="pow",g.TRANSFORM_DIRECTION="transformDirection",g.MIX="mix",g.CLAMP="clamp",g.REFRACT="refract",g.SMOOTHSTEP="smoothstep",g.FACEFORWARD="faceforward";const dl=B(Math.PI),pl=v(g,g.ALL).setParameterLength(1),fl=v(g,g.ANY).setParameterLength(1),gl=v(g,g.RADIANS).setParameterLength(1),ml=v(g,g.DEGREES).setParameterLength(1),yl=v(g,g.EXP).setParameterLength(1),xl=v(g,g.EXP2).setParameterLength(1),wl=v(g,g.LOG).setParameterLength(1),Nl=v(g,g.LOG2).setParameterLength(1),Mn=v(g,g.SQRT).setParameterLength(1),Tl=v(g,g.INVERSE_SQRT).setParameterLength(1),Sl=v(g,g.FLOOR).setParameterLength(1),vl=v(g,g.CEIL).setParameterLength(1),bs=v(g,g.NORMALIZE).setParameterLength(1),Es=v(g,g.FRACT).setParameterLength(1),Cn=v(g,g.SIN).setParameterLength(1),Ml=v(g,g.SINH).setParameterLength(1),Ki=v(g,g.COS).setParameterLength(1),Cl=v(g,g.COSH).setParameterLength(1),bl=v(g,g.TAN).setParameterLength(1),El=v(g,g.TANH).setParameterLength(1),Al=v(g,g.ASIN).setParameterLength(1),_l=v(g,g.ASINH).setParameterLength(1),Rl=v(g,g.ACOS).setParameterLength(1),Ll=v(g,g.ACOSH).setParameterLength(1),Il=v(g,g.ATAN).setParameterLength(1,2),zl=v(g,g.ATANH).setParameterLength(1),bn=v(g,g.ABS).setParameterLength(1),tr=v(g,g.SIGN).setParameterLength(1),Fl=v(g,g.LENGTH).setParameterLength(1),er=v(g,g.NEGATE).setParameterLength(1),Pl=v(g,g.ONE_MINUS).setParameterLength(1),Ol=v(g,g.DFDX).setParameterLength(1),kl=v(g,g.DFDY).setParameterLength(1),Bl=v(g,g.ROUND).setParameterLength(1),Dl=v(g,g.RECIPROCAL).setParameterLength(1),Ul=v(g,g.TRUNC).setParameterLength(1),Vl=v(g,g.FWIDTH).setParameterLength(1),Gl=v(g,g.TRANSPOSE).setParameterLength(1),Wl=v(g,g.DETERMINANT).setParameterLength(1),$l=v(g,g.INVERSE).setParameterLength(1),ql=v(g,g.MIN).setParameterLength(2,1/0),Hl=v(g,g.MAX).setParameterLength(2,1/0),En=v(g,g.STEP).setParameterLength(2),jl=v(g,g.REFLECT).setParameterLength(2),Yl=v(g,g.DISTANCE).setParameterLength(2),Xl=v(g,g.DIFFERENCE).setParameterLength(2),He=v(g,g.DOT).setParameterLength(2),Zl=v(g,g.CROSS).setParameterLength(2),sr=v(g,g.POW).setParameterLength(2),Jl=r=>ne(r,r),Ql=r=>ne(r,r,r),Kl=r=>ne(r,r,r,r),th=v(g,g.TRANSFORM_DIRECTION).setParameterLength(2),eh=(r,t)=>bs(ne(t,H(F(r),0)).xyz),sh=(r,t)=>bs(H(F(r),0).mul(t).xyz),nh=r=>ne(tr(r),sr(bn(r),1/3)),nr=r=>He(r,r),ie=v(g,g.MIX).setParameterLength(3),ir=(r,t=0,e=1)=>new g(g.CLAMP,E(r),E(t),E(e)),rr=r=>ir(r),ih=v(g,g.REFRACT).setParameterLength(3),pe=v(g,g.SMOOTHSTEP).setParameterLength(3),rh=v(g,g.FACEFORWARD).setParameterLength(3),oh=_(([r])=>{const s=43758.5453,n=He(r.xy,qt(12.9898,78.233)),i=Qi(n,dl);return Es(Cn(i).mul(s))}),ah=(r,t,e)=>ie(t,e,r),lh=(r,t,e)=>pe(t,e,r),hh=(r,t)=>En(t,r);x("all",pl),x("any",fl),x("radians",gl),x("degrees",ml),x("exp",yl),x("exp2",xl),x("log",wl),x("log2",Nl),x("sqrt",Mn),x("inverseSqrt",Tl),x("floor",Sl),x("ceil",vl),x("normalize",bs),x("fract",Es),x("sin",Cn),x("sinh",Ml),x("cos",Ki),x("cosh",Cl),x("tan",bl),x("tanh",El),x("asin",Al),x("asinh",_l),x("acos",Rl),x("acosh",Ll),x("atan",Il),x("atanh",zl),x("abs",bn),x("sign",tr),x("length",Fl),x("lengthSq",nr),x("negate",er),x("oneMinus",Pl),x("dFdx",Ol),x("dFdy",kl),x("round",Bl),x("reciprocal",Dl),x("trunc",Ul),x("fwidth",Vl),x("min",ql),x("max",Hl),x("step",hh),x("reflect",jl),x("distance",Yl),x("dot",He),x("cross",Zl),x("pow",sr),x("pow2",Jl),x("pow3",Ql),x("pow4",Kl),x("transformDirection",th),x("transformNormalByViewMatrix",eh),x("transformNormalByInverseViewMatrix",sh),x("mix",ah),x("clamp",ir),x("refract",ih),x("smoothstep",lh),x("faceForward",rh),x("difference",Xl),x("saturate",rr),x("cbrt",nh),x("transpose",Gl),x("determinant",Wl),x("inverse",$l),x("rand",oh);class ch extends L{static get type(){return"ConditionalNode"}constructor(t,e,s=null){super(),this.condNode=t,this.ifNode=e,this.elseNode=s}generateNodeType(t){const{ifNode:e,elseNode:s}=t.getNodeProperties(this);if(e===void 0)return t.flowBuildStage(this,"setup"),this.getNodeType(t);const n=e.getNodeType(t);if(s!==null){const i=s.getNodeType(t);if(t.getTypeLength(i)>t.getTypeLength(n))return i}return n}setup(t){const e=this.condNode,s=this.ifNode.isolate(),n=this.elseNode?this.elseNode.isolate():null,i=t.context.nodeBlock;t.getDataFromNode(s).parentNodeBlock=i,n!==null&&(t.getDataFromNode(n).parentNodeBlock=i);const o=t.context.uniformFlow,a=t.getNodeProperties(this);a.condNode=e,a.ifNode=o?s:s.context({nodeBlock:s}),a.elseNode=n?o?n:n.context({nodeBlock:n}):null}generate(t,e){const s=this.getNodeType(t),n=t.getDataFromNode(this);if(n.nodeProperty!==void 0)return n.nodeProperty;const{condNode:i,ifNode:o,elseNode:a}=t.getNodeProperties(this),l=t.currentFunctionNode,h=e!=="void",c=h?de(s).build(t):"";n.nodeProperty=c;const u=i.build(t,"bool");if(t.context.uniformFlow&&a!==null){const f=o.build(t,s),m=a.build(t,s),y=t.getTernary(u,f,m);return t.format(y,s,e)}t.addFlowCode(`\n${t.tab}if ( ${u} ) {\n\n`).addFlowTab();let p=o.build(t,s);if(p&&(h?p=c+" = "+p+";":(p="return "+p+";",l===null&&(O("TSL: Return statement used in an inline \'Fn()\'. Define a layout struct to allow return values.",this.stackTrace),p="// "+p))),t.removeFlowTab().addFlowCode(t.tab+"	"+p+`\n\n`+t.tab+"}"),a!==null){t.addFlowCode(` else {\n\n`).addFlowTab();let f=a.build(t,s);f&&(h?f=c+" = "+f+";":(f="return "+f+";",l===null&&(O("TSL: Return statement used in an inline \'Fn()\'. Define a layout struct to allow return values.",this.stackTrace),f="// "+f))),t.removeFlowTab().addFlowCode(t.tab+"	"+f+`\n\n`+t.tab+`}\n\n`)}else t.addFlowCode(`\n\n`);return t.format(c,s,e)}}const An=rt(ch).setParameterLength(2,3);x("select",An);class or extends L{static get type(){return"ContextNode"}constructor(t=null,e={}){super(),this.isContextNode=!0,this.node=t,this.value=e}getScope(){return this.node.getScope()}generateNodeType(t){return this.node.getNodeType(t)}getFlowContextData(){const t=[];return this.traverse(e=>{e.isContextNode===!0&&t.push(e.value)}),Object.assign({},...t)}getMemberType(t,e){return this.node.getMemberType(t,e)}analyze(t){const e=t.addContext(this.value);this.node.build(t),t.setContext(e)}setup(t){const e=t.addContext(this.value);this.node.build(t),t.setContext(e)}generate(t,e){const s=t.addContext(this.value),n=this.node.build(t,e);return t.setContext(s),n}}const Re=(r=null,t={})=>{let e=r;return(e===null||e.isNode!==!0)&&(t=e||t,e=null),new or(e,t)},uh=r=>Re(r,{uniformFlow:!0}),ar=(r,t)=>Re(r,{nodeName:t});function dh(r,t,e=null){return Re(e,{getShadow:({light:s,shadowColorNode:n})=>t===s?n.mul(r):n})}function ph(r,t=null){return Re(t,{getAO:(e,{material:s})=>s.transparent===!0?e:e!==null?e.mul(r):r})}function fh(r,t){return O(\'TSL: "label()" has been deprecated. Use "setName()" instead.\'),ar(r,t)}x("context",Re),x("label",fh),x("uniformFlow",uh),x("setName",ar),x("builtinShadowContext",(r,t,e)=>dh(t,e,r)),x("builtinAOContext",(r,t)=>ph(t,r));class gh extends L{static get type(){return"VarNode"}constructor(t,e=null,s=!1){super(),this.node=t,this.name=e,this.global=!0,this.isVarNode=!0,this.readOnly=s,this.parents=!0,this.intent=!1}setIntent(t){return this.intent=t,this}isIntent(t){return t.getDataFromNode(this).forceDeclaration===!0?!1:this.intent}getIntent(){return this.intent}getMemberType(t,e){return this.node.getMemberType(t,e)}getElementType(t){return this.node.getElementType(t)}generateNodeType(t){return this.node.getNodeType(t)}getArrayCount(t){return this.node.getArrayCount(t)}isAssign(t){return t.getDataFromNode(this).assign}build(...t){const e=t[0],s=this.getShared(e);if(this!==s)return s.build(...t);if(this._hasStack(e)===!1&&e.buildStage==="setup"&&(e.context.nodeLoop||e.context.nodeBlock)){let n=!1;if(this.node.isShaderCallNodeInternal&&this.node.shaderNode.getLayout()===null&&e.fnCall&&e.fnCall.shaderNode&&e.getDataFromNode(this.node.shaderNode).hasLoop){const a=e.getDataFromNode(this);a.forceDeclaration=!0,n=!0}const i=e.getBaseStack();n?i.addToStackBefore(this):i.addToStack(this)}return this.isIntent(e)&&this.isAssign(e)!==!0?this.node.build(...t):super.build(...t)}generate(t){const{node:e,name:s,readOnly:n}=this,{renderer:i}=t,o=i.backend.isWebGPUBackend===!0;let a=!1,l=!1;n&&(a=t.isDeterministic(e),l=o?n:a);const h=this.getNodeType(t);if(h=="void")return this.isIntent(t)!==!0&&K(\'TSL: ".toVar()" can not be used with void type.\',this.stackTrace),e.build(t);const c=t.getVectorType(h),u=e.build(t,c),d=t.getVarFromNode(this,s,c,void 0,l),p=t.getPropertyName(d);let f=p;if(l)if(o)f=a?`const ${p}`:`let ${p}`;else{const m=e.getArrayCount(t);f=`const ${t.getVar(d.type,p,m)}`}return t.addLineFlowCode(`${f} = ${u}`,this),p}_hasStack(t){return t.getDataFromNode(this).stack!==void 0}}const _n=rt(gh),mh=(r,t=null)=>_n(r,t).toStack(),yh=(r,t=null)=>_n(r,t,!0).toStack(),xh=r=>_n(r).setIntent(!0).toStack();x("toVar",mh),x("toConst",yh),x("toVarIntent",xh);class wh extends L{static get type(){return"SubBuild"}constructor(t,e,s=null){super(s),this.node=t,this.name=e,this.isSubBuildNode=!0}generateNodeType(t){if(this.nodeType!==null)return this.nodeType;t.addSubBuild(this.name);const e=this.node.getNodeType(t);return t.removeSubBuild(),e}build(t,...e){t.addSubBuild(this.name);const s=this.node.build(t,...e);return t.removeSubBuild(),s}}const lr=(r,t,e=null)=>new wh(E(r),t,e);class Nh extends L{static get type(){return"VaryingNode"}constructor(t,e=null){super(),this.node=lr(t,"VERTEX"),this.name=e,this.isVaryingNode=!0,this.interpolationType=null,this.interpolationSampling=null,this.global=!0}setInterpolation(t,e=null){return this.interpolationType=t,this.interpolationSampling=e,this}getHash(t){return this.name||super.getHash(t)}generateNodeType(t){return this.node.getNodeType(t)}setupVarying(t){const e=t.getNodeProperties(this);let s=e.varying;if(s===void 0){const n=this.name,i=this.getNodeType(t),o=this.interpolationType,a=this.interpolationSampling;e.varying=s=t.getVaryingFromNode(this,n,i,o,a),e.node=lr(this.node,"VERTEX")}return s.needsInterpolation||(s.needsInterpolation=t.shaderStage==="fragment"),s}setup(t){this.setupVarying(t),t.flowNodeFromShaderStage(Ue.VERTEX,this.node)}analyze(t){this.setupVarying(t),t.flowNodeFromShaderStage(Ue.VERTEX,this.node)}generate(t){const e=t.getSubBuildProperty("property",t.currentStack),s=t.getNodeProperties(this),n=this.setupVarying(t);if(s[e]===void 0){const i=this.getNodeType(t),o=t.getPropertyName(n,Ue.VERTEX);if(t.shaderStage===Ue.VERTEX){const a=s.node.build(t,i);t.addLineFlowCode(`${o} = ${a}`,this)}else t.flowNodeFromShaderStage(Ue.VERTEX,s.node,i,o);s[e]=o}return t.getPropertyName(n)}}const je=rt(Nh).setParameterLength(1,2),Th=r=>je(r);x("toVarying",je),x("toVertexStage",Th);const Sh=_(([r])=>{const t=r.mul(.9478672986).add(.0521327014).pow(2.4),e=r.mul(.0773993808),s=r.lessThanEqual(.04045);return ie(t,e,s)}).setLayout({name:"sRGBTransferEOTF",type:"vec3",inputs:[{name:"color",type:"vec3"}]}),vh=_(([r])=>{const t=r.pow(.41666).mul(1.055).sub(.055),e=r.mul(12.92),s=r.lessThanEqual(.0031308);return ie(t,e,s)}).setLayout({name:"sRGBTransferOETF",type:"vec3",inputs:[{name:"color",type:"vec3"}]}),Rn="WorkingColorSpace",Mh="OutputColorSpace";class hr extends at{static get type(){return"ColorSpaceNode"}constructor(t,e,s){super("vec4"),this.colorNode=t,this.source=e,this.target=s}resolveColorSpace(t,e){return e===Rn?it.workingColorSpace:e===Mh?t.context.outputColorSpace||t.renderer.outputColorSpace:e}setup(t){const{colorNode:e}=this,s=this.resolveColorSpace(t,this.source),n=this.resolveColorSpace(t,this.target);let i=e;return it.enabled===!1||s===n||!s||!n||(it.getTransfer(s)===ze&&(i=H(Sh(i.rgb),i.a)),it.getPrimaries(s)!==it.getPrimaries(n)&&(i=H(ue(it._getMatrix(new Rt,s,n)).mul(i.rgb),i.a)),it.getTransfer(n)===ze&&(i=H(vh(i.rgb),i.a))),i}}const Ch=(r,t)=>new hr(E(r),Rn,t),cr=(r,t)=>new hr(E(r),t,Rn);x("workingToColorSpace",Ch),x("colorSpaceToWorking",cr);let bh=class extends Ge{static get type(){return"ReferenceElementNode"}constructor(t,e){super(t,e),this.referenceNode=t,this.isReferenceElementNode=!0}generateNodeType(){return this.referenceNode.uniformType}generate(t){const e=super.generate(t),s=this.referenceNode.getNodeType(),n=this.getNodeType();return t.format(e,s,n)}};class Eh extends L{static get type(){return"ReferenceBaseNode"}constructor(t,e,s=null,n=null){super(),this.property=t,this.uniformType=e,this.object=s,this.count=n,this.properties=t.split("."),this.reference=s,this.node=null,this.group=null,this.updateType=W.OBJECT}setGroup(t){return this.group=t,this}element(t){return new bh(this,E(t))}setNodeType(t){const e=et(null,t);this.group!==null&&e.setGroup(this.group),this.node=e}generateNodeType(t){return this.node===null&&(this.updateReference(t),this.updateValue()),this.node.getNodeType(t)}getValueFromReference(t=this.reference){const{properties:e}=this;let s=t[e[0]];for(let n=1;n<e.length;n++)s=s[e[n]];return s}updateReference(t){return this.reference=this.object!==null?this.object:t.object,this.reference}setup(){return this.updateValue(),this.node}update(){this.updateValue()}updateValue(){this.node===null&&this.setNodeType(this.uniformType);const t=this.getValueFromReference();Array.isArray(t)?this.node.array=t:this.node.value=t}}class Ah extends Eh{static get type(){return"RendererReferenceNode"}constructor(t,e,s=null){super(t,e,s),this.renderer=s,this.setGroup(ut)}updateReference(t){return this.reference=this.renderer!==null?this.renderer:t.renderer,this.reference}}const _h=(r,t,e=null)=>new Ah(r,t,e);class Rh extends at{static get type(){return"ToneMappingNode"}constructor(t,e=Ih,s=null){super("vec3"),this._toneMapping=t,this.exposureNode=e,this.colorNode=s}customCacheKey(){return Ri(this._toneMapping)}setToneMapping(t){return this._toneMapping=t,this}getToneMapping(){return this._toneMapping}setup(t){const e=this.colorNode||t.context.color,s=this._toneMapping;if(s===0)return e;let n=null;const i=t.renderer.library.getToneMappingFunction(s);return i!==null?n=H(i(e.rgb,this.exposureNode),e.a):(K("ToneMappingNode: Unsupported Tone Mapping configuration.",s),n=e),n}}const Lh=(r,t,e)=>new Rh(r,E(t),E(e)),Ih=_h("toneMappingExposure","float");x("toneMapping",(r,t,e)=>Lh(t,e,r));const ur=new WeakMap;function dr(r,t){let e=ur.get(r);return e===void 0&&(e=new Xo(r,t),ur.set(r,e)),e}class re extends pn{static get type(){return"BufferAttributeNode"}constructor(t,e=null,s=0,n=0){super(t,e),this.isBufferNode=!0,this.bufferType=e,this.bufferStride=s,this.bufferOffset=n,this.usage=35044,this.instanced=!1,this.attribute=null,this.global=!0,t&&t.isBufferAttribute===!0&&t.itemSize<=4&&(this.attribute=t,this.usage=t.usage,this.instanced=t.isInstancedBufferAttribute)}getHash(t){let e;if(this.bufferStride===0&&this.bufferOffset===0){let s=t.globalCache.getData(this.value);s===void 0&&(s={node:this},t.globalCache.setData(this.value,s)),e=s.node.id}else e=this.id;return String(e)}generateNodeType(t){return this.bufferType===null&&(this.bufferType=t.getTypeFromAttribute(this.attribute)),this.bufferType}setup(t){if(this.attribute!==null)return;const e=this.getNodeType(t),s=t.getTypeLength(e),n=this.value,i=this.bufferStride||s,o=this.bufferOffset;let a;n.isInterleavedBuffer===!0?a=n:n.isBufferAttribute===!0?a=dr(n.array,i):a=dr(n,i);const l=new nn(a,s,o);a.setUsage(this.usage),this.attribute=l,this.attribute.isInstancedBufferAttribute=this.instanced}generate(t){const e=this.getNodeType(t),s=t.context.nodeName;s!==void 0&&delete t.context.nodeName;const n=t.getBufferAttributeFromNode(this,e,s),i=t.getPropertyName(n);let o=null;if(t.shaderStage==="vertex"||t.shaderStage==="compute")this.name=i,o=i;else{let a;s&&(a=s+"Varying"),o=je(this,a).build(t,e)}return o}getInputType(){return"bufferAttribute"}setUsage(t){return this.usage=t,this.attribute&&this.attribute.isBufferAttribute===!0&&(this.attribute.usage=t),this}setInstanced(t){return this.instanced=t,this}}function zh(r,t=null,e=0,s=0,n=35044,i=!1){return t==="mat3"||t===null&&r.itemSize===9?ue(new re(r,"vec3",9,0).setUsage(n).setInstanced(i),new re(r,"vec3",9,3).setUsage(n).setInstanced(i),new re(r,"vec3",9,6).setUsage(n).setInstanced(i)):t==="mat4"||t===null&&r.itemSize===16?qi(new re(r,"vec4",16,0).setUsage(n).setInstanced(i),new re(r,"vec4",16,4).setUsage(n).setInstanced(i),new re(r,"vec4",16,8).setUsage(n).setInstanced(i),new re(r,"vec4",16,12).setUsage(n).setInstanced(i)):new re(r,t,e,s).setUsage(n)}const Fh=(r,t=null,e=0,s=0)=>zh(r,t,e,s);x("toAttribute",r=>Fh(r.value));class J extends L{static get type(){return"IndexNode"}constructor(t){super("uint"),this.scope=t,this.isIndexNode=!0}generate(t){const e=this.getNodeType(t),s=this.scope;let n;if(s===J.VERTEX)n=t.getVertexIndex();else if(s===J.INSTANCE)n=t.getInstanceIndex();else if(s===J.DRAW)n=t.getDrawIndex();else if(s===J.INVOCATION_LOCAL)n=t.getInvocationLocalIndex();else if(s===J.INVOCATION_SUBGROUP)n=t.getInvocationSubgroupIndex();else if(s===J.SUBGROUP)n=t.getSubgroupIndex();else throw new Error("THREE.IndexNode: Unknown scope: "+s);let i;return t.shaderStage==="vertex"||t.shaderStage==="compute"?i=n:i=je(this).build(t,e),i}}J.VERTEX="vertex",J.INSTANCE="instance",J.SUBGROUP="subgroup",J.INVOCATION_LOCAL="invocationLocal",J.INVOCATION_SUBGROUP="invocationSubgroup",J.DRAW="draw",J.VERTEX;const Ph=A(J,J.INSTANCE);J.SUBGROUP,J.INVOCATION_SUBGROUP,J.INVOCATION_LOCAL,J.DRAW;class Oh extends L{static get type(){return"ComputeNode"}constructor(t,e){super("void"),this.isComputeNode=!0,this.computeNode=t,this.workgroupSize=e,this.count=null,this.dispatchSize=null,this.version=1,this.name="",this.updateBeforeType=W.OBJECT,this.onInitFunction=null,this.countNode=null}dispose(){this.dispatchEvent({type:"dispose"})}setName(t){return this.name=t,this}label(t){return O(\'TSL: "label()" has been deprecated. Use "setName()" instead.\',new Et),this.setName(t)}onInit(t){return this.onInitFunction=t,this}updateBefore({renderer:t}){t.compute(this)}setup(t){this.count!==null&&this.countNode===null&&(this.countNode=et(this.count,"uint").onObjectUpdate(()=>this.count));const e=this.computeNode.build(t);if(e){const s=t.getNodeProperties(this);s.outputComputeNode=e.outputNode,e.outputNode=null}return e}generate(t,e){const{shaderStage:s}=t;if(s==="compute"){const n=this.computeNode.build(t,"void");if(n!==""&&t.addLineFlowCode(n,this),this.count!==null&&t.allowEarlyReturns===!0){const i=this.countNode.build(t,"uint"),o=Ph.build(t,"uint");t.flow.code=`${t.tab}if ( ${o} >= ${i} ) { return; }\n\n${t.flow.code}`}}else{const i=t.getNodeProperties(this).outputComputeNode;if(i)return i.build(t,e)}}}const pr=(r,t=[64])=>{(t.length===0||t.length>3)&&K("TSL: compute() workgroupSize must have 1, 2, or 3 elements",new Et);for(let e=0;e<t.length;e++){const s=t[e];(typeof s!="number"||s<=0||!Number.isInteger(s))&&K(`TSL: compute() workgroupSize element at index [ ${e} ] must be a positive integer`,new Et)}for(;t.length<3;)t.push(1);return new Oh(E(r),t)};x("compute",(r,t,e)=>{const s=pr(r,e);return typeof t=="number"?s.count=t:s.dispatchSize=t,s}),x("computeKernel",pr);class kh extends L{static get type(){return"IsolateNode"}constructor(t,e=!0){super(),this.node=t,this.parent=e,this.isIsolateNode=!0}generateNodeType(t){const e=t.getCache(),s=t.getCacheFromNode(this,this.parent);t.setCache(s);const n=this.node.getNodeType(t);return t.setCache(e),n}build(t,...e){const s=t.getCache(),n=t.getCacheFromNode(this,this.parent);t.setCache(n);const i=this.node.build(t,...e);return t.setCache(s),i}setParent(t){return this.parent=t,this}getParent(){return this.parent}}const fr=r=>new kh(E(r));function Bh(r,t=!0){return O(\'TSL: "cache()" has been deprecated. Use "isolate()" instead.\'),fr(r).setParent(t)}x("cache",Bh),x("isolate",fr);class Dh extends L{static get type(){return"BypassNode"}constructor(t,e){super(),this.isBypassNode=!0,this.outputNode=t,this.callNode=e}generateNodeType(t){return this.outputNode.getNodeType(t)}generate(t){const e=this.callNode.build(t,"void");return e!==""&&t.addLineFlowCode(e,this),this.outputNode.build(t)}}x("bypass",rt(Dh).setParameterLength(2));const gr=_(([r,t,e,s=B(0),n=B(1),i=Nn(!1)])=>{let o=r.sub(t).div(e.sub(t));return Ea(i)&&(o=o.clamp()),o.mul(n.sub(s)).add(s)});function Uh(r,t,e,s=B(0),n=B(1)){return gr(r,t,e,s,n,!0)}x("remap",gr),x("remapClamp",Uh);class Vh extends L{static get type(){return"ExpressionNode"}constructor(t="",e="void"){super(e),this.snippet=t}generate(t,e){const s=this.getNodeType(t),n=this.snippet;if(s==="void")t.addLineFlowCode(n,this);else return t.format(n,s,e)}}const Ht=rt(Vh).setParameterLength(1,2);x("discard",r=>(r?An(r,Ht("discard")):Ht("discard")).toStack());const Gh=_(([r])=>H(r.rgb.mul(r.a),r.a),{color:"vec4",return:"vec4"}),Wh=_(([r])=>r.a.equal(0).select(H(0),H(r.rgb.div(r.a),r.a)),{color:"vec4",return:"vec4"});class $h extends at{static get type(){return"RenderOutputNode"}constructor(t,e,s){super("vec4"),this.colorNode=t,this._toneMapping=e,this.outputColorSpace=s,this.isRenderOutputNode=!0}setToneMapping(t){return this._toneMapping=t,this}getToneMapping(){return this._toneMapping}setup({context:t}){let e=this.colorNode||t.color;e=H(e.rgb,e.a.clamp(0,1)),e=Wh(e);const s=(this._toneMapping!==null?this._toneMapping:t.toneMapping)||0,n=(this.outputColorSpace!==null?this.outputColorSpace:t.outputColorSpace)||"";return s!==0&&(e=e.toneMapping(s)),n!==""&&n!==it.workingColorSpace&&(e=e.workingToColorSpace(n)),e=Gh(e),e}}x("renderOutput",(r,t=null,e=null)=>new $h(E(r),t,e));class qh extends at{static get type(){return"DebugNode"}constructor(t,e=null){super(),this.node=t,this.callback=e}generateNodeType(t){return this.node.getNodeType(t)}setup(t){return this.node.build(t)}analyze(t){return this.node.build(t)}generate(t){const e=this.callback,s=this.node.build(t);if(e!==null)e(t,s);else{const n="--- TSL debug - "+t.shaderStage+" shader ---",i="-".repeat(n.length);let o="";o+="// #"+n+`#\n`,o+=t.flow.code.replace(/^\\t/mg,"")+`\n`,o+="/* ... */ "+s+` /* ... */\n`,o+="// #"+i+`#\n`,qs(o)}return s}}x("debug",(r,t=null)=>new qh(E(r),t).toStack());class Hh extends we{constructor(){super(),this._renderer=null,this.currentFrame=null}get nodeFrame(){return this._renderer._nodes.nodeFrame}setRenderer(t){return this._renderer=t,this}getRenderer(){return this._renderer}init(){}begin(){}finish(){}inspect(){}computeAsync(){}beginCompute(){}finishCompute(){}beginRender(){}finishRender(){}copyTextureToTexture(){}copyFramebufferToTexture(){}}class jh extends L{static get type(){return"InspectorNode"}constructor(t,e="",s=null){super(),this.node=t,this.name=e,this.callback=s,this.updateType=W.FRAME,this.isInspectorNode=!0}getName(){return this.name||this.node.name}update(t){t.renderer.inspector.inspect(this)}generateNodeType(t){return this.node.getNodeType(t)}setup(t){let e=this.node;return t.context.inspector===!0&&this.callback!==null&&(e=this.callback(e)),t.renderer.backend.isWebGPUBackend!==!0&&t.renderer.inspector.constructor!==Hh&&Xt(\'TSL: ".toInspector()" is only available with WebGPU.\'),e}}function Yh(r,t="",e=null){return r=E(r),r.before(new jh(r,t,e))}x("toInspector",Yh);class Xh extends L{static get type(){return"AttributeNode"}constructor(t,e=null){super(e),this.global=!0,this._attributeName=t}getHash(t){return this.getAttributeName(t)}generateNodeType(t){let e=this.nodeType;if(e===null){const s=this.getAttributeName(t);if(t.hasGeometryAttribute(s)){const n=t.geometry.getAttribute(s);e=t.getTypeFromAttribute(n)}else e="float"}return e}setAttributeName(t){return this._attributeName=t,this}getAttributeName(){return this._attributeName}generate(t){const e=this.getAttributeName(t),s=this.getNodeType(t);if(t.hasGeometryAttribute(e)===!0){const i=t.geometry.getAttribute(e),o=t.getTypeFromAttribute(i),a=t.getAttribute(e,o);return t.shaderStage==="vertex"?t.format(a.name,o,s):je(this).build(t,s)}else return O(`AttributeNode: Vertex attribute "${e}" not found on geometry.`),t.generateConst(s)}serialize(t){super.serialize(t),t.global=this.global,t._attributeName=this._attributeName}deserialize(t){super.deserialize(t),this.global=t.global,this._attributeName=t._attributeName}}const jt=(r,t=null)=>new Xh(r,t),Le=(r=0)=>jt("uv"+(r>0?r:""),"vec2");class Zh extends L{static get type(){return"TextureSizeNode"}constructor(t,e=null){super("uvec2"),this.isTextureSizeNode=!0,this.textureNode=t,this.levelNode=e}generate(t,e){const s=this.textureNode.build(t,"property"),n=this.levelNode===null?"0":this.levelNode.build(t,"int");return t.format(`${t.getMethod("textureDimensions")}( ${s}, ${n} )`,this.getNodeType(t),e)}}const mr=rt(Zh).setParameterLength(1,2);class Jh extends qe{static get type(){return"MaxMipLevelNode"}constructor(t){super(0),this._textureNode=t,this.updateType=W.FRAME}get textureNode(){return this._textureNode}get texture(){return this._textureNode.value}update(){const t=this.texture,e=t.images,s=e&&e.length>0?e[0]&&e[0].image||e[0]:t.image;if(s&&s.width!==void 0){const{width:n,height:i}=s;this.value=Math.log2(Math.max(n,i))}}}const Qh=rt(Jh).setParameterLength(1);class Kh extends Error{constructor(t,e=null){super(t),this.name="NodeError",this.stackTrace=e}}const yr=new Nt;class As extends qe{static get type(){return"TextureNode"}constructor(t=yr,e=null,s=null,n=null){super(t),this.isTextureNode=!0,this.uvNode=e,this.levelNode=s,this.biasNode=n,this.compareNode=null,this.depthNode=null,this.gradNode=null,this.gatherNode=null,this.offsetNode=null,this.sampler=!0,this.updateMatrix=!1,this.updateType=W.NONE,this.referenceNode=null,this._value=t,this._matrixUniform=null,this._flipYUniform=null,this.setUpdateMatrix(e===null)}set value(t){this.referenceNode?this.referenceNode.value=t:this._value=t}get value(){return this.referenceNode?this.referenceNode.value:this._value}getUniformHash(){return this.value.uuid}generateNodeType(){return this.value.isDepthTexture===!0?this.gatherNode===null?"float":"vec4":this.value.type===1014?"uvec4":this.value.type===1013?"ivec4":"vec4"}getInputType(){return"texture"}getDefaultUV(){return Le(this.value.channel)}updateReference(){return this.value}getTransformedUV(t){return this._matrixUniform===null&&(this._matrixUniform=et(this.value.matrix)),this._matrixUniform.mul(F(t,1)).xy}setUpdateMatrix(t){return this.updateMatrix=t,this}setupUV(t,e){return t.isFlipY()&&(this._flipYUniform===null&&(this._flipYUniform=et(!1)),e=e.toVar(),this.sampler?e=this._flipYUniform.select(e.flipY(),e):e=this._flipYUniform.select(e.setY($e(mr(this,this.levelNode).y).sub(e.y).sub(1)),e)),e}setup(t){const e=t.getNodeProperties(this);e.referenceNode=this.referenceNode;const s=this.value;if(!s||s.isTexture!==!0)throw new Kh("THREE.TSL: `texture( value )` function expects a valid instance of THREE.Texture().",this.stackTrace);const n=_(()=>{let l=this.uvNode;return(l===null||t.context.forceUVContext===!0)&&t.context.getUV&&(l=t.context.getUV(this,t)),l||(l=this.getDefaultUV()),this.updateMatrix===!0&&(l=this.getTransformedUV(l)),l=this.setupUV(t,l),this.updateType=this._matrixUniform!==null||this._flipYUniform!==null?W.OBJECT:W.NONE,l})();let i=this.levelNode;i===null&&t.context.getTextureLevel&&(i=t.context.getTextureLevel(this));let o=null,a=null;if(this.compareNode!==null)if(t.renderer.hasCompatibility(yo.TEXTURE_COMPARE))o=this.compareNode;else{const l=s.compareFunction;l===null||l===513||l===515||l===516||l===518?a=this.compareNode:(o=this.compareNode,Xt(\'TSL: Only "LessCompare", "LessEqualCompare", "GreaterCompare" and "GreaterEqualCompare" are supported for depth texture comparison fallback.\'))}e.uvNode=n,e.levelNode=i,e.biasNode=this.biasNode,e.compareNode=o,e.compareStepNode=a,e.gradNode=this.gradNode,e.gatherNode=this.gatherNode,e.depthNode=this.depthNode,e.offsetNode=this.offsetNode}generateUV(t,e){return e.build(t,this.sampler===!0?"vec2":"ivec2")}generateOffset(t,e){return e.build(t,"ivec2")}generateSnippet(t,e,s,n,i,o,a,l,h,c,u){const d=this.value;let p;return i?p=t.generateTextureBias(d,e,s,i,o,c):l?p=t.generateTextureGrad(d,e,s,l,o,c):h?a?p=t.generateTextureGatherCompare(d,e,s,a,o,c,u):p=t.generateTextureGather(d,e,s,h,o,c,u):a?p=t.generateTextureCompare(d,e,s,a,o,c):this.sampler===!1?p=t.generateTextureLoad(d,e,s,n,o,c):n?p=t.generateTextureLevel(d,e,s,n,o,c):p=t.generateTexture(d,e,s,o,c),p}generate(t,e){const s=this.value,n=t.getNodeProperties(this),i=super.generate(t,"property");if(/^sampler/.test(e))return i+"_sampler";if(t.isReference(e))return i;{const o=t.getDataFromNode(this);let a=this.getNodeType(t),l=o.propertyName;if(l===void 0){const{uvNode:c,levelNode:u,biasNode:d,compareNode:p,compareStepNode:f,depthNode:m,gradNode:y,gatherNode:w,offsetNode:M}=n,C=this.generateUV(t,c),b=u?u.build(t,"float"):null,S=d?d.build(t,"float"):null,R=m?m.build(t,"int"):null,I=p?p.build(t,"float"):null,D=f?f.build(t,"float"):null,z=y?[y[0].build(t,"vec2"),y[1].build(t,"vec2")]:null,U=w?w.build(t,"int"):null,Y=M?this.generateOffset(t,M):null,G=this._flipYUniform?this._flipYUniform.build(t,"bool"):null;U&&(a="vec4");let $=R;$===null&&s.isArrayTexture&&this.isTexture3DNode!==!0&&($="0");const Z=t.getVarFromNode(this);l=t.getPropertyName(Z);let P=this.generateSnippet(t,i,C,b,S,$,I,z,U,Y,G);if(D!==null){const Dt=s.compareFunction;Dt===516||Dt===518?P=En(Ht(P,a),Ht(D,"float")).build(t,a):P=En(Ht(D,"float"),Ht(P,a)).build(t,a)}t.addLineFlowCode(`${l} = ${P}`,this),o.snippet=P,o.propertyName=l}let h=l;return t.needsToWorkingColorSpace(s)&&(h=cr(Ht(h,a),s.colorSpace).setup(t).build(t,a)),t.format(h,a,e)}}setSampler(t){return this.sampler=t,this}getSampler(){return this.sampler}sample(t){const e=this.clone();return e.uvNode=E(t),e.referenceNode=this.getBase(),E(e)}load(t){return this.sample(t).setSampler(!1)}blur(t){const e=this.clone();e.biasNode=E(t).mul(Qh(e)),e.referenceNode=this.getBase();const s=e.value;return e.generateMipmaps===!1&&(s&&s.generateMipmaps===!1||s.minFilter===1003||s.magFilter===1003)&&(O("TSL: texture().blur() requires mipmaps and sampling. Use .generateMipmaps=true and .minFilter/.magFilter=THREE.LinearFilter in the Texture."),e.biasNode=null),E(e)}level(t){const e=this.clone();return e.levelNode=E(t),e.referenceNode=this.getBase(),E(e)}size(t){return mr(this,t)}bias(t){const e=this.clone();return e.biasNode=E(t),e.referenceNode=this.getBase(),E(e)}getBase(){return this.referenceNode?this.referenceNode.getBase():this}compare(t){const e=this.clone();return e.compareNode=E(t),e.referenceNode=this.getBase(),E(e)}grad(t,e){const s=this.clone();return s.gradNode=[E(t),E(e)],s.referenceNode=this.getBase(),E(s)}gather(t=0){const e=this.clone();return e.gatherNode=E(t),e.referenceNode=this.getBase(),E(e)}depth(t){const e=this.clone();return e.depthNode=E(t),e.referenceNode=this.getBase(),E(e)}offset(t){const e=this.clone();return e.offsetNode=E(t),e.referenceNode=this.getBase(),E(e)}serialize(t){super.serialize(t),t.value=this.value.toJSON(t.meta).uuid,t.sampler=this.sampler,t.updateMatrix=this.updateMatrix,t.updateType=this.updateType}deserialize(t){super.deserialize(t),this.value=t.meta.textures[t.value],this.sampler=t.sampler,this.updateMatrix=t.updateMatrix,this.updateType=t.updateType}update(){const t=this.value,e=this._matrixUniform;e!==null&&(e.value=t.matrix),t.matrixAutoUpdate===!0&&t.updateMatrix();const s=this._flipYUniform;s!==null&&(s.value=t.image instanceof ImageBitmap&&t.flipY===!0||t.isRenderTargetTexture===!0||t.isFramebufferTexture===!0||t.isDepthTexture===!0)}clone(){const t=new this.constructor(this.value,this.uvNode,this.levelNode,this.biasNode);return t.sampler=this.sampler,t.depthNode=this.depthNode,t.compareNode=this.compareNode,t.gradNode=this.gradNode,t.gatherNode=this.gatherNode,t.offsetNode=this.offsetNode,t}}const tc=rt(As).setParameterLength(1,4).setName("texture"),ec=(r=yr,t=null,e=null,s=null)=>{let n;return r&&r.isTextureNode===!0?(n=E(r.clone()),n.referenceNode=r.getBase(),t!==null&&(n.uvNode=E(t)),e!==null&&(n.levelNode=E(e)),s!==null&&(n.biasNode=E(s))):n=tc(r,t,e,s),n};class xr extends qe{static get type(){return"BufferNode"}constructor(t,e,s=0){super(t,e),this.isBufferNode=!0,this.bufferType=e,this.bufferCount=s,this.updateRanges=[]}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}getElementType(t){return this.getNodeType(t)}getInputType(){return"buffer"}}const sc=(r,t,e)=>new xr(r,t,e);class nc extends Ge{static get type(){return"UniformArrayElementNode"}constructor(t,e){super(t,e),this.isArrayBufferElementNode=!0}generate(t){const e=super.generate(t),s=this.getNodeType(t),n=this.node.getPaddedType();return t.format(e,n,s)}}class ic extends xr{static get type(){return"UniformArrayNode"}constructor(t,e=null){super(null),this.array=t,this.elementType=e===null?Ns(t[0]):e,this.paddedType=this.getPaddedType(),this.updateType=W.RENDER,this.isArrayBufferNode=!0}generateNodeType(){return this.paddedType}getElementType(){return this.elementType}getPaddedType(){const t=this.elementType;let e="vec4";return t==="mat2"?e="mat2":/mat/.test(t)===!0?e="mat4":t.charAt(0)==="i"?e="ivec4":t.charAt(0)==="u"&&(e="uvec4"),e}update(){const{array:t,value:e}=this,s=this.elementType;if(s==="float"||s==="int"||s==="uint")for(let n=0;n<t.length;n++){const i=n*4;e[i]=t[n]}else if(s==="color")for(let n=0;n<t.length;n++){const i=n*4,o=t[n];e[i]=o.r,e[i+1]=o.g,e[i+2]=o.b||0}else if(s==="mat2")for(let n=0;n<t.length;n++){const i=n*4,o=t[n];e[i]=o.elements[0],e[i+1]=o.elements[1],e[i+2]=o.elements[2],e[i+3]=o.elements[3]}else if(s==="mat3")for(let n=0;n<t.length;n++){const i=n*16,o=t[n];e[i]=o.elements[0],e[i+1]=o.elements[1],e[i+2]=o.elements[2],e[i+4]=o.elements[3],e[i+5]=o.elements[4],e[i+6]=o.elements[5],e[i+8]=o.elements[6],e[i+9]=o.elements[7],e[i+10]=o.elements[8],e[i+15]=1}else if(s==="mat4")for(let n=0;n<t.length;n++){const i=n*16,o=t[n];for(let a=0;a<o.elements.length;a++)e[i+a]=o.elements[a]}else for(let n=0;n<t.length;n++){const i=n*4,o=t[n];e[i]=o.x,e[i+1]=o.y,e[i+2]=o.z||0,e[i+3]=o.w||0}}setup(t){const e=this.array.length,s=this.elementType;let n=Float32Array;const i=this.paddedType,o=t.getTypeLength(i);return s.charAt(0)==="i"&&(n=Int32Array),s.charAt(0)==="u"&&(n=Uint32Array),this.value=new n(e*o),this.bufferCount=e,this.bufferType=i,this.update(),super.setup(t)}element(t){return new nc(this,E(t))}}const Ot=(r,t)=>new ic(r,t);class rc extends L{constructor(t){super("float"),this.name=t,this.isBuiltinNode=!0}generate(){return this.name}}const Ye=rt(rc).setParameterLength(1);let Xe,Ze;class j extends L{static get type(){return"ScreenNode"}constructor(t){super(),this.scope=t,this._output=null,this.isViewportNode=!0}generateNodeType(){return this.scope===j.DPR?"float":this.scope===j.VIEWPORT?"vec4":"vec2"}getUpdateType(){let t=W.NONE;return(this.scope===j.SIZE||this.scope===j.VIEWPORT||this.scope===j.DPR)&&(t=W.RENDER),this.updateType=t,t}update({renderer:t}){const e=t.getRenderTarget();this.scope===j.VIEWPORT?e!==null?Ze.copy(e.viewport):(t.getViewport(Ze),Ze.multiplyScalar(t.getPixelRatio())):this.scope===j.DPR?this._output.value=t.getPixelRatio():e!==null?(Xe.width=e.width,Xe.height=e.height):t.getDrawingBufferSize(Xe)}setup(){const t=this.scope;let e=null;return t===j.SIZE?e=et(Xe||(Xe=new mt)):t===j.VIEWPORT?e=et(Ze||(Ze=new Zt)):t===j.DPR?e=et(1):e=qt(Nr.div(wr)),this._output=e,e}generate(t){if(this.scope===j.COORDINATE){let e=t.getFragCoord();if(t.isFlipY()){const s=t.getNodeProperties(wr).outputNode.build(t);e=`${t.getType("vec2")}( ${e}.x, ${s}.y - ${e}.y )`}return e}return super.generate(t)}}j.COORDINATE="coordinate",j.VIEWPORT="viewport",j.SIZE="size",j.UV="uv",j.DPR="dpr";const oc=A(j,j.DPR),Ln=A(j,j.UV),wr=A(j,j.SIZE),Nr=A(j,j.COORDINATE),Je=A(j,j.VIEWPORT);Je.zw,Je.xy;let In=null,_s=null,zn=null,Rs=null,Fn=null,Ls=null,Pn=null,Is=null;const zs=et(0,"uint").setName("u_cameraIndex").setGroup(Sn("cameraIndex")).toVarying("v_cameraIndex"),Qe=et("float").setName("cameraNear").setGroup(ut).onRenderUpdate(({camera:r})=>r.near),Ke=et("float").setName("cameraFar").setGroup(ut).onRenderUpdate(({camera:r})=>r.far),Ie=_(({camera:r})=>{let t;if(r.isArrayCamera&&r.cameras.length>0){const e=[];for(const s of r.cameras)e.push(s.projectionMatrix);_s===null?_s=Ot(e).setGroup(ut).setName("cameraProjectionMatrices"):_s.array=e,t=_s.element(r.isMultiViewCamera?Ye("gl_ViewID_OVR"):zs)}else In===null&&(In=et(r.projectionMatrix).setName("cameraProjectionMatrix").setGroup(ut).onRenderUpdate(({camera:e})=>e.projectionMatrix)),t=In;return t}).once()(),ac=_(({camera:r})=>{let t;if(r.isArrayCamera&&r.cameras.length>0){const e=[];for(const s of r.cameras)e.push(s.projectionMatrixInverse);Rs===null?Rs=Ot(e).setGroup(ut).setName("cameraProjectionMatricesInverse"):Rs.array=e,t=Rs.element(r.isMultiViewCamera?Ye("gl_ViewID_OVR"):zs)}else zn===null&&(zn=et(r.projectionMatrixInverse).setName("cameraProjectionMatrixInverse").setGroup(ut).onRenderUpdate(({camera:e})=>e.projectionMatrixInverse)),t=zn;return t}).once()(),On=_(({camera:r})=>{let t;if(r.isArrayCamera&&r.cameras.length>0){const e=[];for(const s of r.cameras)e.push(s.matrixWorldInverse);Ls===null?Ls=Ot(e).setGroup(ut).setName("cameraViewMatrices"):Ls.array=e,t=Ls.element(r.isMultiViewCamera?Ye("gl_ViewID_OVR"):zs)}else Fn===null&&(Fn=et(r.matrixWorldInverse).setName("cameraViewMatrix").setGroup(ut).onRenderUpdate(({camera:e})=>e.matrixWorldInverse)),t=Fn;return t}).once()(),Tr=_(({camera:r})=>{let t;if(r.isArrayCamera&&r.cameras.length>0){const e=[];for(const s of r.cameras)e.push(s.matrixWorld);Is===null?Is=Ot(e).setGroup(ut).setName("cameraWorldMatrices"):Is.array=e,t=Is.element(r.isMultiViewCamera?Ye("gl_ViewID_OVR"):zs)}else Pn===null&&(Pn=et(r.matrixWorld).setName("cameraWorldMatrix").setGroup(ut).onRenderUpdate(({camera:e})=>e.matrixWorld)),t=Pn;return t}).once()(),Sr=new Yo;class X extends L{static get type(){return"Object3DNode"}constructor(t,e=null){super(),this.scope=t,this.object3d=e,this.updateType=W.OBJECT,this.uniformNode=new qe(null)}generateNodeType(){const t=this.scope;if(t===X.WORLD_MATRIX)return"mat4";if(t===X.POSITION||t===X.VIEW_POSITION||t===X.DIRECTION||t===X.SCALE)return"vec3";if(t===X.RADIUS)return"float"}update(t){const e=this.object3d,s=this.uniformNode,n=this.scope;if(n===X.WORLD_MATRIX)s.value=e.matrixWorld;else if(n===X.POSITION)s.value=s.value||new T,s.value.setFromMatrixPosition(e.matrixWorld);else if(n===X.SCALE)s.value=s.value||new T,s.value.setFromMatrixScale(e.matrixWorld);else if(n===X.DIRECTION)s.value=s.value||new T,e.getWorldDirection(s.value);else if(n===X.VIEW_POSITION){const i=t.camera;s.value=s.value||new T,s.value.setFromMatrixPosition(e.matrixWorld),s.value.applyMatrix4(i.matrixWorldInverse)}else if(n===X.RADIUS){const i=t.object.geometry;i.boundingSphere===null&&i.computeBoundingSphere(),Sr.copy(i.boundingSphere).applyMatrix4(e.matrixWorld),s.value=Sr.radius}}generate(t){const e=this.scope;return e===X.WORLD_MATRIX?this.uniformNode.nodeType="mat4":e===X.POSITION||e===X.VIEW_POSITION||e===X.DIRECTION||e===X.SCALE?this.uniformNode.nodeType="vec3":e===X.RADIUS&&(this.uniformNode.nodeType="float"),this.uniformNode.build(t)}serialize(t){super.serialize(t),t.scope=this.scope}deserialize(t){super.deserialize(t),this.scope=t.scope}}X.WORLD_MATRIX="worldMatrix",X.POSITION="position",X.SCALE="scale",X.VIEW_POSITION="viewPosition",X.DIRECTION="direction",X.RADIUS="radius";class Tt extends X{static get type(){return"ModelNode"}constructor(t){super(t)}update(t){this.object3d=t.object,super.update(t)}}Tt.DIRECTION;const kn=A(Tt,Tt.WORLD_MATRIX);Tt.POSITION,Tt.SCALE,Tt.VIEW_POSITION,Tt.RADIUS;const lc=et(new Rt).onObjectUpdate(({object:r},t)=>t.value.getNormalMatrix(r.matrixWorld)),Bn=_(r=>r.context.modelViewMatrix||hc).once()().toVar("modelViewMatrix"),hc=On.mul(kn),cc=_(r=>r.shaderStage!=="fragment"?(Xt("TSL: `clipSpace` is only available in fragment stage."),H()):r.context.clipSpace.toVarying("v_clipSpace")).once()(),St=jt("position","vec3"),uc=St.toVarying("positionLocal"),dc=_(r=>kn.mul(uc).xyz.toVarying(r.getSubBuildProperty("v_positionWorld")),"vec3").once(["POSITION"])(),pt=_(r=>{if(r.shaderStage==="fragment"&&r.material.vertexNode){const t=ac.mul(cc);return t.xyz.div(t.w).toVar("positionView")}return r.context.setupPositionView().toVarying("v_positionView")},"vec3").once(["POSITION","VERTEX"])(),vr=_(r=>{let t;return r.camera.isOrthographicCamera?t=F(0,0,1):t=pt.negate().toVarying("v_positionViewDirection").normalize(),t.toVar("positionViewDirection")},"vec3").once(["POSITION"])();class pc extends L{static get type(){return"FrontFacingNode"}constructor(){super("bool"),this.isFrontFacingNode=!0}generate(t){if(t.shaderStage!=="fragment")return"true";const{material:e}=t;return e.side===1?"false":t.getFrontFacing()}}const Mr=B(A(pc)).mul(2).sub(1),Fs=_(([r],{material:t})=>{const e=t.side;return e===1?r=r.mul(-1):e===2&&(r=r.mul(Mr)),r}),fc=jt("normal","vec3"),gc=_(r=>r.geometry.hasAttribute("normal")===!1?(O(\'TSL: Vertex attribute "normal" not found on geometry.\'),F(0,1,0)):fc,"vec3").once()().toVar("normalLocal"),mc=pt.dFdx().cross(pt.dFdy()).normalize().toVar("normalFlat"),yc=_(r=>{let t;return r.isFlatShading()?t=mc:t=Cr(gc).toVarying("v_normalViewGeometry").normalize(),t},"vec3").once()().toVar("normalViewGeometry"),xt=_(r=>{let t;return r.subBuildFn==="NORMAL"||r.subBuildFn==="VERTEX"?(t=yc,r.isFlatShading()!==!0&&(t=Fs(t))):t=r.context.setupNormal().context({getUV:null,getTextureLevel:null}),t},"vec3").once(["NORMAL","VERTEX"])().toVar("normalView"),xc=xt.transformNormalByInverseViewMatrix(On).toVar("normalWorld"),wc=_(({subBuildFn:r,context:t})=>{let e;return r==="NORMAL"||r==="VERTEX"?e=xt:e=t.setupClearcoatNormal().context({getUV:null,getTextureLevel:null}),e},"vec3").once(["NORMAL","VERTEX"])().toVar("clearcoatNormalView");x("transformNormal",_(([r,t=kn])=>ue(t).inverse().transpose().mul(r).normalize()));const Cr=_(([r],t)=>{const e=t.context.modelNormalViewMatrix;return e?r.transformNormalByViewMatrix(e):lc.mul(r).transformNormalByViewMatrix(On)});_(()=>(O(\'TSL: "transformedNormalView" is deprecated. Use "normalView" instead.\'),xt)).once(["NORMAL","VERTEX"])(),_(()=>(O(\'TSL: "transformedNormalWorld" is deprecated. Use "normalWorld" instead.\'),xc)).once(["NORMAL","VERTEX"])(),_(()=>(O(\'TSL: "transformedClearcoatNormalView" is deprecated. Use "clearcoatNormalView" instead.\'),wc)).once(["NORMAL","VERTEX"])();const Dn=new ot,Nc=et(0).onReference(({material:r})=>r).onObjectUpdate(({material:r})=>r.refractionRatio),Tc=et(new ot).onReference(function(r){return r.material}).onObjectUpdate(function({material:r,scene:t}){const s=(t.environment!==null||t.environmentNode&&t.environmentNode.isNode)&&r.envMap===null?t.environmentRotation:r.envMapRotation;return s?Dn.makeRotationFromEuler(s).transpose():Dn.identity(),Dn}),Sc=vr.negate().reflect(xt),vc=vr.negate().refract(xt,Nc),Mc=Sc.transformDirection(Tr).toVar("reflectVector"),Cc=vc.transformDirection(Tr).toVar("refractVector"),bc=new Qo;class Ec extends As{static get type(){return"CubeTextureNode"}constructor(t,e=null,s=null,n=null){super(t,e,s,n),this.isCubeTextureNode=!0}getInputType(){return this.value.isDepthTexture===!0?"cubeDepthTexture":"cubeTexture"}getDefaultUV(){const t=this.value;return t.mapping===301?Mc:t.mapping===302?Cc:(K(\'CubeTextureNode: Mapping "%s" not supported.\',t.mapping),F(0,0,0))}setUpdateMatrix(){}setupUV(t,e){const s=this.value;return s.isDepthTexture===!0?t.renderer.coordinateSystem===2001?F(e.x,e.y.negate(),e.z):e:(e=Tc.mul(e),(t.renderer.coordinateSystem===2001||!s.isRenderTargetTexture)&&(e=F(e.x.negate(),e.yz)),e)}generateUV(t,e){return e.build(t,this.sampler===!0?"vec3":"ivec3")}}const Ac=rt(Ec).setParameterLength(1,4).setName("cubeTexture"),_c=(r=bc,t=null,e=null,s=null)=>{let n;return r&&r.isCubeTextureNode===!0?(n=E(r.clone()),n.referenceNode=r,t!==null&&(n.uvNode=E(t)),e!==null&&(n.levelNode=E(e)),s!==null&&(n.biasNode=E(s))):n=Ac(r,t,e,s),n};class Rc extends Ge{static get type(){return"ReferenceElementNode"}constructor(t,e){super(t,e),this.referenceNode=t,this.isReferenceElementNode=!0}generateNodeType(){return this.referenceNode.uniformType}generate(t){const e=super.generate(t),s=this.referenceNode.getNodeType(t),n=this.getNodeType(t);return t.format(e,s,n)}}class br extends L{static get type(){return"ReferenceNode"}constructor(t,e,s=null,n=null){super(),this.property=t,this.uniformType=e,this.object=s,this.count=n,this.properties=t.split("."),this.reference=s,this.node=null,this.group=null,this.name=null,this.updateType=W.OBJECT}element(t){return new Rc(this,E(t))}setGroup(t){return this.group=t,this}setName(t){return this.name=t,this}label(t){return O(\'TSL: "label()" has been deprecated. Use "setName()" instead.\'),this.setName(t)}setNodeType(t){let e=null;this.count!==null?e=sc(null,t,this.count):Array.isArray(this.getValueFromReference())?(e=Ot(null,t),e.updateType=W.OBJECT):t==="texture"?e=ec(null):t==="cubeTexture"?e=_c(null):e=et(null,t),this.group!==null&&e.setGroup(this.group),this.name!==null&&e.setName(this.name),this.node=e}generateNodeType(t){return this.node===null&&(this.updateReference(t),this.updateValue()),this.node.getNodeType(t)}getValueFromReference(t=this.reference){const{properties:e}=this;let s=t[e[0]];for(let n=1;n<e.length;n++)s=s[e[n]];return s}updateReference(t){return this.reference=this.object!==null?this.object:t.object,this.reference}setup(){return this.updateValue(),this.node}update(){this.updateValue()}updateValue(){this.node===null&&this.setNodeType(this.uniformType);const t=this.getValueFromReference();Array.isArray(t)?this.node.array=t:this.node.value=t}}const Er=(r,t,e)=>new br(r,t,e);class Lc extends br{static get type(){return"MaterialReferenceNode"}constructor(t,e,s=null){super(t,e,s),this.material=s,this.isMaterialReferenceNode=!0}updateReference(t){return this.reference=this.material!==null?this.material:t.material,this.reference}}const Ic=(r,t,e=null)=>new Lc(r,t,e),Ar=Le(),zc=pt.dFdx(),Fc=pt.dFdy(),_r=Ar.dFdx(),Rr=Ar.dFdy(),Lr=xt,Ir=Fc.cross(Lr),zr=Lr.cross(zc),Un=Ir.mul(_r.x).add(zr.mul(Rr.x)),Vn=Ir.mul(_r.y).add(zr.mul(Rr.y)),Fr=Un.dot(Un).max(Vn.dot(Vn)),Pr=Fr.equal(0).select(0,Fr.inverseSqrt()),Pc=Un.mul(Pr).toVar("tangentViewFrame"),Oc=Vn.mul(Pr).toVar("bitangentViewFrame"),Or=jt("tangent","vec4"),kc=Or.xyz.toVar("tangentLocal"),kr=_(r=>{let t;return r.subBuildFn==="VERTEX"||r.geometry.hasAttribute("tangent")?t=Bn.mul(H(kc,0)).xyz.toVarying("v_tangentView").normalize():t=Pc,r.isFlatShading()!==!0&&(t=Fs(t)),t},"vec3").once(["NORMAL","VERTEX"])().toVar("tangentView"),Bc=_(([r,t],e)=>{let s=r.mul(Or.w).xyz;return e.subBuildFn==="NORMAL"&&e.isFlatShading()!==!0&&(s=s.toVarying(t)),s}).once(["NORMAL"]),Dc=ue(kr,_(r=>{let t;return r.subBuildFn==="VERTEX"||r.geometry.hasAttribute("tangent")?t=Bc(xt.cross(kr),"v_bitangentView").normalize():t=Oc,r.isFlatShading()!==!0&&(t=Fs(t)),t},"vec3").once(["NORMAL","VERTEX"])().toVar("bitangentView"),xt).toVar("TBNViewMatrix"),Br=r=>F(r,Mn(rr(B(1).sub(He(r,r)))));class Uc extends at{static get type(){return"NormalMapNode"}constructor(t,e=null){super("vec3"),this.node=t,this.scaleNode=e,this.normalMapType=0,this.unpackNormalMode=""}setup(t){const{normalMapType:e,scaleNode:s,unpackNormalMode:n}=this;let i=this.node.mul(2).sub(1);if(e===0?n==="rg"?i=Br(i.xy):n==="ga"?i=Br(i.yw):n!==""&&K(`THREE.NodeMaterial: Unexpected unpack normal mode: ${n}`):n!==""&&K(`THREE.NodeMaterial: Normal map type \'${e}\' is not compatible with unpack normal mode \'${n}\'`),s!==null){let a=s;t.isFlatShading()===!0&&(a=Fs(a)),i=F(i.xy.mul(a),i.z)}let o=null;return e===1?o=Cr(i):e===0?o=Dc.mul(i).normalize():(K(`NodeMaterial: Unsupported normal map type: ${e}`),o=xt),o}}const Dr=rt(Uc).setParameterLength(1,2),Vc=_(({textureNode:r,bumpScale:t})=>{const e=n=>r.isolate().context({getUV:i=>n(i.uvNode||Le()),forceUVContext:!0}),s=B(e(n=>n));return qt(B(e(n=>n.add(n.dFdx()))).sub(s),B(e(n=>n.add(n.dFdy()))).sub(s)).mul(t)}),Gc=_(r=>{const{surf_pos:t,surf_norm:e,dHdxy:s}=r,n=t.dFdx().normalize(),i=t.dFdy().normalize(),o=e,a=i.cross(o),l=o.cross(n),h=n.dot(a).mul(Mr),c=h.sign().mul(s.x.mul(a).add(s.y.mul(l)));return h.abs().mul(e).sub(c).normalize()});class Wc extends at{static get type(){return"BumpMapNode"}constructor(t,e=null){super("vec3"),this.textureNode=t,this.scaleNode=e}setup(t){if(t.material.wireframe===!0)return xt;const e=this.scaleNode!==null?this.scaleNode:1,s=Vc({textureNode:this.textureNode,bumpScale:e});return Gc({surf_pos:pt,surf_norm:xt,dHdxy:s})}}const $c=rt(Wc).setParameterLength(1,2),Ur=new Map;class N extends L{static get type(){return"MaterialNode"}constructor(t){super(),this.scope=t}getCache(t,e){let s=Ur.get(t);return s===void 0&&(s=Ic(t,e),Ur.set(t,s)),s}getFloat(t){return this.getCache(t,"float")}getColor(t){return this.getCache(t,"color")}getTexture(t){return this.getCache(t==="map"?"map":t+"Map","texture")}setup(t){const e=t.context.material,s=this.scope;let n=null;if(s===N.COLOR){const i=e.color!==void 0?this.getColor(s):F();e.map&&e.map.isTexture===!0?n=i.mul(this.getTexture("map")):n=i}else if(s===N.OPACITY){const i=this.getFloat(s);e.alphaMap&&e.alphaMap.isTexture===!0?n=i.mul(this.getTexture("alpha")):n=i}else if(s===N.SPECULAR_STRENGTH)e.specularMap&&e.specularMap.isTexture===!0?n=this.getTexture("specular").r:n=B(1);else if(s===N.SPECULAR_INTENSITY){const i=this.getFloat(s);e.specularIntensityMap&&e.specularIntensityMap.isTexture===!0?n=i.mul(this.getTexture(s).a):n=i}else if(s===N.SPECULAR_COLOR){const i=this.getColor(s);e.specularColorMap&&e.specularColorMap.isTexture===!0?n=i.mul(this.getTexture(s).rgb):n=i}else if(s===N.ROUGHNESS){const i=this.getFloat(s);e.roughnessMap&&e.roughnessMap.isTexture===!0?n=i.mul(this.getTexture(s).g):n=i}else if(s===N.METALNESS){const i=this.getFloat(s);e.metalnessMap&&e.metalnessMap.isTexture===!0?n=i.mul(this.getTexture(s).b):n=i}else if(s===N.EMISSIVE){const i=this.getFloat("emissiveIntensity"),o=this.getColor(s).mul(i);e.emissiveMap&&e.emissiveMap.isTexture===!0?n=o.mul(this.getTexture(s)):n=o}else if(s===N.NORMAL)e.normalMap?(n=Dr(this.getTexture("normal"),this.getCache("normalScale","vec2")),n.normalMapType=e.normalMapType,(e.normalMap.format==1030||e.normalMap.format==36285||e.normalMap.format==37490)&&(n.unpackNormalMode="rg")):e.bumpMap?n=$c(this.getTexture("bump").r,this.getFloat("bumpScale")):n=xt;else if(s===N.CLEARCOAT){const i=this.getFloat(s);e.clearcoatMap&&e.clearcoatMap.isTexture===!0?n=i.mul(this.getTexture(s).r):n=i}else if(s===N.CLEARCOAT_ROUGHNESS){const i=this.getFloat(s);e.clearcoatRoughnessMap&&e.clearcoatRoughnessMap.isTexture===!0?n=i.mul(this.getTexture(s).r):n=i}else if(s===N.CLEARCOAT_NORMAL)e.clearcoatNormalMap?n=Dr(this.getTexture(s),this.getCache(s+"Scale","vec2")):n=xt;else if(s===N.SHEEN){const i=this.getColor("sheenColor").mul(this.getFloat("sheen"));e.sheenColorMap&&e.sheenColorMap.isTexture===!0?n=i.mul(this.getTexture("sheenColor").rgb):n=i}else if(s===N.SHEEN_ROUGHNESS){const i=this.getFloat(s);e.sheenRoughnessMap&&e.sheenRoughnessMap.isTexture===!0?n=i.mul(this.getTexture(s).a):n=i,n=n.clamp(1e-4,1)}else if(s===N.ANISOTROPY)if(e.anisotropyMap&&e.anisotropyMap.isTexture===!0){const i=this.getTexture(s);n=$i(ts.x,ts.y,ts.y.negate(),ts.x).mul(i.rg.mul(2).sub(qt(1)).normalize().mul(i.b))}else n=ts;else if(s===N.IRIDESCENCE_THICKNESS){const i=Er("1","float",e.iridescenceThicknessRange);if(e.iridescenceThicknessMap){const o=Er("0","float",e.iridescenceThicknessRange);n=i.sub(o).mul(this.getTexture(s).g).add(o)}else n=i}else if(s===N.TRANSMISSION){const i=this.getFloat(s);e.transmissionMap?n=i.mul(this.getTexture(s).r):n=i}else if(s===N.THICKNESS){const i=this.getFloat(s);e.thicknessMap?n=i.mul(this.getTexture(s).g):n=i}else if(s===N.IOR)n=this.getFloat(s);else if(s===N.LIGHT_MAP)e.lightMap?n=this.getTexture(s).rgb.mul(this.getFloat("lightMapIntensity")):n=F(0);else if(s===N.AO)e.aoMap?n=this.getTexture(s).r.sub(1).mul(this.getFloat("aoMapIntensity")).add(1):n=B(1);else if(s===N.LINE_DASH_OFFSET)n=e.dashOffset?this.getFloat(s):B(0);else{const i=this.getNodeType(t);n=this.getCache(s,i)}return n}}N.ALPHA_TEST="alphaTest",N.COLOR="color",N.OPACITY="opacity",N.SHININESS="shininess",N.SPECULAR="specular",N.SPECULAR_STRENGTH="specularStrength",N.SPECULAR_INTENSITY="specularIntensity",N.SPECULAR_COLOR="specularColor",N.REFLECTIVITY="reflectivity",N.ROUGHNESS="roughness",N.METALNESS="metalness",N.NORMAL="normal",N.CLEARCOAT="clearcoat",N.CLEARCOAT_ROUGHNESS="clearcoatRoughness",N.CLEARCOAT_NORMAL="clearcoatNormal",N.EMISSIVE="emissive",N.ROTATION="rotation",N.SHEEN="sheen",N.SHEEN_ROUGHNESS="sheenRoughness",N.ANISOTROPY="anisotropy",N.IRIDESCENCE="iridescence",N.IRIDESCENCE_IOR="iridescenceIOR",N.IRIDESCENCE_THICKNESS="iridescenceThickness",N.IOR="ior",N.TRANSMISSION="transmission",N.THICKNESS="thickness",N.ATTENUATION_DISTANCE="attenuationDistance",N.ATTENUATION_COLOR="attenuationColor",N.LINE_SCALE="scale",N.LINE_DASH_SIZE="dashSize",N.LINE_GAP_SIZE="gapSize",N.LINE_WIDTH="linewidth",N.LINE_DASH_OFFSET="dashOffset",N.POINT_SIZE="size",N.DISPERSION="dispersion",N.LIGHT_MAP="light",N.AO="ao",N.ALPHA_TEST,N.COLOR,N.SHININESS,N.EMISSIVE,N.OPACITY,N.SPECULAR,N.SPECULAR_INTENSITY,N.SPECULAR_COLOR,N.SPECULAR_STRENGTH,N.REFLECTIVITY,N.ROUGHNESS,N.METALNESS,N.NORMAL,N.CLEARCOAT,N.CLEARCOAT_ROUGHNESS,N.CLEARCOAT_NORMAL,N.ROTATION,N.SHEEN,N.SHEEN_ROUGHNESS,N.ANISOTROPY,N.IRIDESCENCE,N.IRIDESCENCE_IOR,N.IRIDESCENCE_THICKNESS,N.TRANSMISSION,N.THICKNESS,N.IOR,N.ATTENUATION_DISTANCE,N.ATTENUATION_COLOR;const qc=A(N,N.LINE_SCALE),Hc=A(N,N.LINE_DASH_SIZE),jc=A(N,N.LINE_GAP_SIZE),Gn=A(N,N.LINE_WIDTH),Yc=A(N,N.LINE_DASH_OFFSET);N.POINT_SIZE,N.DISPERSION,N.LIGHT_MAP,N.AO;const ts=et(new mt).onReference(function(r){return r.material}).onRenderUpdate(function({material:r}){this.value.set(r.anisotropy*Math.cos(r.anisotropyRotation),r.anisotropy*Math.sin(r.anisotropyRotation))});class wt extends L{static get type(){return"EventNode"}constructor(t,e){super("void"),this.eventType=t,this.callback=e,t===wt.OBJECT?this.updateType=W.OBJECT:t===wt.MATERIAL?this.updateType=W.RENDER:t===wt.FRAME?this.updateType=W.FRAME:t===wt.BEFORE_OBJECT?this.updateBeforeType=W.OBJECT:t===wt.BEFORE_MATERIAL?this.updateBeforeType=W.RENDER:t===wt.BEFORE_FRAME&&(this.updateBeforeType=W.FRAME)}update(t){this.callback(t)}updateBefore(t){this.callback(t)}}wt.OBJECT="object",wt.MATERIAL="material",wt.FRAME="frame",wt.BEFORE_OBJECT="beforeObject",wt.BEFORE_MATERIAL="beforeMaterial",wt.BEFORE_FRAME="beforeFrame";class Xc extends L{static get type(){return"LoopNode"}constructor(t=[]){super("void"),this.params=t}getVarName(t){return String.fromCharCode(105+t)}getProperties(t){const e=t.getNodeProperties(this);if(e.stackNode!==void 0)return e;const s={};for(let a=0,l=this.params.length-1;a<l;a++){const h=this.params[a],c=h.isNode!==!0&&h.name||this.getVarName(a),u=h.isNode!==!0&&h.type||"int";s[c]=Ht(c,u)}const n=t.addStack(),i=this.params[this.params.length-1](s);e.returnsNode=i.context({nodeLoop:i}),e.stackNode=n;const o=this.params[0];if(o.isNode!==!0&&typeof o.update=="function"){const a=_(this.params[0].update)(s);e.updateNode=a.context({nodeLoop:a})}return t.removeStack(),e}setup(t){if(this.getProperties(t),t.fnCall){const e=t.getDataFromNode(t.fnCall.shaderNode);e.hasLoop=!0}}generate(t){const e=this.getProperties(t),s=this.params,n=e.stackNode;for(let o=0,a=s.length-1;o<a;o++){const l=s[o];let h=!1,c=null,u=null,d=null,p=null,f=null,m=null;l.isNode?l.getNodeType(t)==="bool"?(h=!0,p="bool",u=l.build(t,p)):(p="int",d=this.getVarName(o),c="0",u=l.build(t,p),f="<"):(p=l.type||"int",d=l.name||this.getVarName(o),c=l.start,u=l.end,f=l.condition,m=l.update,typeof c=="number"?c=t.generateConst(p,c):c&&c.isNode&&(c=c.build(t,p)),typeof u=="number"?u=t.generateConst(p,u):u&&u.isNode&&(u=u.build(t,p)),c!==void 0&&u===void 0?(c=c+" - 1",u="0",f=">="):u!==void 0&&c===void 0&&(c="0",f="<"),f===void 0&&(Number(c)>Number(u)?f=">=":f="<"));let y;if(h)y=`while ( ${u} )`;else{const w={start:c,end:u},M=w.start,C=w.end;let b;const S=()=>f.includes("<")?"+=":"-=";if(m!=null)switch(typeof m){case"function":b=t.flowStagesNode(e.updateNode,"void").code.replace(/\\t|;/g,"");break;case"number":b=d+" "+S()+" "+t.generateConst(p,m);break;case"string":b=d+" "+m;break;default:m.isNode?b=d+" "+S()+" "+m.build(t):(K("TSL: \'Loop( { update: ... } )\' is not a function, string or number.",this.stackTrace),b="break /* invalid update */")}else p==="int"||p==="uint"?m=f.includes("<")?"++":"--":m=S()+" 1.",b=d+" "+m;const R=t.getVar(p,d)+" = "+M,I=d+" "+f+" "+C;y=`for ( ${R}; ${I}; ${b} )`}t.addFlowCode((o===0?`\n`:"")+t.tab+y+` {\n\n`).addFlowTab()}const i=n.build(t,"void");e.returnsNode.build(t,"void"),t.removeFlowTab().addFlowCode(`\n`+t.tab+i);for(let o=0,a=this.params.length-1;o<a;o++)t.addFlowCode((o===0?"":t.tab)+`}\n\n`).removeFlowTab();t.addFlowTab()}}const es=(...r)=>new Xc(Ae(r,"int")).toStack(),fe=new mt;class Zc extends As{static get type(){return"ViewportTextureNode"}constructor(t=Ln,e=null,s=null){let n=null;s===null?(n=new Jo,n.minFilter=1008,s=n):n=s,super(s,t,e),this.generateMipmaps=!1,this.defaultFramebuffer=n,this.isOutputTextureNode=!0,this.updateBeforeType=W.RENDER,this._cacheTextures=new WeakMap}getTextureForReference(t=null){let e,s;if(this.referenceNode?(e=this.referenceNode.defaultFramebuffer,s=this.referenceNode._cacheTextures):(e=this.defaultFramebuffer,s=this._cacheTextures),t===null)return e;if(s.has(t)===!1){const n=e.clone();s.set(t,n)}return s.get(t)}updateReference(t){const e=t.renderer,s=e.getRenderTarget(),n=e.getCanvasTarget(),i=s||n;return this.value=this.getTextureForReference(i),this.value}updateBefore(t){const e=t.renderer,s=e.getRenderTarget(),n=e.getCanvasTarget(),i=s||n;i===null?e.getDrawingBufferSize(fe):i.getDrawingBufferSize?i.getDrawingBufferSize(fe):fe.set(i.width,i.height);const o=this.getTextureForReference(i);(o.image.width!==fe.width||o.image.height!==fe.height)&&(o.image.width=fe.width,o.image.height=fe.height,o.needsUpdate=!0);const a=o.generateMipmaps;o.generateMipmaps=this.generateMipmaps,e.copyFramebufferToTexture(o),o.generateMipmaps=a}clone(){const t=new this.constructor(this.uvNode,this.levelNode,this.value);return t.generateMipmaps=this.generateMipmaps,t}}let Wn=null;class Jc extends Zc{static get type(){return"ViewportDepthTextureNode"}constructor(t=Ln,e=null,s=null){s===null&&(Wn===null&&(Wn=new ln),s=Wn),super(t,e,s)}}const Qc=rt(Jc).setParameterLength(0,3);class gt extends L{static get type(){return"ViewportDepthNode"}constructor(t,e=null){super("float"),this.scope=t,this.valueNode=e,this.isViewportDepthNode=!0}generate(t){const{scope:e}=this;return e===gt.DEPTH_BASE?t.getFragDepth():super.generate(t)}setup({camera:t}){const{scope:e}=this,s=this.valueNode;let n=null;if(e===gt.DEPTH_BASE)s!==null&&(n=Gr().assign(s));else if(e===gt.DEPTH)t.isPerspectiveCamera?n=Kc(pt.z,Qe,Ke):n=Ps(pt.z,Qe,Ke);else if(e===gt.LINEAR_DEPTH)if(s!==null)if(t.isPerspectiveCamera){const i=Vr(s,Qe,Ke);n=Ps(i,Qe,Ke)}else n=s;else n=Ps(pt.z,Qe,Ke);return n}}gt.DEPTH_BASE="depthBase",gt.DEPTH="depth",gt.LINEAR_DEPTH="linearDepth";const Ps=(r,t,e)=>r.add(t).div(t.sub(e)),Kc=(r,t,e)=>t.add(r).mul(e).div(e.sub(t).mul(r)),Vr=_(([r,t,e],s)=>s.renderer.reversedDepthBuffer===!0?t.mul(e).div(t.sub(e).mul(r).sub(t)):t.mul(e).div(e.sub(t).mul(r).sub(e))),Gr=rt(gt,gt.DEPTH_BASE),tu=A(gt,gt.DEPTH);Qc(),tu.assign=r=>Gr(r);class ge extends L{static get type(){return"ClippingNode"}constructor(t=ge.DEFAULT){super(),this.scope=t}setup(t){super.setup(t);const e=t.clippingContext,{intersectionPlanes:s,unionPlanes:n}=e;return this.hardwareClipping=t.hardwareClipping,this.scope===ge.ALPHA_TO_COVERAGE?this.setupAlphaToCoverage(s,n):this.scope===ge.HARDWARE?this.setupHardwareClipping(n,t):this.setupDefault(s,n)}setupAlphaToCoverage(t,e){return _(()=>{const s=B().toVar("distanceToPlane"),n=B().toVar("distanceToGradient"),i=B(1).toVar("clipOpacity"),o=e.length;if(this.hardwareClipping===!1&&o>0){const l=Ot(e).setGroup(ut);es(o,({i:h})=>{const c=l.element(h);s.assign(pt.dot(c.xyz).negate().add(c.w)),n.assign(s.fwidth().div(2)),i.mulAssign(pe(n.negate(),n,s))})}const a=t.length;if(a>0){const l=Ot(t).setGroup(ut),h=B(1).toVar("intersectionClipOpacity");es(a,({i:c})=>{const u=l.element(c);s.assign(pt.dot(u.xyz).negate().add(u.w)),n.assign(s.fwidth().div(2)),h.mulAssign(pe(n.negate(),n,s).oneMinus())}),i.mulAssign(h.oneMinus())}Hi.a.mulAssign(i),Hi.a.equal(0).discard()})()}setupDefault(t,e){return _(()=>{const s=e.length;if(this.hardwareClipping===!1&&s>0){const i=Ot(e).setGroup(ut);es(s,({i:o})=>{const a=i.element(o);pt.dot(a.xyz).greaterThan(a.w).discard()})}const n=t.length;if(n>0){const i=Ot(t).setGroup(ut),o=Nn(!0).toVar("clipped");es(n,({i:a})=>{const l=i.element(a);o.assign(pt.dot(l.xyz).greaterThan(l.w).and(o))}),o.discard()}})()}setupHardwareClipping(t,e){const s=t.length;return e.enableHardwareClipping(s),_(()=>{const n=Ot(t).setGroup(ut),i=Ye(e.getClipDistance());es(s,({i:o})=>{const a=n.element(o),l=pt.dot(a.xyz).sub(a.w).negate();i.element(o).assign(l)})})()}}ge.ALPHA_TO_COVERAGE="alphaToCoverage",ge.DEFAULT="default",ge.HARDWARE="hardware";const Os=Cs("vec3","worldStart"),$n=Cs("vec3","worldEnd"),Wr=Cs("float","lineDistance"),me=Cs("vec4","worldPos"),$r=_(({start:r,end:t})=>{const e=Ie.element(2).element(2),s=Ie.element(3).element(2);return e.greaterThan(0).select(s.negate().div(e.add(1)),s.mul(-.5).div(e)).sub(r.z).div(t.z.sub(r.z))},{start:"vec4",end:"vec4",return:"float"}),eu=_(({p1:r,p2:t,p3:e,p4:s})=>{const n=r.sub(e),i=s.sub(e),o=t.sub(r),a=n.dot(i),l=i.dot(o),h=n.dot(o),c=i.dot(i),d=o.dot(o).mul(c).sub(l.mul(l)),f=a.mul(l).sub(h.mul(c)).div(d).clamp(),m=a.add(l.mul(f)).div(c).clamp();return qt(f,m)},{p1:"vec3",p2:"vec3",p3:"vec3",p4:"vec3",return:"vec2"});_(({material:r})=>{const t=r._useDash,e=r._useWorldUnits,s=jt("instanceStart"),n=jt("instanceEnd"),i=H(Bn.mul(H(s,1))).toVar("start"),o=H(Bn.mul(H(n,1))).toVar("end");let a,l;t&&(a=B(jt("instanceDistanceStart")).toVar("distanceStart"),l=B(jt("instanceDistanceEnd")).toVar("distanceEnd")),e&&(Os.assign(i.xyz),$n.assign(o.xyz));const h=Je.z.div(Je.w),c=Ie.element(2).element(3).equal(-1);if(ft(c,()=>{ft(i.z.lessThan(0).and(o.z.greaterThan(0)),()=>{const w=$r({start:i,end:o});o.assign(H(ie(i.xyz,o.xyz,w),o.w)),t&&l.assign(ie(a,l,w))}).ElseIf(o.z.lessThan(0).and(i.z.greaterThanEqual(0)),()=>{const w=$r({start:o,end:i});i.assign(H(ie(o.xyz,i.xyz,w),i.w)),t&&a.assign(ie(l,a,w))})}),t){const w=r.dashScaleNode?B(r.dashScaleNode):qc,M=r.offsetNode?B(r.offsetNode):Yc;let C=St.y.lessThan(.5).select(w.mul(a),w.mul(l));C=C.add(M),Wr.assign(C)}const u=Ie.mul(i),d=Ie.mul(o),p=u.xyz.div(u.w),f=d.xyz.div(d.w),m=f.xy.sub(p.xy).toVar();m.x.assign(m.x.mul(h)),m.assign(m.normalize());const y=H().toVar();if(e){const w=o.xyz.sub(i.xyz).normalize(),M=ie(i.xyz,o.xyz,.5).normalize(),C=w.cross(M).normalize(),b=w.cross(C);me.assign(St.y.lessThan(.5).select(i,o));const S=Gn.mul(.5);me.addAssign(H(St.x.lessThan(0).select(C.mul(S),C.mul(S).negate()),0)),t||(me.addAssign(H(St.y.lessThan(.5).select(w.mul(S).negate(),w.mul(S)),0)),me.addAssign(H(b.mul(S),0)),ft(St.y.greaterThan(1).or(St.y.lessThan(0)),()=>{me.subAssign(H(b.mul(2).mul(S),0))})),y.assign(Ie.mul(me));const R=F().toVar();R.assign(St.y.lessThan(.5).select(p,f)),y.z.assign(R.z.mul(y.w))}else{const w=qt(m.y,m.x.negate()).toVar("offset");m.x.assign(m.x.div(h)),w.x.assign(w.x.div(h)),w.assign(St.x.lessThan(0).select(w.negate(),w)),ft(St.y.lessThan(0),()=>{w.assign(w.sub(m))}).ElseIf(St.y.greaterThan(1),()=>{w.assign(w.add(m))}),w.assign(w.mul(Gn)),w.assign(w.div(Je.w.div(oc))),y.assign(St.y.lessThan(.5).select(u,d)),w.assign(w.mul(y.w)),y.assign(y.add(H(w,0,0)))}return y})(),_(({material:r,renderer:t})=>{const e=r._useAlphaToCoverage,s=r._useDash,n=r._useWorldUnits,i=Le();if(s){const a=r.dashSizeNode?B(r.dashSizeNode):Hc,l=r.gapSizeNode?B(r.gapSizeNode):jc;Tn.assign(a),Yi.assign(l),i.y.lessThan(-1).or(i.y.greaterThan(1)).discard(),Wr.mod(Tn.add(Yi)).greaterThan(Tn).discard()}const o=B(1).toVar("alpha");if(n){const a=me.xyz.normalize().mul(1e5),l=$n.sub(Os),h=eu({p1:Os,p2:$n,p3:F(0,0,0),p4:a}),c=Os.add(l.mul(h.x)),u=a.mul(h.y),f=c.sub(u).length().div(Gn);if(!s)if(e&&t.currentSamples>0){const m=f.fwidth();o.assign(pe(m.negate().add(.5),m.add(.5),f).oneMinus())}else f.greaterThan(.5).discard()}else if(e&&t.currentSamples>0){const a=i.x,l=i.y.greaterThan(0).select(i.y.sub(1),i.y.add(1)),h=a.mul(a).add(l.mul(l)),c=B(h.fwidth()).toVar("dlen");ft(i.y.abs().greaterThan(1),()=>{o.assign(pe(c.oneMinus(),c.add(1),h).oneMinus())})}else ft(i.y.abs().greaterThan(1),()=>{const a=i.x,l=i.y.greaterThan(0).select(i.y.sub(1),i.y.add(1));a.mul(a).add(l.mul(l)).greaterThan(1).discard()});return o})(),F(.04),B(1);const qn=_(([r,t])=>{const e=r.toVar();e.assign(ne(2,e).sub(1));const s=F(e,1).toVar();return ft(t.equal(0),()=>{s.assign(s.zyx)}).ElseIf(t.equal(1),()=>{s.assign(s.xzy),s.xz.mulAssign(-1)}).ElseIf(t.equal(2),()=>{s.x.mulAssign(-1)}).ElseIf(t.equal(3),()=>{s.assign(s.zyx),s.xz.mulAssign(-1)}).ElseIf(t.equal(4),()=>{s.assign(s.xzy),s.xy.mulAssign(-1)}).ElseIf(t.equal(5),()=>{s.z.mulAssign(-1)}),s}).setLayout({name:"getDirection",type:"vec3",inputs:[{name:"uv",type:"vec2"},{name:"face",type:"float"}]})(Le(),jt("faceIndex")).normalize();qn.x,qn.y,qn.z,de("vec3"),de("vec3"),de("vec3");class qr extends or{static get type(){return"OverrideContextNode"}constructor(t,e=null){super(e,{overrideNodes:t}),this.isOverrideContextNode=!0}getFlowContextData(){const t=[];this.traverse(n=>{n.isOverrideContextNode===!0&&t.push(n.value.overrideNodes)});const e=new Map(t.flatMap(n=>Array.from(n.entries()))),s=super.getFlowContextData();return s.overrideNodes=e,s}}function su(r,t=null,e=null){if(t&&t.isNode){const s=t;t=()=>s}return new qr(new Map([[r,t]]),e)}x("overrideNode",(r,t,e)=>su(t,e,r));function nu(r,t=null){const e=new Map;for(const[s,n]of r){const i=n!==null?typeof n=="function"?n:()=>n:null;e.set(s,i)}return new qr(e,t)}x("overrideNodes",(r,t)=>nu(t,r));class Hr extends at{static get type(){return"BitcastNode"}constructor(t,e,s=null){super(),this.valueNode=t,this.conversionType=e,this.inputType=s,this.isBitcastNode=!0}generateNodeType(t){if(this.inputType!==null){const e=this.valueNode.getNodeType(t),s=t.getTypeLength(e);return t.getTypeFromLength(s,this.conversionType)}return this.conversionType}generate(t){const e=this.getNodeType(t);let s="";if(this.inputType!==null){const n=this.valueNode.getNodeType(t);s=t.getTypeLength(n)===1?this.inputType:t.changeComponentType(n,this.inputType)}else s=this.valueNode.getNodeType(t);return`${t.getBitcastMethod(e,s)}( ${this.valueNode.build(t,s)} )`}}const iu=v(Hr).setParameterLength(2),ru=r=>new Hr(r,"uint","float"),ks={};class ye extends g{static get type(){return"BitcountNode"}constructor(t,e){super(t,e),this.isBitcountNode=!0}_resolveElementType(t,e,s){s==="int"?e.assign(iu(t,"uint")):e.assign(t)}_returnDataNode(t){switch(t){case"uint":return lt;case"int":return $e;case"uvec2":return Di;case"uvec3":return Vi;case"uvec4":return Wi;case"ivec2":return Bi;case"ivec3":return Ui;case"ivec4":return Gi}}_createTrailingZerosBaseLayout(t,e){const s=this._returnDataNode(e);return _(([i])=>{const o=lt(0);this._resolveElementType(i,o,e);const a=B(o.bitAnd(er(o))),h=ru(a).shiftRight(23).sub(127);return s(h)}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}_createLeadingZerosBaseLayout(t,e){const s=this._returnDataNode(e);return _(([i])=>{ft(i.equal(lt(0)),()=>lt(32));const o=lt(0),a=lt(0);return this._resolveElementType(i,o,e),ft(o.shiftRight(16).equal(0),()=>{a.addAssign(16),o.shiftLeftAssign(16)}),ft(o.shiftRight(24).equal(0),()=>{a.addAssign(8),o.shiftLeftAssign(8)}),ft(o.shiftRight(28).equal(0),()=>{a.addAssign(4),o.shiftLeftAssign(4)}),ft(o.shiftRight(30).equal(0),()=>{a.addAssign(2),o.shiftLeftAssign(2)}),ft(o.shiftRight(31).equal(0),()=>{a.addAssign(1)}),s(a)}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}_createOneBitsBaseLayout(t,e){const s=this._returnDataNode(e);return _(([i])=>{const o=lt(0);this._resolveElementType(i,o,e),o.assign(o.sub(o.shiftRight(lt(1)).bitAnd(lt(1431655765)))),o.assign(o.bitAnd(lt(858993459)).add(o.shiftRight(lt(2)).bitAnd(lt(858993459))));const a=o.add(o.shiftRight(lt(4))).bitAnd(lt(252645135)).mul(lt(16843009)).shiftRight(lt(24));return s(a)}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}_createMainLayout(t,e,s,n){const i=this._returnDataNode(e);return _(([a])=>{if(s===1)return i(n(a));{const l=i(0),h=["x","y","z","w"];for(let c=0;c<s;c++){const u=h[c];l[u].assign(n(a[u]))}return l}}).setLayout({name:t,type:e,inputs:[{name:"value",type:e}]})}setup(t){const{method:e,aNode:s}=this,{renderer:n}=t;if(n.backend.isWebGPUBackend)return super.setup(t);const i=this.getInputType(t),o=t.getElementType(i),a=t.getTypeLength(i),l=`${e}_base_${o}`,h=`${e}_${i}`;let c=ks[l];if(c===void 0){switch(e){case ye.COUNT_LEADING_ZEROS:{c=this._createLeadingZerosBaseLayout(l,o);break}case ye.COUNT_TRAILING_ZEROS:{c=this._createTrailingZerosBaseLayout(l,o);break}case ye.COUNT_ONE_BITS:{c=this._createOneBitsBaseLayout(l,o);break}}ks[l]=c}let u=ks[h];return u===void 0&&(u=this._createMainLayout(h,i,a,c),ks[h]=u),_(()=>u(s))()}}ye.COUNT_TRAILING_ZEROS="countTrailingZeros",ye.COUNT_LEADING_ZEROS="countLeadingZeros",ye.COUNT_ONE_BITS="countOneBits",new ot;const ou=new yi;Ln.flipX(),ou.depthTexture=new ln(1,1),_(([r])=>Es(B(52.9829189).mul(Es(He(r,qt(.06711056,.00583715)))))).setLayout({name:"interleavedGradientNoise",type:"float",inputs:[{name:"position",type:"vec2"}]}),_(([r,t,e])=>{const s=B(2.399963229728653),n=Mn(B(r).add(.5).div(B(t))),i=B(r).mul(s).add(e);return qt(Ki(i),Cn(i)).mul(n)}).setLayout({name:"vogelDiskSample",type:"vec2",inputs:[{name:"sampleIndex",type:"int"},{name:"samplesCount",type:"int"},{name:"phi",type:"float"}]});class Hn extends bi{constructor(t,e,s=Float32Array){const n=ArrayBuffer.isView(t)?t:new s(t*e);super(n,e),this.isStorageBufferAttribute=!0}}_(({texture:r,uv:t})=>{const s=F().toVar();return ft(t.x.lessThan(1e-4),()=>{s.assign(F(1,0,0))}).ElseIf(t.y.lessThan(1e-4),()=>{s.assign(F(0,1,0))}).ElseIf(t.z.lessThan(1e-4),()=>{s.assign(F(0,0,1))}).ElseIf(t.x.greaterThan(1-1e-4),()=>{s.assign(F(-1,0,0))}).ElseIf(t.y.greaterThan(1-1e-4),()=>{s.assign(F(0,-1,0))}).ElseIf(t.z.greaterThan(1-1e-4),()=>{s.assign(F(0,0,-1))}).Else(()=>{const i=r.sample(t.add(F(-.01,0,0))).r.sub(r.sample(t.add(F(.01,0,0))).r),o=r.sample(t.add(F(0,-.01,0))).r.sub(r.sample(t.add(F(0,.01,0))).r),a=r.sample(t.add(F(0,0,-.01))).r.sub(r.sample(t.add(F(0,0,.01))).r);s.assign(F(i,o,a))}),s.normalize()}),_(([r,t])=>r.mul(t).floor().div(t));const Bs=new mt;class au extends As{static get type(){return"PassTextureNode"}constructor(t,e){super(e),this.passNode=t,this.isPassTextureNode=!0,this.setUpdateMatrix(!1)}setup(t){const e=t.getNodeProperties(this);return e.passNode=this.passNode,super.setup(t)}clone(){return new this.constructor(this.passNode,this.value)}}class jr extends au{static get type(){return"PassMultipleTextureNode"}constructor(t,e,s=!1){super(t,null),this.textureName=e,this.previousTexture=s,this.isPassMultipleTextureNode=!0}updateTexture(){this.value=this.previousTexture?this.passNode.getPreviousTexture(this.textureName):this.passNode.getTexture(this.textureName)}setup(t){return this.updateTexture(),super.setup(t)}clone(){const t=new this.constructor(this.passNode,this.textureName,this.previousTexture);return t.uvNode=this.uvNode,t.levelNode=this.levelNode,t.biasNode=this.biasNode,t.sampler=this.sampler,t.depthNode=this.depthNode,t.compareNode=this.compareNode,t.gradNode=this.gradNode,t.gatherNode=this.gatherNode,t.offsetNode=this.offsetNode,t}}class ss extends at{static get type(){return"PassNode"}constructor(t,e,s,n={}){super("vec4"),this.scope=t,this.scene=e,this.camera=s,this.options=n,this._width=1,this._height=1;const i=new yi(this._width,this._height,{type:1016,...n});i.texture.name="output";let o=null;(this.scope===ss.DEPTH||n.depthBuffer!==!1)&&(o=new ln,o.isRenderTargetTexture=!0,o.name="depth",i.depthTexture=o),this.renderTarget=i,this.overrideMaterial=null,this.transparent=!0,this.opaque=!0,this.contextNode=null,this._contextNodeCache=null,this._textures={output:i.texture},o!==null&&(this._textures.depth=o),this._textureNodes={},this._linearDepthNodes={},this._viewZNodes={},this._previousTextures={},this._previousTextureNodes={},this._cameraNear=et(0),this._cameraFar=et(0),this._mrt=null,this._layers=null,this._resolutionScale=1,this._viewport=null,this._scissor=null,this.isPassNode=!0,this.updateBeforeType=W.FRAME,this.global=!0}setResolutionScale(t){return this._resolutionScale=t,this}getResolutionScale(){return this._resolutionScale}setResolution(t){return O("PassNode: .setResolution() is deprecated. Use .setResolutionScale() instead."),this.setResolutionScale(t)}getResolution(){return O("PassNode: .getResolution() is deprecated. Use .getResolutionScale() instead."),this.getResolutionScale()}setLayers(t){return this._layers=t,this}getLayers(){return this._layers}setMRT(t){return this._mrt=t,this}getMRT(){return this._mrt}getTexture(t){let e=this._textures[t];if(e===void 0){if(t==="depth")throw new Error("THREE.PassNode: Depth texture is not available for this pass.");e=this.renderTarget.texture.clone(),e.name=t,this._textures[t]=e,this.renderTarget.textures.push(e)}return e}getPreviousTexture(t){let e=this._previousTextures[t];return e===void 0&&(e=this.getTexture(t).clone(),this._previousTextures[t]=e),e}toggleTexture(t){const e=this._previousTextures[t];if(e!==void 0){const s=this._textures[t],n=this.renderTarget.textures.indexOf(s);this.renderTarget.textures[n]=e,this._textures[t]=e,this._previousTextures[t]=s,this._textureNodes[t].updateTexture(),this._previousTextureNodes[t].updateTexture()}}getTextureNode(t="output"){let e=this._textureNodes[t];return e===void 0&&(e=new jr(this,t),e.updateTexture(),this._textureNodes[t]=e),e}getPreviousTextureNode(t="output"){let e=this._previousTextureNodes[t];return e===void 0&&(this._textureNodes[t]===void 0&&this.getTextureNode(t),e=new jr(this,t,!0),e.updateTexture(),this._previousTextureNodes[t]=e),e}getViewZNode(t="depth"){let e=this._viewZNodes[t];if(e===void 0){const s=this._cameraNear,n=this._cameraFar;this._viewZNodes[t]=e=Vr(this.getTextureNode(t),s,n)}return e}getLinearDepthNode(t="depth"){let e=this._linearDepthNodes[t];if(e===void 0){const s=this._cameraNear,n=this._cameraFar,i=this.getViewZNode(t);this._linearDepthNodes[t]=e=Ps(i,s,n)}return e}async compileAsync(t){const e=t.getRenderTarget(),s=t.getMRT();t.setRenderTarget(this.renderTarget),t.setMRT(this._mrt),await t.compileAsync(this.scene,this.camera),t.setRenderTarget(e),t.setMRT(s)}setup({renderer:t}){return this.renderTarget.samples=this.options.samples===void 0?t.samples:this.options.samples,this.renderTarget.texture.type=t.getOutputBufferType(),t.reversedDepthBuffer===!0&&this.renderTarget.depthTexture!==null&&(this.renderTarget.depthTexture.type=1015),this.scope===ss.COLOR?this.getTextureNode():this.getLinearDepthNode()}updateBefore(t){const{renderer:e}=t,{scene:s}=this;let n;const i=e.getOutputRenderTarget();i&&i.isXRRenderTarget===!0?(n=e.xr.getCamera(),e.xr.updateCamera(n),Bs.set(i.width,i.height)):(n=this.camera,e.getDrawingBufferSize(Bs)),this.setSize(Bs.width,Bs.height);const o=e.getRenderTarget(),a=e.getMRT(),l=e.autoClear,h=e.transparent,c=e.opaque,u=n.layers.mask,d=e.contextNode,p=s.overrideMaterial;this._cameraNear.value=n.near,this._cameraFar.value=n.far,this._layers!==null&&(n.layers.mask=this._layers.mask);for(const m in this._previousTextures)this.toggleTexture(m);this.overrideMaterial!==null&&(s.overrideMaterial=this.overrideMaterial),e.setRenderTarget(this.renderTarget),e.setMRT(this._mrt),e.autoClear=!0,e.transparent=this.transparent,e.opaque=this.opaque,this.contextNode!==null&&((this._contextNodeCache===null||this._contextNodeCache.version!==this.version)&&(this._contextNodeCache={version:this.version,context:Re({...e.contextNode.getFlowContextData(),...this.contextNode.getFlowContextData()})}),e.contextNode=this._contextNodeCache.context);const f=s.name;s.name=this.name?this.name:s.name,e.render(s,n),s.name=f,s.overrideMaterial=p,e.setRenderTarget(o),e.setMRT(a),e.autoClear=l,e.transparent=h,e.opaque=c,e.contextNode=d,n.layers.mask=u}setSize(t,e){this._width=t,this._height=e;const s=Math.floor(this._width*this._resolutionScale),n=Math.floor(this._height*this._resolutionScale);this.renderTarget.setSize(s,n),this._scissor!==null?(this.renderTarget.scissor.copy(this._scissor).multiplyScalar(this._resolutionScale).floor(),this.renderTarget.scissorTest=!0):this.renderTarget.scissorTest=!1,this._viewport!==null&&this.renderTarget.viewport.copy(this._viewport).multiplyScalar(this._resolutionScale).floor()}setScissor(t,e,s,n){t===null?this._scissor=null:(this._scissor===null&&(this._scissor=new Zt),t.isVector4?this._scissor.copy(t):this._scissor.set(t,e,s,n))}setViewport(t,e,s,n){t===null?this._viewport=null:(this._viewport===null&&(this._viewport=new Zt),t.isVector4?this._viewport.copy(t):this._viewport.set(t,e,s,n))}dispose(){this.renderTarget.dispose()}}ss.COLOR="color",ss.DEPTH="depth",F(1.6605,-.1246,-.0182),F(-.5876,1.1329,-.1006),F(-.0728,-.0083,1.1187),F(.6274,.0691,.0164),F(.3293,.9195,.088),F(.0433,.0113,.8956);class tt extends L{static get type(){return"CodeNode"}constructor(t="",e=[],s=""){super("code"),this.isCodeNode=!0,this.global=!0,this.code=t,this.includes=e,this.language=s}setIncludes(t){return this.includes=t,this}getIncludes(){return this.includes}generate(t){const e=this.getIncludes(t);for(const n of e)n.build(t);const s=t.getCodeFromNode(this,this.getNodeType(t));return s.code=this.code,s.code}serialize(t){super.serialize(t),t.code=this.code,t.language=this.language}deserialize(t){super.deserialize(t),this.code=t.code,this.language=t.language}}function jn(r){let t;const e=r.context.getViewZ;return e!==void 0&&(t=e(this)),(t||pt.z).negate()}_(([r,t],e)=>{const s=jn(e);return pe(r,t,s)}),_(([r],t)=>{const e=jn(t);return r.mul(r,e,e).negate().exp().oneMinus()}),_(([r,t],e)=>{const s=jn(e),i=t.sub(dc.y).max(0).toConst().mul(s).toConst();return r.mul(r,i,i).negate().exp().oneMinus()}),_(([r,t])=>H(t.toFloat().mix(ji.rgb,r.toVec3()),ji.a));class lu extends L{constructor(t){super(),this.scope=t,this.isBarrierNode=!0}setup(t){t.allowEarlyReturns=!1,t.allowGlobalVariables=!1}generate(t){const{scope:e}=this,{renderer:s}=t;s.backend.isWebGLBackend===!0?t.addFlowCode(`	// ${e}Barrier \n`):t.addLineFlowCode(`${e}Barrier()`,this)}}rt(lu);class kt extends L{static get type(){return"AtomicFunctionNode"}constructor(t,e,s){super("uint"),this.method=t,this.pointerNode=e,this.valueNode=s,this.parents=!0}getInputType(t){return this.pointerNode.getNodeType(t)}generateNodeType(t){return this.getInputType(t)}generate(t){const e=t.getNodeProperties(this),s=e.parents,n=this.method,i=this.getNodeType(t),o=this.getInputType(t),a=this.pointerNode,l=this.valueNode,h=[];h.push(`&${a.build(t,o)}`),l!==null&&h.push(l.build(t,o));const c=`${t.getMethod(n,i)}( ${h.join(", ")} )`;if(s?s.length===1&&s[0].isStackNode===!0:!1)t.addLineFlowCode(c,this);else return e.constNode===void 0&&(e.constNode=Ht(c,i).toConst()),e.constNode.build(t)}}kt.ATOMIC_LOAD="atomicLoad",kt.ATOMIC_STORE="atomicStore",kt.ATOMIC_ADD="atomicAdd",kt.ATOMIC_SUB="atomicSub",kt.ATOMIC_MAX="atomicMax",kt.ATOMIC_MIN="atomicMin",kt.ATOMIC_AND="atomicAnd",kt.ATOMIC_OR="atomicOr",kt.ATOMIC_XOR="atomicXor",rt(kt);class V extends at{static get type(){return"SubgroupFunctionNode"}constructor(t,e=null,s=null){super(),this.method=t,this.aNode=e,this.bNode=s}getInputType(t){const e=this.aNode?this.aNode.getNodeType(t):null,s=this.bNode?this.bNode.getNodeType(t):null,n=t.isMatrix(e)?0:t.getTypeLength(e),i=t.isMatrix(s)?0:t.getTypeLength(s);return n>i?e:s}generateNodeType(t){const e=this.method;return e===V.SUBGROUP_ELECT?"bool":e===V.SUBGROUP_BALLOT?"uvec4":this.getInputType(t)}generate(t,e){const s=this.method,n=this.getNodeType(t),i=this.getInputType(t),o=this.aNode,a=this.bNode,l=[];if(s===V.SUBGROUP_BROADCAST||s===V.SUBGROUP_SHUFFLE||s===V.QUAD_BROADCAST){const c=a.getNodeType(t);l.push(o.build(t,n),a.build(t,c==="float"?"int":n))}else s===V.SUBGROUP_SHUFFLE_XOR||s===V.SUBGROUP_SHUFFLE_DOWN||s===V.SUBGROUP_SHUFFLE_UP?l.push(o.build(t,n),a.build(t,"uint")):(o!==null&&l.push(o.build(t,i)),a!==null&&l.push(a.build(t,i)));const h=l.length===0?"()":`( ${l.join(", ")} )`;return t.format(`${t.getMethod(s,n)}${h}`,n,e)}serialize(t){super.serialize(t),t.method=this.method}deserialize(t){super.deserialize(t),this.method=t.method}}V.SUBGROUP_ELECT="subgroupElect",V.SUBGROUP_BALLOT="subgroupBallot",V.SUBGROUP_ADD="subgroupAdd",V.SUBGROUP_INCLUSIVE_ADD="subgroupInclusiveAdd",V.SUBGROUP_EXCLUSIVE_AND="subgroupExclusiveAdd",V.SUBGROUP_MUL="subgroupMul",V.SUBGROUP_INCLUSIVE_MUL="subgroupInclusiveMul",V.SUBGROUP_EXCLUSIVE_MUL="subgroupExclusiveMul",V.SUBGROUP_AND="subgroupAnd",V.SUBGROUP_OR="subgroupOr",V.SUBGROUP_XOR="subgroupXor",V.SUBGROUP_MIN="subgroupMin",V.SUBGROUP_MAX="subgroupMax",V.SUBGROUP_ALL="subgroupAll",V.SUBGROUP_ANY="subgroupAny",V.SUBGROUP_BROADCAST_FIRST="subgroupBroadcastFirst",V.QUAD_SWAP_X="quadSwapX",V.QUAD_SWAP_Y="quadSwapY",V.QUAD_SWAP_DIAGONAL="quadSwapDiagonal",V.SUBGROUP_BROADCAST="subgroupBroadcast",V.SUBGROUP_SHUFFLE="subgroupShuffle",V.SUBGROUP_SHUFFLE_XOR="subgroupShuffleXor",V.SUBGROUP_SHUFFLE_UP="subgroupShuffleUp",V.SUBGROUP_SHUFFLE_DOWN="subgroupShuffleDown",V.QUAD_BROADCAST="quadBroadcast",de("vec3","totalDiffuse"),de("vec3","totalSpecular"),de("vec3","outgoingLight"),_(([r=Le()],{renderer:t,material:e})=>{const s=nr(r.mul(2).sub(1));let n;if(e.alphaToCoverage&&t.currentSamples>0){const i=B(s.fwidth()).toVar();n=pe(i.oneMinus(),i.add(1),s).oneMinus()}else n=An(s.greaterThan(1),0,1);return n}),new tt("uint tsl_bitcast_int_to_uint ( int x ) { return floatBitsToUint( intBitsToFloat ( x ) ); }"),new tt("uint tsl_bitcast_uint_to_int ( uint x ) { return floatBitsToInt( uintBitsToFloat ( x ) ); }"),new tt(`\nvec4 tsl_textureGather( const int comp, sampler2D map, vec2 coord, ivec2 offset, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ) );\n	vec2 st = floor( coord * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, ij.xw, 0.0 )[ comp ],\n		textureLod( map, ij.zw, 0.0 )[ comp ],\n		textureLod( map, ij.zy, 0.0 )[ comp ],\n		textureLod( map, ij.xy, 0.0 )[ comp ]\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new tt(`\nvec4 tsl_textureGather_array( const int comp, sampler2DArray map, vec3 coord, ivec2 offset, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ).xy );\n	vec2 st = floor( coord.xy * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, vec3( ij.xw, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.zw, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.zy, coord.z ), 0.0 )[ comp ],\n		textureLod( map, vec3( ij.xy, coord.z ), 0.0 )[ comp ]\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new tt(`\nvec4 tsl_textureGatherCompare( sampler2DShadow map, vec2 coord, ivec2 offset, float ref, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ) );\n	vec2 st = floor( coord * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		textureLod( map, vec3( ij.xw, ref ), 0.0 ),\n		textureLod( map, vec3( ij.zw, ref ), 0.0 ),\n		textureLod( map, vec3( ij.zy, ref ), 0.0 ),\n		textureLod( map, vec3( ij.xy, ref ), 0.0 )\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`),new tt(`\nvec4 tsl_textureGatherCompare_array( sampler2DArrayShadow map, vec3 coord, ivec2 offset, float ref, bool flipY ) {\n	if ( flipY ) offset.y = - offset.y;\n	vec2 size = vec2( textureSize( map, 0 ).xy );\n	vec2 st = floor( coord.xy * size + vec2( offset ) - 0.5 );\n	vec4 ij = vec4( st + 0.5, st + 1.5 ) / size.xyxy;\n	vec4 ret = vec4(\n		texture( map, vec4( ij.xw, coord.z, ref ) ),\n		texture( map, vec4( ij.zw, coord.z, ref ) ),\n		texture( map, vec4( ij.zy, coord.z, ref ) ),\n		texture( map, vec4( ij.xy, coord.z, ref ) )\n	);\n	return flipY ? ret.wzyx : ret;\n}\n`);const Yn=typeof self<"u"&&self.GPUShaderStage?self.GPUShaderStage:{VERTEX:1,FRAGMENT:2,COMPUTE:4};class hu{constructor(){this.texture=null,this.mipLevel=0,this.origin={x:0,y:0,z:0},this.aspect="all"}reset(){this.texture=null,this.mipLevel=0,this.origin.x=0,this.origin.y=0,this.origin.z=0,this.aspect="all"}}class cu extends hu{constructor(){super(),this.colorSpace="srgb",this.premultipliedAlpha=!1}reset(){super.reset(),this.colorSpace="srgb",this.premultipliedAlpha=!1}}new cu,dn.READ_ONLY+"",dn.WRITE_ONLY+"",dn.READ_WRITE+"",Yn.VERTEX,Yn.FRAGMENT,Yn.COMPUTE,new tt("fn tsl_xor( a : bool, b : bool ) -> bool { return ( a || b ) && !( a && b ); }"),new tt("fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }"),new tt("fn tsl_mod_vec2( x : vec2f, y : vec2f ) -> vec2f { return x - y * floor( x / y ); }"),new tt("fn tsl_mod_vec3( x : vec3f, y : vec3f ) -> vec3f { return x - y * floor( x / y ); }"),new tt("fn tsl_mod_vec4( x : vec4f, y : vec4f ) -> vec4f { return x - y * floor( x / y ); }"),new tt("fn tsl_equals_bool( a : bool, b : bool ) -> bool { return a == b; }"),new tt("fn tsl_equals_bvec2( a : vec2f, b : vec2f ) -> vec2<bool> { return vec2<bool>( a.x == b.x, a.y == b.y ); }"),new tt("fn tsl_equals_bvec3( a : vec3f, b : vec3f ) -> vec3<bool> { return vec3<bool>( a.x == b.x, a.y == b.y, a.z == b.z ); }"),new tt("fn tsl_equals_bvec4( a : vec4f, b : vec4f ) -> vec4<bool> { return vec4<bool>( a.x == b.x, a.y == b.y, a.z == b.z, a.w == b.w ); }"),new tt("fn tsl_repeatWrapping_float( coord: f32 ) -> f32 { return fract( coord ); }"),new tt("fn tsl_mirrorWrapping_float( coord: f32 ) -> f32 { let mirrored = fract( coord * 0.5 ) * 2.0; return 1.0 - abs( 1.0 - mirrored ); }"),new tt("fn tsl_clampWrapping_float( coord: f32 ) -> f32 { return clamp( coord, 0.0, 1.0 ); }"),new tt(`\nfn tsl_inverse_mat2( m : mat2x2<f32> ) -> mat2x2<f32> {\n\n	let det = m[ 0 ][ 0 ] * m[ 1 ][ 1 ] - m[ 0 ][ 1 ] * m[ 1 ][ 0 ];\n\n	return mat2x2<f32>(\n		m[ 1 ][ 1 ], - m[ 0 ][ 1 ],\n		- m[ 1 ][ 0 ], m[ 0 ][ 0 ]\n	) * ( 1.0 / det );\n\n}\n`),new tt(`\nfn tsl_inverse_mat3( m : mat3x3<f32> ) -> mat3x3<f32> {\n\n	let a00 = m[ 0 ][ 0 ]; let a01 = m[ 0 ][ 1 ]; let a02 = m[ 0 ][ 2 ];\n	let a10 = m[ 1 ][ 0 ]; let a11 = m[ 1 ][ 1 ]; let a12 = m[ 1 ][ 2 ];\n	let a20 = m[ 2 ][ 0 ]; let a21 = m[ 2 ][ 1 ]; let a22 = m[ 2 ][ 2 ];\n\n	let b01 = a22 * a11 - a12 * a21;\n	let b11 = - a22 * a10 + a12 * a20;\n	let b21 = a21 * a10 - a11 * a20;\n\n	let det = a00 * b01 + a01 * b11 + a02 * b21;\n\n	return mat3x3<f32>(\n		b01, ( - a22 * a01 + a02 * a21 ), ( a12 * a01 - a02 * a11 ),\n		b11, ( a22 * a00 - a02 * a20 ), ( - a12 * a00 + a02 * a10 ),\n		b21, ( - a21 * a00 + a01 * a20 ), ( a11 * a00 - a01 * a10 )\n	) * ( 1.0 / det );\n\n}\n`),new tt(`\nfn tsl_inverse_mat4( m : mat4x4<f32> ) -> mat4x4<f32> {\n\n	let a00 = m[ 0 ][ 0 ]; let a01 = m[ 0 ][ 1 ]; let a02 = m[ 0 ][ 2 ]; let a03 = m[ 0 ][ 3 ];\n	let a10 = m[ 1 ][ 0 ]; let a11 = m[ 1 ][ 1 ]; let a12 = m[ 1 ][ 2 ]; let a13 = m[ 1 ][ 3 ];\n	let a20 = m[ 2 ][ 0 ]; let a21 = m[ 2 ][ 1 ]; let a22 = m[ 2 ][ 2 ]; let a23 = m[ 2 ][ 3 ];\n	let a30 = m[ 3 ][ 0 ]; let a31 = m[ 3 ][ 1 ]; let a32 = m[ 3 ][ 2 ]; let a33 = m[ 3 ][ 3 ];\n\n	let b00 = a00 * a11 - a01 * a10;\n	let b01 = a00 * a12 - a02 * a10;\n	let b02 = a00 * a13 - a03 * a10;\n	let b03 = a01 * a12 - a02 * a11;\n	let b04 = a01 * a13 - a03 * a11;\n	let b05 = a02 * a13 - a03 * a12;\n	let b06 = a20 * a31 - a21 * a30;\n	let b07 = a20 * a32 - a22 * a30;\n	let b08 = a20 * a33 - a23 * a30;\n	let b09 = a21 * a32 - a22 * a31;\n	let b10 = a21 * a33 - a23 * a31;\n	let b11 = a22 * a33 - a23 * a32;\n\n	let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n\n	return mat4x4<f32>(\n		a11 * b11 - a12 * b10 + a13 * b09,\n		a02 * b10 - a01 * b11 - a03 * b09,\n		a31 * b05 - a32 * b04 + a33 * b03,\n		a22 * b04 - a21 * b05 - a23 * b03,\n		a12 * b08 - a10 * b11 - a13 * b07,\n		a00 * b11 - a02 * b08 + a03 * b07,\n		a32 * b02 - a30 * b05 - a33 * b01,\n		a20 * b05 - a22 * b02 + a23 * b01,\n		a10 * b10 - a11 * b08 + a13 * b06,\n		a01 * b08 - a00 * b10 - a03 * b06,\n		a30 * b04 - a31 * b02 + a33 * b00,\n		a21 * b02 - a20 * b04 - a23 * b00,\n		a11 * b07 - a10 * b09 - a12 * b06,\n		a00 * b09 - a01 * b07 + a02 * b06,\n		a31 * b01 - a30 * b03 - a32 * b00,\n		a20 * b03 - a21 * b01 + a22 * b00\n	) * ( 1.0 / det );\n\n}\n`),new tt(`\nfn tsl_biquadraticTexture( map : texture_2d<f32>, coord : vec2f, iRes : vec2u, level : u32 ) -> vec4f {\n\n	let res = vec2f( iRes );\n\n	let uvScaled = coord * res;\n	let uvWrapping = ( ( uvScaled % res ) + res ) % res;\n\n	// https://www.shadertoy.com/view/WtyXRy\n\n	let uv = uvWrapping - 0.5;\n	let iuv = floor( uv );\n	let f = fract( uv );\n\n	let rg1 = textureLoad( map, vec2u( iuv + vec2( 0.5, 0.5 ) ) % iRes, level );\n	let rg2 = textureLoad( map, vec2u( iuv + vec2( 1.5, 0.5 ) ) % iRes, level );\n	let rg3 = textureLoad( map, vec2u( iuv + vec2( 0.5, 1.5 ) ) % iRes, level );\n	let rg4 = textureLoad( map, vec2u( iuv + vec2( 1.5, 1.5 ) ) % iRes, level );\n\n	return mix( mix( rg1, rg2, f.x ), mix( rg3, rg4, f.x ), f.y );\n\n}\n`),new tt(`\nfn tsl_biquadraticTexture_array( map : texture_2d_array<f32>, coord : vec2f, iRes : vec2u, layer : u32, level : u32 ) -> vec4f {\n\n	let res = vec2f( iRes );\n\n	let uvScaled = coord * res;\n	let uvWrapping = ( ( uvScaled % res ) + res ) % res;\n\n	// https://www.shadertoy.com/view/WtyXRy\n\n	let uv = uvWrapping - 0.5;\n	let iuv = floor( uv );\n	let f = fract( uv );\n\n	let rg1 = textureLoad( map, vec2u( iuv + vec2( 0.5, 0.5 ) ) % iRes, layer, level );\n	let rg2 = textureLoad( map, vec2u( iuv + vec2( 1.5, 0.5 ) ) % iRes, layer, level );\n	let rg3 = textureLoad( map, vec2u( iuv + vec2( 0.5, 1.5 ) ) % iRes, layer, level );\n	let rg4 = textureLoad( map, vec2u( iuv + vec2( 1.5, 1.5 ) ) % iRes, layer, level );\n\n	return mix( mix( rg1, rg2, f.x ), mix( rg3, rg4, f.x ), f.y );\n\n}\n`),typeof Float16Array<"u"&&new Map([[Int8Array,["sint8","snorm8"]],[Uint8Array,["uint8","unorm8"]],[Int16Array,["sint16","snorm16"]],[Uint16Array,["uint16","unorm16"]],[Int32Array,["sint32","snorm32"]],[Uint32Array,["uint32","unorm32"]],[Float32Array,["float32"]]]).set(Float16Array,["float16"]);class Yr{count;shDegree;shCoefficientCount;shFormat;means;scalesOpacity;rotations;shCoefficients;ownsBuffers;disposed=!1;constructor(t,e){if(!Number.isInteger(e.count)||e.count<=0)throw new RangeError("GaussianData count must be a positive integer");const s=e.shDegree??0;if(!Number.isInteger(s)||s<0||s>3)throw new RangeError("GaussianData shDegree must be 0, 1, 2, or 3");if(this.count=e.count,this.shDegree=s,this.shCoefficientCount=(s+1)**2,this.shFormat=e.shFormat??"float32",this.shFormat!=="float32"&&this.shFormat!=="rgb8e8")throw new RangeError("GaussianData shFormat must be float32 or rgb8e8");this.means=t.means,this.scalesOpacity=t.scalesOpacity,this.rotations=t.rotations,this.shCoefficients=t.shCoefficients,this.ownsBuffers=e.ownsBuffers??!1,this.validateVec4Attribute(this.means,"means",this.count),this.validateVec4Attribute(this.scalesOpacity,"scalesOpacity",this.count),this.validateVec4Attribute(this.rotations,"rotations",this.count),this.validateShAttribute(this.shCoefficients,this.count*this.shCoefficientCount)}dispose(){this.disposed||(this.disposed=!0,this.ownsBuffers&&(this.means.dispose(),this.scalesOpacity.dispose(),this.rotations.dispose(),this.shCoefficients.dispose()))}validateVec4Attribute(t,e,s){if(t.isStorageBufferAttribute!==!0)throw new TypeError(`GaussianData ${e} must be a Three.js StorageBufferAttribute`);if(t.itemSize!==4)throw new RangeError(`GaussianData ${e} itemSize is ${t.itemSize}; vec4 data requires itemSize 4`);if(!(t.array instanceof Float32Array))throw new TypeError(`GaussianData ${e} must use Float32Array storage`);if(t.count<s)throw new RangeError(`GaussianData ${e} has ${t.count} items; at least ${s} are required`)}validateShAttribute(t,e){if(t.isStorageBufferAttribute!==!0)throw new TypeError("GaussianData shCoefficients must be a Three.js StorageBufferAttribute");const s=this.shFormat==="rgb8e8"?1:4;if(t.itemSize!==s)throw new RangeError(`GaussianData ${this.shFormat} shCoefficients itemSize is ${t.itemSize}; expected ${s}`);if(!(this.shFormat==="rgb8e8"?t.array instanceof Uint32Array:t.array instanceof Float32Array))throw new TypeError(`GaussianData ${this.shFormat} shCoefficients use the wrong typed array`);if(t.count<e)throw new RangeError(`GaussianData shCoefficients has ${t.count} items; at least ${e} are required`)}}const Xr={char:1,uchar:1,short:2,ushort:2,int:4,uint:4,float:4,double:8,int8:1,uint8:1,int16:2,uint16:2,int32:4,uint32:4,float32:4,float64:8},uu=["x","y","z","scale_0","scale_1","scale_2","rot_0","rot_1","rot_2","rot_3","opacity","f_dc_0","f_dc_1","f_dc_2"];class Xn{async load(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load PLY: ${e.status} ${e.statusText}`);if(e.headers.get("content-type")?.includes("text/html"))throw new Error(`Failed to load PLY: ${e.url||t} returned HTML instead of a PLY file`);return this.parse(await e.arrayBuffer())}parse(t){const e=du(t),s=new Map(e.properties.map((y,w)=>[y.name,w]));for(const y of uu)if(!s.has(y))throw new Error(`Not a canonical 3DGS PLY: missing property ${y}`);const n=e.properties.map(y=>y.name.match(/^f_rest_(\\d+)$/)?.[1]).filter(y=>y!==void 0).map(Number).sort((y,w)=>y-w);for(let y=0;y<n.length;y++)if(n[y]!==y)throw new Error("f_rest_* properties must be contiguous from f_rest_0");if(n.length%3!==0)throw new Error("f_rest_* property count must be divisible by three");const i=n.length/3,o=i+1,a=Math.sqrt(o);if(!Number.isInteger(a)||a<1||a>4)throw new Error("PLY must contain one, four, nine, or sixteen SH coefficients per channel");const l=pu(t,e),h=y=>s.get(y),c=n.map(y=>h(`f_rest_${y}`)),u=e.vertexCount,d=new Float32Array(u*4),p=new Float32Array(u*4),f=new Float32Array(u*4),m=new Float32Array(u*o*4);for(let y=0;y<u;y++){const w=y*4;d[w]=l(y,h("x")),d[w+1]=l(y,h("y")),d[w+2]=l(y,h("z")),p[w]=Math.max(Math.exp(l(y,h("scale_0"))),1e-6),p[w+1]=Math.max(Math.exp(l(y,h("scale_1"))),1e-6),p[w+2]=Math.max(Math.exp(l(y,h("scale_2"))),1e-6);const M=l(y,h("opacity"));p[w+3]=1/(1+Math.exp(-M));const C=l(y,h("rot_0")),b=l(y,h("rot_1")),S=l(y,h("rot_2")),R=l(y,h("rot_3")),I=Math.hypot(b,S,R,C);I>1e-12?(f[w]=b/I,f[w+1]=S/I,f[w+2]=R/I,f[w+3]=C/I):f[w+3]=1;const D=y*o*4;m[D]=l(y,h("f_dc_0")),m[D+1]=l(y,h("f_dc_1")),m[D+2]=l(y,h("f_dc_2"));for(let z=1;z<o;z++){const U=D+z*4,Y=z-1;for(let G=0;G<3;G++){const $=c[G*i+Y];m[U+G]=l(y,$)}}}return new Yr({means:Ds("ply.means",d),scalesOpacity:Ds("ply.scales-opacity",p),rotations:Ds("ply.rotations-xyzw",f),shCoefficients:Ds("ply.sh-coefficients",m)},{count:u,shDegree:a-1,ownsBuffers:!0})}}function Ds(r,t){const e=new Hn(t,4);return e.name=r,e}function du(r){const t=new Uint8Array(r),e=new TextEncoder().encode("end_header");let s=-1;for(let f=0;f<=t.length-e.length;f++){let m=!0;for(let y=0;y<e.length;y++)if(t[f+y]!==e[y]){m=!1;break}if(m){s=f;break}}if(s<0)throw new Error("Invalid PLY: end_header is missing");let n=s+e.length;if(t[n]===13&&n++,t[n]!==10)throw new Error("Invalid PLY: end_header must terminate a line");n++;const o=new TextDecoder().decode(t.subarray(0,n)).split(/\\r?\\n/);if(o[0]?.trim()!=="ply")throw new Error("Invalid PLY signature");let a=null,l="",h=-1,c=0;const u=[],d=[];for(const f of o){const m=f.trim().split(/\\s+/);if(m[0]==="format"){if(m[1]!=="ascii"&&m[1]!=="binary_little_endian"&&m[1]!=="binary_big_endian")throw new Error(`Unsupported PLY format: ${m[1]??"unknown"}`);a=m[1]}else if(m[0]==="element"){l=m[1]??"";const y=Number(m[2]);if(!Number.isInteger(y)||y<0)throw new Error(`Invalid element count for ${l}`);d.push({name:l,count:y}),l==="vertex"&&(h=y)}else if(m[0]==="property"&&l==="vertex"){if(m[1]==="list")throw new Error("List properties are not supported in the vertex element");const y=m[1],w=m[2];if(!(y in Xr)||w===void 0)throw new Error(`Unsupported vertex property: ${f}`);u.push({name:w,type:y,byteOffset:c}),c+=Xr[y]}}if(a===null)throw new Error("Invalid PLY: format is missing");if(h<=0)throw new Error("PLY must contain at least one vertex");if(d.find(f=>f.count>0)?.name!=="vertex")throw new Error("The canonical 3DGS vertex element must be first");return{format:a,vertexCount:h,properties:u,vertexStride:c,dataOffset:n}}function pu(r,t){if(t.format==="ascii"){const i=new TextDecoder().decode(new Uint8Array(r,t.dataOffset)),o=new Float64Array(t.vertexCount*t.properties.length);let a=0;for(let l=0;l<o.length;l++){for(;a<i.length&&/\\s/.test(i[a]);)a++;const h=a;for(;a<i.length&&!/\\s/.test(i[a]);)a++;const c=Number(i.slice(h,a));if(!Number.isFinite(c))throw new Error(`Invalid ASCII PLY value at scalar ${l}`);o[l]=c}return(l,h)=>o[l*t.properties.length+h]}if(t.dataOffset+t.vertexCount*t.vertexStride>r.byteLength)throw new Error("Binary PLY ends before the vertex data is complete");const s=new DataView(r),n=t.format==="binary_little_endian";return(i,o)=>{const a=t.properties[o],l=t.dataOffset+i*t.vertexStride+a.byteOffset;return fu(s,l,a.type,n)}}function fu(r,t,e,s){switch(e){case"char":case"int8":return r.getInt8(t);case"uchar":case"uint8":return r.getUint8(t);case"short":case"int16":return r.getInt16(t,s);case"ushort":case"uint16":return r.getUint16(t,s);case"int":case"int32":return r.getInt32(t,s);case"uint":case"uint32":return r.getUint32(t,s);case"float":case"float32":return r.getFloat32(t,s);case"double":case"float64":return r.getFloat64(t,s)}}const Zr=1/255,gu=.99,Zn=1e-12;function mu(r,t,e,s){if(!(s>0&&s<1))throw new RangeError("Gaussian raycast alphaThreshold must be between 0 and 1");const n=t.means.array,i=t.scalesOpacity.array,o=t.rotations.array,a=new T,l=new T,h=new T,c=new le;let u=1;for(const d of e){const p=d.gaussianIndex*4,f=Math.min(1,Math.max(0,i[p+3]));if(f<Zr)continue;c.set(-o[p],-o[p+1],-o[p+2],o[p+3]).normalize(),a.set(r.origin.x-n[p],r.origin.y-n[p+1],r.origin.z-n[p+2]).applyQuaternion(c),l.copy(r.direction).applyQuaternion(c);const m=Math.max(i[p],Zn),y=Math.max(i[p+1],Zn),w=Math.max(i[p+2],Zn);a.set(a.x/m,a.y/y,a.z/w),l.set(l.x/m,l.y/y,l.z/w);const M=l.lengthSq();if(M<=Number.EPSILON)continue;const C=Math.max(0,-a.dot(l)/M);h.copy(a).addScaledVector(l,C);const b=Math.min(gu,f*Math.exp(-.5*h.lengthSq()));if(b<Zr||(u*=1-b,1-u<s))continue;const S=r.at(C,new T);return{gaussianIndex:d.gaussianIndex,distance:r.origin.distanceTo(S),point:S}}return null}class yu{constructor(t,e,s,n,i,o,a,l){this.id=t,this.depth=e,this.bounds=s,this.count=n,this.maxSplatRadius=i,this.raycastBounds=l,this.children=o,this.gaussianIndices=a}id;depth;bounds;count;maxSplatRadius;raycastBounds;children;gaussianIndices;get isLeaf(){return this.children.length===0}}class ns{constructor(t,e,s,n){this.data=t,this.leafCapacity=e,this.maxDepth=s,this.ownsData=n,this.bounds=xu(t),this.rootBounds=wu(this.bounds);const i=t.means.array,o=t.scalesOpacity.array,a=[],l=[],h=Array.from({length:t.count},(u,d)=>d),c=(u,d,p)=>{const f=a.length;a.push(null);const m=u.length>e&&p<s&&d.max.x-d.min.x>Number.EPSILON,y=[];if(m){const C=d.getCenter(new T),b=Array.from({length:8},()=>[]);for(const S of u){const R=S*4,I=(i[R]>=C.x?1:0)|(i[R+1]>=C.y?2:0)|(i[R+2]>=C.z?4:0);b[I].push(S)}for(let S=0;S<8;S++){const R=b[S];R.length!==0&&y.push(c(R,Nu(d,C,S),p+1))}}let w=0;if(y.length>0)for(const C of y)w=Math.max(w,a[C].maxSplatRadius);else{for(const C of u){const b=C*4;w=Math.max(w,o[b],o[b+1],o[b+2])}l.push(f)}const M=d.clone().expandByScalar(w*3);return a[f]=new yu(f,p,d,u.length,w,y,y.length===0?Uint32Array.from(u):null,M),f};c(h,this.rootBounds.clone(),0),this.nodes=a,this.leafNodeIds=Uint32Array.from(l)}data;leafCapacity;maxDepth;static build(t,e={}){const s=e.leafCapacity??256,n=e.maxDepth??10;if(!Number.isInteger(s)||s<=0)throw new RangeError("GaussianOctree leafCapacity must be positive");if(!Number.isInteger(n)||n<0)throw new RangeError("GaussianOctree maxDepth must be non-negative");return new ns(t,s,n,e.ownsData??!1)}bounds;rootBounds;rootNode=0;nodes;leafNodeIds;ownsData;disposed=!1;raycast(t,e={}){this.assertUsable();const s=e.radiusScale??3;if(!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const n=e.maxHits??1/0;if(!(n>0))return[];const i=[],o=[this.rootNode];for(;o.length>0;){const a=this.nodes[o.pop()],l=Math.max(0,s-3)*a.maxSplatRadius,h=l===0?a.raycastBounds:a.raycastBounds.clone().expandByScalar(l);if(t.intersectsBox(h))if(a.gaussianIndices!==null)for(const c of a.gaussianIndices)i.push(c);else for(const c of a.children)o.push(c)}return this.raycastIndices(t,i,s,n)}raycastIndices(t,e,s=3,n=1/0){if(this.assertUsable(),!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");if(!(n>0))return[];const i=this.data.means.array,o=this.data.scalesOpacity.array,a=new T,l=new T,h=[];for(let c=0;c<e.length;c++){const u=e[c],d=u*4;a.set(i[d],i[d+1],i[d+2]);const p=Math.max(o[d],o[d+1],o[d+2])*s;t.closestPointToPoint(a,l),!(l.distanceToSquared(a)>p*p)&&h.push({gaussianIndex:u,distance:t.origin.distanceTo(l),point:l.clone()})}return h.sort((c,u)=>c.distance-u.distance),h.length>n&&(h.length=n),h}dispose(){this.disposed||(this.disposed=!0,this.ownsData&&this.data.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianOctree has been disposed")}}function xu(r){const t=r.means.array,e=new ke,s=new T;for(let n=0;n<r.count;n++){const i=n*4;s.set(t[i],t[i+1],t[i+2]),e.expandByPoint(s)}return e}function wu(r){const t=r.getCenter(new T),e=r.getSize(new T),s=Math.max(e.x,e.y,e.z,1e-6)*.5;return new ke(new T(t.x-s,t.y-s,t.z-s),new T(t.x+s,t.y+s,t.z+s))}function Nu(r,t,e){return new ke(new T(e&1?t.x:r.min.x,e&2?t.y:r.min.y,e&4?t.z:r.min.z),new T(e&1?r.max.x:t.x,e&2?r.max.y:t.y,e&4?r.max.z:t.z))}class Jr extends Gt{isGaussianCloud=!0;objectId;lod;raycastMode="rendered";raycastAlphaThreshold=.5;ownerStore;packing;packedGaussianCount;priority;raycastIndex=null;constructor(t,e,s,n="GaussianCloud",i=null,o=null,a=0){super(),this.ownerStore=t,this.objectId=e,this.packedGaussianCount=s,this.lod=i,this.packing=o,this.priority=a,this.name=n}get lodPacking(){return this.packing}get gaussianCount(){return this.packedGaussianCount}get packingPriority(){return this.priority}set packingPriority(t){this.ownerStore.updatePackingPriority(this,t)}invalidatePacking(){this.ownerStore.invalidateCloudPacking(this)}updatePacking(t,e){this.packing=e,this.packedGaussianCount=t}updatePackingPriority(t){this.priority=t}setRaycastIndex(t){this.raycastIndex=t}raycast(t,e){if(this.raycastIndex===null&&(this.lod===null||this.packing===null))return;const s=new ot().copy(this.matrixWorld).invert(),n=new Zo().copy(t.ray).applyMatrix4(s),i=this.raycastIndex!==null?this.raycastIndex.raycast(n,"full",this.raycastAlphaThreshold):mu(n,this.lod.octree.data,this.raycastMode==="full"?this.lod.octree.raycast(n):this.lod.raycast(n,this.packing),this.raycastAlphaThreshold);if(i!==null){const o=i.point.clone().applyMatrix4(this.matrixWorld),a=t.ray.origin.distanceTo(o);a>=t.near&&a<=t.far&&e.push({distance:a,point:o,object:this,index:i.gaussianIndex})}}dispose(){this.ownerStore.remove(this)}}const Tu=16,Qr=4;function Su(r,t,e){const s=Math.max(Math.abs(r),Math.abs(t),Math.abs(e));if(!Number.isFinite(s))throw new RangeError("SH coefficients must be finite");if(s===0)return 0;const n=Math.min(127,Math.max(-126,Math.ceil(Math.log2(s)))),i=127/2**n,o=Jn(r,i),a=Jn(t,i),l=Jn(e,i),h=n+127;return(o|a<<8|l<<16|h<<24)>>>0}function Kr(r){return r==="rgb8e8"?Qr:Tu}function Jn(r,t){return Math.min(127,Math.max(-127,Math.round(r*t)))&255}class to{constructor(t,e,s){this.octreeNodeId=t,this.sortedGaussianIndices=e,this.levelCounts=s}octreeNodeId;sortedGaussianIndices;levelCounts}const vu=[{retention:.2},{retention:.5},{retention:1}];class is{constructor(t,e){this.octree=t,this.levels=Mu(e.levels??vu),this.ownsOctree=e.ownsOctree??!1;const s=e.importance??Cu,n=new Float64Array(t.data.count);for(let i=0;i<n.length;i++){const o=s(i,t);n[i]=Number.isFinite(o)?o:-1/0}this.nodes=t.nodes.map(i=>{if(i.gaussianIndices===null)return new to(i.id,new Uint32Array,new Uint32Array(this.levels.length));const o=Uint32Array.from(Array.from(i.gaussianIndices).sort((a,l)=>n[l]-n[a]||a-l));return new to(i.id,o,Uint32Array.from(this.levels.map(({retention:a})=>Math.min(o.length,Math.max(1,Math.ceil(o.length*a))))))})}octree;static build(t,e={}){return new is(t,e)}levels;nodes;ownsOctree;disposed=!1;get levelCount(){return this.levels.length}get finestLevel(){return this.levels.length-1}getNode(t){this.assertUsable();const e=this.nodes[t];if(e===void 0)throw new RangeError(`GaussianLod node ${t} does not exist`);return e}indicesForPacking(t){if(this.assertUsable(),t.nodeIds.length!==t.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const e=new Uint32Array(t.gaussianCount),s=new Set;let n=0;for(let i=0;i<t.nodeIds.length;i++){const o=t.nodeIds[i],a=this.getLeafNode(o);if(s.has(o))throw new Error(`GaussianLodPacking contains duplicate leaf node ${o}`);s.add(o);const l=t.lodLevels[i],h=a.levelCounts[l];if(h===void 0)throw new RangeError(`GaussianLod level ${l} does not exist`);if(n+h>e.length)throw new RangeError("GaussianLodPacking gaussianCount is too small");for(let c=0;c<h;c++)e[n++]=a.sortedGaussianIndices[c]}if(n!==e.length)throw new RangeError(`GaussianLodPacking declares ${e.length} Gaussians but selects ${n}`);return e}raycast(t,e,s={}){this.assertUsable();const n=s.radiusScale??3;if(!(n>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const i=s.maxHits??1/0;if(!(i>0))return[];if(e.nodeIds.length!==e.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const o=this.octree.data.means.array,a=this.octree.data.scalesOpacity.array,l=new T,h=new T,c=[],u=new Set;for(let d=0;d<e.nodeIds.length;d++){const p=e.nodeIds[d],f=this.getLeafNode(p);if(u.has(p))throw new Error(`GaussianLodPacking contains duplicate leaf node ${p}`);u.add(p);const m=e.lodLevels[d],y=f.levelCounts[m];if(y===void 0)throw new RangeError(`GaussianLod level ${m} does not exist`);const w=this.octree.nodes[p],M=Math.max(0,n-3)*w.maxSplatRadius,C=M===0?w.raycastBounds:w.raycastBounds.clone().expandByScalar(M);if(t.intersectsBox(C))for(let b=0;b<y;b++){const S=f.sortedGaussianIndices[b],R=S*4;l.set(o[R],o[R+1],o[R+2]);const I=Math.max(a[R],a[R+1],a[R+2])*n;t.closestPointToPoint(l,h),!(h.distanceToSquared(l)>I*I)&&c.push({gaussianIndex:S,distance:t.origin.distanceTo(h),point:h.clone()})}}return c.sort((d,p)=>d.distance-p.distance),c.length>i&&(c.length=i),c}dispose(){this.disposed||(this.disposed=!0,this.ownsOctree&&this.octree.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianLod has been disposed")}getLeafNode(t){const e=this.getNode(t);if(this.octree.nodes[t]?.isLeaf!==!0)throw new Error(`GaussianLodPacking must reference leaf nodes; node ${t} is internal`);return e}}function Mu(r){if(r.length===0||r.length>256)throw new RangeError("GaussianLod requires between 1 and 256 levels");let t=0;const e=r.map(({retention:s})=>{if(!(s>t&&s<=1))throw new RangeError("GaussianLod retention values must increase and stay in (0, 1]");return t=s,Object.freeze({retention:s})});if(Math.abs(t-1)>Number.EPSILON)throw new RangeError("GaussianLod finest retention must be 1");return Object.freeze(e)}function Cu(r,t){const e=t.data.scalesOpacity.array,s=r*4,n=[e[s],e[s+1],e[s+2]];return n.sort((i,o)=>o-i),e[s+3]*n[0]*n[1]}function Qn(r){if(!Number.isInteger(r)||r<0)throw new RangeError("Gaussian LOD budget must be a non-negative integer")}function bu(r,t,e){return r.updateWorldMatrix(!0,!1),t.updateWorldMatrix(!0,!1),r.getWorldPosition(e),t.worldToLocal(e)}function Eu(r,t){const e=t instanceof T?t.clone():r.octree.bounds.getCenter(new T),s=r.octree.rootBounds.getSize(new T),n=Math.max(s.length()*.5,Number.EPSILON),i=new T,o=Array.from(r.octree.leafNodeIds,a=>(r.octree.nodes[a].bounds.getCenter(i),{nodeId:a,radius:i.distanceTo(e)/n}));return o.sort((a,l)=>a.radius-l.radius||a.nodeId-l.nodeId),o}class Au{cameraCenter=new T;center;budgetShares;constructor(t={}){this.center=t.center instanceof T?t.center.clone():t.center??"bounds-center",this.budgetShares=_u(t.budgetShares??[.8,.1,.1])}setCenter(t){return this.center=t instanceof T?t.clone():t,this}setFromCamera(t,e){return this.setCenter(bu(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(Qn(e),e===0)return Ru();const s=t.octree.data.count;if(s<=e){const u=t.octree.leafNodeIds.slice(),d=new Uint8Array(u.length);return d.fill(t.finestLevel),{nodeIds:u,lodLevels:d,gaussianCount:s}}const n=Eu(t,this.center),i=[t.finestLevel,Math.max(0,t.finestLevel-1),0],o=[],a=[];let l=0,h=0,c=0;for(let u=0;u<i.length;u++){const d=this.budgetShares[u];if(c+=d,d===0)continue;const p=u===i.length-1?e:Math.floor(e*c),f=i[u];for(;h<n.length;){const m=n[h],y=t.nodes[m.nodeId].levelCounts[f];if(l+y>p)break;o.push(m.nodeId),a.push(f),l+=y,h++}}return{nodeIds:Uint32Array.from(o),lodLevels:Uint8Array.from(a),gaussianCount:l}}}function _u(r){let t=0;for(const e of r){if(!(e>=0&&e<=1))throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");t+=e}if(Math.abs(t-1)>1e-6)throw new RangeError("Tiered radial LOD budget shares must sum to 1");return Object.freeze([...r])}function Ru(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}function Lu(r){const t=new Uint32Array(r.octree.leafNodeIds),e=new Float64Array(t.length*3),s=new Uint32Array(t.length*r.levelCount);for(let a=0;a<t.length;a++){const l=t[a],h=r.octree.nodes[l].bounds,c=a*3;e[c]=(h.min.x+h.max.x)*.5,e[c+1]=(h.min.y+h.max.y)*.5,e[c+2]=(h.min.z+h.max.z)*.5,s.set(r.nodes[l].levelCounts,a*r.levelCount)}const n=r.octree.rootBounds.max.x-r.octree.rootBounds.min.x,i=r.octree.rootBounds.max.y-r.octree.rootBounds.min.y,o=r.octree.rootBounds.max.z-r.octree.rootBounds.min.z;return{leafNodeIds:t,leafCenters:e,levelCounts:s,levelCount:r.levelCount,halfDiagonal:Math.max(Math.sqrt(n*n+i*i+o*o)*.5,Number.EPSILON)}}const eo=`(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();\n`,so=typeof self<"u"&&self.Blob&&new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);",eo],{type:"text/javascript;charset=utf-8"});function Iu(r){let t;try{if(t=so&&(self.URL||self.webkitURL).createObjectURL(so),!t)throw"";const e=new Worker(t,{name:r?.name});return e.addEventListener("error",()=>{(self.URL||self.webkitURL).revokeObjectURL(t)}),e}catch{return new Worker("data:text/javascript;charset=utf-8,"+encodeURIComponent(eo),{name:r?.name})}}const zu=2;class Fu{constructor(t){this.targetStrategy=t}targetStrategy;worker=null;boundsCenter=new T;lod=null;revision=0;latestRequestedRevision=0;busy=!1;queuedRequest=null;activeMaxGaussians=0;activeStarted=0;latestResult=null;latestError=null;disposed=!1;discarded=0;get pending(){return this.busy||this.queuedRequest!==null}get hasResult(){return this.latestResult!==null||this.latestError!==null}get discardedResults(){return this.discarded}initialize(t){if(this.assertUsable(),this.lod!==t){if(this.lod!==null)throw new Error("RadialLodWorkerPlanner instances cannot be shared between GaussianLod objects");this.lod=t}}initializeWorker(){if(this.worker!==null)return;const t=this.lod;if(t===null)throw new Error("Radial LOD worker has no GaussianLod");this.worker=new Iu({name:"3dgs-radial-lod"}),this.worker.addEventListener("message",this.handleMessage),this.worker.addEventListener("error",this.handleError);const e=Lu(t),s=Array.from({length:zu},()=>Pu(e.leafNodeIds.length)),n={type:"init",data:e,buffers:s};this.worker.postMessage(n,[e.leafNodeIds.buffer,e.leafCenters.buffer,e.levelCounts.buffer,...s.flatMap(({nodeIds:i,lodLevels:o})=>[i,o])])}request(t){this.assertUsable(),this.initialize(t.lod),this.initializeWorker(),this.releaseLatestResult();const e=this.targetStrategy.center instanceof T?this.targetStrategy.center:t.lod.octree.bounds.getCenter(this.boundsCenter),s=++this.revision;this.latestRequestedRevision=s;const n={type:"request",revision:s,centerX:e.x,centerY:e.y,centerZ:e.z,maxGaussians:t.maxGaussians},o={message:"budgetShares"in this.targetStrategy?{...n,strategy:"tiered",budgetShares:this.targetStrategy.budgetShares}:{...n,strategy:"distance",levelDistance:this.targetStrategy.levelDistance},maxGaussians:t.maxGaussians};if(this.busy){this.queuedRequest!==null&&this.discarded++,this.queuedRequest=o;return}this.dispatch(o)}cancel(){this.assertUsable(),this.latestRequestedRevision=++this.revision,this.releaseLatestResult(),this.queuedRequest!==null&&(this.queuedRequest=null,this.discarded++)}takeLatest(){if(this.assertUsable(),this.latestError!==null){const n=this.latestError;throw this.latestError=null,n}const t=this.latestResult;if(t===null)return null;this.latestResult=null;const{message:e}=t;let s=!1;return{packing:Ou(e),maxGaussians:t.maxGaussians,planningMs:e.planningMs,roundTripMs:t.roundTripMs,release:()=>{s||(s=!0,this.recycle(e.buffer))}}}dispose(){this.disposed||(this.disposed=!0,this.latestResult=null,this.queuedRequest=null,this.worker?.removeEventListener("message",this.handleMessage),this.worker?.removeEventListener("error",this.handleError),this.worker?.terminate(),this.worker=null)}handleMessage=t=>{if(this.disposed)return;const e=t.data,s=performance.now()-this.activeStarted,n=this.activeMaxGaussians;this.busy=!1,e.revision===this.latestRequestedRevision?(this.releaseLatestResult(),this.latestResult={message:e,maxGaussians:n,roundTripMs:s}):(this.discarded++,this.recycle(e.buffer));const i=this.queuedRequest;this.queuedRequest=null,i!==null&&this.dispatch(i)};handleError=t=>{this.disposed||(this.busy=!1,this.queuedRequest=null,this.latestError=new Error(t.message||"Radial LOD worker failed"))};dispatch(t){this.busy=!0,this.activeMaxGaussians=t.maxGaussians,this.activeStarted=performance.now(),this.worker.postMessage(t.message)}releaseLatestResult(){const t=this.latestResult;t!==null&&(this.latestResult=null,this.discarded++,this.recycle(t.message.buffer))}recycle(t){this.disposed||this.worker.postMessage({type:"recycle",buffer:t},[t.nodeIds,t.lodLevels])}assertUsable(){if(this.disposed)throw new Error("RadialLodWorkerPlanner has been disposed")}}function Pu(r){return{nodeIds:new ArrayBuffer(r*Uint32Array.BYTES_PER_ELEMENT),lodLevels:new ArrayBuffer(r*Uint8Array.BYTES_PER_ELEMENT)}}function Ou(r){return{nodeIds:new Uint32Array(r.buffer.nodeIds,0,r.length),lodLevels:new Uint8Array(r.buffer.lodLevels,0,r.length),gaussianCount:r.gaussianCount}}const ku=1024*1024,Bu=16,Du=1.25;class no{targetStrategy;targetPlanner;maxUploadBytesPerPack;maxChangedCellsPerPack;lod=null;appliedNodeIds=new Uint32Array;appliedLodLevels=new Uint8Array;appliedIndices=new Int32Array;appliedCellCount=0;appliedGaussianCount=0;targetAvailable=!1;targetBudget=-1;targetDirty=!0;changes=[];changeCursor=0;initialized=!1;latestTargetPlanningMs=0;latestTargetRoundTripMs=0;constructor(t,e={}){if(this.targetStrategy=t,this.targetPlanner=e.targetPlanner??null,this.maxUploadBytesPerPack=e.maxUploadBytesPerPack??ku,this.maxChangedCellsPerPack=e.maxChangedCellsPerPack??Bu,!(this.maxUploadBytesPerPack>0)||!Number.isFinite(this.maxUploadBytesPerPack))throw new RangeError("Streaming LOD maxUploadBytesPerPack must be finite and positive");if(!Number.isInteger(this.maxChangedCellsPerPack)||this.maxChangedCellsPerPack<=0)throw new RangeError("Streaming LOD maxChangedCellsPerPack must be a positive integer")}setFromCamera(t,e){return this.targetStrategy.setFromCamera(t,e),this.invalidateTarget()}invalidateTarget(){return this.targetDirty=!0,this.targetPlanner!==null&&(this.changes=[],this.changeCursor=0),this}get needsPack(){return this.targetDirty||this.targetPlanner?.pending===!0||this.targetPlanner?.hasResult===!0||this.changeCursor<this.changes.length}get targetStats(){return{planningMs:this.latestTargetPlanningMs,roundTripMs:this.latestTargetRoundTripMs,discardedResults:this.targetPlanner?.discardedResults??0,pending:this.targetPlanner?.pending??!1}}dispose(){this.targetPlanner?.dispose()}pack(t){if(Qn(t.maxGaussians),this.bindLod(t.lod),!this.initialized){const e=this.buildTarget(t);return this.initializeApplied(e),this.initialized=!0,this.changes=[],this.changeCursor=0,e}if(this.targetPlanner!==null&&(this.targetDirty||!this.targetAvailable||this.targetBudget!==t.maxGaussians)){this.targetPlanner.cancel();const e=this.buildTarget(t);this.changes=this.planChanges(t.lod,e),this.changeCursor=0}return this.takeNextBatch(t)?.packing??this.currentPacking()}takeNextBatch(t){if(Qn(t.maxGaussians),this.bindLod(t.lod),!this.initialized)throw new Error("StreamingLodPackingStrategy must be initialized by store.pack() before incremental batches");if(this.refreshTarget(t),this.changeCursor>=this.changes.length)return null;const e=[];let s=0;for(;this.changeCursor<this.changes.length;){const n=this.changes[this.changeCursor],i=e.length>=this.maxChangedCellsPerPack||s+n.estimatedUploadBytes>this.maxUploadBytesPerPack;if(e.length>0&&i&&this.appliedGaussianCount<=t.maxGaussians)break;this.applyChange(n),e.push({nodeId:n.nodeId,lodLevel:n.lodLevel}),s+=n.estimatedUploadBytes,this.changeCursor++}return{packing:this.currentPacking(),transitions:e,pending:this.changeCursor<this.changes.length}}bindLod(t){if(this.lod===null){this.lod=t,this.appliedNodeIds=new Uint32Array(t.nodes.length),this.appliedLodLevels=new Uint8Array(t.nodes.length),this.appliedIndices=new Int32Array(t.nodes.length),this.appliedIndices.fill(-1),this.targetPlanner?.initialize(t);return}if(this.lod!==t)throw new Error("StreamingLodPackingStrategy instances cannot be shared between GaussianLod objects")}buildTarget(t){const e=this.targetStrategy.pack(t);return oo(t.lod,e,t.maxGaussians),this.targetAvailable=!0,this.targetBudget=t.maxGaussians,this.targetDirty=!1,e}refreshTarget(t){if(this.targetPlanner===null){if(this.targetDirty||!this.targetAvailable||this.targetBudget!==t.maxGaussians){const s=this.buildTarget(t);this.changes=this.planChanges(t.lod,s),this.changeCursor=0}return}(this.targetDirty||this.targetBudget!==t.maxGaussians)&&(this.targetPlanner.request(t),this.targetBudget=t.maxGaussians,this.targetDirty=!1,this.targetAvailable=!1,this.changes=[],this.changeCursor=0);const e=this.targetPlanner.takeLatest();if(e!==null)try{oo(t.lod,e.packing,e.maxGaussians),this.targetAvailable=!0,this.targetBudget=e.maxGaussians,this.changes=this.planChanges(t.lod,e.packing),this.changeCursor=0,this.latestTargetPlanningMs=e.planningMs,this.latestTargetRoundTripMs=e.roundTripMs}finally{e.release()}}initializeApplied(t){this.appliedCellCount=t.nodeIds.length,this.appliedGaussianCount=t.gaussianCount,this.appliedNodeIds.set(t.nodeIds),this.appliedLodLevels.set(t.lodLevels);for(let e=0;e<t.nodeIds.length;e++)this.appliedIndices[t.nodeIds[e]]=e}planChanges(t,e){const s=new Int16Array(t.nodes.length);s.fill(-1);for(let o=0;o<e.nodeIds.length;o++)s[e.nodeIds[o]]=e.lodLevels[o];const n=[],i=[];for(let o=this.appliedCellCount-1;o>=0;o--){const a=this.appliedNodeIds[o],l=this.appliedLodLevels[o],h=s[a];(h<0||h<l)&&n.push(ro(t,a,l,h<0?null:h))}for(let o=0;o<e.nodeIds.length;o++){const a=e.nodeIds[o],l=e.lodLevels[o],h=this.appliedIndices[a],c=h<0?null:this.appliedLodLevels[h];(c===null||l>c)&&i.push(ro(t,a,c,l))}return[...n,...i]}applyChange(t){const e=this.appliedIndices[t.nodeId];if(t.lodLevel===null){if(e<0)return;const s=--this.appliedCellCount;if(e!==s){const n=this.appliedNodeIds[s];this.appliedNodeIds[e]=n,this.appliedLodLevels[e]=this.appliedLodLevels[s],this.appliedIndices[n]=e}this.appliedIndices[t.nodeId]=-1}else if(e<0){const s=this.appliedCellCount++;this.appliedNodeIds[s]=t.nodeId,this.appliedLodLevels[s]=t.lodLevel,this.appliedIndices[t.nodeId]=s}else this.appliedLodLevels[e]=t.lodLevel;this.appliedGaussianCount+=t.gaussianDelta}currentPacking(){return{nodeIds:this.appliedNodeIds.subarray(0,this.appliedCellCount),lodLevels:this.appliedLodLevels.subarray(0,this.appliedCellCount),gaussianCount:this.appliedGaussianCount}}}function io(r){return r instanceof no}function ro(r,t,e,s){const n=r.nodes[t],i=e===null?0:n.levelCounts[e],o=s===null?0:n.levelCounts[s],a=Math.max(0,o-i),l=Math.max(0,i-o),h=e!==null&&s!==null&&e!==s?Math.min(i,o):0,c=48+r.octree.data.shCoefficientCount*Qr+4;return{nodeId:t,lodLevel:s,gaussianDelta:o-i,estimatedUploadBytes:Math.ceil((a*c+l*16+h*4)*Du)}}function oo(r,t,e){if(t.gaussianCount>e)throw new RangeError(`Streaming LOD target exceeded its allocation of ${e} Gaussians`);if(t.nodeIds.length!==t.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const s=new Set;let n=0;for(let i=0;i<t.nodeIds.length;i++){const o=t.nodeIds[i],a=t.lodLevels[i],h=r.nodes[o]?.levelCounts[a];if(h===void 0||r.octree.nodes[o]?.isLeaf!==!0)throw new RangeError(`GaussianLod packing references invalid leaf ${o} or level ${a}`);if(s.has(o))throw new Error(`GaussianLod packing contains duplicate node ${o}`);s.add(o),n+=h}if(n!==t.gaussianCount)throw new RangeError(`GaussianLodPacking declares ${t.gaussianCount} Gaussians but selects ${n}`)}class Uu{allocate({remainingGaussians:t}){return t}}function rs(r,t,e){if(r.length===0)return[];r.sort((u,d)=>u-d);const s=[];let n=r[0],i=n,o=1;for(let u=1;u<=r.length;u++){const d=r[u];if(d!==i){if(d!==void 0&&o++,d===i+1){i=d;continue}s.push({start:n,count:i-n+1}),d!==void 0&&(n=i=d)}}if(s.length<2)return s;const a=Math.floor(o*e);let l=0;const h=[];let c={...s[0]};for(let u=1;u<s.length;u++){const d=s[u],p=c.start+c.count,f=d.start-p;f<=t&&l+f<=a?(c.count=d.start+d.count-c.start,l+=f):(h.push(c),c={...d})}return h.push(c),h}function os(r){let t=0;for(const e of r)t+=e.count;return t}function At(r,t,e){if(t.length!==0){for(const s of t)r.addUpdateRange(s.start*e,s.count*e);r.needsUpdate=!0}}const ao=Symbol("replaceGaussianStoreAttribute"),lo=Symbol("updateGaussianStoreAttribute"),ho=Symbol("disposeGaussianStoreAttribute");class Vu{format;name;packedBuffer=null;disposed=!1;constructor(t,e){this.name=t,this.format=e}get isAllocated(){return this.packedBuffer!==null}get count(){return this.packedBuffer?.count??0}get bufferAttribute(){if(this.assertUsable(),this.packedBuffer===null)throw new Error(`GaussianStore attribute ${this.name} is not allocated; call store.pack() first`);return this.packedBuffer}get array(){return this.bufferAttribute.array}[ao](t){this.assertUsable();const e=this.packedBuffer,s=new Hn(t,1);s.name=`3dgs.store.attribute.${this.name}`,this.packedBuffer=s,e?.dispose()}[lo](t){At(this.bufferAttribute,t,1)}[ho](){this.disposed||(this.disposed=!0,this.packedBuffer?.dispose(),this.packedBuffer=null)}assertUsable(){if(this.disposed)throw new Error(`GaussianStore attribute ${this.name} has been disposed`)}}const co=Symbol("enableGaussianStoreAttribute"),uo=Symbol("disposeGaussianStoreAttributes");class Gu{attributes=new Map;get size(){return this.attributes.size}get(t){return this.attributes.get(t)}has(t){return this.attributes.has(t)}values(){return this.attributes.values()}[Symbol.iterator](){return this.values()}[co](t,e){const s=this.attributes.get(t);if(s!==void 0){if(s.format!==e)throw new Error(`GaussianStore attribute ${t} already uses format ${s.format}`);return s}const n=new Vu(t,e);return this.attributes.set(t,n),n}[uo](){for(const t of this.attributes.values())t[ho]();this.attributes.clear()}}class Wu{constructor(t){this.attribute=t}attribute;writtenSlots=[];freshBuffer=!1;allocate(t){this.writtenSlots.length=0,this.attribute[ao](new Uint32Array(t)),this.freshBuffer=!0}backfill(t){const e=this.attribute.array;for(const s of t.cells)for(const n of s.slots)e[n]=s.lodLevel,this.writtenSlots.push(n)}updateCell(t){const{previousCell:e,cell:s,retainedCount:n}=t,i=e?.lodLevel===s.lodLevel?n:0,o=this.attribute.array;for(let a=i;a<s.slots.length;a++){const l=s.slots[a];o[l]=s.lodLevel,this.writtenSlots.push(l)}}commit(){const t=this.writtenSlots.length,e=rs(this.writtenSlots,16,.25),s=os(e);return this.freshBuffer||this.attribute[lo](e),this.writtenSlots.length=0,this.freshBuffer=!1,{writtenSlots:t,uploadedSlots:s,estimatedUploadBytes:s*Uint32Array.BYTES_PER_ELEMENT,slotRanges:e}}}const $u=16777216;class qu{changeListeners=new Set;loader;budgetingStrategy;defaultPackingStrategy;defaultStreamingLod;maxGaussiansOption;packedShFormat="rgb8e8";attributes=new Gu;attributePackers=[];entries=[];cloudList=[];packedData=null;nextObjectId=0;packedObjectCapacity=0;gaussianCapacity=0;cellSlotsByEntry=new Map;freeSlots=[];scratchWrittenSlots=[];scratchReleasedSlots=[];scratchClearedSlots=[];slotMarks=new Uint32Array;slotMarkGeneration=0;packingInvalid=!1;latestPackStats=null;disposed=!1;layoutVersion=0;packedContentVersion=0;constructor(t={}){this.loader=t.loader??new Xn,this.budgetingStrategy=t.budgetingStrategy??new Uu,this.defaultPackingStrategy=t.defaultPackingStrategy??null,this.defaultStreamingLod={...t.defaultStreamingLod},this.maxGaussiansOption=Yu(t.maxGaussians??"auto")}subscribe(t){return this.changeListeners.add(t),()=>{this.changeListeners.delete(t)}}async loadBuffer(t,e={}){const s=new Xn().parse(t);let n=null,i=null;try{return n=ns.build(s,{...e.octree,ownsData:!0}),i=is.build(n,{...e.lod,ownsOctree:!0}),this.addLod(i,{name:e.name,priority:e.priority,packingStrategy:e.packingStrategy,ownsLod:!0})}catch(o){throw i!==null?i.dispose():n!==null?n.dispose():s.dispose(),o}}getSourceCount(t){const e=this.entries.find(s=>s.cloud===t);if(e===void 0)throw new Error("Cloud does not belong to this Store");return e.sourceGaussianCount}getBounds(t){const e=this.entries.find(i=>i.cloud===t);if(e===void 0)throw new Error("Cloud does not belong to this Store");if(e.lod!==null){const{min:i,max:o}=e.lod.octree.bounds;return[i.x,i.y,i.z,o.x,o.y,o.z]}const s=e.source.means.array,n=[1/0,1/0,1/0,-1/0,-1/0,-1/0];for(let i=0;i<e.sourceGaussianCount;i++)for(let o=0;o<3;o++){const a=s[i*4+o];n[o]=Math.min(n[o],a),n[o+3]=Math.max(n[o+3],a)}return n}get maxGaussians(){return this.gaussianCapacity}get needsPack(){return this.packingInvalid}get hasPackedData(){return this.packedData!==null}get lastPackStats(){return this.latestPackStats}get contentVersion(){return this.packedContentVersion}get count(){return this.entries.reduce((t,e)=>t+e.count,0)}get shDegree(){let t=0;for(const e of this.entries)e.sourceDegree>t&&(t=e.sourceDegree);return t}get objectCapacity(){return this.nextObjectId}get clouds(){return this.cloudList}enablePackedLodLevelAttribute(){this.assertUsable();const t=this.attributes.get("lodLevel");if(t!==void 0)return t;const e=this.attributes[co]("lodLevel","u32"),s=new Wu(e);return this.attributePackers.push(s),this.packedData!==null&&(s.allocate(this.packedData.count),s.backfill({cells:this.collectPackedLayoutCells()}),s.commit()),e}async load(t,e={}){this.assertUsable();const s=await this.loader.load(t);let n=null,i=null;try{return n=ns.build(s,{...e.octree,ownsData:!0}),i=is.build(n,{...e.lod,ownsOctree:!0}),this.addLod(i,{name:e.name??ju(t),priority:e.priority,packingStrategy:e.packingStrategy,ownsLod:!0})}catch(o){throw i!==null?i.dispose():n!==null?n.dispose():s.dispose(),o}}add(t,e={}){this.assertUsable();const s=this.allocateObjectId(),n=ei(e.priority??0),i=new Jr(this,s,0,e.name,null,null,n);return this.entries.push({cloud:i,count:0,sourceGaussianCount:t.count,sourceDegree:t.shDegree,priority:n,packingStrategy:null,ownsPackingStrategy:!1,lastLodFocus:new T(Number.NaN,Number.NaN,Number.NaN),source:t,ownsSource:e.ownsData??!1,lod:null,ownsLod:!1,packing:null,allocatedBudget:null,packingDirty:!0}),this.cloudList.push(i),this.invalidatePacking(),i}addLod(t,e={}){this.assertUsable();const s=this.allocateObjectId(),n=ei(e.priority??0),i=new Jr(this,s,0,e.name,t,null,n),o=e.packingStrategy??this.defaultPackingStrategy??Xu(this.defaultStreamingLod);return this.entries.push({cloud:i,count:0,sourceGaussianCount:t.octree.data.count,sourceDegree:t.octree.data.shDegree,priority:n,packingStrategy:o,ownsPackingStrategy:e.packingStrategy===void 0&&this.defaultPackingStrategy===null,lastLodFocus:new T(Number.NaN,Number.NaN,Number.NaN),source:null,ownsSource:!1,lod:t,ownsLod:e.ownsLod??!1,packing:null,allocatedBudget:null,packingDirty:!0}),this.cloudList.push(i),this.invalidatePacking(),i}remove(t){if(this.disposed)return;const e=this.entries.findIndex(n=>n.cloud===t);if(e<0)return;const[s]=this.entries.splice(e,1);this.cloudList.splice(this.cloudList.indexOf(t),1),s?.source!==null&&s?.ownsSource===!0&&s.source.dispose(),s?.lod!==null&&s?.ownsLod===!0&&s.lod.dispose(),s?.ownsPackingStrategy===!0&&po(s.packingStrategy),t.removeFromParent(),this.invalidatePacking()}pack({limits:t}){if(this.assertUsable(),this.entries.length===0)throw new Error("GaussianStore must contain at least one GaussianCloud");const e=Qu(t,this.shDegree),s=this.maxGaussiansOption==="auto"?e:Math.min(e,this.maxGaussiansOption),n=performance.now(),i=this.planPackings(s),o=performance.now()-n,a=Math.min(s,this.entries.reduce((p,f)=>p+f.sourceGaussianCount,0)),l=this.packedData,h=l!==null&&l.count===a&&l.shDegree===this.shDegree&&l.shFormat===this.packedShFormat&&this.packedObjectCapacity===this.objectCapacity,c=performance.now(),u=h?this.updatePackedData(i,l):this.buildPackedData(i,a),d=performance.now()-c;for(const p of i)p.entry.count=p.count,p.entry.packing=p.packing,p.entry.allocatedBudget=p.allocatedBudget,p.entry.packingDirty=!1,p.entry.cloud.updatePacking(p.count,p.packing);this.packedData=u.data,this.cellSlotsByEntry=u.cellSlotsByEntry,this.freeSlots=u.freeSlots,this.gaussianCapacity=s,this.packedObjectCapacity=this.objectCapacity,this.packingInvalid=!1,this.latestPackStats={...u.stats,planningMs:o,slotUpdateMs:d},h||(this.layoutVersion++,l?.dispose()),this.packedContentVersion++;for(const p of this.changeListeners)p({type:"changed",reason:h?"content":"layout"})}packLodBatch(t){if(this.assertUsable(),this.packingInvalid||this.packedData===null)throw new Error("GaussianStore layout is invalidated; call store.pack({ limits: device.limits }) before streaming LOD batches");const e=this.entries.find(z=>z.cloud===t);if(e===void 0)throw new Error("GaussianCloud does not belong to this GaussianStore");if(e.lod===null||e.packing===null||e.allocatedBudget===null)throw new Error("GaussianCloud is not an initialized LOD entry");const s=e.packingStrategy;if(!io(s))throw new Error("GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches");const n=performance.now(),i=s.takeNextBatch({lod:e.lod,maxGaussians:e.allocatedBudget}),o=performance.now()-n;if(i===null)return{applied:!1,pending:s.needsPack};const a=this.packedData,l=this.cellSlotsByEntry.get(e);if(l===void 0)throw new Error("GaussianStore is missing the packed LOD cell layout");const h=performance.now(),c=l,u=this.freeSlots,d=this.scratchReleasedSlots;d.length=0;const p=new Map;for(const z of i.transitions){const U=l.get(z.nodeId),Y=z.lodLevel===null?0:e.lod.nodes[z.nodeId].levelCounts[z.lodLevel],G=Math.min(U?.slots.length??0,Y);if(p.set(z.nodeId,{previousCell:U,retainedCount:G}),U!==void 0)for(let $=G;$<U.slots.length;$++){const Z=U.slots[$];u.push(Z),d.push(Z)}}const f=this.scratchWrittenSlots;f.length=0;for(const z of i.transitions){const U=p.get(z.nodeId),{previousCell:Y,retainedCount:G}=U;if(z.lodLevel===null){c.delete(z.nodeId);continue}const $=e.lod.nodes[z.nodeId].levelCounts[z.lodLevel],Z=Y?.slots,P=Z!==void 0&&Z.length===$?Z:new Uint32Array($);P!==Z&&Z!==void 0&&G>0&&P.set(Z.subarray(0,G));for(let _t=G;_t<$;_t++){const Yt=u.pop();if(Yt===void 0)throw new Error("GaussianStore slot allocator exhausted capacity");this.copySourceToSlot(e,this.cellSourceIndex(e,z.nodeId,_t),Yt,a.means.array,a.scalesOpacity.array,a.rotations.array,a.shCoefficients.array,a.shCoefficientCount),P[_t]=Yt,f.push(Yt)}const Dt={lodLevel:z.lodLevel,slots:P};for(const _t of this.attributePackers)_t.updateCell({previousCell:Y,cell:Dt,retainedCount:G});c.set(z.nodeId,Dt)}const m=this.nextSlotMarkGeneration(a.count);for(const z of f)this.slotMarks[z]=m;const y=this.scratchClearedSlots;y.length=0;for(const z of d)this.slotMarks[z]!==m&&y.push(z);const w=a.scalesOpacity.array;for(const z of y)w[z*4+3]=0;const M=rs(f,4,.15),C=rs(y,16,.25);At(a.means,M,4),At(a.scalesOpacity,M,4),At(a.scalesOpacity,C,4),At(a.rotations,M,4),At(a.shCoefficients,M,a.shCoefficientCount*a.shCoefficients.itemSize);const b=this.commitAttributePackers(),S=this.count-e.count+i.packing.gaussianCount,R=os(M),I=os(C),D=performance.now()-h;e.count=i.packing.gaussianCount,e.packing=i.packing,e.packingDirty=!1,e.cloud.updatePacking(e.count,e.packing),this.cellSlotsByEntry.set(e,c),this.freeSlots=u,this.latestPackStats={fullRebuild:!1,slotCapacity:a.count,activeGaussians:S,reusedSlots:S-f.length,writtenSlots:f.length,clearedSlots:y.length,estimatedUploadBytes:R*ti(a)+I*16+b.estimatedUploadBytes,writtenSlotRanges:M,clearedSlotRanges:C,planningMs:o,slotUpdateMs:D},this.packedContentVersion++;for(const z of this.changeListeners)z({type:"changed",reason:"content"});return{applied:!0,pending:i.pending}}planPackings(t){const e=[...this.entries].sort((i,o)=>i.priority-o.priority||i.cloud.objectId-o.cloud.objectId),s=[];let n=0;for(const i of e){const o=Math.max(0,t-n),a=this.budgetingStrategy.allocate({capacity:t,allocatedGaussians:n,remainingGaussians:o,entry:{cloud:i.cloud,priority:i.priority,insertionIndex:i.cloud.objectId,sourceGaussianCount:i.sourceGaussianCount}});if(Zu(a,o),i.lod===null){if(i.sourceGaussianCount>a)throw new RangeError(`${i.cloud.name} requires ${i.sourceGaussianCount} Gaussians but its Store allocation is ${a}`);s.push({entry:i,count:i.sourceGaussianCount,packing:null,allocatedBudget:a,selectionChanged:i.packingDirty||i.allocatedBudget!==a}),n+=i.sourceGaussianCount;continue}const l=i.packingStrategy,h=i.packingDirty||i.allocatedBudget!==a||i.packing===null,c=!h&&i.packing!==null?i.packing:l.pack({lod:i.lod,maxGaussians:a});if(c.gaussianCount>a)throw new RangeError(`${l.constructor.name} exceeded its allocation of ${a} Gaussians`);Ju(i.lod,c),s.push({entry:i,count:c.gaussianCount,packing:c,allocatedBudget:a,selectionChanged:h}),n+=c.gaussianCount}return s}updatePackingPriority(t,e){this.assertUsable();const s=this.entries.find(i=>i.cloud===t);if(s===void 0)throw new Error("GaussianCloud does not belong to this GaussianStore");const n=ei(e);s.priority=n,t.updatePackingPriority(n),this.invalidatePacking()}invalidateCloudPacking(t){this.assertUsable();const e=this.entries.find(s=>s.cloud===t);if(e===void 0)throw new Error("GaussianCloud does not belong to this GaussianStore");e.packingDirty=!0,this.packingInvalid=!0;for(const s of this.changeListeners)s({type:"changed",reason:"layout"})}updateLod(t){if(this.assertUsable(),this.packingInvalid||this.packedData===null)return{appliedBatches:0,pending:!1,clouds:[]};t.updateWorldMatrix(!0,!1);const e=new T,s=new T;let n=0,i=!1;const o=[],a=[],l=[];for(const h of this.entries){const c=h.packingStrategy;if(h.lod===null||c===null||!io(c))continue;h.cloud.updateWorldMatrix(!0,!1),t.getWorldPosition(e),h.cloud.worldToLocal(e);const u=h.lod.octree.rootBounds.getSize(new T).length()*.5,d=Math.max(.05,u*.025);(!Number.isFinite(h.lastLodFocus.x)||e.distanceToSquared(h.lastLodFocus)>=d*d)&&(c.setFromCamera(t,h.cloud),h.lastLodFocus.copy(e));let p=!1;c.needsPack&&(p=this.packLodBatch(h.cloud).applied,p&&(n++,o.push(...this.latestPackStats?.writtenSlotRanges??[]),a.push(...this.latestPackStats?.clearedSlotRanges??[])));const f=c.needsPack;i||=f,h.lod.octree.rootBounds.getCenter(s),l.push({cloud:h.cloud,focusDistance:e.distanceTo(s),applied:p,pending:f,targetStats:c.targetStats})}return{appliedBatches:n,pending:i,clouds:l,writtenSlotRanges:o,clearedSlotRanges:a}}getPackedData(){if(this.assertUsable(),this.entries.length===0)throw new Error("GaussianStore must contain at least one GaussianCloud");if(this.packingInvalid||this.packedData===null)throw new Error("GaussianStore layout is invalidated; call store.pack({ limits: device.limits }) before rendering");return this.packedData}dispose(){if(!this.disposed){this.disposed=!0;for(const t of this.entries)t.source!==null&&t.ownsSource&&t.source.dispose(),t.lod!==null&&t.ownsLod&&t.lod.dispose(),t.ownsPackingStrategy&&po(t.packingStrategy),t.cloud.removeFromParent();this.entries.length=0,this.cloudList.length=0,this.packedData?.dispose(),this.packedData=null,this.attributes[uo](),this.changeListeners.clear(),this.attributePackers.length=0}}buildPackedData(t,e){const s=this.shDegree,n=(s+1)**2,i=new Float32Array(e*4),o=new Float32Array(e*4),a=new Float32Array(e*4),l=new Uint32Array(e*n),h=new Map;let c=0;for(const m of t){const{entry:y}=m,w=new Map;for(const M of this.plannedCells(m)){const C=new Uint32Array(M.count);for(let b=0;b<M.count;b++){const S=this.cellSourceIndex(y,M.nodeId,b);this.copySourceToSlot(y,S,c,i,o,a,l,n),C[b]=c++}w.set(M.nodeId,{lodLevel:M.lodLevel,slots:C})}h.set(y,w)}const u=Array.from({length:e-c},(m,y)=>e-1-y),d=new Yr({means:Us("3dgs.store.means-object",i),scalesOpacity:Us("3dgs.store.scales-opacity",o),rotations:Us("3dgs.store.rotations",a),shCoefficients:Us("3dgs.store.sh-coefficients",l,1)},{count:e,shDegree:s,shFormat:this.packedShFormat,ownsBuffers:!0}),p=this.collectPackedLayoutCells(h);for(const m of this.attributePackers)m.allocate(e),m.backfill({cells:p});const f=this.commitAttributePackers();return{data:d,cellSlotsByEntry:h,freeSlots:u,stats:{fullRebuild:!0,slotCapacity:e,activeGaussians:c,reusedSlots:0,writtenSlots:c,clearedSlots:0,estimatedUploadBytes:c*ti(d)+f.estimatedUploadBytes,writtenSlotRanges:c===0?[]:[{start:0,count:c}],clearedSlotRanges:[],planningMs:0,slotUpdateMs:0}}}updatePackedData(t,e){const s=new Map,n=new Set;let i=0;for(const S of t){if(n.add(S.entry),i+=S.count,!S.selectionChanged)continue;const R=new Map;for(const I of this.plannedCells(S))R.set(I.nodeId,I);s.set(S.entry,R)}const o=[...this.freeSlots],a=this.scratchReleasedSlots;a.length=0;for(const[S,R]of this.cellSlotsByEntry){const I=s.get(S);if(!(I===void 0&&n.has(S)))for(const[D,z]of R){const U=z.slots,Y=Math.min(U.length,I?.get(D)?.count??0);for(let G=Y;G<U.length;G++){const $=U[G];o.push($),a.push($)}}}const l=new Map,h=this.scratchWrittenSlots;h.length=0;let c=0;for(const S of t){const R=this.cellSlotsByEntry.get(S.entry);if(!S.selectionChanged&&R!==void 0){l.set(S.entry,R),c+=S.count;continue}const I=new Map;for(const D of s.get(S.entry)?.values()??[]){const z=R?.get(D.nodeId),U=z?.slots,Y=Math.min(U?.length??0,D.count),G=U!==void 0&&U.length===D.count?U:new Uint32Array(D.count);G!==U&&U!==void 0&&Y>0&&G.set(U.subarray(0,Y)),c+=Y;for(let Z=Y;Z<D.count;Z++){const P=o.pop();if(P===void 0)throw new Error("GaussianStore slot allocator exhausted capacity");this.copySourceToSlot(S.entry,this.cellSourceIndex(S.entry,D.nodeId,Z),P,e.means.array,e.scalesOpacity.array,e.rotations.array,e.shCoefficients.array,e.shCoefficientCount),G[Z]=P,h.push(P)}const $={lodLevel:D.lodLevel,slots:G};for(const Z of this.attributePackers)Z.updateCell({previousCell:z,cell:$,retainedCount:Y});I.set(D.nodeId,$)}l.set(S.entry,I)}const u=this.nextSlotMarkGeneration(e.count);for(const S of h)this.slotMarks[S]=u;const d=this.scratchClearedSlots;d.length=0;for(const S of a)this.slotMarks[S]!==u&&d.push(S);const p=e.scalesOpacity.array;for(const S of d)p[S*4+3]=0;const f=h.length,m=d.length,y=rs(h,4,.15),w=rs(d,16,.25);At(e.means,y,4),At(e.scalesOpacity,y,4),At(e.scalesOpacity,w,4),At(e.rotations,y,4),At(e.shCoefficients,y,e.shCoefficientCount*e.shCoefficients.itemSize);const M=this.commitAttributePackers(),C=os(y),b=os(w);return{data:e,cellSlotsByEntry:l,freeSlots:o,stats:{fullRebuild:!1,slotCapacity:e.count,activeGaussians:i,reusedSlots:c,writtenSlots:f,clearedSlots:m,estimatedUploadBytes:C*ti(e)+b*16+M.estimatedUploadBytes,writtenSlotRanges:y,clearedSlotRanges:w,planningMs:0,slotUpdateMs:0}}}plannedCells(t){return t.entry.lod===null||t.packing===null?[{nodeId:-1,lodLevel:0,count:t.count}]:Array.from(t.packing.nodeIds,(e,s)=>({nodeId:e,lodLevel:t.packing.lodLevels[s],count:t.entry.lod.nodes[e].levelCounts[t.packing.lodLevels[s]]}))}collectPackedLayoutCells(t=this.cellSlotsByEntry){const e=[];for(const s of t.values())for(const n of s.values())e.push(n);return e}commitAttributePackers(){let t=0,e=0,s=0;const n=[];for(const i of this.attributePackers){const o=i.commit();t+=o.writtenSlots,e+=o.uploadedSlots,s+=o.estimatedUploadBytes,n.push(...o.slotRanges)}return{writtenSlots:t,uploadedSlots:e,estimatedUploadBytes:s,slotRanges:n}}cellSourceIndex(t,e,s){return t.lod===null?s:t.lod.nodes[e].sortedGaussianIndices[s]}copySourceToSlot(t,e,s,n,i,o,a,l){const h=t.lod?.octree.data??t.source;if(h===null)throw new Error("GaussianStore lost the source for a packed cloud");Kn(h.means.array,e,n,s),Kn(h.scalesOpacity.array,e,i,s),Kn(h.rotations.array,e,o,s),n[s*4+3]=t.cloud.objectId,Hu(h,e,a,s,l)}invalidatePacking(){this.packingInvalid=!0;for(const t of this.entries)t.packingDirty=!0,t.allocatedBudget=null,t.count=0,t.packing=null,t.cloud.updatePacking(0,null);for(const t of this.changeListeners)t({type:"changed",reason:"clouds"})}allocateObjectId(){const t=this.nextObjectId++;if(t>=$u)throw new RangeError("GaussianStore exhausted object IDs exactly representable in means.w");return t}nextSlotMarkGeneration(t){return this.slotMarks.length!==t&&(this.slotMarks=new Uint32Array(t),this.slotMarkGeneration=0),this.slotMarkGeneration++,this.slotMarkGeneration===4294967295&&(this.slotMarks.fill(0),this.slotMarkGeneration=1),this.slotMarkGeneration}assertUsable(){if(this.disposed)throw new Error("GaussianStore has been disposed")}}function Us(r,t,e=4){const s=new Hn(t,e);return s.name=r,s}function Kn(r,t,e,s){e.set(r.subarray(t*4,t*4+4),s*4)}function Hu(r,t,e,s,n){const i=r.shCoefficientCount,o=Math.min(i,n),a=s*n;if(e.fill(0,a,a+n),r.shFormat==="rgb8e8"){const c=t*i;e.set(r.shCoefficients.array.subarray(c,c+o),a);return}const l=r.shCoefficients.array,h=t*i*4;for(let c=0;c<o;c++){const u=h+c*4;e[a+c]=Su(l[u],l[u+1],l[u+2])}}function ti(r){return 48+r.shCoefficientCount*Kr(r.shFormat)}function ju(r){const t=r.split(/[?#]/,1)[0]??r;return t.slice(t.lastIndexOf("/")+1)||"GaussianCloud"}function ei(r){if(!Number.isSafeInteger(r))throw new RangeError("GaussianCloud packing priority must be a safe integer");return r}function Yu(r){if(r!=="auto"&&(!Number.isSafeInteger(r)||r<=0))throw new RangeError(\'GaussianStore maxGaussians must be "auto" or a positive safe integer\');return r}function Xu(r){const t=new Au;return new no(t,{...r,targetPlanner:new Fu(t)})}function po(r){r!==null&&"dispose"in r&&typeof r.dispose=="function"&&r.dispose()}function Zu(r,t){if(!Number.isSafeInteger(r)||r<0||r>t)throw new RangeError(`GaussianStore budget allocation must be an integer in [0, ${t}]`)}function Ju(r,t){if(t.nodeIds.length!==t.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const e=new Set;let s=0;for(let n=0;n<t.nodeIds.length;n++){const i=t.nodeIds[n],o=r.nodes[i],a=r.octree.nodes[i],l=t.lodLevels[n],h=o?.levelCounts[l];if(h===void 0||a===void 0)throw new RangeError(`GaussianLod packing references invalid node ${i} or level ${l}`);if(!a.isLeaf)throw new Error(`GaussianLodPacking must reference leaf nodes; node ${i} is internal`);if(e.has(i))throw new Error(`GaussianLod packing contains duplicate node ${i}`);e.add(i),s+=h}if(s!==t.gaussianCount)throw new RangeError(`GaussianLodPacking declares ${t.gaussianCount} Gaussians but selects ${s}`)}function Qu(r,t){const e=fo(r.maxStorageBufferBindingSize,"maxStorageBufferBindingSize"),s=fo(r.maxBufferSize,"maxBufferSize"),n=Math.max(16,(t+1)**2*Kr("rgb8e8"));return Math.floor(Math.min(e,s)/n)}function fo(r,t){if(!Number.isSafeInteger(r)||r<=0)throw new RangeError(`GPUDevice limit ${t} must be a positive safe integer`);return r}function Ku(r){const t=r.nodes,e=new Float32Array(t.length*7),s=new Uint32Array(t.length*2),n=new Uint32Array(t.length*2),i=[],o=[];for(const l of t){const h=l.id*7,{min:c,max:u}=l.raycastBounds;if(e.set([c.x,c.y,c.z,u.x,u.y,u.z,l.maxSplatRadius],h),s.set([i.length,l.children.length],l.id*2),i.push(...l.children),n.set([o.length,l.gaussianIndices?.length??0],l.id*2),l.gaussianIndices!==null)for(const d of l.gaussianIndices)o.push(d)}const a=r.data;return{means:a.means.array.slice().buffer,scalesOpacity:a.scalesOpacity.array.slice().buffer,rotations:a.rotations.array.slice().buffer,nodeBounds:e.buffer,nodeChildren:s.buffer,children:Uint32Array.from(i).buffer,nodeIndices:n.buffer,indices:Uint32Array.from(o).buffer}}const Bt=globalThis;let xe=null;const oe=new Map,si=new ta;Bt.onmessage=({data:r})=>{td(r).catch(t=>{Bt.postMessage({type:"error",requestId:r.requestId,message:t instanceof Error?t.message:String(t)})})};async function td(r){if(r.type==="init"){if(xe!==null)throw new Error("Gaussian Store already initialized");xe=new qu({maxGaussians:r.maxGaussians,defaultStreamingLod:r.defaultStreamingLod}),Bt.postMessage({type:"initialized",requestId:r.requestId});return}const t=xe;if(t===null)throw new Error("Gaussian Store is not initialized");if(r.type==="load"){if(oe.has(r.cloudId))throw new Error("Gaussian cloud already exists");const i=r.buffer!==void 0?await ed(r.buffer,r):await t.load(r.url,{name:r.name,priority:r.priority,octree:r.octree,lod:r.lod});oe.set(r.cloudId,i);const o=i.lod.octree,{min:a,max:l}=o.bounds,h=Ku(o);Bt.postMessage({type:"loaded",requestId:r.requestId,cloudId:r.cloudId,objectId:i.objectId,count:o.data.count,degree:o.data.shDegree,bounds:[a.x,a.y,a.z,l.x,l.y,l.z],raycast:h},Object.values(h));return}if(r.type==="remove"){const i=oe.get(r.cloudId);i!==void 0&&(t.remove(i),oe.delete(r.cloudId)),Bt.postMessage({type:"removed",requestId:r.requestId,cloudId:r.cloudId});return}if(r.type==="priority"){const i=oe.get(r.cloudId);if(i===void 0)throw new Error("Unknown Gaussian cloud");i.packingPriority=r.priority,Bt.postMessage({type:"priority-set",requestId:r.requestId,cloudId:r.cloudId});return}if(r.type==="invalidate"){const i=oe.get(r.cloudId);if(i===void 0)throw new Error("Unknown Gaussian cloud");i.invalidatePacking(),Bt.postMessage({type:"invalidated",requestId:r.requestId,cloudId:r.cloudId});return}if(r.type==="enable-lod-level"){const i=t.enablePackedLodLevelAttribute(),o=i.isAllocated?i.array.slice().buffer:void 0;Bt.postMessage({type:"lod-level-enabled",requestId:r.requestId,lodLevel:o},o===void 0?[]:[o]);return}if(r.type==="pack"){t.pack({limits:r.limits});const i=t.getPackedData(),o=sd(i),a=go();Bt.postMessage({type:"packed",requestId:r.requestId,count:i.count,degree:i.shDegree,capacity:t.maxGaussians,objectCapacity:t.objectCapacity,buffers:o,clouds:a,stats:t.lastPackStats},[...Object.values(o).filter(l=>l!==void 0),...a.map(({renderedIndices:l})=>l)]);return}si.position.set(...r.position),si.updateWorldMatrix(!0,!1);for(const{cloudId:i,matrix:o}of r.transforms){const a=oe.get(i);a!==void 0&&(a.matrixAutoUpdate=!1,a.matrix.copy(new ot().fromArray(o)))}const e=t.updateLod(si),s=[];if(e.appliedBatches>0){const i=t.getPackedData(),o=mo(e.writtenSlotRanges??[]);for(const l of o)s.push(nd(i,l.start,l.count));const a=mo(e.clearedSlotRanges??[]);for(const l of a)s.push({start:l.start,count:l.count,scalesOpacity:i.scalesOpacity.array.slice(l.start*4,(l.start+l.count)*4).buffer})}const n=e.appliedBatches>0?go():[];Bt.postMessage({type:"updated",requestId:r.requestId,appliedBatches:e.appliedBatches,pending:e.pending,clouds:n,patches:s,clearedSlotRanges:e.clearedSlotRanges??[],stats:t.lastPackStats},[...s.flatMap(({means:i,scalesOpacity:o,rotations:a,shCoefficients:l,lodLevel:h})=>[i,o,a,l,h].filter(c=>c!==void 0)),...n.map(({renderedIndices:i})=>i)])}async function ed(r,t){const e=new Xn().parse(r);let s=null,n=null;try{if(s=ns.build(e,{...t.octree,ownsData:!0}),n=is.build(s,{...t.lod,ownsOctree:!0}),xe===null)throw new Error("Gaussian Store is not initialized");return xe.addLod(n,{name:t.name,priority:t.priority,ownsLod:!0})}catch(i){throw n!==null?n.dispose():s!==null?s.dispose():e.dispose(),i}}function go(){return[...oe].map(([r,t])=>({cloudId:r,count:t.gaussianCount,renderedIndices:t.lodPacking===null?new ArrayBuffer(0):t.lod.indicesForPacking(t.lodPacking).buffer}))}function sd(r){return{means:r.means.array.slice().buffer,scalesOpacity:r.scalesOpacity.array.slice().buffer,rotations:r.rotations.array.slice().buffer,shCoefficients:r.shCoefficients.array.slice().buffer,lodLevel:xe?.attributes.get("lodLevel")?.array.slice().buffer}}function nd(r,t,e){const s=t+e;return{start:t,count:e,means:r.means.array.slice(t*4,s*4).buffer,scalesOpacity:r.scalesOpacity.array.slice(t*4,s*4).buffer,rotations:r.rotations.array.slice(t*4,s*4).buffer,shCoefficients:r.shCoefficients.array.slice(t*r.shCoefficientCount,s*r.shCoefficientCount).buffer,lodLevel:xe?.attributes.get("lodLevel")?.array.slice(t,s).buffer}}function mo(r){const t=[...r].sort((s,n)=>s.start-n.start),e=[];for(const s of t){const n=e[e.length-1];n!==void 0&&s.start<=n.start+n.count?n.count=Math.max(n.start+n.count,s.start+s.count)-n.start:e.push({...s})}return e}})();\n', As = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", ar], { type: "text/javascript;charset=utf-8" });
function di(a) {
  let t;
  try {
    if (t = As && (self.URL || self.webkitURL).createObjectURL(As), !t) throw "";
    const e = new Worker(t, {
      name: a?.name
    });
    return e.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), e;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(ar),
      {
        name: a?.name
      }
    );
  }
}
class ca {
  attributes = new qe();
  packedShFormat = "rgb8e8";
  maxGaussiansOption;
  layoutVersion = 0;
  worker;
  ownsTransport;
  pending = /* @__PURE__ */ new Map();
  remoteClouds = /* @__PURE__ */ new Map();
  changeListeners = /* @__PURE__ */ new Set();
  initialized;
  nextRequestId = 0;
  nextCloudId = 0;
  generation = 0;
  remoteData = null;
  remoteInvalid = !1;
  packInFlight = !1;
  updateInFlight = !1;
  updatePending = !1;
  remoteDisposed = !1;
  remoteCapacity = 0;
  remoteStats = null;
  remoteVersion = 0;
  remoteObjectCapacity = 0;
  lastCameraKey = "";
  lastError = null;
  constructor(t = {}) {
    if (t.loader || t.budgetingStrategy || t.defaultPackingStrategy)
      throw new Error(
        "WorkerGaussianBackend currently supports the built-in loader and packing strategies"
      );
    this.maxGaussiansOption = t.maxGaussians ?? "auto", this.ownsTransport = t.transport === void 0, this.worker = t.transport ?? new di({ name: "3dgs-store" }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError), this.initialized = this.send({
      type: "init",
      maxGaussians: this.maxGaussiansOption,
      defaultStreamingLod: t.defaultStreamingLod
    }).then((e) => {
      if (e.type !== "initialized")
        throw new Error("Unexpected Store initialization result");
    });
  }
  get clouds() {
    return [...this.remoteClouds.values()].map(({ cloud: t }) => t);
  }
  get count() {
    return this.clouds.reduce((t, e) => t + e.gaussianCount, 0);
  }
  get shDegree() {
    let t = 0;
    for (const e of this.remoteClouds.values())
      e.degree > t && (t = e.degree);
    return t;
  }
  get needsPack() {
    return this.remoteInvalid;
  }
  get hasPackedData() {
    return this.remoteData !== null && !this.remoteInvalid;
  }
  get maxGaussians() {
    return this.remoteCapacity;
  }
  get objectCapacity() {
    return this.remoteObjectCapacity;
  }
  get lastPackStats() {
    return this.remoteStats;
  }
  get contentVersion() {
    return this.remoteVersion;
  }
  /** Allow a demand-driven renderer to redraw when a worker result arrives. */
  subscribe(t) {
    return this.changeListeners.add(t), () => {
      this.changeListeners.delete(t);
    };
  }
  getBounds(t) {
    const e = this.findCloud(t);
    if (e?.cloud !== t)
      throw new Error("Cloud does not belong to this Store");
    return e.bounds;
  }
  getSourceCount(t) {
    const e = this.findCloud(t);
    if (e?.cloud !== t)
      throw new Error("Cloud does not belong to this Store");
    return e.sourceCount;
  }
  async load(t, e = {}) {
    if (e.packingStrategy !== void 0)
      throw new Error("Custom packing strategies are not serializable");
    const s = typeof document > "u" ? t : new URL(t, document.baseURI).href;
    await this.initialized;
    const r = this.nextCloudId++, i = await this.send({
      type: "load",
      cloudId: r,
      url: s,
      name: e.name,
      priority: e.priority,
      octree: e.octree,
      lod: e.lod
    }).catch((n) => {
      throw this.emitError(Ie(n)), n;
    });
    return this.attachLoaded(
      i,
      r,
      e.name ?? t,
      e.priority ?? 0
    );
  }
  async loadBuffer(t, e = {}) {
    if (e.packingStrategy !== void 0)
      throw new Error("Custom packing strategies are not serializable");
    await this.initialized;
    const s = this.nextCloudId++, r = await this.send(
      {
        type: "load",
        cloudId: s,
        buffer: t,
        name: e.name,
        priority: e.priority,
        octree: e.octree,
        lod: e.lod
      },
      [t]
    ).catch((i) => {
      throw this.emitError(Ie(i)), i;
    });
    return this.attachLoaded(
      r,
      s,
      e.name ?? "GaussianCloud",
      e.priority ?? 0
    );
  }
  add() {
    throw new Error(
      "Use loadBuffer() to transfer source data to WorkerGaussianBackend"
    );
  }
  addLod(t, e) {
    throw new Error("Build the LOD in the worker with load() or loadBuffer()");
  }
  packLodBatch(t) {
    throw new Error("Streaming LOD batches are scheduled by the worker");
  }
  enablePackedLodLevelAttribute() {
    const t = this.attributes.get("lodLevel");
    if (t !== void 0) return t;
    const e = this.attributes[ge](
      "lodLevel",
      "u32"
    );
    return this.initialized.then(() => this.send({ type: "enable-lod-level" })).then((s) => {
      if (s.type !== "lod-level-enabled")
        throw new Error("Unexpected LOD attribute response");
      s.lodLevel !== void 0 && !this.remoteDisposed && (e[ee](
        new Uint32Array(s.lodLevel)
      ), this.notify("content"));
    }).catch((s) => {
      this.fail(s);
    }), e;
  }
  pack({ limits: t }) {
    if (this.checkError(), !this.remoteInvalid || this.packInFlight || this.remoteDisposed) return;
    this.packInFlight = !0;
    const e = this.generation;
    this.send({ type: "pack", limits: t }).then((s) => {
      if (s.type !== "packed")
        throw new Error("Unexpected Store pack result");
      if (e !== this.generation || this.remoteDisposed) return;
      const r = this.remoteData;
      this.remoteData = new pe(
        {
          means: ae(
            "3dgs.store.means-object",
            new Float32Array(s.buffers.means)
          ),
          scalesOpacity: ae(
            "3dgs.store.scales-opacity",
            new Float32Array(s.buffers.scalesOpacity)
          ),
          rotations: ae(
            "3dgs.store.rotations",
            new Float32Array(s.buffers.rotations)
          ),
          shCoefficients: ae(
            "3dgs.store.sh-coefficients",
            new Uint32Array(s.buffers.shCoefficients),
            1
          )
        },
        {
          count: s.count,
          shDegree: s.degree,
          shFormat: "rgb8e8",
          ownsBuffers: !0
        }
      ), r?.dispose(), this.remoteCapacity = s.capacity, this.remoteObjectCapacity = s.objectCapacity, this.remoteStats = s.stats;
      const i = this.attributes.get("lodLevel");
      i !== void 0 && s.buffers.lodLevel !== void 0 && i[ee](
        new Uint32Array(s.buffers.lodLevel)
      ), this.applyCloudStates(s.clouds), this.remoteInvalid = !1, this.updatePending = !0, this.lastCameraKey = "", this.layoutVersion++, this.remoteVersion++, this.notify("layout");
    }).catch((s) => {
      this.fail(s);
    }).finally(() => {
      this.packInFlight = !1;
    });
  }
  updateLod(t) {
    if (this.checkError(), this.remoteData === null || this.remoteInvalid || this.remoteDisposed)
      return { appliedBatches: 0, pending: this.remoteInvalid, clouds: [] };
    t.updateWorldMatrix(!0, !1);
    const e = t.getWorldPosition(new Y()), s = this.clouds.map((i) => (i.updateWorldMatrix(!0, !1), {
      cloudId: this.findCloud(i).remoteId,
      matrix: i.matrixWorld.toArray()
    })), r = JSON.stringify([
      e.x,
      e.y,
      e.z,
      s
    ]);
    if (!this.updateInFlight && (this.updatePending || r !== this.lastCameraKey)) {
      this.updateInFlight = !0, this.lastCameraKey = r;
      const i = this.generation;
      this.send({
        type: "update",
        position: [e.x, e.y, e.z],
        transforms: s
      }).then((n) => {
        if (n.type !== "updated")
          throw new Error("Unexpected Store update result");
        if (!(i !== this.generation || this.remoteDisposed) && (this.updatePending = n.pending, !(n.appliedBatches === 0 || this.remoteData === null))) {
          for (const o of n.patches) this.applyPatch(o);
          this.applyCloudStates(n.clouds), this.remoteStats = n.stats, this.remoteVersion++, this.notify("content");
        }
      }).catch((n) => {
        this.fail(n);
      }).finally(() => {
        this.updateInFlight = !1;
      });
    }
    return {
      appliedBatches: 0,
      pending: this.updateInFlight || this.updatePending,
      clouds: []
    };
  }
  getPackedData() {
    if (this.checkError(), this.remoteData === null || this.remoteInvalid)
      throw new Error(
        "WorkerGaussianBackend is not packed yet or its layout has changed"
      );
    return this.remoteData;
  }
  remove(t) {
    const e = this.findCloud(t);
    e !== void 0 && (this.remoteClouds.delete(e.remoteId), t.removeFromParent(), this.generation++, this.remoteInvalid = !0, this.notify("clouds"), this.send({ type: "remove", cloudId: e.remoteId }).catch(
      (s) => {
        this.fail(s);
      }
    ));
  }
  updatePackingPriority(t, e) {
    const s = this.findCloud(t);
    if (s === void 0)
      throw new Error("Cloud does not belong to this Store");
    if (!Number.isSafeInteger(e))
      throw new RangeError("Packing priority must be a safe integer");
    t.updatePackingPriority(e), this.generation++, this.remoteInvalid = !0, this.notify("layout"), this.send({
      type: "priority",
      cloudId: s.remoteId,
      priority: e
    }).catch((r) => {
      this.fail(r);
    });
  }
  invalidateCloudPacking(t) {
    const e = this.findCloud(t);
    if (e === void 0)
      throw new Error("Cloud does not belong to this Store");
    this.generation++, this.remoteInvalid = !0, this.notify("layout"), this.send({ type: "invalidate", cloudId: e.remoteId }).catch(
      (s) => {
        this.fail(s);
      }
    );
  }
  dispose() {
    if (!this.remoteDisposed) {
      this.remoteDisposed = !0, this.worker.removeEventListener("message", this.handleMessage), this.worker.removeEventListener("error", this.handleError), this.ownsTransport && this.worker.terminate?.();
      for (const t of this.pending.values())
        t.reject(new Error("WorkerGaussianBackend disposed"));
      this.pending.clear();
      for (const { cloud: t } of this.remoteClouds.values())
        t.removeFromParent();
      this.remoteClouds.clear(), this.remoteData?.dispose(), this.remoteData = null, this.changeListeners.clear(), this.attributes[fe]();
    }
  }
  attachLoaded(t, e, s, r) {
    if (t.type !== "loaded" || t.cloudId !== e)
      throw new Error("Unexpected Store load result");
    if (this.remoteDisposed) throw new Error("WorkerGaussianBackend disposed");
    const i = new de(
      this,
      t.objectId,
      0,
      s,
      null,
      null,
      r
    ), n = new ue(t.raycast);
    return i.setRaycastIndex(n), this.remoteClouds.set(e, {
      remoteId: e,
      cloud: i,
      raycast: n,
      bounds: t.bounds,
      sourceCount: t.count,
      degree: t.degree
    }), this.generation++, this.remoteInvalid = !0, this.notify("clouds"), i;
  }
  applyCloudStates(t) {
    for (const e of t) {
      const s = this.remoteClouds.get(e.cloudId);
      s !== void 0 && (s.cloud.updatePacking(e.count, null), s.raycast.setRenderedIndices(e.renderedIndices));
    }
  }
  findCloud(t) {
    for (const e of this.remoteClouds.values())
      if (e.cloud === t) return e;
  }
  applyPatch(t) {
    const e = this.remoteData, s = [{ start: t.start, count: t.count }];
    t.means !== void 0 && (e.means.array.set(
      new Float32Array(t.means),
      t.start * 4
    ), H(e.means, s, 4)), t.scalesOpacity !== void 0 && (e.scalesOpacity.array.set(
      new Float32Array(t.scalesOpacity),
      t.start * 4
    ), H(e.scalesOpacity, s, 4)), t.rotations !== void 0 && (e.rotations.array.set(
      new Float32Array(t.rotations),
      t.start * 4
    ), H(e.rotations, s, 4)), t.shCoefficients !== void 0 && (e.shCoefficients.array.set(
      new Uint32Array(t.shCoefficients),
      t.start * e.shCoefficientCount
    ), H(
      e.shCoefficients,
      s,
      e.shCoefficientCount
    ));
    const r = this.attributes.get("lodLevel");
    t.lodLevel !== void 0 && r?.isAllocated && (r.array.set(new Uint32Array(t.lodLevel), t.start), r[me](s));
  }
  send(t, e) {
    if (this.remoteDisposed)
      return Promise.reject(new Error("WorkerGaussianBackend disposed"));
    const s = ++this.nextRequestId;
    return new Promise((r, i) => {
      this.pending.set(s, { resolve: r, reject: i });
      try {
        this.worker.postMessage({ ...t, requestId: s }, e ?? []);
      } catch (n) {
        this.pending.delete(s), i(n);
      }
    });
  }
  handleMessage = ({
    data: t
  }) => {
    const e = this.pending.get(t.requestId);
    e !== void 0 && (this.pending.delete(t.requestId), t.type === "error" ? e.reject(new Error(t.message)) : e.resolve(t));
  };
  handleError = (t) => {
    const e = new Error(t.message);
    this.fail(e);
    for (const s of this.pending.values()) s.reject(e);
    this.pending.clear();
  };
  checkError() {
    if (this.lastError !== null) throw this.lastError;
  }
  notify(t) {
    for (const e of this.changeListeners)
      e({ type: "changed", reason: t });
  }
  fail(t) {
    this.lastError = Ie(t), this.emitError(this.lastError);
  }
  emitError(t) {
    for (const e of this.changeListeners)
      e({ type: "error", error: t });
  }
}
function ae(a, t, e = 4) {
  const s = new gt(t, e);
  return s.name = a, s;
}
function Ie(a) {
  return a instanceof Error ? a : new Error(String(a));
}
class Rs {
  constructor(t, e, s) {
    this.octreeNodeId = t, this.sortedGaussianIndices = e, this.levelCounts = s;
  }
  octreeNodeId;
  sortedGaussianIndices;
  levelCounts;
}
const pi = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 }
];
class Gt {
  constructor(t, e) {
    this.octree = t, this.levels = mi(e.levels ?? pi), this.ownsOctree = e.ownsOctree ?? !1;
    const s = e.importance ?? gi, r = new Float64Array(t.data.count);
    for (let i = 0; i < r.length; i++) {
      const n = s(i, t);
      r[i] = Number.isFinite(n) ? n : -1 / 0;
    }
    this.nodes = t.nodes.map((i) => {
      if (i.gaussianIndices === null)
        return new Rs(
          i.id,
          new Uint32Array(),
          new Uint32Array(this.levels.length)
        );
      const n = Uint32Array.from(
        Array.from(i.gaussianIndices).sort(
          (o, l) => r[l] - r[o] || o - l
        )
      );
      return new Rs(
        i.id,
        n,
        Uint32Array.from(
          this.levels.map(
            ({ retention: o }) => Math.min(
              n.length,
              Math.max(1, Math.ceil(n.length * o))
            )
          )
        )
      );
    });
  }
  octree;
  static build(t, e = {}) {
    return new Gt(t, e);
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
      const n = t.nodeIds[i], o = this.getLeafNode(n);
      if (s.has(n))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${n}`
        );
      s.add(n);
      const l = t.lodLevels[i], h = o.levelCounts[l];
      if (h === void 0)
        throw new RangeError(`GaussianLod level ${l} does not exist`);
      if (r + h > e.length)
        throw new RangeError("GaussianLodPacking gaussianCount is too small");
      for (let u = 0; u < h; u++)
        e[r++] = o.sortedGaussianIndices[u];
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
    const n = this.octree.data.means.array, o = this.octree.data.scalesOpacity.array, l = new P(), h = new P(), u = [], p = /* @__PURE__ */ new Set();
    for (let d = 0; d < e.nodeIds.length; d++) {
      const m = e.nodeIds[d], g = this.getLeafNode(m);
      if (p.has(m))
        throw new Error(
          `GaussianLodPacking contains duplicate leaf node ${m}`
        );
      p.add(m);
      const f = e.lodLevels[d], c = g.levelCounts[f];
      if (c === void 0)
        throw new RangeError(`GaussianLod level ${f} does not exist`);
      const y = this.octree.nodes[m], _ = Math.max(0, r - 3) * y.maxSplatRadius, M = _ === 0 ? y.raycastBounds : y.raycastBounds.clone().expandByScalar(_);
      if (t.intersectsBox(M))
        for (let v = 0; v < c; v++) {
          const b = g.sortedGaussianIndices[v], T = b * 4;
          l.set(n[T], n[T + 1], n[T + 2]);
          const k = Math.max(
            o[T],
            o[T + 1],
            o[T + 2]
          ) * r;
          t.closestPointToPoint(l, h), !(h.distanceToSquared(l) > k * k) && u.push({
            gaussianIndex: b,
            distance: t.origin.distanceTo(h),
            point: h.clone()
          });
        }
    }
    return u.sort((d, m) => d.distance - m.distance), u.length > i && (u.length = i), u;
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
function mi(a) {
  if (a.length === 0 || a.length > 256)
    throw new RangeError("GaussianLod requires between 1 and 256 levels");
  let t = 0;
  const e = a.map(({ retention: s }) => {
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
function gi(a, t) {
  const e = t.data.scalesOpacity.array, s = a * 4, r = [e[s], e[s + 1], e[s + 2]];
  return r.sort((i, n) => n - i), e[s + 3] * r[0] * r[1];
}
function $t(a) {
  if (!Number.isInteger(a) || a < 0)
    throw new RangeError("Gaussian LOD budget must be a non-negative integer");
}
class fi {
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
    const r = t.octree.leafNodeIds.slice(), i = new Uint8Array(r.length);
    return i.fill(t.finestLevel), { nodeIds: r, lodLevels: i, gaussianCount: s };
  }
}
function He(a, t, e) {
  return a.updateWorldMatrix(!0, !1), t.updateWorldMatrix(!0, !1), a.getWorldPosition(e), t.worldToLocal(e);
}
function Ye(a, t) {
  const e = t instanceof P ? t.clone() : a.octree.bounds.getCenter(new P()), s = a.octree.rootBounds.getSize(new P()), r = Math.max(s.length() * 0.5, Number.EPSILON), i = new P(), n = Array.from(a.octree.leafNodeIds, (o) => (a.octree.nodes[o].bounds.getCenter(i), {
    nodeId: o,
    radius: i.distanceTo(e) / r
  }));
  return n.sort(
    (o, l) => o.radius - l.radius || o.nodeId - l.nodeId
  ), n;
}
class yi {
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
      He(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if ($t(e), e === 0) return xi();
    const s = this.lodLevel === "finest" ? t.finestLevel : this.lodLevel;
    if (s >= t.levelCount)
      throw new RangeError(`Gaussian LOD level ${s} does not exist`);
    const r = Ye(t, this.center), i = [];
    let n = 0;
    for (const l of r) {
      const h = t.nodes[l.nodeId].levelCounts[s];
      if (n + h > e) break;
      i.push(l.nodeId), n += h;
    }
    const o = new Uint8Array(i.length);
    return o.fill(s), {
      nodeIds: Uint32Array.from(i),
      lodLevels: o,
      gaussianCount: n
    };
  }
}
function xi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class or {
  cameraCenter = new P();
  center;
  budgetShares;
  constructor(t = {}) {
    this.center = t.center instanceof P ? t.center.clone() : t.center ?? "bounds-center", this.budgetShares = bi(
      t.budgetShares ?? [0.8, 0.1, 0.1]
    );
  }
  setCenter(t) {
    return this.center = t instanceof P ? t.clone() : t, this;
  }
  setFromCamera(t, e) {
    return this.setCenter(
      He(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if ($t(e), e === 0) return wi();
    const s = t.octree.data.count;
    if (s <= e) {
      const p = t.octree.leafNodeIds.slice(), d = new Uint8Array(p.length);
      return d.fill(t.finestLevel), { nodeIds: p, lodLevels: d, gaussianCount: s };
    }
    const r = Ye(t, this.center), i = [
      t.finestLevel,
      Math.max(0, t.finestLevel - 1),
      0
    ], n = [], o = [];
    let l = 0, h = 0, u = 0;
    for (let p = 0; p < i.length; p++) {
      const d = this.budgetShares[p];
      if (u += d, d === 0) continue;
      const m = p === i.length - 1 ? e : Math.floor(e * u), g = i[p];
      for (; h < r.length; ) {
        const f = r[h], c = t.nodes[f.nodeId].levelCounts[g];
        if (l + c > m) break;
        n.push(f.nodeId), o.push(g), l += c, h++;
      }
    }
    return {
      nodeIds: Uint32Array.from(n),
      lodLevels: Uint8Array.from(o),
      gaussianCount: l
    };
  }
}
function bi(a) {
  let t = 0;
  for (const e of a) {
    if (!(e >= 0 && e <= 1))
      throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");
    t += e;
  }
  if (Math.abs(t - 1) > 1e-6)
    throw new RangeError("Tiered radial LOD budget shares must sum to 1");
  return Object.freeze([...a]);
}
function wi() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
class vi {
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
      He(t, e, this.cameraCenter)
    );
  }
  pack({ lod: t, maxGaussians: e }) {
    if ($t(e), e === 0) return Si();
    const s = Ye(t, this.center), r = s.map(
      ({ radius: o }) => Math.max(0, t.finestLevel - Math.floor(o / this.levelDistance))
    );
    let i = s.reduce(
      (o, l, h) => o + t.nodes[l.nodeId].levelCounts[r[h]],
      0
    );
    for (let o = s.length - 1; o >= 0 && i > e; o--) {
      const l = t.nodes[s[o].nodeId];
      for (; r[o] > 0 && i > e; ) {
        const h = l.levelCounts[r[o]];
        r[o] = r[o] - 1, i -= h - l.levelCounts[r[o]];
      }
    }
    let n = s.length;
    for (; n > 0 && i > e; ) {
      n--;
      const o = t.nodes[s[n].nodeId];
      i -= o.levelCounts[r[n]];
    }
    return {
      nodeIds: Uint32Array.from(
        s.slice(0, n).map(({ nodeId: o }) => o)
      ),
      lodLevels: Uint8Array.from(r.slice(0, n)),
      gaussianCount: i
    };
  }
}
function Si() {
  return {
    nodeIds: new Uint32Array(),
    lodLevels: new Uint8Array(),
    gaussianCount: 0
  };
}
function Ni(a) {
  const t = new Uint32Array(a.octree.leafNodeIds), e = new Float64Array(t.length * 3), s = new Uint32Array(t.length * a.levelCount);
  for (let o = 0; o < t.length; o++) {
    const l = t[o], h = a.octree.nodes[l].bounds, u = o * 3;
    e[u] = (h.min.x + h.max.x) * 0.5, e[u + 1] = (h.min.y + h.max.y) * 0.5, e[u + 2] = (h.min.z + h.max.z) * 0.5, s.set(a.nodes[l].levelCounts, o * a.levelCount);
  }
  const r = a.octree.rootBounds.max.x - a.octree.rootBounds.min.x, i = a.octree.rootBounds.max.y - a.octree.rootBounds.min.y, n = a.octree.rootBounds.max.z - a.octree.rootBounds.min.z;
  return {
    leafNodeIds: t,
    leafCenters: e,
    levelCounts: s,
    levelCount: a.levelCount,
    halfDiagonal: Math.max(
      Math.sqrt(
        r * r + i * i + n * n
      ) * 0.5,
      Number.EPSILON
    )
  };
}
const lr = `(function(){"use strict";function R(e){return{radii:new Float64Array(e),levels:new Uint8Array(e),order:Array.from({length:e},(n,r)=>r)}}function M(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l),x(e,n,l);const d=e.levelCount-1;let i=0;for(let t=0;t<s;t++){const u=l.order[t],h=Math.max(0,d-Math.floor(l.radii[u]/n.levelDistance));l.levels[t]=h,i+=e.levelCounts[u*e.levelCount+h]}for(let t=s-1;t>=0&&i>n.maxGaussians;t--){const u=l.order[t];for(;l.levels[t]>0&&i>n.maxGaussians;){const h=l.levels[t],f=u*e.levelCount;i-=e.levelCounts[f+h]-e.levelCounts[f+h-1],l.levels[t]=h-1}}let a=s;for(;a>0&&i>n.maxGaussians;){a--;const t=l.order[a];i-=e.levelCounts[t*e.levelCount+l.levels[a]]}for(let t=0;t<a;t++){const u=l.order[t];r[t]=e.leafNodeIds[u],o[t]=l.levels[t]}return{length:a,gaussianCount:i}}function A(e,n,r,o,l){const s=e.leafNodeIds.length;C(s,r,o,l);const d=e.levelCount-1;let i=0;for(let f=0;f<s;f++)i+=e.levelCounts[f*e.levelCount+d];if(i<=n.maxGaussians)return r.set(e.leafNodeIds),o.fill(d,0,s),{length:s,gaussianCount:i};x(e,n,l);const a=[d,Math.max(0,d-1),0];let t=0,u=0,h=0;for(let f=0;f<a.length;f++){const y=n.budgetShares[f];if(h+=y,y===0)continue;const G=f===a.length-1?n.maxGaussians:Math.floor(n.maxGaussians*h),L=a[f];for(;t<s;){const b=l.order[t],m=e.levelCounts[b*e.levelCount+L];if(u+m>G)break;r[t]=e.leafNodeIds[b],o[t]=L,u+=m,t++}}return{length:t,gaussianCount:u}}function D(e,n,r,o,l){return n.strategy==="tiered"?A(e,n,r,o,l):M(e,n,r,o,l)}function x(e,n,r){for(let o=0;o<e.leafNodeIds.length;o++){const l=o*3,s=e.leafCenters[l]-n.centerX,d=e.leafCenters[l+1]-n.centerY,i=e.leafCenters[l+2]-n.centerZ;r.radii[o]=Math.sqrt(s*s+d*d+i*i)/e.halfDiagonal,r.order[o]=o}r.order.sort((o,l)=>r.radii[o]-r.radii[l]||e.leafNodeIds[o]-e.leafNodeIds[l])}function C(e,n,r,o){if(n.length<e||r.length<e||o.radii.length<e||o.levels.length<e||o.order.length<e)throw new RangeError("Radial LOD worker buffers are too small")}const I=globalThis;let c=null,v=null;const g=[];I.onmessage=({data:e})=>{if(e.type==="init"){c=e.data,v=R(e.data.leafNodeIds.length),g.push(...e.buffers);return}if(e.type==="recycle"){g.push(e.buffer);return}if(c===null||v===null)throw new Error("Radial LOD worker was not initialized");const n=g.pop();if(n===void 0)throw new Error("Radial LOD worker exhausted its output pool");const r=new Uint32Array(n.nodeIds),o=new Uint8Array(n.lodLevels),l=performance.now(),s=D(c,e,r,o,v),d={type:"result",revision:e.revision,length:s.length,gaussianCount:s.gaussianCount,planningMs:performance.now()-l,buffer:n};I.postMessage(d,[n.nodeIds,n.lodLevels])}})();
`, Ps = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", lr], { type: "text/javascript;charset=utf-8" });
function Ti(a) {
  let t;
  try {
    if (t = Ps && (self.URL || self.webkitURL).createObjectURL(Ps), !t) throw "";
    const e = new Worker(t, {
      name: a?.name
    });
    return e.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), e;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(lr),
      {
        name: a?.name
      }
    );
  }
}
const _i = 2;
class Mi {
  constructor(t) {
    this.targetStrategy = t;
  }
  targetStrategy;
  worker = null;
  boundsCenter = new Y();
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
    this.worker = new Ti({
      name: "3dgs-radial-lod"
    }), this.worker.addEventListener("message", this.handleMessage), this.worker.addEventListener("error", this.handleError);
    const e = Ni(t), s = Array.from(
      { length: _i },
      () => Ci(e.leafNodeIds.length)
    ), r = {
      type: "init",
      data: e,
      buffers: s
    };
    this.worker.postMessage(r, [
      e.leafNodeIds.buffer,
      e.leafCenters.buffer,
      e.levelCounts.buffer,
      ...s.flatMap(({ nodeIds: i, lodLevels: n }) => [i, n])
    ]);
  }
  request(t) {
    this.assertUsable(), this.initialize(t.lod), this.initializeWorker(), this.releaseLatestResult();
    const e = this.targetStrategy.center instanceof Y ? this.targetStrategy.center : t.lod.octree.bounds.getCenter(this.boundsCenter), s = ++this.revision;
    this.latestRequestedRevision = s;
    const r = {
      type: "request",
      revision: s,
      centerX: e.x,
      centerY: e.y,
      centerZ: e.z,
      maxGaussians: t.maxGaussians
    }, n = {
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
      this.queuedRequest !== null && this.discarded++, this.queuedRequest = n;
      return;
    }
    this.dispatch(n);
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
      packing: Ei(e),
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
function Ci(a) {
  return {
    nodeIds: new ArrayBuffer(a * Uint32Array.BYTES_PER_ELEMENT),
    lodLevels: new ArrayBuffer(a * Uint8Array.BYTES_PER_ELEMENT)
  };
}
function Ei(a) {
  return {
    nodeIds: new Uint32Array(a.buffer.nodeIds, 0, a.length),
    lodLevels: new Uint8Array(a.buffer.lodLevels, 0, a.length),
    gaussianCount: a.gaussianCount
  };
}
const ki = 1024 * 1024, zi = 16, Li = 1.25;
class hr {
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
    if (this.targetStrategy = t, this.targetPlanner = e.targetPlanner ?? null, this.maxUploadBytesPerPack = e.maxUploadBytesPerPack ?? ki, this.maxChangedCellsPerPack = e.maxChangedCellsPerPack ?? zi, !(this.maxUploadBytesPerPack > 0) || !Number.isFinite(this.maxUploadBytesPerPack))
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
    return Fs(t.lod, e, t.maxGaussians), this.targetAvailable = !0, this.targetBudget = t.maxGaussians, this.targetDirty = !1, e;
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
        Fs(t.lod, e.packing, e.maxGaussians), this.targetAvailable = !0, this.targetBudget = e.maxGaussians, this.changes = this.planChanges(t.lod, e.packing), this.changeCursor = 0, this.latestTargetPlanningMs = e.planningMs, this.latestTargetRoundTripMs = e.roundTripMs;
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
    for (let n = 0; n < e.nodeIds.length; n++)
      s[e.nodeIds[n]] = e.lodLevels[n];
    const r = [], i = [];
    for (let n = this.appliedCellCount - 1; n >= 0; n--) {
      const o = this.appliedNodeIds[n], l = this.appliedLodLevels[n], h = s[o];
      (h < 0 || h < l) && r.push(
        Bs(
          t,
          o,
          l,
          h < 0 ? null : h
        )
      );
    }
    for (let n = 0; n < e.nodeIds.length; n++) {
      const o = e.nodeIds[n], l = e.lodLevels[n], h = this.appliedIndices[o], u = h < 0 ? null : this.appliedLodLevels[h];
      (u === null || l > u) && i.push(Bs(t, o, u, l));
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
function Os(a) {
  return a instanceof hr;
}
function Bs(a, t, e, s) {
  const r = a.nodes[t], i = e === null ? 0 : r.levelCounts[e], n = s === null ? 0 : r.levelCounts[s], o = Math.max(0, n - i), l = Math.max(0, i - n), h = e !== null && s !== null && e !== s ? Math.min(i, n) : 0, u = 48 + a.octree.data.shCoefficientCount * tr + 4;
  return {
    nodeId: t,
    lodLevel: s,
    gaussianDelta: n - i,
    estimatedUploadBytes: Math.ceil(
      (o * u + l * 16 + h * 4) * Li
    )
  };
}
function Fs(a, t, e) {
  if (t.gaussianCount > e)
    throw new RangeError(
      `Streaming LOD target exceeded its allocation of ${e} Gaussians`
    );
  if (t.nodeIds.length !== t.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  for (let i = 0; i < t.nodeIds.length; i++) {
    const n = t.nodeIds[i], o = t.lodLevels[i], h = a.nodes[n]?.levelCounts[o];
    if (h === void 0 || a.octree.nodes[n]?.isLeaf !== !0)
      throw new RangeError(
        `GaussianLod packing references invalid leaf ${n} or level ${o}`
      );
    if (s.has(n))
      throw new Error(`GaussianLod packing contains duplicate node ${n}`);
    s.add(n), r += h;
  }
  if (r !== t.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${t.gaussianCount} Gaussians but selects ${r}`
    );
}
class Ii {
  allocate({ remainingGaussians: t }) {
    return t;
  }
}
class da {
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
class Ai {
  constructor(t) {
    this.attribute = t;
  }
  attribute;
  writtenSlots = [];
  freshBuffer = !1;
  allocate(t) {
    this.writtenSlots.length = 0, this.attribute[ee](new Uint32Array(t)), this.freshBuffer = !0;
  }
  backfill(t) {
    const e = this.attribute.array;
    for (const s of t.cells)
      for (const r of s.slots)
        e[r] = s.lodLevel, this.writtenSlots.push(r);
  }
  updateCell(t) {
    const { previousCell: e, cell: s, retainedCount: r } = t, i = e?.lodLevel === s.lodLevel ? r : 0, n = this.attribute.array;
    for (let o = i; o < s.slots.length; o++) {
      const l = s.slots[o];
      n[l] = s.lodLevel, this.writtenSlots.push(l);
    }
  }
  commit() {
    const t = this.writtenSlots.length, e = Zt(this.writtenSlots, 16, 0.25), s = Jt(e);
    return this.freshBuffer || this.attribute[me](e), this.writtenSlots.length = 0, this.freshBuffer = !1, {
      writtenSlots: t,
      uploadedSlots: s,
      estimatedUploadBytes: s * Uint32Array.BYTES_PER_ELEMENT,
      slotRanges: e
    };
  }
}
const Ri = 16777216;
class pa {
  changeListeners = /* @__PURE__ */ new Set();
  loader;
  budgetingStrategy;
  defaultPackingStrategy;
  defaultStreamingLod;
  maxGaussiansOption;
  packedShFormat = "rgb8e8";
  /** Optional attributes indexed by the same gaussianIndex as the packed data. */
  attributes = new qe();
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
    this.loader = t.loader ?? new zs(), this.budgetingStrategy = t.budgetingStrategy ?? new Ii(), this.defaultPackingStrategy = t.defaultPackingStrategy ?? null, this.defaultStreamingLod = { ...t.defaultStreamingLod }, this.maxGaussiansOption = Bi(
      t.maxGaussians ?? "auto"
    );
  }
  subscribe(t) {
    return this.changeListeners.add(t), () => {
      this.changeListeners.delete(t);
    };
  }
  async loadBuffer(t, e = {}) {
    const s = new zs().parse(t);
    let r = null, i = null;
    try {
      return r = Vt.build(s, {
        ...e.octree,
        ownsData: !0
      }), i = Gt.build(r, { ...e.lod, ownsOctree: !0 }), this.addLod(i, {
        name: e.name,
        priority: e.priority,
        packingStrategy: e.packingStrategy,
        ownsLod: !0
      });
    } catch (n) {
      throw i !== null ? i.dispose() : r !== null ? r.dispose() : s.dispose(), n;
    }
  }
  getSourceCount(t) {
    const e = this.entries.find((s) => s.cloud === t);
    if (e === void 0)
      throw new Error("Cloud does not belong to this Store");
    return e.sourceGaussianCount;
  }
  getBounds(t) {
    const e = this.entries.find((i) => i.cloud === t);
    if (e === void 0)
      throw new Error("Cloud does not belong to this Store");
    if (e.lod !== null) {
      const { min: i, max: n } = e.lod.octree.bounds;
      return [i.x, i.y, i.z, n.x, n.y, n.z];
    }
    const s = e.source.means.array, r = [
      1 / 0,
      1 / 0,
      1 / 0,
      -1 / 0,
      -1 / 0,
      -1 / 0
    ];
    for (let i = 0; i < e.sourceGaussianCount; i++)
      for (let n = 0; n < 3; n++) {
        const o = s[i * 4 + n];
        r[n] = Math.min(r[n], o), r[n + 3] = Math.max(r[n + 3], o);
      }
    return r;
  }
  get maxGaussians() {
    return this.gaussianCapacity;
  }
  /** True after registration changes and until pack() succeeds. */
  get needsPack() {
    return this.packingInvalid;
  }
  get hasPackedData() {
    return this.packedData !== null;
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
    const e = this.attributes[ge](
      "lodLevel",
      "u32"
    ), s = new Ai(e);
    return this.attributePackers.push(s), this.packedData !== null && (s.allocate(this.packedData.count), s.backfill({ cells: this.collectPackedLayoutCells() }), s.commit()), e;
  }
  async load(t, e = {}) {
    this.assertUsable();
    const s = await this.loader.load(t);
    let r = null, i = null;
    try {
      return r = Vt.build(s, {
        ...e.octree,
        ownsData: !0
      }), i = Gt.build(r, {
        ...e.lod,
        ownsOctree: !0
      }), this.addLod(i, {
        name: e.name ?? Oi(t),
        priority: e.priority,
        packingStrategy: e.packingStrategy,
        ownsLod: !0
      });
    } catch (n) {
      throw i !== null ? i.dispose() : r !== null ? r.dispose() : s.dispose(), n;
    }
  }
  add(t, e = {}) {
    this.assertUsable();
    const s = this.allocateObjectId(), r = Pe(e.priority ?? 0), i = new de(
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
      lastLodFocus: new Y(Number.NaN, Number.NaN, Number.NaN),
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
    const s = this.allocateObjectId(), r = Pe(e.priority ?? 0), i = new de(
      this,
      s,
      0,
      e.name,
      t,
      null,
      r
    ), n = e.packingStrategy ?? this.defaultPackingStrategy ?? Fi(this.defaultStreamingLod);
    return this.entries.push({
      cloud: i,
      count: 0,
      sourceGaussianCount: t.octree.data.count,
      sourceDegree: t.octree.data.shDegree,
      priority: r,
      packingStrategy: n,
      ownsPackingStrategy: e.packingStrategy === void 0 && this.defaultPackingStrategy === null,
      lastLodFocus: new Y(Number.NaN, Number.NaN, Number.NaN),
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
    this.cloudList.splice(this.cloudList.indexOf(t), 1), s?.source !== null && s?.ownsSource === !0 && s.source.dispose(), s?.lod !== null && s?.ownsLod === !0 && s.lod.dispose(), s?.ownsPackingStrategy === !0 && Us(s.packingStrategy), t.removeFromParent(), this.invalidatePacking();
  }
  /** Resolve all registered clouds and materialize one packed buffer set. */
  pack({ limits: t }) {
    if (this.assertUsable(), this.entries.length === 0)
      throw new Error("GaussianStore must contain at least one GaussianCloud");
    const e = Vi(t, this.shDegree), s = this.maxGaussiansOption === "auto" ? e : Math.min(e, this.maxGaussiansOption), r = performance.now(), i = this.planPackings(s), n = performance.now() - r, o = Math.min(
      s,
      this.entries.reduce((m, g) => m + g.sourceGaussianCount, 0)
    ), l = this.packedData, h = l !== null && l.count === o && l.shDegree === this.shDegree && l.shFormat === this.packedShFormat && this.packedObjectCapacity === this.objectCapacity, u = performance.now(), p = h ? this.updatePackedData(i, l) : this.buildPackedData(i, o), d = performance.now() - u;
    for (const m of i)
      m.entry.count = m.count, m.entry.packing = m.packing, m.entry.allocatedBudget = m.allocatedBudget, m.entry.packingDirty = !1, m.entry.cloud.updatePacking(m.count, m.packing);
    this.packedData = p.data, this.cellSlotsByEntry = p.cellSlotsByEntry, this.freeSlots = p.freeSlots, this.gaussianCapacity = s, this.packedObjectCapacity = this.objectCapacity, this.packingInvalid = !1, this.latestPackStats = { ...p.stats, planningMs: n, slotUpdateMs: d }, h || (this.layoutVersion++, l?.dispose()), this.packedContentVersion++;
    for (const m of this.changeListeners)
      m({
        type: "changed",
        reason: h ? "content" : "layout"
      });
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
    const e = this.entries.find((N) => N.cloud === t);
    if (e === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    if (e.lod === null || e.packing === null || e.allocatedBudget === null)
      throw new Error("GaussianCloud is not an initialized LOD entry");
    const s = e.packingStrategy;
    if (!Os(s))
      throw new Error(
        "GaussianCloud must use StreamingLodPackingStrategy for incremental LOD batches"
      );
    const r = performance.now(), i = s.takeNextBatch({
      lod: e.lod,
      maxGaussians: e.allocatedBudget
    }), n = performance.now() - r;
    if (i === null)
      return { applied: !1, pending: s.needsPack };
    const o = this.packedData, l = this.cellSlotsByEntry.get(e);
    if (l === void 0)
      throw new Error("GaussianStore is missing the packed LOD cell layout");
    const h = performance.now(), u = l, p = this.freeSlots, d = this.scratchReleasedSlots;
    d.length = 0;
    const m = /* @__PURE__ */ new Map();
    for (const N of i.transitions) {
      const z = l.get(N.nodeId), R = N.lodLevel === null ? 0 : e.lod.nodes[N.nodeId].levelCounts[N.lodLevel], E = Math.min(
        z?.slots.length ?? 0,
        R
      );
      if (m.set(N.nodeId, {
        previousCell: z,
        retainedCount: E
      }), z !== void 0)
        for (let I = E; I < z.slots.length; I++) {
          const O = z.slots[I];
          p.push(O), d.push(O);
        }
    }
    const g = this.scratchWrittenSlots;
    g.length = 0;
    for (const N of i.transitions) {
      const z = m.get(N.nodeId), { previousCell: R, retainedCount: E } = z;
      if (N.lodLevel === null) {
        u.delete(N.nodeId);
        continue;
      }
      const I = e.lod.nodes[N.nodeId].levelCounts[N.lodLevel], O = R?.slots, W = O !== void 0 && O.length === I ? O : new Uint32Array(I);
      W !== O && O !== void 0 && E > 0 && W.set(O.subarray(0, E));
      for (let $ = E; $ < I; $++) {
        const lt = p.pop();
        if (lt === void 0)
          throw new Error("GaussianStore slot allocator exhausted capacity");
        this.copySourceToSlot(
          e,
          this.cellSourceIndex(e, N.nodeId, $),
          lt,
          o.means.array,
          o.scalesOpacity.array,
          o.rotations.array,
          o.shCoefficients.array,
          o.shCoefficientCount
        ), W[$] = lt, g.push(lt);
      }
      const tt = {
        lodLevel: N.lodLevel,
        slots: W
      };
      for (const $ of this.attributePackers)
        $.updateCell({ previousCell: R, cell: tt, retainedCount: E });
      u.set(N.nodeId, tt);
    }
    const f = this.nextSlotMarkGeneration(o.count);
    for (const N of g) this.slotMarks[N] = f;
    const c = this.scratchClearedSlots;
    c.length = 0;
    for (const N of d)
      this.slotMarks[N] !== f && c.push(N);
    const y = o.scalesOpacity.array;
    for (const N of c) y[N * 4 + 3] = 0;
    const _ = Zt(g, 4, 0.15), M = Zt(c, 16, 0.25);
    H(o.means, _, 4), H(o.scalesOpacity, _, 4), H(o.scalesOpacity, M, 4), H(o.rotations, _, 4), H(
      o.shCoefficients,
      _,
      o.shCoefficientCount * o.shCoefficients.itemSize
    );
    const v = this.commitAttributePackers(), b = this.count - e.count + i.packing.gaussianCount, T = Jt(_), k = Jt(M), C = performance.now() - h;
    e.count = i.packing.gaussianCount, e.packing = i.packing, e.packingDirty = !1, e.cloud.updatePacking(e.count, e.packing), this.cellSlotsByEntry.set(e, u), this.freeSlots = p, this.latestPackStats = {
      fullRebuild: !1,
      slotCapacity: o.count,
      activeGaussians: b,
      reusedSlots: b - g.length,
      writtenSlots: g.length,
      clearedSlots: c.length,
      estimatedUploadBytes: T * Re(o) + k * 16 + v.estimatedUploadBytes,
      writtenSlotRanges: _,
      clearedSlotRanges: M,
      planningMs: n,
      slotUpdateMs: C
    }, this.packedContentVersion++;
    for (const N of this.changeListeners)
      N({ type: "changed", reason: "content" });
    return { applied: !0, pending: i.pending };
  }
  planPackings(t) {
    const e = [...this.entries].sort(
      (i, n) => i.priority - n.priority || i.cloud.objectId - n.cloud.objectId
    ), s = [];
    let r = 0;
    for (const i of e) {
      const n = Math.max(0, t - r), o = this.budgetingStrategy.allocate({
        capacity: t,
        allocatedGaussians: r,
        remainingGaussians: n,
        entry: {
          cloud: i.cloud,
          priority: i.priority,
          insertionIndex: i.cloud.objectId,
          sourceGaussianCount: i.sourceGaussianCount
        }
      });
      if (Ui(o, n), i.lod === null) {
        if (i.sourceGaussianCount > o)
          throw new RangeError(
            `${i.cloud.name} requires ${i.sourceGaussianCount} Gaussians but its Store allocation is ${o}`
          );
        s.push({
          entry: i,
          count: i.sourceGaussianCount,
          packing: null,
          allocatedBudget: o,
          selectionChanged: i.packingDirty || i.allocatedBudget !== o
        }), r += i.sourceGaussianCount;
        continue;
      }
      const l = i.packingStrategy, h = i.packingDirty || i.allocatedBudget !== o || i.packing === null, u = !h && i.packing !== null ? i.packing : l.pack({
        lod: i.lod,
        maxGaussians: o
      });
      if (u.gaussianCount > o)
        throw new RangeError(
          `${l.constructor.name} exceeded its allocation of ${o} Gaussians`
        );
      Di(i.lod, u), s.push({
        entry: i,
        count: u.gaussianCount,
        packing: u,
        allocatedBudget: o,
        selectionChanged: h
      }), r += u.gaussianCount;
    }
    return s;
  }
  /** Called by GaussianCloud when its priority changes. */
  updatePackingPriority(t, e) {
    this.assertUsable();
    const s = this.entries.find((i) => i.cloud === t);
    if (s === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    const r = Pe(e);
    s.priority = r, t.updatePackingPriority(r), this.invalidatePacking();
  }
  /** Mark one cloud for strategy re-evaluation after its strategy parameters change. */
  invalidateCloudPacking(t) {
    this.assertUsable();
    const e = this.entries.find((s) => s.cloud === t);
    if (e === void 0)
      throw new Error("GaussianCloud does not belong to this GaussianStore");
    e.packingDirty = !0, this.packingInvalid = !0;
    for (const s of this.changeListeners)
      s({ type: "changed", reason: "layout" });
  }
  /**
   * Update camera-relative streaming LODs and apply at most one
   * bounded upload batch per cloud. GaussianPass calls this automatically.
   */
  updateLod(t) {
    if (this.assertUsable(), this.packingInvalid || this.packedData === null)
      return { appliedBatches: 0, pending: !1, clouds: [] };
    t.updateWorldMatrix(!0, !1);
    const e = new Y(), s = new Y();
    let r = 0, i = !1;
    const n = [], o = [], l = [];
    for (const h of this.entries) {
      const u = h.packingStrategy;
      if (h.lod === null || u === null || !Os(u))
        continue;
      h.cloud.updateWorldMatrix(!0, !1), t.getWorldPosition(e), h.cloud.worldToLocal(e);
      const p = h.lod.octree.rootBounds.getSize(new Y()).length() * 0.5, d = Math.max(0.05, p * 0.025);
      (!Number.isFinite(h.lastLodFocus.x) || e.distanceToSquared(h.lastLodFocus) >= d * d) && (u.setFromCamera(t, h.cloud), h.lastLodFocus.copy(e));
      let m = !1;
      u.needsPack && (m = this.packLodBatch(h.cloud).applied, m && (r++, n.push(
        ...this.latestPackStats?.writtenSlotRanges ?? []
      ), o.push(
        ...this.latestPackStats?.clearedSlotRanges ?? []
      )));
      const g = u.needsPack;
      i ||= g, h.lod.octree.rootBounds.getCenter(s), l.push({
        cloud: h.cloud,
        focusDistance: e.distanceTo(s),
        applied: m,
        pending: g,
        targetStats: u.targetStats
      });
    }
    return {
      appliedBatches: r,
      pending: i,
      clouds: l,
      writtenSlotRanges: n,
      clearedSlotRanges: o
    };
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
        t.source !== null && t.ownsSource && t.source.dispose(), t.lod !== null && t.ownsLod && t.lod.dispose(), t.ownsPackingStrategy && Us(t.packingStrategy), t.cloud.removeFromParent();
      this.entries.length = 0, this.cloudList.length = 0, this.packedData?.dispose(), this.packedData = null, this.attributes[fe](), this.changeListeners.clear(), this.attributePackers.length = 0;
    }
  }
  buildPackedData(t, e) {
    const s = this.shDegree, r = (s + 1) ** 2, i = new Float32Array(e * 4), n = new Float32Array(e * 4), o = new Float32Array(e * 4), l = new Uint32Array(e * r), h = /* @__PURE__ */ new Map();
    let u = 0;
    for (const f of t) {
      const { entry: c } = f, y = /* @__PURE__ */ new Map();
      for (const _ of this.plannedCells(f)) {
        const M = new Uint32Array(_.count);
        for (let v = 0; v < _.count; v++) {
          const b = this.cellSourceIndex(c, _.nodeId, v);
          this.copySourceToSlot(
            c,
            b,
            u,
            i,
            n,
            o,
            l,
            r
          ), M[v] = u++;
        }
        y.set(_.nodeId, {
          lodLevel: _.lodLevel,
          slots: M
        });
      }
      h.set(c, y);
    }
    const p = Array.from(
      { length: e - u },
      (f, c) => e - 1 - c
    ), d = new pe(
      {
        means: oe("3dgs.store.means-object", i),
        scalesOpacity: oe("3dgs.store.scales-opacity", n),
        rotations: oe("3dgs.store.rotations", o),
        shCoefficients: oe(
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
    ), m = this.collectPackedLayoutCells(h);
    for (const f of this.attributePackers)
      f.allocate(e), f.backfill({ cells: m });
    const g = this.commitAttributePackers();
    return {
      data: d,
      cellSlotsByEntry: h,
      freeSlots: p,
      stats: {
        fullRebuild: !0,
        slotCapacity: e,
        activeGaussians: u,
        reusedSlots: 0,
        writtenSlots: u,
        clearedSlots: 0,
        estimatedUploadBytes: u * Re(d) + g.estimatedUploadBytes,
        writtenSlotRanges: u === 0 ? [] : [{ start: 0, count: u }],
        clearedSlotRanges: [],
        planningMs: 0,
        slotUpdateMs: 0
      }
    };
  }
  updatePackedData(t, e) {
    const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set();
    let i = 0;
    for (const b of t) {
      if (r.add(b.entry), i += b.count, !b.selectionChanged) continue;
      const T = /* @__PURE__ */ new Map();
      for (const k of this.plannedCells(b))
        T.set(k.nodeId, k);
      s.set(b.entry, T);
    }
    const n = [...this.freeSlots], o = this.scratchReleasedSlots;
    o.length = 0;
    for (const [b, T] of this.cellSlotsByEntry) {
      const k = s.get(b);
      if (!(k === void 0 && r.has(b)))
        for (const [C, N] of T) {
          const z = N.slots, R = Math.min(
            z.length,
            k?.get(C)?.count ?? 0
          );
          for (let E = R; E < z.length; E++) {
            const I = z[E];
            n.push(I), o.push(I);
          }
        }
    }
    const l = /* @__PURE__ */ new Map(), h = this.scratchWrittenSlots;
    h.length = 0;
    let u = 0;
    for (const b of t) {
      const T = this.cellSlotsByEntry.get(b.entry);
      if (!b.selectionChanged && T !== void 0) {
        l.set(b.entry, T), u += b.count;
        continue;
      }
      const k = /* @__PURE__ */ new Map();
      for (const C of s.get(b.entry)?.values() ?? []) {
        const N = T?.get(C.nodeId), z = N?.slots, R = Math.min(z?.length ?? 0, C.count), E = z !== void 0 && z.length === C.count ? z : new Uint32Array(C.count);
        E !== z && z !== void 0 && R > 0 && E.set(z.subarray(0, R)), u += R;
        for (let O = R; O < C.count; O++) {
          const W = n.pop();
          if (W === void 0)
            throw new Error("GaussianStore slot allocator exhausted capacity");
          this.copySourceToSlot(
            b.entry,
            this.cellSourceIndex(b.entry, C.nodeId, O),
            W,
            e.means.array,
            e.scalesOpacity.array,
            e.rotations.array,
            e.shCoefficients.array,
            e.shCoefficientCount
          ), E[O] = W, h.push(W);
        }
        const I = {
          lodLevel: C.lodLevel,
          slots: E
        };
        for (const O of this.attributePackers)
          O.updateCell({
            previousCell: N,
            cell: I,
            retainedCount: R
          });
        k.set(C.nodeId, I);
      }
      l.set(b.entry, k);
    }
    const p = this.nextSlotMarkGeneration(e.count);
    for (const b of h) this.slotMarks[b] = p;
    const d = this.scratchClearedSlots;
    d.length = 0;
    for (const b of o)
      this.slotMarks[b] !== p && d.push(b);
    const m = e.scalesOpacity.array;
    for (const b of d) m[b * 4 + 3] = 0;
    const g = h.length, f = d.length, c = Zt(h, 4, 0.15), y = Zt(d, 16, 0.25);
    H(e.means, c, 4), H(e.scalesOpacity, c, 4), H(e.scalesOpacity, y, 4), H(e.rotations, c, 4), H(
      e.shCoefficients,
      c,
      e.shCoefficientCount * e.shCoefficients.itemSize
    );
    const _ = this.commitAttributePackers(), M = Jt(c), v = Jt(y);
    return {
      data: e,
      cellSlotsByEntry: l,
      freeSlots: n,
      stats: {
        fullRebuild: !1,
        slotCapacity: e.count,
        activeGaussians: i,
        reusedSlots: u,
        writtenSlots: g,
        clearedSlots: f,
        estimatedUploadBytes: M * Re(e) + v * 16 + _.estimatedUploadBytes,
        writtenSlotRanges: c,
        clearedSlotRanges: y,
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
      const n = i.commit();
      t += n.writtenSlots, e += n.uploadedSlots, s += n.estimatedUploadBytes, r.push(...n.slotRanges);
    }
    return { writtenSlots: t, uploadedSlots: e, estimatedUploadBytes: s, slotRanges: r };
  }
  cellSourceIndex(t, e, s) {
    return t.lod === null ? s : t.lod.nodes[e].sortedGaussianIndices[s];
  }
  copySourceToSlot(t, e, s, r, i, n, o, l) {
    const h = t.lod?.octree.data ?? t.source;
    if (h === null)
      throw new Error("GaussianStore lost the source for a packed cloud");
    Ae(h.means.array, e, r, s), Ae(
      h.scalesOpacity.array,
      e,
      i,
      s
    ), Ae(
      h.rotations.array,
      e,
      n,
      s
    ), r[s * 4 + 3] = t.cloud.objectId, Pi(
      h,
      e,
      o,
      s,
      l
    );
  }
  invalidatePacking() {
    this.packingInvalid = !0;
    for (const t of this.entries)
      t.packingDirty = !0, t.allocatedBudget = null, t.count = 0, t.packing = null, t.cloud.updatePacking(0, null);
    for (const t of this.changeListeners)
      t({ type: "changed", reason: "clouds" });
  }
  allocateObjectId() {
    const t = this.nextObjectId++;
    if (t >= Ri)
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
function oe(a, t, e = 4) {
  const s = new gt(t, e);
  return s.name = a, s;
}
function Ae(a, t, e, s) {
  e.set(
    a.subarray(t * 4, t * 4 + 4),
    s * 4
  );
}
function Pi(a, t, e, s, r) {
  const i = a.shCoefficientCount, n = Math.min(
    i,
    r
  ), o = s * r;
  if (e.fill(
    0,
    o,
    o + r
  ), a.shFormat === "rgb8e8") {
    const u = t * i;
    e.set(
      a.shCoefficients.array.subarray(
        u,
        u + n
      ),
      o
    );
    return;
  }
  const l = a.shCoefficients.array, h = t * i * 4;
  for (let u = 0; u < n; u++) {
    const p = h + u * 4;
    e[o + u] = er(
      l[p],
      l[p + 1],
      l[p + 2]
    );
  }
}
function Re(a) {
  return 48 + a.shCoefficientCount * sr(a.shFormat);
}
function Oi(a) {
  const t = a.split(/[?#]/, 1)[0] ?? a;
  return t.slice(t.lastIndexOf("/") + 1) || "GaussianCloud";
}
function Pe(a) {
  if (!Number.isSafeInteger(a))
    throw new RangeError(
      "GaussianCloud packing priority must be a safe integer"
    );
  return a;
}
function Bi(a) {
  if (a !== "auto" && (!Number.isSafeInteger(a) || a <= 0))
    throw new RangeError(
      'GaussianStore maxGaussians must be "auto" or a positive safe integer'
    );
  return a;
}
function Fi(a) {
  const t = new or();
  return new hr(t, {
    ...a,
    targetPlanner: new Mi(t)
  });
}
function Us(a) {
  a !== null && "dispose" in a && typeof a.dispose == "function" && a.dispose();
}
function Ui(a, t) {
  if (!Number.isSafeInteger(a) || a < 0 || a > t)
    throw new RangeError(
      `GaussianStore budget allocation must be an integer in [0, ${t}]`
    );
}
function Di(a, t) {
  if (t.nodeIds.length !== t.lodLevels.length)
    throw new RangeError("GaussianLodPacking arrays must have equal lengths");
  const e = /* @__PURE__ */ new Set();
  let s = 0;
  for (let r = 0; r < t.nodeIds.length; r++) {
    const i = t.nodeIds[r], n = a.nodes[i], o = a.octree.nodes[i], l = t.lodLevels[r], h = n?.levelCounts[l];
    if (h === void 0 || o === void 0)
      throw new RangeError(
        `GaussianLod packing references invalid node ${i} or level ${l}`
      );
    if (!o.isLeaf)
      throw new Error(
        `GaussianLodPacking must reference leaf nodes; node ${i} is internal`
      );
    if (e.has(i))
      throw new Error(`GaussianLod packing contains duplicate node ${i}`);
    e.add(i), s += h;
  }
  if (s !== t.gaussianCount)
    throw new RangeError(
      `GaussianLodPacking declares ${t.gaussianCount} Gaussians but selects ${s}`
    );
}
function Vi(a, t) {
  const e = Ds(
    a.maxStorageBufferBindingSize,
    "maxStorageBufferBindingSize"
  ), s = Ds(a.maxBufferSize, "maxBufferSize"), r = Math.max(
    16,
    (t + 1) ** 2 * sr("rgb8e8")
  );
  return Math.floor(Math.min(e, s) / r);
}
function Ds(a, t) {
  if (!Number.isSafeInteger(a) || a <= 0)
    throw new RangeError(
      `GPUDevice limit ${t} must be a positive safe integer`
    );
  return a;
}
class Gi {
  constructor(t, e, s, r, i, n) {
    this.count = t, this.shDegree = e, this.shCoefficientCount = (e + 1) ** 2, this.means = { array: s }, this.scalesOpacity = { array: r }, this.rotations = { array: i }, this.shCoefficients = { array: n };
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
const Vs = {
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
}, $i = [
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
class ji {
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
    const e = Wi(t), s = new Map(
      e.properties.map((c, y) => [c.name, y])
    );
    for (const c of $i)
      if (!s.has(c))
        throw new Error(`Not a canonical 3DGS PLY: missing property ${c}`);
    const r = e.properties.map((c) => c.name.match(/^f_rest_(\d+)$/)?.[1]).filter((c) => c !== void 0).map(Number).sort((c, y) => c - y);
    for (let c = 0; c < r.length; c++)
      if (r[c] !== c)
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
    if (r.length % 3 !== 0)
      throw new Error("f_rest_* property count must be divisible by three");
    const i = r.length / 3, n = i + 1, o = Math.sqrt(n);
    if (!Number.isInteger(o) || o < 1 || o > 4)
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel"
      );
    const l = qi(t, e), h = (c) => s.get(c), u = r.map(
      (c) => h(`f_rest_${c}`)
    ), p = e.vertexCount, d = new Float32Array(p * 4), m = new Float32Array(p * 4), g = new Float32Array(p * 4), f = new Float32Array(p * n * 4);
    for (let c = 0; c < p; c++) {
      const y = c * 4;
      d[y] = l(c, h("x")), d[y + 1] = l(c, h("y")), d[y + 2] = l(c, h("z")), m[y] = Math.max(
        Math.exp(l(c, h("scale_0"))),
        1e-6
      ), m[y + 1] = Math.max(
        Math.exp(l(c, h("scale_1"))),
        1e-6
      ), m[y + 2] = Math.max(
        Math.exp(l(c, h("scale_2"))),
        1e-6
      );
      const _ = l(c, h("opacity"));
      m[y + 3] = 1 / (1 + Math.exp(-_));
      const M = l(c, h("rot_0")), v = l(c, h("rot_1")), b = l(c, h("rot_2")), T = l(c, h("rot_3")), k = Math.hypot(v, b, T, M);
      k > 1e-12 ? (g[y] = v / k, g[y + 1] = b / k, g[y + 2] = T / k, g[y + 3] = M / k) : g[y + 3] = 1;
      const C = c * n * 4;
      f[C] = l(c, h("f_dc_0")), f[C + 1] = l(c, h("f_dc_1")), f[C + 2] = l(c, h("f_dc_2"));
      for (let N = 1; N < n; N++) {
        const z = C + N * 4, R = N - 1;
        for (let E = 0; E < 3; E++) {
          const I = u[E * i + R];
          f[z + E] = l(
            c,
            I
          );
        }
      }
    }
    return new Gi(
      p,
      o - 1,
      d,
      m,
      g,
      f
    );
  }
}
function Wi(a) {
  const t = new Uint8Array(a), e = new TextEncoder().encode("end_header");
  let s = -1;
  for (let g = 0; g <= t.length - e.length; g++) {
    let f = !0;
    for (let c = 0; c < e.length; c++)
      if (t[g + c] !== e[c]) {
        f = !1;
        break;
      }
    if (f) {
      s = g;
      break;
    }
  }
  if (s < 0) throw new Error("Invalid PLY: end_header is missing");
  let r = s + e.length;
  if (t[r] === 13 && r++, t[r] !== 10)
    throw new Error("Invalid PLY: end_header must terminate a line");
  r++;
  const n = new TextDecoder().decode(t.subarray(0, r)).split(/\r?\n/);
  if (n[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");
  let o = null, l = "", h = -1, u = 0;
  const p = [], d = [];
  for (const g of n) {
    const f = g.trim().split(/\s+/);
    if (f[0] === "format") {
      if (f[1] !== "ascii" && f[1] !== "binary_little_endian" && f[1] !== "binary_big_endian")
        throw new Error(`Unsupported PLY format: ${f[1] ?? "unknown"}`);
      o = f[1];
    } else if (f[0] === "element") {
      l = f[1] ?? "";
      const c = Number(f[2]);
      if (!Number.isInteger(c) || c < 0)
        throw new Error(`Invalid element count for ${l}`);
      d.push({ name: l, count: c }), l === "vertex" && (h = c);
    } else if (f[0] === "property" && l === "vertex") {
      if (f[1] === "list")
        throw new Error(
          "List properties are not supported in the vertex element"
        );
      const c = f[1], y = f[2];
      if (!(c in Vs) || y === void 0)
        throw new Error(`Unsupported vertex property: ${g}`);
      p.push({ name: y, type: c, byteOffset: u }), u += Vs[c];
    }
  }
  if (o === null) throw new Error("Invalid PLY: format is missing");
  if (h <= 0) throw new Error("PLY must contain at least one vertex");
  if (d.find(
    (g) => g.count > 0
  )?.name !== "vertex")
    throw new Error("The canonical 3DGS vertex element must be first");
  return { format: o, vertexCount: h, properties: p, vertexStride: u, dataOffset: r };
}
function qi(a, t) {
  if (t.format === "ascii") {
    const i = new TextDecoder().decode(
      new Uint8Array(a, t.dataOffset)
    ), n = new Float64Array(
      t.vertexCount * t.properties.length
    );
    let o = 0;
    for (let l = 0; l < n.length; l++) {
      for (; o < i.length && /\s/.test(i[o]); ) o++;
      const h = o;
      for (; o < i.length && !/\s/.test(i[o]); ) o++;
      const u = Number(i.slice(h, o));
      if (!Number.isFinite(u))
        throw new Error(`Invalid ASCII PLY value at scalar ${l}`);
      n[l] = u;
    }
    return (l, h) => n[l * t.properties.length + h];
  }
  if (t.dataOffset + t.vertexCount * t.vertexStride > a.byteLength)
    throw new Error("Binary PLY ends before the vertex data is complete");
  const s = new DataView(a), r = t.format === "binary_little_endian";
  return (i, n) => {
    const o = t.properties[n], l = t.dataOffset + i * t.vertexStride + o.byteOffset;
    return Hi(s, l, o.type, r);
  };
}
function Hi(a, t, e, s) {
  switch (e) {
    case "char":
    case "int8":
      return a.getInt8(t);
    case "uchar":
    case "uint8":
      return a.getUint8(t);
    case "short":
    case "int16":
      return a.getInt16(t, s);
    case "ushort":
    case "uint16":
      return a.getUint16(t, s);
    case "int":
    case "int32":
      return a.getInt32(t, s);
    case "uint":
    case "uint32":
      return a.getUint32(t, s);
    case "float":
    case "float32":
      return a.getFloat32(t, s);
    case "double":
    case "float64":
      return a.getFloat64(t, s);
  }
}
function Oe(a) {
  const t = a.nodes, e = new Float32Array(t.length * 7), s = new Uint32Array(t.length * 2), r = new Uint32Array(t.length * 2), i = [], n = [];
  for (const l of t) {
    const h = l.id * 7, { min: u, max: p } = l.raycastBounds;
    if (e.set(
      [u.x, u.y, u.z, p.x, p.y, p.z, l.maxSplatRadius],
      h
    ), s.set([i.length, l.children.length], l.id * 2), i.push(...l.children), r.set(
      [n.length, l.gaussianIndices?.length ?? 0],
      l.id * 2
    ), l.gaussianIndices !== null)
      for (const d of l.gaussianIndices) n.push(d);
  }
  const o = a.data;
  return {
    means: Float32Array.from(o.means.array).buffer,
    scalesOpacity: Float32Array.from(o.scalesOpacity.array).buffer,
    rotations: Float32Array.from(o.rotations.array).buffer,
    nodeBounds: e.buffer,
    nodeChildren: s.buffer,
    children: Uint32Array.from(i).buffer,
    nodeIndices: r.buffer,
    indices: Uint32Array.from(n).buffer
  };
}
const Yi = /* @__PURE__ */ new Set([
  "means",
  "scalesOpacity",
  "rotations",
  "shCoefficients",
  "lodLevel"
]), Xi = new Yr();
class ma {
  listeners = /* @__PURE__ */ new Set();
  clouds = /* @__PURE__ */ new Map();
  usedCloudIds = /* @__PURE__ */ new Set();
  usedCommandIds = /* @__PURE__ */ new Set();
  cancelled = /* @__PURE__ */ new Set();
  pendingCommands = /* @__PURE__ */ new Set();
  activeLoads = /* @__PURE__ */ new Map();
  parser = new ji();
  config;
  frontend = null;
  work = Promise.resolve();
  nextObjectId = 0;
  layoutVersion = 0;
  contentVersion = 0;
  sceneRevision = 0;
  cameraPosition = new P();
  packed = null;
  target = null;
  updateScheduled = !1;
  sceneUpdateTimer = null;
  pendingTransforms = [];
  disposed = !1;
  constructor(t) {
    this.config = t;
  }
  subscribe(t) {
    if (this.disposed) throw new Error("Backend disposed");
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  dispatch(t) {
    if (this.disposed) throw new Error("Backend disposed");
    if (this.usedCommandIds.has(t.id))
      throw new Error(`Duplicate backend command id: ${t.id}`);
    if (this.usedCommandIds.add(t.id), t.type === "cancel") {
      this.pendingCommands.has(t.targetCommandId) && (this.cancelled.add(t.targetCommandId), this.activeLoads.get(t.targetCommandId)?.abort()), this.emit({ type: "command-completed", commandId: t.id });
      return;
    }
    this.pendingCommands.add(t.id), this.work = this.work.then(async () => {
      try {
        if (this.cancelled.delete(t.id)) {
          this.emit({ type: "command-cancelled", commandId: t.id });
          return;
        }
        await this.handle(t);
      } catch (e) {
        this.cancelled.delete(t.id) ? this.emit({ type: "command-cancelled", commandId: t.id }) : this.emit({
          type: "error",
          commandId: t.id,
          cloudId: "cloudId" in t ? t.cloudId : void 0,
          code: e instanceof RangeError ? "invalid-range" : "backend-error",
          message: e instanceof Error ? e.message : String(e)
        });
      } finally {
        this.pendingCommands.delete(t.id);
      }
    });
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = !0, this.sceneUpdateTimer !== null && clearTimeout(this.sceneUpdateTimer);
      for (const t of this.activeLoads.values()) t.abort();
      this.activeLoads.clear(), this.listeners.clear(), this.clouds.clear(), this.packed = null, this.target = null;
    }
  }
  emit(t) {
    if (!this.disposed)
      for (const e of this.listeners) e(t);
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
            const p = await fetch(t.url, {
              signal: e.signal
            });
            if (!p.ok)
              throw new Error(`PLY fetch failed: ${p.status}`);
            if (p.headers.get("content-type")?.includes("text/html"))
              throw new Error("PLY URL returned HTML instead of a PLY file");
            const d = await p.arrayBuffer();
            if (e.signal.aborted) throw new DOMException("Load cancelled", "AbortError");
            s = this.parser.parse(d);
          } else
            s = this.parser.parse(t.buffer);
          const r = t.options ?? {}, i = Vt.build(s, r.octree), n = Gt.build(i, r.lod), o = {
            id: t.cloudId,
            objectId: this.nextObjectId++,
            source: s,
            octree: i,
            lod: n,
            octreeOptions: r.octree,
            lodOptions: r.lod,
            attributes: /* @__PURE__ */ new Map(),
            transform: Xi.clone(),
            priority: Gs(r.priority ?? 0),
            packingStrategy: r.packingStrategy ?? this.config.defaultPackingStrategy ?? { type: "tiered-radial" },
            raycastable: r.raycastable ?? !0,
            sourceVersion: 1
          };
          for (const p of r.attributes ?? []) {
            if (Yi.has(p.name) || o.attributes.has(p.name))
              throw new Error(
                `Reserved or duplicate attribute name: ${p.name}`
              );
            o.attributes.set(
              p.name,
              Zi(p, s.count)
            );
          }
          for (const p of this.clouds.values())
            for (const [d, m] of o.attributes) {
              const g = p.attributes.get(d);
              if (g && (g.format !== m.format || g.elementsPerGaussian !== m.elementsPerGaussian))
                throw new Error(
                  `Attribute schema differs across clouds: ${d}`
                );
            }
          this.usedCloudIds.add(o.id), this.clouds.set(o.id, o);
          let l = null;
          if (this.frontend)
            try {
              l = this.compute();
            } catch (p) {
              throw this.clouds.delete(o.id), this.usedCloudIds.delete(o.id), p;
            }
          const { min: h, max: u } = i.bounds;
          this.emit({
            type: "cloud-loaded",
            commandId: t.id,
            cloudId: o.id,
            objectId: o.objectId,
            sourceCount: s.count,
            shDegree: s.shDegree,
            bounds: [h.x, h.y, h.z, u.x, u.y, u.z],
            raycast: o.raycastable ? Oe(i) : void 0
          }), l && (this.target = null, this.replace(l));
          return;
        } finally {
          this.activeLoads.delete(t.id);
        }
      }
      case "unload-cloud":
        this.clouds.delete(t.cloudId), this.emit({
          type: "cloud-unloaded",
          commandId: t.id,
          cloudId: t.cloudId
        }), this.repack();
        return;
      case "set-cloud-priority":
        {
          const e = this.getCloud(t.cloudId), s = e.priority;
          e.priority = Gs(t.priority);
          try {
            this.repack();
          } catch (r) {
            throw e.priority = s, r;
          }
        }
        break;
      case "set-cloud-packing":
        {
          const e = this.getCloud(t.cloudId), s = e.packingStrategy;
          e.packingStrategy = t.packingStrategy;
          try {
            this.repack();
          } catch (r) {
            throw e.packingStrategy = s, r;
          }
        }
        break;
      case "set-cloud-transform": {
        const e = this.getCloud(t.cloudId);
        if (t.worldMatrix.length !== 16)
          throw new RangeError("Cloud transform needs sixteen numbers");
        if (t.sceneRevision < this.sceneRevision) break;
        this.sceneRevision = t.sceneRevision, e.transform.fromArray(t.worldMatrix), this.pendingTransforms.push(t.id), this.scheduleSceneUpdate();
        return;
      }
      case "set-cloud-raycastable": {
        const e = this.getCloud(t.cloudId);
        e.raycastable = t.raycastable, this.emit({
          type: "cloud-raycast-changed",
          commandId: t.id,
          cloudId: e.id,
          raycastable: e.raycastable,
          raycast: e.raycastable ? Oe(e.octree) : void 0
        });
        return;
      }
      case "write-attribute-range":
        this.writeRange(t), this.updateTarget();
        break;
      case "set-frontend-capabilities": {
        const { capabilities: e } = t;
        for (const r of [
          e.maxStorageBufferBindingSize,
          e.maxBufferSize,
          e.maxStorageBuffersPerShaderStage
        ])
          if (!Number.isSafeInteger(r) || r <= 0)
            throw new RangeError("Frontend buffer limits must be positive integers");
        if (typeof e.supportsPartialBufferUpdates != "boolean")
          throw new TypeError("Frontend partial update support must be boolean");
        const s = this.frontend;
        this.frontend = { ...e };
        try {
          this.clouds.size > 0 && this.repack();
        } catch (r) {
          throw this.frontend = s, r;
        }
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
        ), this.flushSceneUpdate();
        break;
    }
    this.emit({ type: "command-completed", commandId: t.id });
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
    const t = this.pendingTransforms.splice(0);
    try {
      this.updateTarget();
      for (const e of t)
        this.emit({ type: "command-completed", commandId: e });
    } catch (e) {
      for (const s of t)
        this.emit({
          type: "error",
          commandId: s,
          code: e instanceof RangeError ? "invalid-range" : "backend-error",
          message: e instanceof Error ? e.message : String(e)
        });
      throw e;
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
      gaussianCount: r,
      attribute: i
    } = t;
    if (!Number.isSafeInteger(s) || !Number.isSafeInteger(r) || s < 0 || r < 0 || s + r > e.source.count)
      throw new RangeError("Attribute range exceeds source cloud");
    if (i === "lodLevel")
      throw new Error("lodLevel is computed by the backend");
    let n, o;
    switch (i) {
      case "means":
        n = e.source.means.array, o = 4;
        break;
      case "scalesOpacity":
        n = e.source.scalesOpacity.array, o = 4;
        break;
      case "rotations":
        n = e.source.rotations.array, o = 4;
        break;
      case "shCoefficients":
        n = e.source.shCoefficients.array, o = e.source.shCoefficientCount * 4;
        break;
      default: {
        const h = e.attributes.get(i);
        if (!h) throw new Error(`Unknown source attribute: ${i}`);
        n = h.values, o = h.elementsPerGaussian;
      }
    }
    if (t.data.byteLength !== r * o * 4)
      throw new RangeError("Attribute update has the wrong byte length");
    const l = n instanceof Uint32Array ? new Uint32Array(t.data) : new Float32Array(t.data);
    if (n.set(l, s * o), (i === "means" || i === "scalesOpacity" || i === "rotations") && (e.octree = Vt.build(e.source, e.octreeOptions), e.lod = Gt.build(e.octree, e.lodOptions), e.sourceVersion++, e.raycastable)) {
      const { min: h, max: u } = e.octree.bounds;
      this.emit({
        type: "raycast-replaced",
        cloudId: e.id,
        sourceVersion: e.sourceVersion,
        bounds: [h.x, h.y, h.z, u.x, u.y, u.z],
        raycast: Oe(e.octree)
      });
    }
  }
  maxSlots(t, e) {
    const s = this.frontend;
    if (!s)
      throw new Error("Frontend capabilities have not been supplied");
    const r = Math.min(
      s.maxStorageBufferBindingSize,
      s.maxBufferSize
    ), i = [
      16,
      16,
      16,
      (t + 1) ** 2 * 4,
      4,
      ...[...e.values()].map((o) => o.elementsPerGaussian * 4)
    ], n = Math.min(
      ...i.map((o) => Math.floor(r / o))
    );
    if (n < 1)
      throw new RangeError("Frontend buffer limits are too small");
    return Math.min(
      n,
      this.config.maxGaussians === "auto" || this.config.maxGaussians === void 0 ? n : this.config.maxGaussians
    );
  }
  compute(t = 0) {
    const e = [...this.clouds.values()].sort(
      (v, b) => v.priority - b.priority || v.objectId - b.objectId
    ), s = e.reduce(
      (v, b) => Math.max(v, b.source.shDegree),
      0
    ), r = /* @__PURE__ */ new Map();
    for (const v of e)
      for (const [b, T] of v.attributes) r.set(b, T);
    let i = this.maxSlots(s, r);
    const n = [];
    for (const v of e) {
      const b = this.select(
        v,
        Math.min(i, v.source.count)
      ), T = v.lod.indicesForPacking(b), k = new Uint32Array(T.length), C = [];
      let N = 0;
      for (let z = 0; z < b.nodeIds.length; z++) {
        const R = v.lod.nodes[b.nodeIds[z]], E = b.lodLevels[z], I = R.levelCounts[E];
        k.fill(E, N, N + I), N += I, C.push(N);
      }
      n.push({ entry: v, indices: T, levels: k, cellEnds: C }), i -= T.length;
    }
    const o = n.reduce(
      (v, b) => v + b.indices.length,
      0
    ), l = Math.max(1, o, t), h = /* @__PURE__ */ new Map(), u = (v, b, T) => {
      const k = b === "f32" ? new Float32Array(l * T) : new Uint32Array(l * T);
      return h.set(v, { format: b, elementsPerGaussian: T, values: k }), k;
    }, p = u("means", "f32", 4), d = u("scalesOpacity", "f32", 4), m = u("rotations", "f32", 4), g = u("shCoefficients", "u32", (s + 1) ** 2), f = u("lodLevel", "u32", 1), c = new Uint32Array(l);
    for (const [v, b] of r)
      u(v, b.format, b.elementsPerGaussian);
    const y = [];
    let _ = 0, M = 1;
    for (const { entry: v, indices: b, levels: T, cellEnds: k } of n) {
      const C = v.source, N = C.shCoefficients.array;
      let z = 0;
      for (let R = 0; R < b.length; R++, _++) {
        for (; R >= k[z]; ) z++;
        c[_] = M + z;
        const E = b[R];
        p.set(
          C.means.array.subarray(E * 4, E * 4 + 4),
          _ * 4
        ), p[_ * 4 + 3] = v.objectId, d.set(
          C.scalesOpacity.array.subarray(E * 4, E * 4 + 4),
          _ * 4
        ), m.set(
          C.rotations.array.subarray(E * 4, E * 4 + 4),
          _ * 4
        ), f[_] = T[R];
        for (let I = 0; I < C.shCoefficientCount; I++) {
          const O = (E * C.shCoefficientCount + I) * 4;
          g[_ * (s + 1) ** 2 + I] = er(
            N[O],
            N[O + 1],
            N[O + 2]
          );
        }
        for (const [I, O] of v.attributes) {
          const W = h.get(I).values, tt = O.elementsPerGaussian;
          W.set(
            O.values.subarray(E * tt, (E + 1) * tt),
            _ * tt
          );
        }
      }
      M += k.length, y.push({
        cloudId: v.id,
        objectId: v.objectId,
        renderedCount: b.length
      });
    }
    return { capacity: l, count: o, degree: s, attributes: h, cells: c, clouds: y };
  }
  select(t, e) {
    const s = this.cameraPosition.clone().applyMatrix4(t.transform.clone().invert()), r = t.packingStrategy;
    switch (r.type) {
      case "maximum":
        return new fi().pack({
          lod: t.lod,
          maxGaussians: e
        });
      case "radial":
        return new yi({
          center: s,
          lodLevel: r.lodLevel
        }).pack({ lod: t.lod, maxGaussians: e });
      case "tiered-radial":
        return new or({
          center: s,
          budgetShares: r.budgetShares
        }).pack({ lod: t.lod, maxGaussians: e });
      case "distance-aware-radial":
        return new vi({
          center: s,
          levelDistance: r.levelDistance
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
      this.updateScheduled = !1, !(this.disposed || !this.target || !this.packed) && this.emitNextPatch();
    }, 0));
  }
  emitNextPatch() {
    const t = this.packed, e = this.target, s = this.config.streamingLod?.maxUploadBytesPerUpdate ?? 1024 * 1024, r = Math.max(
      1,
      this.config.streamingLod?.maxChangedCellsPerUpdate ?? 16
    ), i = [...t.attributes.values()].reduce(
      (d, m) => d + m.elementsPerGaussian * 4,
      0
    ), n = Math.max(1, Math.floor(s / i)), o = [], l = /* @__PURE__ */ new Set();
    for (let d = 0; d < t.capacity && o.length < n; d++)
      if ([...t.attributes].some(([m, g]) => {
        const f = e.attributes.get(m).values, c = d * g.elementsPerGaussian;
        for (let y = 0; y < g.elementsPerGaussian; y++)
          if (g.values[c + y] !== f[c + y]) return !0;
        return !1;
      })) {
        const m = e.cells[d];
        if (!l.has(m) && l.size >= r) break;
        l.add(m), o.push(d);
      }
    const h = [];
    if (o.length === 0) {
      if (JSON.stringify(t.clouds) !== JSON.stringify(e.clouds)) {
        const d = this.contentVersion++;
        this.emit({
          type: "buffers-patched",
          sceneRevision: this.sceneRevision,
          layoutVersion: this.layoutVersion,
          baseContentVersion: d,
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
      }, this.target = null;
      return;
    }
    for (const [d, m] of t.attributes) {
      const g = m.elementsPerGaussian, f = e.attributes.get(d).values;
      let c = -1, y = -1;
      const _ = () => {
        if (c < 0) return;
        const M = c * g, v = (y + 1) * g;
        m.values.set(f.subarray(M, v), M), h.push({
          name: d,
          firstSlot: c,
          slotCount: y - c + 1,
          data: f.slice(M, v).buffer
        }), c = -1;
      };
      for (const M of o) {
        const v = M * g;
        let b = !1;
        for (let T = 0; T < g; T++)
          if (m.values[v + T] !== f[v + T]) {
            b = !0;
            break;
          }
        if (!b) {
          _();
          continue;
        }
        c < 0 ? c = M : M !== y + 1 && (_(), c = M), y = M;
      }
      _();
    }
    const u = [...t.attributes].some(([d, m]) => {
      const g = e.attributes.get(d).values;
      return m.values.some((f, c) => f !== g[c]);
    }), p = this.contentVersion++;
    this.emit({
      type: "buffers-patched",
      sceneRevision: this.sceneRevision,
      layoutVersion: this.layoutVersion,
      baseContentVersion: p,
      contentVersion: this.contentVersion,
      patches: h,
      changedClouds: u ? t.clouds : e.clouds,
      lodPending: u
    }), u ? this.scheduleUpdate() : (this.packed = {
      ...t,
      count: e.count,
      clouds: e.clouds,
      cells: e.cells
    }, this.target = null);
  }
}
function Gs(a) {
  if (!Number.isSafeInteger(a))
    throw new RangeError("Priority must be a safe integer");
  return a;
}
function Zi(a, t) {
  const e = a.elementsPerGaussian;
  if (!Number.isSafeInteger(e) || e < 1)
    throw new RangeError("Attribute elementsPerGaussian must be positive");
  const s = t * e, r = a.format === "f32" ? new Float32Array(s) : new Uint32Array(s);
  if (a.source.kind === "fill")
    r.fill(a.source.value === "ones" ? 1 : 0);
  else {
    if (a.source.data.byteLength !== s * 4)
      throw new RangeError("Attribute buffer has the wrong byte length");
    r.set(
      a.format === "f32" ? new Float32Array(a.source.data) : new Uint32Array(a.source.data)
    );
  }
  return { format: a.format, elementsPerGaussian: e, values: r };
}
const ur = '(function(){"use strict";const Et={};function Ut(f){const t=f[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=f[1];e&&e.isStackTrace?f[0]+=" "+e.getLocation():f[1]=\'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.\'}return f}function dt(...f){f=Ut(f);const t="THREE."+f.shift();{const e=f[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...f)}}function yt(...f){const t=f.join(" ");t in Et||(Et[t]=!0,dt(...f))}function E(f,t,e){return Math.max(t,Math.min(e,f))}const Mt=class Mt{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,s=this.y,i=t.elements;return this.x=i[0]*e+i[3]*s+i[6],this.y=i[1]*e+i[4]*s+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=E(this.x,t.x,e.x),this.y=E(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=E(this.x,t,e),this.y=E(this.y,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(E(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(E(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y;return e*e+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const s=Math.cos(e),i=Math.sin(e),n=this.x-t.x,r=this.y-t.y;return this.x=n*s-r*i+t.x,this.y=n*i+r*s+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Mt.prototype.isVector2=!0;let kt=Mt;class Bt{constructor(t=0,e=0,s=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=s,this._w=i}static slerpFlat(t,e,s,i,n,r,o){let h=s[i+0],a=s[i+1],c=s[i+2],l=s[i+3],u=n[r+0],d=n[r+1],y=n[r+2],x=n[r+3];if(l!==x||h!==u||a!==d||c!==y){let m=h*u+a*d+c*y+l*x;m<0&&(u=-u,d=-d,y=-y,x=-x,m=-m);let p=1-o;if(m<.9995){const M=Math.acos(m),_=Math.sin(M);p=Math.sin(p*M)/_,o=Math.sin(o*M)/_,h=h*p+u*o,a=a*p+d*o,c=c*p+y*o,l=l*p+x*o}else{h=h*p+u*o,a=a*p+d*o,c=c*p+y*o,l=l*p+x*o;const M=1/Math.sqrt(h*h+a*a+c*c+l*l);h*=M,a*=M,c*=M,l*=M}}t[e]=h,t[e+1]=a,t[e+2]=c,t[e+3]=l}static multiplyQuaternionsFlat(t,e,s,i,n,r){const o=s[i],h=s[i+1],a=s[i+2],c=s[i+3],l=n[r],u=n[r+1],d=n[r+2],y=n[r+3];return t[e]=o*y+c*l+h*d-a*u,t[e+1]=h*y+c*u+a*l-o*d,t[e+2]=a*y+c*d+o*u-h*l,t[e+3]=c*y-o*l-h*u-a*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,s,i){return this._x=t,this._y=e,this._z=s,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const s=t._x,i=t._y,n=t._z,r=t._order,o=Math.cos,h=Math.sin,a=o(s/2),c=o(i/2),l=o(n/2),u=h(s/2),d=h(i/2),y=h(n/2);switch(r){case"XYZ":this._x=u*c*l+a*d*y,this._y=a*d*l-u*c*y,this._z=a*c*y+u*d*l,this._w=a*c*l-u*d*y;break;case"YXZ":this._x=u*c*l+a*d*y,this._y=a*d*l-u*c*y,this._z=a*c*y-u*d*l,this._w=a*c*l+u*d*y;break;case"ZXY":this._x=u*c*l-a*d*y,this._y=a*d*l+u*c*y,this._z=a*c*y+u*d*l,this._w=a*c*l-u*d*y;break;case"ZYX":this._x=u*c*l-a*d*y,this._y=a*d*l+u*c*y,this._z=a*c*y-u*d*l,this._w=a*c*l+u*d*y;break;case"YZX":this._x=u*c*l+a*d*y,this._y=a*d*l+u*c*y,this._z=a*c*y-u*d*l,this._w=a*c*l-u*d*y;break;case"XZY":this._x=u*c*l-a*d*y,this._y=a*d*l-u*c*y,this._z=a*c*y+u*d*l,this._w=a*c*l+u*d*y;break;default:dt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const s=e/2,i=Math.sin(s);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(s),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,s=e[0],i=e[4],n=e[8],r=e[1],o=e[5],h=e[9],a=e[2],c=e[6],l=e[10],u=s+o+l;if(u>0){const d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(c-h)*d,this._y=(n-a)*d,this._z=(r-i)*d}else if(s>o&&s>l){const d=2*Math.sqrt(1+s-o-l);this._w=(c-h)/d,this._x=.25*d,this._y=(i+r)/d,this._z=(n+a)/d}else if(o>l){const d=2*Math.sqrt(1+o-s-l);this._w=(n-a)/d,this._x=(i+r)/d,this._y=.25*d,this._z=(h+c)/d}else{const d=2*Math.sqrt(1+l-s-o);this._w=(r-i)/d,this._x=(n+a)/d,this._y=(h+c)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let s=t.dot(e)+1;return s<1e-8?(s=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=s):(this._x=0,this._y=-t.z,this._z=t.y,this._w=s)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=s),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(E(this.dot(t),-1,1)))}rotateTowards(t,e){const s=this.angleTo(t);if(s===0)return this;const i=Math.min(1,e/s);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const s=t._x,i=t._y,n=t._z,r=t._w,o=e._x,h=e._y,a=e._z,c=e._w;return this._x=s*c+r*o+i*a-n*h,this._y=i*c+r*h+n*o-s*a,this._z=n*c+r*a+s*h-i*o,this._w=r*c-s*o-i*h-n*a,this._onChangeCallback(),this}slerp(t,e){let s=t._x,i=t._y,n=t._z,r=t._w,o=this.dot(t);o<0&&(s=-s,i=-i,n=-n,r=-r,o=-o);let h=1-e;if(o<.9995){const a=Math.acos(o),c=Math.sin(a);h=Math.sin(h*a)/c,e=Math.sin(e*a)/c,this._x=this._x*h+s*e,this._y=this._y*h+i*e,this._z=this._z*h+n*e,this._w=this._w*h+r*e,this._onChangeCallback()}else this._x=this._x*h+s*e,this._y=this._y*h+i*e,this._z=this._z*h+n*e,this._w=this._w*h+r*e,this.normalize();return this}slerpQuaternions(t,e,s){return this.copy(t).slerp(e,s)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),s=Math.random(),i=Math.sqrt(1-s),n=Math.sqrt(s);return this.set(i*Math.sin(t),i*Math.cos(t),n*Math.sin(e),n*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const _t=class _t{constructor(t=0,e=0,s=0){this.x=t,this.y=e,this.z=s}set(t,e,s){return s===void 0&&(s=this.z),this.x=t,this.y=e,this.z=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Lt.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Lt.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,s=this.y,i=this.z,n=t.elements;return this.x=n[0]*e+n[3]*s+n[6]*i,this.y=n[1]*e+n[4]*s+n[7]*i,this.z=n[2]*e+n[5]*s+n[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,s=this.y,i=this.z,n=t.elements,r=1/(n[3]*e+n[7]*s+n[11]*i+n[15]);return this.x=(n[0]*e+n[4]*s+n[8]*i+n[12])*r,this.y=(n[1]*e+n[5]*s+n[9]*i+n[13])*r,this.z=(n[2]*e+n[6]*s+n[10]*i+n[14])*r,this}applyQuaternion(t){const e=this.x,s=this.y,i=this.z,n=t.x,r=t.y,o=t.z,h=t.w,a=2*(r*i-o*s),c=2*(o*e-n*i),l=2*(n*s-r*e);return this.x=e+h*a+r*l-o*c,this.y=s+h*c+o*a-n*l,this.z=i+h*l+n*c-r*a,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,s=this.y,i=this.z,n=t.elements;return this.x=n[0]*e+n[4]*s+n[8]*i,this.y=n[1]*e+n[5]*s+n[9]*i,this.z=n[2]*e+n[6]*s+n[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=E(this.x,t.x,e.x),this.y=E(this.y,t.y,e.y),this.z=E(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=E(this.x,t,e),this.y=E(this.y,t,e),this.z=E(this.z,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(E(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const s=t.x,i=t.y,n=t.z,r=e.x,o=e.y,h=e.z;return this.x=i*h-n*o,this.y=n*r-s*h,this.z=s*o-i*r,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const s=t.dot(this)/e;return this.copy(t).multiplyScalar(s)}projectOnPlane(t){return mt.copy(this).projectOnVector(t),this.sub(mt)}reflect(t){return this.sub(mt.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const s=this.dot(t)/e;return Math.acos(E(s,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,s=this.y-t.y,i=this.z-t.z;return e*e+s*s+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,s){const i=Math.sin(e)*t;return this.x=i*Math.sin(s),this.y=Math.cos(e)*t,this.z=i*Math.cos(s),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,s){return this.x=t*Math.sin(e),this.y=s,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),s=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=s,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,s=Math.sqrt(1-e*e);return this.x=s*Math.cos(t),this.y=e,this.z=s*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};_t.prototype.isVector3=!0;let b=_t;const mt=new b,Lt=new Bt,St=class St{constructor(t,e,s,i,n,r,o,h,a){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,s,i,n,r,o,h,a)}set(t,e,s,i,n,r,o,h,a){const c=this.elements;return c[0]=t,c[1]=i,c[2]=o,c[3]=e,c[4]=n,c[5]=h,c[6]=s,c[7]=r,c[8]=a,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],this}extractBasis(t,e,s){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),s.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,i=e.elements,n=this.elements,r=s[0],o=s[3],h=s[6],a=s[1],c=s[4],l=s[7],u=s[2],d=s[5],y=s[8],x=i[0],m=i[3],p=i[6],M=i[1],_=i[4],w=i[7],g=i[2],z=i[5],S=i[8];return n[0]=r*x+o*M+h*g,n[3]=r*m+o*_+h*z,n[6]=r*p+o*w+h*S,n[1]=a*x+c*M+l*g,n[4]=a*m+c*_+l*z,n[7]=a*p+c*w+l*S,n[2]=u*x+d*M+y*g,n[5]=u*m+d*_+y*z,n[8]=u*p+d*w+y*S,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[1],i=t[2],n=t[3],r=t[4],o=t[5],h=t[6],a=t[7],c=t[8];return e*r*c-e*o*a-s*n*c+s*o*h+i*n*a-i*r*h}invert(){const t=this.elements,e=t[0],s=t[1],i=t[2],n=t[3],r=t[4],o=t[5],h=t[6],a=t[7],c=t[8],l=c*r-o*a,u=o*h-c*n,d=a*n-r*h,y=e*l+s*u+i*d;if(y===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/y;return t[0]=l*x,t[1]=(i*a-c*s)*x,t[2]=(o*s-i*r)*x,t[3]=u*x,t[4]=(c*e-i*h)*x,t[5]=(i*n-o*e)*x,t[6]=d*x,t[7]=(s*h-a*e)*x,t[8]=(r*e-s*n)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,s,i,n,r,o){const h=Math.cos(n),a=Math.sin(n);return this.set(s*h,s*a,-s*(h*r+a*o)+r+t,-i*a,i*h,-i*(-a*r+h*o)+o+e,0,0,1),this}scale(t,e){return yt("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(xt.makeScale(t,e)),this}rotate(t){return yt("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(xt.makeRotation(-t)),this}translate(t,e){return yt("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(xt.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,s,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,s=t.elements;for(let i=0;i<9;i++)if(e[i]!==s[i])return!1;return!0}fromArray(t,e=0){for(let s=0;s<9;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t}clone(){return new this.constructor().fromArray(this.elements)}};St.prototype.isMatrix3=!0;let H=St;const xt=new H,Ct=class Ct{constructor(t=0,e=0,s=0,i=1){this.x=t,this.y=e,this.z=s,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,s,i){return this.x=t,this.y=e,this.z=s,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,s=this.y,i=this.z,n=this.w,r=t.elements;return this.x=r[0]*e+r[4]*s+r[8]*i+r[12]*n,this.y=r[1]*e+r[5]*s+r[9]*i+r[13]*n,this.z=r[2]*e+r[6]*s+r[10]*i+r[14]*n,this.w=r[3]*e+r[7]*s+r[11]*i+r[15]*n,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,s,i,n;const h=t.elements,a=h[0],c=h[4],l=h[8],u=h[1],d=h[5],y=h[9],x=h[2],m=h[6],p=h[10];if(Math.abs(c-u)<.01&&Math.abs(l-x)<.01&&Math.abs(y-m)<.01){if(Math.abs(c+u)<.1&&Math.abs(l+x)<.1&&Math.abs(y+m)<.1&&Math.abs(a+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const _=(a+1)/2,w=(d+1)/2,g=(p+1)/2,z=(c+u)/4,S=(l+x)/4,C=(y+m)/4;return _>w&&_>g?_<.01?(s=0,i=.707106781,n=.707106781):(s=Math.sqrt(_),i=z/s,n=S/s):w>g?w<.01?(s=.707106781,i=0,n=.707106781):(i=Math.sqrt(w),s=z/i,n=C/i):g<.01?(s=.707106781,i=.707106781,n=0):(n=Math.sqrt(g),s=S/n,i=C/n),this.set(s,i,n,e),this}let M=Math.sqrt((m-y)*(m-y)+(l-x)*(l-x)+(u-c)*(u-c));return Math.abs(M)<.001&&(M=1),this.x=(m-y)/M,this.y=(l-x)/M,this.z=(u-c)/M,this.w=Math.acos((a+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=E(this.x,t.x,e.x),this.y=E(this.y,t.y,e.y),this.z=E(this.z,t.z,e.z),this.w=E(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=E(this.x,t,e),this.y=E(this.y,t,e),this.z=E(this.z,t,e),this.w=E(this.w,t,e),this}clampLength(t,e){const s=this.length();return this.divideScalar(s||1).multiplyScalar(E(s,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,s){return this.x=t.x+(e.x-t.x)*s,this.y=t.y+(e.y-t.y)*s,this.z=t.z+(e.z-t.z)*s,this.w=t.w+(e.w-t.w)*s,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ct.prototype.isVector4=!0;let At=Ct;const ot=class ot{constructor(t,e,s,i,n,r,o,h,a,c,l,u,d,y,x,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,s,i,n,r,o,h,a,c,l,u,d,y,x,m)}set(t,e,s,i,n,r,o,h,a,c,l,u,d,y,x,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=s,p[12]=i,p[1]=n,p[5]=r,p[9]=o,p[13]=h,p[2]=a,p[6]=c,p[10]=l,p[14]=u,p[3]=d,p[7]=y,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ot().fromArray(this.elements)}copy(t){const e=this.elements,s=t.elements;return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=s[7],e[8]=s[8],e[9]=s[9],e[10]=s[10],e[11]=s[11],e[12]=s[12],e[13]=s[13],e[14]=s[14],e[15]=s[15],this}copyPosition(t){const e=this.elements,s=t.elements;return e[12]=s[12],e[13]=s[13],e[14]=s[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,s){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),s.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),s.setFromMatrixColumn(this,2),this)}makeBasis(t,e,s){return this.set(t.x,e.x,s.x,0,t.y,e.y,s.y,0,t.z,e.z,s.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,s=t.elements,i=1/$.setFromMatrixColumn(t,0).length(),n=1/$.setFromMatrixColumn(t,1).length(),r=1/$.setFromMatrixColumn(t,2).length();return e[0]=s[0]*i,e[1]=s[1]*i,e[2]=s[2]*i,e[3]=0,e[4]=s[4]*n,e[5]=s[5]*n,e[6]=s[6]*n,e[7]=0,e[8]=s[8]*r,e[9]=s[9]*r,e[10]=s[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,s=t.x,i=t.y,n=t.z,r=Math.cos(s),o=Math.sin(s),h=Math.cos(i),a=Math.sin(i),c=Math.cos(n),l=Math.sin(n);if(t.order==="XYZ"){const u=r*c,d=r*l,y=o*c,x=o*l;e[0]=h*c,e[4]=-h*l,e[8]=a,e[1]=d+y*a,e[5]=u-x*a,e[9]=-o*h,e[2]=x-u*a,e[6]=y+d*a,e[10]=r*h}else if(t.order==="YXZ"){const u=h*c,d=h*l,y=a*c,x=a*l;e[0]=u+x*o,e[4]=y*o-d,e[8]=r*a,e[1]=r*l,e[5]=r*c,e[9]=-o,e[2]=d*o-y,e[6]=x+u*o,e[10]=r*h}else if(t.order==="ZXY"){const u=h*c,d=h*l,y=a*c,x=a*l;e[0]=u-x*o,e[4]=-r*l,e[8]=y+d*o,e[1]=d+y*o,e[5]=r*c,e[9]=x-u*o,e[2]=-r*a,e[6]=o,e[10]=r*h}else if(t.order==="ZYX"){const u=r*c,d=r*l,y=o*c,x=o*l;e[0]=h*c,e[4]=y*a-d,e[8]=u*a+x,e[1]=h*l,e[5]=x*a+u,e[9]=d*a-y,e[2]=-a,e[6]=o*h,e[10]=r*h}else if(t.order==="YZX"){const u=r*h,d=r*a,y=o*h,x=o*a;e[0]=h*c,e[4]=x-u*l,e[8]=y*l+d,e[1]=l,e[5]=r*c,e[9]=-o*c,e[2]=-a*c,e[6]=d*l+y,e[10]=u-x*l}else if(t.order==="XZY"){const u=r*h,d=r*a,y=o*h,x=o*a;e[0]=h*c,e[4]=-l,e[8]=a*c,e[1]=u*l+x,e[5]=r*c,e[9]=d*l-y,e[2]=y*l-d,e[6]=o*c,e[10]=x*l+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Ft,t,Ot)}lookAt(t,e,s){const i=this.elements;return T.subVectors(t,e),T.lengthSq()===0&&(T.z=1),T.normalize(),O.crossVectors(s,T),O.lengthSq()===0&&(Math.abs(s.z)===1?T.x+=1e-4:T.z+=1e-4,T.normalize(),O.crossVectors(s,T)),O.normalize(),J.crossVectors(T,O),i[0]=O.x,i[4]=J.x,i[8]=T.x,i[1]=O.y,i[5]=J.y,i[9]=T.y,i[2]=O.z,i[6]=J.z,i[10]=T.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const s=t.elements,i=e.elements,n=this.elements,r=s[0],o=s[4],h=s[8],a=s[12],c=s[1],l=s[5],u=s[9],d=s[13],y=s[2],x=s[6],m=s[10],p=s[14],M=s[3],_=s[7],w=s[11],g=s[15],z=i[0],S=i[4],C=i[8],k=i[12],P=i[1],R=i[5],I=i[9],A=i[13],v=i[2],L=i[6],G=i[10],at=i[14],ht=i[3],ct=i[7],lt=i[11],ut=i[15];return n[0]=r*z+o*P+h*v+a*ht,n[4]=r*S+o*R+h*L+a*ct,n[8]=r*C+o*I+h*G+a*lt,n[12]=r*k+o*A+h*at+a*ut,n[1]=c*z+l*P+u*v+d*ht,n[5]=c*S+l*R+u*L+d*ct,n[9]=c*C+l*I+u*G+d*lt,n[13]=c*k+l*A+u*at+d*ut,n[2]=y*z+x*P+m*v+p*ht,n[6]=y*S+x*R+m*L+p*ct,n[10]=y*C+x*I+m*G+p*lt,n[14]=y*k+x*A+m*at+p*ut,n[3]=M*z+_*P+w*v+g*ht,n[7]=M*S+_*R+w*L+g*ct,n[11]=M*C+_*I+w*G+g*lt,n[15]=M*k+_*A+w*at+g*ut,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],s=t[4],i=t[8],n=t[12],r=t[1],o=t[5],h=t[9],a=t[13],c=t[2],l=t[6],u=t[10],d=t[14],y=t[3],x=t[7],m=t[11],p=t[15],M=h*d-a*u,_=o*d-a*l,w=o*u-h*l,g=r*d-a*c,z=r*u-h*c,S=r*l-o*c;return e*(x*M-m*_+p*w)-s*(y*M-m*g+p*z)+i*(y*_-x*g+p*S)-n*(y*w-x*z+m*S)}determinantAffine(){const t=this.elements,e=t[0],s=t[4],i=t[8],n=t[1],r=t[5],o=t[9],h=t[2],a=t[6],c=t[10];return e*(r*c-o*a)-s*(n*c-o*h)+i*(n*a-r*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,s){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=s),this}invert(){const t=this.elements,e=t[0],s=t[1],i=t[2],n=t[3],r=t[4],o=t[5],h=t[6],a=t[7],c=t[8],l=t[9],u=t[10],d=t[11],y=t[12],x=t[13],m=t[14],p=t[15],M=e*o-s*r,_=e*h-i*r,w=e*a-n*r,g=s*h-i*o,z=s*a-n*o,S=i*a-n*h,C=c*x-l*y,k=c*m-u*y,P=c*p-d*y,R=l*m-u*x,I=l*p-d*x,A=u*p-d*m,v=M*A-_*I+w*R+g*P-z*k+S*C;if(v===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const L=1/v;return t[0]=(o*A-h*I+a*R)*L,t[1]=(i*I-s*A-n*R)*L,t[2]=(x*S-m*z+p*g)*L,t[3]=(u*z-l*S-d*g)*L,t[4]=(h*P-r*A-a*k)*L,t[5]=(e*A-i*P+n*k)*L,t[6]=(m*w-y*S-p*_)*L,t[7]=(c*S-u*w+d*_)*L,t[8]=(r*I-o*P+a*C)*L,t[9]=(s*P-e*I-n*C)*L,t[10]=(y*z-x*w+p*M)*L,t[11]=(l*w-c*z-d*M)*L,t[12]=(o*k-r*R-h*C)*L,t[13]=(e*R-s*k+i*C)*L,t[14]=(x*_-y*g-m*M)*L,t[15]=(c*g-l*_+u*M)*L,this}scale(t){const e=this.elements,s=t.x,i=t.y,n=t.z;return e[0]*=s,e[4]*=i,e[8]*=n,e[1]*=s,e[5]*=i,e[9]*=n,e[2]*=s,e[6]*=i,e[10]*=n,e[3]*=s,e[7]*=i,e[11]*=n,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],s=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,s,i))}makeTranslation(t,e,s){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,s,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),s=Math.sin(t);return this.set(1,0,0,0,0,e,-s,0,0,s,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,0,s,0,0,1,0,0,-s,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),s=Math.sin(t);return this.set(e,-s,0,0,s,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const s=Math.cos(e),i=Math.sin(e),n=1-s,r=t.x,o=t.y,h=t.z,a=n*r,c=n*o;return this.set(a*r+s,a*o-i*h,a*h+i*o,0,a*o+i*h,c*o+s,c*h-i*r,0,a*h-i*o,c*h+i*r,n*h*h+s,0,0,0,0,1),this}makeScale(t,e,s){return this.set(t,0,0,0,0,e,0,0,0,0,s,0,0,0,0,1),this}makeShear(t,e,s,i,n,r){return this.set(1,s,n,0,t,1,r,0,e,i,1,0,0,0,0,1),this}compose(t,e,s){const i=this.elements,n=e._x,r=e._y,o=e._z,h=e._w,a=n+n,c=r+r,l=o+o,u=n*a,d=n*c,y=n*l,x=r*c,m=r*l,p=o*l,M=h*a,_=h*c,w=h*l,g=s.x,z=s.y,S=s.z;return i[0]=(1-(x+p))*g,i[1]=(d+w)*g,i[2]=(y-_)*g,i[3]=0,i[4]=(d-w)*z,i[5]=(1-(u+p))*z,i[6]=(m+M)*z,i[7]=0,i[8]=(y+_)*S,i[9]=(m-M)*S,i[10]=(1-(u+x))*S,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,s){const i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];const n=this.determinantAffine();if(n===0)return s.set(1,1,1),e.identity(),this;let r=$.set(i[0],i[1],i[2]).length();const o=$.set(i[4],i[5],i[6]).length(),h=$.set(i[8],i[9],i[10]).length();n<0&&(r=-r),U.copy(this);const a=1/r,c=1/o,l=1/h;return U.elements[0]*=a,U.elements[1]*=a,U.elements[2]*=a,U.elements[4]*=c,U.elements[5]*=c,U.elements[6]*=c,U.elements[8]*=l,U.elements[9]*=l,U.elements[10]*=l,e.setFromRotationMatrix(U),s.x=r,s.y=o,s.z=h,this}makePerspective(t,e,s,i,n,r,o=2e3,h=!1){const a=this.elements,c=2*n/(e-t),l=2*n/(s-i),u=(e+t)/(e-t),d=(s+i)/(s-i);let y,x;if(h)y=n/(r-n),x=r*n/(r-n);else if(o===2e3)y=-(r+n)/(r-n),x=-2*r*n/(r-n);else if(o===2001)y=-r/(r-n),x=-r*n/(r-n);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return a[0]=c,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=l,a[9]=d,a[13]=0,a[2]=0,a[6]=0,a[10]=y,a[14]=x,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(t,e,s,i,n,r,o=2e3,h=!1){const a=this.elements,c=2/(e-t),l=2/(s-i),u=-(e+t)/(e-t),d=-(s+i)/(s-i);let y,x;if(h)y=1/(r-n),x=r/(r-n);else if(o===2e3)y=-2/(r-n),x=-(r+n)/(r-n);else if(o===2001)y=-1/(r-n),x=-n/(r-n);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return a[0]=c,a[4]=0,a[8]=0,a[12]=u,a[1]=0,a[5]=l,a[9]=0,a[13]=d,a[2]=0,a[6]=0,a[10]=y,a[14]=x,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(t){const e=this.elements,s=t.elements;for(let i=0;i<16;i++)if(e[i]!==s[i])return!1;return!0}fromArray(t,e=0){for(let s=0;s<16;s++)this.elements[s]=t[s+e];return this}toArray(t=[],e=0){const s=this.elements;return t[e]=s[0],t[e+1]=s[1],t[e+2]=s[2],t[e+3]=s[3],t[e+4]=s[4],t[e+5]=s[5],t[e+6]=s[6],t[e+7]=s[7],t[e+8]=s[8],t[e+9]=s[9],t[e+10]=s[10],t[e+11]=s[11],t[e+12]=s[12],t[e+13]=s[13],t[e+14]=s[14],t[e+15]=s[15],t}};ot.prototype.isMatrix4=!0;let Q=ot;const $=new b,U=new Q,Ft=new b(0,0,0),Ot=new b(1,1,1),O=new b,J=new b,T=new b;class K{constructor(t=new b(1/0,1/0,1/0),e=new b(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e+=3)this.expandByPoint(B.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,s=t.count;e<s;e++)this.expandByPoint(B.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,s=t.length;e<s;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const s=B.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(s),this.max.copy(t).add(s),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const s=t.geometry;if(s!==void 0){const n=s.getAttribute("position");if(e===!0&&n!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=n.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,B):B.fromBufferAttribute(n,r),B.applyMatrix4(t.matrixWorld),this.expandByPoint(B);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),tt.copy(t.boundingBox)):(s.boundingBox===null&&s.computeBoundingBox(),tt.copy(s.boundingBox)),tt.applyMatrix4(t.matrixWorld),this.union(tt)}const i=t.children;for(let n=0,r=i.length;n<r;n++)this.expandByObject(i[n],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,B),B.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,s;return t.normal.x>0?(e=t.normal.x*this.min.x,s=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,s=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,s+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,s+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,s+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,s+=t.normal.z*this.min.z),e<=-t.constant&&s>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(W),et.subVectors(this.max,W),Z.subVectors(t.a,W),X.subVectors(t.b,W),j.subVectors(t.c,W),N.subVectors(X,Z),V.subVectors(j,X),q.subVectors(Z,j);let e=[0,-N.z,N.y,0,-V.z,V.y,0,-q.z,q.y,N.z,0,-N.x,V.z,0,-V.x,q.z,0,-q.x,-N.y,N.x,0,-V.y,V.x,0,-q.y,q.x,0];return!ft(e,Z,X,j,et)||(e=[1,0,0,0,1,0,0,0,1],!ft(e,Z,X,j,et))?!1:(st.crossVectors(N,V),e=[st.x,st.y,st.z],ft(e,Z,X,j,et))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,B).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(B).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(F[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),F[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),F[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),F[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),F[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),F[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),F[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),F[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(F),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const F=[new b,new b,new b,new b,new b,new b,new b,new b],B=new b,tt=new K,Z=new b,X=new b,j=new b,N=new b,V=new b,q=new b,W=new b,et=new b,st=new b,D=new b;function ft(f,t,e,s,i){for(let n=0,r=f.length-3;n<=r;n+=3){D.fromArray(f,n);const o=i.x*Math.abs(D.x)+i.y*Math.abs(D.y)+i.z*Math.abs(D.z),h=t.dot(D),a=e.dot(D),c=s.dot(D);if(Math.max(-Math.max(h,a,c),Math.min(h,a,c))>o)return!1}return!0}const It=class It{constructor(t,e,s,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,s,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let s=0;s<4;s++)this.elements[s]=t[s+e];return this}set(t,e,s,i){const n=this.elements;return n[0]=t,n[2]=e,n[1]=s,n[3]=i,this}};It.prototype.isMatrix2=!0;let Pt=It;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}})),typeof window<"u"&&(window.__THREE__?dt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");new H().set(-1,0,0,0,1,0,0,0,1),new H().set(-1,0,0,0,1,0,0,0,1);function Nt(f,t,e){const s=Math.max(Math.abs(f),Math.abs(t),Math.abs(e));if(!Number.isFinite(s))throw new RangeError("SH coefficients must be finite");if(s===0)return 0;const i=Math.min(127,Math.max(-126,Math.ceil(Math.log2(s)))),n=127/2**i,r=pt(f,n),o=pt(t,n),h=pt(e,n),a=i+127;return(r|o<<8|h<<16|a<<24)>>>0}function pt(f,t){return Math.min(127,Math.max(-127,Math.round(f*t)))&255}function it(f){if(!Number.isInteger(f)||f<0)throw new RangeError("Gaussian LOD budget must be a non-negative integer")}function wt(f,t,e){return f.updateWorldMatrix(!0,!1),t.updateWorldMatrix(!0,!1),f.getWorldPosition(e),t.worldToLocal(e)}function gt(f,t){const e=t instanceof b?t.clone():f.octree.bounds.getCenter(new b),s=f.octree.rootBounds.getSize(new b),i=Math.max(s.length()*.5,Number.EPSILON),n=new b,r=Array.from(f.octree.leafNodeIds,o=>(f.octree.nodes[o].bounds.getCenter(n),{nodeId:o,radius:n.distanceTo(e)/i}));return r.sort((o,h)=>o.radius-h.radius||o.nodeId-h.nodeId),r}class Vt{cameraCenter=new b;center;levelDistance;constructor(t={}){if(this.center=t.center instanceof b?t.center.clone():t.center??"bounds-center",this.levelDistance=t.levelDistance??2,!(this.levelDistance>0)||!Number.isFinite(this.levelDistance))throw new RangeError("Radial LOD levelDistance must be finite and positive")}setCenter(t){return this.center=t instanceof b?t.clone():t,this}setFromCamera(t,e){return this.setCenter(wt(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(it(e),e===0)return Gt();const s=gt(t,this.center),i=s.map(({radius:o})=>Math.max(0,t.finestLevel-Math.floor(o/this.levelDistance)));let n=s.reduce((o,h,a)=>o+t.nodes[h.nodeId].levelCounts[i[a]],0);for(let o=s.length-1;o>=0&&n>e;o--){const h=t.nodes[s[o].nodeId];for(;i[o]>0&&n>e;){const a=h.levelCounts[i[o]];i[o]=i[o]-1,n-=a-h.levelCounts[i[o]]}}let r=s.length;for(;r>0&&n>e;){r--;const o=t.nodes[s[r].nodeId];n-=o.levelCounts[i[r]]}return{nodeIds:Uint32Array.from(s.slice(0,r).map(({nodeId:o})=>o)),lodLevels:Uint8Array.from(i.slice(0,r)),gaussianCount:n}}}function Gt(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}class qt{setFromCamera(t,e){return this}pack({lod:t,maxGaussians:e}){it(e);const s=t.octree.data.count;if(e<s)throw new RangeError(`Maximum LOD requires ${s} Gaussians but the budget allows ${e}`);const i=t.octree.leafNodeIds.slice(),n=new Uint8Array(i.length);return n.fill(t.finestLevel),{nodeIds:i,lodLevels:n,gaussianCount:s}}}class Dt{cameraCenter=new b;center;lodLevel;constructor(t={}){if(this.center=t.center instanceof b?t.center.clone():t.center??"bounds-center",t.lodLevel!==void 0&&t.lodLevel!=="finest"&&(!Number.isInteger(t.lodLevel)||t.lodLevel<0))throw new RangeError(\'Radial LOD level must be a non-negative integer or "finest"\');this.lodLevel=t.lodLevel??"finest"}setCenter(t){return this.center=t instanceof b?t.clone():t,this}setFromCamera(t,e){return this.setCenter(wt(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(it(e),e===0)return Yt();const s=this.lodLevel==="finest"?t.finestLevel:this.lodLevel;if(s>=t.levelCount)throw new RangeError(`Gaussian LOD level ${s} does not exist`);const i=gt(t,this.center),n=[];let r=0;for(const h of i){const a=t.nodes[h.nodeId].levelCounts[s];if(r+a>e)break;n.push(h.nodeId),r+=a}const o=new Uint8Array(n.length);return o.fill(s),{nodeIds:Uint32Array.from(n),lodLevels:o,gaussianCount:r}}}function Yt(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}class $t{cameraCenter=new b;center;budgetShares;constructor(t={}){this.center=t.center instanceof b?t.center.clone():t.center??"bounds-center",this.budgetShares=Zt(t.budgetShares??[.8,.1,.1])}setCenter(t){return this.center=t instanceof b?t.clone():t,this}setFromCamera(t,e){return this.setCenter(wt(t,e,this.cameraCenter))}pack({lod:t,maxGaussians:e}){if(it(e),e===0)return Xt();const s=t.octree.data.count;if(s<=e){const l=t.octree.leafNodeIds.slice(),u=new Uint8Array(l.length);return u.fill(t.finestLevel),{nodeIds:l,lodLevels:u,gaussianCount:s}}const i=gt(t,this.center),n=[t.finestLevel,Math.max(0,t.finestLevel-1),0],r=[],o=[];let h=0,a=0,c=0;for(let l=0;l<n.length;l++){const u=this.budgetShares[l];if(c+=u,u===0)continue;const d=l===n.length-1?e:Math.floor(e*c),y=n[l];for(;a<i.length;){const x=i[a],m=t.nodes[x.nodeId].levelCounts[y];if(h+m>d)break;r.push(x.nodeId),o.push(y),h+=m,a++}}return{nodeIds:Uint32Array.from(r),lodLevels:Uint8Array.from(o),gaussianCount:h}}}function Zt(f){let t=0;for(const e of f){if(!(e>=0&&e<=1))throw new RangeError("Tiered radial LOD budget shares must be in [0, 1]");t+=e}if(Math.abs(t-1)>1e-6)throw new RangeError("Tiered radial LOD budget shares must sum to 1");return Object.freeze([...f])}function Xt(){return{nodeIds:new Uint32Array,lodLevels:new Uint8Array,gaussianCount:0}}class jt{constructor(t,e,s,i,n,r){this.count=t,this.shDegree=e,this.shCoefficientCount=(e+1)**2,this.means={array:s},this.scalesOpacity={array:i},this.rotations={array:n},this.shCoefficients={array:r}}count;shDegree;shCoefficientCount;shFormat="float32";means;scalesOpacity;rotations;shCoefficients;dispose(){}}const Rt={char:1,uchar:1,short:2,ushort:2,int:4,uint:4,float:4,double:8,int8:1,uint8:1,int16:2,uint16:2,int32:4,uint32:4,float32:4,float64:8},Ht=["x","y","z","scale_0","scale_1","scale_2","rot_0","rot_1","rot_2","rot_3","opacity","f_dc_0","f_dc_1","f_dc_2"];class Wt{async load(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load PLY: ${e.status} ${e.statusText}`);if(e.headers.get("content-type")?.includes("text/html"))throw new Error(`Failed to load PLY: ${e.url||t} returned HTML instead of a PLY file`);return this.parse(await e.arrayBuffer())}parse(t){const e=Qt(t),s=new Map(e.properties.map((m,p)=>[m.name,p]));for(const m of Ht)if(!s.has(m))throw new Error(`Not a canonical 3DGS PLY: missing property ${m}`);const i=e.properties.map(m=>m.name.match(/^f_rest_(\\d+)$/)?.[1]).filter(m=>m!==void 0).map(Number).sort((m,p)=>m-p);for(let m=0;m<i.length;m++)if(i[m]!==m)throw new Error("f_rest_* properties must be contiguous from f_rest_0");if(i.length%3!==0)throw new Error("f_rest_* property count must be divisible by three");const n=i.length/3,r=n+1,o=Math.sqrt(r);if(!Number.isInteger(o)||o<1||o>4)throw new Error("PLY must contain one, four, nine, or sixteen SH coefficients per channel");const h=Jt(t,e),a=m=>s.get(m),c=i.map(m=>a(`f_rest_${m}`)),l=e.vertexCount,u=new Float32Array(l*4),d=new Float32Array(l*4),y=new Float32Array(l*4),x=new Float32Array(l*r*4);for(let m=0;m<l;m++){const p=m*4;u[p]=h(m,a("x")),u[p+1]=h(m,a("y")),u[p+2]=h(m,a("z")),d[p]=Math.max(Math.exp(h(m,a("scale_0"))),1e-6),d[p+1]=Math.max(Math.exp(h(m,a("scale_1"))),1e-6),d[p+2]=Math.max(Math.exp(h(m,a("scale_2"))),1e-6);const M=h(m,a("opacity"));d[p+3]=1/(1+Math.exp(-M));const _=h(m,a("rot_0")),w=h(m,a("rot_1")),g=h(m,a("rot_2")),z=h(m,a("rot_3")),S=Math.hypot(w,g,z,_);S>1e-12?(y[p]=w/S,y[p+1]=g/S,y[p+2]=z/S,y[p+3]=_/S):y[p+3]=1;const C=m*r*4;x[C]=h(m,a("f_dc_0")),x[C+1]=h(m,a("f_dc_1")),x[C+2]=h(m,a("f_dc_2"));for(let k=1;k<r;k++){const P=C+k*4,R=k-1;for(let I=0;I<3;I++){const A=c[I*n+R];x[P+I]=h(m,A)}}}return new jt(l,o-1,u,d,y,x)}}function Qt(f){const t=new Uint8Array(f),e=new TextEncoder().encode("end_header");let s=-1;for(let y=0;y<=t.length-e.length;y++){let x=!0;for(let m=0;m<e.length;m++)if(t[y+m]!==e[m]){x=!1;break}if(x){s=y;break}}if(s<0)throw new Error("Invalid PLY: end_header is missing");let i=s+e.length;if(t[i]===13&&i++,t[i]!==10)throw new Error("Invalid PLY: end_header must terminate a line");i++;const r=new TextDecoder().decode(t.subarray(0,i)).split(/\\r?\\n/);if(r[0]?.trim()!=="ply")throw new Error("Invalid PLY signature");let o=null,h="",a=-1,c=0;const l=[],u=[];for(const y of r){const x=y.trim().split(/\\s+/);if(x[0]==="format"){if(x[1]!=="ascii"&&x[1]!=="binary_little_endian"&&x[1]!=="binary_big_endian")throw new Error(`Unsupported PLY format: ${x[1]??"unknown"}`);o=x[1]}else if(x[0]==="element"){h=x[1]??"";const m=Number(x[2]);if(!Number.isInteger(m)||m<0)throw new Error(`Invalid element count for ${h}`);u.push({name:h,count:m}),h==="vertex"&&(a=m)}else if(x[0]==="property"&&h==="vertex"){if(x[1]==="list")throw new Error("List properties are not supported in the vertex element");const m=x[1],p=x[2];if(!(m in Rt)||p===void 0)throw new Error(`Unsupported vertex property: ${y}`);l.push({name:p,type:m,byteOffset:c}),c+=Rt[m]}}if(o===null)throw new Error("Invalid PLY: format is missing");if(a<=0)throw new Error("PLY must contain at least one vertex");if(u.find(y=>y.count>0)?.name!=="vertex")throw new Error("The canonical 3DGS vertex element must be first");return{format:o,vertexCount:a,properties:l,vertexStride:c,dataOffset:i}}function Jt(f,t){if(t.format==="ascii"){const n=new TextDecoder().decode(new Uint8Array(f,t.dataOffset)),r=new Float64Array(t.vertexCount*t.properties.length);let o=0;for(let h=0;h<r.length;h++){for(;o<n.length&&/\\s/.test(n[o]);)o++;const a=o;for(;o<n.length&&!/\\s/.test(n[o]);)o++;const c=Number(n.slice(a,o));if(!Number.isFinite(c))throw new Error(`Invalid ASCII PLY value at scalar ${h}`);r[h]=c}return(h,a)=>r[h*t.properties.length+a]}if(t.dataOffset+t.vertexCount*t.vertexStride>f.byteLength)throw new Error("Binary PLY ends before the vertex data is complete");const s=new DataView(f),i=t.format==="binary_little_endian";return(n,r)=>{const o=t.properties[r],h=t.dataOffset+n*t.vertexStride+o.byteOffset;return Kt(s,h,o.type,i)}}function Kt(f,t,e,s){switch(e){case"char":case"int8":return f.getInt8(t);case"uchar":case"uint8":return f.getUint8(t);case"short":case"int16":return f.getInt16(t,s);case"ushort":case"uint16":return f.getUint16(t,s);case"int":case"int32":return f.getInt32(t,s);case"uint":case"uint32":return f.getUint32(t,s);case"float":case"float32":return f.getFloat32(t,s);case"double":case"float64":return f.getFloat64(t,s)}}function zt(f){const t=f.nodes,e=new Float32Array(t.length*7),s=new Uint32Array(t.length*2),i=new Uint32Array(t.length*2),n=[],r=[];for(const h of t){const a=h.id*7,{min:c,max:l}=h.raycastBounds;if(e.set([c.x,c.y,c.z,l.x,l.y,l.z,h.maxSplatRadius],a),s.set([n.length,h.children.length],h.id*2),n.push(...h.children),i.set([r.length,h.gaussianIndices?.length??0],h.id*2),h.gaussianIndices!==null)for(const u of h.gaussianIndices)r.push(u)}const o=f.data;return{means:Float32Array.from(o.means.array).buffer,scalesOpacity:Float32Array.from(o.scalesOpacity.array).buffer,rotations:Float32Array.from(o.rotations.array).buffer,nodeBounds:e.buffer,nodeChildren:s.buffer,children:Uint32Array.from(n).buffer,nodeIndices:i.buffer,indices:Uint32Array.from(r).buffer}}class vt{constructor(t,e,s){this.octreeNodeId=t,this.sortedGaussianIndices=e,this.levelCounts=s}octreeNodeId;sortedGaussianIndices;levelCounts}const te=[{retention:.2},{retention:.5},{retention:1}];class nt{constructor(t,e){this.octree=t,this.levels=ee(e.levels??te),this.ownsOctree=e.ownsOctree??!1;const s=e.importance??se,i=new Float64Array(t.data.count);for(let n=0;n<i.length;n++){const r=s(n,t);i[n]=Number.isFinite(r)?r:-1/0}this.nodes=t.nodes.map(n=>{if(n.gaussianIndices===null)return new vt(n.id,new Uint32Array,new Uint32Array(this.levels.length));const r=Uint32Array.from(Array.from(n.gaussianIndices).sort((o,h)=>i[h]-i[o]||o-h));return new vt(n.id,r,Uint32Array.from(this.levels.map(({retention:o})=>Math.min(r.length,Math.max(1,Math.ceil(r.length*o))))))})}octree;static build(t,e={}){return new nt(t,e)}levels;nodes;ownsOctree;disposed=!1;get levelCount(){return this.levels.length}get finestLevel(){return this.levels.length-1}getNode(t){this.assertUsable();const e=this.nodes[t];if(e===void 0)throw new RangeError(`GaussianLod node ${t} does not exist`);return e}indicesForPacking(t){if(this.assertUsable(),t.nodeIds.length!==t.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const e=new Uint32Array(t.gaussianCount),s=new Set;let i=0;for(let n=0;n<t.nodeIds.length;n++){const r=t.nodeIds[n],o=this.getLeafNode(r);if(s.has(r))throw new Error(`GaussianLodPacking contains duplicate leaf node ${r}`);s.add(r);const h=t.lodLevels[n],a=o.levelCounts[h];if(a===void 0)throw new RangeError(`GaussianLod level ${h} does not exist`);if(i+a>e.length)throw new RangeError("GaussianLodPacking gaussianCount is too small");for(let c=0;c<a;c++)e[i++]=o.sortedGaussianIndices[c]}if(i!==e.length)throw new RangeError(`GaussianLodPacking declares ${e.length} Gaussians but selects ${i}`);return e}raycast(t,e,s={}){this.assertUsable();const i=s.radiusScale??3;if(!(i>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const n=s.maxHits??1/0;if(!(n>0))return[];if(e.nodeIds.length!==e.lodLevels.length)throw new RangeError("GaussianLodPacking arrays must have equal lengths");const r=this.octree.data.means.array,o=this.octree.data.scalesOpacity.array,h=new b,a=new b,c=[],l=new Set;for(let u=0;u<e.nodeIds.length;u++){const d=e.nodeIds[u],y=this.getLeafNode(d);if(l.has(d))throw new Error(`GaussianLodPacking contains duplicate leaf node ${d}`);l.add(d);const x=e.lodLevels[u],m=y.levelCounts[x];if(m===void 0)throw new RangeError(`GaussianLod level ${x} does not exist`);const p=this.octree.nodes[d],M=Math.max(0,i-3)*p.maxSplatRadius,_=M===0?p.raycastBounds:p.raycastBounds.clone().expandByScalar(M);if(t.intersectsBox(_))for(let w=0;w<m;w++){const g=y.sortedGaussianIndices[w],z=g*4;h.set(r[z],r[z+1],r[z+2]);const S=Math.max(o[z],o[z+1],o[z+2])*i;t.closestPointToPoint(h,a),!(a.distanceToSquared(h)>S*S)&&c.push({gaussianIndex:g,distance:t.origin.distanceTo(a),point:a.clone()})}}return c.sort((u,d)=>u.distance-d.distance),c.length>n&&(c.length=n),c}dispose(){this.disposed||(this.disposed=!0,this.ownsOctree&&this.octree.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianLod has been disposed")}getLeafNode(t){const e=this.getNode(t);if(this.octree.nodes[t]?.isLeaf!==!0)throw new Error(`GaussianLodPacking must reference leaf nodes; node ${t} is internal`);return e}}function ee(f){if(f.length===0||f.length>256)throw new RangeError("GaussianLod requires between 1 and 256 levels");let t=0;const e=f.map(({retention:s})=>{if(!(s>t&&s<=1))throw new RangeError("GaussianLod retention values must increase and stay in (0, 1]");return t=s,Object.freeze({retention:s})});if(Math.abs(t-1)>Number.EPSILON)throw new RangeError("GaussianLod finest retention must be 1");return Object.freeze(e)}function se(f,t){const e=t.data.scalesOpacity.array,s=f*4,i=[e[s],e[s+1],e[s+2]];return i.sort((n,r)=>r-n),e[s+3]*i[0]*i[1]}class ie{constructor(t,e,s,i,n,r,o,h){this.id=t,this.depth=e,this.bounds=s,this.count=i,this.maxSplatRadius=n,this.raycastBounds=h,this.children=r,this.gaussianIndices=o}id;depth;bounds;count;maxSplatRadius;raycastBounds;children;gaussianIndices;get isLeaf(){return this.children.length===0}}class rt{constructor(t,e,s,i){this.data=t,this.leafCapacity=e,this.maxDepth=s,this.ownsData=i,this.bounds=ne(t),this.rootBounds=re(this.bounds);const n=t.means.array,r=t.scalesOpacity.array,o=[],h=[],a=Array.from({length:t.count},(l,u)=>u),c=(l,u,d)=>{const y=o.length;o.push(null);const x=l.length>e&&d<s&&u.max.x-u.min.x>Number.EPSILON,m=[];if(x){const _=u.getCenter(new b),w=Array.from({length:8},()=>[]);for(const g of l){const z=g*4,S=(n[z]>=_.x?1:0)|(n[z+1]>=_.y?2:0)|(n[z+2]>=_.z?4:0);w[S].push(g)}for(let g=0;g<8;g++){const z=w[g];z.length!==0&&m.push(c(z,oe(u,_,g),d+1))}}let p=0;if(m.length>0)for(const _ of m)p=Math.max(p,o[_].maxSplatRadius);else{for(const _ of l){const w=_*4;p=Math.max(p,r[w],r[w+1],r[w+2])}h.push(y)}const M=u.clone().expandByScalar(p*3);return o[y]=new ie(y,d,u,l.length,p,m,m.length===0?Uint32Array.from(l):null,M),y};c(a,this.rootBounds.clone(),0),this.nodes=o,this.leafNodeIds=Uint32Array.from(h)}data;leafCapacity;maxDepth;static build(t,e={}){const s=e.leafCapacity??256,i=e.maxDepth??10;if(!Number.isInteger(s)||s<=0)throw new RangeError("GaussianOctree leafCapacity must be positive");if(!Number.isInteger(i)||i<0)throw new RangeError("GaussianOctree maxDepth must be non-negative");return new rt(t,s,i,e.ownsData??!1)}bounds;rootBounds;rootNode=0;nodes;leafNodeIds;ownsData;disposed=!1;raycast(t,e={}){this.assertUsable();const s=e.radiusScale??3;if(!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");const i=e.maxHits??1/0;if(!(i>0))return[];const n=[],r=[this.rootNode];for(;r.length>0;){const o=this.nodes[r.pop()],h=Math.max(0,s-3)*o.maxSplatRadius,a=h===0?o.raycastBounds:o.raycastBounds.clone().expandByScalar(h);if(t.intersectsBox(a))if(o.gaussianIndices!==null)for(const c of o.gaussianIndices)n.push(c);else for(const c of o.children)r.push(c)}return this.raycastIndices(t,n,s,i)}raycastIndices(t,e,s=3,i=1/0){if(this.assertUsable(),!(s>0))throw new RangeError("GaussianOctree raycast radiusScale must be positive");if(!(i>0))return[];const n=this.data.means.array,r=this.data.scalesOpacity.array,o=new b,h=new b,a=[];for(let c=0;c<e.length;c++){const l=e[c],u=l*4;o.set(n[u],n[u+1],n[u+2]);const d=Math.max(r[u],r[u+1],r[u+2])*s;t.closestPointToPoint(o,h),!(h.distanceToSquared(o)>d*d)&&a.push({gaussianIndex:l,distance:t.origin.distanceTo(h),point:h.clone()})}return a.sort((c,l)=>c.distance-l.distance),a.length>i&&(a.length=i),a}dispose(){this.disposed||(this.disposed=!0,this.ownsData&&this.data.dispose())}assertUsable(){if(this.disposed)throw new Error("GaussianOctree has been disposed")}}function ne(f){const t=f.means.array,e=new K,s=new b;for(let i=0;i<f.count;i++){const n=i*4;s.set(t[n],t[n+1],t[n+2]),e.expandByPoint(s)}return e}function re(f){const t=f.getCenter(new b),e=f.getSize(new b),s=Math.max(e.x,e.y,e.z,1e-6)*.5;return new K(new b(t.x-s,t.y-s,t.z-s),new b(t.x+s,t.y+s,t.z+s))}function oe(f,t,e){return new K(new b(e&1?t.x:f.min.x,e&2?t.y:f.min.y,e&4?t.z:f.min.z),new b(e&1?f.max.x:t.x,e&2?f.max.y:t.y,e&4?f.max.z:t.z))}const ae=new Set(["means","scalesOpacity","rotations","shCoefficients","lodLevel"]),he=new Q;class ce{listeners=new Set;clouds=new Map;usedCloudIds=new Set;usedCommandIds=new Set;cancelled=new Set;pendingCommands=new Set;activeLoads=new Map;parser=new Wt;config;frontend=null;work=Promise.resolve();nextObjectId=0;layoutVersion=0;contentVersion=0;sceneRevision=0;cameraPosition=new b;packed=null;target=null;updateScheduled=!1;sceneUpdateTimer=null;pendingTransforms=[];disposed=!1;constructor(t){this.config=t}subscribe(t){if(this.disposed)throw new Error("Backend disposed");return this.listeners.add(t),()=>this.listeners.delete(t)}dispatch(t){if(this.disposed)throw new Error("Backend disposed");if(this.usedCommandIds.has(t.id))throw new Error(`Duplicate backend command id: ${t.id}`);if(this.usedCommandIds.add(t.id),t.type==="cancel"){this.pendingCommands.has(t.targetCommandId)&&(this.cancelled.add(t.targetCommandId),this.activeLoads.get(t.targetCommandId)?.abort()),this.emit({type:"command-completed",commandId:t.id});return}this.pendingCommands.add(t.id),this.work=this.work.then(async()=>{try{if(this.cancelled.delete(t.id)){this.emit({type:"command-cancelled",commandId:t.id});return}await this.handle(t)}catch(e){this.cancelled.delete(t.id)?this.emit({type:"command-cancelled",commandId:t.id}):this.emit({type:"error",commandId:t.id,cloudId:"cloudId"in t?t.cloudId:void 0,code:e instanceof RangeError?"invalid-range":"backend-error",message:e instanceof Error?e.message:String(e)})}finally{this.pendingCommands.delete(t.id)}})}dispose(){if(!this.disposed){this.disposed=!0,this.sceneUpdateTimer!==null&&clearTimeout(this.sceneUpdateTimer);for(const t of this.activeLoads.values())t.abort();this.activeLoads.clear(),this.listeners.clear(),this.clouds.clear(),this.packed=null,this.target=null}}emit(t){if(!this.disposed)for(const e of this.listeners)e(t)}async handle(t){switch(t.type){case"load-cloud":case"load-cloud-from-buffer":{if(this.usedCloudIds.has(t.cloudId))throw new Error(`Cloud id already used: ${t.cloudId}`);const e=new AbortController;this.activeLoads.set(t.id,e);try{let s;if(t.type==="load-cloud"){const l=await fetch(t.url,{signal:e.signal});if(!l.ok)throw new Error(`PLY fetch failed: ${l.status}`);if(l.headers.get("content-type")?.includes("text/html"))throw new Error("PLY URL returned HTML instead of a PLY file");const u=await l.arrayBuffer();if(e.signal.aborted)throw new DOMException("Load cancelled","AbortError");s=this.parser.parse(u)}else s=this.parser.parse(t.buffer);const i=t.options??{},n=rt.build(s,i.octree),r=nt.build(n,i.lod),o={id:t.cloudId,objectId:this.nextObjectId++,source:s,octree:n,lod:r,octreeOptions:i.octree,lodOptions:i.lod,attributes:new Map,transform:he.clone(),priority:Tt(i.priority??0),packingStrategy:i.packingStrategy??this.config.defaultPackingStrategy??{type:"tiered-radial"},raycastable:i.raycastable??!0,sourceVersion:1};for(const l of i.attributes??[]){if(ae.has(l.name)||o.attributes.has(l.name))throw new Error(`Reserved or duplicate attribute name: ${l.name}`);o.attributes.set(l.name,le(l,s.count))}for(const l of this.clouds.values())for(const[u,d]of o.attributes){const y=l.attributes.get(u);if(y&&(y.format!==d.format||y.elementsPerGaussian!==d.elementsPerGaussian))throw new Error(`Attribute schema differs across clouds: ${u}`)}this.usedCloudIds.add(o.id),this.clouds.set(o.id,o);let h=null;if(this.frontend)try{h=this.compute()}catch(l){throw this.clouds.delete(o.id),this.usedCloudIds.delete(o.id),l}const{min:a,max:c}=n.bounds;this.emit({type:"cloud-loaded",commandId:t.id,cloudId:o.id,objectId:o.objectId,sourceCount:s.count,shDegree:s.shDegree,bounds:[a.x,a.y,a.z,c.x,c.y,c.z],raycast:o.raycastable?zt(n):void 0}),h&&(this.target=null,this.replace(h));return}finally{this.activeLoads.delete(t.id)}}case"unload-cloud":this.clouds.delete(t.cloudId),this.emit({type:"cloud-unloaded",commandId:t.id,cloudId:t.cloudId}),this.repack();return;case"set-cloud-priority":{const e=this.getCloud(t.cloudId),s=e.priority;e.priority=Tt(t.priority);try{this.repack()}catch(i){throw e.priority=s,i}}break;case"set-cloud-packing":{const e=this.getCloud(t.cloudId),s=e.packingStrategy;e.packingStrategy=t.packingStrategy;try{this.repack()}catch(i){throw e.packingStrategy=s,i}}break;case"set-cloud-transform":{const e=this.getCloud(t.cloudId);if(t.worldMatrix.length!==16)throw new RangeError("Cloud transform needs sixteen numbers");if(t.sceneRevision<this.sceneRevision)break;this.sceneRevision=t.sceneRevision,e.transform.fromArray(t.worldMatrix),this.pendingTransforms.push(t.id),this.scheduleSceneUpdate();return}case"set-cloud-raycastable":{const e=this.getCloud(t.cloudId);e.raycastable=t.raycastable,this.emit({type:"cloud-raycast-changed",commandId:t.id,cloudId:e.id,raycastable:e.raycastable,raycast:e.raycastable?zt(e.octree):void 0});return}case"write-attribute-range":this.writeRange(t),this.updateTarget();break;case"set-frontend-capabilities":{const{capabilities:e}=t;for(const i of[e.maxStorageBufferBindingSize,e.maxBufferSize,e.maxStorageBuffersPerShaderStage])if(!Number.isSafeInteger(i)||i<=0)throw new RangeError("Frontend buffer limits must be positive integers");if(typeof e.supportsPartialBufferUpdates!="boolean")throw new TypeError("Frontend partial update support must be boolean");const s=this.frontend;this.frontend={...e};try{this.clouds.size>0&&this.repack()}catch(i){throw this.frontend=s,i}break}case"set-camera":if(t.worldMatrix.length!==16||t.projectionMatrix.length!==16)throw new RangeError("Camera matrices need sixteen numbers each");if(t.sceneRevision<this.sceneRevision)break;this.sceneRevision=t.sceneRevision,this.cameraPosition.set(t.worldMatrix[12],t.worldMatrix[13],t.worldMatrix[14]),this.flushSceneUpdate();break}this.emit({type:"command-completed",commandId:t.id})}scheduleSceneUpdate(){this.sceneUpdateTimer!==null&&clearTimeout(this.sceneUpdateTimer),this.sceneUpdateTimer=setTimeout(()=>{if(this.sceneUpdateTimer=null,!this.disposed)try{this.flushSceneUpdate()}catch{}},16)}flushSceneUpdate(){this.sceneUpdateTimer!==null&&clearTimeout(this.sceneUpdateTimer),this.sceneUpdateTimer=null;const t=this.pendingTransforms.splice(0);try{this.updateTarget();for(const e of t)this.emit({type:"command-completed",commandId:e})}catch(e){for(const s of t)this.emit({type:"error",commandId:s,code:e instanceof RangeError?"invalid-range":"backend-error",message:e instanceof Error?e.message:String(e)});throw e}}getCloud(t){const e=this.clouds.get(t);if(!e)throw new Error(`Unknown cloud: ${t}`);return e}writeRange(t){const e=this.getCloud(t.cloudId),{firstGaussian:s,gaussianCount:i,attribute:n}=t;if(!Number.isSafeInteger(s)||!Number.isSafeInteger(i)||s<0||i<0||s+i>e.source.count)throw new RangeError("Attribute range exceeds source cloud");if(n==="lodLevel")throw new Error("lodLevel is computed by the backend");let r,o;switch(n){case"means":r=e.source.means.array,o=4;break;case"scalesOpacity":r=e.source.scalesOpacity.array,o=4;break;case"rotations":r=e.source.rotations.array,o=4;break;case"shCoefficients":r=e.source.shCoefficients.array,o=e.source.shCoefficientCount*4;break;default:{const a=e.attributes.get(n);if(!a)throw new Error(`Unknown source attribute: ${n}`);r=a.values,o=a.elementsPerGaussian}}if(t.data.byteLength!==i*o*4)throw new RangeError("Attribute update has the wrong byte length");const h=r instanceof Uint32Array?new Uint32Array(t.data):new Float32Array(t.data);if(r.set(h,s*o),(n==="means"||n==="scalesOpacity"||n==="rotations")&&(e.octree=rt.build(e.source,e.octreeOptions),e.lod=nt.build(e.octree,e.lodOptions),e.sourceVersion++,e.raycastable)){const{min:a,max:c}=e.octree.bounds;this.emit({type:"raycast-replaced",cloudId:e.id,sourceVersion:e.sourceVersion,bounds:[a.x,a.y,a.z,c.x,c.y,c.z],raycast:zt(e.octree)})}}maxSlots(t,e){const s=this.frontend;if(!s)throw new Error("Frontend capabilities have not been supplied");const i=Math.min(s.maxStorageBufferBindingSize,s.maxBufferSize),n=[16,16,16,(t+1)**2*4,4,...[...e.values()].map(o=>o.elementsPerGaussian*4)],r=Math.min(...n.map(o=>Math.floor(i/o)));if(r<1)throw new RangeError("Frontend buffer limits are too small");return Math.min(r,this.config.maxGaussians==="auto"||this.config.maxGaussians===void 0?r:this.config.maxGaussians)}compute(t=0){const e=[...this.clouds.values()].sort((w,g)=>w.priority-g.priority||w.objectId-g.objectId),s=e.reduce((w,g)=>Math.max(w,g.source.shDegree),0),i=new Map;for(const w of e)for(const[g,z]of w.attributes)i.set(g,z);let n=this.maxSlots(s,i);const r=[];for(const w of e){const g=this.select(w,Math.min(n,w.source.count)),z=w.lod.indicesForPacking(g),S=new Uint32Array(z.length),C=[];let k=0;for(let P=0;P<g.nodeIds.length;P++){const R=w.lod.nodes[g.nodeIds[P]],I=g.lodLevels[P],A=R.levelCounts[I];S.fill(I,k,k+A),k+=A,C.push(k)}r.push({entry:w,indices:z,levels:S,cellEnds:C}),n-=z.length}const o=r.reduce((w,g)=>w+g.indices.length,0),h=Math.max(1,o,t),a=new Map,c=(w,g,z)=>{const S=g==="f32"?new Float32Array(h*z):new Uint32Array(h*z);return a.set(w,{format:g,elementsPerGaussian:z,values:S}),S},l=c("means","f32",4),u=c("scalesOpacity","f32",4),d=c("rotations","f32",4),y=c("shCoefficients","u32",(s+1)**2),x=c("lodLevel","u32",1),m=new Uint32Array(h);for(const[w,g]of i)c(w,g.format,g.elementsPerGaussian);const p=[];let M=0,_=1;for(const{entry:w,indices:g,levels:z,cellEnds:S}of r){const C=w.source,k=C.shCoefficients.array;let P=0;for(let R=0;R<g.length;R++,M++){for(;R>=S[P];)P++;m[M]=_+P;const I=g[R];l.set(C.means.array.subarray(I*4,I*4+4),M*4),l[M*4+3]=w.objectId,u.set(C.scalesOpacity.array.subarray(I*4,I*4+4),M*4),d.set(C.rotations.array.subarray(I*4,I*4+4),M*4),x[M]=z[R];for(let A=0;A<C.shCoefficientCount;A++){const v=(I*C.shCoefficientCount+A)*4;y[M*(s+1)**2+A]=Nt(k[v],k[v+1],k[v+2])}for(const[A,v]of w.attributes){const L=a.get(A).values,G=v.elementsPerGaussian;L.set(v.values.subarray(I*G,(I+1)*G),M*G)}}_+=S.length,p.push({cloudId:w.id,objectId:w.objectId,renderedCount:g.length})}return{capacity:h,count:o,degree:s,attributes:a,cells:m,clouds:p}}select(t,e){const s=this.cameraPosition.clone().applyMatrix4(t.transform.clone().invert()),i=t.packingStrategy;switch(i.type){case"maximum":return new qt().pack({lod:t.lod,maxGaussians:e});case"radial":return new Dt({center:s,lodLevel:i.lodLevel}).pack({lod:t.lod,maxGaussians:e});case"tiered-radial":return new $t({center:s,budgetShares:i.budgetShares}).pack({lod:t.lod,maxGaussians:e});case"distance-aware-radial":return new Vt({center:s,levelDistance:i.levelDistance}).pack({lod:t.lod,maxGaussians:e})}}repack(){if(!this.frontend)return;this.target=null;const t=this.compute();this.replace(t)}updateTarget(){if(!this.frontend||!this.packed)return;const t=this.compute(this.packed.capacity);if(!this.frontend.supportsPartialBufferUpdates){this.replace(t);return}if(t.capacity!==this.packed.capacity||t.degree!==this.packed.degree||[...t.attributes].some(([e,s])=>this.packed?.attributes.get(e)?.elementsPerGaussian!==s.elementsPerGaussian)){this.replace(t);return}this.target=t,this.scheduleUpdate()}replace(t){this.packed=t,this.layoutVersion++,this.contentVersion++;const e=[...t.attributes].map(([s,i])=>({name:s,format:i.format,elementsPerGaussian:i.elementsPerGaussian,data:i.values.slice().buffer}));this.emit({type:"buffers-replaced",sceneRevision:this.sceneRevision,layoutVersion:this.layoutVersion,contentVersion:this.contentVersion,count:t.count,capacity:t.capacity,objectCapacity:this.nextObjectId,shDegree:t.degree,shFormat:"rgb8e8",attributes:e,clouds:t.clouds})}scheduleUpdate(){this.updateScheduled||(this.updateScheduled=!0,setTimeout(()=>{this.updateScheduled=!1,!(this.disposed||!this.target||!this.packed)&&this.emitNextPatch()},0))}emitNextPatch(){const t=this.packed,e=this.target,s=this.config.streamingLod?.maxUploadBytesPerUpdate??1024*1024,i=Math.max(1,this.config.streamingLod?.maxChangedCellsPerUpdate??16),n=[...t.attributes.values()].reduce((u,d)=>u+d.elementsPerGaussian*4,0),r=Math.max(1,Math.floor(s/n)),o=[],h=new Set;for(let u=0;u<t.capacity&&o.length<r;u++)if([...t.attributes].some(([d,y])=>{const x=e.attributes.get(d).values,m=u*y.elementsPerGaussian;for(let p=0;p<y.elementsPerGaussian;p++)if(y.values[m+p]!==x[m+p])return!0;return!1})){const d=e.cells[u];if(!h.has(d)&&h.size>=i)break;h.add(d),o.push(u)}const a=[];if(o.length===0){if(JSON.stringify(t.clouds)!==JSON.stringify(e.clouds)){const u=this.contentVersion++;this.emit({type:"buffers-patched",sceneRevision:this.sceneRevision,layoutVersion:this.layoutVersion,baseContentVersion:u,contentVersion:this.contentVersion,patches:[],changedClouds:e.clouds,lodPending:!1})}this.packed={...t,count:e.count,clouds:e.clouds,cells:e.cells},this.target=null;return}for(const[u,d]of t.attributes){const y=d.elementsPerGaussian,x=e.attributes.get(u).values;let m=-1,p=-1;const M=()=>{if(m<0)return;const _=m*y,w=(p+1)*y;d.values.set(x.subarray(_,w),_),a.push({name:u,firstSlot:m,slotCount:p-m+1,data:x.slice(_,w).buffer}),m=-1};for(const _ of o){const w=_*y;let g=!1;for(let z=0;z<y;z++)if(d.values[w+z]!==x[w+z]){g=!0;break}if(!g){M();continue}m<0?m=_:_!==p+1&&(M(),m=_),p=_}M()}const c=[...t.attributes].some(([u,d])=>{const y=e.attributes.get(u).values;return d.values.some((x,m)=>x!==y[m])}),l=this.contentVersion++;this.emit({type:"buffers-patched",sceneRevision:this.sceneRevision,layoutVersion:this.layoutVersion,baseContentVersion:l,contentVersion:this.contentVersion,patches:a,changedClouds:c?t.clouds:e.clouds,lodPending:c}),c?this.scheduleUpdate():(this.packed={...t,count:e.count,clouds:e.clouds,cells:e.cells},this.target=null)}}function Tt(f){if(!Number.isSafeInteger(f))throw new RangeError("Priority must be a safe integer");return f}function le(f,t){const e=f.elementsPerGaussian;if(!Number.isSafeInteger(e)||e<1)throw new RangeError("Attribute elementsPerGaussian must be positive");const s=t*e,i=f.format==="f32"?new Float32Array(s):new Uint32Array(s);if(f.source.kind==="fill")i.fill(f.source.value==="ones"?1:0);else{if(f.source.data.byteLength!==s*4)throw new RangeError("Attribute buffer has the wrong byte length");i.set(f.format==="f32"?new Float32Array(f.source.data):new Uint32Array(f.source.data))}return{format:f.format,elementsPerGaussian:e,values:i}}function ue(f){const t=new Set,e=new Set,s=i=>{if(i instanceof ArrayBuffer){t.add(i);return}if(!(i===null||typeof i!="object"||e.has(i)))if(e.add(i),Array.isArray(i))for(const n of i)s(n);else for(const n of Object.values(i))s(n)};return s(f),[...t]}const bt=globalThis;let Y=null;bt.onmessage=({data:f})=>{if(f.type==="initialize"){if(Y)throw new Error("Streaming backend already initialized");Y=new ce(f.config),Y.subscribe(t=>{bt.postMessage({type:"event",event:t},ue(t))}),bt.postMessage({type:"ready"})}else if(f.type==="dispatch"){if(!Y)throw new Error("Streaming backend not initialized");Y.dispatch(f.command)}else Y?.dispose(),Y=null}})();\n', $s = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", ur], { type: "text/javascript;charset=utf-8" });
function Ji(a) {
  let t;
  try {
    if (t = $s && (self.URL || self.webkitURL).createObjectURL($s), !t) throw "";
    const e = new Worker(t, {
      name: a?.name
    });
    return e.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), e;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(ur),
      {
        name: a?.name
      }
    );
  }
}
function Ki(a) {
  const t = /* @__PURE__ */ new Set(), e = /* @__PURE__ */ new Set(), s = (r) => {
    if (r instanceof ArrayBuffer) {
      t.add(r);
      return;
    }
    if (!(r === null || typeof r != "object" || e.has(r)))
      if (e.add(r), Array.isArray(r))
        for (const i of r) s(i);
      else
        for (const i of Object.values(r)) s(i);
  };
  return s(a), [...t];
}
class Qi {
  listeners = /* @__PURE__ */ new Set();
  port;
  disposed = !1;
  constructor(t, e) {
    this.port = e ?? new Ji({ name: "3dgs-streaming-backend" }), this.port.addEventListener("message", this.onMessage), this.port.addEventListener("error", this.onError), this.port.postMessage({ type: "initialize", config: t });
  }
  subscribe(t) {
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  dispatch(t) {
    if (this.disposed) throw new Error("Worker streaming backend disposed");
    this.port.postMessage(
      { type: "dispatch", command: t },
      Ki(t)
    );
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.port.removeEventListener("message", this.onMessage), this.port.removeEventListener("error", this.onError), this.port.postMessage({ type: "dispose" }), this.port.terminate(), this.listeners.clear());
  }
  onMessage = (t) => {
    if (!(this.disposed || t.data.type !== "event"))
      for (const e of this.listeners) e(t.data.event);
  };
  onError = (t) => {
    const e = {
      type: "error",
      code: "worker-error",
      message: t.message || "Worker failed"
    };
    for (const s of this.listeners) s(e);
  };
}
class ga extends zr {
  constructor(t, e = {}) {
    const s = e.minDepth ?? 0, r = e.maxDepth ?? 1 / 0, i = t.nodes.filter(
      (p) => p.depth >= s && p.depth <= r && (e.leavesOnly !== !0 || p.isLeaf)
    ), n = new Float32Array(i.length * 12 * 2 * 3);
    let o = 0;
    for (const p of i) {
      const { min: d, max: m } = p.bounds, g = [
        [d.x, d.y, d.z],
        [m.x, d.y, d.z],
        [m.x, m.y, d.z],
        [d.x, m.y, d.z],
        [d.x, d.y, m.z],
        [m.x, d.y, m.z],
        [m.x, m.y, m.z],
        [d.x, m.y, m.z]
      ];
      for (const [f, c] of tn)
        n.set(g[f], o), n.set(g[c], o + 3), o += 6;
    }
    const l = new Lr();
    l.setAttribute("position", new Ir(n, 3)), l.computeBoundingSphere();
    const h = e.opacity ?? 0.55, u = new Ar({
      color: e.color ?? 7710719,
      opacity: h,
      transparent: h < 1,
      depthTest: e.depthTest ?? !1,
      depthWrite: !1,
      toneMapped: !1
    });
    super(l, u), this.octree = t, this.cellCount = i.length, this.name = "Gaussian octree helper", this.frustumCulled = !1, this.renderOrder = 1e3;
  }
  octree;
  isOctreeHelper = !0;
  cellCount;
  dispose() {
    this.removeFromParent(), this.geometry.dispose(), this.material.dispose();
  }
}
const tn = [
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
], en = [
  16731501,
  16758531,
  3725718,
  5032432,
  10182117
];
class fa extends Ks {
  constructor(t, e, s = {}) {
    super(), this.lod = t, this.packing = e, this.colors = s.colors !== void 0 && s.colors.length > 0 ? [...s.colors] : en, this.opacity = s.opacity ?? 0.14, this.wireframe = s.wireframe ?? !1, this.depthTest = s.depthTest ?? !1, this.name = "Gaussian LOD helper", this.frustumCulled = !1, t.indicesForPacking(e), this.rebuildMeshes(), this.setLevels(
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
      const n = this.packing.lodLevels[i], o = t[n];
      if (o === void 0)
        throw new RangeError(`Gaussian LOD level ${n} does not exist`);
      o.push(this.packing.nodeIds[i]);
    }
    const e = new Y(), s = new Y(), r = new Dt();
    for (let i = 0; i < t.length; i++) {
      const n = t[i];
      if (n.length === 0) continue;
      const o = new Rr(1, 1, 1), l = new Pr({
        color: this.colors[i % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: !1,
        side: Or,
        toneMapped: !1,
        wireframe: this.wireframe
      }), h = new Br(o, l, n.length);
      for (let u = 0; u < n.length; u++) {
        const p = this.lod.octree.nodes[n[u]].bounds;
        p.getCenter(e), p.getSize(s), r.makeScale(s.x, s.y, s.z), r.setPosition(e), h.setMatrixAt(u, r);
      }
      h.instanceMatrix.needsUpdate = !0, h.computeBoundingSphere(), h.name = `Gaussian LOD ${i} volumes`, h.frustumCulled = !1, h.renderOrder = 900 + i, h.userData.lodLevel = i, this.levelMeshes.set(i, h), this.add(h);
    }
  }
  disposeMeshes() {
    for (const t of this.levelMeshes.values())
      t.removeFromParent(), t.geometry.dispose(), t.material.dispose();
    this.levelMeshes.clear();
  }
}
const Xe = A("uint", "gaussianIndex"), Ze = A("uint", "gaussianObjectId"), ye = A("vec3", "gaussianPositionLocal"), se = A("vec3", "gaussianPositionWorld"), xe = A("vec3", "gaussianScale"), be = A("vec4", "gaussianRotation"), we = A("float", "gaussianOpacity"), Je = A("vec3", "gaussianColor"), Ke = A("mat4", "gaussianObjectMatrix"), Qe = A("bool", "gaussianObjectVisible"), ts = A("vec3", "gaussianViewDirection"), es = A("float", "gaussianViewDepth"), ss = A(
  "vec2",
  "gaussianScreenPosition"
), cr = A(
  "vec2",
  "gaussianScreenBoundsMin"
), dr = A(
  "vec2",
  "gaussianScreenBoundsMax"
), rs = A(
  "vec2",
  "gaussianProjectedSigma"
), is = A("float", "gaussianProjectedArea"), ve = A("uint", "rasterGaussianIndex"), ns = A("uint", "rasterObjectId"), as = A("uvec2", "rasterPixelCoordinate"), os = A("vec2", "rasterScreenPosition"), ls = A("vec2", "rasterScreenUV"), hs = A("float", "rasterPixelValue"), us = A("vec2", "rasterGaussianCenter"), cs = A("vec2", "rasterPixelDelta"), pr = A("vec2", "rasterGaussianCoord"), mr = A("vec2", "rasterUV"), ds = A("float", "rasterViewDepth"), ps = A("vec3", "rasterGaussianColor"), ms = A("float", "rasterGaussianOpacity"), gs = A("float", "rasterPower"), gr = A("float", "rasterWeight");
function sn() {
  return {
    gaussianPositionLocalNode: ye,
    gaussianPositionWorldNode: se,
    gaussianScaleNode: xe,
    gaussianRotationNode: be,
    gaussianOpacityNode: we,
    gaussianColorNode: Je,
    gaussianVisibilityNode: Ut(!0),
    rasterPixelValueNode: V(0),
    rasterBreakNode: Ut(!1),
    rasterColorNode: ps,
    rasterAlphaNode: ms.mul(Qs(gs)),
    rasterDiscardNode: Ut(!1)
  };
}
const Qt = /* @__PURE__ */ new Set([
  Xe,
  Ze,
  ye,
  se,
  xe,
  be,
  we,
  Je,
  Ke,
  Qe,
  ts,
  es,
  ss,
  cr,
  dr,
  rs,
  is
]), fs = /* @__PURE__ */ new Set([
  ve,
  ns,
  as,
  os,
  ls,
  hs,
  us,
  cs,
  pr,
  mr,
  ds,
  ps,
  ms,
  gs,
  gr
]), fr = /* @__PURE__ */ new Set([
  as,
  os,
  ls
]), rn = /* @__PURE__ */ new Set([
  ...fr,
  hs,
  ve,
  ns,
  us,
  cs,
  ds
]);
function yr(a, t, e) {
  a.traverse((s) => {
    if ((Qt.has(s) || fs.has(s)) && !t.has(s))
      throw new Error(
        `A ${e} GaussianPass node graph uses an accessor from the other domain`
      );
  });
}
function zt(a, t, e) {
  a.traverse((s) => {
    if ((Qt.has(s) || fs.has(s)) && !t.has(s))
      throw new Error(
        `GaussianPass.${e} uses a context accessor that is not available at that pipeline point`
      );
  });
}
const nn = [
  15228264,
  15906891,
  4900235
];
class ya {
  constructor(t, e = {}) {
    if (this.pass = t, e.colors !== void 0 && e.colors.length === 0)
      throw new RangeError("Gaussian LOD color palette must not be empty");
    const s = e.tintStrength ?? 0.45;
    if (!Number.isFinite(s) || s < 0 || s > 1)
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1"
      );
    this.colors = [...e.colors ?? nn], this.tintStrength = s, this.lodLevelAttribute = t.gaussianStore.enablePackedLodLevelAttribute(), this.unsubscribeDebug = t.subscribeDebug(() => this.update()), this.enabled = e.enabled ?? !0;
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
    const t = this.lodLevelAttribute.bufferAttribute, e = w(t, "uint", t.count).toReadOnly().element(ve).mod(x(this.colors.length)), s = this.colors.map((n) => {
      const o = new Fr(n).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace
      );
      return ce(o.r, o.g, o.b);
    });
    let r = s[s.length - 1];
    for (let n = s.length - 2; n >= 0; n--)
      r = e.equal(x(n)).select(s[n], r);
    const i = Xr(
      this.baseColorNode,
      r,
      V(this.tintStrength)
    );
    this.boundBuffer = t, this.helperColorNode = i, this.pass.rasterColorNode = i;
  }
  assertUsable() {
    if (this.disposed)
      throw new Error("GaussianLodColorHelper has been disposed");
  }
}
const an = {
  maxGaussians: "auto"
};
class xa {
  attributes = new qe();
  backend;
  packedShFormat = "rgb8e8";
  maxGaussiansOption = "auto";
  cloudMap = /* @__PURE__ */ new Map();
  cloudIds = /* @__PURE__ */ new Map();
  pendingLoads = /* @__PURE__ */ new Map();
  pendingMutations = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  schemas = /* @__PURE__ */ new Map();
  extraBuffers = /* @__PURE__ */ new Map();
  unsubscribe;
  data = null;
  revision = 0;
  commandNumber = 0;
  cloudNumber = 0;
  lastView = "";
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
  awaitingLayout = !1;
  frontendCapabilities = null;
  constructor(t = new Qi(
    an
  )) {
    this.backend = t, this.unsubscribe = t.subscribe(this.handleEvent);
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
  get needsPack() {
    return !1;
  }
  get hasPackedData() {
    return this.data !== null && !this.awaitingLayout;
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
    const r = typeof document > "u" ? t : new URL(t, document.baseURI).href, i = this.nextCommandId(), n = this.nextCloudId(), o = this.awaitLoad(i, e, s);
    this.awaitingLayout = !0;
    try {
      this.backend.dispatch({
        type: "load-cloud",
        id: i,
        cloudId: n,
        url: r,
        options: e
      });
    } catch (l) {
      this.rejectLoad(i, l);
    }
    return o;
  }
  async loadBuffer(t, e = {}, s) {
    if (s?.aborted) throw new DOMException("Load cancelled", "AbortError");
    const r = this.nextCommandId(), i = this.nextCloudId(), n = this.awaitLoad(r, e, s);
    this.awaitingLayout = !0;
    try {
      this.backend.dispatch({
        type: "load-cloud-from-buffer",
        id: r,
        cloudId: i,
        buffer: t,
        options: e
      });
    } catch (o) {
      this.rejectLoad(r, o);
    }
    return n;
  }
  remove(t) {
    const e = this.cloudIds.get(t);
    e !== void 0 && (this.cloudMap.delete(e), this.cloudIds.delete(t), t.setRaycastIndex(null), t.removeFromParent(), this.awaitingLayout = !0, this.notify("clouds"), this.backend.dispatch({
      type: "unload-cloud",
      id: this.nextCommandId(),
      cloudId: e
    }));
  }
  updatePackingPriority(t, e) {
    if (!Number.isSafeInteger(e))
      throw new RangeError("Priority must be a safe integer");
    const s = this.requireId(t), r = this.cloudMap.get(s), i = r.priority;
    r.priority = e, t.updatePackingPriority(e), this.awaitingLayout = !0;
    const n = this.nextCommandId();
    this.pendingMutations.set(n, () => {
      r.priority === e && (r.priority = i, t.updatePackingPriority(i));
    });
    try {
      this.backend.dispatch({ type: "set-cloud-priority", id: n, cloudId: s, priority: e });
    } catch (o) {
      throw this.pendingMutations.get(n)?.(), this.pendingMutations.delete(n), this.awaitingLayout = this.pendingLoads.size > 0, o;
    }
  }
  setCloudPacking(t, e) {
    const s = this.requireId(t), r = this.cloudMap.get(s), i = r.packingStrategy;
    r.packingStrategy = e, this.awaitingLayout = !0;
    const n = this.nextCommandId();
    this.pendingMutations.set(n, () => {
      r.packingStrategy === e && (r.packingStrategy = i);
    });
    try {
      this.backend.dispatch({ type: "set-cloud-packing", id: n, cloudId: s, packingStrategy: e });
    } catch (o) {
      throw this.pendingMutations.get(n)?.(), this.pendingMutations.delete(n), this.awaitingLayout = this.pendingLoads.size > 0, o;
    }
  }
  setCloudRaycastable(t, e) {
    const s = this.requireId(t);
    e || t.setRaycastIndex(null), this.backend.dispatch({
      type: "set-cloud-raycastable",
      id: this.nextCommandId(),
      cloudId: s,
      raycastable: e
    });
  }
  writeAttributeRange(t, e, s, r, i) {
    this.backend.dispatch({
      type: "write-attribute-range",
      id: this.nextCommandId(),
      cloudId: this.requireId(t),
      attribute: e,
      firstGaussian: s,
      gaussianCount: r,
      data: i
    });
  }
  invalidateCloudPacking(t) {
    const e = this.requireId(t), s = this.cloudMap.get(e).packingStrategy;
    s && this.setCloudPacking(t, s);
  }
  enablePackedLodLevelAttribute() {
    return this.attributes.get("lodLevel") ?? this.attributes[ge]("lodLevel", "u32");
  }
  getPackedAttribute(t) {
    return t === "lodLevel" ? this.attributes.get(t)?.bufferAttribute : this.extraBuffers.get(t);
  }
  pack(t) {
  }
  setFrontendCapabilities(t) {
    if (this.disposed) throw new Error("GaussianStore disposed");
    const e = this.frontendCapabilities;
    if (e && e.maxStorageBufferBindingSize === t.maxStorageBufferBindingSize && e.maxBufferSize === t.maxBufferSize && e.maxStorageBuffersPerShaderStage === t.maxStorageBuffersPerShaderStage && e.supportsPartialBufferUpdates === t.supportsPartialBufferUpdates)
      return;
    const s = this.awaitingLayout;
    this.awaitingLayout = !0, this.frontendCapabilities = { ...t };
    try {
      this.backend.dispatch({
        type: "set-frontend-capabilities",
        id: this.nextCommandId(),
        capabilities: { ...t }
      });
    } catch (r) {
      throw this.frontendCapabilities = e, this.awaitingLayout = s, r;
    }
  }
  updateLod(t) {
    if (this.disposed) return { appliedBatches: 0, pending: !1, clouds: [] };
    t.updateWorldMatrix(!0, !1);
    const e = t.getWorldPosition(new Y()), s = t.matrixWorld.elements.slice(), r = t.projectionMatrix.elements.slice(), i = this.clouds.map((o) => (o.updateWorldMatrix(!0, !1), [this.requireId(o), ...o.matrixWorld.elements])), n = JSON.stringify([
      s,
      r,
      i
    ]);
    if (n !== this.lastView) {
      this.lastView = n;
      const o = ++this.revision;
      for (const [l, ...h] of i)
        this.backend.dispatch({
          type: "set-cloud-transform",
          id: this.nextCommandId(),
          cloudId: l,
          sceneRevision: o,
          worldMatrix: h
        });
      this.backend.dispatch({
        type: "set-camera",
        id: this.nextCommandId(),
        sceneRevision: o,
        worldMatrix: s,
        projectionMatrix: r
      });
    }
    return {
      appliedBatches: 0,
      pending: this.pendingLod,
      clouds: this.clouds.map((o) => ({
        cloud: o,
        focusDistance: e.distanceTo(
          o.getWorldPosition(new Y())
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
    if (!this.data || this.awaitingLayout)
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
      this.disposed = !0, this.unsubscribe(), this.backend.dispose();
      for (const t of this.pendingLoads.values())
        t.cleanup(), t.reject(new Error("GaussianStore disposed"));
      this.pendingLoads.clear(), this.pendingMutations.clear();
      for (const { cloud: t } of this.cloudMap.values())
        t.setRaycastIndex(null), t.removeFromParent();
      this.cloudMap.clear(), this.data?.dispose(), this.data = null;
      for (const t of this.extraBuffers.values()) t.dispose();
      this.extraBuffers.clear(), this.attributes[fe](), this.listeners.clear();
    }
  }
  handleEvent = (t) => {
    if (!this.disposed)
      switch (t.type) {
        case "cloud-loaded": {
          const e = this.pendingLoads.get(t.commandId)?.options ?? {}, s = e.priority ?? 0, r = new de(
            this,
            t.objectId,
            0,
            e.name ?? t.cloudId,
            null,
            null,
            s
          );
          r.raycastMode = "full", t.raycast && r.setRaycastIndex(new ue(t.raycast)), this.cloudMap.set(t.cloudId, {
            cloud: r,
            sourceCount: t.sourceCount,
            bounds: t.bounds,
            priority: s,
            sourceVersion: 1,
            packingStrategy: e.packingStrategy
          }), this.cloudIds.set(r, t.cloudId), this.pendingLoads.get(t.commandId)?.cleanup(), this.pendingLoads.get(t.commandId)?.resolve(r), this.pendingLoads.delete(t.commandId), this.lastView = "", this.notify("clouds");
          break;
        }
        case "cloud-unloaded":
          break;
        case "cloud-raycast-changed": {
          const e = this.cloudMap.get(t.cloudId);
          e && e.cloud.setRaycastIndex(
            t.raycast ? new ue(t.raycast) : null
          );
          break;
        }
        case "raycast-replaced": {
          const e = this.cloudMap.get(t.cloudId);
          e && t.sourceVersion > e.sourceVersion && (e.sourceVersion = t.sourceVersion, e.bounds = t.bounds, e.cloud.setRaycastIndex(new ue(t.raycast)));
          break;
        }
        case "buffers-replaced":
          this.replace(t);
          break;
        case "buffers-patched":
          this.patch(t);
          break;
        case "error": {
          const e = new Error(t.message);
          t.commandId && this.pendingLoads.has(t.commandId) ? this.rejectLoad(t.commandId, e) : t.commandId ? (this.pendingMutations.get(t.commandId)?.(), this.pendingMutations.delete(t.commandId), this.commandError = e, this.awaitingLayout = this.pendingLoads.size > 0) : this.lastError = e, this.notify("content");
          break;
        }
        case "command-cancelled":
          this.rejectLoad(
            t.commandId,
            new DOMException("Load cancelled", "AbortError")
          );
          break;
        case "command-completed":
          this.pendingMutations.delete(t.commandId), this.commandError && (this.commandError = null, this.notify("content"));
          break;
      }
  };
  replace(t) {
    if (t.layoutVersion <= this.packedLayoutVersion) return;
    const e = new Map(
      t.attributes.map((i) => [i.name, i])
    ), s = (i) => {
      const n = e.get(i);
      if (!n) throw new Error(`Missing backend attribute: ${i}`);
      return n;
    }, r = this.data;
    this.data = t.clouds.length > 0 ? new pe(
      {
        means: le("means", s("means").data),
        scalesOpacity: le(
          "scalesOpacity",
          s("scalesOpacity").data
        ),
        rotations: le(
          "rotations",
          s("rotations").data
        ),
        shCoefficients: js(
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
    ) : null, r?.dispose(), this.schemas.clear();
    for (const i of t.attributes)
      this.schemas.set(i.name, i);
    for (const i of this.extraBuffers.values()) i.dispose();
    this.extraBuffers.clear();
    for (const i of t.attributes)
      i.name === "lodLevel" ? this.enablePackedLodLevelAttribute()[ee](
        new Uint32Array(i.data)
      ) : ["means", "scalesOpacity", "rotations", "shCoefficients"].includes(
        i.name
      ) || this.extraBuffers.set(
        i.name,
        i.format === "f32" ? le(
          i.name,
          i.data,
          i.elementsPerGaussian
        ) : js(
          i.name,
          i.data,
          i.elementsPerGaussian
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
        (i, n) => i + n.data.byteLength,
        0
      ),
      writtenSlotRanges: t.count ? [{ start: 0, count: t.count }] : [],
      clearedSlotRanges: [],
      planningMs: 0,
      slotUpdateMs: 0
    }, this.awaitingLayout = !1, this.lastView = "", this.notify("layout");
  }
  patch(t) {
    if (t.layoutVersion !== this.packedLayoutVersion || t.baseContentVersion !== this.packedVersion)
      return;
    for (const i of t.patches) {
      const n = this.schemas.get(i.name);
      if (!n) continue;
      const o = this.attributeArray(i.name);
      if (!o) continue;
      const l = i.firstSlot * n.elementsPerGaussian, h = n.format === "f32" ? new Float32Array(i.data) : new Uint32Array(i.data);
      if (o.set(h, l), i.name === "lodLevel")
        this.enablePackedLodLevelAttribute()[me]([
          { start: i.firstSlot, count: i.slotCount }
        ]);
      else {
        const u = this.getPackedAttribute(i.name) ?? this.data?.[i.name];
        u && H(
          u,
          [{ start: i.firstSlot, count: i.slotCount }],
          n.elementsPerGaussian
        );
      }
    }
    this.applyCloudStates(t.changedClouds), this.packedVersion = t.contentVersion, this.pendingLod = t.lodPending;
    const e = t.patches.map((i) => ({
      start: i.firstSlot,
      count: i.slotCount
    })), s = /* @__PURE__ */ new Set();
    for (const i of e)
      for (let n = i.start; n < i.start + i.count; n++)
        s.add(n);
    const r = t.changedClouds.reduce(
      (i, n) => i + n.renderedCount,
      0
    );
    this.packStats = {
      fullRebuild: !1,
      slotCapacity: this.capacity,
      activeGaussians: r,
      reusedSlots: Math.max(0, r - s.size),
      writtenSlots: s.size,
      clearedSlots: 0,
      estimatedUploadBytes: t.patches.reduce(
        (i, n) => i + n.data.byteLength,
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
      this.cloudMap.get(e.cloudId)?.cloud.updatePacking(e.renderedCount, null);
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
    return new Promise((r, i) => {
      const n = () => this.backend.dispatch({
        type: "cancel",
        id: this.nextCommandId(),
        targetCommandId: t
      });
      s?.addEventListener("abort", n, { once: !0 }), this.pendingLoads.set(t, {
        resolve: r,
        reject: i,
        options: e,
        cleanup: () => s?.removeEventListener("abort", n)
      });
    });
  }
  rejectLoad(t, e) {
    const s = this.pendingLoads.get(t);
    s && (s.cleanup(), this.pendingLoads.delete(t), this.awaitingLayout = this.pendingLoads.size > 0, s.reject(e));
  }
}
function le(a, t, e = 4) {
  const s = new gt(new Float32Array(t), e);
  return s.name = `3dgs.store.${a}`, s;
}
function js(a, t, e = 1) {
  const s = new gt(new Uint32Array(t), e);
  return s.name = `3dgs.store.${a}`, s;
}
const U = 16, S = 256, on = 8192, G = 512, Ve = 4, L = 1 << Ve, at = 4, ut = S * at, Q = ut, ot = 32, ln = (
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
), hn = (
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
), un = (
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
function xr(a, t) {
  return Math.max(1, Math.ceil(2 * a / t));
}
function cn(a, t) {
  if (a !== null) {
    if (!Number.isInteger(a) || a < S || a % S !== 0)
      throw new RangeError(
        `rasterChunkSize must be a multiple of ${S} and at least ${S}`
      );
    if (xr(t, a) > 65535)
      throw new RangeError(
        "rasterChunkSize creates more than 65,535 worst-case chunk tasks"
      );
  }
}
const dn = (
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
  let reduce_chunks = (radix_blocks + ${Q - 1}u) / ${Q}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${L}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${S - 1}u) / ${S}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, count, radix_blocks, 0u);
  return 0u;
}
`
);
function pn(a) {
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
const mn = (
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
      new gt(new Float32Array(e * s), s)
    );
  }
  createUint(t, e, s = 1) {
    return this.track(
      t,
      new gt(new Uint32Array(e * s), s)
    );
  }
  createIndirect(t) {
    return this.track(
      t,
      new Ur(new Uint32Array(4), 4)
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
class gn {
  constructor(t, e, s, r, i) {
    this.renderer = t, this.visibleDispatch = i, this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      e
    );
    const n = B(
      mn
    );
    this.computeNode = n({
      rank: rt,
      state: w(i.state, "uvec4", 1).toReadOnly(),
      depth_sorted_gaussians: w(
        r,
        "uvec2",
        e
      ).toReadOnly(),
      tile_counts: w(
        s,
        "uint",
        e
      ).toReadOnly(),
      ordered_tile_counts: w(this.tileCounts, "uint", e)
    }).computeKernel([S]).setName("3DGS gather depth-ordered tile counts WGSL");
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
function br(a) {
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
  scratch: ptr<workgroup, array<u32, ${G}>>
) -> u32 {
  let base = group_id * ${G}u;
  let first = base + lane;
  let second = first + ${S}u;
  (*scratch)[lane] = ${a.readValue("first")};
  (*scratch)[lane + ${S}u] = ${a.readValue("second")};
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
  if (second < length) { (*output_values)[second] = (*scratch)[lane + ${S}u]; }
  return 0u;
}
`
  );
}
const fn = br({
  functionName: "scan_blocks",
  inputType: "u32",
  readValue: (a) => `select(0u, (*input_values)[${a}], ${a} < length)`
}), yn = br({
  functionName: "scan_visibility_blocks",
  inputType: "vec4<f32>",
  readValue: (a) => `select(0u, 1u, ${a} < length && (*input_values)[${a}].w > 0.0)`
}), xn = (
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
class Ge {
  output;
  attributes = new ct();
  levels = [];
  constructor(t, e, s = "intersections", r = "uint") {
    this.output = this.attributes.createUint(`3dgs.${s}-offsets`, e);
    const i = B(fn), n = B(
      yn
    ), o = B(xn);
    let l = t, h = this.output, u = e;
    for (; ; ) {
      const p = Math.ceil(u / G), d = this.attributes.createUint(
        `3dgs.${s}-scan-sums-${this.levels.length}`,
        p
      ), m = j("uint", G), g = this.levels.length === 0 && r === "projectedVisibility", f = (g ? n : i)({
        lane: wt,
        group_id: K.x,
        length: x(u),
        input_values: w(
          l,
          g ? "vec4" : "uint",
          u
        ).toReadOnly(),
        output_values: w(h, "uint", u),
        block_sums: w(d, "uint", p),
        scratch: m
      }).computeKernel([S]).setName(`3DGS ${s} scan WGSL level ${this.levels.length}`);
      if (this.levels.push({
        length: u,
        blockCount: p,
        output: h,
        scanNode: f
      }), p <= 1) break;
      l = d, u = p, h = this.attributes.createUint(
        `3dgs.${s}-scan-offsets-${this.levels.length}`,
        u
      );
    }
    for (let p = 0; p < this.levels.length - 1; p++) {
      const d = this.levels[p], m = this.levels[p + 1];
      d.addNode = o({
        index: rt,
        length: x(d.length),
        values: w(d.output, "uint", d.length),
        block_offsets: w(
          m.output,
          "uint",
          m.length
        ).toReadOnly()
      }).compute(d.length, [S]).setName(`3DGS ${s} add scan offsets WGSL ${p}`);
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
class bn {
  constructor(t, e) {
    this.camera = t, this.background = e;
  }
  camera;
  background;
  projection = qt(new Dt());
  view = qt(new Dt());
  viewport = qt(new Dr());
  tilesX = qt(1, "uint");
  tilesY = qt(1, "uint");
  update(t, e, s, r) {
    this.camera.updateWorldMatrix(!0, !1), this.projection.value.copy(this.camera.projectionMatrix), this.view.value.copy(this.camera.matrixWorldInverse), this.viewport.value.set(t, e, this.camera.near, this.camera.far), this.tilesX.value = s, this.tilesY.value = r;
  }
}
function wr(a) {
  const { center: t, conic: e, powerThreshold: s, tileX: r, tileY: i, onHit: n } = a;
  return (
    /* wgsl */
    `
      let rect_min = vec2<f32>(f32(${r}), f32(${i})) * ${U}.0;
      let rect_max = rect_min + vec2<f32>(${U}.0);
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
          select(-${U}.0, ${U}.0, x_left),
          select(-${U}.0, ${U}.0, y_above)
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
        ${n}
      }`
  );
}
const wn = (
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
  let reduce_chunks = (radix_blocks + ${Q - 1}u) / ${Q}u;
  (*radix_block_dispatch)[0] = vec4<u32>(radix_blocks, 1u, 1u, 0u);
  (*radix_reduce_dispatch)[0] = vec4<u32>(reduce_chunks, ${L}u, 1u, 0u);
  (*linear_dispatch)[0] = vec4<u32>(
    (count + ${S - 1}u) / ${S}u,
    1u, 1u, 0u
  );
  (*state)[0] = vec4<u32>(count, total, radix_blocks, select(0u, 1u, total > capacity));
  return 0u;
}
`
), vn = (() => {
  const a = wr({
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
    clamp(i32(floor((center.x - radius.x) / ${U}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius.y) / ${U}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius.x) / ${U}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius.y) / ${U}.0)), 0, max_tile_y)
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
class Sn {
  constructor(t, e, s, r, i, n, o, l, h, u, p) {
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
    const d = w(
      n,
      "uint",
      e
    ).toReadOnly(), m = w(
      o,
      "uint",
      e
    ).toReadOnly(), g = w(
      i.state,
      "uvec4",
      1
    ).toReadOnly(), f = B(wn);
    this.prepareNode = f({
      item_count_state: g,
      capacity: x(s),
      tile_counts: d,
      intersection_offsets: m,
      state: w(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: w(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: w(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: w(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare intersection indirect dispatch WGSL");
    const c = B(vn);
    this.emitNode = c({
      rank: rt,
      tiles: te(p.tilesX, p.tilesY),
      capacity: x(s),
      sorted_gaussians: w(
        r,
        "uvec2",
        e
      ).toReadOnly(),
      projected_mean: w(
        l,
        "vec4",
        e
      ).toReadOnly(),
      projected_conic: w(
        h,
        "vec4",
        e
      ).toReadOnly(),
      projected_color: w(
        u,
        "vec4",
        e
      ).toReadOnly(),
      tile_counts: d,
      intersection_offsets: m,
      visible_state: g,
      records: w(this.buffers.recordsA, "uvec2", s)
    }).computeKernel([S]).setName("3DGS emit depth-ordered intersections WGSL"), this.visibleLinearDispatch = i;
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
const $e = 10;
class Nn {
  constructor(t, e, s) {
    this.camera = t, this.store = e, this.frameComponentOffset = s * 4, this.frameComponentCount = e.objectCapacity * $e * 4, this.values = new Float32Array(
      this.frameComponentOffset + this.frameComponentCount
    ), this.attribute = new gt(this.values, 4), this.attribute.name = "3dgs.object-frame-state";
  }
  camera;
  store;
  attribute;
  values;
  frameComponentOffset;
  frameComponentCount;
  modelView = new Dt();
  inverseModel = new Dt();
  cameraWorldPosition = new Y();
  cameraLocalPosition = new Y();
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
    const e = this.frameComponentOffset + t.objectId * $e * 4;
    this.values.set(t.matrixWorld.elements, e), this.values.set(this.modelView.elements, e + 16), this.values[e + 32] = this.cameraLocalPosition.x, this.values[e + 33] = this.cameraLocalPosition.y, this.values[e + 34] = this.cameraLocalPosition.z, this.values[e + 35] = 1, this.values[e + 36] = Tn(t, this.camera) ? 1 : 0;
  }
}
function Tn(a, t) {
  if (!a.layers.test(t.layers)) return !1;
  let e = a, s = a;
  for (; e !== null; ) {
    if (!e.visible) return !1;
    s = e, e = e.parent;
  }
  return s instanceof je;
}
function _n(a) {
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
function Mn(a) {
  const t = a === "rgb8e8" ? "u32" : "vec4<f32>", e = a === "rgb8e8" ? (
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
const Cn = (
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
function En() {
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
${wr({
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
const vr = /* @__PURE__ */ new Set([
  Xe,
  Ze,
  ye,
  xe,
  be,
  we,
  Ke,
  Qe
]), Sr = /* @__PURE__ */ new Set([
  ...vr,
  se,
  ts
]), kn = /* @__PURE__ */ new Set([
  ...Sr,
  es,
  ss,
  rs,
  is
]);
class zn {
  constructor(t, e, s, r, i, n = !0) {
    this.data = t, this.frame = e, this.antialiasMode = r, this.subpixelSampleCulling = n, this.projectedMean = s.attribute, this.projectedConic = this.attributes.createFloat(
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
      yr(s, Qt, "projection");
    zt(
      t.gaussianPositionLocalNode,
      vr,
      "gaussianPositionLocalNode"
    );
    for (const [s, r] of [
      ["gaussianPositionWorldNode", t.gaussianPositionWorldNode],
      ["gaussianScaleNode", t.gaussianScaleNode],
      ["gaussianRotationNode", t.gaussianRotationNode]
    ])
      zt(r, Sr, s);
    zt(
      t.gaussianOpacityNode,
      kn,
      "gaussianOpacityNode"
    ), zt(
      t.gaussianColorNode,
      Qt,
      "gaussianColorNode"
    ), zt(
      t.gaussianVisibilityNode,
      Qt,
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
    const { data: e, frame: s } = this, r = w(e.means, "vec4", e.count).toReadOnly(), i = w(
      e.scalesOpacity,
      "vec4",
      e.count
    ).toReadOnly(), n = w(e.rotations, "vec4", e.count).toReadOnly(), o = e.shFormat === "rgb8e8" ? w(
      e.shCoefficients,
      "uint",
      e.count * e.shCoefficientCount
    ).toReadOnly() : w(
      e.shCoefficients,
      "vec4",
      e.count * e.shCoefficientCount
    ).toReadOnly(), l = w(
      this.projectedMean,
      "vec4",
      this.projectedMean.count
    ), h = w(this.projectedConic, "vec4", e.count), u = w(this.projectedColor, "vec4", e.count), p = w(this.tileCounts, "uint", e.count), d = B(
      _n(this.antialiasMode)
    ), m = B(Mn(e.shFormat)), g = B(En()), f = B(Cn);
    return he(() => {
      const y = x(rt);
      F(y.greaterThanEqual(x(e.count)), () => {
        mt();
      }), p.element(y).assign(x(0)), l.element(y).assign(et(0));
      const _ = r.element(y), M = _.xyz, v = x(_.w), b = i.element(y), T = b.xyz, k = b.w, C = n.element(y), N = x(e.count).add(
        v.mul(x($e))
      ), z = Ns(
        l.element(N),
        l.element(N.add(1)),
        l.element(N.add(2)),
        l.element(N.add(3))
      ), R = Ns(
        l.element(N.add(4)),
        l.element(N.add(5)),
        l.element(N.add(6)),
        l.element(N.add(7))
      ), E = l.element(N.add(8)).xyz, I = l.element(N.add(9)).x.greaterThan(0);
      F(I.not(), () => {
        mt();
      });
      const O = /* @__PURE__ */ new Map([
        [Xe, () => y],
        [Ze, () => v],
        [ye, () => M],
        [xe, () => T],
        [be, () => C],
        [we, () => k],
        [Ke, () => z],
        [Qe, () => I]
      ]), W = Et(
        t.gaussianPositionLocalNode,
        O
      ).toVar("gaussianPositionLocalValue"), tt = z.mul(et(W, 1)).xyz, $ = new Map(O);
      $.set(se, () => tt);
      const lt = Zr(W.sub(E));
      $.set(ts, () => lt);
      let vt;
      if (t.gaussianPositionWorldNode === se)
        vt = R.mul(et(W, 1));
      else {
        const Bt = Et(
          t.gaussianPositionWorldNode,
          $
        ).toVar("gaussianPositionWorldValue");
        vt = s.view.mul(et(Bt, 1));
      }
      vt = vt.toVar("gaussianViewPosition");
      const St = Et(t.gaussianScaleNode, $).toVar(
        "gaussianScaleValue"
      ), dt = Et(
        t.gaussianRotationNode,
        $
      ).toVar("gaussianRotationValue"), it = d({
        view: vt,
        scale_input: St,
        rotation_input: dt,
        model_view: R,
        projection: s.projection,
        viewport: s.viewport
      }).toVar("gaussianProjection");
      F(it.element(0).w.lessThanEqual(0), () => {
        mt();
      });
      const X = it.element(0).xy, Nt = it.element(0).z, Lt = it.element(1).xyz, jt = it.element(1).w, Tt = it.element(2).xyz, ft = it.element(2).w, ht = new Map($);
      ht.set(es, () => Nt), ht.set(ss, () => X), ht.set(rs, () => kt(Tt.xz)), ht.set(
        is,
        () => kt(jt).mul(Math.PI)
      );
      const _t = Et(
        t.gaussianOpacityNode,
        ht
      ).clamp(0, 1), It = this.antialiasMode === "compensated" ? _t.mul(
        kt(bt(ft.div(jt), 0, 1))
      ) : _t;
      F(It.lessThan(V(1 / 255)), () => {
        mt();
      });
      const Mt = Jr(It.mul(255)), D = kt(
        Mt.mul(2).mul(bt(Tt.x, 1e-12, 1e4))
      ), At = kt(
        Mt.mul(2).mul(bt(Tt.z, 1e-12, 1e4))
      ), Wt = Ts(D), Rt = Ts(At);
      F(Wt.lessThanEqual(0).or(Rt.lessThanEqual(0)), () => {
        mt();
      });
      const re = xt(Wt, Rt), Pt = X.sub(re), q = X.add(re);
      if (F(
        q.x.lessThan(0).or(q.y.lessThan(0)).or(Pt.x.greaterThanEqual(s.viewport.x)).or(Pt.y.greaterThanEqual(s.viewport.y)),
        () => {
          mt();
        }
      ), this.subpixelSampleCulling) {
        const Bt = f({
          center: X,
          conic: Lt,
          power_threshold: Mt,
          extent: xt(D, At),
          viewport: te(s.viewport.xy)
        });
        F(Bt.not(), () => {
          l.element(y).assign(et(X, Nt, -1)), mt();
        });
      }
      const Z = Kt(_s(s.tilesX), _s(s.tilesY)).sub(1), nt = Kt(
        bt(Ue(Pt.div(V(U))), xt(0), xt(Z))
      ), J = Kt(
        bt(Ue(q.div(V(U))), xt(0), xt(Z))
      ), st = m({
        gid: y,
        sh_degree: x(e.shDegree),
        direction: lt,
        sh_coefficients: o
      }), Ct = new Map(ht);
      Ct.set(Je, () => st), Ct.set(cr, () => Pt), Ct.set(dr, () => q);
      const ie = Et(
        t.gaussianVisibilityNode,
        Ct
      );
      F(ie.not(), () => {
        mt();
      });
      const pt = g({
        center: X,
        conic: Lt,
        power_threshold: Mt,
        tile_min: nt,
        tile_max: J
      });
      F(pt.equal(0), () => {
        mt();
      });
      const Ot = Et(
        t.gaussianColorNode,
        Ct
      ).clamp(0, 1);
      l.element(y).assign(et(X, Nt, It)), h.element(y).assign(et(Lt, Wt)), u.element(y).assign(et(Ot, Rt)), p.element(y).assign(pt);
    })().compute(e.count, [S]).setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}
function Et(a, t) {
  return a.context({ overrideNodes: t });
}
const Ln = (
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
), In = S, Nr = 256, An = [2048, 4096, 8192];
function Rn(a) {
  const t = Math.max(0, a.length - 1);
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
  let s = 0, r = 0, i = 0, n = 0, o = 0, l = 0, h = 0, u = 0;
  for (let p = 0; p < t; p++) {
    const d = Math.max(0, a[p + 1] - a[p]);
    e[p] = d, s += d, r = Math.max(r, d), d > 256 && i++, d > 512 && n++, d > 1024 && o++, d > 2048 && l++;
    const m = Math.ceil(d / Nr);
    h += m, u = Math.max(u, m);
  }
  return e.sort(), {
    max: r,
    mean: s / t,
    median: Pn(e),
    p95: qs(e, 0.95),
    p99: qs(e, 0.99),
    tilesOver256: i,
    tilesOver512: n,
    tilesOver1024: o,
    tilesOver2048: l,
    totalBatches: h,
    maxBatches: u
  };
}
function Ws(a, t) {
  if (!Number.isInteger(t) || t <= 0)
    throw new RangeError("tile cap must be a positive integer");
  const e = Math.max(0, a.length - 1);
  let s = 0, r = 0, i = 0, n = 0, o = 0;
  for (let h = 0; h < e; h++) {
    const u = Math.max(0, a[h + 1] - a[h]), p = Math.min(u, t), d = u - p;
    s += p, r += d, d > 0 && i++;
    const m = Math.ceil(p / Nr);
    n += m, o = Math.max(o, m);
  }
  const l = s + r;
  return {
    cap: t,
    rasterizedIntersections: s,
    droppedIntersections: r,
    droppedFraction: l === 0 ? 0 : r / l,
    affectedTiles: i,
    totalBatches: n,
    maxBatches: o
  };
}
function Pn(a) {
  const t = Math.floor(a.length / 2);
  return a.length % 2 !== 0 ? a[t] : (a[t - 1] + a[t]) * 0.5;
}
function qs(a, t) {
  const e = Math.max(0, Math.ceil(a.length * t) - 1);
  return a[e];
}
class On {
  constructor(t, e, s, r, i, n) {
    this.renderer = t, this.maxRasterizedSplatsPerTile = n, this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      e
    );
    const o = B(Ln);
    this.computeNode = o({
      index: rt,
      gaussian_count: x(e),
      viewport: te(i.viewport.xy),
      projected_mean: w(
        s,
        "vec4",
        s.count
      ).toReadOnly(),
      projected_conic: w(
        r,
        "vec4",
        r.count
      ).toReadOnly(),
      zero_pixel_flags: w(this.zeroPixelFlags, "uint", e)
    }).compute(e, [In]).setName("3DGS profile subpixel coverage WGSL");
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
    for (const o of r) i += o;
    const n = new Uint32Array(e);
    return {
      tileLoads: Rn(n),
      appliedTileCap: this.maxRasterizedSplatsPerTile === null ? null : Ws(n, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: An.map(
        (o) => Ws(n, o)
      ),
      zeroPixelSubpixelSplats: i
    };
  }
  dispose() {
    this.computeNode.dispose(), this.attributes.dispose();
  }
}
function Bn(a) {
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
  partials: ptr<workgroup, array<u32, ${L * ot}>>
) -> u32 {
  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  let subgroup_count = (${S}u + subgroup_size - 1u) / subgroup_size;
  for (var digit = 0u; digit < ${L}u; digit++) {
    var local_count = 0u;
    for (var item = 0u; item < ${at}u; item++) {
      let position = block_start + item * ${S}u + lane;
      if (position < count) {
        let key = (*records)[position].x;
        local_count += select(0u, 1u, ((key >> ${a}u) & ${L - 1}u) == digit);
      }
    }
    let subgroup_total = subgroupAdd(local_count);
    if (subgroup_lane == 0u) {
      (*partials)[digit * ${ot}u + subgroup_index] = subgroup_total;
    }
  }
  workgroupBarrier();
  if (lane < ${L}u) {
    var total = 0u;
    for (var subgroup = 0u; subgroup < subgroup_count; subgroup++) {
      total += (*partials)[lane * ${ot}u + subgroup];
    }
    (*block_histograms)[lane * block_stride + block_index] = total;
  }
  return 0u;
}
`
  );
}
const Fn = (
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
  partials: ptr<workgroup, array<u32, ${ot}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let subgroup_count = (${S}u + subgroup_size - 1u) / subgroup_size;
  let chunk_start = chunk * ${Q}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${at}u; item++) {
    let block = chunk_start + item * ${S}u + lane;
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
), Un = (
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
), Dn = (
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
  for (var item = 0u; item < ${at}u; item++) {
    let local = item * ${S}u + lane;
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
    for (var item = 0u; item < ${at}u; item++) {
      let worker = item * ${S}u + lane;
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
    for (var item = 0u; item < ${at}u; item++) {
      let worker = item * ${S}u + lane;
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
  for (var item = 0u; item < ${at}u; item++) {
    let local = item * ${S}u + lane;
    let block = chunk_start + local;
    if (block < block_count) {
      (*block_prefixes)[digit * block_stride + block] = global_base + (*scratch)[local];
    }
  }
  return 0u;
}
`
);
function Vn(a) {
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
  block_bases: ptr<workgroup, array<u32, ${L}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${L}>>,
  partials: ptr<workgroup, array<u32, ${L * ot}>>
) -> u32 {
  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  let subgroup_count = (${S}u + subgroup_size - 1u) / subgroup_size;
  if (lane < ${L}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${at}u; item++) {
    let position = block_start + item * ${S}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = 0u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${a}u) & ${L - 1}u;
    }

    var subgroup_prefix = 0u;
    for (var target_digit = 0u; target_digit < ${L}u; target_digit++) {
      let matches = select(0u, 1u, valid && digit == target_digit);
      let prefix = subgroupExclusiveAdd(matches);
      let total = subgroupAdd(matches);
      if (subgroup_lane == 0u) {
        (*partials)[target_digit * ${ot}u + subgroup_index] = total;
      }
      if (digit == target_digit) { subgroup_prefix = prefix; }
    }
    workgroupBarrier();

    if (valid) {
      var preceding_subgroups = 0u;
      for (var subgroup = 0u; subgroup < subgroup_index; subgroup++) {
        preceding_subgroups += (*partials)[digit * ${ot}u + subgroup];
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
        batch_total += (*partials)[lane * ${ot}u + subgroup];
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
function Gn(a) {
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
  histogram: ptr<workgroup, array<atomic<u32>, ${L}>>
) -> u32 {
  if (lane < ${L}u) {
    atomicStore(&(*histogram)[lane], 0u);
  }
  workgroupBarrier();

  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  for (var item = 0u; item < ${at}u; item++) {
    let position = block_start + item * ${S}u + lane;
    if (position < count) {
      let key = (*records)[position].x;
      let digit = (key >> ${a}u) & ${L - 1}u;
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
const $n = (
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
  scratch: ptr<workgroup, array<u32, ${S}>>
) -> u32 {
  let chunk = group_id.x;
  let digit = group_id.y;
  let block_count = (*state)[0].z;
  let chunk_start = chunk * ${Q}u;
  var local_sum = 0u;
  for (var item = 0u; item < ${at}u; item++) {
    let block = chunk_start + item * ${S}u + lane;
    if (block < block_count) {
      local_sum += (*block_histograms)[digit * block_stride + block];
    }
  }
  (*scratch)[lane] = local_sum;
  workgroupBarrier();

  var active_count = ${S / 2}u;
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
function jn(a) {
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
  block_bases: ptr<workgroup, array<u32, ${L}>>,
  local_digit_counts: ptr<workgroup, array<u32, ${L}>>,
  shared_digits: ptr<workgroup, array<u32, ${S}>>,
  shared_digit_masks: ptr<workgroup, array<u32, ${L * (S / 32)}>>
) -> u32 {
  let block_start = block_index * ${ut}u;
  let count = (*state)[0].x;
  let words_per_digit = ${S / 32}u;
  if (lane < ${L}u) {
    (*block_bases)[lane] = (*block_prefixes)[lane * block_stride + block_index];
    (*local_digit_counts)[lane] = 0u;
  }
  workgroupBarrier();

  for (var item = 0u; item < ${at}u; item++) {
    let position = block_start + item * ${S}u + lane;
    let valid = position < count;
    var record = vec2<u32>(0u);
    var digit = ${L}u;
    if (valid) {
      record = (*records_in)[position];
      digit = (record.x >> ${a}u) & ${L - 1}u;
    }
    (*shared_digits)[lane] = digit;
    workgroupBarrier();

    if (lane < ${L * (S / 32)}u) {
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
class Hs {
  constructor(t, e, s, r, i, n) {
    this.renderer = t, this.label = e, this.capacity = s, this.buffers = r, this.dispatch = i, this.backend = n, this.maxRadixBlocks = Math.ceil(s / ut), this.maxReduceChunks = Math.ceil(this.maxRadixBlocks / Q), this.blockHistograms = this.attributes.createUint(
      `3dgs.${e}-radix-histograms`,
      this.maxRadixBlocks * L
    ), this.blockPrefixes = this.attributes.createUint(
      `3dgs.${e}-radix-prefixes`,
      this.maxRadixBlocks * L
    ), this.reduced = this.attributes.createUint(
      `3dgs.${e}-radix-reduced`,
      this.maxReduceChunks * L
    );
    const o = w(i.state, "uvec4", 1).toReadOnly(), l = w(
      this.blockHistograms,
      "uint",
      this.blockHistograms.count
    ).toReadOnly(), h = B(
      n === "subgroup" ? Fn : $n
    ), u = {
      lane: wt,
      group_id: K,
      block_stride: x(this.maxRadixBlocks),
      chunk_stride: x(this.maxReduceChunks),
      state: o,
      block_histograms: l,
      reduced: w(this.reduced, "uint", this.reduced.count)
    };
    n === "subgroup" ? (u.subgroup_index = _e, u.subgroup_lane = Me, u.subgroup_size = Ce, u.partials = j("uint", ot)) : u.scratch = j("uint", S), this.reduceNode = h(u).computeKernel([S]).setName(`3DGS ${e} radix reduce WGSL`);
    const p = B(Un);
    this.scanReducedNode = p({
      chunk_stride: x(this.maxReduceChunks),
      state: o,
      reduced: w(this.reduced, "uint", this.reduced.count)
    }).compute(1).setName(`3DGS ${e} radix global scan WGSL`);
    const d = B(
      Dn
    );
    this.scanAddNode = d({
      lane: wt,
      group_id: K,
      block_stride: x(this.maxRadixBlocks),
      chunk_stride: x(this.maxReduceChunks),
      state: o,
      block_histograms: l,
      reduced: w(this.reduced, "uint", this.reduced.count).toReadOnly(),
      block_prefixes: w(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ),
      scratch: j("uint", Q)
    }).computeKernel([S]).setName(`3DGS ${e} radix scan-add WGSL`), this.sortedRecords = r.recordsA;
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
    const e = Math.ceil(Math.max(0, t) / Ve);
    this.passes = Array.from(
      { length: e },
      (s, r) => this.createPass(r, r * Ve)
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
    const s = t % 2 === 0, r = s ? this.buffers.recordsA : this.buffers.recordsB, i = s ? this.buffers.recordsB : this.buffers.recordsA, n = w(this.dispatch.state, "uvec4", 1).toReadOnly(), o = w(
      r,
      "uvec2",
      this.capacity
    ).toReadOnly(), l = B(
      this.backend === "subgroup" ? Bn(e) : Gn(e)
    ), h = {
      lane: wt,
      block_index: K.x,
      block_stride: x(this.maxRadixBlocks),
      state: n,
      records: o,
      block_histograms: w(
        this.blockHistograms,
        "uint",
        this.blockHistograms.count
      )
    };
    this.backend === "subgroup" ? (h.subgroup_index = _e, h.subgroup_lane = Me, h.subgroup_size = Ce, h.partials = j(
      "uint",
      L * ot
    )) : h.histogram = j("atomic<u32>", L);
    const u = l(h).computeKernel([S]).setName(`3DGS ${this.label} radix histogram WGSL ${t}`), p = B(
      this.backend === "subgroup" ? Vn(e) : jn(e)
    ), d = {
      lane: wt,
      block_index: K.x,
      block_stride: x(this.maxRadixBlocks),
      state: n,
      records_in: o,
      records_out: w(i, "uvec2", this.capacity),
      block_prefixes: w(
        this.blockPrefixes,
        "uint",
        this.blockPrefixes.count
      ).toReadOnly(),
      block_bases: j("uint", L),
      local_digit_counts: j("uint", L)
    };
    this.backend === "subgroup" ? (d.subgroup_index = _e, d.subgroup_lane = Me, d.subgroup_size = Ce, d.partials = j(
      "uint",
      L * ot
    )) : (d.shared_digits = j("uint", S), d.shared_digit_masks = j(
      "uint",
      L * (S / 32)
    ));
    const m = p(d).computeKernel([S]).setName(`3DGS ${this.label} radix scatter WGSL ${t}`);
    return { histogram: u, scatter: m };
  }
  disposePasses() {
    for (const t of this.passes)
      t.histogram.dispose(), t.scatter.dispose();
    this.passes = [];
  }
}
const Wn = (
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
function qn(a) {
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
const Hn = (
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
  let second_local = lane + ${S}u;
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
), Yn = (
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
class Xn {
  attributes = new ct();
  levels = [];
  constructor(t, e) {
    const s = B(Hn), r = B(Yn);
    let i = t, n = e;
    for (; ; ) {
      const o = this.levels.length, l = Math.ceil(n / G), h = this.attributes.createUint(
        `3dgs.tile-offset-mins-${o}`,
        l
      ), u = s({
        lane: wt,
        group_id: K.x,
        length: x(n),
        values: w(i, "uint", n),
        block_mins: w(h, "uint", l),
        scratch: j("uint", G)
      }).computeKernel([S]).setName(`3DGS tile offset suffix scan WGSL ${o}`);
      if (this.levels.push({
        length: n,
        blockCount: l,
        values: i,
        scanNode: u
      }), l <= 1) break;
      i = h, n = l;
    }
    for (let o = 0; o < this.levels.length - 1; o++) {
      const l = this.levels[o], h = this.levels[o + 1];
      l.addNode = r({
        index: rt,
        length: x(l.length),
        block_count: x(h.length),
        values: w(l.values, "uint", l.length),
        block_suffix_mins: w(
          h.values,
          "uint",
          h.length
        ).toReadOnly()
      }).compute(l.length, [S]).setName(`3DGS tile add suffix block mins WGSL ${o}`);
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
class Zn {
  constructor(t, e, s, r, i) {
    this.renderer = t, this.dispatch = i, this.offsets = this.attributes.createUint(
      "3dgs.tile-offsets",
      s + 1
    );
    const n = w(this.offsets, "uint", s + 1), o = B(Wn);
    this.clearNode = o({
      index: rt,
      tile_count: x(s),
      state: w(i.state, "uvec4", 1).toReadOnly(),
      offsets: n
    }).compute(s + 1, [S]).setName("3DGS clear tile offsets WGSL");
    const l = B(
      qn(e)
    );
    this.boundariesNode = l({
      index: rt,
      tile_count: x(s),
      state: w(i.state, "uvec4", 1).toReadOnly(),
      records: w(
        r,
        "uvec2",
        r.count
      ).toReadOnly(),
      offsets: n
    }).computeKernel([S]).setName(`3DGS find tile boundaries WGSL (${e})`), this.suffixMin = new Xn(this.offsets, s + 1);
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
const Ys = (
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
), Jn = (
  /* wgsl */
  `
fn load_shared_active(
  values: ptr<workgroup, array<u32, ${S}>>
) -> u32 {
  return workgroupUniformLoad(&(*values)[0]);
}
`
);
class Kn {
  constructor(t, e, s, r, i, n, o, l, h, u, p, d, m, g, f, c, y, _ = !1, M = 1e-4, v = 0.95) {
    this.renderer = t, this.gaussianCount = e, this.intersectionCapacity = s, this.mode = r, this.meansAttribute = i, this.projectedMeanAttribute = n, this.projectedConicAttribute = o, this.projectedColorAttribute = l, this.sortedRecordsAttribute = h, this.tileOffsetsAttribute = u, this.colorTexture = p, this.depthTexture = d, this.frame = m, this.maxSplatsPerTile = g, this.rasterChunkSize = f, this.tileCount = c, this.transmittanceThreshold = M, this.depthAlphaThreshold = v, this.metrics = _ ? this.attributes.createUint("3dgs.raster-work", c * 4) : null;
    const b = this.metrics === null ? null : w(this.metrics, "uint", c * 4).toAtomic();
    this.clearMetrics = b === null ? null : he(() => {
      Kr(b.element(rt), x(0));
    })().compute(c * 4).setName("3DGS clear raster work metrics"), this.chunks = this.createChunkSchedule(), this.rebuild(y);
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
      yr(i, fs, "raster");
    zt(
      t.rasterPixelValueNode,
      fr,
      "rasterPixelValueNode"
    ), zt(
      t.rasterBreakNode,
      rn,
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
    const t = xr(
      this.intersectionCapacity,
      this.rasterChunkSize
    ), e = this.attributes.createUint(
      "3dgs.raster-chunk-counts",
      this.tileCount
    ), s = new Ge(
      e,
      this.tileCount,
      "raster-chunks"
    ), r = this.attributes.createUint(
      "3dgs.raster-chunk-tasks",
      t,
      2
    ), i = this.attributes.createIndirect(
      "3dgs.raster-chunk-dispatch"
    ), n = t * S, o = this.depthTexture === null ? 1 : 2, l = this.attributes.createFloat(
      "3dgs.raster-chunk-partials",
      n * o
    ), h = w(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = w(e, "uint", this.tileCount), p = w(
      e,
      "uint",
      this.tileCount
    ).toReadOnly(), d = w(
      s.output,
      "uint",
      this.tileCount
    ).toReadOnly(), g = B(ln)({
      tile: rt,
      tile_count: x(this.tileCount),
      chunk_size: x(this.rasterChunkSize),
      sample_limit: x(this.maxSplatsPerTile ?? 0),
      tile_offsets: h,
      chunk_counts: u
    }).compute(this.tileCount, [S]).setName("3DGS count exact raster chunks WGSL"), c = B(
      hn
    )({
      tile_count: x(this.tileCount),
      task_capacity: x(t),
      chunk_counts: p,
      chunk_offsets: d,
      dispatch: w(i, "uvec4", 1)
    }).compute(1).setName("3DGS prepare exact raster chunk dispatch WGSL"), _ = B(un)({
      tile: rt,
      tile_count: x(this.tileCount),
      task_capacity: x(t),
      chunk_counts: p,
      chunk_offsets: d,
      tasks: w(r, "uvec2", t)
    }).compute(this.tileCount, [S]).setName("3DGS emit exact raster chunk tasks WGSL");
    return {
      counts: e,
      offsets: s,
      tasks: r,
      dispatch: i,
      partialData: l,
      partialStride: o,
      countNode: g,
      prepareNode: c,
      emitNode: _
    };
  }
  createRasterNode(t, e) {
    const s = this.metrics === null ? null : w(this.metrics, "uint", this.tileCount * 4).toAtomic(), r = w(
      this.meansAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), i = w(
      this.projectedMeanAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), n = w(
      this.projectedConicAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), o = w(
      this.projectedColorAttribute,
      "vec4",
      this.gaussianCount
    ).toReadOnly(), l = w(
      this.sortedRecordsAttribute,
      "uvec2",
      this.intersectionCapacity
    ).toReadOnly(), h = w(
      this.tileOffsetsAttribute,
      "uint",
      this.tileOffsetsAttribute.count
    ).toReadOnly(), u = j("vec4", S), p = j("vec4", S), d = j("vec4", S), m = j("uint", S), g = j("uint", S), f = j("uint", 8), c = e === "direct" ? De(this.colorTexture) : null, y = B(Ys), _ = B(Jn), M = this.chunks, v = e === "chunk" && M !== null ? w(M.tasks, "uvec2", M.tasks.count).toReadOnly() : null, b = e === "chunk" && M !== null ? w(M.partialData, "vec4", M.partialData.count) : null, { frame: T } = this;
    return he(() => {
      const C = x(wt), N = y({ value: C }), z = y({ value: C.shiftRight(1) }), R = x(K.x), E = (e === "direct" ? K.y.mul(T.tilesX).add(K.x) : v.element(R).x).toVar("rasterTile"), I = e === "chunk" ? v.element(R).y : x(0), O = e === "direct" ? K.x : E.mod(T.tilesX), W = e === "direct" ? K.y : E.div(T.tilesX), tt = te(
        O.mul(x(U)).add(N),
        W.mul(x(U)).add(z)
      ).toVar("rasterPixelCoordinateValue"), $ = tt.x.lessThan(x(T.viewport.x)).and(tt.y.lessThan(x(T.viewport.y))).toVar("rasterActivePixel"), lt = h.element(E), vt = h.element(E.add(1)), St = x(vt.sub(lt)), dt = St.toVar("rasterTileSampleCount");
      if (this.maxSplatsPerTile !== null) {
        const D = x(this.maxSplatsPerTile);
        dt.assign(yt(St.lessThan(D), St, D));
      }
      let it = x(0);
      const X = dt.toVar("rasterSampleEnd");
      if (e === "direct" && this.rasterChunkSize !== null)
        X.assign(
          yt(
            dt.greaterThan(x(this.rasterChunkSize)),
            x(0),
            dt
          )
        );
      else if (e === "chunk") {
        it = I.mul(x(this.rasterChunkSize)).toVar("rasterSampleStart");
        const D = it.add(x(this.rasterChunkSize));
        X.assign(
          yt(D.lessThan(dt), D, dt)
        );
      }
      const Nt = xt(tt).add(0.5), Lt = /* @__PURE__ */ new Map([
        [as, () => tt],
        [os, () => Nt],
        [ls, () => Nt.div(T.viewport.xy)]
      ]), jt = V(0).toVar("rasterPixelValue");
      F($, () => {
        jt.assign(
          Xt(t.rasterPixelValueNode, Lt)
        );
      });
      const Tt = ce(0).toVar("accumulated"), ft = V(1).toVar("transmittance"), ht = V(0).toVar("weightedViewDepth"), _t = Ut(!1).toVar("done"), It = s === null ? null : x(0).toVar("rasterChecked"), Mt = s === null ? null : x(0).toVar("rasterBlended");
      Ht(
        {
          start: it,
          end: X,
          type: "uint",
          condition: "<",
          update: `+= ${S}`
        },
        ({ i: D }) => {
          const At = D.add(C);
          F(At.lessThan(X), () => {
            let q = At;
            this.maxSplatsPerTile !== null && (q = x(
              Ue(
                V(At).add(0.5).mul(V(St)).div(V(dt))
              )
            ));
            const Z = lt.add(q).toVar("rasterSourceRecordIndex"), nt = l.element(Z).y, J = i.element(nt), st = n.element(nt);
            u.element(C).assign(J), p.element(C).assign(et(st.xyz, J.w.mul(255).log())), d.element(C).assign(o.element(nt)), m.element(C).assign(nt);
          }), F(C.equal(0), () => {
            g.element(x(0)).assign(
              yt(
                D.add(x(S)).lessThan(X),
                x(1),
                x(0)
              )
            );
          });
          const Wt = _({ values: g }).toVar("hasNextBatch"), Rt = x(X.sub(D)), re = yt(
            Rt.lessThan(x(S)),
            Rt,
            x(S)
          );
          F($.and(_t.not()), () => {
            Ht(
              {
                start: x(0),
                end: re,
                type: "uint",
                condition: "<"
              },
              ({ i: q }) => {
                It?.addAssign(1);
                const Z = u.element(q), nt = m.element(q), J = Nt.sub(Z.xy), st = new Map(Lt);
                st.set(hs, () => jt), st.set(ve, () => nt), st.set(
                  ns,
                  () => x(r.element(nt).w)
                ), st.set(us, () => Z.xy), st.set(cs, () => J), st.set(ds, () => Z.z);
                const Ct = Xt(
                  t.rasterBreakNode,
                  st
                );
                F(Ct, () => {
                  _t.assign(Ut(!0)), Yt();
                });
                const ie = p.element(q), pt = ie.xyz, Ot = pt.x.mul(J.x.mul(J.x)).add(pt.y.mul(2).mul(J.x).mul(J.y)).add(pt.z.mul(J.y.mul(J.y))).mul(-0.5);
                F(
                  Ot.greaterThan(0).or(Ot.lessThan(ie.w.negate())),
                  () => {
                    Ee();
                  }
                );
                const Bt = kt(Ms(pt.x, 1e-12)), Se = pt.y.div(Bt), _r = kt(Ms(pt.z.sub(Se.mul(Se)), 1e-12)), ys = xt(
                  Bt.mul(J.x).add(Se.mul(J.y)),
                  _r.mul(J.y)
                ), Ne = new Map([
                  ...st,
                  [pr, () => ys],
                  [mr, () => ys.div(6).add(0.5)],
                  [
                    ps,
                    () => d.element(q).xyz
                  ],
                  [ms, () => Z.w],
                  [gs, () => Ot],
                  [gr, () => Qs(Ot)]
                ]), Mr = Xt(t.rasterDiscardNode, Ne);
                F(Mr, () => {
                  Ee();
                });
                const Te = bt(
                  Xt(t.rasterAlphaNode, Ne),
                  0,
                  0.99
                );
                F(Te.lessThan(V(1 / 255)), () => {
                  Ee();
                });
                const Cr = Xt(t.rasterColorNode, Ne), xs = ft.mul(Te).toVar("rasterContribution");
                Tt.addAssign(Cr.mul(xs)), ht.addAssign(Z.z.mul(xs)), Mt?.addAssign(1), ft.mulAssign(V(1).sub(Te)), F(ft.lessThan(this.transmittanceThreshold), () => {
                  _t.assign(Ut(!0)), Yt();
                });
              }
            );
          }), F(Wt.equal(0), () => {
            Yt();
          }), g.element(C).assign(yt($.and(_t.not()), x(1), x(0))), Cs(), F(C.lessThan(8), () => {
            const q = C.mul(32), Z = x(0).toVar("subgroupActive");
            Ht(
              { start: x(0), end: x(32), type: "uint", condition: "<" },
              ({ i: nt }) => {
                Z.bitOrAssign(
                  g.element(q.add(nt))
                );
              }
            ), f.element(C).assign(Z);
          }), Cs(), F(C.equal(0), () => {
            const q = x(0).toVar("tileActiveReduction");
            Ht(
              { start: x(0), end: x(8), type: "uint", condition: "<" },
              ({ i: Z }) => {
                q.bitOrAssign(f.element(x(Z)));
              }
            ), g.element(x(0)).assign(q);
          });
          const Pt = _({ values: g });
          F(Pt.equal(0), () => {
            Yt();
          });
        }
      ), F($, () => {
        if (s !== null) {
          const D = E.mul(4);
          Ft(s.element(D), It), Ft(s.element(D.add(1)), Mt), e === "direct" && F(St.greaterThan(0).and(X.greaterThan(0)), () => {
            Ft(s.element(D.add(2)), x(1)), Ft(
              s.element(D.add(3)),
              yt(
                ft.lessThan(this.transmittanceThreshold),
                x(1),
                x(0)
              )
            );
          });
        }
        if (e === "direct")
          Xs(
            Tt,
            ft,
            ht,
            tt,
            c,
            this.depthTexture,
            T,
            this.depthAlphaThreshold
          );
        else {
          const D = R.mul(x(S)).add(C).mul(x(M.partialStride));
          b.element(D).assign(et(Tt, ft)), this.depthTexture !== null && b.element(D.add(1)).assign(et(ht, 0, 0, 0));
        }
      });
    })().computeKernel([U, U]).setName(
      e === "direct" ? `3DGS direct tile rasterizer TSL (${this.mode})` : `3DGS exact chunk rasterizer TSL (${this.mode})`
    );
  }
  createCompositeNode() {
    const t = this.metrics === null ? null : w(this.metrics, "uint", this.tileCount * 4).toAtomic(), e = this.chunks, s = w(
      e.counts,
      "uint",
      this.tileCount
    ).toReadOnly(), r = w(
      e.offsets.output,
      "uint",
      this.tileCount
    ).toReadOnly(), i = w(
      e.partialData,
      "vec4",
      e.partialData.count
    ).toReadOnly(), n = De(this.colorTexture), o = B(Ys), { frame: l } = this;
    return he(() => {
      const u = x(wt), p = o({ value: u }), d = o({ value: u.shiftRight(1) }), m = K.y.mul(l.tilesX).add(K.x), g = s.element(m), f = te(
        K.x.mul(x(U)).add(p),
        K.y.mul(x(U)).add(d)
      ), c = f.x.lessThan(x(l.viewport.x)).and(f.y.lessThan(x(l.viewport.y)));
      F(c.and(g.greaterThan(0)), () => {
        const y = ce(0).toVar("chunkCompositeColor"), _ = V(1).toVar("chunkCompositeTransmittance"), M = V(0).toVar(
          "chunkCompositeWeightedViewDepth"
        ), v = r.element(m);
        Ht(
          {
            start: x(0),
            end: g,
            type: "uint",
            condition: "<"
          },
          ({ i: b }) => {
            const T = v.add(b).mul(x(S)).add(u).mul(x(e.partialStride)), k = i.element(T);
            y.addAssign(k.xyz.mul(_)), this.depthTexture !== null && M.addAssign(
              i.element(T.add(1)).x.mul(_)
            ), _.mulAssign(k.w), F(_.lessThan(this.transmittanceThreshold), () => {
              Yt();
            });
          }
        ), Xs(
          y,
          _,
          M,
          f,
          n,
          this.depthTexture,
          l,
          this.depthAlphaThreshold
        ), t !== null && (Ft(t.element(m.mul(4).add(2)), x(1)), Ft(
          t.element(m.mul(4).add(3)),
          yt(
            _.lessThan(this.transmittanceThreshold),
            x(1),
            x(0)
          )
        ));
      });
    })().computeKernel([U, U]).setName("3DGS exact raster chunk composite TSL");
  }
  async readWorkStats() {
    if (this.metrics === null) return null;
    const t = new Uint32Array(
      await this.renderer.getArrayBufferAsync(this.metrics)
    );
    let e = 0, s = 0, r = 0, i = 0;
    for (let n = 0; n < t.length; n += 4)
      e += t[n], s += t[n + 1], r += t[n + 2], i += t[n + 3];
    return { checked: e, blended: s, pixels: r, alphaStopped: i };
  }
}
function Qn(a, t) {
  const e = a.negate();
  return bt(
    t.viewport.z.add(e).mul(t.viewport.w).div(t.viewport.w.sub(t.viewport.z).mul(e)),
    0,
    1
  );
}
function Xs(a, t, e, s, r, i, n, o) {
  const l = bt(V(n.background[3]), 0, 1);
  a.addAssign(
    ce(n.background[0], n.background[1], n.background[2]).mul(t).mul(l)
  );
  const h = V(1).sub(t.mul(V(1).sub(l)));
  if (Es(r, Kt(s), et(a, h)), i !== null) {
    const u = V(1).sub(t), p = u.greaterThan(o).select(
      Qn(e.div(u), n),
      V(1)
    );
    Es(
      De(i),
      Kt(s),
      et(p, 0, 0, 1)
    );
  }
}
function Xt(a, t) {
  return a.context({ overrideNodes: t });
}
class ta {
  constructor(t, e, s, r, i, n) {
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
    const o = w(
      r,
      "uint",
      s
    ).toReadOnly(), l = B(
      dn
    );
    this.prepareNode = l({
      gaussian_count: x(s),
      projected_mean: w(
        i,
        "vec4",
        s
      ).toReadOnly(),
      visible_offsets: o,
      state: w(this.dispatch.state, "uvec4", 1),
      radix_block_dispatch: w(this.dispatch.radixBlock, "uvec4", 1),
      radix_reduce_dispatch: w(this.dispatch.radixReduce, "uvec4", 1),
      linear_dispatch: w(this.dispatch.linear, "uvec4", 1)
    }).compute(1).setName("3DGS prepare visible indirect dispatch WGSL");
    const h = B(
      pn(e)
    );
    this.compactNode = h({
      gid: rt,
      gaussian_count: x(s),
      viewport: n,
      visible_offsets: o,
      projected_mean: w(
        i,
        "vec4",
        s
      ).toReadOnly(),
      records: w(this.buffers.recordsA, "uvec2", s)
    }).compute(s, [S]).setName(`3DGS compact visible Gaussians WGSL (${e})`);
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
class ea {
  constructor(t, e, s, r, i, n, o, l, h, u, p, d, m, g, f = 1e-4, c = !1, y = 0.95) {
    this.renderer = t, this.data = s, this.mode = i, this.capacity = o, this.profileKernels = h, this.maxRasterizedSplatsPerTile = u, this.rasterChunkSize = p, this.subpixelSampleCulling = d, this.radixBackend = m, this.nodes = g, this.rasterTransmittanceThreshold = f, this.rasterStats = c, this.depthAlphaThreshold = y, this.frame = new bn(e, l), this.objects = new Nn(e, r, s.count), this.projection = new zn(
      s,
      this.frame,
      this.objects,
      n,
      g,
      d
    ), this.profileDiagnostics = h || c ? new On(
      t,
      s.count,
      this.projection.projectedMean,
      this.projection.projectedConic,
      this.frame,
      u
    ) : null, this.visibleScan = new Ge(
      this.projection.projectedMean,
      s.count,
      "visible",
      "projectedVisibility"
    ), this.visible = new ta(
      t,
      i,
      s.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport
    ), this.depthSorter = new Hs(
      t,
      "depth",
      s.count,
      this.visible.buffers,
      this.visible.dispatch,
      m
    ), this.depthSorter.configure(i === "float32" ? 32 : 16), this.orderedTiles = new gn(
      t,
      s.count,
      this.projection.tileCounts,
      this.depthSorter.sortedRecords,
      this.visible.dispatch
    ), this.scan = new Ge(
      this.orderedTiles.tileCounts,
      s.count,
      "intersections"
    ), this.intersections = new Sn(
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
    ), this.sorter = new Hs(
      t,
      "tile",
      o,
      this.intersections.buffers,
      this.intersections.dispatch,
      m
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
    const i = Math.ceil(t / U), n = Math.ceil(e / U), o = i * n;
    if (i > 65535 || n > 65535)
      throw new RangeError("Render size exceeds WebGPU's tile dispatch limit");
    this.tileOffsets?.dispose(), this.rasterizer?.dispose();
    const l = Math.max(
      1,
      Math.ceil(Math.log2(Math.max(2, o + 1)))
    );
    this.sorter.configure(l), this.tileOffsets = new Zn(
      this.renderer,
      this.mode,
      o,
      this.sorter.sortedRecords,
      this.intersections.dispatch
    ), this.rasterizer = new Kn(
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
      o,
      this.nodes,
      this.rasterStats,
      this.rasterTransmittanceThreshold,
      this.depthAlphaThreshold
    ), this.width = t, this.height = e, this.tilesX = i, this.tilesY = n, this.frame.update(t, e, i, n), this.tileStageRebuilds++;
  }
}
function sa(a, t) {
  if (a !== "auto" && a !== "subgroup" && a !== "workgroup")
    throw new RangeError(
      'radixBackend must be "auto", "subgroup", or "workgroup"'
    );
  if (a === "subgroup" && !t)
    throw new Error(
      'radixBackend "subgroup" requires the WebGPU "subgroups" feature'
    );
  return a === "auto" ? t ? "subgroup" : "workgroup" : a;
}
const Be = new qr();
class ra extends bs {
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
  nodeSlots = sn();
  dirtyStages = 0;
  frameDirty = !0;
  successfulRenderCount = 0;
  cachedFrameCount = 0;
  autoSnapshot = null;
  pipelineDevice = null;
  disposed = !1;
  unsubscribeStore = null;
  constructor(t, e, s, r = {}) {
    super(bs.COLOR, new je(), e, {
      type: ws,
      depthBuffer: !1,
      stencilBuffer: !1,
      samples: 0
    });
    const i = r.depthSortMode ?? "float32", n = r.antialiasMode ?? "compensated", o = r.redrawStrategy ?? "always", l = r.radixBackend ?? "auto";
    if (n !== "compensated" && n !== "classic")
      throw new RangeError(
        'antialiasMode must be either "compensated" or "classic"'
      );
    if (o !== "always" && o !== "auto" && o !== "never")
      throw new RangeError(
        'redrawStrategy must be "always", "auto", or "never"'
      );
    const h = sa(
      l,
      t.hasFeature("subgroups")
    ), u = r.intersectionCapacity ?? null;
    if (u !== null && (!Number.isInteger(u) || u <= 0))
      throw new RangeError("intersectionCapacity must be a positive integer");
    if (u !== null && u > S * 65535)
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit"
      );
    const p = r.maxRasterizedSplatsPerTile ?? null;
    if (p !== null && (!Number.isInteger(p) || p <= 0))
      throw new RangeError(
        "maxRasterizedSplatsPerTile must be a positive integer"
      );
    const d = r.rasterChunkSize === void 0 ? on : r.rasterChunkSize;
    if (cn(
      d,
      u ?? S * 65535
    ), this.name = "GaussianPass", this.ownerRenderer = t, this.gaussianStore = s, this.unsubscribeStore = s.subscribe(() => this.invalidate()), this.redrawStrategy = o, this.depthSortMode = i, this.antialiasMode = n, this.requestedIntersectionCapacity = u, this.background = r.background ?? [0, 0, 0, 0], this.outputDepth = r.outputDepth ?? !1, this.depthAlphaThreshold = r.depthAlphaThreshold ?? 0.95, !Number.isFinite(this.depthAlphaThreshold) || this.depthAlphaThreshold < 0 || this.depthAlphaThreshold > 1)
      throw new RangeError("depthAlphaThreshold must be finite and in [0, 1]");
    if (this.colorSpace = r.colorSpace ?? Vr, this.profileKernels = r.profileKernels ?? !1, this.rasterStats = r.rasterStats ?? !1, this.rasterTransmittanceThreshold = r.rasterTransmittanceThreshold ?? 1e-4, !Number.isFinite(this.rasterTransmittanceThreshold) || this.rasterTransmittanceThreshold <= 0 || this.rasterTransmittanceThreshold >= 1)
      throw new RangeError(
        "rasterTransmittanceThreshold must be finite and in (0, 1)"
      );
    this.maxRasterizedSplatsPerTile = p, this.rasterChunkSize = d, this.subpixelSampleCulling = r.subpixelSampleCulling ?? !0, this.radixBackend = h, this.renderTarget.texture.dispose(), this.colorTexture = new vs(1, 1), this.colorTexture.name = "GaussianPass.output", this.colorTexture.type = ws, this.colorTexture.colorSpace = Gr, this.colorTexture.generateMipmaps = !1, Object.assign(this.colorTexture, { mipmapsAutoUpdate: !1 }), this.colorTexture.isRenderTargetTexture = !0, this.colorTexture.renderTarget = this.renderTarget, this.renderTarget.texture = this.colorTexture, this.outputDepth ? (this.depthTexture = new vs(1, 1), this.depthTexture.name = "GaussianPass.depth", this.depthTexture.format = $r, this.depthTexture.type = jr, this.depthTexture.minFilter = Ss, this.depthTexture.magFilter = Ss, this.depthTexture.generateMipmaps = !1, Object.assign(this.depthTexture, { mipmapsAutoUpdate: !1 })) : this.depthTexture = null;
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
    return this.workingColorNode ??= Qr(
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
    if (!(this.camera instanceof Wr))
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera"
      );
    e.getDrawingBufferSize(Be);
    const s = Math.max(1, Math.floor(Be.x)), r = Math.max(1, Math.floor(Be.y)), i = this.getResolutionScale(), n = Math.max(1, Math.floor(s * i)), o = Math.max(
      1,
      Math.floor(r * i)
    );
    (this.renderTarget.width !== n || this.renderTarget.height !== o) && this.setSize(s, r);
    const l = Tr(e);
    if (this.gaussianStore.setFrontendCapabilities?.({
      maxStorageBufferBindingSize: l.limits.maxStorageBufferBindingSize,
      maxBufferSize: l.limits.maxBufferSize,
      maxStorageBuffersPerShaderStage: l.limits.maxStorageBuffersPerShaderStage,
      supportsPartialBufferUpdates: !0
    }), this.pipelineDevice !== null && this.pipelineDevice !== l && (this.pipeline?.dispose(), this.pipeline = null, this.pipelineLayoutVersion = -1, this.frameDirty = !0, this.autoSnapshot = null), this.redrawStrategy === "never" && !this.frameDirty && this.pipeline !== null) {
      this.cachedFrameCount++;
      return;
    }
    if (this.gaussianStore.needsPack && this.gaussianStore.pack({ limits: ia(e) }), !this.gaussianStore.hasPackedData) return;
    const h = this.gaussianStore.updateLod(this.camera);
    this.redrawStrategy === "auto" && this.autoInputsChanged(n, o) && (this.frameDirty = !0);
    const u = this.gaussianStore.getPackedData();
    if (this.requestedIntersectionCapacity === null && (this.resolvedIntersectionCapacity = Math.min(
      S * 65535,
      Math.max(1, u.count * 16)
    )), this.pipeline === null || this.pipelineLayoutVersion !== this.gaussianStore.layoutVersion) {
      if (this.pipeline?.dispose(), u.count > S * 65535)
        throw new RangeError(
          "Gaussian count exceeds the one-dimensional projection dispatch limit"
        );
      this.pipeline = new ea(
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
      ), this.pipelineDevice = l, this.pipelineLayoutVersion = this.gaussianStore.layoutVersion, this.dirtyStages = 0, this.frameDirty = !0;
    } else this.dirtyStages !== 0 && ((this.dirtyStages & 1) !== 0 && this.pipeline.rebuildProjection(this.nodeSlots), (this.dirtyStages & 2) !== 0 && this.pipeline.rebuildRasterizer(this.nodeSlots), this.dirtyStages = 0);
    if (this.redrawStrategy !== "always" && !this.frameDirty) {
      this.cachedFrameCount++;
      return;
    }
    if (e.initRenderTarget(this.renderTarget), this.pipeline.prepareFrame(
      n,
      o,
      this.colorTexture,
      this.depthTexture
    ), this.pipeline.render(), this.frameDirty = !1, this.successfulRenderCount++, this.redrawStrategy === "auto" && (this.autoSnapshot = this.captureAutoSnapshot(n, o)), this.debugListeners.size > 0) {
      const p = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod: h
      };
      for (const d of this.debugListeners) d(p);
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
    Js(e, t), this.nodeSlots[t] !== e && (this.nodeSlots[t] = e, this.invalidateProjection());
  }
  setRasterNode(t, e) {
    Js(e, t), this.nodeSlots[t] !== e && (this.nodeSlots[t] = e, this.invalidateRasterizer());
  }
  invalidateAutomatically() {
    this.redrawStrategy === "auto" && (this.frameDirty = !0);
  }
  autoInputsChanged(t, e) {
    const s = this.autoSnapshot;
    if (s === null) return !0;
    const r = this.camera;
    if (r.updateWorldMatrix(!0, !1), s.width !== t || s.height !== e || s.cameraNear !== r.near || s.cameraFar !== r.far || s.cameraLayers !== r.layers.mask || s.storeContentVersion !== this.gaussianStore.contentVersion || !Fe(
      s.projectionMatrix,
      r.projectionMatrix.elements
    ) || !Fe(
      s.cameraMatrixWorldInverse,
      r.matrixWorldInverse.elements
    ) || s.clouds.length !== this.gaussianStore.clouds.length)
      return !0;
    for (let i = 0; i < s.clouds.length; i++) {
      const n = s.clouds[i], o = this.gaussianStore.clouds[i];
      if (o.updateWorldMatrix(!0, !1), n.cloud !== o || n.visible !== Zs(o, r) || !Fe(n.matrixWorld, o.matrixWorld.elements))
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
        visible: Zs(r, s),
        matrixWorld: [...r.matrixWorld.elements]
      }))
    };
  }
}
function Fe(a, t) {
  for (let e = 0; e < 16; e++)
    if (a[e] !== t[e]) return !1;
  return !0;
}
function Zs(a, t) {
  if (!a.layers.test(t.layers)) return !1;
  let e = a, s = a;
  for (; e !== null; ) {
    if (!e.visible) return !1;
    s = e, e = e.parent;
  }
  return s instanceof je;
}
function Js(a, t) {
  if (a?.isNode !== !0)
    throw new TypeError(`GaussianPass.${t} must be a Three.js Node`);
}
function ia(a) {
  return Tr(a).limits;
}
function Tr(a) {
  const t = a.backend;
  if (t.device === void 0)
    throw new Error(
      "GaussianPass requires an initialized WebGPURenderer before the first render"
    );
  return t.device;
}
function ba(a, t, e, s) {
  return new ra(a, t, e, s);
}
export {
  zs as CanonicalGaussianPlyLoader,
  vi as DistanceAwareRadialLodPackingStrategy,
  ti as FLOAT32_SH_BYTES_PER_COEFFICIENT,
  de as GaussianCloud,
  pe as GaussianData,
  ua as GaussianDataBackend,
  Gt as GaussianLod,
  ya as GaussianLodColorHelper,
  Rs as GaussianLodNode,
  Vt as GaussianOctree,
  oi as GaussianOctreeNode,
  ra as GaussianPass,
  ue as GaussianRaycastIndex,
  xa as GaussianStore,
  qe as GaussianStoreAttributes,
  ci as GaussianStorePackedAttribute,
  pa as LocalGaussianBackend,
  fa as LodHelper,
  fi as MaximumLodPackingStrategy,
  ga as OctreeHelper,
  tr as RGB8E8_SH_BYTES_PER_COEFFICIENT,
  yi as RadialLodPackingStrategy,
  Mi as RadialLodWorkerPlanner,
  Ii as RemainingCapacityBudgetStrategy,
  da as SourceFractionBudgetStrategy,
  ma as StreamingGaussianBackend,
  hr as StreamingLodPackingStrategy,
  or as TieredRadialLodPackingStrategy,
  ca as WorkerGaussianBackend,
  Qi as WorkerStreamingGaussianBackend,
  Je as gaussianColor,
  Xe as gaussianIndex,
  Ze as gaussianObjectId,
  Ke as gaussianObjectMatrix,
  Qe as gaussianObjectVisible,
  we as gaussianOpacity,
  ba as gaussianPass,
  ye as gaussianPositionLocal,
  se as gaussianPositionWorld,
  is as gaussianProjectedArea,
  rs as gaussianProjectedSigma,
  be as gaussianRotation,
  xe as gaussianScale,
  dr as gaussianScreenBoundsMax,
  cr as gaussianScreenBoundsMin,
  ss as gaussianScreenPosition,
  es as gaussianViewDepth,
  ts as gaussianViewDirection,
  Os as isStreamingLodPackingStrategy,
  er as packShRgb8e8,
  us as rasterGaussianCenter,
  ps as rasterGaussianColor,
  pr as rasterGaussianCoord,
  ve as rasterGaussianIndex,
  ms as rasterGaussianOpacity,
  ns as rasterObjectId,
  as as rasterPixelCoordinate,
  cs as rasterPixelDelta,
  hs as rasterPixelValue,
  gs as rasterPower,
  os as rasterScreenPosition,
  ls as rasterScreenUV,
  mr as rasterUV,
  ds as rasterViewDepth,
  gr as rasterWeight,
  sr as shBytesPerCoefficient,
  la as unpackShRgb8e8
};
