import type { BackendCommand } from "./commands/BackendCommand";
import type { BackendPayload } from "./payloads/BackendPayload";
export type { BackendPayload } from "./payloads/BackendPayload";
export interface BackendResponse {
    /** A small reference: never echo buffers from the original command. */
    command: Pick<BackendCommand, "id" | "type">;
    /** Elapsed backend time since this command started, including this response. */
    durationMs: number;
    isFinal: boolean;
    payload?: BackendPayload;
    error?: {
        code: string;
        message: string;
        cloudId?: string;
    };
}
export interface BackendFailure {
    code: string;
    message: string;
}
