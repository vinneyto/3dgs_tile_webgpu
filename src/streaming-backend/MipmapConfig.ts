export interface MipmapSnapshotConfig {
  /** Maximum leaves in a camera-independent, complete cut of the hierarchy. */
  maxLeaves: number;
}
export interface StandardMipmapConfig {
  type: "standard";
  /** Omit to keep the hierarchy entirely inside the backend. */
  snapshot?: MipmapSnapshotConfig;
}
export interface NoMipmapConfig {
  type: "none";
}
export type MipmapConfig = StandardMipmapConfig | NoMipmapConfig;
