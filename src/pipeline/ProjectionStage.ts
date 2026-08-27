import type {
  ComputeNode,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  Fn,
  If,
  Return,
  ceil,
  clamp,
  dot,
  float,
  floor,
  instanceIndex,
  int,
  ivec2,
  mat3,
  max,
  normalize,
  select,
  sqrt,
  storage,
  transpose,
  uint,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import type { GaussianData } from "../GaussianData";
import { AttributePool } from "./AttributePool";
import { TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import { vec4Element } from "./tslTypes";

const SH_C0 = 0.28209479177387814;
const SH_C1 = 0.4886025119029199;
const SH_C2_0 = 1.0925484305920792;
const SH_C2_1 = -1.0925484305920792;
const SH_C2_2 = 0.31539156525252005;
const SH_C2_3 = -1.0925484305920792;
const SH_C2_4 = 0.5462742152960396;
const SH_C3_0 = -0.5900435899266435;
const SH_C3_1 = 2.890611442640554;
const SH_C3_2 = -0.4570457994644658;
const SH_C3_3 = 0.3731763325901154;
const SH_C3_4 = -0.4570457994644658;
const SH_C3_5 = 1.445305721320277;
const SH_C3_6 = -0.5900435899266435;

export class ProjectionStage {
  readonly projectedMean: StorageBufferAttribute;
  readonly projectedConic: StorageBufferAttribute;
  readonly projectedColor: StorageBufferAttribute;
  readonly tileCounts: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly computeNode: ComputeNode;

  constructor(data: GaussianData, frame: FrameUniforms) {
    this.projectedMean = this.attributes.createFloat(
      "3dgs.projected-mean",
      data.count,
    );
    this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      data.count,
    );
    this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      data.count,
    );
    this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      data.count,
    );

    const means = storage(data.means, "vec4", data.count).toReadOnly();
    const scalesOpacity = storage(
      data.scalesOpacity,
      "vec4",
      data.count,
    ).toReadOnly();
    const rotations = storage(data.rotations, "vec4", data.count).toReadOnly();
    const shCoefficients = storage(
      data.shCoefficients,
      "vec4",
      data.count * data.shCoefficientCount,
    ).toReadOnly();
    const projectedMean = storage(this.projectedMean, "vec4", data.count);
    const projectedConic = storage(this.projectedConic, "vec4", data.count);
    const projectedColor = storage(this.projectedColor, "vec4", data.count);
    const tileCounts = storage(this.tileCounts, "uint", data.count);

    const kernel = Fn(() => {
      const gid = instanceIndex;
      tileCounts.element(gid).assign(0);

      const meanLocal = means.element(gid).xyz.toVar();
      const view = frame.modelView.mul(vec4(meanLocal, 1)).toVar();
      const depth = view.z.negate().toVar();
      const nearPlane = frame.viewport.z;
      const farPlane = frame.viewport.w;
      If(depth.greaterThan(nearPlane).and(depth.lessThan(farPlane)).not(), () =>
        Return(),
      );

      const clip = frame.projection.mul(view).toVar();
      If(clip.w.lessThanEqual(0), () => Return());
      const ndc = clip.xy.div(clip.w).toVar();
      const width = frame.viewport.x;
      const height = frame.viewport.y;
      const center = vec2(
        ndc.x.mul(0.5).add(0.5).mul(width),
        float(0.5).sub(ndc.y.mul(0.5)).mul(height),
      ).toVar();

      const scaleOpacity = scalesOpacity.element(gid).toVar();
      const scale = max(scaleOpacity.xyz, vec3(1e-7)).toVar();
      const q = normalize(rotations.element(gid)).toVar();
      const x = q.x;
      const y = q.y;
      const z = q.z;
      const w = q.w;
      const xx = x.mul(x);
      const yy = y.mul(y);
      const zz = z.mul(z);
      const xy = x.mul(y);
      const xz = x.mul(z);
      const yz = y.mul(z);
      const xw = x.mul(w);
      const yw = y.mul(w);
      const zw = z.mul(w);
      const rotation = mat3(
        vec3(
          float(1).sub(yy.add(zz).mul(2)),
          xy.add(zw).mul(2),
          xz.sub(yw).mul(2),
        ),
        vec3(
          xy.sub(zw).mul(2),
          float(1).sub(xx.add(zz).mul(2)),
          yz.add(xw).mul(2),
        ),
        vec3(
          xz.add(yw).mul(2),
          yz.sub(xw).mul(2),
          float(1).sub(xx.add(yy).mul(2)),
        ),
      ).toVar();
      const covarianceLocal = rotation
        .mul(
          mat3(
            vec3(scale.x.mul(scale.x), 0, 0),
            vec3(0, scale.y.mul(scale.y), 0),
            vec3(0, 0, scale.z.mul(scale.z)),
          ),
        )
        .mul(transpose(rotation))
        .toVar();
      const localToView = mat3(
        vec4Element(frame.modelView, 0).xyz,
        vec4Element(frame.modelView, 1).xyz,
        vec4Element(frame.modelView, 2).xyz,
      ).toVar();
      const covarianceView = localToView
        .mul(covarianceLocal)
        .mul(transpose(localToView))
        .toVar();
      const fx = width.mul(0.5).mul(vec4Element(frame.projection, 0).x);
      const fy = height.mul(0.5).mul(vec4Element(frame.projection, 1).y);
      const inverseDepth = float(1).div(depth).toVar();
      const j0 = vec3(
        fx.mul(inverseDepth),
        0,
        fx.mul(view.x).mul(inverseDepth).mul(inverseDepth),
      ).toVar();
      const j1 = vec3(
        0,
        fy.mul(inverseDepth).negate(),
        fy.mul(view.y).mul(inverseDepth).mul(inverseDepth).negate(),
      ).toVar();
      const covarianceJ0 = covarianceView.mul(j0).toVar();
      const covarianceJ1 = covarianceView.mul(j1).toVar();
      const sigma00 = dot(j0, covarianceJ0).add(0.3).toVar();
      const sigma01 = dot(j0, covarianceJ1).toVar();
      const sigma11 = dot(j1, covarianceJ1).add(0.3).toVar();
      const determinant = sigma00
        .mul(sigma11)
        .sub(sigma01.mul(sigma01))
        .toVar();
      If(determinant.lessThanEqual(1e-8), () => Return());

      const discriminant = sqrt(
        max(
          0,
          sigma00
            .sub(sigma11)
            .mul(sigma00.sub(sigma11))
            .add(sigma01.mul(sigma01).mul(4)),
        ),
      ).toVar();
      const majorVariance = max(
        sigma00.add(sigma11).add(discriminant).mul(0.5),
        1e-8,
      ).toVar();
      const radius = ceil(sqrt(majorVariance).mul(3)).toVar();
      If(radius.lessThanEqual(0), () => Return());

      const minPixel = center.sub(vec2(radius)).toVar();
      const maxPixel = center.add(vec2(radius)).toVar();
      If(
        maxPixel.x
          .lessThan(0)
          .or(maxPixel.y.lessThan(0))
          .or(minPixel.x.greaterThanEqual(width))
          .or(minPixel.y.greaterThanEqual(height)),
        () => Return(),
      );

      const maxTileX = int(frame.tilesX).sub(1).toVar();
      const maxTileY = int(frame.tilesY).sub(1).toVar();
      const clampTile = (
        value: ReturnType<typeof int>,
        maximum: typeof maxTileX,
      ) =>
        select(
          value.lessThan(0),
          int(0),
          select(value.greaterThan(maximum), maximum, value),
        );
      const tileMin = ivec2(
        clampTile(int(floor(minPixel.x.div(TILE_SIZE))), maxTileX),
        clampTile(int(floor(minPixel.y.div(TILE_SIZE))), maxTileY),
      ).toVar();
      const tileMax = ivec2(
        clampTile(int(floor(maxPixel.x.div(TILE_SIZE))), maxTileX),
        clampTile(int(floor(maxPixel.y.div(TILE_SIZE))), maxTileY),
      ).toVar();
      const tileExtent = tileMax.sub(tileMin).add(ivec2(1)).toVar();
      const count = uint(tileExtent.x.mul(tileExtent.y)).toVar();
      If(count.equal(0), () => Return());

      const inverseDeterminant = float(1).div(determinant).toVar();
      const direction = normalize(frame.cameraLocal.xyz.sub(meanLocal)).toVar();
      const directionX = direction.x;
      const directionY = direction.y;
      const directionZ = direction.z;
      const directionXX = directionX.mul(directionX);
      const directionYY = directionY.mul(directionY);
      const directionZZ = directionZ.mul(directionZ);
      const coefficientCount = data.shCoefficientCount;
      const base = gid.mul(coefficientCount).toVar();
      const color = shCoefficients.element(base).xyz.mul(SH_C0).toVar();
      if (data.shDegree >= 1) {
        color.addAssign(
          shCoefficients
            .element(base.add(1))
            .xyz.mul(directionY.negate().mul(SH_C1)),
        );
        color.addAssign(
          shCoefficients.element(base.add(2)).xyz.mul(directionZ.mul(SH_C1)),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(3))
            .xyz.mul(directionX.negate().mul(SH_C1)),
        );
      }
      if (data.shDegree >= 2) {
        color.addAssign(
          shCoefficients
            .element(base.add(4))
            .xyz.mul(directionX.mul(directionY).mul(SH_C2_0)),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(5))
            .xyz.mul(directionY.mul(directionZ).mul(SH_C2_1)),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(6))
            .xyz.mul(
              directionZZ.mul(2).sub(directionXX).sub(directionYY).mul(SH_C2_2),
            ),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(7))
            .xyz.mul(directionX.mul(directionZ).mul(SH_C2_3)),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(8))
            .xyz.mul(directionXX.sub(directionYY).mul(SH_C2_4)),
        );
      }
      if (data.shDegree >= 3) {
        color.addAssign(
          shCoefficients
            .element(base.add(9))
            .xyz.mul(
              directionY.mul(directionXX.mul(3).sub(directionYY)).mul(SH_C3_0),
            ),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(10))
            .xyz.mul(directionX.mul(directionY).mul(directionZ).mul(SH_C3_1)),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(11))
            .xyz.mul(
              directionY
                .mul(directionZZ.mul(4).sub(directionXX).sub(directionYY))
                .mul(SH_C3_2),
            ),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(12))
            .xyz.mul(
              directionZ
                .mul(
                  directionZZ
                    .mul(2)
                    .sub(directionXX.mul(3))
                    .sub(directionYY.mul(3)),
                )
                .mul(SH_C3_3),
            ),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(13))
            .xyz.mul(
              directionX
                .mul(directionZZ.mul(4).sub(directionXX).sub(directionYY))
                .mul(SH_C3_4),
            ),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(14))
            .xyz.mul(directionZ.mul(directionXX.sub(directionYY)).mul(SH_C3_5)),
        );
        color.addAssign(
          shCoefficients
            .element(base.add(15))
            .xyz.mul(
              directionX.mul(directionXX.sub(directionYY.mul(3))).mul(SH_C3_6),
            ),
        );
      }

      projectedMean
        .element(gid)
        .assign(vec4(center, depth, clamp(scaleOpacity.w, 0, 1)));
      projectedConic
        .element(gid)
        .assign(
          vec4(
            sigma11.mul(inverseDeterminant),
            sigma01.negate().mul(inverseDeterminant),
            sigma00.mul(inverseDeterminant),
            radius,
          ),
        );
      projectedColor.element(gid).assign(vec4(max(color.add(0.5), vec3(0)), 1));
      tileCounts.element(gid).assign(count);
    });

    this.computeNode = kernel()
      .compute(data.count, [WORKGROUP_SIZE])
      .setName("3DGS projection");
  }

  encode(renderer: WebGPURenderer): void {
    renderer.compute(this.computeNode);
  }

  dispose(): void {
    this.computeNode.dispose();
    this.attributes.dispose();
  }
}
