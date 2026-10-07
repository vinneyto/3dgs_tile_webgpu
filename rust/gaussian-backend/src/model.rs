use std::collections::BTreeMap;

use glam::Vec3A;
use smallvec::SmallVec;
use spark_lib::{
    gsplat::{Gsplat, GsplatArray},
    tsplat::{apply_swaps, compute_swaps, Tsplat, TsplatArray},
};

#[derive(Clone, Debug)]
pub struct ExtraAttribute {
    pub format: String,
    pub width: usize,
    pub aggregation: String,
    pub values: Vec<f64>,
}

/// Keep source identities and custom attributes aligned with Spark's sorting,
/// merging and final breadth-first permutation.
pub struct MipmapArray {
    pub inner: GsplatArray,
    pub source_ids: Vec<Option<usize>>,
    pub extras: BTreeMap<String, ExtraAttribute>,
}

impl MipmapArray {
    pub fn from_source(source: &GsplatArray, extras: &BTreeMap<String, ExtraAttribute>) -> Self {
        Self {
            inner: source.clone_subset(0, source.len()),
            source_ids: (0..source.len()).map(Some).collect(),
            extras: extras.clone(),
        }
    }

    fn keep(&mut self, keep: &[bool]) {
        let mut i = 0;
        self.source_ids.retain(|_| {
            let yes = keep[i];
            i += 1;
            yes
        });
        for extra in self.extras.values_mut() {
            extra.values = extra
                .values
                .chunks(extra.width)
                .zip(keep)
                .filter(|(_, yes)| **yes)
                .flat_map(|(v, _)| v.iter().copied())
                .collect();
        }
    }
}

