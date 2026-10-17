//! Stable resident addresses and an intrusive LRU, independent of the draw cut.
//! Like Spark's pager, current requests are protected before any replacement.
use anyhow::{Result, ensure};
use std::collections::{HashMap, HashSet};

#[derive(Clone, Copy)]
struct Entry {
    node: usize,
    prev: Option<usize>,
    next: Option<usize>,
}
#[derive(Default)]
pub(crate) struct Residency {
    slots: Vec<Option<Entry>>,
    addresses: HashMap<usize, usize>,
    free: Vec<usize>,
    oldest: Option<usize>,
    newest: Option<usize>,
}
#[derive(Default)]
pub(crate) struct Update {
    /// Old -> new addresses, copied on the GPU when allocation changes.
    pub copies: Vec<(usize, usize)>,
    /// Only these records must be encoded and uploaded from the CPU.
    pub missing: Vec<(usize, usize)>, // (slot, node)
    pub evicted: usize,
    pub resized: bool,
    pub remapped: bool,
}
impl Residency {
    pub fn capacity(&self) -> usize {
        self.slots.len()
    }
    pub fn len(&self) -> usize {
        self.addresses.len()
    }
    pub fn address(&self, node: usize) -> Option<u32> {
        self.addresses.get(&node).map(|s| *s as u32)
    }

    fn detach(&mut self, slot: usize) {
        let e = self.slots[slot].unwrap();
        if let Some(p) = e.prev {
            self.slots[p].as_mut().unwrap().next = e.next;
        } else {
            self.oldest = e.next;
        }
        if let Some(n) = e.next {
            self.slots[n].as_mut().unwrap().prev = e.prev;
        } else {
            self.newest = e.prev;
        }
    }
    fn append(&mut self, slot: usize) {
        let prev = self.newest;
        let e = self.slots[slot].as_mut().unwrap();
        e.prev = prev;
        e.next = None;
        if let Some(p) = prev {
            self.slots[p].as_mut().unwrap().next = Some(slot);
        } else {
            self.oldest = Some(slot);
        }
        self.newest = Some(slot);
    }
    fn touch(&mut self, slot: usize) {
        if self.newest != Some(slot) {
            self.detach(slot);
            self.append(slot);
        }
    }
    fn remove(&mut self, slot: usize) {
        self.detach(slot);
        let e = self.slots[slot].take().unwrap();
        self.addresses.remove(&e.node);
        self.free.push(slot);
    }
    fn insert(&mut self, slot: usize, node: usize) {
        debug_assert!(self.slots[slot].is_none());
        self.slots[slot] = Some(Entry {
            node,
            prev: None,
            next: None,
        });
        self.addresses.insert(node, slot);
        self.append(slot);
    }

    pub fn prepare(&mut self, required: &[usize], capacity: usize) -> Result<Update> {
        let pinned: HashSet<_> = required.iter().copied().collect();
        ensure!(
            pinned.len() == required.len(),
            "Duplicate residency requests"
        );
        ensure!(
            required.len() <= capacity,
            "Resident allocation cannot fit the active cut"
        );
        let mut update = Update::default();
        // Protect the union of all instances' current requests before inserting
        // anything. Old active cuts are just cache entries once no longer used.
        for node in required {
            if let Some(&slot) = self.addresses.get(node) {
                self.touch(slot);
            }
        }
        if capacity != self.capacity() {
            update.resized = true;
            while self.len() > capacity {
                let slot = self.oldest.unwrap();
                debug_assert!(!pinned.contains(&self.slots[slot].unwrap().node));
                self.remove(slot);
                update.evicted += 1;
            }
            let mut retained = Vec::with_capacity(self.len());
            let mut cursor = self.oldest;
            while let Some(slot) = cursor {
                let e = self.slots[slot].unwrap();
                retained.push((slot, e.node));
                cursor = e.next;
            }
            let mut occupied = vec![false; capacity];
            for &(slot, _) in &retained {
                if slot < capacity {
                    occupied[slot] = true;
                }
            }
            let mut holes: Vec<_> = (0..capacity).rev().filter(|s| !occupied[*s]).collect();
            self.slots = vec![None; capacity];
            self.addresses.clear();
            self.oldest = None;
            self.newest = None;
            for (old, node) in retained {
                let new = if old < capacity {
                    old
                } else {
                    holes.pop().unwrap()
                };
                self.insert(new, node);
                update.copies.push((old, new));
                update.remapped |= old != new;
            }
            self.free = (0..capacity)
                .rev()
                .filter(|s| self.slots[*s].is_none())
                .collect();
        }
        for &node in required {
            if self.addresses.contains_key(&node) {
                continue;
            }
            if self.free.is_empty() {
                let slot = self.oldest.unwrap();
                debug_assert!(!pinned.contains(&self.slots[slot].unwrap().node));
                self.remove(slot);
                update.evicted += 1;
            }
            let slot = self.free.pop().unwrap();
            self.insert(slot, node);
            update.missing.push((slot, node));
        }
        Ok(update)
    }
}

