export const TILE_SIZE = 16;
export const WORKGROUP_SIZE = 256;
export const SCAN_BLOCK_ITEMS = 512;
export const RADIX_BITS = 4;
export const RADIX_SIZE = 1 << RADIX_BITS;
export const RADIX_BLOCK_ITEMS = 256;

const frameUniforms = /* wgsl */ `
struct FrameUniforms {
  model_view: mat4x4<f32>,
  projection: mat4x4<f32>,
  camera_local: vec4<f32>,
  viewport: vec4<f32>,
  config: vec4<u32>,
  background: vec4<f32>,
}
`;

const dispatchData = /* wgsl */ `
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

export const projectShader = /* wgsl */ `
${frameUniforms}

const SH_C0 = 0.28209479177387814;
const SH_C1 = 0.4886025119029199;
const SH_C2_0 = 1.0925484305920792;
const SH_C2_1 = -1.0925484305920792;
const SH_C2_2 = 0.31539156525252005;
const SH_C2_3 = -1.0925484305920792;
const SH_C2_4 = 0.5462742152960396;
const SH_C3_0 = -0.5900435899266435;
const SH_C3_1 = 2.890611442640554;
const SH_C3_2 = -0.4570457994644658;
const SH_C3_3 = 0.3731763325901154;
const SH_C3_4 = -0.4570457994644658;
const SH_C3_5 = 1.445305721320277;
const SH_C3_6 = -0.5900435899266435;

@group(0) @binding(0) var<storage, read> means: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> scales_opacity: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> rotations: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> sh_coefficients: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> projected_mean: array<vec4<f32>>;
@group(0) @binding(5) var<storage, read_write> projected_conic: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> projected_color: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read_write> tile_counts: array<u32>;
@group(0) @binding(8) var<uniform> frame: FrameUniforms;

fn quaternion_matrix(q_in: vec4<f32>) -> mat3x3<f32> {
  let q = normalize(q_in);
  let x = q.x;
  let y = q.y;
  let z = q.z;
  let w = q.w;
  let xx = x * x;
  let yy = y * y;
  let zz = z * z;
  let xy = x * y;
  let xz = x * z;
  let yz = y * z;
  let xw = x * w;
  let yw = y * w;
  let zw = z * w;

  return mat3x3<f32>(
    vec3<f32>(1.0 - 2.0 * (yy + zz), 2.0 * (xy + zw), 2.0 * (xz - yw)),
    vec3<f32>(2.0 * (xy - zw), 1.0 - 2.0 * (xx + zz), 2.0 * (yz + xw)),
    vec3<f32>(2.0 * (xz + yw), 2.0 * (yz - xw), 1.0 - 2.0 * (xx + yy))
  );
}

