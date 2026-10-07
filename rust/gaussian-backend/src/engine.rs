use crate::{
    model::{render_scale_opacity, splat_bounds, union, ExtraAttribute, MipmapArray},
    protocol::*,
    slot_mapping::{GaussianKey, SlotMapping},
};
use anyhow::{bail, ensure, Context, Result};
use glam::{Mat4, Vec3, Vec3A};
use ordered_float::OrderedFloat;
use spark_lib::{
    decoder::{ChunkReceiver, MultiDecoder, SplatFileType},
    gsplat::GsplatArray,
    tiny_lod,
    tsplat::{Tsplat, TsplatArray, TsplatMut},
};
use std::collections::{BTreeMap, BTreeSet, BinaryHeap, HashMap};

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
    bounds: [f32; 6],
    world: Mat4,
    source_version: u32,
    snapshot_version: u32,
    generation: u32,
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

fn visible(bounds: &[f32; 6], clip: Mat4) -> bool {
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
    let rows = clip.transpose();
    // WebGPU clip depth is 0..w; Three's WebGPU projection follows that range.
    let planes = [
        rows.w_axis + rows.x_axis,
        rows.w_axis - rows.x_axis,
        rows.w_axis + rows.y_axis,
        rows.w_axis - rows.y_axis,
        rows.z_axis,
        rows.w_axis - rows.z_axis,
    ];
    planes
        .iter()
        .all(|p| p.truncate().dot(center) + p.w + p.truncate().abs().dot(extent) >= 0.0)
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
    if budget == 0 || tree.len() == 0 || !include(0) {
        return Vec::new();
    }
    let mut selected = BTreeSet::from([0]);
    let mut heap = BinaryHeap::from([(OrderedFloat(score(0)), std::cmp::Reverse(0usize))]);
    while let Some((OrderedFloat(size), std::cmp::Reverse(i))) = heap.pop() {
        if size <= pixel_limit {
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

impl Cloud {
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
        let leaves: BTreeSet<_> = frontier.iter().copied().collect();
        let mut nodes = vec![0];
        let mut children = Vec::new();
        let mut cursor = 0;
        while cursor < nodes.len() {
            let i = nodes[cursor];
            if leaves.contains(&i) {
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
            leaf_count: leaves.len(),
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
    capacity: usize,
    count: usize,
    degree: usize,
    object_capacity: u32,
    attributes: Vec<Attribute>,
    clouds: Vec<CloudState>,
    slots: SlotMapping,
    versions: Vec<u32>,
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
        })
    }
    pub fn apply(&mut self, command: Command, bytes: &[u8]) -> Result<Vec<Payload>> {
        let mut output = Vec::new();
        match command {
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
                    tree,
                    tree_bounds,
                    bounds,
                    world: Mat4::IDENTITY,
                    source_version: 1,
                    snapshot_version: 1,
                    generation: 1,
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
                } else if cloud.tree.is_none() {
                    let (tree, bounds) = build_tree(&cloud.source, &cloud.extras, &c.mipmaps)?;
                    cloud.tree_depths = tree.as_ref().map(depths).unwrap_or_default();
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
            .chain([16, (degree + 1).pow(2) * 4])
            .max()
            .unwrap();
        let budget = limit / max_width;
        ensure!(budget > 0, "Frontend buffer limits are too small");
        Ok((degree, extra, budget))
    }
    fn select(&self, budget: usize) -> (Vec<SelectedGaussian>, Vec<CloudState>) {
        let mut ordered: Vec<_> = self.clouds.iter().collect();
        ordered.sort_by_key(|(_, c)| (c.priority, c.object_id));
        let mut remaining = budget;
        let mut selections = Vec::new();
        let mut states = Vec::new();
        for (id, cloud) in ordered {
            let indices = if matches!(cloud.mipmaps, MipmapConfig::None) {
                (0..cloud.source.len())
                    .filter(|&i| {
                        !cloud.source.has_children() || cloud.source.children[i].is_empty()
                    })
                    .take(remaining)
                    .collect()
            } else if let Some(tree) = &cloud.tree {
                let view = self.camera_world.inverse() * cloud.world;
                let clip = self.projection * view;
                let scale = view
                    .x_axis
                    .truncate()
                    .length()
                    .max(view.y_axis.truncate().length())
                    .max(view.z_axis.truncate().length());
                let pixels = self.projection.y_axis.y.abs() * self.viewport[1] as f32 * 0.5;
                cut(
                    tree,
                    remaining,
                    |i| {
                        let s = tree.get(i);
                        let center = view.transform_point3(Vec3::from(s.center()));
                        let size = s.feature_size() * scale;
                        if self.projection.w_axis.w == 0.0 {
                            size * pixels / (-center.z - size * 0.5).max(1e-6)
                        } else {
                            size * pixels
                        }
                    },
                    |i| visible(&cloud.tree_bounds[i], clip),
                    1.0,
                )
            } else {
                Vec::new()
            };
            remaining -= indices.len();
            states.push(CloudState {
                cloud_id: id.clone(),
                object_id: cloud.object_id,
                rendered_count: indices.len(),
            });
            selections.extend(indices.into_iter().map(|node_id| SelectedGaussian {
                key: GaussianKey {
                    cloud_id: cloud.object_id,
                    generation: cloud.generation,
                    node_id,
                },
                version: cloud.source_version,
                level: cloud.tree_depths.get(node_id).copied().unwrap_or(0),
            }));
        }
        (selections, states)
    }
    fn pack(&mut self) -> Result<Vec<Payload>> {
        let cap = self.capabilities.as_ref().unwrap();
        let (degree, extra, budget) = self.validate_layout(cap, None)?;
        let (selected, states) = self.select(budget);
        let count = selected.len();
        let capacity = count
            .max(
                self.packed
                    .as_ref()
                    .map(|p| p.capacity.min(budget))
                    .unwrap_or(0),
            )
            .max(1);
        let object_capacity = self
            .clouds
            .values()
            .map(|c| c.object_id + 1)
            .max()
            .unwrap_or(0);
        let schema = empty_attributes(degree, &extra, 0);
        let compatible = self
            .packed
            .as_ref()
            .map(|old| {
                old.capacity == capacity
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
            capacity,
            count: 0,
            degree,
            object_capacity,
            attributes: Vec::new(),
            clouds: Vec::new(),
            slots: SlotMapping::default(),
            versions: Vec::new(),
        });
        let keys: Vec<_> = selected.iter().map(|s| s.key).collect();
        let changes = packed.slots.reconcile(capacity, &keys);
        packed.versions.resize(capacity, 0);
        for &slot in &changes.assigned {
            packed.versions[slot] = 0;
        }
        let states_changed = packed.clouds != states;
        if !compatible {
            packed.attributes = empty_attributes(degree, &extra, capacity);
            packed.versions.fill(0);
        }
        let dirty: Vec<_> = selected
            .iter()
            .filter_map(|s| {
                let slot = packed.slots.to_slot[&s.key];
                (packed.versions[slot] != s.version).then_some((s, slot))
            })
            .collect();
        // Capture only candidate slots. Retained, unchanged Gaussians are never
        // repacked, copied or byte-compared on camera updates.
        let mut previous = BTreeMap::new();
        if compatible {
            for slot in changes
                .cleared
                .iter()
                .copied()
                .chain(dirty.iter().map(|(_, slot)| *slot))
            {
                previous.entry(slot).or_insert_with(|| {
                    packed
                        .attributes
                        .iter()
                        .map(|a| {
                            let w = a.elements_per_gaussian;
                            a.data.slice(slot * w, (slot + 1) * w)
                        })
                        .collect::<Vec<_>>()
                });
            }
        }
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
            let data = attributes_for(source, extras, &selection, id, degree, entries.len());
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
        let changed: Vec<_> = previous
            .into_iter()
            .filter_map(|(slot, values)| {
                values
                    .iter()
                    .zip(&packed.attributes)
                    .any(|(old, a)| {
                        let w = a.elements_per_gaussian;
                        match (old, &a.data) {
                            (Data::F32(o), Data::F32(n)) => o[..] != n[slot * w..(slot + 1) * w],
                            (Data::U32(o), Data::U32(n)) => o[..] != n[slot * w..(slot + 1) * w],
                            _ => true,
                        }
                    })
                    .then_some(slot)
            })
            .collect();
        packed.count = count;
        packed.capacity = capacity;
        packed.degree = degree;
        packed.object_capacity = object_capacity;
        packed.clouds = states;
        if compatible && changed.is_empty() && !states_changed {
            return Ok(Vec::new());
        }
        if !compatible || !cap.supports_partial_buffer_updates {
            self.layout_version += 1;
            self.content_version += 1;
            return Ok(vec![Payload::BuffersReplaced {
                scene_revision: self.scene_revision,
                layout_version: self.layout_version,
                content_version: self.content_version,
                count,
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
        // A metadata-only change needs a versioned response, without fake data.
        let groups: Vec<&[usize]> = if changed.is_empty() {
            vec![&[]]
        } else {
            changed.chunks(batch).collect()
        };
        let mut out = Vec::new();
        for (i, group) in groups.iter().enumerate() {
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
            let base = self.content_version;
            self.content_version += 1;
            out.push(Payload::BuffersPatched {
                scene_revision: self.scene_revision,
                layout_version: self.layout_version,
                base_content_version: base,
                content_version: self.content_version,
                patches,
                changed_clouds: packed.clouds.clone(),
                mipmap_pending: i + 1 < groups.len(),
            });
        }
        Ok(out)
    }
}

fn source_bounds(source: &GsplatArray) -> [f32; 6] {
    (0..source.len())
        .map(|i| splat_bounds(&source.get(i)))
        .reduce(union)
        .unwrap_or([0.0; 6])
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
    let mut attributes = empty_attributes(degree, extras, capacity);
    for (slot, &(i, level)) in selection.iter().enumerate() {
        let s = source.get(i);
        let (scale, opacity) = render_scale_opacity(&s);
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
    cloud.tree = tree;
    cloud.tree_bounds = bounds;
    Ok(())
}
fn unpack_sh(value: u32) -> [f32; 3] {
    let scale = 2.0f32.powi((value >> 24) as i32 - 127) / 127.0;
    std::array::from_fn(|i| ((value >> (i * 8)) as u8 as i8) as f32 * scale)
}
