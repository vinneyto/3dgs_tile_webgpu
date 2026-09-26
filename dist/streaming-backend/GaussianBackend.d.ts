import type { BackendCommand } from "./commands/BackendCommand";
import type { BackendEvent } from "./events/BackendEvent";
export interface GaussianBackend {
    dispatch(command: BackendCommand): void;
    subscribe(listener: (event: BackendEvent) => void): () => void;
    dispose(): void;
}
