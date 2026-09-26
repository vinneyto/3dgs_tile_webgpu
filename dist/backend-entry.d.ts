/** Node-safe entrypoint: protocol and computation, without browser transport or GPU renderer. */
export type { BackendConfig } from "./streaming-backend/BackendConfig";
export type { GaussianBackend } from "./streaming-backend/GaussianBackend";
export type { GaussianBackendFactory } from "./streaming-backend/GaussianBackendFactory";
export type { BackendCommand } from "./streaming-backend/commands/BackendCommand";
export type { BackendEvent } from "./streaming-backend/events/BackendEvent";
export type { CloudLoadOptions } from "./streaming-backend/CloudLoadOptions";
export type { AttributeInit, AttributeSource, BufferAttributeSource, FillAttributeSource, } from "./streaming-backend/AttributeInit";
export type { PackingStrategy, MaximumPackingStrategy, RadialPackingStrategy, TieredRadialPackingStrategy, DistanceAwareRadialPackingStrategy, } from "./streaming-backend/PackingStrategy";
export { StreamingGaussianBackend } from "./streaming-backend-impl/StreamingGaussianBackend";
export { DirectStreamingGaussianBackendFactory } from "./streaming-backend-impl/DirectStreamingGaussianBackendFactory";
