use crate::{
    model::{render_scale_opacity, splat_bounds, union, ExtraAttribute, MipmapArray},
    protocol::*,
    slot_mapping::{GaussianKey, SlotMapping},
};
use ahash::AHashMap;
use anyhow::{bail, ensure, Context, Result};
use glam::{Mat4, Vec3, Vec3A, Vec4};
use ordered_float::OrderedFloat;
use spark_lib::{
    decoder::{ChunkReceiver, MultiDecoder, SplatFileType},
    gsplat::GsplatArray,
    tiny_lod,
    tsplat::{Tsplat, TsplatArray, TsplatMut},
};
use std::collections::{BTreeMap, BinaryHeap, HashMap};

const RESERVED: [&str; 5] = [
    "means",
    "scalesOpacity",
    "rotations",
    "shCoefficients",
    "mipmapLevel",
];
const SH_C0: f32 = 0.2820948;

struct Cloud {
    object_id: u32,
    priority: i64,
    source: GsplatArray,
    extras: BTreeMap<String, ExtraAttribute>,
    mipmaps: MipmapConfig,
    tree: Option<MipmapArray>,
    tree_bounds: Vec<[f32; 6]>,
    tree_depths: Vec<u32>,
    tree_features: Vec<(Vec3, f32)>,
    bounds: [f32; 6],
    world: Mat4,
    source_version: u32,
    snapshot_version: u32,
    generation: u32,
    coarse_cut: std::cell::RefCell<Option<(usize, u32, Vec<usize>)>>,
}

fn validate_mipmaps(config: &MipmapConfig) -> Result<()> {
    if let MipmapConfig::Standard { snapshot: Some(s) } = config {
        ensure!(
            s.max_leaves > 0 && s.max_leaves <= u32::MAX as usize,
            "maxLeaves must be a positive u32 integer"
        );
    }
    Ok(())
}

fn decode(bytes: &[u8], options: &LoadOptions) -> Result<GsplatArray> {
    let converted = crate::ascii_ply::normalize(bytes)?;
    let bytes = converted.as_deref().unwrap_or(bytes);
    let kind = match options.format.as_deref() {
        None | Some("auto") => None,
        Some("sog") => Some(SplatFileType::from_enum_str("pcsogszip")?),
        Some(other) => Some(SplatFileType::from_enum_str(other)?),
    };
    let mut decoder = MultiDecoder::new(GsplatArray::new(), kind, options.file_name.as_deref());
    decoder.push(bytes)?;
    decoder.finish()?;
    let mut source = decoder.into_splats();
    // Native hierarchy files encode opacity above one in Spark's 1..2 range.
    if source.has_children() {
        for mut s in &mut source.splats {
            if s.opacity() > 1.0 {
                let d = (s.opacity() * 4.0 - 3.0).min(5.0);
                s.set_opacity(((d * d - 1.0) / std::f32::consts::E).exp());
            }
        }
        validate_tree(&source)?;
        // Keep source writes indexed by original leaves, never imported parents.
        let leaves: Vec<_> = (0..source.len())
            .filter(|&i| source.children[i].is_empty())
            .collect();
        source = source.new_from_index_map(&leaves);
        source.clear_children();
    }
    for s in &source.splats {
        ensure!(
            s.center().is_finite()
                && s.scales().is_finite()
                && s.opacity().is_finite()
                && s.quaternion().is_finite(),
            "Non-finite Gaussian attributes"
        );
        ensure!(
            s.scales().min_element() >= 0.0 && s.quaternion().length() > 0.0,
            "Invalid Gaussian scale or rotation"
        );
    }
    Ok(source)
}

fn validate_tree(source: &GsplatArray) -> Result<()> {
    if source.len() == 0 {
        return Ok(());
    }
    let mut visited = vec![false; source.len()];
    let mut stack = vec![0];
    while let Some(i) = stack.pop() {
        ensure!(
            i < source.len() && !visited[i],
            "Invalid mipmap hierarchy (cycle or shared child)"
        );
        visited[i] = true;
        for &c in &source.children[i] {
            stack.push(c);
        }
    }
    ensure!(
        visited.iter().all(|v| *v),
        "Mipmap hierarchy has unreachable nodes"
    );
    Ok(())
}

fn extras(options: &LoadOptions, count: usize) -> Result<BTreeMap<String, ExtraAttribute>> {
    let mut result = BTreeMap::new();
    for a in &options.attributes {
        ensure!(
            !a.name.is_empty() && !RESERVED.contains(&a.name.as_str()),
            "Reserved or empty attribute name"
        );
        ensure!(
            !result.contains_key(&a.name),
            "Duplicate attribute {}",
            a.name
        );
        ensure!(
            a.elements_per_gaussian > 0 && a.elements_per_gaussian <= 64,
            "Attribute width must be 1..64"
        );
        ensure!(
            a.format == "f32" || a.format == "u32",
            "Unsupported attribute format"
        );
        let len = count
            .checked_mul(a.elements_per_gaussian)
            .context("Attribute size overflow")?;
        let values = match &a.source {
            AttributeSource::Buffer { data } => {
                ensure!(data.len() == len, "Attribute buffer length mismatch");
                data.clone()
            }
            AttributeSource::Fill { value } => {
                ensure!(value == "zeros" || value == "ones", "Unsupported fill");
                vec![if value == "ones" { 1.0 } else { 0.0 }; len]
            }
        };
        validate_values(&a.format, &values)?;
        let aggregation = a.mipmap_aggregation.clone().unwrap_or_else(|| {
            if a.format == "u32" {
                "first"
            } else {
                "weighted-mean"
            }
            .into()
        });
        ensure!(
            ["first", "min", "max", "weighted-mean"].contains(&aggregation.as_str()),
            "Invalid mipmap aggregation"
        );
        result.insert(
            a.name.clone(),
            ExtraAttribute {
                format: a.format.clone(),
                width: a.elements_per_gaussian,
                aggregation,
                values,
            },
        );
    }
    Ok(result)
}

fn validate_values(format: &str, values: &[f64]) -> Result<()> {
    for &v in values {
        ensure!(v.is_finite(), "Attribute values must be finite");
        if format == "u32" {
            ensure!(
                v >= 0.0 && v <= u32::MAX as f64 && v.fract() == 0.0,
                "Invalid u32 attribute"
            );
        } else {
            ensure!((v as f32).is_finite(), "Attribute exceeds f32 range");
        }
    }
    Ok(())
}

fn build_tree(
    source: &GsplatArray,
    extras: &BTreeMap<String, ExtraAttribute>,
    config: &MipmapConfig,
) -> Result<(Option<MipmapArray>, Vec<[f32; 6]>)> {
    validate_mipmaps(config)?;
    if matches!(config, MipmapConfig::None) || source.len() == 0 {
        return Ok((None, Vec::new()));
    }
    let mut tree = MipmapArray::from_source(source, extras);
    if !source.has_children() {
        tree.retain(|s| s.opacity() > 0.0 && s.max_scale() > 0.0);
        if tree.len() == 0 {
            return Ok((None, Vec::new()));
        }
        tiny_lod::compute_lod_tree(&mut tree, 1.5, false, |_| {});
    } else {
        // Existing parent identities are hierarchy nodes, not original splats.
        for i in 0..tree.len() {
            if !tree.inner.children[i].is_empty() {
                tree.source_ids[i] = None;
            }
        }
    }
    let mut bounds: Vec<_> = (0..tree.len())
        .map(|i| splat_bounds(&tree.get(i)))
        .collect();
    // Post-order traversal; don't assume a file's node order is breadth-first.
    let mut stack = vec![(0, false)];
    while let Some((i, done)) = stack.pop() {
        let children = tree.get_children(i);
        if done {
            for &c in &children {
                bounds[i] = union(bounds[i], bounds[c]);
            }
        } else {
            stack.push((i, true));
            for &c in &children {
                stack.push((c, false));
            }
        }
    }
    Ok((Some(tree), bounds))
}

fn matrix(values: &[f32], affine: bool) -> Result<Mat4> {
    ensure!(
        values.len() == 16 && values.iter().all(|v| v.is_finite()),
        "Matrix must contain sixteen finite elements"
    );
    let m = Mat4::from_cols_slice(values);
    ensure!(
        m.determinant().is_finite() && m.determinant().abs() > 1e-20,
        "Matrix must be invertible"
    );
    if affine {
        ensure!(
            values[3] == 0.0 && values[7] == 0.0 && values[11] == 0.0 && values[15] == 1.0,
            "World matrix must be affine"
        );
    }
    Ok(m)
}

