import init, * as wasm from "./generated/spark_rs";
import wasmUrl from "./generated/spark_rs_bg.wasm?url&inline";
import type {
  SparkExtSplats,
  SparkLodTree,
  SparkTraversal,
} from "./SparkWasmContract";
import type { CloudLoadOptions } from "../streaming-backend/CloudLoadOptions";

let ready: Promise<unknown> | undefined;
/** One WASM instance per realm: its tree IDs belong to that instance only. */
export class SparkRuntime {
  static async initialize(): Promise<SparkRuntime> {
    await (ready ??= init({ module_or_path: wasmUrl }).catch(
      (error: unknown) => {
        ready = undefined;
        throw error;
      },
    ));
    return new SparkRuntime();
  }
  decode(bytes: Uint8Array, options: CloudLoadOptions, signal: AbortSignal) {
    const format =
      options.format === "auto"
        ? undefined
        : options.format === "sog"
          ? "pcsogszip"
          : options.format;
    const decoder = wasm.decode_to_gsplatarray(format, options.fileName);
    let splats: wasm.GsplatArray | undefined;
    let decoderConsumed = false;
    try {
      for (let offset = 0; offset < bytes.length; offset += 1048576) {
        signal.throwIfAborted();
        decoder.push(bytes.subarray(offset, offset + 1048576));
      }
      // finish(self) consumes the Rust owner, including when it returns an error.
      decoderConsumed = true;
      splats = decoder.finish() as wasm.GsplatArray;
      const sourceCount = splats.len();
      const lod = options.mipmaps?.type !== "none" && sourceCount > 0;
      if (lod && !splats.has_lod()) splats.tiny_lod(1.5, false);
      const data = (
        lod ? splats.to_extsplats_lod() : splats.to_extsplats()
      ) as SparkExtSplats;
      if (
        !(data.ext0 instanceof Uint32Array) ||
        !(data.ext1 instanceof Uint32Array) ||
        data.ext0.length < data.numSplats * 4 ||
        data.ext1.length < data.numSplats * 4
      )
        throw new TypeError("Unexpected upstream Spark ExtSplats result");
      const tree =
        data.lodTree && data.numSplats > 0
          ? (wasm.init_lod_tree(data.numSplats, data.lodTree) as SparkLodTree)
          : undefined;
      return { data, sourceCount, tree };
    } finally {
      splats?.free();
      if (!decoderConsumed) decoder.free();
    }
  }
  traverse(
    max: number,
    pixelScale: number,
    treeIds: Uint32Array,
    viewToObjects: Float32Array,
    scales: Float32Array,
  ): SparkTraversal {
    const count = treeIds.length;
    // Spark uses angular importance, not a hard frustum cutoff. These defaults
    // retain detail in front and gradually coarsen behind the camera.
    return wasm.traverse_lod_trees(
      max,
      pixelScale,
      undefined,
      treeIds,
      new Uint32Array(count).fill(0xffffffff),
      viewToObjects,
      scales,
      new Float32Array(count).fill(0.2),
      new Float32Array(count).fill(0.5),
      new Float32Array(count).fill(60),
      new Float32Array(count).fill(120),
    ) as SparkTraversal;
  }
  disposeTree(tree: SparkLodTree): void {
    wasm.dispose_lod_tree(tree.lodId);
  }
}
