use gaussian_backend::*;
use glam::{Quat, Vec3A};
use serde_json::{json, Value};
use spark_lib::{
    antisplat::AntiSplatEncoder,
    gsplat::{Gsplat, GsplatArray, GsplatSH1},
    ksplat::KsplatEncoder,
    rad::RadEncoder,
    spz::SpzEncoder,
    tsplat::TsplatArray,
};
use std::io::{Cursor, Write};

fn source(degree: usize) -> GsplatArray {
    let mut a = GsplatArray::new_capacity(2, degree);
    for x in [-2.0, 2.0] {
        a.push_splat(
            Gsplat::new(
                Vec3A::new(x, 0.0, 0.0),
                1.0,
                Vec3A::splat(0.5),
                Vec3A::splat(0.2),
                Quat::IDENTITY,
            ),
            (degree > 0).then(|| GsplatSH1::new([Vec3A::splat(0.25); 3])),
            None,
            None,
        );
    }
    a
}
fn apply(e: &mut Engine, command: Value, bytes: &[u8]) -> anyhow::Result<Vec<Payload>> {
    e.apply(serde_json::from_value(command)?, bytes)
}
fn load(
    e: &mut Engine,
    id: &str,
    bytes: &[u8],
    mut options: Value,
) -> anyhow::Result<Vec<Payload>> {
    if options.get("format").is_none() && options.get("fileName").is_none() {
        options["format"] = json!("splat");
    }
    apply(
        e,
        json!({"type":"load-cloud-from-buffer","cloudId":id,"options":options}),
        bytes,
    )
}
fn handshake(e: &mut Engine, limit: usize, bindings: usize) -> anyhow::Result<Vec<Payload>> {
    let m = [
        1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1.,
    ];
    let mut projection = m;
    projection[0] = 0.1;
    projection[5] = 0.1;
    apply(
        e,
        json!({"type":"set-frontend-capabilities","protocolVersion":2,"capabilities":{"maxBufferSize":limit,"maxStorageBufferBindingSize":limit,"maxStorageBuffersPerShaderStage":bindings,"supportsPartialBufferUpdates":true},"sceneRevision":1,"cameraWorldMatrix":m,"projectionMatrix":projection,"viewportWidth":1024,"viewportHeight":1024,"cloudTransforms":[]}),
        &[],
    )
}
fn f32_attr<'a>(attrs: &'a [Attribute], name: &str) -> &'a [f32] {
    match &attrs.iter().find(|a| a.name == name).unwrap().data {
        Data::F32(v) => v,
        _ => panic!(),
    }
}
fn snapshot(payloads: &[Payload]) -> &Snapshot {
    match &payloads[0] {
        Payload::CloudLoaded {
            mipmap_snapshot: Some(s),
            ..
        } => s,
        _ => panic!("missing snapshot"),
    }
}

#[test]
fn parses_splat_spz_ksplat_rad_and_keeps_sh() {
    let splat = AntiSplatEncoder::new(source(0)).encode().unwrap();
    let ksplat = KsplatEncoder::new(source(1)).encode().unwrap();
    let spz = SpzEncoder::new(source(1)).encode().unwrap();
    let mut rad = Vec::new();
    RadEncoder::new(source(1)).encode(&mut rad).unwrap();
    for (format, bytes, degree) in [
        ("splat", splat, 0),
        ("spz", spz, 1),
        ("ksplat", ksplat, 1),
        ("rad", rad, 1),
    ] {
        let mut e = Engine::new(Config::default()).unwrap();
        let out = load(
            &mut e,
            format,
            &bytes,
            json!({"format":format,"mipmaps":{"type":"standard","snapshot":{"maxLeaves":2}}}),
        )
        .unwrap();
        assert!(
            matches!(&out[0], Payload::CloudLoaded { source_count: 2, sh_degree, .. } if *sh_degree == degree)
        );
        let s = snapshot(&out);
        assert_eq!(s.leaf_count, 2);
        assert_eq!(s.node_count, 3);
        let centers = f32_attr(&s.attributes, "means");
        assert!(centers[0].abs() < 0.01, "parent must merge both inputs");
        if degree > 0 {
            match &s
                .attributes
                .iter()
                .find(|a| a.name == "shCoefficients")
                .unwrap()
                .data
            {
                Data::U32(v) => assert_ne!(v[1], 0),
                _ => panic!(),
            }
        }
    }
}