fn visible(bounds: &[f32; 6], planes: &[Vec4; 6]) -> bool {
    let center = Vec3::new(
        (bounds[0] + bounds[3]) * 0.5,
        (bounds[1] + bounds[4]) * 0.5,
        (bounds[2] + bounds[5]) * 0.5,
    );
    let extent = Vec3::new(
        (bounds[3] - bounds[0]) * 0.5,
        (bounds[4] - bounds[1]) * 0.5,
        (bounds[5] - bounds[2]) * 0.5,
    );
    planes
        .iter()
        .all(|p| p.truncate().dot(center) + p.w + p.truncate().abs().dot(extent) >= 0.0)
}

fn frustum_planes(clip: Mat4) -> [Vec4; 6] {
    let rows = clip.transpose();
    // WebGPU clip depth is 0..w; Three's WebGPU projection follows that range.
    [
        rows.w_axis + rows.x_axis,
        rows.w_axis - rows.x_axis,
        rows.w_axis + rows.y_axis,
        rows.w_axis - rows.y_axis,
        rows.z_axis,
        rows.w_axis - rows.z_axis,
    ]
}

/// A complete cut: refining replaces a parent with ALL its children. Nodes
/// that don't fit stay as parents; other branches may still refine.
fn cut(
    tree: &MipmapArray,
    budget: usize,
    score: impl Fn(usize) -> f32,
    include: impl Fn(usize) -> bool,
    pixel_limit: f32,
) -> Vec<usize> {
    cut_from(tree, &[0], budget, score, include, pixel_limit, false)
}

fn cut_from(
    tree: &MipmapArray,
    seeds: &[usize],
    budget: usize,
    score: impl Fn(usize) -> f32,
    include: impl Fn(usize) -> bool,
    pixel_limit: f32,
    reserve_seeds: bool,
) -> Vec<usize> {
    if budget == 0 || tree.len() == 0 {
        return Vec::new();
    }
    let mut terminal = Vec::new();
    let mut heap = BinaryHeap::new();
    for &i in seeds {
        if !include(i) {
            continue;
        }
        if tree.inner.children[i].is_empty() {
            terminal.push(i);
        } else {
            heap.push((OrderedFloat(score(i)), std::cmp::Reverse(i)));
        }
    }
    let reserved: ahash::AHashSet<_> = if reserve_seeds {
        seeds.iter().copied().collect()
    } else {
        Default::default()
    };
    let mut allocated = terminal.len() + heap.len();
    while let Some((OrderedFloat(size), std::cmp::Reverse(i))) = heap.pop() {
        if size <= pixel_limit {
            terminal.push(i);
            terminal.extend(heap.into_iter().map(|(_, std::cmp::Reverse(i))| i));
            break;
        }
        let children: smallvec::SmallVec<[usize; 8]> = tree.inner.children[i]
            .iter()
            .copied()
            .filter(|&c| include(c))
            .collect();
        let next_allocated = allocated + children.len() - usize::from(!reserved.contains(&i));
        if next_allocated > budget {
            terminal.push(i);
            continue;
        }
        allocated = next_allocated;
        for c in children {
            if tree.inner.children[c].is_empty() {
                terminal.push(c);
            } else {
                heap.push((OrderedFloat(score(c)), std::cmp::Reverse(c)));
            }
        }
    }
    terminal.sort_unstable();
    terminal
}

impl Cloud {
    fn selected(&self, node_id: usize) -> SelectedGaussian {
        SelectedGaussian {
            key: GaussianKey {
                cloud_id: self.object_id,
                generation: self.generation,
                node_id,
            },
            version: self.source_version,
            level: self.tree_depths.get(node_id).copied().unwrap_or(0),
        }
    }
    fn snapshot(&self) -> Option<Snapshot> {
        let MipmapConfig::Standard {
            snapshot: Some(config),
        } = &self.mipmaps
        else {
            return None;
        };
        let tree = self.tree.as_ref()?;
        let frontier = cut(
            tree,
            config.max_leaves,
            |i| tree.get(i).feature_size(),
            |_| true,
            -1.0,
        );
        let mut leaves = vec![false; tree.len()];
        for &i in &frontier {
            leaves[i] = true;
        }
        let mut nodes = vec![0];
        let mut children = Vec::new();
        let mut cursor = 0;
        while cursor < nodes.len() {
            let i = nodes[cursor];
            if leaves[i] {
                children.extend([0, 0]);
            } else {
                let child_ids = tree.get_children(i);
                children.extend([nodes.len() as u32, child_ids.len() as u32]);
                nodes.extend(child_ids);
            }
            cursor += 1;
        }
        // Bounds remain conservative for all original descendants, including
        // descendants omitted below the coarse frontier.
        let bounds: Vec<_> = nodes.iter().map(|&i| self.tree_bounds[i]).collect();
        let selection: Vec<_> = nodes.iter().map(|&i| (i, 0u32)).collect();
        Some(Snapshot {
            source_version: self.source_version,
            snapshot_version: self.snapshot_version,
            root_index: 0,
            node_count: nodes.len(),
            leaf_count: frontier.len(),
            attributes: attributes_for(
                &tree.inner,
                &tree.extras,
                &selection,
                0,
                tree.max_sh_degree(),
                nodes.len(),
            ),
            node_bounds: bounds.into_iter().flatten().collect(),
            node_children: children,
        })
    }
    fn snapshot_payload(&self, id: &str) -> Payload {
        Payload::MipmapSnapshotReplaced {
            cloud_id: id.into(),
            source_version: self.source_version,
            snapshot_version: self.snapshot_version,
            bounds: self.bounds,
            snapshot: self.snapshot(),
        }
    }
}

struct SelectedGaussian {
    key: GaussianKey,
    version: u32,
    level: u32,
}

struct Packed {
    compact: bool,
    capacity: usize,
    count: usize,
    degree: usize,
    object_capacity: u32,
    attributes: Vec<Attribute>,
    clouds: Vec<CloudState>,
    slots: SlotMapping,
    versions: Vec<u32>,
    active: Vec<GaussianKey>,
    active_slots: Vec<usize>,
}

#[derive(Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineTimings {
    pub selection_ms: f64,
    pub slot_mapping_ms: f64,
    pub packing_ms: f64,
    pub resident_gaussians: usize,
    pub active_gaussians: usize,
    pub pinned_gaussians: usize,
    pub cache_hits: usize,
    pub cache_misses: usize,
    pub evicted_gaussians: usize,
    pub prefetch_pending: bool,
}
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen::prelude::wasm_bindgen]
extern "C" {
    #[wasm_bindgen::prelude::wasm_bindgen(js_namespace = performance, js_name = now)]
    fn clock_ms() -> f64;
}
#[cfg(not(target_arch = "wasm32"))]
fn clock_ms() -> f64 {
    static START: std::sync::OnceLock<std::time::Instant> = std::sync::OnceLock::new();
    START
        .get_or_init(std::time::Instant::now)
        .elapsed()
        .as_secs_f64()
        * 1000.0
}

struct ActivationPlan {
    added: Vec<u32>,
    removed: Vec<u32>,
    clouds: Vec<CloudState>,
    pending: bool,
    cursor: usize,
}
struct UploadPlan {
    slots: Vec<usize>,
    cursor: usize,
    batch: usize,
    activation_batch: usize,
    coarse_end: usize,
    coarse_activation: Option<ActivationPlan>,
    before: Option<ActivationPlan>,
    after: Option<ActivationPlan>,
}

pub struct Engine {
    config: Config,
    clouds: BTreeMap<String, Cloud>,
    next_object: u32,
    capabilities: Option<Capabilities>,
    camera_world: Mat4,
    projection: Mat4,
    viewport: [u32; 2],
    scene_revision: u32,
    layout_version: u32,
    content_version: u32,
    packed: Option<Packed>,
    pending_upload: Option<UploadPlan>,
    prefetch_cursors: BTreeMap<(u32, u32), usize>,
    pub timings: EngineTimings,
}

