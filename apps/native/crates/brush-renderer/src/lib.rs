//! Forward-only Brush WGSL renderer on a caller-owned wgpu device.
//! No Burn runtime, second device, or CPU image round trip.
mod residency;
mod resident_gpu;
pub use resident_gpu::DEFAULT_SOURCE_CACHE_BYTES;
use resident_gpu::ResidentGpu;

use anyhow::{Context, Result, ensure};
use bytemuck::{Pod, Zeroable};
use glam::{Mat4, Vec3};
use spark_lod::GaussianBuffer;
use std::{
    borrow::Cow,
    sync::{Arc, mpsc},
};
use wgpu::util::DeviceExt;

pub const OUTPUT_FORMAT: wgpu::TextureFormat = wgpu::TextureFormat::Rgba8Unorm;

#[derive(Clone)]
pub struct CloudBatch {
    pub id: u64,
    pub buffer: Arc<GaussianBuffer>,
    pub nodes: Arc<Vec<usize>>,
    pub world_from_local: Mat4,
    pub opacity: f32,
    pub scale: f32,
}

#[derive(Clone, Copy, PartialEq)]
pub struct Camera {
    /// Bevy convention: local -Z forward, +Y up.
    pub world_from_view: Mat4,
    pub fov_y: f32,
}
impl Camera {
    pub fn position(self) -> Vec3 {
        self.world_from_view.w_axis.truncate()
    }
    pub fn forward(self) -> Vec3 {
        -self.world_from_view.z_axis.truncate()
    }
    pub fn focal(self, height: u32) -> f32 {
        height as f32 * 0.5 / (self.fov_y * 0.5).tan()
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct RenderStats {
    pub splats: u32,
    pub intersections: u32,
    /// Missing source records including 16-byte scatter headers.
    pub uploaded_bytes: u64,
    pub index_uploaded_bytes: u64,
    pub resident_splats: u32,
    pub source_cache_bytes: u64,
    pub cache_hits: u32,
    pub cache_misses: u32,
    pub evicted_splats: u32,
    pub gpu_copied_bytes: u64,
    pub reused_frame: bool,
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct ViewUniform {
    viewmat: [[f32; 4]; 4],
    camera: [f32; 4],
    size: [u32; 2],
    focal: [f32; 2],
    count: u32,
    tiles_x: u32,
    tiles_y: u32,
    pad: u32,
    background: [f32; 4],
}
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct CloudUniform {
    world_from_local: [[f32; 4]; 4],
    local_from_world: [[f32; 4]; 4],
    camera: [f32; 4],
    offset: u32,
    count: u32,
    opacity: f32,
    scale: f32,
}

const MATH: &str = include_str!("shaders/brush_math.wgsl");
const SH: &str = include_str!("shaders/brush_sh.wgsl");
const TYPES: &str = include_str!("shaders/types.wgsl");
fn shader(body: &str, math: bool, sh: bool) -> String {
    format!(
        "{}\n{}\n{}\n{}",
        TYPES,
        if math { MATH } else { "" },
        if sh { SH } else { "" },
        body
    )
}
fn pipeline(
    device: &wgpu::Device,
    name: &str,
    body: &str,
    math: bool,
    sh: bool,
    entry: &str,
) -> wgpu::ComputePipeline {
    let module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
        label: Some(name),
        source: wgpu::ShaderSource::Wgsl(Cow::Owned(shader(body, math, sh))),
    });
    device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
        label: Some(name),
        layout: None,
        module: &module,
        entry_point: Some(entry),
        compilation_options: Default::default(),
        cache: None,
    })
}
fn uniform<T: Pod>(device: &wgpu::Device, value: &T) -> wgpu::Buffer {
    device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("gaussian parameters"),
        contents: bytemuck::bytes_of(value),
        usage: wgpu::BufferUsages::UNIFORM,
    })
}
fn storage(device: &wgpu::Device, name: &str, size: u64) -> wgpu::Buffer {
    device.create_buffer(&wgpu::BufferDescriptor {
        label: Some(name),
        size: size.max(4),
        usage: wgpu::BufferUsages::STORAGE
            | wgpu::BufferUsages::COPY_DST
            | wgpu::BufferUsages::COPY_SRC,
        mapped_at_creation: false,
    })
}
fn buffers(
    device: &wgpu::Device,
    pipeline: &wgpu::ComputePipeline,
    values: &[&wgpu::Buffer],
) -> wgpu::BindGroup {
    let entries: Vec<_> = values
        .iter()
        .enumerate()
        .map(|(i, b)| wgpu::BindGroupEntry {
            binding: i as u32,
            resource: b.as_entire_binding(),
        })
        .collect();
    device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: Some("gaussian bindings"),
        layout: &pipeline.get_bind_group_layout(0),
        entries: &entries,
    })
}
fn dispatch(
    encoder: &mut wgpu::CommandEncoder,
    pipeline: &wgpu::ComputePipeline,
    group: &wgpu::BindGroup,
    elements: u32,
) {
    let groups = elements.div_ceil(256).max(1);
    let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
        label: Some("gaussian compute"),
        timestamp_writes: None,
    });
    pass.set_pipeline(pipeline);
    pass.set_bind_group(0, group, &[]);
    pass.dispatch_workgroups(groups.min(65535), groups.div_ceil(65535), 1);
}

