import type { ComputeNode, WebGPURenderer } from "three/webgpu";
import type { GaussianData } from "../GaussianData";
import type { GaussianRenderStore } from "../GaussianRenderStore";
import type { StorageBindings } from "../pipeline/StorageBindings";
import { GaussianPassOutput } from "./GaussianPassOutput";

/** A buffer-producing pass. It need not draw or use the camera. */
export interface GaussianDataPassRuntime {
  /** Current buffers; source slot IDs/object IDs and active draw cut must be preserved. */
  getData(): GaussianData;
  /** Called before consumers rebind a new store layout. */
  updateData(source: GaussianData): void;
  encode(renderer: WebGPURenderer): void;
  getComputeNodes(): ComputeNode[];
  dispose(): void;
}
export interface GaussianDataPassContext {
  readonly source: GaussianData;
  readonly renderer: WebGPURenderer;
  readonly bindings: StorageBindings;
}
export type GaussianDataPassFactory = (
  context: GaussianDataPassContext,
) => GaussianDataPassRuntime;

/** Default is zero-copy. Supply a runtime factory to materialize deformed buffers on the GPU. */
export class GaussianDataPass {
  readonly output = new GaussianPassOutput<GaussianData>(
    this,
    "data.gaussians",
  );
  readonly inputs: Readonly<
    | { store: GaussianRenderStore }
    | { gaussians: GaussianPassOutput<GaussianData> }
  >;
  /** The store remains the owner of source loading/LOD; prepared buffers are downstream. */
  get sourceStore(): GaussianRenderStore {
    return "store" in this.inputs
      ? this.inputs.store
      : (this.inputs.gaussians.producer as GaussianDataPass).sourceStore;
  }
  get upstream(): GaussianDataPass | null {
    return "gaussians" in this.inputs
      ? (this.inputs.gaussians.producer as GaussianDataPass)
      : null;
  }
  private readonly nodeListeners = new Set<() => void>();
  private readonly listeners = new Set<() => void>();
  constructor(
    input: GaussianRenderStore | GaussianPassOutput<GaussianData>,
    private readonly factory?: GaussianDataPassFactory,
  ) {
    if (input instanceof GaussianPassOutput) {
      if (
        !(input.producer instanceof GaussianDataPass) ||
        input !== input.producer.output
      )
        throw new TypeError(
          "A Gaussian data pass must consume a Gaussian data producer output",
        );
      this.inputs = Object.freeze({ gaussians: input });
    } else this.inputs = Object.freeze({ store: input });
  }
  /** Uniform/animation changes require a new frame, not a new shader graph. */
  invalidate(): void {
    for (const listener of this.listeners) listener();
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  protected invalidateNodes(): void {
    for (const listener of this.nodeListeners) listener();
    this.invalidate();
  }
  subscribeNodes(listener: () => void): () => void {
    this.nodeListeners.add(listener);
    return () => {
      this.nodeListeners.delete(listener);
    };
  }
  createRuntime(context: GaussianDataPassContext): GaussianDataPassRuntime {
    const upstream = this.upstream?.createRuntime(context);
    let source = upstream?.getData() ?? context.source;
    let runtime: GaussianDataPassRuntime;
    try {
      runtime = this.factory?.({ ...context, source }) ?? {
        getData: () => source,
        updateData: (next: GaussianData) => {
          source = next;
        },
        encode: () => {},
        getComputeNodes: () => [],
        dispose: () => {},
      };
    } catch (error) {
      upstream?.dispose();
      this.upstream?.output.bind(null);
      throw error;
    }
    let disposed = false;
    const result: GaussianDataPassRuntime = {
      getData: () => {
        upstream?.getData();
        return runtime.getData();
      },
      updateData: (next) => {
        upstream?.updateData(next);
        runtime.updateData(upstream?.getData() ?? next);
      },
      encode: (renderer) => {
        upstream?.encode(renderer);
        runtime.encode(renderer);
      },
      getComputeNodes: () => [
        ...(upstream?.getComputeNodes() ?? []),
        ...runtime.getComputeNodes(),
      ],
      dispose: () => {
        if (disposed) return;
        disposed = true;
        try {
          runtime.dispose();
        } finally {
          upstream?.dispose();
          this.output.bind(null);
        }
      },
    };
    this.output.bind(() => result.getData());
    return result;
  }
}