impl Engine {
    pub fn new(config: Config) -> Result<Self> {
        if let Some(c) = &config.default_mipmaps {
            validate_mipmaps(c)?;
        }
        if let Some(s) = &config.streaming {
            if let Some(bytes) = s.max_upload_bytes_per_update {
                ensure!(bytes >= 4, "Upload batch must allow at least four bytes");
            }
        }
        Ok(Self {
            config,
            clouds: BTreeMap::new(),
            next_object: 0,
            capabilities: None,
            camera_world: Mat4::IDENTITY,
            projection: Mat4::IDENTITY,
            viewport: [1, 1],
            scene_revision: 0,
            layout_version: 0,
            content_version: 0,
            packed: None,
            pending_upload: None,
            prefetch_cursors: BTreeMap::new(),
            timings: EngineTimings::default(),
        })
    }
    /// Collecting convenience API for native callers. The worker uses begin /
    /// next_payload to copy and transfer only one bounded batch at a time.
    pub fn apply(&mut self, command: Command, bytes: &[u8]) -> Result<Vec<Payload>> {
        let mut output = self.begin(command, bytes)?;
        while let Some(payload) = self.next_payload() {
            output.push(payload);
        }
        Ok(output)
    }
    pub fn begin(&mut self, command: Command, bytes: &[u8]) -> Result<Vec<Payload>> {
        ensure!(
            self.pending_upload.is_none(),
            "Previous upload must be drained"
        );
        self.timings = EngineTimings::default();
        let mut output = Vec::new();
        match command {
            Command::Prefetch => return self.prefetch(),
            Command::Load(c) => {
                ensure!(!self.clouds.contains_key(&c.cloud_id), "Duplicate cloud");
                let options = c.options.unwrap_or_default();
                let source = decode(bytes, &options)?;
                let extra = extras(&options, source.len())?;
                self.validate_schemas(&extra)?;
                if let Some(cap) = &self.capabilities {
                    self.validate_layout(cap, Some((&source, &extra)))?;
                }
                let mipmaps = options
                    .mipmaps
                    .unwrap_or_else(|| self.config.default_mipmaps.clone().unwrap_or_default());
                let (tree, tree_bounds) = build_tree(&source, &extra, &mipmaps)?;
                let bounds = source_bounds(&source);
                ensure!(
                    self.next_object < 1 << 24,
                    "Object id exceeds f32 precision"
                );
                let object_id = self.next_object;
                let next_object = object_id.checked_add(1).context("Object id overflow")?;
                let cloud = Cloud {
                    object_id,
                    priority: options.priority.unwrap_or(0),
                    source,
                    extras: extra,
                    mipmaps,
                    tree_depths: tree.as_ref().map(depths).unwrap_or_default(),
                    tree_features: tree.as_ref().map(features).unwrap_or_default(),
                    tree,
                    tree_bounds,
                    bounds,
                    world: Mat4::IDENTITY,
                    source_version: 1,
                    snapshot_version: 1,
                    generation: 1,
                    coarse_cut: Default::default(),
                };
                output.push(Payload::CloudLoaded {
                    cloud_id: c.cloud_id.clone(),
                    object_id,
                    source_count: cloud.source.len(),
                    source_version: cloud.source_version,
                    sh_degree: cloud.source.max_sh_degree(),
                    bounds,
                    mipmap_snapshot: cloud.snapshot(),
                });
                self.next_object = next_object;
                self.clouds.insert(c.cloud_id, cloud);
            }
            Command::Unload(c) => {
                self.clouds.remove(&c.cloud_id).context("Unknown cloud")?;
                output.push(Payload::CloudUnloaded {
                    cloud_id: c.cloud_id,
                });
            }
            Command::Priority(c) => {
                self.clouds
                    .get_mut(&c.cloud_id)
                    .context("Unknown cloud")?
                    .priority = c.priority;
            }
            Command::Mipmaps(c) => {
                let cloud = self.clouds.get_mut(&c.cloud_id).context("Unknown cloud")?;
                validate_mipmaps(&c.mipmaps)?;
                let mode_changed = matches!(cloud.mipmaps, MipmapConfig::None)
                    != matches!(c.mipmaps, MipmapConfig::None);
                if matches!(c.mipmaps, MipmapConfig::None) {
                    cloud.tree = None;
                    cloud.tree_bounds.clear();
                    cloud.tree_depths.clear();
                    cloud.tree_features.clear();
                } else if cloud.tree.is_none() {
                    let (tree, bounds) = build_tree(&cloud.source, &cloud.extras, &c.mipmaps)?;
                    cloud.tree_depths = tree.as_ref().map(depths).unwrap_or_default();
                    cloud.tree_features = tree.as_ref().map(features).unwrap_or_default();
                    cloud.tree = tree;
                    cloud.tree_bounds = bounds;
                }
                if mode_changed {
                    cloud.generation += 1;
                }
                cloud.mipmaps = c.mipmaps;
                cloud.snapshot_version += 1;
                output.push(cloud.snapshot_payload(&c.cloud_id));
            }
            Command::Transform(c) => {
                let world = matrix(&c.world_matrix, true)?;
                self.clouds
                    .get_mut(&c.cloud_id)
                    .context("Unknown cloud")?
                    .world = world;
                self.scene_revision = self.scene_revision.max(c.scene_revision);
            }
            Command::Camera(c) => {
                ensure!(
                    c.viewport_width > 0 && c.viewport_height > 0,
                    "Viewport must be positive"
                );
                let world = matrix(&c.world_matrix, true)?;
                let projection = matrix(&c.projection_matrix, false)?;
                self.camera_world = world;
                self.projection = projection;
                self.viewport = [c.viewport_width, c.viewport_height];
                self.scene_revision = self.scene_revision.max(c.scene_revision);
            }
            Command::Capabilities(c) => {
                ensure!(c.protocol_version == 2, "Unsupported protocol version");
                ensure!(
                    c.capabilities.max_buffer_size >= 16
                        && c.capabilities.max_storage_buffer_binding_size >= 16
                        && c.capabilities.max_storage_buffers_per_shader_stage >= 5,
                    "Invalid frontend capabilities"
                );
                ensure!(
                    c.viewport_width > 0 && c.viewport_height > 0,
                    "Viewport must be positive"
                );
                self.validate_layout(&c.capabilities, None)?;
                let world = matrix(&c.camera_world_matrix, true)?;
                let projection = matrix(&c.projection_matrix, false)?;
                let mut transforms = Vec::new();
                for t in &c.cloud_transforms {
                    ensure!(self.clouds.contains_key(&t.cloud_id), "Unknown cloud");
                    transforms.push((&t.cloud_id, matrix(&t.world_matrix, true)?));
                }
                for (id, world) in transforms {
                    self.clouds.get_mut(id).unwrap().world = world;
                }
                self.camera_world = world;
                self.projection = projection;
                self.viewport = [c.viewport_width, c.viewport_height];
                self.capabilities = Some(c.capabilities);
                self.scene_revision = self.scene_revision.max(c.scene_revision);
                output.push(Payload::CapabilitiesAccepted {
                    protocol_version: 2,
                    supports_cache_prefetch: true,
                });
            }
            Command::Write(c) => {
                let cloud = self.clouds.get_mut(&c.cloud_id).context("Unknown cloud")?;
                write(cloud, &c)?;
                if !matches!(cloud.mipmaps, MipmapConfig::None) {
                    cloud.generation += 1;
                }
                cloud.source_version += 1;
                cloud.snapshot_version += 1;
                output.push(cloud.snapshot_payload(&c.cloud_id));
            }
        }
        if self.capabilities.is_some() {
            output.extend(self.pack()?);
        }
        Ok(output)
    }
    fn validate_schemas(&self, extra: &BTreeMap<String, ExtraAttribute>) -> Result<()> {
        for cloud in self.clouds.values() {
            for (name, a) in extra {
                if let Some(b) = cloud.extras.get(name) {
                    ensure!(
                        a.format == b.format && a.width == b.width,
                        "Conflicting attribute schema {}",
                        name
                    );
                }
            }
        }
        Ok(())
    }
    fn validate_layout(
        &self,
        cap: &Capabilities,
        incoming: Option<(&GsplatArray, &BTreeMap<String, ExtraAttribute>)>,
    ) -> Result<(usize, BTreeMap<String, ExtraAttribute>, usize)> {
        let mut degree = 0;
        let mut extra = BTreeMap::new();
        for (source, attributes) in self
            .clouds
            .values()
            .map(|c| (&c.source, &c.extras))
            .chain(incoming)
        {
            degree = degree.max(source.max_sh_degree());
            for (name, a) in attributes {
                extra.insert(
                    name.clone(),
                    ExtraAttribute {
                        format: a.format.clone(),
                        width: a.width,
                        aggregation: a.aggregation.clone(),
                        values: Vec::new(),
                    },
                );
            }
        }
        ensure!(
            5 + extra.len() <= cap.max_storage_buffers_per_shader_stage,
            "Too many Gaussian attributes for frontend bindings"
        );
        let limit = cap.max_buffer_size.min(cap.max_storage_buffer_binding_size);
        let max_width = extra
            .values()
            .map(|a| a.width * 4)
            .chain([16, ((degree + 1).pow(2) + 1) * 4])
            .max()
            .unwrap();
        let object_capacity = self
            .clouds
            .values()
            .map(|c| c.object_id + 1)
            .max()
            .unwrap_or(0)
            .max(if incoming.is_some() {
                self.next_object + 1
            } else {
                0
            });
        let object_bytes = object_capacity as usize * 10 * 16;
        let budget = (limit / max_width).min(limit.saturating_sub(object_bytes) / 16);
        ensure!(budget > 0, "Frontend buffer limits are too small");
        Ok((degree, extra, budget))
    }
    fn select(
        &self,
        budget: usize,
    ) -> (
        Vec<SelectedGaussian>,
        Vec<SelectedGaussian>,
        Vec<CloudState>,
    ) {
        let mut ordered: Vec<_> = self.clouds.iter().collect();
        ordered.sort_by_key(|(_, c)| (c.priority, c.object_id));
        let tree_count = ordered
            .iter()
            .filter(|(_, c)| c.tree.is_some())
            .count()
            .min(budget);
        // A complete, camera-independent spatial cut, with a small share of the
        // SAME frontend capacity. No fixed tree depth or second memory budget.
        let coarse_budget = (budget / 32).max(tree_count).min(budget);
        let mut coarse_remaining = coarse_budget;
        let mut trees_remaining = tree_count;
        let mut seeds = AHashMap::new();
        let mut pinned = Vec::new();
        for (_, cloud) in &ordered {
            if let Some(tree) = &cloud.tree {
                let quota = coarse_remaining.checked_div(trees_remaining).unwrap_or(0);
                let mut cached = cloud.coarse_cut.borrow_mut();
                if cached.as_ref().is_none_or(|(old_quota, generation, _)| {
                    *old_quota != quota || *generation != cloud.generation
                }) {
                    *cached = Some((
                        quota,
                        cloud.generation,
                        cut(tree, quota, |i| cloud.tree_features[i].1, |_| true, -1.0),
                    ));
                }
                let frontier = cached.as_ref().unwrap().2.clone();
                coarse_remaining -= frontier.len();
                trees_remaining = trees_remaining.saturating_sub(1);
                pinned.extend(frontier.iter().map(|&node| cloud.selected(node)));
                seeds.insert(cloud.object_id, frontier);
            }
        }
        let mut remaining = budget - pinned.len();
        let mut selected = Vec::new();
        let mut states = Vec::new();
        for (id, cloud) in ordered {
            let indices = if let Some(tree) = &cloud.tree {
                let base = &seeds[&cloud.object_id];
                // Pinned nodes may also be active. Reserve their storage even
                // when a refined branch replaces them in the draw cut.
                let allowance = remaining + base.len();
                let view = self.camera_world.inverse() * cloud.world;
                let planes = frustum_planes(self.projection * view);
                let scale = view
                    .x_axis
                    .truncate()
                    .length()
                    .max(view.y_axis.truncate().length())
                    .max(view.z_axis.truncate().length());
                let pixels = self.projection.y_axis.y.abs() * self.viewport[1] as f32 * 0.5;
                let indices = cut_from(
                    tree,
                    base,
                    allowance,
                    |i| {
                        // Offscreen branches remain represented by the pinned cut.
                        if !visible(&cloud.tree_bounds[i], &planes) {
                            return 0.0;
                        }
                        let (center, feature) = cloud.tree_features[i];
                        let center = view.transform_point3(center);
                        let size = feature * scale;
                        if self.projection.w_axis.w == 0.0 {
                            let distance = center.length().max(size * 0.5).max(1e-6);
                            let forward = (-center.z / distance).clamp(-1.0, 1.0);
                            let importance = 0.2 + 0.8 * forward.max(0.0).powi(2);
                            size * pixels / distance * importance
                        } else {
                            size * pixels
                        }
                    },
                    |_| true,
                    1.0,
                    true,
                );
                let extra = indices
                    .iter()
                    .filter(|i| base.binary_search(i).is_err())
                    .count();
                remaining -= extra;
                indices
            } else {
                let indices: Vec<_> = (0..cloud.source.len())
                    .filter(|&i| {
                        !cloud.source.has_children() || cloud.source.children[i].is_empty()
                    })
                    .take(remaining)
                    .collect();
                remaining -= indices.len();
                indices
            };
            states.push(CloudState {
                cloud_id: id.clone(),
                object_id: cloud.object_id,
                rendered_count: indices.len(),
            });
            selected.extend(indices.into_iter().map(|i| cloud.selected(i)));
        }
        (selected, pinned, states)
    }
    fn pack(&mut self) -> Result<Vec<Payload>> {
        let cap = self.capabilities.as_ref().unwrap();
        let (degree, extra, budget) = self.validate_layout(cap, None)?;
        let selection_start = clock_ms();
        let available: usize = self
            .clouds
            .values()
            .map(|c| c.tree.as_ref().map_or(c.source.len(), |t| t.len()))
            .sum();
        let capacity = budget.min(available).max(1);
        let (selected, pinned, states) = self.select(capacity);
        self.timings.selection_ms = clock_ms() - selection_start;
        let mapping_start = clock_ms();
        let count = selected.len();
        let object_capacity = self
            .clouds
            .values()
            .map(|c| c.object_id + 1)
            .max()
            .unwrap_or(0);
        let compact = cap.supports_compact_gaussians;
        let schema = gpu_empty_attributes(degree, &extra, 0, compact);
        let compatible = self
            .packed
            .as_ref()
            .map(|old| {
                old.compact == compact
                    && old.capacity == capacity
                    && old.degree == degree
                    && old.object_capacity == object_capacity
                    && old.attributes.len() == schema.len()
                    && old.attributes.iter().zip(&schema).all(|(a, b)| {
                        a.name == b.name
                            && a.format == b.format
                            && a.elements_per_gaussian == b.elements_per_gaussian
                    })
            })
            .unwrap_or(false);
        let packed = self.packed.get_or_insert_with(|| Packed {
            compact,
            capacity,
            count: 0,
            degree,
            object_capacity,
            attributes: Vec::new(),
            clouds: Vec::new(),
            slots: SlotMapping::default(),
            versions: Vec::new(),
            active: Vec::new(),
            active_slots: Vec::new(),
        });
        let pinned_keys: ahash::AHashSet<_> = pinned.iter().map(|s| s.key).collect();
        let requested: Vec<_> = pinned
            .iter()
            .chain(selected.iter().filter(|s| !pinned_keys.contains(&s.key)))
            .collect();
        let keys: Vec<_> = requested.iter().map(|s| s.key).collect();
        let old_active = packed.active.clone();
        let old_active_slots = packed.active_slots.clone();
        let old_pinned: Vec<_> = pinned
            .iter()
            .filter_map(|s| packed.slots.to_slot.get(&s.key).map(|&slot| (s.key, slot)))
            .collect();
        self.timings.cache_hits = selected
            .iter()
            .filter(|s| {
                packed
                    .slots
                    .to_slot
                    .get(&s.key)
                    .is_some_and(|&slot| packed.versions[slot] == s.version)
            })
            .count();
        self.timings.cache_misses = selected.len() - self.timings.cache_hits;
        let generations = self
            .clouds
            .values()
            .map(|c| (c.object_id, c.generation))
            .collect();
        let changes = packed.slots.reconcile(capacity, &keys, &generations);
        self.timings.evicted_gaussians = changes.evictions;
        packed.versions.resize(capacity, 0);
        for &slot in &changes.assigned {
            packed.versions[slot] = 0;
        }
        let states_changed = packed.clouds != states;
        if !compatible {
            self.prefetch_cursors.clear();
            packed.attributes = gpu_empty_attributes(degree, &extra, capacity, compact);
            packed.versions.fill(0);
        }
        // A layout replacement repopulates every valid resident owner, not
        // only the draw cut. Cached rows remain real resident data afterwards.
        let resident_selection: Vec<_> = if !compatible {
            let clouds: AHashMap<_, _> = self.clouds.values().map(|c| (c.object_id, c)).collect();
            packed
                .slots
                .owners
                .iter()
                .enumerate()
                .filter_map(|(slot, owner)| {
                    owner.map(|key| (clouds[&key.cloud_id].selected(key.node_id), slot))
                })
                .collect()
        } else {
            Vec::new()
        };
        let dirty: Vec<(&SelectedGaussian, usize)> = if compatible {
            requested
                .iter()
                .zip(&changes.selected_slots)
                .filter_map(|(s, &slot)| (packed.versions[slot] != s.version).then_some((*s, slot)))
                .collect()
        } else {
            resident_selection
                .iter()
                .map(|(s, slot)| (s, *slot))
                .collect()
        };
        self.timings.slot_mapping_ms = clock_ms() - mapping_start;
        let packing_start = clock_ms();
        // Capture only candidate slots. Retained, unchanged Gaussians are never
        // repacked, copied or byte-compared on camera updates.
        let mut candidates: Vec<_> = if compatible {
            changes
                .cleared
                .iter()
                .copied()
                .chain(dirty.iter().map(|(_, slot)| *slot))
                .collect()
        } else {
            Vec::new()
        };
        candidates.sort_unstable();
        candidates.dedup();
        let previous: Vec<_> = packed
            .attributes
            .iter()
            .map(|a| a.data.gather(&candidates, a.elements_per_gaussian))
            .collect();
        for &slot in &changes.cleared {
            for a in &mut packed.attributes {
                let w = a.elements_per_gaussian;
                match &mut a.data {
                    Data::F32(v) => {
                        v[slot * w..(slot + 1) * w].fill(0.0);
                        if a.name == "means" {
                            v[slot * w + 3] = -1.0;
                        }
                    }
                    Data::U32(v) => v[slot * w..(slot + 1) * w].fill(0),
                }
            }
        }
        let clouds: HashMap<_, _> = self.clouds.values().map(|c| (c.object_id, c)).collect();
        let mut by_cloud: BTreeMap<u32, Vec<_>> = BTreeMap::new();
        for &(s, slot) in &dirty {
            by_cloud.entry(s.key.cloud_id).or_default().push((s, slot));
        }
        for (id, entries) in by_cloud {
            let cloud = clouds[&id];
            let (source, extras) = cloud
                .tree
                .as_ref()
                .map(|tree| (&tree.inner, &tree.extras))
                .unwrap_or((&cloud.source, &cloud.extras));
            let selection: Vec<_> = entries
                .iter()
                .map(|(s, _)| (s.key.node_id, s.level))
                .collect();
            let data = gpu_attributes_for(
                source,
                extras,
                &selection,
                id,
                degree,
                entries.len(),
                compact,
            );
            for target in &mut packed.attributes {
                if let Some(a) = data.iter().find(|a| a.name == target.name) {
                    let w = target.elements_per_gaussian;
                    for (row, (_, slot)) in entries.iter().enumerate() {
                        match (&mut target.data, &a.data) {
                            (Data::F32(t), Data::F32(v)) => t[slot * w..(slot + 1) * w]
                                .copy_from_slice(&v[row * w..(row + 1) * w]),
                            (Data::U32(t), Data::U32(v)) => t[slot * w..(slot + 1) * w]
                                .copy_from_slice(&v[row * w..(row + 1) * w]),
                            _ => unreachable!(),
                        }
                    }
                }
            }
            for &(s, slot) in &entries {
                packed.versions[slot] = s.version;
            }
        }
        let changed: Vec<_> = candidates
            .into_iter()
            .enumerate()
            .filter_map(|(row, slot)| {
                previous
                    .iter()
                    .zip(&packed.attributes)
                    .any(|(old, a)| !old.row_same(&a.data, row, slot, a.elements_per_gaussian))
                    .then_some(slot)
            })
            .collect();
        let target_active: Vec<_> = selected.iter().map(|s| s.key).collect();
        let target_slots: Vec<_> = target_active
            .iter()
            .map(|key| packed.slots.to_slot[key])
            .collect();
        let active_changed = old_active != target_active;
        let needs_fallback = compatible
            && old_active
                .iter()
                .zip(&old_active_slots)
                .any(|(key, &slot)| packed.slots.owners.get(slot).copied().flatten() != Some(*key));
        let fallback_slots: Vec<_> = if needs_fallback {
            old_pinned
                .iter()
                .filter(|(key, slot)| {
                    packed.slots.owners.get(*slot).copied().flatten() == Some(*key)
                })
                .map(|(_, slot)| *slot)
                .chain(
                    old_active
                        .iter()
                        .zip(&old_active_slots)
                        .filter(|(key, slot)| {
                            self.clouds
                                .values()
                                .any(|c| c.object_id == key.cloud_id && c.tree.is_none())
                                && packed.slots.owners.get(**slot).copied().flatten() == Some(**key)
                        })
                        .map(|(_, &slot)| slot),
                )
                .collect()
        } else {
            old_active_slots.clone()
        };
        let make_activation = |from: &[usize], to: &[usize], clouds, pending| {
            // Byte masks avoid rebuilding two large hash tables on every cut.
            // Include the old layout's tail when capacity has been reduced.
            let mask_capacity = capacity.max(packed.capacity);
            let mut from_mask = vec![false; mask_capacity];
            let mut to_mask = vec![false; mask_capacity];
            for &slot in from {
                from_mask[slot] = true;
            }
            for &slot in to {
                to_mask[slot] = true;
            }
            let added = to
                .iter()
                .filter(|&&slot| !from_mask[slot])
                .map(|&slot| slot as u32)
                .collect();
            let removed = from
                .iter()
                .filter(|&&slot| !to_mask[slot])
                .map(|&slot| slot as u32)
                .collect();
            ActivationPlan {
                added,
                removed,
                clouds,
                pending,
                cursor: 0,
            }
        };
        let pinned_slots: Vec<_> = pinned
            .iter()
            .map(|s| packed.slots.to_slot[&s.key])
            .collect();
        let coarse_activation = (!compatible && !pinned_slots.is_empty()).then(|| {
            let mut counts = AHashMap::<u32, usize>::new();
            for s in &pinned {
                *counts.entry(s.key.cloud_id).or_default() += 1;
            }
            let clouds = states
                .iter()
                .map(|state| CloudState {
                    rendered_count: counts.get(&state.object_id).copied().unwrap_or(0),
                    ..state.clone()
                })
                .collect();
            make_activation(&[], &pinned_slots, clouds, true)
        });
        let before = needs_fallback.then(|| {
            let mut counts = AHashMap::<u32, usize>::new();
            for &slot in &fallback_slots {
                *counts
                    .entry(packed.slots.owners[slot].unwrap().cloud_id)
                    .or_default() += 1;
            }
            let clouds = states
                .iter()
                .map(|state| CloudState {
                    rendered_count: counts.get(&state.object_id).copied().unwrap_or(0),
                    ..state.clone()
                })
                .collect();
            make_activation(&old_active_slots, &fallback_slots, clouds, true)
        });
        let after =
            (!compatible || active_changed || needs_fallback || states_changed).then(|| {
                make_activation(
                    if compatible {
                        &fallback_slots
                    } else {
                        &pinned_slots
                    },
                    &target_slots,
                    states.clone(),
                    false,
                )
            });
        packed.active = target_active;
        packed.active_slots = target_slots;
        self.timings.prefetch_pending =
            cap.supports_partial_buffer_updates && packed.slots.to_slot.len() < capacity;
        self.timings.resident_gaussians = packed.slots.to_slot.len();
        self.timings.active_gaussians = count;
        self.timings.pinned_gaussians = pinned.len();
        packed.count = count;
        packed.compact = compact;
        packed.capacity = capacity;
        packed.degree = degree;
        packed.object_capacity = object_capacity;
        packed.clouds = states;
        self.timings.packing_ms = clock_ms() - packing_start;
        if compatible && changed.is_empty() && !states_changed && !active_changed {
            return Ok(Vec::new());
        }
        if !cap.supports_partial_buffer_updates {
            self.layout_version += 1;
            self.content_version += 1;
            return Ok(vec![Payload::BuffersReplaced {
                scene_revision: self.scene_revision,
                layout_version: self.layout_version,
                content_version: self.content_version,
                count,
                active_slots: packed
                    .active_slots
                    .iter()
                    .map(|&slot| slot as u32)
                    .collect(),
                capacity,
                object_capacity,
                sh_degree: degree,
                sh_format: "rgb8e8".into(),
                attributes: packed.attributes.clone(),
                clouds: packed.clouds.clone(),
            }]);
        }
        let bytes_per_slot: usize = packed
            .attributes
            .iter()
            .map(|a| a.elements_per_gaussian * 4)
            .sum();
        let max_bytes = self
            .config
            .streaming
            .as_ref()
            .and_then(|s| s.max_upload_bytes_per_update)
            .unwrap_or(1024 * 1024);
        let batch = (max_bytes / bytes_per_slot).max(1);
        let slots = if compatible {
            changed
        } else {
            let pinned_set: ahash::AHashSet<_> = pinned_slots.iter().copied().collect();
            let mut coarse = pinned_slots.clone();
            coarse.sort_unstable();
            let mut details: Vec<_> = packed
                .slots
                .to_slot
                .values()
                .copied()
                .filter(|slot| !pinned_set.contains(slot))
                .collect();
            details.sort_unstable();
            coarse.extend(details);
            coarse
        };
        self.pending_upload = Some(UploadPlan {
            slots,
            cursor: 0,
            batch,
            activation_batch: (max_bytes / 4).max(1),
            coarse_end: if compatible { 0 } else { pinned_slots.len() },
            coarse_activation,
            before,
            after,
        });
        if compatible {
            return Ok(Vec::new());
        }
        self.layout_version += 1;
        self.content_version += 1;
        Ok(vec![Payload::BuffersAllocated {
            scene_revision: self.scene_revision,
            layout_version: self.layout_version,
            content_version: self.content_version,
            capacity,
            object_capacity,
            sh_degree: degree,
            sh_format: "rgb8e8".into(),
            attributes: schema,
            clouds: packed
                .clouds
                .iter()
                .map(|s| CloudState {
                    rendered_count: 0,
                    ..s.clone()
                })
                .collect(),
        }])
    }
    fn prefetch(&mut self) -> Result<Vec<Payload>> {
        let Some(cap) = &self.capabilities else {
            return Ok(Vec::new());
        };
        let Some(packed) = &mut self.packed else {
            return Ok(Vec::new());
        };
        let free = packed.capacity - packed.slots.to_slot.len();
        self.timings.active_gaussians = packed.count;
        self.timings.resident_gaussians = packed.slots.to_slot.len();
        self.timings.pinned_gaussians = self
            .clouds
            .values()
            .filter_map(|c| c.coarse_cut.borrow().as_ref().map(|(_, _, v)| v.len()))
            .sum();
        if !cap.supports_partial_buffer_updates || free == 0 {
            return Ok(Vec::new());
        }
        let max_bytes = self
            .config
            .streaming
            .as_ref()
            .and_then(|s| s.max_upload_bytes_per_update)
            .unwrap_or(1024 * 1024);
        let bytes_per_slot: usize = packed
            .attributes
            .iter()
            .map(|a| a.elements_per_gaussian * 4)
            .sum();
        let batch = (max_bytes / bytes_per_slot).max(1).min(free);
        let mut slots = Vec::new();
        let mut scanned = 0;
        for cloud in self.clouds.values() {
            let Some(tree) = &cloud.tree else {
                continue;
            };
            let cursor = self
                .prefetch_cursors
                .entry((cloud.object_id, cloud.generation))
                .or_default();
            let mut selection = Vec::new();
            let mut targets = Vec::new();
            while *cursor < tree.len() && slots.len() < batch && scanned < batch * 4 {
                let node = *cursor;
                *cursor += 1;
                scanned += 1;
                let selected = cloud.selected(node);
                if packed.slots.to_slot.contains_key(&selected.key) {
                    continue;
                }
                let slot = packed.slots.fill_free(selected.key);
                packed.versions[slot] = selected.version;
                selection.push((node, selected.level));
                targets.push(slot);
                slots.push(slot);
            }
            if selection.is_empty() {
                continue;
            }
            let data = gpu_attributes_for(
                &tree.inner,
                &tree.extras,
                &selection,
                cloud.object_id,
                packed.degree,
                selection.len(),
                packed.compact,
            );
            for target in &mut packed.attributes {
                if let Some(a) = data.iter().find(|a| a.name == target.name) {
                    let w = target.elements_per_gaussian;
                    for (row, &slot) in targets.iter().enumerate() {
                        match (&mut target.data, &a.data) {
                            (Data::F32(t), Data::F32(v)) => t[slot * w..(slot + 1) * w]
                                .copy_from_slice(&v[row * w..(row + 1) * w]),
                            (Data::U32(t), Data::U32(v)) => t[slot * w..(slot + 1) * w]
                                .copy_from_slice(&v[row * w..(row + 1) * w]),
                            _ => unreachable!(),
                        }
                    }
                }
            }
        }
        self.timings.resident_gaussians = packed.slots.to_slot.len();
        self.timings.prefetch_pending = packed.slots.to_slot.len() < packed.capacity
            && self.clouds.values().any(|c| {
                c.tree.as_ref().is_some_and(|t| {
                    self.prefetch_cursors
                        .get(&(c.object_id, c.generation))
                        .copied()
                        .unwrap_or(0)
                        < t.len()
                })
            });
        if !slots.is_empty() {
            slots.sort_unstable();
            self.pending_upload = Some(UploadPlan {
                slots,
                cursor: 0,
                batch,
                activation_batch: (max_bytes / 4).max(1),
                coarse_end: 0,
                coarse_activation: None,
                before: None,
                after: None,
            });
        }
        Ok(Vec::new())
    }
    pub fn next_payload(&mut self) -> Option<Payload> {
        let plan = self.pending_upload.as_mut()?;
        let packed = self.packed.as_ref().unwrap();
        let activation = if plan.before.is_some() {
            plan.before.as_mut()
        } else if plan.coarse_activation.is_some() && plan.cursor >= plan.coarse_end {
            plan.coarse_activation.as_mut()
        } else if plan.cursor >= plan.slots.len() {
            plan.after.as_mut()
        } else {
            None
        };
        if let Some(a) = activation {
            let end = (a.cursor + plan.activation_batch).min(a.removed.len() + a.added.len());
            let removed =
                a.removed[a.cursor.min(a.removed.len())..end.min(a.removed.len())].to_vec();
            let added = a.added
                [a.cursor.saturating_sub(a.removed.len())..end.saturating_sub(a.removed.len())]
                .to_vec();
            a.cursor = end;
            let commit = end == a.removed.len() + a.added.len();
            let base = self.content_version;
            self.content_version += 1;
            let payload = Payload::BuffersActivated {
                scene_revision: self.scene_revision,
                layout_version: self.layout_version,
                base_content_version: base,
                content_version: self.content_version,
                added_slots: added,
                removed_slots: removed,
                commit,
                changed_clouds: a.clouds.clone(),
                mipmap_pending: a.pending || !commit,
            };
            if commit {
                if plan.before.is_some() {
                    plan.before = None;
                } else if plan.coarse_activation.is_some() {
                    plan.coarse_activation = None;
                } else {
                    plan.after = None;
                }
                if plan.cursor == plan.slots.len() && plan.after.is_none() {
                    self.pending_upload = None;
                }
            }
            return Some(payload);
        }
        let limit = if plan.coarse_activation.is_some() {
            plan.coarse_end
        } else {
            plan.slots.len()
        };
        let end = plan.cursor.saturating_add(plan.batch).min(limit);
        let group = &plan.slots[plan.cursor..end];
        let mut patches = Vec::new();
        let mut at = 0;
        while at < group.len() {
            let first = group[at];
            let mut end = at + 1;
            while end < group.len() && group[end] == group[end - 1] + 1 {
                end += 1;
            }
            let count = end - at;
            for a in &packed.attributes {
                let w = a.elements_per_gaussian;
                patches.push(Patch {
                    name: a.name.clone(),
                    first_slot: first,
                    slot_count: count,
                    data: a.data.slice(first * w, (first + count) * w),
                });
            }
            at = end;
        }
        plan.cursor = end;
        let pending = end < plan.slots.len() || plan.after.is_some();
        let base = self.content_version;
        self.content_version += 1;
        let payload = Payload::BuffersPatched {
            scene_revision: self.scene_revision,
            layout_version: self.layout_version,
            base_content_version: base,
            content_version: self.content_version,
            patches,
            changed_clouds: Vec::new(),
            mipmap_pending: pending,
        };
        if !pending {
            self.pending_upload = None;
        }
        Some(payload)
    }
}

