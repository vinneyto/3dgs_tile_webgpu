/** Structured-clone-only messages. No Three.js objects or executable strategies cross this boundary. */
export interface GaussianBackendLoadOptions {
    readonly octree?: {
        readonly leafCapacity?: number;
        readonly maxDepth?: number;
    };
    readonly lod?: {
        readonly levels?: readonly {
            readonly retention: number;
        }[];
    };
}
export type GaussianBackendRequest = {
    readonly type: "load-url";
    readonly requestId: number;
    readonly resourceId: string;
    readonly url: string;
    readonly options: GaussianBackendLoadOptions;
} | {
    readonly type: "load-buffer";
    readonly requestId: number;
    readonly resourceId: string;
    readonly buffer: ArrayBuffer;
    readonly options: GaussianBackendLoadOptions;
} | {
    readonly type: "select";
    readonly requestId: number;
    readonly resourceId: string;
    readonly revision: number;
    readonly maxGaussians: number;
    readonly center: readonly [number, number, number];
    readonly levelDistance?: number;
} | {
    readonly type: "release";
    readonly requestId: number;
    readonly resourceId: string;
};
/** Transferable CPU-side data for synchronous raycasts in the UI thread. */
export interface GaussianRaycastBuffers {
    readonly means: ArrayBuffer;
    readonly scalesOpacity: ArrayBuffer;
    readonly rotations: ArrayBuffer;
    /** Seven floats per node: raycast AABB min/max and maximum splat radius. */
    readonly nodeBounds: ArrayBuffer;
    /** Two u32 per node: offset and length into children. */
    readonly nodeChildren: ArrayBuffer;
    readonly children: ArrayBuffer;
    /** Two u32 per node: offset and length into indices. */
    readonly nodeIndices: ArrayBuffer;
    readonly indices: ArrayBuffer;
}
export interface GaussianBackendPackedBuffers {
    readonly means: ArrayBuffer;
    readonly scalesOpacity: ArrayBuffer;
    readonly rotations: ArrayBuffer;
    readonly shCoefficients: ArrayBuffer;
}
export type GaussianBackendResult = {
    readonly type: "loaded";
    readonly requestId: number;
    readonly resourceId: string;
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly bounds: readonly [
        number,
        number,
        number,
        number,
        number,
        number
    ];
    readonly raycast: GaussianRaycastBuffers;
} | {
    readonly type: "selected";
    readonly requestId: number;
    readonly resourceId: string;
    readonly revision: number;
    readonly count: number;
    readonly shDegree: 0 | 1 | 2 | 3;
    readonly buffers: GaussianBackendPackedBuffers;
    readonly renderedIndices: ArrayBuffer;
} | {
    readonly type: "released";
    readonly requestId: number;
    readonly resourceId: string;
} | {
    readonly type: "error";
    readonly requestId: number;
    readonly resourceId: string;
    readonly message: string;
};
/** A remote implementation can translate this transport without changing requests. */
export interface GaussianBackendTransport {
    postMessage(message: GaussianBackendRequest, transfer?: Transferable[]): void;
    addEventListener(type: "message", listener: (event: MessageEvent<GaussianBackendResult>) => void): void;
    removeEventListener(type: "message", listener: (event: MessageEvent<GaussianBackendResult>) => void): void;
    terminate?(): void;
}