fn evaluate_sh(gid: u32, direction: vec3<f32>) -> vec3<f32> {
  let degree = frame.config.w;
  let coefficient_count = (degree + 1u) * (degree + 1u);
  let base = gid * coefficient_count;
  let x = direction.x;
  let y = direction.y;
  let z = direction.z;
  var color = SH_C0 * sh_coefficients[base].xyz;

  if (degree >= 1u) {
    color += (-SH_C1 * y) * sh_coefficients[base + 1u].xyz;
    color += ( SH_C1 * z) * sh_coefficients[base + 2u].xyz;
    color += (-SH_C1 * x) * sh_coefficients[base + 3u].xyz;
  }

  if (degree >= 2u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += (SH_C2_0 * x * y) * sh_coefficients[base + 4u].xyz;
    color += (SH_C2_1 * y * z) * sh_coefficients[base + 5u].xyz;
    color += (SH_C2_2 * (2.0 * zz - xx - yy)) * sh_coefficients[base + 6u].xyz;
    color += (SH_C2_3 * x * z) * sh_coefficients[base + 7u].xyz;
    color += (SH_C2_4 * (xx - yy)) * sh_coefficients[base + 8u].xyz;
  }

  if (degree >= 3u) {
    let xx = x * x;
    let yy = y * y;
    let zz = z * z;
    color += (SH_C3_0 * y * (3.0 * xx - yy)) * sh_coefficients[base + 9u].xyz;
    color += (SH_C3_1 * x * y * z) * sh_coefficients[base + 10u].xyz;
    color += (SH_C3_2 * y * (4.0 * zz - xx - yy)) * sh_coefficients[base + 11u].xyz;
    color += (SH_C3_3 * z * (2.0 * zz - 3.0 * xx - 3.0 * yy)) * sh_coefficients[base + 12u].xyz;
    color += (SH_C3_4 * x * (4.0 * zz - xx - yy)) * sh_coefficients[base + 13u].xyz;
    color += (SH_C3_5 * z * (xx - yy)) * sh_coefficients[base + 14u].xyz;
    color += (SH_C3_6 * x * (xx - 3.0 * yy)) * sh_coefficients[base + 15u].xyz;
  }

  return max(color + vec3<f32>(0.5), vec3<f32>(0.0));
}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gid = global_id.x;
  if (gid >= frame.config.z) {
    return;
  }

  tile_counts[gid] = 0u;
  let mean_local = means[gid].xyz;
  let view = frame.model_view * vec4<f32>(mean_local, 1.0);
  let depth = -view.z;
  let near_plane = frame.viewport.z;
  let far_plane = frame.viewport.w;
  if (!(depth > near_plane && depth < far_plane)) {
    return;
  }

  let clip = frame.projection * view;
  if (clip.w <= 0.0) {
    return;
  }
  let ndc = clip.xy / clip.w;
  let width = frame.viewport.x;
  let height = frame.viewport.y;
  let center = vec2<f32>((ndc.x * 0.5 + 0.5) * width, (0.5 - ndc.y * 0.5) * height);

  let scale_opacity = scales_opacity[gid];
  let scale = max(scale_opacity.xyz, vec3<f32>(1e-7));
  let rotation = quaternion_matrix(rotations[gid]);
  let covariance_local = rotation * mat3x3<f32>(
    vec3<f32>(scale.x * scale.x, 0.0, 0.0),
    vec3<f32>(0.0, scale.y * scale.y, 0.0),
    vec3<f32>(0.0, 0.0, scale.z * scale.z)
  ) * transpose(rotation);

  let local_to_view = mat3x3<f32>(
    frame.model_view[0].xyz,
    frame.model_view[1].xyz,
    frame.model_view[2].xyz
  );
  let covariance_view = local_to_view * covariance_local * transpose(local_to_view);
  let fx = 0.5 * width * frame.projection[0][0];
  let fy = 0.5 * height * frame.projection[1][1];
  let inverse_depth = 1.0 / depth;
  let j0 = vec3<f32>(fx * inverse_depth, 0.0, fx * view.x * inverse_depth * inverse_depth);
  let j1 = vec3<f32>(0.0, -fy * inverse_depth, -fy * view.y * inverse_depth * inverse_depth);
  let covariance_j0 = covariance_view * j0;
  let covariance_j1 = covariance_view * j1;
  let sigma00 = dot(j0, covariance_j0) + 0.3;
  let sigma01 = dot(j0, covariance_j1);
  let sigma11 = dot(j1, covariance_j1) + 0.3;
  let determinant = sigma00 * sigma11 - sigma01 * sigma01;
  if (!(determinant > 1e-8)) {
    return;
  }

  let discriminant = sqrt(max(0.0, (sigma00 - sigma11) * (sigma00 - sigma11) + 4.0 * sigma01 * sigma01));
  let major_variance = max(0.5 * (sigma00 + sigma11 + discriminant), 1e-8);
  let radius = ceil(3.0 * sqrt(major_variance));
  if (!(radius > 0.0)) {
    return;
  }

  let min_pixel = center - vec2<f32>(radius);
  let max_pixel = center + vec2<f32>(radius);
  if (max_pixel.x < 0.0 || max_pixel.y < 0.0 || min_pixel.x >= width || min_pixel.y >= height) {
    return;
  }

  let max_tile_x = i32(frame.config.x) - 1;
  let max_tile_y = i32(frame.config.y) - 1;
  let tile_min = vec2<i32>(
    clamp(i32(floor(min_pixel.x / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor(min_pixel.y / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor(max_pixel.x / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor(max_pixel.y / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  let tile_extent = tile_max - tile_min + vec2<i32>(1);
  let count = u32(tile_extent.x * tile_extent.y);
  if (count == 0u) {
    return;
  }

  let inverse_determinant = 1.0 / determinant;
  let direction = normalize(frame.camera_local.xyz - mean_local);
  projected_mean[gid] = vec4<f32>(center, depth, clamp(scale_opacity.w, 0.0, 1.0));
  projected_conic[gid] = vec4<f32>(sigma11 * inverse_determinant, -sigma01 * inverse_determinant, sigma00 * inverse_determinant, radius);
  projected_color[gid] = vec4<f32>(evaluate_sh(gid, direction), 1.0);
  tile_counts[gid] = count;
}
`;

export const scanBlocksShader = /* wgsl */ `
struct ScanParams {
  length: u32,
}

@group(0) @binding(0) var<storage, read> input_values: array<u32>;
@group(0) @binding(1) var<storage, read_write> output_values: array<u32>;
@group(0) @binding(2) var<storage, read_write> block_sums: array<u32>;
@group(0) @binding(3) var<uniform> params: ScanParams;
var<workgroup> scratch: array<u32, ${SCAN_BLOCK_ITEMS}>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let lane = local_id.x;
  let base = workgroup_id.x * ${SCAN_BLOCK_ITEMS}u;
  let first = base + lane;
  let second = first + ${WORKGROUP_SIZE}u;
  scratch[lane] = select(0u, input_values[first], first < params.length);
  scratch[lane + ${WORKGROUP_SIZE}u] = select(0u, input_values[second], second < params.length);
  workgroupBarrier();

  var offset = 1u;
  var active_count = ${SCAN_BLOCK_ITEMS / 2}u;
  loop {
    if (active_count == 0u) { break; }
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      scratch[right] += scratch[left];
    }
    offset *= 2u;
    active_count /= 2u;
    workgroupBarrier();
  }

  if (lane == 0u) {
    block_sums[workgroup_id.x] = scratch[${SCAN_BLOCK_ITEMS - 1}u];
    scratch[${SCAN_BLOCK_ITEMS - 1}u] = 0u;
  }
  workgroupBarrier();

  active_count = 1u;
  offset = ${SCAN_BLOCK_ITEMS / 2}u;
  loop {
    if (active_count >= ${SCAN_BLOCK_ITEMS}u) { break; }
    if (lane < active_count) {
      let left = offset * (2u * lane + 1u) - 1u;
      let right = offset * (2u * lane + 2u) - 1u;
      let value = scratch[left];
      scratch[left] = scratch[right];
      scratch[right] += value;
    }
    active_count *= 2u;
    offset /= 2u;
    workgroupBarrier();
  }

  if (first < params.length) { output_values[first] = scratch[lane]; }
  if (second < params.length) { output_values[second] = scratch[lane + ${WORKGROUP_SIZE}u]; }
}
`;

export const addScanOffsetsShader = /* wgsl */ `
struct ScanParams {
  length: u32,
}

@group(0) @binding(0) var<storage, read_write> values: array<u32>;
@group(0) @binding(1) var<storage, read> block_offsets: array<u32>;
@group(0) @binding(2) var<uniform> params: ScanParams;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= params.length) { return; }
  values[index] += block_offsets[index / ${SCAN_BLOCK_ITEMS}u];
}
`;

export const prepareDispatchShader = /* wgsl */ `
${dispatchData}

struct PrepareParams {
  gaussian_count: u32,
  intersection_capacity: u32,
}

@group(0) @binding(0) var<storage, read> tile_counts: array<u32>;
@group(0) @binding(1) var<storage, read> intersection_offsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> dispatch: DispatchData;
@group(0) @binding(3) var<uniform> params: PrepareParams;

@compute @workgroup_size(1)
fn main() {
  let last = params.gaussian_count - 1u;
  let total = intersection_offsets[last] + tile_counts[last];
  let count = min(total, params.intersection_capacity);
  let radix_blocks = (count + ${RADIX_BLOCK_ITEMS - 1}u) / ${RADIX_BLOCK_ITEMS}u;
  dispatch.radix = vec4<u32>((radix_blocks + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u, 1u, 1u, count);
  dispatch.linear = vec4<u32>((count + ${WORKGROUP_SIZE - 1}u) / ${WORKGROUP_SIZE}u, 1u, 1u, count);
  dispatch.state = DispatchState(count, total, radix_blocks, select(0u, 1u, total > params.intersection_capacity));
}
`;

export function emitIntersectionsShader(mode: "float32" | "packed16"): string {
  const outputs =
    mode === "float32"
      ? `
@group(0) @binding(4) var<storage, read_write> tile_ids: array<u32>;
@group(0) @binding(5) var<storage, read_write> depth_keys: array<u32>;
@group(0) @binding(6) var<storage, read_write> gaussian_ids: array<u32>;
@group(0) @binding(7) var<uniform> dispatch_state: DispatchState;
@group(0) @binding(8) var<uniform> frame: FrameUniforms;`
      : `
@group(0) @binding(4) var<storage, read_write> packed_keys: array<u32>;
@group(0) @binding(5) var<storage, read_write> gaussian_ids: array<u32>;
@group(0) @binding(6) var<uniform> dispatch_state: DispatchState;
@group(0) @binding(7) var<uniform> frame: FrameUniforms;`;

  const store =
    mode === "float32"
      ? `tile_ids[destination] = tile_id;
      depth_keys[destination] = bitcast<u32>(mean.z);`
      : `let normalized_depth = clamp((mean.z - frame.viewport.z) / (frame.viewport.w - frame.viewport.z), 0.0, 1.0);
      let depth16 = u32(round(normalized_depth * 65535.0));
      packed_keys[destination] = (tile_id << 16u) | depth16;`;

  return /* wgsl */ `
${frameUniforms}
${dispatchData}

@group(0) @binding(0) var<storage, read> projected_mean: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> projected_conic: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> tile_counts: array<u32>;
@group(0) @binding(3) var<storage, read> intersection_offsets: array<u32>;
${outputs}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gid = global_id.x;
  if (gid >= frame.config.z || tile_counts[gid] == 0u) { return; }
  let mean = projected_mean[gid];
  let radius = projected_conic[gid].w;
  let center = mean.xy;
  let max_tile_x = i32(frame.config.x) - 1;
  let max_tile_y = i32(frame.config.y) - 1;
  let tile_min = vec2<i32>(
    clamp(i32(floor((center.x - radius) / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y - radius) / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  let tile_max = vec2<i32>(
    clamp(i32(floor((center.x + radius) / ${TILE_SIZE}.0)), 0, max_tile_x),
    clamp(i32(floor((center.y + radius) / ${TILE_SIZE}.0)), 0, max_tile_y)
  );
  var local_index = 0u;
  for (var tile_y = tile_min.y; tile_y <= tile_max.y; tile_y++) {
    for (var tile_x = tile_min.x; tile_x <= tile_max.x; tile_x++) {
      let destination = intersection_offsets[gid] + local_index;
      local_index++;
      if (destination >= dispatch_state.count) { continue; }
      let tile_id = u32(tile_y) * frame.config.x + u32(tile_x);
      ${store}
      gaussian_ids[destination] = gid;
    }
  }
}
`;
}

export const scanBlockHistogramsShader = /* wgsl */ `
${dispatchData}
@group(0) @binding(0) var<storage, read> block_histograms: array<u32>;
@group(0) @binding(1) var<storage, read_write> block_prefixes: array<u32>;
@group(0) @binding(2) var<storage, read_write> digit_totals: array<u32>;
@group(0) @binding(3) var<uniform> dispatch_state: DispatchState;

@compute @workgroup_size(${RADIX_SIZE})
fn main(@builtin(local_invocation_id) local_id: vec3<u32>) {
  let digit = local_id.x;
  var running = 0u;
  for (var block_index = 0u; block_index < dispatch_state.radix_blocks; block_index++) {
    let address = block_index * ${RADIX_SIZE}u + digit;
    block_prefixes[address] = running;
    running += block_histograms[address];
  }
  digit_totals[digit] = running;
}
`;

export const scanDigitTotalsShader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> digit_totals: array<u32>;
@group(0) @binding(1) var<storage, read_write> digit_offsets: array<u32>;

@compute @workgroup_size(1)
fn main() {
  var running = 0u;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    digit_offsets[digit] = running;
    running += digit_totals[digit];
  }
}
`;

export function radixHistogramShader(mode: "float32" | "packed16"): string {
  const inputs =
    mode === "float32"
      ? `
@group(0) @binding(0) var<storage, read> tile_ids: array<u32>;
@group(0) @binding(1) var<storage, read> depth_keys: array<u32>;
@group(0) @binding(2) var<storage, read_write> block_histograms: array<u32>;
@group(0) @binding(3) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return select(depth_keys[index], tile_ids[index], KEY_KIND == 1u); }`
      : `
@group(0) @binding(0) var<storage, read> packed_keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> block_histograms: array<u32>;
@group(0) @binding(2) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return packed_keys[index]; }`;

  return /* wgsl */ `
override SHIFT: u32;
override KEY_KIND: u32 = 0u;
${dispatchData}
${inputs}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let block_index = global_id.x;
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  if (block_start >= dispatch_state.count) { return; }
  var histogram: array<u32, ${RADIX_SIZE}>;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) { histogram[digit] = 0u; }
  let block_end = min(block_start + ${RADIX_BLOCK_ITEMS}u, dispatch_state.count);
  for (var position = block_start; position < block_end; position++) {
    let digit = (selected_key(position) >> SHIFT) & ${RADIX_SIZE - 1}u;
    histogram[digit]++;
  }
  let output_start = block_index * ${RADIX_SIZE}u;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) {
    block_histograms[output_start + digit] = histogram[digit];
  }
}
`;
}

export function radixScatterShader(mode: "float32" | "packed16"): string {
  const bindings =
    mode === "float32"
      ? `
@group(0) @binding(0) var<storage, read> tile_ids_in: array<u32>;
@group(0) @binding(1) var<storage, read> depth_keys_in: array<u32>;
@group(0) @binding(2) var<storage, read> gaussian_ids_in: array<u32>;
@group(0) @binding(3) var<storage, read> block_prefixes: array<u32>;
@group(0) @binding(4) var<storage, read> digit_offsets: array<u32>;
@group(0) @binding(5) var<storage, read_write> tile_ids_out: array<u32>;
@group(0) @binding(6) var<storage, read_write> depth_keys_out: array<u32>;
@group(0) @binding(7) var<storage, read_write> gaussian_ids_out: array<u32>;
@group(0) @binding(8) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return select(depth_keys_in[index], tile_ids_in[index], KEY_KIND == 1u); }
fn move_record(source: u32, destination: u32) {
  tile_ids_out[destination] = tile_ids_in[source];
  depth_keys_out[destination] = depth_keys_in[source];
  gaussian_ids_out[destination] = gaussian_ids_in[source];
}`
      : `
@group(0) @binding(0) var<storage, read> packed_keys_in: array<u32>;
@group(0) @binding(1) var<storage, read> gaussian_ids_in: array<u32>;
@group(0) @binding(2) var<storage, read> block_prefixes: array<u32>;
@group(0) @binding(3) var<storage, read> digit_offsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> packed_keys_out: array<u32>;
@group(0) @binding(5) var<storage, read_write> gaussian_ids_out: array<u32>;
@group(0) @binding(6) var<uniform> dispatch_state: DispatchState;
fn selected_key(index: u32) -> u32 { return packed_keys_in[index]; }
fn move_record(source: u32, destination: u32) {
  packed_keys_out[destination] = packed_keys_in[source];
  gaussian_ids_out[destination] = gaussian_ids_in[source];
}`;

  return /* wgsl */ `
override SHIFT: u32;
override KEY_KIND: u32 = 0u;
${dispatchData}
${bindings}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let block_index = global_id.x;
  let block_start = block_index * ${RADIX_BLOCK_ITEMS}u;
  if (block_start >= dispatch_state.count) { return; }
  var local_counts: array<u32, ${RADIX_SIZE}>;
  for (var digit = 0u; digit < ${RADIX_SIZE}u; digit++) { local_counts[digit] = 0u; }
  let block_end = min(block_start + ${RADIX_BLOCK_ITEMS}u, dispatch_state.count);
  let prefix_start = block_index * ${RADIX_SIZE}u;
  for (var position = block_start; position < block_end; position++) {
    let digit = (selected_key(position) >> SHIFT) & ${RADIX_SIZE - 1}u;
    let destination = digit_offsets[digit] + block_prefixes[prefix_start + digit] + local_counts[digit];
    local_counts[digit]++;
    move_record(position, destination);
  }
}
`;
}

export function tileOffsetShaders(mode: "float32" | "packed16"): {
  clear: string;
  boundaries: string;
  fill: string;
} {
  const keyBinding =
    mode === "float32"
      ? "@group(0) @binding(0) var<storage, read> tile_ids: array<u32>;\nfn tile_at(index: u32) -> u32 { return tile_ids[index]; }"
      : "@group(0) @binding(0) var<storage, read> packed_keys: array<u32>;\nfn tile_at(index: u32) -> u32 { return packed_keys[index] >> 16u; }";

  return {
    clear: /* wgsl */ `
struct OffsetParams { count: u32, }
@group(0) @binding(0) var<storage, read_write> tile_offsets: array<u32>;
@group(0) @binding(1) var<uniform> params: OffsetParams;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if (global_id.x < params.count) { tile_offsets[global_id.x] = 0xffffffffu; }
}`,
    boundaries: /* wgsl */ `
${dispatchData}
${keyBinding}
@group(0) @binding(1) var<storage, read_write> tile_offsets: array<u32>;
@group(0) @binding(2) var<uniform> dispatch_state: DispatchState;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= dispatch_state.count) { return; }
  let tile = tile_at(index);
  if (index == 0u || tile_at(index - 1u) != tile) { tile_offsets[tile] = index; }
}`,
    fill: /* wgsl */ `
${dispatchData}
struct OffsetParams { count: u32, }
@group(0) @binding(0) var<storage, read_write> tile_offsets: array<u32>;
@group(0) @binding(1) var<uniform> dispatch_state: DispatchState;
@group(0) @binding(2) var<uniform> params: OffsetParams;
@compute @workgroup_size(1)
fn main() {
  var running = dispatch_state.count;
  tile_offsets[params.count - 1u] = running;
  var index = params.count - 1u;
  loop {
    if (index == 0u) { break; }
    index--;
    if (tile_offsets[index] == 0xffffffffu) {
      tile_offsets[index] = running;
    } else {
      running = tile_offsets[index];
    }
  }
}`,
  };
}

export const rasterizeShader = /* wgsl */ `
${frameUniforms}

@group(0) @binding(0) var<storage, read> projected_mean: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> projected_conic: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> projected_color: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> gaussian_ids: array<u32>;
@group(0) @binding(4) var<storage, read> tile_offsets: array<u32>;
@group(0) @binding(5) var output_texture: texture_storage_2d<rgba16float, write>;
@group(0) @binding(6) var<uniform> frame: FrameUniforms;

@compute @workgroup_size(${TILE_SIZE}, ${TILE_SIZE})
fn main(
  @builtin(workgroup_id) workgroup_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let pixel_u32 = workgroup_id.xy * ${TILE_SIZE}u + local_id.xy;
  if (pixel_u32.x >= u32(frame.viewport.x) || pixel_u32.y >= u32(frame.viewport.y)) { return; }
  let tile = workgroup_id.y * frame.config.x + workgroup_id.x;
  let begin = tile_offsets[tile];
  let end = tile_offsets[tile + 1u];
  let pixel = vec2<f32>(pixel_u32) + vec2<f32>(0.5);
  var accumulated = vec3<f32>(0.0);
  var transmittance = 1.0;

  for (var intersection = begin; intersection < end; intersection++) {
    let gaussian_id = gaussian_ids[intersection];
    let mean = projected_mean[gaussian_id];
    let delta = pixel - mean.xy;
    let conic = projected_conic[gaussian_id].xyz;
    let power = -0.5 * (conic.x * delta.x * delta.x + 2.0 * conic.y * delta.x * delta.y + conic.z * delta.y * delta.y);
    if (power > 0.0) { continue; }
    let alpha = min(0.99, mean.w * exp(power));
    if (alpha < (1.0 / 255.0)) { continue; }
    accumulated += transmittance * alpha * projected_color[gaussian_id].xyz;
    transmittance *= 1.0 - alpha;
    if (transmittance < 1e-4) { break; }
  }

  let background_alpha = clamp(frame.background.a, 0.0, 1.0);
  accumulated += transmittance * background_alpha * frame.background.rgb;
  let alpha = 1.0 - transmittance * (1.0 - background_alpha);
  textureStore(output_texture, vec2<i32>(pixel_u32), vec4<f32>(accumulated, alpha));
}
`;