fn source_bounds(source: &GsplatArray) -> [f32; 6] {
    (0..source.len())
        .map(|i| splat_bounds(&source.get(i)))
        .reduce(union)
        .unwrap_or([0.0; 6])
}
fn features(tree: &MipmapArray) -> Vec<(Vec3, f32)> {
    (0..tree.len())
        .map(|i| {
            let splat = tree.get(i);
            (Vec3::from(splat.center()), splat.feature_size())
        })
        .collect()
}
fn depths(tree: &MipmapArray) -> Vec<u32> {
    let mut result = vec![0; tree.len()];
    let mut stack = vec![0];
    while let Some(i) = stack.pop() {
        for c in tree.get_children(i) {
            result[c] = result[i] + 1;
            stack.push(c);
        }
    }
    result
}
fn empty_attributes(
    degree: usize,
    extras: &BTreeMap<String, ExtraAttribute>,
    count: usize,
) -> Vec<Attribute> {
    let mut result = Vec::new();
    for (name, width, format) in [
        ("means", 4, "f32"),
        ("scalesOpacity", 4, "f32"),
        ("rotations", 4, "f32"),
        ("shCoefficients", (degree + 1).pow(2), "u32"),
        ("mipmapLevel", 1, "u32"),
    ] {
        result.push(Attribute {
            name: name.into(),
            format: format.into(),
            elements_per_gaussian: width,
            data: if format == "f32" {
                Data::F32({
                    let mut values = vec![0.0; count * width];
                    if name == "means" {
                        for record in values.chunks_mut(4) {
                            record[3] = -1.0;
                        }
                    }
                    values
                })
            } else {
                Data::U32(vec![0; count * width])
            },
        });
    }
    for (name, a) in extras {
        result.push(Attribute {
            name: name.clone(),
            format: a.format.clone(),
            elements_per_gaussian: a.width,
            data: if a.format == "f32" {
                Data::F32(vec![0.0; count * a.width])
            } else {
                Data::U32(vec![0; count * a.width])
            },
        });
    }
    result
}
fn attributes_for(
    source: &GsplatArray,
    extras: &BTreeMap<String, ExtraAttribute>,
    selection: &[(usize, u32)],
    object: u32,
    degree: usize,
    capacity: usize,
) -> Vec<Attribute> {
    encode_attributes(source, extras, selection, object, degree, capacity, false)
}
fn encode_attributes(
    source: &GsplatArray,
    extras: &BTreeMap<String, ExtraAttribute>,
    selection: &[(usize, u32)],
    object: u32,
    degree: usize,
    capacity: usize,
    compact: bool,
) -> Vec<Attribute> {
    let mut attributes = gpu_empty_attributes(degree, extras, capacity, compact);
    for (slot, &(i, level)) in selection.iter().enumerate() {
        let s = source.get(i);
        let (scale, opacity) = render_scale_opacity(&s);
        let (shape, rotation) = if compact {
            let mut a = [0u32; 4];
            let mut b = [0u32; 4];
            spark_lib::splat_encode::encode_ext_splat(
                &mut a,
                &mut b,
                s.center().to_array(),
                opacity,
                s.rgb().to_array(),
                scale.to_array(),
                s.quaternion().normalize().to_array(),
            );
            (
                [
                    (b[1] >> 16) | ((b[2] & 0xffff) << 16),
                    (b[2] >> 16) | (a[3] << 16),
                ],
                b[3],
            )
        } else {
            ([0, 0], 0)
        };
        for a in &mut attributes {
            let w = a.elements_per_gaussian;
            let first = slot * w;
            match (&mut a.data, a.name.as_str()) {
                (Data::F32(v), "means") => {
                    v[first..first + 4].copy_from_slice(&[
                        s.center().x,
                        s.center().y,
                        s.center().z,
                        object as f32,
                    ]);
                }
                (Data::F32(v), "scalesOpacity") => {
                    v[first..first + 4].copy_from_slice(&[scale.x, scale.y, scale.z, opacity]);
                }
                (Data::F32(v), "rotations") => {
                    v[first..first + 4].copy_from_slice(&s.quaternion().normalize().to_array());
                }
                (Data::U32(v), "scalesOpacity") => v[first..first + 2].copy_from_slice(&shape),
                (Data::U32(v), "rotations") => v[first] = rotation,
                (Data::U32(v), "mipmapLevel") => v[first] = level,
                (Data::U32(v), "shCoefficients") => {
                    let dc = (s.rgb() - Vec3A::splat(0.5)) / SH_C0;
                    v[first] = pack_sh(dc.to_array());
                    let mut at = 1;
                    for band in 1..=source.max_sh_degree() {
                        let values = match band {
                            1 => source.get_sh1(i).to_vec(),
                            2 => source.get_sh2(i).to_vec(),
                            _ => source.get_sh3(i).to_vec(),
                        };
                        for rgb in values.chunks(3) {
                            v[first + at] = pack_sh([rgb[0], rgb[1], rgb[2]]);
                            at += 1;
                        }
                    }
                }
                (Data::F32(v), name) => {
                    if let Some(e) = extras.get(name) {
                        for c in 0..w {
                            v[first + c] = e.values[i * w + c] as f32;
                        }
                    }
                }
                (Data::U32(v), name) => {
                    if let Some(e) = extras.get(name) {
                        for c in 0..w {
                            v[first + c] = e.values[i * w + c] as u32;
                        }
                    }
                }
            }
        }
    }
    attributes
}
fn gpu_empty_attributes(
    degree: usize,
    extras: &BTreeMap<String, ExtraAttribute>,
    count: usize,
    compact: bool,
) -> Vec<Attribute> {
    let mut result = empty_attributes(degree, extras, if compact { 0 } else { count });
    if compact {
        for a in &mut result {
            match a.name.as_str() {
                "scalesOpacity" => {
                    a.format = "u32".into();
                    a.elements_per_gaussian = 2;
                }
                "rotations" => {
                    a.format = "u32".into();
                    a.elements_per_gaussian = 1;
                }
                _ => {}
            }
            a.data = if a.format == "f32" {
                Data::F32(vec![0.0; count * a.elements_per_gaussian])
            } else {
                Data::U32(vec![0; count * a.elements_per_gaussian])
            };
            if a.name == "means" {
                if let Data::F32(v) = &mut a.data {
                    for row in v.chunks_mut(4) {
                        row[3] = -1.0;
                    }
                }
            }
        }
    }
    result
}
fn gpu_attributes_for(
    source: &GsplatArray,
    extras: &BTreeMap<String, ExtraAttribute>,
    selection: &[(usize, u32)],
    object: u32,
    degree: usize,
    capacity: usize,
    compact: bool,
) -> Vec<Attribute> {
    encode_attributes(source, extras, selection, object, degree, capacity, compact)
}

