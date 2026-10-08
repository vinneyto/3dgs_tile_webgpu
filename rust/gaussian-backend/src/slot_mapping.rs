use ahash::AHashMap;

/// Object ids are never reused. Generation distinguishes rebuilt tree nodes.
#[derive(Clone, Copy, Debug, Hash, Eq, PartialEq)]
pub(crate) struct GaussianKey {
    pub cloud_id: u32,
    pub generation: u32,
    pub node_id: usize,
}

#[derive(Default)]
pub(crate) struct SlotMapping {
    pub to_slot: AHashMap<GaussianKey, usize>,
    pub owners: Vec<Option<GaussianKey>>,
    last_used: Vec<u64>,
    epoch: u64,
    next_free: usize,
}

pub(crate) struct SlotChanges {
    pub assigned: Vec<usize>,
    pub cleared: Vec<usize>,
    pub selected_slots: Vec<usize>,
    pub evictions: usize,
}

impl SlotMapping {
    pub fn fill_free(&mut self, key: GaussianKey) -> usize {
        while self.next_free < self.owners.len() && self.owners[self.next_free].is_some() {
            self.next_free += 1;
        }
        let slot = self.next_free;
        assert!(slot < self.owners.len());
        assert!(!self.to_slot.contains_key(&key));
        self.owners[slot] = Some(key);
        self.last_used[slot] = 0; // Prefetch is less valuable than any actual camera use.
        self.to_slot.insert(key, slot);
        self.next_free += 1;
        slot
    }

