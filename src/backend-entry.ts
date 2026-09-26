/** Node-safe entrypoint: protocol and computation, without browser transport or GPU renderer. */
export type { BackendConfig } from "./streaming-backend/BackendConfig";
export type { GaussianBackend } from "./streaming-backend/GaussianBackend";
export type { FrontendCapabilities } from "./streaming-backend/FrontendCapabilities";
export type { BackendCommand } from "./streaming-backend/commands/BackendCommand";
export type { Command } from "./streaming-backend/commands/Command";
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