fn pack_sh(rgb: [f32; 3]) -> u32 {
    let max = rgb.iter().map(|v| v.abs()).fold(0.0, f32::max);
    if max == 0.0 {
        return 0;
    }
    let exponent = max.log2().ceil().clamp(-126.0, 127.0) as i32;
    let multiplier = 127.0 / 2.0f32.powi(exponent);
    let b = rgb.map(|v| (v * multiplier + 0.5).floor().clamp(-127.0, 127.0) as i32 as u32 & 255);
    b[0] | b[1] << 8 | b[2] << 16 | ((exponent + 127) as u32) << 24
}

fn write(cloud: &mut Cloud, c: &WriteCommand) -> Result<()> {
    ensure!(
        c.first_gaussian
            .checked_add(c.gaussian_count)
            .map(|end| end <= cloud.source.len())
            .unwrap_or(false),
        "Attribute range exceeds source cloud"
    );
    ensure!(
        c.attribute != "mipmapLevel",
        "mipmapLevel is computed by the backend"
    );
    let mut source = cloud.source.clone_subset(0, cloud.source.len());
    let mut extras = cloud.extras.clone();
    let width = match c.attribute.as_str() {
        "means" | "scalesOpacity" | "rotations" => 4,
        "shCoefficients" => (source.max_sh_degree() + 1).pow(2),
        name => extras.get(name).context("Unknown attribute")?.width,
    };
    ensure!(
        c.data.len() == c.gaussian_count * width,
        "Attribute update length mismatch"
    );
    let format = if c.attribute == "shCoefficients" {
        "u32"
    } else {
        extras
            .get(&c.attribute)
            .map(|e| e.format.as_str())
            .unwrap_or("f32")
    };
    validate_values(format, &c.data)?;
    if let Some(e) = extras.get_mut(&c.attribute) {
        e.values[c.first_gaussian * width..(c.first_gaussian + c.gaussian_count) * width]
            .copy_from_slice(&c.data);
    } else {
        for offset in 0..c.gaussian_count {
            let i = c.first_gaussian + offset;
            let v = &c.data[offset * width..(offset + 1) * width];
            match c.attribute.as_str() {
                "means" => {
                    source
                        .get_mut(i)
                        .set_center(Vec3A::new(v[0] as f32, v[1] as f32, v[2] as f32))
                }
                "scalesOpacity" => {
                    ensure!(
                        v[..3].iter().all(|x| *x >= 0.0) && v[3] >= 0.0 && v[3] <= 1.0,
                        "Invalid scale or opacity"
                    );
                    source
                        .get_mut(i)
                        .set_scales(Vec3A::new(v[0] as f32, v[1] as f32, v[2] as f32));
                    source.get_mut(i).set_opacity(v[3] as f32);
                }
                "rotations" => {
                    let q =
                        glam::Quat::from_xyzw(v[0] as f32, v[1] as f32, v[2] as f32, v[3] as f32);
                    ensure!(q.length() > 0.0, "Zero quaternion");
                    source.get_mut(i).set_quaternion(q.normalize());
                }
                "shCoefficients" => {
                    let rgb: Vec<_> = v.iter().map(|v| unpack_sh(*v as u32)).collect();
                    source
                        .get_mut(i)
                        .set_rgb(Vec3A::from_array(rgb[0]) * SH_C0 + Vec3A::splat(0.5));
                    let flat: Vec<_> = rgb[1..].iter().flatten().copied().collect();
                    if source.max_sh_degree() >= 1 {
                        source.sh1[i].set_from_array(&flat[..9]);
                    }
                    if source.max_sh_degree() >= 2 {
                        source.sh2[i].set_from_array(&flat[9..24]);
                    }
                    if source.max_sh_degree() >= 3 {
                        source.sh3[i].set_from_array(&flat[24..45]);
                    }
                }
                _ => bail!("Unknown attribute"),
            }
        }
    }
    // Parent records in imported hierarchies cannot remain stale after edits.
    // Rebuild from original leaves rather than merging parents a second time.

    let (tree, bounds) = build_tree(&source, &extras, &cloud.mipmaps)?;
    cloud.bounds = source_bounds(&source);
    cloud.source = source;
    cloud.extras = extras;
    cloud.tree_depths = tree.as_ref().map(depths).unwrap_or_default();
    cloud.tree_features = tree.as_ref().map(features).unwrap_or_default();
    cloud.tree = tree;
    cloud.tree_bounds = bounds;
    Ok(())
}
fn unpack_sh(value: u32) -> [f32; 3] {
    let scale = 2.0f32.powi((value >> 24) as i32 - 127) / 127.0;
    std::array::from_fn(|i| ((value >> (i * 8)) as u8 as i8) as f32 * scale)
}