pub(crate) struct CapacityRequest {
    pub current: usize,
    pub needed: usize,
    pub working: usize,
    pub maximum: usize,
}
/// Keep allocations stable across cut changes. Reclaim inactive headroom only
/// when needed to fit another source, then spend remaining room on growth.
pub(crate) fn capacities(requests: &[CapacityRequest], budget: usize) -> Result<Vec<usize>> {
    ensure!(
        requests.iter().all(|r| r.needed <= r.maximum),
        "Active source exceeds GPU binding limit; lower the LOD budget"
    );
    let minimum: usize = requests.iter().map(|r| r.needed).sum();
    ensure!(
        minimum <= budget,
        "Active sources exceed source cache budget; lower the LOD budget or increase source_cache_bytes"
    );
    let mut caps: Vec<_> = requests
        .iter()
        .map(|r| r.current.min(r.maximum).max(r.needed))
        .collect();
    let mut excess = caps.iter().sum::<usize>().saturating_sub(budget);
    let mut donors: Vec<_> = (0..requests.len()).collect();
    donors.sort_unstable_by_key(|&i| std::cmp::Reverse(caps[i] - requests[i].needed));
    for i in donors {
        let reclaim = excess.min(caps[i] - requests[i].needed);
        caps[i] -= reclaim;
        excess -= reclaim;
    }
    let mut free = budget - caps.iter().sum::<usize>();
    for (i, r) in requests.iter().enumerate() {
        if r.current >= r.working.min(r.maximum) {
            continue;
        }
        let desired = r
            .working
            .min(r.maximum)
            .next_power_of_two()
            .saturating_mul(2)
            .max(64)
            .min(r.maximum);
        let extra = free.min(desired.saturating_sub(caps[i]));
        caps[i] += extra;
        free -= extra;
    }
    Ok(caps)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn changing_and_returning_cuts_upload_only_cache_misses() {
        let mut c = Residency::default();
        assert_eq!(c.prepare(&[0, 1, 2, 3], 8).unwrap().missing.len(), 4);
        let old = c.address(2);
        let update = c.prepare(&[2, 3, 4, 5], 8).unwrap();
        assert_eq!(
            update.missing.iter().map(|v| v.1).collect::<Vec<_>>(),
            [4, 5]
        );
        assert_eq!(c.address(2), old);
        assert!(c.prepare(&[0, 1, 2, 3], 8).unwrap().missing.is_empty());
        assert_eq!(c.len(), 6);
    }
    #[test]
    fn lru_protects_all_active_instances_and_reloads_only_evicted_nodes() {
        let mut c = Residency::default();
        c.prepare(&[0, 1, 2, 3], 4).unwrap();
        let pinned = c.address(0);
        let u = c.prepare(&[0, 3, 4, 5], 4).unwrap();
        assert_eq!(u.evicted, 2);
        assert_eq!(c.address(0), pinned);
        assert!(c.address(1).is_none() && c.address(2).is_none());
        assert!(c.prepare(&[0, 4, 5], 4).unwrap().missing.is_empty());
        assert_eq!(c.prepare(&[0, 1, 4, 5], 4).unwrap().missing.len(), 1);
    }
    #[test]
    fn growth_copies_residents_and_shrink_compacts_without_reencoding() {
        let mut c = Residency::default();
        c.prepare(&[0, 1], 2).unwrap();
        let original = c.address(0);
        let u = c.prepare(&[0, 1, 2, 3], 8).unwrap();
        assert_eq!(u.copies.len(), 2);
        assert_eq!(u.missing.len(), 2);
        assert!(!u.remapped);
        assert_eq!(c.address(0), original);
        c.prepare(&[4, 5, 6, 7], 8).unwrap();
        let u = c.prepare(&[6, 7], 2).unwrap();
        assert!(u.missing.is_empty());
        assert!(u.remapped);
        assert_eq!(u.copies.len(), 2);
        assert!(c.address(6).unwrap() < 2 && c.address(7).unwrap() < 2);
    }
    #[test]
    fn one_changed_node_in_a_large_cut_is_one_upload() {
        let mut c = Residency::default();
        let first: Vec<_> = (0..200_000).collect();
        c.prepare(&first, 400_002).unwrap();
        let address = c.address(12345);
        let mut second = first.clone();
        second[199_999] = 200_000;
        let update = c.prepare(&second, 400_002).unwrap();
        assert_eq!(update.missing.len(), 1);
        assert_eq!(update.missing[0].1, 200_000);
        assert_eq!(c.address(12345), address);
        assert!(c.prepare(&first, 400_002).unwrap().missing.is_empty());
    }
    #[test]
    fn allocation_grows_for_newly_visited_nodes_before_evicting_cache() {
        let planned = capacities(
            &[CapacityRequest {
                current: 64,
                needed: 64,
                working: 100,
                maximum: 200,
            }],
            256,
        )
        .unwrap();
        assert_eq!(planned, [200]);
    }
    #[test]
    fn global_budget_reclaims_only_headroom_and_preserves_steady_allocations() {
        let req = |current, needed| CapacityRequest {
            current,
            needed,
            working: needed,
            maximum: 100,
        };
        assert_eq!(
            capacities(&[req(80, 20), req(0, 30)], 100).unwrap(),
            [70, 30]
        );
        assert_eq!(
            capacities(&[req(70, 10), req(30, 20)], 100).unwrap(),
            [70, 30]
        );
        assert!(capacities(&[req(0, 60), req(0, 60)], 100).is_err());
        assert!(capacities(&[req(0, 101)], 1000).is_err());
    }
}
