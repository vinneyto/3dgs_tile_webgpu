// Lexicographic GPU bitonic sort, deterministic across overlapping clouds.
struct Sort { count:u32, j:u32, k:u32, actual:u32 }
@group(0) @binding(0) var<uniform> params: Sort;
@group(0) @binding(1) var<storage, read_write> pairs: array<Pair>;
fn less(a:Pair,b:Pair)->bool {
    return a.tile<b.tile || (a.tile==b.tile && (a.depth<b.depth || (a.depth==b.depth && a.splat<b.splat)));
}
@compute @workgroup_size(256)
fn init(@builtin(global_invocation_id) gid:vec3u) {
    let i=invocation_id(gid); if i>=params.count { return; }
    pairs[i]=Pair(0xffffffffu,0xffffffffu,0xffffffffu,0u);
}
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid:vec3u) {
    let i=invocation_id(gid); if i>=params.count { return; }
    let other=i^params.j;
    if other<=i { return; }
    let a=pairs[i]; let b=pairs[other];
    let ascending=(i&params.k)==0u;
    if select(less(a,b),less(b,a),ascending) { pairs[i]=b; pairs[other]=a; }
}
