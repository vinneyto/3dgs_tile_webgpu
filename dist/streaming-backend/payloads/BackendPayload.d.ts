import type { CloudLoadedPayload } from "./CloudLoadedPayload";
import type { CloudUnloadedPayload } from "./CloudUnloadedPayload";
import type { MipmapSnapshotReplacedPayload } from "./MipmapSnapshotReplacedPayload";
import type { BuffersPatchedPayload } from "./BuffersPatchedPayload";
import type { BuffersReplacedPayload } from "./BuffersReplacedPayload";
import type { BuffersAllocatedPayload } from "./BuffersAllocatedPayload";
import type { CapabilitiesAcceptedPayload } from "./CapabilitiesAcceptedPayload";
export type BackendPayload = CapabilitiesAcceptedPayload | CloudLoadedPayload | CloudUnloadedPayload | MipmapSnapshotReplacedPayload | BuffersPatchedPayload | BuffersAllocatedPayload | BuffersReplacedPayload;
