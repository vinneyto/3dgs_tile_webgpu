
struct RangeParams { count:u32,pad0:u32,pad1:u32,pad2:u32 }
@group(0) @binding(0) var<uniform> params:RangeParams;
@group(0) @binding(1) var<storage,read> pairs:array<Pair>;
@group(0) @binding(2) var<storage,read_write> offsets:array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid:vec3u) {
    let i=invocation_id(gid); if i>=params.count { return; }
    let tile=pairs[i].tile;
    if i==0u { offsets[tile*2u]=i; }
    else if pairs[i-1u].tile!=tile { offsets[tile*2u]=i; }
    if i+1u==params.count { offsets[tile*2u+1u]=i+1u; }
    else if pairs[i+1u].tile!=tile { offsets[tile*2u+1u]=i+1u; }
}
