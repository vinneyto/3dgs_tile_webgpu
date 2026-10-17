import { Camera, Matrix4, Vector3, type ComputeNode, type UniformNode, type StorageBufferAttribute, type WebGPURenderer } from "three/webgpu";
import type { GaussianCloud } from "../GaussianCloud";
import type { GaussianCloudMaterial } from "../GaussianCloudMaterial";
import type { GaussianData } from "../GaussianData";
import type { GaussianRenderStore } from "../GaussianRenderStore";
import { type GaussianProjectionNodeSlots } from "../nodes/GaussianContextNodes";
import { CloudSource } from "./CloudSource";
import { type FrameUniforms } from "./FrameUniforms";
import { StorageBindings } from "./StorageBindings";
/** Four vec4s: world mean/opacity, symmetric covariance (xx,xy,xz,yy),
 * (yz,zz,encodedSourceSlot,0), evaluated RGB. No per-splat cloud identifier.
 */
export declare const ACCUMULATED_VEC4S = 4;
interface CloudDispatch {
    readonly source: CloudSource;
    readonly matrixWorld: UniformNode<"mat4", Matrix4>;
    readonly cameraLocal: UniformNode<"vec3", Vector3>;
    readonly offset: UniformNode<"uint", number>;
    readonly count: UniformNode<"uint", number>;
    readonly degree: UniformNode<"uint", number>;
    readonly objectId: UniformNode<"uint", number>;
    material: GaussianCloudMaterial;
    materialVersion: number;
    compute: ComputeNode | null;
}
/** Pass-local accumulation; each cloud owns distinct local input buffers and uniforms. */
export declare class CloudAccumulationStage {
    private readonly camera;
    private readonly store;
    private data;
    private readonly frame;
    private nodes;
    private readonly bindings;
    attribute: StorageBufferAttribute;
    count: number;
    generation: number;
    readonly dispatches: Map<GaussianCloud, CloudDispatch>;
    private readonly attributes;
    private contentVersion;
    private activeVersion;
    private previousData;
    private previousClouds;
    private readonly inverse;
    private readonly cameraWorld;
    constructor(camera: Camera, store: GaussianRenderStore, data: GaussianData, frame: FrameUniforms, nodes: GaussianProjectionNodeSlots, bindings?: StorageBindings);
    updateData(data: GaussianData): void;
    rebuild(nodes: GaussianProjectionNodeSlots): void;
    prepare(): void;
    encode(renderer: WebGPURenderer): void;
    hasPendingMaterialChanges(): boolean;
    getComputeNodes(): ComputeNode[];
    private createCompute;
    dispose(): void;
}
export declare function isCloudVisible(cloud: GaussianCloud, camera: Camera): boolean;
export {};
