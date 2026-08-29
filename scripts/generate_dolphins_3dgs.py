#!/usr/bin/env python3
"""Convert Three.js' colored dolphin mesh into a deterministic degree-0 3DGS PLY."""

from __future__ import annotations

import argparse
import bisect
import math
import random
import struct
from pathlib import Path

SH_C0 = 0.28209479177387814
DEFAULT_SPLAT_COUNT = 60_000
RANDOM_SEED = 20_260_829
DOLPHIN_COLOR = (0.30, 0.52, 0.62)
LIGHT_DIRECTION = (0.35, 0.75, 0.56)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--count", type=int, default=DEFAULT_SPLAT_COUNT)
    return parser.parse_args()


def load_ascii_mesh(path: Path) -> tuple[list[tuple[float, ...]], list[tuple[int, int, int]]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    try:
        header_end = lines.index("end_header")
    except ValueError as error:
        raise ValueError("PLY header has no end_header") from error

    vertex_count = header_value(lines[:header_end], "element vertex")
    face_count = header_value(lines[:header_end], "element face")
    vertex_lines = lines[header_end + 1 : header_end + 1 + vertex_count]
    face_lines = lines[
        header_end + 1 + vertex_count : header_end + 1 + vertex_count + face_count
    ]

    vertices = []
    for line in vertex_lines:
        x, y, z, _red, _green, _blue, _alpha = map(float, line.split())
        vertices.append((x, y, z))

    faces = []
    for line in face_lines:
        values = [int(value) for value in line.split()]
        if values[0] != 3:
            raise ValueError("Only triangular faces are supported")
        faces.append((values[1], values[2], values[3]))
    return normalize(vertices), faces


def header_value(lines: list[str], prefix: str) -> int:
    for line in lines:
        if line.startswith(prefix):
            return int(line.split()[-1])
    raise ValueError(f"PLY header has no {prefix!r}")


def normalize(vertices: list[tuple[float, ...]]) -> list[tuple[float, ...]]:
    xs = [vertex[0] for vertex in vertices]
    ys = [vertex[1] for vertex in vertices]
    zs = [vertex[2] for vertex in vertices]
    center = (
        (min(xs) + max(xs)) * 0.5,
        (min(ys) + max(ys)) * 0.5,
        (min(zs) + max(zs)) * 0.5,
    )
    extent = max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))
    scale = 2.0 / extent
    return [
        (
            (x - center[0]) * scale,
            (y - center[1]) * scale,
            (z - center[2]) * scale,
        )
        for x, y, z in vertices
    ]


def subtract(left: tuple[float, ...], right: tuple[float, ...]) -> tuple[float, float, float]:
    return (left[0] - right[0], left[1] - right[1], left[2] - right[2])


def cross(left: tuple[float, float, float], right: tuple[float, float, float]) -> tuple[float, float, float]:
    return (
        left[1] * right[2] - left[2] * right[1],
        left[2] * right[0] - left[0] * right[2],
        left[0] * right[1] - left[1] * right[0],
    )


def length(vector: tuple[float, float, float]) -> float:
    return math.sqrt(sum(component * component for component in vector))


def normalized(vector: tuple[float, float, float]) -> tuple[float, float, float]:
    magnitude = length(vector)
    if magnitude == 0:
        return (1.0, 0.0, 0.0)
    return tuple(component / magnitude for component in vector)  # type: ignore[return-value]


def dolphin_color(normal: tuple[float, float, float]) -> tuple[float, float, float]:
    light = normalized(LIGHT_DIRECTION)
    diffuse = abs(
        sum(
            component * light_component
            for component, light_component in zip(normal, light)
        )
    )
    brightness = 0.72 + diffuse * 0.28
    return tuple(  # type: ignore[return-value]
        min(component * brightness, 1.0) for component in DOLPHIN_COLOR
    )


