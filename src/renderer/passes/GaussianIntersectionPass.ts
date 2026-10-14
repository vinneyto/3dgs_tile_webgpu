import type { GaussianData } from "../GaussianData";
import type {
  ComputeNode,
  IndirectStorageBufferAttribute,
  StorageBufferAttribute,
} from "three/webgpu";
import type { DispatchResources } from "../pipeline/types";
import { ExclusiveScanStage } from "../pipeline/ExclusiveScanStage";
import { IntersectionStage } from "../pipeline/IntersectionStage";
import { RadixSorter } from "../pipeline/RadixSorter";
import { GaussianPassOutput } from "./GaussianPassOutput";
import type { GaussianProjectionResources } from "./GaussianProjectionPass";
import type { GaussianOrderingResources } from "./GaussianOrderingPass";
import type { GaussianPassContext } from "./GaussianPassContext";

export interface GaussianIntersectionResources {
  intersectionOffsets: StorageBufferAttribute;
  sortedIntersections: StorageBufferAttribute;
  dispatch: DispatchResources;
  rasterDispatch: IndirectStorageBufferAttribute;
}
export interface GaussianIntersectionRuntime {
  scan: ExclusiveScanStage;
  intersections: IntersectionStage;
  sorter: RadixSorter;
  resizeGaussianCount(count: number): void;
  resizeCapacity(capacity: number): void;
  encode(attempt: number, resetValid: boolean, profileKernels: boolean): void;
  getComputeNodes(): ComputeNode[];
  dispose(): void;
}
/** Counts, emits and stably sorts tile records, including completeness/overflow gating. */
export class GaussianIntersectionPass {
  readonly output = new GaussianPassOutput<GaussianIntersectionResources>(
    this,
    "intersections.sortedTiles",
  );
  readonly inputs;
  constructor(
    gaussians: GaussianPassOutput<GaussianData>,
    projection: GaussianPassOutput<GaussianProjectionResources>,
    ordering: GaussianPassOutput<GaussianOrderingResources>,
  ) {
    this.inputs = Object.freeze({ gaussians, projection, ordering });
  }
  createRuntime(context: GaussianPassContext): GaussianIntersectionRuntime {
    const data = this.inputs.gaussians.read();
    const projection = this.inputs.projection.read();
    const ordering = this.inputs.ordering.read();
    const scan = new ExclusiveScanStage(
      ordering.depthOrderedTileCounts,
      data.count,
      "intersections",
      "uint",
      () => this.inputs.gaussians.read().activeCount,
      context.bindings,
    );
    const intersections = new IntersectionStage(
      context.renderer,
      data.count,
      context.capacity,
      ordering.depthSortedGaussians,
      ordering.dispatch,
      ordering.depthOrderedTileCounts,
      scan.output,
      projection.projectedMean,
      projection.projectedConic,
      projection.projectedColor,
      context.frame,
      context.outputState,
      context.bindings,
    );
    const sorter = new RadixSorter(
      context.renderer,
      "tile",
      context.capacity,
      intersections.buffers,
      intersections.dispatch,
      context.radixBackend,
      context.bindings,
    );
    this.output.bind(() => ({
      intersectionOffsets: scan.output,
      sortedIntersections: sorter.sortedRecords,
      dispatch: intersections.dispatch,
      rasterDispatch: intersections.rasterDispatch,
    }));
    return {
      scan,
      intersections,
      sorter,
      resizeGaussianCount: (count) => scan.resize(count),
      resizeCapacity: (capacity) => {
        intersections.resize(capacity);
        sorter.resize(capacity);
      },
      encode: (attempt, resetValid, profileKernels) => {
        scan.encode(context.renderer);
        intersections.encode(attempt, resetValid);
        sorter.encode(profileKernels);
      },
      getComputeNodes: () =>
        [scan, intersections, sorter].flatMap((stage) =>
          stage.getComputeNodes(),
        ),
      dispose: () => {
        sorter.dispose();
        intersections.dispose();
        scan.dispose();
      },
    };
  }
}
