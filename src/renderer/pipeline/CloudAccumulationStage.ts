import {
  Camera,
  Matrix4,
  Scene,
  Vector3,
  type ComputeNode,
  type Node,
  type UniformNode,
  type StorageBufferAttribute,
  type WebGPURenderer,
} from "three/webgpu";
import {
  Fn,
  If,
  Return,
  instanceIndex,
  normalize,
  uint,
  uniform,
  vec4,
  wgslFn,
} from "three/tsl";
import type { GaussianCloud } from "../GaussianCloud";
import type { GaussianCloudMaterial } from "../GaussianCloudMaterial";
import type { GaussianData } from "../GaussianData";
import type { GaussianRenderStore } from "../GaussianRenderStore";
import {
  compactRotationWGSL,
  compactScaleOpacityWGSL,
} from "../kernels/compactGaussians";
import { evaluateShWGSL } from "../kernels/projectionHelpers";
import {
  gaussianIndex,
  gaussianObjectId,
  gaussianObjectMatrix,
  gaussianObjectVisible,
  gaussianPositionLocal,
  gaussianPositionWorld,
  gaussianScale,
  gaussianRotation,
  gaussianOpacity,
  gaussianColor,
  gaussianViewDirection,
  passContextNodes,
  resolveGaussianNode,
  validateGaussianNodeAccess,
  type GaussianProjectionNodeSlots,
} from "../nodes/GaussianContextNodes";
import { gaussianViewCovariance } from "../nodes/GaussianProjectionNodes";
import { decodeActiveSlot } from "./activeSlots";
import { AttributePool } from "./AttributePool";
import { CloudSource } from "./CloudSource";
import { WORKGROUP_SIZE } from "./constants";
import { passContextOverrides, type FrameUniforms } from "./FrameUniforms";
import { StorageBindings } from "./StorageBindings";

/** Four vec4s: world mean/opacity, symmetric covariance (xx,xy,xz,yy),
 * (yz,zz,encodedSourceSlot,0), evaluated RGB. No per-splat cloud identifier.
 */
export const ACCUMULATED_VEC4S = 4;

interface CloudDispatch {
  readonly source: CloudSource;
  readonly matrixWorld: UniformNode<"mat4", Matrix4>;
  readonly cameraLocal: UniformNode<"vec3", Vector3>;
  readonly offset: UniformNode<"uint", number>;
  readonly count: UniformNode<"uint", number>;
  readonly degree: UniformNode<"uint", number>;
  readonly objectId: UniformNode<"uint", number>;
  material: GaussianCloudMaterial;
  materialVersion: number;
  compute: ComputeNode | null;
}

/** Pass-local accumulation; each cloud owns distinct local input buffers and uniforms. */
export class CloudAccumulationStage {
  attribute: StorageBufferAttribute;
  count = 0;
  generation = 0;
  readonly dispatches = new Map<GaussianCloud, CloudDispatch>();
  private readonly attributes = new AttributePool();
  private contentVersion = -1;
  private activeVersion = -1;
  private previousData: GaussianData | null = null;
  private previousClouds: readonly GaussianCloud[] = [];
  private readonly inverse = new Matrix4();
  private readonly cameraWorld = new Vector3();

  constructor(
    private readonly camera: Camera,
    private readonly store: GaussianRenderStore,
    private data: GaussianData,
    private readonly frame: FrameUniforms,
    private nodes: GaussianProjectionNodeSlots,
    private readonly bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.attribute = this.attributes.createFloat(
      "3dgs.world-gaussians",
      ACCUMULATED_VEC4S,
    );
  }

  updateData(data: GaussianData): void {
    this.data = data;
  }

  rebuild(nodes: GaussianProjectionNodeSlots): void {
    this.nodes = nodes;
    for (const dispatch of this.dispatches.values()) {
      dispatch.compute?.dispose();
      dispatch.compute = null;
    }
  }

