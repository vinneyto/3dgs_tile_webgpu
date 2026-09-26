import type { BackendConfig } from "../streaming-backend/BackendConfig";
import type { BackendCommand } from "../streaming-backend/commands/BackendCommand";
import type { BackendEvent } from "../streaming-backend/events/BackendEvent";

export type WorkerInbound =
  | { type: "initialize"; config: BackendConfig }
  | { type: "dispatch"; command: BackendCommand }
  | { type: "dispose" };

export type WorkerOutbound =
  | { type: "ready" }
  | { type: "event"; event: BackendEvent };

/** Transfer only protocol-owned buffers, never an engine's internal storage. */
export function transferBuffers(value: unknown): ArrayBuffer[] {
  const found = new Set<ArrayBuffer>();
  const seen = new Set<object>();
  const visit = (item: unknown): void => {
    if (item instanceof ArrayBuffer) { found.add(item); return; }
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
