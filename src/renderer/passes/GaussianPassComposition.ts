import type { GaussianDataPass } from "./GaussianDataPass";
import type { GaussianProjectionPass } from "./GaussianProjectionPass";
import type { GaussianOrderingPass } from "./GaussianOrderingPass";
import type { GaussianIntersectionPass } from "./GaussianIntersectionPass";
import type { GaussianRasterPass } from "./GaussianRasterPass";

/** Explicit connections, not an untyped list of GPU kernels. */
export interface GaussianPassComposition {
  readonly data: GaussianDataPass;
  readonly projection: GaussianProjectionPass;
  readonly ordering: GaussianOrderingPass;
  readonly intersections: GaussianIntersectionPass;
  readonly raster: GaussianRasterPass;
}

export function validateGaussianPassComposition(
  passes: GaussianPassComposition,
): void {
  const { data, projection, ordering, intersections, raster } = passes;
  const connections = [
    [projection.inputs.gaussians, data.output],
    [ordering.inputs.gaussians, data.output],
    [ordering.inputs.projection, projection.output],
    [intersections.inputs.gaussians, data.output],
    [intersections.inputs.projection, projection.output],
    [intersections.inputs.ordering, ordering.output],
    [raster.inputs.gaussians, data.output],
    [raster.inputs.projection, projection.output],
    [raster.inputs.intersections, intersections.output],
  ];
  if (connections.some(([input, output]) => input !== output))
    throw new Error(
      "Gaussian pass composition contains a disconnected or foreign producer",
    );
}

const owners = new WeakMap<object, object>();
function compositionStages(passes: GaussianPassComposition): object[] {
  const stages: object[] = Object.values(passes);
  for (
    let upstream = passes.data.upstream;
    upstream;
    upstream = upstream.upstream
  )
    stages.push(upstream);
  return stages;
}
/** @internal Validate before allocating textures or subscribing to the store. */
export function assertGaussianPassCompositionAvailable(
  passes: GaussianPassComposition,
): void {
  if (compositionStages(passes).some((stage) => owners.has(stage)))
    throw new Error(
      "Gaussian logical passes already belong to another runtime; create a fresh composition",
    );
}
/** @internal Pass resources belong to a single render runtime/device. */
export function claimGaussianPassComposition(
  passes: GaussianPassComposition,
  owner: object,
): () => void {
  const stages = compositionStages(passes);
  if (stages.some((stage) => owners.has(stage)))
    throw new Error(
      "Gaussian logical passes already belong to another runtime; create a fresh composition",
    );
  for (const stage of stages) owners.set(stage, owner);
  return () => {
    for (const stage of stages)
      if (owners.get(stage) === owner) owners.delete(stage);
  };
}
