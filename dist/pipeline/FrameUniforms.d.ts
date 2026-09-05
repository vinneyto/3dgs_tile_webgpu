import { Matrix4, PerspectiveCamera, Vector4 } from "three/webgpu";
export declare class FrameUniforms {
    private readonly camera;
    readonly background: readonly [number, number, number, number];
    readonly tileSize: 8 | 16;
    readonly projection: import("three/webgpu").UniformNode<"mat4", Matrix4>;
    readonly view: import("three/webgpu").UniformNode<"mat4", Matrix4>;
    readonly viewport: import("three/webgpu").UniformNode<"vec4", Vector4>;
    readonly tilesX: import("three/webgpu").UniformNode<"uint", number>;
    readonly tilesY: import("three/webgpu").UniformNode<"uint", number>;
    constructor(camera: PerspectiveCamera, background: readonly [number, number, number, number], tileSize?: 8 | 16);
    update(width: number, height: number, tilesX: number, tilesY: number): void;
}
