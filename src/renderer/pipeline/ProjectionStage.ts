import { StorageBindings } from "./StorageBindings";
import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import {
  Fn,
  If,
  Return,
  ceil,
  clamp,
  float,
  floor,
  instanceIndex,
  int,
  ivec2,
  log,
  sqrt,
  uint,
  uvec2,
  mat3,
  transpose,
  vec3,
  vec2,
  vec4,
  wgslFn,
} from "three/tsl";
import type { GaussianData } from "../GaussianData";
import {
  countContributingTilesWGSL,
  projectionIsValidWGSL,
  subpixelHasSampleWGSL,
} from "../kernels/projectionHelpers";
import {
  gaussianColor,
  gaussianPositionView,
  gaussianCovarianceView,
  passContextNodes,
  gaussianIndex,
  gaussianOpacity,
  gaussianPositionWorld,
  gaussianProjectedArea,
  gaussianProjectedSigma,
  gaussianScreenBoundsMax,
  gaussianScreenBoundsMin,
  gaussianScreenPosition,
  gaussianViewDepth,
  projectionContextNodes,
  validateGaussianNodeAccess,
  validateGaussianNodeDomain,
  resolveGaussianNode,
  type GaussianProjectionNodeSlots,
} from "../nodes/GaussianContextNodes";
import { AttributePool } from "./AttributePool";
import { decodeActiveSlot, encodeActiveSlot } from "./activeSlots";
import { TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import { passContextOverrides } from "./FrameUniforms";
import type { FrameUniforms } from "./FrameUniforms";
import {
  ACCUMULATED_VEC4S,
  type CloudAccumulationStage,
} from "./CloudAccumulationStage";
import type { AntialiasMode } from "./types";

type OverrideMap = Map<any, () => any>;

const worldAccessors = new Set<Node>([
  ...passContextNodes,
  gaussianIndex,
  gaussianPositionWorld,
  gaussianOpacity,
]);
const rootAccessors = new Set<Node>([
  ...worldAccessors,
  gaussianPositionView,
  gaussianCovarianceView,
]);
const projectedAccessors = new Set<Node>([
  ...rootAccessors,
  gaussianViewDepth,
  gaussianScreenPosition,
  gaussianProjectedSigma,
  gaussianProjectedArea,
]);

export class ProjectionStage {
  projectedMean: StorageBufferAttribute;
  projectedConic: StorageBufferAttribute;
  projectedColor: StorageBufferAttribute;
  tileCounts: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private computeNode: ComputeNode | null = null;
  constructor(
    private data: GaussianData,
    private readonly frame: FrameUniforms,
    private readonly accumulated: CloudAccumulationStage,
    private readonly antialiasMode: AntialiasMode,
    nodes: GaussianProjectionNodeSlots,
    private readonly subpixelSampleCulling = true,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
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
    this.rebuild(nodes);
  }

  compatible(_data: GaussianData): boolean {
    return true;
  }

  updateData(data: GaussianData, _nodes?: GaussianProjectionNodeSlots): void {
    this.data = data;
    this.projectedMean = this.attributes.grow(this.projectedMean, data.count);
    this.projectedConic = this.attributes.grow(this.projectedConic, data.count);
    this.projectedColor = this.attributes.grow(this.projectedColor, data.count);
    this.tileCounts = this.attributes.grow(this.tileCounts, data.count);
    if (this.computeNode) this.computeNode.count = data.count;
  }

  getComputeNodes(): ComputeNode[] {
    return this.computeNode ? [this.computeNode] : [];
  }

  rebuild(nodes: GaussianProjectionNodeSlots): void {
    for (const node of [
      nodes.gaussianProjectionNode,
      nodes.gaussianOpacityNode,
      nodes.gaussianColorNode,
      nodes.gaussianVisibilityNode,
    ]) {
      validateGaussianNodeDomain(node, projectionContextNodes, "projection");
    }
    validateGaussianNodeAccess(
      nodes.gaussianProjectionNode,
      rootAccessors,
      "gaussianProjectionNode",
    );
    validateGaussianNodeAccess(
      nodes.gaussianOpacityNode,
      projectedAccessors,
      "gaussianOpacityNode",
    );
    validateGaussianNodeAccess(
      nodes.gaussianColorNode,
      projectionContextNodes,
      "gaussianColorNode",
    );
    validateGaussianNodeAccess(
      nodes.gaussianVisibilityNode,
      projectionContextNodes,
      "gaussianVisibilityNode",
    );
    const next = this.createComputeNode(nodes);
    this.computeNode?.dispose();
    this.computeNode = next;
  }

  encode(renderer: WebGPURenderer): void {
    if (this.computeNode === null) {
      throw new Error("ProjectionStage has no compute node");
    }

    // A zero-count cut must still clear the downstream dispatch state.
    renderer.compute(this.computeNode, [
      Math.max(1, Math.ceil(this.accumulated.count / WORKGROUP_SIZE)),
      1,
      1,
    ]);
  }

  dispose(): void {
    this.computeNode?.dispose();
    this.computeNode = null;
    this.attributes.dispose();
  }

  private createComputeNode(nodes: GaussianProjectionNodeSlots): ComputeNode {
    const { data, frame } = this;
    const world = this.attributes
      .storage(this.accumulated.attribute, "vec4")
      .toReadOnly();
    const projectedMean = this.attributes.storage(
      this.projectedMean,
      "vec4",
      this.projectedMean.count,
    );
    const projectedConic = this.attributes.storage(
      this.projectedConic,
      "vec4",
      data.count,
    );
    const projectedColor = this.attributes.storage(
      this.projectedColor,
      "vec4",
      data.count,
    );
    const tileCounts = this.attributes.storage(
      this.tileCounts,
      "uint",
      data.count,
    );
    const projectionIsValid = wgslFn<any>(projectionIsValidWGSL);
    const countTiles = wgslFn<any>(countContributingTilesWGSL());
    const subpixelHasSample = wgslFn<any>(subpixelHasSampleWGSL);

    const kernel = Fn(() => {
      const gid = uint(instanceIndex);
      If(gid.greaterThanEqual(frame.activeCount), () => {
        Return();
      });
      tileCounts.element(gid).assign(uint(0));
      projectedMean.element(gid).assign(vec4(0));

      const base = gid.mul(ACCUMULATED_VEC4S);
      const mean = world.element(base);
      const covA = world.element(base.add(1));
      const covB = world.element(base.add(2));
      const sourceSlot = (decodeActiveSlot({ value: covB.z }) as any).toVar(
        "gaussianSourceSlot",
      );
      const positionWorld = mean.xyz;
      const viewPosition = frame.view
        .mul(vec4(positionWorld, 1))
        .toVar("gaussianViewPosition");
      const covarianceWorld = mat3(
        covA.xyz,
        vec3(covA.y, covA.w, covB.x),
        vec3(covA.z, covB.x, covB.y),
      );
      const viewLinear = mat3(
        (frame.view as any).element(0).xyz,
        (frame.view as any).element(1).xyz,
        (frame.view as any).element(2).xyz,
      );
      const covarianceView = viewLinear
        .mul(covarianceWorld)
        .mul(transpose(viewLinear))
        .toVar("gaussianCovarianceViewValue");
      const worldOverrides: OverrideMap = new Map<any, () => any>([
        ...passContextOverrides(frame),
        [gaussianIndex, () => sourceSlot],
        [gaussianPositionWorld, () => positionWorld],
        [gaussianOpacity, () => mean.w],
      ]);
      const rootOverrides = new Map(worldOverrides);
      rootOverrides.set(gaussianPositionView, () => viewPosition.xyz);
      rootOverrides.set(gaussianCovarianceView, () => covarianceView);
      const projected = resolveNode(
        nodes.gaussianProjectionNode,
        rootOverrides,
      ).toVar("gaussianProjection");
      If((projectionIsValid({ p: projected }) as any).not(), () => {
        Return();
      });

      const center = projected.element(0).xy;
      const depth = projected.element(0).z;
      const conic = projected.element(1).xyz;
      const determinant = projected.element(1).w;
      const covariance = projected.element(2).xyz;
      const originalDeterminant = projected.element(2).w;
      const projectedOverrides = new Map(worldOverrides);
      projectedOverrides.set(gaussianPositionView, () => viewPosition.xyz);
      projectedOverrides.set(gaussianCovarianceView, () => covarianceView);
      projectedOverrides.set(gaussianViewDepth, () => depth);
      projectedOverrides.set(gaussianScreenPosition, () => center);
      projectedOverrides.set(gaussianProjectedSigma, () => sqrt(covariance.xz));
      projectedOverrides.set(gaussianProjectedArea, () =>
        sqrt(determinant).mul(Math.PI),
      );
      const opacityBase = resolveNode(
        nodes.gaussianOpacityNode,
        projectedOverrides,
      ).clamp(0, 1);
      const opacity =
        this.antialiasMode === "compensated"
          ? opacityBase.mul(
              sqrt(clamp(originalDeterminant.div(determinant), 0, 1)),
            )
          : opacityBase;
      If(opacity.lessThan(float(1 / 255)).or(opacity.notEqual(opacity)), () => {
        Return();
      });
      const powerThreshold = log(opacity.mul(255));
      const extentX = sqrt(
        powerThreshold.mul(2).mul(clamp(covariance.x, 1e-12, 1e4)),
      );
      const extentY = sqrt(
        powerThreshold.mul(2).mul(clamp(covariance.z, 1e-12, 1e4)),
      );
      const radiusX = ceil(extentX);
      const radiusY = ceil(extentY);
      If(radiusX.lessThanEqual(0).or(radiusY.lessThanEqual(0)), () => {
        Return();
      });
      const radius = vec2(radiusX, radiusY);
      const boundsMin = center.sub(radius);
      const boundsMax = center.add(radius);
      If(
        frame.boundaryAxis
          .notEqual(1)
          .and(
            boundsMax.x
              .lessThan(0)
              .or(boundsMin.x.greaterThanEqual(frame.viewport.x)),
          )
          .or(
            frame.boundaryAxis
              .notEqual(2)
              .and(
                boundsMax.y
                  .lessThan(0)
                  .or(boundsMin.y.greaterThanEqual(frame.viewport.y)),
              ),
          ),
        () => {
          Return();
        },
      );
      if (this.subpixelSampleCulling) {
        const hasSample = subpixelHasSample({
          center,
          conic,
          power_threshold: powerThreshold,
          extent: vec2(extentX, extentY),
          viewport: uvec2(frame.viewport.xy),
          boundary_axis: frame.boundaryAxis,
        }) as any;
        If(hasSample.not(), () => {
          // Negative opacity is an invisible marker read only by the optional
          // profiling pass; visibility compaction accepts strictly positive w.
          projectedMean.element(gid).assign(vec4(center, depth, -1));
          Return();
        });
      }
      const maxTile = ivec2(int(frame.tilesX), int(frame.tilesY)).sub(1);
      const tileMin = ivec2(
        clamp(floor(boundsMin.div(float(TILE_SIZE))), vec2(0), vec2(maxTile)),
      ).toVar();
      const tileMax = ivec2(
        clamp(floor(boundsMax.div(float(TILE_SIZE))), vec2(0), vec2(maxTile)),
      ).toVar();

      If(frame.boundaryAxis.equal(1), () => {
        tileMin.x.assign(0);
        tileMax.x.assign(maxTile.x);
      });
      If(frame.boundaryAxis.equal(2), () => {
        tileMin.y.assign(0);
        tileMax.y.assign(maxTile.y);
      });

      const standardColor = world.element(base.add(3)).xyz;
      const derivedOverrides = new Map(projectedOverrides);
      derivedOverrides.set(gaussianColor, () => standardColor);
      derivedOverrides.set(gaussianScreenBoundsMin, () => boundsMin);
      derivedOverrides.set(gaussianScreenBoundsMax, () => boundsMax);
      const visible = resolveNode(
        nodes.gaussianVisibilityNode,
        derivedOverrides,
      );
      If(visible.not(), () => {
        Return();
      });
      const count = countTiles({
        center,
        conic,
        power_threshold: powerThreshold,
        radius,
        viewport: frame.viewport.xy,
        boundary_axis: frame.boundaryAxis,
        tile_min: tileMin,
        tile_max: tileMax,
      }) as any;
      If(count.equal(0), () => {
        Return();
      });
      const color = resolveNode(
        nodes.gaussianColorNode,
        derivedOverrides,
      ).clamp(0, 1);
      projectedMean.element(gid).assign(vec4(center, depth, opacity));
      // Both ceil radii fit in nine bits: covariance is capped at 1e4
      // and opacity <= 1. Keep their exact values when color.w stores the id.
      projectedConic
        .element(gid)
        .assign(vec4(conic, radiusX.add(radiusY.mul(512))));
      projectedColor
        .element(gid)
        .assign(vec4(color, encodeActiveSlot({ slot: sourceSlot }) as any));
      tileCounts.element(gid).assign(count);
    });

    return kernel()
      .compute(data.count, [WORKGROUP_SIZE])
      .setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}

function resolveNode(node: Node, overrides: OverrideMap): any {
  return resolveGaussianNode(node, overrides);
}