    /// Requested keys include the pinned coarse cut and the desired draw cut.
    /// Keep every other valid owner until space is needed; then evict inactive
    /// least-recently-used owners. The caller commits a resident fallback cut
    /// before uploading a replacement into a previously active slot.
    pub fn reconcile(
        &mut self,
        capacity: usize,
        selected: &[GaussianKey],
        generations: &AHashMap<u32, u32>,
    ) -> SlotChanges {
        assert!(selected.len() <= capacity);
        self.epoch += 1;
        for key in self
            .owners
            .drain(capacity.min(self.owners.len())..)
            .flatten()
        {
            self.to_slot.remove(&key);
        }
        self.next_free = self.next_free.min(capacity);
        self.owners.resize(capacity, None);
        self.last_used.resize(capacity, 0);
        let mut cleared = Vec::new();
        for (slot, owner) in self.owners.iter_mut().enumerate() {
            if owner.is_some_and(|key| generations.get(&key.cloud_id) != Some(&key.generation)) {
                self.to_slot.remove(&owner.take().unwrap());
                cleared.push(slot);
            }
        }
        if let Some(&slot) = cleared.iter().min() {
            self.next_free = self.next_free.min(slot);
        }
        let mut selected_slots: Vec<_> = selected
            .iter()
            .map(|key| {
                self.to_slot
                    .get(key)
                    .copied()
                    .inspect(|&slot| {
                        assert_ne!(self.last_used[slot], self.epoch, "Duplicate requested key");
                        self.last_used[slot] = self.epoch;
                    })
                    .unwrap_or(usize::MAX)
            })
            .collect();
        let missing = selected_slots
            .iter()
            .filter(|&&slot| slot == usize::MAX)
            .count();
        if missing == 0 {
            return SlotChanges {
                assigned: Vec::new(),
                cleared,
                selected_slots,
                evictions: 0,
            };
        }
        let mut free: Vec<_> = self
            .owners
            .iter()
            .enumerate()
            .filter_map(|(slot, owner)| owner.is_none().then_some(slot))
            .collect();
        let mut evictions = 0;
        if missing > free.len() {
            let mut candidates: Vec<_> = self
                .owners
                .iter()
                .enumerate()
                .filter_map(|(slot, owner)| {
                    (owner.is_some() && self.last_used[slot] != self.epoch)
                        .then_some((self.last_used[slot], slot))
                })
                .collect();
            candidates.sort_unstable();
            for (_, slot) in candidates.into_iter().take(missing - free.len()) {
                self.to_slot.remove(&self.owners[slot].take().unwrap());
                free.push(slot);
                cleared.push(slot);
                evictions += 1;
            }
        }
        if evictions == 0 {
            free.reverse();
        } else {
            free.sort_unstable_by(|a, b| b.cmp(a));
        }
        let mut assigned = Vec::new();
        for (&key, slot) in selected.iter().zip(&mut selected_slots) {
            if *slot != usize::MAX {
                continue;
            }
            *slot = free.pop().expect("Requested keys exceed capacity");
            self.owners[*slot] = Some(key);
            self.last_used[*slot] = self.epoch;
            self.to_slot.insert(key, *slot);
            assigned.push(*slot);
        }
        cleared.sort_unstable();
        SlotChanges {
            assigned,
            cleared,
            selected_slots,
            evictions,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn key(node_id: usize) -> GaussianKey {
        GaussianKey {
            cloud_id: 0,
            generation: 1,
            node_id,
        }
    }
    fn valid() -> AHashMap<u32, u32> {
        [(0, 1)].into_iter().collect()
    }
    #[test]
    fn prefetch_reuses_invalidated_space_and_is_evicted_before_camera_cache() {
        let mut map = SlotMapping::default();
        map.reconcile(4, &[key(0), key(1)], &valid());
        map.fill_free(key(2));
        map.fill_free(key(3));
        map.reconcile(4, &[key(0), key(4)], &valid());
        assert!(map.to_slot.contains_key(&key(1)));
        assert_eq!(
            [key(2), key(3)]
                .iter()
                .filter(|k| map.to_slot.contains_key(k))
                .count(),
            1
        );
        let next_generation = GaussianKey {
            generation: 2,
            ..key(0)
        };
        map.reconcile(4, &[next_generation], &[(0, 2)].into_iter().collect());
        let extra = GaussianKey {
            generation: 2,
            ..key(5)
        };
        let slot = map.fill_free(extra);
        assert_eq!(map.owners[slot], Some(extra));
        assert_eq!(map.to_slot.len(), 2);
        map.reconcile(1, &[next_generation], &[(0, 2)].into_iter().collect());
        map.reconcile(3, &[next_generation], &[(0, 2)].into_iter().collect());
        assert!(map.fill_free(extra) < 3);
    }

    #[test]
    fn caches_unselected_owners_and_evicts_only_under_pressure() {
        let mut map = SlotMapping::default();
        map.reconcile(4, &[key(0), key(1)], &valid());
        let change = map.reconcile(4, &[key(0), key(2)], &valid());
        assert!(change.cleared.is_empty());
        assert_eq!(map.to_slot[&key(1)], 1);
        map.reconcile(4, &[key(0), key(3)], &valid());
        let change = map.reconcile(4, &[key(0), key(4)], &valid());
        assert_eq!(change.evictions, 1);
        assert!(!map.to_slot.contains_key(&key(1)));
        assert_eq!(map.to_slot[&key(0)], 0);
        assert_eq!(map.to_slot[&key(4)], 1);
    }
    #[test]
    fn resizing_and_generations_do_not_alias_owners() {
        let mut map = SlotMapping::default();
        map.reconcile(4, &[key(0), key(1), key(2), key(3)], &valid());
        map.reconcile(6, &[key(0), key(1), key(2), key(3), key(4)], &valid());
        assert_eq!(map.to_slot[&key(4)], 4);
        map.reconcile(2, &[key(1), key(4)], &valid());
        assert_eq!(map.to_slot[&key(1)], 1);
        assert_eq!(map.to_slot[&key(4)], 0);
        let rebuilt = GaussianKey {
            generation: 2,
            ..key(1)
        };
        map.reconcile(2, &[rebuilt], &[(0, 2)].into_iter().collect());
        assert!(!map.to_slot.contains_key(&key(1)));
        assert!(!map.to_slot.contains_key(&key(4)));
        assert_eq!(map.to_slot.len(), 1);
    }
}
