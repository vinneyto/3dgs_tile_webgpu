import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, storage, uvec2, wgslFn } from "three/tsl";
import {
  PROFILE_DIAGNOSTIC_WORKGROUP_SIZE,
  profileSubpixelCoverageWGSL,
} from "../kernels/profileDiagnostics";
import {
  estimateTileCap,
  PROFILE_TILE_CAPS,
  summarizeTileLoads,
} from "../utils/profileStats";
import { AttributePool } from "./AttributePool";
import type { FrameUniforms } from "./FrameUniforms";
import type { GaussianPassProfileStats } from "./types";

export class ProfileDiagnosticsStage {
  private readonly attributes = new AttributePool();
  private readonly zeroPixelFlags: StorageBufferAttribute;
  private readonly computeNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    gaussianCount: number,
    projectedMeanAttribute: StorageBufferAttribute,
    projectedConicAttribute: StorageBufferAttribute,
    private readonly frame: FrameUniforms,
    private readonly maxRasterizedSplatsPerTile: number | null,
  ) {
    this.zeroPixelFlags = this.attributes.createUint(
      "3dgs.profile-zero-pixel-subpixel-flags",
      gaussianCount,
    );
    const kernel = wgslFn<Record<string, Node>>(profileSubpixelCoverageWGSL);
    this.computeNode = kernel({
      index: instanceIndex,
      gaussian_count: frame.activeCount,
      viewport: uvec2(frame.viewport.xy),
      projected_mean: storage(
        projectedMeanAttribute,
        "vec4",
        projectedMeanAttribute.count,
      ).toReadOnly(),
      projected_conic: storage(
        projectedConicAttribute,
        "vec4",
        projectedConicAttribute.count,
      ).toReadOnly(),
      zero_pixel_flags: storage(this.zeroPixelFlags, "uint", gaussianCount),
    })
      .compute(gaussianCount, [PROFILE_DIAGNOSTIC_WORKGROUP_SIZE])
      .setName("3DGS profile subpixel coverage WGSL");
  }

  encode(): void {
    const count = this.frame.activeCount.value;
    if (count > 0)
      this.renderer.compute(this.computeNode, [
        Math.ceil(count / PROFILE_DIAGNOSTIC_WORKGROUP_SIZE),
        1,
        1,
      ]);
  }

  async readStats(
    tileOffsets: StorageBufferAttribute,
  ): Promise<GaussianPassProfileStats> {
    const activeCount = this.frame.activeCount.value;
    const tileCount = Number(this.frame.tileCount.value);
    const [offsetBuffer, flagBuffer] = await Promise.all([
      this.renderer.getArrayBufferAsync(
        tileOffsets,
        null,
        0,
        (tileCount + 1) * 4,
      ),
      this.renderer.getArrayBufferAsync(this.zeroPixelFlags),
    ]);
    const flags = new Uint32Array(flagBuffer);
    let zeroPixelSubpixelSplats = 0;
    for (const flag of flags.subarray(0, activeCount))
      zeroPixelSubpixelSplats += flag;
    const offsets = new Uint32Array(offsetBuffer).subarray(0, tileCount + 1);
    return {
      tileLoads: summarizeTileLoads(offsets),
      appliedTileCap:
        this.maxRasterizedSplatsPerTile === null
          ? null
          : estimateTileCap(offsets, this.maxRasterizedSplatsPerTile),
      tileCapEstimates: PROFILE_TILE_CAPS.map((cap) =>
        estimateTileCap(offsets, cap),
      ),
      zeroPixelSubpixelSplats,
    };
  }

  dispose(): void {
    this.computeNode.dispose();
    this.attributes.dispose();
  }
}
