import type { MipmapSnapshot } from "../MipmapSnapshot";
export interface CloudLoadedPayload {
    type: "cloud-loaded";
    cloudId: string;
    objectId: number;
    sourceCount: number;
    shDegree: 0 | 1 | 2 | 3;
    bounds: readonly [number, number, number, number, number, number];
    sourceVersion: number;
    mipmapSnapshot?: MipmapSnapshot | null;
}
