import type { GaussianLod } from "../GaussianLod";
export interface RadialLodPlanData {
    readonly leafNodeIds: Uint32Array;
    /** XYZ center for every leaf, in cloud-local space. */
    readonly leafCenters: Float64Array;
    /** Leaf-major counts for every LOD level. */
    readonly levelCounts: Uint32Array;
    readonly levelCount: number;
    readonly halfDiagonal: number;
}
export interface RadialLodPlanCenterRequest {
    readonly centerX: number;
    readonly centerY: number;
    readonly centerZ: number;
    readonly maxGaussians: number;
}
export interface DistanceAwareLodPlanRequest extends RadialLodPlanCenterRequest {
    readonly strategy: "distance";
    readonly levelDistance: number;
}
export interface TieredRadialLodPlanRequest extends RadialLodPlanCenterRequest {
    readonly strategy: "tiered";
    readonly budgetShares: readonly [number, number, number];
}
export type RadialLodPlanRequest = DistanceAwareLodPlanRequest | TieredRadialLodPlanRequest;
export interface RadialLodPlanResult {
    readonly length: number;
    readonly gaussianCount: number;
}
export interface RadialLodPlanWorkspace {
    readonly radii: Float64Array;
    readonly levels: Uint8Array;
    readonly order: number[];
}
export declare function createRadialLodPlanWorkspace(leafCount: number): RadialLodPlanWorkspace;
export declare function createRadialLodPlanData(lod: GaussianLod): RadialLodPlanData;
/**
 * Pure typed-array implementation shared by the main-thread strategy tests and
 * the module worker. Output arrays must have room for every leaf.
 */
export declare function planDistanceAwareLod(data: RadialLodPlanData, request: DistanceAwareLodPlanRequest, outputNodeIds: Uint32Array, outputLodLevels: Uint8Array, workspace: RadialLodPlanWorkspace): RadialLodPlanResult;
/** Typed-array implementation of TieredRadialLodPackingStrategy for workers. */
export declare function planTieredRadialLod(data: RadialLodPlanData, request: TieredRadialLodPlanRequest, outputNodeIds: Uint32Array, outputLodLevels: Uint8Array, workspace: RadialLodPlanWorkspace): RadialLodPlanResult;
export declare function planRadialLod(data: RadialLodPlanData, request: RadialLodPlanRequest, outputNodeIds: Uint32Array, outputLodLevels: Uint8Array, workspace: RadialLodPlanWorkspace): RadialLodPlanResult;
