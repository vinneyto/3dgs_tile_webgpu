import { Box3, StorageBufferAttribute, Vector3 } from "three/webgpu";
import { GaussianData } from "./GaussianData";
import {
  GaussianLod,
  GaussianLodNode,
  type GaussianLodPacking,
} from "./GaussianLod";
import type { GaussianOctree } from "./GaussianOctree";
import {
  buildMipmap,
  type MipmapSource,
  type MipmapTree,
} from "./mipmap/buildMipmap";

export interface GaussianMipmapLodOptions {
  /** Terminal groups retain their original Gaussians. Defaults to 8. */
  leafSize?: number;
  ownsOctree?: boolean;
}

/** Spatial mipmap hierarchy, with original Gaussians at the finest cut. */
export class GaussianMipmapLod extends GaussianLod {
  override readonly nodes: readonly GaussianLodNode[];
  override get data(): GaussianData {
    return this.mergedData;
  }
  private readonly mergedData: GaussianData;

  static override build(
    octree: GaussianOctree,
    options: GaussianMipmapLodOptions = {},
  ): GaussianMipmapLod {
    return new GaussianMipmapLod(
      octree,
      buildMipmap(sourceFor(octree), leafSize(options)),
      options,
    );
  }

  /** Builds in a worker in browsers; does not detach the caller's source buffers. */
  static async buildAsync(
    octree: GaussianOctree,
    options: GaussianMipmapLodOptions = {},
  ): Promise<GaussianMipmapLod> {
    const size = leafSize(options);
    if (typeof Worker === "undefined") return this.build(octree, options);
    const worker = new Worker(
      new URL("./mipmap/MipmapWorker.ts", import.meta.url),
      { type: "module" },
    );
    try {
      const tree = await new Promise<MipmapTree>((resolve, reject) => {
        worker.onerror = (event) => reject(new Error(event.message));
        worker.onmessage = (event) =>
          event.data.error
            ? reject(new Error(event.data.error))
            : resolve(event.data.tree);
        const source = sourceFor(octree);
        worker.postMessage({ source, leafSize: size });
      });
      return new GaussianMipmapLod(octree, tree, options);
    } finally {
      worker.terminate();
    }
  }

  private constructor(
    octree: GaussianOctree,
    readonly tree: MipmapTree,
    options: GaussianMipmapLodOptions,
  ) {
    super(
      octree,
      { levels: [{ retention: 1 }], ownsOctree: options.ownsOctree },
      true,
    );
    this.mergedData = new GaussianData(
      {
        means: new StorageBufferAttribute(tree.means, 4),
        scalesOpacity: new StorageBufferAttribute(tree.scales, 4),
        rotations: new StorageBufferAttribute(tree.rotations, 4),
        shCoefficients: new StorageBufferAttribute(tree.sh, 1),
      },
      {
        count: tree.means.length / 4,
        shDegree: octree.data.shDegree,
        shFormat: "rgb8e8",
        ownsBuffers: true,
      },
    );
    this.nodes = Array.from(
      tree.counts,
      (count, id) =>
        new GaussianLodNode(
          id,
          tree.indices.subarray(tree.offsets[id]!, tree.offsets[id]! + count),
          Uint32Array.of(count),
        ),
    );
  }

  override getPackingNode(id: number): GaussianLodNode {
    return this.getNode(id);
  }
  override getNodeBounds(id: number): Box3 {
    this.getNode(id);
    const o = id * 6;
    return new Box3(
      new Vector3().fromArray(this.tree.bounds, o),
      new Vector3().fromArray(this.tree.bounds, o + 3),
    );
  }
  protected override raycastBounds(id: number, radiusScale: number): Box3 {
    const bounds = this.getNodeBounds(id);
    if (radiusScale > 3) {
      const extra = bounds
        .getSize(new Vector3())
        .multiplyScalar((radiusScale / 3 - 1) * 0.5);
      bounds.expandByVector(extra);
    }
    return bounds;
  }
  override validateCut(packing: GaussianLodPacking): void {
    const selected = new Set(packing.nodeIds);
    const visit = (id: number, covered: boolean): void => {
      if (selected.has(id)) {
        if (covered)
          throw new Error(
            "Mipmap cut contains both an ancestor and its descendant",
          );
        covered = true;
      }
      if (this.tree.left[id]! >= 0) {
        visit(this.tree.left[id]!, covered);
        visit(this.tree.right[id]!, covered);
      }
    };
    visit(0, false);
  }
  override dispose(): void {
    this.mergedData.dispose();
    super.dispose();
  }
}
function sourceFor(octree: GaussianOctree): MipmapSource {
  const data = octree.data;
  return {
    means: data.means.array as Float32Array,
    scales: data.scalesOpacity.array as Float32Array,
    rotations: data.rotations.array as Float32Array,
    sh: data.shCoefficients.array as Float32Array | Uint32Array,
    count: data.count,
    coefficients: data.shCoefficientCount,
  };
}
function leafSize(options: GaussianMipmapLodOptions): number {
  const size = options.leafSize ?? 8;
  if (!Number.isInteger(size) || size < 1 || size > 256)
    throw new RangeError("Mipmap leafSize must be an integer in [1, 256]");
  return size;
}