  prepare(): void {
    const { data } = this;
    const clouds = this.store.clouds;
    const changed =
      this.previousData !== data ||
      this.contentVersion !== this.store.contentVersion ||
      this.activeVersion !== data.activeVersion ||
      clouds.length !== this.previousClouds.length ||
      clouds.some((cloud, index) => cloud !== this.previousClouds[index]);
    if (changed) {
      const slots = new Map(
        clouds.map((cloud) => [cloud.objectId, [] as number[]]),
      );
      for (let ordinal = 0; ordinal < data.activeCount; ordinal++) {
        const slot = data.activeSlots ? data.activeSlots[ordinal]! : ordinal;
        slots.get(data.means.array[slot * 4 + 3]!)?.push(slot);
      }
      for (const [cloud, dispatch] of this.dispatches) {
        if (clouds.includes(cloud)) continue;
        dispatch.compute?.dispose();
        dispatch.source.dispose();
        this.dispatches.delete(cloud);
      }
      for (const cloud of clouds) {
        let dispatch = this.dispatches.get(cloud);
        if (!dispatch) {
          dispatch = {
            source: new CloudSource(this.bindings),
            matrixWorld: uniform(new Matrix4()),
            cameraLocal: uniform(new Vector3()),
            offset: uniform(0, "uint"),
            count: uniform(0, "uint"),
            degree: uniform(0, "uint"),
            objectId: uniform(cloud.objectId, "uint"),
            material: cloud.material,
            materialVersion: -1,
            compute: null,
          };
          this.dispatches.set(cloud, dispatch);
        }
        const variantChanged = dispatch.source.update(
          data,
          slots.get(cloud.objectId) ?? [],
        );
        if (variantChanged) {
          dispatch.compute?.dispose();
          dispatch.compute = null;
        }
        dispatch.degree.value = data.shDegree;
      }
      this.previousClouds = [...clouds];
      this.previousData = data;
      this.contentVersion = this.store.contentVersion;
      this.activeVersion = data.activeVersion;
    }
    this.camera.updateWorldMatrix(true, false);
    this.cameraWorld.setFromMatrixPosition(this.camera.matrixWorld);
    this.count = 0;
    for (const [cloud, dispatch] of this.dispatches) {
      cloud.updateWorldMatrix(true, false);
      dispatch.count.value = isCloudVisible(cloud, this.camera)
        ? dispatch.source.count
        : 0;
      dispatch.offset.value = this.count;
      this.count += dispatch.count.value;
      dispatch.matrixWorld.value.copy(cloud.matrixWorld);
      dispatch.cameraLocal.value
        .copy(this.cameraWorld)
        .applyMatrix4(this.inverse.copy(cloud.matrixWorld).invert());
      if (
        dispatch.material !== cloud.material ||
        dispatch.materialVersion !== cloud.material.version
      ) {
        dispatch.compute?.dispose();
        dispatch.compute = null;
        dispatch.material = cloud.material;
        dispatch.materialVersion = cloud.material.version;
      }
    }
    const required = Math.max(1, this.count) * ACCUMULATED_VEC4S;
    this.attribute = this.attributes.grow(this.attribute, required);
    for (const dispatch of this.dispatches.values()) {
      if (!dispatch.compute) {
        dispatch.compute = this.createCompute(dispatch);
        this.generation++;
      }
      dispatch.compute.count = Math.max(1, dispatch.source.count);
    }
    this.frame.activeCount.value = this.count;
  }

  encode(renderer: WebGPURenderer): void {
    for (const dispatch of this.dispatches.values()) {
      if (!dispatch.compute || dispatch.count.value === 0) continue;
      const groups = Math.ceil(dispatch.count.value / WORKGROUP_SIZE);
      renderer.compute(dispatch.compute, [
        Math.min(groups, 65535),
        Math.ceil(groups / 65535),
        1,
      ]);
    }
  }

  hasPendingMaterialChanges(): boolean {
    return this.store.clouds.some((cloud) => {
      const dispatch = this.dispatches.get(cloud);
      return (
        !dispatch ||
        !dispatch.compute ||
        dispatch.material !== cloud.material ||
        dispatch.materialVersion !== cloud.material.version
      );
    });
  }

  getComputeNodes(): ComputeNode[] {
    return [...this.dispatches.values()].flatMap((d) =>
      d.compute ? [d.compute] : [],
    );
  }

