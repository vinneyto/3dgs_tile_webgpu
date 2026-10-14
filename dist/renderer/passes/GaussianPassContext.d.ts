import type { WebGPURenderer, StorageBufferAttribute } from "three/webgpu";
import type { FrameUniforms } from "../pipeline/FrameUniforms";
import type { ObjectFrameState } from "../pipeline/ObjectFrameState";
import type { StorageBindings } from "../pipeline/StorageBindings";
import type { AntialiasMode, DepthSortMode, ResolvedRadixBackend } from "../pipeline/types";
/** Per-device resources supplied to logical passes by the render runtime. */
export interface GaussianPassContext {
    readonly renderer: WebGPURenderer;
    readonly bindings: StorageBindings;
    readonly frame: FrameUniforms;
    readonly objects: ObjectFrameState;
    readonly mode: DepthSortMode;
    readonly antialiasMode: AntialiasMode;
    readonly subpixelSampleCulling: boolean;
    readonly radixBackend: ResolvedRadixBackend;
    readonly capacity: number;
    readonly outputState?: StorageBufferAttribute;
}
