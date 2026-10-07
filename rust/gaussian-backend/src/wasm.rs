use crate::{Attribute, Command, Config, Data, Engine, Payload, Snapshot};
use js_sys::{Array, Float32Array, Reflect, Uint32Array};
use wasm_bindgen::prelude::*;

fn error(e: impl std::fmt::Display) -> JsValue {
    js_sys::Error::new(&e.to_string()).into()
}
fn set(target: &JsValue, key: &str, value: &JsValue) -> Result<(), JsValue> {
    Reflect::set(target, &key.into(), value).map(|_| ())
}
fn data(value: &Data) -> JsValue {
    match value {
        Data::F32(v) => Float32Array::from(v.as_slice()).buffer().into(),
        Data::U32(v) => Uint32Array::from(v.as_slice()).buffer().into(),
    }
}
fn attributes(values: &[Attribute]) -> Result<JsValue, JsValue> {
    let array = Array::new();
    for a in values {
        let value = serde_wasm_bindgen::to_value(a).map_err(error)?;
        set(&value, "data", &data(&a.data))?;
        array.push(&value);
    }
    Ok(array.into())
}
fn snapshot(s: &Option<Snapshot>) -> Result<JsValue, JsValue> {
    let Some(s) = s else {
        return Ok(JsValue::NULL);
    };
    let value = serde_wasm_bindgen::to_value(s).map_err(error)?;
    set(&value, "attributes", &attributes(&s.attributes)?)?;
    set(
        &value,
        "nodeBounds",
        &Float32Array::from(s.node_bounds.as_slice()).buffer().into(),
    )?;
    set(
        &value,
        "nodeChildren",
        &Uint32Array::from(s.node_children.as_slice())
            .buffer()
            .into(),
    )?;
    Ok(value)
}
fn payload(p: &Payload) -> Result<JsValue, JsValue> {
    let value = serde_wasm_bindgen::to_value(p).map_err(error)?;
    match p {
        Payload::CloudLoaded {
            mipmap_snapshot, ..
        } => set(&value, "mipmapSnapshot", &snapshot(mipmap_snapshot)?)?,
        Payload::MipmapSnapshotReplaced { snapshot: s, .. } => {
            set(&value, "snapshot", &snapshot(s)?)?
        }
        Payload::BuffersReplaced { attributes: a, .. } => {
            set(&value, "attributes", &attributes(a)?)?
        }
        Payload::BuffersPatched { patches, .. } => {
            let array = Array::new();
            for p in patches {
                let patch = serde_wasm_bindgen::to_value(p).map_err(error)?;
                set(&patch, "data", &data(&p.data))?;
                array.push(&patch);
            }
            set(&value, "patches", &array.into())?;
        }
        _ => {}
    }
    Ok(value)
}

#[wasm_bindgen]
pub struct GaussianEngine {
    inner: Engine,
}

#[wasm_bindgen]
impl GaussianEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<GaussianEngine, JsValue> {
        let config: Config = serde_wasm_bindgen::from_value(config).map_err(error)?;
        Ok(Self {
            inner: Engine::new(config).map_err(error)?,
        })
    }
    /// TS handles fetching/transport only; commands and all scene computation
    /// execute here. Returned ArrayBuffers are copies owned by the protocol.
    pub fn apply(&mut self, command: JsValue, bytes: &[u8]) -> Result<Array, JsValue> {
        let command: Command = serde_wasm_bindgen::from_value(command).map_err(error)?;
        let output = self.inner.apply(command, bytes).map_err(error)?;
        let result = Array::new();
        for p in output {
            result.push(&payload(&p)?);
        }
        Ok(result)
    }
}
