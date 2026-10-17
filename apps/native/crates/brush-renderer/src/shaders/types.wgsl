struct SourceSplat {
    center_opacity: vec4f,
    scale: vec4f,
    rotation: vec4f,
    sh: array<f32, 48>,
}

struct View {
    viewmat: mat4x4f,
    camera: vec4f,
    size: vec2u,
    focal: vec2f,
    count: u32,
    tiles_x: u32,
    tiles_y: u32,
    pad: u32,
    background: vec4f,
}
struct WorldSplat {
    center_opacity: vec4f,
    axis0: vec4f,
    axis1: vec4f,
    axis2: vec4f,
    color: vec4f,
}
struct Pair { tile: u32, depth: u32, splat: u32, pad: u32 }
fn invocation_id(gid: vec3u) -> u32 { return gid.x + gid.y * 16776960u; }