struct Scratch {
    capacity: usize,
    world: wgpu::Buffer,
    projected: wgpu::Buffer,
    scan_a: wgpu::Buffer,
    scan_b: wgpu::Buffer,
    depths: wgpu::Buffer,
    overflow: wgpu::Buffer,
}
impl Scratch {
    fn new(device: &wgpu::Device, capacity: usize) -> Self {
        Self {
            capacity,
            world: storage(device, "world splats", capacity as u64 * 80),
            projected: storage(device, "projected Brush splats", capacity as u64 * 36),
            scan_a: storage(device, "intersection scan A", capacity as u64 * 4),
            scan_b: storage(device, "intersection scan B", capacity as u64 * 4),
            depths: storage(device, "positive depths", capacity as u64 * 4),
            overflow: storage(device, "prefix overflow flag", 4),
        }
    }
}
struct Target {
    width: u32,
    height: u32,
    texture: wgpu::Texture,
    view: wgpu::TextureView,
    offsets: wgpu::Buffer,
}

#[derive(Clone, Copy, PartialEq)]
struct FrameConfig {
    width: u32,
    height: u32,
    camera: Camera,
    background: [f32; 4],
    max_intersections: u32,
    source_cache_bytes: u64,
}
struct CompletedFrame {
    config: FrameConfig,
    batches: Vec<CloudBatch>,
    stats: RenderStats,
}
impl CompletedFrame {
    fn matches(&self, config: FrameConfig, batches: &[CloudBatch]) -> bool {
        self.config == config
            && self.batches.len() == batches.len()
            && self.batches.iter().zip(batches).all(|(a, b)| {
                a.id == b.id
                    && Arc::ptr_eq(&a.buffer, &b.buffer)
                    && a.world_from_local == b.world_from_local
                    && a.opacity == b.opacity
                    && a.scale == b.scale
                    && (Arc::ptr_eq(&a.nodes, &b.nodes) || *a.nodes == *b.nodes)
            })
    }
}

pub struct Renderer {
    adapt: wgpu::ComputePipeline,
    project: wgpu::ComputePipeline,
    scan: wgpu::ComputePipeline,
    scatter: wgpu::ComputePipeline,
    init: wgpu::ComputePipeline,
    sort: wgpu::ComputePipeline,
    ranges: wgpu::ComputePipeline,
    raster: wgpu::ComputePipeline,
    scratch: Option<Scratch>,
    resident: ResidentGpu,
    completed: Option<CompletedFrame>,
    target: Option<Target>,
    pairs: Option<wgpu::Buffer>,
    pair_capacity: u32,
    count_readback: wgpu::Buffer,
    /// Fail explicitly before scatter if exact intersections exceed this bound.
    pub max_intersections: u32,
    pub background: [f32; 4],
    /// Global resident source allocations; excludes render scratch and upload staging.
    pub source_cache_bytes: u64,
}
impl Renderer {
    pub fn new(device: &wgpu::Device) -> Self {
        Self {
            adapt: pipeline(
                device,
                "Spark to Brush world adapter",
                include_str!("shaders/adapt.wgsl"),
                true,
                true,
                "main",
            ),
            project: pipeline(
                device,
                "Brush project/count",
                include_str!("shaders/project.wgsl"),
                true,
                false,
                "main",
            ),
            scan: pipeline(
                device,
                "intersection prefix scan",
                include_str!("shaders/scan.wgsl"),
                false,
                false,
                "main",
            ),
            scatter: pipeline(
                device,
                "Brush map intersections",
                include_str!("shaders/scatter.wgsl"),
                true,
                false,
                "main",
            ),
            init: pipeline(
                device,
                "pair sentinels",
                include_str!("shaders/sort.wgsl"),
                false,
                false,
                "init",
            ),
            sort: pipeline(
                device,
                "tile/depth bitonic sort",
                include_str!("shaders/sort.wgsl"),
                false,
                false,
                "main",
            ),
            ranges: pipeline(
                device,
                "tile offsets",
                include_str!("shaders/ranges.wgsl"),
                false,
                false,
                "main",
            ),
            raster: pipeline(
                device,
                "Brush tile rasterize",
                include_str!("shaders/rasterize.wgsl"),
                true,
                false,
                "main",
            ),
            scratch: None,
            resident: ResidentGpu::new(device),
            completed: None,
            target: None,
            pairs: None,
            pair_capacity: 0,
            count_readback: device.create_buffer(&wgpu::BufferDescriptor {
                label: Some("exact intersection count"),
                size: 8,
                usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
                mapped_at_creation: false,
            }),
            max_intersections: 8 * 1024 * 1024,
            background: [0.025, 0.03, 0.04, 1.],
            source_cache_bytes: DEFAULT_SOURCE_CACHE_BYTES,
        }
    }

