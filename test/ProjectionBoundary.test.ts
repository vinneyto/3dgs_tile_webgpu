import { describe, expect, it } from "vitest";
import { WgslExec, WgslParser } from "wgsl_reflect/wgsl_reflect.module.js";
import {
  boundaryDeltaWGSL,
  boundaryTileContributionWGSL,
} from "../src/renderer/kernels/tileContribution";
import {
  countContributingTilesWGSL,
  perspectiveProjectionWGSL,
  projectionIsValidWGSL,
  projectionResultWGSL,
  subpixelHasSampleWGSL,
  viewCovarianceWGSL,
} from "../src/renderer/kernels/projectionHelpers";

// Execute the actual WGSL helpers, rather than a duplicate CPU implementation.
function run(source: string, body: string, count = 1): Float32Array {
  const output = new Float32Array(count);
  const ast = new WgslParser().parse(`${source}
    @group(0) @binding(0) var<storage, read_write> output: array<f32>;
    @compute @workgroup_size(1) fn main() { ${body} }
  `);
  new WgslExec(ast).dispatchWorkgroups("main", 1, { 0: { 0: output } });
  return output;
}
const v2 = (x: number, y: number) => `vec2<f32>(${x}, ${y})`;
const v3 = (x: number, y: number, z: number) => `vec3<f32>(${x}, ${y}, ${z})`;

