use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub default_mipmaps: Option<MipmapConfig>,
    pub streaming: Option<StreamingConfig>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamingConfig {
    pub max_upload_bytes_per_update: Option<usize>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum MipmapConfig {
    Standard { snapshot: Option<SnapshotConfig> },
    None,
}
impl Default for MipmapConfig {
    fn default() -> Self {
        Self::Standard { snapshot: None }
    }
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotConfig {
    pub max_leaves: usize,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadOptions {
    pub priority: Option<i64>,
    pub mipmaps: Option<MipmapConfig>,
    pub format: Option<String>,
    pub file_name: Option<String>,
    #[serde(default)]
    pub attributes: Vec<AttributeInit>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttributeInit {
    pub name: String,
    pub format: String,
    pub elements_per_gaussian: usize,
    pub source: AttributeSource,
    pub mipmap_aggregation: Option<String>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum AttributeSource {
    Fill { value: String },
    Buffer { data: Vec<f64> },
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum Command {
    #[serde(rename = "load-cloud-from-buffer")]
    Load(LoadCommand),
    #[serde(rename = "unload-cloud")]
    Unload(CloudCommand),
    #[serde(rename = "set-cloud-priority")]
    Priority(PriorityCommand),
    #[serde(rename = "set-cloud-mipmaps")]
    Mipmaps(MipmapsCommand),
    #[serde(rename = "set-cloud-transform")]
    Transform(TransformCommand),
    #[serde(rename = "write-attribute-range")]
    Write(WriteCommand),
    #[serde(rename = "set-camera")]
    Camera(CameraCommand),
    #[serde(rename = "set-frontend-capabilities")]
    Capabilities(CapabilitiesCommand),
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadCommand {
    pub cloud_id: String,
    #[serde(default)]
    pub options: Option<LoadOptions>,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudCommand {
    pub cloud_id: String,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriorityCommand {
    pub cloud_id: String,
    pub priority: i64,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MipmapsCommand {
    pub cloud_id: String,
    pub mipmaps: MipmapConfig,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformCommand {
    pub cloud_id: String,
    pub scene_revision: u32,
    pub world_matrix: Vec<f32>,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteCommand {
    pub cloud_id: String,
    pub attribute: String,
    pub first_gaussian: usize,
    pub gaussian_count: usize,
    pub data: Vec<f64>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CameraCommand {
    pub scene_revision: u32,
    pub world_matrix: Vec<f32>,
    pub projection_matrix: Vec<f32>,
    pub viewport_width: u32,
    pub viewport_height: u32,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Capabilities {
    pub max_storage_buffer_binding_size: usize,
    pub max_buffer_size: usize,
    pub max_storage_buffers_per_shader_stage: usize,
    pub supports_partial_buffer_updates: bool,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilitiesCommand {
    pub protocol_version: u32,
    pub capabilities: Capabilities,
    pub scene_revision: u32,
    pub camera_world_matrix: Vec<f32>,
    pub projection_matrix: Vec<f32>,
    pub viewport_width: u32,
    pub viewport_height: u32,
    pub cloud_transforms: Vec<CloudTransform>,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudTransform {
    pub cloud_id: String,
    pub world_matrix: Vec<f32>,
}

#[derive(Clone, Debug)]
pub enum Data {
    F32(Vec<f32>),
    U32(Vec<u32>),
}
impl Data {
    pub fn gather(&self, slots: &[usize], width: usize) -> Self {
        match self {
            Self::F32(v) => Self::F32(
                slots
                    .iter()
                    .flat_map(|&s| v[s * width..(s + 1) * width].iter().copied())
                    .collect(),
            ),
            Self::U32(v) => Self::U32(
                slots
                    .iter()
                    .flat_map(|&s| v[s * width..(s + 1) * width].iter().copied())
                    .collect(),
            ),
        }
    }
    pub fn row_same(&self, other: &Self, row: usize, slot: usize, width: usize) -> bool {
        match (self, other) {
            (Self::F32(a), Self::F32(b)) => {
                a[row * width..(row + 1) * width] == b[slot * width..(slot + 1) * width]
            }
            (Self::U32(a), Self::U32(b)) => {
                a[row * width..(row + 1) * width] == b[slot * width..(slot + 1) * width]
            }
            _ => false,
        }
    }
    pub fn slice(&self, start: usize, end: usize) -> Self {
        match self {
            Self::F32(v) => Self::F32(v[start..end].to_vec()),
            Self::U32(v) => Self::U32(v[start..end].to_vec()),
        }
    }
    pub fn range_same(&self, other: &Self, start: usize, end: usize) -> bool {
        match (self, other) {
            (Self::F32(a), Self::F32(b)) => a[start..end] == b[start..end],
            (Self::U32(a), Self::U32(b)) => a[start..end] == b[start..end],
            _ => false,
        }
    }
    pub fn same(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::F32(a), Self::F32(b)) => a == b,
            (Self::U32(a), Self::U32(b)) => a == b,
            _ => false,
        }
    }
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Attribute {
    pub name: String,
    pub format: String,
    pub elements_per_gaussian: usize,
    #[serde(skip)]
    pub data: Data,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Patch {
    pub name: String,
    pub first_slot: usize,
    pub slot_count: usize,
    #[serde(skip)]
    pub data: Data,
}
#[derive(Clone, Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CloudState {
    pub cloud_id: String,
    pub object_id: u32,
    pub rendered_count: usize,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub source_version: u32,
    pub snapshot_version: u32,
    pub root_index: u32,
    pub node_count: usize,
    pub leaf_count: usize,
    pub attributes: Vec<Attribute>,
    #[serde(skip)]
    pub node_bounds: Vec<f32>,
    #[serde(skip)]
    pub node_children: Vec<u32>,
}
#[derive(Debug, Serialize)]
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum Payload {
    CapabilitiesAccepted {
        protocol_version: u32,
    },
    CloudLoaded {
        cloud_id: String,
        object_id: u32,
        source_count: usize,
        source_version: u32,
        sh_degree: usize,
        bounds: [f32; 6],
        mipmap_snapshot: Option<Snapshot>,
    },
    CloudUnloaded {
        cloud_id: String,
    },
    MipmapSnapshotReplaced {
        cloud_id: String,
        source_version: u32,
        snapshot_version: u32,
        bounds: [f32; 6],
        snapshot: Option<Snapshot>,
    },
    BuffersAllocated {
        scene_revision: u32,
        layout_version: u32,
        content_version: u32,
        capacity: usize,
        object_capacity: u32,
        sh_degree: usize,
        sh_format: String,
        attributes: Vec<Attribute>,
        clouds: Vec<CloudState>,
    },
    BuffersReplaced {
        scene_revision: u32,
        layout_version: u32,
        content_version: u32,
        count: usize,
        capacity: usize,
        object_capacity: u32,
        sh_degree: usize,
        sh_format: String,
        attributes: Vec<Attribute>,
        clouds: Vec<CloudState>,
    },
    BuffersPatched {
        scene_revision: u32,
        layout_version: u32,
        base_content_version: u32,
        content_version: u32,
        patches: Vec<Patch>,
        changed_clouds: Vec<CloudState>,
        mipmap_pending: bool,
    },
}
