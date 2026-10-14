import type { GaussianData } from "../GaussianData";
import type { ComputeNode, StorageBufferAttribute } from "three/webgpu";
import type { DispatchResources } from "../pipeline/types";
import { ExclusiveScanStage } from "../pipeline/ExclusiveScanStage";
import { VisibleGaussianStage } from "../pipeline/VisibleGaussianStage";
import { RadixSorter } from "../pipeline/RadixSorter";
import { DepthOrderedTileStage } from "../pipeline/DepthOrderedTileStage";
import { GaussianPassOutput } from "./GaussianPassOutput";
import type { GaussianProjectionResources } from "./GaussianProjectionPass";
import type { GaussianPassContext } from "./GaussianPassContext";

export interface GaussianOrderingResources {
  visibleOffsets: StorageBufferAttribute;
  depthSortedGaussians: StorageBufferAttribute;
  depthOrderedTileCounts: StorageBufferAttribute;
  dispatch: DispatchResources;
}
export interface GaussianOrderingRuntime {
  visibleScan: ExclusiveScanStage;
  visible: VisibleGaussianStage;
  depthSorter: RadixSorter;
  orderedTiles: DepthOrderedTileStage;
  resize(count: number): void;
  encode(profileKernels: boolean): void;
  getComputeNodes(): ComputeNode[];
  dispose(): void;
}
/** Visibility scan, compaction, depth sort and ordered tile counts form one logical pass. */
export class GaussianOrderingPass {
  readonly output = new GaussianPassOutput<GaussianOrderingResources>(
    this,
    "ordering.visibleGaussians",
  );
  readonly inputs;
  constructor(
    gaussians: GaussianPassOutput<GaussianData>,
    projection: GaussianPassOutput<GaussianProjectionResources>,
  ) {
    this.inputs = Object.freeze({ gaussians, projection });
  }
  createRuntime(context: GaussianPassContext): GaussianOrderingRuntime {
    const data = this.inputs.gaussians.read();
    const projection = this.inputs.projection.read();
    const activeCount = () => this.inputs.gaussians.read().activeCount;
    const visibleScan = new ExclusiveScanStage(
      projection.projectedMean,
      data.count,
      "visible",
      "projectedVisibility",
      activeCount,
      context.bindings,
    );
    const visible = new VisibleGaussianStage(
      context.renderer,
      context.mode,
      data.count,
      visibleScan.output,
      projection.projectedMean,
      context.frame.viewport,
      context.frame.activeCount,
      activeCount,
      context.bindings,
    );
    const depthSorter = new RadixSorter(
      context.renderer,
      "depth",
      data.count,
      visible.buffers,
      visible.dispatch,
      context.radixBackend,
      context.bindings,
    );
    depthSorter.configure(context.mode === "float32" ? 32 : 16);
    const orderedTiles = new DepthOrderedTileStage(
      context.renderer,
      data.count,
      projection.tileCounts,
      depthSorter.sortedRecords,
      visible.dispatch,
      context.bindings,
    );
    this.output.bind(() => ({
      visibleOffsets: visibleScan.output,
      depthSortedGaussians: depthSorter.sortedRecords,
      depthOrderedTileCounts: orderedTiles.tileCounts,
      dispatch: visible.dispatch,
    }));
    const stages = [visibleScan, visible, depthSorter, orderedTiles];
    return {
      visibleScan,
      visible,
      depthSorter,
      orderedTiles,
      resize: (count) => {
        for (const stage of stages) stage.resize(count);
      },
      encode: (profileKernels) => {
        visibleScan.encode(context.renderer);
        visible.encode();
        depthSorter.encode(profileKernels);
        orderedTiles.encode();
      },
      getComputeNodes: () => stages.flatMap((stage) => stage.getComputeNodes()),
      dispose: () => {
        for (const stage of [...stages].reverse()) stage.dispose();
      },
    };
  }
}