fn sog(version: usize, webp: bool) -> Vec<u8> {
    let means = json!({"files":["m0.img","m1.img"],"mins":[-3f32.ln(),0.,0.],"maxs":[3f32.ln(),0.,0.],"shape":[2,3]});
    let meta = if version == 2 {
        json!({"version":2,"count":2,"means":means,"scales":{"files":["s.img"],"codebook":[-1.]},"quats":{"files":["q.img"]},"sh0":{"files":["c.img"],"codebook":[0.]}})
    } else {
        json!({"means":means,"scales":{"files":["s.img"],"mins":[-1.,-1.,-1.],"maxs":[-1.,-1.,-1.]},"quats":{"files":["q.img"],"encoding":"quaternion_packed"},"sh0":{"files":["c.img"],"mins":[0.,0.,0.,10.],"maxs":[0.,0.,0.,10.]}})
    };
    let mut zip = zip::ZipWriter::new(Cursor::new(Vec::new()));
    let options = zip::write::SimpleFileOptions::default();
    zip.start_file("nested/meta.json", options).unwrap();
    zip.write_all(meta.to_string().as_bytes()).unwrap();
    for (name, pixels) in [
        ("m0.img", [0, 0, 0, 255, 255, 0, 0, 255]),
        ("m1.img", [0, 0, 0, 255, 255, 0, 0, 255]),
        ("s.img", [0, 0, 0, 255, 0, 0, 0, 255]),
        ("q.img", [128, 128, 128, 252, 128, 128, 128, 252]),
        ("c.img", [0, 0, 0, 255, 0, 0, 0, 255]),
    ] {
        let img = image::RgbaImage::from_raw(2, 1, pixels.to_vec()).unwrap();
        let mut encoded = Cursor::new(Vec::new());
        img.write_to(
            &mut encoded,
            if webp {
                image::ImageFormat::WebP
            } else {
                image::ImageFormat::Png
            },
        )
        .unwrap();
        zip.start_file(format!("nested/{name}"), options).unwrap();
        zip.write_all(encoded.get_ref()).unwrap();
    }
    zip.finish().unwrap().into_inner()
}
#[test]
fn sog_v1_v2_png_webp_explicit_and_autodetected() {
    for version in [1, 2] {
        for webp in [false, true] {
            for format in ["sog", "auto"] {
                let mut e = Engine::new(Config::default()).unwrap();
                let out = load(&mut e,"sog",&sog(version,webp),json!({"format":format,"fileName":"scene.sog","mipmaps":{"type":"standard","snapshot":{"maxLeaves":2}}})).unwrap();
                let s = snapshot(&out);
                assert_eq!(s.leaf_count, 2);
                let centers = f32_attr(&s.attributes, "means");
                assert!(centers[4].abs() > 1.99 && centers[8].abs() > 1.99);
            }
        }
    }
}
#[test]
fn none_uses_remaining_capacity_and_never_exports_a_tree() {
    let bytes = AntiSplatEncoder::new(source(0)).encode().unwrap();
    let mut e = Engine::new(Config::default()).unwrap();
    handshake(&mut e, 352, 8).unwrap();
    let first = load(
        &mut e,
        "first",
        &bytes,
        json!({"priority":10,"mipmaps":{"type":"none"}}),
    )
    .unwrap();
    assert!(matches!(
        &first[0],
        Payload::CloudLoaded {
            mipmap_snapshot: None,
            ..
        }
    ));
    let second = load(
        &mut e,
        "second",
        &bytes,
        json!({"priority":-1,"mipmaps":{"type":"none"}}),
    )
    .unwrap();
    let mut replica = Replica::default();
    replica.receive(&second);
    assert_eq!((replica.active, replica.capacity), (2, 2));
    let Payload::BuffersActivated { changed_clouds, .. } = second.last().unwrap() else {
        panic!()
    };
    assert_eq!(
        changed_clouds
            .iter()
            .find(|c| c.cloud_id == "first")
            .unwrap()
            .rendered_count,
        0
    );
    assert_eq!(f32_attr(&replica.attributes, "means")[3], 1.0);
}
#[test]
fn snapshots_cover_the_whole_cloud_and_rebuild_after_writes() {
    let bytes = AntiSplatEncoder::new(source(0)).encode().unwrap();
    let mut e = Engine::new(Config::default()).unwrap();
    let out = load(&mut e,"cloud",&bytes,json!({"mipmaps":{"type":"standard","snapshot":{"maxLeaves":1}},"attributes":[{"name":"custom","format":"f32","elementsPerGaussian":1,"source":{"kind":"buffer","data":[2.,6.]}}]})).unwrap();
    let s = snapshot(&out);
    assert_eq!((s.node_count, s.leaf_count), (1, 1));
    assert!(s.node_bounds[0] < -2. && s.node_bounds[3] > 2.);
    assert!((f32_attr(&s.attributes, "custom")[0] - 4.).abs() < 0.01);
    let out = apply(&mut e,json!({"type":"write-attribute-range","cloudId":"cloud","attribute":"means","firstGaussian":0,"gaussianCount":1,"data":[-10.,0.,0.,0.]}),&[]).unwrap();
    let Payload::MipmapSnapshotReplaced {
        source_version,
        snapshot_version,
        snapshot: Some(s),
        ..
    } = &out[0]
    else {
        panic!()
    };
    assert_eq!((*source_version, *snapshot_version), (2, 2));
    assert!(f32_attr(&s.attributes, "means")[0] < -3.9);
    let out = apply(
        &mut e,
        json!({"type":"set-cloud-mipmaps","cloudId":"cloud","mipmaps":{"type":"none"}}),
        &[],
    )
    .unwrap();
    assert!(matches!(
        &out[0],
        Payload::MipmapSnapshotReplaced { snapshot: None, .. }
    ));
}
#[test]
fn rejected_load_and_handshake_do_not_mutate_scene() {
    let bytes = AntiSplatEncoder::new(source(0)).encode().unwrap();
    let mut e = Engine::new(Config::default()).unwrap();
    handshake(&mut e, 176, 5).unwrap();
    let invalid = json!({"attributes":[{"name":"custom","format":"f32","elementsPerGaussian":1,"source":{"kind":"fill","value":"zeros"}}]});
    assert!(load(&mut e, "same", &bytes, invalid).is_err());
    let out = load(&mut e, "same", &bytes, json!({"mipmaps":{"type":"none"}})).unwrap();
    assert!(matches!(&out[0], Payload::CloudLoaded { object_id: 0, .. }));
    assert!(handshake(&mut e, 1, 5).is_err());
    assert!(apply(
        &mut e,
        json!({"type":"set-cloud-priority","cloudId":"same","priority":-1}),
        &[]
    )
    .is_ok());
}

