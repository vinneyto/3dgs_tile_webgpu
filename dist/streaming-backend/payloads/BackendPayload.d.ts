import type { CloudLoadedPayload } from "./CloudLoadedPayload";
import type { CloudUnloadedPayload } from "./CloudUnloadedPayload";
import type { CloudRaycastChangedPayload } from "./CloudRaycastChangedPayload";
import type { RaycastReplacedPayload } from "./RaycastReplacedPayload";
import type { BuffersPatchedPayload } from "./BuffersPatchedPayload";
import type { BuffersReplacedPayload } from "./BuffersReplacedPayload";
import type { CapabilitiesAcceptedPayload } from "./CapabilitiesAcceptedPayload";
export type BackendPayload = CapabilitiesAcceptedPayload | CloudLoadedPayload | CloudUnloadedPayload | CloudRaycastChangedPayload | RaycastReplacedPayload | BuffersPatchedPayload | BuffersReplacedPayload;
