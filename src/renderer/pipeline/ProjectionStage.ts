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
  mat4,
  normalize,
  sqrt,
  uint,
  uvec2,
  uniform,
  vec2,
  vec4,
  wgslFn,
} from "three/tsl";
import type { GaussianData } from "../GaussianData";
import {
  countContributingTilesWGSL,
  evaluateShWGSL,
  projectionIsValidWGSL,
  subpixelHasSampleWGSL,
} from "../kernels/projectionHelpers";
import {
  gaussianColor,
  gaussianPositionView,
  gaussianCovarianceView,
  passContextNodes,
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
  resolveGaussianNode,
  type GaussianProjectionNodeSlots,
} from "../nodes/GaussianContextNodes";
import { AttributePool } from "./AttributePool";
import {
  ACTIVE_SLOT_TAG,
  decodeActiveSlot,
  encodeActiveSlot,
} from "./activeSlots";
import {
  compactScaleOpacityWGSL,
  compactRotationWGSL,
} from "../kernels/compactGaussians";
import { gaussianOpacitySupportWGSL } from "../kernels/sparkOpacity";
import { TILE_SIZE, WORKGROUP_SIZE } from "./constants";
import { gaussianViewCovariance } from "../nodes/GaussianProjectionNodes";
import { passContextOverrides } from "./FrameUniforms";
import type { FrameUniforms } from "./FrameUniforms";
import { OBJECT_FRAME_VEC4S, type ObjectFrameState } from "./ObjectFrameState";
import type { AntialiasMode } from "./types";

type OverrideMap = Map<any, () => any>;

