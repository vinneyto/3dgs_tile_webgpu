// Scatter only missing records into stable resident addresses.
struct UploadRow { destination: vec4u, record: SourceSplat }
struct UploadParams { count:u32, pad0:u32, pad1:u32, pad2:u32 }
@group(0) @binding(0) var<uniform> params:UploadParams;
@group(0) @binding(1) var<storage,read> uploads:array<UploadRow>;
@group(0) @binding(2) var<storage,read_write> resident:array<SourceSplat>;
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid:vec3u) {
    let i=invocation_id(gid); if i>=params.count { return; }
    let row=uploads[i]; resident[row.destination.x]=row.record;
}