#[test]
fn standard_renders_merged_parent_under_tight_capacity() {
    let bytes = AntiSplatEncoder::new(source(0)).encode().unwrap();
    let mut e = Engine::new(Config::default()).unwrap();
    handshake(&mut e, 176, 8).unwrap();
    let out = load(
        &mut e,
        "cloud",
        &bytes,
        json!({"mipmaps":{"type":"standard"}}),
    )
    .unwrap();
    let mut replica = Replica::default();
    replica.receive(&out);
    assert_eq!(replica.active, 1);
    assert!(f32_attr(&replica.attributes, "means")[0].abs() < 0.01);
    let out = apply(
        &mut e,
        json!({"type":"set-cloud-mipmaps","cloudId":"cloud","mipmaps":{"type":"none"}}),
        &[],
    )
    .unwrap();
    replica.receive(&out);
    assert_eq!(f32_attr(&replica.attributes, "means")[0], -2.0);
}

/// Mirror the frontend's full-capacity, sparse storage buffers. Active count
/// must never be interpreted as the length of an occupied prefix.
#[derive(Default)]
struct Replica {
    attributes: Vec<Attribute>,
    capacity: usize,
    active: usize,
    layout: u32,
    content: u32,
    active_slots: std::collections::BTreeSet<usize>,
    pending_added: Vec<u32>,
    pending_removed: Vec<u32>,
}
impl Replica {
    fn receive(&mut self, payloads: &[Payload]) {
        for payload in payloads {
            match payload {
                Payload::BuffersAllocated {
                    attributes,
                    capacity,
                    layout_version,
                    content_version,
                    ..
                } => {
                    self.attributes = attributes
                        .iter()
                        .map(|a| {
                            let len = capacity * a.elements_per_gaussian;
                            let data = if a.format == "f32" {
                                let mut v = vec![0.0; len];
                                if a.name == "means" {
                                    for row in v.chunks_mut(4) {
                                        row[3] = -1.;
                                    }
                                }
                                Data::F32(v)
                            } else {
                                Data::U32(vec![0; len])
                            };
                            Attribute { data, ..a.clone() }
                        })
                        .collect();
                    self.capacity = *capacity;
                    self.active = 0;
                    self.active_slots.clear();
                    self.pending_added.clear();
                    self.pending_removed.clear();
                    self.layout = *layout_version;
                    self.content = *content_version;
                }
                Payload::BuffersReplaced {
                    attributes,
                    capacity,
                    count,
                    active_slots,
                    layout_version,
                    content_version,
                    ..
                } => {
                    self.attributes = attributes.clone();
                    self.capacity = *capacity;
                    self.active = *count;
                    self.active_slots = active_slots.iter().map(|&s| s as usize).collect();
                    self.layout = *layout_version;
                    self.content = *content_version;
                }
                Payload::BuffersPatched {
                    patches,
                    layout_version,
                    base_content_version,
                    content_version,
                    changed_clouds,
                    ..
                } => {
                    assert_eq!(*layout_version, self.layout);
                    assert_eq!(*base_content_version, self.content);
                    for p in patches {
                        let a = self
                            .attributes
                            .iter_mut()
                            .find(|a| a.name == p.name)
                            .unwrap();
                        let first = p.first_slot * a.elements_per_gaussian;
                        match (&mut a.data, &p.data) {
                            (Data::F32(t), Data::F32(v)) => {
                                t[first..first + v.len()].copy_from_slice(v)
                            }
                            (Data::U32(t), Data::U32(v)) => {
                                t[first..first + v.len()].copy_from_slice(v)
                            }
                            _ => panic!(),
                        }
                    }
                    if !changed_clouds.is_empty() {
                        self.active = changed_clouds.iter().map(|c| c.rendered_count).sum();
                    }
                    self.content = *content_version;
                }
                Payload::BuffersActivated {
                    added_slots,
                    removed_slots,
                    commit,
                    changed_clouds,
                    layout_version,
                    base_content_version,
                    content_version,
                    ..
                } => {
                    assert_eq!(*layout_version, self.layout);
                    assert_eq!(*base_content_version, self.content);
                    self.pending_added.extend(added_slots);
                    self.pending_removed.extend(removed_slots);
                    if *commit {
                        for slot in self.pending_removed.drain(..) {
                            self.active_slots.remove(&(slot as usize));
                        }
                        for slot in self.pending_added.drain(..) {
                            assert!((slot as usize) < self.capacity);
                            self.active_slots.insert(slot as usize);
                        }
                        self.active = changed_clouds.iter().map(|c| c.rendered_count).sum();
                        assert_eq!(self.active_slots.len(), self.active);
                    }
                    self.content = *content_version;
                }
                _ => (),
            }
            if !self.attributes.is_empty() {
                for &slot in &self.active_slots {
                    assert!(f32_attr(&self.attributes, "means")[slot * 4 + 3] >= 0.);
                }
            }
        }
    }
    fn slot(&self, x: f32) -> usize {
        let means = f32_attr(&self.attributes, "means");
        let scales = f32_attr(&self.attributes, "scalesOpacity");
        (0..self.capacity)
            .find(|&i| scales[i * 4 + 3] > 0.0 && (means[i * 4] - x).abs() < 0.01)
            .unwrap()
    }
    fn occupied(&self) -> usize {
        f32_attr(&self.attributes, "means")
            .chunks(4)
            .filter(|v| v[3] >= 0.0)
            .count()
    }
}
fn row_cloud() -> Vec<u8> {
    let mut a = GsplatArray::new_capacity(5, 0);
    for x in 0..5 {
        a.push_splat(
            Gsplat::new(
                Vec3A::new(x as f32, 0., 0.5),
                1.,
                Vec3A::splat(0.5),
                Vec3A::splat(0.02),
                Quat::IDENTITY,
            ),
            None,
            None,
            None,
        );
    }
    AntiSplatEncoder::new(a).encode().unwrap()
}
fn camera(e: &mut Engine, x: f32, half_width: f32) -> Vec<Payload> {
    let mut world = glam::Mat4::IDENTITY;
    world.w_axis.x = x;
    let mut projection = glam::Mat4::IDENTITY;
    projection.x_axis.x = 1.0 / half_width;
    apply(e,json!({"type":"set-camera","sceneRevision":2,"worldMatrix":world.to_cols_array(),"projectionMatrix":projection.to_cols_array(),"viewportWidth":1024,"viewportHeight":1024}),&[]).unwrap()
}
fn patch_slots(out: &[Payload]) -> std::collections::BTreeSet<usize> {
    out.iter()
        .flat_map(|p| match p {
            Payload::BuffersPatched { patches, .. } => patches
                .iter()
                .flat_map(|p| p.first_slot..p.first_slot + p.slot_count)
                .collect(),
            _ => Vec::new(),
        })
        .collect()
}
#[test]
fn camera_changes_keep_resident_details_and_revisit_without_attribute_uploads() {
    let mut e = Engine::new(Config::default()).unwrap();
    handshake(&mut e, 1600, 8).unwrap();
    camera(&mut e, 1., 1.05);
    let mut r = Replica::default();
    r.receive(&load(&mut e, "row", &row_cloud(), json!({})).unwrap());
    let capacity = r.capacity;
    let initial_slots = r.active_slots.clone();
    let layout = r.layout;
    let resident = r.occupied();
    let a = r.slot(1.);
    r.receive(&camera(&mut e, 2., 1.05));
    assert_eq!(r.slot(1.), a);
    assert_eq!(r.capacity, capacity);
    assert_eq!(r.layout, layout);
    assert!(r.occupied() >= resident);
    let out = camera(&mut e, 20., 0.1);
    r.receive(&out);
    assert!(r.active > 0, "Offscreen scene retains a coarse draw cut");
    assert!(r.occupied() > r.active, "Inactive details remain resident");
    assert!(patch_slots(&out).is_empty());
    let out = camera(&mut e, 1., 1.05);
    assert!(
        patch_slots(&out).is_empty(),
        "Revisiting a cached cut uploads indices only"
    );
    r.receive(&out);
    assert_eq!(r.active_slots, initial_slots);
    assert_eq!(r.slot(1.), a);
    assert_eq!(e.timings.cache_misses, 0);
}

