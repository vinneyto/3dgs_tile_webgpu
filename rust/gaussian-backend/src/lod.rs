use crate::protocol::LodConfig;
use ahash::AHashSet;
use glam::{Vec3, Vec4};

/// Refined state describes the committed cut, never a preparation candidate.
#[derive(Default)]
pub(crate) struct LodHistory {
    refined: AHashSet<usize>,
    required: AHashSet<usize>,
    weak: AHashSet<usize>,
    stable_at: f64,
}
impl LodHistory {
    pub fn prepare(
        &mut self,
        parents: &[Option<usize>],
        config: &LodConfig,
        stable_at: f64,
        mut raw_score: impl FnMut(usize) -> f32,
    ) {
        self.stable_at = stable_at;
        self.weak.clear();
        self.required.clear();
        // Keep the hysteresis band, including ancestors needed to reach strong
        // committed descendants. Weak levels share the camera's one deadline.
        for &node in &self.refined {
            if raw_score(node) < config.downgrade_threshold {
                continue;
            }
            let mut current = Some(node);
            while let Some(i) = current {
                if !self.required.insert(i) {
                    break;
                }
                current = parents[i];
            }
        }
    }

    pub fn score(&mut self, node: usize, raw: f32, now: f64) -> f32 {
        if !self.refined.contains(&node) {
            return raw;
        }
        if self.required.contains(&node) {
            return raw.max(1.0001);
        }
        if now < self.stable_at {
            self.weak.insert(node);
            raw.max(1.0001)
        } else {
            raw
        }
    }

    pub fn commit(&mut self, cut: &[usize], parents: &[Option<usize>]) {
        let mut refined = AHashSet::new();
        for &node in cut {
            let mut parent = parents[node];
            while let Some(i) = parent {
                if !refined.insert(i) {
                    break;
                }
                parent = parents[i];
            }
        }
        self.weak.retain(|node| refined.contains(node));
        self.refined = refined;
    }

    pub fn recheck_after(&self, now: f64) -> Option<f64> {
        (!self.weak.is_empty()).then(|| (self.stable_at - now).max(1.0))
    }
}

