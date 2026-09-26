/** Limits and upload behavior of the frontend that consumes packed buffers. */
export interface FrontendCapabilities {
    maxStorageBufferBindingSize: number;
    maxBufferSize: number;
    maxStorageBuffersPerShaderStage: number;
    supportsPartialBufferUpdates: boolean;
}
