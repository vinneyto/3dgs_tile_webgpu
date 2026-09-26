import type { AttributeInit } from "./AttributeInit";
import type { PackingStrategy } from "./PackingStrategy";
export interface CloudLoadOptions {
    name?: string;
    priority?: number;
    packingStrategy?: PackingStrategy;
    attributes?: readonly AttributeInit[];
    /** Defaults to true. The client receives a full source octree when enabled. */
    raycastable?: boolean;
    octree?: {
        leafCapacity?: number;
        maxDepth?: number;
    };
    lod?: {
        levels?: readonly {
            retention: number;
        }[];
    };
}
