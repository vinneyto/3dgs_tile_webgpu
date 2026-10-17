//! Spark-style separation of resident source data and per-instance draw indices.
//! Storage buffers use node slots rather than Spark's 65,536-record texture pages.
use super::{CloudBatch, RenderStats, buffers, dispatch, pipeline, storage, uniform};
use crate::residency::{CapacityRequest, Residency, capacities};
use anyhow::{Result, ensure};
use bytemuck::{Pod, Zeroable};
use spark_lod::{GaussianBuffer, SourceSplat};
use std::{
    collections::{BTreeMap, HashMap},
    sync::Arc,
};

const ROW_BYTES: usize = std::mem::size_of::<SourceSplat>();
pub const DEFAULT_SOURCE_CACHE_BYTES: u64 = 256 * 1024 * 1024;
fn source_key(source: &Arc<GaussianBuffer>) -> usize {
    Arc::as_ptr(source) as usize
}

struct Source {
    // Holding the Arc prevents address reuse while its GPU cache is live.
    source: Arc<GaussianBuffer>,
    residency: Residency,
    required: Vec<usize>,
    generation: u64,
    buffer: wgpu::Buffer,
    upload: wgpu::Buffer,
    upload_capacity: usize,
}
struct Instance {
    source: usize,
    generation: u64,
    nodes: Arc<Vec<usize>>,
    buffer: wgpu::Buffer,
    capacity: usize,
}
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct UploadRow {
    destination: [u32; 4],
    record: SourceSplat,
}
struct Request {
    source: Arc<GaussianBuffer>,
    nodes: Vec<usize>,
}

pub(crate) struct ResidentGpu {
    upload_pipeline: wgpu::ComputePipeline,
    sources: HashMap<usize, Source>,
    instances: HashMap<u64, Instance>,
}
impl ResidentGpu {
    pub fn new(device: &wgpu::Device) -> Self {
        Self {
            upload_pipeline: pipeline(
                device,
                "upload missing resident splats",
                include_str!("shaders/upload.wgsl"),
                false,
                false,
                "main",
            ),
            sources: HashMap::new(),
            instances: HashMap::new(),
        }
    }

