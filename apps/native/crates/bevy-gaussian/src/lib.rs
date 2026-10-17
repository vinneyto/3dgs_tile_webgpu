//! Add `GaussianPlugin`, an output target and a `GaussianCamera`; attach
//! `GaussianCloud` + ordinary Bevy transforms to any number of entities.
use bevy::{
    asset::RenderAssetUsages,
    prelude::*,
    render::{
        Render, RenderApp, RenderStartup, RenderSystems,
        extract_resource::{ExtractResource, ExtractResourcePlugin},
        render_asset::RenderAssets,
        renderer::{RenderDevice, RenderQueue},
        texture::GpuImage,
    },
    transform::TransformSystems,
};
use brush_renderer::{Camera as RenderCamera, CloudBatch, OUTPUT_FORMAT, RenderStats, Renderer};
use spark_lod::{CloudView, GaussianBuffer, select_lod};
use std::sync::{Arc, Mutex};

pub use brush_renderer;
pub use spark_lod;

#[derive(Component, Clone)]
#[require(Transform)]
pub struct GaussianCloud {
    pub buffer: Arc<GaussianBuffer>,
    pub opacity: f32,
    pub scale: f32,
    pub lod_scale: f32,
    pub enabled: bool,
}
impl GaussianCloud {
    pub fn new(buffer: Arc<GaussianBuffer>) -> Self {
        Self {
            buffer,
            opacity: 1.,
            scale: 1.,
            lod_scale: 1.,
            enabled: true,
        }
    }
}
/// Compatibility spelling from the original experiment brief.
pub type GaussainCloud = GaussianCloud;

#[derive(Component)]
#[require(Transform)]
pub struct GaussianCamera {
    pub fov_y: f32,
}
impl Default for GaussianCamera {
    fn default() -> Self {
        Self {
            fov_y: 60.0f32.to_radians(),
        }
    }
}

#[derive(Resource, Clone)]
pub struct GaussianTarget {
    pub image: Handle<Image>,
    pub width: u32,
    pub height: u32,
}
impl GaussianTarget {
    pub fn new(images: &mut Assets<Image>, width: u32, height: u32) -> Self {
        let mut image = Image::new_target_texture(width, height, OUTPUT_FORMAT);
        image.asset_usage = RenderAssetUsages::RENDER_WORLD;
        image.texture_descriptor.usage =
            wgpu::TextureUsages::COPY_DST | wgpu::TextureUsages::TEXTURE_BINDING;
        Self {
            image: images.add(image),
            width,
            height,
        }
    }
}
#[derive(Resource, Clone)]
pub struct GaussianSettings {
    pub budget: usize,
    pub pixel_limit: f32,
    pub max_intersections: u32,
}
impl Default for GaussianSettings {
    fn default() -> Self {
        Self {
            budget: 200_000,
            pixel_limit: 1.,
            max_intersections: 8 * 1024 * 1024,
        }
    }
}
#[derive(Clone, Debug, Default)]
pub struct RenderReport {
    pub stats: RenderStats,
    pub error: Option<String>,
}
#[derive(Resource, Clone, Default)]
pub struct GaussianTelemetry(pub Arc<Mutex<RenderReport>>);

#[derive(Resource, Clone, ExtractResource)]
struct GaussianFrame {
    target: Option<GaussianTarget>,
    camera: RenderCamera,
    batches: Vec<CloudBatch>,
    max_intersections: u32,
    telemetry: GaussianTelemetry,
    error: Option<String>,
}
impl Default for GaussianFrame {
    fn default() -> Self {
        Self {
            target: None,
            camera: RenderCamera {
                world_from_view: Mat4::IDENTITY,
                fov_y: 1.,
            },
            batches: Vec::new(),
            max_intersections: 0,
            telemetry: default(),
            error: None,
        }
    }
}
#[derive(Resource)]
struct GpuRenderer(Renderer);