    /// Render into an owned GPU texture. Counts/overflow are read back (8 bytes), as in
    /// Brush; all Gaussian records, sorting and pixels stay on this device.
    pub fn render(
        &mut self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        width: u32,
        height: u32,
        camera: Camera,
        batches: &[CloudBatch],
    ) -> Result<RenderStats> {
        let config = FrameConfig {
            width,
            height,
            camera,
            background: self.background,
            max_intersections: self.max_intersections,
            source_cache_bytes: self.source_cache_bytes,
        };
        if let Some(frame) = self
            .completed
            .as_ref()
            .filter(|f| f.matches(config, batches))
        {
            return Ok(RenderStats {
                uploaded_bytes: 0,
                index_uploaded_bytes: 0,
                cache_hits: 0,
                cache_misses: 0,
                evicted_splats: 0,
                gpu_copied_bytes: 0,
                reused_frame: true,
                ..frame.stats
            });
        }
        // A failed frame must not leave an obsolete completion key valid.
        self.completed = None;
        ensure!(
            width > 0
                && height > 0
                && width <= device.limits().max_texture_dimension_2d
                && height <= device.limits().max_texture_dimension_2d,
            "Invalid render dimensions"
        );
        ensure!(
            camera.fov_y.is_finite()
                && camera.fov_y > 0.
                && camera.fov_y < std::f32::consts::PI
                && camera.world_from_view.is_finite()
                && camera.world_from_view.determinant().abs() > 1e-12,
            "Invalid camera"
        );
        let count_usize: usize = batches.iter().map(|b| b.nodes.len()).sum();
        ensure!(
            count_usize <= u32::MAX as usize,
            "Too many selected Gaussians"
        );
        let count = count_usize as u32;
        let limit = device.limits().max_storage_buffer_binding_size as u64;
        ensure!(
            (count.max(1) as u64) * 80 <= limit,
            "World buffer exceeds GPU binding limit; lower the LOD budget"
        );
        if self
            .scratch
            .as_ref()
            .is_none_or(|s| s.capacity < count_usize.max(1))
        {
            let capacity = count_usize
                .max(1)
                .next_power_of_two()
                .min((limit / 80) as usize);
            self.scratch = Some(Scratch::new(device, capacity));
        }
        let tiles_x = width.div_ceil(16);
        let tiles_y = height.div_ceil(16);
        if self
            .target
            .as_ref()
            .is_none_or(|t| t.width != width || t.height != height)
        {
            let texture = device.create_texture(&wgpu::TextureDescriptor {
                label: Some("Gaussian output"),
                size: wgpu::Extent3d {
                    width,
                    height,
                    depth_or_array_layers: 1,
                },
                mip_level_count: 1,
                sample_count: 1,
                dimension: wgpu::TextureDimension::D2,
                format: OUTPUT_FORMAT,
                usage: wgpu::TextureUsages::STORAGE_BINDING
                    | wgpu::TextureUsages::COPY_SRC
                    | wgpu::TextureUsages::TEXTURE_BINDING,
                view_formats: &[],
            });
            let view = texture.create_view(&Default::default());
            let offsets = storage(device, "tile ranges", tiles_x as u64 * tiles_y as u64 * 8);
            self.target = Some(Target {
                width,
                height,
                texture,
                view,
                offsets,
            });
        }
        let mut stats = RenderStats {
            splats: count,
            ..Default::default()
        };
        let mut ids = std::collections::HashSet::new();
        ensure!(
            batches.iter().all(|b| ids.insert(b.id)),
            "Cloud batch IDs must be unique"
        );
        for batch in batches {
            ensure!(
                batch.world_from_local.is_finite()
                    && batch.world_from_local.determinant().abs() > 1e-12,
                "Cloud transform must be finite and invertible"
            );
            ensure!(
                batch.opacity.is_finite()
                    && batch.opacity >= 0.
                    && batch.scale.is_finite()
                    && batch.scale > 0.,
                "Invalid cloud parameters"
            );
        }
        self.resident
            .prepare(device, queue, batches, self.source_cache_bytes, &mut stats)?;
        let scratch = self.scratch.as_ref().unwrap();
        let target = self.target.as_ref().unwrap();
        let view = ViewUniform {
            // Brush camera has +Z forward and +Y down.
            viewmat: (Mat4::from_scale(Vec3::new(1., -1., -1.)) * camera.world_from_view.inverse())
                .to_cols_array_2d(),
            camera: camera.position().extend(0.).to_array(),
            size: [width, height],
            focal: [camera.focal(height); 2],
            count,
            tiles_x,
            tiles_y,
            pad: 0,
            background: self.background,
        };
        let view_buffer = uniform(device, &view);
        let mut encoder = device.create_command_encoder(&Default::default());
        let mut offset = 0;
        for batch in batches {
            if batch.nodes.is_empty() {
                continue;
            }
            let (source_buffer, active_indices) = self.resident.buffers(batch);
            let params = uniform(
                device,
                &CloudUniform {
                    world_from_local: batch.world_from_local.to_cols_array_2d(),
                    local_from_world: batch.world_from_local.inverse().to_cols_array_2d(),
                    camera: camera.position().extend(0.).to_array(),
                    offset,
                    count: batch.nodes.len() as u32,
                    opacity: batch.opacity,
                    scale: batch.scale,
                },
            );
            let group = buffers(
                device,
                &self.adapt,
                &[&params, source_buffer, &scratch.world, active_indices],
            );
            dispatch(&mut encoder, &self.adapt, &group, batch.nodes.len() as u32);
            offset += batch.nodes.len() as u32;
        }
        let mut prefix = &scratch.scan_a;
        if count > 0 {
            encoder.clear_buffer(&scratch.overflow, 0, None);
            let group = buffers(
                device,
                &self.project,
                &[
                    &view_buffer,
                    &scratch.world,
                    &scratch.projected,
                    &scratch.scan_a,
                    &scratch.depths,
                ],
            );
            dispatch(&mut encoder, &self.project, &group, count);
            let mut step = 1;
            while step < count {
                let dest = if std::ptr::eq(prefix, &scratch.scan_a) {
                    &scratch.scan_b
                } else {
                    &scratch.scan_a
                };
                let params = uniform(device, &[count, step, 0, 0]);
                let group = buffers(
                    device,
                    &self.scan,
                    &[&params, prefix, dest, &scratch.overflow],
                );
                dispatch(&mut encoder, &self.scan, &group, count);
                prefix = dest;
                step *= 2;
            }
            encoder.copy_buffer_to_buffer(
                prefix,
                (count as u64 - 1) * 4,
                &self.count_readback,
                0,
                4,
            );
            encoder.copy_buffer_to_buffer(&scratch.overflow, 0, &self.count_readback, 4, 4);
            queue.submit([encoder.finish()]);
            let (send, recv) = mpsc::channel();
            self.count_readback
                .slice(..)
                .map_async(wgpu::MapMode::Read, move |r| {
                    let _ = send.send(r);
                });
            device
                .poll(wgpu::PollType::Wait)
                .context("Waiting for projection")?;
            recv.recv()??;
            let overflow;
            {
                let mapped = self.count_readback.slice(..).get_mapped_range();
                stats.intersections = u32::from_le_bytes(mapped[..4].try_into().unwrap());
                overflow = u32::from_le_bytes(mapped[4..8].try_into().unwrap());
            }
            self.count_readback.unmap();
            ensure!(
                overflow == 0,
                "Tile intersection prefix overflow; lower the LOD budget"
            );
        } else {
            queue.submit([encoder.finish()]);
        }
        ensure!(
            stats.intersections <= self.max_intersections,
            "{} tile intersections exceed configured limit {}; lower LOD budget",
            stats.intersections,
            self.max_intersections
        );
        let needed = stats
            .intersections
            .max(1)
            .checked_next_power_of_two()
            .context("Intersection allocation overflow")?;
        ensure!(
            needed as u64 * 16 <= limit,
            "Intersection buffer exceeds GPU binding limit; lower LOD budget"
        );
        if self.pair_capacity < needed {
            self.pairs = Some(storage(
                device,
                "sorted tile/depth/splat pairs",
                needed as u64 * 16,
            ));
            self.pair_capacity = needed;
        }
        let pairs = self.pairs.as_ref().unwrap();
        let mut encoder = device.create_command_encoder(&Default::default());
        encoder.clear_buffer(&target.offsets, 0, None);
        let init_params = uniform(device, &[needed, 0, 0, stats.intersections]);
        let init_group = buffers(device, &self.init, &[&init_params, pairs]);
        dispatch(&mut encoder, &self.init, &init_group, needed);
        if stats.intersections > 0 {
            let group = buffers(
                device,
                &self.scatter,
                &[
                    &view_buffer,
                    &scratch.projected,
                    prefix,
                    &scratch.depths,
                    pairs,
                ],
            );
            dispatch(&mut encoder, &self.scatter, &group, count);
            let mut k = 2;
            while k <= needed {
                let mut j = k / 2;
                while j > 0 {
                    let params = uniform(device, &[needed, j, k, stats.intersections]);
                    let group = buffers(device, &self.sort, &[&params, pairs]);
                    dispatch(&mut encoder, &self.sort, &group, needed);
                    j /= 2;
                }
                k *= 2;
            }
            let params = uniform(device, &[stats.intersections, 0, 0, 0]);
            let group = buffers(device, &self.ranges, &[&params, pairs, &target.offsets]);
            dispatch(&mut encoder, &self.ranges, &group, stats.intersections);
        }
        let entries = [
            wgpu::BindGroupEntry {
                binding: 0,
                resource: view_buffer.as_entire_binding(),
            },
            wgpu::BindGroupEntry {
                binding: 1,
                resource: pairs.as_entire_binding(),
            },
            wgpu::BindGroupEntry {
                binding: 2,
                resource: target.offsets.as_entire_binding(),
            },
            wgpu::BindGroupEntry {
                binding: 3,
                resource: scratch.projected.as_entire_binding(),
            },
            wgpu::BindGroupEntry {
                binding: 4,
                resource: wgpu::BindingResource::TextureView(&target.view),
            },
        ];
        let group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("Brush raster output"),
            layout: &self.raster.get_bind_group_layout(0),
            entries: &entries,
        });
        dispatch(&mut encoder, &self.raster, &group, tiles_x * tiles_y * 256);
        queue.submit([encoder.finish()]);
        self.completed = Some(CompletedFrame {
            config,
            batches: batches.to_vec(),
            stats,
        });
        Ok(stats)
    }

    pub fn texture(&self) -> Option<&wgpu::Texture> {
        self.target.as_ref().map(|t| &t.texture)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use spark_lod::SourceSplat;
    #[test]
    fn validate_all_wgsl_with_naga() {
        for (body, math, sh) in [
            (include_str!("shaders/adapt.wgsl"), true, true),
            (include_str!("shaders/upload.wgsl"), false, false),
            (include_str!("shaders/project.wgsl"), true, false),
            (include_str!("shaders/scan.wgsl"), false, false),
            (include_str!("shaders/scatter.wgsl"), true, false),
            (include_str!("shaders/sort.wgsl"), false, false),
            (include_str!("shaders/ranges.wgsl"), false, false),
            (include_str!("shaders/rasterize.wgsl"), true, false),
        ] {
            let src = shader(body, math, sh);
            let module = naga::front::wgsl::parse_str(&src)
                .unwrap_or_else(|e| panic!("{}", e.emit_to_string(&src)));
            naga::valid::Validator::new(
                naga::valid::ValidationFlags::all(),
                naga::valid::Capabilities::all(),
            )
            .validate(&module)
            .unwrap_or_else(|e| panic!("{e:?}"));
        }
    }
    #[test]
    fn gpu_struct_layouts_match_wgsl() {
        assert_eq!(std::mem::size_of::<ViewUniform>(), 128);
        assert_eq!(std::mem::size_of::<CloudUniform>(), 160);
        assert_eq!(std::mem::size_of::<SourceSplat>(), 240);
    }
}
