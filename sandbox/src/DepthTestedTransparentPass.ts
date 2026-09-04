import {
  PassNode,
  type Camera,
  type DepthTexture,
  type NodeFrame,
  type Scene,
  type WebGPURenderer,
} from "three/webgpu";

/** Render only transparent objects while preserving an opaque pass's depth. */
export class DepthTestedTransparentPass extends PassNode {
  private readonly sharedDepth: DepthTexture;

  constructor(scene: Scene, camera: Camera, sharedDepth: DepthTexture) {
    super(PassNode.COLOR, scene, camera);
    this.opaque = false;
    this.transparent = true;
    this.sharedDepth = sharedDepth;

    const privateDepth = this.renderTarget.depthTexture;
    this.renderTarget.depthTexture = null;
    privateDepth?.dispose();
    this.renderTarget.depthTexture = sharedDepth;
  }

  /**
   * Prime this render target after creation or resize so Three.js does not
   * perform its one-time depth clear after the opaque pass has populated the
   * shared attachment.
   */
  prepareDepth(renderer: WebGPURenderer, width: number, height: number): void {
    this.setSize(width, height);
    const previousRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    try {
      renderer.clear(false, true, false);
    } finally {
      renderer.setRenderTarget(previousRenderTarget);
    }
  }

  override updateBefore(frame: NodeFrame): boolean | undefined {
    const { renderer } = frame;
    if (renderer === null) {
      throw new Error(
        "DepthTestedTransparentPass requires a renderer in its NodeFrame",
      );
    }
    const previousAutoClearDepth = renderer.autoClearDepth;
    renderer.autoClearDepth = false;
    try {
      return super.updateBefore(frame);
    } finally {
      renderer.autoClearDepth = previousAutoClearDepth;
    }
  }

  override dispose(): void {
    if (this.renderTarget.depthTexture === this.sharedDepth) {
      this.renderTarget.depthTexture = null;
    }
    super.dispose();
  }
}
