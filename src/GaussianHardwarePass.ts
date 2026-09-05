import {
  Color,
  HalfFloatType,
  PassNode,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGPUCoordinateSystem,
  type ColorSpace,
  type Node,
  type NodeFrame,
  type WebGPURenderer,
} from "three/webgpu";
import {
  uniform,
  perspectiveDepthToViewZ,
  viewZToOrthographicDepth,
} from "three/tsl";
import { GaussianStore } from "./GaussianStore";
import { createDefaultGaussianNodeSlots } from "./nodes/GaussianContextNodes";
import {
  HardwareGaussianPipeline,
  type HardwareGaussianNodeSlots,
} from "./pipeline/HardwareGaussianPipeline";
import { resolveRadixBackend } from "./pipeline/radixBackend";
import type {
  GaussianPassOptions,
  GaussianPassStats,
  GaussianPassDebugInfo,
  GaussianPassDebugListener,
  DepthSortMode,
  AntialiasMode,
  ResolvedRadixBackend,
} from "./pipeline/types";

export interface GaussianHardwarePassOptions extends Pick<
  GaussianPassOptions,
  | "depthSortMode"
  | "antialiasMode"
  | "colorSpace"
  | "profileKernels"
  | "subpixelSampleCulling"
  | "radixBackend"
> {
  /** Optional mesh scene: opaque geometry, splats, then transparent geometry share one depth attachment. */
  scene?: Scene;
}

/** GPU-sorted instanced quads with native blending and opaque-scene depth testing. */
export class GaussianHardwarePass extends PassNode {
  readonly gaussianStore: GaussianStore;
  readonly depthSortMode: DepthSortMode;
  readonly antialiasMode: AntialiasMode;
  readonly colorSpace: ColorSpace;
  readonly profileKernels: boolean;
  readonly subpixelSampleCulling: boolean;
  readonly radixBackend: ResolvedRadixBackend;
  private readonly ownerRenderer: WebGPURenderer;
  private readonly nodeSlots: HardwareGaussianNodeSlots =
    createDefaultGaussianNodeSlots();
  private pipeline: HardwareGaussianPipeline | null = null;
  private layoutVersion = -1;
  private projectionDirty = false;
  private rasterDirty = false;
  private disposed = false;
  private readonly size = new Vector2();
  private readonly nearNode = uniform(0.01);
  private readonly farNode = uniform(1000);
  private readonly debugListeners = new Set<GaussianPassDebugListener>();

