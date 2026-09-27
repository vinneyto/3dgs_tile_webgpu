import type { BackendCommand } from "./commands/BackendCommand";
import type { BackendResponse, BackendFailure } from "./BackendResponse";

export interface GaussianBackend {
  dispatch(command: BackendCommand): void;
  /** Interrupt an active load; this control signal does not occupy the request queue. */
  abort(commandId: string): void;
  subscribe(listener: (response: BackendResponse) => void): () => void;
  onFailure(listener: (failure: BackendFailure) => void): () => void;
  dispose(): void;
}
