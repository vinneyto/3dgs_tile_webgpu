/** Limits and upload behavior of the frontend that consumes packed buffers. */
export interface FrontendCapabilities {
    maxStorageBufferBindingSize: number;
    maxBufferSize: number;
    maxStorageBuffersPerShaderStage: number;
    supportsPartialBufferUpdates: boolean;
    /** Decode fp16 log scales/opacity and Spark oct101012 rotations on the GPU. */
    supportsCompactGaussians?: boolean;
}