  private createCompute(d: CloudDispatch): ComputeNode {
    const { data, frame, nodes } = this;
    const material = d.material;
    const allowed = new Set<Node>([
      ...passContextNodes,
      gaussianIndex,
      gaussianObjectId,
      gaussianObjectMatrix,
      gaussianObjectVisible,
      gaussianPositionLocal,
      gaussianPositionWorld,
      gaussianScale,
      gaussianRotation,
      gaussianOpacity,
      gaussianColor,
      gaussianViewDirection,
    ]);
    for (const node of [
      material.positionLocalNode,
      material.positionWorldNode,
      material.scaleNode,
      material.rotationNode,
      material.opacityNode,
      material.colorNode,
      nodes.gaussianPositionLocalNode,
      nodes.gaussianPositionWorldNode,
      nodes.gaussianScaleNode,
      nodes.gaussianRotationNode,
    ])
      validateGaussianNodeAccess(node, allowed, "cloud material");
    const input = d.source.buffers;
    const means = this.attributes.storage(input.means, "vec4").toReadOnly();
    const shape = this.attributes
      .storage(
        input.scalesOpacity,
        data.geometryFormat === "compact" ? "uvec2" : "vec4",
      )
      .toReadOnly();
    const rotation = this.attributes
      .storage(
        input.rotations,
        data.geometryFormat === "compact" ? "uint" : "vec4",
      )
      .toReadOnly();
    const sh = this.attributes
      .storage(
        input.shCoefficients,
        data.shFormat === "rgb8e8" ? "uint" : "vec4",
      )
      .toReadOnly();
    const output = this.attributes.storage(this.attribute, "vec4");
    const decodeShape = wgslFn<any>(compactScaleOpacityWGSL);
    const decodeRotation = wgslFn<any>(compactRotationWGSL);
    const evaluateSh = wgslFn<any>(evaluateShWGSL(data.shFormat));
    return Fn(() => {
      const index = uint(instanceIndex);
      If(index.greaterThanEqual(d.count), () => {
        Return();
      });
      const mean = means.element(index);
      const scaleOpacity: any =
        data.geometryFormat === "compact"
          ? decodeShape({ packed: shape.element(index) })
          : shape.element(index);
      const quaternion: any =
        data.geometryFormat === "compact"
          ? decodeRotation({ packed: rotation.element(index) })
          : rotation.element(index);
      const overrides = new Map<any, () => any>([
        ...passContextOverrides(frame),
        [gaussianIndex, () => decodeActiveSlot({ value: mean.w })],
        [gaussianObjectId, () => d.objectId],
        [gaussianObjectMatrix, () => d.matrixWorld],
        [gaussianObjectVisible, () => uint(1).equal(1)],
        [gaussianPositionLocal, () => mean.xyz],
        [gaussianScale, () => scaleOpacity.xyz],
        [gaussianRotation, () => quaternion],
        [gaussianOpacity, () => scaleOpacity.w],
      ]);
      const resolve = (node: Node) => resolveGaussianNode(node, overrides);
      const local = resolve(material.positionLocalNode).toVar(
        "cloudPositionLocal",
      );
      overrides.set(gaussianPositionLocal, () => local);
      const passLocal = resolve(nodes.gaussianPositionLocalNode).toVar(
        "gaussianPositionLocalValue",
      );
      overrides.set(gaussianPositionLocal, () => passLocal);
      const world = d.matrixWorld
        .mul(vec4(passLocal, 1))
        .xyz.toVar("cloudPositionWorld");
      overrides.set(gaussianPositionWorld, () => world);
      const direction = normalize(passLocal.sub(d.cameraLocal)).toVar(
        "cloudViewDirection",
      );
      overrides.set(gaussianViewDirection, () => direction);
      const materialWorld = resolve(material.positionWorldNode).toVar(
        "cloudMaterialWorld",
      );
      overrides.set(gaussianPositionWorld, () => materialWorld);
      const positionWorld = resolve(nodes.gaussianPositionWorldNode).toVar(
        "gaussianPositionWorldValue",
      );
      overrides.set(gaussianPositionWorld, () => positionWorld);
      const scale = resolve(material.scaleNode).toVar("cloudScale");
      overrides.set(gaussianScale, () => scale);
      const passScale = resolve(nodes.gaussianScaleNode).toVar(
        "gaussianScaleValue",
      );
      overrides.set(gaussianScale, () => passScale);
      const rotated = resolve(material.rotationNode).toVar("cloudRotation");
      overrides.set(gaussianRotation, () => rotated);
      const passRotation = resolve(nodes.gaussianRotationNode).toVar(
        "gaussianRotationValue",
      );
      overrides.set(gaussianRotation, () => passRotation);
      const opacity = resolve(material.opacityNode).toVar("cloudOpacity");
      overrides.set(gaussianOpacity, () => opacity);
      const standardColor = evaluateSh({
        gid: index,
        sh_degree: d.degree,
        direction,
        sh_coefficients: sh,
      });
      overrides.set(gaussianColor, () => standardColor);
      const color = resolve(material.colorNode).toVar("cloudColor");
      const covariance = (
        gaussianViewCovariance(passScale, passRotation, d.matrixWorld) as any
      ).toVar("cloudCovarianceWorld");
      const base = index.add(d.offset).mul(ACCUMULATED_VEC4S);
      output.element(base).assign(vec4(positionWorld, opacity));
      output
        .element(base.add(1))
        .assign(vec4(covariance.element(0).xyz, covariance.element(1).y));
      output
        .element(base.add(2))
        .assign(
          vec4(covariance.element(1).z, covariance.element(2).z, mean.w, 0),
        );
      output.element(base.add(3)).assign(vec4(color, 0));
    })()
      .compute(Math.max(1, d.source.count), [WORKGROUP_SIZE])
      .setName("3DGS cloud material TSL");
  }

  dispose(): void {
    for (const d of this.dispatches.values()) {
      d.compute?.dispose();
      d.source.dispose();
    }
    this.dispatches.clear();
    this.attributes.dispose();
  }
}

export function isCloudVisible(cloud: GaussianCloud, camera: Camera): boolean {
  if (!cloud.layers.test(camera.layers)) return false;
  let root: GaussianCloud | GaussianCloud["parent"] = cloud;
  for (
    let current: GaussianCloud | GaussianCloud["parent"] = cloud;
    current !== null;
    current = current.parent
  ) {
    if (!current.visible) return false;
    root = current;
  }
  return root instanceof Scene;
}
