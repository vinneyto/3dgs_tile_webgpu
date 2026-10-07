use ahash::AHashMap;

/// Object ids are never reused. Generation distinguishes source indices from
/// rebuilt mipmap-node indices, even when their numeric values are identical.
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
    free_slots: Vec<usize>,
    marks: Vec<u32>,
    epoch: u32,
}

pub(crate) struct SlotChanges {
    pub assigned: Vec<usize>,
    pub cleared: Vec<usize>,
    pub selected_slots: Vec<usize>,
}

impl SlotMapping {
    /// Retain selected keys in their existing slots. Only owners beyond a
    /// reduced capacity must relocate; growth does not move existing owners.
    pub fn reconcile(&mut self, capacity: usize, selected: &[GaussianKey]) -> SlotChanges {
        assert!(selected.len() <= capacity);
        let old_capacity = self.owners.len();
        if capacity < old_capacity {
            for key in self.owners.drain(capacity..).flatten() {
                self.to_slot.remove(&key);
            }
            self.free_slots.retain(|&slot| slot < capacity);
        } else {
            self.owners.resize(capacity, None);
            self.free_slots.extend((old_capacity..capacity).rev());
        }
        self.marks.resize(capacity, 0);
        self.epoch = self.epoch.wrapping_add(1);
        if self.epoch == 0 {
            self.marks.fill(0);
            self.epoch = 1;
        }
        let mut selected_slots: Vec<_> = selected
            .iter()
            .map(|key| {
                self.to_slot
                    .get(key)
                    .copied()
                    .inspect(|&slot| {
                        assert_ne!(self.marks[slot], self.epoch, "Duplicate selected key");
                        self.marks[slot] = self.epoch;
                    })
                    .unwrap_or(usize::MAX)
            })
            .collect();
        let mut cleared: Vec<_> = self
            .owners
            .iter()
            .enumerate()
            .filter_map(|(slot, owner)| {
                (owner.is_some() && self.marks[slot] != self.epoch).then_some(slot)
            })
            .collect();
        // Deterministic reuse of newly released slots, smallest first.
        cleared.sort_unstable();
        for &slot in cleared.iter().rev() {
            let key = self.owners[slot].take().unwrap();
            self.to_slot.remove(&key);
            self.free_slots.push(slot);
        }
        let mut assigned = Vec::new();
        for (&key, selected_slot) in selected.iter().zip(&mut selected_slots) {
            if *selected_slot != usize::MAX {
                continue;
            }
            let slot = self
                .free_slots
                .pop()
                .expect("Selected keys exceed slot capacity");
            self.owners[slot] = Some(key);
            self.to_slot.insert(key, slot);
            *selected_slot = slot;
            assigned.push(slot);
        }
        SlotChanges {
            assigned,
            cleared,
            selected_slots,
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
    #[test]
    fn retained_keys_keep_slots_and_freed_slots_are_reused() {
        let mut mapping = SlotMapping::default();
        mapping.reconcile(4, &[key(0), key(1), key(2), key(3)]);
        let change = mapping.reconcile(4, &[key(1), key(2), key(3), key(4)]);
        assert_eq!(change.assigned, vec![0]);
        assert_eq!(change.cleared, vec![0]);
        for node in 1..4 {
            assert_eq!(mapping.to_slot[&key(node)], node);
        }
        assert_eq!(mapping.to_slot[&key(4)], 0);
    }
    #[test]
    fn resizing_and_generations_do_not_alias_owners() {
        let mut mapping = SlotMapping::default();
        mapping.reconcile(4, &[key(0), key(1), key(2), key(3)]);
        mapping.reconcile(6, &[key(0), key(1), key(2), key(3), key(4)]);
        assert_eq!(mapping.to_slot[&key(4)], 4);
        mapping.reconcile(2, &[key(1), key(4)]);
        assert_eq!(mapping.to_slot[&key(1)], 1);
        assert_eq!(mapping.to_slot[&key(4)], 0);
        let rebuilt = GaussianKey {
            generation: 2,
            ..key(1)
        };
        mapping.reconcile(2, &[rebuilt, key(4)]);
        assert!(!mapping.to_slot.contains_key(&key(1)));
        assert_eq!(mapping.to_slot[&rebuilt], 1);
        let other_cloud = GaussianKey {
            cloud_id: 2,
            ..rebuilt
        };
        mapping.reconcile(2, &[rebuilt, other_cloud]);
        assert_ne!(mapping.to_slot[&rebuilt], mapping.to_slot[&other_cloud]);
    }
}
