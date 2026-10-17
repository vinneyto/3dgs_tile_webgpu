// SPDX-License-Identifier: Apache-2.0
// Adapted from Brush v0.3.0 (3edecbb2fe79d3e2c87eeab85b15e0b1dd10d486).
// Copyright Brush contributors. See third_party/brush/LICENSE and UPSTREAM.md.

@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> world: array<WorldSplat>;
@group(0) @binding(2) var<storage, read_write> projected: array<ProjectedSplat>;
@group(0) @binding(3) var<storage, read_write> counts: array<u32>;
@group(0) @binding(4) var<storage, read_write> depths: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
    let i = invocation_id(gid);
    if i >= view.count { return; }
    counts[i] = 0u;
    projected[i] = ProjectedSplat();
    let s = world[i];
    let mean_c = (view.viewmat * vec4f(s.center_opacity.xyz,1.0)).xyz;
    let opac = s.center_opacity.w;
    // Positive guards also reject NaNs.
    if !(mean_c.z >= 0.01 && mean_c.z < 1e10 && opac >= 1.0/255.0) { return; }
    let axes = mat3x3f(s.axis0.xyz, s.axis1.xyz, s.axis2.xyz);
    let cov3d = axes * transpose(axes);
    let cov2d = calc_cov2d(cov3d, mean_c, view.focal, view.size, vec2f(view.size)*0.5, view.viewmat);
    if !(determinant(cov2d) > 1e-24) { return; }
    let mean2d = view.focal * mean_c.xy / mean_c.z + vec2f(view.size)*0.5;
    let threshold = log(255.0 * opac);
    let extent = compute_bbox_extent(cov2d, threshold);
    if !(extent.x >= 0.0 && extent.y >= 0.0) { return; }
    if mean2d.x+extent.x <= 0.0 || mean2d.x-extent.x >= f32(view.size.x) || mean2d.y+extent.y <= 0.0 || mean2d.y-extent.y >= f32(view.size.y) { return; }
    let conic2 = inverse(cov2d);
    let conic = vec3f(conic2[0][0],conic2[0][1],conic2[1][1]);
    projected[i] = create_projected_splat(mean2d,conic,vec4f(s.color.xyz,opac));
    depths[i] = bitcast<u32>(mean_c.z);
    let bbox = get_tile_bbox(mean2d, extent, vec2u(view.tiles_x,view.tiles_y));
    var count = 0u;
    for(var y=bbox.y; y<bbox.w; y++) {
        for(var x=bbox.x; x<bbox.z; x++) {
            if will_primitive_contribute(tile_rect(vec2u(x,y)),mean2d,conic,threshold) { count++; }
        }
    }
    counts[i] = count;
}
