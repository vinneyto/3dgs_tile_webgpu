//! Native Spark decoding and multi-instance LOD traversal.
//!
//! Decoding/merging use the repository's pinned, unmodified Spark library.
//! Selection ports the best-first traversal and radial/foveated score from
//! Spark's `rust/spark-rs/src/lod_tree.rs`, without JavaScript/WASM state.
mod ascii_ply;

use anyhow::{Context, Result, ensure};
use bytemuck::{Pod, Zeroable};
use glam::{Mat4, Quat, Vec3, Vec3A};
use spark_lib::{
    decoder::{ChunkReceiver, MultiDecoder, SplatFileType},
    gsplat::{Gsplat, GsplatArray},
    tiny_lod::compute_lod_tree,
    tsplat::{Tsplat, TsplatArray},
};
use std::{
    cmp::Ordering,
    collections::BinaryHeap,
    fs::File,
    io::{Read, Seek},
    path::Path,
    sync::Arc,
};

/// GPU source row: linear size, xyzw quaternion, RGB and SH in cloud-local space.
/// RGB is decoded Spark DC (already includes the 0.5 bias). Higher bands are
/// coefficient-major RGB triples, exactly as returned by Spark.
#[repr(C)]
#[derive(Clone, Copy, Debug, Pod, Zeroable)]
pub struct SourceSplat {
    pub center_opacity: [f32; 4],
    pub scale: [f32; 4],
    pub rotation: [f32; 4],
    pub sh: [f32; 48],
}

pub struct GaussianBuffer {
    splats: GsplatArray,
    source_count: usize,
    pub center: Vec3,
    pub radius: f32,
}

impl GaussianBuffer {
    /// Feed a file to Spark in 1 MiB chunks, then build its Gaussian mipmap tree.
    /// Work belongs on a loader thread; `progress` is called with stage messages.
    pub fn load(path: &Path, progress: impl Fn(&str)) -> Result<Arc<Self>> {
        progress("Decoding with Spark");
        let mut file = File::open(path).with_context(|| format!("Opening {}", path.display()))?;
        let mut prefix = vec![0; 65536];
        let read = file.read(&mut prefix)?;
        prefix.truncate(read);
        file.rewind()?;
        let mut decoder = MultiDecoder::new(
            GsplatArray::new(),
            SplatFileType::from_pathname(&path.to_string_lossy()),
            Some(&path.to_string_lossy()),
        );
        // Spark's PLY decoder is binary. Keep this project's ASCII support.
        if prefix.windows(16).any(|w| w == b"format ascii 1.0") {
            let mut bytes = Vec::new();
            file.read_to_end(&mut bytes)?;
            let normalized = ascii_ply::normalize(&bytes)?.context("Invalid ASCII PLY")?;
            decoder.push(&normalized)?;
        } else {
            let mut bytes = vec![0; 1024 * 1024];
            loop {
                let n = file.read(&mut bytes)?;
                if n == 0 {
                    break;
                }
                decoder.push(&bytes[..n])?;
            }
        }
        decoder.finish()?;
        Self::from_splats(decoder.into_splats(), progress)
    }

    /// In-memory path for integrations that already have a Gaussian buffer.
    pub fn from_records(records: &[SourceSplat]) -> Result<Arc<Self>> {
        use spark_lib::decoder::SplatReceiver;
        let mut splats = GsplatArray::new_capacity(records.len(), 3);
        splats.init_splats(&spark_lib::decoder::SplatInit {
            num_splats: records.len(),
            max_sh_degree: 3,
            lod_tree: false,
        })?;
        for (i, row) in records.iter().enumerate() {
            let s = Gsplat::new(
                Vec3A::from_slice(&row.center_opacity[..3]),
                row.center_opacity[3],
                Vec3A::from_slice(&row.sh[..3]),
                Vec3A::from_slice(&row.scale[..3]),
                Quat::from_array(row.rotation),
            );
            splats.splats[i] = s;
            splats.set_sh(i, 1, &row.sh[3..12], &row.sh[12..27], &row.sh[27..48]);
        }
        Self::from_splats(splats, |_| {})
    }

