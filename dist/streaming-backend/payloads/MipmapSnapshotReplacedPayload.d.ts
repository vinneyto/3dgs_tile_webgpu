import type { MipmapSnapshot } from "../MipmapSnapshot";
export interface MipmapSnapshotReplacedPayload {
    type: "mipmap-snapshot-replaced";
    cloudId: string;
    sourceVersion: number;
    snapshotVersion: number;
    bounds: readonly [number, number, number, number, number, number];
    /** Null explicitly clears any previously exported snapshot. */
    snapshot: MipmapSnapshot | null;
}
