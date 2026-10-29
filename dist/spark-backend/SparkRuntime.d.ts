import type { SparkExtSplats, SparkLodTree, SparkTraversal } from "./SparkWasmContract";
import type { CloudLoadOptions } from "../streaming-backend/CloudLoadOptions";
/** One WASM instance per realm: its tree IDs belong to that instance only. */
export declare class SparkRuntime {
    static initialize(): Promise<SparkRuntime>;
    decode(bytes: Uint8Array, options: CloudLoadOptions, signal: AbortSignal): {
        data: SparkExtSplats;
        sourceCount: number;
        tree: SparkLodTree | undefined;
    };
    traverse(max: number, pixelScale: number, treeIds: Uint32Array, viewToObjects: Float32Array, scales: Float32Array): SparkTraversal;
    disposeTree(tree: SparkLodTree): void;
}