    fn from_splats(mut splats: GsplatArray, progress: impl Fn(&str)) -> Result<Arc<Self>> {
        splats.retain(|s| {
            s.center().is_finite()
                && s.scales().is_finite()
                && s.max_scale() > 0.
                && s.opacity().is_finite()
                && s.opacity() > 0.
                && s.quaternion().is_finite()
                && s.quaternion().length_squared() > 1e-6
        });
        ensure!(splats.len() > 0, "No valid Gaussians in the input");
        let source_count = splats.len();
        let mut low = Vec3::splat(f32::INFINITY);
        let mut high = -low;
        for i in 0..splats.len() {
            let s = splats.get(i);
            low = low.min(s.center().into());
            high = high.max(s.center().into());
        }
        let center = (low + high) * 0.5;
        let radius = (high - low).length().max(0.01) * 0.5;
        // Existing LOD files already carry child links. Do not merge twice.
        if !splats.has_children() {
            progress("Building Spark Tiny LOD tree");
            compute_lod_tree(&mut splats, 1.5, false, |_| {});
        }
        progress("Ready");
        Ok(Arc::new(Self {
            splats,
            source_count,
            center,
            radius,
        }))
    }

    pub fn source_count(&self) -> usize {
        self.source_count
    }
    pub fn node_count(&self) -> usize {
        self.splats.len()
    }
    pub fn children(&self, node: usize) -> Vec<usize> {
        self.splats.get_children(node).into_vec()
    }
    pub fn record(&self, node: usize) -> SourceSplat {
        let s = self.splats.get(node);
        let rgb = s.rgb();
        let mut sh = [0.; 48];
        sh[..3].copy_from_slice(&rgb.to_array());
        if self.splats.max_sh_degree() >= 1 {
            sh[3..12].copy_from_slice(&self.splats.get_sh1(node));
        }
        if self.splats.max_sh_degree() >= 2 {
            sh[12..27].copy_from_slice(&self.splats.get_sh2(node));
        }
        if self.splats.max_sh_degree() >= 3 {
            sh[27..48].copy_from_slice(&self.splats.get_sh3(node));
        }
        SourceSplat {
            center_opacity: [s.center().x, s.center().y, s.center().z, s.opacity()],
            scale: [s.scales().x, s.scales().y, s.scales().z, 0.],
            rotation: s.quaternion().normalize().to_array(),
            sh,
        }
    }
}

/// One Bevy entity may instance a shared source buffer with its own transform.
pub struct CloudView<'a> {
    pub buffer: &'a GaussianBuffer,
    pub world_from_local: Mat4,
    pub lod_scale: f32,
}

#[derive(Clone, Copy)]
struct Candidate {
    score: f32,
    cloud: usize,
    node: usize,
}
impl PartialEq for Candidate {
    fn eq(&self, r: &Self) -> bool {
        self.cmp(r) == Ordering::Equal
    }
}
impl Eq for Candidate {}
impl PartialOrd for Candidate {
    fn partial_cmp(&self, r: &Self) -> Option<Ordering> {
        Some(self.cmp(r))
    }
}
impl Ord for Candidate {
    fn cmp(&self, r: &Self) -> Ordering {
        self.score
            .total_cmp(&r.score)
            .then(self.cloud.cmp(&r.cloud))
            .then(self.node.cmp(&r.node))
    }
}

