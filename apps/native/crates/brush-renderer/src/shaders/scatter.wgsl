// SPDX-License-Identifier: Apache-2.0
// Adapted from Brush v0.3.0 (3edecbb2fe79d3e2c87eeab85b15e0b1dd10d486).
// Copyright Brush contributors. See third_party/brush/LICENSE and UPSTREAM.md.

@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> projected: array<ProjectedSplat>;
@group(0) @binding(2) var<storage, read> prefix: array<u32>;
@group(0) @binding(3) var<storage, read> depths: array<u32>;
@group(0) @binding(4) var<storage, read_write> pairs: array<Pair>;
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
    let i=invocation_id(gid); if i>=view.count { return; }
    var base=0u; if i>0u { base=prefix[i-1u]; }
    if prefix[i]==base { return; }
    let p=projected[i];
    let mean=vec2f(p.xy_x,p.xy_y);
    let conic=vec3f(p.conic_x,p.conic_y,p.conic_z);
    let threshold=log(p.color_a*255.0);
    let cov=inverse(mat2x2f(conic.x,conic.y,conic.y,conic.z));
    let bbox=get_tile_bbox(mean,compute_bbox_extent(cov,threshold),vec2u(view.tiles_x,view.tiles_y));
    for(var y=bbox.y;y<bbox.w;y++) {
        for(var x=bbox.x;x<bbox.z;x++) {
            if will_primitive_contribute(tile_rect(vec2u(x,y)),mean,conic,threshold) {
                pairs[base]=Pair(x+y*view.tiles_x,depths[i],i,0u); base++;
            }
        }
    }
}
