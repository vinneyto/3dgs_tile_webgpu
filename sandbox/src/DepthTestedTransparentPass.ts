import {
  Box2,
  PassNode,
  Vector2,
  type Camera,
  type DepthTexture,
  type NodeFrame,
  type Scene,
  type WebGPURenderer,
} from "three/webgpu";

/** Render transparent objects against a copy of an opaque pass's depth. */
export class DepthTestedTransparentPass extends PassNode {
  private readonly sourceDepth: DepthTexture;
  private readonly copyRegion = new Box2(new Vector2(), new Vector2());

  constructor(scene: Scene, camera: Camera, sourceDepth: DepthTexture) {
    super(PassNode.COLOR, scene, camera);
    this.opaque = false;
    this.transparent = true;
    this.sourceDepth = sourceDepth;
  }

  /**
   * Prime this render target after creation or resize so Three.js does not
   * perform its one-time depth clear after the opaque depth has been copied.
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
    const destinationDepth = this.renderTarget.depthTexture;
    if (destinationDepth === null) {
      throw new Error(
        "DepthTestedTransparentPass requires its own depth texture",
      );
    }
    this.copyRegion.max.set(this.renderTarget.width, this.renderTarget.height);
    renderer.copyTextureToTexture(
      this.sourceDepth,
      destinationDepth,
      this.copyRegion,
    );
    const previousAutoClearDepth = renderer.autoClearDepth;
    renderer.autoClearDepth = false;
    try {
      return super.updateBefore(frame);
    } finally {
      renderer.autoClearDepth = previousAutoClearDepth;
    }
  }
}