    pub fn prepare(
        &mut self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        batches: &[CloudBatch],
        budget_bytes: u64,
        stats: &mut RenderStats,
    ) -> Result<()> {
        let mut requests: BTreeMap<usize, Request> = BTreeMap::new();
        for batch in batches {
            ensure!(
                batch.nodes.iter().all(|n| *n < batch.buffer.node_count()),
                "Invalid Spark node index"
            );
            if batch.nodes.is_empty() {
                continue;
            }
            let req = requests
                .entry(source_key(&batch.buffer))
                .or_insert_with(|| Request {
                    source: batch.buffer.clone(),
                    nodes: Vec::new(),
                });
            req.nodes.extend(batch.nodes.iter().copied());
        }
        for req in requests.values_mut() {
            req.nodes.sort_unstable();
            req.nodes.dedup();
        }
        let limit = device.limits().max_storage_buffer_binding_size as usize;
        let allocations: Vec<_> = requests
            .iter()
            .map(|(key, req)| CapacityRequest {
                current: self.sources.get(key).map_or(0, |s| s.residency.capacity()),
                needed: req.nodes.len(),
                working: self.sources.get(key).map_or(req.nodes.len(), |s| {
                    s.residency.len()
                        + req
                            .nodes
                            .iter()
                            .filter(|n| s.residency.address(**n).is_none())
                            .count()
                }),
                maximum: req.source.node_count().min(limit / ROW_BYTES),
            })
            .collect();
        let planned = capacities(
            &allocations,
            (budget_bytes / ROW_BYTES as u64).min(usize::MAX as u64) as usize,
        )?;
        self.sources.retain(|key, _| requests.contains_key(key));
        self.instances
            .retain(|id, _| batches.iter().any(|b| b.id == *id && !b.nodes.is_empty()));
        let mut encoder = device.create_command_encoder(&Default::default());
        let mut copied = false;
        let mut pending = Vec::new();
        for ((key, req), capacity) in requests.into_iter().zip(planned) {
            let cached = self.sources.entry(key).or_insert_with(|| Source {
                source: req.source.clone(),
                residency: Residency::default(),
                required: Vec::new(),
                generation: 0,
                buffer: storage(device, "resident source", 4),
                upload: storage(device, "source upload staging", 4),
                upload_capacity: 0,
            });
            if cached.required == req.nodes && cached.residency.capacity() == capacity {
                stats.cache_hits += req.nodes.len() as u32;
                continue;
            }
            let mut update = cached.residency.prepare(&req.nodes, capacity)?;
            stats.cache_hits += (req.nodes.len() - update.missing.len()) as u32;
            stats.cache_misses += update.missing.len() as u32;
            stats.evicted_splats += update.evicted as u32;
            if update.resized {
                let next = storage(
                    device,
                    "resident Spark source",
                    (capacity * ROW_BYTES) as u64,
                );
                // Compact only under memory pressure. Existing records move GPU
                // -> GPU; source data is not decoded/encoded/uploaded again.
                update.copies.sort_unstable_by_key(|&(_, dst)| dst);
                let mut begin = 0;
                while begin < update.copies.len() {
                    let (src, dst) = update.copies[begin];
                    let mut end = begin + 1;
                    while end < update.copies.len()
                        && update.copies[end] == (src + end - begin, dst + end - begin)
                    {
                        end += 1;
                    }
                    let bytes = ((end - begin) * ROW_BYTES) as u64;
                    encoder.copy_buffer_to_buffer(
                        &cached.buffer,
                        (src * ROW_BYTES) as u64,
                        &next,
                        (dst * ROW_BYTES) as u64,
                        bytes,
                    );
                    stats.gpu_copied_bytes += bytes;
                    copied = true;
                    begin = end;
                }
                cached.buffer = next;
            }
            if update.remapped {
                cached.generation += 1;
            }
            cached.required = req.nodes;
            if !update.missing.is_empty() {
                pending.push((key, update.missing));
            }
        }
        // Queue order matters: relocation must complete before any scatter
        // upload overwrites the destination addresses. No CPU/GPU wait needed.
        if copied {
            queue.submit([encoder.finish()]);
        }
        let chunk_limit = limit / std::mem::size_of::<UploadRow>();
        for (key, missing) in pending {
            let cached = self.sources.get_mut(&key).unwrap();
            for chunk in missing.chunks(chunk_limit) {
                let rows: Vec<_> = chunk
                    .iter()
                    .map(|&(slot, node)| UploadRow {
                        destination: [slot as u32, 0, 0, 0],
                        record: cached.source.record(node),
                    })
                    .collect();
                if cached.upload_capacity < rows.len() {
                    cached.upload_capacity = rows.len().next_power_of_two().min(chunk_limit);
                    cached.upload = storage(
                        device,
                        "missing-node scatter staging",
                        (cached.upload_capacity * std::mem::size_of::<UploadRow>()) as u64,
                    );
                }
                queue.write_buffer(&cached.upload, 0, bytemuck::cast_slice(&rows));
                stats.uploaded_bytes += (rows.len() * std::mem::size_of::<UploadRow>()) as u64;
                let params = uniform(device, &[rows.len() as u32, 0, 0, 0]);
                let group = buffers(
                    device,
                    &self.upload_pipeline,
                    &[&params, &cached.upload, &cached.buffer],
                );
                let mut encoder = device.create_command_encoder(&Default::default());
                dispatch(
                    &mut encoder,
                    &self.upload_pipeline,
                    &group,
                    rows.len() as u32,
                );
                queue.submit([encoder.finish()]);
            }
        }
        for batch in batches {
            if batch.nodes.is_empty() {
                continue;
            }
            let key = source_key(&batch.buffer);
            let source = &self.sources[&key];
            let cached = self.instances.entry(batch.id).or_insert_with(|| Instance {
                source: key,
                generation: 0,
                nodes: Arc::new(Vec::new()),
                buffer: storage(device, "active source indices", 4),
                capacity: 0,
            });
            if cached.source != key
                || cached.generation != source.generation
                || (!Arc::ptr_eq(&cached.nodes, &batch.nodes) && *cached.nodes != *batch.nodes)
            {
                let indices: Vec<_> = batch
                    .nodes
                    .iter()
                    .map(|n| {
                        source
                            .residency
                            .address(*n)
                            .expect("active node must be resident")
                    })
                    .collect();
                if cached.capacity < indices.len() {
                    cached.capacity = indices.len().next_power_of_two().min(limit / 4);
                    cached.buffer = storage(
                        device,
                        "per-instance active indices",
                        (cached.capacity * 4) as u64,
                    );
                }
                queue.write_buffer(&cached.buffer, 0, bytemuck::cast_slice(&indices));
                stats.index_uploaded_bytes += (indices.len() * 4) as u64;
                cached.source = key;
                cached.generation = source.generation;
                cached.nodes = batch.nodes.clone();
            }
        }
        stats.resident_splats = self
            .sources
            .values()
            .map(|s| s.residency.len() as u32)
            .sum();
        stats.source_cache_bytes = self
            .sources
            .values()
            .map(|s| (s.residency.capacity() * ROW_BYTES) as u64)
            .sum();
        Ok(())
    }
    pub fn buffers(&self, batch: &CloudBatch) -> (&wgpu::Buffer, &wgpu::Buffer) {
        (
            &self.sources[&source_key(&batch.buffer)].buffer,
            &self.instances[&batch.id].buffer,
        )
    }
}
