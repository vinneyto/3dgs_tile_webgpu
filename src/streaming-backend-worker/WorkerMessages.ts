import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type {
  BackendResponse,
  BackendFailure,
} from "../streaming-backend/BackendResponse";

export interface WorkerInitialize {
  type: "initialize";
  config: BackendConfig;
}
export interface WorkerDispatch {
  type: "dispatch";
  command: BackendCommand;
}
export interface WorkerAbort {
  type: "abort";
  commandId: string;
}
export interface WorkerDispose {
  type: "dispose";
}
export type WorkerInbound =
  WorkerInitialize | WorkerDispatch | WorkerAbort | WorkerDispose;
export interface WorkerResponse {
  type: "response";
  response: BackendResponse;
}
export interface WorkerFailure {
  type: "failure";
  failure: BackendFailure;
}
export type WorkerOutbound = WorkerResponse | WorkerFailure;

/** Transfer only protocol-owned buffers, never an engine's internal storage. */
export function transferBuffers(value: unknown): ArrayBuffer[] {
  const found = new Set<ArrayBuffer>();
  const seen = new Set<object>();
  const visit = (item: unknown): void => {
    if (item instanceof ArrayBuffer) {
      found.add(item);
      return;
    }
    if (item === null || typeof item !== "object" || seen.has(item)) return;
    seen.add(item);
    if (Array.isArray(item)) {
      for (const member of item) visit(member);
    } else {
      for (const member of Object.values(item)) visit(member);
    }
  };
  visit(value);
  return [...found];
}
