import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, storage, uint, uvec2, wgslFn } from "three/tsl";
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
      gaussian_count: uint(gaussianCount),
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
    this.renderer.compute(this.computeNode);
  }

  async readStats(
    tileOffsets: StorageBufferAttribute,
  ): Promise<GaussianPassProfileStats> {
    const [offsetBuffer, flagBuffer] = await Promise.all([
      this.renderer.getArrayBufferAsync(tileOffsets),
      this.renderer.getArrayBufferAsync(this.zeroPixelFlags),
    ]);
    const flags = new Uint32Array(flagBuffer);
    let zeroPixelSubpixelSplats = 0;
    for (const flag of flags) zeroPixelSubpixelSplats += flag;
    const offsets = new Uint32Array(offsetBuffer);
    return {
      tileLoads: summarizeTileLoads(offsets, this.frame.tileSize ** 2),
      appliedTileCap:
        this.maxRasterizedSplatsPerTile === null
          ? null
          : estimateTileCap(
              offsets,
              this.maxRasterizedSplatsPerTile,
              this.frame.tileSize ** 2,
            ),
      tileCapEstimates: PROFILE_TILE_CAPS.map((cap) =>
        estimateTileCap(offsets, cap, this.frame.tileSize ** 2),
      ),
      zeroPixelSubpixelSplats,
    };
  }

  dispose(): void {
    this.computeNode.dispose();
    this.attributes.dispose();
  }
}