def quaternion_from_basis(
    tangent: tuple[float, float, float],
    bitangent: tuple[float, float, float],
    normal: tuple[float, float, float],
) -> tuple[float, float, float, float]:
    # The basis vectors are columns; canonical PLY stores the quaternion as wxyz.
    m00, m10, m20 = tangent
    m01, m11, m21 = bitangent
    m02, m12, m22 = normal
    trace = m00 + m11 + m22
    if trace > 0:
        s = math.sqrt(trace + 1.0) * 2.0
        return (0.25 * s, (m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s)
    if m00 > m11 and m00 > m22:
        s = math.sqrt(1.0 + m00 - m11 - m22) * 2.0
        return ((m21 - m12) / s, 0.25 * s, (m01 + m10) / s, (m02 + m20) / s)
    if m11 > m22:
        s = math.sqrt(1.0 + m11 - m00 - m22) * 2.0
        return ((m02 - m20) / s, (m01 + m10) / s, 0.25 * s, (m12 + m21) / s)
    s = math.sqrt(1.0 + m22 - m00 - m11) * 2.0
    return ((m10 - m01) / s, (m02 + m20) / s, (m12 + m21) / s, 0.25 * s)


def write_gaussians(
    destination: Path,
    vertices: list[tuple[float, ...]],
    faces: list[tuple[int, int, int]],
    count: int,
) -> None:
    if count <= 0:
        raise ValueError("Splat count must be positive")

    areas = []
    cumulative_areas = []
    total_area = 0.0
    for ia, ib, ic in faces:
        edge_ab = subtract(vertices[ib], vertices[ia])
        edge_ac = subtract(vertices[ic], vertices[ia])
        area = length(cross(edge_ab, edge_ac)) * 0.5
        areas.append(area)
        total_area += area
        cumulative_areas.append(total_area)

    spacing = math.sqrt(total_area / count)
    scale_xy = math.log(spacing * 0.75)
    scale_z = math.log(spacing * 0.15)
    opacity = 4.0
    random_generator = random.Random(RANDOM_SEED)
    destination.parent.mkdir(parents=True, exist_ok=True)

    header = "\n".join(
        [
            "ply",
            "format binary_little_endian 1.0",
            "comment derived from Three.js examples/models/ply/ascii/dolphins_colored.ply",
            "comment source license MIT; see THIRD_PARTY_LICENSES.md",
            f"element vertex {count}",
            "property float x",
            "property float y",
            "property float z",
            "property float f_dc_0",
            "property float f_dc_1",
            "property float f_dc_2",
            "property float opacity",
            "property float scale_0",
            "property float scale_1",
            "property float scale_2",
            "property float rot_0",
            "property float rot_1",
            "property float rot_2",
            "property float rot_3",
            "end_header",
            "",
        ]
    ).encode("ascii")

    record = struct.Struct("<14f")
    with destination.open("wb") as output:
        output.write(header)
        for _ in range(count):
            face_index = bisect.bisect_left(
                cumulative_areas, random_generator.random() * total_area
            )
            ia, ib, ic = faces[min(face_index, len(faces) - 1)]
            a, b, c = vertices[ia], vertices[ib], vertices[ic]

            root_u = math.sqrt(random_generator.random())
            weight_a = 1.0 - root_u
            weight_b = root_u * (1.0 - random_generator.random())
            weight_c = 1.0 - weight_a - weight_b
            position = tuple(
                a[index] * weight_a + b[index] * weight_b + c[index] * weight_c
                for index in range(3)
            )

            tangent = normalized(subtract(b, a))
            normal = normalized(cross(subtract(b, a), subtract(c, a)))
            bitangent = normalized(cross(normal, tangent))
            rotation = quaternion_from_basis(tangent, bitangent, normal)
            color = tuple((component - 0.5) / SH_C0 for component in dolphin_color(normal))
            output.write(
                record.pack(
                    position[0],
                    position[1],
                    position[2],
                    color[0],
                    color[1],
                    color[2],
                    opacity,
                    scale_xy,
                    scale_xy,
                    scale_z,
                    rotation[0],
                    rotation[1],
                    rotation[2],
                    rotation[3],
                )
            )


def main() -> None:
    arguments = parse_arguments()
    vertices, faces = load_ascii_mesh(arguments.source)
    write_gaussians(arguments.destination, vertices, faces, arguments.count)


if __name__ == "__main__":
    main()
