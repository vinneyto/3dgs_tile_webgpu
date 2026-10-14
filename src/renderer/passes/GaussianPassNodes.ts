import type { Node } from "three/webgpu";

/** Node assignment versions the owning logical pass, without rebuilding other passes. */
export class GaussianPassNodes<T extends object> {
  readonly nodes: T;
  private readonly listeners = new Set<() => void>();
  constructor(defaults: T) {
    this.nodes = new Proxy(
      { ...defaults },
      {
        set: (target, key, value: Node) => {
          if (!(key in target))
            throw new TypeError(`Unknown Gaussian node slot: ${String(key)}`);
          if (!value || !(value as Node).isNode)
            throw new TypeError(`${String(key)} must be a Three.js Node`);
          if (Reflect.get(target, key) === value) return true;
          Reflect.set(target, key, value);
          this.invalidate();
          return true;
        },
        deleteProperty: () => {
          throw new TypeError("Gaussian node slots cannot be deleted");
        },
        defineProperty: () => {
          throw new TypeError("Assign Gaussian node slots directly");
        },
      },
    );
  }
  invalidate(): void {
    for (const listener of this.listeners) listener();
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
