// wgsl_reflect publishes ESM runtime code at this subpath, but declarations
// only at its root (whose CommonJS runtime is incompatible with type: module).
declare module "wgsl_reflect/wgsl_reflect.module.js" {
  export { WgslExec, WgslParser } from "wgsl_reflect";
}