  constructor(
    renderer: WebGPURenderer,
    camera: PerspectiveCamera,
    store: GaussianStore,
    options: GaussianHardwarePassOptions = {},
  ) {
    super(PassNode.COLOR, options.scene ?? new Scene(), camera, {
      type: HalfFloatType,
      samples: 0,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.ownerRenderer = renderer;
    this.gaussianStore = store;
    this.depthSortMode = options.depthSortMode ?? "float32";
    this.antialiasMode = options.antialiasMode ?? "compensated";
    if (!["float32", "packed16"].includes(this.depthSortMode))
      throw new RangeError("Invalid depthSortMode");
    if (!["classic", "compensated"].includes(this.antialiasMode))
      throw new RangeError("Invalid antialiasMode");
    this.colorSpace = options.colorSpace ?? SRGBColorSpace;
    this.profileKernels = options.profileKernels ?? false;
    this.subpixelSampleCulling = options.subpixelSampleCulling ?? true;
    this.radixBackend = resolveRadixBackend(
      options.radixBackend ?? "auto",
      renderer.hasFeature("subgroups"),
    );
    this.name = "3DGS hardware pass";
  }

  invalidateProjection(): void {
    this.projectionDirty = true;
  }
  invalidateRasterizer(): void {
    this.rasterDirty = true;
  }
  override set needsUpdate(value: boolean) {
    super.needsUpdate = value;
    if (value) {
      this.projectionDirty = true;
      this.rasterDirty = true;
    }
  }

  override getViewZNode(name = "depth"): Node<"float"> {
    return perspectiveDepthToViewZ(
      this.getTextureNode(name),
      this.nearNode,
      this.farNode,
    );
  }
  override getLinearDepthNode(name = "depth"): Node<"float"> {
    return viewZToOrthographicDepth(
      this.getViewZNode(name),
      this.nearNode,
      this.farNode,
    );
  }

  override updateBefore(frame: NodeFrame): undefined {
    const renderer = frame.renderer as WebGPURenderer;
    if (this.disposed)
      throw new Error("GaussianHardwarePass has been disposed");
    if (renderer !== this.ownerRenderer)
      throw new Error("GaussianHardwarePass renderer mismatch");
    if (!(this.camera instanceof PerspectiveCamera))
      throw new TypeError("GaussianHardwarePass requires a PerspectiveCamera");
    if (renderer.reversedDepthBuffer || renderer.logarithmicDepthBuffer)
      throw new Error("GaussianHardwarePass currently requires standard depth");
    const camera = this.camera;
    if (camera.coordinateSystem !== WebGPUCoordinateSystem) {
      camera.coordinateSystem = WebGPUCoordinateSystem;
      camera.updateProjectionMatrix();
    }
    this.nearNode.value = camera.near;
    this.farNode.value = camera.far;
    renderer.getDrawingBufferSize(this.size);
    this.setSize(Math.max(1, this.size.x), Math.max(1, this.size.y));
    if (this.gaussianStore.needsPack) {
      const backend = renderer.backend as unknown as { device?: GPUDevice };
      if (!backend.device)
        throw new Error("Initialize WebGPURenderer before rendering");
      this.gaussianStore.pack({ limits: backend.device.limits });
    }
    const lod = this.gaussianStore.updateLod(camera);
    const data = this.gaussianStore.getPackedData();
    if (data.count > 256 * 65535)
      throw new RangeError("Gaussian projection dispatch limit exceeded");
    if (
      !this.pipeline ||
      this.layoutVersion !== this.gaussianStore.layoutVersion
    ) {
      this.pipeline?.dispose();
      this.pipeline = new HardwareGaussianPipeline(
        renderer,
        camera,
        data,
        this.gaussianStore,
        this.depthSortMode,
        this.antialiasMode,
        this.radixBackend,
        this.colorSpace,
        this.nodeSlots,
        this.subpixelSampleCulling,
        this.profileKernels,
      );
      this.layoutVersion = this.gaussianStore.layoutVersion;
      this.projectionDirty = this.rasterDirty = false;
    } else {
      if (this.projectionDirty) this.pipeline.rebuildProjection(this.nodeSlots);
      if (this.rasterDirty) this.pipeline.rebuildRasterizer(this.nodeSlots);
      this.projectionDirty = this.rasterDirty = false;
    }
    this.pipeline.prepare(this.renderTarget.width, this.renderTarget.height);
    this.renderScene(renderer, camera);
    if (this.debugListeners.size) {
      const snapshot = {
        pass: this.getDebugInfo(),
        storePack: this.gaussianStore.lastPackStats,
        lod,
      };
      for (const listener of this.debugListeners) listener(snapshot);
    }
    return undefined;
  }

  private renderScene(
    renderer: WebGPURenderer,
    camera: PerspectiveCamera,
  ): void {
    const scene = this.scene as Scene;
    const target = renderer.getRenderTarget();
    const mrt = renderer.getMRT();
    const autoClear = renderer.autoClear;
    const opaque = renderer.opaque;
    const transparent = renderer.transparent;
    const background = scene.background;
    const clearColor = renderer.getClearColor(new Color());
    const clearAlpha = renderer.getClearAlpha();
    const mask = camera.layers.mask;
    try {
      const layers = this.getLayers();
      if (layers) camera.layers.mask = layers.mask;
      renderer.setRenderTarget(this.renderTarget);
      renderer.setMRT(null);
      renderer.setClearColor(0, 0);
      renderer.autoClear = true;
      renderer.opaque = true;
      renderer.transparent = false;
      renderer.render(scene, camera);
      // Subsequent draws load the same color/depth attachments. Never copy depth.
      renderer.autoClear = false;
      renderer.opaque = false;
      renderer.transparent = true;
      renderer.render(this.pipeline!.scene, camera);
      scene.background = null;
      renderer.render(scene, camera);
    } finally {
      scene.background = background;
      camera.layers.mask = mask;
      renderer.setClearColor(clearColor, clearAlpha);
      renderer.autoClear = autoClear;
      renderer.opaque = opaque;
      renderer.transparent = transparent;
      renderer.setRenderTarget(target);
      renderer.setMRT(mrt);
    }
  }

  subscribeDebug(listener: GaussianPassDebugListener): () => void {
    this.debugListeners.add(listener);
    return () => this.debugListeners.delete(listener);
  }
  async readStats(): Promise<GaussianPassStats> {
    return {
      visibleGaussianCount: (await this.pipeline?.readVisibleCount()) ?? 0,
      intersectionCount: 0,
      requestedIntersections: 0,
      intersectionCapacity: 0,
      overflow: false,
      profile: null,
    };
  }
  getDebugInfo(): GaussianPassDebugInfo {
    const passes = this.pipeline?.depthSorter.passCount ?? 0;
    return {
      initialized: this.pipeline !== null,
      width: this.renderTarget.width,
      height: this.renderTarget.height,
      tilesX: 0,
      tilesY: 0,
      tileStageRebuilds: 0,
      radixPasses: passes,
      depthRadixPasses: passes,
      tileRadixPasses: 0,
      radixBackend: this.radixBackend,
      profileKernels: this.profileKernels,
      maxRasterizedSplatsPerTile: null,
      rasterChunkSize: null,
      subpixelSampleCulling: this.subpixelSampleCulling,
    };
  }

  override dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.debugListeners.clear();
    super.dispose();
  }

  private setNode(
    key: keyof HardwareGaussianNodeSlots,
    node: Node,
    projection: boolean,
  ): void {
    if (!node?.isNode) throw new TypeError(`${key} must be a Three.js Node`);
    if (this.nodeSlots[key] === node) return;
    this.nodeSlots[key] = node;
    if (projection) this.invalidateProjection();
    else this.invalidateRasterizer();
  }
  get gaussianPositionLocalNode(): Node {
    return this.nodeSlots.gaussianPositionLocalNode;
  }
  set gaussianPositionLocalNode(node: Node) {
    this.setNode("gaussianPositionLocalNode", node, true);
  }
  get gaussianPositionWorldNode(): Node {
    return this.nodeSlots.gaussianPositionWorldNode;
  }
  set gaussianPositionWorldNode(node: Node) {
    this.setNode("gaussianPositionWorldNode", node, true);
  }
  get gaussianScaleNode(): Node {
    return this.nodeSlots.gaussianScaleNode;
  }
  set gaussianScaleNode(node: Node) {
    this.setNode("gaussianScaleNode", node, true);
  }
  get gaussianRotationNode(): Node {
    return this.nodeSlots.gaussianRotationNode;
  }
  set gaussianRotationNode(node: Node) {
    this.setNode("gaussianRotationNode", node, true);
  }
  get gaussianOpacityNode(): Node {
    return this.nodeSlots.gaussianOpacityNode;
  }
  set gaussianOpacityNode(node: Node) {
    this.setNode("gaussianOpacityNode", node, true);
  }
  get gaussianColorNode(): Node {
    return this.nodeSlots.gaussianColorNode;
  }
  set gaussianColorNode(node: Node) {
    this.setNode("gaussianColorNode", node, true);
  }
  get gaussianVisibilityNode(): Node {
    return this.nodeSlots.gaussianVisibilityNode;
  }
  set gaussianVisibilityNode(node: Node) {
    this.setNode("gaussianVisibilityNode", node, true);
  }
  get rasterColorNode(): Node {
    return this.nodeSlots.rasterColorNode;
  }
  set rasterColorNode(node: Node) {
    this.setNode("rasterColorNode", node, false);
  }
  get rasterAlphaNode(): Node {
    return this.nodeSlots.rasterAlphaNode;
  }
  set rasterAlphaNode(node: Node) {
    this.setNode("rasterAlphaNode", node, false);
  }
  get rasterDiscardNode(): Node {
    return this.nodeSlots.rasterDiscardNode;
  }
  set rasterDiscardNode(node: Node) {
    this.setNode("rasterDiscardNode", node, false);
  }
}

export function gaussianHardwarePass(
  renderer: WebGPURenderer,
  camera: PerspectiveCamera,
  store: GaussianStore,
  options: GaussianHardwarePassOptions = {},
): GaussianHardwarePass {
  return new GaussianHardwarePass(renderer, camera, store, options);
}