/// Keep a preparation halo and fade priority continuously outside its clip planes.
pub(crate) fn frustum_weight(
    bounds: &[f32; 6],
    planes: &[Vec4; 6],
    clip_w: f32,
    margin: f32,
) -> f32 {
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
    let outside = planes
        .iter()
        .map(|p| {
            -(p.truncate().dot(center) + p.w + p.truncate().abs().dot(extent))
                / clip_w.abs().max(1e-6)
        })
        .fold(0.0, f32::max);
    let fade = ((outside - margin).max(0.0) / margin.max(0.01)).powi(2);
    1.0 / (1.0 + 4.0 * fade)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn hysteresis_and_one_deadline_keep_detail_until_the_camera_settles() {
        let c = LodConfig::default();
        let parents = [None, Some(0), Some(0)];
        let mut h = LodHistory::default();
        h.prepare(&parents, &c, 400., |_| 1.2);
        assert_eq!(h.score(0, 1.2, 0.), 1.2);
        h.commit(&[1, 2], &parents);
        h.prepare(&parents, &c, 500., |_| 0.8);
        assert!(h.score(0, 0.8, 100.) > 1.);
        assert_eq!(h.recheck_after(100.), None);
        h.prepare(&parents, &c, 600., |_| 0.);
        assert!(h.score(0, 0., 200.) > 1.);
        assert_eq!(h.recheck_after(200.), Some(400.));
        assert!(h.score(0, 0., 599.) > 1.);
        // A new camera view restarts the shared grace, and the band cancels it.
        h.prepare(&parents, &c, 1000., |_| 0.8);
        assert!(h.score(0, 0.8, 600.) > 1.);
        assert_eq!(h.recheck_after(600.), None);
        h.prepare(&parents, &c, 1100., |_| 0.);
        assert!(h.score(0, 0., 700.) > 1.);
        assert_eq!(h.score(0, 0., 1100.), 0.);
        h.commit(&[0], &parents);
        assert_eq!(h.recheck_after(1100.), None);
        assert_eq!(h.score(0, 1.2, 1101.), 1.2);
    }
    #[test]
    fn all_weak_levels_collapse_at_the_same_deadline_and_history_waits_for_commit() {
        let c = LodConfig::default();
        let parents = [None, Some(0), Some(0), Some(1), Some(1), Some(3), Some(3)];
        let mut h = LodHistory::default();
        h.commit(&[2, 4, 5, 6], &parents);
        h.prepare(&parents, &c, 400., |_| 0.);
        for node in [0, 1, 3] {
            assert!(h.score(node, 0., 399.) > 1.);
        }
        assert_eq!(h.recheck_after(399.), Some(1.));
        // No mandatory child-first ticks or intermediate committed cuts.
        for node in [0, 1, 3] {
            assert_eq!(h.score(node, 0., 400.), 0.);
        }
        assert!(h.refined.contains(&3));
        h.commit(&[0], &parents);
        assert!(h.refined.is_empty());
        assert_eq!(h.recheck_after(400.), None);
        // Capacity may force an earlier coherent cut without retaining timers.
        h.commit(&[2, 4, 5, 6], &parents);
        h.prepare(&parents, &c, 1000., |_| 0.);
        h.score(3, 0., 600.);
        h.commit(&[0], &parents);
        assert_eq!(h.recheck_after(600.), None);
    }
    #[test]
    fn frustum_halo_has_no_binary_priority_drop_and_scales_with_projection() {
        let planes = [
            Vec4::new(1., 0., 0., 1.),
            Vec4::new(-1., 0., 0., 1.),
            Vec4::new(0., 1., 0., 1.),
            Vec4::new(0., -1., 0., 1.),
            Vec4::new(0., 0., 1., 1.),
            Vec4::new(0., 0., -1., 1.),
        ];
        let weight = |x| frustum_weight(&[x, 0., 0., x, 0., 0.], &planes, 1., 0.15);
        assert_eq!(weight(1.1), 1.);
        assert!((weight(1.15001) - weight(1.14999)).abs() < 1e-5);
        assert!(weight(1.3) > 0. && weight(1.3) < weight(1.2));
        assert!(weight(10.) < 0.001);
        let doubled = planes.map(|p| p * 2.);
        assert_eq!(
            frustum_weight(&[1.3, 0., 0., 1.3, 0., 0.], &doubled, 2., 0.15),
            weight(1.3)
        );
    }
    #[test]
    fn lod_configuration_rejects_invalid_thresholds_and_delays() {
        for lod in [
            serde_json::json!({"downgradeDelayMs":-1}),
            serde_json::json!({"downgradeStepMs":0}),
            serde_json::json!({"downgradeThreshold":0}),
            serde_json::json!({"downgradeThreshold":1.1}),
            serde_json::json!({"frustumMargin":-0.1}),
        ] {
            let c = serde_json::from_value(serde_json::json!({"lod":lod})).unwrap();
            assert!(crate::Engine::new(c).is_err());
        }
    }
    #[test]
    fn strong_descendants_protect_weak_ancestors_without_an_endless_recheck() {
        let c = LodConfig::default();
        let parents = [None, Some(0), Some(0), Some(1), Some(1)];
        let mut h = LodHistory::default();
        h.commit(&[2, 3, 4], &parents);
        h.prepare(&parents, &c, 400., |i| if i == 1 { 2. } else { 0. });
        assert!(h.score(0, 0., 0.) > 1.);
        assert!(h.score(0, 0., 1000.) > 1.);
        assert_eq!(h.recheck_after(1000.), None);
        h.prepare(&parents, &c, 1400., |_| 0.);
        h.score(0, 0., 1000.);
        h.score(1, 0., 1000.);
        assert_eq!(h.recheck_after(1000.), Some(400.));
        assert_eq!(h.score(0, 0., 1400.), 0.);
    }
}
