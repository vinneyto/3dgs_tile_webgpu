import { StorageBufferAttribute } from "three/webgpu";
import { GaussianData } from "./GaussianData";

type PlyFormat = "ascii" | "binary_little_endian" | "binary_big_endian";
type PlyScalarType =
  | "char"
  | "uchar"
  | "short"
  | "ushort"
  | "int"
  | "uint"
  | "float"
  | "double"
  | "int8"
  | "uint8"
  | "int16"
  | "uint16"
  | "int32"
  | "uint32"
  | "float32"
  | "float64";

interface PlyProperty {
  name: string;
  type: PlyScalarType;
  byteOffset: number;
}

interface PlyHeader {
  format: PlyFormat;
  vertexCount: number;
  properties: PlyProperty[];
  vertexStride: number;
  dataOffset: number;
}

const TYPE_SIZE: Record<PlyScalarType, number> = {
  char: 1,
  uchar: 1,
  short: 2,
  ushort: 2,
  int: 4,
  uint: 4,
  float: 4,
  double: 8,
  int8: 1,
  uint8: 1,
  int16: 2,
  uint16: 2,
  int32: 4,
  uint32: 4,
  float32: 4,
  float64: 8,
};

const REQUIRED_PROPERTIES = [
  "x",
  "y",
  "z",
  "scale_0",
  "scale_1",
  "scale_2",
  "rot_0",
  "rot_1",
  "rot_2",
  "rot_3",
  "opacity",
  "f_dc_0",
  "f_dc_1",
  "f_dc_2",
] as const;

export class CanonicalGaussianPlyLoader {
  async load(url: string): Promise<GaussianData> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load PLY: ${response.status} ${response.statusText}`,
      );
    }
    return this.parse(await response.arrayBuffer());
  }

  parse(buffer: ArrayBuffer): GaussianData {
    const header = parseHeader(buffer);
    const propertyIndices = new Map(
      header.properties.map((property, index) => [property.name, index]),
    );
    for (const name of REQUIRED_PROPERTIES) {
      if (!propertyIndices.has(name)) {
        throw new Error(`Not a canonical 3DGS PLY: missing property ${name}`);
      }
    }

    const restIndices = header.properties
      .map((property) => property.name.match(/^f_rest_(\d+)$/)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number)
      .sort((left, right) => left - right);
    for (let index = 0; index < restIndices.length; index++) {
      if (restIndices[index] !== index) {
        throw new Error("f_rest_* properties must be contiguous from f_rest_0");
      }
    }
    if (restIndices.length % 3 !== 0) {
      throw new Error("f_rest_* property count must be divisible by three");
    }
    const restPerChannel = restIndices.length / 3;
    const coefficientCount = restPerChannel + 1;
    const shLevels = Math.sqrt(coefficientCount);
    if (!Number.isInteger(shLevels) || shLevels < 1 || shLevels > 4) {
      throw new Error(
        "PLY must contain one, four, nine, or sixteen SH coefficients per channel",
      );
    }

    const read = createVertexReader(buffer, header);
    const property = (name: string): number => propertyIndices.get(name)!;
    const restProperties = restIndices.map((index) =>
      property(`f_rest_${index}`),
    );
    const count = header.vertexCount;
    const means = new Float32Array(count * 4);
    const scalesOpacity = new Float32Array(count * 4);
    const rotations = new Float32Array(count * 4);
    const shCoefficients = new Float32Array(count * coefficientCount * 4);

    for (let gaussian = 0; gaussian < count; gaussian++) {
      const vectorOffset = gaussian * 4;
      means[vectorOffset] = read(gaussian, property("x"));
      means[vectorOffset + 1] = read(gaussian, property("y"));
      means[vectorOffset + 2] = read(gaussian, property("z"));

      scalesOpacity[vectorOffset] = Math.max(
        Math.exp(read(gaussian, property("scale_0"))),
        1e-6,
      );
      scalesOpacity[vectorOffset + 1] = Math.max(
        Math.exp(read(gaussian, property("scale_1"))),
        1e-6,
      );
      scalesOpacity[vectorOffset + 2] = Math.max(
        Math.exp(read(gaussian, property("scale_2"))),
        1e-6,
      );
      const opacityRaw = read(gaussian, property("opacity"));
      scalesOpacity[vectorOffset + 3] = 1 / (1 + Math.exp(-opacityRaw));

      const w = read(gaussian, property("rot_0"));
      const x = read(gaussian, property("rot_1"));
      const y = read(gaussian, property("rot_2"));
      const z = read(gaussian, property("rot_3"));
      const quaternionLength = Math.hypot(x, y, z, w);
      if (quaternionLength > 1e-12) {
        rotations[vectorOffset] = x / quaternionLength;
        rotations[vectorOffset + 1] = y / quaternionLength;
        rotations[vectorOffset + 2] = z / quaternionLength;
        rotations[vectorOffset + 3] = w / quaternionLength;
      } else {
        rotations[vectorOffset + 3] = 1;
      }

      const shBase = gaussian * coefficientCount * 4;
      shCoefficients[shBase] = read(gaussian, property("f_dc_0"));
      shCoefficients[shBase + 1] = read(gaussian, property("f_dc_1"));
      shCoefficients[shBase + 2] = read(gaussian, property("f_dc_2"));
      for (let coefficient = 1; coefficient < coefficientCount; coefficient++) {
        const destination = shBase + coefficient * 4;
        const source = coefficient - 1;
        for (let channel = 0; channel < 3; channel++) {
          const sourceProperty =
            restProperties[channel * restPerChannel + source]!;
          shCoefficients[destination + channel] = read(
            gaussian,
            sourceProperty,
          );
        }
      }
    }

    return new GaussianData(
      {
        means: createAttribute("ply.means", means),
        scalesOpacity: createAttribute("ply.scales-opacity", scalesOpacity),
        rotations: createAttribute("ply.rotations-xyzw", rotations),
        shCoefficients: createAttribute("ply.sh-coefficients", shCoefficients),
      },
      {
        count,
        shDegree: (shLevels - 1) as 0 | 1 | 2 | 3,
        ownsBuffers: true,
      },
    );
  }
}

function createAttribute(
  name: string,
  values: Float32Array,
): StorageBufferAttribute {
  const attribute = new StorageBufferAttribute(values, 4);
  attribute.name = name;
  return attribute;
}

function parseHeader(buffer: ArrayBuffer): PlyHeader {
  const bytes = new Uint8Array(buffer);
  const marker = new TextEncoder().encode("end_header");
  let markerOffset = -1;
  for (let offset = 0; offset <= bytes.length - marker.length; offset++) {
    let matches = true;
    for (let index = 0; index < marker.length; index++) {
      if (bytes[offset + index] !== marker[index]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      markerOffset = offset;
      break;
    }
  }
  if (markerOffset < 0) throw new Error("Invalid PLY: end_header is missing");

  let dataOffset = markerOffset + marker.length;
  if (bytes[dataOffset] === 13) dataOffset++;
  if (bytes[dataOffset] !== 10) {
    throw new Error("Invalid PLY: end_header must terminate a line");
  }
  dataOffset++;
  const headerText = new TextDecoder().decode(bytes.subarray(0, dataOffset));
  const lines = headerText.split(/\r?\n/);
  if (lines[0]?.trim() !== "ply") throw new Error("Invalid PLY signature");

  let format: PlyFormat | null = null;
  let currentElement = "";
  let vertexCount = -1;
  let vertexStride = 0;
  const properties: PlyProperty[] = [];
  const elementOrder: Array<{ name: string; count: number }> = [];
  for (const sourceLine of lines) {
    const tokens = sourceLine.trim().split(/\s+/);
    if (tokens[0] === "format") {
      if (
        tokens[1] !== "ascii" &&
        tokens[1] !== "binary_little_endian" &&
        tokens[1] !== "binary_big_endian"
      ) {
        throw new Error(`Unsupported PLY format: ${tokens[1] ?? "unknown"}`);
      }
      format = tokens[1];
    } else if (tokens[0] === "element") {
      currentElement = tokens[1] ?? "";
      const count = Number(tokens[2]);
      if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Invalid element count for ${currentElement}`);
      }
      elementOrder.push({ name: currentElement, count });
      if (currentElement === "vertex") vertexCount = count;
    } else if (tokens[0] === "property" && currentElement === "vertex") {
      if (tokens[1] === "list") {
        throw new Error(
          "List properties are not supported in the vertex element",
        );
      }
      const type = tokens[1] as PlyScalarType;
      const name = tokens[2];
      if (!(type in TYPE_SIZE) || name === undefined) {
        throw new Error(`Unsupported vertex property: ${sourceLine}`);
      }
      properties.push({ name, type, byteOffset: vertexStride });
      vertexStride += TYPE_SIZE[type];
    }
  }

  if (format === null) throw new Error("Invalid PLY: format is missing");
  if (vertexCount <= 0) throw new Error("PLY must contain at least one vertex");
  const firstNonEmptyElement = elementOrder.find(
    (element) => element.count > 0,
  );
  if (firstNonEmptyElement?.name !== "vertex") {
    throw new Error("The canonical 3DGS vertex element must be first");
  }
  return { format, vertexCount, properties, vertexStride, dataOffset };
}

