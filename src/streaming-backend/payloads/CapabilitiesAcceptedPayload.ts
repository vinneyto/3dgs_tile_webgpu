export interface CapabilitiesAcceptedPayload {
  type: "capabilities-accepted";
  protocolVersion: 2;
  /** Backend supports bounded, low-priority cache filling. */
  supportsCachePrefetch?: boolean;
}
