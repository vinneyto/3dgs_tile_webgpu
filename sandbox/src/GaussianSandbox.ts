import {
  DirectionalLight,
  Group,
  HemisphereLight,
  Layers,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PassNode,
  PerspectiveCamera,
  Raycaster,
  RenderPipeline,
  Scene,
  SphereGeometry,
  Vector2,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { pass as scenePass, perspectiveDepthToViewZ, uniform } from "three/tsl";
import {
  CanonicalGaussianPlyLoader,
  gaussianPass,
  rasterPixelCoordinate,
  rasterPixelValue,
  rasterViewDepth,
  type GaussianCloud,
  type GaussianPass,
  GaussianStore,
} from "../../src/index";
import {
  addDataWithSandboxLod,
  measureCloud,
  SANDBOX_LOD_LEVELS,
  type CloudBounds,
} from "./cloudData";
import { CloudStatus } from "./CloudStatus";
import {
  compositeDepthTestedPremultipliedOver,
  compositePremultipliedOver,
} from "./compositePremultipliedOver";
import { DebugPanel } from "./DebugPanel";
import { KernelTimingInspector } from "./KernelTimingInspector";
import { readSandboxOptions, type SandboxOptions } from "./SandboxOptions";
import { SpatialDebugHelpers } from "./SpatialDebugHelpers";

export class GaussianSandbox {
  private readonly loader = new CanonicalGaussianPlyLoader();
  private readonly scene = new Scene();
  private readonly controls: OrbitControls;
  private readonly hoverRaycaster = new Raycaster();
  private readonly hoverPointer = new Vector2();
  private readonly sceneLayers = new Layers();
  private readonly overlayLayers = new Layers();
  private readonly hoverMarkerGeometry = new SphereGeometry(1, 24, 16);
  private readonly hoverMarkerOpaque = new Mesh(
    this.hoverMarkerGeometry,
    new MeshStandardMaterial({
      color: 0xff8a4c,
      emissive: 0x8a2f12,
      emissiveIntensity: 0.75,
      metalness: 0.05,
      roughness: 0.28,
    }),
  );
  private readonly hoverMarkerOverlay = new Mesh(
    this.hoverMarkerGeometry,
    new MeshBasicMaterial({
      color: 0xffb08a,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  private readonly hoverMarker = new Group();
  private readonly debugPanel: DebugPanel;
  private readonly spatialDebug = new SpatialDebugHelpers();
  private readonly cloudStatus: CloudStatus;
  private pipeline: RenderPipeline | null = null;
  private pass: GaussianPass | null = null;
  private store: GaussianStore | null = null;
  private opaquePass: PassNode | null = null;
  private transparentPass: PassNode | null = null;
  private overlayPass: PassNode | null = null;
  private cloud: GaussianCloud | null = null;
  private controlsActive = false;
  private disposed = false;
  private readonly handleResize = () => this.resize();
  private readonly handleControlsStart = () => {
    this.controlsActive = true;
    this.hoverMarker.visible = false;
  };
  private readonly handleControlsEnd = () => {
    this.controlsActive = false;
  };
  private readonly handlePointerMove = (event: PointerEvent) =>
    this.updateHoverMarker(event);
  private readonly handlePointerLeave = () => {
    this.hoverMarker.visible = false;
  };

  private constructor(
    private readonly renderer: WebGPURenderer,
    private readonly camera: PerspectiveCamera,
    status: HTMLElement,
    metrics: HTMLElement,
    kernelTimings: HTMLElement,
    timingInspector: KernelTimingInspector | null,
    private readonly options: SandboxOptions,
  ) {
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.addEventListener("start", this.handleControlsStart);
    this.controls.addEventListener("end", this.handleControlsEnd);
    renderer.domElement.addEventListener("pointermove", this.handlePointerMove);
    renderer.domElement.addEventListener(
      "pointerleave",
      this.handlePointerLeave,
    );
    this.hoverMarker.visible = false;
    this.hoverMarkerOpaque.renderOrder = 1;
    this.hoverMarkerOverlay.renderOrder = 2;
    this.hoverMarkerOverlay.layers.set(1);
    this.overlayLayers.set(1);
    this.hoverMarker.add(this.hoverMarkerOpaque, this.hoverMarkerOverlay);
    const markerKeyLight = new DirectionalLight(0xffffff, 2.5);
    markerKeyLight.position.set(1, 2, 3);
    this.scene.add(
      new HemisphereLight(0xdde8ff, 0x182033, 1.7),
      markerKeyLight,
      this.hoverMarker,
    );
    this.cloudStatus = new CloudStatus(status);
    this.debugPanel = new DebugPanel(
      renderer,
      metrics,
      kernelTimings,
      timingInspector,
      options.debugEnabled,
      options.statsEnabled,
    );

    renderer.setAnimationLoop((time) => {
      const encodeStart = performance.now();
      this.controls.update();
      if (this.pipeline !== null && timingInspector !== null) {
        timingInspector.beginFrameSample(renderer);
        try {
          this.pipeline.render();
        } finally {
          timingInspector.endFrameSample(renderer);
        }
      } else {
        this.pipeline?.render();
      }
      this.debugPanel.update(time, performance.now() - encodeStart);
    });
    addEventListener("resize", this.handleResize);
  }

  static async create(
    viewport: HTMLElement,
    status: HTMLElement,
    metrics: HTMLElement,
    kernelTimings: HTMLElement,
  ): Promise<GaussianSandbox> {
    if (!navigator.gpu)
      throw new Error("WebGPU is unavailable in this browser");
    const options = readSandboxOptions();
    const renderer = new WebGPURenderer({
      antialias: false,
      trackTimestamp: options.profileEnabled,
    });
    await renderer.init();
    renderer.setClearColor(0x000000, 0);
    const timingInspector =
      options.profileEnabled && renderer.hasFeature("timestamp-query")
        ? new KernelTimingInspector()
        : null;
    if (timingInspector !== null) {
      renderer.inspector = timingInspector;
      timingInspector.enableControlledSampling(renderer);
    }
    renderer.setPixelRatio(options.pixelRatio);
    viewport.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(50, 1, 0.01, 10_000);
    const sandbox = new GaussianSandbox(
      renderer,
      camera,
      status,
      metrics,
      kernelTimings,
      timingInspector,
      options,
    );
    sandbox.resize();
    return sandbox;
  }

  setOctreeHelperVisible(visible: boolean): void {
    this.spatialDebug.setOctreeVisible(visible);
  }

  setLodColoringEnabled(enabled: boolean): void {
    this.spatialDebug.setLodColoringEnabled(enabled);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    removeEventListener("resize", this.handleResize);
    this.controls.removeEventListener("start", this.handleControlsStart);
    this.controls.removeEventListener("end", this.handleControlsEnd);
    this.renderer.domElement.removeEventListener(
      "pointermove",
      this.handlePointerMove,
    );
    this.renderer.domElement.removeEventListener(
      "pointerleave",
      this.handlePointerLeave,
    );
    this.clearCloud();
    this.debugPanel.dispose();
    this.controls.dispose();
    this.hoverMarkerGeometry.dispose();
    this.hoverMarkerOpaque.material.dispose();
    this.hoverMarkerOverlay.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  async loadUrl(url: string): Promise<void> {
    this.cloudStatus.loading(url);
    const store = this.createStore();
    try {
      const cloud = await store.load(url, {
        name: `${url} Gaussian cloud`,
        lod: { levels: SANDBOX_LOD_LEVELS },
      });
      if (this.disposed) {
        store.dispose();
        return;
      }
      this.show(store, url, cloud);
    } catch (error) {
      store.dispose();
      this.cloudStatus.error(error);
    }
  }

  async loadFile(file: File): Promise<void> {
    this.cloudStatus.parsing(file.name);
    const store = this.createStore();
    try {
      const data = this.loader.parse(await file.arrayBuffer());
      const cloud = addDataWithSandboxLod(
        store,
        data,
        `${file.name} Gaussian cloud`,
      );
      if (this.disposed) {
        store.dispose();
        return;
      }
      this.show(store, file.name, cloud);
    } catch (error) {
      store.dispose();
      this.cloudStatus.error(error);
    }
  }

  private createStore(): GaussianStore {
    return new GaussianStore({
      loader: this.loader,
      defaultStreamingLod: this.options.streamingLod,
    });
  }

  private show(
    store: GaussianStore,
    source: string,
    cloud: GaussianCloud,
  ): void {
    this.clearCloud();
    const data = cloud.lod!.octree.data;
    const bounds = measureCloud(data);
    this.store = store;
    this.cloud = cloud;
    this.scene.add(cloud);
    this.frameCloud(bounds);
    this.hoverMarker.scale.setScalar(Math.max(bounds.radius * 0.012, 0.005));

    this.pass = gaussianPass(
      this.renderer,
      this.camera,
      store,
      this.options.pass,
    );
    this.opaquePass = scenePass(this.scene, this.camera);
    this.opaquePass.transparent = false;
    this.opaquePass.opaque = true;
    this.opaquePass.setLayers(this.sceneLayers);
    const opaqueDepth = this.opaquePass
      .getTextureNode("depth")
      .load(rasterPixelCoordinate);
    const opaqueViewDepth = perspectiveDepthToViewZ(
      opaqueDepth,
      uniform(this.camera.near),
      uniform(this.camera.far),
    ).negate();
    this.pass.rasterPixelValueNode = opaqueViewDepth;
    this.pass.rasterBreakNode = rasterPixelValue.lessThan(rasterViewDepth);
    this.transparentPass = scenePass(this.scene, this.camera);
    this.transparentPass.transparent = true;
    this.transparentPass.opaque = false;
    this.transparentPass.setLayers(this.sceneLayers);
    this.overlayPass = scenePass(this.scene, this.camera);
    this.overlayPass.transparent = true;
    this.overlayPass.opaque = false;
    this.overlayPass.setLayers(this.overlayLayers);
    this.spatialDebug.attach(cloud, this.pass);
    this.debugPanel.setPass(this.pass, {
      cloud,
      onPack: () => this.cloudStatus.packed(source, data.count, cloud, store),
    });
    this.pipeline = new RenderPipeline(this.renderer);
    const opaqueWithGaussians = compositePremultipliedOver(
      this.opaquePass,
      this.pass,
    );
    const withTransparentScene = compositeDepthTestedPremultipliedOver(
      opaqueWithGaussians,
      this.transparentPass,
      this.opaquePass.getViewZNode(),
      this.transparentPass.getViewZNode(),
    );
    this.pipeline.outputNode = compositePremultipliedOver(
      withTransparentScene,
      this.overlayPass,
    );
    this.cloudStatus.preparing(source, data.count);
  }

  private clearCloud(): void {
    this.debugPanel.setPass(null);
    this.spatialDebug.clear();
    this.pass?.dispose();
    this.overlayPass?.dispose();
    this.transparentPass?.dispose();
    this.opaquePass?.dispose();
    this.pipeline?.dispose();
    this.store?.dispose();
    this.cloud = null;
    this.hoverMarker.visible = false;
    this.pass = null;
    this.overlayPass = null;
    this.transparentPass = null;
    this.opaquePass = null;
    this.pipeline = null;
    this.store = null;
  }

  private frameCloud(bounds: CloudBounds): void {
    const radius = Math.max(bounds.radius, 0.1);
    this.camera.near = Math.max(radius / 10_000, 0.0001);
    this.camera.far = Math.max(radius * 20, 100);
    this.camera.position.set(
      bounds.centerX + radius * 0.15,
      bounds.centerY + radius * 0.35,
      bounds.centerZ + radius * 2.4,
    );
    this.camera.updateProjectionMatrix();
    this.controls.target.set(bounds.centerX, bounds.centerY, bounds.centerZ);
    this.controls.update();
  }

  private updateHoverMarker(event: PointerEvent): void {
    const cloud = this.cloud;
    if (this.controlsActive || cloud === null) {
      this.hoverMarker.visible = false;
      return;
    }

    const bounds = this.renderer.domElement.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    this.hoverPointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.hoverRaycaster.setFromCamera(this.hoverPointer, this.camera);
    cloud.updateWorldMatrix(true, false);
    const hit = this.hoverRaycaster.intersectObject(cloud, false)[0];
    if (hit === undefined) {
      this.hoverMarker.visible = false;
      return;
    }
    this.hoverMarker.position.copy(hit.point);
    this.hoverMarker.visible = true;
  }

  private resize(): void {
    const width = Math.max(1, innerWidth);
    const height = Math.max(1, innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