function createVertexReader(
  buffer: ArrayBuffer,
  header: PlyHeader,
): (vertex: number, property: number) => number {
  if (header.format === "ascii") {
    const text = new TextDecoder().decode(
      new Uint8Array(buffer, header.dataOffset),
    );
    const values = new Float64Array(
      header.vertexCount * header.properties.length,
    );
    let cursor = 0;
    for (let index = 0; index < values.length; index++) {
      while (cursor < text.length && /\s/.test(text[cursor]!)) cursor++;
      const start = cursor;
      while (cursor < text.length && !/\s/.test(text[cursor]!)) cursor++;
      const value = Number(text.slice(start, cursor));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ASCII PLY value at scalar ${index}`);
      }
      values[index] = value;
    }
    return (vertex, property) =>
      values[vertex * header.properties.length + property]!;
  }

  const expectedEnd =
    header.dataOffset + header.vertexCount * header.vertexStride;
  if (expectedEnd > buffer.byteLength) {
    throw new Error("Binary PLY ends before the vertex data is complete");
  }
  const view = new DataView(buffer);
  const littleEndian = header.format === "binary_little_endian";
  return (vertex, propertyIndex) => {
    const property = header.properties[propertyIndex]!;
    const offset =
      header.dataOffset + vertex * header.vertexStride + property.byteOffset;
    return readScalar(view, offset, property.type, littleEndian);
  };
}

function readScalar(
  view: DataView,
  offset: number,
  type: PlyScalarType,
  littleEndian: boolean,
): number {
  switch (type) {
    case "char":
    case "int8":
      return view.getInt8(offset);
    case "uchar":
    case "uint8":
      return view.getUint8(offset);
    case "short":
    case "int16":
      return view.getInt16(offset, littleEndian);
    case "ushort":
    case "uint16":
      return view.getUint16(offset, littleEndian);
    case "int":
    case "int32":
      return view.getInt32(offset, littleEndian);
    case "uint":
    case "uint32":
      return view.getUint32(offset, littleEndian);
    case "float":
    case "float32":
      return view.getFloat32(offset, littleEndian);
    case "double":
    case "float64":
      return view.getFloat64(offset, littleEndian);
  }
}