#[test]
fn pressure_commits_resident_fallback_before_overwriting_active_slots() {
    let mut e = Engine::new(
        serde_json::from_value(json!({"streaming":{"maxUploadBytesPerUpdate":56}})).unwrap(),
    )
    .unwrap();
    handshake(&mut e, 224, 8).unwrap();
    camera(&mut e, 0., 0.1);
    let mut r = Replica::default();
    r.receive(&load(&mut e, "row", &row_cloud(), json!({})).unwrap());
    let capacity = r.capacity;
    let mut evictions = 0;
    for x in [1., 2., 3., 4., 0., 2., 4.] {
        let out = camera(&mut e, x, 0.1);
        evictions += e.timings.evicted_gaussians;
        for payload in out {
            if let Payload::BuffersPatched { patches, .. } = &payload {
                for p in patches {
                    for slot in p.first_slot..p.first_slot + p.slot_count {
                        assert!(
                            !r.active_slots.contains(&slot),
                            "Deactivate/coarsen before slot replacement"
                        );
                    }
                }
            }
            r.receive(&[payload]);
            assert!(r.active > 0);
            assert!(r.occupied() <= capacity);
        }
    }
    assert!(evictions > 0, "Fixture must exercise cache pressure");
}

#[test]
fn none_source_writes_patch_only_modified_record_and_priority_keeps_other_cloud_slots() {
    let mut e = Engine::new(Config::default()).unwrap();
    handshake(&mut e, 1600, 8).unwrap();
    let mut r = Replica::default();
    r.receive(
        &load(
            &mut e,
            "row",
            &row_cloud(),
            json!({"mipmaps":{"type":"none"}}),
        )
        .unwrap(),
    );
    let before: Vec<_> = (0..5).map(|x| r.slot(x as f32)).collect();
    let out=apply(&mut e,json!({"type":"write-attribute-range","cloudId":"row","attribute":"means","firstGaussian":2,"gaussianCount":1,"data":[10.,0.,0.5,0.]}),&[]).unwrap();
    assert_eq!(
        patch_slots(&out),
        std::collections::BTreeSet::from([before[2]])
    );
    r.receive(&out);
    assert_eq!(r.slot(10.), before[2]);
    for x in [0, 1, 3, 4] {
        assert_eq!(r.slot(x as f32), before[x]);
    }
    let out = load(
        &mut e,
        "other",
        &KsplatEncoder::new(source(1)).encode().unwrap(),
        json!({"format":"ksplat","mipmaps":{"type":"none"}}),
    )
    .unwrap();
    r.receive(&out);
    for x in [0, 1, 3, 4] {
        assert_eq!(r.slot(x as f32), before[x]);
    }
    let out = apply(
        &mut e,
        json!({"type":"set-cloud-priority","cloudId":"other","priority":-10}),
        &[],
    )
    .unwrap();
    assert!(patch_slots(&out).is_empty());
    r.receive(&out);
    let old_slot = r.slot(10.);
    r.receive(
        &apply(
            &mut e,
            json!({"type":"unload-cloud","cloudId":"other"}),
            &[],
        )
        .unwrap(),
    );
    assert_eq!(r.slot(10.), old_slot);
    assert_eq!(r.active, 5);
    assert!(r.occupied() >= r.active);
}
#[test]
fn tree_rebuild_and_mode_switch_refresh_identity_and_all_attributes() {
    let mut e = Engine::new(Config::default()).unwrap();
    handshake(&mut e, 1600, 8).unwrap();
    camera(&mut e, 2., 10.);
    let mut r = Replica::default();
    r.receive(&load(&mut e,"row",&row_cloud(),json!({"attributes":[{"name":"tag","format":"u32","elementsPerGaussian":1,"source":{"kind":"buffer","data":[10,20,30,40,50]}}]})).unwrap());
    let out=apply(&mut e,json!({"type":"write-attribute-range","cloudId":"row","attribute":"means","firstGaussian":0,"gaussianCount":1,"data":[9.,0.,0.5,0.]}),&[]).unwrap();
    r.receive(&out);
    assert_eq!(r.active, 5);
    assert!(r.occupied() >= r.active);
    let nine = r.slot(9.);
    let Data::U32(tags) = &r.attributes.iter().find(|a| a.name == "tag").unwrap().data else {
        panic!()
    };
    assert_eq!(tags[nine], 10);
    r.receive(
        &apply(
            &mut e,
            json!({"type":"set-cloud-mipmaps","cloudId":"row","mipmaps":{"type":"none"}}),
            &[],
        )
        .unwrap(),
    );
    assert_eq!(r.active, 5);
    assert!(r.occupied() >= r.active);
    assert!(r.slot(9.) < r.capacity);
    r.receive(&apply(&mut e,json!({"type":"set-cloud-mipmaps","cloudId":"row","mipmaps":{"type":"standard","snapshot":{"maxLeaves":2}}}),&[]).unwrap());
    assert_eq!(r.active, 5);
    assert!(r.occupied() >= r.active);
    let out=apply(&mut e,json!({"type":"set-cloud-mipmaps","cloudId":"row","mipmaps":{"type":"standard","snapshot":{"maxLeaves":4}}}),&[]).unwrap();
    assert!(patch_slots(&out).is_empty());
    assert!(!out
        .iter()
        .any(|p| matches!(p, Payload::BuffersReplaced { .. })));
}
#[test]
fn capacity_shrink_relocates_only_required_owners_and_nonpartial_frontend_gets_full_data() {
    let mut e = Engine::new(Config::default()).unwrap();
    handshake(&mut e, 1600, 8).unwrap();
    camera(&mut e, 2., 0.1);
    let mut r = Replica::default();
    r.receive(&load(&mut e, "row", &row_cloud(), json!({})).unwrap());
    r.receive(&camera(&mut e, 2., 10.));
    assert_eq!(r.active, 5);
    assert!(r.capacity >= r.active);
    r.receive(&handshake(&mut e, 176, 8).unwrap());
    assert_eq!((r.capacity, r.active), (1, 1));
    assert!(r.occupied() <= 1);
    let m = glam::Mat4::IDENTITY.to_cols_array();
    let out=apply(&mut e,json!({"type":"set-frontend-capabilities","protocolVersion":2,"capabilities":{"maxBufferSize":1600,"maxStorageBufferBindingSize":1600,"maxStorageBuffersPerShaderStage":8,"supportsPartialBufferUpdates":false},"sceneRevision":3,"cameraWorldMatrix":m,"projectionMatrix":m,"viewportWidth":1024,"viewportHeight":1024,"cloudTransforms":[]}),&[]).unwrap();
    r.receive(&out);
    let out = camera(&mut e, 3., 0.1);
    assert!(out
        .iter()
        .any(|p| matches!(p, Payload::BuffersReplaced { .. })));
    r.receive(&out);
    assert!(r.occupied() >= r.active);
    assert_eq!(r.active_slots.len(), r.active);
}

