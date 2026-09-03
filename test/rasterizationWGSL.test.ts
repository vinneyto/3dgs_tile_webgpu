import { describe, expect, it } from "vitest";
import {
  countRasterChunksWGSL,
  emitRasterChunkTasksWGSL,
  maxRasterChunkTasks,
  prepareRasterChunkDispatchWGSL,
  validateRasterChunkSize,
} from "../src/kernels/rasterChunks";
import { compactMortonBitsWGSL } from "../src/kernels/rasterHelpers";

describe("rasterizationWGSL", () => {
  it("maps each tile lane to a unique Morton-ordered pixel", () => {
    const compactBits = (value: number): number => {
      let result = value & 0x55555555;
      result = (result | (result >>> 1)) & 0x33333333;
      result = (result | (result >>> 2)) & 0x0f0f0f0f;
      result = (result | (result >>> 4)) & 0x00ff00ff;
      return (result | (result >>> 8)) & 0x0000ffff;
    };
    const coordinates = Array.from(
      { length: 256 },
      (_, lane): [number, number] => [
        compactBits(lane),
        compactBits(lane >>> 1),
      ],
    );

    expect(new Set(coordinates.map(([x, y]) => `${x},${y}`)).size).toBe(256);
    expect(Math.max(...coordinates.map(([x]) => x))).toBe(15);
    expect(Math.max(...coordinates.map(([, y]) => y))).toBe(15);

    const firstSubgroup = coordinates.slice(0, 32);
    expect(Math.max(...firstSubgroup.map(([x]) => x))).toBe(7);
    expect(Math.max(...firstSubgroup.map(([, y]) => y))).toBe(3);

    expect(compactMortonBitsWGSL).toContain("fn compact_morton_bits_16");
  });

  it("bounds and emits only overflow chunk tasks", () => {
    const capacity = 256 * 65_535;
    const chunkSize = 8_192;
    const taskCapacity = maxRasterChunkTasks(capacity, chunkSize);

    expect(taskCapacity).toBe(4_096);
    expect(countRasterChunksWGSL).toContain("raster_count > chunk_size");
    expect(prepareRasterChunkDispatchWGSL).toContain(
      "vec4<u32>(count, 1u, 1u, 0u)",
    );
    expect(emitRasterChunkTasksWGSL).toContain("vec2<u32>(tile, chunk)");
  });

  it("requires workgroup-aligned raster chunks", () => {
    expect(() => validateRasterChunkSize(8_192, 1_000_000)).not.toThrow();
    expect(() => validateRasterChunkSize(null, 1_000_000)).not.toThrow();
    expect(() => validateRasterChunkSize(128, 1_000_000)).toThrow(
      /multiple of 256/,
    );
    expect(() => validateRasterChunkSize(1_000, 1_000_000)).toThrow(
      /multiple of 256/,
    );
  });

  it("composites chunk summaries like the original ordered alpha stream", () => {
    const samples = [
      { color: [0.8, 0.1, 0.2], alpha: 0.25 },
      { color: [0.2, 0.7, 0.3], alpha: 0.4 },
      { color: [0.1, 0.2, 0.9], alpha: 0.15 },
      { color: [0.9, 0.8, 0.1], alpha: 0.35 },
    ];
    const whole = composite(samples);
    const first = composite(samples.slice(0, 2));
    const second = composite(samples.slice(2));
    const chunks = {
      color: first.color.map(
        (value, channel) =>
          value + first.transmittance * second.color[channel]!,
      ),
      transmittance: first.transmittance * second.transmittance,
    };

    for (let channel = 0; channel < 3; channel++) {
      expect(chunks.color[channel]).toBeCloseTo(whole.color[channel]!, 12);
    }
    expect(chunks.transmittance).toBeCloseTo(whole.transmittance, 12);
  });
});

function composite(samples: Array<{ color: number[]; alpha: number }>): {
  color: number[];
  transmittance: number;
} {
  const color = [0, 0, 0];
  let transmittance = 1;
  for (const sample of samples) {
    for (let channel = 0; channel < 3; channel++) {
      color[channel]! += sample.color[channel]! * transmittance * sample.alpha;
    }
    transmittance *= 1 - sample.alpha;
  }
  return { color, transmittance };
}
