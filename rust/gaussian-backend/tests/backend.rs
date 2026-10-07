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
    handshake(&mut e, 32, 8).unwrap();
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
    let Payload::BuffersReplaced {
        count,
        capacity,
        clouds,
        attributes,
        ..
    } = second.last().unwrap()
    else {
        panic!()
    };
    assert_eq!((*count, *capacity), (2, 2));
    assert_eq!(
        clouds
            .iter()
            .find(|c| c.cloud_id == "first")
            .unwrap()
            .rendered_count,
        0
    );
    assert_eq!(f32_attr(attributes, "means")[3], 1.0);
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
    handshake(&mut e, 16, 5).unwrap();
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
    handshake(&mut e, 16, 8).unwrap();
    let out = load(
        &mut e,
        "cloud",
        &bytes,
        json!({"mipmaps":{"type":"standard"}}),
    )
    .unwrap();
    let Payload::BuffersReplaced {
        count, attributes, ..
    } = out.last().unwrap()
    else {
        panic!()
    };
    assert_eq!(*count, 1);
    assert!(f32_attr(attributes, "means")[0].abs() < 0.01);
    let out = apply(
        &mut e,
        json!({"type":"set-cloud-mipmaps","cloudId":"cloud","mipmaps":{"type":"none"}}),
        &[],
    )
    .unwrap();
    let Payload::BuffersPatched { patches, .. } = out.last().unwrap() else {
        panic!()
    };
    let Data::F32(v) = &patches.iter().find(|p| p.name == "means").unwrap().data else {
        panic!()
    };
    assert_eq!(v[0], -2.0);
}
