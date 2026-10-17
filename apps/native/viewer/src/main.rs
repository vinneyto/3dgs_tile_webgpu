use bevy::{
    input::mouse::{AccumulatedMouseMotion, AccumulatedMouseScroll},
    prelude::*,
    window::{FileDragAndDrop, PrimaryWindow},
};
use bevy_gaussian::*;
use spark_lod::GaussianBuffer;
use std::{
    path::PathBuf,
    sync::{Arc, Mutex, mpsc},
};

#[derive(Resource)]
struct Loader {
    send: mpsc::Sender<LoadEvent>,
    receive: Mutex<mpsc::Receiver<LoadEvent>>,
    pending: usize,
    picking: bool,
    status: String,
}
enum LoadEvent {
    Picked(Vec<PathBuf>),
    Stage(String),
    Done(PathBuf, anyhow::Result<Arc<GaussianBuffer>>),
}
#[derive(Resource)]
struct Orbit {
    center: Vec3,
    distance: f32,
    yaw: f32,
    pitch: f32,
}
impl Default for Orbit {
    fn default() -> Self {
        Self {
            center: Vec3::ZERO,
            distance: 4.,
            yaw: 0.,
            pitch: 0.1,
        }
    }
}
#[derive(Component)]
struct OutputSprite;
#[derive(Component)]
struct StatusText;

