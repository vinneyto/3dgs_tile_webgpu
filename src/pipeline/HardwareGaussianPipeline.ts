import {
  Float32BufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  Scene,
  DoubleSide,
  type ColorSpace,
  type PerspectiveCamera,
  type WebGPURenderer,
  type Node,
  type ComputeNode,
} from "three/webgpu";
import {
  Fn,
  If,
  Discard,
  float,
  uint,
  vec2,
  vec4,
  uvec2,
  uvec4,
  storage,
  instanceIndex,
  positionLocal,
  screenCoordinate,
  varying,
  sqrt,
  max,
  log,
  exp,
  colorSpaceToWorking,
} from "three/tsl";
import type { GaussianData } from "../GaussianData";
import type { GaussianStore } from "../GaussianStore";
import * as context from "../nodes/GaussianContextNodes";
import { AttributePool } from "./AttributePool";
import { FrameUniforms } from "./FrameUniforms";
import { ObjectFrameState } from "./ObjectFrameState";
import { ProjectionStage } from "./ProjectionStage";
import { ExclusiveScanStage } from "./ExclusiveScanStage";
import { VisibleGaussianStage } from "./VisibleGaussianStage";
import { RadixSorter } from "./RadixSorter";
import type {
  AntialiasMode,
  DepthSortMode,
  ResolvedRadixBackend,
} from "./types";

export type HardwareGaussianNodeSlots = context.GaussianProjectionNodeSlots &
  Pick<
    context.GaussianRasterNodeSlots,
    "rasterColorNode" | "rasterAlphaNode" | "rasterDiscardNode"
  >;

