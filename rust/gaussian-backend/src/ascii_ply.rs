//! Spark supports binary PLY. Preserve the project's ASCII PLY support by
//! converting scalar records before handing the file to its decoder.
use anyhow::{bail, ensure, Context, Result};

pub fn normalize(bytes: &[u8]) -> Result<Option<Vec<u8>>> {
    if !bytes.starts_with(b"ply\n") && !bytes.starts_with(b"ply\r\n") {
        return Ok(None);
    }
    let marker = b"end_header";
    let Some(end) = bytes.windows(marker.len()).position(|v| v == marker) else {
        return Ok(None);
    };
    let line_end = bytes[end..]
        .iter()
        .position(|&v| v == b'\n')
        .context("Incomplete PLY header")?
        + end
        + 1;
    let header = std::str::from_utf8(&bytes[..line_end])?;
    if !header.lines().any(|line| line.trim() == "format ascii 1.0") {
        return Ok(None);
    }
    let mut elements: Vec<(usize, Vec<String>)> = Vec::new();
    for line in header.lines() {
        let words: Vec<_> = line.split_whitespace().collect();
        match words.first().copied() {
            Some("element") => {
                ensure!(words.len() == 3, "Invalid PLY element");
                elements.push((words[2].parse()?, Vec::new()));
            }
            Some("property") => {
                ensure!(
                    words.len() == 3,
                    "ASCII PLY list properties are not supported"
                );
                elements
                    .last_mut()
                    .context("PLY property before element")?
                    .1
                    .push(words[1].into());
            }
            _ => (),
        }
    }
    let mut output = Vec::new();
    for line in header.lines() {
        output.extend_from_slice(if line.trim() == "format ascii 1.0" {
            b"format binary_little_endian 1.0"
        } else {
            line.trim_end().as_bytes()
        });
        output.push(b'\n');
    }
    let mut tokens = std::str::from_utf8(&bytes[line_end..])?.split_whitespace();
    for (count, properties) in elements {
        for _ in 0..count {
            for ty in &properties {
                let value = tokens.next().context("Truncated ASCII PLY")?;
                match ty.as_str() {
                    "float" | "float32" => {
                        output.extend_from_slice(&value.parse::<f32>()?.to_le_bytes())
                    }
                    "double" | "float64" => {
                        output.extend_from_slice(&value.parse::<f64>()?.to_le_bytes())
                    }
                    "char" | "int8" => output.push(value.parse::<i8>()? as u8),
                    "uchar" | "uint8" => output.push(value.parse::<u8>()?),
                    "short" | "int16" => {
                        output.extend_from_slice(&value.parse::<i16>()?.to_le_bytes())
                    }
                    "ushort" | "uint16" => {
                        output.extend_from_slice(&value.parse::<u16>()?.to_le_bytes())
                    }
                    "int" | "int32" => {
                        output.extend_from_slice(&value.parse::<i32>()?.to_le_bytes())
                    }
                    "uint" | "uint32" => {
                        output.extend_from_slice(&value.parse::<u32>()?.to_le_bytes())
                    }
                    _ => bail!("Unknown PLY scalar type {ty}"),
                }
            }
        }
    }
    ensure!(tokens.next().is_none(), "Unexpected ASCII PLY data");
    Ok(Some(output))
}