fn main() {
    let (send, receive) = mpsc::channel();
    let args: Vec<PathBuf> = std::env::args_os().skip(1).map(PathBuf::from).collect();
    let loader = Loader {
        send,
        receive: Mutex::new(receive),
        pending: args.len(),
        picking: false,
        status: "Press O to open a Gaussian PLY file".into(),
    };
    for path in args {
        load_file(loader.send.clone(), path);
    }
    App::new()
        .insert_resource(loader)
        .init_resource::<Orbit>()
        .add_plugins(
            DefaultPlugins
                .set(WindowPlugin {
                    primary_window: Some(Window {
                        title: "Spark x Brush | Bevy Gaussian viewer".into(),
                        resolution: (1280, 800).into(),
                        ..default()
                    }),
                    ..default()
                })
                .set(ImagePlugin::default_nearest()),
        )
        .add_plugins(GaussianPlugin)
        .add_systems(Startup, setup)
        .add_systems(
            Update,
            (
                open_files,
                receive_clouds,
                controls,
                resize_target,
                update_status,
            )
                .chain(),
        )
        .add_systems(Update, smoke_test)
        .run();
}
fn setup(mut commands: Commands, mut images: ResMut<Assets<Image>>) {
    let target = GaussianTarget::new(&mut images, 1280, 800);
    commands.spawn((Camera2d, Msaa::Off));
    commands.spawn((
        Sprite {
            image: target.image.clone(),
            custom_size: Some(Vec2::new(1280., 800.)),
            ..default()
        },
        OutputSprite,
    ));
    commands.insert_resource(target);
    commands.spawn((
        GaussianCamera::default(),
        Transform::from_xyz(0., 0., 4.).looking_at(Vec3::ZERO, Vec3::Y),
    ));
    commands.spawn((
        Text::new(""),
        TextFont {
            font_size: 16.,
            ..default()
        },
        TextColor(Color::WHITE),
        Node {
            position_type: PositionType::Absolute,
            left: Val::Px(16.),
            top: Val::Px(16.),
            padding: UiRect::all(Val::Px(12.)),
            ..default()
        },
        BackgroundColor(Color::srgba(0.025, 0.03, 0.04, 0.85)),
        StatusText,
    ));
}
fn load_file(send: mpsc::Sender<LoadEvent>, path: PathBuf) {
    std::thread::spawn(move || {
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            GaussianBuffer::load(&path, |stage| {
                let _ = send.send(LoadEvent::Stage(format!("{}: {stage}", path.display())));
            })
        }))
        .unwrap_or_else(|_| Err(anyhow::anyhow!("Spark rejected malformed cloud data")));
        let _ = send.send(LoadEvent::Done(path, result));
    });
}
fn open_files(
    keys: Res<ButtonInput<KeyCode>>,
    mut drops: MessageReader<FileDragAndDrop>,
    mut loader: ResMut<Loader>,
) {
    if keys.just_pressed(KeyCode::KeyO) && !loader.picking {
        loader.picking = true;
        let send = loader.send.clone();
        std::thread::spawn(move || {
            let paths = rfd::FileDialog::new()
                .add_filter(
                    "Gaussian clouds",
                    &["ply", "splat", "spz", "ksplat", "sog", "rad"],
                )
                .pick_files()
                .unwrap_or_default();
            let _ = send.send(LoadEvent::Picked(paths));
        });
    }
    for event in drops.read() {
        if let FileDragAndDrop::DroppedFile { path_buf, .. } = event {
            loader.pending += 1;
            load_file(loader.send.clone(), path_buf.clone());
        }
    }
}
fn receive_clouds(
    mut commands: Commands,
    mut loader: ResMut<Loader>,
    mut orbit: ResMut<Orbit>,
    clouds: Query<&GaussianCloud>,
) {
    let events: Vec<_> = loader.receive.lock().unwrap().try_iter().collect();
    let mut first = clouds.is_empty();
    for event in events {
        match event {
            LoadEvent::Picked(paths) => {
                loader.picking = false;
                loader.pending += paths.len();
                for path in paths {
                    load_file(loader.send.clone(), path);
                }
            }
            LoadEvent::Stage(stage) => loader.status = stage,
            LoadEvent::Done(path, result) => {
                loader.pending = loader.pending.saturating_sub(1);
                match result {
                    Ok(buffer) => {
                        if first {
                            orbit.center = buffer.center;
                            orbit.distance = buffer.radius * 2.8;
                            first = false;
                        }
                        loader.status = format!(
                            "{} | {} source Gaussians | {} LOD nodes",
                            path.file_name().unwrap_or_default().to_string_lossy(),
                            buffer.source_count(),
                            buffer.node_count()
                        );
                        commands.spawn((
                            Name::new(path.display().to_string()),
                            GaussianCloud::new(buffer),
                            Transform::IDENTITY,
                        ));
                    }
                    Err(error) => {
                        loader.status = format!("Could not load {}: {error:#}", path.display())
                    }
                }
            }
        }
    }
}
fn controls(
    mut commands: Commands,
    keys: Res<ButtonInput<KeyCode>>,
    mouse: Res<ButtonInput<MouseButton>>,
    motion: Res<AccumulatedMouseMotion>,
    scroll: Res<AccumulatedMouseScroll>,
    mut orbit: ResMut<Orbit>,
    mut camera: Query<&mut Transform, With<GaussianCamera>>,
    clouds: Query<(Entity, &GaussianCloud, &GlobalTransform)>,
    mut settings: ResMut<GaussianSettings>,
) {
    if mouse.pressed(MouseButton::Left) {
        orbit.yaw -= motion.delta.x * 0.005;
        orbit.pitch = (orbit.pitch + motion.delta.y * 0.005).clamp(-1.55, 1.55);
    }
    if mouse.pressed(MouseButton::Right) || mouse.pressed(MouseButton::Middle) {
        let rotation = Quat::from_rotation_y(orbit.yaw) * Quat::from_rotation_x(orbit.pitch);
        let d = orbit.distance * 0.0015;
        orbit.center += rotation * Vec3::new(-motion.delta.x, motion.delta.y, 0.) * d;
    }
    orbit.distance = (orbit.distance * (-scroll.delta.y * 0.1).exp()).clamp(0.001, 1e8);
    if keys.just_pressed(KeyCode::KeyF) && !clouds.is_empty() {
        let mut low = Vec3::splat(f32::INFINITY);
        let mut high = -low;
        for (_, c, t) in &clouds {
            let center = t.transform_point(c.buffer.center);
            let r =
                c.buffer.radius * t.to_scale_rotation_translation().0.abs().max_element() * c.scale;
            low = low.min(center - Vec3::splat(r));
            high = high.max(center + Vec3::splat(r));
        }
        orbit.center = (low + high) * 0.5;
        orbit.distance = (high - low).length().max(0.01) * 1.4;
    }
    if keys.just_pressed(KeyCode::KeyC) {
        for (e, ..) in &clouds {
            commands.entity(e).despawn();
        }
    }
    if keys.just_pressed(KeyCode::KeyD) {
        if let Some((_, c, t)) = clouds.iter().next() {
            let mut transform = Transform::from_matrix(t.to_matrix());
            transform.translation.x += c.buffer.radius * 1.5;
            commands.spawn((c.clone(), transform));
        }
    }
    if keys.just_pressed(KeyCode::BracketLeft) {
        settings.budget = (settings.budget / 2).max(16);
    }
    if keys.just_pressed(KeyCode::BracketRight) {
        settings.budget = (settings.budget * 2).min(1_000_000);
    }
    if keys.just_pressed(KeyCode::Minus) {
        settings.pixel_limit = (settings.pixel_limit * 1.25).min(64.);
    }
    if keys.just_pressed(KeyCode::Equal) {
        settings.pixel_limit = (settings.pixel_limit / 1.25).max(0.1);
    }
    let rotation = Quat::from_rotation_y(orbit.yaw) * Quat::from_rotation_x(orbit.pitch);
    for mut transform in &mut camera {
        *transform =
            Transform::from_translation(orbit.center + rotation * Vec3::Z * orbit.distance)
                .looking_at(orbit.center, Vec3::Y);
    }
}
fn resize_target(
    windows: Query<&Window, With<PrimaryWindow>>,
    mut target: ResMut<GaussianTarget>,
    mut images: ResMut<Assets<Image>>,
    mut sprites: Query<&mut Sprite, With<OutputSprite>>,
) {
    let Ok(window) = windows.single() else {
        return;
    };
    let width = window.physical_width().max(1);
    let height = window.physical_height().max(1);
    if width != target.width || height != target.height {
        let old = target.image.clone();
        *target = GaussianTarget::new(&mut images, width, height);
        images.remove(old.id());
    }
    for mut sprite in &mut sprites {
        sprite.image = target.image.clone();
        sprite.custom_size = Some(Vec2::new(window.width(), window.height()));
    }
}
fn update_status(
    loader: Res<Loader>,
    telemetry: Res<GaussianTelemetry>,
    settings: Res<GaussianSettings>,
    clouds: Query<&GaussianCloud>,
    mut text: Query<&mut Text, With<StatusText>>,
) {
    let report = telemetry.0.lock().unwrap();
    for mut text in &mut text {
        **text = format!(
            "Spark x Brush / Bevy\n{}\n{} clouds | {} selected | {} tile intersections\nBudget {} | LOD {:.2}px | resident {} / {:.1} MiB\nData {:.1} KiB | indices {:.1} KiB | misses {} | evicted {} | cached frame {}\nO open | drop files | F frame | D duplicate | C clear\nDrag orbit | right drag pan | wheel zoom | [ ] budget | - + detail{}",
            loader.status,
            clouds.iter().count(),
            report.stats.splats,
            report.stats.intersections,
            settings.budget,
            settings.pixel_limit,
            report.stats.resident_splats,
            report.stats.source_cache_bytes as f64 / (1024. * 1024.),
            report.stats.uploaded_bytes as f64 / 1024.,
            report.stats.index_uploaded_bytes as f64 / 1024.,
            report.stats.cache_misses,
            report.stats.evicted_splats,
            report.stats.reused_frame,
            report
                .error
                .as_ref()
                .map(|e| format!("\nRENDER ERROR: {e}"))
                .unwrap_or_default()
        );
    }
}

