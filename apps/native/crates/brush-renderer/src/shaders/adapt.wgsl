// SPDX-License-Identifier: Apache-2.0
// Adapted from Brush v0.3.0 (3edecbb2fe79d3e2c87eeab85b15e0b1dd10d486).
// Copyright Brush contributors. See third_party/brush/LICENSE and UPSTREAM.md.

struct SourceSplat {
    center_opacity: vec4f,
    scale: vec4f,
    rotation: vec4f,
    sh: array<f32, 48>,
}
struct Cloud {
    world_from_local: mat4x4f,
    local_from_world: mat4x4f,
    camera: vec4f,
    offset: u32,
    count: u32,
    opacity: f32,
    scale: f32,
}
@group(0) @binding(0) var<uniform> cloud: Cloud;
@group(0) @binding(1) var<storage, read> source: array<SourceSplat>;
@group(0) @binding(2) var<storage, read_write> world: array<WorldSplat>;
fn coeff(s: SourceSplat, i: u32) -> vec3f {
    return vec3f(s.sh[i*3], s.sh[i*3+1], s.sh[i*3+2]);
}
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
    let i = invocation_id(gid);
    if i >= cloud.count { return; }
    let s = source[i];
    // Spark stores decoded linear opacity. Tiny LOD merged opacity can exceed
    // one: inflate volume by its mass and render with unit peak opacity.
    let inflation = pow(max(1.0, s.center_opacity.w), 1.0 / 3.0);
    let q = s.rotation;
    let basis = quat_to_mat(vec4f(q.w, q.xyz)) * scale_to_mat(s.scale.xyz * cloud.scale * inflation);
    let linear = mat3x3f(cloud.world_from_local[0].xyz, cloud.world_from_local[1].xyz, cloud.world_from_local[2].xyz);
    let axes = linear * basis;
    let center = (cloud.world_from_local * vec4f(s.center_opacity.xyz, 1.0)).xyz;
    let camera_local = (cloud.local_from_world * vec4f(cloud.camera.xyz, 1.0)).xyz;
    let delta = s.center_opacity.xyz - camera_local;
    let dir = delta / max(length(delta), 1e-8);
    var sh = ShCoeffs();
    // Brush expects unbiased SH DC; Spark has already decoded it to RGB.
    sh.b0_c0 = (coeff(s, 0u) - vec3f(0.5)) / SH_C0;
    sh.b1_c0=coeff(s,1u); sh.b1_c1=coeff(s,2u); sh.b1_c2=coeff(s,3u);
    sh.b2_c0=coeff(s,4u); sh.b2_c1=coeff(s,5u); sh.b2_c2=coeff(s,6u); sh.b2_c3=coeff(s,7u); sh.b2_c4=coeff(s,8u);
    sh.b3_c0=coeff(s,9u); sh.b3_c1=coeff(s,10u); sh.b3_c2=coeff(s,11u); sh.b3_c3=coeff(s,12u); sh.b3_c4=coeff(s,13u); sh.b3_c5=coeff(s,14u); sh.b3_c6=coeff(s,15u);
    let color = max(sh_coeffs_to_color(3u, dir, sh) + vec3f(0.5), vec3f(0.0));
    world[cloud.offset + i] = WorldSplat(vec4f(center, clamp(min(s.center_opacity.w, 1.0) * cloud.opacity, 0.0, 1.0)), vec4f(axes[0],0.0), vec4f(axes[1],0.0), vec4f(axes[2],0.0), vec4f(color,1.0));
}