#[test]
fn initial_layout_streams_bounded_records_then_commits_activation() {
    let mut e = Engine::new(
        serde_json::from_value(json!({"streaming":{"maxUploadBytesPerUpdate":112}})).unwrap(),
    )
    .unwrap();
    handshake(&mut e, 1600, 8).unwrap();
    camera(&mut e, 1., 1.05);
    let command = serde_json::from_value(
        json!({"type":"load-cloud-from-buffer","cloudId":"row","options":{"format":"splat"}}),
    )
    .unwrap();
    let initial = e.begin(command, &row_cloud()).unwrap();
    assert!(initial
        .iter()
        .any(|p| matches!(p, Payload::BuffersAllocated { .. })));
    assert!(!initial
        .iter()
        .any(|p| matches!(p, Payload::BuffersPatched { .. })));
    let mut replica = Replica::default();
    replica.receive(&initial);
    assert_eq!(replica.active, 0);
    let mut batches = 0;
    while let Some(payload) = e.next_payload() {
        let bytes = match &payload {
            Payload::BuffersPatched {
                patches,
                mipmap_pending,
                ..
            } => {
                assert!(*mipmap_pending);
                for patch in patches {
                    for slot in patch.first_slot..patch.first_slot + patch.slot_count {
                        assert!(
                            !replica.active_slots.contains(&slot),
                            "Active coarse cut is never overwritten by detail streaming"
                        );
                    }
                }
                patches
                    .iter()
                    .map(|p| match &p.data {
                        Data::F32(v) => v.len() * 4,
                        Data::U32(v) => v.len() * 4,
                    })
                    .sum()
            }
            Payload::BuffersActivated {
                added_slots,
                removed_slots,
                ..
            } => (added_slots.len() + removed_slots.len()) * 4,
            _ => panic!(),
        };
        assert!(bytes <= 112);
        replica.receive(&[payload]);
        batches += 1;
    }
    assert!(batches >= 3);
    assert!(replica.active > 0);
    let layout = replica.layout;
    let capacity = replica.capacity;
    replica.receive(&camera(&mut e, 1.5, 1.55));
    assert_eq!((replica.capacity, replica.layout), (capacity, layout));
}

