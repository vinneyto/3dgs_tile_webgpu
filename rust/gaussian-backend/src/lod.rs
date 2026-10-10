use crate::protocol::LodConfig;
use ahash::{AHashMap, AHashSet};
use glam::{Vec3, Vec4};

/// History belongs to a tree generation, independent of its resident GPU slots.
#[derive(Default)]
pub(crate) struct LodHistory {
    refined: AHashSet<usize>,
    downgrade_at: AHashMap<usize, f64>,
}
impl LodHistory {
    pub fn score(
        &mut self,
        node: usize,
        raw: f32,
        children: &[usize],
        config: &LodConfig,
        now: f64,
    ) -> f32 {
        if !self.refined.contains(&node) || raw >= config.downgrade_threshold {
            self.downgrade_at.remove(&node);
            // A previously refined branch stays refined in the hysteresis band.
            return if self.refined.contains(&node) {
                raw.max(1.0001)
            } else {
                raw
            };
        }
        let deadline = self
            .downgrade_at
            .entry(node)
            .or_insert(now + config.downgrade_delay_ms);
        if config.downgrade_delay_ms > 0.0 && children.iter().any(|c| self.refined.contains(c)) {
            // Collapse the finest branches first, then their parents on later ticks.
            *deadline = deadline.max(now + config.downgrade_step_ms);
        }
        if now < *deadline {
            1.0001
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
        // Capacity pressure may coarsen a branch before its grace period ends.
        self.downgrade_at.retain(|node, _| refined.contains(node));
        // A weak ancestor cannot collapse while a descendant still needs detail.
        // Wait for a new view change, rather than waking indefinitely for that ancestor.
        let stable: Vec<_> = refined
            .iter()
            .filter(|node| !self.downgrade_at.contains_key(node))
            .copied()
            .collect();
        for node in stable {
            let mut parent = parents[node];
            while let Some(i) = parent {
                if self.downgrade_at.remove(&i).is_none() {
                    break;
                }
                parent = parents[i];
            }
        }
        self.refined = refined;
    }

    pub fn recheck_after(&self, now: f64) -> Option<f64> {
        self.downgrade_at
            .values()
            .copied()
            .reduce(f64::min)
            .map(|deadline| (deadline - now).max(1.0))
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
    fn upgrades_are_immediate_and_only_continuously_weak_detail_downgrades() {
        let config = LodConfig::default();
        let mut h = LodHistory::default();
        assert_eq!(h.score(0, 1.2, &[1, 2], &config, 0.), 1.2);
        h.commit(&[1, 2], &[None, Some(0), Some(0)]);
        assert!(h.score(0, 0.8, &[1, 2], &config, 100.) > 1.);
        assert_eq!(h.recheck_after(100.), None);
        assert!(h.score(0, 0., &[1, 2], &config, 200.) > 1.);
        assert_eq!(h.recheck_after(200.), Some(400.));
        assert!(h.score(0, 0., &[1, 2], &config, 599.) > 1.);
        // Returning into the hysteresis band cancels the old downgrade deadline.
        assert!(h.score(0, 0.8, &[1, 2], &config, 600.) > 1.);
        assert_eq!(h.recheck_after(600.), None);
        assert!(h.score(0, 0., &[1, 2], &config, 700.) > 1.);
        assert_eq!(h.score(0, 0., &[1, 2], &config, 1100.), 0.);
        h.commit(&[0], &[None, Some(0), Some(0)]);
        assert_eq!(h.recheck_after(1100.), None);
        assert_eq!(h.score(0, 1.2, &[1, 2], &config, 1101.), 1.2);
    }
    #[test]
    fn downgrade_collapses_one_tree_level_per_step_and_budget_can_override_history() {
        let c = LodConfig::default();
        let parents = [None, Some(0), Some(0), Some(1), Some(1)];
        let mut h = LodHistory::default();
        h.commit(&[2, 3, 4], &parents);
        assert!(h.score(0, 0., &[1, 2], &c, 0.) > 1.);
        assert!(h.score(1, 0., &[3, 4], &c, 0.) > 1.);
        assert!(h.score(0, 0., &[1, 2], &c, 400.) > 1.);
        assert_eq!(h.score(1, 0., &[3, 4], &c, 400.), 0.);
        h.commit(&[1, 2], &parents);
        assert_eq!(h.recheck_after(400.), Some(100.));
        assert!(h.score(0, 0., &[1, 2], &c, 499.) > 1.);
        assert_eq!(h.score(0, 0., &[1, 2], &c, 500.), 0.);
        h.commit(&[0], &parents);
        assert_eq!(h.recheck_after(500.), None);
        h.commit(&[2, 3, 4], &parents);
        h.score(1, 0., &[3, 4], &c, 600.);
        // A forced budget cut discards pending timers rather than retaining extra slots.
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
    fn a_weak_ancestor_with_required_descendant_detail_does_not_poll_forever() {
        let c = LodConfig::default();
        let parents = [None, Some(0), Some(0), Some(1), Some(1)];
        let mut h = LodHistory::default();
        h.commit(&[2, 3, 4], &parents);
        assert!(h.score(0, 0., &[1, 2], &c, 0.) > 1.);
        assert_eq!(h.score(1, 2., &[3, 4], &c, 0.), 2.);
        h.commit(&[2, 3, 4], &parents);
        assert_eq!(h.recheck_after(0.), None);
        // A later view makes the descendant weak too: normal delayed coarsening resumes.
        h.score(0, 0., &[1, 2], &c, 100.);
        h.score(1, 0., &[3, 4], &c, 100.);
        h.commit(&[2, 3, 4], &parents);
        assert_eq!(h.recheck_after(100.), Some(400.));
    }
}
