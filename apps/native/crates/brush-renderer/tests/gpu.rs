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

fn residency_scene() -> CloudBatch {
    let rows: Vec<_> = (0..128)
        .map(|i| {
            let mut row = SourceSplat {
                center_opacity: [
                    (i % 16) as f32 * 0.05 - 0.4,
                    (i / 16) as f32 * 0.05 - 0.2,
                    (i % 3) as f32 * 0.03,
                    0.6,
                ],
                scale: [0.03, 0.02, 0.01, 0.],
                rotation: Quat::from_rotation_z(i as f32 * 0.04).to_array(),
                sh: [0.; 48],
            };
            row.sh[..3].copy_from_slice(&[(i % 7) as f32 / 7., 0.3, (i % 5) as f32 / 5.]);
            row
        })
        .collect();
    CloudBatch {
        id: 1,
        buffer: GaussianBuffer::from_records(&rows).unwrap(),
        nodes: Arc::new((0..8).collect()),
        world_from_local: Mat4::IDENTITY,
        opacity: 0.7,
        scale: 1.,
    }
}
fn assert_reference(
    renderer: &Renderer,
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    camera: Camera,
    batches: &[CloudBatch],
) {
    let actual = pixels(renderer, device, queue, 64, 48);
    let expected = reference(
        camera,
        batches,
        64,
        48,
        Vec3::from_slice(&renderer.background[..3]),
    );
    let max = actual
        .iter()
        .zip(expected)
        .map(|(a, b)| a.abs_diff(b))
        .max()
        .unwrap();
    assert!(max <= 2, "resident indirection / CPU pixel error {max}");
}
#[test]
#[ignore = "requires a GPU or Mesa lavapipe"]
fn native_gpu_residency_reuses_lod_data_and_protects_all_instances() {
    let (device, queue) = device();
    let mut renderer = Renderer::new(&device);
    let mut camera = Camera {
        world_from_view: Mat4::from_translation(Vec3::new(0., 0., 3.)),
        fov_y: 60f32.to_radians(),
    };
    let mut batch = residency_scene();
    renderer.source_cache_bytes = batch.buffer.node_count() as u64 * 240;
    let first = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert_eq!(first.cache_misses, 8);
    assert_eq!(first.uploaded_bytes, 8 * 256);
    assert_eq!(first.index_uploaded_bytes, 8 * 4);
    assert_reference(&renderer, &device, &queue, camera, &[batch.clone()]);

    batch.nodes = Arc::new((4..12).collect());
    let partial = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert_eq!(partial.cache_misses, 4);
    assert_eq!(partial.uploaded_bytes, 4 * 256);
    assert_eq!(partial.index_uploaded_bytes, 8 * 4);
    assert_eq!(partial.resident_splats, 12);
    assert_reference(&renderer, &device, &queue, camera, &[batch.clone()]);
    batch.nodes = Arc::new((0..8).collect());
    let back = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert_eq!(
        back.uploaded_bytes, 0,
        "Returning LOD must use its existing resident records"
    );
    assert_eq!(back.index_uploaded_bytes, 8 * 4);

    batch.nodes = Arc::new((0..70).collect());
    let growth = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert_eq!(growth.cache_misses, 58);
    assert_eq!(growth.uploaded_bytes, 58 * 256);
    assert_eq!(
        growth.gpu_copied_bytes,
        12 * 240,
        "Growth must preserve old records on the GPU"
    );
    assert_reference(&renderer, &device, &queue, camera, &[batch.clone()]);
    camera.world_from_view = Mat4::from_translation(Vec3::new(0.08, 0.02, 3.));
    let moved = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert!(!moved.reused_frame);
    assert_eq!(moved.uploaded_bytes, 0);
    assert_eq!(moved.index_uploaded_bytes, 0);
    let frame = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert!(frame.reused_frame);
    assert_eq!(frame.uploaded_bytes, 0);
    assert_eq!(frame.index_uploaded_bytes, 0);

    let mut duplicate = batch.clone();
    duplicate.id = 2;
    duplicate.world_from_local = Mat4::from_translation(Vec3::X * 0.2);
    let shared = renderer
        .render(
            &device,
            &queue,
            64,
            48,
            camera,
            &[batch.clone(), duplicate.clone()],
        )
        .unwrap();
    assert_eq!(shared.splats, 140);
    assert_eq!(
        shared.resident_splats, 70,
        "Instances must share the source cache"
    );
    assert_eq!(shared.uploaded_bytes, 0);
    assert_eq!(shared.index_uploaded_bytes, 70 * 4);
    assert_reference(
        &renderer,
        &device,
        &queue,
        camera,
        &[batch.clone(), duplicate],
    );

    // An unchanged instance must receive new indices if its high resident
    // addresses are compacted after another instance disappears.
    let mut compact = Renderer::new(&device);
    compact.source_cache_bytes = 70 * 240;
    let mut high = batch.clone();
    high.id = 2;
    high.nodes = Arc::new((62..70).collect());
    compact
        .render(
            &device,
            &queue,
            64,
            48,
            camera,
            &[batch.clone(), high.clone()],
        )
        .unwrap();
    compact.source_cache_bytes = 8 * 240;
    let relocated = compact
        .render(&device, &queue, 64, 48, camera, &[high.clone()])
        .unwrap();
    assert_eq!(relocated.uploaded_bytes, 0);
    assert_eq!(relocated.gpu_copied_bytes, 8 * 240);
    assert_eq!(
        relocated.index_uploaded_bytes,
        8 * 4,
        "Compaction must refresh unchanged instance indices"
    );
    assert_reference(&compact, &device, &queue, camera, &[high]);

    // Adding a distinct source reclaims only unneeded allocation headroom.
    let mut balanced = Renderer::new(&device);
    balanced.source_cache_bytes = 12 * 240;
    let a = residency_scene();
    balanced
        .render(&device, &queue, 64, 48, camera, &[a.clone()])
        .unwrap();
    let mut b = residency_scene();
    b.id = 2;
    b.nodes = Arc::new((0..4).collect());
    let rebalance = balanced
        .render(&device, &queue, 64, 48, camera, &[a.clone(), b.clone()])
        .unwrap();
    assert_eq!(rebalance.uploaded_bytes, 4 * 256);
    assert_eq!(rebalance.gpu_copied_bytes, 8 * 240);
    assert_eq!(rebalance.source_cache_bytes, 12 * 240);
    assert_reference(&balanced, &device, &queue, camera, &[a, b]);

    // Shrinking/rebalancing a cache copies retained records inside the GPU.
    renderer.source_cache_bytes = 8 * 240;
    batch.nodes = Arc::new((0..8).collect());
    let shrink = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert_eq!(shrink.uploaded_bytes, 0);
    assert_eq!(shrink.resident_splats, 8);
    assert_eq!(shrink.source_cache_bytes, 8 * 240);
    assert_reference(&renderer, &device, &queue, camera, &[batch.clone()]);
    batch.nodes = Arc::new((4..12).collect());
    let pressure = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert_eq!(pressure.cache_misses, 4);
    assert_eq!(pressure.evicted_splats, 4);
    assert_eq!(pressure.uploaded_bytes, 4 * 256);
    assert_reference(&renderer, &device, &queue, camera, &[batch.clone()]);
    batch.nodes = Arc::new((0..8).collect());
    let reload = renderer
        .render(&device, &queue, 64, 48, camera, &[batch.clone()])
        .unwrap();
    assert_eq!(
        reload.cache_misses, 4,
        "Only the four evicted records may reload"
    );

    // Both cuts must be pinned before any insertion/eviction, regardless of
    // which instance is processed first.
    let mut other = batch.clone();
    other.id = 2;
    other.nodes = Arc::new((4..12).collect());
    assert!(
        renderer
            .render(
                &device,
                &queue,
                64,
                48,
                camera,
                &[batch.clone(), other.clone()]
            )
            .is_err()
    );
    renderer.source_cache_bytes = 12 * 240;
    let union = renderer
        .render(
            &device,
            &queue,
            64,
            48,
            camera,
            &[batch.clone(), other.clone()],
        )
        .unwrap();
    assert_eq!(union.cache_misses, 4);
    assert_eq!(union.resident_splats, 12);
    assert_reference(
        &renderer,
        &device,
        &queue,
        camera,
        &[batch.clone(), other.clone()],
    );
    batch.nodes = Arc::new(vec![7, 1, 6, 0, 5, 2, 4, 3]);
    let reordered = renderer
        .render(&device, &queue, 64, 48, camera, &[other, batch])
        .unwrap();
    assert_eq!(
        reordered.uploaded_bytes, 0,
        "Draw order is independent of resident addresses"
    );

    // Reusing an entity ID with a different source must not reuse stale data.
    let replacement = residency_scene();
    let changed = renderer
        .render(&device, &queue, 64, 48, camera, &[replacement.clone()])
        .unwrap();
    assert_eq!(changed.cache_misses, 8);
    assert_eq!(changed.uploaded_bytes, 8 * 256);
    assert_reference(&renderer, &device, &queue, camera, &[replacement]);
    let deleted = renderer
        .render(&device, &queue, 64, 48, camera, &[])
        .unwrap();
    assert_eq!(deleted.resident_splats, 0);
    assert_eq!(deleted.source_cache_bytes, 0);
}