#[cfg(test)]
mod cut_tests {
    use super::*;
    use std::collections::BTreeSet;

    // Original cut algorithm as an independent reference for heap/frontier
    // optimization, including visibility, ties and insufficient budgets.
    fn reference(
        tree: &MipmapArray,
        budget: usize,
        score: impl Fn(usize) -> f32,
        include: impl Fn(usize) -> bool,
        limit: f32,
    ) -> Vec<usize> {
        if budget == 0 || tree.len() == 0 || !include(0) {
            return Vec::new();
        }
        let mut selected = BTreeSet::from([0]);
        let mut heap = BinaryHeap::from([(OrderedFloat(score(0)), std::cmp::Reverse(0))]);
        while let Some((OrderedFloat(size), std::cmp::Reverse(i))) = heap.pop() {
            if size <= limit {
                break;
            }
            let children: Vec<_> = tree
                .get_children(i)
                .into_iter()
                .filter(|&c| include(c))
                .collect();
            if tree.get_children(i).is_empty() || selected.len() - 1 + children.len() > budget {
                continue;
            }
            selected.remove(&i);
            for c in children {
                selected.insert(c);
                heap.push((OrderedFloat(score(c)), std::cmp::Reverse(c)));
            }
        }
        selected.into_iter().collect()
    }
    #[test]
    fn fast_frontier_matches_original_cut() {
        let mut source = GsplatArray::new();
        for i in 0..64 {
            source.push_splat(
                spark_lib::gsplat::Gsplat::new(
                    Vec3A::new((i % 8) as f32, (i / 8) as f32, 0.5),
                    1.,
                    Vec3A::splat(0.5),
                    Vec3A::splat(0.02),
                    glam::Quat::IDENTITY,
                ),
                None,
                None,
                None,
            );
        }
        let (tree, bounds) = build_tree(
            &source,
            &BTreeMap::new(),
            &MipmapConfig::Standard { snapshot: None },
        )
        .unwrap();
        let tree = tree.unwrap();
        // Seeded cuts charge pinned parents even after refinement. Every source
        // leaf has exactly one active ancestor, including offscreen branches.
        for coarse_budget in [1, 3, 8, 16] {
            let seeds = cut(
                &tree,
                coarse_budget,
                |i| tree.get(i).feature_size(),
                |_| true,
                -1.,
            );
            for budget in [seeds.len(), seeds.len() + 1, 25, 64, tree.len()] {
                if budget < seeds.len() {
                    continue;
                }
                for view_side in [0, 1, 2] {
                    let active = cut_from(
                        &tree,
                        &seeds,
                        budget,
                        |i| {
                            if i % 3 == view_side {
                                0.
                            } else {
                                tree.get(i).feature_size()
                            }
                        },
                        |_| true,
                        0.001,
                        true,
                    );
                    let resident: BTreeSet<_> = seeds.iter().chain(&active).copied().collect();
                    assert!(resident.len() <= budget);
                    let mut covered = vec![0; tree.len()];
                    let mut stack = active;
                    while let Some(i) = stack.pop() {
                        let children = tree.get_children(i);
                        if children.is_empty() {
                            covered[i] += 1;
                        } else {
                            stack.extend(children);
                        }
                    }
                    for (i, coverage) in covered.into_iter().enumerate() {
                        if tree.get_children(i).is_empty() {
                            assert_eq!(coverage, 1);
                        }
                    }
                }
            }
        }
        for x in [0., 2., 4., 20.] {
            let planes = frustum_planes(
                Mat4::from_scale(Vec3::new(0.3, 0.3, 1.))
                    * Mat4::from_translation(Vec3::new(-x, -3., 0.)),
            );
            for budget in [0, 1, 2, 3, 5, 9, 16, 35, 64] {
                for limit in [-1., 0.1, 1., 10.] {
                    let score = |i| tree.get(i).feature_size();
                    let include = |i| visible(&bounds[i], &planes);
                    assert_eq!(
                        cut(&tree, budget, score, include, limit),
                        reference(&tree, budget, score, include, limit)
                    );
                }
            }
        }
    }
}