const sourceAccessors = new Set<Node>([
  ...passContextNodes,
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
  private readonly objectOffset = uniform(0, "uint");
  private readonly activeSlotOffset = uniform(0, "uint");
  private readonly shDegree = uniform(0, "uint");
  private activeVersion = -1;
  private firstActiveChange = Infinity;
  private lastActiveChange = -1;
  private unsubscribeActiveSlots: () => void;

  constructor(
    private data: GaussianData,
    private readonly frame: FrameUniforms,
    private readonly objects: ObjectFrameState,
    private readonly antialiasMode: AntialiasMode,
    nodes: GaussianProjectionNodeSlots,
    private readonly subpixelSampleCulling = true,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    data.retain();
    this.updateRuntimeParameters();
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
    this.unsubscribeActiveSlots = data.subscribeActiveSlots((range) => {
      if (range.count === 0) return;
      this.firstActiveChange = Math.min(this.firstActiveChange, range.start);
      this.lastActiveChange = Math.max(
        this.lastActiveChange,
        range.start + range.count,
      );
    });
    this.rebuild(nodes);
  }

  compatible(data: GaussianData): boolean {
    return (
      data.geometryFormat === this.data.geometryFormat &&
      data.sparkLodOpacity === this.data.sparkLodOpacity &&
      data.shFormat === this.data.shFormat &&
      Boolean(data.activeSlots) === Boolean(this.data.activeSlots)
    );
  }

  updateData(data: GaussianData, nodes?: GaussianProjectionNodeSlots): void {
    const variantChanged = !this.compatible(data);
    if (variantChanged && !nodes)
      throw new TypeError("Projection schema requires a shader variant");
    const previous = this.data;
    if (previous !== data) {
      data.retain();
      this.unsubscribeActiveSlots();
      for (const key of [
        "means",
        "scalesOpacity",
        "rotations",
        "shCoefficients",
      ] as const) {
        if (
          previous[key].itemSize === data[key].itemSize &&
          previous[key].array.constructor === data[key].array.constructor
        )
          this.attributes.bindings.replace(previous[key], data[key]);
      }
      this.data = data;
      this.activeVersion = -1;
      this.firstActiveChange = Infinity;
      this.lastActiveChange = -1;
      this.unsubscribeActiveSlots = data.subscribeActiveSlots((range) => {
        this.firstActiveChange = Math.min(this.firstActiveChange, range.start);
        this.lastActiveChange = Math.max(
          this.lastActiveChange,
          range.start + range.count,
        );
      });
      this.attributes.bindings.afterSubmittedWork(() => previous.release());
    }
    this.projectedMean = this.objects.attribute;
    this.projectedConic = this.attributes.grow(this.projectedConic, data.count);
    this.projectedColor = this.attributes.grow(this.projectedColor, data.count);
    this.tileCounts = this.attributes.grow(this.tileCounts, data.count);
    if (this.computeNode) this.computeNode.count = data.count;
    this.updateRuntimeParameters();
    if (variantChanged) this.rebuild(nodes!);
  }

  private updateRuntimeParameters(): void {
    this.objectOffset.value = this.objects.slotCapacity;
    this.activeSlotOffset.value =
      this.data.count * this.data.shCoefficientCount;
    this.shDegree.value = this.data.shDegree;
  }

  getComputeNodes(): ComputeNode[] {
    return this.computeNode ? [this.computeNode] : [];
  }

  rebuild(nodes: GaussianProjectionNodeSlots): void {
    for (const node of [
      nodes.gaussianProjectionNode,
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
      nodes.gaussianProjectionNode,
      rootAccessors,
      "gaussianProjectionNode",
    );
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
    this.updateActiveSlots();
    // Bind attributes even with an empty draw cut: ACK-paced initial batches
    // must reach GPU memory before the final activation transaction commits.
    renderer.compute(this.computeNode, [
      Math.max(1, Math.ceil(this.data.activeCount / WORKGROUP_SIZE)),
      1,
      1,
    ]);
  }

  dispose(): void {
    this.unsubscribeActiveSlots();
    const data = this.data;
    this.attributes.bindings.afterSubmittedWork(() => data.release());
    this.computeNode?.dispose();
    this.computeNode = null;
    this.attributes.dispose();
  }

  private updateActiveSlots(): void {
    const { data } = this;
    if (!data.activeSlots || this.activeVersion === data.activeVersion) return;
    const base =
      data.count *
      data.shCoefficientCount *
      (data.shFormat !== "float32" ? 1 : 4);
    const start =
      this.activeVersion < 0
        ? 0
        : Math.min(this.firstActiveChange, data.activeCount);
    const end =
      this.activeVersion < 0
        ? data.activeCount
        : Math.min(this.lastActiveChange, data.activeCount);
    const bits = new Uint32Array(data.shCoefficients.array.buffer);
    if (data.shFormat !== "float32")
      bits.set(
        data.activeSlots.subarray(start, Math.max(start, end)),
        base + start,
      );
    else
      for (let ordinal = start; ordinal < end; ordinal++)
        bits[base + ordinal] = data.activeSlots[ordinal]! ^ ACTIVE_SLOT_TAG;
    if (end > start) {
      data.shCoefficients.addUpdateRange(base + start, end - start);
      data.shCoefficients.needsUpdate = true;
    }
    this.firstActiveChange = Infinity;
    this.lastActiveChange = -1;
    this.activeVersion = data.activeVersion;
  }

  private createComputeNode(nodes: GaussianProjectionNodeSlots): ComputeNode {
    const { data, frame } = this;
    const means = this.attributes
      .storage(data.means, "vec4", data.count)
      .toReadOnly();
    const scalesOpacity = this.attributes
      .storage(
        data.scalesOpacity,
        data.geometryFormat === "compact" ? "uvec2" : "vec4",
        data.count,
      )
      .toReadOnly();
    const rotations = this.attributes
      .storage(
        data.rotations,
        data.geometryFormat === "compact" ? "uint" : "vec4",
        data.count,
      )
      .toReadOnly();
    const decodeScaleOpacity = wgslFn<any>(compactScaleOpacityWGSL);
    const decodeRotation = wgslFn<any>(compactRotationWGSL);
    const shCoefficients =
      data.shFormat !== "float32"
        ? this.attributes
            .storage(data.shCoefficients, "uint", data.shCoefficients.count)
            .toReadOnly()
        : this.attributes
            .storage(data.shCoefficients, "vec4", data.shCoefficients.count)
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
    const evaluateSh = wgslFn<any>(evaluateShWGSL(data.shFormat));
    const countTiles = wgslFn<any>(countContributingTilesWGSL());
    const subpixelHasSample = wgslFn<any>(subpixelHasSampleWGSL);

    const kernel = Fn(() => {
      const gid = uint(instanceIndex);
      If(gid.greaterThanEqual(frame.activeCount), () => {
        Return();
      });
      tileCounts.element(gid).assign(uint(0));
      projectedMean.element(gid).assign(vec4(0));

      const sourceSlot = data.activeSlots
        ? (data.shFormat !== "float32"
            ? shCoefficients.element(this.activeSlotOffset.add(gid))
            : (decodeActiveSlot({
                value: (
                  shCoefficients.element(
                    this.activeSlotOffset.add(gid.div(uint(4))),
                  ) as any
                ).element(gid.mod(uint(4))),
              }) as any)
          ).toVar("gaussianSourceSlot")
        : gid;
      const meanObject = means.element(sourceSlot);
      // Sparse backend slots use a negative object id for unoccupied records.
      // Reject them before object-buffer access or user material overrides.
      If(meanObject.w.lessThan(0), () => {
        Return();
      });
      const sourceLocal = meanObject.xyz;
      const objectId = uint(meanObject.w);
      const sourceScaleOpacity =
        data.geometryFormat === "compact"
          ? (
              decodeScaleOpacity({
                packed: scalesOpacity.element(sourceSlot),
              }) as any
            ).toVar("gaussianShape")
          : scalesOpacity.element(sourceSlot);
      const sourceScale = sourceScaleOpacity.xyz;
      const sourceOpacity = data.sparkLodOpacity
        ? (wgslFn<any>(
            `fn decode_spark_lod_opacity(value: f32) -> f32 { if (value <= 1.0) { return value; } return min(value * 4.0 - 3.0, 5.0); }`,
          )({ value: sourceScaleOpacity.w }) as any)
        : sourceScaleOpacity.w;
      const sourceRotation =
        data.geometryFormat === "compact"
          ? (
              decodeRotation({ packed: rotations.element(sourceSlot) }) as any
            ).toVar("gaussianQuaternion")
          : rotations.element(sourceSlot);
      const objectBase = this.objectOffset.add(
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
        ...passContextOverrides(frame),
        [gaussianIndex, () => sourceSlot],
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

      const positionWorld =
        nodes.gaussianPositionWorldNode === gaussianPositionWorld
          ? standardWorld
          : resolveNode(nodes.gaussianPositionWorldNode, worldOverrides).toVar(
              "gaussianPositionWorldValue",
            );
      let viewPosition: any =
        nodes.gaussianPositionWorldNode === gaussianPositionWorld
          ? modelView.mul(vec4(positionLocal, 1))
          : frame.view.mul(vec4(positionWorld, 1));
      viewPosition = viewPosition.toVar("gaussianViewPosition");
      const scale = resolveNode(nodes.gaussianScaleNode, worldOverrides).toVar(
        "gaussianScaleValue",
      );
      const rotation = resolveNode(
        nodes.gaussianRotationNode,
        worldOverrides,
      ).toVar("gaussianRotationValue");
      const covarianceView = (
        gaussianViewCovariance(scale, rotation, modelView) as any
      ).toVar("gaussianCovarianceViewValue");
      const rootOverrides = new Map(worldOverrides);
      rootOverrides.set(gaussianPositionLocal, () => positionLocal);
      rootOverrides.set(gaussianPositionWorld, () => positionWorld);
      rootOverrides.set(gaussianScale, () => scale);
      rootOverrides.set(gaussianRotation, () => rotation);
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
      ).clamp(0, data.sparkLodOpacity ? 65504 : 1);
      const opacity =
        this.antialiasMode === "compensated"
          ? opacityBase.mul(
              sqrt(clamp(originalDeterminant.div(determinant), 0, 1)),
            )
          : opacityBase;
      If(opacity.lessThan(float(1 / 255)).or(opacity.notEqual(opacity)), () => {
        Return();
      });
      const powerThreshold = data.sparkLodOpacity
        ? (wgslFn<any>(gaussianOpacitySupportWGSL)({ opacity }) as any)
        : log(opacity.mul(255));
      const extentX = sqrt(
        powerThreshold.mul(2).mul(clamp(covariance.x, 1e-12, 1e4)),
      );
      const extentY = sqrt(
        powerThreshold.mul(2).mul(clamp(covariance.z, 1e-12, 1e4)),
      );
      const radiusX = ceil(extentX).min(2047);
      const radiusY = ceil(extentY).min(2047);
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

      const standardColor = evaluateSh({
        gid: sourceSlot,
        sh_degree: this.shDegree,
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
      // Eleven bits per radius preserve Spark LOD support while the packed pair remains exact in f32.
      projectedConic
        .element(gid)
        .assign(vec4(conic, radiusX.add(radiusY.mul(2048))));
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