pub struct GaussianPlugin;
impl Plugin for GaussianPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<GaussianSettings>()
            .init_resource::<GaussianTelemetry>()
            .init_resource::<GaussianFrame>()
            .add_plugins(ExtractResourcePlugin::<GaussianFrame>::default())
            .add_systems(PostUpdate, select_frame.after(TransformSystems::Propagate));
        if let Some(render) = app.get_sub_app_mut(RenderApp) {
            render
                .add_systems(RenderStartup, init_renderer)
                .add_systems(
                    Render,
                    render_frame.in_set(RenderSystems::PrepareBindGroups),
                );
        }
    }
}
fn init_renderer(mut commands: Commands, device: Res<RenderDevice>) {
    commands.insert_resource(GpuRenderer(Renderer::new(device.wgpu_device())));
}

fn select_frame(
    target: Option<Res<GaussianTarget>>,
    settings: Res<GaussianSettings>,
    telemetry: Res<GaussianTelemetry>,
    cameras: Query<(&GaussianCamera, &GlobalTransform)>,
    clouds: Query<(
        Entity,
        &GaussianCloud,
        &GlobalTransform,
        Option<&InheritedVisibility>,
    )>,
    mut frame: ResMut<GaussianFrame>,
) {
    frame.target = target.as_ref().map(|t| (**t).clone());
    frame.batches.clear();
    frame.error = None;
    frame.telemetry = telemetry.clone();
    frame.max_intersections = settings.max_intersections;
    if frame.target.is_none() {
        return;
    }
    let Ok((camera, transform)) = cameras.single() else {
        frame.error = Some("Exactly one GaussianCamera is required".into());
        return;
    };
    frame.camera = RenderCamera {
        world_from_view: transform.to_matrix(),
        fov_y: camera.fov_y,
    };
    let mut visible: Vec<_> = clouds
        .iter()
        .filter(|(_, c, t, v)| {
            c.enabled
                && c.opacity > 0.
                && t.to_matrix().determinant().abs() > 1e-12
                && v.is_none_or(|v| v.get())
        })
        .collect();
    visible.sort_by_key(|(e, ..)| e.to_bits());
    let views: Vec<_> = visible
        .iter()
        .map(|(_, c, t, _)| CloudView {
            buffer: &c.buffer,
            world_from_local: t.to_matrix(),
            lod_scale: c.lod_scale * c.scale,
        })
        .collect();
    let height = target.as_ref().unwrap().height;
    match select_lod(
        &views,
        frame.camera.position(),
        frame.camera.forward(),
        frame.camera.focal(height),
        settings.pixel_limit,
        settings.budget,
    ) {
        Ok(cuts) => {
            for ((entity, cloud, transform, _), nodes) in visible.into_iter().zip(cuts) {
                frame.batches.push(CloudBatch {
                    id: entity.to_bits(),
                    buffer: cloud.buffer.clone(),
                    nodes: Arc::new(nodes),
                    world_from_local: transform.to_matrix(),
                    opacity: cloud.opacity,
                    scale: cloud.scale,
                });
            }
        }
        Err(e) => frame.error = Some(e.to_string()),
    }
}

fn render_frame(
    frame: Res<GaussianFrame>,
    device: Res<RenderDevice>,
    queue: Res<RenderQueue>,
    images: Res<RenderAssets<GpuImage>>,
    mut renderer: ResMut<GpuRenderer>,
) {
    let Some(target) = &frame.target else {
        return;
    };
    let Some(image) = images.get(&target.image) else {
        return;
    };
    let result = if let Some(error) = &frame.error {
        Err(error.clone())
    } else {
        renderer.0.max_intersections = frame.max_intersections;
        renderer
            .0
            .render(
                device.wgpu_device(),
                &queue,
                target.width,
                target.height,
                frame.camera,
                &frame.batches,
            )
            .map_err(|e| e.to_string())
    };
    let mut report = frame.telemetry.0.lock().unwrap_or_else(|e| e.into_inner());
    match result {
        Ok(stats) => {
            report.stats = stats;
            report.error = None;
            let mut encoder = device
                .wgpu_device()
                .create_command_encoder(&Default::default());
            encoder.copy_texture_to_texture(
                renderer.0.texture().unwrap().as_image_copy(),
                image.texture.as_image_copy(),
                wgpu::Extent3d {
                    width: target.width,
                    height: target.height,
                    depth_or_array_layers: 1,
                },
            );
            queue.submit([encoder.finish()]);
        }
        Err(error) => {
            if report.error.as_ref() != Some(&error) {
                error!("Gaussian renderer: {error}");
            }
            report.error = Some(error);
        }
    }
}