/// Global budget; a parent is replaced only when all children fit. This keeps
/// complete cuts and shares detail between clouds, as Spark does.
pub fn select_lod(
    clouds: &[CloudView<'_>],
    camera: Vec3,
    forward: Vec3,
    focal_pixels: f32,
    pixel_limit: f32,
    budget: usize,
) -> Result<Vec<Vec<usize>>> {
    ensure!(
        budget >= clouds.len(),
        "LOD budget must fit at least one root per cloud"
    );
    ensure!(
        focal_pixels.is_finite()
            && focal_pixels > 0.
            && pixel_limit.is_finite()
            && pixel_limit > 0.,
        "Invalid LOD projection parameters"
    );
    let mut frontier = BinaryHeap::new();
    let mut output = vec![Vec::new(); clouds.len()];
    let score = |cloud: usize, node: usize| {
        let c = &clouds[cloud];
        let s = c.buffer.splats.get(node);
        let delta = c.world_from_local.transform_point3(s.center().into()) - camera;
        let distance = delta.length().max(1e-6);
        let dot = delta.dot(forward) / distance;
        let weight = if dot <= 0. {
            0.05
        } else {
            0.05 + 0.95 * (dot / 0.7).min(1.)
        };
        // Frobenius norm is a conservative singular-value bound for affine
        // transforms (including shear from nested non-uniform scales).
        let m = c.world_from_local;
        let stretch = (m.x_axis.truncate().length_squared()
            + m.y_axis.truncate().length_squared()
            + m.z_axis.truncate().length_squared())
        .sqrt();
        s.feature_size() * stretch * focal_pixels * c.lod_scale * weight / distance
    };
    for (cloud, _) in clouds.iter().enumerate() {
        frontier.push(Candidate {
            score: score(cloud, 0),
            cloud,
            node: 0,
        });
    }
    let mut count = clouds.len();
    while let Some(c) = frontier.pop() {
        let children = clouds[c.cloud].buffer.splats.get_children(c.node);
        if c.score <= pixel_limit || children.is_empty() || count + children.len() - 1 > budget {
            output[c.cloud].push(c.node);
            continue;
        }
        count += children.len() - 1;
        for node in children {
            frontier.push(Candidate {
                score: score(c.cloud, node),
                cloud: c.cloud,
                node,
            });
        }
    }
    for cut in &mut output {
        cut.sort_unstable();
    }
    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn buffer() -> Arc<GaussianBuffer> {
        let mut rows = vec![SourceSplat::zeroed(); 64];
        for (i, r) in rows.iter_mut().enumerate() {
            r.center_opacity = [(i % 8) as f32 * 0.1, (i / 8) as f32 * 0.1, 0., 0.8];
            r.scale = [0.04, 0.02, 0.01, 0.];
            r.rotation = [0., 0., 0., 1.];
            r.sh[..3].copy_from_slice(&[1., 0.2, 0.1]);
        }
        GaussianBuffer::from_records(&rows).unwrap()
    }
    fn leaves(b: &GaussianBuffer, node: usize, out: &mut Vec<usize>) {
        let children = b.children(node);
        if children.is_empty() {
            out.push(node);
        } else {
            for c in children {
                leaves(b, c, out);
            }
        }
    }
    #[test]
    fn spark_cut_is_complete_disjoint_budgeted_and_distance_sensitive() {
        let b = buffer();
        let clouds = [CloudView {
            buffer: &b,
            world_from_local: Mat4::IDENTITY,
            lod_scale: 1.,
        }];
        for budget in [1, 4, 16, 64, 1024] {
            let cut =
                select_lod(&clouds, Vec3::new(0., 0., 2.), -Vec3::Z, 600., 1., budget).unwrap();
            assert!(cut[0].len() <= budget);
            let mut all = Vec::new();
            for n in &cut[0] {
                leaves(&b, *n, &mut all);
            }
            all.sort_unstable();
            assert_eq!(all.len(), 64);
            all.dedup();
            assert_eq!(all.len(), 64);
        }
        let near = select_lod(&clouds, Vec3::new(0., 0., 2.), -Vec3::Z, 600., 1., 1024).unwrap();
        let far = select_lod(&clouds, Vec3::new(0., 0., 2000.), -Vec3::Z, 600., 1., 1024).unwrap();
        assert!(near[0].len() > far[0].len());
    }
    #[test]
    fn binary_and_ascii_ply_decode_through_spark_and_reject_truncation() {
        let base = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../tests/fixtures");
        for name in ["rgb-ascii.ply", "rgb-binary.ply"] {
            let b = GaussianBuffer::load(&base.join(name), |_| {}).unwrap();
            assert_eq!(b.source_count(), 3);
            assert!(b.node_count() > 3);
            let mut leaves_out = Vec::new();
            leaves(&b, 0, &mut leaves_out);
            assert_eq!(leaves_out.len(), 3);
            for node in leaves_out {
                assert!(b.record(node).center_opacity[3] > 0.8);
            }
        }
        let bytes = std::fs::read(base.join("rgb-binary.ply")).unwrap();
        let mut decoder = MultiDecoder::new(GsplatArray::new(), Some(SplatFileType::PLY), None);
        decoder.push(&bytes[..bytes.len() - 4]).unwrap();
        assert!(decoder.finish().is_err());
        assert!(GaussianBuffer::from_records(&[]).is_err());
    }
    #[test]
    fn instances_share_budget_and_keep_one_root_each() {
        let b = buffer();
        let clouds = [
            CloudView {
                buffer: &b,
                world_from_local: Mat4::IDENTITY,
                lod_scale: 1.,
            },
            CloudView {
                buffer: &b,
                world_from_local: Mat4::from_translation(Vec3::X * 10.),
                lod_scale: 1.,
            },
        ];
        assert!(select_lod(&clouds, Vec3::Z, -Vec3::Z, 600., 1., 1).is_err());
        let cuts = select_lod(&clouds, Vec3::Z, -Vec3::Z, 600., 1., 17).unwrap();
        assert!(cuts.iter().all(|c| !c.is_empty()));
        assert!(cuts.iter().map(Vec::len).sum::<usize>() <= 17);
    }
}
