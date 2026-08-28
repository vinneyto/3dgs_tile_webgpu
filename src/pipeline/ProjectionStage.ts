import type {
  ComputeNode,
  Node,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { instanceIndex, storage, uint, uvec2, wgslFn } from "three/tsl";
import type { GaussianData } from "../GaussianData";
import { projectionWGSL } from "../kernels/projection";
import { AttributePool } from "./AttributePool";
import { WORKGROUP_SIZE } from "./constants";
import type { FrameUniforms } from "./FrameUniforms";
import type { ObjectFrameState } from "./ObjectFrameState";
import type { AntialiasMode } from "./types";

export class ProjectionStage {
  readonly projectedMean: StorageBufferAttribute;
  readonly projectedConic: StorageBufferAttribute;
  readonly projectedColor: StorageBufferAttribute;
  readonly tileCounts: StorageBufferAttribute;

  private readonly attributes = new AttributePool();
  private readonly computeNode: ComputeNode;

  constructor(
    data: GaussianData,
    frame: FrameUniforms,
    objects: ObjectFrameState,
    antialiasMode: AntialiasMode,
  ) {
    this.projectedMean = objects.attribute;
    this.projectedConic = this.attributes.createFloat(
      "3dgs.projected-conic",
      data.count,
    );
    this.projectedColor = this.attributes.createFloat(
      "3dgs.projected-color",
      data.count,
    );
    this.tileCounts = this.attributes.createUint(
      "3dgs.tile-counts",
      data.count,
    );

    const kernel = wgslFn<Record<string, Node>>(projectionWGSL(antialiasMode));
    this.computeNode = kernel({
      gid: instanceIndex,
      gaussian_count: uint(data.count),
      sh_degree: uint(data.shDegree),
      projection: frame.projection,
      viewport: frame.viewport,
      tiles: uvec2(frame.tilesX, frame.tilesY),
      means: storage(data.means, "vec4", data.count).toReadOnly(),
      scales_opacity: storage(
        data.scalesOpacity,
        "vec4",
        data.count,
      ).toReadOnly(),
      rotations: storage(data.rotations, "vec4", data.count).toReadOnly(),
      sh_coefficients: storage(
        data.shCoefficients,
        "vec4",
        data.count * data.shCoefficientCount,
      ).toReadOnly(),
      projected_mean: storage(
        this.projectedMean,
        "vec4",
        this.projectedMean.count,
      ),
      projected_conic: storage(this.projectedConic, "vec4", data.count),
      projected_color: storage(this.projectedColor, "vec4", data.count),
      tile_counts: storage(this.tileCounts, "uint", data.count),
    })
      .compute(data.count, [WORKGROUP_SIZE])
      .setName(`3DGS projection WGSL (${antialiasMode})`);
  }

  encode(renderer: WebGPURenderer): void {
    renderer.compute(this.computeNode);
  }

  dispose(): void {
    this.computeNode.dispose();
    this.attributes.dispose();
  }
}
