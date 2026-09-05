import {
  Matrix4,
  type Camera,
  type Object3D,
  type PerspectiveCamera,
} from "three/webgpu";
import { GaussianMipmapLod } from "../GaussianMipmapLod";
import type { GaussianLodPacking } from "../GaussianLod";
import {
  selectMipmap,
  type MipmapSelection,
  type MipmapView,
} from "../mipmap/selectMipmap";
import {
  type GaussianLodPackingContext,
  type GaussianLodPackingStrategy,
  validateGaussianLodBudget,
} from "./GaussianLodPackingStrategy";

export interface ScreenSpaceLodPackingOptions {
  /** Maximum projected group diameter before refinement. Defaults to 4 physical pixels. */
  pixelSize?: number;
}

/** Async CPU hierarchy selection. GPU projection/sorting/rasterization stay unchanged. */
export class ScreenSpaceLodPackingStrategy implements GaussianLodPackingStrategy {
  readonly pixelSize: number;
  planningMs = 0;
  private roundTripMs = 0;
  private requestStarted = 0;
  get pending(): boolean {
    return this.busy || this.ready !== null;
  }
  get targetStats() {
    return {
      planningMs: this.planningMs,
      roundTripMs: this.roundTripMs,
      discardedResults: 0,
      pending: this.pending,
    };
  }
  private view: MipmapView | null = null;
  private requestedView = "";
  private worker: Worker | null = null;
  private lod: GaussianMipmapLod | null = null;
  private busy = false;
  private ready: MipmapSelection | null = null;
  private selection: MipmapSelection | null = null;
  private budget = -1;
  private requestBudget = -1;
  private width = 1;
  private height = 1;
  private disposed = false;
  private workerError: string | null = null;
  constructor(options: ScreenSpaceLodPackingOptions = {}) {
    this.pixelSize = options.pixelSize ?? 4;
    if (!Number.isFinite(this.pixelSize) || this.pixelSize <= 0)
      throw new RangeError("LOD pixelSize must be finite and positive");
  }
  setViewport(width: number, height: number): this {
    if (!(width > 0 && height > 0 && Number.isFinite(width + height)))
      throw new RangeError("LOD viewport must be positive and finite");
    this.width = width;
    this.height = height;
    return this;
  }
  setFromCamera(camera: Camera, localSpace: Object3D): this {
    camera.updateWorldMatrix(true, false);
    localSpace.updateWorldMatrix(true, false);
    this.view = {
      matrix: new Matrix4()
        .copy(camera.matrixWorld)
        .invert()
        .multiply(localSpace.matrixWorld)
        .toArray(),
      projection: camera.projectionMatrix.toArray(),
      width: this.width,
      height: this.height,
      pixelSize: this.pixelSize,
      perspective: (camera as PerspectiveCamera).isPerspectiveCamera === true,
    };
    return this;
  }
  /** Poll once per frame. A completed cut is committed atomically by Store.pack(). */
  update(): boolean {
    if (this.workerError)
      throw new Error(`Mipmap LOD worker: ${this.workerError}`);
    if (this.disposed || !this.lod || !this.view) return false;
    let changed = false;
    if (this.ready) {
      const next = this.ready;
      this.ready = null;
      if (next.gaussianCount <= this.budget) {
        changed = !sameCut(this.selection, next);
        this.selection = next;
      }
    }
    const key = JSON.stringify(this.view) + ":" + this.budget;
    if (!this.busy && key !== this.requestedView) {
      this.requestedView = key;
      this.requestBudget = this.budget;
      if (this.worker) {
        this.busy = true;
        this.requestStarted = performance.now();
        this.worker.postMessage({ view: this.view, budget: this.budget });
      } else {
        const started = performance.now();
        const next = selectMipmap(this.lod.tree, this.view, this.budget);
        this.planningMs = performance.now() - started;
        changed ||= !sameCut(this.selection, next);
        this.selection = next;
      }
    }
    return changed;
  }
  pack({ lod, maxGaussians }: GaussianLodPackingContext): GaussianLodPacking {
    validateGaussianLodBudget(maxGaussians);
    if (!(lod instanceof GaussianMipmapLod))
      throw new TypeError(
        "ScreenSpaceLodPackingStrategy requires GaussianMipmapLod",
      );
    if (this.lod && this.lod !== lod)
      throw new Error("Use one screen-space strategy per cloud");
    if (!this.lod) {
      this.lod = lod;
      if (typeof Worker !== "undefined") {
        this.worker = new Worker(
          new URL("../mipmap/SelectionWorker.ts", import.meta.url),
          { type: "module" },
        );
        const { left, right, counts, spheres } = lod.tree;
        this.worker.postMessage({ tree: { left, right, counts, spheres } });
        this.worker.onerror = (event) => {
          this.workerError = event.message;
          this.busy = false;
        };
        this.worker.onmessage = (event) => {
          this.busy = false;
          this.roundTripMs = performance.now() - this.requestStarted;
          if (event.data.error) {
            this.workerError = event.data.error;
            return;
          }
          this.planningMs = event.data.planningMs;
          if (this.requestBudget === this.budget)
            this.ready = event.data.selection;
        };
      }
    }
    if (this.budget !== maxGaussians) {
      this.budget = maxGaussians;
      this.requestedView = "";
      this.ready = null;
      // A budget reduction must never retain an oversized cut while waiting.
      if (this.selection && this.selection.gaussianCount > maxGaussians)
        this.selection = null;
    }
    if (!this.selection)
      this.selection = {
        nodeIds:
          maxGaussians >= lod.tree.counts[0]!
            ? Uint32Array.of(0)
            : new Uint32Array(),
        gaussianCount:
          maxGaussians >= lod.tree.counts[0]! ? lod.tree.counts[0]! : 0,
      };
    return {
      ...this.selection,
      lodLevels: new Uint8Array(this.selection.nodeIds.length),
    };
  }
  dispose(): void {
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }
}
function sameCut(a: MipmapSelection | null, b: MipmapSelection): boolean {
  return (
    a !== null &&
    a.nodeIds.length === b.nodeIds.length &&
    a.nodeIds.every((id, i) => id === b.nodeIds[i])
  );
}
