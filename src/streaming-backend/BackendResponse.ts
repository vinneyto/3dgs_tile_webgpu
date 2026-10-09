import type { BackendCommand } from "./commands/BackendCommand";
import type { BackendPayload } from "./payloads/BackendPayload";

export type { BackendPayload } from "./payloads/BackendPayload";

/** Per-command CPU timings. Upload wait is transport backpressure, not GPU time. */
export interface BackendMetrics {
  computeMs: number;
  selectionMs: number;
  slotMappingMs: number;
  packingMs: number;
  streamCopyMs: number;
  uploadWaitMs: number;
  uploadedBytes: number;
  uploadBatches: number;
  residentGaussians: number;
  activeGaussians: number;
  pinnedGaussians: number;
  cacheHits: number;
  cacheMisses: number;
  evictedGaussians: number;
  /** More tree nodes can be loaded into currently unused slots. */
  prefetchPending?: boolean;
}

export interface BackendResponse {
  /** A small reference: never echo buffers from the original command. */
  command: Pick<BackendCommand, "id" | "type">;
  /** Elapsed backend time since this command started, including this response. */
  durationMs: number;
  metrics?: BackendMetrics;
  isFinal: boolean;
  payload?: BackendPayload;
  error?: { code: string; message: string; cloudId?: string };
}

export interface BackendFailure {
  code: string;
  message: string;
}