/** GPU preparation shared with the tiled backend, followed by one indirect draw. */
export class HardwareGaussianPipeline {
  readonly frame: FrameUniforms;
  readonly objects: ObjectFrameState;
  readonly projection: ProjectionStage;
  readonly visibleScan: ExclusiveScanStage;
  readonly visible: VisibleGaussianStage;
  readonly depthSorter: RadixSorter;
  readonly scene = new Scene();
  readonly geometry = new InstancedBufferGeometry();
  readonly mesh: Mesh;
  private readonly attributes = new AttributePool();
  readonly drawArguments = this.attributes.createIndirect("3dgs.hardware-draw");
  readonly prepareDraw: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    camera: PerspectiveCamera,
    private readonly data: GaussianData,
    store: GaussianStore,
    mode: DepthSortMode,
    antialiasMode: AntialiasMode,
    radixBackend: ResolvedRadixBackend,
    private readonly colorSpace: ColorSpace,
    nodes: HardwareGaussianNodeSlots,
    subpixelSampleCulling: boolean,
    private readonly profileKernels: boolean,
  ) {
    this.frame = new FrameUniforms(camera, [0, 0, 0, 0]);
    this.objects = new ObjectFrameState(camera, store, data.count);
    this.projection = new ProjectionStage(
      data,
      this.frame,
      this.objects,
      antialiasMode,
      nodes,
      subpixelSampleCulling,
      false,
    );
    this.visibleScan = new ExclusiveScanStage(
      this.projection.projectedMean,
      data.count,
      "visible",
      "projectedVisibility",
    );
    this.visible = new VisibleGaussianStage(
      renderer,
      mode,
      data.count,
      this.visibleScan.output,
      this.projection.projectedMean,
      this.frame.viewport,
    );
    this.depthSorter = new RadixSorter(
      renderer,
      "depth",
      data.count,
      this.visible.buffers,
      this.visible.dispatch,
      radixBackend,
    );
    this.depthSorter.configure(mode === "float32" ? 32 : 16);
    const count = storage(this.visible.dispatch.state, "uvec4", 1)
      .toReadOnly()
      .element(0).x;
    const draw = storage(this.drawArguments, "uvec4", 1);
    this.prepareDraw = Fn(() => {
      // drawIndirect: vertexCount, instanceCount, firstVertex, firstInstance.
      draw.element(0).assign(uvec4(uint(6), count, uint(0), uint(0)));
    })()
      .compute(1)
      .setName("3DGS prepare hardware indirect draw");
    this.geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0],
        3,
      ),
    );
    this.geometry.instanceCount = 1; // Actual instance count stays on the GPU.
    this.geometry.setIndirect(this.drawArguments);
    this.mesh = new Mesh(this.geometry, this.createMaterial(nodes));
    this.mesh.name = "3DGS hardware splats";
    this.mesh.frustumCulled = false;
    this.mesh.layers.enableAll();
    this.scene.add(this.mesh);
  }

  prepare(width: number, height: number): void {
    this.frame.update(width, height, 1, 1);
    this.objects.update();
    this.projection.encode(this.renderer);
    this.visibleScan.encode(this.renderer);
    this.visible.encode(this.profileKernels);
    this.depthSorter.encode(this.profileKernels);
    this.renderer.compute(this.prepareDraw);
  }

  rebuildProjection(nodes: HardwareGaussianNodeSlots): void {
    this.projection.rebuild(nodes);
  }
  rebuildRasterizer(nodes: HardwareGaussianNodeSlots): void {
    const material = this.createMaterial(nodes);
    (this.mesh.material as MeshBasicNodeMaterial).dispose();
    this.mesh.material = material;
  }

  private createMaterial(
    nodes: HardwareGaussianNodeSlots,
  ): MeshBasicNodeMaterial {
    const allowed = new Set(context.rasterContextNodes);
    allowed.delete(context.rasterPixelValue);
    for (const [name, node] of Object.entries({
      rasterColorNode: nodes.rasterColorNode,
      rasterAlphaNode: nodes.rasterAlphaNode,
      rasterDiscardNode: nodes.rasterDiscardNode,
    })) {
      context.validateGaussianNodeDomain(
        node,
        context.rasterContextNodes,
        "raster",
      );
      context.validateGaussianNodeAccess(node, allowed, name);
    }
    const meanBuffer = storage(
      this.projection.projectedMean,
      "vec4",
      this.projection.projectedMean.count,
    ).toReadOnly();
    const conicBuffer = storage(
      this.projection.projectedConic,
      "vec4",
      this.data.count,
    ).toReadOnly();
    const colorBuffer = storage(
      this.projection.projectedColor,
      "vec4",
      this.data.count,
    ).toReadOnly();
    const sorted = storage(
      this.depthSorter.sortedRecords,
      "uvec2",
      this.data.count,
    ).toReadOnly();
    const count = storage(this.visible.dispatch.state, "uvec4", 1)
      .toReadOnly()
      .element(0).x;
    const id: any = varying(
      sorted.element(count.sub(uint(1)).sub(uint(instanceIndex))).y,
      "hardwareGaussianId",
    ).setInterpolation("flat");
    const mean: any = varying(
      meanBuffer.element(id),
      "hardwareMean",
    ).setInterpolation("flat");
    const conic: any = varying(
      conicBuffer.element(id),
      "hardwareConic",
    ).setInterpolation("flat");
    const color: any = varying(
      colorBuffer.element(id),
      "hardwareColor",
    ).setInterpolation("flat");
    const material = new MeshBasicNodeMaterial();
    material.name = "3DGS hardware Gaussian material";
    material.transparent = true;
    material.premultipliedAlpha = true;
    material.depthTest = true;
    material.depthWrite = false;
    material.side = DoubleSide;
    material.forceSinglePass = true;
    material.toneMapped = false;
    material.vertexNode = Fn(() => {
      // Principal axes of the covariance, recovered from the inverse conic.
      const det: any = max(
        conic.x.mul(conic.z).sub(conic.y.mul(conic.y)),
        1e-20,
      );
      const xx: any = conic.z.div(det);
      const xy: any = conic.y.negate().div(det);
      const yy: any = conic.x.div(det);
      const discriminant: any = sqrt(xx.sub(yy).pow(2).add(xy.pow(2).mul(4)));
      const lambda: any = max(xx.add(yy).add(discriminant).mul(0.5), 1e-12);
      const axis: any = vec2(xy, lambda.sub(xx)).toVar("hardwareAxis");
      If(axis.dot(axis).lessThan(1e-20), () => {
        axis.assign(vec2(1, 0));
      });
      axis.assign(axis.normalize());
      const cutoff: any = max(log(mean.w.mul(255)).mul(2), 0);
      const extent1: any = sqrt(lambda.mul(cutoff));
      const extent2: any = sqrt(
        max(float(1).div(det.mul(lambda)), 1e-12).mul(cutoff),
      );
      const offset: any = axis
        .mul(positionLocal.x.mul(extent1))
        .add(vec2(axis.y.negate(), axis.x).mul(positionLocal.y.mul(extent2)));
      const pixel: any = mean.xy.add(offset);
      const ndc: any = vec2(
        pixel.x.div(this.frame.viewport.x).mul(2).sub(1),
        float(1).sub(pixel.y.div(this.frame.viewport.y).mul(2)),
      );
      const clip: any = this.frame.projection.mul(
        vec4(0, 0, mean.z.negate(), 1),
      );
      return vec4(ndc.mul(clip.w), clip.z, clip.w);
    })();
    material.fragmentNode = Fn(() => {
      const pixel: any = screenCoordinate.xy;
      const delta: any = pixel.sub(mean.xy);
      const power: any = conic.x
        .mul(delta.x.pow(2))
        .add(conic.y.mul(delta.x).mul(delta.y).mul(2))
        .add(conic.z.mul(delta.y.pow(2)))
        .mul(-0.5);
      If(power.lessThan(log(mean.w.mul(255)).negate()), () => {
        Discard();
      });
      const l00: any = sqrt(max(conic.x, 1e-12));
      const l10: any = conic.y.div(l00);
      const l11: any = sqrt(max(conic.z.sub(l10.mul(l10)), 1e-12));
      const coord: any = vec2(
        l00.mul(delta.x).add(l10.mul(delta.y)),
        l11.mul(delta.y),
      );
      const means = storage(
        this.data.means,
        "vec4",
        this.data.count,
      ).toReadOnly();
      const overrides = new Map<any, () => any>([
        [context.rasterGaussianIndex, () => id],
        [context.rasterObjectId, () => uint(means.element(id).w)],
        [context.rasterPixelCoordinate, () => uvec2(pixel)],
        [context.rasterScreenPosition, () => pixel],
        [context.rasterScreenUV, () => pixel.div(this.frame.viewport.xy)],
        [context.rasterGaussianCenter, () => mean.xy],
        [context.rasterPixelDelta, () => delta],
        [context.rasterGaussianCoord, () => coord],
        [context.rasterUV, () => coord.div(6).add(0.5)],
        [context.rasterViewDepth, () => mean.z],
        [context.rasterGaussianColor, () => color.xyz],
        [context.rasterGaussianOpacity, () => mean.w],
        [context.rasterPower, () => power],
        [context.rasterWeight, () => exp(power)],
      ]);
      const resolve = (node: Node): any =>
        (node as any).context({ overrideNodes: overrides });
      If(resolve(nodes.rasterDiscardNode), () => {
        Discard();
      });
      const alpha: any = resolve(nodes.rasterAlphaNode).clamp(0, 0.99);
      If(alpha.lessThan(1 / 255), () => {
        Discard();
      });
      // NodeMaterial premultiplies once, after evaluating this straight color.
      return vec4(
        colorSpaceToWorking(
          resolve(nodes.rasterColorNode),
          this.colorSpace,
        ) as any,
        alpha,
      );
    })();
    return material;
  }

  async readVisibleCount(): Promise<number> {
    const buffer = await this.renderer.getArrayBufferAsync(
      this.visible.dispatch.state,
    );
    return new Uint32Array(buffer)[0] ?? 0;
  }

  dispose(): void {
    (this.mesh.material as MeshBasicNodeMaterial).dispose();
    this.geometry.dispose();
    this.prepareDraw.dispose();
    this.depthSorter.dispose();
    this.visible.dispose();
    this.visibleScan.dispose();
    this.projection.dispose();
    this.objects.dispose();
    this.attributes.dispose();
  }
}
