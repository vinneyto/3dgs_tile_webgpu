//! Run with `cargo test -p brush-renderer --test gpu -- --ignored`.
use brush_renderer::{Camera, CloudBatch, Renderer};
use glam::{Mat3, Mat4, Quat, Vec2, Vec3, Vec4};
use spark_lod::{GaussianBuffer, SourceSplat};
use std::sync::{Arc, mpsc};

fn device() -> (wgpu::Device, wgpu::Queue) {
    pollster::block_on(async {
        let instance = wgpu::Instance::new(&wgpu::InstanceDescriptor::default());
        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions::default())
            .await
            .expect("A Vulkan/Metal/DX12 adapter is required");
        eprintln!("GPU acceptance adapter: {:?}", adapter.get_info());
        adapter
            .request_device(&wgpu::DeviceDescriptor {
                label: Some("Gaussian acceptance"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::default(),
                memory_hints: Default::default(),
                trace: wgpu::Trace::Off,
            })
            .await
            .unwrap()
    })
}
fn cloud(id: u64, color: [f32; 3], z: f32) -> CloudBatch {
    let mut row = SourceSplat {
        center_opacity: [0., 0., z, 0.65],
        scale: [0.24, 0.12, 0.05, 0.],
        rotation: [0., 0., 0., 1.],
        sh: [0.; 48],
    };
    row.sh[..3].copy_from_slice(&color);
    let buffer = GaussianBuffer::from_records(&[row]).unwrap();
    CloudBatch {
        id,
        buffer,
        nodes: Arc::new(vec![0]),
        world_from_local: Mat4::IDENTITY,
        opacity: 1.,
        scale: 1.,
    }
}
fn pixels(
    renderer: &Renderer,
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    w: u32,
    h: u32,
) -> Vec<u8> {
    let stride = (w * 4).div_ceil(256) * 256;
    let buffer = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("test image readback"),
        size: (stride * h) as u64,
        usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
        mapped_at_creation: false,
    });
    let mut encoder = device.create_command_encoder(&Default::default());
    encoder.copy_texture_to_buffer(
        renderer.texture().unwrap().as_image_copy(),
        wgpu::TexelCopyBufferInfo {
            buffer: &buffer,
            layout: wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(stride),
                rows_per_image: None,
            },
        },
        wgpu::Extent3d {
            width: w,
            height: h,
            depth_or_array_layers: 1,
        },
    );
    queue.submit([encoder.finish()]);
    let (tx, rx) = mpsc::channel();
    buffer.slice(..).map_async(wgpu::MapMode::Read, move |v| {
        tx.send(v).unwrap();
    });
    device.poll(wgpu::PollType::Wait).unwrap();
    rx.recv().unwrap().unwrap();
    let mapped = buffer.slice(..).get_mapped_range();
    let result = mapped
        .chunks_exact(stride as usize)
        .flat_map(|row| row[..w as usize * 4].iter().copied())
        .collect();
    drop(mapped);
    buffer.unmap();
    result
}
// Independent CPU projection/compositing oracle, including full affine covariance.
fn reference(camera: Camera, batches: &[CloudBatch], w: u32, h: u32, bg: Vec3) -> Vec<u8> {
    let view = Mat4::from_scale(Vec3::new(1., -1., -1.)) * camera.world_from_view.inverse();
    let rotation = Mat3::from_mat4(view);
    let focal = camera.focal(h);
    let mut splats = Vec::new();
    for b in batches {
        for node in b.nodes.iter() {
            let r = b.buffer.record(*node);
            let mean = view.transform_point3(
                b.world_from_local
                    .transform_point3(Vec3::from_slice(&r.center_opacity[..3])),
            );
            if mean.z < 0.01 {
                continue;
            }
            let inflation = r.center_opacity[3].max(1.).powf(1. / 3.);
            let axes = Mat3::from_mat4(b.world_from_local)
                * Mat3::from_quat(Quat::from_array(r.rotation))
                * Mat3::from_diagonal(Vec3::from_slice(&r.scale[..3]) * b.scale * inflation);
            let cov = rotation * axes * axes.transpose() * rotation.transpose();
            let jx = Vec3::new(focal / mean.z, 0., -focal * mean.x / (mean.z * mean.z));
            let jy = Vec3::new(0., focal / mean.z, -focal * mean.y / (mean.z * mean.z));
            let a = jx.dot(cov * jx) + 0.3;
            let b2 = jx.dot(cov * jy);
            let c = jy.dot(cov * jy) + 0.3;
            let det = a * c - b2 * b2;
            let conic = Vec3::new(c, -b2, a) / det;
            let xy = Vec2::new(
                focal * mean.x / mean.z + w as f32 * 0.5,
                focal * mean.y / mean.z + h as f32 * 0.5,
            );
            let local_camera = b
                .world_from_local
                .inverse()
                .transform_point3(camera.position());
            let dir = (Vec3::from_slice(&r.center_opacity[..3]) - local_camera).normalize();
            let (x, y, z) = (dir.x, dir.y, dir.z);
            let basis = [
                -0.48860252 * y,
                0.48860252 * z,
                -0.48860252 * x,
                1.0925485 * x * y,
                -1.0925485 * y * z,
                0.31539157 * (3. * z * z - 1.),
                -1.0925485 * x * z,
                0.54627424 * (x * x - y * y),
                -0.5900436 * y * (3. * x * x - y * y),
                2.8906114 * x * y * z,
                -0.4570458 * y * (5. * z * z - 1.),
                0.37317634 * z * (5. * z * z - 3.),
                -0.4570458 * x * (5. * z * z - 1.),
                1.4453057 * z * (x * x - y * y),
                -0.5900436 * x * (x * x - 3. * y * y),
            ];
            let mut color = Vec3::from_slice(&r.sh[..3]);
            for (i, v) in basis.into_iter().enumerate() {
                color += Vec3::from_slice(&r.sh[3 + i * 3..6 + i * 3]) * v;
            }
            splats.push((
                mean.z,
                xy,
                conic,
                color.max(Vec3::ZERO),
                (r.center_opacity[3].min(1.) * b.opacity).clamp(0., 1.),
            ));
        }
    }
    splats.sort_by(|a, b| a.0.total_cmp(&b.0));
    let mut image = Vec::new();
    for y in 0..h {
        for x in 0..w {
            let mut t = 1.;
            let mut rgb = Vec3::ZERO;
            for (_, mean, conic, color, opacity) in &splats {
                let delta = Vec2::new(x as f32 + 0.5, y as f32 + 0.5) - *mean;
                let sigma = 0.5 * (conic.x * delta.x * delta.x + conic.z * delta.y * delta.y)
                    + conic.y * delta.x * delta.y;
                let alpha = (opacity * (-sigma).exp()).min(0.999);
                if sigma >= 0. && alpha >= 1. / 255. {
                    let next = t * (1. - alpha);
                    if next <= 1e-4 {
                        break;
                    }
                    rgb += *color * alpha * t;
                    t = next;
                }
            }
            let rgba = (rgb + t * bg).extend(1.) * 255.;
            image.extend(rgba.to_array().map(|v| v.clamp(0., 255.).round() as u8));
        }
    }
    image
}

