import type { BackendConfig, BackendCommand, BackendEvent, GaussianBackend, GaussianBackendFactory } from "3dgs-tile-webgpu/backend";

export interface NodeStreamingTransportOptions {
  host?: string;
  port: number;
  maxFrameBytes?: number;
}
export interface NodeStreamingServerOptions {
  host?: string;
  port?: number;
  maxFrameBytes?: number;
}
export interface NodeStreamingServer {
  address(): { address: string; family: string; port: number } | string | null;
  close(): Promise<void>;
}
export function createNodeStreamingServer(options?: NodeStreamingServerOptions): Promise<NodeStreamingServer>;
export class NodeStreamingGaussianBackend implements GaussianBackend {
  constructor(config: BackendConfig, options: NodeStreamingTransportOptions);
  readonly ready: Promise<void>;
  dispatch(command: BackendCommand): void;
  subscribe(listener: (event: BackendEvent) => void): () => void;
  dispose(): void;
}
export class NodeStreamingGaussianBackendFactory implements GaussianBackendFactory {
  constructor(options: NodeStreamingTransportOptions);
  createBackend(config: BackendConfig): GaussianBackend;
}
