export const frameUniforms = /* wgsl */ `
struct FrameUniforms {
  model_view: mat4x4<f32>,
  projection: mat4x4<f32>,
  camera_local: vec4<f32>,
  viewport: vec4<f32>,
  config: vec4<u32>,
  background: vec4<f32>,
}
`;

export const dispatchData = /* wgsl */ `
struct DispatchState {
  count: u32,
  total: u32,
  radix_blocks: u32,
  overflow: u32,
}

struct DispatchData {
  state: DispatchState,
  padding: array<vec4<u32>, 15>,
  radix: vec4<u32>,
  linear: vec4<u32>,
}
`;
