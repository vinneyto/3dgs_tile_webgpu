export {
  GaussianData,
  type GaussianBuffers,
  type GaussianDataOptions,
} from "./renderer/GaussianData";
export {
  FLOAT32_SH_BYTES_PER_COEFFICIENT,
  RGB8E8_SH_BYTES_PER_COEFFICIENT,
  packShRgb8e8,
  shBytesPerCoefficient,
  unpackShRgb8e8,
  type GaussianShFormat,
} from "./streaming-backend-impl/GaussianSh";
export { CanonicalGaussianPlyLoader } from "./renderer/CanonicalGaussianPlyLoader";
export {
  GaussianDataBackend,
  type GaussianBackendResource,
  type GaussianBackendSelection,
} from "./streaming-backend-worker/legacy/GaussianDataBackend";
export { GaussianRaycastIndex } from "./renderer/GaussianRaycastIndex";
export {
  WorkerGaussianBackend,
  type WorkerGaussianBackendOptions,
} from "./streaming-backend-worker/legacy/WorkerGaussianBackend";
export { LocalGaussianBackend } from "./streaming-backend-impl/legacy/LocalGaussianBackend";
export type { GaussianBackend as LegacyGaussianBackend } from "./renderer/legacy/GaussianBackend";
export type { GaussianBackend } from "./streaming-backend/GaussianBackend";
export type { GaussianBackendFactory } from "./streaming-backend/GaussianBackendFactory";
export type { BackendConfig } from "./streaming-backend/BackendConfig";
export type { BackendCommand } from "./streaming-backend/commands/BackendCommand";
export type { BackendEvent } from "./streaming-backend/events/BackendEvent";
export type { CloudLoadOptions } from "./streaming-backend/CloudLoadOptions";
export type {
  AttributeInit,
  AttributeSource,
  BufferAttributeSource,
  FillAttributeSource,
} from "./streaming-backend/AttributeInit";
export type {
  PackingStrategy,
  MaximumPackingStrategy,
  RadialPackingStrategy,
  TieredRadialPackingStrategy,
  DistanceAwareRadialPackingStrategy,
} from "./streaming-backend/PackingStrategy";
export { StreamingGaussianBackend } from "./streaming-backend-impl/StreamingGaussianBackend";
export { DirectStreamingGaussianBackendFactory } from "./streaming-backend-impl/DirectStreamingGaussianBackendFactory";
export { WorkerStreamingGaussianBackend, WorkerStreamingGaussianBackendFactory } from "./streaming-backend-worker/WorkerStreamingGaussianBackend";
export type {
  GaussianBackendEvent,
  GaussianBackendEvents,
  GaussianBackendListener,
} from "./renderer/legacy/GaussianBackendEvents";
export type {
  WorkerStoreTransport,
  WorkerStoreRequest,
  WorkerStoreResult,
} from "./streaming-backend-worker/legacy/WorkerGaussianBackendProtocol";
export type {
  GaussianBackendTransport,
  GaussianBackendRequest,
  GaussianBackendResult,
  GaussianBackendLoadOptions,
  GaussianBackendPackedBuffers,
  GaussianRaycastBuffers,
} from "./streaming-backend-worker/legacy/GaussianBackendProtocol";
export { GaussianCloud, type GaussianRaycastMode } from "./renderer/GaussianCloud";
export {
  GaussianOctree,
  GaussianOctreeNode,
  type GaussianOctreeBuildOptions,
  type GaussianOctreeRaycastHit,
  type GaussianOctreeRaycastOptions,
} from "./streaming-backend-impl/GaussianOctree";
export { OctreeHelper, type OctreeHelperOptions } from "./renderer/OctreeHelper";
export {
  GaussianLod,
  GaussianLodNode,
  type GaussianLodBuildOptions,
  type GaussianLodLevelOptions,
  type GaussianLodPacking,
} from "./streaming-backend-impl/GaussianLod";
export { LodHelper, type LodHelperOptions } from "./renderer/LodHelper";
export {
  GaussianLodColorHelper,
  type GaussianLodColorHelperOptions,
} from "./renderer/GaussianLodColorHelper";
export {
  MaximumLodPackingStrategy,
  RadialLodWorkerPlanner,
  DistanceAwareRadialLodPackingStrategy,
  RadialLodPackingStrategy,
  StreamingLodPackingStrategy,
  TieredRadialLodPackingStrategy,
  isStreamingLodPackingStrategy,
  type DistanceAwareRadialLodPackingOptions,
  type GaussianLodPackingContext,
  type GaussianLodPackingStrategy,
  type RadialLodPackingOptions,
  type StreamingLodCellTransition,
  type StreamingLodPlannedTarget,
  type StreamingLodPackingBatch,
  type StreamingLodPackingOptions,
  type StreamingLodTargetPlanner,
  type StreamingLodTargetStats,
  type TieredRadialLodPackingOptions,
} from "./streaming-backend-impl/lod-packing";
export {
  RemainingCapacityBudgetStrategy,
  SourceFractionBudgetStrategy,
  type GaussianStoreBudgetContext,
  type GaussianStoreBudgetEntry,
  type GaussianStoreBudgetStrategy,
} from "./streaming-backend-impl/legacy/store-budgeting";
export {
  GaussianStore,
  type GaussianDataLoader,
  type GaussianStoreAddLodOptions,
  type GaussianStoreAddOptions,
  type GaussianStoreLoadOptions,
  type GaussianStoreLodBatchResult,
  type GaussianStoreCloudLodUpdate,
  type GaussianStoreDefaultLodOptions,
  type GaussianStoreLodUpdate,
  type GaussianStoreOptions,
  type GaussianStorePackLimits,
  type GaussianStorePackOptions,
  type GaussianStorePackStats,
  type GaussianStoreSlotRange,
} from "./renderer/GaussianStore";
export {
  GaussianStoreAttributes,
  GaussianStorePackedAttribute,
  type GaussianStorePackedAttributeFormat,
} from "./renderer/store-attributes";
export {
  GaussianPass,
  type AntialiasMode,
  type DepthSortMode,
  type GaussianPassDebugInfo,
  type GaussianPassDebugListener,
  type GaussianPassDebugSnapshot,
  type GaussianPassOptions,
  type GaussianPassRedrawStrategy,
  type GaussianPassProfileStats,
  type GaussianPassResources,
  type GaussianPassStats,
  type GaussianTileLoadStats,
  type GaussianTileCapStats,
  type RadixBackend,
  type ResolvedRadixBackend,
} from "./renderer/GaussianPass";
export { gaussianPass } from "./renderer/createGaussianPass";
export {
  gaussianIndex,
  gaussianObjectId,
  gaussianPositionLocal,
  gaussianPositionWorld,
  gaussianScale,
  gaussianRotation,
  gaussianOpacity,
  gaussianColor,
  gaussianObjectMatrix,
  gaussianObjectVisible,
  gaussianViewDirection,
  gaussianViewDepth,
  gaussianScreenPosition,
  gaussianScreenBoundsMin,
  gaussianScreenBoundsMax,
  gaussianProjectedSigma,
  gaussianProjectedArea,
  rasterGaussianIndex,
  rasterObjectId,
  rasterPixelCoordinate,
  rasterScreenPosition,
  rasterScreenUV,
  rasterPixelValue,
  rasterGaussianCenter,
  rasterPixelDelta,
  rasterGaussianCoord,
  rasterUV,
  rasterViewDepth,
  rasterGaussianColor,
  rasterGaussianOpacity,
  rasterPower,
  rasterWeight,
} from "./renderer/nodes/GaussianContextNodes";
