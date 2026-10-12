import { StorageBindings } from "./StorageBindings";
import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, wgslFn } from "three/tsl";
import { gatherDepthOrderedTileCountsWGSL } from "../kernels/visibility";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import type { DispatchResources } from "./types";

export class DepthOrderedTileStage {
  tileCounts: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly computeNode: ComputeNode;

  constructor(
    private readonly renderer: WebGPURenderer,
    gaussianCount: number,
    originalTileCounts: StorageBufferAttribute,
    sortedGaussians: StorageBufferAttribute,
    private readonly visibleDispatch: DispatchResources,
    bindings = new StorageBindings(),
  ) {
    this.attributes.bindings = bindings;
    this.tileCounts = this.attributes.createUint(
      "3dgs.depth-ordered-tile-counts",
      gaussianCount,
    );
    const kernel = wgslFn<Record<string, Node>>(
      gatherDepthOrderedTileCountsWGSL,
    );
    this.computeNode = kernel({
      rank: instanceIndex,
      state: this.attributes
        .storage(visibleDispatch.state, "uvec4", 1)
        .toReadOnly(),
      depth_sorted_gaussians: this.attributes
        .storage(sortedGaussians, "uvec2", gaussianCount)
        .toReadOnly(),
      tile_counts: this.attributes
        .storage(originalTileCounts, "uint", gaussianCount)
        .toReadOnly(),
      ordered_tile_counts: this.attributes.storage(
        this.tileCounts,
        "uint",
        gaussianCount,
      ),
    })
      .computeKernel([WORKGROUP_SIZE])
      .setName("3DGS gather depth-ordered tile counts WGSL");
  }

  resize(count: number): void {
    this.tileCounts = this.attributes.grow(this.tileCounts, count);
  }
  getComputeNodes(): ComputeNode[] {
    return [this.computeNode];
  }

  encode(): void {
    this.renderer.compute(this.computeNode, this.visibleDispatch.linear);
  }

  dispose(): void {
    this.computeNode.dispose();
    this.attributes.dispose();
  }
}
