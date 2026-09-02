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
  mat4,
  normalize,
  sqrt,
  storage,
  uint,
  uvec2,
  vec2,
  vec4,
  wgslFn,
} from "three/tsl";
import type { GaussianData } from "../GaussianData";
import {
  countContributingTilesWGSL,
  evaluateShWGSL,
  projectionCovarianceWGSL,
  subpixelHasSampleWGSL,
} from "../kernels/projectionHelpers";
import {
  gaussianColor,
  gaussianIndex,
  gaussianObjectId,
  gaussianObjectMatrix,
  gaussianObjectVisible,
  gaussianOpacity,
  gaussianPositionLocal,
  gaussianPositionWorld,
  gaussianProjectedArea,
  gaussianProjectedSigma,
  gaussianRotation,
  gaussianScale,
  gaussianScreenBoundsMax,
  gaussianScreenBoundsMin,
  gaussianScreenPosition,
  gaussianViewDepth,
  gaussianViewDirection,
  projectionContextNodes,
  validateGaussianNodeAccess,
  validateGaussianNodeDomain,
  type GaussianProjectionNodeSlots,
} from "../nodes/GaussianContextNodes";
import { AttributePool } from "./AttributePool";
import { TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import { OBJECT_FRAME_VEC4S, type ObjectFrameState } from "./ObjectFrameState";
import type { AntialiasMode } from "./types";

type OverrideMap = Map<any, () => any>;

const sourceAccessors = new Set<Node>([
  gaussianIndex,
  gaussianObjectId,
  gaussianPositionLocal,
  gaussianScale,
  gaussianRotation,
  gaussianOpacity,
  gaussianObjectMatrix,
  gaussianObjectVisible,
]);
const worldAccessors = new Set<Node>([
  ...sourceAccessors,
  gaussianPositionWorld,
  gaussianViewDirection,
]);
const projectedAccessors = new Set<Node>([
  ...worldAccessors,
  gaussianViewDepth,
  gaussianScreenPosition,
  gaussianProjectedSigma,
  gaussianProjectedArea,
]);

export class ProjectionStage {
  readonly projectedMean: StorageBufferAttribute;
  readonly projectedConic: StorageBufferAttribute;
  readonly projectedColor: StorageBufferAttribute;
  readonly tileCounts: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private computeNode: ComputeNode | null = null;

  constructor(
    private readonly data: GaussianData,
    private readonly frame: FrameUniforms,
    objects: ObjectFrameState,
    private readonly antialiasMode: AntialiasMode,
    nodes: GaussianProjectionNodeSlots,
    private readonly subpixelSampleCulling = true,
  ) {
    this.projectedMean = objects.attribute;
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

  rebuild(nodes: GaussianProjectionNodeSlots): void {
    for (const node of [
      nodes.gaussianPositionLocalNode,
      nodes.gaussianPositionWorldNode,
      nodes.gaussianScaleNode,
      nodes.gaussianRotationNode,
      nodes.gaussianOpacityNode,
      nodes.gaussianColorNode,
      nodes.gaussianVisibilityNode,
    ]) {
      validateGaussianNodeDomain(node, projectionContextNodes, "projection");
    }
    validateGaussianNodeAccess(
      nodes.gaussianPositionLocalNode,
      sourceAccessors,
      "gaussianPositionLocalNode",
    );
    for (const [field, node] of [
      ["gaussianPositionWorldNode", nodes.gaussianPositionWorldNode],
      ["gaussianScaleNode", nodes.gaussianScaleNode],
      ["gaussianRotationNode", nodes.gaussianRotationNode],
    ] as const) {
      validateGaussianNodeAccess(node, worldAccessors, field);
    }
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
    renderer.compute(this.computeNode);
  }

  dispose(): void {
    this.computeNode?.dispose();
    this.computeNode = null;
    this.attributes.dispose();
  }

  private createComputeNode(nodes: GaussianProjectionNodeSlots): ComputeNode {
    const { data, frame } = this;
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
    const projectedMean = storage(
      this.projectedMean,
      "vec4",
      this.projectedMean.count,
    );
    const projectedConic = storage(this.projectedConic, "vec4", data.count);
    const projectedColor = storage(this.projectedColor, "vec4", data.count);
    const tileCounts = storage(this.tileCounts, "uint", data.count);
    const projectCovariance = wgslFn<any>(
      projectionCovarianceWGSL(this.antialiasMode),
    );
    const evaluateSh = wgslFn<any>(evaluateShWGSL);
    const countTiles = wgslFn<any>(countContributingTilesWGSL());
    const subpixelHasSample = wgslFn<any>(subpixelHasSampleWGSL);

    const kernel = Fn(() => {
      const gid = uint(instanceIndex);
      If(gid.greaterThanEqual(uint(data.count)), () => {
        Return();
      });
      tileCounts.element(gid).assign(uint(0));
      projectedMean.element(gid).assign(vec4(0));

      const meanObject = means.element(gid);
      const sourceLocal = meanObject.xyz;
      const objectId = uint(meanObject.w);
      const sourceScaleOpacity = scalesOpacity.element(gid);
      const sourceScale = sourceScaleOpacity.xyz;
      const sourceOpacity = sourceScaleOpacity.w;
      const sourceRotation = rotations.element(gid);
      const objectBase = uint(data.count).add(
        objectId.mul(uint(OBJECT_FRAME_VEC4S)),
      );
      const objectMatrix = mat4(
        projectedMean.element(objectBase),
        projectedMean.element(objectBase.add(1)),
        projectedMean.element(objectBase.add(2)),
        projectedMean.element(objectBase.add(3)),
      );
      const modelView = mat4(
        projectedMean.element(objectBase.add(4)),
        projectedMean.element(objectBase.add(5)),
        projectedMean.element(objectBase.add(6)),
        projectedMean.element(objectBase.add(7)),
      );
      const cameraLocal = projectedMean.element(objectBase.add(8)).xyz;
      const objectVisible = projectedMean
        .element(objectBase.add(9))
        .x.greaterThan(0);
      If(objectVisible.not(), () => {
        Return();
      });
      const sourceOverrides: OverrideMap = new Map<any, () => any>([
        [gaussianIndex, () => gid],
        [gaussianObjectId, () => objectId],
        [gaussianPositionLocal, () => sourceLocal],
        [gaussianScale, () => sourceScale],
        [gaussianRotation, () => sourceRotation],
        [gaussianOpacity, () => sourceOpacity],
        [gaussianObjectMatrix, () => objectMatrix],
        [gaussianObjectVisible, () => objectVisible],
      ]);
      const positionLocal = resolveNode(
        nodes.gaussianPositionLocalNode,
        sourceOverrides,
      ).toVar("gaussianPositionLocalValue");
      const standardWorld = objectMatrix.mul(vec4(positionLocal, 1)).xyz;
      const worldOverrides = new Map(sourceOverrides);
      worldOverrides.set(gaussianPositionWorld, () => standardWorld);
      const viewDirection = normalize(positionLocal.sub(cameraLocal));
      worldOverrides.set(gaussianViewDirection, () => viewDirection);

      let viewPosition: any;
      if (nodes.gaussianPositionWorldNode === gaussianPositionWorld) {
        viewPosition = modelView.mul(vec4(positionLocal, 1));
      } else {
        const positionWorld = resolveNode(
          nodes.gaussianPositionWorldNode,
          worldOverrides,
        ).toVar("gaussianPositionWorldValue");
        viewPosition = frame.view.mul(vec4(positionWorld, 1));
      }
      viewPosition = viewPosition.toVar("gaussianViewPosition");
      const scale = resolveNode(nodes.gaussianScaleNode, worldOverrides).toVar(
        "gaussianScaleValue",
      );
      const rotation = resolveNode(
        nodes.gaussianRotationNode,
        worldOverrides,
      ).toVar("gaussianRotationValue");
      const projected = (
        projectCovariance({
          view: viewPosition,
          scale_input: scale,
          rotation_input: rotation,
          model_view: modelView,
          projection: frame.projection,
          viewport: frame.viewport,
        }) as any
      ).toVar("gaussianProjection");
      If(projected.element(0).w.lessThanEqual(0), () => {
        Return();
      });

      const center = projected.element(0).xy;
      const depth = projected.element(0).z;
      const conic = projected.element(1).xyz;
      const determinant = projected.element(1).w;
      const covariance = projected.element(2).xyz;
      const originalDeterminant = projected.element(2).w;
      const projectedOverrides = new Map(worldOverrides);
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
      If(opacity.lessThan(float(1 / 255)), () => {
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
        boundsMax.x
          .lessThan(0)
          .or(boundsMax.y.lessThan(0))
          .or(boundsMin.x.greaterThanEqual(frame.viewport.x))
          .or(boundsMin.y.greaterThanEqual(frame.viewport.y)),
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
      );
      const tileMax = ivec2(
        clamp(floor(boundsMax.div(float(TILE_SIZE))), vec2(0), vec2(maxTile)),
      );

      const standardColor = evaluateSh({
        gid,
        sh_degree: uint(data.shDegree),
        direction: viewDirection,
        sh_coefficients: shCoefficients,
      });
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
      projectedConic.element(gid).assign(vec4(conic, radiusX));
      projectedColor.element(gid).assign(vec4(color, radiusY));
      tileCounts.element(gid).assign(count);
    });

    return kernel()
      .compute(data.count, [WORKGROUP_SIZE])
      .setName(`3DGS projection TSL (${this.antialiasMode})`);
  }
}

function resolveNode(node: Node, overrides: OverrideMap): any {
  return (node as any).context({ overrideNodes: overrides });
}