impl TsplatArray for MipmapArray {
    type Splat<'a> = &'a Gsplat;
    type SplatMut<'a> = &'a mut Gsplat;
    fn new_capacity(capacity: usize, degree: usize) -> Self {
        Self {
            inner: GsplatArray::new_capacity(capacity, degree),
            source_ids: Vec::new(),
            extras: BTreeMap::new(),
        }
    }
    fn max_sh_degree(&self) -> usize {
        self.inner.max_sh_degree()
    }
    fn clamp_sh_degree(&mut self, degree: usize) {
        self.inner.clamp_sh_degree(degree);
    }
    fn len(&self) -> usize {
        self.inner.len()
    }
    fn get(&self, i: usize) -> &Gsplat {
        self.inner.get(i)
    }
    fn get_mut(&mut self, i: usize) -> &mut Gsplat {
        self.inner.get_mut(i)
    }
    fn prepare_children(&mut self) {
        self.inner.prepare_children();
    }
    fn has_children(&self) -> bool {
        self.inner.has_children()
    }
    fn new_merged(&mut self, indices: &[usize], filter: f32) -> usize {
        let weights: Vec<_> = indices
            .iter()
            .map(|&i| {
                let s = self.get(i);
                (s.area() * s.opacity()) as f64
            })
            .collect();
        let total = weights.iter().sum::<f64>().max(1e-30);
        for extra in self.extras.values_mut() {
            let mut result = Vec::with_capacity(extra.width);
            for component in 0..extra.width {
                let values = indices
                    .iter()
                    .map(|&i| extra.values[i * extra.width + component]);
                let value = match extra.aggregation.as_str() {
                    "first" => extra.values[indices[0] * extra.width + component],
                    "min" => values.fold(f64::INFINITY, f64::min),
                    "max" => values.fold(f64::NEG_INFINITY, f64::max),
                    _ => values.zip(&weights).map(|(v, w)| v * w / total).sum(),
                };
                result.push(if extra.format == "u32" {
                    value.round()
                } else {
                    value
                });
            }
            extra.values.extend(result);
        }
        self.source_ids.push(None);
        self.inner.new_merged(indices, filter)
    }
    fn set_children(&mut self, p: usize, children: &[usize]) {
        self.inner.set_children(p, children);
    }
    fn get_children(&self, p: usize) -> SmallVec<[usize; 8]> {
        self.inner.get_children(p)
    }
    fn get_child_count_start(&self, i: usize) -> (usize, usize) {
        self.inner.get_child_count_start(i)
    }
    fn clear_children(&mut self) {
        self.inner.clear_children();
    }
    fn get_sh1(&self, i: usize) -> [f32; 9] {
        self.inner.get_sh1(i)
    }
    fn get_sh2(&self, i: usize) -> [f32; 15] {
        self.inner.get_sh2(i)
    }
    fn get_sh3(&self, i: usize) -> [f32; 21] {
        self.inner.get_sh3(i)
    }
    fn similarity(&self, a: usize, b: usize) -> f32 {
        self.inner.similarity(a, b)
    }
    fn retain<F: FnMut(&mut Gsplat) -> bool>(&mut self, mut f: F) {
        let keep: Vec<_> = self.inner.splats.iter_mut().map(&mut f).collect();
        let mut i = 0;
        self.inner.retain(|_| {
            let yes = keep[i];
            i += 1;
            yes
        });
        self.keep(&keep);
    }
    fn retain_children<F: FnMut(&mut Gsplat, &[usize]) -> bool>(&mut self, mut f: F) {
        let keep: Vec<_> = self
            .inner
            .splats
            .iter_mut()
            .enumerate()
            .map(|(i, s)| {
                f(
                    s,
                    self.inner
                        .children
                        .get(i)
                        .map(|v| v.as_slice())
                        .unwrap_or(&[]),
                )
            })
            .collect();
        let mut i = 0;
        self.inner.retain(|_| {
            let yes = keep[i];
            i += 1;
            yes
        });
        self.keep(&keep);
    }
    fn permute(&mut self, map: &[usize]) {
        let swaps = compute_swaps(map);
        apply_swaps(&mut self.source_ids, &swaps);
        for extra in self.extras.values_mut() {
            for &(a, b) in &swaps {
                for c in 0..extra.width {
                    extra.values.swap(a * extra.width + c, b * extra.width + c);
                }
            }
        }
        self.inner.permute(map);
    }
    fn truncate(&mut self, count: usize) {
        self.inner.truncate(count);
        self.source_ids.truncate(count);
        for extra in self.extras.values_mut() {
            extra.values.truncate(count * extra.width);
        }
    }
    fn new_from_index_map(&mut self, map: &[usize]) -> Self {
        let mut extras = self.extras.clone();
        for extra in extras.values_mut() {
            extra.values = map
                .iter()
                .flat_map(|&i| extra.values[i * extra.width..(i + 1) * extra.width].to_vec())
                .collect();
        }
        Self {
            inner: self.inner.new_from_index_map(map),
            source_ids: map.iter().map(|&i| self.source_ids[i]).collect(),
            extras,
        }
    }
    fn clone_subset(&self, start: usize, count: usize) -> Self {
        let mut extras = self.extras.clone();
        for extra in extras.values_mut() {
            extra.values =
                extra.values[start * extra.width..(start + count) * extra.width].to_vec();
        }
        Self {
            inner: self.inner.clone_subset(start, count),
            source_ids: self.source_ids[start..start + count].to_vec(),
            extras,
        }
    }
}

/// Bake Spark's opacity compensation into scale so the existing tile shaders
/// continue receiving ordinary opacity in [0, 1] (Spark's lodInflate path).
pub fn render_scale_opacity(s: &impl Tsplat) -> (Vec3A, f32) {
    let opacity = s.opacity();
    (s.scales() * opacity.max(1.0).cbrt(), opacity.min(1.0))
}

pub fn splat_bounds(s: &impl Tsplat) -> [f32; 6] {
    let (scale, _) = render_scale_opacity(s);
    let q = s.quaternion();
    let a = q * Vec3A::X * scale.x;
    let b = q * Vec3A::Y * scale.y;
    let c = q * Vec3A::Z * scale.z;
    let extent = (a * a + b * b + c * c).map(f32::sqrt) * 3.0;
    let min = s.center() - extent;
    let max = s.center() + extent;
    [min.x, min.y, min.z, max.x, max.y, max.z]
}

pub fn union(a: [f32; 6], b: [f32; 6]) -> [f32; 6] {
    [
        a[0].min(b[0]),
        a[1].min(b[1]),
        a[2].min(b[2]),
        a[3].max(b[3]),
        a[4].max(b[4]),
        a[5].max(b[5]),
    ]
}