#[test]
fn coarse_coverage_is_reserved_across_clouds_and_respects_combined_buffer_limit() {
    let mut e = Engine::new(Config::default()).unwrap();
    // Two object tables (320 bytes) plus two projected vec4 records (32 bytes).
    handshake(&mut e, 352, 8).unwrap();
    let bytes = AntiSplatEncoder::new(source(0)).encode().unwrap();
    let mut replica = Replica::default();
    replica.receive(&load(&mut e, "near", &bytes, json!({"priority":-10})).unwrap());
    replica.receive(&load(&mut e, "far", &bytes, json!({"priority":10})).unwrap());
    assert_eq!((replica.capacity, replica.active), (2, 2));
    assert_eq!(e.timings.pinned_gaussians, 2);
    let objects: std::collections::BTreeSet<_> = replica
        .active_slots
        .iter()
        .map(|&slot| f32_attr(&replica.attributes, "means")[slot * 4 + 3] as u32)
        .collect();
    assert_eq!(objects, [0, 1].into_iter().collect());
    replica.receive(&camera(&mut e, 100., 0.1));
    assert_eq!(replica.active, 2);
}

#[test]
fn layout_replacement_repopulates_inactive_cache_and_activates_coarse_before_details() {
    let mut e = Engine::new(
        serde_json::from_value(json!({"streaming":{"maxUploadBytesPerUpdate":56}})).unwrap(),
    )
    .unwrap();
    handshake(&mut e, 1600, 8).unwrap();
    camera(&mut e, 2., 10.);
    let mut r = Replica::default();
    r.receive(&load(&mut e, "row", &row_cloud(), json!({})).unwrap());
    r.receive(&camera(&mut e, 100., 0.1));
    assert!(r.occupied() > r.active);
    let resident = r.occupied();
    let old_slots: std::collections::BTreeSet<_> = (0..r.capacity)
        .filter(|&slot| f32_attr(&r.attributes, "means")[slot * 4 + 3] == 0.)
        .collect();
    let out = load(&mut e, "other", &row_cloud(), json!({})).unwrap();
    let first_activation = out
        .iter()
        .position(|p| matches!(p, Payload::BuffersActivated { commit: true, .. }))
        .unwrap();
    let last_patch = out
        .iter()
        .rposition(|p| matches!(p, Payload::BuffersPatched { .. }))
        .unwrap();
    assert!(first_activation < last_patch);
    r.receive(&out);
    assert!(r.occupied() >= resident);
    let out = camera(&mut e, 2., 10.);
    assert!(
        patch_slots(&out).is_disjoint(&old_slots),
        "Inactive cache survived the new object layout"
    );
    r.receive(&out);
    assert_eq!(r.active, 10);
}