// CI/manual validation: keep normal desktop behavior unless explicitly enabled.
fn smoke_test(
    telemetry: Res<GaussianTelemetry>,
    loader: Res<Loader>,
    time: Res<Time>,
    mut exit: MessageWriter<AppExit>,
    mut commands: Commands,
    mut rendered_frames: Local<u32>,
) {
    if std::env::var_os("GAUSSIAN_SMOKE_TEST").is_none() {
        return;
    }
    let report = telemetry.0.lock().unwrap();
    if let Some(error) = &report.error {
        eprintln!("Native viewer smoke failed: {error}");
        exit.write(AppExit::error());
    } else if report.stats.splats > 0 && loader.pending == 0 {
        // Give Bevy's asynchronously compiled presentation pipeline time to become ready.
        if time.elapsed_secs() < 3. {
            return;
        }
        if let Some(path) = std::env::var_os("GAUSSIAN_SMOKE_SCREENSHOT") {
            if *rendered_frames == 0 {
                use bevy::render::view::screenshot::{Screenshot, save_to_disk};
                commands
                    .spawn(Screenshot::primary_window())
                    .observe(save_to_disk(PathBuf::from(path)));
            }
            *rendered_frames += 1;
            if *rendered_frames < 8 {
                return;
            }
        }
        println!("Native viewer smoke passed: {:?}", report.stats);
        exit.write(AppExit::Success);
    } else if time.elapsed_secs() > 45. {
        eprintln!("Native viewer smoke timed out: {}", loader.status);
        exit.write(AppExit::error());
    }
}
