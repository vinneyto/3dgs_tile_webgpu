use brush_renderer::Camera;
use glam::Mat4;
use spark_lod::GaussianBuffer;
use std::sync::Arc;

pub(crate) struct CloudKey {
    pub id: u64,
    pub source: Arc<GaussianBuffer>,
    pub transform: Mat4,
    pub opacity: f32,
    pub scale: f32,
    pub lod_scale: f32,
}
impl PartialEq for CloudKey {
    fn eq(&self, b: &Self) -> bool {
        self.id == b.id
            && Arc::ptr_eq(&self.source, &b.source)
            && self.transform == b.transform
            && self.opacity == b.opacity
            && self.scale == b.scale
            && self.lod_scale == b.lod_scale
    }
}
#[derive(PartialEq)]
pub(crate) struct SelectionKey {
    pub camera: Camera,
    pub width: u32,
    pub height: u32,
    pub budget: usize,
    pub pixel_limit: f32,
    pub clouds: Vec<CloudKey>,
}