fn compact_handshake(e: &mut Engine, limit: usize) {
    let m = [
        1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1.,
    ];
    let mut projection = m;
    projection[0] = 0.1;
    projection[5] = 0.1;
    apply(e, json!({"type":"set-frontend-capabilities","protocolVersion":2,"capabilities":{"maxBufferSize":limit,"maxStorageBufferBindingSize":limit,"maxStorageBuffersPerShaderStage":8,"supportsPartialBufferUpdates":true,"supportsCompactGaussians":true},"sceneRevision":1,"cameraWorldMatrix":m,"projectionMatrix":projection,"viewportWidth":1024,"viewportHeight":1024,"cloudTransforms":[]}), &[]).unwrap();
}
fn u32_attr<'a>(attrs: &'a [Attribute], name: &str) -> &'a [u32] {
    match &attrs.iter().find(|a| a.name == name).unwrap().data {
        Data::U32(v) => v,
        _ => panic!(),
    }
}
#[test]
fn compact_geometry_matches_spark_ext_precision_and_keeps_float32_snapshot() {
    let mut source = GsplatArray::new();
    for (position, scale, quat) in [
        (
            Vec3A::new(123456.75, -0.000123, 32.5),
            Vec3A::new(1e-8, 1.234, 1e5),
            Quat::from_rotation_y(2.4),
        ),
        (Vec3A::new(-2., 0., 0.), Vec3A::splat(0.2), Quat::IDENTITY),
    ] {
        source.push_splat(
            Gsplat::new(position, 0.73, Vec3A::splat(0.5), scale, quat),
            None,
            None,
            None,
        );
    }
    let bytes = AntiSplatEncoder::new(source).encode().unwrap();
    let mut plain = Engine::new(Config::default()).unwrap();
    handshake(&mut plain, 10000, 8).unwrap();
    let mut compact = Engine::new(Config::default()).unwrap();
    compact_handshake(&mut compact, 10000);
    let mut p = Replica::default();
    p.receive(&load(&mut plain, "x", &bytes, json!({"mipmaps":{"type":"none"}})).unwrap());
    let mut c = Replica::default();
    c.receive(
        &load(
            &mut compact,
            "x",
            &bytes,
            json!({"mipmaps":{"type":"none"}}),
        )
        .unwrap(),
    );
    assert_eq!(
        f32_attr(&p.attributes, "means"),
        f32_attr(&c.attributes, "means")
    );
    assert_eq!(
        u32_attr(&p.attributes, "shCoefficients"),
        u32_attr(&c.attributes, "shCoefficients")
    );
    let shape = u32_attr(&c.attributes, "scalesOpacity");
    let rotations = u32_attr(&c.attributes, "rotations");
    assert_eq!(shape.len(), c.capacity * 2);
    assert_eq!(rotations.len(), c.capacity);
    for &slot in &c.active_slots {
        let x = shape[slot * 2];
        let y = shape[slot * 2 + 1];
        let ext = [
            0,
            (x & 0xffff) << 16,
            (x >> 16) | ((y & 0xffff) << 16),
            rotations[slot],
        ];
        let decoded_scale = spark_lib::splat_encode::decode_ext_splat_scale(&ext);
        for (axis, value) in decoded_scale.iter().enumerate() {
            let expected = f32_attr(&p.attributes, "scalesOpacity")[slot * 4 + axis];
            assert!((value / expected - 1.0).abs() < 0.01);
        }
        let opacity = spark_lib::splat_encode::decode_ext_splat_opacity(&[0, 0, 0, y >> 16]);
        assert!((opacity - f32_attr(&p.attributes, "scalesOpacity")[slot * 4 + 3]).abs() < 0.001);
        let decoded = Quat::from_array(spark_lib::splat_encode::decode_quat_oct101012(
            rotations[slot],
        ));
        let expected = Quat::from_array(
            f32_attr(&p.attributes, "rotations")[slot * 4..slot * 4 + 4]
                .try_into()
                .unwrap(),
        );
        assert!(decoded.dot(expected).abs() > 0.99999);
    }
    let out = load(
        &mut compact,
        "tree",
        &bytes,
        json!({"mipmaps":{"type":"standard","snapshot":{"maxLeaves":2}}}),
    )
    .unwrap();
    let snap = snapshot(&out);
    assert_eq!(
        snap.attributes
            .iter()
            .find(|a| a.name == "scalesOpacity")
            .unwrap()
            .format,
        "f32"
    );
}
#[test]
fn prefetch_fills_tree_in_bounded_batches_without_changing_the_draw_cut() {
    let mut e = Engine::new(
        serde_json::from_value(json!({"streaming":{"maxUploadBytesPerUpdate":96}})).unwrap(),
    )
    .unwrap();
    compact_handshake(&mut e, 10000);
    camera(&mut e, 100., 0.1);
    let mut r = Replica::default();
    r.receive(&load(&mut e, "row", &row_cloud(), json!({})).unwrap());
    let active = r.active_slots.clone();
    let layout = r.layout;
    assert!(r.occupied() < r.capacity);
    for _ in 0..1000 {
        let out = apply(&mut e, json!({"type":"prefetch-cache"}), &[]).unwrap();
        for p in &out {
            match p {
                Payload::BuffersPatched {
                    patches,
                    mipmap_pending,
                    ..
                } => {
                    assert!(!mipmap_pending);
                    let bytes: usize = patches
                        .iter()
                        .map(|p| match &p.data {
                            Data::F32(v) => v.len() * 4,
                            Data::U32(v) => v.len() * 4,
                        })
                        .sum();
                    assert!(bytes <= 96);
                    assert!(patch_slots(&out).is_disjoint(&active));
                }
                _ => panic!("Prefetch must not activate slots or replace the layout"),
            }
        }
        r.receive(&out);
        assert_eq!(r.active_slots, active);
        assert_eq!(r.layout, layout);
        if !e.timings.prefetch_pending {
            break;
        }
    }
    assert_eq!(r.occupied(), r.capacity);
    for (x, projection) in [(2., 10.), (8., 10.), (100., 0.1), (-2., 10.)] {
        let out = camera(&mut e, x, projection);
        assert!(patch_slots(&out).is_empty());
        assert_eq!(e.timings.cache_misses, 0);
        assert_eq!(e.timings.evicted_gaussians, 0);
        r.receive(&out);
        assert_eq!(r.layout, layout);
    }
}
#[test]
fn prefetch_stops_at_capacity_and_never_evicts_a_resident_node() {
    let mut e = Engine::new(Config::default()).unwrap();
    compact_handshake(&mut e, 352);
    camera(&mut e, 100., 0.1);
    let mut r = Replica::default();
    r.receive(&load(&mut e, "row", &row_cloud(), json!({})).unwrap());
    let old: std::collections::BTreeSet<_> = (0..r.capacity)
        .filter(|&slot| f32_attr(&r.attributes, "means")[slot * 4 + 3] >= 0.)
        .collect();
    for _ in 0..100 {
        let out = apply(&mut e, json!({"type":"prefetch-cache"}), &[]).unwrap();
        assert!(patch_slots(&out).is_disjoint(&old));
        assert_eq!(e.timings.evicted_gaussians, 0);
        r.receive(&out);
        if !e.timings.prefetch_pending {
            break;
        }
    }
    assert_eq!(r.occupied(), r.capacity);
    assert!(apply(&mut e, json!({"type":"prefetch-cache"}), &[])
        .unwrap()
        .is_empty());
}
