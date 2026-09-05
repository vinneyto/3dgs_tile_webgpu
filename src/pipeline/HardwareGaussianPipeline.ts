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
  float,
  vec2,
  uint,
  vec4,
  uvec2,
  storage,
  instanceIndex,
  positionLocal,
  screenCoordinate,
  varying,
  exp,
  colorSpaceToWorking,
  wgslFn,
} from "three/tsl";
import {
  prepareHardwareDrawWGSL,
  hardwareVertexWGSL,
  hardwarePowerWGSL,
  hardwareCoordinateWGSL,
  hardwareFragmentWGSL,
} from "../kernels/hardwareRaster";
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
    this.prepareDraw = wgslFn<Record<string, Node>>(prepareHardwareDrawWGSL)({
      state: storage(this.visible.dispatch.state, "uvec4", 1).toReadOnly(),
      draw: storage(this.drawArguments, "uvec4", 1),
    })
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
    this.scene.name = "3DGS hardware rasterization";
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
    material.vertexNode = wgslFn<Record<string, Node>>(hardwareVertexWGSL)({
      mean,
      conic,
      corner: positionLocal.xy,
      projection: this.frame.projection,
      viewport: this.frame.viewport.xy,
    });
    const powerKernel = wgslFn<Record<string, Node>>(hardwarePowerWGSL);
    const coordinateKernel = wgslFn<Record<string, Node>>(
      hardwareCoordinateWGSL,
    );
    const fragmentKernel = wgslFn<Record<string, Node>>(hardwareFragmentWGSL);
    material.fragmentNode = Fn(() => {
      const pixel = screenCoordinate.xy;
      const delta = pixel.sub(mean.xy);
      // Materialize even if a custom alpha does not reference rasterPower:
      // the WGSL function's support discard must still execute.
      const power = float(
        powerKernel({ mean, conic, pixel }) as Node<"float">,
      ).toVar("hardwarePower");
      power.toStack();
      const coord = vec2(coordinateKernel({ conic, delta }) as Node<"vec2">);
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
      // ColorSpaceNode may widen RGB to RGBA during sRGB conversion. Pass
      // an explicit vec4 in and take RGB out before combining with custom alpha.
      const workingColor = vec4(
        colorSpaceToWorking(
          vec4(resolve(nodes.rasterColorNode), 1),
          this.colorSpace,
        ) as unknown as Node<"vec4">,
      );
      return fragmentKernel({
        color: workingColor.rgb,
        alpha: resolve(nodes.rasterAlphaNode),
        rejected: resolve(nodes.rasterDiscardNode),
      });
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
