export interface CapabilitiesAcceptedPayload {
  type: "capabilities-accepted";
  protocolVersion: 2;
  /** Backend supports bounded, low-priority cache filling. */
  supportsCachePrefetch?: boolean;
  /** Separate revision-checked delayed LOD selection. */
  supportsLodRecheck?: boolean;
}
