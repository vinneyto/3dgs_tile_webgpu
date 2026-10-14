import type { GaussianRenderStore } from "../GaussianRenderStore";
import { GaussianDataPass } from "./GaussianDataPass";
import { GaussianProjectionPass } from "./GaussianProjectionPass";
import { GaussianOrderingPass } from "./GaussianOrderingPass";
import { GaussianIntersectionPass } from "./GaussianIntersectionPass";
import { GaussianRasterPass } from "./GaussianRasterPass";
import type { GaussianPassComposition } from "./GaussianPassComposition";

/** Standard zero-copy tiled preset. Each connection is visible at the assembly site. */
export function createGaussianPassComposition(
  store: GaussianRenderStore,
): GaussianPassComposition {
  const data = new GaussianDataPass(store);
  const projection = new GaussianProjectionPass(data.output);
  const ordering = new GaussianOrderingPass(data.output, projection.output);
  const intersections = new GaussianIntersectionPass(
    data.output,
    projection.output,
    ordering.output,
  );
  const raster = new GaussianRasterPass(
    data.output,
    projection.output,
    intersections.output,
  );
  return Object.freeze({ data, projection, ordering, intersections, raster });
}