describe("executed projection and boundary WGSL", () => {
  it("retains default perspective mean, covariance, inverse and compensation determinants", () => {
    const values = run(
      viewCovarianceWGSL +
        projectionResultWGSL +
        perspectiveProjectionWGSL +
        projectionIsValidWGSL,
      `
      let covariance = gaussian_view_covariance(vec3<f32>(1.0), vec4<f32>(0.0,0.0,0.0,1.0), mat4x4<f32>(1.0,0.0,0.0,0.0, 0.0,1.0,0.0,0.0, 0.0,0.0,1.0,0.0, 0.0,0.0,0.0,1.0));
      let projection = mat4x4<f32>(1.0,0.0,0.0,0.0, 0.0,1.0,0.0,0.0, 0.0,0.0,1.0,0.0, 0.0,0.0,0.0,1.0);
      let p = perspective_gaussian_projection(vec3<f32>(0.0,0.0,-2.0), covariance, projection, vec4<f32>(32.0,32.0,1.0,10.0), 0.3);
      output[0]=p[0].x; output[1]=p[0].y; output[2]=p[0].z;
      output[3]=p[2].x; output[4]=p[1].x; output[5]=p[2].w;
      output[6]=select(0.0,1.0,gaussian_projection_is_valid(p));
      let clipped = perspective_gaussian_projection(vec3<f32>(0.0,0.0,2.0), covariance, projection, vec4<f32>(32.0,32.0,1.0,10.0), 0.3);
      output[7]=clipped[0].w;
    `,
      8,
    );
    expect(Array.from(values.slice(0, 3))).toEqual([16, 16, 2]);
    expect(values[3]).toBeCloseTo(64.3, 4);
    expect(values[4]).toBeCloseTo(1 / 64.3, 6);
    expect(values[5]).toBe(4096);
    expect(values[6]).toBe(1);
    expect(values[7]).toBe(0);
  });

  it("supports unfiltered custom scalar projection and rejects malformed or non-finite roots", () => {
    const values = run(
      projectionResultWGSL + projectionIsValidWGSL,
      `
      var p = gaussian_projection_result(vec2<f32>(-3.0,7.0), 42.0, vec3<f32>(4.0,1.0,9.0), 0.0);
      output[0]=p[0].z; output[1]=p[2].x; output[2]=p[2].z;
      output[3]=select(0.0,1.0,gaussian_projection_is_valid(p));
      let negative = mat4x4<f32>(vec4<f32>(p[0].xy,-1.0,1.0),p[1],p[2],p[3]); output[4]=select(0.0,1.0,gaussian_projection_is_valid(negative));
      let infinite = mat4x4<f32>(vec4<f32>(p[0].xy,bitcast<f32>(0x7f800000u),1.0),p[1],p[2],p[3]); output[5]=select(0.0,1.0,gaussian_projection_is_valid(infinite));
      let malformed = mat4x4<f32>(p[0],vec4<f32>(99.0,p[1].yzw),p[2],p[3]); output[6]=select(0.0,1.0,gaussian_projection_is_valid(malformed));
    `,
      7,
    );
    expect(Array.from(values.slice(0, 2))).toEqual([42, 4]);
    expect(values[2]).toBeCloseTo(9, 4);
    expect(Array.from(values.slice(3))).toEqual([1, 0, 0, 0]);
  });

  it.each([1, 2])(
    "chooses one strongest periodic image for axis %i, including tilted and wide support",
    (axis) => {
      const conic = [0.1, 0.08, 0.12];
      const viewport = [7, 9];
      const center = [-15.25, 26.5];
      for (const pixel of [
        [0.5, 0.5],
        [6.5, 8.5],
        [3.5, 4.5],
      ]) {
        const values = run(
          boundaryDeltaWGSL,
          `let d=gaussian_boundary_delta(${v2(pixel[0]!, pixel[1]!)},${v2(center[0]!, center[1]!)},${v3(conic[0]!, conic[1]!, conic[2]!)},${v2(viewport[0]!, viewport[1]!)},${axis}u); output[0]=d.x;output[1]=d.y;`,
          2,
        );
        const power = (x: number, y: number) =>
          conic[0]! * x * x + 2 * conic[1]! * x * y + conic[2]! * y * y;
        const actual = power(values[0]!, values[1]!);
        let minimum = Infinity;
        for (let image = -100; image <= 100; image++) {
          const dx =
            pixel[0]! - center[0]! - (axis === 1 ? image * viewport[0]! : 0);
          const dy =
            pixel[1]! - center[1]! - (axis === 2 ? image * viewport[1]! : 0);
          minimum = Math.min(minimum, power(dx, dy));
        }
        expect(actual).toBeCloseTo(minimum, 4);
      }
    },
  );

  it.each([
    { center: [-0.25, 8.5], cov: [4, 0, 4], width: 33, height: 17, axis: 1 },
    { center: [16.5, 18.25], cov: [4, 0, 4], width: 33, height: 17, axis: 2 },
    { center: [-35.5, 8.5], cov: [100, 24, 9], width: 7, height: 17, axis: 1 },
    { center: [8.5, -41.25], cov: [9, 24, 100], width: 17, height: 7, axis: 2 },
  ])(
    "counts each supported tile once and retains every sampled hit: %j",
    (fixture) => {
      const { center, cov, width, height, axis } = fixture;
      const determinant = cov[0]! * cov[2]! - cov[1]! * cov[1]!;
      const conic = [
        cov[2]! / determinant,
        -cov[1]! / determinant,
        cov[0]! / determinant,
      ];
      const threshold = Math.log(255);
      const radius = [
        Math.ceil(Math.sqrt(2 * threshold * cov[0]!)),
        Math.ceil(Math.sqrt(2 * threshold * cov[2]!)),
      ];
      const nx = Math.ceil(width / 16),
        ny = Math.ceil(height / 16);
      const args = `${v2(center[0]!, center[1]!)},${v3(conic[0]!, conic[1]!, conic[2]!)},${threshold},${v2(radius[0]!, radius[1]!)}`;
      const assignments = Array.from(
        { length: nx * ny },
        (_, t) =>
          `output[${t}]=select(0.0,1.0,gaussian_boundary_tile_hit(${args},vec2<i32>(${t % nx},${Math.floor(t / nx)}),${v2(width, height)},${axis}u));`,
      ).join("\n");
      const hits = run(boundaryTileContributionWGSL(), assignments, nx * ny);
      const count = run(
        countContributingTilesWGSL(),
        `output[0]=f32(count_contributing_tiles(${args},vec2<i32>(0,0),vec2<i32>(${nx - 1},${ny - 1}),${v2(width, height)},${axis}u));`,
      )[0];
      expect(count).toBe(Array.from(hits).reduce((a, b) => a + b, 0));
      expect(count).toBeLessThanOrEqual(nx * ny);
      let sampledHits = 0;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          let minimum = Infinity;
          for (let image = -100; image <= 100; image++) {
            const dx = x + 0.5 - center[0]! - (axis === 1 ? image * width : 0);
            const dy = y + 0.5 - center[1]! - (axis === 2 ? image * height : 0);
            minimum = Math.min(
              minimum,
              0.5 *
                (conic[0]! * dx * dx +
                  2 * conic[1]! * dx * dy +
                  conic[2]! * dy * dy),
            );
          }
          if (minimum <= threshold) {
            sampledHits++;
            expect(hits[Math.floor(y / 16) * nx + Math.floor(x / 16)]).toBe(1);
          }
        }
      expect(sampledHits).toBeGreaterThan(0);
    },
  );

  it("retains a periodic subpixel sample beyond the image boundary", () => {
    const values = run(
      subpixelHasSampleWGSL,
      `
      output[0]=select(0.0,1.0,subpixel_has_sample(vec2<f32>(33.5,0.5),vec3<f32>(100.0,0.0,100.0),1.0,vec2<f32>(0.1),vec2<u32>(33u,17u),1u));
      output[1]=select(0.0,1.0,subpixel_has_sample(vec2<f32>(33.5,0.5),vec3<f32>(100.0,0.0,100.0),1.0,vec2<f32>(0.1),vec2<u32>(33u,17u),0u));
    `,
      2,
    );
    expect(Array.from(values)).toEqual([1, 0]);
  });
});
