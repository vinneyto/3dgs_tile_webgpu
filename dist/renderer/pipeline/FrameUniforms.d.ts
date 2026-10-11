import { Camera, Matrix4, Vector4 } from "three/webgpu";
import type { GaussianRenderDomain } from "./types";
export declare class FrameUniforms {
    private readonly camera;
    readonly background: readonly [number, number, number, number];
    private readonly domain;
    readonly projection: import("three/webgpu").UniformNode<"mat4", Matrix4>;
    readonly view: import("three/webgpu").UniformNode<"mat4", Matrix4>;
    readonly viewport: import("three/webgpu").UniformNode<"vec4", Vector4>;
    readonly filterVariance: import("three/webgpu").UniformNode<"float", number>;
    readonly invalidDepthValue: import("three/webgpu").UniformNode<"float", number>;
    readonly boundaryAxis: import("three/webgpu").UniformNode<"uint", number>;
    readonly activeCount: import("three/webgpu").UniformNode<"uint", number>;
    readonly tilesX: import("three/webgpu").UniformNode<"uint", number>;
    readonly tilesY: import("three/webgpu").UniformNode<"uint", number>;
    readonly tileCount: import("three/webgpu").UniformNode<"uint", number>;
    constructor(camera: Camera, background: readonly [number, number, number, number], domain?: GaussianRenderDomain);
    update(width: number, height: number, tilesX: number, tilesY: number): void;
}
export declare function cameraDepthRange(camera: Camera): readonly [number, number];
export declare function passContextOverrides(frame: FrameUniforms): Map<any, () => any>;
