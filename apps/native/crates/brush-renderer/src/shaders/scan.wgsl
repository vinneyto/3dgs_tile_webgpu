// Inclusive parallel scan; separate dispatches provide global barriers.
struct Scan { count: u32, step: u32, pad0: u32, pad1: u32 }
@group(0) @binding(0) var<uniform> params: Scan;
@group(0) @binding(1) var<storage, read> src: array<u32>;
@group(0) @binding(2) var<storage, read_write> dst: array<u32>;
@group(0) @binding(3) var<storage, read_write> overflow: atomic<u32>;
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
    let i=invocation_id(gid); if i>=params.count { return; }
    var value=src[i]; if i>=params.step { let other=src[i-params.step]; let sum=value+other; if sum<value { atomicStore(&overflow,1u); } value=sum; }
    dst[i]=value;
}
