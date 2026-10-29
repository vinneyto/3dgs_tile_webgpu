/** Opt-in entry: importing the baseline renderer does not load Spark WASM. */
export { SparkGaussianBackend } from "./spark-backend/SparkGaussianBackend";
export { WorkerSparkGaussianBackend } from "./spark-backend/WorkerSparkGaussianBackend";
export { SPARK_UPSTREAM_COMMIT } from "./spark-backend/SparkWasmContract";
export type {
  SparkExtSplats,
  SparkLodTree,
  SparkTraversal,
  SparkBackendOptions,
} from "./spark-backend/SparkWasmContract";