#[test]
#[ignore = "requires a GPU or Mesa lavapipe"]
fn native_gpu_matches_cpu_multi_cloud_affine_resize_and_deletion() {
    let (device, queue) = device();
    let mut renderer = Renderer::new(&device);
    let camera = Camera {
        world_from_view: Mat4::from_translation(Vec3::new(0., 0., 3.)),
        fov_y: 60f32.to_radians(),
    };
    let mut red = cloud(1, [1., 0.1, 0.05], 0.);
    let blue = cloud(2, [0.05, 0.1, 1.], 0.4);
    // Non-uniform scale, rotation, shear and translation in a single affine matrix.
    red.world_from_local = Mat4::from_cols(
        Vec4::new(1.4, 0.2, 0., 0.),
        Vec4::new(0.45, 0.7, 0., 0.),
        Vec4::Z,
        Vec4::new(0.05, 0., 0., 1.),
    );
    for (w, h, batches) in [
        (67, 49, vec![red.clone(), blue.clone()]),
        (64, 48, vec![blue.clone(), red.clone()]),
        (17, 13, vec![red.clone()]),
        (32, 24, vec![]),
    ] {
        let stats = renderer
            .render(&device, &queue, w, h, camera, &batches)
            .unwrap();
        assert_eq!(stats.splats, batches.len() as u32);
        let actual = pixels(&renderer, &device, &queue, w, h);
        let expected = reference(
            camera,
            &batches,
            w,
            h,
            Vec3::from_slice(&renderer.background[..3]),
        );
        let max = actual
            .iter()
            .zip(&expected)
            .map(|(a, b)| a.abs_diff(*b))
            .max()
            .unwrap();
        assert!(max <= 2, "GPU / CPU pixel error {max} at {w}x{h}");
    }
    // Higher SH bands rotate with the cloud, and Spark LOD opacity is decoded
    // before Brush's alpha compositor. Check against the independent oracle.
    let mut row = red.buffer.record(0);
    row.center_opacity[3] = 2.5;
    row.rotation = Quat::from_rotation_z(0.6).to_array();
    for (i, c) in row.sh[3..].iter_mut().enumerate() {
        *c = ((i as f32) * 0.7).sin() * 0.12;
    }
    let mut directional = cloud(3, [0.5; 3], 0.);
    directional.buffer = GaussianBuffer::from_records(&[row]).unwrap();
    directional.world_from_local = Mat4::from_rotation_y(0.7);
    directional.opacity = 0.4;
    let dir_batches = [directional];
    renderer
        .render(&device, &queue, 64, 48, camera, &dir_batches)
        .unwrap();
    let actual = pixels(&renderer, &device, &queue, 64, 48);
    let expected = reference(
        camera,
        &dir_batches,
        64,
        48,
        Vec3::from_slice(&renderer.background[..3]),
    );
    assert!(
        actual.iter().zip(expected).all(|(a, b)| a.abs_diff(b) <= 2),
        "SH3 / LOD opacity adaptation must match the CPU oracle"
    );
    let batches = vec![red, blue];
    renderer
        .render(&device, &queue, 64, 48, camera, &batches)
        .unwrap();
    let first = pixels(&renderer, &device, &queue, 64, 48);
    let mut reversed = batches.clone();
    reversed.reverse();
    let stats = renderer
        .render(&device, &queue, 64, 48, camera, &reversed)
        .unwrap();
    assert_eq!(
        stats.uploaded_bytes, 0,
        "Camera/transform updates must reuse local cloud buffers"
    );
    assert_eq!(
        first,
        pixels(&renderer, &device, &queue, 64, 48),
        "Cloud order must not change inter-cloud depth composition"
    );
    renderer.max_intersections = 0;
    assert!(
        renderer
            .render(&device, &queue, 64, 48, camera, &batches)
            .unwrap_err()
            .to_string()
            .contains("intersections")
    );
}
