// SPDX-License-Identifier: Apache-2.0
// Adapted from Brush v0.3.0 (3edecbb2fe79d3e2c87eeab85b15e0b1dd10d486).
// Copyright Brush contributors. See third_party/brush/LICENSE and UPSTREAM.md.

@group(0) @binding(0) var<uniform> view:View;
@group(0) @binding(1) var<storage,read> pairs:array<Pair>;
@group(0) @binding(2) var<storage,read> tile_offsets:array<u32>;
@group(0) @binding(3) var<storage,read> projected:array<ProjectedSplat>;
@group(0) @binding(4) var out_img:texture_storage_2d<rgba8unorm,write>;
var<workgroup> range_uniform: vec2u;

var<workgroup> local_batch: array<ProjectedSplat, TILE_SIZE>;


// kernel function for rasterizing each tile
// each thread treats a single pixel
// each thread group uses the same gaussian data in a tile
@compute
@workgroup_size(TILE_SIZE, 1, 1)
fn main(
    @builtin(global_invocation_id) global_id: vec3u,
    @builtin(local_invocation_index) local_idx: u32,
) {
    let pix_loc = map_1d_to_2d(invocation_id(global_id), vec2u(view.tiles_x,view.tiles_y).x);
    let pixel_coord = vec2f(pix_loc) + 0.5f;
    let tile_loc = vec2u(pix_loc.x / TILE_WIDTH, pix_loc.y / TILE_WIDTH);

    let tile_id = tile_loc.x + tile_loc.y * vec2u(view.tiles_x,view.tiles_y).x;
    if tile_id >= view.tiles_x * view.tiles_y { return; }
    let inside = pix_loc.x < view.size.x && pix_loc.y < view.size.y;

    // have all threads in tile process the same gaussians in batches
    // first collect gaussians between the bin counts.
    if local_idx == 0u { range_uniform = vec2u(
        tile_offsets[tile_id * 2],
        tile_offsets[tile_id * 2 + 1],
    ); }
    workgroupBarrier();

    // Stupid hack as Chrome isn't convinced the range variable is uniform, which it better be.
    let range = workgroupUniformLoad(&range_uniform);

    // current visibility left to render
    var T = 1.0;
    var pix_out = vec3f(0.0);
    var done = !inside;

    // each thread loads one gaussian at a time before rasterizing its
    // designated pixel
    for (var batch_start = range.x; batch_start < range.y; batch_start += TILE_SIZE) {
        // process gaussians in the current batch for this pixel
        let remaining = min(TILE_SIZE, range.y - batch_start);

        let load_isect_id = batch_start + local_idx;
        var compact_gid=0u;
        if local_idx<remaining { compact_gid=pairs[load_isect_id].splat; }

        workgroupBarrier();
        if local_idx < remaining {
            local_batch[local_idx] = projected[compact_gid];
        }
        workgroupBarrier();

        for (var t = 0u; !done && t < remaining; t++) {
            let proj = local_batch[t];

            let xy = vec2f(proj.xy_x, proj.xy_y);
            let conic = vec3f(proj.conic_x, proj.conic_y, proj.conic_z);
            let color = vec4f(proj.color_r, proj.color_g, proj.color_b, proj.color_a);

            let delta = xy - pixel_coord;
            let sigma = 0.5f * (conic.x * delta.x * delta.x + conic.z * delta.y * delta.y) + conic.y * delta.x * delta.y;
            let alpha = min(0.999f, color.a * exp(-sigma));

            if sigma >= 0.0f && alpha >= 1.0f / 255.0f {
                let next_T = T * (1.0 - alpha);

                if next_T <= 1e-4f {
                    done = true;
                    break;
                }


                let vis = alpha * T;
                pix_out += max(color.rgb, vec3f(0.0)) * vis;
                T = next_T;
            }
        }
    }

    if inside {
        // Compose with background. Nb that color is already pre-multiplied
        // by definition.
        let final_color = vec4f(pix_out + T * view.background.rgb, 1.0 - T);

            textureStore(out_img, vec2i(pix_loc), vec4f(final_color.rgb, 1.0));
    }
}
